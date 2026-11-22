import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { assertAudienceContactCryptoConfigured, decryptAudiencePhone } from "@/lib/audience-contacts/crypto";
import { sendMetaTemplateMessage, type MetaTemplateComponent } from "@/lib/whatsapp/meta-cloud-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorized(request: Request) {
  const secret = process.env.DELIVERY_WORKER_SECRET || "";
  const supplied = request.headers.get("authorization") || "";
  const expected = "Bearer " + secret;
  if (!secret) return false;
  const a = Buffer.from(supplied);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

function validComponents(value: unknown): value is MetaTemplateComponent[] {
  if (!Array.isArray(value) || value.length > 10) return false;
  return value.every((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return false;
    const component = item as Record<string, unknown>;
    if (!["body", "header", "button"].includes(String(component.type))) return false;
    if (!Array.isArray(component.parameters) || component.parameters.length > 20) return false;
    return component.parameters.every((parameter) => {
      if (!parameter || typeof parameter !== "object" || Array.isArray(parameter)) return false;
      const p = parameter as Record<string, unknown>;
      if (p.type === "text") return typeof p.text === "string" && p.text.length <= 1024;
      if (p.type === "currency") {
        const c = p.currency as Record<string, unknown> | undefined;
        return !!c && typeof c.fallback_value === "string" && c.fallback_value.length <= 128 &&
          typeof c.code === "string" && /^[A-Z]{3}$/.test(c.code) &&
          Number.isInteger(c.amount_1000) && Number(c.amount_1000) >= 0;
      }
      if (p.type === "date_time") {
        const d = p.date_time as Record<string, unknown> | undefined;
        return !!d && typeof d.fallback_value === "string" && d.fallback_value.length <= 128;
      }
      return false;
    });
  });
}

/**
 * Processes at most one WhatsApp recipient. Invoke from a trusted scheduler
 * with DELIVERY_WORKER_SECRET. Never returns or logs a recipient phone number.
 */
export async function POST(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Worker authentication failed." }, { status: 401 });
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "Database is not configured." }, { status: 503 });

  let sql: ReturnType<typeof neon>;
  try {
    assertAudienceContactCryptoConfigured();
    sql = neon(process.env.DATABASE_URL);
  } catch {
    return NextResponse.json({ error: "Worker encryption or database configuration is incomplete." }, { status: 503 });
  }

  try {
    const claimed = await sql`
      WITH candidate AS (
        SELECT d.id
        FROM campaign_deliveries d
        JOIN campaigns c ON c.id = d.campaign_id
        JOIN audience_lists l ON l.id = d.audience_list_id
        JOIN channel_integrations ci ON ci.id = d.integration_id
        JOIN audience_contacts ac ON ac.id = d.audience_contact_id
          AND ac.audience_list_id = d.audience_list_id
          AND ac.owner_id = l.owner_id
        WHERE d.channel = 'whatsapp'
          AND c.status IN ('funded','running')
          AND c.audience_list_id = d.audience_list_id
          AND l.status = 'approved'
          AND ci.channel = 'whatsapp'
          AND ci.provider = 'meta_whatsapp_cloud'
          AND ci.status = 'active'
          AND ac.consent_status = 'opted_in'
          AND ac.opted_out_at IS NULL
          AND ac.phone_ciphertext <> ''
          AND c.meta_template_name IS NOT NULL
          AND c.meta_template_language IS NOT NULL
          AND NOT EXISTS (
            SELECT 1 FROM audience_contact_suppressions s
            WHERE s.owner_id = ac.owner_id AND s.phone_hash = ac.phone_hash
          )
          AND (d.next_attempt_at IS NULL OR d.next_attempt_at <= now())
          AND (d.scheduled_at IS NULL OR d.scheduled_at <= now())
          AND (
            d.status IN ('queued','failed')
            OR (d.status = 'processing' AND d.lease_expires_at < now()
              AND EXISTS (
                SELECT 1 FROM delivery_attempts old
                WHERE old.delivery_id = d.id AND old.status = 'started'
                  AND old.attempt_number = (SELECT MAX(x.attempt_number) FROM delivery_attempts x WHERE x.delivery_id = d.id)
              ))
          )
        ORDER BY COALESCE(d.scheduled_at, d.created_at), d.created_at
        LIMIT 1
        FOR UPDATE OF d SKIP LOCKED
      ),
      locked AS (
        UPDATE campaign_deliveries d
        SET status = 'processing', started_at = COALESCE(d.started_at, now()),
            lease_expires_at = now() + interval '5 minutes',
            updated_at = now(), last_error_code = NULL, last_error_message = NULL
        FROM candidate x WHERE d.id = x.id
        RETURNING d.id, d.campaign_id, d.audience_contact_id, d.integration_id,
          d.idempotency_key, d.lease_expires_at
      ),
      attempt AS (
        INSERT INTO delivery_attempts(delivery_id, attempt_number, status, request_fingerprint, response_metadata)
        SELECT d.id, (SELECT COUNT(*)::int + 1 FROM delivery_attempts a WHERE a.delivery_id = d.id),
          'started', md5(d.id::text || d.lease_expires_at::text),
          jsonb_build_object('claimed_at', now(), 'worker', 'meta_whatsapp_cloud')
        FROM locked d
        RETURNING id, delivery_id, attempt_number
      )
      SELECT d.id AS delivery_id, d.campaign_id, d.audience_contact_id, d.idempotency_key,
        d.lease_expires_at, a.id AS attempt_id, a.attempt_number,
        ac.phone_ciphertext, ac.encryption_key_version,
        c.meta_template_name, c.meta_template_language, c.meta_template_components
      FROM locked d
      JOIN attempt a ON a.delivery_id = d.id
      JOIN audience_contacts ac ON ac.id = d.audience_contact_id
      JOIN campaigns c ON c.id = d.campaign_id
    `;

    if (!claimed.length) {
      return NextResponse.json({ processed: false, reason: "No eligible, consented WhatsApp delivery is ready." });
    }

    const job = claimed[0];
    let recipient: string;
    try {
      recipient = decryptAudiencePhone(String(job.phone_ciphertext), Number(job.encryption_key_version));
    } catch {
      await sql`
        UPDATE delivery_attempts SET status = 'failed', error_code = 'CONTACT_DECRYPTION_FAILED'
        WHERE id = ${job.attempt_id} AND status = 'started'
      `;
      await sql`
        UPDATE campaign_deliveries SET status = 'failed', lease_expires_at = NULL,
          next_attempt_at = NULL, last_error_code = 'CONTACT_DECRYPTION_FAILED',
          last_error_message = 'Recipient record could not be decrypted.', updated_at = now()
        WHERE id = ${job.delivery_id} AND status = 'processing'
      `;
      return NextResponse.json({ processed: true, outcome: "failed", error_code: "CONTACT_DECRYPTION_FAILED" });
    }

    if (!validComponents(job.meta_template_components)) {
      await sql`
        UPDATE delivery_attempts SET status = 'failed', error_code = 'INVALID_TEMPLATE_COMPONENTS'
        WHERE id = ${job.attempt_id} AND status = 'started'
      `;
      await sql`
        UPDATE campaign_deliveries SET status = 'failed', lease_expires_at = NULL,
          next_attempt_at = NULL, last_error_code = 'INVALID_TEMPLATE_COMPONENTS',
          last_error_message = 'Campaign template configuration is invalid.', updated_at = now()
        WHERE id = ${job.delivery_id} AND status = 'processing'
      `;
      return NextResponse.json({ processed: true, outcome: "failed", error_code: "INVALID_TEMPLATE_COMPONENTS" });
    }

    let result;
    try {
      result = await sendMetaTemplateMessage({
        recipient,
        templateName: String(job.meta_template_name),
        languageCode: String(job.meta_template_language),
        components: job.meta_template_components,
      });
    } catch {
      // A timeout or network exception may happen after Meta accepted the send.
      // Keep the lease and mark unknown; never blindly retry an ambiguous send.
      await sql`
        UPDATE delivery_attempts SET status = 'unknown', error_code = 'META_OUTCOME_UNKNOWN',
          response_metadata = jsonb_build_object('outcome', 'unknown')
        WHERE id = ${job.attempt_id} AND status = 'started'
      `;
      await sql`
        UPDATE campaign_deliveries SET last_error_code = 'META_OUTCOME_UNKNOWN',
          last_error_message = 'Provider outcome is ambiguous; reconciliation is required.',
          updated_at = now()
        WHERE id = ${job.delivery_id} AND status = 'processing'
      `;
      return NextResponse.json({ processed: true, outcome: "unknown", reconciliation_required: true });
    }

    if (result.ok) {
      await sql`
        UPDATE delivery_attempts SET status = 'accepted', provider_reference = ${result.messageId},
          response_metadata = jsonb_build_object('provider_status', 'accepted')
        WHERE id = ${job.attempt_id} AND status = 'started'
      `;
      await sql`
        UPDATE campaign_deliveries SET status = 'submitted', lease_expires_at = NULL,
          updated_at = now()
        WHERE id = ${job.delivery_id} AND status = 'processing'
      `;
      return NextResponse.json({ processed: true, outcome: "accepted", delivery_id: job.delivery_id,
        note: "Meta accepted the template submission; this is not proof of delivery." });
    }

    const delayMinutes = result.retryable ? Math.min(60, 5 * (2 ** Math.min(Number(job.attempt_number) - 1, 4))) : null;
    await sql`
      UPDATE delivery_attempts SET status = 'failed', error_code = ${result.errorCode},
        response_metadata = jsonb_build_object('http_status', ${result.httpStatus ?? null}, 'retryable', ${result.retryable})
      WHERE id = ${job.attempt_id} AND status = 'started'
    `;
    await sql`
      UPDATE campaign_deliveries SET status = 'failed', lease_expires_at = NULL,
        next_attempt_at = ${delayMinutes === null ? null : new Date(Date.now() + delayMinutes * 60_000).toISOString()}::timestamptz,
        last_error_code = ${result.errorCode},
        last_error_message = 'Meta rejected the template submission.',
        updated_at = now()
      WHERE id = ${job.delivery_id} AND status = 'processing'
    `;
    return NextResponse.json({ processed: true, outcome: "failed", error_code: result.errorCode,
      retry_scheduled: delayMinutes !== null });
  } catch (error) {
    console.error("Meta delivery worker failed", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "Delivery processing failed safely. Check worker logs and delivery state." }, { status: 503 });
  }
}

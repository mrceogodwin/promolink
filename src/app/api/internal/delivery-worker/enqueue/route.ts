import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

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

/**
 * Materializes recipient-level jobs for one funded WhatsApp campaign.
 * Safe to call repeatedly: deterministic idempotency keys and the unique
 * campaign/contact/channel index prevent duplicate jobs.
 */
export async function POST(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Worker authentication failed." }, { status: 401 });
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "Database is not configured." }, { status: 503 });

  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "A JSON object containing campaign_id is required." }, { status: 400 });
  }
  const campaignId = typeof (body as Record<string, unknown>).campaign_id === "string"
    ? String((body as Record<string, unknown>).campaign_id) : "";
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(campaignId)) {
    return NextResponse.json({ error: "A valid campaign_id UUID is required." }, { status: 400 });
  }

  try {
    const sql = neon(process.env.DATABASE_URL);
    const result = await sql`
      WITH eligible_campaign AS (
        SELECT c.id, c.audience_list_id, a.owner_id, ci.id AS integration_id
        FROM campaigns c
        JOIN audience_lists a ON a.id = c.audience_list_id
        JOIN channel_integrations ci
          ON ci.channel = 'whatsapp'
          AND ci.provider = 'meta_whatsapp_cloud'
          AND ci.status = 'active'
        WHERE c.id = ${campaignId}::uuid
          AND c.status IN ('funded','running')
          AND a.status = 'approved'
          AND a.channel = 'whatsapp'
          AND c.meta_template_name IS NOT NULL
          AND c.meta_template_language IS NOT NULL
        LIMIT 1
      ),
      inserted AS (
        INSERT INTO campaign_deliveries
          (campaign_id, audience_list_id, audience_contact_id, channel,
           integration_id, status, idempotency_key, created_by)
        SELECT c.id, c.audience_list_id, ac.id, 'whatsapp',
          c.integration_id, 'queued',
          'wa:' || c.id::text || ':' || ac.id::text,
          c.owner_id
        FROM eligible_campaign c
        JOIN audience_contacts ac
          ON ac.audience_list_id = c.audience_list_id
          AND ac.owner_id = c.owner_id
          AND ac.consent_status = 'opted_in'
          AND ac.opted_out_at IS NULL
          AND ac.phone_ciphertext <> ''
        WHERE NOT EXISTS (
          SELECT 1 FROM audience_contact_suppressions s
          WHERE s.owner_id = ac.owner_id AND s.phone_hash = ac.phone_hash
        )
        ON CONFLICT DO NOTHING
        RETURNING id
      )
      SELECT
        (SELECT COUNT(*)::int FROM inserted) AS jobs_created,
        (SELECT COUNT(*)::int FROM eligible_campaign) AS campaign_eligible
    `;

    const row = result[0];
    if (!row || Number(row.campaign_eligible) === 0) {
      return NextResponse.json({
        enqueued: false,
        jobs_created: 0,
        reason: "Campaign is not funded, not an approved WhatsApp audience, lacks an active Meta integration, or has no approved template configured."
      }, { status: 409 });
    }
    return NextResponse.json({ enqueued: true, jobs_created: Number(row.jobs_created),
      note: "Only consented, non-suppressed recipients were queued. No messages were sent by this endpoint." });
  } catch (error) {
    console.error("WhatsApp delivery enqueue failed", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "Could not enqueue campaign deliveries. Confirm migration 015 is applied." }, { status: 503 });
  }
}

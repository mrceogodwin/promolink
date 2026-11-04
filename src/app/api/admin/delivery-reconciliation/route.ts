import { sameOriginError } from "@/lib/request-security";
import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { getSessionUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function adminUser() {
  const user = await getSessionUser();
  if (!user) return { user: null, response: NextResponse.json({ error: "Sign in required." }, { status: 401 }) };
  if (user.role !== "admin") return { user: null, response: NextResponse.json({ error: "Administrator access required." }, { status: 403 }) };
  if (!process.env.DATABASE_URL) return { user: null, response: NextResponse.json({ error: "Database is not configured." }, { status: 503 }) };
  return { user, response: null };
}

// Unknown outcomes are deliberately excluded from automatic retries. This
// queue lets an administrator reconcile them against the provider directly.
export async function GET() {
  try {
    const auth = await adminUser();
    if (auth.response) return auth.response;
    const sql = neon(process.env.DATABASE_URL!);
    const items = await sql`
      SELECT d.id AS delivery_id, d.campaign_id, d.channel, d.status AS delivery_status,
        d.lease_expires_at, d.updated_at, ci.provider, ci.display_name AS provider_name,
        a.id AS attempt_id, a.attempt_number, a.provider_reference,
        a.error_code, a.created_at AS attempt_created_at
      FROM campaign_deliveries d
      JOIN LATERAL (
        SELECT da.id, da.attempt_number, da.provider_reference, da.error_code, da.created_at, da.status
        FROM delivery_attempts da
        WHERE da.delivery_id = d.id
        ORDER BY da.attempt_number DESC
        LIMIT 1
      ) a ON a.status = 'unknown'
      LEFT JOIN channel_integrations ci ON ci.id = d.integration_id
      WHERE d.status = 'processing'
      ORDER BY d.updated_at ASC
      LIMIT 100
    `;
    return NextResponse.json({ items });
  } catch (error) {
    console.error("Delivery reconciliation queue failed", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "Could not load delivery reconciliation queue." }, { status: 503 });
  }
}

export async function PATCH(request: Request) {
  const originError = sameOriginError(request);
  if (originError) return originError;
  try {
    const auth = await adminUser();
    if (auth.response) return auth.response;
    const user = auth.user!;
    const body = await request.json().catch(() => null) as {
      delivery_id?: unknown; attempt_id?: unknown; decision?: unknown;
      provider_checked?: unknown; note?: unknown;
    } | null;
    const deliveryId = typeof body?.delivery_id === "string" ? body.delivery_id : "";
    const attemptId = typeof body?.attempt_id === "string" ? body.attempt_id : "";
    const note = typeof body?.note === "string" ? body.note.trim() : "";
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(deliveryId) ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(attemptId)) {
      return NextResponse.json({ error: "Valid delivery and attempt IDs are required." }, { status: 400 });
    }
    if (body?.decision !== "confirm_not_submitted_retry" || body.provider_checked !== true || note.length < 12 || note.length > 500) {
      return NextResponse.json({ error: "Confirm provider records were checked, choose the retry decision, and provide a 12–500 character reconciliation note." }, { status: 400 });
    }

    const sql = neon(process.env.DATABASE_URL!);
    const updated = await sql`
      WITH target AS (
        SELECT d.id AS delivery_id, a.id AS attempt_id
        FROM campaign_deliveries d
        JOIN delivery_attempts a ON a.delivery_id = d.id
        WHERE d.id = ${deliveryId}::uuid
          AND a.id = ${attemptId}::uuid
          AND d.status = 'processing'
          AND d.lease_expires_at IS NOT NULL
          AND d.lease_expires_at <= now()
          AND a.status = 'unknown'
          AND a.provider_reference IS NULL
          AND a.attempt_number = (
            SELECT MAX(latest.attempt_number)
            FROM delivery_attempts latest
            WHERE latest.delivery_id = d.id
          )
        FOR UPDATE OF d, a
      ),
      attempt_changed AS (
        UPDATE delivery_attempts a
        SET status = 'failed',
            error_code = 'ADMIN_CONFIRMED_NOT_SUBMITTED',
            response_metadata = a.response_metadata || jsonb_build_object(
              'reconciled_by_admin', true, 'reconciled_at', now()
            )
        FROM target t
        WHERE a.id = t.attempt_id
        RETURNING a.id, a.delivery_id
      ),
      delivery_changed AS (
        UPDATE campaign_deliveries d
        SET status = 'failed',
            lease_expires_at = NULL,
            next_attempt_at = now(),
            last_error_code = 'ADMIN_CONFIRMED_NOT_SUBMITTED',
            last_error_message = 'Administrator checked provider records and confirmed no submission.',
            updated_at = now()
        FROM attempt_changed a
        WHERE d.id = a.delivery_id
        RETURNING d.id, d.status, d.next_attempt_at
      ),
      logged AS (
        INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
        SELECT ${user.id}, 'delivery_unknown_reconciled_for_retry', 'campaign_delivery', d.id,
          jsonb_build_object('attempt_id', ${attemptId}::uuid, 'provider_checked', true, 'note', ${note})
        FROM delivery_changed d
        RETURNING entity_id
      )
      SELECT d.id AS delivery_id, d.status, d.next_attempt_at
      FROM delivery_changed d JOIN logged l ON l.entity_id = d.id
    `;
    if (!updated.length) return NextResponse.json({ error: "This unknown attempt is no longer current or has already been reconciled." }, { status: 409 });
    return NextResponse.json({
      reconciled: true, delivery: updated[0],
      message: "The attempt is eligible for a new claim. No message was sent by this reconciliation action."
    });
  } catch (error) {
    console.error("Delivery reconciliation update failed", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "Could not reconcile this delivery." }, { status: 503 });
  }
}

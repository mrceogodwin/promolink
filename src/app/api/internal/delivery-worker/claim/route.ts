import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorized(request: Request) {
  const configured = process.env.DELIVERY_WORKER_SECRET || "";
  const supplied = request.headers.get("authorization") || "";
  const expected = "Bearer " + configured;
  if (!configured || supplied.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(supplied), Buffer.from(expected));
}

// Claims one delivery. It never sends messages and never returns integration
// configuration or audience contact data.
export async function POST(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Worker authentication failed." }, { status: 401 });
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "Database is not configured." }, { status: 503 });

  try {
    const sql = neon(process.env.DATABASE_URL);
    const claimed = await sql`
      WITH candidate AS (
        SELECT d.id
        FROM campaign_deliveries d
        JOIN campaigns c ON c.id = d.campaign_id
        JOIN audience_lists a ON a.id = d.audience_list_id
        JOIN channel_integrations ci ON ci.id = d.integration_id
        WHERE c.status = 'funded'
          AND a.status = 'approved'
          AND ci.status = 'active'
          AND (d.next_attempt_at IS NULL OR d.next_attempt_at <= now())
          AND (
            d.status IN ('queued','failed')
            OR (d.status = 'processing' AND d.lease_expires_at < now())
          )
          AND (d.scheduled_at IS NULL OR d.scheduled_at <= now())
        ORDER BY COALESCE(d.scheduled_at, d.created_at), d.created_at
        FOR UPDATE OF d SKIP LOCKED
        LIMIT 1
      ),
      claimed_delivery AS (
        UPDATE campaign_deliveries d
        SET status = 'processing',
            started_at = COALESCE(d.started_at, now()),
            lease_expires_at = now() + interval '5 minutes',
            updated_at = now(),
            last_error_code = NULL,
            last_error_message = NULL
        FROM candidate c
        WHERE d.id = c.id
        RETURNING d.id, d.campaign_id, d.audience_list_id, d.channel,
          d.integration_id, d.idempotency_key, d.lease_expires_at
      ),
      attempt AS (
        INSERT INTO delivery_attempts
          (delivery_id, attempt_number, status, request_fingerprint, response_metadata)
        SELECT d.id,
          (SELECT COUNT(*)::int + 1 FROM delivery_attempts WHERE delivery_id = d.id),
          'started',
          md5(d.id::text || d.lease_expires_at::text),
          jsonb_build_object('claimed_at', now(), 'lease_expires_at', d.lease_expires_at)
        FROM claimed_delivery d
        RETURNING id, delivery_id, attempt_number
      )
      SELECT d.id AS delivery_id, d.campaign_id, d.audience_list_id,
        d.channel, ci.provider, ci.display_name AS provider_name,
        d.idempotency_key, d.lease_expires_at,
        a.id AS attempt_id, a.attempt_number
      FROM claimed_delivery d
      JOIN channel_integrations ci ON ci.id = d.integration_id
      JOIN attempt a ON a.delivery_id = d.id
    `;

    if (!claimed.length) return NextResponse.json({ claimed: false, message: "No eligible delivery is waiting." });
    return NextResponse.json({ claimed: true, job: claimed[0], message: "Delivery claimed. A provider adapter must process it and report the real provider outcome." });
  } catch (error) {
    console.error("Delivery worker claim failed", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "Could not claim a delivery. Confirm migration 006 is applied." }, { status: 503 });
  }
}

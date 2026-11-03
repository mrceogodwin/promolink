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

const safeCode = /^[A-Z0-9_]{2,48}$/;

export async function POST(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Worker authentication failed." }, { status: 401 });
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "Database is not configured." }, { status: 503 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "A valid JSON body is required." }, { status: 400 });
  }

  const deliveryId = typeof body.delivery_id === "string" ? body.delivery_id : "";
  const attemptId = typeof body.attempt_id === "string" ? body.attempt_id : "";
  const outcome = body.outcome;
  const providerReference = typeof body.provider_reference === "string" ? body.provider_reference.trim() : null;
  const errorCode = typeof body.error_code === "string" ? body.error_code.trim().toUpperCase() : null;
  const metadataInput = body.metadata && typeof body.metadata === "object" && !Array.isArray(body.metadata)
    ? body.metadata as Record<string, unknown> : {};
  const allowedMetadata = ["provider_status", "message_id", "accepted_at", "retryable"];
  const metadata: Record<string, string | boolean> = {};
  for (const key of allowedMetadata) {
    const value = metadataInput[key];
    if (typeof value === "string" && value.length <= 160) metadata[key] = value;
    else if (typeof value === "boolean" && key === "retryable") metadata[key] = value;
  }

  if (!/^[0-9a-f-]{36}$/i.test(deliveryId) || !/^[0-9a-f-]{36}$/i.test(attemptId)) {
    return NextResponse.json({ error: "Valid delivery_id and attempt_id UUIDs are required." }, { status: 400 });
  }
  if (outcome !== "accepted" && outcome !== "failed" && outcome !== "unknown") {
    return NextResponse.json({ error: "outcome must be accepted, failed, or unknown." }, { status: 400 });
  }
  if (providerReference && providerReference.length > 200) {
    return NextResponse.json({ error: "provider_reference is too long." }, { status: 400 });
  }
  if (errorCode && !safeCode.test(errorCode)) {
    return NextResponse.json({ error: "error_code must be a short uppercase provider code." }, { status: 400 });
  }
  if (outcome === "accepted" && !providerReference) {
    return NextResponse.json({ error: "A provider_reference is required for an accepted submission." }, { status: 400 });
  }
  if (outcome === "failed" && !errorCode) {
    return NextResponse.json({ error: "A safe error_code is required for a failed submission." }, { status: 400 });
  }

  try {
    const sql = neon(process.env.DATABASE_URL);
    const result = await sql`
      WITH eligible AS (
        SELECT d.id, a.id AS attempt_id, a.attempt_number
        FROM campaign_deliveries d
        JOIN delivery_attempts a ON a.delivery_id = d.id
        WHERE d.id = ${deliveryId}::uuid
          AND a.id = ${attemptId}::uuid
          AND d.status = 'processing'
          AND d.lease_expires_at > now()
          AND a.status = 'started'
        FOR UPDATE OF d, a
      ),
      updated_attempt AS (
        UPDATE delivery_attempts a
        SET status = ${outcome},
            provider_reference = ${providerReference},
            error_code = ${outcome === "failed" ? errorCode : null},
            response_metadata = ${JSON.stringify(metadata)}::jsonb
        FROM eligible e
        WHERE a.id = e.attempt_id
        RETURNING a.id, a.delivery_id, a.attempt_number, a.status
      ),
      updated_delivery AS (
        UPDATE campaign_deliveries d
        SET status = CASE WHEN ${outcome} = 'accepted' THEN 'submitted'
                          WHEN ${outcome} = 'failed' THEN 'failed'
                          ELSE 'processing' END,
            lease_expires_at = CASE WHEN ${outcome} = 'unknown' THEN d.lease_expires_at ELSE NULL END,
            next_attempt_at = CASE
              WHEN ${outcome} = 'failed' AND ${metadata.retryable === false} THEN NULL
              WHEN ${outcome} = 'failed' THEN now() + make_interval(mins => LEAST(60, 5 * power(2, LEAST(e.attempt_number - 1, 4))::int))
              ELSE NULL END,
            last_error_code = CASE WHEN ${outcome} = 'failed' THEN ${errorCode} ELSE NULL END,
            last_error_message = CASE WHEN ${outcome} = 'failed' THEN 'Provider submission failed; see safe error code.' ELSE NULL END,
            updated_at = now()
        FROM updated_attempt a
        JOIN eligible e ON e.id = a.delivery_id
        WHERE d.id = a.delivery_id
        RETURNING d.id, d.status, d.next_attempt_at
      )
      SELECT a.id AS attempt_id, a.status AS attempt_status,
             d.status AS delivery_status, d.next_attempt_at
      FROM updated_attempt a
      JOIN updated_delivery d ON d.id = a.delivery_id
    `;

    if (!result.length) {
      return NextResponse.json({ error: "The attempt is stale, expired, already reported, or does not belong to this delivery." }, { status: 409 });
    }
    return NextResponse.json({
      reported: true,
      ...result[0],
      note: outcome === "accepted"
        ? "Provider accepted the submission. This is not proof of recipient delivery."
        : outcome === "unknown"
          ? "Provider outcome is unknown. The current lease is retained to avoid an unsafe immediate resend."
          : "Failure recorded with a retry delay. No automatic resend has occurred."
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.toLowerCase().includes("unique") || message.toLowerCase().includes("duplicate")) {
      return NextResponse.json({ error: "Provider reference is already attached to another attempt." }, { status: 409 });
    }
    console.error("Delivery worker report failed", message || "unknown error");
    return NextResponse.json({ error: "Could not record the provider outcome." }, { status: 503 });
  }
}

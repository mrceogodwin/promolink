import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

// Meta calls this endpoint with hub.mode, hub.verify_token and hub.challenge
// when the webhook subscription is configured.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode") || "";
  const token = url.searchParams.get("hub.verify_token") || "";
  const challenge = url.searchParams.get("hub.challenge") || "";
  const expected = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || "";
  if (!expected || mode !== "subscribe" || !challenge || !safeEqual(token, expected)) {
    return new Response("Forbidden", { status: 403 });
  }
  return new Response(challenge, { status: 200, headers: { "content-type": "text/plain" } });
}

async function readLimitedBody(request: Request, maxBytes: number) {
  if (!request.body) return "";
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return new TextDecoder().decode(bytes);
}

type MetaStatus = {
  id?: unknown;
  status?: unknown;
  timestamp?: unknown;
  recipient_id?: unknown;
  errors?: Array<{ code?: unknown; title?: unknown }>;
};

export async function POST(request: Request) {
  const appSecret = process.env.META_APP_SECRET;
  if (!appSecret || !process.env.DATABASE_URL) {
    return NextResponse.json({ error: "WhatsApp webhook is not configured." }, { status: 503 });
  }

  const declaredLength = Number(request.headers.get("content-length") || "0");
  if (declaredLength > 65_536) return NextResponse.json({ error: "Webhook payload is too large." }, { status: 413 });
  const raw = await readLimitedBody(request, 65_536);
  if (raw === null) return NextResponse.json({ error: "Webhook payload is too large." }, { status: 413 });

  const signature = request.headers.get("x-hub-signature-256") || "";
  const expected = "sha256=" + createHmac("sha256", appSecret).update(raw).digest("hex");
  if (!signature.startsWith("sha256=") || !safeEqual(signature, expected)) {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 });
  }

  let payload: { entry?: Array<{ changes?: Array<{ field?: string; value?: { statuses?: MetaStatus[] } }> }> };
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const statuses = (payload.entry || []).flatMap(entry =>
    (entry.changes || [])
      .filter(change => change.field === "messages")
      .flatMap(change => change.value?.statuses || [])
  );

  if (!statuses.length) return NextResponse.json({ received: true, statuses_processed: 0 });
  const sql = neon(process.env.DATABASE_URL);
  let processed = 0;

  for (const item of statuses) {
    const messageId = typeof item.id === "string" ? item.id : "";
    const status = typeof item.status === "string" ? item.status : "";
    if (!messageId || !["sent", "delivered", "read", "failed"].includes(status)) continue;

    const error = Array.isArray(item.errors) ? item.errors[0] : undefined;
    const safeErrorCode = error && (typeof error.code === "number" || typeof error.code === "string")
      ? String(error.code).replace(/[^A-Za-z0-9_]/g, "").slice(0, 48) || null
      : null;
    const safeErrorTitle = error && typeof error.title === "string"
      ? error.title.replace(/[\r\n\t]/g, " ").slice(0, 160)
      : null;
    const fingerprint = createHash("sha256")
      .update([messageId, status, String(item.timestamp || ""), safeErrorCode || ""].join(":"))
      .digest("hex");

    const result = await sql`
      WITH matched AS (
        SELECT a.id AS attempt_id, a.delivery_id
        FROM delivery_attempts a
        JOIN campaign_deliveries d ON d.id = a.delivery_id
        JOIN channel_integrations ci ON ci.id = d.integration_id
        WHERE a.provider_reference = ${messageId}
          AND ci.channel = 'whatsapp'
          AND ci.provider = 'meta_whatsapp_cloud'
        LIMIT 1
        FOR UPDATE OF a
      ),
      evidence AS (
        INSERT INTO delivery_evidence
          (delivery_id, evidence_type, provider_reference, evidence_fingerprint, evidence_metadata, verification_status, verified_at)
        SELECT m.delivery_id, 'provider_webhook', ${messageId}, ${fingerprint},
          jsonb_build_object('provider', 'meta_whatsapp_cloud', 'status', ${status},
            'timestamp', ${typeof item.timestamp === "string" ? item.timestamp.slice(0, 24) : null},
            'error_code', ${safeErrorCode}, 'error_title', ${safeErrorTitle}),
          'verified', now()
        FROM matched m
        ON CONFLICT (delivery_id, evidence_fingerprint) DO NOTHING
        RETURNING delivery_id
      ),
      attempt_update AS (
        UPDATE delivery_attempts a
        SET status = CASE WHEN ${status} IN ('delivered','read') THEN 'delivered'
                          WHEN ${status} = 'failed' THEN 'failed'
                          ELSE a.status END,
            error_code = CASE WHEN ${status} = 'failed' THEN ${safeErrorCode} ELSE a.error_code END,
            response_metadata = a.response_metadata || jsonb_build_object(
              'meta_status', ${status}, 'meta_status_at', now())
        FROM matched m
        WHERE a.id = m.attempt_id
        RETURNING a.delivery_id
      ),
      delivery_update AS (
        UPDATE campaign_deliveries d
        SET status = CASE WHEN ${status} IN ('delivered','read') THEN 'delivered'
                          WHEN ${status} = 'failed' THEN 'failed'
                          ELSE d.status END,
            completed_at = CASE WHEN ${status} IN ('delivered','read','failed') THEN now() ELSE d.completed_at END,
            last_error_code = CASE WHEN ${status} = 'failed' THEN ${safeErrorCode} ELSE d.last_error_code END,
            last_error_message = CASE WHEN ${status} = 'failed' THEN 'Meta reported message delivery failure.' ELSE d.last_error_message END,
            updated_at = now()
        FROM attempt_update a
        WHERE d.id = a.delivery_id
        RETURNING d.id
      )
      SELECT id FROM delivery_update
    `;
    if (result.length) processed += 1;
  }

  return NextResponse.json({ received: true, statuses_processed: processed });
}

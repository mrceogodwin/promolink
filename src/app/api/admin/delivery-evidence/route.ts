import { sameOriginError } from "@/lib/request-security";
import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { getSessionUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    if (user.role !== "admin") return NextResponse.json({ error: "Administrator access required." }, { status: 403 });
    if (!process.env.DATABASE_URL) return NextResponse.json({ error: "Database is not configured." }, { status: 503 });

    const sql = neon(process.env.DATABASE_URL);
    // Do not expose evidence_metadata: provider payloads may contain sensitive data.
    const evidence = await sql`
      SELECT de.id, de.delivery_id, de.evidence_type, de.provider_reference,
        de.evidence_fingerprint, de.verification_status, de.created_at,
        d.campaign_id, d.channel, d.status AS delivery_status,
        ci.display_name AS provider_name
      FROM delivery_evidence de
      JOIN campaign_deliveries d ON d.id = de.delivery_id
      LEFT JOIN channel_integrations ci ON ci.id = d.integration_id
      WHERE de.verification_status = 'pending'
        AND de.evidence_type = 'provider_webhook'
      ORDER BY de.created_at ASC
      LIMIT 100
    `;
    return NextResponse.json({ evidence });
  } catch (error) {
    console.error("Pending delivery evidence read failed", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "Could not load pending delivery evidence." }, { status: 503 });
  }
}

export async function PATCH(request: Request) {
  const originError = sameOriginError(request);
  if (originError) return originError;

  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    if (user.role !== "admin") return NextResponse.json({ error: "Administrator access required." }, { status: 403 });
    if (!process.env.DATABASE_URL) return NextResponse.json({ error: "Database is not configured." }, { status: 503 });

    const declaredLength = Number(request.headers.get("content-length") || "0");
    if (declaredLength > 8_192) return NextResponse.json({ error: "Request body exceeds the 8 KB limit." }, { status: 413 });
    const rawBody = await request.text();
    if (Buffer.byteLength(rawBody, "utf8") > 8_192) return NextResponse.json({ error: "Request body exceeds the 8 KB limit." }, { status: 413 });
    let body: { evidence_id?: unknown; decision?: unknown } | null = null;
    try {
      const parsed: unknown = JSON.parse(rawBody);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) body = parsed as { evidence_id?: unknown; decision?: unknown };
    } catch { /* handled by the validation response below */ }
    const evidenceId = typeof body?.evidence_id === "string" ? body.evidence_id : "";
    const decision = body?.decision;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(evidenceId)) {
      return NextResponse.json({ error: "A valid evidence ID is required." }, { status: 400 });
    }
    if (decision !== "verified" && decision !== "rejected") {
      return NextResponse.json({ error: "Decision must be verified or rejected." }, { status: 400 });
    }

    const sql = neon(process.env.DATABASE_URL);
    const reviewed = await sql`
      WITH target AS (
        SELECT de.id, de.delivery_id, d.campaign_id, d.status AS delivery_status,
          a.id AS attempt_id
        FROM delivery_evidence de
        JOIN campaign_deliveries d ON d.id = de.delivery_id
        JOIN delivery_attempts a
          ON a.delivery_id = d.id
         AND a.provider_reference = de.provider_reference
         AND a.status IN ('accepted','delivered')
        WHERE de.id = ${evidenceId}
          AND de.verification_status = 'pending'
          AND de.evidence_type = 'provider_webhook'
          AND de.provider_reference IS NOT NULL
          AND d.status IN ('queued','processing','submitted')
          AND a.attempt_number = (
            SELECT MAX(latest.attempt_number)
            FROM delivery_attempts latest
            WHERE latest.delivery_id = d.id
          )
        FOR UPDATE OF de, d, a
      ),
      changed AS (
        UPDATE delivery_evidence de
        SET verification_status = ${decision},
            verified_by = ${user.id},
            verified_at = now()
        FROM target t
        WHERE de.id = t.id
        RETURNING de.id, de.delivery_id, de.verification_status
      ),
      attempt_delivered AS (
        UPDATE delivery_attempts a
        SET status = 'delivered'
        FROM changed c
        JOIN target t ON t.id = c.id
        WHERE a.id = t.attempt_id
          AND c.verification_status = 'verified'
        RETURNING a.id, a.delivery_id
      ),
      delivered AS (
        UPDATE campaign_deliveries d
        SET status = 'delivered', completed_at = now(), updated_at = now(),
            last_error_code = NULL, last_error_message = NULL
        FROM changed c
        JOIN attempt_delivered a ON a.delivery_id = c.delivery_id
        WHERE d.id = c.delivery_id
          AND c.verification_status = 'verified'
          AND d.status IN ('queued','processing','submitted')
        RETURNING d.id
      ),
      logged AS (
        INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
        SELECT ${user.id},
          CASE WHEN c.verification_status = 'verified'
            THEN 'delivery_evidence_verified' ELSE 'delivery_evidence_rejected' END,
          'campaign_delivery', c.delivery_id,
          jsonb_build_object('evidence_id', c.id, 'decision', c.verification_status,
            'delivery_marked_delivered', EXISTS (SELECT 1 FROM delivered))
        FROM changed c
        RETURNING entity_id
      )
      SELECT c.id, c.delivery_id, c.verification_status,
        EXISTS (SELECT 1 FROM delivered) AS delivery_marked_delivered
      FROM changed c
      INNER JOIN logged l ON l.entity_id = c.delivery_id
    `;
    if (!reviewed.length) {
      return NextResponse.json({ error: "Evidence was not found, is already reviewed, or is not provider evidence eligible for review." }, { status: 409 });
    }
    return NextResponse.json({ evidence: reviewed[0] });
  } catch (error) {
    console.error("Delivery evidence review failed", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "Could not review delivery evidence." }, { status: 503 });
  }
}

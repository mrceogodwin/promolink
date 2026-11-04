import { sameOriginError } from "@/lib/request-security";
import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { getSessionUser } from "@/lib/auth";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const originError = sameOriginError(request);
  if (originError) return originError;
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (user.role !== "admin") return NextResponse.json({ error: "Administrator access required." }, { status: 403 });
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "Database is not configured." }, { status: 503 });

  const raw = await request.text();
  if (Buffer.byteLength(raw, "utf8") > 4096) return NextResponse.json({ error: "Request body is too large." }, { status: 413 });
  let deliveryId = "";
  try {
    const body = JSON.parse(raw) as { delivery_id?: unknown };
    deliveryId = typeof body.delivery_id === "string" ? body.delivery_id : "";
  } catch { /* validation response below */ }
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(deliveryId)) {
    return NextResponse.json({ error: "A valid delivery_id is required." }, { status: 400 });
  }

  try {
    const sql = neon(process.env.DATABASE_URL);
    const rows = await sql`
      WITH campaign_lock AS (
        SELECT c.id, c.advertiser_id, c.currency, c.status
        FROM campaigns c
        JOIN campaign_deliveries d ON d.campaign_id = c.id
        WHERE d.id = ${deliveryId}::uuid
        FOR UPDATE OF c
      ),
      eligible AS (
        SELECT d.id AS delivery_id, c.id AS campaign_id, c.advertiser_id,
          a.owner_id AS publisher_id, a.currency,
          ROUND(a.price_amount * 100)::bigint AS gross_minor,
          p.platform_fee_bps
        FROM campaign_lock c
        JOIN campaign_deliveries d ON d.campaign_id = c.id
        JOIN audience_lists a ON a.id = d.audience_list_id
        JOIN platform_fee_policy p ON p.id = 1
        WHERE d.id = ${deliveryId}::uuid
          AND d.status = 'delivered'
          AND c.status IN ('funded','running','completed')
          AND a.pricing_model = 'fixed_post'
          AND a.currency = c.currency
          AND p.enabled = TRUE
          AND p.platform_fee_bps IS NOT NULL
          AND p.currency = a.currency
          AND EXISTS (
            SELECT 1 FROM delivery_evidence e
            WHERE e.delivery_id = d.id AND e.evidence_type = 'provider_webhook'
              AND e.verification_status = 'verified'
          )
          AND EXISTS (
            SELECT 1 FROM delivery_attempts x
            WHERE x.delivery_id = d.id AND x.status = 'delivered'
          )
          AND NOT EXISTS (SELECT 1 FROM publisher_settlements s WHERE s.delivery_id = d.id)
      ),
      amounts AS (
        SELECT *, ROUND(gross_minor * platform_fee_bps / 10000.0)::bigint AS fee_minor
        FROM eligible WHERE gross_minor > 0
      ),
      funded AS (
        SELECT a.* FROM amounts a
        WHERE a.gross_minor > a.fee_minor
          AND (
            SELECT COALESCE(SUM(l.amount_minor),0) FROM ledger_entries l
            WHERE l.user_id = a.advertiser_id AND l.campaign_id = a.campaign_id
              AND l.currency = a.currency AND l.entry_type = 'reserve'
          ) - (
            SELECT COALESCE(SUM(l.amount_minor),0) FROM ledger_entries l
            WHERE l.user_id = a.advertiser_id AND l.campaign_id = a.campaign_id
              AND l.currency = a.currency AND l.entry_type = 'delivery_charge'
          ) >= a.gross_minor
      ),
      settlement AS (
        INSERT INTO publisher_settlements
          (delivery_id,campaign_id,advertiser_id,publisher_id,gross_amount_minor,
           platform_fee_minor,publisher_amount_minor,currency,fee_policy_bps)
        SELECT delivery_id,campaign_id,advertiser_id,publisher_id,gross_minor,
          fee_minor,gross_minor-fee_minor,currency,platform_fee_bps
        FROM funded
        RETURNING *
      ),
      charge AS (
        INSERT INTO ledger_entries (user_id,campaign_id,entry_type,amount_minor,currency,reference,metadata)
        SELECT advertiser_id,campaign_id,'delivery_charge',gross_amount_minor,currency,
          'settlement:' || id::text || ':advertiser_charge',
          jsonb_build_object('settlement_id',id,'delivery_id',delivery_id)
        FROM settlement
        RETURNING id
      ),
      earning AS (
        INSERT INTO ledger_entries (user_id,campaign_id,entry_type,amount_minor,currency,reference,metadata)
        SELECT publisher_id,campaign_id,'earning',publisher_amount_minor,currency,
          'settlement:' || id::text || ':publisher_earning',
          jsonb_build_object('settlement_id',id,'delivery_id',delivery_id,
            'gross_amount_minor',gross_amount_minor,'platform_fee_minor',platform_fee_minor,
            'fee_policy_bps',fee_policy_bps)
        FROM settlement
        ON CONFLICT (reference) DO NOTHING
        RETURNING id
      ),
      audit AS (
        INSERT INTO audit_logs (actor_user_id,action,entity_type,entity_id,metadata)
        SELECT ${user.id},'publisher_delivery_settled','campaign_delivery',s.delivery_id,
          jsonb_build_object('settlement_id',s.id,'gross_amount_minor',s.gross_amount_minor,
            'platform_fee_minor',s.platform_fee_minor,'publisher_amount_minor',s.publisher_amount_minor,
            'currency',s.currency,'fee_policy_bps',s.fee_policy_bps)
        FROM settlement s
        WHERE EXISTS (SELECT 1 FROM charge) AND EXISTS (SELECT 1 FROM earning)
        RETURNING entity_id
      )
      SELECT s.id,s.delivery_id,s.gross_amount_minor::text,s.platform_fee_minor::text,
        s.publisher_amount_minor::text,s.currency,s.fee_policy_bps
      FROM settlement s JOIN audit a ON a.entity_id = s.delivery_id
    `;
    if (!rows.length) return NextResponse.json({ error: "Settlement not posted. Confirm verified provider delivery, fixed-post pricing, enabled fee policy, matching currency and sufficient campaign reserve. This delivery may already be settled." }, { status: 409 });
    return NextResponse.json({ settlement: rows[0] }, { status: 201 });
  } catch (error) {
    console.error("Publisher settlement posting failed", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "Could not post publisher settlement." }, { status: 503 });
  }
}

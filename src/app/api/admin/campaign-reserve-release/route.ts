import { sameOriginError } from "@/lib/request-security";
import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { getSessionUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Returns only the unused internal wallet reserve. This does not issue a
// Paystack/card reversal or claim that money has reached a bank account.
export async function POST(request: Request) {
  const originError = sameOriginError(request);
  if (originError) return originError;

  const admin = await getSessionUser();
  if (!admin) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (admin.role !== "admin") return NextResponse.json({ error: "Administrator access required." }, { status: 403 });
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "Database is not configured." }, { status: 503 });

  const raw = await request.text();
  if (Buffer.byteLength(raw, "utf8") > 4096) return NextResponse.json({ error: "Request body is too large." }, { status: 413 });
  let campaignId = "";
  try {
    const body = JSON.parse(raw) as { campaign_id?: unknown };
    campaignId = typeof body.campaign_id === "string" ? body.campaign_id : "";
  } catch {
    return NextResponse.json({ error: "Send valid JSON with campaign_id." }, { status: 400 });
  }
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(campaignId)) {
    return NextResponse.json({ error: "A valid campaign_id is required." }, { status: 400 });
  }

  try {
    const sql = neon(process.env.DATABASE_URL);
    const rows = await sql`
      WITH campaign_lock AS (
        SELECT c.id, c.advertiser_id, c.currency, c.status
        FROM campaigns c
        WHERE c.id = ${campaignId}::uuid
        FOR UPDATE
      ),
      eligible AS (
        SELECT c.id AS campaign_id, c.advertiser_id, c.currency,
          COALESCE((
            SELECT SUM(l.amount_minor) FROM ledger_entries l
            WHERE l.user_id = c.advertiser_id AND l.campaign_id = c.id
              AND l.currency = c.currency AND l.entry_type = 'reserve'
          ), 0)
          - COALESCE((
            SELECT SUM(l.amount_minor) FROM ledger_entries l
            WHERE l.user_id = c.advertiser_id AND l.campaign_id = c.id
              AND l.currency = c.currency AND l.entry_type = 'delivery_charge'
          ), 0)
          - COALESCE((
            SELECT SUM(l.amount_minor) FROM ledger_entries l
            WHERE l.user_id = c.advertiser_id AND l.campaign_id = c.id
              AND l.currency = c.currency AND l.entry_type = 'reserve_release'
          ), 0) AS remaining_minor
        FROM campaign_lock c
        WHERE c.status IN ('cancelled', 'completed')
          AND NOT EXISTS (
            SELECT 1 FROM campaign_deliveries d
            WHERE d.campaign_id = c.id
              AND d.status NOT IN ('delivered', 'failed', 'cancelled')
          )
          AND NOT EXISTS (
            SELECT 1 FROM campaign_deliveries d
            WHERE d.campaign_id = c.id AND d.status = 'delivered'
              AND NOT EXISTS (
                SELECT 1 FROM publisher_settlements s
                WHERE s.delivery_id = d.id AND s.status = 'posted'
              )
          )
          AND NOT EXISTS (
            SELECT 1 FROM ledger_entries l
            WHERE l.campaign_id = c.id
              AND l.reference = 'campaign-reserve-release:' || c.id::text
          )
      ),
      release_amount AS (
        SELECT * FROM eligible WHERE remaining_minor > 0
      ),
      refund AS (
        INSERT INTO ledger_entries
          (user_id, campaign_id, entry_type, amount_minor, currency, reference, metadata)
        SELECT advertiser_id, campaign_id, 'refund', remaining_minor, currency,
          'campaign-reserve-refund:' || campaign_id::text,
          jsonb_build_object('reason', 'unused_campaign_reserve_returned_to_wallet')
        FROM release_amount
        RETURNING id, user_id, campaign_id, amount_minor, currency
      ),
      reserve_release AS (
        INSERT INTO ledger_entries
          (user_id, campaign_id, entry_type, amount_minor, currency, reference, metadata)
        SELECT user_id, campaign_id, 'reserve_release', amount_minor, currency,
          'campaign-reserve-release:' || campaign_id::text,
          jsonb_build_object('refund_ledger_entry_id', id)
        FROM refund
        RETURNING id, user_id, campaign_id, amount_minor, currency
      ),
      audit AS (
        INSERT INTO audit_logs
          (actor_user_id, action, entity_type, entity_id, metadata)
        SELECT ${admin.id}, 'campaign_unused_reserve_returned', 'campaign', r.campaign_id::text,
          jsonb_build_object('amount_minor', r.amount_minor, 'currency', r.currency,
            'refund_entry_id', r.id, 'reserve_release_entry_id', x.id,
            'destination', 'promolink_wallet')
        FROM refund r JOIN reserve_release x
          ON x.campaign_id = r.campaign_id AND x.amount_minor = r.amount_minor
        RETURNING entity_id
      )
      SELECT r.campaign_id, r.amount_minor::text, r.currency,
        r.id AS refund_entry_id, x.id AS reserve_release_entry_id
      FROM refund r
      JOIN reserve_release x ON x.campaign_id = r.campaign_id
      JOIN audit a ON a.entity_id = r.campaign_id::text
    `;

    if (!rows.length) {
      return NextResponse.json({
        error: "No reserve was released. Confirm the campaign is completed or cancelled, all deliveries are terminal, every delivered item is settled, a positive unused reserve remains, and no prior release exists."
      }, { status: 409 });
    }
    return NextResponse.json({
      release: rows[0],
      destination: "promolink_wallet",
      external_refund: false,
      message: "Unused campaign reserve returned to the advertiser's PromoLink wallet. No bank or card refund was initiated."
    }, { status: 201 });
  } catch (error) {
    console.error("Campaign reserve release failed", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "Could not release campaign reserve. Confirm the reserve-release migration is applied." }, { status: 503 });
  }
}

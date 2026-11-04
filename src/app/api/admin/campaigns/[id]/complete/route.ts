import { sameOriginError } from "@/lib/request-security";
import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { getSessionUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Completion is an administrative state transition, not proof of delivery.
// Every delivery must be terminal and every delivered item already settled.
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const originError = sameOriginError(request);
  if (originError) return originError;

  const admin = await getSessionUser();
  if (!admin) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (admin.role !== "admin") return NextResponse.json({ error: "Administrator access required." }, { status: 403 });
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "Database is not configured." }, { status: 503 });

  const { id } = await context.params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    return NextResponse.json({ error: "Invalid campaign ID." }, { status: 400 });
  }

  try {
    const sql = neon(process.env.DATABASE_URL);
    const rows = await sql`
      WITH campaign_lock AS (
        SELECT c.id, c.status
        FROM campaigns c
        WHERE c.id = ${id}::uuid
        FOR UPDATE
      ),
      delivery_lock AS (
        SELECT d.id, d.status
        FROM campaign_deliveries d
        JOIN campaign_lock c ON c.id = d.campaign_id
        FOR UPDATE OF d
      ),
      eligible AS (
        SELECT c.id
        FROM campaign_lock c
        WHERE c.status = 'running'
          AND EXISTS (SELECT 1 FROM delivery_lock)
          AND NOT EXISTS (
            SELECT 1 FROM delivery_lock d
            WHERE d.status NOT IN ('delivered', 'failed', 'cancelled')
          )
          AND NOT EXISTS (
            SELECT 1 FROM delivery_lock d
            WHERE d.status = 'delivered'
              AND NOT EXISTS (
                SELECT 1 FROM publisher_settlements s
                WHERE s.delivery_id = d.id AND s.status = 'posted'
              )
          )
      ),
      updated AS (
        UPDATE campaigns c
        SET status = 'completed', updated_at = now()
        FROM eligible e
        WHERE c.id = e.id AND c.status = 'running'
        RETURNING c.id
      ),
      logged AS (
        INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
        SELECT ${admin.id}, 'campaign_completed_by_admin', 'campaign', id,
          jsonb_build_object('reason', 'all_deliveries_terminal_and_delivered_items_settled')
        FROM updated
        RETURNING entity_id
      )
      SELECT u.id FROM updated u JOIN logged l ON l.entity_id = u.id
    `;
    if (!rows.length) {
      return NextResponse.json({
        error: "Campaign was not completed. It must be running, have at least one delivery, have no active or unresolved deliveries, and all delivered items must already be settled."
      }, { status: 409 });
    }
    return NextResponse.json({ campaign: { id: rows[0].id, status: "completed" } });
  } catch (error) {
    console.error("Campaign completion failed", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "Could not complete campaign." }, { status: 503 });
  }
}

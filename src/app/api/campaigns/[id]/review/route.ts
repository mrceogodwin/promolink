import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { getSessionUser } from "@/lib/auth";

export const runtime = "nodejs";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Sign in to review campaign requests." }, { status: 401 });
    if (!["audience_owner", "admin"].includes(user.role)) return NextResponse.json({ error: "Audience-owner access is required." }, { status: 403 });
    const { id } = await context.params;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) return NextResponse.json({ error: "Invalid campaign ID." }, { status: 400 });
    const body: unknown = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: "Send a valid decision." }, { status: 400 });
    const input = body as Record<string, unknown>;
    const status = input.status === "approved" ? "approved" : input.status === "rejected" ? "cancelled" : null;
    if (!status) return NextResponse.json({ error: "Choose approve or reject." }, { status: 400 });
    if (!process.env.DATABASE_URL) return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
    const sql = neon(process.env.DATABASE_URL);
    const rows = user.role === "admin"
      ? await sql`WITH updated AS (
          UPDATE campaigns SET status = ${status}, updated_at = now()
          WHERE id = ${id} AND status = 'pending_owner_approval'
          RETURNING id, title, status, audience_list_id, advertiser_id
        ), logged AS (
          INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
          SELECT ${user.id}, CASE WHEN status = 'approved' THEN 'campaign_request_approved' ELSE 'campaign_request_rejected' END,
            'campaign', id, '{}'::jsonb FROM updated RETURNING entity_id
        )
        SELECT updated.id, updated.title, updated.status, updated.audience_list_id, updated.advertiser_id
        FROM updated JOIN logged ON logged.entity_id = updated.id`
      : await sql`WITH updated AS (
          UPDATE campaigns c SET status = ${status}, updated_at = now()
          FROM audience_lists a
          WHERE c.id = ${id} AND c.audience_list_id = a.id AND a.owner_id = ${user.id}
            AND c.status = 'pending_owner_approval'
          RETURNING c.id, c.title, c.status, c.audience_list_id, c.advertiser_id
        ), logged AS (
          INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
          SELECT ${user.id}, CASE WHEN status = 'approved' THEN 'campaign_request_approved' ELSE 'campaign_request_rejected' END,
            'campaign', id, '{}'::jsonb FROM updated RETURNING entity_id
        )
        SELECT updated.id, updated.title, updated.status, updated.audience_list_id, updated.advertiser_id
        FROM updated JOIN logged ON logged.entity_id = updated.id`;
    if (!rows.length) return NextResponse.json({ error: "Request not found, already reviewed, or not owned by your audience." }, { status: 404 });
    return NextResponse.json({ campaign: rows[0] });
  } catch (error) {
    console.error("Campaign review failed", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "Could not review campaign. Confirm the database migration is applied." }, { status: 500 });
  }
}

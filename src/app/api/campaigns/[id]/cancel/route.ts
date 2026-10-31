import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { getSessionUser } from "@/lib/auth";
export const runtime = "nodejs";
export async function PATCH(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Sign in to cancel a campaign." }, { status: 401 });
    if (user.role !== "advertiser") return NextResponse.json({ error: "Only the campaign advertiser can cancel this request." }, { status: 403 });
    const { id } = await context.params;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) return NextResponse.json({ error: "Invalid campaign ID." }, { status: 400 });
    if (!process.env.DATABASE_URL) return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
    const sql = neon(process.env.DATABASE_URL);
    const rows = await sql`UPDATE campaigns SET status = 'cancelled', updated_at = now() WHERE id = ${id} AND advertiser_id = ${user.id} AND status IN ('pending_owner_approval', 'approved') RETURNING id, title, status, audience_list_id, advertiser_id`;
    if (!rows.length) return NextResponse.json({ error: "Campaign not found, not yours, or no longer cancellable. Funded or running campaigns require a separate support/dispute process." }, { status: 409 });
    await sql`INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, metadata) VALUES (${user.id}, 'campaign_cancelled_by_advertiser', 'campaign', ${id}, '{}'::jsonb)`;
    return NextResponse.json({ campaign: rows[0] });
  } catch (error) {
    console.error("Campaign cancellation failed", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "Could not cancel campaign." }, { status: 500 });
  }
}
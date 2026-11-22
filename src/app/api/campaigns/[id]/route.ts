import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { getSessionUser } from "@/lib/auth";
export const runtime = "nodejs";
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Sign in to view campaign details." }, { status: 401 });
    const { id } = await context.params;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) return NextResponse.json({ error: "Invalid campaign ID." }, { status: 400 });
    if (!process.env.DATABASE_URL) return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
    const sql = neon(process.env.DATABASE_URL);
    const rows = user.role === "admin"
      ? await sql`SELECT c.id, c.title, c.brief, c.budget_amount, c.currency, c.status, c.created_at, c.updated_at, a.id AS audience_list_id, a.title AS audience_title, a.channel, a.estimated_reach FROM campaigns c JOIN audience_lists a ON a.id = c.audience_list_id WHERE c.id = ${id} LIMIT 1`
      : user.role === "advertiser"
        ? await sql`SELECT c.id, c.title, c.brief, c.budget_amount, c.currency, c.status, c.created_at, c.updated_at, a.id AS audience_list_id, a.title AS audience_title, a.channel, a.estimated_reach FROM campaigns c JOIN audience_lists a ON a.id = c.audience_list_id WHERE c.id = ${id} AND c.advertiser_id = ${user.id} LIMIT 1`
        : await sql`SELECT c.id, c.title, c.brief, c.budget_amount, c.currency, c.status, c.created_at, c.updated_at, a.id AS audience_list_id, a.title AS audience_title, a.channel, a.estimated_reach FROM campaigns c JOIN audience_lists a ON a.id = c.audience_list_id WHERE c.id = ${id} AND a.owner_id = ${user.id} LIMIT 1`;
    if (!rows.length) return NextResponse.json({ error: "Campaign not found or you do not have access." }, { status: 404 });
    const activity = await sql`SELECT action, metadata, created_at FROM audit_logs WHERE entity_type = 'campaign' AND entity_id = ${id} ORDER BY created_at DESC LIMIT 20`;
    return NextResponse.json({ campaign: rows[0], activity });
  } catch (error) {
    console.error("Campaign detail read failed", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "Could not load campaign details." }, { status: 503 });
  }
}
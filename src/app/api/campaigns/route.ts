import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { getSessionUser } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Sign in to view campaigns." }, { status: 401 });
    if (!process.env.DATABASE_URL) return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
    const sql = neon(process.env.DATABASE_URL);
    const rows = user.role === "admin"
      ? await sql`SELECT c.id, c.advertiser_id, c.audience_list_id, c.title, c.brief, c.budget_amount, c.currency, c.status, c.created_at FROM campaigns c ORDER BY c.created_at DESC LIMIT 100`
      : user.role === "advertiser"
        ? await sql`SELECT c.id, c.advertiser_id, c.audience_list_id, c.title, c.brief, c.budget_amount, c.currency, c.status, c.created_at FROM campaigns c WHERE c.advertiser_id = ${user.id} ORDER BY c.created_at DESC LIMIT 100`
        : await sql`SELECT c.id, c.advertiser_id, c.audience_list_id, c.title, c.brief, c.budget_amount, c.currency, c.status, c.created_at FROM campaigns c JOIN audience_lists a ON a.id = c.audience_list_id WHERE a.owner_id = ${user.id} ORDER BY c.created_at DESC LIMIT 100`;
    return NextResponse.json({ campaigns: rows });
  } catch (error) {
    console.error("Campaign read failed", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "Could not load campaigns. Confirm the database migration is applied." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Sign in to create a campaign." }, { status: 401 });
    if (user.role !== "advertiser") return NextResponse.json({ error: "Only advertisers can create campaigns." }, { status: 403 });
    const body: unknown = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: "Send valid campaign details." }, { status: 400 });
    const input = body as Record<string, unknown>;
    const audienceListId = typeof input.audience_list_id === "string" ? input.audience_list_id : "";
    const title = typeof input.title === "string" ? input.title.trim() : "";
    const brief = typeof input.brief === "string" ? input.brief.trim() : "";
    const budget = Number(input.budget_amount);
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(audienceListId)) return NextResponse.json({ error: "Choose a valid audience listing." }, { status: 400 });
    if (title.length < 3 || title.length > 140 || brief.length > 3000) return NextResponse.json({ error: "Campaign title must be 3–140 characters and brief under 3,000 characters." }, { status: 400 });
    if (!Number.isFinite(budget) || budget <= 0 || budget > 9999999999) return NextResponse.json({ error: "Budget must be a positive amount." }, { status: 400 });
    if (!process.env.DATABASE_URL) return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
    const sql = neon(process.env.DATABASE_URL);
    const audience = await sql`SELECT id FROM audience_lists WHERE id = ${audienceListId} AND status = 'approved' LIMIT 1`;
    if (!audience.length) return NextResponse.json({ error: "That audience is not available for campaigns yet." }, { status: 404 });
    const rows = await sql`INSERT INTO campaigns (advertiser_id, audience_list_id, title, brief, budget_amount, currency, status) VALUES (${user.id}, ${audienceListId}, ${title}, ${brief}, ${budget}, 'NGN', 'pending_owner_approval') RETURNING id, title, audience_list_id, budget_amount, currency, status, created_at`;
    return NextResponse.json({ campaign: rows[0] }, { status: 201 });
  } catch (error) {
    console.error("Campaign create failed", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "Could not create campaign. Confirm the database migration is applied." }, { status: 500 });
  }
}

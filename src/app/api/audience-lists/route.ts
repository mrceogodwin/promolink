import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { getSessionUser } from "@/lib/auth";

export const runtime = "nodejs";
const channels = new Set(["whatsapp", "telegram", "facebook", "instagram", "tiktok"]);
const models = new Set(["fixed_post", "per_verified_delivery", "performance"]);

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Sign in to view listings." }, { status: 401 });
    if (!process.env.DATABASE_URL) return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
    const sql = neon(process.env.DATABASE_URL);
    const rows = user.role === "admin"
      ? await sql`SELECT a.id, a.owner_id, a.title, a.description, a.category, a.country_code, a.channel, a.estimated_reach, a.currency, a.price_amount, a.pricing_model, a.status, a.created_at FROM audience_lists a ORDER BY a.created_at DESC LIMIT 100`
      : await sql`SELECT a.id, a.owner_id, a.title, a.description, a.category, a.country_code, a.channel, a.estimated_reach, a.currency, a.price_amount, a.pricing_model, a.status, a.created_at FROM audience_lists a WHERE a.owner_id = ${user.id} ORDER BY a.created_at DESC LIMIT 100`;
    return NextResponse.json({ listings: rows });
  } catch (error) {
    console.error("Audience listing read failed", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "Could not load listings. Confirm the database migration is applied." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Sign in to create a listing." }, { status: 401 });
    if (user.role !== "audience_owner") return NextResponse.json({ error: "Only audience owners can create listings." }, { status: 403 });
    const body: unknown = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: "Send valid listing details." }, { status: 400 });
    const input = body as Record<string, unknown>;
    const title = typeof input.title === "string" ? input.title.trim() : "";
    const description = typeof input.description === "string" ? input.description.trim() : "";
    const category = typeof input.category === "string" ? input.category.trim() : "";
    const channel = typeof input.channel === "string" ? input.channel : "";
    const countryCode = typeof input.country_code === "string" ? input.country_code.trim().toUpperCase() : "";
    const reach = Number(input.estimated_reach);
    const price = Number(input.price_amount);
    const currency = typeof input.currency === "string" ? input.currency.trim().toUpperCase() : "NGN";
    const pricingModel = typeof input.pricing_model === "string" ? input.pricing_model : "fixed_post";
    if (title.length < 3 || title.length > 140) return NextResponse.json({ error: "Title must be 3–140 characters." }, { status: 400 });
    if (description.length > 2000 || category.length < 2 || category.length > 80) return NextResponse.json({ error: "Enter a category and a description under 2,000 characters." }, { status: 400 });
    if (!channels.has(channel)) return NextResponse.json({ error: "Choose a supported channel." }, { status: 400 });
    if (!Number.isSafeInteger(reach) || reach < 1 || reach > 1000000000) return NextResponse.json({ error: "Estimated reach must be a positive whole number." }, { status: 400 });
    if (!Number.isFinite(price) || price < 0 || price > 9999999999) return NextResponse.json({ error: "Enter a valid price." }, { status: 400 });
    if (!/^[A-Z]{3}$/.test(currency)) return NextResponse.json({ error: "Currency must be a 3-letter code." }, { status: 400 });
    if (countryCode && !/^[A-Z]{2}$/.test(countryCode)) return NextResponse.json({ error: "Country must be a 2-letter code." }, { status: 400 });
    if (!models.has(pricingModel)) return NextResponse.json({ error: "Choose a valid pricing model." }, { status: 400 });
    if (!process.env.DATABASE_URL) return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
    const sql = neon(process.env.DATABASE_URL);
    const rows = await sql`INSERT INTO audience_lists (owner_id, title, description, category, country_code, channel, estimated_reach, currency, price_amount, pricing_model, status) VALUES (${user.id}, ${title}, ${description}, ${category}, ${countryCode || null}, ${channel}, ${reach}, ${currency}, ${price}, ${pricingModel}, 'pending_review') RETURNING id, title, channel, estimated_reach, currency, price_amount, pricing_model, status, created_at`;
    return NextResponse.json({ listing: rows[0] }, { status: 201 });
  } catch (error) {
    console.error("Audience listing create failed", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "Could not create listing. Confirm the database migration is applied." }, { status: 500 });
  }
}

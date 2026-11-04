import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { getSessionUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Read-only queue. Resolution must be based on a fresh provider-side verification;
// this endpoint deliberately cannot mark a mismatched charge as funded or refunded.
export async function GET() {
  try {
    const admin = await getSessionUser();
    if (!admin) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    if (admin.role !== "admin") return NextResponse.json({ error: "Administrator access required." }, { status: 403 });
    if (!process.env.DATABASE_URL) return NextResponse.json({ error: "Database is not configured." }, { status: 503 });

    const sql = neon(process.env.DATABASE_URL);
    const payments = await sql`
      SELECT p.id, p.provider, p.provider_reference, p.campaign_id, p.user_id,
        p.amount_minor::text, p.currency, p.status, p.created_at, p.updated_at,
        c.title AS campaign_title, u.email AS advertiser_email
      FROM payment_events p
      LEFT JOIN campaigns c ON c.id = p.campaign_id
      LEFT JOIN users u ON u.id = p.user_id
      WHERE p.status = 'needs_review'
      ORDER BY p.created_at ASC
      LIMIT 100
    `;
    return NextResponse.json({ payments });
  } catch (error) {
    console.error("Payment review queue failed", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "Could not load payment review queue." }, { status: 503 });
  }
}

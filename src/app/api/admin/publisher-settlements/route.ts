import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { getSessionUser } from "@/lib/auth";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (user.role !== "admin") return NextResponse.json({ error: "Administrator access required." }, { status: 403 });
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
  try {
    const sql = neon(process.env.DATABASE_URL);
    const [policy, totals, recent] = await Promise.all([
      sql`SELECT platform_fee_bps, currency, enabled, updated_at FROM platform_fee_policy WHERE id = 1`,
      sql`SELECT currency, COUNT(*)::int AS settlement_count,
        COALESCE(SUM(gross_amount_minor),0)::text AS gross_minor,
        COALESCE(SUM(platform_fee_minor),0)::text AS platform_fee_minor,
        COALESCE(SUM(publisher_amount_minor),0)::text AS publisher_amount_minor
        FROM publisher_settlements WHERE status = 'posted' GROUP BY currency ORDER BY currency`,
      sql`SELECT ps.id, ps.delivery_id, ps.campaign_id, ps.gross_amount_minor::text,
        ps.platform_fee_minor::text, ps.publisher_amount_minor::text, ps.currency,
        ps.fee_policy_bps, ps.created_at, u.email AS publisher_email
        FROM publisher_settlements ps JOIN users u ON u.id = ps.publisher_id
        ORDER BY ps.created_at DESC LIMIT 100`
    ]);
    return NextResponse.json({ policy: policy[0] || null, totals, recent });
  } catch (error) {
    console.error("Publisher settlement overview failed", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "Could not load publisher settlement overview." }, { status: 503 });
  }
}

import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { getSessionUser } from "@/lib/auth";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (user.role !== "audience_owner") return NextResponse.json({ error: "Publisher access required." }, { status: 403 });
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
  try {
    const sql = neon(process.env.DATABASE_URL);
    const [balances, settlements] = await Promise.all([
      sql`SELECT currency,
        COALESCE(SUM(amount_minor) FILTER (WHERE entry_type = 'earning'),0)::text AS gross_earnings_minor,
        COALESCE(SUM(amount_minor) FILTER (WHERE entry_type = 'withdrawal'),0)::text AS withdrawn_minor,
        COALESCE(SUM(amount_minor) FILTER (WHERE entry_type = 'fee'),0)::text AS fees_minor
        FROM ledger_entries WHERE user_id = ${user.id} GROUP BY currency ORDER BY currency`,
      sql`SELECT s.id, s.delivery_id, s.campaign_id, s.gross_amount_minor::text,
        s.platform_fee_minor::text, s.publisher_amount_minor::text, s.currency,
        s.fee_policy_bps, s.created_at
        FROM publisher_settlements s
        WHERE s.publisher_id = ${user.id} AND s.status = 'posted'
        ORDER BY s.created_at DESC LIMIT 100`
    ]);
    const summary = balances.map(row => ({
      ...row,
      available_earnings_minor: (BigInt(row.gross_earnings_minor) - BigInt(row.withdrawn_minor) - BigInt(row.fees_minor)).toString()
    }));
    return NextResponse.json({ summary, settlements });
  } catch (error) {
    console.error("Publisher earnings read failed", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "Could not load publisher earnings. Confirm the settlement migrations are applied." }, { status: 503 });
  }
}

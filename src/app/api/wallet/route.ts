import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { getSessionUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Sign in to view your transactions." }, { status: 401 });
    if (user.role === "admin") return NextResponse.json({ error: "Platform administrators do not have a customer wallet." }, { status: 403 });
    if (!process.env.DATABASE_URL) return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
    const sql = neon(process.env.DATABASE_URL);
    const [summary, entries] = await Promise.all([
      sql`SELECT currency,
        COALESCE(SUM(CASE WHEN entry_type IN ('deposit','earning','refund') THEN amount_minor WHEN entry_type IN ('reserve','delivery_charge','fee','withdrawal') THEN -amount_minor ELSE 0 END),0)::text AS net_minor,
        COALESCE(SUM(amount_minor) FILTER (WHERE entry_type='deposit'),0)::text AS deposits_minor,
        COALESCE(SUM(amount_minor) FILTER (WHERE entry_type='earning'),0)::text AS earnings_minor,
        COALESCE(SUM(amount_minor) FILTER (WHERE entry_type='reserve'),0)::text AS reserved_minor,
        COALESCE(SUM(amount_minor) FILTER (WHERE entry_type='withdrawal'),0)::text AS withdrawn_minor
      FROM ledger_entries WHERE user_id=${user.id} GROUP BY currency ORDER BY currency`,
      sql`SELECT id, campaign_id, entry_type, amount_minor::text, currency, reference, metadata, created_at
        FROM ledger_entries WHERE user_id=${user.id} ORDER BY created_at DESC LIMIT 100`
    ]);
    return NextResponse.json({ role: user.role, summary, entries });
  } catch (error) {
    console.error("Wallet read failed", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "Could not load your transaction history." }, { status: 503 });
  }
}

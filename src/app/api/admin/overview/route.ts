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
    const [users, listings, campaigns, payments, reconciliation] = await Promise.all([
      sql`SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE status='active')::int AS active, COUNT(*) FILTER (WHERE status='suspended')::int AS suspended FROM users`,
      sql`SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE status='pending_review')::int AS pending, COUNT(*) FILTER (WHERE status='approved')::int AS approved FROM audience_lists`,
      sql`SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE status='pending_owner_approval')::int AS pending, COUNT(*) FILTER (WHERE status='running')::int AS running, COUNT(*) FILTER (WHERE status='completed')::int AS completed FROM campaigns`,
      sql`SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE status='success')::int AS successful, COUNT(*) FILTER (WHERE status='pending')::int AS pending FROM payment_events`,
      sql`
        SELECT
          currency,
          COUNT(*) FILTER (WHERE status = 'success')::int AS successful_events,
          COALESCE(SUM(amount_minor) FILTER (WHERE status = 'success'), 0)::text AS successful_amount_minor,
          COUNT(*) FILTER (
            WHERE status = 'success' AND (
              NOT EXISTS (
                SELECT 1 FROM ledger_entries le
                WHERE le.payment_event_id = payment_events.id AND le.entry_type = 'deposit'
                  AND le.user_id = payment_events.user_id AND le.campaign_id IS NOT DISTINCT FROM payment_events.campaign_id
                  AND le.amount_minor = payment_events.amount_minor AND le.currency = payment_events.currency
              )
              OR NOT EXISTS (
                SELECT 1 FROM ledger_entries le
                WHERE le.payment_event_id = payment_events.id AND le.entry_type = 'reserve'
                  AND le.user_id = payment_events.user_id AND le.campaign_id IS NOT DISTINCT FROM payment_events.campaign_id
                  AND le.amount_minor = payment_events.amount_minor AND le.currency = payment_events.currency
              )
              OR (
                SELECT COUNT(*) FROM ledger_entries le
                WHERE le.payment_event_id = payment_events.id AND le.entry_type IN ('deposit','reserve')
              ) <> 2
            )
          )::int AS successful_with_incomplete_or_mismatched_ledger,
          COUNT(*) FILTER (
            WHERE status = 'pending' AND created_at < now() - interval '30 minutes'
          )::int AS pending_over_30_minutes,
          COUNT(*) FILTER (WHERE status = 'needs_review')::int AS payments_needing_manual_review,
          COUNT(*) FILTER (
            WHERE status = 'success' AND campaign_id IS NOT NULL
              AND NOT EXISTS (
                SELECT 1 FROM campaigns c
                WHERE c.id = payment_events.campaign_id AND c.status IN ('funded','running','completed')
              )
          )::int AS successful_payment_with_unfunded_campaign
        FROM payment_events
        WHERE provider = 'paystack'
        GROUP BY currency
        ORDER BY currency
      `
    ]);
    return NextResponse.json({
      users: users[0],
      listings: listings[0],
      campaigns: campaigns[0],
      payments: payments[0],
      reconciliation,
      notice: "Payment-event totals are provider records, not bank settlement confirmation. Reconciliation flags successful payments with missing, duplicate or mismatched deposit/reserve ledger entries, successful campaign payments without a funded campaign state, pending payments older than 30 minutes, and successful-but-mismatched payments awaiting manual review."
    });
  } catch (error) {
    console.error("Admin overview failed", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "Could not load platform metrics." }, { status: 503 });
  }
}

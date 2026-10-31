import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { getSessionUser } from "@/lib/auth";
export const runtime = "nodejs";
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (user.role !== "admin") return NextResponse.json({ error: "Administrator access required." }, { status: 403 });
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
  try {
    const sql = neon(process.env.DATABASE_URL);
    const [users, listings, campaigns, payments] = await Promise.all([
      sql`SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE status='active')::int AS active, COUNT(*) FILTER (WHERE status='suspended')::int AS suspended FROM users`,
      sql`SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE status='pending_review')::int AS pending, COUNT(*) FILTER (WHERE status='approved')::int AS approved FROM audience_lists`,
      sql`SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE status='pending_owner_approval')::int AS pending, COUNT(*) FILTER (WHERE status='running')::int AS running, COUNT(*) FILTER (WHERE status='completed')::int AS completed FROM campaigns`,
      sql`SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE status='success')::int AS successful, COUNT(*) FILTER (WHERE status='pending')::int AS pending FROM payment_events`
    ]);
    return NextResponse.json({ users: users[0], listings: listings[0], campaigns: campaigns[0], payments: payments[0], notice: "Payment-event counts are records only and do not confirm provider settlement." });
  } catch (error) {
    console.error("Admin overview failed", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "Could not load platform metrics." }, { status: 503 });
  }
}
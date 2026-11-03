import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { getSessionUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    if (!process.env.DATABASE_URL) return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
    const sql = neon(process.env.DATABASE_URL);

    if (user.role === "audience_owner") {
      const [listings, campaigns, recent] = await Promise.all([
        sql`SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE status='pending_review')::int AS pending, COUNT(*) FILTER (WHERE status='approved')::int AS approved, COUNT(*) FILTER (WHERE status='rejected')::int AS rejected FROM audience_lists WHERE owner_id = ${user.id}`,
        sql`SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE c.status='pending_owner_approval')::int AS awaiting_review, COUNT(*) FILTER (WHERE c.status='approved')::int AS approved, COUNT(*) FILTER (WHERE c.status='running')::int AS running, COUNT(*) FILTER (WHERE c.status='completed')::int AS completed FROM campaigns c JOIN audience_lists a ON a.id=c.audience_list_id WHERE a.owner_id = ${user.id}`,
        sql`SELECT l.action, l.entity_type, l.created_at FROM audit_logs l WHERE l.actor_user_id = ${user.id} ORDER BY l.created_at DESC LIMIT 5`
      ]);
      return NextResponse.json({ role: user.role, listings: listings[0], campaigns: campaigns[0], recent: recent });
    }

    if (user.role === "advertiser") {
      const [campaigns, audiences, recent] = await Promise.all([
        sql`SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE status='pending_owner_approval')::int AS awaiting_approval, COUNT(*) FILTER (WHERE status='approved')::int AS approved, COUNT(*) FILTER (WHERE status='running')::int AS running, COUNT(*) FILTER (WHERE status='completed')::int AS completed, COUNT(*) FILTER (WHERE status='cancelled')::int AS cancelled FROM campaigns WHERE advertiser_id = ${user.id}`,
        sql`SELECT COUNT(*)::int AS available FROM audience_lists WHERE status='approved'`,
        sql`SELECT action, entity_type, created_at FROM audit_logs WHERE actor_user_id = ${user.id} ORDER BY created_at DESC LIMIT 5`
      ]);
      return NextResponse.json({ role: user.role, campaigns: campaigns[0], audiences: audiences[0], recent });
    }

    if (user.role === "admin") {
      const [users, listings, campaigns, payments, recent] = await Promise.all([
        sql`SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE status='active')::int AS active FROM users`,
        sql`SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE status='pending_review')::int AS pending FROM audience_lists`,
        sql`SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE status='pending_owner_approval')::int AS awaiting_approval, COUNT(*) FILTER (WHERE status='running')::int AS running FROM campaigns`,
        sql`SELECT COUNT(*) FILTER (WHERE status='success')::int AS successful, COUNT(*) FILTER (WHERE status='pending')::int AS pending FROM payment_events`,
        sql`SELECT l.action, l.entity_type, l.created_at FROM audit_logs l ORDER BY l.created_at DESC LIMIT 6`
      ]);
      return NextResponse.json({ role: user.role, users: users[0], listings: listings[0], campaigns: campaigns[0], payments: payments[0], recent });
    }
    return NextResponse.json({ error: "Unsupported account role." }, { status: 403 });
  } catch (error) {
    console.error("Dashboard overview failed", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "Could not load workspace overview." }, { status: 503 });
  }
}

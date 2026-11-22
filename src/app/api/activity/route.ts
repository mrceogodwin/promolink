import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { neon } from "@neondatabase/serverless";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Sign in to view activity." }, { status: 401 });
    if (!process.env.DATABASE_URL) return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
    const sql = neon(process.env.DATABASE_URL);
    const rows = user.role === "admin"
      ? await sql`SELECT l.id, l.action, l.entity_type, l.entity_id, l.metadata, l.created_at, u.name AS actor_name, u.email AS actor_email FROM audit_logs l LEFT JOIN users u ON u.id = l.actor_user_id ORDER BY l.created_at DESC LIMIT 100`
      : await sql`SELECT id, action, entity_type, entity_id, metadata, created_at FROM audit_logs WHERE actor_user_id = ${user.id} ORDER BY created_at DESC LIMIT 100`;
    return NextResponse.json({ activity: rows });
  } catch (error) {
    console.error("Activity history read failed", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "Could not load activity history." }, { status: 503 });
  }
}

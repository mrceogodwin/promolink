import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { getSessionUser } from "@/lib/auth";

export const runtime = "nodejs";
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET() {
  try {
    const admin = await getSessionUser();
    if (!admin) return NextResponse.json({ error: "Sign in to manage users." }, { status: 401 });
    if (admin.role !== "admin") return NextResponse.json({ error: "Administrator access is required." }, { status: 403 });
    if (!process.env.DATABASE_URL) return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
    const sql = neon(process.env.DATABASE_URL);
    const users = await sql`SELECT id, name, email, role, status, created_at, updated_at FROM users ORDER BY created_at DESC LIMIT 200`;
    return NextResponse.json({ users });
  } catch (error) {
    console.error("Admin user list failed", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "Could not load users." }, { status: 503 });
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = await getSessionUser();
    if (!admin) return NextResponse.json({ error: "Sign in to manage users." }, { status: 401 });
    if (admin.role !== "admin") return NextResponse.json({ error: "Administrator access is required." }, { status: 403 });
    const body: unknown = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: "Send valid user details." }, { status: 400 });
    const input = body as Record<string, unknown>;
    const id = typeof input.id === "string" ? input.id : "";
    const status = input.status === "active" ? "active" : input.status === "suspended" ? "suspended" : null;
    if (!uuid.test(id) || !status) return NextResponse.json({ error: "Choose a valid user and account status." }, { status: 400 });
    if (id === admin.id && status === "suspended") return NextResponse.json({ error: "You cannot suspend your own administrator account." }, { status: 400 });
    if (!process.env.DATABASE_URL) return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
    const sql = neon(process.env.DATABASE_URL);
    const rows = await sql`UPDATE users SET status = ${status}, updated_at = now() WHERE id = ${id} AND role <> 'admin' RETURNING id, name, email, role, status, created_at, updated_at`;
    if (!rows.length) return NextResponse.json({ error: "User not found or administrator accounts cannot be changed here." }, { status: 404 });
    if (status === "suspended") await sql`DELETE FROM sessions WHERE user_id = ${id}`;
    await sql`INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, metadata) VALUES (${admin.id}, ${status === "suspended" ? "user.suspended" : "user.reactivated"}, 'user', ${id}, ${JSON.stringify({ status })}::jsonb)`;
    return NextResponse.json({ user: rows[0] });
  } catch (error) {
    console.error("Admin user update failed", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "Could not update user status." }, { status: 503 });
  }
}

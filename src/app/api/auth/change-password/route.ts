import { NextResponse } from "next/server";
import { getSessionUser, hashPassword, verifyPassword, consumeRateLimit } from "@/lib/auth";
import { neon } from "@neondatabase/serverless";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Sign in to change your password." }, { status: 401 });
    const body: unknown = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Send valid password details." }, { status: 400 });
    }
    const input = body as Record<string, unknown>;
    const currentPassword = typeof input.currentPassword === "string" ? input.currentPassword : "";
    const newPassword = typeof input.newPassword === "string" ? input.newPassword : "";
    if (!currentPassword || currentPassword.length > 128) return NextResponse.json({ error: "Enter your current password." }, { status: 400 });
    if (newPassword.length < 10 || newPassword.length > 128) return NextResponse.json({ error: "Your new password must be 10–128 characters." }, { status: 400 });
    if (currentPassword === newPassword) return NextResponse.json({ error: "Choose a password different from your current one." }, { status: 400 });
    if (!process.env.DATABASE_URL) return NextResponse.json({ error: "Authentication is not configured." }, { status: 503 });
    const sql = neon(process.env.DATABASE_URL);
    const allowed = await consumeRateLimit("password-change", user.id, 5, 3600);
    if (!allowed) return NextResponse.json({ error: "Too many password-change attempts. Try again later." }, { status: 429 });
    const rows = await sql`SELECT password_hash FROM users WHERE id = ${user.id} AND status = 'active' LIMIT 1`;
    const record = rows[0] as { password_hash: string } | undefined;
    if (!record || !(await verifyPassword(currentPassword, record.password_hash))) {
      return NextResponse.json({ error: "Your current password is incorrect." }, { status: 403 });
    }
    const passwordHash = await hashPassword(newPassword);
    await sql`UPDATE users SET password_hash = ${passwordHash}, updated_at = now() WHERE id = ${user.id}`;
    await sql`DELETE FROM sessions WHERE user_id = ${user.id}`;
    await sql`INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, metadata) VALUES (${user.id}, 'password.changed', 'user', ${user.id}, '{}'::jsonb)`;
    return NextResponse.json({ ok: true, message: "Password updated. Sign in again with your new password." });
  } catch (error) {
    console.error("Password change failed", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "Could not change your password. Please try again later." }, { status: 503 });
  }
}

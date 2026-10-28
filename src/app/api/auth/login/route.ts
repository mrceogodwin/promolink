import { NextResponse } from "next/server";
import { consumeRateLimit, createSession, normalizeEmail, verifyPassword } from "@/lib/auth";
import { neon } from "@neondatabase/serverless";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Send valid login details." }, { status: 400 });
    }
    const input = body as Record<string, unknown>;
    const email = typeof input.email === "string" ? normalizeEmail(input.email) : "";
    const password = typeof input.password === "string" ? input.password : "";
    if (!email || !password || email.length > 254 || password.length > 128) {
      return NextResponse.json({ error: "Enter your email and password." }, { status: 400 });
    }
    if (!process.env.DATABASE_URL) return NextResponse.json({ error: "Authentication is not configured." }, { status: 503 });
    const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
    try {
      const emailAllowed = await consumeRateLimit("login-email", email, 8, 900);
      const ipAllowed = await consumeRateLimit("login-ip", forwarded, 30, 900);
      if (!emailAllowed || !ipAllowed) return NextResponse.json({ error: "Too many attempts. Wait 15 minutes before trying again." }, { status: 429 });
    } catch {
      return NextResponse.json({ error: "Authentication security checks are unavailable. Try again later." }, { status: 503 });
    }
    const sql = neon(process.env.DATABASE_URL);
    const rows = await sql`SELECT id, name, email, role, status, password_hash FROM users WHERE email = ${email} LIMIT 1`;
    const user = rows[0] as { id: string; name: string; email: string; role: string; status: string; password_hash: string } | undefined;
    if (!user || user.status !== "active" || !(await verifyPassword(password, user.password_hash))) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }
    await createSession(user.id);
    return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    console.error("Login failed", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "Could not log in. Confirm the database migration has been applied." }, { status: 500 });
  }
}

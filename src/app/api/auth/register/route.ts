import { NextResponse } from "next/server";
import { createSession, hashPassword, normalizeEmail } from "@/lib/auth";
import { neon } from "@neondatabase/serverless";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Send valid account details." }, { status: 400 });
    }
    const input = body as Record<string, unknown>;
    const name = typeof input.name === "string" ? input.name.trim() : "";
    const email = typeof input.email === "string" ? normalizeEmail(input.email) : "";
    const password = typeof input.password === "string" ? input.password : "";
    const role = input.role === "advertiser" ? "advertiser" : input.role === "audience_owner" ? "audience_owner" : null;

    if (name.length < 2 || name.length > 120) return NextResponse.json({ error: "Enter your full name." }, { status: 400 });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    if (password.length < 10 || password.length > 128) return NextResponse.json({ error: "Password must be 10–128 characters." }, { status: 400 });
    if (!role) return NextResponse.json({ error: "Choose an account type." }, { status: 400 });
    if (!process.env.DATABASE_URL) return NextResponse.json({ error: "Authentication is not configured." }, { status: 503 });

    const sql = neon(process.env.DATABASE_URL);
    const passwordHash = await hashPassword(password);
    const rows = await sql`
      INSERT INTO users (name, email, password_hash, role)
      VALUES (${name}, ${email}, ${passwordHash}, ${role})
      ON CONFLICT (email) DO NOTHING
      RETURNING id, name, email, role, status
    `;
    if (!rows.length) return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    const user = rows[0] as { id: string; name: string; email: string; role: string; status: string };
    await createSession(user.id);
    return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } }, { status: 201 });
  } catch (error) {
    console.error("Registration failed", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "Could not create account. Confirm the database migration has been applied." }, { status: 500 });
  }
}

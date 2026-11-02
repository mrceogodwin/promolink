import { NextResponse } from "next/server";
import { consumeRateLimit, normalizeEmail } from "@/lib/auth";
import { neon } from "@neondatabase/serverless";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Enter your email address to join." }, { status: 400 });
    }
    const input = body as Record<string, unknown>;
    const email = typeof input.email === "string" ? normalizeEmail(input.email) : "";
    const name = typeof input.name === "string" ? input.name.trim().slice(0, 120) : "";
    const interest = ["audience_owner", "advertiser", "both"].includes(String(input.interest))
      ? String(input.interest)
      : "both";

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: "The waitlist is temporarily unavailable. Please try again shortly." }, { status: 503 });
    }
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || request.headers.get("x-real-ip") || "unknown";
    const allowed = await consumeRateLimit("waitlist-ip", ip, 8, 3600);
    if (!allowed) return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });

    const sql = neon(process.env.DATABASE_URL);
    const rows = await sql`
      INSERT INTO waitlist (email, name, interest)
      VALUES (${email}, ${name || null}, ${interest})
      ON CONFLICT (email) DO NOTHING
      RETURNING id
    `;
    return NextResponse.json(
      { success: true, alreadyJoined: rows.length === 0, message: rows.length ? "You're on the list. We'll be in touch." : "You're already on the list. We'll be in touch." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Waitlist signup failed", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "We couldn't save your details. Please try again." }, { status: 500 });
  }
}

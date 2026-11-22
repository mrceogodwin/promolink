import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { consumeRateLimit, normalizeEmail } from "@/lib/auth";
import { sameOriginError } from "@/lib/request-security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function matchesSecret(provided: string, expected: string) {
  const left = createHash("sha256").update(provided).digest();
  const right = createHash("sha256").update(expected).digest();
  return timingSafeEqual(left, right);
}

// This endpoint can promote exactly one existing account, exactly once.
// It is intentionally not linked from the public UI and requires a deployment secret.
export async function POST(request: Request) {
  const originError = sameOriginError(request);
  if (originError) return originError;

  const expectedSecret = process.env.ADMIN_BOOTSTRAP_SECRET || "";
  const providedSecret = request.headers.get("x-admin-bootstrap-secret") || "";
  if (expectedSecret.length < 32 || !providedSecret || !matchesSecret(providedSecret, expectedSecret)) {
    return NextResponse.json({ error: "Administrator bootstrap is unavailable or unauthorized." }, { status: 404 });
  }

  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  try {
    if (!(await consumeRateLimit("admin-bootstrap-ip", forwarded, 3, 3600))) {
      return NextResponse.json({ error: "Too many bootstrap attempts. Try again later." }, { status: 429 });
    }
  } catch {
    return NextResponse.json({ error: "Bootstrap security checks are unavailable." }, { status: 503 });
  }

  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Send the email address of an existing account." }, { status: 400 });
  }
  const email = typeof (body as Record<string, unknown>).email === "string"
    ? normalizeEmail((body as Record<string, unknown>).email as string)
    : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return NextResponse.json({ error: "Enter a valid existing account email." }, { status: 400 });
  }
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
  }

  try {
    const sql = neon(process.env.DATABASE_URL);
    const rows = await sql`
      WITH target AS MATERIALIZED (
        SELECT id FROM users
        WHERE email = ${email} AND status = 'active' AND role <> 'admin'
        LIMIT 1
      ),
      claimed AS (
        UPDATE admin_bootstrap_state
        SET consumed_at = now(), consumed_by_user_id = (SELECT id FROM target)
        WHERE id = 1
          AND consumed_at IS NULL
          AND EXISTS (SELECT 1 FROM target)
          AND NOT EXISTS (SELECT 1 FROM users WHERE role = 'admin')
        RETURNING consumed_by_user_id
      ),
      promoted AS (
        UPDATE users u
        SET role = 'admin', updated_at = now()
        FROM claimed c
        WHERE u.id = c.consumed_by_user_id
        RETURNING u.id, u.name, u.email, u.role, u.status
      ),
      logged AS (
        INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
        SELECT id, 'admin.first_account_bootstrapped', 'user', id::text,
          jsonb_build_object('method', 'one_time_secret', 'email', email)
        FROM promoted
        RETURNING entity_id
      )
      SELECT p.id, p.name, p.email, p.role, p.status
      FROM promoted p
      JOIN logged l ON l.entity_id = p.id::text
    `;
    if (!rows.length) {
      return NextResponse.json({ error: "Bootstrap has already been used, an administrator already exists, or the account was not found/active." }, { status: 409 });
    }
    return NextResponse.json({
      user: rows[0],
      message: "The first administrator account has been provisioned. Sign out and sign back in to refresh the account role."
    }, { status: 201 });
  } catch (error) {
    console.error("Administrator bootstrap failed", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "Could not provision the administrator. Confirm migration 014 is applied." }, { status: 503 });
  }
}

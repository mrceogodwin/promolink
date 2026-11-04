import { sameOriginError } from "@/lib/request-security";
import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { getSessionUser } from "@/lib/auth";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (user.role !== "audience_owner") return NextResponse.json({ error: "Publisher access required." }, { status: 403 });
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
  try {
    const sql = neon(process.env.DATABASE_URL);
    const requests = await sql`SELECT id, amount_minor::text, currency, status, publisher_note,
      admin_note, created_at, reviewed_at, paid_at, external_reference
      FROM publisher_withdrawal_requests
      WHERE publisher_id = ${user.id}
      ORDER BY created_at DESC LIMIT 100`;
    return NextResponse.json({ requests });
  } catch (error) {
    console.error("Publisher withdrawal request read failed", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "Could not load withdrawal requests. Confirm migration 011 is applied." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const originError = sameOriginError(request);
  if (originError) return originError;
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (user.role !== "audience_owner") return NextResponse.json({ error: "Publisher access required." }, { status: 403 });
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
  const raw = await request.text();
  if (Buffer.byteLength(raw, "utf8") > 4096) return NextResponse.json({ error: "Request body is too large." }, { status: 413 });
  let body: { amount_minor?: unknown; currency?: unknown; note?: unknown };
  try { body = JSON.parse(raw); } catch { return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 }); }
  const amount = body.amount_minor;
  const currency = typeof body.currency === "string" ? body.currency.trim().toUpperCase() : "";
  const note = typeof body.note === "string" ? body.note.trim() : "";
  if (typeof amount !== "number" || !Number.isSafeInteger(amount) || amount <= 0 || amount > 1000000000000) return NextResponse.json({ error: "Enter a valid withdrawal amount in minor currency units." }, { status: 400 });
  if (!/^[A-Z]{3}$/.test(currency)) return NextResponse.json({ error: "Enter a valid three-letter currency code." }, { status: 400 });
  if (note.length > 500) return NextResponse.json({ error: "The note must be 500 characters or fewer." }, { status: 400 });
  try {
    const sql = neon(process.env.DATABASE_URL);
    const rows = await sql`
      WITH locked_user AS (
        SELECT id FROM users WHERE id = ${user.id} AND status = 'active' FOR UPDATE
      ),
      balance AS (
        SELECT ${user.id}::uuid AS publisher_id, ${Number(amount)}::bigint AS requested_minor, ${currency}::char(3) AS currency,
          COALESCE((SELECT SUM(amount_minor) FROM ledger_entries
            WHERE user_id = ${user.id} AND currency = ${currency} AND entry_type = 'earning'),0)
          - COALESCE((SELECT SUM(amount_minor) FROM ledger_entries
            WHERE user_id = ${user.id} AND currency = ${currency} AND entry_type IN ('withdrawal','fee')),0)
          - COALESCE((SELECT SUM(amount_minor) FROM publisher_withdrawal_requests
            WHERE publisher_id = ${user.id} AND currency = ${currency} AND status IN ('requested','approved')),0)
          AS available_minor
        FROM locked_user
      )
      INSERT INTO publisher_withdrawal_requests (publisher_id,amount_minor,currency,publisher_note)
      SELECT publisher_id,requested_minor,currency,${note}
      FROM balance WHERE available_minor >= requested_minor
      RETURNING id,amount_minor::text,currency,status,publisher_note,created_at
    `;
    if (!rows.length) return NextResponse.json({ error: "Insufficient available earnings, or your account is not active. Pending and approved requests are already reserved against your available balance." }, { status: 409 });
    return NextResponse.json({ request: rows[0], message: "Withdrawal request submitted for administrator review. No money has been transferred." }, { status: 201 });
  } catch (error) {
    console.error("Publisher withdrawal request failed", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "Could not submit withdrawal request. Confirm migration 011 is applied." }, { status: 503 });
  }
}

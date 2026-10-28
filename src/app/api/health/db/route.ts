import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    return NextResponse.json(
      { ok: false, database: "neon", error: "Database is not configured." },
      { status: 503 },
    );
  }

  try {
    const sql = neon(databaseUrl);
    const rows = await sql`SELECT current_database() AS database_name, now() AS checked_at`;

    return NextResponse.json({
      ok: true,
      provider: "neon",
      database: rows[0]?.database_name ?? "connected",
      checkedAt: rows[0]?.checked_at ?? null,
    });
  } catch {
    // Do not return connection details, SQL errors, or credentials to clients.
    return NextResponse.json(
      { ok: false, provider: "neon", error: "Database connection failed." },
      { status: 503 },
    );
  }
}

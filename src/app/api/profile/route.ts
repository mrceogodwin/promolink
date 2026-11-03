import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { neon } from "@neondatabase/serverless";

export const runtime = "nodejs";

export async function PATCH(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Sign in to update your profile." }, { status: 401 });
    const body: unknown = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: "Send valid profile details." }, { status: 400 });
    const input = body as Record<string, unknown>;
    const name = typeof input.name === "string" ? input.name.trim().replace(/\\s+/g, " ") : "";
    if (name.length < 2 || name.length > 120) return NextResponse.json({ error: "Name must be between 2 and 120 characters." }, { status: 400 });
    if (!process.env.DATABASE_URL) return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
    const sql = neon(process.env.DATABASE_URL);
    const rows = await sql`
      WITH updated AS (
        UPDATE users
        SET name = ${name}, updated_at = now()
        WHERE id = ${user.id} AND status = 'active'
        RETURNING id, name, email, role
      ),
      logged AS (
        INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
        SELECT ${user.id}, 'profile.updated', 'user', id,
          jsonb_build_object('fields', jsonb_build_array('name'))
        FROM updated
        RETURNING entity_id
      )
      SELECT u.id, u.name, u.email, u.role
      FROM updated u
      INNER JOIN logged l ON l.entity_id = u.id
    `;
    if (!rows.length) return NextResponse.json({ error: "Active account not found." }, { status: 404 });
    return NextResponse.json({ user: rows[0], message: "Profile updated." });
  } catch (error) {
    console.error("Profile update failed", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "Could not update profile. Please try again." }, { status: 503 });
  }
}

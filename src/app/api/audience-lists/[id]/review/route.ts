import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { getSessionUser } from "@/lib/auth";

export const runtime = "nodejs";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Sign in to review listings." }, { status: 401 });
    if (user.role !== "admin") return NextResponse.json({ error: "Administrator access is required." }, { status: 403 });
    const { id } = await context.params;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
      return NextResponse.json({ error: "Invalid listing ID." }, { status: 400 });
    }
    const body: unknown = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: "Send a valid review decision." }, { status: 400 });
    const input = body as Record<string, unknown>;
    const status = input.status === "approved" ? "approved" : input.status === "rejected" ? "rejected" : null;
    const reviewNotes = typeof input.review_notes === "string" ? input.review_notes.trim() : "";
    if (!status) return NextResponse.json({ error: "Choose approve or reject." }, { status: 400 });
    if (reviewNotes.length > 1000) return NextResponse.json({ error: "Review notes must be under 1,000 characters." }, { status: 400 });
    if (!process.env.DATABASE_URL) return NextResponse.json({ error: "Database is not configured." }, { status: 503 });

    const sql = neon(process.env.DATABASE_URL);
    // The update and audit record commit as one PostgreSQL statement. A listing
    // can only be reviewed while it is awaiting its first administrator decision.
    const rows = await sql`
      WITH updated AS (
        UPDATE audience_lists
        SET status = ${status},
            review_notes = ${reviewNotes || null},
            reviewed_by = ${user.id},
            reviewed_at = now(),
            updated_at = now()
        WHERE id = ${id} AND status = 'pending_review'
        RETURNING id, title, status, review_notes, reviewed_at
      ),
      logged AS (
        INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
        SELECT ${user.id},
               CASE WHEN updated.status = 'approved'
                 THEN 'audience_listing_approved'
                 ELSE 'audience_listing_rejected'
               END,
               'audience_list',
               updated.id,
               ${JSON.stringify({ review_notes: reviewNotes || null })}::jsonb
        FROM updated
        RETURNING entity_id
      )
      SELECT updated.id, updated.title, updated.status, updated.review_notes, updated.reviewed_at
      FROM updated
      INNER JOIN logged ON logged.entity_id = updated.id
    `;
    if (!rows.length) return NextResponse.json({ error: "Listing not found or it has already been reviewed." }, { status: 404 });
    return NextResponse.json({ listing: rows[0] });
  } catch (error) {
    console.error("Audience listing review failed", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "Could not review listing. Confirm the database migration is applied." }, { status: 500 });
  }
}

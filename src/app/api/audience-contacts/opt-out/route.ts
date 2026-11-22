import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { getSessionUser } from "@/lib/auth";
import { sameOriginError } from "@/lib/request-security";
import { hashAudiencePhone, normalizeE164 } from "@/lib/audience-contacts/crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const originError = sameOriginError(request);
  if (originError) return originError;
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in to manage suppression." }, { status: 401 });
  if (user.role !== "audience_owner") return NextResponse.json({ error: "Only audience owners can manage contacts." }, { status: 403 });
  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: "Send a valid opt-out request." }, { status: 400 });
  try {
    const phone = normalizeE164((body as Record<string, unknown>).phone);
    const phoneHash = hashAudiencePhone(phone);
    if (!process.env.DATABASE_URL) return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
    const sql = neon(process.env.DATABASE_URL);
    const result = await sql`
      WITH suppression AS (
        INSERT INTO audience_contact_suppressions (owner_id, phone_hash, reason, source)
        VALUES (${user.id}, ${phoneHash}, 'user_opt_out', 'owner_dashboard')
        ON CONFLICT (owner_id, phone_hash) DO UPDATE SET
          reason = 'user_opt_out', source = 'owner_dashboard', suppressed_at = now()
        RETURNING phone_hash
      ),
      withdrawn AS (
        UPDATE audience_contacts
        SET consent_status = 'withdrawn',
            opted_out_at = now(),
            phone_ciphertext = '',
            updated_at = now()
        WHERE owner_id = ${user.id} AND phone_hash = ${phoneHash}
          AND consent_status = 'opted_in'
        RETURNING id
      )
      SELECT (SELECT COUNT(*)::int FROM withdrawn) AS withdrawn_count
      FROM suppression
    `;
    await sql`
      INSERT INTO audit_logs (actor_user_id, action, entity_type, metadata)
      VALUES (${user.id}, 'audience_contact_opted_out', 'audience_contact',
        jsonb_build_object('withdrawn_count', ${Number(result[0]?.withdrawn_count ?? 0)}))
    `;
    return NextResponse.json({ suppressed: true, withdrawn_from_lists: Number(result[0]?.withdrawn_count ?? 0) });
  } catch (error) {
    console.error("Audience contact opt-out failed", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "Could not apply opt-out. Check lookup-key configuration and migration 013." }, { status: 503 });
  }
}

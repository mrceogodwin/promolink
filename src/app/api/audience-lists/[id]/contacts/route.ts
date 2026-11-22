import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { getSessionUser, consumeRateLimit } from "@/lib/auth";
import { sameOriginError } from "@/lib/request-security";
import { encryptAudiencePhone, hashAudiencePhone, normalizeE164 } from "@/lib/audience-contacts/crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(_request: Request, context: Context) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in to manage audience contacts." }, { status: 401 });
  if (user.role !== "audience_owner") return NextResponse.json({ error: "Only audience owners can manage contacts." }, { status: 403 });
  const { id } = await context.params;
  if (!UUID.test(id)) return NextResponse.json({ error: "Invalid audience listing." }, { status: 400 });
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
  try {
    const sql = neon(process.env.DATABASE_URL);
    const rows = await sql`
      SELECT a.id,
        COUNT(c.id)::int AS total_contacts,
        COUNT(c.id) FILTER (WHERE c.consent_status = 'opted_in')::int AS consented_contacts,
        COUNT(c.id) FILTER (WHERE c.consent_status = 'withdrawn')::int AS withdrawn_contacts
      FROM audience_lists a
      LEFT JOIN audience_contacts c ON c.audience_list_id = a.id AND c.owner_id = a.owner_id
      WHERE a.id = ${id} AND a.owner_id = ${user.id}
      GROUP BY a.id
    `;
    if (!rows.length) return NextResponse.json({ error: "Audience listing not found." }, { status: 404 });
    return NextResponse.json({ contacts: rows[0], privacy: "Recipient phone numbers are never returned by this endpoint." });
  } catch (error) {
    console.error("Audience contact summary failed", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "Could not load contact summary. Migration 013 may not yet be applied." }, { status: 503 });
  }
}

export async function POST(request: Request, context: Context) {
  const originError = sameOriginError(request);
  if (originError) return originError;
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in to import audience contacts." }, { status: 401 });
  if (user.role !== "audience_owner") return NextResponse.json({ error: "Only audience owners can import contacts." }, { status: 403 });
  const { id } = await context.params;
  if (!UUID.test(id)) return NextResponse.json({ error: "Invalid audience listing." }, { status: 400 });
  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: "Send a valid contact import." }, { status: 400 });
  const input = body as Record<string, unknown>;
  if (input.consent_confirmed !== true) {
    return NextResponse.json({ error: "Confirm that every imported person explicitly opted in to receive WhatsApp marketing messages." }, { status: 400 });
  }
  const source = typeof input.consent_source === "string" ? input.consent_source.trim() : "";
  if (source.length < 2 || source.length > 120) return NextResponse.json({ error: "Provide the consent collection source (2–120 characters)." }, { status: 400 });
  if (!Array.isArray(input.contacts) || input.contacts.length < 1 || input.contacts.length > 500) {
    return NextResponse.json({ error: "Import between 1 and 500 contacts per batch." }, { status: 400 });
  }
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
  try {
    if (!(await consumeRateLimit("audience_contact_import", user.id, 10, 3600))) {
      return NextResponse.json({ error: "Import limit reached. Try again later." }, { status: 429 });
    }
    const sql = neon(process.env.DATABASE_URL);
    const owned = await sql`SELECT id FROM audience_lists WHERE id = ${id} AND owner_id = ${user.id} LIMIT 1`;
    if (!owned.length) return NextResponse.json({ error: "Audience listing not found." }, { status: 404 });

    let inserted = 0;
    let duplicates = 0;
    let suppressed = 0;
    let invalid = 0;
    for (const item of input.contacts) {
      if (!item || typeof item !== "object" || Array.isArray(item)) { invalid++; continue; }
      const contact = item as Record<string, unknown>;
      try {
        const phone = normalizeE164(contact.phone);
        const obtainedAt = typeof contact.consent_obtained_at === "string" ? new Date(contact.consent_obtained_at) : new Date();
        if (!Number.isFinite(obtainedAt.getTime()) || obtainedAt.getTime() > Date.now() + 60000) { invalid++; continue; }
        const evidenceRef = typeof contact.consent_evidence_ref === "string" ? contact.consent_evidence_ref.trim().slice(0, 255) : null;
        const phoneHash = hashAudiencePhone(phone);
        const blocked = await sql`SELECT 1 FROM audience_contact_suppressions WHERE owner_id = ${user.id} AND phone_hash = ${phoneHash} LIMIT 1`;
        if (blocked.length) { suppressed++; continue; }
        const encrypted = encryptAudiencePhone(phone);
        const result = await sql`
          INSERT INTO audience_contacts
            (audience_list_id, owner_id, phone_ciphertext, phone_hash, encryption_key_version,
             consent_status, consent_source, consent_obtained_at, consent_evidence_ref)
          VALUES
            (${id}, ${user.id}, ${encrypted.ciphertext}, ${phoneHash}, ${encrypted.keyVersion},
             'opted_in', ${source}, ${obtainedAt.toISOString()}, ${evidenceRef})
          ON CONFLICT (audience_list_id, phone_hash) DO NOTHING
          RETURNING id
        `;
        if (result.length) inserted++; else duplicates++;
      } catch {
        invalid++;
      }
    }
    await sql`
      INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
      VALUES (${user.id}, 'audience_contacts_imported', 'audience_list', ${id},
        jsonb_build_object('inserted', ${inserted}, 'duplicates', ${duplicates}, 'suppressed', ${suppressed}, 'invalid', ${invalid}))
    `;
    return NextResponse.json({ inserted, duplicates, suppressed, invalid, total_received: input.contacts.length }, { status: 201 });
  } catch (error) {
    console.error("Audience contact import failed", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "Could not import contacts. Check encryption configuration and confirm migration 013 is applied." }, { status: 503 });
  }
}

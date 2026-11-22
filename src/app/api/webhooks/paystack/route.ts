import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const runtime = "nodejs";

async function readLimitedBody(request: Request, maxBytes: number): Promise<string | null> {
  if (!request.body) return "";
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return new TextDecoder().decode(bytes);
}

export async function POST(request: Request) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret || !process.env.DATABASE_URL) {
    return NextResponse.json({ error: "Webhook is not configured." }, { status: 503 });
  }

  const signature = request.headers.get("x-paystack-signature") || "";
  const declaredLength = Number(request.headers.get("content-length") || "0");
  if (declaredLength > 65_536) return NextResponse.json({ error: "Webhook payload is too large." }, { status: 413 });
  const raw = await readLimitedBody(request, 65_536);
  if (raw === null) return NextResponse.json({ error: "Webhook payload is too large." }, { status: 413 });
  const expected = createHmac("sha512", secret).update(raw).digest();
  let supplied: Buffer;
  try {
    supplied = Buffer.from(signature, "hex");
  } catch {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  try {
    const event = JSON.parse(raw) as {
      event?: string;
      data?: { reference?: string; amount?: number; currency?: string; status?: string };
    };
    const reference = event.data?.reference;
    const reportedAmount = Number.isFinite(Number(event.data?.amount)) ? Number(event.data?.amount) : null;
    if (!reference || !["charge.success", "charge.failed"].includes(event.event || "")) {
      return NextResponse.json({ received: true });
    }

    const sql = neon(process.env.DATABASE_URL);
    const payments = await sql`
      SELECT id, campaign_id, user_id, amount_minor, currency, status
      FROM payment_events
      WHERE provider = 'paystack' AND provider_reference = ${reference}
      LIMIT 1
    `;
    const payment = payments[0];
    if (!payment) return NextResponse.json({ error: "Payment reference not found." }, { status: 404 });
    if (payment.status === "success") return NextResponse.json({ received: true, duplicate: true });
    if (payment.status !== "pending") return NextResponse.json({ received: true, ignored: true });

    if (event.event === "charge.success") {
      if (
        event.data?.status !== "success" ||
        Number(event.data?.amount) !== Number(payment.amount_minor) ||
        event.data?.currency !== payment.currency
      ) {
        // A successful provider charge with an unexpected amount/currency is
        // money received but not safely attributable. Hold it for manual review;
        // never mark it failed or release the campaign for a second charge.
        await sql`
          WITH held AS (
            UPDATE payment_events
            SET status = 'needs_review',
                raw_event = jsonb_build_object(
                  'event', 'charge.success',
                  'reference', ${reference},
                  'reported_amount_minor', ${reportedAmount},
                  'reported_currency', ${typeof event.data?.currency === "string" ? event.data.currency.slice(0, 3) : null},
                  'reason', 'amount_or_currency_mismatch'
                ),
                updated_at = now()
            WHERE id = ${payment.id} AND status = 'pending'
            RETURNING campaign_id, user_id, provider_reference
          )
          INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
          SELECT p.user_id, 'campaign_payment_needs_manual_review', 'campaign', p.campaign_id,
            jsonb_build_object('provider', 'paystack', 'reference', p.provider_reference,
              'reason', 'amount_or_currency_mismatch')
          FROM held p
        `;
        // The mismatch has been durably held for manual review. Acknowledge it
        // to Paystack so the same successful charge is not retried indefinitely.
        return NextResponse.json({ received: true, needs_review: true });
      }

      // Payment confirmation, ledger posting, campaign funding and audit history
      // commit together. A webhook retry cannot leave a paid event without its
      // corresponding ledger entry or funded campaign transition.
      const posted = await sql`
        WITH confirmed AS (
          UPDATE payment_events
          SET status = 'success', raw_event = jsonb_build_object('event', 'charge.success', 'reference', ${reference}, 'amount_minor', ${Number(event.data?.amount)}, 'currency', ${payment.currency}), updated_at = now()
          WHERE id = ${payment.id} AND status = 'pending'
            AND EXISTS (
              SELECT 1 FROM campaigns c
              WHERE c.id = payment_events.campaign_id
                AND c.advertiser_id = payment_events.user_id
                AND c.status = 'pending_payment'
            )
            AND NOT EXISTS (
              SELECT 1 FROM ledger_entries le
              WHERE le.reference = 'paystack:' || payment_events.provider_reference || ':deposit'
                AND (
                  le.user_id IS DISTINCT FROM payment_events.user_id
                  OR le.campaign_id IS DISTINCT FROM payment_events.campaign_id
                  OR le.payment_event_id IS DISTINCT FROM payment_events.id
                  OR le.entry_type <> 'deposit'
                  OR le.amount_minor <> payment_events.amount_minor
                  OR le.currency <> payment_events.currency
                )
            )
            AND NOT EXISTS (
              SELECT 1 FROM ledger_entries le
              WHERE le.reference = 'paystack:' || payment_events.provider_reference || ':reserve'
                AND (
                  le.user_id IS DISTINCT FROM payment_events.user_id
                  OR le.campaign_id IS DISTINCT FROM payment_events.campaign_id
                  OR le.payment_event_id IS DISTINCT FROM payment_events.id
                  OR le.entry_type <> 'reserve'
                  OR le.amount_minor <> payment_events.amount_minor
                  OR le.currency <> payment_events.currency
                )
            )
          RETURNING id, campaign_id, user_id, amount_minor, currency, provider_reference
        ),
        deposit_ledger AS (
          INSERT INTO ledger_entries
            (user_id, campaign_id, payment_event_id, entry_type, amount_minor, currency, reference, metadata)
          SELECT user_id, campaign_id, id, 'deposit', amount_minor, currency,
            'paystack:' || provider_reference || ':deposit',
            jsonb_build_object('provider', 'paystack', 'reference', provider_reference)
          FROM confirmed
          ON CONFLICT (reference) DO NOTHING
          RETURNING id
        ),
        reserve_ledger AS (
          INSERT INTO ledger_entries
            (user_id, campaign_id, payment_event_id, entry_type, amount_minor, currency, reference, metadata)
          SELECT user_id, campaign_id, id, 'reserve', amount_minor, currency,
            'paystack:' || provider_reference || ':reserve',
            jsonb_build_object('provider', 'paystack', 'reference', provider_reference, 'purpose', 'campaign_funding')
          FROM confirmed
          ON CONFLICT (reference) DO NOTHING
          RETURNING id
        ),
        funded AS (
          UPDATE campaigns c
          SET status = 'funded', updated_at = now()
          FROM confirmed p
          WHERE c.id = p.campaign_id
            AND c.advertiser_id = p.user_id
            AND c.status = 'pending_payment'
          RETURNING c.id
        ),
        logged AS (
          INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
          SELECT p.user_id, 'campaign_payment_confirmed', 'campaign', p.campaign_id,
            jsonb_build_object(
              'provider', 'paystack',
              'reference', p.provider_reference,
              'deposit_ledger_posted', EXISTS (SELECT 1 FROM deposit_ledger),
              'campaign_reserve_posted', EXISTS (SELECT 1 FROM reserve_ledger),
              'campaign_marked_funded', EXISTS (SELECT 1 FROM funded)
            )
          FROM confirmed p
          RETURNING entity_id
        )
        SELECT p.id FROM confirmed p
        INNER JOIN logged l ON l.entity_id = p.campaign_id
      `;
      if (!posted.length) {
        console.error("Paystack confirmation deferred: campaign state or ledger reference conflict.");
        return NextResponse.json({ error: "Payment confirmation could not be safely reconciled. Please retry." }, { status: 500 });
      }
    } else {
      // Failed payment and campaign state restoration are also one statement.
      await sql`
        WITH failed AS (
          UPDATE payment_events
          SET status = 'failed', raw_event = jsonb_build_object('event', 'charge.failed', 'reference', ${reference}), updated_at = now()
          WHERE id = ${payment.id} AND status = 'pending'
          RETURNING campaign_id, user_id, provider_reference
        ),
        restored AS (
          UPDATE campaigns c
          SET status = 'approved', updated_at = now()
          FROM failed p
          WHERE c.id = p.campaign_id
            AND c.advertiser_id = p.user_id
            AND c.status = 'pending_payment'
          RETURNING c.id
        ),
        logged AS (
          INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
          SELECT p.user_id, 'campaign_payment_failed', 'campaign', p.campaign_id,
            jsonb_build_object('provider', 'paystack', 'reference', p.provider_reference,
              'campaign_restored', EXISTS (SELECT 1 FROM restored))
          FROM failed p
          RETURNING entity_id
        )
        SELECT p.campaign_id FROM failed p
        INNER JOIN logged l ON l.entity_id = p.campaign_id
      `;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Paystack webhook processing failed", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}

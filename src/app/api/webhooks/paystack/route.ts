import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
export const runtime = "nodejs";
export async function POST(request: Request) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret || !process.env.DATABASE_URL) return NextResponse.json({ error: "Webhook is not configured." }, { status: 503 });
  const signature = request.headers.get("x-paystack-signature") || "";
  const raw = await request.text();
  const expected = createHmac("sha512", secret).update(raw).digest();
  let supplied: Buffer;
  try { supplied = Buffer.from(signature, "hex"); } catch { return NextResponse.json({ error: "Invalid signature." }, { status: 401 }); }
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  try {
    const event = JSON.parse(raw) as { event?: string; data?: { reference?: string; amount?: number; currency?: string; status?: string } };
    const reference = event.data?.reference;
    if (!reference || !["charge.success", "charge.failed"].includes(event.event || "")) return NextResponse.json({ received: true });
    const sql = neon(process.env.DATABASE_URL);
    const rows = await sql`SELECT id, campaign_id, user_id, amount_minor, currency, status FROM payment_events WHERE provider = 'paystack' AND provider_reference = ${reference} LIMIT 1`;
    const payment = rows[0];
    if (!payment) return NextResponse.json({ error: "Payment reference not found." }, { status: 404 });
    if (payment.status === "success") return NextResponse.json({ received: true, duplicate: true });
    if (event.event === "charge.success") {
      if (event.data?.status !== "success" || Number(event.data?.amount) !== Number(payment.amount_minor) || event.data?.currency !== payment.currency) {
        await sql`UPDATE payment_events SET status = 'failed', raw_event = ${raw}::jsonb, updated_at = now() WHERE id = ${payment.id} AND status = 'pending'`;
        return NextResponse.json({ error: "Payment amount or currency did not match the recorded transaction." }, { status: 400 });
      }
      const posted = await sql`WITH confirmed AS (
        UPDATE payment_events SET status = 'success', raw_event = ${raw}::jsonb, updated_at = now()
        WHERE id = ${payment.id} AND status = 'pending'
        RETURNING id, campaign_id, user_id, amount_minor, currency, provider_reference
      ), ledger AS (
        INSERT INTO ledger_entries (user_id, campaign_id, payment_event_id, entry_type, amount_minor, currency, reference, metadata)
        SELECT user_id, campaign_id, id, 'deposit', amount_minor, currency,
          'paystack:' || provider_reference || ':deposit',
          jsonb_build_object('provider','paystack','reference',provider_reference)
        FROM confirmed
        ON CONFLICT (reference) DO NOTHING
        RETURNING id
      )
      SELECT confirmed.campaign_id, confirmed.user_id FROM confirmed`;
      if (posted.length) {
        await sql`UPDATE campaigns SET status = 'funded', updated_at = now() WHERE id = ${payment.campaign_id} AND advertiser_id = ${payment.user_id} AND status = 'pending_payment'`;
        await sql`INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, metadata) VALUES (${payment.user_id}, 'campaign_payment_confirmed', 'campaign', ${payment.campaign_id}, ${JSON.stringify({ provider: "paystack", reference, ledger_entry: "deposit" })}::jsonb)`;
      }
    } else {
      await sql`UPDATE payment_events SET status = 'failed', raw_event = ${raw}::jsonb, updated_at = now() WHERE id = ${payment.id} AND status = 'pending'`;
      await sql`UPDATE campaigns SET status = 'approved', updated_at = now() WHERE id = ${payment.campaign_id} AND advertiser_id = ${payment.user_id} AND status = 'pending_payment'`;
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Paystack webhook processing failed", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}
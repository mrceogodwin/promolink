import { sameOriginError } from "@/lib/request-security";
import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import { getSessionUser } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const originError = sameOriginError(request);
    if (originError) return originError;
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Sign in to fund a campaign." }, { status: 401 });
    if (user.role !== "advertiser") return NextResponse.json({ error: "Only the campaign advertiser can initiate payment." }, { status: 403 });
    const { id } = await context.params;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) return NextResponse.json({ error: "Invalid campaign ID." }, { status: 400 });
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) return NextResponse.json({ error: "Payments are not enabled yet. The payment provider has not been configured." }, { status: 503 });
    if (!process.env.DATABASE_URL) return NextResponse.json({ error: "Database is not configured." }, { status: 503 });

    const sql = neon(process.env.DATABASE_URL);
    const campaigns = await sql`SELECT id, title, budget_amount, currency FROM campaigns WHERE id = ${id} AND advertiser_id = ${user.id} LIMIT 1`;
    const campaign = campaigns[0];
    if (!campaign) return NextResponse.json({ error: "Campaign not found." }, { status: 404 });
    if (campaign.currency !== "NGN") return NextResponse.json({ error: "This payment flow currently supports NGN campaigns only." }, { status: 409 });
    const amountMinor = Math.round(Number(campaign.budget_amount) * 100);
    if (!Number.isSafeInteger(amountMinor) || amountMinor < 100) return NextResponse.json({ error: "Campaign budget is below the minimum supported amount." }, { status: 400 });

    const reference = "pl_" + randomUUID().replaceAll("-", "");
    // Reserve the campaign and create its payment event in one statement. Only
    // one concurrent request can move an approved campaign into pending_payment.
    const reserved = await sql`
      WITH claimed AS (
        UPDATE campaigns
        SET status = 'pending_payment', updated_at = now()
        WHERE id = ${id} AND advertiser_id = ${user.id} AND status = 'approved'
        RETURNING id
      ), payment AS (
        INSERT INTO payment_events
          (provider, provider_reference, user_id, campaign_id, amount_minor, currency, status, raw_event)
        SELECT 'paystack', ${reference}, ${user.id}, id, ${amountMinor}, 'NGN', 'pending', '{"initializing":true}'::jsonb
        FROM claimed
        RETURNING id
      ), logged AS (
        INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
        SELECT ${user.id}, 'campaign_payment_initializing', 'campaign', ${id},
          jsonb_build_object('provider', 'paystack', 'reference', ${reference})
        FROM payment
        RETURNING id
      )
      SELECT claimed.id FROM claimed JOIN payment ON true
    `;
    if (!reserved.length) {
      return NextResponse.json({ error: "This campaign is no longer available for funding. Refresh the campaign to see its current status." }, { status: 409 });
    }

    const origin = new URL(request.url).origin;
    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: { Authorization: "Bearer " + secret, "Content-Type": "application/json" },
      body: JSON.stringify({
        email: user.email,
        amount: amountMinor,
        currency: "NGN",
        reference,
        callback_url: origin + "/dashboard/campaigns/" + id + "?payment=return",
        metadata: { campaign_id: id, user_id: user.id },
      }),
      cache: "no-store",
    });
    const payload = await response.json().catch(() => null) as {
      status?: boolean;
      message?: string;
      data?: { authorization_url?: string; reference?: string };
    } | null;

    if (!response.ok || !payload?.status) {
      // A definitive provider rejection releases the reservation atomically.
      await sql`
        WITH failed AS (
          UPDATE payment_events
          SET status = 'failed', raw_event = jsonb_build_object('initialization_failed', true, 'provider_http_ok', ${response.ok}, 'provider_message', ${typeof payload?.message === "string" ? payload.message.slice(0, 200) : null}), updated_at = now()
          WHERE provider_reference = ${reference} AND status = 'pending'
          RETURNING campaign_id
        ), released AS (
          UPDATE campaigns SET status = 'approved', updated_at = now()
          WHERE id IN (SELECT campaign_id FROM failed) AND status = 'pending_payment'
          RETURNING id
        )
        INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
        SELECT ${user.id}, 'campaign_payment_initialization_failed', 'campaign', ${id},
          jsonb_build_object('provider', 'paystack', 'reference', ${reference}, 'campaign_released', EXISTS (SELECT 1 FROM released))
        FROM failed
      `;
      return NextResponse.json({ error: payload?.message || "Payment provider could not initialize this transaction." }, { status: 502 });
    }

    // If Paystack accepted the request but its response is incomplete, keep the
    // campaign reserved for reconciliation rather than risk a second charge.
    if (!payload.data?.authorization_url) {
      await sql`UPDATE payment_events SET raw_event = '{"initialization_response_incomplete":true}'::jsonb, updated_at = now() WHERE provider_reference = ${reference} AND status = 'pending'`;
      return NextResponse.json({ error: "Paystack may have accepted this request, but did not return a checkout link. The campaign is held for payment reconciliation; do not retry yet." }, { status: 502 });
    }

    await sql`
      WITH updated AS (
        UPDATE payment_events
        SET raw_event = '{"initialized":true}'::jsonb, updated_at = now()
        WHERE provider_reference = ${reference} AND status = 'pending'
        RETURNING campaign_id
      )
      INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
      SELECT ${user.id}, 'campaign_payment_initialized', 'campaign', ${id},
        jsonb_build_object('provider', 'paystack', 'reference', ${reference})
      FROM updated
    `;
    return NextResponse.json({ authorization_url: payload.data.authorization_url, reference });
  } catch (error) {
    // A network timeout can occur after Paystack accepted the transaction.
    // Keep the pending reservation for reconciliation; never blindly reopen it.
    console.error("Campaign payment initialization failed", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "Payment initialization could not be confirmed. The campaign is held for reconciliation; do not retry yet." }, { status: 503 });
  }
}

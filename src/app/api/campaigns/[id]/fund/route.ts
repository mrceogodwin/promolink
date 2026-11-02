import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import { getSessionUser } from "@/lib/auth";
export const runtime = "nodejs";
export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Sign in to fund a campaign." }, { status: 401 });
    if (user.role !== "advertiser") return NextResponse.json({ error: "Only the campaign advertiser can initiate payment." }, { status: 403 });
    const { id } = await context.params;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) return NextResponse.json({ error: "Invalid campaign ID." }, { status: 400 });
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) return NextResponse.json({ error: "Payments are not enabled yet. The payment provider has not been configured." }, { status: 503 });
    if (!process.env.DATABASE_URL) return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
    const sql = neon(process.env.DATABASE_URL);
    const campaigns = await sql`SELECT id, title, budget_amount, currency, status FROM campaigns WHERE id = ${id} AND advertiser_id = ${user.id} LIMIT 1`;
    const campaign = campaigns[0];
    if (!campaign) return NextResponse.json({ error: "Campaign not found." }, { status: 404 });
    if (campaign.status !== "approved") return NextResponse.json({ error: "Only approved campaigns can be funded." }, { status: 409 });
    if (campaign.currency !== "NGN") return NextResponse.json({ error: "This payment flow currently supports NGN campaigns only." }, { status: 409 });
    const amountMinor = Math.round(Number(campaign.budget_amount) * 100);
    if (!Number.isSafeInteger(amountMinor) || amountMinor < 100) return NextResponse.json({ error: "Campaign budget is below the minimum supported amount." }, { status: 400 });
    const reference = "pl_" + randomUUID().replaceAll("-", "");
    await sql`INSERT INTO payment_events (provider, provider_reference, user_id, campaign_id, amount_minor, currency, status, raw_event) VALUES ('paystack', ${reference}, ${user.id}, ${id}, ${amountMinor}, 'NGN', 'initializing', '{}'::jsonb)`;
    const origin = new URL(_request.url).origin;
    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: { Authorization: "Bearer " + secret, "Content-Type": "application/json" },
      body: JSON.stringify({ email: user.email, amount: amountMinor, currency: "NGN", reference, callback_url: origin + "/dashboard/campaigns/" + id + "?payment=return", metadata: { campaign_id: id, user_id: user.id } }),
      cache: "no-store",
    });
    const payload = await response.json().catch(() => null) as { status?: boolean; message?: string; data?: { authorization_url?: string; reference?: string } } | null;
    if (!response.ok || !payload?.status || !payload.data?.authorization_url) {
      await sql`UPDATE payment_events SET status = 'initialization_failed', raw_event = ${JSON.stringify(payload ?? {})}::jsonb, updated_at = now() WHERE provider_reference = ${reference}`;
      return NextResponse.json({ error: payload?.message || "Payment provider could not initialize this transaction." }, { status: 502 });
    }
    await sql`UPDATE payment_events SET status = 'pending', raw_event = ${JSON.stringify({ initialized: true })}::jsonb, updated_at = now() WHERE provider_reference = ${reference}`;
    await sql`UPDATE campaigns SET status = 'pending_payment', updated_at = now() WHERE id = ${id} AND advertiser_id = ${user.id} AND status = 'approved'`;
    await sql`INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, metadata) VALUES (${user.id}, 'campaign_payment_initialized', 'campaign', ${id}, ${JSON.stringify({ provider: "paystack", reference })}::jsonb)`;
    return NextResponse.json({ authorization_url: payload.data.authorization_url, reference });
  } catch (error) {
    console.error("Campaign payment initialization failed", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "Could not initialize payment. No campaign funds have been confirmed." }, { status: 503 });
  }
}
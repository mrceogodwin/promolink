import { sameOriginError } from "@/lib/request-security";
import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { getSessionUser } from "@/lib/auth";
import { createHash } from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Queue a funded campaign for an enabled channel integration.
// This endpoint deliberately does not send messages. A provider adapter and
// provider-side confirmation are required before a delivery can be submitted
// or marked delivered.
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const originError = sameOriginError(request);
  if (originError) return originError;

  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    if (user.role !== "admin") return NextResponse.json({ error: "Only platform administrators can queue campaign delivery." }, { status: 403 });
    if (!process.env.DATABASE_URL) return NextResponse.json({ error: "Database is not configured." }, { status: 503 });

    const { id } = await context.params;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
      return NextResponse.json({ error: "Invalid campaign ID." }, { status: 400 });
    }

    const sql = neon(process.env.DATABASE_URL);
    const campaigns = await sql`
      SELECT c.id, c.status, a.id AS audience_list_id, a.channel, a.status AS audience_status
      FROM campaigns c
      JOIN audience_lists a ON a.id = c.audience_list_id
      WHERE c.id = ${id}
      LIMIT 1
    `;
    const campaign = campaigns[0];
    if (!campaign) return NextResponse.json({ error: "Campaign not found." }, { status: 404 });
    if (campaign.status !== "funded") {
      return NextResponse.json({ error: "Only funded campaigns can enter the delivery queue." }, { status: 409 });
    }
    if (campaign.audience_status !== "approved") {
      return NextResponse.json({ error: "The audience listing is not currently approved." }, { status: 409 });
    }

    const integrations = await sql`
      SELECT id, provider, display_name
      FROM channel_integrations
      WHERE channel = ${campaign.channel} AND status = 'active'
      ORDER BY created_at ASC
      LIMIT 1
    `;
    if (!integrations.length) {
      return NextResponse.json({
        error: "No active delivery provider is configured for this channel. The campaign remains funded and has not been queued.",
        delivery_enabled: false,
        channel: campaign.channel
      }, { status: 409 });
    }

    const integration = integrations[0];
    const idempotencyKey = "campaign-initial-" + createHash("sha256").update(String(campaign.id)).digest("hex");
    const rows = await sql`
      WITH inserted AS (
        INSERT INTO campaign_deliveries
          (campaign_id, audience_list_id, channel, integration_id, status, idempotency_key, created_by)
        VALUES
          (${campaign.id}, ${campaign.audience_list_id}, ${campaign.channel}, ${integration.id}, 'queued', ${idempotencyKey}, ${user.id})
        ON CONFLICT (idempotency_key) DO NOTHING
        RETURNING id, campaign_id, channel, status, created_at
      ),
      existing AS (
        SELECT id, campaign_id, channel, status, created_at
        FROM campaign_deliveries
        WHERE idempotency_key = ${idempotencyKey}
      ),
      logged AS (
        INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
        SELECT ${user.id}, 'campaign_delivery_queued', 'campaign', ${campaign.id},
          jsonb_build_object('channel', ${campaign.channel}, 'provider', ${integration.provider},
            'delivery_id', COALESCE((SELECT id FROM inserted), (SELECT id FROM existing)))
        WHERE EXISTS (SELECT 1 FROM inserted)
        RETURNING id
      )
      SELECT id, campaign_id, channel, status, created_at,
        EXISTS (SELECT 1 FROM inserted) AS newly_queued
      FROM inserted
      UNION ALL
      SELECT id, campaign_id, channel, status, created_at, false AS newly_queued
      FROM existing
      WHERE NOT EXISTS (SELECT 1 FROM inserted)
      LIMIT 1
    `;
    if (!rows.length) return NextResponse.json({ error: "Could not create or retrieve the delivery queue record." }, { status: 500 });

    return NextResponse.json({
      delivery: rows[0],
      provider: integration.display_name,
      message: rows[0].newly_queued
        ? "Campaign queued. A configured provider worker must process it and return verifiable delivery evidence."
        : "This campaign already has a delivery queue record.",
      sent: false
    }, { status: rows[0].newly_queued ? 201 : 200 });
  } catch (error) {
    console.error("Campaign delivery queue failed", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "Could not queue campaign delivery. Confirm delivery orchestration migrations are applied." }, { status: 503 });
  }
}

# PromoLink WhatsApp Cloud API integration

## Current implementation

PromoLink uses Meta's official WhatsApp Cloud API. The integration is split into:

- `src/lib/whatsapp/meta-cloud-api.ts`: server-only template-message adapter.
- `src/app/api/webhooks/whatsapp/route.ts`: Meta webhook verification and signed status updates.
- `src/app/api/internal/delivery-worker/claim/route.ts` and `report/route.ts`: existing leased worker contract.

The adapter submits approved WhatsApp templates only. A successful API response means Meta accepted the submission; it is not proof of delivery. The webhook's `delivered` status is the delivery evidence.

## Required Vercel environment variables

Set these on the PromoLink Vercel project (Preview first, then Production after testing):

- `META_WHATSAPP_ACCESS_TOKEN`: a server-side access token with the required WhatsApp Business permissions.
- `META_WHATSAPP_PHONE_NUMBER_ID`: the sender phone-number ID from the WhatsApp Business Account.
- `META_GRAPH_API_VERSION`: a currently supported Graph API version in the form `vNN.N`.
- `META_APP_SECRET`: the Meta app secret used to verify `X-Hub-Signature-256`.
- `WHATSAPP_WEBHOOK_VERIFY_TOKEN`: a long random value chosen by the operator and entered in Meta's webhook configuration.
- `DELIVERY_WORKER_SECRET`: a separate long random secret for the internal delivery worker.
- `DATABASE_URL`: existing Neon connection string.

Never put these values in source control, client-side environment variables, campaign records, logs, or public API responses. Do not reuse the webhook verification token as the worker secret.

## Meta webhook configuration

Configure the callback URL as:

`https://<PromoLink-domain>/api/webhooks/whatsapp`

Use the same `WHATSAPP_WEBHOOK_VERIFY_TOKEN` value in Meta's verification-token field. Subscribe the WhatsApp Business Account to the `messages` webhook field. Meta signs POST payloads with the app secret; the route verifies that signature against the raw request body.

## Important launch blocker: recipient consent and ingestion

The current PromoLink schema intentionally has no audience contact or recipient table. Audience listings contain an estimated reach only. Campaign creation stores a title and brief; it does not store a Meta-approved template name or template variables. Therefore the current app cannot safely select real recipients or execute a live campaign.

Before activating the integration, implement a private audience-owner contact ingestion flow with all of the following:

1. Audience-owner-only upload and management; never accessible to advertisers.
2. Explicit opt-in/consent capture and proof, source, and timestamp.
3. Encrypted phone-number storage with strict access controls and retention/deletion controls.
4. Server-side audience-to-campaign mapping and consent/opt-out filtering.
5. Approved Meta marketing templates and campaign-specific template parameters.
6. Suppression/opt-out handling, rate limits, and per-owner sending limits.
7. No recipient numbers in advertiser APIs, browser payloads, logs, analytics, or delivery evidence.

Do not create or activate a `channel_integrations` row with status `active` until these safeguards and the worker integration have been implemented and tested.

## Delivery semantics and retry safety

- Store Meta's `wamid` as the provider reference for an accepted send.
- Treat accepted submission separately from delivered status.
- Apply Meta status webhooks idempotently using evidence fingerprints.
- Never blindly retry a request with an ambiguous network outcome; reconcile against Meta first.
- Do not mark a delivery successful or post publisher earnings from a send response alone.
- Verify that delivery status and settlement accounting are consistent before enabling campaign completion.

## Test sequence

1. Configure Meta's test WhatsApp Business Account and test recipient.
2. Set Preview-only environment variables in Vercel.
3. Verify Meta's webhook GET challenge succeeds.
4. Send one approved template to a consented test recipient.
5. Confirm the response returns a Meta message ID.
6. Deliver signed `sent`, `delivered`, and `failed` status events; verify idempotent evidence and state transitions.
7. Test invalid signatures, invalid verification tokens, duplicate events, and unknown message IDs.
8. Test the delivery worker with network timeouts and reconciliation before enabling retries.
9. Only after all tests pass, configure Production credentials and enable the integration.

No real message should be sent until the audience-owner consent/recipient-ingestion work is complete and the campaign copy has the required Meta template approval.

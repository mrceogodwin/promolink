# Meta WhatsApp delivery worker — implementation contract

## Status

This document is a build contract, not a claim that live sending is implemented. The current claim/report endpoints lease a delivery and record a provider result, but do not load a recipient or call Meta. The existing Meta adapter sends approved templates only.

Do not enable live campaign delivery until this contract is implemented, tested, and configured.

## Required data model changes

The current `campaign_deliveries` table represents a campaign/list/channel job, but has no recipient foreign key. A worker therefore cannot safely associate one delivery attempt with one contact or enforce one successful send per recipient.

Add a nullable `audience_contact_id UUID REFERENCES audience_contacts(id)` during migration, backfill/validate existing rows, then make it NOT NULL for WhatsApp deliveries. Add a unique constraint on `(campaign_id, audience_contact_id, channel)` to prevent duplicate recipient jobs. Keep non-WhatsApp channels unaffected until their own adapters exist.

The current `campaigns` table has title, brief, and creative_url but no Meta-approved template selection. Add explicit campaign template fields (template name and language) or an immutable campaign creative snapshot. Do not assume the free-text brief is an approved WhatsApp template or inject it into an arbitrary template.

The `channel_integrations.configuration` field must have a documented, validated schema. Credentials must come from server environment secrets, not JSON configuration or client responses. Configuration should identify the Meta phone-number integration and approved template policy; never return access tokens to the browser or worker response.

## Worker processing contract

1. Claim one due delivery with a short lease using `FOR UPDATE SKIP LOCKED`. Require campaign status `funded` or `running`, audience listing `approved`, active WhatsApp integration, and a delivery that has not already been accepted/delivered.
2. Join the delivery to its audience contact by both contact ID and audience-list ID. Require matching owner IDs, `consent_status = 'opted_in'`, `opted_out_at IS NULL`, and no owner-level suppression row for the contact hash.
3. Decrypt the E.164 number only in server memory using `decryptAudiencePhone`; never return it from an API or log it.
4. Validate that the campaign's template name/language match a configured, approved Meta template. Reject arbitrary URLs, arbitrary components, and free-text marketing sends.
5. Submit the approved template using `sendMetaTemplateMessage`. An accepted provider response must be reported with the provider message ID. A timeout/network ambiguity must be reported as `unknown`, not retried immediately.
6. Verify report ownership by matching delivery ID, attempt ID, lease, and request fingerprint. Enforce provider-reference uniqueness.
7. Process Meta signed status webhooks idempotently. Record provider evidence; only a `delivered` or `read` status qualifies as recipient delivery. `sent` and provider `accepted` do not.
8. Credit publisher earnings only once, and only after the platform's explicit billable-delivery rule is satisfied. Ledger posting, delivery state, and audit event must be atomic. Reconcile reversals, duplicates, and delayed webhook events without double credit.
9. Add recipient self-service opt-out handling and enforce suppression before every send. Owner-side suppression alone is not a complete recipient opt-out flow.

## Failure and retry policy

- Permanent provider errors (invalid template, permission, recipient, policy) fail without retry.
- Rate limits and transient provider errors use bounded exponential backoff.
- Timeout or unknown provider outcome is held for reconciliation; do not resend until the message ID/status can be resolved or an operator explicitly releases it.
- Expired leases must not automatically resend an attempt whose provider outcome is unknown.
- Every state transition must be idempotent and auditable.

## Required automated tests

- Ineligible campaign/list/integration is never claimed.
- Withdrawn, opted-out, or suppressed contact is never sent.
- Ciphertext/key-version failure fails closed and leaks no phone number.
- Two concurrent workers cannot claim the same delivery.
- Approved template mismatch is rejected before provider call.
- Provider acceptance stores message ID but does not count as delivered.
- Duplicate, delayed, out-of-order, and invalid-signature webhooks are safe.
- A timeout is marked unknown and is not blindly retried.
- Duplicate webhook cannot duplicate ledger earnings.
- No API response, log, audit metadata, or admin list exposes recipient phone numbers or access tokens.

## Release gates

- Keep live sending disabled until Meta credentials, webhook subscription, approved template, and active integration are configured.
- Run tests against a Meta test number and a small, explicitly consented test audience.
- Verify end-to-end: campaign approval → Paystack confirmation → funded campaign → queued recipient deliveries → Meta accepted → delivered webhook → exactly-once settlement.
- Confirm rollback and pause controls before enabling production traffic.

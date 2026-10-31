# PromoLink

**Your Audience. Your Opportunity.**

PromoLink is being built as an audience-promotion marketplace. Audience owners can submit channel listings for review; advertisers can request campaigns against approved listings. Raw member contact lists must not be uploaded or exposed to advertisers.

## Implementation status

| Area | Status |
|---|---|
| Marketing landing page | Implemented; latest redesign awaits a successful build/deploy |
| Neon-backed account registration and login | Implemented in code; requires database migrations and end-to-end verification |
| Session cookies and logout | Implemented in code; requires end-to-end verification |
| Audience listing submission | Implemented in code; pending review by default |
| Administrator listing review | Implemented in code; requires verification |
| Campaign request creation | Implemented in code; owner approval required |
| Campaign owner approval/rejection | Implemented in code; requires verification |
| Authentication rate limiting | Implemented in code using Neon; requires migration 002 |
| Payments, ledger settlement and withdrawals | Not implemented/verified |
| Channel delivery integrations and verified delivery evidence | Not implemented/verified |
| Password reset and email verification | Not implemented |

Do not treat a workflow as production-ready until CI passes and it has been tested against the configured Neon database.

## Tech stack

- Next.js App Router, React and TypeScript
- Neon PostgreSQL via `@neondatabase/serverless`
- Password hashing with Node.js scrypt
- HttpOnly session cookies

## Local development

```bash
npm ci
npm run dev
```

## Database setup

Apply migrations in order using the Neon SQL Editor:

1. `db/migrations/001_initial_auth.sql`
2. `db/migrations/002_auth_rate_limits.sql`

Set `DATABASE_URL` in local development and in the appropriate Vercel environments. Never commit database credentials or paste them into source files.

## Verification

```bash
npm run lint
npm run build
```

GitHub Actions runs these checks for pushes to the feature branch and pull requests targeting `main`.

## Security and privacy

- The public registration API does not allow users to register as administrators.
- Audience listings default to `pending_review`.
- Advertisers receive only approved audience listings.
- No raw contact-list table is part of the schema.
- Payment and delivery claims must not be made until provider webhooks, signatures, idempotency and evidence flows are implemented and tested.

## Licence

Private — All rights reserved.

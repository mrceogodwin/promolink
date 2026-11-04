# PromoLink

**Your Audience. Your Opportunity.**

PromoLink is an audience-promotion marketplace. Audience owners can submit channel listings for review; advertisers can request campaigns against approved listings. Raw member contact lists must not be uploaded or exposed to advertisers.

## Implementation status

| Area | Status |
|---|---|
| Marketing landing page | Implemented; latest development deployment build is READY |
| Neon-backed account registration and login | Implemented in code; requires end-to-end verification |
| Session cookies and logout | Implemented in code; requires end-to-end verification |
| Audience listing submission | Implemented; publisher form restored and pending review by default |
| Administrator listing review | Implemented in code; requires end-to-end verification |
| Campaign request creation | Implemented in code; owner approval required |
| Campaign owner approval/rejection | Implemented in code; owner-scoped API checks present; end-to-end verification pending |
| Authentication rate limiting | Implemented in code using Neon |
| Paystack checkout and signed webhook foundation | Implemented in code; provider secret absent and end-to-end payment verification pending |\n| Wallet balances, delivery-based earning, withdrawals and disputes | Not implemented/production-ready |
| Channel delivery integrations and verified delivery evidence | Not implemented/verified |\n| SEO sitemap, robots rules and canonical metadata | Implemented; search indexing and rankings not yet verified |
| Password reset and email verification | Not implemented |

Do not treat a workflow as production-ready until CI passes and it has been tested against the configured Neon database.

## Tech stack

- Next.js App Router, React and TypeScript
- Neon PostgreSQL via `@neondatabase/serverless`
- Password hashing with Node.js scrypt
- HttpOnly session cookies

## Local development

The repository currently has no committed package lockfile. Install dependencies with:

```bash
npm install
npm run dev
```

## Database setup

Apply migrations in order only on a new database:

1. `db/migrations/001_initial_auth.sql`
2. `db/migrations/002_auth_rate_limits.sql`
3. `db/migrations/003_public_waitlist.sql`\n4. `db/migrations/004_delivery_orchestration.sql`

The existing PromoLink Neon branches already contain the core application tables and waitlist table, including its `source` column. Migration 004 has been authored but has not been applied to either branch. Do not rerun migrations blindly or overwrite existing data. Inspect the live schema before any manual migration.

Set `DATABASE_URL` in local development and in the appropriate Vercel environments. Never commit database credentials or paste them into source files.

## Verification

```bash
npm install
npm run lint
npm run build
```

GitHub Actions runs lint and build checks for pushes to the feature branch and pull requests targeting `main`. A passing deployment check alone is not an end-to-end test.

## Security and privacy

- The public registration API does not allow users to register as administrators.
- Audience listings default to `pending_review`.
- Administrator review accepts only listings still in `pending_review`.
- Advertisers receive only approved audience listings.
- No raw contact-list table is part of the schema.
- Payment and delivery claims must not be made until provider webhooks, signatures, idempotency and evidence flows are implemented and tested.

## Licence

Private — All rights reserved.

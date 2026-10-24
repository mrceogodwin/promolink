# PromoLink

**Your Audience. Your Opportunity.**

PromoLink is a WhatsApp audience advertising marketplace. Audience owners list eligible WhatsApp contact lists and groups; advertisers create campaigns and pay according to successful deliveries.

## Current Status

| Area | Status |
|------|--------|
| Marketing landing page | Implemented |
| Registration & login UI | Implemented (honest “not available yet” state) |
| Real authentication backend | **Not yet configured** |
| Database | **Not yet configured** |
| Audience listings | Planned |
| Campaign workflow | Planned |
| Payments & ledger | Planned |
| WhatsApp delivery | Planned |

## Tech Stack

- Next.js 15 (App Router)
- React 19
- TypeScript
- Tailwind CSS v4

## Getting Started

```bash
npm install
npm run dev
```

## Required Setup for Real Authentication

To enable real account creation and login you will need:

1. A PostgreSQL database (recommended: [Neon](https://neon.tech))
2. An `AUTH_SECRET` (generate with `openssl rand -base64 32`)
3. Environment variables:

```env
DATABASE_URL="postgresql://..."
AUTH_SECRET="your-secret"
```

See `docs/PRODUCT-ARCHITECTURE.md` for the full plan.

## Documentation

- [Product Architecture](docs/PRODUCT-ARCHITECTURE.md)
- [Neuron Competitive Analysis](docs/NEURON-COMPETITIVE-ANALYSIS.md)

## Licence

Private — All rights reserved.

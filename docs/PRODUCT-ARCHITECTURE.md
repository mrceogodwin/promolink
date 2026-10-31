# PromoLink — Product & Technical Architecture

**Last updated:** 2026-10-24  
**Status:** Landing page and Neon connection health check exist. Authentication foundation and initial schema are in progress on `feature/neon-auth-foundation`; production readiness is not yet verified.

---

## 1. Core Product Definition

PromoLink is a **multi-channel audience advertising marketplace** designed to support verified promotions across social and messaging platforms.

Audience owners list eligible channels, communities, pages and creator inventory, choose an appropriate pricing model, and earn when advertisers run approved promotional campaigns. The platform must not expose private contact lists or phone numbers.

Advertisers browse approved audiences, create campaigns, fund budgets, and pay according to a clearly defined delivery rule.

**Key principles**
- Contact lists and phone numbers never leave the platform.
- Advertisers never receive raw contact databases.
- Only approved audience lists appear in the public marketplace.
- Payment is driven by verified delivery events, not by message submission alone.
- Telegram, Facebook and other platforms are out of scope for the initial MVP.

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                   │
│  Landing • Auth • Dashboards • Marketplace • Admin          │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│                     API Layer (Next.js Route Handlers)      │
│  Auth • Listings • Campaigns • Payments • Webhooks          │
└──────┬──────────────┬──────────────┬──────────────┬─────────┘
       │              │              │              │
┌──────▼──────┐ ┌─────▼──────┐ ┌─────▼──────┐ ┌─────▼──────┐
│  Database   │ │  Auth      │ │  Payments  │ │  WhatsApp  │
│  (Postgres) │ │  (Auth.js) │ │  (Paystack)│ │  Adapter   │
└─────────────┘ └────────────┘ └────────────┘ └────────────┘
```

**Recommended stack**
- Next.js 15 App Router + TypeScript + Tailwind CSS (already in place)
- Neon-backed server-side sessions and scrypt password hashing (current implementation in progress)
- PostgreSQL via Neon
- Prisma or Drizzle ORM
- Paystack (primary Nigerian payment provider)
- Vercel Blob or Cloudflare R2 for evidence files
- Resend for transactional email

---

## 3. Roles and Permissions

| Role | Capabilities |
|------|--------------|
| **Audience Owner** | Create/edit audience lists, submit for review, approve/reject campaign messages, upload delivery evidence, view earnings, request withdrawals |
| **Advertiser** | Browse approved audiences, create campaigns, fund budgets, track delivery and spend, request refunds for unused budget |
| **Administrator** | Review/approve/reject listings, moderate campaigns, resolve disputes, inspect ledger, manage platform settings, suspend accounts |

All write operations require authentication and role checks. Private evidence files are served only to authorised parties.

---

## 4. Core Data Model

### Users
- id, email, name, phone, role, status, created_at, updated_at

### WhatsAppSessions (future)
- id, owner_id, connection_type (`cloud_api` | `baileys`), status, last_seen, encrypted_session_data

### AudienceLists
- id, owner_id, title, description, category, location
- estimated_size, price_per_delivery, currency
- status (`draft` | `pending_review` | `approved` | `rejected` | `suspended`)
- review_notes, reviewed_by, reviewed_at

### Campaigns
- id, advertiser_id, audience_list_id
- message_content, budget, target_deliveries
- status (`draft` → `pending_owner_approval` → `approved` → `funded` → `running` → `completed` / `cancelled` / `disputed`)
- delivery_count, spent_amount, platform_fee

### LedgerEntries (immutable)
- id, user_id, campaign_id, type (`deposit` | `reserve` | `delivery_charge` | `earning` | `fee` | `refund` | `withdrawal`)
- amount, balance_after, reference, metadata, created_at

### DeliveryEvents
- id, campaign_id, recipient_hash, status (`submitted` | `delivered` | `failed` | `read` | `uncertain`)
- provider_event_id, recorded_at

### Supporting tables
Withdrawals, Disputes, AuditLogs, Notifications

---

## 5. Campaign Lifecycle

```
draft → pending_owner_approval → approved → funded → running → completed
                              ↘ rejected
                                              ↘ cancelled / disputed
```

**Rules**
- Funds are reserved when a campaign is funded.
- Charges and earnings are created only on confirmed successful delivery events (or the platform-defined delivery rule).
- Uncertain or failed deliveries do not create earnings or double charges.
- Every state transition is written to AuditLogs.

---

## 6. Payment & Ledger Design

- Advertiser deposits → wallet balance
- Campaign funding → reserve funds
- Successful delivery → charge advertiser, credit audience owner (minus platform fee), release reserve
- Refunds return unused reserved budget
- Withdrawals require approval rules + future KYC

All operations must be **idempotent**. Paystack webhooks must be signature-verified and processed exactly once.

**Business decisions still requiring product owner approval**
- Platform fee percentage
- Minimum campaign budget
- Minimum price per delivery
- Withdrawal minimum and fees
- Exact definition of “successful delivery” for payment purposes

---

## 7. WhatsApp Integration Options

| Option | Pros | Cons | Recommendation |
|--------|------|------|----------------|
| Official WhatsApp Cloud API | Stable, Meta-supported, better for scale | Requires Meta Business verification | Preferred long-term |
| Baileys (unofficial pairing) | Faster to start, QR/pairing code | Policy risk, session instability, possible account bans | Use only with strong risk controls and clear user warnings |

**Design principles**
- Abstract behind a `WhatsAppAdapter` interface.
- Never expose raw contact lists to advertisers.
- Store only hashed / anonymised delivery proofs where possible.
- Clear consent, disconnect handling and session health monitoring.
- Rate limiting.

Do not build a fake QR flow or simulated delivery and present it as real.

---

## 8. Privacy & Security Controls

- Contact lists are highly sensitive → data minimisation, encryption at rest, strict access control.
- Advertisers never receive phone numbers.
- Session credentials encrypted and never logged.
- All money-moving operations require server-side verification.
- Full audit trail of every status change and admin action.
- Rate limiting on listing creation, campaign creation and withdrawals.
- Private evidence files served via signed URLs or authenticated routes only.

---

## 9. Phased Implementation Plan

| Phase | Scope | Acceptance Criteria |
|-------|-------|---------------------|
| **1** | Landing page (current) | Public, polished, on-brand, honest messaging |
| **2** | Auth + Roles | Users can register as Audience Owner or Advertiser |
| **3** | Audience List submission + Admin review | Owners can submit lists; only approved lists appear in marketplace |
| **4** | Marketplace discovery | Advertisers can search/filter approved audiences |
| **5** | Campaign creation + Owner approval | Full request → approve/reject → status flow |
| **6** | Payment + Ledger | Paystack deposits, reserves, earnings, refunds |
| **7** | Real WhatsApp delivery + reconciliation | Adapter live, delivery events drive ledger |
| **8** | Admin tools, disputes, monitoring | Operational readiness |
| Later | AI bots, flows, broadcasts, multi-platform | Separate product modules |

---

## 10. Current Status

- Landing page exists and is deployed.
- No authentication, database, payments or WhatsApp integration has been implemented yet.
- Vercel Deployment Protection / SSO is currently enabled and blocks public access. This must be disabled for the site to be publicly viewable.

---

## 11. Unresolved Product Decisions

1. Platform fee % and who pays it
2. Exact definition of “successful delivery” for payment
3. Minimum budget and price floors
4. Whether Baileys is allowed in MVP or only Cloud API
5. KYC requirements for withdrawals
6. Whether any non-WhatsApp platforms are in scope for year 1

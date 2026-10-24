# PromoLink ↔ Neuron Competitive Analysis

**Date:** 2026-10-24  
**Sources:** Public Neuron pages only (neuron.ng/earn, neuron.ng/advertise, neuron.ng/faq, neuron.ng/docs, homepage). No private dashboard access.

---

## Verified Neuron Marketplace Model (Public Information)

### Audience Owners (Creators)
1. Connect WhatsApp (QR / pairing or Cloud API).
2. Import contacts or paste a list / manage groups.
3. Publish an audience listing in the marketplace.
4. Set own price per message (publicly shown range: ₦10 – ₦5,000).
5. Optionally require approval of every advertiser message before it is sent.
6. Earn only on successfully delivered messages.
7. Withdraw earnings to bank from Neuron wallet.

### Advertisers
1. Browse creator audiences (contact lists & groups) by category, region, reach.
2. Select audiences, write message, set total budget (minimum publicly stated: ₦5,000).
3. Fund wallet via Paystack (card / transfer).
4. Only pay for messages that are actually delivered.
5. Can pause/stop; unspent budget is refunded.
6. Creators can reject messages.

### Platform
- Pay-per-delivered-message model.
- Platform takes a fee (exact % not clearly published on the public pages inspected).
- WhatsApp connection options: Official Cloud API or Baileys-style pairing (documented in docs).
- Strong emphasis on creator control (approval) and private contact lists.

---

## Feature Comparison Table

| Neuron feature / workflow | Evidence / source | How it operates (public) | Current PromoLink status | Missing work | Priority | Recommended implementation |
|---------------------------|-------------------|---------------------------|---------------------------|--------------|----------|----------------------------|
| Account registration & roles | Public pages | Users sign up and act as creator or advertiser | Basic `/register` + `/login` UI exist; no real auth backend | Real auth (Auth.js/Clerk) + DB + role storage | **1 – Required for first usable marketplace** | Phase 1 |
| WhatsApp connection (QR / Cloud API) | Docs + Earn page | QR pairing or Meta Cloud API | Not implemented | Adapter layer, session security, consent | **2 – Required before live campaigns** | Phase 4 |
| Contact / audience list management | Earn page | Import contacts, create lists/groups | Not implemented | Private storage, access control, hashing | **1** | Phase 2 |
| Publish audience listing | Earn + Advertise | Title, category, reach, price per message | Hard-coded illustrative cards only | Real CRUD + admin review status | **1** | Phase 2 |
| Owner message approval | Earn + Advertise | Optional/required approval before send | Not implemented | Campaign status + approval UI | **1** | Phase 3–4 |
| Advertiser marketplace browse/filter | Advertise page | Browse by category, region, reach | Illustrative cards only | Search, filters, real approved listings | **1** | Phase 3 |
| Campaign creation + budget | Advertise page | Message + target volume + budget (min ₦5k) | Not implemented | Campaign model + status machine | **1** | Phase 3 |
| Pay-per-delivery billing | Advertise + Earn | Charge only on successful delivery | Not implemented | Delivery events → ledger | **2** | Phase 5 |
| Wallet + Paystack funding | Advertise FAQ | Fund wallet via Paystack | Not implemented | Paystack integration + webhooks | **2** | Phase 5 |
| Platform fee / earnings split | Public pages (incomplete) | Fee exists but exact % not clearly published | Not implemented | Configurable fee + immutable ledger | **2** | Phase 5 |
| Withdrawals | Earn page | Withdraw to bank anytime | Not implemented | Withdrawal requests + admin review | **2** | Phase 5 |
| Delivery evidence / tracking | Advertise | Live delivery, spend, remaining budget | Illustrative only | Real event recording + reconciliation | **2** | Phase 4–5 |
| Refunds for unspent budget | Advertise FAQ | Unspent budget refunded | Not implemented | Refund workflow + ledger entries | **2** | Phase 5 |
| AI bots, flows, broadcasts, storefront | Homepage + Docs | Broader automation suite | Out of scope | — | **4 – Not needed for initial marketplace** | Later |
| Multi-currency plans | Pricing page | USD, NGN, GHS, ZAR, KES | N/A | — | **4** | Later |

**Priority legend**  
1 = Required for first usable marketplace  
2 = Required before real money / live campaigns  
3 = Later enhancement  
4 = Not needed for PromoLink’s initial scope

---

## Key Product Decisions Still Required from Owner

| Decision | Neuron public reference | PromoLink recommendation | Needs approval |
|----------|-------------------------|---------------------------|----------------|
| Minimum campaign budget | ₦5,000 | Start at ₦5,000 or ₦3,000 | Yes |
| Price per delivery range | ₦10 – ₦5,000 | Let owners set freely; optional platform floors | Yes |
| Platform commission | Not clearly published | Start at 15–20% of delivery value | Yes |
| Definition of “successful delivery” | “Message that lands” | Prefer “delivered” status over “sent”; document uncertainty handling | Yes |
| WhatsApp integration preference | Cloud API or Baileys | Prefer Cloud API for production stability; document Baileys risks | Yes |
| Launch country / currency | Multi-currency | Nigeria + NGN first | Yes |

---

## Current PromoLink Repository State (Verified 2026-10-24)

**What exists and works**
- Premium dark-purple landing page
- Logo component
- Responsive layout
- `/login` and `/register` pages with role selector
- All primary CTAs correctly point to `/login` or `/register?role=...`
- Honest messaging (no fake success states)
- `docs/PRODUCT-ARCHITECTURE.md`

**What does not exist**
- Real authentication backend
- Database
- Audience listing CRUD
- Marketplace with real data
- Campaign workflow
- Payments / ledger
- WhatsApp integration
- Admin tools
- Privacy Policy / Terms pages

---

## Ordered Implementation Roadmap (Testable Milestones)

**Phase 1 – Registration & Application Foundation** (current focus)  
- Real auth provider + database  
- Role-aware registration & login  
- Protected routes  
- Server-side role validation  

**Phase 2 – Audience Owner Dashboard**  
- Create / edit / submit listings  
- Admin review states  
- Private data handling  

**Phase 3 – Advertiser Marketplace**  
- Browse & filter approved listings  
- Campaign request creation  
- Status tracking  

**Phase 4 – Delivery & Verification**  
- Chosen WhatsApp adapter  
- Owner approval gate  
- Delivery event recording  

**Phase 5 – Payments & Earnings**  
- Paystack + wallet  
- Immutable ledger  
- Fees, refunds, withdrawals  

**Phase 6 – Admin, Safety & Launch**  
- Moderation, audit logs, policies, monitoring  

---

## Immediate Next Action

Complete **Phase 1** properly:
1. Choose and configure Auth.js (or Clerk) + Neon Postgres.
2. Persist users and roles.
3. Protect future dashboard routes.
4. Keep the existing premium UI.

No payments, no WhatsApp delivery, and no marketplace listings should be marked “live” until the corresponding phase is complete and tested.

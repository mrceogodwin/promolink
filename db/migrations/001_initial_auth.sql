-- PromoLink initial schema (Neon PostgreSQL only).
-- Run this migration once in the Neon SQL Editor before enabling authentication.
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 2 AND 120),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('audience_owner', 'advertiser', 'admin')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'pending_verification')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions(user_id);
CREATE INDEX IF NOT EXISTS sessions_expires_at_idx ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS audience_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 3 AND 140),
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL,
  country_code CHAR(2),
  channel TEXT NOT NULL CHECK (channel IN ('whatsapp','telegram','facebook','instagram','tiktok')),
  estimated_reach INTEGER NOT NULL CHECK (estimated_reach > 0),
  currency CHAR(3) NOT NULL DEFAULT 'NGN',
  price_amount NUMERIC(12,2) NOT NULL CHECK (price_amount >= 0),
  pricing_model TEXT NOT NULL CHECK (pricing_model IN ('fixed_post','per_verified_delivery','performance')),
  status TEXT NOT NULL DEFAULT 'pending_review' CHECK (status IN ('draft','pending_review','approved','rejected','suspended')),
  review_notes TEXT,
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audience_lists_marketplace_idx ON audience_lists(status, channel, category);

CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advertiser_id UUID NOT NULL REFERENCES users(id),
  audience_list_id UUID NOT NULL REFERENCES audience_lists(id),
  title TEXT NOT NULL,
  brief TEXT NOT NULL DEFAULT '',
  creative_url TEXT,
  budget_amount NUMERIC(12,2) NOT NULL CHECK (budget_amount > 0),
  currency CHAR(3) NOT NULL DEFAULT 'NGN',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','pending_owner_approval','approved','pending_payment','funded','running','completed','cancelled','disputed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  provider_reference TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES users(id),
  campaign_id UUID REFERENCES campaigns(id),
  amount_minor BIGINT NOT NULL CHECK (amount_minor > 0),
  currency CHAR(3) NOT NULL DEFAULT 'NGN',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','success','failed','reversed')),
  raw_event JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  campaign_id UUID REFERENCES campaigns(id),
  payment_event_id UUID REFERENCES payment_events(id),
  entry_type TEXT NOT NULL CHECK (entry_type IN ('deposit','reserve','delivery_charge','earning','fee','refund','withdrawal')),
  amount_minor BIGINT NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'NGN',
  reference TEXT NOT NULL UNIQUE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ledger_user_created_idx ON ledger_entries(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Intentionally no contacts/phone-number table: raw audience contact data must never
-- be exposed to advertisers. Channel integrations require their own verified adapters.

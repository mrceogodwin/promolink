-- PromoLink waitlist schema.
-- Apply after 001_initial_auth.sql and 002_auth_rate_limits.sql in Neon.
CREATE TABLE IF NOT EXISTS waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  interest TEXT NOT NULL DEFAULT 'both'
    CHECK (interest IN ('audience_owner', 'advertiser', 'both')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS waitlist_created_at_idx ON waitlist(created_at DESC);

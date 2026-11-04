-- Platform commission recognition, kept separate from user wallets.
CREATE TABLE IF NOT EXISTS platform_revenue_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  settlement_id UUID NOT NULL UNIQUE REFERENCES publisher_settlements(id),
  amount_minor BIGINT NOT NULL CHECK (amount_minor >= 0),
  currency CHAR(3) NOT NULL,
  entry_type TEXT NOT NULL DEFAULT 'campaign_commission'
    CHECK (entry_type = 'campaign_commission'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS platform_revenue_currency_created_idx
  ON platform_revenue_entries(currency, created_at DESC);

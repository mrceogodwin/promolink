-- Publisher settlement policy is intentionally disabled until the platform owner configures a fee.
CREATE TABLE IF NOT EXISTS platform_fee_policy (
  id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  platform_fee_bps INTEGER CHECK (platform_fee_bps BETWEEN 0 AND 10000),
  currency CHAR(3) NOT NULL DEFAULT 'NGN',
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  updated_by UUID REFERENCES users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (NOT enabled OR platform_fee_bps IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS publisher_settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id UUID NOT NULL UNIQUE REFERENCES campaign_deliveries(id),
  campaign_id UUID NOT NULL REFERENCES campaigns(id),
  advertiser_id UUID NOT NULL REFERENCES users(id),
  publisher_id UUID NOT NULL REFERENCES users(id),
  gross_amount_minor BIGINT NOT NULL CHECK (gross_amount_minor > 0),
  platform_fee_minor BIGINT NOT NULL CHECK (platform_fee_minor >= 0),
  publisher_amount_minor BIGINT NOT NULL CHECK (publisher_amount_minor > 0),
  currency CHAR(3) NOT NULL,
  fee_policy_bps INTEGER NOT NULL CHECK (fee_policy_bps BETWEEN 0 AND 10000),
  status TEXT NOT NULL DEFAULT 'posted' CHECK (status IN ('posted','reversed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (gross_amount_minor = platform_fee_minor + publisher_amount_minor)
);

CREATE INDEX IF NOT EXISTS publisher_settlements_campaign_idx ON publisher_settlements(campaign_id, created_at DESC);
CREATE INDEX IF NOT EXISTS publisher_settlements_publisher_idx ON publisher_settlements(publisher_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS ledger_delivery_earning_once_idx
  ON ledger_entries(campaign_id, (metadata->>'delivery_id'))
  WHERE entry_type = 'earning' AND metadata ? 'delivery_id';

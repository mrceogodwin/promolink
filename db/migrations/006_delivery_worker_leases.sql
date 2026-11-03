-- Add a short processing lease so crashed workers do not strand deliveries.
ALTER TABLE campaign_deliveries
  ADD COLUMN IF NOT EXISTS lease_expires_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS campaign_deliveries_lease_idx
  ON campaign_deliveries(lease_expires_at, created_at)
  WHERE status = 'processing';

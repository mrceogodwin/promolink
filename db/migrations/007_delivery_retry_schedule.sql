-- Add an explicit retry schedule so failed provider submissions are not
-- immediately reclaimed in a tight loop.
ALTER TABLE campaign_deliveries
  ADD COLUMN IF NOT EXISTS next_attempt_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS campaign_deliveries_retry_schedule_idx
  ON campaign_deliveries(next_attempt_at, created_at)
  WHERE status = 'failed';

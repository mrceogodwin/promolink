-- Keep successful-but-mismatched provider charges in manual review.
-- Never release a campaign reservation when Paystack says it charged successfully
-- but the amount/currency does not match our expected transaction.
ALTER TABLE payment_events
  DROP CONSTRAINT IF EXISTS payment_events_status_check;

ALTER TABLE payment_events
  ADD CONSTRAINT payment_events_status_check
  CHECK (status IN ('pending','success','failed','reversed','needs_review'));

CREATE INDEX IF NOT EXISTS payment_events_review_queue_idx
  ON payment_events(created_at)
  WHERE status = 'needs_review';

-- Withdrawal requests are internal workflow records only.
-- They do not trigger transfers or mark funds as paid.
CREATE TABLE IF NOT EXISTS publisher_withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  publisher_id UUID NOT NULL REFERENCES users(id),
  amount_minor BIGINT NOT NULL CHECK (amount_minor > 0),
  currency CHAR(3) NOT NULL,
  status TEXT NOT NULL DEFAULT 'requested'
    CHECK (status IN ('requested','approved','rejected','paid','cancelled')),
  publisher_note TEXT NOT NULL DEFAULT '' CHECK (char_length(publisher_note) <= 500),
  admin_note TEXT CHECK (admin_note IS NULL OR char_length(admin_note) <= 1000),
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  external_reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (status <> 'paid' OR (paid_at IS NOT NULL AND external_reference IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS publisher_withdrawal_owner_idx
  ON publisher_withdrawal_requests(publisher_id, created_at DESC);
CREATE INDEX IF NOT EXISTS publisher_withdrawal_review_idx
  ON publisher_withdrawal_requests(status, created_at ASC);

-- PromoLink security controls and workflow support.
-- Apply after 001_initial_auth.sql in the Neon SQL Editor.
CREATE TABLE IF NOT EXISTS auth_rate_limits (
  bucket_key TEXT PRIMARY KEY,
  window_started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS auth_rate_limits_updated_at_idx ON auth_rate_limits(updated_at);

-- Keep this table bounded; run periodically from a scheduled maintenance task.
-- DELETE FROM auth_rate_limits WHERE updated_at < now() - interval '2 days';

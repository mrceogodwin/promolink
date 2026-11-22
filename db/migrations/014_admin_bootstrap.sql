-- One-time, secret-gated bootstrap for the first PromoLink administrator.
-- Public registration must never create admin accounts.
CREATE TABLE IF NOT EXISTS admin_bootstrap_state (
  id SMALLINT PRIMARY KEY CHECK (id = 1),
  consumed_at TIMESTAMPTZ,
  consumed_by_user_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK ((consumed_at IS NULL) = (consumed_by_user_id IS NULL))
);

INSERT INTO admin_bootstrap_state (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

REVOKE ALL ON TABLE admin_bootstrap_state FROM PUBLIC;

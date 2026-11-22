-- PromoLink private audience contacts and consent controls.
-- Apply only after review; this migration is not run automatically.
-- Phone numbers are encrypted by the application before storage. Never store plaintext.

CREATE TABLE IF NOT EXISTS audience_contact_suppressions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  phone_hash CHAR(64) NOT NULL,
  reason TEXT NOT NULL DEFAULT 'user_opt_out' CHECK (reason IN ('user_opt_out','owner_request','compliance')),
  source TEXT NOT NULL DEFAULT 'owner_dashboard',
  suppressed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (owner_id, phone_hash)
);

CREATE TABLE IF NOT EXISTS audience_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audience_list_id UUID NOT NULL REFERENCES audience_lists(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  phone_ciphertext TEXT NOT NULL,
  phone_hash CHAR(64) NOT NULL,
  encryption_key_version SMALLINT NOT NULL DEFAULT 1 CHECK (encryption_key_version > 0),
  consent_status TEXT NOT NULL CHECK (consent_status IN ('opted_in','withdrawn')),
  consent_source TEXT NOT NULL CHECK (char_length(consent_source) BETWEEN 2 AND 120),
  consent_obtained_at TIMESTAMPTZ NOT NULL,
  consent_evidence_ref TEXT,
  opted_out_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (audience_list_id, phone_hash),
  CHECK ((consent_status = 'opted_in' AND opted_out_at IS NULL) OR
         (consent_status = 'withdrawn' AND opted_out_at IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS audience_contacts_owner_list_idx
  ON audience_contacts(owner_id, audience_list_id, created_at DESC);
CREATE INDEX IF NOT EXISTS audience_contacts_sendable_idx
  ON audience_contacts(audience_list_id, created_at)
  WHERE consent_status = 'opted_in';

-- The private contact tables are accessed only by trusted server-side application code.
REVOKE ALL ON TABLE audience_contacts FROM PUBLIC;
REVOKE ALL ON TABLE audience_contact_suppressions FROM PUBLIC;

COMMENT ON TABLE audience_contacts IS
  'Private owner-controlled recipient records. phone_ciphertext must contain application AES-256-GCM ciphertext only; advertisers must never receive these rows.';
COMMENT ON TABLE audience_contact_suppressions IS
  'Owner-scoped suppression list. A suppressed phone_hash must never be re-imported or sent for that owner.';

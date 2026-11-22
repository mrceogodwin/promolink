-- PromoLink private audience contacts and consent controls.
-- Apply only after review; this migration is not run automatically.
-- Phone numbers are encrypted by the application before storage. Never store plaintext.

CREATE UNIQUE INDEX IF NOT EXISTS audience_lists_id_owner_uidx
  ON audience_lists(id, owner_id);

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
  audience_list_id UUID NOT NULL,
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
  FOREIGN KEY (audience_list_id, owner_id)
    REFERENCES audience_lists(id, owner_id) ON DELETE CASCADE,
  CHECK ((consent_status = 'opted_in' AND opted_out_at IS NULL) OR
         (consent_status = 'withdrawn' AND opted_out_at IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS audience_contacts_owner_list_idx
  ON audience_contacts(owner_id, audience_list_id, created_at DESC);
CREATE INDEX IF NOT EXISTS audience_contacts_sendable_idx
  ON audience_contacts(audience_list_id, created_at)
  WHERE consent_status = 'opted_in';

-- Serialize imports and suppressions per owner/recipient so concurrent opt-out
-- and import operations cannot leave a suppressed recipient sendable.
CREATE OR REPLACE FUNCTION lock_audience_contact_pair()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(NEW.owner_id::text || ':' || NEW.phone_hash, 0));
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION reject_suppressed_audience_contact()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.consent_status = 'opted_in' AND EXISTS (
    SELECT 1 FROM audience_contact_suppressions s
    WHERE s.owner_id = NEW.owner_id AND s.phone_hash = NEW.phone_hash
  ) THEN
    RAISE EXCEPTION 'Recipient is suppressed for this audience owner';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION withdraw_suppressed_audience_contacts()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE audience_contacts
  SET consent_status = 'withdrawn',
      opted_out_at = COALESCE(opted_out_at, now()),
      phone_ciphertext = '',
      updated_at = now()
  WHERE owner_id = NEW.owner_id
    AND phone_hash = NEW.phone_hash
    AND consent_status = 'opted_in';
  RETURN NEW;
END;
$$;

CREATE TRIGGER audience_contacts_pair_lock
BEFORE INSERT OR UPDATE OF owner_id, phone_hash ON audience_contacts
FOR EACH ROW EXECUTE FUNCTION lock_audience_contact_pair();

CREATE TRIGGER audience_contacts_reject_suppressed
BEFORE INSERT OR UPDATE OF owner_id, phone_hash, consent_status ON audience_contacts
FOR EACH ROW EXECUTE FUNCTION reject_suppressed_audience_contact();

CREATE TRIGGER audience_suppressions_pair_lock
BEFORE INSERT OR UPDATE OF owner_id, phone_hash ON audience_contact_suppressions
FOR EACH ROW EXECUTE FUNCTION lock_audience_contact_pair();

CREATE TRIGGER audience_suppressions_withdraw_contacts
AFTER INSERT OR UPDATE OF owner_id, phone_hash ON audience_contact_suppressions
FOR EACH ROW EXECUTE FUNCTION withdraw_suppressed_audience_contacts();

REVOKE ALL ON TABLE audience_contacts FROM PUBLIC;
REVOKE ALL ON TABLE audience_contact_suppressions FROM PUBLIC;

COMMENT ON TABLE audience_contacts IS
  'Private owner-controlled recipient records. phone_ciphertext must contain application AES-256-GCM ciphertext only; advertisers must never receive these rows.';
COMMENT ON TABLE audience_contact_suppressions IS
  'Owner-scoped suppression list. A suppressed phone_hash must never be re-imported or sent for that owner.';

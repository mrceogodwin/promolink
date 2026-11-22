-- PromoLink recipient-level WhatsApp delivery foundation.
-- Apply after 013_private_audience_contacts.sql and 014_admin_bootstrap.sql.
-- Existing aggregate delivery rows remain valid with a NULL recipient; new
-- recipient-level jobs must reference a contact from the same audience list.

ALTER TABLE audience_contacts
  ADD CONSTRAINT audience_contacts_id_list_uidx UNIQUE (id, audience_list_id);

ALTER TABLE campaign_deliveries
  ADD COLUMN IF NOT EXISTS audience_contact_id UUID;

ALTER TABLE campaign_deliveries
  ADD CONSTRAINT campaign_deliveries_contact_list_fk
  FOREIGN KEY (audience_contact_id, audience_list_id)
  REFERENCES audience_contacts(id, audience_list_id)
  ON DELETE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS campaign_deliveries_campaign_contact_channel_uidx
  ON campaign_deliveries(campaign_id, audience_contact_id, channel)
  WHERE audience_contact_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS campaign_deliveries_contact_idx
  ON campaign_deliveries(audience_contact_id)
  WHERE audience_contact_id IS NOT NULL;

ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS meta_template_name TEXT,
  ADD COLUMN IF NOT EXISTS meta_template_language TEXT,
  ADD COLUMN IF NOT EXISTS meta_template_components JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE campaigns
  ADD CONSTRAINT campaigns_meta_template_name_format
    CHECK (meta_template_name IS NULL OR meta_template_name ~ '^[a-z0-9_]{1,512}$'),
  ADD CONSTRAINT campaigns_meta_template_language_format
    CHECK (meta_template_language IS NULL OR meta_template_language ~ '^[a-z]{2,3}(_[A-Z]{2})?$'),
  ADD CONSTRAINT campaigns_meta_template_components_array
    CHECK (jsonb_typeof(meta_template_components) = 'array');

COMMENT ON COLUMN campaign_deliveries.audience_contact_id IS
  'Private recipient FK. Never expose this ID or contact data to advertisers or public APIs.';
COMMENT ON COLUMN campaigns.meta_template_name IS
  'Meta-approved WhatsApp template name selected by an administrator; NULL means not sendable.';
COMMENT ON COLUMN campaigns.meta_template_language IS
  'Exact approved WhatsApp template language code; NULL means not sendable.';
COMMENT ON COLUMN campaigns.meta_template_components IS
  'Validated template component parameters; must not contain recipient phone numbers or secrets.';

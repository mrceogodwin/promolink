-- PromoLink delivery orchestration foundation.
-- Apply after 003_public_waitlist.sql. This creates queue/evidence records only;
-- it does not send messages or claim delivery without a configured provider adapter.

CREATE TABLE IF NOT EXISTS channel_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel TEXT NOT NULL CHECK (channel IN ('whatsapp','telegram','facebook','instagram','tiktok')),
  provider TEXT NOT NULL,
  display_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'disabled' CHECK (status IN ('disabled','pending_setup','active','paused','error')),
  configuration JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (channel, provider)
);

CREATE TABLE IF NOT EXISTS campaign_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  audience_list_id UUID NOT NULL REFERENCES audience_lists(id),
  channel TEXT NOT NULL CHECK (channel IN ('whatsapp','telegram','facebook','instagram','tiktok')),
  integration_id UUID REFERENCES channel_integrations(id),
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','processing','submitted','delivered','failed','cancelled')),
  idempotency_key TEXT NOT NULL UNIQUE,
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  last_error_code TEXT,
  last_error_message TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS campaign_deliveries_queue_idx
  ON campaign_deliveries(status, scheduled_at, created_at)
  WHERE status IN ('queued','failed');
CREATE INDEX IF NOT EXISTS campaign_deliveries_campaign_idx
  ON campaign_deliveries(campaign_id, created_at DESC);

CREATE TABLE IF NOT EXISTS delivery_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id UUID NOT NULL REFERENCES campaign_deliveries(id) ON DELETE CASCADE,
  attempt_number INTEGER NOT NULL CHECK (attempt_number > 0),
  provider_reference TEXT,
  status TEXT NOT NULL CHECK (status IN ('started','accepted','delivered','failed','unknown')),
  request_fingerprint TEXT,
  response_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  error_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (delivery_id, attempt_number)
);
CREATE UNIQUE INDEX IF NOT EXISTS delivery_attempts_provider_ref_idx
  ON delivery_attempts(provider_reference)
  WHERE provider_reference IS NOT NULL;

CREATE TABLE IF NOT EXISTS delivery_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id UUID NOT NULL REFERENCES campaign_deliveries(id) ON DELETE CASCADE,
  evidence_type TEXT NOT NULL CHECK (evidence_type IN ('provider_webhook','provider_report','admin_review')),
  provider_reference TEXT,
  evidence_fingerprint TEXT NOT NULL,
  evidence_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending','verified','rejected')),
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (delivery_id, evidence_fingerprint)
);
CREATE INDEX IF NOT EXISTS delivery_evidence_status_idx
  ON delivery_evidence(verification_status, created_at DESC);

-- No phone numbers, member lists, or contact-level records are stored here.

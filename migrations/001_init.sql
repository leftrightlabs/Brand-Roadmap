-- ════════════════════════════════════════════════════════════════════════
-- Brand Roadmap — initial schema
-- Paste into Railway's Postgres query tool (Data → Query). Pure DDL,
-- idempotent, safe to re-run. updated_at is maintained by the app code
-- (not by a trigger) — Railway's web SQL editor mis-parses PL/pgSQL
-- dollar-quoting, so triggers are avoided.
-- ════════════════════════════════════════════════════════════════════════

-- Extensions: pgcrypto provides gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ─── website_audit_leads ────────────────────────────────────────────────
-- One row per opt-in. Email is unique (rate-limits one report per email).
CREATE TABLE IF NOT EXISTS website_audit_leads (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT NOT NULL,
  email               TEXT NOT NULL UNIQUE,
  website_url         TEXT NOT NULL,
  -- Question fields are vestigial — kept nullable for compatibility, but
  -- the simplified /start flow leaves them empty.
  business_goals      TEXT,
  industry            TEXT,
  target_audience     TEXT,
  brand_personality   TEXT,
  marketing_status    TEXT,
  improvement_focus   TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_website_audit_leads_email
  ON website_audit_leads(email);

-- ─── shared_reports ─────────────────────────────────────────────────────
-- One row per generated roadmap, keyed by short_id (the public URL token).
-- Reports expire 7 days after creation; /start/expired/[shortId] catches
-- anyone hitting an expired URL.
CREATE TABLE IF NOT EXISTS shared_reports (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  short_id          TEXT NOT NULL UNIQUE,
  lead_id           UUID NOT NULL
                    REFERENCES website_audit_leads(id) ON DELETE CASCADE,
  website_url       TEXT NOT NULL,
  analysis_results  JSONB NOT NULL,
  expires_at        TIMESTAMPTZ NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shared_reports_short_id
  ON shared_reports(short_id);
CREATE INDEX IF NOT EXISTS idx_shared_reports_expires_at
  ON shared_reports(expires_at);
CREATE INDEX IF NOT EXISTS idx_shared_reports_lead_id
  ON shared_reports(lead_id);

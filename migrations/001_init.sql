-- ════════════════════════════════════════════════════════════════════════
-- Brand Roadmap — initial schema
-- Paste this into Railway's Postgres query tool (Data → Query) to create
-- the two tables the app needs. Idempotent: safe to re-run.
-- ════════════════════════════════════════════════════════════════════════

-- ─── Extensions ─────────────────────────────────────────────────────────
-- pgcrypto provides gen_random_uuid() (no extension install required on
-- recent Postgres, but explicit is better). Avoiding uuid-ossp because
-- gen_random_uuid is the modern default.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ─── updated_at trigger helper ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ─── website_audit_leads ────────────────────────────────────────────────
-- One row per opt-in. Email is unique (rate-limits one report per email).
CREATE TABLE IF NOT EXISTS website_audit_leads (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  email           TEXT NOT NULL UNIQUE,
  website_url     TEXT NOT NULL,
  -- Question fields are vestigial — kept nullable so the existing API
  -- code that writes them on legacy flows still works, but the simplified
  -- /start flow leaves them empty.
  business_goals      TEXT,
  industry            TEXT,
  target_audience     TEXT,
  brand_personality   TEXT,
  marketing_status    TEXT,
  improvement_focus   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_website_audit_leads_email
  ON website_audit_leads(email);

DROP TRIGGER IF EXISTS trg_website_audit_leads_updated_at
  ON website_audit_leads;
CREATE TRIGGER trg_website_audit_leads_updated_at
  BEFORE UPDATE ON website_audit_leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── shared_reports ─────────────────────────────────────────────────────
-- One row per generated roadmap, keyed by short_id (the public URL token).
-- Reports expire 7 days after creation; the /start/expired/[shortId] page
-- catches anyone hitting an expired URL.
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

DROP TRIGGER IF EXISTS trg_shared_reports_updated_at
  ON shared_reports;
CREATE TRIGGER trg_shared_reports_updated_at
  BEFORE UPDATE ON shared_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

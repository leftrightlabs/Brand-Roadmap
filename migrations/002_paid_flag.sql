-- Brand Roadmap — paid gate
-- Adds a per-report paid flag. Free reports show the "Brand Snapshot" (diagnosis);
-- paid reports unlock the full roadmap. Flipped by the payment webhook (TODO).
-- Idempotent, safe to re-run.

ALTER TABLE shared_reports
  ADD COLUMN IF NOT EXISTS paid BOOLEAN NOT NULL DEFAULT FALSE;

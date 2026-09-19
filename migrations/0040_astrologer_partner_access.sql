BEGIN;

ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS astrologer_partner_access_enabled boolean NOT NULL DEFAULT false;

COMMIT;
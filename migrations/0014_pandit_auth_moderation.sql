BEGIN;

ALTER TABLE pandits
  ADD COLUMN IF NOT EXISTS account_status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS suspended_until timestamp NULL,
  ADD COLUMN IF NOT EXISTS moderation_reason text NULL,
  ADD COLUMN IF NOT EXISTS must_change_password boolean NOT NULL DEFAULT false;

ALTER TABLE pandits
  DROP CONSTRAINT IF EXISTS pandits_account_status_check;

ALTER TABLE pandits
  ADD CONSTRAINT pandits_account_status_check
  CHECK (account_status IN ('active', 'suspended', 'banned'));

CREATE INDEX IF NOT EXISTS pandits_account_status_idx ON pandits(account_status, suspended_until);

COMMIT;
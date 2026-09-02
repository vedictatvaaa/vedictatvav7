-- Additive lifetime registration identity and governed missing-city workflow.
-- This migration intentionally leaves legacy membership_no and pandit_card_orders untouched.

CREATE SEQUENCE IF NOT EXISTS pandit_registration_no_seq AS bigint
  MINVALUE 1001000156 MAXVALUE 9999999999 START WITH 1001000156 NO CYCLE;

ALTER TABLE pandits ADD COLUMN IF NOT EXISTS registration_no text;
ALTER TABLE pandits ADD COLUMN IF NOT EXISTS registration_assigned_at timestamp;
ALTER TABLE pandit_applications ADD COLUMN IF NOT EXISTS pandit_id integer REFERENCES pandits(id);

-- Fail closed if a prior/manual deployment has introduced an invalid identity.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pandits
    WHERE registration_no IS NOT NULL
      AND (
        registration_no !~ '^[0-9]{10}$'
        OR (registration_no ~ '^[0-9]{10}$' AND registration_no::bigint < 1001000156)
      )
  ) THEN
    RAISE EXCEPTION 'Invalid existing Pandit registration number; aborting 0010';
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS pandits_registration_no_unique
  ON pandits (registration_no) WHERE registration_no IS NOT NULL;

-- Deterministic backfill: stable approval/creation time followed by immutable row id.
-- Only already verified Pandits are eligible. Re-running assigns only missing rows.
LOCK TABLE pandits IN SHARE ROW EXCLUSIVE MODE;
WITH existing AS (
  SELECT COALESCE(MAX(registration_no::bigint), 1001000155) AS max_no
  FROM pandits WHERE registration_no IS NOT NULL
), eligible AS (
  SELECT id, row_number() OVER (ORDER BY created_at NULLS LAST, id) AS ordinal
  FROM pandits
  WHERE verified = true AND registration_no IS NULL
)
UPDATE pandits p
SET registration_no = (existing.max_no + eligible.ordinal)::text,
    registration_assigned_at = COALESCE(p.registration_assigned_at, now())
FROM eligible, existing
WHERE p.id = eligible.id;

-- Link legacy approved applications only where the old approval copy can be
-- identified uniquely by both normalized email and phone. Ambiguity or a
-- missing promoted Pandit aborts rather than silently linking the wrong person.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pandit_applications a
    LEFT JOIN pandits p
      ON lower(btrim(p.email)) = lower(btrim(a.email))
     AND btrim(p.phone) = btrim(a.phone)
    WHERE a.status = 'approved' AND a.pandit_id IS NULL
    GROUP BY a.id
    HAVING count(p.id) <> 1
  ) THEN
    RAISE EXCEPTION 'Approved Pandit application cannot be linked uniquely; aborting 0010';
  END IF;
END $$;

UPDATE pandit_applications a
SET pandit_id = candidate.pandit_id
FROM (
  SELECT a2.id AS application_id, min(p.id) AS pandit_id
  FROM pandit_applications a2
  JOIN pandits p
    ON lower(btrim(p.email)) = lower(btrim(a2.email))
   AND btrim(p.phone) = btrim(a2.phone)
  WHERE a2.status = 'approved' AND a2.pandit_id IS NULL
  GROUP BY a2.id
) candidate
WHERE a.id = candidate.application_id;

CREATE UNIQUE INDEX IF NOT EXISTS pandit_applications_pandit_id_unique
  ON pandit_applications (pandit_id) WHERE pandit_id IS NOT NULL;

SELECT setval(
  'pandit_registration_no_seq',
  GREATEST(COALESCE((SELECT MAX(registration_no::bigint) FROM pandits), 1001000156), 1001000156),
  COALESCE((SELECT MAX(registration_no::bigint) FROM pandits), 0) >= 1001000156
);

ALTER TABLE pandits DROP CONSTRAINT IF EXISTS pandits_registration_no_format_check;
ALTER TABLE pandits ADD CONSTRAINT pandits_registration_no_format_check
  CHECK (registration_no IS NULL OR (
    registration_no ~ '^[0-9]{10}$' AND registration_no::bigint >= 1001000156
  ));
ALTER TABLE pandits DROP CONSTRAINT IF EXISTS pandits_verified_registration_check;
ALTER TABLE pandits ADD CONSTRAINT pandits_verified_registration_check
  CHECK (verified = false OR registration_no IS NOT NULL);

-- Append-only ledger prevents a number from being reused even if a Pandit is deleted.
CREATE TABLE IF NOT EXISTS pandit_registration_numbers (
  registration_no text PRIMARY KEY,
  pandit_id integer NOT NULL UNIQUE,
  assigned_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT pandit_registration_numbers_format_check
    CHECK (registration_no ~ '^[0-9]{10}$' AND registration_no::bigint >= 1001000156)
);
INSERT INTO pandit_registration_numbers (registration_no, pandit_id, assigned_at)
SELECT registration_no, id, COALESCE(registration_assigned_at, now())
FROM pandits WHERE registration_no IS NOT NULL
ON CONFLICT (registration_no) DO NOTHING;

CREATE OR REPLACE FUNCTION enforce_pandit_registration_identity() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.registration_no IS DISTINCT FROM OLD.registration_no THEN
    IF OLD.registration_no IS NOT NULL THEN
      RAISE EXCEPTION 'Pandit registration number is immutable';
    END IF;
  END IF;
  IF NEW.registration_no IS NOT NULL AND
     (TG_OP = 'INSERT' OR NEW.registration_no IS DISTINCT FROM OLD.registration_no) THEN
    INSERT INTO pandit_registration_numbers (registration_no, pandit_id, assigned_at)
    VALUES (NEW.registration_no, NEW.id, COALESCE(NEW.registration_assigned_at, now()));
  END IF;
  RETURN NEW;
END $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS pandits_registration_identity_guard ON pandits;
CREATE TRIGGER pandits_registration_identity_guard
BEFORE INSERT OR UPDATE OF registration_no ON pandits
FOR EACH ROW EXECUTE FUNCTION enforce_pandit_registration_identity();

CREATE TABLE IF NOT EXISTS pandit_city_requests (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  application_id integer NOT NULL UNIQUE REFERENCES pandit_applications(id) ON DELETE RESTRICT,
  state_id integer NOT NULL REFERENCES indian_states(id),
  proposed_city_name text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  resolved_city_id integer REFERENCES indian_cities(id),
  resolution_reason text,
  resolved_by text,
  created_at timestamp NOT NULL DEFAULT now(),
  resolved_at timestamp,
  updated_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT pandit_city_requests_name_check CHECK (length(btrim(proposed_city_name)) BETWEEN 1 AND 120),
  CONSTRAINT pandit_city_requests_status_check CHECK (status IN ('pending','mapped','created','rejected')),
  CONSTRAINT pandit_city_requests_resolution_check CHECK (
    (status = 'pending' AND resolved_city_id IS NULL AND resolved_at IS NULL) OR
    (status IN ('mapped','created') AND resolved_city_id IS NOT NULL AND resolved_at IS NOT NULL) OR
    (status = 'rejected' AND resolved_city_id IS NULL AND resolved_at IS NOT NULL
      AND length(btrim(resolution_reason)) > 0)
  )
);
CREATE INDEX IF NOT EXISTS pandit_city_requests_status_idx ON pandit_city_requests (status, created_at);
CREATE INDEX IF NOT EXISTS pandit_city_requests_state_idx ON pandit_city_requests (state_id);
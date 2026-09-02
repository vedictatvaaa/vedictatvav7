-- Finalize registration numbers after either version of 0010. Historical
-- VT-PAN values stay in the append-only ledger and legacy_registration_no.
-- This is deliberately a successor migration: do not rewrite applied 0010.

ALTER TABLE pandits ADD COLUMN IF NOT EXISTS legacy_registration_no text;

-- Remove the old one-Pandit/one-ledger-row restriction: a converted Pandit has
-- one historical prefixed identity and one current numeric identity.
ALTER TABLE pandit_registration_numbers
  DROP CONSTRAINT IF EXISTS pandit_registration_numbers_pandit_id_key;
DROP INDEX IF EXISTS pandit_registration_numbers_pandit_id_key;

DROP TRIGGER IF EXISTS pandits_registration_identity_guard ON pandits;
DROP FUNCTION IF EXISTS enforce_pandit_registration_identity();
ALTER TABLE pandits DROP CONSTRAINT IF EXISTS pandits_registration_no_format_check;
ALTER TABLE pandit_registration_numbers DROP CONSTRAINT IF EXISTS pandit_registration_numbers_format_check;

LOCK TABLE pandits, pandit_registration_numbers IN SHARE ROW EXCLUSIVE MODE;

-- A row must be fully auditable before any conversion is allowed.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pandits p
    WHERE p.registration_no IS NOT NULL
      AND (
        p.registration_no !~ '^(VT-PAN-[0-9]{6,}|[0-9]{10})$'
        OR (p.registration_no ~ '^[0-9]{10}$' AND p.registration_no::bigint < 1001000156)
        OR (p.legacy_registration_no IS NOT NULL
            AND p.registration_no ~ '^VT-PAN-'
            AND p.legacy_registration_no <> p.registration_no)
        OR NOT EXISTS (
          SELECT 1 FROM pandit_registration_numbers l
          WHERE l.registration_no = p.registration_no AND l.pandit_id = p.id
        )
      )
  ) THEN
    RAISE EXCEPTION 'Pandit registration/ledger history is invalid; aborting 0011';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pandit_registration_numbers
    WHERE registration_no !~ '^(VT-PAN-[0-9]{6,}|[0-9]{10})$'
       OR (registration_no ~ '^[0-9]{10}$' AND registration_no::bigint < 1001000156)
  ) THEN
    RAISE EXCEPTION 'Registration ledger contains an invalid historical identity; aborting 0011';
  END IF;
END $$;

-- Numeric values from the finalized 0010 are retained. Legacy rows receive
-- deterministic numbers after every active or deleted numeric ledger value.
WITH ceiling AS (
  SELECT GREATEST(
    1001000155,
    COALESCE(MAX(registration_no::bigint) FILTER (WHERE registration_no ~ '^[0-9]{10}$'), 1001000155)
  ) AS value
  FROM pandit_registration_numbers
), legacy AS (
  SELECT id, row_number() OVER (ORDER BY created_at NULLS LAST, id) AS ordinal
  FROM pandits WHERE registration_no ~ '^VT-PAN-[0-9]{6,}$'
)
UPDATE pandits p
SET legacy_registration_no = COALESCE(p.legacy_registration_no, p.registration_no),
    registration_no = (ceiling.value + legacy.ordinal)::text,
    registration_assigned_at = COALESCE(p.registration_assigned_at, now())
FROM legacy, ceiling
WHERE p.id = legacy.id;

-- Retain every old ledger row, then append each current identity. A conflict
-- is fatal: it would mean an already retired/deleted identity is being reused.
INSERT INTO pandit_registration_numbers (registration_no, pandit_id, assigned_at)
SELECT registration_no, id, COALESCE(registration_assigned_at, now())
FROM pandits
WHERE registration_no IS NOT NULL
ON CONFLICT (registration_no) DO NOTHING;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pandits p
    LEFT JOIN pandit_registration_numbers l
      ON l.registration_no = p.registration_no AND l.pandit_id = p.id
    WHERE p.registration_no IS NOT NULL AND l.registration_no IS NULL
  ) THEN
    RAISE EXCEPTION 'Current Pandit identity is not represented by its ledger row; aborting 0011';
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS pandits_legacy_registration_no_unique
  ON pandits (legacy_registration_no) WHERE legacy_registration_no IS NOT NULL;

ALTER TABLE pandits ADD CONSTRAINT pandits_registration_no_format_check
  CHECK (registration_no IS NULL OR (
    registration_no ~ '^[0-9]{10}$' AND registration_no::bigint >= 1001000156
  ));
ALTER TABLE pandit_registration_numbers ADD CONSTRAINT pandit_registration_numbers_format_check
  CHECK (registration_no ~ '^(VT-PAN-[0-9]{6,}|[0-9]{10})$'
    AND (registration_no !~ '^[0-9]{10}$' OR registration_no::bigint >= 1001000156));

CREATE OR REPLACE FUNCTION enforce_pandit_registration_identity() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.registration_no IS DISTINCT FROM OLD.registration_no THEN
    RAISE EXCEPTION 'Pandit registration number is immutable';
  END IF;
  IF TG_OP = 'UPDATE' AND NEW.legacy_registration_no IS DISTINCT FROM OLD.legacy_registration_no THEN
    RAISE EXCEPTION 'Pandit legacy registration number is immutable';
  END IF;
  IF NEW.registration_no IS NOT NULL
     AND (TG_OP = 'INSERT' OR NEW.registration_no IS DISTINCT FROM OLD.registration_no) THEN
    INSERT INTO pandit_registration_numbers (registration_no, pandit_id, assigned_at)
    VALUES (NEW.registration_no, NEW.id, COALESCE(NEW.registration_assigned_at, now()));
  END IF;
  RETURN NEW;
END $$ LANGUAGE plpgsql;

CREATE TRIGGER pandits_registration_identity_guard
BEFORE INSERT OR UPDATE OF registration_no, legacy_registration_no ON pandits
FOR EACH ROW EXECUTE FUNCTION enforce_pandit_registration_identity();

-- The ledger includes retired/deleted identities, so it is the allocation
-- ceiling. setval(..., false) makes the first fresh allocation exactly seed.
SELECT setval(
  'pandit_registration_no_seq',
  GREATEST(
    1001000156,
    COALESCE((
      SELECT MAX(registration_no::bigint)
      FROM pandit_registration_numbers WHERE registration_no ~ '^[0-9]{10}$'
    ), 1001000156)
  ),
  EXISTS (
    SELECT 1 FROM pandit_registration_numbers
    WHERE registration_no ~ '^[0-9]{10}$' AND registration_no::bigint >= 1001000156
  )
);
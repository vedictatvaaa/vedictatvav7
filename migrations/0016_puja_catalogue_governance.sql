ALTER TABLE puja_types
  ADD COLUMN IF NOT EXISTS intents text[] NOT NULL DEFAULT ARRAY[]::text[],
  ADD COLUMN IF NOT EXISTS deities text[] NOT NULL DEFAULT ARRAY[]::text[],
  ADD COLUMN IF NOT EXISTS ceremonies text[] NOT NULL DEFAULT ARRAY[]::text[],
  ADD COLUMN IF NOT EXISTS festivals text[] NOT NULL DEFAULT ARRAY[]::text[],
  ADD COLUMN IF NOT EXISTS aliases text[] NOT NULL DEFAULT ARRAY[]::text[],
  ADD COLUMN IF NOT EXISTS regional_variations jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS online_eligible boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS in_person_eligible boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS review_status text NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS reviewed_by_pandit_id integer,
  ADD COLUMN IF NOT EXISTS review_notes text,
  ADD COLUMN IF NOT EXISTS source_notes text,
  ADD COLUMN IF NOT EXISTS citations jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS approved_at timestamp;

UPDATE puja_types
SET deities = CASE
      WHEN deity IS NULL OR btrim(deity) = '' THEN ARRAY[]::text[]
      ELSE ARRAY[btrim(deity)]
    END,
    intents = CASE category
      WHEN 'remedial' THEN ARRAY['remedy']
      WHEN 'samskara' THEN ARRAY['life ceremony']
      WHEN 'occasion' THEN ARRAY['festival observance']
      ELSE ARRAY['devotion']
    END,
    review_status = 'in_review',
    is_published = false,
    approved_at = NULL
WHERE review_status = 'draft';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'puja_types_review_status_valid'
  ) THEN
    ALTER TABLE puja_types ADD CONSTRAINT puja_types_review_status_valid
      CHECK (review_status IN ('draft', 'in_review', 'approved', 'changes_requested'));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'puja_types_some_mode_eligible'
  ) THEN
    ALTER TABLE puja_types ADD CONSTRAINT puja_types_some_mode_eligible
      CHECK (online_eligible OR in_person_eligible);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'puja_types_reviewer_fk'
  ) THEN
    ALTER TABLE puja_types ADD CONSTRAINT puja_types_reviewer_fk
      FOREIGN KEY (reviewed_by_pandit_id) REFERENCES pandits(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS puja_types_review_status_idx ON puja_types(review_status);
CREATE INDEX IF NOT EXISTS puja_types_intents_gin_idx ON puja_types USING gin(intents);
CREATE INDEX IF NOT EXISTS puja_types_deities_gin_idx ON puja_types USING gin(deities);
CREATE INDEX IF NOT EXISTS puja_types_ceremonies_gin_idx ON puja_types USING gin(ceremonies);
CREATE INDEX IF NOT EXISTS puja_types_festivals_gin_idx ON puja_types USING gin(festivals);
CREATE INDEX IF NOT EXISTS puja_types_aliases_gin_idx ON puja_types USING gin(aliases);
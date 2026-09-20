ALTER TABLE pandits
  ADD COLUMN IF NOT EXISTS coordinate_accuracy real;

ALTER TABLE pandit_applications
  ADD COLUMN IF NOT EXISTS coordinate_source text,
  ADD COLUMN IF NOT EXISTS coordinate_confidence real,
  ADD COLUMN IF NOT EXISTS coordinate_accuracy real,
  ADD COLUMN IF NOT EXISTS coordinate_captured_at timestamp,
  ADD COLUMN IF NOT EXISTS coordinate_place_id text;

ALTER TABLE pandit_applications
  ADD CONSTRAINT pandit_applications_coordinate_pair_check
  CHECK ((latitude IS NULL AND longitude IS NULL) OR (latitude IS NOT NULL AND longitude IS NOT NULL));

ALTER TABLE pandit_applications
  ADD CONSTRAINT pandit_applications_coordinate_confidence_check
  CHECK (coordinate_confidence IS NULL OR coordinate_confidence BETWEEN 0 AND 1);

ALTER TABLE pandit_applications
  ADD CONSTRAINT pandit_applications_coordinate_accuracy_check
  CHECK (coordinate_accuracy IS NULL OR coordinate_accuracy >= 0);
ALTER TABLE "pandit_applications"
  ADD COLUMN IF NOT EXISTS "registered_address" text,
  ADD COLUMN IF NOT EXISTS "latitude" real,
  ADD COLUMN IF NOT EXISTS "longitude" real,
  ADD COLUMN IF NOT EXISTS "location_permission_granted" boolean NOT NULL DEFAULT false;

ALTER TABLE "pandit_applications"
  DROP CONSTRAINT IF EXISTS "pandit_applications_coordinates_check";
ALTER TABLE "pandit_applications"
  ADD CONSTRAINT "pandit_applications_coordinates_check"
  CHECK (("latitude" IS NULL AND "longitude" IS NULL) OR ("latitude" IS NOT NULL AND "longitude" IS NOT NULL));

ALTER TABLE "pandit_applications"
  DROP CONSTRAINT IF EXISTS "pandit_applications_latitude_check";
ALTER TABLE "pandit_applications"
  ADD CONSTRAINT "pandit_applications_latitude_check"
  CHECK ("latitude" IS NULL OR "latitude" BETWEEN -90 AND 90);

ALTER TABLE "pandit_applications"
  DROP CONSTRAINT IF EXISTS "pandit_applications_longitude_check";
ALTER TABLE "pandit_applications"
  ADD CONSTRAINT "pandit_applications_longitude_check"
  CHECK ("longitude" IS NULL OR "longitude" BETWEEN -180 AND 180);

-- One-time discovery rollout. The authoritative public eligibility gate still
-- requires verification and a resolved canonical location. Booking remains
-- disabled until normal booking-readiness checks pass.
UPDATE "pandits"
SET "directory_visible" = true,
    "search_eligible" = true
WHERE "archived" = false
  AND "account_status" NOT IN ('banned', 'suspended');
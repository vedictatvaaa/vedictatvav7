-- Auditable, additive storage for the Pandit location dry-run/review queue.
-- No Pandit governance flags or location values are changed by this migration.
ALTER TABLE "pandits" ADD COLUMN IF NOT EXISTS "coordinate_source" text;
ALTER TABLE "pandits" ADD COLUMN IF NOT EXISTS "coordinate_confidence" real;
ALTER TABLE "pandits" ADD COLUMN IF NOT EXISTS "coordinate_verified_at" timestamp;

CREATE TABLE IF NOT EXISTS "pandit_location_rectification_proposals" (
  "id" integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "pandit_id" integer NOT NULL REFERENCES "pandits"("id"),
  "dedupe_key" text NOT NULL,
  "batch_id" text,
  "status" text NOT NULL DEFAULT 'pending',
  "issue_categories" text[] NOT NULL DEFAULT '{}'::text[],
  "before" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "proposed" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "candidates" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "source" text NOT NULL,
  "confidence" real NOT NULL DEFAULT 0,
  "reason" text NOT NULL,
  "reviewed_by" text,
  "reviewed_at" timestamp,
  "applied_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "pandit_location_rectification_status_check"
    CHECK ("status" IN ('pending', 'approved', 'rejected', 'applied')),
  CONSTRAINT "pandit_location_rectification_confidence_check"
    CHECK ("confidence" BETWEEN 0 AND 1)
);
CREATE UNIQUE INDEX IF NOT EXISTS "pandit_location_rectification_dedupe_unique"
  ON "pandit_location_rectification_proposals" ("dedupe_key");
CREATE INDEX IF NOT EXISTS "pandit_location_rectification_pandit_status_idx"
  ON "pandit_location_rectification_proposals" ("pandit_id", "status");
CREATE INDEX IF NOT EXISTS "pandit_location_rectification_status_created_idx"
  ON "pandit_location_rectification_proposals" ("status", "created_at");
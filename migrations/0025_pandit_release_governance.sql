-- Additive production-release governance. New reviews fail closed, while
-- reviews created before moderation existed retain their prior public status.
ALTER TABLE "pandit_reviews"
  ADD COLUMN IF NOT EXISTS "status" text,
  ADD COLUMN IF NOT EXISTS "moderated_by" text,
  ADD COLUMN IF NOT EXISTS "moderated_at" timestamp,
  ADD COLUMN IF NOT EXISTS "moderation_reason" text;
UPDATE "pandit_reviews"
SET "status" = 'approved'
WHERE "status" IS NULL;
ALTER TABLE "pandit_reviews"
  ALTER COLUMN "status" SET DEFAULT 'pending',
  ALTER COLUMN "status" SET NOT NULL;
ALTER TABLE "pandit_reviews" DROP CONSTRAINT IF EXISTS "pandit_reviews_status_check";
ALTER TABLE "pandit_reviews" ADD CONSTRAINT "pandit_reviews_status_check"
  CHECK ("status" IN ('pending', 'approved', 'rejected', 'hidden'));
CREATE INDEX IF NOT EXISTS "pandit_reviews_public_status_idx"
  ON "pandit_reviews" ("pandit_id", "status");
-- 0024 may already have run in long-lived development databases. Mark it as
-- complete so a manual rerun of that historical migration cannot reset choices.
CREATE TABLE IF NOT EXISTS "migration_backfill_markers" (
  "key" text PRIMARY KEY,
  "applied_at" timestamp NOT NULL DEFAULT now()
);
INSERT INTO "migration_backfill_markers" ("key") VALUES ('0024_pandit_directory_governance_backfill')
  ON CONFLICT ("key") DO NOTHING;

-- Historical reviews predate moderation and remain the established genuine
-- corpus. This is intentionally one-way; new rows use the fail-closed default.
UPDATE "pandit_reviews" SET "status" = 'approved'
WHERE "status" = 'pending'
  AND NOT EXISTS (SELECT 1 FROM "migration_backfill_markers" WHERE "key" = '0025_legacy_reviews_approved');
INSERT INTO "migration_backfill_markers" ("key") VALUES ('0025_legacy_reviews_approved')
  ON CONFLICT ("key") DO NOTHING;

CREATE TABLE IF NOT EXISTS "pandit_slug_history" (
  "id" integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "pandit_id" integer NOT NULL REFERENCES "pandits"("id"),
  "slug" text NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "pandit_slug_history_slug_unique" ON "pandit_slug_history" ("slug");
CREATE INDEX IF NOT EXISTS "pandit_slug_history_pandit_idx" ON "pandit_slug_history" ("pandit_id");

CREATE TABLE IF NOT EXISTS "pandit_funnel_events" (
  "id" integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "pandit_id" integer REFERENCES "pandits"("id"),
  "event" text NOT NULL,
  "occurred_at" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "pandit_funnel_events_event_check" CHECK ("event" IN (
    'directory_impression', 'profile_view', 'contact_cta_click', 'contact_prompt_shown',
    'reveal_success', 'repeat_reveal', 'quota_exhausted', 'no_usable_contact',
    'click_to_call', 'booking_start', 'booking_completion', 'booking_error'
  ))
);
CREATE INDEX IF NOT EXISTS "pandit_funnel_events_event_time_idx" ON "pandit_funnel_events" ("event", "occurred_at");
CREATE INDEX IF NOT EXISTS "pandit_funnel_events_pandit_time_idx" ON "pandit_funnel_events" ("pandit_id", "occurred_at");
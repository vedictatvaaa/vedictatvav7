ALTER TABLE "pandits"
  ADD COLUMN IF NOT EXISTS "directory_visible" boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "search_eligible" boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "booking_enabled" boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "indexing_mode" text NOT NULL DEFAULT 'auto';

-- Preserve existing public/eligible records during the fail-closed rollout.
UPDATE "pandits"
SET "directory_visible" = true, "search_eligible" = true, "booking_enabled" = true
WHERE "verified" = true
  AND "on_leave" = false
  AND "location_review_status" = 'resolved'
  AND "account_status" <> 'banned'
  AND ("account_status" <> 'suspended' OR ("suspended_until" IS NOT NULL AND "suspended_until" <= now()));

ALTER TABLE "pandits" DROP CONSTRAINT IF EXISTS "pandits_indexing_mode_check";
ALTER TABLE "pandits" ADD CONSTRAINT "pandits_indexing_mode_check"
  CHECK ("indexing_mode" IN ('auto', 'noindex'));
CREATE INDEX IF NOT EXISTS "pandits_governance_eligibility_idx"
  ON "pandits" ("directory_visible", "search_eligible", "booking_enabled");
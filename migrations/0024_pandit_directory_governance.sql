ALTER TABLE "pandits"
  ADD COLUMN IF NOT EXISTS "directory_visible" boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "search_eligible" boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "booking_enabled" boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "indexing_mode" text NOT NULL DEFAULT 'auto',
  ADD COLUMN IF NOT EXISTS "archived" boolean NOT NULL DEFAULT false;

-- Preserve existing public directory records during the fail-closed rollout.
-- The audit guard makes manual reruns non-destructive after an administrator
-- has deliberately changed governance controls.
UPDATE "pandits"
SET "directory_visible" = true,
    "search_eligible" = true,
    "booking_enabled" = (
      lower(coalesce("availability", '')) = 'available'
      AND EXISTS (
        SELECT 1
        FROM "pandit_services" ps
        JOIN "master_services" ms ON ms."id" = ps."master_service_id"
        WHERE ps."pandit_id" = "pandits"."id"
          AND ps."is_active" = true
          AND ms."is_active" = true
      )
    )
WHERE "verified" = true
  AND "on_leave" = false
  AND "location_review_status" = 'resolved'
  AND "account_status" <> 'banned'
  AND "archived" = false
  AND ("account_status" <> 'suspended' OR ("suspended_until" IS NOT NULL AND "suspended_until" <= now()))
  AND NOT EXISTS (
    SELECT 1 FROM "admin_audit_logs" aal
    WHERE aal."target" = 'pandit:' || "pandits"."id"::text
      AND aal."action" LIKE 'pandit_governance.%'
  );

ALTER TABLE "pandits" DROP CONSTRAINT IF EXISTS "pandits_indexing_mode_check";
ALTER TABLE "pandits" ADD CONSTRAINT "pandits_indexing_mode_check"
  CHECK ("indexing_mode" IN ('auto', 'noindex'));
CREATE INDEX IF NOT EXISTS "pandits_governance_eligibility_idx"
  ON "pandits" ("directory_visible", "search_eligible", "booking_enabled", "archived");
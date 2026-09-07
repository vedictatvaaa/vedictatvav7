-- Supports the public eligibility scan and review aggregate used by the
-- paginated directory.  These are additive and safe on populated databases.
CREATE INDEX IF NOT EXISTS "pandits_public_directory_idx"
  ON "pandits" ("state_id", "city_id", "id")
  WHERE "verified" = true AND "on_leave" = false AND "location_review_status" = 'resolved';
CREATE INDEX IF NOT EXISTS "pandit_reviews_pandit_rating_idx"
  ON "pandit_reviews" ("pandit_id", "rating");
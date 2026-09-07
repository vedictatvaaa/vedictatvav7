ALTER TABLE "pandit_storefronts"
  ADD COLUMN IF NOT EXISTS "trust_badges" jsonb NOT NULL DEFAULT '[]'::jsonb;
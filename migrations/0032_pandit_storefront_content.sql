-- Additive, admin-reviewed Pandit storefront content workflow.
-- Draft copy and the last published copy are kept separately so stale or
-- rejected AI output can never replace a safe public storefront.
CREATE TABLE IF NOT EXISTS "pandit_storefront_content" (
  "id" integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "pandit_id" integer NOT NULL REFERENCES "pandits"("id"),
  "canonical_url" text NOT NULL,
  "source_snapshot_hash" text NOT NULL,
  "published_source_snapshot_hash" text,
  "source_fields" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "prompt_version" text NOT NULL,
  "model_identifier" text,
  "generated_profile_introduction" text,
  "generated_tagline" text,
  "generated_service_overview" text,
  "generated_seo_title" text,
  "generated_meta_description" text,
  "generated_faqs" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "generated_ai_summary" text,
  "published_profile_introduction" text,
  "published_tagline" text,
  "published_service_overview" text,
  "published_seo_title" text,
  "published_meta_description" text,
  "published_faqs" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "published_ai_summary" text,
  "status" text NOT NULL DEFAULT 'draft',
  "stale" boolean NOT NULL DEFAULT false,
  "stale_reason" text,
  "revision" integer NOT NULL DEFAULT 1,
  "generation_key" text,
  "created_by" text,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "generated_at" timestamp,
  "updated_by" text,
  "updated_at" timestamp NOT NULL DEFAULT now(),
  "reviewed_by" text,
  "reviewed_at" timestamp,
  "published_by" text,
  "published_at" timestamp,
  "rejected_by" text,
  "rejected_at" timestamp,
  "rejection_reason" text,
  CONSTRAINT "pandit_storefront_content_status_check"
    CHECK ("status" IN ('draft', 'reviewed', 'published', 'rejected'))
);
CREATE UNIQUE INDEX IF NOT EXISTS "pandit_storefront_content_pandit_unique"
  ON "pandit_storefront_content" ("pandit_id");
CREATE INDEX IF NOT EXISTS "pandit_storefront_content_status_idx"
  ON "pandit_storefront_content" ("status", "stale");
CREATE INDEX IF NOT EXISTS "pandit_storefront_content_source_hash_idx"
  ON "pandit_storefront_content" ("source_snapshot_hash");
ALTER TABLE "pandit_storefront_content"
  ADD COLUMN IF NOT EXISTS "generated_at" timestamp,
  ADD COLUMN IF NOT EXISTS "published_source_snapshot_hash" text;

-- Durable per-generation provenance and idempotency reservation. A unique key
-- is reserved before calling the model, preventing concurrent first requests
-- from creating duplicate revisions.
CREATE TABLE IF NOT EXISTS "pandit_storefront_content_generations" (
  "id" integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "pandit_id" integer NOT NULL REFERENCES "pandits"("id"),
  "content_id" integer REFERENCES "pandit_storefront_content"("id"),
  "generation_key" text NOT NULL,
  "source_snapshot_hash" text NOT NULL,
  "source_fields" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "prompt_version" text NOT NULL,
  "model_identifier" text,
  "draft" jsonb,
  "revision" integer,
  "status" text NOT NULL DEFAULT 'pending',
  "error" text,
  "reserved_at" timestamp NOT NULL DEFAULT now(),
  "completed_at" timestamp,
  "actor" text,
  CONSTRAINT "pandit_storefront_content_generations_status_check"
    CHECK ("status" IN ('pending', 'completed', 'failed'))
);
CREATE UNIQUE INDEX IF NOT EXISTS "pandit_storefront_content_generations_key_unique"
  ON "pandit_storefront_content_generations" ("generation_key");
CREATE INDEX IF NOT EXISTS "pandit_storefront_content_generations_pandit_idx"
  ON "pandit_storefront_content_generations" ("pandit_id", "reserved_at");
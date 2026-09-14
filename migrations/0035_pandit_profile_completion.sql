CREATE TABLE IF NOT EXISTS "pandit_profile_completion_proposals" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "pandit_id" integer NOT NULL REFERENCES "pandits"("id"),
  "batch_id" text NOT NULL,
  "field_key" text NOT NULL,
  "proposal_class" text NOT NULL,
  "safe_batch" boolean NOT NULL DEFAULT false,
  "status" text NOT NULL DEFAULT 'pending',
  "before" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "proposed" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "source_snapshot" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "source_snapshot_hash" text NOT NULL,
  "source_paths" text[] NOT NULL DEFAULT '{}'::text[],
  "confidence" real NOT NULL DEFAULT 0,
  "reason" text NOT NULL,
  "generation_key" text,
  "reviewed_by" text,
  "reviewed_at" timestamp,
  "applied_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "pandit_profile_completion_status_check" CHECK ("status" IN ('pending', 'approved', 'rejected', 'applied', 'stale')),
  CONSTRAINT "pandit_profile_completion_class_check" CHECK ("proposal_class" IN ('deterministic', 'ai_draft')),
  CONSTRAINT "pandit_profile_completion_confidence_check" CHECK ("confidence" BETWEEN 0 AND 1)
);
CREATE INDEX IF NOT EXISTS "pandit_profile_completion_pandit_status_idx"
  ON "pandit_profile_completion_proposals" ("pandit_id", "status");
CREATE INDEX IF NOT EXISTS "pandit_profile_completion_batch_idx"
  ON "pandit_profile_completion_proposals" ("batch_id");
CREATE INDEX IF NOT EXISTS "pandit_profile_completion_status_created_idx"
  ON "pandit_profile_completion_proposals" ("status", "created_at");
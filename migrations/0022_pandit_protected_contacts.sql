ALTER TABLE "site_settings"
  ADD COLUMN IF NOT EXISTS "pandit_contact_mode" text NOT NULL DEFAULT 'login_required';

ALTER TABLE "pandit_storefronts"
  ADD COLUMN IF NOT EXISTS "contact_access_override" text NOT NULL DEFAULT 'use_global';

CREATE TABLE IF NOT EXISTS "pandit_contact_reveals" (
  "id" integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "user_id" integer NOT NULL REFERENCES "users"("id"),
  "pandit_id" integer NOT NULL REFERENCES "pandits"("id"),
  "revealed_at" timestamp NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "pandit_contact_reveals_user_pandit_unique"
  ON "pandit_contact_reveals" ("user_id", "pandit_id");
CREATE INDEX IF NOT EXISTS "pandit_contact_reveals_user_revealed_idx"
  ON "pandit_contact_reveals" ("user_id", "revealed_at");
CREATE TABLE IF NOT EXISTS "page_views" (
  "id" integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "session_id" text,
  "path" text NOT NULL,
  "referrer" text,
  "user_agent" text,
  "ip" text,
  "country" text,
  "city" text,
  "device" text,
  "browser" text,
  "os" text,
  "created_at" timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "page_views_created_at_idx"
  ON "page_views" ("created_at");

CREATE INDEX IF NOT EXISTS "page_views_session_idx"
  ON "page_views" ("session_id");
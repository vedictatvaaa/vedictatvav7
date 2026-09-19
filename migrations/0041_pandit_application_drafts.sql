CREATE TABLE IF NOT EXISTS pandit_application_drafts (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  token_hash varchar(64) NOT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  expires_at timestamp NOT NULL,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS pandit_application_drafts_token_hash_unique
  ON pandit_application_drafts (token_hash);

CREATE INDEX IF NOT EXISTS pandit_application_drafts_expires_at_idx
  ON pandit_application_drafts (expires_at);
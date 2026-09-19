CREATE TABLE IF NOT EXISTS customer_email_verification_challenges (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email text NOT NULL,
  code_hash text NOT NULL,
  attempts integer NOT NULL DEFAULT 0,
  expires_at timestamp NOT NULL,
  verified_at timestamp,
  registration_token_hash text,
  token_expires_at timestamp,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS customer_email_verification_email_created_idx
  ON customer_email_verification_challenges (email, created_at DESC);

CREATE INDEX IF NOT EXISTS customer_email_verification_token_idx
  ON customer_email_verification_challenges (registration_token_hash)
  WHERE registration_token_hash IS NOT NULL;
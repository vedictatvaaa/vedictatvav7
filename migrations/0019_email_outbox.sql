CREATE TABLE IF NOT EXISTS email_outbox (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  event_key text NOT NULL UNIQUE,
  kind text NOT NULL,
  recipient_email text NOT NULL,
  recipient_name text,
  related_type text,
  related_id integer,
  booking_delivery_id integer,
  subject text NOT NULL,
  payload_ciphertext text,
  payload_iv text,
  payload_auth_tag text,
  status text NOT NULL DEFAULT 'queued',
  attempt_count integer NOT NULL DEFAULT 0,
  next_attempt_at timestamp DEFAULT now(),
  locked_at timestamp,
  last_error text,
  sent_at timestamp,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS email_outbox_status_due_idx ON email_outbox (status, next_attempt_at);
CREATE INDEX IF NOT EXISTS email_outbox_kind_status_idx ON email_outbox (kind, status);
CREATE INDEX IF NOT EXISTS email_outbox_recipient_idx ON email_outbox (recipient_email);
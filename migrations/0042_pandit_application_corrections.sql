CREATE TABLE IF NOT EXISTS pandit_application_correction_requests (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  application_id integer NOT NULL REFERENCES pandit_applications(id),
  token_hash varchar(64) NOT NULL UNIQUE,
  requested_fields text[] NOT NULL,
  explanation text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  expires_at timestamp NOT NULL,
  created_by text NOT NULL,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now(),
  submitted_at timestamp,
  CONSTRAINT pandit_application_correction_status_check CHECK (status IN ('open', 'submitted', 'expired'))
);
CREATE INDEX IF NOT EXISTS pandit_application_correction_application_status_idx
  ON pandit_application_correction_requests (application_id, status);
CREATE INDEX IF NOT EXISTS pandit_application_correction_expires_at_idx
  ON pandit_application_correction_requests (expires_at);

CREATE TABLE IF NOT EXISTS pandit_application_correction_events (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  request_id integer NOT NULL REFERENCES pandit_application_correction_requests(id),
  application_id integer NOT NULL REFERENCES pandit_applications(id),
  event_type text NOT NULL,
  changed_fields text[] NOT NULL DEFAULT '{}',
  actor_type text NOT NULL,
  created_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT pandit_application_correction_event_type_check
    CHECK (event_type IN ('request_created', 'fields_edited', 'resubmitted')),
  CONSTRAINT pandit_application_correction_event_actor_check
    CHECK (actor_type IN ('admin', 'applicant'))
);
CREATE INDEX IF NOT EXISTS pandit_application_correction_event_request_idx
  ON pandit_application_correction_events (request_id, created_at);
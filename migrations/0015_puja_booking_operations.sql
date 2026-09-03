-- Additive only: legacy booking modes/statuses and pricing snapshots are retained.
ALTER TABLE master_services
  ADD COLUMN IF NOT EXISTS min_rate integer,
  ADD COLUMN IF NOT EXISTS max_rate integer,
  ADD COLUMN IF NOT EXISTS currency varchar(3) NOT NULL DEFAULT 'INR',
  ADD COLUMN IF NOT EXISTS allowed_booking_mode text,
  ADD COLUMN IF NOT EXISTS default_duration_minutes integer,
  ADD COLUMN IF NOT EXISTS rate_policy_version integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS rate_policy_effective_at timestamp,
  ADD COLUMN IF NOT EXISTS default_samagri_template jsonb;
ALTER TABLE master_services DROP CONSTRAINT IF EXISTS master_services_rate_policy_valid;
ALTER TABLE master_services ADD CONSTRAINT master_services_rate_policy_valid CHECK (
  (min_rate IS NULL AND max_rate IS NULL) OR
  (min_rate IS NOT NULL AND max_rate IS NOT NULL AND min_rate >= 0 AND max_rate >= min_rate)
);
ALTER TABLE master_services ADD CONSTRAINT master_services_booking_mode_valid
  CHECK (allowed_booking_mode IS NULL OR allowed_booking_mode IN ('virtual','at_home','both'));

ALTER TABLE puja_bookings
  ADD COLUMN IF NOT EXISTS contact_email text,
  ADD COLUMN IF NOT EXISTS customer_timezone text,
  ADD COLUMN IF NOT EXISTS address_house text,
  ADD COLUMN IF NOT EXISTS address_street text,
  ADD COLUMN IF NOT EXISTS address_locality text,
  ADD COLUMN IF NOT EXISTS address_city text,
  ADD COLUMN IF NOT EXISTS address_state text,
  ADD COLUMN IF NOT EXISTS address_postal_code text,
  ADD COLUMN IF NOT EXISTS address_landmark text,
  ADD COLUMN IF NOT EXISTS customer_latitude real,
  ADD COLUMN IF NOT EXISTS customer_longitude real,
  ADD COLUMN IF NOT EXISTS virtual_joining_preference text,
  ADD COLUMN IF NOT EXISTS matched_distance_km real,
  ADD COLUMN IF NOT EXISTS travel_band_id integer,
  ADD COLUMN IF NOT EXISTS travel_amount integer,
  ADD COLUMN IF NOT EXISTS pricing_policy_version integer,
  ADD COLUMN IF NOT EXISTS contact_released_at timestamp;
ALTER TABLE puja_bookings DROP CONSTRAINT IF EXISTS puja_bookings_customer_coordinate_pair_valid;
ALTER TABLE puja_bookings ADD CONSTRAINT puja_bookings_customer_coordinate_pair_valid CHECK (
  (customer_latitude IS NULL AND customer_longitude IS NULL) OR
  (customer_latitude BETWEEN -90 AND 90 AND customer_longitude BETWEEN -180 AND 180)
);
ALTER TABLE puja_bookings ADD CONSTRAINT puja_bookings_travel_amount_nonnegative CHECK (travel_amount IS NULL OR travel_amount >= 0);
ALTER TABLE puja_bookings ADD CONSTRAINT puja_bookings_distance_nonnegative CHECK (matched_distance_km IS NULL OR matched_distance_km >= 0);

CREATE TABLE IF NOT EXISTS master_service_policy_audits (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY, master_service_id integer NOT NULL REFERENCES master_services(id),
  previous_policy jsonb, next_policy jsonb NOT NULL, admin_user_id integer, reason text, created_at timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS master_service_policy_audits_service_created_idx ON master_service_policy_audits(master_service_id, created_at);
CREATE TABLE IF NOT EXISTS travel_bands (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY, min_distance_km real NOT NULL, max_distance_km real NOT NULL,
  charge integer NOT NULL, currency varchar(3) NOT NULL DEFAULT 'INR', is_active boolean NOT NULL DEFAULT true,
  effective_at timestamp NOT NULL DEFAULT now(), requires_distant_confirmation boolean NOT NULL DEFAULT false,
  created_at timestamp NOT NULL DEFAULT now(), updated_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT travel_bands_range_valid CHECK (min_distance_km >= 0 AND max_distance_km >= min_distance_km),
  CONSTRAINT travel_bands_charge_nonnegative CHECK (charge >= 0)
);
CREATE INDEX IF NOT EXISTS travel_bands_active_distance_idx ON travel_bands(is_active, min_distance_km, max_distance_km);
CREATE TABLE IF NOT EXISTS puja_booking_contact_releases (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY, booking_id integer NOT NULL REFERENCES puja_bookings(id),
  pandit_id integer NOT NULL REFERENCES pandits(id), released_at timestamp NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS puja_booking_contact_releases_booking_unique ON puja_booking_contact_releases(booking_id);
CREATE TABLE IF NOT EXISTS puja_booking_events (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY, booking_id integer NOT NULL REFERENCES puja_bookings(id),
  event_type text NOT NULL, recipient_party text NOT NULL, recipient_id integer, payload jsonb, created_at timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS puja_booking_events_booking_created_idx ON puja_booking_events(booking_id, created_at);
CREATE TABLE IF NOT EXISTS puja_booking_deliveries (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY, event_id integer NOT NULL REFERENCES puja_booking_events(id),
  channel text NOT NULL, template_version text NOT NULL DEFAULT 'v1', idempotency_key text NOT NULL, status text NOT NULL DEFAULT 'queued',
  attempt_count integer NOT NULL DEFAULT 0, provider_reference text, last_error text, sent_at timestamp,
  created_at timestamp NOT NULL DEFAULT now(), updated_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT puja_booking_deliveries_status_valid CHECK (status IN ('queued','sent','failed','retrying','skipped'))
);
CREATE UNIQUE INDEX IF NOT EXISTS puja_booking_deliveries_idempotency_unique ON puja_booking_deliveries(idempotency_key);
CREATE TABLE IF NOT EXISTS puja_booking_samagri_versions (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY, booking_id integer NOT NULL REFERENCES puja_bookings(id),
  version integer NOT NULL, author_pandit_id integer NOT NULL REFERENCES pandits(id), items jsonb NOT NULL,
  sent_at timestamp NOT NULL DEFAULT now(), created_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT puja_booking_samagri_versions_positive CHECK (version > 0)
);
CREATE UNIQUE INDEX IF NOT EXISTS puja_booking_samagri_versions_booking_version_unique ON puja_booking_samagri_versions(booking_id, version);
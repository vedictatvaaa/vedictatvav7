CREATE TABLE IF NOT EXISTS indian_states (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL,
  code varchar(3) NOT NULL,
  is_union_territory boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS indian_states_name_unique ON indian_states (name);
CREATE UNIQUE INDEX IF NOT EXISTS indian_states_code_unique ON indian_states (code);
CREATE INDEX IF NOT EXISTS indian_states_active_idx ON indian_states (is_active);

CREATE TABLE IF NOT EXISTS indian_cities (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  state_id integer NOT NULL REFERENCES indian_states(id),
  name text NOT NULL,
  slug text NOT NULL,
  aliases text[] NOT NULL DEFAULT '{}'::text[],
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS indian_cities_state_name_unique ON indian_cities (state_id, name);
CREATE UNIQUE INDEX IF NOT EXISTS indian_cities_slug_unique ON indian_cities (slug);
CREATE INDEX IF NOT EXISTS indian_cities_state_active_idx ON indian_cities (state_id, is_active);

ALTER TABLE pandits ADD COLUMN IF NOT EXISTS state text;
ALTER TABLE pandits ADD COLUMN IF NOT EXISTS state_id integer REFERENCES indian_states(id);
ALTER TABLE pandits ADD COLUMN IF NOT EXISTS city_id integer REFERENCES indian_cities(id);
ALTER TABLE pandits ADD COLUMN IF NOT EXISTS original_city text;
ALTER TABLE pandits ADD COLUMN IF NOT EXISTS original_state text;
ALTER TABLE pandits ADD COLUMN IF NOT EXISTS location_review_status text DEFAULT 'needs_review';
UPDATE pandits SET original_state = state WHERE original_state IS NULL AND state IS NOT NULL;
CREATE INDEX IF NOT EXISTS pandits_state_id_idx ON pandits (state_id);
CREATE INDEX IF NOT EXISTS pandits_city_id_idx ON pandits (city_id);

ALTER TABLE pandit_applications ADD COLUMN IF NOT EXISTS state text;
ALTER TABLE pandit_applications ADD COLUMN IF NOT EXISTS state_id integer REFERENCES indian_states(id);
ALTER TABLE pandit_applications ADD COLUMN IF NOT EXISTS city_id integer REFERENCES indian_cities(id);
ALTER TABLE pandit_applications ADD COLUMN IF NOT EXISTS original_city text;
ALTER TABLE pandit_applications ADD COLUMN IF NOT EXISTS original_state text;
ALTER TABLE pandit_applications ADD COLUMN IF NOT EXISTS location_review_status text DEFAULT 'needs_review';
UPDATE pandit_applications SET original_state = state WHERE original_state IS NULL AND state IS NOT NULL;
CREATE INDEX IF NOT EXISTS pandit_applications_state_id_idx ON pandit_applications (state_id);
CREATE INDEX IF NOT EXISTS pandit_applications_city_id_idx ON pandit_applications (city_id);
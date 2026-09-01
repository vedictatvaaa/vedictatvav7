ALTER TABLE pandit_storefronts
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'published';

CREATE TABLE IF NOT EXISTS master_services (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL,
  category text NOT NULL,
  description text NOT NULL DEFAULT '',
  service_type text NOT NULL DEFAULT 'puja',
  supported_modes text[] NOT NULL DEFAULT '{}'::text[],
  online_available boolean NOT NULL DEFAULT false,
  physical_available boolean NOT NULL DEFAULT true,
  search_metadata jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS master_services_slug_unique ON master_services (slug);
CREATE INDEX IF NOT EXISTS master_services_active_idx ON master_services (is_active);

CREATE TABLE IF NOT EXISTS pandit_services (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  pandit_id integer NOT NULL REFERENCES pandits(id),
  master_service_id integer NOT NULL REFERENCES master_services(id),
  price integer NOT NULL,
  duration_minutes integer NOT NULL,
  mode text NOT NULL DEFAULT 'in_person',
  description text NOT NULL DEFAULT '',
  preparation text NOT NULL DEFAULT '',
  inclusions text[] NOT NULL DEFAULT '{}'::text[],
  service_areas text[] NOT NULL DEFAULT '{}'::text[],
  availability text,
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS pandit_services_pandit_master_unique
  ON pandit_services (pandit_id, master_service_id);
CREATE INDEX IF NOT EXISTS pandit_services_pandit_active_idx
  ON pandit_services (pandit_id, is_active);
CREATE INDEX IF NOT EXISTS pandit_services_master_active_idx
  ON pandit_services (master_service_id, is_active);
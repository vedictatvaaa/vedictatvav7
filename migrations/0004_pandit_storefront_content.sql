CREATE TABLE IF NOT EXISTS pandit_packages (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  pandit_id integer NOT NULL REFERENCES pandits(id), name text NOT NULL, slug text NOT NULL,
  description text NOT NULL DEFAULT '', price integer NOT NULL, compare_at_price integer,
  is_active boolean NOT NULL DEFAULT true, is_published boolean NOT NULL DEFAULT false,
  display_order integer NOT NULL DEFAULT 0, created_at timestamp NOT NULL DEFAULT now(), updated_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT pandit_packages_price_check CHECK (price >= 0),
  CONSTRAINT pandit_packages_compare_price_check CHECK (compare_at_price IS NULL OR compare_at_price > price)
);
CREATE UNIQUE INDEX IF NOT EXISTS pandit_packages_pandit_slug_unique ON pandit_packages(pandit_id, slug);
CREATE INDEX IF NOT EXISTS pandit_packages_pandit_public_idx ON pandit_packages(pandit_id, is_active, is_published);
CREATE TABLE IF NOT EXISTS pandit_package_items (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY, package_id integer NOT NULL REFERENCES pandit_packages(id) ON DELETE CASCADE,
  pandit_service_id integer NOT NULL REFERENCES pandit_services(id), display_order integer NOT NULL DEFAULT 0
);
CREATE UNIQUE INDEX IF NOT EXISTS pandit_package_items_package_service_unique ON pandit_package_items(package_id, pandit_service_id);
CREATE INDEX IF NOT EXISTS pandit_package_items_package_order_idx ON pandit_package_items(package_id, display_order);
CREATE TABLE IF NOT EXISTS pandit_gallery_items (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY, pandit_id integer NOT NULL REFERENCES pandits(id),
  media_kind text NOT NULL DEFAULT 'image', media_url text NOT NULL, alt_text text NOT NULL, caption text,
  display_order integer NOT NULL DEFAULT 0, is_published boolean NOT NULL DEFAULT false, removed_at timestamp,
  created_at timestamp NOT NULL DEFAULT now(), updated_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT pandit_gallery_items_kind_check CHECK (media_kind IN ('image', 'video'))
);
CREATE INDEX IF NOT EXISTS pandit_gallery_items_pandit_public_idx ON pandit_gallery_items(pandit_id, is_published, display_order);
CREATE TABLE IF NOT EXISTS pandit_availability_rules (
 id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY, pandit_id integer NOT NULL REFERENCES pandits(id), weekday integer NOT NULL,
 start_minutes integer NOT NULL, end_minutes integer NOT NULL, timezone text NOT NULL DEFAULT 'Asia/Kolkata', mode text NOT NULL,
 is_active boolean NOT NULL DEFAULT true, effective_from timestamp, effective_until timestamp,
 created_at timestamp NOT NULL DEFAULT now(), updated_at timestamp NOT NULL DEFAULT now(),
 CONSTRAINT pandit_availability_rules_weekday_check CHECK (weekday BETWEEN 0 AND 6),
 CONSTRAINT pandit_availability_rules_minutes_check CHECK (start_minutes >= 0 AND end_minutes <= 1440 AND start_minutes < end_minutes),
 CONSTRAINT pandit_availability_rules_mode_check CHECK (mode IN ('in_person','online','hybrid'))
);
CREATE INDEX IF NOT EXISTS pandit_availability_rules_pandit_active_idx ON pandit_availability_rules(pandit_id, is_active, weekday);

ALTER TABLE puja_bookings ADD COLUMN IF NOT EXISTS pandit_service_id integer;
ALTER TABLE puja_bookings ADD COLUMN IF NOT EXISTS pandit_package_id integer;
ALTER TABLE puja_bookings ADD COLUMN IF NOT EXISTS pricing_snapshot jsonb;
CREATE INDEX IF NOT EXISTS puja_bookings_pandit_service_id_idx ON puja_bookings(pandit_service_id);
CREATE INDEX IF NOT EXISTS puja_bookings_pandit_package_id_idx ON puja_bookings(pandit_package_id);
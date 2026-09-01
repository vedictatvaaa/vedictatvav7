ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS pandit_seo_network_enabled boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS pandit_seo_editorials (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  entity_type text NOT NULL,
  entity_key text NOT NULL,
  introduction text NOT NULL DEFAULT '',
  faqs jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'draft',
  revision integer NOT NULL DEFAULT 1,
  created_by text,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_by text,
  updated_at timestamp NOT NULL DEFAULT now(),
  reviewed_by text,
  reviewed_at timestamp,
  published_by text,
  published_at timestamp,
  CONSTRAINT pandit_seo_editorials_entity_type_check CHECK (entity_type IN ('profile', 'city', 'city_service')),
  CONSTRAINT pandit_seo_editorials_status_check CHECK (status IN ('draft', 'reviewed', 'published')),
  CONSTRAINT pandit_seo_editorials_revision_check CHECK (revision >= 1)
);
CREATE UNIQUE INDEX IF NOT EXISTS pandit_seo_editorials_entity_unique
  ON pandit_seo_editorials(entity_type, entity_key);
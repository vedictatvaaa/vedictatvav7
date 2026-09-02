-- Phase 2 canonical destinations. Rollback safety: disable the public gate
-- first; retain aliases; never delete a canonical row with graph references.
CREATE TABLE tirths (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  migration_source_key text NOT NULL, slug text NOT NULL, name text NOT NULL, name_hindi text,
  status text NOT NULL DEFAULT 'DRAFT', provenance text NOT NULL, region text, state text, deity text, category text,
  short_description text, description text, latitude real, longitude real, hero_media_url text,
  editorial jsonb NOT NULL DEFAULT '{}'::jsonb, created_at timestamp NOT NULL DEFAULT now(), updated_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT tirths_status_check CHECK (status IN ('DRAFT','PUBLISHED','ARCHIVED')),
  CONSTRAINT tirths_provenance_check CHECK (provenance IN ('TIRTH_GUIDE','TEMPLE_TOURISM','EDITORIAL')),
  CONSTRAINT tirths_migration_source_key_check CHECK (length(migration_source_key) BETWEEN 1 AND 200),
  CONSTRAINT tirths_slug_check CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  CONSTRAINT tirths_editorial_check CHECK (jsonb_typeof(editorial) = 'object'),
  CONSTRAINT tirths_coordinates_check CHECK ((latitude IS NULL AND longitude IS NULL) OR (latitude IS NOT NULL AND longitude IS NOT NULL)),
  CONSTRAINT tirths_latitude_range_check CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90),
  CONSTRAINT tirths_longitude_range_check CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180)
);
CREATE TABLE temples (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  migration_source_key text NOT NULL, slug text NOT NULL, name text NOT NULL, name_hindi text,
  status text NOT NULL DEFAULT 'DRAFT', provenance text NOT NULL, location text, state text, deity text, category text,
  short_description text, description text, latitude real, longitude real, hero_media_url text,
  editorial jsonb NOT NULL DEFAULT '{}'::jsonb, created_at timestamp NOT NULL DEFAULT now(), updated_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT temples_status_check CHECK (status IN ('DRAFT','PUBLISHED','ARCHIVED')),
  CONSTRAINT temples_provenance_check CHECK (provenance IN ('TEMPLE_TOURISM','EDITORIAL')),
  CONSTRAINT temples_migration_source_key_check CHECK (length(migration_source_key) BETWEEN 1 AND 200),
  CONSTRAINT temples_slug_check CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  CONSTRAINT temples_editorial_check CHECK (jsonb_typeof(editorial) = 'object'),
  CONSTRAINT temples_coordinates_check CHECK ((latitude IS NULL AND longitude IS NULL) OR (latitude IS NOT NULL AND longitude IS NOT NULL)),
  CONSTRAINT temples_latitude_range_check CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90),
  CONSTRAINT temples_longitude_range_check CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180)
);
CREATE TABLE destination_slug_aliases (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY, entity_type text NOT NULL, entity_id integer NOT NULL,
  alias_slug text NOT NULL, canonical_slug text NOT NULL, created_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT destination_slug_aliases_entity_type_check CHECK (entity_type IN ('TIRTH','TEMPLE')),
  CONSTRAINT destination_slug_aliases_entity_id_check CHECK (entity_id > 0),
  CONSTRAINT destination_slug_aliases_alias_slug_check CHECK (alias_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  CONSTRAINT destination_slug_aliases_canonical_slug_check CHECK (canonical_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  CONSTRAINT destination_slug_aliases_non_self_check CHECK (alias_slug <> canonical_slug)
);
CREATE TABLE knowledge_graph_public_state (
  id integer PRIMARY KEY DEFAULT 1, is_public_enabled boolean NOT NULL DEFAULT false,
  generation integer NOT NULL DEFAULT 0, updated_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT knowledge_graph_public_state_singleton_check CHECK (id = 1),
  CONSTRAINT knowledge_graph_public_state_generation_check CHECK (generation >= 0)
);
-- Migration provenance is an immutable identity, not editable editorial data.
CREATE OR REPLACE FUNCTION prevent_destination_migration_source_key_change() RETURNS trigger AS $$
BEGIN
  IF NEW.migration_source_key IS DISTINCT FROM OLD.migration_source_key THEN
    RAISE EXCEPTION 'migration_source_key is immutable';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER tirths_migration_source_key_immutable BEFORE UPDATE ON tirths
  FOR EACH ROW EXECUTE FUNCTION prevent_destination_migration_source_key_change();
CREATE TRIGGER temples_migration_source_key_immutable BEFORE UPDATE ON temples
  FOR EACH ROW EXECUTE FUNCTION prevent_destination_migration_source_key_change();
CREATE OR REPLACE FUNCTION validate_destination_slug_alias() RETURNS trigger AS $$
DECLARE expected_slug text;
BEGIN
  IF NEW.entity_type = 'TIRTH' THEN
    SELECT slug INTO expected_slug FROM tirths WHERE id = NEW.entity_id;
  ELSIF NEW.entity_type = 'TEMPLE' THEN
    SELECT slug INTO expected_slug FROM temples WHERE id = NEW.entity_id;
  ELSE
    RAISE EXCEPTION 'unsupported destination alias entity type: %', NEW.entity_type;
  END IF;
  IF expected_slug IS NULL THEN
    RAISE EXCEPTION 'destination alias endpoint does not exist: %:%', NEW.entity_type, NEW.entity_id;
  END IF;
  IF NEW.canonical_slug IS DISTINCT FROM expected_slug THEN
    RAISE EXCEPTION 'destination alias canonical slug does not match endpoint slug';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER destination_slug_aliases_validate BEFORE INSERT OR UPDATE ON destination_slug_aliases
  FOR EACH ROW EXECUTE FUNCTION validate_destination_slug_alias();
-- Keep aliases coherent when a future editorial service changes a canonical
-- slug and adds OLD.slug as a new alias in the same transaction.
CREATE OR REPLACE FUNCTION sync_destination_alias_canonical_slug() RETURNS trigger AS $$
BEGIN
  IF NEW.slug IS DISTINCT FROM OLD.slug THEN
    UPDATE destination_slug_aliases
      SET canonical_slug = NEW.slug
      WHERE entity_type = TG_ARGV[0] AND entity_id = NEW.id AND canonical_slug = OLD.slug;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER tirths_sync_destination_alias_slug AFTER UPDATE OF slug ON tirths
  FOR EACH ROW EXECUTE FUNCTION sync_destination_alias_canonical_slug('TIRTH');
CREATE TRIGGER temples_sync_destination_alias_slug AFTER UPDATE OF slug ON temples
  FOR EACH ROW EXECUTE FUNCTION sync_destination_alias_canonical_slug('TEMPLE');
-- Source deletion is deliberately fail-closed. Neither aliases nor graph
-- edges cascade into source records or vice versa.
CREATE OR REPLACE FUNCTION prevent_referenced_destination_delete() RETURNS trigger AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM destination_slug_aliases
    WHERE entity_type = TG_ARGV[0] AND entity_id = OLD.id
  ) THEN
    RAISE EXCEPTION 'cannot delete destination with slug aliases: %:%', TG_ARGV[0], OLD.id;
  END IF;
  IF EXISTS (
    SELECT 1 FROM knowledge_graph_relationships
    WHERE (source_entity_type = TG_ARGV[0] AND source_entity_id = OLD.id)
       OR (target_entity_type = TG_ARGV[0] AND target_entity_id = OLD.id)
  ) THEN
    RAISE EXCEPTION 'cannot delete destination with knowledge graph relationships: %:%', TG_ARGV[0], OLD.id;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER tirths_prevent_referenced_delete BEFORE DELETE ON tirths
  FOR EACH ROW EXECUTE FUNCTION prevent_referenced_destination_delete('TIRTH');
CREATE TRIGGER temples_prevent_referenced_delete BEFORE DELETE ON temples
  FOR EACH ROW EXECUTE FUNCTION prevent_referenced_destination_delete('TEMPLE');
INSERT INTO knowledge_graph_public_state (id, is_public_enabled, generation) VALUES (1, false, 0) ON CONFLICT (id) DO NOTHING;
CREATE UNIQUE INDEX tirths_migration_source_key_unique ON tirths(migration_source_key);
CREATE UNIQUE INDEX tirths_slug_unique ON tirths(slug);
CREATE INDEX tirths_status_idx ON tirths(status); CREATE INDEX tirths_public_eligibility_idx ON tirths(status, slug);
CREATE UNIQUE INDEX temples_migration_source_key_unique ON temples(migration_source_key);
CREATE UNIQUE INDEX temples_slug_unique ON temples(slug);
CREATE INDEX temples_status_idx ON temples(status); CREATE INDEX temples_public_eligibility_idx ON temples(status, slug);
CREATE UNIQUE INDEX destination_slug_aliases_entity_alias_unique ON destination_slug_aliases(entity_type, alias_slug);
CREATE INDEX destination_slug_aliases_alias_lookup_idx ON destination_slug_aliases(alias_slug);
CREATE INDEX destination_slug_aliases_entity_lookup_idx ON destination_slug_aliases(entity_type, entity_id);
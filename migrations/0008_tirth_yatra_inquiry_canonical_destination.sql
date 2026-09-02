-- Phase 3: retain historical free-text tour fields while optionally recording
-- the canonical destination identity resolved at inquiry creation time.
ALTER TABLE tirth_yatra_inquiries
  ADD COLUMN canonical_destination_type text,
  ADD COLUMN canonical_destination_id integer;
ALTER TABLE tirth_yatra_inquiries
  ADD CONSTRAINT tirth_yatra_inquiries_canonical_destination_check
  CHECK (
    (canonical_destination_type IS NULL AND canonical_destination_id IS NULL)
    OR (canonical_destination_type IS NOT NULL AND canonical_destination_id IS NOT NULL
        AND canonical_destination_type IN ('TIRTH','TEMPLE') AND canonical_destination_id > 0)
  );
CREATE INDEX tirth_yatra_inquiries_canonical_destination_idx
  ON tirth_yatra_inquiries(canonical_destination_type, canonical_destination_id);
-- Extend the existing Phase 2 fail-closed deletion guard. Existing triggers
-- call this function by name, so replacing it also protects inquiry references.
CREATE OR REPLACE FUNCTION prevent_referenced_destination_delete() RETURNS trigger AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM destination_slug_aliases
             WHERE entity_type = TG_ARGV[0] AND entity_id = OLD.id) THEN
    RAISE EXCEPTION 'cannot delete destination with slug aliases: %:%', TG_ARGV[0], OLD.id;
  END IF;
  IF EXISTS (SELECT 1 FROM knowledge_graph_relationships
             WHERE (source_entity_type = TG_ARGV[0] AND source_entity_id = OLD.id)
                OR (target_entity_type = TG_ARGV[0] AND target_entity_id = OLD.id)) THEN
    RAISE EXCEPTION 'cannot delete destination with knowledge graph relationships: %:%', TG_ARGV[0], OLD.id;
  END IF;
  IF EXISTS (SELECT 1 FROM tirth_yatra_inquiries
             WHERE canonical_destination_type = TG_ARGV[0] AND canonical_destination_id = OLD.id) THEN
    RAISE EXCEPTION 'cannot delete destination referenced by inquiry: %:%', TG_ARGV[0], OLD.id;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;
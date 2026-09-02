-- Projection freshness is owned beside, not inside, authoritative content.
CREATE TABLE IF NOT EXISTS knowledge_graph_entity_revisions (
  entity_type text NOT NULL,
  entity_id integer NOT NULL,
  discriminator text NOT NULL DEFAULT '',
  updated_at timestamp NOT NULL DEFAULT now(),
  PRIMARY KEY (entity_type, entity_id, discriminator),
  CONSTRAINT knowledge_graph_entity_revisions_type_check CHECK (entity_type IN ('PUJA','PANDIT','LOCATION','TIRTH','TEMPLE','PRODUCT','ARTICLE','SERVICE','REVIEW','YATRA')),
  CONSTRAINT knowledge_graph_entity_revisions_id_check CHECK (entity_id > 0),
  CONSTRAINT knowledge_graph_entity_revisions_location_check CHECK ((entity_type = 'LOCATION' AND discriminator IN ('STATE','CITY')) OR (entity_type <> 'LOCATION' AND discriminator = ''))
);
-- Establish a trustworthy baseline before triggers take ownership of future writes.
INSERT INTO knowledge_graph_entity_revisions (entity_type, entity_id, discriminator, updated_at)
SELECT 'PUJA', id, '', COALESCE(updated_at, now()) FROM puja_types
UNION ALL SELECT 'PANDIT', id, '', now() FROM pandits
UNION ALL SELECT 'LOCATION', id, 'STATE', COALESCE(updated_at, now()) FROM indian_states
UNION ALL SELECT 'LOCATION', id, 'CITY', COALESCE(updated_at, now()) FROM indian_cities
UNION ALL SELECT 'TIRTH', id, '', updated_at FROM tirths
UNION ALL SELECT 'TEMPLE', id, '', updated_at FROM temples
UNION ALL SELECT 'PRODUCT', id, '', now() FROM products
UNION ALL SELECT 'ARTICLE', id, '', now() FROM blog_posts
UNION ALL SELECT 'SERVICE', id, '', COALESCE(updated_at, now()) FROM master_services
UNION ALL SELECT 'REVIEW', id, '', now() FROM product_reviews
UNION ALL SELECT 'YATRA', id, '', now() FROM tirth_yatra_tours
ON CONFLICT (entity_type, entity_id, discriminator) DO NOTHING;

CREATE OR REPLACE FUNCTION touch_knowledge_graph_entity_revision() RETURNS trigger AS $$
DECLARE
  row_id integer;
  entity_kind text := TG_ARGV[0];
  location_kind text := NULLIF(TG_ARGV[1], '');
  semantic_columns text[] := TG_ARGV[2:TG_NARGS - 1];
  old_semantic jsonb;
  new_semantic jsonb;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    SELECT COALESCE(jsonb_object_agg(key, value), '{}'::jsonb) INTO old_semantic
      FROM jsonb_each(to_jsonb(OLD)) WHERE key = ANY(semantic_columns);
    SELECT COALESCE(jsonb_object_agg(key, value), '{}'::jsonb) INTO new_semantic
      FROM jsonb_each(to_jsonb(NEW)) WHERE key = ANY(semantic_columns);
    IF new_semantic IS NOT DISTINCT FROM old_semantic THEN RETURN NEW; END IF;
  END IF;
  row_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END;
  INSERT INTO knowledge_graph_entity_revisions (entity_type, entity_id, discriminator, updated_at)
    VALUES (entity_kind, row_id, COALESCE(location_kind, ''), now())
  ON CONFLICT (entity_type, entity_id, discriminator) DO UPDATE SET updated_at = EXCLUDED.updated_at;
  -- A state participates in every city's public eligibility and display name.
  IF entity_kind = 'LOCATION' AND location_kind = 'STATE' THEN
    INSERT INTO knowledge_graph_entity_revisions (entity_type, entity_id, discriminator, updated_at)
      SELECT 'LOCATION', id, 'CITY', now() FROM indian_cities WHERE state_id = row_id
    ON CONFLICT (entity_type, entity_id, discriminator) DO UPDATE SET updated_at = EXCLUDED.updated_at;
  END IF;
  UPDATE knowledge_graph_public_state SET generation = generation + 1, updated_at = now() WHERE id = 1;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'knowledge_graph_public_state singleton is missing';
  END IF;
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql;

-- All names below are the physical pgTable names in shared/schema.ts.
DROP TRIGGER IF EXISTS kg_revision_puja_types ON puja_types;
CREATE TRIGGER kg_revision_puja_types AFTER INSERT OR UPDATE OR DELETE ON puja_types FOR EACH ROW EXECUTE FUNCTION touch_knowledge_graph_entity_revision('PUJA','','name','slug','category','is_published');
DROP TRIGGER IF EXISTS kg_revision_pandits ON pandits;
CREATE TRIGGER kg_revision_pandits AFTER INSERT OR UPDATE OR DELETE ON pandits FOR EACH ROW EXECUTE FUNCTION touch_knowledge_graph_entity_revision('PANDIT','','name','slug','city','specialization','verified','availability','on_leave','location_review_status','city_id','state_id');
DROP TRIGGER IF EXISTS kg_revision_indian_states ON indian_states;
CREATE TRIGGER kg_revision_indian_states AFTER INSERT OR UPDATE OR DELETE ON indian_states FOR EACH ROW EXECUTE FUNCTION touch_knowledge_graph_entity_revision('LOCATION','STATE','name','code','is_union_territory','is_active');
DROP TRIGGER IF EXISTS kg_revision_indian_cities ON indian_cities;
CREATE TRIGGER kg_revision_indian_cities AFTER INSERT OR UPDATE OR DELETE ON indian_cities FOR EACH ROW EXECUTE FUNCTION touch_knowledge_graph_entity_revision('LOCATION','CITY','name','slug','is_active','state_id');
DROP TRIGGER IF EXISTS kg_revision_tirths ON tirths;
CREATE TRIGGER kg_revision_tirths AFTER INSERT OR UPDATE OR DELETE ON tirths FOR EACH ROW EXECUTE FUNCTION touch_knowledge_graph_entity_revision('TIRTH','','name','slug','status','state');
DROP TRIGGER IF EXISTS kg_revision_temples ON temples;
CREATE TRIGGER kg_revision_temples AFTER INSERT OR UPDATE OR DELETE ON temples FOR EACH ROW EXECUTE FUNCTION touch_knowledge_graph_entity_revision('TEMPLE','','name','slug','status','state');
DROP TRIGGER IF EXISTS kg_revision_products ON products;
CREATE TRIGGER kg_revision_products AFTER INSERT OR UPDATE OR DELETE ON products FOR EACH ROW EXECUTE FUNCTION touch_knowledge_graph_entity_revision('PRODUCT','','name','slug','category','product_type','stock');
DROP TRIGGER IF EXISTS kg_revision_blog_posts ON blog_posts;
CREATE TRIGGER kg_revision_blog_posts AFTER INSERT OR UPDATE OR DELETE ON blog_posts FOR EACH ROW EXECUTE FUNCTION touch_knowledge_graph_entity_revision('ARTICLE','','title','slug','category','status','is_published');
DROP TRIGGER IF EXISTS kg_revision_master_services ON master_services;
CREATE TRIGGER kg_revision_master_services AFTER INSERT OR UPDATE OR DELETE ON master_services FOR EACH ROW EXECUTE FUNCTION touch_knowledge_graph_entity_revision('SERVICE','','name','slug','category','service_type','is_active');
DROP TRIGGER IF EXISTS kg_revision_product_reviews ON product_reviews;
CREATE TRIGGER kg_revision_product_reviews AFTER INSERT OR UPDATE OR DELETE ON product_reviews FOR EACH ROW EXECUTE FUNCTION touch_knowledge_graph_entity_revision('REVIEW','','title','rating','status');
DROP TRIGGER IF EXISTS kg_revision_tirth_yatra_tours ON tirth_yatra_tours;
CREATE TRIGGER kg_revision_tirth_yatra_tours AFTER INSERT OR UPDATE OR DELETE ON tirth_yatra_tours FOR EACH ROW EXECUTE FUNCTION touch_knowledge_graph_entity_revision('YATRA','','name','slug','route','duration_days','is_active');
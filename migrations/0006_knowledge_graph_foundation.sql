CREATE TABLE IF NOT EXISTS knowledge_graph_relationships (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  source_entity_type text NOT NULL,
  source_entity_id integer NOT NULL,
  source_discriminator text,
  relationship_type text NOT NULL,
  target_entity_type text NOT NULL,
  target_entity_id integer NOT NULL,
  target_discriminator text,
  status text NOT NULL DEFAULT 'ACTIVE',
  display_order integer NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by_admin_id integer NOT NULL REFERENCES users(id),
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT knowledge_graph_relationships_source_type_check CHECK (source_entity_type IN ('PUJA','PANDIT','LOCATION','TIRTH','TEMPLE','PRODUCT','ARTICLE','SERVICE','REVIEW','YATRA')),
  CONSTRAINT knowledge_graph_relationships_target_type_check CHECK (target_entity_type IN ('PUJA','PANDIT','LOCATION','TIRTH','TEMPLE','PRODUCT','ARTICLE','SERVICE','REVIEW','YATRA')),
  CONSTRAINT knowledge_graph_relationships_relationship_type_check CHECK (relationship_type IN ('performed_by','specializes_in','available_in','located_in','offers','related_to','related_article','related_product','associated_with','contains','available_puja','related_service','related_tirth','related_temple','related_yatra','discusses')),
  CONSTRAINT knowledge_graph_relationships_status_check CHECK (status IN ('ACTIVE','DRAFT')),
  CONSTRAINT knowledge_graph_relationships_source_id_check CHECK (source_entity_id > 0),
  CONSTRAINT knowledge_graph_relationships_target_id_check CHECK (target_entity_id > 0),
  CONSTRAINT knowledge_graph_relationships_display_order_check CHECK (display_order BETWEEN 0 AND 10000),
  CONSTRAINT knowledge_graph_relationships_metadata_check CHECK (jsonb_typeof(metadata) = 'object'),
  CONSTRAINT knowledge_graph_relationships_source_location_check CHECK (
    (source_entity_type = 'LOCATION' AND source_discriminator IS NOT NULL AND source_discriminator IN ('STATE','CITY'))
    OR (source_entity_type <> 'LOCATION' AND source_discriminator IS NULL)
  ),
  CONSTRAINT knowledge_graph_relationships_target_location_check CHECK (
    (target_entity_type = 'LOCATION' AND target_discriminator IS NOT NULL AND target_discriminator IN ('STATE','CITY'))
    OR (target_entity_type <> 'LOCATION' AND target_discriminator IS NULL)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS knowledge_graph_relationships_exact_edge_unique
  ON knowledge_graph_relationships (
    source_entity_type, source_entity_id, COALESCE(source_discriminator, ''),
    relationship_type,
    target_entity_type, target_entity_id, COALESCE(target_discriminator, '')
  );
CREATE INDEX IF NOT EXISTS knowledge_graph_relationships_source_idx ON knowledge_graph_relationships(source_entity_type, source_entity_id);
CREATE INDEX IF NOT EXISTS knowledge_graph_relationships_target_idx ON knowledge_graph_relationships(target_entity_type, target_entity_id);
CREATE INDEX IF NOT EXISTS knowledge_graph_relationships_relationship_type_idx ON knowledge_graph_relationships(relationship_type);
CREATE INDEX IF NOT EXISTS knowledge_graph_relationships_source_relationship_idx ON knowledge_graph_relationships(source_entity_type, source_entity_id, relationship_type);
CREATE INDEX IF NOT EXISTS knowledge_graph_relationships_target_relationship_idx ON knowledge_graph_relationships(target_entity_type, target_entity_id, relationship_type);
CREATE INDEX IF NOT EXISTS knowledge_graph_relationships_status_idx ON knowledge_graph_relationships(status);

CREATE TABLE IF NOT EXISTS knowledge_graph_quality_rules (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  source_entity_type text NOT NULL,
  relationship_type text NOT NULL,
  allowed_target_entity_types text[] NOT NULL,
  minimum_required_count integer NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,
  created_by_admin_id integer NOT NULL REFERENCES users(id),
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT knowledge_graph_quality_rules_source_type_check CHECK (source_entity_type IN ('PUJA','PANDIT','LOCATION','TIRTH','TEMPLE','PRODUCT','ARTICLE','SERVICE','REVIEW','YATRA')),
  CONSTRAINT knowledge_graph_quality_rules_relationship_type_check CHECK (relationship_type IN ('performed_by','specializes_in','available_in','located_in','offers','related_to','related_article','related_product','associated_with','contains','available_puja','related_service','related_tirth','related_temple','related_yatra','discusses')),
  CONSTRAINT knowledge_graph_quality_rules_targets_check CHECK (
    cardinality(allowed_target_entity_types) BETWEEN 1 AND 10
    AND allowed_target_entity_types <@ ARRAY['PUJA','PANDIT','LOCATION','TIRTH','TEMPLE','PRODUCT','ARTICLE','SERVICE','REVIEW','YATRA']::text[]
  ),
  CONSTRAINT knowledge_graph_quality_rules_minimum_count_check CHECK (minimum_required_count BETWEEN 1 AND 100)
);
CREATE UNIQUE INDEX IF NOT EXISTS knowledge_graph_quality_rules_source_relationship_unique
  ON knowledge_graph_quality_rules(source_entity_type, relationship_type);
CREATE INDEX IF NOT EXISTS knowledge_graph_quality_rules_active_idx ON knowledge_graph_quality_rules(is_active);
CREATE INDEX IF NOT EXISTS knowledge_graph_quality_rules_source_idx ON knowledge_graph_quality_rules(source_entity_type);
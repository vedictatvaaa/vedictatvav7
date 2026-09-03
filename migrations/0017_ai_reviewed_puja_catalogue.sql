BEGIN;

ALTER TABLE puja_types
  ADD COLUMN IF NOT EXISTS review_method text NOT NULL DEFAULT 'ai';

-- Rows that already identify a pandit reviewer are historical pandit reviews;
-- retain that attribution before making the reviewer/method relationship strict.
UPDATE puja_types
SET review_method = CASE
  WHEN reviewed_by_pandit_id IS NOT NULL THEN 'pandit'
  ELSE COALESCE(NULLIF(review_method, ''), 'ai')
END
WHERE review_method IS NULL OR review_method = '' OR reviewed_by_pandit_id IS NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'puja_types_review_method_valid'
  ) THEN
    ALTER TABLE puja_types ADD CONSTRAINT puja_types_review_method_valid
      CHECK (review_method IN ('ai', 'admin', 'pandit'));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'puja_types_review_method_reviewer'
  ) THEN
    ALTER TABLE puja_types ADD CONSTRAINT puja_types_review_method_reviewer
      CHECK (
        (review_method = 'pandit' AND reviewed_by_pandit_id IS NOT NULL)
        OR
        (review_method IN ('ai', 'admin') AND reviewed_by_pandit_id IS NULL)
      );
  END IF;
END $$;

CREATE TEMP TABLE _ai_puja_catalogue (
  slug text PRIMARY KEY,
  name text NOT NULL,
  deity text NOT NULL,
  category text NOT NULL,
  intent text NOT NULL,
  ceremony text,
  festival text,
  aliases text[] NOT NULL DEFAULT ARRAY[]::text[],
  regional_variations jsonb NOT NULL DEFAULT '[]'::jsonb,
  online_eligible boolean NOT NULL DEFAULT true,
  source_label text NOT NULL DEFAULT 'Regional Hindu paddhati tradition',
  source_type text NOT NULL DEFAULT 'tradition',
  display_order integer NOT NULL
) ON COMMIT DROP;

INSERT INTO _ai_puja_catalogue
  (slug, name, deity, category, intent, ceremony, festival, display_order)
VALUES
  ('griha-pravesh-puja', 'Griha Pravesh Puja', 'Vastu Purusha and Ganesha', 'occasion', 'new home blessing', 'housewarming', NULL, 1),
  ('satyanarayan-puja', 'Satyanarayan Puja', 'Vishnu', 'deity', 'thanksgiving and household well-being', NULL, 'purnima', 2),
  ('rudrabhishek-puja', 'Rudrabhishek Puja', 'Shiva', 'deity', 'Shiva devotion', 'abhishek', 'maha-shivratri', 3),
  ('ganesh-puja', 'Ganesh Puja', 'Ganesha', 'deity', 'new beginnings', NULL, 'ganesh-chaturthi', 4),
  ('lakshmi-puja', 'Lakshmi Puja', 'Lakshmi', 'deity', 'prosperity devotion', NULL, 'diwali', 5),
  ('ganesh-lakshmi-puja', 'Ganesh-Lakshmi Puja', 'Ganesha and Lakshmi', 'deity', 'business and household devotion', NULL, 'diwali', 6),
  ('vastu-shanti-puja', 'Vastu Shanti Puja', 'Vastu Purusha', 'occasion', 'space blessing', 'vastu shanti', NULL, 7),
  ('navagraha-shanti-puja', 'Navgraha Shanti Puja', 'Nine Grahas', 'remedial', 'traditional astrological support', 'graha shanti', NULL, 8),
  ('kaal-sarp-dosh-puja', 'Kaal Sarp Dosh Puja', 'Rahu, Ketu and Naga deities', 'remedial', 'traditional astrological support', 'graha shanti', NULL, 10),
  ('shani-shanti-puja', 'Shani Shanti Puja', 'Shani', 'remedial', 'traditional astrological support', 'graha shanti', NULL, 11),
  ('mangal-dosha-puja', 'Mangal Dosha Puja', 'Mangal', 'remedial', 'traditional astrological support', 'graha shanti', NULL, 12),
  ('pitra-dosha-puja', 'Pitra Dosha Puja', 'Pitrs', 'remedial', 'ancestor remembrance', 'ancestral rite', NULL, 13),
  ('pind-daan', 'Pind Daan', 'Pitrs', 'samskara', 'ancestor remembrance', 'ancestral rite', NULL, 14),
  ('tarpan', 'Tarpan', 'Pitrs', 'samskara', 'ancestor remembrance', 'water offering', NULL, 15),
  ('shradh', 'Shradh', 'Pitrs', 'samskara', 'ancestor remembrance', 'ancestral rite', 'pitra paksha', 16),
  ('narayan-bali', 'Narayan Bali', 'Vishnu and Pitrs', 'samskara', 'ancestor remembrance', 'ancestral rite', NULL, 17),
  ('asthi-visarjan', 'Asthi Visarjan', 'Pitrs', 'samskara', 'final rites', 'funeral rite', NULL, 18),
  ('gaya-pind-daan', 'Gaya Pind Daan', 'Pitrs', 'samskara', 'ancestor remembrance', 'pilgrimage rite', NULL, 19),
  ('sundarkand-path', 'Sundarkand', 'Hanuman and Rama', 'deity', 'devotional recitation', 'scripture recitation', NULL, 20),
  ('hanuman-puja', 'Hanuman Puja', 'Hanuman', 'deity', 'courage and devotion', NULL, 'hanuman-jayanti', 21),
  ('durga-puja', 'Durga Puja', 'Durga', 'deity', 'Devi devotion', NULL, 'durga-puja', 22),
  ('navratri-puja', 'Navratri Puja', 'Durga', 'occasion', 'Devi devotion', 'nine-night observance', 'navratri', 23),
  ('diwali-lakshmi-puja', 'Diwali Lakshmi Puja', 'Lakshmi', 'occasion', 'prosperity devotion', NULL, 'diwali', 24),
  ('ganesh-chaturthi-puja', 'Ganesh Chaturthi Puja', 'Ganesha', 'occasion', 'festival devotion', 'festival observance', 'ganesh-chaturthi', 25),
  ('mahashivratri-puja', 'Mahashivratri Puja', 'Shiva', 'occasion', 'Shiva devotion', 'night vigil', 'maha-shivratri', 26),
  ('janmashtami-puja', 'Janmashtami Puja', 'Krishna', 'occasion', 'Krishna devotion', 'festival observance', 'janmashtami', 27),
  ('ram-navami-puja', 'Ram Navami Puja', 'Rama', 'occasion', 'Rama devotion', 'festival observance', 'ram-navami', 28),
  ('saraswati-puja', 'Saraswati Puja', 'Saraswati', 'deity', 'learning and arts devotion', NULL, 'vasant-panchami', 29),
  ('marriage-puja', 'Marriage Puja', 'Ganesha and family deities', 'samskara', 'marriage ceremony', 'wedding', NULL, 30),
  ('gauri-shankar-puja', 'Gauri Shankar Puja', 'Gauri and Shankar', 'deity', 'marital harmony devotion', NULL, NULL, 31),
  ('katyayani-puja', 'Katyayani Puja', 'Katyayani', 'deity', 'Devi devotion', NULL, NULL, 32),
  ('vivah-sanskar', 'Vivah Sanskar', 'Ganesha and family deities', 'samskara', 'marriage ceremony', 'wedding', NULL, 33),
  ('bhoomi-pujan', 'Bhoomi Pujan', 'Bhumi Devi and Vastu Purusha', 'occasion', 'land blessing', 'groundbreaking', NULL, 34),
  ('office-opening-puja', 'Office Opening Puja', 'Ganesha and Lakshmi', 'occasion', 'workplace blessing', 'opening ceremony', NULL, 35),
  ('business-puja', 'Business Puja', 'Ganesha and Lakshmi', 'occasion', 'business devotion', 'business blessing', NULL, 36),
  ('vehicle-puja', 'Vehicle Puja', 'Ganesha', 'occasion', 'vehicle blessing', 'vehicle ceremony', NULL, 37),
  ('namkaran', 'Namkaran', 'Ganesha and family deities', 'samskara', 'child naming', 'naming ceremony', NULL, 38),
  ('mundan', 'Mundan', 'Ganesha and family deities', 'samskara', 'child ceremony', 'first haircut', NULL, 39),
  ('annaprashan', 'Annaprashan', 'Annapurna and family deities', 'samskara', 'child ceremony', 'first feeding', NULL, 40),
  ('ayush-havan', 'Ayush Havan', 'Ayushya Devata', 'samskara', 'prayer for well-being', 'havan', NULL, 41),
  ('upanayan', 'Upanayan', 'Gayatri and family deities', 'samskara', 'initiation ceremony', 'sacred thread ceremony', NULL, 42),
  ('birthday-puja', 'Birthday Puja', 'Ganesha and family deities', 'occasion', 'birthday thanksgiving', 'birthday observance', NULL, 43),
  ('akhand-ramayan', 'Akhand Ramayan', 'Rama', 'deity', 'devotional recitation', 'scripture recitation', NULL, 44),
  ('chandi-path', 'Chandi Path', 'Chandi', 'deity', 'Devi devotion', 'scripture recitation', NULL, 45),
  ('durga-saptashati', 'Durga Saptashati', 'Durga', 'deity', 'Devi devotion', 'scripture recitation', NULL, 46),
  ('lakshmi-narayan-puja', 'Lakshmi Narayan Puja', 'Lakshmi and Narayan', 'deity', 'household devotion', NULL, NULL, 47),
  ('vishnu-sahasranama', 'Vishnu Sahasranama', 'Vishnu', 'deity', 'devotional recitation', 'scripture recitation', NULL, 48),
  ('ganapati-homam', 'Ganapati Homam', 'Ganesha', 'deity', 'new beginnings', 'havan', NULL, 49),
  ('ayush-homam', 'Ayush Homam', 'Ayushya Devata', 'samskara', 'prayer for well-being', 'havan', NULL, 50),
  ('navgraha-homam', 'Navgraha Homam', 'Nine Grahas', 'remedial', 'traditional astrological support', 'havan', NULL, 51),
  -- The established rich guide remains a separate, governed record.
  ('pitra-paksha-shradh', 'Pitra Paksha Shradh', 'Pitrs', 'samskara', 'ancestor remembrance', 'ancestral rite', 'pitra paksha', 52),
  ('maha-mrityunjaya-jaap', 'Maha Mrityunjaya Jaap', 'Shiva', 'deity', 'prayer for resilience', 'japa', NULL, 9);

-- Curated governed metadata.  Aliases are spelling/search aids only, never
-- another record's canonical name; variations document rather than flatten
-- regional practice.
UPDATE _ai_puja_catalogue
SET online_eligible = slug NOT IN (
  'griha-pravesh-puja', 'vastu-shanti-puja', 'navagraha-shanti-puja',
  'kaal-sarp-dosh-puja', 'shani-shanti-puja', 'mangal-dosha-puja',
  'pitra-dosha-puja', 'pind-daan', 'tarpan', 'shradh', 'narayan-bali',
  'asthi-visarjan', 'gaya-pind-daan', 'pitra-paksha-shradh', 'bhoomi-pujan',
  'vehicle-puja', 'marriage-puja', 'vivah-sanskar', 'namkaran', 'mundan',
  'annaprashan', 'ayush-havan', 'upanayan', 'ganapati-homam', 'ayush-homam',
  'navgraha-homam'
),
aliases = CASE slug
  WHEN 'griha-pravesh-puja' THEN ARRAY['griha pravesh']
  WHEN 'rudrabhishek-puja' THEN ARRAY['rudra abhishek']
  WHEN 'satyanarayan-puja' THEN ARRAY['satya narayan puja']
  WHEN 'maha-mrityunjaya-jaap' THEN ARRAY['maha mrityunjaya japa']
  WHEN 'kaal-sarp-dosh-puja' THEN ARRAY['kaal sarp dosh ritual']
  WHEN 'pind-daan' THEN ARRAY['pinda dana']
  WHEN 'vishnu-sahasranama' THEN ARRAY['vishnu sahasranamam']
  ELSE ARRAY[]::text[] END,
regional_variations = CASE
  WHEN slug IN ('pind-daan', 'tarpan', 'shradh', 'pitra-paksha-shradh', 'narayan-bali', 'gaya-pind-daan', 'asthi-visarjan')
    THEN '[{"name":"Tirtha and family practice","regionOrTradition":"Pitru and pilgrimage traditions","note":"Pitru rites vary by family lineage, tirtha and regional paddhati; confirm the sequence and eligibility with the officiant."}]'::jsonb
  WHEN slug IN ('navratri-puja', 'durga-puja', 'diwali-lakshmi-puja', 'ganesh-chaturthi-puja', 'mahashivratri-puja')
    THEN '[{"name":"Regional festival observance","regionOrTradition":"Regional and community traditions","note":"Festival calendars, offerings and public observance vary by region and community."}]'::jsonb
  WHEN slug IN ('griha-pravesh-puja', 'satyanarayan-puja', 'rudrabhishek-puja', 'ganesh-puja', 'lakshmi-puja', 'navagraha-shanti-puja', 'kaal-sarp-dosh-puja', 'hanuman-puja', 'saraswati-puja', 'maha-mrityunjaya-jaap')
    THEN '[{"name":"Sampradaya-specific procedure","regionOrTradition":"Regional Hindu paddhati traditions","note":"Procedure, language and offerings vary by sampradaya and regional paddhati."}]'::jsonb
  ELSE '[{"name":"Family and regional practice","regionOrTradition":"Regional Hindu traditions","note":"Regional and family traditions may differ; confirm the procedure locally."}]'::jsonb END,
source_label = CASE
  WHEN slug = 'maha-mrityunjaya-jaap' THEN 'Rig Veda 7.59.12'
  WHEN slug = 'rudrabhishek-puja' THEN 'Taittiriya Samhita, Sri Rudram'
  WHEN slug = 'satyanarayan-puja' THEN 'Skanda Purana, Satyanarayana Vrata Katha'
  WHEN slug IN ('ganesh-puja', 'ganesh-chaturthi-puja', 'ganapati-homam') THEN 'Ganapati Atharvashirsha'
  WHEN slug IN ('lakshmi-puja', 'ganesh-lakshmi-puja', 'diwali-lakshmi-puja') THEN 'Sri Sukta'
  WHEN slug = 'saraswati-puja' THEN 'Rig Veda 6.61, Sarasvati hymn'
  WHEN slug = 'hanuman-puja' THEN 'Valmiki Ramayana, Sundara Kanda'
  WHEN slug = 'janmashtami-puja' THEN 'Bhagavata Purana, Krishna Janma narrative'
  WHEN slug IN ('durga-puja', 'navratri-puja', 'chandi-path', 'durga-saptashati') THEN 'Devi Mahatmya'
  WHEN slug IN ('sundarkand-path', 'akhand-ramayan', 'ram-navami-puja') THEN 'Valmiki Ramayana'
  WHEN slug = 'vishnu-sahasranama' THEN 'Mahabharata, Anushasana Parva'
  WHEN slug IN ('navagraha-shanti-puja', 'shani-shanti-puja', 'mangal-dosha-puja', 'navgraha-homam') THEN 'Jyotisha and Navagraha paddhati traditions'
  WHEN slug IN ('griha-pravesh-puja', 'vastu-shanti-puja', 'bhoomi-pujan') THEN 'Grihya-sutra and Vastu paddhati traditions'
  WHEN category = 'samskara' THEN 'Grihya-sutra traditions'
  ELSE 'Regional Hindu paddhati tradition' END,
source_type = CASE
  WHEN slug IN ('maha-mrityunjaya-jaap', 'rudrabhishek-puja', 'satyanarayan-puja', 'ganesh-puja', 'ganesh-chaturthi-puja', 'ganapati-homam', 'lakshmi-puja', 'ganesh-lakshmi-puja', 'diwali-lakshmi-puja', 'saraswati-puja', 'hanuman-puja', 'janmashtami-puja', 'durga-puja', 'navratri-puja', 'chandi-path', 'durga-saptashati', 'sundarkand-path', 'akhand-ramayan', 'ram-navami-puja', 'vishnu-sahasranama') THEN 'scripture'
  WHEN category = 'samskara' THEN 'commentary'
  ELSE 'tradition' END;

-- Preflight: catalogue definitions must be complete and aliases cannot collide
-- with any controlled or pre-existing canonical record.
DO $$
BEGIN
  IF (SELECT count(*) FROM _ai_puja_catalogue) <> 52
     OR EXISTS (SELECT 1 FROM _ai_puja_catalogue WHERE btrim(slug) = '' OR btrim(name) = '')
     OR EXISTS (SELECT 1 FROM _ai_puja_catalogue WHERE btrim(source_label) = '' OR btrim(source_type) = '')
     OR EXISTS (
       SELECT 1 FROM _ai_puja_catalogue a JOIN _ai_puja_catalogue b
         ON a.name = b.name AND a.slug <> b.slug
     ) THEN
    RAISE EXCEPTION 'AI puja catalogue preflight failed: incomplete or duplicate definitions';
  END IF;
  IF EXISTS (
    SELECT 1
    FROM puja_types p
    JOIN _ai_puja_catalogue c ON p.slug <> c.slug
    WHERE lower(regexp_replace(btrim(p.name), '\s+', ' ', 'g')) =
          lower(regexp_replace(btrim(c.name), '\s+', ' ', 'g'))
       OR EXISTS (
         SELECT 1
         FROM unnest(COALESCE(p.aliases, ARRAY[]::text[])) existing_alias
         WHERE lower(regexp_replace(btrim(existing_alias), '\s+', ' ', 'g')) =
               lower(regexp_replace(btrim(c.name), '\s+', ' ', 'g'))
       )
       OR EXISTS (
         SELECT 1
         FROM unnest(c.aliases) controlled_alias
         WHERE lower(regexp_replace(btrim(controlled_alias), '\s+', ' ', 'g')) =
               lower(regexp_replace(btrim(p.name), '\s+', ' ', 'g'))
       )
       OR EXISTS (
         SELECT 1
         FROM unnest(COALESCE(p.aliases, ARRAY[]::text[])) existing_alias
         JOIN unnest(c.aliases) controlled_alias
           ON lower(regexp_replace(btrim(existing_alias), '\s+', ' ', 'g')) =
              lower(regexp_replace(btrim(controlled_alias), '\s+', ' ', 'g'))
       )
  ) THEN
    RAISE EXCEPTION 'AI puja catalogue preflight failed: name or alias conflicts with an existing record';
  END IF;
  IF EXISTS (
    SELECT 1 FROM _ai_puja_catalogue a
    JOIN _ai_puja_catalogue b ON a.slug <> b.slug
    WHERE lower(btrim(b.name)) = ANY (ARRAY(SELECT lower(btrim(x)) FROM unnest(a.aliases) x))
       OR EXISTS (SELECT 1 FROM unnest(a.aliases) x JOIN unnest(b.aliases) y ON lower(btrim(x)) = lower(btrim(y)))
  ) THEN
    RAISE EXCEPTION 'AI puja catalogue preflight failed: controlled name or alias conflict';
  END IF;
  IF EXISTS (
    SELECT 1
    FROM puja_types p
    JOIN _ai_puja_catalogue c USING (slug)
    WHERE p.review_method = 'ai'
      AND COALESCE(p.review_notes, '') <> 'AI-reviewed catalogue baseline; requires human review for any later substantive change.'
      AND NOT (
        p.review_status = 'in_review'
        AND NOT p.is_published
        AND p.approved_at IS NULL
        AND p.reviewed_by_pandit_id IS NULL
        AND btrim(COALESCE(p.review_notes, '')) = ''
        AND btrim(COALESCE(p.source_notes, '')) = ''
        AND COALESCE(p.citations, '[]'::jsonb) = '[]'::jsonb
      )
  ) THEN
    RAISE EXCEPTION 'AI puja catalogue preflight failed: an existing AI record has editorial content that cannot be overwritten';
  END IF;
END $$;

INSERT INTO puja_types (
  slug, name, deity, short_description, why_performed, story_myth, how_celebrated,
  ethics, benefits, requirements, faq, category, intents, deities, ceremonies,
  festivals, aliases, regional_variations, online_eligible, in_person_eligible,
  review_status, review_method, reviewed_by_pandit_id, review_notes, source_notes,
  citations, approved_at, meta_title, meta_description, is_published, display_order
)
SELECT
  slug, name, deity,
  'A guided ' || lower(name) || ' observance with transparent preparation and booking information.',
  'This observance is offered as devotional and traditional support for ' || intent || '. It is not a guarantee of an outcome and is never a substitute for medical, legal, financial, or mental-health care.',
  'Its meaning is approached through living Hindu traditions and the cited scripture or commentary; families may follow their own sampradaya and local custom.',
  'Begin with a sankalpa, prepare a clean altar and materials, offer prayers with a qualified practitioner where desired, and conclude with gratitude and prasad. The exact sequence should be adapted respectfully to the family tradition.',
  'Participation is voluntary and should be respectful, accessible, and environmentally considerate. Do not make promises of cures or certainty; regional rites and eligibility practices are not universal.',
  'Devotees may find a structured opportunity for prayer, remembrance, reflection, and community support. Traditional remedies are devotional support, not guaranteed outcomes or medical substitutes.',
  jsonb_build_array(jsonb_build_object('item', 'Clean altar, diya, water and flowers', 'qty', 'as appropriate', 'note', 'Confirm regional samagri with the officiant')),
  jsonb_build_array(
    jsonb_build_object(
      'q', 'Can this be performed online or in person?',
      'a', CASE WHEN online_eligible
        THEN 'Online and in-person options are available where the family and officiant agree; local custom may still require an in-person observance.'
        ELSE 'This rite is offered in person because it depends on a physical place, offering, samskara, homa, or pilgrimage practice.'
      END
    ),
    jsonb_build_object('q', 'Does this guarantee a result?', 'a', 'No. It is a devotional and traditional practice, not a guaranteed remedy or substitute for professional care.')
  ),
  category, ARRAY[intent], ARRAY[deity],
  CASE WHEN ceremony IS NULL THEN ARRAY[]::text[] ELSE ARRAY[ceremony] END,
  CASE WHEN festival IS NULL THEN ARRAY[]::text[] ELSE ARRAY[festival] END,
  aliases, regional_variations, online_eligible, true, 'approved', 'ai', NULL,
  'AI-reviewed catalogue baseline; requires human review for any later substantive change.',
  'Catalogue baseline draws on the cited tradition; remedies are devotional/traditional support, never guaranteed outcomes or medical substitutes. Regional procedure, language, materials, and rites are not universal and must be confirmed with the family and officiant.',
  jsonb_build_array(jsonb_build_object('label', source_label, 'sourceType', source_type)),
  CURRENT_TIMESTAMP,
  name || ' — Vidhi, Preparation and Booking',
  'Learn the purpose, respectful preparation, requirements, common questions, and online or in-person options for ' || name || '.',
  true, display_order
FROM _ai_puja_catalogue
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  deity = COALESCE(NULLIF(puja_types.deity, ''), EXCLUDED.deity),
  short_description = COALESCE(NULLIF(puja_types.short_description, ''), EXCLUDED.short_description),
  why_performed = COALESCE(NULLIF(puja_types.why_performed, ''), EXCLUDED.why_performed),
  story_myth = COALESCE(NULLIF(puja_types.story_myth, ''), EXCLUDED.story_myth),
  how_celebrated = COALESCE(NULLIF(puja_types.how_celebrated, ''), EXCLUDED.how_celebrated),
  ethics = COALESCE(NULLIF(puja_types.ethics, ''), EXCLUDED.ethics),
  benefits = COALESCE(NULLIF(puja_types.benefits, ''), EXCLUDED.benefits),
  requirements = CASE WHEN puja_types.requirements IS NULL OR puja_types.requirements = '[]'::jsonb THEN EXCLUDED.requirements ELSE puja_types.requirements END,
  faq = CASE WHEN puja_types.faq IS NULL OR puja_types.faq = '[]'::jsonb THEN EXCLUDED.faq ELSE puja_types.faq END,
  category = COALESCE(NULLIF(puja_types.category, ''), EXCLUDED.category),
  intents = EXCLUDED.intents,
  deities = EXCLUDED.deities,
  ceremonies = EXCLUDED.ceremonies,
  festivals = EXCLUDED.festivals,
  aliases = EXCLUDED.aliases,
  regional_variations = EXCLUDED.regional_variations,
  online_eligible = EXCLUDED.online_eligible,
  in_person_eligible = EXCLUDED.in_person_eligible,
  review_status = 'approved', approved_at = COALESCE(puja_types.approved_at, EXCLUDED.approved_at),
  review_notes = COALESCE(NULLIF(puja_types.review_notes, ''), EXCLUDED.review_notes),
  source_notes = COALESCE(NULLIF(puja_types.source_notes, ''), EXCLUDED.source_notes),
  citations = EXCLUDED.citations,
  meta_title = COALESCE(NULLIF(puja_types.meta_title, ''), EXCLUDED.meta_title),
  meta_description = COALESCE(NULLIF(puja_types.meta_description, ''), EXCLUDED.meta_description),
  is_published = true, display_order = EXCLUDED.display_order
WHERE puja_types.review_method = 'ai'
  AND puja_types.review_status = 'in_review'
  AND NOT puja_types.is_published
  AND puja_types.approved_at IS NULL
  AND puja_types.reviewed_by_pandit_id IS NULL
  AND btrim(COALESCE(puja_types.review_notes, '')) = ''
  AND btrim(COALESCE(puja_types.source_notes, '')) = ''
  AND COALESCE(puja_types.citations, '[]'::jsonb) = '[]'::jsonb;

DO $$
BEGIN
  IF (SELECT count(*) FROM puja_types p JOIN _ai_puja_catalogue c USING (slug)) <> 52 THEN
    RAISE EXCEPTION 'AI puja catalogue postflight failed: controlled coverage is incomplete';
  END IF;
  IF EXISTS (
    SELECT 1 FROM puja_types p JOIN _ai_puja_catalogue c USING (slug)
    WHERE p.review_method = 'ai'
      AND p.approved_at IS NOT NULL
      AND (
        p.review_status <> 'approved'
        OR NOT p.is_published
        OR p.reviewed_by_pandit_id IS NOT NULL
        OR NOT (p.online_eligible OR p.in_person_eligible)
        OR cardinality(p.intents) = 0
        OR cardinality(p.deities) = 0
        OR btrim(COALESCE(p.source_notes, '')) = ''
        OR jsonb_array_length(COALESCE(p.citations, '[]'::jsonb)) = 0
        OR EXISTS (
          SELECT 1 FROM jsonb_array_elements(p.citations) citation
          WHERE jsonb_typeof(citation) <> 'object'
             OR btrim(COALESCE(citation->>'label', '')) = ''
             OR btrim(COALESCE(citation->>'sourceType', '')) = ''
             OR (citation ? 'url' AND COALESCE(citation->>'url', '') !~ '^https://')
        )
      )
  ) THEN
    RAISE EXCEPTION 'AI puja catalogue postflight failed: approved published coverage is incomplete';
  END IF;
END $$;

COMMIT;
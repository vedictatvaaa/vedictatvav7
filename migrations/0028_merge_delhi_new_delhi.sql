-- Canonicalize Delhi/New Delhi without breaking legacy discovery terms.
DO $$
DECLARE
  canonical_id integer;
  duplicate_id integer;
BEGIN
  SELECT id INTO canonical_id
  FROM indian_cities
  WHERE lower(name) = 'new delhi'
  ORDER BY is_active DESC, id
  LIMIT 1;

  SELECT id INTO duplicate_id
  FROM indian_cities
  WHERE lower(name) = 'delhi'
    AND id IS DISTINCT FROM canonical_id
  ORDER BY is_active DESC, id
  LIMIT 1;

  IF canonical_id IS NULL AND duplicate_id IS NOT NULL THEN
    canonical_id := duplicate_id;
    UPDATE indian_cities
    SET name = 'New Delhi',
        aliases = ARRAY(SELECT DISTINCT unnest(aliases || ARRAY['Delhi']::text[])),
        updated_at = now()
    WHERE id = canonical_id;
    duplicate_id := NULL;
  END IF;

  IF canonical_id IS NOT NULL THEN
    UPDATE indian_cities
    SET aliases = ARRAY(SELECT DISTINCT unnest(aliases || ARRAY['Delhi', 'New Delhi']::text[])),
        updated_at = now()
    WHERE id = canonical_id;

    IF duplicate_id IS NOT NULL THEN
      UPDATE pandits SET city_id = canonical_id, city = 'New Delhi' WHERE city_id = duplicate_id;
      UPDATE pandit_applications SET city_id = canonical_id, city = 'New Delhi' WHERE city_id = duplicate_id;
      UPDATE pandit_city_requests SET resolved_city_id = canonical_id WHERE resolved_city_id = duplicate_id;
      UPDATE indian_cities SET is_active = false, updated_at = now() WHERE id = duplicate_id;
    END IF;
  END IF;
END $$;
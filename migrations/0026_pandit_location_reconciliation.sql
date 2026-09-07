-- Reconcile legacy Pandit location text with the canonical active
-- state/city catalogue. Exact names and approved city aliases are the only
-- automatic matches; ambiguous or unknown locations remain for Admin review.

UPDATE pandits p
SET state_id = s.id,
    state = s.name
FROM indian_states s
WHERE p.state_id IS NULL
  AND s.is_active = true
  AND lower(btrim(s.name)) = lower(btrim(coalesce(p.state, p.original_state, '')));

UPDATE pandits p
SET city_id = c.id,
    city = c.name,
    state_id = s.id,
    state = s.name
FROM indian_cities c
JOIN indian_states s ON s.id = c.state_id AND s.is_active = true
WHERE c.is_active = true
  AND (p.city_id IS NULL OR p.state_id IS NULL)
  AND (
    lower(btrim(c.name)) = lower(btrim(coalesce(p.city, p.original_city, '')))
    OR EXISTS (
      SELECT 1
      FROM unnest(c.aliases) alias
      WHERE lower(btrim(alias)) = lower(btrim(coalesce(p.city, p.original_city, '')))
    )
  )
  AND (
    p.state_id = s.id
    OR (
      p.state_id IS NULL
      AND lower(btrim(s.name)) = lower(btrim(coalesce(p.state, p.original_state, '')))
    )
  );

-- A canonical city is authoritative for its state. This repairs legacy rows
-- where both ids exist but point to different catalogue branches.
UPDATE pandits p
SET state_id = c.state_id,
    state = s.name,
    city = c.name
FROM indian_cities c
JOIN indian_states s ON s.id = c.state_id
WHERE p.city_id = c.id
  AND c.is_active = true
  AND s.is_active = true
  AND (p.state_id IS DISTINCT FROM c.state_id OR p.state IS DISTINCT FROM s.name OR p.city IS DISTINCT FROM c.name);

UPDATE pandits p
SET location_review_status = 'resolved'
FROM indian_cities c
JOIN indian_states s ON s.id = c.state_id
WHERE p.city_id = c.id
  AND p.state_id = s.id
  AND c.is_active = true
  AND s.is_active = true
  AND p.location_review_status IS DISTINCT FROM 'resolved';

-- Partial or invalid coordinate pairs cannot support honest distance results.
-- Keep them absent until Admin supplies a verified pair.
UPDATE pandits
SET latitude = NULL,
    longitude = NULL
WHERE (latitude IS NULL) <> (longitude IS NULL)
   OR latitude NOT BETWEEN -90 AND 90
   OR longitude NOT BETWEEN -180 AND 180;
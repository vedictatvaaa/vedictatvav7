BEGIN;

-- A Pandit whose three explicit public-governance switches are enabled must
-- not be advertised by the directory while retaining a draft presentation
-- row. This migration repairs only that contradictory legacy state.
INSERT INTO pandit_storefronts (pandit_id, status, is_published)
SELECT p.id, 'published', true
FROM pandits p
JOIN indian_states st
  ON st.id = p.state_id
 AND st.is_active = true
JOIN indian_cities ct
  ON ct.id = p.city_id
 AND ct.state_id = p.state_id
 AND ct.is_active = true
WHERE p.verified = true
  AND p.on_leave = false
  AND p.archived = false
  AND p.directory_visible = true
  AND p.search_eligible = true
  AND p.booking_enabled = true
  AND p.location_review_status = 'resolved'
  AND p.account_status <> 'banned'
  AND (
    p.account_status <> 'suspended'
    OR (p.suspended_until IS NOT NULL AND p.suspended_until <= now())
  )
ON CONFLICT (pandit_id) DO UPDATE
SET status = 'published',
    is_published = true,
    updated_at = now();

COMMIT;
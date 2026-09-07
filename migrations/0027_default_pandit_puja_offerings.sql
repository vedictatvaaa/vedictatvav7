ALTER TABLE pandit_applications
  ADD COLUMN IF NOT EXISTS master_service_ids integer[] NOT NULL DEFAULT '{}'::integer[];

-- Grant every existing Pandit every active canonical Puja. Catalogue policy
-- supplies the rate/duration defaults; existing explicit offerings win.
INSERT INTO pandit_services (
  pandit_id, master_service_id, price, duration_minutes, mode,
  description, preparation, inclusions, service_areas, is_active, display_order
)
SELECT
  p.id,
  ms.id,
  CASE
    WHEN ms.min_rate IS NOT NULL THEN ms.min_rate
    WHEN ms.max_rate IS NOT NULL THEN LEAST(p.fees, ms.max_rate)
    ELSE GREATEST(p.fees, 0)
  END,
  COALESCE(ms.default_duration_minutes, 60),
  CASE
    WHEN 'online' = ANY(ms.supported_modes) AND 'in_person' = ANY(ms.supported_modes) THEN 'hybrid'
    WHEN 'online' = ANY(ms.supported_modes) THEN 'online'
    ELSE 'in_person'
  END,
  ms.description,
  '',
  '{}'::text[],
  CASE WHEN ms.physical_available THEN ARRAY[p.city]::text[] ELSE '{}'::text[] END,
  true,
  0
FROM pandits p
CROSS JOIN master_services ms
WHERE ms.is_active = true
  AND ms.service_type IN ('puja', 'katha', 'ritual')
ON CONFLICT (pandit_id, master_service_id) DO NOTHING;

-- Legacy records were deliberately fail-closed before structured offerings
-- existed. Re-enable managed booking only for records that already satisfy
-- every core public/governance gate and now have an active offering.
UPDATE pandits p
SET booking_enabled = true
WHERE p.verified = true
  AND p.account_status = 'active'
  AND p.on_leave = false
  AND p.archived = false
  AND p.location_review_status = 'resolved'
  AND p.directory_visible = true
  AND p.search_eligible = true
  AND EXISTS (
    SELECT 1
    FROM pandit_services ps
    JOIN master_services ms ON ms.id = ps.master_service_id
    WHERE ps.pandit_id = p.id
      AND ps.is_active = true
      AND ms.is_active = true
      AND ms.service_type IN ('puja', 'katha', 'ritual')
  );
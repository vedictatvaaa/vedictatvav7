-- One-time September 2026 market alignment.
-- Physical product prices use premium-certified positioning against comparable
-- Nepali/Indonesian bead ranges. Puja ranges remain policy guardrails; Pandits
-- retain their own offering prices within those bounds.

UPDATE products AS p
SET price = v.price
FROM (VALUES
  ('1-mukhi-rudraksha-original-nepal', 9499),
  ('2-mukhi-rudraksha-original-nepal', 3699),
  ('3-mukhi-rudraksha-original-nepal', 1125),
  ('4-mukhi-rudraksha-original-nepal', 899),
  ('5-mukhi-rudraksha-original-nepal', 999),
  ('6-mukhi-rudraksha-original-nepal', 1125),
  ('7-mukhi-rudraksha-original-nepal', 1299),
  ('8-mukhi-rudraksha-original-nepal', 1499),
  ('9-mukhi-rudraksha-original-nepal', 3699),
  ('10-mukhi-rudraksha-original-nepal', 3699),
  ('11-mukhi-rudraksha-original-nepal', 5699),
  ('12-mukhi-rudraksha-original-nepal', 8499),
  ('13-mukhi-rudraksha-original-nepal', 36999),
  ('14-mukhi-rudraksha-dev-mani-original-nepal', 98999),
  ('gauri-shankar-rudraksha-original-nepal', 29999),
  ('ganesh-rudraksha-original-nepal', 5100)
) AS v(slug, price)
WHERE p.slug = v.slug
  AND p.category = 'Rudraksha';

UPDATE master_services AS ms
SET min_rate = v.min_rate,
    max_rate = v.max_rate,
    default_duration_minutes = v.duration_minutes,
    rate_policy_version = ms.rate_policy_version + 1,
    rate_policy_effective_at = NOW(),
    updated_at = NOW()
FROM (VALUES
  ('griha-pravesh-puja', 11000, 31000, 180),
  ('satyanarayan-katha', 5100, 15000, 150),
  ('ganesh-puja', 3100, 11000, 90),
  ('rudrabhishek', 5100, 21000, 120),
  ('lakshmi-puja', 5100, 15000, 120),
  ('navgraha-shanti-puja', 11000, 31000, 240),
  ('mahamrityunjaya-jaap', 21000, 51000, 360)
) AS v(slug, min_rate, max_rate, duration_minutes)
WHERE ms.slug = v.slug
  AND ms.is_active = TRUE;

-- Existing offerings remain Pandit-authored, but clamp out-of-policy values to
-- the nearest boundary so checkout and public price displays stay consistent.
UPDATE pandit_services AS ps
SET price = GREATEST(ms.min_rate, LEAST(ps.price, ms.max_rate)),
    updated_at = NOW()
FROM master_services AS ms
WHERE ps.master_service_id = ms.id
  AND ps.is_active = TRUE
  AND ms.min_rate IS NOT NULL
  AND ms.max_rate IS NOT NULL
  AND (ps.price < ms.min_rate OR ps.price > ms.max_rate);
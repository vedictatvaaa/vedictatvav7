-- Normal-commerce card variants. Admin controls remain authoritative after seed.
-- The products.slug column is intentionally not globally unique, so serialize this
-- targeted seed and fail closed rather than silently choosing among duplicates.
BEGIN;

DO $$
DECLARE
  target_slug text;
  target_count integer;
BEGIN
  LOCK TABLE products IN SHARE ROW EXCLUSIVE MODE;

  FOREACH target_slug IN ARRAY ARRAY[
    'pandit-membership-card-plastic',
    'pandit-membership-card-metal'
  ]
  LOOP
    SELECT count(*) INTO target_count FROM products WHERE slug = target_slug;
    IF target_count > 1 THEN
      RAISE EXCEPTION 'Cannot seed Pandit membership card: duplicate target slug %', target_slug;
    END IF;
  END LOOP;

  UPDATE products SET
    name = 'Pandit Membership Card – Plastic',
    description = 'Official Vedic Tatva Pandit lifetime membership card (Plastic).',
    brand = 'Vedic Tatva',
    category = 'Pandit Membership',
    image = '/og/og-pandit-registration.jpg',
    images = ARRAY['/og/og-pandit-registration.jpg'],
    variation_group_id = 'pandit-membership-card',
    variation_label = 'Plastic',
    product_type = 'pandit_membership_card',
    gst_percent = 18
  WHERE slug = 'pandit-membership-card-plastic';

  IF NOT FOUND THEN
    INSERT INTO products (
      name, description, price, mrp, brand, stock, category, image, images,
      slug, variation_group_id, variation_label, product_type, gst_percent
    ) VALUES (
      'Pandit Membership Card – Plastic',
      'Official Vedic Tatva Pandit lifetime membership card (Plastic).',
      500, 500, 'Vedic Tatva', 100, 'Pandit Membership',
      '/og/og-pandit-registration.jpg', ARRAY['/og/og-pandit-registration.jpg'],
      'pandit-membership-card-plastic', 'pandit-membership-card', 'Plastic',
      'pandit_membership_card', 18
    );
  END IF;

  UPDATE products SET
    name = 'Pandit Membership Card – Metal',
    description = 'Official Vedic Tatva Pandit lifetime membership card (Metal).',
    brand = 'Vedic Tatva',
    category = 'Pandit Membership',
    image = '/og/og-pandit-registration.jpg',
    images = ARRAY['/og/og-pandit-registration.jpg'],
    variation_group_id = 'pandit-membership-card',
    variation_label = 'Metal',
    product_type = 'pandit_membership_card',
    gst_percent = 18
  WHERE slug = 'pandit-membership-card-metal';

  IF NOT FOUND THEN
    INSERT INTO products (
      name, description, price, mrp, brand, stock, category, image, images,
      slug, variation_group_id, variation_label, product_type, gst_percent
    ) VALUES (
      'Pandit Membership Card – Metal',
      'Official Vedic Tatva Pandit lifetime membership card (Metal).',
      1000, 1000, 'Vedic Tatva', 100, 'Pandit Membership',
      '/og/og-pandit-registration.jpg', ARRAY['/og/og-pandit-registration.jpg'],
      'pandit-membership-card-metal', 'pandit-membership-card', 'Metal',
      'pandit_membership_card', 18
    );
  END IF;
END
$$;

COMMIT;
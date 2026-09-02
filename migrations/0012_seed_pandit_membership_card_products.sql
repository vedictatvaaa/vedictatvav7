-- Normal-commerce card variants. Admin controls remain authoritative after seed.
INSERT INTO products (
  name, description, price, mrp, brand, stock, category, image, images,
  slug, variation_group_id, variation_label, product_type, gst_percent
) VALUES
  (
    'Pandit Membership Card – Plastic',
    'Official Vedic Tatva Pandit lifetime membership card (Plastic).',
    500, 500, 'Vedic Tatva', 100, 'Pandit Membership',
    '/og/og-pandit-registration.jpg', ARRAY['/og/og-pandit-registration.jpg'],
    'pandit-membership-card-plastic', 'pandit-membership-card', 'Plastic',
    'pandit_membership_card', 18
  ),
  (
    'Pandit Membership Card – Metal',
    'Official Vedic Tatva Pandit lifetime membership card (Metal).',
    1000, 1000, 'Vedic Tatva', 100, 'Pandit Membership',
    '/og/og-pandit-registration.jpg', ARRAY['/og/og-pandit-registration.jpg'],
    'pandit-membership-card-metal', 'pandit-membership-card', 'Metal',
    'pandit_membership_card', 18
  )
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  brand = EXCLUDED.brand,
  category = EXCLUDED.category,
  image = EXCLUDED.image,
  images = EXCLUDED.images,
  variation_group_id = EXCLUDED.variation_group_id,
  variation_label = EXCLUDED.variation_label,
  product_type = EXCLUDED.product_type,
  gst_percent = EXCLUDED.gst_percent;
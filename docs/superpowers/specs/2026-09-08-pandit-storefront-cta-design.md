# Pandit Storefront CTA and Feature Strip

## Goal

Bring the Pandit storefront’s primary actions and section navigation in line with
the approved mobile reference while preserving the existing storefront,
managed-booking, messaging, analytics, and product-store systems.

## Approved behavior

- The profile header presents four primary actions in a 2×2 layout:
  `Book a Puja`, `WhatsApp`, `Call Panditji`, and `Send Message`.
- `Book a Puja` uses the existing managed booking route and eligibility behavior.
- `Send Message` uses the existing authenticated message flow.
- `Call Panditji` opens the native `tel:` handler.
- `WhatsApp` opens the native WhatsApp web/app handler.
- Call and WhatsApp use the Pandit phone stored in the existing Pandit user
  record. A missing or unusable number produces a disabled action with an
  explicit explanation rather than a fabricated fallback.
- Direct Call/WhatsApp is an intentional public-contact boundary change for the
  storefront profile. Phone data remains excluded from search cards, SEO,
  analytics, unrelated public DTOs, and browser storage.

## Layout

1. Profile summary and description.
2. Primary action grid.
3. Four-item capability strip:
   `In-person Puja`, `Online Puja`, `Response time`, `Service areas`.
4. Existing section tabs, visually styled as a compact storefront navigation
   row and preserving the current anchor destinations.
5. Existing overview, services, Panditji Store, reviews, gallery, and about
   content.

## Verification

- Confirm the profile renders with and without a Pandit phone number.
- Confirm the four actions retain their existing booking, messaging, and
  analytics behavior.
- Confirm phone values do not appear in unrelated public responses.
- Confirm the preview renders at mobile and desktop widths.
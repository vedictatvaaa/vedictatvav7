# Pandit Public Surface Hardening

## Scope

Apply the existing public Pandit eligibility rule to every anonymous Pandit storefront surface. Do not change Admin or Pandit-authenticated management, historical bookings, payments, or unrelated pages.

## Design

- Reuse one database-backed guard for verified, available, resolved-location Pandits whose active City belongs to their active State.
- Return not found for ineligible storefront JSON, social images, QR/PDF cards, legacy redirects, and server-rendered profile metadata.
- Build public storefront Pandit data from an explicit allowlist. Exclude contact, exact coordinates, moderation, provenance, membership, and tier fields.
- Preserve explicitly configured storefront contact/social fields because those are controlled storefront content rather than the private Pandit profile phone.

## Failure Behavior

Unknown and ineligible Pandits are indistinguishable to anonymous callers and return 404-style responses. Authenticated Pandit and Admin surfaces retain operational data.

## Verification

- Unit-test the eligibility predicate and public storefront field allowlist.
- Check eligible and ineligible public endpoints directly.
- Build the application and run a storefront browser smoke test.
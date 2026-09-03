# Vedic Tatva Puja Platform Action Plan

This is the starting point for future developers and agents working on the Puja catalogue, auspicious-date matching, or booking handoff.

## Read first

1. Booking architecture: `docs/superpowers/specs/2026-09-04-puja-booking-operations-design.md`
2. Booking implementation plan: `docs/superpowers/plans/2026-09-04-puja-booking-operations-plan.md`
3. Catalogue governance: `docs/superpowers/specs/2026-09-04-puja-catalogue-governance-design.md`

## Current invariants

- Extend the existing booking engine; never create a parallel booking backend.
- Standard catalogue, Pandit service, package, travel, and total prices remain server-authoritative.
- Pending Pandits receive only approximate area and operational requirements.
- Customer and Pandit verified contact details are exchanged only after one eligible Pandit accepts.
- Contact release and booking acceptance must remain atomic, idempotent, and auditable.
- Virtual and at-home Puja are explicit modes; at-home travel remains a separate line item.
- If distance is not reliable before assignment, preserve the subtotal and mark travel pending.
- Samagri revisions are immutable and versioned; portal records are authoritative.
- Notification attempts are durable and deduplicated; never fabricate delivery success.
- Dated Pandit matching requires a published, approved, complete, conflict-free Puja catalogue record and an actual stored Muhurat.
- Public Puja guides may be AI-, admin-, or Pandit-reviewed. Only the Pandit method requires current verified-Pandit ownership; public disclosures must never name a Pandit unless that verification is live. Material edits invalidate approval.

## Database changes

Apply committed migrations in order. The relevant additions are:

- `migrations/0015_puja_booking_operations.sql`
- `migrations/0016_puja_catalogue_governance.sql`
- `migrations/0017_ai_reviewed_puja_catalogue.sql`

Do not replace the existing database or run destructive schema synchronization automatically.

## Immediate editorial operation

An admin must complete taxonomy, source notes, citations, eligibility, and a review method before approving each guide. AI review is eligible for automatic publication when the guide is approved, complete, and conflict-free; admin and verified-Pandit review remain optional upgrades.

## Verification baseline

- Focused booking tests live in `server/puja-booking-*.test.ts` and `server/booking-notification-delivery.test.ts`.
- Catalogue governance tests live in `server/puja-governance.test.ts`.
- `npm run build` is the production compilation gate.
- The repository has a large pre-existing TypeScript error baseline; check changed files for new errors rather than requiring a globally clean `npm run check`.

## Next highest-value work

1. Optionally upgrade AI-reviewed guides to admin or verified-Pandit review without changing their public review attribution inaccurately.
2. Add isolated API/browser fixtures for approval invalidation and concurrent duplicate submissions.
3. Keep future catalogue expansion versioned, sourced, and governed; do not add startup-time production content writes.
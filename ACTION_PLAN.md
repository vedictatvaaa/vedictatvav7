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
- Public Puja guides require current verified-Pandit review ownership. Material edits invalidate approval.

## Database changes

Apply committed migrations in order. The relevant additions are:

- `migrations/0015_puja_booking_operations.sql`
- `migrations/0016_puja_catalogue_governance.sql`

Do not replace the existing database or run destructive schema synchronization automatically.

## Immediate editorial operation

The legacy Puja guides are intentionally in `in_review` and not public after the governance migration. An admin must complete taxonomy, source notes, citations, eligibility, and verified-Pandit attribution before approving and publishing each guide.

## Verification baseline

- Focused booking tests live in `server/puja-booking-*.test.ts` and `server/booking-notification-delivery.test.ts`.
- Catalogue governance tests live in `server/puja-governance.test.ts`.
- `npm run build` is the production compilation gate.
- The repository has a large pre-existing TypeScript error baseline; check changed files for new errors rather than requiring a globally clean `npm run check`.

## Next highest-value work

1. Complete verified religious review of the existing Puja queue and restore approved guides publicly.
2. Add isolated API/browser fixtures for approval invalidation and concurrent duplicate submissions.
3. Expand the Puja catalogue only through the governed editor and approved taxonomy.
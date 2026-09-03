# Puja Booking Operations Implementation Plan

**Design:** `docs/superpowers/specs/2026-09-04-puja-booking-operations-design.md`  
**Status:** Ready for implementation

## Goal

Extend the existing Vedic Tatva Puja booking engine into a disciplined virtual and
at-home workflow with:

- explicit mode-specific booking
- nearby-first at-home Pandit matching
- private contact exchange after acceptance
- admin-controlled Puja rate bands
- separate admin-controlled travel charges
- server-authoritative pricing snapshots
- reliable portal, WhatsApp, and email notifications
- versioned samagri lists shared from Pandit to customer

The implementation must preserve the existing catalogue, Pandit marketplace,
moderation rules, storefront services/packages, booking records, portals, chat,
reviews, and standard Puja booking compatibility.

## Non-goals

- A second booking backend or replacement booking table
- A new payment processor or payment-capture flow
- AI-generated religious, matching, pricing, or samagri recommendations
- Automatic samagri inventory reservation
- Customer/Pandit price negotiation
- Arbitrary per-booking travel quotes
- Fabricated distance, availability, ratings, or notification success
- A broad redesign of unrelated Pandit or admin portal sections

## Existing contracts to preserve

- `/online-puja-booking` remains the canonical customer entry point.
- Standard Puja prices, Pandit service prices, and package prices remain
  server-authoritative.
- Pandit identity continues to come from the authenticated Pandit session.
- Customer identity continues to come from customer authentication.
- Suspended, banned, unapproved, or otherwise ineligible Pandits remain excluded
  from public discovery and booking.
- Existing service/package booking URLs and canonical location context remain
  compatible.
- Existing bookings preserve their current price and status data.
- Existing booking messages, completion, reviews, and customer access links remain
  usable during migration.
- `npm run check` has a large pre-existing error baseline and is not a global
  release gate; changed files must introduce no new errors.

## Architecture boundaries

Keep Express route handlers thin by extracting pure or transaction-focused domain
modules:

- `server/puja-booking/pricing.ts`
- `server/puja-booking/matching.ts`
- `server/puja-booking/lifecycle.ts`
- `server/puja-booking/projections.ts`
- `server/puja-booking/samagri.ts`
- `server/puja-booking/notification-events.ts`

These modules may depend on storage interfaces and shared types, but must not
depend on React or accept user/Pandit IDs as authorization proof.

Client pages remain coordinators. New mode, pricing, contact, and samagri
interfaces should be focused components rather than additional large inline
blocks in existing pages.

## Dependency order

### Wave 1 — foundations

1. Baseline privacy and pricing regression tests
2. Schema and migration
3. Pure lifecycle, projection, pricing, and distance helpers

### Wave 2 — governed supply

4. Admin rate/travel policy APIs and UI
5. Pandit service/package rate enforcement

### Wave 3 — booking orchestration

6. Mode-specific customer request and structured location
7. Nearby-first matching and booking offers
8. Transactional acceptance and contact exchange

### Wave 4 — operations

9. Durable notification events and delivery attempts
10. Versioned samagri workflow
11. Customer and Pandit portal updates

### Wave 5 — release

12. Data compatibility, full verification, and controlled rollout

Waves are sequential. Tasks inside Wave 1 may be developed together, but later
waves must not bypass the domain contracts established there.

## Work breakdown

### 1. Lock the current privacy and pricing behavior with regression tests

Files:

- `server/pandit-booking-context.test.ts`
- `server/pandit-public-access.test.ts`
- `shared/standard-puja-catalogue.test.ts`
- new `server/puja-booking-projections.test.ts`
- new `server/puja-booking-pricing.test.ts`

Before changing schemas, add focused tests that describe the current safe
contracts:

- client-submitted totals cannot override standard Puja pricing
- client-submitted totals cannot override Pandit service/package pricing
- inactive or moderated Pandits cannot be booked
- canonical service/location context cannot be forged
- a Pandit booking query is scoped to the authenticated Pandit
- a customer booking query cannot retrieve another customer's booking

Add failing projection tests for the new privacy boundary:

- a candidate Pandit projection excludes full address, phone, and email
- an accepted assigned-Pandit projection includes approved contact fields
- a declined or competing candidate projection never includes those fields
- public/customer-safe booking projections exclude internal notification and offer
  metadata

Do not loosen production authorization merely to make tests easy. Prefer pure
projection fixtures and authenticated route-test helpers.

Verification:

```bash
node --import tsx --test \
  server/pandit-booking-context.test.ts \
  server/pandit-public-access.test.ts \
  server/puja-booking-projections.test.ts \
  server/puja-booking-pricing.test.ts
npx tsx --test shared/standard-puja-catalogue.test.ts
```

### 2. Add the booking-operations schema and migration

Files:

- `shared/schema.ts`
- `migrations/0015_puja_booking_operations.sql`
- migration-focused schema tests or SQL assertions

Extend `master_services` with governed policy fields:

- minimum rate
- maximum rate
- currency
- virtual/at-home/both mode policy
- default duration where not already represented
- active rate-policy version/effective timestamp
- default approved samagri template JSON if a separate template table is not used

Add an audit table for master-service policy changes containing the prior/new
values, admin identity where available, reason, and timestamp.

Add admin-controlled travel-band records:

- minimum and maximum distance
- charge
- currency
- active/effective state
- unusually-distant confirmation flag or threshold
- audit timestamps

Extend `puja_bookings` without removing legacy fields:

- customer email
- customer timezone
- structured at-home address fields
- customer latitude/longitude
- virtual joining preference/context
- matched distance
- applied travel-band ID and amount
- pricing-policy version
- contact-released timestamp
- explicit lifecycle status compatible with legacy values

Add booking-offer records:

- booking ID
- Pandit ID
- status
- approximate area/distance snapshot
- offered, expiry, accepted, declined, and closed timestamps
- unique constraints preventing duplicate active offers to the same Pandit

Add an auditable contact-release record with a uniqueness constraint that permits
only the assigned accepted Pandit for a booking.

Add booking-notification event and delivery-attempt records:

- event type and booking ID
- recipient party and ID
- channel
- template version
- idempotency key
- queued/sent/failed/retrying state
- attempt count, provider reference, last safe error, and timestamps

Never store provider secrets or raw provider credentials.

Add versioned samagri records:

- booking ID and monotonically increasing version
- author Pandit ID
- structured items JSON
- sent timestamp
- created timestamp

Keep `puja_bookings.samagri_list` and `samagri_sent_at` as a current projection
during compatibility rollout.

Migration requirements:

- all new booking fields are nullable or safely defaulted for existing rows
- existing status values remain readable
- existing pricing snapshots remain untouched
- money constraints reject negative values
- min/max rate constraints reject null-invalid, negative, or inverted ranges
- latitude/longitude constraints require pairs and valid ranges
- travel bands reject overlaps for the same active policy scope
- contact release and accepted offer constraints are enforceable under concurrency

Verification:

- run the migration against the development database once
- inspect constraints and indexes
- confirm old booking rows still load in admin, customer, and Pandit views
- confirm a migration rerun cannot duplicate seed/policy rows

### 3. Implement pure domain rules

Files:

- new `server/puja-booking/pricing.ts`
- new `server/puja-booking/matching.ts`
- new `server/puja-booking/lifecycle.ts`
- new `server/puja-booking/projections.ts`
- new `shared/puja-booking.ts`
- focused tests for each module

Define shared enums/schemas for:

- booking mode: `virtual | at_home`
- lifecycle state
- offer state
- supported notification events
- structured address
- structured samagri item
- rate and travel breakdown

Keep compatibility adapters for the existing `online` and `offline` values at API
boundaries. Persist one canonical representation for new records.

Implement a lifecycle transition function that:

- enumerates permitted transitions
- rejects arbitrary status jumps
- identifies terminal states
- identifies states where contact may be released
- identifies states where chat, samagri, or completion actions are allowed

Implement projections:

- customer projection
- candidate-Pandit projection
- assigned-Pandit projection
- admin projection
- access-token customer projection

Implement price calculation:

- resolve authoritative service/package/standard Puja amount
- enforce active master-Puja rate band
- apply samagri arrangement/amount from an authoritative source
- apply a travel band only for at-home bookings
- reject unknown distance rather than inventing a travel charge
- return a versioned immutable snapshot

Implement distance utilities:

- validate coordinate pairs
- calculate Haversine distance
- classify an admin travel band
- distinguish exact-distance and area-only results
- produce stable sort keys without random ranking

Tests must cover boundaries exactly at minimum/maximum values and distance-band
edges.

### 4. Add admin rate, mode, travel, and template controls

Files:

- `server/routes.ts`
- focused `server/admin-puja-policy.ts`
- `client/src/pages/admin-tabs/PujaLibraryTab.tsx`
- focused admin components under `client/src/components/admin/puja/`
- new admin policy route tests

Add admin-authenticated APIs to:

- read and update master-Puja min/max rate
- read and update allowed booking modes
- read and update default duration/preparation guidance
- read and update approved default samagri template
- list/create/update/deactivate travel bands
- read policy audit history

Every mutation:

- validates on the server
- writes an audit row in the same transaction
- returns the active policy version
- does not rewrite accepted or historical bookings

Admin UI requirements:

- show current range and number of out-of-band active Pandit services
- prevent inverted or negative values before submit
- explain that server validation remains authoritative
- show virtual/at-home/both mode policy
- edit ordered, non-overlapping travel bands
- show which bands require explicit distant-travel confirmation
- edit a structured default samagri template
- warn before a range change makes existing services non-bookable

Do not add a second admin navigation area; extend the existing Puja library.

### 5. Enforce rate policy across Pandit services and packages

Files:

- `server/pandit-storefront.ts`
- `server/routes.ts`
- `server/storage.ts`
- `client/src/components/pandit/PanditStorefrontPanel.tsx`
- new `server/pandit-service-pricing.test.ts`

On service create, edit, and reactivation:

- load the active master-Puja policy
- reject unsupported booking mode
- reject price below minimum or above maximum
- return the approved range in a structured validation error

On public storefront and booking:

- exclude active-looking services that became non-bookable after an admin range
  change
- do not silently rewrite the Pandit's price
- expose a safe “rate update required” state to the owning Pandit

On package create/edit/booking:

- verify every component service is active and in policy
- prevent package composition from bypassing disabled modes
- validate package pricing using an explicit admin policy
- snapshot component services and policy versions at booking time

Pandit UI:

- display the approved min/max range beside the rate input
- explain virtual, at-home, or hybrid eligibility
- preserve the Pandit's unsaved input on a validation error
- identify services that require a rate update

Verification:

- exact min and max accepted
- one unit below/above rejected
- stale client cannot save an old out-of-band value
- range change does not mutate historical bookings
- package cannot include a newly invalid service

### 6. Capture mode-specific customer request data

Files:

- `client/src/pages/puja-booking.tsx`
- new `client/src/components/puja-booking/BookingModeChoice.tsx`
- new `client/src/components/puja-booking/VirtualPujaFields.tsx`
- new `client/src/components/puja-booking/AtHomePujaFields.tsx`
- new `client/src/components/puja-booking/BookingPriceSummary.tsx`
- `server/routes.ts`
- request-schema tests

Make mode choice the first explicit booking decision:

- “Virtual Puja” explains video/remote participation
- “At-home Puja” explains nearby Pandit matching and separate travel

Virtual fields:

- timezone
- preferred language
- tradition where supported
- video joining/contact preference
- no physical address requirement

At-home fields:

- house/building
- street
- locality
- city/state/postal code
- landmark optional
- coordinate capture only with explicit browser permission or reliable selected
  locality data

Common fields:

- customer name
- phone
- email
- requested date/time
- Puja/service context

Server validation must use explicit schemas rather than the raw generated insert
schema alone. Normalize phone/email/address inputs without logging them.

Creation behavior:

- standard Puja without an assigned Pandit creates a matching request
- selected Pandit service/package creates a request tied to that offering
- no request is described as “confirmed” before acceptance
- returned customer link remains compatible

The price summary clearly separates:

- Puja/dakshina
- samagri
- travel for at-home mode
- final total or “travel pending” when distance is unknown

Do not submit a charge when travel is unresolved.

### 7. Implement nearby-first matching and staged widening

Files:

- `server/puja-booking/matching.ts`
- `server/pandit-discovery-policy.ts`
- `server/pandit-public-eligibility.ts`
- `server/routes.ts` or focused `server/puja-booking-routes.ts`
- `client/src/pages/pandit-directory.tsx`
- `client/src/components/pandit/PanditDirectoryView.tsx`
- new matching tests

Build one server matching query/pipeline:

1. Apply public eligibility.
2. Require an active matching master/Pandit service.
3. Require compatible virtual/at-home mode.
4. Require in-policy pricing.
5. Apply requested language/tradition when mandatory.
6. Apply verifiable availability when supported.
7. Rank the eligible set for the requested mode.

Virtual ranking:

- does not read or sort by customer distance
- prioritizes exact service/mode/language/tradition fit
- uses transparent quality/fairness tie-breakers

At-home ranking:

- calculates distance when both coordinate pairs are reliable
- starts at the nearest active travel/search band
- widens one configured stage at a time
- labels area-only matches
- never emits a fabricated distance
- requests customer confirmation for unusually distant bands

Return matching metadata:

- mode
- search stage/band
- whether widening occurred
- approximate distance or area-only label
- travel charge or unresolved state
- eligibility reason summary

Create booking offers only after the customer chooses or confirms the candidate
set. Avoid broadcasting private contact information.

Tests:

- virtual ordering unchanged when customer coordinates change
- nearest eligible at-home Pandit ranks first
- nearer ineligible Pandit is excluded
- radius widening occurs only when the prior stage has no eligible result
- area-only fallback contains no numeric distance
- stable tie-breaking produces repeatable results

### 8. Make acceptance transactional and release contact once

Files:

- `server/puja-booking/lifecycle.ts`
- `server/pandit-portal.ts`
- `server/storage.ts`
- new `server/puja-booking-acceptance.test.ts`
- `client/src/components/pandit/PanditBookingWorkflow.tsx`

Replace broad booking-row responses with the candidate-Pandit projection.

Acceptance transaction:

1. Lock or conditionally update the active offer/booking.
2. Verify current lifecycle state and unexpired offer.
3. Re-check Pandit public eligibility and service/rate policy.
4. Mark exactly one offer accepted.
5. Assign the Pandit.
6. Close competing offers.
7. Store accepted/confirmed timestamps.
8. Insert exactly one contact-release event.
9. Insert durable notification events.
10. Commit before external delivery starts.

After commit, assigned-Pandit endpoints may return the full approved contact
projection. Customer endpoints may return the Pandit's verified contact
projection.

The portal must not receive phone/address in the initial booking-list payload.
Fetch the accepted detail projection only when permitted.

Decline:

- records reason safely
- closes only that Pandit's offer
- triggers the next controlled offer/reassignment path
- does not expose customer contact

Concurrency tests must send simultaneous accept attempts from two eligible
Pandits and assert:

- one success
- one conflict/closed-offer response
- one assigned Pandit
- one contact-release record
- no duplicate acceptance notifications

### 9. Add durable booking notification events and delivery

Files:

- `server/services/booking-notifications.ts`
- new `server/puja-booking/notification-events.ts`
- existing email and `server/services/msg91.ts` adapters
- portal notification storage/routes
- new `server/booking-notification-delivery.test.ts`

Refactor direct “send during route request” behavior into:

1. transactional booking notification event creation
2. post-commit channel delivery
3. idempotent delivery-attempt recording

Required event templates:

- request acknowledged to customer
- limited offer sent to Pandit
- booking accepted to both parties
- decline/reassignment
- date/time confirmation or change
- samagri sent or updated
- cancellation
- completion

Privacy:

- pre-acceptance Pandit templates contain only the candidate projection
- post-acceptance templates may contain approved contact details
- no full address/phone appears in console logging or generic error metadata

Reliability:

- idempotency key includes booking event, recipient, channel, and template version
- retries cannot duplicate a sent attempt
- provider failure does not revert booking state
- safe failure reason and retry state are visible to authorized portal users/admin
- absent provider configuration is reported as unavailable/skipped, not sent

Keep existing providers; do not add a new messaging vendor.

### 10. Version and deliver samagri lists

Files:

- `server/puja-booking/samagri.ts`
- `server/pandit-portal.ts`
- `client/src/components/pandit/PanditBookingWorkflow.tsx`
- `client/src/pages/my-puja-booking.tsx`
- `client/src/pages/my-bookings.tsx`
- new samagri tests

Authorization:

- only the assigned accepted Pandit can create/send a booking samagri version
- customer can read versions for their own booking
- candidate, declined, unrelated, or suspended Pandits cannot send a list

Structured item schema:

- name
- quantity
- unit
- note
- required/optional
- arranged-by party
- optional real catalogue product reference

Sending:

- start from approved master template, Pandit personal template, or custom list
- validate bounded item count and text lengths
- save the next version transactionally
- update the legacy current-list projection
- create booking message/event
- create portal notification
- queue WhatsApp/email summary

Updating:

- create a new immutable version
- calculate a safe change summary
- show added, removed, and changed items
- never erase a prior sent version

Do not claim that an item is in stock unless the current shop/inventory system
confirms it.

### 11. Update customer and Pandit portal experiences

Files:

- `client/src/components/pandit/PanditBookingWorkflow.tsx`
- `client/src/pages/my-puja-booking.tsx`
- `client/src/pages/my-bookings.tsx`
- focused components under `client/src/components/booking/`
- existing portal coordinator/booking section files

Pandit pre-acceptance view:

- Puja and mode
- requested date/time
- language/tradition
- approximate area/distance
- approved rate and preparation summary
- no phone, email, house number, or full street

Pandit accepted view:

- customer phone and email
- full at-home address and navigation action, or virtual joining context
- confirmed schedule
- price breakdown
- samagri editor/version history
- message and delivery states

Customer view:

- lifecycle timeline
- assigned verified Pandit contact after acceptance
- virtual/at-home context
- structured address visible only to the customer and assigned Pandit
- separate Puja, samagri, travel, and total values
- current samagri checklist and version history
- notification delivery state where useful

Accessibility and responsive requirements:

- mode controls are semantic radio/select controls
- all status meaning is conveyed by text, not color alone
- phone, email, and navigation actions have descriptive labels
- dialogs and tabs remain keyboard usable
- address and samagri forms work at 390px without horizontal overflow
- privacy explanations appear next to the fields they govern

Do not duplicate the booking lifecycle across multiple unrelated components. Use
shared status labels, transition affordances, and price-breakdown types.

### 12. Backfill compatibility, verify, and roll out safely

Files:

- migration/backfill logic in `migrations/0015_puja_booking_operations.sql`
- all focused tests introduced above
- existing relevant Pandit booking/public-access tests
- deployment/release notes if the project already maintains them

Compatibility rules:

- map legacy `online` to `virtual` and `offline` to `at_home` at boundaries
- preserve original stored values where rewriting would risk historical behavior
- old accepted bookings with an assigned Pandit are treated as contact-released
  only through a deliberate safe backfill or compatibility projection
- old pending bookings must not suddenly expose contact data
- old samagri JSON remains visible as version zero/read-only until a new version is
  sent
- old pricing snapshots remain unchanged

Recommended rollout flags:

- governed service-rate enforcement
- nearby matching/offers
- post-acceptance privacy projection
- durable notification delivery
- versioned samagri

The privacy projection and server-side rate validation must become mandatory
before broad UI exposure. Feature flags may stage interfaces, but must not create
two writable booking lifecycles.

Focused verification:

```bash
node --import tsx --test \
  server/pandit-booking-context.test.ts \
  server/pandit-public-access.test.ts \
  server/puja-booking-projections.test.ts \
  server/puja-booking-pricing.test.ts \
  server/pandit-service-pricing.test.ts \
  server/puja-matching.test.ts \
  server/puja-booking-acceptance.test.ts \
  server/booking-notification-delivery.test.ts \
  server/puja-booking-samagri.test.ts
npx tsx --test shared/standard-puja-catalogue.test.ts
npm run build
git diff --check
```

Type-check policy:

- run `npm run check`
- compare failures against the documented baseline
- fix every new error in touched files
- do not block release on unrelated pre-existing errors

Workflow verification:

1. Restart the application once after the complete code/migration batch.
2. Confirm workflow and browser logs contain no new booking errors.
3. Verify the public discovery route and both booking modes render.
4. Run one browser-based critical journey:
   - virtual request
   - at-home nearby matching
   - limited Pandit offer
   - acceptance
   - two-way contact exchange
   - samagri send/update
   - customer receipt
5. Delete any synthetic booking, notification, or test-user records created by the
   browser run.

## Completion checklist

- [ ] Approved schema migration is committed and reversible by checkpoint
- [ ] Pre-acceptance Pandit APIs contain no private customer contact fields
- [ ] Exactly one accepted Pandit receives customer contact details
- [ ] Customer receives the accepted Pandit's verified contact details
- [ ] Virtual matching ignores distance
- [ ] At-home matching ranks nearby eligible Pandits and widens truthfully
- [ ] Admin rate bands are enforced on every write and booking path
- [ ] Travel appears as a separate admin-governed line item
- [ ] Client totals are ignored by the server
- [ ] Samagri sends are versioned and visible in both portals
- [ ] WhatsApp/email delivery is deduplicated, retryable, and observable
- [ ] Existing service/package/standard bookings remain compatible
- [ ] Moderated Pandits remain excluded
- [ ] Focused tests and production build pass
- [ ] No synthetic verification data remains

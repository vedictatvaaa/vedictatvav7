# Vedic Tatva Pandit Storefront and Service Catalogue

**Date:** 2026-09-01
**Status:** Approved design
**Scope:** First implementation slice of the Pandit Commerce & Digital Presence revamp

## Purpose

Extend the existing Pandit directory and storefront into a manageable, trustworthy
Pandit Store without replacing the current Pandit, eligibility, booking, payment,
Admin, or URL architecture.

The first slice establishes the service catalogue and store-management foundation.
It deliberately does not implement marketplace settlement, universal chat, or a new
availability engine. Those systems depend on the service identity and ownership
contracts defined here.

## Current architecture to preserve

- `pandits` remains the single identity record for name, photo, canonical State and
  City, verification, experience, languages, and availability.
- `server/pandit-public-eligibility.ts` remains the only public eligibility
  predicate. Store publication never bypasses it.
- `pandit_storefronts` remains the presentation record for existing storefronts.
- Existing `/p/:slug` URLs, QR links, PDFs, referrals, and legacy redirects remain
  compatible. A preferred `/pandit/{slug}` URL is not introduced as a competing
  public route in this slice.
- Existing Pandit authentication, Admin authentication, audit logging, and
  Pandit/Locations Admin areas remain the authorization and operational foundation.
- Existing `products` remain physical/shop commerce products. They are not reused as
  puja-service identity records.
- Existing booking handoff remains the integration boundary; service checkout and
  marketplace accounting are later slices.

## Product experience

The storefront uses a hybrid conversion path:

1. Verified Pandit identity, canonical location, experience, and short introduction.
2. Primary `Book a Puja` and `Ask/Chat` actions.
3. Immediate preview of the first approved services or packages.
4. Progressive sections for About, Services, Packages, Add-ons, Gallery,
   Availability, Reviews, Service Areas, Google Business, Contact, Chat, and
   Booking as those capabilities become available.

The first slice renders approved services only. It must not fabricate prices,
availability, contact details, or service capabilities.

Direct phone and WhatsApp actions are disabled in the anonymous public DTO by
default. They may be reintroduced only through explicit public-contact flags and
policy checks in a later approved slice. Secure Vedic Tatva booking and chat
actions are the default calls to action.

## Store lifecycle

Store editorial status is separate from Pandit public eligibility:

```text
public store = eligible Pandit
             AND store status = PUBLISHED
             AND content passes public DTO rules
```

The supported editorial states are:

- `DRAFT`
- `PENDING_REVIEW`
- `PUBLISHED`
- `SUSPENDED`

When a Pandit becomes eligible, an idempotent `ensurePanditStorefront` operation
creates or reactivates their store without requiring a manual Admin creation step.
The operation inherits identity through the Pandit relation rather than copying
name, location, verification, or other canonical fields.

Existing stores are compatibility-mapped from `isPublished`: existing published
stores remain published, while the new status is introduced without changing their
current public behavior. A published editorial status can never make an ineligible
Pandit public.

Store creation is invoked at the existing Pandit approval/verification transition
and is also available through an Admin discovery-health repair action. Both paths
are idempotent.

## Service catalogue model

Introduce a controlled catalogue layer:

### `master_services`

Admin-owned service identity:

- stable name and slug
- category
- description
- service type
- supported modes
- online and physical availability flags
- standard fields and search metadata
- active/inactive state

Only active master services can be selected for a new Pandit service.

### `pandit_services`

Pandit-owned configuration for one approved master service:

- Pandit and master-service references
- price
- duration
- description
- supported mode
- service areas
- preparation guidance
- inclusions
- availability configuration
- active/display state

The master service identity is never editable by the Pandit. Server validation
enforces ownership, active master-service state, supported modes, safe text
content, price bounds, duration bounds, and service-area values.

### Packages and add-ons

Packages and add-ons are defined in the data model boundary but are outside the
first code slice:

- `service_packages` reference only the Pandit's approved services.
- Package items cannot contain arbitrary unsupported service names.
- Approved add-ons become explicit order line items.
- Final totals are calculated on the server, never trusted from the browser.

Existing `featuredPujas` values are a compatibility/display source during
migration. They are not treated as authoritative service identity. Unambiguous
values may be mapped later; ambiguous legacy text remains visible as legacy text
until an explicit Pandit or Admin mapping is made.

## Ownership and API boundaries

### Public reads

The existing public routes remain the read model:

- `GET /api/storefront/:slug`
- `GET /api/storefront/:slug/qr.png`
- `GET /api/storefront/:slug/card.pdf`
- `/p/:slug`
- existing legacy redirects

Public responses use explicit DTO allowlists. They contain only published,
privacy-safe content from eligible Pandits. Raw database rows are never returned.
Storefront, media, and crawler responses remain eligibility-gated and use
`Cache-Control: no-store` where eligibility changes could make cached content
unsafe.

### Pandit management

Pandit management endpoints use the existing `panditAuthMiddleware` and operate
only on the authenticated Pandit's records:

- store draft and status management
- create, edit, activate, and deactivate Pandit services
- preview and submit-for-review

The first implementation slice adds service management. Package, add-on, gallery,
Google Business, and availability management endpoints follow their own designs.

### Admin management

Admin endpoints use the existing Admin middleware and audit trail for:

- master-service CRUD and active/inactive control
- store review, publish, request-changes, and suspend actions
- Pandit-service moderation or override
- missing-store repair

Admin actions must record who changed what and why where the existing audit model
supports a reason.

## Booking boundary

The first slice links an approved Pandit service to the existing booking handoff.
It does not create a second booking engine.

Later booking work must add server-side service snapshots, timezone-aware slots,
transactional holds, payment state, refunds, commission snapshots, and settlement
ledger entries before service checkout is expanded. Existing bookings must remain
historically immutable when current service settings change.

## Security and privacy

- Public eligibility always requires verification, non-leave status, resolved
  location, active State and City, and a valid City-to-State relationship.
- Store status is not an alternative eligibility system.
- Pandit mutations require authenticated ownership checks.
- Admin overrides are role-restricted and auditable.
- Public DTOs exclude phone, email, exact GPS, membership, tier, moderation,
  credentials, and reviewer email.
- Direct contact channels require explicit opt-in and a later policy gate.
- Profile and service text use safe structured fields or sanitized text; no
  uncontrolled HTML.
- Gallery uploads remain a later slice requiring validation, ownership,
  moderation, safe storage, and image processing.

## Migration and rollout

1. Add catalogue tables and store-status compatibility without changing the current
   public storefront.
2. Backfill only unambiguous service mappings; preserve ambiguous legacy values.
3. Add idempotent store creation and Admin repair.
4. Add authenticated Pandit service management.
5. Render approved services in the hybrid storefront behind server DTO checks.
6. Enable broader cohorts after endpoint, browser, accessibility, and rollback
   checks pass.

Database migrations must be applied before code paths that require new columns or
tables. Each rollout keeps the previous storefront and booking paths available
until the replacement path has passed live smoke checks.

## Testing and acceptance

### Unit and API tests

- master-service selection rejects inactive or unknown services
- Pandit service mutations reject another Pandit's records
- invalid prices, durations, modes, and unsafe text are rejected
- store status transitions enforce allowed states
- public reads require both published status and public eligibility
- public DTOs exclude private and commercial fields
- legacy storefront and booking handoff remain compatible
- store creation is idempotent

### Browser tests

- eligible Pandit sees and edits only their own services
- Admin can create/disable a master service and review a store
- Pandit can submit a store for review
- published approved services appear in the hybrid storefront
- draft, suspended, or ineligible stores are not publicly rendered
- mobile layout, keyboard navigation, focus states, and accessible labels work

### Release gates

- focused tests pass
- production build passes
- workflow restarts cleanly
- migration and rollback checks pass
- public endpoint privacy and cache checks pass
- no new browser console or server errors are introduced

## Explicitly deferred

The following are intentionally separate implementation slices:

- service packages and add-ons
- durable recurring availability, holds, and calendar integration
- marketplace payment accounts, KYC, commission hierarchy, refunds, ledger, and
  settlement
- unified visitor/customer/Pandit chat and notification outbox
- gallery storage and moderation
- Google Business connection
- earnings and analytics screens

These areas must reuse the service, identity, authorization, and publication
contracts in this document rather than introducing parallel Pandit or eligibility
systems.
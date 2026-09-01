# Pandit Storefront and Service Catalogue Implementation Plan

**Design:** `docs/superpowers/specs/2026-09-01-pandit-storefront-catalog-design.md`
**Status:** Ready for implementation

## Goal

Ship the first Storefront/catalog slice on top of the current Vedic Tatva
architecture:

- Admin-controlled master services
- Pandit-owned service offerings
- Store publication status compatible with existing `isPublished`
- Idempotent store creation for eligible Pandits
- Authenticated Pandit service management
- Privacy-safe service rendering in the existing hybrid storefront
- No duplicate Pandit, eligibility, booking, payment, review, or chat systems

## Non-goals for this slice

- Packages and add-ons
- Marketplace payment accounts, commission hierarchy, refunds, or settlement
- Recurring availability, slot holds, or Google Calendar
- Universal visitor/customer/Pandit chat
- Gallery storage and moderation
- Google Business connection
- Earnings and analytics dashboards

## Existing contracts to preserve

- `pandits` remains canonical for identity, State/City, verification, location,
  experience, languages, and leave status.
- `isPanditPubliclyEligible` and `getPubliclyEligiblePanditBySlug` remain the
  public access gates.
- Existing `/p/:slug`, `/pandit/:id`, QR, PDF, referral, booking, and Admin
  routes remain compatible.
- Existing `panditStorefronts` remains the presentation record.
- Physical `products` remain separate from puja services.
- `panditAuthMiddleware`, `adminAuthMiddleware`, and `auditAdmin` remain the
  authorization/audit boundaries.

## Work breakdown

### 1. Add the catalogue and store-status data model

Files:

- `shared/schema.ts`
- `server/storage.ts`
- `migrations/`

Add:

- `master_services`
  - stable name, slug, category, description, service type
  - supported modes and online/physical flags
  - search metadata
  - active state and timestamps
- `pandit_services`
  - Pandit and master-service references
  - price, duration, mode
  - safe description, preparation, inclusions
  - service areas and availability text/configuration
  - active/display state and timestamps
- `panditStorefronts.status`
  - `draft`, `pending_review`, `published`, `suspended`
  - compatibility mapping from current `isPublished`

Use database foreign keys and indexes for ownership and lookup. Keep the
existing `featuredPujas` field during migration; do not silently cross-map
ambiguous legacy names.

### 2. Add storage interfaces and validation

Files:

- `server/storage.ts`
- `server/catalog-validation.ts`
- `server/pandit-public-access.ts`

Add storage methods for:

- active master-service listing and lookup
- Pandit-service listing, lookup, create, update, deactivate
- store status update
- idempotent store creation/reactivation

Add Zod schemas that enforce:

- active master-service selection
- authenticated ownership
- bounded integer price and duration
- supported mode
- bounded safe text fields
- bounded service areas
- no raw HTML

Use explicit public DTOs for master services and Pandit services. Public DTOs
must not include contact, commercial membership, moderation, credentials, or
internal audit fields.

### 3. Make store creation idempotent and status-aware

Files:

- `server/pandit-storefront.ts`
- `server/routes.ts`
- `server/pandit-public-access.ts`
- existing Pandit approval/verification transition in `server/routes.ts`

Implement `ensurePanditStorefront(panditId)` using the existing unique
`panditId` constraint. Call it:

- after a Pandit becomes approved/verified
- from the existing Pandit storefront management read path
- from the Admin discovery-health repair path if one exists

Do not publish an ineligible Pandit. Public storefront reads require both:

- shared Pandit public eligibility
- published store status

Existing published rows must continue to render while status compatibility is
introduced.

### 4. Add Pandit service-management APIs

Files:

- `server/pandit-storefront.ts` or a focused `server/pandit-services.ts`
- `server/storage.ts`
- `server/pandit-portal.ts` only if route registration needs a shared helper

Add authenticated routes following existing conventions:

- list the Pandit's services
- list active master services available for selection
- create a service
- update a service
- deactivate a service
- submit the store for review

Every mutation must:

- use the authenticated Pandit ID, never a submitted owner ID
- confirm the master service is active
- validate all mutable fields server-side
- write an audit event for Admin mutations
- return DTOs rather than raw rows

### 5. Add Admin master-service and store review controls

Files:

- `server/routes.ts` or a focused Admin route module
- `client/src/pages/admin-tabs/`
- `client/src/pages/admin.tsx` only for tab registration

Extend existing Admin areas rather than creating a duplicate control centre:

- master-service list/create/update/activate/deactivate
- store review status actions
- Pandit-service moderation or disable action
- missing-store health/repair action

Respect the existing Admin role model and audit all publication and override
actions.

### 6. Render approved services in the hybrid storefront

Files:

- `server/pandit-storefront.ts`
- `client/src/pages/pandit-storefront.tsx`
- focused storefront components under `client/src/components/`

Expand the public storefront read model with:

- approved active services
- service name from the master catalogue
- Pandit-configured price, duration, mode, preparation, and inclusions
- secure booking handoff using service ID

Keep the selected visual order:

1. identity and trust
2. primary booking/chat actions
3. first approved services
4. progressive detail sections

Do not display contact numbers unless a later explicit contact-policy design
and public opt-in flags are implemented.

### 7. Connect booking handoff without creating checkout

Files:

- `client/src/pages/puja-booking.tsx`
- `server/routes.ts`
- `server/pandit-public-access.ts`

Accept a validated Pandit-service reference at the booking entry point, but keep
the existing booking engine and customer-session identity. The server must
re-read service and Pandit eligibility before creating a booking. Do not trust
frontend prices, service names, or owner IDs.

Historical snapshot and marketplace ledger work remains deferred to the
booking/accounting slice.

## Migration and rollout order

1. Add tables and nullable/compatible store-status field.
2. Add storage methods and validation with unit tests.
3. Add idempotent store creation and repair.
4. Add Pandit management APIs.
5. Add Admin catalogue/review controls.
6. Add public service DTO and storefront rendering.
7. Add booking handoff by service ID.
8. Run migration, build, workflow restart, API smoke checks, and browser tests.

No destructive migration or removal of existing storefront fields is allowed.

## Test plan

### Unit

- active and inactive master-service selection
- price, duration, mode, and text validation
- Pandit ownership enforcement
- store-status transition rules
- idempotent store creation
- public service DTO redaction

### API

- unauthenticated management requests are rejected
- Pandit A cannot read or mutate Pandit B's services
- inactive master services cannot be selected
- draft/suspended stores do not render publicly
- ineligible Pandits remain hidden even when store status is published
- public services contain no private or commercial fields
- existing storefront, QR, PDF, referral, and booking paths remain compatible

### Browser

- Pandit can add, edit, deactivate, and submit a service
- Admin can manage master services and review store status
- eligible published storefront shows real service data
- mobile hybrid layout remains usable
- keyboard focus and accessible labels work

## Release gates

- focused tests pass
- `npm run build` passes
- workflow restarts cleanly
- `git diff --check` passes
- no new server or browser errors
- public privacy/cache smoke checks pass
- migration is applied before dependent routes are enabled
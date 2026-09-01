# Pandit Personal Website and Service Storefront

**Date:** 2026-09-01
**Status:** Draft for user review
**Scope:** Complete production storefront and Pandit website manager

## Summary

Every eligible Pandit should be able to present a polished, shareable personal
website and service store on Vedic Tatva. The public experience is not a
directory profile with a few extra cards. It is a branded destination that
helps a devotee understand the Pandit, choose a service or package, ask a
private question, and complete a secure booking.

The storefront follows the approved saffron, maroon, ivory, and gold direction
from the reference brief. It uses “Pandit” or “Pt.” terminology. “Acharya” is
not used as the default title.

This design expands the earlier storefront-catalog slice. The earlier
catalog specification remains useful as historical context for the service
identity and authorization contracts, but this document is the source of truth
for the complete public storefront experience.

## Goals

- Give every eligible Pandit a canonical, shareable storefront at
  `/pandit/:slug`.
- Make the public page feel like the Pandit’s own premium website and online
  service store.
- Present real services, packages, reviews, gallery items, and availability
  without fabricating missing data.
- Preserve the current booking, payment, customer authentication, Pandit
  authentication, messaging, notifications, referral, QR, and card flows.
- Keep customer contact details private by default.
- Give Pandits an authenticated editor for the content they own.
- Give Admins moderation and publication controls.
- Make every public page responsive, accessible, indexable when published, and
  safe to share.

## Non-goals

- Replacing the existing booking or payment engine.
- Creating a second customer or Pandit authentication system.
- Exposing direct phone numbers, private email addresses, or personal contact
  data by default.
- Building a general marketplace settlement or commission ledger as part of the
  storefront work.
- Adding a separate standalone website application or CMS.
- Making direct WhatsApp or phone contact the primary conversion path.

## Existing contracts to preserve

- `pandits` remains the canonical source for identity, name, photo, title
  inputs, verification, city/state, languages, experience, and eligibility.
- The shared public eligibility predicate remains mandatory for every public
  storefront, media route, and structured-data response.
- `pandit_storefronts` remains the presentation and branding record.
- `master_services` remains the Admin-owned service identity.
- `pandit_services` remains the Pandit-owned configuration of an approved
  master service.
- Physical `products` remain separate from puja services and may continue to
  appear as curated samagri.
- Existing `/p/:slug`, `/store/:slug`, and numeric `/pandit/:id` links remain
  usable during migration.
- Existing QR, PDF, referral attribution, review, booking, payment, chat, and
  notification integrations remain the underlying systems.
- Existing Pandit and Admin authentication middleware remains the authorization
  boundary.
- The server remains the source of truth for eligibility, service ownership,
  pricing, package contents, availability, and payment totals.

## URL and route architecture

### Canonical route

`/pandit/:slug` is the canonical public storefront route.

The slug is lower-case, URL-safe, unique, and resolved only through the public
eligibility and published-store checks. A published storefront has one
canonical URL regardless of how the visitor arrived.

### Compatibility routes

- `/p/:slug` returns a permanent redirect to `/pandit/:slug` when the slug is
  published and publicly eligible.
- `/store/:slug` returns the same permanent redirect for published storefronts.
- `/pandit/:id` redirects to the canonical slug when the Pandit is published
  and eligible. If no public storefront exists, the existing legacy behavior is
  preserved rather than exposing an unpublished store.
- QR codes, card PDFs, referral links, and share actions encode the canonical
  `/pandit/:slug` URL.

The client route map and server redirect handlers must be updated together.
There must not be two independently rendered public storefront components.

## Public storefront experience

The page is composed of reusable sections, each rendered from the public
storefront DTO. Sections with no publishable content are omitted; empty states
must not contain invented copy that implies a service, review, gallery, or
availability feature exists.

### 1. Welcome bar

A thin top bar establishes that the page is an official Vedic Tatva
storefront. It may include a small trust statement and a share action. It
remains visually quiet so the Pandit identity is primary.

### 2. Branded header

The header contains:

- Vedic Tatva mark
- Pandit display name using the configured “Pandit” or “Pt.” title
- location when public
- compact desktop navigation to Services, Packages, About, Reviews, and
  Gallery when those sections exist
- share/QR action
- mobile menu with keyboard focus management

The header must not reveal private email, phone, membership, moderation,
credential, or internal tier fields.

### 3. Premium hero

The hero uses the storefront banner when available and a controlled ivory/
saffron fallback when it is not. It contains:

- Pandit photo or accessible initials fallback
- display name and selected public title
- verified badge only when the canonical Pandit record is verified
- tagline when configured
- city/state and languages where public
- experience and rating summary when values exist
- primary `Book a Puja` action
- secondary `Chat with Pandit` action
- optional `Call` action only if a later contact-policy flag explicitly
  authorizes it

The hero must not claim “available now,” “fast response,” or similar operational
states without a server-provided signal.

### 4. Trust strip

A concise strip communicates platform safeguards such as verified profile,
secure in-app booking, private chat, and transparent pricing. Trust statements
must describe actual platform behavior and must not imply certifications or
guarantees not represented in data.

### 5. Service catalogue

Services are grouped by their approved master-service category. Each card
shows:

- service name and category
- short Pandit-authored description
- mode: online, in-person, or hybrid
- duration
- server-provided starting price
- preparation guidance or inclusions when available
- service area where applicable
- `Book this service` action

Category tabs or filters are keyboard accessible and work without horizontal
overflow on mobile. The detail interaction may be a modal, drawer, or inline
expansion, but it must preserve deep-linkable booking context.

The browser sends a service identifier to the existing booking flow. It never
submits a trusted price or service name as the source of truth.

### 6. Puja packages

Packages are optional, Pandit-owned collections of the Pandit’s active services.
Each package card shows:

- package name
- short description
- included services
- duration or combined duration when defined
- current price
- compare-at price and savings only when valid
- booking action

Packages cannot reference inactive, unknown, or another Pandit’s services.
Package totals are recomputed on the server. If a package is edited after a
booking, existing bookings retain their historical booking data.

### 7. Custom-puja request

When enabled, the page offers a custom request entry point that opens private
in-app chat. The CTA must explain that final service scope and price are
confirmed inside Vedic Tatva. It must not create a fake service or bypass the
existing booking/payment flow.

### 8. Reviews

Reviews use the existing published-review data and show:

- aggregate rating and count when available
- reviewer display name according to the existing privacy rules
- rating
- comment
- service label when safe and available

Private reviewer contact information and moderation fields never reach the
browser.

### 9. Gallery

Gallery items are Pandit-owned, moderated, and publishable individually. Each
item has:

- image or approved video type
- validated storage URL
- alt text
- optional caption
- display order
- published state

The public page uses a responsive masonry-like or grid presentation with a
lightbox that supports Escape, previous/next controls, focus management, and
reduced motion. Upload validation and moderation happen server-side; arbitrary
remote URLs are not accepted as gallery media.

### 10. About

The About section combines the Pandit’s storefront biography with canonical
identity facts such as languages, experience, location, education, and
specialization when present. It does not duplicate sensitive profile fields or
show raw database content.

### 11. Availability

Availability is rendered only from explicit Pandit availability rules or
server-provided booking slots. It shows:

- currently supported booking modes
- available days/time windows or the next available dates
- timezone label
- a clear fallback when the Pandit has not configured availability

The page never promises a slot that the booking server has not revalidated.
Slot selection hands off to the existing booking flow, which must re-read
eligibility, service, and availability before creating a booking.

### 12. Samagri and share tools

Curated samagri remains an optional supporting section, using existing product
and referral behavior. QR, copy-link, and share actions use the canonical URL
and retain referral attribution without putting private data into query
strings.

### 13. Footer and mobile actions

The footer uses the maroon brand treatment and links to relevant platform
policies and the main Vedic Tatva site.

On mobile, a sticky bottom action bar provides `Chat` and `Book` buttons. It
must account for safe-area insets, not cover form controls, and remain usable
with keyboard or screen-reader navigation.

## Data model

### Existing records

Continue using:

- `pandits`
- `pandit_storefronts`
- `master_services`
- `pandit_services`
- published Pandit reviews
- existing products and referral records

The storefront record remains the source for bio, tagline, banner, social
preferences, featured content, and publication state. Canonical identity fields
are read through the Pandit relation rather than copied into the storefront.

### Packages

Add or complete a Pandit-owned package model with:

- identity, Pandit owner, name, slug, description
- current price and optional compare-at price
- active/published state and display order
- timestamps

Add package items with:

- package reference
- Pandit-service reference
- display order

Database constraints and server validation must ensure package items belong to
the same Pandit as the package.

### Gallery

Add or complete a gallery-item model with:

- Pandit owner
- media kind
- validated storage key/URL
- alt text and optional caption
- display order
- moderation/publication state
- timestamps

The model must support soft removal and must not require deleting the original
file during ordinary unpublish operations.

### Availability

Add or complete recurring availability rules with:

- Pandit owner
- weekday
- start and end minutes
- IANA timezone
- booking mode
- active state
- optional effective date range

Existing simple availability fields remain compatible during migration. The
booking service may continue to be the authority for bookable slots; this
model supplies the Pandit’s configured recurring windows.

## API design

### Public read model

`GET /api/storefront/:slug` returns one explicit DTO containing:

- safe Pandit identity and public profile values
- storefront branding and published content
- active public services
- published packages and package items
- published gallery items
- published reviews
- availability summary or server-generated bookable windows
- curated products
- canonical URL and share metadata

The DTO is assembled through allowlisted mappers. Raw ORM rows are never
serialized. Public responses remain eligibility-gated and use conservative
cache behavior while publication and eligibility can change.

### Pandit management

Authenticated Pandit endpoints manage only the authenticated Pandit’s records:

- storefront branding and draft content
- services and categories
- packages and package items
- gallery uploads, ordering, captions, and publication requests
- availability rules
- preview, submit-for-review, and publish-request state
- QR/share tools

Every mutation derives the owner from the authenticated token. Submitted
Pandit IDs, public emails, phone numbers, or slugs cannot select another owner.
All request bodies use bounded schemas and safe text validation.

### Admin management

Existing Admin surfaces gain:

- storefront review and publish/suspend actions
- package/gallery moderation
- master-service management
- Pandit-service disable action
- missing-store repair
- audit history and reason capture where supported

Admin routes keep the existing role restrictions, CSRF protections, and audit
trail. No new header-only bypass is introduced.

## Booking, payment, chat, and notification behavior

The storefront is a new presentation layer over existing systems:

1. Visitor chooses a service or package.
2. The client passes only a validated identifier and storefront context.
3. The booking server re-reads Pandit eligibility, ownership, service/package
   state, current price, mode, and availability.
4. The existing customer authentication and payment flow continues.
5. The resulting booking creates or updates the existing private conversation
   and notification path.
6. The confirmation links back to the canonical storefront.

Price, discounts, bundle savings, paid tips, and final totals are always
recomputed server-side. Existing client/server discount parity rules remain in
force. Failed payment, unavailable slot, suspended store, or changed service
states produce explicit user-facing errors and do not create partial bookings.

## Privacy and security

- Public reads require published storefront status and shared Pandit
  eligibility.
- Public DTOs exclude phone, email, exact coordinates, membership, tier,
  moderation, credentials, internal referral, and private reviewer fields.
- Chat remains authenticated and private; contact-detail filtering continues.
- Gallery media is ownership-checked, type-validated, size-limited, and
  moderated before publication.
- External links are restricted to approved protocols and validated destinations.
- Package and availability mutations enforce owner scope server-side.
- Booking and payment endpoints do not trust browser prices or owner IDs.
- Public AI, referral, dispatch, and order routes remain outside the storefront
  UI unless their existing authentication and authorization contracts pass
  review.
- Logging avoids request bodies and response payloads that may contain PII,
  payment data, or message content.

## SEO and structured data

Published storefronts receive:

- unique title and description from safe Pandit/storefront fields
- canonical `/pandit/:slug`
- Open Graph and X/Twitter metadata
- per-Pandit share image using the safe media pipeline
- BreadcrumbList
- ProfilePage/Person or LocalBusiness only when the available facts qualify
- Service and Offer nodes for published services/packages with valid prices
- Review/AggregateRating nodes only from published review data

There must be one canonical Organization node for Vedic Tatva. The page must
not duplicate organization schema already emitted globally.

Draft, pending-review, suspended, and ineligible storefronts are noindex and
are excluded from public sitemap output. Unknown slugs return a real not-found
state rather than a successful empty storefront.

## Responsive and accessibility requirements

Verify at minimum:

- 375px, 390px, and 414px mobile widths
- 768px tablet width
- 1024px and 1440px desktop widths

The implementation must provide:

- no horizontal overflow
- visible keyboard focus states
- semantic headings and landmarks
- accessible labels for icon-only controls
- sufficient color contrast across maroon, saffron, ivory, and gold
- dialog/drawer focus trapping and Escape behavior
- reduced-motion support
- lazy-loaded gallery and below-the-fold media
- `data-lenis-prevent` and `min-h-0` for any inner scrolling pane
- sticky mobile actions that respect safe-area insets

## Rollout and migration

1. Reconcile route handling and canonical URL generation.
2. Extend the public storefront DTO without removing existing fields.
3. Add compatible package, gallery, and availability migrations.
4. Add server storage, validation, ownership, and moderation boundaries.
5. Build the public storefront shell and data-driven sections.
6. Connect service/package booking handoff without creating checkout.
7. Upgrade the Pandit editor and Admin review controls.
8. Add SEO, QR, share, and media behavior.
9. Run focused tests, migration checks, production build, workflow restart, and
   responsive browser verification.
10. Keep legacy routes and the current booking path available until the
    canonical route passes smoke checks.

No destructive migration, automatic data deletion, or unconditional schema
push on container restart is permitted. Existing `featuredPujas` values remain
available as legacy display data until explicitly mapped to service records.

## Acceptance criteria

### Public storefront

- An eligible published Pandit renders at `/pandit/:slug`.
- `/p/:slug`, `/store/:slug`, and eligible numeric links consolidate to the
  canonical route.
- Published services use real data and open the existing booking flow.
- Packages, reviews, gallery, and availability render only when their data is
  published and valid.
- Chat opens the existing private flow and does not expose contact details.
- QR and sharing encode the canonical storefront URL.
- Sticky mobile Chat/Book actions work without covering content.
- Unpublished, suspended, or ineligible stores do not render publicly.

### Pandit editor

- A Pandit can edit only their own storefront, services, packages, gallery, and
  availability.
- Invalid prices, modes, media, URLs, package references, and time windows are
  rejected server-side.
- Draft and publish-review states are visible and recoverable.
- Saved, loading, validation-error, and server-error states are explicit.

### Admin operations

- Admin can review publication state, manage master services, moderate content,
  disable an offering, and repair a missing storefront.
- Mutating actions are role-protected and auditable.

### Quality gates

- Focused unit and API tests pass.
- `git diff --check` passes.
- Production build passes.
- Workflow restarts cleanly and `/api/health` succeeds after startup.
- Browser checks cover public storefront, booking handoff, chat entry,
  Pandit-owned editing, mobile layout, keyboard navigation, and not-found/
  unpublished states.
- No new server or browser console errors are introduced.
- Public DTO and SEO smoke checks confirm privacy and canonical URL behavior.

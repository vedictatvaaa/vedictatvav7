# Pandit Personal Storefront Implementation Plan

**Design:** `docs/superpowers/specs/2026-09-01-pandit-personal-storefront-design.md`
**Status:** In progress

## Goal

Ship the complete personalized Pandit website and online service storefront at
`/pandit/:slug` without replacing existing identity, eligibility, booking,
payment, review, messaging, referral, QR, or card systems.

## Delivery sequence

### 1. Canonical route and compatibility

Files:

- `client/src/App.tsx`
- `server/pandit-storefront.ts`
- `server/routes.ts`
- `client/src/pages/pandit-storefront.tsx`

Work:

- Register `/pandit/:slug` as the public storefront route before the legacy
  numeric route.
- Redirect published `/p/:slug`, `/store/:slug`, and numeric `/pandit/:id`
  requests to the canonical slug.
- Preserve existing legacy behavior for unpublished or unresolved records.
- Update QR, PDF, Open Graph, sitemap, canonical, public URL, and share-link
  generation to use `/pandit/:slug`.
- Keep referral attribution intact across redirects.

### 2. Additive storefront data model

Files:

- `shared/schema.ts`
- `migrations/`
- `server/storage.ts`

Work:

- Add Pandit-owned packages and package items.
- Add moderated gallery items.
- Add recurring availability rules with IANA timezone and booking mode.
- Add foreign keys, owner lookup indexes, active/public indexes, and uniqueness
  constraints.
- Preserve `featuredPujas` and existing simple availability fields.
- Use additive migrations only; do not delete or silently remap legacy data.

### 3. Validation, ownership, and public DTO

Files:

- `server/catalog-validation.ts`
- `server/pandit-public-access.ts`
- `server/pandit-storefront.ts`
- `server/storage.ts`

Work:

- Add bounded package, gallery, availability, and storefront write schemas.
- Derive Pandit ownership from the authenticated token.
- Enforce same-owner active-service membership for package items.
- Reject arbitrary remote gallery URLs; accept only validated managed media.
- Expand the storefront DTO with allowlisted branding, services, packages,
  gallery, reviews, availability, products, and canonical share metadata.
- Keep all public and media routes eligibility- and publication-gated.

### 4. Secure booking and chat handoff

Files:

- `client/src/pages/puja-booking.tsx`
- `server/routes.ts`
- `server/pandit-portal.ts`
- `client/src/pages/pandit-storefront.tsx`

Work:

- Pass service/package identifiers and storefront context from the browser.
- Re-resolve owner, eligibility, active state, mode, price, package total, and
  availability on the server.
- Snapshot booking details so later catalogue edits do not alter history.
- Preserve current payment, referral, notification, and confirmation flows.
- Replace caller-supplied-email chat authorization with customer-session
  ownership before exposing the storefront Chat CTA.
- Continue contact-detail filtering and Pandit eligibility checks.

### 5. Public storefront implementation

Files:

- `client/src/pages/pandit-storefront.tsx`
- new focused components under `client/src/components/pandit/storefront/`
- `client/src/index.css` only for shared storefront tokens/utilities

Work:

- Build the premium welcome bar, header, hero, trust strip, service catalogue,
  package area, custom-request CTA, reviews, gallery, About, availability,
  samagri/share tools, maroon footer, and sticky mobile actions.
- Render only real published data.
- Use `Pandit` or `Pt.` terminology and never default to `Acharya`.
- Add accessible category controls, dialogs/lightbox, focus states, reduced
  motion, responsive media, and Lenis-safe inner scroll panes.
- Keep direct phone/WhatsApp actions hidden unless a validated public-contact
  policy explicitly allows them.

### 6. Pandit website manager

Files:

- `client/src/components/pandit/PanditStorefrontPanel.tsx`
- `server/pandit-storefront.ts`
- `server/storage.ts`

Work:

- Keep the existing storefront overview, services, QR/card, referrals, and
  product curation.
- Add packages, gallery, availability, branding, preview, and publication
  state management.
- Show loading, saved, validation, empty, and server-error states.
- Prevent cross-owner reads and writes at both API and storage boundaries.

### 7. Admin moderation

Files:

- `server/routes.ts`
- existing Pandit/Admin management components

Work:

- Extend current moderation controls for package and gallery publication.
- Preserve master-service management and storefront status controls.
- Require existing Admin middleware, CSRF rules, roles, and audit events.
- Do not introduce header-only or unauthenticated mutation paths.

### 8. SEO and crawler behavior

Files:

- `client/src/pages/pandit-storefront.tsx`
- `client/src/components/PageSeo.tsx`
- existing SEO schema helpers
- `server/routes.ts`

Work:

- Emit the canonical URL, unique metadata, safe share image, breadcrumbs, and
  qualified Person/ProfilePage, Service, Offer, Review, and rating data.
- Reuse the canonical Organization node instead of duplicating it.
- Exclude draft, suspended, and ineligible stores from sitemap output.
- Return a real not-found state for unknown slugs.

### 9. Verification and rollout

Checks:

- Migration rehearsal and rollback review.
- Focused validation, ownership, DTO privacy, route, package-price, and
  availability tests.
- Existing booking, chat, samagri, call, referral, QR, PDF, review, and
  notification regression coverage.
- `git diff --check`.
- Production build.
- Workflow restart and `/api/health`.
- Browser verification at 375, 390, 414, 768, 1024, and 1440 pixels.
- Keyboard, focus, dialog, lightbox, sticky action, unavailable-store, and
  not-found behavior.
- Browser and server logs contain no new errors.

## Integration constraints

- Do not create parallel Pandit, eligibility, booking, payment, chat, review,
  or referral systems.
- Do not trust client prices, owner IDs, emails, or availability.
- Do not expose private contact, membership, moderation, or credential fields.
- Do not remove legacy storefront data until the canonical route is verified.
- Do not run unconditional schema push during container startup.
- Any client-visible discount or package saving must match the server
  recomputation.

# Pandit SEO and Location-Service Network Implementation Plan

**Design:** `docs/superpowers/specs/2026-09-01-pandit-seo-location-service-network-design.md`  
**Status:** In progress

## Goal

Ship a privacy-safe, data-backed organic discovery network that connects
published Pandit storefronts, canonical locations, active canonical services,
genuine reviews, and booking without creating thin doorway pages or parallel
marketplace rules.

## Delivery sequence

### 1. Shared graph and quality decisions

Files:

- new focused modules under `server/pandit-seo-network/`
- `server/pandit-public-access.ts`
- `server/pandit-public-eligibility.ts`
- `server/pandit-location-reach.ts`
- `server/storage.ts`
- focused server tests

Work:

- Define named profile-completeness, city-supply, and city-service-supply
  constants.
- Project public Pandit, canonical City/State, master-service, active offering,
  public review, and booking facts through existing allowlisted DTOs.
- Return explicit indexability outcomes and reasons.
- Keep database/resolver failures distinct from empty or ineligible results.
- Add deterministic recommendation reasons and canonical entity identifiers.
- Test duplicate city names, eligibility, publication, canonical-service
  matching, privacy allowlists, and the 3/2 threshold boundaries.

Gate:

- No page, sitemap, or schema change ships until shared graph decisions pass
  focused tests.

### 2. Server routes and public projection APIs

Files:

- `server/routes.ts`
- `server/pandit-storefront.ts`
- `server/seo-route-integrity.ts`
- graph modules from milestone 1
- focused route tests

Work:

- Expose read-only public projections required by profile, city, and
  city-service pages.
- Reuse canonical routes and authoritative legacy redirects.
- Preserve true 404 behavior for missing/unpublished authoritative entities.
- Return useful below-threshold pages with HTTP 200 and explicit noindex state.
- Add short-lived cache keys and targeted invalidation after relevant writes.
- Keep all mutations and private records behind existing authentication and
  ownership boundaries.

Gate:

- Route tests prove errors do not become false 404/noindex responses.

### 3. Pandit storefront SEO and conversion upgrade

Files:

- `client/src/pages/pandit-storefront.tsx`
- focused components under `client/src/components/pandit/storefront/`
- `client/src/components/PageSeo.tsx`
- `client/src/lib/seo-schemas.ts`
- `server/seo-ssr.ts`
- relevant storefront/server tests

Work:

- Consume the shared profile projection.
- Add factual answer block, verification explanation, canonical location,
  public experience/languages, active services, transparent price/duration/
  mode details, genuine reviews, and real availability.
- Add relevant city-service and related-Pandit links with explicit graph
  reasons.
- Carry the selected Pandit/service/location context into existing booking.
- Emit one stable Person-centered JSON-LD graph with visible Service, Offer,
  Review, AggregateRating, Organization, and Breadcrumb entities.
- Enforce profile completeness for indexability and sitemap eligibility.
- Preserve storefront branding, catalogue, gallery, packages, referral,
  messaging, QR, PDF, and payment behavior.

Gate:

- SSR and hydrated title, canonical, robots, and JSON-LD remain identical.

### 4. City hub upgrade

Files:

- `client/src/pages/pandit-city-landing.tsx`
- focused city-network components
- server graph/API modules
- `server/seo-ssr.ts`
- relevant tests

Work:

- Render factual local availability, qualifying provider count, filters,
  canonical services, languages, modes, genuine eligible reviews, and trust
  content.
- Link only qualifying city-service pages and relevant published Pandits.
- Resolve duplicate city names by canonical State/City identity.
- Replace delayed client-only invalid-location navigation with HTTP-level
  canonical redirect or 404 handling.
- Emit CollectionPage, visible ItemList, and Breadcrumb JSON-LD.
- Apply the minimum-three-provider indexability gate.

Gate:

- Two providers are noindex and absent from sitemaps; three are indexable.

### 5. City-service page upgrade

Files:

- `client/src/pages/pandit-city-puja-landing.tsx`
- focused city-service components
- server graph/API modules
- `server/seo-ssr.ts`
- booking handoff code
- relevant tests

Work:

- Match only stable canonical master-service identities.
- Render factual service availability, qualifying providers, visible price and
  duration ranges, supported modes, canonical inclusions/preparation, and
  genuine service-linked reviews where stored.
- Preload canonical city/service booking context and revalidate it on server.
- Link the parent city, matching Pandits, and related qualifying services.
- Emit Service, visible offers, ItemList, optional visible FAQPage, and
  Breadcrumb JSON-LD.
- Apply the minimum-two-provider indexability gate.
- Never infer procedures, benefits, mantras, outcomes, or spiritual claims
  from a service name.

Gate:

- One provider is noindex and absent from sitemaps; two are indexable.

### 6. Metadata, sitemap, and internal-link parity

Files:

- `server/seo-ssr.ts`
- `server/routes.ts`
- `shared/seo-metadata.ts`
- `shared/spa-route-patterns.ts`
- internal recommendation components
- crawl/SEO tests

Work:

- Make SSR metadata, hydrated metadata, robots, canonical, schema, sitemap
  inclusion, and indexable recommendations consume the same decision.
- Add profile, city, and city-service URLs to the correct segmented sitemaps
  only when indexable.
- Remove below-threshold URLs immediately after reevaluation.
- Add checks for sitemap URL status/indexability, broken links, canonical
  chains, conflicting canonicals, and orphaned indexable pages.
- Preserve Task 15's metadata ownership and the crawl-integrity 404 contract.

Gate:

- Every sampled sitemap URL returns an indexable 200 with matching canonical;
  no noindex URL appears in a sitemap.

### 7. Editorial governance and SEO command center

Files:

- `shared/schema.ts`
- additive migration under `migrations/`
- `server/storage.ts`
- SEO admin server routes
- `client/src/pages/admin-tabs/SeoManagerTab.tsx`
- focused components under `client/src/components/admin-seo/`
- admin tests

Work:

- Add additive editorial records for city and city-service introductions,
  reviewed FAQs, and optional metadata overrides.
- Implement draft, reviewed, published, preview, audit identity, and timestamp
  behavior under existing Admin authorization and CSRF rules.
- Add profile/city/city-service coverage matrix with index state and actionable
  blocking reasons.
- Link each data problem to the existing owning admin screen rather than
  creating duplicate eligibility/location/service editors.
- Report invalid service mappings, unresolved locations, missing enhancements,
  orphan pages, sitemap status, and last evaluation time.
- Do not add bulk AI auto-publishing.

Gate:

- Editorial state cannot alter authoritative counts, prices, ratings,
  availability, or provider membership.

### 8. Consent-safe conversion attribution

Files:

- existing analytics helpers and server routes
- profile, city, city-service, and booking entry components
- focused analytics tests

Work:

- Track page family and stable public entity identifiers across organic
  landing, profile/service view, booking start, booking creation, and payment.
- Reuse existing analytics and marketing consent gates.
- Preserve referral attribution and avoid private user/applicant fields.
- Record trustworthy events without creating a new reporting dashboard.

Gate:

- No analytics or attribution write occurs without its required consent.

### 9. Performance, accessibility, and responsive pass

Files:

- changed public components and styles
- image/rendering helpers

Work:

- Keep stable image dimensions, responsive sources, appropriate lazy loading,
  and no new avoidable layout shift.
- Preserve semantic headings, landmarks, labels, keyboard filters, focus
  visibility, accessible loading/empty states, and reduced-motion behavior.
- Keep sticky mobile booking actions non-obscuring.
- Avoid unnecessary client bundles and duplicate page queries.

Gate:

- Changed page families pass keyboard, mobile, desktop, and visual checks.

### 10. Verification and staged rollout

Checks:

- Focused graph, privacy, threshold, projection, route, cache, editorial,
  booking-context, schema, sitemap, and consent tests.
- Existing authentication, storefront, booking, payment, review, messaging,
  referral, QR, PDF, eligibility, SEO, and crawl-integrity regressions.
- `git diff --check`.
- Production build.
- Workflow restart and clean startup logs.
- Browser verification on representative indexable, below-threshold,
  unpublished, and missing pages at mobile and desktop widths.
- SSR/hydrated metadata and schema parity.
- Sitemap and internal-link crawl checks.
- No new browser or backend errors.

Rollout:

- Keep the network behind an Admin-controlled feature flag.
- Validate selected real cities against current authoritative records.
- Enable globally only after acceptance checks pass.
- Do not publish or deploy automatically.

## Integration constraints

- Do not create parallel Pandit, location, service, review, availability,
  booking, payment, metadata, redirect, or sitemap rules.
- Do not trust client-provided prices, owner IDs, service identities,
  locations, review relationships, or availability.
- Do not expose private contact, identity, membership, moderation, or
  credential fields.
- Do not index fabricated, unreviewed, empty, or below-threshold combinations.
- Do not manufacture reviews, ratings, counts, locations, editorial claims, or
  international service coverage.
- Do not replace existing data or run destructive schema operations.
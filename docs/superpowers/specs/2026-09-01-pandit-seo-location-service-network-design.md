# Vedic Tatva Pandit SEO and Location-Service Network

**Date:** 2026-09-01  
**Status:** Approved design  
**Scope:** First knowledge-graph implementation wave after crawl/indexing integrity

## 1. Objective

Build a professional, data-backed organic discovery network that connects published Pandit storefronts, canonical locations, active services, genuine reviews, and booking flows.

The network must:

- turn eligible Pandit storefronts into trustworthy organic landing pages;
- make city and city-service pages useful to people, not thin doorway pages;
- use one authoritative decision for rendering, indexability, sitemaps, schemas, internal links, and booking;
- convert relevant organic traffic into measurable booking starts and completed transactions;
- preserve all existing authentication, payments, bookings, orders, reviews, messaging, referrals, QR, PDF, eligibility, consent, and privacy behavior;
- never fabricate Pandits, reviews, ratings, locations, availability, experience, prices, claims, or demand.

This wave is the first marketplace projection of the long-term Vedic Tatva Knowledge Graph:

`Pandit ↔ City/State ↔ Canonical Service ↔ Review ↔ Availability ↔ Booking`

## 2. Non-goals

This wave does not include:

- rebuilding the Puja Library;
- AI-generated or AI-auto-published content;
- Ask Vedic Tatva recommendations;
- unified cross-entity search;
- international or country-specific SEO;
- the Tirth/Yatra vertical;
- Search Console integration;
- a replacement analytics dashboard;
- broad homepage redesign;
- fabricated editorial introductions or FAQs;
- new parallel URL families where canonical routes already exist.

The graph interfaces must allow these later systems to consume the same public entity relationships without rebuilding the foundation.

## 3. Product principles

### 3.1 Authority before scale

Only pages with real, qualifying marketplace supply may be indexable. A smaller network of useful pages is preferable to thousands of thin combinations.

### 3.2 One truth across SEO and commerce

The same public graph decision must power:

- visible profile and listing data;
- SSR and hydrated metadata;
- structured data;
- sitemap inclusion;
- internal recommendations;
- marketplace filters;
- booking context.

If a Pandit or service cannot be booked through the authoritative marketplace rules, an SEO page must not claim otherwise.

### 3.3 Hybrid content governance

Verified marketplace facts automatically power the factual core. Admin-reviewed editorial content may enhance a page, but AI-written or unreviewed content is never auto-published.

### 3.4 Privacy by allowlist

All graph responses use existing public DTO boundaries. Application contact details, identity documents, private notes, unpublished storefront data, and commercial internals remain private.

## 4. Authoritative sources

The implementation must reuse the existing authoritative systems rather than reproduce their predicates:

- Pandit public eligibility and location resolution;
- storefront publication state;
- canonical State and City records;
- master-service identity and stable service slug;
- active Pandit service configuration;
- public storefront assembly;
- public, eligible, booking-linked reviews;
- booking availability and accepted booking context;
- shared SEO metadata normalization;
- route registry and crawl-integrity middleware;
- existing redirect and sitemap systems;
- existing consent-aware attribution and analytics behavior.

Database/resolver failures must propagate as operational errors. They must not silently become a missing entity, a false 404, or a mass noindex decision.

## 5. Architecture

### 5.1 Public marketplace graph resolver

Create a server-owned resolver layer that projects existing records into privacy-safe graph nodes and edges.

Core projections:

- `PanditProfileProjection`
- `CityHubProjection`
- `CityServiceProjection`
- `IndexabilityDecision`
- `InternalRecommendationSet`
- `SeoEntityGraph`

Each projection must expose:

- canonical identity and URL;
- public visible facts;
- relationship identifiers;
- indexability status and explicit reasons;
- factual aggregate inputs;
- booking context;
- cache metadata.

The resolver is not a second source-of-truth database. It is a deterministic read model over the current authoritative records.

### 5.2 Consumers

The public projection is consumed by:

- Pandit storefront/profile pages;
- canonical city hub pages;
- canonical city-service pages;
- server-rendered SEO metadata and JSON-LD;
- hydrated metadata;
- segmented sitemaps;
- deterministic internal recommendation blocks;
- admin coverage/status reporting;
- privacy-safe funnel attribution.

No consumer may implement its own eligibility or supply-count predicate.

### 5.3 Cache behavior

Short-lived caching is allowed for public projections. Relevant Pandit, service, review, storefront, location, and availability mutations must invalidate or expire affected projections.

Errors must not be cached as successful empty projections. Cached content must not outlive the booking system’s accepted freshness for price or availability claims.

## 6. Canonical page families

### 6.1 Pandit storefront/profile

Reuse the canonical `/pandit/:slug` family and existing legacy redirects.

An indexable profile requires:

- the Pandit passes authoritative public eligibility;
- the storefront passes authoritative publication rules;
- the profile meets the completeness contract in Section 7.2.

An unpublished or authoritative missing profile returns a true branded 404. A published but incomplete profile may remain usable where current product behavior requires it, but is `noindex, follow` and omitted from sitemaps until complete.

### 6.2 City hub

Reuse the existing canonical city discovery route.

An indexable city hub requires at least three qualifying, published Pandits in that canonical city.

The count must use exactly the same qualifying population shown on the page. Duplicate city names must remain scoped by canonical State/City identity.

### 6.3 City-service page

Reuse the existing canonical city + service route.

An indexable city-service page requires at least two qualifying, published Pandits in the canonical city who actively offer the same canonical master service.

Loose text specializations, deprecated aliases, or unmatched free text do not satisfy the service threshold.

## 7. Indexability contract

### 7.1 Outcomes

Every page projection yields one of these explicit outcomes:

- `indexable`
- `noindex_insufficient_supply`
- `noindex_incomplete_profile`
- `noindex_editorial_or_data_warning`
- `not_found`
- `resolver_error`

Only `indexable` pages may enter XML sitemaps or indexable recommendation sets.

`noindex_*` pages return HTTP 200 with `noindex, follow` and a self-referencing canonical when they remain useful to users.

`not_found` pages follow the crawl-integrity contract: true HTTP 404, `noindex, follow`, self canonical, branded metadata, and no entity JSON-LD.

`resolver_error` propagates through the server error path and must not masquerade as another outcome.

### 7.2 Profile completeness

The completeness evaluator must use public, reviewable fields and return individual failure reasons. At minimum, an indexable profile must have:

- canonical public name;
- approved public profile image;
- resolved active City and State;
- reviewed public biography of meaningful length;
- at least one active canonical service;
- at least one supported language;
- valid service mode and booking path;
- published storefront state.

Rating, review count, completed bookings, social links, gallery, and curated products are enhancements, not mandatory completeness fields.

Threshold values and minimum biography length must be named configuration constants covered by tests.

### 7.3 Supply changes

When a city or city-service page drops below its threshold:

- keep the useful route at HTTP 200;
- set `noindex, follow`;
- remove it from the sitemap;
- remove it from indexable internal-recommendation blocks;
- display an honest reduced-supply or empty state;
- never retain stale provider counts, prices, or availability claims.

## 8. Content model

### 8.1 Deterministic factual core

The system may compose visible content only from authoritative public data:

- qualifying Pandit count;
- active canonical services;
- supported languages;
- online/in-person service modes;
- displayed price and duration ranges;
- eligible rating/review aggregates;
- canonical location relationships;
- availability state accepted by the booking system.

Generated sentences must be deterministic templates and must not add spiritual, historical, cultural, geographic, or efficacy claims.

### 8.2 Editorial enhancements

City and city-service pages may contain:

- reviewed introduction;
- reviewed local/service guidance;
- visible FAQs;
- optional search-preview overrides.

Editorial records have:

- draft, reviewed, and published states;
- editor identity and timestamps;
- a public preview using the same page renderer;
- independent unpublishing without breaking the factual page.

Published editorial content must never override canonical supply facts with manually entered counts, prices, availability, ratings, or provider names.

## 9. Page experience

### 9.1 Pandit profile

Above the fold:

- real profile image and public name;
- canonical city/state;
- Verified Pandit badge linked to the verification explanation;
- years of experience only when approved and supported by stored data;
- supported languages and active specializations;
- service modes;
- primary “View services & book” action;
- secondary messaging action only under existing messaging permissions;
- accessible mobile sticky booking action.

Decision content:

- reviewed biography and public credentials;
- active services with price, duration, mode, preparation, and inclusions;
- genuine eligible reviews only;
- real rating/review count;
- completed-booking and response-time claims only if accurately measurable;
- real availability;
- cancellation, payment, and platform-assurance links.

Discovery:

- hierarchical breadcrumbs;
- offered canonical services in the Pandit’s city;
- related Pandits chosen by location/service relevance;
- products/articles only through explicit existing curation.

### 9.2 City hub

The city hub contains:

1. a concise factual availability answer;
2. the current qualifying published-Pandit count;
3. filterable qualifying Pandits;
4. canonical services genuinely available in the city;
5. derived languages and service modes;
6. verification/trust explanation;
7. genuine eligible local reviews where supported;
8. indexable city-service links;
9. related locations based only on canonical State membership or coordinates.

The page must remain useful without editorial prose.

### 9.3 City-service page

The city-service page contains:

1. exact canonical service + city H1;
2. direct factual availability answer;
3. qualifying Pandits who actively offer the service;
4. derived visible price, duration, and mode ranges;
5. inclusions/preparation from canonical service data;
6. service-specific genuine reviews only where the relationship is stored;
7. booking actions preloaded with canonical city/service context;
8. related qualifying services and the parent city hub;
9. visible reviewed FAQs where available.

No service procedure, benefit, mantra, result, or spiritual claim is inferred from the marketplace service name.

## 10. Internal recommendation rules

All first-wave links are deterministic:

- Pandit → active offered services → qualifying city-service pages;
- City → qualifying services → qualifying Pandits;
- City-service → matching Pandits → parent city → related qualifying services;
- Review → its stored Pandit/service/location relationship;
- Product/article → only an explicit curated relationship.

Recommendation blocks must:

- exclude non-indexable target pages from SEO-prominent link sets;
- avoid random or popularity-only cross-linking;
- avoid duplicate links already present in primary navigation;
- expose a testable reason for each recommended relationship.

## 11. Metadata and AEO

Every indexable page must receive:

- deterministic title and description through the existing metadata system;
- self-referencing canonical;
- exactly one visible H1;
- concise factual answer block near the top;
- question-based supporting headings only where content exists;
- server-rendered index directives and schema;
- hydrated metadata parity;
- canonical breadcrumbs.

The implementation must not reintroduce or compete with the completed title/search-preview consistency work.

No international hreflang or country targeting is added in this wave.

## 12. Structured-data policy

Use one server-generated JSON-LD graph with stable `@id` references. Hydration must not duplicate or contradict it.

### 12.1 Pandit profile

- `Person` for the Pandit;
- publicly visible professional attributes only;
- `knowsLanguage` and service area where visible;
- visible service offers;
- `AggregateRating` and `Review` only from genuine eligible reviews;
- platform `Organization` as marketplace/verification context;
- `BreadcrumbList`.

Do not claim an employment relationship. Do not use a physical `LocalBusiness` address for an individual unless the public data and business model support that exact claim.

### 12.2 City hub

- `CollectionPage`;
- `ItemList` matching visible Pandits;
- `BreadcrumbList`.

Do not aggregate unrelated Pandit ratings into a city business rating.

### 12.3 City-service page

- `Service` with canonical service identity and geographic area;
- visible active offers or `OfferCatalog`;
- `ItemList` matching visible providers;
- `FAQPage` only for visible published FAQs;
- `BreadcrumbList`.

Schema prices, availability, ratings, counts, and areas must equal visible facts from the same projection.

## 13. Admin command center

Extend the existing SEO administration surface.

### 13.1 Coverage matrix

Display:

- profile eligibility, publication, completeness, index state, and reason;
- city qualifying-Pandit and canonical-service counts;
- city-service qualifying-provider count;
- missing editorial enhancements;
- invalid service mappings;
- unresolved locations;
- orphaned indexable pages;
- sitemap state and last evaluation time.

### 13.2 Actionability

Each blocking status links to the existing admin surface that owns the underlying record. The SEO view must not create a second editor for Pandit eligibility, location, service configuration, or storefront publication.

### 13.3 Editorial workflow

Provide:

- draft/review/publish controls;
- rendered preview;
- validation of H1, metadata, canonical, visible FAQ/schema parity, and unsupported claims;
- safe unpublishing;
- no bulk AI auto-publish.

## 14. Conversion attribution

Under existing consent rules, measure:

`organic landing → profile/service view → booking start → booking created → payment completed`

Events must use stable entity identifiers and page family, not private user or applicant fields.

This wave records trustworthy attribution. A new reporting dashboard is deferred.

## 15. Redirects and canonical changes

Canonical slug changes require:

- a permanent redirect from the old URL;
- immediate removal of the old URL from sitemaps;
- internal-link updates to the new canonical;
- redirect-chain and loop prevention.

Invalid or retired location aliases must be handled at the HTTP layer, not by delayed client navigation.

## 16. Accessibility and responsive behavior

All new and upgraded page blocks must provide:

- semantic headings and landmarks;
- keyboard-operable filters and dialogs;
- visible focus states;
- labeled inputs and controls;
- accessible loading and empty states;
- adequate contrast;
- non-obscuring mobile sticky actions;
- responsive layouts at mobile, tablet, and desktop widths;
- stable image dimensions to reduce layout shift.

## 17. Testing and acceptance criteria

### 17.1 Unit coverage

Test:

- public eligibility/publication reuse;
- profile completeness reasons;
- city threshold at 2/3 providers;
- city-service threshold at 1/2 providers;
- canonical service matching;
- State/City scoping for duplicate city names;
- genuine-review/rating inclusion;
- public DTO privacy allowlists;
- indexability/sitemap parity;
- metadata and schema determinism;
- recommendation reasons;
- canonical slug and redirect decisions.

### 17.2 Integration coverage

Test:

- projections against realistic fixtures;
- correct city/service context reaches booking;
- editorial draft/review/publish behavior;
- relevant cache invalidation;
- supply/publication changes update all consumers;
- resolver failures never become false 404/noindex outcomes.

### 17.3 Browser coverage

Verify:

- SSR/hydrated title, robots, canonical, and schema parity;
- mobile and desktop profile-to-booking flows;
- city filters and empty states;
- indexable and below-threshold variants;
- branded authoritative 404s contain no entity JSON-LD;
- visible price/review facts match schema;
- keyboard navigation and focus behavior;
- no new runtime or backend errors.

### 17.4 SEO regression checks

Automate checks that:

- route registry remains synchronized;
- all sitemap URLs return indexable HTTP 200 pages;
- noindex pages are absent from sitemaps;
- internal indexable links do not target 404/noindex pages;
- canonical URLs do not chain or conflict;
- no indexable page is orphaned;
- title, H1, canonical, robots, and structured data have one owner.

## 18. Rollout

1. Implement graph projections, named quality constants, and tests.
2. Upgrade Pandit profile metadata, trust, services, and recommendations.
3. Upgrade city hubs.
4. Upgrade city-service pages.
5. connect sitemaps and internal recommendations to the shared decision.
6. Add admin coverage and editorial governance.
7. Enable behind an admin-controlled feature flag.
8. Validate selected real cities with live authoritative data.
9. Enable globally only after automated and browser acceptance checks pass.
10. Monitor organic-to-booking attribution under existing consent rules.

Publishing or production deployment is not automatic.

## 19. Definition of done

The first wave is complete when:

- every public page family consumes the shared graph projection;
- the approved 3-Pandit city and 2-Pandit city-service thresholds are enforced consistently;
- profile completeness has explicit, actionable reasons;
- index directives, canonicals, sitemaps, schemas, and internal links agree;
- no private data crosses public DTO boundaries;
- no generated claim exceeds authoritative visible data;
- booking context remains correct;
- admin users can understand and repair every blocked page;
- all unit, integration, browser, SEO, accessibility, build, and regression checks pass;
- no existing marketplace or operational capability regresses.
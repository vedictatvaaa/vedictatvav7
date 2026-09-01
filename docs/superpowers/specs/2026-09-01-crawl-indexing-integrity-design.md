# Vedic Tatva Crawl and Indexing Integrity Design

**Status:** Approved design; pending written-spec review  
**Date:** 2026-09-01  
**Scope:** First implementation increment from the Vedic Tatva Master SEO + Website Architecture + UX Upgrade brief

## 1. Objective

Make crawler-visible URL behavior trustworthy and internally consistent without rebuilding the existing SEO system or changing commerce, booking, authentication, Pandit, or database behavior.

The increment will ensure that:

- valid public entities return HTTP 200 and remain indexable;
- missing, private, unpublished, or malformed public entities return a real HTTP 404;
- sitemap membership, canonical URLs, robots directives, and entity schema agree;
- client hydration does not duplicate or invalidate server-emitted SEO output;
- existing redirects take precedence over not-found handling;
- no fabricated pages, records, ratings, reviews, locations, or claims are introduced.

## 2. Existing Systems to Preserve

The implementation must reuse the current:

- Express server and React/Vite application;
- database-managed redirect middleware;
- server-side head injection;
- `PageSeo` and SEO DOM helpers;
- SEO Manager and active SEO page records;
- sitemap index and child sitemap endpoints;
- robots endpoint;
- route-specific Product, Person, Article, Service, FAQ, Breadcrumb, and ItemList schema emitters;
- canonical Pandit storefront route, `/pandit/:slug`;
- public route registry and lazy-loaded client pages;
- publication, verification, and profile-quality rules already used by public features.

No parallel metadata framework, duplicate SEO Manager, or second schema system will be introduced.

## 3. Selected Approach

Use targeted server-side route validation before the SPA fallback.

The server will classify established public route families, resolve the requested entity through existing data-access rules, and select the correct HTTP response before serving the React document.

This approach is preferred over:

- a broad central SEO registry refactor, which would be larger and risk overlapping current metadata work; and
- client-only not-found handling, which cannot correct soft-404 HTTP responses.

The helpers created for this increment should remain small and reusable so they can later support a more comprehensive route registry without requiring that refactor now.

## 4. Request and Status Architecture

Request handling order:

1. Existing database redirects run first.
2. API requests, development resources, feeds, static assets, and internal utilities retain their current handlers.
3. A public-route classifier runs immediately before the SPA document fallback.
4. Recognized dynamic route families validate their requested entity through existing lookup and publication rules.
5. Recognized static client routes validate against the actual public route registry.
6. The server returns the SPA document with the status and SEO state determined below.

### 4.1 Valid public route

A valid, public, indexable entity:

- returns HTTP 200;
- serves the existing React document;
- emits its canonical URL and intended robots directives;
- may emit route-specific schema when supported by visible content;
- may appear in the correct child sitemap.

### 4.2 Missing or excluded public entity

A missing, malformed, private, unpublished, or quality-gate-ineligible entity:

- returns HTTP 404;
- serves the existing branded not-found experience;
- emits `noindex,follow`;
- does not emit entity-specific schema;
- does not appear in a sitemap.

Publication and quality decisions must reuse existing domain rules. The SEO layer must not independently decide that a private or incomplete record is public.

### 4.3 Unknown static route

A path that is not an API, asset, feed, redirect source, or registered public/client route:

- returns HTTP 404;
- serves the branded not-found experience;
- emits `noindex,follow`;
- does not emit route-specific schema.

### 4.4 Lookup failure

A database timeout, unavailable dependency, or unexpected resolver failure must not be reported as a permanent missing entity.

The server must:

- preserve the existing explicit error contract when one exists;
- otherwise return an appropriate server error rather than HTTP 404;
- log enough route-family and failure context for diagnosis without logging secrets or private record data.

### 4.5 Client-side navigation

Client-side transitions continue to use the existing React not-found experience. Direct requests, refreshes, link unfurls, and crawler requests additionally receive the correct HTTP status from the server.

## 5. Route-Family Coverage

Implementation coverage will be based on routes confirmed in the current application, not example URLs from the master brief.

The initial classifier should cover confirmed slug- or identifier-based public families, including:

- products;
- canonical Pandit storefronts;
- published blog articles;
- Puja/service landing pages;
- Tirth/destination pages;
- location or programmatic SEO pages that already have meaningful published data;
- other existing public entity routes discovered during implementation planning.

Routes that cannot be validated safely with existing data-access functions will be documented and deferred rather than guessed.

International or NRI landing pages will not be created or made indexable unless actual service availability and useful content already exist.

## 6. Shared Indexability Contract

Each covered content type needs one reusable indexability decision that can be consumed by:

- direct-request validation;
- sitemap inclusion;
- server-side metadata generation;
- schema emission tests.

The contract should distinguish:

- found and indexable;
- found but intentionally noindex;
- found but private/unpublished/ineligible;
- not found;
- resolver failure.

The contract may adapt existing functions rather than requiring a new universal type if current architecture favors content-specific resolvers.

## 7. Sitemap Integrity

The existing sitemap index and child sitemap structure will remain.

For every included URL:

- the underlying entity must exist;
- the entity must be public and indexable;
- the URL must use the canonical route and normalized path;
- a direct request must return HTTP 200;
- robots directives must allow indexing;
- redirect-source URLs must not be included.

Sitemaps must exclude:

- missing entities;
- private, unpublished, or quality-gate-ineligible records;
- `noindex` routes;
- admin, account, cart, checkout, order, booking-management, and dashboard routes;
- APIs, feeds, assets, and internal utilities;
- duplicate filtered, tracking, or search URLs;
- fabricated location or international pages.

An individually invalid record may be skipped with actionable logging. A systemic data-source failure must fail explicitly rather than publish a misleading empty sitemap.

## 8. Canonical Integrity

Canonical generation will continue through existing helpers.

Normalization rules:

- use the configured production origin source already used by the app;
- use HTTPS and the selected host in production;
- use lowercase canonical paths where the route contract requires lowercase slugs;
- apply one trailing-slash convention;
- remove tracking and irrelevant query parameters;
- retain meaningful pagination or content parameters only when they represent a distinct indexable page;
- preserve the canonical Pandit route `/pandit/:slug`;
- avoid canonicalizing a true missing page to an unrelated valid page.

Known duplicate route forms should redirect to the canonical route when safe and compatible with existing redirects. Otherwise, they must at least emit a consistent canonical and remain absent from sitemaps.

This increment will not rewrite page titles or search-preview copy while the separate metadata-consistency task is in progress.

## 9. Schema Integrity

Existing schema emitters remain authoritative.

The implementation will:

- retain one owner for site-wide Organization and WebSite nodes;
- prevent server, static-template, and hydrated client emitters from producing duplicate semantic entities;
- keep route-specific schema tied to truthful, visible content;
- suppress entity-specific schema for HTTP 404 and excluded/noindex entities;
- preserve real Product offers, Pandit Person data, Article metadata, visible FAQs, breadcrumbs, services, and item lists where applicable;
- never manufacture ratings, reviews, availability, locations, prices, authors, or FAQs.

Regression checks must detect:

- duplicate schema identifiers or duplicate site-wide semantic nodes;
- malformed JSON-LD;
- schema types inconsistent with the visible route;
- rating or review markup without real supporting data;
- FAQ schema without matching visible FAQ content;
- entity schema on 404 responses.

## 10. Metadata Hydration Parity

Server-emitted head tags are crawler-visible and must remain valid after React hydration.

Representative route tests will compare the raw response head with the hydrated document for:

- title presence, without changing title copy owned by the active metadata task;
- meta description;
- canonical;
- robots;
- Open Graph URL/title/description/image where applicable;
- Twitter card metadata;
- hreflang only where genuine equivalent locale routes exist;
- JSON-LD identity and duplication.

The increment may fix ownership, cleanup, or duplication defects. It must not introduce an unrelated metadata rewrite.

## 11. Error Handling and Caching

- Redirect lookup always precedes entity validation.
- Resolver failures remain distinguishable from missing entities.
- Existing request or data caching should be reused where safe.
- New caching, if required, must be short-lived and must not cause unpublished or deleted entities to remain indexable.
- No persistent cache, new database table, or migration is included.
- Logs must identify the route family and normalized path without exposing secrets or private entity fields.

## 12. Testing Strategy

### 12.1 Before-state matrix

Capture representative current responses for:

- valid entity URLs;
- missing entity URLs;
- unpublished/private entity URLs when safe test records already exist;
- redirect sources and targets;
- malformed slugs;
- unknown static routes;
- API, asset, feed, admin, account, cart, and checkout paths.

Record status, content type, robots, canonical, and schema presence.

### 12.2 Unit tests

Cover:

- route classification;
- path and canonical normalization;
- indexability decisions;
- resolver-result mapping;
- redirect/API/asset bypass rules;
- sitemap inclusion predicates.

### 12.3 Server integration tests

Verify:

- valid entities return 200;
- missing and excluded entities return 404;
- lookup failures do not return false 404s;
- redirects run before validation;
- unknown static routes return 404;
- API and asset behavior is unchanged;
- 404 responses emit `noindex,follow`;
- 404 responses do not emit entity schema.

### 12.4 Sitemap tests

Verify:

- well-formed XML;
- sitemap-index and child-sitemap references;
- canonical URL formatting;
- only public/indexable entities are included;
- redirect sources, missing entities, and excluded routes are absent;
- representative sitemap URLs return 200 and self-canonicalize.

### 12.5 Browser tests

Using a rendered browser:

- compare raw and hydrated head state;
- confirm branded 404 presentation;
- confirm client-side navigation to missing entities;
- inspect rendered JSON-LD;
- check representative homepage, product, Puja, Pandit, location, blog, and Tirth routes;
- test representative mobile and desktop widths;
- confirm no new console, network, hydration, image, or canonical errors.

### 12.6 Regression boundaries

Run focused smoke tests for:

- checkout entry;
- booking entry;
- authentication entry;
- admin login/navigation;
- Pandit dashboard entry;
- public search;
- existing API responses.

These are verification-only boundaries. Their business behavior is not part of this increment.

### 12.7 Build

Run the production build and compare warnings against the established project baseline. Pre-existing TypeScript errors are not a release gate; only new errors in touched code must be resolved.

## 13. Rollout Sequence

1. Capture the before-state URL matrix.
2. Inventory confirmed public route families and existing resolvers.
3. Implement small shared route-classification and resolver-result helpers.
4. Add status-aware SPA fallback and branded 404 response handling.
5. Align sitemap filtering with the same indexability rules.
6. Normalize canonical handling only where inconsistency is demonstrated.
7. Resolve schema ownership or hydration duplication defects found by parity tests.
8. Run unit, integration, browser, regression, and production-build checks.
9. Report changes and remaining gaps.
10. Do not publish automatically.

## 14. Explicit Exclusions

This increment does not include:

- title or search-preview copy changes owned by the active metadata task;
- new programmatic SEO pages;
- international/NRI page creation;
- fabricated content or data;
- payment, checkout, order, booking, authentication, permission, or Pandit business-logic changes;
- database schema or data migrations;
- environment variables, secrets, or deployment changes;
- broad performance work;
- analytics funnel implementation;
- public search redesign;
- broad frontend or admin redesign;
- replacing the SEO Manager;
- publishing or deploying.

## 15. Acceptance Criteria

The increment is complete when:

1. Confirmed valid public entity routes return HTTP 200.
2. Confirmed missing, private, unpublished, and malformed entity routes return HTTP 404 rather than a soft 200.
3. Unknown unregistered static routes return HTTP 404.
4. Redirect sources still resolve before not-found validation.
5. API, asset, feed, admin, account, cart, and checkout behavior remains unchanged.
6. Every sampled sitemap URL returns 200, is indexable, and self-canonicalizes.
7. Missing, redirected, private, unpublished, and `noindex` URLs are absent from sitemaps.
8. HTTP 404 pages emit `noindex,follow` and no entity-specific schema.
9. Raw server metadata and hydrated metadata remain semantically consistent on representative public routes.
10. Site-wide schema entities are not duplicated.
11. No fake content or claims are introduced.
12. Focused regression tests and the production build pass without new errors attributable to this work.

## 16. Final Report

The implementation report will state:

- what crawl/indexing infrastructure was already present;
- what was changed;
- files and components changed;
- route families covered;
- HTTP status behavior;
- sitemap and robots status;
- canonical and schema integrity results;
- tests performed;
- remaining unsupported route families or manual configuration;
- confirmation that no deployment was performed automatically.
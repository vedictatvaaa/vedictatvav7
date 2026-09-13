# Route Hygiene and Governed City SEO Enrichment

## Goals

1. Find and safely resolve broken pages, broken internal links, frozen loading states, stale aliases, redirect problems, orphan URLs, and obsolete routes.
2. Turn canonical Pandit city pages into useful discovery pages using verified local supply, Vedic Tatva services, live store categories, Pandit enrollment, internal links, and Admin-approved factual editorial.
3. Improve crawlability and search usefulness without creating doorway pages, fabricated local claims, keyword stuffing, or scaled low-value content.

## Non-goals

- Do not fabricate Pandits, reviews, ratings, bookings, availability, locations, services, store products, or local expertise.
- Do not auto-publish AI prose.
- Do not make thin or zero-value city pages indexable merely because a template exists.
- Do not redirect unrelated junk URLs to the homepage.
- Do not change the approved Pandit storefront visual design.
- Do not expose private Pandit application, contact, authentication, or governance data.

## Part 1: Route and Link Audit

### Crawl sources

The audit assembles URLs from:

- Registered SPA routes and server routes
- Static and dynamic sitemap outputs
- Internal links found in rendered public pages
- Canonical and alternate links
- Redirect and alias registries
- Public products, categories, articles, services, Pandit profiles, and Pandit locations
- Known legacy URL families
- A bounded crawl of production and development

### Checks

For each URL, record:

- Initial and final HTTP status
- Redirect chain and loop detection
- Final canonical URL
- Robots directive
- Content type
- Page title and one-H1 presence
- Internal links returning 4xx/5xx
- API paths incorrectly returning SPA HTML
- Empty or frozen loading states after a bounded render wait
- Client and server console errors
- Duplicate or conflicting canonicals
- Sitemap URLs that redirect, 404, or are non-indexable
- Orphan pages and legacy routes still linked internally

### Classification

Every finding receives one action:

1. **Repair** — valid page or link with broken behavior.
2. **301 redirect** — old URL has one clear semantic equivalent.
3. **410 Gone** — deliberate test, duplicate, accidental, or obsolete URL has no replacement.
4. **Valid 404** — unknown user-generated or typo URL; no permanent registry entry needed.
5. **Remove from discovery** — page can remain reachable but must leave navigation, internal links, and sitemap.
6. **Keep** — behavior is valid and requires no change.

### Retirement registry

Use one tested route-retirement registry rather than adding scattered middleware conditions. Each entry contains:

- Exact path or narrowly bounded route pattern
- Action: redirect or gone
- Replacement URL for redirects
- Reason
- Optional sunset note

Rules:

- Redirects preserve only explicitly safe query parameters.
- Redirect chains are collapsed to one hop.
- 410 entries must be exact or tightly scoped; arbitrary unknown URLs remain 404.
- Retired URLs are removed from sitemaps, navigation, canonicals, and internal links.
- Equivalent legacy Pandit location routes redirect to the canonical state/city hierarchy.

## Part 2: City Page Enrichment

### Page order

Each canonical city page may render these modules:

1. **City hero**
   - Canonical city and state
   - Genuine discoverable Pandit count
   - Clear statement that availability is confirmed during booking

2. **Available Pandits**
   - Existing authoritative directory query
   - Server-bounded pagination
   - Existing eligibility and privacy policy

3. **Approved city editorial**
   - Admin-published introduction
   - Factual local service summary
   - No claims beyond the allow-listed snapshot

4. **Relevant Vedic Tatva services**
   - Active canonical services actually supported by local eligible Pandits
   - Broader online services can be shown separately and labelled as online/nationwide
   - Never imply local supply from a nationwide service

5. **Vedic Tatva store categories**
   - Live categories only
   - Contextual categories such as puja samagri, havan samagri, brass/copperware, clothing, rudraksha, gemstones, or idols
   - Category advertising uses current catalogue routes and does not claim city-specific stock

6. **Nearby and related locations**
   - Active canonical cities in the same state
   - Genuine counts
   - Canonical hierarchy links

7. **Pandit registration banner**
   - Invite qualified Pandits to apply
   - Link to the existing enrollment flow
   - Do not imply automatic approval or guaranteed discovery

8. **Approved FAQ**
   - City-specific questions generated from verified facts
   - Admin review required
   - FAQ schema emitted only for visible, published FAQ content

### Factual snapshot

AI receives only an allow-listed public snapshot:

- Canonical state and city identity
- Genuine eligible/discoverable Pandit counts
- Public Pandit specializations and languages in aggregate
- Active canonical services with genuine local supply
- Active nationwide online services, clearly labelled
- Live public store categories
- Nearby canonical cities and genuine counts
- Existing published city editorial

The snapshot excludes private contact, application, authentication, moderation, payment, and unpublished content.

### Draft lifecycle

1. Admin requests a draft.
2. Server builds and hashes the factual snapshot.
3. AI returns structured introduction, service copy, and FAQs.
4. Server rejects unknown names, unsupported numbers, invented claims, HTML, and excessive keyword repetition.
5. Draft is saved with model, prompt, source hash, generation time, and validation result.
6. Admin reviews and edits.
7. Server revalidates the edited draft.
8. Admin explicitly publishes.
9. Any material source change marks published editorial stale and removes it from indexability until reviewed.

### Indexability

A city page is indexable only when all existing central quality rules pass, including:

- Active canonical city
- Authoritative public route
- Required eligible local supply
- Published, non-stale factual editorial
- Sufficient visible unique content
- Valid canonical and structured data

Known cities that do not pass remain useful `noindex, follow` pages. Unknown or inactive cities return 404. A module-rich template alone never changes indexability.

## Error handling

- Failure to load optional editorial, services, store categories, or nearby cities must not hide authoritative Pandit results.
- Required directory failures show a retryable error rather than a false empty state.
- Generated-content failures remain visible to Admin and never publish fallback prose.
- Empty modules are omitted instead of showing fabricated placeholders.
- API endpoints always return JSON errors; public route middleware must never replace them with SPA HTML.

## Performance and accessibility

- Lazy-load below-the-fold enrichment modules.
- Bound all queries and cache public aggregate/module payloads.
- Reserve layout space to reduce cumulative layout shift.
- Use semantic headings, labelled regions, keyboard-accessible links, 44px touch targets, and reduced-motion support.
- Mobile uses single-column modules and horizontally scrollable cards only where they improve scanning.

## Verification

### Automated

- Route-manifest synchronization
- Redirect target, one-hop, and safe-query tests
- 410 exact-match tests
- Sitemap contains only canonical 200 indexable URLs
- Known/unknown/zero-supply city route tests
- API content-type tests
- City module fact-validation and privacy tests
- FAQ visibility/schema parity
- Store category and service existence tests
- Stale editorial removes indexability

### Crawl

- Run bounded development and production crawls.
- Produce a machine-readable report with URL, status, final URL, canonical, robots, problem, and recommended action.
- Re-crawl fixed routes and compare before/after.

### Browser flows

- Desktop and mobile city pages
- Positive-supply, zero-supply, alias, duplicate-name, and unknown cities
- Pandit result to storefront
- City service link
- Store category link
- Nearby city link
- Pandit registration CTA
- FAQ expansion and structured-data parity

## Release safety

- Commit audit tooling/report separately from route retirements.
- Review every 301 and 410 entry before production synchronization.
- Deploy city modules with existing indexability gates unchanged.
- Verify production health, sitemap, representative city pages, and public APIs after deployment.
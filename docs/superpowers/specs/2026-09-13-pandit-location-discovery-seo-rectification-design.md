# Pandit Location, Discovery, and SEO Rectification Design

## Purpose

Ensure every production Pandit record has an explainable discovery status, consistent canonical location data, and a safe path to correction. Improve public browsing through metro, state, and city pages without weakening publication, privacy, review, or booking safeguards.

The production database contains 104 Pandit records. The public discovery facets currently represent 77 records. The implementation must identify the reason for every difference rather than assuming all 104 should be public.

## Safety principles

- Start with a read-only production audit and generate a dry-run correction report.
- Never expose private contact details in audit output, public APIs, logs, or generated SEO pages.
- Location correction does not override verification, suspension, leave, publication, indexing, or booking governance.
- Apply deterministic and high-confidence corrections automatically.
- Send ambiguous or conflicting locations to an admin review queue.
- Never invent an address, coordinate, qualification, service, review, rating, or availability claim.
- Make every applied correction transactional and auditable, including old value, new value, source, confidence, reason, actor, and timestamp.

## Canonical location model

Each Pandit location resolves to:

- Canonical state or union territory
- Canonical city
- Public display names
- Search aliases and legacy spellings
- Normalized public address where sufficient source data exists
- Latitude and longitude
- Coordinate source and confidence
- Rectification status: `verified`, `auto_corrected`, or `needs_review`

Canonical public naming includes:

- New Delhi, with Delhi retained as a search alias
- Gurugram, with Gurgaon retained as a search alias
- Bengaluru, with Bangalore retained as a search alias
- Guwahati with common misspellings retained as search aliases
- Chandigarh represented consistently as both city and union territory
- Noida and Greater Noida represented as separate cities and grouped under NCR browsing

Aliases improve matching and search but never create duplicate canonical city records.

## Rectification pipeline

1. Load all production Pandits and the active canonical city/state catalogue.
2. Evaluate each Pandit through the same public eligibility service used by discovery.
3. Classify location issues:
   - missing state or city
   - inactive or unknown catalogue reference
   - city/state mismatch
   - unrecognized spelling or alias
   - missing coordinates
   - invalid coordinate range
   - coordinates inconsistent with the canonical city/state
   - incomplete or conflicting address
4. Apply deterministic aliases and catalogue relationships first.
5. Use geocoding and AI-assisted interpretation only for unresolved records.
6. Calculate confidence from source completeness, alias certainty, catalogue agreement, geocoder agreement, and coordinate containment.
7. Auto-apply only high-confidence changes.
8. Queue ambiguous changes for admin review with candidate matches and reasons.
9. Re-run public eligibility and compare before/after counts.

AI is an interpretation assistant, not the source of truth. Canonical catalogue records and verified geocoding evidence remain authoritative.

## Admin audit and review

The admin experience must show aggregate counts and one row per Pandit without exposing private contact information:

- Visible in directory
- Eligible for search
- Published
- Indexable
- Booking enabled
- Location resolved
- Location issue categories
- Exact hidden reasons
- Proposed correction and confidence
- Before/after values
- Approve, reject, or edit ambiguous corrections

Bulk application must require a preview and confirmation. It must be idempotent and safe to retry.

## Public directory information architecture

### Popular metros

Display a curated, responsive metro section in this order:

1. New Delhi
2. Noida
3. Gurugram
4. Chandigarh
5. Mumbai
6. Bengaluru
7. Kolkata
8. Pune
9. Guwahati
10. Chennai
11. Hyderabad
12. Ahmedabad

Each item shows its genuine discoverable-Pandit count. Metro items remain useful navigation targets even when availability is limited, but the UI must not imply available Pandits when the count is zero.

### Browse by state

Show state and union-territory cards with canonical English names, local-script names, suitable existing imagery, and genuine counts.

### All cities

Provide an alphabetical, searchable, expandable city directory. Prominently display cities with eligible Pandits and clearly label limited availability elsewhere.

### Pandit ordering

Use deterministic ranking:

1. Public eligibility and publication
2. Profile completeness
3. Current availability and service relevance
4. Genuine review quality and volume
5. Experience
6. Stable registration order

Location repair must not manufacture ranking signals.

## SEO URL architecture

Preserve the established keyword route and stable profile route:

- Directory: `/book-pandit-online`
- State: `/book-pandit-online/:stateSlug`
- City: `/book-pandit-online/:stateSlug/:citySlug`
- Pandit profile: `/pandit/:panditSlug`

Individual profile URLs remain independent of location because a Pandit may move or serve multiple cities. State/city hierarchy is communicated through breadcrumbs and internal links.

Optional nested profile-like URLs such as `/book-pandit-online/:stateSlug/:citySlug/:panditSlug` must permanently redirect to `/pandit/:panditSlug`. They must not create duplicate indexable pages.

Legacy or alias location URLs permanently redirect to their canonical state/city URL. Every indexable page emits one self-referencing canonical URL.

## SEO content

State and city pages use persisted, reviewed content generated from verified facts rather than runtime AI generation. Content may include:

- Unique title and meta description
- Location introduction
- Available services, traditions, and languages derived from eligible Pandits
- Genuine directory counts
- Nearby canonical locations
- Fact-grounded FAQs
- Breadcrumb navigation
- Internal links to relevant service and Pandit pages
- `BreadcrumbList`, `ItemList`, and appropriate place schema

Pages with insufficient real inventory or content remain accessible for users but use `noindex` until publication thresholds are met. Generated content must not claim guaranteed availability, expertise, popularity, pricing, reviews, or local presence unsupported by production data.

## API and query consistency

- Use one shared public-eligibility service for discovery summaries, directory results, city/state counts, sitemaps, and SEO pages.
- Resolve a city to its canonical state before applying service-area rules.
- Ensure city-only API requests behave consistently with state-and-city requests.
- Return deterministic sorting and pagination.
- Expose hidden reasons only through authenticated admin routes.
- Keep public payloads limited to approved public profile data.

## Validation

Before release:

- Account for all 104 production records by eligibility category.
- Confirm every hidden record has at least one explicit reason.
- Verify no private contact fields appear in public payloads or audit logs.
- Test canonical aliases and misspellings.
- Test missing, invalid, and mismatched coordinates.
- Test high-confidence auto-correction and ambiguous review handling.
- Verify directory totals equal city/state facets under the same filters.
- Verify metro ordering on mobile and desktop.
- Verify state, city, canonical, redirect, breadcrumb, sitemap, and structured-data behavior.
- Confirm genuine review and server-authoritative booking constraints remain unchanged.
- Run corrections in dry-run mode before any production write.

## Rollout

1. Implement and test the shared audit and normalization logic locally.
2. Run a read-only production audit through Coolify.
3. Review aggregate findings and proposed corrections.
4. Apply deterministic/high-confidence corrections transactionally.
5. Review ambiguous records in Admin.
6. Deploy directory and SEO route changes.
7. Re-audit production counts, routes, canonical tags, and discovery behavior.

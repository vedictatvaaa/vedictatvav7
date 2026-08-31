# Pandit Discovery: Balanced Progressive Directory

**Date:** 2026-08-31  
**Status:** Approved design

## Goal

Make the public Pandit discovery journey useful from its first screen for users who
start with a service, a State, a City, or their current location. Results and counts
must be database-backed and must use the same discoverability rules as booking. The
work extends the existing directory and booking flow; it does not create a second
booking or payment path.

## Scope and non-goals

In scope:

- A progressive discovery home with service search, State/City search, Browse by
  State, and real Near Me.
- Canonical State → City → Pandit navigation with shareable, refresh-safe URLs.
- Public State/City/service facets and eligible counts.
- State-wide browsing with a City filter.
- Correct public visibility, public DTO boundaries, and discovery-related Admin
  source-of-truth/audit gaps.
- Responsive behavior and browser/API regression coverage.

Not in scope:

- Replacing the existing booking, authentication, payment, profile, compare, or
  checkout flows.
- Adding city-center coordinates or estimating a Pandit's distance from a city
  center.
- Inventing availability, ranking, service, or location data that is not present in
  the database.
- A new map provider or a full marketplace rewrite.

## User experience

### Discovery home

The `/book-pandit-online` route becomes a focused discovery workspace:

1. A primary search field searches canonical State and City records.
2. A visible Near Me action requests browser location permission and explains how
   the location is used.
3. Browse by State is available without requiring a City first.
4. Service chips show services represented by eligible Pandits. A More services
   control exposes the complete returned facet list.
5. Existing online-puja and other relevant secondary CTAs remain available, but
   discovery copy does not imply that local Pandits exist when the database has no
   eligible records.

State cards show eligible Pandit count and represented City count. A selected State
shows its eligible Cities and a State-wide results option. A selected City shows
eligible Pandits for that canonical City and retains any selected service.

### Results

Results retain the useful existing controls: text search, service/specialization,
language, tradition, price, rating, online, availability, sorting, compare, map,
profile, and booking where the corresponding field or endpoint is supported.
Hardcoded vocabulary is removed from public filter choices unless it is explicitly
used as a controlled fallback for a supported legacy value.

The listing header contains:

- Breadcrumbs: Home → State → City (or Near Me).
- A factual eligible-result count.
- A clear back action that returns to the previous discovery state.
- A City filter on State-wide results.

Unsupported claims such as fake live availability, unexplained ranking guarantees,
or static location behavior are removed or tied directly to actual server fields.
Distance labels appear only in Near Me mode and only when calculated from the
user's coordinates.

### Responsive behavior

On desktop, the primary search and discovery choices share one visual workspace and
State/City cards use compact grouped grids. On 320–430px screens, search and Near Me
remain above the fold, cards collapse to compact one- or two-column layouts, and
secondary filters use the existing mobile filter sheet. Loading, API error, empty,
permission denied, timeout, and stale-location states each include a direct
recovery action.

## URL and navigation model

Existing canonical route families remain:

- `/book-pandit-online` — discovery home.
- `/book-pandit-online/:citySlug` — city results.
- `/book-pandit-online/:citySlug/:pujaSlug` — existing city/service landing page.

Where no existing State route exists, State discovery uses the directory's
canonical query state with the State ID/slug. City links include the authoritative
`cityId`; the display name is not the identity key. Service, State, City, Near Me,
and supported filters are encoded in the URL so refresh, browser back/forward, and
shared links reproduce the same discovery state. Legacy city-only URLs continue to
resolve only through the existing unambiguous canonicalization behavior.

Navigation into a profile uses the existing slug/ID profile routes. Booking buttons
continue into the existing authenticated booking handoff with the selected Pandit,
City, and service context.

## Data and API design

### Public discovery summary

Add a public discovery summary/facets response that returns only active canonical
States and Cities represented by discoverable Pandits, along with:

- eligible Pandit count per State;
- eligible Pandit count per City;
- represented City count per State;
- service/specialization, language, and tradition facets supported by eligible
  records.

The response may be split into small endpoints if that follows existing route
patterns, but every response must use the same eligibility predicate and must not
depend on the static SEO city metadata.

### Pandit discovery modes

Extend the existing Pandit discovery API with explicit modes:

- **City:** canonical `cityId` is authoritative. A legacy city name is accepted
  only when it resolves uniquely.
- **State:** matches the selected canonical `stateId`, with optional `cityId` and
  service/filter refinements.
- **Near Me:** requires valid latitude/longitude and a bounded radius. It returns
  only eligible Pandits with real coordinates, ordered by computed distance.

Invalid or inactive State/City IDs, ambiguous names, and invalid coordinate inputs
return clear client errors. Near Me with missing coordinates, denied permission,
or no nearby eligible records offers City/State search instead of falling through
to national results.

### Eligibility and privacy

The server is authoritative for:

- verified status;
- not-on-leave status;
- active, valid canonical State/City relationships;
- tier reach and exact City/State matching rules;
- requested mode/radius constraints.

Client-side filters can narrow a response but can never broaden it. Public DTOs
include only fields needed for discovery, cards, profile links, and booking. They
exclude internal membership/tier expiry, commissions, private moderation details,
and precise coordinates except for the minimum distance-related data required by
Near Me.

Public profile endpoints use the same discoverability guard as directory results,
so an unverified or on-leave Pandit cannot bypass directory eligibility through a
direct URL.

## Admin/source-of-truth behavior

Admin location views distinguish total records from discoverable records where both
are useful. State/City edits update all canonical relationship IDs consistently so
displayed names, counts, and matching cannot diverge. Location activation changes,
Pandit visibility changes, and application approval/rejection decisions emit audit
records with the acting Admin and outcome.

The existing canonical State → City application resolution remains required before
approval. Bulk review may be added only where it can preserve the same validation
and audit guarantees; it must not introduce an alternate approval path.

## Error handling and recovery

- Summary/facet failures show a retry action and do not render fabricated counts.
- Empty discovery shows the next useful path: another State/City, online puja, or
  a retry when the failure may be transient.
- Invalid canonical location responses clear the invalid state and offer search.
- Near Me explains permission denial and does not silently substitute a guessed
  location.
- Results preserve the last valid URL state when a refresh or refetch fails.
- Booking continues to rely on server-side validation and existing auth/payment
  behavior.

## Analytics

Reuse existing page-view and interaction tracking. Track meaningful discovery
events through the existing hooks: discovery search, State selection, City
selection, service selection, Near Me permission outcome, filter use, profile
open, and booking handoff. Do not introduce a separate analytics system.

## Verification plan

### API and unit coverage

Cover:

- State and City eligible counts;
- State-wide browsing with optional City filtering;
- inactive, unresolved, unverified, and on-leave exclusion;
- duplicate city-name isolation;
- exact City ID and Gold State reach behavior;
- Near Me valid/invalid coordinates, radius filtering, distance ordering, and
  missing-coordinate exclusion;
- public DTO privacy;
- direct profile visibility parity;
- State/City edits preserving canonical IDs and provenance;
- approval and moderation validation/audit behavior.

### Browser coverage

At desktop and 320–430px widths, cover:

- discovery home loading, populated, empty, and error states;
- service-first search and database-backed facet selection;
- State → City → results navigation;
- State-wide City filtering;
- refresh and browser back/forward preservation;
- Near Me success, denial, timeout, and no-result recovery;
- supported filters and unsupported-value absence;
- profile navigation and existing booking handoff.

Run the targeted location regression tests, production build, changed-file
diagnostics, and a fresh code review. Treat the repository's known TypeScript
baseline as non-blocking; only newly introduced errors in changed behavior are
regressions.
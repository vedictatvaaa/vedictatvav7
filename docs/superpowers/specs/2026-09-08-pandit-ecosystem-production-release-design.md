# Pandit Ecosystem Production Release Design

## Objective

Finalize the existing Vedic Tatva Pandit ecosystem as one coherent, production-ready Coolify release. Preserve the current directory, storefront, protected contact, managed Puja booking, authentication, reviews, analytics, SEO, and Admin systems. Extend those systems only; do not create parallel models, directories, contact systems, booking engines, review systems, authentication, analytics, or Admin dashboards.

## Non-negotiable capability boundaries

### Public directory

A Pandit may be directory-visible when the account satisfies authoritative public-safety and directory-publication rules. Directory inclusion must not depend on:

- managed-booking eligibility;
- active service assignment;
- service-area coverage;
- current booking availability; or
- managed-booking participation.

Directory publication, directory visibility, and search eligibility are independently governed. Directory-visible users can search, filter, open profiles, read profile and service information, read genuine reviews, access protected contact, browse the Panditji Store section, and share the profile.

### Protected contact

Protected contact is independent of managed booking. It remains one server-authoritative system:

- contact values never appear in unauthenticated DTOs, initial HTML, browser storage, logs, status responses, SEO, or analytics;
- the global disabled policy is an unconditional ceiling;
- users receive 10 unique Pandit reveals per rolling 12 months;
- repeat access to the same Pandit consumes no additional credit;
- quota claims remain transaction-safe and server-recorded;
- no usable contact returns an unavailable state without consuming a reveal;
- an authorized phone reveal enables native `tel:` click-to-call;
- managed booking is offered after quota exhaustion only when that Pandit is actually managed-booking eligible.

The primary storefront CTA is **Call Panditji**. Anonymous users receive a login prompt. Authenticated first-time, repeat, exhausted, disabled, and no-contact states receive explicit, distinct messages.

### Managed Puja booking

Managed-booking eligibility is independent of directory visibility and search eligibility. Immediately before creating a service or package booking, the server checks:

- active, non-blocked account state;
- booking-enabled governance switch;
- selected offering ownership and active state;
- active master-catalogue service;
- selected Puja support;
- supported delivery mode;
- applicable service-area coverage;
- profile availability and leave state;
- server-authoritative rates and pricing; and
- selected booking context.

The Admin diagnostic uses the same evaluator as booking authorization. Public callers receive only safe, generic rejections; internal exclusion reasons remain Admin-only.

### SEO

Indexing follows directory/storefront publication, canonical location, canonical URL, slug history, and the `noindex` ceiling. Booking eligibility never controls indexability. Internal governance and booking diagnostics never enter public schemas or HTML.

## Admin governance

Use the existing **Pandit Governance** tab.

Independent, audited controls:

1. Storefront publication.
2. Directory visibility.
3. Search eligibility.
4. Booking enablement.
5. Verification.
6. Account suspension/reactivation.
7. Leave start/end.
8. Archive/restore.
9. SEO indexing mode.
10. Contact-policy override.

Sensitive single and bulk actions require a reason and explicit confirmation. Supported bulk actions are atomic and return accurate affected-record counts. Every affected Pandit receives a redacted audit event; bulk events share a batch identifier.

The authoritative management view keeps separate sections for profile, publication, directory/search, verification, booking diagnostics, master-service assignments, service areas, contact/privacy, membership, completeness, genuine reviews, SEO, canonical URL/slug history, reveal usage, and audit history.

## Remaining feature synchronization

### Services and service areas

- Keep the master Puja catalogue, Pandit assignments, coverage, and booking eligibility distinct.
- Admin can inspect and govern assignments and coverage without mutating the master catalogue unintentionally.
- At-home matching validates canonical coverage; online offerings do not fabricate in-person coverage.
- General Admin diagnostics never claim date/calendar availability.

### Genuine review moderation

- Reuse the existing review model and Admin.
- Never fabricate ratings, counts, or testimonials.
- Profiles with no genuine reviews show **New**.
- Moderation actions are authenticated and audited.
- Public aggregates derive only from genuine, publishable reviews.

### Matching and comparison

- Preserve Puja → Location → Date → Time → Eligible Pandits → Compare → Book.
- Specific matching validates selected Puja, canonical location, delivery mode, date/time context, service assignment, coverage, and live eligibility.
- Comparison shows only authoritative attributes and never invents availability, trust, booking count, or service reach.

### Slug and SEO governance

- Keep `/pandit/:slug` canonical.
- Slug changes retain audited history and permanent redirects.
- Prevent collisions and stale canonicals.
- Sitemap and structured data include only indexable public profiles.

### Funnel analytics

Extend the existing consent-aware analytics layer with privacy-safe events:

- directory impression;
- profile view;
- contact CTA click;
- login/contact prompt shown;
- reveal success;
- repeat reveal;
- quota exhausted;
- no usable contact;
- click-to-call;
- booking start; and
- booking completion/error.

Contact events never imply booking eligibility. Event payloads exclude contact values, credentials, customer identity, and sensitive free text.

## User experience

- Directory cards distinguish **View profile**, **Call Panditji**, and managed-booking availability.
- Storefront contact remains prominent even when managed booking is unavailable.
- Booking CTA states explain unavailable booking without hiding the public profile or contact option.
- Quota and policy messages state what happened and the next valid action.
- Mobile click-to-call uses native dialing after protected authorization.
- Controls are keyboard accessible, labeled, responsive, and usable at 390px width.

## Data and migrations

- Use additive, committed, rerunnable migrations.
- New governance controls default fail-closed.
- Do not backfill booking eligibility from directory visibility.
- Do not automatically overwrite a prior Admin decision on migration rerun.
- Preserve existing public profiles unless a genuine public-safety or directory-publication rule excludes them.
- Apply development migrations explicitly.
- Before production, compare development and Coolify schemas and run migrations through the established Coolify release process.

## Error handling and privacy

- Fail closed for authorization, contact disclosure, booking creation, mutation validation, and audit persistence.
- Avoid partial bulk success.
- Do not log private contact values or credentials.
- Return safe errors to public clients and exact diagnostics only to authenticated Admins.
- A failed reveal cannot consume quota without returning usable contact.
- A failed booking gate cannot create a booking.

## Verification gates

1. Focused unit and PostgreSQL tests for directory/contact/booking independence.
2. Contact quota first/repeat/boundary/concurrency tests.
3. Service and package booking authorization tests using disposable database fixtures.
4. Admin single/bulk mutation and audit tests.
5. Public DTO, HTML, SEO, and analytics privacy tests.
6. Genuine-review aggregation and moderation tests.
7. Slug collision/history/redirect tests.
8. Managed matching and comparison tests.
9. Desktop and 390px critical browser journeys.
10. Clean-database migration verification.
11. Production build.
12. Coolify schema review, deployment, migration execution, health checks, and live smoke verification.

Existing repository-wide TypeScript debt is not a release gate; new errors in touched code are. Existing chunk-size and CommonJS seed warnings remain non-blocking unless this release worsens them.

## Coolify release procedure

1. Complete and verify the coherent development change set.
2. Inspect the current production deployment and database state without exposing credentials.
3. Create a production database backup.
4. Confirm committed migration order and development-to-production schema delta.
5. Trigger the existing Coolify deployment without replacing its dependency-layer or startup conventions.
6. Run committed migrations exactly once through the established production mechanism.
7. Verify health, canonical public routes, Admin authentication, public privacy, protected contact, and a non-destructive booking gate.
8. If a release blocker appears, stop and restore through the established checkpoint/database backup path rather than improvising destructive fixes.

## Completion criteria

The release is complete only when:

- directory, contact, booking, and SEO capabilities are demonstrably independent;
- all required existing-system enhancements work together;
- production migrations and rollback safety are understood;
- all release tests and build gates pass;
- no known critical/high security or data-integrity blocker remains; and
- the existing Coolify production deployment is healthy after live verification.
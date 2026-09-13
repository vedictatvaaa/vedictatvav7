# Pandit Live Metrics and Storefront Content Design

## Purpose

Replace synthetic Pandit social-proof claims with real database-backed metrics and add a one-time, Admin-reviewed AI workflow that improves Pandit-entered storefront text for search engines and AI discovery.

## Fixed storefront design constraint

The existing Pandit storefront design is fixed.

- Do not change its layout, styling, visual hierarchy, components, navigation, gallery presentation, catalogue presentation, service presentation, or booking controls.
- Do not redesign or restyle `/pandit/:panditSlug`.
- Only improve Pandit-entered textual content and the SEO editorial fields rendered through the existing design.
- Dynamic factual fields such as services, prices, availability, reviews, catalogue items, and eligibility continue to use their existing components and authoritative data sources.

The canonical storefront URL remains:

`/pandit/:panditSlug`

Example:

`https://vedictatva.com/pandit/acharya-rahul-sharma`

Location changes must not change the canonical storefront URL.

## Genuine activity metrics

The public Pandit directory may show:

- **Serving now**: distinct devotees attached to bookings whose authoritative lifecycle status means the Puja is currently in progress.
- **Served in the last 24 hours**: distinct devotees attached to qualifying active or completed Puja bookings during the rolling previous 24 hours.
- **Pujas booked**: genuine qualifying Puja bookings, excluding cancelled, rejected, expired, deleted, and test records.
- **Pandits in our network**: legitimate enrolled Pandit records across all states and cities.
- **Discoverable Pandits**: Pandits satisfying the public directory/search eligibility policy.
- **Online now**: eligible Pandits with a genuine heartbeat within the existing five-minute presence window.
- **Available to book**: published Pandits satisfying booking eligibility now.

An enrolled Pandit is not automatically described as online, available, published, or discoverable.

Metrics must:

- Come from authoritative booking, Pandit, presence, publication, and governance sources.
- Expose aggregate counts only, never devotee or Pandit private data.
- Use one shared server definition for all public and Admin surfaces.
- Include an update timestamp and data-health status.
- Return unavailable/error states rather than synthetic fallback numbers.
- Refresh short-lived presence and active-booking values at an appropriate bounded interval.
- Avoid excessive database load through a short aggregate cache where appropriate.

Existing hard-coded claims such as `500+ Pandits`, `10k+ Families`, `50+ Pujas`, and conflicting family totals must be removed or replaced by verified metrics.

## Public presentation

Add a compact activity/network strip to the Pandit directory without changing the Pandit storefront design.

The strip distinguishes:

- Current activity
- Previous-24-hour activity
- Network size
- Discoverable, available, and online status

Zero is a valid value. The UI must not hide a genuine zero or replace it with marketing copy.

## One-time AI content formatting

AI improves only text derived from verified Pandit and catalogue facts:

- Profile introduction or biography
- Short professional tagline
- Service overview
- SEO title
- Meta description
- Fact-grounded FAQs
- Concise AI-search summary

AI must not create or infer:

- Qualifications
- Experience
- Services or rituals
- Prices
- Languages
- Location or travel coverage
- Reviews or ratings
- Availability
- Awards, certificates, affiliations, or guarantees
- Medical, financial, legal, or guaranteed spiritual outcomes

## Source snapshot and provenance

Each generation records:

- Pandit ID and canonical storefront URL
- Hash of the factual source snapshot
- Approved source fields used
- Prompt version
- Model identifier
- Generated draft
- Generation timestamp
- Lifecycle status
- Reviewer and publisher audit metadata

No phone, email, password data, authentication data, private application fields, or unpublished private notes are sent to the model.

## Editorial lifecycle

1. Admin opens a Pandit storefront content record.
2. The system displays the verified source facts.
3. Admin requests generation with explicit confirmation.
4. AI produces a draft only.
5. Admin compares the current text and generated text.
6. Admin may edit, regenerate, approve, or reject.
7. Publication requires explicit Admin approval.
8. Published text is written atomically and audited.
9. Repeated requests are idempotent unless Admin deliberately requests regeneration.

Pandits may continue entering their own profile facts through existing forms. Their changes do not bypass Admin editorial review.

## Dynamic freshness

AI prose is not regenerated on page load.

When material source facts change:

- Recalculate the source hash.
- Mark the approved editorial as stale.
- Keep current safe published text until a replacement is reviewed.
- Show the stale reason in Admin.
- Allow Admin to regenerate only the affected editorial.

Dynamic facts continue to update without AI:

- Published service catalogue
- Authoritative prices
- Booking eligibility and availability
- Genuine review aggregates
- Governance and publication status
- Canonical location

## Search and AI discovery

Only publicly eligible, published storefronts may enter discovery outputs.

For each indexable storefront:

- Emit one self-referencing canonical `/pandit/:panditSlug`.
- Render factual `Person`, service, breadcrumb, and offer structured data only where supported by authoritative data.
- Include the profile in the governed people/Pandit sitemap with accurate `lastmod`.
- Publish factual profile summaries through the existing AI-discovery surfaces, including `/llms.txt` or its linked factual feed.
- Notify existing sitemap and IndexNow publication mechanisms after a material approved change.
- Keep non-public, stale-governance, or blocked profiles out of indexable feeds.

This improves crawler accessibility but does not claim or guarantee inclusion in Google, ChatGPT, or other AI services.

## Admin modules

### Pandit Network Activity

- Show every metric with its exact definition.
- Show current value, update time, and health state.
- Identify unavailable or stale data without inventing replacements.

### Pandit Storefront Content

- Search/filter Pandits by generation and publication state.
- Show canonical URL and source facts.
- Generate one-time draft.
- Compare original and generated text.
- Edit, approve, reject, publish, or deliberately regenerate.
- Show stale source changes and indexing status.
- Preserve the existing storefront design.

### Existing modules

Extend the existing Pandit location and SEO governance modules rather than duplicating their responsibilities.

## Validation

- Verify metric SQL/status definitions against booking lifecycle behavior.
- Confirm test, cancelled, rejected, expired, and deleted bookings never inflate totals.
- Confirm online counts use the real heartbeat and survive unavailable presence with an honest error state.
- Confirm all public metric payloads are aggregate and private-safe.
- Confirm the existing Pandit storefront screenshot/layout is unchanged.
- Confirm AI requests contain approved factual fields only.
- Confirm AI drafts cannot publish without Admin review.
- Confirm unsupported claims are rejected or removed.
- Confirm source changes mark content stale.
- Confirm canonical, sitemap, structured-data, `lastmod`, and AI-feed behavior.
- Confirm unpublished or ineligible Pandits never become indexable through content generation.

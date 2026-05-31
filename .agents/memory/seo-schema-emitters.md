---
name: SEO JSON-LD schema emitters (avoid duplicate entities)
description: Where each schema.org node is emitted, so you don't add duplicates
---

This app emits JSON-LD from MULTIPLE places. Before adding a schema node, check
whether it already exists — duplicate entities (esp. Organization) weaken entity
consolidation and look noisy to Google.

**Brand / site-wide nodes:**
- `client/index.html` — STATIC `<script type="application/ld+json">` blocks:
  Organization (no @id, hardcoded sameAs/contact), WebSite, OnlineStore. These
  are the crawler-visible first-response copies.
- `client/src/components/OrganizationSchema.tsx` (mounted in App.tsx) — the
  CANONICAL dynamic Organization node with `@id` = `${origin}/#organization`,
  sameAs + contactPoint pulled from site settings; upgrades to LocalBusiness
  when a business street address exists. **This is the node WebSite.publisher
  and BlogPosting author.worksFor reference by @id.** Do NOT emit another
  Organization elsewhere.
- `client/src/components/SiteSchemas.tsx` (mounted in App.tsx) — WebSite (with
  SearchAction), SiteNavigationElement (ItemList), and per-route CollectionPage.
  References #organization by @id; deliberately does NOT define Organization.

**Per-page nodes** go through `<PageSeo schemas={[...]}>` using builders in
`client/src/lib/seo-schemas.ts` (productSchemaBuilder, blogPosting,
breadcrumbList, faqPage, etc.). Breadcrumb JSON-LD already exists on product
pages and most landing pages.

**Crawler visibility:** these component-emitted schemas run in client `useEffect`
(JS required). `server/seo-ssr.ts` injects title/og/canonical for no-JS crawlers
but NOT these JSON-LD graphs. Established pattern — Google executes JS for
JSON-LD, so it's acceptable, but don't assume non-JS crawlers see them.

**Why:** an explorer/architect can easily miss OrganizationSchema.tsx and
declare the #organization ref "dangling" — it isn't. Two separate sessions
nearly added a duplicate Organization node here.

**How to apply:** to change brand markup (logo, sameAs, contact, address) edit
OrganizationSchema.tsx (dynamic) + the static block in index.html (crawler
copy). To enrich a page type, edit the builder in seo-schemas.ts.

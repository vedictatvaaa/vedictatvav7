# SEO Metadata Consistency Design

## Goal

Ensure that the metadata a crawler receives in the initial HTML is the same metadata
the browser has after React hydration and SPA navigation. The scope includes title,
description, canonical, robots, Open Graph, Twitter, and hreflang values, plus
stable site-wide Organization and WebSite JSON-LD entities.

## Architecture

The server and client will share one metadata contract:

- URL helpers normalize locale prefixes, trailing slashes, absolute URLs, canonical
  URLs, and the reciprocal `en-IN`, `hi-IN`, and `x-default` alternate links.
- SSR head injection renders every required metadata value from that contract and
  removes the generic template values before inserting the route-specific block.
- `PageSeo` owns metadata for pages with explicit page SEO and writes every value
  deterministically, including clearing optional values that are absent on the next
  route.
- `SeoHead` remains the fallback/admin-managed owner only when no `PageSeo` is
  mounted, and does not overwrite page-owned metadata.

The existing `OnlineStore` graph remains a separate commerce entity. Organization
and WebSite use stable origin-based IDs (`/#organization` and `/#website`) in both
the static template and hydrated DOM. Hydration updates marked static/SSR nodes
instead of adding duplicates. Page schemas remain keyed by their existing
per-page IDs.

## Data flow

1. A public HTML request resolves route metadata on the server.
2. SSR removes generic title, canonical, alternate, robots, OG, Twitter, and
   conflicting JSON-LD tags from the template.
3. SSR inserts the normalized metadata and route schemas.
4. React mounts. Site-wide schema components reconcile the marked Organization,
   WebSite, and OnlineStore nodes.
5. The active page SEO component reconciles the same metadata values and removes
   stale optional tags/schemas.
6. SPA navigation repeats steps 4–5 without leaving values from the previous route.

If a storage lookup fails, SSR continues with the existing fallback behavior rather
than preventing the page from loading. Client-side API failures use the existing
fallback metadata and never replace explicit `PageSeo` values.

## Schema coverage

Representative route fixtures cover the homepage, product, category, Pandit
storefront, booking, and blog pages. Their page schemas must be valid JSON-LD and
must not introduce a second Organization or WebSite entity with a different ID.

## Validation

Add automated checks that:

- fetch raw HTML for representative routes and extract metadata;
- render the same routes in a browser after hydration;
- compare title, description, canonical, robots, OG, Twitter, and hreflang values;
- assert exactly one canonical Organization and WebSite node by stable ID, while
  allowing the separate OnlineStore node;
- validate that representative page schema payloads parse and expose the expected
  type without conflicting duplicate entities.

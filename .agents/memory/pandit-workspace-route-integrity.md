---
name: Pandit workspace route integrity
description: Why private Pandit portal paths need an explicit exception in public route resolution
---

Private Pandit workspace URLs share the `/pandit/:slug` namespace used by public Pandit storefronts. The public route resolver must recognize `/pandit/login`, `/pandit/portal`, and `/pandit/reset-password` as registered application routes before attempting storefront lookup.

**Why:** Without the exception, unauthenticated shared links return the SPA shell with HTTP 404, which harms direct navigation and can prevent browsers from evaluating the dedicated install manifest reliably.

**How to apply:** When adding or renaming private Pandit routes, update the resolver exception and its route-integrity test alongside the React route and manifest path detection.
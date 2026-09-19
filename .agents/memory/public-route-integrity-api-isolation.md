---
name: Public route integrity API isolation
description: Prevent public-page SEO validation from poisoning API response status codes.
---

Public route integrity and SEO-not-found middleware must exclude `/api` paths explicitly, regardless of request `Accept` headers, and normalize the `/hi` locale prefix before matching registered SPA routes.

**Why:** Browser `fetch()` commonly sends `Accept: */*`. A late-registered API route once produced correct JSON and database results but inherited HTTP 404 from the public-page integrity middleware, causing every client refresh to reject valid analytics data. Without locale normalization, direct Hindi twin URLs returned 404 even though client-side navigation rendered them.

**How to apply:** Keep API routes before public SPA catch-alls when practical, retain a path-level `/api` exclusion in public navigation middleware, strip `/hi` only for route-manifest resolution, and cover both the API isolation and Hindi hard-navigation contracts with middleware tests.
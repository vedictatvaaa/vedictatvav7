---
name: Dev route additions need a workflow restart
description: New Express routes appear to "not register" (return SPA HTML 200) until the Start application workflow is restarted.
---

When adding a brand-new Express route (e.g. a new `/sitemap-*.xml` or
`/api/admin/...` endpoint) in dev, the route can return the SPA `index.html`
with HTTP 200 instead of running your handler — and admin routes that should
401 will also fall through — until the `Start application` workflow is
restarted.

**Why:** `tsx watch` does not reliably re-register newly added Express routes
on file save; the Vite catch-all keeps serving the SPA for the unmatched path.
The handler only takes effect after a full process restart.

**How to apply:** After adding (not just editing) a route, call
`restart_workflow("Start application")` before curl-testing. If a new endpoint
returns SPA HTML or an unexpected 200, restart first — don't assume the route
code is wrong.

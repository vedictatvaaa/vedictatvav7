---
name: Coolify restart discipline
description: Why Coolify builds and container starts must avoid repeated native compilation and automatic schema pushes.
---

Keep dependency installation before source copies so Docker can reuse the dependency layer. Preserve the last Coolify-proven dependency graph unless dependency upgrades are intentional and tested separately; a persistent content-addressed npm download cache is safe with that graph. Treat committed SQL migrations as the production schema authority. `drizzle-kit push` must remain an explicit opt-in operation rather than part of every container restart.

**Why:** A broad, unrelated lockfile refresh changed transitive Tailwind/Vite entries and rewrote some tarball URLs to Replit's internal package firewall. Coolify then failed during `npm ci` with npm 10.9.4's generic “Exit handler never called” message, before native rebuilds ran. Restoring the last successful public-registry graph fixed the Coolify publication. A clean Node 20 Alpine install also compiles native modules for several minutes, and an automatic schema push can delay startup beyond health-check windows.

**How to apply:** Source-only changes should reuse the Docker dependency layer. Keep Coolify lockfiles on public registry URLs and compare the lockfile checksum with the last successful build before publishing; do not accept Replit-internal registry URLs in a production lockfile. Do not run broad package updates as a side effect of removing or adding one dependency; make the smallest manifest/lockfile change and validate `npm ci` with Coolify's strict flags in a clean environment before publishing. On startup, wait explicitly for PostgreSQL, apply each committed migration once, then start the server; only enable schema push for an intentional maintenance deployment.

## Deployment queue recovery

Coolify can leave a deployment permanently `in_progress` at the repository clone step while the existing application remains healthy. A later deployment then stays queued behind it; cancel the stale deployment and its queued child before retrying.

**Why:** A verified Panditji PWA commit was present on the tracked branch, but repeated Coolify jobs stopped after `Cloning into ...` with no log or timestamp progress. The production container stayed on the previous build until the jobs were cancelled.

**How to apply:** Treat an unchanged deployment timestamp and unchanged clone log as a stale queue signal. Cancel only the stale deployment records for that application, confirm the current branch commit, then run one fresh deployment and verify the live routes—not merely the application health status.
---
name: Coolify restart discipline
description: Why Coolify builds and container starts must avoid repeated native compilation and automatic schema pushes.
---

Keep dependency installation before source copies so Docker can reuse the dependency layer. Preserve the last Coolify-proven dependency graph unless dependency upgrades are intentional and tested separately; a persistent content-addressed npm download cache is safe with that graph. Treat committed SQL migrations as the production schema authority. `drizzle-kit push` must remain an explicit opt-in operation rather than part of every container restart.

**Why:** A broad, unrelated lockfile refresh changed hundreds of package versions and made npm 10.9.4 terminate with “Exit handler never called” only on the Coolify builder, even with lifecycle scripts disabled and a clean cache. Restoring the last successful dependency graph while removing only the retired provider fixed deployment. A clean Node 20 Alpine install also compiles native modules for several minutes, and an automatic schema push can delay startup beyond health-check windows.

**How to apply:** Source-only changes should reuse the Docker dependency layer. Do not run broad package updates as a side effect of removing or adding one dependency; make the smallest manifest/lockfile change and validate a completely clean Docker builder before publishing. On startup, wait explicitly for PostgreSQL, apply each committed migration once, then start the server; only enable schema push for an intentional maintenance deployment.
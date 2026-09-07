---
name: Coolify restart discipline
description: Why Coolify builds and container starts must avoid repeated native compilation and automatic schema pushes.
---

Keep dependency installation before source copies so Docker can reuse the dependency layer, but do not mount a persistent BuildKit npm download cache for this project. Treat committed SQL migrations as the production schema authority. `drizzle-kit push` must remain an explicit opt-in operation rather than part of every container restart.

**Why:** A clean Node 20 Alpine install compiles Swiss Ephemeris from C++ source for several minutes, and the subsequent Vite transform is memory-heavy. After a large lockfile rewrite, Coolify's persistent npm cache caused npm's reifier to terminate with “Exit handler never called” and leave an invalid dependency tree, while the same Docker instruction succeeded from a clean cache. Separately, an automatic schema push can delay server startup beyond health-check windows.

**How to apply:** Source-only changes should reuse the Docker dependency layer. Use a clean npm cache when package manifests change, install the lockfile without lifecycle scripts, then explicitly rebuild required native/install-script packages. Give first-time builds enough memory and time. On startup, wait explicitly for PostgreSQL, apply each committed migration once, then start the server; only enable schema push for an intentional maintenance deployment.
---
name: Coolify restart discipline
description: Why Coolify builds and container starts must avoid repeated native compilation and automatic schema pushes.
---

Keep dependency installation before source copies in the Dockerfile, preserve BuildKit's npm cache, and treat committed SQL migrations as the production schema authority. `drizzle-kit push` must remain an explicit opt-in operation rather than part of every container restart.

**Why:** A clean Node 20 Alpine install compiles Swiss Ephemeris from C++ source for several minutes, and the subsequent Vite transform is memory-heavy. Separately, an automatic schema push can delay server startup beyond health-check windows. Together these make harmless Git updates look like recurring deployment failures.

**How to apply:** Source-only changes should reuse the dependency layer. Give first-time/no-cache builds enough memory and time. On startup, wait explicitly for PostgreSQL, apply each committed migration once, then start the server; only enable schema push for an intentional maintenance deployment.
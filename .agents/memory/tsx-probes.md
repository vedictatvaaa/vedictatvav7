---
name: One-off TSX probes
description: How temporary TypeScript data-probe scripts must be structured in this Replit.
---

Temporary TSX scripts stored under `/tmp` compile as CommonJS in this project. Use static absolute workspace imports and wrap asynchronous work in an async IIFE rather than using top-level await.

**Why:** Dynamic import specifiers and top-level await both failed when running a one-off `/tmp` probe with `npx tsx`.

**How to apply:** For disposable database or storage probes outside the repository, import workspace modules by absolute path and execute async work inside `(async () => { ... })()`.
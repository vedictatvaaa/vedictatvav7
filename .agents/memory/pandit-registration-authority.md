---
name: Pandit registration authority
description: Durable boundary for the Panditji signup and application flows
---

The Panditji signup screen is a complete application entry point, not a lightweight lead-capture form. It must submit through the same canonical application contract as the standalone application, preserving state/city IDs, exact-location verification, service selection, photo, terms, and existing approval gates.

**Why:** A compact handoff creates a second registration path that can drift from the authoritative application rules and makes applicants complete the real form elsewhere.

**How to apply:** Reuse the full application registration component and API contract for signup. Keep `/become-pandit` working as a standalone route, but do not create server-side records or alternate submission semantics from the access screen.
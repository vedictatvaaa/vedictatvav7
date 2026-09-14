---
name: Pandit onboarding contracts
description: Signup service choices must be validated against the specialist Puja catalogue allowlist, not only active catalogue status.
---

New Pandit onboarding accepts exactly five unique services from the active specialist Puja catalogue; active catalogue rows of unrelated service types are not valid substitutes.

**Why:** The catalogue contains multiple service families, while onboarding and approval assume specialist Puja assignments. Counting arbitrary active rows can make fixtures and future clients appear valid while the route correctly rejects them.

**How to apply:** Derive signup choices from the same `puja`, `katha`, and `ritual` service-type policy used by the server, and keep location consent, review-only coordinates, profile photo, services confirmation, and booking readiness as separate gates.
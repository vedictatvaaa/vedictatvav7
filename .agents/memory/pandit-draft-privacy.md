---
name: Pandit draft privacy boundary
description: Security and data-minimization rules for resumable Panditji registration drafts.
---

Treat every registration resume link as a bearer credential. Store only a one-way token hash, redact tokenized routes and draft bodies from logs, and return draft responses with private no-store caching.

Never persist profile photos, exact coordinates, location permission, or final terms consent in a resumable draft. Resume at the earliest step that requires those details so applicants explicitly provide them again.

**Why:** Drafts contain applicant contact and address data, so a leaked link grants access to sensitive registration data. Photos, exact location, and consent also require a fresh user action and should not survive through a draft.

**How to apply:** Any new draft field, logging middleware, analytics event, cache, or resume-link feature must preserve this boundary. Server-owned expiry and orphan-upload cleanup must not rely only on the browser remaining open.
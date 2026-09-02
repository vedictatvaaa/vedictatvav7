---
name: Knowledge Graph semantic revisions
description: Why graph freshness revisions must exclude operational source-table updates.
---

Source entity revisions must advance only when public eligibility, canonical URL identity, display name, or allowlisted public summary fields change.

**Why:** If counters, login/activity timestamps, or unrelated operational fields advance revisions, ordinary traffic makes active edges stale and turns the singleton generation row into a write hotspot.

**How to apply:** Keep each source type's semantic trigger allowlist aligned with its public eligibility, URL, and DTO projection. When those public semantics change, update the allowlist and freshness tests together; never add operational fields.
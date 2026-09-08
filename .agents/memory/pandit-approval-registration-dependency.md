---
name: Pandit approval registration dependency
description: The Pandit application approval transaction depends on a persistent PostgreSQL sequence for lifetime registration IDs.
---

The Pandit approval flow cannot complete unless the numeric registration sequence exists and is initialized at or above the configured minimum. A deployment can appear to have the registration columns and still fail approval if the sequence was omitted.

**Why:** Approval failed with a generic 500 because the database had the registration columns but not the sequence used by `nextval`; focused contract tests did not exercise the live database dependency.

**How to apply:** Keep sequence creation idempotent in migrations, initialize it from existing numeric registration values without casting legacy prefixed values, and verify `to_regclass(...)` plus one `nextval(...)` in development before release.
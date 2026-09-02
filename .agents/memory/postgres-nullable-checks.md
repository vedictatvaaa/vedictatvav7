---
name: PostgreSQL nullable CHECKs
description: Why discriminator constraints must reject NULL explicitly instead of relying on IN predicates.
---

PostgreSQL `CHECK` constraints pass when their expression evaluates to either true or unknown. An expression such as `value IN ('A', 'B')` therefore does not reject a null value by itself.

**Why:** A polymorphic location identity briefly allowed an ambiguous null discriminator even though the constraint appeared to require one of two values.

**How to apply:** Whenever a discriminator or conditional field is mandatory, include an explicit `IS NOT NULL` branch in the database constraint and verify it with a real insertion probe, not only a schema-text test.
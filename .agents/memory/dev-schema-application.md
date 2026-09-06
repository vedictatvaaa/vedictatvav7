---
name: Development schema application
description: Additive schema changes must be applied to the development PostgreSQL database before startup seeds query the new column.
---

Additive database changes require both a uniquely sequenced migration file and an explicit development-database schema apply; this project does not automatically execute migration files during application startup.

**Why:** The server seeds data before registering routes, so a new Drizzle field can make startup fail immediately when the development database has not been updated.

**How to apply:** Use the database tooling for the development schema, keep migration numbering unique, and verify startup after the change. Production schema changes remain publish-managed.
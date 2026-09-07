---
name: Development schema application
description: Additive schema changes must be applied to the development PostgreSQL database before startup seeds query the new column.
---

Additive database changes require a uniquely sequenced migration file, an explicit development-database schema apply, and confirmation that the migration is tracked by Git. Production applies committed SQL migrations during container startup.

**Why:** The server seeds data before registering routes, so a new Drizzle field can make development startup fail immediately when the database has not been updated. The repository also had a global SQL ignore rule that silently omitted a production migration even though it existed and had been applied locally.

**How to apply:** Use the database tooling for the development schema, keep migration numbering unique, verify the new file appears in `git status`/the remote tree, and verify development startup. Production startup should log the migration as applied or already applied before launching the server.
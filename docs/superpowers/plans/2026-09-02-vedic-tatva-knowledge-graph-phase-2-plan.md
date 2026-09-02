# Vedic Tatva Knowledge Graph Phase 2 Implementation Plan

**Design:** `docs/superpowers/specs/2026-09-02-vedic-tatva-knowledge-graph-phase-2-design.md`

## Delivery rules

- Execute phases in order because each phase establishes contracts required by the next.
- Commit each completed phase separately.
- Keep the public projection gate disabled through implementation and verification.
- Do not infer relationships, destination classifications, or Yatra mappings.
- Never delete or overwrite source records through graph operations.
- Preserve existing public URLs and Pandit SEO authority.
- Treat migration, audit, and launch-gate failures as release blockers.

## Phase 1 — Freeze source and compatibility contracts

1. Inventory the stable keys, slugs, route shapes, public fields, and consumers for:
   - `client/src/lib/tirth-yatras-data.ts`;
   - the Temple Tourism source currently embedded in `client/src/pages/temple-tourism.tsx`;
   - `tirth_yatra_tours`;
   - `tirth_yatra_inquiries`;
   - current Tirth, Temple, and Yatra public routes.
2. Extract source data into importable modules without changing public behavior.
3. Create a reviewed classification manifest for every Temple Tourism entry:
   - `TEMPLE` for actual individual shrines;
   - `TIRTH` for approved sacred destinations or regions;
   - `LEGACY_ONLY` when classification is not sufficiently certain.
4. Create a reviewed manifest for Yatra-to-Tirth mappings. Use stable source keys and explicit entries only.
5. Define route-parity fixtures for existing slugs, response shapes, page headings, and inquiry behavior.
6. Add contract tests proving:
   - every source entry has exactly one reviewed classification;
   - no classification is generated dynamically;
   - source keys and preferred slugs are unique;
   - all explicit mappings resolve;
   - no Yatra tour is treated as a Tirth source record.
7. Extend `server/knowledge-graph/registry.ts` only for approved combinations missing from the current registry, including reviewed `YATRA → associated_with → TIRTH`.
8. Run focused contract tests and `git diff --check`.
9. Commit the frozen source and compatibility contracts.

## Phase 2 — Canonical persistence and migration

1. Add Drizzle schema in `shared/schema.ts` for:
   - canonical Tirth records;
   - canonical Temple records;
   - canonical slug aliases;
   - Knowledge Graph public launch state and cache generation;
   - any required provenance and migration-key fields.
2. Define constraints for:
   - stable integer identities;
   - unique immutable migration keys;
   - unique canonical slugs within the relevant namespace;
   - bounded status and provenance values;
   - valid aliases and non-self aliases;
   - disabled public gate default;
   - explicit null handling in conditional checks.
3. Add migration `0007` with indexes for slug, migration key, status, aliases, public eligibility, and graph lookups.
4. Implement deterministic preflight and backfill scripts under `script/`:
   - validate manifests before writes;
   - transactionally upsert by immutable source key;
   - import only reviewed Tirth and Temple classifications;
   - leave `LEGACY_ONLY` rows untouched;
   - never copy `tirth_yatra_tours` into Tirth;
   - create only explicit reviewed Yatra-to-Tirth relationships;
   - emit bounded count and content-hash verification.
5. Add migration and backfill tests covering duplicate keys/slugs, alias ambiguity, idempotent reruns, source counts, and transaction rollback.
6. Define operational rollback:
   - disable the public gate first;
   - retain aliases needed by public routes;
   - never automatically delete canonical rows that have graph references;
   - require explicit verification before removing migration-owned data.
7. Apply the development migration once.
8. Verify tables, indexes, constraints, disabled gate state, source counts, hashes, and idempotent rerun behavior.
9. Commit canonical persistence and migration.

## Phase 3 — Canonical destination services, Admin APIs, and graph adapters

1. Add focused repository and service modules under `server/knowledge-graph/` or a dedicated destination submodule for:
   - bounded list, search, and detail;
   - create and patch;
   - validated publication transitions;
   - slug and alias management;
   - migration provenance;
   - public eligibility.
2. Add protected Admin routes for Tirth and Temple management using the existing Admin middleware and same-origin CSRF policy.
3. Make source mutations and redacted audit entries atomic.
4. Exclude hard-delete routes; support archival or unpublication instead.
5. Add public read/compatibility DTOs containing only required public fields.
6. Implement database-backed Tirth and Temple consumers behind compatibility interfaces.
7. Preserve existing route behavior for classified and `LEGACY_ONLY` entries:
   - canonical database reads for migrated records;
   - unchanged legacy rendering for unclassified records;
   - explicit aliases for changed slugs.
8. Resolve inquiries to canonical IDs while preserving compatibility with historical free-text slugs.
9. Add Tirth and Temple adapters to `server/knowledge-graph/entity-adapters.ts`.
10. Extend graph summary, search, orphan, health, connection counts, and quality-rule support.
11. Remove client-side Tirth/Temple exclusions only after live adapter verification passes.
12. Add tests for Admin authorization, actor integrity, privacy, publication transitions, aliases, route parity, inquiry compatibility, adapter behavior, typed graph identity, and source-deletion safety.
13. Restart the workflow and verify protected live endpoints.
14. Commit destination services and graph integration.

## Phase 4 — Governed CSV preview, apply, and export

1. Add a versioned CSV contract module with canonical columns, limits, normalization rules, and schema-version handling.
2. Add memory-bounded multipart upload using the existing 5 MB convention.
3. Parse only UTF-8 CSV with:
   - allowlisted headers;
   - duplicate-header detection;
   - bounded rows, columns, cells, and metadata;
   - controlled enum and integer parsing;
   - typed Location discriminators.
4. Implement dry-run validation for:
   - controlled registry combinations;
   - source and target existence;
   - self-links;
   - duplicates in the file and database;
   - update identity;
   - status, display order, and metadata;
   - stale or publicly ineligible endpoints.
5. Return row-level normalized actions, errors, warnings, and aggregate counts without writing graph data.
6. Add an opaque preview store:
   - short expiry;
   - Admin ownership;
   - normalized server-side rows;
   - database-state fingerprint;
   - single-use invalidation after successful apply.
7. Implement one transactional bulk repository operation:
   - revalidate the token and every row;
   - reject state drift;
   - apply all creates and updates;
   - write one bounded summary audit entry;
   - roll back the whole batch on any failure.
8. Add template and export routes with bounded filters or streaming.
9. Use RFC4180-compatible quoting, CRLF, UTF-8 BOM, safe filenames, and spreadsheet formula neutralization.
10. Add downloadable error CSV output using the same safety rules.
11. Add tests for malformed files, all size bounds, formulas, discriminators, duplicates, expired/foreign tokens, state drift, uniqueness races, rollback, audit atomicity, and source-record preservation.
12. Commit the governed CSV backend.

## Phase 5 — Public projection, preview, gate, and cache

1. Add a read-only projection service that accepts typed source identity and returns bounded groups.
2. Enforce:
   - global gate enabled;
   - `ACTIVE` relationships only;
   - valid source and target records;
   - public eligibility;
   - valid canonical target URLs;
   - current registry compatibility;
   - stale-edge exclusion;
   - deterministic ordering and canonical-URL deduplication.
3. Define a minimal public DTO with canonical name, URL, safe summary, entity type, and controlled relationship label.
4. Add a public related-content endpoint that returns an empty projection when the gate is disabled and never reveals draft or private graph state.
5. Add Admin preview using the exact public projection rules while bypassing only final gate enablement.
6. Add server-side enablement checks for:
   - canonical migration integrity;
   - stale active edges;
   - active quality-rule failures;
   - target canonical URLs;
   - current projection contract verification.
7. Add an authenticated enable/disable mutation with transactional audit. Client flags must not bypass blockers.
8. Add a short cache keyed by typed identity, projection contract version, and gate generation.
9. Invalidate or advance generation after relevant relationship, rule, destination, alias, publication, or gate mutations.
10. On cache or projection failure, hide only the optional public section and log a redacted error.
11. Add projection, ordering, eligibility, duplicate suppression, gate, preview parity, cache invalidation, and failure-isolation tests.
12. Verify the gate remains disabled.
13. Commit public projection and launch control.

## Phase 6 — Responsive Admin and public UI

1. Extend `client/src/components/admin/knowledge-graph/types.ts` and `hooks.ts` for destinations, CSV operations, public preview, and gate control.
2. Add Admin destination management:
   - search and pagination;
   - provenance and migration key display;
   - editorial editing;
   - publication eligibility;
   - slug and alias workflow;
   - link to graph detail.
3. Add the CSV workspace:
   - template download;
   - upload;
   - validation summary;
   - row table and mobile cards;
   - filters for creates, updates, skips, warnings, and errors;
   - downloadable error rows;
   - apply confirmation;
   - expired and state-conflict recovery.
4. Add public projection preview and launch control:
   - counts by type and relationship;
   - representative links;
   - blockers;
   - explicit disabled/enabled state;
   - confirmed enable and immediate disable.
5. Add reusable public related-content query and component modules.
6. Integrate them only into detail pages with verified stable numeric identity:
   - Puja;
   - Pandit;
   - Article;
   - Service;
   - Product;
   - Yatra;
   - Tirth;
   - Temple.
7. Preserve existing manually curated sections and collapse duplicate canonical URLs.
8. Ensure semantic headings/lists, keyboard support, focus visibility, announced validation summaries, reduced-motion compatibility, mobile alternatives, and no page-wide overflow.
9. Run production build and inspect desktop/mobile Admin and public pages while the gate remains disabled.
10. Commit the responsive UI.

## Phase 7 — Controlled public verification and final release gate

1. Run focused destination, migration, graph, CSV, projection, gate, and UI contract tests.
2. Run the complete server regression suite.
3. Run the production build and `git diff --check`.
4. Verify migration objects, canonical counts, manifest coverage, aliases, and idempotency in development.
5. Restart the workflow once and inspect server and browser logs.
6. Run one authenticated real-browser Admin journey:
   - manage a canonical destination safely;
   - export a relationship CSV;
   - preview a valid and invalid import;
   - apply a temporary valid batch;
   - verify transactional audit;
   - clean up only temporary graph rows;
   - inspect launch blockers and preview;
   - verify desktop and mobile behavior.
7. Verify the public endpoint and representative pages expose no graph content while the gate is disabled.
8. In a controlled development check, satisfy launch requirements, enable the gate, verify representative related sections, then disable the gate again before release.
9. Confirm host public pages remain functional during projection failure.
10. Run architecture, security, privacy, accessibility, and source-deletion-safety review.
11. Confirm:
   - no AI or inference path exists;
   - no source hard deletion exists;
   - no public graph-generated landing pages or speculative JSON-LD were added;
   - Pandit SEO authority and existing public routes remain intact;
   - the public gate is disabled in the final development state.
12. Correct all release blockers and rerun only invalidated checks.
13. Commit final corrections.
14. Push `vedictatvav7` to GitHub.
15. Verify local HEAD, remote branch HEAD, and GitHub branch hash match exactly.

## Release acceptance checklist

- Every source entry has one explicit reviewed classification.
- Classified Tirth and Temple records have stable canonical IDs and routes.
- `LEGACY_ONLY` records continue rendering without forced conversion.
- Yatra tours remain separate from destinations.
- Tirth and Temple work across all graph Admin and health workflows.
- CSV preview performs no writes.
- CSV apply is Admin-bound, revalidated, atomic, and audited.
- Export and error CSVs are spreadsheet-safe.
- Public projection is active-only, public-safe, bounded, and deterministic.
- Gate enablement is server-controlled and fails closed.
- Gate is disabled by default and disabled in final release state.
- Optional graph sections cannot break host pages.
- Source entities survive every graph deletion and failed batch.
- Full tests, build, migration, browser, logs, reviews, Git checks, and GitHub verification pass.
# Vedic Tatva Knowledge Graph Phase 1 Implementation Plan

**Design:** `docs/superpowers/specs/2026-09-02-vedic-tatva-knowledge-graph-phase-1-design.md`

## Phase 1 — Persistence and controlled graph domain

1. Add Drizzle schema for relationships and configurable quality rules.
2. Add migration `0006` with constraints, unique edge protection, and lookup indexes.
3. Implement controlled entity and relationship registries.
4. Implement existing-entity adapters with Admin-safe normalized DTOs.
5. Implement validation for entity existence, combinations, self-links, metadata, pagination, and duplicates.
6. Add focused registry, adapter, and migration contract tests.
7. Apply the development migration and verify schema objects.
8. Commit the foundation.

## Phase 2 — Graph queries, health, audit, and Admin APIs

1. Implement relationship CRUD without mutating source entities.
2. Implement paginated entity search, entity details, incoming/outgoing connections, autocomplete, summary metrics, orphan detection, and recent activity.
3. Implement quality-rule CRUD and health evaluation.
4. Integrate existing Admin session authorization and audit conventions.
5. Propagate database and adapter failures; expose bounded, private-field-safe DTOs.
6. Register Admin routes and targeted cache invalidation.
7. Add authorization, lifecycle, privacy, failure, duplicate, deletion-safety, orphan, and health tests.
8. Restart the workflow, verify live authorization, and commit the API phase.

## Phase 3 — Responsive Admin control center

1. Add Knowledge Graph to existing Admin navigation and lazy module loading.
2. Build overview metrics and recent activity.
3. Build paginated Entity Explorer with type/status/search filters.
4. Build entity detail with accessible grouped connections and responsive SVG relationship map.
5. Build bounded relationship autocomplete and create workflow.
6. Build confirmed relationship removal.
7. Build orphan explorer.
8. Build quality-rule management and linked health findings.
9. Implement loading, empty, error, mobile, keyboard, focus, and reduced-motion states.
10. Run production build, inspect the UI at desktop/mobile sizes, fix findings, and commit the Admin phase.

## Phase 4 — Final release gate

1. Run focused graph tests and the complete server regression suite.
2. Run production build and diff checks.
3. Restart the workflow and inspect server/browser logs.
4. Run one real-browser journey covering dashboard, search, entity detail, relationship create/remove, orphan view, and quality health.
5. Run architecture/security review and correct all blockers.
6. Verify source entities survive relationship removal and no private fields appear in graph responses.
7. Confirm rollout introduces no public routes and does not alter the Pandit SEO projection.
8. Commit final corrections.
9. Push `vedictatvav7` to `origin` and verify the local and GitHub branch hashes match.
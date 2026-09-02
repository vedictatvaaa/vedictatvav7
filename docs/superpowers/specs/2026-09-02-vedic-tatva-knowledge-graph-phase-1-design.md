# Vedic Tatva Knowledge Graph — Phase 1 Design

## Purpose

Phase 1 adds a governed relationship layer and Admin control center above Vedic Tatva's existing records. It does not replace, copy, or redesign the existing Pandit, Puja Library, service, location, product, article, temple, tirth, yatra, review, booking, SEO, authentication, or deployment systems.

The graph lets authorized administrators describe factual connections between existing entities, inspect graph coverage, find orphan records, and evaluate explicitly configured quality expectations. No AI or background process creates or modifies relationships in Phase 1.

## Supported entity types

The first release supports existing records that have stable integer IDs and reliable server-side resolution:

- `PUJA`
- `PANDIT`
- `LOCATION`
- `TIRTH`
- `TEMPLE`
- `PRODUCT`
- `ARTICLE`
- `SERVICE`
- `REVIEW`
- `YATRA`

Each type is implemented through an entity adapter. An adapter owns:

- existence checks;
- public display name;
- normalized status;
- canonical URL, when one already exists;
- last-updated timestamp, when available;
- bounded search;
- Admin-safe summary fields.

Adapters read current source tables directly. There is no duplicate graph entity table and no copied entity content.

`LOCATION` represents existing canonical State and City records through a typed metadata discriminator. It does not introduce a second location hierarchy.

## Relationship model

`knowledge_graph_relationships` stores directed edges:

- integer identity primary key;
- source entity type and existing entity ID;
- controlled relationship type;
- target entity type and existing entity ID;
- `ACTIVE` or `DRAFT` status;
- bounded display order;
- optional JSON metadata restricted to a safe object;
- authenticated Admin creator;
- creation and update timestamps.

Database constraints and service validation prevent exact duplicate edges. Indexes support:

- source entity;
- target entity;
- relationship type;
- source plus relationship type;
- target plus relationship type;
- status.

Deleting an edge never deletes or updates either source entity.

## Controlled relationship definitions

Initial relationship types:

- `performed_by`
- `specializes_in`
- `available_in`
- `located_in`
- `offers`
- `related_to`
- `related_article`
- `related_product`
- `associated_with`
- `contains`
- `available_puja`
- `related_service`
- `related_tirth`
- `related_temple`
- `related_yatra`
- `discusses`

A server-side relationship registry defines valid source and target combinations. The browser never submits arbitrary relationship definitions. Extending the registry remains possible without changing the generic edge schema.

Examples:

- `PUJA → performed_by → PANDIT`
- `PANDIT → specializes_in → PUJA`
- `PUJA → available_in → LOCATION`
- `PANDIT → located_in → LOCATION`
- `PANDIT → offers → SERVICE`
- `PUJA → related_article → ARTICLE`
- `PUJA → related_product → PRODUCT`
- `TIRTH → contains → TEMPLE`
- `TIRTH → available_puja → PUJA`
- `ARTICLE → discusses → PUJA`
- `SERVICE → performed_by → PANDIT`
- `SERVICE → available_in → LOCATION`

The service rejects invalid combinations, missing entities, prohibited self-links, malformed metadata, and duplicates before persistence.

## Configurable quality rules

`knowledge_graph_quality_rules` stores explicit coverage expectations:

- source entity type;
- relationship type;
- one or more allowed target entity types;
- minimum required relationship count;
- active status;
- Admin creator;
- timestamps.

Rules describe editorial or operational expectations only. They must not encode assumptions about religious correctness.

Health states are:

- Connected
- No relationships
- Only one relationship
- Missing configured relationship
- Invalid or stale relationship

The final two states are derived from current entity existence and active quality rules.

## Admin information architecture

Knowledge Graph is a first-class Admin module integrated into the existing responsive Admin shell and `?tab=` navigation convention.

The module provides these views:

### Overview

Live database-derived metrics:

- total supported entities;
- total relationships;
- connected entities;
- orphan entities;
- pending draft relationships;
- counts by entity type;
- counts by relationship type;
- recent relationship activity.

Missing or unsupported entity sources show zero or are omitted without breaking the dashboard.

### Entity Explorer

Server-paginated entity list with:

- entity-type filter;
- normalized status filter;
- bounded text search;
- connection count;
- existing entity ID;
- last updated time;
- canonical URL when available.

Selecting an entity opens its graph detail view.

### Entity detail

Displays the entity's normalized identity and groups incoming and outgoing connections by type. Every connected entity is clickable.

The visual relationship map uses responsive SVG and existing UI primitives rather than a new graph dependency. It supports:

- clear node-type distinction;
- directional relationship labels;
- clickable connected nodes;
- responsive overflow and mobile fallback;
- lightweight zoom controls where they do not harm accessibility.

The textual connection groups remain the authoritative accessible representation.

### Add relationship

An Admin opens a dialog from an entity detail view:

1. Source defaults to the current entity.
2. Relationship options are limited by the source type.
3. Target types are limited by the selected relationship.
4. Target search calls a bounded server autocomplete endpoint.
5. Save performs authoritative server validation.
6. Success refreshes detail, summary, orphan, and health data.

The selector never loads an entire entity table into the browser.

### Remove relationship

Removal requires a confirmation dialog naming the complete edge. The API deletes only the relationship row and records the authenticated Admin in the audit trail.

### Orphan entities

A paginated, searchable view of existing entities with zero active incoming or outgoing graph relationships, grouped or filtered by type.

### Graph health and rules

Displays current health findings and allows Admins to create, activate, deactivate, edit, or remove explicit quality rules. Findings link back to the affected entity.

## API design

All routes are Admin-only and use existing Admin session authorization:

- `GET /api/admin/knowledge-graph/summary`
- `GET /api/admin/knowledge-graph/entities`
- `GET /api/admin/knowledge-graph/entities/:type/:id`
- `GET /api/admin/knowledge-graph/entities/search`
- `GET /api/admin/knowledge-graph/orphans`
- `GET /api/admin/knowledge-graph/health`
- `GET /api/admin/knowledge-graph/relationship-definitions`
- `POST /api/admin/knowledge-graph/relationships`
- `PATCH /api/admin/knowledge-graph/relationships/:id`
- `DELETE /api/admin/knowledge-graph/relationships/:id`
- `GET /api/admin/knowledge-graph/quality-rules`
- `POST /api/admin/knowledge-graph/quality-rules`
- `PATCH /api/admin/knowledge-graph/quality-rules/:id`
- `DELETE /api/admin/knowledge-graph/quality-rules/:id`

List endpoints use bounded page sizes and normalized query parameters. Responses expose only adapter-produced Admin-safe DTOs, never complete source rows.

## Data flow and consistency

1. The Admin UI requests normalized graph data.
2. The graph service queries relationships and delegates source identity resolution to entity adapters.
3. Mutations run authorization, schema validation, relationship-registry validation, entity existence checks, and duplicate checks.
4. Successful mutations write an audit record and invalidate only Knowledge Graph query keys/caches.
5. Existing source records remain untouched.

Stale edges remain visible as health findings to Admins, but unavailable source data is not silently converted into a valid empty result. Database and adapter failures propagate as explicit server errors.

The Pandit SEO network remains a separate authoritative projection for public Pandit SEO. Phase 1 may link to its existing canonical URLs but does not derive or persist graph edges from that projection.

## Security and privacy

- Every graph endpoint requires an authenticated Admin session.
- Actor identity comes only from the authenticated session.
- Entity IDs are parsed and bounded server-side.
- Entity and relationship types come from controlled registries.
- Search terms, pagination, metadata, and display order are bounded.
- Metadata rejects dangerous prototypes and unsupported values.
- DTOs contain no credentials, contacts, payment data, internal review notes, or other private source fields.
- Errors for missing entities do not expose unrelated source data.
- Relationship deletion cannot cascade into source tables.
- Mutations are auditable.

## UI direction

The module follows the existing Vedic Tatva Admin shell and design tokens while presenting a denser, relationship-oriented workspace. It uses existing typography, warm heritage colors, responsive navigation, dialogs, command search, cards, badges, tables, and error boundaries.

The interface prioritizes scanability and operational clarity:

- meaningful hierarchy rather than decorative dashboards;
- keyboard-operable controls;
- visible labels and focus states;
- one primary heading per view;
- clear loading, empty, error, and destructive-confirmation states;
- mobile alternatives for wide tables and graph layouts;
- reduced-motion compatibility.

No existing public page or Admin module is redesigned.

## Testing and release gates

### Database and service tests

- migration and index existence;
- duplicate prevention;
- valid and invalid relationship combinations;
- missing source and target handling;
- prohibited self-links;
- metadata and pagination bounds;
- source records survive relationship deletion;
- stale-edge detection;
- configurable quality-rule evaluation;
- orphan detection;
- adapter DTO privacy;
- database and adapter failure propagation.

### Route tests

- all endpoints reject unauthenticated access;
- actor identity uses the Admin session only;
- CRUD lifecycle;
- bounded autocomplete;
- consistent pagination;
- safe not-found responses;
- targeted cache invalidation.

### UI verification

- Overview, explorer, detail, relationship creation/removal, orphan, and health flows;
- desktop and mobile layouts;
- keyboard interaction and focus;
- loading, empty, error, and confirmation states;
- no large unbounded browser payloads.

### Final release checks

- development migration applies successfully;
- focused and full server tests pass;
- production build passes;
- workflow restarts cleanly;
- browser tests pass;
- architecture and security review passes;
- changes are committed and pushed to the configured GitHub branch.

## Out of scope for Phase 1

- AI-generated relationships;
- automatic relationship persistence;
- public Knowledge Graph pages;
- replacing existing SEO projections;
- replacing source entity models;
- religious correctness inference;
- bulk imports;
- recommendation algorithms;
- a new graph database;
- a heavy graph visualization dependency.
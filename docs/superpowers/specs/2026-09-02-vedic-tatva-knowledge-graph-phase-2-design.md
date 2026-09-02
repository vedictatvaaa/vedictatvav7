# Vedic Tatva Knowledge Graph — Phase 2 Design

## Purpose

Phase 2 turns the governed Admin-only graph foundation into a broader editorial and public SEO capability without weakening source ownership or launch safety.

The release has three ordered outcomes:

1. establish canonical database records for Tirth and Temple entities;
2. let Admins validate, import, and export relationships in bulk;
3. project reviewed relationships into gated public related-content sections and internal links.

Phase 2 does not use AI or automatic semantic inference to create relationships. Existing records remain authoritative, and public graph output remains disabled until an Admin deliberately enables it after health checks pass.

## Scope and delivery order

Phase 2 is delivered through three dependent milestones.

### Milestone A — Canonical destinations

- Add authoritative Tirth and Temple source records.
- Migrate existing static destination content without duplicating Yatra products.
- Preserve established public slugs and routes.
- Add Admin management, public compatibility APIs, and graph adapters.

### Milestone B — Bulk editorial operations

- Add a versioned CSV template and relationship export.
- Add upload, parse, normalization, and dry-run validation.
- Add a preview UI with row-level errors and prospective actions.
- Add an atomic apply operation with transactional audit.

### Milestone C — Gated public projection

- Add a read-only public relationship projection.
- Add Admin preview and launch-health controls.
- Add related-content sections to selected existing public detail pages.
- Keep the launch gate disabled by default.

Milestone B depends on canonical destination identity from Milestone A. Milestone C depends on both canonical destination integrity and governed bulk operations.

## Canonical entity architecture

### Tirth

A Tirth is a canonical pilgrimage destination, sacred region, or destination guide. It is not a commercial tour.

The authoritative Tirth model uses a stable integer primary key and includes:

- unique canonical slug;
- name;
- normalized publication status;
- concise and long-form editorial content required by current pages;
- canonical location references where available;
- coordinates where currently available;
- hero and supporting media references;
- bounded structured editorial fields required by the existing experience;
- source provenance;
- migration source key;
- created and updated timestamps.

Public eligibility requires a published status, a valid canonical slug, and all fields required by the relevant public route.

### Temple

A Temple is a canonical individual temple or shrine.

The authoritative Temple model uses a stable integer primary key and includes:

- unique canonical slug;
- name;
- normalized publication status;
- description and travel/editorial fields required by Temple Tourism;
- category or tradition labels currently used by the experience;
- canonical Tirth or location association where explicitly known;
- coordinates where currently available;
- media references;
- source provenance;
- migration source key;
- created and updated timestamps.

Public eligibility follows the same fail-closed publication and canonical-URL rules as Tirth.

### Yatra remains separate

The existing Yatra tour table continues to represent a sellable itinerary or offering. A Yatra is never treated as a Tirth merely because names or slugs are similar.

Reviewed graph relationships connect the concepts:

- `YATRA → associated_with → TIRTH`;
- `TIRTH → contains → TEMPLE`;
- `TIRTH → available_puja → PUJA`;
- other combinations already approved by the controlled registry.

Tour-to-destination mappings are explicit editorial decisions. Migration code must not infer them from fuzzy name similarity.

## Source migration and compatibility

### Tirth migration

The current editorial Tirth guide dataset is imported into canonical Tirth records using its established guide slugs as migration keys and preferred canonical slugs.

The existing database Yatra tours are not copied into the Tirth table. Where a reviewed mapping exists, a relationship connects the tour to the destination after both records exist.

### Temple migration

The current Temple Tourism dataset is imported into canonical Temple records using its established string IDs as migration keys and preferred canonical slugs.

The migration preserves the content, coordinates, categories, and route behavior used by the current experience.

### Idempotency and conflicts

Migration and seed operations are idempotent by immutable migration source key and canonical slug.

The migration fails explicitly when:

- two source records claim the same canonical slug;
- one source key maps to multiple records;
- a route-preservation alias is ambiguous;
- required public fields cannot be represented safely;
- a reviewed cross-source mapping references a missing record.

No conflict is resolved by silently overwriting a different canonical record.

### Route preservation

Existing public URLs remain valid throughout migration.

- Established slugs are retained whenever possible.
- If canonicalization requires a new slug, an explicit alias maps the old slug to the canonical record.
- Existing pages move to database-backed reads only after parity checks pass.
- Compatibility endpoints or adapters may temporarily preserve current response shapes.
- Inquiry and conversion flows must resolve canonical IDs rather than depending permanently on free-text synthetic slugs.

### Source ownership

Tirth and Temple tables are the authoritative source records after migration. The Knowledge Graph stores only typed references to them.

Deleting a relationship never deletes, unpublishes, or edits a Tirth, Temple, Yatra, or any other source record.

## Knowledge Graph integration

The Phase 1 polymorphic relationship table remains unchanged unless a strictly necessary compatible constraint or index migration is identified.

The Tirth and Temple adapters provide:

- existence checks;
- normalized status;
- public display name;
- canonical URL;
- updated timestamp;
- bounded search;
- Admin-safe summary fields;
- public-eligibility evaluation.

Once canonical records and adapter tests pass, Tirth and Temple become available in:

- Entity Explorer;
- relationship target search;
- relationship creation;
- orphan detection;
- graph health;
- quality rules;
- bulk CSV validation;
- public projection preview.

Entity identity remains `type + integer ID + optional discriminator`. Tirth and Temple do not use the Location discriminator.

## Canonical destination Admin management

Phase 2 adds focused Admin management for Tirth and Temple source records.

Admins can:

- search and paginate canonical records;
- inspect migration provenance;
- create and edit editorial records;
- change publication status through validated transitions;
- manage canonical slugs and aliases safely;
- verify public-route eligibility;
- open the corresponding Knowledge Graph detail.

Slug changes require conflict checks and preserve the prior public slug as an alias when safe. Destructive source deletion is excluded from this release. Archival or unpublication is used instead.

Every source mutation uses the authenticated Admin identity and appends a redacted audit entry in the same transaction.

## CSV contract

### Versioned format

The CSV contract includes an explicit schema version and these canonical relationship fields:

- relationship ID for updates, blank for creates;
- source entity type;
- source entity ID;
- source discriminator when required;
- relationship type;
- target entity type;
- target entity ID;
- target discriminator when required;
- relationship status;
- display order;
- JSON metadata;
- created and updated timestamps in exports.

Generated templates include headers and concise instructions but no production data.

### Limits

- Uploads use authenticated multipart requests.
- Maximum upload size is 5 MB.
- Row count, column count, cell length, and metadata size are bounded.
- Only UTF-8 CSV is accepted.
- Unknown columns, duplicate headers, malformed quoting, and unsupported schema versions are rejected.
- Parsing uses an allowlist rather than copying arbitrary cells into objects.

### Formula-injection safety

Exports use RFC4180-compatible quoting, CRLF line endings, UTF-8 BOM compatibility, filename sanitization, and neutralization of spreadsheet formulas beginning with `=`, `+`, `-`, `@`, tab, or carriage return.

Import normalization reverses only the exporter’s documented neutralization convention. It does not execute or evaluate spreadsheet formulas.

## Dry-run preview

CSV upload performs no graph writes.

The preview returns:

- normalized row identity;
- prospective action: create, update, or skip;
- exact duplicate status;
- warnings;
- row-specific errors;
- aggregate create, update, skip, warning, and error counts;
- a short-lived opaque preview token or fingerprint.

Validation includes:

- controlled entity and relationship registries;
- supported source-target combinations;
- entity ID bounds;
- required Location discriminators;
- endpoint existence;
- prohibited self-links;
- exact duplicate detection;
- update target existence;
- status and display-order bounds;
- safe metadata validation;
- repeated rows within the uploaded file;
- conflicts with current database state;
- canonical URL and public eligibility warnings where relevant.

Invalid rows remain visible and downloadable as an error CSV. Preview responses never expose private source fields.

## Atomic apply

Apply accepts the preview token rather than trusting client-resubmitted normalized rows.

Before writing, the server:

1. verifies the token, owner Admin, schema version, and expiry;
2. revalidates every row against current registries and source records;
3. verifies the database state still matches the preview fingerprint;
4. opens one database transaction;
5. applies all creates and updates;
6. records one summary audit entry in the same transaction;
7. commits only if every operation succeeds.

Any stale preview, uniqueness race, invalid row, audit failure, or database error rolls back the complete batch.

Phase 2 supports create, update, and skip. It does not support replacement imports, relationship deletion by CSV, source creation, source deletion, or source mutation.

The audit record contains bounded counts, schema version, file fingerprint, and result metadata. It never stores raw CSV, credentials, private source fields, or full uploaded metadata.

## Export

Authenticated Admins can export:

- all graph relationships within bounded filters;
- relationships for one entity type;
- relationships for one relationship type;
- active or draft relationships;
- current preview errors.

Large exports use bounded pagination or streaming rather than loading the complete graph into application memory.

The exported relationship format can be corrected and re-imported using the same schema version.

## Public relationship projection

### Eligibility

The public projection returns only relationships that satisfy every condition:

- the global Knowledge Graph public launch gate is enabled;
- the relationship is `ACTIVE`;
- both source and target exist;
- the source is eligible for the current public route;
- the target is publicly eligible;
- the target has a valid canonical URL;
- the relationship combination remains allowed by the server registry;
- the edge is not stale or invalid.

Drafts, unsupported endpoints, private fields, graph metadata, Admin identity, and health diagnostics never appear in public responses.

### Direction and grouping

The projection preserves relationship direction. Public sections use controlled human-readable labels and group links by relationship type.

Results are ordered deterministically by:

1. explicit display order;
2. normalized display name;
3. typed stable identity.

Each page and relationship group has a conservative item limit. The service never performs an unbounded graph traversal.

### Initial page integration

Reusable related-content sections may be integrated into established public detail pages for:

- Puja;
- Pandit;
- Article;
- Service;
- Product;
- Yatra;
- Tirth;
- Temple.

The section renders only when at least one eligible related item exists.

Existing manually curated sections remain authoritative. Graph content may supplement them but must not silently remove, reorder, or duplicate manually curated links. Duplicate canonical URLs are collapsed deterministically.

### SEO boundaries

Phase 2 adds internal links and related-content sections only.

It does not:

- create graph-generated landing pages;
- change canonical URLs;
- change robots or sitemap eligibility by itself;
- invent anchor text from metadata;
- emit speculative relationship JSON-LD;
- override existing Pandit SEO publication or indexability rules.

Public link labels come from canonical source names and controlled relationship labels.

## Launch gate and preview

The Knowledge Graph public projection has a dedicated Admin setting that defaults to disabled in all environments.

### Preview

Before launch, Admins can inspect:

- participating public entity counts;
- projected section counts by source and relationship type;
- target canonical URLs;
- duplicate suppression;
- blocked, stale, or ineligible edges;
- representative page previews;
- current gate blockers.

Preview uses the exact projection rules used publicly but bypasses only the final global enablement check. It remains Admin-only.

### Enablement requirements

The enable mutation re-evaluates health server-side and fails closed unless:

- no stale active edge participates in public projection;
- no active quality rule fails for participating public entity types;
- every projected target has a valid canonical URL;
- canonical Tirth and Temple migration integrity checks pass;
- public projection contract checks are current and successful.

The Admin cannot bypass these blockers through client-supplied flags.

### Disablement and rollback

Disabling the gate immediately removes graph-powered public sections without deleting source records or relationships.

This is the primary operational rollback. Existing manually curated content and routes remain unaffected.

## API design

All destination management, CSV, preview, health, and launch-control routes are Admin-only and use the existing Admin session middleware.

Expected route families:

- `/api/admin/tirths`;
- `/api/admin/temples`;
- `/api/admin/knowledge-graph/import/template`;
- `/api/admin/knowledge-graph/import/preview`;
- `/api/admin/knowledge-graph/import/apply`;
- `/api/admin/knowledge-graph/export`;
- `/api/admin/knowledge-graph/public-preview`;
- `/api/admin/knowledge-graph/public-gate`;
- `/api/public/knowledge-graph/related/:type/:id`.

Exact HTTP methods and response DTOs are fixed in the implementation plan, but these constraints are mandatory:

- bounded pagination and search;
- explicit content types;
- no arbitrary registry values;
- typed Location identity;
- redacted errors;
- no private source rows;
- conditional public caching;
- consistent 400, 401, 403, 404, 409, and 5xx semantics.

The public endpoint returns an empty eligible projection when the gate is disabled. It must not reveal that draft or private relationships exist.

## Caching and invalidation

Public projections use a short bounded cache keyed by:

- source entity type and ID;
- source discriminator where applicable;
- projection contract version;
- launch-gate generation.

Relationship, quality-rule, canonical source, slug/alias, publication-status, and launch-gate mutations invalidate affected projection keys or advance the gate generation.

Cache failures trigger a bounded fresh query. They do not return fabricated relationships or break the host public page.

Any change to the public response shape increments the projection contract version.

## Error handling

- Canonical migration conflicts fail explicitly and leave existing consumers unchanged.
- Missing adapters never produce misleading empty Admin results.
- CSV parse and row errors are deterministic and downloadable.
- Preview expiry or state drift returns a conflict and requires a new preview.
- Apply is all-or-nothing.
- Launch checks fail closed when dependencies are unavailable.
- Public projection failures hide only the optional related-content section and are logged without exposing Admin or source-private data.
- Unsupported or ineligible edges remain available to Admin health tooling but never become public.

## Security and privacy

- All mutations derive actor identity from the authenticated Admin session.
- Cookie-authenticated writes retain existing same-origin CSRF checks.
- CSV uploads are memory, size, row, cell, and type bounded.
- Uploaded filenames and cell values are never trusted as paths or executable content.
- Metadata follows the Phase 1 safe-object rules.
- Preview tokens are opaque, short-lived, Admin-bound, and single-use or invalidated after apply.
- Public DTOs expose only canonical names, URLs, safe summaries, and controlled labels.
- Audit records are redacted and bounded.
- No operation accepts source deletion or cascades from graph rows into source tables.

## Accessibility and responsive behavior

The Admin CSV workspace provides:

- keyboard-operable upload and actions;
- accessible tabular and mobile-card preview modes;
- announced validation summaries;
- row errors associated with their cells;
- clear loading, empty, expired, conflict, and success states;
- downloadable error rows;
- confirmation before apply;
- responsive operation without page-wide horizontal overflow.

Public related-content sections use semantic headings and lists, descriptive link text, visible focus states, reduced-motion-safe interactions, and no graph visualization requirement.

## Testing strategy

### Canonical source coverage

- migration object and constraint contracts;
- expected source counts and stable migration keys;
- idempotent reruns;
- duplicate slug and alias conflicts;
- static-to-database content parity;
- legacy route preservation;
- Yatra/Tirth separation;
- inquiry canonical-ID resolution;
- Admin-safe and public-safe DTOs.

### Graph and CSV coverage

- Tirth and Temple adapter search and existence;
- typed identity and registry combinations;
- upload size and row bounds;
- malformed CSV and unknown columns;
- formula-injection-safe export;
- Location discriminator preservation;
- repeated rows and exact duplicates;
- create/update/skip previews;
- preview ownership, expiry, and state drift;
- uniqueness races;
- transactional rollback;
- transactional audit;
- source-deletion safety.

### Public projection coverage

- gate disabled by default;
- active-only relationship eligibility;
- source and target publication checks;
- stale and unsupported edge exclusion;
- deterministic grouping and ordering;
- duplicate URL suppression;
- bounded query counts;
- cache invalidation and contract versioning;
- preview/public rule parity;
- launch blocker enforcement;
- public failure isolation;
- existing Pandit SEO, canonical, sitemap, and public route regressions.

### Browser and release coverage

- authenticated destination management;
- CSV upload, preview, error export, apply, and post-apply refresh;
- desktop and mobile Admin layouts;
- launch preview and blocked enablement;
- controlled gate enable/disable;
- representative public related sections;
- browser and workflow logs;
- production build;
- complete server regression suite;
- architecture and security review;
- migration verification;
- clean Git state and matching GitHub branch hashes.

## Explicit exclusions

Phase 2 does not include:

- AI-generated relationships;
- automatically inferred semantic links;
- fuzzy automatic Yatra-to-Tirth mapping;
- public graph exploration;
- graph-generated landing pages;
- speculative relationship JSON-LD;
- CSV-driven deletion;
- source creation or mutation through relationship import;
- hard deletion of canonical Tirth or Temple records;
- automatic public launch;
- replacement of manually curated related content;
- changes to existing Pandit SEO publication authority.

## Acceptance criteria

Phase 2 is complete when:

1. canonical Tirth and Temple records replace static authority without breaking established public routes;
2. Yatra tours remain distinct and connect only through reviewed relationships;
3. Admins can export, preview, and atomically apply a versioned relationship CSV;
4. row errors, duplicates, conflicts, and stale previews are explicit and safe;
5. Tirth and Temple participate fully in graph search, relationships, orphan detection, health, and rules;
6. graph-powered public related sections remain disabled by default;
7. enablement is blocked until server-side health and canonical checks pass;
8. enabled projection exposes only active, valid, public, canonical links;
9. disabling the gate removes graph sections without affecting host pages or source data;
10. all focused, regression, build, browser, security, migration, and Git release gates pass.
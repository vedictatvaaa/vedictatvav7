# Puja Catalogue Governance Design

## Goal

Keep the existing `puja_types` catalogue authoritative while adding religious review ownership, normalized discovery taxonomy, source attribution, eligibility, completeness checks, and conflict blocking.

## Approval model

Admins manage editorial records. AI review is the baseline approval method; admin review and verified-Pandit review are optional upgrades. A named Pandit is never attributed unless the selected method is `pandit` and the referenced live Pandit record is verified.

Review states are `draft`, `in_review`, `approved`, and `changes_requested`; methods are `ai`, `admin`, and `pandit`. Approval requires source notes, at least one citation, complete guide content, valid taxonomy, and at least one eligible delivery mode. Only the `pandit` method additionally requires a live verified Pandit reviewer.

## Taxonomy

Each Puja stores normalized arrays for intentions, deities, ceremonies, festivals, and aliases. Regional or traditional variations are structured records with a name, region or tradition, and explanatory note.

The server trims values, removes case-insensitive duplicates, and uses normalized values for conflict detection and public filters.

## Completeness and conflicts

Completeness is computed from the current record rather than persisted. Required areas are identity, purpose, ritual explanation, ethics, benefits, samagri, FAQ, taxonomy, sources, and eligibility. Reviewer ownership is additionally required only when the chosen review method is `pandit`.

Conflicts are also computed live. Exact slug, normalized name, or alias collisions block approval and publication. Potential taxonomy overlaps are reported to admins for review but do not silently merge records.

## Publication

`isPublished` is not sufficient authority. Public APIs return a guide only when it is published, approved, complete, and conflict-free; a Pandit-reviewed guide also needs its named reviewer to remain verified. Valid, approved, conflict-free records publish automatically, including AI-reviewed records.

Any substantive edit to approved ritual content, taxonomy, sources, eligibility, or reviewer attribution automatically returns the guide to review and removes it from public results until it is approved again.

Existing records must be deliberately reviewed rather than being grandfathered into approval.

## Public experience

Catalogue filters and guide sections use approved normalized data only. Public list responses include taxonomy and delivery-mode eligibility. Detail pages show regional variations, source attribution, review date, and an accurate review disclosure: AI reviewed, editorial-team reviewed, or a named verified Pandit. Private Pandit information and internal review notes are not exposed.

Booking calls to action respect eligibility: virtual is offered only when online eligibility is approved, and home-visit booking only when in-person eligibility is approved.

## Admin experience

The Puja Library displays review state, method, completeness, conflicts, and missing requirements. Editors can manage taxonomy, structured variations, citations, source notes, review method, conditional Pandit attribution, eligibility, and review notes. Publishing an incomplete, unapproved, or conflicting record is rejected server-side with actionable errors.

## Verification

Pure governance tests cover normalization, completeness, conflict detection, and publication gates. API behavior is verified through focused checks, the production build, migrated constraints, and one visual review of the admin/public catalogue surfaces.
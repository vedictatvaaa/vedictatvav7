# Legacy Pandit Profile Completion Review

## Status

Design approved in conversation for implementation planning. The initial dry-run scope is every existing Pandit record with at least one missing governed profile field. Visibility and archive state are filters/status values, not automatic eligibility gates.

## Goal

Give Admin a safe, auditable way to review incomplete legacy Pandit profiles without inventing biography, education, languages, services, modes, service areas, coordinates, ratings, reviews, availability, or SEO claims.

The workflow must:

- run a read-only bulk dry-run;
- separate deterministic normalization, AI draft suggestions, and unknowable fields;
- cite the source fields used by every AI suggestion;
- preserve existing verified values and exact coordinates;
- support field-level approval/rejection and a safe deterministic batch approval;
- re-evaluate governance, directory, storefront, booking, and SEO state only after an approved change;
- never publish or expose a hidden profile automatically.

## Existing constraints and reuse

- `server/pandit-governance.ts` already calculates completeness, booking diagnostics, publication state, and safe audit payloads.
- `server/pandit-location-rectification.ts` demonstrates snapshot-based deterministic proposals, conflict guards, and coordinate preservation.
- `server/pandit-storefront-content.ts` already builds an allow-listed public-facts snapshot, hashes it, validates generated copy, and keeps generation/review/publication separate.
- `client/src/pages/admin-tabs/PanditLocationRectification.tsx` provides the Admin pattern for dry-run, persisted review proposals, explicit reasons, and high-confidence batch application.
- `client/src/pages/admin-tabs/PanditStorefrontContentTab.tsx` provides the Admin pattern for source-fact inspection and draft-only editorial review.

The new workflow should reuse these rules and patterns rather than merging unrelated location and editorial queues.

## Scope and definitions

### Legacy scan scope

The dry-run scans all existing rows in `pandits` and returns only records with one or more missing governed fields. Archived records may appear in the report with an archived status, but no operation in this workflow can make them public or bookable.

The default Admin filters are:

- all incomplete records;
- visible, hidden, archived, and unpublished state;
- missing field;
- deterministic, AI draft, or unknown finding class;
- pending, approved, rejected, applied, or stale review state.

### Governed profile fields

The first version covers:

- `pandits.bio`;
- `pandits.education`;
- `pandits.languages`;
- existing `pandits.serviceArea`;
- active `panditServices` assignments;
- each active service's `mode` and `serviceAreas`;
- source-grounded storefront biography and SEO draft fields.

Existing location IDs, canonical state/city values, latitude, longitude, coordinate provenance, ratings, review counts, availability, contact data, registration values, and verification state are outside the completion writer's field allow-list.

## Architecture

### 1. Pure profile completion analyzer

Add `server/pandit-profile-completion.ts` with pure, testable functions:

- build a redacted source snapshot from an Admin Pandit row and its active service rows;
- calculate missing governed fields using the same service facts used by governance;
- classify each finding as `deterministic`, `ai_draft`, or `unknown`;
- produce deterministic proposals only from values already present in the supplied record and active catalogue;
- produce source references as stable field paths, such as `pandits.specialization`, `pandits.bio`, `pandits.languages`, `pandit_services[].mode`, and `pandit_services[].serviceAreas`;
- hash the source snapshot for later conflict detection;
- produce a governance/booking/publication/SEO recalculation summary without mutating data.

Deterministic work is deliberately narrow:

- trim and normalize whitespace in supplied text;
- normalize known separators in an already populated language or service-area string without adding a value;
- match an already supplied service name/slug exactly to one active catalogue record;
- normalize an already supplied mode only when it exactly matches an approved alias;
- retain unresolved or ambiguous values as `unknown`.

No deterministic rule may turn a missing value into a guessed value.

### 2. Review and proposal persistence

Add an additive table for profile-completion review runs/proposals. Each field-level proposal stores:

- Pandit ID and run/batch ID;
- field key and proposal class;
- original value and proposed value;
- source snapshot hash;
- source field paths and a short evidence explanation;
- confidence and safe-batch eligibility;
- status: `pending`, `approved`, `rejected`, `applied`, or `stale`;
- Admin actor, reason, review timestamp, and apply timestamp.

The source snapshot must exclude phone, email, password/authentication fields, private contact values, customer data, and exact coordinates. The proposal table is review provenance, not a second public profile.

AI generations should also retain the existing storefront content generation provenance where the output is editorial copy. The profile-completion proposal links to that generation or stores its generation key, prompt version, model identifier, and source hash without duplicating private facts.

### 3. AI draft boundary

AI may generate only draft copy:

- biography/profile introduction;
- service overview;
- SEO title;
- meta description;
- AI-search summary.

The AI input is the allow-listed source snapshot already used by `buildPanditPublicFacts`, plus explicitly supplied legacy facts. The prompt must require source citations in the structured response. Each citation is a field path from the provided snapshot; citations outside the snapshot invalidate the response.

AI must not propose a new:

- education or qualification;
- language;
- service, mode, or service area;
- person, location, coordinate, rating, review, booking, availability, or verification claim.

The existing `validatePanditContentDraft` checks remain mandatory. An invalid, uncited, or unsupported draft is stored as failed/review-blocked metadata, never presented as an approvable change.

### 4. Admin API

Add protected routes in `server/pandit-profile-completion-routes.ts`:

- `POST /api/admin/pandit-profile-completion/dry-run`
  - read-only by default;
  - returns scan counts, per-Pandit findings, missing fields, source references, deterministic proposals, unknown reasons, and AI eligibility;
  - accepts filters but does not write profile data.
- `POST /api/admin/pandit-profile-completion/reviews`
  - persists a reviewed dry-run as proposals only after explicit confirmation;
  - no Pandit/profile/publication fields are changed.
- `GET /api/admin/pandit-profile-completion/reviews`
  - paginated queue with safe source facts and field-level statuses.
- `POST /api/admin/pandit-profile-completion/proposals/:id/approve`
  - requires Admin reason and expected source snapshot hash;
  - approves one deterministic or AI draft proposal.
- `POST /api/admin/pandit-profile-completion/proposals/:id/reject`
  - requires Admin reason and records rejection without changing the profile.
- `POST /api/admin/pandit-profile-completion/apply`
  - accepts selected proposal IDs and explicit confirmation;
  - allows a batch only for deterministic proposals marked `safeBatch`;
  - AI copy remains field-level review and writes to a storefront draft, never directly to published content.

Every write locks and re-reads the current Pandit/service rows, compares the source hash, validates the field allow-list, and skips stale proposals instead of overwriting newer Admin/Pandit data.

### 5. Apply and recalculation behavior

Application is transactional per Pandit:

1. lock the Pandit and relevant active service rows;
2. verify the source snapshot hash and proposal status;
3. apply only approved allow-listed deterministic values or explicit Admin-approved draft content;
4. never touch coordinates, location IDs, publication flags, search flags, booking flags, indexing mode, verification, ratings, reviews, contact values, or account state;
5. write an Admin audit record containing reason, proposal IDs, source hash, before/after allow-listed values, and skipped stale proposals;
6. recalculate completeness, booking diagnostics, effective public governance, and storefront/SEO stale state;
7. return the new diagnostics and any remaining unknown fields.

Approved AI biography/SEO content enters the existing storefront content draft/review lifecycle. It is not published by this workflow. A previously public record remains subject to the existing publication policy; a hidden or unpublished record remains hidden/unpublished.

## Admin UI

Add a dedicated section to the Admin Pandit tools, preferably a new `PanditProfileCompletionTab.tsx` or a clearly separated panel adjacent to the existing rectification tools.

The UI includes:

- “Run dry-run” with a read-only confirmation and scan summary;
- filters for visibility, archived state, missing field, finding class, and review status;
- one card per Pandit showing only safe identity/location labels and current governance state;
- field-level rows with current value, proposal/unknown state, evidence/source paths, and confidence;
- “Approve”, “Reject”, and “Edit with source” actions;
- a batch action enabled only when every selected proposal is deterministic and `safeBatch`;
- AI copy preview using the existing storefront editor pattern, with source facts and citations visible;
- explicit copy that approval does not publish or expose a profile;
- stale/conflict messages when the underlying record changed;
- a post-apply diagnostics summary showing remaining missing fields and unchanged visibility/publication state.

Manual entry is allowed only through an explicit Admin edit with a reason. The UI must not silently turn “unknown” into an empty string or a guessed value.

## Error handling and safety

- Unauthenticated callers receive the existing generic Admin authentication response.
- Public routes are not changed by this workflow.
- AI disabled, missing, invalid, rate-limited, timed out, or upstream-failing states produce a review-blocked AI finding with a sanitized category; deterministic findings remain usable.
- Raw provider payloads, authorization headers, keys, private contact values, and exact coordinates never appear in review responses or audit details.
- Snapshot conflicts produce `stale` results and require a fresh dry-run.
- Any failed transaction leaves the Pandit and service rows unchanged.
- No route in this workflow calls publication, directory enablement, search enablement, booking enablement, or indexing enablement.

## Verification plan

### Pure analyzer tests

- all missing fields are reported without invented values;
- populated values are normalized only within the deterministic allow-list;
- exact active catalogue matches become deterministic proposals;
- ambiguous and missing services/modes/areas become unknown;
- source paths are complete and private fields are absent;
- existing coordinates and governance flags never enter the writer allow-list.

### AI and content tests

- source citations are required and must refer to supplied fields;
- unsupported education, language, service, location, number, rating, or credential claims are rejected;
- accepted biography/SEO drafts remain draft/review status;
- disabled provider and sanitized provider failures do not create approvable AI changes.

### Route and transaction tests

- dry-run is read-only;
- proposal persistence does not mutate Pandit rows;
- single approval/rejection records actor/reason;
- deterministic safe batch applies only approved, current proposals;
- stale snapshot conflicts skip without overwriting;
- apply recalculates diagnostics but leaves hidden/unpublished records hidden/unpublished;
- protected routes do not expose contacts, credentials, or coordinates.

## Rollout

1. Add additive schema and pure analyzer tests.
2. Add dry-run and review persistence routes; verify read-only behavior.
3. Add field-level apply with snapshot locks and audit records.
4. Add Admin UI and run dry-runs without applying.
5. Enable deterministic safe-batch approval after route tests pass.
6. Enable AI draft generation only when provider status is ready; all AI drafts remain in existing review flow.
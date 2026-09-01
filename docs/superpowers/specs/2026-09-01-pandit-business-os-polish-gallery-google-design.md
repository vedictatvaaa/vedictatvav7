# Pandit Business OS Polish, Gallery, and Google Readiness

**Status:** Draft for user review  
**Date:** 2026-09-01  
**Scope:** Follow-up work for the Pandit Business OS foundation

## Summary

The Pandit Business OS foundation now provides the shell, Home command centre,
URL-addressable navigation, real dashboard metrics, mobile navigation, Calendar,
Messages, booking operations, and an accessible service dialog. The remaining
follow-up work has two connected goals:

1. Give the remaining Pandit workspace sections a consistent, polished Business
   OS experience without replacing their working business operations.
2. Replace the Gallery and Google Business placeholders with real, truthful
   readiness workflows.

The implementation will be staged around shared UI/data-state primitives and
session-scoped APIs. Existing booking, chat, samagri, call, payment, review,
membership, service-catalogue, and authentication systems remain authoritative.

This specification has been checked against the attached complete Pandit
Business OS brief. It keeps the foundation commitments intact while separating
the Gallery/Google and section-polish work from larger communication, analytics,
commission, and end-to-end commerce capabilities that need their own
implementation scope.

## Brief traceability and boundary

Already covered by the Business OS foundation and preserved here:

- canonical `/pandit/portal` access with legacy section links
- premium Vedic visual language and Vedic Tatva branding
- desktop grouped navigation and mobile top/bottom navigation
- real Home identity, Today cards, Store Power, Quick Actions, store sharing,
  QR, Calendar, booking detail, booking chat, service catalogue, and settings
- session-derived Pandit authorization and privacy-safe APIs
- existing booking, payment, commission, earnings, review, notification,
  availability, and storefront systems remaining authoritative
- real-data-only and explicit unavailable/empty states

Added or completed by this follow-up:

- a distinct Profile destination, in addition to Settings
- shared visual/state primitives applied across the remaining workspace sections
- Store Performance fields shown only when actual tracked data exists:
  store views, service views, booking enquiries, bookings, and completeness
- Pandit-owned Gallery management with admin-controlled publication status
- public storefront filtering to active, approved Gallery media
- Pandit-owned Google Business URL validation and readiness
- a separate OAuth connection state that cannot be inferred from a URL
- audited overlay, responsive, empty-state, privacy, and migration regressions

Explicitly not claimed by this follow-up:

- visitor/pre-booking chat, Pandit-to-Pandit chat, conversation categories, or
  message search where the current product has no corresponding persisted
  conversation system
- a new analytics event pipeline or untracked conversion-rate metrics
- a new notification delivery system or fake push/email/SMS events
- a new commission engine, retroactive commission changes, or payment processor
- a replacement booking/calendar/chat system

Those capabilities remain candidates for separate designs. Existing booking
messages and alerts continue to work through the systems already present.

## Goals

- Make all existing Pandit sections feel like one product.
- Preserve every existing mutation and operational workflow.
- Provide consistent responsive behavior at desktop and 320/360/390/430px.
- Give Pandits real Gallery ownership and management.
- Show a real Google Business URL readiness state.
- Define an OAuth adapter boundary without pretending OAuth exists when no
  supported Google Business connector is available.
- Expose only approved Gallery media on the public Pandit storefront.
- Add server-side tests for ownership, validation, privacy, and state semantics.

## Non-goals

- Replacing the existing booking, Calendar, Messages, payment, call, review,
  membership, service, authentication, or public storefront systems.
- Building a new visitor or Pandit-to-Pandit conversation system in this slice.
- Building a new analytics event platform.
- Replacing the existing commission or payment architecture.
- Using the global admin `googleBusinessProfileUrl` as Pandit-owned data.
- Reusing Google Sign-In as Google Business Profile authorization.
- Claiming or verifying a Google Business listing from the app without a
  supported Business Profile API connection.
- Storing Google access or refresh tokens in the application database.
- Adding fake Gallery images, fake Google connection states, or fake metrics.
- Migrating to a new object-storage provider during this slice.

## Current constraints and decisions

### Existing section behavior is preserved

The portal remains `/pandit/portal`, with section state in the URL. Existing
domain components and endpoints are wrapped or incrementally migrated rather
than rewritten in one high-risk change.

### Gallery storage uses the existing upload boundary initially

The current project already validates image MIME types, limits upload size, and
serves uploaded assets from `/uploads`. Gallery uploads will use that established
boundary with a dedicated Pandit-owned record and stricter response/privacy
rules. The implementation must never derive ownership from a client-provided
Pandit ID.

### Google readiness is capability-aware

The baseline feature stores and validates a Pandit-selected Google Business
Profile URL. It distinguishes missing, invalid, and valid URL states. OAuth
connection controls are represented as unavailable until the Replit integration
inventory exposes a supported Google Business Profile connector with the
required scopes. Google Sign-In, Google Search Console, Google Indexing, and
Google Merchant Center do not satisfy this requirement.

## User experience

### Shared Business OS section language

Every migrated section uses the same compositional language:

- a compact section eyebrow and clear title
- a short purpose statement
- a consistent action area
- real loading, empty, unavailable, error, and success states
- responsive content frames with no horizontal overflow
- clear primary versus secondary actions
- visible keyboard focus and semantic labels
- restrained motion for entry, refresh, save, and destructive confirmation

The navigation must include both Profile and Settings. Profile edits reuse the
existing Pandit profile API and remain distinct from account/settings controls.

Existing domain-specific controls remain visible where users need them. Shared
primitives must not hide booking actions, payment statuses, service constraints,
review replies, or membership purchase states.

### Section migration order

1. Storefront and Services, because they own the Gallery entry point and public
   readiness context.
2. Earnings and Payment Requests, because financial states need careful
   unavailable/error semantics.
3. Customers and Reviews.
4. Notifications, Tools, Membership, Referrals, Card, and Settings.
5. Final consistency pass across Home, Calendar, Messages, and Bookings.

Each section keeps its current API source and mutation behavior. The migration
is complete only when the section remains reachable by direct URL and its core
existing operations work.

### Gallery experience

The Gallery section provides:

- current media list in explicit display order
- upload with image type/size feedback
- preview before or immediately after save
- required or clearly optional alt text
- reorder controls that are usable without drag-and-drop
- remove with confirmation
- optimistic-feeling but server-confirmed save states
- empty state explaining what Gallery improves
- upload, validation, authorization, and network error states
- moderation state when media is awaiting admin approval

Only media records owned by the authenticated Pandit appear in the management
view. New uploads are server-marked with an admin-controlled moderation state;
only approved and active media appear on the public storefront. A failed upload
must not create a visible incomplete record.

### Google Business readiness experience

The Google Business section provides two separate status tracks:

1. URL readiness: whether a Pandit has saved a valid public Google Business
   Profile URL.
2. Connection readiness: whether a supported OAuth provider reports a real
   connection.

The section provides:

- explanation of what a Google Business Profile URL is used for
- URL input with inline format guidance
- server validation requiring HTTPS and recognized Google Business/Profile
  host/path patterns
- states:
  - `empty`: no URL saved
  - `invalid`: last submitted value failed validation
  - `ready`: a valid URL is saved
- connection states:
  - `not_connected`
  - `connected`: only if a supported OAuth adapter reports a real connection
  - `authorization_expired`: only when the provider reports expiry/revocation
  - `connection_error`: only when the provider reports a connection failure
  - `unavailable`: no supported connector is available
- link preview/open action only for a validated saved URL
- explicit disclaimer that a valid URL does not prove Google ownership
- future connection action that is disabled and labeled unavailable when no
  supported connector exists

The UI must not display “verified,” “connected,” “claimed,” or “synced” from a
URL alone.

## Data model

### Pandit Gallery Media

Add a dedicated table related to the Pandit:

- `id`
- `panditId`
- `storagePath` or public asset path
- `altText`
- `displayOrder`
- `isActive`
- `moderationStatus` (`pending`, `approved`, or `rejected`)
- `createdAt`
- `updatedAt`

Constraints:

- foreign-key or equivalent ownership relationship to the Pandit
- index by `panditId` and display order
- stable ordering for equal timestamps
- no client-supplied `panditId`
- no raw local filesystem path in public DTOs
- soft-disable or deletion semantics must prevent disabled media from public
  output
- Pandit uploads cannot self-approve media; moderation is admin-controlled
- public output requires both `isActive` and `moderationStatus = approved`

The exact table/column naming follows the repository schema conventions. A
migration is required, and it must be applied to the development database
before browser verification.

### Google Business readiness

Add Pandit-owned URL readiness data without copying global Site Settings:

- `googleBusinessProfileUrl` nullable
- `googleBusinessUrlValidatedAt` nullable timestamp for the last accepted URL
- no access token, refresh token, or secret in this table

Connection state is a provider-derived projection and is not a claim stored
from a browser-supplied value. A disconnected state does not delete the saved
URL.

OAuth connection metadata, if supported later, must reference a Replit-managed
connection rather than storing credentials locally. The browser receives only
sanitized connection/readiness state.

## Server architecture

### Gallery endpoints

Add authenticated, session-scoped endpoints under the existing Pandit API
boundary:

- `GET /api/pandit/gallery` lists the current Pandit’s Gallery media
- `POST /api/pandit/gallery` uploads a new image
- `PATCH /api/pandit/gallery/:id` updates alt text or active state
- `POST /api/pandit/gallery/reorder` reorders owned media
- `DELETE /api/pandit/gallery/:id` deletes or disables owned media

Routes are registered with the existing Pandit portal route conventions, with
the reorder route registered before the `:id` route. Every handler:

- uses `panditAuthMiddleware`
- reads Pandit identity only from `req.panditId`
- validates body and file constraints server-side
- verifies ownership before update/delete/reorder
- returns sanitized DTOs
- rejects path traversal and unsupported file references
- does not reveal another Pandit’s media existence

The upload flow writes the asset and database record in an order that avoids
public orphan records. If database persistence fails after a file write, the
server attempts cleanup and returns an explicit error.

### Public Gallery output

Extend the existing public Pandit storefront DTO with active, approved Gallery
media only. The public response includes:

- safe public asset URL
- alt text
- display order

It excludes Pandit IDs where not already public, upload paths, moderation
metadata, filesystem details, and private profile fields. Existing public
storefront eligibility checks remain authoritative.

### Google readiness endpoints

Add authenticated endpoints:

- `GET /api/pandit/google-business` reads the Pandit’s current URL/readiness
  state
- `PATCH /api/pandit/google-business` saves or clears a URL

Validation is shared between storage and response construction. Invalid URLs
are rejected with a user-safe validation message and are not persisted as ready.
The API returns a capability-aware state rather than interpreting a URL as an
OAuth connection.

### Optional Google OAuth adapter

Define a small server-side adapter interface with operations equivalent to:

- capability availability
- connection status
- begin connection
- disconnect
- readiness lookup

The adapter has no active provider implementation until the integrations
inventory provides a supported connector. When unavailable, the API returns
`unavailable` and the UI presents setup guidance. If a supported connector is
later attached:

- use the exact Replit-provided connection setup
- keep token refresh inside the managed connection client
- never cache or expose credentials
- handle missing scopes as a permission state
- handle disconnected/expired credentials explicitly
- allow disconnect without deleting the Pandit URL

## Client architecture

### Shared section primitives

Create focused, reusable components for:

- `PanditSectionFrame`
- `PanditSectionHeader`
- `PanditDataState`
- `PanditActionBar`
- responsive metric/status panels
- confirmation and mutation feedback

These are presentation/state primitives, not replacement business logic. They
accept explicit state and callbacks, and do not fetch data or infer ownership.

### Shared data hooks

Add typed hooks for:

- Gallery list and mutations
- Google readiness state and URL mutation
- public/storefront checklist invalidation

Use domain-specific query keys and invalidate only the affected data after
successful mutations. Use `Promise.allSettled` or equivalent partial-data
handling when independent panels load together.

### Gallery page

Add a real Gallery section component and connect it to the existing section
registry. It must support keyboard-accessible reorder controls, clear upload
progress/failure states, and a safe confirmation before removal. It must not
require drag-and-drop or assume desktop width.

The management view distinguishes pending moderation from an empty Gallery.
It must not promise public visibility before approval.

### Google Business page

Add a real Google Business section component connected to the section registry.
It uses the URL readiness API and presents OAuth as unavailable when no
supported connector exists. It must distinguish:

- “URL saved”
- “Google ownership not verified by this app”
- “OAuth unavailable”
- “OAuth connected” only when reported by a real provider adapter

Home Store Power should consume the same server state so the checklist cannot
disagree with the section page.

## Error handling and privacy

- All authenticated routes reject missing/expired sessions.
- All Pandit reads and writes are session-scoped.
- Gallery upload errors name the user-correctable problem without leaking
  filesystem or storage details.
- Public Gallery output is filtered by active/approved state.
- Google URL validation errors do not reveal provider credentials or internal
  connector metadata.
- Unsupported capabilities use `unavailable`, not `empty`, `0`, or fake
  success.
- Delete/reorder mutations are idempotent where practical.
- Existing rate limits and upload limits remain in force.

## Testing strategy

### Unit and server tests

- Gallery schema validation and file constraints
- Pandit A cannot list, update, reorder, or delete Pandit B media
- disabled/unapproved media is absent from public DTOs
- Pandit cannot mark Gallery media approved
- ordering is stable and deterministic
- failed persistence does not leave a visible public record
- Google URL acceptance/rejection for valid and invalid hosts/schemes
- clearing a URL returns `empty`
- URL readiness never returns `connected` by itself
- optional adapter returns `unavailable` when no connector exists
- provider-reported disconnected, expired, and error states remain explicit
- response privacy excludes filesystem and credential fields
- existing public storefront eligibility tests remain green

### Browser tests

- migrate each section and verify direct URL navigation
- Profile and Settings remain distinct and reachable
- tracked Store Performance fields are displayed only when supported by existing
  analytics data
- section loading, empty, unavailable, error, and success states
- Gallery upload, preview, alt text, reorder, remove, and refresh
- Gallery mobile behavior at 320/360/390/430px
- public storefront displays only active approved Gallery media
- Google URL save, invalid URL feedback, clear, refresh, and unavailable OAuth
  state
- Home checklist reflects the same Gallery/Google state as their sections
- booking detail, Calendar, Messages, service dialog, and logout regressions

### Release checks

- production build
- schema migration and rollback review
- `git diff --check`
- workflow restart
- fresh workflow/browser logs
- desktop visual pass
- 320/360/390/430px overflow pass
- no new browser console errors attributable to this work

## Rollout sequence

1. Add shared section primitives and migrate one low-risk section.
2. Add and test the Gallery schema, ownership APIs, and public DTO filtering.
3. Add the Gallery management UI and Home checklist integration.
4. Add Pandit-owned Google URL data, validation API, and readiness screen.
5. Add the optional OAuth adapter boundary and expose unavailable state when no
   connector is available.
6. Migrate the remaining sections through the shared primitives.
7. Run full backend, build, workflow, browser, privacy, and responsive checks.
8. Commit each coherent stage and keep the existing portal usable after every
   stage.

## Acceptance criteria

- Every existing Pandit workspace section uses the shared Business OS language
  without losing existing operations.
- Gallery media can be managed by its owner and appears publicly only when
  active/approved.
- Google URL readiness is real, validated, Pandit-owned, and clearly distinct
  from ownership verification or OAuth connection.
- No credentials are stored in the application database or exposed to the
  browser.
- Existing booking, chat, samagri, calls, payments, reviews, services,
  Calendar, authentication, and storefront behavior remains functional.
- Existing visitor/Pandit chat, notification, analytics, and commission
  capabilities are not silently reimplemented or falsely marked complete.
- Home, Gallery, and Google Business agree on readiness states.
- Desktop and all target mobile widths pass without horizontal overflow.

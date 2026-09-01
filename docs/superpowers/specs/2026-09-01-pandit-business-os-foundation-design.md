# Vedic Tatva Pandit Business OS Foundation

**Date:** 2026-09-01  
**Status:** Approved design; implementation plan pending user review

## Goal

Replace the current Pandit portal UI composition with a premium, mobile-first
Business OS foundation. An approved Pandit should experience the portal as a
digital business headquarters, not as an admin/profile panel.

The foundation must answer four questions immediately:

1. Who am I?
2. What is happening today?
3. How is my store performing?
4. What should I do next?

The rewrite is a frontend composition rewrite, not a replacement of the
existing authentication, booking, service, storefront, availability, review,
payment, chat, or notification systems.

## Scope

### Included in this implementation

- A new Business OS shell while retaining `/pandit/portal` as the canonical
  route.
- A new Home/Overview section as the default authenticated Pandit section.
- Desktop sidebar with grouped business navigation and persistent store actions.
- Dedicated mobile top bar, slide-out navigation, and bottom navigation.
- URL-addressable section state with refresh and browser-history support.
- Real-data hero with Pandit identity, approval/verification state, city, and
  experience only when stored.
- Today command centre:
  - today's bookings
  - pending booking requests
  - unread messages
  - today's earnings
- Store performance card using actual publication/storefront state and stable
  public URL.
- Store Power checklist based on real required profile, service, gallery,
  availability, and Google Business fields.
- Quick actions linked to existing portal sections and storefront actions.
- Premium loading, empty, unavailable, and error states.
- A reusable dashboard data layer with independently refreshable domain queries.
- A server-scoped dashboard summary endpoint only where existing APIs cannot
  provide efficient aggregates.
- Conversion of the existing Add Service inline editor into an accessible,
  opaque, portaled Dialog.
- Focused overlay audit for Pandit drawers/dialogs without changing unrelated
  application overlays globally.
- Preservation of existing portal sections behind the new shell while they are
  migrated:
  Bookings, Earnings, Storefront, Customers, Reviews, Notifications, Tools,
  Membership, and Settings.

### Intentionally deferred

- Full visual rewrites of every domain screen after the foundation.
- New chat or messaging infrastructure.
- New booking or calendar engines.
- New payment provider or payout system.
- New analytics event system where tracking does not already exist.
- Google Business OAuth setup if no configured integration is available.
- Inventory, order-management, or ecommerce workflows.
- Any fabricated metric, status, URL, review, customer, booking, earning,
  availability, or integration state.

## Architecture

### Canonical route and session

`/pandit/portal` remains the canonical route to preserve login redirects,
bookmarks, existing links, and current session behavior. The existing
`pandit_token` header/cookie session and server middleware remain the only
authentication authority.

The portal page becomes a composition shell:

- `PanditBusinessShell`
  - `PanditDesktopSidebar`
  - `PanditMobileTopBar`
  - `PanditMobileBottomNav`
  - `PanditSectionRouter`
  - `PanditHome`
  - existing or migrated domain sections

Focused components belong under `client/src/components/pandit/`. The portal
page should coordinate routing and session state, not contain every screen's
markup or data transformation.

### Section routing

Sections are represented by a typed registry containing:

- stable section key
- label and icon
- desktop navigation group
- mobile navigation priority
- required capability/visibility
- render component

The active section is reflected in a query parameter such as
`/pandit/portal?section=bookings`. Unknown or unavailable sections fall back to
Home. Section changes update browser history without losing the Pandit session.

### Data layer

The client uses a focused Pandit dashboard data layer over the existing
authenticated API helper. It must:

- send the existing session credentials
- derive no authority from a browser-supplied Pandit ID
- normalize loading, empty, unavailable, and error states
- keep Home, bookings, messages, earnings, and store queries independently
  refreshable
- invalidate only affected queries after mutations

The preferred Home request is a server-side Pandit-scoped summary. It may
include identity, today aggregates, store publication data, checklist inputs,
unread counts, and supported alerts. It must not load entire booking,
messaging, customer, or analytics tables.

Existing APIs remain preferred when they already provide the required
information:

- `/api/pandit/me`
- `/api/pandit/stats`
- `/api/pandit/bookings`
- existing availability/calendar endpoints
- existing storefront/service endpoints
- existing notification and message endpoints

New endpoints are justified only for missing, efficiently aggregated data.

## Visual and interaction design

### Visual language

- warm ivory/cream page surfaces
- deep maroon/burgundy navigation and primary actions
- restrained saffron/gold accents
- clean readable typography with generous spacing
- premium cards with subtle shadows
- professional rounded corners, not playful ecommerce styling
- Vedic Tatva branding visible in the shell

### Desktop shell

The sidebar contains:

- Vedic Tatva brand
- real Pandit identity and verified state
- Overview: Home, Calendar, Bookings, Messages
- Business: My Store, Services, Customers, Reviews
- Finance: Earnings, Payment Requests
- Growth: Analytics, Referrals, Google Business
- Tools: Gallery, Pandit Card, Jap Counter, Membership, Settings
- unread badges where real unread state exists
- View My Store, Share Store, and Download QR actions

The content area uses a responsive max width, clear page headers, and a
consistent cream background.

### Mobile shell

Mobile is a dedicated composition rather than a squeezed sidebar:

- top bar: menu, Vedic Tatva mark, notifications, profile
- slide-out full navigation drawer
- bottom navigation: Home, Store, Bookings, Messages, More
- visible unread badge on Messages when applicable
- safe-area padding and content spacing so sticky controls never cover content

The layout must not horizontally scroll at 320, 360, 390, or 430px.

### Home

The hero says “Welcome back, Pt. [real name]” and shows only stored identity
attributes. It offers View My Store and Edit Store actions.

Today cards link to the existing booking, message, and earnings areas. Store
performance offers View, Edit, Share, Copy Link, and QR actions using the
existing public storefront URL. Store Power presents actionable checklist rows,
not an arbitrary percentage. Each incomplete row has a direct destination.

Quick Actions prioritize Add Service, Calendar, Bookings, Messages, Earnings,
Share Store, and QR Code while reusing existing flows.

Every Home section supports:

- loading skeleton
- real empty state
- unavailable state when tracking/configuration is absent
- recoverable error state

Unsupported analytics, Google status, and conversion metrics are hidden or
explicitly marked unavailable.

## Existing system integration

The shell and foundation do not create parallel business systems.

- Services remain constrained by the existing Vedic Tatva master catalogue.
- Bookings remain owned by the existing booking engine.
- Calendar remains owned by existing availability endpoints.
- Store and QR links use the existing public storefront architecture.
- Messages remain persistent database records and refresh independently.
- Earnings use existing payment/booking data; unsupported breakdowns remain
  unavailable.
- Reviews remain read-only for Pandits.
- Customers remain limited to data the Pandit is authorized to see.
- Notifications are generated only from real events.
- Google Business shows actual connected, disconnected, expired, error, or
  setup-required state.

## Security

- Every dashboard endpoint uses the existing Pandit session middleware.
- The server derives Pandit identity from the authenticated session.
- A Pandit can access only their own profile, services, bookings, customers,
  messages, earnings, analytics, and Google connection.
- Responses exclude passwords, OAuth credentials, admin notes, verification
  documents, payment secrets, and unnecessary customer data.
- Admin-controlled approval, verification, visibility, master services,
  commission, moderation, and integration state remain server-authoritative.
- Direct URLs and API requests for another Pandit's resources must be rejected.

## Overlay repair

The current Add Service editor is inline and uses translucent styling rather
than a true modal. It will be migrated to the shared Dialog primitive:

- portaled overlay and content
- opaque dialog surface
- scoped stacking layer above dashboard content and mobile navigation
- focus management and visible close affordance
- Escape and outside-close behavior where appropriate
- mobile-safe width and internal max-height scrolling
- background interaction and scrolling disabled while open
- `data-lenis-prevent` for the dialog's internal scroll area
- accessible title and description

Other Pandit overlays will be audited individually. Unrelated admin and
storefront overlays will not be globally restacked without evidence of a
regression.

## Performance

- Home loads server-side aggregates instead of complete datasets.
- Domain lists are paginated and bounded.
- Sections load on demand where practical.
- Message refresh updates message state only.
- Query invalidation is scoped to the affected domain.
- New indexes are added only for actual dashboard query paths.

## Testing and acceptance

### Browser journeys

- eligible Pandit login lands on `/pandit/portal` Home
- Home displays real identity and truthful data states
- section navigation works by click, direct URL, refresh, and browser history
- View Store, Edit Store, Share, Copy Link, and QR actions use real routes
- Add Service opens as an opaque accessible dialog
- Escape/close works and background content cannot be interacted with
- desktop shell works at the target desktop viewport
- mobile shell works at 320, 360, 390, and 430px with no horizontal overflow
- existing Bookings, Storefront, Services, Notifications, and Logout flows
  remain reachable

### Security checks

- unauthenticated dashboard requests are rejected
- a Pandit cannot read or mutate another Pandit's data
- suspended/unapproved Pandit behavior follows current server policy
- admin-only values do not appear in Pandit responses

### Reliability checks

- empty Pandit with no services/bookings/messages sees premium empty states
- unsupported analytics/Google configuration is explicit, never fabricated
- slow and failed requests do not blank the entire shell
- production build succeeds
- workflow restarts cleanly and browser/server logs contain no new foundation
  errors

## Known limitations after the foundation

- Some domain sections may initially render their current implementation
  inside the new shell.
- Metrics not currently tracked cannot be shown until a separately designed
  analytics event model exists.
- Google Business states depend on the configured integration and provider
  authorization.
- Full messaging, earnings, and analytics screen redesigns remain subsequent
  phases.

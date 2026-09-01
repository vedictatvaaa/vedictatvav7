# Pandit Business OS Foundation Implementation Plan

**Design:** `docs/superpowers/specs/2026-09-01-pandit-business-os-foundation-design.md`  
**Status:** Ready for implementation

## Goal

Rewrite the Pandit portal composition as a premium, mobile-first Business OS
foundation while preserving the current `/pandit/portal` route, authentication,
bookings, storefront, service catalogue, availability, reviews, payments,
messages, notifications, and admin controls.

## Non-goals

- New booking, calendar, service, chat, review, payment, or authentication systems
- Full visual rewrites of every existing domain section
- A new analytics event model
- Google Business OAuth setup
- New payout or commission behavior
- Inventory or OMS changes
- Renaming or removing `/pandit/portal`
- Fabricated metrics or placeholder business data

## Existing contracts to preserve

- `/pandit/login` continues to authenticate through the existing Pandit login API.
- `/pandit/portal` remains the canonical authenticated route.
- `client/src/lib/panditAuth.ts` and the existing Pandit session middleware remain
  the authentication boundary.
- The server derives Pandit identity from the session, never a client-supplied ID.
- Existing links using legacy `?tab=` parameters remain compatible.
- Existing public storefront, QR, card, service, booking, message, earnings,
  notification, customer, review, membership, and tools routes remain usable.
- Master service names remain controlled by the existing Vedic Tatva catalogue.
- Unsupported analytics or integrations are unavailable, never guessed.

## Work breakdown

### 1. Establish compatibility tests and section policy

Files:

- `client/src/pages/pandit-portal.tsx`
- `client/src/components/pandit/panditSectionRegistry.tsx`
- focused tests for section parsing/routing

Define a typed section registry for:

- home
- calendar
- bookings
- messages
- store
- services
- customers
- reviews
- earnings
- payments
- analytics
- referrals
- google-business
- gallery
- card
- japa
- tools
- membership
- notifications
- settings

Implement pure section parsing that:

- defaults to `home`
- accepts `?section=`
- translates legacy `?tab=` values
- falls back to Home for unknown or unavailable sections
- keeps browser back/forward and refresh behavior deterministic

Do not change authentication redirects or existing server-generated portal links
until compatibility is verified.

### 2. Add a server-authoritative Home summary

Files:

- `server/pandit-portal.ts`
- focused helper module if aggregation logic would otherwise bloat the route file
- focused route/helper tests

Add one authenticated Pandit-scoped summary route that returns only supported,
bounded data:

- safe Pandit identity projection
- approval/verification and store publication state
- city and experience when stored
- today's booking count
- pending request count
- unread message count when the existing message system supports it
- today's earnings when derivable from actual payment/booking records
- stable storefront slug/URL metadata
- checklist inputs for profile, services, gallery, availability, and Google state
- explicit availability metadata for metrics/integrations that are not implemented

Requirements:

- derive Pandit ID from the authenticated session
- use database aggregates instead of loading entire tables
- define today's date boundary consistently
- exclude secrets, admin notes, verification documents, and unnecessary customer data
- do not return zero for a metric merely because it is untracked
- do not add a schema migration unless a measured query path requires an index

### 3. Test dashboard aggregation and authorization

Files:

- `server/pandit-dashboard.test.ts` or equivalent focused test file
- existing Pandit public eligibility/access tests where reusable

Cover:

- unauthenticated summary request
- Pandit A cannot access Pandit B data
- approved, pending, suspended, and unavailable store states
- today versus non-today booking boundaries
- pending booking classification
- real zero/empty state versus unavailable metric state
- no services, gallery, or availability
- unread messages when supported
- missing Google integration state
- response privacy

Keep helper logic independent from Express where practical so date, checklist,
and availability semantics can be unit tested.

### 4. Create the typed client data layer

Files:

- `client/src/lib/panditDashboardApi.ts`
- `client/src/hooks/usePanditDashboard.ts`
- focused supporting types

Build typed wrappers over the existing Pandit API helper for:

- authenticated identity
- Home summary
- bookings/today
- messages/unread state
- earnings
- storefront/services/checklist data

React Query keys must be domain-specific. Normalize:

- loading
- empty
- unavailable
- error
- stale/refetching

Mutations invalidate only the affected domain. No hook may accept a Pandit ID as
an authorization input.

### 5. Build the Business OS shell

Files:

- `client/src/components/pandit/PanditBusinessShell.tsx`
- `client/src/components/pandit/PanditDesktopSidebar.tsx`
- `client/src/components/pandit/PanditMobileTopBar.tsx`
- `client/src/components/pandit/PanditMobileBottomNav.tsx`
- `client/src/components/pandit/PanditMobileNavDrawer.tsx`

Implement:

- premium cream/maroon/gold visual system
- real Pandit identity block
- grouped desktop navigation
- unread badges only from real data
- persistent View Store, Share Store, and QR actions
- dedicated mobile top bar, navigation drawer, and bottom navigation
- safe-area spacing and content bottom padding
- keyboard and screen-reader navigation
- `min-w-0`, bounded text, and overflow protection

Reuse the existing sidebar, sheet, dialog, button, badge, card, and tooltip
primitives rather than creating parallel UI primitives.

### 6. Refactor the portal page into a coordinator

Files:

- `client/src/pages/pandit-portal.tsx`
- `client/src/components/pandit/PanditSectionRouter.tsx`
- `client/src/components/pandit/panditSectionRegistry.tsx`

The page should own only:

- session bootstrap
- heartbeat and logout compatibility
- active section URL state
- shell composition
- section-level error boundaries

Move navigation metadata out of the page. Render existing domain sections
through registry adapters. Extract current inline booking, message, and calendar
markup into focused section components where needed to prevent the coordinator
from remaining monolithic.

Preserve the current password/on-leave/logout behavior and current API contracts.

### 7. Build the Home command centre

Files:

- `client/src/components/pandit/home/PanditHome.tsx`
- `PanditHero.tsx`
- `PanditTodayGrid.tsx`
- `PanditStorePerformance.tsx`
- `PanditStorePower.tsx`
- `PanditQuickActions.tsx`
- focused empty/error/skeleton components

Implement:

- real-name hero
- verified badge only when supported
- city/experience only when present
- Today cards linked to their sections
- truthful store status and stable public URL
- store actions using existing View/Edit/Share/Copy/QR flows
- actionable Store Power checklist
- Quick Actions linked to existing destinations
- premium empty, loading, unavailable, and recoverable error states

Do not show unsupported views, conversion, Google, or earnings metrics as fake
zeros. Ensure independently failing sections do not blank the entire Home screen.

### 8. Preserve existing domain screens behind adapters

Files:

- `client/src/components/pandit/` existing components
- new lightweight section adapters where required

Mount existing:

- storefront/services
- bookings/calendar/messages
- earnings/payment requests
- customers/reviews
- notifications
- referrals/card/tools/japa/membership/settings

Unavailable foundation destinations such as Analytics or Google Business receive
truthful setup-required/unavailable screens rather than simulated functionality.

Avoid broad rewrites of these domain components in the foundation phase.

### 9. Repair Add Service overlay behavior

Files:

- `client/src/components/pandit/PanditStorefrontPanel.tsx`
- `client/src/components/ui/dialog.tsx` only if a narrowly scoped capability is missing

Convert Add/Edit Service from the inline translucent editor to the shared Dialog:

- portaled opaque overlay and surface
- accessible title and description
- focus trap and visible close button
- Escape/outside close where appropriate
- scoped layer above the Business OS shell and mobile navigation
- mobile-safe width
- internal max-height scrolling
- `data-lenis-prevent`
- background interaction and scrolling blocked

Preserve master-catalogue selection, existing create/update routes, validation,
and query invalidation. Audit other Pandit overlays individually; do not globally
raise every dialog or rewrite unrelated overlays.

### 10. Complete responsive and accessibility verification

Files:

- Business OS shell/Home components
- focused component tests where practical

Check:

- desktop grouped navigation and persistent store actions
- mobile top bar, drawer, bottom navigation, and safe-area spacing
- no horizontal overflow at 320, 360, 390, and 430px
- visible focus states and keyboard section navigation
- dialog focus, Escape, close, and scroll behavior
- readable truncation for long names, cities, services, and URLs
- cards and actions remain usable at high text zoom

### 11. Run integration and regression tests

Focused checks:

1. dashboard aggregation/helper tests
2. Pandit authorization and public eligibility/access tests
3. catalogue/service validation tests
4. production build
5. database schema push only if a migration was added
6. workflow restart and fresh server/browser logs

Browser journeys:

- login lands on Home
- direct `?section=` URL, legacy `?tab=`, refresh, back, and forward
- Home identity, Today, store state, checklist, and unavailable states
- View/Edit/Share/Copy/QR actions
- existing Bookings, Storefront, Services, Notifications, Tools, Membership, and
  Logout remain reachable
- Add/Edit Service dialog opens, saves, closes, and does not expose background
  interaction
- authorized Pandit isolation
- approved, suspended, and empty Pandit states
- desktop plus 320/360/390/430px mobile behavior

Use temporary test data and remove it after verification.

## Rollout order

1. Add tested section parsing and compatibility aliases.
2. Add/test the server-authoritative Home summary.
3. Add the typed dashboard API/hooks.
4. Build shell and responsive navigation.
5. Refactor the portal into a coordinator.
6. Build Home command-centre components.
7. Mount existing domain sections through adapters.
8. Repair the Add Service overlay.
9. Run backend, build, workflow, desktop, mobile, and security verification.
10. Commit and sync only after all release gates pass.

## Release gates

- existing Pandit login/logout/session behavior passes
- direct and legacy section links pass
- dashboard summary authorization and privacy tests pass
- no fabricated metrics or URLs appear
- existing portal sections remain reachable
- Add/Edit Service uses the existing master catalogue and APIs
- Add Service dialog is opaque, accessible, and scroll-safe
- `git diff --check` passes
- production build passes
- workflow starts without a new server error
- desktop and all target mobile widths have no horizontal overflow
- cross-Pandit access is rejected server-side
- temporary test records are removed

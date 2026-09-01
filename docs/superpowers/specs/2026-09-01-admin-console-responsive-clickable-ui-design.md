# Vedic Tatva Admin Console — Responsive Clickable UI Design

**Date:** 2026-09-01
**Status:** Approved design, pending written-spec review
**Scope:** Presentation, responsive layout, accessibility, and interaction improvements only

## 1. Goals

Improve the existing Vedic Tatva Admin Console so it feels like a premium modern operations application on desktop, tablet, and mobile while preserving all existing functionality and data.

The work will:

- Make the existing admin navigation consistently clickable and stateful.
- Replace the awkward mobile sidebar behavior with a polished responsive drawer.
- Keep the mobile header aligned at widths from 320px through 768px.
- Give the Pandits screen a true stacked mobile-card layout.
- Make Orders, Dashboard, Visitors, and Analytics responsive and overflow-safe.
- Establish consistent touch targets, focus states, and accessible semantics.
- Reuse existing routes, lazy-loaded tabs, queries, mutations, and design-system components.

The work will not change backend logic, database schemas, authentication, permissions, routes, SEO, booking logic, payment logic, or business rules.

## 2. Current Context

The admin console already has:

- A centralized tab registry with real implementations for the visible admin sections.
- URL and local-storage persistence for the active tab.
- Lazy-loaded admin tab bundles and per-tab error recovery.
- A command palette, keyboard shortcuts, alert badges, and a saving indicator.
- Existing shared UI primitives and the Vedic Tatva cream, burgundy, and gold visual language.

The main layout risk is that the shared shell and several high-density screens use broad flex or grid layouts that do not sufficiently recompose at phone widths. The Pandits screen is the highest-priority example: profile details and many controls currently compete in one horizontal row.

## 3. Shell Architecture

The shared admin frame will be organized around focused presentation components:

- `AdminShell`: active-tab state, sidebar state, keyboard shortcuts, and page layout.
- `AdminSidebar`: desktop sidebar, mobile drawer, section groups, badges, and logout.
- `AdminTopbar`: mobile menu, section label, page title, quick search, notifications, help, and saving state.
- `AdminNavItem`: shared active, hover, focus, pressed, and touch states.
- `AdminContentFrame`: consistent content width, spacing, background, and scroll behavior.
- Shared responsive primitives for KPI cards, filter rows, status tabs, and responsive data cards.

This is a presentation refactor. Existing tab IDs, lazy imports, query keys, mutation handlers, test IDs, and active-tab URL behavior remain compatible.

### Desktop shell

- Expanded sidebar target width: approximately 248px.
- Collapsed sidebar target width: approximately 72px.
- Sidebar scrolls independently from the content area.
- Main content uses `min-width: 0` and contained scrolling where needed.
- Active navigation uses a burgundy tint, gold indicator, and stronger icon/text contrast.
- Existing command palette and keyboard shortcuts continue to work.

### Mobile shell

- Drawer width: `min(86vw, 376px)`.
- Smooth left slide-in with reduced-motion support.
- Backdrop closes the drawer on tap.
- Background page scrolling is locked while the drawer is open.
- Vedic Tatva header remains sticky inside the drawer.
- Navigation body scrolls independently.
- Logout remains visible in a sticky bottom region.
- Selecting a tab closes the drawer.
- Text remains readable at 320px; controls are not compressed below comfortable sizes.

### Topbar

At 320px–768px, controls are prioritized as:

1. Hamburger
2. Section label and page title
3. Search
4. Notifications
5. Help

The title region may truncate safely, but icon controls remain at least 44px. Controls must not overlap or depend on negative positioning.

## 4. Priority Screen Designs

### Pandits

Preserve all existing profile, location, membership, boost, fee, approval, editing, viewing, and deletion behavior while changing only composition.

**Desktop**

- Profile block on the left.
- Location, specialization, experience, languages, rating, and availability in the center.
- Fees, membership, boost, location, and primary actions on the right.
- Related controls grouped into clear clusters.

**Tablet**

- Flexible two-row layout.
- Profile and status information in the first row.
- Fees and action controls move to a second row and wrap naturally.

**Mobile**

Each Pandit renders as a stacked card containing:

1. Avatar, name, and verified state.
2. Membership and GPS badges.
3. State, city, specialization, and tradition.
4. Experience, languages, rating, and availability.
5. Fees.
6. Membership and boost controls.
7. Location action.
8. View, Edit, Approve/Delist, and Delete actions.

Controls use full-width or two-column arrangements where appropriate. Font size is not reduced to force a desktop row into a phone.

### Orders

- Keep the current order operations data, filters, list, workspace, and mutations.
- KPI cards use two columns on normal phones, one column when width is too narrow, three columns on tablet, and six columns on wide desktop.
- Labels and icon placement are consistent and compact.
- The order list uses contained horizontal scrolling only where a table genuinely requires it.

### Dashboard

- KPI cards use two columns on phones and four columns on tablet-sized screens.
- Numbers have a clear hierarchy with short labels and optional supporting detail.
- Loading, empty, and populated states keep a stable card shape.
- Existing cards and health strips that navigate to other admin tabs remain clickable.

### Visitors and Analytics

- Charts live in bounded cards with `min-width: 0`.
- Responsive chart containers prevent chart libraries from widening the page.
- Horizontal scrolling is allowed only inside a chart or table container when data genuinely needs it.
- Filters and exports stack instead of overflowing.
- Existing date filters, CSV exports, queries, and analytics data remain unchanged.

## 5. Navigation and Interaction Rules

- Every visible item in the existing tab registry maps to a real rendered tab.
- No fake routes or placeholder navigation will be introduced.
- Preserve active-tab query state and last-opened-tab persistence.
- Preserve alert badge counts in expanded and collapsed navigation.
- Preserve command palette and quick-navigation shortcuts.
- Entire tab and filter surfaces are clickable where their current behavior supports it.
- Provide consistent hover, active, pressed, and focus-visible states.
- Keep semantic `nav`, `button`, and `aria-current` behavior.
- Preserve existing `data-testid` hooks wherever possible.

## 6. Accessibility

- Navigation items, tabs, buttons, selects, and icon actions target at least 44px touch size.
- Icon-only controls have accessible labels.
- Focus-visible states are obvious and high contrast.
- Section labels are exposed meaningfully to assistive technology.
- Status is not communicated through color alone.
- Existing dialogs and forms retain correct semantics.
- Avoid nested interactive elements.
- Honor reduced-motion preferences for drawer and transition animations.
- Focus returns to the mobile menu trigger after the drawer closes.

## 7. Validation and QA

The implementation will be verified at:

- 320px
- 360px
- 375px
- 390px
- 412px
- 430px
- 768px
- 1024px
- 1280px and wider

Acceptance checks:

- No accidental page-level horizontal overflow.
- Mobile drawer opens, scrolls, closes, and locks background scrolling.
- Header controls stay aligned at all narrow widths.
- Every registered admin navigation item can be selected and renders its existing tab.
- Pandit cards never overlap or collapse into unreadable columns.
- Orders KPIs switch between two and one columns appropriately.
- Dashboard cards remain compact and balanced.
- Visitors and Analytics charts remain contained.
- Filters, dropdowns, tabs, and exports remain usable by touch and keyboard.
- Existing Pandit actions, Orders actions, dashboard navigation, and exports continue to invoke their current behavior.

Automated checks will include the project build and focused browser verification of the shell, mobile drawer, priority screens, navigation, and overflow behavior. Any pre-existing unrelated warnings will be recorded separately from regressions introduced by this work.

## 8. Non-Goals

- No backend or database changes.
- No new routes or business capabilities.
- No changes to authentication, permissions, payments, bookings, SEO, or API contracts.
- No full application redesign outside the Admin Console.
- No replacement of existing admin tab implementations when a responsive presentation change is sufficient.

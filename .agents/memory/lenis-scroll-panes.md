---
name: Lenis smooth-scroll & in-app scroll panes
description: Why any inner scroll container needs data-lenis-prevent (and min-h-0) to scroll at all
---

The site runs Lenis smooth-scroll globally. Lenis hijacks wheel/touch events at
the document level, so a nested `overflow-y-auto` pane will appear "stuck / won't
scroll down" even though the CSS is correct.

**Rule:** every in-app scroll container (sidebars, drawers, modals, tall lists)
MUST carry `data-lenis-prevent` so Lenis releases wheel events to it. Pair it
with `overscroll-contain`. Existing examples that already do this: admin content
area, the main Navbar mobile drawer, DistributionTab inner lists.

**Also:** a `flex-1` scroll child inside a `flex flex-col` parent needs `min-h-0`
or its min-height defaults to content size and `overflow-y-auto` never triggers.
The admin sidebar `<nav>` bug was BOTH causes at once (missing `data-lenis-prevent`
and missing `min-h-0`).

**Why:** debugging a non-scrolling pane wastes time chasing height/CSS when the
real cause is the global smooth-scroll layer eating the wheel events.

**How to apply:** when adding any scrollable pane, add `data-lenis-prevent` +
`overscroll-contain`, and if it's a flex child, `min-h-0`. The `.admin-scrollbar`
utility in `client/src/index.css` gives a thin on-brand scrollbar for these panes.

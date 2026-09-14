# Japa Counter Stability and Accessibility Design

## Goal

Correct the confirmed Japa Counter defects without changing its existing visual direction:

- completed malas must reset exactly once after the blessing sequence;
- touch, keyboard, and auto-counting must share the same first-use flow;
- the focus mode advertised by the product must be reachable;
- the canonical Japa route must work from the installed/offline shell;
- invalid mantra slugs must not be indexable;
- metadata and copy must match the 30-entry catalogue;
- counter controls must have usable accessible names and semantics.

## Design

### Counter lifecycle

Completion owns two independent timelines:

1. the blessing/celebration presentation, which may be dismissed or cleaned up;
2. the completed-mala reset, which must remain scheduled until it fires.

While a completed mala is waiting for reset, additional manual or keyboard taps are ignored. Auto-chanting also stops at completion. The reset changes only the visible current-mala count and session timer; lifetime totals and completed-mala totals remain credited.

All entry points use `handleTapOrAutoStart` so the first-use breathing prompt is consistent for pointer, keyboard, and shake interactions.

### Focus mode

Add an accessible focus-mode toggle to the existing counter control strip. It uses the existing `FullscreenOverlay`, preserves the browser fullscreen best-effort behavior, and exposes an `aria-label`, tooltip/title, and keyboard operation. The feature remains available in browsers that reject native fullscreen through the existing CSS overlay fallback.

### Offline shell

Service-worker registration must run reliably after the app loads and must not silently prevent the rest of the app from working. The worker will:

- cache the Japa shell route and existing static assets;
- use the cached Japa shell as the offline fallback for `/digital-japa-counter`, `/japa`, and `/japa/:slug`;
- preserve the requested browser URL so the client router can resolve the requested local mantra;
- continue excluding auth, admin, and mutating API requests from offline behavior.

### SEO and metadata

- `/japa` becomes a 301 redirect to `/digital-japa-counter`.
- An unknown `/japa/:slug` returns 404 with `noindex, follow` and a not-found title/canonical.
- Valid per-mantra pages retain their dynamic title, description, canonical, breadcrumb, HowTo, and FAQ metadata.
- All Japa copy and schemas use “30 mantras,” not “30+ mantras.”

### Accessibility

- Add accessible names to the mantra selector and icon-only controls.
- Mark decorative SVGs as hidden from assistive technology and provide text alternatives for meaningful icons.
- Keep one logical heading progression and named landmarks around the counter surface.
- Preserve existing focus styles and visual hierarchy while correcting contrast failures.

## Error handling

- A failed service-worker registration is non-blocking and remains observable through browser diagnostics.
- Offline API reads return the worker’s existing offline response; auth/admin routes remain network-only.
- Unknown mantra slugs are explicit not-found responses rather than generic indexable SPA shells.
- Reset and completion state remain safe if the user dismisses the blessing early or reloads after persistence.

## Verification

1. Focused counter browser tests at desktop and 390px mobile widths.
2. Completion, extra-tap blocking, undo, reset, reload, and localStorage persistence checks.
3. Production service-worker install and offline reload checks for canonical and dynamic Japa routes.
4. Raw and hydrated title, description, canonical, robots, and structured-data checks.
5. Axe accessibility checks on the hub and representative mantra page.
6. Existing SEO hydration test, build, workflow logs, and preview screenshot.
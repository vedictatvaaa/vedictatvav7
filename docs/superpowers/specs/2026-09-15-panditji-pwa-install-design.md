# Panditji Dedicated PWA Install

## Goal

Give the authenticated Panditji practice portal a dedicated installable app
identity that opens directly into `/pandit/portal`, without changing the
existing Vedic Tatva customer PWA.

## Scope

### In scope

- A Panditji-specific web app manifest.
- Route-aware manifest selection for `/pandit/*`.
- A Panditji install action in the portal.
- Browser fallback guidance when a native install prompt is unavailable.
- Separate dismissal state from the general Vedic Tatva install prompt.
- Reuse of the existing service worker without caching personalized Panditji
  API responses.
- Verification of the dedicated manifest, portal launch URL, existing PWA
  behavior, build, and preview workflow.

### Out of scope

- A second deployment or subdomain.
- A second service worker.
- Offline caching of authenticated portal data.
- Native Android or iOS packaging.
- Push notification registration.

## User experience

On `/pandit/portal` and other Panditji routes, the document advertises the
Panditji manifest. The portal header exposes an install action labelled
“Install Panditji app” when the browser provides a deferred install prompt.
When it does not, the same control explains the browser-specific manual path,
including Safari’s Share → Add to Home Screen flow.

The dedicated app launches at:

```text
/pandit/portal?source=pandit-pwa
```

The application’s existing Pandit authentication remains authoritative. An
expired or missing Pandit session continues to redirect to `/pandit/login`.

## Manifest and service worker

The dedicated manifest uses:

- Name: `Vedic Tatva Panditji`
- Short name: `Panditji`
- Scope: `/pandit/`
- A unique PWA `id` tied to the Panditji launch URL.
- Panditji-specific icon artwork or an explicitly branded variant of the
  existing icon assets.

The general `/manifest.webmanifest` remains the default outside `/pandit/*`.
The existing root-scoped service worker is reused. It may serve static assets
and network-first navigation behavior for the portal, but it must not cache
authenticated Panditji API responses or administrative/authentication flows.

## Route-aware manifest selection

The client maintains one `rel="manifest"` link element and updates its href
when the SPA path changes. A Panditji path selects the dedicated manifest;
other paths select the existing general manifest. The selector runs on initial
load and on client-side route transitions.

Because some Chromium versions do not emit `beforeinstallprompt` immediately
after a manifest changes in an SPA session, the install control must not assume
that a missing deferred event means installation is impossible. It displays
manual instructions instead.

## Install state

Panditji installation state uses a separate local-storage dismissal key from
the general Vedic Tatva prompt. An accepted installation listens for the
existing `appinstalled` event and hides the control. Standalone display mode
is recognized as installed.

## Error handling

- Prompt rejection or user dismissal hides the action without surfacing an
  error toast.
- Unsupported browsers receive manual instructions.
- A failed service-worker registration does not block portal access or login.
- The portal remains usable online if the service worker cannot cache or serve
  a navigation.

## Verification

1. Fetch and validate the dedicated manifest.
2. Confirm its scope and start URL resolve to the Panditji portal.
3. Confirm the general manifest remains selected outside `/pandit/*`.
4. Confirm the install control renders only for the Panditji experience and
   has a manual fallback.
5. Confirm authenticated API requests are not added to a cache.
6. Run the project build and inspect the running Replit preview.

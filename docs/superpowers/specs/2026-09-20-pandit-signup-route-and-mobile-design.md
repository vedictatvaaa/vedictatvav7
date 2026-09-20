# Pandit Signup Route and Mobile Application Design

## Goal

Make the Panditji portal's "Apply to join" action open one dedicated signup URL and make the authoritative application form use the full available width on mobile.

## Current system

- `/pandit/signup` already resolves to `PanditLogin` in signup mode.
- `/pandit/login` currently contains a second compact signup form with separate state and submission behavior.
- That compact form saves a browser handoff and redirects to `/become-pandit#apply`.
- `RegistrationSection` in `/become-pandit` is the authoritative application flow. It owns location verification, specialist service selection, photo upload, consent, drafts, errors, and final submission.

## Design

1. Keep `/pandit/signup` as the dedicated signup URL and make it render the authoritative `RegistrationSection`.
2. Change portal and sign-in-page "Apply to join" actions to navigate directly to `/pandit/signup`.
3. Remove the compact duplicate signup form and its browser-storage handoff from `PanditLogin`.
4. Keep `/become-pandit` available as a compatibility landing page, but link its application CTA to `/pandit/signup` rather than maintaining another application entry state.
5. Update the shared registration shell so mobile uses `w-full`, minimal horizontal padding, and a single-column layout; retain a centered max-width and supporting two-column layout on larger screens.
6. Preserve draft-token fragment/query handling, privacy boundaries, accessibility error targets, existing test IDs where they still describe the authoritative form, and the existing application API contract.

## Error handling and compatibility

- Direct navigation to `/pandit/signup` must work without a prior portal visit.
- Existing draft resume links must continue to hydrate the authoritative form.
- `/become-pandit` must not create a second submission contract.
- Sign-in remains available at `/pandit/login`; its forgot-password and language behavior remain unchanged.

## Verification

- Add or update route/contract tests for `/pandit/signup`, the portal CTA destination, and removal of the compact signup handoff.
- Run the existing Pandit flow tests and build.
- Check the signup page at mobile and desktop widths for horizontal overflow and full-width form presentation.
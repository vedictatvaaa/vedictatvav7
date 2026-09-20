# Pandit Admin Location AI Fallback

**Date:** 2026-09-20  
**Status:** Approved for implementation planning

## Goal

Help Admin resolve Pandit applications that are not bookable because they have no GPS coordinates, and improve new Pandit registrations so they capture location evidence at submission time without allowing an AI model to silently publish an inaccurate location.

The existing verified location path remains authoritative. AI is only a fallback for an unresolved typed city/location name, and every AI result requires explicit Admin confirmation before it is saved.

## Existing constraints

- The Admin Pandit editor already has canonical active state/city selectors and manual latitude/longitude fields.
- The server already has a verified city geocoder and a server-side OpenAI-compatible provider.
- The current location AI interpreter is restricted to selecting an active catalogue state/city candidate. It must not be extended to invent coordinates.
- Public Pandit eligibility and booking rules remain unchanged. A Pandit becomes bookable only when the existing eligibility checks pass after a confirmed save.
- Coordinate provenance already has database fields for source, confidence, and verification time.
- Admin requests are authenticated with the existing Admin middleware/token flow.
- The registration flow already requests browser geolocation and captures latitude/longitude when the applicant grants permission.
- Registration already has a rate-limited address-suggestion endpoint and dropdown, but it currently returns only labels and does not carry selected coordinates into the application.

## Recommended approach

### 1. Admin experience

Extend the GPS section of the existing `EditPanditDialog` with a location search input and a `Find coordinates` action.

The input may use:

- the selected canonical state and city;
- the existing Pandit city/service-area text; and
- an optional more specific location string entered by the Admin.

The dialog should show the current coordinate status and make the source of a proposed result visible:

- verified geocoder result;
- AI fallback result, marked approximate and requiring review; or
- no result, with a manual coordinate option.

The result is preview-only. `Use this location` copies the proposed latitude and longitude into the form and records the pending source/confidence in local form state. The normal `Save` action is still required.

### 2. Registration capture

Make applicant location capture GPS-first:

1. The applicant explicitly chooses `Use my current location`.
2. The browser requests geolocation permission and returns latitude, longitude, accuracy, and timestamp.
3. The form displays the captured location status and lets the applicant continue or retry.
4. If permission is denied, unavailable, or the result fails the client/server accuracy validation, the applicant can use address autocomplete instead.
5. The applicant selects an address/place suggestion; the server-side geocoder returns coordinates and the form displays the selected result for confirmation.
6. If both methods fail, the application can still be submitted with a clear location-pending state, but it is not bookable until the Admin resolves it.

Browser GPS and address autocomplete are evidence-capture paths, not AI paths. The registration form must not silently use a device location without explicit permission, and a city-only text value must not be promoted to an exact Pandit coordinate.

### 3. Server resolution flow

Add an authenticated, read-only Admin endpoint dedicated to coordinate suggestions. It must:

1. Validate and length-limit the submitted state/city/location text.
2. Try the existing verified city resolver first when canonical state/city data is available.
3. Return a verified result immediately when one matches.
4. If the verified resolver cannot resolve the location, call a new AI fallback adapter through `createStructuredCompletion`.
5. Require strict structured output containing only a normalized place label, latitude, longitude, confidence, and a short reason.
6. Validate the AI output server-side:
   - finite latitude and longitude within geographic bounds;
   - confidence within `0..1`;
   - India/location scope consistent with the selected state/city;
   - no Pandit identity, contact, address, or credential data sent to the provider.
7. Never write the Pandit row from the suggestion endpoint.

The AI fallback should be capped below the verified-coordinate confidence threshold and returned with an explicit `ai_fallback` source and approximate/address-level scope. It must not be eligible for any existing bulk auto-apply route.

The existing public registration address-suggestion endpoint should be extended rather than duplicated. It should remain rate-limited and geocoder-backed, but return a selected result's latitude, longitude, provider place identifier, and source metadata alongside its display label. The client must send the selected result metadata with the application rather than geocoding or trusting coordinates in the browser.

The application submission contract should accept either of these evidence paths:

- `browser:geolocation`: latitude/longitude captured with explicit browser permission, with browser accuracy when available and `locationPermissionGranted: true`;
- `nominatim:address-selection` (or the configured geocoder equivalent): latitude/longitude selected from the server response, with `locationPermissionGranted: false`.

If neither path is available, the application may be stored as location-pending for Admin review. Approval and public eligibility must continue to reject it as bookable until valid coordinates are present. Coordinate source, accuracy, and capture metadata should be added to the application record if needed, then copied to the Pandit record during approval.

Registration submissions should preserve the coordinate source and accuracy metadata when available. The application approval path must retain the existing requirement that unresolved or missing location evidence cannot make the Pandit bookable.

### 4. Save and audit behavior

The existing Pandit update endpoint remains the only write path from this UI. Extend its validation so a coordinate update must include compatible provenance metadata:

- latitude and longitude must be supplied together;
- source, confidence, and verification timestamp must be supplied for a new coordinate;
- AI fallback coordinates require the Admin-confirmed UI flow and are recorded as AI-assisted/approximate;
- clearing coordinates clears their provenance fields;
- invalid or incomplete provenance is rejected.

Every confirmed coordinate update should be included in the existing Admin audit record with the source, confidence, and whether the source was AI fallback. Existing coordinates should not be overwritten unless the Admin explicitly uses a new suggestion or edits the fields.

### 5. Failure handling

- Provider unavailable: show a clear fallback message and leave the form unchanged.
- Invalid or ambiguous AI output: show that no safe result was found; allow manual entry or retry.
- Low confidence: show the candidate only as a warning and require explicit use/Save confirmation.
- Stale result: the suggestion is not persisted server-side, so a changed form cannot accidentally apply an old result.
- AI fallback must never mark a Pandit bookable by itself.
- Browser permission denial or unavailable geolocation must offer address autocomplete rather than blocking the applicant without explanation.
- A registration with neither GPS nor a confirmed address result remains location-pending and is visible to Admin review.

## Testing

### Server

- Route contract tests verify Admin authentication, input validation, no-write behavior, and response shape.
- Verified resolver success bypasses AI.
- AI is called only after verified lookup fails.
- Structured-output validation rejects out-of-range, malformed, non-India, and incomplete results.
- Provider failures return a controlled error without changing the Pandit row.
- Update validation rejects coordinates without provenance and clears provenance when coordinates are cleared.
- Audit data includes the selected coordinate source and confidence.

### Client

- Location search uses the selected state/city and typed text.
- Verified results and AI fallback results render distinct source labels.
- `Use this location` updates the draft only.
- Save is still required before the coordinates change on the server.
- Failed/ambiguous suggestions leave existing coordinates unchanged.
- Existing manual coordinate editing and clear behavior continue to work.
- Registration uses explicit browser GPS first and preserves accuracy/source metadata.
- Registration falls back to address autocomplete after GPS failure or denial.
- Registration can submit without coordinates only in a location-pending state that cannot pass bookability checks.

## Scope boundaries

- No automatic bulk coordinate assignment.
- No AI-only public geocoding endpoint.
- No changes to public directory, booking, or eligibility rules beyond preserving the existing requirement that unresolved registration locations remain unbookable.
- No use of Pandit private identity/contact/address data in AI prompts.
- The Pandit coordinate provenance fields already exist; add only the smallest application-level provenance fields needed to preserve GPS accuracy and address-selection source through approval, rather than weakening validation.
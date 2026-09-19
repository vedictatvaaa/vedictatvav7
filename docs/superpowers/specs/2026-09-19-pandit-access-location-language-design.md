# Panditji Access Form Location and Language Design

## Status

Approved by the user on 2026-09-19.

## Goal

Improve the compact Panditji access/signup page so that new applicants choose a
canonical state and city from the existing location catalogue, choose one or
more supported languages, and cannot continue without a mobile number and
email address. The existing Panditji and Pandit application records must remain
unchanged.

## Non-goals

- Do not backfill, normalize, rename, or update existing `pandits` rows.
- Do not update existing `pandit_applications` rows.
- Do not add a language database table or migrate the existing text language
  field.
- Do not remove the full `/become-pandit` application flow or its missing-city
  path.

## Safety constraints

1. The client reads locations from the existing read-only `/api/locations`
   endpoint. That endpoint returns active states with active cities and their
   database IDs.
2. The state selection is stored as `stateId`, and the city selection is stored
   as `cityId`. The city list is filtered by the selected state.
3. The full application continues to submit canonical IDs through its existing
   request path. Display names are only presentation/fallback data and never
   replace IDs.
4. The access page hands values only to a new application attempt. A missing,
   malformed, stale, or unavailable handoff is ignored, leaving the existing
   application defaults intact.
5. Languages remain compatible with the existing `text` column and onboarding
   contract by serializing selected values as a comma-separated string.
6. Phone and email are required in both browser validation and explicit
   trimmed client validation. Existing database values are not modified.

## User experience

### Access page

- Add a required state select.
- Add a required city select disabled until a state is selected.
- Clear the city when the selected state changes.
- Add a multi-select language control using the existing supported onboarding
  language list. The selected languages are visibly removable and the field
  shows a required state.
- Mark mobile number and email as required in labels and native form
  validation.
- Preserve the existing sign-in, forgot-password, demo, PWA install, language
  toggle, and full-story link behavior.

### Application handoff

When the compact signup form passes validation, write a short-lived,
namespaced browser handoff containing:

- full name
- phone
- email
- state ID
- city ID
- selected languages

Navigate to `/become-pandit#apply`. The full application reads and validates
the handoff, applies only values that match the current active location data,
and clears the handoff after consumption. No server-side record is created by
the compact form itself.

The full application must not overwrite user-entered values that are already
present. The handoff is intended to prefill the first step only; the applicant
still completes all existing verification, location-permission, service,
photo, and terms requirements.

## Data flow

1. `pandit-login.tsx` queries `/api/locations`.
2. The user selects an active state and a city belonging to that state.
3. The user selects supported languages and enters required phone/email values.
4. Client validation rejects incomplete or inconsistent values without
   navigation.
5. The page stores the validated draft in a namespaced session-storage entry
   and navigates to the existing application anchor.
6. `become-pandit.tsx` reads the draft, validates the referenced active state
   and city relationship, pre-fills its existing `form` state, and removes the
   draft.
7. The existing application submit mutation sends the canonical IDs and
   language text through the current API contract.

## Error handling

- Location-loading errors show an inline message and keep state/city controls
  unavailable rather than offering free-text values that could bypass the
  canonical catalogue.
- A city from a different state is rejected client-side and the city value is
  cleared.
- Empty language selection, missing phone, missing email, or whitespace-only
  values prevent navigation and use the existing toast pattern.
- Invalid session-storage contents are discarded silently and do not break the
  application page.
- Existing application-side validation remains authoritative on submission.

## Verification

- Build and type-adjacent compile checks pass.
- `/api/locations` remains read-only from the access page.
- State selection filters cities and changing state clears city.
- Languages can be selected and removed, and the serialized value matches the
  existing comma-separated field.
- Missing phone/email/language/location prevents the handoff.
- Valid handoff prefills the full application with matching canonical IDs.
- Invalid or stale handoff is ignored.
- Existing login, forgot-password, demo, signup handoff, and PWA controls
  continue to work.
- Confirm with code review that no update or migration touches existing
  Panditji records.
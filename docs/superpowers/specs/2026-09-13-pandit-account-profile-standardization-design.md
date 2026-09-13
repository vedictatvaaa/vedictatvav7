# Pandit Account Security and Profile Standardization

## Goals

- Make Pandit approval, login, logout, password setup, and password recovery secure and reliable.
- Replace emailed temporary passwords with single-use setup/reset links.
- Improve registration data so approved records feed the public directory and storefront accurately.
- Bring legacy Pandit records up to the same standard without overwriting verified facts or inventing data.
- Generate SEO only from approved public fields.

## Authentication design

### Account approval

- Approval creates the Pandit identity, lifetime registration number, draft storefront, and explicitly selected canonical services.
- Approval must not select every service when the application has no canonical service selection.
- The account receives a random unusable password hash until the Pandit chooses a password.
- A hashed, single-use account-setup token is stored with a short expiry.
- The raw token exists only in the setup URL placed in the transactional email.
- The approval API never returns a password or raw token.
- Repeated approval remains idempotent and does not create a second identity.

### Login

- Accept the canonical registered phone format and password.
- Use generic failure messages.
- Apply rate limiting.
- Reject suspended or banned accounts.
- Rotate the authenticated session after login.
- Accounts without a completed setup use the setup/reset flow rather than temporary credentials.

### Logout

- Revoke the current server-side session.
- Clear the authentication cookie with matching cookie options.
- Return success even when the session is already absent.

### Forgot password

- Accept registered phone and email.
- Always return a generic success response to prevent account enumeration.
- Invalidate older active reset tokens before issuing a new one.
- Store only a token hash.
- Use a short expiry and one-time consumption.
- Revoke active sessions after a successful password reset.
- Rate-limit by IP and normalized account identifier.

### Admin password action

The Pandit profile management UI includes **Send password reset link**.

- Requires authenticated Admin.
- Requires an explicit confirmation dialog.
- Invalidates old setup/reset tokens.
- Revokes active Pandit sessions.
- Sends a new one-time reset link to the approved registered email.
- Records actor, Pandit ID, reason, and delivery status in the Admin audit log.
- Never generates, displays, returns, logs, or emails a password.

## Welcome email

The approved-account email uses Vedic Tatva branding and includes:

- Personalized greeting
- Approval status
- Lifetime registration number
- Secure Create Password button and expiry
- Pandit login and portal links
- Public storefront URL when published, otherwise an honest draft-status explanation
- Directory visibility and publication explanation
- Features: profile, services, pricing, booking requests, calendar, messaging, reviews, payments/earnings where enabled, and public verification
- How Vedic Tatva and the Pandit work together
- Response, accuracy, availability, pricing, and service-quality expectations
- Do: keep details current, respond promptly, use canonical services, protect devotee privacy, honor confirmed bookings
- Do not: share credentials, fabricate qualifications/reviews/availability, move protected transactions off-platform, publish private contact details, or claim unsupported services
- Password/security guidance
- Support guidance
- Admin note when provided

The email must not claim the profile is live unless publication and directory governance confirm it.

## Registration and canonical data

Registration captures structured:

- Full public name
- Phone and email
- Canonical State and City
- Original user-entered location
- Languages
- Traditions/specializations
- Canonical master services
- Supported service modes
- Service area
- Years of experience
- Education/qualification as entered
- Fee range
- Public biography
- Profile photo
- Consent and accuracy confirmation

Approval copies only validated values. Free-text service names do not become bookable services without canonical mapping.

## Standardization policy

### Automatic corrections

Apply only deterministic transformations:

- Trim and normalize whitespace
- Normalize phone and email representation
- Resolve approved State/City aliases
- Normalize known language and service aliases
- Canonicalize service identities
- Normalize supported modes
- Preserve original location input for audit
- Generate a collision-safe public slug

### Review suggestions

The system may suggest, but never silently assert:

- Canonical service matches from free text
- Language/spelling corrections not covered by deterministic aliases
- Biography restructuring from supplied facts
- Storefront SEO title and description from approved public data
- Missing service modes or service areas

Pandit or Admin approval is required before suggestions become authoritative.

### Never infer

- Qualifications
- Years of experience
- Exact location or coordinates
- Service availability
- Pricing
- Languages
- Traditions
- Reviews or ratings
- Booking history
- Personal biography facts

Unknown values remain unknown and may block publication.

## Legacy upgrade

- Run a dry-run audit over existing Pandits.
- Produce per-record deterministic changes, suggestions, unresolved fields, and publication blockers.
- Automatically apply only deterministic corrections that do not replace verified values.
- Keep uncertain changes in a review queue.
- Recalculate directory/storefront/SEO eligibility using the existing central policy.
- Never auto-publish a previously unpublished or hidden Pandit.

## SEO and privacy

- Public SEO uses only published storefront and directory-safe fields.
- Login, setup, reset, portal, application status, and Admin routes remain `noindex`.
- Password/reset tokens must never enter logs, analytics, canonicals, referrers, sitemaps, or structured data.
- Public profile schema includes registration identity only when valid and publicly approved.
- Missing fields do not produce fabricated fallback claims.

## Verification

- Approval creates one identity and one setup invitation.
- No API or email contains a password.
- Setup/reset tokens are hashed, expiring, one-time, and invalidated on replacement.
- Login rotates sessions; logout and password reset revoke them.
- Forgot-password response does not reveal account existence.
- Admin reset action is authenticated, confirmed, audited, and delivery-safe.
- Welcome email snapshots cover published and draft storefront states.
- Registration-to-directory tests cover canonical location, service identity, modes, and missing fields.
- Legacy dry-run proves verified values remain unchanged.
- Private/auth pages remain absent from sitemaps and `noindex`.
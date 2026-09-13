# Pandit Contact Access and Paid Unlocks

**Date:** 2026-09-13  
**Status:** Approved design pending written-spec review

## Goal

Require a registered customer account before Vedic Tatva discloses a Pandit's phone or WhatsApp number. Give each customer three free unique Pandit contact reveals in a rolling 30-day window. When that allowance is exhausted, let the customer pay an Admin-configured price, initially ₹10, to unlock one additional Pandit contact. A successfully confirmed Vedic Tatva Puja booking starts a fresh allowance window.

## Public storefront and SEO boundary

Pandit storefront pages, public biographies, verified services, canonical locations, reviews, and other approved public facts remain publicly viewable. This preserves discovery, accessibility, search indexing, and AI-agent access.

Phone and WhatsApp values remain outside all public storefront, directory, SEO, schema, sitemap, analytics, and AI-feed payloads. Only the protected contact endpoint may return them.

## Entitlement rules

1. A customer must have a valid registered-user session before any contact number is disclosed.
2. A customer may reveal three different Pandits without payment in each rolling 30-day window.
3. Reopening a Pandit already revealed during the active window is free and does not consume another allowance slot.
4. The window begins with the first free reveal after the previous window expires, or at the time of a qualifying booking reset.
5. When the window expires, the next free reveal begins a new 30-day window with a full allowance.
6. A paid unlock grants the same customer access to one specified Pandit's contact for the active window.
7. A paid unlock does not reduce the free allowance and cannot be transferred to another customer or Pandit.
8. A successful qualifying Puja booking starts a new 30-day window immediately and restores three free unique reveals.
9. Creating a booking request, initiating checkout, failing payment, cancelling, receiving a refund, or using an external booking does not reset contact allowance.
10. A qualifying booking is a Vedic Tatva booking that reaches the existing authoritative confirmed/paid state. The reset event is idempotent per booking.

## Rolling-window model

Use an append-only entitlement ledger rather than a mutable counter. Event types are:

- `free_reveal`
- `paid_reveal`
- `booking_reset`

Each event records the customer, Pandit when applicable, source booking or payment when applicable, event time, and immutable price snapshot when applicable. The ledger never stores the disclosed phone number.

The active window is determined from the latest qualifying `booking_reset` or natural rolling-window boundary. Contact calculations must run inside a transaction protected by a customer-scoped advisory lock so concurrent reveals cannot overspend the allowance.

Historical `pandit_contact_reveals` remain audit history. On migration, reveals from the preceding 30 days count as free reveals in the initial active window. Older reveals do not consume the new allowance. Migration is idempotent and does not duplicate user/Pandit pairs.

## Paid unlock checkout

The project’s existing Razorpay integration is authoritative.

### Create order

The authenticated customer requests a paid unlock for a public, contactable Pandit.

The server:

1. Rechecks authentication, Pandit public safety, contact availability, existing entitlement, and free allowance.
2. Returns the contact immediately if the customer already has access.
3. Claims a free reveal if allowance is available.
4. Otherwise reads the current Admin-configured price and creates a dedicated Razorpay order for exactly that amount.
5. Stores a pending contact-unlock purchase with customer ID, Pandit ID, amount in paise, currency, Razorpay order ID, and expiry.

The browser cannot supply or override the authoritative amount.

### Verify payment

The server verifies the Razorpay signature and fetches or validates the authoritative paid order state using the existing production payment rules. In development, existing explicit mock-payment conventions may be used; production never trusts mock payment data.

Verification runs transactionally and idempotently:

- A verified purchase creates one `paid_reveal` event.
- Repeated verification returns the existing entitlement.
- An order cannot unlock a different Pandit or customer.
- Failed, expired, mismatched, or underpaid orders disclose no contact data.
- Contact disclosure happens only after the entitlement commit succeeds.

Refund behavior is fail-closed. A refunded contact purchase remains in the immutable payment ledger but its entitlement becomes revoked. Previously seen information cannot be technically erased, but future protected responses must not rely on the revoked purchase.

## Admin configuration

Add an Admin setting:

- Label: `Additional Pandit contact price`
- Stored as integer paise
- Default: `1000` paise (₹10)
- Allowed range: ₹1 to ₹10,000
- Applies only to orders created after the setting changes
- Existing pending or completed purchases retain their amount snapshot

Admin contact-mode controls remain available. The global effective mode for this feature is `login_required`; `never_display` remains enforceable per Pandit. No per-Pandit override may make contact publicly accessible without login.

Admin reporting shows:

- Free unique reveals
- Repeat reveals
- Allowance-exhausted attempts
- Paid unlock orders by status
- Verified paid unlock revenue
- Booking-reset events

Reports contain customer/Pandit IDs and operational status only where Admin investigation requires them. They never copy phone or WhatsApp values.

## Customer interface

The storefront contact dialog has these states:

1. **Signed out:** explain that a registered account is required and link to login/registration with a safe return URL.
2. **Free reveal available:** show remaining unique contacts and active-window reset date.
3. **Previously revealed:** allow immediate repeat access without consuming allowance.
4. **Allowance exhausted:** show the Admin-configured price and `Unlock this contact for ₹X` action.
5. **Payment pending:** prevent duplicate order creation and show progress.
6. **Payment failed or cancelled:** disclose nothing and allow a safe retry.
7. **Payment verified:** reveal contact, update remaining allowance, and record paid entitlement.
8. **Unavailable:** explain that contact details are unavailable without exposing hidden profile state.

The customer account contact-history page lists currently entitled Pandits and labels access as free, paid, or booking-reset window. It does not expose contact values in list payloads.

## Booking reset integration

The booking domain emits or calls one idempotent contact-entitlement reset only when a booking transitions into the existing authoritative confirmed/paid state. The contact module does not infer success from browser navigation or payment initiation.

The reset timestamp becomes the start of a fresh 30-day window. Earlier free and paid events remain audit history but do not consume the new allowance. A second qualifying booking during that window starts another fresh window.

## Security and privacy

- All contact responses use private/no-store cache headers.
- Authentication and entitlement are checked server-side for every reveal.
- Rate limiting applies by customer and IP.
- Advisory locking prevents concurrent free-slot overspend.
- Razorpay signatures and authoritative amounts are verified server-side.
- Payment order IDs are unique and cannot be replayed for another customer or Pandit.
- Contact numbers never enter analytics events, URLs, logs, Admin audit details, structured data, or client caches.
- Generic responses prevent hidden-account enumeration.
- Existing CSP and checkout-origin restrictions remain enforced.

## Failure handling

- Database or payment-provider failure discloses no contact.
- Email availability is irrelevant to contact entitlement.
- If a price is invalid or payment configuration is unavailable, paid unlock is disabled with a retryable message; free and repeat entitlements continue to work.
- If the Pandit becomes hidden, banned, archived, suspended, on leave, unpublished, or removes contact details, existing entitlement does not bypass current public/contact safety checks.
- If booking-reset processing fails after booking confirmation, it is retried idempotently and appears in operational diagnostics.

## Migration and rollout

1. Add the entitlement ledger and contact-purchase tables with constraints and indexes.
2. Add the Admin price setting with a ₹10 default.
3. Migrate eligible contact reveals from the preceding 30 days.
4. Deploy server calculations and payment endpoints before exposing the paid CTA.
5. Update storefront and account interfaces.
6. Keep the feature fail-closed until migrations and Razorpay configuration are verified.
7. Audit counts and payment totals without reading contact values.

## Verification

Automated coverage must include:

- Login required for status and disclosure
- Three unique free Pandits allowed
- Fourth unique Pandit denied without payment
- Repeat access to one of the three remains free
- Natural reset after 30 days
- Confirmed/paid booking reset
- No reset for initiated, failed, cancelled, refunded, or duplicate booking events
- Concurrent fourth reveals cannot both claim a free slot
- Price comes from Admin settings and is snapshotted per order
- Invalid signature, amount, customer, Pandit, order, and replay are rejected
- Verified payment creates one entitlement
- Refunded entitlement is not treated as active
- Hidden or contactless Pandits remain undisclosed
- Public DTOs, SEO, logs, and analytics contain no contact data

Release verification must cover customer registration/login, three free contacts, repeat access, exhausted-state checkout, verified Razorpay unlock, Admin price change, booking reset, and mobile/desktop dialog behavior.

## Out of scope

- Contact bundles, subscriptions, wallets, or transferable credits
- Publicly exposing Pandit contact data
- Charging to view the public storefront itself
- Cash or manually asserted paid unlocks
- Fabricating Pandit contact or profile data
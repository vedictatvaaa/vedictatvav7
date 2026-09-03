# Puja Booking Operations and Pandit Coordination Design

**Date:** 2026-09-04  
**Status:** Approved design, pending implementation plan

## 1. Purpose

This design strengthens the existing Vedic Tatva Puja booking engine so virtual and at-home Pujas behave as distinct, reliable services while continuing to use the current catalogue, Pandit marketplace, booking records, portals, pricing snapshots, notifications, and samagri workflow.

The work must extend one coherent booking system. It must not create a parallel backend, duplicate booking records, trust client-calculated prices, expose customer contact details to multiple Pandits, or invent availability.

## 2. Approved product decisions

1. Customers choose **Virtual Puja** or **At-home Puja** at the beginning of discovery and booking.
2. Virtual matching ignores physical distance and prioritizes service eligibility, language, tradition, rating, and availability.
3. At-home matching starts with nearby eligible Pandits, widens automatically when necessary, and always displays distance.
4. A pending Pandit request exposes only approximate area and operational requirements.
5. The customer's full address and phone number are released only after one Pandit accepts the booking.
6. After acceptance, the customer receives the assigned Pandit's verified contact details.
7. Admin defines the minimum and maximum rate for each master Puja. Pandits choose their rate within that range.
8. Travel is charged separately for at-home Puja using admin-controlled distance bands.
9. Pandits can prepare and send a structured samagri list from their portal to the customer portal, WhatsApp, and email.
10. Existing accepted bookings retain immutable pricing and operational snapshots when future settings change.

## 3. Existing-system strategy

The implementation will strengthen these current systems:

- Puja catalogue and master-service records
- Pandit services and packages
- Public Pandit eligibility and moderation
- Puja booking records and status workflow
- Pandit and customer booking portals
- Booking messages and in-app notifications
- WhatsApp, SMS, and email providers
- Per-booking samagri lists
- Server-authoritative pricing snapshots
- Location and Pandit latitude/longitude data

No replacement checkout or second booking engine will be introduced.

## 4. Booking modes

### 4.1 Virtual Puja

Virtual booking collects:

- Puja or Pandit offering
- Preferred date and time
- Customer timezone
- Preferred language
- Tradition or regional preference when supported
- Customer name, phone, and email
- Video-call contact or joining preference

A physical address is not required. Distance must not affect ranking. Eligible results are ranked using:

1. Exact active-service eligibility
2. Requested language
3. Requested tradition or regional practice
4. Confirmed virtual-service mode
5. Availability for the requested window
6. Quality signals such as verified reviews and completed bookings
7. A stable fairness rule to avoid repeatedly favoring the same Pandit

The interface must not claim that a Pandit is available until availability is verified by the system or accepted by the Pandit.

### 4.2 At-home Puja

At-home booking collects a structured address:

- House, flat, or building
- Street
- Locality
- City
- State
- Postal code
- Landmark, optional
- Latitude and longitude where reliably available

The customer must provide a valid locality before matching. Coordinates improve distance calculations but are not mandatory.

Before acceptance, candidate Pandits may see:

- City and approximate locality
- Approximate distance
- Puja
- Requested date and time
- Language and tradition
- Number of participants or preparation notes when provided

They must not see the house number, complete street address, customer phone, or customer email.

## 5. Nearby-Pandit matching

At-home matching uses staged radius widening:

1. Search the nearest configured distance band.
2. If no eligible Pandit is available, widen to the next admin-configured band.
3. Clearly tell the customer that the radius has widened.
4. Display approximate distance on every result.
5. Ask for confirmation before presenting unusually distant options.

Only publicly eligible Pandits with an active service compatible with the Puja and at-home mode may be ranked.

Distance is never the only criterion. The ranking must first enforce:

- Public eligibility and moderation status
- Active matching service
- At-home or hybrid mode
- Rate inside the current approved Puja band
- Requested language or tradition where required
- Availability when the availability system can verify it

Within the eligible set, nearby Pandits receive preference. If two candidates are effectively equivalent, the system should use a stable fairness mechanism rather than an opaque random order.

If reliable coordinates are unavailable, matching may use city and locality membership. The interface must label this as area-based matching rather than showing a fabricated kilometre distance.

## 6. Booking lifecycle

The controlled lifecycle is:

`requested → offered → accepted → confirmed → in_progress → completed`

Controlled exits are:

- `declined`
- `cancelled`
- `reassignment_required`
- `expired`

### 6.1 Request

The customer submits a mode-specific request. The server validates:

- Authenticated customer identity
- Valid Puja or Pandit offering
- Mode eligibility
- Structured contact fields
- At-home locality requirements
- Requested date/time format
- Server-authoritative pricing inputs

The request contains full customer details, but candidate-Pandit APIs must project only the limited pre-acceptance fields.

### 6.2 Offer

The engine offers the booking to an eligible Pandit or controlled candidate set. Every offer has:

- Booking identifier
- Offered Pandit identifier
- Offer status
- Offered and expiry timestamps
- Approximate area and distance context
- No released private customer contact details

### 6.3 Acceptance and contact exchange

Only one eligible Pandit may accept. Acceptance must be transactional:

1. Lock or conditionally update the booking/offer.
2. Verify the booking is still acceptable.
3. Verify the Pandit remains publicly eligible.
4. Verify service mode and rate-band compliance.
5. Assign the Pandit.
6. Mark competing offers closed.
7. Record acceptance time.
8. Create an auditable contact-release event.
9. Queue notifications to both parties.

After successful acceptance:

- The assigned Pandit receives the full customer address for at-home Puja, phone, and email.
- The customer receives the assigned Pandit's verified phone and approved contact details.
- No other candidate receives those details.

Repeated acceptance requests must be idempotent and must never release contact details to more than one Pandit.

### 6.4 Confirmation, performance, and completion

The accepted Pandit confirms the service window and preparation details. The existing message and status systems remain available. Completion records the final completion time and enables the existing review journey.

## 7. Privacy and authorization

Contact and address release is a server authorization rule, not a visual hiding rule.

APIs and portal projections must enforce:

- Customer sees their own booking and the assigned Pandit's approved contact details after acceptance.
- Assigned Pandit sees full customer contact details only after acceptance.
- Candidate or declined Pandits never receive full contact details.
- Admin access follows existing privileged authorization.
- Access-token booking views must expose only the minimum customer-safe projection.

Phone numbers, email addresses, and full addresses must never appear in:

- URLs
- Analytics events
- General-purpose application logs
- Public API responses
- Search indexes
- Notification metadata visible to unrelated users

Notification provider payloads may contain contact details only for the intended accepted parties.

## 8. Puja rate governance

### 8.1 Master Puja bands

Each master Puja supports:

- Minimum Pandit rate
- Maximum Pandit rate
- Currency
- Effective date
- Active/inactive status
- Optional admin reason or review note
- Audit history

Admin controls these values.

### 8.2 Pandit service pricing

A Pandit chooses one base rate for each offered Puja inside the active admin band. The server enforces the range when:

- A service is created
- A service is edited
- An inactive service is reactivated
- A service is added to a package
- A package price is validated
- A booking is created

The client displays the approved range and explains validation failures, but client validation is supplementary.

If an admin narrows a range:

- Existing booking snapshots remain unchanged.
- Existing services outside the new range become non-bookable until the Pandit updates them or an admin resolves them.
- The system must not silently rewrite a Pandit's price.

### 8.3 Package pricing

Packages must be built only from active, eligible services. Package validation must prevent a package from bypassing individual Puja rate governance. The package may have a separate admin-approved pricing policy, but it must preserve the component-service snapshot used at booking time.

## 9. Travel pricing

Travel applies only to at-home Puja and is a separate line item.

Admin configures distance bands with:

- Minimum distance
- Maximum distance
- Travel charge
- Currency
- Active status
- Effective date
- Optional unusually-distant confirmation threshold

The server calculates the applicable band from the customer matching location and assigned Pandit location.

The customer sees before final confirmation:

- Approximate distance
- Applied distance band
- Puja base rate
- Samagri charge or customer-arranged status
- Travel charge
- Taxes or platform fees where applicable
- Final total

If reliable distance cannot be calculated, the system must not invent a charge. It shows “travel charge pending confirmation” and prevents an undisclosed amount from being collected.

## 10. Immutable pricing snapshot

Every confirmed booking stores:

- Pricing version
- Source service or package
- Puja base amount
- Samagri amount and arrangement type
- Travel-band identifier and amount
- Taxes and fees where applicable
- Final total
- Currency
- Booking mode
- Distance used for pricing
- Rate-band version
- Timestamp

The server recomputes all amounts from authoritative records. Client totals are never trusted.

## 11. Samagri workflow

### 11.1 Templates

Admins may maintain an approved default samagri template for each master Puja. Pandits may use:

- Approved master template
- Their reusable personal template
- A custom list for the booking

### 11.2 Structured list

Each item supports:

- Item name
- Quantity
- Unit
- Preparation note
- Required or optional status
- Arranged by customer, Pandit, or Vedic Tatva
- Optional catalogue/shop reference where a real product exists

The initial release does not require inventory reservation or automatic commerce for every item.

### 11.3 Sending and revisions

The Pandit sends the list from the accepted booking workspace. Sending:

1. Saves an immutable version.
2. Updates the current booking projection.
3. Creates a booking message or event.
4. Notifies the customer portal.
5. Queues WhatsApp and email summaries.
6. Records delivery status.

Later edits create a new version and highlight changes. They do not silently overwrite the previously sent list.

The customer portal displays the checklist, arrangement responsibility, latest version, update history, and available real shop links.

## 12. Notifications and delivery

### 12.1 Required events

Notifications are generated for:

- Booking request received
- Booking offered to Pandit
- Booking accepted
- Booking declined or reassignment started
- Date/time confirmed or changed
- Samagri list sent
- Samagri list updated
- Booking cancelled
- Booking completed

### 12.2 Channels

The authoritative record is the portal notification/event. WhatsApp and email are delivery channels. SMS may remain available for urgent events according to existing provider configuration.

After acceptance:

- Pandit WhatsApp/email includes customer name, phone, and full at-home address or virtual joining context.
- Customer WhatsApp/email includes assigned Pandit name and verified contact number.

Before acceptance, Pandit notifications include only the limited request projection.

### 12.3 Reliability

Outbound delivery must support:

- Idempotency key per booking event, recipient, channel, and template version
- Queued, sent, failed, and retrying status
- Retry count and last error without storing secret credentials
- Safe retry without duplicate messages
- Portal-visible delivery state where useful

Provider failure must not roll back a successful booking transition. The portal event remains available and failed external delivery is retried independently.

## 13. Portal interfaces

### 13.1 Customer portal

The customer booking detail shows:

- Mode
- Booking lifecycle timeline
- Assigned Pandit after acceptance
- Verified Pandit contact actions after acceptance
- Date/time and timezone
- At-home address or virtual joining context
- Price breakdown
- Distance/travel band for at-home Puja
- Samagri checklist and revision history
- Booking messages
- Notification-delivery status where appropriate

### 13.2 Pandit portal

Before acceptance:

- Puja and service
- Mode
- Approximate area and distance for at-home Puja
- Requested date/time
- Language and tradition
- Approved rate
- Preparation summary
- Accept/decline action

After acceptance:

- Full customer contact details
- Full at-home address and navigation action, or virtual context
- Confirmed schedule controls
- Samagri template/editor/send workflow
- Booking messages
- Notification delivery state
- Completion action

### 13.3 Admin

Admin controls:

- Puja rate bands
- Mode eligibility
- Distance bands and charges
- Samagri templates
- Notification templates and channel settings
- Booking/reassignment oversight
- Audit history

## 14. Failure and edge-case handling

- Invalid service rates are rejected with the current approved range.
- Missing at-home locality blocks matching.
- Missing coordinates use clearly labeled area-based matching.
- No nearby result triggers visible staged widening.
- Unusually distant results require customer confirmation.
- No eligible Pandit produces an honest unavailable state and alternate date/mode options.
- Pandit suspension or ineligibility before acceptance closes the offer and triggers reassignment.
- Eligibility loss after acceptance alerts admin for controlled resolution rather than silently leaking or deleting booking data.
- Concurrent acceptance permits exactly one winner.
- Notification failure is logged and retried without duplicating the booking.
- Samagri delivery failure leaves the saved portal version intact.
- Rate or travel-setting changes never alter existing booking snapshots.

## 15. Implementation boundaries

The first implementation should include:

1. Domain schemas and migrations
2. Rate-band and distance-band admin rules
3. Server-side validation and pricing
4. Mode-specific booking input
5. Nearby-first matching with staged widening
6. Offer/acceptance privacy projections
7. Contact exchange after acceptance
8. Booking notification delivery records
9. Versioned samagri sending
10. Customer, Pandit, and admin portal updates
11. Regression and critical-journey verification

The following remain outside this design unless already supported:

- A replacement payment processor
- Automatic inventory reservation for samagri
- Arbitrary negotiation between customer and Pandit
- AI-generated religious recommendations
- Background checks beyond the existing verification system

## 16. Acceptance criteria

### Booking mode and matching

- Customer must choose virtual or at-home mode.
- Virtual results are not ranked by distance.
- At-home results contain only eligible Pandits and rank nearby candidates first.
- Search widening and displayed distance are truthful.
- Full address is never exposed during matching.

### Contact exchange

- Candidate Pandits cannot retrieve customer phone, email, or full address.
- Exactly one accepted Pandit receives those fields.
- The customer receives the accepted Pandit's verified contact details.
- Acceptance and contact release are atomic and auditable.

### Pricing

- Admin can configure min/max rates per master Puja.
- Pandit service and package operations cannot bypass the range.
- Travel uses a separate admin distance band.
- Server ignores client-submitted totals and stores an immutable breakdown.

### Samagri

- Accepted Pandit can prepare and send a structured list.
- Customer sees it in their portal.
- WhatsApp/email delivery is attempted and recorded.
- Updates create versions and show changes.

### Notifications

- Required booking events create portal notifications.
- WhatsApp/email sends are deduplicated and retryable.
- Delivery failure does not corrupt booking state.
- Private contact details are included only after acceptance.

### Regression safety

- Existing standard Puja, Pandit service, and package bookings continue to work.
- Existing moderation rules continue to exclude suspended or banned Pandits.
- Existing customer and Pandit booking views remain authorized.
- Existing booking messages, completion, and review flows continue to work.

## 17. Verification plan

Automated domain and integration checks will cover:

- Virtual matching with Pandits in different locations
- At-home nearest-first ordering and radius widening
- Area-based fallback without fabricated distance
- Mode eligibility rejection
- Rate creation/edit/reactivation boundaries
- Package governance
- Server-side price and travel recomputation
- Concurrent acceptance
- Pre-acceptance privacy projections
- Post-acceptance contact exchange
- Pandit ineligibility and reassignment
- Samagri version creation and delivery retries
- Notification idempotency and failure handling
- Immutable historical pricing

One browser-based critical-journey pass will verify:

1. Virtual Puja discovery and request
2. At-home nearby-Pandit discovery and request
3. Pandit pre-acceptance limited view
4. Acceptance and contact exchange
5. Samagri sending and customer receipt
6. Customer and Pandit status updates

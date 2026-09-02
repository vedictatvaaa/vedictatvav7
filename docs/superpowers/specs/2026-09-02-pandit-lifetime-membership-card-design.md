# Vedic Tatva Pandit Lifetime Membership and Card System

**Date:** 2026-09-02
**Status:** Approved design awaiting specification review
**Scope:** Production-ready extension of the existing Pandit registration, approval, profile, location, commerce, Admin, SEO, and Knowledge Graph systems

## 1. Purpose

Upgrade the existing Pandit registration and profile experience so approved Pandits receive a permanent Vedic Tatva registration number, a premium digital lifetime membership card, public verification, and the option to order Plastic or Metal physical cards through the existing commerce system.

This feature must extend existing systems rather than create duplicate Pandit, user, location, authentication, membership, payment, order, fulfillment, SEO, QR, or Knowledge Graph implementations.

## 2. Approved Product Decisions

- The permanent registration number is assigned only after Admin approval.
- The registration number is also the lifetime membership number.
- Number format is `VT-PAN-000001`, expanding beyond six digits when required.
- A valid Pandit profile photograph is mandatory during registration and before approval.
- The current 102 canonical cities remain in the selector.
- Registration adds a governed “My city is not listed” request rather than importing thousands of unreviewed cities.
- The full public-safe digital card is shown on the approved Pandit’s public profile.
- Public card and verification responses never expose private Pandit information.
- Physical cards use one restricted membership-card product with Plastic and Metal variants.
- Initial prices are ₹500 for Plastic and ₹1,000 for Metal, managed through existing Admin product controls.
- The existing cart, checkout, payment, order, inventory, dispatch, and fulfillment systems remain authoritative.
- A physical card order may contain 1–10 cards.

## 3. Existing Systems to Reuse

### 3.1 Pandit and application data

The existing Pandit and Pandit application records remain authoritative. Existing registration fields, profile creation, approval, verification, authentication ownership, public profile, storefront, and Admin review flows will be extended in place.

### 3.2 Canonical locations

The existing `indian_states` and `indian_cities` master tables remain authoritative. They already include all 28 Indian states and 8 Union Territories, with 102 supported cities. Existing canonical `stateId` and `cityId` references remain the valid public location identity.

### 3.3 Authentication and authorization

Existing Clerk/session authentication, Pandit ownership checks, and Admin authorization will protect all private membership, ordering, pricing, location-review, and fulfillment operations.

### 3.4 Commerce and fulfillment

The existing product, variation, cart, checkout, Razorpay, order, inventory, dispatch, courier, tracking, and Admin order systems will be reused. No separate payment or card-order engine will be created.

### 3.5 Public profile, SEO, QR, and Knowledge Graph

The existing Pandit public profile, canonical route, metadata and JSON-LD emitters, QR capability, and Knowledge Graph entity/relationship layer will be extended rather than duplicated.

## 4. Location Selection and Missing-City Workflow

### 4.1 Registration selection

The registration hierarchy remains:

1. Country
2. State or Union Territory
3. City

India is the initial supported country. State/UT and city selectors are searchable, accessible, mobile-safe, and use canonical IDs. City options depend on the selected active State/UT. The frontend must not embed a separate city list.

### 4.2 “My city is not listed”

If the desired city is absent, the Pandit may choose “My city is not listed” and submit a proposed city name under the selected State/UT.

The proposed name is stored as a pending location request. It must not become the Pandit’s canonical public location automatically.

Admin may:

- map the request to an existing city or alias;
- add a new canonical active city under the selected State/UT;
- reject the request with a reason.

An application with an unresolved city request cannot be approved. Once resolved, the application receives canonical `stateId` and `cityId` values while preserving original submitted text for audit and migration safety.

## 5. Registration Experience

The existing registration page remains the entry point and authentication flow. It will continue collecting existing supported fields, including:

- full name;
- mobile number;
- email;
- profile photograph (mandatory);
- canonical state and city;
- address/location details;
- languages;
- services and pujas;
- experience;
- biography;
- existing verification information;
- other current Pandit profile fields.

The form will be premium, clean, mobile-first, accessible, validated, responsive, and free of horizontal overflow. It must not duplicate fields already supported by the current application/profile architecture.

The profile photograph field is required. Registration submission must fail explicit client-side and server-side validation when the photograph is absent, invalid, or not successfully uploaded. The application cannot be approved and no membership card can be generated until a valid profile photograph is attached.

Successful submission creates or updates the existing application/profile flow. It does not assign lifetime membership before approval.

## 6. Lifetime Registration Number

### 6.1 Format and properties

Each approved Pandit receives one registration number in the format:

`VT-PAN-000001`

The sequence expands naturally beyond six digits. The number is:

- globally unique;
- generated server-side;
- human-readable;
- collision-safe;
- immutable;
- never reused;
- not derived directly from a public database ID;
- searchable by authorized Admin users;
- displayed on the profile, digital card, physical card, storefront, and verification page.

### 6.2 Assignment lifecycle

Number assignment occurs transactionally with Admin approval and profile creation/update.

- A retried approval returns the existing number.
- A rejected application consumes no number.
- Suspension or deactivation retains the assigned number.
- Card reissue retains the same number.
- Ordinary profile and Admin update endpoints cannot set, modify, clear, or regenerate the number.

### 6.3 Existing Pandit backfill

Existing approved Pandits without registration numbers receive numbers through a controlled, deterministic, additive backfill. Existing Pandits, profile IDs, authentication identities, locations, and orders remain unchanged.

## 7. Membership State

“Lifetime Membership” means the registration identity and number do not expire.

Current operational status is still enforced:

- **Approved and active:** card and verification show valid active membership.
- **Suspended or inactive:** identity remains, while the card and verification page clearly show the current non-active status.
- **Rejected or unapproved:** no public card or public verification page is available.

This reuses existing approval, verification, active, and suspension semantics rather than creating a competing membership-status system.

## 8. Digital Card Design

The card uses the existing Vedic Tatva visual language: warm cream, deep maroon, restrained antique gold, premium typography, subtle sacred geometry, excellent spacing, and strong contrast. Decoration remains refined rather than excessive.

The same responsive component renders the dashboard, public profile, share/download, and print views.

### 8.1 Front content order

The front must present information in this order:

1. Vedic Tatva branding
2. Pandit photograph
3. Pandit full name
4. Pandit Registration No. / Membership No.
5. Lifetime Membership
6. City, State
7. Primary specialization/services
8. Current verified/active indicator

### 8.2 Back content order

The back must present information in this order:

1. QR code
2. “Scan to verify this Vedic Tatva Pandit”
3. Registration number
4. Profile/verification URL
5. Public verification statement
6. Vedic Tatva website
7. Approved support contact

### 8.3 Availability and actions

The card is available from:

- Pandit dashboard → Profile / Membership Card;
- approved public Pandit profile;
- dedicated print/download presentation.

The Pandit can:

- view and flip front/back;
- copy or share the profile/verification link;
- share the card;
- download or print the supported card presentation.

Public visitors may view the public-safe card but cannot access Pandit-only ordering or private information.

## 9. QR and Public Verification

### 9.1 QR destination

The QR code contains only the canonical verification path:

`/verify-pandit/VT-PAN-000001`

It does not contain phone numbers, email addresses, private addresses, documents, internal IDs, signed credentials, or other sensitive information.

### 9.2 Verification page

The public verification page performs a bounded exact lookup using strict registration-number grammar. It may display only:

- Pandit name;
- approved photograph;
- registration number;
- lifetime membership label;
- current membership/approval status;
- canonical city and state;
- public Vedic Tatva profile link;
- approved verification indicator.

It must not expose:

- phone number;
- email address;
- street address;
- private documents;
- internal database IDs;
- sensitive verification material.

Unapproved or unknown registration numbers return Not Found without leaking record existence. Suspended/inactive Pandits receive a clear public non-active status according to Admin policy.

## 10. Physical Card Product and Ordering

### 10.1 Product configuration

Create one restricted Admin-managed product: **Pandit Membership Card**.

Variants:

- **Plastic Card:** initial price ₹500 per card.
- **Metal Card:** initial price ₹1,000 per card.

Prices, availability, and stock are controlled through the existing product/Admin architecture and are not duplicated as constants throughout the application.

### 10.2 Eligibility

Only an authenticated, approved Pandit with an assigned registration number may order a physical card for their own profile. Browser-supplied Pandit IDs cannot select another Pandit.

### 10.3 Order experience

The order flow is:

1. Open Membership Card.
2. Select Plastic or Metal.
3. Select quantity from 1–10.
4. Review unit price, quantity, subtotal, and existing shipping/tax calculations.
5. Confirm shipping address.
6. Continue through existing checkout/payment.
7. Existing order is created.
8. Admin handles production and fulfillment.
9. Pandit tracks the order through the existing order experience.

### 10.4 Production snapshot

The order item retains a non-sensitive immutable production snapshot containing only what fulfillment needs:

- registration number;
- approved display name;
- approved public location;
- approved photograph reference;
- approved specialization;
- QR destination;
- card design version;
- selected material and quantity.

Later profile edits do not silently alter an already-paid card order.

### 10.5 Fulfillment

Existing compatible order and fulfillment states are reused, including payment, processing, packing, dispatch, transit, delivery, and cancellation. Existing dispatch, courier, tracking, and inventory prerequisites remain authoritative.

Payment/order retries must be idempotent and must not create duplicate paid card orders.

## 11. Admin Controls

The existing Admin Pandit and order areas are extended so authorized Admin users can:

- search Pandits by name;
- search by registration number;
- search by mobile or email where already authorized;
- review and resolve missing-city requests;
- approve/reject through the existing application workflow;
- view membership/current status;
- view front/back digital card;
- view physical card orders;
- manage Plastic/Metal price, stock, and availability;
- use existing order fulfillment and dispatch tools;
- initiate controlled card reissue while retaining the same lifetime number;
- review audit history for location, approval, membership, pricing, availability, and reissue actions.

Registration numbers cannot be casually regenerated.

## 12. Public Pandit Profile and Storefront

Approved public Pandit profiles and storefronts display:

- approved/verified status;
- `Vedic Tatva Pandit`;
- registration number;
- `Lifetime Membership`;
- full public-safe digital card;
- verification/profile actions.

Private details remain hidden. The registration number is visible without exposing internal identity fields.

## 13. SEO

Approved, active public Pandit profiles and verification pages use the existing SEO architecture:

- canonical URL;
- unique title;
- meaningful meta description;
- Open Graph metadata;
- appropriate JSON-LD;
- breadcrumbs where applicable;
- explicit indexability rules.

Unapproved/private profiles and unknown verification routes are not indexed. Suspended/inactive verification indexability follows the existing Admin/public policy. Thin duplicate pages are not created.

## 14. Knowledge Graph Integration

The existing Knowledge Graph remains the only relationship layer.

Structured, approved data may support:

- `Pandit → located_in → City`;
- `Pandit → specializes_in → Puja/Service`;
- `Pandit → offers → Service`.

Relationships are created only from canonical structured data. Unreviewed city text, private order data, payment details, and sensitive Pandit information never enter the graph.

The physical card product may participate as an existing PRODUCT entity only when appropriate for public catalog policy.

## 15. Security and Data Safety

- Registration numbers are generated server-side.
- Database uniqueness and immutability protections prevent reuse or casual updates.
- Approval is retry-safe and assigns at most one number.
- Pandits can access only their own private card and order operations.
- Public card and verification responses contain only approved public fields.
- Admin APIs use existing Admin authorization.
- Card products cannot be ordered for an arbitrary Pandit identity.
- Missing-city requests cannot bypass canonical location review.
- Production snapshots contain no unnecessary private data.
- Public verification uses strict grammar, bounded exact lookup, and rate limiting where supported.
- Existing Pandits, locations, users, authentication, payments, orders, bookings, and memberships are never deleted or replaced.
- Database changes are additive and backward compatible.
- Docker, deployment configuration, and unrelated infrastructure remain unchanged.
- No dependency is added unless the existing application cannot provide the required capability.

## 16. Error Handling

The system fails explicitly for:

- invalid or inactive state/city combinations;
- unresolved missing-city requests during approval;
- duplicate or conflicting approval attempts;
- unapproved card access;
- unauthorized card ordering;
- missing membership identity;
- unavailable card variants;
- invalid quantities;
- payment/order conflicts;
- unauthorized Admin mutations.

No path silently falls back to free-text public locations, raw database IDs, duplicate membership numbers, or duplicate orders.

## 17. Testing and Acceptance Criteria

### 17.1 Location and registration

- Existing 102 cities remain selectable.
- Cities are filtered by the selected active State/UT.
- Invalid state/city pairs fail server validation.
- Registration cannot be submitted without a valid uploaded profile photograph.
- A Pandit can create a missing-city request.
- Admin can map, add, or reject a requested city.
- Approval is blocked until the request is resolved.
- Registration remains usable without horizontal overflow on mobile.

### 17.2 Approval and membership

- Concurrent/retried approval assigns exactly one registration number.
- Approval fails when the application has no valid profile photograph.
- The number follows the approved format and is unique.
- Rejection assigns no number.
- Ordinary updates cannot change or clear the number.
- Existing approved Pandits are backfilled without changing existing identity/location data.
- Suspension retains the lifetime number and changes public status.

### 17.3 Card and verification

- Front and back follow the approved field order.
- Private fields never render or enter the QR payload.
- QR resolves to the matching verification page.
- Unknown/unapproved numbers do not leak records.
- Active, inactive, and suspended statuses render correctly.
- Card works on mobile and desktop.
- Public profile, dashboard, share, download, and print presentations remain consistent.

### 17.4 Ordering

- Only an approved authenticated Pandit can order their own card.
- Plastic and Metal prices come from the Admin-managed product variant.
- Quantity accepts 1–10 only.
- Existing shipping/tax/checkout rules apply.
- Order snapshots remain stable after later profile changes.
- Payment retries do not duplicate paid orders.
- Existing Admin fulfillment, dispatch, and tracking work for card orders.

### 17.5 Admin, SEO, and Knowledge Graph

- Admin search supports registration number.
- Admin location resolution, card view, pricing, availability, reissue, and fulfillment are authorized and audited.
- Approved pages receive canonical metadata and schema.
- Unapproved/private pages are not indexed.
- Structured canonical Pandit location/service relationships use the existing graph.
- Private order and Pandit information never enters public graph projection.

## 18. Delivery Report

Before the implementation phase is committed, provide:

1. Existing systems reused.
2. State/city data status and fixes.
3. Registration number format and lifecycle.
4. Additive database migrations.
5. Digital card implementation.
6. QR implementation.
7. Physical card ordering implementation.
8. Admin controls.
9. Verification page.
10. SEO integration.
11. Knowledge Graph integration.
12. Security controls.
13. Tests completed.
14. Remaining limitations.

The feature is committed as a separate logical phase. Work stops after this feature; no unrelated major feature begins automatically.
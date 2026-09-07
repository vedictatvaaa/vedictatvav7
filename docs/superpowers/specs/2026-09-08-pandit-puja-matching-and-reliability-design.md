# Pandit Puja Matching and Reliability Design

## Goal

Make Pandit discovery, registration, administration, and online Puja booking operate as one reliable system. A customer selecting a Puja must see only eligible Pandits who currently offer that Puja, while every existing and newly registered Pandit initially receives all active Puja offerings and may later deselect unsupported offerings from the Pandit dashboard.

## Puja offering defaults

- The authoritative Puja checklist comes from the active canonical Puja/service catalogue.
- Existing Pandits receive every active Puja offering through an idempotent migration.
- New Pandit registrations begin with every active Puja selected.
- The registration form displays the complete checklist and permits applicants to deselect services before submitting.
- The Pandit dashboard displays the same checklist and lets the Pandit enable or disable offerings later.
- Newly added canonical Pujas are granted to existing Pandits by default unless the product later adopts an explicit opt-in policy.
- Selection data is stored as structured Pandit service offerings, not as free-text specialization labels.

## Booking and matching

The online Puja booking page gains a Pandit selection step after Puja and mode selection.

For an online booking, a Pandit may appear only when all of the following are true:

1. The Pandit is publicly eligible under the existing verification, account, governance, and location rules.
2. Managed booking is enabled for the Pandit.
3. The Pandit has an active offering mapped to the selected canonical Puja.
4. The offering supports online delivery.
5. The Pandit is not on leave or otherwise unavailable.
6. The requested schedule passes existing availability rules when a date and time are known.

Customers may choose a displayed Pandit or choose **Assign best available Pandit**. The server revalidates every rule at booking creation; client selection never overrides server eligibility.

Offline bookings continue to apply canonical location and service-area rules. Missing coordinates must not break listing or profile rendering, but records without verified coordinates cannot claim distance-based proximity.

## Admin Pandits reliability

- Normalize the Admin Pandits API response before filtering so both supported response envelopes cannot trigger `.filter is not a function`.
- Treat malformed responses as explicit recoverable errors.
- Preserve search, verification, availability, leave, location, profile-photo, governance, and service controls.
- Add the canonical Puja checklist to Admin editing for support and correction.
- Surface unresolved canonical location and missing-coordinate states separately; do not invent coordinates.

## Pandit registration and dashboard

- Registration shows all canonical Puja types in a searchable, mobile-friendly checklist.
- All items are initially checked.
- Submission records the selected service identities.
- Approval creates or activates the corresponding structured offerings.
- The Pandit dashboard uses the same catalogue and permits later deselection/reselection.
- Changes take effect in matching immediately after successful persistence and cache invalidation.

## Storefront and contact behavior

- Canonical storefront URLs remain `/pandit/:slug`.
- Contact values remain absent from the initial public storefront payload.
- The existing protected contact authorization/reveal flow remains authoritative.
- After an authorized reveal, the phone number is displayed as a tappable number with Call and WhatsApp actions.
- Existing messaging, reviews, analytics, directory, and booking policies remain intact.

## Migration safety

- Service grants are idempotent and do not duplicate offerings.
- Existing explicit offering prices and configuration are preserved.
- Missing canonical location values are reconciled only through exact active catalogue matches or approved aliases.
- Unknown or ambiguous locations remain unresolved for Admin review.
- Partial or invalid coordinate pairs are cleared rather than guessed.

## Verification

### Automated checks

- Admin Pandits handles array and supported object response envelopes.
- Registration defaults every active Puja to selected and persists deselections.
- Approval creates the selected offerings.
- Dashboard deselection removes a Pandit from matching for that Puja.
- Online matching enforces offering, mode, booking, account, leave, and public eligibility.
- Booking creation revalidates the selected Pandit and rejects stale or ineligible selections.
- Public storefront responses contain no contact value.
- Authorized contact reveal returns private, no-store data and displays the number in the protected UI.
- Missing images use the branded fallback; failed image URLs switch to the same fallback.
- Missing coordinates do not crash directory, storefront, booking, or Admin pages.

### Runtime and flow checks

- Test every Pandit-related Admin tab, filter, link, edit path, and retry state.
- Test registration through approval, service editing, directory discovery, storefront, protected contact, messaging, and booking.
- Test online and offline booking on mobile and desktop.
- Crawl Pandit-related internal links and verify canonical/redirect behavior.
- Run the production build, targeted server tests, application restart, clean logs, and one browser pass over the critical journeys.

## Release

- Commit to `vedictatvav7`.
- Push to `origin/vedictatvav7`.
- Wait for the existing Coolify deployment.
- Verify production health, migration completion, Admin Pandits, storefront, protected contact, Puja matching, and booking before declaring completion.
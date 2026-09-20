# Pandit Storefront Social Sharing and Scheduled Stories Design

## Goal

Give every publicly published Pandit storefront an impressive, safe sharing experience and prepare a second phase in which Panditjis can connect eligible Facebook and Instagram accounts for automatic daily Story publishing.

Delivery is intentionally phased:

1. **Phase 1:** premium storefront preview images and user-initiated sharing
2. **Phase 2:** optional Meta account connection and scheduled daily Stories

Phase 1 must not depend on Meta approval or connected social accounts.

## Existing foundation

- Public storefronts use the canonical `/pandit/:slug` route.
- The storefront already exposes a desktop share menu, but it only copies the URL.
- Social metadata already points crawlers to `/api/og/p/:slug.jpg`.
- The existing Open Graph renderer produces a branded profile card from public Pandit data.
- Pandit storefront settings currently store optional Instagram and Facebook profile URLs, not connected accounts or publishing credentials.

## Design choice: data-driven rendering

Social images will be generated from the authoritative public storefront projection rather than by taking a literal browser screenshot.

This renderer will reproduce the visual language and content hierarchy of the storefront hero while remaining deterministic and safe.

### Why

- It cannot accidentally capture private contact controls, admin UI, loading states, or entitlement prompts.
- It produces consistent images across devices and deployments.
- It supports multiple aspect ratios from one approved data model.
- It remains reliable when the client layout changes.
- It can be cached and invalidated when published storefront data changes.

## Public data boundary

Every preview and Story must resolve the Pandit through the existing publicly eligible, published storefront boundary.

Allowed data:

- Published Pandit name
- Approved public profile or banner image
- Canonical city and State
- Verified status
- Approved specializations or services
- Public rating and review count when eligible
- Published storefront tagline
- Canonical storefront URL
- Vedic Tatva branding

Forbidden data:

- Phone, WhatsApp, or private contact details
- Exact coordinates
- Booking/customer information
- Unpublished reviews
- Draft editorial content
- Admin notes or governance status
- OAuth tokens or connected account identifiers
- AI-generated claims that have not been approved

If the storefront is unpublished or no longer publicly eligible, image generation and scheduled publication must stop.

## Phase 1: storefront sharing

### Share entry points

Add a prominent Share action to:

- Desktop storefront header or hero
- Mobile fixed action area
- Pandit portal storefront panel, allowing the Panditji to share their own published page

The control opens one responsive share panel.

### Share panel actions

1. Native device share using `navigator.share`
2. WhatsApp share intent
3. Facebook share dialog or URL intent
4. Copy canonical storefront link
5. Download 1080×1920 Story image
6. Share the Story image through the native file-share sheet when supported
7. Instagram guidance when direct Story sharing is unavailable from the browser

Opening the panel may be automatic only after the user taps Share. Sending, posting, downloading, or opening an external app always requires another explicit user action.

### Social image formats

Generate two variants:

- **Link preview:** 1200×630 JPEG
- **Story:** 1080×1920 JPEG

The link preview remains available from the existing `/api/og/p/:slug.jpg` route.

Add a dedicated Story image route:

- `/api/story/p/:slug.jpg`

Both routes:

- Resolve only published, publicly eligible storefronts
- Use SSRF-safe image loading
- Have bounded image-fetch timeouts
- Return a branded fallback when the approved photo or banner cannot load
- Include content revision or last-modified information in the cache key
- Never expose the internal filesystem cache path

### Visual composition

The first approved template includes:

- Storefront banner or profile photo
- Panditji name
- Verified badge where authoritative
- City and State
- Up to three approved specializations
- Rating/review trust signal when publicly eligible
- Short published tagline
- “Book this Panditji on Vedic Tatva”
- Canonical URL
- QR code in the Story variant
- Vedic Tatva logo and maroon/gold/cream visual system

The Story image must keep essential text inside common platform safe zones.

### Open Graph metadata

The canonical storefront metadata must use:

- Canonical `/pandit/:slug` URL
- Generated 1200×630 image
- Pandit-specific title and description from the authoritative public SEO projection
- Absolute production image URL when published

The image route must remain crawler-accessible and must not depend on client-side hydration.

## Phase 2: connected Meta accounts

### Eligibility

Panditjis may connect social accounts only from an authenticated private portal.

Instagram automatic publishing requires:

- A Business or Creator Instagram account
- A linked Facebook Page
- Required Meta publishing permissions
- Successful platform app review

Facebook and Instagram connectors are available for project setup, but they are not connected during Phase 1.

### Connection experience

Add a private **Social Publishing** portal section with:

- Connect Facebook
- Connect Instagram
- Eligible Page/account selector
- Connection health and permission status
- Approved template preview
- Time and timezone selector
- Enable or pause daily publishing
- Publish test Story
- Recent publication history
- Disconnect account

Access tokens and provider account identifiers remain server-side and must never appear in public DTOs, logs, HTML, generated image URLs, or analytics payloads.

### Consent model

The selected policy is:

- The Panditji approves the Story template and schedule once.
- The app then auto-publishes from that approved template.
- Material template changes require renewed approval.
- The Panditji can pause or disconnect at any time.

Consent records include:

- Pandit ID
- Template version
- Enabled destinations
- Local publishing time and timezone
- Approval timestamp
- Pause/disconnect timestamp

### Daily Story content

The scheduled Story uses:

- Approved template version
- Current published storefront projection
- One rotating approved specialization or service
- Public booking call to action
- Canonical storefront URL and QR code

The initial release does not use free-form AI copy. Rotation is deterministic and limited to approved public services.

### Durable publishing records

Every destination attempt records:

- Pandit ID
- Local publication date
- Destination
- Template version
- Generated image revision
- Idempotency key
- Attempt timestamp
- Provider result ID when successful
- Retry count
- Failure category
- Final state

The idempotency key is unique per Pandit, destination, local publication date, and template version. Scheduler restarts must not create duplicate Stories.

### Scheduler behavior

The scheduler:

- Finds enabled schedules due in their configured timezone
- Revalidates public storefront eligibility immediately before generation and publish
- Generates or reuses the exact approved Story image revision
- Publishes independently to each enabled destination
- Records the provider response
- Retries only transient failures with bounded backoff
- Never retries permanent authorization or policy errors indefinitely

Automatic publishing pauses when:

- The storefront becomes unpublished
- The Pandit becomes publicly ineligible
- Template approval is stale
- OAuth authorization expires or required scope is lost
- Selected Page or account becomes unavailable
- Image generation or public-content validation fails
- Repeated permanent publishing failures cross the safety threshold

The portal explains the pause reason and provides a reconnect or resume action.

## Security and privacy

- Use OAuth integrations rather than asking Panditjis for passwords or tokens.
- Encrypt or use platform-managed storage for provider credentials.
- Redact tokens and provider payload secrets from all logs.
- Protect connection, schedule, and history routes with Pandit-session authorization.
- Enforce ownership server-side for every connected account operation.
- Validate redirects and OAuth state to prevent account-linking attacks.
- Never infer consent from an existing public Instagram or Facebook URL.
- Disconnect revokes or deletes stored authorization where supported.

## Accessibility and responsive behavior

- Share controls have explicit accessible names.
- Copy/download/share outcomes use non-competing status announcements.
- The share panel is keyboard accessible and restores focus to its trigger.
- Story preview has descriptive alternative text.
- Mobile controls stay outside browser safe-area insets.
- Share failure never hides the canonical copy-link option.

## Analytics

Phase 1 should record consent-aware events for:

- Share panel opened
- Native share selected
- WhatsApp selected
- Facebook selected
- Link copied
- Story downloaded

Do not record the Panditji’s connected provider account identifiers in analytics.

Phase 2 should record operational publishing outcomes separately from product analytics.

## Error handling

### Phase 1

- Native share unavailable: retain WhatsApp, Facebook, copy, and download.
- File sharing unsupported: download the Story image.
- Clipboard failure: select and display the URL for manual copy.
- Image generation failure: share the canonical URL with the existing branded fallback image.

### Phase 2

- Expired authorization: pause and request reconnection.
- Missing publish scope: pause and show the exact missing capability.
- Provider rate limit: bounded delayed retry.
- Duplicate scheduler execution: idempotency record prevents a second post.
- Partial destination failure: preserve successful destination result and retry only the failed destination.

## Testing

### Phase 1

- Published storefront generates both image formats.
- Unpublished or ineligible storefront returns no personalized image.
- Generated images contain only approved public fields.
- SSRF protections reject unsafe photo/banner URLs.
- Open Graph metadata points to the canonical generated image.
- Desktop and mobile Share controls open the same panel.
- Native Share, WhatsApp, Facebook, copy, download, and file-share fallbacks behave correctly.
- Story safe-zone layout remains readable at 1080×1920.

### Phase 2

- OAuth state and ownership checks reject cross-Pandit account linking.
- Only eligible Meta accounts can be selected.
- Scheduler respects timezone and local publication date.
- Idempotency prevents duplicate daily Stories.
- Unpublished/ineligible storefronts pause before publishing.
- Token expiry and missing scopes produce reconnectable pause states.
- Partial Facebook/Instagram failures remain isolated.
- Pause, disconnect, and renewed template approval take effect immediately.

## Delivery sequence

1. Extend the existing public social-image renderer with a shared public projection.
2. Add the 1080×1920 Story route and cache invalidation.
3. Upgrade public and portal Share controls.
4. Verify crawler metadata and mobile/desktop sharing.
5. Separately implement Meta account connection after provider configuration and app-review requirements are confirmed.
6. Add durable schedules, consent, publication records, and the daily publisher.

## Out of scope for Phase 1

- Connecting Facebook or Instagram accounts
- Automatic publishing
- Free-form AI Story copy
- Customer-specific or booking-specific Story content
- Automatic direct messages or comments
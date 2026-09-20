# Pandit Storefront Social Sharing — Phase 1 Implementation Plan

**Design:** `docs/superpowers/specs/2026-09-20-pandit-storefront-social-sharing-design.md`

## Objective

Ship premium, user-initiated sharing for every publicly eligible Pandit storefront:

- A reliable 1200×630 Open Graph image
- A new 1080×1920 Story image
- A shared, accessible Share panel
- Desktop and mobile public-storefront entry points
- A Pandit portal Share action
- Native share, WhatsApp, Facebook, copy, download, and file-share fallbacks

Meta OAuth, account connection, scheduling, and automatic publishing are explicitly excluded from this phase.

## Implementation principles

- Resolve all personalized social content through the existing published/public eligibility boundary.
- Render images from an approved public projection, not from a browser screenshot.
- Keep private contact, location, booking, governance, and credential data out of images and share analytics.
- Preserve the canonical `/pandit/:slug` URL.
- Keep every external share or download user-initiated.
- Reuse `sharp`, `qrcode`, the current image host protections, and existing consent-aware analytics.

## Task 1: Freeze the social-image public projection

### Files

- Modify: `server/pandit-public-access.ts`
- Modify: `server/pandit-public-access.test.ts`
- Add: `server/pandit-social-sharing.ts`
- Add: `server/pandit-social-sharing.test.ts`

### Tests first

Add focused tests proving that the social projection:

1. Resolves a published and publicly eligible Pandit by slug.
2. Returns only:
   - Name
   - Published photo/banner
   - City and State
   - Verified status
   - Approved specializations/services
   - Eligible rating/review count
   - Published tagline
   - Slug and canonical URL
3. Rejects or returns no personalized projection for:
   - Missing slug
   - Unpublished storefront
   - Governance-ineligible Pandit
4. Does not expose:
   - Phone or WhatsApp
   - Exact coordinates
   - Draft content
   - Booking/customer data
   - Admin/governance notes
   - Social tokens or provider account identifiers

### Implementation

Create a typed `PanditSocialProjection` and resolver in `server/pandit-social-sharing.ts`.

The resolver must call `getPubliclyPublishedPanditBySlug`; it must not query raw Pandit records directly.

Normalize:

- Canonical path: `/pandit/:slug`
- Up to three public specializations
- Optional rating/review trust signal
- A safe display tagline
- A deterministic public-content revision used by image caches

### Verification

```bash
node --import tsx --test \
  server/pandit-public-access.test.ts \
  server/pandit-social-sharing.test.ts
```

## Task 2: Extract the reusable image-rendering foundation

### Files

- Modify: `server/pandit-social-sharing.ts`
- Modify: `server/pandit-social-sharing.test.ts`
- Modify: `server/pandit-storefront.ts`

### Tests first

Add renderer tests for:

- Exact 1200×630 JPEG output
- Expected public text
- No forbidden/private text
- Approved image loading
- Branded fallback when the source image fails
- Unsafe image host rejection
- Redirect rejection
- Four-second bounded fetch
- Deterministic cache behavior

### Implementation

Move the reusable parts of the current `/api/og/p/:slug.jpg` renderer from `server/pandit-storefront.ts` into `server/pandit-social-sharing.ts`:

- Safe remote image loader
- Host allowlist checks
- Fetch timeout
- SVG escaping
- Image fallback
- `sharp` SVG-to-JPEG pipeline
- `/tmp` cache management

Keep the existing Open Graph route public and crawler-accessible.

Use a cache key derived from:

- Slug
- Image format/template version
- Public-content revision

Do not expose filesystem cache paths.

### Verification

```bash
node --import tsx --test server/pandit-social-sharing.test.ts
```

## Task 3: Upgrade the Open Graph card

### Files

- Modify: `server/pandit-social-sharing.ts`
- Modify: `server/pandit-social-sharing.test.ts`
- Modify: `server/pandit-storefront.ts`

### Tests first

Assert that `/api/og/p/:slug.jpg`:

- Returns `200 image/jpeg` for a published eligible storefront
- Is exactly 1200×630
- Contains the approved hero hierarchy
- Falls back cleanly if the banner/photo cannot load
- Returns no personalized card for unpublished/ineligible storefronts
- Preserves safe response and cache headers

### Implementation

Render the upgraded card with:

- Banner or profile image
- Panditji name
- Verified badge when authoritative
- City and State
- Up to three specializations
- Eligible rating/review signal
- Short published tagline
- “Book this Panditji on Vedic Tatva”
- Canonical storefront URL
- Vedic Tatva maroon, gold, and cream visual system

Keep text within the 1200×630 social safe area.

### Verification

Use `sharp.metadata()` in tests to confirm dimensions and format.

## Task 4: Add the Story image renderer and route

### Files

- Modify: `server/pandit-social-sharing.ts`
- Modify: `server/pandit-social-sharing.test.ts`
- Modify: `server/pandit-storefront.ts`
- Modify: `server/pandit-seo-network-routes.contract.test.ts`

### Tests first

Add route and renderer coverage for:

- `GET /api/story/p/:slug.jpg`
- `200 image/jpeg`
- Exact 1080×1920 output
- Published/public eligibility
- Unpublished/ineligible 404 behavior
- Approved public data only
- Branded image fallback
- QR code generated from the server-built canonical URL
- Story text and QR inside safe zones
- Safe cache behavior

### Implementation

Create a vertical Story template containing:

- Strong image-led hero
- Name and verified status
- City and State
- Up to three approved specializations
- Eligible rating/review signal
- Published tagline
- Booking call to action
- Canonical URL
- QR code
- Vedic Tatva branding

Generate the QR code with the existing `qrcode` dependency. The route must construct the canonical URL server-side and never accept a caller-provided redirect URL.

Register the route beside the existing Open Graph route.

### Verification

```bash
node --import tsx --test \
  server/pandit-social-sharing.test.ts \
  server/pandit-seo-network-routes.contract.test.ts
```

## Task 5: Make storefront metadata authoritative

### Files

- Modify: `server/seo-ssr.ts`
- Modify: `server/seo-ssr.test.ts`
- Modify: `server/og-meta.ts` only if required by the existing SSR boundary
- Modify: `server/pandit-seo-network-routes.contract.test.ts`

### Tests first

For a published Pandit storefront, assert:

- Canonical URL is `/pandit/:slug`
- `og:image` is an absolute production URL ending in `/api/og/p/:slug.jpg`
- Twitter card metadata uses the same image
- Title and description come from the authoritative public Pandit projection
- Metadata exists before client hydration

For unpublished/ineligible storefronts, assert that personalized metadata and image URLs are not exposed.

### Implementation

Use the existing production URL resolver rather than constructing a Replit development URL.

Do not duplicate Organization JSON-LD or create a second public-storefront authority.

### Verification

```bash
node --import tsx --test \
  server/seo-ssr.test.ts \
  server/pandit-seo-network-routes.contract.test.ts
```

## Task 6: Build reusable share utilities

### Files

- Add: `client/src/lib/pandit-share.ts`
- Add: `client/src/lib/pandit-share.test.ts`

### Tests first

Cover:

- Canonical URL normalization
- WhatsApp intent construction
- Facebook share URL construction
- Native URL share support
- Native file-share capability using `navigator.canShare({ files })`
- Story JPEG fetch and `File` creation
- Browser download fallback
- Clipboard success and failure
- User-cancelled native share treated as neutral, not an error
- No private or identity-bearing analytics payload

### Implementation

Provide focused functions for:

- Native URL share
- WhatsApp share
- Facebook share
- Canonical link copy
- Story image fetch
- Native Story file share
- Story image download

Every function is called only from a user action. Do not auto-open a provider.

## Task 7: Build the accessible shared Share panel

### Files

- Add: `client/src/components/pandit/PanditSharePanel.tsx`
- Add: `client/src/components/pandit/PanditSharePanel.test.tsx` if supported by the current client test setup

### Tests first

Cover:

- Dialog title and description
- Focus management and keyboard close
- Story preview/alternative text
- Native Share
- WhatsApp
- Facebook
- Copy link
- Download Story
- Native Story file share when supported
- Instagram guidance when browser-to-Story publishing is unavailable
- Clear success/error status
- Explicit second-action semantics

### Implementation

The panel receives:

- `open`
- `onOpenChange`
- Canonical storefront URL
- Story image URL
- Pandit display name
- Safe analytics source

The panel must:

- Use the existing dialog primitives
- Preserve the maroon/gold/cream design system
- Explain that Instagram browser sharing may require downloading or using the device share sheet
- Keep Copy and Download available if native sharing is unsupported
- Avoid competing live-region announcements

## Task 8: Upgrade the public storefront Share experience

### Files

- Modify: `client/src/pages/pandit-storefront.tsx`
- Add or modify: storefront-focused client tests following the repository’s current test convention
- Modify: `client/src/lib/analytics.ts`
- Modify: `client/src/lib/analytics.test.ts`

### Tests first

Cover:

- Desktop Share entry point
- Mobile Share entry point
- Both open the same shared panel
- Canonical URL comes from the storefront response
- Story route uses the public slug
- Existing booking/contact/message actions remain intact
- No private data enters the share panel
- Consent-off analytics emit nothing
- Consent-on analytics use normalized slug/source only

### Implementation

Replace the desktop copy-only menu with `PanditSharePanel`.

Add a Share action to the mobile fixed action area without displacing the primary booking action.

Track safe events:

- `share_open`
- `share_native`
- `share_whatsapp`
- `share_facebook`
- `share_copy`
- `share_story_download`
- `share_story_native`

Do not send:

- Full URLs or query strings
- Share copy
- Contact data
- User identity
- Provider account information

## Task 9: Add Pandit portal sharing

### Files

- Modify: `client/src/pages/pandit-portal.tsx`
- Modify: `client/src/components/pandit/PanditStorefrontPanel.tsx`
- Add or modify: portal storefront tests following the repository’s current convention
- Modify: `server/pandit-storefront.ts` only if the private storefront DTO lacks the public slug/status required by the UI

### Tests first

Cover:

- Published storefront enables Share
- Unpublished or missing-slug storefront disables Share with an explanation
- All actions use the canonical public URL
- Portal ownership/auth boundaries remain unchanged
- Existing QR download remains available
- No private/social credential fields are added to public responses

### Implementation

Mount the same `PanditSharePanel` from the portal storefront area.

Use only the currently authenticated Pandit’s published slug and status. Do not accept an arbitrary slug from the client for private portal operations.

## Task 10: Complete route, privacy, and integration verification

### Files

- Modify: `server/pandit-public-access.test.ts`
- Modify: `server/pandit-social-sharing.test.ts`
- Modify: `server/pandit-seo-network-routes.contract.test.ts`
- Modify: `server/seo-ssr.test.ts`
- Modify: `client/src/lib/analytics.test.ts`
- Modify/add: focused share UI tests

### Automated verification

Run targeted tests first:

```bash
node --import tsx --test \
  server/pandit-social-sharing.test.ts \
  server/pandit-public-access.test.ts \
  server/seo-ssr.test.ts \
  server/pandit-seo-network-routes.contract.test.ts
```

Then run the repository checks appropriate to the existing baseline:

```bash
npm test
npm run check
npm run build
```

The repository has a documented pre-existing TypeScript baseline. Review touched-file diagnostics and reject new errors even if the global command remains non-zero.

### Runtime verification

Restart the application workflow once after the complete implementation batch.

Verify with a published test storefront:

```bash
curl -I "https://${REPLIT_DEV_DOMAIN}/api/og/p/<published-slug>.jpg"
curl -I "https://${REPLIT_DEV_DOMAIN}/api/story/p/<published-slug>.jpg"
```

Confirm:

- JPEG content type
- Expected dimensions
- QR resolves to the canonical storefront
- Unpublished slug does not produce a personalized image
- SSR source contains the correct canonical and Open Graph metadata
- No private fields appear in response bodies, image text, or logs

### Browser verification

Run one focused browser journey covering:

1. Public storefront desktop Share panel
2. Public storefront mobile Share panel
3. Copy link outcome
4. Story download or file-share fallback
5. WhatsApp/Facebook intent creation without posting
6. Authenticated Pandit portal Share action
7. Analytics consent on/off behavior

Do not publish to an external social account during testing.

## Phase 1 completion criteria

Phase 1 is complete when:

- Published storefronts have polished 1200×630 and 1080×1920 images.
- Open Graph metadata is server-rendered and authoritative.
- Public desktop, public mobile, and Pandit portal use one shared Share panel.
- Native share, WhatsApp, Facebook, copy, download, and file-share fallback work.
- Instagram limitations are explained accurately.
- No private Pandit or customer data enters previews, images, logs, or analytics.
- Unpublished/ineligible storefronts cannot generate personalized assets.
- Focused route, renderer, metadata, analytics, and browser checks pass.

## Explicitly deferred to Phase 2

- Facebook/Instagram OAuth
- Meta Page and Instagram professional-account selection
- Meta app review and publishing permissions
- Approved-template consent storage
- Daily schedules and timezone execution
- Durable publication history
- Retry and idempotency records
- Automatic Story publishing
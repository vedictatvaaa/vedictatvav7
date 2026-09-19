# Vedic Tatva Partner Selection Page

## Status

Approved design for implementation.

## Goal

Replace the existing `/partner` entry screen with a premium Partner Selection
page that helps a prospective provider choose how to join Vedic Tatva. The page
is an entry and navigation layer only. The existing Pandit authentication,
onboarding, dashboard, sessions, verification, image storage, catalogue, and
AI tools remain authoritative and unchanged.

## Scope and non-goals

### In scope

- Replace the current `/partner` page in place.
- Preserve the existing global Navbar controls while using a quiet partner
  shell on this route.
- Present active Pandit and unavailable Astrologer provider options.
- Present exactly four partner benefit cards.
- Present exactly four visual capability gauges without ratings or percentages.
- Present the four supplied platform-context statistics.
- Provide complete English and Hindi page copy.
- Add a utility-only page footer.
- Preserve responsive, keyboard-accessible, screen-reader-friendly behavior.

### Out of scope

- New authentication or login flows.
- New Pandit onboarding, dashboard, or provider data.
- Astrologer onboarding or activation.
- A database `provider_type` field or any database migration.
- A new product catalogue, reseller system, commission system, or AI tool.
- Changes to unrelated site routes or modules.
- Guaranteed income, sales, earnings, bookings, or commission claims.

## Route and shell behavior

The existing `/partner` route remains the public URL and is replaced in place.
The Pandit CTA navigates to the existing `/pandit/login` route. The Astrologer
card is rendered as unavailable and is not clickable or keyboard actionable.

The existing `Navbar` remains the source of truth for the Vedic Tatva wordmark,
menu, search, cart, language controls, and accessibility behavior. A
route-aware quiet variant will:

- Keep the Navbar controls and brand.
- Suppress the promo ribbon on `/partner`.
- Suppress the Tithi ribbon, mobile bottom navigation, deferred marketing
  widgets, and large global Footer on `/partner`.
- Let the page render its own small footer with only `Privacy | Terms | Help`.

The page includes a back control using existing navigation behavior, with a
home fallback when browser history is unavailable.

## Provider configuration

The static partner provider configuration will be extended to represent the
current display choices:

- `pandit`: active, destination `/pandit/login`.
- `astrologer`: inactive, no destination.

This configuration is for navigation/display only. It does not change the
database schema or create a second provider identity system. Future provider
types remain inactive until intentionally configured.

## Localization

The page uses the existing `I18nProvider` and `/hi` route twin behavior. Its
page-specific copy is kept in a focused English/Hindi copy model rather than
expanding the global translation type with one-off content.

When Hindi is active, all page-owned strings change, including:

- Eyebrow, headings, descriptions, and back link.
- Provider titles, statuses, descriptions, benefits, and CTAs.
- Benefit titles, descriptors, explanations, and badges.
- Gauge labels, descriptors, and descriptions.
- Statistics labels and closing message.
- Utility footer links and accessibility labels.

The existing Navbar language control remains responsible for changing and
persisting the locale and navigating between English and Hindi route twins.

## Visual direction

The supplied reference image defines the visual target:

- Warm ivory/cream background with subtle botanical or line-art atmosphere.
- Deep maroon headings and active actions.
- Muted antique-gold rules, borders, badges, and highlights.
- Near-black body text.
- Existing Vedic Tatva serif/sans typography conventions.
- Thin borders, soft shadows, translucent card surfaces, and approximately
  16–20px rounded corners.
- Spacious editorial composition with restrained motion and no invented logo or
  emblem.

### Page composition

1. Back row below the global Navbar.
2. Hero eyebrow: “PARTNER WITH A HIGHER PURPOSE”.
3. Two-line hero heading:
   “How would you like to join Vedic Tatva?”
4. Supporting description.
5. Two provider cards:
   - Pandit active, with diya/puja icon, three benefits, and
     “Continue as Pandit →”.
   - Astrologer muted, with planetary/zodiac icon, three benefits, and
     “Currently unavailable”.
6. Four benefit cards:
   - Free Lifetime Membership.
   - Free Lifetime Website.
   - Premium AI Planetary Tools.
   - Access to Vedic Tatva Product Catalog.
7. Four capability gauge cards:
   - Devotee Reach.
   - Service Discovery.
   - Digital Presence.
   - Booking Opportunity.

Each gauge uses approximately ten visual segments and descriptive labels only.
It must not expose scores, ratings, percentages, rankings, or probabilities.

8. Statistics strip containing only:
   - `500+` Pandits.
   - `10K+` Families.
   - `100+` Puja Types.
   - Pan-India Presence.
9. Centered closing message:
   “Your profile. Your services. Your digital presence — on Vedic Tatva.”
10. Utility-only footer:
    `Privacy | Terms | Help`.

## Responsive and accessibility behavior

- Mobile-first layout.
- Provider cards stack on narrow screens.
- Benefits use two columns where space permits and stack when necessary.
- Capability cards stack or use a compact grid.
- Statistics remain readable without horizontal scrolling.
- Existing Navbar language control stays visible.
- Buttons and links use large touch targets.
- Active Pandit actions have visible hover and keyboard focus states.
- Astrologer has no actionable interaction and communicates unavailable status
  textually.
- Use semantic headings, sections, links, and status text.
- Give decorative imagery and icons appropriate hidden/label behavior.
- Describe gauges as visual capability indicators, not progress or ratings.

## Implementation boundaries

Expected focused changes:

- `client/src/pages/partner.tsx` for the page composition and interactions.
- `client/src/lib/partner-providers.ts` for static provider configuration.
- `client/src/App.tsx` for the route-aware quiet shell behavior.
- A focused partner copy module if needed for complete English/Hindi strings.

Reuse existing `BrandMark`, icon packages, navigation patterns, locale provider,
and styling conventions. Do not add a dependency or database migration.

## Verification plan

Before completion, verify:

1. `/partner` renders the full page.
2. `/hi/partner` renders the complete page in Hindi.
3. The active Pandit CTA reaches `/pandit/login`.
4. The Astrologer card is visibly unavailable and cannot be activated.
5. The global promo/Tithi ribbons, mobile bottom navigation, deferred widgets,
   and large Footer do not leak into `/partner`.
6. The Navbar’s existing search, cart, menu, brand, language, and navigation
   behavior remains intact.
7. The page has no horizontal overflow at mobile and desktop widths.
8. Existing Pandit login and onboarding routes remain unchanged.
9. Production build succeeds.
10. Accessibility checks pass without introducing serious or critical issues.
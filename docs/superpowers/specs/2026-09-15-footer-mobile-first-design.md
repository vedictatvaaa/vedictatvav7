# Mobile-First Footer Refresh

**Status:** Approved for implementation  
**Date:** 2026-09-15

## Goal

Make the Vedic Tatva footer easier to scan and use on phones while keeping the existing canonical navigation, support routes, newsletter behavior, dynamic settings, and SEO-facing destination registry intact.

The design direction is **balanced**: task-focused on mobile, structured and spacious on desktop, with restrained brand and trust content.

## Design principles

- Put the most common customer actions before long-form navigation.
- Use mobile space for clear actions, not decorative density.
- Preserve all canonical destinations and existing deep links.
- Make every interactive control comfortable for touch and keyboard users.
- Keep trust language factual and visually subordinate to useful actions.
- Avoid a footer-only data request that does not help the customer complete a task.

## Mobile experience

The footer renders in this order:

1. **Newsletter**
   - A compact branded block with the existing localized eyebrow, description, email input, and submit action.
   - The input and submit button stack at narrow widths and remain at least 44px tall.
   - Loading, success, invalid-email, and request-error states remain unchanged.

2. **Help & Support**
   - Three full-width action cards appear directly below the newsletter:
     - Track an order
     - Returns & refunds
     - Contact support
   - Each card has a clear icon, title, short description, chevron, visible focus state, and a touch target of at least 44px.

3. **Brand and contact**
   - Site logo/name, short tagline, email, phone, location, and social links.
   - Email and phone remain direct `mailto:` and `tel:` actions.
   - Social links retain accessible labels, external-link behavior, and 44px hit areas.

4. **Browse navigation**
   - Shop, Services, Tools & Resources, and Company remain separate disclosure groups.
   - Groups are collapsed by default on mobile.
   - Headers clearly expose expanded/collapsed state through `aria-expanded` and `aria-controls`.
   - Expanded content uses a short, interruptible transition and respects `prefers-reduced-motion`.

5. **Policies and legal**
   - Policy links wrap naturally in a compact row.
   - Copyright and “made with” copy remain available.
   - Compliance details remain at the end with reduced visual emphasis.

## Desktop experience

- The newsletter becomes a horizontal row with the copy and form aligned without crowding.
- Support actions become three equal-width cards in one row.
- Brand and contact content occupy a wider first column.
- The four navigation groups render as clean desktop columns.
- Policies and copyright share a bottom row when viewport width allows.
- The layout keeps a consistent max-width, spacing rhythm, and no horizontal overflow.

## Content and performance changes

- Remove the live metrics strip from the footer.
  - The “Online now · this server” label is confusing for customers.
  - The metrics are not a primary footer task.
  - The repeated `/api/pandit-metrics` request adds work on every page without improving footer completion.
- Keep `FOOTER_DESTINATIONS` as the single source of truth.
- Keep all existing footer test IDs unless a structural change requires an additive selector.
- Do not add new SEO schema to the footer.
- Do not remove support routes, policies, canonical shopping links, spiritual tools, AI Kundli, or social/contact actions.

## Accessibility and interaction requirements

- All buttons, links, inputs, and social controls have visible keyboard focus states.
- Interactive controls are at least 44px tall or have an equivalent 44px hit area.
- Normal body text remains readable at mobile widths and does not rely on hover.
- Disclosure controls expose their state to assistive technology.
- The DOM order follows the visual priority order on mobile.
- Motion is limited to disclosure state changes and is disabled or reduced for users who request reduced motion.
- Color is not the only signal for focus or expanded state.

## Component/data boundaries

- Keep newsletter submission in `Footer`; only presentation classes and layout structure change.
- Keep dynamic site settings as the source for logo, social links, site name, email, and phone.
- Keep support actions as route-backed links.
- Remove the footer-only `useQuery` call and its metrics type/import once the stats strip is removed.
- Keep footer navigation data in `shared/footer-links.ts`.
- Keep the footer as a presentational/navigation component; no new server endpoints or database changes are needed.

## Error and empty states

- Newsletter validation and request failures continue to use the existing toast messages.
- Missing site settings continue to use the existing safe display defaults.
- Missing dynamic social settings continue to fall back to the configured static social list.
- A collapsed navigation group must remain usable if its link list is empty or later reduced.

## Verification plan

1. Run the existing footer destination contract test.
2. Run the project build and check for new diagnostics in the changed component.
3. Use the running preview to verify at 390px:
   - no horizontal overflow;
   - newsletter controls stack cleanly;
   - support actions are easy to tap;
   - all navigation groups collapse and expand;
   - focus states and accessible names are present.
4. Use the running preview to verify at 1280px:
   - newsletter and support sections align horizontally;
   - brand and navigation columns have balanced spacing;
   - policy and copyright rows remain readable.
5. Confirm canonical footer routes, AI Kundli, newsletter submission behavior, dynamic social links, and direct contact actions remain present.
6. Review workflow and browser logs for regressions after restart.

## Non-goals

- Rewriting footer copy or changing the footer destination registry.
- Adding a new visual theme, new icons, new server routes, or new analytics.
- Changing the site's global header, navigation, typography system, or brand palette.
- Replacing the existing newsletter provider or support flows.
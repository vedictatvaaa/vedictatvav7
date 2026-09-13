# Mobile City Browser Design

## Scope

Improve the all-cities section of `/book-pandit-online` for mobile browsing without changing Pandit storefront design, discovery eligibility, counts, or canonical URLs.

## Landing-page interaction

- Keep the approved 12 metros in their fixed business order as a horizontally scrollable shortcut row.
- Add a sticky city/state search control within the browse section.
- Do not expose the complete state/city hierarchy on the landing page.
- Replace the location disclosure with a clear **Browse all Pandits** action.
- Preserve at least 44px touch targets, visible focus states, keyboard controls, and semantic expanded/collapsed state.

## All-Pandits directory

- Use `/book-pandit-online/all` as the dedicated full-directory route.
- Show every currently discoverable Pandit using authoritative server-side eligibility.
- Provide name/keyword search and filters for state, cascading city, specialization/Pandit type, Puja/service, language, and online/in-person mode.
- Preserve filter and sort state in the URL.
- Show active filters as removable chips and provide a clear-all action.
- Use a mobile bottom sheet for filters and an inline desktop filter panel.
- Use bounded server pagination or progressive “load more”; never load the entire production catalogue into the initial mobile response.
- Sort only from verified data: recommended/default, experience, review evidence, and name.
- Do not fabricate ratings, popularity, availability, or recommendation claims.
- Hidden, suspended, unpublished, unverified, and otherwise ineligible Pandits remain excluded.

## Responsive behavior

- Mobile: single-column Pandit cards, sticky compact controls, and filter bottom sheet.
- Tablet: two-column card grid.
- Desktop: multi-column card grid with inline filters.

## Data and routing

- Continue using `/book-pandit-online/:stateSlug/:citySlug`.
- Add `/book-pandit-online/all` without conflicting with the state route.
- Derive clean city URL slugs from canonical city names.
- Counts must remain server-authoritative and match directory result eligibility.
- Searching and expanding are client-side presentation controls only.
- Do not fabricate availability or count values.

## Validation

- Verify 320px, 375px, 768px, and desktop layouts.
- Verify all 12 metros remain in approved order.
- Verify search by state, canonical city, and supported alias.
- Verify filter keyboard and touch behavior.
- Verify city links open the corresponding city result page.
- Verify empty/zero-count cities remain clear and useful.
- Verify pagination and filters cannot expose ineligible Pandits.

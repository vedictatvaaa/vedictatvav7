# Footer Link Hygiene and Mobile-First UX Design

## Goal

Make the customer-facing footer easier to use on phones, safer to crawl, and more trustworthy without changing the Vedic Tatva visual direction.

The footer should:

- guide visitors to canonical, useful destinations;
- remove dead, legacy, duplicate, and keyword-stuffed links;
- remain compact and scannable on mobile;
- expose the same meaningful navigation on desktop in a clearer hierarchy;
- preserve contact, trust, newsletter, social, and legal functions;
- avoid inventing location availability or SEO claims.

## Design

### Canonical link inventory

Move footer navigation into a small, typed canonical-link configuration rather than scattering destination strings through the component.

Keep one link per user intent across a small set of groups:

- Shop: real product/category destinations that use the current shop routes;
- Services: canonical Pandit booking, Puja booking, Virtual Puja, Astrology, and Donations destinations;
- Tools and resources: Panchang, Muhurat, Vastu, Kathas, Japa Counter, Journal, order tracking, and returns;
- Company: About, Contact, Careers, Franchise, Pandit registration, and Astrologer registration;
- Policies: terms, privacy, refund, shipping, and accessibility.

Replace legacy `/online-pandit-booking` usage with `/book-pandit-online`. Do not add new links to redirect aliases. Remove the hard-coded city-link cloud and the plain-text keyword strip; the directory and page-level SEO components own location and topical discovery.

### Mobile interaction

The logo, tagline, contact actions, newsletter, trust indicators, social links, and policy links remain visible. The four navigation groups become collapsible on mobile:

- each group has a real button with a visible chevron;
- buttons expose `aria-expanded` and `aria-controls`;
- collapsed content is not keyboard-focusable;
- groups use comfortable touch targets and visible focus styles;
- all groups are expanded as ordinary columns on medium and larger screens.

The footer must not introduce horizontal scrolling. The newsletter form stacks naturally at narrow widths, and the final legal row wraps without forcing tiny text.

### Semantic and visual hierarchy

Use a named footer navigation landmark with one visually hidden `h2` and `h3` headings for the navigation groups. Preserve the existing serif/gold/maroon identity while increasing readable contrast for low-opacity link text.

The footer should prioritize:

1. contact and support;
2. trust and secure-commerce information;
3. primary customer journeys;
4. secondary tools and company links;
5. legal links.

No footer JSON-LD or artificial keyword paragraph is added. Existing page-specific metadata and structured data remain authoritative.

## Error handling

- Missing or empty site-settings social/contact values continue to use the existing safe defaults.
- A missing live metrics response continues to display the existing neutral unavailable state rather than fabricated numbers.
- Footer navigation never points to an unverified internal URL.
- External social links retain `noopener noreferrer`, accessible names, and visible focus states.
- Collapsible state is local UI state only and does not affect routing or persistence.

## Verification

1. Add a focused footer link audit covering every internal footer destination:
   - canonical pages return `200`;
   - intentional aliases are rejected from the footer inventory;
   - query-bearing links use valid canonical bases.
2. Test the rendered footer at mobile and desktop widths.
3. Check mobile expansion/collapse, keyboard navigation, focus visibility, screen-reader names, and no horizontal overflow.
4. Run the existing build, route checks, and SEO/hydration checks.
5. Review the final footer for duplicate intents, unsupported city/service claims, and excessive link density.
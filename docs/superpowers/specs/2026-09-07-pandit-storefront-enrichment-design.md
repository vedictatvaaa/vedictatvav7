# Pandit Storefront Enrichment Design

## Objective

Enrich the canonical public Pandit storefront at `/pandit/:slug` with authoritative service categories, product ratings, service coverage, and trust cards. Preserve the existing storefront, booking, cart, referral, authentication, membership, SEO, and review behavior.

Legacy route consolidation is explicitly out of scope.

## Principles

1. Extend existing systems instead of creating parallel Pandit, product, review, credential, or storefront models.
2. Keep existing storefront response fields backward-compatible.
3. Publish only verified or Admin-approved claims.
4. Never expose private contact, financial, moderation, or reviewer data.
5. Keep public queries bounded and suitable for a directory containing at least 1,000 Pandits.

## Public API Contract

`GET /api/storefront/:slug` retains every existing field and adds optional nested enrichment objects.

### Service catalog

```ts
serviceCatalog: {
  categories: Array<{
    name: string;
    slug: string;
    serviceCount: number;
  }>;
  totalActiveServices: number;
}
```

Categories come from active canonical master services attached to active Pandit offerings. Counts are calculated server-side and never inferred from display labels in the client.

### Service coverage

```ts
serviceCoverage: {
  primaryLocation?: {
    city?: string;
    state?: string;
  };
  inPersonAreas: string[];
  onlineAvailable: boolean;
}
```

The primary location comes from the existing publicly eligible Pandit DTO. In-person areas are normalized, deduplicated values from active offerings. Online availability is derived from active offerings and their supported modes. Empty or unreviewed location values are omitted.

### Trust

```ts
trust: {
  verifiedFacts: Array<{
    key: string;
    label: string;
    detail?: string;
  }>;
  adminBadges: Array<{
    key: string;
    label: string;
    detail?: string;
  }>;
}
```

Verified facts may include:

- Vedic Tatva identity verification
- Public registration credential
- Active membership credential
- Years of experience
- Approved Pandit review count
- Completed booking count
- Approved professional credentials

Facts appear only when their authoritative source satisfies the public eligibility and publication rules. The server owns thresholds and wording.

Admin badges use a controlled allowlist. Admins select a badge key and may provide a short, sanitized detail where the selected badge permits it. Arbitrary badge labels, HTML, unsupported performance claims, and private operational notes are rejected.

Initial allowed badges:

- `vedic_scholar`
- `ritual_specialist`
- `online_puja_ready`
- `regional_expert`
- `community_choice`

Admin badges are presentation endorsements, not substitutes for verified facts.

## Bestseller Product Ratings

The storefront continues to consume `GET /api/bestsellers`, the same source used by the normal homepage.

Each returned bestseller may add:

```ts
rating?: number;
reviewCount?: number;
```

Ratings are aggregated only from approved, public product reviews. Products with no approved reviews omit both values. The aggregate query is bounded to the selected bestseller IDs and runs as one grouped query rather than one query per product.

Existing bestseller selection, pricing, MRP, stock, images, ordering, Admin settings, cart behavior, and referral attribution remain authoritative.

## Admin Badge Storage

Prefer a focused storefront-level representation because badges are public storefront presentation data.

Add a structured `trustBadges` JSON field to the existing Pandit storefront record only if the current credential model cannot represent the allowlisted endorsement cleanly. Validate the structure at the API boundary and store only allowlisted keys plus permitted detail.

No separate trust table is required for the initial bounded badge list.

## Backend Flow

1. Resolve the storefront by canonical slug.
2. Apply the existing Pandit public-eligibility and storefront-publication policies.
3. Start independent service, review, booking, credential, membership, gallery, availability, and package reads in parallel.
4. Build public category facets and service coverage from active public service DTOs.
5. Build verified trust facts from public-safe authoritative results.
6. Validate and map Admin badge keys through the server allowlist.
7. Return additive enrichment objects with existing storefront fields.
8. Enrich the bounded bestseller list with one approved-review aggregate query.

The implementation should remove or avoid product reads from the storefront DTO when the client does not consume per-Pandit curated products, provided this does not break another known consumer.

## Frontend Design

### Services

- Display category chips with server-provided service counts.
- Keep an `All` option using `totalActiveServices`.
- Filter the already-returned active services without additional requests.
- Show service-area information only when present.

### Service coverage

- Add a compact coverage card near Services/About.
- Separate in-person areas from online availability.
- Omit the card when no meaningful public coverage exists.

### Trust

- Add a compact trust-card row after the profile overview.
- Visually distinguish verified facts from Admin-selected endorsements.
- Avoid fake icons, scores, response times, success rates, or guarantees.
- Keep cards usable as a horizontal mobile scroller and a responsive desktop grid.

### Products

- Show approved product rating and review count on bestseller cards when available.
- Do not display a zero-star rating for unrated products.
- Keep existing stock, price, discount, cart, and referral behavior.

## Privacy and Security

The public response must not include:

- Phone numbers or email addresses
- Exact coordinates or private addresses
- Earnings, fees not already public, or membership payment details
- Account moderation reasons or internal statuses
- Reviewer email addresses
- Credential files that are not explicitly approved for public display
- Internal Admin notes

Admin badge writes require existing Admin authentication and strict schema validation. Badge details are plain text with a conservative length limit and no HTML.

## Performance

- Aggregate product ratings with a grouped query over selected bestseller IDs.
- Derive service facets and coverage from the bounded public service list.
- Run independent storefront reads concurrently.
- Batch package-item and curated-product reads where practical.
- Add indexes only for demonstrated query predicates; do not duplicate existing product-review and service indexes.
- Keep enrichment arrays bounded and deterministically ordered.

## Error Handling

- A missing or unpublished storefront retains the existing not-found behavior.
- Failure to load optional enrichment must not fabricate data.
- Bestseller rating aggregation failure should fail explicitly at the endpoint boundary rather than silently returning incorrect ratings.
- Invalid Admin badge payloads return a validation error and do not partially update storefront data.

## Testing

### Backend

- Existing storefront response remains backward-compatible.
- Ineligible or unpublished Pandits remain inaccessible.
- Service category counts include only active public offerings.
- Service areas are normalized and deduplicated.
- Online availability reflects active service modes.
- Verified trust facts appear only when their authoritative conditions are met.
- Only allowlisted Admin badges are accepted and published.
- Private fields remain absent.
- Bestseller ratings use approved product reviews only.
- Product-rating aggregation is bounded and grouped.

### Frontend

- Category counts and filtering use the server facets.
- Coverage and trust sections render real values and disappear when empty.
- Product ratings render only when present.
- Mobile horizontal sections do not cause page overflow.
- Existing booking, requirements sharing, cart, referral, reviews, gallery, and membership interactions remain intact.

## Release Boundaries

This change does not:

- Redirect `/pandit-profile/:id`
- Change canonical routes
- Expose Call or WhatsApp actions
- Create a second product/review system
- Replace existing Pandit eligibility rules
- Deploy automatically to production

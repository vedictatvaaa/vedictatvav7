import assert from "node:assert/strict";
import test from "node:test";
import { indexablePanditLocationPaths, indexableProfileSlugs } from "./sitemap";

test("people sitemap includes only projection-approved profile slugs", () => {
  const slugs = indexableProfileSlugs({
    profiles: [
      { pandit: { slug: "indexable-pandit" }, indexability: { indexable: true } },
      { pandit: { slug: "incomplete-pandit" }, indexability: { indexable: false } },
      { pandit: null, indexability: { indexable: false } },
    ],
    cities: [],
  } as any);
  assert.deepEqual([...slugs], ["indexable-pandit"]);
});

test("location sitemap uses central city and service indexability decisions", () => {
  const paths = indexablePanditLocationPaths({
    profiles: [],
    cities: [
      {
        canonicalUrl: "/book-pandit-online/varanasi",
        indexability: { indexable: true },
        services: [
          { canonicalUrl: "/book-pandit-online/varanasi/rudrabhishek-puja", indexability: { indexable: true } },
          { canonicalUrl: "/book-pandit-online/varanasi/rare-puja", indexability: { indexable: false } },
        ],
      },
      {
        canonicalUrl: "/book-pandit-online/gaya",
        indexability: { indexable: false },
        services: [],
      },
    ],
  } as any);
  assert.deepEqual([...paths], [
    "/book-pandit-online/varanasi",
    "/book-pandit-online/varanasi/rudrabhishek-puja",
  ]);
});
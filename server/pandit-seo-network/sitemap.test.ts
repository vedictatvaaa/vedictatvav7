import assert from "node:assert/strict";
import test from "node:test";
import { indexableProfileSlugs } from "./sitemap";

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
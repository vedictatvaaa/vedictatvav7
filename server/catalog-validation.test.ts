import assert from "node:assert/strict";
import test from "node:test";
import { masterServiceWriteSchema, panditServiceWriteSchema } from "./catalog-validation";

test("master services require lowercase stable slugs", () => {
  const valid = masterServiceWriteSchema.safeParse({
    name: "Griha Pravesh",
    slug: "griha-pravesh",
    category: "Home ceremonies",
    supportedModes: ["in_person", "online"],
    onlineAvailable: true,
    physicalAvailable: true,
  });
  assert.equal(valid.success, true);

  const invalid = masterServiceWriteSchema.safeParse({
    name: "Griha Pravesh",
    slug: "Griha Pravesh",
    category: "Home ceremonies",
  });
  assert.equal(invalid.success, false);
});

test("Pandit services enforce bounded server-side price, duration, and mode", () => {
  const valid = panditServiceWriteSchema.safeParse({
    masterServiceId: 1,
    price: 5100,
    durationMinutes: 90,
    mode: "in_person",
    description: "Traditional ceremony",
    inclusions: ["Sankalp"],
    serviceAreas: ["Varanasi"],
  });
  assert.equal(valid.success, true);

  const invalid = panditServiceWriteSchema.safeParse({
    masterServiceId: 1,
    price: -1,
    durationMinutes: 5,
    mode: "telephone",
  });
  assert.equal(invalid.success, false);
});
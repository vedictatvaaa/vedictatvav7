import assert from "node:assert/strict";
import test from "node:test";
import sharp from "sharp";
import { renderPanditSocialImage, socialSiteUrl, type PanditSocialProjection } from "./pandit-social-sharing";

const projection: PanditSocialProjection = {
  slug: "acharya-sharma",
  canonicalPath: "/pandit/acharya-sharma",
  name: "Acharya Sharma",
  image: "http://127.0.0.1:1/private.jpg",
  bannerImage: null,
  city: "Pune",
  state: "Maharashtra",
  verified: true,
  specialization: "Griha Pravesh",
  specializations: ["Griha Pravesh"],
  rating: 4.8,
  reviewCount: 12,
  tagline: "Traditional ceremonies with care",
  registrationNo: "1234567890",
  experience: 12,
  languages: ["Hindi", "Sanskrit"],
  revision: "test-revision",
};

test("renders a branded 1200x630 fallback card without private fields", async () => {
  const { buffer } = await renderPanditSocialImage(projection, "https://vedictatva.com", "og");
  const metadata = await sharp(buffer).metadata();
  assert.equal(metadata.format, "jpeg");
  assert.equal(metadata.width, 1200);
  assert.equal(metadata.height, 630);
  assert.ok(buffer.length > 1000);
  assert.equal(buffer.toString().includes("private.jpg"), false);
});

test("renders a branded 1080x1920 Story card with a QR composition", async () => {
  const { buffer } = await renderPanditSocialImage(projection, "https://vedictatva.com", "story");
  const metadata = await sharp(buffer).metadata();
  assert.equal(metadata.format, "jpeg");
  assert.equal(metadata.width, 1080);
  assert.equal(metadata.height, 1920);
  assert.ok(buffer.length > 1000);
});

test("reuses revision-keyed image cache", async () => {
  const revision = `cache-test-${process.pid}`;
  const first = await renderPanditSocialImage({ ...projection, revision }, "https://vedictatva.com", "og");
  const second = await renderPanditSocialImage({ ...projection, revision }, "https://vedictatva.com", "og");
  assert.equal(second.cacheHit, true);
  assert.deepEqual(second.buffer, first.buffer);
});

test("does not trust request host headers for public Story URLs", () => {
  const previous = process.env.PUBLIC_SITE_URL;
  delete process.env.PUBLIC_SITE_URL;
  try {
    const origin = socialSiteUrl({
      headers: { "x-forwarded-host": "169.254.169.254", host: "internal.local" },
      protocol: "http",
      get: () => "internal.local",
    });
    assert.equal(origin, "https://vedictatva.com");
  } finally {
    if (previous === undefined) delete process.env.PUBLIC_SITE_URL;
    else process.env.PUBLIC_SITE_URL = previous;
  }
});
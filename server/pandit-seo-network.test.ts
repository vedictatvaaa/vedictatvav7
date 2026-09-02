import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import "./pandit-seo-network/admin-routes.test";
import "./pandit-seo-network/city-seo.test";
import "./pandit-seo-network/public-api.test";
import "./pandit-seo-network/quality.test";
import "./pandit-seo-network/seo.test";
import "./pandit-seo-network/sitemap.test";

test("canonical location client uses exact service editorial and renders published content", () => {
  const source = fs.readFileSync(
    new URL("../client/src/pages/pandit-canonical-location.tsx", import.meta.url),
    "utf8",
  );
  assert.match(
    source,
    /cities\/\$\{encodeURIComponent\(citySlug\)\}\/services\/\$\{encodeURIComponent\(serviceSlug!\)\}/,
  );
  assert.match(source, /const editorial = selectedService\?\.editorial \|\| city\.editorial/);
  assert.match(source, /\{editorial\?\.introduction &&/);
  assert.match(source, /editorial\.faqs\.map/);
});
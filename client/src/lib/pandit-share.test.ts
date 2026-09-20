import assert from "node:assert/strict";
import test from "node:test";
import { canonicalShareUrl, facebookShareUrl, whatsappShareUrl } from "./pandit-share";

test("share URLs stay canonical and encode provider intents", () => {
  const url = canonicalShareUrl("/pandit/pt-ravi", "https://vedic-tatva.test");
  assert.equal(url, "https://vedic-tatva.test/pandit/pt-ravi");
  assert.match(whatsappShareUrl(url, "Pt Ravi — Vedic Tatva storefront"), /wa\.me\/\?text=/);
  assert.match(facebookShareUrl(url), /facebook\.com\/sharer\/sharer\.php\?u=/);
  assert.match(facebookShareUrl(url), /vedic-tatva\.test/);
});

test("canonicalShareUrl preserves an already absolute URL", () => {
  assert.equal(canonicalShareUrl("https://vedic-tatva.test/pandit/ravi"), "https://vedic-tatva.test/pandit/ravi");
});

test("relative storefront paths default to the production canonical origin", () => {
  assert.equal(canonicalShareUrl("/pandit/ravi"), "https://vedictatva.com/pandit/ravi");
});
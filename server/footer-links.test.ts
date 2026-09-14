import assert from "node:assert/strict";
import test from "node:test";
import { FOOTER_INTERNAL_HREFS } from "@shared/footer-links";

const devDomain = process.env.REPLIT_DEV_DOMAIN;

test("footer internal destinations are canonical and return indexable pages", {
  skip: !devDomain ? "requires the running Replit application workflow" : false,
  timeout: 120_000,
}, async () => {
  const origin = `https://${devDomain}`;

  assert.ok(!FOOTER_INTERNAL_HREFS.includes("/online-pandit-booking"));
  assert.ok(!FOOTER_INTERNAL_HREFS.some((href) => href.startsWith("/book-pandit-online?")));

  for (const href of FOOTER_INTERNAL_HREFS) {
    const response = await fetch(`${origin}${href}`, {
      headers: { accept: "text/html" },
      redirect: "manual",
    });

    assert.equal(
      response.status,
      200,
      `footer destination ${href} must return 200 without a redirect`,
    );
    assert.equal(
      response.headers.get("location"),
      null,
      `footer destination ${href} must not redirect to a legacy URL`,
    );
  }
});
import assert from "node:assert/strict";
import test from "node:test";
import { canonicalPanditRedirectTarget, panditRedirectTarget } from "./pandit-route-context";

test("legacy Pandit redirects preserve only validated mode and provider context", () => {
  assert.equal(
    panditRedirectTarget("/book-pandit-online/varanasi", {
      mode: "online",
      pandit: "42",
      token: "secret",
      email: "user@example.com",
      serviceId: "7",
    }),
    "/book-pandit-online/varanasi?mode=online&pandit=42",
  );
  assert.equal(
    panditRedirectTarget("/book-pandit-online", { mode: "invalid", pandit: "0" }),
    "/book-pandit-online",
  );
});

test("canonical profile redirects retain only allowlisted booking context", () => {
  assert.equal(
    canonicalPanditRedirectTarget("/pandit/acharya-test", {
      city: "varanasi",
      service: "griha-pravesh",
      mode: "hybrid",
      source: "directory",
      token: "private",
      email: "user@example.com",
      pandit: "99",
    }),
    "/pandit/acharya-test?city=varanasi&service=griha-pravesh&mode=hybrid&source=directory",
  );
});
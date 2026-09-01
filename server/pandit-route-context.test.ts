import assert from "node:assert/strict";
import test from "node:test";
import { panditRedirectTarget } from "./pandit-route-context";

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
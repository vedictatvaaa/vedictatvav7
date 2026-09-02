import assert from "node:assert/strict";
import test from "node:test";
import { validateCanonicalServiceBookingContext } from "./pandit-booking-context";

const authoritative = { masterServiceId: 100, cityId: 10, stateId: 1 };

test("canonical service booking context requires positive matching identifiers", () => {
  assert.equal(validateCanonicalServiceBookingContext({
    masterServiceId: 100, cityId: 10, stateId: 1,
  }, authoritative), null);
  assert.match(validateCanonicalServiceBookingContext({
    masterServiceId: 0, cityId: 10, stateId: 1,
  }, authoritative) || "", /required/);
  assert.match(validateCanonicalServiceBookingContext({
    masterServiceId: 101, cityId: 10, stateId: 1,
  }, authoritative) || "", /service context/);
  assert.match(validateCanonicalServiceBookingContext({
    masterServiceId: 100, cityId: 11, stateId: 1,
  }, authoritative) || "", /location context/);
});
import assert from "node:assert/strict";
import test from "node:test";
import {
  accessTokenBookingProjection,
  assignedPanditBookingProjection,
  candidatePanditBookingProjection,
  customerBookingProjection,
} from "./puja-booking/projections";

const booking = {
  id: 7, userId: 11, panditId: 21, mode: "offline", status: "pending",
  contactName: "Private Customer", contactPhone: "9999999999", contactEmail: "private@example.test",
  location: "12 Full Street", addressHouse: "12", addressStreet: "Full Street",
  addressLocality: "Assi", addressCity: "Varanasi", addressPostalCode: "221001",
  customerLatitude: 1, customerLongitude: 2, accessToken: "secret",
  pricingSnapshot: { internal: true }, needsReassignment: false,
};

test("candidate projection exposes area but no identity, contact, address, token, or internal metadata", () => {
  const projected = candidatePanditBookingProjection(booking);
  assert.equal(projected.approximateArea, "Assi, Varanasi");
  for (const key of ["contactPhone", "contactEmail", "location", "addressHouse", "addressStreet", "addressPostalCode", "accessToken", "pricingSnapshot", "userId"]) {
    assert.equal(key in projected, false, key);
  }
  assert.equal(projected.contactName, null);
});

test("only the assigned Pandit receives contact after release in an accepted state", () => {
  const released = { ...booking, status: "accepted", contactReleasedAt: new Date() };
  assert.equal(assignedPanditBookingProjection(released, 21).contactPhone, "9999999999");
  assert.equal("contactPhone" in assignedPanditBookingProjection(released, 22), false);
  assert.equal("contactPhone" in assignedPanditBookingProjection({ ...released, status: "declined" }, 21), false);
});

test("customer and access-token projections release only approved Pandit contact", () => {
  const pandit = { id: 21, name: "Pandit", phone: "8888888888", email: "pandit@example.test", verified: true };
  assert.equal(customerBookingProjection(booking, pandit).assignedPandit, null);
  const released = { ...booking, status: "accepted", contactReleasedAt: new Date() };
  assert.equal(customerBookingProjection(released, pandit).assignedPandit.phone, "8888888888");
  const tokenView = accessTokenBookingProjection(released);
  assert.equal("contactPhone" in tokenView, false);
  assert.equal("addressHouse" in tokenView, false);
  assert.equal("userId" in tokenView, false);
});
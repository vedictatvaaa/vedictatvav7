import assert from "node:assert/strict";
import test from "node:test";
import { bookingDeliveryKey, bookingEventKey, safeDeliveryError } from "./puja-booking/notification-events";

test("notification event and delivery keys dedupe exact retries", () => {
  const eventKey = bookingEventKey({ bookingId: 4, eventType: "booking_accepted", recipientParty: "customer", recipientId: 9 });
  assert.equal(eventKey, bookingEventKey({ bookingId: 4, eventType: "booking_accepted", recipientParty: "customer", recipientId: 9 }));
  const first = bookingDeliveryKey({ eventKey, recipient: 9, channel: "whatsapp", templateVersion: "v1" });
  assert.equal(first, bookingDeliveryKey({ eventKey, recipient: 9, channel: "whatsapp", templateVersion: "v1" }));
  assert.notEqual(first, bookingDeliveryKey({ eventKey, recipient: 9, channel: "email", templateVersion: "v1" }));
  assert.notEqual(first, bookingDeliveryKey({ eventKey, recipient: 9, channel: "whatsapp", templateVersion: "v2" }));
});

test("stored delivery errors redact contact data", () => {
  const safe = safeDeliveryError(new Error("failed private@example.test +919999999999"));
  assert.equal(safe.includes("private@example.test"), false);
  assert.equal(safe.includes("9999999999"), false);
});
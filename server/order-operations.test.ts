import test from "node:test";
import assert from "node:assert/strict";
import { ageing, allowedTransitions, isOperationallyStale, itemCounts, normalizeOrderStatus, paymentProjection, validateTransition, verifyInventory } from "./order-operations";

test("normalizes legacy statuses and validates only supported transitions", () => {
  assert.equal(normalizeOrderStatus("processing"), "CONFIRMED");
  assert.deepEqual(allowedTransitions("shipped"), ["IN_TRANSIT"]);
  assert.equal(validateTransition("paid", "confirmed").ok, true);
  assert.equal(validateTransition("delivered", "packed").ok, false);
});

test("derives conservative payment display data solely from stored order fields", () => {
  assert.deepEqual(
    paymentProjection({ paymentMethod: "COD", totalAmount: 499, status: "confirmed" }),
    { status: "payment_pending", method: "cash_on_delivery", paymentId: null, amount: 499, collectOnDelivery: true },
  );
  assert.equal(paymentProjection({ paymentMethod: "razorpay", paymentId: "pay_123", totalAmount: 499 }).status, "paid");
  assert.equal(paymentProjection({ paymentMethod: "razorpay", status: "confirmed" }).status, "paid");
  assert.equal(paymentProjection({ status: "pending" }).status, "unknown");
});

test("reports historical counts, ageing, and safe inventory verification without mutation", () => {
  const items = [{ productId: 1, sku: "A", quantity: 3 }, { sku: "unknown", quantity: 1 }];
  assert.deepEqual(itemCounts(items), { itemCount: 2, unitCount: 4, uniqueSkuCount: 2 });
  const products = [{ id: 1, stock: 2, upcEan: "A" }];
  const verification = verifyInventory(items, products);
  assert.equal(verification[0].status, "shortage");
  assert.equal(verification[0].shortBy, 1);
  assert.equal(verification[1].status, "unable_to_verify");
  assert.equal(products[0].stock, 2);
  assert.equal(ageing(new Date("2025-01-01"), new Date("2025-01-03")).stale, true);
  assert.equal(isOperationallyStale("pending", new Date("2025-01-01"), new Date("2025-01-03")), true);
  assert.equal(isOperationallyStale("delivered", new Date("2025-01-01"), new Date("2025-01-03")), false);
});
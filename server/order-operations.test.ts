import test from "node:test";
import assert from "node:assert/strict";
import { ageing, allowedTransitions, decrementMembershipCardInventory, isOperationallyStale, itemCounts, membershipCardAllocations, normalizeOrderStatus, parseInventoryAllocations, paymentProjection, validateTransition, verifyInventory } from "./order-operations";

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

test("card allocations survive intent JSON and drive aggregated stock finalization", async () => {
  const payload = {
    allocations: membershipCardAllocations([
      { productId: 7, quantity: 1, productType: "pandit_membership_card" },
      { productId: 7, quantity: 2, productType: "pandit_membership_card" },
      { productId: 8, quantity: 1, productType: "product" },
    ]),
  };
  const restored = JSON.parse(JSON.stringify(payload));
  assert.deepEqual(restored.allocations, [{ productId: 7, quantity: 3 }]);
  const stock = new Map([[7, 3]]);
  await decrementMembershipCardInventory(restored.allocations, async (allocation) => {
    const available = stock.get(allocation.productId) || 0;
    if (available < allocation.quantity) return false;
    stock.set(allocation.productId, available - allocation.quantity);
    return true;
  });
  assert.equal(stock.get(7), 0);
  assert.throws(() => parseInventoryAllocations([{ productId: 7, quantity: 1 }, { productId: 7, quantity: 1 }]), /Duplicate/);
});

test("conditional allocation contract leaves all stock unchanged on shortage rollback", () => {
  const original = new Map([[7, 2], [9, 0]]);
  const working = new Map(original);
  const allocations = parseInventoryAllocations([{ productId: 7, quantity: 2 }, { productId: 9, quantity: 1 }]);
  let failed = false;
  for (const allocation of allocations) {
    const available = working.get(allocation.productId) || 0;
    if (available < allocation.quantity) { failed = true; break; }
    working.set(allocation.productId, available - allocation.quantity);
  }
  if (failed) working.clear(), original.forEach((quantity, id) => working.set(id, quantity));
  assert.equal(failed, true);
  assert.deepEqual(working, original);
});
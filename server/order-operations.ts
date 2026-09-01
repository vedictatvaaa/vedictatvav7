/**
 * Pure order-operation policy and read projections. This module deliberately
 * has no database or HTTP dependency so all callers share one policy.
 */
export const OPERATIONAL_AGEING_THRESHOLD_HOURS = 24;

export type CanonicalOrderStatus =
  | "PLACED" | "PAYMENT_PENDING" | "PAID" | "CONFIRMED" | "PICKING" | "PACKING"
  | "PACKED" | "READY_TO_DISPATCH" | "DISPATCHED" | "IN_TRANSIT"
  | "OUT_FOR_DELIVERY" | "DELIVERED" | "CANCELLED" | "REFUND_PENDING"
  | "REFUNDED" | "RETURN_REQUESTED" | "RETURNED" | "FAILED";

const aliases: Record<string, CanonicalOrderStatus> = {
  pending: "PLACED", placed: "PLACED", payment_pending: "PAYMENT_PENDING",
  unpaid: "PAYMENT_PENDING", paid: "PAID", processing: "CONFIRMED",
  confirmed: "CONFIRMED", picking: "PICKING", packing: "PACKING", packed: "PACKED",
  ready_to_dispatch: "READY_TO_DISPATCH", ready: "READY_TO_DISPATCH",
  shipped: "DISPATCHED", dispatched: "DISPATCHED", in_transit: "IN_TRANSIT",
  out_for_delivery: "OUT_FOR_DELIVERY", delivered: "DELIVERED",
  cancelled: "CANCELLED", canceled: "CANCELLED", refund_pending: "REFUND_PENDING",
  refunded: "REFUNDED", return_requested: "RETURN_REQUESTED", returned: "RETURNED",
  failed: "FAILED",
};
for (const status of Object.values(aliases)) aliases[status.toLowerCase()] = status;

export function normalizeOrderStatus(value: unknown): CanonicalOrderStatus | null {
  const key = String(value ?? "").trim().toLowerCase().replace(/[\s-]+/g, "_");
  return aliases[key] || null;
}

const transitionMap: Record<CanonicalOrderStatus, CanonicalOrderStatus[]> = {
  PLACED: ["PAYMENT_PENDING", "PAID", "CANCELLED", "FAILED"],
  PAYMENT_PENDING: ["PAID", "CANCELLED", "FAILED"],
  PAID: ["CONFIRMED", "CANCELLED", "REFUND_PENDING"],
  CONFIRMED: ["PICKING", "CANCELLED", "REFUND_PENDING"],
  PICKING: ["PACKING", "CANCELLED"], PACKING: ["PACKED", "CANCELLED"],
  PACKED: ["READY_TO_DISPATCH"], READY_TO_DISPATCH: ["DISPATCHED"],
  DISPATCHED: ["IN_TRANSIT"], IN_TRANSIT: ["OUT_FOR_DELIVERY"],
  OUT_FOR_DELIVERY: ["DELIVERED"], DELIVERED: ["RETURN_REQUESTED"],
  CANCELLED: [], REFUND_PENDING: ["REFUNDED"], REFUNDED: [],
  RETURN_REQUESTED: ["RETURNED"], RETURNED: [], FAILED: [],
};
export const terminalOrderStatuses = new Set<CanonicalOrderStatus>(["DELIVERED", "CANCELLED", "REFUNDED", "RETURNED", "FAILED"]);
export const exceptionOrderStatuses = new Set<CanonicalOrderStatus>(["CANCELLED", "REFUND_PENDING", "REFUNDED", "RETURN_REQUESTED", "RETURNED", "FAILED"]);

export function allowedTransitions(status: unknown): CanonicalOrderStatus[] {
  const normalized = normalizeOrderStatus(status);
  return normalized ? transitionMap[normalized] : [];
}
export function validateTransition(current: unknown, target: unknown) {
  const from = normalizeOrderStatus(current);
  const to = normalizeOrderStatus(target);
  if (!from) return { ok: false as const, message: "Current order status is not supported", current: null, allowed: [] };
  if (!to) return { ok: false as const, message: "Requested order status is not supported", current: from, allowed: allowedTransitions(from) };
  if (from === to) return { ok: true as const, idempotent: true, current: from, target: to, allowed: allowedTransitions(from) };
  if (!allowedTransitions(from).includes(to)) return { ok: false as const, message: `Cannot transition from ${from} to ${to}`, current: from, allowed: allowedTransitions(from) };
  return { ok: true as const, idempotent: false, current: from, target: to, allowed: allowedTransitions(to) };
}
export function nextAction(status: unknown, options: { inventoryReady?: boolean; hasDispatch?: boolean } = {}) {
  const current = normalizeOrderStatus(status);
  const target = current && allowedTransitions(current).find(s => !exceptionOrderStatuses.has(s));
  if (!current || !target) return { action: null, targetStatus: null, available: false, reason: current ? "No further operational action" : "Unsupported order status" };
  if (target === "CONFIRMED" && options.inventoryReady === false) return { action: "Confirm order", targetStatus: target, available: false, reason: "Verified inventory shortage" };
  if (target === "DISPATCHED" && options.hasDispatch === false) return { action: "Mark dispatched", targetStatus: target, available: false, reason: "A dispatch record is required" };
  return { action: ({ CONFIRMED: "Confirm order", PICKING: "Start picking", PACKING: "Start packing", PACKED: "Complete packing", READY_TO_DISPATCH: "Prepare dispatch", DISPATCHED: "Mark dispatched", IN_TRANSIT: "Track shipment", OUT_FOR_DELIVERY: "Out for delivery", DELIVERED: "Mark delivered" } as Record<string, string>)[target] || `Move to ${target}`, targetStatus: target, available: true, reason: null };
}
export function ageing(createdAt: Date | string | null | undefined, now = new Date(), thresholdHours = OPERATIONAL_AGEING_THRESHOLD_HOURS) {
  const time = createdAt ? new Date(createdAt).getTime() : NaN;
  const ageHours = Number.isFinite(time) ? Math.max(0, (now.getTime() - time) / 3_600_000) : null;
  return { ageHours, thresholdHours, stale: ageHours !== null && ageHours >= thresholdHours, indicator: "operational_default" as const };
}
/** Terminal orders are never operationally stale, even when old. */
export function isOperationallyStale(status: unknown, createdAt: Date | string | null | undefined, now = new Date()) {
  const normalized = normalizeOrderStatus(status);
  return !normalized || !terminalOrderStatuses.has(normalized) ? ageing(createdAt, now).stale : false;
}
export function itemCounts(items: unknown) {
  const lines = Array.isArray(items) ? items : [];
  const skus = new Set<string>();
  let unitCount = 0;
  for (const item of lines as any[]) { unitCount += Number(item?.quantity) || 0; if (item?.sku) skus.add(String(item.sku)); }
  return { itemCount: lines.length, unitCount, uniqueSkuCount: skus.size };
}
/**
 * A display-only payment projection from the order snapshot. It deliberately
 * does not infer gateway/refund state or create a separate payment ledger.
 */
export function paymentProjection(order: { paymentMethod?: unknown; paymentId?: unknown; totalAmount?: unknown; status?: unknown }) {
  const rawMethod = typeof order.paymentMethod === "string" ? order.paymentMethod.trim() : "";
  const isCod = /\b(cod|cash[\s_-]*on[\s_-]*delivery)\b/i.test(rawMethod);
  const canonicalStatus = normalizeOrderStatus(order.status);
  const method = isCod ? "cash_on_delivery" : rawMethod || null;
  const paymentId = typeof order.paymentId === "string" && order.paymentId.trim() ? order.paymentId.trim() : null;
  const amount = Number.isFinite(Number(order.totalAmount)) ? Number(order.totalAmount) : null;
  if (isCod) return { status: "payment_pending" as const, method, paymentId, amount, collectOnDelivery: true };
  if (paymentId || canonicalStatus === "PAID" || (canonicalStatus === "CONFIRMED" && !!rawMethod)) {
    return { status: "paid" as const, method, paymentId, amount, collectOnDelivery: false };
  }
  return { status: rawMethod ? "payment_pending" as const : "unknown" as const, method, paymentId, amount, collectOnDelivery: false };
}
export function verifyInventory(items: unknown, products: Array<{ id: number; stock: number; upcEan?: string | null }> = []) {
  return (Array.isArray(items) ? items : []).map((item: any) => {
    const productId = Number(item?.productId ?? item?.product_id);
    const sku = item?.sku ? String(item.sku) : null;
    const matches = products.filter(p => (Number.isInteger(productId) && p.id === productId) || (!!sku && p.upcEan === sku));
    if (matches.length !== 1) return { status: "unable_to_verify" as const, requiredQuantity: Number(item?.quantity) || 0, availableQuantity: null };
    const requiredQuantity = Number(item?.quantity) || 0, availableQuantity = Number(matches[0].stock);
    return { status: availableQuantity >= requiredQuantity ? "ready" as const : "shortage" as const, requiredQuantity, availableQuantity, shortBy: Math.max(0, requiredQuantity - availableQuantity) };
  });
}
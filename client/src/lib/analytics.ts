import type { Product } from "@shared/schema";

type GtagFn = (...args: any[]) => void;

function getGtag(): GtagFn | null {
  const w = window as any;
  if (typeof w.gtag === "function") return w.gtag as GtagFn;
  return null;
}

function getDataLayer(): any[] | null {
  const w = window as any;
  return Array.isArray(w.dataLayer) ? (w.dataLayer as any[]) : null;
}

function hasGtm(): boolean {
  // GTM installs a <script id="gtm-loader"> via ThemeApplier, or injects the
  // standard GTM bootstrap tag. Either is a reliable signal.
  if (typeof document === "undefined") return false;
  if (document.getElementById("gtm-loader")) return true;
  return !!document.querySelector('script[src*="googletagmanager.com/gtm.js"]');
}

function emit(eventName: string, params: Record<string, any>) {
  try {
    const scalarParams = Object.fromEntries(
      Object.entries(params).filter(([, value]) => ["string", "number", "boolean"].includes(typeof value)),
    );
    (window as any).umami?.track(eventName, scalarParams);
    // Prefer direct gtag for GA4 setups; fall back to dataLayer only when
    // GTM is the active tag container (GTM ingests events via dataLayer).
    const g = getGtag();
    if (g && !hasGtm()) {
      g("event", eventName, params);
      return;
    }
    const dl = getDataLayer();
    if (dl) {
      dl.push({ event: eventName, ...params });
      return;
    }
    // As a last resort, if only gtag exists (no dataLayer, no GTM), still emit.
    if (g) g("event", eventName, params);
  } catch {
    /* analytics must never break the app */
  }
}

export function trackDiscoveryEvent(action: string, data: Record<string, string | number | boolean> = {}) {
  emit("pandit_discovery", { action, ...data });
}

function toGtagItem(p: Product, quantity: number, variant?: string) {
  return {
    item_id: String(p.id),
    item_name: p.name,
    item_category: p.category || undefined,
    item_variant: variant || undefined,
    price: p.price,
    quantity,
  };
}

export function trackViewItem(p: Product) {
  emit("view_item", {
    currency: "INR",
    value: p.price,
    items: [toGtagItem(p, 1)],
  });
}

export function trackAddToCart(p: Product, quantity: number, variant?: string) {
  emit("add_to_cart", {
    currency: "INR",
    value: p.price * quantity,
    items: [toGtagItem(p, quantity, variant)],
  });
}

export function trackRemoveFromCart(p: Product, quantity: number, variant?: string) {
  emit("remove_from_cart", {
    currency: "INR",
    value: p.price * quantity,
    items: [toGtagItem(p, quantity, variant)],
  });
}

export function trackBeginCheckout(
  items: { product: Product; quantity: number; variationLabel?: string }[],
  value: number,
) {
  emit("begin_checkout", {
    currency: "INR",
    value,
    items: items.map((i) => toGtagItem(i.product, i.quantity, i.variationLabel)),
  });
}

export function trackPurchase(
  transactionId: string,
  items: { product: Product; quantity: number; variationLabel?: string }[],
  value: number,
  opts: { shipping?: number; tax?: number; coupon?: string } = {},
) {
  emit("purchase", {
    transaction_id: transactionId,
    currency: "INR",
    value,
    shipping: opts.shipping,
    tax: opts.tax,
    coupon: opts.coupon,
    items: items.map((i) => toGtagItem(i.product, i.quantity, i.variationLabel)),
  });
}

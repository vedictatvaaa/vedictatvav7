export type TabId =
  | "dashboard" | "products" | "orders" | "pandits" | "pandit-apps" | "astrologers"
  | "bookings" | "reviews" | "returns" | "coupons" | "subscriptions" | "donations"
  | "matrimony" | "seo" | "merchant" | "site-settings" | "integrations" | "audit-log"
  | "social-proof" | "sales-popups" | "hero-slider" | "security" | "analytics" | "aplus"
  | "notifications" | "bestsellers" | "abandoned-carts" | "inventory" | "customers"
  | "blog" | "email-marketing" | "deploy" | "ai-assistant" | "ai-coder" | "backups"
  | "pandit-payouts" | "pandit-affiliate" | "pandit-memberships"
  | "mantras" | "schema-changelog"
  | "payment-gateways" | "ai-providers"
  | "blog-ai" | "puja-library" | "community" | "sacred-library"
  | "festivals" | "homepage-sections" | "visitors" | "api-setup" | "distribution" | "locations" | "knowledge-graph";

export type TabSection =
  | "Overview" | "Catalog" | "Orders & Bookings" | "People" | "Marketing" | "System";

export function createFetcher(token?: string) {
  return (url: string) => fetch(url, {
    headers: token ? { "x-admin-token": token } : {},
  }).then((r) => { if (!r.ok) throw new Error("Fetch failed"); return r.json(); });
}

// Unified status palette: amber (pending/warning), emerald (success),
// red (destructive), primary (in-flight/info), secondary (special),
// muted (neutral/closed). No blue/indigo/purple/green/yellow noise.
export const STATUS_COLORS: Record<string, string> = {
  pending:    "bg-amber-100 text-amber-900",
  paid:       "bg-emerald-100 text-emerald-900",
  confirmed:  "bg-primary/10 text-primary",
  packed:     "bg-secondary/20 text-foreground",
  shipped:    "bg-primary/15 text-primary",
  dispatched: "bg-primary/15 text-primary",
  delivered:  "bg-emerald-100 text-emerald-900",
  completed:  "bg-emerald-100 text-emerald-900",
  cancelled:  "bg-red-100 text-red-900",
  refunded:   "bg-muted text-muted-foreground",
};

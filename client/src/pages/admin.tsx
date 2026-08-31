import {
  useState, useEffect, lazy, Suspense, useMemo, useRef, Component,
  type ComponentType, type LazyExoticComponent, type ReactNode, type ErrorInfo,
} from "react";
import { useQuery, useIsMutating } from "@tanstack/react-query";
import {
  ShoppingCart, RotateCcw, CalendarClock, XCircle, Menu, Sparkles, Search,
  HelpCircle, PanelLeftClose, PanelLeft, AlertTriangle,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import type { Order, ReturnTicket, Subscription } from "@shared/schema";
import { createFetcher, type TabId } from "./admin-shared";
import { TABS, TAB_SECTIONS } from "./admin-tab-registry";
import { AdminAlertsBell } from "@/components/admin/AdminAlertsBell";
import { AdminTodayStats } from "@/components/admin/AdminTodayStats";

// ---- Per-tab lazy chunks: each tab is a separate JS bundle that is fetched
// only when the user navigates to it. Keeps the admin shell payload small.
//
// safeLazy wraps React.lazy with a one-shot reload guard. After a fresh
// deploy, an admin tab open in a stale tab still references the OLD chunk
// hash (e.g. DashboardTab-BOwIK0ju.js). Vite removes those files on rebuild,
// so the dynamic import 404s with "Failed to fetch dynamically imported
// module". Catch that, force a one-time reload to pull the fresh
// index.html (with the NEW chunk hashes), and only re-throw if the same
// chunk fails again on the reloaded page (real bug, not a stale-deploy
// artifact). Uses sessionStorage to ensure we never reload-loop.
const RELOAD_GUARD_KEY = "vt-admin-chunk-reload-guard";
type Preloadable<T extends ComponentType<any>> = LazyExoticComponent<T> & {
  preload: () => Promise<{ default: T }>;
};
function safeLazy<T extends ComponentType<any>>(
  loader: () => Promise<{ default: T }>,
): Preloadable<T> {
  // Memoize the (guarded) import so React.lazy and an eager preload() share a
  // single in-flight promise — hovering a sidebar tab warms the exact chunk
  // React will later await, with no double fetch.
  let cached: Promise<{ default: T }> | null = null;
  const load = (): Promise<{ default: T }> => {
    if (cached) return cached;
    cached = loader().then(
      (mod) => {
        // Any successful chunk load on this page proves the deploy is
        // consistent. Clear the guard so a FUTURE stale-chunk error in the
        // same session can recover with one reload again. (Clearing on
        // window.load would fire too eagerly and let a genuine import bug
        // on a later tab trigger an extra unnecessary reload.)
        try { sessionStorage.removeItem(RELOAD_GUARD_KEY); } catch {}
        return mod;
      },
      (err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        const isChunkLoadError = /Failed to fetch dynamically imported module|Importing a module script failed|ChunkLoadError|Loading chunk \d+ failed|mime type|JavaScript module script/i.test(msg);
        const alreadyReloaded = typeof sessionStorage !== "undefined" && sessionStorage.getItem(RELOAD_GUARD_KEY) === "1";
        if (isChunkLoadError && !alreadyReloaded && typeof window !== "undefined") {
          try { sessionStorage.setItem(RELOAD_GUARD_KEY, "1"); } catch {}
          window.location.reload();
          // Return a never-resolving promise so React keeps showing the
          // Suspense fallback until the page actually reloads.
          return new Promise<{ default: T }>(() => {});
        }
        // Drop the cache so a FUTURE preload() (e.g. a later hover) can re-run
        // the import. Note: this does not revive an already-rejected
        // React.lazy render — once a tab has rendered and its import failed,
        // React keeps that lazy type rejected, so recovery there is via the
        // chunk-reload guard above or the boundary's "Reload page" action.
        cached = null;
        throw err;
      },
    );
    return cached;
  };
  const Comp = lazy(load) as Preloadable<T>;
  Comp.preload = load;
  return Comp;
}

const DashboardTab          = safeLazy(() => import("./admin-tabs/DashboardTab"));
const ProductsTab           = safeLazy(() => import("./admin-tabs/ProductsTab"));
const OrdersTab             = safeLazy(() => import("./admin-tabs/OrdersTab"));
const PanditsTab            = safeLazy(() => import("./admin-tabs/PanditsTab"));
const PanditApplicationsTab = safeLazy(() => import("./admin-tabs/PanditApplicationsTab"));
const AstrologersTab        = safeLazy(() => import("./admin-tabs/AstrologersTab"));
const FestivalsTab           = safeLazy(() => import("./admin-tabs/FestivalsTab"));
const BookingsTab           = safeLazy(() => import("./admin-tabs/BookingsTab"));
const ReviewsTabContent     = safeLazy(() => import("./admin-tabs/ReviewsTabContent"));
const ReturnTicketsTab      = safeLazy(() => import("./admin-tabs/ReturnTicketsTab"));
const CouponsTab            = safeLazy(() => import("./admin-tabs/CouponsTab"));
const SubscriptionsTab      = safeLazy(() => import("./admin-tabs/SubscriptionsTab"));
const DonationsTab          = safeLazy(() => import("./admin-tabs/DonationsTab"));
const MatrimonyTab          = safeLazy(() => import("./admin-tabs/MatrimonyTab"));
const SeoManagerTab         = safeLazy(() => import("./admin-tabs/SeoManagerTab"));
const DistributionTab       = safeLazy(() => import("./admin-tabs/DistributionTab"));
const MerchantCenterTab     = safeLazy(() => import("./admin-tabs/MerchantCenterTab"));
const SiteSettingsTab       = safeLazy(() => import("./admin-tabs/SiteSettingsTab"));
const IntegrationsTab       = safeLazy(() => import("./admin-tabs/IntegrationsTab"));
const ProvidersTab          = safeLazy(() => import("./admin-tabs/ProvidersTab"));
const AuditLogTab           = safeLazy(() => import("./admin-tabs/AuditLogTab"));
const SocialProofTab        = safeLazy(() => import("./admin-tabs/SocialProofTab"));
const SalesPopupsTab        = safeLazy(() => import("./admin-tabs/SalesPopupsTab"));
const HeroSliderTab         = safeLazy(() => import("./admin-tabs/HeroSliderTab"));
const HomepageSectionsTab   = safeLazy(() => import("./admin-tabs/HomepageSectionsTab"));
const AnalyticsTab          = safeLazy(() => import("./admin-tabs/AnalyticsTab"));
const VisitorsTab           = safeLazy(() => import("./admin-tabs/VisitorsTab"));
const ApiSetupGuideTab      = safeLazy(() => import("./admin-tabs/ApiSetupGuideTab"));
const AplusListingsTab      = safeLazy(() => import("./admin-tabs/AplusListingsTab"));
const SecurityTab           = safeLazy(() => import("./admin-tabs/SecurityTab"));
const NotificationsTab      = safeLazy(() => import("./admin-tabs/NotificationsTab"));
const BestsellersTab        = safeLazy(() => import("./admin-tabs/BestsellersTab"));
const AbandonedCartsTab     = safeLazy(() => import("./admin-tabs/AbandonedCartsTab"));
const InventoryHealthTab    = safeLazy(() => import("@/components/admin/InventoryHealthTab").then(m => ({ default: m.InventoryHealthTab })));
const CustomersTab          = safeLazy(() => import("@/components/admin/CustomersTab").then(m => ({ default: m.CustomersTab })));
const BlogTab               = safeLazy(() => import("@/components/admin/BlogTab").then(m => ({ default: m.BlogTab })));
const EmailMarketingTab     = safeLazy(() => import("@/components/admin/EmailMarketingTab").then(m => ({ default: m.EmailMarketingTab })));
const AiAssistantTab        = safeLazy(() => import("./admin-tabs/AiAssistantTab"));
const AiCoderTab            = safeLazy(() => import("./admin-tabs/AiCoderTab"));
const AdminBackupsTab       = safeLazy(() => import("./admin-tabs/AdminBackupsTab"));
const SchemaChangelogTab    = safeLazy(() => import("./admin-tabs/SchemaChangelogTab"));
const PanditPayoutsTab      = safeLazy(() => import("./admin-tabs/PanditPayoutsTab"));
const PanditAffiliateTab    = safeLazy(() => import("./admin-tabs/PanditAffiliateTab"));
const PanditMembershipsTab  = safeLazy(() => import("./admin-tabs/PanditMembershipsTab"));
const MantrasTab            = safeLazy(() => import("./admin-tabs/MantrasTab"));
const BlogAiQueueTab        = safeLazy(() => import("./admin-tabs/BlogAiQueueTab"));
const PujaLibraryTab        = safeLazy(() => import("./admin-tabs/PujaLibraryTab"));
const CommunityTab          = safeLazy(() => import("./admin-tabs/CommunityTab"));
const SacredLibraryTab      = safeLazy(() => import("./admin-tabs/SacredLibraryTab"));

// id → lazy component, used to warm a tab's JS chunk on hover/focus so the
// click feels instant. Partial because a few legacy TabIds (e.g. the
// decommissioned "deploy" tab) have no rendered component; prefetchTab
// no-ops for those via optional chaining.
const TAB_COMPONENTS: Partial<Record<TabId, { preload: () => Promise<unknown> }>> = {
  dashboard: DashboardTab,
  products: ProductsTab,
  orders: OrdersTab,
  pandits: PanditsTab,
  "pandit-apps": PanditApplicationsTab,
  astrologers: AstrologersTab,
  festivals: FestivalsTab,
  bookings: BookingsTab,
  reviews: ReviewsTabContent,
  returns: ReturnTicketsTab,
  coupons: CouponsTab,
  subscriptions: SubscriptionsTab,
  donations: DonationsTab,
  matrimony: MatrimonyTab,
  seo: SeoManagerTab,
  distribution: DistributionTab,
  merchant: MerchantCenterTab,
  "site-settings": SiteSettingsTab,
  integrations: IntegrationsTab,
  "payment-gateways": ProvidersTab,
  "ai-providers": ProvidersTab,
  "audit-log": AuditLogTab,
  "social-proof": SocialProofTab,
  "sales-popups": SalesPopupsTab,
  "hero-slider": HeroSliderTab,
  "homepage-sections": HomepageSectionsTab,
  analytics: AnalyticsTab,
  visitors: VisitorsTab,
  "api-setup": ApiSetupGuideTab,
  aplus: AplusListingsTab,
  security: SecurityTab,
  notifications: NotificationsTab,
  bestsellers: BestsellersTab,
  "abandoned-carts": AbandonedCartsTab,
  inventory: InventoryHealthTab,
  customers: CustomersTab,
  blog: BlogTab,
  "email-marketing": EmailMarketingTab,
  "ai-assistant": AiAssistantTab,
  "ai-coder": AiCoderTab,
  backups: AdminBackupsTab,
  "schema-changelog": SchemaChangelogTab,
  "pandit-payouts": PanditPayoutsTab,
  "pandit-affiliate": PanditAffiliateTab,
  "pandit-memberships": PanditMembershipsTab,
  mantras: MantrasTab,
  "blog-ai": BlogAiQueueTab,
  "puja-library": PujaLibraryTab,
  community: CommunityTab,
  "sacred-library": SacredLibraryTab,
};
const prefetchedTabs = new Set<TabId>();
function prefetchTab(id: TabId) {
  if (prefetchedTabs.has(id)) return;
  prefetchedTabs.add(id);
  // Best-effort warm-up. On failure, forget it so a later hover/focus can
  // retry instead of permanently skipping this tab's chunk.
  TAB_COMPONENTS[id]?.preload?.().catch(() => { prefetchedTabs.delete(id); });
}

// Per-tab error boundary: if a single tab throws while rendering, show a
// contained, recoverable card instead of blanking the whole admin panel
// (the app-level AdminErrorBoundary still catches anything that escapes the
// shell). Remounts — and so resets — when the keyed content wrapper swaps on
// tab change, and offers an in-place retry that re-renders the same tab.
class TabErrorBoundary extends Component<
  { children: ReactNode; tabLabel?: string },
  { hasError: boolean; message: string }
> {
  constructor(props: { children: ReactNode; tabLabel?: string }) {
    super(props);
    this.state = { hasError: false, message: "" };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error?.message || "Something went wrong rendering this section." };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Admin tab error:", error.message, error.stack);
    fetch("/api/client-error", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: error.message, stack: error.stack, componentStack: info.componentStack }),
    }).catch(() => {});
  }
  handleRetry = () => this.setState({ hasError: false, message: "" });
  render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-xl mx-auto mt-8" data-testid="admin-tab-error">
          <div className="rounded-xl border border-border bg-card shadow-sm p-6 sm:p-8 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-[hsl(var(--accent))] flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6 text-[hsl(var(--primary))]" />
            </div>
            <h2 className="font-serif text-lg text-foreground mb-1.5">
              {this.props.tabLabel ? `Couldn't load ${this.props.tabLabel}` : "Something went wrong"}
            </h2>
            <p className="text-sm text-muted-foreground mb-3">
              This section hit an error, but the rest of the admin panel is still working.
            </p>
            <p className="text-xs text-muted-foreground/80 break-words mb-5 font-mono bg-muted/50 rounded px-2 py-1 inline-block max-w-full">
              {this.state.message}
            </p>
            <div className="flex items-center justify-center gap-2">
              <Button size="sm" onClick={this.handleRetry} className="gap-2" data-testid="button-tab-retry">
                <RotateCcw className="w-4 h-4" /> Try again
              </Button>
              <Button size="sm" variant="outline" onClick={() => window.location.reload()} data-testid="button-tab-reload">
                Reload page
              </Button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

interface AdminProps {
  adminToken?: string;
  onLogout?: () => void;
}

const SIDEBAR_PREF_KEY = "vt-admin-sidebar-open";
const LAST_TAB_KEY = "vt-admin-last-tab";

// Vim-style g+letter quick nav. Two-key sequence: press "g", then within
// 1.2s press one of these letters to jump to that tab.
const QUICK_NAV: Record<string, TabId> = {
  d: "dashboard",
  o: "orders",
  p: "products",
  c: "customers",
  b: "blog",
  r: "returns",
  s: "site-settings",
  i: "inventory",
  a: "analytics",
  e: "email-marketing",
};

export default function Admin({ adminToken, onLogout }: AdminProps) {
  // Active tab persistence: ?tab= wins (so deep-links / refresh work),
  // otherwise fall back to the last tab the admin used in this browser,
  // and finally to "dashboard" on first visit.
  const readTabFromUrl = (): TabId => {
    if (typeof window === "undefined") return "dashboard";
    const qs = new URLSearchParams(window.location.search).get("tab") as TabId | null;
    if (qs && TABS.some((t) => t.id === qs)) return qs;
    const stored = window.localStorage.getItem(LAST_TAB_KEY) as TabId | null;
    if (stored && TABS.some((t) => t.id === stored)) return stored;
    return "dashboard";
  };
  const [activeTab, setActiveTabState] = useState<TabId>(readTabFromUrl);
  const setActiveTab = (id: TabId) => {
    setActiveTabState(id);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", id);
      window.history.replaceState(null, "", url.toString());
      window.localStorage.setItem(LAST_TAB_KEY, id);
    }
  };
  useEffect(() => {
    const onPop = () => setActiveTabState(readTabFromUrl());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // Sidebar collapse persisted across sessions (desktop default = open, mobile = closed).
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window === "undefined") return true;
    const stored = window.localStorage.getItem(SIDEBAR_PREF_KEY);
    if (stored === "0") return false;
    if (stored === "1") return true;
    return window.innerWidth >= 768;
  });
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(SIDEBAR_PREF_KEY, sidebarOpen ? "1" : "0");
  }, [sidebarOpen]);

  const [paletteOpen, setPaletteOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const fetcher = createFetcher(adminToken);

  // Shared alerts query — TanStack dedupes against the AdminAlertsBell's
  // identical queryKey, so this adds zero extra network traffic. We use it
  // to render per-tab badge counts in the sidebar.
  type AlertsShape = {
    categories: Record<string, { count: number; tab: string }>;
  };
  const { data: alertsForBadges } = useQuery<AlertsShape>({
    queryKey: ["/api/admin/alerts"],
    queryFn: () => fetcher("/api/admin/alerts"),
    refetchInterval: 30_000,
    staleTime: 5_000,
  });
  const tabBadgeCounts = useMemo(() => {
    const out: Partial<Record<TabId, number>> = {};
    if (!alertsForBadges?.categories) return out;
    Object.values(alertsForBadges.categories).forEach((cat) => {
      const tabId = cat.tab as TabId;
      if (cat.count > 0) {
        out[tabId] = (out[tabId] || 0) + cat.count;
      }
    });
    return out;
  }, [alertsForBadges]);

  // Global "saving…" indicator: any in-flight mutation across any tab lights
  // up a small dot in the top bar so the admin knows their write hasn't
  // silently dropped.
  const mutatingCount = useIsMutating();

  // Cmd/Ctrl+K opens the palette; "?" opens the shortcuts cheat sheet;
  // "g" + letter (within 1.2s) jumps to a frequently-used tab.
  const gPressedAtRef = useRef<number>(0);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      const isEditable = tag === "INPUT" || tag === "TEXTAREA" || target?.isContentEditable;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        if (isEditable && !paletteOpen) return;
        e.preventDefault();
        setPaletteOpen((o) => !o);
        return;
      }
      if (isEditable || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "?") {
        e.preventDefault();
        setShortcutsOpen((o) => !o);
        return;
      }
      // Quick-nav sequence: "g" arms, next letter (within 1.2s) jumps.
      const now = Date.now();
      if (e.key === "g") {
        gPressedAtRef.current = now;
        return;
      }
      if (gPressedAtRef.current && now - gPressedAtRef.current < 1200) {
        const navTarget = QUICK_NAV[e.key.toLowerCase()];
        gPressedAtRef.current = 0;
        if (navTarget) {
          e.preventDefault();
          setActiveTab(navTarget);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [paletteOpen]);

  // Lightweight palette-only queries: fetched lazily once the palette opens.
  const { data: recentOrdersData } = useQuery<{ orders: Order[] }>({
    queryKey: ["/api/admin/orders", { page: 1, limit: 25, status: "all", search: "" }],
    queryFn: () => fetcher("/api/admin/orders?page=1&limit=25"),
    enabled: paletteOpen,
  });
  const { data: returnsForPalette } = useQuery<ReturnTicket[]>({
    queryKey: ["/api/return-tickets"],
    queryFn: () => fetcher("/api/return-tickets"),
    enabled: paletteOpen,
  });
  const { data: subsForPalette } = useQuery<Subscription[]>({
    queryKey: ["/api/subscriptions"],
    queryFn: () => fetcher("/api/subscriptions"),
    enabled: paletteOpen,
  });
  const recentOrders = recentOrdersData?.orders || [];
  const recentReturns = (Array.isArray(returnsForPalette) ? [...returnsForPalette] : []).sort((a, b) => b.id - a.id).slice(0, 5);
  const recentSubs = (Array.isArray(subsForPalette) ? [...subsForPalette] : []).sort((a, b) => b.id - a.id).slice(0, 5);

  const fallback = (
    <div className="space-y-4" data-testid="admin-tab-loading">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-96" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  );

  // Resolve the current tab's metadata for the top-bar title.
  const activeTabMeta = useMemo(
    () => TABS.find((t) => t.id === activeTab),
    [activeTab],
  );

  // Sync browser tab title with active admin tab so multi-tab admins know
  // which window they're looking at.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const prev = document.title;
    document.title = `${activeTabMeta?.label || "Admin"} · Vedic Tatva Admin`;
    return () => { document.title = prev; };
  }, [activeTabMeta]);

  // When switching tabs, scroll the content area back to the top so admins
  // don't land mid-page on a long form.
  const contentScrollRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    contentScrollRef.current?.scrollTo({ top: 0, behavior: "auto" });
  }, [activeTab]);

  return (
    <div
      className="flex h-[calc(100vh-5.75rem)] md:h-[calc(100vh-6rem)] bg-gradient-to-br from-[hsl(var(--background))] via-[hsl(var(--background))] to-[hsl(var(--accent))]/40"
      data-testid="admin-panel"
    >
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
          data-testid="sidebar-overlay"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-card/95 backdrop-blur border-r border-border flex flex-col shrink-0 transition-all duration-200 top-[5.75rem] md:top-0 md:relative shadow-sm ${
          sidebarOpen
            ? "translate-x-0 w-64"
            : "-translate-x-full md:translate-x-0 md:w-16 w-64"
        }`}
        data-testid="admin-sidebar"
      >
        {/* Brand block */}
        <div className="px-4 py-4 border-b border-border bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary))]/90 text-[hsl(var(--primary-foreground))]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] flex items-center justify-center shrink-0 shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            {sidebarOpen && (
              <div className="min-w-0">
                <div className="font-serif text-base font-semibold leading-tight truncate">
                  Vedic Tatva
                </div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-[hsl(var(--secondary))]/90 leading-tight">
                  Admin Console
                </div>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 min-h-0 p-2 space-y-4 overflow-y-auto overscroll-contain admin-scrollbar" data-lenis-prevent data-testid="admin-nav" aria-label="Admin sections">
          {TAB_SECTIONS.map((sec) => {
            const isActiveSection = activeTabMeta?.section === sec;
            return (
            <div key={sec} className="space-y-1">
              {sidebarOpen && (
                <div
                  className={`px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-[0.14em] transition-colors ${
                    isActiveSection
                      ? "text-[hsl(var(--secondary))]"
                      : "text-muted-foreground"
                  }`}
                >
                  {sec}
                </div>
              )}
              {TABS.filter((t) => t.section === sec).map((item) => {
                const isActive = activeTab === item.id;
                const badge = tabBadgeCounts[item.id];
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      if (window.innerWidth < 768) setSidebarOpen(false);
                    }}
                    onMouseEnter={() => prefetchTab(item.id)}
                    onFocus={() => prefetchTab(item.id)}
                    title={!sidebarOpen ? `${item.label}${badge ? ` (${badge})` : ""}` : undefined}
                    aria-current={isActive ? "page" : undefined}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors relative hover-elevate ${
                      isActive
                        ? "bg-[hsl(var(--accent))] text-[hsl(var(--primary))]"
                        : "text-foreground/80"
                    }`}
                    data-testid={`admin-tab-${item.id}`}
                  >
                    {isActive && (
                      <span
                        aria-hidden="true"
                        className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r bg-[hsl(var(--secondary))]"
                      />
                    )}
                    <span className="relative shrink-0">
                      <item.icon className={`w-4 h-4 ${isActive ? "text-[hsl(var(--primary))]" : ""}`} />
                      {!sidebarOpen && badge ? (
                        <span
                          aria-hidden="true"
                          className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[hsl(var(--secondary))] ring-2 ring-card"
                        />
                      ) : null}
                    </span>
                    {sidebarOpen && (
                      <>
                        <span className="truncate flex-1 text-left">{item.label}</span>
                        {badge ? (
                          <span
                            className="min-w-[1.25rem] px-1.5 py-0.5 rounded-full bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] text-[10px] font-bold text-center"
                            data-testid={`badge-tab-${item.id}`}
                          >
                            {badge > 99 ? "99+" : badge}
                          </span>
                        ) : null}
                      </>
                    )}
                  </button>
                );
              })}
            </div>
            );
          })}
        </nav>

        {/* Sidebar footer: collapse + logout */}
        <div className="p-2 border-t border-border space-y-1">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden md:flex w-full items-center gap-3 px-3 py-2 rounded-md text-xs font-medium text-muted-foreground hover-elevate"
            data-testid="toggle-sidebar"
          >
            {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
            {sidebarOpen && <span>Collapse sidebar</span>}
          </button>
          {onLogout && (
            <button
              onClick={() => {
                fetch("/api/admin/logout", { method: "POST", credentials: "include", headers: adminToken ? { "x-admin-token": adminToken } : {} });
                onLogout();
              }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-destructive hover-elevate"
              data-testid="btn-admin-logout"
            >
              <XCircle className="w-4 h-4 shrink-0" />
              {sidebarOpen && <span>Logout</span>}
            </button>
          )}
        </div>
      </aside>

      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed bottom-4 left-4 z-50 md:hidden w-12 h-12 rounded-full bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-lg flex items-center justify-center"
          data-testid="mobile-menu-toggle"
          aria-label="Open admin menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        {/* Premium top bar: page title + global actions (search palette, alerts, help) */}
        <header
          className="sticky top-0 z-30 flex items-center justify-between gap-3 px-4 sm:px-6 lg:px-8 py-3 border-b border-border bg-card/85 backdrop-blur-md"
          data-testid="admin-topbar"
        >
          <div className="min-w-0 flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-1.5 rounded-md hover-elevate"
              aria-label="Open menu"
              data-testid="topbar-menu-mobile"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                {activeTabMeta?.section || "Admin"}
              </div>
              <h1 className="font-serif text-lg sm:text-xl text-foreground leading-tight truncate" data-testid="topbar-title">
                {activeTabMeta?.label || "Dashboard"}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {mutatingCount > 0 && (
              <span
                className="hidden md:inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-[hsl(var(--accent))]/60 text-[hsl(var(--primary))] text-[11px] font-medium"
                data-testid="indicator-saving"
                title={`${mutatingCount} write${mutatingCount === 1 ? "" : "s"} in flight`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--secondary))] animate-pulse" />
                Saving…
              </span>
            )}
            <AdminTodayStats adminToken={adminToken} />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPaletteOpen(true)}
              className="hidden sm:inline-flex gap-2 text-muted-foreground"
              data-testid="topbar-palette"
            >
              <Search className="w-4 h-4" />
              <span className="hidden md:inline">Quick jump</span>
              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-muted text-foreground/70">⌘K</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="sm:hidden"
              onClick={() => setPaletteOpen(true)}
              aria-label="Quick jump"
              data-testid="topbar-palette-mobile"
            >
              <Search className="w-5 h-5" />
            </Button>

            <AdminAlertsBell adminToken={adminToken} onJumpToTab={setActiveTab} />

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShortcutsOpen(true)}
              aria-label="Keyboard shortcuts"
              data-testid="topbar-help"
            >
              <HelpCircle className="w-5 h-5" />
            </Button>
          </div>
        </header>

        {/* Tab content */}
        <div ref={contentScrollRef} className="flex-1 overflow-auto p-3 sm:p-6 lg:p-8" data-lenis-prevent>
          <div key={activeTab} className="max-w-6xl animate-in fade-in duration-200">
            <TabErrorBoundary tabLabel={activeTabMeta?.label}>
            <Suspense fallback={fallback}>
              {activeTab === "dashboard" && <DashboardTab setActiveTab={setActiveTab} />}
              {activeTab === "products" && <ProductsTab />}
              {activeTab === "orders" && <OrdersTab />}
              {activeTab === "pandits" && <PanditsTab />}
              {activeTab === "pandit-apps" && <PanditApplicationsTab adminToken={adminToken} />}
              {activeTab === "astrologers" && <AstrologersTab />}
              {activeTab === "festivals" && <FestivalsTab />}
              {activeTab === "bookings" && <BookingsTab />}
              {activeTab === "reviews" && <ReviewsTabContent />}
              {activeTab === "returns" && <ReturnTicketsTab adminToken={adminToken} />}
              {activeTab === "coupons" && <CouponsTab />}
              {activeTab === "subscriptions" && <SubscriptionsTab />}
              {activeTab === "donations" && <DonationsTab />}
              {activeTab === "matrimony" && <MatrimonyTab />}
              {activeTab === "seo" && <SeoManagerTab />}
              {activeTab === "distribution" && <DistributionTab adminToken={adminToken} />}
              {activeTab === "merchant" && <MerchantCenterTab adminToken={adminToken} />}
              {activeTab === "site-settings" && <SiteSettingsTab />}
              {activeTab === "integrations" && <IntegrationsTab />}
              {activeTab === "payment-gateways" && <ProvidersTab kind="payment" />}
              {activeTab === "ai-providers" && <ProvidersTab kind="ai" />}
              {activeTab === "audit-log" && <AuditLogTab adminToken={adminToken} />}
              {activeTab === "social-proof" && <SocialProofTab />}
              {activeTab === "sales-popups" && <SalesPopupsTab />}
              {activeTab === "hero-slider" && <HeroSliderTab />}
              {activeTab === "homepage-sections" && <HomepageSectionsTab />}
              {activeTab === "analytics" && <AnalyticsTab />}
              {activeTab === "visitors" && <VisitorsTab />}
              {activeTab === "api-setup" && <ApiSetupGuideTab />}
              {activeTab === "aplus" && <AplusListingsTab adminToken={adminToken} />}
              {activeTab === "security" && <SecurityTab adminToken={adminToken} />}
              {activeTab === "notifications" && <NotificationsTab adminToken={adminToken} />}
              {activeTab === "bestsellers" && <BestsellersTab adminToken={adminToken} />}
              {activeTab === "abandoned-carts" && <AbandonedCartsTab adminToken={adminToken} />}
              {activeTab === "inventory" && <InventoryHealthTab />}
              {activeTab === "customers" && <CustomersTab />}
              {activeTab === "blog" && <BlogTab adminToken={adminToken} />}
              {activeTab === "email-marketing" && <EmailMarketingTab adminToken={adminToken} />}
              {activeTab === "ai-assistant" && <AiAssistantTab adminToken={adminToken} />}
              {activeTab === "ai-coder" && <AiCoderTab adminToken={adminToken} />}
              {activeTab === "backups" && <AdminBackupsTab adminToken={adminToken} />}
              {activeTab === "schema-changelog" && <SchemaChangelogTab adminToken={adminToken} />}
              {activeTab === "pandit-payouts" && <PanditPayoutsTab adminToken={adminToken} />}
              {activeTab === "pandit-affiliate" && <PanditAffiliateTab adminToken={adminToken} />}
              {activeTab === "pandit-memberships" && <PanditMembershipsTab adminToken={adminToken} />}
              {activeTab === "mantras" && <MantrasTab adminToken={adminToken} />}
              {activeTab === "blog-ai" && <BlogAiQueueTab adminToken={adminToken} />}
              {activeTab === "puja-library" && <PujaLibraryTab adminToken={adminToken} />}
              {activeTab === "community" && <CommunityTab adminToken={adminToken} />}
              {activeTab === "sacred-library" && <SacredLibraryTab adminToken={adminToken} />}
            </Suspense>
            </TabErrorBoundary>
          </div>
        </div>
      </div>

      <Dialog open={shortcutsOpen} onOpenChange={setShortcutsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Keyboard Shortcuts</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-1.5">
                Global
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between py-1.5 border-b border-border">
                  <span className="text-muted-foreground">Open command palette</span>
                  <span className="font-mono text-xs px-2 py-1 rounded bg-muted">⌘ / Ctrl + K</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-border">
                  <span className="text-muted-foreground">Show this cheat sheet</span>
                  <span className="font-mono text-xs px-2 py-1 rounded bg-muted">?</span>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-muted-foreground">Close any dialog / palette</span>
                  <span className="font-mono text-xs px-2 py-1 rounded bg-muted">Esc</span>
                </div>
              </div>
            </div>

            <div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-1.5">
                Quick navigation · press <span className="font-mono">g</span> then a letter
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                {Object.entries(QUICK_NAV).map(([key, tabId]) => {
                  const meta = TABS.find((t) => t.id === tabId);
                  if (!meta) return null;
                  return (
                    <div key={key} className="flex items-center justify-between py-1 border-b border-border/60">
                      <span className="text-muted-foreground truncate">{meta.label}</span>
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-muted ml-2 shrink-0">
                        g {key}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <CommandDialog open={paletteOpen} onOpenChange={setPaletteOpen}>
        <CommandInput placeholder="Jump to a section or recent item..." data-testid="input-admin-command" />
        <CommandList>
          <CommandEmpty>No matching sections.</CommandEmpty>

          {(recentOrders.length > 0 || recentReturns.length > 0 || recentSubs.length > 0) && (
            <CommandGroup heading="Recent">
              {recentOrders.map((o) => (
                <CommandItem
                  key={`order-${o.id}`}
                  value={`order ${o.id} ${o.customerName || ""} ${o.customerEmail || ""}`}
                  onSelect={() => { setActiveTab("orders"); setPaletteOpen(false); }}
                  data-testid={`command-recent-order-${o.id}`}
                >
                  <ShoppingCart className="mr-2 h-4 w-4 text-primary" />
                  <span className="truncate">Order #{o.id} · {o.customerName || "Guest"}</span>
                  <span className="ml-auto text-xs text-muted-foreground capitalize">{o.status}</span>
                </CommandItem>
              ))}
              {recentReturns.map((t) => (
                <CommandItem
                  key={`ret-${t.id}`}
                  value={`return RT-${t.id} ${t.customerName || ""} ${t.productName || ""}`}
                  onSelect={() => { setActiveTab("returns"); setPaletteOpen(false); }}
                  data-testid={`command-recent-return-${t.id}`}
                >
                  <RotateCcw className="mr-2 h-4 w-4 text-primary" />
                  <span className="truncate">RT-{t.id} · {t.customerName || "Customer"}</span>
                  <span className="ml-auto text-xs text-muted-foreground capitalize">{t.status}</span>
                </CommandItem>
              ))}
              {recentSubs.map((s) => (
                <CommandItem
                  key={`sub-${s.id}`}
                  value={`subscription ${s.id} ${s.customerName || ""} ${s.productName || ""}`}
                  onSelect={() => { setActiveTab("subscriptions"); setPaletteOpen(false); }}
                  data-testid={`command-recent-sub-${s.id}`}
                >
                  <CalendarClock className="mr-2 h-4 w-4 text-primary" />
                  <span className="truncate">Sub #{s.id} · {s.productName}</span>
                  <span className="ml-auto text-xs text-muted-foreground capitalize">{s.status}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {Array.from(new Set(TABS.map((t) => t.section))).map((section) => (
            <CommandGroup key={section} heading={section}>
              {TABS.filter((t) => t.section === section).map((tab) => {
                const Icon = tab.icon;
                return (
                  <CommandItem
                    key={tab.id}
                    value={`${tab.section} ${tab.label}`}
                    onSelect={() => {
                      setActiveTab(tab.id);
                      setPaletteOpen(false);
                    }}
                    data-testid={`command-tab-${tab.id}`}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    <span>{tab.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </div>
  );
}

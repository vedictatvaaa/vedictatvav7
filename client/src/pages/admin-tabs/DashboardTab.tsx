import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Users, ShoppingCart, Package, IndianRupee, Plus, Star, BookOpen, Clock, FileText, Flame, Video } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

import { Button } from "@/components/ui/button";

import { Skeleton } from "@/components/ui/skeleton";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import type { Product, Pandit, Order } from "@shared/schema";

import { createFetcher, STATUS_COLORS, type TabId } from "../admin-shared";

interface AdminStats {
  totalProducts: number; inStockProducts: number; outOfStockProducts: number;
  totalPandits: number; pendingPandits: number;
  pendingPanditApplications: number; approvedPanditApplications: number;
  rejectedPanditApplications: number; totalPanditApplications: number;
  totalOrders: number; pendingOrders: number;
  totalPujaBookings: number; totalAstrologyBookings: number;
  pindDaanBookings: number; onlinePujaBookings: number; totalRevenue: number;
}

// ============================================================
// Dashboard Tab
// ============================================================
type IntegrationHealthEntry = { key: string; name?: string; label?: string; configured: boolean; lastPing?: { ok: boolean; message?: string } | null };

type PitruJobRow = { id: number; ancestorId: number; year: number; offsetDays: number; channel: string; status: string; reason?: string | null; sentAt?: string | null };
type PitruJobsPayload = { rows: PitruJobRow[]; totals: Array<{ status: string; n: number }>; totals30d?: Array<{ status: string; n: number }>; ancestors: number };

function IntegrationsHealthStrip({ setActiveTab, fetcher }: { setActiveTab: (tab: TabId) => void; fetcher: ReturnType<typeof createFetcher> }) {
  const { data } = useQuery<IntegrationHealthEntry[]>({
    queryKey: ["/api/admin/integrations/status"],
    queryFn: () => fetcher("/api/admin/integrations/status"),
    staleTime: 60_000,
  });
  if (!data || data.length === 0) return null;
  const missing = data.filter((d) => !d.configured);
  return (
    <button
      type="button"
      onClick={() => setActiveTab("integrations")}
      className="w-full flex items-center gap-3 px-4 py-2.5 rounded-md border border-secondary bg-card text-left hover-elevate"
      data-testid="dashboard-health-strip"
    >
      <span className={`h-2.5 w-2.5 rounded-full ${missing.length === 0 ? "bg-emerald-500" : "bg-amber-500"}`} />
      <span className="text-sm font-medium text-foreground">
        {missing.length === 0 ? "All integrations configured" : `${missing.length} integration${missing.length === 1 ? "" : "s"} need configuring`}
      </span>
      <span className="ml-auto flex items-center gap-1.5 flex-wrap">
        {data.map((d) => (
          <span
            key={d.key}
            className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${d.configured ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"}`}
            title={d.label || d.name || d.key}
          >
            {d.label || d.name || d.key}
          </span>
        ))}
      </span>
    </button>
  );
}

function PitruReminderTelemetryCard({ fetcher }: { fetcher: ReturnType<typeof createFetcher> }) {
  const { data } = useQuery<PitruJobsPayload>({
    queryKey: ["/api/admin/pitru/jobs"],
    queryFn: () => fetcher("/api/admin/pitru/jobs"),
  });
  const totals = data?.totals || [];
  const totals30d = data?.totals30d || [];
  const t = (k: string) => totals.find(x => x.status === k)?.n || 0;
  const t30 = (k: string) => totals30d.find(x => x.status === k)?.n || 0;
  const sent = t("sent"); const failed = t("failed"); const pending = t("pending"); const skipped = t("skipped");
  const sent30 = t30("sent"); const failed30 = t30("failed"); const skipped30 = t30("skipped");
  const recent = (data?.rows || []).slice(0, 8);
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-lg text-primary font-serif">Pitru Reminders</CardTitle>
        <CardDescription className="text-muted-foreground">
          {data?.ancestors ?? "—"} ancestors saved · automatic WhatsApp + email reminders 7d / 1d / 0d before each annual Shradh.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { k: "Sent", v: sent, cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
            { k: "Failed", v: failed, cls: "bg-red-50 text-red-700 border-red-200" },
            { k: "Pending", v: pending, cls: "bg-amber-50 text-amber-700 border-amber-200" },
            { k: "Skipped", v: skipped, cls: "bg-muted text-foreground border-border" },
          ].map((s) => (
            <div key={s.k} className={`rounded-md border p-3 ${s.cls}`} data-testid={`pitru-stat-${s.k.toLowerCase()}`}>
              <div className="text-[10px] uppercase tracking-wider font-bold opacity-70">{s.k}</div>
              <div className="text-xl font-bold">{s.v}</div>
            </div>
          ))}
        </div>
        <div className="text-[11px] text-muted-foreground" data-testid="pitru-30d-summary">
          Last 30 days: <span className="font-semibold text-foreground">{sent30}</span> sent · <span className="font-semibold text-foreground">{failed30}</span> failed · <span className="font-semibold text-foreground">{skipped30}</span> skipped
        </div>
        {recent.length > 0 && (
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Latest dispatch attempts</div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs" data-testid="table-pitru-recent">
                <thead className="text-left text-muted-foreground border-b border-border">
                  <tr><th className="py-1.5 pr-2">When</th><th className="pr-2">Ancestor</th><th className="pr-2">Year</th><th className="pr-2">Offset</th><th className="pr-2">Channel</th><th className="pr-2">Status</th><th>Reason</th></tr>
                </thead>
                <tbody>
                  {recent.map(r => (
                    <tr key={r.id} className="border-b border-border/50" data-testid={`pitru-row-${r.id}`}>
                      <td className="py-1.5 pr-2">{r.sentAt ? new Date(r.sentAt).toLocaleString() : "—"}</td>
                      <td className="pr-2">#{r.ancestorId}</td>
                      <td className="pr-2">{r.year}</td>
                      <td className="pr-2">T-{r.offsetDays}</td>
                      <td className="pr-2">{r.channel}</td>
                      <td className="pr-2">
                        <span className={`px-2 py-0.5 rounded-full font-semibold ${r.status === "sent" ? "bg-emerald-50 text-emerald-700" : r.status === "failed" ? "bg-red-50 text-red-700" : "bg-muted text-foreground"}`}>{r.status}</span>
                      </td>
                      <td className="text-muted-foreground truncate max-w-[200px]">{r.reason || ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

type ReviewFunnelStats = {
  windows: Array<{
    days: number;
    request1Sent: number;
    request2Sent: number;
    request2SkippedVerified: number;
    verifiedReviewsWithin14d: number;
  }>;
};

function ReviewFunnelCard({ fetcher }: { fetcher: ReturnType<typeof createFetcher> }) {
  const { data, isLoading } = useQuery<ReviewFunnelStats>({
    queryKey: ["/api/admin/review-funnel-stats"],
    queryFn: () => fetcher("/api/admin/review-funnel-stats"),
  });
  const windows = data?.windows || [];
  return (
    <Card className="bg-card border-border" data-testid="card-review-funnel">
      <CardHeader>
        <CardTitle className="text-lg text-primary font-serif">Review Reminder Funnel</CardTitle>
        <CardDescription className="text-muted-foreground">
          How the post-delivery review email + gentle reminder is converting into verified reviews.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-40 rounded-md" />
            <Skeleton className="h-40 rounded-md" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {windows.map((w) => {
              const ratio = w.request1Sent > 0
                ? Math.round((w.verifiedReviewsWithin14d / w.request1Sent) * 1000) / 10
                : 0;
              const stats = [
                { k: "First email sent", v: w.request1Sent, cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
                { k: "Reminder sent", v: w.request2Sent, cls: "bg-blue-50 text-blue-700 border-blue-200" },
                { k: "Reminder skipped (already reviewed)", v: w.request2SkippedVerified, cls: "bg-muted text-foreground border-border" },
                { k: "Verified reviews (≤14d)", v: w.verifiedReviewsWithin14d, cls: "bg-amber-50 text-amber-700 border-amber-200" },
              ];
              return (
                <div key={w.days} className="rounded-md border border-border p-3 space-y-3" data-testid={`review-funnel-window-${w.days}`}>
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Last {w.days} days
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {stats.map((s) => (
                      <div
                        key={s.k}
                        className={`rounded-md border p-2 ${s.cls}`}
                        data-testid={`review-funnel-${w.days}-${s.k.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`}
                      >
                        <div className="text-[10px] uppercase tracking-wider font-bold opacity-70">{s.k}</div>
                        <div className="text-xl font-bold">{s.v}</div>
                      </div>
                    ))}
                  </div>
                  <div className="text-xs text-muted-foreground" data-testid={`review-funnel-conversion-${w.days}`}>
                    Conversion: <span className="font-semibold text-foreground">{ratio}%</span> of first emails turned into a verified review within 14 days.
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DashboardTab({ setActiveTab }: { setActiveTab: (tab: TabId) => void }) {
  const adminToken = typeof window !== "undefined" ? localStorage.getItem("adminToken") || "" : "";
  const fetcher = createFetcher(adminToken);
  const [dateRange, setDateRange] = useState<string>("all");
  const { fromQS, toQS, fromLabel } = (() => {
    if (dateRange === "all") return { fromQS: "", toQS: "", fromLabel: "All time" };
    const today = new Date().toISOString().split("T")[0];
    if (dateRange === "today") return { fromQS: today, toQS: today, fromLabel: "Today" };
    const days = Number(dateRange);
    const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    return { fromQS: from, toQS: today, fromLabel: `Last ${days} days` };
  })();
  const statsUrl = fromQS ? `/api/admin/stats?from=${fromQS}&to=${toQS}` : "/api/admin/stats";
  const topUrl = fromQS ? `/api/admin/stats/top-products?from=${fromQS}&to=${toQS}` : "/api/admin/stats/top-products";
  const { data: stats, isLoading } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats", dateRange],
    queryFn: () => fetcher(statsUrl),
  });
  const { data: topProducts } = useQuery<{ top: Array<{ id: number; name: string; units: number; revenue: number }>; ordersConsidered: number }>({
    queryKey: ["/api/admin/stats/top-products", dateRange],
    queryFn: () => fetcher(topUrl),
  });

  const { data: ordersPage } = useQuery<{ orders: Order[]; total: number }>({
    queryKey: ["/api/admin/orders", { page: 1, limit: 5 }],
    queryFn: () => fetcher("/api/admin/orders?page=1&limit=5"),
  });

  const recentOrders = ordersPage?.orders || [];

  const statCards = [
    { label: "Total Revenue", value: stats ? `₹${stats.totalRevenue.toLocaleString()}` : "—", icon: IndianRupee, color: "text-emerald-600 bg-emerald-50", border: "border-emerald-200" },
    { label: "Products", value: stats?.totalProducts ?? "—", sub: stats ? `${stats.inStockProducts} in stock · ${stats.outOfStockProducts} out` : "", icon: Package, color: "text-blue-600 bg-blue-50", border: "border-blue-200" },
    { label: "Pandits", value: stats?.totalPandits ?? "—", sub: stats?.pendingPandits ? `${stats.pendingPandits} unverified` : "", icon: Users, color: "text-purple-600 bg-purple-50", border: "border-purple-200" },
    {
      label: "Pandit Applications",
      value: stats?.totalPanditApplications ?? "—",
      sub: stats
        ? `${stats.pendingPanditApplications} pending · ${stats.approvedPanditApplications} approved · ${stats.rejectedPanditApplications} rejected`
        : "",
      icon: FileText,
      color: "text-fuchsia-600 bg-fuchsia-50",
      border: "border-fuchsia-200",
    },
    { label: "Orders", value: stats?.totalOrders ?? "—", sub: stats?.pendingOrders ? `${stats.pendingOrders} pending` : "", icon: ShoppingCart, color: "text-orange-600 bg-orange-50", border: "border-orange-200" },
    { label: "Puja Bookings", value: stats?.totalPujaBookings ?? "—", icon: BookOpen, color: "text-rose-600 bg-rose-50", border: "border-rose-200" },
    { label: "Astrology Bookings", value: stats?.totalAstrologyBookings ?? "—", icon: Star, color: "text-amber-600 bg-amber-50", border: "border-amber-200" },
    { label: "Pind Daan Bookings", value: stats?.pindDaanBookings ?? "—", sub: "Kashi · Gaya · Haridwar · Yearly Remote", icon: Flame, color: "text-red-600 bg-red-50", border: "border-red-200" },
    { label: "Online Puja Bookings", value: stats?.onlinePujaBookings ?? "—", sub: "Pujas booked in online mode", icon: Video, color: "text-indigo-600 bg-indigo-50", border: "border-indigo-200" },
  ];

  return (
    <div className="min-w-0 space-y-6 sm:space-y-8">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
        <div>
          <h1 className="text-3xl font-serif text-primary mb-1" data-testid="page-title-dashboard">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Overview of your Vedic Tatva platform — {fromLabel}</p>
        </div>
        <div className="w-full sm:w-44">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger data-testid="select-dashboard-date-range">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last 365 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <IntegrationsHealthStrip setActiveTab={setActiveTab} fetcher={fetcher} />

      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 md:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 md:grid-cols-4 xl:grid-cols-5">
          {statCards.map((stat, i) => (
            <Card key={i} className={`min-w-0 bg-card border shadow-sm ${stat.border}`} data-testid={`stat-card-${i}`}>
              <CardContent className="flex min-h-[112px] items-start gap-3 p-3.5 sm:p-4">
                <div className={`shrink-0 rounded-lg p-2.5 ${stat.color}`}>
                  <stat.icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[.1em] text-secondary">{stat.label}</p>
                  <p className="truncate font-serif text-xl font-bold text-foreground sm:text-2xl">{stat.value}</p>
                  {stat.sub && <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-muted-foreground">{stat.sub}</p>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pitru reminder telemetry */}
      <PitruReminderTelemetryCard fetcher={fetcher} />

      {/* Review reminder funnel */}
      <ReviewFunnelCard fetcher={fetcher} />

      {/* Recent Orders */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg text-primary font-serif">Recent Orders</CardTitle>
          <CardDescription className="text-muted-foreground">Latest orders across the platform</CardDescription>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No orders yet</p>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 rounded-lg bg-muted border border-border" data-testid={`recent-order-${order.id}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                      #{order.id}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{order.customerName || "Guest"}</p>
                      <p className="text-xs text-muted-foreground">₹{order.totalAmount.toLocaleString()}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[order.status] || "bg-muted text-foreground"}`}>
                    {order.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Products by revenue (within the selected date range) */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg text-primary font-serif">Top Products</CardTitle>
          <CardDescription className="text-muted-foreground">By revenue · {fromLabel}{topProducts ? ` · across ${topProducts.ordersConsidered} orders` : ""}</CardDescription>
        </CardHeader>
        <CardContent>
          {!topProducts ? (
            <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 rounded-md" />)}</div>
          ) : topProducts.top.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No paid orders in this range yet.</p>
          ) : (
            <div className="space-y-2">
              {topProducts.top.map((p, idx) => {
                const max = topProducts.top[0]?.revenue || 1;
                const pct = Math.max(4, Math.round((p.revenue / max) * 100));
                return (
                  <div key={p.id} className="flex items-center gap-3 p-2 rounded-md bg-muted border border-border" data-testid={`top-product-${p.id}`}>
                    <div className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">#{idx + 1}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground truncate" title={p.name}>{p.name}</div>
                      <div className="h-1.5 bg-border rounded-full overflow-hidden mt-1">
                        <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-bold text-primary">₹{p.revenue.toLocaleString("en-IN")}</div>
                      <div className="text-[10px] text-secondary uppercase tracking-wide">{p.units} sold</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg text-primary font-serif">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          {[
            { label: "Add Product", icon: Plus, tab: "products" as TabId },
            { label: stats?.pendingPanditApplications ? `Review ${stats.pendingPanditApplications} Pandit Application${stats.pendingPanditApplications === 1 ? "" : "s"}` : "Review Pandit Applications", icon: FileText, tab: "pandit-apps" as TabId },
            { label: "Check Pending Orders", icon: Clock, tab: "orders" as TabId },
          ].map((action, i) => (
            <Button key={i} variant="outline" className="gap-2 border-secondary/30 text-primary" data-testid={`quick-action-${i}`} onClick={() => setActiveTab(action.tab)}>
              <action.icon className="w-4 h-4" />
              {action.label}
            </Button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}


export default DashboardTab;

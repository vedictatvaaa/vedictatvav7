import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Activity, Smartphone, Monitor, Tablet, Globe, MapPin,
  TrendingUp, Users, Clock, ExternalLink, Download, RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { createFetcher } from "../admin-shared";

// ── helpers ─────────────────────────────────────────────────────────────────

function fmtDate(val: string | Date | null | undefined) {
  if (!val) return "—";
  const d = new Date(val as string);
  return isNaN(d.getTime()) ? "—" : d.toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" });
}

function downloadCsv(filename: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map(r =>
      headers.map(h => {
        const v = r[h];
        if (v === null || v === undefined) return "";
        const s = String(v);
        return `"${s.replace(/"/g, '""')}"`;
      }).join(",")
    ),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ── mini bar component ───────────────────────────────────────────────────────

function MiniBar({ items, colorClass = "bg-primary" }: { items: { name: string; count: number }[]; colorClass?: string }) {
  const max = Math.max(...items.map(i => i.count), 1);
  return (
    <div className="space-y-2">
      {items.map(item => (
        <div key={item.name} className="flex items-center gap-2 text-sm">
          <span className="w-28 shrink-0 truncate text-muted-foreground" title={item.name}>{item.name}</span>
          <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
            <div className={`h-2 rounded-full ${colorClass}`} style={{ width: `${(item.count / max) * 100}%` }} />
          </div>
          <span className="w-10 text-right font-medium text-xs">{item.count}</span>
        </div>
      ))}
    </div>
  );
}

// ── sparkline (daily chart) ──────────────────────────────────────────────────

function DailyChart({ data }: { data: { date: string; count: number }[] }) {
  if (!data.length) return <p className="text-center text-muted-foreground py-8 text-sm">No data yet</p>;
  const max = Math.max(...data.map(d => d.count), 1);
  const barW = Math.max(4, Math.min(20, Math.floor(560 / data.length) - 2));

  return (
    <div className="overflow-x-auto">
      <div className="flex items-end gap-0.5 h-40 min-w-max px-1">
        {data.map(d => {
          const h = Math.max(2, Math.round((d.count / max) * 148));
          const label = new Date(d.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
          return (
            <div key={d.date} className="flex flex-col items-center gap-1 group" style={{ width: barW }}>
              <div
                className="w-full rounded-t bg-primary/70 hover:bg-primary transition-colors cursor-default"
                style={{ height: h }}
                title={`${label}: ${d.count} views`}
              />
              {data.length <= 14 && (
                <span className="text-[9px] text-muted-foreground rotate-45 origin-left hidden group-hover:block absolute">
                  {label}
                </span>
              )}
            </div>
          );
        })}
      </div>
      {/* X-axis labels for up to 14 days */}
      {data.length <= 14 && (
        <div className="flex gap-0.5 px-1 mt-1">
          {data.map(d => (
            <div key={d.date} className="text-center text-[9px] text-muted-foreground" style={{ width: barW }}>
              {new Date(d.date).getDate()}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── device icon ──────────────────────────────────────────────────────────────

function DeviceIcon({ device }: { device: string | null }) {
  if (device === "mobile") return <Smartphone className="w-3.5 h-3.5 text-blue-500" />;
  if (device === "tablet") return <Tablet className="w-3.5 h-3.5 text-purple-500" />;
  return <Monitor className="w-3.5 h-3.5 text-emerald-600" />;
}

// ── main tab ─────────────────────────────────────────────────────────────────

function VisitorsTab() {
  const adminToken = typeof window !== "undefined" ? localStorage.getItem("adminToken") || "" : "";
  const fetcher = createFetcher(adminToken);
  const [days, setDays] = useState("30");

  const { data, isLoading, refetch, isFetching } = useQuery<any>({
    queryKey: ["/api/admin/analytics/visitors", days],
    queryFn: () => fetcher(`/api/admin/analytics/visitors?days=${days}`),
    refetchInterval: 60_000,
  });

  const summary = data?.summary || {};
  const daily: { date: string; count: number }[] = data?.daily || [];
  const devices: { name: string; count: number }[] = data?.devices || [];
  const browsers: { name: string; count: number }[] = data?.browsers || [];
  const oses: { name: string; count: number }[] = data?.os || [];
  const topPages: { path: string; count: number }[] = data?.topPages || [];
  const topCities: { name: string; count: number }[] = data?.topCities || [];
  const topCountries: { name: string; count: number }[] = data?.topCountries || [];
  const topReferrers: { name: string; count: number }[] = data?.topReferrers || [];
  const recent: any[] = data?.recent || [];

  const totalInRange = daily.reduce((s, d) => s + d.count, 0);

  const deviceTotal = devices.reduce((s, d) => s + d.count, 0);
  const mobileCount = devices.find(d => d.name === "mobile")?.count || 0;
  const tabletCount = devices.find(d => d.name === "tablet")?.count || 0;
  const desktopCount = devices.find(d => d.name === "desktop")?.count || 0;

  return (
    <div className="min-w-0 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-serif text-primary" data-testid="page-title-visitors">Visitors</h1>
          <p className="text-sm text-muted-foreground">Real-time traffic analytics — device, location, source & behaviour</p>
        </div>
        <div className="grid w-full grid-cols-[minmax(0,1fr)_44px] gap-2 min-[390px]:grid-cols-[minmax(0,1fr)_44px_auto] sm:flex sm:w-auto sm:flex-wrap">
          <Select value={days} onValueChange={setDays}>
            <SelectTrigger className="h-11 w-full sm:w-[150px]" data-testid="select-visitor-days">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 Days</SelectItem>
              <SelectItem value="30">Last 30 Days</SelectItem>
              <SelectItem value="90">Last 90 Days</SelectItem>
              <SelectItem value="365">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" className="h-11 w-11" onClick={() => refetch()} disabled={isFetching} aria-label="Refresh visitor analytics" data-testid="btn-refresh-visitors">
            <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="col-span-2 min-h-11 gap-1.5 min-[390px]:col-span-1"
            onClick={() => downloadCsv(`visitors-${new Date().toISOString().slice(0,10)}.csv`,
              recent.map(r => ({ id: r.id, path: r.path, device: r.device, browser: r.browser, os: r.os, city: r.city, country: r.country, referrer: r.referrer || "", created_at: fmtDate(r.createdAt) }))
            )}
            disabled={!recent.length}
            data-testid="btn-download-visitors-csv"
          >
            <Download className="w-4 h-4" /> CSV
          </Button>
        </div>
      </div>

      {/* Summary stat cards */}
      {isLoading ? (
          <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 md:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 md:grid-cols-5">
          {[
            { label: "Today",      value: summary.today,     icon: <Activity className="w-4 h-4" />,  color: "text-primary" },
            { label: "Yesterday",  value: summary.yesterday, icon: <Clock className="w-4 h-4" />,     color: "text-secondary" },
            { label: "This Week",  value: summary.week,      icon: <TrendingUp className="w-4 h-4" />, color: "text-primary" },
            { label: "This Month", value: summary.month,     icon: <Users className="w-4 h-4" />,     color: "text-secondary" },
            { label: "All Time",   value: summary.total,     icon: <Globe className="w-4 h-4" />,     color: "text-primary" },
          ].map(card => (
            <Card key={card.label} className="bg-card border-border">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                  {card.icon}
                  <p className="text-xs uppercase tracking-wider">{card.label}</p>
                </div>
                <p className={`text-2xl font-bold ${card.color}`}>{(card.value ?? 0).toLocaleString("en-IN")}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Daily chart */}
      <Card className="min-w-0 overflow-hidden bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg text-primary flex items-center gap-2">
            <TrendingUp className="w-4 h-4" /> Page Views — Last {days} Days
            <span className="ml-auto text-sm font-normal text-muted-foreground">{totalInRange.toLocaleString("en-IN")} total</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="min-w-0">
          {isLoading ? <Skeleton className="h-40 w-full" /> : <DailyChart data={daily} />}
        </CardContent>
      </Card>

      {/* Device + Browser + OS row */}
      <div className="grid min-w-0 gap-4 md:grid-cols-3 md:gap-6">
        <Card className="bg-card border-border">
          <CardHeader><CardTitle className="text-base text-primary flex items-center gap-2"><Smartphone className="w-4 h-4" /> Devices</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? <Skeleton className="h-24" /> : (
              <>
                <div className="grid grid-cols-3 gap-2 text-center">
                  {[
                    { icon: <Monitor className="w-5 h-5 mx-auto text-emerald-600" />, label: "Desktop", count: desktopCount },
                    { icon: <Smartphone className="w-5 h-5 mx-auto text-blue-500" />, label: "Mobile", count: mobileCount },
                    { icon: <Tablet className="w-5 h-5 mx-auto text-purple-500" />, label: "Tablet", count: tabletCount },
                  ].map(d => (
                    <div key={d.label} className="bg-muted/40 rounded-lg p-2">
                      {d.icon}
                      <p className="text-xs text-muted-foreground mt-1">{d.label}</p>
                      <p className="font-bold text-sm">{d.count.toLocaleString()}</p>
                      <p className="text-[10px] text-muted-foreground">{deviceTotal ? Math.round((d.count / deviceTotal) * 100) : 0}%</p>
                    </div>
                  ))}
                </div>
                {devices.length > 0 && <MiniBar items={devices} colorClass="bg-primary/60" />}
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader><CardTitle className="text-base text-primary">Browsers</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-32" /> : browsers.length > 0 ? <MiniBar items={browsers} colorClass="bg-secondary/70" /> : <p className="text-sm text-muted-foreground text-center py-6">No data yet</p>}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader><CardTitle className="text-base text-primary">Operating Systems</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-32" /> : oses.length > 0 ? <MiniBar items={oses} colorClass="bg-amber-500/60" /> : <p className="text-sm text-muted-foreground text-center py-6">No data yet</p>}
          </CardContent>
        </Card>
      </div>

      {/* Location + Sources row */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="bg-card border-border">
          <CardHeader><CardTitle className="text-base text-primary flex items-center gap-2"><MapPin className="w-4 h-4" /> Top Cities</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-40" /> : topCities.length > 0 ? (
              <MiniBar items={topCities} colorClass="bg-primary/70" />
            ) : (
              <div className="text-center py-6 space-y-1">
                <p className="text-sm text-muted-foreground">Geo data appears after first real visitors</p>
                <p className="text-xs text-muted-foreground">(localhost IPs are not geo-resolved)</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader><CardTitle className="text-base text-primary flex items-center gap-2"><Globe className="w-4 h-4" /> Top Countries</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-40" /> : topCountries.length > 0 ? (
              <MiniBar items={topCountries} colorClass="bg-emerald-600/60" />
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">Geo data appears after first real visitors</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Pages + Traffic Sources */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="bg-card border-border">
          <CardHeader><CardTitle className="text-base text-primary flex items-center gap-2"><Activity className="w-4 h-4" /> Top Pages</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-48" /> : topPages.length > 0 ? (
              <div className="space-y-2">
                {topPages.slice(0, 12).map((p, i) => {
                  const max = topPages[0].count;
                  return (
                    <div key={p.path} className="flex items-center gap-2 text-sm">
                      <span className="w-5 text-xs text-muted-foreground text-right shrink-0">{i + 1}</span>
                      <span className="flex-1 truncate text-xs font-mono text-foreground" title={p.path}>{p.path}</span>
                      <div className="w-20 bg-muted rounded-full h-1.5 overflow-hidden">
                        <div className="h-1.5 rounded-full bg-primary/60" style={{ width: `${(p.count / max) * 100}%` }} />
                      </div>
                      <span className="w-10 text-right text-xs font-medium">{p.count}</span>
                    </div>
                  );
                })}
              </div>
            ) : <p className="text-sm text-muted-foreground text-center py-6">No page views yet</p>}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader><CardTitle className="text-base text-primary flex items-center gap-2"><ExternalLink className="w-4 h-4" /> Traffic Sources</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-48" /> : topReferrers.length > 0 ? (
              <MiniBar items={topReferrers} colorClass="bg-secondary/60" />
            ) : <p className="text-sm text-muted-foreground text-center py-6">No referrer data yet</p>}
          </CardContent>
        </Card>
      </div>

      {/* Live visitor log */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-base text-primary flex items-center gap-2">
            <Activity className="w-4 h-4" /> Recent Visitor Log
            <Badge variant="outline" className="ml-auto text-xs">{recent.length} rows</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? <Skeleton className="h-48" /> : recent.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No visits recorded yet — visitors will appear here as they browse the site.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    {["Time", "Page", "Device", "Browser", "OS", "City", "Country", "Source"].map(h => (
                      <th key={h} className="text-left py-2 pr-4 text-muted-foreground font-medium whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recent.map((r: any) => (
                    <tr key={r.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="py-2 pr-4 whitespace-nowrap text-muted-foreground">{fmtDate(r.createdAt)}</td>
                      <td className="py-2 pr-4 max-w-[180px] truncate font-mono" title={r.path}>{r.path}</td>
                      <td className="py-2 pr-4">
                        <span className="flex items-center gap-1 capitalize">
                          <DeviceIcon device={r.device} />{r.device || "—"}
                        </span>
                      </td>
                      <td className="py-2 pr-4 whitespace-nowrap">{r.browser || "—"}</td>
                      <td className="py-2 pr-4 whitespace-nowrap">{r.os || "—"}</td>
                      <td className="py-2 pr-4 whitespace-nowrap">{r.city || <span className="text-muted-foreground italic">resolving…</span>}</td>
                      <td className="py-2 pr-4 whitespace-nowrap">{r.country || "—"}</td>
                      <td className="py-2 pr-4 max-w-[120px] truncate text-muted-foreground" title={r.referrer || "Direct"}>
                        {r.referrer ? (() => { try { return new URL(r.referrer).hostname.replace(/^www\./, ""); } catch { return r.referrer; } })() : "Direct"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default VisitorsTab;

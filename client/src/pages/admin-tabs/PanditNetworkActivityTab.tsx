import { useMemo } from "react";
import { Activity, AlertTriangle, CheckCircle2, Clock3, RefreshCw, ShieldCheck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { createFetcher } from "../admin-shared";

type Metric = { key: string; label: string; value: number | null; definition: string; updatedAt?: string | null; health: "healthy" | "stale" | "unavailable" | "error"; scope?: "global" | "this_instance"; };
type ActivityResponse = { metrics?: Metric[]; updatedAt?: string | null; health?: string; cacheTtlSeconds?: number; };
const fallbackDefinitions: Record<string, string> = {
  servingNow: "Distinct devotees attached to bookings whose authoritative lifecycle status means the Puja is currently in progress.",
  servedLast24h: "Distinct devotees attached to qualifying active or completed Puja bookings in the rolling previous 24 hours.",
  pujasBooked: "Qualifying Puja bookings, excluding cancelled, rejected, expired, deleted, and test records.",
  panditsNetwork: "Legitimate enrolled Pandit records across all states and cities.",
  discoverablePandits: "Pandits satisfying the public directory and search eligibility policy.",
  onlineNow: "This server instance's recent portal heartbeat presence inside the existing five-minute window; not a universal online count.",
  availableToBook: "Published Pandits satisfying booking eligibility at the time of calculation.",
};

function healthLabel(health: Metric["health"]) {
  return health === "healthy" ? "Healthy" : health === "stale" ? "Stale" : health === "unavailable" ? "Unavailable" : "Error";
}

export default function PanditNetworkActivityTab() {
  const adminToken = typeof window !== "undefined" ? localStorage.getItem("adminToken") || "" : "";
  const fetcher = createFetcher(adminToken);
  const query = useQuery<ActivityResponse>({
    queryKey: ["/api/admin/pandit-network/activity"],
    queryFn: () => fetcher("/api/admin/pandit-network/activity") as Promise<ActivityResponse>,
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
  const metrics = useMemo(() => (query.data?.metrics || []).map((metric) => ({
    ...metric,
    definition: metric.definition || fallbackDefinitions[metric.key] || "Definition supplied by the authoritative metrics service.",
  })), [query.data]);

  if (query.isLoading) return <div className="space-y-4" aria-label="Loading Pandit Network Activity"><Skeleton className="h-12 w-72" /><Skeleton className="h-28 w-full" /><div className="grid gap-3 md:grid-cols-2"><Skeleton className="h-36" /><Skeleton className="h-36" /></div></div>;
  if (query.isError) return <Card><CardContent className="flex flex-col items-center gap-3 py-12 text-center"><AlertTriangle className="h-8 w-8 text-destructive" /><h2 className="font-medium">Network activity is unavailable</h2><p className="max-w-md text-sm text-muted-foreground">The metrics service did not return data. No replacement or marketing estimate is shown.</p><Button variant="outline" onClick={() => query.refetch()}><RefreshCw className="mr-2 h-4 w-4" />Try again</Button></CardContent></Card>;
  if (!metrics.length) return <Card><CardContent className="py-12 text-center"><Activity className="mx-auto mb-3 h-8 w-8 text-muted-foreground" /><h2 className="font-medium">No activity metrics returned</h2><p className="mt-1 text-sm text-muted-foreground">The authoritative metrics endpoint returned an empty result.</p><Button variant="outline" className="mt-4" onClick={() => query.refetch()}>Refresh</Button></CardContent></Card>;

  return <div className="space-y-6" data-testid="pandit-network-activity">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-secondary-foreground/70">Governance / live data</p><h1 className="mt-1 text-3xl text-primary">Pandit Network Activity</h1><p className="mt-1 max-w-2xl text-sm text-muted-foreground">Aggregate counts from bookings, Pandit records, publication, presence, and eligibility sources.</p></div>
      <Button variant="outline" onClick={() => query.refetch()} disabled={query.isFetching} aria-label="Refresh network activity"><RefreshCw className={`mr-2 h-4 w-4 ${query.isFetching ? "animate-spin" : ""}`} />Refresh</Button>
    </div>
    <Card className="border-primary/15 bg-primary/[0.03]"><CardContent className="flex flex-wrap items-center gap-x-6 gap-y-2 p-4 text-sm"><span className="flex items-center gap-2 font-medium"><ShieldCheck className="h-4 w-4 text-emerald-700" />Shared server definitions</span><span className="text-muted-foreground">Last update: {query.data?.updatedAt ? new Date(query.data.updatedAt).toLocaleString() : "Not available"}</span><span className="text-muted-foreground">Refresh window: {query.data?.cacheTtlSeconds ? `${query.data.cacheTtlSeconds}s cache` : "bounded cache"}</span></CardContent></Card>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{metrics.map((metric) => <Card key={metric.key} className="overflow-hidden"><CardHeader className="pb-2"><CardTitle className="flex items-center justify-between text-sm font-medium">{metric.label}<span className={`rounded-full px-2 py-1 text-[11px] ${metric.health === "healthy" ? "bg-emerald-100 text-emerald-800" : metric.health === "stale" ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"}`}>{healthLabel(metric.health)}</span></CardTitle></CardHeader><CardContent><div className="text-3xl font-semibold tabular-nums text-primary">{metric.value === null ? "—" : metric.value.toLocaleString()}</div>{metric.scope === "this_instance" && <p className="mt-1 text-[11px] font-medium text-amber-800">This server instance only</p>}<p className="mt-3 text-xs leading-5 text-muted-foreground">{metric.definition}</p><div className="mt-4 flex items-center gap-1.5 border-t pt-3 text-[11px] text-muted-foreground"><Clock3 className="h-3.5 w-3.5" />Updated {metric.updatedAt ? new Date(metric.updatedAt).toLocaleString() : "not available"}</div>{metric.health !== "healthy" && <p role="status" className="mt-2 text-xs font-medium text-amber-800">{metric.health === "stale" ? "This value needs a fresh source update." : "No synthetic replacement is displayed."}</p>}</CardContent></Card>)}</div>
    <p className="flex items-start gap-2 text-xs text-muted-foreground"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />Zero is a valid value. These payloads are aggregate-only and do not expose devotee or Pandit private data.</p>
  </div>;
}
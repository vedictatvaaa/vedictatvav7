import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import {
  Sparkles, RefreshCw, Send, Search, AlertTriangle, CheckCircle2, XCircle, ExternalLink, Wand2,
} from "lucide-react";

type Severity = "ok" | "warn" | "fail";
interface SeoCheck { id: string; label: string; severity: Severity; detail?: string; weight: number }
interface PageAudit {
  path: string; category: string; score: number; grade: string;
  checks: SeoCheck[]; recommendations: string[]; hasSeoRecord: boolean; indexable: boolean;
}
interface SiteAudit {
  generatedAt: string; overallScore: number; overallGrade: string;
  totals: Record<string, number>; byCategory: Record<string, { count: number; avgScore: number }>;
  topIssues: { issue: string; count: number }[]; pages: PageAudit[];
}
interface SeoReport {
  audit: SiteAudit;
  endpoints: Record<string, string>;
  capabilities: { aiGenerator: boolean; indexNow: boolean; sitemapPing: boolean; merchantFeed: boolean };
}

const gradeColor = (g: string) => {
  if (g === "A+" || g === "A") return "text-green-600 dark:text-green-400";
  if (g === "B") return "text-emerald-600 dark:text-emerald-400";
  if (g === "C") return "text-amber-600 dark:text-amber-400";
  if (g === "D") return "text-orange-600 dark:text-orange-400";
  return "text-red-600 dark:text-red-400";
};

const sevIcon = (s: Severity) =>
  s === "ok" ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> :
  s === "warn" ? <AlertTriangle className="h-3.5 w-3.5 text-amber-500" /> :
  <XCircle className="h-3.5 w-3.5 text-red-500" />;

export function SeoOverviewTab({ adminFetch }: { adminFetch: (url: string, init?: RequestInit) => Promise<any> }) {
  const { toast } = useToast();
  const [filter, setFilter] = useState("");
  const [overwrite, setOverwrite] = useState(false);
  const [includeProducts, setIncludeProducts] = useState(true);
  const [genLimit, setGenLimit] = useState(25);
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data: report, isLoading, refetch, isRefetching } = useQuery<SeoReport>({
    queryKey: ["/api/admin/seo/report"],
    queryFn: () => adminFetch("/api/admin/seo/report"),
  });

  const generate = useMutation({
    mutationFn: async () => adminFetch("/api/admin/seo/auto-generate", {
      method: "POST",
      body: JSON.stringify({ limit: genLimit, includeProducts, overwrite }),
    }),
    onSuccess: (d: any) => {
      toast({ title: "AI SEO generation complete", description: `${d.upserted} pages updated · ${d.failed} failed` });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/seo/report"] });
    },
    onError: (e: any) => toast({ title: "Generation failed", description: e?.message, variant: "destructive" }),
  });

  const generateOne = useMutation({
    mutationFn: async (path: string) => adminFetch("/api/admin/seo/generate-one", {
      method: "POST",
      body: JSON.stringify({ path }),
    }),
    onSuccess: () => {
      toast({ title: "Page meta generated" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/seo/report"] });
    },
    onError: (e: any) => toast({ title: "Generation failed", description: e?.message, variant: "destructive" }),
  });

  const ping = useMutation({
    mutationFn: async () => adminFetch("/api/admin/seo/ping", { method: "POST", body: JSON.stringify({}) }),
    onSuccess: (d: any) => {
      toast({
        title: "Search engines notified",
        description: `IndexNow: ${d.indexNow?.ok ? "OK" : "fail"} · Sitemap pinged Google ${d.sitemap?.google ? "✓" : "—"} / Bing ${d.sitemap?.bing ? "✓" : "—"}`,
      });
    },
    onError: (e: any) => toast({ title: "Ping failed", description: e?.message, variant: "destructive" }),
  });

  const audit = report?.audit;
  const filtered = (audit?.pages || []).filter((p) => !filter ? true : p.path.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end gap-2 flex-wrap">
        <Button variant="outline" onClick={() => refetch()} disabled={isRefetching} data-testid="button-seo-refresh">
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? "animate-spin" : ""}`} /> Re-audit
        </Button>
        <Button onClick={() => ping.mutate()} disabled={ping.isPending} data-testid="button-seo-ping">
          <Send className="h-4 w-4 mr-2" /> {ping.isPending ? "Pinging…" : "Notify Google & Bing"}
        </Button>
      </div>

      {isLoading ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Auditing site…</CardContent></Card>
      ) : audit ? (
        <Card>
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-[280px,1fr] gap-6 items-center">
              <div className="text-center">
                <div className={`text-7xl font-bold ${gradeColor(audit.overallGrade)}`} data-testid="text-overall-grade">{audit.overallGrade}</div>
                <div className="text-3xl font-semibold mt-1" data-testid="text-overall-score">{audit.overallScore}<span className="text-base text-muted-foreground">/100</span></div>
                <Progress value={audit.overallScore} className="mt-3" />
                <div className="text-xs text-muted-foreground mt-2">Across {audit.totals.indexable} indexable pages</div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <Stat label="Total pages" value={audit.totals.pages} />
                <Stat label="With meta" value={audit.totals.withMeta} />
                <Stat label="Missing title" value={audit.totals.missingTitle} warn />
                <Stat label="Missing desc" value={audit.totals.missingDescription} warn />
                <Stat label="Missing OG image" value={audit.totals.missingOgImage} warn />
                <Stat label="Missing schema" value={audit.totals.missingSchema} warn />
              </div>
            </div>
            <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-3">
              {Object.entries(audit.byCategory).map(([cat, v]) => (
                <div key={cat} className="rounded-md border bg-card p-3">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">{cat}</div>
                  <div className={`text-2xl font-semibold mt-1 ${gradeColor(
                    v.avgScore >= 85 ? "A" : v.avgScore >= 70 ? "B" : v.avgScore >= 55 ? "C" : v.avgScore >= 40 ? "D" : "F",
                  )}`}>{v.avgScore}</div>
                  <div className="text-[11px] text-muted-foreground">{v.count} page{v.count !== 1 ? "s" : ""}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {audit && audit.topIssues.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" /> Top issues across the site
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ul className="space-y-1.5 text-sm">
              {audit.topIssues.map((it, i) => (
                <li key={i} className="flex items-start justify-between gap-3 py-1 border-b last:border-0">
                  <span className="text-muted-foreground">{it.issue}</span>
                  <Badge variant="secondary" className="shrink-0">{it.count} pages</Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Wand2 className="h-4 w-4 text-[#6D2B35]" /> AI auto-generate missing meta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!report?.capabilities.aiGenerator && (
            <div className="text-sm rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 p-3">
              OpenAI key not configured — AI generation is unavailable. Set <code>OPENAI_API_KEY</code>.
            </div>
          )}
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <Label htmlFor="gen-limit" className="text-xs">Batch size</Label>
              <Input id="gen-limit" type="number" min={1} max={100} value={genLimit}
                onChange={(e) => setGenLimit(Math.max(1, Math.min(100, parseInt(e.target.value || "1"))))}
                data-testid="input-gen-limit"
              />
            </div>
            <div className="flex items-center gap-3 mt-5">
              <Switch checked={includeProducts} onCheckedChange={setIncludeProducts} id="inc-prod" data-testid="switch-include-products" />
              <Label htmlFor="inc-prod" className="text-sm cursor-pointer">Include products</Label>
            </div>
            <div className="flex items-center gap-3 mt-5">
              <Switch checked={overwrite} onCheckedChange={setOverwrite} id="overwrite" data-testid="switch-overwrite" />
              <Label htmlFor="overwrite" className="text-sm cursor-pointer">Overwrite existing</Label>
            </div>
          </div>
          <Button onClick={() => generate.mutate()} disabled={generate.isPending || !report?.capabilities.aiGenerator}
            className="bg-[#6D2B35] hover:bg-[#5a2129]" data-testid="button-bulk-generate">
            <Sparkles className="h-4 w-4 mr-2" />
            {generate.isPending ? "Generating…" : `Generate now (${genLimit} pages)`}
          </Button>
        </CardContent>
      </Card>

      {report?.endpoints && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">SEO endpoints</CardTitle></CardHeader>
          <CardContent className="pt-0">
            <ul className="text-sm space-y-1.5">
              {Object.entries(report.endpoints).map(([k, v]) => (
                <li key={k} className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground capitalize">{k.replace(/([A-Z])/g, " $1")}</span>
                  <a href={v} target="_blank" rel="noreferrer" className="text-[#6D2B35] dark:text-[#D4AF37] hover:underline flex items-center gap-1 text-xs truncate max-w-[60%]" data-testid={`link-endpoint-${k}`}>
                    {v} <ExternalLink className="h-3 w-3 shrink-0" />
                  </a>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <CardTitle className="text-base">Per-page scores</CardTitle>
            <div className="relative w-full sm:w-72">
              <Search className="h-4 w-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter by path…" className="pl-8" data-testid="input-page-filter" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <ScrollArea className="h-[480px] pr-2">
            <div className="space-y-1.5">
              {filtered.map((p) => (
                <div key={p.path} className="rounded-md border bg-card hover-elevate" data-testid={`row-page-${p.path}`}>
                  <button onClick={() => setExpanded(expanded === p.path ? null : p.path)} className="w-full text-left p-3 flex items-center gap-3">
                    <div className={`text-lg font-semibold w-12 text-center ${gradeColor(p.grade)}`}>{p.grade}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{p.path}</div>
                      <div className="text-[11px] text-muted-foreground flex items-center gap-2">
                        <span>{p.category}</span><span>·</span><span>{p.score}/100</span>
                        {!p.hasSeoRecord && <Badge variant="outline" className="h-4 text-[9px]">no meta</Badge>}
                        {!p.indexable && <Badge variant="destructive" className="h-4 text-[9px]">noindex</Badge>}
                      </div>
                    </div>
                    <Progress value={p.score} className="w-24 hidden sm:block" />
                  </button>
                  {expanded === p.path && (
                    <div className="border-t p-3 space-y-2 bg-muted/30">
                      <div className="grid sm:grid-cols-2 gap-1.5">
                        {p.checks.map((c) => (
                          <div key={c.id} className="flex items-center gap-2 text-xs">
                            {sevIcon(c.severity)}
                            <span className="font-medium">{c.label}</span>
                            {c.detail && <span className="text-muted-foreground">— {c.detail}</span>}
                          </div>
                        ))}
                      </div>
                      {p.recommendations.length > 0 && (
                        <ul className="text-xs text-muted-foreground list-disc pl-4 mt-2 space-y-0.5">
                          {p.recommendations.map((r, i) => <li key={i}>{r}</li>)}
                        </ul>
                      )}
                      <div className="flex gap-2 pt-2">
                        <Button size="sm" variant="outline" onClick={() => generateOne.mutate(p.path)}
                          disabled={generateOne.isPending || !report?.capabilities.aiGenerator} data-testid={`button-gen-${p.path}`}>
                          <Sparkles className="h-3.5 w-3.5 mr-1.5" /> Generate with AI
                        </Button>
                        <Button size="sm" variant="ghost" asChild>
                          <a href={p.path} target="_blank" rel="noreferrer">View page <ExternalLink className="h-3.5 w-3.5 ml-1.5" /></a>
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {filtered.length === 0 && <div className="py-12 text-center text-sm text-muted-foreground">No pages match this filter.</div>}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value, warn }: { label: string; value: number; warn?: boolean }) {
  return (
    <div className="rounded-md border bg-card p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-xl font-semibold mt-0.5 ${warn && value > 0 ? "text-amber-600 dark:text-amber-400" : ""}`}>{value}</div>
    </div>
  );
}

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles, RefreshCw, Globe, CheckCircle2, AlertTriangle } from "lucide-react";

interface Props { adminFetch: (url: string, init?: RequestInit) => Promise<any>; }

export function SitelinksTab({ adminFetch }: Props) {
  const { toast } = useToast();
  const [running, setRunning] = useState(false);

  const statusQ = useQuery<any>({
    queryKey: ["/api/admin/seo/scheduler/status"],
    queryFn: () => adminFetch("/api/admin/seo/scheduler/status"),
    refetchInterval: 30_000,
  });

  const previewQ = useQuery<any>({
    queryKey: ["/api/admin/seo/sitelinks/preview"],
    queryFn: () => adminFetch("/api/admin/seo/sitelinks/preview"),
  });

  const runMut = useMutation({
    mutationFn: () => adminFetch("/api/admin/seo/scheduler/run", { method: "POST" }),
    onMutate: () => setRunning(true),
    onSettled: () => setRunning(false),
    onSuccess: () => {
      toast({ title: "Push started", description: "URLs submitted to IndexNow + sitemap pinged." });
      statusQ.refetch();
    },
    onError: (e: any) => toast({ title: "Push failed", description: e?.message || "", variant: "destructive" }),
  });

  const s = statusQ.data;
  const p = previewQ.data;

  return (
    <div className="space-y-4">
      <div className="rounded-md border bg-gradient-to-br from-amber-50/50 to-rose-50/30 dark:from-amber-950/20 dark:to-rose-950/10 p-4">
        <div className="flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-[#D4AF37] flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="font-semibold">Google Sitelinks Optimisation — 24/7 automation</h3>
            <p className="text-sm text-muted-foreground">
              Sitelinks (the multi-link result Google shows for "vedic tatva") are auto-generated. We can't force them, but we maximise eligibility by emitting <strong>WebSite + SearchAction</strong>, <strong>Organization</strong>, <strong>SiteNavigationElement</strong> and <strong>BreadcrumbList</strong> schema on every page, plus we re-ping IndexNow + your sitemap every 24h so Google&nbsp;/ Bing always have the freshest crawl signal.
            </p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2"><Globe className="h-4 w-4" /> Discovery scheduler</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!s ? <Loader2 className="h-4 w-4 animate-spin" /> : (
              <>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant={s.enabled ? "default" : "secondary"} data-testid="badge-scheduler-status">
                    {s.enabled ? <><CheckCircle2 className="h-3 w-3 mr-1" /> Active</> : <><AlertTriangle className="h-3 w-3 mr-1" /> Idle</>}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Interval</span>
                  <span className="font-medium">Every {s.intervalHours}h</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Last run</span>
                  <span className="font-medium" data-testid="text-last-run">{s.lastRunAt ? new Date(s.lastRunAt).toLocaleString() : "Never"}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">URLs submitted</span>
                  <span className="font-medium">{s.lastUrlsSubmitted}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total runs</span>
                  <span className="font-medium">{s.totalRuns}</span>
                </div>
                {s.lastError && (
                  <div className="text-xs rounded bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 p-2 text-amber-900 dark:text-amber-200">
                    {s.lastError}
                  </div>
                )}
                <Button onClick={() => runMut.mutate()} disabled={running} className="w-full" data-testid="button-run-now">
                  {running ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                  Push fresh signals now
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2"><Sparkles className="h-4 w-4" /> Active schema markup</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {!p ? <Loader2 className="h-4 w-4 animate-spin" /> : (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Public site URL</span>
                  <span className="font-mono text-xs truncate ml-2" data-testid="text-site-url">{p.siteUrl || "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Tracked URLs</span>
                  <span className="font-medium" data-testid="text-tracked-urls">{p.totalUrls}</span>
                </div>
                <div className="pt-2 space-y-1.5">
                  {(p.schemas || []).map((s: string) => (
                    <div key={s} className="flex items-center gap-2 text-sm" data-testid={`schema-${s.replace(/\s+/g, "-").toLowerCase()}`}>
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">URL sample being pushed</CardTitle></CardHeader>
        <CardContent>
          <div className="text-xs font-mono space-y-0.5 max-h-64 overflow-y-auto">
            {(p?.sample || []).map((u: string) => (
              <div key={u} className="text-muted-foreground truncate" data-testid={`url-${u}`}>{u}</div>
            ))}
            {!p?.sample?.length && <div className="text-muted-foreground">Loading…</div>}
          </div>
        </CardContent>
      </Card>

      <div className="rounded-md border bg-muted/40 p-4 text-sm space-y-2">
        <h4 className="font-semibold">Checklist for sitelinks eligibility</h4>
        <ul className="text-muted-foreground space-y-1 list-disc pl-5">
          <li>Set <code>PUBLIC_SITE_URL</code> in environment (e.g. <code>https://vedictatva.com</code>) — needed for canonical URLs and IndexNow.</li>
          <li>Submit <code>/sitemap.xml</code> in Google Search Console + Bing Webmaster Tools.</li>
          <li>Verify the brand on Google Knowledge Panel — claim <em>Google Business Profile</em> and link from Site Settings.</li>
          <li>Earn brand-name search volume (rank #1 for "vedic tatva") — the off-page tab tracks backlinks that drive this.</li>
          <li>Keep primary navigation stable — Google picks sitelinks from links it sees most often.</li>
        </ul>
      </div>
    </div>
  );
}

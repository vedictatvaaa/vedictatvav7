import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Target, Sparkles, Activity, ShieldAlert, RefreshCw, Plus, Trash2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Props {
  adminFetch: (url: string, init?: RequestInit) => Promise<any>;
}

interface KeywordTarget {
  id: number;
  keyword: string;
  targetPath: string;
  intent: string;
  priority: number;
  cluster: string;
  status: string;
  lastOptimizedAt: string | null;
  lastScore: number | null;
  notes: string | null;
}

interface EngineStatus {
  enabled: boolean;
  intervalHours: number;
  lastRunAt: string | null;
  nextRunAt: string | null;
  totalCycles: number;
  lastError: string | null;
  lastCycle: null | {
    duplicatesFound: number;
    pagesOptimized: number;
    urlsPinged: number;
    aiAvailable: boolean;
    durationMs: number;
    actions: { path: string; action: string; detail?: string }[];
  };
}

interface DuplicateGroup { field: string; value: string; paths: string[] }

const PRIORITY_BADGE = (p: number) =>
  p >= 9 ? "bg-[#6D2B35] text-white" : p >= 7 ? "bg-[#D4AF37] text-[#3a2a17]" : "bg-muted text-muted-foreground";

export function KeywordTargetsTab({ adminFetch }: Props) {
  const { toast } = useToast();
  const [targets, setTargets] = useState<KeywordTarget[]>([]);
  const [clusters, setClusters] = useState<{ cluster: string; count: number }[]>([]);
  const [engine, setEngine] = useState<EngineStatus | null>(null);
  const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(true);

  // New keyword form
  const [kw, setKw] = useState("");
  const [path, setPath] = useState("");
  const [cluster, setCluster] = useState("puja");
  const [priority, setPriority] = useState("8");

  const refreshAll = async () => {
    setLoading(true);
    try {
      const [t, e, d] = await Promise.all([
        adminFetch("/api/admin/seo/keyword-targets"),
        adminFetch("/api/admin/seo/engine/status"),
        adminFetch("/api/admin/seo/engine/duplicates"),
      ]);
      setTargets(t.items || []);
      setClusters(t.clusters || []);
      setEngine(e);
      setDuplicates(d.groups || []);
    } catch (e: any) {
      toast({ title: "Failed to load", description: e?.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refreshAll(); }, []);

  const runEngine = async () => {
    setRunning(true);
    try {
      const r = await adminFetch("/api/admin/seo/engine/run", { method: "POST" });
      toast({
        title: "Engine cycle complete",
        description: `${r.cycle.pagesOptimized} pages optimized · ${r.cycle.urlsPinged} URLs submitted to IndexNow${r.cycle.aiAvailable ? "" : " (set OPENAI_API_KEY for AI optimization)"}`,
      });
      await refreshAll();
    } catch (e: any) {
      toast({ title: "Engine run failed", description: e?.message, variant: "destructive" });
    } finally {
      setRunning(false);
    }
  };

  const reseed = async () => {
    try {
      const r = await adminFetch("/api/admin/seo/keyword-targets/seed-puja", { method: "POST" });
      toast({ title: "Puja keywords reseeded", description: `${r.total} targets in inventory` });
      await refreshAll();
    } catch (e: any) {
      toast({ title: "Seed failed", description: e?.message, variant: "destructive" });
    }
  };

  const addTarget = async () => {
    if (!kw.trim() || !path.trim()) return;
    try {
      await adminFetch("/api/admin/seo/keyword-targets", {
        method: "POST",
        body: JSON.stringify({ keyword: kw.trim(), targetPath: path.trim(), cluster, priority: Number(priority) }),
      });
      setKw(""); setPath("");
      toast({ title: "Target added" });
      await refreshAll();
    } catch (e: any) {
      toast({ title: "Add failed", description: e?.message, variant: "destructive" });
    }
  };

  const removeTarget = async (id: number) => {
    try {
      await adminFetch(`/api/admin/seo/keyword-targets/${id}`, { method: "DELETE" });
      await refreshAll();
    } catch (e: any) {
      toast({ title: "Delete failed", description: e?.message, variant: "destructive" });
    }
  };

  const filteredTargets = filter === "all" ? targets : targets.filter((t) => t.cluster === filter);

  return (
    <div className="space-y-4">
      {/* Engine status */}
      <div className="grid gap-3 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1.5"><Activity className="h-4 w-4 text-[#6D2B35]" /> Engine</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold" data-testid="text-engine-status">{engine?.enabled ? "Active" : "Idle"}</div>
            <div className="text-xs text-muted-foreground">Every {engine?.intervalHours || 6}h · {engine?.totalCycles || 0} cycles run</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1.5"><Target className="h-4 w-4 text-[#6D2B35]" /> Keyword Inventory</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold" data-testid="text-keyword-count">{targets.length}</div>
            <div className="text-xs text-muted-foreground">{clusters.length} clusters · puja-priority first</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1.5"><Sparkles className="h-4 w-4 text-[#D4AF37]" /> Last Cycle</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold" data-testid="text-last-optimized">{engine?.lastCycle?.pagesOptimized ?? 0}</div>
            <div className="text-xs text-muted-foreground">pages optimized · {engine?.lastCycle?.urlsPinged ?? 0} URLs pinged</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1.5"><ShieldAlert className="h-4 w-4 text-amber-600" /> Duplicate Meta</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold" data-testid="text-duplicate-count">{duplicates.length}</div>
            <div className="text-xs text-muted-foreground">groups detected (lower is better)</div>
          </CardContent>
        </Card>
      </div>

      {/* Engine controls */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><Activity className="h-4 w-4 text-[#6D2B35]" /> 24/7 Active SEO Engine</CardTitle>
          <CardDescription>
            Continuously heals on-page SEO: detects duplicate titles/descriptions, AI-optimizes the highest-priority puja-targeted pages first, then submits only changed URLs to IndexNow. Spam-safe: capped at 5 AI rewrites and 25 URL submissions per cycle.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button onClick={runEngine} disabled={running} data-testid="button-run-engine">
              <Sparkles className="h-4 w-4" /> {running ? "Running…" : "Run Cycle Now"}
            </Button>
            <Button variant="outline" onClick={refreshAll} disabled={loading} data-testid="button-refresh-engine">
              <RefreshCw className="h-4 w-4" /> Refresh
            </Button>
            <Button variant="outline" onClick={reseed} data-testid="button-reseed-keywords">
              <Target className="h-4 w-4" /> Reseed Puja Keywords
            </Button>
            {engine?.lastCycle && !engine.lastCycle.aiAvailable && (
              <Badge variant="outline" className="border-amber-500 text-amber-700">
                <AlertTriangle className="h-3 w-3" /> OPENAI_API_KEY missing — engine runs in dedup-only mode
              </Badge>
            )}
            {engine?.lastCycle?.aiAvailable && (
              <Badge variant="outline" className="border-emerald-500 text-emerald-700">
                <CheckCircle2 className="h-3 w-3" /> AI engine online
              </Badge>
            )}
          </div>
          {engine?.lastCycle && engine.lastCycle.actions.length > 0 && (
            <div className="rounded-md border bg-muted/30 p-2 text-xs space-y-1 max-h-40 overflow-y-auto">
              <div className="font-medium mb-1">Last cycle actions ({engine.lastCycle.durationMs}ms)</div>
              {engine.lastCycle.actions.map((a, i) => (
                <div key={i} className="flex justify-between gap-2 font-mono">
                  <span className="truncate">{a.path}</span>
                  <span className="shrink-0 text-muted-foreground">{a.action} · {a.detail || ""}</span>
                </div>
              ))}
            </div>
          )}
          {engine?.lastError && (
            <div className="text-xs text-destructive">Last error: {engine.lastError}</div>
          )}
        </CardContent>
      </Card>

      {/* Duplicate meta */}
      {duplicates.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><ShieldAlert className="h-4 w-4 text-amber-600" /> Duplicate Meta Detected</CardTitle>
            <CardDescription>Pages sharing the same title or description compete with each other in SERP and are flagged by Google. The engine auto-rewrites these on its next cycle.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {duplicates.slice(0, 8).map((g, i) => (
              <div key={i} className="rounded-md border p-2 text-xs">
                <div className="flex gap-2 items-center"><Badge variant="outline">{g.field}</Badge><span className="truncate font-medium">"{g.value}"</span></div>
                <div className="mt-1 text-muted-foreground font-mono">{g.paths.join(" · ")}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Add new keyword */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Add Keyword Target</CardTitle>
          <CardDescription>Tie a keyword to the page you want to win the SERP for. The engine will prioritize higher-priority targets first.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Input placeholder="keyword (e.g. rudrabhishek puja online)" value={kw} onChange={(e) => setKw(e.target.value)} className="flex-1 min-w-[220px]" data-testid="input-keyword" />
            <Input placeholder="/target-path" value={path} onChange={(e) => setPath(e.target.value)} className="flex-1 min-w-[180px]" data-testid="input-target-path" />
            <Select value={cluster} onValueChange={setCluster}>
              <SelectTrigger className="w-[140px]" data-testid="select-cluster"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="puja">puja</SelectItem>
                <SelectItem value="samagri">samagri</SelectItem>
                <SelectItem value="rudraksha">rudraksha</SelectItem>
                <SelectItem value="idols">idols</SelectItem>
                <SelectItem value="astrology">astrology</SelectItem>
                <SelectItem value="calendar">calendar</SelectItem>
                <SelectItem value="brand">brand</SelectItem>
                <SelectItem value="general">general</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger className="w-[110px]" data-testid="select-priority"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[10,9,8,7,6,5,4,3,2,1].map((n) => <SelectItem key={n} value={String(n)}>P{n}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button onClick={addTarget} data-testid="button-add-target"><Plus className="h-4 w-4" /> Add</Button>
          </div>
        </CardContent>
      </Card>

      {/* Inventory */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base">Keyword Inventory</CardTitle>
              <CardDescription>Sorted by priority — higher numbers are optimized first by the engine.</CardDescription>
            </div>
            <div className="flex flex-wrap gap-1">
              <Badge variant={filter === "all" ? "default" : "outline"} onClick={() => setFilter("all")} className="cursor-pointer">all ({targets.length})</Badge>
              {clusters.map((c) => (
                <Badge key={c.cluster} variant={filter === c.cluster ? "default" : "outline"} onClick={() => setFilter(c.cluster)} className="cursor-pointer">
                  {c.cluster} ({c.count})
                </Badge>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Priority</TableHead>
                  <TableHead>Keyword</TableHead>
                  <TableHead>Target Page</TableHead>
                  <TableHead>Cluster</TableHead>
                  <TableHead>Last Optimized</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTargets.map((t) => (
                  <TableRow key={t.id} data-testid={`row-keyword-${t.id}`}>
                    <TableCell><Badge className={PRIORITY_BADGE(t.priority)}>P{t.priority}</Badge></TableCell>
                    <TableCell className="font-medium">{t.keyword}</TableCell>
                    <TableCell className="font-mono text-xs">{t.targetPath}</TableCell>
                    <TableCell><Badge variant="outline">{t.cluster}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {t.lastOptimizedAt ? new Date(t.lastOptimizedAt).toLocaleString() : "—"}
                    </TableCell>
                    <TableCell>
                      <Button size="icon" variant="ghost" onClick={() => removeTarget(t.id)} data-testid={`button-delete-keyword-${t.id}`}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredTargets.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-6">No keywords in this cluster yet.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

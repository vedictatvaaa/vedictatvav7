import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Search, Trash2, TrendingUp, AlertCircle } from "lucide-react";

interface QueriesData {
  total: number; totalSearches: number; zeroResultCount: number;
  zeroResults: { query: string; hits: number; lastSeenAt: string }[];
  top: { id: number; query: string; hits: number; resultCount: number; lastSeenAt: string }[];
}

export function AutocompleteTab({ adminFetch }: { adminFetch: (url: string, init?: RequestInit) => Promise<any> }) {
  const { toast } = useToast();
  const [test, setTest] = useState("");
  const [testResults, setTestResults] = useState<any>(null);

  const { data, isLoading, refetch } = useQuery<QueriesData>({
    queryKey: ["/api/admin/search/queries"],
    queryFn: () => adminFetch("/api/admin/search/queries?limit=200"),
  });

  const del = useMutation({
    mutationFn: (id: number) => adminFetch(`/api/admin/search/queries/${id}`, { method: "DELETE" }),
    onSuccess: () => { toast({ title: "Query deleted" }); refetch(); },
  });

  const tryQuery = async () => {
    try {
      const r = await fetch(`/api/search/suggest?q=${encodeURIComponent(test)}`);
      setTestResults(await r.json());
    } catch {
      toast({ title: "Failed to test", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Tracked queries" value={data?.total || 0} />
        <Stat label="Total searches" value={data?.totalSearches || 0} />
        <Stat label="Zero-result" value={data?.zeroResultCount || 0} warn />
        <Stat label="Sitelinks searchbox" value="ON" good />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Test autocomplete</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">Browse what users see in the search dropdown — wired to Google's sitelinks searchbox via WebSite SearchAction schema.</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="h-4 w-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={test} onChange={(e) => setTest(e.target.value)} placeholder="Try 'rudraksha' or 'pandit'…" className="pl-8" data-testid="input-test-suggest" />
            </div>
            <Button onClick={tryQuery} data-testid="button-try-suggest">Try</Button>
          </div>
          {testResults && (
            <div className="rounded-md border p-3 text-sm space-y-2 bg-muted/30">
              <div>
                <span className="text-xs uppercase text-muted-foreground">Service / category suggestions</span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {testResults.suggestions?.map((s: any, i: number) => (
                    <Badge key={i} variant="secondary">{s.label}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-xs uppercase text-muted-foreground">Product suggestions ({testResults.products?.length || 0})</span>
                <ul className="mt-1 space-y-0.5 text-xs">
                  {testResults.products?.slice(0, 5).map((p: any) => (
                    <li key={p.id} className="font-mono">— {p.name} (₹{p.price})</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Top searches</CardTitle></CardHeader>
        <CardContent className="pt-0">
          {isLoading ? <div className="py-12 text-center text-muted-foreground">Loading…</div> :
           data?.top.length ? (
            <ScrollArea className="h-[300px] pr-2">
              <div className="space-y-1">
                {data.top.map((q) => (
                  <div key={q.id} className="flex items-center justify-between gap-2 px-3 py-2 rounded-md border bg-card text-sm" data-testid={`row-query-${q.id}`}>
                    <span className="flex-1 truncate">{q.query}</span>
                    <Badge variant="outline">{q.hits} searches</Badge>
                    <Badge variant={q.resultCount > 0 ? "secondary" : "destructive"}>{q.resultCount} results</Badge>
                    <Button size="icon" variant="ghost" onClick={() => del.mutate(q.id)} data-testid={`button-del-query-${q.id}`}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : <div className="py-12 text-center text-sm text-muted-foreground">No tracked searches yet.</div>}
        </CardContent>
      </Card>

      {data && data.zeroResults.length > 0 && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><AlertCircle className="h-4 w-4 text-amber-500" /> Zero-result searches (content gap)</CardTitle></CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs text-muted-foreground mb-2">These users searched and found nothing. Add matching products or content to capture this demand.</p>
            <div className="grid sm:grid-cols-2 gap-1.5">
              {data.zeroResults.map((q, i) => (
                <div key={i} className="flex items-center justify-between text-xs px-3 py-1.5 rounded-md border bg-amber-50 dark:bg-amber-950/30">
                  <span className="font-mono truncate">{q.query}</span>
                  <Badge variant="outline">{q.hits}×</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Stat({ label, value, good, warn }: { label: string; value: number | string; good?: boolean; warn?: boolean }) {
  return (
    <div className="rounded-md border bg-card p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-xl font-semibold mt-0.5 ${good ? "text-green-600 dark:text-green-400" : warn ? "text-amber-600 dark:text-amber-400" : ""}`}>{value}</div>
    </div>
  );
}

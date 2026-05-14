import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle2, AlertTriangle, XCircle, Search, ShoppingBag } from "lucide-react";

interface Diagnostic {
  id: number; name: string; slug: string | null; score: number;
  errors: string[]; warnings: string[]; ready: boolean;
}
interface MerchantHealth {
  total: number; ready: number; blocked: number; avgScore: number;
  topErrors: { issue: string; count: number }[];
  topWarnings: { issue: string; count: number }[];
  items: Diagnostic[];
  feedConfigured: boolean;
}

export function MerchantHealthTab({ adminFetch }: { adminFetch: (url: string, init?: RequestInit) => Promise<any> }) {
  const [filter, setFilter] = useState("");

  const { data, isLoading } = useQuery<MerchantHealth>({
    queryKey: ["/api/admin/merchant/health"],
    queryFn: () => adminFetch("/api/admin/merchant/health"),
  });

  const items = (data?.items || []).filter((p) =>
    !filter ? true : p.name.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Avg score" value={`${data?.avgScore || 0}/100`} />
        <Stat label="Total products" value={data?.total || 0} />
        <Stat label="Feed-ready" value={data?.ready || 0} good />
        <Stat label="Blocked" value={data?.blocked || 0} warn />
      </div>

      {!data?.feedConfigured && (
        <div className="text-sm rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 p-3">
          Google Content API not configured. Set <code>GOOGLE_MERCHANT_ID</code> and <code>GOOGLE_SERVICE_ACCOUNT_JSON</code> to push live, or use the existing scheduled feed at <code>/feed/google-shopping.xml</code>.
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><XCircle className="h-4 w-4 text-red-500" /> Top blocking errors</CardTitle></CardHeader>
          <CardContent className="pt-0 space-y-1">
            {data?.topErrors.length === 0 && <div className="text-xs text-muted-foreground">None — all products meet minimum requirements.</div>}
            {data?.topErrors.map((e, i) => (
              <div key={i} className="flex items-center justify-between text-xs py-1 border-b last:border-0">
                <span className="text-muted-foreground">{e.issue}</span>
                <Badge variant="destructive" className="shrink-0">{e.count}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-500" /> Top warnings</CardTitle></CardHeader>
          <CardContent className="pt-0 space-y-1">
            {data?.topWarnings.length === 0 && <div className="text-xs text-muted-foreground">No warnings.</div>}
            {data?.topWarnings.map((w, i) => (
              <div key={i} className="flex items-center justify-between text-xs py-1 border-b last:border-0">
                <span className="text-muted-foreground">{w.issue}</span>
                <Badge variant="secondary" className="shrink-0">{w.count}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <CardTitle className="text-base flex items-center gap-2"><ShoppingBag className="h-4 w-4" /> Per-product feed health</CardTitle>
            <div className="relative w-full sm:w-72">
              <Search className="h-4 w-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter products…" className="pl-8" data-testid="input-merchant-filter" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {isLoading ? <div className="py-12 text-center text-muted-foreground">Diagnosing…</div> : (
            <ScrollArea className="h-[500px] pr-2">
              <div className="space-y-1.5">
                {items.map((p) => (
                  <div key={p.id} className="rounded-md border bg-card p-3" data-testid={`row-merchant-${p.id}`}>
                    <div className="flex items-center gap-3">
                      <div className={`text-lg font-semibold w-12 text-center ${p.score >= 90 ? "text-green-600" : p.score >= 70 ? "text-amber-500" : "text-red-500"}`}>{p.score}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{p.name}</div>
                        <div className="text-[11px] text-muted-foreground flex gap-2 items-center">
                          {p.ready ? <Badge variant="default" className="h-4 text-[9px] gap-1"><CheckCircle2 className="h-2.5 w-2.5" />Ready</Badge>
                                   : <Badge variant="destructive" className="h-4 text-[9px]">Blocked</Badge>}
                          <span>{p.errors.length} errors · {p.warnings.length} warnings</span>
                        </div>
                      </div>
                    </div>
                    {(p.errors.length > 0 || p.warnings.length > 0) && (
                      <div className="mt-2 grid sm:grid-cols-2 gap-1 text-xs">
                        {p.errors.map((e, i) => (
                          <div key={`e-${i}`} className="flex items-center gap-1.5"><XCircle className="h-3 w-3 text-red-500 shrink-0" /><span>{e}</span></div>
                        ))}
                        {p.warnings.map((w, i) => (
                          <div key={`w-${i}`} className="flex items-center gap-1.5"><AlertTriangle className="h-3 w-3 text-amber-500 shrink-0" /><span className="text-muted-foreground">{w}</span></div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
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

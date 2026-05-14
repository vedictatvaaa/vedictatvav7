import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { panditApi } from "@/lib/panditAuth";
import { PanditReferralsPanel } from "@/components/pandit/PanditStorefrontPanel";
import { Wallet, TrendingUp, ArrowDownToLine, Receipt, Sparkles, Download, RefreshCw, Loader2 } from "lucide-react";

type Summary = {
  commissionPct: number;
  summary: {
    grossBookings: number; commission: number; netBookings: number;
    tipsTotal: number; netEarned: number; paidOut: number; pending: number;
    completedCount: number; tipsCount: number; payoutsCount: number;
    referralPayable?: number; referralConfirmed?: number; referralPaid?: number;
    referralAccruing?: number; referralCount?: number;
  };
  monthly: Array<{ month: string; gross: number; commission: number; tips: number; net: number }>;
  recentPayouts: Array<{ id: number; amountInr: number; paidAt: string; method: string; reference: string | null; notes: string | null }>;
};

type Tx = {
  kind: "booking" | "tip" | "referral" | "payout";
  id: number; date: string; refId: number; description: string;
  gross: number; commission: number; net: number;
};

const inr = (n: number) => `₹${(n || 0).toLocaleString("en-IN")}`;

function monthLabel(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString(undefined, { month: "short", year: "2-digit" });
}

export default function PanditEarnings() {
  const { toast } = useToast();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"overview" | "transactions" | "payouts" | "affiliate">("overview");

  async function load() {
    setLoading(true);
    try {
      const [s, t] = await Promise.all([
        panditApi("GET", "/api/pandit/earnings") as Promise<Summary>,
        panditApi("GET", "/api/pandit/earnings/transactions") as Promise<{ transactions: Tx[] }>,
      ]);
      setSummary(s);
      setTxs(t.transactions || []);
    } catch (e: any) {
      toast({ title: "Failed to load earnings", description: e?.message || "Please retry", variant: "destructive" });
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const monthlyMax = useMemo(() => Math.max(1, ...((summary?.monthly || []).map((m) => m.net))), [summary]);

  function exportCsv() {
    if (!txs.length) { toast({ title: "Nothing to export yet" }); return; }
    const header = ["Date", "Type", "Reference", "Description", "Gross (INR)", "Commission (INR)", "Net (INR)"];
    const lines = [header.join(",")];
    for (const tx of txs) {
      const row = [
        new Date(tx.date).toISOString().slice(0, 10),
        tx.kind,
        String(tx.refId),
        `"${(tx.description || "").replace(/"/g, '""')}"`,
        tx.gross, tx.commission, tx.net,
      ];
      lines.push(row.join(","));
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `vedictatva-earnings-${Date.now()}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  if (loading || !summary) {
    return <Card><CardContent className="p-10 flex items-center justify-center text-sm text-[#5a4a3a]/70"><Loader2 className="h-4 w-4 animate-spin mr-2" />Loading earnings…</CardContent></Card>;
  }

  const s = summary.summary;
  const kpis = [
    { l: "Pending payout", v: inr(s.pending), i: ArrowDownToLine, c: "text-[#6D2B35]", emph: true, sub: `${s.payoutsCount} payouts received` },
    { l: "Net earned", v: inr(s.netEarned), i: TrendingUp, c: "text-emerald-700", sub: `${s.completedCount} pujas + ${s.tipsCount} tips` },
    { l: "Gross from pujas", v: inr(s.grossBookings), i: Wallet, c: "text-sky-700", sub: `Before ${summary.commissionPct}% platform fee` },
    { l: "Platform fee", v: inr(s.commission), i: Receipt, c: "text-amber-700", sub: `${summary.commissionPct}% of puja gross` },
    { l: "Tips received", v: inr(s.tipsTotal), i: Sparkles, c: "text-[#D4AF37]", sub: `100% paid to you` },
  ];

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {kpis.map((k, i) => {
          const I = k.i;
          return (
            <Card key={i} className={k.emph ? "border-[#D4AF37]/40 bg-[#FFFAEC]" : ""} data-testid={`earn-kpi-${i}`}>
              <CardContent className="p-3">
                <div className="flex items-center gap-2 text-[10px] text-[#5a4a3a]/65 uppercase tracking-wide font-bold"><I className={`h-3.5 w-3.5 ${k.c}`} />{k.l}</div>
                <div className="text-xl font-bold text-[#4a1a22] mt-1">{k.v}</div>
                <div className="text-[10px] text-[#5a4a3a]/60 mt-0.5">{k.sub}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" size="sm" onClick={load} data-testid="btn-earnings-refresh"><RefreshCw className="h-3.5 w-3.5 mr-1" />Refresh</Button>
        <Button variant="outline" size="sm" onClick={exportCsv} data-testid="btn-earnings-export"><Download className="h-3.5 w-3.5 mr-1" />Export CSV</Button>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList className="grid grid-cols-4 w-full max-w-xl">
          <TabsTrigger value="overview" data-testid="tab-earn-overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions" data-testid="tab-earn-tx">Transactions</TabsTrigger>
          <TabsTrigger value="payouts" data-testid="tab-earn-payouts">Payouts</TabsTrigger>
          <TabsTrigger value="affiliate" data-testid="tab-earn-affiliate">Product Referrals</TabsTrigger>
        </TabsList>

        <TabsContent value="affiliate" className="mt-4">
          <PanditReferralsPanel />
        </TabsContent>

        <TabsContent value="overview" className="mt-4 space-y-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-serif font-bold text-[#4a1a22]">Last 12 months — net earnings</h3>
                <span className="text-[10px] text-[#5a4a3a]/60">Hover bars for detail</span>
              </div>
              <div className="grid grid-cols-12 gap-2 items-end h-32">
                {summary.monthly.map((m) => {
                  const h = Math.max(2, Math.round((m.net / monthlyMax) * 100));
                  return (
                    <div key={m.month} className="flex flex-col items-center gap-1" title={`${monthLabel(m.month)}: ${inr(m.net)} net (gross ${inr(m.gross)}, tips ${inr(m.tips)})`}>
                      <div className="w-full bg-[#6D2B35]/85 hover:bg-[#6D2B35] rounded-t-sm transition-colors" style={{ height: `${h}%` }} data-testid={`earn-bar-${m.month}`} />
                      <div className="text-[9px] text-[#5a4a3a]/65 font-mono">{monthLabel(m.month).slice(0, 3)}</div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 text-sm text-[#4a1a22]/85 space-y-1.5">
              <div className="flex justify-between"><span>Gross from completed pujas</span><span className="font-mono">{inr(s.grossBookings)}</span></div>
              <div className="flex justify-between text-[#5a4a3a]/75"><span>− Platform fee ({summary.commissionPct}%)</span><span className="font-mono">−{inr(s.commission)}</span></div>
              <div className="flex justify-between"><span>Net from pujas</span><span className="font-mono">{inr(s.netBookings)}</span></div>
              <div className="flex justify-between"><span>+ Tips (100% to you)</span><span className="font-mono">+{inr(s.tipsTotal)}</span></div>
              <div className="flex justify-between"><span>+ Product referrals (confirmed)</span><span className="font-mono">+{inr(s.referralConfirmed || 0)}</span></div>
              <div className="flex justify-between"><span>+ Product referrals (already settled)</span><span className="font-mono">+{inr(s.referralPaid || 0)}</span></div>
              {(s.referralAccruing || 0) > 0 && (
                <div className="flex justify-between text-[#5a4a3a]/65 text-[11px]"><span>(Accruing — awaiting admin confirm)</span><span className="font-mono">{inr(s.referralAccruing || 0)}</span></div>
              )}
              <div className="flex justify-between border-t border-[#D4AF37]/30 pt-1.5 mt-1.5 font-bold"><span>Total earned</span><span className="font-mono">{inr(s.netEarned)}</span></div>
              <div className="flex justify-between text-[#5a4a3a]/75"><span>− Already paid out</span><span className="font-mono">−{inr(s.paidOut)}</span></div>
              <div className="flex justify-between border-t border-[#D4AF37]/30 pt-1.5 mt-1.5 font-bold text-[#6D2B35]"><span>Pending payout</span><span className="font-mono">{inr(s.pending)}</span></div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {txs.length === 0 ? (
                <div className="p-10 text-center text-sm text-[#5a4a3a]/65">No transactions yet. Completed bookings, tips and payouts will appear here.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-[#FBF7EE] text-[#5a4a3a]/70 uppercase tracking-wide">
                      <tr>
                        <th className="text-left p-2.5">Date</th>
                        <th className="text-left p-2.5">Type</th>
                        <th className="text-left p-2.5">Description</th>
                        <th className="text-right p-2.5">Gross</th>
                        <th className="text-right p-2.5">Commission</th>
                        <th className="text-right p-2.5">Net</th>
                      </tr>
                    </thead>
                    <tbody>
                      {txs.map((t) => (
                        <tr key={`${t.kind}-${t.id}`} className="border-t border-[#D4AF37]/15" data-testid={`tx-row-${t.kind}-${t.id}`}>
                          <td className="p-2.5 font-mono text-[#5a4a3a]/85">{new Date(t.date).toLocaleDateString()}</td>
                          <td className="p-2.5"><Badge variant="outline" className="capitalize text-[10px]">{t.kind}</Badge></td>
                          <td className="p-2.5 text-[#4a1a22]">{t.description}</td>
                          <td className="p-2.5 text-right font-mono">{t.gross ? inr(t.gross) : "—"}</td>
                          <td className="p-2.5 text-right font-mono text-[#5a4a3a]/70">{t.commission ? `−${inr(t.commission)}` : "—"}</td>
                          <td className={`p-2.5 text-right font-mono font-bold ${t.net < 0 ? "text-[#5a4a3a]/70" : "text-[#4a1a22]"}`}>{t.net < 0 ? `−${inr(-t.net)}` : inr(t.net)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payouts" className="mt-4 space-y-3">
          {summary.recentPayouts.length === 0 ? (
            <Card><CardContent className="p-10 text-center text-sm text-[#5a4a3a]/65">No payouts recorded yet. Once we settle, you'll see them here.</CardContent></Card>
          ) : (
            <>
            <div className="text-[11px] text-[#5a4a3a]/65 px-1">Showing your most recent {summary.recentPayouts.length} of {summary.summary.payoutsCount} payouts.</div>
            {summary.recentPayouts.map((p) => (
              <Card key={p.id} data-testid={`payout-row-${p.id}`}>
                <CardContent className="p-4 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-bold text-[#4a1a22]">{inr(p.amountInr)}</div>
                    <div className="text-[11px] text-[#5a4a3a]/70 mt-0.5">via <span className="capitalize">{p.method}</span>{p.reference ? ` · ${p.reference}` : ""}</div>
                    {p.notes && <div className="text-[11px] text-[#5a4a3a]/65 mt-1">{p.notes}</div>}
                  </div>
                  <div className="text-[10px] text-[#5a4a3a]/65 font-mono shrink-0">{new Date(p.paidAt).toLocaleDateString()}</div>
                </CardContent>
              </Card>
            ))}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

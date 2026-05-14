import { useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Crown, Loader2, IndianRupee, Users, CalendarClock, Plus } from "lucide-react";

type Item = {
  id: number; panditId: number; panditName?: string; panditCity?: string;
  panditEmail?: string; panditPhone?: string;
  fromTier: string; toTier: string; amount: number;
  paymentStatus: string;
  activatedAt: string | null; expiresAt: string | null;
  currentTier?: string | null; currentTierExpiresAt?: string | null;
  lastReminderStage: string | null; lastReminderAt: string | null;
  createdAt: string; razorpayPaymentId?: string | null;
};
type Stats = {
  totalsByTier: { toTier: string; revenue: number; purchases: number }[];
  last30Days: { revenue: number; purchases: number };
  activeByTier: { tier: string; count: number }[];
  upcomingRenewals: { id: number; panditId: number; toTier: string; expiresAt: string }[];
};

const TIER_LABEL: Record<string, string> = {
  free: "Free", silver: "Silver", gold: "Gold", guru_elite: "Guru Elite", platinum: "Guru Elite",
};
const TIER_CHIP: Record<string, string> = {
  silver: "bg-[#9CA3AF]/20 text-[#374151]",
  gold: "bg-[#D4AF37]/25 text-[#6D2B35]",
  guru_elite: "bg-[#6D2B35] text-[#FFFAEC]",
  platinum: "bg-[#6D2B35] text-[#FFFAEC]",
  free: "bg-[#5a4a3a]/15 text-[#5a4a3a]",
};

const inr = (n: number) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const fmt = (s: string | null) => s ? new Date(s).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";
const daysFromNow = (s: string | null) => {
  if (!s) return null;
  const ms = new Date(s).getTime() - Date.now();
  return Math.round(ms / (24 * 60 * 60 * 1000));
};

export default function PanditMembershipsTab({ adminToken }: { adminToken?: string }) {
  const { toast } = useToast();
  const headers: Record<string, string> = adminToken ? { "x-admin-token": adminToken } : {};
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [extendOpen, setExtendOpen] = useState<number | null>(null);
  const [extendDays, setExtendDays] = useState<string>("30");

  const { data: list, isLoading } = useQuery<{ items: Item[] }>({
    queryKey: ["/api/admin/pandit-memberships"],
    queryFn: () => fetch("/api/admin/pandit-memberships", { headers }).then((r) => r.json()),
  });
  const { data: stats } = useQuery<Stats>({
    queryKey: ["/api/admin/pandit-memberships/stats"],
    queryFn: () => fetch("/api/admin/pandit-memberships/stats", { headers }).then((r) => r.json()),
  });

  const extendMut = useMutation({
    mutationFn: async ({ panditId, days }: { panditId: number; days: number }) => {
      const r = await fetch(`/api/admin/pandit-memberships/${panditId}/extend`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({ days }),
      });
      if (!r.ok) throw new Error((await r.json()).message || "Failed");
      return r.json();
    },
    onSuccess: () => {
      toast({ title: "Tier extended" });
      setExtendOpen(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pandit-memberships"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pandit-memberships/stats"] });
    },
    onError: (e: any) => toast({ title: "Extend failed", description: e?.message, variant: "destructive" }),
  });

  const filtered = useMemo(() => {
    const items = list?.items ?? [];
    const q = search.trim().toLowerCase();
    return items.filter((i) => {
      if (statusFilter !== "all" && i.paymentStatus !== statusFilter) return false;
      if (tierFilter !== "all" && i.toTier !== tierFilter) return false;
      if (!q) return true;
      return (i.panditName || "").toLowerCase().includes(q)
        || String(i.panditId).includes(q)
        || (i.panditEmail || "").toLowerCase().includes(q)
        || (i.razorpayPaymentId || "").toLowerCase().includes(q);
    });
  }, [list, search, statusFilter, tierFilter]);

  const totalRevenue = (stats?.totalsByTier || []).reduce((s, t) => s + (t.revenue || 0), 0);
  const totalPurchases = (stats?.totalsByTier || []).reduce((s, t) => s + (t.purchases || 0), 0);
  const totalActive = (stats?.activeByTier || []).filter((a) => a.tier && a.tier !== "free").reduce((s, a) => s + a.count, 0);

  return (
    <div className="space-y-4" data-testid="tab-pandit-memberships">
      <div className="flex items-center gap-3">
        <Crown className="h-6 w-6 text-[#D4AF37]" />
        <div>
          <h2 className="text-2xl font-serif text-[#4a1a22] font-bold">Pandit Memberships</h2>
          <p className="text-xs text-[#5a4a3a]/70">Tier purchases, lifetime revenue, active subscribers, and upcoming renewals.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={<IndianRupee className="h-4 w-4" />} label="Lifetime revenue" value={inr(totalRevenue)} testId="stat-membership-revenue" />
        <StatCard icon={<IndianRupee className="h-4 w-4" />} label="Last 30 days" value={inr(stats?.last30Days.revenue || 0)} sub={`${stats?.last30Days.purchases || 0} purchases`} testId="stat-membership-30d" />
        <StatCard icon={<Users className="h-4 w-4" />} label="Active paid" value={String(totalActive)} sub={`${totalPurchases} lifetime`} testId="stat-membership-active" />
        <StatCard icon={<CalendarClock className="h-4 w-4" />} label="Renewals (next 30d)" value={String((stats?.upcomingRenewals || []).filter(r => (new Date(r.expiresAt).getTime() - Date.now()) < 30*86400000).length)} testId="stat-membership-upcoming" />
      </div>

      {(stats?.totalsByTier?.length ?? 0) > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Revenue by tier</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-0">
            {(stats?.totalsByTier || []).map((t) => {
              const active = stats?.activeByTier.find((a) => a.tier === t.toTier);
              return (
                <div key={t.toTier} className="rounded-md border border-[#D4AF37]/20 bg-[#FBF7EE] p-3" data-testid={`tier-summary-${t.toTier}`}>
                  <Badge className={TIER_CHIP[t.toTier] || ""}>{TIER_LABEL[t.toTier] || t.toTier}</Badge>
                  <div className="mt-2 text-xl font-bold text-[#4a1a22]">{inr(t.revenue)}</div>
                  <div className="text-[11px] text-[#5a4a3a]/70">{t.purchases} purchases · {active?.count || 0} active</div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">All purchases</CardTitle>
          <div className="flex flex-col sm:flex-row gap-2 mt-2">
            <Input
              placeholder="Search name, ID, email, payment ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
              data-testid="input-search-membership"
            />
            <select className="text-xs h-9 rounded-md border border-input px-2 bg-background" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} data-testid="select-status-membership">
              <option value="all">All statuses</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
            <select className="text-xs h-9 rounded-md border border-input px-2 bg-background" value={tierFilter} onChange={(e) => setTierFilter(e.target.value)} data-testid="select-tier-membership">
              <option value="all">All tiers</option>
              <option value="silver">Silver</option>
              <option value="gold">Gold</option>
              <option value="guru_elite">Guru Elite</option>
            </select>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin mr-2" />Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-6">No purchases match.</div>
          ) : (
            <table className="w-full text-xs">
              <thead className="text-left text-[10px] uppercase tracking-wide text-muted-foreground border-b">
                <tr>
                  <th className="py-2 pr-2">Pandit</th>
                  <th className="py-2 pr-2">Tier</th>
                  <th className="py-2 pr-2">Amount</th>
                  <th className="py-2 pr-2">Status</th>
                  <th className="py-2 pr-2">Activated</th>
                  <th className="py-2 pr-2">Expires</th>
                  <th className="py-2 pr-2">Reminder</th>
                  <th className="py-2 pr-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((i) => {
                  const dleft = daysFromNow(i.expiresAt);
                  const expSoon = i.paymentStatus === "paid" && dleft != null && dleft >= 0 && dleft <= 30;
                  const expired = i.paymentStatus === "paid" && dleft != null && dleft < 0;
                  return (
                    <tr key={i.id} className="border-b last:border-0" data-testid={`row-membership-${i.id}`}>
                      <td className="py-2 pr-2">
                        <div className="font-semibold text-[#4a1a22]">{i.panditName || `#${i.panditId}`}</div>
                        <div className="text-[10px] text-muted-foreground">{i.panditCity}{i.panditEmail ? ` · ${i.panditEmail}` : ""}</div>
                      </td>
                      <td className="py-2 pr-2"><Badge className={TIER_CHIP[i.toTier] || ""}>{TIER_LABEL[i.toTier] || i.toTier}</Badge></td>
                      <td className="py-2 pr-2 font-semibold">{inr(i.amount)}</td>
                      <td className="py-2 pr-2">
                        <Badge variant={i.paymentStatus === "paid" ? "default" : "outline"} className={i.paymentStatus === "paid" ? "bg-emerald-100 text-emerald-900 hover:bg-emerald-100" : ""}>
                          {i.paymentStatus}
                        </Badge>
                      </td>
                      <td className="py-2 pr-2">{fmt(i.activatedAt)}</td>
                      <td className="py-2 pr-2">
                        <div>{fmt(i.expiresAt)}</div>
                        {expSoon && <div className="text-[10px] text-amber-700 font-semibold">in {dleft}d</div>}
                        {expired && <div className="text-[10px] text-red-700 font-semibold">expired</div>}
                      </td>
                      <td className="py-2 pr-2 text-[10px] text-muted-foreground">
                        {i.lastReminderStage ? `${i.lastReminderStage} · ${fmt(i.lastReminderAt)}` : "—"}
                      </td>
                      <td className="py-2 pr-2 text-right">
                        {i.paymentStatus === "paid" && (
                          extendOpen === i.panditId ? (
                            <span className="inline-flex items-center gap-1">
                              <Input value={extendDays} onChange={(e) => setExtendDays(e.target.value)} className="h-8 w-16 text-xs" data-testid={`input-extend-days-${i.panditId}`} />
                              <Button size="sm" className="h-8" disabled={extendMut.isPending} onClick={() => {
                                const days = parseInt(extendDays, 10);
                                if (!Number.isFinite(days) || days < 1) { toast({ title: "Enter days (1-3650)", variant: "destructive" }); return; }
                                extendMut.mutate({ panditId: i.panditId, days });
                              }} data-testid={`btn-confirm-extend-${i.panditId}`}>
                                {extendMut.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Apply"}
                              </Button>
                              <Button size="sm" variant="ghost" className="h-8" onClick={() => setExtendOpen(null)} data-testid={`btn-cancel-extend-${i.panditId}`}>Cancel</Button>
                            </span>
                          ) : (
                            <Button size="sm" variant="outline" className="h-8" onClick={() => { setExtendOpen(i.panditId); setExtendDays("30"); }} data-testid={`btn-extend-${i.panditId}`}>
                              <Plus className="h-3 w-3 mr-1" />Extend
                            </Button>
                          )
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ icon, label, value, sub, testId }: { icon: React.ReactNode; label: string; value: string; sub?: string; testId?: string }) {
  return (
    <Card data-testid={testId}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground uppercase tracking-wide font-bold">{icon}{label}</div>
        <div className="text-2xl font-bold text-[#4a1a22] mt-1">{value}</div>
        {sub && <div className="text-[11px] text-muted-foreground mt-0.5">{sub}</div>}
      </CardContent>
    </Card>
  );
}

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { panditApi } from "@/lib/panditAuth";
import { Users, Search, Phone, Loader2, Repeat, Wallet, Calendar } from "lucide-react";

type Customer = {
  key: string; userId: number | null; name: string; phone: string;
  totalBookings: number; totalSpent: number;
  completedCount: number; pendingCount: number; cancelledCount: number;
  lastBookingDate: string | null; lastPujaType: string | null;
};
type Resp = { customers: Customer[]; summary: { totalCustomers: number; repeatCustomers: number; lifetimeValue: number } };
type Booking = { id: number; pujaType: string; date: string; status: string; totalAmount: number; mode: string; createdAt: string };

const inr = (n: number) => `₹${(n || 0).toLocaleString("en-IN")}`;

export default function PanditCustomers() {
  const { toast } = useToast();
  const [data, setData] = useState<Resp | null>(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [drillKey, setDrillKey] = useState<string | null>(null);
  const [drillBookings, setDrillBookings] = useState<Booking[]>([]);
  const [drillLoading, setDrillLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        setData(await panditApi("GET", "/api/pandit/customers") as Resp);
      } catch (e: any) {
        toast({ title: "Failed to load customers", description: e?.message, variant: "destructive" });
      } finally { setLoading(false); }
    })();
  }, []);

  const filtered = useMemo(() => {
    if (!data?.customers) return [];
    const term = q.trim().toLowerCase();
    if (!term) return data.customers;
    return data.customers.filter((c) => c.name.toLowerCase().includes(term) || c.phone.includes(term) || (c.lastPujaType || "").toLowerCase().includes(term));
  }, [data, q]);

  async function openDrill(key: string) {
    setDrillKey(key);
    setDrillLoading(true);
    try {
      const r = await panditApi("GET", `/api/pandit/customers/${encodeURIComponent(key)}/bookings`) as { bookings: Booking[] };
      setDrillBookings(r.bookings || []);
    } catch (e: any) {
      toast({ title: "Failed to load bookings", description: e?.message, variant: "destructive" });
    } finally { setDrillLoading(false); }
  }

  if (loading || !data) {
    return <Card><CardContent className="p-10 flex items-center justify-center text-sm text-[#5a4a3a]/70"><Loader2 className="h-4 w-4 animate-spin mr-2" />Loading customers…</CardContent></Card>;
  }

  const drillCustomer = drillKey ? data.customers.find((c) => c.key === drillKey) : null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {[
          { l: "Total customers", v: data.summary.totalCustomers, i: Users },
          { l: "Repeat yajamanas", v: data.summary.repeatCustomers, i: Repeat },
          { l: "Lifetime value", v: inr(data.summary.lifetimeValue), i: Wallet },
        ].map((k, i) => {
          const I = k.i;
          return (
            <Card key={i} data-testid={`cust-kpi-${i}`}>
              <CardContent className="p-3">
                <div className="flex items-center gap-2 text-[10px] text-[#5a4a3a]/65 uppercase tracking-wide font-bold"><I className="h-3.5 w-3.5 text-[#6D2B35]" />{k.l}</div>
                <div className="text-xl font-bold text-[#4a1a22] mt-1">{k.v}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5a4a3a]/50" />
        <Input className="pl-9" placeholder="Search by name, phone, or puja…" value={q} onChange={(e) => setQ(e.target.value)} data-testid="input-cust-search" />
      </div>

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="p-10 text-center text-sm text-[#5a4a3a]/65">{q ? "No customers match your search." : "No customers yet. They'll appear here once you complete bookings."}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-[#FBF7EE] text-[#5a4a3a]/70 uppercase tracking-wide">
                  <tr>
                    <th className="text-left p-2.5">Yajamana</th>
                    <th className="text-left p-2.5">Phone</th>
                    <th className="text-right p-2.5">Bookings</th>
                    <th className="text-right p-2.5">Lifetime spend</th>
                    <th className="text-left p-2.5">Last puja</th>
                    <th className="p-2.5"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => (
                    <tr key={c.key} className="border-t border-[#D4AF37]/15 hover-elevate" data-testid={`cust-row-${c.key}`}>
                      <td className="p-2.5">
                        <div className="font-bold text-[#4a1a22]">{c.name}</div>
                        <div className="flex gap-1 mt-0.5">
                          {c.completedCount > 0 && <Badge variant="outline" className="text-[9px]">{c.completedCount} done</Badge>}
                          {c.pendingCount > 0 && <Badge variant="outline" className="text-[9px] border-amber-500/40 text-amber-700">{c.pendingCount} pending</Badge>}
                          {c.totalBookings > 1 && <Badge className="text-[9px] bg-[#D4AF37]/20 text-[#6D2B35] border-[#D4AF37]/40">repeat</Badge>}
                        </div>
                      </td>
                      <td className="p-2.5 font-mono text-[#5a4a3a]/85">{c.phone}</td>
                      <td className="p-2.5 text-right font-mono">{c.totalBookings}</td>
                      <td className="p-2.5 text-right font-mono font-bold text-[#4a1a22]">{inr(c.totalSpent)}</td>
                      <td className="p-2.5 text-[#5a4a3a]/85">
                        <div>{c.lastPujaType || "—"}</div>
                        <div className="text-[10px] text-[#5a4a3a]/60">{c.lastBookingDate ? new Date(c.lastBookingDate).toLocaleDateString() : ""}</div>
                      </td>
                      <td className="p-2.5 text-right space-x-1">
                        <Button size="sm" variant="outline" onClick={() => openDrill(c.key)} data-testid={`btn-cust-view-${c.key}`}>View</Button>
                        <Button size="sm" variant="outline" asChild><a href={`tel:${c.phone}`} data-testid={`btn-cust-call-${c.key}`}><Phone className="h-3 w-3" /></a></Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!drillKey} onOpenChange={(v) => { if (!v) { setDrillKey(null); setDrillBookings([]); } }}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-[#4a1a22]">{drillCustomer?.name} — booking history</DialogTitle>
          </DialogHeader>
          {drillLoading ? (
            <div className="p-8 flex items-center justify-center"><Loader2 className="h-4 w-4 animate-spin" /></div>
          ) : (
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {drillBookings.map((b) => (
                <Card key={b.id} data-testid={`drill-bk-${b.id}`}>
                  <CardContent className="p-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-bold text-[#4a1a22] text-sm">{b.pujaType}</div>
                      <div className="text-[11px] text-[#5a4a3a]/70 mt-0.5 flex items-center gap-2">
                        <Calendar className="h-3 w-3" />{b.date} · <span className="capitalize">{b.mode}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-mono font-bold text-[#4a1a22]">{inr(b.totalAmount)}</div>
                      <Badge variant="outline" className="capitalize text-[9px] mt-1">{b.status}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

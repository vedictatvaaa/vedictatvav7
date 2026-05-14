import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Users, Crown, Repeat, UserPlus, IndianRupee, Search, Mail, Phone, MapPin } from "lucide-react";
import type { Order } from "@shared/schema";

const fmtMoney = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;
const fmtDate = (d: Date | null) => (d ? d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—");

type CustomerRow = {
  email: string;
  name: string;
  phone: string;
  state: string;
  orderCount: number;
  ltv: number;
  aov: number;
  lastOrderAt: Date | null;
  firstOrderAt: Date | null;
  segment: "VIP" | "Repeat" | "New";
  orders: Order[];
};

function aggregate(orders: Order[]): CustomerRow[] {
  const byEmail = new Map<string, Order[]>();
  for (const o of orders) {
    const key = (o.customerEmail || o.customerPhone || `guest-${o.id}`).toLowerCase().trim();
    if (!key) continue;
    const arr = byEmail.get(key) || [];
    arr.push(o);
    byEmail.set(key, arr);
  }

  const rows: CustomerRow[] = [];
  for (const [email, list] of byEmail) {
    const settled = list.filter((o) => o.status !== "cancelled" && o.status !== "refunded");
    const ltv = settled.reduce((s, o) => s + (o.totalAmount || 0), 0);
    const orderCount = settled.length;
    const aov = orderCount > 0 ? Math.round(ltv / orderCount) : 0;
    const dates = list.map((o) => (o.createdAt ? new Date(o.createdAt as any) : null)).filter((d): d is Date => !!d).sort((a, b) => a.getTime() - b.getTime());
    const firstOrderAt = dates[0] || null;
    const lastOrderAt = dates[dates.length - 1] || null;
    const latest = list[0] || {};
    const segment: CustomerRow["segment"] = ltv >= 10000 || orderCount >= 5 ? "VIP" : orderCount >= 2 ? "Repeat" : "New";
    rows.push({
      email,
      name: (latest as any).customerName || "—",
      phone: (latest as any).customerPhone || "",
      state: (latest as any).customerState || "",
      orderCount,
      ltv,
      aov,
      lastOrderAt,
      firstOrderAt,
      segment,
      orders: list.sort((a, b) => new Date((b.createdAt as any) || 0).getTime() - new Date((a.createdAt as any) || 0).getTime()),
    });
  }
  return rows.sort((a, b) => b.ltv - a.ltv);
}

export function CustomersTab() {
  const { data: orders = [], isLoading } = useQuery<Order[]>({ queryKey: ["/api/orders"] });
  const [search, setSearch] = useState("");
  const [segment, setSegment] = useState<"all" | "VIP" | "Repeat" | "New">("all");
  const [selected, setSelected] = useState<CustomerRow | null>(null);

  const customers = useMemo(() => aggregate(orders), [orders]);

  const filtered = useMemo(() => {
    let rows = customers;
    if (segment !== "all") rows = rows.filter((c) => c.segment === segment);
    const q = search.trim().toLowerCase();
    if (q) rows = rows.filter((c) => c.email.toLowerCase().includes(q) || c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.state.toLowerCase().includes(q));
    return rows;
  }, [customers, segment, search]);

  const totals = useMemo(() => {
    const totalLtv = customers.reduce((s, c) => s + c.ltv, 0);
    const vip = customers.filter((c) => c.segment === "VIP").length;
    const repeat = customers.filter((c) => c.segment === "Repeat").length;
    const newC = customers.filter((c) => c.segment === "New").length;
    const avgLtv = customers.length ? Math.round(totalLtv / customers.length) : 0;
    return { total: customers.length, vip, repeat, newC, avgLtv, totalLtv };
  }, [customers]);

  return (
    <div className="space-y-4" data-testid="tab-customers">
      <div>
        <h2 className="text-2xl font-bold text-primary">Customers</h2>
        <p className="text-sm text-muted-foreground">Lifetime value, repeat purchase behaviour, and segments aggregated from order history.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between gap-1 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total customers</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold" data-testid="metric-customers-total">{totals.total}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between gap-1 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">VIP</CardTitle>
            <Crown className="w-4 h-4" style={{ color: "#D4AF37" }} />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold" style={{ color: "#D4AF37" }} data-testid="metric-customers-vip">{totals.vip}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between gap-1 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">Repeat</CardTitle>
            <Repeat className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-primary" data-testid="metric-customers-repeat">{totals.repeat}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between gap-1 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">New</CardTitle>
            <UserPlus className="w-4 h-4 text-emerald-600" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-emerald-600" data-testid="metric-customers-new">{totals.newC}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between gap-1 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">Avg LTV</CardTitle>
            <IndianRupee className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold" data-testid="metric-customers-avg-ltv">{fmtMoney(totals.avgLtv)}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-4 flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[220px]">
            <Label className="text-xs text-muted-foreground">Search</Label>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, email, phone, state" className="pl-7" data-testid="input-customers-search" />
            </div>
          </div>
          <div className="flex flex-wrap gap-1">
            {(["all", "VIP", "Repeat", "New"] as const).map((s) => (
              <Button key={s} size="sm" variant={segment === s ? "default" : "outline"} onClick={() => setSegment(s)} data-testid={`button-segment-${s}`}>
                {s === "all" ? "All" : s}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="text-left px-3 py-2">Customer</th>
              <th className="text-left px-3 py-2 hidden md:table-cell">Contact</th>
              <th className="text-left px-3 py-2 hidden lg:table-cell">State</th>
              <th className="text-right px-3 py-2">Orders</th>
              <th className="text-right px-3 py-2">LTV</th>
              <th className="text-right px-3 py-2 hidden md:table-cell">AOV</th>
              <th className="text-left px-3 py-2 hidden md:table-cell">Last order</th>
              <th className="text-left px-3 py-2">Segment</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (<tr><td colSpan={8} className="text-center text-muted-foreground py-8">Loading...</td></tr>)}
            {!isLoading && filtered.length === 0 && (<tr><td colSpan={8} className="text-center text-muted-foreground py-8" data-testid="text-customers-empty">No customers match your filters.</td></tr>)}
            {filtered.map((c) => (
              <tr key={c.email} className="border-t border-border hover-elevate cursor-pointer" onClick={() => setSelected(c)} data-testid={`row-customer-${c.email}`}>
                <td className="px-3 py-2">
                  <div className="font-medium text-foreground">{c.name}</div>
                  <div className="text-xs text-muted-foreground truncate max-w-[200px]">{c.email}</div>
                </td>
                <td className="px-3 py-2 hidden md:table-cell text-xs text-muted-foreground">{c.phone || "—"}</td>
                <td className="px-3 py-2 hidden lg:table-cell text-xs text-muted-foreground">{c.state || "—"}</td>
                <td className="px-3 py-2 text-right font-semibold">{c.orderCount}</td>
                <td className="px-3 py-2 text-right font-semibold">{fmtMoney(c.ltv)}</td>
                <td className="px-3 py-2 text-right hidden md:table-cell">{fmtMoney(c.aov)}</td>
                <td className="px-3 py-2 hidden md:table-cell text-xs">{fmtDate(c.lastOrderAt)}</td>
                <td className="px-3 py-2">
                  <Badge variant={c.segment === "VIP" ? "default" : c.segment === "Repeat" ? "secondary" : "outline"} style={c.segment === "VIP" ? { background: "#D4AF37", color: "#1a1a1a" } : undefined} data-testid={`badge-segment-${c.email}`}>{c.segment}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selected.name}
                  <Badge variant={selected.segment === "VIP" ? "default" : "secondary"} style={selected.segment === "VIP" ? { background: "#D4AF37", color: "#1a1a1a" } : undefined}>{selected.segment}</Badge>
                </DialogTitle>
              </DialogHeader>
              <div className="grid sm:grid-cols-3 gap-3 text-sm">
                <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-muted-foreground" /><span className="truncate">{selected.email}</span></div>
                {selected.phone && <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-muted-foreground" />{selected.phone}</div>}
                {selected.state && <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-muted-foreground" />{selected.state}</div>}
              </div>
              <div className="grid grid-cols-3 gap-3 mt-2">
                <Card><CardContent className="pt-4"><div className="text-xs text-muted-foreground">Orders</div><div className="text-xl font-bold">{selected.orderCount}</div></CardContent></Card>
                <Card><CardContent className="pt-4"><div className="text-xs text-muted-foreground">LTV</div><div className="text-xl font-bold">{fmtMoney(selected.ltv)}</div></CardContent></Card>
                <Card><CardContent className="pt-4"><div className="text-xs text-muted-foreground">AOV</div><div className="text-xl font-bold">{fmtMoney(selected.aov)}</div></CardContent></Card>
              </div>
              <div className="text-xs text-muted-foreground">First order: {fmtDate(selected.firstOrderAt)} · Last order: {fmtDate(selected.lastOrderAt)}</div>
              <div className="mt-2">
                <h3 className="text-sm font-semibold mb-2">Order history</h3>
                <div className="space-y-2">
                  {selected.orders.map((o) => (
                    <div key={o.id} className="flex items-center justify-between p-2 rounded-md border border-border" data-testid={`order-history-${o.id}`}>
                      <div>
                        <div className="font-medium text-sm">Order #{o.id}</div>
                        <div className="text-xs text-muted-foreground">{o.createdAt ? new Date(o.createdAt as any).toLocaleString("en-IN") : "—"}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{fmtMoney(o.totalAmount || 0)}</div>
                        <Badge variant="outline" className="text-xs">{o.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

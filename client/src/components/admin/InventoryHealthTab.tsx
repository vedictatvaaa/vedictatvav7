import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AlertTriangle, PackageX, Package, IndianRupee, Activity, Save, Search } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Product, Order } from "@shared/schema";

const fmtMoney = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

function lastNDaysOrders(orders: Order[], days: number): Order[] {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return orders.filter((o) => {
    if (!o.createdAt) return false;
    const t = new Date(o.createdAt as any).getTime();
    return t >= cutoff && o.status !== "cancelled" && o.status !== "refunded";
  });
}

function buildVelocityMap(orders: Order[]): Map<number, number> {
  const map = new Map<number, number>();
  for (const o of orders) {
    const items = (o.items as any) || [];
    if (!Array.isArray(items)) continue;
    for (const it of items) {
      const pid = Number(it?.id ?? it?.productId);
      const qty = Number(it?.quantity ?? 1);
      if (!pid || !Number.isFinite(qty)) continue;
      map.set(pid, (map.get(pid) || 0) + qty);
    }
  }
  return map;
}

export function InventoryHealthTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [threshold, setThreshold] = useState(10);
  const [search, setSearch] = useState("");
  const [edits, setEdits] = useState<Record<number, number>>({});

  const { data: products = [], isLoading: loadingP } = useQuery<Product[]>({ queryKey: ["/api/products"] });
  const { data: orders = [], isLoading: loadingO } = useQuery<Order[]>({ queryKey: ["/api/orders"] });

  const recentOrders = useMemo(() => lastNDaysOrders(orders, 30), [orders]);
  const velocity = useMemo(() => buildVelocityMap(recentOrders), [recentOrders]);

  const enriched = useMemo(() => {
    return products.map((p) => {
      const sold30 = velocity.get(p.id) || 0;
      const dailyRate = sold30 / 30;
      const daysCover = dailyRate > 0 ? Math.floor((p.stock || 0) / dailyRate) : null;
      const stockValue = (p.stock || 0) * (Number(p.costPrice) || Number(p.price) || 0);
      return { p, sold30, dailyRate, daysCover, stockValue };
    });
  }, [products, velocity]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return enriched;
    return enriched.filter(({ p }) => p.name.toLowerCase().includes(q) || (p.slug || "").toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
  }, [enriched, search]);

  const out = useMemo(() => filtered.filter(({ p }) => (p.stock || 0) <= 0), [filtered]);
  const low = useMemo(() => filtered.filter(({ p }) => (p.stock || 0) > 0 && (p.stock || 0) <= threshold), [filtered, threshold]);
  const dead = useMemo(() => filtered.filter(({ p, sold30 }) => sold30 === 0 && (p.stock || 0) > threshold), [filtered, threshold]);
  const reorderSoon = useMemo(
    () => filtered.filter(({ daysCover, p }) => daysCover !== null && daysCover <= 14 && (p.stock || 0) > 0).sort((a, b) => (a.daysCover || 0) - (b.daysCover || 0)),
    [filtered]
  );

  const totalStockValue = useMemo(() => enriched.reduce((s, x) => s + x.stockValue, 0), [enriched]);
  const totalSkus = enriched.length;
  const skusOut = enriched.filter(({ p }) => (p.stock || 0) <= 0).length;
  const skusLow = enriched.filter(({ p }) => (p.stock || 0) > 0 && (p.stock || 0) <= threshold).length;

  const updateStockMut = useMutation({
    mutationFn: async ({ id, stock }: { id: number; stock: number }) => apiRequest("PATCH", `/api/products/${id}`, { stock }),
    onSuccess: (_d, vars) => {
      toast({ title: "Stock updated", description: `Saved new stock for product #${vars.id}` });
      setEdits((e) => {
        const { [vars.id]: _, ...rest } = e;
        return rest;
      });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
    },
    onError: (err: any) => toast({ title: "Update failed", description: err?.message || "Could not save stock", variant: "destructive" }),
  });

  const renderTable = (rows: typeof enriched, emptyMsg: string) => (
    <div className="overflow-x-auto rounded-md border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="text-left px-3 py-2">Product</th>
            <th className="text-left px-3 py-2 hidden sm:table-cell">Category</th>
            <th className="text-right px-3 py-2">Stock</th>
            <th className="text-right px-3 py-2 hidden md:table-cell">Sold 30d</th>
            <th className="text-right px-3 py-2 hidden md:table-cell">Days cover</th>
            <th className="text-right px-3 py-2 hidden lg:table-cell">Stock value</th>
            <th className="text-right px-3 py-2">Update</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={7} className="text-center text-muted-foreground py-8" data-testid="text-inventory-empty">{emptyMsg}</td>
            </tr>
          )}
          {rows.map(({ p, sold30, daysCover, stockValue }) => {
            const editing = edits[p.id];
            const newVal = editing ?? p.stock;
            const dirty = editing !== undefined && editing !== p.stock;
            return (
              <tr key={p.id} className="border-t border-border" data-testid={`row-inventory-${p.id}`}>
                <td className="px-3 py-2">
                  <div className="font-medium text-foreground">{p.name}</div>
                  <div className="text-xs text-muted-foreground">#{p.id} · {p.slug || "no-slug"}</div>
                </td>
                <td className="px-3 py-2 hidden sm:table-cell text-muted-foreground">{p.category}</td>
                <td className="px-3 py-2 text-right">
                  <Badge variant={p.stock <= 0 ? "destructive" : p.stock <= threshold ? "default" : "outline"} data-testid={`badge-stock-${p.id}`}>{p.stock}</Badge>
                </td>
                <td className="px-3 py-2 text-right hidden md:table-cell">{sold30}</td>
                <td className="px-3 py-2 text-right hidden md:table-cell">
                  {daysCover === null ? <span className="text-muted-foreground">—</span> : <span className={daysCover <= 7 ? "text-red-600 font-semibold" : daysCover <= 14 ? "text-amber-600" : ""}>{daysCover}d</span>}
                </td>
                <td className="px-3 py-2 text-right hidden lg:table-cell">{fmtMoney(stockValue)}</td>
                <td className="px-3 py-2 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Input
                      type="number"
                      min={0}
                      value={newVal}
                      onChange={(e) => setEdits((prev) => ({ ...prev, [p.id]: Math.max(0, parseInt(e.target.value) || 0) }))}
                      className="w-20 h-9 text-right"
                      data-testid={`input-stock-${p.id}`}
                    />
                    <Button size="icon" variant={dirty ? "default" : "ghost"} disabled={!dirty || updateStockMut.isPending} onClick={() => updateStockMut.mutate({ id: p.id, stock: newVal })} data-testid={`button-save-stock-${p.id}`}>
                      <Save className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  const isLoading = loadingP || loadingO;

  return (
    <div className="space-y-4" data-testid="tab-inventory-health">
      <div>
        <h2 className="text-2xl font-bold text-primary">Inventory Health</h2>
        <p className="text-sm text-muted-foreground">Restock alerts, sales velocity, and stock valuation across your catalog.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between gap-1 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total SKUs</CardTitle>
            <Package className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold" data-testid="metric-total-skus">{totalSkus}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between gap-1 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">Out of stock</CardTitle>
            <PackageX className="w-4 h-4 text-red-600" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-red-600" data-testid="metric-out-stock">{skusOut}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between gap-1 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">Low stock (≤{threshold})</CardTitle>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-amber-600" data-testid="metric-low-stock">{skusLow}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between gap-1 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">Stock value</CardTitle>
            <IndianRupee className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold" data-testid="metric-stock-value">{fmtMoney(totalStockValue)}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-4 flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[220px]">
            <Label className="text-xs text-muted-foreground">Search products</Label>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, slug, category" className="pl-7" data-testid="input-inventory-search" />
            </div>
          </div>
          <div className="w-32">
            <Label className="text-xs text-muted-foreground">Low-stock threshold</Label>
            <Input type="number" min={1} value={threshold} onChange={(e) => setThreshold(Math.max(1, parseInt(e.target.value) || 10))} data-testid="input-threshold" />
          </div>
          <div className="text-xs text-muted-foreground pb-2">
            <Activity className="w-3 h-3 inline mr-1" />
            Velocity from last 30 days of non-cancelled orders.
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="reorder">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="reorder" data-testid="tab-reorder">Reorder soon ({reorderSoon.length})</TabsTrigger>
          <TabsTrigger value="out" data-testid="tab-out">Out of stock ({out.length})</TabsTrigger>
          <TabsTrigger value="low" data-testid="tab-low">Low stock ({low.length})</TabsTrigger>
          <TabsTrigger value="dead" data-testid="tab-dead">Dead stock ({dead.length})</TabsTrigger>
          <TabsTrigger value="all" data-testid="tab-all-inv">All ({filtered.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="reorder" className="mt-3">
          {isLoading ? <div className="text-sm text-muted-foreground py-8 text-center">Loading...</div> : renderTable(reorderSoon, "Nothing needs reordering in the next 14 days. Healthy catalog!")}
        </TabsContent>
        <TabsContent value="out" className="mt-3">
          {isLoading ? <div className="text-sm text-muted-foreground py-8 text-center">Loading...</div> : renderTable(out, "All products in stock.")}
        </TabsContent>
        <TabsContent value="low" className="mt-3">
          {isLoading ? <div className="text-sm text-muted-foreground py-8 text-center">Loading...</div> : renderTable(low, "No low-stock products at this threshold.")}
        </TabsContent>
        <TabsContent value="dead" className="mt-3">
          {isLoading ? <div className="text-sm text-muted-foreground py-8 text-center">Loading...</div> : renderTable(dead, "No dead stock — every product is moving.")}
        </TabsContent>
        <TabsContent value="all" className="mt-3">
          {isLoading ? <div className="text-sm text-muted-foreground py-8 text-center">Loading...</div> : renderTable(filtered, "No products match your search.")}
        </TabsContent>
      </Tabs>
    </div>
  );
}

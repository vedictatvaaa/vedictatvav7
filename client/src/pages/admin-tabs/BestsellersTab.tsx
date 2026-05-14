import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { TrendingUp, Search, Edit, CheckCircle, Type, ChevronRight, X } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

import { Button } from "@/components/ui/button";

import { Skeleton } from "@/components/ui/skeleton";

import { useToast } from "@/hooks/use-toast";
import type { Product } from "@shared/schema";

import { createFetcher } from "../admin-shared";

function BestsellersTab({ adminToken }: { adminToken?: string }) {
  const { toast } = useToast();
  const fetcher = createFetcher(adminToken);
  const queryClient = useQueryClient();

  const { data: settings, isLoading: loadingSettings } = useQuery<{ mode: "auto" | "manual"; productIds: number[]; limit: number }>({
    queryKey: ["/api/admin/bestsellers/settings"],
    queryFn: () => fetcher("/api/admin/bestsellers/settings"),
  });
  const { data: products } = useQuery<Product[]>({ queryKey: ["/api/products"] });
  const { data: previewBestsellers } = useQuery<Product[]>({ queryKey: ["/api/bestsellers"] });

  const [mode, setMode] = useState<"auto" | "manual">("auto");
  const [selected, setSelected] = useState<number[]>([]);
  const [limit, setLimit] = useState<number>(6);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (settings) {
      setMode(settings.mode);
      setSelected(settings.productIds || []);
      setLimit(settings.limit || 6);
    }
  }, [settings]);

  const inStockProducts = useMemo(() => (products || []).filter((p) => (p.stock ?? 0) > 0), [products]);
  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return inStockProducts;
    return inStockProducts.filter((p) =>
      [p.name, p.category, p.description].filter(Boolean).some((s: any) => String(s).toLowerCase().includes(q))
    );
  }, [inStockProducts, query]);

  const productById = useMemo(() => new Map((products || []).map((p) => [p.id, p])), [products]);
  const selectedProducts = useMemo(
    () => selected.map((id) => productById.get(id)).filter(Boolean) as Product[],
    [selected, productById]
  );

  const toggle = (id: number) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };
  const move = (idx: number, dir: -1 | 1) => {
    setSelected((prev) => {
      const next = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };

  const saveMut = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/bestsellers/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-token": adminToken || "" },
        body: JSON.stringify({ mode, productIds: selected, limit }),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || "Save failed");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/bestsellers/settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bestsellers"] });
      toast({ title: "Bestsellers updated", description: `Mode: ${mode === "auto" ? "Automated (by sales rank)" : "Manual selection"}` });
    },
    onError: (err: any) => toast({ title: "Save failed", description: err?.message || String(err), variant: "destructive" }),
  });

  const autoPreview = useMemo(() => {
    return [...inStockProducts]
      .sort((a, b) => (b.salesCount ?? 0) - (a.salesCount ?? 0))
      .slice(0, limit);
  }, [inStockProducts, limit]);

  const livePreview = mode === "auto" ? autoPreview : selectedProducts.slice(0, limit);

  if (loadingSettings) return <Skeleton className="h-64 w-full" />;

  return (
    <div className="space-y-6" data-testid="bestsellers-tab">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-primary">Homepage Bestsellers</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Curate the &quot;Bestsellers&quot; section shown on the homepage. Pick automated ranking or hand-pick the products yourself.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Selection mode</CardTitle>
          <CardDescription>Choose how the homepage bestsellers list is built.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setMode("auto")}
              className={`text-left p-4 rounded-md border transition-colors ${mode === "auto" ? "border-primary bg-muted" : "border-border hover-elevate"}`}
              data-testid="mode-auto"
            >
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <TrendingUp className="w-4 h-4" />
                Automated (by bestselling rank)
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Top selling in-stock products are shown automatically based on each product&apos;s sales count.
              </div>
            </button>
            <button
              type="button"
              onClick={() => setMode("manual")}
              className={`text-left p-4 rounded-md border transition-colors ${mode === "manual" ? "border-primary bg-muted" : "border-border hover-elevate"}`}
              data-testid="mode-manual"
            >
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Edit className="w-4 h-4" />
                Manual selection
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                You hand-pick which products show up and in what order.
              </div>
            </button>
          </div>

          <div className="flex items-end gap-3 flex-wrap">
            <div>
              <Label htmlFor="bestsellers-limit" className="text-xs uppercase tracking-wide text-secondary">How many to show</Label>
              <Input
                id="bestsellers-limit"
                type="number"
                min={1}
                max={24}
                value={limit}
                onChange={(e) => setLimit(Math.max(1, Math.min(24, Number(e.target.value) || 1)))}
                className="w-28"
                data-testid="input-bestsellers-limit"
              />
            </div>
            <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending} data-testid="button-save-bestsellers">
              {saveMut.isPending ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {mode === "manual" && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Selected products ({selected.length})</CardTitle>
              <CardDescription>Drag-free ordering: use the arrows to reorder. The first {limit} will appear on the homepage.</CardDescription>
            </CardHeader>
            <CardContent>
              {selectedProducts.length === 0 ? (
                <div className="text-sm text-muted-foreground py-6 text-center">
                  No products selected yet. Pick from the catalog below.
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedProducts.map((p, idx) => (
                    <div
                      key={p.id}
                      className={`flex items-center gap-3 p-2 rounded-md border ${idx < limit ? "border-border bg-card" : "border-dashed border-border bg-muted opacity-70"}`}
                      data-testid={`selected-product-${p.id}`}
                    >
                      <div className="text-xs font-mono w-6 text-center text-secondary">{idx + 1}</div>
                      {p.image ? (
                        <img src={p.image} alt={p.name} className="w-10 h-10 object-cover rounded" />
                      ) : (
                        <div className="w-10 h-10 rounded bg-muted" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-foreground truncate">{p.name}</div>
                        <div className="text-xs text-muted-foreground">₹{p.price} • {p.salesCount ?? 0} sold • stock {p.stock ?? 0}</div>
                      </div>
                      {idx >= limit && (
                        <span className="text-[10px] uppercase tracking-wide text-secondary bg-muted px-2 py-0.5 rounded">Hidden (over limit)</span>
                      )}
                      <div className="flex items-center gap-1">
                        <Button size="icon" variant="ghost" disabled={idx === 0} onClick={() => move(idx, -1)} data-testid={`move-up-${p.id}`}>
                          <ChevronRight className="w-4 h-4 -rotate-90" />
                        </Button>
                        <Button size="icon" variant="ghost" disabled={idx === selectedProducts.length - 1} onClick={() => move(idx, 1)} data-testid={`move-down-${p.id}`}>
                          <ChevronRight className="w-4 h-4 rotate-90" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => toggle(p.id)} data-testid={`remove-${p.id}`}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Add from catalog</CardTitle>
              <CardDescription>Click any in-stock product to add or remove it from the selection.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-3 flex items-center gap-2">
                <Search className="w-4 h-4 text-secondary" />
                <Input
                  placeholder="Search by name, category..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  data-testid="input-product-search"
                />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[480px] overflow-y-auto">
                {filteredProducts.map((p) => {
                  const isSelected = selected.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => toggle(p.id)}
                      className={`text-left p-2 rounded-md border transition-colors ${isSelected ? "border-primary bg-muted" : "border-border hover-elevate"}`}
                      data-testid={`catalog-product-${p.id}`}
                    >
                      <div className="aspect-square w-full rounded overflow-hidden bg-muted mb-2">
                        {p.image ? <img src={p.image} alt={p.name} className="w-full h-full object-cover" /> : null}
                      </div>
                      <div className="flex items-start gap-1">
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-foreground line-clamp-2">{p.name}</div>
                          <div className="text-[11px] text-muted-foreground mt-0.5">₹{p.price} • {p.salesCount ?? 0} sold</div>
                        </div>
                        {isSelected && <CheckCircle className="w-4 h-4 text-primary shrink-0" />}
                      </div>
                    </button>
                  );
                })}
                {filteredProducts.length === 0 && (
                  <div className="col-span-full text-sm text-muted-foreground text-center py-6">No products match.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Live homepage preview</CardTitle>
          <CardDescription>
            What the homepage Bestsellers section will show right now ({mode === "auto" ? "automated by sales rank" : "your manual selection"}).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {livePreview.length === 0 ? (
            <div className="text-sm text-muted-foreground py-6 text-center">
              {mode === "manual"
                ? "No products selected yet. Pick at least one product above."
                : "No in-stock products available to feature."}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {livePreview.map((p, idx) => (
                <div key={p.id} className="p-2 rounded-md border border-border" data-testid={`preview-product-${p.id}`}>
                  <div className="aspect-square w-full rounded overflow-hidden bg-muted mb-2 relative">
                    {p.image ? <img src={p.image} alt={p.name} className="w-full h-full object-cover" /> : null}
                    <span className="absolute top-1 left-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary text-white">#{idx + 1}</span>
                  </div>
                  <div className="text-xs font-medium text-foreground line-clamp-2">{p.name}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">₹{p.price}</div>
                </div>
              ))}
            </div>
          )}
          {previewBestsellers && previewBestsellers.length !== livePreview.length && (
            <div className="mt-3 text-xs text-secondary">
              Note: the homepage currently shows {previewBestsellers.length} item(s). Click &quot;Save changes&quot; to apply your edits.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


export default BestsellersTab;

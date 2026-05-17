import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowUp, ArrowDown, Eye, EyeOff, Save, RotateCcw, Loader2, GripVertical } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import type { HomepageSection } from "@shared/schema";
import { createFetcher } from "../admin-shared";

export default function HomepageSectionsTab() {
  const adminToken = typeof window !== "undefined" ? localStorage.getItem("adminToken") || "" : "";
  const fetcher = createFetcher(adminToken);
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: serverRows, isLoading } = useQuery<HomepageSection[]>({
    queryKey: ["/api/admin/homepage-sections"],
    queryFn: () => fetcher("/api/admin/homepage-sections"),
  });

  // Local working copy. Sync from server on first load + after mutations.
  const [rows, setRows] = useState<HomepageSection[]>([]);
  const [dirty, setDirty] = useState(false);
  useEffect(() => {
    if (serverRows) {
      setRows(serverRows);
      setDirty(false);
    }
  }, [serverRows]);

  const toggleMut = useMutation({
    mutationFn: async ({ id, enabled }: { id: number; enabled: boolean }) => {
      const r = await fetch(`/api/admin/homepage-sections/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-admin-token": adminToken },
        body: JSON.stringify({ enabled }),
      });
      if (!r.ok) throw new Error(await r.text());
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/homepage-sections"] });
      toast({ title: "Saved", description: "Section visibility updated." });
    },
    onError: (e: any) => {
      toast({ title: "Save failed", description: e?.message || "Try again", variant: "destructive" });
    },
  });

  const reorderMut = useMutation({
    mutationFn: async (ids: number[]) => {
      const r = await fetch("/api/admin/homepage-sections/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-token": adminToken },
        body: JSON.stringify({ ids }),
      });
      if (!r.ok) throw new Error(await r.text());
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/homepage-sections"] });
      toast({ title: "Order saved", description: "New section order is live on the homepage." });
    },
    onError: (e: any) => {
      toast({ title: "Save failed", description: e?.message || "Try again", variant: "destructive" });
    },
  });

  function move(idx: number, dir: -1 | 1) {
    const next = idx + dir;
    if (next < 0 || next >= rows.length) return;
    const copy = rows.slice();
    [copy[idx], copy[next]] = [copy[next], copy[idx]];
    setRows(copy);
    setDirty(true);
  }
  function toggle(row: HomepageSection) {
    // Optimistic local flip + persist immediately (single-field change,
    // doesn't need the "Save Order" flow).
    setRows((r) => r.map((s) => (s.id === row.id ? { ...s, enabled: !row.enabled } : s)));
    toggleMut.mutate({ id: row.id, enabled: !row.enabled });
  }
  function saveOrder() {
    reorderMut.mutate(rows.map((r) => r.id));
  }
  function resetOrder() {
    if (serverRows) {
      setRows(serverRows);
      setDirty(false);
    }
  }

  return (
    <div className="space-y-4" data-testid="tab-homepage-sections">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-serif font-semibold text-foreground" data-testid="text-homepage-sections-heading">
            Homepage Sections
          </h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Reorder or hide the movable blocks on your homepage. The Hero, the gold tagline strip,
            and the SEO copy at the bottom are structural and always remain in place.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {dirty && (
            <Button
              variant="outline"
              size="sm"
              onClick={resetOrder}
              data-testid="btn-reset-order"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              Discard
            </Button>
          )}
          <Button
            size="sm"
            onClick={saveOrder}
            disabled={!dirty || reorderMut.isPending}
            data-testid="btn-save-order"
          >
            {reorderMut.isPending ? (
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5 mr-1.5" />
            )}
            Save Order
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y divide-border">
              {rows.map((row, idx) => (
                <li
                  key={row.id}
                  className="flex items-center gap-3 p-3 sm:p-4"
                  data-testid={`row-section-${row.key}`}
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center shrink-0">
                    <span className="text-xs font-semibold tabular-nums">{idx + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm truncate" data-testid={`text-label-${row.key}`}>
                        {row.label}
                      </span>
                      {!row.enabled && (
                        <Badge variant="secondary" className="text-[10px]">Hidden</Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 font-mono">
                      key: {row.key}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => move(idx, -1)}
                      disabled={idx === 0}
                      aria-label="Move up"
                      data-testid={`btn-move-up-${row.key}`}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => move(idx, 1)}
                      disabled={idx === rows.length - 1}
                      aria-label="Move down"
                      data-testid={`btn-move-down-${row.key}`}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center gap-1.5 pl-2 border-l ml-1">
                      {row.enabled ? (
                        <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                      ) : (
                        <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                      <Switch
                        checked={row.enabled}
                        onCheckedChange={() => toggle(row)}
                        aria-label="Toggle section"
                        data-testid={`switch-enabled-${row.key}`}
                      />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-muted-foreground">
        Tip: reorder with the up/down arrows then click <strong>Save Order</strong>. Toggling
        visibility saves immediately. Changes propagate to the public homepage within ~5 minutes
        (cache window) or instantly on a hard refresh.
      </p>
    </div>
  );
}

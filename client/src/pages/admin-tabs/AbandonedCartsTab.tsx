import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Send } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

import { Button } from "@/components/ui/button";

import { Skeleton } from "@/components/ui/skeleton";

import { useToast } from "@/hooks/use-toast";

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { createFetcher } from "../admin-shared";

// ============================================================
type AbandonedCart = {
  id: number;
  email: string;
  items: Array<{ id?: number; name: string; price: number; quantity: number; image?: string }>;
  cartTotal: number;
  nudgeSentAt: string | null;
  recovered: boolean;
  createdAt: string;
  updatedAt: string;
};

function AbandonedCartsTab({ adminToken }: { adminToken?: string }) {
  const fetcher = createFetcher(adminToken || "");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"all" | "pending" | "nudged" | "recovered">("pending");

  const { data, isLoading } = useQuery<{ carts: AbandonedCart[] }>({
    queryKey: ["/api/admin/abandoned-carts"],
    queryFn: () => fetcher("/api/admin/abandoned-carts"),
  });

  const carts = (data?.carts || []).filter((c) => {
    if (filter === "all") return true;
    if (filter === "pending") return !c.nudgeSentAt && !c.recovered;
    if (filter === "nudged") return !!c.nudgeSentAt && !c.recovered;
    if (filter === "recovered") return c.recovered;
    return true;
  });

  const nudgeMut = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/abandoned-carts/${id}/nudge`, {
        method: "POST",
        headers: { "x-admin-token": adminToken || "" },
      });
      if (!res.ok) throw new Error((await res.json()).message || "Nudge failed");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Reminder email sent" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/abandoned-carts"] });
    },
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/abandoned-carts/${id}`, {
        method: "DELETE",
        headers: { "x-admin-token": adminToken || "" },
      });
      if (!res.ok) throw new Error((await res.json()).message || "Delete failed");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Cart removed" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/abandoned-carts"] });
    },
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const totalValue = carts.reduce((sum, c) => sum + (c.cartTotal || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif text-primary mb-1" data-testid="page-title-abandoned-carts">Abandoned Carts</h1>
        <p className="text-sm text-muted-foreground">Customers who entered their email at checkout but didn't complete the order. Reminder emails are sent automatically every hour.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { k: "all", label: "All", count: data?.carts?.length || 0 },
          { k: "pending", label: "Pending nudge", count: (data?.carts || []).filter((c) => !c.nudgeSentAt && !c.recovered).length },
          { k: "nudged", label: "Nudged", count: (data?.carts || []).filter((c) => !!c.nudgeSentAt && !c.recovered).length },
          { k: "recovered", label: "Recovered", count: (data?.carts || []).filter((c) => c.recovered).length },
        ].map((f) => (
          <button
            key={f.k}
            onClick={() => setFilter(f.k as any)}
            className={`p-3 rounded-md border text-left hover-elevate ${filter === f.k ? "border-primary bg-muted" : "border-border bg-card"}`}
            data-testid={`filter-${f.k}`}
          >
            <div className="text-[10px] uppercase tracking-wide text-secondary">{f.label}</div>
            <div className="text-2xl font-bold text-primary">{f.count}</div>
          </button>
        ))}
      </div>

      {filter !== "all" && carts.length > 0 && (
        <div className="text-sm text-muted-foreground">
          Total value at risk: <strong className="text-primary">₹{totalValue.toLocaleString("en-IN")}</strong>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-md" />)}</div>
      ) : carts.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">No abandoned carts in this view.</CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {carts.map((cart) => (
            <Card key={cart.id} className="bg-card border-border" data-testid={`abandoned-cart-${cart.id}`}>
              <CardContent className="py-4 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="font-medium text-foreground" data-testid={`cart-email-${cart.id}`}>{cart.email}</div>
                    <div className="text-xs text-secondary mt-0.5">
                      Updated {new Date(cart.updatedAt).toLocaleString()}
                      {cart.nudgeSentAt && <> · Nudged {new Date(cart.nudgeSentAt).toLocaleString()}</>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {cart.recovered ? (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">Recovered</span>
                    ) : cart.nudgeSentAt ? (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800">Nudged</span>
                    ) : (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800">Pending</span>
                    )}
                    <span className="text-base font-bold text-primary">₹{cart.cartTotal.toLocaleString("en-IN")}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {cart.items.map((it, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-muted border border-border rounded-md px-2 py-1 text-xs">
                      {it.image && <img src={it.image} alt="" className="w-6 h-6 object-cover rounded" />}
                      <span className="text-foreground">{it.name}</span>
                      <span className="text-secondary">× {it.quantity}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => nudgeMut.mutate(cart.id)}
                    disabled={nudgeMut.isPending || cart.recovered}
                    className="bg-primary text-white"
                    data-testid={`button-nudge-${cart.id}`}
                  >
                    {cart.nudgeSentAt ? "Send another reminder" : "Send reminder now"}
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="outline" data-testid={`button-delete-cart-${cart.id}`}>Remove</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove this abandoned cart?</AlertDialogTitle>
                        <AlertDialogDescription>This cart will no longer appear and no further reminders will be sent to {cart.email}.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteMut.mutate(cart.id)} className="bg-red-600 text-white">Remove</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default AbandonedCartsTab;

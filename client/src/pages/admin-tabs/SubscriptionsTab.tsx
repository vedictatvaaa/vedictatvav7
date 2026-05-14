
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { XCircle, Phone, Type, CalendarClock, Pause, Play, Download } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

import { Button } from "@/components/ui/button";

import { downloadCsv } from "@/lib/csvExport";

import { useToast } from "@/hooks/use-toast";
import type { Product, Subscription } from "@shared/schema";


const SUB_STATUS_COLORS: Record<string, string> = {
  active:    "bg-emerald-100 text-emerald-900",
  paused:    "bg-amber-100 text-amber-900",
  cancelled: "bg-red-100 text-red-900",
};

function SubscriptionsTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: subscriptions = [] } = useQuery<Subscription[]>({
    queryKey: ["/api/subscriptions"],
    queryFn: () => fetch("/api/subscriptions").then((r) => r.json()),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      fetch(`/api/subscriptions/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) }).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/subscriptions"] }); toast({ title: "Subscription updated" }); },
  });

  const activeSubs = subscriptions.filter(s => s.status === "active");
  const pausedSubs = subscriptions.filter(s => s.status === "paused");
  const cancelledSubs = subscriptions.filter(s => s.status === "cancelled");

  const exportCsv = () => {
    downloadCsv(
      `subscriptions-${new Date().toISOString().slice(0, 10)}.csv`,
      [
        { key: "id", label: "ID" },
        { key: "status", label: "Status" },
        { key: "productName", label: "Product" },
        { key: "quantity", label: "Qty" },
        { key: "frequency", label: "Frequency" },
        { key: "price", label: "Price (INR)" },
        { key: "customerName", label: "Customer" },
        { key: "customerEmail", label: "Email" },
        { key: "customerPhone", label: "Phone" },
        { key: "nextDelivery", label: "Next Delivery" },
        { key: "createdAt", label: "Created" },
      ],
      subscriptions.map((s) => ({
        ...s,
        nextDelivery: s.nextDelivery ? new Date(s.nextDelivery).toISOString() : "",
        createdAt: (s as any).createdAt ? new Date((s as any).createdAt).toISOString() : "",
      })),
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-serif text-primary" data-testid="text-subscriptions-title">Subscriptions</h2>
          <p className="text-sm text-muted-foreground">Manage recurring order subscriptions</p>
        </div>
        <Button variant="outline" size="sm" onClick={exportCsv} disabled={subscriptions.length === 0} data-testid="btn-export-subscriptions-csv">
          <Download className="h-4 w-4 mr-1" /> Export CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="py-4 text-center"><p className="text-2xl font-bold text-green-700">{activeSubs.length}</p><p className="text-sm text-muted-foreground">Active</p></CardContent></Card>
        <Card><CardContent className="py-4 text-center"><p className="text-2xl font-bold text-yellow-700">{pausedSubs.length}</p><p className="text-sm text-muted-foreground">Paused</p></CardContent></Card>
        <Card><CardContent className="py-4 text-center"><p className="text-2xl font-bold text-red-700">{cancelledSubs.length}</p><p className="text-sm text-muted-foreground">Cancelled</p></CardContent></Card>
      </div>

      <div className="space-y-3">
        {subscriptions.length === 0 && (
          <Card><CardContent className="py-12 text-center text-muted-foreground">No subscriptions yet.</CardContent></Card>
        )}
        {subscriptions.map((sub) => (
          <Card key={sub.id} data-testid={`admin-sub-card-${sub.id}`}>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <CalendarClock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-primary">{sub.productName}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${SUB_STATUS_COLORS[sub.status] || "bg-muted"}`}>{sub.status}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{sub.customerName} ({sub.customerEmail})</p>
                    <p className="text-xs text-muted-foreground/60">
                      Qty: {sub.quantity} | {sub.frequency} | ₹{sub.price}/delivery
                      {sub.nextDelivery && sub.status === "active" ? ` | Next: ${new Date(sub.nextDelivery).toLocaleDateString("en-IN")}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {sub.status === "active" && (
                    <Button variant="outline" size="sm" onClick={() => updateMut.mutate({ id: sub.id, status: "paused" })} className="text-yellow-700" data-testid={`btn-admin-pause-${sub.id}`}>
                      <Pause className="h-3 w-3 mr-1" /> Pause
                    </Button>
                  )}
                  {sub.status === "paused" && (
                    <Button variant="outline" size="sm" onClick={() => updateMut.mutate({ id: sub.id, status: "active" })} className="text-green-700" data-testid={`btn-admin-resume-${sub.id}`}>
                      <Play className="h-3 w-3 mr-1" /> Resume
                    </Button>
                  )}
                  {sub.status !== "cancelled" && (
                    <Button variant="outline" size="sm" onClick={() => updateMut.mutate({ id: sub.id, status: "cancelled" })} className="text-red-600" data-testid={`btn-admin-cancel-${sub.id}`}>
                      <XCircle className="h-3 w-3 mr-1" /> Cancel
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}


export default SubscriptionsTab;

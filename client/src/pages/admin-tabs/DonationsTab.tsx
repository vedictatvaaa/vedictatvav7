
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle, XCircle, Type } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Button } from "@/components/ui/button";

import { useToast } from "@/hooks/use-toast";
import type { Order, Donation, DonationOrder } from "@shared/schema";

import { createFetcher, STATUS_COLORS } from "../admin-shared";

function DonationsTab() {
  const adminToken = typeof window !== "undefined" ? localStorage.getItem("adminToken") || "" : "";
  const fetcher = createFetcher(adminToken);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: donations } = useQuery<Donation[]>({ queryKey: ["/api/donations"], queryFn: () => fetcher("/api/donations") });
  const { data: donationOrders } = useQuery<DonationOrder[]>({ queryKey: ["/api/donation-orders"], queryFn: () => fetcher("/api/donation-orders") });

  const toggleActiveMut = useMutation({
    mutationFn: (d: Donation) => fetch(`/api/donations/${d.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active: !d.active }) }).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/donations"] }); toast({ title: "Donation updated" }); },
  });

  const updateOrderStatusMut = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => fetch(`/api/donation-orders/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) }).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/donation-orders"] }); toast({ title: "Order status updated" }); },
  });

  const totalDonations = donationOrders?.reduce((s, o) => s + o.amount, 0) || 0;
  const pendingOrders = donationOrders?.filter(o => o.status === "pending").length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-serif text-primary" data-testid="text-donations-title">Donations Management</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="p-4 text-center">
          <p className="text-sm text-muted-foreground">Total Donation Types</p>
          <p className="text-2xl font-bold text-primary" data-testid="stat-donation-types">{donations?.length || 0}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-sm text-muted-foreground">Total Collected</p>
          <p className="text-2xl font-bold text-secondary" data-testid="stat-total-collected">₹{totalDonations.toLocaleString("en-IN")}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-sm text-muted-foreground">Pending Orders</p>
          <p className="text-2xl font-bold text-yellow-600" data-testid="stat-pending-donations">{pendingOrders}</p>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">Donation Types</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {donations?.map(d => (
              <div key={d.id} className="flex items-center justify-between p-3 bg-muted rounded-lg" data-testid={`donation-type-${d.id}`}>
                <div className="flex items-center gap-3">
                  <img src={d.image} alt={d.name} className="w-10 h-10 rounded-lg object-cover" />
                  <div>
                    <p className="font-medium text-primary">{d.name} {d.nameHindi && <span className="text-muted-foreground text-sm">({d.nameHindi})</span>}</p>
                    <p className="text-xs text-muted-foreground">{d.category} | Min: ₹{d.minAmount}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded ${d.active ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                    {d.active ? "Active" : "Inactive"}
                  </span>
                  <Button variant="outline" size="sm" onClick={() => toggleActiveMut.mutate(d)} data-testid={`btn-toggle-donation-${d.id}`}>
                    {d.active ? "Deactivate" : "Activate"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">Donation Orders</CardTitle></CardHeader>
        <CardContent>
          {!donationOrders?.length ? (
            <p className="text-muted-foreground text-sm py-4 text-center">No donation orders yet.</p>
          ) : (
            <div className="space-y-3">
              {donationOrders.map(order => (
                <div key={order.id} className="p-4 border rounded-lg" data-testid={`donation-order-${order.id}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{order.donorName} <span className="text-secondary font-bold">₹{order.amount.toLocaleString("en-IN")}</span></p>
                      <p className="text-sm text-muted-foreground">{order.donationName}</p>
                      <p className="text-xs text-muted-foreground">{order.donorEmail} {order.donorPhone && `| ${order.donorPhone}`}</p>
                      {order.gotra && <p className="text-xs text-muted-foreground">Gotra: {order.gotra}</p>}
                      {order.dedicatedTo && <p className="text-xs text-muted-foreground">Dedicated to: {order.dedicatedTo}</p>}
                      <p className="text-xs text-muted-foreground mt-1">{order.createdAt && new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded ${STATUS_COLORS[order.status] || "bg-muted text-foreground"}`}>{order.status}</span>
                      {order.status === "pending" && (
                        <>
                          <Button size="sm" variant="outline" className="text-green-700" onClick={() => updateOrderStatusMut.mutate({ id: order.id, status: "completed" })} data-testid={`btn-complete-donation-${order.id}`}>
                            <CheckCircle className="h-3 w-3 mr-1" /> Complete
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-600" onClick={() => updateOrderStatusMut.mutate({ id: order.id, status: "cancelled" })} data-testid={`btn-cancel-donation-${order.id}`}>
                            <XCircle className="h-3 w-3 mr-1" /> Cancel
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


export default DonationsTab;

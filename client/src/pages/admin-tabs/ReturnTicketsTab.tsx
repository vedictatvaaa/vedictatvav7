import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { IndianRupee, CheckCircle, XCircle, Phone, Clock, RotateCcw, Download } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

import { Button } from "@/components/ui/button";

import { downloadCsv } from "@/lib/csvExport";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import type { Product, Order, ReturnTicket } from "@shared/schema";

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";


// ============================================================
// Return Tickets Tab
// ============================================================
const RETURN_STATUS_COLORS: Record<string, string> = {
  pending:    "bg-amber-100 text-amber-900",
  processing: "bg-primary/15 text-primary",
  approved:   "bg-emerald-100 text-emerald-900",
  rejected:   "bg-red-100 text-red-900",
  refunded:   "bg-muted text-muted-foreground",
};

const RETURN_STATUSES = ["pending", "processing", "approved", "rejected", "refunded"];

function ReturnTicketsTab({ adminToken }: { adminToken?: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: returnTicketsRaw } = useQuery<ReturnTicket[] | { message?: string }>({
    queryKey: ["/api/return-tickets"],
    queryFn: () => fetch("/api/return-tickets", { headers: { "x-admin-token": adminToken || "" } }).then((r) => r.json()),
  });
  const returnTickets: ReturnTicket[] = Array.isArray(returnTicketsRaw) ? returnTicketsRaw : [];
  const updateReturnTicketMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      fetch(`/api/return-tickets/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json", "x-admin-token": adminToken || "" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/return-tickets"] }); toast({ title: "Return ticket updated" }); },
  });
  const refundReturnTicketMut = useMutation({
    mutationFn: async ({ id, amount, notes }: { id: number; amount: number; notes?: string }) => {
      const res = await fetch(`/api/admin/return-tickets/${id}/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-token": adminToken || "" },
        body: JSON.stringify({ amount, notes }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Refund failed");
      return json;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/return-tickets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      toast({ title: "Refund Processed", description: `Razorpay refund ${data?.refund?.id || ""} issued.` });
    },
    onError: (err: any) => toast({ title: "Refund Failed", description: err?.message || "Could not process refund", variant: "destructive" }),
  });

  const [editState, setEditState] = useState<Record<number, { status: string; adminNotes: string }>>({});
  const [refundAmounts, setRefundAmounts] = useState<Record<number, string>>({});
  const [refundNotes, setRefundNotes] = useState<Record<number, string>>({});
  const [orderTotals, setOrderTotals] = useState<Record<number, number>>({});

  const ensureOrderTotal = async (orderId: number) => {
    if (orderTotals[orderId] !== undefined) return orderTotals[orderId];
    try {
      const res = await fetch(`/api/orders/${orderId}`, { headers: { "x-admin-token": adminToken || "" } });
      if (!res.ok) return null;
      const data = await res.json();
      setOrderTotals((prev) => ({ ...prev, [orderId]: data.totalAmount }));
      return data.totalAmount as number;
    } catch { return null; }
  };

  const getEditState = (ticket: ReturnTicket) => {
    return editState[ticket.id] || { status: ticket.status, adminNotes: ticket.adminNotes || "" };
  };

  const setTicketEdit = (id: number, field: string, value: string) => {
    setEditState((prev) => ({
      ...prev,
      [id]: { ...((prev[id]) || { status: "", adminNotes: "" }), [field]: value },
    }));
  };

  const totalTickets = returnTickets.length;
  const pendingCount = returnTickets.filter(t => t.status === "pending").length;
  const approvedCount = returnTickets.filter(t => t.status === "approved").length;
  const rejectedCount = returnTickets.filter(t => t.status === "rejected").length;

  return (
    <div className="space-y-6" data-testid="returns-tab">
      <div>
        <h1 className="text-3xl font-serif text-primary" data-testid="page-title-returns">Return Tickets</h1>
        <p className="text-sm text-muted-foreground">Manage product return requests</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" data-testid="returns-summary-stats">
        {[
          { label: "Total Tickets", value: totalTickets, icon: RotateCcw, color: "text-blue-600 bg-blue-50", border: "border-blue-200" },
          { label: "Pending", value: pendingCount, icon: Clock, color: "text-yellow-600 bg-yellow-50", border: "border-yellow-200" },
          { label: "Approved", value: approvedCount, icon: CheckCircle, color: "text-emerald-600 bg-emerald-50", border: "border-emerald-200" },
          { label: "Rejected", value: rejectedCount, icon: XCircle, color: "text-red-600 bg-red-50", border: "border-red-200" },
        ].map((stat, i) => (
          <Card key={i} className={`bg-card border ${stat.border}`} data-testid={`return-stat-${i}`}>
            <CardContent className="pt-5 pb-4 flex items-center gap-4">
              <div className={`p-3 rounded-xl ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-secondary uppercase tracking-wide">{stat.label}</p>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-card border-border" data-testid="card-return-tickets-list">
        <CardHeader className="flex flex-row items-start justify-between gap-3 flex-wrap">
          <div>
            <CardTitle className="text-lg text-primary font-serif">All Return Tickets</CardTitle>
            <CardDescription className="text-muted-foreground">{totalTickets} total return requests</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={returnTickets.length === 0}
            onClick={() =>
              downloadCsv(
                `return-tickets-${new Date().toISOString().slice(0, 10)}.csv`,
                [
                  { key: "id", label: "Ticket ID" },
                  { key: "orderId", label: "Order ID" },
                  { key: "status", label: "Status" },
                  { key: "customerName", label: "Customer" },
                  { key: "customerEmail", label: "Email" },
                  { key: "customerPhone", label: "Phone" },
                  { key: "productName", label: "Product" },
                  { key: "reason", label: "Reason" },
                  { key: "description", label: "Description" },
                  { key: "refundAmount", label: "Refund (INR)" },
                  { key: "refundId", label: "Refund ID" },
                  { key: "createdAt", label: "Submitted" },
                ],
                returnTickets.map((t) => ({
                  ...t,
                  createdAt: t.createdAt ? new Date(t.createdAt).toISOString() : "",
                })),
              )
            }
            data-testid="btn-export-returns-csv"
          >
            <Download className="h-4 w-4 mr-1" /> Export CSV
          </Button>
        </CardHeader>
        <CardContent>
          {returnTickets.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center" data-testid="text-no-return-tickets">No return tickets yet</p>
          ) : (
            <div className="space-y-4">
              {returnTickets.map((ticket) => {
                const edit = getEditState(ticket);
                return (
                  <Card key={ticket.id} className="bg-muted border border-border" data-testid={`card-return-ticket-${ticket.id}`}>
                    <CardContent className="py-4 space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                            RT-{ticket.id}
                          </div>
                          <div className="min-w-0 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-semibold text-foreground" data-testid={`text-return-ticket-id-${ticket.id}`}>#RT-{ticket.id}</span>
                              <span className="text-xs text-secondary" data-testid={`text-return-order-id-${ticket.id}`}>Order #{ticket.orderId}</span>
                              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${RETURN_STATUS_COLORS[ticket.status] || "bg-muted text-foreground"}`} data-testid={`badge-return-status-${ticket.id}`}>
                                {ticket.status}
                              </span>
                            </div>
                            <p className="text-sm text-foreground" data-testid={`text-return-customer-${ticket.id}`}>
                              {ticket.customerName} · <span className="text-muted-foreground">{ticket.customerEmail}</span>
                              {ticket.customerPhone && <span className="text-muted-foreground"> · {ticket.customerPhone}</span>}
                            </p>
                            <p className="text-sm text-muted-foreground" data-testid={`text-return-product-${ticket.id}`}>
                              Product: <span className="font-medium text-foreground">{ticket.productName}</span>
                            </p>
                            <p className="text-sm text-muted-foreground" data-testid={`text-return-reason-${ticket.id}`}>
                              Reason: <span className="font-medium text-foreground">{ticket.reason}</span>
                            </p>
                            {ticket.description && (
                              <p className="text-sm text-muted-foreground" data-testid={`text-return-description-${ticket.id}`}>
                                {ticket.description}
                              </p>
                            )}
                            {ticket.createdAt && (
                              <p className="text-xs text-secondary" data-testid={`text-return-date-${ticket.id}`}>
                                Submitted: {new Date(ticket.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                              </p>
                            )}
                            {ticket.refundId && (
                              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs bg-emerald-50 border border-emerald-200 px-2 py-1 rounded" data-testid={`text-refund-info-${ticket.id}`}>
                                <CheckCircle className="w-3 h-3 text-emerald-600" />
                                <span className="text-emerald-800 font-medium">Refunded ₹{ticket.refundAmount?.toLocaleString()}</span>
                                <span className="text-emerald-600">via Razorpay</span>
                                <span className="text-emerald-500 font-mono">{ticket.refundId}</span>
                                {ticket.refundedAt && <span className="text-emerald-500">· {new Date(ticket.refundedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-end gap-3 flex-wrap pt-2 border-t border-border">
                        <div className="flex-1 min-w-[200px] space-y-1">
                          <Label className="text-xs">Admin Notes</Label>
                          <Input
                            value={edit.adminNotes}
                            onChange={(e) => setTicketEdit(ticket.id, "adminNotes", e.target.value)}
                            placeholder="Add notes..."
                            className="h-8 text-sm"
                            data-testid={`input-return-admin-notes-${ticket.id}`}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Status</Label>
                          <Select value={edit.status} onValueChange={(val) => setTicketEdit(ticket.id, "status", val)}>
                            <SelectTrigger className="w-[140px] h-8 text-xs" data-testid={`select-return-status-${ticket.id}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {RETURN_STATUSES.map((s) => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <Button
                          size="sm"
                          className="bg-primary text-white h-8 text-xs"
                          disabled={updateReturnTicketMut.isPending}
                          onClick={() => updateReturnTicketMut.mutate({ id: ticket.id, data: { status: edit.status, adminNotes: edit.adminNotes } })}
                          data-testid={`btn-update-return-${ticket.id}`}
                        >
                          Update
                        </Button>
                        {!ticket.refundId && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-xs border-emerald-300 text-emerald-700 hover:text-emerald-800"
                                onClick={() => ensureOrderTotal(ticket.orderId)}
                                data-testid={`btn-refund-return-${ticket.id}`}
                              >
                                <IndianRupee className="w-3 h-3 mr-1" /> Process Refund
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent data-testid={`dialog-refund-${ticket.id}`}>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Process Razorpay Refund</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Refund customer <strong>{ticket.customerName}</strong> for return ticket #RT-{ticket.id} (Order #{ticket.orderId}).
                                  {orderTotals[ticket.orderId] !== undefined && (
                                    <span className="block mt-1">Order total: <strong>₹{orderTotals[ticket.orderId].toLocaleString()}</strong></span>
                                  )}
                                  This will issue a real refund through Razorpay and cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <div className="space-y-3 py-2">
                                <div className="space-y-1">
                                  <Label className="text-xs">Refund Amount (₹)</Label>
                                  <Input
                                    type="number"
                                    min={1}
                                    max={orderTotals[ticket.orderId]}
                                    placeholder={orderTotals[ticket.orderId] ? `Max ₹${orderTotals[ticket.orderId]}` : "Loading..."}
                                    value={refundAmounts[ticket.id] ?? (orderTotals[ticket.orderId]?.toString() || "")}
                                    onChange={(e) => setRefundAmounts((prev) => ({ ...prev, [ticket.id]: e.target.value }))}
                                    data-testid={`input-refund-amount-${ticket.id}`}
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs">Notes (optional)</Label>
                                  <Input
                                    placeholder="Internal note for this refund"
                                    value={refundNotes[ticket.id] || ""}
                                    onChange={(e) => setRefundNotes((prev) => ({ ...prev, [ticket.id]: e.target.value }))}
                                    data-testid={`input-refund-notes-${ticket.id}`}
                                  />
                                </div>
                              </div>
                              <AlertDialogFooter>
                                <AlertDialogCancel data-testid={`btn-refund-cancel-${ticket.id}`}>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                  disabled={refundReturnTicketMut.isPending}
                                  onClick={() => {
                                    const raw = refundAmounts[ticket.id];
                                    const amount = raw ? parseInt(raw, 10) : (orderTotals[ticket.orderId] || 0);
                                    if (!amount || amount <= 0) return;
                                    refundReturnTicketMut.mutate({ id: ticket.id, amount, notes: refundNotes[ticket.id] });
                                  }}
                                  data-testid={`btn-refund-confirm-${ticket.id}`}
                                >
                                  {refundReturnTicketMut.isPending ? "Processing..." : "Confirm Refund"}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


export default ReturnTicketsTab;

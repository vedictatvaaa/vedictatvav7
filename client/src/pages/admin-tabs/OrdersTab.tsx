import { useState, useEffect, useMemo, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, CheckCircle, Type, Tag, RefreshCw, FileText, Download, Truck, Printer, MapPin, Send, Ban, AlertCircle, Clock, IndianRupee, Package, ChevronDown } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";

import { Card, CardContent } from "@/components/ui/card";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

import { Button } from "@/components/ui/button";

import { Skeleton } from "@/components/ui/skeleton";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { Order } from "@shared/schema";

import { createFetcher, STATUS_COLORS } from "../admin-shared";
import { OrderKpiGrid, type OperationalSummary } from "@/components/admin/orders/OrderKpiGrid";
import { ActionRequired, type RequiredAction } from "@/components/admin/orders/ActionRequired";
import { OrderStatusBadge } from "@/components/admin/orders/OrderStatusBadge";
import { OrderWorkspace } from "@/components/admin/orders/OrderWorkspace";

// Relative-time helper. Used for "2h ago" / "3d ago" badges.
function relTime(d: Date | string | null | undefined): string {
  if (!d) return "";
  const t = (d instanceof Date ? d : new Date(d)).getTime();
  if (!Number.isFinite(t)) return "";
  const diff = Date.now() - t;
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  const days = Math.floor(diff / 86_400_000);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

interface OrderSummary {
  counts: Record<string, number>;
  todayCount: number;
  todayRevenue: number;
  awaitingDispatch: number;
  stalePending: number;
  generatedAt: number;
  operational?: OperationalSummary & { actionRequired?: RequiredAction[] };
}
type OperationalOrder = Order & { operational?: any };

const STATUS_PILLS: { value: string; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "confirmed", label: "Confirmed" },
  { value: "packed", label: "Packed" },
  { value: "dispatched", label: "Dispatched" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
  { value: "refunded", label: "Refunded" },
];

// ============================================================
// Orders Tab
// ============================================================
function OrdersTab() {
  const adminToken = typeof window !== "undefined" ? localStorage.getItem("adminToken") || "" : "";
  const fetcher = createFetcher(adminToken);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const initialParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const [statusFilter, setStatusFilter] = useState(() => initialParams.get("status") || "all");
  const [searchInput, setSearchInput] = useState(() => initialParams.get("search") || "");
  const [searchQuery, setSearchQuery] = useState(() => initialParams.get("search") || "");
  const [page, setPage] = useState(() => Math.max(1, Number(initialParams.get("page")) || 1));
  const [limit] = useState(25);
  const [selectedOrders, setSelectedOrders] = useState<number[]>([]);
  const [dispatchOpen, setDispatchOpen] = useState<number | null>(null);
  const [courierName, setCourierName] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [waybill, setWaybill] = useState("");
  const [bulkCourier, setBulkCourier] = useState("");
  const [bulkPrefix, setBulkPrefix] = useState("");
  const [operationalView, setOperationalView] = useState(() => initialParams.get("view") || "");
  const [paymentMethod, setPaymentMethod] = useState(() => initialParams.get("paymentMethod") || "");
  const [startDate, setStartDate] = useState(() => initialParams.get("startDate") || "");
  const [endDate, setEndDate] = useState(() => initialParams.get("endDate") || "");
  const hasMountedFilters = useRef(false);
  const [workspaceOrderId, setWorkspaceOrderId] = useState<number | null>(null);

  useEffect(() => {
    if (!hasMountedFilters.current) { hasMountedFilters.current = true; return; }
    setPage(1);
    setSelectedOrders([]);
  }, [statusFilter, searchQuery, operationalView, paymentMethod, startDate, endDate]);
  useEffect(() => {
    const params = new URLSearchParams();
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (operationalView) params.set("view", operationalView);
    if (paymentMethod) params.set("paymentMethod", paymentMethod);
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    if (searchQuery) params.set("search", searchQuery);
    if (page > 1) params.set("page", String(page));
    window.history.replaceState(null, "", `${window.location.pathname}${params.size ? `?${params}` : ""}`);
  }, [statusFilter, operationalView, paymentMethod, startDate, endDate, searchQuery, page]);

  const ordersUrl = `/api/admin/orders?page=${page}&limit=${limit}${statusFilter !== "all" ? `&status=${encodeURIComponent(statusFilter)}` : ""}${searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ""}${operationalView ? `&view=${encodeURIComponent(operationalView)}` : ""}${paymentMethod ? `&paymentMethod=${encodeURIComponent(paymentMethod)}` : ""}${startDate ? `&startDate=${encodeURIComponent(startDate)}` : ""}${endDate ? `&endDate=${encodeURIComponent(endDate)}` : ""}`;

  const { data: ordersData, isLoading } = useQuery<{ orders: OperationalOrder[]; total: number; page: number; limit: number; totalPages: number }>({
    queryKey: ["/api/admin/orders", { page, limit, status: statusFilter, search: searchQuery, view: operationalView, paymentMethod, startDate, endDate }],
    queryFn: () => fetcher(ordersUrl),
  });

  const { data: allDispatches } = useQuery<any[]>({
    queryKey: ["/api/dispatches"],
    queryFn: () => fetcher("/api/dispatches"),
  });

  const { data: summary } = useQuery<OrderSummary>({
    queryKey: ["/api/admin/orders/summary"],
    queryFn: () => fetcher("/api/admin/orders/summary"),
    refetchInterval: 30_000,
  });

  const filtered = ordersData?.orders || [];
  const totalOrders = ordersData?.total || 0;
  const totalPages = ordersData?.totalPages || 1;

  const selectionTotal = useMemo(() => {
    if (selectedOrders.length === 0) return 0;
    const set = new Set(selectedOrders);
    return filtered.reduce((sum, o) => set.has(o.id) ? sum + (o.totalAmount || 0) : sum, 0);
  }, [selectedOrders, filtered]);

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...(adminToken ? { "x-admin-token": adminToken } : {}) },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (!res.ok) throw Object.assign(new Error(json?.message || "Update failed"), { detail: json });
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders/summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({ title: "Order Updated", description: "Order status updated. Invoice auto-generated if applicable." });
    },
    onError: (error: any) => {
      const detail = error?.detail;
      const allowed = detail?.allowedTransitions?.length ? ` Allowed next states: ${detail.allowedTransitions.join(", ")}.` : "";
      toast({ title: "Status change unavailable", description: `${error?.message || "Failed to update order."}${allowed}`, variant: "destructive" });
    },
  });

  const createDispatchMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/dispatches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Dispatch failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dispatches"] });
      setDispatchOpen(null);
      setCourierName(""); setTrackingNumber(""); setWaybill("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders/summary"] });
      toast({ title: "Dispatched", description: "Order has been dispatched." });
    },
  });

  const bulkDispatchMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/bulk-dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderIds: selectedOrders, courierName: bulkCourier, trackingPrefix: bulkPrefix }),
      });
      if (!res.ok) throw new Error("Bulk dispatch failed");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dispatches"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders/summary"] });
      setSelectedOrders([]);
      toast({ title: "Bulk Dispatch", description: `${data.dispatched} orders dispatched.` });
    },
  });

  const { data: shiprocketStatus } = useQuery<{ configured: boolean; pickupLocation: string }>({
    queryKey: ["/api/admin/shiprocket/status"],
    queryFn: () => fetcher("/api/admin/shiprocket/status"),
  });
  const srConfigured = !!shiprocketStatus?.configured;

  const srAction = async (path: string, body?: any) => {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-token": adminToken || "" },
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.message || "Shiprocket action failed");
    return json;
  };

  const shipMutation = useMutation({
    mutationFn: (orderId: number) => srAction(`/api/admin/shiprocket/create/${orderId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dispatches"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      toast({ title: "Shipment Created", description: "Shiprocket order created successfully." });
    },
    onError: (e: any) => toast({ title: "Shiprocket", description: e.message, variant: "destructive" }),
  });

  const assignAwbMutation = useMutation({
    mutationFn: (dispatchId: number) => srAction(`/api/admin/shiprocket/assign-awb/${dispatchId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dispatches"] });
      toast({ title: "AWB Assigned", description: "Courier and AWB assigned." });
    },
    onError: (e: any) => toast({ title: "Shiprocket", description: e.message, variant: "destructive" }),
  });

  const pickupMutation = useMutation({
    mutationFn: (dispatchId: number) => srAction(`/api/admin/shiprocket/pickup`, { dispatchIds: [dispatchId] }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dispatches"] });
      toast({ title: "Pickup Scheduled", description: "Courier pickup has been scheduled." });
    },
    onError: (e: any) => toast({ title: "Shiprocket", description: e.message, variant: "destructive" }),
  });

  const trackMutation = useMutation({
    mutationFn: async (dispatchId: number) => {
      const res = await fetch(`/api/admin/shiprocket/track/${dispatchId}`, {
        headers: { "x-admin-token": adminToken || "" },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Tracking failed");
      return json;
    },
    onSuccess: (data: any) => {
      const td = data?.tracking_data;
      const status = td?.shipment_track?.[0]?.current_status || td?.track_status || "Unknown";
      toast({ title: "Tracking", description: `Current status: ${status}` });
      queryClient.invalidateQueries({ queryKey: ["/api/dispatches"] });
    },
    onError: (e: any) => toast({ title: "Tracking", description: e.message, variant: "destructive" }),
  });

  const labelMutation = useMutation({
    mutationFn: (dispatchId: number) => srAction(`/api/admin/shiprocket/label/${dispatchId}`),
    onSuccess: (data: any) => {
      if (data?.label_url) window.open(data.label_url, "_blank");
      queryClient.invalidateQueries({ queryKey: ["/api/dispatches"] });
      toast({ title: "Label", description: "Label generated." });
    },
    onError: (e: any) => toast({ title: "Shiprocket", description: e.message, variant: "destructive" }),
  });

  const cancelShipmentMutation = useMutation({
    mutationFn: (dispatchId: number) => srAction(`/api/admin/shiprocket/cancel/${dispatchId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dispatches"] });
      toast({ title: "Cancelled", description: "Shiprocket shipment cancelled." });
    },
    onError: (e: any) => toast({ title: "Shiprocket", description: e.message, variant: "destructive" }),
  });

  const bulkInvoiceMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/bulk-invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderIds: selectedOrders }),
      });
      if (!res.ok) throw new Error("Bulk invoice failed");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({ title: "Bulk Invoices", description: `${data.generated} invoices generated.` });
    },
  });

  const toggleSelectOrder = (id: number) => {
    setSelectedOrders((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const allCurrentPageSelected = filtered.length > 0 && filtered.every((o) => selectedOrders.includes(o.id));
  const selectAll = () => {
    if (allCurrentPageSelected) {
      const pageIds = new Set(filtered.map((o) => o.id));
      setSelectedOrders((prev) => prev.filter((id) => !pageIds.has(id)));
    } else {
      setSelectedOrders((prev) => Array.from(new Set([...prev, ...filtered.map((o) => o.id)])));
    }
  };

  const getDispatchForOrder = (orderId: number) => (allDispatches || []).find((d: any) => d.orderId === orderId);

  const downloadInvoice = async (orderId: number) => {
    try {
      const res = await fetch(`/api/invoices/order/${orderId}/download`);
      if (res.status === 404) {
        await fetch(`/api/invoices/generate/${orderId}`, { method: "POST" });
        const res2 = await fetch(`/api/invoices/order/${orderId}/download`);
        if (!res2.ok) { toast({ title: "Invoice not available yet", variant: "destructive" }); return; }
        const blob = await res2.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a"); a.href = url; a.download = `Invoice-Order-${orderId}.pdf`; a.click();
      } else {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a"); a.href = url; a.download = `Invoice-Order-${orderId}.pdf`; a.click();
      }
    } catch { toast({ title: "Failed to download invoice", variant: "destructive" }); }
  };

  const downloadLabel = async (orderId: number) => {
    try {
      const res = await fetch(`/api/admin/dispatch-label/${orderId}`, {
        method: "POST",
        headers: { "x-admin-token": adminToken || "" },
      });
      if (!res.ok) {
        const msg = res.status === 401 ? "Admin session expired — please re-login" : "Failed to generate label";
        toast({ title: msg, variant: "destructive" });
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = `Label-Order-${orderId}.pdf`; a.click();
    } catch { toast({ title: "Failed to download label", variant: "destructive" }); }
  };

  const downloadPackingSlip = async (orderId: number) => {
    try {
      const res = await fetch(`/api/admin/packing-slip/${orderId}`, {
        method: "POST",
        headers: { "x-admin-token": adminToken || "" },
      });
      if (!res.ok) {
        const msg = res.status === 401 ? "Admin session expired — please re-login" : "Failed to generate packing slip";
        toast({ title: msg, variant: "destructive" });
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = `PackingSlip-Order-${orderId}.pdf`; a.click();
    } catch { toast({ title: "Failed to download packing slip", variant: "destructive" }); }
  };

  const downloadBulkPackingSlips = async () => {
    try {
      const res = await fetch("/api/admin/bulk-packing-slips", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-token": adminToken || "" },
        body: JSON.stringify({ orderIds: selectedOrders }),
      });
      if (!res.ok) {
        const msg = res.status === 401 ? "Admin session expired — please re-login" : "Failed to generate packing slips";
        toast({ title: msg, variant: "destructive" });
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = `Packing-Slips-${selectedOrders.length}-orders.pdf`; a.click();
      toast({ title: "Packing Slips Downloaded", description: `${selectedOrders.length} packing slips generated.` });
    } catch { toast({ title: "Failed to download packing slips", variant: "destructive" }); }
  };

  const downloadBulkLabels = async () => {
    try {
      const res = await fetch("/api/admin/bulk-labels", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-token": adminToken || "" },
        body: JSON.stringify({ orderIds: selectedOrders }),
      });
      if (!res.ok) {
        const msg = res.status === 401 ? "Admin session expired — please re-login" : "Failed to generate labels";
        toast({ title: msg, variant: "destructive" });
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = `Dispatch-Labels-${selectedOrders.length}-orders.pdf`; a.click();
      toast({ title: "Labels Downloaded", description: `${selectedOrders.length} dispatch labels generated.` });
    } catch { toast({ title: "Failed to download labels", variant: "destructive" }); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-serif text-primary" data-testid="page-title-orders">Orders</h1>
          <p className="text-sm text-muted-foreground">Manage orders, invoices, and dispatch</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => window.open("/api/admin/export/sales-csv")} data-testid="button-export-sales">
            <Download className="w-3 h-3 mr-1" /> Export Sales
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.open("/api/admin/export/gst-report")} data-testid="button-export-gst">
            <FileText className="w-3 h-3 mr-1" /> GST Report
          </Button>
        </div>
      </div>

      <OrderKpiGrid operational={summary?.operational} />
      <ActionRequired actions={summary?.operational?.actionRequired} onSelect={(filter) => {
        setStatusFilter(filter.status || "all");
        setOperationalView(filter.view || "");
        setPaymentMethod("");
        setStartDate("");
        setEndDate("");
        setSearchInput("");
        setSearchQuery("");
      }} />

      {/* Status pills */}
      <div className="flex flex-wrap gap-2">
        {STATUS_PILLS.map((pill) => {
          const count = pill.value === "all"
            ? (summary?.counts?.all ?? 0)
            : (summary?.counts?.[pill.value] ?? 0);
          const active = statusFilter === pill.value;
          return (
            <Button
              key={pill.value}
              size="sm"
              variant={active ? "default" : "outline"}
              onClick={() => setStatusFilter(pill.value)}
              data-testid={`pill-status-${pill.value}`}
              className="gap-2"
            >
              {pill.label}
              {summary && (
                <span className={`text-[10px] font-semibold rounded px-1.5 py-0.5 ${active ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-foreground"}`}>
                  {count}
                </span>
              )}
            </Button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <form
          onSubmit={(e) => { e.preventDefault(); setSearchQuery(searchInput.trim()); }}
            className="flex w-full flex-wrap gap-2 items-center sm:w-auto"
        >
          <Input
            placeholder="Search by name, email, or order #"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full sm:w-64"
            data-testid="input-orders-search"
          />
          <Button type="submit" size="sm" variant="outline" data-testid="button-orders-search">Search</Button>
          {searchQuery && (
            <Button type="button" size="sm" variant="ghost" onClick={() => { setSearchInput(""); setSearchQuery(""); }} data-testid="button-orders-search-clear">Clear</Button>
          )}
        </form>
        <Input
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
          placeholder="Payment method (e.g. COD)"
          className="w-full sm:w-48"
          aria-label="Filter by payment method"
        />
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <Label className="text-xs text-muted-foreground">Placed</Label>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-[145px]" aria-label="Orders placed from date" />
          <span className="text-xs text-muted-foreground">to</span>
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-[145px]" aria-label="Orders placed to date" />
          {(paymentMethod || startDate || endDate || operationalView) ? <Button size="sm" variant="ghost" onClick={() => { setPaymentMethod(""); setStartDate(""); setEndDate(""); setOperationalView(""); }}>Reset filters</Button> : null}
        </div>

        <span className="text-xs text-muted-foreground ml-2" data-testid="text-orders-total">
          {totalOrders} order{totalOrders === 1 ? "" : "s"}
        </span>

        {selectedOrders.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center ml-auto">
            <span className="text-sm text-foreground font-medium">
              {selectedOrders.length} selected
              {selectionTotal > 0 && (
                <span className="text-muted-foreground font-normal"> · ₹{selectionTotal.toLocaleString()}</span>
              )}
            </span>
            <Button size="sm" variant="outline" onClick={() => bulkInvoiceMutation.mutate()} data-testid="button-bulk-invoices">
              <FileText className="w-3 h-3 mr-1" /> Bulk Invoices
            </Button>
            <Button size="sm" variant="outline" onClick={downloadBulkLabels} data-testid="button-bulk-labels">
              <Printer className="w-3 h-3 mr-1" /> Bulk Labels
            </Button>
            <Button size="sm" variant="outline" onClick={downloadBulkPackingSlips} data-testid="button-bulk-packing-slips">
              <Package className="w-3 h-3 mr-1" /> Bulk Slips
            </Button>
            <div className="flex gap-1 items-center">
              <Input placeholder="Courier" value={bulkCourier} onChange={(e) => setBulkCourier(e.target.value)} className="w-28 h-8 text-xs" />
              <Input placeholder="TRK Prefix" value={bulkPrefix} onChange={(e) => setBulkPrefix(e.target.value)} className="w-24 h-8 text-xs" />
              <Button size="sm" onClick={() => bulkDispatchMutation.mutate()} data-testid="button-bulk-dispatch">
                <Truck className="w-3 h-3 mr-1" /> Bulk Dispatch
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 mb-2">
        <input type="checkbox" checked={allCurrentPageSelected} onChange={selectAll} className="accent-primary" data-testid="checkbox-select-all-orders" />
        <span className="text-xs text-muted-foreground">Select All</span>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => {
            const dispatch = getDispatchForOrder(order.id);
            const isStalePending = order.operational?.ageing?.stale && !["DELIVERED", "CANCELLED", "REFUNDED", "RETURNED", "FAILED"].includes(order.operational?.canonicalStatus);
            const counts = order.operational?.counts;
            const nextAction = order.operational?.nextAction;
            return (
              <Card key={order.id} role="button" tabIndex={0} onClick={(e) => { if (!(e.target as HTMLElement).closest("button,input,[role=menuitem]")) setWorkspaceOrderId(order.id); }} onKeyDown={(e) => { if (e.key === "Enter") setWorkspaceOrderId(order.id); }} className={`cursor-pointer border-[#d4af37]/25 transition-colors hover:border-[#b38a24] ${isStalePending ? "bg-red-50/40" : "bg-[#fffdf8]"}`} data-testid={`card-order-${order.id}`}>
                <CardContent className="py-4">
                  <div className="flex flex-col items-stretch justify-between gap-4 sm:flex-row sm:items-start">
                    <div className="flex min-w-0 items-start gap-3">
                      <input type="checkbox" onClick={(e) => e.stopPropagation()} checked={selectedOrders.includes(order.id)} onChange={() => toggleSelectOrder(order.id)} className="accent-primary mt-3" data-testid={`checkbox-order-${order.id}`} />
                      <div className="relative w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                        #{order.id}
                        {isStalePending && (
                          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-background animate-pulse" title="Pending over 24h" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-foreground">{order.customerName || "Guest Customer"}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {order.customerEmail && <span>{order.customerEmail}</span>}
                          {order.customerPhone && <span>· {order.customerPhone}</span>}
                        </div>
                        {order.createdAt && (
                          <p className="text-xs text-secondary mt-0.5 flex items-center gap-1.5">
                            <Clock className="w-3 h-3 opacity-60" />
                            <span>{relTime(order.createdAt)}</span>
                            <span className="opacity-50">· {new Date(order.createdAt).toLocaleDateString()}</span>
                          </p>
                        )}
                        <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
                          <span className="rounded bg-[#f4ead3] px-1.5 py-0.5 text-[#6d2b35]">{counts?.itemCount ?? 0} lines · {counts?.unitCount ?? 0} units</span>
                          <span className="rounded bg-[#f4ead3] px-1.5 py-0.5 capitalize text-[#6d2b35]">{order.operational?.payment?.method || "Payment not recorded"} · {order.operational?.payment?.status || "Payment state unknown"}</span>
                          <span className={`rounded px-1.5 py-0.5 capitalize ${order.operational?.inventoryStatus === "shortage" ? "bg-red-100 text-red-800" : "bg-[#edf3e6] text-[#496238]"}`}>Inventory: {order.operational?.inventoryStatus?.replaceAll("_", " ") || "unable to verify"}</span>
                          {isStalePending && <span className="rounded bg-red-100 px-1.5 py-0.5 text-red-800">Ageing {Math.floor(order.operational?.ageing?.ageHours || 0)}h</span>}
                        </div>
                        {dispatch && (
                          <div className="mt-2 flex items-center gap-2 text-xs bg-indigo-50 px-2 py-1 rounded">
                            <Truck className="w-3 h-3 text-indigo-600" />
                            <span className="text-indigo-700">{dispatch.courierName}</span>
                            <span className="text-indigo-500">#{dispatch.trackingNumber}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex min-w-0 flex-col items-start gap-2 sm:items-end">
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="font-bold text-lg text-foreground">₹{order.totalAmount.toLocaleString()}</p>
                        <OrderStatusBadge status={order.status} />
                      </div>
                      <div className="flex max-w-full flex-wrap items-center gap-2 sm:justify-end">
                        <Select value={order.status} onValueChange={(val) => updateStatusMutation.mutate({ id: order.id, status: val })}>
                          <SelectTrigger className="w-[130px] h-8 text-xs" data-testid={`select-order-status-${order.id}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={order.status}>{order.status}</SelectItem>
                            {(order.operational?.allowedTransitions || []).map((status: string) => <SelectItem key={status} value={status.toLowerCase()}>{status.replaceAll("_", " ")}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        {nextAction?.available && <Button size="sm" onClick={(e) => { e.stopPropagation(); updateStatusMutation.mutate({ id: order.id, status: nextAction.targetStatus }); }} className="bg-[#6d2b35] text-xs text-[#f7d66d] hover:bg-[#541f28]">{nextAction.action}</Button>}

                        {/* Documents dropdown — collapses Invoice / Label / Slip into one trigger */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="outline" data-testid={`button-docs-menu-${order.id}`}>
                              <FileText className="w-3 h-3 mr-1" /> Docs
                              <ChevronDown className="w-3 h-3 ml-1 opacity-60" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuLabel className="text-xs">Print / Download</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => downloadInvoice(order.id)} data-testid={`menu-download-invoice-${order.id}`}>
                              <Download className="w-3.5 h-3.5 mr-2" /> Invoice (GST)
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => downloadLabel(order.id)} data-testid={`menu-print-label-${order.id}`}>
                              <Printer className="w-3.5 h-3.5 mr-2" /> Shipping Label
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => downloadPackingSlip(order.id)} data-testid={`menu-packing-slip-${order.id}`}>
                              <Package className="w-3.5 h-3.5 mr-2" /> Packing Slip
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>

                        {!dispatch && (
                          <Button size="sm" variant="outline" onClick={() => setDispatchOpen(dispatchOpen === order.id ? null : order.id)} data-testid={`button-dispatch-${order.id}`}>
                            <Truck className="w-3 h-3 mr-1" /> Dispatch
                          </Button>
                        )}

                        {/* Shiprocket dropdown — only shows context-relevant actions */}
                        {(srConfigured || dispatch?.shiprocketShipmentId) && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="outline" data-testid={`button-shiprocket-menu-${order.id}`}>
                                <Send className="w-3 h-3 mr-1" /> Shiprocket
                                <ChevronDown className="w-3 h-3 ml-1 opacity-60" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuLabel className="text-xs">Shiprocket actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              {srConfigured && !dispatch?.shiprocketOrderId && (
                                <DropdownMenuItem disabled={shipMutation.isPending} onClick={() => shipMutation.mutate(order.id)} data-testid={`menu-shiprocket-create-${order.id}`}>
                                  <Send className="w-3.5 h-3.5 mr-2" /> Create shipment
                                </DropdownMenuItem>
                              )}
                              {dispatch?.shiprocketShipmentId && !dispatch?.waybill && (
                                <DropdownMenuItem disabled={assignAwbMutation.isPending} onClick={() => assignAwbMutation.mutate(dispatch.id)} data-testid={`menu-assign-awb-${order.id}`}>
                                  <Tag className="w-3.5 h-3.5 mr-2" /> Assign AWB
                                </DropdownMenuItem>
                              )}
                              {dispatch?.waybill && !dispatch?.pickupScheduledDate && (
                                <DropdownMenuItem disabled={pickupMutation.isPending} onClick={() => pickupMutation.mutate(dispatch.id)} data-testid={`menu-pickup-${order.id}`}>
                                  <MapPin className="w-3.5 h-3.5 mr-2" /> Schedule pickup
                                </DropdownMenuItem>
                              )}
                              {dispatch?.shiprocketShipmentId && (
                                <DropdownMenuItem disabled={labelMutation.isPending} onClick={() => labelMutation.mutate(dispatch.id)} data-testid={`menu-sr-label-${order.id}`}>
                                  <Printer className="w-3.5 h-3.5 mr-2" /> SR label
                                </DropdownMenuItem>
                              )}
                              {dispatch?.waybill && (
                                <DropdownMenuItem disabled={trackMutation.isPending} onClick={() => trackMutation.mutate(dispatch.id)} data-testid={`menu-track-${order.id}`}>
                                  <RefreshCw className="w-3.5 h-3.5 mr-2" /> Refresh tracking
                                </DropdownMenuItem>
                              )}
                              {dispatch?.shiprocketShipmentId && dispatch?.shippingStatus !== "CANCELLED" && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem disabled={cancelShipmentMutation.isPending} className="text-red-600 focus:text-red-700" onClick={() => { if (confirm("Cancel this Shiprocket shipment?")) cancelShipmentMutation.mutate(dispatch.id); }} data-testid={`menu-cancel-shipment-${order.id}`}>
                                    <Ban className="w-3.5 h-3.5 mr-2" /> Cancel shipment
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                      {dispatchOpen === order.id && (
                        <div className="flex gap-1 mt-1">
                          <Input placeholder="Courier" value={courierName} onChange={(e) => setCourierName(e.target.value)} className="w-28 h-7 text-xs" />
                          <Input placeholder="Tracking #" value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} className="w-28 h-7 text-xs" />
                          <Input placeholder="Waybill" value={waybill} onChange={(e) => setWaybill(e.target.value)} className="w-24 h-7 text-xs" />
                          <Button size="sm" className="bg-primary text-xs" onClick={() => createDispatchMutation.mutate({ orderId: order.id, courierName, trackingNumber, waybill })}>
                            <CheckCircle className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {filtered.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No orders found.</p>
          )}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground" data-testid="text-orders-page-info">
            Page {page} of {totalPages} · Showing {filtered.length} of {totalOrders}
          </p>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setPage(1)} disabled={page === 1} data-testid="button-orders-page-first">
              First
            </Button>
            <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} data-testid="button-orders-page-prev">
              Previous
            </Button>
            <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} data-testid="button-orders-page-next">
              Next
            </Button>
            <Button size="sm" variant="outline" onClick={() => setPage(totalPages)} disabled={page >= totalPages} data-testid="button-orders-page-last">
              Last
            </Button>
          </div>
        </div>
      )}
      <OrderWorkspace
        orderId={workspaceOrderId}
        open={workspaceOrderId !== null}
        onOpenChange={(open) => { if (!open) setWorkspaceOrderId(null); }}
        fetcher={fetcher}
        onTransition={(id, status) => updateStatusMutation.mutate({ id, status })}
      />
    </div>
  );
}


export default OrdersTab;

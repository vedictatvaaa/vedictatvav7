import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import type { Order } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Package,
  Search,
  Truck,
  CheckCircle,
  ArrowRight,
  RotateCcw,
  Download,
  Mail,
  ShieldCheck,
  MessageCircle,
  Smartphone,
  CheckCircle2,
  Clock,
  Loader2,
} from "lucide-react";
import OrderTimeline from "@/components/OrderTimeline";

type NotificationItem = {
  id: number;
  channel: "whatsapp" | "sms" | "email";
  kind: string;
  status: "sent" | "skipped" | "failed";
  createdAt: string | null;
};

const NOTIFICATION_KIND_LABELS: Record<string, string> = {
  payment_received: "Payment received",
  order_confirmed: "Order confirmed",
  order_shipped: "Order shipped",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  refund_initiated: "Refund initiated",
  abandoned_cart_wa: "Cart reminder",
  test: "Test message",
};

const CHANNEL_LABELS: Record<string, string> = {
  whatsapp: "WhatsApp",
  sms: "SMS",
  email: "Email",
};

function NotificationsTimeline({ orderId, token }: { orderId: number; token: string }) {
  const [items, setItems] = useState<NotificationItem[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/orders/${orderId}/notifications`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          if (!cancelled) setItems([]);
          return;
        }
        const body = await res.json();
        if (!cancelled) setItems(body.notifications || []);
      } catch {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [orderId, token]);

  if (loading) {
    return (
      <div
        className="flex items-center gap-2 text-sm text-muted-foreground"
        data-testid={`status-notifications-loading-${orderId}`}
      >
        <Loader2 className="w-4 h-4 animate-spin" /> Loading notification history...
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <p
        className="text-sm text-muted-foreground"
        data-testid={`text-notifications-empty-${orderId}`}
      >
        No notifications have been sent for this order yet. We'll text or email you at each milestone.
      </p>
    );
  }

  return (
    <ul className="space-y-2" data-testid={`list-notifications-${orderId}`}>
      {items.map((n) => {
        const ChannelIcon =
          n.channel === "whatsapp" ? MessageCircle : n.channel === "sms" ? Smartphone : Mail;
        const channelLabel = CHANNEL_LABELS[n.channel] || n.channel;
        const kindLabel = NOTIFICATION_KIND_LABELS[n.kind] || n.kind.replace(/_/g, " ");
        const when = n.createdAt
          ? new Date(n.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
          : "";
        const sent = n.status === "sent";
        const failed = n.status === "failed";
        return (
          <li
            key={n.id}
            className="flex items-start gap-3 rounded-md border border-[#D4AF37]/20 bg-white p-3"
            data-testid={`notification-${n.id}`}
          >
            <ChannelIcon className="w-4 h-4 text-[#6D2B35] mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p
                className="text-sm font-medium text-[#3a2a1a]"
                data-testid={`notification-title-${n.id}`}
              >
                {sent
                  ? `We ${n.channel === "email" ? "emailed" : "texted"} you on ${channelLabel}: ${kindLabel}`
                  : failed
                  ? `${channelLabel} update for "${kindLabel}" couldn't be delivered`
                  : `${channelLabel} update for "${kindLabel}" was skipped`}
              </p>
              <p
                className="text-xs text-muted-foreground mt-0.5"
                data-testid={`notification-time-${n.id}`}
              >
                {when}
              </p>
              {failed && (
                <p
                  className="text-xs text-[#6D2B35] mt-1"
                  data-testid={`notification-retry-${n.id}`}
                >
                  We'll try again shortly.
                </p>
              )}
            </div>
            <Badge
              variant={sent ? "default" : "outline"}
              className={
                sent
                  ? "bg-emerald-600 text-white hover:bg-emerald-600"
                  : failed
                  ? "border-rose-400 text-rose-700"
                  : "border-[#D4AF37]/40 text-[#5a4a3a]"
              }
              data-testid={`notification-status-${n.id}`}
            >
              {sent ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <Clock className="w-3 h-3 mr-1" />}
              {sent ? "Delivered" : failed ? "Retrying" : "Skipped"}
            </Badge>
          </li>
        );
      })}
    </ul>
  );
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: "Pending", color: "text-yellow-700", bg: "bg-yellow-100" },
  confirmed: { label: "Confirmed", color: "text-blue-700", bg: "bg-blue-100" },
  shipped: { label: "Shipped", color: "text-indigo-700", bg: "bg-indigo-100" },
  delivered: { label: "Delivered", color: "text-green-700", bg: "bg-green-100" },
  cancelled: { label: "Cancelled", color: "text-red-700", bg: "bg-red-100" },
  refunded: { label: "Refunded", color: "text-emerald-700", bg: "bg-emerald-100" },
};

type Step = "email" | "otp" | "results";

export default function OrderHistory() {
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "confirmed" | "shipped" | "delivered">("all");

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((v) => Math.max(0, v - 1)), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const requestOtpMut = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/orders/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (!res.ok) throw new Error("Failed to send code");
    },
    onSuccess: () => {
      setStep("otp");
      setResendCooldown(60);
      toast({
        title: "Check your email",
        description: "If we have orders for that address, a 6-digit code is on its way (valid for 10 minutes).",
      });
    },
    onError: () => {
      toast({ title: "Couldn't send code", description: "Please try again in a moment.", variant: "destructive" });
    },
  });

  const verifyOtpMut = useMutation({
    mutationFn: async () => {
      const verifyRes = await fetch("/api/orders/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), code: code.trim() }),
      });
      if (!verifyRes.ok) {
        const err = await verifyRes.json().catch(() => ({}));
        throw new Error(err.message || "Invalid code");
      }
      const { token: tk } = await verifyRes.json();
      const ordersRes = await fetch(`/api/orders/by-email?email=${encodeURIComponent(email.trim())}`, {
        headers: { Authorization: `Bearer ${tk}` },
      });
      if (!ordersRes.ok) throw new Error("Failed to load orders");
      const list: Order[] = await ordersRes.json();
      return { token: tk, list };
    },
    onSuccess: ({ token: tk, list }) => {
      setToken(tk);
      setOrders(list);
      setStep("results");
    },
    onError: (err: any) => {
      toast({ title: "Verification failed", description: err?.message || "Invalid code", variant: "destructive" });
    },
  });

  const reset = () => {
    setStep("email");
    setCode("");
    setToken(null);
    setOrders(null);
  };

  const sortedOrders = orders
    ? [...orders].sort(
        (a, b) =>
          new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
      )
    : [];

  const matchesFilter = (status: string) => {
    if (statusFilter === "all") return true;
    if (statusFilter === "pending") return status === "pending";
    if (statusFilter === "confirmed") return status === "confirmed" || status === "paid";
    if (statusFilter === "shipped") return status === "dispatched" || status === "shipped" || status === "out_for_delivery";
    if (statusFilter === "delivered") return status === "delivered";
    return true;
  };
  const filteredOrders = sortedOrders.filter((o) => matchesFilter(o.status));
  const filterCounts = {
    all: sortedOrders.length,
    pending: sortedOrders.filter((o) => o.status === "pending").length,
    confirmed: sortedOrders.filter((o) => o.status === "confirmed" || o.status === "paid").length,
    shipped: sortedOrders.filter((o) => o.status === "dispatched" || o.status === "shipped" || o.status === "out_for_delivery").length,
    delivered: sortedOrders.filter((o) => o.status === "delivered").length,
  };
  const FILTER_CHIPS: Array<{ id: typeof statusFilter; label: string }> = [
    { id: "all", label: "All" },
    { id: "pending", label: "Pending" },
    { id: "confirmed", label: "Confirmed" },
    { id: "shipped", label: "Shipped" },
    { id: "delivered", label: "Delivered" },
  ];

  return (
    <div className="min-h-screen bg-[#FDF6EC]">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="flex items-center gap-3 mb-8">
          <Package className="w-8 h-8 text-[#6D2B35]" />
          <h1
            className="text-3xl font-serif text-[#6D2B35]"
            data-testid="text-order-history-title"
          >
            Order History
          </h1>
        </div>

        {step === "email" && (
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-[#6D2B35] mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  Enter the email used at checkout. We'll send you a 6-digit code to confirm it's you before showing your orders.
                </div>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (email.trim()) requestOtpMut.mutate();
                }}
                className="flex gap-2"
              >
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  data-testid="input-email"
                  className="flex-1"
                />
                <Button
                  type="submit"
                  disabled={requestOtpMut.isPending}
                  data-testid="button-send-code"
                  className="bg-[#6D2B35] hover:bg-[#5a2330] text-white"
                >
                  {requestOtpMut.isPending ? (
                    <RotateCcw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  <span className="ml-2">{requestOtpMut.isPending ? "Sending..." : "Send Code"}</span>
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {step === "otp" && (
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-[#6D2B35] mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  Enter the 6-digit code we sent to <span className="font-medium text-[#6D2B35]" data-testid="text-otp-email">{email}</span>. The code expires in 10 minutes.
                </div>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (code.trim().length === 6) verifyOtpMut.mutate();
                }}
                className="flex gap-2"
              >
                <Input
                  type="text"
                  inputMode="numeric"
                  pattern="\d{6}"
                  maxLength={6}
                  placeholder="123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  required
                  data-testid="input-otp"
                  className="flex-1 tracking-[0.5em] text-center text-lg"
                />
                <Button
                  type="submit"
                  disabled={verifyOtpMut.isPending || code.length !== 6}
                  data-testid="button-verify-code"
                  className="bg-[#6D2B35] hover:bg-[#5a2330] text-white"
                >
                  {verifyOtpMut.isPending ? (
                    <RotateCcw className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  <span className="ml-2">{verifyOtpMut.isPending ? "Verifying..." : "Verify"}</span>
                </Button>
              </form>
              <div className="flex items-center gap-3 text-sm">
                <button
                  type="button"
                  onClick={reset}
                  className="text-[#6D2B35] underline"
                  data-testid="button-change-email"
                >
                  Use a different email
                </button>
                <span className="text-gray-300">•</span>
                <button
                  type="button"
                  onClick={() => { requestOtpMut.mutate(); setResendCooldown(60); }}
                  disabled={requestOtpMut.isPending || resendCooldown > 0}
                  className="text-[#6D2B35] underline disabled:opacity-50 disabled:no-underline"
                  data-testid="button-resend-code"
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === "results" && (
          <>
            <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
              <p className="text-sm text-muted-foreground" data-testid="text-results-email">
                Showing orders for <span className="font-medium text-[#6D2B35]">{email}</span>
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={reset}
                data-testid="button-search-different"
              >
                Search a different email
              </Button>
            </div>

            {sortedOrders.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4" data-testid="filter-chips">
                {FILTER_CHIPS.map((c) => {
                  const count = filterCounts[c.id];
                  const active = statusFilter === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setStatusFilter(c.id)}
                      className={`text-xs px-3 h-8 rounded-full border font-medium transition-colors ${
                        active
                          ? "bg-[#6D2B35] text-white border-[#6D2B35]"
                          : "bg-white text-[#6D2B35] border-[#D4AF37]/40 hover-elevate"
                      }`}
                      data-testid={`filter-chip-${c.id}`}
                    >
                      {c.label} <span className={active ? "text-white/70" : "text-[#5a4a3a]/55"}>({count})</span>
                    </button>
                  );
                })}
              </div>
            )}

            {sortedOrders.length === 0 && (
              <div
                className="text-center py-12 text-muted-foreground"
                data-testid="text-no-orders"
              >
                No orders found for this email
              </div>
            )}

            {sortedOrders.length > 0 && filteredOrders.length === 0 && (
              <div className="text-center py-12 text-muted-foreground" data-testid="text-no-filtered-orders">
                No orders in this status. Try a different filter.
              </div>
            )}

            {filteredOrders.length > 0 && (
              <div className="space-y-4">
                {filteredOrders.map((order) => {
                  const statusCfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending;
                  const items = (order.items as Array<{ name: string; quantity: number; price: number }>) ?? [];

                  return (
                    <Card key={order.id} data-testid={`card-order-${order.id}`}>
                      <CardContent className="pt-6 space-y-3">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-3">
                            <span
                              className="font-serif text-lg text-[#6D2B35]"
                              data-testid={`text-order-id-${order.id}`}
                            >
                              Order #{order.id}
                            </span>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusCfg.bg} ${statusCfg.color}`}
                              data-testid={`status-order-${order.id}`}
                            >
                              {statusCfg.label}
                            </span>
                          </div>
                          <span
                            className="text-xl font-semibold text-[#D4AF37]"
                            data-testid={`text-total-${order.id}`}
                          >
                            ₹{order.totalAmount.toLocaleString("en-IN")}
                          </span>
                        </div>

                        <p
                          className="text-sm text-muted-foreground"
                          data-testid={`text-date-${order.id}`}
                        >
                          {order.createdAt
                            ? new Date(order.createdAt).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              })
                            : "N/A"}
                        </p>

                        {items.length > 0 && (
                          <ul className="text-sm space-y-1" data-testid={`list-items-${order.id}`}>
                            {items.map((item, idx) => (
                              <li key={idx} className="flex items-center gap-1 text-gray-700">
                                <ArrowRight className="w-3 h-3 text-[#D4AF37]" />
                                {item.name} × {item.quantity}
                              </li>
                            ))}
                          </ul>
                        )}

                        <OrderTimeline status={order.status} />

                        {token && (
                          <div className="border-t border-[#D4AF37]/20 pt-3">
                            <h3 className="text-sm font-semibold text-[#6D2B35] mb-2">
                              Notifications we sent you
                            </h3>
                            <NotificationsTimeline orderId={order.id} token={token} />
                          </div>
                        )}

                        <div className="flex gap-2 mt-2 flex-wrap">
                          <Link
                            href={`/track-order/${order.id}`}
                            data-testid={`link-track-${order.id}`}
                          >
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-[#6D2B35] text-[#6D2B35] hover:bg-[#6D2B35] hover:text-white"
                            >
                              <Truck className="w-3 h-3 mr-1" />
                              Track Order
                            </Button>
                          </Link>
                          {["confirmed", "paid", "dispatched", "delivered", "shipped"].includes(order.status) && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-white"
                              data-testid={`button-download-invoice-${order.id}`}
                              onClick={async () => {
                                try {
                                  if (!token) return;
                                  const ownerHeaders = { Authorization: `Bearer ${token}` };
                                  let res = await fetch(`/api/invoices/order/${order.id}/download`, { headers: ownerHeaders });
                                  if (res.status === 404) {
                                    await fetch(`/api/invoices/generate/${order.id}`, { method: "POST", headers: ownerHeaders });
                                    res = await fetch(`/api/invoices/order/${order.id}/download`, { headers: ownerHeaders });
                                  }
                                  if (res.ok) {
                                    const blob = await res.blob();
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement("a");
                                    a.href = url; a.download = `Invoice-Order-${order.id}.pdf`; a.click();
                                  }
                                } catch {}
                              }}
                            >
                              <Download className="w-3 h-3 mr-1" />
                              Download Invoice
                            </Button>
                          )}
                          {order.status === "delivered" && (
                            <Link
                              href={`/return-ticket?orderId=${order.id}&email=${encodeURIComponent(email)}`}
                              data-testid={`link-return-${order.id}`}
                            >
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-[#6D2B35] text-[#6D2B35] hover:bg-[#6D2B35] hover:text-white"
                              >
                                <RotateCcw className="w-3 h-3 mr-1" />
                                Submit Return Request
                              </Button>
                            </Link>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { useRoute, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import OrderTimeline, { type TimelineStep } from "@/components/OrderTimeline";
import { Search, PackageSearch, Truck, ExternalLink, Loader2, AlertCircle, RotateCcw } from "lucide-react";

type TrackResponse = {
  order: {
    id: number;
    status: string;
    customerName: string | null;
    totalAmount: number;
    createdAt: string | null;
    items: Array<{ name: string; quantity: number; price?: number }>;
    shippingAddress: string | null;
  };
  dispatch: {
    courierName: string | null;
    trackingNumber: string | null;
    waybill: string | null;
    shippingStatus: string | null;
    dispatchDate: string | null;
  } | null;
  steps: TimelineStep[];
  events: Array<{ date: string; status: string; location?: string; activity?: string }>;
  trackingUrl: string | null;
};

export default function TrackOrderPage() {
  const [, params] = useRoute("/track-order/:orderId");
  const [orderId, setOrderId] = useState<string>(params?.orderId || "");
  const [email, setEmail] = useState("");
  const [data, setData] = useState<TrackResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function lookup(e?: React.FormEvent) {
    e?.preventDefault();
    if (!orderId.trim() || !email.trim()) {
      setError("Please enter both order ID and email.");
      return;
    }
    setError("");
    setLoading(true);
    setData(null);
    try {
      const res = await fetch(
        `/api/orders/track/${encodeURIComponent(orderId.trim())}?email=${encodeURIComponent(email.trim())}`
      );
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.message || "We couldn't find that order. Please check your details.");
      } else {
        setData(body);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const [emailFromUrl, setEmailFromUrl] = useState(false);
  useEffect(() => {
    if (params?.orderId && !data && !loading) {
      setOrderId(params.orderId);
    }
    // Pre-fill email from ?email= query param (e.g. deep-link from confirmation email)
    if (typeof window !== "undefined") {
      const qp = new URLSearchParams(window.location.search);
      const e = qp.get("email");
      if (e && !email) {
        setEmail(e);
        setEmailFromUrl(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params?.orderId]);

  // Auto-trigger lookup once both fields are pre-filled from URL (one-shot).
  // Gated on emailFromUrl so the request only fires when the email came from ?email=,
  // not when the user is mid-typing on /track-order/:orderId.
  const [autoTried, setAutoTried] = useState(false);
  useEffect(() => {
    if (!autoTried && params?.orderId && emailFromUrl && orderId && email && !data && !loading && !error) {
      setAutoTried(true);
      void lookup();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, email, emailFromUrl, params?.orderId]);

  return (
    <div className="min-h-screen bg-[#FBF7EE]">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-2">
          <PackageSearch className="w-7 h-7 text-[#6D2B35]" />
          <h1 className="text-3xl font-serif text-[#6D2B35]" data-testid="text-track-heading">
            Track your order
          </h1>
        </div>
        <p className="text-sm text-[#5a4a3a]/80 mb-6">
          Enter your order ID and the email used at checkout to view live shipping status.
        </p>

        <Card className="border-[#D4AF37]/30">
          <CardContent className="pt-6">
            <form onSubmit={lookup} className="grid sm:grid-cols-[1fr,1fr,auto] gap-2 items-start">
              <Input
                placeholder="Order ID (e.g. 1042)"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value.replace(/\D/g, "").slice(0, 10))}
                inputMode="numeric"
                data-testid="input-track-order-id"
              />
              <Input
                type="email"
                placeholder="Email used at checkout"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                data-testid="input-track-email"
              />
              <Button
                type="submit"
                disabled={loading}
                className="bg-[#6D2B35] hover:bg-[#5a2330] text-[#D4AF37] font-semibold"
                data-testid="button-track-lookup"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                <span className="ml-1.5">Track</span>
              </Button>
            </form>
            {error && (
              <p className="text-sm text-rose-700 mt-3 flex items-center gap-1.5" data-testid="text-track-error">
                <AlertCircle className="w-4 h-4" /> {error}
              </p>
            )}
          </CardContent>
        </Card>

        {data && (
          <div className="mt-6 space-y-4" data-testid="track-results">
            <Card className="border-[#D4AF37]/30">
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle className="text-[#6D2B35] font-serif text-xl" data-testid="text-track-order-id">
                    Order #{data.order.id}
                  </CardTitle>
                  <Badge className="bg-[#6D2B35] text-[#D4AF37] hover:bg-[#6D2B35]" data-testid="badge-track-status">
                    {(data.dispatch?.shippingStatus || data.order.status || "pending").replace(/_/g, " ")}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <OrderTimeline
                  status={data.order.status}
                  shippingStatus={data.dispatch?.shippingStatus}
                  steps={data.steps}
                />

                {data.dispatch?.trackingNumber && (
                  <div className="rounded-md bg-white border border-[#D4AF37]/30 p-3 flex items-start gap-3">
                    <Truck className="h-4 w-4 text-[#D4AF37] mt-0.5" />
                    <div className="text-sm flex-1">
                      <p className="font-semibold text-[#6D2B35]" data-testid="text-track-courier">
                        {data.dispatch.courierName || "Courier"} · AWB {data.dispatch.trackingNumber}
                      </p>
                      {data.trackingUrl && (
                        <a
                          href={data.trackingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-[#6D2B35] underline inline-flex items-center gap-1 mt-1"
                          data-testid="link-courier-track"
                        >
                          Track on courier site <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {data.events.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-[#6D2B35] mb-2">Shipment activity</h3>
                    <ul className="space-y-2 border-l-2 border-[#D4AF37]/30 pl-4" data-testid="list-track-events">
                      {data.events.map((ev, i) => (
                        <li key={i} className="text-sm" data-testid={`event-${i}`}>
                          <p className="font-medium text-[#3a2a1a]">{ev.activity || ev.status}</p>
                          <p className="text-xs text-[#5a4a3a]/70">
                            {new Date(ev.date).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                            {ev.location ? ` · ${ev.location}` : ""}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="border-t border-[#D4AF37]/20 pt-4 space-y-1.5">
                  <h3 className="text-sm font-semibold text-[#6D2B35]">Items</h3>
                  <ul className="text-sm space-y-1" data-testid="list-track-items">
                    {data.order.items.map((it, i) => (
                      <li key={i} className="text-[#3a2a1a]">
                        {it.name} <span className="text-[#5a4a3a]/70">× {it.quantity}</span>
                      </li>
                    ))}
                  </ul>
                  {data.order.shippingAddress && (
                    <p className="text-xs text-[#5a4a3a]/80 pt-2">
                      <span className="font-semibold text-[#6D2B35]">Shipping to:</span> {data.order.shippingAddress}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  <Link
                    href={`/return-ticket?orderId=${data.order.id}&email=${encodeURIComponent(email)}`}
                    data-testid="link-track-return"
                  >
                    <Button variant="outline" size="sm" className="border-[#6D2B35] text-[#6D2B35]">
                      <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                      Request return / refund
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

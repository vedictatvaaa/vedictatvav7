import { Link, useSearch } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Package, MapPin, Clock, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

export default function OrderConfirmation() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const orderId = params.get("orderId");

  const { data: order, isLoading } = useQuery<any>({
    queryKey: ["/api/orders/public", orderId],
    queryFn: () => fetch(`/api/orders/${orderId}/public-summary`).then(r => r.ok ? r.json() : null),
    enabled: !!orderId,
    retry: false,
  });

  return (
    <div className="min-h-screen bg-[#FBF7EE] flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full space-y-5">

        {/* Success header */}
        <div className="bg-white border border-[#D4AF37]/30 rounded-md p-8 sm:p-10 text-center space-y-5">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-md bg-[#FBF7EE] border border-[#D4AF37]/30 flex items-center justify-center">
              <CheckCircle2 className="w-9 h-9 text-emerald-600" strokeWidth={1.6} />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-center gap-2.5 mb-2">
              <span className="h-px w-6 bg-[#D4AF37]" />
              <span className="text-[10px] uppercase tracking-[0.3em] text-[#D4AF37] font-semibold">Order Confirmed</span>
              <span className="h-px w-6 bg-[#D4AF37]" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif text-[#6D2B35] font-semibold tracking-tight" data-testid="text-order-success">
              Order Placed Successfully
            </h1>
            {orderId && (
              <p className="mt-2 text-sm text-[#5a4a3a]/70">
                Order ID: <span className="font-bold text-[#6D2B35]" data-testid="text-order-id">#{orderId}</span>
              </p>
            )}
          </div>
          <p className="text-sm text-[#5a4a3a]/75 leading-relaxed" data-testid="text-order-message">
            Thank you for your purchase. A confirmation email with your order details is on its way.
          </p>
        </div>

        {/* Order summary */}
        {orderId && (
          <div className="bg-white border border-[#D4AF37]/25 rounded-md overflow-hidden">
            {isLoading ? (
              <div className="p-5 space-y-3">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-4 w-24 ml-auto" />
              </div>
            ) : order ? (
              <div className="divide-y divide-[#D4AF37]/15">
                <div className="px-5 py-3 bg-[#FBF7EE]">
                  <p className="text-[11px] uppercase tracking-wider font-bold text-[#6D2B35]">Your items</p>
                </div>
                {order.items?.map((item: any, i: number) => (
                  <div key={i} className="px-5 py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#4a1a22] truncate" data-testid={`text-item-name-${i}`}>{item.name}</p>
                      <p className="text-xs text-[#5a4a3a]/60">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-semibold text-[#6D2B35] shrink-0">{formatCurrency(item.price * item.quantity)}</p>
                  </div>
                ))}
                <div className="px-5 py-3 flex justify-between items-center">
                  <span className="text-sm font-bold text-[#4a1a22]">Total paid</span>
                  <span className="text-base font-bold text-[#6D2B35]" data-testid="text-order-total">{formatCurrency(order.totalAmount)}</span>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* What happens next */}
        <div className="bg-white border border-[#D4AF37]/25 rounded-md p-5">
          <p className="text-xs uppercase tracking-wider text-[#6D2B35] font-bold mb-3">What happens next?</p>
          <ul className="space-y-2.5">
            {[
              { icon: CheckCircle2, text: "Confirmation email sent to your inbox" },
              { icon: Package, text: "Your items will be carefully packed" },
              { icon: MapPin, text: "Tracking details shared once shipped" },
              { icon: Clock, text: "Delivery within 5–7 business days" },
            ].map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-2.5 text-sm text-[#5a4a3a]/75">
                <Icon className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" strokeWidth={1.8} />
                {text}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex gap-3">
          <Link href="/order-history" className="flex-1">
            <Button variant="outline" className="w-full border-[#D4AF37]/40 text-[#6D2B35] rounded-md h-10 text-[13px] font-semibold" data-testid="button-view-orders">
              View My Orders
            </Button>
          </Link>
          <Link href="/spiritual-essentials" className="flex-1">
            <Button className="w-full bg-[#6D2B35] text-[#D4AF37] rounded-md h-10 text-[13px] font-semibold" data-testid="button-continue-shopping">
              Continue Shopping
            </Button>
          </Link>
        </div>

      </div>
    </div>
  );
}

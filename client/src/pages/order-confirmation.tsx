import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

export default function OrderConfirmation() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full text-center bg-white border border-[#D4AF37]/30 rounded-md p-8 sm:p-10 space-y-6">
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
        </div>

        <p className="text-sm text-[#5a4a3a]/75 leading-relaxed" data-testid="text-order-message">
          Thank you for your purchase. Your order has been confirmed and will be processed shortly. You will receive an email confirmation with your order details.
        </p>

        <div className="bg-[#FBF7EE] border border-[#D4AF37]/25 rounded-md p-4 text-left">
          <p className="text-xs uppercase tracking-wider text-[#6D2B35] font-bold mb-2">What happens next?</p>
          <ul className="text-sm text-[#5a4a3a]/75 space-y-1.5">
            <li className="flex gap-2"><span className="text-[#D4AF37]">·</span> Order confirmation email sent to your inbox</li>
            <li className="flex gap-2"><span className="text-[#D4AF37]">·</span> Your items will be carefully packed</li>
            <li className="flex gap-2"><span className="text-[#D4AF37]">·</span> Tracking details shared once shipped</li>
            <li className="flex gap-2"><span className="text-[#D4AF37]">·</span> Delivery within 5-7 business days</li>
          </ul>
        </div>

        <Link href="/spiritual-essentials">
          <Button
            className="bg-[#6D2B35] hover:bg-[#5a1f29] text-[#D4AF37] rounded-md h-10 px-6 text-[13px] font-semibold"
            data-testid="button-continue-shopping"
          >
            Continue Shopping
          </Button>
        </Link>
      </div>
    </div>
  );
}

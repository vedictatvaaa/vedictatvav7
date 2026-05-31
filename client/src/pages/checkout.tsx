import { useState, useEffect, useRef } from "react";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tag, CheckCircle, X, Zap, Truck, CreditCard, Banknote, Percent, Shield, Gift, Sparkles, MapPin, Award } from "lucide-react";
import { trackBeginCheckout, trackPurchase } from "@/lib/analytics";

declare global {
  interface Window {
    Razorpay: any;
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (document.getElementById("razorpay-script")) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.id = "razorpay-script";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

const PREPAID_DISCOUNT_PERCENT = 5;
// "Bundle & Save": 8% off when the cart holds 2+ distinct products. Mirrored
// server-side in /api/checkout (recomputed from trusted prices). Routed through
// the coupon slot — bundle and a real coupon do not stack, the larger wins.
const BUNDLE_DISCOUNT_PERCENT = 8;
const BUNDLE_MIN_DISTINCT = 2;
const BUNDLE_COUPON_CODE = "BUNDLE8";

export default function Checkout() {
  const { items, totalAmount, clearCart } = useCart();
  const { user } = useAuth();
  const [loyaltyData, setLoyaltyData] = useState<{ balance: number; worth: string } | null>(null);
  const [loyaltyEnabled, setLoyaltyEnabled] = useState(false);
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);

  useEffect(() => {
    if (!user) { setLoyaltyData(null); return; }
    fetch(`/api/loyalty/balance/${user.id}?email=${encodeURIComponent(user.email)}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d) setLoyaltyData({ balance: d.balance || 0, worth: d.worth || `\u20B90` }); })
      .catch(() => {});
  }, [user?.id, user?.email]);
  // Fire begin_checkout once on mount when the cart has items.
  useEffect(() => {
    if (items.length > 0) trackBeginCheckout(items, totalAmount);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [paymentMode, setPaymentMode] = useState<"prepaid" | "cod">("prepaid");

  const [couponCode, setCouponCode] = useState("");
  const couponAutoTriedRef = useRef<number>(0);
  const [couponLoading, setCouponLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    id: number;
    code: string;
    type: string;
    value: number;
    description: string | null;
    discount: number;
  } | null>(null);
  const [couponError, setCouponError] = useState("");

  useEffect(() => {
    if (items.length === 0) {
      setLocation("/spiritual-essentials");
    }
  }, [items.length, setLocation]);

  // Abandoned-cart beacon: when the user has typed an email and items remain in
  // the cart, ping the server so the admin can follow up later if they bail.
  const orderCompletedRef = (typeof window !== "undefined" ? (window as any) : ({} as any));
  useEffect(() => {
    function reportAbandonment() {
      const email = form.email.trim();
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
      if (orderCompletedRef.__vt_orderCompleted) return;
      if (items.length === 0) return;
      const payload = {
        email,
        items: items.map((it) => ({ id: it.product.id, name: it.product.name, price: it.product.price, quantity: it.quantity, image: it.product.image })),
        cartTotal: totalAmount,
      };
      try {
        const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
        if (navigator.sendBeacon) {
          navigator.sendBeacon("/api/abandoned-cart", blob);
        } else {
          fetch("/api/abandoned-cart", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), keepalive: true }).catch(() => {});
        }
      } catch {}
    }
    window.addEventListener("beforeunload", reportAbandonment);
    window.addEventListener("pagehide", reportAbandonment);
    return () => {
      window.removeEventListener("beforeunload", reportAbandonment);
      window.removeEventListener("pagehide", reportAbandonment);
    };
  }, [form.email, items, totalAmount]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  }

  function validateForm(): boolean {
    const newErrors: Record<string, string> = {};
    if (!form.fullName.trim()) newErrors.fullName = "Full name is required";
    if (!form.email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = "Invalid email format";
    if (!form.phone.trim()) newErrors.phone = "Phone number is required";
    else if (!/^\d{10}$/.test(form.phone.replace(/\s/g, ""))) newErrors.phone = "Enter a valid 10-digit phone number";
    if (!form.address.trim()) newErrors.address = "Address is required";
    if (!form.city.trim()) newErrors.city = "City is required";
    if (!form.state.trim()) newErrors.state = "State is required";
    if (!form.pincode.trim()) newErrors.pincode = "PIN code is required";
    else if (!/^\d{6}$/.test(form.pincode)) newErrors.pincode = "Enter a valid 6-digit PIN code";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  // The current auto "Bundle & Save" coupon object (8% off when the cart holds
  // 2+ distinct products), or null when not eligible. Recomputed from the live
  // cart so it always matches the server's trusted recompute.
  function currentBundleCoupon() {
    const distinct = new Set(items.map((i) => i.product.id)).size;
    const discount = distinct >= BUNDLE_MIN_DISTINCT
      ? Math.round((totalAmount * BUNDLE_DISCOUNT_PERCENT) / 100)
      : 0;
    if (discount <= 0) return null;
    return {
      id: -1,
      code: BUNDLE_COUPON_CODE,
      type: "percentage",
      value: BUNDLE_DISCOUNT_PERCENT,
      description: `Bundle & Save — ${BUNDLE_DISCOUNT_PERCENT}% off for buying together`,
      discount,
    };
  }

  async function handleApplyCoupon() {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError("");
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode.trim(), orderAmount: totalAmount }),
      });
      const data = await res.json();
      if (data.valid) {
        const bundle = currentBundleCoupon();
        if (bundle && bundle.discount >= data.discount) {
          // The auto bundle already saves at least as much. Don't store the
          // weaker coupon — the bundle is derived every render, so clearing to
          // null keeps it active while the client total stays correct.
          setAppliedCoupon(null);
          setCouponError("");
          toast({ title: "Even better offer applied", description: `Your bundle saves ₹${bundle.discount} — more than ${data.coupon.code}.` });
        } else {
          setAppliedCoupon({
            id: data.coupon.id,
            code: data.coupon.code,
            type: data.coupon.type,
            value: data.coupon.value,
            description: data.coupon.description,
            discount: data.discount,
          });
          setCouponError("");
          toast({ title: "Coupon Applied!", description: data.message });
        }
      } else {
        setCouponError(data.message);
        setAppliedCoupon(null);
      }
    } catch {
      setCouponError("Failed to validate coupon. Please try again.");
    }
    setCouponLoading(false);
  }

  function removeCoupon() {
    // The auto bundle is derived every render, so simply clearing the manual
    // coupon lets the bundle (if still eligible) remain active automatically.
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError("");
  }

  // Smart Checkout: auto-apply the best public coupon (only if user hasn't manually entered one)
  useEffect(() => {
    if (appliedCoupon) return;
    if (totalAmount <= 0) return;
    if (couponAutoTriedRef.current === totalAmount) return;
    couponAutoTriedRef.current = totalAmount;
    const bundle = currentBundleCoupon();
    // Only persist a real public coupon when it beats the auto bundle. The
    // bundle itself is never stored in state — it's derived every render — so
    // there's no stale snapshot to diverge from the server.
    fetch(`/api/coupons/best?orderAmount=${totalAmount}`)
      .then((r) => r.json())
      .then((data) => {
        if (appliedCoupon) return;
        const best = data?.best;
        if (best && best.discount > (bundle?.discount || 0)) {
          setAppliedCoupon({
            id: best.id,
            code: best.code,
            type: best.type,
            value: best.value,
            description: best.description,
            discount: best.discount,
          });
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalAmount]);

  const shipping = totalAmount >= 500 ? 0 : 50;
  // Effective discount = the larger of the applied coupon and the auto bundle,
  // recomputed every render so the client total ALWAYS matches the server
  // (which grants the larger of coupon/bundle). Guards against a weaker manual
  // coupon, coupon removal, or a quantity change leaving a stale total.
  const _bundleNow = currentBundleCoupon();
  // appliedCoupon only ever holds a real coupon; the bundle is derived here so a
  // stale BUNDLE8 can never persist. Defensively ignore a BUNDLE8 code anyway.
  const _manualCoupon = appliedCoupon && appliedCoupon.code !== BUNDLE_COUPON_CODE ? appliedCoupon : null;
  const _manualCouponDiscount = _manualCoupon?.discount || 0;
  const bundleWins = (_bundleNow?.discount || 0) > _manualCouponDiscount;
  const _rawDiscount = bundleWins ? (_bundleNow?.discount || 0) : _manualCouponDiscount;
  const couponDiscount = Math.min(_rawDiscount, totalAmount);
  const effectiveCouponCode = bundleWins ? BUNDLE_COUPON_CODE : (_manualCoupon?.code || "");
  const subtotalAfterCoupon = totalAmount - couponDiscount;
  const prepaidDiscount = paymentMode === "prepaid" ? Math.round((subtotalAfterCoupon * PREPAID_DISCOUNT_PERCENT) / 100) : 0;
  const codCharges = paymentMode === "cod" ? 40 : 0;
  const preLoyaltyTotal = Math.max(0, subtotalAfterCoupon - prepaidDiscount + shipping + codCharges);
  // Loyalty redemption is COD-only for now (Razorpay flow not yet wired)
  const loyaltyMax = (user && loyaltyData && paymentMode === "cod")
    ? Math.min(loyaltyData.balance, Math.floor(preLoyaltyTotal * 0.20))
    : 0;
  const loyaltyDiscount = (loyaltyEnabled && paymentMode === "cod")
    ? Math.max(0, Math.min(loyaltyPoints, loyaltyMax))
    : 0;
  const grandTotal = Math.max(0, preLoyaltyTotal - loyaltyDiscount);

  // Auto-cap requested points if user changes payment method or cart total drops
  useEffect(() => {
    if (loyaltyPoints > loyaltyMax) setLoyaltyPoints(loyaltyMax);
    if (paymentMode !== "cod" && loyaltyEnabled) setLoyaltyEnabled(false);
  }, [loyaltyMax, paymentMode]);

  async function handlePayment() {
    if (!validateForm()) return;

    if (paymentMode === "cod") {
      setIsProcessing(true);
      try {
        const res = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customerName: form.fullName,
            customerEmail: form.email,
            customerPhone: form.phone,
            shippingAddress: `${form.address}, ${form.city}, ${form.state} - ${form.pincode}`,
            billingAddress: `${form.address}, ${form.city}, ${form.state} - ${form.pincode}`,
            customerState: form.state,
            totalAmount: grandTotal,
            paymentMethod: "cod",
            couponCode: effectiveCouponCode,
            couponDiscount,
            prepaidDiscount,
            shippingCharges: shipping,
            codCharges,
            loyaltyUserId: loyaltyDiscount > 0 && user ? user.id : undefined,
            loyaltyPointsRedeem: loyaltyDiscount > 0 ? loyaltyDiscount : undefined,
            items: items.map((item) => ({
              productId: item.product.id,
              name: item.product.name,
              price: item.product.price,
              quantity: item.quantity,
            })),
          }),
        });
        if (res.ok) {
          const placed = await res.json().catch(() => ({} as any));
          trackPurchase(
            String(placed?.id ?? placed?.orderId ?? `cod_${Date.now()}`),
            items,
            grandTotal,
            { shipping, coupon: effectiveCouponCode },
          );
          (window as any).__vt_orderCompleted = true;
          clearCart();
          const codOrderId = placed?.id ?? placed?.orderId;
          setLocation(codOrderId ? `/order-confirmation?orderId=${codOrderId}` : "/order-confirmation");
        } else {
          toast({ title: "Error", description: "Failed to place order. Please try again.", variant: "destructive" });
        }
      } catch {
        toast({ title: "Error", description: "Something went wrong.", variant: "destructive" });
      }
      setIsProcessing(false);
      return;
    }

    setIsProcessing(true);
    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast({ title: "Error", description: "Failed to load payment gateway. Please try again.", variant: "destructive" });
        setIsProcessing(false);
        return;
      }

      const createRes = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: grandTotal * 100,
          currency: "INR",
          receipt: `receipt_${Date.now()}`,
        }),
      });

      const orderData = await createRes.json();
      if (!createRes.ok) {
        throw new Error(orderData.message || "Failed to create order");
      }

      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Vedic Tatva",
        description: "Spiritual Products",
        order_id: orderData.orderId,
        prefill: {
          name: form.fullName,
          email: form.email,
          contact: form.phone,
        },
        theme: { color: "#6D2B35" },
        handler: async function (response: any) {
          try {
            const verifyRes = await fetch("/api/razorpay/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                orderData: {
                  customerName: form.fullName,
                  customerEmail: form.email,
                  customerPhone: form.phone,
                  shippingAddress: `${form.address}, ${form.city}, ${form.state} - ${form.pincode}`,
                  billingAddress: `${form.address}, ${form.city}, ${form.state} - ${form.pincode}`,
                  customerState: form.state,
                  totalAmount: grandTotal,
                  paymentMethod: "prepaid",
                  couponCode: effectiveCouponCode,
                  couponDiscount,
                  prepaidDiscount,
                  shippingCharges: shipping,
                  codCharges,
                  items: items.map((item) => ({
                    productId: item.product.id,
                    name: item.product.name,
                    price: item.product.price,
                    quantity: item.quantity,
                  })),
                },
              }),
            });

            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              trackPurchase(
                String(verifyData.orderId ?? response.razorpay_payment_id),
                items,
                grandTotal,
                { shipping, coupon: effectiveCouponCode },
              );
              (window as any).__vt_orderCompleted = true;
              clearCart();
              const rpOrderId = verifyData.orderId;
              setLocation(rpOrderId ? `/order-confirmation?orderId=${rpOrderId}` : "/order-confirmation");
            } else {
              toast({ title: "Payment Failed", description: "Payment verification failed. Please contact support.", variant: "destructive" });
            }
          } catch {
            toast({ title: "Error", description: "Payment verification failed. Please contact support.", variant: "destructive" });
          }
          setIsProcessing(false);
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (response: any) {
        toast({
          title: "Payment Failed",
          description: response.error?.description || "Payment was unsuccessful. Please try again.",
          variant: "destructive",
        });
        setIsProcessing(false);
      });
      rzp.open();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Something went wrong", variant: "destructive" });
      setIsProcessing(false);
    }
  }

  if (items.length === 0) return null;

  const sectionLabelCls = "text-[10px] uppercase tracking-[0.3em] font-bold text-[#6D2B35] mb-3 flex items-center gap-2";
  const inputCls = "h-10 text-sm bg-white border-[#D4AF37]/30 focus-visible:ring-[#D4AF37]/40 rounded-md";

  return (
    <div className="min-h-screen bg-white pb-24 lg:pb-12">
      {/* Slim hero */}
      <div className="bg-[#6D2B35] border-b border-[#D4AF37]/30">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-7 sm:py-9">
          <div className="flex items-center gap-2.5 mb-2">
            <span className="h-px w-6 bg-[#D4AF37]/60" />
            <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.3em] text-[#D4AF37] font-semibold">
              <Sparkles className="w-3 h-3" /> Secure Checkout
            </span>
          </div>
          <div className="flex items-baseline justify-between gap-3 flex-wrap">
            <h1 className="text-2xl md:text-3xl font-serif font-semibold text-white tracking-tight" data-testid="text-checkout-heading">
              Complete Your Order
            </h1>
            <span className="text-[11px] text-white/60 uppercase tracking-wider">{items.length} {items.length === 1 ? "item" : "items"}</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-6 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          <div className="lg:col-span-2 space-y-4">

            {/* Delivery details */}
            <section className="bg-white rounded-md border border-[#D4AF37]/25 p-4 md:p-5" data-testid="section-customer-details">
              <p className={sectionLabelCls}>
                <MapPin className="h-3 w-3 text-[#D4AF37]" /> Delivery Details
              </p>
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="fullName" className="text-[11px] text-[#5a4a3a]/70 mb-1 block font-medium">Full name</Label>
                    <Input id="fullName" name="fullName" value={form.fullName} onChange={handleChange} placeholder="As on ID proof" className={inputCls} data-testid="input-full-name" />
                    {errors.fullName && <p className="text-[11px] text-rose-600 mt-1" data-testid="error-full-name">{errors.fullName}</p>}
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-[11px] text-[#5a4a3a]/70 mb-1 block font-medium">Email</Label>
                    <Input id="email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="your@email.com" className={inputCls} data-testid="input-email" />
                    {errors.email && <p className="text-[11px] text-rose-600 mt-1" data-testid="error-email">{errors.email}</p>}
                  </div>
                </div>

                <div>
                  <Label htmlFor="phone" className="text-[11px] text-[#5a4a3a]/70 mb-1 block font-medium">Phone</Label>
                  <Input id="phone" name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="10-digit mobile" className={inputCls} data-testid="input-phone" />
                  {errors.phone && <p className="text-[11px] text-rose-600 mt-1" data-testid="error-phone">{errors.phone}</p>}
                </div>

                <div>
                  <Label htmlFor="address" className="text-[11px] text-[#5a4a3a]/70 mb-1 block font-medium">Address</Label>
                  <Input id="address" name="address" value={form.address} onChange={handleChange} placeholder="House / Flat, Street, Locality" className={inputCls} data-testid="input-address" />
                  {errors.address && <p className="text-[11px] text-rose-600 mt-1" data-testid="error-address">{errors.address}</p>}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <Label htmlFor="city" className="text-[11px] text-[#5a4a3a]/70 mb-1 block font-medium">City</Label>
                    <Input id="city" name="city" value={form.city} onChange={handleChange} placeholder="City" className={inputCls} data-testid="input-city" />
                    {errors.city && <p className="text-[11px] text-rose-600 mt-1" data-testid="error-city">{errors.city}</p>}
                  </div>
                  <div>
                    <Label htmlFor="state" className="text-[11px] text-[#5a4a3a]/70 mb-1 block font-medium">State</Label>
                    <Input id="state" name="state" value={form.state} onChange={handleChange} placeholder="State" className={inputCls} data-testid="input-state" />
                    {errors.state && <p className="text-[11px] text-rose-600 mt-1" data-testid="error-state">{errors.state}</p>}
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <Label htmlFor="pincode" className="text-[11px] text-[#5a4a3a]/70 mb-1 block font-medium">PIN code</Label>
                    <Input id="pincode" name="pincode" value={form.pincode} onChange={handleChange} placeholder="6-digit" className={inputCls} data-testid="input-pincode" />
                    {errors.pincode && <p className="text-[11px] text-rose-600 mt-1" data-testid="error-pincode">{errors.pincode}</p>}
                  </div>
                </div>
              </div>
            </section>

            {/* Coupon */}
            <section className="bg-white rounded-md border border-[#D4AF37]/25 p-4 md:p-5" data-testid="section-coupon">
              <p className={sectionLabelCls}>
                <Tag className="h-3 w-3 text-[#D4AF37]" /> Coupon
              </p>
              {appliedCoupon ? (
                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2.5" data-testid="coupon-applied">
                  <div className="flex items-center gap-2 min-w-0">
                    <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-emerald-800 truncate">{appliedCoupon.code}</p>
                      <p className="text-[11px] text-emerald-700/80 truncate">{appliedCoupon.description || `You save ₹${appliedCoupon.discount}`}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs font-bold text-emerald-700">−₹{appliedCoupon.discount}</span>
                    <button onClick={removeCoupon} className="text-rose-500 hover:text-rose-700 p-1 rounded-md" data-testid="btn-remove-coupon">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter code"
                      value={couponCode}
                      onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError(""); }}
                      className={`${inputCls} flex-1 uppercase tracking-wider`}
                      data-testid="input-coupon-code"
                    />
                    <Button
                      onClick={handleApplyCoupon}
                      disabled={couponLoading || !couponCode.trim()}
                      className="bg-[#D4AF37] hover:bg-[#c4a030] text-[#6D2B35] font-semibold px-4 h-10 rounded-md text-[13px]"
                      data-testid="btn-apply-coupon"
                    >
                      {couponLoading ? "..." : "Apply"}
                    </Button>
                  </div>
                  {couponError && <p className="text-[11px] text-rose-600" data-testid="coupon-error">{couponError}</p>}
                  <div className="flex flex-wrap gap-1.5">
                    {["WELCOME10", "VEDIC50", "DIVINE15"].map((code) => (
                      <button
                        key={code}
                        onClick={() => setCouponCode(code)}
                        className="text-[11px] border border-dashed border-[#D4AF37]/60 text-[#6D2B35] hover:bg-[#FBF7EE] px-2.5 h-7 rounded-md transition-colors flex items-center gap-1 font-semibold"
                        data-testid={`coupon-suggest-${code}`}
                      >
                        <Gift className="h-2.5 w-2.5" />
                        {code}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* Payment method */}
            <section className="bg-white rounded-md border border-[#D4AF37]/25 p-4 md:p-5" data-testid="section-payment">
              <p className={sectionLabelCls}>
                <CreditCard className="h-3 w-3 text-[#D4AF37]" /> Payment Method
              </p>
              <div className="space-y-2">
                <button
                  onClick={() => setPaymentMode("prepaid")}
                  className={`w-full text-left rounded-md border p-3.5 transition-colors ${
                    paymentMode === "prepaid"
                      ? "border-[#D4AF37] bg-[#FBF7EE]"
                      : "border-[#D4AF37]/20 hover:border-[#D4AF37]/45"
                  }`}
                  data-testid="btn-payment-prepaid"
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center mt-0.5 flex-shrink-0 ${
                      paymentMode === "prepaid" ? "border-[#D4AF37] bg-[#D4AF37]" : "border-[#5a4a3a]/30"
                    }`}>
                      {paymentMode === "prepaid" && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-[#6D2B35]">Pay Online</span>
                        <span className="text-[10px] font-bold bg-emerald-700 text-white px-1.5 py-0.5 rounded-md uppercase tracking-wider">SAVE {PREPAID_DISCOUNT_PERCENT}%</span>
                      </div>
                      <p className="text-[11px] text-[#5a4a3a]/65 mt-0.5">UPI · Cards · Net Banking · Wallets</p>
                      {paymentMode === "prepaid" && (
                        <p className="text-[11px] font-semibold text-[#D4AF37] mt-1.5 flex items-center gap-1">
                          <Zap className="h-3 w-3" /> Save ₹{Math.round((subtotalAfterCoupon * PREPAID_DISCOUNT_PERCENT) / 100)} on this order
                        </p>
                      )}
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setPaymentMode("cod")}
                  className={`w-full text-left rounded-md border p-3.5 transition-colors ${
                    paymentMode === "cod"
                      ? "border-[#6D2B35] bg-[#FBF7EE]"
                      : "border-[#D4AF37]/20 hover:border-[#6D2B35]/35"
                  }`}
                  data-testid="btn-payment-cod"
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center mt-0.5 flex-shrink-0 ${
                      paymentMode === "cod" ? "border-[#6D2B35] bg-[#6D2B35]" : "border-[#5a4a3a]/30"
                    }`}>
                      {paymentMode === "cod" && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Banknote className="h-3.5 w-3.5 text-[#6D2B35]" />
                        <span className="text-sm font-semibold text-[#6D2B35]">Cash on Delivery</span>
                      </div>
                      <p className="text-[11px] text-[#5a4a3a]/65 mt-0.5">Pay in cash on arrival · ₹40 COD fee</p>
                    </div>
                  </div>
                </button>
              </div>

              <div className="mt-3 pt-3 border-t border-[#D4AF37]/20 flex flex-wrap items-center gap-3 text-[10px] text-[#5a4a3a]/60">
                <span className="flex items-center gap-1"><Shield className="h-3 w-3 text-[#D4AF37]" /> Secure</span>
                <span className="flex items-center gap-1"><Zap className="h-3 w-3 text-[#D4AF37]" /> Instant confirmation</span>
                <span className="flex items-center gap-1"><Truck className="h-3 w-3 text-[#D4AF37]" /> Priority shipping</span>
              </div>
            </section>

            {/* Desktop pay button */}
            <div className="hidden lg:block">
              <Button
                onClick={handlePayment}
                disabled={isProcessing}
                className="w-full bg-[#6D2B35] hover:bg-[#5a1f29] text-[#D4AF37] h-12 text-[13px] font-semibold rounded-md"
                data-testid="button-pay-razorpay"
              >
                {isProcessing
                  ? "Processing..."
                  : paymentMode === "prepaid"
                  ? `Pay ₹${grandTotal.toLocaleString("en-IN")} Securely`
                  : `Place Order — ₹${grandTotal.toLocaleString("en-IN")} (COD)`}
              </Button>
              <p className="text-[11px] text-[#5a4a3a]/55 text-center mt-2">
                {paymentMode === "prepaid"
                  ? "Secured by Razorpay · UPI · Cards · Net Banking · Wallets"
                  : `You will pay ₹${grandTotal.toLocaleString("en-IN")} in cash on delivery`}
              </p>
            </div>
          </div>

          {/* Order summary aside */}
          <aside className="lg:col-span-1">
            <div className="bg-white rounded-md border border-[#D4AF37]/30 p-4 md:p-5 lg:sticky lg:top-24" data-testid="section-summary">
              <p className={sectionLabelCls}>
                <Sparkles className="h-3 w-3 text-[#D4AF37]" /> Order Summary
              </p>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1 -mr-1">
                {items.map((item) => (
                  <div key={item.product.id} className="flex justify-between items-start gap-3 text-xs" data-testid={`cart-item-${item.product.id}`}>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[#5a4a3a] truncate" data-testid={`text-item-name-${item.product.id}`}>{item.product.name}</p>
                      {item.variationLabel && <p className="text-[10px] text-[#D4AF37] font-semibold truncate">{item.variationLabel}</p>}
                      <p className="text-[10px] text-[#5a4a3a]/55">Qty {item.quantity}</p>
                    </div>
                    <p className="font-semibold whitespace-nowrap text-[#6D2B35]" data-testid={`text-item-price-${item.product.id}`}>
                      ₹{(item.product.price * item.quantity).toLocaleString("en-IN")}
                    </p>
                  </div>
                ))}
              </div>

              <div className="my-3 h-px bg-[#D4AF37]/25" />

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-[#5a4a3a]/80">
                  <span>Subtotal</span>
                  <span data-testid="text-subtotal">₹{totalAmount.toLocaleString("en-IN")}</span>
                </div>

                {couponDiscount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span className="flex items-center gap-1"><Percent className="h-3 w-3" /> {effectiveCouponCode === BUNDLE_COUPON_CODE ? "Bundle & Save (8%)" : `Coupon (${effectiveCouponCode})`}</span>
                    <span data-testid="text-coupon-discount">−₹{couponDiscount.toLocaleString("en-IN")}</span>
                  </div>
                )}

                {prepaidDiscount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span className="flex items-center gap-1"><Zap className="h-3 w-3" /> Prepaid {PREPAID_DISCOUNT_PERCENT}%</span>
                    <span data-testid="text-prepaid-discount">−₹{prepaidDiscount.toLocaleString("en-IN")}</span>
                  </div>
                )}

                {loyaltyDiscount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span className="flex items-center gap-1"><Award className="h-3 w-3" /> Loyalty points ({loyaltyDiscount})</span>
                    <span data-testid="text-loyalty-discount">−₹{loyaltyDiscount.toLocaleString("en-IN")}</span>
                  </div>
                )}

                <div className="flex justify-between text-[#5a4a3a]/80">
                  <span>Shipping</span>
                  <span data-testid="text-shipping" className={shipping === 0 ? "text-emerald-700 font-semibold" : ""}>{shipping === 0 ? "FREE" : `₹${shipping}`}</span>
                </div>

                {codCharges > 0 && (
                  <div className="flex justify-between text-amber-700">
                    <span>COD charges</span>
                    <span data-testid="text-cod-charges">+₹{codCharges}</span>
                  </div>
                )}
              </div>

              {(couponDiscount > 0 || prepaidDiscount > 0 || loyaltyDiscount > 0) && (
                <p className="mt-3 text-[11px] font-semibold text-emerald-700 flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 rounded-md px-2.5 py-1.5">
                  <CheckCircle className="h-3.5 w-3.5" />
                  You're saving ₹{(couponDiscount + prepaidDiscount + loyaltyDiscount).toLocaleString("en-IN")}
                </p>
              )}

              {/* Loyalty redemption — visible only when logged-in COD with available balance */}
              {user && loyaltyData && loyaltyMax > 0 && (
                <div className="mt-3 rounded-md border border-[#D4AF37]/40 bg-[#FBF7EE] p-3" data-testid="block-loyalty-redeem">
                  <div className="flex items-center justify-between gap-2">
                    <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={loyaltyEnabled}
                        onChange={(e) => {
                          setLoyaltyEnabled(e.target.checked);
                          if (e.target.checked && loyaltyPoints === 0) setLoyaltyPoints(loyaltyMax);
                        }}
                        className="h-4 w-4 rounded border-[#6D2B35]/30 accent-[#6D2B35]"
                        data-testid="checkbox-use-loyalty"
                        aria-label="Use loyalty points"
                      />
                      <Award className="h-3.5 w-3.5 text-[#D4AF37] flex-shrink-0" />
                      <span className="text-[12px] font-bold text-[#6D2B35] truncate">Use Vedic Points</span>
                    </label>
                    <span className="text-[10px] text-[#5a4a3a]/70 whitespace-nowrap" data-testid="text-loyalty-balance-checkout">
                      Balance: <span className="font-bold text-[#6D2B35]">{loyaltyData.balance}</span>
                    </span>
                  </div>
                  {loyaltyEnabled && (
                    <div className="mt-2.5 flex items-center gap-2">
                      <Input
                        type="number"
                        min={0}
                        max={loyaltyMax}
                        step={1}
                        value={loyaltyPoints}
                        onChange={(e) => {
                          const v = Math.max(0, Math.min(loyaltyMax, Math.floor(Number(e.target.value) || 0)));
                          setLoyaltyPoints(v);
                        }}
                        className="h-9 text-sm flex-1 bg-white"
                        data-testid="input-loyalty-points"
                        aria-label="Points to redeem"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setLoyaltyPoints(loyaltyMax)}
                        className="h-9 text-[11px] font-semibold border-[#6D2B35]/30 text-[#6D2B35]"
                        data-testid="btn-loyalty-max"
                      >
                        Max
                      </Button>
                    </div>
                  )}
                  <p className="mt-2 text-[10px] text-[#5a4a3a]/70 leading-snug">
                    1 point = ₹1 off · up to 20% of order ({loyaltyMax} pts max on this order)
                    {paymentMode !== "cod" && <span className="block text-amber-700 font-semibold mt-0.5">Available on Cash on Delivery only</span>}
                  </p>
                </div>
              )}

              <div className="my-3 h-px bg-[#D4AF37]/25" />

              <div className="flex items-baseline justify-between">
                <span className="text-[10px] uppercase tracking-[0.3em] text-[#6D2B35] font-bold">Total</span>
                <span className="font-serif font-bold text-2xl text-[#6D2B35]" data-testid="text-grand-total">₹{grandTotal.toLocaleString("en-IN")}</span>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Sticky mobile pay bar */}
      <div className="fixed bottom-[58px] left-0 right-0 z-40 lg:hidden bg-white border-t border-[#D4AF37]/30">
        <div className="px-3 py-2 flex items-center justify-between gap-3">
          <div className="flex items-baseline gap-1.5 min-w-0">
            <span className="text-[10px] uppercase tracking-wider text-[#5a4a3a]/55">Total</span>
            <span className="font-bold text-base text-[#6D2B35] truncate" data-testid="text-mobile-grand-total">₹{grandTotal.toLocaleString("en-IN")}</span>
          </div>
          <Button
            onClick={handlePayment}
            disabled={isProcessing}
            className="flex-1 max-w-[200px] bg-[#6D2B35] hover:bg-[#5a1f29] text-[#D4AF37] rounded-md font-semibold text-[13px] h-10"
            data-testid="button-pay-mobile"
          >
            {isProcessing ? "Processing..." : paymentMode === "prepaid" ? "Pay Now" : "Place Order"}
          </Button>
        </div>
      </div>
    </div>
  );
}

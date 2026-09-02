import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, Tag, CheckCircle, X, Gift, Zap, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

export default function CartPage() {
  const { items, totalItems, totalAmount, removeFromCart, updateQuantity, clearCart } = useCart();
  const { toast } = useToast();
  const { requireAuth } = useAuth();
  const [, setLocation] = useLocation();

  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    id: number; code: string; discount: number; description: string | null;
  } | null>(null);
  const [couponError, setCouponError] = useState("");

  // The current auto "Bundle & Save" coupon object (8% off when the cart holds
  // 2+ distinct products), or null. Mirrors the server's trusted recompute.
  function currentBundleCoupon() {
    const distinct = new Set(items.map((i) => i.product.id)).size;
    const discount = distinct >= 2 ? Math.round((totalAmount * 8) / 100) : 0;
    if (discount <= 0) return null;
    return {
      id: -1,
      code: "BUNDLE8",
      discount,
      description: "Bundle & Save — 8% off for buying together",
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
          // Bundle already saves at least as much — keep it (derived) instead of
          // storing the weaker coupon.
          setAppliedCoupon(null);
          setCouponError("");
          toast({ title: "Even better offer applied", description: `Your bundle saves ₹${bundle.discount} — more than ${data.coupon.code}.` });
        } else {
          setAppliedCoupon({ id: data.coupon.id, code: data.coupon.code, discount: data.discount, description: data.coupon.description });
          setCouponError("");
          toast({ title: "Coupon Applied!", description: data.message });
        }
      } else {
        setCouponError(data.message);
        setAppliedCoupon(null);
      }
    } catch {
      setCouponError("Failed to validate coupon");
    }
    setCouponLoading(false);
  }

  // Smart Checkout: auto-apply best public coupon when user opens cart and hasn't picked one
  const autoTriedRef = useRef<number>(0);
  useEffect(() => {
    if (appliedCoupon) return;
    if (totalAmount <= 0) return;
    if (autoTriedRef.current === totalAmount) return;
    autoTriedRef.current = totalAmount;
    // "Bundle & Save" (8% for 2+ distinct products) competes with the best
    // public coupon; the larger wins (mirrored server-side).
    const bundle = currentBundleCoupon();
    // Only persist a real public coupon when it beats the auto bundle; the
    // bundle is derived every render (never stored), so no stale snapshot.
    fetch(`/api/coupons/best?orderAmount=${totalAmount}`)
      .then((r) => r.json())
      .then((data) => {
        if (appliedCoupon) return;
        const best = data?.best;
        if (best && best.discount > (bundle?.discount || 0)) {
          setAppliedCoupon({
            id: best.id,
            code: best.code,
            discount: best.discount,
            description: best.description,
          });
          toast({
            title: "Best offer auto-applied",
            description: `${best.code} — you save ₹${best.discount}`,
          });
        } else if (bundle) {
          toast({ title: "Bundle saving applied", description: `You save ₹${bundle.discount} for buying together` });
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalAmount]);

  function removeCoupon() {
    // The auto bundle is derived every render, so clearing the manual coupon
    // lets the bundle (if still eligible) remain active automatically.
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError("");
  }

  const shippingCost = totalAmount >= 499 ? 0 : 49;
  // Effective discount = larger of the applied coupon and the live bundle,
  // recomputed each render so the preview matches what checkout/server grant.
  const _bundleNow = currentBundleCoupon();
  const _manualCoupon = appliedCoupon && appliedCoupon.code !== "BUNDLE8" ? appliedCoupon : null;
  const _manualCouponDiscount = _manualCoupon?.discount || 0;
  const bundleWins = (_bundleNow?.discount || 0) > _manualCouponDiscount;
  const effectiveCouponCode = bundleWins ? "BUNDLE8" : (_manualCoupon?.code || "");
  const rawDiscount = bundleWins ? (_bundleNow?.discount || 0) : _manualCouponDiscount;
  const couponDiscount = Math.min(rawDiscount, totalAmount);
  const orderTotal = Math.max(0, totalAmount - couponDiscount) + shippingCost;

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center bg-white px-4 py-12">
        <div className="text-center max-w-md w-full">
          <div className="w-16 h-16 rounded-md bg-[#FBF7EE] border border-[#D4AF37]/30 flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="h-7 w-7 text-[#6D2B35]/50" strokeWidth={1.6} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif text-[#6D2B35] mb-3 font-semibold tracking-tight" data-testid="text-empty-cart">Your Cart is Empty</h1>
          <p className="text-sm text-[#5a4a3a]/70 mb-6 leading-relaxed">Explore our collection of authentic spiritual products and add items to your cart.</p>
          <div className="flex flex-wrap items-center justify-center gap-2.5 mb-6">
            <Link href="/spiritual-essentials">
              <Button className="rounded-md bg-[#6D2B35] hover:bg-[#5a1f29] text-[#D4AF37] h-10 px-5 text-[13px] font-semibold" data-testid="btn-continue-shopping">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Continue Shopping
              </Button>
            </Link>
            <Link href="/puja-samagri-online?sort=bestsellers">
              <Button variant="outline" className="rounded-md border-[#D4AF37]/40 text-[#6D2B35] hover:bg-[#FBF7EE] h-10 px-5 text-[13px] font-semibold" data-testid="btn-browse-bestsellers">
                <Sparkles className="h-4 w-4 mr-2 text-[#D4AF37]" />
                Browse Bestsellers
              </Button>
            </Link>
          </div>
          <div className="bg-[#FBF7EE] border border-[#D4AF37]/25 rounded-md px-4 py-3 inline-flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[11px] sm:text-[12px] text-[#5a4a3a]/80" data-testid="strip-cart-trust">
            <span className="inline-flex items-center gap-1.5"><CheckCircle className="h-3 w-3 text-emerald-700" /> Free shipping ₹499+</span>
            <span className="text-[#D4AF37]/40">·</span>
            <span className="inline-flex items-center gap-1.5"><CheckCircle className="h-3 w-3 text-emerald-700" /> 7-day returns</span>
            <span className="text-[#D4AF37]/40">·</span>
            <span className="inline-flex items-center gap-1.5"><CheckCircle className="h-3 w-3 text-emerald-700" /> COD available</span>
            <span className="text-[#D4AF37]/40">·</span>
            <span className="inline-flex items-center gap-1.5"><CheckCircle className="h-3 w-3 text-emerald-700" /> Pan-India + NRI</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen pb-44 lg:pb-20">
      {/* Slim hero */}
      <div className="bg-[#6D2B35] border-b border-[#D4AF37]/30">
        <div className="container mx-auto px-4 py-8 sm:py-10">
          <div className="flex items-center gap-2.5 mb-2">
            <span className="h-px w-6 bg-[#D4AF37]/60" />
            <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.3em] text-[#D4AF37] font-semibold">
              <Sparkles className="w-3 h-3" /> Your Order
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-serif text-white font-semibold tracking-tight" data-testid="text-cart-title">Shopping Cart</h1>
          <p className="text-white/70 mt-1 text-sm">{totalItems} {totalItems === 1 ? "item" : "items"} in your cart</p>
        </div>
      </div>

      <div className="container mx-auto px-3 md:px-4 mt-6 md:mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
          <div className="lg:col-span-2 space-y-3 md:space-y-4">
            {items.map((item) => (
              <div key={item.product.id} className="p-3 md:p-5 bg-white border border-[#D4AF37]/25 rounded-md hover:border-[#D4AF37]/45 transition-colors" data-testid={`cart-item-${item.product.id}`}>
                <div className="flex gap-3 md:gap-5">
                  <div className="w-20 h-20 md:w-28 md:h-28 rounded-md overflow-hidden bg-[#FBF7EE] border border-[#D4AF37]/15 flex-shrink-0">
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-full h-full object-cover mix-blend-multiply"
                      data-testid={`img-cart-product-${item.product.id}`}
                    />
                  </div>
                  <div className="flex-grow min-w-0">
                    <div className="flex justify-between items-start gap-1">
                      <div className="min-w-0">
                        <h3 className="font-serif text-sm md:text-base text-[#6D2B35] font-semibold line-clamp-2 md:line-clamp-1" data-testid={`text-cart-product-name-${item.product.id}`}>
                          {item.product.name}
                        </h3>
                        {item.variationLabel && (
                          <p className="text-[10px] md:text-xs text-[#D4AF37] font-semibold mt-0.5">{item.variationLabel}</p>
                        )}
                        <p className="text-[#5a4a3a]/60 text-xs mt-0.5 md:mt-1 line-clamp-1">{item.product.category}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-md text-[#5a4a3a]/60 hover:text-rose-700 flex-shrink-0 h-8 w-8 md:h-9 md:w-9"
                        onClick={() => removeFromCart(item.product.id)}
                        data-testid={`btn-remove-item-${item.product.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between mt-2 md:mt-3">
                      <div className="flex items-center border border-[#D4AF37]/30 rounded-md bg-white">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 md:h-9 md:w-9 rounded-md touch-manipulation text-[#6D2B35]"
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          data-testid={`btn-decrease-qty-${item.product.id}`}
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </Button>
                        <span className="w-8 text-center font-semibold text-sm text-[#6D2B35]" data-testid={`text-qty-${item.product.id}`}>
                          {item.quantity}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 md:h-9 md:w-9 rounded-md touch-manipulation text-[#6D2B35]"
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          disabled={item.product.productType === "pandit_membership_card" && (
                            item.quantity >= item.product.stock ||
                            items.reduce((sum, cartItem) => sum + (cartItem.product.productType === "pandit_membership_card" ? cartItem.quantity : 0), 0) >= 10
                          )}
                          data-testid={`btn-increase-qty-${item.product.id}`}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <span className="font-bold text-base md:text-lg text-[#6D2B35]" data-testid={`text-item-total-${item.product.id}`}>
                        ₹{(item.product.price * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <div className="flex justify-between items-center pt-2 md:pt-4">
              <Link href="/spiritual-essentials">
                <Button variant="ghost" className="rounded-md h-10 text-[#6D2B35] hover:text-[#D4AF37] text-[13px] font-semibold" data-testid="btn-continue-shopping-bottom">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Continue Shopping
                </Button>
              </Link>
              <Button
                variant="outline"
                className="rounded-md h-10 text-rose-700 border-rose-200 hover:bg-rose-50 text-[13px] font-semibold"
                onClick={clearCart}
                data-testid="btn-clear-cart"
              >
                Clear Cart
              </Button>
            </div>
          </div>

          <div className="lg:col-span-1 space-y-3 md:space-y-4">
            {/* Coupon panel */}
            <div className="p-4 md:p-5 bg-white border border-[#D4AF37]/25 rounded-md">
              <div className="flex items-center gap-2 mb-3">
                <Tag className="h-4 w-4 text-[#D4AF37]" />
                <h3 className="font-serif text-sm font-semibold text-[#6D2B35] uppercase tracking-wider">Have a Coupon?</h3>
              </div>
              {appliedCoupon ? (
                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-md p-3" data-testid="cart-coupon-applied">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                    <div>
                      <span className="font-semibold text-emerald-800 text-sm">{appliedCoupon.code}</span>
                      <p className="text-xs text-emerald-700">-₹{appliedCoupon.discount}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={removeCoupon} className="rounded-md h-8 w-8 text-rose-600" data-testid="btn-cart-remove-coupon">
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      placeholder="Enter coupon code"
                      value={couponCode}
                      onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError(""); }}
                      className="w-full sm:flex-1 uppercase text-sm h-10 rounded-md border-[#D4AF37]/30"
                      data-testid="input-cart-coupon"
                    />
                    <Button
                      onClick={handleApplyCoupon}
                      disabled={couponLoading || !couponCode.trim()}
                      className="w-full sm:w-auto rounded-md bg-[#D4AF37] hover:bg-[#c4a030] text-[#6D2B35] font-semibold h-10 text-[13px]"
                      data-testid="btn-cart-apply-coupon"
                    >
                      {couponLoading ? "..." : "Apply"}
                    </Button>
                  </div>
                  {couponError && <p className="text-xs text-rose-600">{couponError}</p>}
                  <div className="flex flex-wrap gap-1.5">
                    {["WELCOME10", "VEDIC50"].map((code) => (
                      <button
                        key={code}
                        onClick={() => setCouponCode(code)}
                        className="text-xs border border-dashed border-[#D4AF37]/60 text-[#6D2B35] px-3 h-8 rounded-md hover:bg-[#FBF7EE] inline-flex items-center font-semibold"
                        data-testid={`cart-coupon-suggest-${code}`}
                      >
                        <Gift className="h-3 w-3 inline mr-1" />{code}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Prepaid offer panel */}
            <div className="p-3 md:p-4 bg-[#FBF7EE] border border-[#D4AF37]/30 rounded-md">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-md bg-white border border-[#D4AF37]/30 flex items-center justify-center flex-shrink-0">
                  <Zap className="h-4 w-4 text-[#D4AF37]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#6D2B35]">Save extra 5% on prepaid orders</p>
                  <p className="text-xs text-[#5a4a3a]/65">Pay online at checkout and save more!</p>
                </div>
              </div>
            </div>

            {/* Order summary — desktop sticky */}
            <div className="p-5 bg-white border border-[#D4AF37]/30 rounded-md hidden lg:block sticky top-28">
              <h2 className="font-serif text-lg text-[#6D2B35] mb-5 font-semibold tracking-tight" data-testid="text-order-summary">Order Summary</h2>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-[#5a4a3a]/65">Subtotal ({totalItems} items)</span>
                  <span className="font-medium text-[#6D2B35]" data-testid="text-subtotal">₹{totalAmount.toLocaleString()}</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-sm text-emerald-700">
                    <span>{effectiveCouponCode === "BUNDLE8" ? "Bundle & Save (8%)" : `Coupon (${effectiveCouponCode})`}</span>
                    <span data-testid="text-cart-coupon-discount">-₹{couponDiscount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-[#5a4a3a]/65">Shipping</span>
                  <span className="font-medium text-[#6D2B35]" data-testid="text-shipping">
                    {shippingCost === 0 ? (
                      <span className="text-emerald-700">FREE</span>
                    ) : (
                      `₹${shippingCost}`
                    )}
                  </span>
                </div>
                {totalAmount < 499 && (
                  <p className="text-xs text-[#D4AF37] font-medium" data-testid="text-free-shipping-hint">
                    Add ₹{(499 - totalAmount).toLocaleString()} more for free shipping!
                  </p>
                )}
                <div className="border-t border-[#D4AF37]/25 pt-3">
                  <div className="flex justify-between items-baseline">
                    <span className="font-serif text-base text-[#6D2B35] font-semibold">Total</span>
                    <span className="font-bold text-xl text-[#6D2B35]" data-testid="text-order-total">₹{orderTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <Button
                className="w-full mt-5 bg-[#6D2B35] text-[#D4AF37] hover:bg-[#5a1f29] rounded-md font-semibold text-[13px] h-11"
                data-testid="btn-proceed-checkout"
                onClick={() => requireAuth(
                  () => setLocation("/checkout"),
                  { title: "Sign in to checkout", description: "Please sign in to complete your purchase" }
                )}
              >
                Proceed to Checkout
              </Button>
              <p className="text-xs text-[#5a4a3a]/55 text-center mt-3">
                Secure checkout · Free returns within 7 days
              </p>
            </div>

            {/* Order summary — mobile inline */}
            <div className="p-4 bg-white border border-[#D4AF37]/25 rounded-md lg:hidden">
              <h2 className="font-serif text-base text-[#6D2B35] mb-3 font-semibold tracking-tight" data-testid="text-order-summary-mobile">Order Summary</h2>
              <div className="space-y-2.5">
                <div className="flex justify-between text-sm">
                  <span className="text-[#5a4a3a]/65">Subtotal ({totalItems} items)</span>
                  <span className="font-medium text-[#6D2B35]">₹{totalAmount.toLocaleString()}</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-sm text-emerald-700">
                    <span>{effectiveCouponCode === "BUNDLE8" ? "Bundle & Save (8%)" : `Coupon (${effectiveCouponCode})`}</span>
                    <span>-₹{couponDiscount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-[#5a4a3a]/65">Shipping</span>
                  <span className="font-medium text-[#6D2B35]">
                    {shippingCost === 0 ? (
                      <span className="text-emerald-700">FREE</span>
                    ) : (
                      `₹${shippingCost}`
                    )}
                  </span>
                </div>
                {totalAmount < 499 && (
                  <p className="text-xs text-[#D4AF37] font-medium">
                    Add ₹{(499 - totalAmount).toLocaleString()} more for free shipping!
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky mobile checkout */}
      <div className="fixed bottom-[58px] left-0 right-0 z-40 lg:hidden bg-white border-t border-[#D4AF37]/30">
        <div className="px-3 py-2 flex items-center justify-between gap-3">
          <div className="flex items-baseline gap-1.5 min-w-0">
            <span className="text-[10px] uppercase tracking-wider text-[#5a4a3a]/55">Total</span>
            <span className="font-bold text-base text-[#6D2B35] truncate" data-testid="text-mobile-order-total">₹{orderTotal.toLocaleString()}</span>
          </div>
          <Button
            className="flex-1 max-w-[180px] bg-[#6D2B35] text-[#D4AF37] hover:bg-[#5a1f29] rounded-md font-semibold text-[13px] h-10"
            data-testid="btn-proceed-checkout-mobile"
            onClick={() => requireAuth(
              () => setLocation("/checkout"),
              { title: "Sign in to checkout", description: "Please sign in to complete your purchase" }
            )}
          >
            Checkout
          </Button>
        </div>
      </div>
    </div>
  );
}

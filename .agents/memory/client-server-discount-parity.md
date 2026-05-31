---
name: Client/server discount parity at checkout
description: Why any client-displayed discount must equal the server's trusted recompute, and how the auto "bundle" discount is modeled to guarantee that.
---

# Client/server discount parity at checkout

Checkout/payment will HARD-FAIL when the client total diverges from the
server's recompute: `/api/checkout` rejects on `|computedTotal - totalAmount| > ₹1`,
and the Razorpay verify path rejects when `amount_paid` != server total (after
the customer was already charged). So every discount the client *shows* must be
exactly what the server *grants*.

**Why:** the server is authoritative — it recomputes prices from the products
table and recomputes every discount from trusted cart items, ignoring whatever
amounts the client posts. If the client shows/sends a different number, the
order silently dies (COD) or the payment is taken then voided (prepaid).

## The auto "Bundle & Save" discount (8% when ≥2 distinct products)

It is routed through the EXISTING coupon slot (`couponCode`/`couponDiscount`)
as a synthetic code `BUNDLE8`, NOT a new field — so invoice/GST proportional
distribution and order persistence stay unchanged. Server rule: grant the
larger of (real coupon, bundle); they do not stack. Prepaid 5% still stacks on
top. `BUNDLE8` is intentionally NOT a row in the coupons table —
`getCouponByCode("BUNDLE8")` returns null, and coupon usage is never
incremented at checkout (only validated), so a synthetic code is safe.

## How to apply (the rules that keep client == server)

- **Derive, never persist.** The bundle must be recomputed from the live cart
  every render (a `currentBundleCoupon()` helper), never stored in
  `appliedCoupon` state. A persisted snapshot goes stale when the cart drops
  below 2 distinct items and re-introduces the fatal mismatch.
- **Economics layer, not just the auto-apply effect.** Compute
  `effective = max(realCoupon, bundle)` in the render-time economics (the same
  place totals are computed), so a manually-applied weaker coupon, coupon
  removal, or a quantity change can't leave a stale total. Doing it only inside
  the `!appliedCoupon` auto-effect is the classic bug.
- **Send the effective pair.** All order POST bodies (COD + prepaid) and
  analytics (`trackPurchase`) must send the effective code + effective discount,
  not `appliedCoupon.code`.
- **Clamp.** `couponDiscount = Math.min(rawDiscount, totalAmount)` so the
  post-discount subtotal never goes negative (matters for fixed-amount coupons
  and the prepaid % computed on it).
- `appliedCoupon` should only ever hold a REAL coupon; defensively ignore any
  entry whose code === the bundle code when reading manual discount.

This same client-computes-on-`product.price` vs server-computes-on-`salePrice||price`
divergence already exists for the prepaid/coupon discounts — it's inherited, not
introduced by the bundle.

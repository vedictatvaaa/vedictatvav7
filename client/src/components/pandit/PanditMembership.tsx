import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { panditApi } from "@/lib/panditAuth";
import { Crown, Check, Loader2, Sparkles, ShieldCheck } from "lucide-react";

type TierId = "free" | "silver" | "gold" | "guru_elite";
type Tier = {
  label: string; priceInr: number; commissionPct: number; referralPct: number;
  reach: "nearby" | "city" | "state" | "national"; reachLabel: string;
  visibilityBoost: string; supportSla: string; features: string[];
};
type Resp = {
  currentTier: TierId; rawTier?: TierId; tierExpiresAt?: string | null;
  expired?: boolean; commissionPct: number; tiers: Record<string, Tier>;
};

const ORDER: TierId[] = ["free", "silver", "gold", "guru_elite"];

const TIER_VISUAL: Record<string, { ring: string; chip: string; accent: string }> = {
  free:       { ring: "border-[#D4AF37]/20",                                            chip: "bg-[#5a4a3a]/10 text-[#5a4a3a]",       accent: "text-[#5a4a3a]" },
  silver:     { ring: "border-[#9CA3AF]/40 shadow-sm",                                  chip: "bg-[#9CA3AF]/20 text-[#374151]",       accent: "text-[#374151]" },
  gold:       { ring: "border-[#D4AF37]/70 shadow-md",                                  chip: "bg-[#D4AF37]/25 text-[#6D2B35]",       accent: "text-[#6D2B35]" },
  guru_elite: { ring: "border-[#6D2B35]/60 shadow-lg ring-2 ring-[#D4AF37]/30",         chip: "bg-[#6D2B35] text-[#FFFAEC]",          accent: "text-[#6D2B35]" },
};

function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export default function PanditMembership() {
  const { toast } = useToast();
  const [data, setData] = useState<Resp | null>(null);
  const [loading, setLoading] = useState(true);
  const [buyingTier, setBuyingTier] = useState<TierId | null>(null);

  async function refresh() {
    try { setData(await panditApi("GET", "/api/pandit/membership") as Resp); }
    catch (e: any) { toast({ title: "Failed to load membership", description: e?.message, variant: "destructive" }); }
  }

  useEffect(() => {
    (async () => { await refresh(); setLoading(false); })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleBuy(targetTier: TierId) {
    if (targetTier === "free" || buyingTier) return;
    setBuyingTier(targetTier);
    try {
      const ok = await loadRazorpay();
      if (!ok) throw new Error("Payment gateway could not be loaded. Please retry.");

      const order: any = await panditApi("POST", "/api/pandit/membership/order", { tier: targetTier });

      const rzp = new (window as any).Razorpay({
        key: order.key,
        amount: order.amount,
        currency: order.currency,
        order_id: order.razorpayOrderId,
        name: "Vedic Tatva",
        description: `${data?.tiers[targetTier]?.label} Membership (1 year)`,
        theme: { color: "#6D2B35" },
        handler: async (resp: any) => {
          try {
            const v = await panditApi("POST", "/api/pandit/membership/verify", {
              purchaseId: order.purchaseId,
              razorpay_order_id: resp.razorpay_order_id,
              razorpay_payment_id: resp.razorpay_payment_id,
              razorpay_signature: resp.razorpay_signature,
            });
            if (v?.success) {
              toast({ title: "Welcome to " + data?.tiers[targetTier]?.label, description: "Your new tier is active." });
              await refresh();
            } else {
              throw new Error(v?.message || "Verification failed");
            }
          } catch (e: any) {
            toast({ title: "Payment verification failed", description: e?.message, variant: "destructive" });
          } finally {
            setBuyingTier(null);
          }
        },
        modal: {
          ondismiss: () => setBuyingTier(null),
        },
      });
      rzp.open();
    } catch (e: any) {
      toast({ title: "Could not start checkout", description: e?.message, variant: "destructive" });
      setBuyingTier(null);
    }
  }

  if (loading || !data) {
    return <Card><CardContent className="p-10 flex items-center justify-center text-sm text-[#5a4a3a]/70"><Loader2 className="h-4 w-4 animate-spin mr-2" />Loading membership…</CardContent></Card>;
  }

  const current = data.tiers[data.currentTier];
  const currentIdx = ORDER.indexOf(data.currentTier);
  const expiryStr = data.tierExpiresAt ? new Date(data.tierExpiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : null;

  return (
    <div className="space-y-4">
      {/* Current tier banner */}
      <Card className="border-[#D4AF37]/40 bg-gradient-to-br from-[#FFFAEC] to-[#F5E9D0]">
        <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-[#6D2B35] flex items-center justify-center"><Crown className="h-6 w-6 text-[#D4AF37]" /></div>
            <div>
              <div className="text-[10px] uppercase tracking-wide text-[#5a4a3a]/65 font-bold">Your current tier</div>
              <div className="text-2xl font-serif font-bold text-[#4a1a22]" data-testid="text-current-tier">{current.label}</div>
              <div className="text-xs text-[#5a4a3a]/70">Platform commission: <span className="font-bold text-[#6D2B35]">{data.commissionPct}%</span>{expiryStr && data.currentTier !== "free" && <> · Renews on <span className="font-bold text-[#4a1a22]">{expiryStr}</span></>}</div>
              {data.expired && (
                <div className="text-[11px] text-red-700 font-bold mt-0.5">Your paid plan has lapsed — renew below to restore visibility.</div>
              )}
            </div>
          </div>
          <div className="text-right text-[11px] text-[#5a4a3a]/75">
            <div>Reach: <span className="font-bold text-[#4a1a22]">{current.reachLabel}</span></div>
            <div>Referral commission: <span className="font-bold text-[#D4AF37]">{current.referralPct}%</span></div>
            <div>Visibility: {current.visibilityBoost}</div>
            <div>Support: {current.supportSla}</div>
          </div>
        </CardContent>
      </Card>

      {/* Tier comparison */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
        {ORDER.map((id, idx) => {
          const t = data.tiers[id];
          if (!t) return null;
          const isCurrent = id === data.currentTier;
          const isUpgrade = idx > currentIdx;
          const v = TIER_VISUAL[id];
          return (
            <Card key={id} className={`${v.ring} ${isCurrent ? "bg-[#FFFAEC]" : ""}`} data-testid={`tier-card-${id}`}>
              <CardContent className="p-4 flex flex-col h-full">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-serif text-lg font-bold text-[#4a1a22] flex items-center gap-1.5">
                    {t.label}
                    {id === "guru_elite" && <ShieldCheck className="h-4 w-4 text-[#D4AF37]" />}
                  </div>
                  {isCurrent && <Badge className={v.chip}>Current</Badge>}
                  {isUpgrade && !isCurrent && <Badge variant="outline" className="border-[#D4AF37]/40 text-[#6D2B35]"><Sparkles className="h-3 w-3 mr-1" />Upgrade</Badge>}
                </div>

                <div className="mt-3">
                  {t.priceInr === 0 ? (
                    <div className="text-2xl font-bold text-[#4a1a22]">Free</div>
                  ) : (
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-[#4a1a22]">₹{t.priceInr.toLocaleString("en-IN")}</span>
                      <span className="text-xs text-[#5a4a3a]/70">/year</span>
                    </div>
                  )}
                </div>

                <div className="mt-3 rounded-md bg-[#FBF7EE] border border-[#D4AF37]/20 p-2">
                  <div className="text-[9px] uppercase tracking-wide text-[#5a4a3a]/65 font-bold">Search reach</div>
                  <div className="text-sm font-bold text-[#4a1a22] leading-tight mt-0.5">{t.reachLabel}</div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-2xl font-bold text-[#6D2B35]">{t.commissionPct}<span className="text-sm">%</span></div>
                    <div className="text-[9px] uppercase tracking-wide text-[#5a4a3a]/65 font-bold leading-tight">Platform fee on bookings</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-[#D4AF37]">{t.referralPct}<span className="text-sm">%</span></div>
                    <div className="text-[9px] uppercase tracking-wide text-[#5a4a3a]/65 font-bold leading-tight">You earn on referrals</div>
                  </div>
                </div>
                <div className="mt-3 text-[11px] text-[#5a4a3a]/75 space-y-0.5">
                  <div>Visibility: <span className="text-[#4a1a22]">{t.visibilityBoost}</span></div>
                  <div>Support: <span className="text-[#4a1a22]">{t.supportSla}</span></div>
                </div>
                <ul className="mt-3 space-y-1.5 text-xs text-[#4a1a22]/85 flex-1">
                  {t.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <Check className="h-3.5 w-3.5 text-[#6D2B35] mt-0.5 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-4">
                  {id === "free" ? (
                    <Button variant="outline" className="w-full" disabled data-testid={`btn-tier-${id}`}>Default plan</Button>
                  ) : isCurrent && !data.expired ? (
                    <Button variant="outline" className="w-full" disabled data-testid={`btn-tier-${id}`}>Active</Button>
                  ) : (
                    <Button
                      className="w-full bg-[#6D2B35] hover:bg-[#4a1a22] text-[#FFFAEC]"
                      onClick={() => handleBuy(id)}
                      disabled={buyingTier !== null}
                      data-testid={`btn-buy-${id}`}
                    >
                      {buyingTier === id ? (
                        <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" />Opening checkout…</>
                      ) : isCurrent && data.expired ? (
                        <>Renew · ₹{t.priceInr.toLocaleString("en-IN")}</>
                      ) : (
                        <>{idx > currentIdx ? "Upgrade" : "Switch"} · ₹{t.priceInr.toLocaleString("en-IN")}</>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="text-[11px] text-[#5a4a3a]/65 text-center">
        Secure payment via Razorpay. Membership is valid for 1 year from activation. GST invoice emailed on completion.
      </div>
    </div>
  );
}

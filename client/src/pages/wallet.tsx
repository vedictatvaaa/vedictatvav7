import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Wallet as WalletIcon, Plus, ArrowDownCircle, ArrowUpCircle, Sparkles } from "lucide-react";
import { getIdentity, identityFetch, identityHeaders } from "@/lib/userIdentity";

declare global { interface Window { Razorpay: any; } }

type WalletData = { wallet: { balancePaise: number; totalRechargedPaise: number; totalSpentPaise: number }; recent: any[] };

const TIERS = [
  { paise: 50000,   label: "₹500",   bonusPct: 5 },
  { paise: 100000,  label: "₹1,000", bonusPct: 10 },
  { paise: 200000,  label: "₹2,000", bonusPct: 15 },
  { paise: 500000,  label: "₹5,000", bonusPct: 15 },
];

function loadRazorpay(): Promise<boolean> {
  return new Promise(resolve => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export default function WalletPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [data, setData] = useState<WalletData | null>(null);
  const [busy, setBusy] = useState(false);
  const [customAmount, setCustomAmount] = useState("");

  const id = getIdentity();
  useEffect(() => {
    if (!id) { setLocation("/login"); return; }
    refresh();
  }, []);

  async function refresh() {
    try { setData(await identityFetch<WalletData>("/api/wallet")); }
    catch (e: any) { toast({ title: "Could not load wallet", description: e.message, variant: "destructive" }); }
  }

  async function recharge(amountPaise: number) {
    if (amountPaise < 5000) return toast({ title: "Minimum recharge is ₹50", variant: "destructive" });
    setBusy(true);
    try {
      const order = await identityFetch<any>("/api/wallet/recharge/order", {
        method: "POST", body: JSON.stringify({ amountPaise }),
      });
      if (order.mock) {
        // Dev path — straight to verify with the mock id.
        const v = await identityFetch<any>("/api/wallet/recharge/verify", {
          method: "POST",
          body: JSON.stringify({
            razorpay_order_id: order.orderId,
            razorpay_payment_id: `mock_pay_${Date.now()}`,
            razorpay_signature: "mock",
            amountPaise,
          }),
        });
        toast({ title: "Wallet credited (dev)", description: `+₹${(v.creditedPaise / 100).toFixed(2)}` });
        await refresh();
        return;
      }
      const ok = await loadRazorpay();
      if (!ok) return toast({ title: "Could not load payment SDK", variant: "destructive" });
      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: amountPaise,
        currency: "INR",
        name: "Vedic Tatva",
        description: "Wallet recharge",
        order_id: order.orderId,
        prefill: { email: id?.email },
        theme: { color: "#6D2B35" },
        handler: async (resp: any) => {
          try {
            const v = await identityFetch<any>("/api/wallet/recharge/verify", {
              method: "POST", body: JSON.stringify(resp),
            });
            toast({ title: "Wallet credited", description: `+₹${(v.creditedPaise / 100).toFixed(2)}` });
            await refresh();
          } catch (e: any) {
            toast({ title: "Verification failed", description: e.message, variant: "destructive" });
          }
        },
      });
      rzp.open();
    } catch (e: any) {
      toast({ title: "Recharge failed", description: e.message, variant: "destructive" });
    } finally { setBusy(false); }
  }

  if (!data) return <div className="container mx-auto p-8">Loading wallet...</div>;
  const balance = data.wallet.balancePaise / 100;

  return (
    <div className="min-h-screen bg-[#FBF7EE]">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Card className="bg-gradient-to-br from-[#6D2B35] to-[#8B3A47] text-white border-0 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <WalletIcon className="h-5 w-5" /> My Wallet
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold" data-testid="text-wallet-balance">₹{balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
            <div className="text-sm opacity-80 mt-1">Available balance</div>
            <div className="flex gap-4 mt-4 text-xs opacity-80">
              <div>Total recharged: ₹{(data.wallet.totalRechargedPaise / 100).toLocaleString("en-IN")}</div>
              <div>Total spent: ₹{(data.wallet.totalSpentPaise / 100).toLocaleString("en-IN")}</div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader><CardTitle className="text-lg">Recharge Wallet</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {TIERS.map(t => (
                <button
                  key={t.paise}
                  disabled={busy}
                  onClick={() => recharge(t.paise)}
                  data-testid={`button-recharge-${t.paise}`}
                  className="border border-[#D4AF37]/40 rounded-md p-3 text-center hover-elevate active-elevate-2 disabled:opacity-50"
                >
                  <div className="text-lg font-semibold text-[#6D2B35]">{t.label}</div>
                  {t.bonusPct > 0 && (
                    <Badge className="mt-1 bg-[#D4AF37]/20 text-[#6D2B35] border-[#D4AF37]/40">
                      <Sparkles className="h-3 w-3 mr-1" /> +{t.bonusPct}% bonus
                    </Badge>
                  )}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                type="number"
                min={50}
                placeholder="Custom amount (₹)"
                value={customAmount}
                onChange={e => setCustomAmount(e.target.value)}
                data-testid="input-custom-recharge"
              />
              <Button
                onClick={() => {
                  const n = Number(customAmount);
                  if (!Number.isFinite(n) || n < 50) return toast({ title: "Min ₹50", variant: "destructive" });
                  recharge(Math.floor(n * 100));
                }}
                disabled={busy}
                data-testid="button-recharge-custom"
              >
                <Plus className="h-4 w-4 mr-1" /> Recharge
              </Button>
            </div>
            <div className="text-xs text-[#5a4a3a] mt-3">
              Bonus tiers: ₹500+ → +5% · ₹1,000+ → +10% · ₹2,000+ → +15%. Bonuses credited instantly.
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Recent Activity</CardTitle></CardHeader>
          <CardContent>
            {data.recent.length === 0 ? (
              <div className="text-sm text-[#5a4a3a]">No transactions yet.</div>
            ) : (
              <div className="space-y-2">
                {data.recent.map(t => (
                  <div key={t.id} className="flex items-center justify-between border-b border-[#D4AF37]/20 pb-2 last:border-0" data-testid={`row-txn-${t.id}`}>
                    <div className="flex items-center gap-2">
                      {t.amountPaise > 0
                        ? <ArrowDownCircle className="h-4 w-4 text-emerald-600" />
                        : <ArrowUpCircle className="h-4 w-4 text-rose-600" />}
                      <div>
                        <div className="text-sm font-medium capitalize">{String(t.kind).replace(/_/g, " ")}</div>
                        <div className="text-xs text-[#5a4a3a]">{t.note || ""} · {new Date(t.createdAt).toLocaleString()}</div>
                      </div>
                    </div>
                    <div className={t.amountPaise > 0 ? "text-emerald-700 font-semibold" : "text-rose-700 font-semibold"}>
                      {t.amountPaise > 0 ? "+" : ""}₹{(t.amountPaise / 100).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

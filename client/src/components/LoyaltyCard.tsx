import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Gift, ChevronRight, History } from "lucide-react";

export function LoyaltyCard() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  useEffect(() => {
    if (!user) return;
    fetch(`/api/loyalty/balance/${user.id}?email=${encodeURIComponent(user.email)}`)
      .then((r) => r.json()).then(setData).catch(() => {});
  }, [user]);
  if (!user || !data) return null;

  return (
    <Card data-testid="card-loyalty">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#D4AF37]" />
              <h3 className="font-serif font-bold text-[#4a1a22]">Vedic Loyalty</h3>
              <Badge className="bg-[#D4AF37]/15 text-[#4a1a22] border border-[#D4AF37]/40">Active</Badge>
            </div>
            <div className="text-3xl font-bold text-[#6D2B35] mt-2" data-testid="text-loyalty-balance">{data.balance} <span className="text-base font-normal text-[#5a4a3a]/70">points</span></div>
            <div className="text-xs text-[#5a4a3a]/70">Worth {data.worth} at checkout</div>
          </div>
          <Link href="/refer">
            <Button size="sm" className="bg-[#6D2B35] hover:bg-[#5a1f29] text-[#D4AF37]" data-testid="btn-refer-earn"><Gift className="h-4 w-4 mr-1.5" />Refer & Earn</Button>
          </Link>
        </div>
        <div className="text-[11px] text-[#5a4a3a]/65 mt-3 grid grid-cols-3 gap-2">
          <div><div className="font-semibold text-[#4a1a22]">Earn</div>{data.rateInfo.earnRate}</div>
          <div><div className="font-semibold text-[#4a1a22]">Redeem</div>{data.rateInfo.redemptionRate}</div>
          <div><div className="font-semibold text-[#4a1a22]">Cap</div>{data.rateInfo.maxPerOrder}</div>
        </div>
        {data.recentTransactions?.length > 0 && (
          <details className="mt-3 group">
            <summary className="text-xs text-[#6D2B35] font-semibold cursor-pointer flex items-center gap-1 hover:underline" data-testid="btn-show-history">
              <History className="h-3 w-3" />Recent activity ({data.recentTransactions.length})
              <ChevronRight className="h-3 w-3 ml-auto group-open:rotate-90 transition-transform" />
            </summary>
            <div className="mt-2 max-h-40 overflow-auto border-t border-[#D4AF37]/20 pt-2 space-y-1">
              {data.recentTransactions.map((t: any) => (
                <div key={t.id} className="flex items-center justify-between text-[11px]" data-testid={`row-loyalty-tx-${t.id}`}>
                  <span className="text-[#5a4a3a]/85 truncate">{t.note || t.reason}</span>
                  <span className={`font-bold ${t.delta > 0 ? "text-emerald-700" : "text-rose-700"}`}>{t.delta > 0 ? "+" : ""}{t.delta}</span>
                </div>
              ))}
            </div>
          </details>
        )}
      </CardContent>
    </Card>
  );
}

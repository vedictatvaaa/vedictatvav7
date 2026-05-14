import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Gift, Copy, Share2, Sparkles, Users, IndianRupee } from "lucide-react";

export default function ReferPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [data, setData] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!user) { setLocation("/login"); return; }
    fetch(`/api/referrals/me/${user.id}?email=${encodeURIComponent(user.email)}`)
      .then((r) => r.json()).then(setData);
  }, [user]);

  if (!user || !data) return <div className="p-8 text-center text-sm text-[#5a4a3a]">Loading your referral details...</div>;

  const copy = (txt: string) => { navigator.clipboard.writeText(txt); toast({ title: "Copied!", description: txt }); };
  const shareText = `Begin your spiritual journey with Vedic Tatva — authentic puja samagri, verified pandits, and Vedic wisdom. Use my code ${data.code} for special benefits: ${data.shareUrl}`;
  const waShare = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

  return (
    <div className="min-h-screen bg-[#FBF7EE] py-6">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="mb-5">
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#4a1a22] flex items-center gap-2" data-testid="text-refer-title">
            <Gift className="h-6 w-6 text-[#D4AF37]" />Refer & Earn
          </h1>
          <p className="text-sm text-[#5a4a3a]/70 mt-1">Share Vedic Tatva with family & friends. You earn <strong>{data.bonusPerReferral} loyalty points (₹{data.bonusPerReferral})</strong> for every friend who completes their first order or puja.</p>
        </div>

        <Card className="bg-gradient-to-br from-[#6D2B35] to-[#4a1a22] text-[#FBF7EE]" data-testid="card-referral-code">
          <CardContent className="p-6 text-center">
            <p className="text-xs uppercase tracking-wider text-[#D4AF37]/80">Your referral code</p>
            <div className="text-4xl md:text-5xl font-serif font-bold text-[#D4AF37] tracking-widest mt-2 mb-3" data-testid="text-referral-code">{data.code}</div>
            <div className="flex flex-wrap gap-2 justify-center">
              <Button size="sm" variant="outline" onClick={() => copy(data.code)} className="bg-[#FBF7EE]/10 border-[#D4AF37]/40 text-[#FBF7EE] hover:bg-[#FBF7EE]/20" data-testid="btn-copy-code"><Copy className="h-3.5 w-3.5 mr-1.5" />Copy code</Button>
              <Button size="sm" variant="outline" onClick={() => copy(data.shareUrl)} className="bg-[#FBF7EE]/10 border-[#D4AF37]/40 text-[#FBF7EE] hover:bg-[#FBF7EE]/20" data-testid="btn-copy-link"><Copy className="h-3.5 w-3.5 mr-1.5" />Copy link</Button>
              <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white border-0" data-testid="btn-share-wa">
                <a href={waShare} target="_blank" rel="noreferrer"><Share2 className="h-3.5 w-3.5 mr-1.5" />Share on WhatsApp</a>
              </Button>
            </div>
            <Input readOnly value={data.shareUrl} className="mt-4 bg-[#FBF7EE]/10 border-[#D4AF37]/30 text-[#FBF7EE] text-xs text-center" data-testid="input-share-url" />
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-3 mt-4">
          <Card><CardContent className="p-4 text-center">
            <Users className="h-5 w-5 text-[#6D2B35] mx-auto mb-1" />
            <div className="text-2xl font-bold text-[#4a1a22]" data-testid="stat-referred">{data.totalReferred}</div>
            <div className="text-[11px] text-[#5a4a3a]/65">Friends referred</div>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <IndianRupee className="h-5 w-5 text-[#D4AF37] mx-auto mb-1" />
            <div className="text-2xl font-bold text-[#4a1a22]" data-testid="stat-earned">{data.bonusEarned}</div>
            <div className="text-[11px] text-[#5a4a3a]/65">Bonus points earned</div>
          </CardContent></Card>
        </div>

        <Card className="mt-4">
          <CardContent className="p-5">
            <h3 className="font-serif font-bold text-[#4a1a22] mb-3 flex items-center gap-2"><Sparkles className="h-4 w-4 text-[#D4AF37]" />How it works</h3>
            <ol className="text-sm text-[#5a4a3a] space-y-2 list-decimal list-inside">
              <li>Share your code or link with family & friends.</li>
              <li>They sign up and enter your code at registration.</li>
              <li>When they complete their first order or puja, <strong>you both win</strong> — you get {data.bonusPerReferral} bonus loyalty points worth ₹{data.bonusPerReferral}.</li>
              <li>Use points at checkout — 1 point = ₹1, up to 20% off any order.</li>
            </ol>
          </CardContent>
        </Card>

        {data.referredUsers?.length > 0 && (
          <Card className="mt-4">
            <CardContent className="p-5">
              <h3 className="font-serif font-bold text-[#4a1a22] mb-3">Your referrals</h3>
              <div className="space-y-2">
                {data.referredUsers.map((r: any) => (
                  <div key={r.id} className="flex items-center justify-between text-sm" data-testid={`row-referral-${r.id}`}>
                    <span className="text-[#4a1a22]">{r.name}</span>
                    {r.bonusPaid
                      ? <Badge className="bg-emerald-100 text-emerald-900 border-emerald-300">Bonus paid</Badge>
                      : <Badge variant="outline" className="text-[10px]">Awaiting first purchase</Badge>}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

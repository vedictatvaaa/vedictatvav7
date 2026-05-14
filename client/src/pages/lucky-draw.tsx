import { useQuery, useMutation } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Trophy, Ticket, Sparkles, Calendar, Clock, MapPin, Gift, Mountain, Snowflake, Landmark, Flame, Crown } from "lucide-react";

const PRIZE_ICONS = [Crown, Trophy, Snowflake, Landmark, Mountain, Flame];

const PRIZES = [
  { name: "Bharat Darshan Yatra (15 days, all-India)", value: "₹2,50,000 value", rank: 1 },
  { name: "12 Jyotirlinga Darshan Yatra", value: "₹1,80,000 value", rank: 2 },
  { name: "Amarnath Yatra by Helicopter", value: "₹1,20,000 value", rank: 3 },
  { name: "Vaishno Devi Helicopter Yatra", value: "₹85,000 value", rank: 4 },
  { name: "Char Dham Yatra (with helicopter Kedarnath)", value: "₹75,000 value", rank: 5 },
  { name: "Kashi Vishwanath + Ayodhya VIP Yatra", value: "₹35,000 value", rank: 6 },
];

function useCountdown(target: Date) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const diff = Math.max(0, target.getTime() - now.getTime());
  const d = Math.floor(diff / (1000 * 60 * 60 * 24));
  const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const m = Math.floor((diff / (1000 * 60)) % 60);
  const s = Math.floor((diff / 1000) % 60);
  return { d, h, m, s };
}

export default function LuckyDrawPage() {
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", phone: "", email: "", productSerial: "", productName: "", orderId: "", preferredYatra: "" });

  const drawYear = new Date().getFullYear() + 1;
  const drawDate = useMemo(() => new Date(`${drawYear}-01-02T11:00:00+05:30`), [drawYear]);
  const cd = useCountdown(drawDate);

  const { data: recent } = useQuery<{ entries: Array<{ id: number; serial: string; firstName: string }>; totalThisYear: number }>({
    queryKey: ["/api/lucky-draw/recent"],
    refetchInterval: 8000,
  });

  const enterMut = useMutation({
    mutationFn: async (payload: any) => {
      const r = await apiRequest("POST", "/api/lucky-draw/enter", payload);
      return r.json();
    },
    onSuccess: () => {
      toast({ title: "Entry confirmed!", description: `You're in for the ${drawYear} draw on January 2nd.` });
      setForm({ name: "", phone: "", email: "", productSerial: "", productName: "", orderId: "", preferredYatra: "" });
    },
    onError: (e: any) => toast({ title: "Entry failed", description: e?.message || "Please try again.", variant: "destructive" }),
  });

  const submit = () => {
    if (!form.name || !form.phone || !form.productSerial) {
      toast({ title: "Name, phone & product serial are required", variant: "destructive" });
      return;
    }
    enterMut.mutate({ ...form, drawYear });
  };

  // Build a continuous marquee from recent entries
  const marqueeItems = recent?.entries?.length ? [...recent.entries, ...recent.entries] : [];

  return (
    <div className="min-h-screen bg-[#0a0511] text-[#f5e6c8]">
      {/* Hero with rotating tombola */}
      <section className="relative overflow-hidden" style={{ background: "radial-gradient(ellipse at top, #4a1a22 0%, #1a0a14 60%, #0a0511 100%)" }}>
        <div className="container mx-auto px-4 py-10 md:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <Badge className="bg-[#D4AF37] text-[#4a1a22] hover:bg-[#D4AF37] mb-3"><Sparkles className="h-3 w-3 mr-1" /> Live 24/7 — Drawn Jan 2, {drawYear}</Badge>
              <h1 className="text-3xl md:text-5xl font-serif font-bold text-white leading-tight" data-testid="text-draw-title">
                Vedic Tatva <span className="text-[#D4AF37]">Lucky Draw</span>
              </h1>
              <p className="text-sm md:text-base text-white/80 mt-3 max-w-xl">
                Every product you buy from Vedic Tatva carries a unique serial number.
                Enter it here for a chance to win an all-expenses-paid <strong className="text-[#D4AF37]">spiritual yatra of a lifetime</strong> — drawn live on January 2nd every year.
              </p>

              {/* Countdown */}
              <div className="mt-5 grid grid-cols-4 gap-2 max-w-md">
                {[
                  { v: cd.d, l: "Days" }, { v: cd.h, l: "Hours" }, { v: cd.m, l: "Mins" }, { v: cd.s, l: "Secs" },
                ].map((x, i) => (
                  <div key={i} className="bg-[#1a0a14] border border-[#D4AF37]/30 rounded-md py-2 text-center">
                    <div className="text-2xl md:text-3xl font-bold text-[#D4AF37] tabular-nums" data-testid={`text-countdown-${x.l.toLowerCase()}`}>{String(x.v).padStart(2, "0")}</div>
                    <div className="text-[9px] uppercase tracking-widest text-white/55">{x.l}</div>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-3 mt-4 text-xs text-white/70">
                <span className="inline-flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-[#D4AF37]" /> Draw: 2 Jan {drawYear}, 11:00 AM IST</span>
                <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-[#D4AF37]" /> Live on YouTube + Instagram</span>
                <span className="inline-flex items-center gap-1.5"><Ticket className="h-3.5 w-3.5 text-[#D4AF37]" /> {recent?.totalThisYear ?? 0} entries so far</span>
              </div>
            </div>

            {/* Tombola */}
            <div className="flex justify-center">
              <div className="relative w-64 h-64 md:w-80 md:h-80">
                <div className="absolute inset-0 rounded-full" style={{ background: "conic-gradient(from 0deg, #D4AF37, #6D2B35, #D4AF37, #4a1a22, #D4AF37, #6D2B35, #D4AF37)", animation: "spin 20s linear infinite" }} />
                <div className="absolute inset-3 rounded-full bg-gradient-to-br from-[#1a0a14] to-[#0a0511] border-4 border-[#D4AF37]/40 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full" style={{ background: "radial-gradient(circle at 30% 30%, rgba(212,175,55,0.18), transparent 60%)", animation: "spin 30s linear infinite reverse" }} />
                  <div className="text-center relative z-10">
                    <Trophy className="h-12 w-12 md:h-16 md:w-16 text-[#D4AF37] mx-auto mb-2 drop-shadow-[0_0_12px_rgba(212,175,55,0.5)]" />
                    <div className="text-[10px] uppercase tracking-[0.3em] text-[#D4AF37]/80">Drawing</div>
                    <div className="text-base md:text-xl font-serif font-bold text-white mt-1">Live Tombola</div>
                  </div>
                </div>
                {/* Pointer */}
                <div className="absolute left-1/2 -top-2 -translate-x-1/2 w-0 h-0 border-l-[12px] border-r-[12px] border-t-[16px] border-l-transparent border-r-transparent border-t-[#D4AF37] drop-shadow-lg" />
              </div>
            </div>
          </div>

          {/* Live ticker */}
          {marqueeItems.length > 0 && (
            <div className="mt-8 overflow-hidden rounded-md bg-[#1a0a14]/60 border border-[#D4AF37]/20">
              <div className="flex items-center gap-2 px-3 py-2 border-b border-[#D4AF37]/10">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] uppercase tracking-widest text-emerald-300/90 font-bold">Live entries</span>
              </div>
              <div className="overflow-hidden">
                <div className="flex gap-6 py-2.5 px-3 whitespace-nowrap" style={{ animation: "marquee 60s linear infinite" }}>
                  {marqueeItems.map((e, idx) => (
                    <span key={`${e.id}-${idx}`} className="text-xs text-white/80">
                      <Ticket className="h-3 w-3 inline mr-1 text-[#D4AF37]" />
                      <strong className="text-[#D4AF37]">{e.firstName}</strong> entered serial <span className="font-mono text-white">#{e.serial}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Prizes */}
      <section className="container mx-auto px-4 py-10 md:py-14">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-white" data-testid="text-prizes-heading">Prize Pool — Yatras Worth ₹7.5 Lakh+</h2>
          <p className="text-sm text-white/65 mt-2">6 winners. All yatras are 100% sponsored by Vedic Tatva.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {PRIZES.map((p) => {
            const Icon = PRIZE_ICONS[p.rank - 1] ?? Trophy;
            return (
            <Card key={p.rank} className="bg-[#1a0a14] border-[#D4AF37]/25 text-white" data-testid={`card-prize-${p.rank}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-md bg-[#6D2B35]/40 border border-[#D4AF37]/30 flex items-center justify-center shrink-0"><Icon className="h-5 w-5 text-[#D4AF37]" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-bold">Prize #{p.rank}</div>
                    <div className="text-sm md:text-base font-serif font-semibold text-white leading-snug mt-0.5">{p.name}</div>
                    <div className="text-xs text-emerald-300/90 mt-1.5 font-semibold">{p.value}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            );
          })}
        </div>
      </section>

      {/* Entry form */}
      <section className="container mx-auto px-4 py-10 md:py-14">
        <Card className="max-w-2xl mx-auto bg-[#1a0a14] border-[#D4AF37]/30 text-white">
          <CardContent className="p-6 md:p-8">
            <div className="text-center mb-5">
              <Gift className="h-10 w-10 text-[#D4AF37] mx-auto mb-2" />
              <h3 className="text-xl md:text-2xl font-serif font-bold text-white">Enter Your Serial Number</h3>
              <p className="text-xs text-white/65 mt-1">Found on the holographic sticker on your Vedic Tatva product packaging.</p>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label htmlFor="ld-name" className="text-white/80">Name *</Label><Input id="ld-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-[#0a0511] border-[#D4AF37]/25 text-white" data-testid="input-ld-name" /></div>
                <div><Label htmlFor="ld-phone" className="text-white/80">Phone *</Label><Input id="ld-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="bg-[#0a0511] border-[#D4AF37]/25 text-white" data-testid="input-ld-phone" /></div>
              </div>
              <div><Label htmlFor="ld-email" className="text-white/80">Email</Label><Input id="ld-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="bg-[#0a0511] border-[#D4AF37]/25 text-white" data-testid="input-ld-email" /></div>
              <div><Label htmlFor="ld-serial" className="text-white/80">Product Serial Number *</Label><Input id="ld-serial" placeholder="e.g. VT-2026-001234" value={form.productSerial} onChange={(e) => setForm({ ...form, productSerial: e.target.value.toUpperCase() })} className="bg-[#0a0511] border-[#D4AF37]/25 text-white font-mono" data-testid="input-ld-serial" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label htmlFor="ld-product" className="text-white/80">Product</Label><Input id="ld-product" placeholder="e.g. 5 Mukhi Rudraksha" value={form.productName} onChange={(e) => setForm({ ...form, productName: e.target.value })} className="bg-[#0a0511] border-[#D4AF37]/25 text-white" data-testid="input-ld-product" /></div>
                <div><Label htmlFor="ld-order" className="text-white/80">Order ID</Label><Input id="ld-order" value={form.orderId} onChange={(e) => setForm({ ...form, orderId: e.target.value })} className="bg-[#0a0511] border-[#D4AF37]/25 text-white" data-testid="input-ld-order" /></div>
              </div>
              <div><Label htmlFor="ld-yatra" className="text-white/80">Preferred Yatra (if you win)</Label><Input id="ld-yatra" placeholder="e.g. Char Dham" value={form.preferredYatra} onChange={(e) => setForm({ ...form, preferredYatra: e.target.value })} className="bg-[#0a0511] border-[#D4AF37]/25 text-white" data-testid="input-ld-yatra" /></div>
              <Button onClick={submit} disabled={enterMut.isPending} className="w-full bg-[#D4AF37] hover:bg-[#c39d2c] text-[#4a1a22] font-bold" data-testid="btn-submit-ld">
                {enterMut.isPending ? "Entering..." : `Enter the ${drawYear} Draw`}
              </Button>
              <p className="text-[10px] text-white/50 text-center">One entry per serial number. Winners notified via call & WhatsApp on 2 Jan {drawYear}.</p>
            </div>
          </CardContent>
        </Card>
      </section>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
      `}</style>
    </div>
  );
}

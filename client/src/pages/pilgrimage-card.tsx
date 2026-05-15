import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Sparkles, Check, Mountain, Hotel, Bus, Utensils, Phone, Calendar, Crown, Heart, Gift, GraduationCap, Users } from "lucide-react";

const YATRA_OPTIONS = [
  "Char Dham (Yamunotri / Gangotri / Kedarnath / Badrinath)",
  "Puri Jagannath",
  "12 Jyotirlinga Darshan",
  "Amarnath",
  "Vaishno Devi",
  "Kashi Vishwanath + Ayodhya",
  "Tirupati Balaji",
  "Maa Kamakhya (Guwahati)",
];

function formatInr(v: number) {
  if (v >= 100000) return `₹${(v / 100000).toFixed(v % 100000 === 0 ? 0 : 1)}L`;
  return `₹${v.toLocaleString("en-IN")}`;
}

export default function PilgrimageCardPage() {
  const { toast } = useToast();
  const [yatras, setYatras] = useState<string[]>([]);
  const [form, setForm] = useState({ name: "", phone: "", email: "", city: "", age: "", giftFor: "", message: "" });
  const [purpose, setPurpose] = useState<"self" | "gift">("self");
  const [sipAmount, setSipAmount] = useState(10000);
  const totalSavings = sipAmount * 60;
  const monthlyLabel = formatInr(sipAmount);
  const totalLabel = formatInr(totalSavings);

  const applyMut = useMutation({
    mutationFn: async (payload: any) => {
      const r = await apiRequest("POST", "/api/pilgrimage-card/apply", payload);
      return r.json();
    },
    onSuccess: () => {
      toast({ title: "Application received", description: "Our membership team will call you within 24 hours." });
      setForm({ name: "", phone: "", email: "", city: "", age: "", giftFor: "", message: "" });
      setYatras([]);
    },
    onError: (e: any) => toast({ title: "Could not submit", description: e?.message || "Please try again.", variant: "destructive" }),
  });

  const toggleYatra = (y: string) => {
    setYatras((prev) => prev.includes(y) ? prev.filter((x) => x !== y) : [...prev, y]);
  };

  const submit = () => {
    if (!form.name || !form.phone || !form.email || !form.city) {
      toast({ title: "Name, phone, email & city are required", variant: "destructive" });
      return;
    }
    const giftNote = purpose === "gift" && form.giftFor ? `[GIFT for: ${form.giftFor}] ` : "";
    applyMut.mutate({
      name: form.name,
      phone: form.phone,
      email: form.email,
      city: form.city,
      age: form.age ? Number(form.age) : undefined,
      monthlySipInr: sipAmount,
      totalCommitmentInr: totalSavings,
      preferredYatras: yatras,
      message: giftNote + (form.message || ""),
    });
  };

  return (
    <div className="min-h-screen bg-[#FBF7EE]">
      {/* Hero */}
      <section className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, #2a0e14 0%, #4a1a22 40%, #6D2B35 100%)" }}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 25% 25%, #D4AF37 0%, transparent 40%), radial-gradient(circle at 75% 75%, #f5d76e 0%, transparent 40%)" }} />
        <div className="container mx-auto px-4 py-12 md:py-20 relative">
          <div className="max-w-3xl">
            <Badge className="bg-[#D4AF37] text-[#4a1a22] hover:bg-[#D4AF37] mb-3"><Crown className="h-3 w-3 mr-1" /> One Card. One Lifetime. Every Sacred Tirth.</Badge>
            <h1 className="text-3xl md:text-5xl font-serif font-bold text-white leading-tight" data-testid="text-card-title">
              Vedic Tatva <span className="text-[#D4AF37]">Pilgrimage Card</span>
            </h1>
            <p className="text-base md:text-lg text-white/85 mt-3 max-w-2xl">
              Save just <strong className="text-[#D4AF37]">{monthlyLabel} a month for 5 years</strong> — and complete <strong className="text-[#D4AF37]">every major Hindu yatra of your life</strong>, fully sponsored by Vedic Tatva. Travel, stay, food, pandit, puja — all included.
            </p>

            {/* SIP Slider */}
            <div className="mt-5 max-w-md bg-white/10 backdrop-blur-sm border border-white/20 rounded-md p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] uppercase tracking-widest text-white/65 font-semibold">Monthly SIP</span>
                <span className="text-xl font-serif font-bold text-[#D4AF37]" data-testid="text-sip-amount">{monthlyLabel}</span>
              </div>
              <input
                type="range"
                min={500}
                max={20000}
                step={500}
                value={sipAmount}
                onChange={(e) => setSipAmount(Number(e.target.value))}
                className="w-full accent-[#D4AF37] cursor-pointer"
                aria-label="Monthly SIP amount"
                data-testid="slider-sip"
              />
              <div className="flex justify-between text-[10px] text-white/50 mt-1">
                <span>₹500</span>
                <span>₹20,000</span>
              </div>
              <p className="text-[12px] text-emerald-300/90 mt-2 font-semibold">
                In 5 years you'll save <span className="text-white font-bold">{totalLabel}</span> — enough for all 8 major yatras, fully covered.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-6 max-w-xl">
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-md py-3 px-2 text-center">
                <div className="text-2xl font-serif font-bold text-[#D4AF37]" data-testid="text-stat-monthly">{monthlyLabel}</div>
                <div className="text-[10px] text-white/80 uppercase tracking-wide">per month</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-md py-3 px-2 text-center">
                <div className="text-2xl font-serif font-bold text-[#D4AF37]">5 yrs</div>
                <div className="text-[10px] text-white/80 uppercase tracking-wide">to save</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-md py-3 px-2 text-center">
                <div className="text-2xl font-serif font-bold text-[#D4AF37]" data-testid="text-stat-total">{totalLabel}</div>
                <div className="text-[10px] text-white/80 uppercase tracking-wide">total saved</div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-6 max-w-2xl">
              {[
                { i: Bus, l: "Travel" },
                { i: Hotel, l: "Stay" },
                { i: Utensils, l: "Sattvic Food" },
                { i: Sparkles, l: "Pandit + Puja" },
              ].map((b, i) => {
                const I = b.i;
                return (
                  <div key={i} className="bg-white/5 border border-white/15 rounded-md py-2.5 text-center">
                    <I className="h-5 w-5 text-[#D4AF37] mx-auto mb-1" />
                    <div className="text-xs text-white/85 font-semibold">{b.l}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="container mx-auto px-4 py-10 md:py-14">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-[#4a1a22]" data-testid="text-howitworks-heading">How the Pilgrimage Card Works</h2>
          <p className="text-sm text-[#5a4a3a]/70 mt-2 max-w-2xl mx-auto">A simple 3-step lifetime arrangement. One card, one savings plan, every sacred yatra.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { n: "01", t: `Save ${monthlyLabel} every month`, d: `For 5 years. That's it. Auto-debit from any bank, like an SIP. Total ${totalLabel} over 5 years.` },
            { n: "02", t: "Card activates from Year 1", d: "You don't have to wait till Year 5. Start your first yatra from Year 1 itself, while you continue saving." },
            { n: "03", t: "Complete every major tirth — once", d: "Char Dham, 12 Jyotirlinga, Amarnath, Vaishno Devi, Puri, Kashi, Tirupati, Kamakhya — each done once across the 5-year window. All-inclusive, all-sponsored." },
          ].map((s, i) => (
            <Card key={i} className="border-[#D4AF37]/25" data-testid={`card-step-${s.n}`}>
              <CardContent className="p-5">
                <div className="text-3xl font-serif font-bold text-[#D4AF37] mb-2">{s.n}</div>
                <h3 className="text-base font-serif font-bold text-[#4a1a22] mb-1.5">{s.t}</h3>
                <p className="text-sm text-[#5a4a3a]/80 leading-relaxed">{s.d}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* What's included */}
      <section className="bg-white border-y border-[#D4AF37]/15">
        <div className="container mx-auto px-4 py-10 md:py-14">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div>
              <h2 className="text-2xl md:text-3xl font-serif font-bold text-[#4a1a22]" data-testid="text-includes-heading">Sacred Yatras Covered — Once Each</h2>
              <p className="text-sm text-[#5a4a3a]/75 mt-2">Each card entitles the holder to do every major Hindu pilgrimage <strong>once</strong>, anytime within the 5-year membership window. Pace it as you like.</p>
              <ul className="mt-5 space-y-2.5">
                {[
                  "Char Dham Yatra — Yamunotri, Gangotri, Kedarnath, Badrinath (one full circuit)",
                  "12 Jyotirlinga Darshan — covered across 3 organized trips",
                  "Amarnath Yatra (helicopter) — once in your card period",
                  "Vaishno Devi (helicopter) — once in your card period",
                  "Puri Jagannath Yatra — once in your card period",
                  "Kashi Vishwanath + Ayodhya Ram Mandir — once in your card period",
                  "Tirupati Balaji VIP darshan — once in your card period",
                  "Maa Kamakhya (Guwahati Shaktipeeth) — once in your card period",
                ].map((line, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-[#4a1a22]">
                    <Check className="h-4 w-4 text-emerald-700 shrink-0 mt-0.5" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-5 bg-[#FBF7EE] border border-[#D4AF37]/25 rounded-md p-4">
                <div className="flex items-center gap-2 text-[#4a1a22] mb-1.5"><Heart className="h-4 w-4 text-[#6D2B35]" /><span className="text-sm font-semibold">Each yatra includes</span></div>
                <p className="text-xs text-[#5a4a3a] leading-relaxed">AC travel (bus/flight/helicopter as listed) • 3-star+ hotel stay (twin sharing) • All sattvic meals • Vedic Tatva pandit + puja samagri • VIP darshan passes • Travel insurance + 24/7 helpline.</p>
              </div>
            </div>

            {/* Pricing card */}
            <Card className="border-2 border-[#D4AF37] shadow-xl overflow-hidden">
              <div className="h-2 w-full bg-gradient-to-r from-[#D4AF37] via-[#f5d76e] to-[#D4AF37]" />
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Badge className="bg-[#6D2B35] text-[#D4AF37]">The Plan</Badge>
                  <CreditCard className="h-6 w-6 text-[#D4AF37]" />
                </div>

                <div className="bg-gradient-to-br from-[#FBF7EE] to-white border border-[#D4AF37]/30 rounded-md p-5 mb-4">
                  <div className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-bold">Monthly SIP</div>
                  <div className="text-4xl font-serif font-bold text-[#4a1a22] mt-1" data-testid="text-pricing-monthly">{monthlyLabel}<span className="text-sm font-normal text-[#5a4a3a]/65">/month</span></div>
                  <div className="text-xs text-[#5a4a3a]/70 mt-2">× 60 months (5 years) = <strong className="text-[#4a1a22]" data-testid="text-pricing-total">{totalLabel} total</strong></div>
                  <div className="mt-3 pt-3 border-t border-[#D4AF37]/20">
                    <div className="text-[10px] uppercase tracking-widest text-emerald-700 font-bold">Market value of yatras covered</div>
                    <div className="text-xl font-bold text-emerald-700 mt-0.5">₹15,00,000+</div>
                    <div className="text-[10px] text-[#5a4a3a]/65">You save 60%+ over paying for each yatra individually.</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-4 text-center">
                  <div className="bg-[#FBF7EE] rounded-md p-2.5">
                    <Calendar className="h-4 w-4 text-[#6D2B35] mx-auto mb-1" />
                    <div className="text-[10px] text-[#5a4a3a]/70 uppercase tracking-wide">Card validity</div>
                    <div className="text-sm font-bold text-[#4a1a22]">5 years</div>
                  </div>
                  <div className="bg-[#FBF7EE] rounded-md p-2.5">
                    <Users className="h-4 w-4 text-[#6D2B35] mx-auto mb-1" />
                    <div className="text-[10px] text-[#5a4a3a]/70 uppercase tracking-wide">Card holders</div>
                    <div className="text-sm font-bold text-[#4a1a22]">1 + spouse</div>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-3 text-[11px] text-[#5a4a3a]/70 mb-4">
                  <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" /> 8447-8447-02</span>
                </div>

                <a href="#apply">
                  <Button className="w-full bg-[#6D2B35] hover:bg-[#5a1f29] text-[#D4AF37] font-bold" data-testid="btn-scroll-apply">
                    Apply / Gift the Pilgrimage Card
                  </Button>
                </a>
                <p className="text-[10px] text-[#5a4a3a]/55 text-center mt-2">Subject to KYC & medical fitness for high-altitude yatras.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* The Gift narrative */}
      <section className="container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <Badge className="bg-[#6D2B35] text-[#D4AF37] mb-3"><Gift className="h-3 w-3 mr-1" /> The Most Meaningful Gift You Can Give</Badge>
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-[#4a1a22]" data-testid="text-gift-heading">Gift a Lifetime of Tirth — to the Ones Who Raised You</h2>
            <p className="text-sm md:text-base text-[#5a4a3a]/80 mt-3 max-w-2xl mx-auto leading-relaxed">
              Most retired Indians have one quiet wish — to do all the sacred yatras before their time ends. But planning, money, logistics, fitness, the right pandit — it never quite falls into place.
              <br /><br />
              The Pilgrimage Card removes every one of those obstacles. <strong className="text-[#4a1a22]">You save {monthlyLabel} a month. They get to walk every sacred land of Bharat — Char Dham, Kashi, Tirupati, Vaishno, Amarnath, Jyotirlingas — fully cared for.</strong>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                icon: Heart,
                title: "For Your Parents",
                body: "The retirement gift they never asked for but always wanted. A card in their name that sponsors every tirth they ever dreamt of — with a pandit, comfortable stay, and zero planning headache.",
                tag: "Most popular gift",
              },
              {
                icon: GraduationCap,
                title: "For College Retirees",
                body: `Honor a beloved professor, principal, or HOD on retirement. A college, alumni group, or department can pool ${monthlyLabel}/month and gift a card that covers their lifetime spiritual journey.`,
                tag: "Group gifting available",
              },
              {
                icon: Users,
                title: "For Your In-Laws",
                body: "The thoughtful daughter / son / daughter-in-law's gift. Card holder + spouse both travel together — every yatra, fully sponsored, in the comfort they deserve.",
                tag: "Couples covered together",
              },
            ].map((g, i) => {
              const I = g.icon;
              return (
                <Card key={i} className="border-[#D4AF37]/25 hover-elevate" data-testid={`card-gift-${i}`}>
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-9 w-9 rounded-md bg-[#6D2B35]/10 flex items-center justify-center">
                        <I className="h-5 w-5 text-[#6D2B35]" />
                      </div>
                      <h3 className="text-base font-serif font-bold text-[#4a1a22]">{g.title}</h3>
                    </div>
                    <p className="text-sm text-[#5a4a3a] leading-relaxed mb-3">{g.body}</p>
                    <Badge variant="secondary" className="bg-[#FBF7EE] text-[#6D2B35] border-[#D4AF37]/30 text-[10px]">{g.tag}</Badge>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="mt-8 bg-gradient-to-r from-[#FBF7EE] via-white to-[#FBF7EE] border border-[#D4AF37]/30 rounded-md p-5 md:p-6 text-center">
            <p className="text-sm md:text-base text-[#4a1a22] font-serif italic leading-relaxed max-w-2xl mx-auto">
              "Maa-Papa ne zindagi bhar humein bada kiya. ₹10,000 mahine ki SIP — aur unki zindagi ka har tirth pura ho jata hai. Iss se behtar tohfa kya hoga?"
            </p>
            <p className="text-xs text-[#5a4a3a]/70 mt-2">— a member, gifted to his parents on their 60th anniversary</p>
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="bg-white border-y border-[#D4AF37]/15">
        <div className="container mx-auto px-4 py-10">
          <h2 className="text-xl md:text-2xl font-serif font-bold text-[#4a1a22] text-center mb-2">Pay With Card vs. Pay Per Yatra</h2>
          <p className="text-sm text-[#5a4a3a]/70 text-center mb-6">Total saving across the 5-year card window — for the holder + spouse together.</p>
          <div className="overflow-x-auto max-w-3xl mx-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-[#FBF7EE]">
                  <th className="text-left p-3 font-serif text-[#4a1a22]">Yatra (per person)</th>
                  <th className="text-right p-3 font-serif text-[#4a1a22]">Market Price</th>
                  <th className="text-right p-3 font-serif text-[#4a1a22]">With Card</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D4AF37]/10">
                {[
                  ["Char Dham Yatra", 55000],
                  ["Vaishno Devi (helicopter)", 25000],
                  ["Amarnath (helicopter)", 60000],
                  ["Kashi Vishwanath + Ayodhya", 22500],
                  ["12 Jyotirlinga (full circuit)", 180000],
                  ["Puri Jagannath", 35000],
                  ["Tirupati Balaji VIP", 28000],
                  ["Maa Kamakhya (Guwahati)", 27500],
                ].map((row, i) => (
                  <tr key={i}>
                    <td className="p-3 text-[#4a1a22]">{row[0]}</td>
                    <td className="p-3 text-right text-[#5a4a3a]/80"><s>₹{(row[1] as number).toLocaleString("en-IN")}</s></td>
                    <td className="p-3 text-right text-emerald-700 font-bold">FREE</td>
                  </tr>
                ))}
                <tr className="bg-[#FBF7EE] font-bold">
                  <td className="p-3 text-[#4a1a22]">Couple total (holder + spouse)</td>
                  <td className="p-3 text-right text-[#5a4a3a]/80">₹8.6L+</td>
                  <td className="p-3 text-right text-emerald-700">Covered</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Apply form */}
      <section id="apply" className="container mx-auto px-4 py-12 md:py-16">
        <Card className="max-w-2xl mx-auto border-2 border-[#D4AF37]/40 shadow-lg">
          <div className="h-2 w-full bg-gradient-to-r from-[#D4AF37] via-[#f5d76e] to-[#D4AF37]" />
          <CardContent className="p-6 md:p-8">
            <div className="text-center mb-5">
              <Mountain className="h-10 w-10 text-[#6D2B35] mx-auto mb-2" />
              <h3 className="text-xl md:text-2xl font-serif font-bold text-[#4a1a22]">Get Your Pilgrimage Card</h3>
              <p className="text-xs text-[#5a4a3a]/70 mt-1">Our team will call you within 24 hours to complete KYC & set up your <strong>{monthlyLabel}</strong> monthly auto-debit.</p>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
              <button onClick={() => setPurpose("self")} className={`p-3 rounded-md border-2 text-left transition ${purpose === "self" ? "border-[#D4AF37] bg-[#FBF7EE]" : "border-[#D4AF37]/20 bg-white"}`} data-testid="btn-purpose-self">
                <div className="flex items-center gap-2"><Crown className={`h-4 w-4 ${purpose === "self" ? "text-[#D4AF37]" : "text-[#5a4a3a]/50"}`} /><span className="text-sm font-bold text-[#4a1a22]">For Myself / Spouse</span></div>
                <div className="text-[11px] text-[#5a4a3a]/65 mt-0.5">Standard membership</div>
              </button>
              <button onClick={() => setPurpose("gift")} className={`p-3 rounded-md border-2 text-left transition ${purpose === "gift" ? "border-[#D4AF37] bg-[#FBF7EE]" : "border-[#D4AF37]/20 bg-white"}`} data-testid="btn-purpose-gift">
                <div className="flex items-center gap-2"><Gift className={`h-4 w-4 ${purpose === "gift" ? "text-[#D4AF37]" : "text-[#5a4a3a]/50"}`} /><span className="text-sm font-bold text-[#4a1a22]">Gift a Card</span></div>
                <div className="text-[11px] text-[#5a4a3a]/65 mt-0.5">Parents / in-laws / retiree</div>
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label htmlFor="pc-name">Your Name *</Label><Input id="pc-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="input-pc-name" /></div>
                <div><Label htmlFor="pc-phone">Phone *</Label><Input id="pc-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} data-testid="input-pc-phone" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label htmlFor="pc-email">Email *</Label><Input id="pc-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} data-testid="input-pc-email" /></div>
                <div><Label htmlFor="pc-city">City *</Label><Input id="pc-city" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} data-testid="input-pc-city" /></div>
              </div>
              {purpose === "gift" ? (
                <div><Label htmlFor="pc-giftfor">Gifting to (name & relationship) *</Label><Input id="pc-giftfor" placeholder="e.g. My father, Sh. Ramesh Sharma (62)" value={form.giftFor} onChange={(e) => setForm({ ...form, giftFor: e.target.value })} data-testid="input-pc-giftfor" /></div>
              ) : (
                <div><Label htmlFor="pc-age">Your Age</Label><Input id="pc-age" type="number" min={18} value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} data-testid="input-pc-age" /></div>
              )}
              <div>
                <Label className="mb-2 block">Yatras most interested in {purpose === "gift" ? "(for the recipient)" : ""}</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {YATRA_OPTIONS.map((y) => {
                    const on = yatras.includes(y);
                    return (
                      <button key={y} type="button" onClick={() => toggleYatra(y)} className={`text-left text-xs px-3 py-2 rounded-md border transition ${on ? "bg-[#6D2B35] text-[#D4AF37] border-[#D4AF37]" : "bg-white text-[#4a1a22] border-[#D4AF37]/25 hover:border-[#D4AF37]"}`} data-testid={`btn-yatra-${y.toLowerCase().replace(/[^a-z]+/g, "-").slice(0, 30)}`}>
                        {on && <Check className="h-3 w-3 inline mr-1" />}{y}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div><Label htmlFor="pc-msg">Anything else we should know?</Label><Textarea id="pc-msg" rows={2} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} data-testid="input-pc-message" /></div>
              <div className="bg-[#FBF7EE] rounded-md px-3 py-2 text-xs text-[#5a4a3a] flex items-center justify-between" data-testid="text-application-summary">
                <span>Monthly SIP</span>
                <span className="font-bold text-[#4a1a22]">{monthlyLabel} × 60 months = {totalLabel}</span>
              </div>
              <Button onClick={submit} disabled={applyMut.isPending} className="w-full bg-[#6D2B35] hover:bg-[#5a1f29] text-[#D4AF37] font-bold" data-testid="btn-submit-pc">
                {applyMut.isPending ? "Submitting..." : purpose === "gift" ? "Submit Gift Application" : "Submit My Application"}
              </Button>
              <p className="text-[10px] text-[#5a4a3a]/55 text-center">By submitting, you consent to be contacted via phone/WhatsApp. T&Cs apply.</p>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

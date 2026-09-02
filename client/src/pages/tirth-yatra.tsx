import { useQuery, useMutation } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import PageSeo from "@/components/PageSeo";
import PageAPlusContent from "@/components/PageAPlusContent";
import { breadcrumbList, itemList, abs } from "@/lib/seo-schemas";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  MapPin, Clock, Users, Mountain, Plane, Bus, Sparkles, Check, ArrowRight, Phone,
  Heart, ChevronRight, Calendar, BookOpen, Compass,
} from "lucide-react";
import type { TirthYatraTour } from "@shared/schema";
import { TIRTH_YATRAS, TIRTH_YATRA_CATEGORIES } from "@/lib/tirth-yatras-data";
import { mergeCompatibility, type CompatibilityItem } from "@/lib/destination-compat";

export default function TirthYatraPage() {
  const { toast } = useToast();
  const [selectedTour, setSelectedTour] = useState<TirthYatraTour | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [form, setForm] = useState({ name: "", phone: "", email: "", city: "", travelers: 2, preferredMonth: "", message: "" });
  const [freeForm, setFreeForm] = useState({ name: "", phone: "", email: "", city: "", preferredYatra: "", message: "" });

  const { data: tours = [], isLoading } = useQuery<TirthYatraTour[]>({ queryKey: ["/api/yatra/tours"] });
  const { data: canonicalTirths } = useQuery<{ items: CompatibilityItem[] }>({ queryKey: ["/api/destination-compatibility/tirth"] });
  const displayedYatras = useMemo(
    () => mergeCompatibility(TIRTH_YATRAS, canonicalTirths?.items, (y) => `tirth-guide:${y.slug}`),
    [canonicalTirths],
  );

  const inquireMut = useMutation({
    mutationFn: async (payload: any) => {
      const r = await apiRequest("POST", "/api/yatra/inquire", payload);
      return r.json();
    },
    onSuccess: () => {
      toast({ title: "Inquiry sent!", description: "Our yatra team will call you within 24 hours." });
      setSelectedTour(null);
      setForm({ name: "", phone: "", email: "", city: "", travelers: 2, preferredMonth: "", message: "" });
    },
    onError: (e: any) => toast({ title: "Could not send inquiry", description: e?.message || "Please try again.", variant: "destructive" }),
  });

  const freeMut = useMutation({
    mutationFn: async (payload: any) => {
      const r = await apiRequest("POST", "/api/yatra/inquire", payload);
      return r.json();
    },
    onSuccess: () => {
      toast({
        title: "Lucky draw entry registered!",
        description: "You're in for next Vasant Panchami's free yatra draw. Watch our WhatsApp for the live announcement.",
      });
      setFreeForm({ name: "", phone: "", email: "", city: "", preferredYatra: "", message: "" });
    },
    onError: (e: any) => toast({ title: "Could not register", description: e?.message || "Please try again.", variant: "destructive" }),
  });

  const submit = () => {
    if (!form.name.trim() || !form.phone.trim()) {
      toast({ title: "Please fill name & phone", variant: "destructive" });
      return;
    }
    inquireMut.mutate({
      tourId: selectedTour?.id,
      tourSlug: selectedTour?.slug,
      ...form,
      travelers: Number(form.travelers) || 1,
    });
  };

  const submitFree = () => {
    if (!freeForm.name.trim() || !freeForm.phone.trim()) {
      toast({ title: "Please fill name & phone", variant: "destructive" });
      return;
    }
    const year = new Date().getFullYear() + 1;
    freeMut.mutate({
      tourSlug: `free-yatra-ngo-${year}`,
      name: freeForm.name,
      phone: freeForm.phone,
      email: freeForm.email || undefined,
      city: freeForm.city || undefined,
      travelers: 1,
      preferredMonth: undefined,
      message: `[FREE NGO YATRA — Annual Lucky Draw ${year}] Preferred yatra: ${freeForm.preferredYatra || "Any"}. Notes: ${freeForm.message || "—"}`,
    });
  };

  const filteredYatras = useMemo(() => {
    if (activeCategory === "all") return displayedYatras;
    return displayedYatras.filter((y) => y.category === activeCategory);
  }, [activeCategory, displayedYatras]);

  const TY_TITLE = "Free Tirth Yatra & All Hindu Pilgrimages | Char Dham, 12 Jyotirlingas, Vaishno Devi, Amarnath, Tirupati - Vedic Tatva";
  const TY_DESC = "The most comprehensive Hindu Tirth Yatra hub - complete planning guides for Char Dham, Kedarnath, Badrinath, Kashi Vishwanath, Ayodhya, Mathura-Vrindavan, Vaishno Devi, Amarnath, Tirupati, Jagannath Puri, Dwarka, Rameshwaram, Kamakhya, Somnath, Mahakaleshwar, Shirdi, Haridwar-Rishikesh & Kailash Mansarovar. NGO annual lucky draw for one free yatra every year.";

  return (
    <div className="min-h-screen bg-[#FBF7EE]" data-testid="page-tirth-yatra">
      <PageSeo
        title={TY_TITLE}
        description={TY_DESC}
        keywords="tirth yatra, hindu pilgrimage, char dham yatra, 12 jyotirlinga, 51 shakti peeth, vaishno devi yatra, amarnath yatra, kedarnath yatra, badrinath yatra, kashi vishwanath, ayodhya ram mandir, mathura vrindavan, tirupati balaji, jagannath puri, dwarka, rameshwaram, kamakhya, somnath, mahakaleshwar ujjain, shirdi sai baba, haridwar rishikesh, kailash mansarovar, free yatra ngo, hindu pilgrimage tour package, sanatan dharma pilgrimage"
        canonical="/tirth-yatra"
        ogType="website"
        twitterCard="summary_large_image"
        schemas={[
          breadcrumbList([
            { name: "Home", url: "/" },
            { name: "Free Tirth Yatra", url: "/tirth-yatra" },
          ]),
          itemList({
            name: "All Hindu Tirth Yatras",
            items: TIRTH_YATRAS.map((y) => ({ name: y.name, url: `/tirth-yatra/${y.slug}` })),
          }),
          {
            id: "collection-page",
            payload: {
              "@context": "https://schema.org",
              "@type": "CollectionPage",
              name: TY_TITLE,
              description: TY_DESC,
              url: abs("/tirth-yatra"),
              isPartOf: { "@type": "WebSite", name: "Vedic Tatva", url: abs("/") },
            },
          },
        ]}
      />
      {/* Hero */}
      <section className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, #4a1a22 0%, #6D2B35 50%, #8B3A47 100%)" }}>
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 30% 50%, #D4AF37 0%, transparent 50%), radial-gradient(circle at 70% 50%, #f5d76e 0%, transparent 50%)" }} />
        <div className="container mx-auto px-4 py-12 md:py-16 relative">
          <div className="max-w-3xl">
            <Badge className="bg-[#D4AF37] text-[#4a1a22] hover:bg-[#D4AF37] mb-3" data-testid="badge-flagship">
              <Sparkles className="h-3 w-3 mr-1" /> Sanatan Dharma's Sacred Pilgrimages
            </Badge>
            <h1 className="text-3xl md:text-5xl font-serif font-bold text-white leading-tight" data-testid="text-page-title">
              Free Tirth Yatra — All Hindu Pilgrimages, In One Place
            </h1>
            <p className="text-base md:text-lg text-[#FBF7EE]/90 mt-3 max-w-2xl">
              The most comprehensive Hindu Tirth Yatra hub — Char Dham, 12 Jyotirlingas, 51 Shakti Peeths, Saptapuri, Ram Janmabhoomi,
              Krishna Bhumi, Vaishno Devi, Amarnath, Tirupati, Kailash Mansarovar — with complete planning, SEO-rich guides, and an
              annual NGO lucky draw to fund a free yatra for one devotee/family every year.
            </p>
            <div className="flex flex-wrap gap-2 mt-5 text-xs text-white/80">
              <span className="inline-flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full"><BookOpen className="h-3.5 w-3.5" /> {TIRTH_YATRAS.length}+ yatras documented</span>
              <span className="inline-flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full"><Mountain className="h-3.5 w-3.5" /> Pan-India coverage</span>
              <span className="inline-flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full"><Heart className="h-3.5 w-3.5" /> NGO free yatra draw</span>
              <span className="inline-flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full"><Sparkles className="h-3.5 w-3.5" /> Pandit-led prayers</span>
              <span className="inline-flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full"><Users className="h-3.5 w-3.5" /> Small batches</span>
            </div>
          </div>
        </div>
      </section>

      {/* All Tirth Yatras Tile Grid (NEW — main content) */}
      <section className="container mx-auto px-4 py-10 md:py-14">
        <div className="text-center mb-7">
          <Badge variant="secondary" className="bg-[#D4AF37]/15 text-[#6D2B35] border-[#D4AF37]/40 text-[10px] mb-2">
            <Compass className="w-3 h-3 mr-1" /> Complete Tirth Yatra Library
          </Badge>
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-[#4a1a22]" data-testid="text-yatras-heading">
            Browse Every Major Hindu Tirth Yatra
          </h2>
          <p className="text-sm text-[#5a4a3a]/70 mt-2 max-w-2xl mx-auto">
            Tap any tile to open a complete planning guide — itinerary, history, key temples, mantras, best time, what to pack, FAQs and the free yatra interest form.
          </p>
        </div>

        {/* Category filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-5 -mx-4 px-4">
          {TIRTH_YATRA_CATEGORIES.map((c) => {
            const CIcon = c.icon;
            const active = activeCategory === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setActiveCategory(c.id)}
                className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium border transition-all ${
                  active
                    ? "bg-[#6D2B35] text-white border-[#6D2B35]"
                    : "bg-white text-[#5a4a3a] border-[#D4AF37]/25 hover-elevate"
                }`}
                data-testid={`filter-${c.id}`}
              >
                <CIcon className="w-3.5 h-3.5" /> {c.label}
              </button>
            );
          })}
        </div>

        {/* Tile grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredYatras.map((y) => {
            const YIcon = y.icon;
            return (
              <Link
                key={y.slug}
                href={`/tirth-yatra/${y.slug}`}
                className="group block bg-white rounded-md border border-[#D4AF37]/20 p-4 hover-elevate transition-all h-full"
                data-testid={`tile-yatra-${y.slug}`}
              >
                <div className="flex items-start justify-between gap-2 mb-2.5">
                  <div className="w-11 h-11 rounded-md bg-gradient-to-br from-[#FBF7EE] to-[#f4eedd] border border-[#D4AF37]/30 flex items-center justify-center">
                    <YIcon className="w-5 h-5 text-[#6D2B35]" strokeWidth={1.6} />
                  </div>
                  <Badge variant="secondary" className="bg-[#D4AF37]/15 text-[#6D2B35] border-[#D4AF37]/40 text-[9px] uppercase tracking-wider">
                    {y.state}
                  </Badge>
                </div>
                <h3 className="font-serif text-[15px] text-[#6D2B35] font-bold leading-snug mb-1" data-testid={`tile-name-${y.slug}`}>
                  {y.name}
                </h3>
                {y.nameHi && (
                  <p className="text-[11px] text-[#D4AF37] font-serif mb-1.5" lang="hi">{y.nameHi}</p>
                )}
                <p className="text-[12px] text-[#5a4a3a]/75 leading-relaxed line-clamp-3 mb-3">{y.shortInfo}</p>
                <div className="flex flex-wrap gap-1.5 text-[10px] text-[#5a4a3a]/60 mb-3">
                  <span className="inline-flex items-center gap-1 bg-[#FBF7EE] px-1.5 py-0.5 rounded">
                    <Calendar className="w-2.5 h-2.5" /> {y.durationDays}
                  </span>
                  <span className="inline-flex items-center gap-1 bg-[#FBF7EE] px-1.5 py-0.5 rounded">
                    <Mountain className="w-2.5 h-2.5" /> {y.difficulty}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-[#D4AF37]/15">
                  <span className="text-[10px] text-[#5a4a3a]/60 uppercase tracking-wider">Best: {y.bestSeason}</span>
                  <span className="inline-flex items-center gap-1 text-[11px] text-[#D4AF37] font-semibold">
                    Open <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* NGO Free Yatra explainer + lucky-draw form */}
      <section
        className="border-y border-[#D4AF37]/30"
        style={{ background: "linear-gradient(135deg, #6D2B35 0%, #8B3A47 100%)" }}
      >
        <div className="container mx-auto px-4 py-12 md:py-14">
          <div className="grid lg:grid-cols-[1fr_1fr] gap-8 items-start max-w-6xl mx-auto">
            <div>
              <Badge className="bg-[#D4AF37] text-[#4a1a22] hover:bg-[#D4AF37] mb-3" data-testid="badge-ngo-hub">
                <Heart className="h-3 w-3 mr-1" /> Vedic Tatva NGO Initiative
              </Badge>
              <h2 className="font-serif text-2xl md:text-4xl text-white font-bold leading-tight mb-4" data-testid="heading-ngo-hub">
                One Free Tirth Yatra Every Year — A Devotee's Lifelong Dream Fulfilled
              </h2>
              <p className="text-[15px] text-white/90 leading-relaxed mb-4">
                As part of our NGO seva, Vedic Tatva fully sponsors <strong>one Tirth Yatra every year</strong> for a randomly selected devotee or family
                who could not otherwise afford it. The lucky draw is conducted live on <strong>Vasant Panchami</strong> every year — open, video-recorded
                and verified by an independent panel of pandits.
              </p>
              <ul className="space-y-2.5 mb-5">
                {[
                  "Entire yatra fully sponsored — transport, stay, sattvic meals, Vedic pandit, VIP darshan",
                  "Open to anyone — no purchase required, no income test, no hidden conditions",
                  "Live drawn on Vasant Panchami every year — winner announced on our YouTube and WhatsApp",
                  "Even non-winners get free planning help, packing list and route guide on WhatsApp",
                  "Annual roll-over — your name auto-enters every year you remain subscribed",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-[13.5px] text-white/90">
                    <Sparkles className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Lucky draw form */}
            <Card className="bg-white shadow-2xl" data-testid="card-free-yatra-form">
              <CardHeader>
                <CardTitle className="font-serif text-xl text-[#4a1a22]">
                  Enter the Annual Free Yatra Lucky Draw
                </CardTitle>
                <p className="text-xs text-[#5a4a3a]/70">
                  Free to enter. Drawn on Vasant Panchami {new Date().getFullYear() + 1}. One devotee/family wins the entire yatra.
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="f-name">Full Name *</Label>
                    <Input id="f-name" value={freeForm.name} onChange={(e) => setFreeForm({ ...freeForm, name: e.target.value })} data-testid="input-free-name" />
                  </div>
                  <div>
                    <Label htmlFor="f-phone">Phone (WhatsApp) *</Label>
                    <Input id="f-phone" value={freeForm.phone} onChange={(e) => setFreeForm({ ...freeForm, phone: e.target.value })} data-testid="input-free-phone" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="f-email">Email</Label>
                    <Input id="f-email" type="email" value={freeForm.email} onChange={(e) => setFreeForm({ ...freeForm, email: e.target.value })} data-testid="input-free-email" />
                  </div>
                  <div>
                    <Label htmlFor="f-city">City</Label>
                    <Input id="f-city" value={freeForm.city} onChange={(e) => setFreeForm({ ...freeForm, city: e.target.value })} data-testid="input-free-city" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="f-yatra">Preferred Yatra (optional)</Label>
                  <Input
                    id="f-yatra"
                    placeholder="e.g. Char Dham, Vaishno Devi, Tirupati, Any"
                    value={freeForm.preferredYatra}
                    onChange={(e) => setFreeForm({ ...freeForm, preferredYatra: e.target.value })}
                    data-testid="input-free-yatra"
                  />
                </div>
                <div>
                  <Label htmlFor="f-msg">Why this yatra matters to you (optional)</Label>
                  <Textarea
                    id="f-msg"
                    rows={2}
                    placeholder="Share your story — devotion, family situation, or any sankalp..."
                    value={freeForm.message}
                    onChange={(e) => setFreeForm({ ...freeForm, message: e.target.value })}
                    data-testid="input-free-message"
                  />
                </div>
                <Button
                  onClick={submitFree}
                  disabled={freeMut.isPending}
                  className="w-full bg-[#6D2B35] hover:bg-[#5a1f29] text-[#D4AF37]"
                  data-testid="btn-submit-free-yatra"
                >
                  {freeMut.isPending ? "Registering..." : "Enter Free Yatra Lucky Draw"}
                </Button>
                <p className="text-[10px] text-[#5a4a3a]/60 text-center">
                  By entering, you agree to be contacted on WhatsApp/phone with the draw schedule.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Existing curated tour packages */}
      <section className="container mx-auto px-4 py-10 md:py-14">
        <div className="flex items-end justify-between mb-6 flex-wrap gap-3">
          <div>
            <Badge variant="secondary" className="bg-[#D4AF37]/15 text-[#6D2B35] border-[#D4AF37]/40 text-[10px] mb-2">
              <Sparkles className="w-3 h-3 mr-1" /> Bookable Now
            </Badge>
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-[#4a1a22]" data-testid="text-tours-heading">
              Confirmed Departures — Book Your Spot
            </h2>
            <p className="text-sm text-[#5a4a3a]/70 mt-1">All-inclusive packages departing from Delhi. Group size strictly limited.</p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse"><CardContent className="h-72" /></Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tours.map((t) => {
              const transport = t.route?.toLowerCase().includes("varanasi") || t.route?.toLowerCase().includes("guwahati") ? Plane : Bus;
              const Transport = transport;
              const discount = t.mrpInr && t.mrpInr > t.priceInr ? Math.round(((t.mrpInr - t.priceInr) / t.mrpInr) * 100) : 0;
              return (
                <Card key={t.id} className="flex flex-col hover-elevate" data-testid={`card-tour-${t.slug}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5 text-[10px] text-[#5a4a3a]/60 font-semibold uppercase tracking-wide">
                        <MapPin className="h-3 w-3" /> {t.departureCity}
                      </div>
                      {t.isFlagship && (
                        <Badge variant="secondary" className="bg-[#D4AF37]/20 text-[#6D2B35] border-[#D4AF37]/40 text-[10px]">Flagship</Badge>
                      )}
                    </div>
                    <CardTitle className="text-base md:text-lg font-serif text-[#4a1a22] leading-snug" data-testid={`text-tour-name-${t.slug}`}>
                      {t.shortName || t.name}
                    </CardTitle>
                    <p className="text-xs text-[#5a4a3a]/65 mt-1.5 line-clamp-1">{t.route}</p>
                  </CardHeader>
                  <CardContent className="flex-1 pb-3">
                    <div className="grid grid-cols-3 gap-2 text-center mb-3">
                      <div className="bg-[#FBF7EE] rounded-md py-1.5">
                        <div className="text-[9px] text-[#5a4a3a]/60 uppercase tracking-wide">Days</div>
                        <div className="text-sm font-bold text-[#6D2B35]">{t.durationDays}D/{t.durationNights}N</div>
                      </div>
                      <div className="bg-[#FBF7EE] rounded-md py-1.5">
                        <div className="text-[9px] text-[#5a4a3a]/60 uppercase tracking-wide">Travel</div>
                        <div className="text-sm font-bold text-[#6D2B35]"><Transport className="h-4 w-4 inline" /></div>
                      </div>
                      <div className="bg-[#FBF7EE] rounded-md py-1.5">
                        <div className="text-[9px] text-[#5a4a3a]/60 uppercase tracking-wide">Group</div>
                        <div className="text-sm font-bold text-[#6D2B35]">≤{t.groupSize}</div>
                      </div>
                    </div>
                    <ul className="space-y-1">
                      {(t.highlights || []).slice(0, 3).map((h, i) => (
                        <li key={i} className="text-xs text-[#5a4a3a] flex items-start gap-1.5">
                          <Check className="h-3.5 w-3.5 text-[#D4AF37] shrink-0 mt-0.5" />
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter className="flex items-center justify-between gap-2 pt-0 border-t border-[#D4AF37]/15 pb-4">
                    <div>
                      <div className="text-xl font-bold text-[#4a1a22]" data-testid={`text-price-${t.slug}`}>₹{t.priceInr.toLocaleString("en-IN")}</div>
                      {t.mrpInr && (
                        <div className="text-[10px] text-[#5a4a3a]/55 -mt-0.5">
                          <s>₹{t.mrpInr.toLocaleString("en-IN")}</s> {discount > 0 && <span className="text-emerald-700 font-semibold ml-1">{discount}% off</span>}
                        </div>
                      )}
                    </div>
                    <Button onClick={() => setSelectedTour(t)} className="bg-[#6D2B35] hover:bg-[#5a1f29] text-[#D4AF37]" data-testid={`btn-inquire-${t.slug}`}>
                      Enquire <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}

        {/* Trust strip */}
        <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
          {[
            { icon: Users, h: "12,000+", s: "Pilgrims served" },
            { icon: BookOpen, h: `${TIRTH_YATRAS.length}+ Yatras`, s: "Documented & guided" },
            { icon: Mountain, h: "All-inclusive", s: "Stay + meals + transport" },
            { icon: Phone, h: "24/7 helpline", s: "8447-8447-02" },
          ].map((b, i) => {
            const I = b.icon;
            return (
              <div key={i} className="bg-white border border-[#D4AF37]/20 rounded-md p-4">
                <I className="h-5 w-5 text-[#D4AF37] mx-auto mb-1.5" />
                <div className="text-base font-bold text-[#4a1a22]">{b.h}</div>
                <div className="text-[10px] text-[#5a4a3a]/65 uppercase tracking-wide">{b.s}</div>
              </div>
            );
          })}
        </div>
      </section>

      <PageAPlusContent
        eyebrow="Why Plan Your Yatra With Vedic Tatva"
        title="Hindu Tirth Yatra — Authentic Pilgrimage Tours With Pandit-Led Prayers"
        intro="From the Himalayas to the southern coast — Char Dham, 12 Jyotirlingas, 51 Shakti Peeths, Saptapuri, Vaishno Devi, Amarnath, Kailash Mansarovar, Tirupati, Jagannath Puri and beyond. Every tour includes verified pandit-led prayers at the temple, comfortable stay, vegetarian sattvic meals, dedicated transport and a planning team that handles registrations, VIP darshan, helicopter bookings and elderly assistance."
        trustBadges={[
          { value: "12,000+", label: "Pilgrims Served" },
          { value: "100+", label: "Yatras Curated" },
          { value: "Pandit", label: "At Every Stop" },
          { value: "24/7", label: "Helpline" },
        ]}
        benefits={[
          { icon: Mountain, title: "Char Dham & Do Dham Yatra", body: "Complete Char Dham Yatra (Yamunotri, Gangotri, Kedarnath, Badrinath) and Do Dham options with helicopter, road and trek routes. Registration handled, biometrics done, helicopter booked." },
          { icon: Sparkles, title: "12 Jyotirlinga Yatra", body: "All 12 Jyotirlingas — Somnath, Mallikarjuna, Mahakaleshwar, Omkareshwar, Kedarnath, Bhimashankar, Kashi Vishwanath, Trimbakeshwar, Vaidyanath, Nageshwar, Rameshwaram, Grishneshwar — in single or split yatras with Rudra Abhishek at each shrine." },
          { icon: Heart, title: "51 Shakti Peeths & Devi Yatra", body: "Vaishno Devi, Kamakhya, Jwala Devi, Naina Devi, Chamunda, Mansa Devi, Ambaji, Hingula, Kalighat, Jayanti, Chottila — devi tirthas across India and Pakistan/Bangladesh routes wherever permitted." },
          { icon: BookOpen, title: "Saptapuri & Krishna-Ram Bhumi", body: "Ayodhya (Ram Mandir), Mathura-Vrindavan-Govardhan parikrama, Kashi-Prayagraj-Gaya tritirth, Dwarka-Bet Dwarka, Haridwar-Rishikesh, Kanchipuram and Ujjain — full Saptapuri circuit with shastra-correct rituals." },
          { icon: Users, title: "Small Group, Senior-Friendly", body: "Maximum 20-25 pilgrims per batch. Senior-friendly itineraries, palki/doli arrangements at Vaishno Devi & Kedarnath, oxygen support at Kailash Mansarovar, doctor on-call for high-altitude routes." },
          { icon: Phone, title: "Pandit-Led Prayers & VIP Darshan", body: "Dedicated pandit accompanies each batch — Sankalpa, Kalash Pujan, Abhishek, Aarti and Pind Daan performed correctly at every shrine. VIP darshan at Tirupati, Vaishno Devi, Kashi & Mahakaleshwar pre-arranged where possible." },
        ]}
        steps={[
          { title: "Pick Your Yatra", body: "Browse 100+ documented yatras by category — Char Dham, Jyotirlinga, Shakti Peeth, Saptapuri, Krishna Bhumi, South India tirthas — with full itinerary, history and best season." },
          { title: "Request Free Callback", body: "Submit a quick inquiry — our yatra team calls within 24 hours, understands your dates, family size, budget and any special needs (senior, child, dietary)." },
          { title: "Customised Plan & Booking", body: "Receive a tailored plan covering travel mode (road/rail/flight/helicopter), stay grade, meals, pandit allocation, registrations and VIP darshan — at transparent all-inclusive pricing." },
          { title: "Travel With Care", body: "Dedicated yatra coordinator on the trip, pandit-led prayers at every shrine, 24/7 helpline, doctor on-call for Himalayan routes, photo memories and a Sankalp certificate at completion." },
        ]}
        faqs={[
          { q: "Which Hindu yatras can I book through Vedic Tatva?", a: "All major Hindu pilgrimages — Char Dham (Yamunotri, Gangotri, Kedarnath, Badrinath), Do Dham, all 12 Jyotirlingas (Somnath to Grishneshwar), 51 Shakti Peeths (Vaishno Devi, Kamakhya, Jwalamukhi, Kalighat etc.), Saptapuri (Ayodhya, Mathura, Haridwar, Kashi, Kanchipuram, Ujjain, Dwarka), South India tirthas (Tirupati, Rameshwaram, Madurai, Srirangam), Amarnath, Kailash Mansarovar, Pind Daan at Gaya/Kashi/Haridwar, and many regional yatras." },
          { q: "When is the best time to do Char Dham Yatra?", a: "Char Dham temples open in late April/early May after snowmelt and close around October-November (Diwali). Best months are May-June (clear weather, manageable crowds) and September-October (post-monsoon, crisp views). Monsoon (July-August) brings landslide risk — we run reduced batches with extra safety. Helicopter packages run throughout the open season." },
          { q: "Are pandits included in every yatra?", a: "Yes — every Vedic Tatva yatra includes a verified pandit who travels with the group. The pandit performs Sankalpa, Kalash Pujan, Abhishek, Aarti, Pind Daan and the appropriate vidhi at each shrine. For specialised pujas at Kashi (Pind Daan), Gaya (Tarpan), or Trimbakeshwar (Narayan Nagbali) we send specialist pandits trained in those rituals." },
          { q: "How is the free annual yatra lucky draw?", a: "Vedic Tatva runs an NGO-affiliated lucky draw every year — one devotee or family wins a fully-sponsored yatra (your choice from Char Dham, Vaishno Devi, Tirupati, Jyotirlingas etc., subject to feasibility). Entry is free for every booking and through our newsletter. The draw is held on Guru Purnima with results published transparently." },
          { q: "What about elderly parents or special needs?", a: "We specialise in senior-friendly yatras — palki/doli at Vaishno Devi (Banganga to Bhawan and back), pony at Kedarnath (Gaurikund to temple), helicopter direct-darshan packages for Char Dham, oxygen support and acclimatisation days at Kailash Mansarovar, ground-floor rooms, lift-equipped hotels and dietary care for diabetics/BP/Jain food. Doctor on-call for Himalayan routes." },
          { q: "Do you handle Amarnath and Kailash Mansarovar?", a: "Yes — Amarnath Yatra (Pahalgam and Baltal routes) with all SASB registrations, RFID, helicopter and pony arrangements. Kailash Mansarovar via Lipulekh (Uttarakhand), Nathula (Sikkim) and Kerung (Nepal) routes — including Inner Line Permit, China visa coordination, oxygen, doctor and acclimatisation. Both are weather-dependent and have annual quota — book 4-6 months in advance." },
          { q: "Can I do Pind Daan at Gaya/Kashi/Haridwar through you?", a: "Yes — we run dedicated Pind Daan tours to Gaya (Vishnupad, Akshayavat, Phalgu Tarpan), Kashi (Pishach Mochan, Manikarnika), Haridwar (Brahma Kund, Narayani Shila) and combined Tritirth (Gaya+Kashi+Prayag) for ancestral peace. Specialist Gaya-wal Pandas and Kashi pandits handle the vidhi as per Garuda Purana, with Sankalp certificate." },
          { q: "Are tour prices all-inclusive?", a: "Yes — all-inclusive means stay (per chosen grade — Standard, Deluxe, Premium), all sattvic vegetarian meals, dedicated AC transport, train/flight tickets where applicable, pandit dakshina, all temple entry fees, registrations, and basic darshan facilitation. Helicopter, palki, VIP darshan tickets and personal expenses are usually clearly listed as add-ons in the price sheet." },
        ]}
        keywordsBlurb="Char Dham Yatra package with helicopter, Do Dham, Kedarnath yatra by helicopter, Badrinath yatra, Yamunotri Gangotri tour, 12 Jyotirlinga tour package, Somnath Dwarka tour, Mahakaleshwar Omkareshwar Ujjain yatra, Kashi Vishwanath Prayagraj Gaya tritirth, Ayodhya Ram Mandir yatra, Mathura Vrindavan Govardhan parikrama, Vaishno Devi yatra package, Amarnath yatra registration, Kailash Mansarovar yatra (Lipulekh, Nathula, Kerung), Tirupati Balaji darshan, Rameshwaram Madurai tour, Jagannath Puri yatra, Kamakhya Devi tour, Shirdi Sai Baba tour, Saptapuri yatra, 51 Shakti Peeth circuit, Pind Daan in Gaya / Kashi / Haridwar / Pitru Paksha. Pandit-led prayers, VIP darshan, senior-friendly itineraries, helicopter and palki arrangements, free annual NGO yatra lucky draw."
      />

      {/* Inquiry modal */}
      <Dialog open={!!selectedTour} onOpenChange={(o) => { if (!o) setSelectedTour(null); }}>
        <DialogContent className="max-w-md" data-testid="dialog-inquire">
          <DialogHeader>
            <DialogTitle className="font-serif text-[#4a1a22]">{selectedTour?.shortName || selectedTour?.name}</DialogTitle>
            <p className="text-xs text-[#5a4a3a]/65">{selectedTour?.route}</p>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label htmlFor="y-name">Name *</Label><Input id="y-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="input-yatra-name" /></div>
              <div><Label htmlFor="y-phone">Phone *</Label><Input id="y-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} data-testid="input-yatra-phone" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label htmlFor="y-email">Email</Label><Input id="y-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} data-testid="input-yatra-email" /></div>
              <div><Label htmlFor="y-city">City</Label><Input id="y-city" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} data-testid="input-yatra-city" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label htmlFor="y-travelers">Travellers</Label><Input id="y-travelers" type="number" min={1} value={form.travelers} onChange={(e) => setForm({ ...form, travelers: Number(e.target.value) })} data-testid="input-yatra-travelers" /></div>
              <div><Label htmlFor="y-month">Preferred month</Label><Input id="y-month" placeholder="e.g. May 2026" value={form.preferredMonth} onChange={(e) => setForm({ ...form, preferredMonth: e.target.value })} data-testid="input-yatra-month" /></div>
            </div>
            <div><Label htmlFor="y-msg">Message</Label><Textarea id="y-msg" rows={2} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} data-testid="input-yatra-message" /></div>
            <Button onClick={submit} disabled={inquireMut.isPending} className="w-full bg-[#6D2B35] hover:bg-[#5a1f29] text-[#D4AF37]" data-testid="btn-submit-yatra">
              {inquireMut.isPending ? "Sending..." : "Request Callback"}
            </Button>
            <p className="text-[10px] text-[#5a4a3a]/55 text-center">By submitting, you agree to be contacted on WhatsApp/phone.</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

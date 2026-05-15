import { useMemo, useState } from "react";
import { Link, useRoute } from "wouter";
import PageSeo from "@/components/PageSeo";
import { faqPage, breadcrumbList, abs } from "@/lib/seo-schemas";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageAPlusContent from "@/components/PageAPlusContent";
import NotFound from "@/pages/not-found";
import { TIRTH_YATRAS, TIRTH_YATRAS_BY_SLUG } from "@/lib/tirth-yatras-data";
import {
  ChevronRight, ArrowLeft, MapPin, Calendar, Users, Mountain,
  Plane, Train, Bus, Sparkles, Heart, BookOpen, Clock,
  Compass, Sun, Droplets, ShieldCheck, AlertTriangle, Backpack,
} from "lucide-react";

const PRIMARY_BTN = "bg-[#6D2B35] hover:bg-[#5a1f29] text-[#D4AF37]";
const ACCENT = "#D4AF37";
const MAROON = "#6D2B35";

export default function TirthYatraDetailPage() {
  const [, params] = useRoute("/tirth-yatra/:slug");
  const slug = params?.slug || "";
  const yatra = TIRTH_YATRAS_BY_SLUG[slug];
  const { toast } = useToast();
  const [activeDay, setActiveDay] = useState(0);
  const [form, setForm] = useState({
    name: "", phone: "", email: "", city: "", travelers: 2,
    preferredMonth: "", message: "", forFree: false,
  });

  const inquireMut = useMutation({
    mutationFn: async (payload: any) => {
      const r = await apiRequest("POST", "/api/yatra/inquire", payload);
      return r.json();
    },
    onSuccess: () => {
      toast({
        title: form.forFree ? "Free Yatra interest registered!" : "Inquiry received!",
        description: form.forFree
          ? `You're entered in our annual NGO Free ${yatra?.name} draw. We'll contact you with planning help and the lucky-draw schedule.`
          : "Our yatra team will call you within 24 hours with the full plan.",
      });
      setForm({ name: "", phone: "", email: "", city: "", travelers: 2, preferredMonth: "", message: "", forFree: false });
    },
    onError: (e: any) => toast({
      title: "Could not register",
      description: e?.message || "Please try again.",
      variant: "destructive",
    }),
  });

  if (!yatra) return <NotFound />;

  const Icon = yatra.icon;

  const submit = () => {
    if (!form.name.trim() || !form.phone.trim()) {
      toast({ title: "Please fill name & phone", variant: "destructive" });
      return;
    }
    const tag = form.forFree
      ? `free-yatra-ngo-${new Date().getFullYear() + 1}`
      : `info-${yatra.slug}`;
    inquireMut.mutate({
      tourSlug: tag,
      name: form.name,
      phone: form.phone,
      email: form.email || undefined,
      city: form.city || undefined,
      travelers: Number(form.travelers) || 1,
      preferredMonth: form.preferredMonth || undefined,
      message: form.forFree
        ? `[FREE NGO YATRA — ${yatra.name}] ${form.message}`
        : `[Yatra info — ${yatra.name}] ${form.message}`,
    });
  };

  const related = TIRTH_YATRAS.filter(
    (y) => y.slug !== yatra.slug && (y.category === yatra.category || y.state === yatra.state)
  ).slice(0, 4);

  return (
    <div className="min-h-screen bg-[#FBF7EE]" data-testid={`page-yatra-${yatra.slug}`}>
      <PageSeo
        title={yatra.metaTitle}
        description={yatra.metaDescription}
        keywords={yatra.metaKeywords}
        canonical={`/tirth-yatra/${yatra.slug}`}
        ogType="article"
        twitterCard="summary_large_image"
        schemas={[
          {
            id: `yatra-${yatra.slug}-attraction`,
            payload: {
              "@context": "https://schema.org",
              "@type": "TouristAttraction",
              name: yatra.name,
              description: yatra.metaDescription,
              url: abs(`/tirth-yatra/${yatra.slug}`),
              touristType: "Religious pilgrimage",
              isAccessibleForFree: false,
              publicAccess: true,
              address: {
                "@type": "PostalAddress",
                addressLocality: yatra.region,
                addressRegion: yatra.state,
                addressCountry: yatra.state.toLowerCase().includes("tibet") ? "CN" : "IN",
              },
            },
          },
          faqPage(yatra.faqs.map((f) => ({ question: f.q, answer: f.a }))),
          breadcrumbList([
            { name: "Vedic Tatva", url: "/" },
            { name: "Free Tirth Yatra", url: "/tirth-yatra" },
            { name: yatra.name, url: `/tirth-yatra/${yatra.slug}` },
          ]),
        ]}
      />
      {/* Hero */}
      <section
        className="relative overflow-hidden border-b border-[#D4AF37]/20"
        style={{ background: `linear-gradient(135deg, #4a1a22 0%, ${MAROON} 50%, #8B3A47 100%)` }}
      >
        <div
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 50%, #D4AF37 0%, transparent 40%), radial-gradient(circle at 80% 30%, #f5d76e 0%, transparent 50%)",
          }}
        />
        <div className="container mx-auto px-4 py-10 md:py-14 relative">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-[11px] text-white/70 mb-5 flex-wrap" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-white" data-testid="link-breadcrumb-home">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <Link href="/tirth-yatra" className="hover:text-white" data-testid="link-breadcrumb-yatra">Free Tirth Yatra</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-[#D4AF37]">{yatra.name}</span>
          </nav>

          <div className="grid md:grid-cols-[1fr_auto] gap-6 items-end">
            <div>
              <Badge className="bg-[#D4AF37] text-[#4a1a22] hover:bg-[#D4AF37] mb-3" data-testid="badge-eyebrow">
                <Sparkles className="h-3 w-3 mr-1" /> {yatra.eyebrow}
              </Badge>
              <h1 className="text-3xl md:text-5xl font-serif font-bold text-white leading-tight" data-testid="text-yatra-title">
                {yatra.name}
              </h1>
              {yatra.nameHi && (
                <p className="text-lg md:text-xl text-[#D4AF37]/90 font-serif mt-1" lang="hi">{yatra.nameHi}</p>
              )}
              <p className="text-base text-[#FBF7EE]/90 mt-4 max-w-3xl leading-relaxed" data-testid="text-yatra-subtitle">
                {yatra.heroSubtitle}
              </p>
              <div className="flex flex-wrap gap-2 mt-5 text-xs text-white/85">
                <span className="inline-flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-md">
                  <MapPin className="h-3.5 w-3.5" /> {yatra.region}, {yatra.state}
                </span>
                <span className="inline-flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-md">
                  <Heart className="h-3.5 w-3.5" /> {yatra.deity}
                </span>
                <span className="inline-flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-md">
                  <Calendar className="h-3.5 w-3.5" /> {yatra.durationDays}
                </span>
                <span className="inline-flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-md">
                  <Mountain className="h-3.5 w-3.5" /> {yatra.difficulty}
                </span>
                <span className="inline-flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-md">
                  <Sun className="h-3.5 w-3.5" /> {yatra.bestSeason}
                </span>
              </div>
            </div>
            <div className="hidden md:flex items-center justify-center w-28 h-28 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 backdrop-blur-sm">
              <Icon className="w-14 h-14 text-[#D4AF37]" strokeWidth={1.4} />
            </div>
          </div>
        </div>
      </section>

      {/* Quick Trust strip */}
      <section className="bg-white border-b border-[#D4AF37]/15">
        <div className="container mx-auto px-4 py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {yatra.trustBadges.map((b, i) => (
              <div key={i} className="text-center" data-testid={`hero-trust-${i}`}>
                <div className="font-serif text-lg md:text-xl text-[#6D2B35] font-bold">{b.value}</div>
                <div className="text-[10px] text-[#5a4a3a]/65 uppercase tracking-wider">{b.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Significance */}
      <section className="container mx-auto px-4 py-10 md:py-12">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-serif text-2xl md:text-3xl text-[#4a1a22] font-bold mb-4" data-testid="heading-significance">
            Significance &amp; Spiritual Importance
          </h2>
          <p className="text-[15px] text-[#5a4a3a]/85 leading-relaxed mb-6">{yatra.significance}</p>

          <h2 className="font-serif text-2xl md:text-3xl text-[#4a1a22] font-bold mb-4 mt-10" data-testid="heading-history">
            History &amp; Origin
          </h2>
          <p className="text-[15px] text-[#5a4a3a]/85 leading-relaxed">{yatra.history}</p>
        </div>
      </section>

      {/* Key Temples */}
      <section className="bg-white border-y border-[#D4AF37]/15 py-10 md:py-12">
        <div className="container mx-auto px-4 max-w-6xl">
          <h2 className="font-serif text-2xl md:text-3xl text-[#4a1a22] font-bold mb-2 text-center" data-testid="heading-temples">
            Key Temples &amp; Sacred Sites
          </h2>
          <p className="text-sm text-[#5a4a3a]/65 text-center mb-7">All the major shrines and tirths covered in this yatra</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {yatra.keyTemples.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
                className="bg-[#FBF7EE]/60 rounded-md border border-[#D4AF37]/20 p-4"
                data-testid={`temple-${i}`}
              >
                <h3 className="font-serif text-[16px] text-[#6D2B35] font-bold mb-1 leading-snug">{t.name}</h3>
                {t.nameHi && (
                  <p className="text-[12px] text-[#D4AF37] font-serif mb-2" lang="hi">{t.nameHi}</p>
                )}
                <p className="text-[13px] text-[#5a4a3a]/80 leading-relaxed">{t.about}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Itinerary slides */}
      <section className="container mx-auto px-4 py-10 md:py-12 max-w-6xl">
        <h2 className="font-serif text-2xl md:text-3xl text-[#4a1a22] font-bold mb-2 text-center" data-testid="heading-itinerary">
          Day-by-Day Itinerary
        </h2>
        <p className="text-sm text-[#5a4a3a]/65 text-center mb-7">A complete planning template — tap any day to see details</p>
        <div className="grid lg:grid-cols-[260px_1fr] gap-4">
          <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
            {yatra.itinerary.map((d, i) => (
              <button
                key={i}
                onClick={() => setActiveDay(i)}
                className={`flex-shrink-0 lg:flex-shrink text-left px-3 py-2.5 rounded-md border transition-all ${
                  activeDay === i
                    ? "bg-[#6D2B35] text-white border-[#6D2B35]"
                    : "bg-white text-[#5a4a3a] border-[#D4AF37]/20 hover-elevate"
                }`}
                data-testid={`day-tab-${i}`}
              >
                <div className={`text-[10px] uppercase tracking-wider font-semibold ${activeDay === i ? "text-[#D4AF37]" : "text-[#D4AF37]"}`}>
                  {d.day}
                </div>
                <div className="text-[13px] font-medium leading-snug mt-0.5 line-clamp-1">{d.title}</div>
              </button>
            ))}
          </div>
          <Card className="border-[#D4AF37]/20" data-testid={`day-content-${activeDay}`}>
            <CardHeader className="pb-3">
              <Badge variant="secondary" className="bg-[#D4AF37]/15 text-[#6D2B35] border-[#D4AF37]/40 text-[10px] w-fit mb-1">
                {yatra.itinerary[activeDay].day}
              </Badge>
              <CardTitle className="font-serif text-xl text-[#4a1a22]">{yatra.itinerary[activeDay].title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[14px] text-[#5a4a3a]/85 leading-relaxed">{yatra.itinerary[activeDay].body}</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Planning data — best time, how to reach, what to pack, mantras */}
      <section className="bg-white border-y border-[#D4AF37]/15 py-10 md:py-12">
        <div className="container mx-auto px-4 max-w-6xl">
          <h2 className="font-serif text-2xl md:text-3xl text-[#4a1a22] font-bold mb-7 text-center" data-testid="heading-planning">
            Plan Your Yatra
          </h2>

          <Tabs defaultValue="best-time" className="w-full">
            <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full h-auto bg-[#FBF7EE] p-1">
              <TabsTrigger value="best-time" data-testid="tab-best-time" className="data-[state=active]:bg-white data-[state=active]:text-[#6D2B35]">
                <Sun className="w-3.5 h-3.5 mr-1.5" /> Best Time
              </TabsTrigger>
              <TabsTrigger value="how-to-reach" data-testid="tab-how-to-reach" className="data-[state=active]:bg-white data-[state=active]:text-[#6D2B35]">
                <Compass className="w-3.5 h-3.5 mr-1.5" /> How to Reach
              </TabsTrigger>
              <TabsTrigger value="pack" data-testid="tab-pack" className="data-[state=active]:bg-white data-[state=active]:text-[#6D2B35]">
                <Backpack className="w-3.5 h-3.5 mr-1.5" /> What to Pack
              </TabsTrigger>
              <TabsTrigger value="mantras" data-testid="tab-mantras" className="data-[state=active]:bg-white data-[state=active]:text-[#6D2B35]">
                <BookOpen className="w-3.5 h-3.5 mr-1.5" /> Mantras
              </TabsTrigger>
            </TabsList>

            <TabsContent value="best-time" className="mt-5">
              <div className="grid md:grid-cols-3 gap-3">
                <div className="bg-emerald-50/50 border border-emerald-200/60 rounded-md p-4" data-testid="best-time-window">
                  <div className="flex items-center gap-2 text-emerald-800 font-semibold text-[12px] uppercase tracking-wider mb-2">
                    <Sun className="w-3.5 h-3.5" /> Best Window
                  </div>
                  <p className="text-[14px] text-[#5a4a3a]">{yatra.bestTime.window}</p>
                </div>
                <div className="bg-amber-50/50 border border-amber-200/60 rounded-md p-4" data-testid="best-time-reason">
                  <div className="flex items-center gap-2 text-amber-800 font-semibold text-[12px] uppercase tracking-wider mb-2">
                    <Sparkles className="w-3.5 h-3.5" /> Why This Time
                  </div>
                  <p className="text-[13.5px] text-[#5a4a3a] leading-relaxed">{yatra.bestTime.reason}</p>
                </div>
                {yatra.bestTime.avoid && (
                  <div className="bg-rose-50/50 border border-rose-200/60 rounded-md p-4" data-testid="best-time-avoid">
                    <div className="flex items-center gap-2 text-rose-800 font-semibold text-[12px] uppercase tracking-wider mb-2">
                      <AlertTriangle className="w-3.5 h-3.5" /> Avoid
                    </div>
                    <p className="text-[13.5px] text-[#5a4a3a] leading-relaxed">{yatra.bestTime.avoid}</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="how-to-reach" className="mt-5">
              <div className="grid md:grid-cols-3 gap-3">
                {yatra.howToReach.air && (
                  <div className="bg-[#FBF7EE]/60 border border-[#D4AF37]/20 rounded-md p-4" data-testid="how-air">
                    <div className="flex items-center gap-2 text-[#6D2B35] font-semibold text-[12px] uppercase tracking-wider mb-2">
                      <Plane className="w-4 h-4" /> By Air
                    </div>
                    <p className="text-[13.5px] text-[#5a4a3a] leading-relaxed">{yatra.howToReach.air}</p>
                  </div>
                )}
                {yatra.howToReach.rail && (
                  <div className="bg-[#FBF7EE]/60 border border-[#D4AF37]/20 rounded-md p-4" data-testid="how-rail">
                    <div className="flex items-center gap-2 text-[#6D2B35] font-semibold text-[12px] uppercase tracking-wider mb-2">
                      <Train className="w-4 h-4" /> By Rail
                    </div>
                    <p className="text-[13.5px] text-[#5a4a3a] leading-relaxed">{yatra.howToReach.rail}</p>
                  </div>
                )}
                {yatra.howToReach.road && (
                  <div className="bg-[#FBF7EE]/60 border border-[#D4AF37]/20 rounded-md p-4" data-testid="how-road">
                    <div className="flex items-center gap-2 text-[#6D2B35] font-semibold text-[12px] uppercase tracking-wider mb-2">
                      <Bus className="w-4 h-4" /> By Road
                    </div>
                    <p className="text-[13.5px] text-[#5a4a3a] leading-relaxed">{yatra.howToReach.road}</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="pack" className="mt-5">
              <div className="grid sm:grid-cols-2 gap-2">
                {yatra.whatToPack.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 bg-[#FBF7EE]/60 border border-[#D4AF37]/15 rounded-md px-3 py-2.5"
                    data-testid={`pack-${i}`}
                  >
                    <ShieldCheck className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                    <span className="text-[13px] text-[#5a4a3a] leading-snug">{item}</span>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="mantras" className="mt-5">
              <div className="grid sm:grid-cols-2 gap-3">
                {yatra.mantras.map((m, i) => (
                  <div
                    key={i}
                    className="bg-gradient-to-br from-[#FBF7EE] to-white border border-[#D4AF37]/25 rounded-md p-4"
                    data-testid={`mantra-${i}`}
                  >
                    <p className="font-serif text-[15px] text-[#6D2B35] font-semibold leading-snug mb-2" lang="sa">{m.sanskrit}</p>
                    <p className="text-[12.5px] text-[#5a4a3a]/75 leading-relaxed italic">{m.meaning}</p>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Pilgrimage Card cross-link — visible value bridge */}
      <section className="bg-[#FBF7EE] border-y border-[#D4AF37]/30">
        <div className="container mx-auto px-4 py-5 md:py-6">
          <Link href="/pilgrimage-card">
            <a
              className="block max-w-5xl mx-auto rounded-md bg-white border border-[#D4AF37]/30 hover-elevate p-4 md:p-5"
              data-testid="link-pilgrimage-card-cta"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-5">
                <div className="w-10 h-10 rounded-md bg-[#6D2B35] text-[#D4AF37] flex items-center justify-center shrink-0">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] uppercase tracking-[0.25em] text-[#D4AF37] font-semibold mb-1">Pilgrimage Card · Members go free</p>
                  <p className="text-[14px] md:text-[15px] font-serif text-[#4a1a22] font-semibold leading-snug">
                    Want this yatra <span className="text-[#6D2B35]">included</span>, plus every other Tirth across Bharat for life?
                  </p>
                  <p className="text-[12px] text-[#5a4a3a]/75 mt-0.5">
                    Save a small amount every month — your parents (or you) walk every sacred land of India, fully cared for. Set up KYC in 24 hours.
                  </p>
                </div>
                <div className="shrink-0 inline-flex items-center gap-1 text-[12px] font-semibold text-[#6D2B35] bg-[#FBF7EE] border border-[#D4AF37]/30 rounded-md px-3 py-2">
                  Explore the card <ChevronRight className="h-3.5 w-3.5" />
                </div>
              </div>
            </a>
          </Link>
        </div>
      </section>

      {/* A+ benefits / steps / FAQ from existing component */}
      <PageAPlusContent
        eyebrow={`Why Vedic Tatva for ${yatra.name}`}
        title="Plan with confidence — pandit-led, end-to-end yatra support"
        intro="Vedic Tatva organises this yatra with verified Tirth Purohits, vetted accommodation, AC transport, sattvic meals and 24/7 helpline. Pilgrimage Card members get this yatra free; one randomly drawn devotee/family receives the entire yatra free every year as part of our NGO commitment."
        trustBadges={yatra.trustBadges}
        benefits={yatra.benefits}
        steps={[
          { title: "Pick the Date", body: "Choose a confirmed batch from our seasonal calendar or request a custom departure for your family group." },
          { title: "Submit Inquiry", body: "Use the form below — our yatra team calls you within 24 hours with the full plan, costs and inclusions." },
          { title: "Confirm & Pack", body: "Pay 30% to confirm. We send you a packing list, registration support and the complete yatra dossier." },
          { title: "Travel & Darshan", body: "Vedic Tatva pandit and travel guide accompany the group throughout. VIP darshan and sankalp arranged at every shrine." },
        ]}
        faqs={yatra.faqs}
        keywordsBlurb={yatra.keywordsBlurb}
      />

      {/* NGO Free Yatra section + form */}
      <section
        className="border-y border-[#D4AF37]/30"
        style={{ background: `linear-gradient(135deg, ${MAROON} 0%, #8B3A47 100%)` }}
      >
        <div className="container mx-auto px-4 py-12 md:py-14">
          <div className="grid lg:grid-cols-[1fr_1fr] gap-8 items-start max-w-6xl mx-auto">
            <div>
              <Badge className="bg-[#D4AF37] text-[#4a1a22] hover:bg-[#D4AF37] mb-3" data-testid="badge-ngo">
                <Sparkles className="h-3 w-3 mr-1" /> Vedic Tatva NGO Initiative
              </Badge>
              <h2 className="font-serif text-2xl md:text-4xl text-white font-bold leading-tight mb-3" data-testid="heading-free-yatra">
                Free {yatra.name} — Annual NGO Lucky Draw
              </h2>
              <p className="text-[15px] text-white/90 leading-relaxed mb-4">
                As part of our NGO seva, Vedic Tatva sponsors one fully-paid <strong>{yatra.name}</strong>{" "}
                each year for a randomly selected devotee or family who could not otherwise afford the journey.
                Every interested devotee enters the lucky draw — drawn live every year on Vasant Panchami.
              </p>
              <ul className="space-y-2 mb-5">
                {[
                  "Entire yatra fully sponsored — transport, stay, meals, pandit, VIP darshan included",
                  "Lucky draw conducted live on Vasant Panchami every year (open & video-recorded)",
                  "Anyone can register — no purchase required, no income criteria, completely free",
                  "Even if not selected, you get full planning help, packing list & route guide on WhatsApp",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-[13px] text-white/90">
                    <Heart className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="bg-white/10 border border-white/20 rounded-md p-3 backdrop-blur-sm">
                <p className="text-[12px] text-white/80 leading-relaxed">
                  <strong className="text-[#D4AF37]">Tick the "free yatra interest" checkbox below</strong> to enter the annual draw.
                  You'll receive a confirmation on WhatsApp and your name auto-enters every year you remain subscribed.
                </p>
              </div>
            </div>

            {/* Form */}
            <Card className="bg-white shadow-2xl" data-testid="card-yatra-form">
              <CardHeader>
                <CardTitle className="font-serif text-xl text-[#4a1a22]">
                  {yatra.name} — Interest &amp; Free Yatra Registration
                </CardTitle>
                <p className="text-xs text-[#5a4a3a]/70">
                  Fill in your details to receive yatra planning help and (optionally) enter the annual NGO lucky draw.
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="y-name">Full Name *</Label>
                    <Input id="y-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="input-name" />
                  </div>
                  <div>
                    <Label htmlFor="y-phone">Phone (WhatsApp) *</Label>
                    <Input id="y-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} data-testid="input-phone" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="y-email">Email</Label>
                    <Input id="y-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} data-testid="input-email" />
                  </div>
                  <div>
                    <Label htmlFor="y-city">City</Label>
                    <Input id="y-city" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} data-testid="input-city" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="y-travelers">Travellers</Label>
                    <Input
                      id="y-travelers"
                      type="number"
                      min={1}
                      max={20}
                      value={form.travelers}
                      onChange={(e) => setForm({ ...form, travelers: Number(e.target.value) })}
                      data-testid="input-travelers"
                    />
                  </div>
                  <div>
                    <Label htmlFor="y-month">Preferred Month</Label>
                    <Input
                      id="y-month"
                      placeholder={`e.g. ${yatra.bestSeason.split(",")[0].trim()}`}
                      value={form.preferredMonth}
                      onChange={(e) => setForm({ ...form, preferredMonth: e.target.value })}
                      data-testid="input-month"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="y-msg">Message (optional)</Label>
                  <Textarea
                    id="y-msg"
                    rows={2}
                    placeholder="Any questions about this yatra?"
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    data-testid="input-message"
                  />
                </div>

                <label className="flex items-start gap-2 bg-[#FBF7EE] border border-[#D4AF37]/30 rounded-md p-3 cursor-pointer hover-elevate">
                  <input
                    type="checkbox"
                    checked={form.forFree}
                    onChange={(e) => setForm({ ...form, forFree: e.target.checked })}
                    className="mt-0.5 w-4 h-4 accent-[#6D2B35]"
                    data-testid="checkbox-free-yatra"
                  />
                  <span className="text-[12.5px] text-[#5a4a3a] leading-snug">
                    <strong className="text-[#6D2B35]">Yes — enter me in the annual Free {yatra.name} NGO lucky draw.</strong> I understand the draw is open, recorded and conducted on Vasant Panchami every year.
                  </span>
                </label>

                <Button
                  onClick={submit}
                  disabled={inquireMut.isPending}
                  className={`w-full ${PRIMARY_BTN}`}
                  data-testid="btn-submit"
                >
                  {inquireMut.isPending ? "Sending..." : form.forFree ? "Enter Lucky Draw + Get Yatra Plan" : "Send Inquiry"}
                </Button>
                <p className="text-[10px] text-[#5a4a3a]/60 text-center">
                  By submitting, you agree to be contacted on WhatsApp/phone.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Related yatras */}
      {related.length > 0 && (
        <section className="container mx-auto px-4 py-12 max-w-6xl">
          <h2 className="font-serif text-2xl text-[#4a1a22] font-bold mb-2" data-testid="heading-related">
            Related Yatras You May Like
          </h2>
          <p className="text-sm text-[#5a4a3a]/65 mb-6">Other sacred journeys in the same region or tradition</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {related.map((r) => {
              const RIcon = r.icon;
              return (
                <Link
                  key={r.slug}
                  href={`/tirth-yatra/${r.slug}`}
                  className="block bg-white rounded-md border border-[#D4AF37]/20 p-4 hover-elevate transition-all"
                  data-testid={`related-${r.slug}`}
                >
                  <div className="w-9 h-9 rounded-md bg-[#FBF7EE] border border-[#D4AF37]/20 flex items-center justify-center mb-2.5">
                    <RIcon className="w-4 h-4 text-[#6D2B35]" strokeWidth={1.6} />
                  </div>
                  <h3 className="font-serif text-[14px] text-[#6D2B35] font-bold leading-snug mb-1">{r.name}</h3>
                  <p className="text-[11px] text-[#5a4a3a]/65 leading-snug line-clamp-2">{r.shortInfo}</p>
                </Link>
              );
            })}
          </div>
          <div className="text-center mt-6">
            <Link href="/tirth-yatra" className="inline-flex items-center gap-1.5 text-[12px] text-[#6D2B35] hover:text-[#5a1f29] font-semibold uppercase tracking-wider" data-testid="link-back-hub">
              <ArrowLeft className="w-3.5 h-3.5" /> Browse all Tirth Yatras
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}

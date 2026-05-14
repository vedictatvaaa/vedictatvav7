import { useState } from "react";
import { Link } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Star, Video, FileText, Sparkles, Hand, Baby, Brain, ArrowRight, Heart, Briefcase, Sun, Clock } from "lucide-react";
import PageAPlusContent from "@/components/PageAPlusContent";
import PageSeo from "@/components/PageSeo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { RelatedServicesSection } from "@/components/RelatedServices";
import { PageHero, SectionHeader, IconTile, slimCard } from "@/components/ui/section-primitives";

export default function Astrology() {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [birthCity, setBirthCity] = useState("");

  const bookMutation = useMutation({
    mutationFn: async (serviceType: string) => {
      const prices: Record<string, number> = { kundli: 199, video: 1499, matchmaking: 299 };
      const res = await fetch("/api/astrology-bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceType,
          fullName: name || "Guest User",
          birthDate: birthDate || "2000-01-01",
          birthTime: birthTime || null,
          birthCity: birthCity || null,
          totalAmount: prices[serviceType] || 199,
        }),
      });
      if (!res.ok) throw new Error("Failed to book");
      return res.json();
    },
    onSuccess: (_, serviceType) => {
      toast({ title: "Booking Created!", description: `Your ${serviceType} booking has been confirmed.` });
    },
    onError: () => {
      toast({ title: "Error", description: "Could not process. Please try again.", variant: "destructive" });
    },
  });

  const aiServices = [
    {
      title: "AI Kundli Generation",
      description: "Get a comprehensive Vedic birth chart with planetary positions, doshas, mahadasha, predictions, yogas, and personalized remedies — all powered by AI.",
      icon: Brain,
      href: "/ai-kundli",
      badge: "Free • AI Powered",
      color: "from-purple-500/10 to-indigo-500/10",
      iconColor: "text-purple-600",
    },
    {
      title: "AI Baby Name Generator",
      description: "Discover auspicious baby names based on nakshatra, rashi, and Vedic traditions. Get 15 meaningful name suggestions with origins and numerology.",
      icon: Baby,
      href: "/ai-baby-names",
      badge: "Free • AI Powered",
      color: "from-pink-500/10 to-rose-500/10",
      iconColor: "text-pink-600",
    },
    {
      title: "AI Palm Reading",
      description: "Upload a photo of your palm and get an instant Hast Rekha Shastra analysis — heart line, head line, life line, mounts, markings, and predictions.",
      icon: Hand,
      href: "/ai-palm-reading",
      badge: "Free • AI Powered",
      color: "from-amber-500/10 to-orange-500/10",
      iconColor: "text-amber-600",
    },
  ];

  return (
    <div className="w-full pb-16 bg-white">
      <PageSeo
        title="Free Vedic Astrology — Janam Kundli, Rashifal, Kundli Matching & Astrologer Consultation | Vedic Tatva"
        description="Generate free Janam Kundli with Lahiri Ayanamsa, read daily/weekly/monthly rashifal for all 12 rashis, check 36-point Ashtakoot kundli matching for marriage, find shubh muhurat, get baby names by nakshatra, AI palm reading & Vastu compass — and consult India's most experienced verified Vedic astrologers via chat, voice or video. Available in Hindi, English, Tamil, Telugu, Kannada, Bengali, Marathi, Gujarati & 12+ languages."
        keywords="free kundli online, janam kundli in hindi, vedic kundli generator, lahiri ayanamsa kundli, daily rashifal, today rashifal in hindi, weekly horoscope, monthly horoscope, kundli matching for marriage, ashtakoot guna milan, manglik dosha check, kaal sarp dosh, pitra dosh remedy, shubh muhurat finder, abhijit muhurat, brahma muhurat, baby name by nakshatra, baby name by rashi, ai palm reading hastrekha, vastu compass, panchang today, tithi today, nakshatra today, rahu kaal today, online astrologer consultation, talk to astrologer, video call astrologer, vedic astrology in tamil, telugu astrology, kannada astrology, bengali astrology, marathi astrology, gujarati astrology, career astrology, marriage astrology, child birth prediction, business muhurat, dosha remedy puja"
        canonical="/astrology"
        ogType="website"
        twitterCard="summary_large_image"
      />
      <PageHero
        eyebrow="Vedic Wisdom"
        title="Astrology consultations"
        subtitle="Discover your path with AI-powered kundli readings, palm analysis, baby name suggestions, and expert guidance."
        variant="maroon"
        testId="hero-astrology"
      />

      <div className="container mx-auto px-4">
        <section className="pt-12 pb-12">
          <SectionHeader
            eyebrow="AI Tools"
            title="Instant & free Vedic insights"
            subtitle="Three AI-powered tools — kundli, palm reading and baby names — answering in seconds."
          />
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
            {aiServices.map((service) => (
              <Link key={service.title} href={service.href}>
                <Card className={`${slimCard} h-full cursor-pointer group shadow-none`} data-testid={`card-ai-${service.href.slice(1)}`}>
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <IconTile icon={service.icon} />
                      <span className="text-[10px] uppercase tracking-[0.18em] font-semibold text-emerald-700">{service.badge}</span>
                    </div>
                    <h3 className="text-base font-serif font-semibold text-[#6D2B35] mb-1.5">{service.title}</h3>
                    <p className="text-[12.5px] text-[#5a4a3a]/65 leading-relaxed mb-4">{service.description}</p>
                    <div className="inline-flex items-center text-[#6D2B35] text-[12px] font-semibold group-hover:gap-1.5 gap-1 transition-all">
                      Try now <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        <section className="py-12 border-t border-[#D4AF37]/15">
          <SectionHeader
            eyebrow="Expert Consultation"
            title="Talk to a verified Vedic scholar"
            subtitle="Detailed kundli reports, 1:1 video sessions and Ashtakoot match-making."
          />
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
            <Card className={`${slimCard} text-center shadow-none`}>
              <CardContent className="pt-7 pb-6 px-5">
                <IconTile icon={FileText} className="mx-auto mb-4" />
                <h3 className="text-base font-serif font-semibold text-[#6D2B35] mb-1.5">Kundli report</h3>
                <p className="text-[12.5px] text-[#5a4a3a]/65 mb-5 leading-relaxed">Expert-verified 40+ page report with remedies and predictions.</p>
                <div className="text-xl font-serif font-semibold text-[#5a4a3a] mb-4">₹199</div>
                <Button
                  variant="outline"
                  className="w-full border-[#6D2B35]/40 text-[#6D2B35] hover:bg-[#FBF7EE] rounded-md h-10 text-[13px] font-semibold"
                  onClick={() => bookMutation.mutate("kundli")}
                  disabled={bookMutation.isPending}
                  data-testid="btn-get-kundli"
                >
                  Book now
                </Button>
              </CardContent>
            </Card>

            <Card className="rounded-lg border border-[#D4AF37]/45 bg-white text-center relative shadow-none">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#D4AF37] text-[#6D2B35] text-[10px] font-bold px-3 py-0.5 rounded-md uppercase tracking-[0.18em]">
                Most popular
              </div>
              <CardContent className="pt-7 pb-6 px-5">
                <IconTile icon={Video} tone="gold" className="mx-auto mb-4" />
                <h3 className="text-base font-serif font-semibold text-[#6D2B35] mb-1.5">Video consultation</h3>
                <p className="text-[12.5px] text-[#5a4a3a]/65 mb-5 leading-relaxed">1:1 live 30-minute video call with a premium verified astrologer.</p>
                <div className="text-xl font-serif font-semibold text-[#5a4a3a] mb-4">₹1,499</div>
                <Button
                  className="w-full bg-[#6D2B35] hover:bg-[#5a2430] text-white rounded-md h-10 text-[13px] font-semibold"
                  onClick={() => bookMutation.mutate("video")}
                  disabled={bookMutation.isPending}
                  data-testid="btn-book-video"
                >
                  Book session
                </Button>
              </CardContent>
            </Card>

            <Card className={`${slimCard} text-center shadow-none`}>
              <CardContent className="pt-7 pb-6 px-5">
                <IconTile icon={Star} className="mx-auto mb-4" />
                <h3 className="text-base font-serif font-semibold text-[#6D2B35] mb-1.5">Match making</h3>
                <p className="text-[12.5px] text-[#5a4a3a]/65 mb-5 leading-relaxed">Guna Milan compatibility report for marriage on the Ashtakoot method.</p>
                <div className="text-xl font-serif font-semibold text-[#5a4a3a] mb-4">₹299</div>
                <Button
                  variant="outline"
                  className="w-full border-[#6D2B35]/40 text-[#6D2B35] hover:bg-[#FBF7EE] rounded-md h-10 text-[13px] font-semibold"
                  onClick={() => bookMutation.mutate("matchmaking")}
                  disabled={bookMutation.isPending}
                  data-testid="btn-get-match"
                >
                  Check match
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="py-12">
          <div className="rounded-lg border border-[#D4AF37]/25 bg-[#FBF7EE] p-6 sm:p-8 max-w-4xl mx-auto">
            <SectionHeader
              eyebrow="Quick Check"
              title="Quick kundli check"
              subtitle="Enter birth details to book a personalised reading."
            />
            <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
              <Input placeholder="Full name" className="bg-white border-[#D4AF37]/30 rounded-md h-10 text-[13px]" value={name} onChange={(e) => setName(e.target.value)} data-testid="input-k-name" />
              <Input type="date" className="bg-white border-[#D4AF37]/30 rounded-md h-10 text-[13px]" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} data-testid="input-k-date" />
              <Input type="time" className="bg-white border-[#D4AF37]/30 rounded-md h-10 text-[13px]" value={birthTime} onChange={(e) => setBirthTime(e.target.value)} data-testid="input-k-time" />
              <Input placeholder="Birth city" className="bg-white border-[#D4AF37]/30 rounded-md h-10 text-[13px]" value={birthCity} onChange={(e) => setBirthCity(e.target.value)} data-testid="input-k-city" />
            </div>
            <div className="text-center">
              <Button
                className="bg-[#6D2B35] text-white hover:bg-[#5a2430] rounded-md px-6 h-10 text-[13px] font-semibold"
                onClick={() => bookMutation.mutate("kundli")}
                disabled={bookMutation.isPending || !name || !birthDate}
                data-testid="btn-quick-check"
              >
                {bookMutation.isPending ? "Processing…" : "Book kundli report — ₹199"}
              </Button>
            </div>
          </div>
        </section>

        <PageAPlusContent
          eyebrow="Why Choose Vedic Tatva Astrology"
          title="Online Vedic Astrology — Kundli, Predictions & Astrologer Consultation"
          intro="Vedic Tatva is your one-stop Sanatan astrology platform. Generate your free kundli, read daily rashifal, check kundli matching, find muhurat, get baby names by nakshatra, scan your palm — and consult India's most experienced Vedic astrologers for life-changing decisions."
          trustBadges={[
            { value: "500+", label: "Verified Astrologers" },
            { value: "10L+", label: "Kundlis Generated" },
            { value: "12+", label: "Languages" },
            { value: "4.8", label: "Avg Rating" },
          ]}
          benefits={[
            { icon: Star, title: "Free Vedic Kundli", body: "Generate your authentic Janam Kundli using Lahiri Ayanamsa with full dasha analysis, dosha detection and personalised remedies — completely free." },
            { icon: Heart, title: "Free Kundli Matching", body: "Check 36-point Ashtakoot Guna Milan for marriage compatibility — Mangal Dosha and Bhakoot Dosha automatically flagged." },
            { icon: Sun, title: "Daily, Weekly & Monthly Rashifal", body: "Read fresh daily horoscope for all 12 rashis in both Vedic (Moon sign) and Western (Sun sign) systems." },
            { icon: Clock, title: "Shubh Muhurat Finder", body: "Find auspicious dates for wedding, griha pravesh, mundan, namkaran, business launch and 30+ Hindu ceremonies." },
            { icon: Video, title: "1-on-1 Astrologer Consult", body: "Talk or video-call with India's most experienced Vedic astrologers — verified for Sanskrit knowledge, lineage and accurate predictions." },
            { icon: Briefcase, title: "Career, Love, Health, Money", body: "Personalised guidance across career, love, marriage, finance, health and family — based on your unique kundli." },
          ]}
          steps={[
            { title: "Generate Free Kundli", body: "Enter your birth details and instantly receive your full Vedic birth chart, dashas and predictions." },
            { title: "Explore Free Tools", body: "Try kundli matching, baby names, palm reading, Vastu compass, muhurat finder — all free, all authentic." },
            { title: "Browse Astrologers", body: "Pick a verified astrologer by specialty (career, marriage, child, finance), language and reviews." },
            { title: "Book a Consultation", body: "Chat, voice or video — flexible options at transparent pricing. Get clear, actionable guidance." },
          ]}
          faqs={[
            { q: "Is Vedic Tatva astrology really free?", a: "Yes — generating kundli, daily rashifal, kundli matching, baby names, palm reading, muhurat finder and Vastu compass are 100% free. Premium 1-on-1 astrologer consultations (chat, voice, video) are paid — at transparent, fair prices." },
            { q: "What is the difference between Vedic and Western astrology?", a: "Vedic astrology (Jyotish) uses the sidereal zodiac with Lahiri Ayanamsa and is Moon-sign based. Western astrology uses the tropical zodiac and is Sun-sign based. Vedic is considered more accurate for life predictions, while Western is popular for personality insight. Vedic Tatva supports both." },
            { q: "How accurate are the predictions?", a: "Calculations use Drik Siddhanta (modern astronomical accuracy) combined with Lahiri Ayanamsa — the same standard used by ISRO and the Indian government's Rashtriya Panchang. Personalised AI predictions are highly accurate for direction; for major life decisions, pair with our verified astrologers." },
            { q: "How do I choose the right astrologer?", a: "Browse by specialty (career, marriage, child birth, finance, health, education), regional language (Hindi, English, Tamil, Telugu, Kannada, Bengali, Marathi, Gujarati and more), price range, and verified ratings/reviews from past clients." },
            { q: "Are the astrologers really verified?", a: "Yes — every astrologer goes through document verification (Jyotish degrees from recognised Sanskrit institutions), an interview, a scriptural assessment based on classical texts like Brihat Parashara Hora Shastra and Phaladeepika, and an initial trial period before being listed. We are deliberately selective so listed astrologers carry genuine knowledge and lineage." },
            { q: "Can I consult an astrologer in my regional language?", a: "Yes — astrologers available in Hindi, English, Sanskrit, Tamil, Telugu, Kannada, Bengali, Marathi, Gujarati, Malayalam, Punjabi and Odia. Filter by language when browsing astrologer profiles." },
            { q: "What kind of questions can I ask?", a: "Career direction, job change, business start/expansion, marriage timing, partner compatibility, child birth, education, foreign travel, property purchase, health concerns, finance/investment, dosha remedies (Kaal Sarp, Mangal, Pitra), spiritual guidance — anything tied to your kundli." },
            { q: "Is online astrology consultation as effective as in-person?", a: "Yes — for chart-based predictions, online (chat/voice/video) is equally effective. The astrologer needs only your accurate birth details to perform analysis. Online has additional advantages: chat history saved, video recordings, no travel time, access to specialists across India." },
          ]}
          keywordsBlurb="Online Vedic astrology platform — free Janam kundli, daily rashifal, kundli matching for marriage, AI baby names by nakshatra, AI palm reading (hastrekha), Vastu compass, shubh muhurat finder, panchang and astrologer consultation. Authentic Jyotish predictions in Hindi, English, Tamil, Telugu, Kannada, Bengali, Marathi, Gujarati and 12+ Indian languages. Verified Vedic astrologers for career, marriage, business, child birth, finance, health and dosha remedies. Free astrology, paid consultation — transparent pricing, scripture-accurate predictions."
        />

        <RelatedServicesSection context="astrology" currentPath="/astrology" />
      </div>
    </div>
  );
}

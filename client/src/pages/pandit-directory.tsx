import { useState, useMemo, useEffect, useCallback } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { optImg, optImgSrcSet, SIZES } from "@/lib/optImg";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MapPin, Star, Languages, Award, Search, Crown, ChevronDown, ChevronRight, ArrowUpDown, MessageSquare, X, Loader2, Send, Clock, Sparkles, ExternalLink, Navigation, Filter, ShieldCheck, Heart as HeartIcon, Globe, Video, ArrowRight, Building2, Flame, BellRing, Check, IndianRupee, MessageCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { RelatedServicesSection } from "@/components/RelatedServices";
import PageAPlusContent from "@/components/PageAPlusContent";
import PageSeo from "@/components/PageSeo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { faqPage as faqPageSchema, breadcrumbList as breadcrumbListSchema, service as serviceSchema, abs } from "@/lib/seo-schemas";
import type { Pandit, PanditReview } from "@shared/schema";

const PANDIT_DIR_H1 = "Book a Verified Vedic Pandit Near You — Same-Day Puja, Transparent Pricing";

const PANDIT_FAQS = [
  { q: "How do I book a pandit online?", a: "Browse verified pandits by city and ceremony, pick your preferred shubh muhurat date, and complete booking with secure payment. Confirmation arrives within minutes — usually with a WhatsApp message from your pandit." },
  { q: "Are the pandits really verified?", a: "Yes. Every pandit on Vedic Tatva is identity-verified (Aadhaar + photo), scripture-trained (Veda / Karmakand certification), and rated by past clients. We display their experience, languages, and ceremony specialisations transparently." },
  { q: "Can I book a pandit for same-day puja?", a: "Yes. Many pandits accept same-day bookings subject to availability. Use the 'Available Today' filter on the listing to instantly see pandits free for booking right now." },
  { q: "What ceremonies do your pandits perform?", a: "Satyanarayan Puja, Griha Pravesh, Wedding (Vivah), Mundan, Namkaran, Rudrabhishek, Navagraha Shanti, Shradh, Vastu Shanti, Ganesh Puja, Lakshmi Puja, Saraswati Puja, Kaal Sarp Dosh Nivaran and 50+ other ceremonies." },
  { q: "Will the pandit bring the puja samagri?", a: "You can choose to add a complete pre-checked samagri kit to your booking at checkout — delivered to your home before the puja. Or arrange your own using the checklist we share." },
  { q: "What about dakshina? Is it included in the fee?", a: "The booking fee covers the pandit's professional services. Dakshina (a traditional offering) is given separately as per your wish — we share suggested ranges based on the ceremony." },
  { q: "Can the pandit perform puja in my language?", a: "Yes. Filter pandits by language — Sanskrit, Hindi, Marathi, Tamil, Telugu, Kannada, Malayalam, Bengali, Gujarati, Punjabi, Odia and more — to ensure the rituals are explained in your preferred tongue." },
  { q: "What if I need to reschedule or cancel?", a: "Free rescheduling up to 24 hours before the ceremony. Cancellations get a full refund up to 48 hours prior. Read our refund policy for full details." },
];

type PanditWithDistance = Pandit & { distance: number | null };

const REGIONAL_ORIGINS = [
  { value: "", label: "All Traditions" },
  { value: "Bengali", label: "Bengali" },
  { value: "Bihari", label: "Bihari" },
  { value: "Marwari", label: "Marwari" },
  { value: "South Indian", label: "South Indian" },
  { value: "Maharashtrian", label: "Maharashtrian" },
  { value: "Gujarati", label: "Gujarati" },
  { value: "Kashmiri", label: "Kashmiri" },
  { value: "Odia", label: "Odia" },
  { value: "UP", label: "UP / Awadhi" },
  { value: "Punjabi", label: "Punjabi" },
  { value: "Nepali", label: "Nepali" },
];

const BOOST_PLANS = [
  { type: "monthly" as const, label: "Monthly Boost", price: 499, duration: "30 days", savings: "" },
  { type: "yearly" as const, label: "Yearly Boost", price: 3999, duration: "365 days", savings: "Save 33%" },
];

const TRUST_SIGNALS = [
  "Verified documents",
  "Scripture-trained",
  "Fast response",
  "WhatsApp support",
];

const BOOKING_GUIDE = [
  "Choose a verified pandit by city, tradition, language, and price.",
  "See availability, ratings, and live/online options upfront.",
  "Book instantly with transparent pricing and support after checkout.",
];

const CITY_TILES: Array<{ slug: string; name: string; tagline: string; defaultCity: string; live: boolean; }> = [
  { slug: "delhi-ncr", name: "Delhi NCR", tagline: "Verified Pandits — Live Now", defaultCity: "Delhi", live: true },
  { slug: "mumbai", name: "Mumbai", tagline: "Coming Soon", defaultCity: "Mumbai", live: false },
  { slug: "bangalore", name: "Bangalore", tagline: "Coming Soon", defaultCity: "Bangalore", live: false },
  { slug: "chennai", name: "Chennai", tagline: "Coming Soon", defaultCity: "Chennai", live: false },
  { slug: "kolkata", name: "Kolkata", tagline: "Coming Soon", defaultCity: "Kolkata", live: false },
  { slug: "guwahati", name: "Guwahati", tagline: "Coming Soon", defaultCity: "Guwahati", live: false },
  { slug: "lucknow", name: "Lucknow", tagline: "Coming Soon", defaultCity: "Lucknow", live: false },
];

// Unified cinematic hero — full-bleed image with dark warm wash for text contrast (no opaque block).
function SlimHero({ eyebrow, title, subtitle, children }: { eyebrow: string; title: string; subtitle?: string; children?: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden bg-[#1a0a0e] border-b border-[#D4AF37]/30">
      <img
        src={optImg("/attached_assets/heroes/hero-scene-pandit.png", 1080) || "/attached_assets/heroes/hero-scene-pandit.png"}
        srcSet={optImgSrcSet("/attached_assets/heroes/hero-scene-pandit.png", [320, 480, 768, 1080, 1440])}
        sizes={SIZES.hero}
        alt="Verified Vedic pandit performing havan with sacred fire and marigold petals"
        className="absolute inset-0 w-full h-full object-cover object-[70%_center]"
        loading="eager"
        fetchPriority="high"
        decoding="async"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#1a0a0e]/85 via-[#1a0a0e]/55 to-[#1a0a0e]/15" aria-hidden="true" />
      <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-[#1a0a0e]/65 to-transparent" aria-hidden="true" />
      <div className="relative container mx-auto px-4 py-7 sm:py-10 md:py-14 text-center max-w-3xl">
        <div className="flex items-center justify-center gap-2 mb-2.5">
          <span className="h-px w-6 sm:w-8 bg-[#D4AF37]/70" />
          <span
            className="inline-flex items-center gap-1.5 text-[9px] sm:text-[11px] uppercase tracking-[0.28em] sm:tracking-[0.3em] text-[#D4AF37] font-semibold"
            style={{ textShadow: "0 1px 8px rgba(0,0,0,0.55)" }}
          >
            <Sparkles className="w-3 h-3" /> {eyebrow}
          </span>
          <span className="h-px w-6 sm:w-8 bg-[#D4AF37]/70" />
        </div>
        <h1
          className="text-[19px] leading-[1.2] sm:text-2xl md:text-3xl lg:text-4xl font-serif text-white mb-2 sm:mb-3 font-semibold tracking-tight"
          style={{ textShadow: "0 2px 18px rgba(0,0,0,0.7), 0 1px 3px rgba(0,0,0,0.5)" }}
          data-testid="text-pandit-title"
        >
          {title}
        </h1>
        {subtitle && (
          <p
            className="text-white/90 text-[13px] sm:text-sm md:text-[15px] leading-snug sm:leading-relaxed max-w-xl mx-auto"
            style={{ textShadow: "0 1px 12px rgba(0,0,0,0.6)" }}
          >
            {subtitle}
          </p>
        )}
        {children}
      </div>
    </div>
  );
}

function CityChooser() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [comingSoonCity, setComingSoonCity] = useState<string | null>(null);
  const [notifyEmail, setNotifyEmail] = useState("");
  const [notifySent, setNotifySent] = useState(false);

  useEffect(() => {
    if (!comingSoonCity) {
      setNotifyEmail("");
      setNotifySent(false);
    }
  }, [comingSoonCity]);

  const [notifySubmitting, setNotifySubmitting] = useState(false);
  const handleNotify = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = notifyEmail.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({ title: "Please enter a valid email", variant: "destructive" });
      return;
    }
    setNotifySubmitting(true);
    try {
      const r = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, language: "en" }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok || data?.ok === false) {
        toast({ title: "Couldn't add you to the list", description: data?.message || "Please try again in a moment.", variant: "destructive" });
        return;
      }
      setNotifySent(true);
      toast({
        title: data?.alreadySubscribed
          ? `You're already subscribed — we'll email you when ${comingSoonCity} goes live`
          : `You're on the list — we'll email you when ${comingSoonCity} goes live`,
      });
    } catch {
      toast({ title: "Network error", description: "Please check your connection and try again.", variant: "destructive" });
    } finally {
      setNotifySubmitting(false);
    }
  };

  return (
    <div className="w-full pb-20 bg-white">
      <PageSeo
        title="Book a Verified Vedic Pandit Online — Same-Day Puja Booking | Vedic Tatva"
        description="Book a verified Vedic pandit online for Satyanarayan Puja, Griha Pravesh, Wedding, Rudrabhishek, Mundan, Namkaran, Navagraha Shanti and 50+ ceremonies across Delhi NCR, Mumbai, Bengaluru, Pune, Chennai, Kolkata, Hyderabad and 75+ Indian cities. Same-day booking, transparent dakshina, multi-language pandits (Sanskrit, Hindi, Tamil, Telugu, Marathi, Bengali, Gujarati, Kannada). 100% identity-verified, scripture-trained Brahmin pandits."
        keywords="book pandit online, pandit near me, verified pandit booking, brahmin pandit, satyanarayan puja pandit, griha pravesh pandit, wedding pandit, rudrabhishek pandit, mundan pandit, namkaran pandit, navagraha shanti, same-day pandit, sanskrit pandit, hindi pandit, tamil pandit, marathi pandit, telugu pandit, bengali pandit, gujarati pandit, pandit in delhi, pandit in mumbai, pandit in bangalore, pandit in pune, pandit in chennai, pandit in hyderabad, pandit in kolkata"
        canonical="/online-pandit-booking"
        ogType="website"
        twitterCard="summary_large_image"
        schemas={[
          breadcrumbListSchema([
            { name: "Home", url: abs("/") },
            { name: "Verified Pandits", url: abs("/book-pandit-online") },
          ]),
          faqPageSchema(PANDIT_FAQS.map(f => ({ question: f.q, answer: f.a })), "pandit-dir-faq"),
          serviceSchema({
            name: "Verified Vedic Pandit Booking",
            description: "Book identity-verified, scripture-trained Vedic pandits across 75+ Indian cities for Satyanarayan, Griha Pravesh, Wedding, Rudrabhishek and 50+ ceremonies. Same-day booking, transparent pricing, multi-language support.",
            url: abs("/book-pandit-online"),
            providerName: "Vedic Tatva",
            areaServed: ["IN", "US", "GB", "CA", "AU", "SG", "AE"],
          }),
        ]}
      />
      <nav aria-label="Breadcrumb" className="bg-[#FBF7EE] border-b border-[#D4AF37]/15">
        <ol className="container mx-auto px-4 py-1.5 flex items-center gap-1 text-[11px] sm:text-[12px] text-[#5a4a3a]/75">
          <li><Link href="/" className="hover:text-[#6D2B35]" data-testid="link-breadcrumb-home">Home</Link></li>
          <li aria-hidden="true"><ChevronRight className="w-3 h-3 inline" /></li>
          <li aria-current="page" className="text-[#6D2B35] font-semibold">Verified Pandits</li>
        </ol>
      </nav>
      <SlimHero
        eyebrow="Verified Pandit Bookings"
        title={PANDIT_DIR_H1}
        subtitle="Choose your city to see verified, local Tirth Purohits and Karmakandi Brahmins for every ritual."
      >
        <p className="text-white/50 text-xs mt-2">
          Don't see your city? You can still book any puja online — performed live by our pandits.
        </p>
      </SlimHero>

      <div className="container mx-auto px-4 mt-10">
        {/* Online Puja CTA — slim cream panel */}
        <div className="max-w-5xl mx-auto bg-[#FBF7EE] border border-[#D4AF37]/30 rounded-md p-5 sm:p-6 mb-10">
          <div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
            <div className="w-12 h-12 shrink-0 rounded-md bg-[#6D2B35] flex items-center justify-center">
              <Video className="w-6 h-6 text-[#D4AF37]" strokeWidth={1.6} />
            </div>
            <div className="flex-1">
              <h3 className="font-serif text-lg sm:text-xl text-[#6D2B35] font-semibold mb-1">
                Online Puja — Live, From Anywhere in the World
              </h3>
              <p className="text-sm text-[#5a4a3a]/75 leading-relaxed">
                Live Sankalp via video call, full vidhi performed by verified pandits at the temple, photo-video proof and prasad couriered to your home. Available worldwide — book in any city.
              </p>
            </div>
            <Link href="/puja?mode=online">
              <Button className="bg-[#6D2B35] text-[#D4AF37] hover:bg-[#5a1f29] rounded-md h-10 px-5 text-[13px] font-semibold shrink-0" data-testid="btn-online-puja-cta-cities">
                <Globe className="w-4 h-4 mr-2" /> Book Online Puja
              </Button>
            </Link>
          </div>
        </div>

        {/* Section header */}
        <div className="text-center mb-6">
          <h2 className="font-serif text-2xl sm:text-3xl text-[#6D2B35] font-semibold mb-1 tracking-tight">Pick Your City</h2>
          <p className="text-xs sm:text-sm text-[#5a4a3a]/60">Live in Delhi NCR today — more cities arriving soon.</p>
        </div>

        {/* City tiles — slim hairline grid */}
        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-px bg-[#D4AF37]/20 rounded-md overflow-hidden border border-[#D4AF37]/25">
          {CITY_TILES.map((tile) => {
            const Inner = (
              <div
                className={`relative bg-white p-5 sm:p-6 text-center h-full hover-elevate ${tile.live ? "" : "opacity-90"}`}
                data-testid={`tile-city-${tile.slug}`}
              >
                {!tile.live && (
                  <span className="absolute top-2 right-2 text-[9px] uppercase tracking-wider bg-[#5a4a3a]/10 text-[#5a4a3a]/70 px-2 py-0.5 rounded-md font-semibold">
                    Soon
                  </span>
                )}
                {tile.live && (
                  <span className="absolute top-2 right-2 text-[9px] uppercase tracking-wider bg-emerald-50 border border-emerald-200 text-emerald-700 px-2 py-0.5 rounded-md font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" /> Live
                  </span>
                )}
                <div className={`w-11 h-11 mx-auto mb-3 rounded-md flex items-center justify-center border ${tile.live ? "bg-[#6D2B35] border-[#6D2B35]" : "bg-[#FBF7EE] border-[#D4AF37]/25"}`}>
                  <Building2 className={`w-5 h-5 ${tile.live ? "text-[#D4AF37]" : "text-[#5a4a3a]/50"}`} strokeWidth={1.5} />
                </div>
                <h3 className={`font-serif font-semibold text-base sm:text-lg mb-0.5 ${tile.live ? "text-[#6D2B35]" : "text-[#5a4a3a]/70"}`}>
                  {tile.name}
                </h3>
                <p className={`text-[11px] ${tile.live ? "text-[#D4AF37]" : "text-[#5a4a3a]/50"} font-medium`}>
                  {tile.tagline}
                </p>
              </div>
            );
            if (tile.live) {
              return (
                <Link key={tile.slug} href={`/book-pandit-online/${tile.slug}`} className="block h-full">
                  {Inner}
                </Link>
              );
            }
            return (
              <button key={tile.slug} type="button" onClick={() => setComingSoonCity(tile.name)} className="block h-full text-left">
                {Inner}
              </button>
            );
          })}
        </div>

        <p className="text-center text-xs text-[#5a4a3a]/55 mt-8 max-w-md mx-auto">
          We're onboarding verified pandits city-by-city. Tap any "Coming Soon" city to be notified — or book an online puja today.
        </p>

        {/* Pind Daan CTA — slim maroon panel, no gradient */}
        <div className="max-w-5xl mx-auto mt-12">
          <Link href="/pind-daan-booking" className="block group" data-testid="link-pind-daan-cta">
            <div className="rounded-md border border-[#D4AF37]/30 bg-[#6D2B35] p-6 sm:p-7 hover-elevate">
              <div className="flex flex-col md:flex-row md:items-center gap-5">
                <div className="w-12 h-12 shrink-0 rounded-md bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center">
                  <Flame className="w-6 h-6 text-[#D4AF37]" strokeWidth={1.6} />
                </div>
                <div className="flex-1">
                  <span className="text-[10px] uppercase tracking-[0.25em] text-[#D4AF37] font-semibold">Pitru Seva — Sacred Ancestor Rites</span>
                  <h3 className="font-serif text-lg sm:text-xl text-white font-semibold mt-1 mb-1.5">
                    Pind Daan, Tarpan &amp; Shradh — at Kashi, Gaya, Haridwar
                  </h3>
                  <p className="text-sm text-white/75 leading-relaxed max-w-2xl">
                    Honour your ancestors at the holiest tirthas of Bharat — performed by verified Tirth Purohits with full shastric vidhi, bookable from anywhere in the world.
                  </p>
                </div>
                <span className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#D4AF37] shrink-0 self-start md:self-center">
                  Explore Services <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </div>
          </Link>
        </div>
      </div>

      <Dialog open={!!comingSoonCity} onOpenChange={(o) => !o && setComingSoonCity(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl text-[#6D2B35]">
              Pandits in {comingSoonCity} — Arriving Soon
            </DialogTitle>
            <DialogDescription className="pt-1 text-sm">
              We're onboarding verified pandits in {comingSoonCity} right now. In the meantime, you can book any puja online — our pandits perform the full ritual live, with photo-video proof and prasad couriered to your home anywhere in the world.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-[#FBF7EE] border border-[#D4AF37]/30 rounded-md p-4 mt-2 text-sm text-[#5a4a3a]/80 leading-relaxed">
            <p className="mb-3">
              <span className="font-semibold text-[#6D2B35]">Tip:</span> Online puja is identical in shastra to in-person puja — Sankalp is taken in your name and gotra, the merit accrues fully to you.
            </p>
            {notifySent ? (
              <div className="flex items-center gap-2 text-[#6D2B35] font-semibold text-sm" data-testid="text-notify-success">
                <Check className="w-4 h-4 text-emerald-700" /> You're on the list — we'll email you when {comingSoonCity} goes live.
              </div>
            ) : (
              <form onSubmit={handleNotify} className="flex flex-col sm:flex-row gap-2 items-stretch">
                <div className="relative flex-1">
                  <BellRing className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5a4a3a]/50" />
                  <Input
                    type="email"
                    inputMode="email"
                    placeholder="your@email.com"
                    value={notifyEmail}
                    onChange={(e) => setNotifyEmail(e.target.value)}
                    className="pl-9 bg-white border-[#D4AF37]/40 rounded-md h-10"
                    aria-label={`Notify me when ${comingSoonCity} goes live`}
                    data-testid="input-notify-email"
                  />
                </div>
                <Button type="submit" variant="outline" disabled={notifySubmitting} className="rounded-md h-10 border-[#6D2B35]/30 text-[#6D2B35] font-semibold text-[13px]" data-testid="btn-notify-me">
                  {notifySubmitting ? "Adding..." : "Notify Me"}
                </Button>
              </form>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-2 flex-col sm:flex-row">
            <Button variant="outline" onClick={() => { setComingSoonCity(null); navigate("/book-pandit-online/delhi-ncr"); }} className="rounded-md h-10 text-[13px]" data-testid="btn-try-delhi">
              Browse Delhi NCR Instead
            </Button>
            <Button onClick={() => { setComingSoonCity(null); navigate("/puja?mode=online"); }} className="bg-[#6D2B35] text-[#D4AF37] hover:bg-[#5a1f29] rounded-md h-10 text-[13px] font-semibold" data-testid="btn-book-online-from-city">
              <Globe className="w-4 h-4 mr-2" /> Book Online Puja
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BecomePanditBanner />
    </div>
  );
}

export default function PanditDirectory() {
  const searchString = useSearch();
  const [, navigate] = useLocation();
  const cityParam = new URLSearchParams(searchString).get("city") || "";
  const knownTile = CITY_TILES.find(c => c.slug === cityParam);

  // Legacy URL ?city=<slug> → canonical /book-pandit-online/<slug> (avoid
  // duplicate content with the per-city landing pages). Replace in history
  // so back button doesn't re-bounce.
  useEffect(() => {
    if (knownTile) navigate(`/book-pandit-online/${knownTile.slug}`, { replace: true });
  }, [knownTile, navigate]);

  if (knownTile) return null;
  return <CityChooser />;
}

// Listing view extracted to its own component (advanced features:
// smart filters, online status, compare, map, AI puja recommender,
// trust signals, sticky CTAs).
import { PanditDirectoryView } from "@/components/pandit/PanditDirectoryView";
import { BecomePanditBanner, BecomePanditStrip } from "@/components/pandit/BecomePanditBanner";

function PanditDirectoryForCity({ defaultCity, cityLabel }: { defaultCity: string; cityLabel: string }) {
  return <PanditDirectoryView defaultCity={defaultCity} cityLabel={cityLabel} />;
}

export { BecomePanditBanner, BecomePanditStrip };

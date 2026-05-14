import { useState, useMemo, useEffect, useCallback } from "react";
import { Link, useLocation, useSearch } from "wouter";
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

// Slim hero for both views — solid maroon, hairline gold accents (no gradients)
function SlimHero({ eyebrow, title, subtitle, children }: { eyebrow: string; title: string; subtitle?: string; children?: React.ReactNode }) {
  return (
    <div className="bg-[#6D2B35] border-b border-[#D4AF37]/30">
      <div className="container mx-auto px-4 py-7 sm:py-10 md:py-14 text-center max-w-3xl">
        <div className="flex items-center justify-center gap-2 mb-2.5">
          <span className="h-px w-6 sm:w-8 bg-[#D4AF37]/60" />
          <span className="inline-flex items-center gap-1.5 text-[9px] sm:text-[11px] uppercase tracking-[0.28em] sm:tracking-[0.3em] text-[#D4AF37] font-semibold">
            <Sparkles className="w-3 h-3" /> {eyebrow}
          </span>
          <span className="h-px w-6 sm:w-8 bg-[#D4AF37]/60" />
        </div>
        <h1 className="text-[19px] leading-[1.2] sm:text-2xl md:text-3xl lg:text-4xl font-serif text-white mb-2 sm:mb-3 font-semibold tracking-tight" data-testid="text-pandit-title">
          {title}
        </h1>
        {subtitle && <p className="text-white/70 text-[13px] sm:text-sm md:text-[15px] leading-snug sm:leading-relaxed max-w-xl mx-auto">{subtitle}</p>}
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

  const handleNotify = (e: React.FormEvent) => {
    e.preventDefault();
    const email = notifyEmail.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({ title: "Please enter a valid email", variant: "destructive" });
      return;
    }
    setNotifySent(true);
    toast({ title: `We'll notify you when ${comingSoonCity} goes live`, description: "Until then, you can book any puja online — performed live by verified pandits." });
  };

  return (
    <div className="w-full pb-20 bg-white">
      <PageSeo
        title="Book a Verified Vedic Pandit Online — Same-Day Puja Booking | Vedic Tatva"
        description="Book a verified Vedic pandit online for Satyanarayan Puja, Griha Pravesh, Wedding, Rudrabhishek, Mundan, Namkaran, Navagraha Shanti and 50+ ceremonies across Delhi NCR, Mumbai, Bengaluru, Pune, Chennai, Kolkata, Hyderabad and 75+ Indian cities. Same-day booking, transparent dakshina, multi-language pandits (Sanskrit, Hindi, Tamil, Telugu, Marathi, Bengali, Gujarati, Kannada). 100% identity-verified, scripture-trained Brahmin pandits."
        keywords="book pandit online, pandit near me, verified pandit booking, brahmin pandit, satyanarayan puja pandit, griha pravesh pandit, wedding pandit, rudrabhishek pandit, mundan pandit, namkaran pandit, navagraha shanti, same-day pandit, sanskrit pandit, hindi pandit, tamil pandit, marathi pandit, telugu pandit, bengali pandit, gujarati pandit, pandit in delhi, pandit in mumbai, pandit in bangalore, pandit in pune, pandit in chennai, pandit in hyderabad, pandit in kolkata"
        canonical="/pandits"
        ogType="website"
        twitterCard="summary_large_image"
        schemas={[
          breadcrumbListSchema([
            { name: "Home", url: abs("/") },
            { name: "Verified Pandits", url: abs("/pandits") },
          ]),
          faqPageSchema(PANDIT_FAQS.map(f => ({ question: f.q, answer: f.a })), "pandit-dir-faq"),
          serviceSchema({
            name: "Verified Vedic Pandit Booking",
            description: "Book identity-verified, scripture-trained Vedic pandits across 75+ Indian cities for Satyanarayan, Griha Pravesh, Wedding, Rudrabhishek and 50+ ceremonies. Same-day booking, transparent pricing, multi-language support.",
            url: abs("/pandits"),
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
                <Link key={tile.slug} href={`/pandits?city=${tile.slug}`} className="block h-full">
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
          <Link href="/pind-daan" className="block group" data-testid="link-pind-daan-cta">
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
                <Button type="submit" variant="outline" className="rounded-md h-10 border-[#6D2B35]/30 text-[#6D2B35] font-semibold text-[13px]" data-testid="btn-notify-me">
                  Notify Me
                </Button>
              </form>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-2 flex-col sm:flex-row">
            <Button variant="outline" onClick={() => { setComingSoonCity(null); navigate("/pandits?city=delhi-ncr"); }} className="rounded-md h-10 text-[13px]" data-testid="btn-try-delhi">
              Browse Delhi NCR Instead
            </Button>
            <Button onClick={() => { setComingSoonCity(null); navigate("/puja?mode=online"); }} className="bg-[#6D2B35] text-[#D4AF37] hover:bg-[#5a1f29] rounded-md h-10 text-[13px] font-semibold" data-testid="btn-book-online-from-city">
              <Globe className="w-4 h-4 mr-2" /> Book Online Puja
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function PanditDirectory() {
  const searchString = useSearch();
  const cityParam = new URLSearchParams(searchString).get("city") || "";
  const cityTile = CITY_TILES.find(c => c.slug === cityParam && c.live);

  if (!cityTile) return <CityChooser />;

  return <PanditDirectoryForCity defaultCity={cityTile.defaultCity} cityLabel={cityTile.name} />;
}

function PanditDirectoryForCity({ defaultCity, cityLabel }: { defaultCity: string; cityLabel: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [citySearch, setCitySearch] = useState(defaultCity);
  const [searchCity, setSearchCity] = useState(defaultCity);
  const [selectedRegion, setSelectedRegion] = useState("");
  const [sortBy, setSortBy] = useState<"best-match" | "rating" | "reviews" | "experience" | "fees" | "distance">("best-match");
  const [selectedPandit, setSelectedPandit] = useState<Pandit | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showBoostDialog, setShowBoostDialog] = useState(false);
  const [reviewForm, setReviewForm] = useState({ reviewerName: "", reviewerEmail: "", rating: 5, comment: "", serviceType: "" });
  const [boostPanditId, setBoostPanditId] = useState("");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<"idle" | "loading" | "granted" | "denied">("idle");
  const [showFilters, setShowFilters] = useState(false);

  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationStatus("denied");
      return;
    }
    setLocationStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationStatus("granted");
      },
      () => {
        setLocationStatus("denied");
      },
      { timeout: 10000, maximumAge: 300000 }
    );
  }, []);

  useEffect(() => {
    detectLocation();
  }, [detectLocation]);

  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    if (searchCity) params.set("city", searchCity);
    if (selectedRegion) params.set("region", selectedRegion);
    if (userLocation) {
      params.set("lat", userLocation.lat.toString());
      params.set("lng", userLocation.lng.toString());
    }
    return params.toString();
  }, [searchCity, selectedRegion, userLocation]);

  const { data: pandits, isLoading } = useQuery<PanditWithDistance[]>({
    queryKey: ["/api/pandits", queryParams],
    queryFn: () => fetch(`/api/pandits${queryParams ? `?${queryParams}` : ""}`).then(r => r.json()),
  });

  const { data: panditReviews } = useQuery<PanditReview[]>({
    queryKey: ["/api/pandit-reviews", selectedPandit?.id],
    queryFn: () => fetch(`/api/pandit-reviews/${selectedPandit!.id}`).then(r => r.json()),
    enabled: !!selectedPandit,
  });

  const submitReviewMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/pandit-reviews", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Review Submitted", description: "Thank you for your feedback!" });
      setShowReviewForm(false);
      setReviewForm({ reviewerName: "", reviewerEmail: "", rating: 5, comment: "", serviceType: "" });
      queryClient.invalidateQueries({ queryKey: ["/api/pandit-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pandits"] });
    },
    onError: () => toast({ title: "Error", description: "Could not submit review.", variant: "destructive" }),
  });

  const boostMutation = useMutation({
    mutationFn: async ({ panditId, boostType }: { panditId: number; boostType: "monthly" | "yearly" }) => {
      const res = await fetch(`/api/pandits/${panditId}/boost`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ boostType }) });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Boost Activated!", description: "Your profile is now boosted and will appear at the top of search results." });
      setShowBoostDialog(false);
      queryClient.invalidateQueries({ queryKey: ["/api/pandits"] });
    },
    onError: () => toast({ title: "Error", description: "Could not activate boost.", variant: "destructive" }),
  });

  const sortedPandits = useMemo(() => {
    if (!pandits) return [];
    const now = new Date();
    return [...pandits].sort((a, b) => {
      const aBoost = a.boostActive && a.boostEndDate && new Date(a.boostEndDate) > now ? 1 : 0;
      const bBoost = b.boostActive && b.boostEndDate && new Date(b.boostEndDate) > now ? 1 : 0;
      if (bBoost !== aBoost) return bBoost - aBoost;

      // Tier rank: Guru Elite > Gold > Silver > Free. Layered after boost so
      // an explicitly-boosted free pandit can still surface above paid tiers.
      const TIER_RANK: Record<string, number> = { guru_elite: 4, platinum: 4, gold: 3, silver: 2, free: 1 };
      const aTier = TIER_RANK[(a.tier || "free").toLowerCase()] || 1;
      const bTier = TIER_RANK[(b.tier || "free").toLowerCase()] || 1;
      if (bTier !== aTier) return bTier - aTier;

      switch (sortBy) {
        case "best-match": {
          const aScore = ((a.rating ?? 0) / 5) * 40
            + (a.distance !== null ? Math.max(0, (1 - a.distance / 100)) * 35 : 0)
            + (a.availability === "available" ? 15 : a.availability === "busy" ? 5 : 0)
            + Math.min(10, (a.reviewCount ?? 0) / 10 * 10);
          const bScore = ((b.rating ?? 0) / 5) * 40
            + (b.distance !== null ? Math.max(0, (1 - b.distance / 100)) * 35 : 0)
            + (b.availability === "available" ? 15 : b.availability === "busy" ? 5 : 0)
            + Math.min(10, (b.reviewCount ?? 0) / 10 * 10);
          return bScore - aScore;
        }
        case "rating": return (b.rating ?? 0) - (a.rating ?? 0);
        case "reviews": return (b.reviewCount ?? 0) - (a.reviewCount ?? 0);
        case "experience": return (b.experience ?? 0) - (a.experience ?? 0);
        case "fees": return (a.fees ?? 0) - (b.fees ?? 0);
        case "distance": {
          if (a.distance === null && b.distance === null) return 0;
          if (a.distance === null) return 1;
          if (b.distance === null) return -1;
          return a.distance - b.distance;
        }
        default: return 0;
      }
    });
  }, [pandits, sortBy]);

  const isBoosted = (p: Pandit) => p.boostActive && p.boostEndDate && new Date(p.boostEndDate) > new Date();

  const handleSearch = () => setSearchCity(citySearch);

  const formatDistance = (d: number | null) => {
    if (d === null) return null;
    if (d < 1) return `${Math.round(d * 1000)}m away`;
    if (d < 10) return `${d.toFixed(1)} km away`;
    return `${Math.round(d)} km away`;
  };

  const activeFiltersCount = (selectedRegion ? 1 : 0) + (searchCity ? 1 : 0);
  const quickTags = ["Available", "Online now", "Top rated", "Lowest fee"];

  return (
    <div className="w-full pb-20 bg-white">
      <PageSeo
        title={`Verified Vedic Pandits in ${cityLabel} — Same-Day Puja Booking | Vedic Tatva`}
        description={`Book a verified Vedic pandit in ${cityLabel} for Satyanarayan Puja, Griha Pravesh, Wedding, Rudrabhishek, Mundan, Namkaran, Navagraha Shanti and 50+ ceremonies. Same-day booking, transparent pricing, multi-language pandits (Sanskrit, Hindi, Tamil, Telugu, Marathi, Bengali, Gujarati). Identity-verified, scripture-trained Brahmin pandits with reviews.`}
        keywords={`pandit in ${cityLabel.toLowerCase()}, ${cityLabel.toLowerCase()} pandit booking, verified pandit ${cityLabel.toLowerCase()}, same-day pandit, satyanarayan puja, griha pravesh, wedding pandit, rudrabhishek, brahmin pandit ${cityLabel.toLowerCase()}`}
        canonical={`/pandits?city=${(cityLabel || '').toLowerCase().replace(/\s+/g, '-')}`}
        ogType="website"
        twitterCard="summary_large_image"
        schemas={[
          breadcrumbListSchema([
            { name: "Home", url: abs("/") },
            { name: "Verified Pandits", url: abs("/pandits") },
            { name: cityLabel, url: abs(`/pandits?city=${(cityLabel || '').toLowerCase().replace(/\s+/g, '-')}`) },
          ]),
          faqPageSchema(PANDIT_FAQS.map(f => ({ question: f.q, answer: f.a })), `pandit-${(cityLabel || '').toLowerCase().replace(/\s+/g, '-')}-faq`),
          serviceSchema({
            name: `Verified Vedic Pandit Booking in ${cityLabel}`,
            description: `Identity-verified, scripture-trained Vedic pandits available in ${cityLabel} for Satyanarayan, Griha Pravesh, Wedding, Rudrabhishek and 50+ ceremonies. Same-day booking with transparent pricing.`,
            url: abs(`/pandits?city=${(cityLabel || '').toLowerCase().replace(/\s+/g, '-')}`),
            providerName: "Vedic Tatva",
            areaServed: [cityLabel, "IN"],
          }),
        ]}
      />
      <nav aria-label="Breadcrumb" className="bg-[#FBF7EE] border-b border-[#D4AF37]/15">
        <ol className="container mx-auto px-4 py-1.5 flex items-center gap-1 text-[11px] sm:text-[12px] text-[#5a4a3a]/75">
          <li><Link href="/" className="hover:text-[#6D2B35]" data-testid="link-breadcrumb-home">Home</Link></li>
          <li aria-hidden="true"><ChevronRight className="w-3 h-3 inline" /></li>
          <li><Link href="/pandits" className="hover:text-[#6D2B35]" data-testid="link-breadcrumb-pandits">Verified Pandits</Link></li>
          <li aria-hidden="true"><ChevronRight className="w-3 h-3 inline" /></li>
          <li aria-current="page" className="text-[#6D2B35] font-semibold truncate">{cityLabel}</li>
        </ol>
      </nav>
      {/* Slim hero with search */}
      <div className="bg-[#6D2B35] border-b border-[#D4AF37]/30">
        <div className="container mx-auto px-4 py-7 sm:py-10 md:py-14 text-center">
          <Link
            href="/pandits"
            className="inline-flex items-center gap-1.5 text-[9px] sm:text-[11px] uppercase tracking-[0.28em] sm:tracking-[0.3em] text-[#D4AF37] hover:text-white font-semibold mb-2.5"
            data-testid="link-back-cities"
          >
            <ChevronDown className="w-3 h-3 rotate-90" /> All Cities
          </Link>
          <h1 className="text-[20px] leading-[1.2] sm:text-2xl md:text-3xl lg:text-4xl font-serif text-white mb-2 sm:mb-3 font-semibold tracking-tight" data-testid="text-pandit-title">
            Verified Vedic Pandits in {cityLabel}
          </h1>
          <p className="text-white/70 max-w-xl mx-auto text-[13px] sm:text-sm md:text-[15px] mb-5 sm:mb-7 leading-snug sm:leading-relaxed">
            Same-day booking · transparent dakshina · authentic vidhi.
          </p>
          <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2 mb-5 sm:mb-6">
            {TRUST_SIGNALS.map((label) => (
              <span key={label} className="inline-flex items-center gap-1 sm:gap-1.5 rounded-md border border-white/15 bg-white/8 px-2 sm:px-3 h-7 sm:h-8 text-[10px] sm:text-[11px] font-semibold text-white/80">
                <ShieldCheck className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-[#D4AF37]" />
                {label}
              </span>
            ))}
          </div>

          {/* Slim search bar — rounded-md */}
          <div className="max-w-2xl mx-auto bg-white p-1 rounded-md border border-[#D4AF37]/30 flex gap-1.5">
            <div className="relative flex-grow flex items-center pl-3">
              <MapPin className="text-[#6D2B35] h-4 w-4 mr-2 shrink-0" />
              <Input
                placeholder="Enter your city (e.g. Delhi, Mumbai)"
                className="border-0 focus-visible:ring-0 shadow-none text-sm bg-transparent h-10"
                value={citySearch}
                onChange={(e) => setCitySearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                data-testid="input-city-search"
              />
            </div>
            <Button onClick={handleSearch} className="bg-[#6D2B35] text-[#D4AF37] hover:bg-[#5a1f29] rounded-md px-5 h-10 text-[13px] font-semibold shrink-0" data-testid="btn-search-pandit">
              <Search className="h-4 w-4 mr-1.5" /> Find Pandit
            </Button>
          </div>

          {locationStatus === "granted" && userLocation && (
            <div className="mt-3 inline-flex items-center gap-1.5 bg-white/10 text-white/80 text-xs px-3 h-7 rounded-md border border-white/15">
              <Navigation className="h-3 w-3" />
              <span data-testid="text-location-status">Showing results near you</span>
            </div>
          )}
          {locationStatus === "denied" && (
            <button
              onClick={detectLocation}
              className="mt-3 inline-flex items-center gap-1.5 bg-white/10 text-white/80 text-xs px-3 h-7 rounded-md border border-white/15 hover:bg-white/20 transition-colors"
              data-testid="btn-enable-location"
            >
              <Navigation className="h-3 w-3" />
              <span>Enable location for nearby pandits</span>
            </button>
          )}
          {locationStatus === "loading" && (
            <div className="mt-3 inline-flex items-center gap-1.5 bg-white/10 text-white/80 text-xs px-3 h-7 rounded-md border border-white/15">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Detecting location...</span>
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 mt-8">
        {/* Online Puja CTA — slim cream panel */}
        <div className="max-w-5xl mx-auto bg-[#FBF7EE] border border-[#D4AF37]/30 rounded-md p-5 mb-8">
          <div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
            <div className="w-11 h-11 shrink-0 rounded-md bg-[#6D2B35] flex items-center justify-center">
              <Video className="w-5 h-5 text-[#D4AF37]" strokeWidth={1.6} />
            </div>
            <div className="flex-1">
              <h3 className="font-serif text-base sm:text-lg text-[#6D2B35] font-semibold mb-0.5">
                Prefer an Online Puja?
              </h3>
              <p className="text-xs sm:text-sm text-[#5a4a3a]/75 leading-relaxed">
                Live Sankalp via video call, full vidhi by verified pandits at the temple, photo-video proof and prasad couriered to your home — anywhere in the world.
              </p>
            </div>
            <Link href="/puja?mode=online">
              <Button className="bg-[#6D2B35] text-[#D4AF37] hover:bg-[#5a1f29] rounded-md px-5 h-10 text-[13px] font-semibold shrink-0" data-testid="btn-online-puja-cta-grid">
                <Globe className="w-4 h-4 mr-2" /> Book Online Puja <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>

        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-3 mb-8">
          {BOOKING_GUIDE.map((step, index) => (
            <div key={step} className="rounded-md border border-[#D4AF37]/20 bg-white p-4">
              <div className="inline-flex items-center justify-center rounded-md bg-[#FBF7EE] border border-[#D4AF37]/20 text-[#6D2B35] font-semibold text-[10px] h-7 w-7 mb-2">
                {String(index + 1).padStart(2, "0")}
              </div>
              <p className="text-sm text-[#5a4a3a]/80 leading-relaxed">{step}</p>
            </div>
          ))}
        </div>

        <div className="max-w-5xl mx-auto mb-8">
          <div className="flex flex-wrap items-center gap-2 justify-center">
            {quickTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => {
                  if (tag === "Available") setSelectedRegion("");
                  if (tag === "Online now") setSortBy("best-match");
                  if (tag === "Top rated") setSortBy("rating");
                  if (tag === "Lowest fee") setSortBy("fees");
                }}
                className="inline-flex items-center gap-1.5 rounded-md border border-[#D4AF37]/25 bg-white px-3 h-8 text-[11px] font-semibold text-[#6D2B35] hover-elevate"
                data-testid={`button-quick-tag-${tag.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <Sparkles className="h-3.5 w-3.5 text-[#D4AF37]" />
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Filters & sort */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h2 className="font-serif text-xl text-[#6D2B35] font-semibold tracking-tight">
                {searchCity && selectedRegion
                  ? `${selectedRegion} Pandits in ${searchCity}`
                  : searchCity
                  ? `Pandits in ${searchCity}`
                  : selectedRegion
                  ? `${selectedRegion} Pandits`
                  : "Featured Pandits"}
              </h2>
              <p className="text-xs text-[#5a4a3a]/55">{sortedPandits.length} pandits available</p>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center gap-1.5 px-3 h-8 rounded-md text-xs font-semibold transition-colors sm:hidden border ${showFilters || activeFiltersCount > 0 ? "bg-[#6D2B35] text-[#D4AF37] border-[#6D2B35]" : "bg-white text-[#6D2B35] border-[#D4AF37]/30"}`}
              data-testid="btn-toggle-filters"
            >
              <Filter className="h-3 w-3" /> Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
            </button>
          </div>

          <div className="rounded-md border border-[#D4AF37]/20 bg-[#FBF7EE] p-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.25em] text-[#D4AF37] font-semibold mb-1">Helpful filters</p>
                <p className="text-sm text-[#5a4a3a]/75">Use the filters below to narrow by tradition, availability, and price before booking.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-white border border-[#D4AF37]/20 px-3 h-8 text-[11px] font-semibold text-[#6D2B35]">
                  <IndianRupee className="h-3.5 w-3.5 text-[#D4AF37]" /> Transparent pricing
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-md bg-white border border-[#D4AF37]/20 px-3 h-8 text-[11px] font-semibold text-[#6D2B35]">
                  <Clock className="h-3.5 w-3.5 text-[#D4AF37]" /> Fast confirmation
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-md bg-white border border-[#D4AF37]/20 px-3 h-8 text-[11px] font-semibold text-[#6D2B35]">
                  <MessageCircle className="h-3.5 w-3.5 text-[#D4AF37]" /> WhatsApp support
                </span>
              </div>
            </div>
          </div>

          <div className={`flex flex-col sm:flex-row gap-3 ${showFilters ? "block" : "hidden sm:flex"}`}>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-[#5a4a3a]/55 whitespace-nowrap">Regional Tradition:</span>
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="text-xs h-8 rounded-md border border-[#D4AF37]/30 px-3 bg-white text-[#5a4a3a] focus:border-[#6D2B35]/50 focus:outline-none"
                data-testid="select-regional-origin"
              >
                {REGIONAL_ORIGINS.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 flex-wrap sm:ml-auto">
              <ArrowUpDown className="h-3.5 w-3.5 text-[#5a4a3a]/40" />
              <span className="text-xs text-[#5a4a3a]/55">Sort:</span>
              {(["best-match", "rating", "reviews", "experience", "fees", ...(userLocation ? ["distance" as const] : [])] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setSortBy(s)}
                  className={`px-3 h-8 rounded-md text-xs font-semibold transition-colors border ${sortBy === s ? "bg-[#6D2B35] text-[#D4AF37] border-[#6D2B35]" : "bg-white text-[#6D2B35] border-[#D4AF37]/30 hover-elevate"}`}
                  data-testid={`sort-${s}`}
                >
                  {s === "best-match" ? "Best Match" : s === "rating" ? "Top Rated" : s === "reviews" ? "Most Reviews" : s === "experience" ? "Experience" : s === "fees" ? "Lowest Fee" : "Nearest"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Pandit cards grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {isLoading ? Array(4).fill(0).map((_, idx) => (
            <div key={idx} className="rounded-md border border-[#D4AF37]/25 bg-white overflow-hidden">
              <div className="sm:flex">
                <Skeleton className="w-full sm:w-1/3 aspect-square sm:aspect-auto h-48 rounded-none" />
                <div className="p-5 sm:w-2/3 space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-9 w-full" />
                </div>
              </div>
            </div>
          )) : sortedPandits.map((pandit) => {
            const boosted = isBoosted(pandit);
            const dist = formatDistance(pandit.distance);
            // Effective tier (server already collapses platinum→guru_elite and
            // expired→free in the /api/pandits response).
            const tier = String((pandit as any).tier || "free").toLowerCase();
            const isGuruElite = tier === "guru_elite" || tier === "platinum";
            const isGold = tier === "gold";
            const cardBorder = isGuruElite
              ? "border-[#6D2B35]"
              : isGold
              ? "border-[#D4AF37]"
              : boosted
              ? "border-[#D4AF37]"
              : "border-[#D4AF37]/25 hover:border-[#D4AF37]/55";
            return (
              <div
                key={pandit.id}
                className={`overflow-hidden bg-white rounded-md border transition-colors relative ${cardBorder}`}
                data-testid={`pandit-card-${pandit.id}`}
              >
                {(pandit as any).isOnline && (
                  <div
                    className="absolute top-3 right-3 z-10 inline-flex items-center gap-1.5 bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wide px-2 h-6 rounded-full shadow-sm"
                    data-testid={`badge-online-${pandit.id}`}
                  >
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-white opacity-75 animate-ping" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
                    </span>
                    Online now
                  </div>
                )}
                {isGuruElite ? (
                  <div className="bg-[#6D2B35] px-4 py-1.5 flex items-center gap-2 border-b border-[#4a1a22]">
                    <Crown className="h-3.5 w-3.5 text-[#D4AF37]" />
                    <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-[0.2em]">Guru Elite Pandit</span>
                    <Sparkles className="h-3 w-3 text-[#D4AF37]/80 ml-auto" />
                  </div>
                ) : isGold ? (
                  <div className="bg-[#D4AF37] px-4 py-1.5 flex items-center gap-2 border-b border-[#C19F2E]">
                    <Crown className="h-3.5 w-3.5 text-[#6D2B35]" />
                    <span className="text-[10px] font-bold text-[#6D2B35] uppercase tracking-[0.2em]">Gold Pandit</span>
                    <Sparkles className="h-3 w-3 text-[#6D2B35]/70 ml-auto" />
                  </div>
                ) : boosted ? (
                  <div className="bg-[#D4AF37] px-4 py-1.5 flex items-center gap-2 border-b border-[#C19F2E]">
                    <Crown className="h-3.5 w-3.5 text-[#6D2B35]" />
                    <span className="text-[10px] font-bold text-[#6D2B35] uppercase tracking-[0.2em]">Premium Pandit</span>
                    <Sparkles className="h-3 w-3 text-[#6D2B35]/70 ml-auto" />
                  </div>
                ) : null}
                <div className="sm:flex">
                  <div className="w-full sm:w-1/3 bg-[#FBF7EE] aspect-square sm:aspect-auto relative overflow-hidden border-b sm:border-b-0 sm:border-r border-[#D4AF37]/20">
                    <img src={pandit.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(pandit.name)}&size=200&background=6D2B35&color=F5F0E6&font-size=0.4`} alt={pandit.name} className="w-full h-full object-cover" />

                    {pandit.availability && (
                      <div
                        className={`absolute bottom-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                          pandit.availability === "available"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : pandit.availability === "busy"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-rose-50 text-rose-700 border-rose-200"
                        }`}
                        data-testid={`text-availability-${pandit.id}`}
                      >
                        {pandit.availability === "available" ? "Available" : pandit.availability === "busy" ? "Busy" : "Unavailable"}
                      </div>
                    )}
                  </div>
                  <div className="p-4 sm:p-5 sm:w-2/3 flex flex-col">
                    <div className="flex justify-between items-start mb-1.5 gap-2">
                      <div>
                        <h3 className="font-serif text-base sm:text-lg font-semibold text-[#6D2B35] flex items-center gap-1.5">
                          {pandit.name}
                          {pandit.verified && (
                            <svg className="w-4 h-4 text-emerald-600 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                            </svg>
                          )}
                        </h3>
                        {boosted && <span className="text-[10px] text-[#D4AF37] font-semibold">Promoted</span>}
                      </div>
                      <div className="flex items-center bg-[#FBF7EE] border border-[#D4AF37]/30 text-[#6D2B35] px-2 py-1 rounded-md text-xs font-bold">
                        <Star className="w-3 h-3 text-[#D4AF37] mr-1 fill-[#D4AF37]" />
                        {(pandit.rating ?? 0).toFixed(1)}
                        <span className="text-[10px] text-[#5a4a3a]/45 ml-1">({pandit.reviewCount ?? 0})</span>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs text-[#5a4a3a]/70 mb-3 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <MapPin className="w-3.5 h-3.5 text-[#5a4a3a]/40" />
                        <span>{pandit.city}</span>
                        {dist && (
                          <span className="text-[10px] bg-[#FBF7EE] border border-[#D4AF37]/30 text-[#6D2B35] px-1.5 py-0.5 rounded-md font-semibold" data-testid={`text-distance-${pandit.id}`}>
                            <Navigation className="w-2.5 h-2.5 inline mr-0.5" />{dist}
                          </span>
                        )}
                        <span className="text-[#D4AF37]/50 mx-0.5">·</span>
                        <Clock className="w-3 h-3 text-[#5a4a3a]/40" /> {pandit.experience} yrs exp
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-[#5a4a3a]/40" />
                        {pandit.specialization}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Languages className="w-3.5 h-3.5 text-[#5a4a3a]/40" />
                        {pandit.languages}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#5a4a3a]/40" />
                        {pandit.verified ? "Verified profile" : "Pending verification"}
                      </div>
                      {pandit.regionalOrigin && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] bg-[#FBF7EE] border border-[#D4AF37]/30 text-[#6D2B35] px-2 py-0.5 rounded-md font-semibold" data-testid={`text-region-${pandit.id}`}>{pandit.regionalOrigin} tradition</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 items-center mt-auto pt-3 border-t border-[#D4AF37]/15 flex-wrap">
                      <div className="text-sm text-[#6D2B35] font-semibold mr-auto">
                        ₹{pandit.fees?.toLocaleString()} <span className="text-[10px] text-[#5a4a3a]/45 font-normal">dakshina</span>
                      </div>
                      <Link
                        href={`/pandit/${pandit.id}`}
                        className="text-[11px] text-[#6D2B35] hover:text-[#D4AF37] flex items-center gap-1 font-medium transition-colors"
                        data-testid={`btn-view-full-profile-${pandit.id}`}
                      >
                        <ExternalLink className="h-3 w-3" /> Profile
                      </Link>
                      <button
                        onClick={() => { setSelectedPandit(pandit); setShowReviewForm(false); }}
                        className="text-[11px] text-[#5a4a3a]/65 hover:text-[#6D2B35] flex items-center gap-1 font-medium transition-colors"
                        data-testid={`btn-view-profile-${pandit.id}`}
                      >
                        <MessageSquare className="h-3 w-3" /> Reviews
                      </button>
                      <Link href={`/puja?pandit=${pandit.id}`}>
                        <Button
                          className="rounded-md bg-[#6D2B35] text-[#D4AF37] hover:bg-[#5a1f29] text-[13px] font-semibold h-9 px-4"
                          data-testid={`btn-book-pandit-${pandit.id}`}
                        >
                          Book Now
                        </Button>
                      </Link>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {(pandit.isOnline ? ["Online now", "Video call"] : ["Home puja", "At venue"]).map((pill) => (
                        <span key={pill} className="rounded-md bg-[#FBF7EE] border border-[#D4AF37]/15 px-2.5 h-6 inline-flex items-center text-[10px] font-semibold text-[#5a4a3a]/75">
                          {pill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {!isLoading && sortedPandits.length === 0 && (
          <div className="text-center py-16 text-[#5a4a3a]/55 bg-[#FBF7EE] border border-[#D4AF37]/25 rounded-md mt-4">
            <p className="text-base">No pandits found{searchCity ? ` in "${searchCity}"` : ""}{selectedRegion ? ` with ${selectedRegion} tradition` : ""}.</p>
            <p className="text-sm mt-2">Try a different city or change the regional filter.</p>
            {(searchCity || selectedRegion) && (
              <Button
                variant="outline"
                className="mt-4 rounded-md h-10 text-[13px]"
                onClick={() => { setSearchCity(""); setCitySearch(""); setSelectedRegion(""); }}
                data-testid="btn-clear-filters"
              >
                Clear All Filters
              </Button>
            )}
          </div>
        )}

        <div className="mt-10 text-center">
          <p className="text-sm text-[#5a4a3a]/55 mb-3">Are you a Pandit? Get more bookings with premium visibility.</p>
          <button
            onClick={() => setShowBoostDialog(true)}
            className="px-5 h-10 bg-[#D4AF37] text-[#6D2B35] rounded-md text-[13px] font-semibold hover-elevate active-elevate-2 inline-flex items-center gap-2"
            data-testid="btn-boost-cta"
          >
            <Crown className="h-4 w-4" /> Boost Your Profile
          </button>
        </div>
      </div>

      {/* Profile Modal */}
      {selectedPandit && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setSelectedPandit(null)}>
          <div className="bg-white w-full sm:max-w-lg sm:rounded-md rounded-t-md max-h-[85vh] overflow-y-auto border border-[#D4AF37]/30" onClick={e => e.stopPropagation()}>
            <div className={`p-5 ${isBoosted(selectedPandit) ? "bg-[#FBF7EE] border-b border-[#D4AF37]/30" : "border-b border-[#D4AF37]/20"}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <img src={selectedPandit.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedPandit.name)}&size=64&background=6D2B35&color=F5F0E6`} alt="" className="w-14 h-14 rounded-md object-cover border border-[#D4AF37]/25" />
                  <div>
                    <h3 className="font-serif text-lg font-semibold text-[#6D2B35] flex items-center gap-2">
                      {selectedPandit.name}
                      {isBoosted(selectedPandit) && <Crown className="h-4 w-4 text-[#D4AF37]" />}
                    </h3>
                    <p className="text-xs text-[#5a4a3a]/55">{selectedPandit.city} · {selectedPandit.specialization}</p>
                    {selectedPandit.regionalOrigin && <p className="text-[10px] text-[#5a4a3a]/45">{selectedPandit.regionalOrigin} tradition</p>}
                    <div className="flex items-center gap-1 mt-0.5">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star key={s} className={`h-3 w-3 ${s <= Math.round(selectedPandit.rating ?? 0) ? "fill-[#D4AF37] text-[#D4AF37]" : "text-[#5a4a3a]/20"}`} />
                      ))}
                      <span className="text-xs text-[#5a4a3a]/65 ml-1">{(selectedPandit.rating ?? 0).toFixed(1)} ({selectedPandit.reviewCount ?? 0} reviews)</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => setSelectedPandit(null)} className="p-1 rounded-md hover:bg-[#FBF7EE]" data-testid="btn-close-profile">
                  <X className="h-4 w-4 text-[#5a4a3a]/45" />
                </button>
              </div>
            </div>

            <div className="p-5">
              {/* Stats — hairline grid */}
              <div className="grid grid-cols-3 gap-px bg-[#D4AF37]/20 rounded-md overflow-hidden border border-[#D4AF37]/25 mb-5">
                <div className="bg-[#FBF7EE] p-3 text-center">
                  <p className="text-lg font-bold text-[#6D2B35]">{selectedPandit.experience}</p>
                  <p className="text-[10px] text-[#5a4a3a]/55 uppercase tracking-wider">Years Exp</p>
                </div>
                <div className="bg-[#FBF7EE] p-3 text-center">
                  <p className="text-lg font-bold text-[#6D2B35]">{selectedPandit.reviewCount}</p>
                  <p className="text-[10px] text-[#5a4a3a]/55 uppercase tracking-wider">Reviews</p>
                </div>
                <div className="bg-[#FBF7EE] p-3 text-center">
                  <p className="text-lg font-bold text-[#6D2B35]">₹{selectedPandit.fees?.toLocaleString()}</p>
                  <p className="text-[10px] text-[#5a4a3a]/55 uppercase tracking-wider">Dakshina</p>
                </div>
              </div>

              <h4 className="font-serif text-sm font-semibold text-[#6D2B35] mb-3">Reviews</h4>
              {panditReviews && panditReviews.length > 0 ? (
                <div className="space-y-2.5 mb-4 max-h-60 overflow-y-auto pr-1">
                  {panditReviews.map(r => (
                    <div key={r.id} className="bg-[#FBF7EE] border border-[#D4AF37]/20 rounded-md p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-[#6D2B35]">{r.reviewerName}</span>
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map(s => (
                            <Star key={s} className={`h-2.5 w-2.5 ${s <= r.rating ? "fill-[#D4AF37] text-[#D4AF37]" : "text-[#5a4a3a]/20"}`} />
                          ))}
                        </div>
                      </div>
                      {r.comment && <p className="text-xs text-[#5a4a3a]/75 leading-relaxed">{r.comment}</p>}
                      {r.serviceType && <p className="text-[10px] text-[#5a4a3a]/45 mt-1">Service: {r.serviceType}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#5a4a3a]/45 mb-4">No reviews yet. Be the first to review!</p>
              )}

              {!showReviewForm ? (
                <button
                  onClick={() => setShowReviewForm(true)}
                  className="w-full py-2.5 border border-[#D4AF37]/40 rounded-md text-sm text-[#6D2B35] font-semibold hover:bg-[#FBF7EE] transition-colors flex items-center justify-center gap-2"
                  data-testid="btn-write-review"
                >
                  <MessageSquare className="h-3.5 w-3.5" /> Write a Review
                </button>
              ) : (
                <div className="bg-[#FBF7EE] border border-[#D4AF37]/30 rounded-md p-4 space-y-3">
                  <h5 className="text-xs font-bold text-[#6D2B35] uppercase tracking-wider">Write Your Review</h5>
                  <Input placeholder="Your name" value={reviewForm.reviewerName} onChange={e => setReviewForm(p => ({ ...p, reviewerName: e.target.value }))} className="text-sm h-9 rounded-md" data-testid="input-reviewer-name" />
                  <Input placeholder="Your email (optional)" value={reviewForm.reviewerEmail} onChange={e => setReviewForm(p => ({ ...p, reviewerEmail: e.target.value }))} className="text-sm h-9 rounded-md" data-testid="input-reviewer-email" />
                  <div>
                    <p className="text-[11px] text-[#5a4a3a]/55 mb-1.5">Rating</p>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(s => (
                        <button key={s} onClick={() => setReviewForm(p => ({ ...p, rating: s }))} data-testid={`star-${s}`}>
                          <Star className={`h-6 w-6 ${s <= reviewForm.rating ? "fill-[#D4AF37] text-[#D4AF37]" : "text-[#5a4a3a]/20"}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <select
                    value={reviewForm.serviceType}
                    onChange={e => setReviewForm(p => ({ ...p, serviceType: e.target.value }))}
                    className="w-full text-sm h-9 rounded-md border border-[#D4AF37]/30 px-3 bg-white"
                    data-testid="select-service-type"
                  >
                    <option value="">Select service type</option>
                    <option value="Puja">Puja</option>
                    <option value="Wedding">Wedding Ceremony</option>
                    <option value="Griha Pravesh">Griha Pravesh</option>
                    <option value="Satyanarayan Katha">Satyanarayan Katha</option>
                    <option value="Mundan">Mundan</option>
                    <option value="Last Rites">Last Rites</option>
                    <option value="Other">Other</option>
                  </select>
                  <textarea
                    placeholder="Share your experience..."
                    value={reviewForm.comment}
                    onChange={e => setReviewForm(p => ({ ...p, comment: e.target.value }))}
                    className="w-full text-sm rounded-md border border-[#D4AF37]/30 px-3 py-2 bg-white resize-none h-20"
                    data-testid="input-review-comment"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => setShowReviewForm(false)} className="flex-1 py-2 text-xs text-[#5a4a3a]/55 hover:text-[#6D2B35]">Cancel</button>
                    <Button
                      onClick={() => {
                        if (!reviewForm.reviewerName.trim()) return toast({ title: "Name required", variant: "destructive" });
                        submitReviewMutation.mutate({
                          panditId: selectedPandit.id,
                          reviewerName: reviewForm.reviewerName,
                          reviewerEmail: reviewForm.reviewerEmail || null,
                          rating: reviewForm.rating,
                          comment: reviewForm.comment || null,
                          serviceType: reviewForm.serviceType || null,
                        });
                      }}
                      disabled={submitReviewMutation.isPending}
                      className="flex-1 bg-[#6D2B35] hover:bg-[#5a1f29] text-[#D4AF37] rounded-md text-[13px] font-semibold h-9"
                      data-testid="btn-submit-review"
                    >
                      {submitReviewMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Send className="h-3 w-3 mr-1" /> Submit</>}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Boost Dialog */}
      {showBoostDialog && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setShowBoostDialog(false)}>
          <div className="bg-white w-full sm:max-w-md sm:rounded-md rounded-t-md overflow-hidden border border-[#D4AF37]/30" onClick={e => e.stopPropagation()}>
            <div className="bg-[#D4AF37] p-5 text-center border-b border-[#C19F2E]">
              <Crown className="h-8 w-8 text-[#6D2B35] mx-auto mb-2" />
              <h3 className="font-serif text-xl font-semibold text-[#6D2B35]">Boost Your Profile</h3>
              <p className="text-[#6D2B35]/80 text-xs mt-1">Appear at the top of search results with a premium badge</p>
            </div>

            <div className="p-5">
              <div className="space-y-4 mb-5">
                <div className="bg-[#FBF7EE] border border-[#D4AF37]/25 rounded-md p-4">
                  <h4 className="text-xs font-bold text-[#6D2B35] uppercase tracking-wider mb-2">Premium Benefits</h4>
                  <ul className="space-y-1.5 text-xs text-[#5a4a3a]/75">
                    <li className="flex items-center gap-2"><Crown className="h-3 w-3 text-[#D4AF37]" /> Gold "Premium Pandit" badge on your profile</li>
                    <li className="flex items-center gap-2"><ArrowUpDown className="h-3 w-3 text-[#D4AF37]" /> Always shown at top of search results in your city</li>
                    <li className="flex items-center gap-2"><Sparkles className="h-3 w-3 text-[#D4AF37]" /> Highlighted card with premium border</li>
                    <li className="flex items-center gap-2"><Star className="h-3 w-3 text-[#D4AF37]" /> "Promoted" tag for more visibility</li>
                  </ul>
                </div>

                <div>
                  <p className="text-xs text-[#5a4a3a]/65 mb-2">Enter your Pandit ID to boost:</p>
                  <Input
                    type="number"
                    placeholder="Your Pandit ID"
                    value={boostPanditId}
                    onChange={e => setBoostPanditId(e.target.value)}
                    className="text-sm h-9 rounded-md mb-3"
                    data-testid="input-boost-pandit-id"
                  />
                </div>

                {BOOST_PLANS.map(plan => (
                  <button
                    key={plan.type}
                    onClick={() => {
                      const panditId = parseInt(boostPanditId);
                      if (!panditId || isNaN(panditId)) return toast({ title: "Enter your Pandit ID", variant: "destructive" });
                      boostMutation.mutate({ panditId, boostType: plan.type });
                    }}
                    disabled={boostMutation.isPending}
                    className="w-full p-4 rounded-md border border-[#D4AF37]/30 hover:border-[#D4AF37] transition-colors text-left flex items-center justify-between hover-elevate"
                    data-testid={`boost-plan-${plan.type}`}
                  >
                    <div>
                      <h4 className="text-sm font-bold text-[#6D2B35]">{plan.label}</h4>
                      <p className="text-[11px] text-[#5a4a3a]/55">{plan.duration}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-[#6D2B35]">₹{plan.price.toLocaleString()}</p>
                      {plan.savings && <span className="text-[10px] bg-emerald-50 border border-emerald-200 text-emerald-700 px-1.5 py-0.5 rounded-md font-semibold">{plan.savings}</span>}
                    </div>
                  </button>
                ))}
              </div>

              <button onClick={() => setShowBoostDialog(false)} className="w-full py-2 text-xs text-[#5a4a3a]/45 hover:text-[#6D2B35]">Maybe later</button>
            </div>
          </div>
        </div>
      )}

      <PageAPlusContent
        eyebrow="Why Book a Pandit on Vedic Tatva"
        title="Verified Pandits for Every Sacred Ceremony — Across India"
        intro="Whether it's a Satyanarayan Puja at home, a Griha Pravesh for your new house, a wedding ceremony, or daily havan — our verified pandits bring scripture-trained authenticity to every ritual. Book online in 60 seconds with transparent pricing and same-day availability."
        trustBadges={[
          { value: "5,000+", label: "Verified Pandits" },
          { value: "4.8★", label: "Avg Rating" },
          { value: "75+", label: "Cities Covered" },
          { value: "1L+", label: "Pujas Completed" },
        ]}
        benefits={[
          { icon: ShieldCheck, title: "100% Identity-Verified", body: "Every pandit is identity-verified, scripture-trained, and reviewed by past clients before joining our network." },
          { icon: Clock, title: "Same-Day Booking", body: "Need a pandit today? Many pandits accept same-day bookings — filter by 'Available Today' to see them instantly." },
          { icon: Languages, title: "Your Language, Your Tradition", body: "Filter by Sanskrit, Hindi, Marathi, Tamil, Telugu, Bengali, Gujarati & more — find a pandit who speaks your tradition." },
          { icon: Award, title: "Specialised Expertise", body: "From Satyanarayan Puja to Rudrabhishek, Wedding to Mundan — pick a pandit who specialises in your ceremony." },
          { icon: Sparkles, title: "Transparent Pricing", body: "Upfront fees, no hidden costs. The price you see is what you pay — including dakshina guidance." },
          { icon: HeartIcon, title: "Post-Puja Support", body: "Get post-puja vidhi guidance, prasad distribution tips, and follow-up rituals — long after the ceremony ends." },
        ]}
        steps={[
          { title: "Choose Your Ceremony", body: "Select from 50+ pujas — Satyanarayan, Griha Pravesh, Rudrabhishek, Mundan, Wedding & more." },
          { title: "Pick Your Pandit", body: "Browse verified pandits by city, language, experience and rating. Compare profiles side by side." },
          { title: "Confirm Date & Muhurat", body: "Pick from suggested shubh muhurat dates — or share your own preferred slot." },
          { title: "Sit Back & Receive", body: "Pandit arrives with samagri checklist. Pay securely, receive prasad blessings, leave a review." },
        ]}
        faqs={PANDIT_FAQS}
        keywordsBlurb="Book pandit online for Satyanarayan Puja, Griha Pravesh puja, wedding ceremony, mundan sanskar, Rudrabhishek, Navagraha Shanti, Vastu Shanti and more across Delhi, Mumbai, Bengaluru, Hyderabad, Chennai, Kolkata, Pune, Ahmedabad, Jaipur and 75+ cities. Verified Brahmin pandits, transparent pricing, same-day pandit booking available."
      />

      <div className="container mx-auto px-4 pb-12">
        <RelatedServicesSection context="pandit" currentPath="/pandits" />
      </div>
    </div>
  );
}

import { useState, useEffect, useMemo, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Star, Calendar, ShoppingBag, Sparkles, UserCheck, Heart, ScrollText, MapPin, HandHeart, Flame, CheckCircle, Shield, Globe, IndianRupee, Search, BookOpen, Video, TrendingUp, MapPinned, Brain, Hand, Baby, CalendarDays, Trophy, MessageCircle, Gamepad2, Scale, Leaf, RotateCcw, Compass, HeartHandshake, Gem, Sun, Moon, Droplets, ChevronDown, ChevronUp, Palette, Hash, Navigation, Lightbulb, CircleDot, ThumbsUp, ThumbsDown, Clock, X, Shirt, Map, Calculator, Music2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { RecommendedForYou } from "@/components/RecommendedForYou";
import { motion, AnimatePresence } from "framer-motion";
import type { Product } from "@shared/schema";
import { useCart } from "@/lib/cart";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { getProductUrl } from "@/lib/utils";
import { getDisplayRating } from "@/lib/displayRating";
import { optImg, optImgSrcSet } from "@/lib/optImg";
import PageSeo from "@/components/PageSeo";
import { itemList as itemListSchemaBuilder, faqPage } from "@/lib/seo-schemas";
// Hero scenes live under /attached_assets so /api/img can serve responsive variants.
const heroBrandImg = "/attached_assets/heroes/hero-scene-brand.png";
const heroTirthYatraImg = "/attached_assets/heroes/hero-scene-tirth-yatra.png";
const heroCharDhamImg = "/attached_assets/heroes/hero-scene-char-dham.png";
const heroPindDaanImg = "/attached_assets/heroes/hero-scene-pind-daan.png";
const heroEssentialsImg = "/attached_assets/heroes/hero-scene-essentials.png";
const heroAstrologyImg = "/attached_assets/heroes/hero-scene-astrology.png";
import bhandaraSevaImg from "@assets/generated_images/bhandara_seva_hero.png";
import astrologyBannerImg from "@assets/generated_images/astrology_hero_banner.png";

type HeroCta = { label: string; href: string; icon: any };
type HeroSlide = {
  src: string;
  alt: string;
  mobilePosition: string;
  tagline: string;
  title1: string;
  title2: string;
  title2Highlight: string;
  subtitle: string;
  cta1: HeroCta;
  cta2: HeroCta;
};

// 5 hero sliders — one per business vertical, ordered Samagri-first per the
// SEO commercial-intent priority (puja samagri → puja booking → pandit →
// astrology → festivals/yatra). Slide 1 is the LCP image (eager+high
// fetchPriority in HeroBackground), so the most-clicked vertical loads first.
// Each title is an H2 supporting the master sr-only H1 below.
const heroSlides: HeroSlide[] = [
  {
    src: heroEssentialsImg,
    alt: "Authentic puja samagri spread — brass idol, rudraksha, diyas and kalash",
    mobilePosition: "center center",
    tagline: "SHOP PUJA SAMAGRI",
    title1: "Shop Puja Samagri",
    title2: "& Puja Essentials ",
    title2Highlight: "Online",
    subtitle: "Buy puja kits, havan samagri, diyas, brass idols, incense sticks, kalash, and temple essentials for every Hindu ritual.",
    cta1: { label: "Shop Puja Samagri", href: "/spiritual-essentials", icon: ShoppingBag },
    cta2: { label: "Browse Categories", href: "/shop", icon: Gem },
  },
  {
    src: heroBrandImg,
    alt: "Vedic Pandit performing online puja with samagri and diya",
    mobilePosition: "75% center",
    tagline: "ONLINE PUJA BOOKING",
    title1: "Book Online Puja",
    title2: "Services Across ",
    title2Highlight: "India",
    subtitle: "Book Satyanarayan Puja, Rudrabhishek, Navratri Puja, Griha Pravesh, and festival pujas with verified pandits.",
    cta1: { label: "Book Puja", href: "/puja", icon: ShoppingBag },
    cta2: { label: "Explore Rituals", href: "/online-puja-booking", icon: Sparkles },
  },
  {
    src: heroPindDaanImg,
    alt: "Verified Acharya performing havan and Vedic ritual",
    mobilePosition: "center center",
    tagline: "BOOK PANDITJI ONLINE",
    title1: "Book Trusted Panditji",
    title2: "for Every ",
    title2Highlight: "Occasion",
    subtitle: "Hire experienced panditji for weddings, havan, vastu puja, griha pravesh, dosh nivaran, and temple rituals.",
    cta1: { label: "Book a Pandit", href: "/pandits", icon: UserCheck },
    cta2: { label: "Pind Daan", href: "/pind-daan", icon: HandHeart },
  },
  {
    src: heroAstrologyImg,
    alt: "Vedic astrology rashi chakra and cosmic elements",
    mobilePosition: "center center",
    tagline: "ASTROLOGY & KUNDLI",
    title1: "Online Astrology",
    title2: "Consultation & ",
    title2Highlight: "Kundli",
    subtitle: "Get Vedic astrology guidance, kundli matching, horoscope reading, dosh analysis, and personalised remedies.",
    cta1: { label: "Consult Astrologer", href: "/astrology", icon: Sparkles },
    cta2: { label: "Free Kundli", href: "/ai-kundli", icon: Star },
  },
  {
    src: heroTirthYatraImg,
    alt: "Tirth Yatra and pilgrimage at sacred Bharat dhams",
    mobilePosition: "center center",
    tagline: "FESTIVALS & TIRTH YATRA",
    title1: "Festival Pujas, Muhurat",
    title2: "& Spiritual ",
    title2Highlight: "Yatras",
    subtitle: "Explore upcoming Hindu festivals, auspicious timings, temple pilgrimages, and spiritual experiences.",
    cta1: { label: "Explore Yatras", href: "/tirth-yatra", icon: Map },
    cta2: { label: "Char Dham", href: "/tirth-yatra/char-dham-yatra", icon: MapPinned },
  },
];

// ---------------------------------------------------------------------------
// Compact Pitru Tithi & Annual Shradh Calculator — embedded on the home page.
// Captures date + city + tradition and routes to the full /tools/tithi-calculator
// with prefilled query params so the user lands on the result instantly.
// ---------------------------------------------------------------------------

function HeroBackground({
  current,
  setCurrent,
  isPaused,
  onTogglePause,
}: {
  current: number;
  setCurrent: (i: number) => void;
  isPaused: boolean;
  onTogglePause: () => void;
}) {
  return (
    <>
      <div className="absolute inset-0" style={{ aspectRatio: "16 / 9" }}>
        {heroSlides.map((slide, i) => (
          <img
            key={slide.alt}
            src={optImg(slide.src, 1080)}
            srcSet={optImgSrcSet(slide.src, [320, 480, 768, 1080, 1440])}
            sizes="100vw"
            alt={slide.alt}
            width={1440}
            height={810}
            loading={i === 0 ? "eager" : "lazy"}
            decoding={i === 0 ? "sync" : "async"}
            fetchPriority={i === 0 ? "high" : "low"}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${
              i === current ? "opacity-100" : "opacity-0"
            }`}
            style={{ objectPosition: slide.mobilePosition }}
          />
        ))}
      </div>

      {/* Slide indicator dots — wrapped in 32px tap-target buttons so
          mobile fingers can hit them. The visible dot stays small for
          aesthetic; the hit area is generous and invisible. */}
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 z-20 flex items-center gap-0.5">
        {heroSlides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            aria-label={`Go to slide ${i + 1}`}
            className="w-8 h-8 flex items-center justify-center group"
            data-testid={`hero-dot-${i}`}
          >
            <span
              className={`block transition-all duration-300 rounded-full ${
                i === current
                  ? "w-6 h-1.5 bg-[#D4AF37]"
                  : "w-1.5 h-1.5 bg-white/40 group-hover:bg-white/70"
              }`}
            />
          </button>
        ))}
        {/* Play / pause toggle — WCAG 2.2.2 compliance for moving content. */}
        <button
          onClick={onTogglePause}
          aria-label={isPaused ? "Resume hero slideshow" : "Pause hero slideshow"}
          aria-pressed={isPaused}
          className="ml-2 w-8 h-8 flex items-center justify-center rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          data-testid="btn-hero-autoplay-toggle"
        >
          {isPaused ? (
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
          ) : (
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current" aria-hidden="true"><path d="M6 5h4v14H6zM14 5h4v14h-4z" /></svg>
          )}
        </button>
      </div>
    </>
  );
}

function HeroStat({ icon: Icon, value, label }: { icon: any; value: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5 md:gap-2 min-w-0" data-testid={`hero-stat-${label.toLowerCase()}`}>
      <Icon className="h-3.5 w-3.5 md:h-4 md:w-4 text-[#D4AF37] flex-shrink-0" />
      <div className="min-w-0">
        <div className="text-xs md:text-sm font-bold text-white leading-tight truncate">{value}</div>
        <div className="text-[10px] uppercase tracking-wider text-white/70 md:text-white/55 leading-tight truncate">{label}</div>
      </div>
    </div>
  );
}

function DiyaGlow({ className }: { className?: string }) {
  return (
    <div className={`absolute pointer-events-none ${className}`}>
      <motion.div
        className="relative"
        animate={{ scale: [1, 1.05, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="w-3 h-3 bg-[#D4AF37] rounded-full" />
        <div className="absolute inset-0 w-3 h-3 bg-[#D4AF37] rounded-full blur-md" />
        <motion.div
          className="absolute -inset-2 bg-[#D4AF37]/20 rounded-full blur-xl"
          animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
        />
        <motion.div
          className="absolute -inset-4 bg-orange-400/10 rounded-full blur-2xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        />
      </motion.div>
    </div>
  );
}

const testimonialReviews = [
  { name: "Priya Sharma", city: "Delhi", category: "Product Review", rating: 5, text: "The Rudraksha Mala I ordered was absolutely genuine. Packaging was premium and delivery was on time. Will definitely order again!", avatar: "PS" },
  { name: "Rajesh Iyer", city: "Chennai", category: "Puja Booking", rating: 5, text: "Booked Satyanarayan Puja for our new home. The pandit was very knowledgeable and performed every ritual with utmost devotion. Highly recommend.", avatar: "RI" },
  { name: "Meera Patel", city: "Ahmedabad", category: "Astrology", rating: 5, text: "My Kundli consultation was incredibly accurate. The astrologer explained everything patiently and gave practical remedies. Very impressed!", avatar: "MP" },
  { name: "Ankit Gupta", city: "Lucknow", category: "Product Review", rating: 5, text: "Ordered the Havan Samagri and Camphor tablets — both were pure and aromatic. The quality is far better than what's available locally.", avatar: "AG" },
  { name: "Sunita Reddy", city: "Hyderabad", category: "Puja Booking", rating: 4, text: "Griha Pravesh puja was conducted beautifully. The entire process from booking to completion was smooth and hassle-free.", avatar: "SR" },
  { name: "Vikram Singh", city: "Jaipur", category: "Astrology", rating: 5, text: "Got my matchmaking report done here. Very detailed analysis with clear explanations. The astrologer was patient and thorough.", avatar: "VS" },
  { name: "Deepa Nair", city: "Kochi", category: "Product Review", rating: 5, text: "Brass Puja Thali set exceeded my expectations. The craftsmanship is beautiful and the quality feels very premium. Great value for money.", avatar: "DN" },
  { name: "Sanjay Tiwari", city: "Varanasi", category: "Puja Booking", rating: 5, text: "Booked Rudrabhishek puja online — the pandit arrived on time and the whole experience was deeply spiritual. Very professional service.", avatar: "ST" },
  { name: "Kavita Joshi", city: "Pune", category: "Astrology", rating: 5, text: "The AI Kundli report was surprisingly detailed and accurate. It matched perfectly with what my family astrologer had told me years ago!", avatar: "KJ" },
];

function TestimonialsCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const totalCards = testimonialReviews.length;
  const visibleDesktop = 3;
  const maxIndex = totalCards - visibleDesktop;

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
    }, 7000);
    return () => clearInterval(timer);
  }, [isPaused, maxIndex]);

  return (
    <section className="py-12 md:py-16 bg-white border-t border-[#D4AF37]/15" data-testid="section-testimonials">
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center mb-10 md:mb-14">
          <div className="flex items-center justify-center gap-3 mb-3">
            <span className="h-px w-10 md:w-14 bg-[#D4AF37]" />
            <span className="text-[#6D2B35] text-[10px] md:text-xs uppercase tracking-[0.32em] font-semibold">Real Stories</span>
            <span className="h-px w-10 md:w-14 bg-[#D4AF37]" />
          </div>
          <h2 className="font-serif text-xl md:text-3xl lg:text-4xl text-[#6D2B35] leading-[1.1] tracking-tight mb-3" data-testid="text-testimonials-heading">
            What Our <span className="italic font-semibold saffron-shimmer">Community Says</span>
          </h2>
          <p className="text-[13px] md:text-sm text-[#5a4a3a]/70 max-w-md mx-auto">Trusted by thousands of families across India</p>
        </motion.div>

        <div
          className="relative overflow-hidden max-w-5xl mx-auto"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setTimeout(() => setIsPaused(false), 3000)}
        >
          <div
            className="flex transition-transform duration-700 ease-in-out"
            style={{ transform: `translateX(-${currentIndex * (100 / visibleDesktop)}%)` }}
          >
            {testimonialReviews.map((review, i) => (
              <div
                key={review.name}
                className="w-full md:w-1/3 flex-shrink-0 px-2 md:px-2.5"
                data-testid={`testimonial-${i}`}
              >
                <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-[#6D2B35]/5 h-full flex flex-col">
                  <div className="flex items-center gap-1 mb-3">
                    {[...Array(review.rating)].map((_, j) => (
                      <Star key={j} className="h-3.5 w-3.5 text-[#D4AF37] fill-[#D4AF37]" />
                    ))}
                    {review.rating < 5 && [...Array(5 - review.rating)].map((_, j) => (
                      <Star key={`e${j}`} className="h-3.5 w-3.5 text-[#D4AF37]/20" />
                    ))}
                  </div>
                  <p className="text-sm text-[#5a4a3a]/70 leading-relaxed mb-4 flex-1">{review.text}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#6D2B35]/10 flex items-center justify-center text-xs font-semibold text-[#6D2B35]">
                        {review.avatar}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#6D2B35]">{review.name}</p>
                        <p className="text-[11px] text-[#5a4a3a]/40">{review.city}</p>
                      </div>
                    </div>
                    <span className="text-[10px] uppercase tracking-wider text-[#D4AF37] font-medium bg-[#D4AF37]/5 px-2.5 py-1 rounded-full">{review.category}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center gap-1.5 mt-6">
          {Array.from({ length: maxIndex + 1 }).map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`transition-all duration-300 rounded-full ${
                i === currentIndex
                  ? "w-6 h-2 bg-[#D4AF37]"
                  : "w-2 h-2 bg-[#6D2B35]/15 hover:bg-[#6D2B35]/30"
              }`}
              data-testid={`testimonial-dot-${i}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const { addToCart } = useCart();
  const { toast } = useToast();
  const { t } = useI18n();
  const { data: ratingsAgg } = useQuery<Record<number, { avg: number; count: number }>>({
    queryKey: ["/api/reviews/aggregate"],
    staleTime: 60_000,
  });

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    queryFn: () => fetch("/api/products").then(r => r.json()),
  });

  const [neevModalOpen, setNeevModalOpen] = useState(false);

  // Four pillars of the platform — each links to a deep, SEO-rich landing
  // hub that absorbs all related sub-services. Pandit & Puja covers Book
  // Pandit, Book Puja, Pind Daan & Virtual Puja. Astrology covers Free
  // Kundli, Zodiac, Panchang & Muhurat. Puja Essentials covers samagri,
  // rudraksha, gemstones & yantras. Tirth Yatra covers all Hindu
  // pilgrimages (Char Dham, Jyotirlingas, Shakti Peeths, Vaishno Devi).
  const featuredCtas = [
    {
      label: "Book a Pandit & Puja",
      sub: "Verified pandits, puja at home, pind daan",
      icon: Flame,
      href: "/puja",
    },
    {
      label: "Vedic Astrology",
      sub: "Kundli, rashifal, muhurat, panchang",
      icon: Star,
      href: "/astrology",
    },
    {
      label: "Puja Samagri Shop",
      sub: "Rudraksha, gemstones, samagri, yantras",
      icon: Gem,
      href: "/spiritual-essentials",
    },
    {
      label: "Tirth Yatra Bookings",
      sub: "Char Dham, Jyotirlingas, Vaishno Devi",
      icon: Map,
      href: "/tirth-yatra",
    },
  ];

  const { data: bestsellers } = useQuery<Product[]>({ queryKey: ["/api/bestsellers"] });
  const featuredProducts = useMemo(() => {
    if (bestsellers && bestsellers.length > 0) return bestsellers;
    if (!products) return [];
    return [...products]
      .filter(p => p.stock > 0)
      .sort((a, b) => (b.salesCount ?? 0) - (a.salesCount ?? 0))
      .slice(0, 6);
  }, [bestsellers, products]);

  // FAQ JSON-LD — high-intent questions, drives Google's "People also ask" rich-results.
  const homeFaqSchema = useMemo(
    () =>
      faqPage(
        [
          {
            question: "How do I book a puja online with Vedic Tatva?",
            answer:
              "Choose your puja, pick a date and time, share your sankalp details, and pay securely. A verified Vedic Pandit performs the full ritual at the temple or your sankalp-sthan, you join the sankalp live on video call, and we courier the prasad and a photo-video record to your home. Same-day slots are available for most pujas.",
          },
          {
            question: "Are Vedic Tatva pandits verified?",
            answer:
              "Yes. Every pandit is identity-verified (Aadhaar/PAN), background-checked, and shastra-tested by our acharya panel before they appear on the platform. Reviews and ratings are visible on each profile, and you can pick the exact pandit who fits your tradition (Shukla Yajurveda, Krishna Yajurveda, Madhwa, Iyer/Iyengar, Gujarati, Marathi, Konkani and more).",
          },
          {
            question: "How much does an online puja cost?",
            answer:
              "Online puja prices start at ₹1,100 for a simple Satyanarayan or Lakshmi Puja and go up to ₹25,000+ for elaborate ceremonies like Rudrabhishek with 11 pandits, Maha Mrityunjaya Jaap or Chandi Path. The price always includes pandit dakshina, full samagri, and prasad courier — there are no hidden charges.",
          },
          {
            question: "Do you deliver puja samagri across India?",
            answer:
              "Yes. We ship authentic puja samagri, rudraksha, gemstones, idols, yantras and havan kits to every PIN code in India and to NRI addresses in USA, UK, Canada, UAE, Singapore and Australia. Free shipping on orders above ₹499 within India.",
          },
          {
            question: "Can I get a same-day pandit booking?",
            answer:
              "Yes. We hold a percentage of pandit slots open for same-day bookings in Delhi NCR, Mumbai, Bangalore, Hyderabad, Pune, Chennai, Kolkata, Ahmedabad, Jaipur and 40+ other cities. For festival days (Navratri, Diwali, Karwa Chauth, Janmashtami) we recommend booking 7–10 days in advance.",
          },
          {
            question: "Does Vedic Tatva offer astrology and Kundli services?",
            answer:
              "Yes. We offer free AI-generated Janma Kundli, Kundli matching, Vastu analysis, palm reading and one-on-one consultations with verified Vedic astrologers. Live consultations start at ₹399 and detailed written reports start at ₹999.",
          },
        ],
        "home-faq",
      ),
    [],
  );

  // ItemList JSON-LD for featured products (homepage SEO)
  const homeItemListSchema = useMemo(() => {
    if (!products || products.length === 0) return null;
    const source = (bestsellers && bestsellers.length > 0)
      ? bestsellers
      : [...products].filter(p => p.stock > 0).sort((a, b) => (b.salesCount ?? 0) - (a.salesCount ?? 0));
    const featured = source.slice(0, 12);
    if (featured.length === 0) return null;
    return itemListSchemaBuilder({
      name: "Popular Spiritual Products",
      items: featured.map((p) => ({ name: p.name, url: getProductUrl(p.id, p.name), image: p.image })),
    });
  }, [products, bestsellers]);

  // Combined JSON-LD payload for the home PageSeo: FAQ + ItemList (when ready).
  const homeSchemas = useMemo(
    () => [homeFaqSchema, homeItemListSchema].filter((s): s is NonNullable<typeof s> => s != null),
    [homeFaqSchema, homeItemListSchema],
  );

  // Hero scene rotation — each background pairs with its own headline +
  // CTAs. Pauseable via a play/pause toggle in the dot strip (WCAG 2.2.2).
  // Also pauses automatically when the user prefers reduced motion.
  const [heroIdx, setHeroIdx] = useState(0);
  const prefersReducedMotion = typeof window !== "undefined"
    && window.matchMedia
    && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const [heroPaused, setHeroPaused] = useState(prefersReducedMotion);
  useEffect(() => {
    if (heroPaused) return;
    const timer = setInterval(() => {
      setHeroIdx((prev) => (prev + 1) % heroSlides.length);
    }, 6500);
    return () => clearInterval(timer);
  }, [heroPaused]);
  const scene = heroSlides[heroIdx];
  const Cta1Icon = scene.cta1.icon;
  const Cta2Icon = scene.cta2.icon;

  return (
    <div className="w-full">
      <PageSeo
        title="Puja Samagri, Online Puja Booking & Panditji Services | Vedic Tatva"
        description="Buy authentic puja samagri online, book experienced panditji for Hindu rituals, online puja services, astrology consultation, and festival puja booking across India."
        keywords="puja samagri online, buy puja samagri, puja essentials, pooja samagri, online puja booking, puja booking, online puja services, book panditji online, pandit booking, pandit for puja, astrology services, online astrology consultation, kundli matching, vedic tatva"
        canonical="/"
        ogType="website"
        twitterCard="summary_large_image"
        schemas={homeSchemas}
      />
      {/* SEO H1 — keyword-loaded, screen-reader-only so hero brand visual stays clean */}
      <h1 className="sr-only">Puja Samagri, Online Puja Booking & Pandit Services</h1>
      {/* Hero Section */}
      <section className="relative w-full min-h-[100svh] md:min-h-[600px] lg:min-h-[640px] flex items-center overflow-hidden bg-[#1a0a0e]" data-testid="section-hero">
        {/* Full-bleed rotating background images */}
        <HeroBackground
          current={heroIdx}
          setCurrent={setHeroIdx}
          isPaused={heroPaused}
          onTogglePause={() => setHeroPaused((p) => !p)}
        />

        {/* Dark wash for legibility (matches Heros guideline regardless of theme) */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#1a0a0e]/85 via-[#1a0a0e]/55 to-[#1a0a0e]/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a0a0e]/80 via-transparent to-transparent" />

        {/* Single subtle gold glow accent (replaces 7 diyas, mandala ring & sanskrit overlay) */}
        <div className="absolute top-1/2 right-[-100px] -translate-y-1/2 w-[420px] h-[420px] rounded-full bg-[#D4AF37]/8 blur-3xl pointer-events-none hidden md:block" />

        {/* Centered vignette so centered text reads well over any photo on every viewport */}
        <div className="absolute inset-0 bg-[#1a0a0e]/45 md:bg-[#1a0a0e]/35 pointer-events-none" />

        <div className="relative z-10 container mx-auto px-4 pt-6 md:pt-8 pb-20 md:pb-24">
          <div className="max-w-2xl mx-auto text-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={heroIdx}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.5 }}
              >
                {/* Eyebrow */}
                <div className="flex items-center justify-center mb-3 md:mb-4">
                  <span className="text-[#D4AF37] text-[11px] sm:text-xs uppercase tracking-[0.3em] font-semibold" data-testid="text-hero-tagline">
                    {scene.tagline}
                  </span>
                </div>

                {/* Hero brand headline — demoted to h2 so the keyword-loaded sr-only h1 owns SEO */}
                <h2
                  className="font-serif text-white text-[2.35rem] sm:text-5xl md:text-[3.5rem] lg:text-[4.25rem] leading-[1.05] tracking-tight"
                  data-testid="text-hero-headline"
                >
                  <span className="block">{scene.title1}</span>
                  <span className="block">
                    {scene.title2}
                    <span className="text-[#D4AF37]">{scene.title2Highlight}</span>
                  </span>
                </h2>

                {/* Subtitle */}
                <p
                  className="mt-5 md:mt-6 text-[17px] sm:text-lg md:text-xl text-white/80 leading-relaxed max-w-xl mx-auto font-light"
                  data-testid="text-hero-subtext"
                >
                  {scene.subtitle}
                </p>

                {/* CTAs */}
                <div className="mt-7 md:mt-9 flex flex-row justify-center gap-2 sm:gap-3">
                  <Link href={scene.cta1.href} className="flex-1 sm:flex-none">
                    <Button
                      className="w-full sm:w-auto bg-[#D4AF37] hover:bg-[#c5a030] text-[#1a0a0e] rounded-md px-4 sm:px-6 font-semibold"
                      data-testid="btn-hero-cta1"
                    >
                      <Cta1Icon className="h-4 w-4 mr-2" />
                      {scene.cta1.label}
                    </Button>
                  </Link>
                  <Link href={scene.cta2.href} className="flex-1 sm:flex-none">
                    <Button
                      variant="outline"
                      className="w-full sm:w-auto bg-white/5 backdrop-blur-sm border-white/30 text-white hover:bg-white/10 rounded-md px-4 sm:px-6 font-semibold"
                      data-testid="btn-hero-cta2"
                    >
                      <Cta2Icon className="h-4 w-4 mr-2" />
                      {scene.cta2.label}
                    </Button>
                  </Link>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Trust strip */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="mt-8 md:mt-10 pt-4 md:pt-5 border-t border-white/15"
            >
              <div className="grid grid-cols-4 gap-x-2 md:gap-x-4 gap-y-2 max-w-2xl mx-auto justify-items-center">
                <HeroStat icon={Star} value={t.hero.rating} label="Rated" />
                <HeroStat icon={Heart} value="10K+" label="Families" />
                <HeroStat icon={UserCheck} value="500+" label="Pandits" />
                <HeroStat icon={Shield} value="100%" label="Authentic" />
              </div>
            </motion.div>
          </div>
        </div>

      </section>

      {/* Conversion tagline strip — sits flush under the hero so every
          visitor sees the trust + scope statement before scrolling. Lives
          here (not inside the rotating hero) so it never animates away
          and Google indexes one stable, keyword-rich line of body copy
          right after the H1/hero block. */}
      <section
        aria-label="Vedic Tatva conversion tagline"
        className="relative bg-gradient-to-r from-[#5A1F22] via-[#3A0F12] to-[#5A1F22] border-y border-[#D4AF37]/30"
        data-testid="section-conversion-tagline"
      >
        <div className="container mx-auto px-4 py-3 md:py-4 text-center">
          <p
            className="text-[#f5d76e] font-serif text-[15px] sm:text-base md:text-lg leading-snug tracking-wide"
            data-testid="text-conversion-tagline"
          >
            India's Trusted Platform for{" "}
            <span className="text-white font-semibold">Puja Samagri</span>,{" "}
            <span className="text-white font-semibold">Online Puja Booking</span> &{" "}
            <span className="text-white font-semibold">Panditji Services</span>
          </p>
        </div>
      </section>

      {/* Four Pillars block REMOVED (Wave: homepage clutter audit).
          The hero slideshow above already routes users to all four
          verticals (Samagri / Puja / Pandit / Astrology / Yatra), and
          the SEO articles section near the bottom links into the same
          hubs for crawlers. Removing the duplicate tile grid lets the
          SpiritualSnapshot follow directly under the hero, cutting
          ~110 px of redundant scrolling and one cognitive layer. */}

      {/* Today's Spiritual Snapshot — slim daily strip, sits directly
          under the hero now that the redundant Four Pillars block is
          gone. Bridges hero → tabbed shop with daily panchang utility. */}
      <SpiritualSnapshot />

      {/* Tabbed Shop — Popular + Trending Near You + New Arrivals (Handpicked) */}
      {/* Book a Pandit — moved here from below the trust block in this
          audit pass. Highest-margin booking surface, sits right under
          Spiritual Snapshot so the city-search converter is the first
          revenue block users see after the four pillars. */}
      <section className="py-10 md:py-14 bg-[#FBF7EE]" data-testid="section-book-pandit">
        <div className="container mx-auto px-4">
          {/* Image column removed (per user request — homepage clutter
              pass). Layout collapsed to a single centered column. The
              three trust badges that previously overlaid the image
              (4.9★ · 12K reviews, 500+ Pandits, Verified) are now a
              slim chip row above the headline so the social proof
              survives. All testids preserved. */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="space-y-5 max-w-2xl mx-auto"
          >
            <div className="text-center">
              <div className="flex items-center justify-center gap-3 mb-3">
                <span className="h-px w-10 md:w-14 bg-[#D4AF37]" />
                <span className="text-[#6D2B35] text-[10px] md:text-xs uppercase tracking-[0.32em] font-semibold">Pandit Booking</span>
                <span className="h-px w-10 md:w-14 bg-[#D4AF37]" />
              </div>
              <h2 className="font-serif text-xl md:text-3xl lg:text-4xl text-[#6D2B35] leading-[1.1] tracking-tight mb-3" data-testid="text-pandit-heading">
                Find trusted pandits <span className="italic font-semibold saffron-shimmer">in your city</span>
              </h2>
              <p className="text-[13px] md:text-sm text-[#5a4a3a]/70 leading-relaxed max-w-2xl mx-auto">
                Connect with verified, experienced pandits for every sacred ceremony — Griha Pravesh, Satyanarayan Katha and more. Background-checked and rated by real families.
              </p>

              {/* Trust chip row (rescued from the removed image overlay) */}
              <div className="flex items-center justify-center gap-2 flex-wrap mt-4">
                <div className="bg-white rounded-md px-2.5 py-1 inline-flex items-center gap-1.5 border border-[#D4AF37]/25">
                  <Star className="h-3 w-3 text-[#D4AF37] fill-[#D4AF37]" />
                  <span className="text-[11px] font-semibold text-[#5a4a3a]">4.9</span>
                  <span className="text-[10px] text-[#5a4a3a]/60">· 12K reviews</span>
                </div>
                <div className="bg-white rounded-md px-2.5 py-1 border border-[#D4AF37]/25">
                  <span className="text-[11px] font-semibold text-[#5a4a3a]">500+ Pandits</span>
                </div>
                <div className="bg-white rounded-md px-2.5 py-1 inline-flex items-center gap-1.5 border border-[#D4AF37]/25">
                  <Shield className="h-3 w-3 text-emerald-600" />
                  <span className="text-[11px] font-semibold text-[#5a4a3a]">Verified</span>
                </div>
              </div>
            </div>

            {/* City search bar — slim, rounded-md */}
            <div className="flex items-center gap-2 max-w-md mx-auto bg-white rounded-md border border-[#D4AF37]/25 focus-within:border-[#D4AF37]/60 transition-colors p-1 pl-3">
              <Search className="h-4 w-4 text-[#5a4a3a]/45 shrink-0" />
              <input
                type="text"
                placeholder="Enter your city…"
                className="flex-1 bg-transparent text-[13px] text-[#5a4a3a] placeholder:text-[#5a4a3a]/40 focus:outline-none py-1.5 min-w-0"
                data-testid="input-pandit-city"
              />
              <Link href="/pandits">
                <Button
                  size="sm"
                  className="bg-[#6D2B35] hover:bg-[#5a2430] text-white rounded-md px-4 h-8 text-[12px] font-semibold"
                  data-testid="btn-search-pandit"
                >
                  Search
                </Button>
              </Link>
            </div>

            {/* Popular city chips */}
            <div className="flex items-center justify-center gap-2 flex-wrap max-w-md mx-auto">
              <span className="text-[11px] text-[#5a4a3a]/50 uppercase tracking-wider font-semibold">Popular:</span>
              {["Mumbai", "Delhi", "Bangalore", "Pune", "Kolkata"].map((c) => (
                <Link key={c} href={`/pandits?city=${encodeURIComponent(c)}`}>
                  <span className="text-[11px] text-[#5a4a3a] bg-white border border-[#D4AF37]/15 hover:border-[#D4AF37]/45 hover:text-[#6D2B35] rounded-md px-2 py-0.5 transition-colors inline-block" data-testid={`chip-pandit-city-${c.toLowerCase()}`}>
                    {c}
                  </span>
                </Link>
              ))}
            </div>

            <div className="text-center">
              <Link href="/pandits">
                <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#6D2B35] hover:text-[#D4AF37] transition-colors" data-testid="btn-find-pandit">
                  Browse all pandits <ArrowRight className="h-3 w-3" />
                </span>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <TabbedShop
        featuredProducts={featuredProducts}
        allProducts={products}
        isLoading={isLoading}
        ratingsAgg={ratingsAgg}
        addToCart={addToCart}
        toast={toast}
        viewAllLabel={t.products.viewAll}
        addToCartLabel={t.products.addToCart}
        sectionTag={t.products.sectionTag}
      />

      {/* Bhandara Seva — slim social-impact banner.
          Was a 520 px hero (Wave: homepage clutter audit). Compressed
          to ~140 px so it stops competing visually with commercial
          sections, while still carrying the seva message + live meals
          counter. Image runs as a low-opacity backdrop on desktop;
          mobile collapses to a clean maroon strip. All testids
          preserved (eyebrow, heading, body, tagline, meals-count,
          impact chip). */}
      <section
        className="relative overflow-hidden border-y border-[#D4AF37]/25"
        data-testid="section-bhandara-seva"
      >
        {/* Backdrop — dark maroon base + faint photo on the right side
            (desktop only) so the message is always legible. */}
        <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, #2a0f15 0%, #4a1a22 50%, #6D2B35 100%)" }} aria-hidden="true" />
        <img
          src={optImg(bhandaraSevaImg, 1080)}
          srcSet={optImgSrcSet(bhandaraSevaImg, [320, 480, 768, 1080])}
          sizes="(min-width: 1024px) 50vw, 0px"
          alt=""
          className="hidden lg:block absolute inset-y-0 right-0 w-1/2 h-full object-cover opacity-25"
          loading="lazy"
          decoding="async"
          aria-hidden="true"
          data-testid="img-bhandara-seva"
        />
        <div className="hidden lg:block absolute inset-y-0 right-0 w-1/2 pointer-events-none"
          style={{ background: "linear-gradient(90deg, #4a1a22 0%, rgba(74,26,34,0.6) 40%, transparent 100%)" }}
          aria-hidden="true"
        />

        <div className="relative container mx-auto px-4 py-4 md:py-5">
          <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-5 text-white">
            {/* Icon + eyebrow + tagline cluster (left) */}
            <div className="flex items-center gap-3 md:flex-shrink-0">
              <div className="w-10 h-10 rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 flex items-center justify-center flex-shrink-0">
                <HandHeart className="w-5 h-5 text-[#D4AF37]" />
              </div>
              <div className="min-w-0">
                <p
                  className="text-[9px] md:text-[10px] uppercase tracking-[0.32em] font-semibold text-[#D4AF37] leading-none mb-1"
                  data-testid="text-bhandara-eyebrow"
                >
                  Seva
                </p>
                <p
                  className="font-serif italic text-[12px] md:text-[13px] text-[#D4AF37] leading-tight"
                  data-testid="text-bhandara-tagline"
                >
                  Pure essentials. Greater purpose.
                </p>
              </div>
            </div>

            {/* Heading + body (center, takes remaining width) */}
            <div className="min-w-0 md:flex-1">
              <h2
                className="font-serif text-[15px] md:text-[17px] lg:text-lg font-semibold leading-snug"
                data-testid="text-bhandara-heading"
              >
                Devotion that goes <span className="italic text-[#D4AF37]">beyond your home</span>
              </h2>
              <p
                className="text-[12px] md:text-[12.5px] leading-snug text-white/75 mt-1"
                data-testid="text-bhandara-body"
              >
                Every order helps us serve bhandara &mdash; sharing food, care and blessings with others.
              </p>
            </div>

            {/* Live meals counter (right) */}
            <div className="md:flex-shrink-0">
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#D4AF37]/40 bg-white/5 backdrop-blur-sm"
                data-testid="chip-bhandara-impact"
              >
                <Flame className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span className="text-[11.5px] md:text-[12px] font-medium tracking-wide text-white whitespace-nowrap">
                  <span className="font-semibold text-[#D4AF37]" data-testid="text-meals-count">3,809</span>
                  {" "}meals served this year
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI-Personalized Recommendations (DISABLED — keeps homepage to 7 lean sections) */}
      {false && <RecommendedForYou limit={8} />}

      {false && (<>
      {/* Featured Products — Handpicked for You (REMOVED — merged into TabbedShop above) */}
      <section className="py-10 md:py-14 bg-[#FAFAF7]">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="text-center mb-8 md:mb-10">
            <div className="flex items-center justify-center gap-3 mb-3">
              <span className="h-px w-10 md:w-14 bg-[#D4AF37]" />
              <span className="text-[#6D2B35] text-[10px] md:text-xs uppercase tracking-[0.32em] font-semibold">{t.products.sectionTag}</span>
              <span className="h-px w-10 md:w-14 bg-[#D4AF37]" />
            </div>
            <h2 className="font-serif text-xl md:text-3xl lg:text-4xl text-[#6D2B35] leading-[1.1] tracking-tight mb-2" data-testid="text-popular-heading">
              {t.products.heading}
            </h2>
            <p className="text-[13px] text-[#5a4a3a]/55 max-w-md mx-auto">{t.products.subheading}</p>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
            {isLoading ? Array(10).fill(0).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-square rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            )) : featuredProducts.map((product, idx) => {
              const isSellingFast = idx < 2;
              const hasMrp = !!product.mrp && product.mrp > product.price;
              const savingsPct = hasMrp ? Math.round(((product.mrp! - product.price) / product.mrp!) * 100) : 0;
              const showSocialProof = !!(product.salesCount && product.salesCount > 0);
              const rating = getDisplayRating(product.id, ratingsAgg?.[product.id] ?? null);
              const primaryAlt = (product.imageAlts && product.imageAlts[0]) || `${product.name} – ${product.category} | Vedic Tatva`;
              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.08, duration: 0.5 }}
                  className="group"
                >
                  <div className="bg-white rounded-lg overflow-hidden border border-[#D4AF37]/15 hover:border-[#D4AF37]/45 transition-colors flex flex-col h-full" data-testid={`card-product-${product.id}`}>
                    <Link href={getProductUrl(product.id, product.name)} className="block">
                      <div className="aspect-square bg-[#F7F2E7] overflow-hidden relative p-3 sm:p-4">
                        <img
                          src={optImg(product.image, 480)}
                          srcSet={optImgSrcSet(product.image, [320, 480, 768, 1080])}
                          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                          alt={primaryAlt}
                          loading="lazy"
                          decoding="async"
                          width={600}
                          height={600}
                          className="w-full h-full object-contain group-hover:scale-[1.04] transition-transform duration-500"
                          data-testid={`img-product-${product.id}`}
                        />
                        <div className="absolute top-2 left-2 flex flex-col gap-1">
                          {isSellingFast && (
                            <span className="inline-flex items-center gap-1 bg-red-600 text-white text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-md" data-testid={`badge-selling-fast-${product.id}`}>
                              <Flame className="h-2.5 w-2.5" />
                              Hot
                            </span>
                          )}
                          {product.badge && (
                            <span className="bg-white/90 backdrop-blur text-[#6D2B35] text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-md border border-[#D4AF37]/20">
                              {product.badge}
                            </span>
                          )}
                        </div>
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <Button size="icon" variant="secondary" className="rounded-md h-7 w-7 bg-white/95 hover:bg-white border border-[#D4AF37]/20"><Heart className="h-3 w-3 text-[#6D2B35]" /></Button>
                        </div>
                      </div>
                    </Link>

                    <div className="p-3 flex-1 flex flex-col">
                      <Link href={getProductUrl(product.id, product.name)}>
                        <h3 className="font-serif text-[13px] sm:text-sm text-[#6D2B35] font-semibold leading-snug mb-1 line-clamp-2 group-hover:text-[#D4AF37] transition-colors min-h-[2.4em]" data-testid={`text-product-name-${product.id}`}>
                          {product.name}
                        </h3>
                      </Link>

                      {product.brand && (
                        <p className="text-[10px] text-[#5a4a3a]/55 mb-1 line-clamp-1" data-testid={`text-brand-${product.id}`}>
                          {product.brand}
                        </p>
                      )}

                      <Link href={`${getProductUrl(product.id, product.name)}#reviews`}>
                        <div className="inline-flex items-center gap-1 mb-1.5 hover:opacity-80 transition-opacity" data-testid={`rating-chip-${product.id}`}
                          aria-label={`Rated ${rating.avg.toFixed(1)} out of 5 from ${rating.count.toLocaleString("en-IN")} ratings`}
                        >
                          <Star className="h-3 w-3 fill-[#D4AF37] text-[#D4AF37]" aria-hidden="true" />
                          <span className="text-[11px] font-semibold text-[#5a4a3a]">{rating.avg.toFixed(1)}</span>
                          <span className="text-[10px] text-[#5a4a3a]/55">({rating.count.toLocaleString("en-IN")})</span>
                        </div>
                      </Link>

                      <div className="flex items-baseline gap-1.5 mb-1 flex-wrap">
                        <span className="font-bold text-[15px] sm:text-base text-[#5a4a3a]">₹{product.price.toLocaleString("en-IN")}</span>
                        {hasMrp && (
                          <>
                            <span className="text-[11px] text-[#5a4a3a]/45 line-through" data-testid={`text-mrp-${product.id}`}>
                              ₹{product.mrp!.toLocaleString("en-IN")}
                            </span>
                            <span className="text-[10px] font-semibold text-emerald-700" data-testid={`text-savings-${product.id}`}>
                              {savingsPct}% off
                            </span>
                          </>
                        )}
                      </div>

                      <div className="min-h-[14px] mb-2">
                        {product.stock > 0 && product.stock <= 10 ? (
                          <span className="text-[10px] font-semibold text-orange-700" data-testid={`text-low-stock-${product.id}`}>
                            Only {product.stock} left
                          </span>
                        ) : showSocialProof ? (
                          <span className="text-[10px] text-[#5a4a3a]/55" data-testid={`text-bought-${product.id}`}>
                            {product.salesCount!.toLocaleString("en-IN")} bought this month
                          </span>
                        ) : null}
                      </div>

                      <Button
                        size="sm"
                        className="mt-auto w-full rounded-md bg-[#6D2B35] hover:bg-[#5a2430] text-white text-[12px] h-8 font-semibold"
                        data-testid={`btn-add-product-${product.id}`}
                        onClick={() => { addToCart(product); toast({ title: "Added to cart", description: `${product.name} has been added to your cart.` }); }}
                      >
                        <ShoppingBag className="h-3 w-3 mr-1" />
                        {t.products.addToCart}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="text-center mt-8">
            <Link href="/spiritual-essentials">
              <Button
                variant="outline"
                className="rounded-md px-6 h-9 border-[#6D2B35]/25 text-[#6D2B35] hover:bg-[#6D2B35] hover:text-white text-[13px] font-semibold"
                data-testid="link-view-all"
              >
                {t.products.viewAll} <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Daily Vrat & Spiritual Guidance */}
      <DailyRecommendations />
      </>)}

      {false && (<>
      {/* Trending in Your City — Hyper-Local (REMOVED — merged into TabbedShop) */}
      <TrendingInCity products={products} />

      {/* Why Vedic Tatva (REMOVED — moved to /about) */}
      <section className="py-10 md:py-14 bg-white" data-testid="section-why-vedic-tatva">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="text-center mb-8 md:mb-10 max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-2.5 mb-3">
              <span className="h-px w-6 bg-[#D4AF37]" />
              <span className="text-[#D4AF37] text-[10px] uppercase tracking-[0.3em] font-semibold">Built on Trust</span>
              <span className="h-px w-6 bg-[#D4AF37]" />
            </div>
            <h2 className="text-2xl md:text-3xl font-serif font-semibold text-[#6D2B35] mb-2" data-testid="text-why-heading">Why Vedic Tatva?</h2>
            <p className="text-[13px] text-[#5a4a3a]/60 leading-relaxed">Sourced with care. Verified with rigor. Secured end-to-end — so you focus on what matters: your faith.</p>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-px bg-[#D4AF37]/15 rounded-lg overflow-hidden border border-[#D4AF37]/15 max-w-6xl mx-auto">
            {[
              { icon: UserCheck, title: "Verified Pandits", desc: "Background-checked & qualified" },
              { icon: Shield, title: "Authentic Products", desc: "Lab-tested ritual essentials" },
              { icon: CheckCircle, title: "Secure Payments", desc: "Encrypted & protected" },
              { icon: Globe, title: "Pan-India Service", desc: "Delivering to 500+ cities" },
              { icon: IndianRupee, title: "Transparent Pricing", desc: "No hidden fees, ever" },
              { icon: RotateCcw, title: "30-Day Returns", desc: "Hassle-free return policy" },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05, duration: 0.4 }}
                className="bg-white px-4 py-5 flex flex-col items-start text-left hover:bg-[#FBF7EE] transition-colors"
                data-testid={`trust-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <div className="w-8 h-8 rounded-md bg-[#FBF7EE] border border-[#D4AF37]/20 flex items-center justify-center mb-2.5">
                  <item.icon className="h-4 w-4 text-[#6D2B35]" strokeWidth={1.8} />
                </div>
                <h4 className="font-semibold text-[13px] text-[#6D2B35] mb-0.5 leading-tight">{item.title}</h4>
                <p className="text-[11px] text-[#5a4a3a]/55 leading-snug">{item.desc}</p>
              </motion.div>
            ))}
          </div>

          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.3, duration: 0.5 }} className="mt-8 max-w-3xl mx-auto">
            <figure className="relative px-6 md:px-10">
              <span className="absolute left-0 top-0 font-serif text-5xl md:text-6xl text-[#D4AF37]/30 leading-none select-none" aria-hidden="true">"</span>
              <blockquote className="text-[13px] md:text-sm text-[#5a4a3a]/75 leading-relaxed italic text-center">
                At Vedic Tatva, we believe spirituality should be accessible, authentic, and trustworthy. Every pandit is personally verified, every product is ethically sourced, and every ritual is performed with the sanctity it deserves.
              </blockquote>
              <span className="absolute right-0 bottom-0 font-serif text-5xl md:text-6xl text-[#D4AF37]/30 leading-none select-none" aria-hidden="true">"</span>
              <figcaption className="flex items-center justify-center gap-2 mt-3">
                <span className="h-px w-5 bg-[#D4AF37]/40" />
                <span className="text-[10px] text-[#D4AF37] uppercase tracking-[0.3em] font-semibold">The Vedic Tatva Promise</span>
                <span className="h-px w-5 bg-[#D4AF37]/40" />
              </figcaption>
            </figure>
          </motion.div>
        </div>
      </section>

      </>)}

      {/* Book a Pandit — RELOCATED to under Spiritual Snapshot (above
          TabbedShop) in this audit pass for better revenue ordering. */}

      {false && (<>
      {/* Puja Booking 3-step (REMOVED — moved to /puja-booking page) */}
      <section className="py-10 md:py-14 bg-white" data-testid="section-puja-booking">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="text-center mb-8 md:mb-10 max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-2.5 mb-3">
              <span className="h-px w-6 bg-[#D4AF37]" />
              <span className="text-[#D4AF37] text-[10px] uppercase tracking-[0.3em] font-semibold">Simple & Sacred</span>
              <span className="h-px w-6 bg-[#D4AF37]" />
            </div>
            <h2 className="text-2xl md:text-3xl font-serif font-semibold text-[#6D2B35] mb-2" data-testid="text-puja-heading">Book your puja in 3 simple steps</h2>
            <p className="text-[13px] text-[#5a4a3a]/60 leading-relaxed">No complexity, no confusion — a seamless ceremony from selection to completion.</p>
          </motion.div>

          <div className="relative max-w-4xl mx-auto mb-8">
            {/* Hairline connector behind cards */}
            <div className="hidden md:block absolute top-1/2 left-12 right-12 h-px bg-[#D4AF37]/20 -translate-y-1/2" aria-hidden="true" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 relative">
              {[
                { step: "01", title: "Select Puja", desc: "Satyanarayan, Griha Pravesh, Navgraha Shanti and more", icon: ScrollText },
                { step: "02", title: "Choose Date", desc: "Pick an auspicious muhurat or a date that suits your family", icon: Calendar },
                { step: "03", title: "Confirm Booking", desc: "Pay securely and get instant confirmation with pandit details", icon: CheckCircle },
              ].map((item, i) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.4 }}
                  className="relative bg-white rounded-lg border border-[#D4AF37]/20 hover:border-[#D4AF37]/45 transition-colors p-4 md:p-5"
                  data-testid={`step-${item.step}`}
                >
                  <div className="flex items-center gap-2.5 mb-2.5">
                    <div className="w-8 h-8 rounded-md bg-[#FBF7EE] border border-[#D4AF37]/20 flex items-center justify-center shrink-0">
                      <item.icon className="h-4 w-4 text-[#6D2B35]" strokeWidth={1.8} />
                    </div>
                    <span className="text-[10px] uppercase tracking-[0.3em] font-semibold text-[#D4AF37]">Step {item.step}</span>
                  </div>
                  <h3 className="font-serif text-base font-semibold text-[#6D2B35] mb-1 leading-tight">{item.title}</h3>
                  <p className="text-[12px] text-[#5a4a3a]/60 leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="text-center">
            <Link href="/puja">
              <Button
                className="bg-[#6D2B35] hover:bg-[#5a2430] text-white rounded-md px-6 h-10 text-[13px] font-semibold inline-flex items-center gap-2"
                data-testid="btn-schedule-puja"
              >
                <Calendar className="h-4 w-4" />
                Schedule a puja
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      </>)}

      {/* Join as a Panditji — REMOVED from home in this audit pass. The
          B2B "earn ₹50k+/mo as a verified pandit" section dilutes the
          B2C funnel on the homepage. It now lives on the dedicated
          /become-pandit landing (linked from the footer) where intent
          is qualified. Keep the import path live in case product
          decides to A/B-test it back in. */}

      {/* Testimonials / Community Stories */}
      <TestimonialsCarousel />

      {/* Vedic Astrology — true hero banner with bespoke image.
          16:9 cinematic backdrop (zodiac chakra + golden constellations
          on midnight maroon), dark wash on the LEFT side keeps text
          legible, gold rule top + bottom. Single focal CTA lives where
          the eye naturally lands after reading the headline. All
          testids preserved (section-astrology, text-astrology-heading,
          btn-generate-kundli). */}
      <section
        id="vedic-astrology"
        aria-labelledby="astrology-heading"
        className="relative text-white scroll-mt-24 border-y border-[#D4AF37]/30 overflow-hidden"
        data-testid="section-astrology"
      >
        {/* Backdrop image — 16:9 hero illustration */}
        <img
          src={optImg(astrologyBannerImg, 1440)}
          srcSet={optImgSrcSet(astrologyBannerImg, [480, 768, 1080, 1440, 1920])}
          sizes="100vw"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
          decoding="async"
          data-testid="img-astrology-banner"
        />
        {/* Dark wash — heavier on the left so the headline and CTA stay
            legible regardless of where the artwork lands. */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, rgba(20,11,16,0.85) 0%, rgba(20,11,16,0.7) 45%, rgba(20,11,16,0.4) 100%)",
          }}
          aria-hidden="true"
        />

        <div className="relative container mx-auto px-4 sm:px-6 py-10 md:py-14">
          <div className="max-w-2xl">
            <div className="text-[#D4AF37] text-[10px] uppercase tracking-[0.32em] font-semibold mb-3">
              Vedic Astrology · Jyotish
            </div>
            <h2
              id="astrology-heading"
              className="font-serif text-2xl md:text-3xl lg:text-4xl font-semibold leading-[1.15] tracking-tight"
              data-testid="text-astrology-heading"
            >
              Free Kundli &amp; live consultations with{" "}
              <span className="text-[#D4AF37]">certified Vedic astrologers</span>
            </h2>

            {/* Single focal CTA */}
            <div className="mt-6">
              <Link href="/astrology">
                <Button
                  className="bg-[#D4AF37] text-[#1a1118] font-semibold gap-2 hover:bg-[#D4AF37] shadow-[0_0_30px_-8px_rgba(212,175,55,0.6)]"
                  data-testid="btn-generate-kundli"
                  aria-label="Get your free Vedic Kundli and consult an astrologer"
                >
                  <BookOpen className="h-4 w-4" />
                  Get My Free Kundli
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {false && (<>
      {/* Stats Bar (REMOVED — moved to /about full + footer micro-strip) */}
      <section className="py-8 md:py-10 bg-[#6D2B35] text-white relative" data-testid="section-stats-bar">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[#D4AF37]/20 rounded-lg overflow-hidden border border-[#D4AF37]/20 max-w-5xl mx-auto">
            {[
              { value: "500+", label: "Verified Pandits" },
              { value: "10k+", label: "Happy Families" },
              { value: "50+", label: "Puja Types" },
              { value: "100%", label: "Authentic Products" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05, duration: 0.4 }}
                className="bg-[#6D2B35] px-4 py-4 md:py-5 text-center"
                data-testid={`stat-${stat.label.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <div className="text-[#D4AF37] text-2xl md:text-3xl font-serif font-semibold leading-none mb-1">{stat.value}</div>
                <p className="text-white/65 text-[11px] md:text-xs uppercase tracking-[0.15em] font-semibold">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA (REMOVED — homepage now ends at Testimonials) */}
      <section className="py-10 md:py-14 bg-white relative" data-testid="section-final-cta">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="text-center max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-2.5 mb-3">
              <span className="h-px w-6 bg-[#D4AF37]" />
              <span className="text-[#D4AF37] text-[10px] uppercase tracking-[0.3em] font-semibold">Begin Today</span>
              <span className="h-px w-6 bg-[#D4AF37]" />
            </div>

            <h2 className="text-2xl md:text-3xl lg:text-4xl font-serif font-semibold text-[#6D2B35] mb-2 leading-tight" data-testid="text-final-cta-heading">
              Begin your sacred journey today
            </h2>
            <p className="text-[13px] text-[#5a4a3a]/65 mb-6 max-w-md mx-auto leading-relaxed">
              Authentic spiritual products, verified pandits and divine experiences — all in one place.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-2.5">
              <Link href="/shop">
                <Button
                  className="bg-[#6D2B35] hover:bg-[#5a2430] text-white rounded-md px-5 h-10 text-[13px] font-semibold inline-flex items-center gap-2"
                  data-testid="btn-final-shop"
                >
                  <ShoppingBag className="h-4 w-4" />
                  Shop now
                </Button>
              </Link>
              <Link href="/pandits">
                <Button
                  variant="outline"
                  className="border-[#6D2B35]/25 bg-white text-[#6D2B35] hover:bg-[#FBF7EE] rounded-md px-5 h-10 text-[13px] font-semibold inline-flex items-center gap-2"
                  data-testid="btn-final-pandit"
                >
                  <UserCheck className="h-4 w-4" />
                  Book a pandit
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
      </>)}

      {neevModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setNeevModalOpen(false)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden z-10"
            data-testid="neev-basics-modal"
          >
            <div className="relative bg-gradient-to-br from-[#2d5016] via-[#3a6b1e] to-[#4a8526] p-6 pb-8 text-center">
              <button
                onClick={() => setNeevModalOpen(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                data-testid="btn-close-neev-modal"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="inline-flex items-center gap-2 bg-white/15 rounded-full px-4 py-1.5 mb-4">
                <Leaf className="w-4 h-4 text-[#90EE90]" />
                <span className="text-[11px] uppercase tracking-[0.2em] font-medium text-white/90">Neev Basics</span>
              </div>
              <h3 className="text-2xl md:text-3xl font-serif text-white mb-2">{t.neevModal.heading}</h3>
              <p className="text-white/70 text-sm">{t.neevModal.subtitle}</p>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-center text-sm text-[#5a4a3a]/70 mb-4">
                {t.neevModal.tagline}
              </p>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { name: t.neevModal.innerwears, desc: t.neevModal.innerwearsDesc, icon: Shirt },
                  { name: t.neevModal.kurtaSets, desc: t.neevModal.kurtaSetsDesc, icon: Sparkles },
                  { name: t.neevModal.dhotiCollection, desc: t.neevModal.dhotiDesc, icon: Gem },
                ].map((item, i) => (
                  <div key={i} className="text-center p-3 rounded-2xl bg-[#F5F0E6]/60 border border-[#D4AF37]/10 hover:border-[#D4AF37]/30 transition-colors">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#2d5016]/10 to-[#4a8526]/10 flex items-center justify-center mx-auto mb-2.5">
                      <item.icon className="w-5 h-5 text-[#2d5016]" />
                    </div>
                    <h4 className="text-xs font-semibold text-[#6D2B35] mb-1 leading-tight">{item.name}</h4>
                    <p className="text-[9px] text-[#5a4a3a]/50 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>

              <div className="bg-gradient-to-r from-[#F5F0E6] to-[#ede6d8] rounded-2xl p-4 text-center border border-[#D4AF37]/15">
                <p className="text-xs text-[#6D2B35] font-medium mb-1">{t.neevModal.whyTitle}</p>
                <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-[10px] text-[#5a4a3a]/60">
                  <span>{t.neevModal.doubleCombedCotton}</span>
                  <span>{t.neevModal.noSynthetic}</span>
                  <span>{t.neevModal.skinFriendly}</span>
                  <span>{t.neevModal.madeInIndia}</span>
                  <span>{t.neevModal.premiumStitching}</span>
                  <span>{t.neevModal.traditionalDesigns}</span>
                </div>
              </div>

              <div className="text-center pt-2">
                <div className="inline-flex items-center gap-2 bg-[#D4AF37]/10 rounded-full px-5 py-2.5">
                  <div className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
                  <span className="text-xs font-medium text-[#6D2B35]">{t.neevModal.launchingSoon}</span>
                </div>
                <p className="text-[10px] text-[#5a4a3a]/40 mt-2">{t.neevModal.followUs}</p>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* ─────────── SEO Content Section ───────────
          Keyword-loaded H2 block sitting above the footer. Each H2 targets one
          of the five primary homepage keywords, links into its hub page, and
          gives Google semantic context for the whole site.                       */}
      <section className="bg-[#FBF7EE] border-t border-[#D4AF37]/15" data-testid="section-home-seo-content">
        <div className="container mx-auto px-4 py-10 md:py-14 max-w-5xl">
          <div className="text-center mb-8 md:mb-10">
            <span className="inline-block text-[#6D2B35] text-[10px] md:text-xs uppercase tracking-[0.32em] font-semibold mb-2">
              Why Vedic Tatva
            </span>
            <h2 className="font-serif text-2xl md:text-3xl text-[#6D2B35] leading-tight">
              Book Puja Online, Hire Pandits & Shop Puja Essentials
            </h2>
            <p className="mt-3 text-sm md:text-base text-[#5a4a3a]/80 max-w-2xl mx-auto leading-relaxed">
              India's most trusted spiritual platform — verified Vedic Pandits, authentic samagri sourced
              from Kashi & Gaya, AI-powered astrology, and prasad delivered to your door.
            </p>
          </div>

          {/* Service descriptions collapsed behind a <details> accordion
              (Wave: homepage clutter audit). Google indexes content
              inside <details> normally, so SEO juice is preserved while
              the page stops repeating the business model for a 4th time
              in plain sight. City quick-links below stay visible. */}
          <details className="group rounded-md border border-[#D4AF37]/25 bg-white" data-testid="accordion-seo-services">
            <summary
              className="flex items-center justify-between gap-3 px-5 md:px-6 py-3.5 md:py-4 cursor-pointer list-none text-[#6D2B35] font-serif text-base md:text-lg font-semibold hover-elevate"
              data-testid="accordion-seo-services-trigger"
            >
              <span>Read more about our services</span>
              <ChevronDown className="w-5 h-5 transition-transform group-open:rotate-180 text-[#D4AF37]" />
            </summary>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6 px-5 md:px-6 pb-5 md:pb-6 pt-1">
            <article className="rounded-md border border-[#D4AF37]/25 bg-white p-5 md:p-6">
              <h2 className="font-serif text-lg md:text-xl text-[#6D2B35] mb-2">Online Puja Booking Services</h2>
              <p className="text-[13.5px] md:text-sm text-[#5a4a3a] leading-relaxed mb-3">
                Book any Vedic puja online — Satyanarayan, Rudrabhishek, Lakshmi, Ganesh, Navratri,
                Griha Pravesh and more. A verified pandit performs the full ritual at the temple or
                sankalp-sthan, you join the sankalp live on video call, and prasad reaches your home.
                Same-day slots available.
              </p>
              <Link href="/online-puja-booking" className="text-[#6D2B35] font-semibold text-[13px] inline-flex items-center gap-1 hover:underline" data-testid="link-seo-puja-booking">
                Book a Puja Online <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </article>

            <article className="rounded-md border border-[#D4AF37]/25 bg-white p-5 md:p-6">
              <h2 className="font-serif text-lg md:text-xl text-[#6D2B35] mb-2">Book Experienced Pandits Online</h2>
              <p className="text-[13.5px] md:text-sm text-[#5a4a3a] leading-relaxed mb-3">
                1,200+ identity-verified, scripture-trained Brahmin pandits across Delhi, Mumbai,
                Bangalore, Hyderabad, Pune, Chennai, Kolkata and 40+ Indian cities. Pick by tradition
                — Shukla Yajurveda, Iyer/Iyengar, Madhwa, Gujarati, Marathi, Konkani — with
                transparent dakshina and same-day availability.
              </p>
              <Link href="/pandits" className="text-[#6D2B35] font-semibold text-[13px] inline-flex items-center gap-1 hover:underline" data-testid="link-seo-pandits">
                Find a Verified Pandit <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </article>

            <article className="rounded-md border border-[#D4AF37]/25 bg-white p-5 md:p-6">
              <h2 className="font-serif text-lg md:text-xl text-[#6D2B35] mb-2">Shop Puja Samagri & Puja Essentials</h2>
              <p className="text-[13.5px] md:text-sm text-[#5a4a3a] leading-relaxed mb-3">
                4,000+ authentic puja items — complete samagri kits, brass diyas and idols,
                certified rudraksha and gemstones, havan kunds, yantras, dhoop and agarbatti.
                Sourced from temple suppliers in Kashi, Gaya and Haridwar with free shipping
                across India over ₹499.
              </p>
              <Link href="/spiritual-essentials" className="text-[#6D2B35] font-semibold text-[13px] inline-flex items-center gap-1 hover:underline" data-testid="link-seo-essentials">
                Shop Puja Essentials <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </article>

            <article className="rounded-md border border-[#D4AF37]/25 bg-white p-5 md:p-6">
              <h2 className="font-serif text-lg md:text-xl text-[#6D2B35] mb-2">Astrology Consultation & Kundli Services</h2>
              <p className="text-[13.5px] md:text-sm text-[#5a4a3a] leading-relaxed mb-3">
                Free AI-generated Janma Kundli, Kundli matching, Vastu analysis, palm reading and
                live consultations with verified Vedic astrologers. Get a complete birth-chart
                report, dasha analysis, gemstone recommendations and remedies — written in plain
                English and Hindi.
              </p>
              <Link href="/astrology" className="text-[#6D2B35] font-semibold text-[13px] inline-flex items-center gap-1 hover:underline" data-testid="link-seo-astrology">
                Talk to an Astrologer <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </article>

            <article className="md:col-span-2 rounded-md border border-[#D4AF37]/25 bg-white p-5 md:p-6">
              <h2 className="font-serif text-lg md:text-xl text-[#6D2B35] mb-2">Festival Puja Booking Across India</h2>
              <p className="text-[13.5px] md:text-sm text-[#5a4a3a] leading-relaxed mb-3">
                Book pandit and samagri together for every major Hindu festival —
                Navratri, Diwali Lakshmi Puja, Ganesh Chaturthi, Janmashtami, Karwa Chauth,
                Shivratri, Holi and Karthik Purnima. Pan-India service with NRI-friendly slots
                for USA, UK, Canada, UAE and Singapore households.
              </p>
              <div className="flex flex-wrap gap-2 text-[12px]">
                <Link href="/satyanarayan-puja" className="rounded-md border border-[#D4AF37]/30 bg-[#FBF7EE] px-3 py-1.5 text-[#6D2B35] font-semibold hover-elevate" data-testid="link-seo-festival-satyanarayan">Satyanarayan Puja</Link>
                <Link href="/rudrabhishek-puja" className="rounded-md border border-[#D4AF37]/30 bg-[#FBF7EE] px-3 py-1.5 text-[#6D2B35] font-semibold hover-elevate" data-testid="link-seo-festival-rudrabhishek">Rudrabhishek</Link>
                <Link href="/navratri-puja" className="rounded-md border border-[#D4AF37]/30 bg-[#FBF7EE] px-3 py-1.5 text-[#6D2B35] font-semibold hover-elevate" data-testid="link-seo-festival-navratri">Navratri Puja</Link>
                <Link href="/lakshmi-puja-benefits" className="rounded-md border border-[#D4AF37]/30 bg-[#FBF7EE] px-3 py-1.5 text-[#6D2B35] font-semibold hover-elevate" data-testid="link-seo-festival-lakshmi">Lakshmi Puja</Link>
                <Link href="/griha-pravesh-muhurat" className="rounded-md border border-[#D4AF37]/30 bg-[#FBF7EE] px-3 py-1.5 text-[#6D2B35] font-semibold hover-elevate" data-testid="link-seo-festival-griha-pravesh">Griha Pravesh Muhurat</Link>
                <Link href="/pind-daan" className="rounded-md border border-[#D4AF37]/30 bg-[#FBF7EE] px-3 py-1.5 text-[#6D2B35] font-semibold hover-elevate" data-testid="link-seo-festival-pind-daan">Pind Daan</Link>
              </div>
            </article>
            </div>
          </details>

          <div className="mt-8 md:mt-10 grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
            <Link href="/pandit-in-delhi" className="rounded-md border border-[#D4AF37]/25 bg-white px-4 py-3 text-[13px] text-[#6D2B35] font-semibold hover-elevate" data-testid="link-seo-city-delhi">
              Book Pandit in Delhi
            </Link>
            <Link href="/pandit-in-mumbai" className="rounded-md border border-[#D4AF37]/25 bg-white px-4 py-3 text-[13px] text-[#6D2B35] font-semibold hover-elevate" data-testid="link-seo-city-mumbai">
              Book Pandit in Mumbai
            </Link>
            <Link href="/pandit-in-bangalore" className="rounded-md border border-[#D4AF37]/25 bg-white px-4 py-3 text-[13px] text-[#6D2B35] font-semibold hover-elevate" data-testid="link-seo-city-bangalore">
              Book Pandit in Bangalore
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

interface DailyRecommendation {
  day: string;
  deity: string;
  tithi: string;
  color: string;
  luckyGem: string;
  luckyNumber: string | number;
  luckyDirection: string;
  vrat: string;
  vratBenefit: string;
  mantra: string;
  mantraTranslation: string;
  spiritualTip: string;
  remedies: { title: string; description?: string; productLink?: string; type?: string }[];
  dosDonts: { dos: string[]; donts: string[] };
  serviceHints: { title: string; description?: string; link: string; linkLabel?: string; icon?: string }[];
}

interface PanchangSummary {
  tithi?: string;
  nakshatra?: string;
  yoga?: string;
  karana?: string;
  vaar?: string;
  [k: string]: unknown;
}

export function DailyRecommendations({ defaultExpanded = false }: { defaultExpanded?: boolean } = {}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const { data, isLoading } = useQuery<DailyRecommendation>({
    queryKey: ["/api/daily-recommendations"],
    queryFn: () => fetch("/api/daily-recommendations").then(r => r.json()),
    staleTime: 1000 * 60 * 30,
  });

  const iconMap: Record<string, typeof Sparkles> = {
    brain: Brain, flame: Flame, sparkles: Sparkles, user: UserCheck,
    shopping: ShoppingBag, compass: Compass, hand: Hand, baby: Baby,
    heart: HandHeart, book: BookOpen,
  };

  if (isLoading) {
    return (
      <section className="py-12 bg-gradient-to-b from-[#FDF8F0] to-white">
        <div className="container mx-auto px-4">
          <Skeleton className="h-8 w-64 mx-auto mb-4" />
          <Skeleton className="h-4 w-80 mx-auto mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4"><Skeleton className="h-40" /><Skeleton className="h-40" /><Skeleton className="h-40" /></div>
        </div>
      </section>
    );
  }

  if (!data) return null;

  return (
    <section className="py-10 md:py-14 bg-[#FBF7EE]" data-testid="section-daily-recommendations">
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="text-center mb-6 max-w-3xl mx-auto">
          <div className="flex items-center justify-center gap-2.5 mb-3">
            <span className="h-px w-6 bg-[#D4AF37]" />
            <span className="text-[#D4AF37] text-[10px] uppercase tracking-[0.3em] font-semibold">Today's Spiritual Guidance</span>
            <span className="h-px w-6 bg-[#D4AF37]" />
          </div>
          <h2 className="text-2xl md:text-3xl font-serif font-semibold text-[#6D2B35] mb-3" data-testid="text-daily-heading">
            {data.day} — Day of {data.deity}
          </h2>

          {/* Compact info strip */}
          <div className="inline-flex items-stretch flex-wrap justify-center bg-white rounded-md border border-[#D4AF37]/20 overflow-hidden divide-x divide-[#D4AF37]/15">
            <span className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] text-[#5a4a3a]"><CalendarDays className="h-3 w-3 text-[#D4AF37]" /> {data.tithi}</span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] text-[#5a4a3a]"><Palette className="h-3 w-3 text-[#D4AF37]" /> Wear {data.color}</span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] text-[#5a4a3a]"><Gem className="h-3 w-3 text-[#D4AF37]" /> {data.luckyGem}</span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] text-[#5a4a3a]"><Hash className="h-3 w-3 text-[#D4AF37]" /> Lucky {data.luckyNumber}</span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] text-[#5a4a3a]"><Navigation className="h-3 w-3 text-[#D4AF37]" /> {data.luckyDirection}</span>
          </div>
        </motion.div>

        {/* Vrat pill + toggle */}
        <div className="flex items-center justify-center gap-3 flex-wrap mb-6">
          <div className="inline-flex items-center gap-2 bg-white rounded-md px-3 py-1.5 border border-[#D4AF37]/20">
            <Sun className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span className="font-serif text-[13px] text-[#6D2B35] font-semibold">{data.vrat}</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-semibold uppercase tracking-wider">Today</span>
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#6D2B35] hover:text-[#D4AF37] transition-colors"
            data-testid="btn-toggle-guidance-details"
          >
            {expanded ? "Hide details" : "View mantras, remedies & more"}
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {expanded && (
          <div className="max-w-4xl mx-auto space-y-4">
            {/* Vrat mantra block */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
              <div className="bg-white rounded-lg border border-[#D4AF37]/15 p-4 md:p-5">
                <div className="flex items-start gap-3 mb-3">
                  <div className="shrink-0 w-9 h-9 rounded-md bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center">
                    <Sun className="w-4 h-4 text-[#D4AF37]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-serif text-base text-[#6D2B35] font-semibold">{data.vrat}</h3>
                      <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-semibold uppercase tracking-wider">Recommended</span>
                    </div>
                    <p className="text-[12.5px] text-[#5a4a3a]/65 leading-relaxed">{data.vratBenefit}</p>
                  </div>
                </div>
                <div className="bg-[#FBF7EE] rounded-md p-3 border border-[#D4AF37]/10">
                  <p className="font-serif text-base md:text-lg text-[#6D2B35] mb-0.5 leading-snug">{data.mantra}</p>
                  <p className="text-[11px] text-[#5a4a3a]/60 italic">{data.mantraTranslation}</p>
                </div>
              </div>
            </motion.div>

            {/* Spiritual insight strip */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05, duration: 0.35 }}>
              <div className="bg-[#6D2B35] rounded-lg p-4 md:p-5 text-white">
                <div className="flex items-start gap-3">
                  <Lightbulb className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <h4 className="font-semibold text-[11px] uppercase tracking-wider mb-1 text-[#D4AF37]">Spiritual Insight</h4>
                    <p className="text-[13px] text-white/85 leading-relaxed">{data.spiritualTip}</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Remedies grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {data.remedies.map((remedy, i) => {
                const tone = remedy.type === "ritual"
                  ? { bg: "bg-orange-50", text: "text-orange-600", border: "border-orange-100" }
                  : remedy.type === "gemstone"
                  ? { bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-100" }
                  : { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-100" };
                return (
                  <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 + i * 0.06, duration: 0.35 }}>
                    <div className="bg-white rounded-lg p-4 border border-[#D4AF37]/15 h-full" data-testid={`remedy-card-${i}`}>
                      <div className={`w-7 h-7 rounded-md flex items-center justify-center mb-2 ${tone.bg} ${tone.text} border ${tone.border}`}>
                        {remedy.type === "ritual" ? <Flame className="w-3.5 h-3.5" /> :
                         remedy.type === "gemstone" ? <Gem className="w-3.5 h-3.5" /> :
                         <HandHeart className="w-3.5 h-3.5" />}
                      </div>
                      <h4 className="font-semibold text-[13px] text-[#6D2B35] mb-1">{remedy.title}</h4>
                      <p className="text-[11.5px] text-[#5a4a3a]/60 leading-relaxed">{remedy.description}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Do's & Don'ts side by side */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-white rounded-lg p-4 border border-emerald-200/60">
                  <h4 className="font-semibold text-emerald-800 text-[11px] uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
                    <ThumbsUp className="w-3.5 h-3.5" /> Do's
                  </h4>
                  <ul className="space-y-1.5">
                    {data.dosDonts.dos.map((item: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-[12px] text-[#5a4a3a]">
                        <CheckCircle className="w-3 h-3 shrink-0 mt-0.5 text-emerald-600" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-white rounded-lg p-4 border border-red-200/60">
                  <h4 className="font-semibold text-red-800 text-[11px] uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
                    <ThumbsDown className="w-3.5 h-3.5" /> Don'ts
                  </h4>
                  <ul className="space-y-1.5">
                    {data.dosDonts.donts.map((item: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-[12px] text-[#5a4a3a]">
                        <CircleDot className="w-3 h-3 shrink-0 mt-0.5 text-red-600" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>

            {/* Explore deeper service hints */}
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <span className="h-px flex-1 bg-[#D4AF37]/20" />
                <span className="text-[#D4AF37] text-[10px] uppercase tracking-[0.3em] font-semibold">Explore Deeper</span>
                <span className="h-px flex-1 bg-[#D4AF37]/20" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {data.serviceHints.map((hint, i) => {
                  const Icon = iconMap[hint.icon ?? ""] || Sparkles;
                  return (
                    <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.06 }}>
                      <Link href={hint.link}>
                        <div className="group cursor-pointer bg-white rounded-lg p-4 border border-[#D4AF37]/15 hover:border-[#D4AF37]/45 transition-colors h-full flex flex-col" data-testid={`service-hint-${i}`}>
                          <div className="w-8 h-8 rounded-md bg-[#FBF7EE] border border-[#D4AF37]/20 flex items-center justify-center mb-2.5 group-hover:bg-[#D4AF37]/10 transition-colors">
                            <Icon className="w-4 h-4 text-[#6D2B35]" />
                          </div>
                          <h4 className="font-semibold text-[13px] text-[#6D2B35] mb-1">{hint.title}</h4>
                          <p className="text-[11.5px] text-[#5a4a3a]/60 leading-relaxed mb-2.5 flex-1">{hint.description}</p>
                          <span className="text-[12px] font-semibold text-[#D4AF37] inline-flex items-center gap-1 group-hover:gap-1.5 transition-all">
                            {hint.linkLabel} <ArrowRight className="w-3 h-3" />
                          </span>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function TrendingInCity({ products }: { products: Product[] | undefined }) {
  const [city, setCity] = useState("Your City");
  const [locationLoading, setLocationLoading] = useState(true);

  useEffect(() => {
    const fallbackCities = ["Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai", "Kolkata", "Pune", "Ahmedabad", "Jaipur", "Lucknow", "Guwahati", "Varanasi", "Indore", "Bhopal", "Patna"];

    const setFallback = () => {
      setCity(fallbackCities[Math.floor(Math.random() * fallbackCities.length)]);
      setLocationLoading(false);
    };

    if (!navigator.geolocation) {
      setFallback();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`,
            { headers: { "Accept-Language": "en", "User-Agent": "VedicTatva/1.0 (https://vedictatva.com)" } }
          );
          if (res.ok) {
            const data = await res.json();
            const detectedCity =
              data.address?.city ||
              data.address?.town ||
              data.address?.village ||
              data.address?.state_district ||
              data.address?.state;
            if (detectedCity) {
              setCity(detectedCity);
            } else {
              setFallback();
            }
          } else {
            setFallback();
          }
        } catch {
          setFallback();
        }
        setLocationLoading(false);
      },
      () => {
        setFallback();
      },
      { timeout: 5000, maximumAge: 600000 }
    );
  }, []);

  const trendingProducts = useMemo(() => {
    if (!products || products.length === 0) return [];
    return [...products]
      .filter((p) => p.stock > 0)
      .sort((a, b) => b.salesCount - a.salesCount)
      .slice(0, 4);
  }, [products]);

  if (trendingProducts.length === 0) return null;

  return (
    <section className="py-10 md:py-14 bg-white" data-testid="section-trending">
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-6 md:mb-8 max-w-6xl mx-auto">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="h-px w-6 bg-[#D4AF37]" />
              <span className="text-[#D4AF37] text-[10px] uppercase tracking-[0.3em] font-semibold">Hyper-Local</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-serif font-semibold text-[#6D2B35] mb-1" data-testid="text-trending-heading">
              Trending in {locationLoading ? (
                <span className="inline-block w-24 h-7 bg-[#D4AF37]/20 rounded-md animate-pulse align-middle" />
              ) : (
                <span className="text-[#D4AF37]">{city}</span>
              )}
            </h2>
            <p className="text-[12px] text-[#5a4a3a]/55 inline-flex items-center gap-1.5">
              <MapPinned className="h-3 w-3 text-[#D4AF37]" />
              {locationLoading ? "Detecting your location…" : "Most purchased this week in your area"}
            </p>
          </div>
          <Link href="/spiritual-essentials" className="hidden md:inline-flex items-center gap-1 text-[12px] font-semibold text-[#6D2B35] hover:text-[#D4AF37] transition-colors" data-testid="link-trending-view-all">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 max-w-6xl mx-auto">
          {trendingProducts.map((product, i) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, duration: 0.4 }}
              data-testid={`trending-product-${product.id}`}
            >
              <Link href={getProductUrl(product.id, product.name)}>
                <div className="group cursor-pointer rounded-lg border border-[#D4AF37]/15 hover:border-[#D4AF37]/45 transition-colors overflow-hidden bg-white">
                  <div className="aspect-square overflow-hidden bg-[#F7F2E7] relative">
                    <img src={optImg(product.image, 480)} srcSet={optImgSrcSet(product.image, [320, 480, 768, 1080])} sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw" alt={product.name} loading="lazy" decoding="async" width={600} height={600} className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500" />
                    <div className="absolute top-2 left-2 inline-flex items-center gap-1 bg-white/95 backdrop-blur rounded-md px-1.5 py-0.5 border border-emerald-100">
                      <TrendingUp className="h-2.5 w-2.5 text-emerald-600" />
                      <span className="text-[9px] font-semibold text-emerald-700 uppercase tracking-wider">Trending</span>
                    </div>
                  </div>
                  <div className="p-3">
                    <h4 className="text-[13px] font-serif font-semibold text-[#6D2B35] mb-1.5 line-clamp-1 group-hover:text-[#D4AF37] transition-colors">{product.name}</h4>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[14px] font-bold text-[#5a4a3a]">₹{product.price.toLocaleString("en-IN")}</span>
                      <span className="text-[10px] text-[#5a4a3a]/55">{product.salesCount}+ bought</span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SpiritualSnapshot() {
  const { data, isLoading } = useQuery<DailyRecommendation>({
    queryKey: ["/api/daily-recommendations"],
    queryFn: () => fetch("/api/daily-recommendations").then(r => r.json()),
    staleTime: 1000 * 60 * 30,
  });
  const { data: panchang } = useQuery<PanchangSummary>({
    queryKey: ["/api/panchang"],
    queryFn: () => fetch("/api/panchang").then(r => r.json()),
    staleTime: 1000 * 60 * 30,
  });

  if (isLoading || !data) {
    return (
      <section className="py-12 md:py-16 bg-white border-t border-[#D4AF37]/15" data-testid="section-spiritual-snapshot">
        <div className="container mx-auto px-4">
          <Skeleton className="h-20 max-w-3xl mx-auto rounded-md" />
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 md:py-16 bg-white border-t border-[#D4AF37]/15" data-testid="section-spiritual-snapshot">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="max-w-4xl mx-auto"
        >
          <div className="flex items-center justify-center gap-3 mb-3">
            <span className="h-px w-10 md:w-14 bg-[#D4AF37]" />
            <span className="text-[#6D2B35] text-[10px] md:text-xs uppercase tracking-[0.32em] font-semibold">Today's Spiritual Snapshot</span>
            <span className="h-px w-10 md:w-14 bg-[#D4AF37]" />
          </div>
          <h2 className="text-center font-serif text-xl md:text-3xl lg:text-4xl text-[#6D2B35] leading-[1.1] tracking-tight mb-4" data-testid="text-snapshot-heading">
            {data.day} — <span className="italic font-semibold saffron-shimmer">Day of {data.deity}</span>
          </h2>

          <div className="bg-white rounded-md border border-[#D4AF37]/25 p-3 md:p-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[12px] text-[#5a4a3a]">
            {panchang?.tithi && (
              <span className="inline-flex items-center gap-1.5" data-testid="snapshot-tithi"><CalendarDays className="h-3.5 w-3.5 text-[#D4AF37]" /> Tithi: <span className="font-semibold text-[#6D2B35]">{panchang.tithi}</span></span>
            )}
            {panchang?.nakshatra && (
              <span className="inline-flex items-center gap-1.5" data-testid="snapshot-nakshatra"><Star className="h-3.5 w-3.5 text-[#D4AF37]" /> Nakshatra: <span className="font-semibold text-[#6D2B35]">{panchang.nakshatra}</span></span>
            )}
            <span className="inline-flex items-center gap-1.5" data-testid="snapshot-vrat"><Sun className="h-3.5 w-3.5 text-[#D4AF37]" /> Vrat: <span className="font-semibold text-[#6D2B35]">{data.vrat}</span></span>
            {data.remedies?.[0]?.title && (
              <span className="inline-flex items-center gap-1.5" data-testid="snapshot-remedy"><Sparkles className="h-3.5 w-3.5 text-[#D4AF37]" /> Remedy: <span className="font-semibold text-[#6D2B35]">{data.remedies[0].title}</span></span>
            )}
            <Link href="/panchang-calendar">
              <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#6D2B35] hover:text-[#D4AF37] transition-colors" data-testid="link-snapshot-panchang">
                Open panchang <ArrowRight className="h-3 w-3" />
              </span>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function TabbedShop({
  featuredProducts,
  allProducts,
  isLoading,
  ratingsAgg,
  addToCart,
  toast,
  viewAllLabel,
  addToCartLabel,
  sectionTag,
}: {
  featuredProducts: Product[];
  allProducts: Product[] | undefined;
  isLoading: boolean;
  ratingsAgg: Record<number, { avg: number; count: number }> | undefined;
  addToCart: (p: Product) => void;
  toast: ReturnType<typeof useToast>["toast"];
  viewAllLabel: string;
  addToCartLabel: string;
  sectionTag: string;
}) {
  const [tab, setTab] = useState<"popular" | "trending" | "new">("popular");
  const [city, setCity] = useState("Your City");
  const [locationLoading, setLocationLoading] = useState(true);

  useEffect(() => {
    const fallbackCities = ["Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai", "Kolkata", "Pune", "Ahmedabad", "Jaipur", "Lucknow"];
    const setFallback = () => {
      setCity(fallbackCities[Math.floor(Math.random() * fallbackCities.length)]);
      setLocationLoading(false);
    };
    if (!navigator.geolocation) { setFallback(); return; }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`,
            { headers: { "Accept-Language": "en", "User-Agent": "VedicTatva/1.0 (https://vedictatva.com)" } }
          );
          if (res.ok) {
            const d = await res.json();
            const detected = d.address?.city || d.address?.town || d.address?.village || d.address?.state_district || d.address?.state;
            if (detected) setCity(detected); else setFallback();
          } else { setFallback(); }
        } catch { setFallback(); }
        setLocationLoading(false);
      },
      () => setFallback(),
      { timeout: 5000, maximumAge: 600000 }
    );
  }, []);

  const trendingProducts = useMemo(() => {
    if (!allProducts || allProducts.length === 0) return [];
    return [...allProducts].filter((p) => p.stock > 0).sort((a, b) => (b.salesCount ?? 0) - (a.salesCount ?? 0)).slice(0, 10);
  }, [allProducts]);

  const newArrivals = useMemo(() => {
    if (!allProducts || allProducts.length === 0) return [];
    return [...allProducts]
      .filter((p) => p.stock > 0)
      .sort((a, b) => b.id - a.id)
      .slice(0, 10);
  }, [allProducts]);

  const productsToShow =
    tab === "trending" ? trendingProducts :
    tab === "new" ? newArrivals :
    featuredProducts;

  return (
    <section className="py-12 md:py-16 bg-[#FBF7EE] border-t border-[#D4AF37]/15" data-testid="section-tabbed-shop">
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-3">
            <span className="h-px w-10 md:w-14 bg-[#D4AF37]" />
            <span className="text-[#6D2B35] text-[10px] md:text-xs uppercase tracking-[0.32em] font-semibold">{sectionTag}</span>
            <span className="h-px w-10 md:w-14 bg-[#D4AF37]" />
          </div>
          <h2 className="font-serif text-xl md:text-3xl lg:text-4xl text-[#6D2B35] leading-[1.1] tracking-tight mb-4" data-testid="text-tabbed-shop-heading">
            Puja essentials, <span className="saffron-shimmer italic font-semibold">picked for you</span>
          </h2>

          <div
            className="inline-flex items-center bg-white rounded-md border border-[#D4AF37]/25 p-1 gap-1 flex-wrap"
            role="tablist"
            aria-label="Browse products by collection"
          >
            <button
              onClick={() => setTab("popular")}
              role="tab"
              aria-selected={tab === "popular"}
              aria-controls="tabbed-shop-panel"
              id="tabbed-shop-tab-popular"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-semibold transition-colors ${tab === "popular" ? "bg-[#6D2B35] text-white" : "text-[#5a4a3a] hover:text-[#6D2B35]"}`}
              data-testid="tab-popular"
            >
              <Sparkles className="h-3 w-3" />
              Popular
            </button>
            <button
              onClick={() => setTab("trending")}
              role="tab"
              aria-selected={tab === "trending"}
              aria-controls="tabbed-shop-panel"
              id="tabbed-shop-tab-trending"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-semibold transition-colors ${tab === "trending" ? "bg-[#6D2B35] text-white" : "text-[#5a4a3a] hover:text-[#6D2B35]"}`}
              data-testid="tab-trending"
            >
              <TrendingUp className="h-3 w-3" />
              Trending Near You{locationLoading ? "" : ` · ${city}`}
            </button>
            <button
              onClick={() => setTab("new")}
              role="tab"
              aria-selected={tab === "new"}
              aria-controls="tabbed-shop-panel"
              id="tabbed-shop-tab-new"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-semibold transition-colors ${tab === "new" ? "bg-[#6D2B35] text-white" : "text-[#5a4a3a] hover:text-[#6D2B35]"}`}
              data-testid="tab-new-arrivals"
            >
              <Star className="h-3 w-3" />
              New Arrivals
            </button>
          </div>
        </motion.div>

        {!isLoading && productsToShow.length === 0 && (
          <div className="text-center py-10" data-testid="text-tabbed-shop-empty">
            <p className="text-sm text-[#5a4a3a]/70">
              No products to show right now. <Link href="/shop"><span className="text-[#6D2B35] font-semibold underline">Browse the full shop →</span></Link>
            </p>
          </div>
        )}
        <div
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4"
          role="tabpanel"
          aria-live="polite"
          id="tabbed-shop-panel"
          aria-labelledby={`tabbed-shop-tab-${tab}`}
        >
          {isLoading ? Array(10).fill(0).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-square rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          )) : productsToShow.map((product, idx) => {
            const hasMrp = !!product.mrp && product.mrp > product.price;
            const savingsPct = hasMrp ? Math.round(((product.mrp! - product.price) / product.mrp!) * 100) : 0;
            const rating = getDisplayRating(product.id, ratingsAgg?.[product.id] ?? null);
            const primaryAlt = (product.imageAlts && product.imageAlts[0]) || `${product.name} – ${product.category} | Vedic Tatva`;
            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.04, duration: 0.4 }}
                className="group"
              >
                <div className="bg-white rounded-lg overflow-hidden border border-[#D4AF37]/15 hover:border-[#D4AF37]/45 transition-colors flex flex-col h-full" data-testid={`card-tabbed-product-${product.id}`}>
                  <Link href={getProductUrl(product.id, product.name)} className="block">
                    <div className="aspect-square bg-[#F7F2E7] overflow-hidden relative p-3">
                      <img src={optImg(product.image, 480)} srcSet={optImgSrcSet(product.image, [320, 480, 768, 1080])} sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw" alt={primaryAlt} loading={idx < 2 ? "eager" : "lazy"} decoding="async" fetchPriority={idx < 2 ? "high" : "low"} width={480} height={480} className="w-full h-full object-contain group-hover:scale-[1.04] transition-transform duration-500" />
                      {tab === "trending" && (
                        <span className="absolute top-2 left-2 inline-flex items-center gap-1 bg-white/95 backdrop-blur rounded-md px-1.5 py-0.5 border border-emerald-100">
                          <TrendingUp className="h-2.5 w-2.5 text-emerald-600" />
                          <span className="text-[9px] font-semibold text-emerald-700 uppercase tracking-wider">Trending</span>
                        </span>
                      )}
                      {tab === "new" && (
                        <span className="absolute top-2 left-2 inline-flex items-center gap-1 bg-white/95 backdrop-blur rounded-md px-1.5 py-0.5 border border-[#D4AF37]/30">
                          <Star className="h-2.5 w-2.5 text-[#D4AF37]" />
                          <span className="text-[9px] font-semibold text-[#6D2B35] uppercase tracking-wider">New</span>
                        </span>
                      )}
                      {tab === "popular" && product.badge && (
                        <span className="absolute top-2 left-2 bg-white/90 backdrop-blur text-[#6D2B35] text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-md border border-[#D4AF37]/20">
                          {product.badge}
                        </span>
                      )}
                    </div>
                  </Link>
                  <div className="p-3 flex-1 flex flex-col">
                    <Link href={getProductUrl(product.id, product.name)}>
                      <h3 className="font-serif text-[13px] text-[#6D2B35] font-semibold leading-snug mb-1 line-clamp-2 group-hover:text-[#D4AF37] transition-colors min-h-[2.4em]">
                        {product.name}
                      </h3>
                    </Link>
                    <div className="inline-flex items-center gap-1 mb-1.5">
                      <Star className="h-3 w-3 fill-[#D4AF37] text-[#D4AF37]" aria-hidden="true" />
                      <span className="text-[11px] font-semibold text-[#5a4a3a]">{rating.avg.toFixed(1)}</span>
                      <span className="text-[10px] text-[#5a4a3a]/55">({rating.count.toLocaleString("en-IN")})</span>
                    </div>
                    <div className="flex items-baseline gap-1.5 mb-2 flex-wrap">
                      <span className="font-bold text-[15px] text-[#5a4a3a]">₹{product.price.toLocaleString("en-IN")}</span>
                      {hasMrp && (
                        <>
                          <span className="text-[11px] text-[#5a4a3a]/45 line-through">₹{product.mrp!.toLocaleString("en-IN")}</span>
                          <span className="text-[10px] font-semibold text-emerald-700">{savingsPct}% off</span>
                        </>
                      )}
                    </div>
                    <Button
                      size="sm"
                      className="mt-auto w-full rounded-md bg-[#6D2B35] hover:bg-[#5a2430] text-white text-[12px] h-8 font-semibold"
                      data-testid={`btn-add-tabbed-${product.id}`}
                      onClick={() => { addToCart(product); toast({ title: "Added to cart", description: `${product.name} has been added to your cart.` }); }}
                    >
                      <ShoppingBag className="h-3 w-3 mr-1" />
                      {addToCartLabel}
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="text-center mt-8">
          <Link href="/spiritual-essentials">
            <Button variant="outline" className="rounded-md px-6 h-9 border-[#6D2B35]/25 text-[#6D2B35] hover:bg-[#6D2B35] hover:text-white text-[13px] font-semibold" data-testid="link-tabbed-view-all">
              {viewAllLabel} <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

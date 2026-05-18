import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { ShoppingCart, Search, User, Menu, X, ChevronRight, Sunrise, Sunset, Moon, Star, Calendar, LogIn, UserPlus, LogOut, Sparkles, MapPin, BookOpen, Wand2, ArrowRight, Package, Users, Globe, ShoppingBag, Flame, Heart, History, Crown, TicketCheck, Shield, UserCircle, LayoutDashboard, Truck } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { useQuery } from "@tanstack/react-query";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { useI18n, languages, type Language } from "@/lib/i18n";
import CurrencySelector from "@/components/CurrencySelector";
import { getProductUrl } from "@/lib/utils";
import type { Product } from "@shared/schema";
import { MotifSVG, useFestivalTheme } from "@/components/festival/FestivalDecor";
import { useSiteSettings } from "@/lib/site-settings";

const promoMessages = [
  "Free Shipping on Prepaid Orders Above ₹499",
  "Use Code VEDIC10 — Flat 10% Off on First Order",
  "Energized Rudraksha Collection — Lab Certified & Authentic",
  "Book a Pandit Online — Verified Vedic Scholars in 50+ Cities",
  "Prepaid Orders Get Extra 5% Discount — Save More Today",
  "New Arrivals: Premium Brass Puja Thalis & Handcrafted Idols",
  "Free Kundli Report with Every Astrology Consultation",
];

function PromoBar() {
  const festival = useFestivalTheme();
  const { data: panchang } = useQuery({
    queryKey: ["/api/today-panchang"],
    queryFn: async () => {
      const res = await fetch("/api/today-panchang");
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 30 * 60 * 1000,
    retry: 1,
  });

  type TickerItem = { icon: typeof Sunrise; text: string };
  const panchangMessages: TickerItem[] = panchang ? [
    { icon: Sunrise, text: `Sunrise ${panchang.sunrise} · Sunset ${panchang.sunset}` },
    { icon: Calendar, text: `${panchang.tithi} · ${panchang.nakshatra}` },
    { icon: Sparkles, text: `${panchang.dayOfWeek} · ${panchang.month} · विक्रम संवत ${panchang.samvat}` },
    ...(panchang.special ? [{ icon: Sparkles, text: panchang.special as string }] : []),
    { icon: Moon, text: `राहुकाल: ${panchang.rahu_kaal}` },
  ] : [];

  const allMessages: TickerItem[] = [
    ...panchangMessages,
    ...promoMessages.map((text) => ({ icon: Star, text })),
  ];

  // On mobile show only Tithi and Rahukal to reduce cognitive load; desktop gets everything.
  const mobileMessages: TickerItem[] = [
    ...(panchang ? [
      { icon: Calendar, text: `${panchang.tithi} · ${panchang.nakshatra}` },
      { icon: Moon, text: `राहुकाल: ${panchang.rahu_kaal}` },
    ] : []),
    ...promoMessages.map((text) => ({ icon: Star, text })),
  ];

  const duplicated = [...allMessages, ...allMessages];
  const duplicatedMobile = [...mobileMessages, ...mobileMessages];

  const fest = festival;
  const bg = fest
    ? `linear-gradient(135deg, ${fest.palette.from} 0%, ${fest.palette.via} 50%, ${fest.palette.to} 100%)`
    : "linear-gradient(135deg, #4a1a22 0%, #6D2B35 30%, #8B3A47 50%, #6D2B35 70%, #4a1a22 100%)";
  const edge = fest ? fest.palette.from : "#4a1a22";
  const accent = fest ? fest.palette.accent : "#D4AF37";

  return (
    <div className="w-full overflow-hidden relative" data-testid="promo-bar"
      style={{ background: bg }}
    >
      <div className="absolute left-0 top-0 bottom-0 w-12 z-10" style={{ background: `linear-gradient(to right, ${edge}, transparent)` }} />
      <div className="absolute right-0 top-0 bottom-0 w-12 z-10" style={{ background: `linear-gradient(to left, ${edge}, transparent)` }} />
      <div className="relative flex items-center py-2">
        {/* Mobile: Tithi + Rahukal + promos only */}
        <div className="flex sm:hidden w-max flex-shrink-0 motion-safe:animate-marquee motion-reduce:flex-wrap motion-reduce:justify-center motion-reduce:w-auto whitespace-nowrap motion-reduce:whitespace-normal">
          {duplicatedMobile.map((msg, i) => {
            const Icon = msg.icon;
            return (
              <span key={i} className="inline-flex items-center mx-5 text-[12px] tracking-wide text-white/85 font-medium">
                <Icon className="mr-1.5 h-3 w-3" style={{ color: accent }} />
                {msg.text}
              </span>
            );
          })}
        </div>
        {/* Desktop: full panchang strip */}
        <div className="hidden sm:flex w-max flex-shrink-0 motion-safe:animate-marquee motion-reduce:flex-wrap motion-reduce:justify-center motion-reduce:w-auto whitespace-nowrap motion-reduce:whitespace-normal">
          {duplicated.map((msg, i) => {
            const Icon = msg.icon;
            return (
              <span key={i} className="inline-flex items-center mx-6 text-[13px] tracking-wide text-white/85 font-medium">
                <Icon className="mr-2 h-3.5 w-3.5" style={{ color: accent }} />
                {msg.text}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const quickSuggestions = [
  { label: "Rudraksha Mala", icon: Package },
  { label: "Book Pandit for Puja", icon: Users },
  { label: "Kundli Report", icon: Star },
  { label: "Ganesh Idol", icon: Sparkles },
  { label: "Havan Samagri", icon: Flame },
  { label: "Muhurat for Wedding", icon: Heart },
];

interface SearchResult {
  type: "product" | "pandit" | "astrologer" | "page";
  item: any;
  score: number;
}

interface SearchResponse {
  results: SearchResult[];
  intent: string | null;
  aiSuggestion: { suggestion: string; redirect: string; relatedTerms: string[] } | null;
  totalProducts: number;
  totalPandits: number;
  totalAstrologers: number;
  totalPages: number;
}

const typeIcons: Record<string, any> = {
  product: Package,
  pandit: Users,
  astrologer: Star,
  page: ArrowRight,
};

const typeLabels: Record<string, string> = {
  product: "Product",
  pandit: "Pandit",
  astrologer: "Astrologer",
  page: "Service",
};

const typeColors: Record<string, string> = {
  product: "bg-amber-100 text-amber-700",
  pandit: "bg-rose-100 text-rose-700",
  astrologer: "bg-purple-100 text-purple-700",
  page: "bg-blue-100 text-blue-700",
};

function getResultPath(result: SearchResult): string {
  switch (result.type) {
    case "product": return getProductUrl(result.item.id, result.item.name);
    case "pandit": return `/pandit/${result.item.id}`;
    case "astrologer": return `/astrologer/${result.item.id}`;
    case "page": return result.item.path;
    default: return "/";
  }
}

function getResultName(result: SearchResult): string {
  return result.item.name || result.item.title || "";
}

function getResultSubtext(result: SearchResult): string {
  switch (result.type) {
    case "product": return `${result.item.category} · ₹${result.item.price?.toLocaleString()}`;
    case "pandit": return `${result.item.specialization} · ${result.item.city}`;
    case "astrologer": return `${result.item.specialization} · ${result.item.city}`;
    case "page": return result.item.description || "";
    default: return "";
  }
}

function getResultImage(result: SearchResult): string | null {
  if (result.type === "product" || result.type === "pandit" || result.type === "astrologer") {
    return result.item.image || null;
  }
  return null;
}

export default function Navbar() {
  const [location, setLocation] = useLocation();
  const { totalItems } = useCart();
  const { user, logout, openAuth } = useAuth();
  const { t, language, setLanguage } = useI18n();
  // Switch the i18n locale AND navigate between EN <-> /hi twin URLs so the
  // browser URL and locale state stay consistent (required for proper hreflang
  // pairing). Uses a hard navigation to remount the LocaleScope wrapper.
  const switchLanguageWithUrl = (code: Language) => {
    setLanguage(code);
    if (typeof window === "undefined") return;
    const { pathname, search, hash } = window.location;
    const stripped = pathname.replace(/^\/hi(?=\/|$)/, "") || "/";
    const target = code === "hi"
      ? (stripped === "/" ? "/hi" : `/hi${stripped}`)
      : stripped;
    if (target !== pathname) {
      window.location.assign(`${target}${search}${hash}`);
    }
  };
  const settings = useSiteSettings();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const DELIVERY_CITIES = ["Mumbai", "Delhi", "Bengaluru", "Hyderabad", "Chennai", "Kolkata", "Pune", "Ahmedabad", "Jaipur", "Lucknow", "Varanasi", "Gaya", "Haridwar", "Other"];
  const [deliveryCity, setDeliveryCity] = useState<string>(() => {
    if (typeof window === "undefined") return "Mumbai";
    return localStorage.getItem("vt_city") || "Mumbai";
  });
  const handleCityChange = (next: string) => {
    setDeliveryCity(next);
    try {
      localStorage.setItem("vt_city", next);
      window.dispatchEvent(new CustomEvent("vt:cityChanged", { detail: next }));
    } catch {}
  };
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const { data: searchData, isFetching: searchLoading } = useQuery<SearchResponse>({
    queryKey: ["/api/search", debouncedQuery],
    queryFn: async () => {
      import("@/lib/spiritual-tracker").then(({ trackSearchQuery }) => {
        trackSearchQuery(debouncedQuery);
      });
      return fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`).then(r => r.json());
    },
    enabled: debouncedQuery.length >= 2,
    staleTime: 30000,
  });

  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  useEffect(() => {
    if (!searchOpen) return;
    import("@/lib/spiritual-tracker").then(({ getRecentSearches }) => {
      setRecentSearches(getRecentSearches(6));
    });
  }, [searchOpen]);

  const { data: trendingSearches = [] } = useQuery<{ query: string; hits: number }[]>({
    queryKey: ["/api/search/popular"],
    queryFn: () => fetch("/api/search/popular").then((r) => r.json()),
    enabled: searchOpen,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const results = searchData?.results || [];
  const aiSuggestion = searchData?.aiSuggestion;

  const handleResultClick = useCallback((result: SearchResult) => {
    setSearchQuery("");
    setDebouncedQuery("");
    setSearchOpen(false);
    setLocation(getResultPath(result));
  }, [setLocation]);

  const handleSearchKeyDown = useCallback((e: React.KeyboardEvent) => {
    const totalItems = results.length + (aiSuggestion ? 1 : 0);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex(prev => Math.min(prev + 1, totalItems - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex(prev => Math.max(prev - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < results.length) {
        handleResultClick(results[highlightedIndex]);
      } else if (highlightedIndex === results.length && aiSuggestion?.redirect) {
        setSearchQuery("");
        setSearchOpen(false);
        setLocation(aiSuggestion.redirect);
      } else if (searchQuery.trim()) {
        setSearchOpen(false);
        setLocation(`/puja-samagri-online?search=${encodeURIComponent(searchQuery.trim())}`);
      }
    } else if (e.key === "Escape") {
      setSearchOpen(false);
      setSearchQuery("");
    }
  }, [highlightedIndex, results, aiSuggestion, handleResultClick, searchQuery, setLocation]);

  useEffect(() => {
    setHighlightedIndex(-1);
  }, [debouncedQuery]);

  useEffect(() => {
    if (!searchOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setSearchQuery("");
        setDebouncedQuery("");
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [searchOpen]);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  const links = [
    { href: "/online-pandit-booking", label: t.nav.bookPandit, icon: Users },
    { href: "/online-puja-booking", label: t.nav.bookPuja, icon: Flame },
    { href: "/online-pind-daan", label: "Pind Daan", icon: Flame },
    { href: "/astrology", label: t.nav.astrology, icon: Sparkles },
    { href: "/daily-rashifal", label: t.nav.zodiac, icon: Star },
    { href: "/today-panchang", label: t.nav.panchang, icon: Calendar },
  ];

  const navSections: { title: string; items: { href: string; label: string; icon: any; comingSoon?: boolean }[] }[] = [
    {
      title: "Shop",
      items: [
        { href: "/puja-samagri-online", label: "Puja Essentials", icon: ShoppingBag },
        { href: "/category/home-essentials", label: "Home Essentials", icon: Package, comingSoon: true },
        { href: "/category/hair-skin-care", label: "Hair & Skin Care", icon: Sparkles, comingSoon: true },
        { href: "/category/grains-pulses", label: "Grains & Pulses", icon: Package, comingSoon: true },
        { href: "/category/dry-fruits", label: "Dry Fruits", icon: Package, comingSoon: true },
      ],
    },
    {
      title: "Puja & Pandit",
      items: [
        { href: "/online-pandit-booking", label: t.nav.bookPandit, icon: Users },
        { href: "/online-puja-booking", label: t.nav.bookPuja, icon: Flame },
        { href: "/virtual-puja", label: "Virtual Puja", icon: Sunrise },
        { href: "/online-pind-daan", label: "Pind Daan", icon: Flame },
      ],
    },
    {
      title: "Astrology",
      items: [
        { href: "/astrology", label: t.nav.astrology, icon: Sparkles },
        { href: "/ai-kundli", label: "AI Kundli", icon: Star },
        { href: "/ai-baby-names", label: "Baby Names", icon: Heart },
        { href: "/ai-palm-reading", label: "Palm Reading", icon: Wand2 },
        { href: "/daily-rashifal", label: t.nav.zodiac, icon: Star },
      ],
    },
    {
      title: "Calendar & Remedies",
      items: [
        { href: "/today-panchang", label: t.nav.panchang, icon: Calendar },
        { href: "/muhurat-finder", label: "Muhurat Finder", icon: Calendar },
        { href: "/vastu-compass", label: "Vastu Compass", icon: MapPin },
      ],
    },
    {
      title: "Wisdom",
      items: [
        { href: "/scripture-search", label: "Scripture Search", icon: BookOpen },
        { href: "/kathas", label: "Kathas", icon: BookOpen },
      ],
    },
    {
      title: "Yatra & Membership",
      items: [
        { href: "/tirth-yatra", label: "Free Tirth Yatra", icon: MapPin },
        { href: "/lucky-draw", label: "Lucky Draw — Win a Yatra", icon: TicketCheck },
        { href: "/pilgrimage-card", label: "Pilgrimage Card", icon: Crown },
      ],
    },
    {
      title: "Travel",
      items: [
        { href: "/temple-tourism", label: "Temple Tourism", icon: Globe },
        { href: "/route-planner", label: "Route Planner", icon: MapPin },
      ],
    },
    {
      title: "Community",
      items: [
        { href: "/matrimony", label: "Matrimony", icon: Heart },
        { href: "/membership", label: "Membership", icon: Crown },
        { href: "/donations", label: "Donations", icon: Heart },
      ],
    },
  ];

  type AcctLink = { href: string; label: string; icon: any; action?: "login" | "signup" };
  const accountLinks: AcctLink[] = user ? [
    { href: "/dashboard", label: "My Dashboard", icon: LayoutDashboard },
    { href: "/my-profile", label: t.nav.myProfile, icon: UserCircle },
    { href: "/spiritual-dashboard", label: t.nav.mySpiritualJourney, icon: LayoutDashboard },
    { href: "/my-bookings", label: "My Puja Bookings", icon: Calendar },
    { href: "/order-history", label: t.nav.orderHistory, icon: History },
    { href: "/track-order", label: "Track Order", icon: Truck },
    { href: "/wishlist", label: t.nav.wishlist, icon: Heart },
    { href: "/subscriptions", label: t.nav.subscriptions, icon: Crown },
    { href: "/return-ticket", label: t.nav.returns, icon: TicketCheck },
    { href: "/admin", label: t.nav.adminDashboard, icon: Shield },
  ] : [];

  const festival = useFestivalTheme();
  const festAccent = festival ? festival.palette.accent : "#D4AF37";
  const festSoft = festival ? festival.palette.accentSoft : "#f5d76e";
  const festEdge = festival ? festival.palette.from : "#4a1a22";

  return (
    <>
      <div className="sticky top-0 z-50">
      <PromoBar />

      <nav className={`w-full transition-all duration-300 ${
        scrolled
          ? "bg-[#faf7f2]/95 backdrop-blur-lg shadow-sm"
          : "bg-[#faf7f2]/90 backdrop-blur-md"
      }`}
        style={{
          borderBottom: festival ? `1px solid ${festAccent}33` : "1px solid rgba(109, 43, 53, 0.06)"
        }}
      >
        <div className="container mx-auto px-3 sm:px-4 h-12 md:h-14 flex items-center justify-between relative gap-2">
          <button
            onClick={() => { setMobileOpen(!mobileOpen); setSearchOpen(false); setAccountOpen(false); }}
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-md text-[#5a4a3a]/80 hover:text-[#6D2B35] hover:bg-[#F5F0E6]/70 transition-colors -ml-1"
            data-testid="btn-menu-mobile"
            aria-label="Open menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <Link href="/" className="flex items-center flex-shrink-0 gap-2 min-w-0" data-testid="link-home">
            {settings?.logoUrl ? (
              <img
                src={settings.logoUrl}
                alt={settings.siteName || "Vedic Tatva"}
                className="h-8 md:h-9 lg:h-10 w-auto object-contain"
                data-testid="img-site-logo"
              />
            ) : null}
            <span className="font-serif text-[20px] md:text-[22px] lg:text-[24px] font-bold tracking-tight leading-none"
              style={{
                background: "linear-gradient(135deg, #4a1a22 0%, #6D2B35 50%, #8B3A47 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
              data-testid="text-site-name"
            >
              {settings?.siteName || "Vedic Tatva"}
            </span>
            {festival && (
              <span
                className="hidden lg:inline-flex items-center gap-1 ml-2.5 px-1.5 py-0.5 rounded text-[9px] font-semibold tracking-wide whitespace-nowrap"
                style={{
                  background: `${festAccent}15`,
                  color: festival.palette.from,
                  border: `1px solid ${festAccent}40`,
                }}
                data-testid="badge-festival"
                title={`${festival.name} — ${festival.tagline}`}
              >
                <MotifSVG motif={festival.motif} color={festival.palette.from} size={9} />
                {festival.nameHi}
              </span>
            )}
          </Link>

          <div className="hidden md:flex items-center justify-center flex-1 min-w-0">
            <div className="flex items-center gap-0.5 lg:gap-1">
              {links.map((link) => {
                const isActive = location === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`relative text-[11.5px] lg:text-[12px] font-medium tracking-wide transition-colors duration-200 px-2 lg:px-3 py-2 whitespace-nowrap ${
                      isActive
                        ? "text-[#6D2B35]"
                        : "text-[#5a4a3a]/70 hover:text-[#6D2B35]"
                    }`}
                    data-testid={`link-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    {link.label}
                    {isActive && (
                      <span
                        className="absolute left-2 right-2 lg:left-3 lg:right-3 -bottom-px h-[2px] rounded-full"
                        style={{ background: "linear-gradient(90deg, #D4AF37, #6D2B35, #D4AF37)" }}
                      />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-0.5">
            {location !== "/" && (
              <button
                onClick={() => { setSearchOpen(!searchOpen); setAccountOpen(false); setMobileOpen(false); }}
                className="flex w-9 h-9 items-center justify-center rounded-md text-[#5a4a3a]/70 hover:text-[#6D2B35] hover:bg-[#F5F0E6]/70 transition-colors"
                data-testid="btn-search"
                title="Search"
                aria-label="Search"
              >
                <Search className="h-[17px] w-[17px]" />
              </button>
            )}

            <div className="relative hidden md:block">
              <button
                onClick={() => { setAccountOpen(!accountOpen); setSearchOpen(false); }}
                className="w-9 h-9 flex items-center justify-center rounded-md text-[#5a4a3a]/70 hover:text-[#6D2B35] hover:bg-[#F5F0E6]/70 transition-colors"
                data-testid="btn-account"
                title="Account"
              >
                <User className="h-[17px] w-[17px]" />
              </button>

              {accountOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setAccountOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-[#D4AF37]/15 overflow-hidden z-50" data-testid="account-dropdown">
                    <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #D4AF37, #f5d76e, #D4AF37)" }} />
                    {user && (
                      <div className="px-4 py-3 bg-gradient-to-r from-[#faf7f2] to-[#F5F0E6] border-b border-[#D4AF37]/10">
                        <p className="text-sm font-serif font-bold text-[#6D2B35] truncate">{user.name}</p>
                        <p className="text-[10px] text-[#5a4a3a]/50 truncate">{user.email}</p>
                      </div>
                    )}
                    <div className="py-1.5">
                      {accountLinks.map((link) => {
                        const AccIcon = link.icon;
                        const testId = `account-link-${link.label.toLowerCase().replace(/\s+/g, "-")}`;
                        const inner = (
                          <>
                            <span className="flex items-center gap-2.5">
                              <AccIcon className="h-4 w-4 text-[#6D2B35]/40" />
                              {link.label}
                            </span>
                            <ChevronRight className="h-3.5 w-3.5 opacity-30" />
                          </>
                        );
                        const cls = "w-full flex items-center justify-between px-4 py-2.5 text-sm text-[#5a4a3a]/80 hover:text-[#6D2B35] hover:bg-[#F5F0E6]/60 transition-all duration-200 min-h-[44px]";
                        if (link.action) {
                          return (
                            <button
                              key={link.href}
                              type="button"
                              onClick={() => { setAccountOpen(false); openAuth(link.action); }}
                              className={cls}
                              data-testid={testId}
                            >
                              {inner}
                            </button>
                          );
                        }
                        return (
                          <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => setAccountOpen(false)}
                            className={cls}
                            data-testid={testId}
                          >
                            {inner}
                          </Link>
                        );
                      })}
                    </div>
                    {/* Language sub-section (nested under account) */}
                    {(() => {
                      const currentLang = languages.find((l) => l.code === language) || languages[0];
                      return (
                        <div className="border-t border-[#D4AF37]/10">
                          <button
                            type="button"
                            onClick={() => setLangOpen(!langOpen)}
                            className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-[#5a4a3a]/80 hover:text-[#6D2B35] hover:bg-[#F5F0E6]/60 transition-all duration-200 min-h-[44px]"
                            data-testid="btn-account-language"
                            aria-expanded={langOpen}
                          >
                            <span className="flex items-center gap-2.5 min-w-0">
                              <Globe className="h-4 w-4 text-[#6D2B35]/40 shrink-0" />
                              <span>Language</span>
                              <span className="text-[10px] text-[#5a4a3a]/50 truncate">· {currentLang.flag} {currentLang.nativeLabel}</span>
                            </span>
                            <ChevronRight className={`h-3.5 w-3.5 opacity-30 transition-transform shrink-0 ${langOpen ? "rotate-90" : ""}`} />
                          </button>
                          {langOpen && (
                            <div className="bg-[#FBF7EE]/60 border-t border-[#D4AF37]/10 max-h-56 overflow-y-auto" data-testid="account-language-list">
                              {languages.map((lang) => (
                                <button
                                  key={lang.code}
                                  type="button"
                                  onClick={() => { switchLanguageWithUrl(lang.code); setLangOpen(false); setAccountOpen(false); }}
                                  className={`w-full flex items-center gap-3 pl-10 pr-4 py-2 text-xs transition-colors ${
                                    language === lang.code
                                      ? "text-[#6D2B35] bg-[#F5F0E6] font-semibold"
                                      : "text-[#5a4a3a]/80 hover:text-[#6D2B35] hover:bg-[#F5F0E6]/60"
                                  }`}
                                  data-testid={`lang-${lang.code}`}
                                >
                                  <span className="text-base">{lang.flag}</span>
                                  <span>{lang.nativeLabel}</span>
                                  {language === lang.code && <span className="ml-auto text-[#D4AF37]">✦</span>}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {user && (
                      <div className="border-t border-[#D4AF37]/10">
                        <button
                          onClick={() => { logout(); setAccountOpen(false); setLangOpen(false); setLocation("/"); }}
                          className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-red-600/70 hover:text-red-600 hover:bg-red-50/40 transition-colors"
                          data-testid="btn-logout"
                        >
                          {t.nav.logout}
                          <LogOut className="h-3.5 w-3.5 opacity-40" />
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="hidden md:block">
              <CurrencySelector compact />
            </div>

            <Link href="/cart">
              <button
                className="w-9 h-9 flex items-center justify-center rounded-md text-[#5a4a3a]/70 hover:text-[#6D2B35] hover:bg-[#F5F0E6]/70 transition-colors relative"
                data-testid="btn-cart"
                title="Cart"
              >
                <ShoppingCart className="h-[17px] w-[17px]" />
                {totalItems > 0 && (
                  <span
                    className="absolute -top-0.5 -right-0.5 text-white text-[9px] font-bold min-w-[15px] h-[15px] rounded-full flex items-center justify-center px-1"
                    style={{ background: "linear-gradient(135deg, #6D2B35, #8B3A47)" }}
                    data-testid="badge-cart-count"
                  >
                    {totalItems}
                  </span>
                )}
              </button>
            </Link>

          </div>
        </div>

        {searchOpen && (
          <div className="border-t border-[#D4AF37]/10 bg-gradient-to-b from-[#faf7f2] to-white">
            <div className="container mx-auto px-4 py-3">
              <div className="relative max-w-full sm:max-w-2xl mx-auto" ref={dropdownRef}>
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#D4AF37]/60 z-10" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Ask anything... e.g. 'brass ganesh idol' or 'I need a pandit for griha pravesh'"
                  className="w-full pl-10 pr-12 py-2.5 sm:py-3 bg-white rounded-2xl text-sm text-[#5a4a3a] placeholder:text-[#5a4a3a]/40 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40 border border-[#D4AF37]/20 shadow-sm"
                  autoFocus
                  autoComplete="off"
                  data-testid="input-search"
                />
                {searchLoading && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Sparkles className="h-4 w-4 text-[#D4AF37] animate-pulse" />
                  </div>
                )}

                {debouncedQuery.length < 2 && !searchLoading && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-[#D4AF37]/15 overflow-hidden z-50 p-4 space-y-4" data-testid="search-quick-suggestions">
                    {recentSearches.length > 0 && (
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-[#5a4a3a]/60 font-bold mb-2">Recent searches</p>
                        <div className="flex flex-wrap gap-2">
                          {recentSearches.map((q, i) => (
                            <button
                              key={`recent-${i}`}
                              onClick={() => { setSearchQuery(q); setDebouncedQuery(q); }}
                              className="px-3 py-1.5 bg-white hover-elevate rounded-full text-xs text-[#5a4a3a] border border-[#D4AF37]/15"
                              data-testid={`recent-search-${i}`}
                            >
                              {q}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-[#D4AF37]/80 font-bold mb-2">Trending now</p>
                      <div className="flex flex-wrap gap-2">
                        {(trendingSearches.length > 0
                          ? trendingSearches.slice(0, 8).map((t) => t.query)
                          : quickSuggestions.map((s) => s.label)
                        ).map((label, i) => (
                          <button
                            key={`trend-${i}`}
                            onClick={() => { setSearchQuery(label); setDebouncedQuery(label); }}
                            className="px-3 py-1.5 bg-[#F5F0E6]/60 hover-elevate rounded-full text-xs text-[#5a4a3a]/80 border border-[#D4AF37]/10"
                            data-testid={`trending-search-${i}`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#D4AF37]/10">
                      <p className="text-[10px] text-[#5a4a3a]/40 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-[#D4AF37]" />
                        Try natural language: "I want to do a satyanarayan puja at home" or "best rudraksha for career growth"
                      </p>
                    </div>
                  </div>
                )}

                {debouncedQuery.length >= 2 && !searchLoading && results.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-[#D4AF37]/15 overflow-hidden z-50 max-h-[70vh] overflow-y-auto" data-testid="search-results">
                    {searchData?.intent && (
                      <div className="px-4 py-2 bg-gradient-to-r from-[#faf7f2] to-[#F5F0E6] border-b border-[#D4AF37]/10">
                        <p className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-bold flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> AI detected: {searchData.intent.replace(/_/g, " ")}
                        </p>
                      </div>
                    )}

                    {results.map((result, i) => {
                      const Icon = typeIcons[result.type] || ArrowRight;
                      const img = getResultImage(result);
                      return (
                        <button
                          key={`${result.type}-${result.item.id || result.item.path}-${i}`}
                          onClick={() => handleResultClick(result)}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-200 border-b border-[#6D2B35]/3 last:border-0 ${
                            i === highlightedIndex
                              ? "bg-[#F5F0E6] text-[#6D2B35]"
                              : "hover:bg-[#F5F0E6]/50 text-[#5a4a3a]"
                          }`}
                          data-testid={`search-result-${result.type}-${i}`}
                        >
                          {img ? (
                            <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#F5F0E6] flex-shrink-0 border border-[#D4AF37]/10">
                              <img src={img} alt="" className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-[#F5F0E6] flex items-center justify-center flex-shrink-0 border border-[#D4AF37]/10">
                              <Icon className="w-4 h-4 text-[#6D2B35]/60" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{getResultName(result)}</p>
                            <p className="text-[11px] text-[#5a4a3a]/50 truncate">{getResultSubtext(result)}</p>
                          </div>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${typeColors[result.type]}`}>
                            {typeLabels[result.type]}
                          </span>
                        </button>
                      );
                    })}

                    {aiSuggestion && (
                      <button
                        onClick={() => {
                          setSearchQuery("");
                          setSearchOpen(false);
                          if (aiSuggestion.redirect) setLocation(aiSuggestion.redirect);
                        }}
                        className={`w-full px-4 py-3 text-left transition-colors border-t border-[#D4AF37]/20 bg-gradient-to-r from-[#faf7f2] to-[#f5efe3] ${
                          highlightedIndex === results.length ? "ring-2 ring-[#D4AF37]/30" : ""
                        }`}
                        data-testid="search-ai-suggestion"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#f5d76e] flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Wand2 className="w-3.5 h-3.5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-[#6D2B35] mb-0.5">AI Suggestion</p>
                            <p className="text-xs text-[#5a4a3a]/70 leading-relaxed">{aiSuggestion.suggestion}</p>
                            {aiSuggestion.relatedTerms?.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {aiSuggestion.relatedTerms.map((t: string, j: number) => (
                                  <span key={j} className="text-[9px] bg-white border border-[#D4AF37]/20 px-1.5 py-0.5 rounded-full text-[#5a4a3a]/60">{t}</span>
                                ))}
                              </div>
                            )}
                          </div>
                          <ArrowRight className="w-4 h-4 text-[#D4AF37] flex-shrink-0 mt-1" />
                        </div>
                      </button>
                    )}

                    <div className="px-4 py-2.5 bg-gradient-to-r from-[#faf7f2] to-[#F5F0E6] border-t border-[#D4AF37]/10 flex items-center justify-between">
                      <p className="text-[10px] text-[#5a4a3a]/40">
                        {searchData?.totalProducts || 0} products · {searchData?.totalPandits || 0} pandits · {searchData?.totalAstrologers || 0} astrologers · {searchData?.totalPages || 0} services
                      </p>
                      <button
                        onClick={() => {
                          setSearchOpen(false);
                          setLocation(`/puja-samagri-online?search=${encodeURIComponent(searchQuery)}`);
                        }}
                        className="text-[10px] font-bold text-[#6D2B35] hover:text-[#D4AF37] transition-colors flex items-center gap-1"
                        data-testid="btn-view-all-results"
                      >
                        View all <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}

                {debouncedQuery.length >= 2 && !searchLoading && results.length === 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-[#D4AF37]/15 overflow-hidden z-50">
                    {aiSuggestion ? (
                      <div className="p-4">
                        <button
                          onClick={() => {
                            setSearchQuery("");
                            setSearchOpen(false);
                            if (aiSuggestion.redirect) setLocation(aiSuggestion.redirect);
                          }}
                          className="w-full text-left"
                          data-testid="search-ai-suggestion-empty"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#f5d76e] flex items-center justify-center flex-shrink-0">
                              <Wand2 className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-[#6D2B35] mb-1">AI Suggestion</p>
                              <p className="text-sm text-[#5a4a3a]/70 leading-relaxed">{aiSuggestion.suggestion}</p>
                              {aiSuggestion.relatedTerms?.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                  {aiSuggestion.relatedTerms.map((t: string, j: number) => (
                                    <span key={j} className="text-[10px] bg-[#F5F0E6] border border-[#D4AF37]/20 px-2 py-0.5 rounded-full text-[#5a4a3a]/60">{t}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                            <ArrowRight className="w-4 h-4 text-[#D4AF37] flex-shrink-0 mt-1" />
                          </div>
                        </button>
                      </div>
                    ) : (
                      <div className="px-4 py-6 text-center">
                        <Sparkles className="w-8 h-8 text-[#D4AF37]/40 mx-auto mb-2" />
                        <p className="text-sm text-[#5a4a3a]/70 mb-1">No results found for "{searchQuery}"</p>
                        <p className="text-xs text-[#5a4a3a]/40">Try different keywords or browse our categories</p>
                        <div className="flex flex-wrap justify-center gap-2 mt-3">
                          {quickSuggestions.slice(0, 4).map((s, i) => {
                            const Icon = s.icon;
                            return (
                            <button
                              key={i}
                              onClick={() => { setSearchQuery(s.label); setDebouncedQuery(s.label); }}
                              className="inline-flex items-center gap-1.5 text-xs px-3 py-1 bg-[#F5F0E6] rounded-full text-[#5a4a3a]/70 hover:text-[#6D2B35] transition-colors"
                              data-testid={`no-result-suggestion-${i}`}
                            >
                              <Icon className="h-3 w-3" /> {s.label}
                            </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
      </div>

      {mobileOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-[2px] z-40 md:hidden" onClick={() => setMobileOpen(false)} />
          <div className="fixed top-[72px] left-0 bottom-[80px] w-[284px] max-w-[88%] z-50 md:hidden" data-testid="mobile-menu">
            <div className="bg-white border-r border-y border-[#D4AF37]/25 h-full flex flex-col w-full overflow-hidden shadow-[6px_0_24px_-12px_rgba(109,43,53,0.25)]">

              {/* Branded header */}
              <div
                className="relative shrink-0 px-4 pt-3 pb-3.5 text-white"
                style={{ background: "linear-gradient(135deg, #4a1a22 0%, #6D2B35 55%, #8B3A47 100%)" }}
              >
                <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-70" aria-hidden="true" />
                <div className="flex items-center">
                  <p className="font-serif text-[16px] font-bold leading-none tracking-tight text-white truncate" data-testid="text-mobile-brand">
                    {settings?.siteName || "Vedic Tatva"}
                  </p>
                </div>

                {/* Inline city switcher */}
                <label className="mt-3 flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/25 rounded-md pl-2.5 pr-1.5 h-8 transition-colors cursor-pointer">
                  <MapPin className="h-3.5 w-3.5 text-[#D4AF37] shrink-0" strokeWidth={2.2} />
                  <span className="text-[9px] uppercase tracking-[0.18em] text-white/75 leading-none font-semibold">Deliver to</span>
                  <select
                    value={deliveryCity}
                    onChange={(e) => handleCityChange(e.target.value)}
                    className="ml-auto bg-transparent text-[12px] font-semibold text-white outline-none cursor-pointer pr-0.5 appearance-none"
                    data-testid="select-mobile-city"
                    aria-label="Select your delivery city"
                  >
                    {DELIVERY_CITIES.map(c => (
                      <option key={c} value={c} className="text-[#5a4a3a] bg-white">{c}</option>
                    ))}
                  </select>
                  <ChevronRight className="h-3 w-3 text-[#D4AF37] rotate-90 shrink-0" strokeWidth={2.2} aria-hidden="true" />
                </label>
              </div>

              {/* Scrollable body */}
              <div className="flex-1 overflow-y-auto overscroll-contain bg-white">
                {user && (
                  <div className="mx-3 mt-3 mb-1 p-2.5 rounded-md border border-[#D4AF37]/30 bg-gradient-to-br from-[#FBF7EE] to-white">
                    <div className="flex items-center gap-2.5">
                      <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#6D2B35] to-[#8B3A47] text-[#D4AF37] flex items-center justify-center font-serif font-bold text-sm shrink-0 shadow-sm">
                        {(user.name || "U").trim().charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[12px] font-serif font-semibold text-[#6D2B35] leading-tight truncate" data-testid="text-mobile-user-name">{user.name}</p>
                        <p className="text-[10px] text-[#5a4a3a]/60 leading-tight truncate mt-0.5">{user.email}</p>
                      </div>
                    </div>
                  </div>
                )}

                {navSections.map((section) => (
                  <div key={section.title} className="mb-1">
                    <div className="px-3 pt-3 pb-1 flex items-center gap-2">
                      <span className="h-px w-3 bg-[#D4AF37]" />
                      <p className="text-[9px] uppercase tracking-[0.3em] text-[#D4AF37] font-semibold whitespace-nowrap">{section.title}</p>
                      <span className="h-px flex-1 bg-[#D4AF37]/20" />
                    </div>
                    <div className="px-1.5 pt-0.5">
                      {section.items.map((link) => {
                        const isActive = location === link.href;
                        const LinkIcon = link.icon;
                        const testId = `mobile-link-${link.label.toLowerCase().replace(/\s+/g, "-")}`;

                        if (link.comingSoon) {
                          return (
                            <div
                              key={link.href}
                              aria-disabled="true"
                              className="relative flex items-center justify-between gap-3 pl-4 pr-2 h-9 rounded-md text-[13px] font-semibold whitespace-nowrap text-[#5a4a3a]/55 cursor-not-allowed select-none"
                              data-testid={testId}
                            >
                              <span className="flex items-center gap-2.5 min-w-0">
                                <LinkIcon className="h-3.5 w-3.5 shrink-0 text-[#6D2B35]/35" strokeWidth={1.8} />
                                <span className="truncate">{link.label}</span>
                              </span>
                              <span className="shrink-0 text-[9px] uppercase tracking-[0.15em] font-semibold text-[#D4AF37] bg-[#FBF7EE] border border-[#D4AF37]/30 rounded px-1.5 py-0.5 leading-none">
                                Soon
                              </span>
                            </div>
                          );
                        }

                        return (
                          <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => setMobileOpen(false)}
                            className={`relative flex items-center justify-between gap-3 pl-4 pr-2 h-9 rounded-md text-[13px] font-semibold transition-colors whitespace-nowrap ${
                              isActive
                                ? "bg-[#FBF7EE] text-[#6D2B35]"
                                : "text-[#5a4a3a] hover:bg-[#FBF7EE]/70 hover:text-[#6D2B35]"
                            }`}
                            data-testid={testId}
                          >
                            {isActive && (
                              <span className="absolute left-1 top-1.5 bottom-1.5 w-[3px] rounded-full bg-gradient-to-b from-[#D4AF37] via-[#6D2B35] to-[#D4AF37]" aria-hidden="true" />
                            )}
                            <span className="flex items-center gap-2.5 min-w-0">
                              <LinkIcon className={`h-3.5 w-3.5 shrink-0 ${isActive ? "text-[#6D2B35]" : "text-[#6D2B35]/55"}`} strokeWidth={1.8} />
                              <span className="truncate">{link.label}</span>
                            </span>
                            <ChevronRight className={`h-3 w-3 shrink-0 ${isActive ? "text-[#D4AF37]" : "text-[#D4AF37]/40"}`} strokeWidth={1.8} />
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* Account section in body */}
                <div className="mb-3 mt-1">
                  <div className="px-3 pt-3 pb-1 flex items-center gap-2">
                    <span className="h-px w-3 bg-[#D4AF37]" />
                    <p className="text-[9px] uppercase tracking-[0.3em] text-[#D4AF37] font-semibold whitespace-nowrap">{t.nav.account}</p>
                    <span className="h-px flex-1 bg-[#D4AF37]/20" />
                  </div>
                  <div className="px-1.5 pt-0.5">
                    {accountLinks.map((link) => {
                      const AccIcon = link.icon;
                      const isActive = location === link.href;
                      const testId = `mobile-account-${link.label.toLowerCase().replace(/\s+/g, "-")}`;
                      return (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={() => setMobileOpen(false)}
                          className={`relative w-full flex items-center justify-between pl-4 pr-2 h-9 rounded-md text-[12px] font-semibold transition-colors ${
                            isActive ? "bg-[#FBF7EE] text-[#6D2B35]" : "text-[#5a4a3a] hover:bg-[#FBF7EE]/70 hover:text-[#6D2B35]"
                          }`}
                          data-testid={testId}
                        >
                          {isActive && (
                            <span className="absolute left-1 top-1.5 bottom-1.5 w-[3px] rounded-full bg-gradient-to-b from-[#D4AF37] via-[#6D2B35] to-[#D4AF37]" aria-hidden="true" />
                          )}
                          <span className="flex items-center gap-2.5">
                            <AccIcon className={`h-3.5 w-3.5 ${isActive ? "text-[#6D2B35]" : "text-[#6D2B35]/55"}`} strokeWidth={1.8} />
                            {link.label}
                          </span>
                          <ChevronRight className={`h-3 w-3 ${isActive ? "text-[#D4AF37]" : "text-[#D4AF37]/40"}`} strokeWidth={1.8} />
                        </Link>
                      );
                    })}

                    {/* Language sub-section (nested under account, mobile) */}
                    {(() => {
                      const currentLang = languages.find((l) => l.code === language) || languages[0];
                      return (
                        <div className="mt-1">
                          <button
                            type="button"
                            onClick={() => setLangOpen(!langOpen)}
                            className="w-full flex items-center justify-between pl-4 pr-2 h-9 rounded-md text-[12px] font-semibold text-[#5a4a3a] hover:bg-[#FBF7EE]/70 hover:text-[#6D2B35] transition-colors"
                            data-testid="mobile-btn-account-language"
                            aria-expanded={langOpen}
                          >
                            <span className="flex items-center gap-2.5 min-w-0">
                              <Globe className="h-3.5 w-3.5 text-[#6D2B35]/55 shrink-0" strokeWidth={1.8} />
                              <span>Language</span>
                              <span className="text-[10px] font-normal text-[#5a4a3a]/55 truncate">· {currentLang.flag} {currentLang.nativeLabel}</span>
                            </span>
                            <ChevronRight className={`h-3 w-3 text-[#D4AF37]/40 transition-transform shrink-0 ${langOpen ? "rotate-90" : ""}`} strokeWidth={1.8} />
                          </button>
                          {langOpen && (
                            <div className="mt-1 pl-3 pr-1 max-h-56 overflow-y-auto rounded-md bg-[#FBF7EE]/50 border border-[#D4AF37]/15" data-testid="mobile-account-language-list">
                              {languages.map((lang) => (
                                <button
                                  key={lang.code}
                                  type="button"
                                  onClick={() => { switchLanguageWithUrl(lang.code); setLangOpen(false); setMobileOpen(false); }}
                                  className={`w-full flex items-center gap-3 pl-6 pr-3 py-1.5 text-[11px] rounded-sm transition-colors ${
                                    language === lang.code
                                      ? "text-[#6D2B35] font-semibold"
                                      : "text-[#5a4a3a]/80 hover:text-[#6D2B35] hover:bg-[#FBF7EE]"
                                  }`}
                                  data-testid={`mobile-lang-${lang.code}`}
                                >
                                  <span className="text-sm">{lang.flag}</span>
                                  <span>{lang.nativeLabel}</span>
                                  {language === lang.code && <span className="ml-auto text-[#D4AF37]">✦</span>}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Sticky footer CTAs */}
              <div
                className="shrink-0 border-t border-[#D4AF37]/30 bg-[#faf7f2] px-3 pt-2.5 pb-3 space-y-2"
                style={{ boxShadow: "0 -6px 16px -10px rgba(109,43,53,0.28)" }}
              >
                {!user ? (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => { setMobileOpen(false); openAuth("login"); }}
                      className="inline-flex items-center justify-center gap-1.5 h-9 rounded-md text-[12px] font-semibold bg-[#6D2B35] text-[#D4AF37] hover:bg-[#5a1f29] transition-colors shadow-sm"
                      data-testid="mobile-btn-login"
                    >
                      <LogIn className="h-3.5 w-3.5" strokeWidth={1.8} /> {t.nav.login}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setMobileOpen(false); openAuth("signup"); }}
                      className="inline-flex items-center justify-center gap-1.5 h-9 rounded-md text-[12px] font-semibold bg-white text-[#6D2B35] border border-[#D4AF37]/40 hover:bg-[#FBF7EE] transition-colors"
                      data-testid="mobile-btn-register"
                    >
                      <UserPlus className="h-3.5 w-3.5" strokeWidth={1.8} /> {t.nav.register}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => { logout(); setMobileOpen(false); setLocation("/"); }}
                    className="w-full inline-flex items-center justify-center gap-1.5 h-9 rounded-md text-[12px] font-semibold bg-white text-rose-700 border border-rose-200 hover:bg-rose-50 transition-colors"
                    data-testid="mobile-btn-logout"
                  >
                    <LogOut className="h-3.5 w-3.5" strokeWidth={1.8} /> {t.nav.logout}
                  </button>
                )}

                <a
                  href="https://wa.me/918447844702?text=Namaste%20Vedic%20Tatva%2C%20I%20need%20help."
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMobileOpen(false)}
                  className="w-full inline-flex items-center justify-center gap-2 h-9 rounded-md text-[12px] font-semibold bg-[#25D366] text-white hover:bg-[#1ebe57] transition-colors shadow-sm"
                  data-testid="mobile-btn-whatsapp-care"
                  aria-label="Customer Care on WhatsApp 8447-8447-02"
                >
                  <SiWhatsapp className="h-4 w-4" />
                  <span className="leading-none">Customer Care · 8447-8447-02</span>
                </a>
              </div>

            </div>
          </div>
        </>
      )}

    </>
  );
}


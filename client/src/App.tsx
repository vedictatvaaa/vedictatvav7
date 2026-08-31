import React, { useState, useEffect, useCallback, type ReactNode } from "react";
import { reportWebVitals } from "@/lib/web-vitals";
import { Switch, Route, useLocation, Link, useRoute, Router as WouterRouter } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import SmoothScrollProvider from "@/components/SmoothScrollProvider";
import { CartProvider, useCart } from "@/lib/cart";
import { WishlistProvider } from "@/lib/wishlist";
import AmbientBackdrop from "@/components/AmbientBackdrop";
import { useSiteSettings } from "@/lib/site-settings";
import { useFestivalTheme } from "@/components/festival/FestivalDecor";
import { CalendarDays, UserRound, Store, Flame, Phone, Sparkles, Gift, Music2 } from "lucide-react";
import HawanKundIcon from "@/components/icons/HawanKundIcon";
import PanditNavIcon from "@/components/icons/PanditIcon";
import TempleIcon from "@/components/icons/TempleIcon";
import MalaIcon from "@/components/icons/MalaIcon";

type NavIconProps = { active?: boolean; color: string; mutedColor: string };

function MandirIcon({ active, color, mutedColor }: NavIconProps) {
  const c = active ? color : mutedColor;
  const sw = active ? 1.8 : 1.5;
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2.5l1 1.5h-2zM12 4v3" />
      <path d="M8 20v-7c0-2 1.8-4 4-4s4 2 4 4v7" />
      <path d="M5 20v-5l3-2M19 20v-5l-3-2" />
      <path d="M3.5 20h17" />
      <path d="M11 20v-3h2v3" fill={active ? `${color}33` : "none"} />
    </svg>
  );
}

function RudrakshaIcon({ active, color, mutedColor }: NavIconProps) {
  const c = active ? color : mutedColor;
  const sw = active ? 1.9 : 1.6;
  const basketFill = active ? `${color}1F` : "none";
  const wheelFill = active ? c : "none";
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.5 4 H 4.5 L 5.2 6.5" />
      <path d="M5.2 6.5 H 21 L 19 14.5 H 7.5 L 5.2 6.5 Z" fill={basketFill} />
      <path d="M7.5 14.5 L 6.4 17 H 19" />
      <circle cx="9" cy="20" r="1.4" fill={wheelFill} />
      <circle cx="17.5" cy="20" r="1.4" fill={wheelFill} />
    </svg>
  );
}

function CalendarIcon({ active, color, mutedColor }: NavIconProps) {
  const c = active ? color : mutedColor;
  const sw = active ? 1.8 : 1.5;
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="6" width="16" height="14" rx="2" fill={active ? `${color}18` : "none"} />
      <path d="M4 10h16" />
      <path d="M8 4v4M16 4v4" />
      <circle cx="12" cy="14.5" r="1.2" fill={c} stroke="none" />
    </svg>
  );
}

function DiyaIcon({ active, color, mutedColor }: NavIconProps) {
  const c = active ? color : mutedColor;
  const sw = active ? 2 : 1.7;
  const accent = active ? "#D4AF37" : c;
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      <text
        x="12"
        y="18"
        textAnchor="middle"
        fontFamily="'Noto Sans Devanagari','Tiro Devanagari Sanskrit', serif"
        fontSize="20"
        fontWeight={active ? 700 : 600}
        fill={c}
        stroke="none"
      >ॐ</text>
      <circle cx="17.5" cy="5.5" r="1" fill={accent} stroke="none" />
    </svg>
  );
}

function CartIcon({ active, color, mutedColor }: NavIconProps) {
  const c = active ? color : mutedColor;
  const sw = active ? 1.8 : 1.5;
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 4h2l2.4 11.2a1.5 1.5 0 0 0 1.5 1.2h8.6a1.5 1.5 0 0 0 1.5-1.1L21 7H6.5" fill={active ? `${color}18` : "none"} />
      <circle cx="10" cy="20" r="1.4" fill={c} stroke="none" />
      <circle cx="17" cy="20" r="1.4" fill={c} stroke="none" />
    </svg>
  );
}

function PanditIcon({ active, color, mutedColor }: NavIconProps) {
  const c = active ? color : mutedColor;
  const sw = active ? 1.7 : 1.4;
  const robeFill = active ? `${color}22` : "none";
  const tilakStroke = active ? "#D4AF37" : c;
  const tilakFill = active ? "#D4AF37" : "none";
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8.5" r="3.2" fill={robeFill} />
      <path d="M12 5.6v-0.8" stroke={tilakStroke} strokeWidth={1.2} />
      <path d="M11.4 7.2 L12 8.6 L12.6 7.2 Z" fill={tilakFill} stroke={tilakStroke} strokeWidth={1} />
      <path d="M9.5 11.2c-0.3 0.6-0.6 1.4-0.6 2.1" stroke={c} strokeWidth={sw - 0.3} />
      <path d="M14.5 11.2c0.3 0.6 0.6 1.4 0.6 2.1" stroke={c} strokeWidth={sw - 0.3} />
      <path d="M5 21c0-4 3-7 7-7s7 3 7 7" fill={robeFill} />
      <path d="M12 14v7" stroke={c} strokeWidth={sw - 0.2} />
      <path d="M9 16.5l-1.5 4M15 16.5l1.5 4" stroke={tilakStroke} strokeWidth={1.1} opacity={0.85} />
    </svg>
  );
}
import { lazy, Suspense } from "react";
import NotFound from "@/pages/not-found";
const Home = lazy(() => import("@/pages/home"));
const LocalLanding = lazy(() => import("@/pages/local-landing"));
const ADMIN_CHUNK_RELOAD_KEY = "vt-admin-entry-chunk-reload";
function lazyAdminEntry<T extends React.ComponentType<any>>(
  loader: () => Promise<{ default: T }>,
) {
  return lazy(() => loader().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    const isChunkLoadError = /Failed to fetch dynamically imported module|Importing a module script failed|ChunkLoadError|Loading chunk \d+ failed|mime type/i.test(message);
    const alreadyReloaded = typeof window !== "undefined" && sessionStorage.getItem(ADMIN_CHUNK_RELOAD_KEY) === "1";
    if (isChunkLoadError && !alreadyReloaded && typeof window !== "undefined") {
      try { sessionStorage.setItem(ADMIN_CHUNK_RELOAD_KEY, "1"); } catch {}
      window.location.reload();
      return new Promise<{ default: T }>(() => {});
    }
    throw error;
  }));
}
const AdminLogin = lazyAdminEntry(() => import("@/pages/admin-login"));
const Shop = lazy(() => import("@/pages/shop"));
const PanditDirectory = lazy(() => import("@/pages/pandit-directory"));
const PanditCityLanding = lazy(() => import("@/pages/pandit-city-landing"));
const PanditCityPujaLanding = lazy(() => import("@/pages/pandit-city-puja-landing"));
const PujaBooking = lazy(() => import("@/pages/puja-booking"));
const Astrology = lazy(() => import("@/pages/astrology"));
const Experience = lazy(() => import("@/pages/experience"));
const Admin = lazyAdminEntry(() => import("@/pages/admin"));
const SpiritualEssentials = lazy(() => import("@/pages/spiritual-essentials"));
const FestivalLanding = lazy(() => import("@/pages/festival"));
const PujaKitPage = lazy(() => import("@/pages/puja-kit"));
const CategoryComingSoon = lazy(() => import("@/pages/category-coming-soon"));
const CartPage = lazy(() => import("@/pages/cart"));
const ProductDetail = lazy(() => import("@/pages/product-detail"));
const Checkout = lazy(() => import("@/pages/checkout"));
const OrderConfirmation = lazy(() => import("@/pages/order-confirmation"));
const OrderHistory = lazy(() => import("@/pages/order-history"));
const ReturnTicket = lazy(() => import("@/pages/return-ticket"));
const TrackOrder = lazy(() => import("@/pages/track-order"));
const Wishlist = lazy(() => import("@/pages/wishlist"));
const Subscriptions = lazy(() => import("@/pages/subscriptions"));
const WalletPage = lazy(() => import("@/pages/wallet"));
const AstrologySession = lazy(() => import("@/pages/astrology-session"));
const AstrologerPortal = lazy(() => import("@/pages/astrologer-portal"));
const Donations = lazy(() => import("@/pages/donations"));
const Membership = lazy(() => import("@/pages/membership"));
const AIKundli = lazy(() => import("@/pages/ai-kundli"));
const PremiumKundliPDF = lazy(() => import("@/pages/premium-kundli-pdf"));
const AIBabyNames = lazy(() => import("@/pages/ai-baby-names"));
const AIPalmReading = lazy(() => import("@/pages/ai-palm-reading"));
const RefundPolicy = lazy(() => import("@/pages/refund-policy"));
const TermsConditions = lazy(() => import("@/pages/terms-conditions"));
const PrivacyPolicy = lazy(() => import("@/pages/privacy-policy"));
const ShippingPolicy = lazy(() => import("@/pages/shipping-policy"));
const Accessibility = lazy(() => import("@/pages/accessibility"));
const ReviewsSubmit = lazy(() => import("@/pages/reviews-submit"));
const About = lazy(() => import("@/pages/about"));
const Contact = lazy(() => import("@/pages/contact"));
const Careers = lazy(() => import("@/pages/careers"));
const Investors = lazy(() => import("@/pages/investors"));
const Franchise = lazy(() => import("@/pages/franchise"));
const BecomePandit = lazy(() => import("@/pages/become-pandit"));
const BecomeAstrologer = lazy(() => import("@/pages/become-astrologer"));
const PanchangCalendar = lazy(() => import("@/pages/panchang-calendar"));
const SpiritualDashboard = lazy(() => import("@/pages/spiritual-dashboard"));
const VirtualPuja = lazy(() => import("@/pages/virtual-puja"));
const ProductCompare = lazy(() => import("@/pages/product-compare"));
const Kathas = lazy(() => import("@/pages/kathas"));
const PanditProfile = lazy(() => import("@/pages/pandit-profile"));
const AstrologerProfile = lazy(() => import("@/pages/astrologer-profile"));
const Register = lazy(() => import("@/pages/register"));
const Login = lazy(() => import("@/pages/login"));
const ResetPassword = lazy(() => import("@/pages/reset-password"));
const MyProfile = lazy(() => import("@/pages/my-profile"));
const VastuCompass = lazy(() => import("@/pages/vastu-compass"));
const Matrimony = lazy(() => import("@/pages/matrimony"));
const MatrimonyRegister = lazy(() => import("@/pages/matrimony-register"));
const MatrimonyProfiles = lazy(() => import("@/pages/matrimony-profiles"));
const MatrimonyProfileDetail = lazy(() => import("@/pages/matrimony-profile-detail"));
const MuhuratFinder = lazy(() => import("@/pages/muhurat-finder"));
const JapaPage = lazy(() => import("@/pages/japa"));
const JapaMantraPage = lazy(() => import("@/pages/japa-mantra"));

/** Tiny redirector for /jap and /japa-counter SPA hits — replaces the URL
 *  with the canonical /japa so internal <Link>s honor canonicalization. */
function JapaAliasRedirect() {
  const [, navigate] = useLocation();
  useEffect(() => { navigate("/digital-japa-counter", { replace: true }); }, [navigate]);
  return null;
}
const ZodiacRashifal = lazy(() => import("@/pages/zodiac-rashifal"));
const TempleTourism = lazy(() => import("@/pages/temple-tourism"));
const ScriptureSearch = lazy(() => import("@/pages/scripture-search"));
const RoutePlanner = lazy(() => import("@/pages/route-planner"));
const TithiCalculator = lazy(() => import("@/pages/tithi-calculator"));
const PindDaanHub = lazy(() => import("@/pages/pind-daan").then(m => ({ default: m.PindDaanHub })));
const PindDaanDetail = lazy(() => import("@/pages/pind-daan").then(m => ({ default: m.PindDaanDetail })));
const PindDaanGayaLanding = lazy(() => import("@/pages/pind-daan").then(m => ({ default: m.PindDaanGayaLanding })));
const PindDaanKashiLanding = lazy(() => import("@/pages/pind-daan").then(m => ({ default: m.PindDaanKashiLanding })));
const PindDaanHaridwarLanding = lazy(() => import("@/pages/pind-daan").then(m => ({ default: m.PindDaanHaridwarLanding })));
const TirthYatra = lazy(() => import("@/pages/tirth-yatra"));
const TirthYatraDetail = lazy(() => import("@/pages/tirth-yatra-detail"));
const LuckyDraw = lazy(() => import("@/pages/lucky-draw"));
const PilgrimageCard = lazy(() => import("@/pages/pilgrimage-card"));
const PanditLogin = lazy(() => import("@/pages/pandit-login"));
const PanditPortal = lazy(() => import("@/pages/pandit-portal"));
const PanditStorefront = lazy(() => import("@/pages/pandit-storefront"));
const MyPujaBooking = lazy(() => import("@/pages/my-puja-booking"));
const MyBookings = lazy(() => import("@/pages/my-bookings"));
const DashboardPage = lazy(() => import("@/pages/dashboard"));
const PujaCall = lazy(() => import("@/pages/puja-call"));
const ReferPage = lazy(() => import("@/pages/refer"));
const Blog = lazy(() => import("@/pages/blog"));
const BlogPostPage = lazy(() => import("@/pages/blog-post"));
const QaPage = lazy(() => import("@/pages/qa"));
const PujaGuidePage = lazy(() => import("@/pages/puja-guide"));
const SacredLibraryPage = lazy(() => import("@/pages/sacred-library"));
const ServiceLanding = lazy(() => import("@/pages/service-landing"));
const PujaCity = lazy(() => import("@/pages/puja-city"));
const SeoLanding = lazy(() => import("@/pages/seo-landing"));
import { AuthProvider } from "@/lib/auth";
import { I18nProvider, useI18n } from "@/lib/i18n";
import { CurrencyProvider } from "@/lib/currency";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { PWAInstallBanner } from "@/components/PWAInstallBanner";
// Non-critical widgets — code-split + mounted only after the main thread is
// idle (or on first user interaction) so they don't compete with the LCP
// image, the initial paint, or the hero JS bundle.
const SocialProofPopup = lazy(() => import("@/components/social-proof/SocialProofPopup"));
// SalesFomoPopup ("X just bought Y") was previously rendered globally —
// removed at user request because it felt spammy on non-commerce surfaces
// (japa, puja, pind-daan, membership) and added little value on the
// homepage. The component file is preserved so the admin SalesPopupsTab
// configuration data remains intact and we can re-enable it on
// commerce-only routes later if needed.
const InstallAppBanner = lazy(() => import("@/components/InstallAppBanner"));
const ChatWidget = lazy(() => import("@/components/chatbot/ChatWidget"));
import SeoHead from "@/components/SeoHead";
import PreloadHints from "@/components/PreloadHints";
import OrganizationSchema from "@/components/OrganizationSchema";
import SiteSchemas from "@/components/SiteSchemas";
import { AuthModal } from "@/components/auth/AuthModal";
import { useShakeToJapa } from "@/hooks/use-shake-to-japa";
import ThemeApplier from "@/components/ThemeApplier";

function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);
  return null;
}

function InteractionTracker() {
  const [location] = useLocation();
  // Fire a single page_view on every route change so Single-Page-App
  // navigations show up correctly in Analytics. When GTM is installed it
  // owns the page-view tag (we push to dataLayer); otherwise we fall back
  // to direct gtag. Safe no-op if neither tag is present.
  useEffect(() => {
    const w = window as any;
    const hasGtm = !!document.getElementById("gtm-loader");
    if (hasGtm && Array.isArray(w.dataLayer)) {
      w.dataLayer.push({ event: "page_view", page_path: location, page_title: document.title });
    } else if (typeof w.gtag === "function") {
      w.gtag("event", "page_view", {
        page_path: location,
        page_location: window.location.href,
        page_title: document.title,
      });
    }
  }, [location]);
  useEffect(() => {
    import("@/lib/spiritual-tracker").then(({ trackPageVisit }) => {
      const pageCategories: Record<string, string> = {
        "/puja-samagri-online": "shopping", "/online-puja-booking": "puja", "/book-pandit-online": "pandit",
        "/astrology": "astrology", "/ai-kundli": "astrology", "/premium-kundli-pdf": "astrology",
        "/ai-baby-names": "astrology", "/ai-palm-reading": "astrology",
        "/vastu-compass": "vastu", "/panchang-calendar": "panchang",
        "/kathas": "spiritual_learning", "/virtual-puja": "puja",
        "/muhurat-finder": "muhurat", "/zodiac-rashifal": "astrology", "/donations": "donations",
        "/matrimony": "matrimony", "/temple-tourism": "pilgrimage", "/scripture-search": "spiritual_learning", "/route-planner": "pilgrimage",
        "/spiritual-dashboard": "spiritual_journey",
        "/membership": "membership",
      };
      const cat = pageCategories[location] || "general";
      trackPageVisit(location, cat);
    });
  }, [location]);

  // ── Visitor analytics beacon ─────────────────────────────────────────────
  // Fires on every SPA route change. Skips admin/pandit portal.
  // sessionId persists for the browser tab lifetime (localStorage).
  useEffect(() => {
    if (location.startsWith("/admin") || location.startsWith("/pandit/portal")) return;
    let sessionId = "";
    try {
      sessionId = localStorage.getItem("vt_session_id") || "";
      if (!sessionId) {
        sessionId = Math.random().toString(36).slice(2) + Date.now().toString(36);
        localStorage.setItem("vt_session_id", sessionId);
      }
    } catch { /* storage blocked */ }
    // Best-effort, fire-and-forget
    fetch("/api/track/pageview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: location,
        referrer: document.referrer || "",
        sessionId,
      }),
      keepalive: true,
    }).catch(() => { /* silent */ });
  }, [location]);

  return null;
}

class AdminErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: string; stack: string }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: "", stack: "" };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message, stack: error.stack || "" };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("Admin Panel Error:", error.message, error.stack);
    console.error("Component Stack:", info.componentStack);
    fetch("/api/client-error", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: error.message, stack: error.stack, componentStack: info.componentStack }),
    }).catch(() => {});
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FBF7EE] flex items-center justify-center p-8">
          <div className="bg-white rounded-md border border-[#EAD9B7] shadow-sm p-8 max-w-2xl w-full">
            <h2 className="text-xl font-serif font-semibold text-[#6D2B35] mb-3 text-center">Admin Panel Error</h2>
            <p className="text-sm text-[#6B5856] mb-2">{this.state.error}</p>
            <pre className="text-xs text-[#9A8A87] bg-[#FBF7EE] p-3 rounded border border-[#EAD9B7] overflow-auto max-h-40 mb-4 whitespace-pre-wrap">{this.state.stack}</pre>
            <div className="text-center">
              <button onClick={() => { this.setState({ hasError: false, error: "", stack: "" }); window.location.reload(); }} className="px-4 py-2 bg-[#6D2B35] hover:bg-[#4A1C24] text-[#FBF7EE] rounded-md text-sm font-medium" data-testid="button-admin-error-reload">Reload Page</button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function ProtectedAdmin() {
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [adminToken, setAdminToken] = useState("");

  const checkSession = useCallback(async () => {
    // Cookie-only flow (15B). The httpOnly cookie set on login is sent
    // automatically by the browser via credentials:"include"; JS can't
    // read it, so localStorage is no longer involved. We also clean up
    // any legacy localStorage token left over from pre-15B sessions.
    if (typeof window !== "undefined") {
      try { window.localStorage.removeItem("adminToken"); } catch {}
    }
    try {
      const res = await fetch("/api/admin/verify-session", { credentials: "include" });
      if (res.ok) {
        setAdminToken("");
        setAuthed(true);
      }
    } catch { /* unauth → stay on login */ }
    setChecking(false);
  }, []);

  useEffect(() => { checkSession(); }, [checkSession]);

  if (checking) {
    return (
      <div className="min-h-screen bg-[#F5F0E6] flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-[#6D2B35] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!authed) {
    return (
      <Suspense fallback={
        <div className="min-h-screen bg-[#F5F0E6] flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-[#6D2B35] border-t-transparent rounded-full" />
        </div>
      }>
        <AdminLogin onLogin={() => { setAdminToken(""); setAuthed(true); }} />
      </Suspense>
    );
  }

  return (
    <AdminErrorBoundary>
      <Admin adminToken={adminToken} onLogout={() => { setAuthed(false); setAdminToken(""); }} />
    </AdminErrorBoundary>
  );
}

function MobileBottomNav() {
  const [location] = useLocation();
  const { totalItems } = useCart();

  const sideTabs = [
    {
      Icon: TempleIcon, label: "Home", path: "/",
      match: (l: string) => l === "/",
      color: "#B45F4D", tint: "rgba(180,95,77,0.12)",
    },
    {
      Icon: MalaIcon as any, label: "Japa", path: "/digital-japa-counter",
      match: (l: string) => l === "/digital-japa-counter" || l === "/japa" || l === "/jap" || l === "/japa-counter",
      color: "#6D2B35", tint: "rgba(109,43,53,0.12)",
    },
    {
      Icon: ((props: any) => (
        <HawanKundIcon
          {...props}
          active={props["data-active"] === true}
          flameColor="#E07A2B"
        />
      )) as any,
      label: "Puja", path: "/online-puja-booking",
      match: (l: string) => l === "/online-puja-booking" || l === "/online-puja-booking" || l === "/virtual-puja",
      color: "#E07A2B", tint: "rgba(224,122,43,0.14)",
    },
    {
      Icon: ((props: any) => (
        <PanditNavIcon
          {...props}
          active={props["data-active"] === true}
        />
      )) as any,
      label: "Pandit", path: "/book-pandit-online",
      match: (l: string) => l === "/book-pandit-online" || l.startsWith("/pandit/"),
      color: "#2E7D6B", tint: "rgba(46,125,107,0.12)",
    },
  ];

  const shopActive = location === "/puja-samagri-online" || location.startsWith("/product/");

  const renderSideTab = (tab: typeof sideTabs[number]) => {
    const isActive = tab.match(location);
    const isPuja = tab.label === "Puja";
    const isPandit = tab.label === "Pandit";
    const isHome = tab.label === "Home";
    const isJapa = tab.label === "Japa";
    const isLarge = isPuja || isPandit;
    return (
      <Link key={tab.path} href={tab.path} className="flex-1">
        <button
          className="group relative flex flex-col items-center justify-center w-full h-full gap-1"
          data-testid={`nav-${tab.label.toLowerCase()}`}
          aria-label={tab.label}
          aria-current={isActive ? "page" : undefined}
        >
          {isActive && (
            <span
              key={`indicator-${tab.path}`}
              className="absolute top-1 left-1/2 -translate-x-1/2 nav-active-indicator"
              style={{
                width: "4px",
                height: "4px",
                borderRadius: "9999px",
                background: tab.color,
                opacity: 0.55,
                filter: "blur(2.5px)",
                boxShadow: `0 0 8px ${tab.color}`,
              }}
            />
          )}
          <span
            className={`flex items-center justify-center transition-colors ${
              isPuja
                ? "w-16 h-16 -mt-4"
                : isPandit
                ? "w-12 h-12 -mt-2"
                : isHome
                ? "w-14 h-14 -mt-3"
                : isJapa
                ? "w-12 h-12 -mt-2"
                : "w-9 h-9"
            } ${isActive && !isLarge && !isHome ? "nav-icon-bob" : ""}`}
          >
            <tab.Icon
              className={
                isPuja
                  ? "w-16 h-16 transition-all"
                  : isPandit
                  ? "w-12 h-12 transition-all"
                  : isHome
                  ? "w-14 h-14 transition-all"
                  : isJapa
                  ? "w-12 h-12 transition-all animate-spin-slow"
                  : "w-[22px] h-[22px] transition-colors"
              }
              strokeWidth={isActive ? 2.2 : 1.9}
              data-active={isActive}
              style={{ color: tab.color, opacity: isActive ? 1 : 0.85 }}
            />
          </span>
          <span
            className={`text-[10px] leading-none tracking-wide transition-colors ${
              isPuja ? "-mt-3" : isPandit ? "-mt-1" : isHome ? "-mt-2" : isJapa ? "-mt-1" : ""
            }`}
            style={{
              color: tab.color,
              fontWeight: isActive ? 600 : 500,
              opacity: isActive ? 1 : 0.85,
            }}
          >
            {tab.label}
          </span>
        </button>
      </Link>
    );
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white border-t border-[#D4AF37]/25"
      data-testid="mobile-bottom-nav"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <style>{`
        @keyframes nav-indicator-in {
          0% { opacity: 0; transform: translateX(-50%) scaleX(0.2); }
          60% { opacity: 1; transform: translateX(-50%) scaleX(1.15); }
          100% { opacity: 1; transform: translateX(-50%) scaleX(1); }
        }
        @keyframes nav-indicator-pulse {
          0%, 100% { filter: brightness(1); }
          50% { filter: brightness(1.25); }
        }
        .nav-active-indicator {
          animation:
            nav-indicator-in 0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
            nav-indicator-pulse 2s ease-in-out 0.35s infinite;
          transform-origin: center;
        }
        @keyframes nav-icon-bob {
          0% { transform: scale(0.85) translateY(2px); }
          55% { transform: scale(1.1) translateY(-1px); }
          100% { transform: scale(1) translateY(0); }
        }
        .nav-icon-bob {
          animation: nav-icon-bob 0.45s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        @media (prefers-reduced-motion: reduce) {
          .nav-active-indicator, .nav-icon-bob {
            animation: none !important;
          }
        }
      `}</style>
      <div className="relative flex items-stretch h-[64px]">
        {renderSideTab(sideTabs[0])}
        {renderSideTab(sideTabs[1])}

        <div className="flex-1 flex flex-col items-center justify-end pb-1.5">
          <Link href="/puja-samagri-online">
            <button
              className={`relative -mt-7 w-14 h-14 rounded-full flex items-center justify-center transition-colors border-[3px] border-white ${
                shopActive ? "bg-[#5a1f29]" : "bg-[#6D2B35] hover:bg-[#5a1f29]"
              }`}
              style={{ boxShadow: "0 6px 16px -4px rgba(109,43,53,0.45)" }}
              data-testid="nav-shop"
              aria-label="Shop"
              aria-current={shopActive ? "page" : undefined}
            >
              <Store
                className="w-8 h-8"
                strokeWidth={1.8}
                style={{ color: "#F5D77A" }}
              />
              {totalItems > 0 && (
                <span
                  className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#D4AF37] text-[#6D2B35] text-[10px] font-bold flex items-center justify-center border-2 border-white"
                  data-testid="badge-cart-count"
                >
                  {totalItems > 99 ? "99+" : totalItems}
                </span>
              )}
            </button>
          </Link>
          <span
            className="text-[10px] leading-none tracking-wide mt-1"
            style={{
              color: shopActive ? "#6D2B35" : "rgba(90,74,58,0.65)",
              fontWeight: shopActive ? 600 : 500,
            }}
          >
            Shop
          </span>
        </div>

        {renderSideTab(sideTabs[2])}
        {renderSideTab(sideTabs[3])}
      </div>
    </nav>
  );
}

// Wraps the entire route tree in a wouter `base="/hi"` when the URL is under
// /hi, so every page is reachable as a stable Hindi twin (e.g. /hi/puja/...).
// All <Link> hrefs and `useLocation` automatically gain the /hi prefix while
// inside this provider, so internal navigation stays inside the Hindi tree.
function LocaleScope({ children }: { children: ReactNode }) {
  const isHiPath =
    typeof window !== "undefined" && /^\/hi(\/|$)/.test(window.location.pathname);
  const { language, setLanguage } = useI18n();
  // Reconcile locale with URL only for the EN/HI pair that has dedicated URL
  // twins: /hi/* forces `hi`; non-/hi forces `en` only when currently `hi`
  // (so persisted Hindi locale cannot leak onto English routes). Other
  // locales (sa, ta, te, bn, mr, gu) have no URL twin yet and are left alone.
  useEffect(() => {
    if (isHiPath && language !== "hi") setLanguage("hi");
    else if (!isHiPath && language === "hi") setLanguage("en");
  }, [isHiPath, language, setLanguage]);
  return isHiPath ? <WouterRouter base="/hi">{children}</WouterRouter> : <>{children}</>;
}

function Router() {
  const [routerLocation] = useLocation();
  useShakeToJapa();
  // Admin and pandit-portal are full-screen back-office surfaces with their
  // own chrome. Suppress the customer-facing Navbar / Footer / mobile bottom
  // nav / promo ribbon on these routes so they don't leak onto the panel
  // (most visible on mobile, where the bottom-nav otherwise overlaps the
  // admin tabs and links to customer-only pages).
  const lowerLoc = routerLocation.toLowerCase();
  const isBackOffice = lowerLoc.startsWith("/admin")
    || lowerLoc.startsWith("/pandit/portal");
  // Immersive cinematic surfaces render their own chrome — suppress the
  // global Navbar / ribbon / Footer / bottom-nav padding here too.
  const isImmersive = lowerLoc.startsWith("/experience");
  const hideChrome = isBackOffice || isImmersive;
  return (
    <div className="flex flex-col min-h-screen">
      <ScrollToTop />
      <InteractionTracker />
      <ThemeApplier />
      <SeoHead />
      <PreloadHints />
      <OrganizationSchema />
      <SiteSchemas />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-md focus:bg-[#6D2B35] focus:text-white focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
        data-testid="link-skip-to-content"
      >
        Skip to main content
      </a>
      {!hideChrome && <Navbar />}
      {!hideChrome && <TithiToolRibbon />}
      <main id="main-content" tabIndex={-1} className={hideChrome ? "flex-grow" : "flex-grow pb-20 lg:pb-0"}>
        <Suspense fallback={
          <div className="min-h-[60vh] flex items-center justify-center">
            <div className="animate-spin h-8 w-8 border-4 border-[#6D2B35] border-t-transparent rounded-full" />
          </div>
        }>
        <Switch>
          <Route path="/" component={Home} />
          {/* SEO keyword landing pages (top-level URLs for organic ranking).
              NOTE: /online-puja-booking is intentionally NOT here — it's owned
              by the real PujaBooking component below so users actually get the
              booking form (Step 01/02 + Confirm). A duplicate SeoLanding entry
              here would shadow it inside this Switch and silently break booking. */}
          <Route path="/satyanarayan-puja">{() => <SeoLanding slug="satyanarayan-puja" />}</Route>
          <Route path="/rudrabhishek-puja">{() => <SeoLanding slug="rudrabhishek-puja" />}</Route>
          <Route path="/navratri-puja">{() => <SeoLanding slug="navratri-puja" />}</Route>
          <Route path="/pandit-in-delhi">{() => <SeoLanding slug="pandit-in-delhi" />}</Route>
          <Route path="/pandit-in-mumbai">{() => <SeoLanding slug="pandit-in-mumbai" />}</Route>
          <Route path="/pandit-in-bangalore">{() => <SeoLanding slug="pandit-in-bangalore" />}</Route>
          <Route path="/navratri-puja-vidhi">{() => <SeoLanding slug="navratri-puja-vidhi" />}</Route>
          <Route path="/lakshmi-puja-benefits">{() => <SeoLanding slug="lakshmi-puja-benefits" />}</Route>
          <Route path="/griha-pravesh-muhurat">{() => <SeoLanding slug="griha-pravesh-muhurat" />}</Route>
          <Route path="/griha-pravesh-puja">{() => <SeoLanding slug="griha-pravesh-puja" />}</Route>
          <Route path="/lakshmi-puja">{() => <SeoLanding slug="lakshmi-puja" />}</Route>
          <Route path="/navgraha-puja">{() => <SeoLanding slug="navgraha-puja" />}</Route>
          <Route path="/marriage-puja">{() => <SeoLanding slug="marriage-puja" />}</Route>
          <Route path="/pitra-dosh-puja">{() => <SeoLanding slug="pitra-dosh-puja" />}</Route>
          <Route path="/maha-mrityunjaya-jaap">{() => <SeoLanding slug="maha-mrityunjaya-jaap" />}</Route>
          {/* /daily-rashifal intentionally omitted — owned by ZodiacRashifal below.
              See the /online-puja-booking note above for why duplicates here silently
              break the real page inside this Switch. */}
          <Route path="/weekly-rashifal">{() => <SeoLanding slug="weekly-rashifal" />}</Route>
          <Route path="/monthly-horoscope">{() => <SeoLanding slug="monthly-horoscope" />}</Route>
          <Route path="/yearly-horoscope-2026">{() => <SeoLanding slug="yearly-horoscope-2026" />}</Route>
          <Route path="/zodiac-compatibility">{() => <SeoLanding slug="zodiac-compatibility" />}</Route>
          <Route path="/lucky-number-today">{() => <SeoLanding slug="lucky-number-today" />}</Route>
          <Route path="/numerology-predictions">{() => <SeoLanding slug="numerology-predictions" />}</Route>
          <Route path="/kundli-matching">{() => <SeoLanding slug="kundli-matching" />}</Route>
          <Route path="/nakshatra-predictions">{() => <SeoLanding slug="nakshatra-predictions" />}</Route>
          <Route path="/online-puja-store">{() => <SeoLanding slug="online-puja-store" />}</Route>
          <Route path="/rudraksha-collection">{() => <SeoLanding slug="rudraksha-collection" />}</Route>
          <Route path="/rudraksha-mala">{() => <SeoLanding slug="rudraksha-mala" />}</Route>
          <Route path="/havan-samagri">{() => <SeoLanding slug="havan-samagri" />}</Route>
          <Route path="/incense-sticks">{() => <SeoLanding slug="incense-sticks" />}</Route>
          <Route path="/brass-diya">{() => <SeoLanding slug="brass-diyas" />}</Route>
          <Route path="/numerology-prediction">{() => <SeoLanding slug="numerology-predictions" />}</Route>
          <Route path="/digital-japa-counter" component={JapaPage} />
          <Route path="/brass-diyas">{() => <SeoLanding slug="brass-diyas" />}</Route>
          <Route path="/sambrani-cups">{() => <SeoLanding slug="sambrani-cups" />}</Route>
          <Route path="/havan-cups">{() => <SeoLanding slug="havan-cups" />}</Route>
          <Route path="/incense-dhoop">{() => <SeoLanding slug="incense-dhoop" />}</Route>
          <Route path="/crystal-healing">{() => <SeoLanding slug="crystal-healing" />}</Route>
          <Route path="/puja-kits">{() => <SeoLanding slug="puja-kits" />}</Route>
          <Route path="/festival-collections">{() => <SeoLanding slug="festival-collections" />}</Route>
          <Route path="/vastu-products">{() => <SeoLanding slug="vastu-products" />}</Route>
          <Route path="/spiritual-jewelry">{() => <SeoLanding slug="spiritual-jewelry" />}</Route>
          <Route path="/temple-decor">{() => <SeoLanding slug="temple-decor" />}</Route>
          <Route path="/buy/:slug" component={LocalLanding} />
          <Route path="/book/:slug" component={LocalLanding} />
          <Route path="/puja-samagri-online" component={Shop} />
          <Route path="/puja-samagri-online/rudraksha/:slug">{() => <ServiceLanding vertical="rudraksha" pattern="/puja-samagri-online/rudraksha/:slug" />}</Route>
          <Route path="/puja-samagri-online/gemstones/:slug">{() => <ServiceLanding vertical="gemstones" pattern="/puja-samagri-online/gemstones/:slug" />}</Route>
          <Route path="/puja-samagri-online/:slug" component={Shop} />
          {/* Legacy /shop/* routes kept as inert fallbacks; hard nav is
              caught by the SEO_ALIAS_REDIRECTS 301s in server/routes.ts.
              For client-side nav (no full reload), pass the matching legacy
              pattern so ServiceLanding's useRoute can resolve the slug. */}
          <Route path="/shop/rudraksha/:slug">{() => <ServiceLanding vertical="rudraksha" pattern="/shop/rudraksha/:slug" />}</Route>
          <Route path="/shop/gemstones/:slug">{() => <ServiceLanding vertical="gemstones" pattern="/shop/gemstones/:slug" />}</Route>
          <Route path="/shop/:slug" component={Shop} />
          <Route path="/spiritual-essentials" component={SpiritualEssentials} />
          <Route path="/blog" component={Blog} />
          <Route path="/blog/:slug" component={BlogPostPage} />
          <Route path="/qa" component={QaPage} />
          <Route path="/qa/:slug" component={QaPage} />
          <Route path="/puja-guide" component={PujaGuidePage} />
          <Route path="/puja-guide/:slug" component={PujaGuidePage} />
          <Route path="/sacred-library" component={SacredLibraryPage} />
          <Route path="/sacred-library/:slug" component={SacredLibraryPage} />
          <Route path="/festival/:slug" component={FestivalLanding} />
          <Route path="/puja-kit" component={PujaKitPage} />
          <Route path="/category/:slug" component={CategoryComingSoon} />
          <Route path="/book-pandit-online" component={PanditDirectory} />
          <Route path="/book-pandit-online/:citySlug/:pujaSlug" component={PanditCityPujaLanding} />
          <Route path="/book-pandit-online/:citySlug" component={PanditCityLanding} />
          {/* Legacy /pandits/* kept as inert fallbacks; server 301s redirect hard nav. */}
          <Route path="/pandits/:citySlug/:pujaSlug" component={PanditCityPujaLanding} />
          <Route path="/pandits/:citySlug" component={PanditCityLanding} />
          <Route path="/online-pandit-booking" component={PanditDirectory} />
          {/* Canonical puja-booking URL is /online-puja-booking. Any
              client-side nav to legacy /puja is redirected; hard nav is
              caught by the server 301 in SEO_ALIAS_REDIRECTS. */}
          <Route path="/puja">{() => { window.location.replace("/online-puja-booking"); return null; }}</Route>
          <Route path="/online-puja-booking" component={PujaBooking} />
          <Route path="/puja/:type/:city" component={PujaCity} />
          <Route path="/puja/:slug">{() => <ServiceLanding vertical="puja" pattern="/puja/:slug" />}</Route>
          <Route path="/tools/tithi-calculator" component={TithiCalculator} />
          <Route path="/pind-daan-booking" component={PindDaanHub} />
          <Route path="/online-pind-daan" component={PindDaanHub} />
          <Route path="/pind-daan-gaya" component={PindDaanGayaLanding} />
          <Route path="/pind-daan-kashi" component={PindDaanKashiLanding} />
          <Route path="/pind-daan-haridwar" component={PindDaanHaridwarLanding} />
          <Route path="/pind-daan-booking/:slug">{() => <PindDaanDetail />}</Route>
          {/* Legacy /pind-daan/:slug kept as inert fallback; server 301 redirects hard nav. */}
          <Route path="/pind-daan/:slug">{() => <PindDaanDetail />}</Route>
          <Route path="/tirth-yatra/:slug" component={TirthYatraDetail} />
          <Route path="/tirth-yatra" component={TirthYatra} />
          <Route path="/lucky-draw" component={LuckyDraw} />
          <Route path="/pilgrimage-card" component={PilgrimageCard} />
          <Route path="/pandit/login" component={PanditLogin} />
          <Route path="/pandit/portal" component={PanditPortal} />
          <Route path="/store/:slug" component={PanditStorefront} />
          <Route path="/my-puja-booking/:id" component={MyPujaBooking} />
          <Route path="/my-bookings" component={MyBookings} />
          <Route path="/dashboard" component={DashboardPage} />
          <Route path="/puja-call/:id" component={PujaCall} />
          <Route path="/refer" component={ReferPage} />
          <Route path="/astrology" component={Astrology} />
          <Route path="/experience" component={Experience} />
          <Route path="/astrology/services/:slug">{() => <ServiceLanding vertical="astrology" pattern="/astrology/services/:slug" />}</Route>
          <Route path="/ai-kundli" component={AIKundli} />
          <Route path="/premium-kundli-pdf" component={PremiumKundliPDF} />
          <Route path="/ai-baby-names" component={AIBabyNames} />
          <Route path="/ai-palm-reading" component={AIPalmReading} />
          <Route path="/admin" component={ProtectedAdmin} />
          <Route path="/cart" component={CartPage} />
          <Route path="/checkout" component={Checkout} />
          <Route path="/order-confirmation" component={OrderConfirmation} />
          <Route path="/order-history" component={OrderHistory} />
          <Route path="/product/:id" component={ProductDetail} />
          <Route path="/return-ticket" component={ReturnTicket} />
          <Route path="/track-order/:orderId" component={TrackOrder} />
          <Route path="/track-order" component={TrackOrder} />
          <Route path="/wishlist" component={Wishlist} />
          <Route path="/subscriptions" component={Subscriptions} />
          <Route path="/wallet" component={WalletPage} />
          <Route path="/astrology-session/:id" component={AstrologySession} />
          <Route path="/astrologer-portal" component={AstrologerPortal} />
          <Route path="/donations" component={Donations} />
          <Route path="/membership" component={Membership} />
          <Route path="/refund-policy" component={RefundPolicy} />
          <Route path="/terms-conditions" component={TermsConditions} />
          <Route path="/privacy-policy" component={PrivacyPolicy} />
          <Route path="/shipping-policy" component={ShippingPolicy} />
          <Route path="/accessibility" component={Accessibility} />
          <Route path="/reviews/submit" component={ReviewsSubmit} />
          <Route path="/about" component={About} />
          <Route path="/contact" component={Contact} />
          <Route path="/careers" component={Careers} />
          <Route path="/investors" component={Investors} />
          <Route path="/franchise" component={Franchise} />
          <Route path="/become-pandit" component={BecomePandit} />
          <Route path="/become-astrologer" component={BecomeAstrologer} />
          <Route path="/panchang-calendar" component={PanchangCalendar} />
          <Route path="/today-panchang" component={PanchangCalendar} />
          <Route path="/spiritual-dashboard" component={SpiritualDashboard} />
          <Route path="/virtual-puja" component={VirtualPuja} />
          <Route path="/compare" component={ProductCompare} />
          <Route path="/kathas" component={Kathas} />
          <Route path="/p/:slug" component={PanditProfile} />
          <Route path="/pandit/:id" component={PanditProfile} />
          <Route path="/astrologer/:id" component={AstrologerProfile} />
          <Route path="/register" component={Register} />
          <Route path="/login" component={Login} />
          <Route path="/reset-password" component={ResetPassword} />
          <Route path="/my-profile" component={MyProfile} />
          <Route path="/vastu-compass" component={VastuCompass} />
          <Route path="/matrimony" component={Matrimony} />
          <Route path="/matrimony/register" component={MatrimonyRegister} />
          <Route path="/matrimony/profiles" component={MatrimonyProfiles} />
          <Route path="/matrimony/profile/:id" component={MatrimonyProfileDetail} />
          <Route path="/muhurat-finder" component={MuhuratFinder} />
          <Route path="/japa" component={JapaPage} />
          <Route path="/japa/:slug" component={JapaMantraPage} />
          {/* In-app navigation safety net for the SEO aliases — server
              already 301s these on initial HTTP load, but a client-side
              <Link href="/jap"> would otherwise stay on the alias URL.
              This pushes the canonical /japa with replaceState so back
              button doesn't bounce. */}
          <Route path="/jap"><JapaAliasRedirect /></Route>
          <Route path="/japa-counter"><JapaAliasRedirect /></Route>
          <Route path="/zodiac-rashifal" component={ZodiacRashifal} />
          <Route path="/daily-rashifal" component={ZodiacRashifal} />
          <Route path="/temple-tourism" component={TempleTourism} />
          <Route path="/scripture-search" component={ScriptureSearch} />
          <Route path="/route-planner" component={RoutePlanner} />
          <Route component={NotFound} />
        </Switch>
        </Suspense>
      </main>
      {!hideChrome && <Footer />}
      {!hideChrome && <MobileBottomNav />}
      {!hideChrome && <PWAInstallBanner />}
      <AuthModal />
      {!hideChrome && <DeferredWidgets />}
    </div>
  );
}

// Icons admins can pick from in the ribbon editor. Add to this map (here AND
// in admin.tsx RIBBON_ICON_OPTIONS) to expose more options.
const RIBBON_ICON_MAP: Record<string, typeof CalendarDays> = {
  CalendarDays, Flame, UserRound, Phone, Sparkles, Gift, Store, Music2,
};

type RibbonItem = {
  id: string;
  iconName: string;
  eyebrow: string;
  title: string;
  detail: string;
  href: string;
  cta: string;
};

export const DEFAULT_RIBBON_ITEMS: RibbonItem[] = [
  { id: "japa-counter", iconName: "Music2", eyebrow: "Free tool", title: "Japa Counter — Mantra Mala Online", detail: "Tap to chant · 12 sacred mantras · Streaks saved on your device", href: "/digital-japa-counter", cta: "Chant" },
  { id: "tithi-calculator", iconName: "CalendarDays", eyebrow: "Free tool", title: "Pitru Tithi & Annual Shradh Calculator", detail: "Pitru Paksha or Pratisamvatsarik · Free yearly reminders", href: "/tools/tithi-calculator", cta: "Open" },
  { id: "pind-daan-gaya", iconName: "Flame", eyebrow: "Sacred seva", title: "Online Pind Daan at Gaya", detail: "Verified Gayawal Pandits · Live Sankalp · Worldwide prasad", href: "/pind-daan-gaya", cta: "Book" },
  { id: "book-pandit", iconName: "UserRound", eyebrow: "On demand", title: "Book a verified Pandit at home", detail: "Satyanarayan, Griha Pravesh, Rudrabhishek & more", href: "/book-pandit", cta: "Book" },
  { id: "puja-call", iconName: "Phone", eyebrow: "Talk now", title: "Speak to a Vedic Acharya", detail: "Free 5-min call · muhurat, dosha & ritual guidance", href: "/puja-call", cta: "Call" },
  { id: "essentials", iconName: "Gift", eyebrow: "Free shipping", title: "Authentic Puja Samagri & Rudraksha", detail: "Hand-curated, lab-certified · Worldwide delivery", href: "/category/puja-essentials", cta: "Shop" },
];

function TithiToolRibbon() {
  const [location] = useLocation();
  const settings = useSiteSettings();

  // Hide on the calculator itself, admin, pandit-portal and checkout flows
  // where a top promo strip would be a distraction.
  const routeHidden = location === "/tools/tithi-calculator"
    || location.startsWith("/admin")
    || location.startsWith("/pandit/")
    || location.startsWith("/puja-call")
    || location === "/checkout"
    || location.startsWith("/cart");

  // Admin toggle — defaults to OFF. The promo bar must stay hidden until
  // the admin explicitly enables it from the admin panel. No fallback to
  // "on" on first paint, no fallback to default items when items array
  // is empty/missing.
  const adminEnabled = Boolean((settings as any)?.ribbonEnabled);
  const rawItems = (settings as any)?.ribbonItems;
  // Coerce every field to a string and only accept hrefs that are relative
  // paths or http(s) URLs. Anything else (javascript:, data:, vbscript:, an
  // object instead of a string, etc.) is dropped so we never hand a unsafe
  // URL to <Link href> or render a non-string child.
  const isSafeHref = (h: any) => typeof h === "string" && (/^\//.test(h) || /^https?:\/\//i.test(h));
  const sanitized: RibbonItem[] = Array.isArray(rawItems)
    ? rawItems
        .map((r: any, i: number) => r && typeof r === "object" ? ({
          id: String(r.id || `slide-${i}`),
          iconName: String(r.iconName || "Sparkles"),
          eyebrow: String(r.eyebrow || ""),
          title: String(r.title || "").trim(),
          detail: String(r.detail || ""),
          href: String(r.href || ""),
          cta: String(r.cta || ""),
        }) : null)
        .filter((r): r is RibbonItem => !!r && !!r.title && isSafeHref(r.href))
    : [];
  // No fallback to defaults — if the admin hasn't configured items, the bar
  // stays hidden. The DEFAULT_RIBBON_ITEMS export is preserved as a seed
  // catalog the admin panel can paste in, not an automatic fallback.
  const adminItems: RibbonItem[] = sanitized;

  const hidden = routeHidden || !adminEnabled || adminItems.length === 0;

  if (hidden) return null;

  // Continuous marquee — render the item list twice in a row so when the
  // first copy scrolls off-screen the second is already in position. The
  // `marquee` keyframe in index.css translates from 0 to -50%, which is
  // exactly the width of one full copy of the items. Pauses on hover.
  const renderItem = (r: RibbonItem, copyIdx: number) => {
    const Icon = RIBBON_ICON_MAP[r.iconName] || CalendarDays;
    return (
      <span
        key={`${copyIdx}-${r.id}`}
        className="inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-6 flex-shrink-0"
        data-testid={copyIdx === 0 ? `ribbon-slide-${r.id}` : undefined}
        aria-hidden={copyIdx === 1 ? true : undefined}
      >
        <Icon className="h-3.5 w-3.5 text-[#D4AF37] flex-shrink-0" />
        {r.eyebrow && <span className="text-white/90 flex-shrink-0">{r.eyebrow}:</span>}
        <span className="font-semibold text-white whitespace-nowrap">{r.title}</span>
        {r.detail && <span className="text-white/60 whitespace-nowrap">&middot; {r.detail}</span>}
        {r.cta && (
          <Link
            href={r.href}
            className="inline-flex items-center gap-1 bg-[#D4AF37] hover:bg-[#c19f30] text-[#1a0a0e] rounded-md px-2.5 py-0.5 text-[11px] sm:text-[12px] font-bold tracking-wide flex-shrink-0"
            data-testid={copyIdx === 0 ? `link-ribbon-${r.id}` : undefined}
          >
            {r.cta}
          </Link>
        )}
      </span>
    );
  };

  return (
    <div
      className="w-full bg-gradient-to-r from-[#6D2B35] via-[#5a232b] to-[#6D2B35] text-white border-b border-[#D4AF37]/30 overflow-hidden"
      data-testid="ribbon-promo"
    >
      <div className="py-2 text-[12px] sm:text-[13px] overflow-hidden">
        <div
          className="flex"
          style={{
            width: "max-content",
            animation: "marquee 35s linear infinite",
            willChange: "transform",
          }}
          data-testid="ribbon-marquee-track"
        >
          <div className="flex items-center">
            {adminItems.map((r) => renderItem(r, 0))}
          </div>
          <div className="flex items-center" aria-hidden="true">
            {adminItems.map((r) => renderItem(r, 1))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AmbientBackdropToggle() {
  const settings = useSiteSettings();
  if (!settings?.ambientFloralEnabled) return null;
  return <AmbientBackdrop />;
}

interface WindowWithIdle extends Window {
  requestIdleCallback?: (cb: () => void, opts?: { timeout?: number }) => number;
  cancelIdleCallback?: (id: number) => void;
}

// Mount secondary widgets after idle/interaction or 4s safety timer.
function DeferredWidgets() {
  const [show, setShow] = React.useState(false);
  // Hide the chat widget on the homepage so the hero/CTAs aren't covered;
  // every other page still gets the chat icon.
  const [pathname] = useLocation();
  const isHome = pathname === "/";
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const w = window as WindowWithIdle;
    let armed = true;
    const cleanup = () => {
      window.removeEventListener("pointerdown", fire, true);
      window.removeEventListener("scroll", fire, true);
      window.removeEventListener("keydown", fire, true);
      window.removeEventListener("touchstart", fire, true);
    };
    function fire() {
      if (!armed) return;
      armed = false;
      cleanup();
      setShow(true);
    }
    window.addEventListener("pointerdown", fire, true);
    window.addEventListener("scroll", fire, true);
    window.addEventListener("keydown", fire, true);
    window.addEventListener("touchstart", fire, true);
    let idleId = 0;
    const timerId = window.setTimeout(fire, 4000);
    if (w.requestIdleCallback) idleId = w.requestIdleCallback(fire, { timeout: 3500 });
    return () => {
      armed = false;
      cleanup();
      window.clearTimeout(timerId);
      if (idleId && w.cancelIdleCallback) w.cancelIdleCallback(idleId);
    };
  }, []);
  if (!show) return null;
  return (
    <Suspense fallback={null}>
      <SocialProofPopup />
      {!isHome && !pathname.startsWith("/jap") && <ChatWidget />}
      <InstallAppBanner />
    </Suspense>
  );
}

// Top-level boundary: when the React tree throws an unhandled error we send
// the visitor to the branded /offline.html page (Sacred Symbols mini-game)
// rather than showing a blank screen. Admin panel keeps its own boundary
// for in-place recovery.
class GlobalErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("App crashed:", error?.message, error?.stack);
    fetch("/api/client-error", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: error?.message, stack: error?.stack, componentStack: info?.componentStack }),
    }).catch(() => {});
    if (typeof window !== "undefined" && !window.location.pathname.startsWith("/offline")) {
      window.location.replace("/offline.html");
    }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FBF7EE] flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-[#6D2B35] border-t-transparent rounded-full" />
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  useEffect(() => { reportWebVitals(); }, []);
  return (
    <GlobalErrorBoundary>
      <SmoothScrollProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <I18nProvider>
              <CurrencyProvider>
                <AuthProvider>
                  <CartProvider>
                    <WishlistProvider>
                      <AmbientBackdropToggle />
                      <Toaster />
                      <LocaleScope>
                        <Router />
                      </LocaleScope>
                    </WishlistProvider>
                  </CartProvider>
                </AuthProvider>
              </CurrencyProvider>
            </I18nProvider>
          </TooltipProvider>
        </QueryClientProvider>
      </SmoothScrollProvider>
    </GlobalErrorBoundary>
  );
}

export default App;
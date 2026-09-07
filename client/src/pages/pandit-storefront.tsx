import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight, CalendarDays, Check, CheckCircle2, Clock3, Copy, Languages,
  MapPin, MessageCircle, Package, Share2, ShoppingBag, Star, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import PageSeo from "@/components/PageSeo";
import { useConsentPreferences } from "@/lib/consent";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/lib/cart";
import { trackPanditFunnelEvent, trackPanditSeoEvent } from "@/lib/analytics";
import { bookingContextParams } from "@/lib/puja-service-map";
import { KnowledgeGraphRelatedContent } from "@/components/KnowledgeGraphRelatedContent";
import { PanditMembershipCard } from "@/components/pandit/PanditMembershipCard";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type Service = {
  id: number; masterServiceId: number; name: string; slug: string; category?: string; description?: string;
  price?: number; durationMinutes?: number; mode?: string; preparation?: string; inclusions?: string[]; serviceAreas?: string[];
};
type CatalogProduct = {
  id: number; name: string; price: number; salePrice?: number | null; mrp?: number | null;
  image?: string; slug?: string; badge?: string | null; stock?: number; salesCount?: number; rating?: number; reviewCount?: number;
};
type TrustItem = { key: string; label: string; detail?: string };
type StorefrontDto = {
  pandit: { id: number; cityId?: number; stateId?: number; name: string; slug?: string; title?: string; city?: string; state?: string;
    specialization?: string[] | string; languages?: string[] | string; experience?: number; fees?: number; rating?: number; reviewCount?: number;
    verified?: boolean; registrationNo?: string | null; image?: string; bio?: string; education?: string; };
  storefront?: { bio?: string | null; tagline?: string | null; themeColor?: string | null; bannerImage?: string | null; featuredPujas?: string[];
    customPujaEnabled?: boolean; social?: { youtube?: string | null; instagram?: string | null; facebook?: string | null; website?: string | null; }; } | null;
  services?: Service[];
  packages?: Array<{ id: number; name: string; description?: string; price?: number; compareAtPrice?: number; durationMinutes?: number; items?: Array<{ panditServiceId: number; displayOrder?: number }>; }>;
  gallery?: Array<{ id: number; mediaUrl?: string; altText?: string; caption?: string; mediaKind?: string; }>;
  availability?: Array<{ weekday: number; startMinutes: number; endMinutes: number; timezone: string; mode: string; }>;
  products?: CatalogProduct[];
  reviews?: Array<{ id: number; rating: number; comment?: string; userName?: string; reviewerName?: string; serviceType?: string; }>;
  serviceCatalog?: { categories: Array<{ name: string; slug: string; serviceCount: number }>; totalActiveServices: number };
  serviceCoverage?: { primaryLocation?: { city?: string; state?: string }; inPersonAreas: string[]; onlineAvailable: boolean };
  trust?: { verifiedFacts: TrustItem[]; adminBadges: TrustItem[] };
  canonicalUrl?: string; indexability?: { status: string; indexable: boolean; reasons: string[]; };
  seo?: { title: string; description: string; canonical: string; ogImage?: string; ogType: "profile"; robotsIndex: boolean; robotsFollow: boolean; jsonLd: Array<{ id: string; payload: Record<string, any>; }>; };
  // This is intentionally optional while older public DTOs are in circulation.
  // Only an explicit true may be used for an exhaustion booking handoff.
  managedBookingEligible?: boolean;
};
type ContactStatus = {
  policy: "open" | "login_required" | "disabled";
  available: boolean;
  authenticated: boolean;
  quota: { used: number; remaining: number; resetsAt: string | null } | null;
};
type RevealedContact = { phone?: string | null; whatsappNumber?: string | null };

const money = (n?: number) => typeof n === "number" ? `₹${n.toLocaleString("en-IN")}` : "Price on request";
const listify = (value?: string[] | string) => Array.isArray(value) ? value : value ? value.split(",").map(x => x.trim()).filter(Boolean) : [];
function bookingHref(pandit: StorefrontDto["pandit"], service?: Service, packageId?: number) {
  const params = bookingContextParams(typeof window !== "undefined" ? window.location.search : "", pandit.id);
  params.set("source", "storefront");
  if (service) { params.delete("packageId"); params.set("serviceId", String(service.id)); params.set("masterServiceId", String(service.masterServiceId)); if (pandit.cityId) params.set("cityId", String(pandit.cityId)); if (pandit.stateId) params.set("stateId", String(pandit.stateId)); params.delete("service"); params.delete("pujaType"); params.set("mode", service.mode === "online" ? "online" : "offline"); }
  if (packageId) { params.delete("serviceId"); params.delete("masterServiceId"); params.delete("service"); params.delete("pujaType"); params.set("packageId", String(packageId)); }
  return `/online-puja-booking?${params.toString()}`;
}

function SectionTitle({ kicker, title, detail }: { kicker: string; title: string; detail?: string }) {
  return <div className="mb-5"><div className="text-[10px] font-bold uppercase tracking-[.19em] text-[#9A641F]">{kicker}</div><h2 className="mt-1.5 text-[25px] font-semibold leading-tight text-[#531D28] sm:text-3xl">{title}</h2>{detail && <p className="mt-1.5 max-w-2xl text-xs leading-5 text-[#735E54]">{detail}</p>}</div>;
}

function ProductCard({ product, add, referralSlug }: { product: CatalogProduct; add: () => void; referralSlug: string }) {
  const current = product.salePrice ?? product.price;
  const original = product.mrp && product.mrp > current ? product.mrp : product.salePrice && product.salePrice < product.price ? product.price : null;
  const discount = original ? Math.round((1 - current / original) * 100) : 0;
  return <Card className="w-[158px] shrink-0 overflow-hidden rounded-xl border-[#E9DCC6] bg-[#FFFDF9] shadow-[0_3px_12px_rgba(83,29,40,.06)] sm:w-auto">
    <Link href={`/product/${product.slug || product.id}?ref=${encodeURIComponent(referralSlug)}`} className="relative block aspect-square overflow-hidden bg-[#F4E9D5]">{product.badge && <span className="absolute left-2 top-2 z-10 rounded bg-[#E98A2A] px-1.5 py-0.5 text-[9px] font-bold text-white">{product.badge}</span>}{product.image ? <img src={product.image} alt={product.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 hover:scale-105" /> : <div className="grid h-full place-items-center text-[#9A641F]"><ShoppingBag className="h-8 w-8" /></div>}</Link>
    <div className="flex min-h-[154px] flex-col p-2.5"><Link href={`/product/${product.slug || product.id}?ref=${encodeURIComponent(referralSlug)}`} className="line-clamp-2 text-[12px] font-semibold leading-4 text-[#421D25]">{product.name}</Link>{product.rating !== undefined && <div className="mt-1 inline-flex items-center gap-1 text-[10px] font-medium text-[#6B4E27]"><Star className="h-3 w-3 fill-[#E6A91A] text-[#E6A91A]" />{product.rating.toFixed(1)}{product.reviewCount !== undefined && <span className="font-normal text-[#7B675D]">({product.reviewCount})</span>}</div>}{product.salesCount ? <div className="mt-1 text-[9px] text-[#7B675D]">{product.salesCount.toLocaleString("en-IN")} sold</div> : null}<div className="mt-2 flex items-baseline gap-1.5"><span className="text-base font-bold text-[#541E29]">{money(current)}</span>{original && <span className="text-[10px] text-[#8B7568] line-through">{money(original)}</span>}</div>{discount > 0 && <div className="mb-1 text-[9px] font-semibold text-[#258653]">{discount}% off</div>}<Button onClick={add} disabled={product.stock === 0} className="mt-auto h-8 rounded-md bg-[#8D2830] px-2 text-[11px] text-[#FFF8E8] hover:bg-[#6D2028]"><ShoppingBag className="mr-1 h-3 w-3" />{product.stock === 0 ? "Out of stock" : "Add to cart"}</Button></div>
  </Card>;
}

function ServiceCard({ service, pandit, onBook }: { service: Service; pandit: StorefrontDto["pandit"]; onBook: (s: Service) => void }) {
  return <Card className="flex min-h-[190px] flex-col rounded-xl border-[#E9DCC6] bg-[#FFFDF9] p-4 shadow-[0_3px_12px_rgba(83,29,40,.05)]"><div className="flex items-start justify-between gap-2"><div><div className="text-[10px] font-bold uppercase tracking-[.14em] text-[#9A641F]">{service.category || "Vedic ceremony"}</div><h3 className="mt-1 text-lg font-semibold text-[#531D28]">{service.name}</h3></div><Badge variant="outline" className="shrink-0 rounded-full border-[#D8B878] text-[9px] text-[#76522B]">{service.mode === "online" ? "Online" : service.mode === "hybrid" ? "Hybrid" : "In person"}</Badge></div>{service.description && <p className="mt-2 line-clamp-2 text-xs leading-5 text-[#735E54]">{service.description}</p>}<div className="mt-auto flex items-center justify-between gap-2 border-t border-[#EEE3D2] pt-3"><div><div className="flex items-center gap-1 text-[10px] text-[#846E62]"><Clock3 className="h-3 w-3" />{service.durationMinutes ? `${service.durationMinutes} min` : "Details in booking"}</div><div className="mt-0.5 font-bold text-[#8D2830]">{money(service.price)}</div></div><Button onClick={() => onBook(service)} className="h-8 rounded-md bg-[#8D2830] px-3 text-xs">Book <ArrowRight className="ml-1 h-3.5 w-3.5" /></Button></div></Card>;
}

function TrustCards({ trust }: { trust?: StorefrontDto["trust"] }) {
  const verifiedFacts = trust?.verifiedFacts || [];
  const adminBadges = trust?.adminBadges || [];
  if (!verifiedFacts.length && !adminBadges.length) return null;
  return <section className="border-b border-[#E9DCC6] py-5 sm:py-6">
    <SectionTitle kicker="Public trust" title="Verified profile details" detail="Facts are published from approved records; endorsements are selected by Vedic Tatva." />
    <div data-lenis-prevent className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide sm:grid sm:grid-cols-2 lg:grid-cols-3">
      {verifiedFacts.map(fact => <Card key={`fact-${fact.key}`} className="w-[245px] shrink-0 border-[#CFE4D5] bg-[#F5FBF6] p-4 sm:w-auto"><div className="flex items-center gap-2 text-xs font-bold text-[#216D45]"><CheckCircle2 className="h-4 w-4" />Verified fact</div><h3 className="mt-2 text-sm font-semibold text-[#3C372E]">{fact.label}</h3>{fact.detail && <p className="mt-1 text-xs leading-5 text-[#5E6B60]">{fact.detail}</p>}</Card>)}
      {adminBadges.map(badge => <Card key={`badge-${badge.key}`} className="w-[245px] shrink-0 border-[#E3D2BA] bg-[#FFF9ED] p-4 sm:w-auto"><div className="flex items-center gap-2 text-xs font-bold text-[#8A5A1D]"><Badge className="h-4 w-4 rounded-full bg-[#8D2830] p-0 text-[9px] text-[#FFF8E8]">VT</Badge>Admin endorsement</div><h3 className="mt-2 text-sm font-semibold text-[#3C372E]">{badge.label}</h3>{badge.detail && <p className="mt-1 text-xs leading-5 text-[#735E54]">{badge.detail}</p>}</Card>)}
    </div>
  </section>;
}

function ServiceCoverageCard({ coverage }: { coverage?: StorefrontDto["serviceCoverage"] }) {
  const location = [coverage?.primaryLocation?.city, coverage?.primaryLocation?.state].filter(Boolean).join(", ");
  const areas = coverage?.inPersonAreas || [];
  if (!location && !areas.length && !coverage?.onlineAvailable) return null;
  return <Card className="mb-5 border-[#E3D2BA] bg-[#FFF9F0] p-4">
    <div className="flex items-center gap-2 text-sm font-semibold text-[#531D28]"><MapPin className="h-4 w-4 text-[#8D2830]" />Service coverage</div>
    <div className="mt-3 grid gap-3 text-xs text-[#604B42] sm:grid-cols-2 lg:grid-cols-3">
      {location && <div><b className="text-[#531D28]">Based in</b><p className="mt-1 leading-5">{location}</p></div>}
      {areas.length > 0 && <div><b className="text-[#531D28]">In-person service areas</b><p className="mt-1 leading-5">{areas.join(" · ")}</p></div>}
      {coverage?.onlineAvailable && <div><b className="text-[#531D28]">Online</b><p className="mt-1 leading-5">Available for online puja and consultation.</p></div>}
    </div>
  </Card>;
}

export default function PanditStorefrontPage() {
  const { slug: rawSlug } = useParams<{ slug: string }>(); const slug = (rawSlug || "").toLowerCase(); const [, navigate] = useLocation();
  const { requireAuth, user } = useAuth(); const { toast } = useToast(); const { addToCart } = useCart(); const consent = useConsentPreferences();
  const [category, setCategory] = useState("all"); const [lightbox, setLightbox] = useState(-1); const [shareOpen, setShareOpen] = useState(false); const [copied, setCopied] = useState(false);
  const [contactOpen, setContactOpen] = useState(false); const [revealedContact, setRevealedContact] = useState<RevealedContact | null>(null); const [revealBusy, setRevealBusy] = useState(false); const [contactError, setContactError] = useState("");
  const { data, isLoading, isError, refetch } = useQuery<StorefrontDto>({ queryKey: ["/api/storefront", slug], enabled: !!slug, queryFn: async () => { const r = await fetch(`/api/storefront/${encodeURIComponent(slug)}`); if (!r.ok) throw new Error("Storefront unavailable"); return r.json(); } });
  const contactStatus = useQuery<ContactStatus>({
    queryKey: ["/api/storefront", slug, "contact/status", user?.id || "visitor"],
    enabled: !!slug,
    queryFn: async () => { const r = await fetch(`/api/storefront/${encodeURIComponent(slug)}/contact/status`); if (!r.ok) throw new Error("Contact access status is unavailable"); return r.json(); },
  });
  const { data: bestsellers, isLoading: bestsellersLoading } = useQuery<CatalogProduct[]>({ queryKey: ["/api/bestsellers"], queryFn: async () => { const r = await fetch("/api/bestsellers"); if (!r.ok) throw new Error("Bestsellers unavailable"); return r.json(); } });
  useEffect(() => { const secure = window.location.protocol === "https:" ? "; Secure" : ""; document.cookie = consent?.marketing && slug ? `vt_ref=${encodeURIComponent(slug)}; Path=/; Max-Age=${30 * 24 * 60 * 60}; SameSite=Lax${secure}` : `vt_ref=; Path=/; Max-Age=0; SameSite=Lax${secure}`; }, [consent?.marketing, slug]);
  useEffect(() => { if (data?.pandit) trackPanditSeoEvent("discovery_impression", { slug, source: "storefront" }); }, [data?.pandit, slug]);
  useEffect(() => { if (data?.pandit) trackPanditFunnelEvent("profile_view", { slug, source: "storefront" }); }, [data?.pandit, slug]);
  useEffect(() => { if (lightbox < 0) return; const close = (e: KeyboardEvent) => e.key === "Escape" && setLightbox(-1); window.addEventListener("keydown", close); return () => window.removeEventListener("keydown", close); }, [lightbox]);

  if (isLoading) return <div className="min-h-[100dvh] bg-[#FCF8F0] p-4"><div className="mx-auto max-w-6xl animate-pulse space-y-4"><div className="h-5 w-40 rounded bg-[#EADCC7]" /><div className="h-56 rounded-2xl bg-[#EADCC7]" /><div className="h-8 w-64 rounded bg-[#EADCC7]" /><div className="grid gap-3 sm:grid-cols-4">{[1,2,3,4].map(i => <div key={i} className="h-48 rounded-xl bg-[#EADCC7]" />)}</div></div></div>;
  if (isError || !data?.pandit) return <div className="grid min-h-[100dvh] place-items-center bg-[#FCF8F0] px-6 text-center"><div><h1 className="text-2xl font-semibold text-[#531D28]">This storefront is unavailable</h1><p className="mt-2 text-sm text-[#735E54]">The page may be unpublished or the link may have changed.</p><div className="mt-5 flex justify-center gap-2"><Button onClick={() => refetch()} variant="outline">Try again</Button><Link href="/book-pandit-online"><Button className="bg-[#8D2830]">Browse Pandits</Button></Link></div></div></div>;

  const { pandit, storefront } = data; const services = data.services || []; const products = bestsellers || []; const reviews = data.reviews || []; const gallery = data.gallery || [];
  const languages = listify(pandit.languages); const specializations = listify(pandit.specialization); const categories = data.serviceCatalog?.categories || [];
  const selectedFacet = categories.find(item => item.slug === category);
  const filtered = !selectedFacet ? services : services.filter(service => service.category === selectedFacet.name || service.category?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") === selectedFacet.slug);
  const displayName = /^(?:pt\.?|pandit)\s/i.test(pandit.name) ? pandit.name : `${pandit.title || "Pandit"} ${pandit.name}`;
  const shareUrl = typeof window !== "undefined" ? new URL(data.canonicalUrl || `/pandit/${slug}`, window.location.origin).toString() : `/pandit/${slug}`;
  const bookingEligible = data.managedBookingEligible === true;
  const bookingKnownUnavailable = data.managedBookingEligible === false;
  const book = (service?: Service, packageId?: number) => {
    if (bookingKnownUnavailable) {
      trackPanditFunnelEvent("booking_completion_error", { slug, source: "storefront", managed_booking_eligible: false });
      toast({ title: "Managed booking is unavailable", description: "You can still view this profile or use Call Panditji when contact is available." });
      return;
    }
    trackPanditFunnelEvent("booking_start", { slug, source: "storefront", managed_booking_eligible: bookingEligible });
    trackPanditSeoEvent("discovery_cta", { slug, source: "storefront" }); trackPanditSeoEvent("booking_handoff", { slug, source: "storefront" }); navigate(bookingHref(pandit, service, packageId));
  };
  const chat = () => requireAuth(() => navigate(bookingHref(pandit)), { title: "Sign in to continue", description: "Continue to booking to share your ceremony requirements." });
  const access = contactStatus.data;
  const openContact = () => {
    trackPanditFunnelEvent("contact_cta", { slug, source: "storefront" });
    setContactError("");
    setContactOpen(true);
    if (!access) return;
    if (access.policy === "disabled") return;
    if (access.available === false) { trackPanditFunnelEvent("contact_unavailable", { slug, source: "storefront" }); return; }
    if (access.policy === "login_required" && !access.authenticated) trackPanditFunnelEvent("contact_prompt", { slug, source: "storefront" });
    if (access.quota?.remaining === 0) trackPanditFunnelEvent("contact_quota_exhausted", { slug, source: "storefront", managed_booking_eligible: bookingEligible });
  };
  const loginForContact = () => requireAuth(
    () => { contactStatus.refetch(); },
    { title: "Login to view contact details", description: "Sign in to securely view this Panditji's contact details." },
  );
  const revealContact = async () => {
    if (!slug || revealBusy) return;
    setRevealBusy(true); setContactError("");
    try {
      const res = await fetch(`/api/storefront/${encodeURIComponent(slug)}/contact/reveal`, { method: "POST", headers: { "Content-Type": "application/json" } });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 401) { trackPanditFunnelEvent("contact_prompt", { slug, source: "storefront" }); loginForContact(); return; }
        if (res.status === 429) trackPanditFunnelEvent("contact_quota_exhausted", { slug, source: "storefront", managed_booking_eligible: bookingEligible });
        if (res.status === 409) trackPanditFunnelEvent("contact_unavailable", { slug, source: "storefront" });
        throw new Error(result.message || result.reason || "Contact could not be revealed. Please try again.");
      }
      const contact = result.contact || {};
      if (!contact.phone && !contact.whatsappNumber) {
        trackPanditFunnelEvent("contact_unavailable", { slug, source: "storefront" });
        throw new Error("Contact details are unavailable. No reveal was completed.");
      }
      const wasAlreadyRevealed = access?.quota && result.quota && result.quota.used === access.quota.used;
      trackPanditFunnelEvent(wasAlreadyRevealed ? "contact_repeat_reveal" : "contact_reveal", { slug, source: "storefront" });
      setRevealedContact(contact);
      await contactStatus.refetch();
    } catch (error: any) { setContactError(error.message || "Contact could not be revealed. Please try again."); }
    finally { setRevealBusy(false); }
  };
  const copyLink = async () => { try { await navigator.clipboard.writeText(shareUrl); setCopied(true); toast({ title: "Storefront link copied" }); setTimeout(() => setCopied(false), 1800); } catch { toast({ title: "Copy unavailable", description: shareUrl }); } };

  return <div className="min-h-[100dvh] overflow-x-hidden bg-[#FCF8F0] pb-20 text-[#422C29] md:pb-0">
    <PageSeo title={data.seo?.title || `${pandit.name} — Vedic Pandit | Vedic Tatva`} description={data.seo?.description || storefront?.tagline || storefront?.bio || pandit.bio || `View services and request a booking with ${pandit.name}.`} canonical={data.seo?.canonical || `/pandit/${slug}`} ogType="profile" ogImage={data.seo?.ogImage || pandit.image || storefront?.bannerImage || undefined} noindex={data.seo ? !data.seo.robotsIndex : false} schemas={data.seo?.jsonLd as any} />
    <main className="mx-auto max-w-[1220px] px-3 sm:px-5 lg:px-7">
      <div className="hidden items-center gap-2 py-3 text-[11px] text-[#876F61] md:flex">Home <span>/</span> Pandit <span>/</span> {pandit.city || "India"} <span>/</span> <strong className="text-[#531D28]">{pandit.name}</strong><button onClick={() => setShareOpen(v => !v)} className="ml-auto inline-flex items-center gap-1 text-[#531D28]" aria-label="Share storefront"><Share2 className="h-4 w-4" />Share</button></div>
      <section id="overview" className="scroll-mt-28 border-b border-[#E9DCC6] py-4 sm:py-6 lg:py-7">
        <div className="grid gap-4 lg:grid-cols-[178px_1fr_250px] lg:gap-6">
          <div className="mx-auto w-[152px] lg:mx-0 lg:w-full"><div className="aspect-square overflow-hidden rounded-2xl bg-[#E8C9A5] shadow-[0_8px_20px_rgba(83,29,40,.12)]">{(storefront?.bannerImage || pandit.image) ? <img src={storefront?.bannerImage || pandit.image} alt={`${pandit.name}, ${pandit.title || "Vedic Pandit"}`} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-6xl font-semibold text-[#8D2830]">{pandit.name.slice(0, 1)}</div>}</div></div>
          <div className="text-center lg:text-left"><div className="flex flex-wrap justify-center gap-1.5 lg:justify-start">{pandit.verified && <Badge className="bg-[#F8EBD7] text-[10px] text-[#6B4224] hover:bg-[#F8EBD7]"><CheckCircle2 className="mr-1 h-3 w-3" />Vedic Tatva Verified</Badge>}{pandit.registrationNo && <Badge className="bg-[#8D2830] text-[10px] text-[#FFF8E8] hover:bg-[#8D2830]">Registered member</Badge>}</div><h1 className="mt-2 text-[30px] font-semibold leading-none text-[#321A20] sm:text-4xl">{displayName}</h1>{storefront?.tagline && <p className="mt-1 text-sm text-[#76584B]">{storefront.tagline}</p>}<div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs text-[#4E3C36] lg:justify-start">{pandit.reviewCount && pandit.rating !== undefined ? <span className="inline-flex items-center gap-1 font-semibold"><Star className="h-4 w-4 fill-[#E6A91A] text-[#E6A91A]" />{pandit.rating.toFixed(1)}<span className="font-normal text-[#876F61]">({pandit.reviewCount} reviews)</span></span> : <span className="font-semibold text-[#876F61]">New</span>}{pandit.city && <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4 text-[#8D2830]" />{pandit.city}{pandit.state ? `, ${pandit.state}` : ""}</span>}{pandit.experience && <span>{pandit.experience}+ years of experience</span>}{languages.length > 0 && <span className="inline-flex items-center gap-1"><Languages className="h-4 w-4 text-[#8D2830]" />{languages.join(", ")}</span>}</div><div data-lenis-prevent className="mt-3 flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">{[...specializations, ...(storefront?.featuredPujas || [])].map(tag => <span key={tag} className="shrink-0 rounded-full border border-[#E3D2BA] bg-[#FFFDF9] px-3 py-1 text-[10px] text-[#624A40]">{tag}</span>)}</div><p className="mx-auto mt-3 max-w-2xl line-clamp-3 text-left text-xs leading-5 text-[#604B42] lg:mx-0">{storefront?.bio || pandit.bio}</p></div>
          <aside className="hidden rounded-2xl border border-[#E9DCC6] bg-[#FFFDF9] p-4 lg:block"><div className="text-xs font-bold text-[#321A20]">Connect with {pandit.title || "Panditji"}</div><Button onClick={openContact} disabled={contactStatus.isLoading} className="mt-3 w-full rounded-md bg-[#258653] hover:bg-[#1d6c42]"><MessageCircle className="mr-2 h-4 w-4" />Call Panditji</Button>{bookingKnownUnavailable ? <p className="mt-3 rounded-md bg-[#FFF5E8] p-2 text-xs leading-5 text-[#735E54]">Managed booking is unavailable for this profile. Direct contact and profile details remain available.</p> : <Button onClick={() => book()} variant="outline" className="mt-3 w-full rounded-md">Book through Vedic Tatva</Button>}</aside>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:max-w-[760px]"><Button onClick={openContact} disabled={contactStatus.isLoading} className="h-11 rounded-md bg-[#258653] text-xs hover:bg-[#1d6c42]"><MessageCircle className="mr-2 h-4 w-4" />Call Panditji</Button>{bookingKnownUnavailable ? <div className="flex items-center rounded-md border border-[#E0CEB5] px-3 text-center text-[10px] leading-4 text-[#735E54]">Managed booking unavailable</div> : <Button onClick={() => book()} variant="outline" className="h-11 rounded-md text-xs"><CalendarDays className="mr-2 h-4 w-4" />Book a Puja</Button>}<Button onClick={() => setShareOpen(v => !v)} variant="outline" className="col-span-2 h-10 rounded-md border-[#E0CEB5] text-xs sm:col-span-1 lg:hidden"><Share2 className="mr-2 h-4 w-4" />Share profile</Button></div>
      </section>
      <TrustCards trust={data.trust} />
      <nav data-lenis-prevent className="sticky top-0 z-20 -mx-3 flex gap-6 overflow-x-auto border-b border-[#E9DCC6] bg-[#FCF8F0]/95 px-3 py-3 text-[11px] font-semibold text-[#725F56] backdrop-blur sm:-mx-5 sm:px-5 lg:-mx-7 lg:px-7" aria-label="Storefront sections">{[["Overview","overview"],["Services","services"],["Panditji Store","store"],["Reviews","reviews"],["Gallery","gallery"],["About","about"]].map(([label,id]) => <a key={id} href={`#${id}`} className={`shrink-0 ${id === "store" ? "text-[#8D2830]" : "hover:text-[#8D2830]"}`}>{label}</a>)}</nav>

      <section id="store" className="scroll-mt-16 py-6 sm:py-8"><div className="flex items-end justify-between gap-3"><SectionTitle kicker="Puja essentials" title="Panditji Store" detail="Vedic Tatva bestsellers for your spiritual journey." /><Link href={`/puja-samagri-online?ref=${encodeURIComponent(slug)}`} className="mb-5 shrink-0 text-[11px] font-semibold text-[#8D2830]">View more <ArrowRight className="inline h-3.5 w-3.5" /></Link></div>{bestsellersLoading ? <div className="flex gap-3 overflow-hidden">{[1,2,3,4].map(item => <div key={item} className="h-72 w-[158px] shrink-0 animate-pulse rounded-xl bg-[#EADCC7] sm:flex-1" />)}</div> : products.length ? <div data-lenis-prevent className="flex snap-x gap-3 overflow-x-auto pb-2 scrollbar-hide sm:grid sm:grid-cols-4">{products.map(product => <ProductCard key={product.id} product={product} referralSlug={slug} add={() => { addToCart({ ...product, price: product.salePrice ?? product.price } as any, 1); toast({ title: "Added to cart", description: product.name }); }} />)}</div> : <div className="rounded-xl border border-dashed border-[#D8C4A8] p-8 text-center text-sm text-[#876F61]">Bestsellers are temporarily unavailable.</div>}</section>
      <section id="services" className="border-t border-[#E9DCC6] py-7"><SectionTitle kicker="Published offerings" title="Services for your ceremony" detail="Choose a service, then confirm the details and availability inside booking." /><ServiceCoverageCard coverage={data.serviceCoverage} /><div data-lenis-prevent className="mb-4 flex gap-2 overflow-x-auto scrollbar-hide"><button onClick={() => setCategory("all")} className={`shrink-0 rounded-full border px-3 py-1.5 text-[11px] ${category === "all" ? "border-[#8D2830] bg-[#8D2830] text-[#FFF8E8]" : "border-[#E0CEB5] text-[#694D42]"}`}>All ({data.serviceCatalog?.totalActiveServices ?? services.length})</button>{categories.map(item => <button key={item.slug} onClick={() => setCategory(item.slug)} className={`shrink-0 rounded-full border px-3 py-1.5 text-[11px] ${category === item.slug ? "border-[#8D2830] bg-[#8D2830] text-[#FFF8E8]" : "border-[#E0CEB5] text-[#694D42]"}`}>{item.name} ({item.serviceCount})</button>)}</div>{filtered.length ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{filtered.map(service => <ServiceCard key={service.id} service={service} pandit={pandit} onBook={book} />)}</div> : <div className="rounded-xl border border-dashed border-[#D8C4A8] p-8 text-center text-sm text-[#876F61]">Services will appear here when published.</div>}</section>
      {!!data.packages?.length && <section className="border-t border-[#E9DCC6] py-7"><SectionTitle kicker="Curated combinations" title="Puja packages" /><div className="grid gap-3 sm:grid-cols-2">{data.packages.map(pkg => <Card key={pkg.id} className="rounded-xl border-[#E9DCC6] bg-[#FFFDF9] p-4"><div className="flex justify-between gap-3"><div><h3 className="font-semibold text-[#531D28]">{pkg.name}</h3><p className="mt-1 text-xs leading-5 text-[#735E54]">{pkg.description}</p></div><Package className="h-5 w-5 text-[#9A641F]" /></div><div className="mt-4 flex items-center justify-between border-t border-[#EEE3D2] pt-3"><strong className="text-[#8D2830]">{money(pkg.price)}</strong><Button onClick={() => book(undefined, pkg.id)} className="h-8 rounded-md bg-[#8D2830] text-xs">Book package</Button></div></Card>)}</div></section>}
      {(storefront?.bio || pandit.bio || specializations.length || languages.length) && <section id="about" className="border-t border-[#E9DCC6] py-7"><SectionTitle kicker="About the practice" title={`Meet ${pandit.title || "Pandit"} ${pandit.name}`} /><div className="grid gap-5 md:grid-cols-[1fr_260px]"><p className="whitespace-pre-line text-sm leading-7 text-[#604B42]">{storefront?.bio || pandit.bio}</p><div className="rounded-xl bg-[#F7EBD8] p-4 text-xs text-[#604B42]">{languages.length > 0 && <div><b>Languages</b><p className="mt-1">{languages.join(" · ")}</p></div>}{specializations.length > 0 && <div className="mt-4"><b>Specialization</b><p className="mt-1">{specializations.join(" · ")}</p></div>}{pandit.education && <div className="mt-4"><b>Study</b><p className="mt-1">{pandit.education}</p></div>}</div></div></section>}
      {pandit.registrationNo && /^\d{10}$/.test(pandit.registrationNo) && <section className="border-t border-[#E9DCC6] py-7"><SectionTitle kicker="Public credential" title="Vedic Tatva membership" detail="A public-safe credential linked to this approved profile." /><PanditMembershipCard credential={{ registrationNo: pandit.registrationNo, name: pandit.name, image: pandit.image, city: pandit.city, state: pandit.state, specialization: pandit.specialization, status: pandit.verified ? "verified" : "inactive", profilePath: data.canonicalUrl || `/pandit/${slug}` }} /></section>}
      {!!reviews.length && <section id="reviews" className="border-t border-[#E9DCC6] py-7"><SectionTitle kicker="From devotees" title={`Reviews for ${pandit.name}`} /><div data-lenis-prevent className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">{reviews.slice(0, 6).map(review => <Card key={review.id} className="w-[270px] shrink-0 rounded-xl border-[#E9DCC6] bg-[#FFFDF9] p-4"><div className="flex gap-0.5">{[1,2,3,4,5].map(i => <Star key={i} className={`h-3.5 w-3.5 ${i <= review.rating ? "fill-[#E6A91A] text-[#E6A91A]" : "text-[#D8CDB5]"}`} />)}</div><p className="mt-3 line-clamp-4 text-xs leading-5 text-[#604B42]">{review.comment ? `“${review.comment}”` : "Published review"}</p><div className="mt-3 text-[11px] font-semibold text-[#8D2830]">{review.userName || review.reviewerName || "Devotee"}{review.serviceType && <span className="font-normal text-[#876F61]"> · {review.serviceType}</span>}</div></Card>)}</div></section>}
      {!!gallery.length && <section id="gallery" className="border-t border-[#E9DCC6] py-7"><SectionTitle kicker="Published moments" title="A glimpse into the work" /><div className="columns-2 gap-3 sm:columns-3">{gallery.map((item, index) => item.mediaUrl && <button key={item.id} onClick={() => setLightbox(index)} className="mb-3 block w-full break-inside-avoid text-left"><img src={item.mediaUrl} alt={item.altText || item.caption || "Ceremony gallery image"} loading="lazy" className="w-full rounded-xl object-cover" />{item.caption && <span className="mt-1 block text-[10px] text-[#876F61]">{item.caption}</span>}</button>)}</div></section>}
      {storefront?.customPujaEnabled && <section className="mb-7 rounded-xl border border-[#E2CDA8] bg-[#F8EBD7] p-5 sm:flex sm:items-center sm:justify-between sm:gap-5"><div><div className="text-[10px] font-bold uppercase tracking-[.15em] text-[#9A641F]">Have a particular sankalp?</div><h2 className="mt-1 text-xl font-semibold text-[#531D28]">Discuss a custom puja</h2><p className="mt-1 text-xs text-[#735E54]">Share your family’s needs privately inside Vedic Tatva.</p></div><Button onClick={chat} className="mt-4 rounded-md bg-[#8D2830] sm:mt-0">Start private chat <MessageCircle className="ml-2 h-4 w-4" /></Button></section>}
      <div className="pb-5"><KnowledgeGraphRelatedContent type="PANDIT" id={pandit.id} /></div>
    </main>
    <div className="fixed inset-x-0 bottom-0 z-40 flex gap-2 border-t border-[#E1CCAE] bg-[#FFFDF8]/95 p-2.5 pb-[calc(.625rem+env(safe-area-inset-bottom))] shadow-[0_-5px_18px_rgba(83,29,40,.1)] md:hidden"><Button onClick={openContact} disabled={contactStatus.isLoading} className="h-11 flex-1 rounded-md bg-[#258653] hover:bg-[#1d6c42]"><MessageCircle className="mr-1.5 h-4 w-4" />Call Panditji</Button>{bookingKnownUnavailable ? <div className="flex flex-1 items-center justify-center text-center text-[10px] leading-4 text-[#735E54]">Managed booking unavailable</div> : <Button onClick={() => book()} variant="outline" className="h-11 flex-1 rounded-md"><CalendarDays className="mr-1.5 h-4 w-4" />Book</Button>}</div>
    {shareOpen && <div className="fixed right-3 top-16 z-50 w-64 rounded-xl border border-[#E0CEB5] bg-[#FFFDF9] p-4 shadow-xl"><div className="flex items-center justify-between text-sm font-semibold text-[#531D28]">Share storefront <button onClick={() => setShareOpen(false)} aria-label="Close share menu"><X className="h-4 w-4" /></button></div><p className="mt-2 break-all text-xs text-[#876F61]">{shareUrl}</p><Button onClick={copyLink} className="mt-3 w-full rounded-md bg-[#8D2830]"><Copy className="mr-2 h-3.5 w-3.5" />{copied ? "Copied" : "Copy link"}</Button></div>}
    {lightbox >= 0 && gallery[lightbox]?.mediaUrl && <div role="dialog" aria-modal="true" aria-label="Gallery preview" className="fixed inset-0 z-[60] grid place-items-center bg-[#2D1015]/90 p-5" onClick={() => setLightbox(-1)}><button onClick={() => setLightbox(-1)} aria-label="Close gallery" className="absolute right-5 top-5 text-[#FFF8E8]"><X /></button><img src={gallery[lightbox].mediaUrl} alt={gallery[lightbox].altText || "Gallery preview"} className="max-h-[85vh] max-w-full object-contain" onClick={e => e.stopPropagation()} /></div>}
    <Dialog open={contactOpen} onOpenChange={open => { setContactOpen(open); if (!open) { setContactError(""); setRevealedContact(null); } }}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{revealedContact ? `Contact ${displayName}` : "Call Panditji"}</DialogTitle><DialogDescription>{revealedContact ? "This contact was authorized through Vedic Tatva. Use your phone’s native dialer to call." : !access ? "We could not verify direct-contact access. Please try again before requesting contact details." : access.policy === "disabled" ? "Direct contact is disabled for this profile by the current contact policy." : !access.available ? "This Panditji has no usable direct contact method at this time. No contact reveal has been used." : access.policy === "login_required" && !access.authenticated ? "Login to view contact details. Your contact allowance is applied only after an authorized reveal." : access.quota?.remaining === 0 ? "You've used all 10 free unique Pandit contacts for this 12-month period. Previously revealed contacts remain available without using another credit." : access.policy === "open" ? "Contact is available without signing in." : `${access.quota?.remaining ?? "—"} of 10 unique contact reveals remaining.`}</DialogDescription></DialogHeader>
        {contactError && <p role="alert" className="rounded-md bg-rose-50 p-3 text-sm text-rose-800">{contactError}</p>}
        {revealedContact ? <div className="space-y-2 rounded-lg border border-[#E3D2BA] bg-[#FFF9F0] p-4 text-sm">{revealedContact.phone && <a href={`tel:${revealedContact.phone}`} onClick={() => trackPanditFunnelEvent("click_to_call", { slug, source: "storefront" })} className="block font-semibold text-[#531D28]">Call Panditji</a>}{revealedContact.whatsappNumber && <a href={`https://wa.me/${revealedContact.whatsappNumber.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="block font-semibold text-[#216D45]">Message on WhatsApp</a>}</div> : !access ? <Button onClick={() => contactStatus.refetch()} className="w-full bg-[#8D2830]">Check contact access</Button> : access.policy === "disabled" || !access.available ? <p className="rounded-md bg-[#FFF9F0] p-3 text-sm text-[#735E54]">You can continue to explore this profile and its services.{bookingKnownUnavailable ? " Managed booking is also unavailable for this profile." : ""}</p> : access.policy === "login_required" && !access.authenticated ? <Button onClick={loginForContact} className="w-full bg-[#8D2830]">Login to view contact details</Button> : access.quota?.remaining === 0 ? bookingEligible ? <Button onClick={() => { setContactOpen(false); book(); }} className="w-full bg-[#8D2830]">Book through Vedic Tatva</Button> : <p className="rounded-md bg-[#FFF9F0] p-3 text-sm text-[#735E54]">Managed booking is not available for this profile. You can continue to view the profile and published services.</p> : <Button onClick={revealContact} disabled={revealBusy || contactStatus.isLoading} className="w-full bg-[#8D2830]">{revealBusy ? "Revealing…" : "Reveal contact"}</Button>}
      </DialogContent>
    </Dialog>
  </div>;
}
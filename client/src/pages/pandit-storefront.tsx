import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight, CalendarDays, Check, CheckCircle2,
  Clock3, Copy, Globe2, Languages, MapPin, Menu, MessageCircle, Package,
  Share2, ShieldCheck, ShoppingBag, Sparkles, Star, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import PageSeo from "@/components/PageSeo";
import { useConsentPreferences } from "@/lib/consent";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/lib/cart";
import { trackPanditSeoEvent } from "@/lib/analytics";
import { bookingContextParams } from "@/lib/puja-service-map";

type Service = {
  id: number; masterServiceId: number; name: string; slug: string; category?: string; description?: string;
  price?: number; durationMinutes?: number; mode?: string; preparation?: string;
  inclusions?: string[]; serviceAreas?: string[];
};
type StorefrontDto = {
  pandit: {
    id: number; cityId?: number; stateId?: number; name: string; slug?: string; title?: string; city?: string; state?: string;
    regionalOrigin?: string; specialization?: string[] | string; languages?: string[] | string;
    experience?: number; fees?: number; rating?: number; reviewCount?: number; verified?: boolean;
    image?: string; bio?: string; education?: string;
  };
  storefront?: {
    bio?: string | null; tagline?: string | null; themeColor?: string | null; bannerImage?: string | null;
    featuredPujas?: string[]; customPujaEnabled?: boolean;
    social?: { youtube?: string | null; instagram?: string | null; facebook?: string | null; website?: string | null };
  } | null;
  services?: Service[];
  packages?: Array<{ id: number; name: string; description?: string; price?: number; compareAtPrice?: number; durationMinutes?: number; items?: Array<{ panditServiceId: number; displayOrder?: number }> }>;
  gallery?: Array<{ id: number; mediaUrl?: string; altText?: string; caption?: string; mediaKind?: string }>;
  availability?: Array<{ weekday: number; startMinutes: number; endMinutes: number; timezone: string; mode: string }>;
  products?: Array<{ id: number; name: string; price: number; salePrice?: number | null; image?: string; slug?: string }>;
  reviews?: Array<{ id: number; rating: number; comment?: string; userName?: string; reviewerName?: string; serviceType?: string }>;
  canonicalUrl?: string;
  indexability?: { status: string; indexable: boolean; reasons: string[] };
  seo?: {
    title: string; description: string; canonical: string; ogImage?: string; ogType: "profile";
    robotsIndex: boolean; robotsFollow: boolean;
    jsonLd: Array<{ id: string; payload: Record<string, any> }>;
  };
};

const money = (n?: number) => typeof n === "number" ? `₹${n.toLocaleString("en-IN")}` : "Price on request";
const listify = (value?: string[] | string) => Array.isArray(value) ? value : value ? value.split(",").map(x => x.trim()).filter(Boolean) : [];

function bookingHref(pandit: StorefrontDto["pandit"], service?: Service, packageId?: number) {
  const source = typeof window !== "undefined" ? window.location.search : "";
  const params = bookingContextParams(source, pandit.id);
  params.set("source", "storefront");
  if (service) {
    params.delete("packageId");
    params.set("serviceId", String(service.id));
    params.set("masterServiceId", String(service.masterServiceId));
    if (pandit.cityId) params.set("cityId", String(pandit.cityId));
    if (pandit.stateId) params.set("stateId", String(pandit.stateId));
    params.delete("service");
    params.delete("pujaType");
    params.set("mode", service.mode === "online" ? "online" : "offline");
  }
  if (packageId) {
    params.delete("serviceId");
    params.delete("masterServiceId");
    params.delete("service");
    params.delete("pujaType");
    params.set("packageId", String(packageId));
  }
  return `/online-puja-booking?${params.toString()}`;
}

function SectionHeading({ eyebrow, title, copy }: { eyebrow: string; title: string; copy?: string }) {
  return <div className="mb-7 max-w-2xl">
    <div className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#A86C1B]">{eyebrow}</div>
    <h2 className="mt-2 text-3xl sm:text-4xl text-[#5B1D27]">{title}</h2>
    {copy && <p className="mt-2 text-sm leading-6 text-[#6D5A50]">{copy}</p>}
  </div>;
}

function ServiceCard({ service, pandit }: { service: Service; pandit: StorefrontDto["pandit"] }) {
  return <Card className="group relative flex h-full flex-col overflow-hidden rounded-[4px] border-[#D5AE59]/35 bg-[#FFFDF7] shadow-[0_12px_36px_rgba(91,29,39,.06)] transition-transform duration-300 hover:-translate-y-1">
    <div className="h-1 bg-[#A33B29]" />
    <div className="flex flex-1 flex-col p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div><span className="text-[10px] font-bold uppercase tracking-[.2em] text-[#A86C1B]">{service.category || "Vedic ceremony"}</span><h3 className="mt-2 text-xl text-[#5B1D27]">{service.name}</h3></div>
        <Badge variant="outline" className="rounded-none border-[#D5AE59]/60 bg-[#FBF0D4] text-[10px] text-[#6B351E]">{service.mode === "in_person" ? "In person" : service.mode === "hybrid" ? "Hybrid" : "Online"}</Badge>
      </div>
      {service.description && <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#715F55]">{service.description}</p>}
      {service.inclusions?.length ? <div className="mt-4 space-y-1.5">{service.inclusions.slice(0, 3).map(item => <div key={item} className="flex gap-2 text-xs text-[#6D5A50]"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#A86C1B]" />{item}</div>)}</div> : null}
      <div className="mt-auto flex items-end justify-between gap-3 border-t border-[#E8D9B7] pt-5">
        <div><div className="flex items-center gap-1.5 text-xs text-[#806E62]"><Clock3 className="h-3.5 w-3.5" />{service.durationMinutes ? `${service.durationMinutes} minutes` : "Duration confirmed in booking"}</div><div className="mt-1 text-2xl font-semibold text-[#7C291F]">{money(service.price)}</div></div>
        <Link href={bookingHref(pandit, service)} onClick={() => { const mode = service.mode === "online" ? "online" : service.mode === "hybrid" ? "hybrid" : "offline"; trackPanditSeoEvent("discovery_cta", { slug: service.slug, mode, source: "storefront" }); trackPanditSeoEvent("booking_handoff", { slug: pandit.slug || service.slug, mode, source: "storefront" }); }} className="inline-flex"><Button className="rounded-none bg-[#7C291F] text-[#FFF8E8] hover:bg-[#5B1D27]">Book service <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
      </div>
    </div>
  </Card>;
}

export default function PanditStorefrontPage() {
  const { slug: rawSlug } = useParams<{ slug: string }>();
  const slug = (rawSlug || "").toLowerCase();
  const [, navigate] = useLocation();
  const { requireAuth } = useAuth();
  const { toast } = useToast();
  const { addToCart } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [category, setCategory] = useState("All");
  const [lightbox, setLightbox] = useState(-1);
  const [copied, setCopied] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const consent = useConsentPreferences();
  const { data, isLoading, isError, refetch } = useQuery<StorefrontDto>({
    queryKey: ["/api/storefront", slug], enabled: !!slug,
    queryFn: async () => { const response = await fetch(`/api/storefront/${encodeURIComponent(slug)}`); if (!response.ok) throw new Error("Storefront unavailable"); return response.json(); },
  });
  useEffect(() => {
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    if (consent?.marketing && slug) {
      document.cookie = `vt_ref=${encodeURIComponent(slug)}; Path=/; Max-Age=${30 * 24 * 60 * 60}; SameSite=Lax${secure}`;
    } else {
      document.cookie = `vt_ref=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
    }
  }, [consent?.marketing, slug]);
  useEffect(() => {
    if (data?.pandit) trackPanditSeoEvent("discovery_impression", { slug, source: "storefront" });
  }, [data?.pandit, slug]);
  useEffect(() => {
    if (lightbox < 0) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setLightbox(-1); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightbox]);

  const canonicalPath = data?.canonicalUrl || `/pandit/${slug}`;
  const shareUrl = typeof window !== "undefined" ? new URL(canonicalPath, window.location.origin).toString() : canonicalPath;
  const pandit = data?.pandit;
  const storefront = data?.storefront;
  const services = data?.services || [];
  const categories = useMemo(() => ["All", ...Array.from(new Set(services.map(s => s.category).filter(Boolean) as string[]))], [services]);
  const filteredServices = category === "All" ? services : services.filter(s => s.category === category);
  const languages = listify(pandit?.languages);
  const specializations = listify(pandit?.specialization);
  const reviews = data?.reviews || [];
  const gallery = data?.gallery || [];

  if (isLoading) return <div className="min-h-[100dvh] bg-[#FBF4E3] p-5"><div className="mx-auto max-w-6xl animate-pulse space-y-5"><div className="h-5 w-40 bg-[#E8D9B7]" /><div className="h-[430px] rounded-sm bg-[#E8D9B7]" /><div className="h-10 w-64 bg-[#E8D9B7]" /><div className="grid gap-4 md:grid-cols-3"><div className="h-52 bg-[#E8D9B7]" /><div className="h-52 bg-[#E8D9B7]" /><div className="h-52 bg-[#E8D9B7]" /></div></div></div>;
  if (isError || !data || !pandit) return <div className="grid min-h-[100dvh] place-items-center bg-[#FBF4E3] px-6 text-center"><div><div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-full border border-[#D5AE59] text-[#7C291F]"><ShieldCheck /></div><h1 className="text-3xl text-[#5B1D27]">This storefront is unavailable</h1><p className="mt-2 text-sm text-[#715F55]">The page may be unpublished or the link may have changed.</p><div className="mt-6 flex justify-center gap-3"><Button onClick={() => refetch()} variant="outline" className="rounded-none border-[#7C291F] text-[#7C291F]">Try again</Button><Link href="/book-pandit-online" className="inline-flex"><Button className="rounded-none bg-[#7C291F]">Browse Pandits</Button></Link></div></div></div>;

  const book = () => {
    trackPanditSeoEvent("discovery_cta", { slug, source: "storefront" });
    trackPanditSeoEvent("booking_handoff", { slug, source: "storefront" });
    navigate(bookingHref(pandit));
  };
  const chat = () => requireAuth(
    () => navigate(bookingHref(pandit)),
    { title: "Sign in to continue", description: "Continue to booking to share your ceremony requirements." },
  );
  const copyLink = async () => { try { await navigator.clipboard.writeText(shareUrl); setCopied(true); toast({ title: "Storefront link copied", description: "Share this page with your family." }); setTimeout(() => setCopied(false), 1800); } catch { toast({ title: "Copy unavailable", description: shareUrl }); } };
  const customRequest = chat;

  return <div className="min-h-[100dvh] overflow-x-hidden bg-[#FBF4E3] text-[#4D312A]">
    <PageSeo
      title={data.seo?.title || `${pandit.name} — ${pandit.verified ? "Verified " : ""}Vedic Pandit | Vedic Tatva`}
      description={data.seo?.description || storefront?.tagline || storefront?.bio || pandit.bio || `View services and request a booking with ${pandit.name}.`}
      canonical={data.seo?.canonical || `/pandit/${slug}`}
      ogType="profile"
      ogImage={data.seo?.ogImage || pandit.image || storefront?.bannerImage || undefined}
      noindex={data.seo ? !data.seo.robotsIndex : false}
      schemas={data.seo?.jsonLd as any}
    />
    <div className="bg-[#5B1D27] px-4 py-2 text-center text-[10px] font-semibold uppercase tracking-[.22em] text-[#F7D889]">Official Vedic Tatva storefront · secure in-app booking</div>
    <header className="sticky top-0 z-30 border-b border-[#D5AE59]/35 bg-[#FBF4E3]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4"><Link href={`/pandit/${slug}`} className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full border border-[#B98228] text-[#7C291F]"><Sparkles className="h-4 w-4" /></span><span><span className="block text-[11px] font-bold uppercase tracking-[.2em] text-[#7C291F]">Vedic Tatva</span><span className="block text-[11px] text-[#806E62]">{pandit.title || "Pandit"} {pandit.name}</span></span></Link><nav className="hidden items-center gap-7 text-xs font-semibold text-[#6D5A50] md:flex">{[["Services","services"],["Packages","packages"],["About","about"],["Reviews","reviews"],["Gallery","gallery"]].map(([label,id]) => <a key={id} href={`#${id}`} className="transition-colors hover:text-[#7C291F]">{label}</a>)}<button onClick={() => setShareOpen(v => !v)} aria-label="Share storefront" className="text-[#7C291F]"><Share2 className="h-4 w-4" /></button><Button onClick={book} className="rounded-none bg-[#C46B24] text-[#FFF8E8] hover:bg-[#A9511E]">Book a Puja</Button></nav><button className="md:hidden" aria-label={menuOpen ? "Close menu" : "Open menu"} onClick={() => setMenuOpen(v => !v)}>{menuOpen ? <X /> : <Menu />}</button></div>
      {menuOpen && <nav className="border-t border-[#D5AE59]/25 px-5 py-4 md:hidden"><div className="grid gap-3 text-sm">{["services","packages","about","reviews","gallery"].map(id => <a key={id} href={`#${id}`} onClick={() => setMenuOpen(false)} className="capitalize text-[#6D5A50]">{id}</a>)}<Button onClick={book} className="mt-1 rounded-none bg-[#7C291F]">Book a Puja</Button></div></nav>}
    </header>

    <main>
      <section className="relative isolate overflow-hidden border-b border-[#D5AE59]/25 bg-[#7C291F] text-[#FFF8E8]">
        <div className="absolute inset-0 opacity-35" style={{ backgroundImage: "radial-gradient(circle at 80% 20%, #F3D477 0 1px, transparent 1px)", backgroundSize: "22px 22px" }} />
        <div className="relative mx-auto grid max-w-6xl items-center gap-8 px-5 py-14 sm:py-20 lg:grid-cols-[1.05fr_.95fr]">
          <div className="order-2 lg:order-1">{pandit.verified && <div className="mb-5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.3em] text-[#F4D47F]"><CheckCircle2 className="h-4 w-4" />Verified Vedic Pandit</div>}<h1 className="max-w-xl text-5xl leading-[.98] sm:text-7xl">{storefront?.tagline || `${pandit.title || "Pandit"} ${pandit.name}`}</h1><p className="mt-6 max-w-lg text-base leading-7 text-[#FBE9C9]/80">{storefront?.bio || pandit.bio || "View published services and request a booking through Vedic Tatva."}</p><div className="mt-8 flex flex-wrap gap-3"><Button onClick={book} className="h-12 rounded-none bg-[#F2B544] px-6 text-[#5B1D27] hover:bg-[#F7D889]"><CalendarDays className="mr-2 h-4 w-4" />Book a Puja</Button><Button variant="outline" onClick={chat} className="h-12 rounded-none border-[#FBE9C9]/45 bg-transparent px-6 text-[#FFF8E8] hover:bg-[#FFF8E8]/10"><MessageCircle className="mr-2 h-4 w-4" />Share requirements</Button></div><div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-xs text-[#FBE9C9]/75">{pandit.city && <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4 text-[#F2B544]" />{pandit.city}{pandit.state ? `, ${pandit.state}` : ""}</span>}{languages.length > 0 && <span className="inline-flex items-center gap-2"><Languages className="h-4 w-4 text-[#F2B544]" />{languages.join(" · ")}</span>}{pandit.experience ? <span>{pandit.experience}+ years of practice</span> : null}</div></div>
          <div className="order-1 lg:order-2"><div className="relative mx-auto max-w-md"><div className="absolute -inset-4 rounded-[50%] border border-[#F2B544]/35" /><div className="aspect-[4/5] overflow-hidden rounded-[3px] border-8 border-[#E9C56D]/45 bg-[#B9532E] shadow-2xl">{storefront?.bannerImage || pandit.image ? <img src={storefront?.bannerImage || pandit.image} alt={`${pandit.name}, ${pandit.title || "Vedic Pandit"}`} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center bg-[#B9532E] text-8xl text-[#FBE9C9]">{pandit.name.charAt(0)}</div>}</div><div className="absolute -bottom-5 -left-3 max-w-[230px] border border-[#D5AE59]/70 bg-[#FFF8E8] p-4 text-[#5B1D27] shadow-xl sm:-left-8"><div className="text-[10px] font-bold uppercase tracking-[.2em] text-[#A86C1B]">{pandit.title || "Pandit"}</div><div className="mt-1 text-xl">{pandit.name}</div>{pandit.rating ? <div className="mt-2 flex items-center gap-1 text-xs"><Star className="h-3.5 w-3.5 fill-[#C98B20] text-[#C98B20]" />{pandit.rating.toFixed(1)} · {pandit.reviewCount || 0} reviews</div> : null}</div></div></div>
        </div>
      </section>

      <section className="border-b border-[#D5AE59]/30 bg-[#F7EBD1]"><div className="mx-auto grid max-w-6xl grid-cols-2 divide-x divide-[#D5AE59]/35 sm:grid-cols-4">{[...(pandit.verified ? [{i:ShieldCheck,t:"Verified profile"}] : []),{i:CalendarDays,t:"Booking pathway"},{i:MessageCircle,t:"Share requirements"},{i:Globe2,t:"Published services"}].map(({i:Icon,t}) => <div key={t} className="flex items-center gap-3 px-5 py-5 text-xs font-semibold text-[#6D5A50]"><Icon className="h-5 w-5 text-[#A86C1B]" />{t}</div>)}</div></section>

      <section id="services" className="mx-auto max-w-6xl px-5 py-16 sm:py-24"><SectionHeading eyebrow="The ceremony catalogue" title="Choose what your family needs" copy="Each offering is described plainly so you can prepare with confidence. Final availability and price are confirmed by the booking service." /><div className="mb-8 flex flex-wrap gap-2" role="tablist" aria-label="Service categories">{categories.map(item => <button key={item} role="tab" aria-selected={category === item} onClick={() => setCategory(item)} className={`rounded-full border px-4 py-2 text-xs font-semibold transition-colors ${category === item ? "border-[#7C291F] bg-[#7C291F] text-[#FFF8E8]" : "border-[#D5AE59]/60 text-[#7C291F] hover:bg-[#F7EBD1]"}`}>{item}</button>)}</div>{filteredServices.length ? <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{filteredServices.map(service => <ServiceCard key={service.id} service={service} pandit={pandit} />)}</div> : <div className="border border-dashed border-[#D5AE59] p-10 text-center text-sm text-[#806E62]">Services will appear here when published.</div>}</section>

      {!!data.packages?.length && <section id="packages" className="bg-[#F1DFC0]"><div className="mx-auto max-w-6xl px-5 py-16 sm:py-24"><SectionHeading eyebrow="Curated combinations" title="Puja packages for meaningful milestones" copy="Thoughtful collections of services, arranged for the moments your family will remember." /><div className="grid gap-5 md:grid-cols-2">{data.packages.map(pkg => <Card key={pkg.id} className="rounded-none border-[#C9953B]/40 bg-[#FFF8E8] p-6"><div className="flex items-start justify-between gap-4"><div><h3 className="text-2xl text-[#5B1D27]">{pkg.name}</h3><p className="mt-2 text-sm leading-6 text-[#715F55]">{pkg.description}</p></div><Package className="h-6 w-6 text-[#A86C1B]" /></div>{pkg.items?.length ? <div className="mt-5 space-y-2">{pkg.items.map(item => { const service = services.find(candidate => candidate.id === item.panditServiceId); return service ? <div key={item.panditServiceId} className="flex items-center gap-2 text-xs text-[#6D5A50]"><Check className="h-3.5 w-3.5 text-[#A86C1B]" />{service.name}</div> : null; })}</div> : null}<div className="mt-6 flex items-end justify-between border-t border-[#D5AE59]/35 pt-5"><div><span className="text-2xl font-semibold text-[#7C291F]">{money(pkg.price)}</span>{pkg.compareAtPrice && pkg.compareAtPrice > (pkg.price || 0) ? <span className="ml-2 text-xs text-[#806E62] line-through">{money(pkg.compareAtPrice)}</span> : null}</div><Link href={bookingHref(pandit, undefined, pkg.id)} className="inline-flex"><Button className="rounded-none bg-[#7C291F]">Book package <ArrowRight className="ml-2 h-4 w-4" /></Button></Link></div></Card>)}</div></div></section>}

      {!!data.products?.length && <section className="mx-auto max-w-6xl px-5 py-16 sm:py-20"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><SectionHeading eyebrow="For the home altar" title="Recommended samagri" copy="A small selection of essentials, kept separate from your ceremony booking." /><Link href={`/puja-samagri-online?ref=${encodeURIComponent(slug)}`} className="mb-7 inline-flex shrink-0 items-center text-xs font-bold text-[#7C291F]">Shop all <ArrowRight className="ml-2 h-4 w-4" /></Link></div><div className="grid grid-cols-2 gap-4 sm:grid-cols-4">{data.products.map(product => <Card key={product.id} className="flex flex-col overflow-hidden rounded-none border-[#D5AE59]/35 bg-[#FFFDF7]"><Link href={`/product/${product.slug || product.id}?ref=${encodeURIComponent(slug)}`} className="block aspect-square overflow-hidden bg-[#F1DFC0]">{product.image ? <img src={product.image} alt={product.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 hover:scale-105" /> : <div className="grid h-full place-items-center text-[#A86C1B]"><ShoppingBag className="h-8 w-8" /></div>}</Link><div className="flex flex-1 flex-col p-3"><Link href={`/product/${product.slug || product.id}?ref=${encodeURIComponent(slug)}`} className="line-clamp-2 min-h-10 text-sm font-semibold text-[#5B1D27]">{product.name}</Link><div className="mt-2 text-base font-semibold text-[#7C291F]">{money(product.salePrice ?? product.price)}</div><Button onClick={() => { addToCart({ ...product, price: product.salePrice ?? product.price } as any, 1); toast({ title: "Added to cart", description: product.name }); }} className="mt-auto rounded-none bg-[#7C291F] text-xs hover:bg-[#5B1D27]"><ShoppingBag className="mr-1.5 h-3.5 w-3.5" />Add to cart</Button></div></Card>)}</div></section>}

      {(storefront?.bio || pandit.bio || languages.length || specializations.length) ? <section id="about" className="mx-auto grid max-w-6xl gap-10 px-5 py-16 sm:py-24 lg:grid-cols-[1fr_.7fr]"><div><SectionHeading eyebrow="The person behind the ritual" title={`Meet ${pandit.title || "Pandit"} ${pandit.name}`} /><p className="max-w-2xl whitespace-pre-line text-base leading-8 text-[#6D5A50]">{storefront?.bio || pandit.bio}</p></div><div className="border-l-2 border-[#D5AE59] pl-6"><h3 className="text-xl text-[#5B1D27]">A practice rooted in care</h3><div className="mt-5 space-y-4 text-sm text-[#6D5A50]">{languages.length > 0 && <div><div className="mb-1 text-[10px] font-bold uppercase tracking-[.2em] text-[#A86C1B]">Languages</div>{languages.join(" · ")}</div>}{specializations.length > 0 && <div><div className="mb-1 text-[10px] font-bold uppercase tracking-[.2em] text-[#A86C1B]">Specialization</div>{specializations.join(" · ")}</div>}{pandit.education && <div><div className="mb-1 text-[10px] font-bold uppercase tracking-[.2em] text-[#A86C1B]">Study</div>{pandit.education}</div>}</div></div></section> : null}

      {!!data.availability?.length && <section className="border-y border-[#D5AE59]/30 bg-[#F7EBD1]"><div className="mx-auto flex max-w-6xl flex-col gap-5 px-5 py-10 sm:flex-row sm:items-center sm:justify-between"><div><div className="text-[10px] font-bold uppercase tracking-[.25em] text-[#A86C1B]">Availability</div><h2 className="mt-2 text-2xl text-[#5B1D27]">Plan your ceremony with clarity</h2><p className="mt-2 text-sm text-[#715F55]">Configured for {Array.from(new Set(data.availability.map(rule => rule.mode))).join(", ")} · {data.availability[0].timezone}. Final slots are confirmed during booking.</p></div><Button onClick={book} className="rounded-none bg-[#C46B24]">View booking times <ArrowRight className="ml-2 h-4 w-4" /></Button></div></section>}

      {!!reviews.length && <section id="reviews" className="mx-auto max-w-6xl px-5 py-16 sm:py-24"><SectionHeading eyebrow="Published reviews" title={`Reviews for ${pandit.name}`} /><div className="grid gap-5 md:grid-cols-3">{reviews.slice(0, 6).map(review => <Card key={review.id} className="rounded-none border-[#D5AE59]/35 bg-[#FFFDF7] p-5"><div className="flex gap-1">{[1,2,3,4,5].map(i => <Star key={i} className={`h-4 w-4 ${i <= review.rating ? "fill-[#C98B20] text-[#C98B20]" : "text-[#D8CDB5]"}`} />)}</div>{review.comment && <p className="mt-4 text-sm leading-6 text-[#6D5A50]">“{review.comment}”</p>}<div className="mt-5 text-xs font-bold text-[#7C291F]">{review.userName || review.reviewerName || "Devotee"}{review.serviceType ? <span className="font-normal text-[#806E62]"> · {review.serviceType}</span> : null}</div></Card>)}</div></section>}

      {!!gallery.length && <section id="gallery" className="bg-[#5B1D27] px-5 py-16 text-[#FFF8E8] sm:py-24"><div className="mx-auto max-w-6xl"><div className="mb-7 max-w-2xl"><div className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#F2B544]">From recent ceremonies</div><h2 className="mt-2 text-3xl text-[#FFF8E8] sm:text-4xl">A glimpse into the work</h2><p className="mt-2 text-sm leading-6 text-[#FBE9C9]/75">Published moments shared by this Pandit.</p></div><div className="columns-2 gap-4 sm:columns-3">{gallery.map((item, index) => item.mediaUrl ? <button key={item.id} onClick={() => setLightbox(index)} className="mb-4 block w-full break-inside-avoid text-left"><img src={item.mediaUrl} alt={item.altText || item.caption || "Ceremony gallery image"} loading="lazy" className="w-full rounded-[2px] object-cover transition-opacity hover:opacity-80" /><span className="mt-2 block text-xs text-[#FBE9C9]/70">{item.caption}</span></button> : null)}</div></div></section>}

      {storefront?.customPujaEnabled && <section className="mx-auto max-w-6xl px-5 py-14"><div className="flex flex-col items-start justify-between gap-6 border border-[#D5AE59]/60 bg-[#F1DFC0] p-7 sm:flex-row sm:items-center"><div><div className="text-[10px] font-bold uppercase tracking-[.25em] text-[#A86C1B]">Have a particular sankalp?</div><h2 className="mt-2 text-2xl text-[#5B1D27]">Discuss a custom puja privately</h2><p className="mt-2 max-w-xl text-sm leading-6 text-[#715F55]">Share your family’s needs in private chat. Scope and final price are confirmed inside Vedic Tatva.</p></div><Button onClick={customRequest} className="rounded-none bg-[#7C291F]">Start private chat <MessageCircle className="ml-2 h-4 w-4" /></Button></div></section>}

      <footer className="bg-[#5B1D27] px-5 py-12 pb-28 text-[#FBE9C9] md:pb-12"><div className="mx-auto grid max-w-6xl gap-8 sm:grid-cols-3"><div><div className="text-lg">Vedic Tatva</div><p className="mt-2 text-sm text-[#FBE9C9]/65">A trusted digital home for sacred services.</p></div><div><div className="text-[10px] font-bold uppercase tracking-[.2em] text-[#F2B544]">Share this storefront</div><div className="mt-3 flex flex-wrap gap-2"><Button onClick={copyLink} variant="outline" className="rounded-none border-[#FBE9C9]/30 bg-transparent text-[#FBE9C9]">{copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}{copied ? "Copied" : "Copy link"}</Button><Button onClick={() => setShareOpen(v => !v)} variant="outline" className="rounded-none border-[#FBE9C9]/30 bg-transparent text-[#FBE9C9]"><Share2 className="mr-2 h-4 w-4" />Share</Button></div></div><div className="sm:text-right"><div className="text-[10px] font-bold uppercase tracking-[.2em] text-[#F2B544]">Canonical storefront</div><div className="mt-3 break-all text-xs text-[#FBE9C9]/65">{shareUrl}</div></div></div></footer>
    </main>
    <div className="fixed inset-x-0 bottom-0 z-40 flex gap-2 border-t border-[#D5AE59]/45 bg-[#FFF8E8]/95 p-3 pb-[calc(.75rem+env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(91,29,39,.12)] md:hidden"><Button onClick={chat} variant="outline" className="h-12 flex-1 rounded-none border-[#7C291F] text-[#7C291F]"><MessageCircle className="mr-2 h-4 w-4" />Chat</Button><Button onClick={book} className="h-12 flex-1 rounded-none bg-[#7C291F]"><CalendarDays className="mr-2 h-4 w-4" />Book</Button></div>
    {shareOpen && <div className="fixed right-5 top-20 z-50 w-64 border border-[#D5AE59] bg-[#FFF8E8] p-4 shadow-xl"><div className="flex items-center justify-between text-sm font-semibold text-[#5B1D27]">Share storefront <button onClick={() => setShareOpen(false)} aria-label="Close share menu"><X className="h-4 w-4" /></button></div><p className="mt-2 break-all text-xs text-[#806E62]">{shareUrl}</p><Button onClick={copyLink} className="mt-3 w-full rounded-none bg-[#7C291F]">{copied ? "Copied" : "Copy link"}</Button></div>}
    {lightbox >= 0 && gallery[lightbox]?.mediaUrl && <div role="dialog" aria-modal="true" aria-label="Gallery preview" className="fixed inset-0 z-[60] grid place-items-center bg-[#2D1015]/90 p-5" onClick={() => setLightbox(-1)}><button onClick={() => setLightbox(-1)} aria-label="Close gallery" className="absolute right-5 top-5 text-[#FFF8E8]"><X /></button><img src={gallery[lightbox].mediaUrl} alt={gallery[lightbox].altText || "Gallery preview"} className="max-h-[85vh] max-w-full object-contain" onClick={e => e.stopPropagation()} /></div>}
  </div>;
}
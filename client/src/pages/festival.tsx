import { useMemo } from "react";
import { Link, useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import PageSeo from "@/components/PageSeo";
import { event as eventSchema } from "@/lib/seo-schemas";
import { ArrowRight, Sparkles, ShoppingBag, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getFestivalById, getFestivalStartDate } from "@/lib/festivals";
import { getFestivalKit, FESTIVAL_KITS } from "@/lib/festival-kits";
import { FestivalCountdown } from "@/components/festival/FestivalCountdown";
import type { Product } from "@shared/schema";
import { useCart } from "@/lib/cart";
import { useToast } from "@/hooks/use-toast";
import { useI18n, getFestivalCopy } from "@/lib/i18n";

export default function FestivalLanding() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const cart = useCart();
  const { language } = useI18n();

  const festival = useMemo(() => getFestivalById(slug), [slug]);
  const kit = useMemo(() => (slug ? getFestivalKit(slug) : null), [slug]);

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    enabled: !!kit,
  });

  const startsAt = useMemo(() => {
    if (!festival) return new Date();
    const now = new Date();
    let d = getFestivalStartDate(festival, now.getFullYear());
    if (d.getTime() < now.getTime()) d = getFestivalStartDate(festival, now.getFullYear() + 1);
    return d;
  }, [festival]);

  const kitProducts = useMemo(() => {
    if (!kit) return [];
    const bySlug = new Map(products.map((p) => [p.slug || "", p]));
    return kit.productSlugs
      .map((s) => bySlug.get(s))
      .filter((p): p is Product => !!p);
  }, [products, kit]);

  if (!festival) {
    const nfCopy = getFestivalCopy(language, "", "");
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FBF7EE] p-8 text-center">
        <p className="text-xl font-bold text-[#6D2B35] mb-2">{nfCopy.notFoundTitle}</p>
        <p className="text-sm text-[#5a4a3a]/70 mb-6">{nfCopy.notFoundBrowse}</p>
        <div className="flex flex-wrap justify-center gap-2 max-w-2xl">
          {Object.values(FESTIVAL_KITS).map((k) => (
            <Link key={k.id} href={`/festival/${k.id}`}>
              <Badge variant="outline" className="cursor-pointer">{k.id.replace(/-/g, " ")}</Badge>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  const kitTotal = kitProducts.reduce((sum, p) => sum + Number(p.price || 0), 0);

  function addAllToCart() {
    let added = 0;
    for (const p of kitProducts) {
      try {
        cart.addToCart(p, 1);
        added++;
      } catch {}
    }
    toast({ title: fcopy.itemsAddedToast(added), description: fcopy.itemsAddedDesc });
  }

  const fcopy = getFestivalCopy(language, festival.name, festival.nameHi);
  const isHi = language === "hi";
  const heroBlurb = isHi
    ? (kit?.blurbHi || festival.taglineHi)
    : (kit?.blurb || festival.tagline);
  const hero = `linear-gradient(135deg, ${festival.palette.from} 0%, ${festival.palette.via} 50%, ${festival.palette.to} 100%)`;

  return (
    <div className="min-h-screen bg-[#FBF7EE]" data-testid={`page-festival-${festival.id}`}>
      <PageSeo
        title={fcopy.metaTitle(new Date().getFullYear())}
        description={fcopy.metaDescription(heroBlurb)}
        ogType="article"
        canonical={`/festival/${festival.id}`}
        schemas={[
          eventSchema({
            name: festival.name,
            startDate: startsAt.toISOString(),
            // Hindu festivals run sunrise to sunrise — give crawlers an explicit
            // 24-hour window so the Event passes Google rich-result validation.
            endDate: new Date(startsAt.getTime() + 24 * 60 * 60 * 1000).toISOString(),
            description: kit?.blurb || festival.tagline,
            url: `/festival/${festival.id}`,
            organizerName: "Vedic Tatva",
            locationName: "Pan-India (online + at-home puja)",
            locationAddress: "India",
            eventStatus: "EventScheduled",
          }),
        ]}
      />
      {/* Hero with countdown */}
      <section className="relative overflow-hidden" style={{ background: hero }}>
        <div className="absolute inset-0 bg-black/30" />
        <div className="container mx-auto px-4 py-10 sm:py-16 relative">
          <Link href="/" className="inline-flex items-center gap-1 text-xs text-white/80 hover:text-white mb-4" data-testid="link-back-home">
            <ChevronLeft className="w-3.5 h-3.5" /> {fcopy.backHome}
          </Link>
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <p className="text-xs uppercase tracking-widest mb-2" style={{ color: festival.palette.accentSoft }}>
                {festival.date}
              </p>
              <h1 className="text-3xl sm:text-5xl font-bold text-white mb-2" data-testid="text-festival-name">
                {fcopy.displayName}
              </h1>
              <p className="text-lg sm:text-xl mb-3" style={{ color: festival.palette.accent }} data-testid="text-festival-name-hi">
                {fcopy.displayNameSecondary}
              </p>
              <p className="text-sm sm:text-base text-white/85 max-w-xl mb-6 leading-relaxed">
                {heroBlurb}
              </p>
              <div className="flex flex-wrap gap-2">
                {kitProducts.length > 0 && (
                  <Button
                    onClick={addAllToCart}
                    style={{ background: festival.palette.accent, color: "#1a1a1a" }}
                    className="font-bold border-0"
                    data-testid="btn-add-kit-to-cart"
                  >
                    <ShoppingBag className="w-4 h-4" /> {fcopy.addFullKit} · ₹{kitTotal.toLocaleString("en-IN")}
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="bg-white/10 backdrop-blur border-white/30 text-white hover:bg-white/20"
                  onClick={() => setLocation("/pandits")}
                  data-testid="btn-book-pandit"
                >
                  {fcopy.bookPandit} <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="md:justify-self-end">
              <div className="rounded-xl p-5 sm:p-6 backdrop-blur" style={{ background: "rgba(0,0,0,0.25)", border: `1px solid ${festival.palette.accent}33` }}>
                <p className="text-[10px] uppercase tracking-widest mb-3" style={{ color: festival.palette.accentSoft }}>
                  {fcopy.startsIn}
                </p>
                <FestivalCountdown startsAt={startsAt} theme={festival} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Curated kit */}
      {kit && (
        <section className="container mx-auto px-4 py-10">
          <div className="flex items-end justify-between gap-4 mb-5 flex-wrap">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#3A1018]">{fcopy.curatedKitHeading}</h2>
              <p className="text-sm text-[#5a4a3a]/70">{fcopy.curatedKitSubheading}</p>
            </div>
            {kitProducts.length > 0 && (
              <Badge variant="secondary" className="text-xs" data-testid="badge-kit-count">
                {fcopy.itemsCount(kitProducts.length, `₹${kitTotal.toLocaleString("en-IN")}`)}
              </Badge>
            )}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-56 rounded-md bg-[#F5F0E6] animate-pulse" />
              ))}
            </div>
          ) : kitProducts.length === 0 ? (
            <Card className="p-6 text-sm text-[#5a4a3a]/70" data-testid="text-kit-empty">
              {fcopy.kitEmpty}
              <Link href="/shop" className="ml-2 text-[#6D2B35] font-bold underline">{fcopy.shopNow}</Link>
            </Card>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {kitProducts.map((p) => (
                <Link key={p.id} href={`/product/${p.slug || p.id}`} data-testid={`link-kit-product-${p.id}`}>
                  <Card className="overflow-hidden hover-elevate h-full">
                    <div className="aspect-square bg-[#F5F0E6] overflow-hidden">
                      {p.image && <img src={p.image} alt={p.name} className="w-full h-full object-cover" loading="lazy" />}
                    </div>
                    <div className="p-3">
                      <p className="text-xs font-semibold text-[#3A1018] line-clamp-2 min-h-[2.5rem]">{p.name}</p>
                      <p className="text-sm font-bold text-[#6D2B35] mt-1">₹{Number(p.price).toLocaleString("en-IN")}</p>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Suggested services */}
      {kit && kit.services.length > 0 && (
        <section className="container mx-auto px-4 pb-12">
          <h2 className="text-xl sm:text-2xl font-bold text-[#3A1018] mb-5 flex items-center gap-2">
            <Sparkles className="w-5 h-5" style={{ color: festival.palette.via }} /> {fcopy.servicesHeading}
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {kit.services.map((s, i) => (
              <Link key={i} href={s.href} data-testid={`link-service-${i}`}>
                <Card className="p-5 hover-elevate h-full">
                  <p className="text-sm font-bold text-[#6D2B35] mb-1.5">{s.label}</p>
                  <p className="text-xs text-[#5a4a3a]/70 leading-relaxed mb-3">{s.description}</p>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#D4AF37]">
                    {fcopy.continue} <ArrowRight className="w-3 h-3" />
                  </span>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Other festivals nav */}
      <section className="container mx-auto px-4 pb-16">
        <h3 className="text-sm font-bold uppercase tracking-widest text-[#5a4a3a]/60 mb-3">{fcopy.otherFestivals}</h3>
        <div className="flex flex-wrap gap-2">
          {Object.values(FESTIVAL_KITS).filter((k) => k.id !== festival.id).map((k) => {
            const f = getFestivalById(k.id);
            if (!f) return null;
            return (
              <Link key={k.id} href={`/festival/${k.id}`} data-testid={`link-other-festival-${k.id}`}>
                <Badge variant="outline" className="cursor-pointer" style={{ borderColor: `${f.palette.via}55`, color: f.palette.via }}>
                  {language === "hi" ? f.nameHi : f.name}
                </Badge>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}

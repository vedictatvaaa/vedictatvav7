// =====================================================================
// Public Pandit Storefront page at /p/:slug
// Sells (a) the pandit's services, (b) curated shop products with
// referral attribution, (c) free QR card download. Brand: cream / maroon
// / gold. No emojis.
// =====================================================================
import { useEffect, useMemo } from "react";
import { useParams, useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  CheckCircle2, MapPin, Star, Phone, MessageCircle, Youtube, Instagram,
  Facebook, Globe, Download, ShoppingBag, Calendar, Languages, Crown,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PageSeo from "@/components/PageSeo";
import { useCart } from "@/lib/cart";
import { useToast } from "@/hooks/use-toast";

interface StorefrontDto {
  pandit: {
    id: number; name: string; slug: string; city: string; state?: string;
    regionalOrigin?: string; specialization?: string[]; languages?: string[];
    experience?: number; fees?: number; rating?: number; reviewCount?: number;
    verified?: boolean; image?: string; bio?: string; tier?: string; phone?: string;
  };
  storefront: {
    bio?: string | null; tagline?: string | null; themeColor?: string | null;
    bannerImage?: string | null; featuredPujas?: string[];
    social: { whatsapp?: string | null; youtube?: string | null; instagram?: string | null; facebook?: string | null; website?: string | null };
  } | null;
  products: Array<{ id: number; name: string; price: number; salePrice?: number | null; image?: string; slug?: string; description?: string }>;
  reviews: Array<{ id: number; rating: number; comment: string; userName?: string }>;
}

export default function PanditStorefrontPage() {
  const params = useParams<{ slug: string }>();
  const slug = (params.slug || "").toLowerCase();
  const [, navigate] = useLocation();

  // Stamp the ?ref cookie immediately on visit so attribution survives even
  // if the visitor navigates away to /shop/<slug> before checking out.
  useEffect(() => {
    if (!slug) return;
    if (typeof document === "undefined") return;
    document.cookie = `vt_ref=${encodeURIComponent(slug)}; path=/; max-age=${30 * 24 * 60 * 60}; samesite=lax`;
  }, [slug]);

  const { data, isLoading, error } = useQuery<StorefrontDto>({
    queryKey: ["/api/storefront", slug],
    enabled: !!slug,
  });
  const { addToCart } = useCart();
  const { toast } = useToast();

  const themeColor = data?.storefront?.themeColor || "#6D2B35";
  const qrUrl = useMemo(() => `/api/storefront/${slug}/qr.png`, [slug]);
  const cardPdfUrl = useMemo(() => `/api/storefront/${slug}/card.pdf`, [slug]);

  if (isLoading) {
    return <div className="min-h-screen bg-[#FFFAEC] grid place-items-center text-[#4a1a22]">Loading storefront…</div>;
  }
  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#FFFAEC] grid place-items-center px-4 text-center">
        <div>
          <h1 className="text-2xl font-bold text-[#4a1a22]">Storefront not found</h1>
          <p className="text-sm text-stone-600 mt-2">The pandit you are looking for is not available.</p>
          <Link href="/book-pandit-online"><Button className="mt-4">Browse all pandits</Button></Link>
        </div>
      </div>
    );
  }

  const { pandit, storefront, products, reviews } = data;
  const refQS = `?ref=${encodeURIComponent(slug)}`;

  return (
    <div className="min-h-screen bg-[#FFFAEC] text-[#4a1a22]">
      <PageSeo
        title={`${pandit.name} — Verified Vedic Pandit | Vedic Tatva`}
        description={storefront?.tagline || storefront?.bio?.slice(0, 160) || `Book pujas, shop curated samagri and connect with ${pandit.name}, verified by Vedic Tatva.`}
        canonical={`https://vedictatva.com/p/${slug}`}
        ogType="profile"
      />

      {/* Hero */}
      <header className="relative overflow-hidden" style={{ background: themeColor }}>
        <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/10 to-black/30" />
        <div className="relative max-w-5xl mx-auto px-4 py-10 sm:py-14 grid sm:grid-cols-[auto,1fr] gap-6 items-center">
          <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4" style={{ borderColor: "#D4AF37" }} data-testid="img-pandit-avatar">
            {pandit.image ? (
              <img src={pandit.image} alt={pandit.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full grid place-items-center bg-[#FFFAEC] text-[#6D2B35] text-3xl font-bold">{pandit.name.charAt(0)}</div>
            )}
          </div>
          <div className="text-[#FFFAEC]">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold" data-testid="text-pandit-name">{pandit.name}</h1>
              {(pandit as any).isOnline && (
                <div
                  className="inline-flex items-center gap-1.5 bg-emerald-600 text-white text-[11px] font-bold uppercase tracking-wide px-2.5 h-7 rounded-full mr-2"
                  data-testid="badge-pandit-online"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-white opacity-75 animate-ping" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                  </span>
                  Online now
                </div>
              )}
              {pandit.verified && (
                <Badge className="bg-[#D4AF37] text-[#4a1a22] border-0">
                  <CheckCircle2 className="w-3 h-3 mr-1" />Verified
                </Badge>
              )}
              {pandit.tier && pandit.tier !== "free" && (() => {
                const t = pandit.tier === "platinum" ? "guru_elite" : pandit.tier;
                const label = t === "guru_elite" ? "Guru Elite" : t.charAt(0).toUpperCase() + t.slice(1);
                const isElite = t === "guru_elite";
                return (
                  <Badge className={isElite
                    ? "bg-[#D4AF37] text-[#4a1a22] border-0 font-bold"
                    : "bg-[#FFFAEC]/20 text-[#FFFAEC] border-[#D4AF37]/40"}>
                    {isElite && <Crown className="w-3 h-3 mr-1" />}{label}{isElite ? " Premium" : ""}
                  </Badge>
                );
              })()}
            </div>
            {storefront?.tagline && <p className="mt-2 text-[#FFFAEC]/90 text-sm sm:text-base">{storefront.tagline}</p>}
            <div className="flex items-center gap-3 mt-3 flex-wrap text-sm text-[#FFFAEC]/85">
              <span className="inline-flex items-center gap-1"><MapPin className="w-4 h-4" />{pandit.city}{pandit.state ? `, ${pandit.state}` : ""}</span>
              {!!pandit.experience && <span>· {pandit.experience}+ yrs experience</span>}
              {!!pandit.rating && (
                <span className="inline-flex items-center gap-1">
                  · <Star className="w-4 h-4 fill-[#D4AF37] text-[#D4AF37]" />
                  {pandit.rating.toFixed(1)} ({pandit.reviewCount || 0})
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              <Link href={`/puja${refQS}`}>
                <Button className="bg-[#D4AF37] text-[#4a1a22] hover:bg-[#D4AF37] border border-[#D4AF37]" data-testid="button-book-puja">
                  <Calendar className="w-4 h-4 mr-2" />Book a Puja
                </Button>
              </Link>
              {storefront?.social?.whatsapp && (
                <a
                  href={`https://wa.me/${(storefront.social.whatsapp || "").replace(/\D/g, "")}?text=${encodeURIComponent(`Namaste, I found you on Vedic Tatva (vedictatva.com/p/${slug}).`)}`}
                  target="_blank" rel="noopener noreferrer"
                >
                  <Button variant="outline" className="bg-[#FFFAEC]/15 backdrop-blur-sm border-[#FFFAEC]/40 text-[#FFFAEC] hover:bg-[#FFFAEC]/25" data-testid="button-whatsapp">
                    <MessageCircle className="w-4 h-4 mr-2" />WhatsApp
                  </Button>
                </a>
              )}
              <a href={cardPdfUrl} download>
                <Button variant="outline" className="bg-[#FFFAEC]/15 backdrop-blur-sm border-[#FFFAEC]/40 text-[#FFFAEC] hover:bg-[#FFFAEC]/25" data-testid="button-download-card">
                  <Download className="w-4 h-4 mr-2" />Download QR Card
                </Button>
              </a>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 sm:py-12 space-y-10">
        {/* About */}
        {(storefront?.bio || pandit.bio) && (
          <section data-testid="section-about">
            <h2 className="text-xl font-bold mb-3">About</h2>
            <Card className="p-5 bg-white/60 border-stone-200">
              <p className="text-sm sm:text-base leading-relaxed text-stone-700 whitespace-pre-line">
                {storefront?.bio || pandit.bio}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
                {pandit.languages?.length ? (
                  <div className="text-xs">
                    <div className="text-stone-500 inline-flex items-center gap-1"><Languages className="w-3 h-3" />Languages</div>
                    <div className="font-medium text-[#4a1a22] mt-1">{pandit.languages.join(", ")}</div>
                  </div>
                ) : null}
                {pandit.specialization?.length ? (
                  <div className="text-xs col-span-2">
                    <div className="text-stone-500">Specialization</div>
                    <div className="font-medium text-[#4a1a22] mt-1">{pandit.specialization.join(" · ")}</div>
                  </div>
                ) : null}
                {!!pandit.fees && (
                  <div className="text-xs">
                    <div className="text-stone-500">Starting</div>
                    <div className="font-medium text-[#4a1a22] mt-1">₹{pandit.fees.toLocaleString("en-IN")}</div>
                  </div>
                )}
              </div>
            </Card>
          </section>
        )}

        {/* Featured pujas */}
        {storefront?.featuredPujas && storefront.featuredPujas.length > 0 && (
          <section data-testid="section-pujas">
            <h2 className="text-xl font-bold mb-3">Pujas I Perform</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {storefront.featuredPujas.map((p) => (
                <Link key={p} href={`/puja${refQS}`}>
                  <Card className="p-4 bg-white/70 border-stone-200 hover-elevate cursor-pointer">
                    <div className="text-sm font-semibold text-[#4a1a22]">{p}</div>
                    <div className="text-xs text-stone-500 mt-1">Tap to book</div>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Curated shop */}
        {products.length > 0 && (
          <section data-testid="section-shop">
            <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
              <h2 className="text-xl font-bold inline-flex items-center gap-2"><ShoppingBag className="w-5 h-5" />Recommended Samagri</h2>
              <Link href={`/puja-samagri-online${refQS}`}><Button variant="outline" size="sm">Shop all</Button></Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {products.map((p) => (
                <Card key={p.id} className="overflow-hidden bg-white/80 border-stone-200 h-full flex flex-col" data-testid={`card-product-${p.id}`}>
                  <Link href={`/product/${p.slug || p.id}${refQS}`}>
                    <div className="aspect-square bg-stone-100 overflow-hidden cursor-pointer">
                      {p.image && <img src={p.image} alt={p.name} className="w-full h-full object-cover" loading="lazy" />}
                    </div>
                  </Link>
                  <div className="p-3 flex flex-col flex-1 gap-2">
                    <Link href={`/product/${p.slug || p.id}${refQS}`}>
                      <div className="text-sm font-medium text-[#4a1a22] line-clamp-2 min-h-[2.5rem] cursor-pointer">{p.name}</div>
                    </Link>
                    <div className="flex items-baseline gap-2">
                      <span className="text-base font-bold text-[#6D2B35]">₹{((p.salePrice ?? p.price) || 0).toLocaleString("en-IN")}</span>
                      {p.salePrice && p.salePrice < p.price && (
                        <span className="text-xs text-stone-400 line-through">₹{p.price.toLocaleString("en-IN")}</span>
                      )}
                    </div>
                    <Button
                      size="sm"
                      className="mt-auto w-full bg-[#6D2B35] hover:bg-[#4a1a22] text-white"
                      onClick={() => {
                        addToCart({ id: p.id, name: p.name, price: p.salePrice ?? p.price, image: p.image, slug: p.slug } as unknown as import("@shared/schema").Product, 1);
                        toast({ title: "Added to cart", description: p.name });
                      }}
                      data-testid={`button-add-to-cart-${p.id}`}
                    >
                      <ShoppingBag className="w-4 h-4 mr-1.5" /> Add to Cart
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Connect + QR */}
        <section data-testid="section-connect" className="grid sm:grid-cols-[auto,1fr] gap-6 items-center">
          <Card className="p-4 bg-white border-stone-200 inline-block">
            <img src={qrUrl} alt={`QR for ${pandit.name}`} className="w-44 h-44" />
            <div className="text-xs text-center text-stone-500 mt-2">Scan to share</div>
          </Card>
          <div>
            <h2 className="text-xl font-bold mb-2">Connect with {pandit.name.split(" ")[0]}</h2>
            <p className="text-sm text-stone-600 mb-3">Share this QR code with anyone who needs a verified Vedic Pandit.</p>
            <div className="flex flex-wrap gap-2">
              {pandit.phone && (
                <a href={`tel:${pandit.phone}`}>
                  <Button variant="outline" size="sm"><Phone className="w-4 h-4 mr-2" />Call</Button>
                </a>
              )}
              {storefront?.social?.youtube && <a href={storefront.social.youtube} target="_blank" rel="noopener noreferrer"><Button variant="outline" size="sm"><Youtube className="w-4 h-4 mr-2" />YouTube</Button></a>}
              {storefront?.social?.instagram && <a href={storefront.social.instagram} target="_blank" rel="noopener noreferrer"><Button variant="outline" size="sm"><Instagram className="w-4 h-4 mr-2" />Instagram</Button></a>}
              {storefront?.social?.facebook && <a href={storefront.social.facebook} target="_blank" rel="noopener noreferrer"><Button variant="outline" size="sm"><Facebook className="w-4 h-4 mr-2" />Facebook</Button></a>}
              {storefront?.social?.website && <a href={storefront.social.website} target="_blank" rel="noopener noreferrer"><Button variant="outline" size="sm"><Globe className="w-4 h-4 mr-2" />Website</Button></a>}
            </div>
          </div>
        </section>

        {/* Reviews */}
        {reviews.length > 0 && (
          <section data-testid="section-reviews">
            <h2 className="text-xl font-bold mb-3">What devotees say</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {reviews.slice(0, 6).map((r) => (
                <Card key={r.id} className="p-4 bg-white/70 border-stone-200">
                  <div className="flex items-center gap-1">
                    {[1,2,3,4,5].map((i) => (
                      <Star key={i} className={`w-4 h-4 ${i <= (r.rating || 0) ? "fill-[#D4AF37] text-[#D4AF37]" : "text-stone-300"}`} />
                    ))}
                  </div>
                  <p className="text-sm text-stone-700 mt-2 line-clamp-4">{r.comment}</p>
                  {r.userName && <div className="text-xs text-stone-500 mt-2">— {r.userName}</div>}
                </Card>
              ))}
            </div>
          </section>
        )}

        <footer className="text-center text-xs text-stone-500 pt-6">
          Listed on <Link href="/" className="text-[#6D2B35] underline">Vedic Tatva</Link> — every Pandit verified.
        </footer>
      </main>
    </div>
  );
}

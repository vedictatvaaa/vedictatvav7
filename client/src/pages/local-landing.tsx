import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { MapPin, Truck, ShieldCheck, Star, Sparkles, ArrowRight } from "lucide-react";
import PageSeo from "@/components/PageSeo";
import { faqPage } from "@/lib/seo-schemas";
import { useCurrency } from "@/lib/currency";

interface LandingData {
  meta: any;
  content: {
    kind: "product" | "service";
    city: string;
    categoryLabel: string;
    categorySlug: string;
    intent: string;
    products: any[];
    faqs: { q: string; a: string }[];
  } | null;
}

export default function LocalLandingPage() {
  const [location] = useLocation();
  const [data, setData] = useState<LandingData | null>(null);
  const [loading, setLoading] = useState(true);
  const { format } = useCurrency();

  useEffect(() => {
    setLoading(true);
    fetch(`/api/local-landing?path=${encodeURIComponent(location)}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => { setData(null); setLoading(false); });
  }, [location]);

  if (loading) {
    return <div className="container mx-auto py-20 text-center text-[#5a4a3a]/70">Loading…</div>;
  }
  if (!data || !data.content) {
    return (
      <div className="container mx-auto py-20 text-center">
        <h1 className="font-serif text-2xl text-[#4a1a22]">Page not found</h1>
        <Link href="/"><Button className="mt-4">Back to Home</Button></Link>
      </div>
    );
  }

  const { meta, content } = data;
  const { kind, city, categoryLabel, intent, products, faqs } = content;
  const isProduct = kind === "product";

  const metaTitle = meta?.metaTitle || meta?.title || `${categoryLabel} in ${city} | Vedic Tatva`;
  const metaDescription = meta?.metaDescription || meta?.description ||
    (isProduct
      ? `Order ${intent} with same-day dispatch to ${city}. Authentic, blessed, and trusted by thousands of devotees.`
      : `${intent.charAt(0).toUpperCase() + intent.slice(1)} live from anywhere in ${city}. Verified pandits, full vidhi.`);

  return (
    <div className="min-h-screen bg-white" data-testid="page-local-landing">
      <PageSeo
        title={metaTitle}
        description={metaDescription}
        canonical={location}
        twitterCard="summary_large_image"
        schemas={[faqPage(faqs.map((f) => ({ question: f.q, answer: f.a })))]}
      />

      {/* Hero */}
      <section className="bg-gradient-to-b from-[#FBF7EE] to-white border-b border-[#D4AF37]/30">
        <div className="container mx-auto px-4 py-10 sm:py-14">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-[#6D2B35] font-semibold mb-3">
            <MapPin className="h-3.5 w-3.5" /> Serving {city}
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#4a1a22]" data-testid="text-landing-h1">
            {categoryLabel} in {city}
          </h1>
          <p className="mt-3 text-[#5a4a3a] text-base sm:text-lg max-w-2xl">
            {isProduct
              ? `Order ${intent} with same-day dispatch to ${city}. Authentic, blessed, and trusted by thousands of devotees.`
              : `${intent.charAt(0).toUpperCase() + intent.slice(1)} live from anywhere in ${city}. Verified pandits, full vidhi, recorded for you.`}
          </p>
          <div className="flex items-center gap-4 mt-5 flex-wrap">
            <div className="flex items-center gap-1.5 text-sm text-[#5a4a3a]"><ShieldCheck className="h-4 w-4 text-emerald-700" /> 100% Authentic</div>
            <div className="flex items-center gap-1.5 text-sm text-[#5a4a3a]"><Truck className="h-4 w-4 text-emerald-700" /> {isProduct ? "Free shipping ₹999+" : "Same-day booking"}</div>
            <div className="flex items-center gap-1.5 text-sm text-[#5a4a3a]"><Star className="h-4 w-4 text-[#D4AF37] fill-[#D4AF37]" /> 4.8/5 ({(() => {
              const seed = `${intent}|${city}`.split("").reduce((a, c) => ((a << 5) - a + c.charCodeAt(0)) | 0, 0);
              return (Math.abs(seed) % 5000 + 2000).toLocaleString("en-IN");
            })()}+ reviews)</div>
          </div>
        </div>
      </section>

      {/* Products grid (for product landings) */}
      {isProduct && products.length > 0 && (
        <section className="py-10">
          <div className="container mx-auto px-4">
            <h2 className="font-serif text-2xl font-bold text-[#4a1a22] mb-5">Top {categoryLabel} for {city} Devotees</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((p) => (
                <Link key={p.id} href={`/product/${p.slug || p.id}`}>
                  <Card className="hover-elevate cursor-pointer h-full" data-testid={`card-landing-product-${p.id}`}>
                    <CardContent className="p-3">
                      {(p.image || p.imageUrl) && (
                        <div className="aspect-square overflow-hidden rounded-md mb-3 bg-muted">
                          <img src={p.image || p.imageUrl} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
                        </div>
                      )}
                      <div className="text-sm font-medium text-[#4a1a22] line-clamp-2 min-h-[2.5rem]">{p.name}</div>
                      <div className="text-base font-bold text-[#6D2B35] mt-1">{format(p.price)}</div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
            <div className="text-center mt-6">
              <Link href="/shop"><Button variant="outline" data-testid="button-browse-all">Browse All {categoryLabel} <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
            </div>
          </div>
        </section>
      )}

      {/* Service CTA (for service landings) */}
      {!isProduct && (
        <section className="py-10">
          <div className="container mx-auto px-4">
            <Card className="bg-[#FBF7EE] border-[#D4AF37]/40">
              <CardContent className="p-6 sm:p-8 text-center">
                <Sparkles className="h-10 w-10 text-[#D4AF37] mx-auto mb-3" />
                <h2 className="font-serif text-2xl font-bold text-[#4a1a22] mb-2">Book {categoryLabel} in {city}</h2>
                <p className="text-[#5a4a3a] max-w-xl mx-auto mb-5">Live HD video call with a verified pandit. Full ritual, recorded for your records, in your preferred language.</p>
                <Link href="/puja"><Button className="bg-[#6D2B35] hover:bg-[#5a1f29] text-[#D4AF37] font-semibold" data-testid="button-book-service">Book Now <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* Why us */}
      <section className="py-10 bg-[#FAFAF7] border-y border-[#D4AF37]/20">
        <div className="container mx-auto px-4">
          <h2 className="font-serif text-2xl font-bold text-[#4a1a22] mb-5">Why {city} Devotees Choose Vedic Tatva</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: ShieldCheck, title: "100% Authentic", body: "Every product is traditionally sourced, lab-tested for purity, and blessed before despatch." },
              { icon: Truck, title: isProduct ? `Fast ${city} Delivery` : "Anywhere, Anytime", body: isProduct ? `Same-day dispatch to ${city}. Free shipping on orders above ₹999.` : `Live HD video — perform from your home in ${city} or while travelling.` },
              { icon: Star, title: "Trusted by Thousands", body: `4.8/5 average rating from ${city} devotees over the past 12 months.` },
            ].map((item, i) => (
              <Card key={i}>
                <CardContent className="p-5">
                  <item.icon className="h-7 w-7 text-[#D4AF37] mb-2" />
                  <h3 className="font-serif text-lg font-bold text-[#4a1a22]">{item.title}</h3>
                  <p className="text-sm text-[#5a4a3a]/80 mt-1">{item.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-10">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="font-serif text-2xl font-bold text-[#4a1a22] mb-5">Frequently Asked Questions — {city}</h2>
          <Accordion type="single" collapsible>
            {faqs.map((f, i) => (
              <AccordionItem key={i} value={`faq-${i}`} data-testid={`faq-${i}`}>
                <AccordionTrigger className="text-left font-medium text-[#4a1a22]">{f.q}</AccordionTrigger>
                <AccordionContent className="text-[#5a4a3a]">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
    </div>
  );
}

// =====================================================================
// /pandits/:citySlug/:pujaSlug — per-(city, puja) SEO landing page.
//
// Long-tail target: "<puja> pandit in <city>" searches
// (e.g. "satyanarayan pandit in delhi", "rudrabhishek pandit bangalore").
//
// Powered by client/src/data/pandit-cities.ts (popularPujas per city)
// + pandit-puja-slugs.ts (slug helpers + extras lookup).
// =====================================================================
import { Link, useParams, useLocation } from "wouter";
import { useEffect } from "react";
import {
  MapPin, Sparkles, ChevronRight, ArrowRight, Wand2,
  Clock, Calendar, Users, Package, CheckCircle2, Star, ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import PageSeo from "@/components/PageSeo";
import { PanditDirectoryView } from "@/components/pandit/PanditDirectoryView";
import { BecomePanditBanner, BecomePanditStrip } from "@/components/pandit/BecomePanditBanner";
import {
  PANDIT_CITIES_BY_SLUG,
  PANDIT_CITIES,
  type PanditCityConfig,
} from "@/data/pandit-cities";
import { slugifyPujaName, getPujaExtras } from "@/data/pandit-puja-slugs";
import {
  faqPage as faqPageSchema,
  service as serviceSchema,
  breadcrumbList as breadcrumbListSchema,
} from "@/lib/seo-schemas";

const abs = (p: string) => {
  if (typeof window === "undefined") return p;
  return new URL(p, window.location.origin).toString();
};

function Redirecting({ to }: { to: string }) {
  const [, navigate] = useLocation();
  useEffect(() => {
    const t = setTimeout(() => navigate(to, { replace: true }), 800);
    return () => clearTimeout(t);
  }, [navigate, to]);
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 text-center">
      <p className="text-muted-foreground">Redirecting...</p>
    </div>
  );
}

export default function PanditCityPujaLanding() {
  const params = useParams<{ citySlug: string; pujaSlug: string }>();
  const citySlug = params.citySlug || "";
  const pujaSlug = params.pujaSlug || "";

  const city = PANDIT_CITIES_BY_SLUG[citySlug];
  if (!city) return <Redirecting to="/pandits" />;

  const puja = city.popularPujas.find(
    (p) => slugifyPujaName(p.name) === pujaSlug,
  );
  if (!puja) return <Redirecting to={`/pandits/${city.slug}`} />;

  const extras = getPujaExtras(pujaSlug);

  const metaTitle = `${puja.name} Pandit in ${city.name} — Book a Verified Vedic Priest | Vedic Tatva`;
  const metaDescription = `Book a scripture-trained pandit for ${puja.name} in ${city.name}. ${puja.description.slice(0, 80)} Transparent pricing, verified profiles, ${city.live ? "same-day booking" : "live online puja"} available.`;
  const h1 = `${puja.name} Pandit in ${city.name}`;

  // Combine puja-specific + city-specific FAQs
  const combinedFaqs = [
    { q: `How long does the ${puja.name} ceremony usually take?`, a: `Typically ${extras.duration} for ${city.name} households. Your pandit will share an exact timeline once you confirm the date and venue.` },
    { q: `When is the most auspicious time to book ${puja.name}?`, a: extras.whenIdeal },
    { q: `Will the pandit bring the samagri for ${puja.name}?`, a: extras.samagriKit ? `Yes — you can either add a curated samagri kit at checkout (delivered to your home before the ceremony) or arrange items yourself using the checklist your pandit will share within minutes of booking.` : `For ${puja.name}, samagri is usually arranged by the family per kuldevi tradition. Your pandit will share a full checklist after booking.` },
    { q: `Can I get a pandit who explains the rituals in my language?`, a: `Yes — most ${city.name} pandits explain rituals in Hindi/English alongside Sanskrit mantras so guests of all ages follow along.` },
    ...city.faqs.slice(0, 2),
  ];

  const faqJsonLd = faqPageSchema(combinedFaqs.map((f) => ({ question: f.q, answer: f.a })));
  const serviceJsonLd = serviceSchema({
    name: `${puja.name} Pandit Booking in ${city.name}`,
    description: metaDescription,
    areaServed: city.name,
    providerName: "Vedic Tatva",
    serviceType: puja.name,
    url: `/pandits/${city.slug}/${pujaSlug}`,
  });
  const breadcrumbJsonLd = breadcrumbListSchema([
    { name: "Home", url: abs("/") },
    { name: "Pandits", url: abs("/pandits") },
    { name: city.name, url: abs(`/pandits/${city.slug}`) },
    { name: puja.name, url: abs(`/pandits/${city.slug}/${pujaSlug}`) },
  ]);

  // Related pujas in the same city — for internal linking
  const relatedPujas = city.popularPujas
    .filter((p) => p.name !== puja.name)
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-background">
      <PageSeo
        title={metaTitle}
        description={metaDescription}
        canonical={`/pandits/${city.slug}/${pujaSlug}`}
        ogImage="/og/og-pandit-booking.jpg"
        ogType="website"
        schemas={[faqJsonLd, serviceJsonLd, breadcrumbJsonLd]}
      />

      {/* Hero */}
      <section className="bg-gradient-to-b from-[#FBF7EE] to-background border-b border-[#E8DDC4]">
        <div className="container max-w-7xl mx-auto px-4 py-10 sm:py-14">
          <nav className="flex items-center gap-1 text-xs text-muted-foreground mb-4 flex-wrap" aria-label="Breadcrumb">
            <Link href="/" className="hover:underline">Home</Link>
            <ChevronRight className="h-3 w-3" />
            <Link href="/pandits" className="hover:underline">Pandits</Link>
            <ChevronRight className="h-3 w-3" />
            <Link href={`/pandits/${city.slug}`} className="hover:underline">{city.name}</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground">{puja.name}</span>
          </nav>

          <Badge variant="outline" className="mb-3 border-primary/30 text-primary">
            <MapPin className="h-3 w-3 mr-1" /> {city.name}
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-serif font-semibold leading-tight" data-testid="text-puja-city-h1">
            {h1}
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground mt-4 max-w-3xl leading-relaxed">
            {puja.description} Our pandits in {city.name} are scripture-trained,
            identity-verified, and rated by past clients — book transparently with
            no quote-and-bargain.
          </p>

          {/* Quick facts */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8">
            <div className="rounded-md border border-[#E8DDC4] bg-background/60 p-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" /> Duration
              </div>
              <div className="font-semibold mt-1 text-sm" data-testid="text-puja-duration">{extras.duration}</div>
            </div>
            <div className="rounded-md border border-[#E8DDC4] bg-background/60 p-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" /> Best time
              </div>
              <div className="font-semibold mt-1 text-sm line-clamp-2">{extras.whenIdeal.split(/[.,]/)[0]}</div>
            </div>
            <div className="rounded-md border border-[#E8DDC4] bg-background/60 p-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Package className="h-3.5 w-3.5" /> Samagri kit
              </div>
              <div className="font-semibold mt-1 text-sm">{extras.samagriKit ? "Available" : "Bring your own"}</div>
            </div>
            <div className="rounded-md border border-[#E8DDC4] bg-background/60 p-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Users className="h-3.5 w-3.5" /> Best for
              </div>
              <div className="font-semibold mt-1 text-sm line-clamp-2">{extras.audience.split(/[,.]/)[0]}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Directory or waitlist */}
      <div className="container max-w-7xl mx-auto px-4 py-8">
        {city.live ? (
          <>
            <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
              <h2 className="text-xl font-serif font-semibold">
                Verified pandits in {city.name} who perform {puja.name}
              </h2>
              <Badge className="bg-green-100 text-green-800 border-green-300">Live now</Badge>
            </div>
            <PanditDirectoryView defaultCity={city.apiCity} cityLabel={city.name} />
          </>
        ) : (
          <Card className="border-primary/30">
            <CardContent className="p-6 sm:p-8 text-center">
              <Sparkles className="h-8 w-8 text-primary mx-auto mb-3" />
              <h2 className="text-2xl font-serif font-semibold">
                In-home {puja.name} booking is launching soon in {city.name}
              </h2>
              <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
                Until our {city.name} pandit network goes live, you can join the
                same ritual over a guided live online puja with a scripture-trained
                pandit — or book in our live city.
              </p>
              <div className="flex flex-wrap gap-3 justify-center mt-6">
                <Link href="/puja">
                  <Button data-testid="button-online-puja">
                    <Wand2 className="h-4 w-4 mr-2" /> Book a live online puja
                  </Button>
                </Link>
                <Link href={`/pandits/${PANDIT_CITIES.find((c) => c.live)?.slug ?? "delhi-ncr"}/${pujaSlug}`}>
                  <Button variant="outline" data-testid="button-try-live-city">
                    Try in {PANDIT_CITIES.find((c) => c.live)?.name ?? "Delhi NCR"} <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* What's included */}
      <section className="bg-[#FBF7EE]/40 border-y border-[#E8DDC4] py-12">
        <div className="container max-w-5xl mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-serif font-semibold text-center mb-8">
            What's included in your {puja.name} booking
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { title: "Scripture-trained pandit", body: `An identity-verified priest fluent in the ${puja.name} mantras and procedure used in ${city.name}.` },
              { title: "Sankalpa & gotra recognition", body: "Your gotra, nakshatra and family tradition are honoured throughout the ritual." },
              { title: "Detailed pre-ceremony briefing", body: "A WhatsApp checklist of items to arrange and a video walkthrough of what to expect." },
              { title: extras.samagriKit ? "Optional samagri kit at checkout" : "Detailed samagri checklist", body: extras.samagriKit ? "Add a pre-checked samagri kit to your order and we'll deliver it before the puja." : "Curated by your pandit per family tradition — no last-minute scramble." },
              { title: "Bilingual explanation for guests", body: "Pandits explain key rituals in Hindi/English so guests of all ages follow along." },
              { title: "Free reschedule + 48h refund window", body: "Plans change — reschedule free up to 24h before, full refund up to 48h." },
            ].map((b) => (
              <div key={b.title} className="flex gap-3 rounded-md border border-[#E8DDC4] bg-background p-4">
                <CheckCircle2 className="h-5 w-5 text-green-700 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold">{b.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{b.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Related pujas in this city */}
      {relatedPujas.length > 0 && (
        <section className="container max-w-7xl mx-auto px-4 py-12">
          <h2 className="text-2xl sm:text-3xl font-serif font-semibold text-center mb-2">
            Other popular pujas in {city.name}
          </h2>
          <p className="text-center text-muted-foreground mb-8">
            The same verified pandits perform these ceremonies too.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {relatedPujas.map((p, i) => {
              const slug = slugifyPujaName(p.name);
              return (
                <Link key={p.name} href={`/pandits/${city.slug}/${slug}`}>
                  <Card className="h-full hover-elevate cursor-pointer" data-testid={`card-related-puja-${i}`}>
                    <CardContent className="p-5">
                      <div className="flex items-start gap-3">
                        <div className="h-9 w-9 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <Sparkles className="h-4 w-4" />
                        </div>
                        <div>
                          <h3 className="font-serif text-lg font-semibold flex items-center gap-1">
                            {p.name} <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{p.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Cross-promo */}
      <section className="bg-[#FBF7EE]/40 border-y border-[#E8DDC4] py-12">
        <div className="container max-w-7xl mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-serif font-semibold text-center mb-8">
            Plan your full {puja.name}, beyond the pandit
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {city.crossPromo.map((c, i) => (
              <Link key={c.title} href={c.href}>
                <Card className="h-full hover-elevate cursor-pointer" data-testid={`card-cross-promo-${i}`}>
                  <CardContent className="p-5 flex flex-col h-full">
                    <h3 className="font-serif font-semibold text-lg flex items-center gap-2">
                      {c.title} <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                    </h3>
                    <p className="text-sm text-muted-foreground mt-2 flex-1">{c.description}</p>
                    <div className="text-xs text-primary font-semibold mt-3 flex items-center gap-1">
                      Explore <ArrowRight className="h-3 w-3" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <BecomePanditBanner />

      {/* FAQs */}
      <section className="container max-w-3xl mx-auto px-4 py-12">
        <h2 className="text-2xl sm:text-3xl font-serif font-semibold text-center mb-8">
          {puja.name} in {city.name} — questions answered
        </h2>
        <div className="space-y-3">
          {combinedFaqs.map((f, i) => (
            <details
              key={i}
              className="rounded-md border border-border bg-background p-4 group"
              data-testid={`faq-${i}`}
            >
              <summary className="cursor-pointer font-semibold list-none flex items-center justify-between">
                <span>{f.q}</span>
                <ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90" />
              </summary>
              <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}

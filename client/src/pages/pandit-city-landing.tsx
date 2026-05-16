// =====================================================================
// /pandits/:citySlug — per-city SEO landing page.
// Routed from App.tsx. Renders rich SEO content + the live directory
// (or a waitlist CTA for not-yet-launched cities) + cross-promotion.
// =====================================================================
import { Link, useParams, useLocation } from "wouter";
import { useEffect } from "react";
import {
  MapPin, Sparkles, ShieldCheck, Calendar, ChevronRight,
  ArrowRight, Wand2, ExternalLink, CheckCircle2, Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import PageSeo from "@/components/PageSeo";
import { PanditDirectoryView } from "@/components/pandit/PanditDirectoryView";
import {
  PANDIT_CITIES_BY_SLUG,
  PANDIT_CITIES,
  type PanditCityConfig,
} from "@/data/pandit-cities";
import { slugifyPujaName } from "@/data/pandit-puja-slugs";
import {
  faqPage as faqPageSchema,
  service as serviceSchema,
  breadcrumbList as breadcrumbListSchema,
} from "@/lib/seo-schemas";

const abs = (p: string) => {
  if (typeof window === "undefined") return p;
  return new URL(p, window.location.origin).toString();
};

function NotFound({ slug }: { slug: string }) {
  const [, navigate] = useLocation();
  useEffect(() => {
    const t = setTimeout(() => navigate("/pandits"), 1500);
    return () => clearTimeout(t);
  }, [navigate]);
  return (
    <div className="min-h-[60vh] flex items-center justify-center text-center px-4">
      <div>
        <h1 className="text-2xl font-serif">No Vedic Tatva pandit page for "{slug}"</h1>
        <p className="text-muted-foreground mt-2">Redirecting you to the city chooser...</p>
      </div>
    </div>
  );
}

function CityHero({ city }: { city: PanditCityConfig }) {
  return (
    <section className="bg-gradient-to-b from-[#FBF7EE] to-background border-b border-[#E8DDC4]">
      <div className="container max-w-7xl mx-auto px-4 py-10 sm:py-14">
        <nav className="flex items-center gap-1 text-xs text-muted-foreground mb-4" aria-label="Breadcrumb">
          <Link href="/" className="hover:underline">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/pandits" className="hover:underline">Pandits</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">{city.name}</span>
        </nav>
        <div className="grid lg:grid-cols-[1fr_auto] gap-6 items-end">
          <div className="max-w-3xl">
            <Badge variant="outline" className="mb-3 border-primary/30 text-primary">
              <MapPin className="h-3 w-3 mr-1" /> {city.name}, {city.state}
            </Badge>
            <h1 className="text-3xl sm:text-4xl font-serif font-semibold text-foreground leading-tight" data-testid="text-city-h1">
              {city.h1}
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground mt-4 leading-relaxed" data-testid="text-city-intro">
              {city.intro}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {city.live ? (
              <Badge className="bg-green-100 text-green-800 border-green-300 px-3 py-1 text-sm">
                <span className="relative flex h-2 w-2 mr-2">
                  <span className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-75" />
                  <span className="relative rounded-full h-2 w-2 bg-green-500" />
                </span>
                Live now
              </Badge>
            ) : (
              <Badge variant="outline" className="px-3 py-1 text-sm">
                <Calendar className="h-3.5 w-3.5 mr-1.5" /> Launching soon
              </Badge>
            )}
          </div>
        </div>

        {/* Trust badges row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8">
          {city.trustBadges.map((b) => (
            <div key={b.label} className="text-center sm:text-left rounded-md border border-[#E8DDC4] bg-background/60 p-3">
              <div className="text-lg sm:text-xl font-serif font-semibold text-primary" data-testid={`badge-trust-${b.label}`}>{b.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{b.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ComingSoonCallout({ city }: { city: PanditCityConfig }) {
  const liveCity = PANDIT_CITIES.find((c) => c.live);
  return (
    <Card className="border-primary/30">
      <CardContent className="p-6 sm:p-8 text-center">
        <Sparkles className="h-8 w-8 text-primary mx-auto mb-3" />
        <h2 className="text-2xl font-serif font-semibold">
          In-home Pandit booking is launching soon in {city.name}
        </h2>
        <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
          We're verifying our first batch of pandits in {city.name}. Until we go live,
          you can still join any ritual over a guided live online puja with the same
          scripture-trained priests — or browse our network in {liveCity?.name || "Delhi NCR"}.
        </p>
        <div className="flex flex-wrap gap-3 justify-center mt-6">
          <Link href="/puja">
            <Button data-testid="button-online-puja">
              <Wand2 className="h-4 w-4 mr-2" /> Book a live online puja
            </Button>
          </Link>
          {liveCity && (
            <Link href={`/pandits/${liveCity.slug}`}>
              <Button variant="outline" data-testid="button-try-live-city">
                Browse pandits in {liveCity.name} <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function PopularPujasGrid({ city }: { city: PanditCityConfig }) {
  return (
    <section className="container max-w-7xl mx-auto px-4 py-12">
      <h2 className="text-2xl sm:text-3xl font-serif font-semibold text-center mb-2">
        Most-booked pujas in {city.name}
      </h2>
      <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-8">
        These are the ceremonies our pandits perform most often for {city.name} households.
      </p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {city.popularPujas.map((p, i) => {
          const slug = slugifyPujaName(p.name);
          return (
            <Link key={p.name} href={`/pandits/${city.slug}/${slug}`}>
              <Card className="hover-elevate cursor-pointer h-full" data-testid={`card-popular-puja-${i}`}>
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="font-serif text-lg font-semibold flex items-center gap-1">
                        {p.name} <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{p.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function RegionalAndFestivals({ city }: { city: PanditCityConfig }) {
  return (
    <section className="bg-[#FBF7EE]/40 border-y border-[#E8DDC4] py-12">
      <div className="container max-w-7xl mx-auto px-4 grid lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-2xl font-serif font-semibold mb-3">
            Lineages & traditions in {city.name}
          </h2>
          <p className="text-muted-foreground leading-relaxed" data-testid="text-regional-customs">
            {city.regionalCustoms}
          </p>
        </div>
        <div>
          <h2 className="text-2xl font-serif font-semibold mb-3">
            Key festivals our pandits cover
          </h2>
          <div className="flex flex-wrap gap-2">
            {city.keyFestivals.map((f) => (
              <Badge key={f} variant="outline" className="bg-background text-foreground py-1 px-3 text-sm">
                {f}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function CrossPromoGrid({ city }: { city: PanditCityConfig }) {
  return (
    <section className="container max-w-7xl mx-auto px-4 py-12">
      <h2 className="text-2xl sm:text-3xl font-serif font-semibold text-center mb-8">
        Plan your full ceremony, beyond the pandit
      </h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {city.crossPromo.map((c, i) => (
          <Link key={c.title} href={c.href}>
            <Card className="h-full hover-elevate cursor-pointer" data-testid={`card-cross-promo-${i}`}>
              <CardContent className="p-5 flex flex-col h-full">
                <h3 className="font-serif font-semibold text-lg flex items-center gap-2">
                  {c.title} <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                </h3>
                <p className="text-sm text-muted-foreground mt-2 flex-1 leading-relaxed">{c.description}</p>
                <div className="text-xs text-primary font-semibold mt-3 flex items-center gap-1">
                  Explore <ArrowRight className="h-3 w-3" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}

function CityFAQs({ city }: { city: PanditCityConfig }) {
  return (
    <section className="bg-[#FBF7EE]/40 border-y border-[#E8DDC4] py-12">
      <div className="container max-w-3xl mx-auto px-4">
        <h2 className="text-2xl sm:text-3xl font-serif font-semibold text-center mb-8">
          Booking a pandit in {city.name} — questions answered
        </h2>
        <div className="space-y-3">
          {city.faqs.map((f, i) => (
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
      </div>
    </section>
  );
}

function OtherCitiesStrip({ currentSlug }: { currentSlug: string }) {
  const others = PANDIT_CITIES.filter((c) => c.slug !== currentSlug);
  return (
    <section className="container max-w-7xl mx-auto px-4 py-10">
      <h2 className="text-lg font-serif font-semibold mb-3">Pandits in other cities</h2>
      <div className="flex flex-wrap gap-2">
        {others.map((c) => (
          <Link key={c.slug} href={`/pandits/${c.slug}`}>
            <Badge
              variant="outline"
              className="px-3 py-1.5 text-sm cursor-pointer hover-elevate"
              data-testid={`link-other-city-${c.slug}`}
            >
              {c.live ? (
                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5 text-green-600" />
              ) : (
                <Calendar className="h-3.5 w-3.5 mr-1.5" />
              )}
              {c.name}
            </Badge>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default function PanditCityLanding() {
  const params = useParams<{ citySlug: string }>();
  const citySlug = params.citySlug || "";
  const city = PANDIT_CITIES_BY_SLUG[citySlug];

  if (!city) return <NotFound slug={citySlug} />;

  // JSON-LD: Service + FAQPage + Breadcrumb
  const faqJsonLd = faqPageSchema(city.faqs.map(f => ({ question: f.q, answer: f.a })));
  const serviceJsonLd = serviceSchema({
    name: `Vedic Pandit Booking in ${city.name}`,
    description: city.metaDescription,
    areaServed: city.name,
    providerName: "Vedic Tatva",
    serviceType: "Hindu Priest Booking",
    url: `/pandits/${city.slug}`,
  });
  const breadcrumbJsonLd = breadcrumbListSchema([
    { name: "Home", url: abs("/") },
    { name: "Pandits", url: abs("/pandits") },
    { name: city.name, url: abs(`/pandits/${city.slug}`) },
  ]);

  return (
    <div className="min-h-screen bg-background">
      <PageSeo
        title={city.metaTitle}
        description={city.metaDescription}
        canonical={`/pandits/${city.slug}`}
        ogImage="/og/og-pandit-booking.jpg"
        ogType="website"
        schemas={[faqJsonLd, serviceJsonLd, breadcrumbJsonLd]}
      />

      <CityHero city={city} />

      {/* Directory or waitlist */}
      <div className="container max-w-7xl mx-auto px-4 py-8">
        {city.live ? (
          <div className="-mx-4 sm:-mx-0">
            <PanditDirectoryView defaultCity={city.apiCity} cityLabel={city.name} />
          </div>
        ) : (
          <ComingSoonCallout city={city} />
        )}
      </div>

      <PopularPujasGrid city={city} />
      <RegionalAndFestivals city={city} />
      <CrossPromoGrid city={city} />
      <CityFAQs city={city} />
      <OtherCitiesStrip currentSlug={city.slug} />

      {/* Keywords blurb — for SEO crawlers, low visual weight */}
      <div className="container max-w-7xl mx-auto px-4 pb-10">
        <p className="text-xs text-muted-foreground/70 leading-relaxed">{city.keywordsBlurb}</p>
      </div>
    </div>
  );
}

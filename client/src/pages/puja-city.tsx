import { useMemo } from "react";
import { Link, useParams } from "wouter";
import {
  ChevronRight,
  MapPin,
  Sparkles,
  ShieldCheck,
  Star,
  Phone,
  Languages as LanguagesIcon,
  CalendarCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import PageSeo from "@/components/PageSeo";
import {
  abs,
  breadcrumbList,
  faqPage,
  service as serviceSchema,
} from "@/lib/seo-schemas";
import { getCity } from "@/lib/cities";
import { getPujaType, PUJA_TYPES } from "@/lib/puja-types";
import {
  useI18n,
  languages as ALL_LANGS,
  type Language,
  getPujaCityCopy,
} from "@/lib/i18n";
import NotFound from "@/pages/not-found";

function inr(n: number) {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

export default function PujaCityPage() {
  const params = useParams<{ type: string; city: string }>();
  const { language } = useI18n();
  const isHi = language === "hi";

  const puja = useMemo(() => getPujaType(params.type || ""), [params.type]);
  const city = useMemo(() => getCity(params.city || ""), [params.city]);

  if (!puja || !city) {
    return <NotFound />;
  }

  const price = Math.round(puja.basePrice * city.priceMultiplier);
  const priceStr = inr(price);
  const path = `/puja/${puja.slug}/${city.slug}`;

  const SUPPORTED_LANG_CODES = new Set<Language>(ALL_LANGS.map((l) => l.code));
  const langNames = city.languages
    .map((code) => {
      const lc = code as Language;
      if (!SUPPORTED_LANG_CODES.has(lc)) return code.toUpperCase();
      const lang = ALL_LANGS.find((l) => l.code === lc);
      if (!lang) return code.toUpperCase();
      return isHi ? lang.nativeLabel : lang.label;
    })
    .join(", ");

  const copy = getPujaCityCopy(
    language,
    {
      name: puja.name,
      nameHi: puja.nameHi,
      intent: puja.intent,
      intentHi: puja.intentHi,
      duration: puja.duration,
      durationHi: puja.durationHi,
      bestTime: puja.bestTime,
      bestTimeHi: puja.bestTimeHi,
    },
    {
      cityName: city.name,
      cityNameHi: city.nameHi,
      state: city.state,
      stateHi: city.stateHi,
      panditCount: city.panditCount,
      landmark: city.landmark,
      landmarkHi: city.landmarkHi,
      blurb: city.blurb,
      blurbHi: city.blurbHi,
    },
    priceStr,
    langNames,
  );

  const inclusions = isHi ? puja.inclusionsHi : puja.inclusions;

  // -- SEO -- (always English-language schema for crawlers; meta tags translated)
  const metaTitleEn = `${puja.name} in ${city.name} — Pandit at Home, Cost ${priceStr} | Vedic Tatva`;
  const metaDescriptionEn = `Book ${puja.name} (${puja.nameHi}) at home in ${city.name} (${city.state}) with a verified Vedic pandit. ${puja.intent}. Duration ${puja.duration}. Indicative cost from ${priceStr} including samagri, dakshina and recording.`;
  const metaKeywords = [
    `${puja.name.toLowerCase()} in ${city.name.toLowerCase()}`,
    `${puja.name.toLowerCase()} pandit ${city.name.toLowerCase()}`,
    `${puja.name.toLowerCase()} cost ${city.name.toLowerCase()}`,
    `book ${puja.name.toLowerCase()} ${city.name.toLowerCase()}`,
    `pandit for ${puja.name.toLowerCase()} ${city.name.toLowerCase()}`,
  ].join(", ");

  const breadcrumbs = breadcrumbList([
    { name: "Home", url: abs("/") },
    { name: "Puja", url: abs("/online-puja-booking") },
    { name: puja.name, url: abs(`/puja/${puja.slug}`) },
    { name: city.name, url: abs(path) },
  ]);

  const svc = serviceSchema({
    name: `${puja.name} in ${city.name}`,
    description: metaDescriptionEn,
    url: abs(path),
    areaServed: city.name,
    providerName: "Vedic Tatva",
  });

  // FAQ JSON-LD always uses English text — keeps the rich result eligibility
  // unambiguous for Google. The visible FAQ on the page is translated separately.
  const faqsEn = [
    {
      q: `What is the cost of ${puja.name} in ${city.name}?`,
      a: `Vedic Tatva charges from ${priceStr} all-inclusive in ${city.name} — pandit dakshina, complete samagri, transport within city limits and HD recording. Pricing accounts for ${city.name} pandit availability and travel norms; final muhurat-day price is shared in writing before booking.`,
    },
    {
      q: `Will the pandit speak Hindi or ${city.languages.includes("hi") ? "the local language" : "regional language"} during the puja?`,
      a: `Mantras are recited in Sanskrit as per shastra. The pandit allotted in ${city.name} will explain sankalp, vidhi and prasad steps — please mention your preferred language while booking.`,
    },
    {
      q: `How quickly can a pandit reach me in ${city.name}?`,
      a: `${city.name} has ${city.panditCount}+ verified pandits on the Vedic Tatva network. With 48 hours' notice we confirm a muhurat-aligned slot; same-day pujas are possible at extra dakshina depending on traffic and area.`,
    },
    {
      q: `Can ${puja.name} be done online if my family is in ${city.name} but I am abroad?`,
      a: `Yes — we conduct the full ${puja.name} via HD video call from a temple or pandit's puja room in or near ${city.name}. Sankalp is taken in your name and gotra; prasad is dispatched to ${city.name} (or any address worldwide) within 3 working days.`,
    },
    {
      q: `What is the best time to book ${puja.name}?`,
      a: `${puja.bestTime}. Our muhurat desk will recommend the closest auspicious date based on your kundli and ${city.name} sunrise / sunset timings.`,
    },
  ];
  const faq = faqPage(faqsEn.map((f) => ({ question: f.q, answer: f.a })), "puja-city-faq");

  // -- Related cards: same puja in other tirth cities + same city other pujas --
  const otherCitiesSamePuja = ["varanasi", "delhi", "mumbai", "bengaluru", "chennai", "kolkata", "pune", "hyderabad"]
    .filter((s) => s !== city.slug)
    .slice(0, 5);
  const otherPujasSameCity = PUJA_TYPES.filter((p) => p.slug !== puja.slug).slice(0, 6);

  return (
    <div className="w-full pb-16 bg-white" data-testid={`puja-city-${puja.slug}-${city.slug}`}>
      <PageSeo
        title={copy.metaTitle}
        description={copy.metaDescription}
        keywords={metaKeywords}
        canonical={path}
        ogTitle={copy.metaTitle}
        ogDescription={copy.metaDescription}
        ogType="website"
        twitterCard="summary_large_image"
        schemas={[breadcrumbs, svc, faq]}
        extraMeta={[
          { name: "geo.region", content: "IN" },
          { name: "geo.placename", content: city.name },
        ]}
      />

      {/* Breadcrumb */}
      <nav
        className="container mx-auto px-4 pt-4 text-[12px] text-[#5a4a3a]/70 flex items-center gap-1.5 flex-wrap"
        aria-label="Breadcrumb"
      >
        <Link href="/" className="hover:text-[#6D2B35]" data-testid="breadcrumb-home">{copy.breadcrumbHome}</Link>
        <ChevronRight className="w-3.5 h-3.5 opacity-50" />
        <Link href="/online-puja-booking" className="hover:text-[#6D2B35]" data-testid="breadcrumb-puja">{copy.breadcrumbPuja}</Link>
        <ChevronRight className="w-3.5 h-3.5 opacity-50" />
        {puja.landingSlug ? (
          <Link href={`/puja/${puja.landingSlug}`} className="hover:text-[#6D2B35]" data-testid="breadcrumb-puja-type">{copy.pujaName}</Link>
        ) : (
          <span data-testid="breadcrumb-puja-type">{copy.pujaName}</span>
        )}
        <ChevronRight className="w-3.5 h-3.5 opacity-50" />
        <span className="text-[#6D2B35] font-semibold" data-testid="breadcrumb-city">{copy.cityName}</span>
      </nav>

      {/* Hero */}
      <section className="bg-gradient-to-b from-[#FBF7EE] to-white border-b border-[#D4AF37]/30 mt-3">
        <div className="container mx-auto px-4 py-10 sm:py-14">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-[#6D2B35] font-semibold mb-3">
            <MapPin className="h-3.5 w-3.5" /> {copy.servingLabel}
            {city.isTirth && <span className="ml-2 text-[#D4AF37] normal-case tracking-normal">· {copy.tirthLabel}</span>}
          </div>
          <h1
            className="font-serif text-3xl sm:text-4xl font-bold text-[#4a1a22]"
            data-testid="text-puja-city-h1"
          >
            {copy.h1}
          </h1>
          <p className="mt-3 text-[#5a4a3a] text-base sm:text-lg max-w-3xl">
            {copy.heroIntro}
            <span className="font-semibold text-[#4a1a22]">{copy.heroPrice}</span>
            {copy.heroIntroAfter}
          </p>

          {/* Quick fact strip */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: CalendarCheck, label: copy.factDuration, value: copy.duration },
              { icon: Sparkles, label: copy.factBestTime, value: copy.bestTime },
              { icon: LanguagesIcon, label: copy.factLanguages, value: copy.langNames },
              { icon: ShieldCheck, label: copy.factVerified, value: copy.factVerifiedValue },
            ].map((f) => (
              <Card key={f.label} className="bg-white">
                <CardContent className="p-3 flex items-start gap-2">
                  <f.icon className="w-4 h-4 text-[#D4AF37] mt-0.5 shrink-0" />
                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-[#5a4a3a]/70">{f.label}</div>
                    <div className="text-sm text-[#4a1a22] font-semibold leading-tight">{f.value}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/online-puja-booking">
              <Button size="lg" data-testid="button-book-puja">{copy.bookCta}</Button>
            </Link>
            <Link href="/puja-call">
              <Button size="lg" variant="outline" data-testid="button-talk-acharya">
                <Phone className="w-4 h-4 mr-2" /> {copy.talkAcharya}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Quick answer */}
      <section className="container mx-auto px-4 py-10">
        <Card className="bg-[#FBF7EE]/60 border-[#D4AF37]/30">
          <CardContent className="p-6">
            <h2 className="font-serif text-xl text-[#4a1a22] mb-2">{copy.quickAnswerHeading}</h2>
            <p className="text-[#5a4a3a]">{copy.quickAnswer}</p>
          </CardContent>
        </Card>
      </section>

      {/* What you receive */}
      <section className="container mx-auto px-4 pb-10">
        <h2 className="font-serif text-2xl text-[#4a1a22] mb-4">{copy.whatYouReceiveHeading}</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {inclusions.map((item) => (
            <Card key={item} className="bg-white">
              <CardContent className="p-4 flex items-start gap-2">
                <Star className="w-4 h-4 text-[#D4AF37] mt-0.5 shrink-0" />
                <span className="text-[#4a1a22] text-sm">{item}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Why Vedic Tatva in this city */}
      <section className="container mx-auto px-4 pb-10">
        <h2 className="font-serif text-2xl text-[#4a1a22] mb-4">{copy.whyHeading}</h2>
        <div className="grid sm:grid-cols-3 gap-3">
          <Card className="bg-white"><CardContent className="p-5">
            <ShieldCheck className="w-5 h-5 text-[#D4AF37] mb-2" />
            <div className="font-semibold text-[#4a1a22] mb-1">{copy.whyLocalTitle}</div>
            <p className="text-sm text-[#5a4a3a]">{copy.whyLocalBody}</p>
          </CardContent></Card>
          <Card className="bg-white"><CardContent className="p-5">
            <Sparkles className="w-5 h-5 text-[#D4AF37] mb-2" />
            <div className="font-semibold text-[#4a1a22] mb-1">{copy.whySamagriTitle}</div>
            <p className="text-sm text-[#5a4a3a]">{copy.whySamagriBody}</p>
          </CardContent></Card>
          <Card className="bg-white"><CardContent className="p-5">
            <Star className="w-5 h-5 text-[#D4AF37] mb-2" />
            <div className="font-semibold text-[#4a1a22] mb-1">{copy.whyPricingTitle}</div>
            <p className="text-sm text-[#5a4a3a]">{copy.whyPricingBody}</p>
          </CardContent></Card>
        </div>
      </section>

      {/* FAQs */}
      <section className="container mx-auto px-4 pb-10">
        <h2 className="font-serif text-2xl text-[#4a1a22] mb-4">{copy.faqsHeading}</h2>
        <Accordion type="single" collapsible className="bg-white rounded-md border border-[#D4AF37]/30">
          {copy.faqs.map((f, i) => (
            <AccordionItem key={i} value={`faq-${i}`}>
              <AccordionTrigger
                className="px-4 text-left text-[#4a1a22]"
                data-testid={`faq-trigger-${i}`}
              >
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="px-4 text-[#5a4a3a]" data-testid={`faq-content-${i}`}>
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* Related: same puja in other cities */}
      <section className="container mx-auto px-4 pb-10">
        <h2 className="font-serif text-2xl text-[#4a1a22] mb-4">{copy.otherCitiesHeading}</h2>
        <div className="flex flex-wrap gap-2">
          {otherCitiesSamePuja.map((slug) => {
            const c = getCity(slug);
            if (!c) return null;
            const otherCityName = isHi ? c.nameHi : c.name;
            return (
              <Link
                key={slug}
                href={`/puja/${puja.slug}/${c.slug}`}
                data-testid={`link-related-city-${c.slug}`}
              >
                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-[#D4AF37]/40 text-sm text-[#4a1a22] bg-white hover-elevate">
                  {copy.otherCityChip(otherCityName)}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Related: other pujas in this city */}
      <section className="container mx-auto px-4 pb-10">
        <h2 className="font-serif text-2xl text-[#4a1a22] mb-4">{copy.otherPujasHeading}</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {otherPujasSameCity.map((p) => {
            const otherPujaName = isHi ? p.nameHi : p.name;
            const otherIntent = isHi ? p.intentHi : p.intent;
            return (
              <Link
                key={p.slug}
                href={`/puja/${p.slug}/${city.slug}`}
                data-testid={`link-related-puja-${p.slug}`}
              >
                <Card className="bg-white hover-elevate">
                  <CardContent className="p-4">
                    <div className="font-semibold text-[#4a1a22]">{copy.otherPujaCardTitle(otherPujaName)}</div>
                    <div className="text-xs text-[#5a4a3a]/70 mt-1">{otherIntent}</div>
                    <div className="text-xs text-[#D4AF37] mt-2">{copy.fromPrice(inr(p.basePrice * city.priceMultiplier))}</div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}

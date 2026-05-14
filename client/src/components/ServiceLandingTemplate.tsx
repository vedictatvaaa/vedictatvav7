import { Link } from "wouter";
import { ChevronRight, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  PageHero,
  SectionHeader,
  IconTile,
  slimCard,
} from "@/components/ui/section-primitives";
import PageSeo from "@/components/PageSeo";
import {
  abs,
  breadcrumbList,
  faqPage,
  service as serviceSchema,
  product as productSchema,
} from "@/lib/seo-schemas";
import {
  type ServiceLandingEntry,
  VERTICAL_LABELS,
  VERTICAL_LABELS_HI,
  VERTICAL_BASE_PATHS,
  entryPath,
  findRelated,
} from "@/data/service-landings";
import { useI18n } from "@/lib/i18n";

interface Props {
  entry: ServiceLandingEntry;
}

const HI_UI = {
  breadcrumbHome: "होम",
  quickAnswer: "त्वरित उत्तर",
  whyItMatters: "क्यों महत्वपूर्ण है",
  keyBenefits: "मुख्य लाभ",
  keyBenefitsSub: "इस सेवा से भक्तों को क्या प्राप्त होता है।",
  rightForYou: "क्या यह आपके लिए है?",
  whoConsider: "किसे विचार करना चाहिए",
  whatsIncluded: "क्या शामिल है",
  mantras: "मंत्र",
  faqEyebrow: "अक्सर पूछे जाने वाले",
  faqTitle: "सामान्य प्रश्न",
  exploreMore: "और जानें",
  relatedServices: "संबंधित सेवाएं",
  explore: "देखें",
  readyTitle: "शुरू करने के लिए तैयार?",
  readyBody:
    "सत्यापित वैदिक विशेषज्ञ, पारदर्शी मूल्य निर्धारण, और पूरा संकल्प आपके और आपके परिवार के लिए रिकॉर्ड किया जाता है।",
  bookGeneric: "बुक करें",
  buyGeneric: "खरीदें",
  bookConsultation: "परामर्श बुक करें",
};

export default function ServiceLandingTemplate({ entry }: Props) {
  const { language } = useI18n();
  const isHi = language === "hi";
  const hi = entry.hi;
  const path = entryPath(entry);
  const verticalLabel = isHi
    ? VERTICAL_LABELS_HI[entry.vertical]
    : VERTICAL_LABELS[entry.vertical];
  const verticalBase = VERTICAL_BASE_PATHS[entry.vertical];
  const related = findRelated(entry);

  // Resolved (language-aware) display fields
  const displayName = isHi ? hi?.name ?? entry.nameHi ?? entry.name : entry.name;
  const displayEyebrow = isHi ? hi?.eyebrow ?? entry.eyebrow : entry.eyebrow;
  const displayMetaTitle = isHi ? hi?.metaTitle ?? entry.metaTitle : entry.metaTitle;
  const displayMetaDescription = isHi
    ? hi?.metaDescription ?? entry.metaDescription
    : entry.metaDescription;
  const displayHeroSubtitle = isHi ? hi?.heroSubtitle ?? entry.heroSubtitle : entry.heroSubtitle;
  const displayQuickAnswer = isHi ? hi?.quickAnswer ?? entry.quickAnswer : entry.quickAnswer;
  const displaySections = isHi && hi?.sections ? hi.sections : entry.sections;
  const benefitsLen = Math.max(
    (entry.benefits || []).length,
    isHi ? (hi?.benefits || []).length : 0,
  );
  const displayBenefits = Array.from({ length: benefitsLen }, (_, i) => {
    const b = entry.benefits?.[i];
    const h = isHi ? hi?.benefits?.[i] : undefined;
    return {
      icon: b?.icon ?? entry.benefits?.[0]?.icon ?? Sparkles,
      title: (isHi ? h?.title ?? b?.title : b?.title) || "",
      body: (isHi ? h?.body ?? b?.body : b?.body) || "",
    };
  });
  const displayWho = isHi && hi?.whoShouldDoThis ? hi.whoShouldDoThis : entry.whoShouldDoThis;
  const displayInclusions = isHi && hi?.inclusions ? hi.inclusions : entry.inclusions;
  const mantrasLen = Math.max(
    (entry.mantras || []).length,
    isHi ? (hi?.mantras || []).length : 0,
  );
  const displayMantras = Array.from({ length: mantrasLen }, (_, i) => {
    const m = entry.mantras?.[i];
    const h = isHi ? hi?.mantras?.[i] : undefined;
    return {
      sanskrit: (isHi ? h?.sanskrit ?? m?.sanskrit : m?.sanskrit) || "",
      meaning: (isHi ? h?.meaning ?? m?.meaning : m?.meaning) || "",
    };
  });
  const displayFaqs = isHi && hi?.faqs ? hi.faqs : entry.faqs;

  const breadcrumbs = breadcrumbList([
    { name: isHi ? HI_UI.breadcrumbHome : "Home", url: abs("/") },
    { name: verticalLabel, url: abs(verticalBase) },
    { name: displayName, url: abs(path) },
  ]);

  const faq = faqPage(
    (displayFaqs || []).map((f) => ({ question: f.q, answer: f.a })),
    "service-faq",
  );

  const primary =
    entry.schemaType === "Product"
      ? productSchema({
          name: displayName,
          description: displayMetaDescription,
          image: entry.heroImage || "",
          url: abs(path),
          price: entry.priceFrom,
          currency: "INR",
        })
      : serviceSchema({
          name: displayName,
          description: displayMetaDescription,
          url: abs(path),
          areaServed: "IN",
          providerName: "Vedic Tatva",
        });

  const englishDefaultCta =
    entry.primaryCta || {
      label:
        entry.vertical === "puja"
          ? `Book ${entry.name}`
          : entry.vertical === "astrology"
            ? "Book Consultation"
            : `Buy ${entry.name}`,
      href:
        entry.vertical === "puja"
          ? "/puja"
          : entry.vertical === "astrology"
            ? "/astrology"
            : "/shop",
    };

  const hiDefaultCta = isHi
    ? {
        label:
          hi?.primaryCta?.label ??
          (entry.vertical === "puja"
            ? `${displayName} ${HI_UI.bookGeneric}`
            : entry.vertical === "astrology"
              ? HI_UI.bookConsultation
              : `${displayName} ${HI_UI.buyGeneric}`),
        href: hi?.primaryCta?.href ?? englishDefaultCta.href,
      }
    : null;

  const defaultCta = hiDefaultCta ?? englishDefaultCta;

  const secondaryCta = isHi && entry.secondaryCta
    ? {
        label: hi?.secondaryCta?.label ?? entry.secondaryCta.label,
        href: hi?.secondaryCta?.href ?? entry.secondaryCta.href,
      }
    : entry.secondaryCta;

  return (
    <div className="w-full pb-16 bg-white" data-testid={`service-landing-${entry.slug}`}>
      <PageSeo
        title={displayMetaTitle}
        description={displayMetaDescription}
        keywords={entry.metaKeywords}
        canonical={path}
        ogTitle={displayMetaTitle}
        ogDescription={displayMetaDescription}
        ogImage={entry.heroImage}
        ogType={entry.schemaType === "Product" ? "product" : "website"}
        twitterCard="summary_large_image"
        schemas={[breadcrumbs, primary, faq]}
      />

      {/* Breadcrumb strip */}
      <nav
        className="container mx-auto px-4 pt-4 text-[12px] text-[#5a4a3a]/70 flex items-center gap-1.5 flex-wrap"
        aria-label="Breadcrumb"
      >
        <Link href="/" className="hover:text-[#6D2B35]" data-testid="breadcrumb-home">
          {isHi ? HI_UI.breadcrumbHome : "Home"}
        </Link>
        <ChevronRight className="w-3.5 h-3.5 opacity-50" />
        <Link
          href={verticalBase}
          className="hover:text-[#6D2B35]"
          data-testid="breadcrumb-vertical"
        >
          {verticalLabel}
        </Link>
        <ChevronRight className="w-3.5 h-3.5 opacity-50" />
        <span className="text-[#6D2B35] font-semibold" data-testid="breadcrumb-current">
          {displayName}
        </span>
      </nav>

      <PageHero
        eyebrow={displayEyebrow}
        title={displayName}
        subtitle={displayHeroSubtitle}
        variant="maroon"
        testId={`hero-${entry.slug}`}
      >
        {!isHi && entry.nameHi && (
          <div
            className="text-[#D4AF37] text-base font-serif"
            style={{ fontFamily: "'Noto Sans Devanagari','Tiro Devanagari Sanskrit', serif" }}
            data-testid={`hindi-${entry.slug}`}
          >
            {entry.nameHi}
          </div>
        )}
        <div className="mt-4 flex items-center justify-center gap-3 flex-wrap">
          <Button
            asChild
            className="bg-[#D4AF37] text-[#6D2B35] hover:bg-[#c4a030] rounded-md h-10 px-5 text-[13px] font-semibold"
          >
            <Link href={defaultCta.href} data-testid="cta-primary">
              {defaultCta.label} <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Link>
          </Button>
          {secondaryCta && (
            <Button
              asChild
              variant="outline"
              className="border-white/40 bg-white/10 text-white hover:bg-white/20 rounded-md h-10 px-5 text-[13px] font-semibold"
            >
              <Link href={secondaryCta.href} data-testid="cta-secondary">
                {secondaryCta.label}
              </Link>
            </Button>
          )}
        </div>
      </PageHero>

      <div className="container mx-auto px-4">
        {/* Quick Answer block — AI Overviews target */}
        <section className="pt-10">
          <div
            className="max-w-3xl mx-auto rounded-lg border border-[#D4AF37]/30 bg-[#FBF7EE] p-5 sm:p-6"
            data-testid="quick-answer"
          >
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-[#D4AF37]" />
              <span className="text-[10px] uppercase tracking-[0.25em] font-semibold text-[#D4AF37]">
                {isHi ? HI_UI.quickAnswer : "Quick Answer"}
              </span>
            </div>
            <p className="text-[14px] leading-relaxed text-[#5a4a3a]">{displayQuickAnswer}</p>
          </div>
        </section>

        {/* Editorial sections */}
        {displaySections && displaySections.length > 0 && (
          <section className="py-12 max-w-3xl mx-auto">
            <div className="space-y-8">
              {displaySections.map((s, i) => (
                <div key={i} data-testid={`section-${i}`}>
                  <h2 className="font-serif text-xl md:text-2xl font-semibold text-[#6D2B35] mb-3 leading-tight">
                    {s.heading}
                  </h2>
                  <p className="text-[14px] leading-relaxed text-[#5a4a3a]/85 whitespace-pre-line">
                    {s.body}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Benefits */}
        {displayBenefits.length > 0 && (
          <section className="py-12 border-t border-[#D4AF37]/15">
            <SectionHeader
              eyebrow={isHi ? HI_UI.whyItMatters : "Why It Matters"}
              title={isHi ? HI_UI.keyBenefits : "Key benefits"}
              subtitle={isHi ? HI_UI.keyBenefitsSub : "What devotees gain from this service."}
            />
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
              {displayBenefits.map((b, i) => (
                <Card key={i} className={`${slimCard} shadow-none`} data-testid={`benefit-${i}`}>
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      <IconTile icon={b.icon} />
                      <div>
                        <h3 className="text-base font-serif font-semibold text-[#6D2B35] mb-1.5">
                          {b.title}
                        </h3>
                        <p className="text-[12.5px] text-[#5a4a3a]/65 leading-relaxed">{b.body}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Who should do this */}
        {displayWho && displayWho.length > 0 && (
          <section className="py-12 border-t border-[#D4AF37]/15">
            <SectionHeader
              eyebrow={isHi ? HI_UI.rightForYou : "Right For You?"}
              title={isHi ? HI_UI.whoConsider : "Who should consider this"}
            />
            <div className="mt-6 max-w-2xl mx-auto">
              <ul className="space-y-2">
                {displayWho.map((line, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-[13.5px] text-[#5a4a3a]/85"
                    data-testid={`who-${i}`}
                  >
                    <span className="text-[#D4AF37] mt-0.5">◆</span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* Inclusions + Mantras grid */}
        {((displayInclusions && displayInclusions.length > 0) ||
          (displayMantras && displayMantras.length > 0)) && (
          <section className="py-12 border-t border-[#D4AF37]/15">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
              {displayInclusions && displayInclusions.length > 0 && (
                <div className="rounded-lg border border-[#D4AF37]/25 bg-white p-6">
                  <h3 className="text-lg font-serif font-semibold text-[#6D2B35] mb-4">
                    {isHi ? HI_UI.whatsIncluded : "What's included"}
                  </h3>
                  <ul className="space-y-2">
                    {displayInclusions.map((inc, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-[13px] text-[#5a4a3a]/85"
                        data-testid={`incl-${i}`}
                      >
                        <span className="text-[#D4AF37] mt-0.5">✓</span>
                        <span>{inc}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {displayMantras && displayMantras.length > 0 && (
                <div className="rounded-lg border border-[#D4AF37]/25 bg-[#FBF7EE] p-6">
                  <h3 className="text-lg font-serif font-semibold text-[#6D2B35] mb-4">
                    {isHi ? HI_UI.mantras : "Mantras"}
                  </h3>
                  <div className="space-y-4">
                    {displayMantras.map((m, i) => (
                      <div key={i} data-testid={`mantra-${i}`}>
                        <div
                          className="text-[15px] text-[#6D2B35] font-medium leading-relaxed"
                          style={{
                            fontFamily:
                              "'Noto Sans Devanagari','Tiro Devanagari Sanskrit', serif",
                          }}
                        >
                          {m.sanskrit}
                        </div>
                        <div className="text-[12px] text-[#5a4a3a]/65 mt-1 leading-relaxed">
                          {m.meaning}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* FAQ */}
        {displayFaqs && displayFaqs.length > 0 && (
          <section className="py-12 border-t border-[#D4AF37]/15">
            <SectionHeader
              eyebrow={isHi ? HI_UI.faqEyebrow : "Frequently Asked"}
              title={isHi ? HI_UI.faqTitle : "Common questions"}
            />
            <div className="mt-8 max-w-3xl mx-auto">
              <Accordion type="single" collapsible className="w-full">
                {displayFaqs.map((f, i) => (
                  <AccordionItem
                    key={i}
                    value={`faq-${i}`}
                    className="border-b border-[#D4AF37]/20"
                    data-testid={`faq-${i}`}
                  >
                    <AccordionTrigger className="text-left text-[14px] font-semibold text-[#6D2B35] hover:no-underline py-4">
                      {f.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-[13px] text-[#5a4a3a]/80 leading-relaxed pb-4">
                      {f.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </section>
        )}

        {/* Related */}
        {related.length > 0 && (
          <section className="py-12 border-t border-[#D4AF37]/15">
            <SectionHeader
              eyebrow={isHi ? HI_UI.exploreMore : "Explore More"}
              title={isHi ? HI_UI.relatedServices : "Related services"}
            />
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
              {related.map((r) => {
                const rName = isHi ? r.hi?.name ?? r.nameHi ?? r.name : r.name;
                const rEyebrow = isHi ? r.hi?.eyebrow ?? r.eyebrow : r.eyebrow;
                const rSub = isHi ? r.hi?.heroSubtitle ?? r.heroSubtitle : r.heroSubtitle;
                return (
                  <Link key={r.slug} href={entryPath(r)}>
                    <Card
                      className={`${slimCard} h-full cursor-pointer group shadow-none`}
                      data-testid={`related-${r.slug}`}
                    >
                      <CardContent className="p-5">
                        <div className="text-[10px] uppercase tracking-[0.18em] font-semibold text-[#D4AF37] mb-2">
                          {rEyebrow}
                        </div>
                        <h3 className="text-base font-serif font-semibold text-[#6D2B35] mb-1.5 leading-tight">
                          {rName}
                        </h3>
                        <p className="text-[12.5px] text-[#5a4a3a]/65 leading-relaxed mb-3 line-clamp-3">
                          {rSub}
                        </p>
                        <div className="inline-flex items-center text-[#6D2B35] text-[12px] font-semibold group-hover:gap-1.5 gap-1 transition-all">
                          {isHi ? HI_UI.explore : "Explore"} <ArrowRight className="w-3.5 h-3.5" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Closing CTA */}
        <section className="py-12">
          <div className="rounded-lg border border-[#D4AF37]/25 bg-[#FBF7EE] p-6 sm:p-8 max-w-3xl mx-auto text-center">
            <h2 className="font-serif text-xl md:text-2xl font-semibold text-[#6D2B35] mb-2">
              {isHi ? HI_UI.readyTitle : "Ready to begin?"}
            </h2>
            <p className="text-[13px] text-[#5a4a3a]/70 mb-5 max-w-xl mx-auto leading-relaxed">
              {isHi
                ? HI_UI.readyBody
                : "Verified Vedic experts, transparent pricing, and the full sankalp recorded for you and your family."}
            </p>
            <Button
              asChild
              className="bg-[#6D2B35] text-white hover:bg-[#5a2430] rounded-md h-11 px-6 text-[13px] font-semibold"
            >
              <Link href={defaultCta.href} data-testid="cta-bottom">
                {defaultCta.label} <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Link>
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}

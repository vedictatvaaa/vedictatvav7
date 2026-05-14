import { Link } from "wouter";
import { ChevronRight, Sparkles, ShieldCheck, ArrowRight, CheckCircle2, BookOpen } from "lucide-react";
import PageSeo from "@/components/PageSeo";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  abs,
  breadcrumbList as breadcrumbListSchema,
  faqPage as faqPageSchema,
  service as serviceSchema,
  blogPosting as blogPostingSchema,
  localBusiness as localBusinessSchema,
  type Schema,
} from "@/lib/seo-schemas";

export type SeoCTA = { label: string; href: string; variant?: "primary" | "outline" };
export type SeoFAQ = { q: string; a: string };
export type SeoSection = {
  heading: string;
  body?: string;
  bullets?: string[];
};
export type SeoCrumb = { name: string; url: string };

export interface SeoLandingPageProps {
  // SEO meta
  seoTitle: string;
  seoDescription: string;
  seoKeywords?: string;
  canonical: string;
  ogImage?: string;
  // Visible breadcrumb (last item is current page, no link rendered)
  breadcrumbs: SeoCrumb[];
  // Hero
  eyebrow: string;
  h1: string;
  subtitle?: string;
  heroCTAs?: SeoCTA[];
  trustChips?: string[];
  // Body content
  intro?: string;
  sections: SeoSection[];
  faqs: SeoFAQ[];
  // Final CTA band
  finalCtaTitle?: string;
  finalCtaSubtitle?: string;
  finalCtaButtons?: SeoCTA[];
  // Related links shown at the bottom
  relatedLinks?: Array<{ label: string; href: string }>;
  // Structured data — pick one
  schema?:
    | { type: "service"; serviceName: string; areaServed?: string[] }
    | { type: "article"; datePublished: string; dateModified?: string; image?: string }
    | { type: "localbusiness"; city: string; region?: string };
}

export default function SeoLandingPage(props: SeoLandingPageProps) {
  const {
    seoTitle,
    seoDescription,
    seoKeywords,
    canonical,
    ogImage,
    breadcrumbs,
    eyebrow,
    h1,
    subtitle,
    heroCTAs = [],
    trustChips = [],
    intro,
    sections,
    faqs,
    finalCtaTitle,
    finalCtaSubtitle,
    finalCtaButtons = [],
    relatedLinks = [],
    schema,
  } = props;

  const schemas: Schema[] = [
    breadcrumbListSchema(breadcrumbs.map((b) => ({ name: b.name, url: b.url }))),
  ];
  const faqSchema = faqPageSchema(
    faqs.map((f) => ({ question: f.q, answer: f.a })),
    `${canonical.replace(/[^a-z0-9]/gi, "-")}-faq`,
  );
  if (faqSchema) schemas.push(faqSchema);
  if (schema?.type === "service") {
    schemas.push(
      serviceSchema({
        name: schema.serviceName,
        description: seoDescription,
        url: abs(canonical),
        providerName: "Vedic Tatva",
        areaServed: schema.areaServed || ["IN", "US", "GB", "CA", "AU", "SG", "AE"],
      }),
    );
  } else if (schema?.type === "article") {
    schemas.push(
      blogPostingSchema({
        title: h1,
        description: seoDescription,
        url: canonical,
        image: schema.image || ogImage,
        datePublished: schema.datePublished,
        dateModified: schema.dateModified || schema.datePublished,
        authorName: "Vedic Tatva Editorial",
        publisherName: "Vedic Tatva",
      }),
    );
  } else if (schema?.type === "localbusiness") {
    schemas.push(
      localBusinessSchema({
        name: `Vedic Tatva — Verified Pandits in ${schema.city}`,
        description: seoDescription,
        url: canonical,
        city: schema.city,
        region: schema.region,
        country: "IN",
      }),
    );
  }

  return (
    <div className="w-full pb-16 bg-white">
      <PageSeo
        title={seoTitle}
        description={seoDescription}
        keywords={seoKeywords}
        canonical={canonical}
        ogType={schema?.type === "article" ? "article" : "website"}
        twitterCard="summary_large_image"
        ogImage={ogImage}
        schemas={schemas}
      />

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="bg-[#FBF7EE] border-b border-[#D4AF37]/15">
        <ol className="container mx-auto px-4 py-1.5 flex items-center gap-1 text-[11px] sm:text-[12px] text-[#5a4a3a]/75 overflow-x-auto whitespace-nowrap">
          {breadcrumbs.map((b, i) => {
            const last = i === breadcrumbs.length - 1;
            return (
              <li
                key={b.url}
                className="flex items-center gap-1"
                {...(last ? { "aria-current": "page" as const } : {})}
              >
                {i > 0 && <ChevronRight className="w-3 h-3 inline shrink-0" aria-hidden="true" />}
                {last ? (
                  <span className="text-[#6D2B35] font-semibold">{b.name}</span>
                ) : (
                  <Link href={b.url} className="hover:text-[#6D2B35]" data-testid={`link-breadcrumb-${i}`}>{b.name}</Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      {/* Hero */}
      <section className="bg-[#6D2B35] border-b border-[#D4AF37]/30 text-white">
        <div className="container mx-auto px-4 py-7 sm:py-10 md:py-14 text-center max-w-3xl">
          <div className="flex items-center justify-center gap-2 mb-2.5">
            <span className="h-px w-6 sm:w-8 bg-[#D4AF37]/60" />
            <span className="inline-flex items-center gap-1.5 text-[9px] sm:text-[11px] uppercase tracking-[0.28em] sm:tracking-[0.3em] text-[#D4AF37] font-semibold">
              <Sparkles className="w-3 h-3" /> {eyebrow}
            </span>
            <span className="h-px w-6 sm:w-8 bg-[#D4AF37]/60" />
          </div>
          <h1
            className="text-[20px] leading-[1.2] sm:text-2xl md:text-3xl lg:text-4xl font-serif mb-2 sm:mb-3 font-semibold tracking-tight"
            data-testid="text-seo-h1"
          >
            {h1}
          </h1>
          {subtitle && (
            <p className="text-white/75 max-w-xl mx-auto text-[13px] sm:text-sm md:text-[15px] leading-snug sm:leading-relaxed">
              {subtitle}
            </p>
          )}
          {heroCTAs.length > 0 && (
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {heroCTAs.map((c) => (
                <Button
                  key={c.href + c.label}
                  asChild
                  size="default"
                  variant={c.variant === "outline" ? "outline" : "default"}
                  className={
                    c.variant === "outline"
                      ? "rounded-md bg-white/5 border-white/40 text-white hover:bg-white/10"
                      : "rounded-md bg-[#D4AF37] text-[#6D2B35] hover:bg-[#D4AF37]/90 font-semibold"
                  }
                  data-testid={`button-hero-cta-${c.label.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  <Link href={c.href}>
                    {c.label}
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Link>
                </Button>
              ))}
            </div>
          )}
          {trustChips.length > 0 && (
            <div className="mt-5 flex flex-wrap justify-center gap-1.5">
              {trustChips.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 sm:gap-1.5 rounded-md border border-white/15 bg-white/8 px-2 sm:px-3 h-7 sm:h-8 text-[10px] sm:text-[11px] font-semibold text-white/80"
                >
                  <ShieldCheck className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-[#D4AF37]" />
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Body */}
      <article className="container mx-auto px-4 max-w-3xl mt-8 sm:mt-10">
        {intro && (
          <p className="text-[15px] sm:text-base text-[#5a4a3a] leading-relaxed mb-8" data-testid="text-seo-intro">
            {intro}
          </p>
        )}

        {sections.map((s, idx) => (
          <section
            key={s.heading}
            className="mb-7 sm:mb-9"
            data-testid={`section-seo-${idx}`}
          >
            <h2 className="font-serif text-xl sm:text-2xl text-[#6D2B35] font-semibold tracking-tight mb-3">
              {s.heading}
            </h2>
            {s.body && (
              <p className="text-[14.5px] sm:text-[15.5px] text-[#5a4a3a]/90 leading-relaxed">
                {s.body}
              </p>
            )}
            {s.bullets && s.bullets.length > 0 && (
              <ul className="mt-3 space-y-2">
                {s.bullets.map((b, bi) => (
                  <li
                    key={bi}
                    className="flex gap-2 text-[14.5px] sm:text-[15px] text-[#5a4a3a]/90 leading-relaxed"
                  >
                    <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-[#D4AF37]" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}

        {/* FAQs */}
        {faqs.length > 0 && (
          <section className="mb-8 sm:mb-10" data-testid="section-seo-faqs">
            <h2 className="font-serif text-xl sm:text-2xl text-[#6D2B35] font-semibold tracking-tight mb-3">
              Frequently Asked Questions
            </h2>
            <Accordion type="single" collapsible className="w-full border border-[#D4AF37]/20 rounded-md bg-[#FBF7EE]/40">
              {faqs.map((f, i) => (
                <AccordionItem key={i} value={`faq-${i}`} className="border-[#D4AF37]/15 px-4">
                  <AccordionTrigger
                    className="text-left text-[14.5px] sm:text-[15px] font-semibold text-[#6D2B35] py-3.5"
                    data-testid={`faq-question-${i}`}
                  >
                    {f.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-[14px] sm:text-[14.5px] text-[#5a4a3a]/90 leading-relaxed pb-3.5">
                    {f.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>
        )}
      </article>

      {/* Final CTA */}
      {finalCtaTitle && (
        <section className="container mx-auto px-4 max-w-3xl">
          <div className="bg-gradient-to-br from-[#6D2B35] to-[#4d1d27] text-white rounded-md p-6 sm:p-8 text-center border border-[#D4AF37]/30">
            <h2 className="font-serif text-xl sm:text-2xl font-semibold mb-2">{finalCtaTitle}</h2>
            {finalCtaSubtitle && (
              <p className="text-white/75 text-sm sm:text-[15px] leading-relaxed mb-5 max-w-xl mx-auto">
                {finalCtaSubtitle}
              </p>
            )}
            <div className="flex flex-wrap justify-center gap-2">
              {finalCtaButtons.map((c) => (
                <Button
                  key={c.href + c.label}
                  asChild
                  size="default"
                  variant={c.variant === "outline" ? "outline" : "default"}
                  className={
                    c.variant === "outline"
                      ? "rounded-md bg-white/5 border-white/40 text-white hover:bg-white/10"
                      : "rounded-md bg-[#D4AF37] text-[#6D2B35] hover:bg-[#D4AF37]/90 font-semibold"
                  }
                  data-testid={`button-final-cta-${c.label.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  <Link href={c.href}>
                    {c.label}
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Link>
                </Button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Related */}
      {relatedLinks.length > 0 && (
        <section className="container mx-auto px-4 max-w-3xl mt-8">
          <h3 className="font-serif text-base sm:text-lg text-[#6D2B35] font-semibold mb-3 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#D4AF37]" /> Explore More
          </h3>
          <div className="flex flex-wrap gap-2">
            {relatedLinks.map((r) => (
              <Link
                key={r.href}
                href={r.href}
                className="inline-flex items-center gap-1.5 rounded-md border border-[#D4AF37]/30 bg-[#FBF7EE] px-3 h-8 text-[12px] font-semibold text-[#6D2B35] hover-elevate active-elevate-2"
                data-testid={`link-related-${r.href.replace(/[^a-z0-9]/gi, "-")}`}
              >
                {r.label}
                <ArrowRight className="w-3 h-3" />
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  Flame,
  Flower2,
  Gem,
  Home,
  Laptop,
  MapPin,
  MoonStar,
  Package,
  Sparkles,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import PageSeo from "@/components/PageSeo";
import { getPartnerCopy } from "@/lib/partner-copy";
import { partnerProviders } from "@/lib/partner-providers";
import { useI18n } from "@/lib/i18n";

const providerIcons: Record<string, LucideIcon> = {
  pandit: Flame,
  astrologer: MoonStar,
};

const benefitIcons: LucideIcon[] = [UsersRound, Laptop, Sparkles, Package];
const opportunityIcons: LucideIcon[] = [UsersRound, Gem, Laptop, CalendarDays];
const statIcons: LucideIcon[] = [UsersRound, Home, Flower2, MapPin];
const opportunityFill = [8, 9, 8, 7];

function SegmentedGauge({ filled, label }: { filled: number; label: string }) {
  return (
    <div
      className="flex gap-1"
      role="img"
      aria-label={label}
      data-testid="partner-capability-gauge"
    >
      {Array.from({ length: 10 }, (_, index) => (
        <span
          key={index}
          className={`h-1.5 flex-1 rounded-full ${
            index < filled ? "bg-[#6D2B35]" : "bg-[#DADFD7]"
          }`}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

function Atmosphere() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute -left-24 top-24 h-64 w-64 rounded-full bg-[#DCE8D8]/70 blur-3xl" />
      <div className="absolute -right-24 top-8 h-72 w-72 rounded-full bg-[#F1DFB5]/50 blur-3xl" />
      <div className="absolute left-1/2 top-[30rem] h-96 w-96 -translate-x-1/2 rounded-full bg-[#F8E7E1]/45 blur-3xl" />
      <div className="absolute -right-24 top-24 h-80 w-80 rounded-full border border-[#D4AF37]/20" />
      <div className="absolute -right-12 top-36 h-56 w-56 rounded-full border border-[#D4AF37]/15" />
      <div className="absolute left-[-3.5rem] top-48 h-44 w-24 rotate-[18deg] rounded-[100%_0_100%_0] border border-[#8EA98B]/35 bg-[#DCE8D8]/30" />
      <div className="absolute left-[-1.5rem] top-40 h-32 w-16 rotate-[-18deg] rounded-[100%_0_100%_0] bg-[#AFC7A9]/25" />
      <div className="absolute bottom-0 left-1/2 h-56 w-[34rem] -translate-x-1/2 rounded-[50%] bg-[#F1DFB5]/25 blur-3xl" />
    </div>
  );
}

function DevotionalMark() {
  return (
    <div className="relative grid h-12 w-12 shrink-0 place-items-center rounded-full border border-[#D4AF37]/30 bg-[#F1DFB5]/65 text-[#7F5A15] shadow-[0_10px_22px_rgba(127,90,21,.10)] sm:h-14 sm:w-14">
      <span className="absolute inset-1.5 rounded-full border border-[#D4AF37]/40" />
      <Flower2 className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={1.25} />
      <span className="absolute bottom-1 text-[7px] font-semibold tracking-[0.22em]">ॐ</span>
    </div>
  );
}

function BottomFlourish() {
  return (
    <div className="pointer-events-none absolute bottom-0 left-0 h-40 w-72 opacity-70" aria-hidden="true">
      <div className="absolute bottom-[-3rem] left-[-2rem] h-28 w-64 rounded-[50%] bg-[#DCE8D8]/60 blur-xl" />
      <div className="absolute bottom-2 left-8 h-10 w-32 rounded-[50%] border border-[#D4AF37]/35 bg-[#F1DFB5]/40 rotate-[-8deg]" />
      <div className="absolute bottom-7 left-20 h-14 w-10 rotate-[-30deg] rounded-[100%_0_100%_0] bg-[#AFC7A9]/55" />
      <div className="absolute bottom-4 left-40 h-16 w-12 rotate-[25deg] rounded-[0_100%_0_100%] bg-[#8EA98B]/40" />
      <Flame className="absolute bottom-12 left-16 h-6 w-6 text-[#A67817]" strokeWidth={1.2} />
    </div>
  );
}

export default function PartnerPage() {
  const [, setLocation] = useLocation();
  const { language } = useI18n();
  const copy = getPartnerCopy(language);
  const [selectedProvider, setSelectedProvider] = useState("pandit");

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back();
      return;
    }
    setLocation("/");
  };

  return (
    <div
      className="relative isolate min-h-full overflow-hidden bg-[#F7F9F5] text-[#5A4A3A]"
      data-testid="partner-entry-page"
    >
      <PageSeo
        title={language === "hi" ? "Vedic Tatva से जुड़ें" : "Partner with Vedic Tatva"}
        description={copy.intro}
        ogType="website"
      />
      <Atmosphere />

      <div className="relative z-10 mx-auto w-full max-w-[1080px] px-4 pb-10 pt-3 sm:px-6 sm:pb-14 sm:pt-5 lg:px-10">
        <button
          type="button"
          onClick={handleBack}
          className="group inline-flex min-h-10 items-center gap-2 rounded-full px-1 text-[12px] font-semibold text-[#6B5B52] transition-colors hover:text-[#6D2B35] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F7F9F5] max-[519px]:text-[13px]"
          aria-label={copy.backAria}
          data-testid="button-partner-back"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" aria-hidden="true" />
          {copy.back}
        </button>

        <header className="relative mt-2 overflow-hidden rounded-2xl border border-white/80 bg-white/55 p-4 shadow-[0_14px_38px_rgba(77,40,36,.07)] backdrop-blur-xl sm:mt-4 sm:rounded-[1.5rem] sm:p-6">
          <div className="absolute -right-8 -top-12 h-40 w-40 rounded-full border border-[#D4AF37]/20" aria-hidden="true" />
          <div className="absolute -right-1 top-2 h-24 w-24 rounded-full border border-[#D4AF37]/15" aria-hidden="true" />
          <div className="relative flex items-start gap-3 sm:gap-5">
            <DevotionalMark />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5 text-[8px] font-bold uppercase tracking-[0.16em] text-[#A67817]">
                <span>{copy.eyebrow}</span>
                <span className="h-1 w-1 rounded-full bg-[#D4AF37]" aria-hidden="true" />
                <span className="tracking-[0.12em] text-[#8EA98B]">Partner circle</span>
              </div>
              <h1
                id="partner-page-heading"
                className="mt-2 max-w-[720px] font-serif text-[clamp(1.8rem,5vw,3.25rem)] font-semibold leading-[1] tracking-[-0.05em] text-[#6D2B35] max-[519px]:text-[clamp(1.75rem,8.5vw,2.35rem)]"
              >
                {copy.heading}
              </h1>
              <p className="mt-2 max-w-[610px] text-[12px] leading-[1.4] text-[#6B5B52] sm:text-[14px]">
                {copy.intro}
              </p>
            </div>
          </div>
          <div className="relative mt-3 flex items-center gap-3 text-[10px] italic text-[#806F5E] sm:mt-4 sm:text-[12px]">
            <span className="h-px w-8 bg-[#D4AF37]/60" aria-hidden="true" />
            <span>Tradition empowers together</span>
            <span className="h-px flex-1 bg-[#D4AF37]/30" aria-hidden="true" />
          </div>
        </header>

        <section className="mt-5" aria-labelledby="provider-options-heading">
          <div className="mb-3 flex items-end justify-between gap-3 px-1">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#A67817]">Choose your path</p>
              <h2 id="provider-options-heading" className="mt-1 font-serif text-lg font-semibold tracking-[-0.03em] text-[#6D2B35] sm:text-xl">
                {language === "hi" ? "अपनी जगह चुनें" : "Find your place in the circle"}
              </h2>
            </div>
            <span className="hidden rounded-full border border-[#8EA98B]/30 bg-[#DCE8D8]/45 px-3 py-1.5 text-[10px] font-semibold text-[#56745B] sm:inline-flex">
              One meaningful step
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:max-w-[430px] sm:gap-3" role="tablist" aria-label={language === "hi" ? "साझेदारी के विकल्प" : "Partner options"}>
            {partnerProviders.map((provider) => {
              const isActive = provider.active && Boolean(provider.destination);
              const providerCopy = copy.providers[provider.id];
              const ProviderIcon = providerIcons[provider.id];
              const isSelected = selectedProvider === provider.id;

              if (!isActive) {
                return (
                  <div
                    key={provider.id}
                    className="flex min-h-[98px] items-center gap-2 rounded-2xl border border-[#6D2B35]/10 bg-[#F0F0EC]/65 px-3 py-2.5 opacity-75 sm:min-h-[108px]"
                    role="tab"
                    aria-selected="false"
                    aria-disabled="true"
                    aria-label={copy.statusUnavailableAria}
                    data-testid={`partner-provider-card-${provider.id}`}
                  >
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-[#6D2B35]/10 bg-[#E5E3DF] text-[#806F5E]">
                      <ProviderIcon className="h-6 w-6" strokeWidth={1.35} aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-serif text-[15px] font-semibold leading-none text-[#806F5E]">{providerCopy.title}</span>
                      <span className="mt-1 block text-[8px] font-bold uppercase leading-[1.2] tracking-[0.06em] text-[#806F5E]">{providerCopy.status}</span>
                    </span>
                  </div>
                );
              }

              return (
                <button
                  key={provider.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  aria-controls="partner-provider-panel"
                  onClick={() => setSelectedProvider(provider.id)}
                  className={`flex min-h-[98px] items-center gap-2 rounded-2xl border px-3 py-2.5 text-left transition-all sm:min-h-[108px] ${
                    isSelected
                      ? "border-[#D4AF37]/65 bg-white/80 shadow-[0_10px_22px_rgba(77,40,36,.09)]"
                      : "border-white/80 bg-white/45 hover:border-[#D4AF37]/35 hover:bg-white/70"
                  }`}
                  data-testid={`partner-provider-card-${provider.id}`}
                >
                  <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full border ${
                    isSelected ? "border-[#D4AF37]/35 bg-[#F1DFB5] text-[#7F5A15]" : "border-[#D4AF37]/20 bg-[#F8F1E3] text-[#A67817]"
                  }`}>
                    <ProviderIcon className="h-6 w-6" strokeWidth={1.35} aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-serif text-[15px] font-semibold leading-none text-[#6D2B35]">{providerCopy.title}</span>
                    <span className="mt-1 block text-[8px] font-bold uppercase leading-[1.2] tracking-[0.06em] text-[#56745B]">{providerCopy.status}</span>
                  </span>
                </button>
              );
            })}
          </div>

          {partnerProviders.map((provider) => {
            if (provider.id !== selectedProvider) return null;
            const providerCopy = copy.providers[provider.id];
            const isActive = provider.active && Boolean(provider.destination);
            return (
              <div
                key={provider.id}
                id="partner-provider-panel"
                className="relative mt-3 overflow-hidden rounded-2xl border border-[#D4AF37]/30 bg-white/65 p-4 shadow-[0_12px_28px_rgba(77,40,36,.06)] backdrop-blur-xl sm:p-5"
                role="tabpanel"
                aria-labelledby={`partner-provider-card-${provider.id}`}
              >
                <div className="absolute right-[-2rem] top-[-3rem] h-24 w-24 rounded-full border border-[#D4AF37]/20" aria-hidden="true" />
                <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#A67817]">
                      {language === "hi" ? "आपकी साधना, आपका विस्तार" : "Your practice, expanded"}
                    </p>
                    <h3 className="mt-1 font-serif text-xl font-semibold tracking-[-0.03em] text-[#6D2B35]">{providerCopy.title}</h3>
                    <p className="mt-1 max-w-[560px] text-[11px] leading-[1.4] text-[#6B5B52] sm:text-[12px]">{providerCopy.description}</p>
                    <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
                      {providerCopy.benefits.map((benefit) => (
                        <li key={benefit} className="flex items-center gap-1.5 text-[10px] text-[#6B5B52]">
                          <span className={`grid h-3.5 w-3.5 place-items-center rounded-full ${isActive ? "bg-[#A67817] text-white" : "bg-[#C6C3BE] text-white"}`}>
                            <Check className="h-2 w-2" strokeWidth={3} aria-hidden="true" />
                          </span>
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>
                  {isActive && (
                    <Link
                      href={provider.destination || "/pandit/login"}
                      className="group/cta flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#6D2B35] px-4 text-[11px] font-semibold text-white shadow-[0_8px_16px_rgba(109,43,53,.15)] transition-all hover:bg-[#55252D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2 sm:min-w-[170px]"
                      data-testid="link-partner-pandit-login"
                    >
                      <span>{providerCopy.cta}</span>
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/cta:translate-x-0.5" aria-hidden="true" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </section>

        <section className="mt-10" aria-labelledby="partner-benefits-heading">
          <div className="mb-4 flex items-end justify-between gap-4 px-1">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#A67817]">A supportive ecosystem</p>
              <h2 id="partner-benefits-heading" className="mt-1 font-serif text-2xl font-semibold tracking-[-0.04em] text-[#6D2B35] sm:text-3xl">
                {copy.benefitsHeading}
              </h2>
            </div>
            <p className="hidden max-w-[220px] text-right text-[11px] leading-[1.35] text-[#806F5E] sm:block">{copy.benefitsIntro}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {copy.benefits.map((benefit, index) => {
              const BenefitIcon = benefitIcons[index];
              return (
                <article
                  key={benefit.title}
                  className="flex min-h-[190px] flex-col rounded-2xl border border-white/80 bg-white/60 p-3.5 shadow-[0_12px_28px_rgba(77,40,36,.06)] backdrop-blur-xl sm:p-4"
                >
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#F1DFB5] text-[#7F5A15]">
                    <BenefitIcon className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
                  </div>
                  <h3 className="mt-4 font-serif text-[14px] font-semibold leading-[1.05] text-[#6D2B35] sm:text-[16px]">{benefit.title}</h3>
                  <p className="mt-2 text-[10px] leading-[1.35] text-[#6B5B52] sm:text-[11px]">{benefit.descriptor}</p>
                  <p className="mt-1 text-[10px] leading-[1.35] text-[#806F5E] sm:text-[11px]">{benefit.description}</p>
                  <span className="mt-auto self-start rounded-full bg-[#DCE8D8] px-2.5 py-1 text-[8px] font-bold tracking-[0.08em] text-[#56745B]">{benefit.badge}</span>
                </article>
              );
            })}
          </div>
        </section>

        <section className="mt-10" aria-labelledby="partner-opportunities-heading">
          <div className="mb-4 px-1">
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#A67817]">A wider circle of service</p>
            <h2 id="partner-opportunities-heading" className="mt-1 font-serif text-2xl font-semibold tracking-[-0.04em] text-[#6D2B35] sm:text-3xl">
              {copy.opportunityHeading}
            </h2>
            <p className="mt-1 max-w-[590px] text-[12px] text-[#6B5B52] sm:text-sm">{copy.opportunityIntro}</p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {copy.opportunities.map((opportunity, index) => {
              const OpportunityIcon = opportunityIcons[index];
              return (
                <article
                  key={opportunity.title}
                  className="rounded-2xl border border-white/80 bg-white/55 p-4 shadow-[0_12px_28px_rgba(77,40,36,.05)] backdrop-blur-xl"
                  aria-label={copy.gaugeAria(opportunity.title, opportunity.descriptor)}
                >
                  <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.12em] text-[#6B5B52]">
                    <OpportunityIcon className="h-4 w-4 shrink-0 text-[#A67817]" strokeWidth={1.6} aria-hidden="true" />
                    <span>{opportunity.title}</span>
                  </div>
                  <div className="mt-4">
                    <SegmentedGauge filled={opportunityFill[index]} label={copy.gaugeAria(opportunity.title, opportunity.descriptor)} />
                  </div>
                  <p className="mt-3 font-serif text-[15px] font-semibold leading-[1.05] text-[#6D2B35]">{opportunity.gaugeLabel}</p>
                  <p className="mt-2 text-[11px] leading-[1.35] text-[#806F5E]">{opportunity.description}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="mt-8 grid grid-cols-2 overflow-hidden rounded-2xl border border-[#D4AF37]/25 bg-white/55 shadow-[0_12px_28px_rgba(77,40,36,.06)] backdrop-blur-xl sm:grid-cols-4" aria-label={language === "hi" ? "प्लेटफ़ॉर्म तथ्य" : "Platform facts"}>
          {copy.stats.map((stat, index) => {
            const StatIcon = statIcons[index];
            return (
              <div key={stat.label} className="flex items-center gap-3 border-b border-[#D4AF37]/20 p-4 text-left last:border-b-0 sm:border-b-0 sm:border-r sm:p-5 sm:last:border-r-0">
                <StatIcon className="h-5 w-5 shrink-0 text-[#A67817]" strokeWidth={1.45} aria-hidden="true" />
                <div>
                  <p className="font-serif text-xl font-semibold leading-none text-[#6D2B35]">{stat.value}</p>
                  <p className="mt-1 text-[9px] font-medium leading-[1.1] text-[#806F5E]">{stat.label}</p>
                </div>
              </div>
            );
          })}
        </section>

        <section className="relative mt-6 overflow-hidden rounded-2xl border border-[#D4AF37]/25 bg-[#6D2B35] px-5 py-6 text-center text-white shadow-[0_18px_38px_rgba(109,43,53,.16)] sm:px-8">
          <div className="absolute -right-10 -top-16 h-40 w-40 rounded-full border border-white/10" aria-hidden="true" />
          <Flower2 className="absolute bottom-3 left-5 h-10 w-10 text-[#D4AF37]/55" strokeWidth={1.2} aria-hidden="true" />
          <p className="relative font-serif text-[15px] italic leading-[1.4] text-[#FFF8EC] sm:text-lg">{copy.closing}</p>
        </section>

        <footer className="relative mt-6 flex flex-col items-center justify-center gap-3 pb-10 text-[10px] text-[#806F5E]">
          <div className="flex items-center gap-3">
            <Link className="rounded px-1 underline decoration-[#D4AF37]/60 underline-offset-4 hover:text-[#6D2B35] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]" href="/privacy-policy">{copy.footer.privacy}</Link>
            <span aria-hidden="true">·</span>
            <Link className="rounded px-1 underline decoration-[#D4AF37]/60 underline-offset-4 hover:text-[#6D2B35] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]" href="/terms-conditions">{copy.footer.terms}</Link>
            <span aria-hidden="true">·</span>
            <Link className="rounded px-1 underline decoration-[#D4AF37]/60 underline-offset-4 hover:text-[#6D2B35] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]" href="/contact">{copy.footer.help}</Link>
          </div>
          <div className="flex items-center gap-3 text-[8px] font-semibold uppercase tracking-[0.2em] text-[#A67817]">
            <span className="h-px w-8 bg-[#D4AF37]/60" />
            <span>{language === "hi" ? "एक अधिक आध्यात्मिक कल" : "A more spiritual tomorrow"}</span>
            <span className="h-px w-8 bg-[#D4AF37]/60" />
          </div>
        </footer>
      </div>
      <BottomFlourish />
    </div>
  );
}
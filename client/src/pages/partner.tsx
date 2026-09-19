import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  Flame,
  Laptop,
  MapPin,
  MoonStar,
  Package,
  Sparkles,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
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
const opportunityIcons: LucideIcon[] = [UsersRound, Flame, Laptop, CalendarDays];
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
          className={`h-2 flex-1 rounded-[2px] ${
            index < filled ? "bg-[#7c1f2e]" : "bg-[#d9d5d0]"
          }`}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

export default function PartnerPage() {
  const [, setLocation] = useLocation();
  const { language } = useI18n();
  const copy = getPartnerCopy(language);

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back();
      return;
    }
    setLocation("/");
  };

  return (
    <div
      className="relative isolate overflow-hidden bg-[#fbf6ed] text-[#2e2020]"
      data-testid="partner-entry-page"
    >
      <PageSeo
        title={language === "hi" ? "Vedic Tatva से जुड़ें" : "Partner with Vedic Tatva"}
        description={copy.intro}
        ogType="website"
      />

      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-28 top-56 h-72 w-72 rounded-full bg-[#d7e0c6]/50 blur-3xl" />
        <div className="absolute -right-36 top-16 h-[34rem] w-[34rem] rounded-full border border-[#a8823b]/10" />
        <div className="absolute -right-20 top-32 h-[27rem] w-[27rem] rounded-full border border-[#a8823b]/10" />
        <div className="absolute bottom-0 left-1/2 h-72 w-[44rem] -translate-x-1/2 rounded-[50%] bg-[#e8d8bf]/30 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-px bg-[#a8823b]/30" />
      </div>

      <div className="mx-auto w-full max-w-[1180px] px-4 pb-8 pt-5 sm:px-6 sm:pb-12 sm:pt-7 lg:px-8">
        <button
          type="button"
          onClick={handleBack}
          className="group inline-flex min-h-10 items-center gap-2 rounded-full px-2 text-sm font-medium text-[#6b5546] transition-colors hover:text-[#7c1f2e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b9924b] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fbf6ed]"
          aria-label={copy.backAria}
          data-testid="button-partner-back"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" aria-hidden="true" />
          {copy.back}
        </button>

        <div>
          <section className="relative pb-9 pt-7 text-center sm:pb-11 sm:pt-10 lg:pt-12" aria-labelledby="partner-page-heading">
            <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.34em] text-[#98762f] sm:text-[11px]">
              {copy.eyebrow}
            </p>
            <h1
              id="partner-page-heading"
              className="mx-auto max-w-3xl font-serif text-[clamp(2.45rem,6vw,4.75rem)] font-semibold leading-[0.98] tracking-[-0.055em] text-[#741f31]"
            >
              {copy.heading}
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-[15px] leading-7 text-[#66564d] sm:text-base">
              {copy.intro}
            </p>
            <div className="mx-auto mt-6 h-px w-16 bg-[#b9924b]/60" aria-hidden="true" />
          </section>

          <section className="grid gap-4 lg:grid-cols-2 lg:gap-5" aria-labelledby="provider-options-heading">
            <h2 id="provider-options-heading" className="sr-only">
              {language === "hi" ? "प्रदाता विकल्प" : "Provider options"}
            </h2>
            {partnerProviders.map((provider) => {
              const isActive = provider.active && Boolean(provider.destination);
              const providerCopy = copy.providers[provider.id];
              const ProviderIcon = providerIcons[provider.id];

              return (
                <article
                  key={provider.id}
                  className={`group relative overflow-hidden rounded-[1.25rem] border p-5 shadow-[0_18px_50px_rgba(83,54,40,0.09)] transition-shadow sm:p-7 ${
                    isActive
                      ? "border-[#b9924b]/65 bg-[#fffaf2] hover:shadow-[0_22px_58px_rgba(83,54,40,0.14)]"
                      : "border-[#b8b2ab]/45 bg-[#f0efec]/85 opacity-75"
                  }`}
                  aria-labelledby={`provider-${provider.id}-title`}
                  aria-describedby={`provider-${provider.id}-description`}
                  aria-disabled={!isActive}
                  data-testid={`partner-provider-card-${provider.id}`}
                >
                  <div className={`absolute inset-x-0 top-0 h-1 ${isActive ? "bg-gradient-to-r from-[#9c6f21] via-[#e6c66d] to-[#9c6f21]" : "bg-[#b4afa9]"}`} aria-hidden="true" />
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div
                        className={`grid h-16 w-16 shrink-0 place-items-center rounded-full border ${
                          isActive
                            ? "border-[#c59a45]/45 bg-[#f3e4c8] text-[#8b641e]"
                            : "border-[#c2c0bc] bg-[#deddd9] text-[#888783]"
                        }`}
                        aria-label={providerCopy.iconLabel}
                      >
                        <ProviderIcon className="h-8 w-8" strokeWidth={1.3} aria-hidden="true" />
                      </div>
                      <div>
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] ${
                            isActive
                              ? "bg-[#e5efd9] text-[#547047]"
                              : "bg-[#d8d6d2] text-[#77746f]"
                          }`}
                          aria-label={isActive ? copy.statusActiveAria : copy.statusUnavailableAria}
                          data-testid={`partner-provider-status-${provider.id}`}
                        >
                          {providerCopy.status}
                        </span>
                        <h3
                          id={`provider-${provider.id}-title`}
                          className={`mt-2 font-serif text-3xl font-semibold tracking-[-0.035em] ${
                            isActive ? "text-[#741f31]" : "text-[#77736d]"
                          }`}
                        >
                          {providerCopy.title}
                        </h3>
                      </div>
                    </div>
                  </div>

                  <p
                    id={`provider-${provider.id}-description`}
                    className="mt-5 max-w-lg text-sm leading-6 text-[#655950]"
                  >
                    {providerCopy.description}
                  </p>

                  <ul className="mt-5 space-y-2.5">
                    {providerCopy.benefits.map((benefit) => (
                      <li key={benefit} className="flex items-start gap-2.5 text-sm leading-5 text-[#63554d]">
                        <span
                          className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full ${
                            isActive ? "bg-[#bd8a32] text-white" : "bg-[#bdbcb8] text-white"
                          }`}
                        >
                          <Check className="h-2.5 w-2.5" strokeWidth={3} aria-hidden="true" />
                        </span>
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>

                  {isActive ? (
                    <Link
                      href={provider.destination || "/pandit/login"}
                      className="group/cta mt-7 flex min-h-12 w-full items-center justify-between rounded-xl bg-[#861e30] px-5 text-sm font-bold text-[#fff9ef] shadow-[0_10px_22px_rgba(134,30,48,0.18)] transition-all hover:bg-[#6f1727] hover:shadow-[0_14px_28px_rgba(134,30,48,0.24)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b9924b] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fffaf2]"
                      data-testid="link-partner-pandit-login"
                    >
                      <span>{providerCopy.cta}</span>
                      <span className="grid h-8 w-8 place-items-center rounded-full border border-[#f4d790]/60">
                        <ArrowRight className="h-4 w-4 transition-transform group-hover/cta:translate-x-0.5" aria-hidden="true" />
                      </span>
                    </Link>
                  ) : (
                    <div
                      className="mt-7 flex min-h-12 w-full items-center justify-center rounded-xl bg-[#d3d0cc] px-5 text-sm font-semibold text-[#817d77]"
                      aria-hidden="true"
                    >
                      {providerCopy.cta}
                    </div>
                  )}
                </article>
              );
            })}
          </section>

          <section className="mt-14 sm:mt-16" aria-labelledby="partner-benefits-heading">
            <div className="text-center">
              <h2 id="partner-benefits-heading" className="font-serif text-3xl font-semibold tracking-[-0.04em] text-[#741f31] sm:text-4xl">
                {copy.benefitsHeading}
              </h2>
              <p className="mt-2 text-sm text-[#6d5b51] sm:text-base">{copy.benefitsIntro}</p>
            </div>
            <div className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
              {copy.benefits.map((benefit, index) => {
                const BenefitIcon = benefitIcons[index];
                return (
                  <article
                    key={benefit.title}
                    className="flex min-h-[218px] flex-col items-center rounded-xl border border-[#eadfce] bg-[#fffaf4]/80 px-3 py-5 text-center shadow-[0_12px_34px_rgba(83,54,40,0.05)] sm:px-4"
                  >
                    <div className="grid h-12 w-12 place-items-center rounded-full border border-[#d4ad58]/35 bg-[#f5e9d2] text-[#9a6d21]">
                      <BenefitIcon className="h-5 w-5" strokeWidth={1.6} aria-hidden="true" />
                    </div>
                    <h3 className="mt-4 max-w-[12rem] font-serif text-base font-semibold leading-tight text-[#741f31] sm:text-lg">
                      {benefit.title}
                    </h3>
                    <p className="mt-2 max-w-[13rem] text-xs font-medium leading-5 text-[#55483f]">
                      {benefit.descriptor}
                    </p>
                    <p className="mt-1 max-w-[13rem] text-xs leading-5 text-[#766960]">
                      {benefit.description}
                    </p>
                    <span className="mt-auto rounded-full bg-[#f3e5c7] px-3 py-1.5 text-[9px] font-bold tracking-[0.1em] text-[#8d651f]">
                      {benefit.badge}
                    </span>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="mt-14 sm:mt-16" aria-labelledby="partner-opportunities-heading">
            <div className="text-center">
              <h2 id="partner-opportunities-heading" className="font-serif text-3xl font-semibold tracking-[-0.04em] text-[#741f31] sm:text-4xl">
                {copy.opportunityHeading}
              </h2>
              <p className="mt-2 text-sm text-[#6d5b51] sm:text-base">{copy.opportunityIntro}</p>
            </div>
            <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
              {copy.opportunities.map((opportunity, index) => {
                const OpportunityIcon = opportunityIcons[index];
                return (
                  <article
                    key={opportunity.title}
                    className="rounded-xl border border-[#eadfce] bg-[#fffaf4]/75 p-4 shadow-[0_12px_34px_rgba(83,54,40,0.045)]"
                    aria-label={copy.gaugeAria(opportunity.title, opportunity.descriptor)}
                  >
                    <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.12em] text-[#5c4b42]">
                      <OpportunityIcon className="h-4 w-4 text-[#997025]" strokeWidth={1.7} aria-hidden="true" />
                      <span>{opportunity.title}</span>
                    </div>
                    <div className="mt-4">
                      <SegmentedGauge
                        filled={opportunityFill[index]}
                        label={copy.gaugeAria(opportunity.title, opportunity.descriptor)}
                      />
                    </div>
                    <p className="mt-3 font-serif text-lg font-semibold leading-tight text-[#4b3331]">
                      {opportunity.gaugeLabel}
                    </p>
                    <p className="mt-2 text-xs leading-5 text-[#6e6058]">{opportunity.description}</p>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="mt-11 border-y border-[#bea06b]/30 py-6 sm:mt-14 sm:py-7" aria-label={language === "hi" ? "प्लेटफ़ॉर्म तथ्य" : "Platform facts"}>
            <div className="grid grid-cols-2 divide-x divide-[#bea06b]/35 sm:grid-cols-4">
              {copy.stats.map((stat) => (
                <div key={stat.label} className="px-3 text-center first:pl-0 last:pr-0">
                  <p className="font-serif text-2xl font-semibold leading-none text-[#7c1f2e] sm:text-3xl">{stat.value}</p>
                  <p className="mt-2 text-[10px] font-medium uppercase tracking-[0.12em] text-[#786459] sm:text-xs">{stat.label}</p>
                </div>
              ))}
            </div>
          </section>

          <p className="mx-auto mt-8 max-w-2xl text-center font-serif text-base italic leading-7 text-[#80654d] sm:text-lg">
            {copy.closing}
          </p>
        </div>

        <footer className="mt-8 flex items-center justify-center gap-3 text-xs text-[#78695e]">
          <Link className="rounded px-1 underline decoration-[#b9924b]/60 underline-offset-4 hover:text-[#7c1f2e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b9924b]" href="/privacy-policy">
            {copy.footer.privacy}
          </Link>
          <span aria-hidden="true">|</span>
          <Link className="rounded px-1 underline decoration-[#b9924b]/60 underline-offset-4 hover:text-[#7c1f2e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b9924b]" href="/terms-conditions">
            {copy.footer.terms}
          </Link>
          <span aria-hidden="true">|</span>
          <Link className="rounded px-1 underline decoration-[#b9924b]/60 underline-offset-4 hover:text-[#7c1f2e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b9924b]" href="/contact">
            {copy.footer.help}
          </Link>
        </footer>
      </div>
    </div>
  );
}
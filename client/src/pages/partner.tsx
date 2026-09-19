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
      className="flex gap-[3px]"
      role="img"
      aria-label={label}
      data-testid="partner-capability-gauge"
    >
      {Array.from({ length: 10 }, (_, index) => (
        <span
          key={index}
          className={`h-3 flex-1 rounded-[2px] ${
            index < filled ? "bg-[#8b1527]" : "bg-[#d9d8d4]"
          }`}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

function LeafCluster({ side }: { side: "left" | "right" }) {
  return (
    <div
      className={`pointer-events-none absolute z-0 ${
        side === "left"
          ? "-left-11 top-44 h-44 w-32 -rotate-[18deg] sm:-left-16 sm:top-56"
          : "-right-20 top-16 h-72 w-64 rotate-[11deg] opacity-60 sm:-right-12 sm:top-20"
      }`}
      aria-hidden="true"
    >
      <span className="absolute left-4 top-16 h-24 w-12 -rotate-[34deg] rounded-[100%_0_100%_0] bg-[#8b9b70]/55 blur-[1px]" />
      <span className="absolute left-10 top-5 h-28 w-14 -rotate-[7deg] rounded-[100%_0_100%_0] bg-[#a8b88b]/45" />
      <span className="absolute left-20 top-20 h-24 w-11 rotate-[31deg] rounded-[0_100%_0_100%] bg-[#7f9365]/38" />
      <span className="absolute left-8 top-28 h-16 w-9 rotate-[12deg] rounded-[100%_0_100%_0] bg-[#667a54]/35" />
      <span className="absolute left-16 top-2 h-48 w-px rotate-[25deg] bg-[#76865e]/35" />
    </div>
  );
}

function BottomDiyaDecoration() {
  return (
    <div className="pointer-events-none absolute bottom-0 left-[-24px] z-0 h-36 w-64 opacity-80 sm:left-[-8px]" aria-hidden="true">
      <div className="absolute bottom-0 left-0 h-20 w-44 rounded-[48%_52%_8%_8%] bg-gradient-to-br from-[#9f6927]/35 via-[#e4bd60]/35 to-[#8d5527]/20 blur-[1px]" />
      <div className="absolute bottom-8 left-14 h-14 w-28 rounded-[50%] border-4 border-[#9d6b2e]/35 bg-[#b98738]/15 shadow-[0_8px_12px_rgba(101,67,29,0.14)]" />
      <Flame className="absolute bottom-20 left-[6.4rem] h-9 w-9 fill-[#d69d39]/35 text-[#a2612a]" strokeWidth={1.2} />
      <Flower2 className="absolute bottom-3 left-36 h-12 w-12 text-[#8b9b70]/60" strokeWidth={1.1} />
      <Flower2 className="absolute bottom-1 left-8 h-9 w-9 text-[#b87965]/45" strokeWidth={1.1} />
      <span className="absolute bottom-0 left-44 h-12 w-24 -rotate-[15deg] rounded-[100%_0_100%_0] bg-[#71875f]/35" />
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
       className="relative isolate min-h-full overflow-hidden bg-[#faf7f2] text-[#5a4a3a]"
      data-testid="partner-entry-page"
    >
      <PageSeo
        title={language === "hi" ? "Vedic Tatva से जुड़ें" : "Partner with Vedic Tatva"}
        description={copy.intro}
        ogType="website"
      />

      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
         <div className="absolute inset-x-0 top-0 h-px bg-[#D4AF37]/35" />
         <div className="absolute -left-28 top-72 h-80 w-80 rounded-full bg-[#F1DFB5]/45 blur-3xl" />
         <div className="absolute right-[-10rem] top-20 h-[34rem] w-[34rem] rounded-full border border-[#D4AF37]/15" />
         <div className="absolute right-[-6rem] top-28 h-[27rem] w-[27rem] rounded-full border border-[#D4AF37]/10" />
         <div className="absolute bottom-0 left-1/2 h-80 w-[46rem] -translate-x-1/2 rounded-[50%] bg-[#F5EBDD]/55 blur-3xl" />
      </div>

      <LeafCluster side="left" />
      <LeafCluster side="right" />

      <div className="relative z-10 mx-auto w-full max-w-[1120px] px-4 pb-10 pt-2 sm:px-8 sm:pb-10 sm:pt-5 lg:px-10">
        <button
          type="button"
          onClick={handleBack}
           className="group inline-flex min-h-10 items-center gap-1.5 rounded-full px-1 text-[12px] font-medium text-[#6B5B52] transition-colors hover:text-[#6D2B35] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2 focus-visible:ring-offset-[#faf7f2] max-[519px]:text-[13px]"
          aria-label={copy.backAria}
          data-testid="button-partner-back"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" aria-hidden="true" />
          {copy.back}
        </button>

        <section className="relative mx-auto mt-2 max-w-[920px] pb-4 pt-4 sm:mt-3 sm:pb-6 sm:pt-5 max-[519px]:mt-1 max-[519px]:pb-6 max-[519px]:pt-5" aria-labelledby="partner-page-heading">
           <div className="pointer-events-none absolute right-0 top-4 hidden w-24 text-left text-[13px] font-serif italic leading-[1.05] text-[#A67817] min-[520px]:block sm:right-1 sm:w-28 sm:text-[15px]">
             <span className="mb-2 block h-px w-8 bg-[#D4AF37]/70" />
            Tradition
            <br />
            Empowers
            <br />
            Together
             <span className="mt-2 block h-px w-8 bg-[#D4AF37]/70" />
          </div>

          <div className="mx-auto max-w-[560px] text-left min-[720px]:text-center max-[519px]:max-w-[340px] max-[519px]:text-center">
             <p className="mb-2 text-[8px] font-bold uppercase tracking-[0.34em] text-[#A67817] min-[520px]:text-[9px]">
              {copy.eyebrow}
            </p>
            <h1
              id="partner-page-heading"
              className="font-serif text-[clamp(2rem,6vw,3.55rem)] font-semibold leading-[0.98] tracking-[-0.045em] text-[#6D2B35] max-[519px]:text-[clamp(2.15rem,10vw,2.7rem)]"
            >
              {copy.heading}
            </h1>
            <p className="mt-3 max-w-[510px] text-[13px] leading-[1.35] text-[#6B5B52] min-[720px]:mx-auto sm:text-[15px] max-[519px]:mx-auto max-[519px]:mt-4 max-[519px]:text-[13px]">
              {copy.intro}
            </p>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-2.5 min-[520px]:grid-cols-2 min-[520px]:gap-3 max-[519px]:gap-3" aria-labelledby="provider-options-heading">
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
                className={`group relative flex min-h-[228px] flex-col overflow-hidden rounded-2xl border p-4 shadow-[0_12px_30px_rgba(77,40,36,.09)] backdrop-blur transition-shadow sm:min-h-[246px] sm:p-5 max-[519px]:min-h-[250px] max-[519px]:rounded-2xl ${
                  isActive
                    ? "border-[#D4AF37]/35 bg-white/75 hover:shadow-[0_18px_36px_rgba(77,40,36,.13)]"
                    : "border-[#6D2B35]/10 bg-[#F3F1ED]/90"
                }`}
                aria-labelledby={`provider-${provider.id}-title`}
                aria-describedby={`provider-${provider.id}-description`}
                aria-disabled={!isActive}
                data-testid={`partner-provider-card-${provider.id}`}
              >
                 <div className={`absolute inset-x-0 top-0 h-px ${isActive ? "bg-[#D4AF37]" : "bg-[#6D2B35]/15"}`} aria-hidden="true" />

                <div className="flex items-start gap-3 max-[519px]:gap-3.5">
                  <div
                    className={`grid h-[58px] w-[58px] shrink-0 place-items-center rounded-full border max-[519px]:h-12 max-[519px]:w-12 ${
                      isActive
                         ? "border-[#D4AF37]/35 bg-[#F1DFB5] text-[#7F5A15]"
                         : "border-[#6D2B35]/10 bg-[#E8E5E0] text-[#806F5E]"
                    }`}
                    aria-label={providerCopy.iconLabel}
                  >
                    <ProviderIcon className="h-8 w-8" strokeWidth={1.35} aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3
                        id={`provider-${provider.id}-title`}
                     className={`font-serif text-[25px] font-semibold leading-none tracking-[-0.035em] max-[519px]:text-[27px] ${
                          isActive ? "text-[#6D2B35]" : "text-[#806F5E]"
                        }`}
                      >
                        {providerCopy.title}
                      </h3>
                      <span
                        className={`mt-0.5 shrink-0 rounded-full px-2 py-1 text-[8px] font-bold leading-none ${
                          isActive
                            ? "bg-[#e4efd8] text-[#568048]"
                            : "bg-[#d5d3ce] text-[#78746e]"
                        }`}
                        aria-label={isActive ? copy.statusActiveAria : copy.statusUnavailableAria}
                        data-testid={`partner-provider-status-${provider.id}`}
                      >
                        {providerCopy.status}
                      </span>
                    </div>
                    <p
                      id={`provider-${provider.id}-description`}
                      className="mt-2 max-w-[250px] text-[12px] leading-[1.2] text-[#6B5B52] max-[519px]:max-w-none max-[519px]:text-[13px]"
                    >
                      {providerCopy.description}
                    </p>
                  </div>
                </div>

                <ul className="mt-4 space-y-2 max-[519px]:mt-5 max-[519px]:space-y-2.5">
                  {providerCopy.benefits.map((benefit) => (
                    <li key={benefit} className="flex items-start gap-2 text-[11px] leading-[1.2] text-[#6B5B52] max-[519px]:text-[12px]">
                      <span
                        className={`mt-[-1px] grid h-4 w-4 shrink-0 place-items-center rounded-full ${
                           isActive ? "bg-[#A67817] text-white" : "bg-[#C6C3BE] text-white"
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
                     className="group/cta mt-auto flex min-h-9 w-full items-center justify-center gap-3 rounded-xl bg-[#6D2B35] px-4 text-[12px] font-semibold text-white shadow-[0_8px_18px_rgba(109,43,53,.18)] transition-all hover:bg-[#55252D] hover:shadow-[0_12px_24px_rgba(109,43,53,.24)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2 focus-visible:ring-offset-white max-[519px]:min-h-11 max-[519px]:text-[13px]"
                    data-testid="link-partner-pandit-login"
                  >
                    <span>{providerCopy.cta}</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover/cta:translate-x-0.5" aria-hidden="true" />
                  </Link>
                ) : (
                  <div
                     className="mt-auto flex min-h-9 w-full items-center justify-center rounded-xl bg-[#D9D6D1] px-4 text-[12px] font-medium text-[#806F5E] max-[519px]:min-h-11 max-[519px]:text-[13px]"
                    aria-hidden="true"
                  >
                    {providerCopy.cta}
                  </div>
                )}
              </article>
            );
          })}
        </section>

        <section className="mt-5 sm:mt-8 max-[519px]:mt-9" aria-labelledby="partner-benefits-heading">
          <div className="text-center">
            <h2 id="partner-benefits-heading" className="font-serif text-[25px] font-semibold leading-none tracking-[-0.04em] text-[#6D2B35] sm:text-3xl max-[519px]:text-[27px]">
              {copy.benefitsHeading}
            </h2>
            <p className="mt-1 text-[12px] text-[#6B5B52] sm:text-sm max-[519px]:text-[13px]">{copy.benefitsIntro}</p>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 min-[620px]:grid-cols-4 min-[620px]:gap-2.5 max-[519px]:mt-4 max-[519px]:gap-2.5">
            {copy.benefits.map((benefit, index) => {
              const BenefitIcon = benefitIcons[index];
              return (
                <article
                  key={benefit.title}
                  className="flex min-h-[166px] flex-col items-center rounded-xl border border-[#D4AF37]/20 bg-white/85 px-2 py-3 text-center shadow-[0_10px_24px_rgba(77,40,36,.07)] sm:min-h-[178px] sm:px-3 max-[519px]:min-h-[184px] max-[519px]:px-2.5 max-[519px]:py-3.5"
                >
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#F1DFB5] text-[#7F5A15]">
                    <BenefitIcon className="h-5 w-5" strokeWidth={1.55} aria-hidden="true" />
                  </div>
                  <h3 className="mt-3 max-w-[10rem] font-serif text-[13px] font-semibold leading-[1.05] text-[#6D2B35] sm:text-[15px] max-[519px]:text-[14px]">
                    {benefit.title}
                  </h3>
                  <p className="mt-2 max-w-[11rem] text-[10px] leading-[1.2] text-[#6B5B52] sm:text-[11px] max-[519px]:text-[11px]">
                    {benefit.descriptor}
                  </p>
                  <p className="mt-0.5 max-w-[11rem] text-[10px] leading-[1.2] text-[#806F5E] sm:text-[11px] max-[519px]:text-[11px]">
                    {benefit.description}
                  </p>
                  <span className="mt-auto rounded-full bg-[#F1DFB5] px-2.5 py-1 text-[8px] font-bold tracking-[0.08em] text-[#7F5A15] sm:text-[9px]">
                    {benefit.badge}
                  </span>
                </article>
              );
            })}
          </div>
        </section>

        <section className="mt-6 sm:mt-9 max-[519px]:mt-10" aria-labelledby="partner-opportunities-heading">
          <div className="text-center">
            <h2 id="partner-opportunities-heading" className="font-serif text-[24px] font-semibold leading-none tracking-[-0.04em] text-[#6D2B35] sm:text-3xl max-[519px]:text-[26px]">
              {copy.opportunityHeading}
            </h2>
            <p className="mt-1 text-[12px] text-[#6B5B52] sm:text-sm max-[519px]:text-[13px]">{copy.opportunityIntro}</p>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 min-[620px]:grid-cols-4 min-[620px]:gap-2.5 max-[519px]:mt-4 max-[519px]:grid-cols-1 max-[519px]:gap-3">
            {copy.opportunities.map((opportunity, index) => {
              const OpportunityIcon = opportunityIcons[index];
              return (
                <article
                  key={opportunity.title}
                  className="rounded-xl border border-[#D4AF37]/20 bg-white/80 p-2.5 shadow-[0_10px_24px_rgba(77,40,36,.06)] sm:p-3 max-[519px]:rounded-xl max-[519px]:p-3.5"
                  aria-label={copy.gaugeAria(opportunity.title, opportunity.descriptor)}
                >
                  <div className="flex items-center gap-1.5 text-[8px] font-bold uppercase tracking-[0.08em] text-[#6B5B52] max-[519px]:text-[9px]">
                    <OpportunityIcon className="h-4 w-4 shrink-0 text-[#A67817]" strokeWidth={1.65} aria-hidden="true" />
                    <span>{opportunity.title}</span>
                  </div>
                  <div className="mt-3 max-[519px]:mt-2.5">
                    <SegmentedGauge
                      filled={opportunityFill[index]}
                      label={copy.gaugeAria(opportunity.title, opportunity.descriptor)}
                    />
                  </div>
                  <p className="mt-2 font-serif text-[13px] font-semibold leading-[1.05] text-[#6D2B35] sm:text-[15px] max-[519px]:text-[16px]">
                    {opportunity.gaugeLabel}
                  </p>
                  <p className="mt-1.5 text-[10px] leading-[1.2] text-[#806F5E] sm:text-[11px] max-[519px]:text-[11px]">
                    {opportunity.description}
                  </p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="relative mt-5 border-y border-[#D4AF37]/30 py-3 sm:mt-8 sm:py-4 max-[519px]:mt-8 max-[519px]:py-4" aria-label={language === "hi" ? "प्लेटफ़ॉर्म तथ्य" : "Platform facts"}>
          <div className="grid grid-cols-4 divide-x divide-[#D4AF37]/30">
            {copy.stats.map((stat, index) => {
              const StatIcon = statIcons[index];
              return (
                <div key={stat.label} className="flex items-center justify-center gap-1.5 px-1 text-center max-[519px]:gap-0 max-[519px]:px-0">
                  <StatIcon className="hidden h-6 w-6 shrink-0 text-[#A67817] min-[520px]:block" strokeWidth={1.45} aria-hidden="true" />
                  <div>
                    <p className="font-serif text-[17px] font-semibold leading-none text-[#6D2B35] sm:text-2xl max-[519px]:text-[18px]">{stat.value}</p>
                    <p className="mt-1 text-[8px] font-medium leading-[1.05] text-[#806F5E] sm:text-[10px] max-[519px]:text-[8.5px]">{stat.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <p className="mx-auto mt-4 max-w-[600px] text-center font-serif text-[13px] italic leading-5 text-[#806F5E] sm:mt-5 sm:text-base max-[519px]:mt-6 max-[519px]:text-[14px]">
          {copy.closing}
        </p>

        <footer className="relative mt-3 flex flex-col items-center justify-center gap-2 pb-8 text-[9px] text-[#806F5E] sm:mt-5 sm:pb-10 max-[519px]:mt-4 max-[519px]:pb-12">
          <div className="flex items-center gap-3">
            <Link className="rounded px-1 underline decoration-[#D4AF37]/60 underline-offset-4 hover:text-[#6D2B35] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]" href="/privacy-policy">
              {copy.footer.privacy}
            </Link>
            <span aria-hidden="true">|</span>
            <Link className="rounded px-1 underline decoration-[#D4AF37]/60 underline-offset-4 hover:text-[#6D2B35] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]" href="/terms-conditions">
              {copy.footer.terms}
            </Link>
            <span aria-hidden="true">|</span>
            <Link className="rounded px-1 underline decoration-[#D4AF37]/60 underline-offset-4 hover:text-[#6D2B35] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]" href="/contact">
              {copy.footer.help}
            </Link>
          </div>
          <div className="flex items-center gap-3 text-[8px] uppercase tracking-[0.28em] text-[#9a7b4c]">
            <span className="h-px w-8 bg-[#D4AF37]/65" />
            <span>{language === "hi" ? "एक अधिक आध्यात्मिक कल" : "A more spiritual tomorrow"}</span>
            <span className="h-px w-8 bg-[#D4AF37]/65" />
          </div>
        </footer>
      </div>

      <BottomDiyaDecoration />
    </div>
  );
}
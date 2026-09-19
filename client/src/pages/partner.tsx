import { ArrowLeft, ArrowRight, BookOpenCheck, Gem, LockKeyhole, Orbit, type LucideIcon } from "lucide-react";
import { Link, useLocation } from "wouter";
import PageSeo from "@/components/PageSeo";
import { partnerProviders } from "@/lib/partner-providers";
import { useI18n } from "@/lib/i18n";
import { useSiteSettings } from "@/lib/site-settings";

const roleIcons: Record<string, LucideIcon> = {
  pandit: BookOpenCheck,
  astrologer: Orbit,
};

function DevotionalMark() {
  return (
    <div className="relative h-16 w-16 overflow-hidden rounded-2xl border border-[#D4AF37]/35 bg-[#F1DFB5]/70 text-[#7F5A15] shadow-[0_10px_22px_rgba(127,90,21,.10)]">
      <img
        src="/attached_assets/generated_images/partner-portal-namaste.png"
        alt=""
        aria-hidden="true"
        loading="eager"
        decoding="async"
        className="h-full w-full object-cover"
      />
      <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 rounded-full border border-[#FFFDF8]/80 bg-[#FFFDF8]/80 px-1.5 text-[8px] font-semibold leading-4 tracking-[0.12em] shadow-sm" aria-hidden="true">ॐ</span>
    </div>
  );
}

export default function PartnerPage() {
  const [, setLocation] = useLocation();
  const { language } = useI18n();
  const hindi = language === "hi";
  const siteSettings = useSiteSettings();
  const astrologerAccessEnabled = siteSettings?.astrologerPartnerAccessEnabled === true;

  const copy = hindi
    ? {
        eyebrow: "पार्टनर पोर्टल",
        title: "अपने डैशबोर्ड में साइन इन करें",
        intro: "अपनी भूमिका चुनें और अपने Vedic Tatva कार्यक्षेत्र में आगे बढ़ें।",
        back: "होम",
        backAria: "होम पेज पर जाएं",
        panditTitle: "पंडितजी पोर्टल",
        panditDescription: "बुकिंग, कैलेंडर, कमाई और अपनी सेवाओं को संभालें।",
        panditAction: "साइन इन या आवेदन करें",
        astrologerTitle: "ज्योतिषी पोर्टल",
        astrologerDescription: "कंसल्टेशन, संदेश और कमाई अपने डैशबोर्ड से संभालें।",
        astrologerAction: "ज्योतिषी पोर्टल खोलें",
        astrologerApply: "ज्योतिषी के रूप में आवेदन करें",
        frozen: "जल्द उपलब्ध होगा",
        newPartner: "पहली बार जुड़ रहे हैं?",
        apply: "पंडितजी के रूप में आवेदन करें",
        help: "सहायता चाहिए? हमसे संपर्क करें",
        privacy: "गोपनीयता",
        terms: "नियम",
      }
    : {
        eyebrow: "PARTNER PORTAL",
        title: "Sign in to your dashboard",
        intro: "Choose your role to continue to your Vedic Tatva workspace.",
        back: "Home",
        backAria: "Go to home",
        panditTitle: "Panditji portal",
        panditDescription: "Manage bookings, calendar, earnings and your services.",
        panditAction: "Sign in or apply",
        astrologerTitle: "Astrologer portal",
        astrologerDescription: "Manage consultations, messages and earnings from your dashboard.",
        astrologerAction: "Open astrologer portal",
        astrologerApply: "Apply as an Astrologer",
        frozen: "Coming soon",
        newPartner: "New to Vedic Tatva?",
        apply: "Apply as a Panditji",
        help: "Need help? Contact us",
        privacy: "Privacy",
        terms: "Terms",
      };

  const roleContent = {
    pandit: {
      title: copy.panditTitle,
      description: copy.panditDescription,
      action: copy.panditAction,
    },
    astrologer: {
      title: copy.astrologerTitle,
      description: copy.astrologerDescription,
      action: copy.astrologerAction,
    },
  };

  const handleBack = () => {
    setLocation("/");
  };

  return (
    <main className="relative isolate min-h-full overflow-hidden bg-[#F7F9F5] text-[#5A4A3A]" data-testid="partner-entry-page">
      <PageSeo
        title={hindi ? "पार्टनर पोर्टल | Vedic Tatva" : "Partner Portal | Vedic Tatva"}
        description={copy.intro}
        ogType="website"
      />

      <div className="pointer-events-none absolute -left-24 top-40 h-64 w-64 rounded-full bg-[#DCE8D8]/60 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -right-20 top-10 h-72 w-72 rounded-full bg-[#F1DFB5]/45 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute right-[-5rem] top-28 h-64 w-64 rounded-full border border-[#D4AF37]/15" aria-hidden="true" />

      <div className="relative z-10 mx-auto flex min-h-full w-full max-w-[620px] flex-col px-4 pb-8 pt-3 sm:px-6 sm:pt-6">
        <button
          type="button"
          onClick={handleBack}
          className="group inline-flex min-h-10 w-fit items-center gap-2 rounded-full px-1 text-[12px] font-semibold text-[#6B5B52] transition-colors hover:text-[#6D2B35] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F7F9F5]"
          aria-label={copy.backAria}
          data-testid="button-partner-back"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" aria-hidden="true" />
          {copy.back}
        </button>

        <section className="mt-5 rounded-[1.75rem] border border-white/85 bg-white/60 p-5 text-center shadow-[0_18px_55px_rgba(77,40,36,.08)] backdrop-blur-xl sm:mt-8 sm:p-8" aria-labelledby="partner-page-heading">
          <div className="flex justify-center">
            <DevotionalMark />
          </div>
          <p className="mt-4 text-[9px] font-bold uppercase tracking-[0.24em] text-[#A67817]">{copy.eyebrow}</p>
          <h1 id="partner-page-heading" className="mx-auto mt-2 max-w-[440px] font-serif text-[clamp(2rem,9vw,3.1rem)] font-semibold leading-[1] tracking-[-0.05em] text-[#6D2B35]">
            {copy.title}
          </h1>
          <p className="mx-auto mt-3 max-w-[390px] text-[13px] leading-[1.45] text-[#6B5B52] sm:text-[14px]">
            {copy.intro}
          </p>

          <div className="mt-6 space-y-3 text-left">
            {partnerProviders.map((provider, index) => {
              const ProviderIcon = roleIcons[provider.id];
              const content = roleContent[provider.id];
              const isPrimary = index === 0;
              const isAstrologer = provider.id === "astrologer";
              const isFrozen = isAstrologer && !astrologerAccessEnabled;
              const cardClass = `group flex min-h-[88px] items-center gap-3 rounded-2xl border p-3 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2 ${
                isPrimary
                  ? "border-[#D4AF37]/45 bg-[#FFFDF8] shadow-[0_10px_24px_rgba(77,40,36,.08)] hover:-translate-y-0.5 hover:shadow-[0_15px_30px_rgba(77,40,36,.12)]"
                  : "border-white/90 bg-white/45 hover:border-[#D4AF37]/35 hover:bg-white/70"
              }`;
              const cardContent = (
                <>
                  <span className={`relative grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-full border ${
                    isPrimary
                      ? "border-[#D4AF37]/35 bg-[#F1DFB5] text-[#7F5A15]"
                      : "border-[#8EA98B]/25 bg-[#DCE8D8]/55 text-[#56745B]"
                  }`}>
                    {provider.id === "pandit" ? (
                      <>
                        <img
                          src="/attached_assets/generated_images/sage-face-partner-card.png"
                          alt=""
                          aria-hidden="true"
                          loading="eager"
                          decoding="async"
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                        <span className="absolute bottom-0 right-0 grid h-5 w-5 place-items-center rounded-full border border-[#FFFDF8] bg-[#F1DFB5] text-[#7F5A15] shadow-sm">
                          <ProviderIcon className="h-3 w-3" strokeWidth={1.8} aria-hidden="true" />
                        </span>
                      </>
                    ) : (
                      <>
                        <Gem className="h-6 w-6 text-[#56745B]" strokeWidth={1.25} aria-hidden="true" />
                        <Orbit className="absolute h-10 w-10 text-[#A67817]/65" strokeWidth={0.9} aria-hidden="true" />
                      </>
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`block font-serif text-[17px] font-semibold leading-none ${isFrozen ? "text-[#806F5E]" : "text-[#6D2B35]"}`}>{content.title}</span>
                    <span className="mt-1.5 block text-[11px] leading-[1.35] text-[#6B5B52]">{content.description}</span>
                    <span className={`mt-1.5 inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.08em] ${isFrozen ? "text-[#806F5E]" : isPrimary ? "text-[#A67817]" : "text-[#56745B]"}`}>
                      {isFrozen && <LockKeyhole className="h-3 w-3" aria-hidden="true" />}
                      {isFrozen ? content.action : content.action}
                    </span>
                  </span>
                  {isFrozen ? (
                    <LockKeyhole className="h-4 w-4 shrink-0 text-[#806F5E]" aria-hidden="true" />
                  ) : (
                    <ArrowRight className="h-4 w-4 shrink-0 text-[#A67817] transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                  )}
                </>
              );

              if (isFrozen) {
                return (
                  <div
                    key={provider.id}
                    className={`${cardClass} cursor-not-allowed opacity-70`}
                    aria-disabled="true"
                    data-testid={`partner-provider-card-${provider.id}`}
                  >
                    {cardContent}
                  </div>
                );
              }

              return (
                <Link
                  key={provider.id}
                  href={provider.destination || "/"}
                  className={cardClass}
                  data-testid={`partner-provider-card-${provider.id}`}
                >
                  {cardContent}
                </Link>
              );
            })}
          </div>

          <div className="mt-6 border-t border-[#D4AF37]/20 pt-5">
            <p className="text-[11px] text-[#806F5E]">{copy.newPartner}</p>
            <Link
              href="/pandit/signup"
              className="mt-1 inline-flex min-h-9 items-center rounded-full px-3 text-[11px] font-bold text-[#6D2B35] underline decoration-[#D4AF37]/70 underline-offset-4 transition-colors hover:text-[#A67817] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]"
              data-testid="link-partner-pandit-signup"
            >
              {copy.apply}
            </Link>
            <div className="mt-2">
              {astrologerAccessEnabled ? (
                <Link
                  href="/become-astrologer"
                  className="inline-flex min-h-8 items-center rounded-full px-3 text-[11px] font-bold text-[#56745B] underline decoration-[#8EA98B]/70 underline-offset-4 transition-colors hover:text-[#6D2B35] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]"
                  data-testid="link-partner-astrologer-signup"
                >
                  {copy.astrologerApply}
                </Link>
              ) : (
                <span
                  className="inline-flex min-h-8 cursor-not-allowed items-center gap-1.5 rounded-full px-3 text-[11px] font-bold text-[#806F5E]/75"
                  aria-disabled="true"
                  data-testid="link-partner-astrologer-signup-disabled"
                >
                  <LockKeyhole className="h-3 w-3" aria-hidden="true" />
                  {copy.astrologerApply} · {copy.frozen}
                </span>
              )}
            </div>
          </div>
        </section>

        <footer className="mt-5 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 pb-3 text-[10px] text-[#806F5E]">
          <Link href="/contact" className="hover:text-[#6D2B35]">{copy.help}</Link>
          <span aria-hidden="true">·</span>
          <Link href="/privacy-policy" className="hover:text-[#6D2B35]">{copy.privacy}</Link>
          <span aria-hidden="true">·</span>
          <Link href="/terms-conditions" className="hover:text-[#6D2B35]">{copy.terms}</Link>
        </footer>
      </div>
    </main>
  );
}
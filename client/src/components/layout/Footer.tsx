import { useId, useState } from "react";
import { Link } from "wouter";
import { ArrowRight, ChevronDown, LifeBuoy, Mail, MapPin, MessageCircle, PackageSearch, Phone, RotateCcw, ShieldCheck, Truck, Lock, Loader2, Check } from "lucide-react";
import { SiInstagram, SiFacebook, SiX, SiYoutube, SiWhatsapp } from "react-icons/si";
import { useI18n } from "@/lib/i18n";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useSiteSettings } from "@/lib/site-settings";
import { useQuery } from "@tanstack/react-query";
import { FOOTER_DESTINATIONS } from "@shared/footer-links";

const complianceBadges = [
  { label: "PCI-DSS", sub: "Level 1 secure" },
  { label: "256-bit SSL", sub: "TLS 1.3" },
  { label: "80G", sub: "Tax-deductible" },
  { label: "GSTIN", sub: "GST invoiced" },
];

const trustBadges = [
  { icon: Truck, label: "Free Shipping", sub: "Orders ₹499+" },
  { icon: ShieldCheck, label: "Authentic", sub: "Lab-certified" },
  { icon: RotateCcw, label: "Easy Returns", sub: "7-day window" },
  { icon: Lock, label: "Secure Pay", sub: "256-bit SSL" },
];

const socials = [
  { Icon: SiInstagram, href: "https://instagram.com/vedictatva", label: "Instagram" },
  { Icon: SiFacebook, href: "https://facebook.com/vedictatva", label: "Facebook" },
  { Icon: SiYoutube, href: "https://youtube.com/@vedictatva", label: "YouTube" },
  { Icon: SiX, href: "https://x.com/vedictatva", label: "X" },
  { Icon: SiWhatsapp, href: "https://wa.me/918447844702", label: "WhatsApp" },
];

export default function Footer() {
  const settings = useSiteSettings();
  const { data: liveMetrics } = useQuery<{
    health: "available" | "unavailable";
    metrics: Record<string, { value: number | null; state: "available" | "unavailable"; health: "available" | "unavailable"; scope?: "global" | "this_instance" }>;
  }>({
    queryKey: ["/api/pandit-metrics"],
    queryFn: async () => {
      const response = await fetch("/api/pandit-metrics");
      return response.json();
    },
    staleTime: 30_000,
    refetchInterval: 30_000,
  });
  const dynamicSocials = [
    settings?.socialInstagram ? { Icon: SiInstagram, href: settings.socialInstagram, label: "Instagram" } : null,
    settings?.socialFacebook ? { Icon: SiFacebook, href: settings.socialFacebook, label: "Facebook" } : null,
    settings?.socialYoutube ? { Icon: SiYoutube, href: settings.socialYoutube, label: "YouTube" } : null,
    settings?.whatsappNumber ? { Icon: SiWhatsapp, href: `https://wa.me/${settings.whatsappNumber.replace(/\D/g, "")}`, label: "WhatsApp" } : null,
  ].filter(Boolean) as typeof socials;
  const activeSocials = dynamicSocials.length ? dynamicSocials : socials;
  const siteName = settings?.siteName || "Vedic Tatva";
  const contactEmail = settings?.contactEmail || "ecom@vedictatva.com";
  const contactPhone = settings?.contactPhone || "+91 8447-8447-02";
  const { t } = useI18n();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "loading") return;
    const trimmed = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      toast({ title: t.newsletter.invalidEmail, variant: "destructive" });
      return;
    }
    setStatus("loading");
    try {
      await apiRequest("POST", "/api/newsletter/subscribe", { email: trimmed });
      setStatus("success");
      setEmail("");
      toast({ title: t.newsletter.success });
      setTimeout(() => setStatus("idle"), 3000);
    } catch (err) {
      setStatus("idle");
      toast({ title: t.newsletter.error, variant: "destructive" });
    }
  };

  const shopCategories = [
    { ...FOOTER_DESTINATIONS.shop[0], label: "Puja Samagri & Essentials" },
    { ...FOOTER_DESTINATIONS.shop[1], label: "Rudraksha Collection" },
    { ...FOOTER_DESTINATIONS.shop[2], label: "Rudraksha Malas" },
    { ...FOOTER_DESTINATIONS.shop[3], label: "Havan Samagri" },
    { ...FOOTER_DESTINATIONS.shop[4], label: "Puja Kits" },
    { ...FOOTER_DESTINATIONS.shop[5], label: "Brass Diyas" },
    { ...FOOTER_DESTINATIONS.shop[6], label: "Spiritual Jewelry" },
    { ...FOOTER_DESTINATIONS.shop[7], label: "Temple Decor" },
  ];

  const services = [
    { ...FOOTER_DESTINATIONS.services[0], label: t.footer.findPandit },
    { ...FOOTER_DESTINATIONS.services[1], label: t.footer.bookPuja },
    { ...FOOTER_DESTINATIONS.services[2], label: t.footer.virtualPuja },
    { ...FOOTER_DESTINATIONS.services[3], label: t.footer.astrology },
    { ...FOOTER_DESTINATIONS.services[4], label: t.footer.donations },
  ];

  const tools = [
    { ...FOOTER_DESTINATIONS.tools[0], label: t.footer.panchangCalendar },
    { ...FOOTER_DESTINATIONS.tools[1], label: t.footer.muhuratFinder },
    { ...FOOTER_DESTINATIONS.tools[2], label: t.footer.vastuCompass },
    { ...FOOTER_DESTINATIONS.tools[3], label: t.footer.sacredKathas },
    { ...FOOTER_DESTINATIONS.tools[4], label: "Digital Japa Counter" },
    { ...FOOTER_DESTINATIONS.tools[5], label: "Vedic Tatva Journal" },
    { ...FOOTER_DESTINATIONS.tools[6], label: "Track Order" },
    { ...FOOTER_DESTINATIONS.tools[7], label: "Returns & Refunds" },
  ];

  const company = [
    { ...FOOTER_DESTINATIONS.company[0], label: t.footer.aboutUs },
    { ...FOOTER_DESTINATIONS.company[1], label: t.footer.contact },
    { ...FOOTER_DESTINATIONS.company[2], label: t.footer.careers },
    { ...FOOTER_DESTINATIONS.company[3], label: "Franchise Opportunity" },
    { ...FOOTER_DESTINATIONS.company[4], label: t.footer.becomePandit },
    { ...FOOTER_DESTINATIONS.company[5], label: t.footer.becomeAstrologer },
  ];

  const policies = [
    { ...FOOTER_DESTINATIONS.policies[0], label: t.footer.termsConditions },
    { ...FOOTER_DESTINATIONS.policies[1], label: t.footer.privacyPolicy },
    { ...FOOTER_DESTINATIONS.policies[2], label: t.footer.refundPolicy },
    { ...FOOTER_DESTINATIONS.policies[3], label: t.footer.shippingPolicy },
    { ...FOOTER_DESTINATIONS.policies[4], label: "Accessibility" },
  ];

  const supportActions = [
    {
      href: "/track-order",
      title: "Track an order",
      description: "Check your latest delivery update.",
      icon: PackageSearch,
      testid: "footer-support-track-order",
    },
    {
      href: "/return-ticket",
      title: "Returns & refunds",
      description: "Start a request or review next steps.",
      icon: RotateCcw,
      testid: "footer-support-returns",
    },
    {
      href: "/contact",
      title: "Contact support",
      description: "Get help with orders, bookings, or products.",
      icon: MessageCircle,
      testid: "footer-support-contact",
    },
  ];

  return (
    <footer className="relative pb-20 lg:pb-0 text-white" aria-label={`${siteName} footer`} data-testid="footer">
      {/* Hairline gold top border */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-[#D4AF37]/60 to-transparent" />

      {/* Newsletter signup strip */}
      <div className="bg-[#120a10] border-b border-white/[0.04]" data-testid="footer-newsletter-strip">
        <div className="container mx-auto px-4 py-5">
          <form
            onSubmit={handleNewsletterSubmit}
            className="max-w-3xl mx-auto flex flex-col md:flex-row md:items-center gap-3 md:gap-4"
          >
            <div className="flex-1 min-w-0">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#D4AF37] font-semibold mb-0.5" data-testid="text-newsletter-eyebrow">{t.newsletter.eyebrow}</p>
              <p className="text-[13px] text-white/75 leading-snug" data-testid="text-newsletter-description">{t.newsletter.description}</p>
            </div>
            <div className="flex items-center gap-2 md:w-auto w-full">
                <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={status === "loading"}
                placeholder={t.newsletter.placeholder}
                aria-label={t.newsletter.eyebrow}
                  className="flex-1 md:w-64 min-h-11 rounded-md bg-[#1a1118] border border-white/15 text-white placeholder:text-white/45 px-3 text-[13px] focus:outline-none focus:border-[#D4AF37]/60 disabled:opacity-60"
                data-testid="input-newsletter-email"
              />
              <button
                type="submit"
                disabled={status === "loading"}
                  className="min-h-11 rounded-md bg-[#D4AF37] hover:bg-[#c4a232] text-[#120a10] px-4 text-[12px] font-semibold whitespace-nowrap transition-colors inline-flex items-center justify-center gap-1.5 disabled:opacity-70 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:ring-offset-2 focus:ring-offset-[#120a10]"
                data-testid="button-newsletter-subscribe"
              >
                {status === "loading" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {status === "success" && <Check className="h-3.5 w-3.5" />}
                {t.newsletter.subscribe}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Stats micro-strip — one-line (migrated from homepage Stats Bar) */}
      <div className="bg-[#6D2B35] border-b border-[#D4AF37]/20" data-testid="footer-stats-strip">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 py-2.5 text-center">
            {[
              { key: "totalEnrolledPandits", label: "Pandits", testid: "footer-stat-pandits" },
              { key: "servedLast24h", label: "Served · 24h", testid: "footer-stat-served-24h" },
              { key: "pujasBooked", label: "Pujas booked", testid: "footer-stat-pujas" },
              { key: "onlineNow", label: "Online now · this server", testid: "footer-stat-online-now" },
            ].map((s, idx, arr) => {
              const value = liveMetrics?.metrics[s.key];
              const display = value?.health === "available" ? String(value.value) : "—";
              return (
              <span key={s.label} className="inline-flex items-center gap-1.5 text-[11px]" data-testid={s.testid}>
                <span className="text-[#D4AF37] font-serif font-semibold">{display}</span>
                <span className="uppercase tracking-[0.18em] text-white/65 font-semibold">{s.label}</span>
                {idx < arr.length - 1 && <span className="text-white/30 ml-1.5">·</span>}
              </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* Trust strip */}
      <div className="bg-[#1a1118] border-b border-white/[0.04]">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-3 py-4">
            {trustBadges.map(({ icon: Icon, label, sub }) => (
              <div
                key={label}
                className="flex items-center gap-2.5"
                data-testid={`trust-${label.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <Icon className="h-4 w-4 text-[#D4AF37] flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-[12px] font-semibold text-white/80 leading-tight truncate">{label}</div>
                  <div className="text-[10px] text-white/40 leading-tight truncate">{sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Support band — action-first help for the most common customer needs. */}
      <section
        aria-labelledby="footer-support-heading"
        className="bg-[#24131b] border-b border-[#D4AF37]/15"
        data-testid="footer-support-band"
      >
        <div className="container mx-auto px-4 py-6 md:py-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-8">
            <div className="flex items-start gap-3 lg:w-64 lg:shrink-0">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#D4AF37]/35 bg-[#D4AF37]/10 text-[#f5d76e]">
                <LifeBuoy className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#D4AF37]">Need a hand?</p>
                <h2 id="footer-support-heading" className="mt-1 text-lg font-serif font-semibold text-white">
                  Help &amp; Support
                </h2>
                <p className="mt-1 text-[12px] leading-relaxed text-white/65">
                  Find the right next step quickly.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:flex-1">
              {supportActions.map(({ href, title, description, icon: Icon, testid }) => (
                <Link
                  key={href}
                  href={href}
                  className="group flex min-h-[76px] items-center justify-between gap-3 rounded-lg border border-white/[0.10] bg-[#120a10]/55 px-4 py-3 transition-colors hover:border-[#D4AF37]/55 hover:bg-[#120a10] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2 focus-visible:ring-offset-[#24131b]"
                  data-testid={testid}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <Icon className="h-4 w-4 shrink-0 text-[#D4AF37]" aria-hidden="true" />
                    <span className="min-w-0">
                      <span className="block text-[13px] font-semibold text-white/90">{title}</span>
                      <span className="mt-0.5 block text-[11px] leading-snug text-white/60">{description}</span>
                    </span>
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-[#D4AF37]/70 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Main body */}
      <div className="bg-[#120a10]">
        <div className="container mx-auto px-4">

          {/* Main grid */}
          <nav aria-label="Footer navigation" aria-labelledby="footer-navigation-heading">
            <h2 id="footer-navigation-heading" className="sr-only">Explore {siteName}</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-12 gap-0 md:gap-10 py-8 md:py-12">

            {/* Brand */}
            <div className="md:col-span-4 lg:col-span-4 pb-8 md:pb-0">
              <Link href="/" className="inline-flex items-center gap-2 mb-3" data-testid="footer-logo">
                {settings?.logoUrl ? (
                  <img src={settings.logoUrl} alt={siteName} className="h-8 w-auto object-contain" data-testid="footer-logo-img" />
                ) : null}
                <span className="font-serif text-2xl font-bold tracking-tight bg-gradient-to-r from-[#f5d76e] via-[#D4AF37] to-[#f5d76e] bg-clip-text text-transparent" data-testid="footer-site-name">
                  {siteName}
                </span>
                <span className="text-[#D4AF37] text-lg leading-none">ॐ</span>
              </Link>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#D4AF37]/70 mb-3">
                Sanatan · Sacred · Authentic
              </p>
              <p className="text-white/55 max-w-md text-[13px] leading-relaxed mb-5">{t.footer.tagline}</p>

              <div className="space-y-2">
                <a href={`mailto:${contactEmail}`} className="flex items-center gap-2 text-white/60 hover:text-[#f5d76e] text-[13px] transition-colors" data-testid="footer-email">
                  <Mail className="h-3.5 w-3.5 text-[#D4AF37]/70" />
                  {contactEmail}
                </a>
                <a href={`tel:${contactPhone.replace(/\s/g, "")}`} className="flex items-center gap-2 text-white/60 hover:text-[#f5d76e] text-[13px] transition-colors" data-testid="footer-phone">
                  <Phone className="h-3.5 w-3.5 text-[#D4AF37]/70" />
                  {contactPhone}
                </a>
                <span className="flex items-center gap-2 text-white/60 text-[13px]">
                  <MapPin className="h-3.5 w-3.5 text-[#D4AF37]/70" />
                  Pan-India delivery · HQ New Delhi
                </span>
              </div>

              <div className="flex items-center gap-2 mt-5">
                {activeSocials.map(({ Icon, href, label }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    title={label}
                    className="w-10 h-10 rounded-md flex items-center justify-center text-white/65 hover:text-[#1a1118] hover:bg-[#D4AF37] border border-white/[0.10] hover:border-[#D4AF37] transition-all focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:ring-offset-2 focus:ring-offset-[#120a10]"
                    data-testid={`social-${label.toLowerCase()}`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </a>
                ))}
              </div>
            </div>

            <FooterCol title="Shop" links={shopCategories} />
            <FooterCol title={t.footer.services} links={services} />
            <FooterCol title="Tools & Resources" links={tools} />
            <FooterCol title={t.footer.company} links={company} />
            </div>
          </nav>

          {/* Policies + bottom bar */}
          <div className="border-t border-white/[0.05] py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
              {policies.map((p) => (
                <Link
                  key={p.href}
                  href={p.href}
                  className="inline-flex items-center min-h-9 text-[11.5px] text-white/65 hover:text-[#f5d76e] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2 focus-visible:ring-offset-[#120a10]"
                  data-testid={p.testid}
                >
                  {p.label}
                </Link>
              ))}
            </div>
            <div className="flex flex-col md:flex-row md:items-center gap-1.5 md:gap-4 text-[11px] text-white/35">
              <span>&copy; {new Date().getFullYear()} {siteName}. All rights reserved.</span>
              <span className="hidden md:inline text-white/20">·</span>
              <span className="flex items-center gap-1.5">
                <span className="text-[#D4AF37]/60">✦</span>
                {t.footer.madeWith}
              </span>
            </div>
          </div>

          {/* Compliance badges — moved here (very last footer row) per
              user request. Was previously stacked under the trust strip
              at the top of the footer; living below the copyright keeps
              the trust-rail uncluttered while the legal/compliance
              cluster sits where regulators expect it. */}
          <div
            className="border-t border-white/[0.05] py-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-2"
            data-testid="footer-compliance-row"
          >
            {complianceBadges.map((b) => (
              <span
                key={b.label}
                className="inline-flex items-center gap-1.5 text-[10px] text-white/55"
                data-testid={`compliance-${b.label.toLowerCase()}`}
              >
                <Lock className="h-3 w-3 text-[#D4AF37]/70" />
                <span className="text-white/75 font-semibold tracking-wider">{b.label}</span>
                <span className="text-white/40">·</span>
                <span className="uppercase tracking-[0.14em]">{b.sub}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { href: string; label: string; testid: string }[] }) {
  const [open, setOpen] = useState(false);
  const contentId = `footer-group-${useId().replace(/:/g, "")}`;

  return (
    <div className="border-t border-white/[0.08] md:border-0 md:col-span-1 lg:col-span-2">
      <button
        type="button"
        className="flex w-full items-center justify-between min-h-12 py-3 text-left text-[11px] font-bold text-[#f5d76e] uppercase tracking-[0.2em] md:hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-inset"
        aria-expanded={open}
        aria-controls={contentId}
        onClick={() => setOpen((value) => !value)}
      >
        <span>{title}</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>
      <h3 className="hidden md:block text-[10.5px] font-bold text-[#f5d76e] uppercase tracking-[0.2em] mb-3">
        {title}
      </h3>
      <div id={contentId} className={`${open ? "block" : "hidden"} md:block pb-3 md:pb-0`}>
        <ul className="space-y-0 md:space-y-2">
          {links.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className="inline-flex items-center min-h-11 md:min-h-0 text-white/70 hover:text-[#f5d76e] text-[13px] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2 focus-visible:ring-offset-[#120a10]"
                data-testid={l.testid}
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

import { useId, useState } from "react";
import { Link } from "wouter";
import { ChevronDown, Check, Lock, Loader2, Mail, MapPin, Phone, RotateCcw, ShieldCheck, Truck, Package, Box } from "lucide-react";
import { SiFacebook, SiInstagram, SiWhatsapp, SiX, SiYoutube } from "react-icons/si";
import { useI18n } from "@/lib/i18n";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useSiteSettings } from "@/lib/site-settings";
import { FOOTER_DESTINATIONS } from "@shared/footer-links";
import { BrandMark } from "@/components/brand/BrandMark";

const complianceBadges = [
  { label: "Secure checkout", sub: "Payment protection" },
  { label: "TLS protected", sub: "Encrypted connection" },
  { label: "GST invoicing", sub: "For eligible orders" },
  { label: "Product details", sub: "Check each item" },
];

const trustBadges = [
  { icon: Truck, label: "Shipping support", sub: "See shipping policy" },
  { icon: RotateCcw, label: "Returns support", sub: "See refund policy" },
  { icon: ShieldCheck, label: "Secure checkout", sub: "Payment protection" },
  { icon: Box, label: "Product details", sub: "Check each item" },
];

const paymentMethods = ["VISA", "MASTERCARD", "RuPay", "UPI", "NET BANKING"];

const fallbackSocials = [
  { Icon: SiInstagram, href: "https://instagram.com/vedictatva", label: "Instagram" },
  { Icon: SiFacebook, href: "https://facebook.com/vedictatva", label: "Facebook" },
  { Icon: SiYoutube, href: "https://youtube.com/@vedictatva", label: "YouTube" },
  { Icon: SiX, href: "https://x.com/vedictatva", label: "X" },
  { Icon: SiWhatsapp, href: "https://wa.me/918447844702", label: "WhatsApp" },
];

export default function Footer() {
  const settings = useSiteSettings();
  const { t } = useI18n();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");

  const siteName = settings?.siteName || "Vedic Tatva";
  const contactEmail = settings?.contactEmail || "ecom@vedictatva.com";
  const contactPhone = settings?.contactPhone || "+91 8447-8447-02";
  const whatsappHref = `https://wa.me/${(settings?.whatsappNumber || contactPhone).replace(/\D/g, "")}`;
  const locationLabel = [settings?.businessCity, settings?.businessRegion].filter(Boolean).join(" · ") || "Pan-India delivery · HQ New Delhi";
  const activeSocials = ([
    settings?.socialInstagram ? { Icon: SiInstagram, href: settings.socialInstagram, label: "Instagram" } : null,
    settings?.socialFacebook ? { Icon: SiFacebook, href: settings.socialFacebook, label: "Facebook" } : null,
    settings?.socialYoutube ? { Icon: SiYoutube, href: settings.socialYoutube, label: "YouTube" } : null,
    settings?.whatsappNumber ? { Icon: SiWhatsapp, href: whatsappHref, label: "WhatsApp" } : null,
  ].filter(Boolean).length ? [
    settings?.socialInstagram ? { Icon: SiInstagram, href: settings.socialInstagram, label: "Instagram" } : null,
    settings?.socialFacebook ? { Icon: SiFacebook, href: settings.socialFacebook, label: "Facebook" } : null,
    settings?.socialYoutube ? { Icon: SiYoutube, href: settings.socialYoutube, label: "YouTube" } : null,
    settings?.whatsappNumber ? { Icon: SiWhatsapp, href: whatsappHref, label: "WhatsApp" } : null,
  ].filter(Boolean) : fallbackSocials) as typeof fallbackSocials;

  const shopCategories = [
    { ...FOOTER_DESTINATIONS.shop[0], label: "Puja Samagri & Essentials" },
    { ...FOOTER_DESTINATIONS.shop[1], label: "Rudraksha Collection" },
    { ...FOOTER_DESTINATIONS.shop[2], label: "Rudraksha Malas" },
    { ...FOOTER_DESTINATIONS.shop[3], label: "Havan Samagri" },
    { ...FOOTER_DESTINATIONS.shop[4], label: "Puja Kits" },
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
  ];
  const company = [
    { ...FOOTER_DESTINATIONS.company[0], label: t.footer.aboutUs },
    { ...FOOTER_DESTINATIONS.company[1], label: t.footer.contact },
    { ...FOOTER_DESTINATIONS.company[2], label: "Blogs" },
    { ...FOOTER_DESTINATIONS.company[3], label: "Careers" },
    { ...FOOTER_DESTINATIONS.company[4], label: t.footer.becomePandit },
  ];
  const policies = [
    { ...FOOTER_DESTINATIONS.policies[0], label: t.footer.termsConditions },
    { ...FOOTER_DESTINATIONS.policies[1], label: t.footer.privacyPolicy },
    { ...FOOTER_DESTINATIONS.policies[2], label: t.footer.refundPolicy },
    { ...FOOTER_DESTINATIONS.policies[3], label: t.footer.shippingPolicy },
    { ...FOOTER_DESTINATIONS.policies[4], label: "Accessibility" },
  ];

  const handleNewsletterSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (status === "loading") return;
    const trimmed = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
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
    } catch {
      setStatus("idle");
      toast({ title: t.newsletter.error, variant: "destructive" });
    }
  };

  return (
    <footer className="relative pb-20 text-white lg:pb-0" aria-label={`${siteName} footer`} data-testid="footer">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-[#D4AF37]/65 to-transparent" />

      <section className="bg-[#f5eddf] px-4 py-7 sm:px-6 md:py-10" data-testid="footer-newsletter-strip">
        <form onSubmit={handleNewsletterSubmit} className="relative mx-auto flex max-w-6xl flex-col gap-5 overflow-hidden rounded-2xl border border-[#eadfce] bg-[#fffdf8] px-5 py-6 shadow-[0_12px_35px_rgba(75,35,20,0.08)] sm:px-8 md:flex-row md:items-center md:gap-8 md:px-10">
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#b28a22]/40 bg-[#fffaf0] text-[#9a7218]">
              <Mail className="h-6 w-6" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#806a61]" data-testid="text-newsletter-eyebrow">{t.newsletter.eyebrow}</p>
              <p className="mt-1 font-serif text-base leading-6 text-[#24131b] sm:text-lg" data-testid="text-newsletter-description">{t.newsletter.description}</p>
            </div>
          </div>
          <div className="relative z-10 flex w-full shrink-0 flex-col gap-2 sm:flex-row md:max-w-[510px]">
            <input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} disabled={status === "loading"} placeholder={t.newsletter.placeholder} aria-label={t.newsletter.eyebrow} className="min-h-11 min-w-0 flex-1 rounded-xl border border-[#cfc9c1] bg-[#fafafa] px-4 text-sm text-[#24131b] placeholder:text-[#8d8a86] focus:border-[#b28a22] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37]/50 disabled:opacity-60" data-testid="input-newsletter-email" />
            <button type="submit" disabled={status === "loading"} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#c99b20] px-6 text-sm font-semibold text-[#211014] transition-colors hover:bg-[#e2b936] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#b28a22] focus-visible:ring-offset-2 disabled:opacity-70" data-testid="button-newsletter-subscribe">
              {status === "loading" && <Loader2 className="h-4 w-4 animate-spin" />}
              {status === "success" && <Check className="h-4 w-4" />}
              {t.newsletter.subscribe}
            </button>
          </div>
          <span className="pointer-events-none absolute -right-2 -top-8 hidden h-40 w-40 rounded-full border border-[#b28a22]/20 md:block" aria-hidden="true"><span className="absolute inset-4 rounded-full border border-[#b28a22]/20" /><span className="absolute inset-10 rounded-full border border-[#b28a22]/20" /></span>
        </form>
      </section>

      <div className="relative overflow-hidden bg-[#260e15]">
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-72 bg-[radial-gradient(ellipse_at_92%_100%,rgba(205,155,42,0.24),transparent_28%),linear-gradient(to_top,rgba(15,5,9,0.58),transparent)]" aria-hidden="true" />
        <div className="pointer-events-none absolute bottom-[-30px] right-[6%] hidden h-32 w-48 rounded-[50%] bg-[#8b4c27]/45 blur-[10px] md:block" aria-hidden="true" />
        <div className="pointer-events-none absolute bottom-[72px] right-[13%] hidden h-28 w-5 rounded-[50%] bg-gradient-to-t from-[#dca62d] via-[#fff1a6] to-transparent opacity-80 blur-[2px] md:block" aria-hidden="true" />

        <div className="relative z-10 mx-auto max-w-6xl px-5 sm:px-8">
          <div className="grid gap-10 border-b border-white/15 py-10 md:grid-cols-[1fr_1.2fr] md:items-start md:py-12">
            <div>
              <Link href="/" className="inline-flex max-w-[320px] items-center" data-testid="footer-logo"><BrandMark settings={settings} placement="footer" testId="footer-brand-mark" /></Link>
              <p className="mt-3 max-w-sm text-xs leading-5 text-white/55">{t.footer.tagline}</p>
            </div>
            <div className="grid gap-3 text-sm text-white/75 sm:grid-cols-3">
              <a href={`mailto:${contactEmail}`} className="inline-flex min-h-10 items-center gap-2 transition-colors hover:text-[#f5d76e] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37]" data-testid="footer-email"><Mail className="h-4 w-4 shrink-0 text-[#d4af37]" aria-hidden="true" />{contactEmail}</a>
              <a href={`tel:${contactPhone.replace(/\s/g, "")}`} className="inline-flex min-h-10 items-center gap-2 transition-colors hover:text-[#f5d76e] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37]" data-testid="footer-phone"><Phone className="h-4 w-4 shrink-0 text-[#d4af37]" aria-hidden="true" />{contactPhone}</a>
              <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-white/45 px-3 text-xs font-semibold text-white transition-colors hover:border-[#f5d76e] hover:text-[#f5d76e] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37]" data-testid="footer-whatsapp"><SiWhatsapp className="h-4 w-4" aria-hidden="true" />Chat on WhatsApp</a>
              <span className="inline-flex min-h-10 items-center gap-2 text-xs text-white/65 sm:col-span-3"><MapPin className="h-4 w-4 shrink-0 text-[#d4af37]" aria-hidden="true" />{locationLabel}</span>
            </div>
          </div>

          <nav aria-label="Footer navigation" aria-labelledby="footer-navigation-heading">
            <h2 id="footer-navigation-heading" className="sr-only">Explore {siteName}</h2>
            <div className="grid gap-0 py-8 md:grid-cols-4 md:gap-8 md:py-10">
              <FooterCol title="Shop" links={shopCategories} />
              <FooterCol title={t.footer.services} links={services} />
              <FooterCol title="Tools & Resources" links={tools} />
              <FooterCol title={t.footer.company} links={company} />
            </div>
          </nav>

          <div className="grid grid-cols-2 gap-4 border-y border-white/15 py-5 md:grid-cols-4 md:gap-6">
            {trustBadges.map(({ icon: Icon, label, sub }) => (
              <div key={label} className="flex min-w-0 items-center gap-3" data-testid={`trust-${label.toLowerCase().replace(/\s+/g, "-")}`}>
                <Icon className="h-7 w-7 shrink-0 text-[#d4af37]" aria-hidden="true" />
                <div className="min-w-0"><div className="text-xs font-semibold text-white/90">{label}</div><div className="mt-0.5 text-[10px] text-white/50">{sub}</div></div>
              </div>
            ))}
          </div>

          <div className="grid gap-8 border-b border-white/15 py-8 md:grid-cols-[1fr_auto] md:items-center md:py-9">
            <div>
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#d4af37]">We accept</p>
              <div className="flex flex-wrap gap-2.5">
                {paymentMethods.map((method) => <span key={method} className="inline-flex h-8 min-w-[58px] items-center justify-center rounded bg-white px-2 text-[10px] font-black tracking-tight text-[#1f1721] shadow-sm">{method}</span>)}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-7 gap-y-3 border-l border-white/20 pl-6 text-xs text-white/75">
              {complianceBadges.map(({ label, sub }) => <div key={label} className="flex items-start gap-2"><Lock className="mt-0.5 h-4 w-4 shrink-0 text-[#d4af37]" /><span><strong className="block font-medium text-white/90">{label}</strong><span className="text-[10px] text-white/45">{sub}</span></span></div>)}
            </div>
          </div>

          <div className="flex flex-col gap-5 py-6 text-[11px] text-white/60 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">{policies.map((policy) => <Link key={policy.href} href={policy.href} className="transition-colors hover:text-[#f5d76e] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37]" data-testid={policy.testid}>{policy.label}</Link>)}</div>
            <div className="flex items-center gap-2">
              {activeSocials.map(({ Icon, href, label }) => <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} title={label} className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 transition-colors hover:border-[#d4af37] hover:text-[#f5d76e] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37]" data-testid={`social-${label.toLowerCase()}`}><Icon className="h-3.5 w-3.5" /></a>)}
              <span className="ml-2 inline-flex items-center gap-1.5 border-l border-white/20 pl-3 text-[10px] text-white/70"><span aria-hidden="true">🇮🇳</span> Made in India</span>
            </div>
          </div>
          <p className="border-t border-white/10 py-5 text-[11px] text-white/45">&copy; {new Date().getFullYear()} {siteName}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { href: string; label: string; testid: string }[] }) {
  const [open, setOpen] = useState(false);
  const contentId = `footer-group-${useId().replace(/:/g, "")}`;

  return (
    <div className="border-t border-white/[0.08] md:border-0">
      <button type="button" className={`flex min-h-12 w-full items-center justify-between py-3 text-left text-[11px] font-bold uppercase tracking-[0.2em] transition-colors md:hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-inset ${open ? "text-white" : "text-[#f5d76e]"}`} aria-expanded={open} aria-controls={contentId} onClick={() => setOpen((value) => !value)}>
        <span>{title}</span><ChevronDown className={`h-4 w-4 transition-transform duration-200 motion-reduce:transition-none ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>
      <h3 className="mb-3 hidden text-[10.5px] font-bold uppercase tracking-[0.2em] text-[#f5d76e] md:block">{title}</h3>
      <div id={contentId} className={`grid transition-[grid-template-rows,opacity,visibility] duration-200 motion-reduce:transition-none md:block md:opacity-100 md:visible ${open ? "grid-rows-[1fr] opacity-100 visible" : "grid-rows-[0fr] opacity-0 invisible"}`}>
        <div className="min-h-0 overflow-hidden md:overflow-visible">
          <ul className="space-y-0 pb-3 md:space-y-2 md:pb-0">{links.map((link) => <li key={link.href}><Link href={link.href} className="inline-flex min-h-11 items-center text-[13px] text-white/70 transition-colors hover:text-[#f5d76e] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] md:min-h-0" data-testid={link.testid}>{link.label}</Link></li>)}</ul>
        </div>
      </div>
    </div>
  );
}
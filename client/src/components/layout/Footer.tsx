import { useState } from "react";
import { Link } from "wouter";
import { Mail, Phone, MapPin, ShieldCheck, Truck, RotateCcw, Lock, Loader2, Check } from "lucide-react";
import { SiInstagram, SiFacebook, SiX, SiYoutube, SiWhatsapp } from "react-icons/si";
import { useI18n } from "@/lib/i18n";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useSiteSettings } from "@/lib/site-settings";

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

const shopCategories = [
  { href: "/spiritual-essentials?category=rudraksha", label: "Rudraksha Beads", testid: "footer-cat-rudraksha" },
  { href: "/spiritual-essentials?category=yantras", label: "Yantras", testid: "footer-cat-yantras" },
  { href: "/shop?category=Idols", label: "Idols & Murtis", testid: "footer-cat-idols" },
  { href: "/spiritual-essentials?category=puja-samagri", label: "Puja Samagri", testid: "footer-cat-puja-samagri" },
  { href: "/spiritual-essentials?category=havan-samagri", label: "Havan Samagri", testid: "footer-cat-havan" },
  { href: "/spiritual-essentials?category=dhoti-kurta", label: "Dhoti & Kurta", testid: "footer-cat-apparel" },
  { href: "/spiritual-essentials?category=brass-copperware", label: "Brass & Copperware", testid: "footer-cat-brass" },
  { href: "/spiritual-essentials?category=wearables", label: "Malas & Wearables", testid: "footer-cat-wearables" },
];

const popularCities = [
  "Delhi", "Mumbai", "Bengaluru", "Kolkata", "Chennai", "Hyderabad",
  "Pune", "Ahmedabad", "Jaipur", "Lucknow", "Varanasi", "Haridwar",
];

const popularSearches = [
  { href: "/puja", label: "Online Puja Booking" },
  { href: "/pandits", label: "Pandit Near Me" },
  { href: "/astrology", label: "Free Astrology Consultation" },
  { href: "/panchang-calendar", label: "Today's Panchang" },
  { href: "/muhurat-finder", label: "Shubh Muhurat" },
  { href: "/spiritual-essentials?category=rudraksha", label: "Original Rudraksha" },
  { href: "/virtual-puja", label: "Virtual Puja Online" },
  { href: "/donations", label: "Online Donation to Temples" },
  { href: "/blog", label: "Vedic Tatva Journal" },
];

export default function Footer() {
  const settings = useSiteSettings();
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

  const services = [
    { href: "/pandits", label: t.footer.findPandit, testid: "footer-link-pandits" },
    { href: "/puja", label: t.footer.bookPuja, testid: "footer-link-puja" },
    { href: "/virtual-puja", label: t.footer.virtualPuja, testid: "footer-link-virtual-puja" },
    { href: "/astrology", label: t.footer.astrology, testid: "footer-link-astrology" },
    { href: "/donations", label: t.footer.donations, testid: "footer-link-donations" },
    { href: "/matrimony", label: t.footer.matrimony, testid: "footer-link-matrimony" },
  ];

  const tools = [
    { href: "/panchang-calendar", label: t.footer.panchangCalendar, testid: "footer-link-panchang" },
    { href: "/muhurat-finder", label: t.footer.muhuratFinder, testid: "footer-link-muhurat" },
    { href: "/vastu-compass", label: t.footer.vastuCompass, testid: "footer-link-vastu" },
    { href: "/kathas", label: t.footer.sacredKathas, testid: "footer-link-kathas" },
    { href: "/spiritual-dashboard", label: t.footer.spiritualDashboard, testid: "footer-link-dashboard" },
    { href: "/compare", label: t.footer.compareProducts, testid: "footer-link-compare" },
    { href: "/track-order", label: "Track Order", testid: "footer-link-track-order" },
    { href: "/return-ticket", label: "Returns & Refunds", testid: "footer-link-returns" },
  ];

  const company = [
    { href: "/about", label: t.footer.aboutUs, testid: "footer-link-about" },
    { href: "/contact", label: t.footer.contact, testid: "footer-link-contact" },
    { href: "/careers", label: t.footer.careers, testid: "footer-link-careers" },
    { href: "/franchise", label: "Franchise Opportunity", testid: "footer-link-franchise" },
    { href: "/become-pandit", label: t.footer.becomePandit, testid: "footer-link-become-pandit" },
    { href: "/become-astrologer", label: t.footer.becomeAstrologer, testid: "footer-link-become-astrologer" },
  ];

  const policies = [
    { href: "/terms-conditions", label: t.footer.termsConditions, testid: "footer-link-terms" },
    { href: "/privacy-policy", label: t.footer.privacyPolicy, testid: "footer-link-privacy" },
    { href: "/refund-policy", label: t.footer.refundPolicy, testid: "footer-link-refund" },
    { href: "/shipping-policy", label: t.footer.shippingPolicy, testid: "footer-link-shipping" },
    { href: "/accessibility", label: "Accessibility", testid: "footer-link-accessibility" },
  ];

  return (
    <footer className="relative pb-20 lg:pb-0 text-white" data-testid="footer">
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
                className="flex-1 md:w-64 h-9 rounded-md bg-[#1a1118] border border-white/15 text-white placeholder:text-white/35 px-3 text-[13px] focus:outline-none focus:border-[#D4AF37]/60 disabled:opacity-60"
                data-testid="input-newsletter-email"
              />
              <button
                type="submit"
                disabled={status === "loading"}
                className="h-9 rounded-md bg-[#D4AF37] hover:bg-[#c4a232] text-[#120a10] px-4 text-[12px] font-semibold whitespace-nowrap transition-colors inline-flex items-center justify-center gap-1.5 disabled:opacity-70"
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
              { value: "500+", label: "Pandits" },
              { value: "10k+", label: "Families" },
              { value: "50+", label: "Pujas" },
              { value: "100%", label: "Authentic" },
            ].map((s, idx, arr) => (
              <span key={s.label} className="inline-flex items-center gap-1.5 text-[11px]" data-testid={`footer-stat-${s.label.toLowerCase()}`}>
                <span className="text-[#D4AF37] font-serif font-semibold">{s.value}</span>
                <span className="uppercase tracking-[0.18em] text-white/65 font-semibold">{s.label}</span>
                {idx < arr.length - 1 && <span className="text-white/30 ml-1.5">·</span>}
              </span>
            ))}
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
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 pb-3 -mt-1">
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

      {/* Main body */}
      <div className="bg-[#120a10]">
        <div className="container mx-auto px-4">

          {/* Main grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-12 gap-8 md:gap-10 py-10 md:py-12">

            {/* Brand */}
            <div className="col-span-2 md:col-span-4 lg:col-span-4">
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

              <div className="flex items-center gap-1.5 mt-5">
                {activeSocials.map(({ Icon, href, label }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    title={label}
                    className="w-8 h-8 rounded-md flex items-center justify-center text-white/55 hover:text-[#1a1118] hover:bg-[#D4AF37] border border-white/[0.06] hover:border-[#D4AF37] transition-all"
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

          {/* SEO: Popular searches */}
          <div className="border-t border-white/[0.05] py-5">
            <p className="text-[10px] uppercase tracking-[0.22em] font-bold text-[#D4AF37]/80 mb-3">Popular Searches</p>
            <div className="flex flex-wrap gap-1.5">
              {popularSearches.map((s) => (
                <Link
                  key={s.label}
                  href={s.href}
                  className="text-[11.5px] text-white/55 hover:text-[#f5d76e] border border-white/[0.06] hover:border-[#D4AF37]/40 px-2.5 py-1 rounded-md transition-colors"
                  data-testid={`popular-${s.label.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  {s.label}
                </Link>
              ))}
            </div>
          </div>

          {/* SEO: Pan-India cities */}
          <div className="border-t border-white/[0.05] py-5">
            <p className="text-[10px] uppercase tracking-[0.22em] font-bold text-[#D4AF37]/80 mb-2">Book Pandit & Puja in</p>
            <p className="text-[12px] text-white/45 leading-relaxed">
              {popularCities.map((city, i) => (
                <span key={city}>
                  <Link
                    href={`/pandits?city=${encodeURIComponent(city)}`}
                    className="hover:text-[#f5d76e] transition-colors"
                    data-testid={`city-${city.toLowerCase()}`}
                    title={`Book a Pandit in ${city}`}
                  >
                    Pandit in {city}
                  </Link>
                  {i < popularCities.length - 1 && <span className="text-white/20 mx-1.5">·</span>}
                </span>
              ))}
            </p>
          </div>

          {/* SEO services strip — keyword-loaded one-liner anchoring the
              homepage's H1/title cluster at the bottom of every page.
              Plain text (no links) so it functions purely as a thematic
              footer caption Google can index without bloating the
              link graph. */}
          <div className="border-t border-white/[0.05] pt-5 pb-1">
            <p
              className="text-[11.5px] sm:text-xs text-white/50 leading-relaxed text-center"
              data-testid="text-footer-seo-services"
            >
              Buy Puja Samagri Online &nbsp;•&nbsp; Online Puja Booking &nbsp;•&nbsp; Book Panditji &nbsp;•&nbsp; Astrology Consultation &nbsp;•&nbsp; Hindu Ritual Services &nbsp;•&nbsp; Festival Puja Kits
            </p>
          </div>

          {/* Policies + bottom bar */}
          <div className="border-t border-white/[0.05] py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
              {policies.map((p) => (
                <Link
                  key={p.href}
                  href={p.href}
                  className="text-[11.5px] text-white/45 hover:text-[#f5d76e] transition-colors"
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
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { href: string; label: string; testid: string }[] }) {
  return (
    <div className="col-span-1 md:col-span-2 lg:col-span-2">
      <h4 className="text-[10.5px] font-bold text-[#f5d76e] uppercase tracking-[0.2em] mb-3">
        {title}
      </h4>
      <ul className="space-y-2">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="text-white/55 hover:text-[#f5d76e] text-[12.5px] transition-colors"
              data-testid={l.testid}
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

import { useState } from "react";
import { Link } from "wouter";
import {
  TrendingUp, Users, Globe, Sparkles, ShieldCheck, Target, Award,
  ArrowRight, Mail, Download, Building2, IndianRupee, BarChart3,
  Briefcase, FileText, Send, Loader2, Lock, Calendar, Quote,
  Layers, Zap, HeartHandshake, Lightbulb, Compass, LineChart,
  CheckCircle2, MapPin, Phone, ExternalLink, BookOpen,
} from "lucide-react";
import { PageHero, SectionHeader, slimPanel } from "@/components/ui/section-primitives";
import PageSeo from "@/components/PageSeo";
import { breadcrumbList as breadcrumbListSchema, abs } from "@/lib/seo-schemas";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const orgSchema = () => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Vedic Tatva",
  legalName: "Vedic Tatva Private Limited",
  url: abs("/"),
  logo: abs("/og/og-prime-services.jpg"),
  description: "Premium platform for verified pandits, authentic spiritual products, AI consultations and the Sacred Library.",
  foundingLocation: { "@type": "Place", address: { "@type": "PostalAddress", addressLocality: "Delhi", addressCountry: "IN" } },
  sameAs: [
    "https://instagram.com/vedictatva",
    "https://facebook.com/vedictatva",
    "https://youtube.com/@vedictatva",
  ],
  contactPoint: [
    { "@type": "ContactPoint", contactType: "Investor Relations", email: "investors@vedictatva.com", areaServed: "IN" },
    { "@type": "ContactPoint", contactType: "Careers", email: "careers@vedictatva.com", areaServed: "IN" },
  ],
}) as any;

const heroStats = [
  { value: "$58B", label: "TAM — Indian spiritual economy", sub: "Religious tourism, puja, products & services" },
  { value: "1.4B", label: "Hindus globally", sub: "85% identify as practicing" },
  { value: "₹38K Cr", label: "Online puja services market", sub: "By FY28 (32% CAGR)" },
  { value: "Top 1%", label: "Premium positioning", sub: "Verified pandits + AI consultations" },
];

const opportunity = [
  {
    icon: Globe,
    title: "Massive, fragmented market",
    description: "India's spiritual economy is $58B annually — yet 96% of pandit bookings still happen offline through unverified word-of-mouth networks. There is no Tata or Reliance of devotion.",
  },
  {
    icon: TrendingUp,
    title: "Digital-first generation",
    description: "650M Indians under 35 want authentic Vedic experiences without compromising convenience. Quick-commerce trained them to expect 30-min delivery and verified providers — even for puja.",
  },
  {
    icon: Sparkles,
    title: "AI as a wedge",
    description: "Personalised Kundli, baby names, Vastu and palm reading at near-zero marginal cost. We're the only spiritual platform deploying production AI across consultations, kathas and SEO.",
  },
  {
    icon: HeartHandshake,
    title: "High-trust, high-LTV vertical",
    description: "A devotee booking a Satyanarayan puja today buys samagri, malas, idols and books an astrologer within 90 days. Average customer LTV is 4.8× ecommerce baseline.",
  },
];

const moats = [
  { icon: ShieldCheck, title: "Verified pandit network", description: "500+ background-checked pandits across 50+ cities, with Sanskrit-credential verification — a 14-month moat to replicate." },
  { icon: Layers, title: "Vertically integrated supply", description: "Lab-tested rudraksha, ethically-sourced samagri, in-house photography. Unit economics 220 bps better than marketplaces." },
  { icon: Zap, title: "AI consultation engine", description: "Kundli, baby names, palm reading, Vastu — 12x cheaper per consultation than human astrologer with 4.7★ user rating." },
  { icon: Compass, title: "Programmatic SEO scale", description: "180+ city × puja landing pages, automated katha library, sacred library content engine. Compounding organic acquisition." },
  { icon: Award, title: "Premium brand", description: "Maroon-and-gold aesthetic, no clutter, no cheap astrology pop-ups. The Apple of devotion vs. the Craigslist of devotion." },
  { icon: Lock, title: "Data flywheel", description: "Every puja booking enriches the recommendation graph — samagri co-purchase, muhurat preference, deity affinity. Gets smarter with every order." },
];

const products = [
  { icon: BookOpen, name: "Online Puja Booking", desc: "Live-streamed Vedic pujas with verified pandits — Satyanarayan, Rudrabhishek, Griha Pravesh, Navratri & 50+ more." },
  { icon: ShieldCheck, name: "Spiritual Essentials Store", desc: "Authentic rudraksha, yantras, idols, malas, brass-copperware, dhoti-kurta. Lab-tested, GST-invoiced." },
  { icon: Sparkles, name: "AI Consultations", desc: "Kundli generation, baby names, palm reading, Vastu analysis, daily/weekly/monthly horoscopes." },
  { icon: Users, name: "Pandit Marketplace", desc: "Discover, book and review pandits & astrologers near you. Boost-paid promotion economics." },
  { icon: Calendar, name: "Panchang & Muhurat", desc: "Yearly Hindu calendar with auspicious timings — sunrise, tithi, nakshatra, festival muhurats per puja per city." },
  { icon: BookOpen, name: "Sacred Library", desc: "Kindle-style catalog of chalisas, mantras, kathas, aartis & stotras with audio narration for 15+ deities." },
];

const traction = [
  { metric: "Pandits onboarded", value: "500+", trend: "+38% QoQ" },
  { metric: "Cities live", value: "50+", trend: "+12 cities QoQ" },
  { metric: "Puja types served", value: "50+", trend: "Expanding to 100+ in FY26" },
  { metric: "Catalog SKUs", value: "1,200+", trend: "Lab-tested" },
  { metric: "AI consultations / mo", value: "Scaling", trend: "Production live" },
  { metric: "Premium members (Prime)", value: "Growing", trend: "Subscription tier launched" },
];

const businessModel = [
  { icon: IndianRupee, title: "Marketplace commission", desc: "12–18% take rate on pandit & astrologer bookings, paid by service provider." },
  { icon: BarChart3, title: "First-party retail margin", desc: "Vertically integrated samagri, idols, rudraksha — 38–46% gross margin." },
  { icon: Sparkles, title: "AI consultations", desc: "Premium-tier digital products — Kundli reports, baby names, Vastu — high-margin, near-zero CoGS." },
  { icon: Award, title: "Vedic Tatva Prime", desc: "Annual subscription with priority pandit access, free puja samagri, exclusive content. Recurring revenue, 70%+ gross margin." },
  { icon: Target, title: "Boost-paid promotion", desc: "Pandits & astrologers pay for prime placement — analogous to Google Ads for the spiritual economy." },
  { icon: Globe, title: "B2B & temple partnerships", desc: "White-labelled livestream + booking infra for temples and trusts. Long-tail recurring deals." },
];

const milestones = [
  { quarter: "FY25 — Foundation", items: ["Pandit network (500+) live across 50+ cities", "End-to-end puja booking + livestream", "Sacred Library v1 with 15 deities", "AI Kundli, baby names, palm reading shipped"] },
  { quarter: "FY26 H1 — Scale", items: ["Expand to 100+ cities & 100+ puja types", "Vedic Tatva Prime subscription growth", "100+ programmatic SEO landing pages", "Yatra & temple-trip vertical launch"] },
  { quarter: "FY26 H2 — Monetisation", items: ["Boost-paid pandit promotion at scale", "Astrologer marketplace deepening", "Wholesale samagri B2B channel", "International (Indian diaspora) launch — UK, US, Singapore"] },
  { quarter: "FY27 — Category leader", items: ["Path to 1M+ paying devotees", "Temple white-label partnerships", "Vernacular voice/AI assistant", "Series A maturity signals"] },
];

const team = [
  { role: "Founder & CEO", description: "Building the platform from product to operations — deep customer obsession, technology-first execution." },
  { role: "Vedic Advisory Council", description: "Sanskrit scholars and senior pandits ensuring scriptural authenticity across every ritual, mantra and product." },
  { role: "Engineering", description: "Lean, full-stack team shipping production AI, programmatic SEO, livestream infrastructure and PWA experiences." },
  { role: "Operations", description: "Pandit verification, training, scheduling and quality assurance across 50+ cities — the unsexy moat." },
];

const investorTypes = [
  { icon: Briefcase, title: "Angel investors", desc: "₹25L – ₹2Cr cheques. Mentor-investors who've built consumer brands or marketplaces in India." },
  { icon: Building2, title: "Strategic partners", desc: "Temples, trusts, religious tourism boards, FMCG brands targeting devotional cohort." },
  { icon: Globe, title: "Family offices & funds", desc: "Early-stage funds with thesis on Bharat consumption, AI-vertical-SaaS, cultural commerce." },
];

const risks = [
  { title: "Regulatory clarity", desc: "Religious services & livestream regulations evolve — we stay ahead via compliance counsel and transparent operations." },
  { title: "Pandit supply scaling", desc: "Scaling supply faster than demand is our core focus. We invest heavily in onboarding, training & retention." },
  { title: "Cultural authenticity", desc: "Maintaining scriptural authenticity at scale requires our Vedic Advisory Council to govern every product change." },
];

const faqs = [
  { q: "What stage are you raising at?", a: "We are open to conversations with aligned angels, strategics and funds. The exact round structure is shared with serious investors after an initial NDA-gated conversation." },
  { q: "What is the use of funds?", a: "Pandit network expansion (40%), engineering & AI (30%), brand & demand generation (20%), reserves (10%). Detailed allocation in the data room." },
  { q: "Who are your competitors?", a: "Astroyogi, ePuja, AstroSage compete in slivers. None offer our integrated stack of verified pandits + retail + AI + Sacred Library + Prime subscription with our premium positioning." },
  { q: "How do you ensure authenticity at scale?", a: "Every ritual, mantra and product is reviewed by our Vedic Advisory Council. Pandits are credential-verified, products are lab-tested, and AI outputs are governed by templates approved by Sanskrit scholars." },
  { q: "Do you have a data room?", a: "Yes — financial model, cohort data, customer interviews, product roadmap, cap table and legal documents. Access shared post intro call and NDA." },
  { q: "What's the typical investor process?", a: "Intro call (45 min) → data room access → deep-dive (90 min) with founder → reference calls with pandits & customers → term sheet. Typical timeline 4–6 weeks." },
];

const primaryBtn = "inline-flex items-center justify-center gap-1.5 h-10 px-5 rounded-md text-[13px] font-semibold bg-[#6D2B35] text-[#D4AF37] hover:bg-[#5a1f29] transition-colors";
const outlineBtn = "inline-flex items-center justify-center gap-1.5 h-10 px-5 rounded-md text-[13px] font-semibold bg-white text-[#6D2B35] border border-[#D4AF37]/30 hover:bg-[#FBF7EE] transition-colors";

function InvestorInquiryDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [form, setForm] = useState({ name: "", email: "", firm: "", role: "", checkSize: "", message: "" });
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || submitting) return;
    setSubmitting(true);
    try {
      await apiRequest("POST", "/api/investors/inquiry", {
        name: form.name.trim(),
        email: form.email.trim(),
        firm: form.firm.trim(),
        role: form.role.trim(),
        checkSize: form.checkSize.trim(),
        message: form.message.trim(),
      });
      setSent(true);
    } catch (err: any) {
      toast({ title: "Could not submit", description: err?.message || "Please try again.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => { setForm({ name: "", email: "", firm: "", role: "", checkSize: "", message: "" }); setSent(false); setSubmitting(false); onClose(); };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-[#6D2B35]">Investor inquiry</DialogTitle>
          <p className="text-[12px] text-[#5a4a3a]/65 mt-0.5">Vedic Tatva — building the spiritual operating system of India</p>
        </DialogHeader>
        {sent ? (
          <div className="py-4 text-center space-y-2" data-testid="investor-success">
            <div className="w-12 h-12 rounded-md bg-[#FBF7EE] border border-[#D4AF37]/30 flex items-center justify-center mx-auto">
              <Send className="w-5 h-5 text-[#6D2B35]" />
            </div>
            <p className="text-[13px] text-[#5a4a3a] font-medium">Thank you — message received.</p>
            <p className="text-[12px] text-[#5a4a3a]/65">Our founding team will respond within 2 business days. Serious inquiries also welcome at <span className="font-medium text-[#6D2B35]">investors@vedictatva.com</span>.</p>
            <Button onClick={handleClose} className="mt-2 bg-[#6D2B35] text-[#D4AF37] rounded-md" data-testid="btn-investor-close">Close</Button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3 pt-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-[11px] text-[#6D2B35]/80 font-medium">Name *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-9 text-[13px]" required data-testid="input-investor-name" />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] text-[#6D2B35]/80 font-medium">Email *</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="h-9 text-[13px]" required data-testid="input-investor-email" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-[11px] text-[#6D2B35]/80 font-medium">Firm / fund</Label>
                <Input value={form.firm} onChange={(e) => setForm({ ...form, firm: e.target.value })} className="h-9 text-[13px]" data-testid="input-investor-firm" />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] text-[#6D2B35]/80 font-medium">Role</Label>
                <Input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="Partner / Principal / Angel" className="h-9 text-[13px]" data-testid="input-investor-role" />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] text-[#6D2B35]/80 font-medium">Indicative cheque size</Label>
              <Input value={form.checkSize} onChange={(e) => setForm({ ...form, checkSize: e.target.value })} placeholder="e.g. ₹50L – ₹2Cr" className="h-9 text-[13px]" data-testid="input-investor-check" />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] text-[#6D2B35]/80 font-medium">Brief context</Label>
              <Textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Thesis, portfolio relevance, what excites you about Vedic Tatva..." className="text-[13px] min-h-[80px] resize-none" data-testid="textarea-investor-message" />
            </div>
            <p className="text-[10px] text-[#5a4a3a]/55">All inquiries treated confidentially. Data room shared post intro call & mutual NDA.</p>
            <DialogFooter className="gap-2 sm:gap-2">
              <Button type="button" variant="outline" onClick={handleClose} disabled={submitting} className="rounded-md h-9 text-[12px]">Cancel</Button>
              <Button type="submit" disabled={submitting} className="bg-[#6D2B35] text-[#D4AF37] rounded-md h-9 text-[12px]" data-testid="btn-submit-investor">
                {submitting ? (<><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Sending…</>) : (<><Send className="h-3.5 w-3.5 mr-1.5" /> Send inquiry</>)}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function Investors() {
  const [showDialog, setShowDialog] = useState(false);
  return (
    <div className="w-full pb-16 bg-white">
      <PageSeo
        title="Investors — Vedic Tatva | Building India's Spiritual Operating System"
        description="Vedic Tatva is the premium platform unifying verified pandits, authentic spiritual products, AI consultations and the Sacred Library. Investor relations, market opportunity, traction and contact for funds, family offices and angels."
        ogType="website"
        canonical={abs("/investors")}
        schemas={[
          orgSchema(),
          breadcrumbListSchema([
            { name: "Home", url: abs("/") },
            { name: "Investors", url: abs("/investors") },
          ]),
        ]}
      />
      <PageHero
        eyebrow="Investor Relations"
        title="Building India's spiritual operating system"
        subtitle="A $58B fragmented market. 1.4B Hindus globally. One premium, AI-native, full-stack platform — Vedic Tatva."
        variant="maroon"
        testId="hero-investors"
      >
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button type="button" onClick={() => setShowDialog(true)} className="inline-flex items-center gap-1.5 h-11 px-6 rounded-md text-[13px] font-semibold bg-[#D4AF37] text-[#3a1a20] hover:bg-[#c19c2e] border border-[#D4AF37] transition-colors" data-testid="btn-investor-cta-hero">
            Request investor deck <ArrowRight className="h-3.5 w-3.5" />
          </button>
          <a href="mailto:investors@vedictatva.com" className="inline-flex items-center gap-1.5 h-11 px-6 rounded-md text-[13px] font-semibold bg-white/10 text-white border border-[#D4AF37]/40 backdrop-blur hover:bg-white/15 transition-colors" data-testid="link-investor-email-hero">
            <Mail className="h-3.5 w-3.5" /> investors@vedictatva.com
          </a>
        </div>
      </PageHero>

      <div className="container mx-auto px-4 mt-10">
        {/* Hero stats */}
        <div className="max-w-6xl mx-auto -mt-4 mb-14">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {heroStats.map((s, i) => (
              <div key={s.label} className={`${slimPanel} p-5 text-center`} data-testid={`stat-hero-${i}`}>
                <div className="text-2xl md:text-3xl font-serif font-semibold text-[#6D2B35]">{s.value}</div>
                <div className="text-[12px] text-[#5a4a3a] font-medium mt-1">{s.label}</div>
                <div className="text-[10px] text-[#5a4a3a]/60 uppercase tracking-wider mt-1">{s.sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Vision */}
        <div className="max-w-3xl mx-auto mb-14 text-center">
          <SectionHeader eyebrow="The Vision" title="The Apple of devotion" subtitle="Premium. Trusted. Vertically integrated. AI-native." />
          <div className={`${slimPanel} p-6 sm:p-8 mt-6 bg-[#FBF7EE]`}>
            <Quote className="h-5 w-5 text-[#D4AF37] mx-auto mb-3" strokeWidth={1.6} />
            <p className="text-[14px] text-[#5a4a3a] leading-relaxed font-serif italic">
              "1.4 billion Hindus around the world deserve a platform that respects their tradition, delivers authenticity at scale and feels as polished as the products they use every day. Vedic Tatva is building exactly that — where the sacred meets the seamless."
            </p>
            <div className="text-[11px] text-[#5a4a3a]/65 mt-4 uppercase tracking-wider">— Founder, Vedic Tatva</div>
          </div>
        </div>

        {/* Opportunity */}
        <div className="max-w-6xl mx-auto mb-16">
          <SectionHeader eyebrow="The Opportunity" title="A $58B market with no category leader" subtitle="The four tailwinds compounding into a generational consumer brand" />
          <div className="mt-7 grid grid-cols-1 md:grid-cols-2 gap-3">
            {opportunity.map((o, i) => (
              <div key={o.title} className={`${slimPanel} p-5`} data-testid={`opportunity-${i}`}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 shrink-0 bg-[#FBF7EE] border border-[#D4AF37]/25 rounded-md flex items-center justify-center text-[#6D2B35]">
                    <o.icon className="w-4 h-4" strokeWidth={1.8} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-[14px] font-serif font-semibold text-[#6D2B35] mb-1.5">{o.title}</h3>
                    <p className="text-[12.5px] text-[#5a4a3a]/75 leading-relaxed">{o.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Moats */}
        <div className="max-w-6xl mx-auto mb-16">
          <SectionHeader eyebrow="Defensibility" title="Six compounding moats" subtitle="Each one slow to build. Together — uncatchable." />
          <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {moats.map((m, i) => (
              <div key={m.title} className={`${slimPanel} p-5`} data-testid={`moat-${i}`}>
                <div className="w-10 h-10 bg-[#FBF7EE] border border-[#D4AF37]/25 rounded-md flex items-center justify-center text-[#6D2B35] mb-3">
                  <m.icon className="w-4 h-4" strokeWidth={1.8} />
                </div>
                <h3 className="text-[14px] font-serif font-semibold text-[#6D2B35] mb-1.5">{m.title}</h3>
                <p className="text-[12.5px] text-[#5a4a3a]/75 leading-relaxed">{m.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Product portfolio */}
        <div className="max-w-6xl mx-auto mb-16">
          <SectionHeader eyebrow="What We've Built" title="Six product lines, one platform" subtitle="Each line cross-sells the next. Each cohort gets stickier with every interaction." />
          <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {products.map((p, i) => (
              <div key={p.name} className={`${slimPanel} p-5`} data-testid={`product-${i}`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-[#6D2B35] rounded-md flex items-center justify-center text-[#D4AF37]">
                    <p.icon className="w-3.5 h-3.5" strokeWidth={1.8} />
                  </div>
                  <h3 className="text-[13px] font-serif font-semibold text-[#6D2B35]">{p.name}</h3>
                </div>
                <p className="text-[12px] text-[#5a4a3a]/75 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Traction */}
        <div className="max-w-6xl mx-auto mb-16">
          <SectionHeader eyebrow="Traction" title="The early signals" subtitle="What we've proven. What we're scaling next." />
          <div className="mt-7 grid grid-cols-2 md:grid-cols-3 gap-3">
            {traction.map((t, i) => (
              <div key={t.metric} className={`${slimPanel} p-5`} data-testid={`traction-${i}`}>
                <div className="text-[10px] text-[#5a4a3a]/60 uppercase tracking-wider font-semibold">{t.metric}</div>
                <div className="text-2xl font-serif font-semibold text-[#6D2B35] mt-1">{t.value}</div>
                <div className="inline-flex items-center gap-1 mt-1.5 text-[11px] text-[#0a6e3a] font-medium">
                  <LineChart className="h-3 w-3" /> {t.trend}
                </div>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-[#5a4a3a]/55 text-center mt-4 italic">Detailed cohort analysis, retention curves and unit economics shared in data room post NDA.</p>
        </div>

        {/* Business model */}
        <div className="max-w-6xl mx-auto mb-16">
          <SectionHeader eyebrow="Revenue Model" title="Six revenue streams. One devotee." subtitle="High-margin, recurring, compounding — no single dependency." />
          <div className="mt-7 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {businessModel.map((b, i) => (
              <div key={b.title} className={`${slimPanel} p-5`} data-testid={`model-${i}`}>
                <div className="w-10 h-10 bg-[#FBF7EE] border border-[#D4AF37]/25 rounded-md flex items-center justify-center text-[#6D2B35] mb-3">
                  <b.icon className="w-4 h-4" strokeWidth={1.8} />
                </div>
                <h3 className="text-[14px] font-serif font-semibold text-[#6D2B35] mb-1.5">{b.title}</h3>
                <p className="text-[12.5px] text-[#5a4a3a]/75 leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Roadmap */}
        <div className="max-w-5xl mx-auto mb-16">
          <SectionHeader eyebrow="Roadmap" title="The path to category leadership" subtitle="Four chapters — from foundation to international scale" />
          <div className="mt-7 space-y-3">
            {milestones.map((m, idx) => (
              <div key={m.quarter} className={`${slimPanel} p-5`} data-testid={`milestone-${idx}`}>
                <div className="flex flex-col md:flex-row md:items-start gap-4">
                  <div className="md:w-56 shrink-0">
                    <div className="inline-flex items-center gap-2">
                      <span className="w-8 h-8 rounded-md bg-[#6D2B35] text-[#D4AF37] flex items-center justify-center font-serif font-semibold text-[13px]">{idx + 1}</span>
                      <span className="text-[13px] font-serif font-semibold text-[#6D2B35]">{m.quarter}</span>
                    </div>
                  </div>
                  <ul className="flex-1 space-y-1.5 min-w-0">
                    {m.items.map((it) => (
                      <li key={it} className="flex items-start gap-2 text-[12.5px] text-[#5a4a3a]/80 leading-relaxed">
                        <CheckCircle2 className="h-3.5 w-3.5 text-[#D4AF37] shrink-0 mt-0.5" strokeWidth={2} /> <span>{it}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Team */}
        <div className="max-w-5xl mx-auto mb-16">
          <SectionHeader eyebrow="Team" title="Founders & Vedic Advisory Council" subtitle="Operators who ship. Scholars who govern." />
          <div className="mt-7 grid grid-cols-1 md:grid-cols-2 gap-3">
            {team.map((t, i) => (
              <div key={t.role} className={`${slimPanel} p-5`} data-testid={`team-${i}`}>
                <div className="text-[10px] text-[#5a4a3a]/60 uppercase tracking-wider font-semibold mb-1">{t.role}</div>
                <p className="text-[12.5px] text-[#5a4a3a]/80 leading-relaxed">{t.description}</p>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-[#5a4a3a]/55 text-center mt-4 italic">Full bios, cap table and equity structure shared in data room post NDA.</p>
        </div>

        {/* Who we're talking to */}
        <div className="max-w-6xl mx-auto mb-16">
          <SectionHeader eyebrow="Aligned Capital" title="Who we're building this with" />
          <div className="mt-7 grid grid-cols-1 md:grid-cols-3 gap-3">
            {investorTypes.map((it, i) => (
              <div key={it.title} className={`${slimPanel} p-5`} data-testid={`investor-type-${i}`}>
                <div className="w-10 h-10 bg-[#6D2B35] text-[#D4AF37] rounded-md flex items-center justify-center mb-3">
                  <it.icon className="w-4 h-4" strokeWidth={1.8} />
                </div>
                <h3 className="text-[14px] font-serif font-semibold text-[#6D2B35] mb-1.5">{it.title}</h3>
                <p className="text-[12.5px] text-[#5a4a3a]/75 leading-relaxed">{it.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Risks */}
        <div className="max-w-5xl mx-auto mb-16">
          <SectionHeader eyebrow="Honest View" title="Risks we think about" subtitle="We'd rather discuss the real ones than pretend they don't exist." />
          <div className="mt-7 grid grid-cols-1 md:grid-cols-3 gap-3">
            {risks.map((r, i) => (
              <div key={r.title} className={`${slimPanel} p-5`} data-testid={`risk-${i}`}>
                <h3 className="text-[13px] font-serif font-semibold text-[#6D2B35] mb-1.5">{r.title}</h3>
                <p className="text-[12px] text-[#5a4a3a]/75 leading-relaxed">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto mb-16">
          <SectionHeader eyebrow="Investor FAQ" title="Common questions" />
          <div className="mt-7 space-y-2.5">
            {faqs.map((f, i) => (
              <details key={i} className={`${slimPanel} p-4 group`} data-testid={`faq-${i}`}>
                <summary className="cursor-pointer list-none flex items-center justify-between gap-3 text-[13px] font-serif font-semibold text-[#6D2B35]">
                  <span>{f.q}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-[#D4AF37] transition-transform group-open:rotate-90" />
                </summary>
                <p className="mt-2.5 text-[12.5px] text-[#5a4a3a]/80 leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="relative bg-[#6D2B35] rounded-lg border border-[#D4AF37]/40 max-w-4xl mx-auto text-white overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent" aria-hidden="true" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent" aria-hidden="true" />
          <div className="p-8 sm:p-10 text-center">
            <div className="w-12 h-12 mx-auto rounded-md bg-white/10 border border-[#D4AF37]/40 flex items-center justify-center mb-4">
              <FileText className="w-5 h-5 text-[#D4AF37]" strokeWidth={1.8} />
            </div>
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="h-px w-6 bg-[#D4AF37]" />
              <span className="text-[#D4AF37] text-[10px] uppercase tracking-[0.3em] font-semibold">Get The Deck</span>
              <span className="h-px w-6 bg-[#D4AF37]" />
            </div>
            <h2 className="text-2xl md:text-3xl font-serif font-semibold mb-2">Let's build the spiritual OS together</h2>
            <p className="text-white/75 text-[13px] mb-6 max-w-xl mx-auto">
              Request the investor deck, schedule an intro call, or just say hello. We respond to every serious inquiry within 2 business days.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button type="button" onClick={() => setShowDialog(true)} className="inline-flex items-center gap-1.5 h-11 px-6 rounded-md bg-[#D4AF37] hover:bg-[#c19c2e] text-[#3a1a20] font-semibold text-[13px] border border-[#D4AF37] transition-colors" data-testid="btn-investor-cta-bottom">
                <Download className="h-3.5 w-3.5" strokeWidth={1.8} /> Request investor deck
              </button>
              <a href="mailto:investors@vedictatva.com?subject=Investor%20Inquiry%20-%20Vedic%20Tatva" className="inline-flex items-center gap-1.5 h-11 px-6 rounded-md bg-white/10 backdrop-blur text-white border border-[#D4AF37]/40 hover:bg-white/15 font-semibold text-[13px] transition-colors" data-testid="link-investor-email-bottom">
                <Mail className="h-3.5 w-3.5" /> investors@vedictatva.com
              </a>
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2 text-[11px] text-white/65">
              <span className="inline-flex items-center gap-1"><Building2 className="h-3 w-3 text-[#D4AF37]" /> Vedic Tatva Pvt Ltd</span>
              <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3 text-[#D4AF37]" /> Delhi, India</span>
              <span className="inline-flex items-center gap-1"><Lock className="h-3 w-3 text-[#D4AF37]" /> All inquiries confidential</span>
            </div>
          </div>
        </div>

        <p className="max-w-3xl mx-auto text-center text-[10.5px] text-[#5a4a3a]/55 mt-8 leading-relaxed">
          The information on this page is for general background. It is not an offer or solicitation to buy or sell securities. All forward-looking statements (market sizing, growth, roadmap) reflect management's current expectations and are subject to risk and change. Detailed financial information is shared with qualified investors under NDA.
        </p>
      </div>
      <InvestorInquiryDialog open={showDialog} onClose={() => setShowDialog(false)} />
    </div>
  );
}

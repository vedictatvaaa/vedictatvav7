import { Link } from "wouter";
import { Shield, Heart, Globe, Cpu, MapPin, Users, Headphones, Building, ArrowRight, UserCheck, CheckCircle, IndianRupee, RotateCcw } from "lucide-react";
import { PageHero, SectionHeader, slimPanel } from "@/components/ui/section-primitives";
import PageSeo from "@/components/PageSeo";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

type PanditLite = { id: number; verified?: boolean; city?: string };

const values = [
  { icon: Shield, title: "Authenticity", description: "Every ritual, mantra and service follows centuries-old Vedic scriptures verified by learned scholars." },
  { icon: Heart, title: "Trust", description: "Transparent pricing, verified pandits and genuine products — no shortcuts, no compromises." },
  { icon: Globe, title: "Accessibility", description: "Making sacred Vedic services available to every household across India, from metros to villages." },
  { icon: Cpu, title: "Technology", description: "Leveraging AI and modern platforms to deliver ancient wisdom in a seamless, digital-first experience." },
];

function bandUp(n: number, fallback: string): string {
  if (!n || n < 1) return fallback;
  if (n < 10) return `${n}+`;
  if (n < 100) return `${Math.floor(n / 10) * 10}+`;
  if (n < 1000) return `${Math.floor(n / 50) * 50}+`;
  return `${Math.floor(n / 1000)}k+`;
}

const trustItems = [
  { icon: UserCheck, title: "Verified Pandits", desc: "Background-checked & qualified" },
  { icon: Shield, title: "Authentic Products", desc: "Lab-tested ritual essentials" },
  { icon: CheckCircle, title: "Secure Payments", desc: "Encrypted & protected" },
  { icon: Globe, title: "Pan-India Service", desc: "Delivering to 500+ cities" },
  { icon: IndianRupee, title: "Transparent Pricing", desc: "No hidden fees, ever" },
  { icon: RotateCcw, title: "30-Day Returns", desc: "Hassle-free return policy" },
];

const company = [
  { icon: Building, title: "Registered entity", primary: "Vedic Tatva Private Limited", secondary: "Incorporated under the Companies Act" },
  { icon: MapPin, title: "Headquarters", primary: "Delhi, India", secondary: "Serving Pan-India" },
  { icon: Users, title: "Our network", primary: "500+ verified pandits & scholars", secondary: "Across 50+ cities in India" },
  { icon: Headphones, title: "Jurisdiction", primary: "Delhi High Court", secondary: "All disputes subject to Delhi jurisdiction" },
];

export default function About() {
  const primaryBtn = "inline-flex items-center justify-center gap-1.5 h-10 px-5 rounded-md text-[13px] font-semibold bg-[#6D2B35] text-[#D4AF37] hover:bg-[#5a1f29] transition-colors";
  const outlineBtn = "inline-flex items-center justify-center gap-1.5 h-10 px-5 rounded-md text-[13px] font-semibold bg-white text-[#6D2B35] border border-[#D4AF37]/30 hover:bg-[#FBF7EE] transition-colors";

  const { data: pandits } = useQuery<PanditLite[]>({
    queryKey: ["/api/pandits"],
    queryFn: () => fetch("/api/pandits").then(r => r.ok ? r.json() : []),
    staleTime: 5 * 60 * 1000,
  });

  const stats = useMemo(() => {
    const verifiedCount = (pandits || []).filter(p => p.verified !== false).length;
    const cityCount = new Set((pandits || []).map(p => (p.city || "").trim().toLowerCase()).filter(Boolean)).size;
    return [
      { value: bandUp(verifiedCount, "500+"), label: "Verified Pandits" },
      { value: bandUp(cityCount, "50+"), label: "Cities Served" },
      { value: "50+", label: "Puja Types" },
      { value: "100%", label: "Authentic Products" },
    ];
  }, [pandits]);

  return (
    <div className="w-full pb-16 bg-white">
      <PageSeo
        title="About Us | Vedic Tatva - Where Tradition Meets Technology"
        description="Learn about Vedic Tatva Private Limited — bridging ancient Vedic wisdom with modern technology. Founded in Delhi, serving 50+ cities across India."
        ogType="website"
      />
      <PageHero
        eyebrow="Our Purpose"
        title="About Vedic Tatva"
        subtitle="Heritage of Nature Wellness & Purity"
        variant="maroon"
        testId="hero-about"
      />

      <div className="container mx-auto px-4 mt-10">
        <div className="max-w-4xl mx-auto mb-12">
          <div className={`${slimPanel} p-6 md:p-8`}>
            <SectionHeader
              eyebrow="Our Mission"
              title="Sacred wisdom, accessible to all"
            />
            <p className="text-[13px] text-[#5a4a3a]/75 leading-relaxed mt-4 text-center max-w-3xl mx-auto" data-testid="text-mission-heading">
              At Vedic Tatva we are on a mission to bridge the timeless wisdom of ancient Vedic traditions with the power of modern technology. We believe sacred rituals, authentic spiritual guidance and Vedic knowledge should be accessible to every individual — regardless of where they live. From personalised puja bookings and verified pandit services to AI-powered astrology and curated spiritual products, we bring the essence of dharma to your doorstep.
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto mb-14">
          <SectionHeader
            eyebrow="Our Story"
            title="Founded in Delhi, serving Bharat"
            testIdPrefix="story"
          />
          <div className={`${slimPanel} p-6 md:p-8 mt-6 space-y-3.5 bg-[#FBF7EE]`} data-testid="text-story-heading">
            <p className="text-[13px] text-[#5a4a3a]/75 leading-relaxed">
              Founded in Delhi, Vedic Tatva Private Limited was born from a simple yet powerful vision — to make authentic Vedic spiritual services accessible to every home across India. In a world where finding a trusted pandit for a puja, getting a genuine kundli reading or sourcing quality spiritual products often feels overwhelming, we saw an opportunity to serve with sincerity and technology.
            </p>
            <p className="text-[13px] text-[#5a4a3a]/75 leading-relaxed">
              Our founders, deeply rooted in Vedic traditions and driven by a passion for innovation, assembled a team of scholars, technologists and spiritual practitioners. Together, we built a platform that honours the sanctity of every ritual while making the entire experience seamless, transparent and trustworthy.
            </p>
            <p className="text-[13px] text-[#5a4a3a]/75 leading-relaxed">
              Today, Vedic Tatva serves devotees across 50+ cities, connecting them with 500+ verified pandits and offering a comprehensive suite of spiritual services — from traditional puja bookings and sacred products to cutting-edge AI-powered astrology and personalised spiritual guidance.
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto mb-14">
          <SectionHeader
            eyebrow="A Note from the Founder"
            title="Why we built Vedic Tatva"
            testIdPrefix="founder-note"
          />
          <div className={`${slimPanel} p-6 md:p-8 mt-6 bg-[#FBF7EE]`} data-testid="card-founder-note">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 shrink-0 rounded-full bg-[#6D2B35] text-[#D4AF37] font-serif text-xl font-semibold flex items-center justify-center border border-[#D4AF37]/40" aria-hidden="true">
                VT
              </div>
              <div className="flex-1">
                <p className="text-[13px] text-[#5a4a3a]/80 leading-relaxed italic">
                  "Growing up, finding a trusted pandit for a simple Satyanarayan katha meant calling five relatives,
                  haggling over dakshina at the door, and still wondering whether the rituals were performed correctly.
                  We built Vedic Tatva to remove every one of those frictions — verified pandits, fixed and transparent
                  prices, authentic samagri at the door, and AI-powered jyotish that respects the classical texts. Sanatan
                  dharma deserves the same sincerity online that we give it in our homes."
                </p>
                <p className="mt-4 text-[12px] font-semibold text-[#6D2B35] tracking-wide" data-testid="text-founder-attribution">
                  — Founders, Vedic Tatva
                </p>
                <p className="text-[11px] text-[#5a4a3a]/60">Delhi · Established to serve every devotee, every home.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-14 max-w-5xl mx-auto">
          <SectionHeader
            eyebrow="Core Values"
            title="The principles that guide us"
            subtitle="Four ideas that shape every decision and every product we ship."
            testIdPrefix="values"
          />
          <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {values.map((value) => (
              <div
                key={value.title}
                className={`${slimPanel} p-5 text-center`}
                data-testid={`card-value-${value.title.toLowerCase()}`}
              >
                <div className="w-10 h-10 mx-auto bg-[#FBF7EE] border border-[#D4AF37]/25 rounded-md flex items-center justify-center text-[#6D2B35] mb-3">
                  <value.icon className="w-4 h-4" strokeWidth={1.8} />
                </div>
                <h3 className="text-[14px] font-serif font-semibold text-[#6D2B35] mb-1.5">{value.title}</h3>
                <p className="text-[12px] text-[#5a4a3a]/70 leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-5xl mx-auto mb-14">
          <div className="relative bg-[#6D2B35] rounded-lg border border-[#D4AF37]/40 overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent" aria-hidden="true" />
            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent" aria-hidden="true" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[#D4AF37]/20">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="bg-[#6D2B35] p-6 text-center"
                  data-testid={`stat-${stat.label.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  <div className="text-2xl md:text-3xl font-serif font-semibold text-[#D4AF37] mb-1">{stat.value}</div>
                  <div className="text-white/75 text-[12px] uppercase tracking-[0.2em] font-semibold">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Why Vedic Tatva — Built on Trust (migrated from homepage) */}
        <div className="max-w-6xl mx-auto mb-14" data-testid="section-why-vedic-tatva">
          <SectionHeader
            eyebrow="Built on Trust"
            title="Why Vedic Tatva?"
            subtitle="Sourced with care. Verified with rigor. Secured end-to-end — so you focus on what matters: your faith."
            testIdPrefix="why-vedic-tatva"
          />
          <div className="mt-7 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-px bg-[#D4AF37]/15 rounded-lg overflow-hidden border border-[#D4AF37]/15">
            {trustItems.map((item) => (
              <div
                key={item.title}
                className="bg-white px-4 py-5 flex flex-col items-start text-left hover:bg-[#FBF7EE] transition-colors"
                data-testid={`trust-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <div className="w-8 h-8 rounded-md bg-[#FBF7EE] border border-[#D4AF37]/20 flex items-center justify-center mb-2.5">
                  <item.icon className="h-4 w-4 text-[#6D2B35]" strokeWidth={1.8} />
                </div>
                <h4 className="font-semibold text-[13px] text-[#6D2B35] mb-0.5 leading-tight">{item.title}</h4>
                <p className="text-[11px] text-[#5a4a3a]/55 leading-snug">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 max-w-3xl mx-auto">
            <figure className="relative px-6 md:px-10">
              <span className="absolute left-0 top-0 font-serif text-5xl md:text-6xl text-[#D4AF37]/30 leading-none select-none" aria-hidden="true">"</span>
              <blockquote className="text-[13px] md:text-sm text-[#5a4a3a]/75 leading-relaxed italic text-center">
                At Vedic Tatva, we believe spirituality should be accessible, authentic, and trustworthy. Every pandit is personally verified, every product is ethically sourced, and every ritual is performed with the sanctity it deserves.
              </blockquote>
              <span className="absolute right-0 bottom-0 font-serif text-5xl md:text-6xl text-[#D4AF37]/30 leading-none select-none" aria-hidden="true">"</span>
              <figcaption className="flex items-center justify-center gap-2 mt-3">
                <span className="h-px w-5 bg-[#D4AF37]/40" />
                <span className="text-[10px] text-[#D4AF37] uppercase tracking-[0.3em] font-semibold">The Vedic Tatva Promise</span>
                <span className="h-px w-5 bg-[#D4AF37]/40" />
              </figcaption>
            </figure>
          </div>
        </div>

        <div className="max-w-4xl mx-auto mb-14">
          <SectionHeader
            eyebrow="Company Information"
            title="Registered & accountable"
            testIdPrefix="company"
          />
          <div className={`${slimPanel} p-6 md:p-8 mt-6`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {company.map((c) => (
                <div key={c.title} className="flex items-start gap-3 p-3 rounded-md bg-[#FBF7EE] border border-[#D4AF37]/20">
                  <div className="w-9 h-9 bg-white border border-[#D4AF37]/25 rounded-md flex items-center justify-center text-[#6D2B35] flex-shrink-0">
                    <c.icon className="w-4 h-4" strokeWidth={1.8} />
                  </div>
                  <div>
                    <h3 className="font-serif font-semibold text-[#6D2B35] text-[13px] mb-0.5">{c.title}</h3>
                    <p className="text-[12px] text-[#5a4a3a]/75">{c.primary}</p>
                    <p className="text-[11px] text-[#5a4a3a]/55 mt-0.5">{c.secondary}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={`${slimPanel} p-6 sm:p-8 max-w-4xl mx-auto text-center bg-[#FBF7EE]`}>
          <SectionHeader
            eyebrow="Get Involved"
            title="Join our mission"
            subtitle="Are you a learned pandit, astrologer or spiritual practitioner? Help us bring authentic Vedic services to millions of devotees across India."
            testIdPrefix="cta"
          />
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 mt-6">
            <Link href="/become-pandit">
              <button className={primaryBtn} data-testid="btn-become-pandit">
                Become a pandit partner <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.8} />
              </button>
            </Link>
            <Link href="/become-astrologer">
              <button className={outlineBtn} data-testid="btn-become-astrologer">
                Join as astrologer
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

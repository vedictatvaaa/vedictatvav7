import { useState, useEffect, useRef, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import PageSeo from "@/components/PageSeo";
import {
  ShieldCheck,
  Globe,
  CalendarCheck,
  Monitor,
  Upload,
  CheckCircle2,
  Quote,
  IndianRupee,
  Headphones,
  ArrowRight,
  Sparkles,
  Star,
  Users,
  Bell,
  TrendingUp,
  Wallet,
  Award,
  Compass,
  Calculator,
  Calendar as CalendarIcon,
  ScrollText,
  Heart,
  PlayCircle,
  Crown,
  Flame,
  CircleDot,
  ChevronRight,
  Zap,
  GraduationCap,
} from "lucide-react";
import PageAPlusContent from "@/components/PageAPlusContent";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { faqPage as faqPageSchema, breadcrumbList as breadcrumbListSchema, service as serviceSchema, abs } from "@/lib/seo-schemas";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const BECOME_PANDIT_FAQS = [
  { q: "Who can become a Vedic Tatva pandit?", a: "Traditional pandits and purohits trained in any recognised sampradaya (Smartha, Madhva, Shri Vaishnava, Gaudiya, Shaiva, Shakta and others) who actively perform sevas — Satyanarayan, Griha Pravesh, Rudra Abhishek, Navagraha shanti, weddings, samskaras, antyeshti and more. Both full-time professional pandits and respected community purohits are welcome to apply." },
  { q: "Is there any joining fee?", a: "No — applying and listing your profile is free for verified pandits. Any platform service fee on bookings is explained transparently during onboarding before you go live, so there are no surprises." },
  { q: "How does verification work?", a: "After you submit the form, our team contacts you (typically within a few working days) to discuss your background, sampradaya and the sevas you offer. The goal is to confirm authenticity and protect both devotees and your own reputation — not to test ritual knowledge." },
  { q: "Will I be forced to perform sevas I'm not comfortable with?", a: "Never. You list only the sevas you actively perform and feel qualified for. Devotees see exactly what you offer — and you can accept or decline any individual booking based on your sampradaya rules, availability or personal judgement." },
  { q: "How do online (virtual) sevas work?", a: "For virtual puja, the devotee joins a live video call (often with their family abroad). You perform the sankalpa with their gotra/nakshatra, conduct the puja and offer the prasad-equivalent. Many NRIs prefer this for Pitru Paksha, Shradh and occasions when they cannot travel home." },
  { q: "How is dakshina handled?", a: "Devotees pay through the platform at the time of booking. Once the seva is completed, your share is settled to you — the exact settlement schedule and platform service fee are explained transparently during onboarding before you go live, so you can decide if it works for you." },
  { q: "Can I serve devotees in languages other than Hindi?", a: "Absolutely — we encourage it. Specify the languages you serve in (Hindi, Sanskrit, Tamil, Telugu, Kannada, Malayalam, Marathi, Bengali, Gujarati, Punjabi, Odia, Assamese and others) so devotees can filter pandits by language. This is especially valued by NRI and inter-state families." },
  { q: "What support is available after I join?", a: "Onboarding help in your preferred language, assistance setting up your profile and seva list, ongoing support for booking issues, and guidance on improving your visibility. Festival weeks have extra support hours so you can focus on the sevas." },
];
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

// ──────────────────────────────────────────────────────────────────────
// Brand palette for this page — anchors on the platform's existing
// maroon/gold (so it doesn't clash with the rest of the site) but
// layers in saffron + sandalwood + warm-white for the cinematic
// "digital dharma ecosystem" mood the brief asks for.
// ──────────────────────────────────────────────────────────────────────
const C = {
  maroon: "#6D2B35",
  maroonDeep: "#4A1D24",
  saffron: "#E07A1F",
  saffronDeep: "#C56011",
  saffronLight: "#FFE4C4",
  gold: "#D4AF37",
  goldDeep: "#B8941F",
  goldLight: "#F0D77A",
  sandalwood: "#F5E6CA",
  warmWhite: "#FEFAF1",
  cream: "#FBF7EE",
  brown: "#3D2418",
  brownSoft: "#5a4a3a",
  // Indian tricolour — for the Pandit ID card
  flagSaffron: "#FF9933",
  flagSaffronDeep: "#E5751F",
  flagWhite: "#FFFBF2",
  flagGreen: "#138808",
  flagGreenDeep: "#0F6B05",
  chakraNavy: "#000080",
};

// ──────────────────────────────────────────────────────────────────────
// useCountUp — animates a number from 0 to target with ease-out cubic.
// Triggered when `start` flips true (we drive that from framer-motion's
// onViewportEnter). Pure JS, no extra deps.
// ──────────────────────────────────────────────────────────────────────
function useCountUp(target: number, duration = 1500, start = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min((t - t0) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.floor(eased * target));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, start]);
  return value;
}

// ──────────────────────────────────────────────────────────────────────
// Main page
// ──────────────────────────────────────────────────────────────────────
export default function BecomePandit() {
  const { toast } = useToast();

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    city: "",
    experience: "",
    specializations: "",
    education: "",
    languages: "",
    bio: "",
    regionalOrigin: "",
    membership: "free",
    agreeTerms: false,
  });
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const submitMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/pandit-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, photo: photoPreview }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Application Submitted",
        description: "We'll review your details and reach out within 48 hours.",
      });
      setForm({ fullName: "", phone: "", email: "", city: "", experience: "", specializations: "", education: "", languages: "", bio: "", regionalOrigin: "", membership: "free", agreeTerms: false });
      setPhotoPreview(null);
    },
    onError: () => {
      toast({
        title: "Submission Failed",
        description: "Could not submit your application. Please try again later.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName || !form.phone || !form.email || !form.city || !form.experience) {
      toast({ title: "Missing Fields", description: "Please fill all required fields.", variant: "destructive" });
      return;
    }
    if (!form.agreeTerms) {
      toast({ title: "Terms Required", description: "Please agree to the terms and conditions.", variant: "destructive" });
      return;
    }
    submitMutation.mutate();
  };

  const scrollToId = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="w-full overflow-x-hidden" style={{ background: C.warmWhite }}>
      <PageSeo
        title="Become a Verified Pandit on Vedic Tatva — Earn ₹50,000+/mo Serving Devotees Online"
        description="Join Vedic Tatva — India's most trusted digital dharma platform for Pandits. Get verified, accept bookings across India and abroad (USA, UK, Canada, Australia, Singapore, UAE), use powerful Vedic tools, and grow your spiritual practice with the dignity it deserves. Free to apply, transparent service fee, multi-language support."
        keywords="become a pandit, pandit registration, register as pandit online, verified pandit platform, hindu priest jobs, purohit registration, sanskrit pandit jobs, brahmin priest opportunity, pandit earn money online, pandit sign up, list as pandit, online puja platform for pandits, pandit work from home, NRI pandit booking, samskrit purohit jobs"
        canonical="/become-pandit"
        ogType="website"
        twitterCard="summary_large_image"
        schemas={[
          breadcrumbListSchema([
            { name: "Home", url: abs("/") },
            { name: "Become a Pandit", url: abs("/become-pandit") },
          ]),
          faqPageSchema(BECOME_PANDIT_FAQS.map(f => ({ question: f.q, answer: f.a })), "become-pandit-faq"),
          serviceSchema({
            name: "Pandit Registration & Verification on Vedic Tatva",
            description: "Free registration for traditional Vedic pandits and purohits — get verified, accept bookings across India and abroad, manage profile and seva list, receive transparent settlement.",
            url: abs("/become-pandit"),
            providerName: "Vedic Tatva",
            areaServed: ["IN", "US", "GB", "CA", "AU", "SG", "AE"],
          }),
        ]}
      />
      <nav aria-label="Breadcrumb" className="bg-[#FBF7EE] border-b border-[#D4AF37]/15">
        <ol className="container mx-auto px-4 py-2 flex items-center gap-1.5 text-[12px] text-[#5a4a3a]/75">
          <li><Link href="/" className="hover:text-[#6D2B35]" data-testid="link-breadcrumb-home">Home</Link></li>
          <li aria-hidden="true"><ChevronRight className="w-3 h-3 inline" /></li>
          <li aria-current="page" className="text-[#6D2B35] font-semibold">Become a Pandit</li>
        </ol>
      </nav>

      <Hero onApply={scrollToId("apply")} onDemo={scrollToId("demo")} />
      <LiveTrustBar />
      <WhyJoinSection />
      <MembershipReachSection onApply={scrollToId("apply")} />
      <DashboardPreviewSection />
      <JapaShowcaseSection />
      <VedicToolsSection />
      <TestimonialsSection />
      <DemoSection />
      <RegistrationSection
        form={form}
        photoPreview={photoPreview}
        onChange={handleChange}
        onPhotoChange={handlePhotoChange}
        onSubmit={handleSubmit}
        setForm={setForm}
        isPending={submitMutation.isPending}
      />
      <FinalCTA onApply={scrollToId("apply")} />

      <div className="container mx-auto px-4 py-16">
        <PageAPlusContent
          eyebrow="Why Pandits Choose Vedic Tatva"
          title="Become a Vedic Tatva Pandit — Reach Devotees Across India & Abroad"
          intro="If you are a traditional pandit ji rooted in shastra and sampradaya, Vedic Tatva is your modern outreach platform. Get verified, list your sevas, accept bookings online and serve devotees in your city as well as Hindu families abroad — without losing the dignity and authenticity of your practice."
          trustBadges={[
            { value: "Verified", label: "Profile Badge" },
            { value: "Online", label: "Bookings" },
            { value: "Pan", label: "India Reach" },
            { value: "NRI", label: "Devotees Too" },
          ]}
          benefits={[
            { icon: Globe, title: "Reach Devotees Anywhere", body: "List the sevas you perform — Satyanarayan, Griha Pravesh, Rudra Abhishek, Mundan, Namkaran, wedding, antyeshti — and become discoverable to devotees in your city as well as Hindu families across India and abroad." },
            { icon: ShieldCheck, title: "Verified Pandit Badge", body: "After our team verifies your credentials and sampradaya during onboarding, your profile receives a verified badge — helping families who don't know you personally trust your services." },
            { icon: CalendarCheck, title: "Booking Workflow in One Place", body: "Devotees enquire and book through the platform; you accept or decline based on your availability — reducing back-and-forth calls and missed bookings during festival peaks." },
            { icon: IndianRupee, title: "Devotee-Paid Bookings", body: "Devotees pay for their booking on the platform up-front. Settlement and fee structure are walked through clearly with you during onboarding before you go live." },
            { icon: Monitor, title: "Online & Offline Sevas", body: "Offer in-person sevas in your city and, where you wish, virtual puja for NRI devotees and elderly families who cannot travel — expanding your reach without leaving home." },
            { icon: Headphones, title: "Dedicated Pandit Support", body: "Onboarding and profile-setup help in Hindi or your regional language, with ongoing support that understands the rhythm of a pandit's work — not a generic call centre." },
          ]}
          steps={[
            { title: "Apply With Your Details", body: "Submit the form on this page with your name, contact, city, languages, years of practice and the sevas you perform." },
            { title: "Verification & Onboarding", body: "Our team contacts you to verify your background and sampradaya, walks through how the platform works, and helps you set up your public profile and seva list." },
            { title: "Go Live & Receive Enquiries", body: "Once your profile is approved, devotees can find you, view your sevas and request bookings. You confirm or decline based on your availability." },
            { title: "Perform With Sanctity", body: "Conduct the seva as you normally would. Booking, payment and follow-up are handled through the platform — you focus on the ritual." },
          ]}
          faqs={BECOME_PANDIT_FAQS}
          keywordsBlurb="Vedic Tatva welcomes traditional pandits and purohits to list the sevas they perform — including Satyanarayan Katha, Griha Pravesh, Rudra Abhishek, Mahamrityunjaya Jaap, Navagraha Shanti, Mundan, Namkaran, Annaprashan, Upanayana, Hindu wedding (vivaha), Antyeshti, Pitru Paksha Shradh and Tarpan. Pandits across major Indian cities (Delhi, Mumbai, Bangalore, Hyderabad, Chennai, Kolkata, Pune, Ahmedabad, Jaipur, Varanasi, Lucknow) and serving Hindu families abroad (USA, UK, Canada, Australia, Singapore, UAE) are welcome to apply. Verified pandit badge, multi-language support (Hindi, Sanskrit, Tamil, Telugu, Kannada, Malayalam, Marathi, Bengali, Gujarati and more), and a transparent booking workflow."
        />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// SECTION: Hero — cinematic 2-col with animated dashboard mockup
// ══════════════════════════════════════════════════════════════════════
function Hero({ onApply, onDemo }: { onApply: (e: React.MouseEvent) => void; onDemo: (e: React.MouseEvent) => void }) {
  return (
    <section
      className="relative overflow-hidden text-white"
      style={{
        background: `radial-gradient(ellipse at 70% 20%, ${C.saffronDeep}33 0%, transparent 50%), radial-gradient(ellipse at 20% 80%, ${C.gold}22 0%, transparent 50%), linear-gradient(135deg, ${C.maroonDeep} 0%, ${C.maroon} 50%, ${C.brown} 100%)`,
      }}
    >
      {/* sacred geometry pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.05] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Ccircle cx='100' cy='100' r='80' stroke='%23D4AF37' stroke-width='0.5' fill='none'/%3E%3Ccircle cx='100' cy='100' r='60' stroke='%23D4AF37' stroke-width='0.5' fill='none'/%3E%3Ccircle cx='100' cy='100' r='40' stroke='%23D4AF37' stroke-width='0.5' fill='none'/%3E%3Ctext x='90' y='110' font-family='serif' font-size='32' fill='%23D4AF37'%3E%E0%A5%90%3C/text%3E%3C/svg%3E")`,
          backgroundSize: "200px 200px",
        }}
      />
      {/* glowing accents */}
      <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full blur-3xl pointer-events-none" style={{ background: `${C.saffron}33` }} />
      <div className="absolute -bottom-40 -left-40 w-[28rem] h-[28rem] rounded-full blur-3xl pointer-events-none" style={{ background: `${C.gold}22` }} />

      <div className="container mx-auto px-4 relative z-10 py-16 md:py-24 lg:py-28">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          {/* LEFT — title + tagline + CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-7"
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="h-px w-10" style={{ background: C.gold }} />
              <span className="text-[11px] uppercase tracking-[0.32em] font-medium" style={{ color: C.gold }}>
                A Digital Dharma Movement
              </span>
            </div>

            <h1
              className="font-serif leading-[1.05] mb-5 text-white"
              style={{ fontSize: "clamp(2.25rem, 5vw, 4.25rem)" }}
              data-testid="heading-become-pandit"
            >
              Become a <span style={{ color: C.gold }}>Verified</span>
              <br />
              Vedic Tatva Pandit
            </h1>

            <p
              className="font-serif italic mb-6 text-white/95"
              style={{
                fontSize: "clamp(1.1rem, 2vw, 1.55rem)",
                fontFamily: '"Noto Serif Devanagari", "Tiro Devanagari Sanskrit", "Playfair Display", serif',
              }}
              data-testid="text-tagline-sanskrit"
            >
              सेवा को सम्मान, पंडितों को पहचान
            </p>

            <p className="text-white/75 text-base md:text-lg max-w-xl leading-relaxed mb-8 font-light">
              Get recognized, receive bookings, access powerful Vedic tools, and expand your spiritual reach across India and beyond — without losing the sanctity of your practice.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <a href="#apply" onClick={onApply} data-testid="link-hero-apply">
                <Button
                  size="lg"
                  className="rounded-full px-8 h-12 text-base font-semibold shadow-2xl"
                  style={{
                    background: `linear-gradient(135deg, ${C.gold} 0%, ${C.saffron} 100%)`,
                    color: C.brown,
                  }}
                >
                  Register as Pandit
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </a>
              <a href="#demo" onClick={onDemo} data-testid="link-hero-demo">
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full px-8 h-12 text-base bg-white/5 border-white/40 text-white hover:bg-white/10 backdrop-blur-sm"
                >
                  <PlayCircle className="w-4 h-4 mr-2" />
                  Watch Demo
                </Button>
              </a>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-white/60">
              <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" style={{ color: C.gold }} /> Free to join</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" style={{ color: C.gold }} /> Verified in 48 hrs</span>
              <span className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" style={{ color: C.gold }} /> Pan-India + NRI reach</span>
            </div>
          </motion.div>

          {/* RIGHT — animated dashboard mockup */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="lg:col-span-5"
          >
            <HeroMockup />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ──────────────────────────────────────────────────────────────────────
// HeroMockup — layered "device" frame with mini cards, inspired by
// SaaS landing pages but tuned for the dharma palette. Pure CSS/SVG —
// no images needed, scales perfectly on every viewport.
// ──────────────────────────────────────────────────────────────────────
function HeroMockup() {
  return (
    <div className="relative mx-auto" style={{ maxWidth: 460 }}>
      {/* gold halo behind */}
      <div
        className="absolute -inset-6 rounded-[2rem] blur-2xl opacity-60"
        style={{ background: `radial-gradient(ellipse, ${C.gold}40 0%, transparent 70%)` }}
      />

      {/* device frame */}
      <div
        className="relative rounded-2xl p-5 shadow-2xl"
        style={{
          background: `linear-gradient(135deg, ${C.warmWhite} 0%, ${C.sandalwood} 100%)`,
          border: `1px solid ${C.gold}55`,
        }}
      >
        {/* device top bar */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: C.maroon }}>
              <span className="text-[#D4AF37] text-xs font-serif">VT</span>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider" style={{ color: C.brownSoft }}>Pandit Dashboard</div>
              <div className="text-xs font-semibold" style={{ color: C.brown }}>Pt. Ramesh Sharma</div>
            </div>
          </div>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold" style={{ background: `${C.gold}22`, color: C.goldDeep }}>
            <ShieldCheck className="w-3 h-3" />
            VERIFIED
          </div>
        </div>

        {/* booking notification — animated entrance loop */}
        <motion.div
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="rounded-xl p-3 mb-3 flex items-center gap-3"
          style={{
            background: `linear-gradient(135deg, ${C.saffron}15 0%, ${C.gold}15 100%)`,
            border: `1px solid ${C.saffron}40`,
          }}
        >
          <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: C.saffron, color: "white" }}>
            <Bell className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold truncate" style={{ color: C.brown }}>New Booking · Satyanarayan Katha</div>
            <div className="text-[10px]" style={{ color: C.brownSoft }}>Sharma Family · Mumbai · Sun 10 AM</div>
          </div>
          <div className="text-[10px] font-bold whitespace-nowrap" style={{ color: C.maroon }}>₹5,100</div>
        </motion.div>

        {/* earnings + japa side by side */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          {/* earnings */}
          <div className="rounded-xl p-3" style={{ background: "white", border: `1px solid ${C.gold}33` }}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] uppercase tracking-wider" style={{ color: C.brownSoft }}>This Month</span>
              <TrendingUp className="w-3 h-3" style={{ color: C.gold }} />
            </div>
            <div className="text-lg font-serif font-bold" style={{ color: C.maroon }}>₹68,400</div>
            <Sparkline />
          </div>
          {/* japa */}
          <div className="rounded-xl p-3" style={{ background: "white", border: `1px solid ${C.gold}33` }}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] uppercase tracking-wider" style={{ color: C.brownSoft }}>Japa Today</span>
              <Heart className="w-3 h-3" style={{ color: C.saffron }} />
            </div>
            <div className="text-lg font-serif font-bold" style={{ color: C.maroon }}>540 / 1,008</div>
            <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: `${C.gold}22` }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "53%" }}
                transition={{ duration: 1.4, delay: 0.6 }}
                className="h-full"
                style={{ background: `linear-gradient(90deg, ${C.gold} 0%, ${C.saffron} 100%)` }}
              />
            </div>
          </div>
        </div>

        {/* upcoming muhurat */}
        <div className="rounded-xl p-3" style={{ background: `${C.maroon}08`, border: `1px solid ${C.maroon}15` }}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: C.maroon }}>Today's Auspicious Muhurat</span>
            <CalendarIcon className="w-3.5 h-3.5" style={{ color: C.maroon }} />
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { label: "Brahma", time: "4:32 AM" },
              { label: "Abhijit", time: "11:48 AM" },
              { label: "Vijaya", time: "2:21 PM" },
            ].map((m) => (
              <div key={m.label} className="text-center py-1.5 rounded-md" style={{ background: "white" }}>
                <div className="text-[8px] uppercase tracking-wider" style={{ color: C.brownSoft }}>{m.label}</div>
                <div className="text-[10px] font-semibold" style={{ color: C.brown }}>{m.time}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* floating saffron-dominant ID card — mini, with tricolour accents */}
      <motion.div
        initial={{ opacity: 0, rotate: -8, y: 20 }}
        animate={{ opacity: 1, rotate: -6, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="absolute -bottom-8 -left-6 w-44 rounded-xl shadow-2xl hidden sm:block"
        style={{
          padding: 2,
          background: `linear-gradient(135deg, ${C.gold} 0%, ${C.goldDeep} 50%, ${C.gold} 100%)`,
        }}
      >
        <div
          className="relative rounded-[10px] overflow-hidden p-2.5"
          style={{
            background: `linear-gradient(135deg, ${C.flagSaffron} 0%, ${C.saffronDeep} 100%)`,
          }}
        >
          {/* navy chakra watermark */}
          <div className="absolute -right-2 -bottom-2 opacity-15 pointer-events-none">
            <AshokaChakra size={56} color={C.chakraNavy} />
          </div>
          {/* slim green ribbon */}
          <div className="absolute top-1 left-2 right-2 h-px" style={{ background: `linear-gradient(90deg, transparent, ${C.flagGreen}, transparent)` }} />
          <div className="relative">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[8px] uppercase tracking-[0.2em] font-bold" style={{ color: C.gold }}>Pandit ID</span>
              <ShieldCheck className="w-3 h-3" style={{ color: C.gold }} />
            </div>
            {/* ivory inset */}
            <div className="rounded-md px-2 py-1 flex items-center gap-1.5" style={{ background: C.flagWhite, border: `1px solid ${C.gold}80` }}>
              <AshokaChakra size={16} color={C.chakraNavy} />
              <div className="min-w-0">
                <div className="text-[10px] font-serif font-bold truncate" style={{ color: C.brown }}>Pt. R. Sharma</div>
                <div className="text-[8px] truncate" style={{ color: C.flagSaffronDeep }}>Delhi · Smartha</div>
              </div>
            </div>
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-[8px] font-mono font-bold text-white">VT-2026-1842</span>
              <span className="text-[7px] uppercase tracking-wider px-1 rounded" style={{ background: C.flagGreen, color: C.flagWhite }}>Verified</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// Tiny SVG sparkline for the earnings tile.
function Sparkline() {
  const pts = [4, 7, 5, 9, 6, 11, 8, 14, 12, 18];
  const w = 80, h = 18, max = Math.max(...pts), min = Math.min(...pts);
  const path = pts
    .map((v, i) => {
      const x = (i / (pts.length - 1)) * w;
      const y = h - ((v - min) / (max - min || 1)) * h;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-4 mt-1.5">
      <defs>
        <linearGradient id="sparkGrad" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor={C.gold} />
          <stop offset="100%" stopColor={C.saffron} />
        </linearGradient>
      </defs>
      <path d={path} fill="none" stroke="url(#sparkGrad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ══════════════════════════════════════════════════════════════════════
// SECTION: LiveTrustBar — animated counters
// ══════════════════════════════════════════════════════════════════════
function LiveTrustBar() {
  const [start, setStart] = useState(false);
  const stats = [
    { target: 500, suffix: "+", label: "Verified Pandits", icon: Users },
    { target: 12500, suffix: "+", label: "Bookings Completed", icon: CalendarCheck },
    { target: 120, suffix: "+", label: "Cities Active", icon: Globe },
    { target: 4200000, suffix: "+", label: "Japa Counts", icon: CircleDot },
  ];
  return (
    <motion.section
      onViewportEnter={() => setStart(true)}
      viewport={{ once: true, amount: 0.4 }}
      className="border-y"
      style={{ background: C.cream, borderColor: `${C.maroon}15` }}
    >
      <div className="container mx-auto px-4 py-8 md:py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-4">
          {stats.map((s) => (
            <Counter key={s.label} {...s} start={start} />
          ))}
        </div>
      </div>
    </motion.section>
  );
}

function Counter({ target, suffix, label, icon: Icon, start }: { target: number; suffix: string; label: string; icon: React.ElementType; start: boolean }) {
  const value = useCountUp(target, 1600, start);
  const formatted = value >= 1000 ? value.toLocaleString("en-IN") : String(value);
  return (
    <div className="text-center" data-testid={`counter-${label.toLowerCase().replace(/\s+/g, "-")}`}>
      <div className="inline-flex items-center justify-center w-10 h-10 rounded-full mb-2" style={{ background: `${C.gold}18`, color: C.maroon }}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="text-2xl md:text-3xl font-serif font-bold" style={{ color: C.maroon }}>
        {formatted}
        <span style={{ color: C.gold }}>{suffix}</span>
      </div>
      <div className="text-[11px] uppercase tracking-wider mt-1" style={{ color: C.brownSoft }}>{label}</div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// SECTION: Why Join — 8 cards
// ══════════════════════════════════════════════════════════════════════
function WhyJoinSection() {
  const items = [
    { icon: ShieldCheck, title: "Verified Pandit Identity", desc: "Government-style verified badge devotees can trust" },
    { icon: CalendarCheck, title: "Daily Booking Opportunities", desc: "Fresh enquiries from devotees in your city and beyond" },
    { icon: Sparkles, title: "Free Vedic Tools", desc: "Muhurat finder, Panchang, Sankalp generator and more" },
    { icon: Wallet, title: "Affiliate Earnings", desc: "Earn commission on every devotee you bring to the platform" },
    { icon: Heart, title: "Digital Japa Counter", desc: "Track jaap, sankalpa and daily sadhana with one tap" },
    { icon: Monitor, title: "Online Puja Support", desc: "Conduct virtual pujas for NRI devotees with ease" },
    { icon: Flame, title: "Festival Visibility", desc: "Featured placement during Navratri, Shradh, Diwali and more" },
    { icon: Globe, title: "National + NRI Reach", desc: "Be discoverable to families across India and abroad" },
  ];
  return (
    <section className="py-16 md:py-24 container mx-auto px-4">
      <SectionEyebrow>Why Pandits Join</SectionEyebrow>
      <SectionTitle>Everything a modern Pandit needs.<br className="hidden sm:block" /> Without losing tradition.</SectionTitle>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 mt-12 max-w-6xl mx-auto">
        {items.map((b, i) => (
          <motion.div
            key={b.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ delay: (i % 4) * 0.06, duration: 0.5 }}
          >
            <Card
              className="h-full hover-elevate text-center transition-all"
              style={{ background: "white", border: `1px solid ${C.gold}25` }}
              data-testid={`card-benefit-${i}`}
            >
              <CardContent className="pt-7 pb-6 px-5">
                <div
                  className="w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-4"
                  style={{
                    background: `linear-gradient(135deg, ${C.maroon}10 0%, ${C.gold}18 100%)`,
                    border: `1px solid ${C.gold}40`,
                    color: C.maroon,
                  }}
                >
                  <b.icon className="w-6 h-6" />
                </div>
                <h3 className="text-base font-serif mb-1.5" style={{ color: C.maroon }}>{b.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: C.brownSoft }}>{b.desc}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// ══════════════════════════════════════════════════════════════════════
// SECTION: Membership Reach — Free → Silver → Gold → Guru Elite
// ══════════════════════════════════════════════════════════════════════
function MembershipReachSection({ onApply }: { onApply: (e: React.MouseEvent) => void }) {
  const tiers = [
    {
      key: "free",
      name: "Free",
      reach: "Local visibility",
      desc: "Your profile appears to devotees in your immediate locality.",
      icon: CircleDot,
      width: "25%",
    },
    {
      key: "silver",
      name: "Silver",
      reach: "Entire city visibility",
      desc: "Featured to every devotee searching across your city.",
      icon: Award,
      width: "50%",
    },
    {
      key: "gold",
      name: "Gold",
      reach: "Entire state visibility",
      desc: "Discoverable to devotees across your full state — festival weeks included.",
      icon: Crown,
      width: "75%",
    },
    {
      key: "elite",
      name: "Guru Elite",
      reach: "National + International visibility",
      desc: "Reach Hindu families across India and abroad. Premium festival placement.",
      icon: Sparkles,
      width: "100%",
      highlight: true,
    },
  ];
  return (
    <section
      className="py-16 md:py-24"
      style={{ background: `linear-gradient(180deg, ${C.warmWhite} 0%, ${C.cream} 100%)` }}
    >
      <div className="container mx-auto px-4">
        <SectionEyebrow>Expand Your Spiritual Reach</SectionEyebrow>
        <SectionTitle>From your gali to the global Hindu family</SectionTitle>
        <p className="text-center max-w-2xl mx-auto mt-3 text-sm md:text-base" style={{ color: C.brownSoft }}>
          As you grow, your visibility grows. Every tier widens the circle of devotees who can find you.
        </p>

        <div className="max-w-3xl mx-auto mt-12 space-y-4">
          {tiers.map((t, i) => (
            <motion.div
              key={t.key}
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              data-testid={`tier-${t.key}`}
            >
              <div
                className="relative overflow-hidden rounded-2xl p-5 md:p-6"
                style={{
                  background: t.highlight
                    ? `linear-gradient(135deg, ${C.maroonDeep} 0%, ${C.maroon} 100%)`
                    : "white",
                  border: t.highlight ? `1px solid ${C.gold}` : `1px solid ${C.gold}30`,
                  color: t.highlight ? "white" : C.brown,
                }}
              >
                {/* reach progress bar background */}
                <div className="absolute bottom-0 left-0 right-0 h-1.5" style={{ background: `${C.gold}15` }}>
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: t.width }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, delay: 0.3 + i * 0.1 }}
                    className="h-full"
                    style={{ background: `linear-gradient(90deg, ${C.gold} 0%, ${C.saffron} 100%)` }}
                  />
                </div>

                <div className="flex items-center gap-4 md:gap-6">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center shrink-0"
                    style={{
                      background: t.highlight ? `${C.gold}25` : `${C.maroon}10`,
                      color: t.highlight ? C.gold : C.maroon,
                      border: `1px solid ${t.highlight ? C.gold : C.gold + "40"}`,
                    }}
                  >
                    <t.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-3 flex-wrap">
                      <h3 className="text-xl font-serif" style={{ color: t.highlight ? C.gold : C.maroon }}>{t.name}</h3>
                      <span className="text-sm font-medium" style={{ color: t.highlight ? "white" : C.brown }}>{t.reach}</span>
                    </div>
                    <p className="text-sm mt-1 leading-relaxed" style={{ color: t.highlight ? "rgba(255,255,255,0.75)" : C.brownSoft }}>{t.desc}</p>
                  </div>
                  {t.highlight && (
                    <div className="hidden md:flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider" style={{ background: C.gold, color: C.maroonDeep }}>
                      Most Loved
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="text-center mt-10">
          <a href="#apply" onClick={onApply}>
            <Button
              size="lg"
              className="rounded-full px-8 h-12 font-semibold"
              style={{ background: C.maroon, color: "white" }}
              data-testid="btn-tiers-apply"
            >
              Choose Your Tier
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </a>
          <p className="text-xs mt-3" style={{ color: C.brownSoft }}>You can start free and upgrade anytime from your dashboard.</p>
        </div>
      </div>
    </section>
  );
}

// ══════════════════════════════════════════════════════════════════════
// SECTION: Pandit Dashboard preview — glassmorphism
// ══════════════════════════════════════════════════════════════════════
function DashboardPreviewSection() {
  const tiles = [
    { icon: CalendarCheck, label: "Bookings", value: "23", sub: "this month" },
    { icon: Wallet, label: "Earnings", value: "₹68,400", sub: "settled" },
    { icon: Award, label: "Dharma Score", value: "94", sub: "out of 100" },
    { icon: Users, label: "Affiliate", value: "₹5,200", sub: "12 referrals" },
    { icon: Bell, label: "Notifications", value: "4", sub: "new today" },
    { icon: Compass, label: "Tools Used", value: "7", sub: "this week" },
  ];
  return (
    <section
      className="py-16 md:py-24 relative overflow-hidden"
      style={{ background: `linear-gradient(135deg, ${C.maroonDeep} 0%, ${C.maroon} 100%)` }}
    >
      <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full blur-3xl" style={{ background: `${C.saffron}25` }} />
      <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full blur-3xl" style={{ background: `${C.gold}20` }} />

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="h-px w-10" style={{ background: C.gold }} />
            <span className="text-[11px] uppercase tracking-[0.32em] font-medium" style={{ color: C.gold }}>Your Pandit Workspace</span>
            <div className="h-px w-10" style={{ background: C.gold }} />
          </div>
          <h2 className="text-3xl md:text-4xl font-serif text-white">A dashboard built for your seva</h2>
          <p className="text-white/70 max-w-2xl mx-auto mt-3 text-sm md:text-base">Every tool, every booking, every rupee — in one elegant place.</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 max-w-5xl mx-auto">
          {tiles.map((t, i) => (
            <motion.div
              key={t.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="rounded-2xl p-5 backdrop-blur-md"
              style={{
                background: "rgba(255, 255, 255, 0.06)",
                border: "1px solid rgba(212, 175, 55, 0.25)",
              }}
              data-testid={`tile-dash-${t.label.toLowerCase()}`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] uppercase tracking-wider text-white/60">{t.label}</span>
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: `${C.gold}20`, color: C.gold }}>
                  <t.icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl md:text-3xl font-serif font-bold text-white">{t.value}</div>
              <div className="text-xs text-white/50 mt-0.5">{t.sub}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ══════════════════════════════════════════════════════════════════════
// SECTION: Japa Counter showcase
// ══════════════════════════════════════════════════════════════════════
function JapaShowcaseSection() {
  const features = ["Vibration feedback", "Pause / resume", "Group chanting", "Jaap certificates", "Daily streaks", "Sankalpa flow"];
  return (
    <section className="py-16 md:py-24 container mx-auto px-4">
      <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center max-w-6xl mx-auto">
        {/* visual */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative order-2 lg:order-1"
        >
          <MalaVisual />
        </motion.div>

        {/* text */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="order-1 lg:order-2"
        >
          <SectionEyebrow align="left">Digital Japa Counter</SectionEyebrow>
          <h2 className="text-3xl md:text-4xl font-serif mt-2 mb-4" style={{ color: C.maroon }}>
            Your mala, reimagined for the modern devotee
          </h2>
          <p className="text-base leading-relaxed mb-6" style={{ color: C.brownSoft }}>
            Track jaap with a single tap. Set sankalpa with gotra and nakshatra. Build daily streaks. Issue beautiful jaap certificates to devotees after group sadhana — all from one elegant interface devotees love.
          </p>
          <div className="grid grid-cols-2 gap-2 mb-6">
            {features.map((f) => (
              <div key={f} className="flex items-center gap-2 text-sm" style={{ color: C.brown }}>
                <CheckCircle2 className="w-4 h-4" style={{ color: C.gold }} />
                <span>{f}</span>
              </div>
            ))}
          </div>
          <Link href="/japa" data-testid="link-try-japa">
            <Button
              size="lg"
              className="rounded-full px-7"
              style={{ background: C.maroon, color: "white" }}
            >
              Try Japa Counter
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

function MalaVisual() {
  // 24 beads in a circle + glowing center
  const beads = Array.from({ length: 24 }, (_, i) => i);
  return (
    <div className="relative mx-auto" style={{ width: 320, height: 320, maxWidth: "100%" }}>
      {/* outer halo */}
      <div
        className="absolute inset-0 rounded-full blur-3xl opacity-40"
        style={{ background: `radial-gradient(circle, ${C.gold}, transparent 70%)` }}
      />

      {/* mala beads */}
      <svg viewBox="0 0 320 320" className="absolute inset-0 w-full h-full">
        <defs>
          <radialGradient id="beadGrad">
            <stop offset="0%" stopColor={C.gold} />
            <stop offset="100%" stopColor={C.saffronDeep} />
          </radialGradient>
        </defs>
        {beads.map((i) => {
          const a = (i / beads.length) * Math.PI * 2 - Math.PI / 2;
          const cx = 160 + Math.cos(a) * 130;
          const cy = 160 + Math.sin(a) * 130;
          return (
            <motion.circle
              key={i}
              cx={cx}
              cy={cy}
              r={9}
              fill="url(#beadGrad)"
              initial={{ opacity: 0.3, r: 7 }}
              animate={{ opacity: [0.3, 1, 0.3], r: [7, 10, 7] }}
              transition={{ duration: 2.4, repeat: Infinity, delay: (i / beads.length) * 2.4 }}
            />
          );
        })}
      </svg>

      {/* center counter */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="w-44 h-44 rounded-full flex flex-col items-center justify-center text-center shadow-2xl"
          style={{
            background: `radial-gradient(circle at 30% 30%, ${C.maroonDeep}, ${C.maroon})`,
            border: `2px solid ${C.gold}`,
          }}
        >
          <div className="text-[10px] uppercase tracking-[0.25em]" style={{ color: C.gold }}>Today's Jaap</div>
          <div className="text-4xl font-serif text-white mt-1">540</div>
          <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.6)" }}>of 1,008</div>
          <div className="mt-3 px-3 py-1 rounded-full text-[10px] font-semibold" style={{ background: `${C.gold}25`, color: C.gold }}>
            Streak · 27 days
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// SECTION: Vedic Tools grid
// ══════════════════════════════════════════════════════════════════════
function VedicToolsSection() {
  const tools = [
    { icon: CalendarIcon, name: "Muhurat Finder", desc: "Auspicious times by date and city", href: "/muhurat-finder" },
    { icon: ScrollText, name: "Panchang Dashboard", desc: "Tithi, nakshatra, yoga, karana — daily", href: "/panchang-calendar" },
    { icon: Compass, name: "Vastu Tool", desc: "Direction analysis for puja and home", href: "/vastu-compass" },
    { icon: Heart, name: "Kundali Matching", desc: "Guna milan and dosha check", href: "/astrology" },
    { icon: GraduationCap, name: "Sankalp Generator", desc: "Custom sankalpa with gotra and nakshatra", href: "/japa" },
    { icon: Calculator, name: "Dosha Calculator", desc: "Identify and remedy doshas", href: "/astrology" },
    { icon: Sparkles, name: "Samagri Calculator", desc: "Auto-list puja samagri by ritual", href: "/spiritual-essentials" },
  ];
  return (
    <section className="py-16 md:py-24" style={{ background: C.cream }}>
      <div className="container mx-auto px-4">
        <SectionEyebrow>Professional Spiritual Utilities</SectionEyebrow>
        <SectionTitle>Vedic tools that work as hard as you do</SectionTitle>
        <p className="text-center max-w-2xl mx-auto mt-3 text-sm md:text-base" style={{ color: C.brownSoft }}>
          Free with every Pandit profile. Use them in your seva or share with devotees.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 mt-12 max-w-5xl mx-auto">
          {tools.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: (i % 4) * 0.05 }}
            >
              <Link href={t.href} data-testid={`tool-${t.name.toLowerCase().replace(/\s+/g, "-")}`}>
                <Card
                  className="h-full hover-elevate cursor-pointer transition-all"
                  style={{ background: "white", border: `1px solid ${C.gold}25` }}
                >
                  <CardContent className="p-5">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                      style={{
                        background: `linear-gradient(135deg, ${C.saffron}15 0%, ${C.gold}20 100%)`,
                        color: C.maroon,
                      }}
                    >
                      <t.icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-semibold font-serif mb-1" style={{ color: C.maroon }}>{t.name}</h3>
                    <p className="text-xs leading-relaxed" style={{ color: C.brownSoft }}>{t.desc}</p>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ══════════════════════════════════════════════════════════════════════
// SECTION: Testimonials
// ══════════════════════════════════════════════════════════════════════
function TestimonialsSection() {
  const items = [
    {
      quote: "For the first time, I feel digitally respected as a Pandit. The verified badge changed how new devotees treat me.",
      name: "Pandit Ramesh Sharma",
      meta: "Delhi · 15 years · Smartha",
    },
    {
      quote: "Three online pujas in a week from NRI families I would never have reached. The platform is built with understanding of our rhythm.",
      name: "Pandit Vinod Mishra",
      meta: "Varanasi · 22 years · Shaiva",
    },
    {
      quote: "Bookings are organised, devotees pay upfront, and I focus only on the seva. The dignity I always wanted.",
      name: "Acharya Subramaniam",
      meta: "Chennai · 18 years · Shri Vaishnava",
    },
  ];
  return (
    <section className="py-16 md:py-24 container mx-auto px-4">
      <SectionEyebrow>The Pandit Voice</SectionEyebrow>
      <SectionTitle>What our pandit-jis are saying</SectionTitle>
      <div className="grid md:grid-cols-3 gap-5 mt-12 max-w-6xl mx-auto">
        {items.map((t, i) => (
          <motion.div
            key={t.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="h-full" style={{ background: "white", border: `1px solid ${C.gold}25` }} data-testid={`testimonial-${i}`}>
              <CardContent className="p-7">
                <Quote className="w-7 h-7 mb-3" style={{ color: C.gold }} />
                <blockquote className="font-serif italic text-base leading-relaxed mb-5" style={{ color: C.maroon }}>
                  {t.quote}
                </blockquote>
                <div className="flex items-center gap-1 mb-2">
                  {[...Array(5)].map((_, idx) => (
                    <Star key={idx} className="w-3.5 h-3.5 fill-current" style={{ color: C.gold }} />
                  ))}
                </div>
                <div className="text-sm font-semibold" style={{ color: C.brown }}>{t.name}</div>
                <div className="text-xs" style={{ color: C.brownSoft }}>{t.meta}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// ══════════════════════════════════════════════════════════════════════
// SECTION: Demo placeholder
// ══════════════════════════════════════════════════════════════════════
function DemoSection() {
  return (
    <section
      id="demo"
      className="py-16 md:py-24 scroll-mt-20"
      style={{ background: `linear-gradient(180deg, ${C.cream} 0%, ${C.warmWhite} 100%)` }}
    >
      <div className="container mx-auto px-4">
        <SectionEyebrow>Watch How It Works</SectionEyebrow>
        <SectionTitle>2 minutes. Everything you'll have access to.</SectionTitle>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto mt-12"
        >
          <div
            className="relative aspect-video rounded-2xl overflow-hidden cursor-pointer group shadow-2xl"
            style={{
              background: `linear-gradient(135deg, ${C.maroonDeep} 0%, ${C.maroon} 100%)`,
              border: `1px solid ${C.gold}40`,
            }}
            data-testid="demo-video-placeholder"
          >
            {/* faux dashboard glimpse */}
            <div className="absolute inset-6 rounded-xl backdrop-blur-md flex items-center justify-center" style={{ background: "rgba(255,255,255,0.05)" }}>
              <div className="text-center">
                <div
                  className="w-20 h-20 mx-auto rounded-full flex items-center justify-center transition-transform group-hover:scale-110"
                  style={{
                    background: `radial-gradient(circle at 35% 35%, ${C.gold}, ${C.saffronDeep})`,
                    boxShadow: `0 20px 50px ${C.gold}66`,
                  }}
                >
                  <PlayCircle className="w-12 h-12 text-white" />
                </div>
                <div className="text-white text-sm mt-5 font-semibold">Pandit Dashboard Walkthrough</div>
                <div className="text-white/60 text-xs mt-1">Bookings · Earnings · Tools · Online Puja</div>
              </div>
            </div>
            {/* corner timestamp */}
            <div className="absolute bottom-4 right-4 px-2 py-0.5 rounded text-[10px] font-mono" style={{ background: "rgba(0,0,0,0.5)", color: "white" }}>
              2:14
            </div>
          </div>
          <p className="text-center text-xs mt-4" style={{ color: C.brownSoft }}>
            Demo video coming soon — meanwhile, tap "Register as Pandit" to get a live walkthrough during onboarding.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

// ══════════════════════════════════════════════════════════════════════
// SECTION: Registration with LIVE PANDIT CARD preview
// ══════════════════════════════════════════════════════════════════════
type FormState = {
  fullName: string; phone: string; email: string; city: string; experience: string;
  specializations: string; education: string; languages: string; bio: string;
  regionalOrigin: string; membership: string; agreeTerms: boolean;
};

function RegistrationSection({
  form, photoPreview, onChange, onPhotoChange, onSubmit, setForm, isPending,
}: {
  form: FormState;
  photoPreview: string | null;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onPhotoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  isPending: boolean;
}) {
  return (
    <section
      id="apply"
      className="py-16 md:py-24 scroll-mt-20"
      style={{ background: `linear-gradient(180deg, ${C.warmWhite} 0%, ${C.cream} 100%)` }}
    >
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <SectionEyebrow>The Application</SectionEyebrow>
          <SectionTitle>Take three minutes. Begin a movement.</SectionTitle>
          <p className="text-sm md:text-base mt-3 max-w-xl mx-auto" style={{ color: C.brownSoft }}>
            Fill in your details and watch your Pandit ID card come alive in real-time.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-8 lg:gap-12 max-w-6xl mx-auto items-start">
          {/* Live Pandit ID Card preview — appears FIRST on mobile so devotees see the live preview while typing; sticky on desktop in 2nd column */}
          <div className="lg:col-span-2 lg:order-2 lg:sticky lg:top-24 order-1" data-testid="live-pandit-card-wrap">
            <div className="text-xs uppercase tracking-wider mb-3 text-center" style={{ color: C.brownSoft }}>
              <Sparkles className="inline w-3.5 h-3.5 mr-1" style={{ color: C.gold }} />
              Your Pandit ID — Live Preview
            </div>
            <LivePanditCard form={form} photoPreview={photoPreview} />
            <p className="text-center text-xs mt-4" style={{ color: C.brownSoft }}>
              This is a preview of your verified card. The actual card is issued after onboarding.
            </p>
          </div>

          {/* Form — 3 cols */}
          <Card className="lg:col-span-3 lg:order-1 order-2 shadow-xl" style={{ background: "white", border: `1px solid ${C.gold}30` }}>
            <CardContent className="p-6 md:p-8">
              <form onSubmit={onSubmit} className="space-y-7">
                <FieldGroup index={1} title="Personal Details">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Full Name *" id="fullName">
                      <Input id="fullName" name="fullName" value={form.fullName} onChange={onChange} placeholder="Pandit Ramesh Sharma" required data-testid="input-fullname" style={{ borderColor: `${C.maroon}25` }} />
                    </Field>
                    <Field label="Phone *" id="phone">
                      <Input id="phone" name="phone" value={form.phone} onChange={onChange} placeholder="+91 98765 43210" required data-testid="input-phone" style={{ borderColor: `${C.maroon}25` }} />
                    </Field>
                    <Field label="Email *" id="email">
                      <Input id="email" name="email" type="email" value={form.email} onChange={onChange} placeholder="pandit@example.com" required data-testid="input-email" style={{ borderColor: `${C.maroon}25` }} />
                    </Field>
                    <Field label="City *" id="city">
                      <Input id="city" name="city" value={form.city} onChange={onChange} placeholder="Delhi, Mumbai..." required data-testid="input-city" style={{ borderColor: `${C.maroon}25` }} />
                    </Field>
                  </div>
                </FieldGroup>

                <FieldGroup index={2} title="Practice & Tradition">
                  <div className="space-y-4">
                    <Field label="Regional Tradition" id="regionalOrigin">
                      <select
                        id="regionalOrigin"
                        name="regionalOrigin"
                        value={form.regionalOrigin}
                        onChange={(e) => setForm((p) => ({ ...p, regionalOrigin: e.target.value }))}
                        className="w-full h-10 rounded-md px-3 text-sm bg-white"
                        style={{ border: `1px solid ${C.maroon}25` }}
                        data-testid="select-regional-origin"
                      >
                        <option value="">Select your tradition</option>
                        {["Bengali","Bihari","Marwari","South Indian","Maharashtrian","Gujarati","Kashmiri","Odia","UP / Awadhi","Punjabi","Nepali"].map(v => (
                          <option key={v} value={v}>{v}</option>
                        ))}
                      </select>
                    </Field>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Field label="Years of Experience *" id="experience">
                        <Input id="experience" name="experience" type="number" min="0" value={form.experience} onChange={onChange} placeholder="e.g., 5" required data-testid="input-experience" style={{ borderColor: `${C.maroon}25` }} />
                      </Field>
                      <Field label="Vedic Education" id="education">
                        <Input id="education" name="education" value={form.education} onChange={onChange} placeholder="Gurukul, Sanskrit University..." data-testid="input-education" style={{ borderColor: `${C.maroon}25` }} />
                      </Field>
                    </div>
                    <Field label="Languages Known" id="languages">
                      <Input id="languages" name="languages" value={form.languages} onChange={onChange} placeholder="Hindi, Sanskrit, English..." data-testid="input-languages" style={{ borderColor: `${C.maroon}25` }} />
                    </Field>
                    <Field label="Sevas You Perform" id="specializations">
                      <Textarea id="specializations" name="specializations" value={form.specializations} onChange={onChange} placeholder="Satyanarayan Katha, Griha Pravesh, Rudra Abhishek..." className="min-h-[80px]" data-testid="input-specializations" style={{ borderColor: `${C.maroon}25` }} />
                    </Field>
                  </div>
                </FieldGroup>

                <FieldGroup index={3} title="Membership Tier">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {["free", "silver", "gold", "elite"].map((tier) => {
                      const labels: Record<string, string> = { free: "Free", silver: "Silver", gold: "Gold", elite: "Guru Elite" };
                      const selected = form.membership === tier;
                      return (
                        <button
                          key={tier}
                          type="button"
                          onClick={() => setForm((p) => ({ ...p, membership: tier }))}
                          className="rounded-lg p-3 text-center transition-all hover-elevate"
                          style={{
                            background: selected ? C.maroon : "white",
                            border: `2px solid ${selected ? C.gold : C.gold + "30"}`,
                            color: selected ? "white" : C.brown,
                          }}
                          aria-pressed={selected}
                          aria-label={`Select ${labels[tier]} membership tier`}
                          data-testid={`tier-select-${tier}`}
                        >
                          <div className="text-xs font-semibold" style={{ color: selected ? C.gold : C.maroon }}>{labels[tier]}</div>
                          {selected && <div className="text-[10px] mt-0.5">Selected</div>}
                        </button>
                      );
                    })}
                  </div>
                </FieldGroup>

                <FieldGroup index={4} title="About You">
                  <div className="space-y-4">
                    <Field label="Profile Photo" id="photo">
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 px-4 py-2 border border-dashed rounded-lg cursor-pointer hover:bg-[#F5F0E6] transition-colors" style={{ borderColor: `${C.maroon}40`, color: C.brown }} data-testid="input-photo">
                          <Upload className="w-4 h-4" />
                          <span className="text-sm">{photoPreview ? "Change photo" : "Choose file"}</span>
                          <input type="file" accept="image/*" onChange={onPhotoChange} className="hidden" />
                        </label>
                        {photoPreview && (
                          <img src={photoPreview} alt="Preview" className="w-12 h-12 rounded-full object-cover border-2" style={{ borderColor: C.gold }} data-testid="img-photo-preview" />
                        )}
                      </div>
                    </Field>
                    <Field label="Brief Bio" id="bio">
                      <Textarea id="bio" name="bio" value={form.bio} onChange={onChange} placeholder="Tell devotees about your sampradaya and approach..." className="min-h-[90px]" maxLength={500} data-testid="input-bio" style={{ borderColor: `${C.maroon}25` }} />
                      <p className="text-xs text-right mt-1" style={{ color: C.brownSoft }}>{form.bio.length}/500</p>
                    </Field>
                  </div>
                </FieldGroup>

                <div className="pt-4 border-t space-y-5" style={{ borderColor: `${C.maroon}10` }}>
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="agreeTerms"
                      checked={form.agreeTerms}
                      onChange={(e) => setForm((prev) => ({ ...prev, agreeTerms: e.target.checked }))}
                      className="mt-1"
                      style={{ accentColor: C.maroon }}
                      data-testid="checkbox-terms"
                    />
                    <Label htmlFor="agreeTerms" className="text-sm cursor-pointer leading-relaxed" style={{ color: C.brown }}>
                      I agree to the Terms &amp; Conditions and confirm all information provided is accurate.
                    </Label>
                  </div>

                  <Button
                    type="submit"
                    className="w-full rounded-full h-12 text-base font-semibold shadow-lg"
                    disabled={isPending}
                    style={{
                      background: `linear-gradient(135deg, ${C.maroon} 0%, ${C.maroonDeep} 100%)`,
                      color: "white",
                    }}
                    data-testid="btn-submit-application"
                  >
                    {isPending ? "Submitting..." : "Submit Application"}
                    {!isPending && <ArrowRight className="w-4 h-4 ml-2" />}
                  </Button>

                  <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs" style={{ color: C.brownSoft }}>
                    <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" style={{ color: C.gold }} /> Free to join</span>
                    <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" style={{ color: C.gold }} /> No upfront fees</span>
                    <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5" style={{ color: C.gold }} /> Verified in 48 hrs</span>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>

        </div>
      </div>
    </section>
  );
}

function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-medium uppercase tracking-wider" style={{ color: C.brownSoft }}>{label}</Label>
      {children}
    </div>
  );
}

function FieldGroup({ index, title, children }: { index: number; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div
          className="flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold shrink-0"
          style={{ background: C.maroon, color: C.gold }}
        >
          {index}
        </div>
        <h3 className="text-base font-serif" style={{ color: C.maroon }}>{title}</h3>
        <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${C.gold}40, transparent)` }} />
      </div>
      {children}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
// LivePanditCard — credit-card aesthetic; mirrors what the user types.
// This is the "addictive" share-worthy preview the brief asks for.
// ──────────────────────────────────────────────────────────────────────
function LivePanditCard({ form, photoPreview }: { form: FormState; photoPreview: string | null }) {
  const tierLabels: Record<string, { name: string; color: string }> = {
    free: { name: "Free", color: C.brown },
    silver: { name: "Silver Member", color: "#6E6E6E" },
    gold: { name: "Gold Member", color: C.goldDeep },
    elite: { name: "Guru Elite", color: C.flagSaffronDeep },
  };
  const tier = tierLabels[form.membership] || tierLabels.free;
  const sevas = form.specializations
    ? form.specializations.split(/[,\n]/).map((s) => s.trim()).filter(Boolean).slice(0, 3)
    : ["Satyanarayan", "Griha Pravesh", "Vivah"];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative mx-auto"
      style={{ maxWidth: 380 }}
    >
      {/* outer ambient halo */}
      <div className="absolute -inset-6 rounded-[2rem] blur-3xl opacity-60 pointer-events-none" style={{ background: `radial-gradient(ellipse, ${C.gold}50, ${C.flagSaffron}30, transparent 70%)` }} />
      {/* subtle reflection plate beneath */}
      <div className="absolute -bottom-3 left-6 right-6 h-6 blur-md opacity-40 pointer-events-none rounded-full" style={{ background: `linear-gradient(180deg, rgba(0,0,0,0.6), transparent)` }} />

      {/* HEAVY METAL GOLD BEZEL — multi-stop foil gradient gives the brushed-metal sheen */}
      <div
        className="relative rounded-2xl"
        style={{
          padding: 3,
          background: `
            linear-gradient(135deg,
              ${C.goldDeep} 0%,
              ${C.goldLight} 18%,
              ${C.gold} 32%,
              ${C.goldDeep} 50%,
              ${C.goldLight} 68%,
              ${C.gold} 82%,
              ${C.goldDeep} 100%)
          `,
          boxShadow: `
            0 30px 60px -20px rgba(58, 28, 12, 0.55),
            0 12px 24px -8px rgba(0, 0, 0, 0.3),
            inset 0 1px 0 rgba(255,255,255,0.4),
            inset 0 -1px 0 rgba(0,0,0,0.2)
          `,
        }}
      >
        {/* INNER CARD BODY — saffron metallic */}
        <div
          className="relative rounded-[14px] overflow-hidden"
          style={{
            aspectRatio: "1.586 / 1",
            background: `
              linear-gradient(125deg,
                rgba(255,255,255,0.22) 0%,
                transparent 18%,
                transparent 50%,
                rgba(0,0,0,0.08) 75%,
                rgba(0,0,0,0.18) 100%),
              radial-gradient(circle at 75% 15%, ${C.flagSaffron}cc 0%, transparent 55%),
              radial-gradient(circle at 15% 90%, ${C.maroonDeep}55 0%, transparent 50%),
              linear-gradient(135deg, ${C.flagSaffron} 0%, ${C.flagSaffronDeep} 50%, ${C.saffronDeep} 100%)
            `,
            boxShadow: `
              inset 0 1px 0 rgba(255,255,255,0.35),
              inset 0 -1px 0 rgba(0,0,0,0.25),
              inset 0 0 40px rgba(78, 30, 8, 0.25)
            `,
          }}
        >
          {/* subtle noise/grain texture for paper-foil feel */}
          <div
            className="absolute inset-0 opacity-[0.18] mix-blend-overlay pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' seed='5'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 0.85 0 0 0 0 0.5 0 0 0 0.35 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            }}
          />

          {/* ॐ guilloché pattern — very faint, like security print on real cards */}
          <div
            className="absolute inset-0 opacity-[0.06] pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='44' height='44' viewBox='0 0 44 44'%3E%3Ctext x='6' y='30' font-family='serif' font-size='22' fill='%23FFFBF2'%3E%E0%A5%90%3C/text%3E%3C/svg%3E")`,
            }}
          />

          {/* huge faint Ashoka chakra watermark drifting off the right edge */}
          <div className="absolute -right-10 top-1/2 -translate-y-1/2 opacity-[0.10] pointer-events-none">
            <AshokaChakra size={200} color={C.chakraNavy} />
          </div>

          {/* tricolour vertical stripe on far left — VERY thin, premium ID accent */}
          <div className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full overflow-hidden flex flex-col">
            <div className="flex-1" style={{ background: C.flagSaffron }} />
            <div className="flex-1" style={{ background: C.flagWhite }} />
            <div className="flex-1" style={{ background: C.flagGreen }} />
          </div>

          {/* glossy diagonal sheen */}
          <div className="absolute inset-0 pointer-events-none" style={{ background: `linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.18) 45%, rgba(255,255,255,0.06) 50%, transparent 60%)` }} />

          {/* CONTENT — flowing bank-card layout */}
          <div className="relative h-full pl-5 pr-4 py-3.5 flex flex-col justify-between">

            {/* TOP ROW: brand mark (left) · holo chip + verified (right) */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <div
                  className="flex items-center gap-1.5"
                  style={{ textShadow: `0 1px 0 rgba(0,0,0,0.25)` }}
                >
                  <Crown className="w-3.5 h-3.5" style={{ color: C.gold, filter: `drop-shadow(0 1px 0 rgba(0,0,0,0.3))` }} />
                  <span className="text-[11px] uppercase tracking-[0.32em] font-bold" style={{ color: C.flagWhite }}>
                    Vedic Tatva
                  </span>
                </div>
                <div className="text-[8px] uppercase tracking-[0.28em] mt-0.5 font-semibold" style={{ color: "rgba(255,251,242,0.7)" }}>
                  Pandit Identity · est. {new Date().getFullYear()}
                </div>
              </div>

              {/* HOLO CHIP — like an EMV chip on a real card, with tiny chakra inside */}
              <HoloChip />
            </div>

            {/* MIDDLE ROW: square photo · embossed name / location */}
            <div className="flex items-center gap-3">
              {/* square portrait, like an actual ID card photo */}
              <div
                className="shrink-0 rounded-md overflow-hidden"
                style={{
                  width: 56,
                  height: 64,
                  background: photoPreview ? "transparent" : `linear-gradient(135deg, ${C.flagWhite}, ${C.sandalwood})`,
                  border: `2px solid ${C.gold}`,
                  boxShadow: `
                    0 4px 10px rgba(0,0,0,0.35),
                    inset 0 0 0 1px rgba(255,255,255,0.4)
                  `,
                }}
              >
                {photoPreview ? (
                  <img src={photoPreview} alt="Pandit" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Crown className="w-7 h-7" style={{ color: C.flagSaffronDeep, opacity: 0.55 }} />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-[8px] uppercase tracking-[0.22em] font-semibold mb-0.5" style={{ color: "rgba(255,251,242,0.65)" }}>
                  Name of Pandit
                </div>
                {/* embossed serif name */}
                <div
                  className="text-lg font-serif font-bold truncate leading-tight"
                  style={{
                    color: C.flagWhite,
                    textShadow: `
                      0 1px 0 rgba(255,255,255,0.45),
                      0 -1px 0 rgba(0,0,0,0.35),
                      0 2px 4px rgba(0,0,0,0.3)
                    `,
                    letterSpacing: "0.01em",
                  }}
                  data-testid="card-name"
                >
                  {form.fullName || "Your Name Here"}
                </div>
                <div className="text-[10px] truncate font-medium mt-0.5" style={{ color: C.flagWhite, opacity: 0.92 }}>
                  {form.city || "Your City"}
                  {form.regionalOrigin && ` · ${form.regionalOrigin}`}
                </div>
                {/* tier pill — uses gold leaf, not flat color */}
                <div className="inline-flex items-center gap-1 mt-1 px-1.5 py-[1px] rounded-full" style={{
                  background: `linear-gradient(135deg, ${C.gold} 0%, ${C.goldDeep} 100%)`,
                  border: `0.5px solid ${C.goldLight}`,
                  boxShadow: `0 1px 2px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.4)`,
                }}>
                  <Sparkles className="w-2 h-2" style={{ color: C.brown }} />
                  <span className="text-[8px] font-bold uppercase tracking-wider" style={{ color: C.brown }}>{tier.name}</span>
                </div>
              </div>
            </div>

            {/* BOTTOM ROW: member id (debit-card-style) · signature script · QR */}
            <div>
              {/* member id — large mono, like a credit card number */}
              <div
                className="font-mono text-[12px] tracking-[0.18em] font-bold mb-1"
                style={{
                  color: C.flagWhite,
                  textShadow: `
                    0 1px 0 rgba(255,255,255,0.35),
                    0 -1px 0 rgba(0,0,0,0.3),
                    0 2px 3px rgba(0,0,0,0.25)
                  `,
                }}
              >
                VT · {new Date().getFullYear()} · {(form.fullName.length * 137 % 9000 + 1000).toString().padStart(4, "0")}
              </div>

              <div className="flex items-end justify-between gap-2">
                <div>
                  <div className="text-[7px] uppercase tracking-[0.25em] font-semibold" style={{ color: "rgba(255,251,242,0.6)" }}>Member Since</div>
                  <div className="text-[10px] font-semibold" style={{ color: C.flagWhite }}>
                    {new Date().toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                  </div>
                </div>

                {/* signature panel — devanagari script, like a real signature strip */}
                <div className="flex-1 mx-2">
                  <div className="text-[7px] uppercase tracking-[0.25em] font-semibold mb-0.5" style={{ color: "rgba(255,251,242,0.6)" }}>Authorised By</div>
                  <div
                    className="text-[14px] leading-none"
                    style={{
                      fontFamily: '"Tiro Devanagari Sanskrit", "Noto Serif Devanagari", serif',
                      color: C.gold,
                      fontStyle: "italic",
                      fontWeight: 600,
                      textShadow: `0 1px 0 rgba(0,0,0,0.4)`,
                    }}
                  >
                    वैदिक तत्व
                  </div>
                </div>

                {/* QR — embossed look */}
                <div
                  className="w-10 h-10 rounded-md grid grid-cols-4 grid-rows-4 gap-px p-1 shrink-0"
                  style={{
                    background: C.flagWhite,
                    border: `1px solid ${C.gold}`,
                    boxShadow: `0 3px 6px rgba(0,0,0,0.35), inset 0 0 0 1px rgba(255,255,255,0.5)`,
                  }}
                >
                  {Array.from({ length: 16 }).map((_, i) => (
                    <div key={i} className="rounded-[1px]" style={{ background: i % 3 === 0 || i === 5 || i === 10 || i === 13 ? C.brown : "transparent" }} />
                  ))}
                </div>
              </div>

              {/* sevas micro chips — at the very bottom, very subtle */}
              <div className="flex flex-wrap gap-1 mt-1.5">
                {sevas.map((s) => (
                  <span
                    key={s}
                    className="text-[8px] px-1.5 py-[1px] rounded-sm font-semibold uppercase tracking-wider"
                    style={{
                      background: "rgba(255,251,242,0.18)",
                      color: C.flagWhite,
                      border: `0.5px solid rgba(255,251,242,0.35)`,
                      backdropFilter: "blur(2px)",
                    }}
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* corner gold filigree dots */}
          <CornerOrnament position="tl" />
          <CornerOrnament position="tr" />
          <CornerOrnament position="bl" />
          <CornerOrnament position="br" />
        </div>
      </div>
    </motion.div>
  );
}

// Tiny gold corner filigree dot — adds the "rich vedic premium" feel without clutter.
function CornerOrnament({ position }: { position: "tl" | "tr" | "bl" | "br" }) {
  const pos: Record<string, string> = {
    tl: "top-1.5 left-1.5",
    tr: "top-1.5 right-1.5",
    bl: "bottom-1.5 left-1.5",
    br: "bottom-1.5 right-1.5",
  };
  return (
    <div className={`absolute ${pos[position]} pointer-events-none`} aria-hidden>
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <circle cx="7" cy="7" r="2.5" fill={C.gold} fillOpacity="0.85" />
        <circle cx="7" cy="7" r="1" fill={C.flagSaffronDeep} />
      </svg>
    </div>
  );
}

// HoloChip — like a real EMV chip on a credit card, tiny chakra inside golden squares.
function HoloChip() {
  return (
    <div className="flex flex-col items-end gap-1">
      <div
        className="relative w-9 h-7 rounded-[3px] overflow-hidden flex items-center justify-center"
        style={{
          background: `
            conic-gradient(from 45deg,
              ${C.goldDeep} 0deg,
              ${C.goldLight} 90deg,
              ${C.gold} 180deg,
              ${C.goldLight} 270deg,
              ${C.goldDeep} 360deg)
          `,
          border: `0.5px solid ${C.goldDeep}`,
          boxShadow: `
            inset 0 1px 0 rgba(255,255,255,0.5),
            inset 0 -1px 0 rgba(0,0,0,0.3),
            0 1px 2px rgba(0,0,0,0.4)
          `,
        }}
      >
        {/* chip contact lines */}
        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-px p-[2px] opacity-50">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} style={{ background: C.brown }} className="rounded-[0.5px]" />
          ))}
        </div>
        {/* chakra centered */}
        <div className="relative z-10">
          <AshokaChakra size={18} color={C.chakraNavy} />
        </div>
      </div>
      <div className="flex items-center gap-1 px-1.5 py-[1px] rounded-full" style={{ background: "rgba(255,251,242,0.95)", boxShadow: `0 1px 2px rgba(0,0,0,0.25)` }}>
        <ShieldCheck className="w-2.5 h-2.5" style={{ color: C.flagGreenDeep }} />
        <span className="text-[8px] font-bold uppercase tracking-wider" style={{ color: C.flagGreenDeep }}>Verified</span>
      </div>
    </div>
  );
}

// 24-spoke Ashoka Chakra — pure SVG, scales to any size.
function AshokaChakra({ size, color }: { size: number; color: string }) {
  const spokes = Array.from({ length: 24 });
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 1;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-label="Ashoka Chakra" role="img">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="1.4" />
      <circle cx={cx} cy={cy} r={r * 0.18} fill={color} />
      {spokes.map((_, i) => {
        const a = (i / 24) * Math.PI * 2;
        const x2 = cx + Math.cos(a) * r * 0.95;
        const y2 = cy + Math.sin(a) * r * 0.95;
        return <line key={i} x1={cx} y1={cy} x2={x2} y2={y2} stroke={color} strokeWidth="0.9" />;
      })}
    </svg>
  );
}

// ══════════════════════════════════════════════════════════════════════
// SECTION: Final CTA
// ══════════════════════════════════════════════════════════════════════
function FinalCTA({ onApply }: { onApply: (e: React.MouseEvent) => void }) {
  return (
    <section
      className="relative overflow-hidden py-20 md:py-28"
      style={{
        background: `radial-gradient(ellipse at center, ${C.maroon} 0%, ${C.maroonDeep} 70%, ${C.brown} 100%)`,
      }}
    >
      <div
        className="absolute inset-0 opacity-[0.05] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160' viewBox='0 0 160 160'%3E%3Ctext x='10' y='80' font-family='serif' font-size='80' fill='%23D4AF37'%3E%E0%A5%90%3C/text%3E%3C/svg%3E")`,
        }}
      />
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[40rem] h-[40rem] rounded-full blur-3xl" style={{ background: `${C.gold}15` }} />

      <div className="container mx-auto px-4 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="flex items-center justify-center gap-3 mb-5">
            <div className="h-px w-10" style={{ background: C.gold }} />
            <Flame className="w-4 h-4" style={{ color: C.gold }} />
            <div className="h-px w-10" style={{ background: C.gold }} />
          </div>
          <h2 className="font-serif text-white leading-tight" style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}>
            Join India's <span style={{ color: C.gold }}>Digital Dharma</span> Revolution
          </h2>
          <p className="text-white/75 text-base md:text-lg max-w-2xl mx-auto mt-5 leading-relaxed">
            Take your seva beyond local boundaries and become part of the future of spiritual services. Your verified Pandit profile is just three minutes away.
          </p>
          <div className="mt-8">
            <a href="#apply" onClick={onApply} data-testid="link-final-cta">
              <Button
                size="lg"
                className="rounded-full px-10 h-14 text-lg font-semibold shadow-2xl"
                style={{
                  background: `linear-gradient(135deg, ${C.gold} 0%, ${C.saffron} 100%)`,
                  color: C.brown,
                }}
              >
                Register as Pandit
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </a>
          </div>
          <p className="text-xs text-white/50 mt-5">Free · No upfront fees · Verified in 48 hours</p>
        </motion.div>
      </div>
    </section>
  );
}

// ══════════════════════════════════════════════════════════════════════
// Shared section helpers
// ══════════════════════════════════════════════════════════════════════
function SectionEyebrow({ children, align = "center" }: { children: React.ReactNode; align?: "center" | "left" }) {
  return (
    <div className={`flex items-center gap-3 mb-3 ${align === "center" ? "justify-center" : "justify-start"}`}>
      <div className="h-px w-8" style={{ background: C.gold }} />
      <span className="text-[11px] uppercase tracking-[0.32em] font-medium" style={{ color: C.gold }}>{children}</span>
      <div className="h-px w-8" style={{ background: C.gold }} />
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-3xl md:text-4xl lg:text-[2.6rem] font-serif text-center leading-tight" style={{ color: C.maroon }}>
      {children}
    </h2>
  );
}

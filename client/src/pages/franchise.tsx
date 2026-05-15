import { useState } from "react";
import PageSeo from "@/components/PageSeo";
import { faqPage } from "@/lib/seo-schemas";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  PageHero, SectionHeader, IconTile, slimPanel,
} from "@/components/ui/section-primitives";
import {
  Store, Network, Home, CheckCircle2, ShieldCheck,
  Truck, Megaphone, GraduationCap, Headphones, BadgeCheck,
  ArrowRight, Sparkles,
} from "lucide-react";

/* -------------------------------- Schema --------------------------------- */
const formSchema = z.object({
  fullName: z.string().min(2, "Please enter your full name"),
  phone: z.string().min(10, "Enter a valid 10-digit mobile number"),
  email: z.string().email("Enter a valid email"),
  city: z.string().min(2, "City is required"),
  state: z.string().optional(),
  pincode: z.string().optional(),
  model: z.enum(["kiosk", "network", "lite"], { required_error: "Pick a model" }),
  investmentReady: z.string().optional(),
  occupation: z.string().optional(),
  hasShop: z.boolean().default(false),
  shopArea: z.string().optional(),
  whyJoin: z.string().optional(),
  hearAbout: z.string().optional(),
});
type FormValues = z.infer<typeof formSchema>;

/* --------------------------------- Data ---------------------------------- */
const MODELS = [
  {
    id: "kiosk" as const,
    icon: Store,
    name: "Shop / Mini Store",
    fee: "₹1,00,000",
    tagline: "Open your own Vedic Tatva shop in your city",
    bestFor: "If you have a small shop space (100–250 sq.ft.)",
    margin: "Earn up to 35% on every item",
    payback: "Get your money back in 12 months — promised*",
    perks: [
      "Shop board, signage and display rack",
      "Stock worth ₹1,00,000 to start",
      "Pandit ji will do the opening puja",
      "Easy billing & stock app",
      "Google & Facebook ads run for you",
      "Only you in your area — no one else",
    ],
    cta: "Book My Shop Area",
    badge: "Big Shop",
  },
  {
    id: "network" as const,
    icon: Network,
    name: "Network Partner",
    fee: "₹50,000",
    tagline: "Sell through your friends, society and WhatsApp",
    bestFor: "Pandits, society heads, temple committee members",
    margin: "Earn up to 30% on every order",
    payback: "Get your money back in 12 months — promised*",
    perks: [
      "Uniform, ID card and visiting cards",
      "Your own code to share with people",
      "Free puja samagri kit worth ₹15,000",
      "We send you customers from your area",
      "Top spot in our pandit list",
      "Extra bonus every 3 months",
    ],
    cta: "Become a Partner",
    badge: "Most Chosen",
  },
  {
    id: "lite" as const,
    icon: Home,
    name: "Work From Home",
    fee: "₹25,000",
    tagline: "Sell from your phone — earn 15% on every order",
    bestFor: "Housewives, students, anyone with free time",
    margin: "Get 15% on every item you sell",
    payback: "First payment in 7 days · paid every week",
    perks: [
      "Just your phone and WhatsApp — nothing else",
      "Your own sharing link — sales tracked auto",
      "Free training on products and how to sell",
      "Daily ready-made photos and videos to share",
      "Weekly money in your UPI — no minimum limit",
      "Top sellers upgraded to bigger plans — free",
    ],
    cta: "Start Earning From Home",
    badge: "Low Cost",
  },
];

const STATS = [
  { value: "₹48,000 Cr", label: "Puja market in India" },
  { value: "11% Yearly", label: "Market is growing" },
  { value: "300+", label: "Quality products" },
  { value: "12 month", label: "Money back promise*" },
];

const WHY_US = [
  { icon: BadgeCheck, title: "Trusted Brand", text: "All items blessed by pandit ji and quality checked. People trust us." },
  { icon: Truck, title: "Fast Delivery All India", text: "Same-day delivery in 18 big cities. Direct to your customer's home." },
  { icon: Megaphone, title: "We Do Your Marketing", text: "Google and Facebook ads run in your name. Customers come to you." },
  { icon: GraduationCap, title: "Free Training", text: "7-day training on products, pujas and how to sell. Easy and simple." },
  { icon: Headphones, title: "Personal Manager", text: "One person to help you on WhatsApp and call. Every day, 9 AM to 9 PM." },
  { icon: ShieldCheck, title: "Money Back Promise", text: "If you don't recover your money in 12 months, we buy back the stock.*" },
];

const ROADMAP = [
  { day: "Day 0", title: "Apply & Pay", text: "Fill the form. We call you in 24 hours. You pay the fee and sign the paper." },
  { day: "Day 1–7", title: "Free Training", text: "We teach you everything. You get your kit, app and ready-made photos." },
  { day: "Day 7–14", title: "Start Selling", text: "Shop opens with pandit ji puja. Or your code/link goes live." },
  { day: "Month 1–12", title: "Earn Every Week", text: "Customers come daily. Money in your account every week. Big sales on festivals." },
];

const FAQS = [
  { q: "Will I really get my money back in 12 months?", a: "Yes. For Shop and Network partners — if you complete the training, keep 30+ items in stock and do 4 marketing posts per month, we promise on paper that you will get your full fee back in 12 months. If not, we buy back your stock and pay you the difference." },
  { q: "How much do I earn on each item?", a: "Work From Home: 15% on every item. Network Partner: 25–30% based on type of item. Shop: 30–35% on every item, plus festival bonus." },
  { q: "I have never done business before. Is it okay?", a: "Yes, no problem. Our 7-day training teaches you everything from start — products, pujas, how to talk to customers, billing and GST. Many of our top partners are first-time business owners." },
  { q: "Which cities can I join from?", a: "All over India. We are growing fast in Delhi NCR, Mumbai, Pune, Bangalore, Hyderabad, Kolkata, Ahmedabad, Jaipur, Lucknow, Varanasi, Indore, Patna, Chandigarh, Surat, Nagpur, Bhopal and holy cities like Haridwar, Ujjain, Tirupati, Puri, Mathura." },
  { q: "Do I really earn more during festivals?", a: "Yes. Navratri, Diwali, Shivratri, Ganesh Chaturthi and shradh-paksh together give 60% of yearly earnings. Just one Diwali week can give you 2–3 months of fee back." },
];

const TESTIMONIALS = [
  { name: "Rakesh Tiwari", city: "Varanasi · Shop Partner", text: "Got my full ₹1 lakh back in 9 months. Diwali alone gave me ₹1.8 lakh profit. The customers head office sends me are very good.", payback: "9 months" },
  { name: "Sushma Devi", city: "Patna · Network Partner", text: "I am a housewife. Vedic Tatva gave me ₹35,000 every month — just from my society and WhatsApp groups.", payback: "11 months" },
  { name: "Aakash Verma", city: "Indore · Home Partner", text: "Started with just ₹25,000 in college. Earned ₹14,200 in first month by sharing on Instagram. Already half money back in 60 days.", payback: "10 months" },
];

const EARNINGS = [
  { model: "Shop", invest: "₹1,00,000", monthly: "₹35,000–₹85,000", festival: "₹1,80,000+", payback: "9–12 months" },
  { model: "Network", invest: "₹50,000", monthly: "₹20,000–₹55,000", festival: "₹95,000+", payback: "8–11 months" },
  { model: "Home", invest: "₹25,000", monthly: "₹6,000–₹22,000", festival: "₹35,000+", payback: "10–12 months" },
];

/* ------------------------------- Component ------------------------------- */
const primaryBtn = "inline-flex items-center justify-center gap-1.5 h-10 px-5 rounded-md text-[13px] font-semibold bg-[#6D2B35] text-[#D4AF37] hover:bg-[#5a1f29] transition-colors";
const outlineBtn = "inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-md text-[12px] font-semibold bg-white text-[#6D2B35] border border-[#D4AF37]/30 hover:bg-[#FBF7EE] transition-colors";

export default function Franchise() {
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [selectedModel, setSelectedModel] = useState<"kiosk" | "network" | "lite">("kiosk");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "", phone: "", email: "", city: "", state: "", pincode: "",
      model: "kiosk", investmentReady: "", occupation: "",
      hasShop: false, shopArea: "", whyJoin: "", hearAbout: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => apiRequest("POST", "/api/franchise-applications", values),
    onSuccess: () => {
      setSubmitted(true);
      toast({ title: "Application received", description: "Our partner manager will call you within 24 hours." });
    },
    onError: (err: any) => {
      toast({ title: "Could not submit", description: err?.message || "Please try again", variant: "destructive" });
    },
  });

  const scrollToForm = (model: "kiosk" | "network" | "lite") => {
    setSelectedModel(model);
    form.setValue("model", model);
    document.getElementById("apply-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="w-full pb-16 bg-white">
      <PageSeo
        title="Franchise Opportunity | Vedic Tatva — Start Your Puja Business"
        description="Join Vedic Tatva — India's trusted puja brand. Three plans from ₹25,000 (Work-from-home) to ₹1,00,000 (Shop). Money-back promise in 12 months."
        schemas={[faqPage(FAQS.map((f) => ({ question: f.q, answer: f.a })))]}
      />
      {/* Hero — matches /careers exactly */}
      <PageHero
        eyebrow="Franchise"
        title="Start your own puja business"
        subtitle="Join Vedic Tatva — India's trusted puja brand. Three easy plans starting from ₹25,000. We promise your money back in 12 months."
        variant="maroon"
        font="sans"
        testId="hero-franchise"
      />

      <div className="container mx-auto px-4 mt-10">
        {/* Stats strip — slim divided panel */}
        <div className="max-w-4xl mx-auto mb-14">
          <div className={`${slimPanel} grid grid-cols-2 md:grid-cols-4 divide-x divide-[#D4AF37]/15 overflow-hidden`}>
            {STATS.map((s) => (
              <div key={s.label} className="px-4 py-4 text-center" data-testid={`stat-${s.label.toLowerCase().replace(/\s+/g, "-")}`}>
                <div className="text-[16px] md:text-[18px] font-sans font-bold text-[#6D2B35]">{s.value}</div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-[#5a4a3a]/65 mt-1 font-semibold">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Models */}
        <div id="models" className="max-w-6xl mx-auto mb-14">
          <SectionHeader
            eyebrow="Choose Your Plan"
            title="Three easy ways to start"
            subtitle="From your own shop to working from home — pick what suits you. Plans from ₹25,000 to ₹1,00,000."
            testIdPrefix="models"
            font="sans"
          />
          <div className="mt-7 grid grid-cols-1 lg:grid-cols-3 gap-3">
            {MODELS.map((m) => {
              const isFeatured = m.id === "network";
              return (
                <div
                  key={m.id}
                  className={`relative rounded-lg border bg-white flex flex-col overflow-hidden ${
                    isFeatured ? "border-[#D4AF37]/55 shadow-[0_4px_18px_-8px_rgba(212,175,55,0.35)]" : "border-[#D4AF37]/20"
                  }`}
                  data-testid={`card-model-${m.id}`}
                >
                  {isFeatured && <div className="absolute inset-x-0 top-0 h-px bg-[#D4AF37]" />}
                  <div className="p-5 sm:p-6 flex flex-col flex-1">
                    <div className="flex items-center justify-between mb-4">
                      <IconTile icon={m.icon} tone="cream" />
                      <span className="text-[10px] uppercase tracking-[0.2em] text-[#D4AF37] font-semibold">{m.badge}</span>
                    </div>

                    <h3 className="font-sans text-[15px] font-semibold text-[#6D2B35] mb-1.5">{m.name}</h3>
                    <p className="text-[12px] text-[#5a4a3a]/70 leading-relaxed mb-4">{m.tagline}</p>

                    <div className="border-t border-b border-[#D4AF37]/15 py-3 mb-4">
                      <div className="text-[10px] uppercase tracking-[0.18em] text-[#5a4a3a]/55 font-semibold">Franchise fee</div>
                      <div className="text-[24px] font-sans font-bold text-[#6D2B35] mt-0.5 leading-none tracking-tight">{m.fee}</div>
                      <div className="text-[12px] text-[#5a4a3a]/80 mt-1.5">{m.margin}</div>
                      <div className="text-[11px] text-[#D4AF37] font-semibold mt-0.5">{m.payback}</div>
                    </div>

                    <div className="mb-3">
                      <div className="text-[10px] uppercase tracking-[0.18em] text-[#5a4a3a]/55 font-semibold mb-1.5">Best for</div>
                      <p className="text-[12px] text-[#5a4a3a]/80 leading-relaxed">{m.bestFor}</p>
                    </div>

                    <ul className="space-y-1.5 mb-5">
                      {m.perks.map((p) => (
                        <li key={p} className="flex items-start gap-2 text-[12px] text-[#5a4a3a]/85 leading-relaxed">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#D4AF37]" strokeWidth={2} />
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>

                    <button
                      type="button"
                      onClick={() => scrollToForm(m.id)}
                      className={`mt-auto ${isFeatured ? primaryBtn : outlineBtn} w-full`}
                      data-testid={`button-apply-${m.id}`}
                    >
                      {m.cta} <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Why us */}
        <div className="max-w-5xl mx-auto mb-14">
          <SectionHeader
            eyebrow="Why Vedic Tatva"
            title="Why partners choose us"
            testIdPrefix="why"
            font="sans"
          />
          <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {WHY_US.map((w, i) => (
              <div key={w.title} className={`${slimPanel} p-5`} data-testid={`card-why-${i}`}>
                <IconTile icon={w.icon} tone="cream" className="mb-3" />
                <h3 className="font-sans text-[14px] font-semibold text-[#6D2B35] mb-1.5">{w.title}</h3>
                <p className="text-[12px] text-[#5a4a3a]/70 leading-relaxed">{w.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Earnings table */}
        <div className="max-w-5xl mx-auto mb-14">
          <SectionHeader
            eyebrow="Your Earnings"
            title="How much can you really earn?"
            subtitle="Real numbers from our partners during last festival season."
            testIdPrefix="earnings"
            font="sans"
          />
          <div className={`${slimPanel} mt-7 overflow-hidden`}>
            <div className="hidden md:grid grid-cols-5 gap-3 px-5 py-3 text-[10px] uppercase tracking-[0.18em] text-[#5a4a3a]/65 font-semibold border-b border-[#D4AF37]/15 bg-[#FBF7EE]">
              <div>Plan</div>
              <div>You pay</div>
              <div>Monthly earning</div>
              <div>Festival week</div>
              <div>Money back in</div>
            </div>
            {EARNINGS.map((row, i) => (
              <div
                key={row.model}
                className={`grid grid-cols-2 md:grid-cols-5 gap-3 px-5 py-4 ${i !== EARNINGS.length - 1 ? "border-b border-[#D4AF37]/10" : ""}`}
                data-testid={`row-earnings-${row.model.toLowerCase()}`}
              >
                <div className="font-sans font-semibold text-[14px] text-[#6D2B35] md:col-span-1 col-span-2">{row.model}</div>
                <div>
                  <div className="md:hidden text-[10px] uppercase text-[#5a4a3a]/55 font-semibold mb-0.5">You pay</div>
                  <div className="text-[12px] text-[#5a4a3a]/85">{row.invest}</div>
                </div>
                <div>
                  <div className="md:hidden text-[10px] uppercase text-[#5a4a3a]/55 font-semibold mb-0.5">Monthly</div>
                  <div className="text-[12px] text-[#5a4a3a]/85">{row.monthly}</div>
                </div>
                <div>
                  <div className="md:hidden text-[10px] uppercase text-[#5a4a3a]/55 font-semibold mb-0.5">Festival</div>
                  <div className="text-[12px] text-[#D4AF37] font-semibold">{row.festival}</div>
                </div>
                <div>
                  <div className="md:hidden text-[10px] uppercase text-[#5a4a3a]/55 font-semibold mb-0.5">Money back</div>
                  <div className="text-[12px] text-[#5a4a3a]/85">{row.payback}</div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-[#5a4a3a]/55 text-center mt-4 max-w-3xl mx-auto leading-relaxed">
            *Earnings depend on your city, effort and festival season. Money-back promise is for Shop &amp; Network partners who complete training and follow our simple plan.
          </p>
        </div>

        {/* Roadmap */}
        <div className="max-w-5xl mx-auto mb-14">
          <SectionHeader
            eyebrow="How It Works"
            title="From applying to your first sale — just 14 days"
            testIdPrefix="roadmap"
            font="sans"
          />
          <div className="mt-7 relative">
            <div className="hidden md:block absolute top-4 left-[10%] right-[10%] h-px bg-[#D4AF37]/25" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {ROADMAP.map((r, i) => (
                <div key={r.day} className={`${slimPanel} p-5 relative`} data-testid={`step-${i}`}>
                  <div className="w-8 h-8 rounded-full bg-white border-2 border-[#D4AF37] text-[#6D2B35] flex items-center justify-center font-sans font-bold text-[13px] mb-3 relative z-10">
                    {i + 1}
                  </div>
                  <div className="text-[10px] uppercase tracking-[0.2em] text-[#D4AF37] font-semibold mb-1">{r.day}</div>
                  <h3 className="font-sans text-[14px] font-semibold text-[#6D2B35] mb-1.5">{r.title}</h3>
                  <p className="text-[12px] text-[#5a4a3a]/70 leading-relaxed">{r.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Testimonials */}
        <div className="max-w-5xl mx-auto mb-14">
          <SectionHeader
            eyebrow="Our Partners"
            title="Real people. Real earnings."
            testIdPrefix="stories"
            font="sans"
          />
          <div className="mt-7 grid grid-cols-1 md:grid-cols-3 gap-3">
            {TESTIMONIALS.map((t, i) => (
              <div key={t.name} className={`${slimPanel} p-5 flex flex-col`} data-testid={`card-story-${i}`}>
                <div className="text-[#D4AF37]  text-[28px] leading-none mb-2">"</div>
                <p className="text-[12px] text-[#5a4a3a]/80 italic leading-[1.7] flex-1">{t.text}</p>
                <div className="mt-4 pt-3 border-t border-[#D4AF37]/15">
                  <div className="font-sans text-[13px] font-semibold text-[#6D2B35]">{t.name}</div>
                  <div className="text-[11px] text-[#5a4a3a]/60 mt-0.5">{t.city}</div>
                  <div className="text-[10px] uppercase tracking-[0.18em] text-[#D4AF37] font-semibold mt-1.5">
                    Recovered in {t.payback}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Apply form */}
        <div id="apply-form" className="max-w-2xl mx-auto mb-14">
          <SectionHeader
            eyebrow="Apply Now"
            title="Fill this form to start"
            subtitle="We will call you in 24 hours · Free advice · No pressure"
            testIdPrefix="form"
            font="sans"
          />
          <div className={`${slimPanel} mt-7 p-6 sm:p-8`}>
            {submitted ? (
              <div className="text-center py-6" data-testid="card-success">
                <div className="w-12 h-12 rounded-full bg-[#FBF7EE] border border-[#D4AF37]/40 mx-auto flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-6 h-6 text-[#D4AF37]" />
                </div>
                <h3 className="font-sans text-[18px] font-semibold text-[#6D2B35] mb-2">Thank you! We got your form</h3>
                <p className="text-[13px] text-[#5a4a3a]/70 max-w-md mx-auto leading-relaxed">
                  Our team will call you in the next 24 hours on the number you gave. Please keep your phone with you.
                </p>
                <button
                  type="button"
                  className={`${outlineBtn} mt-5`}
                  onClick={() => { setSubmitted(false); form.reset(); }}
                  data-testid="button-submit-another"
                >
                  Send Another Form
                </button>
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="model"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[12px] font-semibold text-[#6D2B35]">
                          Which plan you want? <span className="text-[#8b1a1a]">*</span>
                        </FormLabel>
                        <Select onValueChange={(v) => { field.onChange(v); setSelectedModel(v as any); }} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-model"><SelectValue placeholder="Choose a plan" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="kiosk">Shop / Mini Store — ₹1,00,000</SelectItem>
                            <SelectItem value="network">Network Partner — ₹50,000</SelectItem>
                            <SelectItem value="lite">Work From Home — ₹25,000</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid md:grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[12px] font-semibold text-[#6D2B35]">Your name <span className="text-[#8b1a1a]">*</span></FormLabel>
                          <FormControl><Input {...field} placeholder="Type your full name" data-testid="input-fullName" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[12px] font-semibold text-[#6D2B35]">Mobile number (WhatsApp) <span className="text-[#8b1a1a]">*</span></FormLabel>
                          <FormControl><Input {...field} placeholder="10-digit number" data-testid="input-phone" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[12px] font-semibold text-[#6D2B35]">Email ID <span className="text-[#8b1a1a]">*</span></FormLabel>
                        <FormControl><Input {...field} type="email" placeholder="aapka@email.com" data-testid="input-email" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid md:grid-cols-3 gap-3">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[12px] font-semibold text-[#6D2B35]">Your city <span className="text-[#8b1a1a]">*</span></FormLabel>
                          <FormControl><Input {...field} placeholder="like Varanasi" data-testid="input-city" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[12px] font-semibold text-[#6D2B35]">State</FormLabel>
                          <FormControl><Input {...field} placeholder="like UP" data-testid="input-state" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="pincode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[12px] font-semibold text-[#6D2B35]">Pincode</FormLabel>
                          <FormControl><Input {...field} placeholder="6-digit pincode" data-testid="input-pincode" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="occupation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[12px] font-semibold text-[#6D2B35]">What do you do now?</FormLabel>
                          <FormControl><Input {...field} placeholder="like pandit, shopkeeper, housewife" data-testid="input-occupation" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="investmentReady"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[12px] font-semibold text-[#6D2B35]">When can you pay?</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-investment-ready"><SelectValue placeholder="Choose time" /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="immediately">Right now</SelectItem>
                              <SelectItem value="2-weeks">In 2 weeks</SelectItem>
                              <SelectItem value="1-month">In 1 month</SelectItem>
                              <SelectItem value="3-months">In 3 months</SelectItem>
                              <SelectItem value="exploring">Just looking</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {selectedModel === "kiosk" && (
                    <FormField
                      control={form.control}
                      name="shopArea"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[12px] font-semibold text-[#6D2B35]">How big is your shop space?</FormLabel>
                          <FormControl><Input {...field} placeholder="like 200 sq.ft. on main road" data-testid="input-shop-area" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="whyJoin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[12px] font-semibold text-[#6D2B35]">Why do you want to join us?</FormLabel>
                        <FormControl>
                          <Textarea {...field} rows={3} placeholder="Tell us about yourself — what you want to do..." data-testid="textarea-why-join" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="hearAbout"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[12px] font-semibold text-[#6D2B35]">How did you find us?</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-hear-about"><SelectValue placeholder="Choose one" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="google">Google search</SelectItem>
                            <SelectItem value="instagram">Instagram</SelectItem>
                            <SelectItem value="facebook">Facebook</SelectItem>
                            <SelectItem value="youtube">YouTube</SelectItem>
                            <SelectItem value="whatsapp">WhatsApp</SelectItem>
                            <SelectItem value="friend">Friend or family</SelectItem>
                            <SelectItem value="pandit">My pandit ji</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full bg-[#6D2B35] text-[#D4AF37] hover:bg-[#5a1f29] h-11 text-[13px] font-semibold"
                    disabled={mutation.isPending}
                    data-testid="button-submit-application"
                  >
                    {mutation.isPending ? "Sending…" : "Send My Form"}
                  </Button>

                  <p className="text-[11px] text-[#5a4a3a]/55 text-center leading-relaxed">
                    Our team will call you. We will never give your details to anyone else.
                  </p>
                </form>
              </Form>
            )}
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto mb-14">
          <SectionHeader eyebrow="Common Questions" title="Your questions, answered" testIdPrefix="faq" font="sans" />
          <div className={`${slimPanel} mt-7 divide-y divide-[#D4AF37]/15`}>
            {FAQS.map((f, i) => (
              <details key={f.q} className="group p-5" data-testid={`faq-${i}`}>
                <summary className="cursor-pointer list-none flex items-start justify-between gap-4 text-[14px] font-semibold text-[#6D2B35]">
                  <span>{f.q}</span>
                  <span className="text-[#D4AF37] text-[20px] leading-none group-open:rotate-45 transition-transform shrink-0">+</span>
                </summary>
                <p className="mt-3 text-[12px] text-[#5a4a3a]/75 leading-[1.75]">{f.a}</p>
              </details>
            ))}
          </div>
        </div>

        {/* Final CTA */}
        <div className="relative bg-[#6D2B35] rounded-lg border border-[#D4AF37]/40 max-w-3xl mx-auto text-white overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent" aria-hidden="true" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent" aria-hidden="true" />
          <div className="px-6 py-10 sm:px-10 sm:py-12 text-center relative z-10">
            <div className="flex items-center justify-center gap-2.5 mb-3">
              <span className="h-px w-6 bg-[#D4AF37]" />
              <span className="text-[#D4AF37] text-[10px] uppercase tracking-[0.3em] font-semibold">Few Spots Left</span>
              <span className="h-px w-6 bg-[#D4AF37]" />
            </div>
            <h2 className="font-sans text-2xl md:text-3xl font-semibold mb-2 leading-tight" data-testid="text-final-cta">
              Start your sacred business today
            </h2>
            <p className="text-[13px] text-white/70 max-w-lg mx-auto mb-5 leading-relaxed">
              Only a few partners are taken in each city every 3 months. Apply today and book your area.
            </p>
            <button type="button" onClick={() => scrollToForm("kiosk")} className={primaryBtn} data-testid="button-final-apply">
              <Sparkles className="w-3.5 h-3.5" /> Apply Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

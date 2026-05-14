import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import PageSeo from "@/components/PageSeo";
import { Users, Clock, CreditCard, LayoutDashboard, CheckCircle2, FileCheck, Headphones, ArrowRight, Globe, ShieldCheck, Sparkles } from "lucide-react";
import PageAPlusContent from "@/components/PageAPlusContent";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

const SPECIALIZATION_OPTIONS = [
  "Kundli Reading",
  "Horoscope",
  "Matchmaking",
  "Vastu",
  "Numerology",
  "Palmistry",
  "Tarot",
];

export default function BecomeAstrologer() {
  const { toast } = useToast();

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    city: "",
    experience: "",
    certification: "",
    languages: "",
    consultationFee: "",
    bio: "",
    agreeTerms: false,
  });
  const [selectedSpecs, setSelectedSpecs] = useState<string[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const toggleSpec = (spec: string) => {
    setSelectedSpecs((prev) =>
      prev.includes(spec) ? prev.filter((s) => s !== spec) : [...prev, spec]
    );
  };

  const submitMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/astrologer-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, specializations: selectedSpecs }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Application Submitted!",
        description: "Application submitted! Our team will verify your credentials and contact you within 3-5 business days.",
      });
      setForm({ fullName: "", phone: "", email: "", city: "", experience: "", certification: "", languages: "", consultationFee: "", bio: "", agreeTerms: false });
      setSelectedSpecs([]);
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

  const benefits = [
    { icon: Users, title: "Growing Client Base", desc: "Access thousands of users seeking astrological guidance daily" },
    { icon: Clock, title: "Flexible Schedule", desc: "Set your own availability and work at your convenience" },
    { icon: CreditCard, title: "Secure Payments", desc: "Receive timely payments directly to your bank account" },
    { icon: LayoutDashboard, title: "Professional Dashboard", desc: "Manage consultations, reviews, and earnings in one place" },
  ];

  const steps = [
    { step: "01", title: "Apply", desc: "Fill out the registration form with your qualifications and experience", icon: FileCheck },
    { step: "02", title: "Get Verified", desc: "Our team reviews your credentials and conducts a brief interview", icon: CheckCircle2 },
    { step: "03", title: "Start Consulting", desc: "Begin offering consultations and grow your practice with Vedic Tatva", icon: Headphones },
  ];

  const requirements = [
    "Minimum 2 years of experience in Vedic astrology or related fields",
    "Relevant certification or degree in Jyotish Shastra",
    "Proficiency in at least one consultation language",
    "Commitment to ethical and accurate guidance",
    "Availability for at least 10 hours per week",
  ];

  return (
    <div className="w-full pb-20">
      <PageSeo
        title="Become an Astrologer | Vedic Tatva — Join India's Vedic Astrology Platform"
        description="Verified astrologer profiles, your own consultation fee, real seekers from India and abroad. Vedic, KP, Nadi, Lal Kitab, Vastu, numerology, tarot — all welcome."
      />
      <div className="relative bg-[#6D2B35] text-white py-14 md:py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Ctext x='10' y='40' font-family='serif' font-size='28' fill='%23D4AF37' opacity='0.8'%3E%E2%98%86%3C/text%3E%3Ctext x='60' y='80' font-family='serif' font-size='20' fill='%23D4AF37' opacity='0.6'%3E%E2%98%BD%3C/text%3E%3C/svg%3E")`,
        }} />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="h-px w-8 bg-[#D4AF37]" />
              <span className="text-[#D4AF37] text-[11px] uppercase tracking-[0.3em] font-medium">Join Our Team</span>
              <div className="h-px w-8 bg-[#D4AF37]" />
            </div>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-serif mb-4" data-testid="heading-become-astrologer">Join as a Vedic Astrologer</h1>
            <p className="text-white/70 font-light text-base md:text-lg max-w-2xl mx-auto">
              Offer your astrological consultations to thousands of seekers. Grow your practice with India's leading Vedic platform.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4">
        <div className="py-12 md:py-16">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-serif text-[#6D2B35] mb-2">Why Join Vedic Tatva?</h2>
            <p className="text-[#5a4a3a]/50 text-sm">Benefits of being a verified astrologer on our platform</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((b, i) => (
              <motion.div key={b.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <Card className="border border-[#6D2B35]/10 bg-white text-center hover:-translate-y-1 transition-transform duration-300 h-full" data-testid={`card-benefit-${i}`}>
                  <CardContent className="pt-8 pb-6 px-5">
                    <div className="w-14 h-14 mx-auto bg-[#6D2B35]/5 rounded-full flex items-center justify-center text-[#6D2B35] mb-4">
                      <b.icon className="w-7 h-7" />
                    </div>
                    <h3 className="text-lg font-serif text-[#6D2B35] mb-2">{b.title}</h3>
                    <p className="text-[#5a4a3a]/60 text-sm leading-relaxed">{b.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-3xl mx-auto mb-16">
          <Card className="border border-[#6D2B35]/10 bg-white shadow-lg">
            <CardContent className="p-6 md:p-10">
              <h2 className="text-2xl md:text-3xl font-serif text-[#6D2B35] mb-2 text-center">Registration Form</h2>
              <p className="text-[#5a4a3a]/50 text-sm text-center mb-8">Fill in your details to apply as a Vedic Tatva Astrologer</p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-[#5a4a3a]">Full Name *</Label>
                    <Input id="fullName" name="fullName" value={form.fullName} onChange={handleChange} placeholder="Enter your full name" className="border-[#6D2B35]/15" required data-testid="input-fullname" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-[#5a4a3a]">Phone Number *</Label>
                    <Input id="phone" name="phone" value={form.phone} onChange={handleChange} placeholder="+91 98765 43210" className="border-[#6D2B35]/15" required data-testid="input-phone" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-[#5a4a3a]">Email *</Label>
                    <Input id="email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="astrologer@example.com" className="border-[#6D2B35]/15" required data-testid="input-email" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-[#5a4a3a]">City *</Label>
                    <Input id="city" name="city" value={form.city} onChange={handleChange} placeholder="e.g., Varanasi, Jaipur" className="border-[#6D2B35]/15" required data-testid="input-city" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="experience" className="text-[#5a4a3a]">Years of Experience *</Label>
                  <Input id="experience" name="experience" type="number" min="0" value={form.experience} onChange={handleChange} placeholder="e.g., 5" className="border-[#6D2B35]/15" required data-testid="input-experience" />
                </div>

                <div className="space-y-2">
                  <Label className="text-[#5a4a3a]">Specializations</Label>
                  <div className="flex flex-wrap gap-2">
                    {SPECIALIZATION_OPTIONS.map((spec) => (
                      <button
                        key={spec}
                        type="button"
                        onClick={() => toggleSpec(spec)}
                        className={`px-4 py-2 rounded-full text-sm border transition-colors ${
                          selectedSpecs.includes(spec)
                            ? "bg-[#6D2B35] text-white border-[#6D2B35]"
                            : "bg-white text-[#5a4a3a] border-[#6D2B35]/20 hover:border-[#6D2B35]/50"
                        }`}
                        data-testid={`checkbox-spec-${spec.toLowerCase().replace(/\s+/g, "-")}`}
                      >
                        {spec}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="certification" className="text-[#5a4a3a]">Certification/Degree</Label>
                    <Input id="certification" name="certification" value={form.certification} onChange={handleChange} placeholder="e.g., Jyotish Acharya, B.A. Astrology" className="border-[#6D2B35]/15" data-testid="input-certification" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="languages" className="text-[#5a4a3a]">Languages Known</Label>
                    <Input id="languages" name="languages" value={form.languages} onChange={handleChange} placeholder="e.g., Hindi, English, Tamil" className="border-[#6D2B35]/15" data-testid="input-languages" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="consultationFee" className="text-[#5a4a3a]">Consultation Fee (₹ per session)</Label>
                  <Input id="consultationFee" name="consultationFee" type="number" min="0" value={form.consultationFee} onChange={handleChange} placeholder="e.g., 500" className="border-[#6D2B35]/15" data-testid="input-fee" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio" className="text-[#5a4a3a]">Brief Bio</Label>
                  <Textarea id="bio" name="bio" value={form.bio} onChange={handleChange} placeholder="Tell us about your expertise, consultation style, and what makes you unique..." className="border-[#6D2B35]/15 min-h-[100px]" maxLength={500} data-testid="input-bio" />
                  <p className="text-xs text-[#5a4a3a]/40 text-right">{form.bio.length}/500</p>
                </div>

                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="agreeTerms"
                    checked={form.agreeTerms}
                    onChange={(e) => setForm((prev) => ({ ...prev, agreeTerms: e.target.checked }))}
                    className="mt-1 accent-[#6D2B35]"
                    data-testid="checkbox-terms"
                  />
                  <Label htmlFor="agreeTerms" className="text-sm text-[#5a4a3a]/70 cursor-pointer">
                    I agree to the Terms & Conditions and confirm that all information provided is accurate.
                  </Label>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-[#6D2B35] hover:bg-[#6D2B35]/90 text-white rounded-full h-12 text-base font-medium"
                  disabled={submitMutation.isPending}
                  data-testid="btn-submit-application"
                >
                  {submitMutation.isPending ? "Submitting..." : "Submit Application"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        <div className="py-12 md:py-16 mb-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-serif text-[#6D2B35] mb-2">How It Works</h2>
            <p className="text-[#5a4a3a]/50 text-sm">Simple 3-step process to start consulting</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {steps.map((s, i) => (
              <motion.div key={s.step} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }} className="text-center relative">
                <div className="w-16 h-16 mx-auto bg-[#6D2B35] rounded-full flex items-center justify-center text-white mb-4">
                  <s.icon className="w-7 h-7" />
                </div>
                <div className="text-[#D4AF37] text-xs font-bold uppercase tracking-wider mb-2">Step {s.step}</div>
                <h3 className="text-lg font-serif text-[#6D2B35] mb-2" data-testid={`text-step-${i}`}>{s.title}</h3>
                <p className="text-[#5a4a3a]/60 text-sm leading-relaxed">{s.desc}</p>
                {i < steps.length - 1 && (
                  <ArrowRight className="hidden md:block absolute top-8 -right-4 w-6 h-6 text-[#D4AF37]" />
                )}
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-3xl mx-auto mb-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-serif text-[#6D2B35] mb-2">Requirements</h2>
            <p className="text-[#5a4a3a]/50 text-sm">Eligibility criteria for astrologer partners</p>
          </div>
          <Card className="border border-[#6D2B35]/10 bg-[#F5F0E6]">
            <CardContent className="p-6 md:p-8">
              <ul className="space-y-4">
                {requirements.map((req, i) => (
                  <li key={i} className="flex items-start gap-3" data-testid={`text-requirement-${i}`}>
                    <CheckCircle2 className="w-5 h-5 text-[#D4AF37] mt-0.5 shrink-0" />
                    <span className="text-[#5a4a3a] text-sm">{req}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </motion.div>

        <PageAPlusContent
          eyebrow="Why Astrologers Choose Vedic Tatva"
          title="Become a Vedic Tatva Astrologer — Build Your Practice Online"
          intro="If you are a serious Jyotish practitioner — Vedic, KP, Nadi, Lal Kitab, Western or any tradition — Vedic Tatva is your platform to reach genuine seekers across India and the world. Set your own rates, work your own hours, and let our verification, scheduling, payments and support handle the rest."
          trustBadges={[
            { value: "Verified", label: "Astrologer" },
            { value: "Set Own", label: "Rates" },
            { value: "Direct", label: "Payments" },
            { value: "Global", label: "Reach" },
          ]}
          benefits={[
            { icon: Globe, title: "Reach Genuine Seekers Globally", body: "Devotees and seekers from across India and abroad (USA, UK, Canada, Australia, UAE, Singapore) discover you through filters by language, specialisation and city." },
            { icon: ShieldCheck, title: "Verified Astrologer Badge", body: "After our team verifies your background during onboarding, your profile receives a verified badge — helping serious seekers choose you over noisy alternatives." },
            { icon: Clock, title: "You Decide Your Fee", body: "You propose your consultation fee in your application; our team discusses positioning during onboarding so it works for both you and the seekers we send your way." },
            { icon: CreditCard, title: "Transparent Onboarding", body: "Platform service fee, payment settlement and consultation flow are walked through clearly with you during onboarding before you go live — no hidden surprises." },
            { icon: LayoutDashboard, title: "Tools That Save Time", body: "Vedic Tatva already runs free Janam Kundli, dasha, panchang, kundli matching and Varshaphala tools your seekers can pull up — reducing your manual chart-prep before consultations." },
            { icon: Sparkles, title: "Visibility Through Quality", body: "Active, well-reviewed astrologers earn higher visibility on the platform over time — a fair growth path based on the quality of consultations, not on advertising spend." },
          ]}
          steps={[
            { title: "Apply With Your Profile", body: "Submit the form on this page with your name, contact, city, years of experience, specialisations, languages, certification and a short bio." },
            { title: "Verification Conversation", body: "Our team contacts you to discuss your background, specialisations and approach — protecting seekers and the credibility of every verified astrologer on the platform." },
            { title: "Profile Goes Live", body: "Once approved, we help you finalise your profile, bio and consultation fee, and your listing is published on the astrology directory." },
            { title: "Consult Genuine Seekers", body: "Take consultations sent to you through the platform. Build reviews and grow your practice based on the quality of your readings." },
          ]}
          faqs={[
            { q: "Who can become a Vedic Tatva astrologer?", a: "Serious practitioners of any recognised tradition — Vedic (Parashari), Krishnamurti Paddhati (KP), Nadi, Lal Kitab, Jaimini, Tajaka (Varshaphala), Western and others — with demonstrable training and a few years of consultation experience. Lineage from a known guru, formal Jyotish education or a strong consulting track record all count. Mention your tradition and training in the bio field of the application." },
            { q: "What does the application form ask for?", a: "The form collects your full name, phone, email, city, years of experience, specialisations (you can pick multiple — Vedic, Vastu, Numerology, Tarot, Palmistry, etc.), certification or degree (if any), languages known, your proposed consultation fee, and a short bio describing your style and expertise. Background, tradition and references are discussed during the verification conversation that follows." },
            { q: "How does verification work?", a: "After you submit the form, our team contacts you (typically within a few working days) for a verification conversation. We discuss your training, areas of specialisation and approach. The aim is to confirm authenticity and ethics — not to test you on rote knowledge — and to protect both seekers and your reputation as a verified astrologer." },
            { q: "Is there any joining fee?", a: "No — applying and listing your profile is free for verified astrologers. Any platform service fee on consultations is walked through transparently during onboarding so you can decide if it works for you before going live." },
            { q: "Can I set my own consultation fee?", a: "Yes — you propose your per-session fee in the application form. During onboarding our team discusses sensible positioning based on your experience, specialisations and the seekers we typically attract, but the price is yours to decide." },
            { q: "What kinds of consultations can I offer?", a: "Choose from your specialisations — Janam Kundli analysis, kundli matching, Varshaphala (yearly forecast), Prashna (horary), muhurat selection, dosha analysis (mangal, kaal sarpa, sade-sati, pitru), Vastu, numerology, tarot, palmistry, gemstone and rudraksha recommendations, and remedial mantra/puja prescription. You list these on your profile so seekers self-select before booking." },
            { q: "Will I get genuine seekers, not casual time-wasters?", a: "We invest in attracting serious devotees through editorial content, free kundli/panchang tools, festival outreach and reviews. The verified badge, structured profile, real reviews and clear consultation fee help filter out casual chat-seekers and bring you serious consultations." },
            { q: "What support is available after I join?", a: "Onboarding in Hindi or English, help with profile and bio refinement, ongoing technical and payment support, visibility guidance, and a clear escalation channel for any seeker dispute. Festival weeks have extended support so you can focus on consultations." },
          ]}
          keywordsBlurb="Vedic Tatva welcomes verified astrologers practising Vedic (Parashari) astrology, Krishnamurti Paddhati (KP), Nadi, Lal Kitab, Jaimini, Tajaka Varshaphala, Western astrology and allied vidyas (Vastu, numerology, tarot, palmistry). Offer Janam Kundli analysis, 36-point Ashtakoota kundli matching, Varshaphala, Prashna (horary), muhurat selection, mangal and kaal sarpa dosha analysis, sade-sati and Shani transit guidance, gemstone and rudraksha recommendations, and remedial mantra/puja prescription. Consult in Hindi, English, Sanskrit, Tamil, Telugu, Kannada, Malayalam, Marathi, Bengali, Gujarati and other Indian languages. Reach serious seekers in India and Hindu families in USA, UK, Canada, Australia, Singapore and UAE."
        />
      </div>
    </div>
  );
}

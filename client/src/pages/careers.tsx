import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Wifi, Heart, TrendingUp, Users, MapPin, Briefcase, Clock, Mail, ArrowRight,
  Send, Linkedin, FileText, Loader2, GraduationCap, IndianRupee, Coffee, Sparkles,
  ShieldCheck, Compass, Zap, Award, Layers, BookOpen, MessageCircle, Quote,
  CheckCircle2, Calendar, Building2, Code, PenTool, Megaphone, Headphones, Settings,
  Lightbulb, Globe, Target,
} from "lucide-react";
import { PageHero, SectionHeader, slimPanel } from "@/components/ui/section-primitives";
import PageSeo from "@/components/PageSeo";
import { breadcrumbList as breadcrumbListSchema, faqPage as faqPageSchema, abs } from "@/lib/seo-schemas";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type ApplyDialogProps = {
  role: { id: string; title: string; department: string } | null;
  onClose: () => void;
};

function ApplyDialog({ role, onClose }: ApplyDialogProps) {
  const [form, setForm] = useState({ name: "", email: "", linkedin: "", message: "" });
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || submitting || !role) return;
    setSubmitting(true);
    try {
      await apiRequest("POST", "/api/careers/apply", {
        roleId: role.id,
        roleTitle: role.title,
        name: form.name.trim(),
        email: form.email.trim(),
        linkedin: form.linkedin.trim(),
        message: form.message.trim(),
      });
      setSent(true);
    } catch (err: any) {
      toast({ title: "Could not submit application", description: err?.message || "Please try again in a moment.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => { setForm({ name: "", email: "", linkedin: "", message: "" }); setSent(false); setSubmitting(false); onClose(); };

  return (
    <Dialog open={!!role} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-[#6D2B35]">Apply — {role?.title}</DialogTitle>
          <p className="text-[12px] text-[#5a4a3a]/65 mt-0.5">{role?.department} · Vedic Tatva</p>
        </DialogHeader>
        {sent ? (
          <div className="py-4 text-center space-y-2" data-testid="apply-success">
            <div className="w-12 h-12 rounded-md bg-[#FBF7EE] border border-[#D4AF37]/30 flex items-center justify-center mx-auto">
              <Send className="w-5 h-5 text-[#6D2B35]" />
            </div>
            <p className="text-[13px] text-[#5a4a3a] font-medium">Application received — thank you!</p>
            <p className="text-[12px] text-[#5a4a3a]/65">Our team will review and get back to you within 3–5 business days. To share a resume, email it to <span className="font-medium text-[#6D2B35]">careers@vedictatva.com</span>.</p>
            <Button onClick={handleClose} className="mt-2 bg-[#6D2B35] text-[#D4AF37] rounded-md" data-testid="btn-apply-close">Close</Button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3 pt-1">
            <div className="space-y-1">
              <Label className="text-[11px] text-[#6D2B35]/80 font-medium">Full name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name" className="h-9 text-[13px]" required data-testid="input-apply-name" />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] text-[#6D2B35]/80 font-medium">Email address *</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" className="h-9 text-[13px]" required data-testid="input-apply-email" />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] text-[#6D2B35]/80 font-medium inline-flex items-center gap-1"><Linkedin className="w-3 h-3" /> LinkedIn URL</Label>
              <Input value={form.linkedin} onChange={(e) => setForm({ ...form, linkedin: e.target.value })} placeholder="linkedin.com/in/yourprofile" className="h-9 text-[13px]" data-testid="input-apply-linkedin" />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] text-[#6D2B35]/80 font-medium inline-flex items-center gap-1"><FileText className="w-3 h-3" /> Why do you want to join? (optional)</Label>
              <Textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="A few lines about yourself and what excites you about this role..." className="text-[13px] min-h-[80px] resize-none" data-testid="textarea-apply-message" />
            </div>
            <p className="text-[10px] text-[#5a4a3a]/55">We'll respond within 3–5 business days. To share a resume, email it separately to careers@vedictatva.com.</p>
            <DialogFooter className="gap-2 sm:gap-2">
              <Button type="button" variant="outline" onClick={handleClose} disabled={submitting} className="rounded-md h-9 text-[12px]">Cancel</Button>
              <Button type="submit" disabled={submitting} className="bg-[#6D2B35] text-[#D4AF37] rounded-md h-9 text-[12px]" data-testid="btn-submit-apply">
                {submitting ? (<><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Submitting…</>) : (<><Send className="h-3.5 w-3.5 mr-1.5" /> Submit application</>)}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

const heroStats = [
  { value: "30+", label: "Team members" },
  { value: "50+", label: "Cities live" },
  { value: "500+", label: "Pandits onboarded" },
  { value: "Remote", label: "First, by design" },
];

const values = [
  { icon: ShieldCheck, title: "Authenticity over ego", desc: "We are stewards of a 5,000-year-old tradition. Every decision passes the question: would a Vedic scholar nod or wince?" },
  { icon: Zap, title: "Ship every week", desc: "Small batches, high cadence. Every Friday someone demos something a customer can use on Monday." },
  { icon: Heart, title: "Customer obsession", desc: "We read every review, take every WhatsApp escalation seriously, and refund without asking when in doubt." },
  { icon: Layers, title: "Craft and depth", desc: "We sweat typography, latency, and the difference between 'aarti' and 'arati'. Surface beauty reflects internal rigour." },
  { icon: Compass, title: "Bias for ownership", desc: "No one will tap you on the shoulder. If you see something broken, you fix it or you find someone who can." },
  { icon: Lightbulb, title: "Strong opinions, loosely held", desc: "Disagree directly. Commit fully. Update freely when new evidence arrives." },
];

const benefits = [
  { icon: Wifi, title: "Remote-first across India", desc: "Work from anywhere — Delhi, Bangalore, Varanasi, your village. We meet quarterly in person." },
  { icon: IndianRupee, title: "Top-of-market compensation", desc: "Best-in-class fixed salary plus meaningful ESOPs from day one. Founders take last." },
  { icon: GraduationCap, title: "₹50,000 learning budget", desc: "Books, courses, conferences, Sanskrit classes — annual renewable budget for sharpening your craft." },
  { icon: Heart, title: "Health insurance for family", desc: "₹5L floater for you, spouse, children and parents. Mental-health coverage included." },
  { icon: Calendar, title: "Generous time off", desc: "24 paid days + 12 public holidays + your birthday + festival leaves. Burnout helps no one." },
  { icon: Coffee, title: "Co-working stipend", desc: "₹6,000/month for WeWork, café days or your home office setup. Plus annual ergonomics budget." },
  { icon: Sparkles, title: "Sabbatical at year 3", desc: "Six paid weeks every three years to recharge. Travel, study, write — your call." },
  { icon: Award, title: "Quarterly off-sites", desc: "Real face-time in Delhi, Rishikesh, Goa or wherever the team votes. Travel and stay covered." },
];

type Position = { id: string; title: string; department: string; location: string; type: string; level: string; summary: string };

const positions: Position[] = [
  { id: "senior-fullstack-engineer", title: "Senior Full-Stack Engineer", department: "Engineering", location: "Remote · India", type: "Full-time", level: "Senior", summary: "Own end-to-end features across React/Vite, Express, Drizzle and PostgreSQL. Ship the marketplace, AI consultations, payment infra. 4+ yrs production experience required." },
  { id: "ai-ml-engineer", title: "AI / ML Engineer", department: "Engineering", location: "Remote · India", type: "Full-time", level: "Mid–Senior", summary: "Build production AI for Kundli, baby names, palm reading, content generation. Deep OpenAI / open-source LLM experience and a love of prompt engineering." },
  { id: "frontend-engineer", title: "Frontend Engineer", department: "Engineering", location: "Remote · India", type: "Full-time", level: "Mid", summary: "React + TypeScript + Tailwind. Sweat performance, accessibility and pixel-perfect detail across our PWA and admin surfaces." },
  { id: "devops-sre", title: "DevOps / SRE", department: "Engineering", location: "Remote · India", type: "Full-time", level: "Mid–Senior", summary: "Manage our PM2/Nginx VPS, PostgreSQL, daily backups, observability and CI. Help us hit 99.95% uptime as we scale to 1M users." },
  { id: "senior-product-designer", title: "Senior Product Designer", department: "Design", location: "Remote · India", type: "Full-time", level: "Senior", summary: "Own the visual and interaction language across web and mobile. Strong typography, brand and motion sensibilities required." },
  { id: "content-writer-sanskrit", title: "Content Writer — Sanskrit / Hindi", department: "Content", location: "Delhi / Remote", type: "Full-time", level: "Mid", summary: "Write authentic puja vidhi, katha narratives, mantra translations and SEO landing pages. Sanskrit credential or equivalent rigour required." },
  { id: "vedic-content-lead", title: "Vedic Content Lead", department: "Content", location: "Delhi / Remote", type: "Full-time", level: "Senior", summary: "Govern scriptural authenticity across products, AI outputs and the Sacred Library. Liaise with our Vedic Advisory Council." },
  { id: "pandit-ops-manager", title: "Pandit Operations Manager", department: "Operations", location: "Delhi", type: "Full-time", level: "Mid–Senior", summary: "Onboard, verify, train and retain pandits across 50+ cities. Build the muscle that no marketplace clone can copy." },
  { id: "customer-success-lead", title: "Customer Success Lead", department: "Operations", location: "Delhi / Remote", type: "Full-time", level: "Mid", summary: "Lead WhatsApp + phone support team. Turn every complaint into product insight. Hindi + English fluency required." },
  { id: "performance-marketing-manager", title: "Performance Marketing Manager", department: "Marketing", location: "Remote · India", type: "Full-time", level: "Mid–Senior", summary: "Own paid acquisition across Meta, Google and YouTube. Optimise CAC across puja booking, retail and AI products." },
  { id: "brand-content-marketer", title: "Brand & Content Marketer", department: "Marketing", location: "Remote · India", type: "Full-time", level: "Mid", summary: "Drive brand storytelling on Instagram, YouTube Shorts, blog and email. Loves writing, video and devotional culture." },
  { id: "seo-growth-manager", title: "SEO & Growth Manager", department: "Marketing", location: "Remote · India", type: "Full-time", level: "Mid", summary: "Programmatic SEO at scale: city × puja × deity matrices, schema, internal linking, indexation health. Compounding organic growth is the prize." },
  { id: "founders-office-associate", title: "Founder's Office Associate", department: "Strategy", location: "Delhi", type: "Full-time", level: "Junior–Mid", summary: "Generalist who can ship anything — investor research, vendor negotiation, hiring, BD pilots. Best path into deep operating roles." },
];

const departments = [
  { icon: Code, name: "Engineering", desc: "TypeScript, React, Express, PostgreSQL, OpenAI, AWS." },
  { icon: PenTool, name: "Design", desc: "Brand, product, illustration, motion." },
  { icon: BookOpen, name: "Content", desc: "Sanskrit, Hindi, English. Puja vidhi, kathas, SEO." },
  { icon: Settings, name: "Operations", desc: "Pandit onboarding, livestream ops, fulfilment." },
  { icon: Megaphone, name: "Marketing", desc: "Performance, brand, SEO, lifecycle, partnerships." },
  { icon: Headphones, name: "Customer Success", desc: "WhatsApp + phone support, devotee experience." },
];

const process = [
  { step: 1, title: "Application", desc: "Submit the form here. Two-line note about why this role excites you goes a long way." },
  { step: 2, title: "Intro call (30 min)", desc: "A friendly chat with a hiring manager — your story, our story, mutual fit." },
  { step: 3, title: "Craft assessment", desc: "Take-home or live exercise grounded in real Vedic Tatva problems. Ungated. We pay for substantial work." },
  { step: 4, title: "Deep-dive (60–90 min)", desc: "Two interviews with senior team — go deep on craft, judgement and collaboration." },
  { step: 5, title: "Founder conversation", desc: "Vision alignment, culture fit, your big questions answered candidly." },
  { step: 6, title: "Reference + offer", desc: "We move fast. Most offers extended within 7 days of step 5." },
];

const lifeAt = [
  { quote: "I joined to build a payment flow. I stayed because the team treats every customer message like it's from a beloved aunt.", author: "Engineering, 11 months" },
  { quote: "First time my Sanskrit degree feels like a superpower instead of a curiosity.", author: "Content, 6 months" },
  { quote: "We ship more in a quarter than my last company shipped in a year — and we sleep better.", author: "Design, 14 months" },
];

const faqs = [
  { question: "Do you sponsor visas or hire outside India?", answer: "Currently we hire only Indian residents (or OCI / PIO holders eligible to work in India). We may open international hiring later for specific roles." },
  { question: "How do you handle remote work?", answer: "We are remote-first across India with quarterly in-person off-sites and an optional Delhi co-working space. Async by default; meetings happen in 11am–4pm IST overlap windows." },
  { question: "Do you offer ESOPs?", answer: "Yes — every full-time employee receives meaningful ESOPs from day one with a standard 4-year vest and 1-year cliff. We discuss the exact grant during the offer stage." },
  { question: "What if I don't see a role I'm a fit for?", answer: "Email careers@vedictatva.com with your story and what you'd want to own. We hire ahead of plan when we meet exceptional people." },
  { question: "Do I need to be a practising Hindu?", answer: "Not at all. We are a tradition-respecting, secular workplace. We ask only that you bring genuine curiosity, sensitivity and craft to the work." },
  { question: "What's the typical hiring timeline?", answer: "Two to three weeks from application to offer for most roles. Senior leadership may take 4–5 weeks given additional reference and committee conversations." },
  { question: "Are internships available?", answer: "We hire 4–6 interns each year for 3–6 month engagements across engineering, content and operations. Strong intern performers convert to full-time." },
];

const primaryBtn = "inline-flex items-center justify-center gap-1.5 h-10 px-5 rounded-md text-[13px] font-semibold bg-[#6D2B35] text-[#D4AF37] hover:bg-[#5a1f29] transition-colors";
const outlineBtn = "inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-md text-[12px] font-semibold bg-white text-[#6D2B35] border border-[#D4AF37]/30 hover:bg-[#FBF7EE] transition-colors";

const departmentLabels = ["All", ...Array.from(new Set(positions.map(p => p.department)))];

export default function Careers() {
  const [applyRole, setApplyRole] = useState<Position | null>(null);
  const [activeDept, setActiveDept] = useState<string>("All");
  const filteredPositions = activeDept === "All" ? positions : positions.filter(p => p.department === activeDept);

  return (
    <div className="w-full pb-16 bg-white">
      <PageSeo
        title="Careers at Vedic Tatva | Build the Future of Devotion"
        description="Join Vedic Tatva — work at the intersection of tradition and technology. 13+ open roles in engineering, design, content, operations, marketing across India. Remote-first, top-of-market compensation, meaningful ESOPs."
        canonical={abs("/careers")}
        ogType="website"
        schemas={[
          breadcrumbListSchema([
            { name: "Home", url: abs("/") },
            { name: "Careers", url: abs("/careers") },
          ]),
          faqPageSchema(faqs),
        ]}
      />
      <PageHero
        eyebrow="Careers"
        title="Build the future of devotion"
        subtitle="Vedic Tatva is the premium platform unifying verified pandits, authentic spiritual products and AI consultations. Help us serve 1.4 billion Hindus globally — with the craft and care this tradition deserves."
        variant="maroon"
        testId="hero-careers"
      >
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <a href="#open-roles" className="inline-flex items-center gap-1.5 h-11 px-6 rounded-md text-[13px] font-semibold bg-[#D4AF37] text-[#3a1a20] hover:bg-[#c19c2e] border border-[#D4AF37] transition-colors" data-testid="btn-careers-cta-hero">
            See open roles <ArrowRight className="h-3.5 w-3.5" />
          </a>
          <a href="mailto:careers@vedictatva.com" className="inline-flex items-center gap-1.5 h-11 px-6 rounded-md text-[13px] font-semibold bg-white/10 text-white border border-[#D4AF37]/40 backdrop-blur hover:bg-white/15 transition-colors" data-testid="link-careers-email-hero">
            <Mail className="h-3.5 w-3.5" /> careers@vedictatva.com
          </a>
        </div>
      </PageHero>

      <div className="container mx-auto px-4 mt-10">
        {/* Hero stats */}
        <div className="max-w-5xl mx-auto -mt-4 mb-14 grid grid-cols-2 md:grid-cols-4 gap-3">
          {heroStats.map((s, i) => (
            <div key={s.label} className={`${slimPanel} p-5 text-center`} data-testid={`careers-stat-${i}`}>
              <div className="text-2xl md:text-3xl font-serif font-semibold text-[#6D2B35]">{s.value}</div>
              <div className="text-[11px] text-[#5a4a3a] uppercase tracking-wider mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Mission */}
        <div className="max-w-3xl mx-auto mb-14 text-center">
          <SectionHeader eyebrow="Our Mission" title="A 5,000-year-old tradition. Built for the next century." subtitle="Authentic. Trusted. Delightful. Across every device, in every language." />
          <div className={`${slimPanel} p-6 sm:p-8 mt-6 bg-[#FBF7EE]`}>
            <Quote className="h-5 w-5 text-[#D4AF37] mx-auto mb-3" strokeWidth={1.6} />
            <p className="text-[14px] text-[#5a4a3a] leading-relaxed font-serif italic">
              "We're not building an app. We're building the trusted institution that 1.4 billion Hindus deserve — one verified pandit, one lab-tested product, one beautifully crafted experience at a time."
            </p>
            <div className="text-[11px] text-[#5a4a3a]/65 mt-4 uppercase tracking-wider">— Founding team</div>
          </div>
        </div>

        {/* Values */}
        <div className="max-w-6xl mx-auto mb-16">
          <SectionHeader eyebrow="How We Work" title="Six values, every day" subtitle="Not posters on walls. Real defaults that show up in code reviews, hiring loops and customer calls." />
          <div className="mt-7 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {values.map((v, i) => (
              <div key={v.title} className={`${slimPanel} p-5`} data-testid={`value-${i}`}>
                <div className="w-10 h-10 bg-[#FBF7EE] border border-[#D4AF37]/25 rounded-md flex items-center justify-center text-[#6D2B35] mb-3">
                  <v.icon className="w-4 h-4" strokeWidth={1.8} />
                </div>
                <h3 className="text-[14px] font-serif font-semibold text-[#6D2B35] mb-1.5">{v.title}</h3>
                <p className="text-[12.5px] text-[#5a4a3a]/75 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Benefits */}
        <div className="max-w-6xl mx-auto mb-16">
          <SectionHeader eyebrow="What You Get" title="Compensation that respects your craft" subtitle="Top-of-market salary plus the things that actually matter for a long career" />
          <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {benefits.map((b, i) => (
              <div key={b.title} className={`${slimPanel} p-5`} data-testid={`benefit-${i}`}>
                <div className="w-10 h-10 bg-[#6D2B35] text-[#D4AF37] rounded-md flex items-center justify-center mb-3">
                  <b.icon className="w-4 h-4" strokeWidth={1.8} />
                </div>
                <h3 className="text-[13px] font-serif font-semibold text-[#6D2B35] mb-1.5">{b.title}</h3>
                <p className="text-[12px] text-[#5a4a3a]/75 leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Departments */}
        <div className="max-w-6xl mx-auto mb-16">
          <SectionHeader eyebrow="Departments" title="Where you might land" subtitle="Six teams, all hiring. Pick your discipline — or invent your own role." />
          <div className="mt-7 grid grid-cols-2 md:grid-cols-3 gap-3">
            {departments.map((d, i) => (
              <div key={d.name} className={`${slimPanel} p-5`} data-testid={`dept-${i}`}>
                <div className="w-9 h-9 bg-[#FBF7EE] border border-[#D4AF37]/25 rounded-md flex items-center justify-center text-[#6D2B35] mb-2">
                  <d.icon className="w-4 h-4" strokeWidth={1.8} />
                </div>
                <h3 className="text-[13px] font-serif font-semibold text-[#6D2B35] mb-0.5">{d.name}</h3>
                <p className="text-[11.5px] text-[#5a4a3a]/70 leading-relaxed">{d.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Open positions */}
        <div id="open-roles" className="max-w-4xl mx-auto mb-16 scroll-mt-24">
          <SectionHeader eyebrow="Open Positions" title={`${positions.length} open roles · hiring across India`} subtitle="All full-time. Remote-first unless noted. Top-of-market compensation plus ESOPs." />
          <div className="mt-7 flex flex-wrap gap-2 justify-center">
            {departmentLabels.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setActiveDept(d)}
                className={`h-8 px-3 rounded-md text-[12px] font-medium border transition-colors ${activeDept === d ? "bg-[#6D2B35] text-[#D4AF37] border-[#6D2B35]" : "bg-white text-[#6D2B35] border-[#D4AF37]/30 hover:bg-[#FBF7EE]"}`}
                data-testid={`filter-dept-${d.toLowerCase().replace(/\s+/g, "-")}`}
              >
                {d}
              </button>
            ))}
          </div>
          <div className="mt-5 flex flex-col gap-2">
            {filteredPositions.map((position) => (
              <div key={position.id} className={`${slimPanel} p-4 sm:p-5`} data-testid={`card-position-${position.id}`}>
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <h3 className="text-[14px] font-serif font-semibold text-[#6D2B35]" data-testid={`text-position-title-${position.id}`}>{position.title}</h3>
                      <span className="text-[10px] uppercase tracking-wider font-semibold bg-[#FBF7EE] border border-[#D4AF37]/30 text-[#6D2B35] px-2 py-0.5 rounded">{position.level}</span>
                    </div>
                    <p className="text-[12px] text-[#5a4a3a]/75 leading-relaxed mb-2">{position.summary}</p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10.5px] text-[#5a4a3a]/65 uppercase tracking-wider font-semibold">
                      <span className="inline-flex items-center gap-1"><Briefcase className="w-3 h-3 text-[#D4AF37]" strokeWidth={1.8} />{position.department}</span>
                      <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3 text-[#D4AF37]" strokeWidth={1.8} />{position.location}</span>
                      <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3 text-[#D4AF37]" strokeWidth={1.8} />{position.type}</span>
                    </div>
                  </div>
                  <button type="button" onClick={() => setApplyRole(position)} className={`${outlineBtn} shrink-0 self-start`} data-testid={`btn-apply-${position.id}`}>
                    Apply <ArrowRight className="h-3 w-3" strokeWidth={1.8} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hiring process */}
        <div className="max-w-5xl mx-auto mb-16">
          <SectionHeader eyebrow="Hiring Process" title="Six steps. Two to three weeks." subtitle="Designed to respect your time and let your craft speak louder than your résumé." />
          <div className="mt-7 grid grid-cols-1 md:grid-cols-2 gap-3">
            {process.map((p) => (
              <div key={p.step} className={`${slimPanel} p-5`} data-testid={`process-${p.step}`}>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 shrink-0 rounded-md bg-[#6D2B35] text-[#D4AF37] flex items-center justify-center font-serif font-semibold text-[14px]">{p.step}</div>
                  <div className="min-w-0">
                    <h3 className="text-[13px] font-serif font-semibold text-[#6D2B35] mb-1">{p.title}</h3>
                    <p className="text-[12px] text-[#5a4a3a]/75 leading-relaxed">{p.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Life at */}
        <div className="max-w-5xl mx-auto mb-16">
          <SectionHeader eyebrow="Life at Vedic Tatva" title="In our team's words" />
          <div className="mt-7 grid grid-cols-1 md:grid-cols-3 gap-3">
            {lifeAt.map((l, i) => (
              <div key={i} className={`${slimPanel} p-5 bg-[#FBF7EE]`} data-testid={`testimonial-${i}`}>
                <Quote className="h-4 w-4 text-[#D4AF37] mb-2" strokeWidth={1.8} />
                <p className="text-[12.5px] text-[#5a4a3a] leading-relaxed italic font-serif">"{l.quote}"</p>
                <div className="text-[10.5px] text-[#5a4a3a]/65 mt-3 uppercase tracking-wider font-semibold">— {l.author}</div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto mb-16">
          <SectionHeader eyebrow="Candidate FAQ" title="Common questions" />
          <div className="mt-7 space-y-2.5">
            {faqs.map((f, i) => (
              <details key={i} className={`${slimPanel} p-4 group`} data-testid={`faq-${i}`}>
                <summary className="cursor-pointer list-none flex items-center justify-between gap-3 text-[13px] font-serif font-semibold text-[#6D2B35]">
                  <span>{f.question}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-[#D4AF37] transition-transform group-open:rotate-90" />
                </summary>
                <p className="mt-2.5 text-[12.5px] text-[#5a4a3a]/80 leading-relaxed">{f.answer}</p>
              </details>
            ))}
          </div>
        </div>

        {/* Open application CTA */}
        <div className="relative bg-[#6D2B35] rounded-lg border border-[#D4AF37]/40 max-w-3xl mx-auto text-white overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent" aria-hidden="true" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent" aria-hidden="true" />
          <div className="p-6 sm:p-8 text-center">
            <div className="w-10 h-10 mx-auto rounded-md bg-white/10 border border-[#D4AF37]/40 flex items-center justify-center mb-4">
              <Mail className="w-4 h-4 text-[#D4AF37]" strokeWidth={1.8} />
            </div>
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="h-px w-6 bg-[#D4AF37]" />
              <span className="text-[#D4AF37] text-[10px] uppercase tracking-[0.3em] font-semibold">Open Application</span>
              <span className="h-px w-6 bg-[#D4AF37]" />
            </div>
            <h2 className="text-xl md:text-2xl font-serif font-semibold mb-2">Don't see your role?</h2>
            <p className="text-white/70 text-[13px] mb-5 max-w-md mx-auto">
              We hire ahead of plan when we meet exceptional people. Tell us your story and what you'd want to own.
            </p>
            <a href="mailto:careers@vedictatva.com?subject=General Application - Vedic Tatva" className="inline-flex items-center gap-1.5 h-10 px-5 rounded-md bg-[#D4AF37] hover:bg-[#c19c2e] text-[#3a1a20] font-semibold text-[13px] border border-[#D4AF37] transition-colors" data-testid="btn-send-resume">
              <Mail className="h-3.5 w-3.5" strokeWidth={1.8} /> careers@vedictatva.com
            </a>
          </div>
        </div>
      </div>
      <ApplyDialog role={applyRole} onClose={() => setApplyRole(null)} />
    </div>
  );
}

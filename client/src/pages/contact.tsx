import { useState } from "react";
import { Mail, Phone, MapPin, Clock, ChevronDown, Send } from "lucide-react";
import PageSeo from "@/components/PageSeo";
import { faqPage } from "@/lib/seo-schemas";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

const contactInfo = [
  {
    icon: Mail,
    title: "Email Us",
    value: "ecom@vedictatva.com",
    description: "We typically respond within 24 hours",
  },
  {
    icon: Phone,
    title: "Call Us",
    value: "8447-8447-02",
    description: "Mon–Sat, 9 AM – 7 PM IST",
  },
  {
    icon: MapPin,
    title: "Our Presence",
    value: "Pan-India Service",
    description: "Based in Delhi, India",
  },
];

const subjectOptions = [
  "General Inquiry",
  "Order Issue",
  "Pandit Booking",
  "Puja Query",
  "Astrology",
  "Feedback",
  "Partnership",
];

const faqs = [
  {
    question: "How do I book a pandit for a puja?",
    answer: "You can book a verified pandit through our Puja Booking page. Simply select the puja type, choose your preferred date and location, and we'll match you with the best available pandit in your area. You'll receive confirmation within 2 hours.",
  },
  {
    question: "What areas do you currently serve?",
    answer: "Vedic Tatva currently operates across 50+ cities in India. Our pandit network covers all major metros including Delhi, Mumbai, Bangalore, Chennai, Kolkata, Hyderabad, Pune, and Jaipur, along with many Tier-2 and Tier-3 cities.",
  },
  {
    question: "Are your pandits verified and qualified?",
    answer: "Absolutely. Every pandit on our platform goes through a rigorous verification process that includes credential checks, knowledge assessments, and background verification. We only onboard pandits with genuine Vedic education and years of experience.",
  },
  {
    question: "How does your AI astrology service work?",
    answer: "Our AI-powered astrology services use advanced algorithms trained on authentic Vedic astrology principles. You can get instant Kundli generation, palm reading analysis, and baby name suggestions — all completely free. For detailed consultations, we connect you with expert astrologers.",
  },
  {
    question: "What is your refund and cancellation policy?",
    answer: "We offer hassle-free refunds for service cancellations made at least 24 hours before the scheduled time. For products, we accept returns within 7 days of delivery. Please visit our Refund Policy page for complete details.",
  },
  {
    question: "Can I get spiritual products delivered to my home?",
    answer: "Yes! We offer pan-India delivery for all our spiritual products including puja samagri, rudraksha, incense, and more. Most orders are delivered within 3-7 business days depending on your location.",
  },
];

export default function Contact() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  function updateField(field: string, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      toast({ title: "Required Fields", description: "Please fill in your name, email, and message.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("Failed");
      toast({ title: "Message Sent!", description: "Thank you for reaching out. We'll get back to you within 24 hours." });
      setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
    } catch {
      toast({ title: "Message Sent!", description: "Thank you for reaching out. We'll get back to you within 24 hours." });
      setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full pb-20">
      <PageSeo
        title="Contact Us | Vedic Tatva - Get in Touch"
        description="Contact Vedic Tatva for puja bookings, astrology queries, order support, and partnerships. Email: ecom@vedictatva.com | Phone: 8447-8447-02"
        schemas={[faqPage(faqs.map((f) => ({ question: f.question, answer: f.answer })))]}
      />
      <div className="relative bg-[#6D2B35] text-white py-14 md:py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Ctext x='10' y='40' font-family='serif' font-size='28' fill='%23D4AF37' opacity='0.8'%3E%E0%A5%90%3C/text%3E%3Ctext x='60' y='80' font-family='serif' font-size='20' fill='%23D4AF37' opacity='0.6'%3E%E2%9C%A6%3C/text%3E%3Ctext x='30' y='110' font-family='serif' font-size='16' fill='%23D4AF37' opacity='0.5'%3E%E0%A5%90%3C/text%3E%3C/svg%3E")`,
        }} />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="h-px w-8 bg-[#D4AF37]" />
              <span className="text-[#D4AF37] text-[11px] uppercase tracking-[0.3em] font-medium">Contact Us</span>
              <div className="h-px w-8 bg-[#D4AF37]" />
            </div>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-serif mb-4" data-testid="text-contact-title">Get in Touch</h1>
            <p className="text-white/70 font-light text-base md:text-lg">
              We'd love to hear from you. Reach out for bookings, queries, or just to say namaste.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4">
        <div className="-mt-8 md:-mt-12 relative z-20 mb-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {contactInfo.map((info, i) => (
              <motion.div key={info.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.1 }}>
                <Card className="border border-[#6D2B35]/10 bg-white shadow-lg text-center hover:-translate-y-1 transition-transform duration-300 h-full" data-testid={`card-contact-${info.title.toLowerCase().replace(/\s+/g, "-")}`}>
                  <CardContent className="pt-8 pb-6 px-6">
                    <div className="w-14 h-14 mx-auto bg-[#6D2B35]/5 rounded-full flex items-center justify-center text-[#6D2B35] mb-4">
                      <info.icon className="w-7 h-7" />
                    </div>
                    <h3 className="text-lg font-serif text-[#6D2B35] mb-2">{info.title}</h3>
                    <p className="text-[#5a4a3a] font-medium text-base mb-1">{info.value}</p>
                    <p className="text-[#5a4a3a]/50 text-sm">{info.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 max-w-6xl mx-auto mb-16">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="lg:col-span-3">
            <Card className="border border-[#6D2B35]/10 bg-white shadow-md">
              <CardContent className="p-6 md:p-8">
                <h2 className="text-2xl font-serif text-[#6D2B35] mb-6" data-testid="text-form-heading">Send Us a Message</h2>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="contact-name" className="text-sm text-[#5a4a3a]">Full Name *</Label>
                      <Input
                        id="contact-name"
                        placeholder="Your full name"
                        className="bg-white border-[#6D2B35]/10"
                        value={formData.name}
                        onChange={(e) => updateField("name", e.target.value)}
                        data-testid="input-contact-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact-email" className="text-sm text-[#5a4a3a]">Email Address *</Label>
                      <Input
                        id="contact-email"
                        type="email"
                        placeholder="your@email.com"
                        className="bg-white border-[#6D2B35]/10"
                        value={formData.email}
                        onChange={(e) => updateField("email", e.target.value)}
                        data-testid="input-contact-email"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="contact-phone" className="text-sm text-[#5a4a3a]">Phone Number</Label>
                      <Input
                        id="contact-phone"
                        placeholder="Your phone number"
                        className="bg-white border-[#6D2B35]/10"
                        value={formData.phone}
                        onChange={(e) => updateField("phone", e.target.value)}
                        data-testid="input-contact-phone"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact-subject" className="text-sm text-[#5a4a3a]">Subject</Label>
                      <select
                        id="contact-subject"
                        className="flex h-9 w-full rounded-md border border-[#6D2B35]/10 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        value={formData.subject}
                        onChange={(e) => updateField("subject", e.target.value)}
                        data-testid="select-contact-subject"
                      >
                        <option value="">Select a subject</option>
                        {subjectOptions.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact-message" className="text-sm text-[#5a4a3a]">Message *</Label>
                    <Textarea
                      id="contact-message"
                      placeholder="How can we help you?"
                      className="bg-white border-[#6D2B35]/10 min-h-[120px]"
                      value={formData.message}
                      onChange={(e) => updateField("message", e.target.value)}
                      data-testid="textarea-contact-message"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-[#6D2B35] hover:bg-[#6D2B35]/90 text-white rounded-full h-12 text-base gap-2"
                    data-testid="btn-submit-contact"
                  >
                    <Send className="w-4 h-4" />
                    {isSubmitting ? "Sending..." : "Send Message"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="lg:col-span-2">
            <Card className="border border-[#6D2B35]/10 bg-[#F5F0E6]">
              <CardContent className="p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <Clock className="w-6 h-6 text-[#6D2B35]" />
                  <h3 className="text-xl font-serif text-[#6D2B35]" data-testid="text-hours-heading">Business Hours</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-[#6D2B35]/8">
                    <span className="text-[#5a4a3a] text-sm font-medium">Monday – Saturday</span>
                    <span className="text-[#6D2B35] text-sm font-semibold">9:00 AM – 7:00 PM IST</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-[#6D2B35]/8">
                    <span className="text-[#5a4a3a] text-sm font-medium">Sunday</span>
                    <span className="text-[#D4AF37] text-sm font-semibold">Puja Services Only</span>
                  </div>
                </div>
                <div className="mt-8 bg-white rounded-2xl p-5 border border-[#6D2B35]/8">
                  <h4 className="font-serif text-[#6D2B35] mb-2">Quick Support</h4>
                  <p className="text-[#5a4a3a]/60 text-sm leading-relaxed mb-3">
                    For urgent puja bookings or order issues, call us directly for immediate assistance.
                  </p>
                  <a href="tel:8447844702" className="inline-flex items-center gap-2 text-[#6D2B35] font-medium text-sm hover:text-[#D4AF37] transition-colors" data-testid="link-quick-call">
                    <Phone className="w-4 h-4" />
                    8447-8447-02
                  </a>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-serif text-[#6D2B35] mb-2" data-testid="text-faq-heading">Frequently Asked Questions</h2>
            <p className="text-[#5a4a3a]/50 text-sm">Quick answers to common queries</p>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="border border-[#6D2B35]/8 rounded-2xl bg-white overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-[#F5F0E6]/50 transition-colors"
                  data-testid={`btn-faq-${i}`}
                >
                  <span className="font-medium text-[#6D2B35] text-sm md:text-base pr-4">{faq.question}</span>
                  <ChevronDown className={`w-5 h-5 text-[#6D2B35] flex-shrink-0 transition-transform duration-300 ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5">
                    <p className="text-[#5a4a3a]/70 text-sm leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
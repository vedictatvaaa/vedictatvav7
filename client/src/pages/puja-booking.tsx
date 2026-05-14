import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useSearch } from "wouter";
import { Calendar as CalendarIcon, Clock, CheckCircle2, ShieldCheck, Flame, Heart, Sparkles, Users, Globe, BookOpen, Star, ScrollText, Calendar, CheckCircle } from "lucide-react";
import PageAPlusContent from "@/components/PageAPlusContent";
import PageSeo from "@/components/PageSeo";
import type { Pandit } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { RelatedServicesSection } from "@/components/RelatedServices";
import { PageHero } from "@/components/ui/section-primitives";
import { Link } from "wouter";
import { ChevronRight } from "lucide-react";
import { faqPage as faqPageSchema, breadcrumbList as breadcrumbListSchema, service as serviceSchema, abs } from "@/lib/seo-schemas";

const PUJA_PARENT_H1 = "Book Pandit Online for Puja at Home — Verified Vedic Pandits, Authentic Vidhi";

const PUJA_FAQS = [
  { q: "How do I book a pandit online for puja at home?", a: "Choose your puja, pick a date with shubh muhurat, select a verified pandit by language and tradition, and pay securely. The pandit confirms within 2 hours and arrives at your home with full vidhi prepared." },
  { q: "What are the most common pujas booked?", a: "Griha Pravesh (housewarming), Satyanarayan Katha, Lakshmi Puja (Diwali), Ganesh Sthapana (Ganesh Chaturthi), Navagraha Shanti, Rudra Abhishek, Sundarkand Path, Wedding ceremonies, Mundan, Namkaran, and shradh/pind daan." },
  { q: "Are the pandits really verified?", a: "Yes — every pandit goes through document verification (Sanskrit qualification certificates, parampara/lineage proof), in-person interview, scriptural knowledge test and customer reference check. Reviews and ratings from past clients are visible on every profile." },
  { q: "What is included in the puja booking price?", a: "The price includes pandit dakshina, travel within city, full vidhi performance and digital sankalp certificate. Samagri (puja items) is optional add-on — you can either order our fresh kit or arrange your own." },
  { q: "Can the pandit perform puja in my regional language?", a: "Yes — beyond Sanskrit (which is mandatory for mantras), pandits explain the vidhi and katha in your language. We have pandits fluent in Hindi, Tamil, Telugu, Kannada, Bengali, Marathi, Gujarati, Malayalam, Punjabi and Odia." },
  { q: "How do I choose the right muhurat for my puja?", a: "Our system auto-suggests shubh muhurat based on your puja type, date and city — Abhijit muhurat, Brahma muhurat, or specific tithi-based windows. For complex ceremonies (wedding, griha pravesh), you can book a separate muhurat consultation first." },
  { q: "What if I need to reschedule or cancel?", a: "Free rescheduling up to 48 hours before puja. Cancellations within 48 hours are subject to a small dakshina fee for the pandit's reserved time." },
  { q: "Is online puja booking available outside India?", a: "Yes — for NRIs, we offer two options: (1) book a pandit for puja at your family's home in India and join via video call, or (2) book a virtual puja where the pandit performs on your behalf at a sacred temple." },
];

const BOOKING_PROMISES = [
  "Verified pandit matched to your puja type",
  "Samagri kit shown clearly before checkout",
  "Support after booking via the app team",
];

const BOOKING_HELP = [
  "Choose a puja and see the cost split upfront.",
  "Pick a date, time, and venue or choose online.",
  "Confirm with secure checkout and get next steps instantly.",
];

const pujaOptions = [
  { value: "satyanarayan", label: "Satyanarayan Katha", price: 5100 },
  { value: "grihapravesh", label: "Griha Pravesh", price: 7100 },
  { value: "rudrabhishek", label: "Rudrabhishek", price: 11000 },
  { value: "mahamrityunjay", label: "Mahamrityunjay Jaap", price: 9500 },
  { value: "navgraha", label: "Navgraha Shanti", price: 8500 },
  { value: "ganesh", label: "Ganesh Puja", price: 3500 },
  { value: "pind-daan-kashi", label: "Pind Daan in Kashi (Manikarnika / Pishachmochan)", price: 11000 },
  { value: "pind-daan-gaya", label: "Pind Daan in Gaya (Vishnupad / Akshayavat)", price: 15100 },
  { value: "pind-daan-haridwar", label: "Pind Daan / Narayani Shila — Haridwar", price: 8100 },
  { value: "pind-daan-yearly-remote", label: "Yearly Remote Tarpan & Shradh (Annual Subscription)", price: 9100 },
];

export default function PujaBooking() {
  const { toast } = useToast();
  const { requireAuth } = useAuth();
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const panditIdParam = searchParams.get("pandit");
  const panditId = panditIdParam ? parseInt(panditIdParam) : 0;

  const { data: selectedPandit } = useQuery<Pandit>({
    queryKey: [`/api/pandits/${panditId}`],
    queryFn: () => fetch(`/api/pandits/${panditId}`).then(r => { if (!r.ok) throw new Error("Not found"); return r.json(); }),
    enabled: panditId > 0,
  });

  const initialPujaType = (() => {
    const v = searchParams.get("pujaType") || "";
    return pujaOptions.some(p => p.value === v) ? v : "";
  })();
  const initialMode = searchParams.get("mode") === "online" ? "online" : "offline";

  const [pujaType, setPujaType] = useState(initialPujaType);
  const [mode, setMode] = useState(initialMode);

  useEffect(() => {
    const params = new URLSearchParams(searchString);
    const v = params.get("pujaType") || "";
    const nextPuja = v && pujaOptions.some(p => p.value === v) ? v : "";
    if (nextPuja !== pujaType) setPujaType(nextPuja);
    const m = params.get("mode");
    const nextMode = m === "online" ? "online" : "offline";
    if (nextMode !== mode) setMode(nextMode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchString]);
  const [date, setDate] = useState("");
  const [timeSlot, setTimeSlot] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [location, setLocation] = useState("");

  const selectedPuja = pujaOptions.find(p => p.value === pujaType);
  const samagriCost = selectedPuja ? Math.round(selectedPuja.price * 0.3) : 0;
  const totalAmount = selectedPuja ? selectedPuja.price + samagriCost : 0;

  const bookingMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/puja-bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pujaType,
          mode,
          date,
          timeSlot,
          contactName,
          contactPhone,
          location: mode === "offline" ? location : "Online",
          totalAmount,
          ...(panditId > 0 ? { panditId } : {}),
        }),
      });
      if (!res.ok) throw new Error("Failed to create booking");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Booking Confirmed!", description: "Your puja has been booked. You will receive a confirmation soon." });
      setPujaType("");
      setDate("");
      setTimeSlot("");
      setContactName("");
      setContactPhone("");
      setLocation("");
    },
    onError: () => {
      toast({ title: "Booking Failed", description: "Something went wrong. Please try again.", variant: "destructive" });
    },
  });

  const canBook = pujaType && date && timeSlot && contactName && contactPhone && (mode === "online" || location);

  return (
    <div className="w-full pb-16 bg-white">
      <PageSeo
        title="Book Pandit Online for Puja at Home — Verified Vedic Pandits in 75+ Cities | Vedic Tatva"
        description="Book a verified Vedic pandit online for Griha Pravesh, Satyanarayan Katha, Lakshmi Puja, Ganesh Sthapana, Rudra Abhishek, Navagraha Shanti, Mundan, Namkaran, Wedding & Pind Daan. Authentic mantras, all samagri included, transparent pricing, shubh muhurat suggestions. Available in Hindi, Tamil, Telugu, Kannada, Bengali, Marathi, Gujarati & 12+ Indian languages across Mumbai, Delhi, Bengaluru, Pune, Hyderabad, Chennai, Kolkata, Ahmedabad, Jaipur, Lucknow."
        keywords="book pandit online, pandit for puja at home, online pandit booking, griha pravesh puja, satyanarayan katha pandit, lakshmi puja pandit, ganesh sthapana puja, rudra abhishek online, navagraha shanti puja, mundan ceremony pandit, namkaran sanskar, vedic wedding pandit, pind daan online, shradh ceremony pandit, hawan online booking, virtual puja online, puja samagri kit, shubh muhurat for puja, hindi pandit, tamil pandit, telugu pandit, marathi pandit, gujarati pandit, bengali pandit, kannada pandit, pandit in mumbai, pandit in delhi ncr, pandit in bangalore, pandit in pune, pandit in hyderabad, pandit in chennai, vedic puja vidhi, smarta pandit, vaishnava pandit, brahmin pandit booking, pandit dakshina, online vedic ritual"
        canonical="/puja"
        ogType="website"
        twitterCard="summary_large_image"
        schemas={[
          breadcrumbListSchema([
            { name: "Home", url: abs("/") },
            { name: "Book a Puja", url: abs("/puja") },
          ]),
          faqPageSchema(PUJA_FAQS.map(f => ({ question: f.q, answer: f.a })), "puja-faq"),
          serviceSchema({
            name: "Online Pandit Booking for Puja at Home",
            description: "Book a verified Vedic pandit online for Griha Pravesh, Satyanarayan Katha, Lakshmi Puja, Ganesh Sthapana, Rudra Abhishek, Navagraha Shanti and 50+ ceremonies. All samagri included, transparent pricing, shubh muhurat suggestions.",
            url: abs("/puja"),
            providerName: "Vedic Tatva",
            areaServed: ["IN", "US", "GB", "CA", "AU", "SG", "AE"],
          }),
        ]}
      />
      <nav aria-label="Breadcrumb" className="bg-[#FBF7EE] border-b border-[#D4AF37]/15">
        <ol className="container mx-auto px-4 py-2 flex items-center gap-1.5 text-[12px] text-[#5a4a3a]/75">
          <li><Link href="/" className="hover:text-[#6D2B35]" data-testid="link-breadcrumb-home">Home</Link></li>
          <li aria-hidden="true"><ChevronRight className="w-3 h-3 inline" /></li>
          <li aria-current="page" className="text-[#6D2B35] font-semibold">Book a Puja</li>
        </ol>
      </nav>
      <PageHero
        eyebrow="Puja Booking"
        title={PUJA_PARENT_H1}
        subtitle="Schedule a home or online puja with verified pandits — authentic vidhi, all samagri included, transparent pricing."
        variant="maroon"
        testId="hero-puja-booking"
      >
        {selectedPandit && (
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 rounded-md px-3 py-1.5" data-testid="text-selected-pandit">
            {selectedPandit.image && (
              <img src={selectedPandit.image} alt={selectedPandit.name} className="w-6 h-6 rounded-md object-cover border border-white/30" />
            )}
            <span className="text-[12px] font-semibold text-white">Booking with {selectedPandit.name}</span>
            <span className="text-[11px] text-white/60">· {selectedPandit.city}</span>
          </div>
        )}
      </PageHero>

      <div className="container mx-auto px-4 mt-6">
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-3">
          {BOOKING_PROMISES.map((item) => (
            <div key={item} className="rounded-md border border-[#D4AF37]/20 bg-[#FBF7EE] px-4 py-4">
              <div className="inline-flex items-center gap-1.5 rounded-md bg-white border border-[#D4AF37]/20 px-2.5 h-8 text-[11px] font-semibold text-[#6D2B35] mb-2">
                <ShieldCheck className="h-3.5 w-3.5 text-[#D4AF37]" />
                Included
              </div>
              <p className="text-sm text-[#5a4a3a]/80 leading-relaxed">{item}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="container mx-auto px-4 mt-8">
        {/* 3-step intro (migrated from homepage) */}
        <div className="max-w-4xl mx-auto mb-8" data-testid="section-puja-3step">
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-2.5 mb-3">
              <span className="h-px w-6 bg-[#D4AF37]" />
              <span className="text-[#D4AF37] text-[10px] uppercase tracking-[0.3em] font-semibold">Simple & Sacred</span>
              <span className="h-px w-6 bg-[#D4AF37]" />
            </div>
            <h2 className="text-xl md:text-2xl font-serif font-semibold text-[#6D2B35] mb-1">Book your puja in 3 simple steps</h2>
            <p className="text-[12px] text-[#5a4a3a]/60">No complexity, no confusion — a seamless ceremony from selection to completion.</p>
          </div>
          <div className="relative">
            <div className="hidden md:block absolute top-1/2 left-12 right-12 h-px bg-[#D4AF37]/20 -translate-y-1/2" aria-hidden="true" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 relative">
              {[
                { step: "01", title: "Select Puja", desc: "Satyanarayan, Griha Pravesh, Navgraha Shanti and more", icon: ScrollText },
                { step: "02", title: "Choose Date", desc: "Pick an auspicious muhurat or a date that suits your family", icon: Calendar },
                { step: "03", title: "Confirm Booking", desc: "Pay securely and get instant confirmation with pandit details", icon: CheckCircle },
              ].map((item) => (
                <div
                  key={item.step}
                  className="relative bg-white rounded-lg border border-[#D4AF37]/20 p-4 md:p-5"
                  data-testid={`puja-step-${item.step}`}
                >
                  <div className="flex items-center gap-2.5 mb-2.5">
                    <div className="w-8 h-8 rounded-md bg-[#FBF7EE] border border-[#D4AF37]/20 flex items-center justify-center shrink-0">
                      <item.icon className="h-4 w-4 text-[#6D2B35]" strokeWidth={1.8} />
                    </div>
                    <span className="text-[10px] uppercase tracking-[0.3em] font-semibold text-[#D4AF37]">Step {item.step}</span>
                  </div>
                  <h3 className="font-serif text-base font-semibold text-[#6D2B35] mb-1 leading-tight">{item.title}</h3>
                  <p className="text-[12px] text-[#5a4a3a]/60 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto mb-8 grid md:grid-cols-3 gap-3">
          {BOOKING_HELP.map((step, index) => (
            <div key={step} className="rounded-md border border-[#D4AF37]/20 bg-white p-4">
              <p className="text-[10px] uppercase tracking-[0.25em] text-[#D4AF37] font-semibold mb-2">Step {index + 1}</p>
              <p className="text-sm text-[#5a4a3a]/75 leading-relaxed">{step}</p>
            </div>
          ))}
        </div>

        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-4">
            <Card className="rounded-lg border border-[#D4AF37]/20 bg-white shadow-none">
              <CardHeader className="border-b border-[#D4AF37]/15 pb-3">
                <CardTitle className="text-base font-serif font-semibold text-[#6D2B35] flex items-center gap-2.5">
                  <span className="text-[10px] uppercase tracking-[0.3em] font-semibold text-[#D4AF37]">Step 01</span>
                  · Select puja details
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Puja Type</label>
                    <Select value={pujaType} onValueChange={setPujaType}>
                      <SelectTrigger className="w-full" data-testid="select-puja-type"><SelectValue placeholder="Select a Puja" /></SelectTrigger>
                      <SelectContent>
                        {pujaOptions.map(p => (
                          <SelectItem key={p.value} value={p.value}>{p.label} - ₹{p.price.toLocaleString()}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Mode</label>
                    <Select value={mode} onValueChange={setMode}>
                      <SelectTrigger className="w-full" data-testid="select-mode"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="offline">At Home / Venue</SelectItem>
                        <SelectItem value="online">Online (Video Call)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Date</label>
                    <div className="relative">
                      <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input type="date" className="pl-9" value={date} onChange={(e) => setDate(e.target.value)} data-testid="input-date" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Time Preference</label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Select value={timeSlot} onValueChange={setTimeSlot}>
                        <SelectTrigger className="pl-9 w-full" data-testid="select-time"><SelectValue placeholder="Select Time" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="morning">Morning (6 AM - 11 AM)</SelectItem>
                          <SelectItem value="afternoon">Afternoon (11 AM - 3 PM)</SelectItem>
                          <SelectItem value="evening">Evening (4 PM - 8 PM)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={`rounded-lg border border-[#D4AF37]/20 bg-white shadow-none ${!pujaType ? "opacity-60" : ""}`}>
              <CardHeader className="border-b border-[#D4AF37]/15 pb-3">
                <CardTitle className="text-base font-serif font-semibold text-[#6D2B35] flex items-center gap-2.5">
                  <span className="text-[10px] uppercase tracking-[0.3em] font-semibold text-[#D4AF37]">Step 02</span>
                  · Contact & location
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5 space-y-4">
                {pujaType ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Your Name</label>
                      <Input placeholder="Full name" value={contactName} onChange={(e) => setContactName(e.target.value)} data-testid="input-contact-name" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Phone Number</label>
                      <Input placeholder="+91 XXXXX XXXXX" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} data-testid="input-contact-phone" />
                    </div>
                    {mode === "offline" && (
                      <div className="md:col-span-2 space-y-2">
                        <label className="text-sm font-medium text-foreground">Address / Venue</label>
                        <Input placeholder="Full address where puja will be performed" value={location} onChange={(e) => setLocation(e.target.value)} data-testid="input-location" />
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Complete step 1 to proceed.</p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="rounded-lg border border-[#D4AF37]/25 bg-white shadow-none sticky top-24">
              <CardHeader className="border-b border-[#D4AF37]/15 pb-3">
                <CardTitle className="text-base font-serif font-semibold text-[#6D2B35]">Booking summary</CardTitle>
                <CardDescription className="text-[12px] text-[#5a4a3a]/60">Your selected puja details</CardDescription>
              </CardHeader>
              <CardContent className="pt-5 space-y-3">
                <div className="flex justify-between items-center text-[13px]">
                  <span className="text-[#5a4a3a]/60">Puja type</span>
                  <span className="font-semibold text-[#5a4a3a] text-right">{selectedPuja?.label || "Not selected"}</span>
                </div>
                {selectedPandit && (
                  <div className="flex justify-between items-center text-[13px]">
                    <span className="text-[#5a4a3a]/60">Pandit</span>
                    <span className="font-semibold text-[#5a4a3a]" data-testid="text-summary-pandit">{selectedPandit.name}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-[13px]">
                  <span className="text-[#5a4a3a]/60">Pandit dakshina</span>
                  <span className="font-semibold text-[#5a4a3a]">{selectedPuja ? `₹${selectedPuja.price.toLocaleString()}` : "₹ --"}</span>
                </div>
                <div className="flex justify-between items-center text-[13px]">
                  <span className="text-[#5a4a3a]/60">Samagri kit</span>
                  <span className="font-semibold text-[#5a4a3a]">{selectedPuja ? `₹${samagriCost.toLocaleString()}` : "Optional"}</span>
                </div>

                <div className="border-t border-[#D4AF37]/20 pt-4 mt-2">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-semibold text-[#5a4a3a] text-[13px]">Estimated total</span>
                    <span className="font-serif font-semibold text-xl text-[#6D2B35]">{selectedPuja ? `₹${totalAmount.toLocaleString()}` : "₹ --"}</span>
                  </div>

                  <Button
                    className="w-full bg-[#6D2B35] hover:bg-[#5a2430] text-white rounded-md h-10 text-[13px] font-semibold"
                    disabled={!canBook || bookingMutation.isPending}
                    onClick={() => requireAuth(
                      () => bookingMutation.mutate(),
                      { title: "Sign in to book", description: "Please sign in to confirm your puja booking" }
                    )}
                    data-testid="btn-confirm-booking"
                  >
                    {bookingMutation.isPending ? "Booking…" : "Confirm booking"}
                  </Button>
                  <div className="mt-3 space-y-2">
                    <p className="text-[11px] text-center text-[#5a4a3a]/55 inline-flex items-center justify-center gap-1 w-full">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> 100% secure checkout
                    </p>
                    <div className="rounded-md border border-[#D4AF37]/15 bg-[#FBF7EE] px-3 py-2 text-[11px] text-[#5a4a3a]/70 leading-relaxed">
                      If you need help choosing the right puja, our team can guide you after booking.
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <PageAPlusContent
          eyebrow="Why Book Your Puja With Vedic Tatva"
          title="Book Pandit Online for Authentic Puja & Vedic Rituals at Home"
          intro="Whether it's Griha Pravesh, Satyanarayan Katha, Lakshmi Puja, Ganesh Sthapana or any life-cycle samskara — book a verified Vedic pandit online and have the puja performed at your home, with all samagri, mantras and vidhi exactly as per scripture."
          trustBadges={[
            { value: "5000+", label: "Verified Pandits" },
            { value: "75+", label: "Cities Covered" },
            { value: "12+", label: "Languages" },
            { value: "4.9", label: "Avg Rating" },
          ]}
          benefits={[
            { icon: ShieldCheck, title: "Verified Vedic Pandits", body: "Every pandit is verified for Sanskrit proficiency, scriptural knowledge and lineage (parampara). Choose by tradition — Smarta, Vaishnava, Shakta, Shaiva or regional." },
            { icon: Flame, title: "All Puja Samagri Included", body: "Optional samagri kit — flowers, fruits, ghee, samidha, kalash and prasad — delivered fresh to your home. Or bring your own." },
            { icon: BookOpen, title: "Authentic Vidhi & Mantras", body: "Every step performed as per shastra — Sankalpa, Ganesh Pujan, Punyahavachan, Kalash Sthapana, main puja, Aarti and Visarjan in correct sequence." },
            { icon: Globe, title: "Multi-Language Pandits", body: "Pandits available in Hindi, English, Sanskrit, Tamil, Telugu, Kannada, Bengali, Marathi, Gujarati, Malayalam, Punjabi & Odia." },
            { icon: Clock, title: "Shubh Muhurat Booking", body: "Auto-suggested shubh muhurat for your puja date — Abhijit, Brahma, Vijaya — ensuring maximum spiritual benefit." },
            { icon: Heart, title: "Transparent Pricing", body: "All-inclusive prices upfront — pandit dakshina, travel, samagri (optional). No hidden charges, no last-minute surprises." },
          ]}
          steps={[
            { title: "Choose Your Puja", body: "Select from Griha Pravesh, Satyanarayan Katha, Lakshmi Puja, Ganesh Sthapana, Navagraha Shanti and 50+ other Vedic rituals." },
            { title: "Pick Date & Muhurat", body: "Choose your preferred date — system suggests the most auspicious muhurat windows for that day." },
            { title: "Select Pandit & Language", body: "Browse verified pandits by tradition, language and reviews. Pick the one whose parampara matches your family." },
            { title: "Confirm & Pay", body: "Pay securely via UPI/card. Pandit confirms within 2 hours. Optional samagri kit delivered the day before." },
          ]}
          faqs={PUJA_FAQS}
          keywordsBlurb="Book pandit online for puja at home — Griha Pravesh, Satyanarayan Katha, Lakshmi Puja, Ganesh Sthapana, Rudra Abhishek, Navagraha Shanti, Mundan, Namkaran, Wedding ceremonies and shradh. Verified Vedic pandits in Mumbai, Delhi, Bengaluru, Pune, Hyderabad, Chennai, Kolkata, Ahmedabad, Jaipur, Lucknow and 75+ cities. Pandits available in Hindi, English, Sanskrit, Tamil, Telugu, Kannada, Marathi, Gujarati, Bengali. All puja samagri delivery included. Transparent pricing, shubh muhurat suggestions, online booking with secure payment."
        />

        <RelatedServicesSection context="puja-booking" currentPath="/puja" />
      </div>
    </div>
  );
}
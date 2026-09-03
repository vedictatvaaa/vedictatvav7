import { useState, useEffect, useMemo } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useSearch } from "wouter";
import { Calendar as CalendarIcon, Clock, CheckCircle2, ShieldCheck, Flame, Heart, Globe, BookOpen, Hash, Copy, Check, Video, Sparkles, Star, MessageCircle, Coins, Zap } from "lucide-react";
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
import { trackPanditSeoEvent } from "@/lib/analytics";
import { PujaDiscoveryHub } from "@/components/puja/PujaDiscoveryHub";
import { STANDARD_PUJA_OPTIONS, resolveStandardPuja } from "@shared/standard-puja-catalogue";

const PUJA_PARENT_H1 = "Book a Verified Pandit for Puja at Home";
type BookingMode = "online" | "offline";

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

const pujaOptions = STANDARD_PUJA_OPTIONS;

export default function PujaBooking() {
  const { toast } = useToast();
  const { requireAuth } = useAuth();
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const panditIdParam = searchParams.get("pandit");
  const panditId = panditIdParam ? parseInt(panditIdParam) : 0;
  const bookingServiceId = Number(searchParams.get("serviceId") || 0);
  const masterServiceId = Number(searchParams.get("masterServiceId") || 0);
  const canonicalCityId = Number(searchParams.get("cityId") || 0);
  const canonicalStateId = Number(searchParams.get("stateId") || 0);
  const bookingPackageId = Number(searchParams.get("packageId") || 0);
  const bookingService = searchParams.get("service")?.trim() || "";
  const bookingSource = searchParams.get("source") === "storefront" ? "storefront" : "booking";
  const customPujaType = bookingPackageId
    ? `package:${bookingPackageId}`
    : bookingServiceId
      ? `service:${bookingServiceId}`
      : bookingService
        ? `service:${bookingService}`
        : "";

  const { data: selectedPandit } = useQuery<Pandit>({
    queryKey: [`/api/pandits/${panditId}`],
    queryFn: () => fetch(`/api/pandits/${panditId}`).then(r => { if (!r.ok) throw new Error("Not found"); return r.json(); }),
    enabled: panditId > 0,
  });
  const { data: selectedStorefront } = useQuery<{
    services?: Array<{ id: number; name: string; slug?: string; price: number }>;
    packages?: Array<{ id: number; name: string; price: number }>;
  }>({
    queryKey: ["/api/storefront", selectedPandit?.slug, "booking-pricing"],
    queryFn: async () => {
      const response = await fetch(`/api/storefront/${encodeURIComponent(selectedPandit!.slug!)}`);
      if (!response.ok) throw new Error("Storefront unavailable");
      return response.json();
    },
    enabled: Boolean(selectedPandit?.slug && (bookingServiceId || bookingPackageId)),
  });

  const initialPujaType = (() => {
    const v = searchParams.get("pujaType") || "";
    return resolveStandardPuja(v)?.value || customPujaType;
  })();
  const initialMode: BookingMode = searchParams.get("mode") === "online" ? "online" : "offline";

  const [pujaType, setPujaType] = useState(initialPujaType);
  const [mode, setMode] = useState<BookingMode>(initialMode);
  const selectedOffering = bookingPackageId
    ? selectedStorefront?.packages?.find(pkg => pkg.id === bookingPackageId)
    : selectedStorefront?.services?.find(service => service.id === bookingServiceId);
  const analyticsSlug = selectedPandit?.slug
    || (bookingServiceId ? selectedStorefront?.services?.find(service => service.id === bookingServiceId)?.slug : undefined)
    || (resolveStandardPuja(pujaType) ? pujaType : undefined);
  const availablePujaOptions = useMemo(() => customPujaType
    ? [...pujaOptions, {
        value: customPujaType,
        label: selectedOffering?.name || bookingService || "Selected Pandit offering",
        price: selectedOffering?.price || selectedPandit?.fees || 5100,
      }]
    : pujaOptions, [bookingService, customPujaType, selectedOffering?.name, selectedOffering?.price, selectedPandit?.fees]);

  useEffect(() => {
    const params = new URLSearchParams(searchString);
    const v = params.get("pujaType") || "";
    const service = params.get("service")?.trim() || "";
    const packageId = Number(params.get("packageId") || 0);
    const serviceId = Number(params.get("serviceId") || 0);
    const standardPuja = resolveStandardPuja(v);
    const nextPuja = packageId
      ? `package:${packageId}`
      : serviceId
        ? `service:${serviceId}`
        : standardPuja
          ? standardPuja.value
        : service
          ? `service:${service}`
          : "";
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

  const selectedPuja = availablePujaOptions.find(p => p.value === pujaType);
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
          ...(bookingServiceId > 0 ? { panditServiceId: bookingServiceId } : {}),
          ...(bookingServiceId > 0 ? {
            masterServiceId,
            cityId: canonicalCityId,
            stateId: canonicalStateId,
          } : {}),
          ...(bookingPackageId > 0 ? { panditPackageId: bookingPackageId } : {}),
        }),
      });
      if (!res.ok) throw new Error("Failed to create booking");
      return res.json();
    },
    onSuccess: () => {
      trackPanditSeoEvent("booking_outcome", {
        slug: analyticsSlug,
        mode,
        source: bookingSource,
        outcome: "success",
      });
      toast({ title: "Booking Confirmed!", description: "Your puja has been booked. You will receive a confirmation soon." });
      setPujaType("");
      setDate("");
      setTimeSlot("");
      setContactName("");
      setContactPhone("");
      setLocation("");
    },
    onError: () => {
      trackPanditSeoEvent("booking_outcome", {
        slug: analyticsSlug,
        mode,
        source: bookingSource,
        outcome: "error",
      });
      toast({ title: "Booking Failed", description: "Something went wrong. Please try again.", variant: "destructive" });
    },
  });

  const canBook = pujaType && date && timeSlot && contactName && contactPhone && (mode === "online" || location);
  const hasBookingContext = Boolean(
    panditIdParam || bookingServiceId || masterServiceId || bookingPackageId || bookingService || searchParams.get("start") === "booking"
  );

  if (!hasBookingContext) return <PujaDiscoveryHub />;

  return (
    <div className="w-full pb-16 bg-white">
      <PageSeo
        title="Online Puja Booking & Pandit Services — Authentic Vedic Rituals | Vedic Tatva"
        description="Book authentic online puja services with experienced Vedic pandits at Vedic Tatva. Home puja, havan, astrology remedies, Satyanarayan, Rudrabhishek, Griha Pravesh, Lakshmi, Navgraha, Marriage, Pitra Dosh & Maha Mrityunjaya — across India and for NRIs worldwide. Live video Sankalp, all samagri included, transparent dakshina, shubh muhurat suggestions, multi-language pandits."
        keywords="online puja booking, book pandit online, online pandit booking, vedic puja services, hindu puja booking, online havan booking, virtual puja services, puja at home booking, certified vedic pandit, astrology puja services, online temple puja, hindu rituals online, vedic rituals booking, spiritual puja services, puja booking India, book Satyanarayan puja online, online griha pravesh puja, marriage puja booking, vastu puja online, Lakshmi puja booking, Ganesh puja online, Navgraha puja booking, Rudrabhishek puja online, Maha Mrityunjaya puja booking, Durga puja pandit booking, online kundli puja remedies, online dosh nivaran puja, online pandit booking in Delhi, online puja services India, best pandit booking website, hindu priest booking near me, book pandit for home puja, temple puja services online, affordable online puja booking services, trusted vedic pandit for home puja, online puja with live video streaming, book experienced hindu pandit online, authentic vedic rituals and pujas, astrology based puja booking platform, online puja for health wealth prosperity, instant puja booking with pandit, online spiritual consultation and puja, complete hindu puja services online, sanatan dharma rituals, vedic spirituality, hindu spiritual healing, divine energy puja, karma cleansing rituals, vedic remedies online, spiritual protection puja, manifestation puja rituals, positive energy havan, chakra healing puja"
        canonical="/online-puja-booking"
        ogType="website"
        twitterCard="summary_large_image"
        schemas={[
          breadcrumbListSchema([
            { name: "Home", url: abs("/") },
            { name: "Book a Puja", url: abs("/online-puja-booking") },
          ]),
          faqPageSchema(PUJA_FAQS.map(f => ({ question: f.q, answer: f.a })), "puja-faq"),
          serviceSchema({
            name: "Online Pandit Booking for Puja at Home",
            description: "Book a verified Vedic pandit online for Griha Pravesh, Satyanarayan Katha, Lakshmi Puja, Ganesh Sthapana, Rudra Abhishek, Navagraha Shanti and 50+ ceremonies. All samagri included, transparent pricing, shubh muhurat suggestions.",
            url: abs("/online-puja-booking"),
            providerName: "Vedic Tatva",
            areaServed: ["IN", "US", "GB", "CA", "AU", "SG", "AE"],
          }),
        ]}
      />
      <nav aria-label="Breadcrumb" className="bg-[#FBF7EE] border-b border-[#D4AF37]/15">
        <ol className="container mx-auto px-4 py-1.5 flex items-center gap-1 text-[11px] sm:text-[12px] text-[#5a4a3a]/75">
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
        bgImage="/attached_assets/heroes/hero-scene-brand.png"
        bgImageAlt="Lakshmi-Ganesha brass idols garlanded with marigolds and glowing brass oil lamps for a Hindu puja"
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

      <div className="container mx-auto px-4 mt-8">
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
                        {availablePujaOptions.map(p => (
                          <SelectItem key={p.value} value={p.value}>{p.label} - ₹{p.price.toLocaleString()}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Mode</label>
                    <Select value={mode} onValueChange={(value) => setMode(value as BookingMode)}>
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

        <WhyVedicTatvaSection />

        <PujaHashtagStrip />

        <DedicatedPujaPagesGrid />

        <RelatedServicesSection context="puja-booking" currentPath="/online-puja-booking" />
      </div>
    </div>
  );
}

const WHY_VEDICTATVA_FEATURES: { icon: any; title: string; body: string }[] = [
  {
    icon: ShieldCheck,
    title: "Trusted Vedic pandits for home puja",
    body: "Every pandit is identity-verified, gotra-traced and rated by 1000+ devotees before they reach your sankalp.",
  },
  {
    icon: Video,
    title: "Online puja with live video streaming",
    body: "Join the puja in real time over WhatsApp or Zoom — see the agni, hear every mantra, give your sankalp from anywhere.",
  },
  {
    icon: Star,
    title: "Book experienced Hindu pandits online",
    body: "Choose from Veda-pathi, Karmakand and Jyotish-trained pandits — most with 15+ years of ritual experience.",
  },
  {
    icon: Sparkles,
    title: "Authentic Vedic rituals and pujas",
    body: "Full Sanskrit mantras, traditional samagri and shastra-correct vidhi — no shortcuts, no apartheid in dharma.",
  },
  {
    icon: BookOpen,
    title: "Astrology-based puja booking platform",
    body: "Tell us your kundli concern — Mangal dosh, Sade Sati, Pitra dosh — we suggest the exact remedial puja and muhurat.",
  },
  {
    icon: Coins,
    title: "Online puja for health, wealth & prosperity",
    body: "Mahalaxmi, Kuber, Mahamrityunjaya, Navagraha and Santan Gopal pujas for every life goal — moksh to grihastha.",
  },
  {
    icon: Zap,
    title: "Instant puja booking with pandit",
    body: "Same-day havan and abhishek slots available across 75+ cities — confirmed within 2 hours, samagri arranged.",
  },
  {
    icon: MessageCircle,
    title: "Online spiritual consultation and puja",
    body: "Free 10-minute jyotishi consultation before every booking — understand the why before you do the puja.",
  },
];

function WhyVedicTatvaSection() {
  return (
    <section
      className="mt-16 mb-12"
      aria-labelledby="why-vedictatva-heading"
      data-testid="section-why-vedictatva"
    >
      <div className="text-center max-w-3xl mx-auto mb-10">
        <div className="text-[10px] uppercase tracking-[0.3em] font-semibold text-[#D4AF37] mb-2">
          Why Vedic Tatva
        </div>
        <h2
          id="why-vedictatva-heading"
          className="text-2xl md:text-3xl font-serif font-semibold text-[#6D2B35] mb-3"
        >
          Complete Hindu puja services online
        </h2>
        <p className="text-[15px] text-[#5a4a3a]/80 leading-relaxed">
          From a 30-minute Lakshmi aarti to a three-day yajna, Vedic Tatva offers
          affordable online puja booking services with verified pandits, transparent
          dakshina and full samagri included — for families in India and NRIs across
          the world.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {WHY_VEDICTATVA_FEATURES.map((f) => {
          const Icon = f.icon;
          return (
            <div
              key={f.title}
              className="rounded-xl bg-[#FBF7EE] border border-[#D4AF37]/25 p-5 hover-elevate"
              data-testid={`card-why-${f.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`}
            >
              <div className="w-10 h-10 rounded-lg bg-[#6D2B35] text-[#D4AF37] flex items-center justify-center mb-3">
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="text-[15px] font-serif font-semibold text-[#6D2B35] mb-1.5 leading-snug">
                {f.title}
              </h3>
              <p className="text-[13px] text-[#5a4a3a]/75 leading-relaxed">{f.body}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

const PUJA_HASHTAGS = [
  "#VedicTatva", "#OnlinePuja", "#PanditBooking", "#HinduRituals", "#VedicPuja",
  "#SanatanDharma", "#PujaBooking", "#OnlineHavan", "#SpiritualIndia", "#AstrologyRemedies",
  "#NRIPuja", "#PujaAtHome",
];

function PujaHashtagStrip() {
  const { toast } = useToast();
  const [copied, setCopied] = useState<string | null>(null);
  const copyText = async (text: string, key: string, successTitle: string, successDesc: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied(key);
      toast({ title: successTitle, description: successDesc });
      setTimeout(() => setCopied(null), 1400);
    } catch {
      toast({ title: "Copy failed", description: "Please copy manually", variant: "destructive" });
    }
  };
  const handleCopy = (tag: string) => copyText(tag, tag, "Copied", `${tag} copied to clipboard`);
  const handleCopyAll = () => copyText(PUJA_HASHTAGS.join(" "), "all", "All hashtags copied", `${PUJA_HASHTAGS.length} hashtags copied`);
  return (
    <section className="mt-16 mb-12" aria-labelledby="puja-hashtag-heading" data-testid="puja-hashtag-strip">
      <div className="rounded-2xl bg-[#FBF7EE] border border-[#D4AF37]/25 p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
          <div>
            <div className="text-[10px] uppercase tracking-[0.3em] font-semibold text-[#D4AF37] mb-1">Share your puja</div>
            <h2 id="puja-hashtag-heading" className="text-xl font-serif font-semibold text-[#6D2B35] flex items-center gap-2">
              <Hash className="w-5 h-5" /> Tag your moments
            </h2>
            <p className="text-[13px] text-[#5a4a3a]/70 mt-1">Share photos from your puja with these tags so other devotees can find and bless your journey.</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyAll}
            className="border-[#6D2B35]/30 text-[#6D2B35] hover:bg-[#6D2B35]/5"
            data-testid="btn-copy-all-hashtags"
          >
            {copied === "all" ? <Check className="w-4 h-4 mr-1.5" /> : <Copy className="w-4 h-4 mr-1.5" />}
            Copy all
          </Button>
        </div>
        <div className="sr-only" role="status" aria-live="polite" data-testid="hashtag-copy-status">
          {copied ? (copied === "all" ? "All hashtags copied to clipboard" : `${copied} copied to clipboard`) : ""}
        </div>
        <div className="flex flex-wrap gap-2">
          {PUJA_HASHTAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => handleCopy(tag)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold bg-white border border-[#D4AF37]/30 text-[#6D2B35] hover-elevate active-elevate-2 transition"
              data-testid={`btn-hashtag-${tag.replace("#", "").toLowerCase()}`}
            >
              {copied === tag ? <Check className="w-3 h-3 text-emerald-600" /> : null}
              {tag}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

const DEDICATED_PUJA_PAGES: Array<{ href: string; title: string; blurb: string; tag: string }> = [
  { href: "/satyanarayan-puja", title: "Satyanarayan Puja", blurb: "Purnima vrat, full katha, sapaad bhog. From ₹1,100.", tag: "Most Booked" },
  { href: "/rudrabhishek-puja", title: "Rudrabhishek", blurb: "Veda-pathi pandit, Rudri Paath, abhishek. From ₹2,100.", tag: "Shiva" },
  { href: "/griha-pravesh-puja", title: "Griha Pravesh", blurb: "Vastu shanti, kalash sthapana, full housewarming vidhi.", tag: "New Home" },
  { href: "/lakshmi-puja", title: "Lakshmi Puja", blurb: "Diwali, Friday weekly puja, Sri Sukta paath. Wealth & abundance.", tag: "Wealth" },
  { href: "/navgraha-puja", title: "Navgraha Puja", blurb: "Sade Sati, Mangal Dosha, planetary shanti homa.", tag: "Dosha" },
  { href: "/marriage-puja", title: "Marriage Puja", blurb: "Vivah sanskar, kanyadaan, saptapadi, multi-language pandit.", tag: "Wedding" },
  { href: "/pitra-dosh-puja", title: "Pitra Dosh Puja", blurb: "Tripindi shradh, Narayan Bali, ancestral peace.", tag: "Ancestral" },
  { href: "/maha-mrityunjaya-jaap", title: "Maha Mrityunjaya Jaap", blurb: "1.25 lakh / 1 crore jaap for health, longevity, protection.", tag: "Healing" },
];

function DedicatedPujaPagesGrid() {
  return (
    <section className="mt-12 mb-8" aria-labelledby="dedicated-pages-heading" data-testid="dedicated-puja-pages">
      <div className="text-center mb-6">
        <div className="text-[10px] uppercase tracking-[0.3em] font-semibold text-[#D4AF37] mb-1">Dedicated Puja Guides</div>
        <h2 id="dedicated-pages-heading" className="text-2xl font-serif font-semibold text-[#6D2B35]">Explore our most-booked pujas in detail</h2>
        <p className="text-[13px] text-[#5a4a3a]/70 mt-2 max-w-2xl mx-auto">Each page covers the vidhi, samagri, dakshina range, FAQs and lets you book directly with a verified pandit.</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {DEDICATED_PUJA_PAGES.map((p) => (
          <Link key={p.href} href={p.href} className="block" data-testid={`link-puja-${p.href.replace("/", "")}`}>
            <div className="rounded-lg border border-[#D4AF37]/25 bg-white p-4 h-full hover-elevate transition">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-serif font-semibold text-[#6D2B35] text-[14px] leading-tight">{p.title}</h3>
                <span className="text-[9px] uppercase tracking-wider font-semibold text-[#D4AF37] shrink-0">{p.tag}</span>
              </div>
              <p className="text-[12px] text-[#5a4a3a]/70 leading-snug">{p.blurb}</p>
              <div className="text-[11px] font-semibold text-[#6D2B35] mt-3 inline-flex items-center gap-1">
                Learn more <ChevronRight className="w-3 h-3" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

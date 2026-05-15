import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Heart, HandHeart, ChevronRight, Check, Sparkles, Phone, Mail, User, ShieldCheck, Receipt, Globe, Users, Flame, BookOpen } from "lucide-react";
import PageAPlusContent from "@/components/PageAPlusContent";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import type { Donation } from "@shared/schema";
import { Link } from "wouter";
import { RelatedServicesSection } from "@/components/RelatedServices";

export default function DonationsPage() {
  const { toast } = useToast();
  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [donorForm, setDonorForm] = useState({
    name: "", email: "", phone: "", gotra: "", dedicatedTo: "", occasion: "", message: "",
  });

  const { data: donationsList, isLoading } = useQuery<Donation[]>({
    queryKey: ["/api/donations"],
    queryFn: () => fetch("/api/donations").then(r => r.json()),
  });

  const donateMut = useMutation({
    mutationFn: (data: any) =>
      fetch("/api/donation-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then(r => { if (!r.ok) throw new Error("Failed"); return r.json(); }),
    onSuccess: () => {
      toast({ title: "Donation Received!", description: "Thank you for your generous contribution. May the divine bless you." });
      setSelectedDonation(null);
      setSelectedAmount(null);
      setCustomAmount("");
      setDonorForm({ name: "", email: "", phone: "", gotra: "", dedicatedTo: "", occasion: "", message: "" });
    },
    onError: () => toast({ title: "Error", description: "Failed to process donation. Please try again.", variant: "destructive" }),
  });

  function handleDonate() {
    const amount = selectedAmount || Number(customAmount);
    if (!donorForm.name || !donorForm.email || !amount) {
      toast({ title: "Required Fields", description: "Please fill in your name, email, and donation amount.", variant: "destructive" });
      return;
    }
    if (selectedDonation && amount < selectedDonation.minAmount) {
      toast({ title: "Minimum Amount", description: `Minimum donation is ₹${selectedDonation.minAmount}`, variant: "destructive" });
      return;
    }
    donateMut.mutate({
      donationId: selectedDonation!.id,
      donationName: selectedDonation!.name,
      donorName: donorForm.name,
      donorEmail: donorForm.email,
      donorPhone: donorForm.phone || null,
      amount,
      gotra: donorForm.gotra || null,
      dedicatedTo: donorForm.dedicatedTo || null,
      occasion: donorForm.occasion || null,
      message: donorForm.message || null,
    });
  }

  const activeDonations = donationsList?.filter(d => d.active).sort((a, b) => a.sortOrder - b.sortOrder) || [];

  return (
    <div className="bg-white min-h-screen pb-20">
      {/* Slim hero */}
      <div className="bg-[#6D2B35] border-b border-[#D4AF37]/30 text-white">
        <div className="container mx-auto px-4 py-12 sm:py-14 text-center">
          <div className="flex items-center justify-center gap-2.5 mb-3">
            <span className="h-px w-8 bg-[#D4AF37]/60" />
            <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] uppercase tracking-[0.3em] text-[#D4AF37] font-semibold">
              <HandHeart className="w-3 h-3" /> Sacred Daan
            </span>
            <span className="h-px w-8 bg-[#D4AF37]/60" />
          </div>
          <h1 className="text-3xl md:text-4xl font-serif mb-3 font-semibold tracking-tight" data-testid="text-donations-title">Sacred Donations</h1>
          <p className="text-sm sm:text-[15px] text-white/75 max-w-2xl mx-auto leading-relaxed">
            Earn divine merit through the sacred act of giving. Every donation supports dharma, compassion, and spiritual service.
          </p>
          <div className="flex items-center justify-center gap-3 sm:gap-5 mt-6 text-[11px] sm:text-xs text-white/65 flex-wrap">
            <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-[#D4AF37]" strokeWidth={2.2} /> Tax Deductible</span>
            <span className="hidden sm:inline text-white/30">·</span>
            <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-[#D4AF37]" strokeWidth={2.2} /> 80G Certified · Reg. 80G/2021/AABCV1234F</span>
            <span className="hidden sm:inline text-white/30">·</span>
            <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-[#D4AF37]" strokeWidth={2.2} /> 100% Transparent</span>
            <span className="hidden sm:inline text-white/30">·</span>
            <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-[#D4AF37]" strokeWidth={2.2} /> Receipt Provided</span>
          </div>
        </div>
      </div>

      <nav className="container mx-auto px-4 py-3 text-xs flex items-center gap-1.5 text-[#5a4a3a]/65">
        <Link href="/" className="hover:text-[#6D2B35] transition-colors">Home</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-[#6D2B35] font-semibold">Donations</span>
      </nav>

      <div className="container mx-auto px-4 mt-3">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-80 rounded-md" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {activeDonations.map((donation) => (
              <div
                key={donation.id}
                className="group cursor-pointer bg-white border border-[#D4AF37]/25 rounded-md hover:border-[#D4AF37]/55 transition-colors overflow-hidden h-full flex flex-col"
                onClick={() => { setSelectedDonation(donation); setSelectedAmount(null); setCustomAmount(""); }}
                data-testid={`donation-card-${donation.id}`}
              >
                <div className="aspect-video bg-[#FBF7EE] overflow-hidden relative border-b border-[#D4AF37]/15">
                  <img
                    src={donation.image}
                    alt={donation.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="bg-[#D4AF37] text-[#6D2B35] text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">
                      {donation.category}
                    </span>
                  </div>
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-[#6D2B35]/90 via-[#6D2B35]/40 to-transparent p-4">
                    <h3 className="font-serif text-lg text-white font-semibold tracking-tight">{donation.name}</h3>
                    {donation.nameHindi && (
                      <span className="text-white/75 text-xs">{donation.nameHindi}</span>
                    )}
                  </div>
                </div>
                <div className="p-4 sm:p-5 flex-grow flex flex-col">
                  <p className="text-sm text-[#5a4a3a]/75 leading-relaxed flex-grow">
                    {donation.description}
                  </p>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <span className="text-xs text-[#5a4a3a]/60">Min: <span className="font-semibold text-[#6D2B35]">₹{donation.minAmount}</span></span>
                    <Button size="sm" className="bg-[#6D2B35] text-[#D4AF37] hover:bg-[#5a1f29] rounded-md h-9 px-4 text-[13px] font-semibold" data-testid={`btn-donate-${donation.id}`}>
                      <Heart className="h-3.5 w-3.5 mr-1.5" />
                      Donate
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <section className="mt-14 text-center">
          <div className="max-w-2xl mx-auto bg-[#FBF7EE] border border-[#D4AF37]/25 rounded-md p-8 sm:p-10">
            <div className="w-12 h-12 rounded-md bg-white border border-[#D4AF37]/30 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="h-5 w-5 text-[#D4AF37]" strokeWidth={1.6} />
            </div>
            <div className="flex items-center justify-center gap-2.5 mb-2">
              <span className="h-px w-6 bg-[#D4AF37]" />
              <span className="text-[10px] uppercase tracking-[0.3em] text-[#D4AF37] font-semibold">Wisdom</span>
              <span className="h-px w-6 bg-[#D4AF37]" />
            </div>
            <h2 className="text-2xl font-serif text-[#6D2B35] mb-3 font-semibold tracking-tight">The Power of Daan</h2>
            <p className="text-sm sm:text-[15px] text-[#5a4a3a]/75 leading-relaxed">
              In the Vedic tradition, Daan (donation) is one of the most powerful ways to earn spiritual merit.
              The Bhagavad Gita teaches that selfless giving purifies the heart and brings one closer to the divine.
              Every act of charity, no matter how small, creates ripples of positive karma.
            </p>
          </div>
        </section>

        <PageAPlusContent
          eyebrow="Why Donate Through Vedic Tatva"
          title="Online Donations to Verified Temples, Cows & Sacred Causes"
          intro="Daan (charitable giving) is the highest dharma in Sanatan tradition. Vedic Tatva connects you directly with verified temples, gaushalas, ashrams and Vedic schools across India — every rupee tracked, every donation receipted, every cause sacred. Earn punya, balance karma, and support living traditions."
          trustBadges={[
            { value: "100%", label: "To Cause" },
            { value: "80G", label: "Tax Receipt" },
            { value: "500+", label: "Verified NGOs" },
            { value: "Live", label: "Impact Reports" },
          ]}
          benefits={[
            { icon: ShieldCheck, title: "Verified Recipients", body: "Every temple, gaushala and ashram is personally verified — registered trusts with audited accounts. Your daan reaches genuine causes." },
            { icon: Receipt, title: "80G Tax Benefits", body: "Eligible donations come with instant 80G receipts — claim up to 50% tax deduction on your contribution to registered religious trusts." },
            { icon: HandHeart, title: "Gau Seva & Annadan", body: "Sponsor cow protection (gau seva), feed the hungry (annadan), or fund Sanskrit education — choose the seva that resonates with you." },
            { icon: Flame, title: "Temple Restoration", body: "Help restore ancient temples, fund daily aartis, sponsor diyas and contribute to mahaprasad — keep living traditions alive." },
            { icon: Users, title: "Community Impact", body: "See real outcomes — number of cows fed, meals served, students educated, temples restored — every quarter, transparently reported." },
            { icon: Globe, title: "Pan-India Causes", body: "Donate to sacred sites from Kashi to Rameshwaram, Vrindavan to Tirupati — distance no longer limits your seva." },
          ]}
          steps={[
            { title: "Choose Your Cause", body: "Browse verified causes — temple seva, gaushala, annadan, Sanskrit education or natural disaster relief." },
            { title: "Select Donation Amount", body: "Pick a preset amount or enter your own. Even ₹11 makes a difference — every rupee carries punya." },
            { title: "Pay Securely", body: "Pay via UPI, card or netbanking — secured by Razorpay. Instant confirmation by SMS and email." },
            { title: "Receive 80G Receipt", body: "Download your tax-exemption receipt instantly. Track impact updates from the recipient organisation." },
          ]}
          faqs={[
            { q: "Is my donation tax deductible under 80G?", a: "Yes — donations to our partnered registered trusts qualify for 50% tax deduction under Section 80G of the Income Tax Act. The 80G receipt is issued instantly and emailed to you for your tax filing." },
            { q: "How do I know my donation actually reaches the temple/cause?", a: "Every recipient is a personally verified registered trust with audited accounts. We share quarterly impact reports — number of cows fed, meals served, students educated, temples restored — directly from the recipient." },
            { q: "What is the minimum donation amount?", a: "There is no minimum — even ₹11 (a sacred number in Vedic tradition) is welcomed. The intent (sankalp) matters more than the amount. Most devotees donate between ₹101 and ₹5,001." },
            { q: "Can I donate anonymously?", a: "Yes — you can choose to keep your donation anonymous on public lists, while still receiving your 80G receipt for tax purposes. The recipient organisation will only see your name if you opt to share it." },
            { q: "What types of causes can I support?", a: "Temple seva (daily aarti, diya, mahaprasad), gau seva (cow protection and feeding), annadan (feeding the hungry), Sanskrit and Vedic education for children, ashram support and emergency disaster relief for sacred communities." },
            { q: "Can I make recurring monthly donations?", a: "Yes — set up monthly recurring daan via UPI AutoPay. Many devotees commit to monthly gau seva (₹501/month feeds one cow) or monthly annadan (₹1,001/month feeds 50 people)." },
            { q: "Is the payment secure?", a: "All payments are processed via Razorpay with bank-grade encryption. We never store your card or UPI details. You'll get instant SMS and email confirmation." },
            { q: "Why donate online instead of visiting the temple?", a: "Online daan ensures 100% reaches the verified cause (no middlemen), gives you an instant tax receipt, lets you support distant temples (Kashi, Tirupati, Vrindavan) and provides transparent impact tracking — all impossible with cash donation." },
          ]}
          keywordsBlurb="Donate online to verified temples, gaushalas and ashrams across India. Online daan for gau seva, annadan, temple seva, Sanskrit education and Vedic schools. 80G tax-exempt donations to Tirupati, Kashi Vishwanath, Vrindavan, Rameshwaram, Shirdi, Ujjain Mahakaleshwar and 500+ sacred sites. Sponsor cow protection, feed the hungry, fund daily aarti, mahaprasad, diya seva and Vedic education. Earn punya through transparent, receipted online donations."
        />

        <RelatedServicesSection context="donation" currentPath="/donations" />
      </div>

      <Dialog open={!!selectedDonation} onOpenChange={(open) => { if (!open) setSelectedDonation(null); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto rounded-md border-[#D4AF37]/30">
          {selectedDonation && (
            <>
              <DialogHeader>
                <DialogTitle className="text-[#6D2B35] font-serif text-lg flex items-center gap-2 font-semibold">
                  <HandHeart className="h-5 w-5 text-[#D4AF37]" />
                  {selectedDonation.name}
                  {selectedDonation.nameHindi && <span className="text-sm font-normal text-[#5a4a3a]/65">({selectedDonation.nameHindi})</span>}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 mt-2">
                {selectedDonation.longDescription && (
                  <p className="text-sm text-[#5a4a3a]/75 leading-relaxed">{selectedDonation.longDescription}</p>
                )}

                {selectedDonation.benefitsText && (
                  <div className="bg-[#FBF7EE] border border-[#D4AF37]/30 rounded-md p-3">
                    <p className="text-sm text-[#6D2B35] italic">{selectedDonation.benefitsText}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-[0.25em] font-bold text-[#6D2B35]">Select Amount</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedDonation.suggestedAmounts?.map((amt) => (
                      <button
                        key={amt}
                        onClick={() => { setSelectedAmount(Number(amt)); setCustomAmount(""); }}
                        className={`p-2.5 rounded-md border text-center font-bold text-sm transition-colors ${
                          selectedAmount === Number(amt)
                            ? "border-[#D4AF37] bg-[#FBF7EE] text-[#6D2B35]"
                            : "border-[#D4AF37]/25 hover:border-[#D4AF37]/55 text-[#5a4a3a]"
                        }`}
                        data-testid={`donation-amt-${amt}`}
                      >
                        ₹{Number(amt).toLocaleString()}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-[#5a4a3a]/55">or</span>
                    <Input
                      type="number"
                      placeholder={`Custom amount (min ₹${selectedDonation.minAmount})`}
                      value={customAmount}
                      onChange={(e) => { setCustomAmount(e.target.value); setSelectedAmount(null); }}
                      className="flex-1 h-10 rounded-md border-[#D4AF37]/30 text-sm"
                      data-testid="input-custom-donation"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-[10px] uppercase tracking-[0.25em] font-bold text-[#6D2B35]">Donor Details</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[11px] text-[#5a4a3a]/70 font-medium">Full Name *</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#5a4a3a]/45" />
                        <Input className="pl-9 h-10 rounded-md border-[#D4AF37]/30 text-sm" placeholder="Your name" value={donorForm.name} onChange={(e) => setDonorForm(p => ({ ...p, name: e.target.value }))} data-testid="input-donor-name" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] text-[#5a4a3a]/70 font-medium">Email *</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#5a4a3a]/45" />
                        <Input className="pl-9 h-10 rounded-md border-[#D4AF37]/30 text-sm" type="email" placeholder="Email" value={donorForm.email} onChange={(e) => setDonorForm(p => ({ ...p, email: e.target.value }))} data-testid="input-donor-email" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] text-[#5a4a3a]/70 font-medium">Phone</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#5a4a3a]/45" />
                        <Input className="pl-9 h-10 rounded-md border-[#D4AF37]/30 text-sm" placeholder="Phone" value={donorForm.phone} onChange={(e) => setDonorForm(p => ({ ...p, phone: e.target.value }))} data-testid="input-donor-phone" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] text-[#5a4a3a]/70 font-medium">Gotra</Label>
                      <Input className="h-10 rounded-md border-[#D4AF37]/30 text-sm" placeholder="Your gotra" value={donorForm.gotra} onChange={(e) => setDonorForm(p => ({ ...p, gotra: e.target.value }))} data-testid="input-donor-gotra" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-[#5a4a3a]/70 font-medium">Dedicated To (optional)</Label>
                    <Input className="h-10 rounded-md border-[#D4AF37]/30 text-sm" placeholder="In memory or honor of..." value={donorForm.dedicatedTo} onChange={(e) => setDonorForm(p => ({ ...p, dedicatedTo: e.target.value }))} data-testid="input-dedicated-to" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-[#5a4a3a]/70 font-medium">Occasion (optional)</Label>
                    <Input className="h-10 rounded-md border-[#D4AF37]/30 text-sm" placeholder="Birthday, anniversary, festival..." value={donorForm.occasion} onChange={(e) => setDonorForm(p => ({ ...p, occasion: e.target.value }))} data-testid="input-occasion" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-[#5a4a3a]/70 font-medium">Message (optional)</Label>
                    <Input className="h-10 rounded-md border-[#D4AF37]/30 text-sm" placeholder="Any special prayer or message" value={donorForm.message} onChange={(e) => setDonorForm(p => ({ ...p, message: e.target.value }))} data-testid="input-donation-message" />
                  </div>
                </div>

                {(selectedAmount || customAmount) && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-md p-4 text-center">
                    <p className="text-[11px] uppercase tracking-wider text-emerald-700 font-semibold">Your Donation</p>
                    <p className="text-3xl font-bold text-emerald-800 font-serif mt-0.5">₹{(selectedAmount || Number(customAmount)).toLocaleString()}</p>
                    <p className="text-xs text-emerald-700/80 mt-1">for {selectedDonation.name}</p>
                  </div>
                )}

                <Button
                  onClick={handleDonate}
                  disabled={donateMut.isPending || (!selectedAmount && !customAmount)}
                  className="w-full bg-[#6D2B35] text-[#D4AF37] hover:bg-[#5a1f29] font-semibold text-[13px] h-12 rounded-md gap-2"
                  data-testid="btn-confirm-donate"
                >
                  <Heart className="h-4 w-4" />
                  {donateMut.isPending ? "Processing..." : "Donate with Blessings"}
                </Button>

                <p className="text-[11px] text-center text-[#5a4a3a]/55">
                  Your donation receipt will be sent to your email. All donations are tax-deductible under Section 80G.
                </p>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

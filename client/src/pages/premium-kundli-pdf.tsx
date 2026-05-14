import { useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  CheckCircle2, Loader2, FileText, Sparkles, ScrollText, BookOpen,
  ShieldCheck, Mail, Star, Clock, IndianRupee, Lock, KeyRound,
} from "lucide-react";
import { PageHero, SectionHeader } from "@/components/ui/section-primitives";

declare global {
  interface Window { Razorpay: any }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (document.getElementById("razorpay-script")) { resolve(true); return; }
    const script = document.createElement("script");
    script.id = "razorpay-script";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

const PRICE_INR = 501;

const FEATURES = [
  { icon: ScrollText, title: "Detailed birth-chart PDF", body: "9-page premium report covering Lagna, Moon Sign, Sun Sign, all 12 Bhavas and Navamsa (D9)." },
  { icon: BookOpen, title: "Vimshottari Dasha", body: "Your complete 120-year dasha cycle with the current Mahadasha, Antardasha and Pratyantardasha period." },
  { icon: Sparkles, title: "Doshas & Yogas", body: "Manglik, Kalsarpa, Sade Sati analysis plus all classical yogas (Gaja Kesari, Pancha Mahapurusha and more)." },
  { icon: Star, title: "Lucky elements", body: "Personalised lucky number, colour, day, gemstone, metal and direction based on your janma nakshatra lord." },
  { icon: ShieldCheck, title: "Authentic Vedic computation", body: "Powered by the Swiss Ephemeris with Lahiri ayanamsa — the standard sidereal method used across India." },
  { icon: Mail, title: "Delivered to your inbox", body: "PDF report emailed to you immediately after payment — also downloadable from your order link." },
];

// Same DDMMYYYY derivation as the backend's `derivePdfPassword` — used purely to
// display the password to the user on the success screen so they know how to open
// their attached PDF. Server is the source of truth.
function derivePdfPassword(birthDate: string): string {
  const [y, m, d] = (birthDate || "").split("-");
  if (!y || !m || !d) return "";
  return `${d.padStart(2, "0")}${m.padStart(2, "0")}${y.padStart(4, "0")}`;
}

export default function PremiumKundliPDF() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState<{ orderId: number; downloadToken: string; password: string } | null>(null);

  // Pre-fill from the logged-in user's profile so they don't re-type info on each purchase.
  const [form, setForm] = useState({
    fullName: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    gender: "Male",
    birthDate: user?.birthDate || "",
    birthTime: (user as any)?.birthTime || "",
    birthCity: user?.city || "",
    language: "English",
  });

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((s) => ({ ...s, [k]: v }));

  function validate(): string | null {
    if (!form.fullName.trim() || form.fullName.trim().length < 2) return "Please enter your full name";
    if (!form.email.trim() || !/^\S+@\S+\.\S+$/.test(form.email)) return "Please enter a valid email address";
    if (!form.phone.trim() || form.phone.replace(/\D/g, "").length < 10) return "Please enter a valid phone number";
    if (!form.birthDate) return "Please enter your date of birth";
    if (!form.birthTime) return "Please enter your time of birth";
    if (!form.birthCity.trim()) return "Please enter your place of birth (city)";
    return null;
  }

  async function handlePayAndGenerate(e: React.FormEvent) {
    e.preventDefault();
    const err = validate();
    if (err) { toast({ title: "Please complete the form", description: err, variant: "destructive" }); return; }

    setSubmitting(true);
    try {
      const scriptOk = await loadRazorpayScript();
      if (!scriptOk) {
        toast({ title: "Payment gateway error", description: "Could not load the payment gateway. Please try again.", variant: "destructive" });
        setSubmitting(false);
        return;
      }

      // Step 1: create order on our server (also creates the PDF kundli order row).
      // When the buyer is signed in, attach their userId so the report appears in
      // their dashboard. The server re-verifies the userId↔email pairing.
      const createRes = await fetch("/api/kundli-pdf/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, userId: user?.id }),
      });
      const orderData = await createRes.json();
      if (!createRes.ok) throw new Error(orderData.message || "Failed to create order");

      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        name: "Vedic Tatva",
        description: "Premium Vedic Kundli (PDF report)",
        order_id: orderData.razorpayOrderId,
        prefill: { name: form.fullName, email: form.email, contact: form.phone },
        theme: { color: "#6D2B35" },
        handler: async function (response: any) {
          try {
            const verifyRes = await fetch("/api/kundli-pdf/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                kundliOrderId: orderData.kundliOrderId,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              setCompleted({
                orderId: orderData.kundliOrderId,
                downloadToken: orderData.downloadToken,
                password: derivePdfPassword(form.birthDate),
              });
              toast({ title: "Payment successful", description: "Your premium kundli is being generated and will be emailed to you shortly." });
            } else {
              toast({ title: "Payment verification failed", description: verifyData.message || "Please contact support.", variant: "destructive" });
            }
          } catch (verr: any) {
            toast({ title: "Verification error", description: verr?.message || "Please contact support.", variant: "destructive" });
          } finally {
            setSubmitting(false);
          }
        },
        modal: { ondismiss: () => setSubmitting(false) },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (resp: any) {
        toast({ title: "Payment failed", description: resp.error?.description || "Please try again.", variant: "destructive" });
        setSubmitting(false);
      });
      rzp.open();
    } catch (e: any) {
      toast({ title: "Something went wrong", description: e?.message || "Please try again.", variant: "destructive" });
      setSubmitting(false);
    }
  }

  if (completed) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16 max-w-2xl">
          <Card>
            <CardContent className="p-10 text-center space-y-5">
              <CheckCircle2 className="w-14 h-14 text-primary mx-auto" />
              <h1 className="font-serif text-3xl text-primary" data-testid="text-kundli-success-title">
                Your Premium Kundli is on its way
              </h1>
              <p className="text-muted-foreground leading-relaxed">
                Thank you, <span className="font-semibold text-foreground">{form.fullName}</span>. We have received your payment and are computing your full Vedic birth chart now.
                The detailed PDF report will be emailed to <span className="font-semibold text-foreground">{form.email}</span> within the next few minutes.
              </p>
              <div className="bg-muted/40 border rounded-md p-4 text-sm text-left space-y-1.5">
                <p><span className="text-muted-foreground">Order Reference:</span> <span className="font-mono font-medium">VTK-{completed.orderId}</span></p>
                <p><span className="text-muted-foreground">Delivery:</span> Email + private download link</p>
                <p><span className="text-muted-foreground">Computation method:</span> Swiss Ephemeris · Lahiri ayanamsa</p>
              </div>

              <div className="rounded-md border border-[#D4AF37]/40 bg-[#FFF8E1] p-4 text-left space-y-1.5">
                <p className="flex items-center gap-2 font-semibold text-[#6D2B35] text-sm">
                  <Lock className="w-4 h-4" /> Your PDF is password protected
                </p>
                <p className="text-sm text-[#5a4a3a] leading-relaxed">
                  Use your <strong>date of birth in DDMMYYYY</strong> format to open the PDF.
                </p>
                {completed.password && (
                  <p className="text-sm text-[#5a4a3a]">
                    Your password: <span className="font-mono font-semibold tracking-wider bg-white px-2 py-0.5 rounded border" data-testid="text-pdf-password">{completed.password}</span>
                  </p>
                )}
              </div>

              {user && (
                <p className="text-xs text-muted-foreground flex items-center justify-center gap-1.5 pt-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Saved to your account · always accessible from <button onClick={() => setLocation("/my-profile")} className="underline underline-offset-2 hover:text-primary" data-testid="link-my-profile">My Profile</button>.
                </p>
              )}
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <Button asChild data-testid="button-download-kundli">
                  <a href={`/api/kundli-pdf/download/${completed.downloadToken}`} target="_blank" rel="noreferrer">
                    <FileText className="w-4 h-4 mr-2" /> Download PDF
                  </a>
                </Button>
                <Button variant="outline" onClick={() => setLocation("/")} data-testid="button-back-home">
                  Back to Home
                </Button>
              </div>
              <p className="text-xs text-muted-foreground pt-3">
                If the PDF does not arrive within 10 minutes, please check your spam folder or write to ecom@vedictatva.com.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHero
        eyebrow="Premium Service"
        title="Premium PDF Kundli — Just ₹501"
        subtitle="A detailed, traditionally computed Vedic birth-chart report — delivered as a beautifully designed PDF directly to your email within minutes."
      />

      <div className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-10 max-w-6xl mx-auto items-start">
          {/* Left — Features & details */}
          <div className="space-y-7">
            <SectionHeader
              align="left"
              title="What you get in your premium report"
              subtitle="A comprehensive 9-page Vedic kundli prepared with the same astronomical rigour used by traditional acharyas."
            />
            <div className="grid sm:grid-cols-2 gap-4">
              {FEATURES.map((f) => (
                <div key={f.title} className="flex gap-3 p-4 border rounded-md bg-card">
                  <div className="shrink-0 w-9 h-9 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                    <f.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground" data-testid={`text-feature-${f.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}>{f.title}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed mt-0.5">{f.body}</p>
                  </div>
                </div>
              ))}
            </div>

            <Card>
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-2 text-primary font-semibold">
                  <Clock className="w-4 h-4" /> Delivery Timeline
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  After successful payment, your PDF report is generated within 1–2 minutes and sent to your registered email. You can also download it instantly from the confirmation page.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Right — Order form */}
          <Card className="sticky top-24">
            <CardContent className="p-6 space-y-5">
              <div className="flex items-baseline justify-between gap-2">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">One-time</p>
                  <h2 className="font-serif text-2xl text-primary">Premium Kundli</h2>
                </div>
                <div className="text-right">
                  <div className="flex items-center text-3xl font-bold text-primary" data-testid="text-kundli-price">
                    <IndianRupee className="w-6 h-6" />{PRICE_INR}
                  </div>
                  <p className="text-xs text-muted-foreground">Inclusive of all taxes</p>
                </div>
              </div>

              <form onSubmit={handlePayAndGenerate} className="space-y-3">
                <div>
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName" value={form.fullName} onChange={(e) => set("fullName", e.target.value)}
                    placeholder="As per official records" data-testid="input-fullname"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)}
                      placeholder="you@example.com" data-testid="input-email"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone *</Label>
                    <Input
                      id="phone" value={form.phone} onChange={(e) => set("phone", e.target.value)}
                      placeholder="10-digit mobile" data-testid="input-phone"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="gender">Gender</Label>
                    <Select value={form.gender} onValueChange={(v) => set("gender", v)}>
                      <SelectTrigger id="gender" data-testid="select-gender"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="language">Report Language</Label>
                    <Select value={form.language} onValueChange={(v) => set("language", v)}>
                      <SelectTrigger id="language" data-testid="select-language"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="English">English</SelectItem>
                        <SelectItem value="Hindi">Hindi (Soon)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="birthDate">Date of Birth *</Label>
                    <Input
                      id="birthDate" type="date" value={form.birthDate}
                      onChange={(e) => set("birthDate", e.target.value)} data-testid="input-birth-date"
                    />
                  </div>
                  <div>
                    <Label htmlFor="birthTime">Time of Birth *</Label>
                    <Input
                      id="birthTime" type="time" value={form.birthTime}
                      onChange={(e) => set("birthTime", e.target.value)} data-testid="input-birth-time"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="birthCity">Place of Birth (City) *</Label>
                  <Input
                    id="birthCity" value={form.birthCity} onChange={(e) => set("birthCity", e.target.value)}
                    placeholder="e.g. Varanasi, Mumbai, Delhi" data-testid="input-birth-city"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Used for accurate latitude, longitude and timezone.</p>
                </div>

                <Button
                  type="submit" size="lg" className="w-full"
                  disabled={submitting} data-testid="button-pay-kundli"
                >
                  {submitting ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing…</>
                  ) : (
                    <><Sparkles className="w-4 h-4 mr-2" /> Pay ₹{PRICE_INR} &amp; Generate</>
                  )}
                </Button>

                <div className="flex items-center justify-center gap-2 pt-1 text-xs text-muted-foreground">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Secure payment via Razorpay  ·  Password-protected PDF
                </div>
                <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                  <KeyRound className="w-3 h-3" />
                  Your PDF will be locked with your DOB (DDMMYYYY)
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Copy,
  Info,
  Languages,
  Lock,
  Mail,
  Phone,
  PlayCircle,
  Sparkles,
  UserRound,
} from "lucide-react";
import { panditApi } from "@/lib/panditAuth";
import PanditPwaInstallButton from "@/components/pandit/PanditPwaInstallButton";

type AuthMode = "login" | "signup";
type Language = "en" | "hi";

const signupInitialState = {
  fullName: "",
  phone: "",
  email: "",
  city: "",
  languages: "",
  experience: "",
};

export default function PanditLoginPage({ initialMode = "login" }: { initialMode?: AuthMode }) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [language, setLanguage] = useState<Language>("en");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [signup, setSignup] = useState(signupInitialState);

  const DEMO_PHONE = "9000012345";
  const DEMO_PASS = "demo1234";
  const hindi = language === "hi";

  const copy = {
    workspace: hindi ? "पंडितजी पोर्टल" : "Panditji portal",
    loginTitle: hindi ? "अपनी साधना को बेहतर ढंग से संभालें।" : "Your practice, beautifully managed.",
    loginDescription: hindi ? "बुकिंग, कैलेंडर, कमाई और संदेशों में साइन इन करें।" : "Sign in to bookings, calendar, earnings and messages.",
    signIn: hindi ? "साइन इन" : "Sign in",
    apply: hindi ? "जुड़ने के लिए आवेदन" : "Apply to join",
    signupTitle: hindi ? "पंडितजी के रूप में जुड़ें" : "Join as a Panditji",
    signupDescription: hindi
      ? "अपना परिचय दें। अगला चरण आपकी पूरी प्रोफ़ाइल और सत्यापन के लिए होगा।"
      : "Tell us about yourself. The next step completes your profile and verification.",
    backToLogin: hindi ? "साइन इन पर वापस जाएँ" : "Back to sign in",
    continue: hindi ? "आवेदन शुरू करें" : "Start my application",
    name: hindi ? "पूरा नाम" : "Full name",
    registeredPhone: hindi ? "मोबाइल नंबर" : "Mobile number",
    email: hindi ? "ईमेल पता" : "Email address",
    city: hindi ? "शहर" : "City",
    languages: hindi ? "आप किन भाषाओं में सेवा देते हैं?" : "Languages you serve in",
    experience: hindi ? "अनुभव (वर्ष)" : "Years of experience",
    profileStep: hindi
      ? "अगले चरण में सटीक स्थान, पाँच पूजाएँ और प्रोफ़ाइल फ़ोटो जोड़कर सत्यापन पूरा होगा।"
      : "Next, add exact location, five Pujas, and a profile photo to complete verification.",
    keepClose: hindi ? "अपना कार्यक्षेत्र पास रखें" : "Keep your practice close",
    installDescription: hindi ? "एक टैप में पहुँचने के लिए होम स्क्रीन पर जोड़ें।" : "Add Panditji to your home screen for one-tap access.",
    registered: hindi ? "पंजीकृत मोबाइल" : "Registered phone",
    password: hindi ? "पासवर्ड" : "Password",
    forgot: hindi ? "पासवर्ड भूल गए?" : "Forgot password?",
    signInCta: hindi ? "अपने कार्यक्षेत्र में साइन इन करें" : "Sign in to your practice",
    firstLogin: hindi ? "पहली बार साइन इन कर रहे हैं?" : "First-time login?",
    firstLoginDescription: hindi
      ? "अपने अनुमोदन ईमेल में दिए सुरक्षित Create Password लिंक का उपयोग करें।"
      : "Use the secure Create Password link in your approval email, then sign in with the private password you choose.",
    demoTitle: hindi ? "पोर्टल देखें — डेमो पंडितजी" : "Try the portal — demo Panditji",
    demoDescription: hindi ? "नमूना खाते से बुकिंग, कमाई और टूल देखें। साइनअप की ज़रूरत नहीं।" : "Explore bookings, earnings and tools with a sample account. No signup needed.",
    fillDemo: hindi ? "डेमो विवरण भरें" : "Auto-fill demo credentials",
    secure: hindi ? "सत्यापित पंडितजी खातों के लिए सुरक्षित पहुँच" : "Secure access for verified Panditji accounts",
    newTo: hindi ? "Vedic Tatva में नए हैं?" : "New to Vedic Tatva?",
    applyAs: hindi ? "पंडितजी के रूप में आवेदन करें" : "Apply as a Panditji",
    privacy: hindi ? "जारी रखकर आप Vedic Tatva की कार्य-नीतियों और गोपनीयता शर्तों से सहमत हैं।" : "By continuing, you agree to the Vedic Tatva practice guidelines and privacy terms.",
  };

  const fillDemo = () => {
    setMode("login");
    setPhone(DEMO_PHONE);
    setPassword(DEMO_PASS);
  };

  const submit = async () => {
    if (!phone || !password) {
      toast({ title: hindi ? "मोबाइल और पासवर्ड आवश्यक हैं" : "Phone & password required", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const r = await panditApi("POST", "/api/pandit/login", { phone, password });
      toast({
        title: `${hindi ? "स्वागत है" : "Welcome"}, ${r.pandit?.name || "Panditji"}`,
        description: r.mustChangePassword
          ? hindi ? "कृपया अपनी प्रोफ़ाइल से नया पासवर्ड सेट करें।" : "Please set a new password from your profile."
          : undefined,
      });
      setLocation("/pandit/portal");
    } catch (e: any) {
      toast({ title: hindi ? "साइन इन विफल" : "Login failed", description: e?.message || "Try again", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const requestPasswordReset = async () => {
    if (!phone || !resetEmail) {
      toast({ title: hindi ? "मोबाइल और ईमेल आवश्यक हैं" : "Phone and email required", variant: "destructive" });
      return;
    }
    setResetLoading(true);
    try {
      const response = await fetch("/api/pandit/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, email: resetEmail }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "Could not request a password reset link");
      toast({ title: hindi ? "अपना ईमेल देखें" : "Check your email", description: body.message });
      setShowForgotPassword(false);
    } catch (error: any) {
      toast({ title: hindi ? "अनुरोध विफल" : "Request failed", description: error?.message || "Try again", variant: "destructive" });
    } finally {
      setResetLoading(false);
    }
  };

  const updateSignup = (field: keyof typeof signupInitialState, value: string) => {
    setSignup((current) => ({ ...current, [field]: value }));
  };

  const submitSignup = (event: React.FormEvent) => {
    event.preventDefault();
    if (Object.values(signup).some((value) => !value.trim())) {
      toast({
        title: hindi ? "कृपया सभी विवरण भरें" : "Complete the signup form",
        description: hindi ? "सभी फ़ील्ड आवेदन शुरू करने के लिए आवश्यक हैं।" : "All fields are needed to start your application.",
        variant: "destructive",
      });
      return;
    }
    setLocation("/become-pandit#apply");
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#FBF6ED] text-[#2D1B1E]">
      <div
        className="relative min-h-screen px-4 py-5 sm:px-6 sm:py-8"
        style={{
          backgroundImage: "radial-gradient(circle at 12% 0%, rgba(215,167,55,.18), transparent 28%), radial-gradient(circle at 100% 100%, rgba(109,43,53,.08), transparent 36%)",
        }}
      >
        <div className="relative mx-auto flex min-h-[calc(100vh-2.5rem)] w-full max-w-[31rem] flex-col">
          <header className="flex items-center justify-end px-1 pb-5 text-[10px] font-extrabold tracking-[.16em] text-[#55252D]">
            <button
              type="button"
              onClick={() => setLanguage((current) => current === "en" ? "hi" : "en")}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#A67817]/30 bg-white/50 px-2.5 py-1.5 text-[10px] font-extrabold tracking-normal text-[#704D12] transition-colors hover:bg-white"
              aria-label={hindi ? "Switch to English" : "हिंदी में बदलें"}
            >
              <Languages className="h-3.5 w-3.5" />
              {hindi ? "हिंदी" : "EN"} <span className="text-[#B98117]">/</span> {hindi ? "EN" : "हिंदी"}
            </button>
          </header>

          <Card className="flex-1 overflow-hidden rounded-[1.5rem] border border-[#6D2B35]/15 bg-white/70 shadow-[0_22px_65px_rgba(77,40,36,.12)] backdrop-blur">
            <div className="h-1.5 bg-gradient-to-r from-[#B98117] via-[#F0D276] to-[#B98117]" />
            <CardContent className="p-6 sm:p-9">
              <div className="mb-6 flex items-start gap-3.5">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#F1DFB5] text-xl text-[#7F5A15]">
                  {mode === "signup" ? <UserRound className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
                </div>
                <div>
                  <p className="mb-1 text-[10px] font-extrabold uppercase tracking-[.16em] text-[#A67817]">{copy.workspace}</p>
                  <h1 className="font-serif text-[2rem] font-semibold leading-[1.04] tracking-[-.04em] text-[#4A1A22]" data-testid="text-pandit-login-title">
                    {mode === "signup" ? copy.signupTitle : copy.loginTitle}
                  </h1>
                  <p className="mt-2 text-xs leading-5 text-[#806F5E]">
                    {mode === "signup" ? copy.signupDescription : copy.loginDescription}
                  </p>
                </div>
              </div>

              <div className="mb-5 grid grid-cols-2 gap-1 rounded-[13px] bg-[#F4EADB] p-1">
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className={`rounded-[10px] px-2 py-2.5 text-xs font-bold transition-colors ${mode === "login" ? "bg-[#FFFAF1] text-[#55252D] shadow-sm" : "text-[#806F5E] hover:bg-white/60"}`}
                  aria-pressed={mode === "login"}
                >
                  {copy.signIn}
                </button>
                <button
                  type="button"
                  onClick={() => setMode("signup")}
                  className={`rounded-[10px] px-2 py-2.5 text-xs font-bold transition-colors ${mode === "signup" ? "bg-[#FFFAF1] text-[#55252D] shadow-sm" : "text-[#806F5E] hover:bg-white/60"}`}
                  aria-pressed={mode === "signup"}
                >
                  {copy.apply}
                </button>
              </div>

              <div className="mb-5 flex items-center gap-3 rounded-[14px] border border-[#E2C98E] bg-[#F5E8CF] p-3 text-left">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[10px] bg-[#6F2B38] text-lg text-[#FFF8E9]">↓</span>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold text-[#704D12]">{copy.keepClose}</p>
                  <p className="mt-0.5 text-[10px] leading-4 text-[#896F43]">{copy.installDescription}</p>
                </div>
                <PanditPwaInstallButton />
              </div>

              {mode === "signup" ? (
                <form className="grid gap-4" onSubmit={submitSignup}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <Label htmlFor="signup-full-name" className="mb-1.5 block text-[11px] font-bold text-[#5A4A3A]">{copy.name}</Label>
                      <div className="flex h-12 items-center gap-2.5 rounded-xl border border-[#DDCFBC] bg-white/80 px-3.5 focus-within:border-[#A67817] focus-within:ring-2 focus-within:ring-[#D4AF37]/20">
                        <UserRound className="h-4 w-4 shrink-0 text-[#806F5E]" />
                        <Input id="signup-full-name" autoComplete="name" placeholder={hindi ? "उदा. पंडित रमेश शर्मा" : "e.g. Pandit Ramesh Sharma"} className="h-auto border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0" value={signup.fullName} onChange={(event) => updateSignup("fullName", event.target.value)} data-testid="input-pandit-signup-name" />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="signup-phone" className="mb-1.5 block text-[11px] font-bold text-[#5A4A3A]">{copy.registeredPhone}</Label>
                      <div className="flex h-12 items-center gap-2.5 rounded-xl border border-[#DDCFBC] bg-white/80 px-3.5 focus-within:border-[#A67817] focus-within:ring-2 focus-within:ring-[#D4AF37]/20">
                        <Phone className="h-4 w-4 shrink-0 text-[#806F5E]" />
                        <Input id="signup-phone" inputMode="tel" autoComplete="tel" placeholder="+91 98765 43210" className="h-auto border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0" value={signup.phone} onChange={(event) => updateSignup("phone", event.target.value)} data-testid="input-pandit-signup-phone" />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="signup-email" className="mb-1.5 block text-[11px] font-bold text-[#5A4A3A]">{copy.email}</Label>
                      <div className="flex h-12 items-center gap-2.5 rounded-xl border border-[#DDCFBC] bg-white/80 px-3.5 focus-within:border-[#A67817] focus-within:ring-2 focus-within:ring-[#D4AF37]/20">
                        <Mail className="h-4 w-4 shrink-0 text-[#806F5E]" />
                        <Input id="signup-email" type="email" autoComplete="email" placeholder="pandit@example.com" className="h-auto border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0" value={signup.email} onChange={(event) => updateSignup("email", event.target.value)} data-testid="input-pandit-signup-email" />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="signup-city" className="mb-1.5 block text-[11px] font-bold text-[#5A4A3A]">{copy.city}</Label>
                      <Input id="signup-city" autoComplete="address-level2" placeholder={hindi ? "जैसे वाराणसी" : "e.g. Varanasi"} className="h-12 rounded-xl border-[#DDCFBC] bg-white/80 text-sm focus-visible:border-[#A67817] focus-visible:ring-[#D4AF37]/20" value={signup.city} onChange={(event) => updateSignup("city", event.target.value)} data-testid="input-pandit-signup-city" />
                    </div>
                    <div>
                      <Label htmlFor="signup-experience" className="mb-1.5 block text-[11px] font-bold text-[#5A4A3A]">{copy.experience}</Label>
                      <Input id="signup-experience" type="number" min="0" inputMode="numeric" placeholder="5" className="h-12 rounded-xl border-[#DDCFBC] bg-white/80 text-sm focus-visible:border-[#A67817] focus-visible:ring-[#D4AF37]/20" value={signup.experience} onChange={(event) => updateSignup("experience", event.target.value)} data-testid="input-pandit-signup-experience" />
                    </div>
                    <div className="sm:col-span-2">
                      <Label htmlFor="signup-languages" className="mb-1.5 block text-[11px] font-bold text-[#5A4A3A]">{copy.languages}</Label>
                      <Input id="signup-languages" placeholder={hindi ? "हिंदी, संस्कृत, English..." : "Hindi, Sanskrit, English..."} className="h-12 rounded-xl border-[#DDCFBC] bg-white/80 text-sm focus-visible:border-[#A67817] focus-visible:ring-[#D4AF37]/20" value={signup.languages} onChange={(event) => updateSignup("languages", event.target.value)} data-testid="input-pandit-signup-languages" />
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 rounded-[13px] border border-[#D4AF37]/30 bg-[#FFFAF1] p-3 text-[10px] leading-[1.5] text-[#806F5E]">
                    <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#6F2B38]" />
                    <span>{copy.profileStep}</span>
                  </div>
                  <Button type="submit" className="h-12 rounded-xl bg-[#6F2B38] text-sm font-extrabold text-[#FFF8E9] shadow-[0_9px_20px_rgba(111,43,56,.18)] hover:bg-[#55252D]" data-testid="btn-pandit-signup">
                    {copy.continue}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <button type="button" onClick={() => setMode("login")} className="mx-auto inline-flex items-center gap-1.5 text-[11px] font-extrabold text-[#6F2B38] hover:underline">
                    <ArrowLeft className="h-3.5 w-3.5" /> {copy.backToLogin}
                  </button>
                </form>
              ) : (
                <>
                  <form
                    className="grid gap-4"
                    onSubmit={(event) => {
                      event.preventDefault();
                      void submit();
                    }}
                  >
                    <div>
                      <Label htmlFor="p-phone" className="mb-1.5 block text-[11px] font-bold text-[#5A4A3A]">{copy.registered}</Label>
                      <div className="flex h-12 items-center gap-2.5 rounded-xl border border-[#DDCFBC] bg-white/80 px-3.5 focus-within:border-[#A67817] focus-within:ring-2 focus-within:ring-[#D4AF37]/20">
                        <Phone className="h-4 w-4 shrink-0 text-[#806F5E]" />
                        <Input id="p-phone" inputMode="numeric" autoComplete="tel" placeholder="10-digit mobile" className="h-auto border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0" value={phone} onChange={(e) => setPhone(e.target.value)} data-testid="input-pandit-phone" />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="p-pass" className="mb-1.5 block text-[11px] font-bold text-[#5A4A3A]">{copy.password}</Label>
                      <div className="flex h-12 items-center gap-2.5 rounded-xl border border-[#DDCFBC] bg-white/80 px-3.5 focus-within:border-[#A67817] focus-within:ring-2 focus-within:ring-[#D4AF37]/20">
                        <Lock className="h-4 w-4 shrink-0 text-[#806F5E]" />
                        <Input id="p-pass" type="password" autoComplete="current-password" className="h-auto border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0" value={password} onChange={(e) => setPassword(e.target.value)} data-testid="input-pandit-password" />
                        <span className="text-[10px] font-extrabold text-[#A67817]">PRIVATE</span>
                      </div>
                    </div>
                    <div className="-mt-1 flex justify-end">
                      <Button type="button" variant="link" onClick={() => setShowForgotPassword((value) => !value)} className="h-auto p-0 text-[11px] font-extrabold text-[#8E6418]">{copy.forgot}</Button>
                    </div>
                    {showForgotPassword && (
                      <div className="grid gap-3 rounded-[13px] border border-[#D4AF37]/35 bg-white p-3.5">
                        <p className="text-[10px] leading-4 text-[#806F5E]">{hindi ? "अपने स्वीकृत पंडित खाते में पंजीकृत मोबाइल और ईमेल दर्ज करें।" : "Enter the phone and email registered on your approved Pandit account."}</p>
                        <div className="flex h-11 items-center gap-2.5 rounded-xl border border-[#DDCFBC] px-3">
                          <Mail className="h-4 w-4 shrink-0 text-[#806F5E]" />
                          <Input type="email" autoComplete="email" placeholder="Registered email" className="h-auto border-0 p-0 text-sm shadow-none focus-visible:ring-0" value={resetEmail} onChange={(event) => setResetEmail(event.target.value)} />
                        </div>
                        <Button type="button" variant="outline" onClick={requestPasswordReset} disabled={resetLoading} className="h-11 rounded-xl border-[#6F2B38] text-xs font-extrabold text-[#6F2B38]">{resetLoading ? "Sending..." : hindi ? "रीसेट लिंक ईमेल करें" : "Email password reset link"}</Button>
                      </div>
                    )}
                    <Button type="submit" disabled={loading} className="h-12 rounded-xl bg-[#6F2B38] text-sm font-extrabold text-[#FFF8E9] shadow-[0_9px_20px_rgba(111,43,56,.18)] hover:bg-[#55252D]" data-testid="btn-pandit-login">
                      {loading ? hindi ? "साइन इन हो रहा है..." : "Signing in..." : copy.signInCta}
                      {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
                    </Button>
                  </form>
                  <div className="mt-4 flex items-start gap-2.5 rounded-[13px] border border-[#D4AF37]/30 bg-[#FFFAF1] p-3 text-[10px] leading-[1.45] text-[#806F5E]">
                    <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#6F2B38]" />
                    <span><strong className="text-[#4A1A22]">{copy.firstLogin}</strong> {copy.firstLoginDescription}</span>
                  </div>
                  <div className="mt-5 rounded-[15px] border border-dashed border-[#A67817]/55 bg-gradient-to-br from-[#FFFAF1] to-[#FFF4D9] p-3.5">
                    <div className="flex items-center gap-2 text-[11px] font-extrabold text-[#4A1A22]"><PlayCircle className="h-4 w-4 text-[#6F2B38]" />{copy.demoTitle}</div>
                    <p className="mt-2 text-[10px] leading-[1.45] text-[#806F5E]">{copy.demoDescription}</p>
                    <div className="my-3 grid grid-cols-2 gap-2">
                      <div className="rounded-[10px] border border-[#D4AF37]/30 bg-white p-2.5"><div className="mb-1 text-[9px] uppercase tracking-[.08em] text-[#9B8A7C]">Phone</div><div className="font-mono text-[10px] font-semibold text-[#4A1A22]" data-testid="text-demo-phone">{DEMO_PHONE}</div></div>
                      <div className="rounded-[10px] border border-[#D4AF37]/30 bg-white p-2.5"><div className="mb-1 text-[9px] uppercase tracking-[.08em] text-[#9B8A7C]">Password</div><div className="font-mono text-[10px] font-semibold text-[#4A1A22]" data-testid="text-demo-password">{DEMO_PASS}</div></div>
                    </div>
                    <Button type="button" variant="outline" onClick={fillDemo} className="h-10 w-full rounded-xl border-[#6F2B38] text-[10px] font-extrabold text-[#6F2B38] hover:bg-[#6F2B38]/5" data-testid="btn-fill-demo"><Copy className="mr-1.5 h-3.5 w-3.5" />{copy.fillDemo}</Button>
                  </div>
                  <div className="mt-5 flex items-center gap-2 text-[10px] leading-4 text-[#806F5E]"><span className="grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full bg-[#6F2B38] text-[10px] text-[#FFF8E9]">✓</span><span>{copy.secure}</span></div>
                  <p className="mt-5 text-center text-[11px] text-[#806F5E]">{copy.newTo}{" "}<button type="button" onClick={() => setMode("signup")} className="font-extrabold text-[#6F2B38] hover:underline">{copy.applyAs}</button></p>
                </>
              )}
            </CardContent>
          </Card>
          <p className="px-1 pt-3 text-center text-[9px] leading-4 text-[#9B8A7C]">{copy.privacy}</p>
        </div>
      </div>
    </main>
  );
}
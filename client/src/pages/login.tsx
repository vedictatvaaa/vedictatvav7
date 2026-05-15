import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Mail, Lock, User as UserIcon, Eye, EyeOff, ArrowLeft, CheckCircle2 } from "lucide-react";

declare global { interface Window { google?: any } }

type View = "login" | "signup" | "forgot" | "forgot-sent";

function useRedirectParam() {
  if (typeof window === "undefined") return "/";
  const p = new URLSearchParams(window.location.search).get("redirect");
  if (p && p.startsWith("/") && !p.startsWith("//")) return p;
  return "/";
}

function GoogleBtn({
  view, rememberMe, onSuccess,
}: { view: "login" | "signup"; rememberMe: boolean; onSuccess: () => void }) {
  const { loginWithGoogle } = useAuth();
  const { toast } = useToast();
  const [enabled, setEnabled] = useState(false);
  const [clientId, setClientId] = useState("");
  const [ready, setReady] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/auth/google/config")
      .then(r => r.json())
      .then(d => { if (d.enabled && d.clientId) { setEnabled(true); setClientId(d.clientId); } })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const existing = document.getElementById("google-identity-script");
    if (existing) { setReady(true); return; }
    const s = document.createElement("script");
    s.id = "google-identity-script";
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true; s.defer = true;
    s.onload = () => setReady(true);
    document.head.appendChild(s);
  }, [enabled]);

  useEffect(() => {
    if (!ready || !clientId || !ref.current || !window.google?.accounts?.id) return;
    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (resp: { credential: string }) => {
          try {
            await loginWithGoogle(resp.credential, rememberMe);
            toast({ title: "Welcome!", description: "Signed in with Google" });
            onSuccess();
          } catch (e: any) {
            toast({ title: "Sign-in failed", description: e.message, variant: "destructive" });
          }
        },
      });
      ref.current.innerHTML = "";
      const w = Math.min(ref.current.offsetWidth || 320, 400);
      window.google.accounts.id.renderButton(ref.current, {
        theme: "outline", size: "large", width: w,
        text: view === "signup" ? "signup_with" : "signin_with", shape: "pill",
      });
    } catch {}
  }, [ready, clientId, view, rememberMe, loginWithGoogle, onSuccess, toast]);

  if (!enabled) return null;
  return (
    <div className="mb-4">
      <div ref={ref} className="min-h-[44px] flex justify-center" data-testid="google-signin-button" />
      <div className="flex items-center gap-3 mt-4">
        <div className="flex-1 h-px bg-[#6D2B35]/15" />
        <span className="text-[11px] uppercase tracking-widest text-[#6D2B35]/40">or</span>
        <div className="flex-1 h-px bg-[#6D2B35]/15" />
      </div>
    </div>
  );
}

export default function AuthPage({ initialMode = "login" }: { initialMode?: "login" | "signup" }) {
  const { login, register, requestPasswordReset, loading, user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const redirect = useRedirectParam();

  const [view, setView] = useState<View>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [referralCode, setReferralCode] = useState(() => {
    if (typeof window === "undefined") return "";
    const p = new URLSearchParams(window.location.search).get("ref");
    return (p || (typeof localStorage !== "undefined" ? localStorage.getItem("vt_referral_code") || "" : "")).toUpperCase();
  });
  const [rememberMe, setRememberMe] = useState(true);
  const [showPwd, setShowPwd] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { if (user) setLocation(redirect); }, [user, redirect, setLocation]);

  const handleSuccess = () => setLocation(redirect);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (view === "login") {
        await login(email, password, rememberMe);
        toast({ title: "Welcome back!", description: "You are now signed in" });
        handleSuccess();
      } else if (view === "signup") {
        if (!name.trim()) throw new Error("Please enter your full name");
        if (password.length < 6) throw new Error("Password must be at least 6 characters");
        await register({ name: name.trim(), email, password, referralCode: referralCode.trim().toUpperCase() || undefined } as any, rememberMe);
        if (referralCode) try { localStorage.removeItem("vt_referral_code"); } catch {}
        toast({ title: "Account created", description: "Welcome to Vedic Tatva" });
        handleSuccess();
      } else if (view === "forgot") {
        await requestPasswordReset(email);
        setView("forgot-sent");
      }
    } catch (err: any) {
      toast({
        title: view === "login" ? "Login failed" : view === "signup" ? "Signup failed" : "Could not send link",
        description: err.message, variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const isBusy = submitting || loading;

  return (
    <div className="min-h-screen flex" style={{ background: "linear-gradient(135deg, #fdf6e3 0%, #f5e6c8 100%)" }}>
      {/* Left decorative panel — desktop only */}
      <div className="hidden lg:flex lg:w-5/12 xl:w-1/2 flex-col items-center justify-center relative overflow-hidden"
        style={{ background: "linear-gradient(160deg, #6D2B35 0%, #4a1a22 60%, #3a1018 100%)" }}>
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 30% 20%, #D4AF37 0%, transparent 50%), radial-gradient(circle at 70% 80%, #D4AF37 0%, transparent 50%)" }} />
        <div className="relative z-10 text-center px-10 max-w-sm">
          <div className="text-5xl font-serif text-[#D4AF37] mb-2 select-none">ॐ</div>
          <h1 className="text-3xl xl:text-4xl font-serif text-white leading-tight mb-4">
            Vedic Tatva
          </h1>
          <p className="text-[#D4AF37]/80 text-[15px] font-medium tracking-wide mb-2">सनातन धर्म</p>
          <p className="text-white/60 text-sm leading-relaxed mt-4">
            Your sacred companion for pandits, puja, jyotish, and authentic spiritual products.
          </p>
          <div className="mt-10 grid grid-cols-2 gap-3 text-center">
            {[
              { num: "50,000+", label: "Devotees" },
              { num: "1,200+", label: "Verified Pandits" },
              { num: "5,000+", label: "Pujas Conducted" },
              { num: "4.9★", label: "App Rating" },
            ].map(s => (
              <div key={s.label} className="rounded-lg bg-white/8 border border-white/10 px-3 py-2.5">
                <div className="text-[#D4AF37] font-bold text-base">{s.num}</div>
                <div className="text-white/55 text-[11px] mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 overflow-y-auto">
        {/* Mobile logo */}
        <div className="lg:hidden text-center mb-6">
          <Link href="/">
            <span className="text-2xl font-serif text-[#6D2B35] cursor-pointer">Vedic Tatva</span>
          </Link>
          <div className="text-[#D4AF37] text-xs tracking-widest mt-0.5">सनातन धर्म</div>
        </div>

        <div className="w-full max-w-md">
          {/* Card */}
          <div className="bg-white rounded-xl shadow-sm border border-[#D4AF37]/20 overflow-hidden">
            {/* Header */}
            <div className="px-6 pt-5 pb-4 border-b border-[#D4AF37]/15"
              style={{ background: "linear-gradient(135deg, #fdf6e3 0%, #f5e6c8 100%)" }}>
              {(view === "forgot" || view === "forgot-sent") && (
                <button type="button" onClick={() => setView("login")}
                  className="flex items-center gap-1.5 text-[12px] text-[#6D2B35]/60 hover:text-[#6D2B35] mb-3 font-medium"
                  data-testid="button-back-to-login">
                  <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
                </button>
              )}
              <h2 className="text-xl font-serif text-[#6D2B35] font-semibold">
                {view === "login" ? "Welcome back" :
                 view === "signup" ? "Create your account" :
                 view === "forgot" ? "Reset your password" :
                 "Check your inbox"}
              </h2>
              <p className="text-[13px] text-[#6D2B35]/60 mt-1">
                {view === "login" ? "Sign in to continue your sacred journey" :
                 view === "signup" ? "Begin your spiritual journey with Vedic Tatva" :
                 view === "forgot" ? "We'll email you a secure reset link" :
                 "We've sent a reset link to your inbox"}
              </p>
            </div>

            {/* Body */}
            <div className="px-6 py-5">
              {view === "forgot-sent" ? (
                <div className="text-center space-y-4 py-2">
                  <div className="mx-auto h-14 w-14 rounded-full bg-[#FBF7EE] flex items-center justify-center border border-[#D4AF37]/30">
                    <CheckCircle2 className="h-7 w-7 text-[#6D2B35]" />
                  </div>
                  <p className="text-sm text-[#5a4a3a] leading-relaxed">
                    If an account exists for <span className="font-semibold text-[#6D2B35]">{email}</span>,
                    we've sent a password reset link. The link expires in 30 minutes.
                  </p>
                  <p className="text-[12px] text-[#6D2B35]/50">
                    Didn't get it? Check your spam folder or try again.
                  </p>
                  <Button type="button" onClick={() => setView("login")}
                    className="w-full bg-[#6D2B35] text-white"
                    data-testid="button-back-to-login-cta">
                    Back to sign in
                  </Button>
                </div>
              ) : (
                <>
                  {(view === "login" || view === "signup") && (
                    <GoogleBtn view={view} rememberMe={rememberMe} onSuccess={handleSuccess} />
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4">
                    {view === "signup" && (
                      <>
                        <div className="space-y-1.5">
                          <Label htmlFor="auth-name" className="text-[13px] text-[#6D2B35]/80 font-medium">Full Name</Label>
                          <div className="relative">
                            <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6D2B35]/40" />
                            <Input id="auth-name" data-testid="input-name" value={name}
                              onChange={e => setName(e.target.value)} placeholder="Your full name"
                              className="pl-9 text-sm" autoComplete="name" required />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="auth-ref" className="text-[13px] text-[#6D2B35]/80 font-medium flex items-center justify-between">
                            <span>Referral Code <span className="text-[#5a4a3a]/50 font-normal">(optional)</span></span>
                            {referralCode && <span className="text-[11px] text-emerald-700 font-normal">Bonus points unlocked</span>}
                          </Label>
                          <Input id="auth-ref" data-testid="input-referral-code" value={referralCode}
                            onChange={e => setReferralCode(e.target.value.toUpperCase())}
                            placeholder="e.g. VEDIC1234" className="text-sm tracking-wider uppercase" maxLength={20} />
                        </div>
                      </>
                    )}

                    <div className="space-y-1.5">
                      <Label htmlFor="auth-email" className="text-[13px] text-[#6D2B35]/80 font-medium">Email address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6D2B35]/40" />
                        <Input id="auth-email" data-testid="input-email" type="email" value={email}
                          onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
                          className="pl-9 text-sm" autoComplete="email" required />
                      </div>
                    </div>

                    {view !== "forgot" && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="auth-password" className="text-[13px] text-[#6D2B35]/80 font-medium">Password</Label>
                          {view === "login" && (
                            <button type="button" onClick={() => setView("forgot")}
                              className="text-[12px] text-[#6D2B35] hover:text-[#D4AF37] font-medium"
                              data-testid="button-forgot-password">
                              Forgot password?
                            </button>
                          )}
                        </div>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6D2B35]/40" />
                          <Input id="auth-password" data-testid="input-password"
                            type={showPwd ? "text" : "password"} value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder={view === "signup" ? "At least 6 characters" : "Your password"}
                            className="pl-9 pr-10 text-sm"
                            autoComplete={view === "signup" ? "new-password" : "current-password"} required />
                          <button type="button" onClick={() => setShowPwd(v => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6D2B35]/40 hover:text-[#6D2B35]"
                            aria-label={showPwd ? "Hide password" : "Show password"}
                            data-testid="button-toggle-password">
                            {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                    )}

                    {(view === "login" || view === "signup") && (
                      <label className="flex items-center gap-2.5 cursor-pointer select-none">
                        <Checkbox checked={rememberMe} onCheckedChange={v => setRememberMe(Boolean(v))}
                          className="border-[#6D2B35]/30 data-[state=checked]:bg-[#6D2B35] data-[state=checked]:border-[#6D2B35]"
                          data-testid="checkbox-remember-me" />
                        <span className="text-[13px] text-[#5a4a3a]">Keep me signed in on this device</span>
                      </label>
                    )}

                    <Button type="submit" className="w-full bg-[#6D2B35] hover:bg-[#5a232b] text-white"
                      disabled={isBusy} data-testid="button-submit-auth">
                      {isBusy && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                      {view === "login" ? "Sign In" : view === "signup" ? "Create Account" : "Send reset link"}
                    </Button>
                  </form>

                  {view !== "forgot" && (
                    <p className="text-center text-[13px] text-[#6D2B35]/70 mt-4">
                      {view === "login" ? (
                        <>New here?{" "}
                          <button type="button" onClick={() => setView("signup")}
                            className="text-[#D4AF37] font-semibold hover:underline"
                            data-testid="button-switch-signup">
                            Create an account
                          </button>
                        </>
                      ) : (
                        <>Already have an account?{" "}
                          <button type="button" onClick={() => setView("login")}
                            className="text-[#D4AF37] font-semibold hover:underline"
                            data-testid="button-switch-login">
                            Sign in
                          </button>
                        </>
                      )}
                    </p>
                  )}

                  {view === "login" && (
                    <a href="/pandit/login"
                      className="mt-4 flex items-center justify-between gap-2 rounded-md border border-[#D4AF37]/40 bg-gradient-to-r from-[#FBF7EE] to-[#f4ead0] px-3.5 py-3 hover-elevate active-elevate-2"
                      data-testid="link-pandit-login-callout">
                      <span className="flex items-center gap-3 min-w-0">
                        <span className="h-8 w-8 rounded-full bg-[#6D2B35] text-[#D4AF37] flex items-center justify-center text-base font-bold shrink-0">ॐ</span>
                        <span className="min-w-0">
                          <span className="block text-[13px] font-semibold text-[#4a1a22] leading-tight">Are you a Panditji?</span>
                          <span className="block text-[12px] text-[#6D2B35]/70 leading-tight">Sign in to your dedicated portal</span>
                        </span>
                      </span>
                      <span className="text-[12px] font-bold text-[#6D2B35] whitespace-nowrap">Open →</span>
                    </a>
                  )}

                  <p className="text-[11px] text-center text-[#6D2B35]/45 leading-snug mt-4">
                    By continuing, you agree to our{" "}
                    <Link href="/terms-conditions" className="underline">Terms</Link> &amp;{" "}
                    <Link href="/privacy-policy" className="underline">Privacy Policy</Link>.
                  </p>
                </>
              )}
            </div>
          </div>

          <div className="text-center mt-5">
            <Link href="/" className="text-[13px] text-[#6D2B35]/60 hover:text-[#6D2B35] flex items-center justify-center gap-1">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Vedic Tatva
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, Lock, User as UserIcon, Eye, EyeOff, ArrowLeft, CheckCircle2 } from "lucide-react";

declare global {
  interface Window {
    google?: any;
  }
}

type ModalView = "login" | "signup" | "forgot" | "forgot-sent";

export function AuthModal() {
  const {
    authModalOpen, authModalMode, closeAuth, login, register, loginWithGoogle,
    requestPasswordReset, openAuth, loading,
  } = useAuth();
  const { toast } = useToast();
  const [view, setView] = useState<ModalView>(authModalMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [referralCode, setReferralCode] = useState(() => {
    if (typeof window === "undefined") return "";
    const url = new URL(window.location.href);
    return (url.searchParams.get("ref") || localStorage.getItem("vt_referral_code") || "").toUpperCase();
  });
  const [rememberMe, setRememberMe] = useState(true);
  const [showPwd, setShowPwd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [googleEnabled, setGoogleEnabled] = useState(false);
  const [googleClientId, setGoogleClientId] = useState("");
  const [googleReady, setGoogleReady] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement>(null);

  useEffect(() => setView(authModalMode), [authModalMode]);

  useEffect(() => {
    fetch("/api/auth/google/config")
      .then(r => r.json())
      .then(d => {
        if (d.enabled && d.clientId) {
          setGoogleEnabled(true);
          setGoogleClientId(d.clientId);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!googleEnabled || !authModalOpen) return;
    const existing = document.getElementById("google-identity-script") as HTMLScriptElement | null;
    if (existing) {
      setGoogleReady(true);
      return;
    }
    const s = document.createElement("script");
    s.id = "google-identity-script";
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.defer = true;
    s.onload = () => setGoogleReady(true);
    document.head.appendChild(s);
  }, [googleEnabled, authModalOpen]);

  useEffect(() => {
    if (!googleReady || !googleClientId || !googleBtnRef.current || !authModalOpen) return;
    if (view !== "login" && view !== "signup") return;
    if (!window.google?.accounts?.id) return;
    try {
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async (resp: { credential: string }) => {
          try {
            await loginWithGoogle(resp.credential, rememberMe);
            toast({ title: "Welcome!", description: "Signed in with Google" });
            closeAuth();
          } catch (e: any) {
            toast({ title: "Sign-in failed", description: e.message, variant: "destructive" });
          }
        },
      });
      googleBtnRef.current.innerHTML = "";
      const width = Math.min(googleBtnRef.current.offsetWidth || 280, 360);
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        theme: "outline",
        size: "large",
        width,
        text: view === "signup" ? "signup_with" : "signin_with",
        shape: "pill",
      });
    } catch {}
  }, [googleReady, googleClientId, authModalOpen, view, rememberMe, loginWithGoogle, closeAuth, toast]);

  useEffect(() => {
    if (authModalOpen) {
      setEmail("");
      setPassword("");
      setName("");
      setShowPwd(false);
      setRememberMe(true);
    }
  }, [authModalOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (view === "login") {
        await login(email, password, rememberMe);
        toast({ title: "Welcome back!", description: "You are now signed in" });
        closeAuth();
      } else if (view === "signup") {
        if (!name.trim()) throw new Error("Please enter your name");
        if (password.length < 6) throw new Error("Password must be at least 6 characters");
        await register({ name: name.trim(), email, password, referralCode: referralCode.trim().toUpperCase() || undefined } as any, rememberMe);
        if (referralCode) try { localStorage.removeItem("vt_referral_code"); } catch {}
        toast({ title: "Account created", description: "Welcome to Vedic Tatva" });
        closeAuth();
      } else if (view === "forgot") {
        await requestPasswordReset(email);
        setView("forgot-sent");
      }
    } catch (err: any) {
      toast({
        title: view === "login" ? "Login failed" : view === "signup" ? "Signup failed" : "Could not send link",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const headerTitle =
    view === "login" ? "Welcome back" :
    view === "signup" ? "Create your account" :
    view === "forgot" ? "Reset your password" :
    "Check your inbox";

  const headerSub =
    view === "login" ? "Sign in to continue your journey" :
    view === "signup" ? "Begin your spiritual journey with us" :
    view === "forgot" ? "We'll email you a secure reset link" :
    "We've sent you an email";

  return (
    <Dialog open={authModalOpen} onOpenChange={(o) => (o ? openAuth(view === "forgot" || view === "forgot-sent" ? "login" : view as any) : closeAuth())}>
      <DialogContent
        className="p-0 overflow-hidden gap-0 w-[calc(100vw-1.5rem)] max-w-[340px] sm:max-w-[360px] rounded-xl"
        data-testid="auth-modal"
      >
        {/* Compact header */}
        <div
          className="px-4 pt-3.5 pb-2.5 text-center relative"
          style={{
            background: "linear-gradient(135deg, #fdf6e3 0%, #f5e6c8 100%)",
            borderBottom: "1px solid rgba(212, 175, 55, 0.25)",
          }}
        >
          {(view === "forgot" || view === "forgot-sent") && (
            <button
              type="button"
              onClick={() => setView("login")}
              className="absolute left-2 top-2 p-1 rounded-md text-[#6D2B35]/60 hover:text-[#6D2B35] hover:bg-[#6D2B35]/5"
              aria-label="Back to sign in"
              data-testid="button-back-to-login"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
            </button>
          )}
          <div className="text-lg font-serif text-[#6D2B35] tracking-wide leading-none">Vedic Tatva</div>
          <DialogTitle className="text-[13px] font-medium text-[#6D2B35] mt-1.5">
            {headerTitle}
          </DialogTitle>
          <DialogDescription className="text-[10.5px] text-[#6D2B35]/65 mt-0.5">
            {headerSub}
          </DialogDescription>
        </div>

        {/* Body */}
        <div className="px-4 py-3.5 bg-white">
          {view === "forgot-sent" ? (
            <div className="text-center space-y-3 py-2">
              <div className="mx-auto h-12 w-12 rounded-full bg-[#FBF7EE] flex items-center justify-center border border-[#D4AF37]/30">
                <CheckCircle2 className="h-6 w-6 text-[#6D2B35]" />
              </div>
              <p className="text-[13px] text-[#5a4a3a] leading-relaxed">
                If an account exists for <span className="font-semibold text-[#6D2B35]">{email}</span>,
                we've sent a password reset link. The link will expire in 30 minutes.
              </p>
              <p className="text-[11px] text-[#6D2B35]/55">
                Didn't get it? Check your spam folder or try again.
              </p>
              <Button
                type="button"
                onClick={() => setView("login")}
                className="w-full h-9 bg-[#6D2B35] text-white hover:bg-[#5a232b] text-[13px]"
                data-testid="button-back-to-login-cta"
              >
                Back to sign in
              </Button>
            </div>
          ) : (
            <>
              {googleEnabled && view !== "forgot" && (
                <div className="mb-2.5">
                  <div ref={googleBtnRef} data-testid="google-signin-button" className="min-h-[36px] flex justify-center" />
                  <div className="flex items-center w-full gap-2 mt-2">
                    <div className="flex-1 h-px bg-[#6D2B35]/15" />
                    <span className="text-[9.5px] uppercase tracking-wider text-[#6D2B35]/45">or</span>
                    <div className="flex-1 h-px bg-[#6D2B35]/15" />
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-2">
                {view === "signup" && (
                  <>
                    <div className="space-y-1">
                      <Label htmlFor="auth-name" className="text-[11px] text-[#6D2B35]/80 font-medium">Full Name</Label>
                      <div className="relative">
                        <UserIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#6D2B35]/45" />
                        <Input
                          id="auth-name"
                          data-testid="input-name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Your name"
                          className="pl-8 h-9 text-[13px]"
                          autoComplete="name"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="auth-ref" className="text-[11px] text-[#6D2B35]/80 font-medium flex items-center justify-between">
                        <span>Referral Code <span className="text-[#5a4a3a]/50">(optional)</span></span>
                        {referralCode && <span className="text-[10px] text-emerald-700">Bonus points unlocked</span>}
                      </Label>
                      <Input
                        id="auth-ref"
                        data-testid="input-referral-code"
                        value={referralCode}
                        onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                        placeholder="e.g. VEDIC1234"
                        className="h-9 text-[13px] tracking-wider uppercase"
                        maxLength={20}
                      />
                    </div>
                  </>
                )}
                <div className="space-y-1">
                  <Label htmlFor="auth-email" className="text-[11px] text-[#6D2B35]/80 font-medium">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#6D2B35]/45" />
                    <Input
                      id="auth-email"
                      data-testid="input-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="pl-8 h-9 text-[13px]"
                      autoComplete="email"
                      required
                    />
                  </div>
                </div>
                {view !== "forgot" && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="auth-password" className="text-[11px] text-[#6D2B35]/80 font-medium">Password</Label>
                      {view === "login" && (
                        <button
                          type="button"
                          onClick={() => setView("forgot")}
                          className="text-[11px] text-[#6D2B35] hover:text-[#D4AF37] hover:underline font-medium"
                          data-testid="button-forgot-password"
                        >
                          Forgot?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#6D2B35]/45" />
                      <Input
                        id="auth-password"
                        data-testid="input-password"
                        type={showPwd ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={view === "signup" ? "At least 6 characters" : "Your password"}
                        className="pl-8 pr-8 h-9 text-[13px]"
                        autoComplete={view === "signup" ? "new-password" : "current-password"}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPwd((v) => !v)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-[#6D2B35]/45 hover:text-[#6D2B35]"
                        aria-label={showPwd ? "Hide password" : "Show password"}
                        data-testid="button-toggle-password"
                      >
                        {showPwd ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>
                )}

                {(view === "login" || view === "signup") && (
                  <label className="flex items-center gap-2 pt-1 cursor-pointer select-none">
                    <Checkbox
                      checked={rememberMe}
                      onCheckedChange={(v) => setRememberMe(Boolean(v))}
                      className="h-3.5 w-3.5 border-[#6D2B35]/30 data-[state=checked]:bg-[#6D2B35] data-[state=checked]:border-[#6D2B35]"
                      data-testid="checkbox-remember-me"
                    />
                    <span className="text-[11px] text-[#5a4a3a]">Keep me signed in on this device</span>
                  </label>
                )}

                <Button
                  type="submit"
                  className="w-full h-9 bg-[#6D2B35] text-white hover:bg-[#5a232b] text-[13px] mt-1"
                  disabled={submitting || loading}
                  data-testid="button-submit-auth"
                >
                  {submitting || loading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
                  ) : null}
                  {view === "login" ? "Sign In" : view === "signup" ? "Create Account" : "Send reset link"}
                </Button>
              </form>

              {view !== "forgot" && (
                <div className="text-center text-[11px] text-[#6D2B35]/70 mt-2.5">
                  {view === "login" ? (
                    <>
                      New here?{" "}
                      <button
                        type="button"
                        onClick={() => setView("signup")}
                        className="text-[#D4AF37] font-semibold hover:underline"
                        data-testid="button-switch-signup"
                      >
                        Create an account
                      </button>
                    </>
                  ) : (
                    <>
                      Already have an account?{" "}
                      <button
                        type="button"
                        onClick={() => setView("login")}
                        className="text-[#D4AF37] font-semibold hover:underline"
                        data-testid="button-switch-login"
                      >
                        Sign in
                      </button>
                    </>
                  )}
                </div>
              )}

              {view === "login" && (
                <a
                  href="/pandit/login"
                  className="mt-3 flex items-center justify-between gap-2 rounded-md border border-[#D4AF37]/40 bg-gradient-to-r from-[#FBF7EE] to-[#f4ead0] px-3 py-2 hover-elevate active-elevate-2"
                  data-testid="link-pandit-login-callout"
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <span className="h-7 w-7 rounded-full bg-[#6D2B35] text-[#D4AF37] flex items-center justify-center text-[13px] font-bold shrink-0">ॐ</span>
                    <span className="min-w-0">
                      <span className="block text-[11px] font-semibold text-[#4a1a22] leading-tight">Are you a Panditji?</span>
                      <span className="block text-[10px] text-[#6D2B35]/70 leading-tight">Login to your dedicated portal</span>
                    </span>
                  </span>
                  <span className="text-[10px] font-bold text-[#6D2B35] whitespace-nowrap">Open →</span>
                </a>
              )}

              <p className="text-[9px] text-center text-[#6D2B35]/45 leading-snug mt-2">
                By continuing, you agree to our{" "}
                <a href="/terms-conditions" className="underline">Terms</a> &{" "}
                <a href="/privacy-policy" className="underline">Privacy</a>.
              </p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

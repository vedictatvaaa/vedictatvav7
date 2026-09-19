import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  Phone,
  User as UserIcon,
} from "lucide-react";
import PageSeo from "@/components/PageSeo";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";

declare global { interface Window { google?: any } }

type View = "login" | "signup" | "forgot" | "forgot-sent";

function useRedirectParam() {
  if (typeof window === "undefined") return "/";
  const p = new URLSearchParams(window.location.search).get("redirect");
  if (p && p.startsWith("/") && !p.startsWith("//")) return p;
  return "/";
}

function GoogleBtn({
  view,
  rememberMe,
  onSuccess,
}: {
  view: "login" | "signup";
  rememberMe: boolean;
  onSuccess: () => void;
}) {
  const { loginWithGoogle } = useAuth();
  const { toast } = useToast();
  const [enabled, setEnabled] = useState(false);
  const [clientId, setClientId] = useState("");
  const [ready, setReady] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/auth/google/config")
      .then((response) => response.json())
      .then((config) => {
        if (config.enabled && config.clientId) {
          setEnabled(true);
          setClientId(config.clientId);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const existing = document.getElementById("google-identity-script");
    if (existing) {
      setReady(true);
      return;
    }
    const script = document.createElement("script");
    script.id = "google-identity-script";
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => setReady(true);
    document.head.appendChild(script);
  }, [enabled]);

  useEffect(() => {
    if (!ready || !clientId || !ref.current || !window.google?.accounts?.id) return;
    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response: { credential: string }) => {
          try {
            await loginWithGoogle(response.credential, rememberMe);
            toast({ title: "Welcome!", description: "Signed in with Google" });
            onSuccess();
          } catch (error: any) {
            toast({ title: "Sign-in failed", description: error.message, variant: "destructive" });
          }
        },
      });
      ref.current.innerHTML = "";
      const width = Math.min(ref.current.offsetWidth || 320, 420);
      window.google.accounts.id.renderButton(ref.current, {
        theme: "outline",
        size: "large",
        width,
        text: view === "signup" ? "signup_with" : "continue_with",
        shape: "rectangular",
      });
    } catch {}
  }, [ready, clientId, view, rememberMe, loginWithGoogle, onSuccess, toast]);

  if (!enabled) return null;

  return (
    <div className="mt-5">
      <div className="mb-4 flex items-center gap-3" aria-hidden="true">
        <span className="h-px flex-1 bg-[#DCD1C7]" />
        <span className="font-serif text-sm text-[#746861]">or</span>
        <span className="h-px flex-1 bg-[#DCD1C7]" />
      </div>
      <div
        ref={ref}
        className="flex min-h-[44px] justify-center overflow-hidden rounded-lg"
        data-testid="google-signin-button"
      />
    </div>
  );
}

const viewCopy: Record<View, { title: string; description: string; panelTitle: string }> = {
  login: {
    title: "Welcome Back",
    description: "Sign in to continue your spiritual journey.",
    panelTitle: "Login as Devotee",
  },
  signup: {
    title: "Join Vedic Tatva",
    description: "Create your account and begin a more mindful journey.",
    panelTitle: "Create your Devotee account",
  },
  forgot: {
    title: "Reset Your Password",
    description: "We will help you return to your spiritual journey.",
    panelTitle: "Request a reset link",
  },
  "forgot-sent": {
    title: "Check Your Inbox",
    description: "Your secure password reset instructions are on their way.",
    panelTitle: "Reset link sent",
  },
};

function VedicSeal({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
      <circle cx="60" cy="60" r="47" fill="none" stroke="currentColor" strokeWidth="1" opacity=".7" />
      <circle cx="60" cy="60" r="37" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="2 5" opacity=".7" />
      <path d="M60 18 69 51 102 60 69 69 60 102 51 69 18 60 51 51Z" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M60 31 65 55 89 60 65 65 60 89 55 65 31 60 55 55Z" fill="none" stroke="currentColor" strokeWidth="1" opacity=".8" />
      <circle cx="60" cy="60" r="4" fill="currentColor" />
    </svg>
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
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [referralCode, setReferralCode] = useState(() => {
    if (typeof window === "undefined") return "";
    const p = new URLSearchParams(window.location.search).get("ref");
    return (
      p ||
      (typeof localStorage !== "undefined" ? localStorage.getItem("vt_referral_code") || "" : "")
    ).toUpperCase();
  });
  const [rememberMe, setRememberMe] = useState(true);
  const [showPwd, setShowPwd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationChallengeId, setVerificationChallengeId] = useState<number | null>(null);
  const [emailVerificationToken, setEmailVerificationToken] = useState("");
  const [verificationBusy, setVerificationBusy] = useState(false);

  useEffect(() => {
    if (user) setLocation(redirect);
  }, [user, redirect, setLocation]);

  useEffect(() => {
    setView(initialMode);
  }, [initialMode]);

  const handleSuccess = () => setLocation(redirect);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      if (view === "login") {
        await login(email, password, rememberMe);
        toast({ title: "Welcome back!", description: "You are now signed in" });
        handleSuccess();
      } else if (view === "signup") {
        if (!name.trim()) throw new Error("Please enter your full name");
        if (!/^\d{10}$/.test(phone.replace(/\D/g, ""))) throw new Error("Enter a valid 10-digit mobile number");
        if (password.length < 6) throw new Error("Password must be at least 6 characters");
        if (password !== confirmPassword) throw new Error("Passwords do not match");
        if (!emailVerificationToken) throw new Error("Please verify your email before creating your account");
        await register(
          {
            name: name.trim(),
            email,
            password,
            confirmPassword,
            phone: phone.replace(/\D/g, ""),
            emailVerificationToken,
            referralCode: referralCode.trim().toUpperCase() || undefined,
          } as any,
          rememberMe,
        );
        if (referralCode) {
          try {
            localStorage.removeItem("vt_referral_code");
          } catch {}
        }
        toast({ title: "Account created", description: "Welcome to Vedic Tatva" });
        handleSuccess();
      } else if (view === "forgot") {
        await requestPasswordReset(email);
        setView("forgot-sent");
      }
    } catch (error: any) {
      toast({
        title:
          view === "login"
            ? "Login failed"
            : view === "signup"
              ? "Signup failed"
              : "Could not send link",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const isBusy = submitting || loading;
  const copy = viewCopy[view];
  const isAccountView = view === "login" || view === "signup";

  const requestEmailVerification = async () => {
    setVerificationBusy(true);
    try {
      const response = await fetch("/api/auth/email-verification/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Could not send verification code");
      setVerificationChallengeId(data.challengeId);
      setVerificationCode("");
      setEmailVerificationToken("");
      toast({ title: "Verification code sent", description: "Check your email for the six-digit code." });
    } catch (error: any) {
      toast({ title: "Could not send code", description: error.message, variant: "destructive" });
    } finally {
      setVerificationBusy(false);
    }
  };

  const verifyEmailCode = async () => {
    if (!verificationChallengeId) return;
    setVerificationBusy(true);
    try {
      const response = await fetch("/api/auth/email-verification/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId: verificationChallengeId, email, code: verificationCode }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Could not verify email");
      setEmailVerificationToken(data.verificationToken);
      toast({ title: "Email verified", description: "You can now create your devotee account." });
    } catch (error: any) {
      toast({ title: "Verification failed", description: error.message, variant: "destructive" });
    } finally {
      setVerificationBusy(false);
    }
  };

  return (
    <>
      <PageSeo
        title={`${copy.title} | Vedic Tatva`}
        description="Securely sign in to your Vedic Tatva devotee account."
        canonical={view === "signup" ? "/register" : "/login"}
        noindex
      />

      <div className="relative min-h-[calc(100dvh-5rem)] overflow-hidden bg-[#f6f0e9] text-[#2b2020]">
        <style>{`
          @keyframes vt-auth-rise { from { opacity: 0; transform: translateY(10px) scale(.99); } to { opacity: 1; transform: translateY(0) scale(1); } }
          .vt-auth-enter { animation: vt-auth-rise 620ms cubic-bezier(.22,1,.36,1) both; }
          .vt-auth-delay { animation-delay: 100ms; }
          @media (prefers-reduced-motion: reduce) { .vt-auth-enter { animation: none; } }
        `}</style>
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          aria-hidden="true"
          style={{
            background:
              "radial-gradient(circle at 12% 5%, rgba(224,177,104,0.24), transparent 30%), radial-gradient(circle at 92% 68%, rgba(163,91,105,0.16), transparent 34%), linear-gradient(135deg, rgba(255,255,255,.34), transparent 50%)",
          }}
        />
        <div className="pointer-events-none absolute -right-28 top-16 h-[420px] w-[420px] text-[#8f6d36]/15 opacity-70 sm:h-[560px] sm:w-[560px]">
          <VedicSeal className="h-full w-full" />
        </div>

        <main className="relative mx-auto flex w-full max-w-[760px] flex-col px-4 pb-10 pt-8 sm:px-8 sm:pb-16 sm:pt-12 lg:py-16">
          <div className="mx-auto w-full max-w-[620px]">
          <header className="vt-auth-enter mx-auto max-w-lg text-center">
            <div className="mx-auto mb-5 h-px w-12 bg-[#B9944D]/75" aria-hidden="true" />
            <h1 className="font-vedic text-[34px] font-normal leading-[1.08] tracking-[-0.025em] text-[#20191A] sm:text-[42px]">
              {copy.title}
            </h1>
            <p className="mt-3 text-[15px] leading-6 text-[#726863] sm:text-base">
              {copy.description}
            </p>
            {isAccountView && (
              <div className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] tracking-[0.01em] text-[#756B66] sm:text-xs">
                <span>Sacred Products</span>
                <span className="h-3 w-px bg-[#CFC1B5]" aria-hidden="true" />
                <span>Trusted Experts</span>
                <span className="h-3 w-px bg-[#CFC1B5]" aria-hidden="true" />
                <span>A More Mindful You</span>
              </div>
            )}
          </header>

          <section className="vt-auth-enter vt-auth-delay mt-7 rounded-[24px] border border-white/75 bg-white/55 px-5 py-6 shadow-[0_24px_70px_rgba(109,43,53,0.13),inset_0_1px_0_rgba(255,255,255,.85)] backdrop-blur-xl sm:mt-9 sm:px-8 sm:py-8">
            {(view === "forgot" || view === "forgot-sent") && (
              <button
                type="button"
                onClick={() => setView("login")}
                className="mb-4 inline-flex min-h-9 items-center gap-1.5 rounded-md text-xs font-medium text-[#6D2B35] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8D3442]/35"
                data-testid="button-back-to-login"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to sign in
              </button>
            )}

            <div className="text-center">
              <h2 className="font-vedic text-[22px] font-normal leading-tight text-[#6D2B35] sm:text-[25px]">
                {copy.panelTitle}
              </h2>
              <p className="mx-auto mt-1.5 max-w-md text-[13px] leading-5 text-[#756A66] sm:text-sm">
                {view === "login"
                  ? "Access your orders, puja bookings, saved items and more."
                  : view === "signup"
                    ? "Save your favourites, manage bookings and track every order."
                    : view === "forgot"
                      ? "Enter your account email and we will send you a secure reset link."
                      : "If an account matches the email below, a reset link has been sent."}
              </p>
            </div>

            {view === "forgot-sent" ? (
              <div className="py-5 text-center">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-[#B9944D]/30 bg-[#F8F0DF] text-[#6D2B35]">
                  <CheckCircle2 className="h-7 w-7" strokeWidth={1.6} />
                </div>
                <p className="mt-5 text-sm leading-6 text-[#5F5551]">
                  If an account exists for{" "}
                  <span className="font-semibold text-[#6D2B35]">{email}</span>, we&apos;ve sent a
                  password reset link. The link expires in 30 minutes.
                </p>
                <p className="mt-2 text-xs text-[#7E736E]">
                  Didn&apos;t get it? Check your spam folder or try again.
                </p>
                <Button
                  type="button"
                  onClick={() => setView("login")}
                  className="mt-6 h-12 w-full rounded-lg bg-[#8D2230] font-serif text-base text-white shadow-[0_8px_20px_rgba(109,43,53,0.16)] hover:bg-[#731B27]"
                  data-testid="button-back-to-login-cta"
                >
                  Back to sign in
                </Button>
              </div>
            ) : (
              <>
                <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate={false}>
                  {view === "signup" && (
                    <>
                      <AuthField
                        id="auth-name"
                        label="Full name"
                        icon={UserIcon}
                        value={name}
                        onChange={setName}
                        placeholder="Your full name"
                        autoComplete="name"
                        testId="input-name"
                      />
                      <AuthField
                        id="auth-phone"
                        label="Mobile number"
                        icon={Phone}
                        type="tel"
                        value={phone}
                        onChange={(value) => setPhone(value.replace(/\D/g, "").slice(0, 10))}
                        placeholder="10-digit mobile number"
                        autoComplete="tel-national"
                        testId="input-phone"
                      />
                      <div>
                        <div className="mb-1.5 flex items-center justify-between gap-3">
                          <Label htmlFor="auth-ref" className="text-[13px] font-medium text-[#4F4543]">
                            Referral code <span className="font-normal text-[#8B807B]">(optional)</span>
                          </Label>
                          {referralCode && (
                            <span className="text-[11px] font-medium text-emerald-700">
                              Bonus points unlocked
                            </span>
                          )}
                        </div>
                        <Input
                          id="auth-ref"
                          data-testid="input-referral-code"
                          value={referralCode}
                          onChange={(event) => setReferralCode(event.target.value.toUpperCase())}
                          placeholder="e.g. VEDIC1234"
                          className="h-12 rounded-lg border-[#D8D0CA] bg-white/70 px-4 text-sm uppercase tracking-wider focus-visible:border-[#8D3442] focus-visible:ring-[#8D3442]/15"
                          maxLength={20}
                        />
                      </div>
                    </>
                  )}

                  {view === "signup" ? (
                    <div>
                      <Label htmlFor="auth-email" className="mb-1.5 block text-[13px] font-medium text-[#4F4543]">
                        Email address
                      </Label>
                      <div className="flex gap-2">
                        <div className="relative min-w-0 flex-1">
                          <Mail className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#7C7470]" strokeWidth={1.6} />
                          <Input
                            id="auth-email"
                            data-testid="input-email"
                            type="email"
                            value={email}
                            onChange={(event) => {
                              setEmail(event.target.value);
                              setVerificationChallengeId(null);
                              setEmailVerificationToken("");
                            }}
                            placeholder="you@example.com"
                            className="h-12 rounded-lg border-[#D8D0CA] bg-white/70 pl-11 pr-4 text-[15px] focus-visible:border-[#8D3442] focus-visible:ring-[#8D3442]/15"
                            autoComplete="email"
                            required
                            disabled={Boolean(emailVerificationToken)}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={requestEmailVerification}
                          disabled={verificationBusy || !email || Boolean(emailVerificationToken)}
                          className="h-12 shrink-0 rounded-lg border-[#8D2230]/35 px-3 text-xs font-semibold text-[#6D2B35] hover:bg-[#F7F0EA]"
                          data-testid="button-send-email-code"
                        >
                          {emailVerificationToken ? "Verified" : verificationChallengeId ? "Resend code" : "Verify email"}
                        </Button>
                      </div>
                      {emailVerificationToken ? (
                        <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-emerald-700" role="status">
                          <CheckCircle2 className="h-4 w-4" /> Email verified
                        </p>
                      ) : verificationChallengeId ? (
                        <div className="mt-3 flex gap-2">
                          <Input
                            value={verificationCode}
                            onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            placeholder="6-digit code"
                            aria-label="Email verification code"
                            className="h-11 rounded-lg border-[#D8D0CA] bg-white/70 tracking-[0.25em]"
                            data-testid="input-email-verification-code"
                          />
                          <Button
                            type="button"
                            onClick={verifyEmailCode}
                            disabled={verificationBusy || verificationCode.length !== 6}
                            className="h-11 shrink-0 rounded-lg bg-[#6D2B35] px-4 text-white hover:bg-[#581F28]"
                            data-testid="button-verify-email-code"
                          >
                            Confirm
                          </Button>
                        </div>
                      ) : (
                        <p className="mt-1.5 text-[11px] text-[#7B706B]">Verification is required before account creation.</p>
                      )}
                    </div>
                  ) : (
                    <AuthField
                      id="auth-email"
                      label="Email address"
                      icon={Mail}
                      type="email"
                      value={email}
                      onChange={setEmail}
                      placeholder="you@example.com"
                      autoComplete="email"
                      testId="input-email"
                    />
                  )}

                  {view !== "forgot" && (
                    <div>
                      <Label htmlFor="auth-password" className="mb-1.5 block text-[13px] font-medium text-[#4F4543]">
                        Password
                      </Label>
                      <div className="relative">
                        <Lock
                          className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#7C7470]"
                          strokeWidth={1.6}
                        />
                        <Input
                          id="auth-password"
                          data-testid="input-password"
                          type={showPwd ? "text" : "password"}
                          value={password}
                          onChange={(event) => setPassword(event.target.value)}
                          placeholder={view === "signup" ? "At least 6 characters" : "Enter your password"}
                          className="h-12 rounded-lg border-[#D8D0CA] bg-white/70 pl-11 pr-12 text-[15px] focus-visible:border-[#8D3442] focus-visible:ring-[#8D3442]/15"
                          autoComplete={view === "signup" ? "new-password" : "current-password"}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPwd((visible) => !visible)}
                          className="absolute right-1 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-md text-[#7C7470] hover:bg-[#F5EFE9] hover:text-[#6D2B35] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8D3442]/30"
                          aria-label={showPwd ? "Hide password" : "Show password"}
                          data-testid="button-toggle-password"
                        >
                          {showPwd ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                        </button>
                      </div>
                    </div>
                  )}

                  {view === "signup" && (
                    <div>
                      <Label htmlFor="auth-confirm-password" className="mb-1.5 block text-[13px] font-medium text-[#4F4543]">
                        Re-enter password
                      </Label>
                      <div className="relative">
                        <Lock className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#7C7470]" strokeWidth={1.6} />
                        <Input
                          id="auth-confirm-password"
                          data-testid="input-confirm-password"
                          type={showPwd ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(event) => setConfirmPassword(event.target.value)}
                          placeholder="Re-enter your password"
                          className="h-12 rounded-lg border-[#D8D0CA] bg-white/70 pl-11 pr-4 text-[15px] focus-visible:border-[#8D3442] focus-visible:ring-[#8D3442]/15"
                          autoComplete="new-password"
                          required
                          aria-describedby={confirmPassword && password !== confirmPassword ? "password-match-error" : undefined}
                        />
                      </div>
                      {confirmPassword && password !== confirmPassword && (
                        <p id="password-match-error" className="mt-1.5 text-xs text-red-700" role="alert">
                          Passwords do not match.
                        </p>
                      )}
                    </div>
                  )}

                  {isAccountView && (
                    <div className="flex items-center justify-between gap-4 pt-0.5">
                      <label className="flex min-h-9 cursor-pointer select-none items-center gap-2.5">
                        <Checkbox
                          checked={rememberMe}
                          onCheckedChange={(checked) => setRememberMe(Boolean(checked))}
                          className="border-[#8B7772] data-[state=checked]:border-[#8D2230] data-[state=checked]:bg-[#8D2230]"
                          data-testid="checkbox-remember-me"
                        />
                        <span className="text-[13px] text-[#433A38]">Keep me signed in</span>
                      </label>
                      {view === "login" && (
                        <button
                          type="button"
                          onClick={() => setView("forgot")}
                          className="min-h-9 shrink-0 text-[13px] font-medium text-[#6D2B35] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8D3442]/30"
                          data-testid="button-forgot-password"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="h-12 w-full rounded-lg bg-[#8D2230] font-serif text-base text-white shadow-[0_8px_20px_rgba(109,43,53,0.16)] hover:bg-[#731B27] focus-visible:ring-[#B9944D] disabled:bg-[#A9868B]"
                    disabled={isBusy || (view === "signup" && !emailVerificationToken)}
                    data-testid="button-submit-auth"
                  >
                    {isBusy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {view === "login" ? "Sign In" : view === "signup" ? "Create Account" : "Send reset link"}
                    {!isBusy && <ArrowRight className="ml-2 h-4 w-4" strokeWidth={1.7} />}
                  </Button>
                </form>

                {isAccountView && (
                  <GoogleBtn view={view} rememberMe={rememberMe} onSuccess={handleSuccess} />
                )}

                {view !== "forgot" && (
                  <p className="mt-6 text-center text-[14px] text-[#554B48]">
                    {view === "login" ? (
                      <>
                        New to Vedic Tatva?{" "}
                        <button
                          type="button"
                          onClick={() => setView("signup")}
                          className="inline-flex min-h-8 items-center gap-1 font-medium text-[#6D2B35] underline decoration-[#6D2B35]/35 underline-offset-4 hover:decoration-[#6D2B35] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8D3442]/30"
                          data-testid="button-switch-signup"
                        >
                          Create an account <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </>
                    ) : (
                      <>
                        Already have an account?{" "}
                        <button
                          type="button"
                          onClick={() => setView("login")}
                          className="inline-flex min-h-8 items-center gap-1 font-medium text-[#6D2B35] underline decoration-[#6D2B35]/35 underline-offset-4 hover:decoration-[#6D2B35] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8D3442]/30"
                          data-testid="button-switch-login"
                        >
                          Sign in <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}
                  </p>
                )}

                {isAccountView && (
                  <div className="mt-3 text-center">
                    <Link
                      href="/"
                      className="inline-flex min-h-10 items-center gap-1.5 rounded-md px-3 text-[13px] font-medium text-[#6D2B35] underline decoration-[#6D2B35]/25 underline-offset-4 transition-colors hover:bg-[#F7F0EA] hover:decoration-[#6D2B35] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8D3442]/30"
                      data-testid="link-continue-browsing"
                    >
                      Continue as guest
                      <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.7} />
                    </Link>
                  </div>
                )}

                <p className="mx-auto mt-5 max-w-sm text-center text-[11px] leading-5 text-[#7B706B]">
                  By continuing, you agree to Vedic Tatva&apos;s{" "}
                  <Link href="/terms-conditions" className="underline underline-offset-2 hover:text-[#6D2B35]">
                    Terms
                  </Link>{" "}
                  &amp;{" "}
                  <Link href="/privacy-policy" className="underline underline-offset-2 hover:text-[#6D2B35]">
                    Privacy Policy
                  </Link>
                  .
                </p>
              </>
            )}
          </section>
          </div>
        </main>
      </div>
    </>
  );
}

function AuthField({
  id,
  label,
  icon: Icon,
  type = "text",
  value,
  onChange,
  placeholder,
  autoComplete,
  testId,
}: {
  id: string;
  label: string;
  icon: typeof Mail;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  autoComplete: string;
  testId: string;
}) {
  return (
    <div>
      <Label htmlFor={id} className="mb-1.5 block text-[13px] font-medium text-[#4F4543]">
        {label}
      </Label>
      <div className="relative">
        <Icon
          className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#7C7470]"
          strokeWidth={1.6}
        />
        <Input
          id={id}
          data-testid={testId}
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="h-12 rounded-lg border-[#D8D0CA] bg-white/70 pl-11 pr-4 text-[15px] focus-visible:border-[#8D3442] focus-visible:ring-[#8D3442]/15"
          autoComplete={autoComplete}
          required
        />
      </div>
    </div>
  );
}
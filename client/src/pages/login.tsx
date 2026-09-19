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
    return (
      p ||
      (typeof localStorage !== "undefined" ? localStorage.getItem("vt_referral_code") || "" : "")
    ).toUpperCase();
  });
  const [rememberMe, setRememberMe] = useState(true);
  const [showPwd, setShowPwd] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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
        if (password.length < 6) throw new Error("Password must be at least 6 characters");
        await register(
          {
            name: name.trim(),
            email,
            password,
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

  return (
    <>
      <PageSeo
        title={`${copy.title} | Vedic Tatva`}
        description="Securely sign in to your Vedic Tatva devotee account."
        canonical={view === "signup" ? "/register" : "/login"}
        noindex
      />

      <div className="relative min-h-[calc(100dvh-5rem)] overflow-hidden bg-[#FBF8F2] text-[#231C1D]">
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          aria-hidden="true"
          style={{
            background:
              "radial-gradient(circle at 15% 8%, rgba(183,145,73,0.08), transparent 30%), radial-gradient(circle at 90% 75%, rgba(109,43,53,0.055), transparent 32%)",
          }}
        />

        <main className="relative mx-auto flex w-full max-w-[620px] flex-col px-4 pb-10 pt-9 sm:px-8 sm:pb-16 sm:pt-14">
          <header className="mx-auto max-w-lg text-center">
            <span className="mx-auto mb-4 block h-px w-10 bg-[#B9944D]" aria-hidden="true" />
            <h1 className="font-serif text-[36px] font-semibold leading-[1.05] tracking-[-0.025em] text-[#20191A] sm:text-[44px]">
              {copy.title}
            </h1>
            <p className="mt-2 text-[15px] leading-6 text-[#726863] sm:text-base">
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

          <section className="mt-7 rounded-[22px] border border-white/90 bg-white/65 px-5 py-6 shadow-[0_18px_55px_rgba(78,49,39,0.075)] backdrop-blur-md sm:mt-9 sm:px-8 sm:py-8">
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
              <h2 className="font-serif text-[25px] font-semibold leading-tight text-[#6D2B35] sm:text-[28px]">
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
                    disabled={isBusy}
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
                      Continue browsing without signing in
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
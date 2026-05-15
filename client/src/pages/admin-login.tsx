import { useState } from "react";
import { Link } from "wouter";
import { Shield, Lock, Eye, EyeOff, Loader2, KeyRound, ArrowLeft, Smartphone, Mail, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

interface AdminLoginProps {
  onLogin: (token: string, user: any) => void;
}

export default function AdminLogin({ onLogin }: AdminLoginProps) {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"credentials" | "2fa" | "forgot" | "reset">("credentials");
  const [tempToken, setTempToken] = useState("");
  const [userId, setUserId] = useState<number>(0);
  const [twoFAMethod, setTwoFAMethod] = useState("authenticator");
  const [forgotEmail, setForgotEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resetToken, setResetToken] = useState("");

  const handleForgotPassword = async () => {
    if (!forgotEmail) {
      toast({ title: "Email Required", description: "Please enter your admin email address", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "Error", description: data.message || "Failed to process request", variant: "destructive" });
        return;
      }
      setResetToken(data.resetToken || "");
      setStep("reset");
      toast({ title: "Reset code sent", description: `Check the inbox for ${forgotEmail} for a 6-digit code. It expires in 15 minutes.` });
    } catch {
      toast({ title: "Error", description: "Connection failed. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetCode || resetCode.length !== 6) {
      toast({ title: "Invalid Code", description: "Please enter the 6-digit reset code", variant: "destructive" });
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      toast({ title: "Weak Password", description: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Mismatch", description: "Passwords do not match", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail, code: resetCode, newPassword, resetToken }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "Reset Failed", description: data.message || "Could not reset password", variant: "destructive" });
        return;
      }
      toast({ title: "Password Reset", description: "Your password has been changed. Please log in with your new password." });
      setStep("credentials");
      setForgotEmail("");
      setResetCode("");
      setNewPassword("");
      setConfirmPassword("");
      setResetToken("");
    } catch {
      toast({ title: "Error", description: "Connection failed. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      toast({ title: "Missing Fields", description: "Please enter email and password", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "Login Failed", description: data.message || "Invalid credentials", variant: "destructive" });
        return;
      }
      if (data.requires2FA) {
        setTempToken(data.tempToken);
        setUserId(data.userId);
        setTwoFAMethod(data.method);
        setStep("2fa");
        toast({ title: "Verification Required", description: "Enter the code from your authenticator app" });
      } else {
        // Cookie-only auth (15B): server set httpOnly vt_admin_token via Set-Cookie.
        // We no longer write the session token to localStorage where XSS can steal it.
        onLogin(data.token, data.user);
        toast({ title: "Welcome back!", description: "Admin login successful" });
      }
    } catch {
      toast({ title: "Error", description: "Connection failed. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-[#F5F0E6] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link href="/" className="inline-flex items-center gap-1.5 text-[#5a4a3a]/40 hover:text-[#6D2B35] text-sm mb-6 transition-colors" data-testid="link-back-home">
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-[#6D2B35]/10 shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-br from-[#6D2B35] via-[#8B3A47] to-[#6D2B35] text-white p-6 text-center">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur-sm">
                <Shield className="h-8 w-8 text-[#D4AF37]" />
              </div>
              <h1 className="font-serif text-2xl font-bold" data-testid="text-admin-login-title">Admin Login</h1>
              <p className="text-white/50 text-sm mt-1">Vedic Tatva Administration Panel</p>
            </div>

            <CardContent className="p-6">
              {step === "credentials" ? (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[#6D2B35] uppercase tracking-wider">Email Address</label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@vedictatva.com"
                      className="border-[#6D2B35]/15 focus:border-[#D4AF37]"
                      data-testid="input-admin-email"
                      onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[#6D2B35] uppercase tracking-wider">Password</label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter admin password"
                        className="border-[#6D2B35]/15 focus:border-[#D4AF37] pr-10"
                        data-testid="input-admin-password"
                        onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5a4a3a]/30 hover:text-[#6D2B35]"
                        data-testid="btn-toggle-password"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <Button
                    onClick={handleLogin}
                    disabled={loading || !email || !password}
                    className="w-full bg-[#6D2B35] hover:bg-[#5a2430] text-white py-5 text-base font-semibold"
                    data-testid="btn-admin-login"
                  >
                    {loading ? (
                      <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Authenticating...</>
                    ) : (
                      <><Lock className="h-4 w-4 mr-2" /> Sign In</>
                    )}
                  </Button>
                  <button
                    onClick={() => { setStep("forgot"); setForgotEmail(email); }}
                    className="w-full text-sm text-[#5a4a3a]/50 hover:text-[#6D2B35] transition-colors mt-1"
                    data-testid="btn-forgot-password"
                  >
                    Forgot Password?
                  </button>
                </div>
              ) : step === "forgot" ? (
                <div className="space-y-4">
                  <div className="text-center mb-4">
                    <div className="w-12 h-12 bg-[#D4AF37]/10 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Mail className="h-6 w-6 text-[#D4AF37]" />
                    </div>
                    <h2 className="font-serif text-lg font-bold text-[#6D2B35]">Forgot Password</h2>
                    <p className="text-sm text-[#5a4a3a]/50 mt-1">
                      Enter your admin email to receive a reset code
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[#6D2B35] uppercase tracking-wider">Admin Email</label>
                    <Input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="admin@vedictatva.com"
                      className="border-[#6D2B35]/15 focus:border-[#D4AF37]"
                      data-testid="input-forgot-email"
                      onKeyDown={(e) => e.key === "Enter" && handleForgotPassword()}
                    />
                  </div>
                  <Button
                    onClick={handleForgotPassword}
                    disabled={loading || !forgotEmail}
                    className="w-full bg-[#6D2B35] hover:bg-[#5a2430] text-white py-5 text-base font-semibold"
                    data-testid="btn-send-reset"
                  >
                    {loading ? (
                      <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Sending...</>
                    ) : (
                      <><ArrowRight className="h-4 w-4 mr-2" /> Send Reset Code</>
                    )}
                  </Button>
                  <button
                    onClick={() => { setStep("credentials"); setForgotEmail(""); }}
                    className="w-full text-sm text-[#5a4a3a]/40 hover:text-[#6D2B35] transition-colors"
                    data-testid="btn-back-from-forgot"
                  >
                    Back to login
                  </button>
                </div>
              ) : step === "reset" ? (
                <div className="space-y-4">
                  <div className="text-center mb-4">
                    <div className="w-12 h-12 bg-[#D4AF37]/10 rounded-full flex items-center justify-center mx-auto mb-3">
                      <KeyRound className="h-6 w-6 text-[#D4AF37]" />
                    </div>
                    <h2 className="font-serif text-lg font-bold text-[#6D2B35]">Reset Password</h2>
                    <p className="text-sm text-[#5a4a3a]/50 mt-1">
                      Enter the reset code and set your new password
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[#6D2B35] uppercase tracking-wider">Reset Code</label>
                    <Input
                      type="text"
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="000000"
                      className="text-center text-2xl tracking-[0.5em] font-mono border-[#6D2B35]/15 focus:border-[#D4AF37]"
                      maxLength={6}
                      data-testid="input-reset-code"
                      autoFocus
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[#6D2B35] uppercase tracking-wider">New Password</label>
                    <div className="relative">
                      <Input
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        className="border-[#6D2B35]/15 focus:border-[#D4AF37] pr-10"
                        data-testid="input-new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5a4a3a]/30 hover:text-[#6D2B35]"
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[#6D2B35] uppercase tracking-wider">Confirm Password</label>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className="border-[#6D2B35]/15 focus:border-[#D4AF37]"
                      data-testid="input-confirm-password"
                      onKeyDown={(e) => e.key === "Enter" && handleResetPassword()}
                    />
                  </div>
                  <Button
                    onClick={handleResetPassword}
                    disabled={loading || resetCode.length !== 6 || !newPassword || !confirmPassword}
                    className="w-full bg-[#6D2B35] hover:bg-[#5a2430] text-white py-5 text-base font-semibold"
                    data-testid="btn-reset-password"
                  >
                    {loading ? (
                      <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Resetting...</>
                    ) : (
                      <><Lock className="h-4 w-4 mr-2" /> Reset Password</>
                    )}
                  </Button>
                  <button
                    onClick={() => { setStep("credentials"); setResetCode(""); setNewPassword(""); setConfirmPassword(""); }}
                    className="w-full text-sm text-[#5a4a3a]/40 hover:text-[#6D2B35] transition-colors"
                    data-testid="btn-back-from-reset"
                  >
                    Back to login
                  </button>
                </div>
              ) : (
                <TwoFAStep
                  tempToken={tempToken}
                  userId={userId}
                  defaultMethod={twoFAMethod}
                  onSuccess={(token, user) => {
                    onLogin(token, user);
                    toast({ title: "Welcome back!", description: "Admin login successful" });
                  }}
                  onBack={() => setStep("credentials")}
                />
              )}

              <div className="mt-6 pt-4 border-t border-[#6D2B35]/5 text-center">
                <div className="flex items-center justify-center gap-2 text-[10px] text-[#5a4a3a]/25 uppercase tracking-widest">
                  <Shield className="h-3 w-3" /> Secured Access
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

type TwoFAMode = "totp" | "email" | "recovery";

function TwoFAStep({
  tempToken,
  userId,
  defaultMethod,
  onSuccess,
  onBack,
}: {
  tempToken: string;
  userId: number;
  defaultMethod: string;
  onSuccess: (token: string, user: any) => void;
  onBack: () => void;
}) {
  const { toast } = useToast();
  const [mode, setMode] = useState<TwoFAMode>(defaultMethod === "email" ? "email" : "totp");
  const [code, setCode] = useState("");
  const [recovery, setRecovery] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const requestEmailOtp = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/2fa/request-email-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ tempToken, userId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast({ title: "Could not send code", description: data.message || "Please try again", variant: "destructive" });
        return;
      }
      setEmailSent(true);
      setCode("");
      toast({ title: "Code sent", description: "Check your admin inbox. The code expires in 10 minutes." });
    } catch {
      toast({ title: "Error", description: "Connection failed. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const submitCode = async () => {
    if (mode === "recovery") {
      if (!recovery.trim()) {
        toast({ title: "Enter a recovery code", variant: "destructive" });
        return;
      }
    } else if (code.length !== 6) {
      toast({ title: "Invalid code", description: "Enter the 6-digit code", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const url =
        mode === "totp" ? "/api/admin/verify-2fa" :
        mode === "email" ? "/api/admin/2fa/verify-email-otp" :
        "/api/admin/2fa/verify-recovery-code";
      const body =
        mode === "recovery"
          ? { tempToken, userId, code: recovery.trim() }
          : { tempToken, userId, code };
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast({ title: "Verification failed", description: data.message || "Invalid code", variant: "destructive" });
        return;
      }
      if (mode === "recovery" && typeof data.recoveryCodesRemaining === "number") {
        toast({
          title: data.recoveryCodesRemaining === 0 ? "Last recovery code used" : "Recovery code accepted",
          description: data.recoveryCodesRemaining === 0
            ? "Generate a fresh batch from Security → Recovery Codes."
            : `${data.recoveryCodesRemaining} recovery code${data.recoveryCodesRemaining === 1 ? "" : "s"} left.`,
          variant: data.recoveryCodesRemaining === 0 ? "destructive" : "default",
        });
      }
      onSuccess(data.token, data.user);
    } catch {
      toast({ title: "Error", description: "Verification failed. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <div className="w-12 h-12 bg-[#D4AF37]/10 rounded-full flex items-center justify-center mx-auto mb-3">
          {mode === "totp" ? <Smartphone className="h-6 w-6 text-[#D4AF37]" />
            : mode === "email" ? <Mail className="h-6 w-6 text-[#D4AF37]" />
            : <KeyRound className="h-6 w-6 text-[#D4AF37]" />}
        </div>
        <h2 className="font-serif text-lg font-bold text-[#6D2B35]">
          {mode === "totp" ? "Authenticator code"
            : mode === "email" ? "Email verification"
            : "Recovery code"}
        </h2>
        <p className="text-sm text-[#5a4a3a]/50 mt-1">
          {mode === "totp" ? "Enter the 6-digit code from your authenticator app"
            : mode === "email" ? (emailSent ? "Enter the 6-digit code we just emailed you" : "Send a one-time code to your admin email")
            : "Enter one of your single-use backup codes"}
        </p>
      </div>

      {mode === "recovery" ? (
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[#6D2B35] uppercase tracking-wider">Recovery code</label>
          <Input
            type="text"
            value={recovery}
            onChange={(e) => setRecovery(e.target.value)}
            placeholder="abcd-efgh"
            className="text-center text-lg font-mono tracking-[0.2em] border-[#6D2B35]/15 focus:border-[#D4AF37]"
            data-testid="input-2fa-recovery"
            onKeyDown={(e) => e.key === "Enter" && submitCode()}
            autoFocus
          />
        </div>
      ) : (mode === "email" && !emailSent) ? null : (
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[#6D2B35] uppercase tracking-wider">Verification code</label>
          <Input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="000000"
            className="text-center text-2xl tracking-[0.5em] font-mono border-[#6D2B35]/15 focus:border-[#D4AF37]"
            maxLength={6}
            data-testid="input-2fa-code"
            onKeyDown={(e) => e.key === "Enter" && submitCode()}
            autoFocus
          />
        </div>
      )}

      {mode === "email" && !emailSent ? (
        <Button
          onClick={requestEmailOtp}
          disabled={loading}
          className="w-full bg-[#6D2B35] hover:bg-[#5a2430] text-white py-5 text-base font-semibold"
          data-testid="btn-2fa-send-email"
        >
          {loading ? (<><Loader2 className="h-4 w-4 animate-spin mr-2" /> Sending...</>) : (<><Mail className="h-4 w-4 mr-2" /> Email me a code</>)}
        </Button>
      ) : (
        <Button
          onClick={submitCode}
          disabled={loading || (mode === "recovery" ? !recovery.trim() : code.length !== 6)}
          className="w-full bg-[#6D2B35] hover:bg-[#5a2430] text-white py-5 text-base font-semibold"
          data-testid="btn-2fa-verify"
        >
          {loading ? (<><Loader2 className="h-4 w-4 animate-spin mr-2" /> Verifying...</>) : (<><KeyRound className="h-4 w-4 mr-2" /> Verify & Sign In</>)}
        </Button>
      )}

      {mode === "email" && emailSent && (
        <button
          onClick={requestEmailOtp}
          disabled={loading}
          className="w-full text-xs text-[#5a4a3a]/50 hover:text-[#6D2B35] transition-colors"
          data-testid="btn-2fa-resend-email"
        >
          Didn't get it? Resend code
        </button>
      )}

      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 pt-2 text-xs">
        {mode !== "totp" && (
          <button onClick={() => { setMode("totp"); setCode(""); setEmailSent(false); }} className="text-[#5a4a3a]/60 hover:text-[#6D2B35]" data-testid="btn-2fa-mode-totp">
            Use authenticator app
          </button>
        )}
        {mode !== "email" && (
          <button onClick={() => { setMode("email"); setCode(""); setEmailSent(false); }} className="text-[#5a4a3a]/60 hover:text-[#6D2B35]" data-testid="btn-2fa-mode-email">
            Email me a code
          </button>
        )}
        {mode !== "recovery" && (
          <button onClick={() => { setMode("recovery"); setRecovery(""); setEmailSent(false); }} className="text-[#5a4a3a]/60 hover:text-[#6D2B35]" data-testid="btn-2fa-mode-recovery">
            Use a recovery code
          </button>
        )}
      </div>

      <button
        onClick={onBack}
        className="w-full text-sm text-[#5a4a3a]/40 hover:text-[#6D2B35] transition-colors"
        data-testid="btn-back-to-login"
      >
        Back to login
      </button>
    </div>
  );
}

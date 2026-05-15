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
  const [twoFACode, setTwoFACode] = useState("");
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
        localStorage.setItem("adminToken", data.token);
        onLogin(data.token, data.user);
        toast({ title: "Welcome back!", description: "Admin login successful" });
      }
    } catch {
      toast({ title: "Error", description: "Connection failed. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async () => {
    if (!twoFACode || twoFACode.length !== 6) {
      toast({ title: "Invalid Code", description: "Please enter the 6-digit code", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/verify-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ tempToken, code: twoFACode, userId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "Verification Failed", description: data.message || "Invalid code", variant: "destructive" });
        return;
      }
      localStorage.setItem("adminToken", data.token);
      onLogin(data.token, data.user);
      toast({ title: "Welcome back!", description: "Admin login successful" });
    } catch {
      toast({ title: "Error", description: "Verification failed. Please try again.", variant: "destructive" });
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
                <div className="space-y-4">
                  <div className="text-center mb-4">
                    <div className="w-12 h-12 bg-[#D4AF37]/10 rounded-full flex items-center justify-center mx-auto mb-3">
                      {twoFAMethod === "authenticator" ? (
                        <Smartphone className="h-6 w-6 text-[#D4AF37]" />
                      ) : (
                        <KeyRound className="h-6 w-6 text-[#D4AF37]" />
                      )}
                    </div>
                    <h2 className="font-serif text-lg font-bold text-[#6D2B35]">Two-Factor Verification</h2>
                    <p className="text-sm text-[#5a4a3a]/50 mt-1">
                      {twoFAMethod === "authenticator"
                        ? "Enter the 6-digit code from your authenticator app"
                        : "Enter the verification code sent to your phone"}
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[#6D2B35] uppercase tracking-wider">Verification Code</label>
                    <Input
                      type="text"
                      value={twoFACode}
                      onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="000000"
                      className="text-center text-2xl tracking-[0.5em] font-mono border-[#6D2B35]/15 focus:border-[#D4AF37]"
                      maxLength={6}
                      data-testid="input-2fa-code"
                      onKeyDown={(e) => e.key === "Enter" && handleVerify2FA()}
                      autoFocus
                    />
                  </div>
                  <Button
                    onClick={handleVerify2FA}
                    disabled={loading || twoFACode.length !== 6}
                    className="w-full bg-[#6D2B35] hover:bg-[#5a2430] text-white py-5 text-base font-semibold"
                    data-testid="btn-verify-2fa"
                  >
                    {loading ? (
                      <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Verifying...</>
                    ) : (
                      <><KeyRound className="h-4 w-4 mr-2" /> Verify & Sign In</>
                    )}
                  </Button>
                  <button
                    onClick={() => { setStep("credentials"); setTwoFACode(""); }}
                    className="w-full text-sm text-[#5a4a3a]/40 hover:text-[#6D2B35] transition-colors"
                    data-testid="btn-back-to-login"
                  >
                    Back to login
                  </button>
                </div>
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

import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Lock, Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react";

export default function ResetPasswordPage() {
  const [, setLocation] = useLocation();
  const { resetPassword, loading } = useAuth();
  const { toast } = useToast();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token") || "";
    setToken(t);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast({ title: "Passwords don't match", description: "Please re-enter the same password in both fields.", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Password too short", description: "Use at least 6 characters.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await resetPassword(token, password);
      setSuccess(true);
      toast({ title: "Password updated", description: "You are now signed in." });
      setTimeout(() => setLocation("/"), 1200);
    } catch (err: any) {
      toast({ title: "Reset failed", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-[#FBF7EE]">
      <div className="w-full max-w-[400px] bg-white rounded-xl border border-[#D4AF37]/25 overflow-hidden shadow-sm">
        <div
          className="px-6 pt-6 pb-4 text-center"
          style={{ background: "linear-gradient(135deg, #fdf6e3 0%, #f5e6c8 100%)", borderBottom: "1px solid rgba(212, 175, 55, 0.25)" }}
        >
          <div className="text-2xl font-serif text-[#6D2B35] tracking-wide">Vedic Tatva</div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-[#6D2B35]/65 mt-1">
            Heritage · Wellness · Purity
          </div>
          <h1 className="text-[15px] font-medium text-[#6D2B35] mt-3 font-sans">Choose a new password</h1>
          <p className="text-[11px] text-[#6D2B35]/65 mt-0.5">
            Enter a new password for your account
          </p>
        </div>

        <div className="p-6">
          {!token ? (
            <div className="text-center py-4 space-y-3">
              <div className="mx-auto h-12 w-12 rounded-full bg-[#FBF7EE] flex items-center justify-center border border-[#6D2B35]/20">
                <AlertCircle className="h-6 w-6 text-[#6D2B35]" />
              </div>
              <p className="text-[13px] text-[#5a4a3a]">
                This reset link is missing or invalid. Please request a new one.
              </p>
              <Button
                onClick={() => setLocation("/")}
                className="w-full h-9 bg-[#6D2B35] text-white hover:bg-[#5a232b] text-[13px]"
                data-testid="button-go-home"
              >
                Go to home
              </Button>
            </div>
          ) : success ? (
            <div className="text-center py-4 space-y-3">
              <div className="mx-auto h-12 w-12 rounded-full bg-[#FBF7EE] flex items-center justify-center border border-[#D4AF37]/30">
                <CheckCircle2 className="h-6 w-6 text-[#6D2B35]" />
              </div>
              <p className="text-[13px] text-[#5a4a3a]">
                Your password has been updated. Redirecting…
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="new-password" className="text-[11px] text-[#6D2B35]/80 font-medium">New password</Label>
                <div className="relative">
                  <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#6D2B35]/45" />
                  <Input
                    id="new-password"
                    data-testid="input-new-password"
                    type={showPwd ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="pl-8 pr-8 h-9 text-[13px]"
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-[#6D2B35]/45 hover:text-[#6D2B35]"
                    aria-label={showPwd ? "Hide password" : "Show password"}
                    data-testid="button-toggle-new-password"
                  >
                    {showPwd ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="confirm-password" className="text-[11px] text-[#6D2B35]/80 font-medium">Confirm new password</Label>
                <div className="relative">
                  <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#6D2B35]/45" />
                  <Input
                    id="confirm-password"
                    data-testid="input-confirm-password"
                    type={showPwd ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Re-enter new password"
                    className="pl-8 h-9 text-[13px]"
                    autoComplete="new-password"
                    required
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full h-9 bg-[#6D2B35] text-white hover:bg-[#5a232b] text-[13px] mt-1"
                disabled={submitting || loading}
                data-testid="button-submit-reset"
              >
                {submitting || loading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> : null}
                Update password
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

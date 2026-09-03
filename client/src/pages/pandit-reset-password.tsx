import { useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function PanditResetPasswordPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const token = useMemo(() => new URLSearchParams(window.location.search).get("token") || "", []);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const resetPassword = async () => {
    if (!token) {
      toast({ title: "Invalid reset link", description: "Request a new link from the login page.", variant: "destructive" });
      return;
    }
    if (password.length < 8) {
      toast({ title: "Password is too short", description: "Use at least 8 characters.", variant: "destructive" });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/pandit/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "Password reset failed");
      toast({ title: "Password updated", description: "You can now sign in with your new password." });
      setLocation("/pandit/login");
    } catch (error: any) {
      toast({ title: "Reset failed", description: error?.message || "Request a new reset link.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF7EE] flex items-center justify-center px-4 py-10">
      <Card className="max-w-md w-full border-2 border-[#D4AF37]/40 shadow-lg">
        <div className="h-2 w-full bg-gradient-to-r from-[#D4AF37] via-[#f5d76e] to-[#D4AF37]" />
        <CardContent className="p-6 md:p-8">
          <div className="text-center mb-6">
            <Sparkles className="h-10 w-10 text-[#6D2B35] mx-auto mb-2" />
            <h1 className="text-2xl font-serif font-bold text-[#4a1a22]">Reset portal password</h1>
            <p className="text-sm text-[#5a4a3a]/70 mt-1">Create a new password for your Panditji Portal account.</p>
          </div>
          <div className="space-y-4">
            <div>
              <Label htmlFor="new-password">New password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5a4a3a]/50" />
                <Input id="new-password" type="password" autoComplete="new-password" className="pl-9" value={password} onChange={event => setPassword(event.target.value)} />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Use at least 8 characters.</p>
            </div>
            <div>
              <Label htmlFor="confirm-password">Confirm password</Label>
              <Input id="confirm-password" type="password" autoComplete="new-password" value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} onKeyDown={event => { if (event.key === "Enter") void resetPassword(); }} />
            </div>
            <Button onClick={resetPassword} disabled={loading || !token} className="w-full bg-[#6D2B35] hover:bg-[#5a1f29] text-[#D4AF37] font-bold">
              {loading ? "Updating..." : "Reset password"}
            </Button>
            <Link href="/pandit/login" className="block text-center text-sm text-[#6D2B35] hover:underline">Back to sign in</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
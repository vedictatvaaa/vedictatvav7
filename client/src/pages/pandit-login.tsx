import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Lock, Phone, Info, PlayCircle, Copy } from "lucide-react";
import { panditApi, setPanditToken } from "@/lib/panditAuth";

export default function PanditLoginPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const DEMO_PHONE = "9000012345";
  const DEMO_PASS = "demo1234";
  const fillDemo = () => { setPhone(DEMO_PHONE); setPassword(DEMO_PASS); };

  const submit = async () => {
    if (!phone || !password) {
      toast({ title: "Phone & password required", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const r = await panditApi("POST", "/api/pandit/login", { phone, password });
      setPanditToken(r.token);
      toast({ title: `Welcome, ${r.pandit?.name || "Panditji"}`, description: r.mustChangePassword ? "Please set a new password from your profile." : undefined });
      setLocation("/pandit/portal");
    } catch (e: any) {
      toast({ title: "Login failed", description: e?.message || "Try again", variant: "destructive" });
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#FBF7EE] flex items-center justify-center px-4 py-10">
      <Card className="max-w-md w-full border-2 border-[#D4AF37]/40 shadow-lg">
        <div className="h-2 w-full bg-gradient-to-r from-[#D4AF37] via-[#f5d76e] to-[#D4AF37]" />
        <CardContent className="p-6 md:p-8">
          <div className="text-center mb-5">
            <Sparkles className="h-10 w-10 text-[#6D2B35] mx-auto mb-2" />
            <h1 className="text-xl md:text-2xl font-serif font-bold text-[#4a1a22]" data-testid="text-pandit-login-title">Panditji Portal</h1>
            <p className="text-xs text-[#5a4a3a]/70 mt-1">Sign in to manage your bookings, calendar & messages.</p>
          </div>
          <div className="space-y-3">
            <div>
              <Label htmlFor="p-phone">Registered phone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5a4a3a]/50" />
                <Input id="p-phone" inputMode="numeric" placeholder="10-digit mobile" className="pl-9" value={phone} onChange={(e) => setPhone(e.target.value)} data-testid="input-pandit-phone" />
              </div>
            </div>
            <div>
              <Label htmlFor="p-pass">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5a4a3a]/50" />
                <Input id="p-pass" type="password" className="pl-9" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") submit(); }} data-testid="input-pandit-password" />
              </div>
            </div>
            <Button onClick={submit} disabled={loading} className="w-full bg-[#6D2B35] hover:bg-[#5a1f29] text-[#D4AF37] font-bold" data-testid="btn-pandit-login">
              {loading ? "Signing in..." : "Sign In"}
            </Button>
            <div className="bg-[#FBF7EE] border border-[#D4AF37]/25 rounded-md p-3 text-xs text-[#5a4a3a] flex items-start gap-2">
              <Info className="h-4 w-4 text-[#6D2B35] shrink-0 mt-0.5" />
              <div>
                <strong className="text-[#4a1a22]">First-time login?</strong> Use your <strong>10-digit registered phone number as your password</strong>. You'll be prompted to set a new password on the dashboard.
              </div>
            </div>

            <div className="rounded-md border-2 border-dashed border-[#D4AF37]/60 bg-gradient-to-br from-[#FBF7EE] to-[#fff8e7] p-3.5">
              <div className="flex items-center gap-2 mb-2">
                <PlayCircle className="h-4 w-4 text-[#6D2B35]" />
                <span className="text-xs font-bold text-[#4a1a22]">Try the portal — demo Panditji</span>
              </div>
              <p className="text-[11.5px] text-[#5a4a3a]/80 mb-2.5 leading-relaxed">
                Explore bookings, earnings, online puja and tools with a sample account. No signup needed.
              </p>
              <div className="grid grid-cols-2 gap-2 text-[12px] mb-2.5">
                <div className="bg-white rounded px-2 py-1.5 border border-[#D4AF37]/30">
                  <div className="text-[10px] text-[#5a4a3a]/60 uppercase tracking-wide">Phone</div>
                  <div className="font-mono font-semibold text-[#4a1a22]" data-testid="text-demo-phone">{DEMO_PHONE}</div>
                </div>
                <div className="bg-white rounded px-2 py-1.5 border border-[#D4AF37]/30">
                  <div className="text-[10px] text-[#5a4a3a]/60 uppercase tracking-wide">Password</div>
                  <div className="font-mono font-semibold text-[#4a1a22]" data-testid="text-demo-password">{DEMO_PASS}</div>
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={fillDemo} className="w-full border-[#6D2B35] text-[#6D2B35] hover:bg-[#6D2B35]/5" data-testid="btn-fill-demo">
                <Copy className="h-3.5 w-3.5 mr-1.5" />
                Auto-fill demo credentials
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import { useState, useEffect } from "react";

import { CheckCircle, Type, Eye, EyeOff, Shield, Lock, Download } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

import { Input } from "@/components/ui/input";

import { Button } from "@/components/ui/button";

import { useToast } from "@/hooks/use-toast";
import type { Pandit } from "@shared/schema";


function SecurityTab({ adminToken }: { adminToken?: string }) {
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [setupMode, setSetupMode] = useState(false);
  const [disableMode, setDisableMode] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [changePwLoading, setChangePwLoading] = useState(false);
  const { toast } = useToast();

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (adminToken) headers["x-admin-token"] = adminToken;

  useEffect(() => {
    fetch("/api/admin/2fa-status", { headers })
      .then(r => r.json())
      .then(data => {
        setTwoFAEnabled(data.enabled);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSetup = async () => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/setup-2fa", { method: "POST", headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setQrCode(data.qrCode);
      setSecret(data.secret);
      setSetupMode(true);
    } catch (err: any) {
      toast({ title: "Setup Failed", description: err.message, variant: "destructive" });
    }
    setActionLoading(false);
  };

  const handleEnable = async () => {
    if (verifyCode.length !== 6) {
      toast({ title: "Invalid Code", description: "Enter the 6-digit code", variant: "destructive" });
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/enable-2fa", {
        method: "POST", headers,
        body: JSON.stringify({ code: verifyCode, method: "authenticator" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setTwoFAEnabled(true);
      setSetupMode(false);
      setVerifyCode("");
      toast({ title: "2FA Enabled", description: "Two-factor authentication is now active" });
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    }
    setActionLoading(false);
  };

  const handleDisable = async () => {
    if (disableCode.length !== 6) {
      toast({ title: "Invalid Code", description: "Enter the 6-digit code", variant: "destructive" });
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/disable-2fa", {
        method: "POST", headers,
        body: JSON.stringify({ code: disableCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setTwoFAEnabled(false);
      setDisableMode(false);
      setDisableCode("");
      toast({ title: "2FA Disabled", description: "Two-factor authentication has been disabled" });
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    }
    setActionLoading(false);
  };

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-primary" data-testid="text-security-title">Security & Two-Factor Authentication</h2>
        <p className="text-sm text-muted-foreground/60 mt-1">Manage your admin account security settings</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Shield className="h-5 w-5" /> Two-Factor Authentication (2FA)
          </CardTitle>
          <CardDescription>
            Add an extra layer of security to your admin account using an authenticator app
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg border">
            <div>
              <p className="font-medium text-muted-foreground">2FA Status</p>
              <p className="text-sm text-muted-foreground/60">{twoFAEnabled ? "Enabled - Your account is protected" : "Disabled - Enable for extra security"}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${twoFAEnabled ? "bg-emerald-100 text-emerald-700" : "bg-yellow-100 text-yellow-700"}`} data-testid="text-2fa-status">
              {twoFAEnabled ? "ACTIVE" : "INACTIVE"}
            </span>
          </div>

          {!twoFAEnabled && !setupMode && (
            <Button onClick={handleSetup} disabled={actionLoading} className="w-full sm:w-auto" data-testid="btn-setup-2fa">
              {actionLoading ? "Setting up..." : "Setup Authenticator App"}
            </Button>
          )}

          {setupMode && (
            <div className="space-y-4 p-4 border border-secondary/20 rounded-lg bg-secondary/5">
              <h3 className="font-bold text-primary">Setup Instructions</h3>
              <ol className="text-sm text-muted-foreground/70 space-y-2 list-decimal ml-4">
                <li>Download Google Authenticator, Microsoft Authenticator, or any TOTP app on your phone</li>
                <li>Scan the QR code below or manually enter the secret key</li>
                <li>Enter the 6-digit code shown in the app to verify</li>
              </ol>

              {qrCode && (
                <div className="flex flex-col items-center gap-3 py-4">
                  <img src={qrCode} alt="2FA QR Code" className="w-48 h-48 border-4 border-card shadow-lg rounded-lg" data-testid="img-2fa-qr" />
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground/40 mb-1">Or enter this key manually:</p>
                    <code className="bg-card px-3 py-1 rounded border text-sm font-mono text-primary select-all" data-testid="text-2fa-secret">{secret}</code>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  type="text"
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="Enter 6-digit code"
                  className="text-center text-lg font-mono tracking-widest max-w-48"
                  maxLength={6}
                  data-testid="input-verify-2fa"
                />
                <Button onClick={handleEnable} disabled={actionLoading || verifyCode.length !== 6} className="bg-emerald-600 text-white" data-testid="btn-enable-2fa">
                  {actionLoading ? "Verifying..." : "Verify & Enable"}
                </Button>
                <Button variant="outline" onClick={() => { setSetupMode(false); setVerifyCode(""); }} data-testid="btn-cancel-setup">
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {twoFAEnabled && !disableMode && (
            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="outline" className="text-destructive border-destructive/30" onClick={() => setDisableMode(true)} data-testid="btn-start-disable-2fa">
                Disable 2FA
              </Button>
              <Button variant="outline" onClick={handleSetup} disabled={actionLoading} data-testid="btn-reset-2fa">
                Reset / Reconfigure
              </Button>
            </div>
          )}

          {disableMode && (
            <div className="space-y-3 p-4 border border-red-200 rounded-lg bg-red-50/50">
              <p className="text-sm text-red-700 font-medium">Enter your current authenticator code to disable 2FA:</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  type="text"
                  value={disableCode}
                  onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="Enter 6-digit code"
                  className="text-center text-lg font-mono tracking-widest max-w-48"
                  maxLength={6}
                  data-testid="input-disable-2fa"
                />
                <Button onClick={handleDisable} disabled={actionLoading || disableCode.length !== 6} variant="destructive" data-testid="btn-confirm-disable-2fa">
                  {actionLoading ? "Disabling..." : "Confirm Disable"}
                </Button>
                <Button variant="outline" onClick={() => { setDisableMode(false); setDisableCode(""); }} data-testid="btn-cancel-disable">
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Lock className="h-5 w-5" /> Change Admin Password
          </CardTitle>
          <CardDescription>Update your admin account password</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Current Password</label>
            <div className="relative">
              <Input
                type={showCurrentPw ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="pr-10"
                data-testid="input-current-password"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPw(!showCurrentPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/30 hover:text-primary"
              >
                {showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">New Password</label>
            <div className="relative">
              <Input
                type={showNewPw ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min 6 characters)"
                className="pr-10"
                data-testid="input-new-admin-password"
              />
              <button
                type="button"
                onClick={() => setShowNewPw(!showNewPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/30 hover:text-primary"
              >
                {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Confirm New Password</label>
            <Input
              type="password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              placeholder="Confirm new password"
              data-testid="input-confirm-admin-password"
            />
          </div>
          {newPassword && confirmNewPassword && newPassword !== confirmNewPassword && (
            <p className="text-xs text-red-500">Passwords do not match</p>
          )}
          {newPassword && newPassword.length > 0 && newPassword.length < 6 && (
            <p className="text-xs text-amber-600">Password must be at least 6 characters</p>
          )}
          <Button
            onClick={async () => {
              if (!currentPassword || !newPassword) {
                toast({ title: "Missing Fields", description: "Please fill in all password fields", variant: "destructive" });
                return;
              }
              if (newPassword.length < 6) {
                toast({ title: "Weak Password", description: "New password must be at least 6 characters", variant: "destructive" });
                return;
              }
              if (newPassword !== confirmNewPassword) {
                toast({ title: "Mismatch", description: "New passwords do not match", variant: "destructive" });
                return;
              }
              setChangePwLoading(true);
              try {
                const res = await fetch("/api/admin/change-password", {
                  method: "POST",
                  headers,
                  body: JSON.stringify({ currentPassword, newPassword }),
                });
                const data = await res.json();
                if (!res.ok) {
                  toast({ title: "Failed", description: data.message || "Could not change password", variant: "destructive" });
                  return;
                }
                toast({ title: "Password Changed", description: "Your admin password has been updated successfully" });
                setCurrentPassword("");
                setNewPassword("");
                setConfirmNewPassword("");
              } catch {
                toast({ title: "Error", description: "Connection failed. Please try again.", variant: "destructive" });
              } finally {
                setChangePwLoading(false);
              }
            }}
            disabled={changePwLoading || !currentPassword || !newPassword || !confirmNewPassword || newPassword !== confirmNewPassword || newPassword.length < 6}
            className="bg-primary hover:bg-primary w-full sm:w-auto"
            data-testid="btn-change-password"
          >
            {changePwLoading ? "Changing..." : "Change Password"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-primary">Session Management</CardTitle>
          <CardDescription>Your current admin session information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground/40 uppercase tracking-wider">Session Token</p>
              <p className="text-sm font-mono text-muted-foreground mt-1 truncate">{adminToken ? `${adminToken.slice(0, 12)}...` : "N/A"}</p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground/40 uppercase tracking-wider">Session Duration</p>
              <p className="text-sm text-muted-foreground mt-1">24 hours from login</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-primary">Security Best Practices</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground/60">
            <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" /> Always enable two-factor authentication</li>
            <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" /> Use a strong, unique password for admin access</li>
            <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" /> Never share your admin credentials or 2FA codes</li>
            <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" /> Log out when not using the admin panel</li>
            <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" /> Periodically rotate your admin password</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

export default SecurityTab;

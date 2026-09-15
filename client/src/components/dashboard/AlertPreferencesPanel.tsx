import { useEffect, useState } from "react";
import { BellRing, Clock3, Mail, MessageCircle, Smartphone, Volume2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import {
  getAlertPreferences,
  updateAlertPreferences,
} from "@/lib/dashboardApi";
import type { AlertPreferences } from "@shared/schema";

type PreferenceKey =
  | "panchangEnabled"
  | "inAppEnabled"
  | "visualOverlayEnabled"
  | "emailEnabled"
  | "smsEnabled"
  | "whatsappEnabled"
  | "webPushEnabled"
  | "androidPushEnabled"
  | "lockScreenEnabled"
  | "omChimeEnabled";

const channelRows: Array<{
  key: PreferenceKey;
  label: string;
  description: string;
  icon: typeof Mail;
}> = [
  { key: "inAppEnabled", label: "In-app inbox", description: "Keep a durable record in your dashboard.", icon: BellRing },
  { key: "visualOverlayEnabled", label: "Visual alerts", description: "Show a visual reminder when you are using Vedic Tatva.", icon: BellRing },
  { key: "emailEnabled", label: "Email", description: "Receive the same alert in your inbox.", icon: Mail },
  { key: "smsEnabled", label: "SMS", description: "Useful for time-sensitive observances.", icon: Smartphone },
  { key: "whatsappEnabled", label: "WhatsApp", description: "Receive alerts through WhatsApp when available.", icon: MessageCircle },
  { key: "webPushEnabled", label: "Web push", description: "Allow browser and PWA notifications.", icon: BellRing },
  { key: "androidPushEnabled", label: "Android app", description: "Allow notifications in the native Android app.", icon: Smartphone },
];

export default function AlertPreferencesPanel() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<AlertPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<PreferenceKey | null>(null);

  useEffect(() => {
    if (!user?.id || !user.email) return;
    getAlertPreferences(user.id, user.email)
      .then(setPreferences)
      .catch((error) => toast({ title: "Could not load alert settings", description: error.message, variant: "destructive" }))
      .finally(() => setLoading(false));
  }, [user?.id, user?.email, toast]);

  const toggle = async (key: PreferenceKey) => {
    if (!preferences || !user?.id || !user.email) return;
    const nextValue = !preferences[key];
    setPreferences({ ...preferences, [key]: nextValue });
    setSaving(key);
    try {
      const updated = await updateAlertPreferences(user.id, user.email, { [key]: nextValue });
      setPreferences(updated);
    } catch (error: any) {
      setPreferences({ ...preferences, [key]: !nextValue });
      toast({ title: "Could not save alert setting", description: error?.message || "Please try again.", variant: "destructive" });
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return <Card><CardContent className="py-8 text-sm text-[#5a4a3a]/60">Loading alert settings…</CardContent></Card>;
  }
  if (!preferences) return null;

  return (
    <div className="space-y-4" data-testid="alert-preferences-panel">
      <Card className="border-[#D4AF37]/25">
        <CardHeader className="pb-3">
          <CardTitle className="font-serif text-lg text-[#4a1a22] flex items-center gap-2">
            <BellRing className="h-4 w-4 text-[#8a6820]" />
            Alert preferences
          </CardTitle>
          <p className="text-sm text-[#5a4a3a]/65">
            Sacred Panchang reminders are on by default. Change any channel without losing your alert history.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <PreferenceRow
            label="Panchang reminders"
            description="Sacred days and vrats at 48 hours, 24 hours, and on the event day."
            checked={preferences.panchangEnabled}
            disabled={saving === "panchangEnabled"}
            onChange={() => toggle("panchangEnabled")}
            icon={Clock3}
          />
          <div className="grid gap-3 md:grid-cols-2">
            {channelRows.map((row) => (
              <PreferenceRow
                key={row.key}
                label={row.label}
                description={row.description}
                checked={Boolean(preferences[row.key])}
                disabled={saving === row.key}
                onChange={() => toggle(row.key)}
                icon={row.icon}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-[#D4AF37]/25">
        <CardHeader className="pb-3">
          <CardTitle className="font-serif text-lg text-[#4a1a22] flex items-center gap-2">
            <Volume2 className="h-4 w-4 text-[#8a6820]" />
            Device experience
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <PreferenceRow
            label="Lock-screen notifications"
            description="Let supported devices show the alert while locked."
            checked={preferences.lockScreenEnabled}
            disabled={saving === "lockScreenEnabled"}
            onChange={() => toggle("lockScreenEnabled")}
            icon={Smartphone}
          />
          <PreferenceRow
            label="Om chime"
            description="Allow the devotional sound when a supported device receives an alert."
            checked={preferences.omChimeEnabled}
            disabled={saving === "omChimeEnabled"}
            onChange={() => toggle("omChimeEnabled")}
            icon={Volume2}
          />
          <p className="text-xs text-[#5a4a3a]/55 pt-1">
            Quiet hours are {preferences.quietStart}–{preferences.quietEnd} in {preferences.timezone}. Alerts remain in your inbox and can be delivered later by supported channels.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function PreferenceRow({
  label,
  description,
  checked,
  disabled,
  onChange,
  icon: Icon,
}: {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: () => void;
  icon: typeof BellRing;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-[#D4AF37]/15 bg-[#FBF7EE]/60 p-3">
      <div className="flex gap-3 min-w-0">
        <Icon className="h-4 w-4 mt-0.5 shrink-0 text-[#8a6820]" />
        <div className="min-w-0">
          <Label className="text-sm font-medium text-[#4a1a22]">{label}</Label>
          <p className="text-xs text-[#5a4a3a]/60 mt-0.5">{description}</p>
        </div>
      </div>
      <Switch checked={checked} disabled={disabled} onCheckedChange={onChange} aria-label={label} />
    </div>
  );
}
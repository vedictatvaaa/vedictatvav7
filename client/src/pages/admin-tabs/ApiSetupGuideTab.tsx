import { useState, useRef, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2, XCircle, ChevronDown, ChevronUp, ExternalLink,
  Copy, RefreshCw, Key, Shield, Zap, Globe, Mail, Truck, CreditCard,
  Plus, Pencil, Trash2, Power, Eye, EyeOff, Lock, AlertTriangle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { PROVIDER_CATALOG, getProvider } from "@shared/api-providers";
import { createFetcher } from "../admin-shared";

// ─── Types ───────────────────────────────────────────────────────────────────

interface KeyStatus { ok: boolean; vars: string[] }
type StatusMap = Record<string, KeyStatus>;

interface CredentialRow {
  id: number;
  kind: string;
  provider: string;
  label: string;
  mode: "test" | "live";
  isActive: boolean;
  masked: Record<string, string>;
  lastTestedAt: string | null;
  lastTestResult: { ok: boolean; message: string } | null;
  createdAt: string;
  updatedAt: string;
}

interface PendingAction { label: string; fn: () => Promise<void> }

// ─── Password unlock cache (5-minute grace window) ────────────────────────────

const GRACE_MS = 5 * 60 * 1000;
function isUnlocked() {
  try {
    const t = sessionStorage.getItem("adminPwUnlockedAt");
    return t ? Date.now() - Number(t) < GRACE_MS : false;
  } catch { return false; }
}
function markUnlocked() {
  try { sessionStorage.setItem("adminPwUnlockedAt", String(Date.now())); } catch {}
}

// ─── Inline API helper ────────────────────────────────────────────────────────

function apiCall<T = any>(url: string, init?: RequestInit): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("adminToken") || "" : "";
  return fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", "x-admin-token": token, ...(init?.headers || {}) },
  }).then(async (r) => {
    if (!r.ok) {
      let msg = `Error ${r.status}`;
      try { msg = (await r.json()).message || msg; } catch {}
      throw new Error(msg);
    }
    return r.json();
  });
}

// ─── Password Confirmation Dialog ─────────────────────────────────────────────

function ConfirmPasswordDialog({
  pending, onConfirmed, onCancel, adminToken,
}: {
  pending: PendingAction;
  onConfirmed: () => void;
  onCancel: () => void;
  adminToken: string;
}) {
  const { toast } = useToast();
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const submit = async () => {
    if (!pw) return;
    setVerifying(true);
    try {
      const r = await apiCall<{ ok: boolean; message: string }>("/api/admin/verify-password", {
        method: "POST",
        body: JSON.stringify({ password: pw }),
      });
      if (!r.ok) {
        toast({ title: "Wrong password", description: "Please try again.", variant: "destructive" });
        setPw("");
        setVerifying(false);
        return;
      }
      markUnlocked();
      onConfirmed();
    } catch (e: any) {
      toast({ title: "Verification failed", description: e.message, variant: "destructive" });
      setVerifying(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-primary" /> Confirm admin password
          </DialogTitle>
          <DialogDescription>
            Enter your admin password to proceed with: <strong>{pending.label}</strong>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="confirm-pw">Admin password</Label>
            <div className="flex gap-2">
              <Input
                id="confirm-pw"
                type={show ? "text" : "password"}
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                autoFocus
                data-testid="input-confirm-password"
              />
              <Button type="button" size="icon" variant="outline" onClick={() => setShow(v => !v)}>
                {show ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            ⏱ Once confirmed, you have 5 minutes before being asked again.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={submit} disabled={!pw || verifying} data-testid="button-confirm-pw">
            {verifying ? <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1" /> : <Lock className="w-3.5 h-3.5 mr-1" />}
            Confirm & proceed
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Inline Add / Edit form ───────────────────────────────────────────────────

function CredentialForm({
  providerId,
  kind,
  editing,
  onSaved,
  onCancel,
  gateMutation,
}: {
  providerId: string;
  kind: string;
  editing: CredentialRow | null;
  onSaved: () => void;
  onCancel: () => void;
  gateMutation: (label: string, fn: () => Promise<void>) => void;
}) {
  const { toast } = useToast();
  const def = getProvider(providerId);
  const [label, setLabel] = useState(editing?.label || `${def?.label || providerId} (${editing?.mode || "live"})`);
  const [mode, setMode] = useState<"test" | "live">(editing?.mode || "live");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [showSecret, setShowSecret] = useState<Record<string, boolean>>({});

  if (!def) return null;

  const save = () => {
    if (!label.trim()) { toast({ title: "Label required", variant: "destructive" }); return; }
    const actionLabel = editing ? `Update ${def.label} credential` : `Save ${def.label} credential`;
    gateMutation(actionLabel, async () => {
      if (editing) {
        const toSend: Record<string, string> = {};
        for (const [k, v] of Object.entries(fields)) if (v.trim()) toSend[k] = v.trim();
        await apiCall(`/api/admin/api-credentials/${editing.id}`, {
          method: "PATCH",
          body: JSON.stringify({ label: label.trim(), mode, fields: toSend }),
        });
        toast({ title: "Credential updated" });
      } else {
        await apiCall("/api/admin/api-credentials", {
          method: "POST",
          body: JSON.stringify({ kind, provider: providerId, label: label.trim(), mode, fields, activate: true }),
        });
        toast({ title: "Credential saved & activated" });
      }
      onSaved();
    });
  };

  return (
    <div className="border border-primary/20 rounded-lg p-4 bg-primary/5 space-y-3 mt-2">
      <p className="text-xs font-semibold text-primary uppercase tracking-wider">
        {editing ? "Edit credential" : `Add ${def.label} credential`}
      </p>

      <div className="grid sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor={`lbl-${providerId}`} className="text-xs">Label</Label>
          <Input
            id={`lbl-${providerId}`}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder={`e.g. ${def.label} Production`}
            data-testid={`input-cred-label-${providerId}`}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`mode-${providerId}`} className="text-xs">Mode</Label>
          <Select value={mode} onValueChange={(v) => setMode(v as any)}>
            <SelectTrigger id={`mode-${providerId}`} data-testid={`select-mode-${providerId}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="live">Live / Production</SelectItem>
              <SelectItem value="test">Test / Sandbox</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        {def.fields.map((f) => (
          <div key={f.key} className="space-y-1">
            <Label htmlFor={`f-${providerId}-${f.key}`} className="text-xs flex items-center gap-1">
              {f.label}
              {!f.optional && <span className="text-red-600">*</span>}
              {f.optional && <span className="text-muted-foreground">(optional)</span>}
            </Label>
            <div className="flex gap-2">
              <Input
                id={`f-${providerId}-${f.key}`}
                type={f.secret && !showSecret[f.key] ? "password" : "text"}
                value={fields[f.key] || ""}
                onChange={(e) => setFields({ ...fields, [f.key]: e.target.value })}
                placeholder={editing ? `(unchanged: ${editing.masked[f.key] || "—"})` : f.placeholder || ""}
                className="font-mono text-xs"
                data-testid={`input-cred-${providerId}-${f.key}`}
              />
              {f.secret && (
                <Button
                  type="button" size="icon" variant="outline"
                  onClick={() => setShowSecret({ ...showSecret, [f.key]: !showSecret[f.key] })}
                >
                  {showSecret[f.key] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 pt-1">
        <Button size="sm" onClick={save} data-testid={`btn-save-cred-${providerId}`}>
          <Lock className="w-3.5 h-3.5 mr-1" />
          {editing ? "Save changes" : "Save & activate"}
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

// ─── Guide definitions ────────────────────────────────────────────────────────

interface GuideStep { text: string; url?: string; urlLabel?: string; code?: string }
interface ServiceGuide {
  id: string;
  label: string;
  category: "payment" | "ai" | "google" | "communication" | "shipping" | "core";
  icon: string;
  description: string;
  why: string;
  statusKey: string;
  steps: GuideStep[];
  vars: { name: string; description: string; required: boolean }[];
  dbProviderId?: string;  // id in PROVIDER_CATALOG if DB-manageable
  docsUrl: string;
}

const GUIDES: ServiceGuide[] = [
  {
    id: "razorpay", label: "Razorpay", category: "payment", icon: "💳",
    description: "Primary payment gateway for orders, subscriptions, and puja bookings.",
    why: "Required for any paid transaction. Without it, checkout will fail.",
    statusKey: "razorpay", docsUrl: "https://razorpay.com/docs/api/", dbProviderId: "razorpay",
    steps: [
      { text: "Open Razorpay Dashboard → Settings → API Keys.", url: "https://dashboard.razorpay.com/app/keys", urlLabel: "Open Razorpay Dashboard" },
      { text: "Generate Test Key to get a test key pair (starts with rzp_test_...). Copy Key ID + Key Secret." },
      { text: "Use the 'Manage Keys' section below to save them — or add to Replit Secrets:", code: "RAZORPAY_KEY_ID = rzp_test_xxx\nRAZORPAY_KEY_SECRET = your_secret" },
      { text: "For webhooks: Razorpay Dashboard → Webhooks → create pointing to /api/razorpay/webhook. Copy the webhook secret and add:", code: "RAZORPAY_WEBHOOK_SECRET = your_webhook_secret" },
      { text: "To go live: generate a Live key pair (rzp_live_...) and add a separate Live credential." },
    ],
    vars: [
      { name: "RAZORPAY_KEY_ID", description: "Key ID from Razorpay Dashboard", required: true },
      { name: "RAZORPAY_KEY_SECRET", description: "Key Secret (keep private)", required: true },
      { name: "RAZORPAY_WEBHOOK_SECRET", description: "Webhook signing secret", required: false },
    ],
  },
  {
    id: "openai", label: "OpenAI", category: "ai", icon: "🤖",
    description: "Powers Kundli generation, baby names, palm reading, Vastu analysis, AI Kathas.",
    why: "Required for all AI features. Without it, AI-powered pages will show errors.",
    statusKey: "openai", docsUrl: "https://platform.openai.com/docs", dbProviderId: "openai",
    steps: [
      { text: "Go to OpenAI API Keys page.", url: "https://platform.openai.com/api-keys", urlLabel: "Open OpenAI API Keys" },
      { text: "Click Create new secret key → name it 'Vedic Tatva' → copy it (only shown once, starts with sk-proj-...)." },
      { text: "Add billing info under Billing → Payment methods." },
      { text: "Use the 'Manage Keys' section below to save it, or add to Replit Secrets:", code: "OPENAI_API_KEY = sk-proj-xxxxxxxxxxxx" },
    ],
    vars: [{ name: "OPENAI_API_KEY", description: "Secret API key from platform.openai.com", required: true }],
  },
  {
    id: "anthropic", label: "Anthropic Claude", category: "ai", icon: "🧠",
    description: "Alternative AI provider (Claude models). Optional — use as fallback or for specific tasks.",
    why: "Optional. Use if you want Claude models as an alternative to OpenAI.",
    statusKey: "anthropic", docsUrl: "https://docs.anthropic.com/", dbProviderId: "anthropic",
    steps: [
      { text: "Open Anthropic Console → API Keys → Create Key.", url: "https://console.anthropic.com/", urlLabel: "Open Anthropic Console" },
      { text: "Copy the key (starts with sk-ant-api03-...). Add billing credits." },
      { text: "Use 'Manage Keys' below or Replit Secrets:", code: "ANTHROPIC_API_KEY = sk-ant-api03-xxxx" },
    ],
    vars: [{ name: "ANTHROPIC_API_KEY", description: "API key from console.anthropic.com", required: false }],
  },
  {
    id: "gemini", label: "Google Gemini", category: "ai", icon: "✨",
    description: "Google's AI models (Gemini Pro, Flash). Free tier available.",
    why: "Optional — cost-effective alternative to OpenAI for some features.",
    statusKey: "gemini", docsUrl: "https://ai.google.dev/docs", dbProviderId: "gemini",
    steps: [
      { text: "Open Google AI Studio → Get API Key.", url: "https://aistudio.google.com/app/apikey", urlLabel: "Open Google AI Studio" },
      { text: "Create API Key in your Google Cloud project. Copy it (starts with AIza...)." },
      { text: "Use 'Manage Keys' below or Replit Secrets:", code: "GEMINI_API_KEY = AIzaxxxxxxx" },
    ],
    vars: [{ name: "GEMINI_API_KEY", description: "API key from Google AI Studio", required: false }],
  },
  {
    id: "openrouter", label: "OpenRouter", category: "ai", icon: "🔀",
    description: "Access 100+ models through a single API with unified billing.",
    why: "Optional — useful for accessing multiple model providers through one key.",
    statusKey: "openrouter", docsUrl: "https://openrouter.ai/docs", dbProviderId: "openrouter",
    steps: [
      { text: "Go to OpenRouter → Keys → Create Key.", url: "https://openrouter.ai/keys", urlLabel: "Open OpenRouter" },
      { text: "Copy the key (starts with sk-or-v1-...). Add credits." },
      { text: "Use 'Manage Keys' below or Replit Secrets:", code: "OPENROUTER_API_KEY = sk-or-v1-xxxx" },
    ],
    vars: [{ name: "OPENROUTER_API_KEY", description: "API key from openrouter.ai/keys", required: false }],
  },
  {
    id: "googleOauth", label: "Google Sign-In (OAuth)", category: "google", icon: "🔐",
    description: "Enables customers to sign in with their Google account.",
    why: "Highly recommended — reduces signup friction, increases conversions.",
    statusKey: "googleOauth", docsUrl: "https://console.cloud.google.com/apis/credentials", dbProviderId: "googleOauth",
    steps: [
      { text: "Open Google Cloud Console → APIs & Services → Credentials → Create OAuth 2.0 Client ID.", url: "https://console.cloud.google.com/", urlLabel: "Open Google Cloud Console" },
      { text: "Add Authorized JavaScript origin: https://vedictatva.com" },
      { text: "Add Authorized redirect URI: https://vedictatva.com/api/auth/google/callback" },
      { text: "Copy Client ID (ends with .apps.googleusercontent.com) and Client Secret (GOCSPX-...)." },
      { text: "Use 'Manage Keys' below or Replit Secrets:", code: "GOOGLE_CLIENT_ID = xxxx.apps.googleusercontent.com\nGOOGLE_CLIENT_SECRET = GOCSPX-xxx" },
    ],
    vars: [
      { name: "GOOGLE_CLIENT_ID", description: "OAuth Client ID", required: true },
      { name: "GOOGLE_CLIENT_SECRET", description: "OAuth Client Secret", required: false },
    ],
  },
  {
    id: "googleIndexing", label: "Google Indexing API", category: "google", icon: "🔍",
    description: "Notifies Google when new pages are published so they index faster.",
    why: "Important for SEO — new pages may take weeks to appear in Google without this.",
    statusKey: "googleIndexing", docsUrl: "https://developers.google.com/search/apis/indexing-api/v3/quickstart", dbProviderId: "googleIndexing",
    steps: [
      { text: "Verify vedictatva.com in Google Search Console.", url: "https://search.google.com/search-console", urlLabel: "Open Search Console" },
      { text: "In Google Cloud Console, enable 'Web Search Indexing API' → IAM → Create Service Account." },
      { text: "Create a JSON key → download → add service account email as Search Console Owner." },
      { text: "Paste the full JSON content + your site URL via 'Manage Keys' below, or set:", code: "GOOGLE_SERVICE_ACCOUNT_JSON = {\"type\":\"service_account\",...}\nGSC_SITE_URL = https://vedictatva.com/" },
    ],
    vars: [
      { name: "GOOGLE_SERVICE_ACCOUNT_JSON", description: "Full JSON content of the service account key file", required: true },
      { name: "GSC_SITE_URL", description: "Verified Search Console property URL", required: false },
    ],
  },
  {
    id: "sendgrid", label: "SendGrid (Email)", category: "communication", icon: "📧",
    description: "Sends transactional emails: order confirmations, booking notifications, newsletters.",
    why: "Required for all email notifications. Without it, customers get no email confirmations.",
    statusKey: "sendgrid", docsUrl: "https://docs.sendgrid.com/", dbProviderId: "sendgrid",
    steps: [
      { text: "Sign up at SendGrid → complete Sender Authentication for vedictatva.com.", url: "https://app.sendgrid.com/", urlLabel: "Open SendGrid" },
      { text: "Settings → API Keys → Create API Key → Full Access → copy it (starts with SG.)." },
      { text: "Use 'Manage Keys' below or Replit Secrets:", code: "SENDGRID_API_KEY = SG.xxxxxxxxxxxxx" },
    ],
    vars: [{ name: "SENDGRID_API_KEY", description: "API key from SendGrid (starts with SG.)", required: true }],
  },
  {
    id: "msg91", label: "MSG91 (SMS / WhatsApp / OTP)", category: "communication", icon: "📱",
    description: "Sends OTP verifications, order update SMS, and WhatsApp booking notifications.",
    why: "Required for order journey notifications. WhatsApp-first with SMS fallback.",
    statusKey: "msg91", docsUrl: "https://docs.msg91.com/", dbProviderId: "msg91",
    steps: [
      { text: "Sign up at MSG91 → complete KYC → API → Authkey → copy the Auth Key.", url: "https://msg91.com/", urlLabel: "Open MSG91" },
      { text: "Create a 6-character DLT-approved sender ID (e.g. VTPUJA)." },
      { text: "Register DLT sender ID + templates with TRAI (mandatory for Indian SMS)." },
      { text: "Use 'Manage Keys' below or Replit Secrets:", code: "MSG91_AUTH_KEY = xxxxxxxxxxxxxxxxxx\nMSG91_SENDER_ID = VTPUJA" },
    ],
    vars: [
      { name: "MSG91_AUTH_KEY", description: "Auth key from MSG91 → API section", required: true },
      { name: "MSG91_SENDER_ID", description: "6-char DLT-approved sender ID", required: false },
    ],
  },
  {
    id: "shiprocket", label: "Shiprocket", category: "shipping", icon: "🚀",
    description: "Handles shipping labels, tracking, and delivery webhooks for physical product orders.",
    why: "Required if you sell physical products that need shipping.",
    statusKey: "shiprocket", docsUrl: "https://apidocs.shiprocket.in/", dbProviderId: "shiprocket",
    steps: [
      { text: "Sign up at Shiprocket → add business details.", url: "https://app.shiprocket.in/", urlLabel: "Open Shiprocket" },
      { text: "Settings → Webhooks → Add Webhook pointing to https://vedictatva.com/api/shiprocket/webhook. Generate a webhook token." },
      { text: "Use 'Manage Keys' below or Replit Secrets:", code: "SHIPROCKET_WEBHOOK_TOKEN = your_token\nSHIPROCKET_EMAIL = email@example.com\nSHIPROCKET_PASSWORD = your_password" },
    ],
    vars: [
      { name: "SHIPROCKET_WEBHOOK_TOKEN", description: "Webhook signing token from Shiprocket", required: true },
      { name: "SHIPROCKET_EMAIL", description: "Shiprocket account email", required: false },
      { name: "SHIPROCKET_PASSWORD", description: "Shiprocket account password", required: false },
    ],
  },
  {
    id: "database", label: "PostgreSQL Database", category: "core", icon: "🗄️",
    description: "Main database — orders, users, products, bookings, etc.",
    why: "Critical — the app cannot run without a database connection.",
    statusKey: "database", docsUrl: "https://orm.drizzle.team/docs/overview/postgresql",
    steps: [
      { text: "In Replit, go to the Database tab in the sidebar → Create a database. PG_DATABASE_URL is automatically set." },
      { text: "After any schema change in shared/schema.ts, run in Shell:", code: "npm run db:push" },
      { text: "⚠️ On Coolify (production): SSH in and run npm run db:push manually after every deploy with schema changes." },
    ],
    vars: [{ name: "PG_DATABASE_URL", description: "PostgreSQL connection string (auto-set by Replit Database)", required: true }],
  },
  {
    id: "session", label: "Session & Security Secrets", category: "core", icon: "🔑",
    description: "Cryptographic secrets for session management and email unsubscribe links.",
    why: "Critical — without these, user sessions and security features are disabled.",
    statusKey: "session", docsUrl: "",
    steps: [
      { text: "Generate strong random secrets in the Shell:", code: "node -e \"console.log(require('crypto').randomBytes(48).toString('hex'))\"" },
      { text: "Run it twice to get two different values. Add both to Replit Secrets:", code: "SESSION_SECRET = <first_value>\nUNSUBSCRIBE_SECRET = <second_value>" },
    ],
    vars: [
      { name: "SESSION_SECRET", description: "48+ byte hex string for session signing", required: true },
      { name: "UNSUBSCRIBE_SECRET", description: "String for email unsubscribe link signing", required: true },
    ],
  },
];

// ─── Category config ──────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: "all",           label: "All",          icon: <Key className="w-4 h-4" /> },
  { id: "core",          label: "Core",         icon: <Shield className="w-4 h-4" /> },
  { id: "payment",       label: "Payments",     icon: <CreditCard className="w-4 h-4" /> },
  { id: "ai",            label: "AI Models",    icon: <Zap className="w-4 h-4" /> },
  { id: "google",        label: "Google",       icon: <Globe className="w-4 h-4" /> },
  { id: "communication", label: "Comms",        icon: <Mail className="w-4 h-4" /> },
  { id: "shipping",      label: "Shipping",     icon: <Truck className="w-4 h-4" /> },
] as const;

const BORDER_COLORS: Record<string, string> = {
  payment: "border-l-amber-500", ai: "border-l-purple-500",
  google: "border-l-blue-500", communication: "border-l-emerald-500",
  shipping: "border-l-orange-500", core: "border-l-primary",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function CopyBtn({ text }: { text: string }) {
  const { toast } = useToast();
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); toast({ title: "Copied" }); }}
      className="ml-1 text-muted-foreground hover:text-foreground" title="Copy">
      <Copy className="w-3 h-3 inline" />
    </button>
  );
}

function StatusPill({ ok, loading }: { ok?: boolean; loading: boolean }) {
  if (loading) return <span className="inline-block w-20 h-5 bg-muted rounded animate-pulse" />;
  return ok
    ? <Badge className="bg-emerald-100 text-emerald-800 gap-1 text-xs"><CheckCircle2 className="w-3 h-3" />Configured</Badge>
    : <Badge className="bg-red-100 text-red-800 gap-1 text-xs"><XCircle className="w-3 h-3" />Not set</Badge>;
}

// ─── Credential row inside a card ─────────────────────────────────────────────

function CredRow({
  row, busy, onTest, onActivate, onDeactivate, onEdit, onDelete,
}: {
  row: CredentialRow;
  busy: boolean;
  onTest: () => void;
  onActivate: () => void;
  onDeactivate: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border p-2.5 bg-background text-sm" data-testid={`cred-row-${row.id}`}>
      <div className="min-w-0 flex-1 space-y-0.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-medium text-foreground text-xs">{row.label}</span>
          <Badge className={`text-[10px] ${row.mode === "live" ? "bg-amber-100 text-amber-900" : "bg-muted text-muted-foreground"}`}>{row.mode}</Badge>
          {row.isActive && <Badge className="text-[10px] bg-emerald-100 text-emerald-900"><CheckCircle2 className="w-2.5 h-2.5" /> Active</Badge>}
          {row.lastTestResult && (
            <Badge className={`text-[10px] ${row.lastTestResult.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`}>
              {row.lastTestResult.ok ? "✓" : "✗"} {row.lastTestResult.message.slice(0, 30)}
            </Badge>
          )}
        </div>
        <div className="text-[10px] font-mono text-muted-foreground truncate">
          {Object.entries(row.masked).map(([k, v]) => `${k}: ${v}`).join(" · ")}
        </div>
      </div>
      <div className="flex flex-wrap gap-1">
        <Button size="sm" variant="outline" className="h-6 text-xs px-2" onClick={onTest} disabled={busy}>
          <Zap className="w-3 h-3 mr-1" />Test
        </Button>
        {row.isActive
          ? <Button size="sm" variant="outline" className="h-6 text-xs px-2" onClick={onDeactivate} disabled={busy}><Power className="w-3 h-3 mr-1" />Deactivate</Button>
          : <Button size="sm" className="h-6 text-xs px-2" onClick={onActivate} disabled={busy}><Power className="w-3 h-3 mr-1" />Activate</Button>}
        <Button size="sm" variant="outline" className="h-6 text-xs px-2" onClick={onEdit} disabled={busy}><Pencil className="w-3 h-3" /></Button>
        <Button size="sm" variant="outline" className="h-6 text-xs px-2 text-red-600 hover:text-red-700" onClick={onDelete} disabled={busy}><Trash2 className="w-3 h-3" /></Button>
      </div>
    </div>
  );
}

// ─── Service card ─────────────────────────────────────────────────────────────

function ServiceCard({
  guide, status, loading, credentials, onRefreshCreds, gateMutation,
}: {
  guide: ServiceGuide;
  status?: KeyStatus;
  loading: boolean;
  credentials: CredentialRow[];
  onRefreshCreds: () => void;
  gateMutation: (label: string, fn: () => Promise<void>) => void;
}) {
  const { toast } = useToast();
  const [showGuide, setShowGuide] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingRow, setEditingRow] = useState<CredentialRow | null>(null);
  const def = guide.dbProviderId ? getProvider(guide.dbProviderId) : null;

  const busy = (id: number) => busyId === id;

  const doTest = (id: number) => {
    setBusyId(id);
    apiCall(`/api/admin/api-credentials/${id}/test`, { method: "POST" })
      .then((r) => {
        toast({ title: r.ok ? "Test passed ✓" : "Test failed ✗", description: r.message, variant: r.ok ? "default" : "destructive" });
        onRefreshCreds();
      })
      .catch((e) => toast({ title: "Test error", description: e.message, variant: "destructive" }))
      .finally(() => setBusyId(null));
  };

  const doActivate = (id: number) => {
    gateMutation("Activate credential", async () => {
      setBusyId(id);
      try {
        await apiCall(`/api/admin/api-credentials/${id}/activate`, { method: "POST" });
        toast({ title: "Activated — live immediately" });
        onRefreshCreds();
      } catch (e: any) {
        toast({ title: "Activation failed", description: e.message, variant: "destructive" });
      } finally { setBusyId(null); }
    });
  };

  const doDeactivate = (id: number) => {
    gateMutation("Deactivate credential", async () => {
      setBusyId(id);
      try {
        await apiCall(`/api/admin/api-credentials/${id}/deactivate`, { method: "POST" });
        toast({ title: "Deactivated" });
        onRefreshCreds();
      } catch (e: any) {
        toast({ title: "Failed", description: e.message, variant: "destructive" });
      } finally { setBusyId(null); }
    });
  };

  const doDelete = (id: number, label: string) => {
    gateMutation(`Delete "${label}"`, async () => {
      setBusyId(id);
      try {
        await apiCall(`/api/admin/api-credentials/${id}`, { method: "DELETE" });
        toast({ title: "Deleted" });
        onRefreshCreds();
      } catch (e: any) {
        toast({ title: "Delete failed", description: e.message, variant: "destructive" });
      } finally { setBusyId(null); }
    });
  };

  return (
    <Card className={`bg-card border-border border-l-4 ${BORDER_COLORS[guide.category] || "border-l-muted"}`}>
      <CardContent className="py-4 space-y-3">

        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <span className="text-2xl shrink-0">{guide.icon}</span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-0.5">
                <h3 className="font-semibold text-primary">{guide.label}</h3>
                <StatusPill ok={status?.ok} loading={loading} />
                {def && <Badge variant="outline" className="text-[10px]">DB-managed</Badge>}
              </div>
              <p className="text-sm text-muted-foreground">{guide.description}</p>
              {!status?.ok && !loading && (
                <p className="text-xs text-red-700 mt-0.5 font-medium">⚠️ {guide.why}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {guide.docsUrl && (
              <a href={guide.docsUrl} target="_blank" rel="noreferrer"
                className="text-xs text-primary underline flex items-center gap-1 hover:opacity-80">
                <ExternalLink className="w-3 h-3" />Docs
              </a>
            )}
            <button onClick={() => setShowGuide(v => !v)}
              className="flex items-center gap-1 text-xs text-primary/70 hover:text-primary transition-colors">
              {showGuide ? <><ChevronUp className="w-3.5 h-3.5" />Hide guide</> : <><ChevronDown className="w-3.5 h-3.5" />How to set up</>}
            </button>
          </div>
        </div>

        {/* Env var pills */}
        <div className="flex flex-wrap gap-1.5">
          {guide.vars.map(v => (
            <span key={v.name}
              className={`font-mono text-[11px] px-2 py-0.5 rounded ${v.required ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}
              title={v.description}>
              {v.name}{!v.required && " (optional)"}
            </span>
          ))}
        </div>

        {/* Collapsible guide */}
        {showGuide && (
          <div className="border-t border-border pt-3 space-y-3">
            <p className="text-xs font-semibold text-secondary uppercase tracking-wider">Step-by-step setup</p>
            <ol className="space-y-2">
              {guide.steps.map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">{i + 1}</span>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm">{step.text}</p>
                    {step.url && (
                      <a href={step.url} target="_blank" rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary underline hover:opacity-80">
                        <ExternalLink className="w-3 h-3" />{step.urlLabel || step.url}
                      </a>
                    )}
                    {step.code && (
                      <div className="relative">
                        <pre className="bg-muted rounded p-2.5 text-xs font-mono overflow-x-auto border border-border whitespace-pre-wrap">{step.code}</pre>
                        <CopyBtn text={step.code} />
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* ── Credential manager (DB-backed providers only) ── */}
        {def && (
          <div className="border-t border-border pt-3 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-secondary uppercase tracking-wider flex items-center gap-1.5">
                <Lock className="w-3 h-3" />Manage Keys
                <span className="text-muted-foreground normal-case font-normal">(encrypted in DB — active on save)</span>
              </p>
              {!showForm && (
                <Button size="sm" variant="outline" className="h-6 text-xs"
                  onClick={() => { setEditingRow(null); setShowForm(true); }}
                  data-testid={`btn-add-cred-${guide.id}`}>
                  <Plus className="w-3 h-3 mr-1" />Add key
                </Button>
              )}
            </div>

            {credentials.length === 0 && !showForm && (
              <div className="text-xs text-muted-foreground bg-muted/40 rounded p-2.5 flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                No credential stored. Click "Add key" to save one — it will activate immediately.
              </div>
            )}

            {credentials.map(row => (
              <CredRow
                key={row.id}
                row={row}
                busy={busyId === row.id}
                onTest={() => doTest(row.id)}
                onActivate={() => doActivate(row.id)}
                onDeactivate={() => doDeactivate(row.id)}
                onEdit={() => { setEditingRow(row); setShowForm(true); }}
                onDelete={() => doDelete(row.id, row.label)}
              />
            ))}

            {showForm && (
              <CredentialForm
                providerId={guide.dbProviderId!}
                kind={guide.category}
                editing={editingRow}
                onSaved={() => { setShowForm(false); setEditingRow(null); onRefreshCreds(); }}
                onCancel={() => { setShowForm(false); setEditingRow(null); }}
                gateMutation={gateMutation}
              />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main Tab ─────────────────────────────────────────────────────────────────

export default function ApiSetupGuideTab() {
  const adminToken = typeof window !== "undefined" ? localStorage.getItem("adminToken") || "" : "";
  const fetcher = createFetcher(adminToken);
  const qc = useQueryClient();
  const { toast } = useToast();
  const [category, setCategory] = useState<string>("all");
  const [showOnlyMissing, setShowOnlyMissing] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

  const { data: statusMap, isLoading: statusLoading, refetch: refetchStatus, isFetching } = useQuery<StatusMap>({
    queryKey: ["/api/admin/api-key-status"],
    queryFn: () => fetcher("/api/admin/api-key-status"),
  });

  const { data: allCreds = [], refetch: refetchCreds } = useQuery<CredentialRow[]>({
    queryKey: ["/api/admin/api-credentials/all"],
    queryFn: () => fetcher("/api/admin/api-credentials"),
  });

  const refetchAll = useCallback(() => {
    refetchStatus();
    refetchCreds();
  }, [refetchStatus, refetchCreds]);

  // Password gate — if unlocked (5-min cache) run immediately, else open dialog
  const gateMutation = useCallback((label: string, fn: () => Promise<void>) => {
    if (isUnlocked()) {
      fn().then(() => refetchAll()).catch((e: any) => toast({ title: "Action failed", description: e.message, variant: "destructive" }));
    } else {
      setPendingAction({ label, fn });
    }
  }, [refetchAll, toast]);

  const configured = statusMap ? Object.values(statusMap).filter(s => s.ok).length : 0;
  const total = statusMap ? Object.keys(statusMap).length : 0;

  const filtered = GUIDES.filter(g => {
    if (category !== "all" && g.category !== category) return false;
    if (showOnlyMissing && statusMap?.[g.statusKey]?.ok) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-serif text-primary">API Setup &amp; Keys</h1>
          <p className="text-sm text-muted-foreground">
            Manage all external integrations — step-by-step guides, live status, and encrypted key storage
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={refetchAll} disabled={isFetching}>
          <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Status summary */}
      {statusLoading ? <Skeleton className="h-20 rounded-xl" /> : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="bg-card border-border"><CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Configured</p>
            <p className="text-2xl font-bold text-emerald-600">{configured} / {total}</p>
          </CardContent></Card>
          <Card className="bg-card border-border"><CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Missing</p>
            <p className="text-2xl font-bold text-red-600">{total - configured}</p>
          </CardContent></Card>
          <Card className="bg-card border-border col-span-2"><CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5">Quick status</p>
            <div className="flex flex-wrap gap-1">
              {statusMap && Object.entries(statusMap).map(([key, val]) => (
                <span key={key} className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${val.ok ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>{key}</span>
              ))}
            </div>
          </CardContent></Card>
        </div>
      )}

      {/* Security note */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="py-3">
          <div className="flex gap-3 text-sm">
            <Lock className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-semibold text-primary">Keys are AES-256-GCM encrypted in the database</p>
              <p className="text-xs text-muted-foreground">
                Each save/activate/delete requires your admin password. After one successful confirm you have a 5-minute grace window.
                Keys activate <strong>immediately</strong> without a server restart — existing payment and AI calls pick them up live.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        {CATEGORIES.map(cat => (
          <button key={cat.id} onClick={() => setCategory(cat.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${category === cat.id ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
            {cat.icon} {cat.label}
          </button>
        ))}
        <button onClick={() => setShowOnlyMissing(v => !v)}
          className={`ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${showOnlyMissing ? "bg-red-600 text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
          <XCircle className="w-3.5 h-3.5" />Only show missing
        </button>
      </div>

      {/* Cards */}
      <div className="space-y-3">
        {filtered.length === 0
          ? <p className="text-center text-muted-foreground py-10">{showOnlyMissing ? "All configured! ✅" : "No services in this category."}</p>
          : filtered.map(guide => (
            <ServiceCard
              key={guide.id}
              guide={guide}
              status={statusMap?.[guide.statusKey]}
              loading={statusLoading}
              credentials={allCreds.filter(c => c.provider === guide.dbProviderId)}
              onRefreshCreds={refetchAll}
              gateMutation={gateMutation}
            />
          ))
        }
      </div>

      {/* Password confirmation dialog */}
      {pendingAction && (
        <ConfirmPasswordDialog
          pending={pendingAction}
          adminToken={adminToken}
          onConfirmed={() => {
            const action = pendingAction;
            setPendingAction(null);
            action.fn()
              .then(() => refetchAll())
              .catch((e: any) => toast({ title: "Action failed", description: e.message, variant: "destructive" }));
          }}
          onCancel={() => setPendingAction(null)}
        />
      )}
    </div>
  );
}

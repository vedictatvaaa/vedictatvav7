import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CheckCircle2, XCircle, ChevronDown, ChevronUp, ExternalLink,
  Copy, RefreshCw, Key, Shield, Zap, Globe, Mail, Truck, CreditCard,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { createFetcher } from "../admin-shared";

// ─── Types ───────────────────────────────────────────────────────────────────

interface KeyStatus { ok: boolean; vars: string[] }
type StatusMap = Record<string, KeyStatus>;

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
  dbBacked?: boolean; // can also be set via AI Providers / Payment Gateways tab
  docsUrl: string;
}

// ─── Guide definitions ───────────────────────────────────────────────────────

const GUIDES: ServiceGuide[] = [
  // ── PAYMENTS ──────────────────────────────────────────────────────────────
  {
    id: "razorpay",
    label: "Razorpay",
    category: "payment",
    icon: "💳",
    description: "Primary payment gateway for orders, subscriptions, and puja bookings.",
    why: "Required for any paid transaction on the site. Without it, checkout will fail.",
    statusKey: "razorpay",
    docsUrl: "https://razorpay.com/docs/api/",
    dbBacked: true,
    steps: [
      { text: "Go to Razorpay Dashboard", url: "https://dashboard.razorpay.com/app/keys", urlLabel: "Open Razorpay Dashboard" },
      { text: "Sign up or log in to your Razorpay account." },
      { text: "Navigate to Settings → API Keys." },
      { text: "Click Generate Test Key to get a test key pair first." },
      { text: "Copy the Key ID (starts with rzp_test_...) and Key Secret." },
      { text: "In Replit, open the Secrets panel (🔒 icon in the left sidebar) and add:", code: "RAZORPAY_KEY_ID = rzp_test_xxxxxxxxxx\nRAZORPAY_KEY_SECRET = your_secret_here" },
      { text: "For webhooks: In Razorpay Dashboard → Webhooks, create a webhook pointing to your site URL + /api/razorpay/webhook. Copy the webhook secret and add:", code: "RAZORPAY_WEBHOOK_SECRET = your_webhook_secret" },
      { text: "To go live: Generate a Live key pair, switch to Live mode, and update the secrets with the live keys (rzp_live_...)." },
      { text: "Alternatively, use Admin → Payment Gateways to store the key in the database (auto-rehydrates on server start)." },
    ],
    vars: [
      { name: "RAZORPAY_KEY_ID", description: "Key ID from Razorpay Dashboard → API Keys", required: true },
      { name: "RAZORPAY_KEY_SECRET", description: "Key Secret (keep this private)", required: true },
      { name: "RAZORPAY_WEBHOOK_SECRET", description: "Webhook signing secret for payment confirmations", required: false },
    ],
  },

  // ── AI ────────────────────────────────────────────────────────────────────
  {
    id: "openai",
    label: "OpenAI",
    category: "ai",
    icon: "🤖",
    description: "Powers Kundli generation, baby names, palm reading, Vastu analysis, AI Kathas, and the AI Assistant.",
    why: "Required for all AI features. Without it, all AI-powered features will show errors.",
    statusKey: "openai",
    docsUrl: "https://platform.openai.com/docs",
    dbBacked: true,
    steps: [
      { text: "Go to OpenAI Platform", url: "https://platform.openai.com/api-keys", urlLabel: "Open OpenAI API Keys" },
      { text: "Sign up or log in. You may need to verify a phone number." },
      { text: "Click Create new secret key. Give it a name like 'Vedic Tatva'." },
      { text: "Copy the key immediately — it is only shown once. It starts with sk-proj-... or sk-..." },
      { text: "Add billing info under Billing → Payment methods. Without credits, API calls will fail with 429 errors." },
      { text: "In Replit Secrets, add:", code: "OPENAI_API_KEY = sk-proj-xxxxxxxxxxxxxx" },
      { text: "Alternatively, use Admin → AI Providers to store it in the database." },
      { text: "Recommended model: gpt-4o-mini for cost efficiency, gpt-4o for higher quality." },
    ],
    vars: [
      { name: "OPENAI_API_KEY", description: "Secret API key from platform.openai.com/api-keys", required: true },
    ],
  },
  {
    id: "anthropic",
    label: "Anthropic Claude",
    category: "ai",
    icon: "🧠",
    description: "Alternative AI provider (Claude models). Can be used as a fallback or for specific AI tasks.",
    why: "Optional — use if you want Claude models as an alternative to OpenAI.",
    statusKey: "anthropic",
    docsUrl: "https://docs.anthropic.com/",
    dbBacked: true,
    steps: [
      { text: "Go to Anthropic Console", url: "https://console.anthropic.com/", urlLabel: "Open Anthropic Console" },
      { text: "Sign up or log in at console.anthropic.com." },
      { text: "Navigate to API Keys → Create Key." },
      { text: "Copy the key — it starts with sk-ant-api03-..." },
      { text: "Add billing/credits under Settings → Billing." },
      { text: "In Replit Secrets, add:", code: "ANTHROPIC_API_KEY = sk-ant-api03-xxxxxx" },
      { text: "Note: 'Claude Code' is an IDE product and is NOT the same as the Anthropic API. This key is for programmatic API access only." },
    ],
    vars: [
      { name: "ANTHROPIC_API_KEY", description: "API key from console.anthropic.com", required: false },
    ],
  },
  {
    id: "gemini",
    label: "Google Gemini",
    category: "ai",
    icon: "✨",
    description: "Google's AI models (Gemini Pro, Flash). Alternative to OpenAI.",
    why: "Optional — use as a cost-effective alternative to OpenAI for some features.",
    statusKey: "gemini",
    docsUrl: "https://ai.google.dev/docs",
    dbBacked: true,
    steps: [
      { text: "Go to Google AI Studio", url: "https://aistudio.google.com/app/apikey", urlLabel: "Open Google AI Studio" },
      { text: "Sign in with your Google account." },
      { text: "Click Create API Key. Select an existing Google Cloud project or create a new one." },
      { text: "Copy the key — it starts with AIza..." },
      { text: "In Replit Secrets, add:", code: "GEMINI_API_KEY = AIzaxxxxxxxxxxxxxxxxxx" },
      { text: "Free tier available: 60 requests/minute on Gemini Flash models." },
    ],
    vars: [
      { name: "GEMINI_API_KEY", description: "API key from Google AI Studio (starts with AIza...)", required: false },
    ],
  },
  {
    id: "openrouter",
    label: "OpenRouter",
    category: "ai",
    icon: "🔀",
    description: "Access 100+ models (GPT-4, Claude, Llama, Mixtral) through a single API with unified billing.",
    why: "Optional — useful for accessing multiple model providers through one key with automatic fallbacks.",
    statusKey: "openrouter",
    docsUrl: "https://openrouter.ai/docs",
    dbBacked: true,
    steps: [
      { text: "Go to OpenRouter", url: "https://openrouter.ai/keys", urlLabel: "Open OpenRouter" },
      { text: "Sign up with GitHub or Google." },
      { text: "Navigate to Keys → Create Key." },
      { text: "Copy the key — it starts with sk-or-v1-..." },
      { text: "Add credits under Credits tab (pay-as-you-go)." },
      { text: "In Replit Secrets, add:", code: "OPENROUTER_API_KEY = sk-or-v1-xxxxxx" },
    ],
    vars: [
      { name: "OPENROUTER_API_KEY", description: "API key from openrouter.ai/keys", required: false },
    ],
  },

  // ── GOOGLE ────────────────────────────────────────────────────────────────
  {
    id: "googleOauth",
    label: "Google Sign-In (OAuth)",
    category: "google",
    icon: "🔐",
    description: "Enables customers to sign in with their Google account — one-tap login on checkout.",
    why: "Highly recommended — reduces signup friction, increases conversions.",
    statusKey: "googleOauth",
    docsUrl: "https://console.cloud.google.com/apis/credentials",
    steps: [
      { text: "Open Google Cloud Console", url: "https://console.cloud.google.com/", urlLabel: "Open Google Cloud Console" },
      { text: "Create a new project (e.g. 'Vedic Tatva') or select an existing one." },
      { text: "Go to APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID." },
      { text: "Set Application Type to 'Web application'." },
      { text: "Under Authorized JavaScript origins, add your site URL (e.g. https://vedictatva.com)." },
      { text: "Under Authorized redirect URIs, add: https://vedictatva.com/api/auth/google/callback" },
      { text: "Click Create. Copy the Client ID and Client Secret." },
      { text: "In Replit Secrets, add:", code: "GOOGLE_CLIENT_ID = xxxxxxxxxx.apps.googleusercontent.com\nGOOGLE_CLIENT_SECRET = GOCSPX-xxxxxx" },
      { text: "Go to OAuth consent screen → make it External → add your domain → publish the app." },
    ],
    vars: [
      { name: "GOOGLE_CLIENT_ID", description: "OAuth 2.0 Client ID (ends with .apps.googleusercontent.com)", required: true },
      { name: "GOOGLE_CLIENT_SECRET", description: "OAuth 2.0 Client Secret (starts with GOCSPX-)", required: false },
    ],
  },
  {
    id: "googleIndexing",
    label: "Google Indexing / Search Console",
    category: "google",
    icon: "🔍",
    description: "Automatically notifies Google when new pages/products are published so they index faster.",
    why: "Important for SEO — without this, new pages may take weeks to appear in Google search.",
    statusKey: "googleIndexing",
    docsUrl: "https://developers.google.com/search/apis/indexing-api/v3/quickstart",
    steps: [
      { text: "Open Google Search Console and verify ownership of vedictatva.com", url: "https://search.google.com/search-console", urlLabel: "Open Search Console" },
      { text: "In Google Cloud Console, enable the 'Web Search Indexing API' for your project." },
      { text: "Go to APIs & Services → Credentials → Create Credentials → Service Account." },
      { text: "Give it a name (e.g. 'vedic-tatva-indexing'). Role: Owner or Editor." },
      { text: "Under the service account → Keys → Add Key → JSON. Download the JSON file." },
      { text: "In Search Console → Settings → Users and permissions, add the service account email as an Owner." },
      { text: "Copy the entire content of the JSON key file and add it to Replit Secrets as a single-line JSON string:", code: "GOOGLE_SERVICE_ACCOUNT_JSON = {\"type\":\"service_account\",\"project_id\":\"...\"}" },
      { text: "Also set your site URL:", code: "GSC_SITE_URL = https://vedictatva.com/" },
      { text: "The indexing API is limited to 200 URLs per day on the free tier." },
    ],
    vars: [
      { name: "GOOGLE_SERVICE_ACCOUNT_JSON", description: "Full JSON content of the service account key file", required: true },
      { name: "GSC_SITE_URL", description: "Your verified Search Console property URL (with trailing slash)", required: false },
    ],
  },

  // ── COMMUNICATION ─────────────────────────────────────────────────────────
  {
    id: "sendgrid",
    label: "SendGrid (Email)",
    category: "communication",
    icon: "📧",
    description: "Sends transactional emails: order confirmations, booking notifications, password resets, newsletters.",
    why: "Required for all email notifications. Without it, customers receive no email confirmations.",
    statusKey: "sendgrid",
    docsUrl: "https://docs.sendgrid.com/",
    steps: [
      { text: "Go to SendGrid", url: "https://app.sendgrid.com/", urlLabel: "Open SendGrid Dashboard" },
      { text: "Sign up for a free account (100 emails/day free)." },
      { text: "Complete Sender Authentication: Settings → Sender Authentication → verify your sending domain (vedictatva.com)." },
      { text: "Go to Settings → API Keys → Create API Key." },
      { text: "Name it 'Vedic Tatva', select Full Access, click Create & View." },
      { text: "Copy the key — it starts with SG. and is only shown once." },
      { text: "In Replit Secrets, add:", code: "SENDGRID_API_KEY = SG.xxxxxxxxxxxxxx" },
      { text: "For better deliverability, add DNS records (DKIM/CNAME) from the Sender Authentication step to your domain DNS." },
    ],
    vars: [
      { name: "SENDGRID_API_KEY", description: "API key from SendGrid Dashboard (starts with SG.)", required: true },
    ],
  },
  {
    id: "msg91",
    label: "MSG91 (SMS / WhatsApp / OTP)",
    category: "communication",
    icon: "📱",
    description: "Sends OTP verifications, order update SMS, and WhatsApp booking notifications to customers.",
    why: "Required for order journey notifications. WhatsApp-first with SMS fallback.",
    statusKey: "msg91",
    docsUrl: "https://docs.msg91.com/",
    steps: [
      { text: "Go to MSG91 Dashboard", url: "https://msg91.com/", urlLabel: "Open MSG91" },
      { text: "Sign up and complete KYC verification (required for Indian SMS)." },
      { text: "Go to API → Authkey. Click Add Authkey." },
      { text: "Copy the Auth Key." },
      { text: "In Replit Secrets, add:", code: "MSG91_AUTH_KEY = xxxxxxxxxxxxxxxxxxxxxxxx" },
      { text: "For WhatsApp: Go to WhatsApp → Manage → get your WhatsApp Business number and template IDs." },
      { text: "For OTP: Create an OTP template in MSG91 under SMS → Templates. Note the template ID." },
      { text: "Register your DLT sender ID and templates with TRAI (mandatory for Indian SMS)." },
    ],
    vars: [
      { name: "MSG91_AUTH_KEY", description: "Authentication key from MSG91 → API section", required: true },
    ],
  },

  // ── SHIPPING ──────────────────────────────────────────────────────────────
  {
    id: "shiprocket",
    label: "Shiprocket",
    category: "shipping",
    icon: "🚀",
    description: "Handles shipping labels, order tracking, and delivery status webhooks for physical product orders.",
    why: "Required if you sell physical products (puja samagri, idols, etc.) that need shipping.",
    statusKey: "shiprocket",
    docsUrl: "https://apidocs.shiprocket.in/",
    steps: [
      { text: "Go to Shiprocket", url: "https://app.shiprocket.in/", urlLabel: "Open Shiprocket" },
      { text: "Sign up for a Shiprocket account and add your business details." },
      { text: "Go to Settings → API → Generate API credentials. Note your Email and Password." },
      { text: "For webhooks: Go to Settings → Webhooks → Add Webhook. Point it to https://vedictatva.com/api/shiprocket/webhook." },
      { text: "Generate a webhook secret/token." },
      { text: "In Replit Secrets, add:", code: "SHIPROCKET_EMAIL = your_shiprocket_email@example.com\nSHIPROCKET_PASSWORD = your_shiprocket_password\nSHIPROCKET_WEBHOOK_TOKEN = your_webhook_token" },
      { text: "The webhook uses HMAC-SHA256 signature verification. Set SHIPROCKET_WEBHOOK_ALLOW_LEGACY=1 only during initial cutover." },
    ],
    vars: [
      { name: "SHIPROCKET_WEBHOOK_TOKEN", description: "Webhook signing token from Shiprocket → Settings → Webhooks", required: true },
      { name: "SHIPROCKET_EMAIL", description: "Your Shiprocket account email", required: false },
      { name: "SHIPROCKET_PASSWORD", description: "Your Shiprocket account password", required: false },
    ],
  },

  // ── CORE ──────────────────────────────────────────────────────────────────
  {
    id: "database",
    label: "PostgreSQL Database",
    category: "core",
    icon: "🗄️",
    description: "The main database for all application data: orders, users, products, bookings, etc.",
    why: "Critical — the app cannot run without a database connection.",
    statusKey: "database",
    docsUrl: "https://orm.drizzle.team/docs/overview/postgresql",
    steps: [
      { text: "In Replit, go to the Database tab in the left sidebar (or press the DB icon)." },
      { text: "Click 'Create a database'. Replit automatically creates a free PostgreSQL database." },
      { text: "The PG_DATABASE_URL is automatically set as a Replit Secret — you don't need to do anything." },
      { text: "To push the schema to the database, run in the Shell:", code: "npm run db:push" },
      { text: "For production (Coolify): SSH into the server and run npm run db:push manually after any schema changes." },
      { text: "⚠️ IMPORTANT: After deploying, always run db:push if you changed shared/schema.ts, otherwise the server crashes with 'column does not exist' errors." },
    ],
    vars: [
      { name: "PG_DATABASE_URL", description: "PostgreSQL connection string (set automatically by Replit Database)", required: true },
    ],
  },
  {
    id: "session",
    label: "Session & Security Secrets",
    category: "core",
    icon: "🔑",
    description: "Cryptographic secrets for session management, email unsubscribe links, and order lookup tokens.",
    why: "Critical — without these, user sessions won't work and security features will be disabled.",
    statusKey: "session",
    docsUrl: "",
    steps: [
      { text: "Generate strong random secrets using the command below (run in Shell):", code: "node -e \"console.log(require('crypto').randomBytes(48).toString('hex'))\"" },
      { text: "Run this twice to get two different values." },
      { text: "In Replit Secrets, add:", code: "SESSION_SECRET = <first_random_value>\nUNSUBSCRIBE_SECRET = <second_random_value>" },
      { text: "Never reuse the same value for both secrets." },
      { text: "Changing SESSION_SECRET will invalidate all existing admin and user sessions." },
    ],
    vars: [
      { name: "SESSION_SECRET", description: "Random 48+ byte hex string for session signing", required: true },
      { name: "UNSUBSCRIBE_SECRET", description: "Random string for email unsubscribe link signing", required: true },
    ],
  },
];

// ─── Category config ─────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: "all",          label: "All",           icon: <Key className="w-4 h-4" /> },
  { id: "core",         label: "Core",          icon: <Shield className="w-4 h-4" /> },
  { id: "payment",      label: "Payments",      icon: <CreditCard className="w-4 h-4" /> },
  { id: "ai",           label: "AI Models",     icon: <Zap className="w-4 h-4" /> },
  { id: "google",       label: "Google",        icon: <Globe className="w-4 h-4" /> },
  { id: "communication",label: "Comms",         icon: <Mail className="w-4 h-4" /> },
  { id: "shipping",     label: "Shipping",      icon: <Truck className="w-4 h-4" /> },
] as const;

const CATEGORY_COLORS: Record<string, string> = {
  payment:      "border-l-amber-500",
  ai:           "border-l-purple-500",
  google:       "border-l-blue-500",
  communication:"border-l-emerald-500",
  shipping:     "border-l-orange-500",
  core:         "border-l-primary",
};

// ─── Helper components ───────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const { toast } = useToast();
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); toast({ title: "Copied to clipboard" }); }}
      className="ml-1 text-muted-foreground hover:text-foreground transition-colors"
      title="Copy"
    >
      <Copy className="w-3 h-3 inline" />
    </button>
  );
}

function StatusPill({ ok, loading }: { ok: boolean | undefined; loading: boolean }) {
  if (loading) return <span className="inline-block w-16 h-5 bg-muted rounded animate-pulse" />;
  return ok ? (
    <Badge className="bg-emerald-100 text-emerald-800 gap-1 text-xs"><CheckCircle2 className="w-3 h-3" /> Configured</Badge>
  ) : (
    <Badge className="bg-red-100 text-red-800 gap-1 text-xs"><XCircle className="w-3 h-3" /> Not set</Badge>
  );
}

// ─── Service Card ─────────────────────────────────────────────────────────────

function ServiceCard({ guide, status, loading }: { guide: ServiceGuide; status?: KeyStatus; loading: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const ok = status?.ok;

  return (
    <Card className={`bg-card border-border border-l-4 ${CATEGORY_COLORS[guide.category] || "border-l-muted"}`}>
      <CardContent className="py-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <span className="text-2xl shrink-0">{guide.icon}</span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-0.5">
                <h3 className="font-semibold text-primary">{guide.label}</h3>
                <StatusPill ok={ok} loading={loading} />
                {guide.dbBacked && (
                  <Badge variant="outline" className="text-[10px]">DB-managed</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{guide.description}</p>
              {!ok && !loading && (
                <p className="text-xs text-red-700 mt-1 font-medium">⚠️ {guide.why}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {guide.docsUrl && (
              <a href={guide.docsUrl} target="_blank" rel="noreferrer" className="text-xs text-primary underline flex items-center gap-1 hover:opacity-80">
                <ExternalLink className="w-3 h-3" /> Docs
              </a>
            )}
            <button
              onClick={() => setExpanded(v => !v)}
              className="flex items-center gap-1 text-xs text-primary/70 hover:text-primary transition-colors whitespace-nowrap"
            >
              {expanded ? <><ChevronUp className="w-3.5 h-3.5" /> Hide guide</> : <><ChevronDown className="w-3.5 h-3.5" /> Setup guide</>}
            </button>
          </div>
        </div>

        {/* Env var pills */}
        <div className="flex flex-wrap gap-1.5">
          {guide.vars.map(v => (
            <span
              key={v.name}
              className={`font-mono text-[11px] px-2 py-0.5 rounded ${v.required ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}
              title={v.description}
            >
              {v.name}
              {!v.required && " (optional)"}
            </span>
          ))}
        </div>

        {/* Expanded guide */}
        {expanded && (
          <div className="border-t border-border pt-4 space-y-4">
            {/* Step-by-step */}
            <div>
              <p className="text-xs font-semibold text-secondary uppercase mb-3 tracking-wider">Step-by-step setup</p>
              <ol className="space-y-3">
                {guide.steps.map((step, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <div className="flex-1 space-y-1.5">
                      <p className="text-sm">{step.text}</p>
                      {step.url && (
                        <a
                          href={step.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary underline hover:opacity-80"
                        >
                          <ExternalLink className="w-3 h-3" /> {step.urlLabel || step.url}
                        </a>
                      )}
                      {step.code && (
                        <div className="relative">
                          <pre className="bg-muted rounded-md p-3 text-xs font-mono overflow-x-auto text-foreground border border-border whitespace-pre-wrap">
                            {step.code}
                          </pre>
                          <CopyButton text={step.code} />
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            {/* Variable reference */}
            <div>
              <p className="text-xs font-semibold text-secondary uppercase mb-3 tracking-wider">Environment Variables</p>
              <div className="rounded-lg border border-border overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-2.5 font-medium text-muted-foreground">Variable name</th>
                      <th className="text-left p-2.5 font-medium text-muted-foreground">Description</th>
                      <th className="text-left p-2.5 font-medium text-muted-foreground">Required</th>
                    </tr>
                  </thead>
                  <tbody>
                    {guide.vars.map((v, i) => (
                      <tr key={v.name} className={i % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                        <td className="p-2.5 font-mono text-primary">
                          {v.name}
                          <CopyButton text={v.name} />
                        </td>
                        <td className="p-2.5 text-muted-foreground">{v.description}</td>
                        <td className="p-2.5">
                          {v.required
                            ? <span className="text-red-700 font-medium">Required</span>
                            : <span className="text-muted-foreground">Optional</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {guide.dbBacked && (
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-xs text-primary space-y-1">
                <p className="font-semibold">💡 Two ways to set this key</p>
                <p><strong>Option A (Recommended for Replit):</strong> Add it to Replit Secrets → it's read at startup and persists across deploys.</p>
                <p><strong>Option B (Admin panel):</strong> Use Admin → {guide.category === "payment" ? "Payment Gateways" : "AI Providers"} → Add credential → it's stored encrypted in the database and auto-loaded at startup without a server restart.</p>
              </div>
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
  const [category, setCategory] = useState<string>("all");
  const [showOnlyMissing, setShowOnlyMissing] = useState(false);

  const { data: statusMap, isLoading, refetch, isFetching } = useQuery<StatusMap>({
    queryKey: ["/api/admin/api-key-status"],
    queryFn: () => fetcher("/api/admin/api-key-status"),
  });

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
          <h1 className="text-3xl font-serif text-primary">API Setup Guide</h1>
          <p className="text-sm text-muted-foreground">
            Step-by-step setup for every external service Vedic Tatva connects to
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Status summary */}
      {isLoading ? (
        <Skeleton className="h-20 rounded-xl" />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Configured</p>
              <p className="text-2xl font-bold text-emerald-600">{configured} / {total}</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Missing</p>
              <p className="text-2xl font-bold text-red-600">{total - configured}</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border col-span-2">
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Quick status</p>
              <div className="flex flex-wrap gap-1.5">
                {statusMap && Object.entries(statusMap).map(([key, val]) => (
                  <span
                    key={key}
                    className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${val.ok ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}
                  >
                    {key}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* How to set secrets banner */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="py-4">
          <div className="flex gap-3">
            <span className="text-2xl shrink-0">🔒</span>
            <div className="space-y-1 text-sm">
              <p className="font-semibold text-primary">How to set environment variables on Replit</p>
              <p className="text-muted-foreground">
                In the Replit editor, click the <strong>🔒 Secrets</strong> icon in the left sidebar (or press <kbd className="bg-muted px-1 rounded text-xs">Ctrl+Shift+S</kbd>).
                Add each variable as a key-value pair. Changes take effect on the next server restart.
              </p>
              <p className="text-muted-foreground">
                <strong>On production (Coolify):</strong> Add secrets in the Coolify service environment variables panel, then redeploy.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              category === cat.id
                ? "bg-primary text-white"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {cat.icon} {cat.label}
          </button>
        ))}
        <button
          onClick={() => setShowOnlyMissing(v => !v)}
          className={`ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            showOnlyMissing ? "bg-red-600 text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          <XCircle className="w-3.5 h-3.5" /> Only show missing
        </button>
      </div>

      {/* Service cards */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-10">
            {showOnlyMissing ? "All services in this category are configured! ✅" : "No services in this category."}
          </p>
        ) : (
          filtered.map(guide => (
            <ServiceCard
              key={guide.id}
              guide={guide}
              status={statusMap?.[guide.statusKey]}
              loading={isLoading}
            />
          ))
        )}
      </div>
    </div>
  );
}

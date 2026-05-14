// Integrations Hub: one function that returns the status of every integration
// used by the app. "configured" is purely env-var presence; "healthy" is
// available for on-demand per-provider ping checks done through the admin UI.
//
// Keep this file the single source of truth for what we claim to integrate —
// adding a new integration elsewhere without registering it here means the
// Hub will silently miss it.

export type IntegrationKey =
  | "razorpay" | "shiprocket" | "openai" | "google_merchant"
  | "msg91" | "sendgrid" | "google_oauth";

export interface IntegrationInfo {
  key: IntegrationKey;
  label: string;
  category: "Payments" | "Shipping" | "AI" | "Marketing" | "Messaging" | "Auth";
  envVars: string[];
  configured: boolean;
  /** Mask any detected identifier so the admin can visually verify which key is live. */
  maskedIdentifier?: string;
  docs: string;
}

function mask(val: string | undefined): string | undefined {
  if (!val) return undefined;
  if (val.length <= 8) return val.slice(0, 2) + "•••";
  return val.slice(0, 4) + "•••••" + val.slice(-4);
}

export function getIntegrationsStatus(): IntegrationInfo[] {
  return [
    {
      key: "razorpay",
      label: "Razorpay",
      category: "Payments",
      envVars: ["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET", "RAZORPAY_WEBHOOK_SECRET"],
      configured: Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
      maskedIdentifier: mask(process.env.RAZORPAY_KEY_ID),
      docs: "https://razorpay.com/docs/",
    },
    {
      key: "shiprocket",
      label: "Shiprocket",
      category: "Shipping",
      envVars: ["SHIPROCKET_EMAIL", "SHIPROCKET_PASSWORD", "SHIPROCKET_PICKUP_LOCATION"],
      configured: Boolean(process.env.SHIPROCKET_EMAIL && process.env.SHIPROCKET_PASSWORD),
      maskedIdentifier: mask(process.env.SHIPROCKET_EMAIL),
      docs: "https://apidocs.shiprocket.in/",
    },
    {
      key: "openai",
      label: "OpenAI",
      category: "AI",
      envVars: ["OPENAI_API_KEY"],
      configured: Boolean(process.env.OPENAI_API_KEY),
      maskedIdentifier: mask(process.env.OPENAI_API_KEY),
      docs: "https://platform.openai.com/docs",
    },
    {
      key: "google_merchant",
      label: "Google Merchant Center",
      category: "Marketing",
      envVars: ["GOOGLE_MERCHANT_ID", "GOOGLE_SERVICE_ACCOUNT_KEY"],
      configured: Boolean(process.env.GOOGLE_MERCHANT_ID && process.env.GOOGLE_SERVICE_ACCOUNT_KEY),
      maskedIdentifier: mask(process.env.GOOGLE_MERCHANT_ID),
      docs: "https://developers.google.com/shopping-content/guides",
    },
    {
      key: "msg91",
      label: "MSG91 (SMS/OTP)",
      category: "Messaging",
      envVars: ["MSG91_AUTH_KEY"],
      configured: Boolean(process.env.MSG91_AUTH_KEY),
      maskedIdentifier: mask(process.env.MSG91_AUTH_KEY),
      docs: "https://docs.msg91.com/",
    },
    {
      key: "sendgrid",
      label: "SendGrid (Email)",
      category: "Messaging",
      envVars: ["SENDGRID_API_KEY"],
      configured: Boolean(process.env.SENDGRID_API_KEY),
      maskedIdentifier: mask(process.env.SENDGRID_API_KEY),
      docs: "https://docs.sendgrid.com/",
    },
    {
      key: "google_oauth",
      label: "Google OAuth",
      category: "Auth",
      envVars: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
      configured: Boolean(process.env.GOOGLE_CLIENT_ID),
      maskedIdentifier: mask(process.env.GOOGLE_CLIENT_ID),
      docs: "https://developers.google.com/identity",
    },
  ];
}

// 8s cap prevents a hung provider from blocking the admin UI. AbortController
// is used instead of Promise.race so the underlying socket is actually closed.
const PING_TIMEOUT_MS = 8000;
function timedFetch(url: string, init?: RequestInit): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), PING_TIMEOUT_MS);
  return fetch(url, { ...init, signal: ctrl.signal }).finally(() => clearTimeout(timer));
}

// Ping a provider with a cheap read. Returns { ok, message } so the admin UI
// can surface the error without leaking secrets.
export async function pingIntegration(key: IntegrationKey): Promise<{ ok: boolean; message: string }> {
  try {
    switch (key) {
      case "razorpay": {
        if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) return { ok: false, message: "Not configured" };
        const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString("base64");
        const res = await timedFetch("https://api.razorpay.com/v1/payments?count=1", { headers: { Authorization: `Basic ${auth}` } });
        return { ok: res.ok, message: res.ok ? "Reachable" : `HTTP ${res.status}` };
      }
      case "shiprocket": {
        const sr = await import("./shiprocket");
        if (!sr.isShiprocketConfigured()) return { ok: false, message: "Not configured" };
        // Serviceability call exercises auth + one real endpoint; short-circuit on timeout via Promise.race.
        const probe = sr.checkServiceability({ pickupPincode: "110001", deliveryPincode: "400001", weightKg: 0.5, cod: false });
        await Promise.race([probe, new Promise((_, rej) => setTimeout(() => rej(new Error("Timeout")), PING_TIMEOUT_MS))]);
        return { ok: true, message: "Authenticated" };
      }
      case "openai": {
        if (!process.env.OPENAI_API_KEY) return { ok: false, message: "Not configured" };
        const res = await timedFetch("https://api.openai.com/v1/models?limit=1", { headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` } });
        return { ok: res.ok, message: res.ok ? "Reachable" : `HTTP ${res.status}` };
      }
      case "sendgrid": {
        if (!process.env.SENDGRID_API_KEY) return { ok: false, message: "Not configured" };
        const res = await timedFetch("https://api.sendgrid.com/v3/scopes", { headers: { Authorization: `Bearer ${process.env.SENDGRID_API_KEY}` } });
        return { ok: res.ok, message: res.ok ? "Reachable" : `HTTP ${res.status}` };
      }
      case "msg91": {
        if (!process.env.MSG91_AUTH_KEY) return { ok: false, message: "Not configured" };
        // MSG91 has no cheap GET — just confirm env presence.
        return { ok: true, message: "Key present (no ping endpoint)" };
      }
      case "google_merchant": {
        return { ok: Boolean(process.env.GOOGLE_MERCHANT_ID), message: process.env.GOOGLE_MERCHANT_ID ? "Configured" : "Not configured" };
      }
      case "google_oauth": {
        return { ok: Boolean(process.env.GOOGLE_CLIENT_ID), message: process.env.GOOGLE_CLIENT_ID ? "Configured" : "Not configured" };
      }
    }
  } catch (err: any) {
    return { ok: false, message: err?.message || "Ping failed" };
  }
  return { ok: false, message: "Unknown integration" };
}

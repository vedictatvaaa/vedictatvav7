// Single source of truth for the API providers Vedic Tatva can talk to.
// Imported by BOTH client (admin form fields) and server (env rehydration,
// AI auto-detect, test routing) so adding a provider is one edit.

export type ProviderKind = "payment" | "ai" | "communication" | "google" | "shipping";

export interface ProviderField {
  key: string;
  label: string;
  secret?: boolean;
  optional?: boolean;
  placeholder?: string;
}

export interface ProviderDef {
  id: string;
  kind: ProviderKind;
  label: string;
  docs: string;
  fields: ProviderField[];
  /** Map of internal field key → process.env name. Used for runtime rehydration. */
  envMap: Record<string, string>;
}

export const PROVIDER_CATALOG: ProviderDef[] = [
  // ---------------- Payments ----------------
  {
    id: "razorpay", kind: "payment", label: "Razorpay",
    docs: "https://razorpay.com/docs/api/",
    fields: [
      { key: "keyId", label: "Key ID", placeholder: "rzp_test_xxxxxxxxxx" },
      { key: "keySecret", label: "Key Secret", secret: true },
      { key: "webhookSecret", label: "Webhook Secret", secret: true, optional: true },
    ],
    envMap: { keyId: "RAZORPAY_KEY_ID", keySecret: "RAZORPAY_KEY_SECRET", webhookSecret: "RAZORPAY_WEBHOOK_SECRET" },
  },
  {
    id: "stripe", kind: "payment", label: "Stripe",
    docs: "https://stripe.com/docs/api",
    fields: [
      { key: "secretKey", label: "Secret Key", secret: true, placeholder: "sk_test_..." },
      { key: "publishableKey", label: "Publishable Key", placeholder: "pk_test_..." },
      { key: "webhookSecret", label: "Webhook Secret", secret: true, optional: true },
    ],
    envMap: { secretKey: "STRIPE_SECRET_KEY", publishableKey: "STRIPE_PUBLISHABLE_KEY", webhookSecret: "STRIPE_WEBHOOK_SECRET" },
  },
  {
    id: "cashfree", kind: "payment", label: "Cashfree",
    docs: "https://docs.cashfree.com/docs",
    fields: [
      { key: "appId", label: "App ID" },
      { key: "secretKey", label: "Secret Key", secret: true },
    ],
    envMap: { appId: "CASHFREE_APP_ID", secretKey: "CASHFREE_SECRET_KEY" },
  },
  {
    id: "payu", kind: "payment", label: "PayU",
    docs: "https://devguide.payu.in/",
    fields: [
      { key: "merchantKey", label: "Merchant Key" },
      { key: "merchantSalt", label: "Merchant Salt", secret: true },
    ],
    envMap: { merchantKey: "PAYU_MERCHANT_KEY", merchantSalt: "PAYU_MERCHANT_SALT" },
  },
  {
    id: "phonepe", kind: "payment", label: "PhonePe",
    docs: "https://developer.phonepe.com/v1/docs",
    fields: [
      { key: "merchantId", label: "Merchant ID" },
      { key: "saltKey", label: "Salt Key", secret: true },
      { key: "saltIndex", label: "Salt Index", placeholder: "1" },
    ],
    envMap: { merchantId: "PHONEPE_MERCHANT_ID", saltKey: "PHONEPE_SALT_KEY", saltIndex: "PHONEPE_SALT_INDEX" },
  },
  {
    id: "paytm", kind: "payment", label: "Paytm",
    docs: "https://business.paytm.com/docs",
    fields: [
      { key: "merchantId", label: "Merchant ID" },
      { key: "merchantKey", label: "Merchant Key", secret: true },
    ],
    envMap: { merchantId: "PAYTM_MERCHANT_ID", merchantKey: "PAYTM_MERCHANT_KEY" },
  },

  // ---------------- AI ----------------
  {
    id: "openai", kind: "ai", label: "OpenAI",
    docs: "https://platform.openai.com/docs",
    fields: [
      { key: "apiKey", label: "API Key", secret: true, placeholder: "sk-..." },
      { key: "baseUrl", label: "Base URL", optional: true, placeholder: "https://api.openai.com/v1" },
      { key: "organization", label: "Organization", optional: true },
    ],
    envMap: { apiKey: "OPENAI_API_KEY", baseUrl: "OPENAI_BASE_URL", organization: "OPENAI_ORG" },
  },
  {
    id: "gemini", kind: "ai", label: "Google Gemini",
    docs: "https://ai.google.dev/docs",
    fields: [
      { key: "apiKey", label: "API Key", secret: true, placeholder: "AIza..." },
    ],
    envMap: { apiKey: "GEMINI_API_KEY" },
  },
  {
    id: "anthropic", kind: "ai", label: "Anthropic Claude",
    docs: "https://docs.anthropic.com/",
    fields: [
      { key: "apiKey", label: "API Key", secret: true, placeholder: "sk-ant-..." },
    ],
    envMap: { apiKey: "ANTHROPIC_API_KEY" },
  },
  {
    id: "mistral", kind: "ai", label: "Mistral",
    docs: "https://docs.mistral.ai/",
    fields: [
      { key: "apiKey", label: "API Key", secret: true },
    ],
    envMap: { apiKey: "MISTRAL_API_KEY" },
  },
  {
    id: "openrouter", kind: "ai", label: "OpenRouter",
    docs: "https://openrouter.ai/docs",
    fields: [
      { key: "apiKey", label: "API Key", secret: true, placeholder: "sk-or-..." },
    ],
    envMap: { apiKey: "OPENROUTER_API_KEY" },
  },

  // ---------------- Communication ----------------
  {
    id: "sendgrid", kind: "communication", label: "SendGrid",
    docs: "https://docs.sendgrid.com/",
    fields: [
      { key: "apiKey", label: "API Key", secret: true, placeholder: "SG.xxxxxxxxxx" },
    ],
    envMap: { apiKey: "SENDGRID_API_KEY" },
  },
  {
    id: "msg91", kind: "communication", label: "MSG91",
    docs: "https://docs.msg91.com/",
    fields: [
      { key: "authKey", label: "Auth Key", secret: true },
      { key: "senderId", label: "Sender ID", optional: true, placeholder: "VTPUJA" },
    ],
    envMap: { authKey: "MSG91_AUTH_KEY", senderId: "MSG91_SENDER_ID" },
  },

  // ---------------- Google ----------------
  {
    id: "googleOauth", kind: "google", label: "Google Sign-In (OAuth)",
    docs: "https://console.cloud.google.com/apis/credentials",
    fields: [
      { key: "clientId", label: "Client ID", placeholder: "xxxxxxxxxx.apps.googleusercontent.com" },
      { key: "clientSecret", label: "Client Secret", secret: true, placeholder: "GOCSPX-..." },
    ],
    envMap: { clientId: "GOOGLE_CLIENT_ID", clientSecret: "GOOGLE_CLIENT_SECRET" },
  },
  {
    id: "googleIndexing", kind: "google", label: "Google Indexing API",
    docs: "https://developers.google.com/search/apis/indexing-api/v3/quickstart",
    fields: [
      { key: "serviceAccountJson", label: "Service Account JSON", secret: true, placeholder: '{"type":"service_account","project_id":"..."}' },
      { key: "gscSiteUrl", label: "Search Console Site URL", optional: true, placeholder: "https://vedictatva.com/" },
    ],
    envMap: { serviceAccountJson: "GOOGLE_SERVICE_ACCOUNT_JSON", gscSiteUrl: "GSC_SITE_URL" },
  },

  // ---------------- Shipping ----------------
  {
    id: "shiprocket", kind: "shipping", label: "Shiprocket",
    docs: "https://apidocs.shiprocket.in/",
    fields: [
      { key: "webhookToken", label: "Webhook Token", secret: true },
      { key: "email", label: "Account Email", optional: true, placeholder: "you@example.com" },
      { key: "password", label: "Account Password", secret: true, optional: true },
    ],
    envMap: { webhookToken: "SHIPROCKET_WEBHOOK_TOKEN", email: "SHIPROCKET_EMAIL", password: "SHIPROCKET_PASSWORD" },
  },
];

export function getProvider(id: string): ProviderDef | undefined {
  return PROVIDER_CATALOG.find((p) => p.id === id);
}

export function providersByKind(kind: ProviderKind): ProviderDef[] {
  return PROVIDER_CATALOG.filter((p) => p.kind === kind);
}

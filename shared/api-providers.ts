// Single source of truth for the API providers Vedic Tatva can talk to.
// Imported by BOTH client (admin form fields) and server (env rehydration,
// AI auto-detect, test routing) so adding a provider is one edit.

export type ProviderKind = "payment" | "ai";

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
];

export function getProvider(id: string): ProviderDef | undefined {
  return PROVIDER_CATALOG.find((p) => p.id === id);
}

export function providersByKind(kind: ProviderKind): ProviderDef[] {
  return PROVIDER_CATALOG.filter((p) => p.kind === kind);
}

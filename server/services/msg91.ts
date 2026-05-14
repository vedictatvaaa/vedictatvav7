const MSG91_BASE = "https://control.msg91.com/api";

function getAuthKey(): string | null {
  const k = process.env.MSG91_AUTH_KEY?.trim();
  return k && k.length > 0 ? k : null;
}

function normalizeMobile(raw: string): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return digits;
  if (digits.length === 11 && digits.startsWith("0")) return `91${digits.slice(1)}`;
  return digits;
}

type SmsParams = {
  mobile: string;
  variables: Record<string, string>;
  templateIdOverride?: string;
};

export async function sendSms({ mobile, variables, templateIdOverride }: SmsParams): Promise<{ ok: boolean; reason?: string }> {
  const authKey = getAuthKey();
  if (!authKey) return { ok: false, reason: "MSG91_AUTH_KEY not configured" };
  const templateId = templateIdOverride || process.env.MSG91_SMS_TEMPLATE_ID?.trim();
  if (!templateId) return { ok: false, reason: "MSG91_SMS_TEMPLATE_ID not configured" };
  const sender = process.env.MSG91_SENDER_ID?.trim();
  const to = normalizeMobile(mobile);
  if (!to) return { ok: false, reason: "Invalid mobile number" };

  const body: any = {
    template_id: templateId,
    short_url: "0",
    recipients: [{ mobiles: to, ...variables }],
  };
  if (sender) body.sender = sender;

  try {
    const res = await fetch(`${MSG91_BASE}/v5/flow/`, {
      method: "POST",
      headers: { "Content-Type": "application/json", authkey: authKey },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    if (!res.ok) {
      console.error(`[msg91 sms] ${res.status} ${text}`);
      return { ok: false, reason: `HTTP ${res.status}: ${text}` };
    }
    console.log(`[msg91 sms] sent to ${to}`);
    return { ok: true };
  } catch (err: any) {
    console.error(`[msg91 sms] error`, err?.message || err);
    return { ok: false, reason: err?.message || "fetch failed" };
  }
}

type WhatsAppParams = {
  mobile: string;
  templateName?: string;
  bodyVariables: string[];
};

export async function sendWhatsApp({ mobile, templateName, bodyVariables }: WhatsAppParams): Promise<{ ok: boolean; reason?: string }> {
  const authKey = getAuthKey();
  if (!authKey) return { ok: false, reason: "MSG91_AUTH_KEY not configured" };
  const integratedNumber = process.env.MSG91_WHATSAPP_INTEGRATED_NUMBER?.trim();
  if (!integratedNumber) return { ok: false, reason: "MSG91_WHATSAPP_INTEGRATED_NUMBER not configured" };
  const tplName = (templateName || process.env.MSG91_WHATSAPP_TEMPLATE_NAME || "").trim();
  if (!tplName) return { ok: false, reason: "MSG91_WHATSAPP_TEMPLATE_NAME not configured" };
  const tplLang = (process.env.MSG91_WHATSAPP_TEMPLATE_LANG || "en").trim();
  const to = normalizeMobile(mobile);
  if (!to) return { ok: false, reason: "Invalid mobile number" };

  const body = {
    integrated_number: integratedNumber,
    content_type: "template",
    payload: {
      messaging_product: "whatsapp",
      type: "template",
      template: {
        name: tplName,
        language: { code: tplLang, policy: "deterministic" },
        namespace: process.env.MSG91_WHATSAPP_TEMPLATE_NAMESPACE || null,
        to_and_components: [
          {
            to: [to],
            components: {
              body_1: { type: "text", value: bodyVariables[0] ?? "" },
              body_2: { type: "text", value: bodyVariables[1] ?? "" },
              body_3: { type: "text", value: bodyVariables[2] ?? "" },
              body_4: { type: "text", value: bodyVariables[3] ?? "" },
              body_5: { type: "text", value: bodyVariables[4] ?? "" },
            },
          },
        ],
      },
    },
  };

  try {
    const res = await fetch(`${MSG91_BASE}/v5/whatsapp/whatsapp-outbound-message/bulk/`, {
      method: "POST",
      headers: { "Content-Type": "application/json", authkey: authKey },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    if (!res.ok) {
      console.error(`[msg91 wa] ${res.status} ${text}`);
      return { ok: false, reason: `HTTP ${res.status}: ${text}` };
    }
    console.log(`[msg91 wa] sent to ${to}`);
    return { ok: true };
  } catch (err: any) {
    console.error(`[msg91 wa] error`, err?.message || err);
    return { ok: false, reason: err?.message || "fetch failed" };
  }
}

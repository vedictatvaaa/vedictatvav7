import nodemailer, { type Transporter } from "nodemailer";
import sgMail from "@sendgrid/mail";
import type { Order } from "@shared/schema";

// ---- From identities ----
// Two senders are supported so customer-facing transactional mail can come
// from a customer-friendly mailbox (ecom@) while admin/internal alerts come
// from the admin mailbox (admin@). Hostinger requires the SMTP login to
// match the From address, so each identity has its own transport.
const fromName = process.env.MAIL_FROM_NAME || "Vedic Tatva";
const siteUrl = (process.env.PUBLIC_SITE_URL || "https://vedictatva.com").replace(/\/$/, "");
const adminNotificationEmail = process.env.ADMIN_NOTIFICATION_EMAIL || process.env.SMTP_USER || "admin@vedictatva.com";

// ---- Transport selection ----
// Preferred: SMTP (e.g. Hostinger). Fallback: SendGrid via SENDGRID_API_KEY.
// If neither is set we just log the message — useful for local dev.
type SmtpKind = "admin" | "customer";

const smtpHost = process.env.SMTP_HOST;
const smtpPort = Number(process.env.SMTP_PORT || 465);
const smtpSecure = process.env.SMTP_SECURE
  ? process.env.SMTP_SECURE === "true"
  : smtpPort === 465;
const sendgridKey = process.env.SENDGRID_API_KEY;

// Admin mailbox (alerts to internal team, admin password reset).
const adminUser = process.env.SMTP_USER;
const adminPass = process.env.SMTP_PASS;
const adminFrom = process.env.MAIL_FROM || adminUser || "admin@vedictatva.com";

// Customer mailbox (order confirmations, dispatch updates, welcome, etc.).
const ecomUser = process.env.ECOM_SMTP_USER;
const ecomPass = process.env.ECOM_SMTP_PASS;
const ecomFrom = process.env.ECOM_MAIL_FROM || ecomUser || "ecom@vedictatva.com";

const transporters: Partial<Record<SmtpKind, Transporter>> = {};

if (smtpHost && adminUser && adminPass) {
  transporters.admin = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: { user: adminUser, pass: adminPass },
  });
  console.log(`[email] Admin SMTP ${smtpHost}:${smtpPort} as ${adminUser}`);
}

if (smtpHost && ecomUser && ecomPass) {
  transporters.customer = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: { user: ecomUser, pass: ecomPass },
  });
  console.log(`[email] Customer SMTP ${smtpHost}:${smtpPort} as ${ecomUser}`);
}

const sendgridConfigured = !transporters.admin && !transporters.customer && !!sendgridKey;
if (sendgridConfigured) {
  sgMail.setApiKey(sendgridKey!);
  console.log("[email] Using SendGrid fallback transport.");
} else if (!transporters.admin && !transporters.customer) {
  console.warn("[email] No SMTP credentials and no SENDGRID_API_KEY — outgoing emails will be logged instead of sent.");
}

function pickIdentity(kind: SmtpKind): { transporter: Transporter | null; from: string; user: string } {
  if (kind === "customer") {
    if (transporters.customer) return { transporter: transporters.customer, from: ecomFrom, user: ecomUser! };
    // Fallback: if no customer mailbox is configured, send from the admin
    // mailbox so messages still go out (better than dropping them).
    if (transporters.admin) return { transporter: transporters.admin, from: adminFrom, user: adminUser! };
  } else {
    if (transporters.admin) return { transporter: transporters.admin, from: adminFrom, user: adminUser! };
    if (transporters.customer) return { transporter: transporters.customer, from: ecomFrom, user: ecomUser! };
  }
  return { transporter: null, from: kind === "customer" ? ecomFrom : adminFrom, user: "" };
}

export interface EmailAttachment {
  filename: string;
  content: string; // base64-encoded
  type?: string;   // e.g. "application/pdf"
  disposition?: string; // "attachment" | "inline"
}

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
  attachments?: EmailAttachment[];
  /** Optional extra MIME headers (e.g. List-Unsubscribe for marketing). */
  headers?: Record<string, string>;
}

// Cheap HTML→plain-text fallback used when a caller forgets to supply a
// text body. Keeps a multipart message even if the HTML is rich, which
// improves spam scores at Gmail/Outlook.
function htmlToPlain(html: string): string {
  return String(html || "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<br\s*\/?>(\s*)/gi, "\n")
    .replace(/<\/(p|div|tr|li|h[1-6])>/gi, "\n")
    .replace(/<li[^>]*>/gi, "  • ")
    .replace(/<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, "$2 ($1)")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
    .replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n")
    .trim();
}

export type SendOptions = { kind?: SmtpKind };

export async function sendEmail(msg: EmailMessage, opts: SendOptions = {}): Promise<{ sent: boolean; error?: string }> {
  if (!msg.to) return { sent: false, error: "missing recipient" };
  const kind: SmtpKind = opts.kind || "customer";
  const { transporter, from } = pickIdentity(kind);

  if (!transporter && !sendgridConfigured) {
    const attachInfo = msg.attachments?.length ? ` [${msg.attachments.length} attachment(s): ${msg.attachments.map(a => a.filename).join(", ")}]` : "";
    console.log(`[email:dev kind=${kind}] To: ${msg.to}\nSubject: ${msg.subject}${attachInfo}\n${msg.text}\n`);
    return { sent: false, error: "no email transport configured" };
  }

  // All replies (regardless of which mailbox sent the message) should land
  // in the customer-facing inbox so a human reads them.
  const replyTo = process.env.ECOM_SMTP_USER || "ecom@vedictatva.com";
  const text = msg.text && msg.text.trim().length ? msg.text : htmlToPlain(msg.html);

  try {
    if (transporter) {
      await transporter.sendMail({
        from: { name: fromName, address: from },
        to: msg.to,
        replyTo,
        subject: msg.subject,
        text,
        html: msg.html,
        ...(msg.headers ? { headers: msg.headers } : {}),
        ...(msg.attachments?.length ? {
          attachments: msg.attachments.map(a => ({
            filename: a.filename,
            content: Buffer.from(a.content, "base64"),
            contentType: a.type || "application/octet-stream",
            contentDisposition: (a.disposition as "attachment" | "inline" | undefined) || "attachment",
          })),
        } : {}),
      });
      return { sent: true };
    }

    // SendGrid fallback (only used when no SMTP transport at all).
    await sgMail.send({
      to: msg.to,
      from: { email: from, name: fromName },
      replyTo,
      subject: msg.subject,
      text,
      html: msg.html,
      ...(msg.headers ? { headers: msg.headers } : {}),
      ...(msg.attachments?.length ? {
        attachments: msg.attachments.map(a => ({
          content: a.content,
          filename: a.filename,
          type: a.type || "application/octet-stream",
          disposition: a.disposition || "attachment",
        })),
      } : {}),
    });
    return { sent: true };
  } catch (err: any) {
    const detail = err?.response?.body || err?.message || String(err);
    console.error(`[email kind=${kind}] Send failed:`, detail);
    return { sent: false, error: typeof detail === "string" ? detail : JSON.stringify(detail) };
  }
}

// Fire-and-forget: route handlers should never wait on email I/O.
export function sendEmailAsync(msg: EmailMessage, context = "email", opts: SendOptions = {}): void {
  sendEmail(msg, opts).then((r) => {
    if (!r.sent && r.error && r.error !== "no email transport configured") {
      console.error(`[${context}] send failed:`, r.error);
    }
  }).catch((e) => console.error(`[${context}] send threw:`, e?.message || e));
}

export function getAdminNotificationEmail(): string {
  return adminNotificationEmail;
}

const escapeHtml = (s: string) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const inr = (n: number) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

const DEFAULT_FOOTER = `You're receiving this email because you have an account or recent activity on Vedic Tatva.<br/>Questions? Reply to this email or write to <a href="mailto:ecom@vedictatva.com" style="color:#6D2B35;text-decoration:none;">ecom@vedictatva.com</a> &nbsp;·&nbsp; Call <a href="tel:+918447844702" style="color:#6D2B35;text-decoration:none;">8447-8447-02</a>`;

const PANDIT_FOOTER = `You are receiving this email because you applied to join Vedic Tatva as a pandit.<br/>If you have questions, reply to this email or contact us at <a href="mailto:ecom@vedictatva.com" style="color:#6D2B35;text-decoration:none;">ecom@vedictatva.com</a> or call <a href="tel:+918447844702" style="color:#6D2B35;text-decoration:none;">8447-8447-02</a>.`;

function wrapHtml(title: string, bodyHtml: string, footerHtml: string = DEFAULT_FOOTER): string {
  // Branded transactional template — Vedic Tatva colors
  // bg #FBF7EE, maroon #6D2B35, gold #D4AF37
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:#FBF7EE;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:#2B1115;-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:#FBF7EE;">${escapeHtml(title)} — Vedic Tatva</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#FBF7EE;padding:28px 12px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#FFFFFF;border-radius:6px;overflow:hidden;border:1px solid #EAD9B7;box-shadow:0 1px 2px rgba(45,17,21,0.04);">
        <tr><td style="background:#6D2B35;padding:22px 28px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="color:#FBF7EE;font-size:20px;font-weight:700;letter-spacing:0.4px;font-family:Georgia,'Times New Roman',serif;">Vedic Tatva</td>
              <td align="right" style="color:#D4AF37;font-size:11px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;">Sanatan Dharma</td>
            </tr>
          </table>
        </td></tr>
        <tr><td style="height:3px;background:#D4AF37;line-height:3px;font-size:0;">&nbsp;</td></tr>
        <tr><td style="padding:30px 32px 8px;">
          <h1 style="margin:0 0 18px;font-size:22px;line-height:1.3;color:#2B1115;font-family:Georgia,'Times New Roman',serif;font-weight:600;">${escapeHtml(title)}</h1>
        </td></tr>
        <tr><td style="padding:0 32px 28px;">
          ${bodyHtml}
        </td></tr>
        <tr><td style="padding:18px 32px 22px;background:#FBF7EE;border-top:1px solid #EAD9B7;">
          <p style="margin:0 0 8px;font-size:12px;color:#6B5856;line-height:1.6;">
            ${footerHtml}
          </p>
          <p style="margin:10px 0 0;font-size:11px;color:#9A8A87;line-height:1.5;">
            Vedic Tatva &nbsp;·&nbsp; Authentic Puja Samagri, Verified Pandits &amp; Vedic Astrology<br/>
            <a href="${siteUrl}" style="color:#6D2B35;text-decoration:none;">vedictatva.com</a>
          </p>
        </td></tr>
      </table>
      <p style="margin:16px 0 0;font-size:11px;color:#9A8A87;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
        &copy; ${new Date().getFullYear()} Vedic Tatva. All rights reserved.
      </p>
    </td></tr>
  </table>
</body>
</html>`;
}

export function buildPanditApprovalEmail(params: {
  to: string;
  fullName: string;
  city: string;
  adminNote?: string | null;
}): EmailMessage {
  const greeting = params.fullName ? `Namaste ${params.fullName} ji,` : "Namaste,";
  const noteBlock = params.adminNote
    ? `\n\nMessage from our team:\n${params.adminNote}\n`
    : "";
  const dashboardUrl = `${siteUrl}/pandit-directory`;
  const text = `${greeting}

Congratulations! Your application to join Vedic Tatva as a verified pandit has been approved. Your profile is now live in our pandit directory${params.city ? ` for ${params.city}` : ""} and devotees can begin booking you for pujas and ceremonies.

Next steps:
- Visit your public listing: ${dashboardUrl}
- Keep your phone reachable — we'll forward booking requests to you
- Reply to this email if you'd like to update your photo, bio, or fees${noteBlock}

Welcome to the Vedic Tatva family.

— Vedic Tatva Team`;
  const html = wrapHtml("Your pandit application has been approved", `
    <p style="margin:0 0 12px;font-size:15px;">${escapeHtml(greeting)}</p>
    <p style="margin:0 0 12px;font-size:15px;line-height:1.55;">
      Congratulations! Your application to join Vedic Tatva as a verified pandit has been
      <strong>approved</strong>. Your profile is now live in our pandit directory${params.city ? ` for <strong>${escapeHtml(params.city)}</strong>` : ""}
      and devotees can begin booking you for pujas and ceremonies.
    </p>
    <p style="margin:0 0 8px;font-size:15px;font-weight:600;">Next steps</p>
    <ul style="margin:0 0 16px 18px;padding:0;font-size:14px;line-height:1.6;">
      <li>View your public listing in the pandit directory</li>
      <li>Keep your phone reachable — we will forward booking requests to you</li>
      <li>Reply to this email to update your photo, bio, or fees</li>
    </ul>
    <p style="margin:16px 0 24px;">
      <a href="${dashboardUrl}" style="display:inline-block;background:#7a1f1f;color:#fff;text-decoration:none;padding:10px 18px;border-radius:6px;font-size:14px;font-weight:600;">Open pandit directory</a>
    </p>
    ${params.adminNote ? `<div style="margin:0 0 16px;padding:12px 14px;background:#faf7f0;border:1px solid #ece7da;border-radius:6px;font-size:14px;line-height:1.55;">
      <strong>Message from our team:</strong><br/>${escapeHtml(params.adminNote)}
    </div>` : ""}
    <p style="margin:8px 0 0;font-size:14px;">Welcome to the Vedic Tatva family.</p>
    <p style="margin:4px 0 0;font-size:14px;color:#6b6b6b;">— Vedic Tatva Team</p>
  `, PANDIT_FOOTER);
  return { to: params.to, subject: "Your Vedic Tatva pandit application has been approved", text, html };
}

export function buildBookingNotificationEmail(params: {
  to: string;
  panditName: string;
  pujaName: string;
  pujaDate: string;
  timeSlot: string;
  mode: string;
  customerName: string;
  customerPhone: string;
  location?: string | null;
}): EmailMessage {
  const greeting = params.panditName ? `Namaste ${params.panditName} ji,` : "Namaste,";
  const modeLabel = params.mode === "online" ? "Online (video call)" : "Offline (in-person)";
  const locationLine = params.location ? `\nLocation: ${params.location}` : "";
  const text = `${greeting}

You have a new puja booking on Vedic Tatva.

Puja: ${params.pujaName}
Date: ${params.pujaDate}
Time slot: ${params.timeSlot}
Mode: ${modeLabel}${locationLine}

Yajman (customer) details:
Name: ${params.customerName}
Mobile: ${params.customerPhone}

Please contact the yajman at the earliest to confirm the booking and discuss samagri / arrangements.

— Vedic Tatva Team`;
  const html = wrapHtml("New puja booking assigned to you", `
    <p style="margin:0 0 12px;font-size:15px;">${escapeHtml(greeting)}</p>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.55;">
      You have a <strong>new puja booking</strong> on Vedic Tatva. Please contact the yajman at the earliest to confirm.
    </p>
    <table cellpadding="6" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:14px;margin:0 0 16px;border:1px solid #ece7da;border-radius:6px;overflow:hidden;">
      <tr style="background:#faf7f0;"><td style="width:140px;color:#6b6b6b;">Puja</td><td style="font-weight:600;">${escapeHtml(params.pujaName)}</td></tr>
      <tr><td style="color:#6b6b6b;">Date</td><td>${escapeHtml(params.pujaDate)}</td></tr>
      <tr style="background:#faf7f0;"><td style="color:#6b6b6b;">Time slot</td><td>${escapeHtml(params.timeSlot)}</td></tr>
      <tr><td style="color:#6b6b6b;">Mode</td><td>${escapeHtml(modeLabel)}</td></tr>
      ${params.location ? `<tr style="background:#faf7f0;"><td style="color:#6b6b6b;">Location</td><td>${escapeHtml(params.location)}</td></tr>` : ""}
    </table>
    <p style="margin:0 0 6px;font-size:14px;font-weight:600;">Yajman details</p>
    <table cellpadding="6" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:14px;margin:0 0 16px;border:1px solid #ece7da;border-radius:6px;overflow:hidden;">
      <tr style="background:#faf7f0;"><td style="width:140px;color:#6b6b6b;">Name</td><td style="font-weight:600;">${escapeHtml(params.customerName)}</td></tr>
      <tr><td style="color:#6b6b6b;">Mobile</td><td><a href="tel:${escapeHtml(params.customerPhone)}" style="color:#7a1f1f;text-decoration:none;font-weight:600;">${escapeHtml(params.customerPhone)}</a></td></tr>
    </table>
    <p style="margin:8px 0 0;font-size:13px;color:#6b6b6b;">— Vedic Tatva Team</p>
  `, PANDIT_FOOTER);
  return { to: params.to, subject: `New puja booking: ${params.pujaName} on ${params.pujaDate}`, text, html };
}

export function buildPanditPayoutEmail(params: {
  to: string;
  fullName: string;
  amountInr: number;
  method: string;
  reference?: string | null;
  referralCount: number;
  paidAt: Date;
  reversed?: boolean;
  reverseReason?: string | null;
}): EmailMessage {
  const greeting = params.fullName ? `Namaste ${params.fullName} ji,` : "Namaste,";
  const amount = inr(params.amountInr);
  const dateStr = params.paidAt.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  const methodLabel = params.method === "upi" ? "UPI" : params.method === "bank" ? "Bank transfer" : params.method === "cash" ? "Cash" : "Other";
  if (params.reversed) {
    const reasonText = params.reverseReason && params.reverseReason.trim()
      ? `\n\nReason: ${params.reverseReason}\n` : "";
    const text = `${greeting}\n\nA payout of ${amount} settled on ${dateStr} has been REVERSED on Vedic Tatva.${reasonText}\n\nThe ${params.referralCount} referral commission${params.referralCount === 1 ? "" : "s"} settled by this payout have been moved back to "approved" and will be paid out again in the next batch. If you believe this is a mistake, please reply to this email.\n\n— Vedic Tatva Team`;
    const html = wrapHtml("Payout reversed", `
      <p style="margin:0 0 12px;font-size:15px;">${escapeHtml(greeting)}</p>
      <p style="margin:0 0 12px;font-size:15px;line-height:1.55;">
        A payout of <strong>${amount}</strong> settled on <strong>${escapeHtml(dateStr)}</strong> has been
        <strong style="color:#7a1f1f;">reversed</strong> on Vedic Tatva.
      </p>
      ${params.reverseReason && params.reverseReason.trim() ? `<div style="margin:0 0 16px;padding:12px 14px;background:#faf7f0;border:1px solid #ece7da;border-radius:6px;font-size:14px;line-height:1.55;">
        <strong>Reason:</strong><br/>${escapeHtml(params.reverseReason)}
      </div>` : ""}
      <p style="margin:0 0 12px;font-size:14px;line-height:1.55;">
        The <strong>${params.referralCount}</strong> referral commission${params.referralCount === 1 ? "" : "s"} settled by this payout have been moved back to "approved" and will be paid out again in the next batch.
      </p>
      <p style="margin:8px 0 0;font-size:13px;color:#6b6b6b;">If you believe this is a mistake, please reply to this email.</p>
      <p style="margin:4px 0 0;font-size:13px;color:#6b6b6b;">— Vedic Tatva Team</p>
    `, PANDIT_FOOTER);
    return { to: params.to, subject: `Vedic Tatva: payout of ${amount} reversed`, text, html };
  }
  const refLine = params.reference ? `\nReference: ${params.reference}` : "";
  const text = `${greeting}\n\nGood news — a payout of ${amount} has been sent to you.\n\nDate: ${dateStr}\nMethod: ${methodLabel}${refLine}\nReferrals settled: ${params.referralCount}\n\nIf you don't see the credit in 24 hours, please reply to this email with your latest UPI / bank details and we'll re-check.\n\nDhanyavaad for partnering with Vedic Tatva.\n\n— Vedic Tatva Team`;
  const html = wrapHtml("Your payout has been sent", `
    <p style="margin:0 0 12px;font-size:15px;">${escapeHtml(greeting)}</p>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.55;">
      Good news — a payout of <strong style="color:#6D2B35;">${amount}</strong> has been sent to you.
    </p>
    <table cellpadding="6" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:14px;margin:0 0 16px;border:1px solid #ece7da;border-radius:6px;overflow:hidden;">
      <tr style="background:#faf7f0;"><td style="width:160px;color:#6b6b6b;">Amount</td><td style="font-weight:700;color:#6D2B35;">${amount}</td></tr>
      <tr><td style="color:#6b6b6b;">Date</td><td>${escapeHtml(dateStr)}</td></tr>
      <tr style="background:#faf7f0;"><td style="color:#6b6b6b;">Method</td><td>${escapeHtml(methodLabel)}</td></tr>
      ${params.reference ? `<tr><td style="color:#6b6b6b;">Reference</td><td><code style="font-family:monospace;">${escapeHtml(params.reference)}</code></td></tr>` : ""}
      <tr style="background:#faf7f0;"><td style="color:#6b6b6b;">Referrals settled</td><td>${params.referralCount}</td></tr>
    </table>
    <p style="margin:0 0 12px;font-size:13px;color:#6b6b6b;line-height:1.55;">If you don't see the credit in 24 hours, please reply to this email with your latest UPI / bank details and we'll re-check.</p>
    <p style="margin:8px 0 0;font-size:14px;">Dhanyavaad for partnering with Vedic Tatva.</p>
    <p style="margin:4px 0 0;font-size:14px;color:#6b6b6b;">— Vedic Tatva Team</p>
  `, PANDIT_FOOTER);
  return { to: params.to, subject: `Vedic Tatva: payout of ${amount} sent`, text, html };
}

export function buildPanditRejectionEmail(params: {
  to: string;
  fullName: string;
  adminNote?: string | null;
}): EmailMessage {
  const greeting = params.fullName ? `Namaste ${params.fullName} ji,` : "Namaste,";
  const reasonText = params.adminNote && params.adminNote.trim()
    ? `\n\nReason shared by our review team:\n${params.adminNote}\n`
    : "";
  const text = `${greeting}

Thank you for applying to join Vedic Tatva as a pandit. After careful review, we are unable to approve your application at this time.${reasonText}

You are welcome to reapply in the future once any of the points above have been addressed. If you believe this was a mistake or would like more details, simply reply to this email and our team will get back to you.

We deeply appreciate the time you took to apply, and we wish you continued success on your spiritual journey.

— Vedic Tatva Team`;
  const html = wrapHtml("Update on your pandit application", `
    <p style="margin:0 0 12px;font-size:15px;">${escapeHtml(greeting)}</p>
    <p style="margin:0 0 12px;font-size:15px;line-height:1.55;">
      Thank you for applying to join Vedic Tatva as a pandit. After careful review, we are
      unable to approve your application at this time.
    </p>
    ${params.adminNote && params.adminNote.trim() ? `<div style="margin:0 0 16px;padding:12px 14px;background:#faf7f0;border:1px solid #ece7da;border-radius:6px;font-size:14px;line-height:1.55;">
      <strong>Reason shared by our review team:</strong><br/>${escapeHtml(params.adminNote)}
    </div>` : ""}
    <p style="margin:0 0 12px;font-size:14px;line-height:1.55;">
      You are welcome to reapply in the future once any of the points above have been addressed.
      If you believe this was a mistake or would like more details, simply reply to this email
      and our team will get back to you.
    </p>
    <p style="margin:16px 0 0;font-size:14px;">We deeply appreciate the time you took to apply, and we wish you continued success on your spiritual journey.</p>
    <p style="margin:4px 0 0;font-size:14px;color:#6b6b6b;">— Vedic Tatva Team</p>
  `, PANDIT_FOOTER);
  return { to: params.to, subject: "Update on your Vedic Tatva pandit application", text, html };
}

const TIER_LABELS: Record<string, string> = {
  silver: "Silver",
  gold: "Gold",
  guru_elite: "Guru Elite",
  platinum: "Guru Elite",
};

export function buildPanditMembershipExpiringEmail(params: {
  to: string;
  panditName: string;
  tier: string;
  expiresAt: Date;
  stage: "14d" | "3d" | "expired";
  priceInr: number;
}): EmailMessage {
  const tierLabel = TIER_LABELS[params.tier.toLowerCase()] || params.tier;
  const dateStr = params.expiresAt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  const renewUrl = `${siteUrl}/pandit-portal?tab=membership`;
  const greeting = params.panditName ? `Namaste ${params.panditName} ji,` : "Namaste,";

  const headlineByStage: Record<typeof params.stage, string> = {
    "14d": `Your ${tierLabel} membership expires in 14 days`,
    "3d":  `Final reminder: ${tierLabel} membership expires in 3 days`,
    "expired": `Your ${tierLabel} membership has expired`,
  };
  const subject = `${headlineByStage[params.stage]} — Vedic Tatva`;

  const bodyByStage: Record<typeof params.stage, string> = {
    "14d": `Your <strong>${escapeHtml(tierLabel)}</strong> membership ends on <strong>${escapeHtml(dateStr)}</strong>. Renew now to keep your full visibility, festival boosts, and affiliate commission rate without any interruption.`,
    "3d":  `This is a final reminder — your <strong>${escapeHtml(tierLabel)}</strong> membership lapses on <strong>${escapeHtml(dateStr)}</strong>. After that, your profile will only show to devotees within 20 km and your affiliate commission will reset to 0%. Renew today to avoid the gap.`,
    "expired": `Your <strong>${escapeHtml(tierLabel)}</strong> plan lapsed on <strong>${escapeHtml(dateStr)}</strong>. Your profile is now showing only to devotees within 20 km and you are not earning affiliate commission. Renew below to restore full visibility immediately.`,
  };

  const text = `${greeting}

${headlineByStage[params.stage]}.

${bodyByStage[params.stage].replace(/<[^>]+>/g, "")}

Renew here: ${renewUrl}
Renewal price: ${inr(params.priceInr)} for 1 year.

— Vedic Tatva Team`;

  const html = wrapHtml(headlineByStage[params.stage], `
    <p style="margin:0 0 12px;font-size:15px;">${escapeHtml(greeting)}</p>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.55;">${bodyByStage[params.stage]}</p>
    <table cellpadding="6" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:14px;margin:0 0 16px;border:1px solid #ece7da;border-radius:6px;overflow:hidden;">
      <tr style="background:#faf7f0;"><td style="width:160px;color:#6b6b6b;">Current plan</td><td style="font-weight:600;">${escapeHtml(tierLabel)}</td></tr>
      <tr><td style="color:#6b6b6b;">Expires on</td><td style="font-weight:600;">${escapeHtml(dateStr)}</td></tr>
      <tr style="background:#faf7f0;"><td style="color:#6b6b6b;">Renewal price</td><td style="font-weight:600;">${inr(params.priceInr)} for 1 year</td></tr>
    </table>
    <p style="margin:16px 0 24px;">
      <a href="${renewUrl}" style="display:inline-block;background:#6D2B35;color:#FFFAEC;text-decoration:none;padding:12px 22px;border-radius:6px;font-size:14px;font-weight:700;">Renew ${escapeHtml(tierLabel)} membership</a>
    </p>
    <p style="margin:8px 0 0;font-size:13px;color:#6b6b6b;">— Vedic Tatva Team</p>
  `, PANDIT_FOOTER);

  return { to: params.to, subject, text, html };
}

export function buildPasswordResetEmail(params: {
  to: string;
  name?: string | null;
  resetUrl: string;
  expiresInMinutes: number;
}): EmailMessage {
  const greeting = params.name ? `Namaste ${params.name} ji,` : "Namaste,";
  const text = `${greeting}

We received a request to reset your Vedic Tatva password.

Click the link below to choose a new password (the link expires in ${params.expiresInMinutes} minutes):
${params.resetUrl}

If you did not request this, you can safely ignore this email — your password will remain unchanged.

— Vedic Tatva Team`;
  const html = wrapHtml("Reset your Vedic Tatva password", `
    <p style="margin:0 0 12px;font-size:15px;">${escapeHtml(greeting)}</p>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.55;">
      We received a request to reset your Vedic Tatva password. Click the button below to choose a new one.
      This link will expire in <strong>${params.expiresInMinutes} minutes</strong>.
    </p>
    <p style="margin:18px 0;text-align:center;">
      <a href="${params.resetUrl}" style="display:inline-block;background:#7a1f1f;color:#fff;padding:12px 22px;border-radius:6px;text-decoration:none;font-weight:600;font-size:15px;">Reset my password</a>
    </p>
    <p style="margin:0 0 8px;font-size:13px;color:#6b6b6b;line-height:1.55;">
      If the button doesn't work, copy and paste this link into your browser:<br/>
      <a href="${params.resetUrl}" style="color:#7a1f1f;word-break:break-all;">${escapeHtml(params.resetUrl)}</a>
    </p>
    <p style="margin:14px 0 0;font-size:13px;color:#6b6b6b;line-height:1.55;">
      If you did not request a password reset, you can safely ignore this email — your password will remain unchanged.
    </p>
    <p style="margin:8px 0 0;font-size:13px;color:#6b6b6b;">— Vedic Tatva Team</p>
  `);
  return { to: params.to, subject: "Reset your Vedic Tatva password", text, html };
}

export function buildAdminLoginOtpEmail(params: {
  to: string;
  code: string;
  expiresInMinutes: number;
  ip?: string;
}): EmailMessage {
  const subject = "Your Vedic Tatva admin login code";
  const text = `Namaste,

Your Vedic Tatva admin login code is: ${params.code}

It expires in ${params.expiresInMinutes} minutes and can be used once. ${params.ip ? `Requested from IP ${params.ip}. ` : ""}If this wasn't you, ignore this email and consider rotating your admin password.

— Vedic Tatva Security`;
  const html = wrapHtml(subject, `
    <p style="margin:0 0 12px;font-size:15px;">Namaste,</p>
    <p style="margin:0 0 14px;font-size:15px;line-height:1.55;">
      Use this code to finish signing in to the Vedic Tatva admin panel:
    </p>
    <p style="margin:18px 0;text-align:center;">
      <span style="display:inline-block;background:#f7f1e8;color:#7a1f1f;padding:14px 26px;border-radius:6px;font-weight:700;font-size:28px;letter-spacing:8px;font-family:Menlo,Consolas,monospace;">${escapeHtml(params.code)}</span>
    </p>
    <p style="margin:0 0 8px;font-size:13px;color:#6b6b6b;line-height:1.55;">
      Expires in <strong>${params.expiresInMinutes} minutes</strong>. Single-use.${params.ip ? ` Requested from IP <code>${escapeHtml(params.ip)}</code>.` : ""}
    </p>
    <p style="margin:14px 0 0;font-size:13px;color:#6b6b6b;line-height:1.55;">
      Did not try to sign in? Ignore this email and rotate your admin password from Security &rarr; Change Password.
    </p>
    <p style="margin:8px 0 0;font-size:13px;color:#6b6b6b;">— Vedic Tatva Security</p>
  `);
  return { to: params.to, subject, text, html };
}

// ---- Welcome email (account creation) ----
export function buildWelcomeEmail(params: {
  to: string;
  name?: string | null;
  city?: string | null;
}): EmailMessage {
  const greeting = params.name ? `Namaste ${params.name} ji,` : "Namaste,";
  const dashboardUrl = `${siteUrl}/my-profile`;
  const shopUrl = `${siteUrl}/puja-samagri-online`;
  const panditsUrl = `${siteUrl}/book-pandit-online`;
  const text = `${greeting}

Welcome to Vedic Tatva — India's home for authentic puja samagri, verified pandits, and Vedic astrology.

Here's what you can do right away:
- Shop authentic spiritual essentials: ${shopUrl}
- Book a verified pandit for puja at home or online: ${panditsUrl}
- View your dashboard, orders, and saved items: ${dashboardUrl}

If you ever need help, just reply to this email or write to ecom@vedictatva.com.

Wishing you a blessed spiritual journey,
— Vedic Tatva Team`;
  const html = wrapHtml("Welcome to Vedic Tatva", `
    <p style="margin:0 0 12px;font-size:15px;">${escapeHtml(greeting)}</p>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">
      Welcome to <strong>Vedic Tatva</strong> — your home for authentic puja samagri, verified pandits,
      and Vedic astrology${params.city ? ` in <strong>${escapeHtml(params.city)}</strong>` : ""}.
    </p>
    <p style="margin:0 0 8px;font-size:15px;font-weight:600;">Get started</p>
    <ul style="margin:0 0 16px 18px;padding:0;font-size:14px;line-height:1.7;">
      <li>Shop authentic spiritual essentials</li>
      <li>Book a verified pandit for puja at home or online</li>
      <li>Track your orders and saved items in your dashboard</li>
    </ul>
    <p style="margin:18px 0;text-align:center;">
      <a href="${shopUrl}" style="display:inline-block;background:#7a1f1f;color:#fff;padding:11px 22px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px;margin:4px;">Shop now</a>
      <a href="${panditsUrl}" style="display:inline-block;background:#fff;color:#7a1f1f;border:1px solid #7a1f1f;padding:10px 22px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px;margin:4px;">Book a pandit</a>
    </p>
    <p style="margin:14px 0 0;font-size:13px;color:#6b6b6b;line-height:1.55;">
      Need help getting started? Reply to this email — our team is happy to guide you.
    </p>
    <p style="margin:8px 0 0;font-size:13px;color:#6b6b6b;">— Vedic Tatva Team</p>
  `);
  return { to: params.to, subject: "Welcome to Vedic Tatva", text, html };
}

// ---- Order item rendering helpers ----
type OrderItemLike = { name?: string; productName?: string; quantity?: number; price?: number };

function renderItemsTextLines(items: OrderItemLike[]): string {
  return (items || []).map((i) => {
    const name = i.productName || i.name || "Item";
    const qty = Number(i.quantity || 1);
    const price = Number(i.price || 0);
    return `• ${name} × ${qty} — ${inr(price * qty)}`;
  }).join("\n") || "(items in your order)";
}

function renderItemsTableHtml(items: OrderItemLike[]): string {
  const rows = (items || []).map((i) => {
    const name = escapeHtml(i.productName || i.name || "Item");
    const qty = Number(i.quantity || 1);
    const price = Number(i.price || 0);
    return `<tr>
      <td style="padding:8px 12px;border-bottom:1px solid #ece7da;font-size:14px;">${name}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #ece7da;font-size:14px;text-align:right;color:#6b6b6b;">× ${qty}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #ece7da;font-size:14px;text-align:right;font-weight:600;">${inr(price * qty)}</td>
    </tr>`;
  }).join("");
  return rows || `<tr><td style="padding:12px;font-size:14px;color:#6b6b6b;">(items in your order)</td></tr>`;
}

// ---- Order placed confirmation ----
export function buildOrderPlacedEmail(params: {
  to: string;
  customerName?: string | null;
  orderId: number;
  totalAmount: number;
  items: OrderItemLike[];
  paymentMethod?: string | null;
  shippingAddress?: string | null;
}): EmailMessage {
  const greeting = params.customerName ? `Namaste ${params.customerName} ji,` : "Namaste,";
  const trackUrl = `${siteUrl}/order-confirmation?id=${params.orderId}`;
  const itemsText = renderItemsTextLines(params.items);
  const itemsHtml = renderItemsTableHtml(params.items);
  const text = `${greeting}

Thank you for your order at Vedic Tatva. Your order #${params.orderId} has been received and is being prepared.

Items:
${itemsText}

Total: ${inr(params.totalAmount)}
Payment: ${params.paymentMethod || "—"}
${params.shippingAddress ? `Shipping to:\n${params.shippingAddress}\n` : ""}
Track your order anytime: ${trackUrl}

We'll send you another email as soon as it's dispatched.

— Vedic Tatva Team`;

  const html = wrapHtml(`Order #${params.orderId} confirmed`, `
    <p style="margin:0 0 12px;font-size:15px;">${escapeHtml(greeting)}</p>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.55;">
      Thank you for your order. We've received it and are preparing your sacred items with care.
    </p>
    <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;border:1px solid #ece7da;border-radius:6px;overflow:hidden;margin:0 0 16px;">
      ${itemsHtml}
      <tr style="background:#faf7f0;">
        <td style="padding:10px 12px;font-size:14px;font-weight:600;">Total</td>
        <td></td>
        <td style="padding:10px 12px;font-size:15px;font-weight:700;text-align:right;color:#7a1f1f;">${inr(params.totalAmount)}</td>
      </tr>
    </table>
    <table cellpadding="6" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:14px;margin:0 0 16px;border:1px solid #ece7da;border-radius:6px;overflow:hidden;">
      <tr style="background:#faf7f0;"><td style="width:140px;color:#6b6b6b;">Order ID</td><td style="font-weight:600;">#${params.orderId}</td></tr>
      <tr><td style="color:#6b6b6b;">Payment</td><td>${escapeHtml(params.paymentMethod || "—")}</td></tr>
      ${params.shippingAddress ? `<tr style="background:#faf7f0;"><td style="color:#6b6b6b;vertical-align:top;">Shipping to</td><td style="line-height:1.5;">${escapeHtml(params.shippingAddress)}</td></tr>` : ""}
    </table>
    <p style="margin:18px 0;text-align:center;">
      <a href="${trackUrl}" style="display:inline-block;background:#7a1f1f;color:#fff;padding:11px 22px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px;">Track my order</a>
    </p>
    <p style="margin:14px 0 0;font-size:13px;color:#6b6b6b;">We'll email you again as soon as your order is dispatched.</p>
    <p style="margin:8px 0 0;font-size:13px;color:#6b6b6b;">— Vedic Tatva Team</p>
  `);
  return { to: params.to, subject: `Order #${params.orderId} confirmed — Vedic Tatva`, text, html };
}

// ---- Order dispatched ----
export function buildOrderDispatchedEmail(params: {
  to: string;
  customerName?: string | null;
  orderId: number;
  courierName?: string | null;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
}): EmailMessage {
  const greeting = params.customerName ? `Namaste ${params.customerName} ji,` : "Namaste,";
  const trackUrl = params.trackingUrl || `${siteUrl}/order-confirmation?id=${params.orderId}`;
  const courierLine = params.courierName ? `Courier: ${params.courierName}` : "";
  const trackingLine = params.trackingNumber ? `Tracking number: ${params.trackingNumber}` : "";
  const text = `${greeting}

Good news — your Vedic Tatva order #${params.orderId} has been dispatched.

${courierLine}
${trackingLine}

Track your shipment: ${trackUrl}

— Vedic Tatva Team`;

  const html = wrapHtml(`Your order #${params.orderId} has been dispatched`, `
    <p style="margin:0 0 12px;font-size:15px;">${escapeHtml(greeting)}</p>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.55;">
      Your order is on its way. Here are the shipment details.
    </p>
    <table cellpadding="6" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:14px;margin:0 0 16px;border:1px solid #ece7da;border-radius:6px;overflow:hidden;">
      <tr style="background:#faf7f0;"><td style="width:140px;color:#6b6b6b;">Order ID</td><td style="font-weight:600;">#${params.orderId}</td></tr>
      ${params.courierName ? `<tr><td style="color:#6b6b6b;">Courier</td><td style="font-weight:600;">${escapeHtml(params.courierName)}</td></tr>` : ""}
      ${params.trackingNumber ? `<tr style="background:#faf7f0;"><td style="color:#6b6b6b;">Tracking #</td><td style="font-family:Menlo,monospace;font-weight:600;">${escapeHtml(params.trackingNumber)}</td></tr>` : ""}
    </table>
    <p style="margin:18px 0;text-align:center;">
      <a href="${trackUrl}" style="display:inline-block;background:#7a1f1f;color:#fff;padding:11px 22px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px;">Track shipment</a>
    </p>
    <p style="margin:14px 0 0;font-size:13px;color:#6b6b6b;">Most orders arrive in 3–7 working days. We'll let you know when it's delivered.</p>
    <p style="margin:8px 0 0;font-size:13px;color:#6b6b6b;">— Vedic Tatva Team</p>
  `);
  return { to: params.to, subject: `Your order #${params.orderId} is on its way`, text, html };
}

// ---- Order delivered ----
export function buildOrderDeliveredEmail(params: {
  to: string;
  customerName?: string | null;
  orderId: number;
}): EmailMessage {
  const greeting = params.customerName ? `Namaste ${params.customerName} ji,` : "Namaste,";
  const reviewUrl = `${siteUrl}/order-confirmation?id=${params.orderId}`;
  const text = `${greeting}

Your Vedic Tatva order #${params.orderId} has been delivered. We hope every item arrived in perfect condition and brings blessings to your home.

If you have a moment, we'd love to hear about your experience: ${reviewUrl}

— Vedic Tatva Team`;

  const html = wrapHtml(`Your order #${params.orderId} has been delivered`, `
    <p style="margin:0 0 12px;font-size:15px;">${escapeHtml(greeting)}</p>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">
      Your order has been delivered. We hope every item arrived in perfect condition and brings blessings to your home.
    </p>
    <p style="margin:18px 0;text-align:center;">
      <a href="${reviewUrl}" style="display:inline-block;background:#7a1f1f;color:#fff;padding:11px 22px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px;">View order</a>
    </p>
    <p style="margin:14px 0 0;font-size:13px;color:#6b6b6b;line-height:1.55;">
      Loved your experience? A quick review on the product page helps fellow devotees discover authentic samagri.
      Need to return or exchange something? Reply to this email and we'll guide you.
    </p>
    <p style="margin:8px 0 0;font-size:13px;color:#6b6b6b;">— Vedic Tatva Team</p>
  `);
  return { to: params.to, subject: `Delivered: your order #${params.orderId}`, text, html };
}

// ---- Order cancelled ----
export function buildOrderCancelledEmail(params: {
  to: string;
  customerName?: string | null;
  orderId: number;
  reason?: string | null;
  refundExpected?: boolean;
}): EmailMessage {
  const greeting = params.customerName ? `Namaste ${params.customerName} ji,` : "Namaste,";
  const reasonText = params.reason && params.reason.trim()
    ? `\nReason: ${params.reason}\n`
    : "";
  const refundLine = params.refundExpected
    ? "If your payment was prepaid, the refund has been initiated and will reflect in your account within 5–7 working days.\n\n"
    : "";
  const text = `${greeting}

Your Vedic Tatva order #${params.orderId} has been cancelled.${reasonText}
${refundLine}If you have any questions, simply reply to this email.

— Vedic Tatva Team`;

  const html = wrapHtml(`Order #${params.orderId} cancelled`, `
    <p style="margin:0 0 12px;font-size:15px;">${escapeHtml(greeting)}</p>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.55;">
      Your order <strong>#${params.orderId}</strong> has been cancelled.
    </p>
    ${params.reason && params.reason.trim() ? `<div style="margin:0 0 16px;padding:12px 14px;background:#faf7f0;border:1px solid #ece7da;border-radius:6px;font-size:14px;line-height:1.55;">
      <strong>Reason:</strong><br/>${escapeHtml(params.reason)}
    </div>` : ""}
    ${params.refundExpected ? `<p style="margin:0 0 12px;font-size:14px;line-height:1.6;">
      If your payment was prepaid, the refund has been initiated and will reflect in your account within
      <strong>5–7 working days</strong>. We'll send a separate email once the refund is processed.
    </p>` : ""}
    <p style="margin:14px 0 0;font-size:13px;color:#6b6b6b;line-height:1.55;">
      Cancelled by mistake or need help? Reply to this email and our team will assist you right away.
    </p>
    <p style="margin:8px 0 0;font-size:13px;color:#6b6b6b;">— Vedic Tatva Team</p>
  `);
  return { to: params.to, subject: `Your order #${params.orderId} has been cancelled`, text, html };
}

// ---- Refund processed ----
export function buildRefundProcessedEmail(params: {
  to: string;
  customerName?: string | null;
  orderId: number;
  refundAmount: number;
  refundId?: string | null;
  paymentMethod?: string | null;
}): EmailMessage {
  const greeting = params.customerName ? `Namaste ${params.customerName} ji,` : "Namaste,";
  const text = `${greeting}

We've processed a refund of ${inr(params.refundAmount)} for your Vedic Tatva order #${params.orderId}.

The amount will reflect in your original payment method within 5–7 working days${params.paymentMethod ? ` (${params.paymentMethod})` : ""}.
${params.refundId ? `Refund reference: ${params.refundId}\n` : ""}
If you don't see it after 7 working days, reply to this email and we'll help you trace it.

— Vedic Tatva Team`;

  const html = wrapHtml(`Refund processed for order #${params.orderId}`, `
    <p style="margin:0 0 12px;font-size:15px;">${escapeHtml(greeting)}</p>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">
      We've processed a refund of <strong style="color:#7a1f1f;">${inr(params.refundAmount)}</strong> for your order <strong>#${params.orderId}</strong>.
    </p>
    <table cellpadding="6" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:14px;margin:0 0 16px;border:1px solid #ece7da;border-radius:6px;overflow:hidden;">
      <tr style="background:#faf7f0;"><td style="width:160px;color:#6b6b6b;">Refund amount</td><td style="font-weight:700;color:#7a1f1f;">${inr(params.refundAmount)}</td></tr>
      <tr><td style="color:#6b6b6b;">Order ID</td><td style="font-weight:600;">#${params.orderId}</td></tr>
      ${params.paymentMethod ? `<tr style="background:#faf7f0;"><td style="color:#6b6b6b;">Original payment</td><td>${escapeHtml(params.paymentMethod)}</td></tr>` : ""}
      ${params.refundId ? `<tr><td style="color:#6b6b6b;">Refund ref</td><td style="font-family:Menlo,monospace;">${escapeHtml(params.refundId)}</td></tr>` : ""}
    </table>
    <p style="margin:0 0 14px;font-size:14px;line-height:1.6;">
      The amount will reflect in your original payment method within <strong>5–7 working days</strong>.
      If you don't see it after that, just reply to this email and we'll help you trace it with your bank.
    </p>
    <p style="margin:8px 0 0;font-size:13px;color:#6b6b6b;">— Vedic Tatva Team</p>
  `);
  return { to: params.to, subject: `Refund of ${inr(params.refundAmount)} processed — order #${params.orderId}`, text, html };
}

// ---- Admin: new order alert ----
// Helper that fires both customer order-placed + admin alert in one call.
// Safe to call from any code path that creates an Order.
export function sendOrderPlacedEmails(
  order: Pick<
    Order,
    "id" | "customerName" | "customerEmail" | "customerPhone" |
    "totalAmount" | "items" | "paymentMethod" | "shippingAddress"
  >,
): void {
  const rawItems = order.items as unknown;
  const items: OrderItemLike[] = Array.isArray(rawItems)
    ? (rawItems as OrderItemLike[])
    : [];
  if (order.customerEmail) {
    sendEmailAsync(buildOrderPlacedEmail({
      to: order.customerEmail,
      customerName: order.customerName,
      orderId: order.id,
      totalAmount: order.totalAmount,
      items,
      paymentMethod: order.paymentMethod,
      shippingAddress: order.shippingAddress,
    }), "order-placed");
  }
  sendEmailAsync(buildAdminNewOrderEmail({
    orderId: order.id,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    customerPhone: order.customerPhone,
    totalAmount: order.totalAmount,
    paymentMethod: order.paymentMethod,
    itemCount: items.length,
    shippingAddress: order.shippingAddress,
  }), "admin-new-order", { kind: "admin" });
}

export function buildAdminNewOrderEmail(params: {
  orderId: number;
  customerName?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  totalAmount: number;
  paymentMethod?: string | null;
  itemCount: number;
  shippingAddress?: string | null;
}): EmailMessage {
  const adminUrl = `${siteUrl}/admin?tab=orders&id=${params.orderId}`;
  const text = `New order received on Vedic Tatva.

Order #${params.orderId}
Total: ${inr(params.totalAmount)}
Items: ${params.itemCount}
Payment: ${params.paymentMethod || "—"}

Customer:
${params.customerName || "—"}
${params.customerEmail || "—"}
${params.customerPhone || "—"}

${params.shippingAddress ? `Ship to:\n${params.shippingAddress}\n\n` : ""}Open in admin: ${adminUrl}`;

  const html = wrapHtml(`New order #${params.orderId} — ${inr(params.totalAmount)}`, `
    <p style="margin:0 0 16px;font-size:15px;line-height:1.55;">
      A new order has just been placed on Vedic Tatva.
    </p>
    <table cellpadding="6" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:14px;margin:0 0 16px;border:1px solid #ece7da;border-radius:6px;overflow:hidden;">
      <tr style="background:#faf7f0;"><td style="width:140px;color:#6b6b6b;">Order ID</td><td style="font-weight:600;">#${params.orderId}</td></tr>
      <tr><td style="color:#6b6b6b;">Total</td><td style="font-weight:700;color:#7a1f1f;">${inr(params.totalAmount)}</td></tr>
      <tr style="background:#faf7f0;"><td style="color:#6b6b6b;">Items</td><td>${params.itemCount}</td></tr>
      <tr><td style="color:#6b6b6b;">Payment</td><td>${escapeHtml(params.paymentMethod || "—")}</td></tr>
    </table>
    <p style="margin:0 0 6px;font-size:14px;font-weight:600;">Customer</p>
    <table cellpadding="6" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:14px;margin:0 0 16px;border:1px solid #ece7da;border-radius:6px;overflow:hidden;">
      <tr style="background:#faf7f0;"><td style="width:140px;color:#6b6b6b;">Name</td><td style="font-weight:600;">${escapeHtml(params.customerName || "—")}</td></tr>
      <tr><td style="color:#6b6b6b;">Email</td><td>${escapeHtml(params.customerEmail || "—")}</td></tr>
      <tr style="background:#faf7f0;"><td style="color:#6b6b6b;">Mobile</td><td>${escapeHtml(params.customerPhone || "—")}</td></tr>
      ${params.shippingAddress ? `<tr><td style="color:#6b6b6b;vertical-align:top;">Ship to</td><td style="line-height:1.5;">${escapeHtml(params.shippingAddress)}</td></tr>` : ""}
    </table>
    <p style="margin:18px 0;text-align:center;">
      <a href="${adminUrl}" style="display:inline-block;background:#7a1f1f;color:#fff;padding:11px 22px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px;">Open in admin</a>
    </p>
  `, "Internal Vedic Tatva admin notification.");
  return { to: getAdminNotificationEmail(), subject: `[VT] New order #${params.orderId} — ${inr(params.totalAmount)}`, text, html };
}

// ---- Abandoned cart recovery ----
// A short, friendly nudge with a link back to the cart and the line items that
// were left behind. Sent manually from the admin or automatically by the
// scheduler in server/index.ts.
export function buildAbandonedCartEmail(params: {
  to: string;
  customerName?: string | null;
  items: Array<{ name?: string; productName?: string; quantity?: number; price?: number }>;
  cartTotal: number;
}): EmailMessage {
  const greeting = params.customerName ? `Namaste ${params.customerName} ji,` : "Namaste,";
  const cartUrl = `${siteUrl}/cart`;
  const lines = (params.items || []).map(i => {
    const name = i.productName || i.name || "Item";
    const qty = Number(i.quantity || 1);
    const price = Number(i.price || 0);
    return `• ${name} × ${qty} — ${inr(price * qty)}`;
  });
  const text = `${greeting}

You left a few sacred items in your Vedic Tatva cart. We have saved them for you:

${lines.join("\n") || "(items in your saved cart)"}

Cart total: ${inr(params.cartTotal)}

Complete your order in one click:
${cartUrl}

If anything was unclear or you need help choosing, just reply to this email — our team is happy to guide you.

— Vedic Tatva Team`;

  const itemsHtml = renderItemsTableHtml(params.items);

  const html = wrapHtml("Your sacred items are waiting", `
    <p style="margin:0 0 12px;font-size:15px;">${escapeHtml(greeting)}</p>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.55;">
      You left a few items in your Vedic Tatva cart. We've kept them safe for you.
    </p>
    <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;border:1px solid #ece7da;border-radius:6px;overflow:hidden;margin:0 0 16px;">
      ${itemsHtml}
      <tr style="background:#faf7f0;">
        <td style="padding:10px 12px;font-size:14px;font-weight:600;">Cart total</td>
        <td></td>
        <td style="padding:10px 12px;font-size:15px;font-weight:700;text-align:right;color:#7a1f1f;">${inr(params.cartTotal)}</td>
      </tr>
    </table>
    <p style="margin:0 0 18px;text-align:center;">
      <a href="${cartUrl}" style="display:inline-block;background:#7a1f1f;color:#fff;padding:12px 22px;border-radius:6px;text-decoration:none;font-weight:600;font-size:15px;">Complete my order</a>
    </p>
    <p style="margin:0 0 8px;font-size:14px;line-height:1.55;">
      If anything was unclear or you need help choosing, just reply to this email — our team is happy to guide you.
    </p>
    <p style="margin:8px 0 0;font-size:13px;color:#6b6b6b;">— Vedic Tatva Team</p>
  `);
  return { to: params.to, subject: "Your sacred items are waiting at Vedic Tatva", text, html };
}

// ---- Post-delivery review request ----
import crypto from "node:crypto";

function reviewSecret(): string {
  const s = process.env.UNSUBSCRIBE_SECRET || process.env.SESSION_SECRET;
  if (s && s.length >= 16) return s;
  if (process.env.NODE_ENV === "production") {
    throw new Error("UNSUBSCRIBE_SECRET (or SESSION_SECRET) must be set to >=16 chars in production");
  }
  if (!_devReviewSecret) _devReviewSecret = crypto.randomBytes(32).toString("hex");
  return _devReviewSecret;
}
let _devReviewSecret: string | null = null;

const REVIEW_TOKEN_TTL_DAYS = 60;

/** HMAC-signed token: base64url(`${orderId}|${emailLower}|${expiryUnixSec}|${sig}`). */
export function signReviewToken(orderId: number, email: string): string {
  const expiry = Math.floor(Date.now() / 1000) + REVIEW_TOKEN_TTL_DAYS * 24 * 60 * 60;
  const payload = `${orderId}|${email.toLowerCase()}|${expiry}`;
  const sig = crypto.createHmac("sha256", reviewSecret()).update(payload).digest("hex").slice(0, 32);
  return Buffer.from(`${payload}|${sig}`).toString("base64url");
}

export function verifyReviewToken(token: string): { orderId: number; email: string } | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const parts = decoded.split("|");
    if (parts.length !== 4) return null;
    const [orderIdStr, email, expiryStr, sig] = parts;
    const orderId = Number(orderIdStr);
    const expiry = Number(expiryStr);
    if (!Number.isFinite(orderId) || !Number.isFinite(expiry)) return null;
    if (Math.floor(Date.now() / 1000) > expiry) return null;
    const expected = crypto.createHmac("sha256", reviewSecret()).update(`${orderId}|${email}|${expiry}`).digest("hex").slice(0, 32);
    if (sig.length !== expected.length) return null;
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
    return { orderId, email };
  } catch { return null; }
}

export function buildReviewRequestEmail(params: {
  to: string;
  customerName?: string | null;
  orderId: number;
  productNames: string[];
  variant?: "first" | "reminder";
}): EmailMessage {
  const greeting = params.customerName ? `Namaste ${params.customerName} ji,` : "Namaste,";
  const token = signReviewToken(params.orderId, params.to);
  const url = `${siteUrl}/reviews/submit?token=${token}`;
  const itemsList = params.productNames.slice(0, 6).map(escapeHtml).join(", ");
  const isReminder = params.variant === "reminder";

  const subject = isReminder
    ? `A gentle reminder — share your review of order #${params.orderId}`
    : `Share your review of order #${params.orderId}`;

  const text = isReminder
    ? `${greeting}

A gentle reminder: we'd still love to hear how your items from order #${params.orderId} are working for you.

Even a few honest lines help fellow devotees choose with confidence. As a verified-purchase reviewer, your words carry real weight.

Share your experience: ${url}

It only takes a minute. Photos welcome. If anything didn't meet expectations, simply reply to this email and we'll make it right.

— Vedic Tatva Team`
    : `${greeting}

We hope your sacred items from order #${params.orderId} are bringing peace and blessings to your home.

If you have a moment, your honest review helps fellow devotees discover authentic samagri. As a verified-purchase reviewer, your words carry real weight.

Share your experience: ${url}

It only takes a minute. Photos welcome.

— Vedic Tatva Team`;

  const heading = isReminder
    ? `A gentle reminder about order #${params.orderId}`
    : `How was your order #${params.orderId}?`;

  const intro = isReminder
    ? `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;">
      A gentle reminder — we'd still love to hear how your items ${itemsList ? `(<em>${itemsList}</em>) ` : ""}are working for you. We won't nudge you again after this.
    </p>`
    : `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;">
      We hope the items from your order ${itemsList ? `(<em>${itemsList}</em>) ` : ""}are bringing peace and blessings to your home.
    </p>`;

  const html = wrapHtml(heading, `
    <p style="margin:0 0 12px;font-size:15px;">${escapeHtml(greeting)}</p>
    ${intro}
    <p style="margin:0 0 18px;font-size:14px;line-height:1.6;color:#3a2a2c;">
      Your honest review helps fellow devotees choose with confidence — and as a verified-purchase reviewer, your words carry real weight.
    </p>
    <p style="margin:22px 0;text-align:center;">
      <a href="${url}" style="display:inline-block;background:#6D2B35;color:#fff;padding:12px 26px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px;">Share your review</a>
    </p>
    <p style="margin:14px 0 0;font-size:13px;color:#6b6b6b;line-height:1.55;">
      Photos welcome. This link is unique to your order and is valid for 60 days. If anything didn't meet expectations, simply reply to this email and we'll make it right.
    </p>
    <p style="margin:8px 0 0;font-size:13px;color:#6b6b6b;">— Vedic Tatva Team</p>
  `);
  return { to: params.to, subject, text, html };
}

export async function sendAbandonedCartNudge(cart: {
  email: string;
  customerName?: string | null;
  items?: any;
  cartTotal: number;
}): Promise<{ sent: boolean; error?: string }> {
  const items = Array.isArray(cart.items) ? cart.items : [];
  const msg = buildAbandonedCartEmail({
    to: cart.email,
    customerName: cart.customerName,
    items,
    cartTotal: cart.cartTotal || 0,
  });
  return sendEmail(msg);
}

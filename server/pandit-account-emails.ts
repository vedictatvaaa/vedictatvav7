import type { EmailMessage } from "./email";

const siteUrl = (process.env.PUBLIC_SITE_URL || "https://vedictatva.com").replace(/\/$/, "");

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
  })[character]!);
}

function layout(title: string, body: string): string {
  return `<!doctype html><html><body style="margin:0;background:#f7f3ea;font-family:Arial,sans-serif;color:#2d2020"><div style="max-width:620px;margin:24px auto;background:#fff;border:1px solid #e7ddc7;border-radius:8px;overflow:hidden"><div style="padding:20px 24px;background:#7a1f1f;color:#fff"><strong>Vedic Tatva</strong></div><div style="padding:24px"><h2 style="margin:0 0 18px;color:#4a1a22">${escapeHtml(title)}</h2>${body}</div><div style="padding:16px 24px;background:#faf7f0;color:#6b6b6b;font-size:12px">Vedic Tatva Panditji Portal</div></div></body></html>`;
}

export function buildPanditApprovalEmail(params: { to: string; fullName: string; city: string; temporaryPassword: string; adminNote?: string | null }): EmailMessage {
  const greeting = params.fullName ? `Namaste ${params.fullName} ji,` : "Namaste,";
  const portalUrl = `${siteUrl}/pandit/login`;
  const directoryUrl = `${siteUrl}/book-pandit-online`;
  const note = params.adminNote ? `\n\nMessage from our team:\n${params.adminNote}` : "";
  const text = `${greeting}\n\nYour verified Pandit application has been approved${params.city ? ` for ${params.city}` : ""}.\n\nTemporary password: ${params.temporaryPassword}\nSign in: ${portalUrl}\n\nYou must create a new password after your first login. Your public listing is available at ${directoryUrl}.${note}\n\n— Vedic Tatva Team`;
  const html = layout("Your Pandit application is approved", `<p>${escapeHtml(greeting)}</p><p>Your verified Pandit profile is now live${params.city ? ` for ${escapeHtml(params.city)}` : ""}.</p><div style="padding:14px;background:#faf7f0;border:1px solid #d9c58d;border-radius:6px"><div style="color:#6b6b6b">Temporary password</div><code style="font-size:17px;font-weight:700">${escapeHtml(params.temporaryPassword)}</code></div><p><a href="${portalUrl}" style="display:inline-block;background:#7a1f1f;color:#fff;text-decoration:none;padding:10px 18px;border-radius:6px">Sign in to Panditji Portal</a></p><p style="font-size:13px;color:#6b6b6b">You must create a new private password after your first login. Do not share this password.</p>${params.adminNote ? `<div style="padding:12px;background:#faf7f0"><strong>Message from our team:</strong><br>${escapeHtml(params.adminNote)}</div>` : ""}`);
  return { to: params.to, subject: "Your Vedic Tatva Pandit application has been approved", text, html };
}

export function buildPanditPasswordResetEmail(params: { to: string; fullName: string; resetUrl: string }): EmailMessage {
  const greeting = params.fullName ? `Namaste ${params.fullName} ji,` : "Namaste,";
  const text = `${greeting}\n\nUse this secure link to reset your Panditji Portal password:\n\n${params.resetUrl}\n\nThe link expires in 7 days and can only be used once. If you did not request it, ignore this email.\n\n— Vedic Tatva Team`;
  const html = layout("Reset your Panditji Portal password", `<p>${escapeHtml(greeting)}</p><p>Use the secure button below to create a new password.</p><p><a href="${escapeHtml(params.resetUrl)}" style="display:inline-block;background:#7a1f1f;color:#fff;text-decoration:none;padding:10px 18px;border-radius:6px">Reset portal password</a></p><p style="font-size:13px;color:#6b6b6b">This link expires in 7 days and can only be used once.</p>`);
  return { to: params.to, subject: "Reset your Vedic Tatva Panditji Portal password", text, html };
}

export function buildPanditTemporaryPasswordEmail(params: { to: string; fullName: string; temporaryPassword: string }): EmailMessage {
  const greeting = params.fullName ? `Namaste ${params.fullName} ji,` : "Namaste,";
  const portalUrl = `${siteUrl}/pandit/login`;
  const text = `${greeting}\n\nA new temporary password has been generated for your Panditji Portal account.\n\nTemporary password: ${params.temporaryPassword}\nSign in: ${portalUrl}\n\nYour previous password and sessions are no longer valid. You must create a new password after signing in.\n\n— Vedic Tatva Team`;
  const html = layout("Your new temporary password", `<p>${escapeHtml(greeting)}</p><div style="padding:14px;background:#faf7f0;border:1px solid #d9c58d;border-radius:6px"><div style="color:#6b6b6b">Temporary password</div><code style="font-size:17px;font-weight:700">${escapeHtml(params.temporaryPassword)}</code></div><p><a href="${portalUrl}" style="display:inline-block;background:#7a1f1f;color:#fff;text-decoration:none;padding:10px 18px;border-radius:6px">Sign in to Panditji Portal</a></p><p style="font-size:13px;color:#6b6b6b">Your previous password and sessions are no longer valid. You must create a new private password after signing in.</p>`);
  return { to: params.to, subject: "Your new Vedic Tatva Panditji Portal temporary password", text, html };
}

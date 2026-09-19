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

export function buildPanditApprovalEmail(params: {
  to: string;
  fullName: string;
  city: string;
  registrationNo: string;
  setupUrl: string;
  storefrontUrl?: string | null;
  storefrontPublished?: boolean;
  adminNote?: string | null;
}): EmailMessage {
  const greeting = params.fullName ? `Namaste ${params.fullName} ji,` : "Namaste,";
  const portalUrl = `${siteUrl}/pandit/login`;
  const directoryUrl = `${siteUrl}/book-pandit-online`;
  const note = params.adminNote ? `\n\nMessage from our team:\n${params.adminNote}` : "";
  const storefrontStatus = params.storefrontPublished && params.storefrontUrl
    ? `Your public storefront: ${params.storefrontUrl}`
    : "Your storefront starts as a draft. Complete and review it in the portal; publication and directory visibility are controlled separately.";
  const text = `${greeting}\n\nYour Vedic Tatva Pandit application has been approved${params.city ? ` for ${params.city}` : ""}.\n\nRegistration number: ${params.registrationNo}\nCreate your private password using this secure one-time link:\n${params.setupUrl}\n\nThe link expires in 7 days. Vedic Tatva will never email or ask you to share your password.\n\nPanditji Portal: ${portalUrl}\nPandit directory: ${directoryUrl}\n${storefrontStatus}\n\nIn your portal you can maintain your public profile, canonical services, pricing, service modes, calendar, booking requests and devotee messages.\n\nDo:\n- Keep profile, services, prices and availability accurate\n- Respond promptly and honour confirmed bookings\n- Protect devotee privacy and use canonical services\n\nDo not:\n- Share login credentials or private devotee information\n- Claim unsupported services or fabricate qualifications, reviews or availability\n- Move protected transactions outside the agreed Vedic Tatva process\n\nWe work as one team: you provide accurate ritual expertise and reliable service; Vedic Tatva provides discovery, storefront, booking and operational tools. Publication and bookings remain subject to profile completeness, verification and platform governance.${note}\n\n— Vedic Tatva Team`;
  const html = layout("Welcome to the Vedic Tatva Panditji network", `<p>${escapeHtml(greeting)}</p><p>Your Vedic Tatva Pandit application has been <strong>approved</strong>${params.city ? ` for ${escapeHtml(params.city)}` : ""}.</p><div style="padding:16px;background:#faf7f0;border:1px solid #d9c58d;border-radius:8px"><div style="font-size:12px;color:#6b6b6b;text-transform:uppercase;letter-spacing:.08em">Lifetime registration number</div><strong style="display:block;margin-top:4px;font-size:20px;color:#4a1a22">${escapeHtml(params.registrationNo)}</strong></div><p><a href="${escapeHtml(params.setupUrl)}" style="display:inline-block;background:#7a1f1f;color:#fff;text-decoration:none;padding:12px 20px;border-radius:6px;font-weight:700">Create my private password</a></p><p style="font-size:13px;color:#6b6b6b">This secure one-time link expires in 7 days. Vedic Tatva will never email your password or ask you to share it.</p><h3 style="color:#4a1a22">Your account and storefront</h3><ul style="line-height:1.7"><li><a href="${portalUrl}">Panditji Portal login</a></li><li><a href="${directoryUrl}">Vedic Tatva Pandit directory</a></li><li>${params.storefrontPublished && params.storefrontUrl ? `<a href="${escapeHtml(params.storefrontUrl)}">Your public storefront</a>` : "Your storefront is a draft. Complete it in the portal; publication and directory visibility are reviewed separately."}</li></ul><h3 style="color:#4a1a22">What you can manage</h3><p style="line-height:1.7">Your public profile, canonical services, pricing, service modes, calendar, booking requests and devotee messages.</p><h3 style="color:#4a1a22">How we work as one team</h3><p style="line-height:1.7">You provide accurate ritual expertise, current availability and reliable service. Vedic Tatva provides discovery, storefront, booking and operational tools. Publication and bookings remain subject to profile completeness, verification and platform governance.</p><div style="display:grid;gap:12px"><div style="padding:14px;background:#f2f8f1;border-radius:8px"><strong>Do</strong><ul style="line-height:1.7;margin-bottom:0"><li>Keep profile, services, prices and availability accurate</li><li>Respond promptly and honour confirmed bookings</li><li>Protect devotee privacy and use canonical services</li></ul></div><div style="padding:14px;background:#fff4f2;border-radius:8px"><strong>Do not</strong><ul style="line-height:1.7;margin-bottom:0"><li>Share login credentials or private devotee information</li><li>Fabricate qualifications, reviews, availability or services</li><li>Move protected transactions outside the agreed Vedic Tatva process</li></ul></div></div>${params.adminNote ? `<div style="margin-top:18px;padding:12px;background:#faf7f0"><strong>Message from our team:</strong><br>${escapeHtml(params.adminNote)}</div>` : ""}`);
  return { to: params.to, subject: "Your Vedic Tatva Pandit application has been approved", text, html };
}

export function buildPanditPasswordResetEmail(params: { to: string; fullName: string; resetUrl: string }): EmailMessage {
  const greeting = params.fullName ? `Namaste ${params.fullName} ji,` : "Namaste,";
  const text = `${greeting}\n\nUse this secure link to reset your Panditji Portal password:\n\n${params.resetUrl}\n\nThe link expires in 7 days and can only be used once. If you did not request it, ignore this email.\n\n— Vedic Tatva Team`;
  const html = layout("Reset your Panditji Portal password", `<p>${escapeHtml(greeting)}</p><p>Use the secure button below to create a new password.</p><p><a href="${escapeHtml(params.resetUrl)}" style="display:inline-block;background:#7a1f1f;color:#fff;text-decoration:none;padding:10px 18px;border-radius:6px">Reset portal password</a></p><p style="font-size:13px;color:#6b6b6b">This link expires in 7 days and can only be used once.</p>`);
  return { to: params.to, subject: "Reset your Vedic Tatva Panditji Portal password", text, html };
}

export function buildPanditApplicationCorrectionEmail(params: {
  to: string;
  fullName: string;
  correctionUrl: string;
  explanation: string;
  requestedFields: string[];
}): EmailMessage {
  const greeting = params.fullName ? `Namaste ${params.fullName} ji,` : "Namaste,";
  const fields = params.requestedFields.join(", ");
  const text = `${greeting}\n\nYour Vedic Tatva Pandit application needs a few corrections before review.\n\nRequested details: ${fields}\nMessage from our team: ${params.explanation}\n\nPlease use this secure link to correct and resubmit your application:\n${params.correctionUrl}\n\nThe link expires in 7 days. It does not include your address or exact location evidence. You can submit the form again without creating a new application.\n\nनमस्ते,\nआपके आवेदन में समीक्षा से पहले कुछ सुधार आवश्यक हैं। कृपया ऊपर दिए गए सुरक्षित लिंक से केवल मांगी गई जानकारी ठीक करके दोबारा भेजें। लिंक 7 दिनों में समाप्त हो जाएगा।\n\n— Vedic Tatva Team`;
  const html = layout("A correction is needed for your Pandit application", `<p>${escapeHtml(greeting)}</p><p>Your application needs a few corrections before our team can complete its review.</p><div style="padding:14px;background:#faf7f0;border:1px solid #d9c58d;border-radius:8px"><strong>Requested details:</strong><br>${escapeHtml(fields)}<br><br><strong>Message from our team:</strong><br>${escapeHtml(params.explanation)}</div><p><a href="${escapeHtml(params.correctionUrl)}" style="display:inline-block;background:#7a1f1f;color:#fff;text-decoration:none;padding:12px 20px;border-radius:6px;font-weight:700">Correct and resubmit application</a></p><p style="font-size:13px;color:#6b6b6b">This secure link expires in 7 days. It does not include your address or exact location evidence. You can correct this application without applying again.</p><hr><p lang="hi">आपके आवेदन में समीक्षा से पहले कुछ सुधार आवश्यक हैं। कृपया सुरक्षित लिंक से केवल मांगी गई जानकारी ठीक करके दोबारा भेजें। लिंक 7 दिनों में समाप्त हो जाएगा।</p>`);
  return { to: params.to, subject: "Correction needed for your Vedic Tatva Pandit application / आवेदन में सुधार आवश्यक", text, html };
}

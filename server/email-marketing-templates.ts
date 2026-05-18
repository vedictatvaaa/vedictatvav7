// Marketing email templates — cart abandonment sequence, welcome series, and
// the broadcast wrapper. All emails use the Vedic Tatva brand palette
// (#FBF7EE / #6D2B35 / #D4AF37), include a plain-text fallback, and accept an
// {{unsubscribe_url}} token rendered into both the HTML and text bodies.

import type { EmailMessage } from "./email";

const SITE_URL = (process.env.PUBLIC_SITE_URL || "https://vedictatva.com").replace(/\/$/, "");

const BRAND_BG = "#FBF7EE";
const BRAND_MAROON = "#6D2B35";
const BRAND_GOLD = "#D4AF37";
const SURFACE = "#FFFFFF";
const SUBTLE = "#EFE6D2";
const TEXT_DEFAULT = "#2A2118";
const TEXT_MUTED = "#7A6F5E";

export const escapeHtml = (s: string) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const inr = (n: number) => `Rs ${Number(n || 0).toLocaleString("en-IN")}`;

interface MarketingWrapOpts {
  preheader?: string;
  unsubscribeUrl: string;
}

function wrapMarketingHtml(title: string, bodyHtml: string, opts: MarketingWrapOpts): string {
  const preheader = opts.preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:${BRAND_BG};opacity:0;">${escapeHtml(opts.preheader)}</div>`
    : "";
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:${BRAND_BG};font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;color:${TEXT_DEFAULT};">
  ${preheader}
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND_BG};padding:28px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:${SURFACE};border-radius:10px;overflow:hidden;border:1px solid ${SUBTLE};">
        <tr><td style="background:${BRAND_MAROON};padding:22px 28px;color:#fff;font-size:20px;font-weight:600;letter-spacing:0.4px;">
          Vedic Tatva
          <div style="height:3px;width:48px;background:${BRAND_GOLD};margin-top:8px;border-radius:2px;"></div>
        </td></tr>
        <tr><td style="padding:28px;">
          <h1 style="margin:0 0 16px;font-size:22px;color:${BRAND_MAROON};line-height:1.3;">${escapeHtml(title)}</h1>
          ${bodyHtml}
        </td></tr>
        <tr><td style="padding:18px 28px;background:${BRAND_BG};border-top:1px solid ${SUBTLE};font-size:12px;color:${TEXT_MUTED};line-height:1.6;">
          You're receiving this because you signed up at Vedic Tatva or left items in your cart.<br/>
          <a href="${opts.unsubscribeUrl}" style="color:${BRAND_MAROON};text-decoration:underline;">Unsubscribe</a>
          &nbsp;·&nbsp;
          Questions? Write to <a href="mailto:ecom@vedictatva.com" style="color:${BRAND_MAROON};">ecom@vedictatva.com</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function ctaButton(href: string, label: string): string {
  return `<p style="margin:22px 0;text-align:center;">
    <a href="${href}" style="display:inline-block;background:${BRAND_MAROON};color:#fff;padding:13px 26px;border-radius:6px;text-decoration:none;font-weight:600;font-size:15px;border:1px solid ${BRAND_MAROON};">${escapeHtml(label)}</a>
  </p>`;
}

interface CartItem { name?: string; productName?: string; quantity?: number; price?: number }

function renderItemRows(items: CartItem[]): string {
  return (items || []).map((i) => {
    const name = escapeHtml(i.productName || i.name || "Item");
    const qty = Number(i.quantity || 1);
    const price = Number(i.price || 0);
    return `<tr>
      <td style="padding:10px 12px;border-bottom:1px solid ${SUBTLE};font-size:14px;">${name}</td>
      <td style="padding:10px 12px;border-bottom:1px solid ${SUBTLE};font-size:14px;text-align:right;color:${TEXT_MUTED};">x ${qty}</td>
      <td style="padding:10px 12px;border-bottom:1px solid ${SUBTLE};font-size:14px;text-align:right;font-weight:600;">${inr(price * qty)}</td>
    </tr>`;
  }).join("") || `<tr><td style="padding:12px;font-size:14px;color:${TEXT_MUTED};">(items in your saved cart)</td></tr>`;
}

function renderItemsText(items: CartItem[]): string {
  const lines = (items || []).map((i) => {
    const name = i.productName || i.name || "Item";
    const qty = Number(i.quantity || 1);
    const price = Number(i.price || 0);
    return `- ${name} x ${qty} = ${inr(price * qty)}`;
  });
  return lines.join("\n") || "(items in your saved cart)";
}

// ============================================================
// Cart abandonment sequence (3 emails)
// ============================================================

interface CartEmailParams {
  to: string;
  customerName?: string | null;
  items: CartItem[];
  cartTotal: number;
  unsubscribeUrl: string;
}

export function buildAbandonedCartEmail1(p: CartEmailParams): EmailMessage {
  const greeting = p.customerName ? `Namaste ${p.customerName} ji,` : "Namaste,";
  const cartUrl = `${SITE_URL}/cart`;
  const subject = "You left a few sacred items behind";
  const text = `${greeting}

We noticed you left some items in your Vedic Tatva cart. We've kept them safe for you:

${renderItemsText(p.items)}

Cart total: ${inr(p.cartTotal)}

Complete your order in one click:
${cartUrl}

Need help choosing? Just reply to this email — our team will guide you.

— Vedic Tatva Team

Unsubscribe: ${p.unsubscribeUrl}`;
  const html = wrapMarketingHtml("Your cart is waiting", `
    <p style="margin:0 0 12px;font-size:15px;">${escapeHtml(greeting)}</p>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">
      We've kept the items in your Vedic Tatva cart safe for you. Pick up where you left off whenever you're ready.
    </p>
    <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;border:1px solid ${SUBTLE};border-radius:6px;overflow:hidden;margin:0 0 12px;">
      ${renderItemRows(p.items)}
      <tr style="background:${BRAND_BG};">
        <td style="padding:12px;font-size:14px;font-weight:600;">Cart total</td>
        <td></td>
        <td style="padding:12px;font-size:15px;font-weight:700;text-align:right;color:${BRAND_MAROON};">${inr(p.cartTotal)}</td>
      </tr>
    </table>
    ${ctaButton(cartUrl, "Complete my order")}
    <p style="margin:14px 0 0;font-size:13px;color:${TEXT_MUTED};line-height:1.55;">Questions about a product? Reply to this email and our team will help you choose.</p>
  `, { preheader: "Your selected items are still here", unsubscribeUrl: p.unsubscribeUrl });
  return { to: p.to, subject, text, html };
}

export function buildAbandonedCartEmail2(p: CartEmailParams): EmailMessage {
  const greeting = p.customerName ? `Namaste ${p.customerName} ji,` : "Namaste,";
  const cartUrl = `${SITE_URL}/cart`;
  const subject = "Still thinking it over? A small note from Vedic Tatva";
  const text = `${greeting}

A day has passed and your sacred items are still waiting in your cart. We thought you might like to know a little more about why devotees choose Vedic Tatva:

- Every item is sourced from authentic Indian artisans and temple suppliers
- Free shipping on orders over Rs 999, with careful, blessed packaging
- 7-day easy return on physical samagri

Your saved cart:
${renderItemsText(p.items)}

Total: ${inr(p.cartTotal)}

Continue checkout: ${cartUrl}

— Vedic Tatva Team

Unsubscribe: ${p.unsubscribeUrl}`;
  const html = wrapMarketingHtml("Your sacred items, blessed and ready", `
    <p style="margin:0 0 12px;font-size:15px;">${escapeHtml(greeting)}</p>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">
      A day has passed and your cart is still here. We wanted to share a few reasons devotees across India trust Vedic Tatva:
    </p>
    <ul style="margin:0 0 18px 18px;padding:0;font-size:14px;line-height:1.8;color:${TEXT_DEFAULT};">
      <li>Every item is sourced from authentic Indian artisans and temple suppliers</li>
      <li>Free shipping on orders over Rs 999, with careful, blessed packaging</li>
      <li>7-day easy return on physical samagri</li>
    </ul>
    <p style="margin:0 0 8px;font-size:14px;font-weight:600;color:${BRAND_MAROON};">Your saved cart</p>
    <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;border:1px solid ${SUBTLE};border-radius:6px;overflow:hidden;margin:0 0 12px;">
      ${renderItemRows(p.items)}
      <tr style="background:${BRAND_BG};">
        <td style="padding:12px;font-size:14px;font-weight:600;">Total</td>
        <td></td>
        <td style="padding:12px;font-size:15px;font-weight:700;text-align:right;color:${BRAND_MAROON};">${inr(p.cartTotal)}</td>
      </tr>
    </table>
    ${ctaButton(cartUrl, "Continue checkout")}
  `, { preheader: "Why devotees trust Vedic Tatva", unsubscribeUrl: p.unsubscribeUrl });
  return { to: p.to, subject, text, html };
}

export function buildAbandonedCartEmail3(p: CartEmailParams): EmailMessage {
  const greeting = p.customerName ? `Namaste ${p.customerName} ji,` : "Namaste,";
  const cartUrl = `${SITE_URL}/cart?coupon=COMEBACK10`;
  const subject = "A small gift to complete your order — 10% off inside";
  const text = `${greeting}

We don't want you to miss out on the items you chose. As a small gesture, here's a coupon worth 10% off your order:

Code: COMEBACK10
Valid for: 48 hours

Apply it at checkout: ${cartUrl}

Your saved cart:
${renderItemsText(p.items)}

Total: ${inr(p.cartTotal)}

— Vedic Tatva Team

If you don't want emails like this, you can unsubscribe here: ${p.unsubscribeUrl}`;
  const html = wrapMarketingHtml("A small gift to complete your order", `
    <p style="margin:0 0 12px;font-size:15px;">${escapeHtml(greeting)}</p>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">
      We don't want you to miss out. As a small gesture, here is a coupon worth <strong style="color:${BRAND_MAROON};">10% off</strong> your order, valid for the next 48 hours.
    </p>
    <div style="margin:0 0 18px;padding:16px;border:2px dashed ${BRAND_GOLD};border-radius:8px;background:${BRAND_BG};text-align:center;">
      <div style="font-size:12px;color:${TEXT_MUTED};letter-spacing:1px;text-transform:uppercase;">Your coupon</div>
      <div style="font-size:22px;font-weight:700;color:${BRAND_MAROON};letter-spacing:2px;font-family:Menlo,monospace;margin-top:4px;">COMEBACK10</div>
    </div>
    <p style="margin:0 0 8px;font-size:14px;font-weight:600;color:${BRAND_MAROON};">Your saved cart</p>
    <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;border:1px solid ${SUBTLE};border-radius:6px;overflow:hidden;margin:0 0 12px;">
      ${renderItemRows(p.items)}
      <tr style="background:${BRAND_BG};">
        <td style="padding:12px;font-size:14px;font-weight:600;">Total</td>
        <td></td>
        <td style="padding:12px;font-size:15px;font-weight:700;text-align:right;color:${BRAND_MAROON};">${inr(p.cartTotal)}</td>
      </tr>
    </table>
    ${ctaButton(cartUrl, "Apply coupon and checkout")}
    <p style="margin:14px 0 0;font-size:13px;color:${TEXT_MUTED};line-height:1.55;">This is the last reminder we'll send for this cart.</p>
  `, { preheader: "10% off, valid for 48 hours", unsubscribeUrl: p.unsubscribeUrl });
  return { to: p.to, subject, text, html };
}

// ============================================================
// Welcome series (2 emails)
// ============================================================

interface WelcomeEmailParams {
  to: string;
  unsubscribeUrl: string;
}

export function buildWelcomeEmail1(p: WelcomeEmailParams): EmailMessage {
  const shopUrl = `${SITE_URL}/puja-samagri-online?coupon=WELCOME10`;
  const text = `Namaste,

Welcome to Vedic Tatva — your home for authentic puja samagri, verified pandits, and Vedic astrology.

To begin your journey, here is a 10% welcome coupon:

Code: WELCOME10
Valid for: 14 days

Start exploring: ${shopUrl}

Over the next few days we'll share our most-loved products and a few tips on choosing the right samagri for your home altar.

— Vedic Tatva Team

Unsubscribe: ${p.unsubscribeUrl}`;
  const html = wrapMarketingHtml("Welcome to Vedic Tatva", `
    <p style="margin:0 0 12px;font-size:15px;">Namaste,</p>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">
      Welcome to <strong>Vedic Tatva</strong> — your home for authentic puja samagri, verified pandits, and Vedic astrology.
    </p>
    <p style="margin:0 0 12px;font-size:15px;line-height:1.6;">As a small thank you for subscribing, here is a coupon worth <strong style="color:${BRAND_MAROON};">10% off</strong> your first order.</p>
    <div style="margin:0 0 18px;padding:16px;border:2px dashed ${BRAND_GOLD};border-radius:8px;background:${BRAND_BG};text-align:center;">
      <div style="font-size:12px;color:${TEXT_MUTED};letter-spacing:1px;text-transform:uppercase;">Your welcome coupon</div>
      <div style="font-size:22px;font-weight:700;color:${BRAND_MAROON};letter-spacing:2px;font-family:Menlo,monospace;margin-top:4px;">WELCOME10</div>
      <div style="font-size:12px;color:${TEXT_MUTED};margin-top:4px;">Valid for 14 days</div>
    </div>
    ${ctaButton(shopUrl, "Start exploring")}
    <p style="margin:14px 0 0;font-size:13px;color:${TEXT_MUTED};line-height:1.55;">Over the next few days we'll share our most-loved products and tips for choosing the right samagri for your home altar.</p>
  `, { preheader: "Your 10% welcome coupon is inside", unsubscribeUrl: p.unsubscribeUrl });
  return { to: p.to, subject: "Welcome to Vedic Tatva — 10% off inside", text, html };
}

export function buildWelcomeEmail2(p: WelcomeEmailParams): EmailMessage {
  const shopUrl = `${SITE_URL}/puja-samagri-online`;
  const panditsUrl = `${SITE_URL}/book-pandit-online`;
  const subject = "Bestsellers our community loves";
  const text = `Namaste,

Now that you're settled in, here are a few things devotees turn to most often at Vedic Tatva:

1. Brass diyas, kalash, and pooja thalis — handcrafted by traditional artisans
2. Authentic samagri kits for daily and festival pujas
3. Verified pandit bookings for online or at-home ceremonies
4. PDF Kundli reports prepared by our astrologers

Shop bestsellers: ${shopUrl}
Book a pandit: ${panditsUrl}

— Vedic Tatva Team

Unsubscribe: ${p.unsubscribeUrl}`;
  const html = wrapMarketingHtml("Bestsellers our community loves", `
    <p style="margin:0 0 12px;font-size:15px;">Namaste,</p>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">
      Now that you're settled in, here are a few things devotees turn to most often at Vedic Tatva.
    </p>
    <ol style="margin:0 0 18px 22px;padding:0;font-size:14px;line-height:1.8;color:${TEXT_DEFAULT};">
      <li><strong>Brass diyas, kalash, and pooja thalis</strong> — handcrafted by traditional artisans</li>
      <li><strong>Authentic samagri kits</strong> for daily and festival pujas</li>
      <li><strong>Verified pandit bookings</strong> for online or at-home ceremonies</li>
      <li><strong>PDF Kundli reports</strong> prepared by our astrologers</li>
    </ol>
    <p style="margin:18px 0;text-align:center;">
      <a href="${shopUrl}" style="display:inline-block;background:${BRAND_MAROON};color:#fff;padding:12px 22px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px;margin:4px;border:1px solid ${BRAND_MAROON};">Shop bestsellers</a>
      <a href="${panditsUrl}" style="display:inline-block;background:${SURFACE};color:${BRAND_MAROON};padding:11px 22px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px;margin:4px;border:1px solid ${BRAND_MAROON};">Book a pandit</a>
    </p>
    <p style="margin:14px 0 0;font-size:13px;color:${TEXT_MUTED};line-height:1.55;">Have a specific puja or ceremony in mind? Reply to this email and we'll guide you.</p>
  `, { preheader: "Diyas, samagri kits, pandits, kundlis", unsubscribeUrl: p.unsubscribeUrl });
  return { to: p.to, subject, text, html };
}

// ============================================================
// Broadcast wrapper — admin-composed campaigns
// ============================================================

export function buildBroadcastEmail(p: {
  to: string;
  subject: string;
  previewText?: string | null;
  bodyHtml: string;
  bodyText?: string | null;
  unsubscribeUrl: string;
}): EmailMessage {
  // Replace any {{unsubscribe_url}} tokens admins may have included.
  const bodyHtml = String(p.bodyHtml || "").replace(/\{\{\s*unsubscribe_url\s*\}\}/g, p.unsubscribeUrl);
  const bodyText = String(p.bodyText || "").replace(/\{\{\s*unsubscribe_url\s*\}\}/g, p.unsubscribeUrl);
  const html = wrapMarketingHtml(p.subject, bodyHtml, {
    preheader: p.previewText || undefined,
    unsubscribeUrl: p.unsubscribeUrl,
  });
  const text = (bodyText && bodyText.trim().length > 0)
    ? `${bodyText}\n\nUnsubscribe: ${p.unsubscribeUrl}`
    : `${stripHtmlForText(p.bodyHtml)}\n\nUnsubscribe: ${p.unsubscribeUrl}`;
  return { to: p.to, subject: p.subject, text, html };
}

function stripHtmlForText(html: string): string {
  return String(html || "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<br\s*\/?>(\s*)/gi, "\n")
    .replace(/<\/(p|div|li|tr|h\d)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

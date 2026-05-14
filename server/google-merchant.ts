import type { Product } from "@shared/schema";

// Mints a Google Content API OAuth token from a service-account JSON.
// Reused by both the bulk sync and the per-product promote endpoint.
export async function mintMerchantAccessToken(): Promise<{ ok: true; token: string } | { ok: false; error: string }> {
  const saJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!saJson) return { ok: false, error: "GOOGLE_SERVICE_ACCOUNT_JSON not set" };
  let credentials: any;
  try { credentials = JSON.parse(saJson); }
  catch { return { ok: false, error: "GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON" }; }

  const jwt = await import("jsonwebtoken").then(m => m.default).catch(() => null);
  if (!jwt) return { ok: false, error: "jsonwebtoken package not available" };

  const now = Math.floor(Date.now() / 1000);
  const assertion = jwt.sign(
    {
      iss: credentials.client_email,
      scope: "https://www.googleapis.com/auth/content",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    },
    credentials.private_key,
    { algorithm: "RS256" },
  );

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }).toString(),
  });
  const tokenData: any = await tokenRes.json();
  if (!tokenRes.ok) return { ok: false, error: tokenData?.error_description || "OAuth token exchange failed" };
  return { ok: true, token: tokenData.access_token };
}

export function buildMerchantProductPayload(p: Product, baseUrl: string) {
  const offerId = `vt-${p.id}`;
  const link = `${baseUrl}/product/${p.slug || p.id}`;
  const payload: any = {
    offerId,
    title: p.name.slice(0, 150),
    description: ((p as any).description || p.name).replace(/<[^>]+>/g, "").slice(0, 5000),
    link,
    imageLink: (p as any).image,
    contentLanguage: "en",
    targetCountry: "IN",
    channel: "online",
    availability: p.stock > 0 ? "in stock" : "out of stock",
    condition: "new",
    price: { value: String(p.price), currency: "INR" },
    identifierExists: !!((p as any).upcEan || (p as any).brand),
  };
  if ((p as any).mrp && (p as any).mrp > p.price) {
    payload.salePrice = { value: String(p.price), currency: "INR" };
    payload.price = { value: String((p as any).mrp), currency: "INR" };
  }
  if ((p as any).upcEan) payload.gtin = (p as any).upcEan;
  if ((p as any).brand) payload.brand = (p as any).brand;
  if ((p as any).images && (p as any).images.length > 0) {
    payload.additionalImageLinks = (p as any).images.slice(0, 10);
  }
  if ((p as any).gstPercent != null) {
    payload.tax = [{ country: "IN", rate: Number((p as any).gstPercent), taxShip: false }];
  }
  return payload;
}

export async function pushSingleProduct(p: Product, baseUrl: string): Promise<{
  success: boolean; message: string; offerId?: string; productLink?: string; warnings?: string[];
}> {
  const merchantId = process.env.GOOGLE_MERCHANT_ID;
  if (!merchantId) return { success: false, message: "GOOGLE_MERCHANT_ID not set" };

  const tok = await mintMerchantAccessToken();
  if (!tok.ok) return { success: false, message: tok.error };

  const product = buildMerchantProductPayload(p, baseUrl);
  const apiRes = await fetch(`https://shoppingcontent.googleapis.com/content/v2.1/${merchantId}/products`, {
    method: "POST",
    headers: { Authorization: `Bearer ${tok.token}`, "Content-Type": "application/json" },
    body: JSON.stringify(product),
  });
  const apiData: any = await apiRes.json();
  if (!apiRes.ok) {
    return { success: false, message: apiData?.error?.message || "Content API call failed" };
  }
  const warnings: string[] = (apiData.warnings || []).map((w: any) => w.message).filter(Boolean);
  return {
    success: true,
    message: "Product pushed to Google Merchant Center",
    offerId: apiData.offerId,
    productLink: product.link,
    warnings,
  };
}

// Build deep links for the merchant to manually finish promotion
export function buildPromoteLinks(p: Product, baseUrl: string) {
  const merchantId = process.env.GOOGLE_MERCHANT_ID || "";
  const productUrl = `${baseUrl}/product/${p.slug || p.id}`;
  const encUrl = encodeURIComponent(productUrl);
  const encName = encodeURIComponent(p.name);
  const encShare = encodeURIComponent(`${p.name} — ₹${p.price} | ${productUrl}`);

  return {
    productUrl,
    merchantCenter: merchantId
      ? `https://merchants.google.com/mc/items/list?a=${merchantId}`
      : "https://merchants.google.com",
    googleAdsCampaign: "https://ads.google.com/aw/campaigns/new?subid=in-en-pmax",
    googleSearchPreview: `https://www.google.com/search?q=${encName}+site:${encodeURIComponent(new URL(baseUrl).host)}`,
    googleTrendsExplore: `https://trends.google.com/trends/explore?q=${encName}&geo=IN`,
    share: {
      whatsapp: `https://wa.me/?text=${encShare}`,
      twitter: `https://twitter.com/intent/tweet?text=${encShare}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encUrl}`,
      pinterest: `https://www.pinterest.com/pin/create/button/?url=${encUrl}&description=${encName}`,
      telegram: `https://t.me/share/url?url=${encUrl}&text=${encName}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encUrl}`,
      email: `mailto:?subject=${encName}&body=${encShare}`,
    },
  };
}

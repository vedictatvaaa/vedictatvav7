// Shiprocket API client.
//
// Auth model: POST /auth/login returns a JWT good for ~10 days. We cache it in
// memory and refresh proactively at 23h. All other calls go through `request()`
// which transparently re-auths once on 401/403.
//
// Env: SHIPROCKET_EMAIL, SHIPROCKET_PASSWORD (required), SHIPROCKET_PICKUP_LOCATION
// (optional, defaults to "Primary").
//
// Every method throws ShiprocketError on failure. Endpoints in routes.ts catch
// and translate to 502/503 as appropriate.

const BASE_URL = "https://apiv2.shiprocket.in/v1/external";

export class ShiprocketError extends Error {
  constructor(public status: number, message: string, public body?: any) {
    super(message);
    this.name = "ShiprocketError";
  }
}

let cachedToken: { token: string; expiresAt: number } | null = null;
const TOKEN_REFRESH_BEFORE_MS = 60 * 60 * 1000; // refresh 1h before expiry

export function isShiprocketConfigured(): boolean {
  return Boolean(process.env.SHIPROCKET_EMAIL && process.env.SHIPROCKET_PASSWORD);
}

export function getPickupLocation(): string {
  return process.env.SHIPROCKET_PICKUP_LOCATION || "Primary";
}

async function login(): Promise<string> {
  const email = process.env.SHIPROCKET_EMAIL;
  const password = process.env.SHIPROCKET_PASSWORD;
  if (!email || !password) {
    throw new ShiprocketError(503, "Shiprocket not configured: set SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD");
  }
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const body: any = await res.json().catch(() => ({}));
  if (!res.ok || !body?.token) {
    throw new ShiprocketError(res.status, body?.message || "Shiprocket login failed", body);
  }
  // Shiprocket tokens are ~10 days. Use 9 days as a conservative cap.
  const ttlMs = 9 * 24 * 60 * 60 * 1000;
  cachedToken = { token: body.token, expiresAt: Date.now() + ttlMs };
  return body.token;
}

async function getToken(forceRefresh = false): Promise<string> {
  if (!forceRefresh && cachedToken && Date.now() < cachedToken.expiresAt - TOKEN_REFRESH_BEFORE_MS) {
    return cachedToken.token;
  }
  return login();
}

async function request<T = any>(path: string, init: RequestInit & { json?: any } = {}, retried = false): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    ...((init.headers as Record<string, string>) || {}),
  };
  const body = init.json !== undefined ? JSON.stringify(init.json) : (init.body as any);
  const res = await fetch(`${BASE_URL}${path}`, { ...init, headers, body });
  const ct = res.headers.get("content-type") || "";
  const payload: any = ct.includes("application/json") ? await res.json().catch(() => ({})) : await res.text();
  if (res.status === 401 || res.status === 403) {
    if (!retried) {
      cachedToken = null;
      return request<T>(path, init, true);
    }
    throw new ShiprocketError(res.status, "Shiprocket auth failed", payload);
  }
  if (!res.ok) {
    const msg = (payload && (payload.message || payload.error)) || `Shiprocket request failed (${res.status})`;
    throw new ShiprocketError(res.status, msg, payload);
  }
  return payload as T;
}

// ── Address parsing helper ────────────────────────────────────────────────
// Our orders store the full shipping address as one text blob. Shiprocket
// requires structured fields. Best-effort parser; admin can edit before sending.
export function parseAddress(raw: string | null | undefined): {
  address: string;
  city: string;
  pincode: string;
  state: string;
  country: string;
} {
  const text = (raw || "").trim();
  const pincodeMatch = text.match(/\b(\d{6})\b/);
  const pincode = pincodeMatch ? pincodeMatch[1] : "";
  const parts = text.split(/[,\n]/).map((p) => p.trim()).filter(Boolean);
  // Heuristic: country last if present, then state, then city, then street(s).
  const country = parts.length && /india/i.test(parts[parts.length - 1]) ? parts.pop()! : "India";
  let state = "";
  let city = "";
  if (parts.length >= 1) {
    // Strip pincode token if it landed in its own segment
    const cleaned = parts.map((p) => p.replace(/\b\d{6}\b/g, "").trim()).filter(Boolean);
    state = cleaned.length >= 1 ? cleaned[cleaned.length - 1] : "";
    city = cleaned.length >= 2 ? cleaned[cleaned.length - 2] : "";
    parts.length = cleaned.length;
  }
  // Address = the full original minus pincode (Shiprocket allows comma-separated)
  const address = text.replace(pincode, "").replace(/,\s*,/g, ",").replace(/\s+/g, " ").trim() || text;
  return { address, city, pincode, state, country };
}

// ── Public API ────────────────────────────────────────────────────────────

export interface CreateOrderItem {
  name: string;
  sku: string;
  units: number;
  selling_price: number;
  hsn?: string | number;
}

export interface CreateOrderPayload {
  order_id: string;
  order_date: string; // YYYY-MM-DD HH:MM
  pickup_location: string;
  channel_id?: string;
  comment?: string;
  billing_customer_name: string;
  billing_last_name?: string;
  billing_address: string;
  billing_address_2?: string;
  billing_city: string;
  billing_pincode: string;
  billing_state: string;
  billing_country: string;
  billing_email: string;
  billing_phone: string;
  shipping_is_billing: boolean;
  order_items: CreateOrderItem[];
  payment_method: "Prepaid" | "COD";
  sub_total: number;
  length: number;
  breadth: number;
  height: number;
  weight: number; // kg
}

export interface CreateOrderResponse {
  order_id: number;
  shipment_id: number;
  status: string;
  status_code: number;
  onboarding_completed_now: number;
  awb_code?: string | null;
  courier_company_id?: number | null;
  courier_name?: string | null;
}

export async function createOrder(payload: CreateOrderPayload): Promise<CreateOrderResponse> {
  return request<CreateOrderResponse>("/orders/create/adhoc", { method: "POST", json: payload });
}

export async function assignAwb(shipmentId: string | number, courierCompanyId?: number) {
  const json: any = { shipment_id: Number(shipmentId) };
  if (courierCompanyId) json.courier_id = courierCompanyId;
  return request<{ awb_assign_status: number; response: { data: any } }>("/courier/assign/awb", { method: "POST", json });
}

export async function generatePickup(shipmentIds: Array<string | number>) {
  return request<{ pickup_status: number; response: { pickup_scheduled_date?: string; pickup_token_number?: string; pickup_generated_date?: any } }>(
    "/courier/generate/pickup",
    { method: "POST", json: { shipment_id: shipmentIds.map((s) => Number(s)) } }
  );
}

export async function getTracking(awb: string) {
  return request<any>(`/courier/track/awb/${encodeURIComponent(awb)}`, { method: "GET" });
}

export async function cancelShipment(awbs: string[]) {
  return request<any>("/orders/cancel/shipment/awbs", { method: "POST", json: { awbs } });
}

export async function checkServiceability(opts: {
  pickupPincode: string;
  deliveryPincode: string;
  weightKg: number;
  cod: boolean;
}) {
  const params = new URLSearchParams({
    pickup_postcode: opts.pickupPincode,
    delivery_postcode: opts.deliveryPincode,
    weight: String(opts.weightKg),
    cod: opts.cod ? "1" : "0",
  });
  return request<any>(`/courier/serviceability/?${params.toString()}`, { method: "GET" });
}

export async function generateLabel(shipmentIds: Array<string | number>) {
  return request<{ label_created: number; label_url?: string; not_created?: number[] }>(
    "/courier/generate/label",
    { method: "POST", json: { shipment_id: shipmentIds.map((s) => Number(s)) } }
  );
}

export async function generateManifest(shipmentIds: Array<string | number>) {
  return request<{ status: number; manifest_url?: string }>("/manifests/generate", {
    method: "POST",
    json: { shipment_id: shipmentIds.map((s) => Number(s)) },
  });
}

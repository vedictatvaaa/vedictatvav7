// API Credentials Vault — admin-managed payment + AI provider keys.
//
// Storage: AES-256-GCM ciphertext in api_credentials.encrypted_data.
// Encryption key: scrypt(SESSION_SECRET || ORDER_LOOKUP_SECRET || boot-random,
// "vt-api-cred-salt", 32). In production a stable secret MUST be set, otherwise
// every restart invalidates every stored credential.
//
// Activation: marking a row isActive=true also writes its decrypted fields into
// process.env via the provider's envMap. So existing code that reads
// process.env.RAZORPAY_KEY_ID etc. transparently picks up DB-managed values
// without any refactor of payment / AI call sites.

import type { Express } from "express";
import crypto from "crypto";
import { eq, and, ne } from "drizzle-orm";
import { db } from "./db";
import { apiCredentials } from "@shared/schema";
import { getProvider, PROVIDER_CATALOG } from "@shared/api-providers";
import { adminAuthMiddleware } from "./admin-auth";

// ---------------------------------------------------------------------
// Crypto
// ---------------------------------------------------------------------

let cachedKey: Buffer | null = null;
function getKey(): Buffer {
  if (cachedKey) return cachedKey;
  const secret = process.env.SESSION_SECRET || process.env.ORDER_LOOKUP_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("SESSION_SECRET (or ORDER_LOOKUP_SECRET) is required in production for credential encryption.");
    }
    console.warn("[api-credentials] No SESSION_SECRET set — using ephemeral key. Stored credentials will not survive restart in dev.");
    cachedKey = crypto.randomBytes(32);
    return cachedKey;
  }
  cachedKey = crypto.scryptSync(secret, "vt-api-cred-salt", 32);
  return cachedKey;
}

function encrypt(plain: object): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getKey(), iv);
  const buf = Buffer.concat([cipher.update(JSON.stringify(plain), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, buf]).toString("base64");
}

function decrypt(b64: string): Record<string, string> {
  const data = Buffer.from(b64, "base64");
  const iv = data.subarray(0, 12);
  const tag = data.subarray(12, 28);
  const ct = data.subarray(28);
  const decipher = crypto.createDecipheriv("aes-256-gcm", getKey(), iv);
  decipher.setAuthTag(tag);
  const plain = Buffer.concat([decipher.update(ct), decipher.final()]).toString("utf8");
  return JSON.parse(plain);
}

function maskValue(v: string | undefined): string {
  if (!v) return "";
  if (v.length <= 8) return v.slice(0, 2) + "•••";
  return v.slice(0, 4) + "•••••" + v.slice(-4);
}

// ---------------------------------------------------------------------
// Auto-detect: identify provider/mode from a pasted secret string
// ---------------------------------------------------------------------

interface DetectResult {
  provider?: string;
  kind?: "payment" | "ai";
  mode?: "test" | "live";
  field: string;       // which field the secret should populate
  confidence: "high" | "medium" | "low";
  reason: string;
}

export function detectProvider(raw: string): DetectResult {
  const s = (raw || "").trim();
  if (!s) return { field: "apiKey", confidence: "low", reason: "Empty input" };

  // High-confidence prefix matches
  if (s.startsWith("sk-ant-")) return { provider: "anthropic", kind: "ai", field: "apiKey", confidence: "high", reason: "Anthropic prefix sk-ant-" };
  if (s.startsWith("sk-or-")) return { provider: "openrouter", kind: "ai", field: "apiKey", confidence: "high", reason: "OpenRouter prefix sk-or-" };
  if (s.startsWith("sk-proj-") || s.startsWith("sk-svcacct-")) return { provider: "openai", kind: "ai", field: "apiKey", confidence: "high", reason: "OpenAI scoped key prefix" };
  if (s.startsWith("AIza") && s.length >= 35) return { provider: "gemini", kind: "ai", field: "apiKey", confidence: "high", reason: "Google API key prefix AIza" };
  if (s.startsWith("rzp_test_")) return { provider: "razorpay", kind: "payment", mode: "test", field: "keyId", confidence: "high", reason: "Razorpay test key" };
  if (s.startsWith("rzp_live_")) return { provider: "razorpay", kind: "payment", mode: "live", field: "keyId", confidence: "high", reason: "Razorpay live key" };
  if (s.startsWith("sk_test_")) return { provider: "stripe", kind: "payment", mode: "test", field: "secretKey", confidence: "high", reason: "Stripe test key" };
  if (s.startsWith("sk_live_")) return { provider: "stripe", kind: "payment", mode: "live", field: "secretKey", confidence: "high", reason: "Stripe live key" };
  if (s.startsWith("pk_test_")) return { provider: "stripe", kind: "payment", mode: "test", field: "publishableKey", confidence: "high", reason: "Stripe test publishable" };
  if (s.startsWith("pk_live_")) return { provider: "stripe", kind: "payment", mode: "live", field: "publishableKey", confidence: "high", reason: "Stripe live publishable" };
  if (s.startsWith("CF_") || s.startsWith("cfsk_ma_test_")) return { provider: "cashfree", kind: "payment", mode: "test", field: "secretKey", confidence: "high", reason: "Cashfree test key" };
  if (s.startsWith("cfsk_ma_prod_")) return { provider: "cashfree", kind: "payment", mode: "live", field: "secretKey", confidence: "high", reason: "Cashfree production key" };

  // Medium-confidence
  if (s.startsWith("sk-") && s.length >= 40) return { provider: "openai", kind: "ai", field: "apiKey", confidence: "medium", reason: "Generic sk- prefix, likely OpenAI" };

  return { field: "apiKey", confidence: "low", reason: "Could not auto-detect — please pick a provider manually" };
}

// ---------------------------------------------------------------------
// Provider test routines (cheap GET against each provider)
// ---------------------------------------------------------------------

const PING_TIMEOUT_MS = 8000;
function timedFetch(url: string, init?: RequestInit): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), PING_TIMEOUT_MS);
  return fetch(url, { ...init, signal: ctrl.signal }).finally(() => clearTimeout(t));
}

async function testCredential(provider: string, fields: Record<string, string>): Promise<{ ok: boolean; message: string }> {
  try {
    switch (provider) {
      case "razorpay": {
        if (!fields.keyId || !fields.keySecret) return { ok: false, message: "keyId + keySecret required" };
        const auth = Buffer.from(`${fields.keyId}:${fields.keySecret}`).toString("base64");
        const r = await timedFetch("https://api.razorpay.com/v1/payments?count=1", { headers: { Authorization: `Basic ${auth}` } });
        return { ok: r.ok, message: r.ok ? "Authenticated" : `HTTP ${r.status}` };
      }
      case "stripe": {
        if (!fields.secretKey) return { ok: false, message: "secretKey required" };
        const r = await timedFetch("https://api.stripe.com/v1/balance", { headers: { Authorization: `Bearer ${fields.secretKey}` } });
        return { ok: r.ok, message: r.ok ? "Authenticated" : `HTTP ${r.status}` };
      }
      case "cashfree": {
        if (!fields.appId || !fields.secretKey) return { ok: false, message: "appId + secretKey required" };
        // Use production endpoint to validate format. Auth header pattern.
        const r = await timedFetch("https://sandbox.cashfree.com/pg/orders/test-only", {
          method: "GET",
          headers: { "x-client-id": fields.appId, "x-client-secret": fields.secretKey, "x-api-version": "2023-08-01" },
        });
        // Cashfree returns 404 for non-existent order — that's fine (means auth passed).
        return { ok: r.status === 404 || r.ok, message: r.status === 404 || r.ok ? "Auth headers accepted" : `HTTP ${r.status}` };
      }
      case "openai": {
        if (!fields.apiKey) return { ok: false, message: "apiKey required" };
        const base = (fields.baseUrl || "https://api.openai.com/v1").replace(/\/+$/, "");
        const headers: Record<string, string> = { Authorization: `Bearer ${fields.apiKey}` };
        if (fields.organization) headers["OpenAI-Organization"] = fields.organization;
        const r = await timedFetch(`${base}/models?limit=1`, { headers });
        return { ok: r.ok, message: r.ok ? "Reachable" : `HTTP ${r.status}` };
      }
      case "gemini": {
        if (!fields.apiKey) return { ok: false, message: "apiKey required" };
        const r = await timedFetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(fields.apiKey)}`);
        return { ok: r.ok, message: r.ok ? "Reachable" : `HTTP ${r.status}` };
      }
      case "anthropic": {
        if (!fields.apiKey) return { ok: false, message: "apiKey required" };
        const r = await timedFetch("https://api.anthropic.com/v1/models", {
          headers: { "x-api-key": fields.apiKey, "anthropic-version": "2023-06-01" },
        });
        return { ok: r.ok, message: r.ok ? "Reachable" : `HTTP ${r.status}` };
      }
      case "mistral": {
        if (!fields.apiKey) return { ok: false, message: "apiKey required" };
        const r = await timedFetch("https://api.mistral.ai/v1/models", { headers: { Authorization: `Bearer ${fields.apiKey}` } });
        return { ok: r.ok, message: r.ok ? "Reachable" : `HTTP ${r.status}` };
      }
      case "openrouter": {
        if (!fields.apiKey) return { ok: false, message: "apiKey required" };
        const r = await timedFetch("https://openrouter.ai/api/v1/models", { headers: { Authorization: `Bearer ${fields.apiKey}` } });
        return { ok: r.ok, message: r.ok ? "Reachable" : `HTTP ${r.status}` };
      }
      // PayU / PhonePe / Paytm have no cheap idempotent GET — just confirm format.
      case "payu":
        return { ok: Boolean(fields.merchantKey && fields.merchantSalt), message: fields.merchantKey && fields.merchantSalt ? "Format OK (no ping endpoint)" : "Missing fields" };
      case "phonepe":
        return { ok: Boolean(fields.merchantId && fields.saltKey), message: fields.merchantId && fields.saltKey ? "Format OK (no ping endpoint)" : "Missing fields" };
      case "paytm":
        return { ok: Boolean(fields.merchantId && fields.merchantKey), message: fields.merchantId && fields.merchantKey ? "Format OK (no ping endpoint)" : "Missing fields" };
    }
    return { ok: false, message: "Unknown provider" };
  } catch (err: any) {
    return { ok: false, message: err?.message || "Network error" };
  }
}

// ---------------------------------------------------------------------
// Boot rehydration: project active credentials into process.env
// ---------------------------------------------------------------------

let rehydrated = false;
export async function rehydrateFromDb(): Promise<void> {
  if (rehydrated) return;
  try {
    const rows = await db.select().from(apiCredentials).where(eq(apiCredentials.isActive, true));
    // Group by provider; if multiple active rows exist for one provider (legacy),
    // pick the most recently updated so env state is deterministic.
    const byProvider = new Map<string, typeof rows[number]>();
    for (const row of rows) {
      const prev = byProvider.get(row.provider);
      if (!prev || (row.updatedAt && prev.updatedAt && row.updatedAt > prev.updatedAt)) {
        byProvider.set(row.provider, row);
      }
    }
    let count = 0;
    for (const row of byProvider.values()) {
      const provider = getProvider(row.provider);
      if (!provider) continue;
      try {
        const fields = decrypt(row.encryptedData);
        clearFromEnv(row.provider); // wipe stale keys before projecting fresh ones
        projectToEnv(row.provider, fields);
        count++;
      } catch (err) {
        console.warn(`[api-credentials] Failed to decrypt row ${row.id} (${row.provider}). Skipping.`);
      }
    }
    if (count > 0) console.log(`[api-credentials] Rehydrated ${count} active credential(s) into process.env`);
    rehydrated = true; // only mark complete on success so transient failures retry next call
  } catch (err: any) {
    console.warn(`[api-credentials] Rehydration skipped (will retry on next call): ${err?.message || err}`);
  }
}

function projectToEnv(provider: string, fields: Record<string, string>) {
  const def = getProvider(provider);
  if (!def) return;
  for (const [k, env] of Object.entries(def.envMap)) {
    if (fields[k] != null && fields[k] !== "") process.env[env] = fields[k];
  }
}

function clearFromEnv(provider: string) {
  const def = getProvider(provider);
  if (!def) return;
  for (const env of Object.values(def.envMap)) {
    delete process.env[env];
  }
}

// ---------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------

function safeRow(row: any) {
  let masked: Record<string, string> = {};
  try {
    const fields = decrypt(row.encryptedData);
    masked = Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, maskValue(String(v))]));
  } catch {
    masked = { _error: "decrypt-failed" };
  }
  return {
    id: row.id, kind: row.kind, provider: row.provider, label: row.label,
    mode: row.mode, isActive: row.isActive, masked,
    lastTestedAt: row.lastTestedAt, lastTestResult: row.lastTestResult,
    createdAt: row.createdAt, updatedAt: row.updatedAt,
  };
}

// Atomic activation: deactivate all other rows of this provider and activate
// the target row inside one transaction so concurrent requests can't leave
// the DB and process.env desynchronized.
async function activateRowAtomic(id: number, provider: string) {
  await db.transaction(async (tx) => {
    await tx.update(apiCredentials)
      .set({ isActive: false, updatedAt: new Date() })
      .where(and(eq(apiCredentials.provider, provider), ne(apiCredentials.id, id)));
    await tx.update(apiCredentials)
      .set({ isActive: true, updatedAt: new Date() })
      .where(eq(apiCredentials.id, id));
  });
}

export function registerApiCredentialRoutes(app: Express, auditAdmin: (req: any, action: string, target?: string, details?: any) => Promise<void>) {
  // Catalog (provider definitions for the form UI)
  app.get("/api/admin/api-credentials/catalog", adminAuthMiddleware, async (_req, res) => {
    res.json({ providers: PROVIDER_CATALOG });
  });

  // List
  app.get("/api/admin/api-credentials", adminAuthMiddleware, async (req, res) => {
    const kind = req.query.kind as string | undefined;
    const rows = await db.select().from(apiCredentials);
    const filtered = kind ? rows.filter((r) => r.kind === kind) : rows;
    filtered.sort((a, b) => (b.isActive ? 1 : 0) - (a.isActive ? 1 : 0) || a.provider.localeCompare(b.provider));
    res.json(filtered.map(safeRow));
  });

  // Auto-detect provider from a pasted secret
  app.post("/api/admin/api-credentials/detect", adminAuthMiddleware, async (req, res) => {
    const raw = String(req.body?.secret || "");
    res.json(detectProvider(raw));
  });

  // Create
  app.post("/api/admin/api-credentials", adminAuthMiddleware, async (req, res) => {
    const { kind, provider, label, mode = "test", fields = {}, activate = false } = req.body || {};
    const def = getProvider(provider);
    if (!def) return res.status(400).json({ message: "Unknown provider" });
    if (def.kind !== kind) return res.status(400).json({ message: `Provider ${provider} is ${def.kind}, not ${kind}` });
    if (!label || typeof label !== "string") return res.status(400).json({ message: "Label required" });
    for (const f of def.fields) {
      if (!f.optional && !String(fields[f.key] || "").trim()) {
        return res.status(400).json({ message: `Field "${f.label}" is required for ${def.label}` });
      }
    }
    const cleaned: Record<string, string> = {};
    for (const f of def.fields) {
      const v = String(fields[f.key] ?? "").trim();
      if (v) cleaned[f.key] = v;
    }
    const ciphertext = encrypt(cleaned);
    const [inserted] = await db.insert(apiCredentials).values({
      kind, provider, label, mode: mode === "live" ? "live" : "test",
      isActive: false, encryptedData: ciphertext, meta: {},
    }).returning();
    await auditAdmin(req, "api-credential.create", `credential:${inserted.id}`, { provider, mode, label });

    if (activate) {
      await activateRowAtomic(inserted.id, provider);
      clearFromEnv(provider);
      projectToEnv(provider, cleaned);
      await auditAdmin(req, "api-credential.activate", `credential:${inserted.id}`, { provider });
    }
    const fresh = (await db.select().from(apiCredentials).where(eq(apiCredentials.id, inserted.id)))[0];
    res.json(safeRow(fresh));
  });

  // Update
  app.patch("/api/admin/api-credentials/:id", adminAuthMiddleware, async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ message: "Bad id" });
    const [existing] = await db.select().from(apiCredentials).where(eq(apiCredentials.id, id));
    if (!existing) return res.status(404).json({ message: "Not found" });
    const def = getProvider(existing.provider);
    if (!def) return res.status(400).json({ message: "Unknown provider" });

    const { label, mode, fields } = req.body || {};
    const update: any = { updatedAt: new Date() };
    if (typeof label === "string" && label.trim()) update.label = label.trim();
    if (mode === "test" || mode === "live") update.mode = mode;
    if (fields && typeof fields === "object") {
      const current = decrypt(existing.encryptedData);
      const merged = { ...current };
      for (const f of def.fields) {
        const v = fields[f.key];
        if (typeof v === "string" && v.trim()) merged[f.key] = v.trim();
      }
      update.encryptedData = encrypt(merged);
      if (existing.isActive) {
        clearFromEnv(existing.provider);
        projectToEnv(existing.provider, merged);
      }
    }
    await db.update(apiCredentials).set(update).where(eq(apiCredentials.id, id));
    await auditAdmin(req, "api-credential.update", `credential:${id}`, { provider: existing.provider });
    const fresh = (await db.select().from(apiCredentials).where(eq(apiCredentials.id, id)))[0];
    res.json(safeRow(fresh));
  });

  // Delete
  app.delete("/api/admin/api-credentials/:id", adminAuthMiddleware, async (req, res) => {
    const id = Number(req.params.id);
    const [existing] = await db.select().from(apiCredentials).where(eq(apiCredentials.id, id));
    if (!existing) return res.status(404).json({ message: "Not found" });
    if (existing.isActive) clearFromEnv(existing.provider);
    await db.delete(apiCredentials).where(eq(apiCredentials.id, id));
    await auditAdmin(req, "api-credential.delete", `credential:${id}`, { provider: existing.provider });
    res.json({ ok: true });
  });

  // Activate
  app.post("/api/admin/api-credentials/:id/activate", adminAuthMiddleware, async (req, res) => {
    const id = Number(req.params.id);
    const [existing] = await db.select().from(apiCredentials).where(eq(apiCredentials.id, id));
    if (!existing) return res.status(404).json({ message: "Not found" });
    await activateRowAtomic(id, existing.provider);
    try {
      const fields = decrypt(existing.encryptedData);
      clearFromEnv(existing.provider);
      projectToEnv(existing.provider, fields);
    } catch {}
    await auditAdmin(req, "api-credential.activate", `credential:${id}`, { provider: existing.provider });
    res.json({ ok: true });
  });

  // Deactivate
  app.post("/api/admin/api-credentials/:id/deactivate", adminAuthMiddleware, async (req, res) => {
    const id = Number(req.params.id);
    const [existing] = await db.select().from(apiCredentials).where(eq(apiCredentials.id, id));
    if (!existing) return res.status(404).json({ message: "Not found" });
    await db.update(apiCredentials).set({ isActive: false, updatedAt: new Date() }).where(eq(apiCredentials.id, id));
    clearFromEnv(existing.provider);
    await auditAdmin(req, "api-credential.deactivate", `credential:${id}`, { provider: existing.provider });
    res.json({ ok: true });
  });

  // Test
  app.post("/api/admin/api-credentials/:id/test", adminAuthMiddleware, async (req, res) => {
    const id = Number(req.params.id);
    const [existing] = await db.select().from(apiCredentials).where(eq(apiCredentials.id, id));
    if (!existing) return res.status(404).json({ message: "Not found" });
    let fields: Record<string, string> = {};
    try { fields = decrypt(existing.encryptedData); }
    catch { return res.status(500).json({ ok: false, message: "Could not decrypt — encryption key may have changed" }); }
    const result = await testCredential(existing.provider, fields);
    await db.update(apiCredentials).set({ lastTestedAt: new Date(), lastTestResult: result, updatedAt: new Date() }).where(eq(apiCredentials.id, id));
    await auditAdmin(req, "api-credential.test", `credential:${id}`, { provider: existing.provider, ok: result.ok });
    res.json(result);
  });

  // Test arbitrary unsaved fields
  app.post("/api/admin/api-credentials/test-draft", adminAuthMiddleware, async (req, res) => {
    const { provider, fields } = req.body || {};
    if (!getProvider(provider)) return res.status(400).json({ ok: false, message: "Unknown provider" });
    const result = await testCredential(provider, fields || {});
    res.json(result);
  });
}

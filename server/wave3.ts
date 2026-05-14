import type { Express, Request, Response } from "express";
import OpenAI from "openai";
import { db } from "./db";
import { abandonedCarts, orders } from "@shared/schema";
import { desc, eq } from "drizzle-orm";
import { storage } from "./storage";
import { sendAbandonedCartNudge } from "./email";
import { adminAuthMiddleware } from "./admin-auth";

function getOpenAI(): OpenAI | null {
  try {
    const apiKey = process.env.OPENAI_API_KEY || process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
    const baseURL = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL || undefined;
    if (!apiKey) return null;
    return new OpenAI({ apiKey, baseURL });
  } catch { return null; }
}

// Lightweight identity check used by recommender (mirrors wave1.ts pattern)
async function verifyUser(req: Request) {
  const uid = Number(req.params.userId || req.query.uid);
  const email = String(req.query.email || "").toLowerCase().trim();
  if (!uid || !email) return null;
  const u = await storage.getUser(uid);
  if (!u || (u.email || "").toLowerCase() !== email) return null;
  return u;
}

// =====================================================================
// 1. AI PRODUCT RECOMMENDER — personalized "for you" carousel
// =====================================================================
async function buildPersonalizedRecommendations(userId: number, limit = 8) {
  // Pull recent purchase history
  const recentOrders = await db.select().from(orders)
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.createdAt))
    .limit(10);

  const purchasedSlugs = new Set<string>();
  const purchasedCategories = new Map<string, number>();

  for (const o of recentOrders) {
    const items = Array.isArray(o.items) ? o.items as any[] : [];
    for (const it of items) {
      if (it?.slug) purchasedSlugs.add(String(it.slug));
      if (it?.category) {
        purchasedCategories.set(it.category, (purchasedCategories.get(it.category) || 0) + 1);
      }
    }
  }

  const all = await storage.getProducts();
  const inStock = all.filter((p) => (p.stock ?? 0) > 0);

  // Score: same category +5, never purchased +3, bestseller (salesCount) bonus, in-stock required
  const candidates = inStock
    .filter((p) => !purchasedSlugs.has(p.slug || ""))
    .map((p) => {
      let score = 0;
      if (purchasedCategories.has(p.category)) score += 5 * (purchasedCategories.get(p.category) || 0);
      score += Math.min(10, Math.log10((p.salesCount || 0) + 1) * 3);
      if (p.featured) score += 2;
      return { product: p, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit * 2); // take extra; we will optionally re-rank with LLM

  // Optional LLM re-ranking (best effort; falls back to scored list)
  const openai = getOpenAI();
  let ordered = candidates.map((c) => c.product);
  if (openai && candidates.length > 1 && purchasedCategories.size > 0) {
    try {
      const userProfile = {
        recentCategories: Array.from(purchasedCategories.keys()).slice(0, 5),
        purchaseCount: recentOrders.length,
      };
      const productList = candidates.slice(0, 16).map((c, i) => `${i + 1}. ${c.product.name} (${c.product.category}) — ₹${c.product.price}`);
      const prompt = `You are a Vedic spiritual product advisor. A devotee has these recent buying patterns: ${JSON.stringify(userProfile)}.\n\nFrom this list, choose the top ${limit} products that complement their spiritual journey. Reply with ONLY a JSON array of the chosen 1-based indices, e.g. [3,1,7,2].\n\n${productList.join("\n")}`;
      const resp = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 80,
        temperature: 0.4,
      });
      const txt = resp.choices[0]?.message?.content || "";
      const m = txt.match(/\[[\d,\s]+\]/);
      if (m) {
        const indices = JSON.parse(m[0]) as number[];
        const reranked: any[] = [];
        for (const idx of indices) {
          const c = candidates[idx - 1];
          if (c) reranked.push(c.product);
        }
        for (const c of candidates) if (!reranked.includes(c.product) && reranked.length < limit) reranked.push(c.product);
        ordered = reranked;
      }
    } catch (e: any) {
      console.warn("[recommender] LLM rerank failed:", e?.message);
    }
  }
  return ordered.slice(0, limit);
}

// =====================================================================
// 2. ABANDONED CART RECOVERY SCHEDULER
// =====================================================================
const NUDGE_DELAY_MIN_MS = 2 * 60 * 60 * 1000;     // wait at least 2h after cart abandoned
const NUDGE_DELAY_MAX_MS = 72 * 60 * 60 * 1000;    // skip if older than 72h (stale)

async function runAbandonedCartRecovery(): Promise<{ checked: number; sent: number; errors: number }> {
  const all = await db.select().from(abandonedCarts).where(eq(abandonedCarts.recovered, false));
  const now = Date.now();
  let sent = 0, errors = 0;
  for (const cart of all) {
    if (cart.nudgeSentAt) continue; // already nudged
    const updated = cart.updatedAt ? new Date(cart.updatedAt).getTime() : 0;
    const age = now - updated;
    if (age < NUDGE_DELAY_MIN_MS || age > NUDGE_DELAY_MAX_MS) continue;
    if ((cart.cartTotal || 0) < 100) continue; // skip trivial carts
    try {
      const result = await sendAbandonedCartNudge({
        email: cart.email,
        customerName: cart.customerName,
        items: cart.items,
        cartTotal: cart.cartTotal,
      });
      if (result.sent) {
        await storage.markAbandonedCartNudged(cart.id);
        sent += 1;
      } else {
        errors += 1;
      }
    } catch (e: any) {
      console.warn("[abandoned-cart] nudge failed for", cart.email, e?.message);
      errors += 1;
    }
  }
  return { checked: all.length, sent, errors };
}

// =====================================================================
// 3. AI PRODUCT Q&A — answer customer questions about a product
// =====================================================================
async function answerProductQuestion(productSlugOrId: string, question: string): Promise<string> {
  const product = await storage.getProductBySlug(productSlugOrId)
    || (Number.isFinite(Number(productSlugOrId)) ? await storage.getProduct(Number(productSlugOrId)) : null);
  if (!product) throw new Error("Product not found");
  const openai = getOpenAI();
  if (!openai) throw new Error("AI service unavailable");

  const ctx = [
    `Product: ${product.name}`,
    `Category: ${product.category}`,
    `Price: ₹${product.price}`,
    `In stock: ${(product.stock ?? 0) > 0 ? "Yes" : "No"}`,
    product.description ? `Description: ${String(product.description).replace(/<[^>]+>/g, " ").slice(0, 800)}` : "",
    Array.isArray(product.highlights) && product.highlights.length ? `Highlights: ${product.highlights.join("; ")}` : "",
    Array.isArray(product.features) && product.features.length ? `Features: ${product.features.join("; ")}` : "",
    (product as any).seoFaq && Array.isArray((product as any).seoFaq)
      ? `Existing FAQ:\n${((product as any).seoFaq as any[]).map((f) => `Q: ${f.question}\nA: ${f.answer}`).join("\n")}`
      : "",
  ].filter(Boolean).join("\n");

  const resp = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "You are a knowledgeable Vedic spiritual product advisor for Vedic Tatva. Answer the customer's question warmly, concisely (2-4 sentences), and only based on the provided product context. If the answer is not in the context, suggest contacting Vedic Tatva support. Never invent specifications. Reply in the same language as the question." },
      { role: "user", content: `Product context:\n${ctx}\n\nCustomer question: ${question.trim()}` },
    ],
    max_tokens: 250,
    temperature: 0.4,
  });
  return resp.choices[0]?.message?.content?.trim() || "I'm not sure — please contact Vedic Tatva support for help.";
}

// =====================================================================
// REGISTRATION
// =====================================================================
export function registerWave3Routes(app: Express) {
  // ---- Recommender ----
  // Public fallback: trending products (for guest users) — MUST be registered before /:userId
  app.get("/api/recommendations/trending", async (req: Request, res: Response) => {
    try {
      const limit = Math.max(2, Math.min(16, Number(req.query.limit || 8)));
      const all = await storage.getProducts();
      const ranked = all
        .filter((p) => (p.stock ?? 0) > 0)
        .sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0))
        .slice(0, limit);
      res.json({ products: ranked, source: "trending" });
    } catch (e: any) {
      res.status(500).json({ error: e?.message });
    }
  });

  app.get("/api/recommendations/:userId", async (req: Request, res: Response) => {
    try {
      const u = await verifyUser(req);
      if (!u) return res.status(403).json({ error: "Unauthorized" });
      const limit = Math.max(2, Math.min(16, Number(req.query.limit || 8)));
      const products = await buildPersonalizedRecommendations(u.id, limit);
      res.json({ products, generatedAt: new Date().toISOString(), source: "personalized" });
    } catch (e: any) {
      res.status(500).json({ error: e?.message || "Recommender failed" });
    }
  });

  // ---- Abandoned cart admin: trigger + status ----
  app.post("/api/admin/abandoned-carts/run-recovery", adminAuthMiddleware, async (_req, res) => {
    try {
      const r = await runAbandonedCartRecovery();
      res.json({ ok: true, ...r });
    } catch (e: any) {
      res.status(500).json({ error: e?.message });
    }
  });

  // ---- AI Product Q&A ----
  // Light rate limit: max 8 questions/min/IP
  const qaHits = new Map<string, { n: number; resetAt: number }>();
  app.post("/api/ai/product-qa/:slug", async (req, res) => {
    try {
      const ip = (req.headers["x-forwarded-for"]?.toString().split(",")[0] || req.ip || "u").trim();
      const now = Date.now();
      const b = qaHits.get(ip);
      if (!b || b.resetAt < now) qaHits.set(ip, { n: 1, resetAt: now + 60_000 });
      else { b.n += 1; if (b.n > 8) return res.status(429).json({ error: "Too many questions, please wait a minute" }); }
      const question = String(req.body?.question || "").trim();
      if (!question || question.length < 3) return res.status(400).json({ error: "Question is too short" });
      if (question.length > 500) return res.status(400).json({ error: "Question is too long" });
      const answer = await answerProductQuestion(req.params.slug, question);
      res.json({ answer });
    } catch (e: any) {
      res.status(500).json({ error: e?.message || "Could not answer right now" });
    }
  });

  // ---- Background scheduler: every 30 min check abandoned carts (single-flight) ----
  const SCHEDULER_INTERVAL_MS = 30 * 60 * 1000;
  let recoveryRunning = false;
  setInterval(async () => {
    if (recoveryRunning) return;
    recoveryRunning = true;
    try {
      const r = await runAbandonedCartRecovery();
      if (r.sent > 0) console.log(`[abandoned-cart] sent ${r.sent} nudges, ${r.errors} errors`);
    } catch (e: any) {
      console.warn("[abandoned-cart] scheduler error:", e?.message);
    } finally {
      recoveryRunning = false;
    }
  }, SCHEDULER_INTERVAL_MS);

  // Prune qaHits map every 5 min to prevent unbounded growth
  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of qaHits.entries()) if (v.resetAt < now) qaHits.delete(k);
  }, 5 * 60 * 1000);
  console.log("[wave3] recommender + cart recovery + product Q&A registered");
}

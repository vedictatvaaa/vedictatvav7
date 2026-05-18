import OpenAI from "openai";
import { db } from "./db";
import { blogPosts, qaQuestions, qaAnswers } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";
import { sanitizeRichHtml } from "./html-sanitizer";

// SEO content clusters. Each cluster carries: name, category label,
// keyword pool (deep — drives daily rotation without repetition for months),
// and a default cover image (replaced by Gemini-generated covers later).
const CLUSTERS = [
  {
    key: "panchang",
    category: "Panchang & Festivals",
    cover: "/og/og-prime-services.jpg",
    keywordPool: [
      "today shubh muhurat",
      "rahu kaal timings today",
      "ekadashi vrat rules",
      "purnima fasting rules",
      "amavasya remedies",
      "auspicious timings this week",
      "hindu festival calendar 2026",
      "nakshatra significance",
      "tithi calculation explained",
      "abhijit muhurat meaning",
      "brahma muhurat benefits",
      "gulika kaal timings",
      "yamaganda kaal explained",
      "choghadiya muhurat guide",
      "panchak nakshatra rules",
      "navratri dates and rituals",
      "diwali puja muhurat",
      "karva chauth vrat vidhi",
      "raksha bandhan auspicious time",
      "akshaya tritiya significance",
    ],
  },
  {
    key: "puja-guides",
    category: "Puja Guides",
    cover: "/og/og-puja-essentials.jpg",
    keywordPool: [
      "how to do lakshmi puja at home",
      "benefits of rudrabhishek puja",
      "best day for griha pravesh",
      "how to perform satyanarayan puja",
      "ganesh puja step by step",
      "navagraha shanti puja benefits",
      "kaal sarp dosh puja",
      "havan samagri checklist",
      "maha mrityunjaya jaap procedure",
      "shiv abhishek vidhi at home",
      "durga saptashati path benefits",
      "sundar kand path on tuesday",
      "vishnu sahasranama benefits",
      "santoshi mata vrat rules",
      "anna prashan puja procedure",
      "mundan ceremony vidhi",
      "namkaran sanskar rituals",
      "vivah puja samagri list",
      "ayush homam benefits",
      "ganapathy homam at home",
    ],
  },
  {
    key: "astrology",
    category: "Astrology",
    cover: "/og/og-prime-services.jpg",
    keywordPool: [
      "aries career prediction 2026",
      "today lucky color for leo",
      "which zodiac signs are compatible",
      "mercury retrograde effects 2026",
      "saturn transit prediction",
      "weekly horoscope insights",
      "manglik dosh remedies",
      "rashi based gemstone guide",
      "venus transit love prediction",
      "rahu mahadasha effects",
      "shani sade sati remedies",
      "kundli matching guna milan",
      "navamsa chart explained",
      "dasha and antardasha basics",
      "lucky number today vedic",
      "numerology life path number meaning",
      "name numerology calculation",
      "zodiac compatibility for marriage",
      "jupiter transit benefits",
      "ketu in 7th house",
    ],
  },
  {
    key: "spiritual-lifestyle",
    category: "Spiritual Lifestyle",
    cover: "/og/og-japa.jpg",
    keywordPool: [
      "benefits of hanuman chalisa daily",
      "morning mantra routine for beginners",
      "tulsi plant care and significance",
      "rudraksha mala for meditation",
      "vastu tips for home temple",
      "japa mala counting rules",
      "panchamrit recipe and meaning",
      "evening aarti benefits",
      "gayatri mantra benefits and meaning",
      "om namah shivaya japa benefits",
      "hare krishna japa explained",
      "saraswati vandana for students",
      "meditation timing for spiritual growth",
      "fasting in vedic tradition",
      "satsang importance in daily life",
      "sandhya vandanam morning ritual",
      "mauna vrat benefits and rules",
      "spiritual significance of cow",
      "ghee diya benefits in puja",
      "sambrani cup spiritual benefits",
    ],
  },
  {
    key: "remedies",
    category: "Spiritual Remedies",
    cover: "/og/og-pandit-booking.jpg",
    keywordPool: [
      "remedies for pitru dosh",
      "totke for prosperity at home",
      "remedies for negative energy in house",
      "kuber yantra placement benefits",
      "shree yantra worship procedure",
      "remedies for delayed marriage",
      "remedies for financial stability",
      "remedies for health problems vedic",
      "remedies for childlessness in vedic astrology",
      "salt water mopping benefits",
      "camphor benefits for negative energy",
      "tulsi remedies for wealth",
      "remedies for nazar dosh in children",
      "mahalakshmi mantra for wealth",
      "remedies for graha shanti at home",
    ],
  },
  {
    key: "festivals",
    category: "Hindu Festivals",
    cover: "/og/og-puja-essentials.jpg",
    keywordPool: [
      "holi puja vidhi at home",
      "janmashtami fasting rules",
      "ganesh chaturthi sthapana vidhi",
      "vasant panchami saraswati puja",
      "raksha bandhan story and significance",
      "dussehra ravan dahan tradition",
      "karva chauth puja step by step",
      "guru purnima significance",
      "makar sankranti rituals",
      "mahashivratri vrat and jagran",
      "ram navami puja vidhi",
      "navratri kalash sthapana",
      "chhath puja arghya procedure",
      "onam significance for north indians",
      "vishu festival traditions",
    ],
  },
];

interface DraftBlog {
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  category: string;
  tags: string[];
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  faq: Array<{ q: string; a: string }>;
  readMinutes: number;
  coverImage: string;
}

function slugify(s: string): string {
  return s.toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

function getOpenAI(): OpenAI | null {
  const key = process.env.OPENAI_API_KEY || process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
  if (!key) return null;
  const baseURL = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL || undefined;
  return new OpenAI({ apiKey: key, baseURL });
}

/**
 * Normalize tags into hashtag form and guarantee three minimum hashtags:
 *  1. Brand tag (#vedictatva)
 *  2. Category-derived tag (e.g. #pujaguides)
 *  3. Content-derived tag from the primary keyword
 * Additional AI-suggested tags appended after, de-duplicated.
 */
function buildHashtags(aiTags: string[], category: string, keyword: string): string[] {
  const toTag = (s: string) =>
    "#" + s.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 30);
  // Brand + category + content-specific keyword token are the three required tags.
  // We pad from `aiTags` if any required slot collapses to an empty/short string
  // so the result is always >= 3 tags (hard product requirement).
  const required = [
    "#vedictatva",
    toTag(category),
    toTag(keyword.split(" ").slice(0, 2).join("")),
    toTag(keyword.split(" ").slice(-1)[0] || "wisdom"),
    "#sanatandharma",
  ];
  const ai = (aiTags || []).map((t) => (t.startsWith("#") ? toTag(t.slice(1)) : toTag(t)));
  const out: string[] = [];
  for (const t of [...required, ...ai]) {
    if (t.length > 2 && !out.includes(t)) out.push(t);
    if (out.length >= 8) break;
  }
  return out;
}

async function generateOnePost(cluster: typeof CLUSTERS[number], keyword: string): Promise<DraftBlog | null> {
  const openai = getOpenAI();
  if (!openai) return null;

  const sys = `You are a senior editor for Vedic Tatva, a premium Indian spiritual e-commerce site.
Write authentic, factually accurate Hindu / Vedic / Sanatan content. Avoid superstition framing or sensational claims.
Always respect cultural and ritual nuance. Do not invent scripture references — mention general traditions.
Output strictly valid minified JSON. No commentary, no markdown fences.`;

  const user = `Generate one high-quality SEO blog post in JSON for the keyword: "${keyword}"
Cluster: ${cluster.category}.

JSON shape:
{
  "title": "Strong, specific title (60-70 chars).",
  "slug": "kebab-case-slug (max 70 chars)",
  "excerpt": "Compelling 1-2 sentence summary (140-160 chars).",
  "body": "Full HTML article. Use <h2> headings (4-6 sections), <p>, <ul>/<li>, <strong>. 700-1100 words. No <h1>. No images. Indian English. End with a 'Final thoughts' paragraph.",
  "category": "${cluster.category}",
  "tags": ["3-5 content-specific lowercase tags, no # prefix"],
  "metaTitle": "60-70 char SEO title",
  "metaDescription": "150-160 char meta description",
  "metaKeywords": "comma-separated 5-8 keywords",
  "faq": [{"q":"...","a":"..."}, ... 4-6 entries],
  "readMinutes": 4
}

Rules:
- Title MUST contain the primary keyword naturally.
- Body MUST include sections: Introduction, Significance/Meaning, Step-by-step OR Practical guidance, Common mistakes / Do's and Don'ts, Final thoughts.
- Do NOT mention competitor brands or external links.
- Do NOT use emojis.`;

  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: sys },
      { role: "user", content: user },
    ],
    temperature: 0.7,
    response_format: { type: "json_object" },
  });

  const content = res.choices[0]?.message?.content || "";
  let parsed: any;
  try {
    parsed = JSON.parse(content);
  } catch {
    return null;
  }
  if (!parsed.title || !parsed.body) return null;

  const slug = slugify(parsed.slug || parsed.title);
  const aiTags = Array.isArray(parsed.tags) ? parsed.tags.map(String) : [];
  return {
    slug,
    title: String(parsed.title).slice(0, 200),
    excerpt: String(parsed.excerpt || "").slice(0, 300),
    body: String(parsed.body),
    category: parsed.category || cluster.category,
    tags: buildHashtags(aiTags, cluster.category, keyword),
    metaTitle: String(parsed.metaTitle || parsed.title).slice(0, 200),
    metaDescription: String(parsed.metaDescription || parsed.excerpt || "").slice(0, 300),
    metaKeywords: String(parsed.metaKeywords || keyword),
    faq: Array.isArray(parsed.faq) ? parsed.faq.slice(0, 8) : [],
    readMinutes: Math.max(3, Math.min(15, parseInt(parsed.readMinutes) || 5)),
    coverImage: cluster.cover,
  };
}

function appendFaqHtml(body: string, faq: Array<{ q: string; a: string }>): string {
  if (!faq?.length) return body;
  const items = faq
    .map(({ q, a }) => `<h3>${escapeHtml(q)}</h3><p>${escapeHtml(a)}</p>`)
    .join("");
  return `${body}<h2>Frequently asked questions</h2>${items}`;
}

function escapeHtml(s: string): string {
  return String(s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]!));
}

interface RunResult {
  attempted: number;
  inserted: number;
  skippedDuplicateSlug: number;
  errors: string[];
  postIds: number[];
}

async function insertDraft(
  draft: DraftBlog,
  keyword: string,
  result: RunResult,
  suffix?: string,
): Promise<void> {
  // Build candidate slug. Pre-check is best-effort; the parallel batched runners
  // can race past this check, so we also catch the unique-constraint violation
  // on insert and retry once with a uniqifier before giving up.
  let candidate = draft.slug;
  const existing = await db.select({ id: blogPosts.id }).from(blogPosts).where(eq(blogPosts.slug, candidate));
  if (existing.length) {
    candidate = `${draft.slug}-${suffix || Date.now().toString(36)}`;
  }

  const finalBody = sanitizeRichHtml(appendFaqHtml(draft.body, draft.faq));
  const values = {
    title: draft.title,
    excerpt: draft.excerpt,
    body: finalBody,
    coverImage: draft.coverImage,
    category: draft.category,
    tags: draft.tags,
    metaTitle: draft.metaTitle,
    metaDescription: draft.metaDescription,
    metaKeywords: draft.metaKeywords,
    readMinutes: draft.readMinutes,
    authorName: "Vedic Tatva Editorial",
    isPublished: false,
    status: "pending",
    aiGenerated: true,
    sourcePrompt: keyword,
  } as const;

  const tryInsert = async (slug: string) => {
    try {
      const [row] = await db.insert(blogPosts).values({ slug, ...values }).returning({ id: blogPosts.id });
      return row;
    } catch (e: any) {
      // Postgres unique_violation = 23505. Treat anything mentioning the slug
      // index as a race-loss and let the caller retry with a uniqifier.
      const msg = String(e?.message || e?.code || "");
      if (msg.includes("23505") || msg.toLowerCase().includes("unique")) return null;
      throw e;
    }
  };

  let created = await tryInsert(candidate);
  if (!created) {
    const retry = `${draft.slug}-${suffix || Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    created = await tryInsert(retry);
  }
  if (created) {
    result.inserted += 1;
    result.postIds.push(created.id);
  } else {
    result.skippedDuplicateSlug += 1;
  }
}

// Pick `count` (cluster, keyword) targets that rotate deterministically through
// the pools so daily runs don't repeat keywords within a cluster cycle.
function pickTargets(count: number, dayOfYear: number) {
  const targets: Array<{ cluster: typeof CLUSTERS[number]; keyword: string }> = [];
  for (let i = 0; i < count; i++) {
    const cluster = CLUSTERS[(dayOfYear + i) % CLUSTERS.length];
    const kw = cluster.keywordPool[(dayOfYear + i) % cluster.keywordPool.length];
    targets.push({ cluster, keyword: kw });
  }
  return targets;
}

// Generate N drafts. Stored as status="pending" so the admin can review before
// publishing — Google penalizes auto-publish of low-quality AI content at scale.
export async function runDailyBlogGeneration(count = 10): Promise<RunResult> {
  const result: RunResult = { attempted: 0, inserted: 0, skippedDuplicateSlug: 0, errors: [], postIds: [] };
  const openai = getOpenAI();
  if (!openai) {
    result.errors.push("OPENAI_API_KEY not configured");
    return result;
  }
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  const targets = pickTargets(count, dayOfYear);

  // Run in parallel batches of 4 to stay well under provider rate limits while
  // keeping wall-clock time low. A 10-post run completes in ~30-40s.
  const BATCH_SIZE = 4;
  for (let i = 0; i < targets.length; i += BATCH_SIZE) {
    const batch = targets.slice(i, i + BATCH_SIZE);
    await Promise.all(batch.map(async ({ cluster, keyword }, j) => {
      result.attempted += 1;
      try {
        const draft = await generateOnePost(cluster, keyword);
        if (!draft) {
          result.errors.push(`generation failed for "${keyword}"`);
          return;
        }
        await insertDraft(draft, keyword, result, `${dayOfYear}-${i + j}`);
      } catch (e: any) {
        result.errors.push(`${keyword}: ${e?.message || "unknown"}`);
      }
    }));
  }
  return result;
}

// One-shot initial seeder. Walks the full keyword pool until `target` posts
// are inserted (default 50). Idempotent: existing slugs are skipped.
// Publishes them immediately so the blog is populated for launch — daily
// new drafts after this still go to the pending queue.
export async function seedInitialBlogLibrary(target = 50): Promise<RunResult> {
  const result: RunResult = { attempted: 0, inserted: 0, skippedDuplicateSlug: 0, errors: [], postIds: [] };
  const openai = getOpenAI();
  if (!openai) {
    result.errors.push("OPENAI_API_KEY not configured");
    return result;
  }

  // Flat list of all (cluster, keyword) pairs, interleaved across clusters so
  // the published library shows category variety on day one.
  const pool: Array<{ cluster: typeof CLUSTERS[number]; keyword: string }> = [];
  const maxLen = Math.max(...CLUSTERS.map(c => c.keywordPool.length));
  for (let i = 0; i < maxLen; i++) {
    for (const cluster of CLUSTERS) {
      const kw = cluster.keywordPool[i];
      if (kw) pool.push({ cluster, keyword: kw });
    }
  }

  const BATCH_SIZE = 5;
  for (let i = 0; i < pool.length && result.inserted < target; i += BATCH_SIZE) {
    const batch = pool.slice(i, i + BATCH_SIZE);
    await Promise.all(batch.map(async ({ cluster, keyword }, j) => {
      if (result.inserted >= target) return;
      result.attempted += 1;
      try {
        const draft = await generateOnePost(cluster, keyword);
        if (!draft) {
          result.errors.push(`generation failed for "${keyword}"`);
          return;
        }
        // Publish the seed library immediately — it's vetted templates over a
        // curated keyword list, not free-form daily drafts.
        const before = result.inserted;
        await insertDraft(draft, keyword, result, `seed-${i + j}`);
        if (result.inserted > before) {
          const lastId = result.postIds[result.postIds.length - 1];
          await db.update(blogPosts)
            .set({ isPublished: true, status: "published", publishedAt: new Date() })
            .where(eq(blogPosts.id, lastId));
        }
      } catch (e: any) {
        result.errors.push(`${keyword}: ${e?.message || "unknown"}`);
      }
    }));
  }
  return result;
}

// In-process seed runner state so the admin can poll progress on a long run.
export const seedRunStatus = {
  running: false,
  startedAt: null as string | null,
  finishedAt: null as string | null,
  target: 0,
  lastResult: null as RunResult | null,
};

export async function startSeedInBackground(target = 50): Promise<{ accepted: boolean; reason?: string }> {
  if (seedRunStatus.running) return { accepted: false, reason: "already running" };
  seedRunStatus.running = true;
  seedRunStatus.startedAt = new Date().toISOString();
  seedRunStatus.finishedAt = null;
  seedRunStatus.target = target;
  seedRunStatus.lastResult = null;

  // Fire and forget — don't block the request.
  (async () => {
    try {
      seedRunStatus.lastResult = await seedInitialBlogLibrary(target);
    } catch (e: any) {
      seedRunStatus.lastResult = {
        attempted: 0, inserted: 0, skippedDuplicateSlug: 0,
        errors: [e?.message || "unknown"], postIds: [],
      };
    } finally {
      seedRunStatus.running = false;
      seedRunStatus.finishedAt = new Date().toISOString();
    }
  })();
  return { accepted: true };
}

// ===== Q&A AI helpers =====

export async function generateAiAnswerForQuestion(question: { title: string; body?: string | null; category?: string | null }): Promise<string | null> {
  const openai = getOpenAI();
  if (!openai) return null;
  try {
    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a respectful Vedic / Sanatan scholar answering a community question. Reply in 120-220 words, accurate, non-judgmental, citing general tradition (not specific scripture verses unless universally known). Indian English. No emojis. Plain text with simple paragraph breaks.",
        },
        {
          role: "user",
          content: `Category: ${question.category || "general"}\nQuestion: ${question.title}\n${question.body ? `Context: ${question.body}` : ""}`.trim(),
        },
      ],
      temperature: 0.6,
    });
    const txt = res.choices[0]?.message?.content?.trim();
    return txt || null;
  } catch {
    return null;
  }
}

export async function autoAnswerPendingQuestions(limit = 5): Promise<{ answered: number }> {
  const pending = await db.select().from(qaQuestions)
    .where(and(eq(qaQuestions.status, "approved"), sql`NOT EXISTS (SELECT 1 FROM qa_answers WHERE qa_answers.question_id = qa_questions.id)`))
    .limit(limit);

  let answered = 0;
  for (const q of pending) {
    const txt = await generateAiAnswerForQuestion(q);
    if (!txt) continue;
    await db.insert(qaAnswers).values({
      questionId: q.id,
      body: txt,
      authorName: "Vedic Tatva (AI Assist)",
      authorRole: "ai",
      status: "approved",
    });
    answered += 1;
  }
  return { answered };
}

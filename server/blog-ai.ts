import OpenAI from "openai";
import { db } from "./db";
import { blogPosts, qaQuestions, qaAnswers, pujaTypes } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";
import { sanitizeRichHtml } from "./html-sanitizer";

// SEO content clusters from the user's brief.
// Each cluster carries: name, sample categories, keyword seeds.
const CLUSTERS = [
  {
    key: "panchang",
    category: "Panchang & Festivals",
    keywordPool: [
      "today shubh muhurat",
      "rahu kaal timings today",
      "ekadashi vrat rules",
      "purnima fasting rules",
      "amavasya remedies",
      "auspicious timings this week",
      "hindu festival calendar",
      "nakshatra significance",
    ],
  },
  {
    key: "puja-guides",
    category: "Puja Guides",
    keywordPool: [
      "how to do lakshmi puja at home",
      "benefits of rudrabhishek puja",
      "best day for griha pravesh",
      "how to perform satyanarayan puja",
      "ganesh puja step by step",
      "navagraha shanti puja benefits",
      "kaal sarp dosh puja",
      "havan samagri checklist",
    ],
  },
  {
    key: "astrology",
    category: "Astrology",
    keywordPool: [
      "today lucky color for leo",
      "which zodiac signs are compatible",
      "mercury retrograde effects",
      "saturn transit prediction",
      "weekly horoscope insights",
      "manglik dosh remedies",
      "rashi based gemstone guide",
      "venus transit love prediction",
    ],
  },
  {
    key: "spiritual-lifestyle",
    category: "Spiritual Lifestyle",
    keywordPool: [
      "benefits of hanuman chalisa",
      "morning mantra routine",
      "tulsi plant care and significance",
      "rudraksha mala for meditation",
      "vastu tips for home temple",
      "japa mala counting rules",
      "panchamrit recipe and meaning",
      "evening aarti benefits",
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
}

function slugify(s: string): string {
  return s.toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

function pickKeyword(cluster: typeof CLUSTERS[number], dayOfYear: number): string {
  return cluster.keywordPool[(dayOfYear + cluster.key.length) % cluster.keywordPool.length];
}

function getOpenAI(): OpenAI | null {
  const key = process.env.OPENAI_API_KEY || process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
  if (!key) return null;
  return new OpenAI({ apiKey: key });
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
  "tags": ["3-5 lowercase tags"],
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
  return {
    slug,
    title: String(parsed.title).slice(0, 200),
    excerpt: String(parsed.excerpt || "").slice(0, 300),
    body: String(parsed.body),
    category: parsed.category || cluster.category,
    tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 8).map(String) : [],
    metaTitle: String(parsed.metaTitle || parsed.title).slice(0, 200),
    metaDescription: String(parsed.metaDescription || parsed.excerpt || "").slice(0, 300),
    metaKeywords: String(parsed.metaKeywords || keyword),
    faq: Array.isArray(parsed.faq) ? parsed.faq.slice(0, 8) : [],
    readMinutes: Math.max(3, Math.min(15, parseInt(parsed.readMinutes) || 5)),
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

// Generate N drafts (one per cluster up to N). Stored as status="pending" so the
// admin can review before publishing — Google penalizes auto-publish at scale.
export async function runDailyBlogGeneration(count = 3): Promise<RunResult> {
  const result: RunResult = { attempted: 0, inserted: 0, skippedDuplicateSlug: 0, errors: [], postIds: [] };
  const openai = getOpenAI();
  if (!openai) {
    result.errors.push("OPENAI_API_KEY not configured");
    return result;
  }
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);

  for (let i = 0; i < count; i++) {
    const cluster = CLUSTERS[(dayOfYear + i) % CLUSTERS.length];
    const keyword = pickKeyword(cluster, dayOfYear + i);
    result.attempted += 1;
    try {
      const draft = await generateOnePost(cluster, keyword);
      if (!draft) {
        result.errors.push(`generation failed for "${keyword}"`);
        continue;
      }

      // Bump slug if it already exists.
      let candidate = draft.slug;
      const existing = await db.select({ id: blogPosts.id }).from(blogPosts).where(eq(blogPosts.slug, candidate));
      if (existing.length) {
        candidate = `${draft.slug}-${dayOfYear}-${i}`;
        const second = await db.select({ id: blogPosts.id }).from(blogPosts).where(eq(blogPosts.slug, candidate));
        if (second.length) {
          result.skippedDuplicateSlug += 1;
          continue;
        }
      }

      const finalBody = sanitizeRichHtml(appendFaqHtml(draft.body, draft.faq));
      const [created] = await db.insert(blogPosts).values({
        slug: candidate,
        title: draft.title,
        excerpt: draft.excerpt,
        body: finalBody,
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
      }).returning({ id: blogPosts.id });
      if (created) {
        result.inserted += 1;
        result.postIds.push(created.id);
      }
    } catch (e: any) {
      result.errors.push(`${keyword}: ${e?.message || "unknown"}`);
    }
  }
  return result;
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

// Self-answer pending Q&A questions when admin enables auto-answer.
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

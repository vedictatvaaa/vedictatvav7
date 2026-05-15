import type { Express, Request, Response } from "express";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { db } from "./db";
import { adminAuthMiddleware } from "./admin-auth";
import {
  blogPosts, blogComments, qaQuestions, qaAnswers, pujaTypes, pujaMuhurats,
  insertBlogCommentSchema, insertQaQuestionSchema, insertQaAnswerSchema,
  insertPujaTypeSchema,
} from "@shared/schema";
import { and, asc, desc, eq, isNull, or, sql, inArray } from "drizzle-orm";
import { runDailyBlogGeneration, autoAnswerPendingQuestions, generateAiAnswerForQuestion } from "./blog-ai";
import { regenerateMuhuratsForYear, regenerateForCurrentAndNextYear, computeMuhuratsForPuja } from "./muhurat-engine";
import { sanitizeRichHtml } from "./html-sanitizer";

const PUJA_HTML_FIELDS = ["whyPerformed", "storyMyth", "howCelebrated", "ethics", "benefits"] as const;
function sanitizePujaPayload<T extends Record<string, any>>(body: T): T {
  const out: any = { ...body };
  for (const f of PUJA_HTML_FIELDS) {
    if (typeof out[f] === "string") out[f] = sanitizeRichHtml(out[f]);
  }
  return out;
}

const publicWrite = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: (req) => ipKeyGenerator(req.ip || "unknown"),
  message: { message: "Too many submissions. Please try again later." },
});

function clientIp(req: Request): string {
  return (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.ip || "unknown";
}

function slugify(s: string): string {
  return s.toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

function isLikelySpam(text: string): boolean {
  const t = String(text || "").toLowerCase();
  if (t.length < 4) return true;
  // crude link spam guard
  const linkCount = (t.match(/https?:\/\//g) || []).length;
  if (linkCount > 2) return true;
  if (/\b(viagra|casino|porn|loan|crypto pump|seo backlinks)\b/.test(t)) return true;
  return false;
}

function publicComment(c: typeof blogComments.$inferSelect) {
  return {
    id: c.id,
    postId: c.postId,
    parentId: c.parentId,
    name: c.name,
    body: c.body,
    createdAt: c.createdAt,
  };
}

function publicQuestion(q: typeof qaQuestions.$inferSelect) {
  return {
    id: q.id,
    slug: q.slug,
    title: q.title,
    body: q.body,
    category: q.category,
    tags: q.tags,
    postId: q.postId,
    pujaSlug: q.pujaSlug,
    authorName: q.authorName,
    isFeatured: q.isFeatured,
    viewCount: q.viewCount,
    upvotes: q.upvotes,
    createdAt: q.createdAt,
    metaTitle: q.metaTitle,
    metaDescription: q.metaDescription,
  };
}

function publicAnswer(a: typeof qaAnswers.$inferSelect) {
  return {
    id: a.id,
    questionId: a.questionId,
    body: a.body,
    authorName: a.authorName,
    authorRole: a.authorRole,
    isAccepted: a.isAccepted,
    upvotes: a.upvotes,
    createdAt: a.createdAt,
  };
}

export function registerContentRoutes(app: Express) {
  // ============================================================
  // P1 — AI Blog Generation (admin queue)
  // ============================================================

  // Admin: list blog posts filtered by status (default: pending)
  app.get("/api/admin/blog-queue", adminAuthMiddleware, async (req, res) => {
    try {
      const status = String(req.query.status || "pending");
      const rows = await db.select().from(blogPosts)
        .where(eq(blogPosts.status, status))
        .orderBy(desc(blogPosts.createdAt));
      res.json(rows);
    } catch (e: any) {
      res.status(500).json({ message: e?.message || "Failed to load queue" });
    }
  });

  // Admin: generate N posts now (bypasses cron). Default 3.
  app.post("/api/admin/blog-queue/generate", adminAuthMiddleware, async (req, res) => {
    const count = Math.max(1, Math.min(8, parseInt(String(req.body?.count || "3")) || 3));
    try {
      const result = await runDailyBlogGeneration(count);
      res.json({ success: true, ...result });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e?.message || "Generation failed" });
    }
  });

  // Admin: approve a draft → publish it
  app.post("/api/admin/blog-queue/:id/approve", adminAuthMiddleware, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const [post] = await db.update(blogPosts)
        .set({ status: "published", isPublished: true, publishedAt: new Date() })
        .where(eq(blogPosts.id, id))
        .returning();
      if (!post) return res.status(404).json({ message: "Not found" });
      res.json(post);
    } catch (e: any) {
      res.status(500).json({ message: e?.message || "Failed" });
    }
  });

  // Admin: reject a draft (kept in DB for audit; not publicly visible)
  app.post("/api/admin/blog-queue/:id/reject", adminAuthMiddleware, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const [post] = await db.update(blogPosts)
        .set({ status: "rejected", isPublished: false })
        .where(eq(blogPosts.id, id))
        .returning();
      if (!post) return res.status(404).json({ message: "Not found" });
      res.json(post);
    } catch (e: any) {
      res.status(500).json({ message: e?.message || "Failed" });
    }
  });

  // ============================================================
  // P2 — Blog Comments
  // ============================================================

  // Public: list approved comments for a blog post
  app.get("/api/blog-posts/:slug/comments", async (req, res) => {
    try {
      const [post] = await db.select({ id: blogPosts.id }).from(blogPosts).where(eq(blogPosts.slug, req.params.slug));
      if (!post) return res.json([]);
      const rows = await db.select().from(blogComments)
        .where(and(eq(blogComments.postId, post.id), eq(blogComments.status, "approved")))
        .orderBy(asc(blogComments.createdAt));
      res.json(rows.map(publicComment));
    } catch (e: any) {
      res.status(500).json({ message: e?.message || "Failed" });
    }
  });

  // Public: post a comment on a blog post (held for moderation)
  app.post("/api/blog-posts/:slug/comments", publicWrite, async (req, res) => {
    try {
      // Honeypot — bots fill this hidden field
      if (req.body?.website) return res.status(202).json({ message: "Submitted" });
      const [post] = await db.select({ id: blogPosts.id }).from(blogPosts).where(eq(blogPosts.slug, req.params.slug));
      if (!post) return res.status(404).json({ message: "Post not found" });

      const parsed = insertBlogCommentSchema.safeParse({ ...req.body, postId: post.id });
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid input", errors: parsed.error.flatten() });
      }
      if (isLikelySpam(parsed.data.body)) {
        return res.status(202).json({ message: "Submitted" });
      }

      const [created] = await db.insert(blogComments).values({
        postId: post.id,
        parentId: parsed.data.parentId || null,
        name: parsed.data.name.slice(0, 80),
        email: parsed.data.email.toLowerCase().trim().slice(0, 200),
        body: parsed.data.body.slice(0, 2000),
        status: "pending",
        ipAddress: clientIp(req),
      }).returning({ id: blogComments.id });
      res.status(202).json({ id: created?.id, message: "Thanks — your comment will appear after review." });
    } catch (e: any) {
      res.status(500).json({ message: e?.message || "Failed" });
    }
  });

  // Admin: list pending comments (moderation queue)
  app.get("/api/admin/blog-comments", adminAuthMiddleware, async (req, res) => {
    try {
      const status = String(req.query.status || "pending");
      const rows = await db.select().from(blogComments)
        .where(eq(blogComments.status, status))
        .orderBy(desc(blogComments.createdAt))
        .limit(200);
      res.json(rows);
    } catch (e: any) {
      res.status(500).json({ message: e?.message || "Failed" });
    }
  });

  // Admin: moderate a comment
  app.patch("/api/admin/blog-comments/:id", adminAuthMiddleware, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const status = String(req.body?.status || "approved");
      if (!["approved", "rejected", "pending"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      const [updated] = await db.update(blogComments)
        .set({ status })
        .where(eq(blogComments.id, id))
        .returning();
      if (!updated) return res.status(404).json({ message: "Not found" });
      res.json(updated);
    } catch (e: any) {
      res.status(500).json({ message: e?.message || "Failed" });
    }
  });

  app.delete("/api/admin/blog-comments/:id", adminAuthMiddleware, async (req, res) => {
    try {
      await db.delete(blogComments).where(eq(blogComments.id, parseInt(req.params.id)));
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ message: e?.message || "Failed" });
    }
  });

  // ============================================================
  // P2 — Community Q&A
  // ============================================================

  // Public: list approved questions (with answer counts)
  app.get("/api/qa", async (req, res) => {
    try {
      const category = req.query.category ? String(req.query.category) : null;
      const limit = Math.min(50, parseInt(String(req.query.limit || "20")) || 20);
      const where = category
        ? and(eq(qaQuestions.status, "approved"), eq(qaQuestions.category, category))
        : eq(qaQuestions.status, "approved");
      const rows = await db.select().from(qaQuestions).where(where)
        .orderBy(desc(qaQuestions.isFeatured), desc(qaQuestions.upvotes), desc(qaQuestions.createdAt))
        .limit(limit);
      const ids = rows.map((r) => r.id);
      const counts = new Map<number, number>();
      if (ids.length) {
        const countRows = await db
          .select({ qid: qaAnswers.questionId, c: sql<number>`count(*)::int` })
          .from(qaAnswers)
          .where(and(eq(qaAnswers.status, "approved"), inArray(qaAnswers.questionId, ids)))
          .groupBy(qaAnswers.questionId);
        for (const r of countRows) counts.set(r.qid as number, Number(r.c) || 0);
      }
      res.json(rows.map((q) => ({ ...publicQuestion(q), answerCount: counts.get(q.id) || 0 })));
    } catch (e: any) {
      res.status(500).json({ message: e?.message || "Failed" });
    }
  });

  // Public: read one question with its approved answers
  app.get("/api/qa/:slug", async (req, res) => {
    try {
      const [q] = await db.select().from(qaQuestions).where(eq(qaQuestions.slug, req.params.slug));
      if (!q || q.status !== "approved") return res.status(404).json({ message: "Not found" });
      const answers = await db.select().from(qaAnswers)
        .where(and(eq(qaAnswers.questionId, q.id), eq(qaAnswers.status, "approved")))
        .orderBy(desc(qaAnswers.isAccepted), desc(qaAnswers.upvotes), asc(qaAnswers.createdAt));
      // increment view count (best-effort)
      db.update(qaQuestions).set({ viewCount: sql`${qaQuestions.viewCount} + 1` }).where(eq(qaQuestions.id, q.id)).catch(() => {});
      res.json({ question: publicQuestion(q), answers: answers.map(publicAnswer) });
    } catch (e: any) {
      res.status(500).json({ message: e?.message || "Failed" });
    }
  });

  // Public: submit a question (held for moderation)
  app.post("/api/qa", publicWrite, async (req, res) => {
    try {
      if (req.body?.website) return res.status(202).json({ message: "Submitted" });
      const title = String(req.body?.title || "").trim();
      if (title.length < 10 || title.length > 200) {
        return res.status(400).json({ message: "Question title must be 10-200 characters" });
      }
      if (isLikelySpam(title) || isLikelySpam(req.body?.body || "")) {
        return res.status(202).json({ message: "Submitted" });
      }
      let slug = slugify(title);
      // ensure unique
      const existing = await db.select({ id: qaQuestions.id }).from(qaQuestions).where(eq(qaQuestions.slug, slug));
      if (existing.length) slug = `${slug}-${Date.now().toString(36).slice(-5)}`;

      const parsed = insertQaQuestionSchema.safeParse({
        slug,
        title,
        body: req.body?.body || null,
        category: req.body?.category || "general",
        tags: Array.isArray(req.body?.tags) ? req.body.tags.slice(0, 5).map(String) : [],
        postId: req.body?.postId ? parseInt(req.body.postId) : null,
        pujaSlug: req.body?.pujaSlug || null,
        authorName: (req.body?.authorName || "Anonymous").toString().slice(0, 80),
        authorEmail: req.body?.authorEmail || null,
        isFeatured: false,
        metaTitle: null,
        metaDescription: null,
      });
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid input", errors: parsed.error.flatten() });
      }

      const [created] = await db.insert(qaQuestions).values({
        ...parsed.data,
        status: "pending",
        ipAddress: clientIp(req),
      }).returning();
      res.status(202).json({ id: created?.id, slug: created?.slug, message: "Thanks — your question will appear after review." });
    } catch (e: any) {
      res.status(500).json({ message: e?.message || "Failed" });
    }
  });

  // Public: submit an answer (held for moderation)
  app.post("/api/qa/:slug/answers", publicWrite, async (req, res) => {
    try {
      if (req.body?.website) return res.status(202).json({ message: "Submitted" });
      const [q] = await db.select({ id: qaQuestions.id }).from(qaQuestions).where(eq(qaQuestions.slug, req.params.slug));
      if (!q) return res.status(404).json({ message: "Question not found" });
      const body = String(req.body?.body || "").trim();
      if (body.length < 20 || body.length > 4000) {
        return res.status(400).json({ message: "Answer must be 20-4000 characters" });
      }
      if (isLikelySpam(body)) return res.status(202).json({ message: "Submitted" });
      const [created] = await db.insert(qaAnswers).values({
        questionId: q.id,
        body: body.slice(0, 4000),
        authorName: (req.body?.authorName || "Anonymous").toString().slice(0, 80),
        authorEmail: req.body?.authorEmail || null,
        authorRole: "user",
        status: "pending",
        ipAddress: clientIp(req),
      }).returning({ id: qaAnswers.id });
      res.status(202).json({ id: created?.id, message: "Thanks — your answer will appear after review." });
    } catch (e: any) {
      res.status(500).json({ message: e?.message || "Failed" });
    }
  });

  // Admin: Q&A moderation
  app.get("/api/admin/qa/questions", adminAuthMiddleware, async (req, res) => {
    try {
      const status = String(req.query.status || "pending");
      const rows = await db.select().from(qaQuestions).where(eq(qaQuestions.status, status))
        .orderBy(desc(qaQuestions.createdAt)).limit(200);
      res.json(rows);
    } catch (e: any) {
      res.status(500).json({ message: e?.message || "Failed" });
    }
  });

  app.get("/api/admin/qa/answers", adminAuthMiddleware, async (req, res) => {
    try {
      const status = String(req.query.status || "pending");
      const rows = await db.select().from(qaAnswers).where(eq(qaAnswers.status, status))
        .orderBy(desc(qaAnswers.createdAt)).limit(200);
      res.json(rows);
    } catch (e: any) {
      res.status(500).json({ message: e?.message || "Failed" });
    }
  });

  app.patch("/api/admin/qa/questions/:id", adminAuthMiddleware, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const patch: Record<string, unknown> = {};
      if (req.body?.status) patch.status = req.body.status;
      if (typeof req.body?.isFeatured === "boolean") patch.isFeatured = req.body.isFeatured;
      if (req.body?.title) patch.title = req.body.title;
      if (req.body?.body !== undefined) patch.body = req.body.body;
      if (req.body?.category) patch.category = req.body.category;
      if (req.body?.metaTitle !== undefined) patch.metaTitle = req.body.metaTitle;
      if (req.body?.metaDescription !== undefined) patch.metaDescription = req.body.metaDescription;
      const [u] = await db.update(qaQuestions).set(patch).where(eq(qaQuestions.id, id)).returning();
      res.json(u);
    } catch (e: any) {
      res.status(500).json({ message: e?.message || "Failed" });
    }
  });

  app.patch("/api/admin/qa/answers/:id", adminAuthMiddleware, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const patch: Record<string, unknown> = {};
      if (req.body?.status) patch.status = req.body.status;
      if (typeof req.body?.isAccepted === "boolean") patch.isAccepted = req.body.isAccepted;
      if (req.body?.body) patch.body = req.body.body;
      const [u] = await db.update(qaAnswers).set(patch).where(eq(qaAnswers.id, id)).returning();
      res.json(u);
    } catch (e: any) {
      res.status(500).json({ message: e?.message || "Failed" });
    }
  });

  app.delete("/api/admin/qa/questions/:id", adminAuthMiddleware, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await db.delete(qaAnswers).where(eq(qaAnswers.questionId, id));
      await db.delete(qaQuestions).where(eq(qaQuestions.id, id));
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ message: e?.message || "Failed" });
    }
  });

  app.delete("/api/admin/qa/answers/:id", adminAuthMiddleware, async (req, res) => {
    try {
      await db.delete(qaAnswers).where(eq(qaAnswers.id, parseInt(req.params.id)));
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ message: e?.message || "Failed" });
    }
  });

  // Admin: post an authoritative answer to a question
  app.post("/api/admin/qa/questions/:id/answer", adminAuthMiddleware, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const body = String(req.body?.body || "").trim();
      if (body.length < 5) return res.status(400).json({ message: "Answer body required" });
      const [created] = await db.insert(qaAnswers).values({
        questionId: id,
        body,
        authorName: req.body?.authorName || "Vedic Tatva Editorial",
        authorRole: "admin",
        isAccepted: !!req.body?.isAccepted,
        status: "approved",
      }).returning();
      res.json(created);
    } catch (e: any) {
      res.status(500).json({ message: e?.message || "Failed" });
    }
  });

  // Admin: ask AI to draft an answer to a question (returns text — does not save)
  app.post("/api/admin/qa/questions/:id/ai-draft", adminAuthMiddleware, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const [q] = await db.select().from(qaQuestions).where(eq(qaQuestions.id, id));
      if (!q) return res.status(404).json({ message: "Not found" });
      const txt = await generateAiAnswerForQuestion(q);
      if (!txt) return res.status(503).json({ message: "AI provider not configured or failed" });
      res.json({ body: txt });
    } catch (e: any) {
      res.status(500).json({ message: e?.message || "Failed" });
    }
  });

  app.post("/api/admin/qa/auto-answer", adminAuthMiddleware, async (req, res) => {
    try {
      const limit = Math.max(1, Math.min(20, parseInt(String(req.body?.limit || "5")) || 5));
      const result = await autoAnswerPendingQuestions(limit);
      res.json({ success: true, ...result });
    } catch (e: any) {
      res.status(500).json({ message: e?.message || "Failed" });
    }
  });

  // ============================================================
  // P3 — Puja Library
  // ============================================================

  // Public: list pujas
  app.get("/api/pujas", async (req, res) => {
    try {
      const category = req.query.category ? String(req.query.category) : null;
      const where = category
        ? and(eq(pujaTypes.isPublished, true), eq(pujaTypes.category, category))
        : eq(pujaTypes.isPublished, true);
      const rows = await db.select().from(pujaTypes).where(where)
        .orderBy(asc(pujaTypes.displayOrder), asc(pujaTypes.name));
      // strip muhuratRules from public payload (admin-only)
      res.json(rows.map(({ muhuratRules: _r, ...rest }) => rest));
    } catch (e: any) {
      res.status(500).json({ message: e?.message || "Failed" });
    }
  });

  // Public: read one puja with current-year + next-year muhurats
  app.get("/api/pujas/:slug", async (req, res) => {
    try {
      const [puja] = await db.select().from(pujaTypes).where(eq(pujaTypes.slug, req.params.slug));
      if (!puja || !puja.isPublished) return res.status(404).json({ message: "Not found" });
      const year = new Date().getFullYear();
      const muhurats = await db.select().from(pujaMuhurats)
        .where(and(eq(pujaMuhurats.pujaId, puja.id), or(eq(pujaMuhurats.year, year), eq(pujaMuhurats.year, year + 1))!))
        .orderBy(asc(pujaMuhurats.year));
      // increment view (best effort)
      db.update(pujaTypes).set({ viewCount: sql`${pujaTypes.viewCount} + 1` }).where(eq(pujaTypes.id, puja.id)).catch(() => {});
      // related Q&A by pujaSlug
      const questions = await db.select().from(qaQuestions)
        .where(and(eq(qaQuestions.pujaSlug, puja.slug), eq(qaQuestions.status, "approved")))
        .orderBy(desc(qaQuestions.upvotes), desc(qaQuestions.createdAt))
        .limit(8);
      const { muhuratRules: _r, ...publicPuja } = puja;
      res.json({
        puja: publicPuja,
        muhurats: muhurats.map((m) => ({ year: m.year, muhurats: m.muhurats })),
        questions: questions.map(publicQuestion),
      });
    } catch (e: any) {
      res.status(500).json({ message: e?.message || "Failed" });
    }
  });

  // Admin: full read (includes muhuratRules)
  app.get("/api/admin/pujas", adminAuthMiddleware, async (_req, res) => {
    try {
      const rows = await db.select().from(pujaTypes).orderBy(asc(pujaTypes.displayOrder), asc(pujaTypes.name));
      res.json(rows);
    } catch (e: any) {
      res.status(500).json({ message: e?.message || "Failed" });
    }
  });

  app.post("/api/admin/pujas", adminAuthMiddleware, async (req, res) => {
    try {
      const parsed = insertPujaTypeSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid", errors: parsed.error.flatten() });
      const [created] = await db.insert(pujaTypes).values(sanitizePujaPayload(parsed.data as any)).returning();
      res.json(created);
    } catch (e: any) {
      res.status(500).json({ message: e?.message || "Failed" });
    }
  });

  app.patch("/api/admin/pujas/:id", adminAuthMiddleware, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const [u] = await db.update(pujaTypes)
        .set({ ...sanitizePujaPayload(req.body), updatedAt: new Date() })
        .where(eq(pujaTypes.id, id))
        .returning();
      if (!u) return res.status(404).json({ message: "Not found" });
      res.json(u);
    } catch (e: any) {
      res.status(500).json({ message: e?.message || "Failed" });
    }
  });

  app.delete("/api/admin/pujas/:id", adminAuthMiddleware, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await db.delete(pujaMuhurats).where(eq(pujaMuhurats.pujaId, id));
      await db.delete(pujaTypes).where(eq(pujaTypes.id, id));
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ message: e?.message || "Failed" });
    }
  });

  // ============================================================
  // P4 — Muhurat engine
  // ============================================================

  // Admin: regenerate muhurats for a year (or current+next)
  app.post("/api/admin/muhurats/regenerate", adminAuthMiddleware, async (req, res) => {
    try {
      const year = req.body?.year ? parseInt(req.body.year) : null;
      const result = year
        ? await regenerateMuhuratsForYear(year)
        : await regenerateForCurrentAndNextYear();
      res.json({ success: true, ...result });
    } catch (e: any) {
      res.status(500).json({ message: e?.message || "Failed" });
    }
  });

  // Admin: preview muhurats for a puja by id (uses current rules; doesn't persist)
  app.get("/api/admin/muhurats/preview/:pujaId", adminAuthMiddleware, async (req, res) => {
    try {
      const pujaId = parseInt(req.params.pujaId);
      const year = parseInt(String(req.query.year || new Date().getFullYear()));
      const [puja] = await db.select().from(pujaTypes).where(eq(pujaTypes.id, pujaId));
      if (!puja) return res.status(404).json({ message: "Not found" });
      const rules = (puja.muhuratRules as any[]) || [];
      const muhurats = computeMuhuratsForPuja(rules, year);
      res.json({ year, muhurats });
    } catch (e: any) {
      res.status(500).json({ message: e?.message || "Failed" });
    }
  });
}

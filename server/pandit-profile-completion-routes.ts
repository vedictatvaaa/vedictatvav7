import type { Express } from "express";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import {
  adminAuditLogs,
  masterServices,
  panditProfileCompletionProposals,
  panditServices,
  panditStorefrontContent,
  pandits,
} from "@shared/schema";
import { db } from "./db";
import {
  analyzeProfileCompletion,
  hashProfileSnapshot,
  inputFromRows,
  profileSnapshot,
  type ProfileAnalysis,
  type ProfileFinding,
  type ProfileProposal,
} from "./pandit-profile-completion";
import { classifyAiProviderError, createStructuredCompletion, isAiProviderConfigured } from "./ai-provider";
import { validatePanditContentDraft } from "./pandit-storefront-content";

const reviewReason = z.string().trim().min(1).max(500);
const proposalInput = z.object({
  fieldKey: z.string().trim().min(1).max(160),
  proposalClass: z.enum(["deterministic", "ai_draft"]),
  safeBatch: z.boolean(),
  before: z.unknown(),
  proposed: z.unknown(),
  sourceSnapshot: z.record(z.unknown()),
  sourceSnapshotHash: z.string().length(64),
  sourcePaths: z.array(z.string().trim().min(1).max(160)).max(30),
  confidence: z.number().min(0).max(1),
  reason: z.string().trim().min(1).max(500),
  generationKey: z.string().trim().max(180).optional(),
}).strict();

async function loadInputs(executor: any = db) {
  const rows = await executor.select({ pandit: pandits, service: panditServices, master: masterServices })
    .from(pandits)
    .leftJoin(panditServices, eq(panditServices.panditId, pandits.id))
    .leftJoin(masterServices, eq(masterServices.id, panditServices.masterServiceId))
    .orderBy(asc(pandits.id));
  const grouped = new Map<number, { pandit: any; services: any[] }>();
  for (const row of rows) {
    const current = grouped.get(row.pandit.id) || { pandit: row.pandit, services: [] };
    if (row.service) current.services.push({ ...row.service, name: row.master?.name || null, slug: row.master?.slug || null });
    grouped.set(row.pandit.id, current);
  }
  return Array.from(grouped.values()).map(({ pandit, services }) => inputFromRows(pandit, services));
}

async function loadInputForId(executor: any, panditId: number) {
  const rows = await executor.select({ pandit: pandits, service: panditServices, master: masterServices })
    .from(pandits)
    .leftJoin(panditServices, eq(panditServices.panditId, pandits.id))
    .leftJoin(masterServices, eq(masterServices.id, panditServices.masterServiceId))
    .where(eq(pandits.id, panditId));
  if (!rows.length) return null;
  const services = rows.filter((row: any) => row.service).map((row: any) => ({ ...row.service, name: row.master?.name || null, slug: row.master?.slug || null }));
  return inputFromRows(rows[0].pandit, services);
}

const aiSchema = {
  type: "object",
  additionalProperties: false,
  required: ["profileIntroduction", "seoTitle", "metaDescription", "citations"],
  properties: {
    profileIntroduction: { type: "string", maxLength: 8000 },
    seoTitle: { type: "string", maxLength: 180 },
    metaDescription: { type: "string", maxLength: 320 },
    citations: { type: "array", minItems: 1, maxItems: 20, items: { type: "string", maxLength: 160 } },
  },
} as Record<string, unknown>;

async function createAiProposals(analysis: ProfileAnalysis, generationKey: string): Promise<ProfileProposal[]> {
  if (!isAiProviderConfigured()) throw new Error("ai_provider_unavailable");
  const output = await createStructuredCompletion({
    task: "pandit-profile-completion",
    system: "Write draft-only Pandit biography and SEO copy from the supplied facts. Never invent credentials, languages, services, locations, ratings, reviews, availability, or numbers. Return citations using only the exact source paths supplied. Do not include contact details.",
    user: { sourceFacts: analysis.sourceSnapshot, allowedSourcePaths: Array.from(new Set(analysis.findings.flatMap((finding) => finding.sourcePaths))) },
    schemaName: "legacy_pandit_profile_draft",
    schema: aiSchema,
    temperature: 0,
    maxTokens: 900,
  }) as { profileIntroduction: string; seoTitle: string; metaDescription: string; citations: string[] };
  const allowedPaths = new Set(analysis.findings.flatMap((finding) => finding.sourcePaths));
  const citations = Array.from(new Set(output.citations || []));
  if (!citations.length || citations.some((path) => !allowedPaths.has(path))) throw new Error("ai_invalid_citations");
  const draft = validatePanditContentDraft({
    profileIntroduction: output.profileIntroduction || "",
    tagline: "",
    serviceOverview: "",
    seoTitle: output.seoTitle || "",
    metaDescription: output.metaDescription || "",
    faqs: [],
    aiSummary: "",
  });
  return [
    { fieldKey: "storefront.profileIntroduction", proposalClass: "ai_draft", safeBatch: false, before: null, proposed: draft.profileIntroduction, sourcePaths: citations, confidence: 0.8, reason: "AI draft cites the supplied Pandit source fields", generationKey },
    { fieldKey: "storefront.seoTitle", proposalClass: "ai_draft", safeBatch: false, before: null, proposed: draft.seoTitle, sourcePaths: citations, confidence: 0.8, reason: "AI draft cites the supplied Pandit source fields", generationKey },
    { fieldKey: "storefront.metaDescription", proposalClass: "ai_draft", safeBatch: false, before: null, proposed: draft.metaDescription, sourcePaths: citations, confidence: 0.8, reason: "AI draft cites the supplied Pandit source fields", generationKey },
  ];
}

function withAiResults(analysis: ProfileAnalysis, proposals: ProfileProposal[], aiError?: string): ProfileAnalysis {
  const aiByField = new Map(proposals.map((proposal) => [proposal.fieldKey, proposal]));
  const findings = analysis.findings.map((finding): ProfileFinding => {
    const aiProposal = aiByField.get(finding.fieldKey) || (finding.fieldKey === "pandits.bio" ? aiByField.get("storefront.profileIntroduction") : undefined);
    if (aiProposal) return { ...finding, state: "proposal", proposalClass: "ai_draft", proposal: aiProposal };
    if (finding.proposalClass === "ai_draft" && aiError) return { ...finding, state: "blocked", reason: `AI draft unavailable (${aiError}); Admin can retry without changing profile data` };
    return finding;
  });
  return { ...analysis, findings };
}

function publicAnalysis(analysis: ProfileAnalysis) {
  return {
    ...analysis,
    sourceSnapshot: analysis.sourceSnapshot,
    findings: analysis.findings,
  };
}

function auditActor(req: any) {
  return `admin:${req.adminUserId || "authenticated"}`;
}

export function registerPanditProfileCompletionRoutes(app: Express, adminAuthMiddleware: any) {
  app.post("/api/admin/pandit-profile-completion/dry-run", adminAuthMiddleware, async (req: any, res) => {
    const parsed = z.object({ includeAi: z.boolean().optional().default(false), batchId: z.string().trim().max(120).optional() }).strict().safeParse(req.body || {});
    if (!parsed.success) return res.status(400).json({ message: "Invalid profile completion dry-run request" });
    try {
      const inputs = await loadInputs();
      const batchId = parsed.data.batchId || `ppc-${Date.now()}`;
      const results = [];
      let aiError: string | undefined;
      for (const input of inputs) {
        const analysis = analyzeProfileCompletion(input);
        if (!analysis.findings.length) continue;
        let enriched = analysis;
        if (parsed.data.includeAi && analysis.findings.some((finding) => finding.proposalClass === "ai_draft")) {
          try {
            enriched = withAiResults(analysis, await createAiProposals(analysis, `${batchId}:${input.id}`));
          } catch (error) {
            aiError = classifyAiProviderError(error);
            enriched = withAiResults(analysis, [], aiError);
          }
        }
        results.push(publicAnalysis(enriched));
      }
      const summary = {
        deterministic: results.flatMap((row) => row.findings).filter((finding) => finding.proposalClass === "deterministic").length,
        aiDraft: results.flatMap((row) => row.findings).filter((finding) => finding.proposalClass === "ai_draft" && finding.proposal).length,
        unknown: results.flatMap((row) => row.findings).filter((finding) => finding.proposalClass === "unknown").length,
        blockedAi: results.flatMap((row) => row.findings).filter((finding) => finding.state === "blocked").length,
      };
      res.json({ dryRun: true, batchId, scanned: inputs.length, incomplete: results.length, aiError: aiError || null, summary, results });
    } catch (error: any) {
      console.error("[pandit profile completion] dry-run failed:", error?.message || error);
      res.status(500).json({ message: "Profile completion dry-run failed" });
    }
  });

  app.post("/api/admin/pandit-profile-completion/reviews", adminAuthMiddleware, async (req: any, res) => {
    const parsed = z.object({ batchId: z.string().trim().min(1).max(120), confirmed: z.literal(true), proposals: z.array(proposalInput.extend({ panditId: z.number().int().positive() })).min(1).max(3000), reason: reviewReason }).strict().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Confirmation, reason, and review proposals are required" });
    try {
      const created = await db.transaction(async (tx) => {
        const inputs = await loadInputs(tx);
        const byId = new Map(inputs.map((input) => [input.id, analyzeProfileCompletion(input)]));
        const rows = [];
        for (const item of parsed.data.proposals) {
          const current = byId.get(item.panditId);
          if (!current || current.sourceSnapshotHash !== item.sourceSnapshotHash) continue;
          const finding = current.findings.find((candidate) => candidate.fieldKey === item.fieldKey || (item.proposalClass === "ai_draft" && candidate.proposalClass === "ai_draft" && item.fieldKey.startsWith("storefront.")));
          const allowedPaths = new Set(current.findings.flatMap((candidate) => candidate.sourcePaths));
          const validAi = item.proposalClass === "ai_draft"
            && item.fieldKey.startsWith("storefront.")
            && typeof item.proposed === "string"
            && item.sourcePaths.length > 0
            && item.sourcePaths.every((path) => allowedPaths.has(path))
            && (() => { try { validatePanditContentDraft({ profileIntroduction: item.fieldKey.endsWith("profileIntroduction") ? String(item.proposed) : "", tagline: "", serviceOverview: "", seoTitle: item.fieldKey.endsWith("seoTitle") ? String(item.proposed) : "", metaDescription: item.fieldKey.endsWith("metaDescription") ? String(item.proposed) : "", faqs: [], aiSummary: "" }); return true; } catch { return false; } })();
          const validDeterministic = !!finding?.proposal && JSON.stringify(finding.proposal.proposed) === JSON.stringify(item.proposed);
          if (!finding || (!validDeterministic && !validAi)) continue;
          rows.push({
            panditId: item.panditId, batchId: parsed.data.batchId, fieldKey: item.fieldKey,
            proposalClass: item.proposalClass, safeBatch: item.safeBatch,
            before: item.before, proposed: item.proposed, sourceSnapshot: current.sourceSnapshot,
            sourceSnapshotHash: current.sourceSnapshotHash, sourcePaths: item.sourcePaths,
            confidence: item.confidence, reason: parsed.data.reason, generationKey: item.generationKey || null,
          });
        }
        if (!rows.length) throw new Error("No current proposals matched the dry-run source snapshots");
        return tx.insert(panditProfileCompletionProposals).values(rows).returning({ id: panditProfileCompletionProposals.id });
      });
      res.json({ ok: true, created: created.length });
    } catch (error: any) {
      res.status(400).json({ message: error?.message || "Unable to save profile completion review" });
    }
  });

  app.get("/api/admin/pandit-profile-completion/reviews", adminAuthMiddleware, async (req: any, res) => {
    const status = String(req.query.status || "");
    if (status && !["pending", "approved", "rejected", "applied", "stale"].includes(status)) return res.status(400).json({ message: "Invalid review status" });
    const proposals = await db.select({ proposal: panditProfileCompletionProposals, pandit: pandits })
      .from(panditProfileCompletionProposals)
      .innerJoin(pandits, eq(pandits.id, panditProfileCompletionProposals.panditId))
      .where(status ? eq(panditProfileCompletionProposals.status, status) : undefined)
      .orderBy(desc(panditProfileCompletionProposals.createdAt))
      .limit(Math.min(300, Math.max(1, Number(req.query.limit) || 100)));
    res.json({ items: proposals.map(({ proposal, pandit }) => ({
      ...proposal,
      pandit: { id: pandit.id, name: pandit.name, city: pandit.city, state: pandit.state, image: pandit.image, archived: pandit.archived, directoryVisible: pandit.directoryVisible, searchEligible: pandit.searchEligible, bookingEnabled: pandit.bookingEnabled },
    })) });
  });

  async function setReviewStatus(req: any, res: any, status: "approved" | "rejected") {
    const parsed = z.object({ reason: reviewReason, expectedSourceSnapshotHash: z.string().length(64) }).strict().safeParse(req.body);
    const id = Number(req.params.id);
    if (!parsed.success || !Number.isInteger(id) || id < 1) return res.status(400).json({ message: "Reason, source hash, and proposal ID are required" });
    const [updated] = await db.update(panditProfileCompletionProposals).set({
      status, reviewedBy: auditActor(req), reviewedAt: new Date(), reason: parsed.data.reason, updatedAt: new Date(),
    }).where(and(eq(panditProfileCompletionProposals.id, id), eq(panditProfileCompletionProposals.status, "pending"), eq(panditProfileCompletionProposals.sourceSnapshotHash, parsed.data.expectedSourceSnapshotHash))).returning();
    if (!updated) return res.status(409).json({ message: "Proposal is missing, already reviewed, or stale" });
    await db.insert(adminAuditLogs).values({ actor: auditActor(req), action: `pandit_profile_completion.${status}`, target: `pandit:${updated.panditId}`, ipAddress: req.ip, details: { proposalId: id, reason: parsed.data.reason, fieldKey: updated.fieldKey } });
    res.json({ ok: true, proposal: updated });
  }
  app.post("/api/admin/pandit-profile-completion/proposals/:id/approve", adminAuthMiddleware, (req, res) => setReviewStatus(req, res, "approved").catch(() => res.status(500).json({ message: "Unable to approve proposal" })));
  app.post("/api/admin/pandit-profile-completion/proposals/:id/reject", adminAuthMiddleware, (req, res) => setReviewStatus(req, res, "rejected").catch(() => res.status(500).json({ message: "Unable to reject proposal" })));

  app.post("/api/admin/pandit-profile-completion/apply", adminAuthMiddleware, async (req: any, res) => {
    const parsed = z.object({ proposalIds: z.array(z.number().int().positive()).min(1).max(100), confirmed: z.literal(true), reason: reviewReason }).strict().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Proposal IDs, confirmation, and reason are required" });
    const ids = Array.from(new Set(parsed.data.proposalIds));
    try {
      const result = await db.transaction(async (tx) => {
        const rows = await tx.select().from(panditProfileCompletionProposals).where(inArray(panditProfileCompletionProposals.id, ids)).for("update");
        const applied: number[] = [];
        const skipped: Array<{ id: number; reason: string }> = [];
        for (const proposal of rows) {
          if (proposal.status !== "approved") { skipped.push({ id: proposal.id, reason: "not_approved" }); continue; }
          if (proposal.proposalClass === "ai_draft") {
            const value = typeof (proposal.proposed as any) === "string" ? String(proposal.proposed) : "";
            if (!value || !proposal.fieldKey.startsWith("storefront.")) { skipped.push({ id: proposal.id, reason: "invalid_ai_draft" }); continue; }
            const [pandit] = await tx.select().from(pandits).where(eq(pandits.id, proposal.panditId)).for("update");
            if (!pandit) { skipped.push({ id: proposal.id, reason: "pandit_not_found" }); continue; }
            const currentInput = await loadInputForId(tx, proposal.panditId);
            const sourceHash = currentInput ? hashProfileSnapshot(profileSnapshot(currentInput)) : "";
            if (sourceHash !== proposal.sourceSnapshotHash) { skipped.push({ id: proposal.id, reason: "source_changed_since_review" }); continue; }
            const [content] = await tx.select().from(panditStorefrontContent).where(eq(panditStorefrontContent.panditId, proposal.panditId)).limit(1);
            const key = proposal.fieldKey.slice("storefront.".length);
            const update: Record<string, unknown> = { sourceSnapshotHash: proposal.sourceSnapshotHash, sourceFields: proposal.sourceSnapshot, status: "draft", stale: false, updatedBy: auditActor(req), updatedAt: new Date(), revision: (content?.revision || 0) + 1 };
            if (key === "profileIntroduction") update.generatedProfileIntroduction = value;
            else if (key === "seoTitle") update.generatedSeoTitle = value;
            else if (key === "metaDescription") update.generatedMetaDescription = value;
            else { skipped.push({ id: proposal.id, reason: "unsupported_editorial_field" }); continue; }
            if (content) await tx.update(panditStorefrontContent).set(update as any).where(eq(panditStorefrontContent.id, content.id));
            else await tx.insert(panditStorefrontContent).values({ panditId: proposal.panditId, canonicalUrl: `/pandit/${pandit.slug || pandit.id}`, sourceSnapshotHash: proposal.sourceSnapshotHash, sourceFields: proposal.sourceSnapshot, promptVersion: "legacy-profile-completion-v1", generatedProfileIntroduction: key === "profileIntroduction" ? value : null, generatedSeoTitle: key === "seoTitle" ? value : null, generatedMetaDescription: key === "metaDescription" ? value : null, status: "draft" });
          } else {
            const proposed = proposal.proposed as any;
            if (proposal.fieldKey === "pandits.languages" || proposal.fieldKey === "pandits.education" || proposal.fieldKey === "pandits.serviceArea") {
              if (typeof proposed !== "string" || !proposed.trim()) { skipped.push({ id: proposal.id, reason: "invalid_text_value" }); continue; }
              const [pandit] = await tx.select().from(pandits).where(eq(pandits.id, proposal.panditId)).for("update");
              const currentInput = await loadInputForId(tx, proposal.panditId);
              if (!pandit || !currentInput || hashProfileSnapshot(profileSnapshot(currentInput)) !== proposal.sourceSnapshotHash) { skipped.push({ id: proposal.id, reason: "source_changed_since_review" }); continue; }
              await tx.update(pandits).set({ [proposal.fieldKey.slice("pandits.".length)]: proposed, updatedAt: new Date() } as any).where(eq(pandits.id, proposal.panditId));
            } else { skipped.push({ id: proposal.id, reason: "unsupported_deterministic_field" }); continue; }
          }
          await tx.update(panditProfileCompletionProposals).set({ status: "applied", appliedAt: new Date(), updatedAt: new Date(), reviewedBy: auditActor(req) }).where(eq(panditProfileCompletionProposals.id, proposal.id));
          await tx.insert(adminAuditLogs).values({ actor: auditActor(req), action: "pandit_profile_completion.applied", target: `pandit:${proposal.panditId}`, ipAddress: req.ip, details: { proposalId: proposal.id, fieldKey: proposal.fieldKey, reason: parsed.data.reason, visibilityUnchanged: true } });
          applied.push(proposal.id);
        }
        return { applied, skipped };
      });
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ message: error?.message || "Unable to apply profile completion proposals" });
    }
  });
}
import { z } from "zod";
import { insertPujaTypeSchema } from "@shared/schema";

const text = (max: number) => z.string().trim().min(1).max(max);
const textList = z.array(text(100)).max(40).default([]);

export const citationSchema = z.object({
  label: text(200),
  url: z.string().trim().url().max(1000).refine(value => {
    try {
      return new URL(value).protocol === "https:";
    } catch {
      return false;
    }
  }, "Citation URL must use HTTPS").optional(),
  sourceType: z.enum(["scripture", "commentary", "tradition", "reviewer", "other"]).default("other"),
});

export const regionalVariationSchema = z.object({
  name: text(120),
  regionOrTradition: text(120),
  note: text(1000),
});

function validatePanditAttribution(value: { reviewMethod?: string; reviewedByPanditId?: number | null }, ctx: z.RefinementCtx) {
  if (value.reviewMethod === "pandit" && !value.reviewedByPanditId) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["reviewedByPanditId"], message: "Pandit review requires a verified Pandit reviewer" });
  }
  if (value.reviewMethod !== "pandit" && value.reviewedByPanditId) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["reviewedByPanditId"], message: "Pandit attribution is only allowed for the pandit review method" });
  }
}

const pujaGovernanceFieldsSchema = z.object({
  intents: textList,
  deities: textList,
  ceremonies: textList,
  festivals: textList,
  aliases: textList,
  regionalVariations: z.array(regionalVariationSchema).max(30).default([]),
  onlineEligible: z.boolean().default(false),
  inPersonEligible: z.boolean().default(true),
  reviewStatus: z.enum(["draft", "in_review", "approved", "changes_requested"]).default("draft"),
  reviewMethod: z.enum(["ai", "admin", "pandit"]).default("ai"),
  reviewedByPanditId: z.number().int().positive().nullable().optional(),
  reviewNotes: z.string().trim().max(4000).nullable().optional(),
  sourceNotes: z.string().trim().max(6000).nullable().optional(),
  citations: z.array(citationSchema).max(50).default([]),
  approvedAt: z.coerce.date().nullable().optional(),
});

export const pujaGovernanceSchema = pujaGovernanceFieldsSchema.superRefine(validatePanditAttribution);

export const pujaCreateSchema = insertPujaTypeSchema.merge(pujaGovernanceFieldsSchema).omit({ approvedAt: true }).superRefine(validatePanditAttribution);
export const pujaPatchSchema = insertPujaTypeSchema.merge(pujaGovernanceFieldsSchema).omit({ approvedAt: true }).partial();

export function normalizeTerm(value: unknown): string {
  return String(value || "").trim().replace(/\s+/g, " ").toLocaleLowerCase("en-IN");
}

export function normalizeTerms(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  const found = new Set<string>();
  const result: string[] = [];
  for (const raw of values) {
    const value = String(raw || "").trim().replace(/\s+/g, " ");
    const key = normalizeTerm(value);
    if (!key || found.has(key)) continue;
    found.add(key);
    result.push(value);
  }
  return result;
}

export function normalizeGovernance<T extends Record<string, any>>(record: T): T {
  const result: Record<string, any> = { ...record };
  for (const field of ["intents", "deities", "ceremonies", "festivals", "aliases"]) {
    if (field in result) result[field] = normalizeTerms(result[field]);
  }
  return result as T;
}

export function pujaCompleteness(puja: Record<string, any>) {
  const missing: string[] = [];
  const requiredText: Array<[string, string]> = [
    ["name", "Name"],
    ["slug", "Slug"],
    ["shortDescription", "Short description"],
    ["whyPerformed", "Why performed"],
    ["storyMyth", "Story or traditional background"],
    ["howCelebrated", "How celebrated"],
    ["ethics", "Ethics and guidance"],
    ["benefits", "Benefits"],
    ["sourceNotes", "Source notes"],
    ["metaTitle", "SEO title"],
    ["metaDescription", "SEO description"],
  ];
  for (const [field, label] of requiredText) {
    if (!String(puja[field] || "").trim()) missing.push(label);
  }
  if (!Array.isArray(puja.requirements) || puja.requirements.length === 0) missing.push("Samagri checklist");
  if (!Array.isArray(puja.faq) || puja.faq.length === 0) missing.push("FAQ");
  if (!Array.isArray(puja.intents) || puja.intents.length === 0) missing.push("At least one intention");
  const taxonomyCount = ["deities", "ceremonies", "festivals"]
    .reduce((count, field) => count + (Array.isArray(puja[field]) ? puja[field].length : 0), 0);
  if (taxonomyCount === 0) missing.push("A deity, ceremony, or festival");
  if (!Array.isArray(puja.citations) || puja.citations.length === 0) missing.push("At least one citation");
  if (!puja.onlineEligible && !puja.inPersonEligible) missing.push("At least one eligible mode");
  if ((puja.reviewMethod || "ai") === "pandit" && (!puja.reviewedByPanditId || puja.reviewerVerified !== true)) {
    missing.push("Verified Pandit reviewer");
  }
  return { complete: missing.length === 0, missing };
}

export type PujaConflict = {
  type: "slug" | "name" | "alias";
  recordId: number;
  recordName: string;
  value: string;
  blocking: true;
};

export function findPujaConflicts(
  candidate: Record<string, any>,
  catalogue: Array<Record<string, any>>,
  excludeId?: number,
): PujaConflict[] {
  const candidateNames = new Set([
    normalizeTerm(candidate.name),
    ...normalizeTerms(candidate.aliases).map(normalizeTerm),
  ].filter(Boolean));
  const conflicts: PujaConflict[] = [];
  for (const record of catalogue) {
    if (record.id === excludeId) continue;
    if (normalizeTerm(record.slug) === normalizeTerm(candidate.slug)) {
      conflicts.push({ type: "slug", recordId: record.id, recordName: record.name, value: candidate.slug, blocking: true });
    }
    const names = new Set([
      normalizeTerm(record.name),
      ...normalizeTerms(record.aliases).map(normalizeTerm),
    ].filter(Boolean));
    for (const value of Array.from(candidateNames)) {
      if (!names.has(value)) continue;
      conflicts.push({
        type: normalizeTerm(candidate.name) === value && normalizeTerm(record.name) === value ? "name" : "alias",
        recordId: record.id,
        recordName: record.name,
        value,
        blocking: true,
      });
    }
  }
  return conflicts.filter((conflict, index, all) =>
    all.findIndex(other => other.type === conflict.type && other.recordId === conflict.recordId && other.value === conflict.value) === index);
}

export function publicPujaEligible(
  puja: Record<string, any>,
  conflicts: PujaConflict[] = [],
  reviewerVerified = true,
): boolean {
  const reviewMethod = puja.reviewMethod || "ai";
  return puja.isPublished === true
    && puja.reviewStatus === "approved"
    && (reviewMethod !== "pandit" || reviewerVerified)
    && pujaCompleteness({ ...puja, reviewerVerified }).complete
    && conflicts.every(conflict => !conflict.blocking);
}
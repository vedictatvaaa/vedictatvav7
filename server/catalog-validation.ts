import { z } from "zod";

const safeText = (max: number) => z.string().trim().max(max);
const safeTextArray = (maxItems: number, maxItemLength: number) =>
  z.array(z.string().trim().min(1).max(maxItemLength)).max(maxItems);

export const masterServiceWriteSchema = z.object({
  name: safeText(120).min(1),
  slug: z.string().trim().min(1).max(140).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase kebab-case"),
  category: safeText(80).min(1),
  description: safeText(1000).default(""),
  serviceType: z.enum(["puja", "havan", "katha", "ritual", "consultation"]).default("puja"),
  supportedModes: z.array(z.enum(["in_person", "online", "hybrid"])).max(3).default([]),
  onlineAvailable: z.boolean().default(false),
  physicalAvailable: z.boolean().default(true),
  searchMetadata: z.record(z.string(), z.string().max(200)).nullable().optional(),
});

export const panditServiceWriteSchema = z.object({
  masterServiceId: z.number().int().positive(),
  price: z.number().int().min(0).max(10_000_000),
  durationMinutes: z.number().int().min(15).max(1_440),
  mode: z.enum(["in_person", "online", "hybrid"]),
  description: safeText(2000).default(""),
  preparation: safeText(2000).default(""),
  inclusions: safeTextArray(30, 160).default([]),
  serviceAreas: safeTextArray(30, 120).default([]),
  availability: safeText(500).nullable().optional(),
  displayOrder: z.number().int().min(0).max(10_000).default(0),
});

const ianaTimezone = z.string().trim().min(1).max(80).refine(value => {
  try { Intl.DateTimeFormat(undefined, { timeZone: value }); return true; } catch { return false; }
}, "Timezone must be a valid IANA timezone");
const managedMediaUrl = z.string().trim().max(500).refine(value => {
  // Gallery uploads must use our managed storage path, never arbitrary remote media.
  return /^\/(?:uploads|objects|api\/media)\//.test(value);
}, "Media must be a managed storage URL");

export const panditPackageWriteSchema = z.object({
  name: safeText(120).min(1),
  slug: z.string().trim().min(1).max(140).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase kebab-case"),
  description: safeText(2000).default(""),
  price: z.number().int().min(0).max(10_000_000),
  compareAtPrice: z.number().int().min(1).max(10_000_000).nullable().optional(),
  isActive: z.boolean().optional(),
  isPublished: z.boolean().optional(),
  displayOrder: z.number().int().min(0).max(10_000).default(0),
  items: z.array(z.object({ panditServiceId: z.number().int().positive(), displayOrder: z.number().int().min(0).max(10_000).default(0) })).min(1).max(30),
}).superRefine((value, ctx) => {
  if (value.compareAtPrice != null && value.compareAtPrice <= value.price) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["compareAtPrice"], message: "Compare-at price must exceed price" });
});
export const panditGalleryWriteSchema = z.object({
  mediaKind: z.enum(["image", "video"]).default("image"),
  mediaUrl: managedMediaUrl,
  altText: safeText(240).min(1),
  caption: safeText(800).nullable().optional(),
  displayOrder: z.number().int().min(0).max(10_000).default(0),
  isPublished: z.boolean().optional(),
});
export const panditAvailabilityWriteSchema = z.object({
  weekday: z.number().int().min(0).max(6),
  startMinutes: z.number().int().min(0).max(1439),
  endMinutes: z.number().int().min(1).max(1440),
  timezone: ianaTimezone,
  mode: z.enum(["in_person", "online", "hybrid"]),
  isActive: z.boolean().optional(),
  effectiveFrom: z.coerce.date().nullable().optional(),
  effectiveUntil: z.coerce.date().nullable().optional(),
}).superRefine((value, ctx) => {
  if (value.endMinutes <= value.startMinutes) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["endMinutes"], message: "End must be after start" });
  if (value.effectiveFrom && value.effectiveUntil && value.effectiveUntil < value.effectiveFrom) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["effectiveUntil"], message: "End date must follow start date" });
});
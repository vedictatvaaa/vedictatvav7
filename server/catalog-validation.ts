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
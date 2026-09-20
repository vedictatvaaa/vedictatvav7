import { z } from "zod";
import { insertPanditSchema } from "@shared/schema";

const coordinateVerifiedAtSchema = z.union([
  z.date(),
  z.string().datetime({ offset: true }).transform((value) => new Date(value)),
]).nullable().optional();

/**
 * Admin JSON requests serialize timestamps as ISO strings. Normalize only the
 * coordinate evidence timestamp at this HTTP boundary; the shared database
 * insert schema remains strict about receiving Date objects.
 */
export const adminPanditProfilePatchSchema = insertPanditSchema.partial().extend({
  coordinateVerifiedAt: coordinateVerifiedAtSchema,
});

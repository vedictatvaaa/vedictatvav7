import { z } from "zod";

export const bookingModeSchema = z.enum(["virtual", "at_home"]);
export type BookingMode = z.infer<typeof bookingModeSchema>;
export const bookingLifecycleSchema = z.enum(["requested", "offered", "accepted", "confirmed", "in_progress", "completed", "declined", "cancelled", "reassignment_required", "expired"]);
export type BookingLifecycle = z.infer<typeof bookingLifecycleSchema>;
export const structuredAddressSchema = z.object({
  house: z.string().trim().min(1).max(160),
  street: z.string().trim().min(1).max(160),
  locality: z.string().trim().min(1).max(120),
  city: z.string().trim().min(1).max(120),
  state: z.string().trim().min(1).max(120),
  postalCode: z.string().trim().regex(/^\d{6}$/),
  landmark: z.string().trim().max(160).optional(),
});
export const samagriItemSchema = z.object({
  name: z.string().trim().min(1).max(120),
  quantity: z.string().trim().max(40).optional(),
  unit: z.string().trim().max(40).optional(),
  note: z.string().trim().max(500).optional(),
  required: z.boolean().default(true),
  arrangedBy: z.enum(["customer", "pandit", "vedic_tatva"]).default("customer"),
  productId: z.number().int().positive().optional(),
});
export function canonicalBookingMode(value: string | null | undefined): BookingMode | null {
  if (value === "virtual" || value === "online") return "virtual";
  if (value === "at_home" || value === "offline" || value === "in_person") return "at_home";
  return null;
}
export function legacyBookingMode(mode: BookingMode): "online" | "offline" {
  return mode === "virtual" ? "online" : "offline";
}
/**
 * Store and compare Pandit phone numbers in one canonical format.
 * The public form accepts spaces, +91, and punctuation, but the database
 * identity is the final ten digits.
 */
export function normalizePanditPhone(value: unknown): string | null {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (digits.length < 10) return null;
  const phone = digits.slice(-10);
  return /^[6-9]\d{9}$/.test(phone) ? phone : null;
}
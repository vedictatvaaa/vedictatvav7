import assert from "node:assert/strict";
import test from "node:test";
import { samagriItemSchema } from "@shared/puja-booking";

test("samagri items are structured and bounded", () => {
  assert.equal(samagriItemSchema.parse({
    name: "Ghee", quantity: "250", unit: "ml", required: true, arrangedBy: "customer",
  }).name, "Ghee");
  assert.throws(() => samagriItemSchema.parse({ name: "", arrangedBy: "customer" }));
  assert.throws(() => samagriItemSchema.parse({ name: "Flowers", arrangedBy: "unknown" }));
});

test("migration enforces immutable monotonically unique versions", async () => {
  const { readFile } = await import("node:fs/promises");
  const sql = await readFile(new URL("../migrations/0015_puja_booking_operations.sql", import.meta.url), "utf8");
  assert.match(sql, /UNIQUE INDEX IF NOT EXISTS puja_booking_samagri_versions_booking_version_unique/);
  assert.match(sql, /CHECK \(version > 0\)/);
});
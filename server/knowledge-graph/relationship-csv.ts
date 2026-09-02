import Papa from "papaparse";
import crypto from "crypto";
import { isEntityType, isRelationshipType } from "./registry";
import { KnowledgeGraphValidationError, type EntityRef } from "./types";
import { displayOrder, positiveEntityId, safeMetadata, MAX_METADATA_BYTES } from "./validation";

export const RELATIONSHIP_CSV_VERSION = "1";
export const RELATIONSHIP_CSV_HEADERS = [
  "schema_version", "action", "relationship_id", "source_type", "source_id", "source_discriminator",
  "relationship_type", "target_type", "target_id", "target_discriminator", "status", "display_order", "metadata",
] as const;
export const CSV_LIMITS = { bytes: 5 * 1024 * 1024, rows: 5_000, columns: RELATIONSHIP_CSV_HEADERS.length, cell: 16_384 };
export type CsvAction = "create" | "update" | "skip";
export type CsvRow = { line: number; action: CsvAction; relationshipId?: number; source: EntityRef; relationshipType: any; target: EntityRef; status: "ACTIVE" | "DRAFT"; displayOrder: number; metadata: Record<string, unknown> };
export type CsvIssue = { line: number; message: string };
export class CsvApplyConflictError extends Error {}

const formula = /^[=+\-@\t\r]/;
export const csvCell = (value: unknown) => {
  const text = value === null || value === undefined ? "" : String(value);
  const safe = formula.test(text) ? `'${text}` : text;
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, `""`)}"` : safe;
};
export function serializeRelationshipCsv(rows: readonly Record<string, unknown>[], headers = RELATIONSHIP_CSV_HEADERS): string {
  return "\uFEFF" + [headers.join(","), ...rows.map(row => headers.map(h => csvCell(row[h])).join(","))].join("\r\n") + "\r\n";
}
const required = new Set(RELATIONSHIP_CSV_HEADERS);
const value = (row: Record<string, string>, name: string) => row[name] ?? "";
function strictInteger(value: string, label: string, positive = false): number {
  if (!/^(?:0|[1-9]\d*)$/.test(value)) throw new KnowledgeGraphValidationError(`${label} must be a decimal integer`);
  const number = Number(value);
  if (!Number.isSafeInteger(number) || (positive && number < 1)) throw new KnowledgeGraphValidationError(`${label} is out of range`);
  return number;
}
const ref = (row: Record<string, string>, side: "source" | "target"): EntityRef => {
  const type = value(row, `${side}_type`);
  if (!isEntityType(type)) throw new KnowledgeGraphValidationError(`${side}_type is invalid`);
  const discriminator = value(row, `${side}_discriminator`);
  if (type === "LOCATION") {
    if (discriminator !== "STATE" && discriminator !== "CITY") throw new KnowledgeGraphValidationError(`${side}_discriminator must be STATE or CITY for LOCATION`);
    return { type, id: positiveEntityId(strictInteger(value(row, `${side}_id`), `${side}_id`, true)), discriminator };
  }
  if (discriminator) throw new KnowledgeGraphValidationError(`${side}_discriminator is only permitted for LOCATION`);
  return { type, id: positiveEntityId(strictInteger(value(row, `${side}_id`), `${side}_id`, true)) };
};
/** Logical records with their physical (1-based) start line, including quoted newlines. */
function recordStarts(text: string): number[] {
  const starts: number[] = []; let start = 0, line = 1, recordLine = 1, quoted = false;
  const push = (end: number) => { if (text.slice(start, end).trim() !== "") starts.push(recordLine); };
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '"') { if (quoted && text[i + 1] === '"') { i++; continue; } quoted = !quoted; continue; }
    if (text[i] === "\n" || text[i] === "\r") {
      if (!quoted) {
        push(i);
        if (text[i] === "\r" && text[i + 1] === "\n") i++;
        start = i + 1;
        line++;
        recordLine = line;
        continue;
      }
      else if (text[i] === "\r" && text[i + 1] === "\n") i++;
      line++;
    }
  }
  push(text.length); return starts;
}
export function parseRelationshipCsv(buffer: Buffer): { rows: CsvRow[]; errors: CsvIssue[] } {
  if (buffer.length > CSV_LIMITS.bytes) throw new KnowledgeGraphValidationError("CSV file exceeds 5 MB");
  if (buffer.includes(Buffer.from([0]))) throw new KnowledgeGraphValidationError("CSV must be UTF-8 text");
  let text: string;
  try { text = new TextDecoder("utf-8", { fatal: true }).decode(buffer).replace(/^\uFEFF/, ""); }
  catch { throw new KnowledgeGraphValidationError("CSV must be valid UTF-8"); }
  // @types/papaparse overloads select the streaming callback signature for a
  // string input in some TS versions; runtime is the synchronous RFC4180 path.
  const parsed: { data: string[][]; errors: { message: string }[] } = (Papa.parse as any)(text, { delimiter: ",", quoteChar: '"', newline: "", skipEmptyLines: "greedy" });
  if (parsed.errors.length) throw new KnowledgeGraphValidationError(`Malformed CSV: ${parsed.errors[0].message}`);
  const starts = recordStarts(text); const [head, ...data] = parsed.data;
  if (!head) throw new KnowledgeGraphValidationError("CSV header is required");
  if (head.length > CSV_LIMITS.columns || new Set(head).size !== head.length) throw new KnowledgeGraphValidationError("CSV contains duplicate or too many headers");
  if (head.length !== required.size || head.some(h => !required.has(h as any))) throw new KnowledgeGraphValidationError("CSV headers do not match the canonical contract");
  if (data.length > CSV_LIMITS.rows) throw new KnowledgeGraphValidationError("CSV has too many rows");
  const errors: CsvIssue[] = [], rows: CsvRow[] = [];
  data.forEach((cells, index) => {
    const line = starts[index + 1] || index + 2;
    try {
      if (cells.length !== head.length || cells.some(c => Buffer.byteLength(c, "utf8") > CSV_LIMITS.cell)) throw new KnowledgeGraphValidationError("Invalid CSV row width or cell size");
      const row = Object.fromEntries(head.map((h, i) => [h, cells[i]]));
      if (value(row, "schema_version") !== RELATIONSHIP_CSV_VERSION) throw new KnowledgeGraphValidationError("Unsupported schema_version");
      const action = value(row, "action") as CsvAction;
      if (action !== "create" && action !== "update" && action !== "skip") throw new KnowledgeGraphValidationError("action must be create, update, or skip");
      const relationshipIdText = value(row, "relationship_id");
      const relationshipId = relationshipIdText ? positiveEntityId(strictInteger(relationshipIdText, "relationship_id", true)) : undefined;
      if (action === "update" && !relationshipId) throw new KnowledgeGraphValidationError("update requires relationship_id");
      if (action !== "update" && relationshipId) throw new KnowledgeGraphValidationError("relationship_id is only permitted for update");
      const relationshipType = value(row, "relationship_type");
      if (!isRelationshipType(relationshipType)) throw new KnowledgeGraphValidationError("relationship_type is invalid");
      const rawMetadata = value(row, "metadata");
      if (Buffer.byteLength(rawMetadata, "utf8") > MAX_METADATA_BYTES) throw new KnowledgeGraphValidationError("metadata is too large");
      let metadata: Record<string, unknown> = {};
      if (rawMetadata) try { metadata = safeMetadata(JSON.parse(rawMetadata)); } catch { throw new KnowledgeGraphValidationError("metadata must be a JSON object"); }
      const status = value(row, "status");
      if (status !== "ACTIVE" && status !== "DRAFT") throw new KnowledgeGraphValidationError("status must be ACTIVE or DRAFT");
      const rawOrder = value(row, "display_order");
      rows.push({ line, action, relationshipId, source: ref(row, "source"), relationshipType, target: ref(row, "target"), status, displayOrder: displayOrder(strictInteger(rawOrder, "display_order")), metadata });
    } catch (error: any) { errors.push({ line, message: error.message || "Invalid row" }); }
  });
  return { rows, errors };
}
export class CsvPreviewStore {
  private entries = new Map<string, { owner: number; expires: number; used: boolean; applying: boolean; rows: CsvRow[]; fingerprint: string }>();
  constructor(private readonly ttlMs = 10 * 60_000, private readonly maxEntries = 100) {}
  create(owner: number, rows: CsvRow[], fingerprint: string) {
    this.cleanup(); if (this.entries.size >= this.maxEntries) throw new KnowledgeGraphValidationError("Too many pending CSV previews");
    const token = crypto.randomBytes(32).toString("base64url"); this.entries.set(token, { owner, expires: Date.now() + this.ttlMs, used: false, applying: false, rows, fingerprint }); return token;
  }
  take(token: unknown, owner: number) {
    this.cleanup(); const entry = typeof token === "string" ? this.entries.get(token) : undefined;
    if (!entry) return { status: "missing" as const }; if (entry.owner !== owner) return { status: "foreign" as const };
    if (entry.used || entry.applying) return { status: "used" as const }; return { status: "ok" as const, entry };
  }
  claim(token: string) { const entry = this.entries.get(token); if (!entry || entry.used || entry.applying || entry.expires <= Date.now()) return false; entry.applying = true; return true; }
  consume(token: string) { const entry = this.entries.get(token); if (entry) { entry.used = true; entry.applying = false; } }
  release(token: string) { const entry = this.entries.get(token); if (entry && !entry.used) entry.applying = false; }
  cleanup() { const now = Date.now(); for (const [token, entry] of Array.from(this.entries.entries())) if (entry.expires <= now) this.entries.delete(token); }
}
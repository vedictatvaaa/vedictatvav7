import assert from "node:assert/strict";
import test from "node:test";
import { CSV_LIMITS, CsvPreviewStore, parseRelationshipCsv, RELATIONSHIP_CSV_HEADERS, serializeRelationshipCsv } from "./relationship-csv";
import { MAX_METADATA_BYTES } from "./validation";

const row = (overrides: Record<string, string> = {}) => ({
  schema_version: "1", action: "create", relationship_id: "", source_type: "PUJA", source_id: "1", source_discriminator: "",
  relationship_type: "related_to", target_type: "TEMPLE", target_id: "2", target_discriminator: "", status: "DRAFT", display_order: "0", metadata: "{}",
  ...overrides,
});
const csv = (...rows: Record<string, string>[]) => Buffer.from("\uFEFF" + [RELATIONSHIP_CSV_HEADERS.join(","), ...rows.map(r => RELATIONSHIP_CSV_HEADERS.map(h => r[h]).join(","))].join("\r\n"));

test("relationship CSV accepts BOM and strictly rejects non-decimal identifiers", () => {
  assert.equal(parseRelationshipCsv(csv(row())).rows[0].source.id, 1);
  for (const id of [" 1", "+1", "1.0", "1e2", "0"]) assert.equal(parseRelationshipCsv(csv(row({ source_id: id }))).errors.length, 1);
});
test("relationship CSV reports physical quoted-record start lines", () => {
  const data = "\uFEFF" + RELATIONSHIP_CSV_HEADERS.join(",") + "\r\n" +
    RELATIONSHIP_CSV_HEADERS.map(h => h === "metadata" ? '"{\n""note"":""a""\n}"' : row()[h]).join(",") + "\n\r\n" +
    RELATIONSHIP_CSV_HEADERS.map(h => row({ source_id: "3" })[h]).join(",");
  const parsed = parseRelationshipCsv(Buffer.from(data));
  assert.deepEqual(parsed.rows.map(r => r.line), [2, 6]);
});
test("serializer has BOM, CRLF, RFC4180 quoting, and formula neutralization", () => {
  const out = serializeRelationshipCsv([{ ...row(), metadata: "=SUM(1,1)", source_type: 'A"B' }]);
  assert.ok(out.startsWith("\uFEFF") && out.endsWith("\r\n"));
  assert.match(out, /"A""B"/); assert.match(out, /"'=SUM\(1,1\)"/);
});
test("serializer neutralizes every spreadsheet formula prefix in fields and metadata", () => {
  for (const prefix of ["=", "+", "-", "@", "\t", "\r"]) {
    const out = serializeRelationshipCsv([{ ...row(), source_type: `${prefix}source`, metadata: `${prefix}metadata` }]);
    assert.ok(out.includes(`'${prefix}source`) && out.includes(`'${prefix}metadata`));
  }
});
test("preview tokens are owner-bound, expire, single-use and claim atomically", () => {
  const store = new CsvPreviewStore(60_000, 1); const token = store.create(7, [], "state");
  assert.equal(store.take(token, 8).status, "foreign"); assert.equal(store.claim(token), true); assert.equal(store.claim(token), false);
  store.release(token); store.consume(token); assert.equal(store.take(token, 7).status, "used");
  const expired = new CsvPreviewStore(-1); const old = expired.create(1, [], "x");
  assert.equal(expired.take(old, 1).status, "missing");
  const bounded = new CsvPreviewStore(1000, 1); const first = bounded.create(1, [], "x");
  assert.match(first, /^[A-Za-z0-9_-]{43}$/); assert.throws(() => bounded.create(1, [], "x"), /Too many/);
});
test("CSV contract rejects file/header/row and metadata boundary violations", () => {
  assert.throws(() => parseRelationshipCsv(Buffer.from([])), /header/);
  assert.throws(() => parseRelationshipCsv(Buffer.from([0])), /UTF-8 text/);
  assert.throws(() => parseRelationshipCsv(Buffer.alloc(CSV_LIMITS.bytes + 1)), /exceeds/);
  assert.throws(() => parseRelationshipCsv(Buffer.from(RELATIONSHIP_CSV_HEADERS.slice(1).join(","))), /headers/);
  assert.throws(() => parseRelationshipCsv(Buffer.from([...RELATIONSHIP_CSV_HEADERS, "source_id"].join(","))), /duplicate/);
  assert.throws(() => parseRelationshipCsv(Buffer.from([...RELATIONSHIP_CSV_HEADERS.slice(0, -1), "unknown"].join(","))), /headers/);
  assert.equal(parseRelationshipCsv(csv(row({ metadata: "[]" }))).errors.length, 1);
  assert.equal(parseRelationshipCsv(csv(row({ schema_version: "2" }))).errors.length, 1);
  assert.equal(parseRelationshipCsv(csv(row({ action: "delete" }))).errors.length, 1);
  assert.equal(parseRelationshipCsv(csv(row({ status: "ARCHIVED" }))).errors.length, 1);
  assert.equal(parseRelationshipCsv(csv(row({ relationship_type: "invented" }))).errors.length, 1);
});
test("CSV enforces update identity columns and LOCATION discriminator grammar", () => {
  assert.equal(parseRelationshipCsv(csv(row({ action: "update" }))).errors.length, 1);
  assert.equal(parseRelationshipCsv(csv(row({ relationship_id: "3" }))).errors.length, 1);
  assert.equal(parseRelationshipCsv(csv(row({ source_type: "LOCATION", source_discriminator: "" }))).errors.length, 1);
  assert.equal(parseRelationshipCsv(csv(row({ source_discriminator: "CITY" }))).errors.length, 1);
  assert.equal(parseRelationshipCsv(csv(row({ source_type: "LOCATION", source_discriminator: "CITY" }))).errors.length, 0);
});
test("CSV accepts RFC4180 commas, actual newlines and escaped quotes", () => {
  const values = row();
  const metadata = '{\n  "note": "a, \\"quoted\\""\n}';
  const encoded = RELATIONSHIP_CSV_HEADERS.map(h => h === "metadata" ? `"${metadata.replace(/"/g, '""')}"` : values[h]).join(",");
  const parsed = parseRelationshipCsv(Buffer.from(RELATIONSHIP_CSV_HEADERS.join(",") + "\n" + encoded));
  assert.equal(parsed.errors.length, 0); assert.equal(parsed.rows[0].metadata.note, 'a, "quoted"');
});
test("CSV parser enforces logical row, cell, metadata, grammar, and encoding bounds", () => {
  assert.throws(() => parseRelationshipCsv(csv(...Array.from({ length: CSV_LIMITS.rows + 1 }, () => row()))), /too many rows/);
  assert.equal(parseRelationshipCsv(csv(row({ metadata: "x".repeat(CSV_LIMITS.cell + 1) }))).errors.length, 1);
  assert.equal(parseRelationshipCsv(csv(row({ metadata: JSON.stringify({ value: "x".repeat(MAX_METADATA_BYTES) }) }))).errors.length, 1);
  const tooWide = Buffer.from(`${RELATIONSHIP_CSV_HEADERS.join(",")}\n${RELATIONSHIP_CSV_HEADERS.map(h => row()[h]).join(",")},extra`);
  assert.equal(parseRelationshipCsv(tooWide).errors.length, 1);
  assert.throws(() => parseRelationshipCsv(Buffer.from(`${RELATIONSHIP_CSV_HEADERS.join(",")}\n"unterminated`)), /Malformed CSV/);
  assert.throws(() => parseRelationshipCsv(Buffer.from([0xc3, 0x28])), /valid UTF-8/);
  assert.equal(parseRelationshipCsv(csv(row({ relationship_id: "2147483648" }))).errors.length, 1);
  assert.equal(parseRelationshipCsv(csv(row({ display_order: "10001" }))).errors.length, 1);
});
import assert from "node:assert/strict";
import test from "node:test";
import { registerKnowledgeGraphAdminRoutes } from "./admin-routes";
import { CsvApplyConflictError, CsvPreviewStore, type CsvRow } from "./relationship-csv";

type Route = { method: string; path: string; handler: any };
function app() {
  const routes: Route[] = []; const add = (method: string) => (path: string, _auth: any, handler: any) => routes.push({ method, path, handler });
  return { routes, get: add("GET"), post: add("POST"), patch: add("PATCH"), delete: add("DELETE") };
}
function response() {
  const out: any = { statusCode: 200, body: undefined, status(code: number) { out.statusCode = code; return out; }, json(body: any) { out.body = body; return out; } };
  return out;
}
async function invoke(route: Route, request: any) {
  const res = response(); let passed: any;
  await route.handler({ headers: {}, ip: "127.0.0.1", adminUserId: 1, body: {}, ...request }, res, (error: any) => { passed = error; });
  return { res, passed };
}
const row: CsvRow = { line: 2, action: "create", source: { type: "PUJA", id: 1 }, relationshipType: "related_to", target: { type: "TEMPLE", id: 2 }, status: "DRAFT", displayOrder: 0, metadata: {} };
const valid = { rows: [{ line: 2, action: "create", errors: [], warnings: [] }], fingerprint: "fresh", counts: { create: 1, update: 0, skip: 0, invalid: 0 } };

test("CSV apply maps conflicts and only consumes preview after commit", async () => {
  for (const error of [new CsvApplyConflictError("stale"), Object.assign(new Error("unique"), { code: "23505" }), Object.assign(new Error("serialization"), { code: "40001" })]) {
    const routes = app(); const previews = new CsvPreviewStore(); const token = previews.create(1, [row], "fresh");
    const service: any = { repository: { applyCsvRelationships: async () => { throw error; } }, csvFingerprint: async () => "fresh", validateCsvRows: async () => valid };
    registerKnowledgeGraphAdminRoutes(routes as any, () => undefined, { service, previewStore: previews });
    const apply = routes.routes.find(r => r.path.endsWith("/csv/apply"))!;
    const result = await invoke(apply, { body: { previewToken: token } });
    assert.equal(result.res.statusCode, 409);
    assert.equal(previews.take(token, 1).status, "ok", "failed transaction releases rather than consumes");
  }
  const routes = app(); const previews = new CsvPreviewStore(); const token = previews.create(1, [row], "fresh");
  const service: any = { repository: { applyCsvRelationships: async () => ({ created: 1, updated: 0 }) }, csvFingerprint: async () => "fresh", validateCsvRows: async () => valid };
  registerKnowledgeGraphAdminRoutes(routes as any, () => undefined, { service, previewStore: previews });
  const result = await invoke(routes.routes.find(r => r.path.endsWith("/csv/apply"))!, { body: { previewToken: token } });
  assert.equal(result.res.statusCode, 200); assert.equal(previews.take(token, 1).status, "used");
});

test("CSV apply distinguishes preview ownership, lifecycle, and stale state", async () => {
  const routes = app(); const previews = new CsvPreviewStore(); const service: any = { repository: { applyCsvRelationships: async () => ({}) }, csvFingerprint: async () => "fresh", validateCsvRows: async () => valid };
  registerKnowledgeGraphAdminRoutes(routes as any, () => undefined, { service, previewStore: previews });
  const apply = routes.routes.find(r => r.path.endsWith("/csv/apply"))!;
  assert.equal((await invoke(apply, { body: { previewToken: "missing" } })).res.statusCode, 410);
  const foreign = previews.create(2, [row], "fresh");
  assert.equal((await invoke(apply, { body: { previewToken: foreign } })).res.statusCode, 403);
  const used = previews.create(1, [row], "fresh"); previews.consume(used);
  assert.equal((await invoke(apply, { body: { previewToken: used } })).res.statusCode, 409);
  const applying = previews.create(1, [row], "fresh"); previews.claim(applying);
  assert.equal((await invoke(apply, { body: { previewToken: applying } })).res.statusCode, 409);
  const stale = previews.create(1, [row], "old");
  const result = await invoke(apply, { body: { previewToken: stale } });
  assert.equal(result.res.statusCode, 409); assert.match(result.res.body.message, /stale/);
  assert.equal(previews.take(stale, 1).status, "ok");
});
import assert from "node:assert/strict";
import test from "node:test";
import { registerKnowledgeGraphAdminRoutes } from "./admin-routes";
import { KnowledgeGraphValidationError } from "./types";

type Route = { method: string; path: string; auth: any; handler: any };
function fakeApp() {
  const routes: Route[] = [];
  return { routes, get(path: string, auth: any, handler: any) { routes.push({ method: "GET", path, auth, handler }); },
    post(path: string, auth: any, handler: any) { routes.push({ method: "POST", path, auth, handler }); },
    patch(path: string, auth: any, handler: any) { routes.push({ method: "PATCH", path, auth, handler }); },
    delete(path: string, auth: any, handler: any) { routes.push({ method: "DELETE", path, auth, handler }); } };
}
function response() {
  const out: any = { statusCode: 200, body: undefined, headers: {}, ended: false, status(code: number) { out.statusCode = code; return out; }, json(body: any) { out.body = body; return out; }, send(body: any) { out.body = body; return out; }, setHeader(name: string, value: string) { out.headers[name] = value; return out; }, end() { out.ended = true; return out; } };
  return out;
}
async function call(route: Route, req: any) {
  const res = response(); let passed: any;
  await route.handler({ headers: {}, ip: "127.0.0.1", params: {}, query: {}, ...req }, res, (error: any) => { passed = error; });
  return { res, passed };
}

test("all graph endpoints are guarded and relationship/rule audit actors come only from req.adminUserId", async () => {
  const app = fakeApp(); const auth = () => undefined; const audits: any[] = [];
  const repo: any = { deleteRelationship: async () => ({ id: 9, relationshipType: "related_to" }), deleteRule: async () => ({ id: 4 }) };
  const service: any = {
    repository: repo, edgeDto: (row: any) => row, summary: async () => ({}), definitions: () => [], search: async () => ({}), entity: async () => null,
    orphans: async () => ({}), health: async () => ({}), createRelationship: async (_body: any, actor: number, audit: any) => { audits.push(audit); return ({ id: 9, relationshipType: "related_to", actor }); },
    patchRelationship: async (_id: any, _body: any, audit: any) => { audits.push(audit); return ({ id: 9, status: "ACTIVE", displayOrder: 0 }); }, listRules: async () => [], createRule: async (_body: any, actor: number, audit: any) => { audits.push(audit); return ({ id: 4, actor }); },
    patchRule: async (_id: any, _body: any, audit: any) => { audits.push(audit); return ({ id: 4 }); },
    deleteRelationship: async (_id: any, audit: any) => { audits.push(audit); return ({ id: 9 }); },
    deleteRule: async (_id: any, audit: any) => { audits.push(audit); return ({ id: 4 }); },
  };
  registerKnowledgeGraphAdminRoutes(app as any, auth, { service });
  assert.equal(app.routes.length, 19);
  assert.ok(app.routes.every((route) => route.auth === auth));
  const csvRoutes = [
    "/api/admin/knowledge-graph/relationships/csv/template",
    "/api/admin/knowledge-graph/relationships/csv/export",
    "/api/admin/knowledge-graph/relationships/csv/preview",
    "/api/admin/knowledge-graph/relationships/csv/errors",
    "/api/admin/knowledge-graph/relationships/csv/apply",
  ];
  assert.deepEqual(app.routes.filter(route => route.path.includes("/relationships/csv/")).map(route => route.path), csvRoutes);
  assert.ok(app.routes.filter(route => route.path.includes("/relationships/csv/")).every(route => route.auth === auth));
  const create = app.routes.find((r) => r.method === "POST" && r.path.endsWith("/relationships"))!;
  await call(create, { adminUserId: 77, body: { actorId: 999 } });
  const update = app.routes.find((r) => r.method === "PATCH" && r.path.endsWith("/relationships/:id"))!;
  await call(update, { adminUserId: 77, params: { id: "9" }, body: { status: "ACTIVE" } });
  const rule = app.routes.find((r) => r.method === "POST" && r.path.endsWith("/quality-rules"))!;
  await call(rule, { adminUserId: 77, body: { createdByAdminId: 999 } });
  const ruleUpdate = app.routes.find((r) => r.method === "PATCH" && r.path.endsWith("/quality-rules/:id"))!;
  await call(ruleUpdate, { adminUserId: 77, params: { id: "4" }, body: { isActive: false } });
  const del = app.routes.find((r) => r.method === "DELETE" && r.path.endsWith("/relationships/:id"))!;
  await call(del, { adminUserId: 77, params: { id: "9" } });
  const ruleDelete = app.routes.find((r) => r.method === "DELETE" && r.path.endsWith("/quality-rules/:id"))!;
  await call(ruleDelete, { adminUserId: 77, params: { id: "4" } });
  assert.equal(audits.length, 6);
  assert.ok(audits.every((entry) => entry.actor === "admin-user:77"));
});

test("CSV export is cursor bounded and exposes continuation headers", async () => {
  const app = fakeApp(); const auth = () => undefined; const calls: any[] = [];
  const service: any = { repository: { exportRelationships: async (after: number, limit: number) => {
    calls.push([after, limit]); return [1, 2, 3].map(id => ({ id, sourceEntityType: "PUJA", sourceEntityId: id, relationshipType: "related_to", targetEntityType: "TEMPLE", targetEntityId: id + 10, status: "DRAFT", displayOrder: 0, metadata: {} }));
  } } };
  registerKnowledgeGraphAdminRoutes(app as any, auth, { service });
  const route = app.routes.find(r => r.path.endsWith("/csv/export"))!;
  const page = await call(route, { query: { afterId: "4", limit: "2" } });
  assert.deepEqual(calls, [[4, 2]]);
  assert.equal(page.res.headers["X-Export-Has-More"], "true");
  assert.equal(page.res.headers["X-Next-Cursor"], "2");
  assert.match(page.res.body, /,1,/); assert.doesNotMatch(page.res.body, /,3,/);
  const invalid = await call(route, { query: { afterId: "1e2" } });
  assert.equal(invalid.res.statusCode, 400);
});

test("route contract maps invalid, missing, duplicate, and dependency failures correctly", async () => {
  const app = fakeApp(); const auth = () => undefined;
  const service: any = {
    repository: { listRules: async () => [] }, edgeDto: (row: any) => row,
    summary: async () => { throw new Error("database unavailable"); }, definitions: () => [], search: async () => { throw new KnowledgeGraphValidationError("bad search"); },
    entity: async () => null, orphans: async () => ({}), health: async () => ({}),
    createRelationship: async () => { const error: any = new Error("duplicate"); error.code = "23505"; throw error; },
    patchRelationship: async () => null, createRule: async () => null, patchRule: async () => null, deleteRelationship: async () => null, deleteRule: async () => null,
  };
  registerKnowledgeGraphAdminRoutes(app as any, auth, { service });
  const search = app.routes.find((r) => r.path.endsWith("/entities/search"))!;
  assert.equal((await call(search, {})).res.statusCode, 400);
  const create = app.routes.find((r) => r.method === "POST" && r.path.endsWith("/relationships"))!;
  assert.equal((await call(create, { adminUserId: 1, body: {} })).res.statusCode, 409);
  const patch = app.routes.find((r) => r.method === "PATCH" && r.path.endsWith("/relationships/:id"))!;
  assert.equal((await call(patch, { adminUserId: 1, params: { id: "2" }, body: {} })).res.statusCode, 404);
  const summary = app.routes.find((r) => r.path.endsWith("/summary"))!;
  const result = await call(summary, {});
  assert.equal(result.passed?.message, "database unavailable");
});
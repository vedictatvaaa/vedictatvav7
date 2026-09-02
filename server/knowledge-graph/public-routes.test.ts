import assert from "node:assert/strict";
import test from "node:test";
import { registerKnowledgeGraphPublicRoutes } from "./public-routes";

function route(project: any) {
  let handler: any;
  const app: any = { get: (_path: string, found: any) => { handler = found; } };
  registerKnowledgeGraphPublicRoutes(app, { project } as any);
  return async (params: any, query: any = {}) => {
    const result: any = { statusCode: 200, body: undefined };
    const res: any = { status(code: number) { result.statusCode = code; return res; },
      json(body: any) { result.body = body; return res; } };
    await handler({ params, query }, res);
    return result;
  };
}

test("public route rejects invalid typed identities without invoking projector", async () => {
  let calls = 0; const call = route(async () => { calls++; return { groups: [] }; });
  assert.equal((await call({ type: "NOPE", id: "1" })).statusCode, 400);
  assert.equal((await call({ type: "PUJA", id: "0" })).statusCode, 400);
  assert.equal((await call({ type: "LOCATION", id: "1" })).statusCode, 400);
  assert.equal((await call({ type: "PUJA", id: "1" }, { discriminator: "CITY" })).statusCode, 400);
  assert.equal(calls, 0);
});

test("gate-off projection is an empty successful optional section", async () => {
  const call = route(async () => ({ groups: [] }));
  assert.deepEqual(await call({ type: "PUJA", id: "1" }), { statusCode: 200, body: { groups: [] } });
});

test("projection failure is isolated and exposes no error detail", async () => {
  const call = route(async () => { throw new Error("private database detail"); });
  const oldWarn = console.warn; console.warn = () => undefined;
  try {
    assert.deepEqual(await call({ type: "PUJA", id: "1" }), { statusCode: 200, body: { groups: [] } });
  } finally { console.warn = oldWarn; }
});
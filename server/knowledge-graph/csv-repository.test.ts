import assert from "node:assert/strict";
import test from "node:test";
import { KnowledgeGraphRepository } from "./repository";

function database(log: string[], failure?: "revalidate" | "update" | "audit") {
  const tx: any = {
    insert: (table: any) => ({ values: async (value: any) => {
      log.push(table === undefined ? "insert" : "insert"); if (failure === "audit" && value.action) throw new Error("audit failed"); return [];
    } }),
    update: () => ({ set: () => ({ where: () => ({ returning: async () => {
      log.push("update"); return failure === "update" ? [] : [{ id: 2 }];
    } }) }) }),
  };
  return { transaction: async (run: any, options: any) => { log.push(`transaction:${options.isolationLevel}`); return run(tx); } };
}
const audit = { actor: "admin-user:1", action: "csv", details: {}, ipAddress: null };
const rows = [{ action: "create" as const, input: { status: "DRAFT" } }, { action: "update" as const, relationshipId: 2, input: { status: "ACTIVE" } }];

test("CSV repository revalidates before serializable transactional writes and audits once last", async () => {
  const log: string[] = []; const repository = new KnowledgeGraphRepository(database(log));
  const result = await repository.applyCsvRelationships(rows, audit, async () => { log.push("revalidate"); });
  assert.deepEqual(result, { created: 1, updated: 1 });
  assert.deepEqual(log, ["transaction:serializable", "revalidate", "insert", "update", "insert"]);
});
test("CSV repository failures do not audit before rows are successful", async () => {
  for (const failure of ["revalidate", "update"] as const) {
    const log: string[] = []; const repository = new KnowledgeGraphRepository(database(log, failure));
    await assert.rejects(repository.applyCsvRelationships(rows, audit, async () => { log.push("revalidate"); if (failure === "revalidate") throw new Error("stale"); }));
    assert.equal(log.filter(x => x === "insert").length, failure === "revalidate" ? 0 : 1);
    assert.equal(log.at(-1), failure === "revalidate" ? "revalidate" : "update");
  }
});
test("CSV repository keeps audit failure inside the transaction callback", async () => {
  const log: string[] = []; const repository = new KnowledgeGraphRepository(database(log, "audit"));
  await assert.rejects(repository.applyCsvRelationships(rows.slice(0, 1), audit, async () => log.push("revalidate")), /audit failed/);
  assert.deepEqual(log, ["transaction:serializable", "revalidate", "insert", "insert"]);
});
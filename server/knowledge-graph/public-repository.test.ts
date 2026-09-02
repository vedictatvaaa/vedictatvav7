import assert from "node:assert/strict";
import test from "node:test";
import { KnowledgeGraphRepository } from "./repository";

test("ACTIVE outgoing query is bounded by limit+1 and has deterministic three-part ordering", async () => {
  const calls: any = {};
  const database: any = {
    select: () => ({ from: () => ({
      where(condition: any) {
        calls.where = condition;
        return {
          orderBy(...ordering: any[]) {
            calls.ordering = ordering;
            return { limit: async (limit: number) => { calls.limit = limit; return []; } };
          },
        };
      },
    }) }),
  };
  await new KnowledgeGraphRepository(database).activeOutgoingRelationships(
    { type: "LOCATION", id: 9, discriminator: "CITY" }, 500,
  );
  assert.ok(calls.where, "query must include source type/id/discriminator and ACTIVE predicates");
  assert.equal(calls.ordering.length, 3, "display order, relationship type, and id are deterministic");
  assert.equal(calls.limit, 501);
});
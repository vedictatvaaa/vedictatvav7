import assert from "node:assert/strict";
import test from "node:test";
import pg from "pg";

/**
 * Opt-in probe to run only after 0009 is applied:
 * RUN_KG_POSTGRES_PROBE=1 node --import tsx --test server/knowledge-graph/migration-0009-postgres.test.ts
 * Every mutation is rolled back, then independently verified as restored.
 */
test("0009 PostgreSQL semantic revision probe rolls back cleanly", {
  skip: process.env.RUN_KG_POSTGRES_PROBE !== "1" || !process.env.DATABASE_URL,
}, async () => {
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    const puja = (await client.query("SELECT id, name FROM puja_types ORDER BY id LIMIT 1")).rows[0];
    assert.ok(puja, "probe requires one existing puja_types row");
    const before = (await client.query(
      `SELECT p.name, r.updated_at AS revision, s.generation
       FROM puja_types p
       JOIN knowledge_graph_entity_revisions r ON r.entity_type='PUJA' AND r.entity_id=p.id AND r.discriminator=''
       CROSS JOIN knowledge_graph_public_state s WHERE p.id=$1 AND s.id=1`, [puja.id],
    )).rows[0];
    assert.ok(before, "probe requires the 0009 baseline revision and public-state singleton");

    await client.query("BEGIN");
    await client.query("UPDATE puja_types SET view_count=view_count+1 WHERE id=$1", [puja.id]);
    let current = (await client.query(
      `SELECT r.updated_at AS revision, s.generation FROM knowledge_graph_entity_revisions r
       CROSS JOIN knowledge_graph_public_state s WHERE r.entity_type='PUJA' AND r.entity_id=$1
       AND r.discriminator='' AND s.id=1`, [puja.id],
    )).rows[0];
    assert.equal(String(current.revision), String(before.revision));
    assert.equal(current.generation, before.generation);

    const pandit = (await client.query("SELECT id FROM pandits ORDER BY id LIMIT 1")).rows[0];
    if (pandit) {
      const panditBefore = (await client.query(
        `SELECT r.updated_at AS revision, s.generation FROM knowledge_graph_entity_revisions r
         CROSS JOIN knowledge_graph_public_state s WHERE r.entity_type='PANDIT' AND r.entity_id=$1
         AND r.discriminator='' AND s.id=1`, [pandit.id],
      )).rows[0];
      await client.query("UPDATE pandits SET last_login_at=clock_timestamp() WHERE id=$1", [pandit.id]);
      const panditAfter = (await client.query(
        `SELECT r.updated_at AS revision, s.generation FROM knowledge_graph_entity_revisions r
         CROSS JOIN knowledge_graph_public_state s WHERE r.entity_type='PANDIT' AND r.entity_id=$1
         AND r.discriminator='' AND s.id=1`, [pandit.id],
      )).rows[0];
      assert.equal(String(panditAfter.revision), String(panditBefore.revision));
      assert.equal(panditAfter.generation, panditBefore.generation);
    }

    await client.query("UPDATE puja_types SET name=name || ' ' WHERE id=$1", [puja.id]);
    current = (await client.query(
      `SELECT r.updated_at AS revision, s.generation FROM knowledge_graph_entity_revisions r
       CROSS JOIN knowledge_graph_public_state s WHERE r.entity_type='PUJA' AND r.entity_id=$1
       AND r.discriminator='' AND s.id=1`, [puja.id],
    )).rows[0];
    assert.notEqual(String(current.revision), String(before.revision));
    assert.equal(current.generation, before.generation + 1);
    await client.query("ROLLBACK");

    const restored = (await client.query(
      `SELECT p.name, r.updated_at AS revision, s.generation FROM puja_types p
       JOIN knowledge_graph_entity_revisions r ON r.entity_type='PUJA' AND r.entity_id=p.id AND r.discriminator=''
       CROSS JOIN knowledge_graph_public_state s WHERE p.id=$1 AND s.id=1`, [puja.id],
    )).rows[0];
    assert.equal(restored.name, before.name);
    assert.equal(String(restored.revision), String(before.revision));
    assert.equal(restored.generation, before.generation);
  } finally {
    await client.query("ROLLBACK").catch(() => undefined);
    await client.end();
  }
});
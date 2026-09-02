import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const sql = readFileSync("migrations/0009_knowledge_graph_entity_revisions.sql", "utf8");
const sourceTables = [
  "puja_types", "pandits", "indian_states", "indian_cities", "tirths", "temples",
  "products", "blog_posts", "master_services", "product_reviews", "tirth_yatra_tours",
] as const;
const semanticTriggerArgs: Record<typeof sourceTables[number], string> = {
  puja_types: "'PUJA','','name','slug','category','is_published'",
  pandits: "'PANDIT','','name','slug','city','specialization','verified','availability','on_leave','location_review_status','city_id','state_id'",
  indian_states: "'LOCATION','STATE','name','code','is_union_territory','is_active'",
  indian_cities: "'LOCATION','CITY','name','slug','is_active','state_id'",
  tirths: "'TIRTH','','name','slug','status','state'",
  temples: "'TEMPLE','','name','slug','status','state'",
  products: "'PRODUCT','','name','slug','category','product_type','stock'",
  blog_posts: "'ARTICLE','','title','slug','category','status','is_published'",
  master_services: "'SERVICE','','name','slug','category','service_type','is_active'",
  product_reviews: "'REVIEW','','title','rating','status'",
  tirth_yatra_tours: "'YATRA','','name','slug','route','duration_days','is_active'",
};

test("0009 revision trigger contract covers every authoritative table exactly", () => {
  for (const table of sourceTables) {
    assert.match(sql, new RegExp(`AFTER INSERT OR UPDATE OR DELETE ON ${table} FOR EACH ROW`));
    assert.equal((sql.match(new RegExp(`AFTER INSERT OR UPDATE OR DELETE ON ${table}\\b`, "g")) || []).length, 1);
    const trigger = sql.split("\n").find(line => line.includes(` ON ${table} FOR EACH ROW `))!;
    assert.ok(trigger.endsWith(`touch_knowledge_graph_entity_revision(${semanticTriggerArgs[table]});`),
      `${table} must pass exactly its public semantic columns`);
  }
  assert.match(sql, /'LOCATION','STATE'/);
  assert.match(sql, /'LOCATION','CITY'/);
  assert.match(sql, /entity_type <> 'LOCATION' AND discriminator = ''/);
  assert.match(sql, /PRIMARY KEY \(entity_type, entity_id, discriminator\)/);
});

test("0009 skips no-op updates and atomically fails closed on missing singleton", () => {
  assert.match(sql, /jsonb_each\(to_jsonb\(OLD\)\)[\s\S]+jsonb_each\(to_jsonb\(NEW\)\)/);
  assert.match(sql, /new_semantic IS NOT DISTINCT FROM old_semantic THEN RETURN NEW/);
  assert.match(sql, /INSERT INTO knowledge_graph_entity_revisions[\s\S]+UPDATE knowledge_graph_public_state/);
  assert.match(sql, /UPDATE knowledge_graph_public_state[\s\S]+IF NOT FOUND THEN[\s\S]+RAISE EXCEPTION/);
});

test("0009 trigger arguments exclude known operational fields", () => {
  const triggerContract = sql.split("\n").filter(line => line.startsWith("CREATE TRIGGER kg_revision_")).join("\n");
  for (const excluded of ["view_count", "updated_at", "created_at", "last_login_at", "password_hash",
    "review_count", "boost_active", "published_at"]) {
    assert.doesNotMatch(triggerContract, new RegExp(`'${excluded}'`));
  }
});

test("0009 propagates state revisions to cities once and uses conservative baselines", () => {
  assert.match(sql, /location_kind = 'STATE'[\s\S]+FROM indian_cities WHERE state_id = row_id/);
  assert.equal((sql.match(/UPDATE knowledge_graph_public_state SET generation/g) || []).length, 1);
  for (const [type, table] of [["PANDIT", "pandits"], ["PRODUCT", "products"], ["ARTICLE", "blog_posts"],
    ["REVIEW", "product_reviews"], ["YATRA", "tirth_yatra_tours"]] as const) {
    assert.match(sql, new RegExp(`SELECT '${type}', id, '', now\\(\\) FROM ${table}`));
  }
});
import assert from "node:assert/strict";
import test from "node:test";
import { isSafeKnowledgeGraphPath } from "./knowledge-graph-path";

test("accepts every approved knowledge graph canonical grammar", () => {
  ["/puja/ganesh-puja", "/pandit/ravi-sharma", "/pandit/city/varanasi", "/tirth/kedarnath", "/temple/kashi-vishwanath", "/product/panchmukhi-rudraksha", "/blog/meaning-of-darshan", "/tirth-yatra/chardham-yatra"].forEach(path => assert.equal(isSafeKnowledgeGraphPath(path), true, path));
});
test("rejects unsafe or noncanonical knowledge graph paths", () => {
  ["https://outside.test/product/a", "//outside.test/product/a", "/product/a?x=1", "/product/a#detail", "/product/a\\b", "/product/a%2fb", "/product/Uppercase", "/product/double--hyphen", "/product/a_b", "/products/a", "/pandit/state/a", "/puja/", "", "/blog/a/b"].forEach(path => assert.equal(isSafeKnowledgeGraphPath(path), false, path));
});
import test from "node:test";
import assert from "node:assert/strict";
import { DIRECTORY_SORTS, parseDirectoryQuery } from "./pandit-directory-query";

test("directory parser applies bounded pagination and repeatable language filters", () => {
  const parsed = parseDirectoryQuery({ language: ["Sanskrit,Hindi", "Tamil"], page: "2", pageSize: "24" });
  assert.deepEqual(parsed.languages, ["Sanskrit", "Hindi", "Tamil"]);
  assert.equal(parsed.page, 2);
  assert.equal(parsed.pageSize, 24);
  assert.equal(parsed.sort, "best_match");
  assert.deepEqual(DIRECTORY_SORTS, ["best_match", "highest_rated", "most_reviewed", "price_low", "price_high", "nearest", "experience"]);
});

test("directory parser rejects unbounded pages, invalid sorts and nearest without coordinates", () => {
  assert.throws(() => parseDirectoryQuery({ page: "0" }), /Invalid page/);
  assert.throws(() => parseDirectoryQuery({ pageSize: "25" }), /Invalid pageSize/);
  assert.throws(() => parseDirectoryQuery({ sort: "random" }), /Invalid sort/);
  assert.throws(() => parseDirectoryQuery({ sort: "nearest" }), /Nearest results/);
});

test("near-me requests default to nearest and all advertised UI sorts parse", () => {
  assert.equal(parseDirectoryQuery({ nearMe: "true", lat: "30.3165", lng: "78.0322" }).sort, "nearest");
  for (const sort of DIRECTORY_SORTS) {
    const coordinates = sort === "nearest" ? { lat: "30.3165", lng: "78.0322" } : {};
    assert.equal(parseDirectoryQuery({ sort, ...coordinates }).sort, sort);
  }
});
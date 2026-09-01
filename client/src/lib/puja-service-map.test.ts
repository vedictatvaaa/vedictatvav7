import assert from "node:assert/strict";
import test from "node:test";
import { bookingContextParams } from "./puja-service-map";

test("booking handoff preserves canonical discovery context and sets the selected Pandit", () => {
  const params = bookingContextParams(
    "?city=varanasi&service=Satyanarayan%20Katha&mode=online&source=city",
    42,
  );
  assert.equal(params.get("city"), "varanasi");
  assert.equal(params.get("service"), "Satyanarayan Katha");
  assert.equal(params.get("mode"), "online");
  assert.equal(params.get("source"), "city");
  assert.equal(params.get("pandit"), "42");
  assert.equal(params.get("pujaType"), "satyanarayan");
});

test("booking handoff drops hostile, private, and stale offering parameters", () => {
  const params = bookingContextParams(
    "?city=New%20York&service=arbitrary-value&mode=telepathy&source=attacker&token=secret&email=user%40example.com&serviceId=7&packageId=9",
    42,
  );
  assert.deepEqual([...params.entries()], [["pandit", "42"]]);
});
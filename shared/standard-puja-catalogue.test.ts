import assert from "node:assert/strict";
import test from "node:test";
import { resolveStandardPuja } from "./standard-puja-catalogue";

test("standard Puja resolver returns authoritative prices", () => {
  assert.deepEqual(resolveStandardPuja("satyanarayan"), {
    value: "satyanarayan",
    label: "Satyanarayan Katha",
    price: 5100,
  });
  assert.equal(resolveStandardPuja("pind-daan-gaya")?.price, 15100);
});

test("standard Puja resolver rejects arbitrary service handoffs", () => {
  assert.equal(resolveStandardPuja("service:Any arbitrary name"), undefined);
  assert.equal(resolveStandardPuja("Satyanarayan Katha"), undefined);
  assert.equal(resolveStandardPuja(undefined), undefined);
});
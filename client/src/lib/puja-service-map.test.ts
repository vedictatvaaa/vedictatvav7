import assert from "node:assert/strict";
import test from "node:test";
import { appendPanditRouteContext, bookingContextParams } from "./puja-service-map";

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

test("booking handoff keeps an unpriced ritual as context but drops hostile and private parameters", () => {
  const params = bookingContextParams(
    "?city=New%20York&service=arbitrary-value&mode=telepathy&source=attacker&token=secret&email=user%40example.com&serviceId=7&packageId=9",
    42,
  );
  assert.deepEqual([...params.entries()], [["requestedService", "arbitrary-value"], ["pandit", "42"]]);
});

test("booking handoff preserves safe Muhurat matching context", () => {
  const params = bookingContextParams(
    "?service=Griha%20Pravesh&mode=offline&date=2026-11-09&muhurat=11%3A40%E2%80%9312%3A25&language=Hindi&tradition=North%20Indian&location=Delhi&source=muhurat",
    7,
  );
  assert.equal(params.get("date"), "2026-11-09");
  assert.equal(params.get("muhurat"), "11:40–12:25");
  assert.equal(params.get("language"), "Hindi");
  assert.equal(params.get("tradition"), "North Indian");
  assert.equal(params.get("location"), "Delhi");
  assert.equal(params.get("source"), "muhurat");
  assert.equal(params.get("pandit"), "7");
});

test("canonical city redirects retain only safe mode and provider context", () => {
  const params = appendPanditRouteContext(
    new URLSearchParams({ city: "up-varanasi" }),
    "?mode=online&pandit=42&token=secret&email=user%40example.com",
    "puja_city",
  );
  assert.equal(params.toString(), "city=up-varanasi&mode=online&pandit=42&source=puja_city");
});
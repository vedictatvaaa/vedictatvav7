import assert from "node:assert/strict";
import test from "node:test";
import { matchesCanonicalCityReach } from "./pandit-location-reach";

const haryanaChandigarh = { cityId: 28, stateId: 8 };
const punjabChandigarh = { cityId: 69, stateId: 23 };

test("city-scoped tiers do not cross duplicate city names", () => {
  assert.equal(matchesCanonicalCityReach("silver", punjabChandigarh, haryanaChandigarh), false);
  assert.equal(matchesCanonicalCityReach("free", punjabChandigarh, haryanaChandigarh), false);
  assert.equal(matchesCanonicalCityReach("silver", haryanaChandigarh, haryanaChandigarh), true);
});

test("gold reaches the selected canonical city's state, not its name", () => {
  assert.equal(matchesCanonicalCityReach("gold", { cityId: 99, stateId: 8 }, haryanaChandigarh), true);
  assert.equal(matchesCanonicalCityReach("gold", punjabChandigarh, haryanaChandigarh), false);
});

test("unresolved rows cannot match canonical location results", () => {
  assert.equal(matchesCanonicalCityReach("gold", { cityId: null, stateId: null }, haryanaChandigarh), false);
  assert.equal(matchesCanonicalCityReach("silver", { cityId: null, stateId: null }, haryanaChandigarh), false);
});
import test from "node:test";
import assert from "node:assert/strict";
import {
  clearDailyThoughtCache,
  curatedThoughtForDate,
  getDailyThought,
  istDateKey,
  validateDailyThought,
} from "./japa-daily-thought";

test("IST date keys use the India calendar day at UTC boundaries", () => {
  assert.equal(istDateKey(new Date("2026-01-01T18:29:59.000Z")), "2026-01-01");
  assert.equal(istDateKey(new Date("2026-01-01T18:30:00.000Z")), "2026-01-02");
});

test("curated fallback is deterministic and changes with its date", () => {
  const date = new Date("2026-04-15T03:00:00Z");
  assert.equal(curatedThoughtForDate(date), curatedThoughtForDate(date));
  assert.notEqual(
    curatedThoughtForDate(new Date("2026-04-15T03:00:00Z")),
    curatedThoughtForDate(new Date("2026-04-16T03:00:00Z")),
  );
});

test("thought validation rejects unsafe, long, and non-Hindi output", () => {
  assert.equal(validateDailyThought("आज भक्ति से मन शांत और सरल रहे।"), true);
  assert.equal(validateDailyThought("यह divine message आपके धन लाभ की guarantee है।"), false);
  assert.equal(validateDailyThought("आज का दिन शुभ रहेगा। कल भी आनंद रहेगा। परसों भी शांति रहेगी।"), false);
  assert.equal(validateDailyThought("A warm devotional thought."), false);
});

test("disabled provider returns and caches the curated thought", async () => {
  clearDailyThoughtCache();
  const now = new Date("2026-05-10T04:00:00Z");
  const previousEnabled = process.env.AI_ENABLED;
  const previousKey = process.env.OPENAI_API_KEY;
  try {
    process.env.AI_ENABLED = "false";
    delete process.env.OPENAI_API_KEY;
    const first = await getDailyThought(now);
    const second = await getDailyThought(now);
    assert.equal(first.source, "curated");
    assert.equal(first.thought, curatedThoughtForDate(now));
    assert.deepEqual(second, first);
  } finally {
    if (previousEnabled === undefined) delete process.env.AI_ENABLED;
    else process.env.AI_ENABLED = previousEnabled;
    if (previousKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = previousKey;
  }
});
---
name: TypeScript baseline is not a gate
description: Why `npm run check` / tsc cannot be used as a pass/fail gate in this repo, and what to actually watch for.
---

The repo carries ~565 pre-existing `tsc --noEmit` errors and ships by running
`tsx` directly (no type-check step in the dev/build path). `npm run check`
therefore always "fails" and is NOT a meaningful CI/release gate.

**Why:** the team tolerates loose typing across `shared/schema.ts` (hundreds of
`Type 'boolean' is not assignable to type 'never'` on drizzle column defaults)
and many client/server files. tsx strips types at runtime, so these never break
execution.

**How to apply:** don't treat a clean `tsc` as the bar. Instead, after editing,
run tsc and diff against the baseline — only care about NEW errors in the exact
lines/files you touched. One real trap: this tsconfig flags
`for..of` over a `Set`/`Map` (TS2802 downlevelIteration) — wrap with
`Array.from(...)` when iterating Sets/Maps in new code, or you add a genuine
new error even though similar pre-existing ones are ignored elsewhere.

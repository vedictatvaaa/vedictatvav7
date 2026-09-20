# Japa Guided Audio and Achievement Sharing Implementation Plan

## Source of truth

- Approved design: `docs/superpowers/specs/2026-09-20-japa-guided-audio-and-share-design.md`
- Primary UI: `client/src/components/JapCounter.tsx`
- AI provider: `server/ai-provider.ts`
- Japa API routes: `server/routes.ts`

## Implementation principles

- Keep every existing breathing phase recording and its current browser fallback.
- Use the male Hindi devotional voice only for mantra benefits and the final completion narration.
- Make narration transitions explicit and idempotent.
- Keep the existing counter update as the only authority for counts, malas, streaks, and completion.
- Never block chanting or sharing indefinitely when audio or AI fails.
- Never send user identity, counts, streaks, or other private counter state to AI.

## Phase 1: Isolate content and flow types

### Files

- Add `client/src/lib/japa-guidance.ts`
- Update `client/src/components/JapCounter.tsx`
- Update `client/src/data/mantra-library.ts` only if the existing mantra type is the appropriate source for stable benefit copy

### Work

1. Define a `JapaGuidanceState` union for:
   - `idle`
   - `warmup_intro`
   - `exercise_intro`
   - `exercise_active`
   - `mantra_benefit_intro`
   - `chanting_ready`
   - `chanting_active`
   - `chanting_complete_narration`
   - `achievement_share`
2. Define a small event model for:
   - starting or skipping warmup
   - recorded narration ending, failing, or timing out
   - moving between exercises
   - starting manual or automatic chanting
   - reaching the selected target
   - dismissing or restarting from the share screen
3. Move guidance copy into pure data:
   - exercise display name
   - existing-voice exercise introduction and benefit
   - Hindi mantra benefit script keyed by stable mantra ID
   - neutral Hindi fallback benefit
   - curated Hindi daily thoughts
4. Add pure helpers for:
   - benefit lookup
   - deterministic IST-date fallback thought selection
   - achievement snapshot construction
   - promotional share-message construction
5. Keep custom or unknown mantras on the neutral benefit fallback.

### Verification

- Add focused pure-function tests for mantra fallback, IST date selection, achievement snapshots, and share copy.
- Confirm the promotional copy contains the canonical `/digital-japa-counter` URL and no private fields.

## Phase 2: Preserve and extend breathing narration

### Files

- Update `client/src/components/JapCounter.tsx`
- Add recorded exercise-introduction assets under the existing audio asset convention if approved assets are available

### Work

1. Extend `BreathStage` with an introduction:
   - benefit text shown on screen
   - existing-voice speech fallback text
   - optional recorded introduction URL
2. Replace the current direct transition into an exercise with:
   - set `exercise_intro`
   - play that exercise's introduction once
   - start the stage timer only after narration ends
3. Keep `playRecordedBreathGuide`, `speakBreathGuide`, and every phase asset unchanged for active exercise cues.
4. Add a bounded introduction timeout so a missing or stalled clip advances safely.
5. Update skip behavior:
   - skip current exercise introduction or stage without replay
   - skip full warmup into `mantra_benefit_intro`
6. On unmount, stage skip, or state change, invalidate pending audio callbacks through the existing generation/cancellation refs.
7. Update visible and screen-reader text so the exercise benefit is available without audio and does not compete with the phase countdown live region.

### Verification

- Exercise name and benefit play once before each stage.
- Stage timer does not run during its introduction.
- Existing phase recordings remain the primary active-stage audio.
- Browser speech remains the breathing fallback.
- Skip never starts counting before the mantra-benefit transition.

## Phase 3: Add reusable Hindi devotional narration

### Files

- Add `client/src/hooks/use-japa-devotional-narration.ts`
- Reuse helpers from `client/src/lib/japa-guidance.ts`
- Use the existing audio integration under `client/replit_integrations/audio/`
- Update or add a server narration route only if the existing managed audio route cannot accept the required text, voice, cache key, and bounded response

### Work

1. Build a hook with this contract:
   - input: purpose, Hindi text, stable cache key
   - methods: play and cancel
   - result callbacks: ended, failed, timed out
2. Configure the preferred male Hindi devotional cinematic voice using the project's existing managed audio path.
3. Cache clips by stable content key so a repeated mantra benefit or daily closing does not regenerate audio.
4. Use browser Hindi speech only if generated/recorded audio is unavailable.
5. Add a strict maximum request and playback wait.
6. Ensure stale callbacks cannot advance a newer session.
7. Expose equivalent text and a visible Continue action while narration is active.

### Verification

- The devotional hook does not change breathing audio behavior.
- Ending, error, timeout, cancel, and unmount each invoke at most one terminal transition.
- Manual and auto-chant cannot begin while the mantra-benefit narration is active.

## Phase 4: Add the daily positive-thought API

### Files

- Update `server/routes.ts` near the existing Japa AI route
- Reuse `server/ai-provider.ts`
- Add `server/japa-daily-thought.ts`
- Add `server/japa-daily-thought.test.ts`

### Work

1. Put prompt construction, response validation, IST-date handling, cache behavior, and curated fallback selection in `server/japa-daily-thought.ts`.
2. Create a public rate-limited endpoint such as `GET /api/japa/daily-thought`.
3. Do not accept or forward user profile or counter data.
4. Use `createStructuredCompletion` with a strict response containing only the short Hindi thought.
5. Require:
   - one or two short sentences
   - warm devotional tone
   - no predictions or divine-message claims
   - no medical, financial, fear, guilt, or guaranteed-outcome claims
6. Cache by IST calendar date.
7. Return the deterministic curated fallback when:
   - AI is not configured
   - provider request fails or times out
   - output is malformed or violates length/content checks
8. Return a stable response shape identifying whether the thought came from AI or curated fallback without exposing provider details.

### Verification

- Same IST date returns the same thought without repeated provider calls.
- Date rollover selects or requests a different thought where possible.
- Provider failure and malformed output return a valid fallback.
- Tests verify no request payload contains user or achievement data.

## Phase 5: Gate chanting with the mantra-benefit introduction

### Files

- Update `client/src/components/JapCounter.tsx`
- Use `client/src/hooks/use-japa-devotional-narration.ts`
- Use `client/src/lib/japa-guidance.ts`

### Work

1. After the final exercise, or when the user skips the warmup, enter `mantra_benefit_intro`.
2. Look up the selected mantra's Hindi benefit script.
3. Show the script and play it through the devotional narration hook.
4. Disable:
   - manual orb taps
   - keyboard counting
   - shake-to-count
   - auto-chant start
5. On narration success, failure, explicit Continue, or timeout, enter `chanting_ready`.
6. Preserve the current saved-mid-mala rule:
   - a resumed count above zero bypasses warmup and mantra-benefit introduction
   - it goes directly to `chanting_ready`
7. Reset the one-session guidance state only when starting a genuinely new mala.

### Verification

- Every new mala receives one benefit introduction.
- A saved partial mala receives none.
- Warmup skip receives the benefit introduction.
- All input paths respect the narration gate.

## Phase 6: Add one closing narration transition

### Files

- Update `client/src/components/JapCounter.tsx`
- Use `client/src/hooks/use-japa-devotional-narration.ts`
- Use `client/src/lib/japa-guidance.ts`

### Work

1. Capture an immutable achievement snapshot immediately after the existing authoritative completion update:
   - selected mantra
   - target
   - malas
   - current streak
   - today's count
   - lifetime count
   - optional devotee name already held locally
2. Enter `chanting_complete_narration` once.
3. Fetch the daily thought before or during the closing preparation without blocking indefinitely.
4. Build a short Hindi script:
   - chanting is complete
   - devotional blessing
   - positive-day wish
   - daily thought
5. Stop auto-chant and reject new counting input during closing narration.
6. Keep the current bell, visual blessing, persistence, and completion metrics; do not add another counter update.
7. Enter `achievement_share` on success, failure, timeout, or explicit Continue.
8. Persist only the minimum transition marker needed to prevent a reload from incrementing or replaying completion incorrectly.

### Verification

- One target completion creates one snapshot and one closing narration.
- Rapid taps, auto-chant callbacks, undo, rerender, and reload cannot duplicate the achievement.
- Share opens after successful, failed, and timed-out narration.

## Phase 7: Build the achievement share screen

### Files

- Add `client/src/components/japa/JapaAchievementShare.tsx`
- Update `client/src/components/JapCounter.tsx`
- Reuse `client/src/lib/japa-guidance.ts`

### Work

1. Render the immutable completion snapshot in a dedicated dialog or full-screen overlay.
2. Include:
   - mantra
   - completed repetitions
   - mala count
   - streak
   - today's count
   - lifetime count
3. Prefill:
   - `I completed my Japa on the Vedic Tatva Digital Japa Counter.`
   - mantra and achievement
   - canonical Japa Counter link
4. Add explicit actions:
   - native `navigator.share`
   - WhatsApp
   - copy message and link
   - dismiss
   - begin another mala
5. Never open an external share target automatically.
6. Keep focus trapped in the dialog, announce the heading once, and restore focus when dismissed.
7. Respect reduced motion and provide visible success/failure feedback for copy and native share.

### Verification

- Values come from the completion snapshot, not mutable live state.
- Native Share is attempted only after a tap.
- WhatsApp and copy remain available when native Share is absent or rejected.
- No share message includes private profile or correction data.

## Phase 8: Integrate, test, and verify

### Files

- Add focused tests beside the new pure modules and server route
- Extend an existing browser Japa test or add one following the project's browser-test convention

### Work

1. Run pure helper and server-route tests.
2. Run a focused browser journey:
   - new mala
   - all exercise introductions
   - skip current exercise
   - skip full warmup
   - benefit narration gate
   - manual completion
   - auto-chant completion where practical
   - narration failure/timeout
   - automatic share-screen transition
   - user-initiated share/copy
3. Verify a saved partial count bypasses introductions.
4. Verify offline/provider-down behavior uses the curated thought and does not trap the flow.
5. Restart the application workflow once after the complete batch.
6. Inspect workflow and browser logs.
7. Capture final mobile and desktop previews of the warmup introduction, mantra-benefit screen, closing narration, and share screen.

## Completion criteria

- Existing breathing phase voice and fallback remain unchanged.
- Every exercise announces its name and benefit before timing starts.
- Male Hindi devotional narration is limited to mantra benefits and completion.
- A daily AI thought is stable within the IST day and always has a curated fallback.
- Chanting and completion transitions cannot overlap or double-count.
- The achievement share screen opens immediately after closing narration resolves.
- Sending or posting remains user initiated.
- Focused automated checks pass and the workflow starts cleanly.
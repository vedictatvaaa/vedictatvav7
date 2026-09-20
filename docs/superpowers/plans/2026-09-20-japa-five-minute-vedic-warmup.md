# Japa Five-Minute Vedic Warmup Implementation Plan

## Objective

Implement the approved pre-chant flow in `JapCounter`: a short recorded musical
introduction followed by three 80-second breathing stages, using high-quality
Vedic ambience and natural prerecorded Indian-English female guidance as the
primary audio.

## 1. Prepare audio assets

- Read the audio-generation requirements and provider constraints.
- Generate an original, natural-sounding instrumental Vedic ambient track with
  tanpura, restrained bansuri, and soft temple-bell accents.
- Generate natural female Indian-English clips for:
  - Warmup introduction
  - Each reusable breathing phase cue
- Inspect generated files and preserve browser speech synthesis as fallback.

## 2. Extend the warmup state machine

- Add an explicit intro state before stage zero that advances when the
  approximately nine-second recording ends, with a 10-second timer fallback.
- Set every breathing stage to exactly 80 seconds:
  - Nadi Shodhana: five 16-second rounds
  - Sama Vritti: five 16-second rounds
  - Bhramari: eight 10-second rounds
- Auto-advance intro and stages while retaining immediate intro, stage, and
  full-warmup skip paths.
- Keep the first-tap and auto-chant warmup gate unchanged.

## 3. Add resilient audio controllers

- Add a background-music controller with play, mute, fade, stop, reset, and
  load-failure handling.
- Add a recorded-guide controller that cancels the previous clip before each
  new stage or phase cue.
- Start each phase clip at the same boundary as its matching visual counter;
  do not let longer stage introductions cover active inhale/exhale phases.
- Fall back in order: recorded guide, `en-IN` device speech, short chime.
- Stop both music and guide audio on every exit path and on unmount.

## 4. Update the dialog experience

- Add the “Prepare for your mantra” intro state with a one-minute countdown.
- Add separate music and voice controls.
- Add “Begin breathing” and “Skip warmup” to the intro.
- Retain stage, round, phase, countdown, “Skip stage,” and “Skip warmup” in
  the exercise view.
- Keep the safety note and accessible dialog labels.

## 5. Verify behavior

- Run the production build and `git diff --check`.
- Restart the application workflow and inspect logs.
- Confirm the first tap does not count.
- Confirm the intro advances on audio completion and all stages last 80 seconds.
- Confirm all skip, mute, dismissal, mantra-change, completion, and unmount
  paths stop audio.
- Confirm rejected or missing audio never blocks chanting.
- Capture a fresh preview of the running app.
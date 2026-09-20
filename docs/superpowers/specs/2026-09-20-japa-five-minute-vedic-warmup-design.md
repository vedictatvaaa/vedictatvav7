# Vedic Pre-Chant Warmup

## Goal

Replace the short pre-chant breathing sequence with a guided warmup that begins
with a natural recorded introduction and soft Vedic ambient background music,
then guides three 80-second breathing exercises before the first japa count is
accepted.

The warmup must remain optional, interruptible, accessible, and safe to leave
at any point. It must never prevent the devotee from chanting.

## Approved flow

The first tap on the japa orb opens the warmup instead of counting:

| Segment | Duration | Content |
| --- | ---: | --- |
| Intro | About 9 seconds | “Prepare for your mantra” narration and ambient Vedic music |
| Nadi Shodhana | 80 seconds | Five 16-second rounds: inhale left, exhale right, inhale right, exhale left |
| Sama Vritti | 80 seconds | Five 16-second rounds: inhale, hold, exhale, rest |
| Bhramari | 80 seconds | Eight 10-second rounds: four-second inhale, six-second humming exhale |

The intro has a **Begin breathing** action that advances immediately to the
first exercise. Otherwise, the first exercise starts as soon as the recorded
introduction ends. A 10-second timer is retained only as a failure fallback
when audio playback cannot complete normally.

When the final segment completes, the music fades out, the dialog closes, and
the next tap counts the first mantra repetition. Existing auto-chant behavior
uses the same warmup gate.

## Audio design

### Background music

Add one high-quality original Vedic ambient composition. It should use
natural-sounding tanpura, restrained bansuri, and occasional soft temple-bell
accents, with a warm mix and no obvious synthetic or repetitive artifacts. It
must contain no spoken words, no lyrics, and no medical claims. The music plays
quietly beneath the breathing guide and fades out when the warmup ends.

Prefer a full-duration five-minute composition. If the music generator cannot
produce five minutes in one render, use a longer high-quality source segment
and crossfade its loop so there is no audible gap or abrupt restart.

Music is controlled independently from the spoken guide:

- Music on/off control is visible in the intro and exercise states.
- The music element is created once per warmup session and stopped/reset on
  skip, dismissal, completion, mantra change, and component unmount.
- If the asset fails to load or playback is rejected, the visual guide and
  spoken cues continue without blocking the user.

### Spoken cues

The normal experience uses prerecorded guide clips generated with a natural,
soft, clear female Indian-English voice. Delivery should be warm and human,
with relaxed pacing, natural sentence stress, and brief pauses. It must not
sound robotic, metallic, clipped, or like a basic computer voice.

Create separate clips for the intro and every reusable phase cue. Exercise
timers use phase cues only: each recorded inhale, hold, exhale, rest, or hum
starts at the same boundary as its visual counter. Stage names and descriptions
remain visible rather than playing a longer introduction over active phases.

The current device speech-synthesis path remains only as an emergency fallback
when a recorded clip is missing or fails to play. Request `en-IN` and prefer an
available female voice for that fallback. Voice mute remains independent from
music mute. A short chime remains the final fallback when neither recorded
speech nor device speech is available.

## UI and accessibility

The intro state shows:

- “Prepare for your mantra”
- A short introduction countdown
- A concise safety note
- Music toggle
- Voice toggle
- **Begin breathing**
- **Skip warmup**

The exercise state shows the current stage, round, phase, countdown, visual
breath expansion, music and voice controls, **Skip stage**, and **Skip
warmup**. The existing dialog dismissal behavior treats Escape and overlay
dismissal as a full warmup skip.

The live phase and countdown remain available to screen readers through the
existing labelled dialog content and test IDs. Focus stays inside the dialog,
and no audio control is the only way to understand or complete the exercise.
The safety note says: “Stop if uncomfortable. This is not medical advice.”

## Implementation boundaries

Keep the sequence state in `client/src/components/JapCounter.tsx` because the
existing warmup gate, auto-chant start, voice cues, and dialog are colocated
there. Add focused audio lifecycle helpers for the ambient music and recorded
guide clips. Do not change mantra audio, tap counting, persistence, or existing
sound and vibration controls.

State transitions:

```text
idle
  -> intro
  -> exercise(stage 0)
  -> exercise(stage 1)
  -> exercise(stage 2)
  -> complete
```

Any state can transition to `skipped`, which stops speech and music, marks the
session warmup as complete, and returns to the existing counting flow.

## Failure handling

- Missing or rejected music playback is non-blocking.
- Missing recorded speech falls back to device speech synthesis.
- Missing speech synthesis is non-blocking; use the existing chime fallback.
- Any skip or dismissal cancels active speech and pauses/resets music.
- Unmount cleanup must clear all timers and release audio resources.
- A user who skips immediately must be able to count on the next tap.

## Verification

1. Build the project and run `git diff --check`.
2. Restart the application workflow.
3. Confirm the first tap opens the intro and does not increment the count.
4. Confirm music and recorded spoken cues start only from a user gesture.
5. Listen for audible music loop seams, clipping, harsh synthetic timbres, and
   voice artifacts; the primary guide must sound natural and human.
6. Confirm the introduction advances immediately when its recording ends and
   each exercise stage lasts 80 seconds.
7. Confirm every exercise phase cue starts with its matching visual counter,
   including the first inhale of each stage.
8. Confirm intro skip, stage skip, full skip, Escape, overlay dismissal, mute,
   final completion, mantra change, and unmount stop audio cleanly.
9. Confirm auto-chant waits for warmup completion or skip.
10. Capture a fresh preview and inspect browser/workflow logs for new errors.
# Five-Minute Vedic Pre-Chant Warmup

## Goal

Replace the short pre-chant breathing sequence with a five-minute guided
warmup that begins with a one-minute introduction and soft Vedic ambient
background music, then guides three breathing exercises before the first japa
count is accepted.

The warmup must remain optional, interruptible, accessible, and safe to leave
at any point. It must never prevent the devotee from chanting.

## Approved flow

The first tap on the japa orb opens the warmup instead of counting. The
unskipped sequence is exactly five minutes:

| Segment | Duration | Content |
| --- | ---: | --- |
| Intro | 60 seconds | Prepare for mantra, safety note, ambient Vedic music |
| Nadi Shodhana | 80 seconds | Five 16-second rounds: inhale left, exhale right, inhale right, exhale left |
| Sama Vritti | 80 seconds | Five 16-second rounds: inhale, hold, exhale, rest |
| Bhramari | 80 seconds | Eight 10-second rounds: four-second inhale, six-second humming exhale |

The intro has a **Begin breathing** action that advances immediately to the
first exercise. Waiting through the intro starts the exercise automatically.
Skipping the intro therefore intentionally shortens the session, just as
skipping a stage does.

When the final segment completes, the music fades out, the dialog closes, and
the next tap counts the first mantra repetition. Existing auto-chant behavior
uses the same warmup gate.

## Audio design

### Background music

Add one generated, instrumental Vedic ambient loop. It should use a tanpura
drone, restrained bansuri texture, and occasional soft temple-bell accents. It
must contain no spoken words, no lyrics, and no medical claims. The loop plays
quietly beneath the breathing guide, repeats without a noticeable gap, and
fades out when the warmup ends.

Music is controlled independently from the spoken guide:

- Music on/off control is visible in the intro and exercise states.
- The music element is created once per warmup session and stopped/reset on
  skip, dismissal, completion, mantra change, and component unmount.
- If the asset fails to load or playback is rejected, the visual guide and
  spoken cues continue without blocking the user.

### Spoken cues

Keep the current device speech-synthesis path. Request `en-IN`, prefer an
available female voice, and use the soft, slower delivery already configured.
Voice mute remains independent from music mute. A short chime remains the
fallback when speech synthesis is unavailable.

## UI and accessibility

The intro state shows:

- “Prepare for your mantra”
- A one-minute countdown
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
there. Add only the minimum audio lifecycle helpers needed for the ambient
music. Do not change mantra audio, tap counting, persistence, or existing sound
and vibration controls.

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
- Missing speech synthesis is non-blocking; use the existing chime fallback.
- Any skip or dismissal cancels active speech and pauses/resets music.
- Unmount cleanup must clear all timers and release audio resources.
- A user who skips immediately must be able to count on the next tap.

## Verification

1. Build the project and run `git diff --check`.
2. Restart the application workflow.
3. Confirm the first tap opens the intro and does not increment the count.
4. Confirm music and spoken cues start only from a user gesture.
5. Confirm the unskipped segment durations total five minutes.
6. Confirm intro skip, stage skip, full skip, Escape, overlay dismissal, mute,
   final completion, mantra change, and unmount stop audio cleanly.
7. Confirm auto-chant waits for warmup completion or skip.
8. Capture a fresh preview and inspect browser/workflow logs for new errors.
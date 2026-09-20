---
name: Recorded breathing guide voice
description: The Japa warmup uses bundled recorded Indian-English guidance with guarded browser speech and bell fallback.
---

Recorded clips are the primary breathing guide for the warmup. Browser speech synthesis is a compatibility fallback when a clip cannot play, and the existing bell cue is used only when neither spoken path is available. All fallback paths must preserve visual countdowns and stage transitions.

**Why:** Generated voice delivery is not reliable across providers or devices, while some browsers cannot decode or autoplay the bundled files.

**How to apply:** Keep the recorded asset imports and generation-scoped stop/complete handling together. Mute, stage skip, warmup dismissal, completion, and unmount must stop both recorded audio and speech without allowing stale callbacks to advance a later stage.
---
name: Breathing guide voice fallback
description: Voice guidance behavior for the pre-chant breathing warmup when recorded audio assets cannot be generated.
---

The breathing warmup should remain usable without a bundled recording: prefer a device-provided English-India voice with a soft, clear delivery, then use the closest English voice or a short chime fallback. Every spoken cue must stop on mute, stage skip, warmup dismissal, completion, or unmount.

**Why:** The configured voice-generation provider returned a payment-required response during implementation, so making the warmup depend on generated files would leave the first-chant flow silent or blocked.

**How to apply:** If recorded guide clips are added later, keep the current browser-voice path as the fallback and preserve the same cancellation and skip behavior.
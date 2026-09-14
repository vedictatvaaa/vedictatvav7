---
name: Pandit onboarding accessibility
description: Long signup validation should focus a stable section target and announce one consolidated error.
---

For long Pandit onboarding forms, map each stable requirement message to the first relevant field or grouped section, scroll it into view, and use one live error region; inline copies should not add competing alert announcements.

**Why:** Applicants may submit from far down a long form, and multiple live regions make assistive technology repeat the same correction instead of guiding recovery.

**How to apply:** Keep grouped controls such as exact location, specialist Pujas, service confirmation, and profile photo focusable through stable wrapper IDs, and preserve the applicant’s entered values while reporting failures.

Browser-level coverage for this long form should use trusted clicks for geolocation controls, DOM events for off-screen checkbox setup, and a submit guard to prevent smooth-scroll navigation races.

**Why:** Chromium geolocation requires user activation, while coordinate clicks on controls far below a Lenis-scrolled viewport can land after a layout shift and submit the form unexpectedly.

**How to apply:** Keep browser fixtures deterministic without bypassing the form handler: grant test geolocation permission, use actual user clicks for the location button, and protect the final validation assertion from native fallback navigation.
---
name: SEO network launch gates
description: Launch-safety rule for public SEO networks that are protected by an administrative rollout setting.
---

A default-off SEO network is not launch-complete merely because its public pages, projection, and schemas work; the administrative enablement path must also work end to end, and its HTTP contract test must run in the standard test suite.

**Why:** A correct public route family remained unavailable because the admin client and server rollout/editorial contracts had drifted, while focused nested tests were outside normal test discovery.

**How to apply:** For any gated SEO launch, verify the admin read/write endpoints, rollout transition, public disabled/enabled behavior, and editorial lifecycle through an HTTP-level test discovered by the repository's normal test command. Sitemap routes must consume the rollout-aware public sitemap producer directly rather than duplicating gate state or projection filtering locally.
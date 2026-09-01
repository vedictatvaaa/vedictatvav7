---
name: Swiss Ephemeris install override
description: Why swisseph-v2 needs a node-gyp override for secure, repeatable installs on Replit.
---

Keep the `swisseph-v2` transitive `node-gyp` override on a Node 20-compatible v12 release.

**Why:** `swisseph-v2` declares `node-gyp ^10.0.1`; npm resolves that to a version depending on vulnerable `tar 6.2.1`, which Replit's package firewall blocks and causes post-merge setup to fail.

**How to apply:** When updating `swisseph-v2`, verify the resolved dependency tree uses `node-gyp` v12+ and `tar` v7, then run the configured post-merge setup. Do not remove the override unless the upstream dependency range is fixed.
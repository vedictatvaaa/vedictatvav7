---
name: Native dependency firewall
description: Startup dependency installation can be blocked by the package firewall when native astrology dependencies resolve an old tar release.
---

Fresh installs of this project can fail before the server starts because the native astrology package pulls node-gyp, which historically resolves tar 6 and is rejected by the package firewall. The working path is a Node 20-compatible node-gyp 12 override, which resolves tar 7 and still builds the native binding.

**Why:** Without installed dependencies the preview workflow stops at an interactive npx install prompt; using the compatible override lets the native binding build and the server boot.

**How to apply:** If a clean environment reports tar 6 blocked while installing, inspect the existing package override before changing application code or workflow commands. Keep the Node 20-compatible node-gyp version rather than jumping to a release requiring Node 22.
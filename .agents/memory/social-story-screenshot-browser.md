---
name: Social Story screenshot browser
description: Server-side storefront Story captures require the workspace Chromium binary rather than Puppeteer's bundled browser.
---

Use `/repl/tools/bin/chromium` (or `PUPPETEER_EXECUTABLE_PATH`) for server-side Puppeteer captures in this workspace.

**Why:** Puppeteer's browser cache may be empty even though the Replit Chromium binary is available, which silently forces Story rendering onto its fallback card.

**How to apply:** Resolve an existing executable before calling `puppeteer.launch`; keep a non-browser fallback for environments where capture still cannot run.
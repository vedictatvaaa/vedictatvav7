---
name: Mockup preview access
description: How to make visual mockups reachable from the Replit workspace UI
---

Container-local visual companion URLs are not reachable from the user's browser. Rendered UI mockups need the workspace canvas and an HTTPS preview path; an existing mockup-sandbox directory may still need its preview tooling installed and its reserved service port started.

**Why:** A localhost brainstorm server can be healthy inside the container while the user sees “refused to connect,” and an unregistered artifact directory does not automatically create a workflow.

**How to apply:** For visual review, place canvas iframe placeholders first, then use the mockup sandbox on its configured service port and update the placeholders to live HTTPS preview URLs. Keep mockup dependencies isolated from the main app when possible.
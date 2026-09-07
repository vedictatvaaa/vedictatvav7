---
name: GitHub push reconciliation
description: How to handle the watched production branch when shell credentials and connector uploads are unavailable.
---

Reconcile remote commits locally before asking for a Git-panel Push. Avoid “Sync Changes” when the panel warns that it will merge conflicts; fetch and resolve the branch deliberately first.

**Why:** The shell HTTPS credential can be stale while Replit’s Git UI remains authorized. The GitHub connector may successfully perform small writes yet receive Cloudflare 403 responses for particular source payloads across REST, Contents, and GraphQL, so repeated API retries are not a reliable push path.

**How to apply:** Fetch the watched branch read-only, merge it locally, resolve conflicts while preserving the verified release contract, and leave a clean ahead-only branch. Then use the Git panel’s Push action rather than Sync. Clean up any temporary connector-created branch.
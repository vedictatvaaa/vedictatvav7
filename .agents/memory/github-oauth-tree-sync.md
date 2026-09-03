---
name: GitHub OAuth tree sync
description: Reliable fallback for syncing a large local tree when Git CLI authentication is unavailable.
---

For a guarded multi-file GitHub sync, prefer the attached GitHub connection's SDK client and Git Data API (`createBlob`, `createTree`, `createCommit`, `updateRef`) over proxy POSTs or passing a large encoded tree across the durable-runtime boundary.

**Why:** Large proxy/durable payload attempts can fail before the branch ref moves. Cloudflare may also reject a full blob containing mail-provider configuration patterns even when other larger blobs succeed.

**How to apply:** Verify the expected remote base, upload blobs and a base-tree-derived commit, and update with `force: false`. If one module alone triggers Cloudflare, isolate new logic in a focused module rather than changing transport/config code. Fetch back and realign locally.
---
name: GitHub OAuth tree sync
description: Reliable fallback for syncing a large local tree when Git CLI authentication is unavailable.
---

For a guarded multi-file GitHub sync, prefer the attached GitHub connection's SDK client and Git Data API (`createBlob`, `createTree`, `createCommit`, `updateRef`) over proxy POSTs or passing a large encoded tree across the durable-runtime boundary.

**Why:** Large proxy/durable payload attempts can fail with a connector serialization error before the branch ref moves, while the SDK client can upload the same blobs and tree successfully.

**How to apply:** Verify the remote ref still equals the expected base, upload blobs and a base-tree-derived commit, update the ref with `force: false`, fetch it back, confirm the local and remote trees match, then realign the local branch pointer.
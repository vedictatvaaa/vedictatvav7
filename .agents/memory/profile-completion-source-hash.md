---
name: Legacy profile completion source hashes
description: Admin profile completion proposals must be recomputed and source-hash checked before apply.
---

Legacy Pandit completion is a review workflow, not a bulk profile write. Dry-run findings must carry source paths and a snapshot hash; persistence and apply must compare the current governed facts to that hash and leave visibility and booking flags unchanged.

**Why:** Legacy records often lack reliable profile facts, and source data can change between an Admin dry-run, review, and apply. Without a current snapshot check, an approved proposal could overwrite a newer fact or turn an AI draft into an unreviewed assertion.

**How to apply:** Keep deterministic normalization separate from unknown fields and AI drafts. AI output remains draft-only, must cite supplied paths, and should be written to unpublished storefront content only after Admin approval.
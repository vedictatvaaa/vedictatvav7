---
name: Pandit coordinate evidence
description: Safety boundary for registration coordinates, Admin resolution, and approval.
---

Registration coordinates have two trusted paths: explicit browser GPS with permission and an address selected from a verified geocoder. Address selections must carry short-lived server-signed evidence; posted coordinates alone are not proof. Applications without complete coordinate provenance cannot be approved or become bookable. Admin geocoder results are drafts until explicitly applied, and AI results must remain visibly approximate.

**Why:** A city or typed address is not reliable enough to publish or use for booking, while AI can only provide an approximate review aid.

**How to apply:** Preserve source, confidence, accuracy, capture time, and place identity through application approval and Pandit edits. Keep exact coordinates inside protected Admin views and out of public DTOs.
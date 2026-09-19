---
name: Pandit correction privacy boundary
description: Privacy rules for applicant-requested correction links and audit events.
---

Correction links are bearer credentials. Put the token in a URL fragment, remove the fragment before analytics or application rendering, and send it only in a dedicated header to fixed same-origin endpoints. Hash it at rest and return no-store responses.

Correction emails may identify the requested field names and provide a safe explanation, but must not include raw registered addresses, exact coordinates, location evidence, or other private values. Audit events should contain actor type and field names, not values.

**Why:** A correction link gives temporary access to applicant data, while infrastructure logs and marketing scripts can capture query strings and API paths. The correction flow must also avoid turning private location evidence into email content.

**How to apply:** Keep correction field whitelists separate from the full application schema. Any new field must be explicitly classified as safe for the applicant page, email field-name list, and audit metadata before it is enabled.
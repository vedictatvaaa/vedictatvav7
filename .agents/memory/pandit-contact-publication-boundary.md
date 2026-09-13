---
name: Pandit contact/publication boundary
description: Safety rules connecting protected contact disclosure, booking resets, and reviewed storefront content
---

Protected Pandit contact access must use the same currently eligible, published-storefront boundary as public discovery. Knowing or guessing a hidden storefront slug must never disclose contact data.

**Why:** A contact endpoint that checks only identity and Pandit safety can bypass directory/search governance and expose an unpublished profile. Publication workflows can also make reviewed AI content stale when deterministic location facts change.

**How to apply:** Keep contact target resolution on the published-storefront predicate; record booking allowance resets inside the booking acceptance transaction; recompute the current public-facts snapshot before publishing reviewed storefront content.
---
name: Puja booking price authority
description: Rules for safely handing Puja catalogue entries into booking and computing standard Puja totals.
---

Puja catalogue names are discovery context, not authoritative purchasable offerings. Send them through eligible Pandit discovery before confirming a booking. Only a known standard Puja or a live Pandit service/package may enter the confirmation flow.

**Why:** Catalogue entries can lack a priced, mode-eligible Pandit offering. Treating an arbitrary name as bookable previously exposed a client fallback price and allowed submitted totals to be trusted.

**How to apply:** Recompute every standard, service, and package amount on the server from its authoritative source. Reject unknown Puja values; never add a client-only fallback price to make a catalogue handoff appear bookable.
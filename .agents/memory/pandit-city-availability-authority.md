---
name: Pandit city availability authority
description: Keeps public city browsing independent from optional SEO projection publication.
---

An active canonical city advertised by public discovery must resolve to a useful city results page even when that city is absent from the optional SEO-network projection. Positive supply comes from the authoritative directory query; zero-supply catalogue cities remain useful noindex pages. Only unknown or inactive catalogue locations should return unavailable/404.

**Why:** SEO editorial and projection completeness control indexability, not whether users can browse an active city. Coupling route availability to the SEO projection caused cities with eligible Pandits to be advertised and then return “Pandit page unavailable.”

**How to apply:** Resolve city identity against the active state/city catalogue as a fail-closed fallback, render results from the normal public directory eligibility query, and keep fallback pages `noindex, follow` until normal SEO publication criteria are met.
/**
 * Per-route Open Graph / Twitter Card meta injection for social-share crawlers
 * (WhatsApp, Facebook, LinkedIn, Slack, X, iMessage, Telegram).
 *
 * WHY THIS LIVES SERVER-SIDE: WhatsApp's link-preview crawler does NOT execute
 * JavaScript. The React-side <SeoHead /> useEffect that mutates document.head
 * is invisible to it — only the HTML returned at request time matters. So we
 * intercept the SPA fallback, swap og:/twitter:/title/description tags based
 * on the URL path, and serve that bespoke HTML to everyone (browsers
 * override via SeoHead at runtime anyway).
 *
 * IMAGE SPEC: 1200x630 JPEG, < 300 KB, served over HTTPS, publicly fetchable
 * with no auth wall. Image carries no critical text — WhatsApp renders the
 * og:title and og:description below the image crisply.
 */

export interface OgCard {
  title: string;
  description: string;
  /** Path under /og/ — appended to PUBLIC_SITE_URL to form an absolute https URL. */
  image: string;
  alt: string;
  /** Optional og:type override; defaults to "website". */
  type?: string;
}

const SITE_URL = (process.env.PUBLIC_SITE_URL || "https://vedictatva.com").replace(/\/$/, "");

/** Prefix marker — "prefix:/shop" matches /shop, /shop/abc, /shop/x/y, etc. */
const PREFIX = "prefix:";

/**
 * Route-pattern → OG card map. The first matching entry wins. Patterns are
 * matched against the URL pathname (no query/hash). Use exact strings,
 * `prefix:/foo` for "starts-with /foo", or RegExp for anything richer.
 *
 * Copy is calibrated for FOMO: scarcity ("limited daily slots"), social proof
 * ("50,000+ devotees"), authority ("verified Vedic Pandits"), and a Sanskrit
 * mantra anchor for emotional resonance. Each title stays ≤ 65 chars and each
 * description ≤ 155 chars (WhatsApp truncation limits).
 */
const ROUTE_CARDS: Array<{ match: string | RegExp; card: OgCard }> = [
  // ── Pandit registration ────────────────────────────────────────────
  {
    match: "/become-pandit",
    card: {
      title: "Earn ₹50,000+/mo as a Verified Pandit · Vedic Tatva",
      description:
        "Yat karoshi tat kuru — turn sadhana into livelihood. Join 1,200+ Pandits. Free profile, instant payouts. Limited verification slots.",
      image: "/og/og-pandit-registration.jpg",
      alt: "Become a verified Vedic Pandit on Vedic Tatva — free registration, instant payouts",
    },
  },

  // ── Puja essentials shopping ───────────────────────────────────────
  {
    match: `${PREFIX}/spiritual-essentials`,
    card: {
      title: "Authentic Puja Samagri the Pandit Uses · Vedic Tatva",
      description:
        "Yajno vai shreshthatamam karma — the worthiest act needs the worthiest samagri. Sourced from Kashi & Gaya. Free shipping over ₹499.",
      image: "/og/og-puja-essentials.jpg",
      alt: "Authentic puja samagri kit — diyas, chandan, kalash, rudraksha, mauli",
    },
  },
  {
    match: `${PREFIX}/shop`,
    card: {
      title: "Sacred Puja Store · 4,000+ Authentic Items · Vedic Tatva",
      description:
        "Shanti shanti shantih — bring the temple home. Samagri, rudraksha, idols, yantras. 50,000+ families trust us. Today's deals end at midnight.",
      image: "/og/og-puja-essentials.jpg",
      alt: "Vedic Tatva sacred store — premium puja items delivered nationwide",
    },
  },

  // ── Pandit booking ─────────────────────────────────────────────────
  {
    match: `${PREFIX}/pandits`,
    card: {
      title: "Book a Verified Vedic Pandit Near You · Vedic Tatva",
      description:
        "Sankalpa siddhirastu — every sankalp deserves a true Pandit. 1,200+ verified, by city & deity. Confirmed in 5 min. Festival weekends booking out.",
      image: "/og/og-pandit-booking.jpg",
      alt: "Book a verified Vedic Pandit — wedding, havan, satyanarayan, griha pravesh",
    },
  },
  {
    match: `${PREFIX}/puja`,
    card: {
      title: "Online Puja with Live Vedic Pandits · Vedic Tatva",
      description:
        "Yatra yogeshvarah krishnah — there, victory abides. Satyanarayan, Rudrabhishek, Lakshmi puja live on video. Prasad home-delivered. Slots filling.",
      image: "/og/og-pandit-booking.jpg",
      alt: "Online Puja booking with live Vedic Pandits — Satyanarayan, Rudrabhishek, Lakshmi",
    },
  },

  // ── Pind Daan (flagship sub-vertical, heavily promoted on the home page) ──
  // Matches /pind-daan, /pind-daan/anything, AND the hyphenated city
  // landing routes /pind-daan-gaya|kashi|haridwar.
  {
    match: /^\/pind-daan(-(gaya|kashi|haridwar))?(\/|$)/,
    card: {
      title: "Sacred Pind Daan in Gaya, Kashi & Haridwar · Vedic Tatva",
      description:
        "Pitru-rin se mukti — free your ancestors at Vishnupad, Manikarnika, Har Ki Pauri. Live video vidhi, prasad couriered. 12,000+ shraddhas completed.",
      image: "/og/og-pandit-booking.jpg",
      alt: "Pind Daan booking with verified Vedic Pandits — Gaya, Kashi, Haridwar",
    },
  },

  // ── Pandit storefront (Task #65) — every /p/<slug> URL ─────────────
  {
    match: /^\/p\/[a-z0-9-]+/,
    card: {
      title: "Connect with a Verified Vedic Pandit · Vedic Tatva",
      description:
        "Book pujas, shop curated samagri the Pandit recommends, and connect on WhatsApp. Verified by Vedic Tatva.",
      image: "/og/og-pandit-booking.jpg",
      alt: "Pandit storefront on Vedic Tatva — book puja, shop samagri, connect direct",
    },
  },

  // ── Prime / Membership / flagship ──────────────────────────────────
  {
    match: "/membership",
    card: {
      title: "Vedic Tatva Prime — Your Sacred Inner Circle",
      description:
        "Sarve bhavantu sukhinah — blessings, first to your door. Free samagri shipping, 20% off Pandits, priority festival slots. First 1,000 at launch price.",
      image: "/og/og-prime-services.jpg",
      alt: "Vedic Tatva Prime membership — priority Pandit slots and free samagri delivery",
    },
  },

  // ── Content / blog / kathas ────────────────────────────────────────
  {
    match: "/blog",
    card: {
      title: "Vedic Wisdom Blog — Pujas, Festivals & Jyotish · Vedic Tatva",
      description:
        "Yatha pinde tatha brahmande — what is in the body is in the cosmos. Festival vidhi, mantra meanings, kundli decoded. Written by Pandits & Acharyas.",
      image: "/og/og-prime-services.jpg",
      alt: "Vedic Tatva blog — puja vidhi, festival guides, jyotish wisdom from real Pandits",
    },
  },
  {
    match: `${PREFIX}/kathas`,
    card: {
      title: "Sacred Kathas with Audio Narration · Vedic Tatva",
      description:
        "Shravanam keertanam — listen and the soul awakens. Satyanarayan, Shiv, Hanuman, Ramayan kathas in Hindi & Sanskrit. Pandit-narrated, free to stream.",
      image: "/og/og-prime-services.jpg",
      alt: "Vedic Tatva sacred kathas — audio-narrated Satyanarayan, Shiv, Hanuman stories",
    },
  },

  // ── Astrology hub & AI tools ───────────────────────────────────────
  {
    match: "/astrology",
    card: {
      title: "Vedic Astrology, Kundli & Horoscope Online · Vedic Tatva",
      description:
        "Grahaa kalasya kaarana — planets shape your time. Talk to verified Jyotishis, get a free AI Kundli, daily horoscope. 4.8★ from 18,000+ consultations.",
      image: "/og/og-prime-services.jpg",
      alt: "Vedic astrology consultations on Vedic Tatva — Kundli, horoscope, verified Jyotishis",
    },
  },
  {
    match: "/ai-kundli",
    card: {
      title: "Free AI Kundli — Janam Patrika in 30 Seconds · Vedic Tatva",
      description:
        "Yatha akashe tatha dehe — your sky-pattern is yours alone. Birth-chart, dasha, doshas, remedies. Built on Vedic Parashari rules. 100% free, no signup.",
      image: "/og/og-prime-services.jpg",
      alt: "Free AI-generated Vedic Kundli on Vedic Tatva — instant, accurate, no signup",
    },
  },
  {
    match: "/ai-baby-names",
    card: {
      title: "AI Baby Names by Nakshatra & Rashi · Vedic Tatva",
      description:
        "Naam roopam asti — the name shapes the form. 200+ Sanskrit-rooted names matched to your child's nakshatra, with meaning, gotra fit & numerology.",
      image: "/og/og-prime-services.jpg",
      alt: "AI-generated Vedic baby names matched to nakshatra and rashi · Vedic Tatva",
    },
  },
  {
    match: "/ai-palm-reading",
    card: {
      title: "Free AI Palm Reading — Hast Rekha Online · Vedic Tatva",
      description:
        "Hasta-rekha bhavishya — your palm holds your sankalp. Upload a photo, get life-line, heart-line, fate-line read by AI trained on classical Samudrika.",
      image: "/og/og-prime-services.jpg",
      alt: "Free AI palm reading on Vedic Tatva — Vedic Hast Rekha analysis from a photo",
    },
  },

  // ── Tirth yatra & temple tourism ───────────────────────────────────
  {
    match: "/tirth-yatra",
    card: {
      title: "Curated Tirth Yatras — Char Dham, Jyotirling & More · Vedic Tatva",
      description:
        "Tirthani charanti yatra — pilgrim feet sanctify the road. Char Dham, 12 Jyotirlings, Sapta Puri tours with Pandits, prasad & vidhi. Confirmed dates 2026.",
      image: "/og/og-pandit-booking.jpg",
      alt: "Tirth yatra packages on Vedic Tatva — Char Dham, Jyotirling, Sapta Puri",
    },
  },
  {
    match: "/temple-tourism",
    card: {
      title: "Sacred Temple Tours Across India · Vedic Tatva",
      description:
        "Devalayam Brahmandam — every temple, a small cosmos. Curated darshan, priority pujas, Pandit-led history walks at 200+ temples. Festival dates filling.",
      image: "/og/og-pandit-booking.jpg",
      alt: "Temple tourism on Vedic Tatva — curated darshan and Pandit-led pilgrimage",
    },
  },

  // ── Donations / dakshina / dharma ──────────────────────────────────
  {
    match: "/donations",
    card: {
      title: "Donate to Temples, Gaushala & Pandits · Vedic Tatva",
      description:
        "Daanam param dharmam — giving is the highest dharma. Verified gaushalas, ancient temples, scholar-Pandits. 100% pass-through. Receipt under 80G.",
      image: "/og/og-prime-services.jpg",
      alt: "Donate to verified temples, gaushalas and scholar Pandits via Vedic Tatva",
    },
  },

  // ── Brand pages (about/contact/careers/franchise) ──────────────────
  {
    match: "/about",
    card: {
      title: "Our Sankalp — The Vedic Tatva Story",
      description:
        "Dharmo rakshati rakshitah — protect the dharma and it protects you. Built by sons of Pandits to bring authentic, transparent Vedic seva to every home.",
      image: "/og/og-prime-services.jpg",
      alt: "About Vedic Tatva — our sankalp to bring authentic Vedic seva to every home",
    },
  },
  {
    match: "/contact",
    card: {
      title: "Talk to a Real Acharya — Vedic Tatva Support",
      description:
        "Need a Pandit by tomorrow? A custom yatra? Have a doubt about a vidhi? Our Acharya-led support team replies in under 30 minutes, every day, in any language.",
      image: "/og/og-prime-services.jpg",
      alt: "Contact Vedic Tatva — Acharya-led support, replies under 30 minutes",
    },
  },
  {
    match: "/careers",
    card: {
      title: "Build the Future of Vedic Seva — Careers · Vedic Tatva",
      description:
        "Karmanyevadhikaraste — work with right intention, leave the rest. Engineers, designers, Acharyas, ops. Hybrid Bengaluru / Varanasi / remote. ESOPs.",
      image: "/og/og-prime-services.jpg",
      alt: "Careers at Vedic Tatva — engineers, designers, Acharyas, hybrid roles with ESOPs",
    },
  },
  {
    match: "/franchise",
    card: {
      title: "Open a Vedic Tatva Franchise in Your City",
      description:
        "Lakshmi-Ganesh in your city — own the local Vedic seva network. Low capex, training, Pandit network access, marketing kit. Limited cities for 2026.",
      image: "/og/og-prime-services.jpg",
      alt: "Open a Vedic Tatva franchise — local Vedic seva network with low capex",
    },
  },
  {
    match: "/become-astrologer",
    card: {
      title: "Earn ₹40,000+/mo as a Verified Jyotishi · Vedic Tatva",
      description:
        "Jnanam param balam — knowledge is the highest strength. Join our verified Jyotishi network. Free profile, instant payouts, daily incoming consultations.",
      image: "/og/og-pandit-registration.jpg",
      alt: "Become a verified Vedic Astrologer on Vedic Tatva — instant payouts, daily clients",
    },
  },

  // ── Tools & calendars ──────────────────────────────────────────────
  {
    match: "/panchang-calendar",
    card: {
      title: "Free Vedic Panchang & Tithi Calendar 2026 · Vedic Tatva",
      description:
        "Tithi-vara-nakshatra-yoga-karana — the five limbs of time. Daily Panchang for any city in India, with shubh muhurat, festivals, and rahu-kaal alerts.",
      image: "/og/og-prime-services.jpg",
      alt: "Free Vedic Panchang and Tithi calendar for 2026 on Vedic Tatva",
    },
  },
];

/**
 * Flagship card — used for the homepage `/` and every unmatched HTML route.
 * This is what renders when someone shares the bare domain on WhatsApp
 * (vedictatva.com / www.vedictatva.com), so the copy mirrors the
 * og-prime-services.jpg composite (Pandit + samagri + jyotish chart + Om):
 * "every sacred need, one trusted app", with a scarcity hook to drive clicks.
 */
export const FLAGSHIP_CARD: OgCard = {
  title: "Puja Samagri, Online Puja Booking & Panditji Services",
  description:
    "Buy authentic puja samagri online, book experienced panditji for Hindu rituals, online puja services, astrology consultation, and festival puja booking across India.",
  image: "/og/og-prime-services.jpg",
  alt: "Vedic Tatva — puja samagri online, online puja booking, verified panditji and Vedic astrology",
};

/**
 * Returns the curated OG card for an explicit route match, or null if the
 * path has no entry in ROUTE_CARDS. The homepage `/` returns FLAGSHIP_CARD
 * (treated as an explicit match — we want the flagship card on shares of
 * vedictatva.com / www.vedictatva.com). Used by seo-ssr to know whether to
 * override the seo_pages DB lookup with our bespoke share card.
 */
export function resolveExplicitOgCard(pathname: string): OgCard | null {
  const clean = pathname.split("?")[0].split("#")[0].replace(/\/+$/, "") || "/";
  if (clean === "/") return FLAGSHIP_CARD;
  for (const { match, card } of ROUTE_CARDS) {
    if (typeof match === "string") {
      if (match.startsWith(PREFIX)) {
        const base = match.slice(PREFIX.length);
        if (clean === base || clean.startsWith(base + "/")) return card;
      } else if (clean === match) {
        return card;
      }
    } else if (match.test(clean)) {
      return card;
    }
  }
  return null;
}

export function resolveOgCard(pathname: string): OgCard {
  return resolveExplicitOgCard(pathname) ?? FLAGSHIP_CARD;
}

/* ─────────────────────────────────────────────────────────────────────
 * Legacy helpers (injectOgMeta + shouldInjectOg) used to live here.
 * They were a second injection layer that competed with seo-ssr.ts.
 * The unified pipeline is now: server/static.ts sends index.html as a
 * STRING → seoHeadMiddleware's res.send wrapper calls resolveHead →
 * resolveHead calls resolveExplicitOgCard (above) for the per-route
 * card. One injection point, one source of truth.
 *
 * The block below is kept temporarily as dead code so a hot rollback
 * has something to import; it can be deleted in the next cleanup pass.
 * ─────────────────────────────────────────────────────────────────────
 */

/** Escape HTML attribute value. */
function attr(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * @deprecated Unused since the seo-ssr pipeline became the sole injection
 * point. Kept for one release as a safety net for hot rollback. Do not
 * call from new code — wire your tags into resolveHead in seo-ssr.ts
 * (which uses resolveExplicitOgCard) instead.
 */
export function injectOgMeta(html: string, pathname: string): string {
  const card = resolveOgCard(pathname);
  const fullUrl = `${SITE_URL}${pathname === "/" ? "" : pathname}`;
  const fullImage = card.image.startsWith("http") ? card.image : `${SITE_URL}${card.image}`;

  const replacements: Array<[RegExp, string]> = [
    // <title>…</title>
    [/<title>[\s\S]*?<\/title>/i, `<title>${attr(card.title)}</title>`],
    // <meta name="description" …>
    [
      /<meta\s+name=["']description["'][^>]*>/i,
      `<meta name="description" content="${attr(card.description)}" />`,
    ],
    // og:title / og:description / og:url / og:image / og:image:secure_url / og:image:alt
    [
      /<meta\s+property=["']og:title["'][^>]*>/i,
      `<meta property="og:title" content="${attr(card.title)}" />`,
    ],
    [
      /<meta\s+property=["']og:description["'][^>]*>/i,
      `<meta property="og:description" content="${attr(card.description)}" />`,
    ],
    [
      /<meta\s+property=["']og:url["'][^>]*>/i,
      `<meta property="og:url" content="${attr(fullUrl)}" />`,
    ],
    [
      /<meta\s+property=["']og:image["'](?!:)[^>]*>/i,
      `<meta property="og:image" content="${attr(fullImage)}" />`,
    ],
    [
      /<meta\s+property=["']og:image:secure_url["'][^>]*>/i,
      `<meta property="og:image:secure_url" content="${attr(fullImage)}" />`,
    ],
    [
      /<meta\s+property=["']og:image:type["'][^>]*>/i,
      `<meta property="og:image:type" content="${fullImage.endsWith(".png") ? "image/png" : "image/jpeg"}" />`,
    ],
    [
      /<meta\s+property=["']og:image:alt["'][^>]*>/i,
      `<meta property="og:image:alt" content="${attr(card.alt)}" />`,
    ],
    [
      /<meta\s+property=["']og:type["'][^>]*>/i,
      `<meta property="og:type" content="${card.type || "website"}" />`,
    ],
    // canonical
    [
      /<link\s+rel=["']canonical["'][^>]*>/i,
      `<link rel="canonical" href="${attr(fullUrl)}" />`,
    ],
    // twitter:title / twitter:description / twitter:image / twitter:image:alt
    [
      /<meta\s+name=["']twitter:title["'][^>]*>/i,
      `<meta name="twitter:title" content="${attr(card.title)}" />`,
    ],
    [
      /<meta\s+name=["']twitter:description["'][^>]*>/i,
      `<meta name="twitter:description" content="${attr(card.description)}" />`,
    ],
    [
      /<meta\s+name=["']twitter:image["'][^>]*>/i,
      `<meta name="twitter:image" content="${attr(fullImage)}" />`,
    ],
    [
      /<meta\s+name=["']twitter:image:alt["'][^>]*>/i,
      `<meta name="twitter:image:alt" content="${attr(card.alt)}" />`,
    ],
  ];

  let out = html;
  for (const [re, rep] of replacements) {
    out = out.replace(re, rep);
  }
  return out;
}

/** True if the request is a navigation / crawler that should get rewritten HTML. */
/**
 * @deprecated Unused since the seo-ssr pipeline became the sole injection
 * point. Kept for one release as a safety net for hot rollback.
 */
export function shouldInjectOg(pathname: string, accept: string | undefined): boolean {
  if (!pathname.startsWith("/")) return false;
  // Skip API, static asset directories, and any path that has a file extension.
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/uploads/") ||
    pathname.startsWith("/attached_assets/") ||
    pathname.startsWith("/assets/") ||
    pathname.startsWith("/og/") ||
    pathname === "/sw.js" ||
    pathname === "/manifest.webmanifest" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml"
  ) {
    return false;
  }
  if (/\.[a-z0-9]{2,5}$/i.test(pathname)) return false;
  // Only intercept HTML navigations / crawlers.
  return !!accept && accept.includes("text/html");
}

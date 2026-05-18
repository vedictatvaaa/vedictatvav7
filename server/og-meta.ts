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
    match: /^\/(online-pandit-booking|pandits)(\/|$|\?)/,
    card: {
      title: "Book a Verified Vedic Pandit Near You · Vedic Tatva",
      description:
        "Sankalpa siddhirastu — every sankalp deserves a true Pandit. 1,200+ verified, by city & deity. Confirmed in 5 min. Festival weekends booking out.",
      image: "/og/og-pandit-booking.jpg",
      alt: "Book a verified Vedic Pandit — wedding, havan, satyanarayan, griha pravesh",
    },
  },
  {
    match: /^\/(online-puja-booking|puja)(\/|$|\?)/,
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
    match: /^\/(online-pind-daan|pind-daan(-(gaya|kashi|haridwar))?)(\/|$)/,
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
  {
    match: /^\/sacred-library(\/|$|\?)/,
    card: {
      title: "Sacred Library — Chalisas, Mantras, Aartis, Stotras · Vedic Tatva",
      description:
        "Vagartha viva sampriktau — words and meaning, inseparable. Read every Chalisa, Mantra, Aarti, Katha and Stotra with Devanagari, transliteration, English meaning and Pandit-narrated audio.",
      image: "/og/og-prime-services.jpg",
      alt: "Vedic Tatva Sacred Library — chalisas, mantras, aartis, stotras with audio",
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
    match: /^\/(today-panchang|panchang-calendar)(\/|$|\?)/,
    card: {
      title: "Free Vedic Panchang & Tithi Calendar 2026 · Vedic Tatva",
      description:
        "Tithi-vara-nakshatra-yoga-karana — the five limbs of time. Daily Panchang for any city in India, with shubh muhurat, festivals, and rahu-kaal alerts.",
      image: "/og/og-prime-services.jpg",
      alt: "Free Vedic Panchang and Tithi calendar for 2026 on Vedic Tatva",
    },
  },
  // ── Rashifal / Horoscope hub + 9 zodiac SEO landings ──────────────
  {
    match: /^\/(daily-rashifal|zodiac-rashifal)(\/|$|\?)/,
    card: {
      title: "Aaj Ka Rashifal & Zodiac Predictions · Vedic Tatva",
      description:
        "Free aaj ka rashifal for all 12 zodiac signs in Hindi & English. Vedic Jyotish + Western daily, weekly, monthly horoscope with lucky number, colour and remedies.",
      image: "/og/og-prime-services.jpg",
      alt: "Vedic Tatva rashifal hub — daily, weekly, monthly horoscope for all 12 zodiac signs",
    },
  },
  {
    match: "/daily-rashifal",
    card: {
      title: "Aaj Ka Rashifal — Free Daily Horoscope · Vedic Tatva",
      description:
        "Read accurate aaj ka rashifal for all 12 zodiac signs. Daily Vedic + Western horoscope with lucky number, colour and direction. Refreshed every morning.",
      image: "/og/og-prime-services.jpg",
      alt: "Free daily rashifal for all 12 zodiac signs · Vedic Tatva",
    },
  },
  {
    match: "/weekly-rashifal",
    card: {
      title: "Saptahik Rashifal — Free Weekly Horoscope · Vedic Tatva",
      description:
        "Weekly rashifal in Hindi & English for all 12 zodiac signs. Plan your week with day-wise love, career, money and health predictions from Vedic astrology.",
      image: "/og/og-prime-services.jpg",
      alt: "Free saptahik weekly horoscope for all 12 zodiac signs · Vedic Tatva",
    },
  },
  {
    match: "/monthly-horoscope",
    card: {
      title: "Maasik Rashifal — Free Monthly Horoscope · Vedic Tatva",
      description:
        "Monthly rashifal for all 12 zodiac signs — sankranti transits, festival muhurats and the best windows for love, career and money this month.",
      image: "/og/og-prime-services.jpg",
      alt: "Free maasik monthly horoscope for all 12 zodiac signs · Vedic Tatva",
    },
  },
  {
    match: "/yearly-horoscope-2026",
    card: {
      title: "Varshik Rashifal 2026 — Yearly Horoscope · Vedic Tatva",
      description:
        "Yearly horoscope 2026 for all 12 rashis — Saturn transit, Jupiter blessings, Rahu-Ketu shift and Sade Sati update. Plan your year with Vedic astrology.",
      image: "/og/og-prime-services.jpg",
      alt: "Free varshik rashifal 2026 yearly horoscope for all 12 zodiac signs · Vedic Tatva",
    },
  },
  {
    match: "/zodiac-compatibility",
    card: {
      title: "Zodiac Compatibility — Rashi Love & Marriage Match · Vedic Tatva",
      description:
        "Find your most compatible rashi for love, marriage and friendship. Free Vedic Ashtakoot Guna Milan + Western sun-sign compatibility for all 12 signs.",
      image: "/og/og-prime-services.jpg",
      alt: "Free zodiac compatibility and rashi love-match guide · Vedic Tatva",
    },
  },
  {
    match: "/lucky-number-today",
    card: {
      title: "Lucky Number Today — Daily Lucky Pack · Vedic Tatva",
      description:
        "Free daily lucky number, lucky colour, lucky direction and lucky gemstone for all 12 zodiac signs. Aligned with the day's planetary lord and your moolank.",
      image: "/og/og-prime-services.jpg",
      alt: "Free lucky number, colour and direction today for all zodiac signs · Vedic Tatva",
    },
  },
  {
    match: "/numerology-predictions",
    card: {
      title: "Numerology Predictions — Free Moolank & Bhagyank · Vedic Tatva",
      description:
        "Free numerology reading — discover your moolank, bhagyank and name number. Lucky days, careers, partners and decisions from Vedic Ank Jyotish.",
      image: "/og/og-prime-services.jpg",
      alt: "Free numerology predictions, moolank, bhagyank and name number · Vedic Tatva",
    },
  },
  {
    match: "/kundli-matching",
    card: {
      title: "Free Online Kundli Matching — Ashtakoot Guna Milan · Vedic Tatva",
      description:
        "Free 36-point Ashtakoot Guna Milan in 60 seconds. Mangal, Nadi and Bhakoot dosha check for marriage compatibility. Trusted Vedic kundli matching.",
      image: "/og/og-prime-services.jpg",
      alt: "Free online kundli matching with 36-point Ashtakoot Guna Milan · Vedic Tatva",
    },
  },
  {
    match: "/nakshatra-predictions",
    card: {
      title: "Nakshatra Predictions — Janma Nakshatra Reading · Vedic Tatva",
      description:
        "Find your janma nakshatra and read its full lifetime forecast — ruling deity, lucky pada, compatible nakshatras and remedies. Free guide to all 27 nakshatras.",
      image: "/og/og-prime-services.jpg",
      alt: "Free nakshatra predictions and janma nakshatra reading for all 27 nakshatras · Vedic Tatva",
    },
  },

  // ── Online Puja Store hub + 11 category SEO landings ──
  {
    match: "/online-puja-store",
    card: {
      title: "Buy Puja Samagri Online · Hindu Puja Essentials Store · Vedic Tatva",
      description:
        "Authentic puja samagri online — diyas, incense, havan samagri, idols, rudraksha, puja kits and spiritual products for every Hindu ritual and festival.",
      image: "/og/og-puja-essentials.jpg",
      alt: "Vedic Tatva online puja store — authentic Hindu puja essentials",
    },
  },
  {
    match: "/rudraksha-collection",
    card: {
      title: "Original Rudraksha Online — 1 to 21 Mukhi, Lab-Certified · Vedic Tatva",
      description:
        "Hand-picked Nepali and Indonesian rudraksha beads, lab-certified and energised by our pandits. 1 mukhi to 21 mukhi plus rare beads — the wearable Shiva tattva.",
      image: "/og/og-puja-essentials.jpg",
      alt: "Original lab-certified rudraksha beads and malas · Vedic Tatva",
    },
  },
  {
    match: "/brass-diyas",
    card: {
      title: "Brass Diyas Online — Akhand Jyot, Panchmukhi & Decorative · Vedic Tatva",
      description:
        "Hand-crafted brass diyas — akhand jyot, panchmukhi, hanging samai and aarti diyas. Pure pital, sourced from Moradabad and Madurai artisans.",
      image: "/og/og-puja-essentials.jpg",
      alt: "Hand-crafted brass diyas and oil lamps for Hindu puja · Vedic Tatva",
    },
  },
  {
    match: "/sambrani-cups",
    card: {
      title: "Sambrani Cups · Natural Loban Dhoop for Puja & Vastu · Vedic Tatva",
      description:
        "Pandit-recommended sambrani cups in pure benzoin, guggulu and dasangam herbs. Smokeless, no chemicals — for sandhya puja, vastu shuddhi and aura cleansing.",
      image: "/og/og-puja-essentials.jpg",
      alt: "Natural sambrani loban dhoop cups for daily puja · Vedic Tatva",
    },
  },
  {
    match: "/havan-cups",
    card: {
      title: "Havan Cups — Complete Yajna at Home in 15 Minutes · Vedic Tatva",
      description:
        "Pre-filled havan cups with 16-herb samagri, pure cow ghee and havan wood. Smokeless, apartment-safe — light one cup and perform a full shastric havan.",
      image: "/og/og-puja-essentials.jpg",
      alt: "Pre-filled havan cups for home yajna · Vedic Tatva",
    },
  },
  {
    match: "/incense-dhoop",
    card: {
      title: "Premium Incense & Dhoop · Hand-Rolled in Mysore · Vedic Tatva",
      description:
        "Hand-rolled masala agarbatti, sandalwood dhoop sticks and cone dhoop with pure essential oils. The classic Mysore temple fragrance — no synthetic perfume.",
      image: "/og/og-puja-essentials.jpg",
      alt: "Premium hand-rolled incense and dhoop sticks · Vedic Tatva",
    },
  },
  {
    match: "/crystal-healing",
    card: {
      title: "Crystal Healing — Sphatik, Pyramids & Chakra Stones · Vedic Tatva",
      description:
        "Lab-certified, energised healing crystals — sphatik shree yantra, rose quartz, amethyst, citrine, black tourmaline and chakra balancing kits with placement guide.",
      image: "/og/og-puja-essentials.jpg",
      alt: "Lab-certified healing crystals and sphatik yantras · Vedic Tatva",
    },
  },
  {
    match: "/puja-kits",
    card: {
      title: "Complete Puja Kits — Satyanarayan, Griha Pravesh, Diwali · Vedic Tatva",
      description:
        "Pandit-curated complete puja kits — every samagri inside, with a printed vidhi guide. One box, one puja, zero last-minute panic.",
      image: "/og/og-puja-essentials.jpg",
      alt: "Pandit-curated complete puja kits with vidhi guide · Vedic Tatva",
    },
  },
  {
    match: "/festival-collections",
    card: {
      title: "Festival Collections — Diwali, Navratri, Janmashtami Kits · Vedic Tatva",
      description:
        "Every Hindu festival kit and decor, released 4–6 weeks ahead. Diwali, Navratri, Janmashtami, Ganesh Chaturthi, Holi, Karva Chauth, Mahashivratri.",
      image: "/og/og-puja-essentials.jpg",
      alt: "Hindu festival puja kits and decor — Diwali, Navratri & more · Vedic Tatva",
    },
  },
  {
    match: "/vastu-products",
    card: {
      title: "Vastu Products & Cures — Yantras, Pyramids, Tortoise · Vedic Tatva",
      description:
        "Direction-specific vastu cures — sphatik shree yantra, crystal pyramid, brass kachhua and shanti yantras with placement and activation guide from our acharyas.",
      image: "/og/og-puja-essentials.jpg",
      alt: "Vastu yantras and direction-specific cures · Vedic Tatva",
    },
  },
  {
    match: "/spiritual-jewelry",
    card: {
      title: "Spiritual Jewelry — Rudraksha, Sphatik & Navratna · Vedic Tatva",
      description:
        "Energised spiritual jewelry — silver-capped rudraksha pendants, sphatik and tulsi malas, navratna rings and chakra bracelets. Hallmarked silver, lab-certified stones.",
      image: "/og/og-puja-essentials.jpg",
      alt: "Energised Vedic spiritual jewelry — rudraksha, sphatik, navratna · Vedic Tatva",
    },
  },
  {
    match: "/temple-decor",
    card: {
      title: "Temple Decor for Home Mandir — Brass Bells, Singhasan, Toran · Vedic Tatva",
      description:
        "Temple-grade brass bells, hand-carved deity thrones (singhasan), prabhavali backdrops, toran, kalash and aarti accessories — sourced from temple-supply artisans.",
      image: "/og/og-puja-essentials.jpg",
      alt: "Home mandir temple decor and accessories · Vedic Tatva",
    },
  },

  // ── Japa Counter (free PWA tool, ranks for "online jap counter" cluster) ──
  // Matches /japa, /jap, /japa-counter — exact only. Per-mantra
  // landings /japa/<slug> are handled by buildMantraOgCard() below so
  // each share preview shows the specific mantra's name + deity.
  {
    match: /^\/(digital-japa-counter|japa|jap|japa-counter)\/?$/,
    card: {
      title: "Free 108 Mala Counter — Online Mantra Japa Counter · Vedic Tatva",
      description:
        "Sahasra-namami — chant in rhythm. Free 108-bead jap counter with bell, vibration, daily streak & 30+ Vedic mantras. Mahamrityunjaya, Gayatri, Om Namah Shivaya. Saved on your device.",
      image: "/og/og-japa.jpg",
      alt: "Free online japa mala counter with bell, vibration and 30+ Vedic mantras — Vedic Tatva",
    },
  },
];

// ── Per-mantra share cards for /japa/<slug> ──────────────────────────
// Built dynamically from the canonical MANTRA_LIBRARY so any mantra
// added there automatically gets a bespoke OG title/description on
// social shares. Image stays the flagship /og/og-japa.jpg until we
// commission per-mantra art.
import { MANTRA_LIBRARY } from "../shared/mantra-library";
import { PANDIT_CITY_BY_SLUG, slugifyPuja } from "./pandit-cities-map";

// ── Per-city + per-(city, puja) pandit share cards ────────────────
// Returns a bespoke OG card for /pandits/:citySlug and
// /pandits/:citySlug/:pujaSlug. Returns null otherwise so the
// flagship pandit RegExp in ROUTE_CARDS still wins for /pandits.
export function buildPanditCityOgCard(pathname: string): OgCard | null {
  const m = pathname.match(/^\/pandits\/([a-z0-9-]+)(?:\/([a-z0-9-]+))?\/?$/);
  if (!m) return null;
  const city = PANDIT_CITY_BY_SLUG[m[1]];
  if (!city) return null;
  const pujaSlug = m[2];

  if (pujaSlug) {
    const pujaName = city.popularPujaNames.find((n) => slugifyPuja(n) === pujaSlug);
    if (!pujaName) return null;
    const title = `${pujaName} Pandit in ${city.name} · Vedic Tatva`.slice(0, 80);
    const description = `Book a verified, scripture-trained Vedic Pandit for ${pujaName} in ${city.name}. Transparent pricing, samagri kit option, free reschedule. ${city.live ? "Same-day slots available." : "Live online puja while we expand to your city."}`.slice(0, 200);
    return {
      title,
      description,
      image: "/og/og-pandit-booking.jpg",
      alt: `${pujaName} pandit booking in ${city.name} — Vedic Tatva`,
    };
  }

  const title = `Book a Verified Vedic Pandit in ${city.name} · Vedic Tatva`.slice(0, 80);
  const description = `Identity-verified, scripture-trained pandits in ${city.name}, ${city.state} for Satyanarayan, Griha Pravesh, Vivah, Rudrabhishek and more. Transparent pricing, samagri included, free reschedule.`.slice(0, 200);
  return {
    title,
    description,
    image: "/og/og-pandit-booking.jpg",
    alt: `Verified Vedic Pandits in ${city.name} — book on Vedic Tatva`,
  };
}

const MANTRA_SLUGS = new Set(MANTRA_LIBRARY.map((m) => m.id));

export function buildMantraOgCard(slug: string): OgCard | null {
  const m = MANTRA_LIBRARY.find((x) => x.id === slug);
  if (!m) return null;
  // Title: ≤ 65 chars, deity-anchored. Description: ≤ 155 chars,
  // includes recommended count + WhatsApp-friendly Sanskrit cue.
  const title = `${m.label} — Online Japa Counter · Vedic Tatva`.slice(0, 80);
  const description = `Chant ${m.label} (${m.deity}) on a free ${m.recommendedCount}-bead mala counter. Bell, vibration, daily streak. ${m.meaning.slice(0, 60)}…`.slice(0, 200);
  return {
    title,
    description,
    image: "/og/og-japa.jpg",
    alt: `${m.label} japa mala counter — ${m.deity} · Vedic Tatva`,
  };
}

/** Lowercase, trimmed slug if path matches /japa/<slug>. */
export function matchMantraSlug(pathname: string): string | null {
  const m = pathname.match(/^\/japa\/([a-z0-9-]+)\/?$/);
  if (!m) return null;
  const slug = m[1];
  return MANTRA_SLUGS.has(slug) ? slug : null;
}

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
  // Per-mantra landings — checked before the static map so a request
  // for /japa/mahamrityunjaya doesn't fall through to the generic card.
  const mantraSlug = matchMantraSlug(clean);
  if (mantraSlug) {
    const c = buildMantraOgCard(mantraSlug);
    if (c) return c;
  }
  // Per-city pandit landings (and per-(city, puja) long-tail pages).
  // Checked before the generic /pandits RegExp so each city/puja
  // gets its own bespoke share preview.
  const cityCard = buildPanditCityOgCard(clean);
  if (cityCard) return cityCard;
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

/* ─────────────────────────────────────────────────────────────────────
 * Legacy helpers (resolveOgCard, injectOgMeta, shouldInjectOg) used to
 * live here as a second injection layer that competed with seo-ssr.ts.
 * Removed in May 2026 cleanup — the seo-ssr pipeline is now the sole
 * injection point (server/static.ts sends index.html as a STRING →
 * seoHeadMiddleware's res.send wrapper calls resolveHead →
 * resolveHead calls resolveExplicitOgCard above for the per-route card).
 * ─────────────────────────────────────────────────────────────────────
 */

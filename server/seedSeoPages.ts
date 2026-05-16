import { db } from "./db";
import { seoPages } from "@shared/schema";
import { sql } from "drizzle-orm";

const SITE = "https://vedictatva.com";
const BRAND = "Vedic Tatva";
const DEFAULT_OG = `${SITE}/whatsapp-preview.png`;

type SeoEntry = {
  pagePath: string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  priority?: number;
  changeFreq?: string;
  h1Override?: string;
  breadcrumbLabel?: string;
  schemaMarkup?: object;
  robotsIndex?: boolean;
  robotsFollow?: boolean;
};

const orgSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: BRAND,
  url: SITE,
  logo: `${SITE}/logo.png`,
  sameAs: [
    "https://www.facebook.com/vedictatva",
    "https://www.instagram.com/vedictatva",
    "https://twitter.com/vedictatva",
    "https://www.youtube.com/@vedictatva",
  ],
  contactPoint: {
    "@type": "ContactPoint",
    telephone: "+91-9999999999",
    contactType: "customer service",
    areaServed: "IN",
    availableLanguage: ["en", "hi"],
  },
};

const breadcrumb = (items: { name: string; path: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((it, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: it.name,
    item: `${SITE}${it.path}`,
  })),
});

const faqSchema = (faqs: { q: string; a: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
});

const serviceSchema = (name: string, description: string, url: string, type = "Service") => ({
  "@context": "https://schema.org",
  "@type": type,
  name,
  description,
  url,
  provider: { "@type": "Organization", name: BRAND, url: SITE },
  areaServed: { "@type": "Country", name: "India" },
});

const ENTRIES: SeoEntry[] = [
  // ==================== HOME ====================
  {
    pagePath: "/",
    metaTitle: "Vedic Tatva - Book Pandit, Free Kundli, Puja Samagri & Astrology Online",
    metaDescription:
      "India's trusted vedic platform. Book verified pandits, generate free AI kundli, shop authentic puja samagri & rudraksha, get daily panchang, rashifal & muhurat. 100% authentic.",
    metaKeywords:
      "book pandit online, free kundli online, puja samagri online, rudraksha online, daily panchang, aaj ka rashifal, online puja booking, vedic astrology, hindu puja services, spiritual store india",
    ogTitle: "Vedic Tatva - Heritage of Nature Wellness & Purity",
    ogDescription:
      "Book verified pandits, free AI kundli, authentic puja samagri, daily panchang & rashifal — all in one trusted vedic platform.",
    priority: 1.0,
    changeFreq: "daily",
    h1Override: "Heritage of Nature Wellness & Purity",
    breadcrumbLabel: "Home",
    schemaMarkup: {
      "@context": "https://schema.org",
      "@graph": [
        orgSchema,
        {
          "@type": "WebSite",
          name: BRAND,
          url: SITE,
          potentialAction: {
            "@type": "SearchAction",
            target: `${SITE}/shop?q={search_term_string}`,
            "query-input": "required name=search_term_string",
          },
        },
      ],
    },
  },

  // ==================== SHOP ====================
  {
    pagePath: "/shop",
    metaTitle: "Buy Puja Samagri, Rudraksha & Spiritual Products Online | Vedic Tatva",
    metaDescription:
      "Shop authentic puja samagri, rudraksha mala, brass idols, gemstones, incense & havan kits online. Free shipping above ₹499. Lab-certified, temple-blessed products.",
    metaKeywords:
      "puja samagri online, buy rudraksha online, brass idols online, hindu puja items, incense sticks online, havan samagri, gemstones online india, spiritual products store, pooja items shop, panchpatra kalash",
    priority: 0.95,
    changeFreq: "daily",
    h1Override: "Shop Authentic Spiritual Products",
    breadcrumbLabel: "Shop",
    schemaMarkup: {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Spiritual Products Shop",
      url: `${SITE}/shop`,
      breadcrumb: breadcrumb([
        { name: "Home", path: "/" },
        { name: "Shop", path: "/shop" },
      ]),
    },
  },

  // ==================== PUJA & RITUALS ====================
  {
    pagePath: "/pandits",
    metaTitle: "Book Verified Pandit Online for Puja at Home | Same-Day | Vedic Tatva",
    metaDescription:
      "Book a verified, experienced pandit for Satyanarayan Puja, Griha Pravesh, Wedding, Mundan & all ceremonies. Same-day booking, transparent pricing, 4.8★ rated pandits.",
    metaKeywords:
      "book pandit online, pandit for puja at home, online pandit booking, satyanarayan puja pandit, griha pravesh pandit, wedding pandit booking, brahmin pandit near me, pandit ji booking, hindu priest online, verified pandits india",
    ogTitle: "Book a Verified Pandit Online — Same-Day Available",
    ogDescription:
      "Experienced pandits for every ceremony. Transparent pricing, verified profiles, 4.8★ rated.",
    priority: 0.9,
    changeFreq: "weekly",
    h1Override: "Book a Verified Pandit for Your Sacred Ceremony",
    breadcrumbLabel: "Book Pandit",
    schemaMarkup: {
      "@context": "https://schema.org",
      "@graph": [
        serviceSchema(
          "Online Pandit Booking",
          "Book verified, experienced Hindu pandits online for puja ceremonies at home across India.",
          `${SITE}/pandits`
        ),
        breadcrumb([
          { name: "Home", path: "/" },
          { name: "Book Pandit", path: "/pandits" },
        ]),
        faqSchema([
          {
            q: "How do I book a pandit online?",
            a: "Browse verified pandits by city and ceremony, pick your preferred date and muhurat, complete booking with secure payment. Confirmation arrives within minutes.",
          },
          {
            q: "Are the pandits verified?",
            a: "Every pandit on Vedic Tatva is identity-verified, scripture-trained, and rated by past clients. We display their experience, languages, and ceremony specializations.",
          },
          {
            q: "Can I book a pandit for same-day puja?",
            a: "Yes. Many pandits accept same-day bookings subject to availability. Use the 'Available Today' filter to see them instantly.",
          },
          {
            q: "What ceremonies do your pandits perform?",
            a: "Satyanarayan Puja, Griha Pravesh, Wedding, Mundan, Namkaran, Rudrabhishek, Navagraha Shanti, Shradh, Vastu Shanti, and 50+ other ceremonies.",
          },
        ]),
      ],
    },
  },
  {
    pagePath: "/online-puja-booking",
    metaTitle: "Book Online Puja - Satyanarayan, Griha Pravesh, Rudrabhishek | Vedic Tatva",
    metaDescription:
      "Book sacred puja ceremonies online with verified pandits. Satyanarayan, Griha Pravesh, Rudrabhishek, Navagraha Shanti & more. Includes samagri, transparent pricing.",
    metaKeywords:
      "online puja booking, satyanarayan puja booking, griha pravesh puja, rudrabhishek puja online, navagraha shanti, hindu puja services, puja at home, book puja online india, puja vidhi, online pooja booking",
    priority: 0.9,
    changeFreq: "weekly",
    h1Override: "Book Sacred Puja Ceremonies Online",
    breadcrumbLabel: "Book Puja",
    schemaMarkup: {
      "@context": "https://schema.org",
      "@graph": [
        serviceSchema(
          "Online Puja Booking",
          "Book authentic Hindu puja ceremonies with verified pandits. Includes complete samagri kit and post-puja guidance.",
          `${SITE}/puja`
        ),
        breadcrumb([
          { name: "Home", path: "/" },
          { name: "Book Puja", path: "/online-puja-booking" },
        ]),
        faqSchema([
          {
            q: "What is included in an online puja booking?",
            a: "Verified pandit, complete puja samagri delivered to your doorstep, customised sankalpa, and post-puja prasad guidance.",
          },
          {
            q: "Which puja should I book for a new home?",
            a: "Griha Pravesh Puja is performed before entering a new home. It includes Vastu Shanti, Ganesh Puja, and Navagraha Shanti for prosperity and protection.",
          },
          {
            q: "Do you provide puja samagri?",
            a: "Yes. Every booking includes a complete pre-checked samagri kit so you do not have to source individual items.",
          },
        ]),
      ],
    },
  },
  {
    pagePath: "/virtual-puja",
    metaTitle: "Virtual Puja Online - Live Streamed Ceremony from Holy Temples | Vedic Tatva",
    metaDescription:
      "Join live virtual puja ceremonies streamed from holy temples & ghats. Sankalpa with your name, gotra & wishes. Get prasad delivered home. 100% authentic.",
    metaKeywords:
      "virtual puja online, live online puja, online puja from temple, e-puja, online aarti, sankalpa puja online, virtual rudrabhishek, online ganga aarti, temple puja live, video puja booking",
    priority: 0.85,
    changeFreq: "weekly",
    h1Override: "Live Virtual Puja from Sacred Temples",
    breadcrumbLabel: "Virtual Puja",
    schemaMarkup: serviceSchema(
      "Virtual Online Puja",
      "Live-streamed Hindu puja ceremonies from holy temples and ghats with your sankalpa and prasad delivery.",
      `${SITE}/virtual-puja`
    ),
  },
  {
    pagePath: "/spiritual-essentials",
    metaTitle: "Puja Essentials - Samagri, Diya, Kalash, Incense & Havan Kit | Vedic Tatva",
    metaDescription:
      "Curated puja essentials: complete puja samagri kits, brass diyas, kalash, panchpatra, dhoop, agarbatti, havan kunds & more. Temple-grade quality, free shipping.",
    metaKeywords:
      "puja essentials online, puja samagri kit, brass diya online, kalash online, panchpatra, havan kund, dhoop sticks, agarbatti online, pooja thali, puja items combo, spiritual essentials store",
    priority: 0.85,
    changeFreq: "weekly",
    h1Override: "Curated Puja Essentials & Samagri",
    breadcrumbLabel: "Puja Essentials",
    schemaMarkup: {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Puja Essentials & Samagri",
      url: `${SITE}/spiritual-essentials`,
    },
  },
  {
    pagePath: "/kathas",
    metaTitle: "Sacred Kathas - Ram Katha, Shiv Katha, Krishna Leela in Hindi | Vedic Tatva",
    metaDescription:
      "Read & listen to sacred Hindu kathas — Ram Katha, Shiv Katha, Krishna Leela, Hanuman Chalisa, Durga Saptashati & more. AI-narrated in Hindi & English.",
    metaKeywords:
      "ram katha, shiv katha, krishna leela, hanuman chalisa, durga saptashati, hindu kathas online, ramayan story, mahabharat katha, satyanarayan katha, devi katha, mythology stories hindi",
    priority: 0.8,
    changeFreq: "weekly",
    h1Override: "Sacred Kathas & Divine Stories",
    breadcrumbLabel: "Kathas",
    schemaMarkup: {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Hindu Sacred Kathas",
      url: `${SITE}/kathas`,
    },
  },

  // ==================== ASTROLOGY & INSIGHTS ====================
  {
    pagePath: "/ai-kundli",
    metaTitle: "Free AI Kundli Online - Generate Birth Chart & Predictions | Vedic Tatva",
    metaDescription:
      "Generate your free AI Kundli (Janam Kundli / Birth Chart) instantly. Get accurate Vedic predictions, dasha analysis, doshas, remedies & matchmaking — all 100% free.",
    metaKeywords:
      "free kundli online, ai kundli, janam kundli online, birth chart free, kundli matching free, online kundli in hindi, free horoscope, vedic kundli, kundli analysis, kundli prediction, manglik dosha check",
    ogTitle: "Free AI Kundli Online — Instant Birth Chart & Predictions",
    ogDescription:
      "Generate accurate AI-powered Vedic kundli with dasha, doshas, remedies and matchmaking — completely free.",
    priority: 0.95,
    changeFreq: "weekly",
    h1Override: "Free AI Kundli — Your Vedic Birth Chart Instantly",
    breadcrumbLabel: "Free Kundli",
    schemaMarkup: {
      "@context": "https://schema.org",
      "@graph": [
        serviceSchema(
          "Free AI Kundli Generation",
          "Generate accurate Vedic Janam Kundli (birth chart) with AI-powered dasha analysis, dosha detection and personalised remedies.",
          `${SITE}/ai-kundli`,
          "WebApplication"
        ),
        faqSchema([
          {
            q: "Is the kundli on Vedic Tatva really free?",
            a: "Yes. Generating your kundli, viewing your dasha, checking doshas and getting basic remedies is 100% free.",
          },
          {
            q: "How accurate is the AI Kundli?",
            a: "Our kundli engine uses authentic Vedic calculations (Lahiri Ayanamsa) — the same system used by traditional astrologers — combined with AI for personalised remedies.",
          },
          {
            q: "Can I check kundli matching for marriage?",
            a: "Yes. Our Ashtakoot Guna Milan matches both kundlis on 36 points and flags Mangal dosha automatically.",
          },
          {
            q: "What information do I need?",
            a: "Just your full date of birth, exact time of birth, and birthplace.",
          },
        ]),
      ],
    },
  },
  {
    pagePath: "/astrology",
    metaTitle: "Vedic Astrology Online - Talk to Astrologer, Free Predictions | Vedic Tatva",
    metaDescription:
      "Consult expert Vedic astrologers online. Free kundli, daily horoscope, love compatibility, career & marriage predictions. Trusted by 1L+ Indians.",
    metaKeywords:
      "vedic astrology online, talk to astrologer, online astrology consultation, free astrology, love astrology, career astrology, marriage astrology, hindu astrology, jyotish online, astrologer near me",
    priority: 0.9,
    changeFreq: "weekly",
    h1Override: "Vedic Astrology — Ancient Wisdom, Modern Insights",
    breadcrumbLabel: "Astrology",
    schemaMarkup: serviceSchema(
      "Vedic Astrology Consultation",
      "Online consultations with verified Vedic astrologers for life, career, marriage, finance and remedies.",
      `${SITE}/astrology`
    ),
  },
  {
    pagePath: "/zodiac-rashifal",
    metaTitle: "Aaj Ka Rashifal - Daily Horoscope in Hindi & English | Vedic Tatva",
    metaDescription:
      "Read Aaj Ka Rashifal — accurate daily horoscope predictions for all 12 rashis in Hindi & English. Love, career, money & health forecast updated daily.",
    metaKeywords:
      "aaj ka rashifal, daily rashifal, daily horoscope hindi, today horoscope, aaj ka rashi, rashifal in hindi, mesh rashifal, vrishabh rashifal, mithun rashifal, kark rashifal, simha rashifal, kanya rashifal, tula rashifal, vrishchik rashifal, dhanu rashifal, makar rashifal, kumbh rashifal, meen rashifal",
    priority: 0.9,
    changeFreq: "daily",
    h1Override: "Aaj Ka Rashifal — Daily Horoscope for All Rashis",
    breadcrumbLabel: "Rashifal",
    schemaMarkup: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "Daily Rashifal",
      url: `${SITE}/zodiac-rashifal`,
      breadcrumb: breadcrumb([
        { name: "Home", path: "/" },
        { name: "Astrology", path: "/astrology" },
        { name: "Rashifal", path: "/zodiac-rashifal" },
      ]),
    },
  },
  {
    pagePath: "/ai-baby-names",
    metaTitle: "Baby Names by Nakshatra & Rashi - Hindu Boy & Girl Names | Vedic Tatva",
    metaDescription:
      "Find perfect Hindu baby names by nakshatra, rashi & first letter. AI-curated boy & girl names with meanings in Sanskrit, Hindi & English. 10,000+ names.",
    metaKeywords:
      "baby names by nakshatra, hindu baby names, baby boy names, baby girl names, sanskrit baby names, baby names by rashi, modern hindu names, vedic baby names, indian baby names with meaning, newborn names hindi",
    priority: 0.85,
    changeFreq: "weekly",
    h1Override: "Hindu Baby Names by Nakshatra & Rashi",
    breadcrumbLabel: "Baby Names",
    schemaMarkup: serviceSchema(
      "AI Baby Name Generator",
      "Find Hindu baby names by nakshatra, rashi or first letter with Sanskrit meanings.",
      `${SITE}/ai-baby-names`,
      "WebApplication"
    ),
  },
  {
    pagePath: "/ai-palm-reading",
    metaTitle: "Online Palm Reading - Free AI Palmistry Analysis in Hindi | Vedic Tatva",
    metaDescription:
      "Get free AI palm reading online. Upload your palm photo for instant palmistry analysis — life line, heart line, career, marriage & wealth predictions.",
    metaKeywords:
      "palm reading online, online palmistry, ai palm reading, free palmistry, hath ki rekha, palm reading in hindi, life line palm reading, marriage line palmistry, career palmistry, hast rekha gyan",
    priority: 0.8,
    changeFreq: "weekly",
    h1Override: "AI Palm Reading — Discover Your Hand's Story",
    breadcrumbLabel: "Palm Reading",
    schemaMarkup: serviceSchema(
      "AI Palm Reading",
      "Free AI-powered palmistry analysis with life line, heart line, career and marriage predictions.",
      `${SITE}/ai-palm-reading`,
      "WebApplication"
    ),
  },

  // ==================== CALENDAR & GUIDANCE ====================
  {
    pagePath: "/panchang-calendar",
    metaTitle: "Aaj Ka Panchang - Today's Tithi, Nakshatra, Muhurat & Rahu Kaal | Vedic Tatva",
    metaDescription:
      "Aaj Ka Panchang — today's tithi, nakshatra, yoga, karana, sunrise, sunset, rahu kaal, abhijit muhurat & shubh muhurat. Accurate Hindu calendar for any city.",
    metaKeywords:
      "aaj ka panchang, today panchang, hindu calendar, daily panchang, panchang in hindi, tithi today, nakshatra today, rahu kaal today, abhijit muhurat, shubh muhurat today, hindu festivals 2026, ekadashi date, amavasya date, purnima date",
    ogTitle: "Aaj Ka Panchang — Today's Hindu Calendar & Muhurat",
    ogDescription: "Accurate tithi, nakshatra, rahu kaal & shubh muhurat for any city in India.",
    priority: 0.95,
    changeFreq: "daily",
    h1Override: "Aaj Ka Panchang — Today's Hindu Calendar",
    breadcrumbLabel: "Panchang",
    schemaMarkup: {
      "@context": "https://schema.org",
      "@graph": [
        serviceSchema(
          "Daily Panchang & Hindu Calendar",
          "Accurate daily panchang with tithi, nakshatra, yoga, karana, rahu kaal and shubh muhurat for any Indian city.",
          `${SITE}/panchang-calendar`
        ),
        faqSchema([
          {
            q: "What is panchang?",
            a: "Panchang is the traditional Hindu calendar with five elements: tithi, nakshatra, yoga, karana and vaar. It is used to find auspicious muhurat for any activity.",
          },
          {
            q: "What is rahu kaal?",
            a: "Rahu Kaal is a 90-minute period each day considered inauspicious for starting new ventures. Vedic Tatva calculates it precisely for your city.",
          },
          {
            q: "How is the muhurat calculated?",
            a: "Muhurat is calculated using authentic Drik Panchang methodology with Lahiri Ayanamsa, factoring tithi, nakshatra, yoga, karana and your exact location.",
          },
        ]),
      ],
    },
  },
  {
    pagePath: "/muhurat-finder",
    metaTitle: "Shubh Muhurat Finder - Marriage, Griha Pravesh, Vehicle | Vedic Tatva",
    metaDescription:
      "Find shubh muhurat for marriage, griha pravesh, mundan, vehicle purchase, business start & more. AI-powered muhurat finder with city-specific accuracy.",
    metaKeywords:
      "shubh muhurat, marriage muhurat 2026, griha pravesh muhurat, vehicle purchase muhurat, mundan muhurat, shubh muhurat today, vivah muhurat, business muhurat, naming ceremony muhurat, abhijit muhurat, choghadiya today",
    priority: 0.9,
    changeFreq: "daily",
    h1Override: "Find Shubh Muhurat for Every Sacred Occasion",
    breadcrumbLabel: "Muhurat Finder",
    schemaMarkup: serviceSchema(
      "Shubh Muhurat Finder",
      "Find auspicious shubh muhurat for marriage, griha pravesh, vehicle purchase, naming ceremony and other ceremonies.",
      `${SITE}/muhurat-finder`,
      "WebApplication"
    ),
  },
  {
    pagePath: "/vastu-compass",
    metaTitle: "Vastu Compass Online - Free Vastu Shastra Analysis for Home | Vedic Tatva",
    metaDescription:
      "Free online Vastu Compass — analyse your home's directions, identify vastu doshas & get instant remedies. AI-powered vastu shastra for home, office & shop.",
    metaKeywords:
      "vastu compass, vastu shastra online, free vastu analysis, vastu for home, vastu for office, vastu dosha remedies, vastu directions, north facing house vastu, kitchen vastu, bedroom vastu, vastu tips for home",
    priority: 0.85,
    changeFreq: "weekly",
    h1Override: "Free Vastu Compass — Analyse Your Home's Energy",
    breadcrumbLabel: "Vastu Compass",
    schemaMarkup: serviceSchema(
      "Online Vastu Compass",
      "AI-powered Vastu Shastra analysis with direction-wise dosha detection and remedies for home, office and shops.",
      `${SITE}/vastu-compass`,
      "WebApplication"
    ),
  },

  // ==================== COMMUNITY & KNOWLEDGE ====================
  {
    pagePath: "/donations",
    metaTitle: "Online Donations - Gau Daan, Anna Daan, Vastra Daan, Vidya Daan | Vedic Tatva",
    metaDescription:
      "Make sacred donations online — Gau Daan, Anna Daan, Vastra Daan, Vidya Daan & temple donations. Transparent tracking, 80G certificate, divine blessings.",
    metaKeywords:
      "online donation hindu, gau daan online, anna daan, vastra daan, vidya daan, temple donation online, charity donation india, 80g donation, daan punya, hindu charity, religious donation online",
    priority: 0.85,
    changeFreq: "weekly",
    h1Override: "Sacred Donations — Daan with Divine Blessings",
    breadcrumbLabel: "Donations",
    schemaMarkup: {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebPage",
          name: "Sacred Donations",
          url: `${SITE}/donations`,
        },
        faqSchema([
          {
            q: "Is my donation tax-deductible?",
            a: "Eligible donations qualify for 80G tax deduction. You will receive your 80G certificate by email after the donation is processed.",
          },
          {
            q: "How do I know my donation reaches the right cause?",
            a: "Every donation is tracked end-to-end. You receive an acknowledgement, dedicated puja confirmation (where applicable), and an impact report.",
          },
          {
            q: "What is Gau Daan?",
            a: "Gau Daan is the sacred donation made for the care of cows in goshalas. It is considered one of the most punya-giving daans in Hindu tradition.",
          },
        ]),
      ],
    },
  },
  {
    pagePath: "/temple-tourism",
    metaTitle: "Temple Tourism India - Char Dham, Jyotirlinga, Shakti Peeth Yatra | Vedic Tatva",
    metaDescription:
      "Plan your sacred yatra — Char Dham Yatra, 12 Jyotirlinga, 51 Shakti Peeth, Vaishno Devi, Tirupati & more. Verified packages, pandit-led pujas included.",
    metaKeywords:
      "char dham yatra, 12 jyotirlinga tour, shakti peeth yatra, vaishno devi yatra, tirupati darshan, kedarnath yatra, badrinath yatra, hindu pilgrimage tours, temple tour packages india, religious tourism india, dham yatra package",
    priority: 0.85,
    changeFreq: "weekly",
    h1Override: "Temple Tourism — Sacred Yatras Across India",
    breadcrumbLabel: "Temple Tourism",
    schemaMarkup: serviceSchema(
      "Hindu Pilgrimage & Temple Tourism",
      "Curated yatra packages for Char Dham, 12 Jyotirlinga, 51 Shakti Peeth and major Hindu temples across India.",
      `${SITE}/temple-tourism`,
      "TouristTrip"
    ),
  },
  {
    pagePath: "/scripture-search",
    metaTitle: "Scripture Search - Bhagavad Gita, Vedas, Upanishads & Puranas | Vedic Tatva",
    metaDescription:
      "Search verses across Bhagavad Gita, Vedas, Upanishads, Ramayan, Mahabharat & Puranas. AI-powered shloka search with Sanskrit, Hindi & English translations.",
    metaKeywords:
      "bhagavad gita search, vedas online, upanishads search, ramayan shloka, mahabharat verses, sanskrit shloka, hindu scripture search, gita shlok in hindi, puran katha online, vedic literature search",
    priority: 0.8,
    changeFreq: "weekly",
    h1Override: "Search the Sacred Scriptures",
    breadcrumbLabel: "Scripture Search",
    schemaMarkup: serviceSchema(
      "Hindu Scripture Search",
      "Search verses across Bhagavad Gita, Vedas, Upanishads and Puranas with multi-language translations.",
      `${SITE}/scripture-search`,
      "WebApplication"
    ),
  },
  {
    pagePath: "/matrimony",
    metaTitle: "Hindu Matrimony - Verified Profiles, Free Kundli Matching | Vedic Tatva",
    metaDescription:
      "Premium Hindu matrimony with verified profiles by community, gotra & rashi. Free kundli matching (Ashtakoot Guna Milan) included with every match.",
    metaKeywords:
      "hindu matrimony, brahmin matrimony, free kundli matching, gun milan online, ashtakoot matching, hindu marriage bureau, matrimony by community, vivah matrimony, hindu rishta online, matrimony with kundli",
    priority: 0.85,
    changeFreq: "weekly",
    h1Override: "Hindu Matrimony with Free Kundli Matching",
    breadcrumbLabel: "Matrimony",
    schemaMarkup: serviceSchema(
      "Hindu Matrimony Service",
      "Verified Hindu matrimony profiles with community-wise filters and built-in Ashtakoot Guna Milan kundli matching.",
      `${SITE}/matrimony`
    ),
  },

  // ==================== SUPPORTING PAGES ====================
  {
    pagePath: "/about",
    metaTitle: "About Vedic Tatva - India's Trusted Vedic Spiritual Platform",
    metaDescription:
      "Vedic Tatva blends authentic Vedic wisdom with modern technology. Verified pandits, AI astrology, premium puja samagri & sacred services trusted by 1L+ Indians.",
    metaKeywords:
      "about vedic tatva, vedic spiritual platform, hindu spiritual website, authentic vedic services, online puja platform india",
    priority: 0.6,
    changeFreq: "monthly",
    h1Override: "About Vedic Tatva",
    breadcrumbLabel: "About",
  },
  {
    pagePath: "/contact",
    metaTitle: "Contact Vedic Tatva - Customer Support, Pandit Booking Help",
    metaDescription:
      "Get in touch with Vedic Tatva. Customer support for pandit bookings, puja services, orders & spiritual guidance. Email, phone & WhatsApp support available.",
    metaKeywords: "contact vedic tatva, customer support, pandit booking help, puja support",
    priority: 0.5,
    changeFreq: "monthly",
    breadcrumbLabel: "Contact",
  },
  {
    pagePath: "/become-pandit",
    metaTitle: "Become a Pandit on Vedic Tatva - Apply to Join Verified Pandits",
    metaDescription:
      "Are you a qualified pandit? Apply to join Vedic Tatva's network of verified pandits. Reach more clients across India, transparent payouts, easy bookings.",
    metaKeywords:
      "become a pandit, pandit registration online, join as pandit, hindu priest jobs, pandit network india",
    priority: 0.6,
    changeFreq: "monthly",
    breadcrumbLabel: "Become a Pandit",
  },
  {
    pagePath: "/become-astrologer",
    metaTitle: "Become an Astrologer on Vedic Tatva - Apply to Consult Online",
    metaDescription:
      "Verified astrologers — join Vedic Tatva to consult clients online across India. Flexible hours, transparent earnings, AI-supported tools.",
    metaKeywords:
      "become an astrologer, astrologer registration online, online astrology jobs, vedic astrologer apply, jyotish jobs",
    priority: 0.6,
    changeFreq: "monthly",
    breadcrumbLabel: "Become an Astrologer",
  },
  {
    pagePath: "/membership",
    metaTitle: "Vedic Tatva Membership - Premium Spiritual Benefits & Discounts",
    metaDescription:
      "Join Vedic Tatva Membership for premium spiritual benefits — priority pandit booking, exclusive puja access, free shipping, monthly samagri kits.",
    metaKeywords: "vedic tatva membership, spiritual subscription, premium puja booking, hindu membership benefits",
    priority: 0.7,
    changeFreq: "monthly",
    breadcrumbLabel: "Membership",
  },

  // ==================== PIND DAAN CLUSTER ====================
  {
    pagePath: "/pind-daan",
    metaTitle: "Pind Daan, Tarpan & Shradh Online — Kashi, Gaya, Haridwar | Vedic Tatva",
    metaDescription:
      "Book authentic Pind Daan, Tarpan and Shradh online at Kashi, Gaya and Haridwar. Verified Tirth Purohits, full shastric vidhi, live video Sankalp, photo-video proof and prasad couriered worldwide.",
    metaKeywords:
      "pind daan online, tarpan online booking, shradh booking, pitru paksha puja, pind daan kashi, pind daan gaya, pind daan haridwar, ancestor puja online, pitru dosh nivaran, remote pind daan",
    ogTitle: "Pind Daan, Tarpan & Shradh — Bookable from Anywhere in the World",
    ogDescription:
      "Honour your ancestors at the most sacred tirthas of Bharat — Kashi, Gaya, Haridwar. Performed by verified Tirth Purohits with live Sankalp via video call.",
    priority: 0.9,
    changeFreq: "weekly",
    h1Override: "Pind Daan, Tarpan & Shradh — Pitru Seva at Sacred Tirthas",
    breadcrumbLabel: "Pind Daan",
    schemaMarkup: {
      "@context": "https://schema.org",
      "@graph": [
        serviceSchema(
          "Pind Daan, Tarpan & Shradh — Online Booking",
          "Authentic ancestral rites performed by verified Tirth Purohits at Kashi, Gaya and Haridwar with live video Sankalp, photo-video proof and prasad couriered worldwide.",
          `${SITE}/pind-daan`
        ),
        breadcrumb([
          { name: "Home", path: "/" },
          { name: "Pind Daan", path: "/pind-daan" },
        ]),
      ],
    },
  },
  {
    pagePath: "/pind-daan/kashi",
    metaTitle: "Pind Daan in Kashi (Varanasi) — Manikarnika & Pishachmochan | Vedic Tatva",
    metaDescription:
      "Book Pind Daan in Kashi at Manikarnika Ghat and Pishachmochan Kund. Tripindi Shradh, Tarpan and Brahman Bhojan by verified Kashi Tirth Purohits with live video Sankalp from anywhere in the world.",
    metaKeywords:
      "pind daan in kashi, pind daan varanasi, manikarnika ghat pind daan, pishachmochan tripindi shradh, kashi shradh online, tirth purohit varanasi",
    ogTitle: "Pind Daan in Kashi — Manikarnika Ghat & Pishachmochan Kund",
    ogDescription:
      "Liberation rites at Lord Shiva's holy city — performed by verified Karmakandi Brahmins of Kashi with live Sankalp and proof.",
    priority: 0.85,
    changeFreq: "monthly",
    h1Override: "Pind Daan in Kashi (Varanasi) — Manikarnika Ghat & Pishachmochan Kund",
    breadcrumbLabel: "Kashi",
    schemaMarkup: {
      "@context": "https://schema.org",
      "@graph": [
        serviceSchema(
          "Pind Daan in Kashi (Varanasi)",
          "Pind Daan, Tarpan and Tripindi Shradh at Manikarnika Ghat and Pishachmochan Kund in Kashi, performed by verified Tirth Purohits with live video Sankalp.",
          `${SITE}/pind-daan/kashi`
        ),
        breadcrumb([
          { name: "Home", path: "/" },
          { name: "Pind Daan", path: "/pind-daan" },
          { name: "Kashi", path: "/pind-daan/kashi" },
        ]),
      ],
    },
  },
  {
    pagePath: "/pind-daan/gaya",
    metaTitle: "Pind Daan in Gaya — Vishnupad, Phalgu & Akshayavat | Vedic Tatva",
    metaDescription:
      "Pind Daan in Gaya at Vishnupad Mandir, Phalgu River and Akshayavat by traditional Gayawal Tirth Purohits. 1-day or full 3-day shastric vidhi, live Sankalp via video call.",
    metaKeywords:
      "pind daan in gaya, gaya shradh online, vishnupad mandir pind daan, phalgu river tarpan, akshayavat sankalp, gayawal pandit booking, gaya tirth pind daan",
    ogTitle: "Pind Daan in Gaya — The Final Liberation of Ancestors",
    ogDescription:
      "Once-in-a-lifetime Gaya Shradh with Gayawal pandits — Vishnupad, Phalgu, Akshayavat. Bookable remotely with full proof.",
    priority: 0.85,
    changeFreq: "monthly",
    h1Override: "Pind Daan in Gaya (Bihar) — Vishnupad, Phalgu River & Akshayavat",
    breadcrumbLabel: "Gaya",
    schemaMarkup: {
      "@context": "https://schema.org",
      "@graph": [
        serviceSchema(
          "Pind Daan in Gaya (Bihar)",
          "Pind Daan at Vishnupad Mandir, Phalgu River and Akshayavat performed by traditional Gayawal Tirth Purohits — 1-day Sankshipt or full 3-day shastric vidhi.",
          `${SITE}/pind-daan/gaya`
        ),
        breadcrumb([
          { name: "Home", path: "/" },
          { name: "Pind Daan", path: "/pind-daan" },
          { name: "Gaya", path: "/pind-daan/gaya" },
        ]),
      ],
    },
  },
  {
    pagePath: "/pind-daan/haridwar",
    metaTitle: "Pind Daan in Haridwar — Narayani Shila & Har Ki Pauri | Pitru Dosh Nivaran",
    metaDescription:
      "Pind Daan and Tarpan in Haridwar at Narayani Shila Temple, Har Ki Pauri Brahmakund and Kankhal — the prime remedy for Pitru Dosh in Vedic astrology. Same-day Sankalp via video.",
    metaKeywords:
      "pind daan in haridwar, narayani shila puja, har ki pauri tarpan, pitru dosh nivaran haridwar, kankhal shradh, haridwar tirth purohit, brahmakund tarpan",
    ogTitle: "Pind Daan in Haridwar — Pitru Dosh Nivaran at Narayani Shila",
    ogDescription:
      "Mother Ganga carries your offering — Tarpan at Brahmakund, Narayani Shila Pitru Dosh puja by registered Haridwar purohits.",
    priority: 0.85,
    changeFreq: "monthly",
    h1Override: "Pind Daan in Haridwar — Narayani Shila, Har Ki Pauri & Kankhal",
    breadcrumbLabel: "Haridwar",
    schemaMarkup: {
      "@context": "https://schema.org",
      "@graph": [
        serviceSchema(
          "Pind Daan in Haridwar",
          "Pind Daan, Tarpan and Pitru Dosh Nivaran puja at Narayani Shila, Har Ki Pauri Brahmakund and Kankhal — performed by registered Haridwar Tirth Purohits with live video Sankalp.",
          `${SITE}/pind-daan/haridwar`
        ),
        breadcrumb([
          { name: "Home", path: "/" },
          { name: "Pind Daan", path: "/pind-daan" },
          { name: "Haridwar", path: "/pind-daan/haridwar" },
        ]),
      ],
    },
  },
  {
    pagePath: "/pind-daan/why-important",
    metaTitle: "Why Pind Daan Is Important — Pitru Rina & Garuda Purana Significance | Vedic Tatva",
    metaDescription:
      "Understand the spiritual importance of Pind Daan in Sanatan Dharma — Pitru Rina, Garuda Purana teachings, Pitru Dosh, Pitru Paksha and the benefits of shradh for ancestors and descendants.",
    metaKeywords:
      "why pind daan is important, pitru rina meaning, garuda purana shradh, pitru dosh symptoms, pitru paksha significance, importance of tarpan, ancestral debt hinduism",
    ogTitle: "Why Pind Daan Is the Highest Form of Devotion to Ancestors",
    ogDescription:
      "An ancient Pitru Rina every Hindu owes — explained through Garuda Purana, Manusmriti and lived tradition of Bharat.",
    priority: 0.8,
    changeFreq: "monthly",
    h1Override: "Why Pind Daan Is So Important in Sanatan Dharma",
    breadcrumbLabel: "Why Important",
    schemaMarkup: {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@context": "https://schema.org",
          "@type": "Article",
          headline: "Why Pind Daan Is So Important in Sanatan Dharma",
          description:
            "An explainer on Pitru Rina, Garuda Purana shastra, Pitru Dosh and the spiritual mechanics of Pind Daan and Tarpan.",
          author: { "@type": "Organization", name: BRAND, url: SITE },
          publisher: { "@type": "Organization", name: BRAND, url: SITE, logo: { "@type": "ImageObject", url: `${SITE}/logo.png` } },
          mainEntityOfPage: `${SITE}/pind-daan/why-important`,
        },
        breadcrumb([
          { name: "Home", path: "/" },
          { name: "Pind Daan", path: "/pind-daan" },
          { name: "Why Important", path: "/pind-daan/why-important" },
        ]),
      ],
    },
  },
  {
    pagePath: "/pind-daan/sites-in-india",
    metaTitle: "Pind Daan Sites in India — Gaya, Kashi, Haridwar, Trimbakeshwar & More | Vedic Tatva",
    metaDescription:
      "Sacred Pind Daan and Tarpan sites in India — Gaya, Kashi, Haridwar, Trimbakeshwar, Rameshwaram, Badrinath Brahma Kapal. Significance, ideal use case and how to book each.",
    metaKeywords:
      "pind daan sites in india, pitra tirth in india, trimbakeshwar pind daan, rameshwaram tarpan, badrinath brahma kapal, sacred shradh sites, pitru tirthas of bharat",
    ogTitle: "Must-Visit Pind Daan Sites Across Bharat",
    ogDescription:
      "From the eternal banyan of Gaya to the silver shores of Rameshwaram — the sacred map of ancestral liberation.",
    priority: 0.8,
    changeFreq: "monthly",
    h1Override: "Must-Visit Pind Daan Sites Across Bharat",
    breadcrumbLabel: "Sites in India",
    schemaMarkup: {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@context": "https://schema.org",
          "@type": "Article",
          headline: "Must-Visit Pind Daan Sites Across Bharat",
          description:
            "A complete guide to the most sacred Pind Daan and Tarpan tirthas of India — Gaya, Kashi, Haridwar, Trimbakeshwar, Rameshwaram, Badrinath and more.",
          author: { "@type": "Organization", name: BRAND, url: SITE },
          publisher: { "@type": "Organization", name: BRAND, url: SITE, logo: { "@type": "ImageObject", url: `${SITE}/logo.png` } },
          mainEntityOfPage: `${SITE}/pind-daan/sites-in-india`,
        },
        breadcrumb([
          { name: "Home", path: "/" },
          { name: "Pind Daan", path: "/pind-daan" },
          { name: "Sites in India", path: "/pind-daan/sites-in-india" },
        ]),
      ],
    },
  },
  {
    pagePath: "/pind-daan/yearly-remote",
    metaTitle: "Yearly Remote Tarpan & Pind Daan on Death Anniversary | NRI Pitru Seva",
    metaDescription:
      "Yearly remote shradh subscription for NRIs and devotees abroad — annual Pind Daan and Tarpan on death anniversary tithi at Kashi, Gaya or Haridwar with live video Sankalp and prasad couriered worldwide.",
    metaKeywords:
      "yearly pind daan online, remote tarpan service, nri shradh booking, annual death anniversary puja, online shradh for nri, pind daan from abroad, remote pitru seva subscription",
    ogTitle: "Yearly Remote Tarpan & Pind Daan — Never Miss the Annual Shradh",
    ogDescription:
      "Auto-scheduled annual shradh on the correct tithi at a sacred tirth — for NRIs, busy professionals and elderly devotees.",
    priority: 0.85,
    changeFreq: "monthly",
    h1Override: "Yearly Remote Tarpan & Pind Daan on Death Anniversary",
    breadcrumbLabel: "Yearly Remote",
    schemaMarkup: {
      "@context": "https://schema.org",
      "@graph": [
        serviceSchema(
          "Yearly Remote Tarpan & Pind Daan",
          "Annual subscription for remote Pind Daan and Tarpan on the death anniversary tithi at Kashi, Gaya or Haridwar — full shastric vidhi with live video Sankalp and prasad couriered worldwide.",
          `${SITE}/pind-daan/yearly-remote`
        ),
        breadcrumb([
          { name: "Home", path: "/" },
          { name: "Pind Daan", path: "/pind-daan" },
          { name: "Yearly Remote", path: "/pind-daan/yearly-remote" },
        ]),
      ],
    },
  },
];

async function seed() {
  console.log(`Seeding ${ENTRIES.length} SEO pages (upsert by pagePath)...`);

  let inserted = 0;
  let updated = 0;

  for (const e of ENTRIES) {
    const canonicalUrl = `${SITE}${e.pagePath}`;
    const ogTitle = e.ogTitle || e.metaTitle;
    const ogDescription = e.ogDescription || e.metaDescription;
    const twitterTitle = e.twitterTitle || ogTitle;
    const twitterDescription = e.twitterDescription || ogDescription;

    const values = {
      pagePath: e.pagePath,
      metaTitle: e.metaTitle,
      metaDescription: e.metaDescription,
      metaKeywords: e.metaKeywords,
      canonicalUrl,
      ogTitle,
      ogDescription,
      ogImage: e.ogImage || DEFAULT_OG,
      ogType: e.ogType || "website",
      twitterTitle,
      twitterDescription,
      twitterImage: e.twitterImage || DEFAULT_OG,
      robotsIndex: e.robotsIndex !== false,
      robotsFollow: e.robotsFollow !== false,
      priority: e.priority ?? 0.7,
      changeFreq: e.changeFreq || "weekly",
      schemaMarkup: e.schemaMarkup ? JSON.stringify(e.schemaMarkup) : null,
      h1Override: e.h1Override || null,
      breadcrumbLabel: e.breadcrumbLabel || null,
      isActive: true,
      updatedAt: new Date(),
    };

    const result = await db
      .insert(seoPages)
      .values(values)
      .onConflictDoUpdate({
        target: seoPages.pagePath,
        set: {
          metaTitle: values.metaTitle,
          metaDescription: values.metaDescription,
          metaKeywords: values.metaKeywords,
          canonicalUrl: values.canonicalUrl,
          ogTitle: values.ogTitle,
          ogDescription: values.ogDescription,
          ogImage: values.ogImage,
          ogType: values.ogType,
          twitterTitle: values.twitterTitle,
          twitterDescription: values.twitterDescription,
          twitterImage: values.twitterImage,
          robotsIndex: values.robotsIndex,
          robotsFollow: values.robotsFollow,
          priority: values.priority,
          changeFreq: values.changeFreq,
          schemaMarkup: values.schemaMarkup,
          h1Override: values.h1Override,
          breadcrumbLabel: values.breadcrumbLabel,
          isActive: values.isActive,
          updatedAt: values.updatedAt,
        },
      })
      .returning({ id: seoPages.id });

    if (result.length > 0) updated++;
    else inserted++;
  }

  console.log(`SEO pages seeded: ${inserted} inserted, ${updated} updated/upserted (total ${ENTRIES.length}).`);
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });

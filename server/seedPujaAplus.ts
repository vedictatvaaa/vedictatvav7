import { db } from "./db";
import { products } from "@shared/schema";
import { eq } from "drizzle-orm";

const BRAND = {
  cream: "#FBF7EE",
  gold: "#D4AF37",
  goldDark: "#A8821B",
  maroon: "#6D2B35",
  maroonDark: "#4a1c24",
  darkText: "#3a2a1a",
  mutedText: "#5a4a3a",
};

type PujaItem = {
  slug: string;
  name: string;
  shortName: string;
  category: string;
  price: number;
  mrp: number;
  stock: number;
  badge?: string;
  hsnCode: string;
  weight: string;
  image: string;
  images: string[];
  hero: { eyebrow: string; title: string; subtitle: string; tag: string };
  shortDescription: string;
  highlights: string[];
  features: string[];
  ingredients: { name: string; benefit: string }[];
  benefits: { title: string; body: string }[];
  usage: string[];
  occasions: string[];
  whyVedicTatva: { title: string; body: string }[];
  variations?: { label: string; price: number }[];
  region?: string;
};

// =============================================================================
// PRODUCT CATALOG  — 6 Puja Samagri items
// =============================================================================
const ITEMS: PujaItem[] = [
  // 1. SANDALWOOD DHOOP CONES — Puri Jagannath Edition
  {
    slug: "vedic-tatva-sandalwood-dhoop-cones-puri-jagannath",
    name: "Vedic Tatva Pure Sandalwood Dhoop Cones — Puri Jagannath Edition | Temple-Grade Chandan Aroma | 100+ Cones",
    shortName: "Sandalwood Dhoop Cones",
    category: "Puja Samagri",
    price: 349,
    mrp: 499,
    stock: 80,
    badge: "Bestseller",
    hsnCode: "33074900",
    weight: "200g",
    image: "/attached_assets/IMG_1811.JPG_1776544579053.jpeg",
    images: ["/attached_assets/IMG_1811.JPG_1776544579053.jpeg"],
    hero: {
      eyebrow: "Puri Jagannath Edition",
      title: "Pure Sandalwood Dhoop Cones",
      subtitle: "Temple-grade chandan aroma — handcrafted in Bharat, blessed in Puri.",
      tag: "100% Herbal · Made in India · Cruelty-Free",
    },
    shortDescription:
      "Hand-rolled dhoop cones made from pure Mysuru sandalwood and temple-grade chandan powder, offered first at Sri Jagannath Temple, Puri before being shipped to your home.",
    highlights: [
      "PURE SANDALWOOD: Made from real Mysuru chandan — not synthetic fragrance",
      "TEMPLE-GRADE: Each batch offered first at Sri Jagannath Mandir, Puri",
      "100% HERBAL: No charcoal, no chemicals, no parabens",
      "LONG-LASTING: Each cone burns for 25–30 minutes of pure chandan aroma",
      "100+ CONES per jar — enough for 3+ months of daily puja",
    ],
    features: [
      "Quantity: 100+ cones",
      "Burn time: 25–30 mins per cone",
      "Net weight: 200g",
      "Type: Bambooless herbal dhoop",
      "Ingredients: Mysuru chandan, halmaddi, jiggat, devdar, loban, ghee",
      "Made in: Bharat (Puri, Odisha)",
    ],
    ingredients: [
      { name: "Mysuru Chandan", benefit: "Calms the mind, deepens meditation" },
      { name: "Devdar", benefit: "Sacred wood used in temple havans" },
      { name: "Loban", benefit: "Removes negative energies from the home" },
      { name: "Halmaddi", benefit: "Natural binder used in traditional dhoop" },
      { name: "Pure Cow Ghee", benefit: "Adds satvik fragrance, pleases devatas" },
      { name: "Jiggat (Lac Resin)", benefit: "Ancient Vedic resin, balances vata" },
    ],
    benefits: [
      { title: "Pleases Sri Jagannath", body: "Sandalwood is the favourite offering of Lord Jagannath. Light a cone during your daily puja for His blessings." },
      { title: "Deep Meditation Aid", body: "The grounding chandan aroma quiets monkey-mind chatter within minutes — perfect for japa and dhyana." },
      { title: "Vastu Purification", body: "Burning sandalwood dhoop in the morning and evening cleanses negative energies and balances Vastu doshas." },
      { title: "Ayurvedic Wellness", body: "Sandalwood smoke is a natural anti-inflammatory and helps clear sinuses, improve sleep quality, and reduce stress." },
    ],
    usage: [
      "Light the tip of one cone with a matchstick or diya flame.",
      "Allow the flame to glow for 8–10 seconds, then gently blow it out.",
      "Place the cone on a non-flammable plate or sandalwood holder.",
      "Best burned in front of your puja altar during morning sandhya or evening aarti.",
      "Open windows after burning for fresh air circulation.",
    ],
    occasions: ["Daily morning puja", "Sandhya aarti", "Meditation & yoga", "Diwali, Janmashtami, Jagannath Rath Yatra", "Griha Pravesh & house cleansing"],
    whyVedicTatva: [
      { title: "Real Mysuru Chandan", body: "We source genuine Mysuru sandalwood (verified by oil-content testing) — not the cheap synthetic chandan most brands use." },
      { title: "Blessed at Puri", body: "Every batch is offered at Sri Jagannath Mandir, Puri before being packaged and dispatched to your home." },
      { title: "Glass Jar Packaging", body: "Reusable airtight jar protects fragrance for 18+ months — no soggy boxes, no broken cones." },
    ],
  },

  // 2A. DIVYA SAMBRANI CUPS — Classic 24-piece
  {
    slug: "vedic-tatva-divya-sambrani-cups-24",
    name: "Vedic Tatva Divya Sambrani Cups — Classic Cow Dung Sambrani | Bambooless | 24 Cups Pack",
    shortName: "Divya Sambrani Cups (24 pc)",
    category: "Puja Samagri",
    price: 199,
    mrp: 299,
    stock: 120,
    badge: "Daily Use",
    hsnCode: "33074900",
    weight: "180g",
    image: "/attached_assets/IMG_2060.JPG_1776544579057.jpeg",
    images: ["/attached_assets/IMG_2060.JPG_1776544579057.jpeg"],
    hero: {
      eyebrow: "Classic Daily Sambrani · 24 Cups",
      title: "Divya Sambrani Cups",
      subtitle: "Traditional cow-dung sambrani cups infused with sacred resins — light a cup, fill your home with divine fragrance.",
      tag: "Desi Gau-Kripa · 100% Natural · Smokeless",
    },
    shortDescription:
      "Hand-made sambrani cups crafted from desi cow dung, pure sambrani resin, dhuna, and loban. Light one cup at sandhya kala for instant Vastu purification and divine fragrance — a must-have for every Hindu home.",
    highlights: [
      "DESI COW DUNG base — pure indigenous Bharatiya gau-mata gobar",
      "PURE SAMBRANI RESIN — temple-grade sacred resin",
      "BAMBOOLESS — burns clean, no toxic fumes",
      "INSTANT HOME PURIFICATION — kills airborne bacteria in 1 hour",
      "24 CUPS per jar — perfect for daily morning & evening ritual",
    ],
    features: [
      "Quantity: 24 cups",
      "Burn time: 8–12 mins per cup",
      "Net weight: 180g",
      "Type: Bambooless cow-dung sambrani cup",
      "Ingredients: Desi cow dung, sambrani resin, loban, dhuna, desi ghee",
      "Made in: Bharat",
    ],
    ingredients: [
      { name: "Desi Cow Dung", benefit: "Sacred base — purifies air, eliminates radiation" },
      { name: "Sambrani Resin", benefit: "Temple-grade benzoin — calming, deeply spiritual" },
      { name: "Loban", benefit: "Removes negative energy, traditional Indian incense" },
      { name: "Dhuna", benefit: "Sal-tree resin, prized in Tantric pujas" },
      { name: "Desi Ghee", benefit: "Pleases Agni Dev, intensifies fire offering" },
    ],
    benefits: [
      { title: "Daily Sandhya Companion", body: "Perfect for everyday morning and evening aarti — light one cup as you ring the bell, and your puja room transforms instantly." },
      { title: "Kills 94% of Airborne Bacteria", body: "Cow-dung + sambrani smoke is scientifically proven (Tilak College Pune study, 2007) to eliminate airborne pathogens within 1 hour." },
      { title: "Removes Vastu Doshas", body: "Burning daily in your home dispels negative energy, evil eye (nazar), and corrects subtle Vastu imbalances." },
      { title: "Calming Sacred Aroma", body: "Pure sambrani has been used for centuries in South Indian temples — its grounding fragrance reduces stress and promotes sleep." },
    ],
    usage: [
      "Place one Sambrani cup on a non-flammable plate or stainless-steel holder.",
      "Light the top of the cup with a matchstick or candle flame.",
      "Allow it to burn for 5–8 seconds, then gently blow out the flame — the cup will smoulder and release sacred smoke.",
      "Walk slowly around your puja room or home, allowing the smoke to cleanse every corner.",
      "Best done at sandhya kala — sunrise and sunset.",
    ],
    occasions: ["Daily morning & evening puja", "Vastu shanti", "After cooking (kitchen cleansing)", "Bedroom (before sleep)", "After guests leave (energy cleansing)"],
    whyVedicTatva: [
      { title: "Genuine Desi Gau-Mata Gobar", body: "We source dung exclusively from indigenous Indian cow breeds (Gir, Sahiwal, Tharparkar) raised in goshalas — never from foreign breeds." },
      { title: "Pure Sambrani — No Fillers", body: "Most brands cut sambrani with chemical fragrance. Ours uses authentic temple-grade resin with zero synthetic additives." },
      { title: "100% Smokeless to Allergy-Sensitive Eyes", body: "Slow-burn formulation produces aromatic smoke without irritating eyes or throat." },
    ],
  },

  // 2B. DIVYA SAMBRANI 9 RATAN HAWAN CUPS — Premium 65-piece
  {
    slug: "vedic-tatva-divya-sambrani-9-ratan-hawan-cups-65",
    name: "Vedic Tatva Divya Sambrani — 9 Ratan Hawan Cups | Cow Dung + 9 Sacred Herbs | Bambooless | 65 Cups Bulk Pack",
    shortName: "9 Ratan Hawan Cups (65 pc)",
    category: "Puja Samagri",
    price: 449,
    mrp: 699,
    stock: 80,
    badge: "9 Ratan Premium",
    hsnCode: "33074900",
    weight: "650g",
    image: "/attached_assets/IMG_2401_1776544579060.PNG",
    images: [
      "/attached_assets/IMG_2401_1776544579060.PNG",
      "/attached_assets/IMG_2060.JPG_1776544579057.jpeg",
    ],
    hero: {
      eyebrow: "9 Ratan Sacred Blend · 65 Cups",
      title: "Divya Sambrani 9 Ratan Hawan Cups",
      subtitle: "Cow-dung based hawan cups blended with 9 sacred herbs — light a cup, instant havan.",
      tag: "Desi Gau-Kripa · 9 Sacred Herbs · Bulk Family Pack",
    },
    shortDescription:
      "Hawan-in-a-cup. Each Divya Sambrani 9 Ratan cup is made from desi cow dung mixed with 9 ratan herbs — Guggal, Neem, Kapoor, Sandalwood, Agarwood, Dhuna, Ghee, Loban, and Sambrani. 65 cups per bulk pack — over 2 months of daily ritual.",
    highlights: [
      "DESI COW DUNG: Made from indigenous Bharatiya gau-mata gobar",
      "9 SACRED HERBS: Guggal, Neem, Kapoor, Sandalwood, Agarwood, Dhuna, Ghee, Loban, Sambrani",
      "INSTANT HAWAN: One cup = full havan ritual without setup",
      "AIR PURIFIER: Scientifically proven to kill 94% airborne bacteria in 1 hour",
      "65 CUPS BULK PACK — over 2 months of daily ritual",
    ],
    features: [
      "Quantity: 65 cups",
      "Burn time: 8–12 mins per cup",
      "Net weight: 650g",
      "Type: Bambooless cow-dung hawan cup",
      "Ingredients: Desi cow dung, guggal, neem, kapoor, sandalwood, agarwood, dhuna, desi ghee, loban, sambrani",
      "Made in: Bharat",
    ],
    ingredients: [
      { name: "Desi Cow Dung", benefit: "Sacred base — purifies air, eliminates radiation" },
      { name: "Guggal", benefit: "Ancient resin used in Yajurvedic havans" },
      { name: "Neem Powder", benefit: "Natural antibacterial; clears airborne pathogens" },
      { name: "Kapoor (Camphor)", benefit: "Removes negative energy, lifts mood instantly" },
      { name: "Sandalwood Powder", benefit: "Calms nervous system, deepens meditation" },
      { name: "Agarwood (Oud) Powder", benefit: "Spiritually elevating, opens crown chakra" },
      { name: "Dhuna", benefit: "Sal-tree resin, prized in Tantric pujas" },
      { name: "Desi Ghee", benefit: "Pleases Agni Dev, intensifies fire offering" },
      { name: "Loban + Sambrani", benefit: "Deep ground-note aromas — calming, sacred" },
    ],
    benefits: [
      { title: "Hawan Without Effort", body: "No havan kund, no samidha, no chanting setup needed. Just light one cup — the sacred fire of 9 herbs burns on its own." },
      { title: "Kills 94% of Airborne Bacteria", body: "Cow-dung + medicinal herb smoke is scientifically proven (Tilak College Pune study, 2007) to eliminate airborne pathogens within 1 hour." },
      { title: "Removes Vastu Doshas", body: "Burning daily in your home dispels negative energy, evil eye (nazar), and corrects subtle Vastu imbalances." },
      { title: "Elevates Mental State", body: "The combined aroma of sandalwood + agarwood + camphor reduces cortisol (stress hormone) within 5 minutes of inhalation." },
    ],
    usage: [
      "Place one Sambrani cup on a non-flammable plate or stainless-steel holder.",
      "Light the top of the cup with a matchstick or candle flame.",
      "Allow it to burn for 5–8 seconds, then gently blow out the flame — the cup will smoulder and release sacred smoke.",
      "Walk slowly around your puja room or home, allowing the smoke to cleanse every corner.",
      "Best done at sandhya kala — sunrise and sunset, or during havan/yagya.",
    ],
    occasions: ["Daily morning puja", "Havan & Yagya", "Vastu shanti", "Diwali, Navratri, Holi", "Griha Pravesh", "After guests leave (energy cleansing)"],
    whyVedicTatva: [
      { title: "Genuine Desi Gau-Mata Gobar", body: "We source dung exclusively from indigenous Indian cow breeds (Gir, Sahiwal, Tharparkar) raised in goshalas — never from foreign breeds." },
      { title: "9 Herbs in Shastric Ratio", body: "Most brands use 2-3 fillers. Ours uses all 9 ratan herbs in the exact ratios prescribed in Atharvaveda." },
      { title: "Bulk Family Value", body: "65 cups means one full havan-grade cup every single day for over two months — best per-cup value in this premium category." },
    ],
  },

  // 3. KRISHNA MUSK BAMBOOLESS DHOOP STICKS
  {
    slug: "vedic-tatva-krishna-musk-bambooless-dhoop-sticks",
    name: "Vedic Tatva Krishna Musk Bambooless Dhoop Sticks — Divya Sugandham | Cow Dung + Temple Flowers | 60 Sticks",
    shortName: "Krishna Musk Dhoop Sticks",
    category: "Puja Samagri",
    price: 699,
    mrp: 999,
    stock: 90,
    badge: "Premium",
    hsnCode: "33074900",
    weight: "180g",
    image: "/attached_assets/IMG_2626.JPG_1776544579061.jpeg",
    images: ["/attached_assets/IMG_2626.JPG_1776544579061.jpeg"],
    hero: {
      eyebrow: "Divya Sugandham",
      title: "Krishna Musk Bambooless Dhoop Sticks",
      subtitle: "Premium herbal incense inspired by the divine fragrance of Vrindavan.",
      tag: "Bambooless · Charcoal-Free · 100% Herbal",
    },
    shortDescription:
      "Premium bambooless dhoop sticks blended with sacred cow dung, temple flower powders, holy herbs, and pure essential oils — recreating the eternal fragrance of Lord Krishna's Vrindavan.",
    highlights: [
      "BAMBOOLESS: No bamboo stick — burns clean, no toxic fumes",
      "SACRED COW DUNG: Indigenous Bharatiya gau-mata base",
      "TEMPLE FLOWER POWDERS: Marigold, mogra, rose, tulsi from temple offerings",
      "PURE ESSENTIAL OILS: No synthetic fragrance — only natural plant extracts",
      "60 STICKS per pack — 2+ months of daily puja",
    ],
    features: [
      "Quantity: 60 sticks",
      "Length: 8 inches",
      "Burn time: 35–40 mins per stick",
      "Net weight: 180g",
      "Type: Bambooless masala dhoop",
      "Ingredients: Desi cow dung, temple flower powders, holy herbs, pure essential oils",
    ],
    ingredients: [
      { name: "Sacred Cow Dung", benefit: "Spiritual purification, pleases Lord Krishna (gau-pal)" },
      { name: "Temple Marigold Powder", benefit: "Krishna's favourite flower — invokes Vaikuntha vibrations" },
      { name: "Tulsi Powder", benefit: "Most sacred to Vishnu/Krishna — purifies space" },
      { name: "Mogra (Jasmine) Powder", benefit: "Sweet floral note, beloved by Radha-Krishna" },
      { name: "Rose Petal Powder", benefit: "Symbol of bhakti, opens the heart chakra" },
      { name: "Holy Herbs Blend", benefit: "Brahmi, Shankhpushpi — calm the mind for meditation" },
      { name: "Pure Essential Oils", benefit: "Natural musk, sandalwood, kewra — long-lasting aroma" },
    ],
    benefits: [
      { title: "Invokes Krishna Bhava", body: "The sweet-floral musky aroma is reminiscent of Vrindavan's eternal spring — perfect for chanting Hare Krishna mantra or reading Bhagavad Gita." },
      { title: "Bambooless = No Toxins", body: "Most cheap incense burns bamboo sticks which release benzene and toxic VOCs. Ours has no bamboo — pure herbal smoke only." },
      { title: "Long-Lasting Premium Aroma", body: "Each stick burns for 35–40 mins (vs 20-25 mins of standard agarbatti) — better value and richer fragrance throw." },
      { title: "Perfect for Bhakti Sadhana", body: "Light during your morning chanting, kirtan, or evening aarti for an instantly devotional ambience." },
    ],
    usage: [
      "Light the tip of one stick with a matchstick or candle flame.",
      "Allow the flame to glow for 5–8 seconds, then gently blow out.",
      "Place the smouldering stick on a metal incense holder or in a bowl of sand/rice.",
      "Best burned during morning Vishnu Sahasranama paath or evening aarti.",
      "One stick is enough to perfume a 200 sq ft room for 30+ minutes after burning.",
    ],
    occasions: ["Daily morning bhakti", "Janmashtami, Radhashtami, Govardhan Puja", "Hare Krishna chanting", "Bhagavad Gita paath", "Kirtan & satsang"],
    whyVedicTatva: [
      { title: "Real Temple Flowers", body: "We collect used flowers from temples (which would otherwise be discarded), sun-dry and grind them — closing the sacred cycle." },
      { title: "No Synthetic Musk", body: "True musk is animal-derived (we never use it). Our 'musk' note comes from a proprietary blend of plant essences — 100% cruelty-free." },
      { title: "Hand-Rolled in Bharat", body: "Each stick is hand-rolled by trained artisans in Mathura — supporting traditional incense-makers and rural livelihoods." },
    ],
  },

  // 4. PANCHGAVYA COW GHEE DIYA BATTIS — 150
  {
    slug: "vedic-tatva-panchgavya-cow-ghee-diya-battis-150",
    name: "Vedic Tatva Panchgavya Cow Ghee Diya Battis — 150+ Wicks | Smokeless | Free Brass Diya | Made with Pure Desi Ghee",
    shortName: "Panchgavya Ghee Battis",
    category: "Puja Samagri",
    price: 599,
    mrp: 849,
    stock: 70,
    badge: "Free Brass Diya",
    hsnCode: "34060000",
    weight: "450g",
    image: "/attached_assets/IMG_3509.JPG_1776544579062.jpeg",
    images: ["/attached_assets/IMG_3509.JPG_1776544579062.jpeg"],
    hero: {
      eyebrow: "150+ Battis · Free Brass Diya Inside",
      title: "Panchgavya Cow Ghee Diya Battis",
      subtitle: "Pre-made desi cow ghee battis — light, place on diya, instant divine flame. No spilling, no mess.",
      tag: "Pure Desi Cow Ghee · Smokeless · Long-Burn",
    },
    shortDescription:
      "Pre-made round battis crafted from pure A2 desi cow ghee and Panchgavya. No more spilling oil, no more rolling cotton wicks. Just place a batti on your diya, light it, and offer pure satvik flame to your devatas.",
    highlights: [
      "150+ READY-TO-USE BATTIS — no rolling, no spilling, no mess",
      "PURE A2 DESI COW GHEE — no vegetable ghee, no paraffin",
      "FREE BRASS DIYA INSIDE the jar (worth ₹250)",
      "SMOKELESS BURN — safe for asthma & elderly devotees",
      "20+ MIN BURN per batti — long-lasting divine flame",
    ],
    features: [
      "Quantity: 150+ ready-to-light battis",
      "Burn time: 20–25 mins per batti",
      "Net weight: 450g",
      "Includes: 1 brass diya (free, inside jar)",
      "Type: Panchgavya + cow ghee batti",
      "Ingredients: A2 desi cow ghee, panchgavya, pure cotton wick",
    ],
    ingredients: [
      { name: "A2 Desi Cow Ghee", benefit: "Sacred, satvik fuel — pleases all devatas" },
      { name: "Panchgavya", benefit: "Five sacred substances of cow — purifies the offering" },
      { name: "Pure Cotton Wick", benefit: "Long-staple cotton, no synthetic fibers" },
      { name: "Natural Beeswax", benefit: "Holds shape, no paraffin or chemical binders" },
    ],
    benefits: [
      { title: "Zero Mess Convenience", body: "No more pouring oil from a bottle, no more rolling cotton wicks at 5 AM. Just pop a batti on your diya, light, and your morning puja is ready in 10 seconds." },
      { title: "Highest Punya Offering", body: "Lighting a desi cow ghee diya is shastra-prescribed as the most punya-giving offering — far superior to oil or wax candles." },
      { title: "Smokeless & Safe", body: "Pure cow ghee burns clean — no soot, no smoke, no harsh smell. Safe for elderly parents, children, and asthma sufferers." },
      { title: "Long-Lasting Flame", body: "Each batti burns for 20–25 minutes — perfect for completing your full puja, aarti, or Sundar Kand paath without re-lighting." },
    ],
    usage: [
      "Open the included brass diya and place one batti in the centre.",
      "Light the cotton tip with a matchstick.",
      "Place in front of your puja altar, tulsi plant, or main door (for Diwali/Karthik month).",
      "After it self-extinguishes, the brass diya can be cleaned and reused with a new batti.",
      "For Kartik month, light 1 diya every evening for 30 days for maximum punya.",
    ],
    occasions: ["Daily morning & evening aarti", "Diwali, Karthik Purnima, Dev Uthani Ekadashi", "Lakshmi puja, Satyanarayan katha", "Tulsi vivah", "Akhanda jyot for festivals"],
    whyVedicTatva: [
      { title: "Verified A2 Desi Cow Ghee", body: "Sourced from Gir cow ghoshalas in Gujarat — bilona-method ghee, lab-tested for A2 protein content. Never adulterated with vegetable ghee." },
      { title: "Free Brass Diya (₹250 value)", body: "Every jar includes a hand-polished brass diya — so you can start lighting battis the moment your order arrives." },
      { title: "Eco-Friendly Glass Jar", body: "Reusable airtight glass jar keeps battis fresh for 12+ months. No plastic, no aluminium foil — pure satvik packaging." },
    ],
  },

  // 5. BHIMSENI KAPOOR
  {
    slug: "vedic-tatva-divya-bhimseni-kapoor-400g",
    name: "Vedic Tatva Divya Bhimseni Kapoor — Pure Sublimating Camphor | 400g | Aarti, Hawan, Air Purification",
    shortName: "Bhimseni Kapoor",
    category: "Puja Samagri",
    price: 399,
    mrp: 599,
    stock: 120,
    badge: "Pure 99%",
    hsnCode: "29142100",
    weight: "400g",
    image: "/attached_assets/product_images/product_70_img1.png",
    images: [
      "/attached_assets/product_images/product_70_img1.png",
      "/attached_assets/product_images/product_70_img2.png",
      "/attached_assets/product_images/product_70_img3.png",
      "/attached_assets/product_images/product_70_img4.png",
    ],
    hero: {
      eyebrow: "99% Pure Sublimating Camphor",
      title: "Divya Bhimseni Kapoor",
      subtitle: "Real Bhimseni-grade camphor — sublimates completely, leaves no residue, ideal for aarti & havan.",
      tag: "99% Pure · Lab-Tested · 400g Value Pack",
    },
    shortDescription:
      "Authentic Bhimseni Kapoor — distilled from natural camphor laurel resin (not synthetic). Sublimates fully when burnt, leaving zero residue. Used in every aarti, havan, and air-purification ritual across Bharat.",
    highlights: [
      "99% PURE BHIMSENI GRADE — not cheap synthetic camphor",
      "ZERO RESIDUE: Sublimates completely when burnt",
      "400g VALUE PACK — lasts a typical home 6+ months",
      "ESSENTIAL FOR AARTI: Light at the end of every aarti for purnaahuti",
      "AYURVEDIC USES: Air purification, sinus relief, anti-bacterial",
    ],
    features: [
      "Net weight: 400g",
      "Purity: 99% (lab certified)",
      "Form: Crystalline tablets",
      "Type: Bhimseni-grade sublimating camphor",
      "Origin: Distilled from natural camphor laurel (Cinnamomum camphora)",
    ],
    ingredients: [
      { name: "Natural Camphor Laurel Resin", benefit: "Sublimating compound, no chemical synthesis" },
      { name: "Zero Additives", benefit: "No fillers, no synthetic camphor, no waxes" },
    ],
    benefits: [
      { title: "Completes Every Aarti", body: "The final offering of an aarti is kapoor-jyot. Burning Bhimseni kapoor at the end is shastra-prescribed and brings the puja to its energetic peak." },
      { title: "Removes Negative Energies", body: "Burning kapoor is the most powerful and immediate way to dispel evil eye (nazar), negative entities, and ancestral doshas from your home." },
      { title: "Air Purification & Sinus Relief", body: "Camphor vapours are scientifically proven to kill airborne bacteria, clear blocked sinuses, and ease respiratory congestion." },
      { title: "Wards Off Insects Naturally", body: "Place 2-3 tablets in your wardrobe, kitchen, or bookshelves — keeps moths, silverfish, and ants away naturally without chemicals." },
    ],
    usage: [
      "Place 2–3 kapoor tablets in your aarti diya plate.",
      "Light with a matchstick at the end of your morning or evening aarti.",
      "Rotate the burning kapoor 7 times in front of the deity (clockwise).",
      "Allow the kapoor to fully sublimate — no residue should remain.",
      "For hawan: add 4–5 tablets to the fire at intervals during the ritual.",
    ],
    occasions: ["Daily morning & evening aarti", "Havan, Yagya, Rudrabhishek", "Diwali, Navratri, Janmashtami", "Air purification (post-illness)", "Eclipse cleansing rituals"],
    whyVedicTatva: [
      { title: "True Bhimseni Grade", body: "Most market camphor is synthetic (made from turpentine oil). Ours is real Bhimseni — distilled from camphor laurel tree resin, lab-tested at 99% purity." },
      { title: "Zero Residue Guarantee", body: "If even 1g of residue remains after burning, we will refund your full order. That's how confident we are in our purity." },
      { title: "Airtight 400g Value Pack", body: "Vacuum-sealed glass jar prevents kapoor from evaporating in storage — your full 400g stays potent for 12+ months." },
    ],
  },

  // 6. FRESH FLOWERS — NOIDA MONTHLY SUBSCRIPTION
  {
    slug: "vedic-tatva-fresh-puja-flowers-noida-monthly",
    name: "Vedic Tatva Fresh Puja Flowers — Daily Doorstep Delivery | Monthly Subscription | Noida Only",
    shortName: "Fresh Flowers (Noida Monthly)",
    category: "Puja Samagri",
    price: 1499,
    mrp: 2100,
    stock: 50,
    badge: "Noida Only",
    hsnCode: "06031900",
    weight: "Fresh daily delivery",
    image: "/attached_assets/generated_images/puja_flowers_thali.png",
    images: ["/attached_assets/generated_images/puja_flowers_thali.png"],
    region: "Noida (Sectors 1-150)",
    hero: {
      eyebrow: "Noida Only · Monthly Subscription",
      title: "Fresh Puja Flowers Daily",
      subtitle: "Hand-picked fresh marigold, rose, mogra & tulsi delivered to your doorstep before 6 AM — every single day for 30 days.",
      tag: "Doorstep · Before 6 AM · 30-Day Subscription",
    },
    shortDescription:
      "Wake up to fresh puja flowers at your door — every day. Our Noida-only daily subscription delivers a hand-picked mix of marigold, rose, mogra, and tulsi leaves before 6 AM, so your morning puja is always blessed with the freshest offerings.",
    highlights: [
      "DAILY DOORSTEP DELIVERY before 6 AM, every day for 30 days",
      "NOIDA ONLY: Sectors 1-150 (covers all major residential pockets)",
      "FRESH MIX: Marigold, rose, mogra, tulsi leaves — temple-grade quality",
      "150-200g per day — enough for a 4-deity household altar",
      "PAUSE OR CANCEL ANYTIME via WhatsApp",
    ],
    features: [
      "Quantity: 150–200g fresh flowers per day × 30 days",
      "Delivery time: Before 6 AM, daily",
      "Service area: Noida (Sectors 1-150) — Greater Noida coming soon",
      "Mix: Marigold (genda), rose (gulab), mogra/jasmine, tulsi leaves",
      "Sourced from: Local Noida flower farms (no cold-storage flowers)",
      "Subscription: Auto-renews monthly; pause/cancel anytime",
    ],
    ingredients: [
      { name: "Marigold (Genda)", benefit: "Most auspicious — favourite of Lakshmi & Hanuman" },
      { name: "Rose (Gulab)", benefit: "Sacred to Lalita Tripurasundari & Krishna" },
      { name: "Mogra / Jasmine", benefit: "Beloved by Lord Vishnu & Devi" },
      { name: "Tulsi Leaves", benefit: "Most sacred — essential for Vishnu/Krishna puja" },
      { name: "Bel Patra (when in season)", benefit: "Mandatory for Shiva puja & Mondays" },
    ],
    benefits: [
      { title: "Never Run Out of Puja Flowers", body: "No more 5 AM mad rush to the local mandi. Wake up, open your door, and your day's puja flowers are waiting in a clean cotton bag." },
      { title: "Always Fresh, Same-Day Picked", body: "Our flowers are picked from local Noida farms the previous evening — never cold-stored, never week-old. Bhagavan deserves fresh offerings." },
      { title: "Perfect Daily Mix", body: "Each pack includes the right mix for a typical 4-deity household altar — saves you the guesswork." },
      { title: "Support Local Farmers", body: "Your subscription directly supports 12+ small flower farmer families in Noida & Dadri." },
    ],
    usage: [
      "Sign up for the 30-day subscription at checkout.",
      "Share your full Noida address + WhatsApp number.",
      "Daily deliveries begin from the next morning, before 6 AM.",
      "Empty the cotton bag onto your puja thali and use throughout the day.",
      "The cotton bag is reusable — return it during the next delivery.",
      "Pause for travel or cancel anytime via WhatsApp (+91 99999 99999).",
    ],
    occasions: ["Daily morning puja", "Tulsi puja (every evening)", "Mondays (Shiva — bel patra)", "Tuesdays (Hanuman — marigold)", "Festival weeks (Navratri, Diwali, Janmashtami)"],
    whyVedicTatva: [
      { title: "Same-Day Picked, Never Stored", body: "Most online flower services use 2-3 day old cold-stored flowers. Ours are picked from local Noida farms the previous evening — guaranteed fresh." },
      { title: "Before 6 AM Delivery", body: "Our delivery riders start at 4 AM so your flowers arrive before your morning puja — not after, like other services." },
      { title: "Pause Anytime, No Lock-In", body: "Travelling for Diwali? Just WhatsApp us — we pause your subscription at no cost. No annoying contracts." },
    ],
  },
];

// =============================================================================
// A+ HTML BUILDER  — temple-themed, brand-consistent
// =============================================================================
function buildAplusHtml(item: PujaItem): string {
  const ingredientsHtml = item.ingredients
    .map(
      (ing) => `
    <div style="background:#fff;border:1px solid ${BRAND.gold}33;border-radius:8px;padding:16px;text-align:left;">
      <div style="font-family:Georgia,serif;color:${BRAND.maroon};font-size:15px;font-weight:bold;margin-bottom:6px;">${ing.name}</div>
      <div style="font-family:Arial,sans-serif;color:${BRAND.mutedText};font-size:13px;line-height:1.55;">${ing.benefit}</div>
    </div>`
    )
    .join("");

  const benefitsHtml = item.benefits
    .map(
      (b, i) => `
    <div style="background:#fff;border-top:3px solid ${BRAND.gold};border-radius:0 0 8px 8px;padding:24px 22px;text-align:left;box-shadow:0 1px 3px rgba(0,0,0,0.04);">
      <div style="font-family:Georgia,serif;color:${BRAND.gold};font-size:11px;letter-spacing:2px;margin-bottom:8px;">BENEFIT 0${i + 1}</div>
      <h3 style="font-family:Georgia,serif;color:${BRAND.maroon};font-size:18px;margin:0 0 10px;font-weight:normal;">${b.title}</h3>
      <p style="font-family:Arial,sans-serif;color:${BRAND.mutedText};font-size:14px;line-height:1.65;margin:0;">${b.body}</p>
    </div>`
    )
    .join("");

  const usageHtml = item.usage
    .map(
      (step, i) => `
    <div style="display:flex;align-items:flex-start;gap:14px;margin-bottom:14px;">
      <div style="flex-shrink:0;width:30px;height:30px;border-radius:50%;background:${BRAND.gold};color:${BRAND.maroonDark};display:flex;align-items:center;justify-content:center;font-family:Georgia,serif;font-weight:bold;font-size:14px;">${i + 1}</div>
      <div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.65;color:${BRAND.darkText};padding-top:5px;">${step}</div>
    </div>`
    )
    .join("");

  const occasionsHtml = item.occasions
    .map(
      (o) => `<span style="display:inline-block;background:${BRAND.cream};border:1px solid ${BRAND.gold}55;color:${BRAND.maroon};font-family:Georgia,serif;font-size:13px;padding:6px 14px;border-radius:999px;margin:4px 4px 4px 0;">✦ ${o}</span>`
    )
    .join("");

  const whyHtmlFixed = item.whyVedicTatva
    .map(
      (w) =>
        `<div style="background:rgba(255,255,255,0.06);border-top:2px solid ${BRAND.gold};padding:22px 20px;border-radius:6px;text-align:center;">
          <h3 style="font-family:Georgia,serif;color:${BRAND.gold};font-size:16px;margin:0 0 12px;">${w.title}</h3>
          <p style="font-family:Arial,sans-serif;font-size:13px;color:#f3e9d2;line-height:1.6;margin:0;">${w.body}</p>
        </div>`
    )
    .join("");

  return `
<div style="max-width:980px;margin:0 auto;font-family:Arial,sans-serif;color:${BRAND.darkText};background:${BRAND.cream};border-radius:12px;overflow:hidden;">

  <!-- HERO BANNER -->
  <div style="position:relative;padding:48px 32px;text-align:center;background:linear-gradient(135deg,${BRAND.maroon} 0%,${BRAND.maroonDark} 100%);color:#fff;">
    <div style="font-family:Georgia,serif;color:${BRAND.gold};font-size:12px;letter-spacing:3px;margin-bottom:14px;">✦ ${item.hero.eyebrow.toUpperCase()} ✦</div>
    <h1 style="font-family:Georgia,serif;font-size:34px;font-weight:normal;margin:0 0 14px;color:#fff;line-height:1.25;">${item.hero.title}</h1>
    <p style="font-family:Georgia,serif;font-style:italic;font-size:16px;color:#f3e9d2;max-width:680px;margin:0 auto 20px;line-height:1.55;">${item.hero.subtitle}</p>
    <div style="display:inline-block;background:${BRAND.gold};color:${BRAND.maroonDark};font-family:Georgia,serif;font-size:12px;font-weight:bold;letter-spacing:1.5px;padding:8px 20px;border-radius:999px;">${item.hero.tag}</div>
  </div>

  <!-- INTRO STORY -->
  <div style="padding:40px 32px;background:#fff;">
    <p style="font-family:Georgia,serif;font-size:17px;line-height:1.7;color:${BRAND.darkText};text-align:center;max-width:760px;margin:0 auto;">
      ${item.shortDescription}
    </p>
  </div>

  <!-- INGREDIENTS / WHAT'S INSIDE -->
  <div style="padding:40px 32px;background:${BRAND.cream};">
    <div style="text-align:center;margin-bottom:28px;">
      <div style="font-family:Georgia,serif;color:${BRAND.gold};font-size:11px;letter-spacing:3px;margin-bottom:6px;">SACRED INGREDIENTS</div>
      <h2 style="font-family:Georgia,serif;color:${BRAND.maroon};font-size:26px;margin:0;font-weight:normal;">Crafted With Sacred &amp; Natural Ingredients</h2>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px;max-width:880px;margin:0 auto;">
      ${ingredientsHtml}
    </div>
  </div>

  <!-- BENEFITS -->
  <div style="padding:40px 32px;background:#fff;">
    <div style="text-align:center;margin-bottom:28px;">
      <div style="font-family:Georgia,serif;color:${BRAND.gold};font-size:11px;letter-spacing:3px;margin-bottom:6px;">DIVINE BENEFITS</div>
      <h2 style="font-family:Georgia,serif;color:${BRAND.maroon};font-size:26px;margin:0;font-weight:normal;">Why Devotees Across Bharat Trust This</h2>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:18px;max-width:920px;margin:0 auto;">
      ${benefitsHtml}
    </div>
  </div>

  <!-- HOW TO USE -->
  <div style="padding:40px 32px;background:${BRAND.cream};">
    <div style="text-align:center;margin-bottom:28px;">
      <div style="font-family:Georgia,serif;color:${BRAND.gold};font-size:11px;letter-spacing:3px;margin-bottom:6px;">VEDIC VIDHI</div>
      <h2 style="font-family:Georgia,serif;color:${BRAND.maroon};font-size:26px;margin:0;font-weight:normal;">How to Use</h2>
    </div>
    <div style="max-width:720px;margin:0 auto;background:#fff;border-left:4px solid ${BRAND.gold};padding:28px 32px;border-radius:0 8px 8px 0;">
      ${usageHtml}
    </div>
  </div>

  <!-- BEST FOR / OCCASIONS -->
  <div style="padding:40px 32px;background:#fff;text-align:center;">
    <div style="font-family:Georgia,serif;color:${BRAND.gold};font-size:11px;letter-spacing:3px;margin-bottom:8px;">BEST FOR</div>
    <h2 style="font-family:Georgia,serif;color:${BRAND.maroon};font-size:24px;margin:0 0 22px;font-weight:normal;">Sacred Occasions &amp; Daily Rituals</h2>
    <div style="max-width:720px;margin:0 auto;">${occasionsHtml}</div>
  </div>

  <!-- WHY VEDIC TATVA -->
  <div style="padding:42px 32px;background:linear-gradient(135deg,${BRAND.maroon} 0%,${BRAND.maroonDark} 100%);">
    <div style="text-align:center;margin-bottom:28px;">
      <div style="font-family:Georgia,serif;color:${BRAND.gold};font-size:11px;letter-spacing:3px;margin-bottom:8px;">THE VEDIC TATVA DIFFERENCE</div>
      <h2 style="font-family:Georgia,serif;color:#fff;font-size:24px;margin:0;font-weight:normal;">Why Choose Vedic Tatva</h2>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:18px;max-width:880px;margin:0 auto;">
      ${whyHtmlFixed}
    </div>
  </div>

  <!-- CLOSING SANSKRIT BLESSING -->
  <div style="padding:32px;background:${BRAND.cream};text-align:center;border-top:1px solid ${BRAND.gold}33;">
    <div style="font-family:Georgia,serif;color:${BRAND.maroon};font-style:italic;font-size:18px;margin-bottom:6px;">॥ ॐ शान्तिः शान्तिः शान्तिः ॥</div>
    <div style="font-family:Arial,sans-serif;color:${BRAND.mutedText};font-size:12px;letter-spacing:1px;">May this sacred offering bring peace, prosperity &amp; divine blessings to your home</div>
  </div>

</div>`.trim();
}

// =============================================================================
// SEED FUNCTION  — idempotent UPSERT by slug
// =============================================================================
export async function seedPujaAplusProducts() {
  console.log("Seeding Puja Samagri A+ products (upsert by slug)...");

  let inserted = 0;
  let updated = 0;

  for (const item of ITEMS) {
    const richDescription = buildAplusHtml(item);

    const description =
      `<p><b>${item.shortName}</b> — ${item.shortDescription}</p>` +
      (item.region ? `<p><b>Service area:</b> ${item.region}</p>` : "") +
      `<p><b>What's inside:</b> ${item.ingredients.map((i) => i.name).join(" · ")}</p>`;

    const row = {
      name: item.name,
      description,
      price: item.price,
      stock: item.stock,
      category: item.category,
      image: item.image,
      images: item.images,
      badge: item.badge ?? "New",
      salesCount: 0,
      highlights: item.highlights,
      features: item.features,
      richDescription,
      aplusEnabled: true,
      slug: item.slug,
      gstPercent: 18,
      hsnCode: item.hsnCode,
      productType: "product",
      ...(item.variations
        ? { variations: JSON.stringify(item.variations) }
        : {}),
    };

    const existing = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.slug, item.slug))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(products)
        .set(row)
        .where(eq(products.id, existing[0].id));
      updated++;
    } else {
      await db.insert(products).values(row);
      inserted++;
    }
  }

  console.log(
    `Puja A+: ${inserted} inserted, ${updated} updated (total ${ITEMS.length}).`
  );
}

// Server-side mirror of the curated /shop/:slug landing meta + FAQs.
// Mirrors client/src/data/category-content.ts so the SSR head-injection
// middleware can emit BreadcrumbList + FAQPage + ItemList JSON-LD without
// having to bundle the full editorial copy on the server.
// Keep this file in sync when adding a category to the client data.

export type CategoryFaqHead = { q: string; a: string };

export type CategoryHead = {
  category: string;
  metaTitle: string;
  metaDescription: string;
  faqs: CategoryFaqHead[];
};

// Mirror of CATEGORY_SLUG_ALIASES on the client. Keep in sync.
export const CATEGORY_SLUG_ALIASES: Record<string, string> = {
  malas: "wearables",
  bracelets: "wearables",
  yantras: "wearables",
  murtis: "idols",
  brass: "brass-copperware",
  copperware: "brass-copperware",
  "puja-essentials": "puja-samagri",
  samagri: "puja-samagri",
  "gem-stones": "gemstones",
  navaratna: "gemstones",
};

export function resolveCategorySlug(slug: string): string {
  return CATEGORY_SLUG_ALIASES[slug] || slug;
}

export const CATEGORY_HEAD: Record<string, CategoryHead> = {
  rudraksha: {
    category: "Rudraksha",
    metaTitle: "Buy Original Rudraksha Online — Lab Certified Nepal & Indonesian Beads | Vedic Tatva",
    metaDescription: "Shop genuine Rudraksha beads from Nepal and Indonesia — every bead X-ray verified, lab certified, energised by pandits. 1 mukhi to 21 mukhi, malas, bracelets and rare beads with free Pan-India delivery.",
    faqs: [
      { q: "How do I know the Rudraksha is genuine?", a: "Every Rudraksha we ship is X-ray verified — the X-ray plate clearly shows the natural internal compartments matching the external mukhi count. Premium beads include a third-party lab certificate from a gemological lab in Jaipur or Mumbai." },
      { q: "Which mukhi Rudraksha should I wear?", a: "Five-mukhi is the safe, universal choice. For specific intentions — wealth (7), courage (11), leadership (12), couple harmony (Gauri-Shankar) — choose accordingly. Free pandit consultation on chat uses your janma rashi to recommend the right bead." },
      { q: "Can women wear Rudraksha?", a: "Yes — there is no shastric restriction. The Skanda Purana and Devi Bhagavatam explicitly mention women wearing Rudraksha. Traditional advice is to remove the mala during the menstrual cycle." },
      { q: "Will the Rudraksha I receive be energised?", a: "Yes. Every bead is pranapratishthit at our Banaras workshop with the appropriate beej mantra on a Monday or Shiva tithi before dispatch. A small certificate of energisation ships with the bead." },
      { q: "How do I care for my Rudraksha mala?", a: "Bathe it in raw cow milk and clean water twice a year, on a Monday. Avoid soap, perfume and chemical contact. With basic care, a Rudraksha lasts decades — many family heirlooms are over a hundred years old." },
    ],
  },
  "puja-samagri": {
    category: "Puja Samagri",
    metaTitle: "Buy Puja Samagri Online — Roli, Kumkum, Camphor, Akshat | Vedic Tatva",
    metaDescription: "Complete puja samagri kits and individual items — natural roli, organic kumkum, camphor, akshat, supari, gangajal, panchamrit. Lab-tested purity, pan-India delivery, COD available.",
    faqs: [
      { q: "Are your samagri items food-grade and natural?", a: "Yes — every item is sourced from certified producers, lab-tested for adulteration and packaged in food-grade material. Roli is natural turmeric+lime, kumkum is plant-based, akshat is unbroken basmati rice." },
      { q: "What is the shelf life of puja samagri?", a: "Dry items (roli, kumkum, akshat, supari) keep 2 years in airtight containers. Camphor keeps 3 years. Ghee keeps 6 months refrigerated. Each pouch carries a manufacture date and best-before." },
      { q: "Do you ship gangajal in glass bottles?", a: "Yes — sourced from Haridwar/Rishikesh in food-grade sealed glass bottles. Each bottle has tamper-evident seal and an attestation from the local pandit committee." },
      { q: "What is included in a daily puja kit?", a: "Roli, kumkum, akshat, agarbatti, kapur, dhoop, ghee diya wicks, supari, fresh red cloth, panchamrit packet and a printed daily aarti booklet — enough for 30 days of puja." },
      { q: "Can I order custom samagri for specific pujas?", a: "Yes — we have ready kits for Satyanarayan, Lakshmi puja, Navratri, Ganesh Chaturthi, Mahashivaratri, Shradh, Griha Pravesh and many more. Custom requirements: email us with your pandit's list." },
    ],
  },
  idols: {
    category: "Idols",
    metaTitle: "Buy Hindu Idols Online — Brass, Panchaloha, Marble & Pure Clay Murtis | Vedic Tatva",
    metaDescription: "Hand-crafted brass, panchaloha and marble idols of Ganesha, Lakshmi, Shiva, Krishna, Hanuman, Durga and more. Shilpa-shastra-compliant proportions, energised murtis, free Pan-India shipping.",
    faqs: [
      { q: "Are your idols shilpa-shastra compliant?", a: "Yes — every idol follows the proportions, mudras and aayudha (held weapons/objects) prescribed by the Manasara, Mayamatam and Vishnudharmottara Purana. Our shilpis are trained in traditional gurukuls." },
      { q: "What is panchaloha?", a: "Panchaloha is a five-metal alloy — gold, silver, copper, brass and tin — prescribed by the Agama Shastra for temple-grade idols. It is considered the most spiritually conductive metal for daily abhishekam." },
      { q: "Do you energise the idols before dispatch?", a: "Yes — every murti undergoes prana-pratishtha by Brahmin pandits at our Banaras workshop on the deity's specific day with the prescribed mantras. A certificate of energisation ships with each idol." },
      { q: "What size idol is appropriate for a home altar?", a: "Sit-down altars: 4-6 inch idols. Standing temple shrines: 8-12 inch. Larger idols (15 inch+) are for dedicated puja rooms. Per shastra, the height of the idol should not exceed 12 fingers (about 9 inches) for daily home worship." },
      { q: "How should I dispose of a broken idol?", a: "Per shastra, a chipped or broken idol should not be worshipped. Immerse it respectfully in flowing river water (visarjan) or bury it under a peepal or banyan tree with a brief Vedic chant. We replace any idol broken in transit free of charge." },
    ],
  },
  "havan-samagri": {
    category: "Havan Samagri",
    metaTitle: "Buy Havan Samagri Online — Pure Yajna Wood, Ghee, Herbs | Vedic Tatva",
    metaDescription: "Authentic havan samagri — natural mango/peepal samidha wood, A2 cow ghee, herbal mixtures, kapur, pure havan kund. Lab tested, no chemical fragrances. Ideal for Rudra Yagna, Navagraha Havan, Griha Shanti.",
    faqs: [
      { q: "What wood is used for havan?", a: "Mango (aam), peepal, palash, banyan, sandalwood and bilva — all listed in the Yajurveda. Our samidha is sun-dried for 6 months, hand-cut to 8-inch sticks and free of resin or paint." },
      { q: "Is the ghee A2 cow ghee?", a: "Yes — pure desi A2 ghee from Gir, Sahiwal and Tharparkar cows, hand-churned (bilona method) by farmer co-operatives in Gujarat. Lab-tested for purity, no vegetable oil blending." },
      { q: "How much samagri do I need for one havan?", a: "A small home havan (1-1.5 hour, 108 ahutis) needs ~250g samagri mixture, 250ml ghee and 12-15 samidha sticks. Our 'Standard Havan Kit' bundles exactly this." },
      { q: "Are the herbal ingredients organic?", a: "Yes — guggul, jata-mansi, sandalwood powder, camphor and the 28 herbs in our Maha-Yajna mixture are all sourced from certified organic farms in Uttarakhand and tested for purity." },
      { q: "Can I do havan in my apartment?", a: "Yes — use our compact copper havan kund (8 inch) on a fire-safe slab, near an open window. Burn for under 90 minutes, use unscented samagri, keep ventilation on. We include a safety guide with every kit." },
    ],
  },
  wearables: {
    category: "Wearables",
    metaTitle: "Energised Malas, Bracelets & Yantra Lockets Online | Vedic Tatva",
    metaDescription: "108-bead japa malas, healing crystal bracelets, energised yantra lockets and rakshasutra. Lab-tested gemstones, shastra-correct stringing, free pandit consultation.",
    faqs: [
      { q: "Why 108 beads in a mala?", a: "108 is the most sacred number in Sanatana Dharma — 12 zodiac signs × 9 grahas, 27 nakshatras × 4 padas, the distance from sun to earth as 108 sun-diameters. The Brihadaranyaka Upanishad lists 108 names of Brahman." },
      { q: "Which mala for which mantra?", a: "Tulsi for Vishnu/Krishna mantras, Rudraksha for Shiva mantras, sphatik (crystal) for any mantra, sandalwood for Devi mantras, lotus seed for Lakshmi sadhana." },
      { q: "Are your bracelets energised?", a: "Yes — every bracelet is pranapratishthit with the corresponding stone's beej mantra by our pandits at the Banaras workshop. A certificate of energisation ships with each bracelet." },
      { q: "How do I cleanse a crystal bracelet?", a: "Once a month: rinse in clean water, rub with sea salt, leave under moonlight on a Purnima night. Never use chemical cleaners. After cleansing, re-energise with 21 mantra recitations." },
      { q: "Can I wear multiple bracelets together?", a: "Yes, but pair compatible energies — Saturn (blue sapphire/amethyst) + Jupiter (yellow sapphire/citrine) is a powerful career combination. Avoid mixing strongly opposing planets (e.g. Saturn + Sun) without astrologer advice." },
    ],
  },
  "dhoti-kurta": {
    category: "Dhoti & Kurta",
    metaTitle: "Buy Dhoti Kurta Sets Online — Pure Cotton & Silk Puja Wear | Vedic Tatva",
    metaDescription: "Pure cotton and silk dhoti kurta sets — shastra-pure white, cream and saffron, with traditional border designs. Ideal for puja, havan, weddings and temple visits. Free Pan-India delivery.",
    faqs: [
      { q: "What dhoti length do I need?", a: "Daily wear and most puja: 4 metres. Elaborate wedding wraps: 4.5 metres. South Indian eight-pleat panchakaccham style: 5 metres." },
      { q: "Are your kurtas pre-shrunk?", a: "Yes — cotton kurtas are pre-washed in hot water before stitching to remove residual shrinkage. Order your normal chest size confidently." },
      { q: "Which colour for which puja?", a: "White/cream for daily puja and shradh. Saffron for Shiva/Hanuman puja. Red/maroon for Devi puja. Yellow for Vishnu/Krishna. Avoid black for any auspicious occasion." },
      { q: "Do you offer custom tailoring?", a: "Yes — for orders above ₹3,500. Email measurements (chest, shoulder, kurta length, sleeve length) within 24 hours of placing. Adds 7-10 days to delivery." },
      { q: "How do I wash a silk kurta?", a: "Dry-clean only for the first 3-4 wears. After that, gentle hand-wash in cold water with mild neutral soap. Air-dry in shade. Iron on low heat with a cotton cloth shield." },
    ],
  },
  "brass-copperware": {
    category: "Brass & Copperware",
    metaTitle: "Brass Diyas, Copper Kalash, Bells & Panchapatra Online | Vedic Tatva",
    metaDescription: "Hand-crafted brass and copper puja items from Banaras — diyas, panchapatra, kalash, ghanti, thali, lota, abhishekam patras. Pure metal, traditional designs, free delivery.",
    faqs: [
      { q: "Is your copper pure or coated?", a: "Pure 99.5% copper — never tin-coated, never lacquer-coated. Tested every batch with chemical assay. Has the orange-red colour of authentic tamba." },
      { q: "How do I clean a tarnished brass diya?", a: "Tamarind pulp + salt paste, soft cloth, hot water rinse, dry. For heavy tarnish use Pitambari paste. Avoid steel wool. Re-clean every 1-2 months." },
      { q: "Can I drink water from a copper lota daily?", a: "Yes — Ayurveda recommends storing water in copper overnight (8 hours+) and drinking the tamra-jal in the morning. Aids digestion, balances doshas. One lota per day is the recommended quantity." },
      { q: "Are the bells (ghanti) tuned?", a: "Yes — hand-tuned to the 'Om' tone (~432 Hz fundamental). The shastra requires sustained, deep tone free of metallic clang. Each bell is tested before dispatch." },
      { q: "Do you sell large temple-grade brass?", a: "Yes — Temple Grade section has large kalash (up to 5 litres), abhishekam patras, kuttuvilakku and chamara fans. Made on order, lead time 2-4 weeks." },
    ],
  },
  gemstones: {
    category: "Gemstones",
    metaTitle: "Buy Certified Astrological Gemstones Online — Navaratna, Ruby, Yellow Sapphire | Vedic Tatva",
    metaDescription: "Lab-certified natural gemstones for jyotish remedies — ruby, pearl, red coral, emerald, yellow sapphire, diamond, blue sapphire, hessonite, cat's eye. Each stone GIA/IGI tested with mantra energisation.",
    faqs: [
      { q: "Should I wear a gemstone without astrologer consultation?", a: "No. The wrong gemstone can intensify a malefic planet and create the opposite of the intended effect. Free 15-minute jyotish consultation reviews your janma kundli and current dasha to recommend the right stone." },
      { q: "What does 'lab certified' mean?", a: "Each stone ships with a third-party gemological certificate — GIA, IGI, GRS or GJEPC — confirming natural origin, treatment type, weight, colour grade, clarity and origin. Every certificate has a serial number and QR for online verification." },
      { q: "Yellow sapphire vs citrine — what's the difference?", a: "Yellow sapphire (pukhraj) is corundum, hardness 9, ₹15,000-2,00,000 per carat. Citrine (sunela) is quartz, hardness 7, an accepted upratna substitute. Both work for Jupiter — citrine is gentler and needs to be 5+ carats for similar effect." },
      { q: "Is heat treatment acceptable?", a: "Mild traditional heat treatment is acceptable for ruby and sapphire. NOT acceptable: beryllium diffusion, lead-glass filling, oil filling for emeralds beyond 'minor', synthetic, composite or doublet stones. Our certificates state the treatment type." },
      { q: "Why is blue sapphire considered risky?", a: "Blue sapphire (neelam) is ruled by Saturn — fast-acting. We require a 3-day trial: keep the stone under your pillow for 3 nights and observe dreams, mood, sleep and luck. Wear only if all signs are positive. Full refund within 7 days for failed trial." },
      { q: "What is Navaratna?", a: "A single ornament containing all nine planetary stones in a prescribed arrangement — ruby in centre, eight others around. Balances all nine grahas without amplifying any one — the safest 'universal' jyotish ornament. Available as pendant, ring or bracelet." },
    ],
  },
};

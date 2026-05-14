// Per-category editorial content for /shop/:slug landings.
// Renders below the product grid with a FAQ block; FAQ schema is injected
// by shop.tsx via PageSeo. Each block is 400-600 words of unique expert copy.

export type CategoryFaq = { q: string; a: string };

export type CategoryContent = {
  slug: string;            // URL slug (matches SHOP_SLUG_PRESETS)
  category: string;        // exact products.category match
  h1: string;              // SEO H1 — keyword-rich
  metaTitle: string;
  metaDescription: string;
  intro: string;           // 1-2 sentence elevator
  sections: { heading: string; body: string }[]; // long-form copy
  faqs: CategoryFaq[];     // 5-8 FAQs
};

export const CATEGORY_CONTENT: Record<string, CategoryContent> = {
  rudraksha: {
    slug: "rudraksha",
    category: "Rudraksha",
    h1: "Original Rudraksha Beads Online — 1 Mukhi to 21 Mukhi",
    metaTitle: "Buy Original Rudraksha Online — Lab Certified Nepal & Indonesian Beads | Vedic Tatva",
    metaDescription: "Shop genuine Rudraksha beads from Nepal and Indonesia — every bead X-ray verified, lab certified, energised by pandits. 1 mukhi to 21 mukhi, malas, bracelets and rare beads with free Pan-India delivery.",
    intro: "Authentic Rudraksha beads, each one X-ray verified, lab certified and energised with the appropriate beej mantra before it ships from our Banaras workshop.",
    sections: [
      {
        heading: "What Rudraksha is and why devotees wear it",
        body: "Rudraksha (literally 'the tear of Rudra') is the seed of the Elaeocarpus ganitrus tree, traditionally sourced from the foothills of Nepal and the highlands of Indonesia and Java. Sacred texts including the Shiva Purana, Padma Purana and Devi Bhagavatam describe Rudraksha as a direct gift of Mahadeva — said to carry the vibrational signature of a particular deity depending on the number of natural faces (mukhi) on the bead. Wearers across centuries — sadhus on the banks of the Ganga, kings in Vedic courts, modern householders managing busy lives — have used Rudraksha for protection, mental clarity, blood-pressure balance and anchored meditation. Modern bio-electric studies at the Bombay Hospital and the Indian Institute of Technology have measured small but reproducible changes in heart-rate variability and skin conductance among wearers, lending a careful scientific footnote to a tradition that is, first, a matter of faith and shastra.",
      },
      {
        heading: "Choosing the right mukhi for you",
        body: "Each mukhi corresponds to a specific deity and intention. Five-mukhi is the universal bead — sacred to Kalagni Rudra, recommended for everyone and the standard bead used in 108-bead japa malas. Six-mukhi belongs to Kartikeya and supports willpower and learning. Seven-mukhi is the Mahalakshmi bead, worn for prosperity and removal of poverty. Eleven-mukhi (Hanuman) is for courage and victory over fear; twelve-mukhi (Surya) for leadership and confidence. The rare one-mukhi, fourteen-mukhi and Gauri-Shankar (two beads naturally joined) are reserved for serious sadhakas and are always shipped with provenance documentation. If you are unsure, our pandit team is available on chat to recommend a bead based on your birth chart and current life-stage.",
      },
      {
        heading: "How to wear and care for a Rudraksha",
        body: "On a Monday or any Shiva-related day (Pradosham, Shivaratri, the lunar fourteenth), bathe the bead in raw cow milk, then in clean water, dry it on cotton cloth and chant 'Om Namah Shivaya' 108 times. Thread it on red or black silk, on copper, silver or gold — never on artificial fibre. Wear it close to the skin for the strongest contact; remove it only during impure conditions (sleep on a non-cotton bed, intimate situations, attending a death rite). Re-energise the bead twice a year by repeating the milk bath and mantra cycle. Real Rudraksha is sturdy — it survives boiling water and pressure tests — so be wary of any bead that softens, dyes or splits unnaturally.",
      },
    ],
    faqs: [
      { q: "How do I know the Rudraksha is genuine?", a: "Every Rudraksha we ship is X-ray verified — the X-ray plate clearly shows the natural internal compartments (chambers) matching the external mukhi count. We include the X-ray image and a third-party lab certificate (gemological lab in Jaipur or Mumbai) with every premium bead. Beads are also tested by the traditional copper-coin rotation method before dispatch." },
      { q: "Which mukhi Rudraksha should I wear?", a: "Five-mukhi is the safe, universal choice and what most wearers begin with. For specific intentions — wealth (7), courage (11), leadership (12), couple harmony (Gauri-Shankar) — choose accordingly. We offer a free pandit consultation on chat that uses your janma rashi to recommend the right bead." },
      { q: "Can women wear Rudraksha?", a: "Yes — there is no shastric restriction on women wearing Rudraksha. Many texts (Skanda Purana, Devi Bhagavatam) explicitly mention women, including householder women, wearing Rudraksha for spiritual and health benefits. The only traditional advice is to remove the mala during the menstrual cycle." },
      { q: "What is the difference between Nepal and Indonesian Rudraksha?", a: "Nepal beads are larger (16-30 mm), with deep, well-defined mukhi lines and are traditionally considered more powerful for sadhana. Indonesian (Java) beads are smaller (5-15 mm), lighter, more affordable and ideal for mala-making and daily wear. Both are equally authentic — just suited to different uses." },
      { q: "Will the Rudraksha I receive be energised?", a: "Yes. Every bead is pranapratishthit at our Banaras workshop with the appropriate beej mantra (Om Hreem Namah for 5 mukhi, mukhi-specific mantras for others) on a Monday or Shiva tithi before dispatch. A small certificate of energisation ships with the bead." },
      { q: "How do I care for my Rudraksha mala?", a: "Bathe it in raw cow milk and clean water twice a year, on a Monday. Avoid soap, perfume and chemical contact. When not worn, store it on a clean cotton cloth in your puja space. With basic care, a Rudraksha lasts decades — many family heirlooms are over a hundred years old." },
      { q: "Do you offer return on Rudraksha?", a: "Unenergised beads ordered as raw stock can be returned within 7 days unopened. Energised beads are non-returnable per shastric guidance — once pranapratishtha is performed, the bead is bound to the wearer and cannot be transferred." },
    ],
  },

  "puja-samagri": {
    slug: "puja-samagri",
    category: "Puja Samagri",
    h1: "Authentic Puja Samagri Online — Daily & Festival Worship Essentials",
    metaTitle: "Buy Puja Samagri Online — Roli, Kumkum, Camphor, Akshat | Vedic Tatva",
    metaDescription: "Complete puja samagri kits and individual items — natural roli, organic kumkum, camphor, akshat, supari, gangajal, panchamrit. Lab-tested purity, pan-India delivery, COD available.",
    intro: "Every puja samagri item we sell is naturally sourced, hand-tested for purity and packaged in food-grade material so your daily worship begins with absolute sanctity.",
    sections: [
      {
        heading: "Why pure samagri matters",
        body: "Sankalpa, mantra and samagri are the three pillars of any Hindu ritual — a flawed bhava can sometimes be forgiven, a mispronounced mantra carries less weight, but adulterated samagri (synthetic kumkum with chemical dye, plastic-fibre incense, machine-coloured akshat) actively breaks the ritual chain. The Atharva Veda is explicit: 'yat dravyam tat phalam' — the result follows the substance. Vedic Tatva sources roli from natural turmeric and slaked lime (the original recipe), kumkum from saffron-stained turmeric (no synthetic red oxide), camphor from pure Bhimseni (not chemical naphthalene), and akshat from broken-grain-free rice mixed with a pinch of haldi for the traditional yellow tint. Every batch is tested against an in-house purity sheet before it enters the warehouse.",
      },
      {
        heading: "What every puja basket should contain",
        body: "A complete daily puja kit needs roli (vermilion paste), kumkum (red powder), akshat (unbroken yellow rice), haldi (turmeric), chandan (sandalwood paste), camphor, agarbatti, ghee and cotton wicks for the diya, supari (whole betel-nut), elaichi, lavang, paan leaves, panchamrit ingredients (milk, curd, ghee, honey, sugar), gangajal and a small pile of fresh flowers. For festival pujas you add specific samagri — moli (red thread), kalash, coconut, naivedya items, and the deity-specific dravya (bilva for Shiva, durva for Ganesha, tulsi for Vishnu, lotus for Lakshmi). Our ready-made kits — Daily Puja Box, Lakshmi Puja Box, Satyanarayan Box, Griha Pravesh Box, Rudra Abhishek Box — bundle the right items in the right quantities with a printed step-by-step vidhi card in Hindi and English.",
      },
      {
        heading: "Storage, shelf-life and re-ordering",
        body: "Most dry samagri lasts 12-18 months when stored in air-tight glass jars away from sunlight. Camphor evaporates if left open — keep it in the original sealed pack. Wet samagri (chandan paste, panchamrit) should be made fresh on the day of the ritual; we ship the dry components and you mix them with milk or water as needed. Subscribe to our monthly puja samagri box and we'll auto-replenish your kit every month at a 10% discount — so you never run out on a day when you need to perform an unexpected puja.",
      },
    ],
    faqs: [
      { q: "Is your kumkum and roli free of chemical dyes?", a: "Yes. We use only the traditional turmeric-and-slaked-lime recipe for roli and saffron-stained turmeric for kumkum. No synthetic red oxide, no industrial colourants. Every batch is purity-tested and the ingredient list is printed on every pack." },
      { q: "Does the gangajal really come from the Ganga?", a: "Yes. Our gangajal is collected from Har-ki-Pauri Haridwar by registered priests, filtered for visible particulate, sealed in the same copper or glass bottle that ships to you, and certified with a collection-date sticker. We do not 'rebottle' tap water." },
      { q: "What's in your Satyanarayan Puja kit?", a: "The kit contains roli, kumkum, akshat, haldi, chandan, moli, supari (5), elaichi, lavang, panchamrit pack, gangajal, dhoop, agarbatti, kapur, ghee, cotton wicks, paan leaves (when in season), kheer/sheera ingredients (sooji, sugar, ghee, banana, milk powder), 5 fruits selection guide, 1 coconut, kalash with lid, and a printed Satyanarayan Katha book in Hindi/English." },
      { q: "How fresh is the camphor?", a: "We ship Bhimseni camphor (natural, derived from camphor laurel trees) in 25g sealed sachets manufactured within the last 60 days. Bhimseni burns clean, leaves no black residue and is the only kind shastra recommends for aarti. Avoid chemical camphor (made from naphthalene) — it has a bluish flame and toxic fumes." },
      { q: "Can I customise a puja kit?", a: "Yes — for orders above ₹2,000 we will custom-pack a kit per a specific puja vidhi you send us. Email the vidhi or upload a photo of the printed sheet during checkout and our team will assemble accordingly within 48 hours." },
      { q: "Do you ship samagri internationally?", a: "Yes — we ship to USA, UK, Canada, Australia, UAE and Singapore. Some items (fresh flowers, perishable panchamrit ingredients) are excluded for international orders. Camphor cannot be shipped by air to certain countries due to customs rules — check the product page for shipping restrictions." },
      { q: "Is COD available?", a: "Yes, COD is available across India for orders up to ₹5,000. A small ₹49 COD handling fee is added at checkout." },
    ],
  },

  idols: {
    slug: "idols",
    category: "Idols",
    h1: "Hindu God & Goddess Idols Online — Brass, Panchaloha & Marble Murtis",
    metaTitle: "Buy Hindu Idols Online — Brass, Panchaloha, Marble & Pure Clay Murtis | Vedic Tatva",
    metaDescription: "Hand-crafted brass, panchaloha and marble idols of Ganesha, Lakshmi, Shiva, Krishna, Hanuman, Durga and more. Shilpa-shastra-compliant proportions, energised murtis, free Pan-India shipping.",
    intro: "Murtis hand-crafted by traditional Banaras and Kumbakonam artisan families, with shilpa-shastra-correct proportions and optional pranapratishtha before dispatch.",
    sections: [
      {
        heading: "The shastra behind a good murti",
        body: "A murti is not a statue — it is a yantra in form, a vessel into which the consciousness of a deity is invited through pranapratishtha. The Shilpa Shastra and Manasara texts prescribe exact proportions (the navatala system of nine face-units for standing forms, ashtatala for seated), correct posture (sthanaka, sukhasana, padmasana), correct mudras (varada, abhaya, chinmudra), correct ayudhas in each hand and the right vahana. A modern souvenir-shop figurine ignores all of this; the resulting form may be visually pleasant but cannot be properly worshipped. Every murti at Vedic Tatva is reviewed by our shastra desk before listing — proportions, mudras and ayudhas are verified against the Manasara, the Vishnudharmottara Purana and the deity-specific upapuranas.",
      },
      {
        heading: "Brass, panchaloha, ashtadhatu, marble, pure clay — what to choose",
        body: "Brass (peetal) is a copper-zinc alloy, the most affordable, durable, lightweight and ideal for everyday family puja. Panchaloha — gold, silver, copper, brass and lead/tin in shastra-prescribed ratios — is the most recommended material for any energised murti placed permanently in your home shrine; the five-metal combination is said to hold prana most effectively and is the standard for South Indian temple murtis. Ashtadhatu (eight metals — adds iron, mercury and zinc) is rare, reserved for serious tantric and devata installations. White marble is preferred for Krishna, Saraswati and Devi forms because of its soft, luminous quality. Pure clay (mitti) is the only shastric material for a Ganesh murti during Ganesh Chaturthi — visarjan in water completes the ritual. Choose based on the deity, the role of the murti (daily puja vs festival vs decorative) and your budget.",
      },
      {
        heading: "Pranapratishtha and home installation",
        body: "Once a murti enters your home for daily worship, it must be brought to life through pranapratishtha — the formal invitation of the deity into the form. The ritual involves abhishekam (bathing), nyasa (placement of mantric energy in different parts of the body of the murti), the chanting of the mool mantra 108 times, and the offering of naivedya. We can arrange a verified pandit to perform pranapratishtha at your home along with the murti delivery — bookable as an add-on at checkout. Once installed, the murti must receive at least a daily diya, fresh water and a brief mantra; if you cannot maintain this, we recommend choosing a decorative (non-energised) murti instead.",
      },
    ],
    faqs: [
      { q: "Are the proportions of your murtis shastra-compliant?", a: "Yes. Every murti is reviewed against the Manasara, Vishnudharmottara Purana and deity-specific iconography texts before we list it. Proportions, mudras, ayudhas and vahanas are verified. We do not list 'inspired-by' figurines." },
      { q: "Can I get a murti energised before it ships?", a: "Yes — add the pranapratishtha service at checkout (₹501-₹2,100 depending on murti size and deity) and we'll perform the ritual at our Banaras workshop with a verified pandit. The murti ships with a sealed certificate of energisation including the date, tithi and pandit name." },
      { q: "What is the difference between brass, panchaloha and ashtadhatu?", a: "Brass = copper + zinc (affordable, daily puja). Panchaloha = gold + silver + copper + brass + tin in shastra ratio (most recommended for permanent shrine, holds prana well). Ashtadhatu = panchaloha + iron + mercury + lead (rare, tantric uses). Marble is for forms where softness/luminosity is appropriate (Krishna, Saraswati, Devi). Pure clay is only for Ganesh Chaturthi visarjan murtis." },
      { q: "Which Ganesh murti is correct for Ganesh Chaturthi?", a: "Only pure clay (shaadu mitti) — never plaster of paris, never permanently painted. The murti is visarjan-ready: when immersed in water on the final day, it dissolves cleanly without polluting the water body. We sell certified PoP-free, natural-pigment Ganesh murtis with eco-friendly visarjan kits." },
      { q: "How do I install a murti at home?", a: "Place the murti facing east or north in a clean, dedicated puja space (never the bedroom or kitchen). For energised murtis perform pranapratishtha (we can arrange the pandit). Offer a daily diya, agarbatti, fresh water and a brief mantra. Avoid placing two murtis of the same deity in the same shrine." },
      { q: "Do you ship murtis safely?", a: "Yes — every murti is wrapped in red cloth (auspicious tradition), padded with shock-foam, sealed in a double-walled corrugated box and shipped via insured courier. We carry the replacement risk for transit damage; if anything is broken on arrival, send us a photo within 48 hours and we ship a replacement." },
      { q: "Can I return an idol?", a: "Unenergised idols can be returned within 7 days if unused and in original packaging. Energised idols (pranapratishthit) are non-returnable per shastra — once the deity is installed in the form, it cannot be transferred." },
    ],
  },

  "havan-samagri": {
    slug: "havan-samagri",
    category: "Havan Samagri",
    h1: "Pure Havan Samagri Online — 100% Natural Yajna Ingredients",
    metaTitle: "Buy Havan Samagri Online — Pure Yajna Wood, Ghee, Herbs | Vedic Tatva",
    metaDescription: "Authentic havan samagri — natural mango/peepal samidha wood, A2 cow ghee, herbal mixtures, kapur, pure havan kund. Lab tested, no chemical fragrances. Ideal for Rudra Yagna, Navagraha Havan, Griha Shanti.",
    intro: "Pure havan samagri prepared from 32 traditional herbs, mixed in shastra-prescribed proportions and packed within 30 days of preparation for maximum efficacy.",
    sections: [
      {
        heading: "What havan really does",
        body: "Havan (yajna, homam) is the oldest form of Vedic worship — older than murti puja, older even than the formalisation of mantras. The Atharva Veda and the Shatapatha Brahmana describe yajna as the act of returning to the cosmic order: the offering, the fire (Agni — the messenger), the chanted mantra and the deity all come into a single closed loop. Modern microbiology research at the Indian Institute of Sciences and the Defence Institute has shown that the vapours released by a properly conducted havan reduce airborne pathogens (E. coli, S. aureus) by 94% within an hour, and the herbal smoke remains effective for up to 24 hours after the ritual ends. So havan is, simultaneously, a sacred ritual and a thoroughly practical air-purification practice.",
      },
      {
        heading: "What goes into authentic havan samagri",
        body: "A traditional havan samagri mix contains 32 herbs — including jatamansi, brahmi, ashwagandha, tulsi, neem, deodar, agar, gugal, sandalwood (chandan), camphor, lobaan, gulab petals, jata-masi, valerian root, vacha, kushtha, talispatra and the panchaparna leaves. Each herb is dried, sifted, ground to the right particle size and mixed in proportions specified in the Brihat Samhita and the Bodhayana Grihya Sutra. Adulterated samagri replaces the costly ingredients with sawdust and synthetic fragrance — the smoke smells nice but contains no medicinal molecules. Our samagri is tested in a third-party lab for the presence of all 32 herbs (gas chromatography panel) before every batch ships.",
      },
      {
        heading: "Conducting a havan correctly",
        body: "Set up a square or rectangular havan kund (we sell copper, brass and clay kunds) on a level base, oriented so the priest faces east. Build the agni with peepal, mango or palash samidha wood (avoid chemically treated firewood). Light the fire with pure A2 cow ghee and camphor, never with kerosene or diesel. Chant the appropriate sukta (Rudra Sukta for Rudra Havan, Navagraha mantras for Graha Shanti, Sri Sukta for Lakshmi Yagna), and offer a small spoon of samagri with each 'svaha'. End with purnahuti — a final coconut filled with samagri, offered into the fire. Collect the ashes (bhasma) afterwards: smear a little on your forehead, sprinkle the rest in your garden — bhasma is a recognised soil enhancer.",
      },
    ],
    faqs: [
      { q: "How do I know your havan samagri is pure?", a: "Every batch ships with a third-party lab certificate (gas chromatography panel) listing the 32 herbs and confirming no synthetic fragrance, sawdust or filler. We mention the preparation date — samagri is most effective within 6 months of preparation." },
      { q: "What kind of wood (samidha) should I use?", a: "Mango (aam), peepal, banyan (vat), palash (the most sacred), bilva or sandalwood. Avoid construction firewood, plywood scrap, treated timber or coal — they release toxic fumes and are shastrically forbidden. We sell ready-cut samidha bundles in 9-inch lengths." },
      { q: "Is A2 cow ghee really necessary, or will any ghee work?", a: "A2 cow ghee (from indigenous breeds — Gir, Sahiwal, Tharparkar) is what shastra prescribes; the A2 protein profile is what enables clean, smokeless combustion. Buffalo ghee or A1 (foreign-cattle) ghee will work at home for daily diya but is not recommended for serious havan. We sell A2 ghee tested for purity and authenticity." },
      { q: "Can I do a havan in an apartment?", a: "Yes — use a small clay or copper havan kund on a heat-proof tile, ensure good ventilation (open one window), and limit the duration to 20-30 minutes. The smoke is herbal, not toxic, and our samagri is air-purifying. For very small spaces, our 'mini havan' kit comes with a stainless-steel kund and pre-portioned samagri." },
      { q: "What is included in a Navagraha Havan kit?", a: "32-herb havan samagri (250g), nine special grain types (each tied to one graha — wheat for Surya, rice for Chandra, etc.), kushasana mat, mango/peepal samidha bundle, A2 cow ghee (200g), pure camphor, ghrit-kalash, cotton wicks, kapur, paan leaves, betel nut, the Navagraha Mantras booklet (Sanskrit + Hindi/English transliteration) and a 6-inch copper havan kund." },
      { q: "What do I do with the leftover ashes?", a: "Bhasma is sacred. Smear a small pinch on your forehead and the foreheads of family members. Sprinkle the rest in your garden, in a tulsi pot, or in flowing water (river, sea — never a stagnant drain). Never throw bhasma in the trash." },
      { q: "Do you arrange a pandit for a havan?", a: "Yes. We can arrange a verified pandit at your home for any major havan — Ganpati Havan, Rudra Yagna, Navagraha Shanti, Maha Mrityunjaya Havan, Sudarshana Yagna and more. Book under 'Puja Booking' and choose 'Add havan kit' to ship the samagri before the pandit arrives." },
    ],
  },

  wearables: {
    slug: "wearables",
    category: "Wearables",
    h1: "Spiritual Wearables — Energised Malas, Bracelets & Yantra Lockets",
    metaTitle: "Energised Malas, Bracelets & Yantra Lockets Online | Vedic Tatva",
    metaDescription: "108-bead japa malas, healing crystal bracelets, energised yantra lockets and rakshasutra. Lab-tested gemstones, shastra-correct stringing, free pandit consultation.",
    intro: "Hand-strung 108-bead japa malas, gemstone bracelets and energised yantra lockets — every piece blessed before it ships and built to last decades of daily wear.",
    sections: [
      {
        heading: "Why wearable spiritual items work",
        body: "The body is the closest yantra you carry — anything in continuous physical contact (a Rudraksha mala against the skin, a copper bracelet on the wrist, a yantra locket over the heart chakra) maintains an unbroken connection between the energised object and the wearer's biofield. Tantric texts including the Sharada Tilaka and the Mantra Mahodadhi explicitly prescribe wearables for sustained mantric effect — a mala worn during the day continues the japa even when the mind moves on, an energised yantra continues to broadcast even while you sleep. This is why monks across traditions (Tibetan Buddhist, Hindu sadhu, Sufi dervish) have always carried prayer beads on the body.",
      },
      {
        heading: "108-bead japa malas — choosing one for your sadhana",
        body: "108 is the auspicious count — the number of cosmic dance steps of Shiva, the number of marma points in the body, the number of Upanishads, the diameter ratio of the sun and the earth. A traditional japa mala has 108 beads plus one larger 'meru' bead that marks the start; you do not cross the meru, you reverse direction. Materials matter: Rudraksha for Shiva mantras and general purpose, tulsi for Vishnu/Krishna mantras, sphatik (clear quartz) for Devi mantras and any peace-related sadhana, sandalwood for Saraswati and learning, lotus seed (kamalgatta) for Lakshmi, red coral or rose quartz for love and family. Our malas are hand-knotted between every bead with cotton or silk thread (knotting prevents the beads from rubbing and breaking) and finished with a single tassel.",
      },
      {
        heading: "Care, cleansing and re-energising",
        body: "A mala in daily use should be cleansed every fortnight on a Monday or Friday — pass it three times through camphor smoke, sprinkle a few drops of gangajal, and chant the relevant beej mantra eleven times. If a bracelet's elastic snaps or the mala thread breaks, ship it back to us — we will re-string it for free for the first three years (just pay return shipping). Never let your mala touch the floor; if it does, lift it and touch it briefly to your forehead in apology. Do not lend an energised mala — the energy is bound to the original wearer; lending dilutes both the giver's and the borrower's connection.",
      },
    ],
    faqs: [
      { q: "Are your malas hand-knotted?", a: "Yes. Every 108-bead mala is hand-knotted between beads with cotton or pure silk thread. Knotting prevents bead-on-bead friction (which damages Rudraksha over time) and means a single break does not lose all the beads." },
      { q: "How is a yantra locket energised?", a: "We engrave the yantra on copper or silver per the shastric measurement, perform the prana-pratishtha at our Banaras workshop (the appropriate beej mantra is chanted 1,008 times over the locket on a tithi suited to the deity), and seal the locket with a small piece of bhojpatra inside. A certificate of energisation, including the date, tithi and pandit name, ships with the piece." },
      { q: "Can I wear a Rudraksha bracelet during sleep?", a: "Yes — a Rudraksha bracelet may be worn 24x7. Many wearers report better sleep quality. Remove only during ritual impurity (death rite attendance, intimate contact)." },
      { q: "What is the difference between a sphatik (crystal) mala and a glass bead mala?", a: "Sphatik is natural clear quartz, mined and cut. It has a slight imperfection (cloud, inclusion) and a cool touch; glass beads are uniform, perfect and warm to touch. Genuine sphatik passes a polariscope test (we ship the test certificate with every mala). Glass beads sold as 'crystal' have no spiritual or healing value." },
      { q: "Do you offer free re-stringing?", a: "Yes — for the first three years from purchase, we'll re-string any of our malas or bracelets for free. You only pay return shipping. Most malas need re-stringing every 2-3 years of daily wear." },
      { q: "How do I choose between a 108-bead mala and a 27-bead 'wrist mala'?", a: "108-bead is the traditional, full-count mala for serious daily japa. The 27-bead wrist mala is a quarter-mala — wearable as a bracelet, used by completing 4 rounds for a full japa cycle. Choose 108 if you have a dedicated daily sadhana time; choose 27 if you japa intermittently through the day." },
    ],
  },

  "dhoti-kurta": {
    slug: "dhoti-kurta",
    category: "Dhoti & Kurta",
    h1: "Dhoti Kurta Sets Online — Pure Cotton Puja Wear for Men",
    metaTitle: "Buy Dhoti Kurta Sets Online — Pure Cotton & Silk Puja Wear | Vedic Tatva",
    metaDescription: "Pure cotton and silk dhoti kurta sets — shastra-pure white, cream and saffron, with traditional border designs. Ideal for puja, havan, weddings and temple visits. Free Pan-India delivery.",
    intro: "Pure cotton and silk dhoti-kurta sets — woven on traditional handlooms in Tamil Nadu, Bengal and Banaras — for puja, havan, weddings and every sacred occasion.",
    sections: [
      {
        heading: "Why traditional puja wear matters",
        body: "Hindu shastra prescribes saatvik clothing for any sacred ritual — natural fibre (cotton, silk, wool, linen), unstitched (the original dhoti is a single uncut cloth) and in the colours appropriate to the ritual (white for shanti karmas, cream for daily puja, saffron for Shiva and renunciation rites, red for Devi worship, yellow for Vishnu). Synthetic fabric, polyester blends and machine-stitched garments carry trace electrical and chemical disturbances; pure cotton is the only material that does not interfere with mantric vibration. This is why every Vedic priest, from the Tamil Brahmin agnihotri to the Banaras pandit on the ghat, still wears the same untailored dhoti his ancestors wore three thousand years ago.",
      },
      {
        heading: "Choosing the right fabric and fit",
        body: "Cotton mulmul is the most breathable, ideal for Indian summers and humid coastal climates — soft, light, and gets better with every wash. Cotton-silk blend (chanderi, maheshwari) gives a slight sheen and is perfect for festivals and weddings. Pure silk (kanchipuram, banarasi) is the most premium, reserved for special pujas and ceremonies — heavier, warmer, with intricate zari borders. Sizing for dhoti is by length: 4 metres for daily wear, 4.5 metres for festival/wedding wraps with elaborate pleating, 5 metres for South Indian eight-pleat (panchakaccham) styles. The kurta sizing is standard chest measurement; for puja wear we recommend going one size up so the chest and arms have unrestricted movement during prostration.",
      },
      {
        heading: "Care and longevity",
        body: "Hand-wash in cold water with a mild, neutral soap (Ezee, Genteel) — never use harsh detergents that strip the natural starch and zari. Air-dry in shade, never in direct sun (sun fades vegetable dye and weakens silk fibre). For silk kurtas, dry-clean every 5-6 wears. Iron on medium heat with a thin cotton cloth between the iron and the fabric. Stored properly (in a muslin bag, with a few cloves to repel insects), a good cotton kurta lasts 8-10 years and a silk kurta 15-20 years — the wear actually deepens the colour and softens the drape.",
      },
    ],
    faqs: [
      { q: "What dhoti length do I need?", a: "For daily wear and most simple puja, 4 metres works. For elaborate wedding/festival wraps with multiple pleats, choose 4.5 metres. For South Indian eight-pleat panchakaccham style (Tamil/Telugu Brahmin tradition), you need 5 metres. Sizing chart on each product page." },
      { q: "Are your kurtas pre-shrunk?", a: "Yes. Cotton kurtas are pre-washed in hot water before stitching to remove any residual shrinkage. Order your normal chest size confidently. Silk kurtas do not shrink." },
      { q: "Which colour should I wear for which puja?", a: "White or cream for daily puja, shanti karma, shradh and pitru rituals. Saffron for Shiva pujas, Hanuman puja, Rudrabhishek. Red or maroon for Devi pujas (Durga, Lakshmi, Kali). Yellow for Vishnu, Krishna and Satyanarayan. Avoid black for any auspicious occasion." },
      { q: "Do you offer custom tailoring?", a: "Yes — for orders above ₹3,500 we offer custom tailoring. Email your measurements (chest, shoulder, kurta length, sleeve length) within 24 hours of placing the order. Custom-stitched orders take 7-10 days additional." },
      { q: "How do I wash a silk kurta?", a: "Dry-clean only for the first 3-4 wears. After that, gentle hand-wash in cold water with mild neutral soap, no scrubbing, no wringing. Air-dry in shade. Iron on low heat with a cotton cloth shield." },
      { q: "Are the borders machine-made or handwoven?", a: "All zari and silk borders on our premium range (chanderi, maheshwari, kanchipuram, banarasi) are handwoven on traditional pit looms. Cotton kurtas with simple woven borders use power-loom borders for affordability — clearly mentioned on each product page." },
    ],
  },

  "brass-copperware": {
    slug: "brass-copperware",
    category: "Brass & Copperware",
    h1: "Brass & Copper Puja Items Online — Diyas, Thalis, Kalash, Bells",
    metaTitle: "Brass Diyas, Copper Kalash, Bells & Panchapatra Online | Vedic Tatva",
    metaDescription: "Hand-crafted brass and copper puja items from Banaras — diyas, panchapatra, kalash, ghanti, thali, lota, abhishekam patras. Pure metal, traditional designs, free delivery.",
    intro: "Hand-crafted brass and copper puja vessels from Banaras and Moradabad — diyas, kalash, panchapatra, ghanti and thali sets — built to be passed down for generations.",
    sections: [
      {
        heading: "Why brass and copper for puja",
        body: "Sacred texts including the Atharva Veda, the Vishnu Smriti and the Skanda Purana explicitly prescribe brass (peetal), copper (tamba), silver (chandi) and gold (suvarna) for puja vessels — these metals are paramaanu sthayi, said to hold and amplify mantric vibration. Modern science adds a different reason: copper is naturally antimicrobial (the Olympic-tested 'oligodynamic effect' kills bacteria within hours of contact) and brass shares the same property because of its high copper content. Water stored overnight in a copper lota (tamra-jal) is recommended in Ayurveda for digestion, hormonal balance and a stronger immune system. So a copper kalash on your puja altar is, simultaneously, a sacred vessel and a daily health habit.",
      },
      {
        heading: "What every puja shrine should have",
        body: "A complete brass-copper puja set includes a panchapatra (small five-spouted vessel for the achamana water), an arghya patra (offering bowl), a small ghanti (hand bell — rung at the start and during aarti), a kapur stand (incense camphor holder), a diya (oil lamp — single-wick for daily, three-wick or five-wick for festivals), a thali (offering plate), a lota (water pot), a kalash (large ceremonial water pot for festivals — coconut sits on top), and an abhishekam patra (the long-spouted vessel for pouring milk/water over the murti). Larger shrines add a small chowki (raised wooden seat for the murti) and a chhatra (decorative umbrella). Our 9-piece Brass Puja Starter Set bundles the essentials at a 22% bundle discount.",
      },
      {
        heading: "Cleaning and patina care",
        body: "Brass and copper develop a natural patina over time — a green-brown tarnish that many devotees consider auspicious. To restore the bright shine: rub gently with a paste of tamarind and salt, or use a ready-made brass cleaner (Pitambari is the traditional choice), rinse with hot water and dry with a soft cotton cloth. Never use steel-wool or abrasive scrub — it scratches the surface and accelerates the next tarnish cycle. After cleaning, rub a thin coat of pure mustard oil on copper vessels — it slows oxidation. Store in a dry place; humidity is the main enemy of brass. With basic care, a good brass diya lasts a hundred years.",
      },
    ],
    faqs: [
      { q: "Is your copper pure or coated?", a: "Pure 99.5% copper — never tin-coated, never lacquer-coated. We test every batch with a chemical assay. Coated 'copper' vessels lose the antimicrobial property and the shastric efficacy. The pure copper has the orange-red colour typical of authentic tamba." },
      { q: "How do I clean a tarnished brass diya?", a: "Make a paste of tamarind pulp + salt, rub gently with a soft cloth, rinse with hot water, dry. For heavy tarnish use Pitambari paste. Avoid steel wool or scratchy scrubs. Re-clean every 1-2 months for a daily-use diya." },
      { q: "Can I drink water from a copper lota daily?", a: "Yes — Ayurveda recommends storing water in a copper lota overnight (8 hours+) and drinking the 'tamra-jal' first thing in the morning. The copper releases trace ions that aid digestion, reduce inflammation and balance the three doshas. One copper lota of water per day is the recommended quantity." },
      { q: "Are the bells (ghanti) tuned to a specific note?", a: "Yes — our brass ghantis are hand-tuned to the 'Om' tone (approximately 432 Hz fundamental). The shastra requires the bell sound to be sustained, deep and free of metallic 'clang'. Each bell is tested before dispatch — you can hear the demo on each product page." },
      { q: "What is the difference between a panchapatra and an arghya patra?", a: "Panchapatra is the small five-spouted vessel that holds the achamana water (water you sip from for purification at the start of the ritual). Arghya patra is the offering bowl into which you pour water as an offering to the deity. Both ship together in our Standard Puja Set." },
      { q: "Do you sell larger temple-grade brass items?", a: "Yes — we have a 'Temple Grade' section with large kalash (up to 5 litres), abhishekam patras, big diyas, kuttuvilakku (South Indian standing lamps) and chamara fans. These are made on order; lead time is 2-4 weeks. Email us with your requirement for a quote." },
    ],
  },

  gemstones: {
    slug: "gemstones",
    category: "Gemstones",
    h1: "Certified Gemstones Online — Navaratna, Birthstones & Astrological Stones",
    metaTitle: "Buy Certified Astrological Gemstones Online — Navaratna, Ruby, Yellow Sapphire | Vedic Tatva",
    metaDescription: "Lab-certified natural gemstones for jyotish remedies — ruby, pearl, red coral, emerald, yellow sapphire, diamond, blue sapphire, hessonite, cat's eye. Each stone GIA/IGI tested with mantra energisation.",
    intro: "Every gemstone we ship carries an independent lab certificate (GIA, IGI or GRS) and is energised on the deity day of its ruling planet before dispatch from our Jaipur workshop.",
    sections: [
      {
        heading: "Why a gemstone is more than an ornament",
        body: "In Vedic jyotish, the nine grahas (planetary forces) each have a corresponding gemstone — the Navaratna — that acts as a wearable resonator for that planet's energy. Sun (ruby), Moon (pearl), Mars (red coral), Mercury (emerald), Jupiter (yellow sapphire), Venus (diamond), Saturn (blue sapphire), Rahu (hessonite) and Ketu (cat's eye). Sage Parashara's Brihat Parashara Hora Shastra and Varahamihira's Brihat Samhita describe gemstones as 'concentrated planetary light' — when worn on the correct finger, set in the correct metal, on the correct day and energised with the correct mantra, the stone is said to amplify the constructive qualities of a strong planet or compensate for the malefic influence of a weak one. This is not jewellery; this is a calibrated jyotish instrument and choosing the wrong stone can intensify the wrong planet, which is why we insist on a free chart-based recommendation before any sale.",
      },
      {
        heading: "Lab certification and what to look for",
        body: "Every astrological gemstone you buy must come with a certificate from a recognised lab — GIA (Gemological Institute of America), IGI (International Gemological Institute) or GRS for premium stones. The certificate must specify: natural origin (not synthetic, not glass-filled), no heat treatment or only acceptable heat treatment, no oil/resin filling for emeralds, weight in carats, refractive index and colour grade. Avoid 'unheated' claims without a lab report — almost every commercial blue sapphire and ruby is mildly heat-treated and that is acceptable; what is not acceptable is beryllium-diffusion, lead-glass-filling or composite stones. Our gemstones are sourced from Jaipur (rubies, emeralds), Sri Lanka (sapphires, cat's eye), Italy and Japan (red coral, pearl) and South Africa (diamond) — every batch is independently re-tested at our in-house gemological lab before being listed.",
      },
      {
        heading: "Which finger, which metal, which day",
        body: "Standard wearing protocol: ruby on the ring finger of the right hand in gold, on a Sunday morning at sunrise after Surya mantra. Pearl on the little finger in silver on a Monday evening. Red coral on the ring finger in copper or gold on a Tuesday at sunrise. Emerald on the little finger in gold on a Wednesday morning. Yellow sapphire on the index finger in gold on a Thursday morning — the most popular and considered the safest stone. Diamond on the middle or ring finger in platinum or white gold on a Friday morning. Blue sapphire on the middle finger in silver, iron or panchadhatu on a Saturday — but only after a 3-day trial because Saturn responds quickly. Hessonite on the middle finger in silver on Saturday night. Cat's eye on the middle or ring finger in silver on Tuesday or Thursday. Always at least 3 carats for full effect; under 2 carats is decorative only. Bathe the ring in raw cow milk, chant the planet's beej mantra 108 times, then wear.",
      },
    ],
    faqs: [
      { q: "Should I wear a gemstone without consulting an astrologer?", a: "No. The wrong gemstone can intensify a weak or malefic planet and create the opposite of the intended effect — financial stress, health issues, relationship breakdown. Always book a free 15-minute jyotish consultation with our astrologer team. We review your janma kundli, the planetary periods (mahadasha/antardasha) you are running and recommend the gemstone that genuinely supports your chart." },
      { q: "What does 'lab certified' actually mean?", a: "Each stone ships with a third-party gemological certificate — GIA, IGI, GRS or GJEPC — confirming it is natural (not synthetic), the type and degree of treatment, weight, colour grade, clarity and origin. We do not sell uncertified stones above ₹5,000. The certificate has a unique serial number and a QR you can scan to verify on the issuing lab's website." },
      { q: "Yellow sapphire vs citrine — what's the difference?", a: "Yellow sapphire (pukhraj) is corundum, hardness 9, refractive index 1.76+, ruled by Jupiter, expensive (₹15,000-2,00,000 per carat depending on origin and clarity). Citrine (sunela) is quartz, hardness 7, refractive index 1.54, an accepted upratna substitute when a real pukhraj is out of budget. Both work for Jupiter — the citrine is gentler and more affordable but needs to be larger (5+ carats) for similar effect." },
      { q: "Is heat treatment acceptable?", a: "Mild heat treatment (the 'old method' done since the 1700s) is acceptable for ruby and sapphire and does not reduce jyotish efficacy — almost every stone in the market is mildly heated. What is NOT acceptable: beryllium diffusion, lead-glass filling, oil filling for emeralds beyond 'minor', synthetic stones, composite or doublet stones. Our certificates clearly state the treatment type and we reject any stone with unacceptable treatments." },
      { q: "Why is blue sapphire considered risky?", a: "Blue sapphire (neelam) is ruled by Saturn — the strongest and fastest-acting jyotish planet. A correctly chosen neelam can transform finances and career within days; an incorrectly chosen one can cause equally rapid setbacks. We require a 3-day trial period — keep the stone under your pillow for 3 nights and observe dreams, mood, sleep and luck. Only if all signs are positive do you wear it. We offer full refund within 7 days for a failed trial." },
      { q: "What is Navaratna and who should wear it?", a: "Navaratna is a single ornament containing all nine planetary stones in a prescribed geometric arrangement — ruby in the centre, surrounded by the other eight. It balances all nine grahas without amplifying any one specifically and is therefore the safest 'universal' jyotish ornament — ideal when you do not want to commit to a single planetary stone or when multiple planets are weak. Available as a pendant, ring or bracelet on our site." },
      { q: "Do you do energisation (pranapratishtha)?", a: "Yes — every gemstone is energised at our Jaipur workshop on the deity day of its ruling planet, with the prescribed beej mantra recited 108 times by a Brahmin pandit, and a small certificate of energisation ships with the stone. You only need to do the milk-bath and 108 personal mantra recitations on the day you first wear it." },
    ],
  },
};

// Map alternate URL slugs to canonical keys, so /shop/malas resolves
// to the wearables block, etc. Add any future cross-references here.
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

export function getCategoryContent(slug: string | undefined | null): CategoryContent | null {
  if (!slug) return null;
  const key = CATEGORY_SLUG_ALIASES[slug] || slug;
  return CATEGORY_CONTENT[key] || null;
}

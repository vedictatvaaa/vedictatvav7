import type { SeoLandingPageProps } from "@/components/SeoLandingPage";

const TODAY_ISO = "2026-05-14";

// ---------------------------------------------------------------------------
// PUJA SERVICE LANDING PAGES
// ---------------------------------------------------------------------------

const ONLINE_PUJA_BOOKING: SeoLandingPageProps = {
  seoTitle: "Online Puja Booking — Live Vedic Pandits, Same-Day Slots | Vedic Tatva",
  seoDescription:
    "Book online puja with verified Vedic pandits live on video call. Satyanarayan, Rudrabhishek, Lakshmi, Navagraha Shanti, Griha Pravesh and 50+ ceremonies. Live Sankalp, full vidhi, photo-video proof, prasad couriered to your home. Same-day slots, transparent dakshina, multi-language pandits.",
  seoKeywords:
    "online puja booking, book puja online, virtual puja, online satyanarayan puja, online rudrabhishek, online lakshmi puja, video call puja, same day puja booking, online pandit booking, NRI puja booking",
  canonical: "/online-puja-booking",
  breadcrumbs: [
    { name: "Home", url: "/" },
    { name: "Online Puja Booking", url: "/online-puja-booking" },
  ],
  eyebrow: "Online Puja Booking",
  h1: "Online Puja Booking — Live, Verified Vedic Pandits on Video Call",
  subtitle:
    "Book any puja online — Sankalp on video, full vidhi by verified pandits, photo-video proof and prasad couriered home. Same-day slots, all samagri included.",
  heroCTAs: [
    { label: "Book a Puja", href: "/puja", variant: "primary" },
    { label: "View All Pandits", href: "/pandits", variant: "outline" },
  ],
  trustChips: ["100% Verified Pandits", "Live Sankalp", "Prasad Couriered Home"],
  intro:
    "Online puja booking lets you participate in an authentic Vedic ceremony from anywhere in the world. A verified Brahmin pandit performs the full ritual at the temple or your sankalpa-sthan, you join the Sankalp live on video call, and we courier the prasad and a photo-video record to your home. Used widely by NRI families, working professionals and devotees who can't be physically present.",
  sections: [
    {
      heading: "What's Included in Every Online Puja",
      bullets: [
        "Live video Sankalp with the pandit (you take the resolve in your name and gotra)",
        "Full Vedic vidhi — mantras, yantra setup, havan kund, prasad and aarti",
        "All samagri arranged by us — flowers, ghee, samidha, dhoop, naivedya, fruits",
        "Photo and short video record of the puja shared on WhatsApp or email",
        "Prasad pack couriered to your home address (India + worldwide)",
        "Digital Sankalp & Aashirvaad PDF for your records",
      ],
    },
    {
      heading: "How Online Puja Booking Works",
      bullets: [
        "Pick a puja and date on /puja or call us — we confirm pandit availability instantly",
        "Make the dakshina payment online (UPI, card, net-banking, Razorpay)",
        "Receive a calendar invite and a video-call link 24 hours before the muhurat",
        "Join 5 minutes before — pandit explains the Sankalp and you take the resolve",
        "Pandit performs the full vidhi (60–180 min depending on puja type)",
        "Receive photo-video proof and tracking link for your prasad pack within 48 hrs",
      ],
    },
    {
      heading: "Most Popular Online Pujas",
      bullets: [
        "Satyanarayan Puja — for prosperity, fulfilment of vows, family well-being",
        "Rudrabhishek — for health, removal of obstacles, Lord Shiva's grace",
        "Lakshmi Puja — for wealth, abundance, Diwali and Friday weekly puja",
        "Navagraha Shanti — for graha-dosha relief, Sade Sati, Mangal Dosha",
        "Griha Pravesh — for new home, online vastu pacification, virtual housewarming",
        "Mundan, Namkaran, Annaprashan — child sanskar pujas with live family on video",
        "Pitru Paksha Shraddh — Pind Daan and Tarpan from Gaya, Kashi or Haridwar",
      ],
    },
    {
      heading: "Why NRI and Out-of-City Families Choose Online Puja",
      body:
        "An online puja is not a compromise — it is a fully valid Vedic ceremony. Sastra permits the yajamana (host) to participate via Sankalp from any location as long as the pandit performs the ritual at a sanctified spot in your name and gotra. We've completed thousands of online pujas for families in the USA, UK, Canada, Australia, Singapore, UAE and 75+ Indian cities. Time-zone scheduling, multi-language pandits (Sanskrit, Hindi, Tamil, Telugu, Marathi, Bengali, Gujarati, Kannada) and a transparent dakshina range make it easy for global devotees.",
    },
  ],
  faqs: [
    {
      q: "Is an online puja as effective as an in-person puja?",
      a: "Yes. The yajamana's Sankalp (taking the resolve in your name and gotra) is what binds you to the puja's phala, and that is done live on video. The pandit then performs the full vidhi at a sanctified spot in your name. This is sastra-compliant and widely accepted.",
    },
    {
      q: "How early should I book an online puja?",
      a: "Same-day slots are usually available for common pujas (Satyanarayan, Rudrabhishek, Lakshmi). For muhurat-sensitive pujas like Griha Pravesh or Wedding, book 3–7 days in advance.",
    },
    {
      q: "Will the prasad reach my home in the USA / UK?",
      a: "Yes. We courier the prasad pack worldwide via DHL or similar. India delivery is 2–4 days; international is 5–10 days. Tracking link is shared on WhatsApp.",
    },
    {
      q: "How much does an online puja cost?",
      a: "Online puja dakshina starts from ₹1,100 for short Satyanarayan kathas and goes up to ₹15,000+ for elaborate ceremonies like Maha Mrityunjaya Jaap or full Rudrabhishek. All samagri is included in the price.",
    },
    {
      q: "What if I can't attend the live Sankalp?",
      a: "We can record the Sankalp portion and you can take the resolve later — but live participation is strongly recommended for full phala. We offer flexible time-zone scheduling for NRI families.",
    },
    {
      q: "What languages do the pandits speak?",
      a: "Our verified pandits cover Sanskrit (mantra), Hindi, Tamil, Telugu, Marathi, Bengali, Gujarati, Kannada, Punjabi and English explanation. You can request a language during booking.",
    },
  ],
  finalCtaTitle: "Book an Online Puja Today",
  finalCtaSubtitle: "Same-day slots available. All samagri included. Prasad couriered worldwide.",
  finalCtaButtons: [
    { label: "Browse Pujas", href: "/puja", variant: "primary" },
    { label: "Talk to Us", href: "/contact", variant: "outline" },
  ],
  relatedLinks: [
    { label: "Satyanarayan Puja", href: "/satyanarayan-puja" },
    { label: "Rudrabhishek", href: "/rudrabhishek-puja" },
    { label: "Navratri Puja", href: "/navratri-puja" },
    { label: "Verified Pandits", href: "/pandits" },
    { label: "Pind Daan", href: "/pind-daan" },
  ],
  schema: {
    type: "service",
    serviceName: "Online Puja Booking with Verified Vedic Pandits",
    areaServed: ["IN", "US", "GB", "CA", "AU", "SG", "AE", "NZ", "ZA"],
  },
};

const SATYANARAYAN_PUJA: SeoLandingPageProps = {
  seoTitle: "Satyanarayan Puja Booking — Online or At Home | Vedic Tatva",
  seoDescription:
    "Book Satyanarayan Puja with a verified Vedic pandit — at home or live online. Full vidhi, all samagri included, Satyanarayan katha, prasad and aarti. Same-day booking, transparent dakshina starting ₹1,100. Performed in Hindi, Sanskrit, Marathi, Gujarati and South-Indian languages.",
  seoKeywords:
    "satyanarayan puja, satyanarayan vrat, satyanarayan katha, satyanarayan puja vidhi, satyanarayan puja booking, online satyanarayan puja, satyanarayan puja samagri, purnima puja, vrat puja",
  canonical: "/satyanarayan-puja",
  breadcrumbs: [
    { name: "Home", url: "/" },
    { name: "Pujas", url: "/puja" },
    { name: "Satyanarayan Puja", url: "/satyanarayan-puja" },
  ],
  eyebrow: "Satyanarayan Puja",
  h1: "Satyanarayan Puja — Booking, Vidhi, Katha and Samagri",
  subtitle:
    "Book a verified pandit for Satyanarayan Vrat at home or online. Full katha, all samagri arranged, prasad and aarti included.",
  heroCTAs: [
    { label: "Book This Puja", href: "/puja", variant: "primary" },
    { label: "Find a Pandit", href: "/pandits", variant: "outline" },
  ],
  trustChips: ["Verified Pandit", "All Samagri Included", "Same-Day Booking"],
  intro:
    "Satyanarayan Puja is one of the most widely performed Vedic rituals — undertaken on Purnima (full moon), birthdays, anniversaries, housewarmings, after recovery from illness, or on fulfilment of any vow. The puja invokes Lord Vishnu in his Satyanarayan form and is followed by the recitation of the five-chapter Satyanarayan Katha. Vedic Tatva connects you with verified Brahmin pandits who perform the complete vidhi at your home or live online with all samagri included.",
  sections: [
    {
      heading: "When Should You Perform Satyanarayan Puja?",
      bullets: [
        "Purnima (every full-moon day) — most auspicious; also Ekadashi and Sankranti",
        "Housewarming / Griha Pravesh — to invoke Vishnu's blessings on the new home",
        "Birthdays, anniversaries, child's first birthday (Anna-prashan)",
        "After recovery from illness, completion of education, new job, business launch",
        "Fulfilment of any sankalpa or vow taken to Lord Satyanarayan",
        "Margashirsh, Chaitra, Vaishakh, Karthik, Magh Purnima are especially powerful",
      ],
    },
    {
      heading: "Satyanarayan Puja Vidhi — Step by Step",
      bullets: [
        "Sankalp — the yajamana takes the resolve in their name, gotra and intention",
        "Kalash sthapana, Ganesh puja, Punyahavachan and Navagraha invocation",
        "Main puja of Lord Satyanarayan with sodasopachara (16 offerings)",
        "Recitation of all five chapters of the Satyanarayan Katha",
        "Aarti, naivedya offering, distribution of panchamrit and sapaad bhog",
        "Final pranam and prasad distribution to family and guests",
      ],
    },
    {
      heading: "Samagri Included in Our Satyanarayan Puja Kit",
      bullets: [
        "Banana leaves and stalks (for the canopy / mandap), kalash, coconut",
        "Wheat (panch-meva), sugar, ghee, milk, curd, honey for panchamrit",
        "Flowers, tulsi leaves, dhoop, agarbatti, kumkum, haldi, akshat, rolī",
        "Yagyopavit, paan-supari, fruits, dakshina coins",
        "Sapaad bhog ingredients — wheat flour, sugar, ghee, banana (1.25 of each)",
        "Printed Satyanarayan Katha booklet for the family",
      ],
    },
    {
      heading: "How Long Does the Puja Take?",
      body:
        "A standard Satyanarayan Puja runs 90–120 minutes including the katha. A short version (vrat-only) can be completed in 60 minutes; an elaborate version with Vishnu Sahasranama Paath can extend to 3 hours. The pandit will recommend the format based on your sankalpa and time available.",
    },
  ],
  faqs: [
    {
      q: "How much does Satyanarayan Puja cost?",
      a: "Dakshina starts at ₹1,100 for a short online puja and ₹2,100–₹5,100 for a full home puja with samagri included. Elaborate Vishnu Sahasranama Paath versions go up to ₹8,500.",
    },
    {
      q: "Can Satyanarayan Puja be done online?",
      a: "Yes. The pandit performs the full vidhi at the temple or sankalpa-sthan in your name and gotra. You join the Sankalp and katha recitation live on video call.",
    },
    {
      q: "Do I need to fast for Satyanarayan Vrat?",
      a: "Yes — a single-meal fast is observed by the yajamana from sunrise until after the puja. Fruits, milk and sabudana are permitted. The fast is broken with the sapaad bhog prasad.",
    },
    {
      q: "What samagri do I need to arrange myself?",
      a: "Nothing if you book the puja with samagri included. We arrange every item including the banana-leaf canopy, kalash, panchamrit ingredients and printed katha booklet.",
    },
    {
      q: "Can the puja be done in Marathi or South-Indian style?",
      a: "Yes — we have pandits trained in Maharashtrian, Tamil, Telugu, Kannada, Bengali and North-Indian variations of the Satyanarayan vidhi.",
    },
    {
      q: "What is sapaad bhog?",
      a: "Sapaad means '1.25' — the prasad is made from 1.25 measures of wheat flour, sugar, ghee and banana, cooked into a sweet halwa offered to the deity and shared with all who attend.",
    },
  ],
  finalCtaTitle: "Book Satyanarayan Puja Today",
  finalCtaSubtitle: "Verified pandit, full samagri, katha booklet — at your home or online.",
  finalCtaButtons: [
    { label: "Book Now", href: "/puja", variant: "primary" },
    { label: "View Pandits", href: "/pandits", variant: "outline" },
  ],
  relatedLinks: [
    { label: "Online Puja Booking", href: "/online-puja-booking" },
    { label: "Rudrabhishek Puja", href: "/rudrabhishek-puja" },
    { label: "Navratri Puja", href: "/navratri-puja" },
    { label: "Lakshmi Puja Benefits", href: "/lakshmi-puja-benefits" },
    { label: "Griha Pravesh Muhurat", href: "/griha-pravesh-muhurat" },
  ],
  schema: { type: "service", serviceName: "Satyanarayan Puja Booking" },
};

const RUDRABHISHEK_PUJA: SeoLandingPageProps = {
  seoTitle: "Rudrabhishek Puja Booking — Online or At Temple | Vedic Tatva",
  seoDescription:
    "Book Rudrabhishek Puja with a Veda-pathi pandit — at a Shiva temple or live online. Full Rudri Paath, abhishek with panchamrit, ganga jal and bilva-patra. For health, longevity, removal of obstacles, Mangal-Pitru-Kalsarpa dosha relief. Dakshina from ₹2,100.",
  seoKeywords:
    "rudrabhishek puja, rudrabhishek booking, online rudrabhishek, rudri paath, maha rudrabhishek, shiva abhishek, mahamrityunjaya jaap, kalsarpa dosha puja, mangal dosha shanti, rudrabhishek vidhi",
  canonical: "/rudrabhishek-puja",
  breadcrumbs: [
    { name: "Home", url: "/" },
    { name: "Pujas", url: "/puja" },
    { name: "Rudrabhishek Puja", url: "/rudrabhishek-puja" },
  ],
  eyebrow: "Rudrabhishek",
  h1: "Rudrabhishek Puja — Veda-Pathi Pandit, At Temple or Online",
  subtitle:
    "Full Rudri Paath, abhishek with panchamrit, ganga jal and bilva-patra. Performed at a Shiva temple or live online — dakshina from ₹2,100 with all samagri.",
  heroCTAs: [
    { label: "Book Rudrabhishek", href: "/puja", variant: "primary" },
    { label: "Talk to a Pandit", href: "/contact", variant: "outline" },
  ],
  trustChips: ["Veda-Pathi Pandit", "Live at Shiva Temple", "Bilva-Patra Included"],
  intro:
    "Rudrabhishek is the abhishek (sacred bathing) of the Shiva-linga while the Veda-pathi pandit recites the Sri Rudram from the Yajurveda. It is regarded as one of the most powerful Vedic remedies — performed for health, longevity, removal of obstacles, and relief from Mangal-Pitru-Kalsarpa doshas. Vedic Tatva arranges Rudrabhishek with verified pandits at established Shiva temples (Trimbakeshwar, Mahakaleshwar, Omkareshwar, Kashi Vishwanath) or live online from your sankalpa-sthan.",
  sections: [
    {
      heading: "Types of Rudrabhishek We Offer",
      bullets: [
        "Laghu Rudrabhishek — single Rudri Paath, ~75 minutes (most popular for health)",
        "Maha Rudrabhishek — eleven Rudri Paaths, ~3 hours (for major dosha shanti)",
        "Ati Rudra — 121 paaths over multiple days (for serious sankalpa, requires advance booking)",
        "Mahamrityunjaya Jaap with Rudrabhishek — 1.25 lakh mantra jaap for serious illness",
        "Pradosh Rudrabhishek — performed on Pradosh Vrat evenings (most auspicious)",
        "Sawan Rudrabhishek — every Monday in Shravan month (most powerful annual window)",
      ],
    },
    {
      heading: "What Goes Into the Abhishek",
      bullets: [
        "Panchamrit — milk, curd, ghee, honey and sugar (in sequence)",
        "Sacred ganga jal sourced from Haridwar / Rishikesh",
        "Bilva-patra (108 leaves), white flowers, datura, dhatura, akshat",
        "Bhasma, chandan, kumkum and rudraksha mala for the linga",
        "Coconut water, sugarcane juice, sandalwood paste",
        "Sri Rudram + Chamakam + Maha Mrityunjaya jaap throughout the abhishek",
      ],
    },
    {
      heading: "When Rudrabhishek Is Recommended",
      bullets: [
        "Chronic health issues, recovery from surgery, mental peace and longevity",
        "Mangal Dosha, Pitru Dosha, Kalsarpa Dosha shanti",
        "Sade Sati and Shani-related challenges",
        "Career obstacles, court cases, business losses",
        "Marriage delays, child-birth difficulties",
        "Annual sankalpa during Sawan, Mahashivratri, Pradosh and Shivratri Trayodashi",
      ],
    },
    {
      heading: "Why Temple Rudrabhishek Is Especially Powerful",
      body:
        "An abhishek performed on a self-manifested (Swayambhu) Shiva-linga at a recognised jyotirlinga or established temple is considered to multiply the phala manifold. We work directly with priests at Trimbakeshwar (Nashik), Mahakaleshwar (Ujjain), Omkareshwar (Khandwa), Kashi Vishwanath (Varanasi) and Bhimashankar — booking the linga slot, arranging the samagri, and joining you live on video for the Sankalp.",
    },
  ],
  faqs: [
    {
      q: "How much does Rudrabhishek cost?",
      a: "Laghu Rudrabhishek starts at ₹2,100 online, ₹3,500 at home with samagri. Maha Rudrabhishek (11 paaths) is ₹8,500–₹12,000. Temple Rudrabhishek at Trimbakeshwar / Mahakaleshwar starts ₹5,500 including temple slot booking.",
    },
    {
      q: "Can Rudrabhishek be done online?",
      a: "Yes. The pandit performs the full abhishek at a Shiva temple or sanctified spot in your name and gotra. You join the Sankalp on video and receive a recording + prasad pack.",
    },
    {
      q: "Which day is best for Rudrabhishek?",
      a: "Monday (Somvar), Pradosh Vrat (Trayodashi), Maha Shivratri, every Monday of Sawan, and Solar/Lunar eclipses. Daily Rudrabhishek is also performed on demand.",
    },
    {
      q: "How long does Rudrabhishek take?",
      a: "Laghu Rudrabhishek: 75–90 minutes. Maha Rudrabhishek: 3–4 hours. Mahamrityunjaya Jaap with Rudrabhishek: 4–5 hours. Ati Rudra: 5–11 days.",
    },
    {
      q: "What samagri should I arrange?",
      a: "Nothing if you book with samagri included. We provide ganga jal, bilva-patra, panchamrit, bhasma, chandan, flowers, rudraksha mala and the Rudri Paath booklet.",
    },
    {
      q: "Can Rudrabhishek be done at home for someone unwell?",
      a: "Yes. We bring a portable parad (mercury) Shiva-linga or marble linga for the home abhishek. The full vidhi is performed in front of the unwell person if they wish to be present.",
    },
  ],
  finalCtaTitle: "Book a Rudrabhishek Today",
  finalCtaSubtitle: "Veda-pathi pandit, full samagri, abhishek at temple or online.",
  finalCtaButtons: [
    { label: "Book Now", href: "/puja", variant: "primary" },
    { label: "View Pandits", href: "/pandits", variant: "outline" },
  ],
  relatedLinks: [
    { label: "Online Puja Booking", href: "/online-puja-booking" },
    { label: "Satyanarayan Puja", href: "/satyanarayan-puja" },
    { label: "Navratri Puja", href: "/navratri-puja" },
    { label: "Verified Pandits", href: "/pandits" },
  ],
  schema: { type: "service", serviceName: "Rudrabhishek Puja with Veda-Pathi Pandit" },
};

const NAVRATRI_PUJA: SeoLandingPageProps = {
  seoTitle: "Navratri Puja Booking — Durga Pujan, Kanya Pujan, Akhand Jyot | Vedic Tatva",
  seoDescription:
    "Book Navratri Puja with a verified pandit — Ghatasthapana, daily Durga Pujan, Akhand Jyot, Saptashati Paath, Kanya Pujan and Havan on Navami. All nine days covered, samagri included, online or at home. Chaitra and Sharadiya Navratri.",
  seoKeywords:
    "navratri puja, durga puja booking, navratri ghatasthapana, kanya pujan, durga saptashati paath, akhand jyot, chaitra navratri, sharadiya navratri, navratri havan, navratri pandit",
  canonical: "/navratri-puja",
  breadcrumbs: [
    { name: "Home", url: "/" },
    { name: "Pujas", url: "/puja" },
    { name: "Navratri Puja", url: "/navratri-puja" },
  ],
  eyebrow: "Navratri",
  h1: "Navratri Puja — Ghatasthapana, Saptashati Paath and Kanya Pujan",
  subtitle:
    "Book a verified pandit for the full nine-day Navratri vidhi — daily Durga pujan, Akhand Jyot, Saptashati Paath, Kanya Pujan and Havan on Navami.",
  heroCTAs: [
    { label: "Book Navratri Puja", href: "/puja", variant: "primary" },
    { label: "View Pandits", href: "/pandits", variant: "outline" },
  ],
  trustChips: ["All 9 Days Covered", "Akhand Jyot Setup", "Saptashati Paath"],
  intro:
    "Navratri is nine sacred nights of Devi worship — Chaitra Navratri (March-April) and Sharadiya Navratri (September-October) being the two principal observances. Each day is dedicated to one of the nine forms of Durga, starting with Ghatasthapana on Pratipada and culminating with Kanya Pujan and Havan on Navami / Vijayadashami. Vedic Tatva arranges verified pandits to perform the daily pujan, light the Akhand Jyot, recite the Durga Saptashati and conduct the closing havan — at your home or live online.",
  sections: [
    {
      heading: "Nine Days of Navratri — Dedicated Devi & Daily Vidhi",
      bullets: [
        "Day 1 Pratipada — Shailaputri (Ghatasthapana, Akhand Jyot lit, kalash sthapana)",
        "Day 2 Dwitiya — Brahmacharini (white-flower offering, panchamrit abhishek)",
        "Day 3 Tritiya — Chandraghanta (red-flower offering, ghee diya)",
        "Day 4 Chaturthi — Kushmanda (orange/pumpkin offering, sandal tilak)",
        "Day 5 Panchami — Skandamata (yellow flowers, banana naivedya)",
        "Day 6 Shashthi — Katyayani (honey offering, married-women's puja)",
        "Day 7 Saptami — Kalaratri (jaggery, dark-red flowers, Saptashati middle chapters)",
        "Day 8 Ashtami — Mahagauri (coconut, halwa-puri, Sandhi puja)",
        "Day 9 Navami — Siddhidatri (Kanya Pujan + Havan, completion of vrat)",
      ],
    },
    {
      heading: "What's Included in the Navratri Puja Package",
      bullets: [
        "Pratipada Ghatasthapana with kalash, jau (barley) sowing and Akhand Jyot lighting",
        "Daily Devi pujan for nine days at the muhurat time",
        "Full Durga Saptashati Paath (700 verses across 13 chapters)",
        "Akhand Jyot oil/ghee refill + safe maintenance for nine days",
        "Kanya Pujan on Ashtami or Navami — ritual + halwa-puri-chana prasad",
        "Closing Havan with 108 ahutis + visarjan of jau and kalash",
        "All samagri arranged — flowers, fruits, jau seeds, ghee, sandal, kumkum, chunari",
      ],
    },
    {
      heading: "Akhand Jyot — What It Is and How We Maintain It",
      body:
        "The Akhand Jyot is a single ghee or oil diya kept burning continuously for the nine days of Navratri. It represents the unbroken presence of Devi in the home and is considered to multiply the phala of the entire vrat. We provide a brass akhand-deep with reservoir, pure ghee or sesame oil for nine days, and the pandit visits daily (or guides remotely) to refill and re-bless the jyot. If the flame extinguishes, prayaschit vidhi is performed.",
    },
    {
      heading: "Kanya Pujan — Ritual and What to Prepare",
      bullets: [
        "Invite 9 girls aged 2-10 (representing the nine forms of Devi) and 1 boy (Bhairav)",
        "Wash their feet, apply tilak, tie kalava, gift chunari/dakshina",
        "Serve halwa, puri, chana, kheer and sweet — eaten by them as Devi-prasad",
        "Family takes the prasad after the kanyas leave; vrat is completed",
        "Performed on Ashtami or Navami based on family tradition",
      ],
    },
  ],
  faqs: [
    {
      q: "How much does Navratri Puja booking cost?",
      a: "Single-day pujan starts at ₹1,500. Full nine-day package (daily pujan + Saptashati + Kanya Pujan + Havan) ranges ₹11,000–₹21,000 depending on city and samagri scope. Akhand Jyot maintenance is included.",
    },
    {
      q: "Can the pandit visit only on Ashtami or Navami?",
      a: "Yes. We offer single-day Ashtami/Navami packages with Sandhi puja, Kanya Pujan and Havan if you don't need the full nine-day vidhi.",
    },
    {
      q: "Do I need to keep the Akhand Jyot at my home?",
      a: "Recommended but not mandatory. If you cannot, the pandit can keep the akhand-jyot at the temple in your name and gotra and you receive a daily photo update.",
    },
    {
      q: "What's the difference between Chaitra and Sharadiya Navratri?",
      a: "Chaitra Navratri (March-April) marks the Hindu new year and ends with Ram Navami. Sharadiya Navratri (September-October) is the major autumn festival ending with Vijayadashami / Dussehra. Both follow the same nine-night vidhi.",
    },
    {
      q: "Can I do online Navratri puja from abroad?",
      a: "Yes. The pandit performs the full vidhi at the temple in your name. You join the Sankalp on Pratipada and the closing Havan on Navami live on video. Daily updates and prasad are sent.",
    },
    {
      q: "What is the Sandhi Puja?",
      a: "Sandhi Puja is performed at the junction of Ashtami and Navami — the most powerful 48-minute window of Navratri. It includes 108 lotus offerings and 108 diya lighting.",
    },
  ],
  finalCtaTitle: "Book Navratri Puja with a Verified Pandit",
  finalCtaSubtitle: "All nine days, full samagri, Akhand Jyot, Kanya Pujan and Havan.",
  finalCtaButtons: [
    { label: "Book Now", href: "/puja", variant: "primary" },
    { label: "Read Vidhi Guide", href: "/navratri-puja-vidhi", variant: "outline" },
  ],
  relatedLinks: [
    { label: "Navratri Puja Vidhi", href: "/navratri-puja-vidhi" },
    { label: "Lakshmi Puja Benefits", href: "/lakshmi-puja-benefits" },
    { label: "Online Puja Booking", href: "/online-puja-booking" },
    { label: "Satyanarayan Puja", href: "/satyanarayan-puja" },
  ],
  schema: { type: "service", serviceName: "Navratri Puja Booking — Nine-Day Devi Vidhi" },
};

// ---------------------------------------------------------------------------
// CITY PANDIT LANDING PAGES
// ---------------------------------------------------------------------------

function buildCityPage(args: {
  city: string;
  citySlug: string;
  region: string;
  intro: string;
  localFlavour: string;
  popularPujas: string[];
  popularAreas: string[];
  pricing: string;
}): SeoLandingPageProps {
  const { city, citySlug, region, intro, localFlavour, popularPujas, popularAreas, pricing } = args;
  return {
    seoTitle: `Verified Pandit in ${city} — Same-Day Booking, All Pujas | Vedic Tatva`,
    seoDescription: `Book a verified Vedic pandit in ${city} for Satyanarayan, Griha Pravesh, Wedding, Rudrabhishek, Mundan, Namkaran, Navagraha Shanti and 50+ ceremonies. Same-day booking, transparent dakshina, multi-language pandits. 100% identity-verified, scripture-trained Brahmins serving every neighbourhood of ${city}.`,
    seoKeywords: `pandit in ${city.toLowerCase()}, ${city.toLowerCase()} pandit booking, brahmin pandit ${city.toLowerCase()}, satyanarayan puja ${city.toLowerCase()}, griha pravesh pandit ${city.toLowerCase()}, wedding pandit ${city.toLowerCase()}, online pandit ${city.toLowerCase()}, verified pandit near me ${city.toLowerCase()}`,
    canonical: `/pandit-in-${citySlug}`,
    breadcrumbs: [
      { name: "Home", url: "/" },
      { name: "Verified Pandits", url: "/pandits" },
      { name: city, url: `/pandit-in-${citySlug}` },
    ],
    eyebrow: `Pandit in ${city}`,
    h1: `Verified Vedic Pandit in ${city} — Same-Day Booking, All Ceremonies`,
    subtitle: `Identity-verified, scripture-trained Brahmin pandits across ${city}. Transparent dakshina, all samagri included.`,
    heroCTAs: [
      { label: `View ${city} Pandits`, href: `/pandits?city=${citySlug}`, variant: "primary" },
      { label: "Book a Puja", href: "/puja", variant: "outline" },
    ],
    trustChips: ["Identity Verified", "Same-Day Booking", "Transparent Dakshina"],
    intro,
    sections: [
      {
        heading: `Most-Booked Pujas in ${city}`,
        bullets: popularPujas,
      },
      {
        heading: `Areas We Serve in ${city}`,
        body: `Our verified pandits are spread across ${city} so you get a local Brahmin who knows your area's tradition and reaches you on time.`,
        bullets: popularAreas,
      },
      {
        heading: `Why Choose a Vedic Tatva Pandit in ${city}`,
        bullets: [
          "100% identity-verified Brahmins (Aadhaar + scripture certification on file)",
          `Local to ${city} — knows community traditions, language, and shubh muhurat for your gotra`,
          "Transparent dakshina — quoted upfront, no surprises",
          "Multi-language: Hindi, Sanskrit, English plus regional language for the family",
          "Same-day booking for common pujas; muhurat-sensitive pujas confirmed in 24 hrs",
          "All samagri arranged by us — kalash, flowers, ghee, fruits, dakshina items",
        ],
      },
      {
        heading: `Local Festival & Tradition Notes — ${city}`,
        body: localFlavour,
      },
      {
        heading: `Pandit Dakshina in ${city}`,
        body: pricing,
      },
    ],
    faqs: [
      {
        q: `How quickly can I book a pandit in ${city}?`,
        a: `Same-day for common pujas like Satyanarayan, Lakshmi or Rudrabhishek. Muhurat-sensitive pujas like Griha Pravesh, Wedding or Mundan are confirmed within 24 hours.`,
      },
      {
        q: `Are the ${city} pandits identity-verified?`,
        a: `Yes. Every pandit on Vedic Tatva submits Aadhaar, scripture certification (from a recognised Veda-pathshala) and at least 5 years of ceremonial experience. We also collect community references.`,
      },
      {
        q: `What languages do ${city} pandits speak?`,
        a: `All ${city} pandits perform mantras in Sanskrit and explain the vidhi in Hindi and English. Regional languages (Marathi, Gujarati, Tamil, Telugu, Bengali, Kannada, Punjabi) are matched to your family preference.`,
      },
      {
        q: `Do ${city} pandits bring all samagri?`,
        a: `Yes when you book the "samagri included" option. Otherwise the pandit will share a precise list 24 hours before the puja so you can arrange items locally.`,
      },
      {
        q: `What is the typical dakshina range in ${city}?`,
        a: pricing,
      },
      {
        q: `Can I book a ${city} pandit for online puja from abroad?`,
        a: `Yes. The pandit performs the puja at a temple or sankalpa-sthan in ${city} in your name and gotra; you join the Sankalp on video. Prasad is couriered to your overseas address.`,
      },
    ],
    finalCtaTitle: `Book a Verified Pandit in ${city}`,
    finalCtaSubtitle: `Same-day slots available. All samagri included. Transparent dakshina.`,
    finalCtaButtons: [
      { label: `View ${city} Pandits`, href: `/pandits?city=${citySlug}`, variant: "primary" },
      { label: "Book a Puja", href: "/puja", variant: "outline" },
    ],
    relatedLinks: [
      { label: "Online Puja Booking", href: "/online-puja-booking" },
      { label: "Satyanarayan Puja", href: "/satyanarayan-puja" },
      { label: "Rudrabhishek", href: "/rudrabhishek-puja" },
      { label: "All Verified Pandits", href: "/pandits" },
    ],
    schema: { type: "localbusiness", city, region },
  };
}

const PANDIT_DELHI = buildCityPage({
  city: "Delhi",
  citySlug: "delhi",
  region: "Delhi NCR",
  intro:
    "Delhi NCR — including Gurugram, Noida, Faridabad and Ghaziabad — is one of our largest pandit networks. Whether you need a North-Indian Brahmin for a Punjabi-style wedding in Pitampura, a Madhwa pandit for Satyanarayan in Dwarka, or a South-Indian iyer for Griha Pravesh in Gurugram, we have a verified Brahmin available the same day.",
  localFlavour:
    "Delhi families typically observe Karva Chauth, Ahoi Ashtami, Diwali Lakshmi Puja, Govardhan Puja, Karthik Purnima, Holashtak and the full Navratri cycle. Punjabi-Hindu households often combine Sukhmani Sahib paath with Vedic puja — we accommodate both. Mauni Amavasya snaan-sankalp at Yamuna ghats is also widely booked.",
  popularPujas: [
    "Satyanarayan Puja — Purnima, birthdays, business launch",
    "Griha Pravesh — new flat / villa in Dwarka, Greater Noida, Gurugram",
    "Wedding (Saptapadi + Phera) with Sangeet-Mehendi pre-rituals",
    "Lakshmi-Ganesh Puja on Diwali, Govardhan Puja day after",
    "Rudrabhishek at Chhatarpur Mandir / home (Sawan & Mahashivratri)",
    "Mundan and Namkaran at home or temples like Hanuman Mandir Connaught Place",
    "Navagraha Shanti, Mangal Dosha and Kalsarpa puja for Delhi-wedding alliances",
  ],
  popularAreas: [
    "Central Delhi — Connaught Place, Karol Bagh, Pahar Ganj, Daryaganj",
    "South Delhi — Greater Kailash, Hauz Khas, Saket, Vasant Kunj, Defence Colony",
    "West Delhi — Janakpuri, Dwarka, Tilak Nagar, Punjabi Bagh, Pitampura",
    "East Delhi — Mayur Vihar, Patparganj, Preet Vihar, Laxmi Nagar",
    "North Delhi — Civil Lines, Model Town, Rohini, Kingsway Camp",
    "NCR — Gurugram (DLF, Sushant Lok), Noida (Sec 18, 62, 137), Faridabad, Ghaziabad",
  ],
  pricing:
    "In Delhi NCR, dakshina ranges: Satyanarayan ₹2,100–₹5,500 · Griha Pravesh ₹3,500–₹8,500 · Rudrabhishek ₹3,500–₹11,000 · Wedding ₹15,000–₹35,000 · Mundan/Namkaran ₹2,500–₹5,500. Travel within 25 km is included; beyond that a small travel charge applies.",
});

const PANDIT_MUMBAI = buildCityPage({
  city: "Mumbai",
  citySlug: "mumbai",
  region: "Maharashtra",
  intro:
    "Mumbai — including Navi Mumbai and Thane — has a deep pandit tradition spanning Maharashtrian, Gujarati, Marwari, South-Indian and Konkani communities. We have verified Brahmins who specialise in each style: Deshastha Brahmins for Maharashtrian Satyanarayan, Iyer/Iyengar pandits for Tamil-Brahmin weddings in Matunga, Gujarati Pushti-Marg pandits for Vaishnav homes, and traditional Konkani priests for fishing-community rituals.",
  localFlavour:
    "Mumbai families heavily book Ganesh Sthapana for the 11-day Ganeshotsav (Bhadrapada), with home-pujan twice daily and the visarjan rituals. Gauri Pujan, Hartalika Teej, Vat Purnima, Ekadashi vrat, Anant Chaturdashi and the Diwali-Padwa fortnight see peak demand. Sawan Mondays at Babulnath and Mumbadevi temples drive Rudrabhishek bookings.",
  popularPujas: [
    "Ganesh Sthapana + Visarjan — 11-day Ganeshotsav home pujan",
    "Satyanarayan Puja with sapaad bhog (Maharashtrian style)",
    "Griha Pravesh for new flat in Andheri, Bandra, Powai, Navi Mumbai",
    "Vat Purnima and Hartalika Teej pujan for married women",
    "Rudrabhishek at Babulnath / home — every Sawan Monday and Pradosh",
    "South-Indian wedding with Iyer / Iyengar pandit (Matunga, Sion, Chembur)",
    "Konkani / Saraswat puja for Hindu fishing-community households",
  ],
  popularAreas: [
    "South Mumbai — Colaba, Marine Lines, Walkeshwar, Malabar Hill, Bhuleshwar",
    "Western Suburbs — Bandra, Khar, Santacruz, Andheri, Jogeshwari, Goregaon, Borivali",
    "Central — Dadar, Matunga, Sion, Chembur, Wadala, Kurla",
    "Eastern Suburbs — Powai, Vikhroli, Bhandup, Mulund",
    "Navi Mumbai — Vashi, Nerul, Belapur, Kharghar, Panvel",
    "Thane — Thane West, Ghodbunder Road, Kalyan, Dombivli",
  ],
  pricing:
    "In Mumbai, dakshina ranges: Satyanarayan ₹1,800–₹5,500 · Ganesh Sthapana 11-day ₹8,500–₹18,000 · Griha Pravesh ₹3,500–₹8,500 · Rudrabhishek ₹3,500–₹11,000 · Wedding ₹18,000–₹40,000. Travel within 20 km included; Navi Mumbai & Thane have a nominal travel addition.",
});

const PANDIT_BANGALORE = buildCityPage({
  city: "Bangalore",
  citySlug: "bangalore",
  region: "Karnataka",
  intro:
    "Bangalore (Bengaluru) draws families from across India, so we maintain pandits trained in every regional vidhi: Smartha and Madhva Iyengar pandits for Karnataka Brahmin households, Tamil Iyer pandits for the Mylapore-style vidhi popular in Jayanagar and Basavanagudi, Telugu pandits for IT-corridor families from Hyderabad/Vijayawada, Marwari and North-Indian pandits for the apartment communities in Whitefield and Sarjapur Road.",
  localFlavour:
    "Bangalore Brahmin families observe Ugadi (Karnataka new year) with Panchanga Shravanam, Varamahalakshmi Vrata in August, Ganesh Chaturthi (Madhva style), Saraswati Pujan during Navratri, and elaborate Karthika Masa deepa-aaradhana. Rudrabhishek at Gavi Gangadhareshwara and Halasuru Someshwara temples is widely booked.",
  popularPujas: [
    "Satyanarayan Puja (Karnataka / Tamil / Telugu style on request)",
    "Griha Pravesh for new home in Whitefield, Sarjapur, Electronic City, Hebbal",
    "Varamahalakshmi Vrata (Friday in Shravan)",
    "Karnataka Brahmin wedding — full Madhva or Smartha vidhi",
    "Ayush Homam, Sudarshana Homam, Ganapathi Homam at home",
    "Rudrabhishek + Mahamrityunjaya Jaap at temple or home",
    "Annaprashan (Choulu), Namkaran (Naamkarana), Aksharabhyasa for children",
  ],
  popularAreas: [
    "Central — Basavanagudi, Jayanagar, Malleshwaram, Rajajinagar, Vijayanagar",
    "South — JP Nagar, Banashankari, Kanakapura Road, Bannerghatta Road, BTM Layout",
    "East — Indiranagar, Koramangala, HSR Layout, Domlur",
    "IT Corridor — Whitefield, Sarjapur Road, Marathahalli, Bellandur, Electronic City",
    "North — Hebbal, Yelahanka, Hennur, Devanahalli, Sahakar Nagar",
    "West — Rajajinagar, Vijayanagar, Magadi Road, Kengeri",
  ],
  pricing:
    "In Bangalore, dakshina ranges: Satyanarayan ₹1,800–₹4,500 · Griha Pravesh ₹3,500–₹8,500 · Rudrabhishek ₹3,500–₹10,500 · Wedding (Karnataka style) ₹18,000–₹40,000 · Annaprashan/Namkaran ₹2,500–₹5,500 · Homam (Ganapathi/Sudarshana) ₹4,500–₹12,500. Travel within 20 km included.",
});

// ---------------------------------------------------------------------------
// BLOG / ARTICLE LANDING PAGES
// ---------------------------------------------------------------------------

const NAVRATRI_PUJA_VIDHI: SeoLandingPageProps = {
  seoTitle: "Navratri Puja Vidhi — Day-by-Day Guide with Mantras & Samagri | Vedic Tatva",
  seoDescription:
    "Complete Navratri Puja Vidhi — day-by-day guide for all nine nights, mantras for each form of Durga, Ghatasthapana muhurat, Akhand Jyot lighting, Saptashati Paath, Kanya Pujan and closing Havan. Samagri checklist and step-by-step pandit-approved instructions.",
  seoKeywords:
    "navratri puja vidhi, navratri vidhi at home, ghatasthapana vidhi, durga puja vidhi, kanya pujan vidhi, navratri samagri list, navratri mantras, durga saptashati paath",
  canonical: "/navratri-puja-vidhi",
  breadcrumbs: [
    { name: "Home", url: "/" },
    { name: "Blog", url: "/blog" },
    { name: "Navratri Puja Vidhi", url: "/navratri-puja-vidhi" },
  ],
  eyebrow: "Festival Guide",
  h1: "Navratri Puja Vidhi — Complete Day-by-Day Guide",
  subtitle:
    "Every step of the nine-night Devi vidhi, with mantras, samagri checklist, Ghatasthapana muhurat and Kanya Pujan instructions — written and verified by Vedic pandits.",
  trustChips: ["Pandit-Verified", "All 9 Days Covered", "Includes Mantras"],
  intro:
    "Navratri (literally 'nine nights') is the most extensive Devi-worship cycle in the Vedic calendar. This guide walks you through the full vidhi day by day — the auspicious Ghatasthapana muhurat on Pratipada, the lighting of the Akhand Jyot, daily pujan of each of the nine forms of Durga (Navadurga), Saptashati Paath, the powerful Sandhi puja at the junction of Ashtami and Navami, Kanya Pujan and the closing Havan. Whether you perform it at home or invite a pandit, this is the same vidhi our verified Brahmins follow.",
  sections: [
    {
      heading: "Before You Begin — Samagri Checklist",
      bullets: [
        "Brass kalash with lid, coconut, mango/ashoka leaves (5 or 7 leaves)",
        "Red cloth, mauli (kalava), akshat (unbroken rice), kumkum, haldi, chandan",
        "Soil + jau (barley) seeds for sowing on Day 1 (Ghatasthapana)",
        "Akhand-deep (brass diya with reservoir), pure ghee or sesame oil for 9 days",
        "Daily flowers (try to match the day's colour), tulsi, dhoop, agarbatti",
        "Naivedya items — fruits, mishri, panchamrit ingredients, halwa-puri-chana for Kanya Pujan",
        "Durga Saptashati booklet, Devi photo or murti, chunari (red), ornaments, bangles",
      ],
    },
    {
      heading: "Day 1 — Pratipada: Ghatasthapana & Akhand Jyot",
      body:
        "Choose the Ghatasthapana muhurat (typically the Abhijit or Pratipada-morning window — your pandit or panchang will give the exact time). Bathe, wear clean clothes (red/yellow preferred), face East or North. Place soil in a wide earthen plate, sprinkle the jau seeds, water lightly. Set the kalash on top, fill with water + supari + coin + akshat + haldi, top with mango leaves and the coconut wrapped in red cloth. Tie kalava around the neck. Light the Akhand Jyot. Recite the Sankalp: 'Aaj … (date, gotra, name) … main Maa Durga ki kripa hetu Navratri vrat aur pujan ka sankalp leti/leta hoon.' Offer flowers, dhoop, naivedya. Recite the Shailaputri mantra: 'Om Devi Shailaputryai Namah'.",
    },
    {
      heading: "Days 2–9 — Daily Pujan of the Nine Forms",
      bullets: [
        "Day 2 Brahmacharini — white flowers, panchamrit, mantra: Om Devi Brahmacharinyai Namah",
        "Day 3 Chandraghanta — red flowers, ghee diya, mantra: Om Devi Chandraghantayai Namah",
        "Day 4 Kushmanda — orange/pumpkin offering, mantra: Om Devi Kushmandayai Namah",
        "Day 5 Skandamata — yellow flowers + banana, mantra: Om Devi Skandamatayai Namah",
        "Day 6 Katyayani — honey offering (especially by married women), mantra: Om Devi Katyayanyai Namah",
        "Day 7 Kalaratri — jaggery + dark-red flowers, recite Saptashati middle chapters, mantra: Om Devi Kalaratryai Namah",
        "Day 8 Mahagauri — coconut + halwa-puri, Sandhi puja at Ashtami-Navami junction, mantra: Om Devi Mahagauryai Namah",
        "Day 9 Siddhidatri — full Saptashati paath, Kanya Pujan + Havan, mantra: Om Devi Siddhidatryai Namah",
      ],
    },
    {
      heading: "Sandhi Puja — The Most Powerful 48 Minutes",
      body:
        "The Sandhi puja is performed in the 48-minute window straddling Ashtami's last 24 minutes and Navami's first 24 minutes. This is the moment Durga slew Mahishasura. Light 108 diyas, offer 108 lotus or red hibiscus flowers, recite the Devi Suktam. If 108 is not feasible, offer 21 with full bhakti — the phala is equal.",
    },
    {
      heading: "Kanya Pujan — The Closing Ritual",
      bullets: [
        "Invite 9 girls aged 2–10 (representing the 9 Devis) and 1 boy aged 2–10 (Bhairav)",
        "Wash their feet with water, dry with a clean cloth, apply tilak and akshat",
        "Tie kalava on their right wrist (girls) or left wrist (boy)",
        "Serve halwa, puri, chana, kheer in clean plates — they eat first as Devi-prasad",
        "After the meal, offer dakshina (cash + fruits + a small gift like pen/chocolate)",
        "Touch their feet, ask for blessings — vrat is now complete; family takes prasad",
      ],
    },
    {
      heading: "Closing Havan & Visarjan",
      body:
        "On Navami (or Vijayadashami), perform the Havan with 108 ahutis of til, ghee, samidha, jau and havan-samagri while reciting the Durga Saptashati Siddha-Kunjika Stotram. Offer the final Purna-ahuti with a coconut. The next morning, visarjit the kalash water in a flowing river or in your tulsi/garden plant. The jau saplings are gifted to family members — they are considered Devi's prasad.",
    },
  ],
  faqs: [
    {
      q: "Can I do Navratri puja without a pandit?",
      a: "Yes — the vidhi above can be performed by any sincere devotee. A pandit is recommended for the Ghatasthapana muhurat, the Saptashati paath (it requires correct Sanskrit pronunciation), and the closing Havan.",
    },
    {
      q: "What if the Akhand Jyot extinguishes?",
      a: "Don't panic. Re-light it and offer a sankalp of prayaschit (acknowledgement) to Devi. Do not let the diya stay unlit for more than a few minutes. Some traditions perform a brief abhishek of the kalash as additional prayaschit.",
    },
    {
      q: "Do I have to fast all nine days?",
      a: "Traditional vrat is one meal a day with vrat-friendly foods (kuttu, sabudana, fruits, milk). Many families fast only on Day 1 and Days 8–9. Pregnant women, the elderly, and the unwell are exempt — perform the puja with full bhakti instead.",
    },
    {
      q: "Which colours should I wear each day?",
      a: "Red, royal blue, yellow, green, grey, orange, white, pink, purple — these are the popular nine-colour sequence (varies by region). The colour is not mandatory; cleanliness and bhakti matter more.",
    },
    {
      q: "Can men do Kanya Pujan?",
      a: "Yes. Any householder (man or woman) can wash the feet, serve and offer dakshina to the kanyas. The ritual honours the Devi-tattva in young girls, regardless of who performs it.",
    },
  ],
  finalCtaTitle: "Need a Pandit for Your Navratri Puja?",
  finalCtaSubtitle: "Verified Brahmins for Ghatasthapana, daily Saptashati, Kanya Pujan and Havan — at home or online.",
  finalCtaButtons: [
    { label: "Book Navratri Puja", href: "/navratri-puja", variant: "primary" },
    { label: "View Pandits", href: "/pandits", variant: "outline" },
  ],
  relatedLinks: [
    { label: "Navratri Puja Booking", href: "/navratri-puja" },
    { label: "Lakshmi Puja Benefits", href: "/lakshmi-puja-benefits" },
    { label: "Online Puja Booking", href: "/online-puja-booking" },
    { label: "Satyanarayan Puja", href: "/satyanarayan-puja" },
  ],
  schema: { type: "article", datePublished: TODAY_ISO },
};

const LAKSHMI_PUJA_BENEFITS: SeoLandingPageProps = {
  seoTitle: "Lakshmi Puja Benefits — Wealth, Abundance & Spiritual Harmony | Vedic Tatva",
  seoDescription:
    "Lakshmi Puja benefits explained — invoke Goddess Mahalakshmi for wealth, prosperity, family harmony, business growth and spiritual abundance. Best days, mantras, vidhi and how to do Lakshmi Puja on Diwali, Friday and Sharad Purnima.",
  seoKeywords:
    "lakshmi puja benefits, lakshmi puja for wealth, mahalakshmi mantra, friday lakshmi puja, diwali lakshmi puja benefits, sharad purnima lakshmi, lakshmi puja vidhi, lakshmi prosperity mantra",
  canonical: "/lakshmi-puja-benefits",
  breadcrumbs: [
    { name: "Home", url: "/" },
    { name: "Blog", url: "/blog" },
    { name: "Lakshmi Puja Benefits", url: "/lakshmi-puja-benefits" },
  ],
  eyebrow: "Spiritual Wealth",
  h1: "Lakshmi Puja Benefits — Wealth, Abundance and Spiritual Harmony",
  subtitle:
    "How regular Lakshmi worship transforms your finances, family and inner life — best days, mantras, vidhi, and the deeper philosophy behind Devi Mahalakshmi.",
  trustChips: ["Pandit-Verified", "Includes Mantras", "Diwali & Friday Vidhi"],
  intro:
    "Devi Mahalakshmi is the goddess of all eight forms of wealth — Adi (primal), Dhana (money), Dhanya (food grains), Gaja (mobility), Santana (progeny), Veera (courage), Vidya (knowledge) and Vijaya (victory). Lakshmi Puja, when performed with shraddha, brings not just material abundance but also the inner clarity and contentment to enjoy and share that abundance. This guide covers the documented benefits of regular Lakshmi worship, the most powerful days, mantras, and the simple home-vidhi anyone can follow.",
  sections: [
    {
      heading: "The Eight Benefits of Regular Lakshmi Puja",
      bullets: [
        "Dhana Lakshmi — steady income, savings, removal of unexpected financial obstacles",
        "Dhanya Lakshmi — abundance of food, hospitality, never an empty kitchen",
        "Gaja Lakshmi — mobility, vehicles, smooth travel, transfers and promotions",
        "Santana Lakshmi — child blessings, family harmony, healthy progeny",
        "Veera Lakshmi — courage to face setbacks, protection from negative people",
        "Vijaya Lakshmi — success in court cases, exams, business deals, negotiations",
        "Vidya Lakshmi — clarity of intellect, success in studies, wisdom in decisions",
        "Adi Lakshmi — root spiritual abundance, contentment, freedom from greed",
      ],
    },
    {
      heading: "Best Days to Perform Lakshmi Puja",
      bullets: [
        "Friday — Lakshmi's principal weekday; weekly puja recommended",
        "Diwali (Amavasya of Karthik) — the most powerful Lakshmi-Ganesh puja of the year",
        "Sharad Purnima — Lakshmi descends to bless those who stay awake in worship",
        "Akshaya Tritiya (Vaishakh Shukla Tritiya) — gold purchase + Lakshmi puja for permanent abundance",
        "Varamahalakshmi Vrata — the Friday before Shravan Purnima (especially in Karnataka, AP, TN)",
        "Dhanteras (two days before Diwali) — Dhanvantari + Lakshmi for health and wealth",
        "Margashirsh Thursdays — special weekly Lakshmi vrat for women",
      ],
    },
    {
      heading: "The Most Powerful Lakshmi Mantras",
      bullets: [
        "Beej Mantra — Om Shreem Mahalakshmiyei Namah (108 times daily)",
        "Mahalakshmi Ashtakam — eight verses recited at the puja, especially on Diwali",
        "Sri Suktam — 16 verses from the Rig-Veda, the supreme Vedic Lakshmi hymn",
        "Kanakadhara Stotram — Adi Shankaracharya's hymn for those facing financial hardship",
        "Shri Yantra puja with Sri Suktam — for advanced devotees seeking abundance + spiritual progress",
      ],
    },
    {
      heading: "Simple Home Vidhi for Friday Lakshmi Puja",
      body:
        "Bathe before sunset. Set up the puja place facing East or North. Place a Lakshmi photo / murti and (if you have one) a Sri Yantra. Light a ghee diya and dhoop. Offer red/pink lotus or rose, kumkum, akshat. Place a small bowl with kheer or milk-rice as naivedya. Recite the beej mantra 108 times on a kamal-gatta or sphatik mala. Read the Mahalakshmi Ashtakam. Conclude with the aarti 'Om Jai Lakshmi Mata.' Distribute the prasad to family.",
    },
    {
      heading: "Common Mistakes That Reduce the Phala",
      bullets: [
        "Performing puja with unclean hands, clothes or puja-place",
        "Using broken murti, withered flowers or stale naivedya",
        "Skipping the Ganesh invocation before Lakshmi (always Ganesh first, then Lakshmi)",
        "Lighting only an incense and skipping the ghee/oil diya — diya is essential",
        "Doing the puja for short-term greed rather than dharmic prosperity",
        "Neglecting daan (charity) — Lakshmi flows where she is shared",
      ],
    },
  ],
  faqs: [
    {
      q: "How long does it take to see results from Lakshmi Puja?",
      a: "Devotees report shifts in financial flow within 21–48 days of weekly Friday puja done with sincerity. The deeper benefits (clarity, contentment, family harmony) are felt almost immediately.",
    },
    {
      q: "Should I do Lakshmi Puja or Lakshmi-Ganesh Puja?",
      a: "On Diwali and major occasions, always Lakshmi-Ganesh together — Ganesh removes obstacles to Lakshmi's arrival. For routine Friday puja, you can do Lakshmi-only after a brief Ganesh-smaran.",
    },
    {
      q: "Which murti is best — silver, brass or photo?",
      a: "Any with bhakti is correct. A silver Lakshmi-Ganesh coin combined with a paper photo and a Sri Yantra is the most popular Diwali setup. Avoid plastic.",
    },
    {
      q: "Can I do Lakshmi puja during menstruation?",
      a: "Traditional sastra advises not personally performing the puja during the first 3 days. You can read mantras quietly. From Day 4 (after a head-bath) you can resume. There is no spiritual demerit either way — bhakti matters most.",
    },
    {
      q: "What charity is recommended after Lakshmi Puja?",
      a: "Dakshina to a Brahmin / pandit, food to the hungry, sweets to children, contribution to a temple kitchen, or supporting a girl's education. Anna-daan and Vidya-daan are most praised by Devi.",
    },
  ],
  finalCtaTitle: "Book a Lakshmi Puja with a Verified Pandit",
  finalCtaSubtitle: "Diwali, Friday, Sharad Purnima or Varamahalakshmi — full vidhi at home or online.",
  finalCtaButtons: [
    { label: "Book Lakshmi Puja", href: "/puja", variant: "primary" },
    { label: "View Pandits", href: "/pandits", variant: "outline" },
  ],
  relatedLinks: [
    { label: "Online Puja Booking", href: "/online-puja-booking" },
    { label: "Satyanarayan Puja", href: "/satyanarayan-puja" },
    { label: "Navratri Puja Vidhi", href: "/navratri-puja-vidhi" },
    { label: "Griha Pravesh Muhurat", href: "/griha-pravesh-muhurat" },
  ],
  schema: { type: "article", datePublished: TODAY_ISO },
};

const GRIHA_PRAVESH_MUHURAT: SeoLandingPageProps = {
  seoTitle: "Griha Pravesh Muhurat 2026 — Best Dates, Vidhi & Vastu | Vedic Tatva",
  seoDescription:
    "Griha Pravesh muhurat 2026 — month-by-month auspicious dates for housewarming, the three types of Griha Pravesh, complete vidhi, vastu pacification, samagri checklist and pandit-approved Do's and Don'ts. Calculate your gotra-specific muhurat free.",
  seoKeywords:
    "griha pravesh muhurat 2026, griha pravesh dates, housewarming muhurat, vastu shanti, griha pravesh vidhi, new home puja muhurat, navin griha pravesh, sapurva griha pravesh",
  canonical: "/griha-pravesh-muhurat",
  breadcrumbs: [
    { name: "Home", url: "/" },
    { name: "Blog", url: "/blog" },
    { name: "Griha Pravesh Muhurat", url: "/griha-pravesh-muhurat" },
  ],
  eyebrow: "Vastu & Muhurat",
  h1: "Griha Pravesh Muhurat 2026 — Best Dates, Full Vidhi & Vastu Guide",
  subtitle:
    "Month-by-month auspicious dates, the three types of Griha Pravesh, complete vidhi, samagri checklist and pandit-verified Do's and Don'ts.",
  trustChips: ["2026 Dates", "Pandit-Verified", "Vastu Included"],
  intro:
    "Griha Pravesh — the formal entry into a new home — is one of the most consequential Vedic ceremonies. Performed on the wrong day or without the correct vidhi, it can affect the family's peace and prosperity for years. This guide gives you the auspicious 2026 muhurat windows, explains the three types of Griha Pravesh, walks through the complete vidhi (Kalash sthapana, Vastu Shanti, Hawan, Lakshmi Puja, Anna-prashan), and lists what you must and must not do on the day.",
  sections: [
    {
      heading: "The Three Types of Griha Pravesh",
      bullets: [
        "Apoorva — first-ever entry into a brand-new home (most powerful, requires full vidhi)",
        "Sapurva — re-entry after a long absence (e.g. travel abroad, family relocation back)",
        "Dwandwah — entry into a home rebuilt or renovated after damage (fire, flood, structural)",
      ],
    },
    {
      heading: "Griha Pravesh Muhurat Windows — 2026",
      body:
        "Avoid Adhik Maas, Pitru Paksha (mid-September to early October 2026), Holashtak, and Kharmaas (mid-December 2025 to mid-January 2026, mid-July to mid-August 2026). Best months are Magh, Phalgun, Vaishakh, Jyeshtha, Margashirsh.",
      bullets: [
        "January 2026 — 17, 22, 28, 30 (after Makar Sankranti, Magha shukla)",
        "February 2026 — 4, 6, 11, 18, 25 (Phalgun shukla pratipada onwards)",
        "March 2026 — 4, 6, 11, 13 (avoid Holashtak 25 Feb–4 Mar)",
        "April 2026 — 22, 27, 29 (Akshaya Tritiya 20 Apr — auspicious)",
        "May 2026 — 1, 6, 8, 13, 15, 20, 22, 27 (peak season — Vaishakh & Jyeshtha)",
        "June 2026 — 3, 5, 10, 12 (then avoid until Margashirsh)",
        "November 2026 — 13, 18, 20, 25, 27 (Karthik shukla onwards)",
        "December 2026 — 2, 4, 9, 11 (until Kharmaas begins ~14 Dec)",
      ],
    },
    {
      heading: "Days of the Week — Best & Avoid",
      bullets: [
        "Monday, Wednesday, Thursday, Friday — most auspicious for Griha Pravesh",
        "Sunday and Saturday — generally avoided (unless an exceptionally strong tithi-nakshatra-yog combination)",
        "Tuesday — avoided (Mangal-influenced, can introduce vasthu agitation)",
        "Best nakshatras: Anuradha, Mrigashira, Rohini, Pushya, Hasta, Uttara Phalguni, Uttara Ashadha, Uttara Bhadrapada, Revati, Chitra, Swati, Shravana, Dhanishtha",
      ],
    },
    {
      heading: "Complete Griha Pravesh Vidhi",
      bullets: [
        "Pre-puja — clean home, decorate doorway with mango leaves and rangoli, stock the kitchen",
        "Pour ganga jal at the entrance, place Lakshmi feet (sticker / wet-haldi prints) walking inwards",
        "Husband & wife enter together, right foot first, carrying a kalash on the wife's head",
        "Cow / sacred bull walks ahead if available (or symbolised with a small Nandi)",
        "Sankalp by the head of family in name, gotra and address",
        "Ganesh puja → Vastu Purush puja (in centre of home) → Navagraha Shanti → Vastu Hawan",
        "Kalash sthapana in the puja room with mango leaves and coconut",
        "Lakshmi-Ganesh puja with Sri Suktam, akshat-flower offering",
        "First milk-boiling on the new chulha (kitchen) — overflow signals abundance",
        "Anna-prashan / community lunch (Brahmin Bhoj or family meal)",
      ],
    },
    {
      heading: "Vastu Shanti — Why It's Essential",
      body:
        "Every plot of land has a Vastu Purush — a subtle being that resides in and around the structure. The Vastu Hawan during Griha Pravesh pacifies any Vastu doshas (defects in direction, water-source placement, kitchen-pooja-toilet alignment) and invites the positive vibrations of the eight Dikpalas (directional guardians). For homes with known Vastu issues that cannot be physically corrected, an extended Vastu Shanti with 1.25 lakh mantra jaap is recommended.",
    },
    {
      heading: "Do's and Don'ts on Griha Pravesh Day",
      bullets: [
        "DO: enter with the right foot first, carry kalash + coconut + mangal items",
        "DO: light a ghee diya in every corner before nightfall",
        "DO: keep at least one family member at home overnight (do not leave the new home empty)",
        "DON'T: shift heavy furniture or unpack boxes during the puja",
        "DON'T: argue, raise voice, or speak negatively in the new home that day",
        "DON'T: cook non-vegetarian food or consume alcohol on the day of Griha Pravesh",
        "DON'T: enter empty-handed — carry at least sweets, milk or grains",
      ],
    },
  ],
  faqs: [
    {
      q: "Can I do Griha Pravesh in a rented home?",
      a: "A short Vastu Shanti and Lakshmi-Ganesh puja is recommended in a rented home. The full Apoorva Griha Pravesh is reserved for a home you own or have leased long-term (5+ years).",
    },
    {
      q: "What if I've already moved in before doing Griha Pravesh?",
      a: "Common situation. Do a Sapurva-style re-entry — vacate the home for one night (stay with relatives or a hotel), then re-enter formally on a chosen muhurat with the full vidhi.",
    },
    {
      q: "Is Griha Pravesh required for an apartment / flat?",
      a: "Yes. The home is wherever you live and store your wealth — the structure type doesn't change the spiritual significance.",
    },
    {
      q: "How long does the puja take?",
      a: "Standard Griha Pravesh + Vastu Shanti: 2.5–3.5 hours. Extended Vastu Shanti with 1.25 lakh jaap: 5–7 hours (or split across 2 days).",
    },
    {
      q: "What's the typical pandit dakshina for Griha Pravesh?",
      a: "₹3,500–₹8,500 in metros for the standard vidhi with samagri included. Extended Vastu Shanti or multi-day formats range ₹11,000–₹25,000.",
    },
    {
      q: "Can the pandit calculate a muhurat for my exact gotra?",
      a: "Yes. Once you share birth-charts of head of family + spouse, gotra and the home address, the pandit narrows the auspicious window from 5–7 candidate dates down to the optimal day-and-time slot for your family.",
    },
  ],
  finalCtaTitle: "Get Your Griha Pravesh Muhurat & Pandit",
  finalCtaSubtitle: "Personalised muhurat for your gotra + verified pandit for the full Vastu-Shanti vidhi.",
  finalCtaButtons: [
    { label: "Book Griha Pravesh", href: "/puja", variant: "primary" },
    { label: "View Pandits", href: "/pandits", variant: "outline" },
  ],
  relatedLinks: [
    { label: "Online Puja Booking", href: "/online-puja-booking" },
    { label: "Satyanarayan Puja", href: "/satyanarayan-puja" },
    { label: "Lakshmi Puja Benefits", href: "/lakshmi-puja-benefits" },
    { label: "Verified Pandits", href: "/pandits" },
  ],
  schema: { type: "article", datePublished: TODAY_ISO },
};

// ---------------------------------------------------------------------------
// REGISTRY
// ---------------------------------------------------------------------------

export const SEO_LANDINGS: Record<string, SeoLandingPageProps> = {
  "online-puja-booking": ONLINE_PUJA_BOOKING,
  "satyanarayan-puja": SATYANARAYAN_PUJA,
  "rudrabhishek-puja": RUDRABHISHEK_PUJA,
  "navratri-puja": NAVRATRI_PUJA,
  "pandit-in-delhi": PANDIT_DELHI,
  "pandit-in-mumbai": PANDIT_MUMBAI,
  "pandit-in-bangalore": PANDIT_BANGALORE,
  "navratri-puja-vidhi": NAVRATRI_PUJA_VIDHI,
  "lakshmi-puja-benefits": LAKSHMI_PUJA_BENEFITS,
  "griha-pravesh-muhurat": GRIHA_PRAVESH_MUHURAT,
};

export type SeoLandingSlug = keyof typeof SEO_LANDINGS;

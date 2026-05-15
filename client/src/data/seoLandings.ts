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
// DEDICATED PUJA LANDINGS (target: 1 main keyword + 5–10 related per page)
// ---------------------------------------------------------------------------

const GRIHA_PRAVESH_PUJA: SeoLandingPageProps = {
  seoTitle: "Griha Pravesh Puja Booking — Vastu Shanti, Verified Pandit | Vedic Tatva",
  seoDescription:
    "Book Griha Pravesh Puja online with a verified Vedic pandit. Full Vastu Shanti vidhi, kalash sthapana, navagraha shanti, havan and prasad — at your new home or live online. Personalised muhurat, all samagri included, transparent dakshina from ₹3,500.",
  seoKeywords:
    "griha pravesh puja, griha pravesh booking, online griha pravesh puja, vastu shanti puja, housewarming puja, new home puja, vastu puja online, griha pravesh muhurat, griha pravesh vidhi, griha pravesh samagri, pandit for housewarming",
  canonical: "/griha-pravesh-puja",
  breadcrumbs: [
    { name: "Home", url: "/" },
    { name: "Pujas", url: "/puja" },
    { name: "Griha Pravesh Puja", url: "/griha-pravesh-puja" },
  ],
  eyebrow: "Griha Pravesh Puja",
  h1: "Griha Pravesh Puja — Vastu Shanti for Your New Home",
  subtitle:
    "Begin life in your new home with a complete Vedic housewarming — Vastu Shanti, Navagraha invocation, kalash sthapana and havan, performed by a verified pandit.",
  heroCTAs: [
    { label: "Book This Puja", href: "/puja", variant: "primary" },
    { label: "Find a Muhurat", href: "/griha-pravesh-muhurat", variant: "outline" },
  ],
  trustChips: ["Verified Pandit", "Vastu Shanti Included", "Personalised Muhurat"],
  intro:
    "Griha Pravesh is the Vedic ceremony of consecrating a new home before the family enters to live. It pacifies the Vastu Purusha, invokes blessings of the eight directions and the navagraha, and removes any pre-existing dosha left by previous occupants. Vedic Tatva connects you with verified Brahmin pandits who perform the full ceremony — Vastu pujan, kalash sthapana, havan, ksheer-arpan and the first cooking on the new chulha — with all samagri included.",
  sections: [
    {
      heading: "Three Types of Griha Pravesh",
      bullets: [
        "Apoorva — first entry into a brand-new home (most elaborate vidhi)",
        "Sapoorva — re-entry after long absence, renovation or change of city",
        "Dwandwah — re-entry after the home has been damaged and repaired",
      ],
    },
    {
      heading: "Full Griha Pravesh Vidhi — What's Included",
      bullets: [
        "Sankalp by the head of family in their gotra and the home address",
        "Ganesh puja, Kalash sthapana at the north-east (Ishanya) corner",
        "Vastu Purusha invocation and pacification with vastu mandala",
        "Navagraha shanti homa to balance planetary energies of the home",
        "Boundary mantras for the eight directions and main door threshold",
        "First lighting of the chulha (cooking hearth) and ksheer-arpan (milk boiling over)",
        "Aarti, prasad distribution and Brahmin bhojan (optional)",
      ],
    },
    {
      heading: "Best Muhurat for Griha Pravesh",
      bullets: [
        "Most auspicious months: Magha, Phalguna, Vaishakh, Jyeshtha, Margashirsh",
        "Shukla paksha is preferred over Krishna paksha",
        "Best tithis: Dwitiya, Tritiya, Panchami, Saptami, Dashami, Ekadashi, Trayodashi",
        "Best vaars: Monday, Wednesday, Thursday, Friday (avoid Saturday, Sunday, Tuesday)",
        "Avoid solar/lunar eclipse periods, Kharmas (Dhanu/Meen sankranti) and Pitru Paksha",
        "We auto-suggest 3–5 muhurat options for your gotra and city after booking",
      ],
    },
  ],
  faqs: [
    { q: "Can Griha Pravesh be done online?", a: "Yes — for owners abroad, the pandit performs at your home in India with a family member as proxy yajamana while you take the Sankalp live on video call. Sastra-compliant and widely done by NRI families." },
    { q: "How much does Griha Pravesh cost?", a: "₹3,500–₹8,500 in metros for the standard 2-hour vidhi with samagri included. Extended Vastu Shanti or multi-day formats range ₹11,000–₹25,000." },
    { q: "How long does the puja take?", a: "Standard format runs 2–3 hours including kalash sthapana, navagraha shanti, havan and ksheer-arpan. Extended Vastu Shanti format runs 4–5 hours." },
    { q: "What samagri do I need?", a: "Nothing if you order with samagri included — we deliver the full kit (kalash, coconut, mango leaves, navagraha samidha, havan kund, ghee, kumkum, akshat) the day before." },
    { q: "What if my muhurat options don't work for my schedule?", a: "We can identify a 'gauna muhurat' (secondary auspicious window) for the same week; the pandit will guide you to a workable slot." },
  ],
  finalCtaTitle: "Bless Your New Home With a Verified Pandit",
  finalCtaSubtitle: "Personalised muhurat, full Vastu Shanti vidhi, all samagri included.",
  finalCtaButtons: [
    { label: "Book Griha Pravesh", href: "/puja", variant: "primary" },
    { label: "Get Muhurat", href: "/griha-pravesh-muhurat", variant: "outline" },
  ],
  relatedLinks: [
    { label: "Online Puja Booking", href: "/online-puja-booking" },
    { label: "Satyanarayan Puja", href: "/satyanarayan-puja" },
    { label: "Lakshmi Puja", href: "/lakshmi-puja" },
    { label: "Navgraha Puja", href: "/navgraha-puja" },
    { label: "Verified Pandits", href: "/pandits" },
  ],
  schema: { type: "service", serviceName: "Griha Pravesh Puja Booking" },
};

const LAKSHMI_PUJA: SeoLandingPageProps = {
  seoTitle: "Lakshmi Puja Booking — Diwali, Friday Vrat & Sri Sukta Paath | Vedic Tatva",
  seoDescription:
    "Book Lakshmi Puja with a verified pandit — Diwali Lakshmi-Ganesh puja, weekly Friday vrat, Sri Sukta and Lakshmi Ashtottara paath. At home or live online. Full samagri kit, kuber yantra sthapana, transparent dakshina from ₹1,500.",
  seoKeywords:
    "Lakshmi puja booking, lakshmi puja online, diwali lakshmi puja, friday lakshmi vrat, sri sukta paath, lakshmi ashtottara, kuber puja, dhanteras puja, lakshmi puja vidhi, lakshmi puja samagri, wealth puja",
  canonical: "/lakshmi-puja",
  breadcrumbs: [
    { name: "Home", url: "/" },
    { name: "Pujas", url: "/puja" },
    { name: "Lakshmi Puja", url: "/lakshmi-puja" },
  ],
  eyebrow: "Lakshmi Puja",
  h1: "Lakshmi Puja — Booking, Vidhi, Sri Sukta Paath & Samagri",
  subtitle:
    "Invoke Goddess Lakshmi for wealth, abundance and prosperity. Book a verified pandit for Diwali, Friday vrat or any auspicious occasion — at home or live online.",
  heroCTAs: [
    { label: "Book This Puja", href: "/puja", variant: "primary" },
    { label: "Find a Pandit", href: "/pandits", variant: "outline" },
  ],
  trustChips: ["Verified Pandit", "Sri Sukta Paath", "Same-Day Booking"],
  intro:
    "Lakshmi Puja invokes Mahalakshmi — the Goddess of wealth, prosperity, fortune and well-being. Performed on Diwali Amavasya, every Friday (Vaibhav Lakshmi vrat), Dhanteras, Akshay Tritiya, Sharad Purnima and at the launch of any new business or financial venture. Vedic Tatva pandits perform the complete vidhi with Sri Sukta paath, Lakshmi Ashtottara, Kuber yantra sthapana and aarti — all samagri included.",
  sections: [
    {
      heading: "When to Perform Lakshmi Puja",
      bullets: [
        "Diwali Amavasya — the most powerful Lakshmi Puja of the year",
        "Every Friday — Vaibhav Lakshmi vrat for sustained prosperity",
        "Dhanteras (2 days before Diwali) — for new gold, silver, vehicle purchase",
        "Akshay Tritiya, Sharad Purnima, Kojagari Purnima",
        "Launch of new business, office, factory or shop",
        "When financial difficulty, debt or wealth-stagnation is felt in the home",
      ],
    },
    {
      heading: "Full Lakshmi Puja Vidhi",
      bullets: [
        "Sankalp by the family in their gotra and intention",
        "Ganesh puja, kalash sthapana, deepak prajwalan",
        "Lakshmi-Ganesh-Saraswati murti or photo sthapana with sodasopachara",
        "Sri Sukta paath (16 mantras from Rig Veda) and Lakshmi Ashtottara (108 names)",
        "Kuber yantra sthapana for wealth retention",
        "Mahalakshmi aarti, naivedya offering and prasad distribution",
        "Kheer or panchamrit naivedya is traditional",
      ],
    },
    {
      heading: "Lakshmi Puja Samagri Kit",
      bullets: [
        "Lakshmi-Ganesh idol or framed photo, silver coin (Lakshmi-Ganesh embossed)",
        "Red cloth, kalash with mango leaves and coconut",
        "Lotus flower (or red roses), durva, akshat, kumkum, haldi",
        "Diyas (minimum 11), ghee, cotton wicks, dhoop, agarbatti",
        "Kheer or panchamrit ingredients, fruits, paan-supari, dakshina coins",
        "Sri Yantra and Kuber Yantra (provided as part of premium kit)",
      ],
    },
  ],
  faqs: [
    { q: "How much does Lakshmi Puja cost?", a: "Friday vrat puja from ₹1,500 (online) and ₹2,500 (at home). Diwali Lakshmi puja with full Sri Sukta paath ranges ₹3,500–₹8,500. Maha Lakshmi Yagna ₹11,000+." },
    { q: "Can Lakshmi Puja be done weekly online?", a: "Yes — many of our customers book a weekly Friday Lakshmi puja subscription where the same pandit performs at the temple in their name every Friday." },
    { q: "Should I book Lakshmi Puja for a new business?", a: "Yes — strongly recommended. The puja is performed at the new premises with kalash sthapana, kuber yantra and a special blessing of the cash drawer / accounts ledger." },
    { q: "What time should Diwali Lakshmi Puja be done?", a: "The most auspicious is the pradosh kaal Lakshmi muhurat (sunset to ~2 hours after) on Diwali Amavasya. The pandit will share the exact muhurat for your city." },
    { q: "Is there a Diwali samagri kit?", a: "Yes — our Diwali kit includes Lakshmi-Ganesh idols, Sri Yantra, Kuber Yantra, 11 diyas, lotus flowers, kheer ingredients and the Sri Sukta booklet." },
  ],
  finalCtaTitle: "Invite Lakshmi Into Your Home",
  finalCtaSubtitle: "Verified pandit, Sri Sukta paath, full samagri — at home or live online.",
  finalCtaButtons: [
    { label: "Book Lakshmi Puja", href: "/puja", variant: "primary" },
    { label: "Read Lakshmi Benefits", href: "/lakshmi-puja-benefits", variant: "outline" },
  ],
  relatedLinks: [
    { label: "Online Puja Booking", href: "/online-puja-booking" },
    { label: "Satyanarayan Puja", href: "/satyanarayan-puja" },
    { label: "Navgraha Puja", href: "/navgraha-puja" },
    { label: "Lakshmi Puja Benefits", href: "/lakshmi-puja-benefits" },
    { label: "Verified Pandits", href: "/pandits" },
  ],
  schema: { type: "service", serviceName: "Lakshmi Puja Booking" },
};

const NAVGRAHA_PUJA: SeoLandingPageProps = {
  seoTitle: "Navgraha Puja Booking — Sade Sati, Mangal & Kalsarpa Dosha Shanti | Vedic Tatva",
  seoDescription:
    "Book Navgraha Shanti Puja online with a verified Vedic pandit. Planetary remedies for Sade Sati, Mangal Dosha, Kalsarpa Yoga, Pitra Dosh and graha-vakri periods. Full navgraha homa, ratna-arpan and mantra jaap. Dakshina from ₹3,500.",
  seoKeywords:
    "navgraha puja booking, navgraha shanti, navagraha homa, sade sati remedies, mangal dosha puja, shani shanti, kalsarpa dosha puja, planetary remedies puja, graha shanti, navgraha mantra jaap, dosh nivaran puja",
  canonical: "/navgraha-puja",
  breadcrumbs: [
    { name: "Home", url: "/" },
    { name: "Pujas", url: "/puja" },
    { name: "Navgraha Puja", url: "/navgraha-puja" },
  ],
  eyebrow: "Navgraha Puja",
  h1: "Navgraha Puja — Planetary Shanti for Sade Sati, Mangal Dosha & Kalsarpa",
  subtitle:
    "A complete Vedic remedy for malefic planetary periods. Verified pandit performs navgraha homa, mantra jaap and ratna-arpan to balance all nine planets in your kundli.",
  heroCTAs: [
    { label: "Book This Puja", href: "/puja", variant: "primary" },
    { label: "Get a Kundli Reading", href: "/astrology", variant: "outline" },
  ],
  trustChips: ["Veda-Pathi Pandit", "Custom to Your Kundli", "Mantra Jaap Included"],
  intro:
    "Navgraha Puja is the Vedic remedy for planetary afflictions — Sade Sati of Shani, Dhaiya, Mangal Dosha, Rahu-Ketu Kalsarpa Yoga, Guru-Chandal Yoga, and any malefic dasha or antardasha. The puja invokes all nine planets (Surya, Chandra, Mangal, Budha, Guru, Shukra, Shani, Rahu, Ketu) with their respective mantras, samidhas and offerings to pacify negative influences and amplify benefic ones. Performed at home or online, customised to your birth-chart.",
  sections: [
    {
      heading: "Who Should Book a Navgraha Puja",
      bullets: [
        "Anyone undergoing Shani Sade Sati or Shani Dhaiya",
        "Mangal Dosha — for marriage delay or vivah dosha",
        "Rahu-Ketu Kalsarpa Yoga (12 variants based on house placement)",
        "Pitra Dosh combined with Rahu / Shani placements",
        "Mahadasha or antardasha of a malefic planet",
        "Repeated obstacles in career, health, marriage or finances",
        "Before any major life event (marriage, business launch, surgery)",
      ],
    },
    {
      heading: "Full Navgraha Puja Vidhi",
      bullets: [
        "Sankalp by yajamana with kundli reading and gotra",
        "Ganesh puja, kalash sthapana, punyahavachan",
        "Navagraha mandala drawing and individual graha invocation",
        "Mantra jaap of each planet (108 / 1008 / 11000 jaap depending on package)",
        "Navagraha homa with planet-specific samidha (palash for Surya, durva for Mangal, etc.)",
        "Ratna-arpan (gemstone offering) and daan to brahmin",
        "Aarti, prasad and aashirvaad for the yajamana",
      ],
    },
    {
      heading: "Common Add-Ons",
      bullets: [
        "Maha Mrityunjaya Jaap (1.25 lakh / 1 crore) for Shani Sade Sati",
        "Kuja Shanti Homa for Mangal Dosha (especially before marriage)",
        "Rahu Ketu Shanti at Kalahasti or Tirunageswaram (proxy puja)",
        "Pitra Dosh Tripindi Shradh for combined Pitra-Shani or Pitra-Rahu yoga",
        "Personalised gemstone (ratna) recommendation by our jyotishi",
      ],
    },
  ],
  faqs: [
    { q: "Do I need to share my kundli for Navgraha Puja?", a: "Yes — share your full birth-chart (date, time, place) so the pandit identifies which planets need extra mantra jaap and which samidha to use." },
    { q: "How long does the puja take?", a: "Standard format 2–3 hours. Extended format with 11000-jaap version runs 6–8 hours and may be split across two days." },
    { q: "How much does Navgraha Puja cost?", a: "Basic ₹3,500 (108 jaap each), Standard ₹8,500 (1008 jaap), Maha ₹21,000+ (11000 jaap + extended homa). All include samagri." },
    { q: "Can it be combined with Mahamrityunjaya Jaap?", a: "Yes — for Shani Sade Sati and serious health issues, the combined Navgraha + Mahamrityunjaya package (₹15,000–₹25,000) is the most powerful remedy." },
    { q: "Are the mantras and homa really effective?", a: "Vedic remedies work best when paired with right karma. Our pandits are Veda-pathi (formally trained in mantra recitation) so the swara, chhanda and samidha are all sastra-compliant." },
  ],
  finalCtaTitle: "Pacify Your Grahas With an Authentic Vedic Remedy",
  finalCtaSubtitle: "Verified Veda-pathi pandit, custom to your kundli, full samagri included.",
  finalCtaButtons: [
    { label: "Book Navgraha Puja", href: "/puja", variant: "primary" },
    { label: "Get Kundli Reading", href: "/astrology", variant: "outline" },
  ],
  relatedLinks: [
    { label: "Online Puja Booking", href: "/online-puja-booking" },
    { label: "Maha Mrityunjaya Jaap", href: "/maha-mrityunjaya-jaap" },
    { label: "Pitra Dosh Puja", href: "/pitra-dosh-puja" },
    { label: "Rudrabhishek Puja", href: "/rudrabhishek-puja" },
    { label: "Verified Pandits", href: "/pandits" },
  ],
  schema: { type: "service", serviceName: "Navgraha Shanti Puja Booking" },
};

const MARRIAGE_PUJA: SeoLandingPageProps = {
  seoTitle: "Marriage Puja Booking — Vivah Sanskar with Verified Vedic Pandit | Vedic Tatva",
  seoDescription:
    "Book a verified Vedic pandit for marriage / vivah sanskar — kanyadaan, mangal pheras, saptapadi, sindoor daan. North Indian, South Indian, Maharashtrian, Bengali and Gujarati styles. Multi-language pandit, full samagri, transparent dakshina from ₹15,000.",
  seoKeywords:
    "marriage puja booking, vivah sanskar, hindu wedding pandit, kanyadaan puja, saptapadi pandit, marriage muhurat, online marriage puja, wedding pandit booking, pandit for marriage, vivah vidhi, hindu wedding ceremony",
  canonical: "/marriage-puja",
  breadcrumbs: [
    { name: "Home", url: "/" },
    { name: "Pujas", url: "/puja" },
    { name: "Marriage Puja", url: "/marriage-puja" },
  ],
  eyebrow: "Marriage Puja",
  h1: "Marriage Puja — Vivah Sanskar With a Verified Vedic Pandit",
  subtitle:
    "Book a Veda-pathi pandit for the most important sanskar of life. North Indian, South Indian, Maharashtrian, Bengali, Gujarati and Punjabi styles supported.",
  heroCTAs: [
    { label: "Book a Wedding Pandit", href: "/puja", variant: "primary" },
    { label: "Marriage Muhurat", href: "/astrology", variant: "outline" },
  ],
  trustChips: ["Multi-Language Pandit", "Sastra-Compliant Vidhi", "Personalised Muhurat"],
  intro:
    "Hindu marriage (Vivah) is one of the 16 samskaras and is the most elaborate Vedic ceremony — running 4 to 8 hours across multiple sub-rituals. Vedic Tatva connects you with verified Brahmin pandits who specialise in your specific style — Smarta, Vaishnava, Madhva, Bengali, Maharashtrian, Tamil-Iyer/Iyengar, Telugu, Kannada, Gujarati, Punjabi, Kashmiri or Marwari — and conduct the full vidhi with all samagri arranged.",
  sections: [
    {
      heading: "Sub-Rituals in a Vedic Hindu Marriage",
      bullets: [
        "Var Mala / Jaymala — exchange of garlands as the bride enters",
        "Madhuparka — welcoming the groom with honey-curd-ghee",
        "Kanyadaan — the bride's father formally gifts her to the groom",
        "Vivah Homa — fire as witness, samidha and ahuti offerings",
        "Pani Grahan — joining of hands with mantras",
        "Shilarohan — bride steps on a stone symbolising stability in marriage",
        "Laja Homa — offering of puffed rice into the fire by the bride's brother",
        "Mangal Pheras (4 or 7 in different traditions) around the sacred fire",
        "Saptapadi — seven steps with seven sacred vows",
        "Sindoor Daan and Mangalsutra Dharan (varies by tradition)",
        "Asirvaad — final blessings from elders",
      ],
    },
    {
      heading: "Why Choose a Vedic Tatva Pandit",
      bullets: [
        "Pandit matched to your community's exact tradition (no improvisation)",
        "Sanskrit mantras with clear regional-language explanation for both families",
        "Pre-wedding consultation call to align on rituals, timing and samagri",
        "All samagri arranged — havan kund, samidha, mangalsutra, kanyadaan items",
        "Personalised muhurat for the lagna based on both kundlis (no extra charge)",
        "Backup pandit on standby in case of emergency",
      ],
    },
    {
      heading: "Marriage Muhurat — When to Book",
      bullets: [
        "Most auspicious months: Magha, Phalguna, Vaishakh, Jyeshtha, Margashirsh",
        "Avoid Chaturmas (Ashadha to Karthik), Pitru Paksha, Kharmas",
        "Best lagnas: Vrishabh, Mithun, Kanya, Tula, Dhanu (varies per kundli)",
        "Book at least 30 days in advance for peak season (Nov–Feb, Apr–Jun)",
        "We share 5–7 muhurat options matched to both birth charts",
      ],
    },
  ],
  faqs: [
    { q: "How much does a marriage puja cost?", a: "₹15,000–₹25,000 for the standard 4-hour vidhi in metros. Multi-day weddings (with separate pandits for engagement, haldi, mehendi, vivah, reception) range ₹50,000–₹1,50,000+. Destination weddings priced separately." },
    { q: "Can the pandit travel for a destination wedding?", a: "Yes — for Goa, Udaipur, Jaipur, Kerala, Bali and any destination, our pandit travels with samagri. Travel and stay billed at actuals." },
    { q: "What if our families follow different traditions?", a: "Our senior pandits are trained in inter-community weddings and can blend rituals from both traditions. We do a pre-wedding alignment call with both families." },
    { q: "Do you provide a Hindi/English translator pandit for NRI weddings?", a: "Yes — for NRI / inter-cultural weddings, the pandit explains every step in English so all guests follow along." },
    { q: "How early should we book?", a: "For peak season (Nov–Feb), 60–90 days in advance. For off-season, 30 days is comfortable. Same-week bookings possible only on a best-effort basis." },
  ],
  finalCtaTitle: "Begin Your Married Life With an Authentic Vedic Ceremony",
  finalCtaSubtitle: "Veda-pathi pandit matched to your tradition, full samagri, personalised muhurat.",
  finalCtaButtons: [
    { label: "Book Marriage Pandit", href: "/puja", variant: "primary" },
    { label: "View Pandits", href: "/pandits", variant: "outline" },
  ],
  relatedLinks: [
    { label: "Online Puja Booking", href: "/online-puja-booking" },
    { label: "Griha Pravesh Puja", href: "/griha-pravesh-puja" },
    { label: "Lakshmi Puja", href: "/lakshmi-puja" },
    { label: "Navgraha Puja", href: "/navgraha-puja" },
    { label: "Verified Pandits", href: "/pandits" },
  ],
  schema: { type: "service", serviceName: "Hindu Marriage Puja Booking" },
};

const PITRA_DOSH_PUJA: SeoLandingPageProps = {
  seoTitle: "Pitra Dosh Puja Booking — Tripindi Shradh, Narayan Bali | Vedic Tatva",
  seoDescription:
    "Book Pitra Dosh Puja online — Tripindi Shradh, Narayan Bali, Nag Bali and Pind Daan at Gaya, Kashi or Haridwar. Verified pandit, full vidhi for ancestral peace, removal of vansh-vriddhi obstacles and progeny issues. Dakshina from ₹5,100.",
  seoKeywords:
    "pitra dosh puja, pitra dosh nivaran, tripindi shradh, narayan bali puja, nag bali puja, pind daan online, pitra paksha shradh, ancestral puja, pitra shanti, pitra dosh remedies, vansh vriddhi puja",
  canonical: "/pitra-dosh-puja",
  breadcrumbs: [
    { name: "Home", url: "/" },
    { name: "Pujas", url: "/puja" },
    { name: "Pitra Dosh Puja", url: "/pitra-dosh-puja" },
  ],
  eyebrow: "Pitra Dosh Puja",
  h1: "Pitra Dosh Puja — Tripindi Shradh, Narayan Bali, Pind Daan",
  subtitle:
    "Pacify ancestral karmic debts with the most powerful Vedic remedies — Tripindi Shradh, Narayan-Nag Bali and Pind Daan at the sacred Pitru Tirthas.",
  heroCTAs: [
    { label: "Book This Puja", href: "/puja", variant: "primary" },
    { label: "Pind Daan Locations", href: "/pind-daan", variant: "outline" },
  ],
  trustChips: ["At Gaya / Kashi / Haridwar", "Verified Pandit", "Full Tripindi Vidhi"],
  intro:
    "Pitra Dosh in the kundli — typically marked by Surya/Rahu in 9th house, Sun-Saturn afflictions, or repeated child loss across generations — indicates unsettled karmic debts of ancestors that obstruct progeny, prosperity and peace in the family. The classical Vedic remedy is a combination of Tripindi Shradh (covers three generations of pitras and pretas), Narayan-Nag Bali (specifically for unnatural deaths in the lineage) and Pind Daan at one of the sacred Pitru Tirthas — Gaya (Vishnupad / Akshayavat), Kashi (Pishachmochan) or Haridwar (Narayani Shila).",
  sections: [
    {
      heading: "Signs of Pitra Dosh in a Family",
      bullets: [
        "Repeated miscarriage, stillbirth or progeny delays across generations",
        "Sudden financial setbacks despite good karma and effort",
        "Recurring health issues without medical explanation",
        "Family disputes, broken relationships, vansh-vriddhi obstacles",
        "Nightmares involving deceased ancestors or unknown elderly figures",
        "Astrological markers — Surya/Rahu in 9th, Pitra Dosh yoga in kundli",
      ],
    },
    {
      heading: "What's Included in the Full Pitra Dosh Remedy",
      bullets: [
        "Tripindi Shradh — covers ancestors of past 3 generations + un-cremated pretas",
        "Narayan Bali — for any unnatural death in the lineage (accident, suicide, untimely)",
        "Nag Bali — for sarpa-dosh component (snake-related curses)",
        "Pind Daan at sacred Pitru Tirtha (Gaya / Kashi / Haridwar / Trimbakeshwar)",
        "108 mantra jaap of Pitra Gayatri",
        "Brahmin bhojan and daan in the name of pitras",
        "Sankalpa-bound to your gotra — valid for the entire family lineage",
      ],
    },
    {
      heading: "Best Time to Perform Pitra Dosh Puja",
      bullets: [
        "Pitru Paksha (16 days before Sharad Navratri) — most powerful window",
        "Amavasya every month — particularly Mahalaya Amavasya",
        "Solar / lunar eclipse days — high karmic clearance potential",
        "Anytime when family is facing the markers above (no need to wait)",
      ],
    },
  ],
  faqs: [
    { q: "How do I know if I have Pitra Dosh?", a: "Three indicators: (1) classical kundli markers, (2) family pattern across generations, (3) recurring obstacles in vansh-vriddhi. Our jyotishi can do a kundli reading first if you're unsure." },
    { q: "Can Pitra Dosh Puja be done online?", a: "Yes — for non-eligible family members the pandit performs the full vidhi at Gaya, Kashi or Haridwar in your gotra and you participate in the Sankalp via video call. We send the photo-video record and prasad-mitti pack." },
    { q: "How much does the full remedy cost?", a: "Basic Tripindi Shradh ₹5,100. Full Narayan-Nag Bali at Trimbakeshwar ₹15,000–₹21,000. Pind Daan at Gaya (3-day vidhi) ₹15,100. Combined Maha-Pitra Yagna ₹35,000+." },
    { q: "Should the entire family attend?", a: "Ideal — but if not possible, the eldest male in the gotra (or eldest member if no male) takes the Sankalp on behalf of the family. Phala extends to all members of the lineage." },
    { q: "Does this need to be repeated annually?", a: "The deep karmic clearance (Tripindi + Narayan Bali + Pind Daan) is once per lifetime per yajamana. Annual Pitru Paksha shradh is a separate yearly observance." },
  ],
  finalCtaTitle: "Settle Ancestral Karmic Debts With a Sastra-Compliant Vedic Remedy",
  finalCtaSubtitle: "Verified pandit at Gaya / Kashi / Haridwar / Trimbakeshwar. Full vidhi for vansh-vriddhi.",
  finalCtaButtons: [
    { label: "Book Pitra Dosh Puja", href: "/puja", variant: "primary" },
    { label: "Pind Daan in Gaya", href: "/pind-daan-gaya", variant: "outline" },
  ],
  relatedLinks: [
    { label: "Pind Daan Gaya", href: "/pind-daan-gaya" },
    { label: "Pind Daan Kashi", href: "/pind-daan-kashi" },
    { label: "Pind Daan Haridwar", href: "/pind-daan-haridwar" },
    { label: "Navgraha Puja", href: "/navgraha-puja" },
    { label: "Verified Pandits", href: "/pandits" },
  ],
  schema: { type: "service", serviceName: "Pitra Dosh Puja & Tripindi Shradh Booking" },
};

const MAHA_MRITYUNJAYA_JAAP: SeoLandingPageProps = {
  seoTitle: "Maha Mrityunjaya Jaap Booking — 1.25 Lakh / 1 Crore Mantra | Vedic Tatva",
  seoDescription:
    "Book Maha Mrityunjaya Jaap online with a verified Veda-pathi pandit. 1.25 lakh, 5 lakh or 1 crore jaap with Rudri Paath and Mahamrityunjaya Homa. For health, longevity, removal of grah-pida and Akal Mrityu Yog. Live online or at temple. Dakshina from ₹5,100.",
  seoKeywords:
    "maha mrityunjaya jaap, mahamrityunjaya mantra jaap, mahamrityunjaya homa, mrityunjaya puja booking, online mahamrityunjaya jaap, sava lakh jaap, 1.25 lakh mahamrityunjaya, akal mrityu shanti, health remedy puja, longevity puja, shiva mantra jaap",
  canonical: "/maha-mrityunjaya-jaap",
  breadcrumbs: [
    { name: "Home", url: "/" },
    { name: "Pujas", url: "/puja" },
    { name: "Maha Mrityunjaya Jaap", url: "/maha-mrityunjaya-jaap" },
  ],
  eyebrow: "Maha Mrityunjaya Jaap",
  h1: "Maha Mrityunjaya Jaap — Sava Lakh, 5 Lakh & 1 Crore Mantra Booking",
  subtitle:
    "The supreme Vedic mantra for health, longevity and protection from Akal Mrityu. Veda-pathi pandits perform the full jaap with Rudri Paath and Mahamrityunjaya Homa.",
  heroCTAs: [
    { label: "Book This Jaap", href: "/puja", variant: "primary" },
    { label: "Talk to a Jyotishi", href: "/astrology", variant: "outline" },
  ],
  trustChips: ["Veda-Pathi Pandits", "Rudri Paath Included", "Live Sankalp"],
  intro:
    "The Maha Mrityunjaya Mantra ('Tryambakam Yajamahe…') from the Rig Veda is considered the most powerful Vedic mantra for health, healing, longevity and protection from untimely death. Booked when a family member is critically ill, before major surgery, during Shani Sade Sati, when Akal Mrityu Yog is present in the kundli, or simply for sustained well-being. Vedic Tatva pandits perform the jaap in three traditional formats — Sava Lakh (1.25 lakh), Maha (5 lakh) and Koti (1 crore) — at sacred Shiva temples with full Rudri Paath and Mahamrityunjaya Homa.",
  sections: [
    {
      heading: "When to Book Maha Mrityunjaya Jaap",
      bullets: [
        "Family member is critically ill, in ICU or facing major surgery",
        "Akal Mrityu Yog or Brahma Shoola yoga in the kundli",
        "Shani Sade Sati or Mahadasha of a malefic planet",
        "Recurring serious health issues, accidents or near-misses",
        "Mental health struggles — depression, anxiety, addiction",
        "Annual sankalp for sustained family well-being",
        "Janmotsav (birthday) jaap for longevity blessings",
      ],
    },
    {
      heading: "The Three Traditional Jaap Counts",
      bullets: [
        "Sava Lakh (1.25 lakh) — the standard jaap, completes in 3–5 days, ₹5,100–₹11,000",
        "Maha (5 lakh) — for serious health issues, completes in 10–15 days, ₹25,000–₹45,000",
        "Koti (1 crore / 100 lakh) — performed by 11–21 pandits over 30–45 days, ₹2,00,000+",
        "All formats include Rudri Paath and Mahamrityunjaya Homa with samidha-ahuti",
        "Daily progress photos, jaap-counter video and final aashirvaad video shared",
      ],
    },
    {
      heading: "Where the Jaap Is Performed",
      bullets: [
        "Trimbakeshwar Jyotirlinga, Mahakaleshwar Ujjain, Kashi Vishwanath",
        "Omkareshwar, Somnath, Bhimashankar, Ghrishneshwar — any Jyotirlinga of your choice",
        "Local Shiva temple in your city if you wish to attend in person",
        "Your home altar — for sankalp-only jaap with daily reporting",
      ],
    },
  ],
  faqs: [
    { q: "How long does a 1.25 lakh jaap take?", a: "3–5 days when one pandit performs full-time, or 1 day when 11 pandits do it together (Lakshchandi-style group jaap). The Mahamrityunjaya Homa is done at the end on day 1 or last day." },
    { q: "Can the patient be in a different country?", a: "Yes — the Sankalp is taken in the patient's name and gotra by a family proxy, and the patient joins the Sankalp video call. Sastra-compliant for NRI families." },
    { q: "Should I combine with Navgraha Puja?", a: "Strongly recommended for Sade Sati or planetary mahadasha cases. The combined Mahamrityunjaya + Navgraha package (₹15,000–₹25,000) is our most-booked health remedy." },
    { q: "How quickly will I see effects?", a: "Spiritual remedies work cumulatively. Most yajamana families report subjective improvement within 11–21 days. Critical-care families often book the jaap during the medical treatment period as parallel sastra-support." },
    { q: "Will I receive any prasad or proof?", a: "Yes — daily WhatsApp photo of the jaap, video of the final homa, and a courier of bibhuti, rudraksha-mala (used for jaap) and prasad pack to your address." },
  ],
  finalCtaTitle: "Invoke the Supreme Vedic Mantra for Health & Longevity",
  finalCtaSubtitle: "Veda-pathi pandits, Sava Lakh / Maha / Koti formats, performed at Jyotirlingas.",
  finalCtaButtons: [
    { label: "Book Mahamrityunjaya Jaap", href: "/puja", variant: "primary" },
    { label: "Get a Kundli Reading", href: "/astrology", variant: "outline" },
  ],
  relatedLinks: [
    { label: "Online Puja Booking", href: "/online-puja-booking" },
    { label: "Rudrabhishek Puja", href: "/rudrabhishek-puja" },
    { label: "Navgraha Puja", href: "/navgraha-puja" },
    { label: "Pitra Dosh Puja", href: "/pitra-dosh-puja" },
    { label: "Verified Pandits", href: "/pandits" },
  ],
  schema: { type: "service", serviceName: "Maha Mrityunjaya Jaap Booking" },
};

const DAILY_RASHIFAL: SeoLandingPageProps = {
  seoTitle: "Aaj Ka Rashifal — Free Daily Horoscope for All 12 Zodiac Signs | Vedic Tatva",
  seoDescription:
    "Read accurate aaj ka rashifal in Hindi & English for all 12 zodiac signs. Free daily horoscope for love, career, money and health — Vedic Jyotish + Western astrology, lucky number, lucky colour and lucky direction updated every morning.",
  seoKeywords:
    "aaj ka rashifal, daily horoscope, daily rashifal, today horoscope, today rashifal, free daily horoscope, rashifal in hindi, vedic daily horoscope, mesh rashi today, vrishabh rashi today, mithun rashifal today, kark rashi today, singh rashi today, kanya rashi today, tula rashi today, vrishchik rashi today, dhanu rashi today, makar rashi today, kumbh rashi today, meen rashi today, lucky number today, lucky color today",
  canonical: "/daily-rashifal",
  breadcrumbs: [
    { name: "Home", url: "/" },
    { name: "Astrology", url: "/zodiac-rashifal" },
    { name: "Daily Rashifal", url: "/daily-rashifal" },
  ],
  eyebrow: "Aaj Ka Rashifal",
  h1: "Daily Rashifal — Free Aaj Ka Rashifal for All 12 Zodiac Signs",
  subtitle:
    "Fresh every morning. Read your day's horoscope in Hindi or English — love, career, finance and health — based on the live tithi, nakshatra and planetary positions.",
  heroCTAs: [
    { label: "Open Today's Rashifal", href: "/zodiac-rashifal", variant: "primary" },
    { label: "Talk to a Jyotishi", href: "/astrology", variant: "outline" },
  ],
  trustChips: ["Updated Daily", "Hindi + English", "Vedic & Western"],
  intro:
    "Aaj ka rashifal is your daily cosmic weather report — a quick read of how today's planetary positions, tithi and nakshatra are influencing your rashi. Vedic Tatva publishes accurate daily predictions for all 12 zodiac signs in both Vedic Jyotish (Moon-sign based) and Western (Sun-sign based) systems, including lucky colour, lucky number, lucky direction, what to do today and what to avoid. Use it to plan your meetings, your love conversations, your money decisions and even your meals.",
  sections: [
    {
      heading: "What your daily rashifal covers",
      bullets: [
        "Overall day rating (1–10) and mood for your sign",
        "Love & relationships — favourable hours and conversations to have",
        "Career & profession — best time to pitch, sign or wait",
        "Finance — when to invest, when to hold, lucky purchase directions",
        "Health & wellness — body areas to watch, foods that suit today's energy",
        "Lucky colour, lucky number, lucky direction and lucky time slot",
        "Do today / Avoid today — short, actionable Vedic guidance",
      ],
    },
    {
      heading: "Vedic vs Western daily horoscope — which is more accurate?",
      bullets: [
        "Vedic rashifal uses your Janma Rashi (Moon sign at birth) — more personal and emotionally accurate",
        "Western horoscope uses your Sun sign (date of birth only) — captures personality and ego",
        "Most Indian astrologers consider the Vedic Moon-sign rashifal more reliable for daily decisions",
        "If your birth time is unknown, the Western sun-sign rashifal still works — switch with one tap on Vedic Tatva",
      ],
    },
    {
      heading: "How to use your aaj ka rashifal",
      bullets: [
        "Read it before 10 am for the full day's planning advantage",
        "Note the lucky colour and try to wear at least one accent piece in that shade",
        "Plan important calls or pitches in the lucky time slot",
        "Avoid signing contracts during the day's rahu-kaal window",
        "Pair the rashifal with the day's panchang for the deepest read",
      ],
    },
  ],
  faqs: [
    { q: "When is the new daily rashifal published?", a: "Fresh predictions for all 12 rashis are published every morning before 6 am IST, based on the day's tithi, nakshatra, yoga and karana." },
    { q: "Is it really free? Do I need to log in?", a: "Yes — fully free, no login required for any of the 12 rashis in either Vedic or Western system." },
    { q: "How is your daily horoscope different from newspaper rashifal?", a: "We compute daily predictions live from the actual planetary positions for each sign, combined with the day's panchang. Newspaper rashifal is usually generic and pre-written days in advance." },
    { q: "Which rashi should I read — Sun sign or Moon sign?", a: "If you know your birth time, read your Vedic Moon-sign (Janma Rashi) rashifal — it's far more personal. If you don't know your birth time, your Sun-sign Western horoscope still applies." },
    { q: "Can I get tomorrow's (kal ka) rashifal in advance?", a: "Yes — Premium members can read kal ka rashifal a day ahead. Free users get today's prediction." },
  ],
  finalCtaTitle: "Start your day with the right cosmic alignment",
  finalCtaSubtitle: "Free aaj ka rashifal for all 12 signs — Vedic + Western, in Hindi & English.",
  finalCtaButtons: [
    { label: "Read Today's Rashifal", href: "/zodiac-rashifal", variant: "primary" },
    { label: "Generate My Free Kundli", href: "/ai-kundli", variant: "outline" },
  ],
  relatedLinks: [
    { label: "Weekly Rashifal", href: "/weekly-rashifal" },
    { label: "Monthly Horoscope", href: "/monthly-horoscope" },
    { label: "Yearly Horoscope 2026", href: "/yearly-horoscope-2026" },
    { label: "Zodiac Compatibility", href: "/zodiac-compatibility" },
    { label: "Lucky Number Today", href: "/lucky-number-today" },
    { label: "Free Kundli", href: "/ai-kundli" },
  ],
  schema: { type: "article", datePublished: TODAY_ISO },
};

const WEEKLY_RASHIFAL: SeoLandingPageProps = {
  seoTitle: "Saptahik Rashifal — Free Weekly Horoscope for All 12 Zodiac Signs | Vedic Tatva",
  seoDescription:
    "Read your saptahik rashifal in Hindi & English — accurate weekly horoscope predictions for love, career, money and health. Plan your week with Vedic astrology guidance for all 12 rashis.",
  seoKeywords:
    "saptahik rashifal, weekly rashifal, weekly horoscope, weekly horoscope in hindi, this week horoscope, weekly rashifal in hindi, mesh saptahik rashifal, vrishabh weekly horoscope, mithun saptahik, kark weekly, singh weekly, kanya weekly, tula weekly, vrishchik weekly, dhanu weekly, makar weekly, kumbh weekly, meen weekly, weekly love horoscope, weekly career horoscope",
  canonical: "/weekly-rashifal",
  breadcrumbs: [
    { name: "Home", url: "/" },
    { name: "Astrology", url: "/zodiac-rashifal" },
    { name: "Weekly Rashifal", url: "/weekly-rashifal" },
  ],
  eyebrow: "Saptahik Rashifal",
  h1: "Weekly Rashifal — Plan Your Week with Vedic Astrology",
  subtitle:
    "Saptahik rashifal for all 12 zodiac signs in Hindi and English. See which days favour love, money, contracts and travel — and which days to lay low.",
  heroCTAs: [
    { label: "Read Weekly Rashifal", href: "/zodiac-rashifal", variant: "primary" },
    { label: "Find a Shubh Muhurat", href: "/muhurat-finder", variant: "outline" },
  ],
  trustChips: ["Refreshed Every Monday", "Day-Wise Highlights", "Vedic + Western"],
  intro:
    "Your saptahik rashifal is the seven-day cosmic forecast for your rashi — far more useful than daily for planning meetings, travel, financial decisions and family events. Each Monday, Vedic Tatva publishes detailed weekly horoscope predictions for all 12 zodiac signs, identifying the most favourable day of the week for each life area — love, career, finance, health and family.",
  sections: [
    {
      heading: "What your weekly rashifal covers",
      bullets: [
        "Day-wise highlights — best day of the week for love, money, work, travel",
        "Weekly love and relationship outlook with compatible signs",
        "Career and business predictions — pitches, signings, interviews",
        "Money and finance — favourable days to invest or transact",
        "Health and wellness — energy peaks and dips through the week",
        "Lucky day, lucky colour and lucky number for the full week",
        "Caution windows — rahu-kaal heavy days, malefic transits to avoid",
      ],
    },
    {
      heading: "Why a weekly horoscope beats a daily one",
      bullets: [
        "Lets you batch decisions to the most auspicious day of the week",
        "Captures planetary day-of-week effects (Mon/Moon, Tue/Mars, Wed/Mercury, etc.)",
        "Gives breathing room to schedule shubh muhurats for big decisions",
        "Useful for working professionals planning Monday–Friday work weeks",
      ],
    },
    {
      heading: "How to read your saptahik rashifal",
      bullets: [
        "Read it Sunday evening or Monday morning to plan the week",
        "Note the strongest planetary day for your rashi — do important work then",
        "Schedule romantic dinners on the love-favourable day",
        "Pair with our Muhurat Finder for any major event during the week",
      ],
    },
  ],
  faqs: [
    { q: "When is the new weekly rashifal published?", a: "Every Monday morning before 6 am IST — covering Monday through Sunday for all 12 signs." },
    { q: "Is the weekly horoscope free?", a: "Yes — completely free for all 12 zodiac signs in both Vedic and Western systems." },
    { q: "What's the difference between daily and weekly rashifal?", a: "Daily rashifal gives day-by-day cosmic weather. Weekly gives you the seven-day pattern — far better for planning meetings, travel and big purchases." },
    { q: "Can I get next week's rashifal in advance?", a: "Yes — Premium members can read next week's saptahik rashifal a week ahead. Free users get the current week." },
    { q: "Is there a separate weekly love horoscope?", a: "Yes — every weekly rashifal includes a dedicated love and relationships section with compatible signs and the best date-night day for your rashi." },
  ],
  finalCtaTitle: "Plan your week with the planets, not against them",
  finalCtaSubtitle: "Free saptahik rashifal for all 12 signs — refreshed every Monday morning.",
  finalCtaButtons: [
    { label: "Read Weekly Rashifal", href: "/zodiac-rashifal", variant: "primary" },
    { label: "Find Shubh Muhurat", href: "/muhurat-finder", variant: "outline" },
  ],
  relatedLinks: [
    { label: "Daily Rashifal", href: "/daily-rashifal" },
    { label: "Monthly Horoscope", href: "/monthly-horoscope" },
    { label: "Yearly Horoscope 2026", href: "/yearly-horoscope-2026" },
    { label: "Zodiac Compatibility", href: "/zodiac-compatibility" },
    { label: "Panchang Today", href: "/panchang-calendar" },
  ],
  schema: { type: "article", datePublished: TODAY_ISO },
};

const MONTHLY_HOROSCOPE: SeoLandingPageProps = {
  seoTitle: "Maasik Rashifal — Free Monthly Horoscope for All 12 Zodiac Signs | Vedic Tatva",
  seoDescription:
    "Read your maasik rashifal — accurate monthly horoscope predictions for all 12 rashis in Hindi & English. Plan major life events with Vedic + Western astrology forecasts for love, career, finance and health.",
  seoKeywords:
    "maasik rashifal, monthly rashifal, monthly horoscope, monthly horoscope in hindi, this month horoscope, mesh maasik rashifal, vrishabh monthly horoscope, mithun maasik, kark monthly, singh monthly, kanya monthly, tula monthly, vrishchik monthly, dhanu monthly, makar monthly, kumbh monthly, meen monthly, monthly love prediction, monthly money horoscope, monthly career astrology",
  canonical: "/monthly-horoscope",
  breadcrumbs: [
    { name: "Home", url: "/" },
    { name: "Astrology", url: "/zodiac-rashifal" },
    { name: "Monthly Horoscope", url: "/monthly-horoscope" },
  ],
  eyebrow: "Maasik Rashifal",
  h1: "Monthly Horoscope — Maasik Rashifal for All 12 Zodiac Signs",
  subtitle:
    "Plan your month with Vedic astrology — sankranti transits, festival muhurats, love windows, money days and health watch-outs for each rashi.",
  heroCTAs: [
    { label: "Read Monthly Horoscope", href: "/zodiac-rashifal", variant: "primary" },
    { label: "Get Premium Kundli", href: "/premium-kundli-pdf", variant: "outline" },
  ],
  trustChips: ["New on the 1st", "Sankranti-Aware", "Vedic + Western"],
  intro:
    "Your maasik rashifal is the 30-day forecast for your rashi — built around the month's sankranti (Sun ingress), the major planetary transits and the festival calendar. Vedic Tatva publishes a fresh monthly horoscope on the 1st of every month for all 12 zodiac signs, identifying the most favourable two-week window for love, money, contracts, travel and family events.",
  sections: [
    {
      heading: "What your monthly rashifal includes",
      bullets: [
        "Month-at-a-glance summary and overall theme for your rashi",
        "Sankranti transit and how it shifts your rashi's energy",
        "Best week of the month for love, marriage talks and proposals",
        "Best week for career moves, job changes, business launches",
        "Money and investment outlook — favourable and risky dates",
        "Health and wellness — body systems to nurture this month",
        "Major festivals and recommended pujas for your rashi",
        "Lucky days, lucky colour, lucky number, lucky direction",
      ],
    },
    {
      heading: "Major planetary events to watch this month",
      bullets: [
        "Surya Sankranti — the Sun's monthly sign change reshapes all 12 rashis",
        "Chandra Gochar — the Moon's transit through your rashi (your most emotional days)",
        "Mercury, Venus and Mars sign changes — career, love and energy shifts",
        "Any retrograde periods — dates to avoid major decisions",
        "Solar/lunar eclipses if applicable in the month",
      ],
    },
    {
      heading: "How to use your monthly horoscope",
      bullets: [
        "Read it on the 1st of the month before making any major plans",
        "Highlight the favourable dates in your calendar",
        "Schedule big-ticket purchases on the money-favourable dates",
        "Plan major pujas (Satyanarayan, Mahalakshmi) on the recommended muhurats",
        "Use the caution dates to slow down — not stop, just be vigilant",
      ],
    },
  ],
  faqs: [
    { q: "When is the new monthly horoscope published?", a: "On the 1st of every month before 6 am IST, covering the full month for all 12 zodiac signs." },
    { q: "Is the maasik rashifal free?", a: "Yes — completely free for all 12 rashis in both Vedic and Western systems." },
    { q: "How is monthly rashifal different from yearly?", a: "Monthly is built around the month's sankranti and weekly transits — practical for planning. Yearly captures the year's mahadasha and big planetary moves — strategic for life decisions." },
    { q: "Should I read this with my kundli?", a: "Yes — for the deepest read, pair the monthly transits with your full Vedic kundli to see exactly which kundli houses are being activated this month." },
    { q: "Can I get next month's rashifal in advance?", a: "Yes — Premium members get next month's maasik rashifal a month ahead. Free users get the current month." },
  ],
  finalCtaTitle: "Plan your month with the planets, not just your calendar",
  finalCtaSubtitle: "Free maasik rashifal for all 12 signs — refreshed on the 1st of every month.",
  finalCtaButtons: [
    { label: "Read Monthly Horoscope", href: "/zodiac-rashifal", variant: "primary" },
    { label: "Get Premium Kundli PDF", href: "/premium-kundli-pdf", variant: "outline" },
  ],
  relatedLinks: [
    { label: "Daily Rashifal", href: "/daily-rashifal" },
    { label: "Weekly Rashifal", href: "/weekly-rashifal" },
    { label: "Yearly Horoscope 2026", href: "/yearly-horoscope-2026" },
    { label: "Panchang Today", href: "/panchang-calendar" },
    { label: "Shubh Muhurat Finder", href: "/muhurat-finder" },
  ],
  schema: { type: "article", datePublished: TODAY_ISO },
};

const YEARLY_HOROSCOPE_2026: SeoLandingPageProps = {
  seoTitle: "Varshik Rashifal 2026 — Yearly Horoscope for All 12 Zodiac Signs | Vedic Tatva",
  seoDescription:
    "Varshik rashifal 2026 — accurate yearly horoscope for all 12 rashis. Read your Vedic + Western yearly predictions for love, marriage, career, finance and health, including Saturn, Jupiter, Rahu-Ketu transits and Sade Sati update.",
  seoKeywords:
    "varshik rashifal 2026, yearly rashifal, yearly horoscope 2026, 2026 horoscope, year ahead astrology, mesh varshik rashifal 2026, vrishabh yearly horoscope, mithun yearly, kark yearly, singh yearly, kanya yearly, tula yearly, vrishchik yearly, dhanu yearly, makar yearly, kumbh yearly, meen yearly, sade sati 2026, jupiter transit 2026, rahu ketu transit 2026, kundli based yearly prediction",
  canonical: "/yearly-horoscope-2026",
  breadcrumbs: [
    { name: "Home", url: "/" },
    { name: "Astrology", url: "/zodiac-rashifal" },
    { name: "Yearly Horoscope 2026", url: "/yearly-horoscope-2026" },
  ],
  eyebrow: "Varshik Rashifal 2026",
  h1: "Yearly Horoscope 2026 — Varshik Rashifal for All 12 Zodiac Signs",
  subtitle:
    "Your full 2026 forecast — Saturn transit, Jupiter blessings, Rahu-Ketu axis shift and Sade Sati update for every rashi, in Vedic + Western systems.",
  heroCTAs: [
    { label: "Read 2026 Yearly Forecast", href: "/zodiac-rashifal", variant: "primary" },
    { label: "Talk to a Vedic Astrologer", href: "/astrology", variant: "outline" },
  ],
  trustChips: ["12 Rashis Covered", "Transit-Aware", "Vedic + Western"],
  intro:
    "The varshik rashifal 2026 is your year-long cosmic strategy — built around the major planetary moves of 2026: Saturn's transit through Kumbh and Meen, Jupiter's blessing on specific rashis, the Rahu-Ketu nodal axis shift, the year's eclipses, and the ongoing Shani Sade Sati phases for Vrishchik, Dhanu and Makar. Vedic Tatva publishes deep yearly forecasts for all 12 zodiac signs across love, marriage, career, finance, health, family and spiritual growth.",
  sections: [
    {
      heading: "Major planetary events of 2026",
      bullets: [
        "Shani Gochar (Saturn transit) — discipline, karma and Sade Sati updates",
        "Guru Gochar (Jupiter transit) — wisdom, marriage, children and wealth blessings",
        "Rahu-Ketu axis shift — desire, detachment and karmic destiny rewrites",
        "Mercury, Venus and Mars retrogrades — when to slow down",
        "Solar and lunar eclipses 2026 — high-impact karma windows",
      ],
    },
    {
      heading: "What your varshik rashifal covers",
      bullets: [
        "Year-at-a-glance theme and overall rating for your rashi",
        "Love and marriage prospects for 2026 — best months for proposals & wedding",
        "Career and business — promotions, job changes, ventures, expansions",
        "Finance and wealth — investment cycles, property purchases, debt clearance",
        "Health and wellness — body systems to monitor through the year",
        "Family, children and parents — milestones, watch-outs and rituals",
        "Spiritual growth — recommended sadhana, pujas and yatra for the year",
        "Lucky months, lucky colours and lucky gemstones for 2026",
      ],
    },
    {
      heading: "Sade Sati update for 2026",
      bullets: [
        "Vrishchik (Scorpio) — exit phase of Sade Sati, relief and rebuilding",
        "Dhanu (Sagittarius) — peak phase, deepest karmic lessons of the cycle",
        "Makar (Capricorn) — entry/middle phase, expansion of responsibility",
        "Recommended remedies — Maha Mrityunjaya Jaap, Shani puja, donations",
      ],
    },
  ],
  faqs: [
    { q: "When is the varshik rashifal 2026 published?", a: "Yearly forecasts go live on the eve of the new Vikram Samvat year (around mid-March) and stay updated through the calendar year." },
    { q: "Is the yearly horoscope free?", a: "Yes — full year-long forecasts for all 12 zodiac signs are free in both Vedic and Western systems." },
    { q: "How accurate is the yearly forecast?", a: "Yearly rashifal captures the major planetary moves of the year — strategic guidance. For pin-point accuracy on personal events, pair it with your full Vedic kundli analysis or a 1-on-1 astrologer consultation." },
    { q: "What's the difference between yearly and lifetime predictions?", a: "Yearly rashifal covers one calendar year. Lifetime predictions need your full kundli's mahadasha-antardasha periods — available in our Premium Kundli PDF." },
    { q: "Should I do a Navgraha or Mahamrityunjaya puja for the year?", a: "Recommended if you're in Sade Sati, mahadasha of a malefic graha, or facing repeated obstacles. Read your varshik rashifal first to see what your year specifically calls for." },
  ],
  finalCtaTitle: "Make 2026 the year you stop fighting the cosmos",
  finalCtaSubtitle: "Free varshik rashifal 2026 for all 12 signs — Vedic + Western forecasts.",
  finalCtaButtons: [
    { label: "Read 2026 Yearly Rashifal", href: "/zodiac-rashifal", variant: "primary" },
    { label: "Get Premium Kundli PDF", href: "/premium-kundli-pdf", variant: "outline" },
  ],
  relatedLinks: [
    { label: "Daily Rashifal", href: "/daily-rashifal" },
    { label: "Weekly Rashifal", href: "/weekly-rashifal" },
    { label: "Monthly Horoscope", href: "/monthly-horoscope" },
    { label: "Maha Mrityunjaya Jaap", href: "/maha-mrityunjaya-jaap" },
    { label: "Navgraha Puja", href: "/navgraha-puja" },
  ],
  schema: { type: "article", datePublished: TODAY_ISO },
};

const ZODIAC_COMPATIBILITY: SeoLandingPageProps = {
  seoTitle: "Zodiac Compatibility — Rashi Love & Marriage Match Guide | Vedic Tatva",
  seoDescription:
    "Discover which zodiac signs are most compatible for love, marriage and friendship. Free rashi compatibility guide using Vedic Ashtakoot Guna Milan + Western sun-sign matching for all 12 signs.",
  seoKeywords:
    "zodiac compatibility, rashi compatibility, zodiac sign love match, zodiac marriage compatibility, best zodiac compatibility guide, zodiac compatibility chart, ashtakoot guna milan, sun sign compatibility, vedic compatibility, mesh compatibility, vrishabh compatibility, kark compatibility, singh compatibility, vrishchik compatibility, makar compatibility, love marriage astrology prediction",
  canonical: "/zodiac-compatibility",
  breadcrumbs: [
    { name: "Home", url: "/" },
    { name: "Astrology", url: "/zodiac-rashifal" },
    { name: "Zodiac Compatibility", url: "/zodiac-compatibility" },
  ],
  eyebrow: "Love & Marriage Astrology",
  h1: "Zodiac Compatibility — Find Your Most Compatible Rashi",
  subtitle:
    "Vedic Ashtakoot Guna Milan + Western sun-sign compatibility — see which rashis are made for you in love, marriage and friendship.",
  heroCTAs: [
    { label: "Match My Kundli (Free)", href: "/ai-kundli", variant: "primary" },
    { label: "Talk to a Match Astrologer", href: "/astrology", variant: "outline" },
  ],
  trustChips: ["Ashtakoot Guna Milan", "Vedic + Western", "Free Compatibility"],
  intro:
    "Zodiac compatibility is the ancient science of seeing whether two souls have the planetary chemistry to thrive together. In Vedic tradition, the gold standard is the 36-point Ashtakoot Guna Milan — eight koots of rashi-nakshatra matching covering everything from mental compatibility (Manas Maitri) to progeny (Santati). Western astrology checks sun-sign chemistry across elements (fire, earth, air, water) and modalities (cardinal, fixed, mutable). Vedic Tatva combines both — giving you the deepest possible compatibility read for love, marriage and friendship.",
  sections: [
    {
      heading: "The 8 koots of Ashtakoot Guna Milan",
      bullets: [
        "Varna (1 point) — spiritual compatibility and ego match",
        "Vashya (2 points) — mutual attraction and dominance balance",
        "Tara (3 points) — birth star compatibility and well-being",
        "Yoni (4 points) — physical and sexual compatibility",
        "Graha Maitri (5 points) — mental and intellectual harmony",
        "Gana (6 points) — temperament — Deva, Manushya or Rakshasa",
        "Bhakoot (7 points) — emotional connection and family welfare",
        "Nadi (8 points) — health and progeny compatibility (most important)",
      ],
    },
    {
      heading: "Best zodiac compatibility pairs (Vedic Moon-sign)",
      bullets: [
        "Mesh + Singh / Dhanu — fiery passion, shared ambition",
        "Vrishabh + Kanya / Makar — earthy stability, shared values",
        "Mithun + Tula / Kumbh — intellectual spark, free-spirited bond",
        "Kark + Vrishchik / Meen — emotional depth, soul-level care",
        "Singh + Mesh / Dhanu — magnetic charisma, mutual admiration",
        "Kanya + Vrishabh / Makar — quiet, dependable, long-term",
      ],
    },
    {
      heading: "Compatibility red flags to check",
      bullets: [
        "Nadi Dosha — same Nadi (Adi/Madhya/Antya) reduces health & progeny score",
        "Bhakoot Dosha — 6-8 or 9-5 rashi positions — strains family welfare",
        "Mangal Dosha (Manglik) — needs cross-checking on both kundlis",
        "Graha Yuti — afflicted Venus, Jupiter or 7th house in either chart",
        "Below 18/36 Guna score — generally not recommended for marriage",
      ],
    },
  ],
  faqs: [
    { q: "What is the minimum Guna score for marriage?", a: "Traditional shastra recommends a minimum of 18 out of 36 Gunas. 24+ is excellent, 30+ is rare and considered a divine match." },
    { q: "Is sun-sign or moon-sign compatibility more accurate?", a: "Vedic Moon-sign (rashi) compatibility is far more accurate than Western Sun-sign because it accounts for emotional and karmic chemistry. Use sun-sign as a quick filter; use rashi-Guna Milan for marriage decisions." },
    { q: "What if our Guna score is low — is the match doomed?", a: "Not necessarily. Many low-Guna couples thrive. The score is a guide; the full kundli analysis matters more — including doshas, dasha periods and 7th-house strength." },
    { q: "Do you offer free Kundli Matching?", a: "Yes — generate your free kundli on Vedic Tatva and our system performs Ashtakoot Guna Milan with any partner kundli at no cost." },
    { q: "What about same-sign or 6-8 axis couples?", a: "Same-sign (Naadi sahabhog) is workable with the right doshanivaran. 6-8 (Shadashtak) is challenging but resolvable through specific pujas — consult our astrologers." },
  ],
  finalCtaTitle: "See if your rashis were made for each other",
  finalCtaSubtitle: "Free Ashtakoot Guna Milan kundli matching for all 12 zodiac sign pairs.",
  finalCtaButtons: [
    { label: "Match Kundli for Free", href: "/ai-kundli", variant: "primary" },
    { label: "Talk to a Match Astrologer", href: "/astrology", variant: "outline" },
  ],
  relatedLinks: [
    { label: "Kundli Matching", href: "/kundli-matching" },
    { label: "Marriage Puja", href: "/marriage-puja" },
    { label: "Daily Rashifal", href: "/daily-rashifal" },
    { label: "Nakshatra Predictions", href: "/nakshatra-predictions" },
    { label: "Free Kundli", href: "/ai-kundli" },
  ],
  schema: { type: "article", datePublished: TODAY_ISO },
};

const LUCKY_NUMBER_TODAY: SeoLandingPageProps = {
  seoTitle: "Lucky Number Today — Free Daily Lucky Number, Colour & Direction | Vedic Tatva",
  seoDescription:
    "Find your lucky number today, lucky colour, lucky gemstone and lucky direction for all 12 zodiac signs. Free daily numerology + Vedic astrology tool — updated every morning for love, money and career luck.",
  seoKeywords:
    "lucky number today, lucky color today, lucky number for today, daily lucky number, daily lucky color, today lucky number for me, lucky direction today, lucky gemstone today, lucky number by date of birth, numerology lucky number, zodiac lucky number, mesh lucky number, kark lucky number, singh lucky number, makar lucky number, lucky color and lucky number today",
  canonical: "/lucky-number-today",
  breadcrumbs: [
    { name: "Home", url: "/" },
    { name: "Astrology", url: "/zodiac-rashifal" },
    { name: "Lucky Number Today", url: "/lucky-number-today" },
  ],
  eyebrow: "Daily Luck Indicator",
  h1: "Lucky Number Today — Daily Lucky Number, Colour & Direction",
  subtitle:
    "Your aaj ka lucky number, lucky colour, lucky gemstone and lucky direction — refreshed daily for all 12 zodiac signs based on the day's planetary lord.",
  heroCTAs: [
    { label: "Reveal Today's Lucky Number", href: "/zodiac-rashifal", variant: "primary" },
    { label: "Get Numerology Reading", href: "/numerology-predictions", variant: "outline" },
  ],
  trustChips: ["Refreshed Daily", "All 12 Rashis", "Numerology + Vedic"],
  intro:
    "Your lucky number today isn't a single static digit — it shifts with the day's planetary lord, your rashi and your moolank (birth number from numerology). Vedic Tatva combines all three to give you the most accurate daily lucky number, lucky colour, lucky direction and lucky gemstone — small alignments that compound into real luck across love, money and work.",
  sections: [
    {
      heading: "How your daily lucky number is calculated",
      bullets: [
        "Day-of-week planetary lord (Mon/Moon → 2, Tue/Mars → 9, Wed/Mercury → 5, etc.)",
        "Your rashi's ruling graha and its current transit",
        "Your moolank — birth-date single digit (1–9)",
        "Your bhagyank — full birth-date sum (destiny number)",
        "Combined into one auspicious 1–9 daily number",
      ],
    },
    {
      heading: "What today's luck pack gives you",
      bullets: [
        "Lucky number — for lottery, codes, seat picks, decisions",
        "Lucky colour — wear at least one accent piece in this shade",
        "Lucky direction — face this way for important calls or meditation",
        "Lucky gemstone — touch or wear, especially during the lucky time slot",
        "Lucky time slot — the day's most favourable 1-hour window",
        "Lucky alphabet — for naming, signing, important communications",
      ],
    },
    {
      heading: "How to use your lucky pack today",
      bullets: [
        "Wear the lucky colour as a tie, dupatta, blouse or pocket-square",
        "Schedule big calls in the lucky time slot facing the lucky direction",
        "Avoid signing important documents during the day's rahu-kaal",
        "Touch your lucky gemstone before any high-stakes meeting",
        "Use the lucky number for app PINs, ticket choices, raffle entries",
      ],
    },
  ],
  faqs: [
    { q: "How is my daily lucky number different from my permanent lucky number?", a: "Your permanent lucky number (moolank) is fixed by your birth date. Your daily lucky number shifts with the day's planetary lord and your rashi's transit — both matter." },
    { q: "Is the lucky number really lucky for lottery / gambling?", a: "Vedic and numerology systems describe favourability for decisions and luck, not gambling outcomes specifically. We don't endorse using these for gambling — use them for genuine life decisions." },
    { q: "Why does my lucky colour change every day?", a: "Each weekday is ruled by a different graha — Monday belongs to Chandra (white/silver), Tuesday to Mangal (red), Wednesday to Budh (green), and so on. Your rashi's modifier shifts the daily shade." },
    { q: "Can I wear my lucky gemstone every day?", a: "Some gemstones (ruby, pearl) are gentle and can be worn daily. Others (blue sapphire, hessonite) are powerful and need an astrologer's clearance after a kundli check." },
    { q: "Where can I see my lucky pack for all 12 signs?", a: "Open the daily rashifal page and select your rashi — the lucky number, colour, direction and gemstone are shown right inside the prediction card." },
  ],
  finalCtaTitle: "Wear the right colour. Pick the right number. Face the right way.",
  finalCtaSubtitle: "Free daily lucky pack for all 12 zodiac signs — refreshed every morning.",
  finalCtaButtons: [
    { label: "Reveal Today's Lucky Number", href: "/zodiac-rashifal", variant: "primary" },
    { label: "Numerology Predictions", href: "/numerology-predictions", variant: "outline" },
  ],
  relatedLinks: [
    { label: "Daily Rashifal", href: "/daily-rashifal" },
    { label: "Numerology Predictions", href: "/numerology-predictions" },
    { label: "Nakshatra Predictions", href: "/nakshatra-predictions" },
    { label: "Free Kundli", href: "/ai-kundli" },
    { label: "Panchang Today", href: "/panchang-calendar" },
  ],
  schema: { type: "article", datePublished: TODAY_ISO },
};

const NUMEROLOGY_PREDICTIONS: SeoLandingPageProps = {
  seoTitle: "Numerology Predictions — Free Moolank, Bhagyank & Name Number Reading | Vedic Tatva",
  seoDescription:
    "Free numerology predictions — find your moolank (birth number), bhagyank (destiny number) and naam ank (name number). Discover lucky days, lucky colours, careers and partners aligned with your numerology profile.",
  seoKeywords:
    "numerology predictions, numerology, free numerology reading, moolank, bhagyank, destiny number, name numerology, lucky number by date of birth, numerology calculator, vedic numerology, ank jyotish, numerology compatibility, numerology and zodiac, lucky number numerology, numerology chart, numerology life path",
  canonical: "/numerology-predictions",
  breadcrumbs: [
    { name: "Home", url: "/" },
    { name: "Astrology", url: "/zodiac-rashifal" },
    { name: "Numerology Predictions", url: "/numerology-predictions" },
  ],
  eyebrow: "Ank Jyotish",
  h1: "Numerology Predictions — Moolank, Bhagyank & Name Number Reading",
  subtitle:
    "Discover your birth number, destiny number and name vibration — and how they decide your luckiest careers, partners, days and decisions.",
  heroCTAs: [
    { label: "Get My Numerology Reading", href: "/astrology", variant: "primary" },
    { label: "Find My Lucky Number", href: "/lucky-number-today", variant: "outline" },
  ],
  trustChips: ["Vedic Ank Jyotish", "Birth + Destiny + Name", "Free Reading"],
  intro:
    "Numerology — known in India as Ank Jyotish — is the ancient science of how numbers carry vibrations that shape your destiny. Every person has three primary numbers: Moolank (your birth number, 1–9, ruled by a planet), Bhagyank (your destiny number, the sum of your full birth date), and Naam Ank (your name number, derived from the letters of your full name). When all three are in harmony, you flow with life. When they clash, small adjustments — a name spelling tweak, a different signing initial, a chosen lucky day — can realign your luck.",
  sections: [
    {
      heading: "The three numbers that shape your destiny",
      bullets: [
        "Moolank (Birth Number) — single digit of your birth date (e.g. 23 → 5)",
        "Bhagyank (Destiny Number) — sum of your full DOB (e.g. 23-04-1990 → 28 → 1)",
        "Naam Ank (Name Number) — sum of letter values in your full name",
        "Ruling Planet — every number 1–9 is ruled by a graha (1=Sun, 2=Moon, 3=Jupiter, etc.)",
        "Lucky Day — your moolank's planetary day is your most favourable weekday",
      ],
    },
    {
      heading: "What numerology can predict for you",
      bullets: [
        "Career path that suits your numerological vibration",
        "Compatible partner numbers for love and marriage",
        "Best business name, brand name and signature style",
        "Lucky days, lucky colours, lucky numbers for decisions",
        "Years of major life shifts (personal year cycle)",
        "Whether your name spelling is helping or hindering you",
      ],
    },
    {
      heading: "Moolank meaning at a glance",
      bullets: [
        "1 (Sun) — leader, ambitious, born CEO; lucky day Sunday",
        "2 (Moon) — emotional, intuitive, peace-maker; lucky day Monday",
        "3 (Jupiter) — wise, optimistic, teacher; lucky day Thursday",
        "4 (Rahu) — unconventional, magnetic, risk-taker; lucky day Saturday",
        "5 (Mercury) — communicator, traveller, agile; lucky day Wednesday",
        "6 (Venus) — artist, romantic, family-oriented; lucky day Friday",
        "7 (Ketu) — spiritual, mysterious, researcher; lucky day Monday/Sunday",
        "8 (Saturn) — disciplined, karmic, late bloomer; lucky day Saturday",
        "9 (Mars) — fierce, courageous, warrior; lucky day Tuesday",
      ],
    },
  ],
  faqs: [
    { q: "How do I calculate my moolank?", a: "Take only the day of your birth date and reduce to a single digit. e.g. born on 23 → 2+3 = 5. Your moolank is 5." },
    { q: "Should I change my name spelling for better luck?", a: "Only after a full numerology + kundli consultation. A name change without checking your bhagyank can backfire — it's a real spiritual rewrite, not a casual edit." },
    { q: "What's the difference between numerology and astrology?", a: "Astrology reads the planets at your birth. Numerology reads the vibrational frequency of the numbers in your birth date and name. They overlap — every number is ruled by a planet — and combine for the deepest reading." },
    { q: "Can numerology predict my marriage age or love life?", a: "Numerology indicates compatible partner numbers and favourable years for marriage. For exact predictions, pair it with your full Vedic kundli — that's where dasha-antardasha periods reveal exact marriage windows." },
    { q: "Is numerology really part of Vedic tradition?", a: "Yes — Ank Jyotish is one of the six vedangas connected branches and is referenced in classical Jyotish texts. Modern numerology popularised by Cheiro is a Western evolution of the same root principles." },
  ],
  finalCtaTitle: "Your numbers are talking. Are you listening?",
  finalCtaSubtitle: "Free moolank, bhagyank and name-number reading — uncover your numerological destiny.",
  finalCtaButtons: [
    { label: "Get My Numerology Reading", href: "/astrology", variant: "primary" },
    { label: "Lucky Number Today", href: "/lucky-number-today", variant: "outline" },
  ],
  relatedLinks: [
    { label: "Lucky Number Today", href: "/lucky-number-today" },
    { label: "Daily Rashifal", href: "/daily-rashifal" },
    { label: "Free Kundli", href: "/ai-kundli" },
    { label: "Kundli Matching", href: "/kundli-matching" },
    { label: "Talk to an Astrologer", href: "/astrology" },
  ],
  schema: { type: "article", datePublished: TODAY_ISO },
};

const KUNDLI_MATCHING: SeoLandingPageProps = {
  seoTitle: "Kundli Matching — Free Online Ashtakoot Guna Milan for Marriage | Vedic Tatva",
  seoDescription:
    "Free online kundli matching with full 36-point Ashtakoot Guna Milan. Check rashi, nakshatra, Mangal Dosha, Nadi Dosha and Bhakoot Dosha for marriage compatibility — instant Vedic kundli match report.",
  seoKeywords:
    "kundli matching, kundli milan, free kundli matching, online kundli matching, ashtakoot guna milan, 36 guna milan, marriage kundli matching, kundli compatibility, horoscope matching for marriage, gun milan, mangal dosha check, nadi dosha check, bhakoot dosha, kundli matching by name, kundli matching by date of birth, vedic kundli match, kundli match online free",
  canonical: "/kundli-matching",
  breadcrumbs: [
    { name: "Home", url: "/" },
    { name: "Astrology", url: "/zodiac-rashifal" },
    { name: "Kundli Matching", url: "/kundli-matching" },
  ],
  eyebrow: "Marriage Kundli Match",
  h1: "Kundli Matching — Free Online Ashtakoot Guna Milan",
  subtitle:
    "The 5,000-year-old Vedic kundli matching system used in 100% of Hindu arranged marriages. 36-point Guna Milan + dosha check, free in 60 seconds.",
  heroCTAs: [
    { label: "Match Kundlis for Free", href: "/ai-kundli", variant: "primary" },
    { label: "Talk to a Match Astrologer", href: "/astrology", variant: "outline" },
  ],
  trustChips: ["36-Point Guna Milan", "Dosha Check Included", "Free Report"],
  intro:
    "Kundli matching — Kundli Milan or Guna Milan — is the most important ritual before any Hindu marriage decision. Using the bride's and groom's exact birth details, the Vedic system calculates 36 Gunas across 8 koots (Varna, Vashya, Tara, Yoni, Graha Maitri, Gana, Bhakoot and Nadi) and checks for Mangal Dosha, Nadi Dosha, Bhakoot Dosha and other red flags. Vedic Tatva offers free online kundli matching with the full Ashtakoot report in under 60 seconds — and 1-on-1 astrologer consultations if your match needs a deeper read.",
  sections: [
    {
      heading: "What our free kundli match report includes",
      bullets: [
        "Full 36-point Ashtakoot Guna Milan with breakdown by koot",
        "Mangal Dosha (Manglik) check on both kundlis",
        "Nadi Dosha and Bhakoot Dosha check",
        "Rashi and Nakshatra compatibility",
        "Janma Rashi-based emotional and karmic match",
        "Recommended remedies if doshas are present",
        "Astrologer recommendation — proceed, consult or reconsider",
      ],
    },
    {
      heading: "What Guna score really means",
      bullets: [
        "Below 18/36 — generally not recommended for marriage",
        "18–24/36 — average match, workable with remedies",
        "25–32/36 — very good match, harmonious union",
        "33–36/36 — divine match, extremely rare",
        "Even high scores still need a dosha cross-check",
      ],
    },
    {
      heading: "Common doshas explained",
      bullets: [
        "Mangal Dosha — Mars in 1/4/7/8/12 house — needs Manglik-Manglik match or remedy",
        "Nadi Dosha — same Nadi (Adi/Madhya/Antya) — affects health & progeny",
        "Bhakoot Dosha — 6-8 or 9-5 rashi positions — affects family welfare",
        "Gana Dosha — Deva-Rakshasa or Manushya-Rakshasa pairing",
        "Most doshas are remediable through specific Vedic pujas",
      ],
    },
  ],
  faqs: [
    { q: "Is online kundli matching as accurate as a pandit's?", a: "Our system uses the same classical Parashari calculations a Vedic pandit uses — so the math is identical. For interpretation of borderline cases or doshas, we recommend a follow-up with a verified astrologer." },
    { q: "Can I match kundlis without knowing exact birth time?", a: "Birth time is essential for accurate kundli matching — it determines the rashi and nakshatra. If birth time is unknown, we can do a name-based or sun-sign quick match, but it's far less reliable." },
    { q: "What if our Guna score is low — should we cancel the marriage?", a: "No — many low-Guna couples are very happy. Score is a starting point. The full kundli analysis (doshas, dasha periods, 7th-house strength) matters more. Always consult an astrologer before any final decision." },
    { q: "Both partners have Mangal Dosha — is that bad?", a: "Actually it's good — Manglik-Manglik matches cancel each other's dosha out. The challenge is when one partner is Manglik and the other is not." },
    { q: "How long does the free kundli match take?", a: "Under 60 seconds — enter both birth details, get the full Ashtakoot Guna Milan report instantly with downloadable PDF." },
  ],
  finalCtaTitle: "Don't begin a marriage without a kundli match",
  finalCtaSubtitle: "Free 36-point Ashtakoot Guna Milan + dosha check — instant Vedic report.",
  finalCtaButtons: [
    { label: "Match Kundlis for Free", href: "/ai-kundli", variant: "primary" },
    { label: "Consult a Match Astrologer", href: "/astrology", variant: "outline" },
  ],
  relatedLinks: [
    { label: "Zodiac Compatibility", href: "/zodiac-compatibility" },
    { label: "Marriage Puja", href: "/marriage-puja" },
    { label: "Free Kundli", href: "/ai-kundli" },
    { label: "Premium Kundli PDF", href: "/premium-kundli-pdf" },
    { label: "Talk to an Astrologer", href: "/astrology" },
  ],
  schema: { type: "service", serviceName: "Online Vedic Kundli Matching" },
};

const NAKSHATRA_PREDICTIONS: SeoLandingPageProps = {
  seoTitle: "Nakshatra Predictions — Your Birth Star, Pada & Lifetime Forecast | Vedic Tatva",
  seoDescription:
    "Find your janma nakshatra (birth star) and read its full lifetime predictions, ruling deity, lucky pada, compatible nakshatras and recommended remedies. Free guide to all 27 Vedic nakshatras.",
  seoKeywords:
    "nakshatra predictions, janma nakshatra, birth star prediction, 27 nakshatras, nakshatra characteristics, nakshatra by date of birth, nakshatra pada, nakshatra meaning, ashwini nakshatra, bharani nakshatra, krittika nakshatra, rohini nakshatra, mrigashira nakshatra, ardra nakshatra, punarvasu nakshatra, pushya nakshatra, ashlesha nakshatra, magha nakshatra, nakshatra compatibility, nakshatra remedies",
  canonical: "/nakshatra-predictions",
  breadcrumbs: [
    { name: "Home", url: "/" },
    { name: "Astrology", url: "/zodiac-rashifal" },
    { name: "Nakshatra Predictions", url: "/nakshatra-predictions" },
  ],
  eyebrow: "Janma Nakshatra",
  h1: "Nakshatra Predictions — Find Your Birth Star & Lifetime Forecast",
  subtitle:
    "The 27 nakshatras of Vedic astrology — your birth star, its ruling deity, its lifetime themes and the remedies that strengthen it.",
  heroCTAs: [
    { label: "Find My Nakshatra (Free)", href: "/ai-kundli", variant: "primary" },
    { label: "Get Nakshatra Reading", href: "/astrology", variant: "outline" },
  ],
  trustChips: ["All 27 Nakshatras", "Pada-Level Detail", "Free Reading"],
  intro:
    "In Vedic astrology, your janma nakshatra (the lunar mansion the Moon was in at your birth) is more personal than your rashi. The 27 nakshatras divide the zodiac into 13°20' segments, each ruled by a deity, a planet, an element and a symbol. Your nakshatra reveals your innate temperament, your karmic tendencies, your lifetime themes and the kind of partner who will resonate with you. Vedic Tatva computes your exact nakshatra and pada (one of four quarters within each nakshatra) from your birth time and gives you the full reading — completely free.",
  sections: [
    {
      heading: "What your nakshatra reveals",
      bullets: [
        "Your innate temperament (Deva, Manushya or Rakshasa Gana)",
        "Lifetime career path and natural talents",
        "Compatible nakshatras for marriage and partnership",
        "Ruling deity (Ishta Devata) — the divine form to worship",
        "Ruling planet — your most powerful graha for remedies",
        "Symbol, element and lucky pada",
        "Karmic lessons of this birth",
        "Recommended mantras and rituals",
      ],
    },
    {
      heading: "The 27 Vedic nakshatras",
      bullets: [
        "Ashwini, Bharani, Krittika — Mesh / early Vrishabh",
        "Rohini, Mrigashira, Ardra — Vrishabh / early Mithun",
        "Punarvasu, Pushya, Ashlesha — Mithun / Kark",
        "Magha, Purva Phalguni, Uttara Phalguni — Singh / early Kanya",
        "Hasta, Chitra, Swati — Kanya / Tula",
        "Vishakha, Anuradha, Jyeshtha — Tula / Vrishchik",
        "Mula, Purva Ashadha, Uttara Ashadha — Dhanu / early Makar",
        "Shravana, Dhanishta, Shatabhisha — Makar / Kumbh",
        "Purva Bhadrapada, Uttara Bhadrapada, Revati — Kumbh / Meen",
      ],
    },
    {
      heading: "Why nakshatra matters more than rashi",
      bullets: [
        "More precise — 27 segments vs 12 rashis",
        "Used for naming children (nakshatra-aksharas)",
        "Used for marriage matching (Yoni, Tara, Nadi koots)",
        "Determines your Vimshottari Mahadasha sequence — your life timeline",
        "Reveals subtler personality traits than rashi alone",
      ],
    },
  ],
  faqs: [
    { q: "How do I find my nakshatra?", a: "Generate your free kundli on Vedic Tatva — your janma nakshatra and pada appear in the basic details, calculated from your exact date, time and place of birth." },
    { q: "What is a nakshatra pada?", a: "Each of the 27 nakshatras is divided into 4 padas (quarters), each linked to a different rashi. Your pada refines your personality further within your nakshatra." },
    { q: "Which is more important — rashi or nakshatra?", a: "Both matter — but nakshatra is more granular and personal. Most serious Vedic readings (marriage matching, mahadasha analysis, naming) use nakshatra primarily." },
    { q: "Should I do a puja for my janma nakshatra?", a: "Yes — annually, especially on your nakshatra's day. The puja to your ruling deity strengthens your nakshatra's positive qualities and softens its challenges." },
    { q: "Can my nakshatra predict marriage compatibility?", a: "Yes — three of the eight koots in Ashtakoot Guna Milan (Tara, Yoni, Nadi) are nakshatra-based. Same-Nadi or incompatible-Yoni matches need extra remedies." },
  ],
  finalCtaTitle: "Discover the star that was watching at your birth",
  finalCtaSubtitle: "Free janma nakshatra reading + pada-level forecast for all 27 nakshatras.",
  finalCtaButtons: [
    { label: "Find My Nakshatra Free", href: "/ai-kundli", variant: "primary" },
    { label: "Talk to a Nakshatra Astrologer", href: "/astrology", variant: "outline" },
  ],
  relatedLinks: [
    { label: "Zodiac Compatibility", href: "/zodiac-compatibility" },
    { label: "Kundli Matching", href: "/kundli-matching" },
    { label: "Numerology Predictions", href: "/numerology-predictions" },
    { label: "Free Kundli", href: "/ai-kundli" },
    { label: "Nakshatra Baby Names", href: "/ai-baby-names" },
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
  "griha-pravesh-puja": GRIHA_PRAVESH_PUJA,
  "lakshmi-puja": LAKSHMI_PUJA,
  "navgraha-puja": NAVGRAHA_PUJA,
  "marriage-puja": MARRIAGE_PUJA,
  "pitra-dosh-puja": PITRA_DOSH_PUJA,
  "maha-mrityunjaya-jaap": MAHA_MRITYUNJAYA_JAAP,
  "daily-rashifal": DAILY_RASHIFAL,
  "weekly-rashifal": WEEKLY_RASHIFAL,
  "monthly-horoscope": MONTHLY_HOROSCOPE,
  "yearly-horoscope-2026": YEARLY_HOROSCOPE_2026,
  "zodiac-compatibility": ZODIAC_COMPATIBILITY,
  "lucky-number-today": LUCKY_NUMBER_TODAY,
  "numerology-predictions": NUMEROLOGY_PREDICTIONS,
  "kundli-matching": KUNDLI_MATCHING,
  "nakshatra-predictions": NAKSHATRA_PREDICTIONS,
};

export type SeoLandingSlug = keyof typeof SEO_LANDINGS;

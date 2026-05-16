// =====================================================================
// Pandit city landing — content + SEO config per city.
//
// Each entry powers a /pandits/:slug landing page with:
//   • bespoke <title>, <meta description>, H1, intro
//   • A+ content blocks (popular pujas in that city, regional customs,
//     key festivals, FAQs)
//   • cross-promotion modules (samagri, online puja, astrology, panchang)
//   • Service / LocalBusiness JSON-LD
//
// Live cities render the live directory inline. Coming-soon cities still
// get the full SEO page so we capture city-level search traffic, but the
// directory slot becomes a "Join waitlist + book online instead" CTA.
// =====================================================================

export type PujaHighlight = { name: string; description: string };
export type FaqItem = { q: string; a: string };
export type CrossPromo = { title: string; href: string; description: string };
export type TrustBadge = { label: string; value: string };

export type PanditCityConfig = {
  slug: string;            // URL slug — kebab-case
  name: string;            // Display name (e.g. "Delhi NCR")
  apiCity: string;         // City filter sent to /api/pandits
  state: string;
  live: boolean;           // true → directory inline; false → waitlist
  metaTitle: string;       // <title>
  metaDescription: string; // <meta name=description>
  h1: string;
  intro: string;
  popularPujas: PujaHighlight[];
  regionalCustoms: string;
  keyFestivals: string[];
  trustBadges: TrustBadge[];
  faqs: FaqItem[];
  crossPromo: CrossPromo[];
  keywordsBlurb: string;
};

const CROSS_PROMO_BASE: CrossPromo[] = [
  { title: "Online Puja with Live Pandits", href: "/puja", description: "Join the ritual over video — same priest, same shastra, no travel." },
  { title: "Authentic Puja Samagri", href: "/spiritual-essentials", description: "The exact items the pandit will ask for, delivered in one kit." },
  { title: "Talk to a Vedic Astrologer", href: "/astrology", description: "Get a kundli reading or muhurat consultation before booking." },
  { title: "Today's Panchang & Muhurat", href: "/panchang", description: "Pick the most auspicious tithi for your ceremony." },
];

const COMMON_FAQS: FaqItem[] = [
  { q: "Do the pandits bring all the puja samagri?", a: "You can either add a curated samagri kit at checkout (delivered to your home before the ceremony) or arrange items yourself using the checklist your pandit will share within minutes of booking." },
  { q: "Is the booking fee inclusive of dakshina?", a: "The fee covers the pandit's professional services. Dakshina is a separate, traditional offering given as per your wish — we share suggested ranges based on the ceremony type." },
  { q: "Can I reschedule or cancel?", a: "Free rescheduling up to 24 hours before the ceremony. Full refund on cancellations made 48+ hours prior." },
];

export const PANDIT_CITIES: PanditCityConfig[] = [
  // -----------------------------------------------------------------
  // DELHI NCR — flagship live city
  // -----------------------------------------------------------------
  {
    slug: "delhi-ncr",
    name: "Delhi NCR",
    apiCity: "Delhi",
    state: "Delhi",
    live: true,
    metaTitle: "Book a Verified Pandit in Delhi NCR — Same-Day Puja at Home | Vedic Tatva",
    metaDescription: "Hire scripture-trained, identity-verified pandits in Delhi, Gurgaon, Noida, Faridabad and Ghaziabad for Satyanarayan Katha, Griha Pravesh, Wedding, Mundan and 50+ ceremonies. Transparent pricing from ₹2,100. Same-day booking available.",
    h1: "Verified Vedic Pandits in Delhi NCR",
    intro:
      "Delhi NCR's most-trusted pandits — Smartha and Vaishnav traditions, fluent in Hindi, Sanskrit, Punjabi, Bengali, Maithili and Marwari. Every priest is identity-verified, scripture-certified (Veda Karmakand), and rated by hundreds of past clients. Book in 60 seconds with transparent pricing — no hidden charges, no quote-and-bargain.",
    popularPujas: [
      { name: "Satyanarayan Katha", description: "Most-booked Pournami / fortnightly puja in Delhi NCR. Typically 2-3 hrs at home with prasad distribution." },
      { name: "Griha Pravesh", description: "Smartha-tradition house-warming with Vastu shanti and Ganapati pujan — popular in Gurgaon and Noida new builds." },
      { name: "Vivah / Wedding", description: "Full Vedic shaadi (pheras, kanyadaan, saptapadi) with bilingual mantra explanation for guests." },
      { name: "Mundan / Namkaran", description: "First-haircut and naming samskara per the family's gotra and birth-nakshatra." },
      { name: "Rudrabhishek", description: "Monday Rudrabhishek and Maha Shivaratri sankalpa with 1008-mantra recitation option." },
      { name: "Mata ki Chowki / Jagran", description: "Devi worship for Navratri and weekly chowkis — Punjabi households especially." },
    ],
    regionalCustoms:
      "Delhi NCR is one of India's most religiously plural metros — Smartha households from UP and Bihar, Punjabi families with Sikh-Hindu hybrid customs, Bengalis observing Durga Puja with full Beni Madhav nyas, South Indian engineers in Gurgaon following Iyengar samprada, and Marwari business families with elaborate Lakshmi pujans during Diwali. Our pandit roster reflects all of these — when you filter by tradition you'll see priests trained in your specific lineage, language, and gotra-recognition style.",
    keyFestivals: ["Diwali Lakshmi-Ganesh Pujan", "Holi Holika Dahan", "Karva Chauth", "Navratri Kalash Sthapana", "Maha Shivaratri", "Janmashtami", "Ganesh Chaturthi", "Chhath Puja"],
    trustBadges: [
      { label: "Verified pandits in NCR", value: "120+" },
      { label: "Ceremonies completed", value: "8,400+" },
      { label: "Average rating", value: "4.8 / 5" },
      { label: "Same-day availability", value: "Daily" },
    ],
    faqs: [
      { q: "Will the pandit travel to my home in Gurgaon / Noida / Faridabad?", a: "Yes. Travel inside the NCR (Delhi, Gurgaon, Noida, Greater Noida, Faridabad, Ghaziabad) is included for most ceremonies. For locations 25+ km from the pandit's base, a small conveyance is added at booking time and shown upfront — never as a surprise." },
      { q: "Can I get a Hindi-speaking pandit who explains the rituals to elders?", a: "Yes. Most NCR pandits are fluent in Hindi and Sanskrit, with bilingual explanation for guests who don't follow Sanskrit. Filter by language to see English, Punjabi, Bengali or Marathi options too." },
      { q: "How quickly can I book a Satyanarayan Katha?", a: "Same-day if you book before 10 AM and use the 'Available Today' filter. Otherwise next-day is almost always available for Delhi NCR." },
      ...COMMON_FAQS,
    ],
    crossPromo: CROSS_PROMO_BASE,
    keywordsBlurb: "Pandit booking Delhi, Vedic priest Gurgaon, online puja Noida, Hindu priest at home Faridabad, Satyanarayan katha Delhi NCR, Griha Pravesh pandit Ghaziabad",
  },
  // -----------------------------------------------------------------
  // MUMBAI — coming soon
  // -----------------------------------------------------------------
  {
    slug: "mumbai",
    name: "Mumbai",
    apiCity: "Mumbai",
    state: "Maharashtra",
    live: false,
    metaTitle: "Book a Pandit in Mumbai — Marathi & North Indian Priests for Puja at Home | Vedic Tatva",
    metaDescription: "Verified Vedic pandits coming soon to Mumbai — Marathi, Konkani and North-Indian priests for Satyanarayan, Ganesh Chaturthi, Vastu Shanti, Wedding and more. Join the waitlist or book a live online puja today.",
    h1: "Vedic Pandits in Mumbai",
    intro:
      "Mumbai's pandit roster is launching soon — Marathi, Konkani Saraswat, North Indian and Gujarati priests verified the same way as our Delhi NCR network. Until then you can book the exact same priests over a live video puja from anywhere in Mumbai, Thane, Navi Mumbai or Kalyan.",
    popularPujas: [
      { name: "Ganesh Chaturthi Sthapana", description: "10-day Ganpati murti puja with daily aarti and visarjan sankalpa — Mumbai's most beloved festival." },
      { name: "Satyanarayan Puja", description: "Pournami katha popular in Marathi and Gujarati households across the city." },
      { name: "Vastu Shanti", description: "Apartment-friendly Vastu pujan for new flats in high-rises across Powai, Worli and Andheri." },
      { name: "Wedding (Vivah)", description: "Marathi or North Indian Vedic shaadi performed in farmhouses and banquet halls." },
      { name: "Gauri-Ganpati", description: "Three-day Jyeshtha Gauri puja during Bhadrapada — staple of Maharashtrian homes." },
      { name: "Diwali Lakshmi Pujan", description: "Chopda pujan for traders and full Lakshmi-Kuber pujan for households." },
    ],
    regionalCustoms:
      "Mumbai's spiritual fabric is dominated by Maharashtrian Brahminical traditions — daily aarti at home shrines, Sankashti Chaturthi observance for Ganpati, and Pithori Amavasya rituals for ancestors. Layered on top are Gujarati Vaishnav families who do daily Thakorji seva, Marwari business households running Lakshmi pujans, and South Indian and North Indian migrants who keep their lineage customs intact.",
    keyFestivals: ["Ganesh Chaturthi", "Gudi Padwa", "Gauri-Ganpati", "Diwali / Bhai Dooj", "Holi", "Janmashtami / Dahi Handi", "Navratri Garba", "Karva Chauth"],
    trustBadges: [
      { label: "Launching by", value: "Q2 2026" },
      { label: "Live online puja today", value: "Available" },
      { label: "Mumbai pandits onboarding", value: "40+" },
      { label: "Languages", value: "Marathi, Hindi, English" },
    ],
    faqs: [
      { q: "When will live in-home pandit booking launch in Mumbai?", a: "We're verifying our first batch of Mumbai pandits and expect to launch in Q2 2026. Join the waitlist for early access — verified members get same-day booking when we go live." },
      { q: "Can I do a puja with a Marathi pandit before the launch?", a: "Yes — book a live online puja and request a Marathi-speaking pandit. The same Vedic procedure (sankalpa, mantras, prasad) is followed; you join over video." },
      ...COMMON_FAQS,
    ],
    crossPromo: CROSS_PROMO_BASE,
    keywordsBlurb: "Pandit Mumbai, Marathi pandit booking, Ganesh Chaturthi pandit, online puja Mumbai, Vedic priest Thane, Vastu shanti pandit Navi Mumbai",
  },
  // -----------------------------------------------------------------
  // BANGALORE — coming soon
  // -----------------------------------------------------------------
  {
    slug: "bangalore",
    name: "Bangalore",
    apiCity: "Bangalore",
    state: "Karnataka",
    live: false,
    metaTitle: "Book a Pandit in Bangalore — Iyer, Iyengar & Smartha Priests for Puja | Vedic Tatva",
    metaDescription: "Vedic pandits coming soon to Bangalore — Smartha, Sri Vaishnava, Madhva and North Indian priests for Griha Pravesh, Satyanarayan, Wedding, Ayushya Homam and more. Book online puja today, in-home soon.",
    h1: "Vedic Pandits in Bangalore",
    intro:
      "Bangalore's pandit network launches soon — covering Smartha (Iyer), Sri Vaishnava (Iyengar), Madhva and North Indian samprada. Whether you're in Whitefield, Jayanagar, Electronic City or HSR Layout, you'll be able to book a tradition-matched priest who speaks Kannada, Tamil, Telugu, Sanskrit or Hindi.",
    popularPujas: [
      { name: "Satyanarayan Puja", description: "Full-moon vrata especially popular among the city's North Indian IT professionals." },
      { name: "Griha Pravesh", description: "South-Indian gruhapravesha with Vastu homa and Navagraha shanti — common for new apartments and villas." },
      { name: "Ayushya Homam", description: "Long-life havan for birthdays per Tamil and Telugu Brahmin tradition." },
      { name: "Wedding (Kalyana)", description: "Iyer or Iyengar wedding with kashi-yatra, oonjal, kanyadaan and saptapadi." },
      { name: "Navagraha Shanti", description: "Nine-planet havan to remedy doshas indicated in the kundli." },
      { name: "Varalakshmi Vratam", description: "Annual Lakshmi puja in Shravana — staple for South Indian households." },
    ],
    regionalCustoms:
      "Bangalore is unique in hosting four major Vedic schools side-by-side — Smartha (Adi Shankara lineage), Sri Vaishnava (Ramanuja lineage), Madhva (Madhvacharya lineage) and the North Indian Smartha tradition imported by IT migrants. Each has distinct wedding rituals, tarpan procedures and even how Navagraha is approached. Our verification process explicitly tags priests by lineage so you can match correctly.",
    keyFestivals: ["Kar Hunnime / Karaga", "Varalakshmi Vratam", "Ganesh Chaturthi", "Navratri / Dasara", "Diwali Naraka Chaturdashi", "Pongal / Sankranti", "Ugadi", "Akshaya Tritiya"],
    trustBadges: [
      { label: "Launching by", value: "Q2 2026" },
      { label: "Online puja today", value: "Available" },
      { label: "Pandits onboarding", value: "35+" },
      { label: "Lineages covered", value: "Smartha, Iyengar, Madhva" },
    ],
    faqs: [
      { q: "Will I be able to specify Iyer vs Iyengar vs Madhva pandit?", a: "Yes — at launch you'll filter by tradition (Smartha / Sri Vaishnava / Madhva) and the priest's profile will show their guru-parampara so the rituals match your family's customs." },
      { q: "Can I book a Tamil-speaking pandit who explains rituals in English?", a: "Yes. Bangalore's onboarding pool includes priests fluent in Tamil, Telugu, Kannada and English, with bilingual mantra explanation for guests unfamiliar with Sanskrit." },
      ...COMMON_FAQS,
    ],
    crossPromo: CROSS_PROMO_BASE,
    keywordsBlurb: "Pandit Bangalore, Iyer pandit booking, Iyengar priest Bangalore, online puja Bangalore, Smartha pandit, gruhapravesha Bangalore, Madhva priest",
  },
  // -----------------------------------------------------------------
  // CHENNAI — coming soon
  // -----------------------------------------------------------------
  {
    slug: "chennai",
    name: "Chennai",
    apiCity: "Chennai",
    state: "Tamil Nadu",
    live: false,
    metaTitle: "Book a Pandit in Chennai — Iyer & Iyengar Priests for Vedic Puja | Vedic Tatva",
    metaDescription: "Vedic priests for Chennai — Iyer, Iyengar and Madhva pandits for Ayushya Homam, Griha Pravesh, Vivaha, Sashtiabdapurthi, Bhimaratha and more. Online puja available today, in-home booking launching soon.",
    h1: "Vedic Pandits in Chennai",
    intro:
      "Chennai's pandit network is being built around the city's deeply-rooted Smartha (Iyer) and Sri Vaishnava (Iyengar) traditions — with priests trained in samavedic and yajurvedic recitation. Until in-home booking goes live, you can engage the same priests for guided online pujas and sankalpa-based remedies.",
    popularPujas: [
      { name: "Ayushya Homam", description: "Sahasra-chandi or Mrityunjaya homa for long life — performed on birthdays per Brahmin samprada." },
      { name: "Sashtiabdapurthi", description: "60th-birthday Vedic ceremony marking a new lifecycle — a flagship Tamil tradition." },
      { name: "Bhimaratha Shanti", description: "70th-birthday samskara with elaborate homa and family blessings." },
      { name: "Vivaha (Wedding)", description: "Full Iyer or Iyengar wedding with vratham, mahurtham, oonjal and saptapadi." },
      { name: "Gruhapravesha", description: "House-warming with Vastu homa, Navagraha shanti and ksheerabhishekam of the kalasham." },
      { name: "Sri Sukta Homa", description: "Lakshmi-focused fire ritual popular for business launches and Akshaya Tritiya." },
    ],
    regionalCustoms:
      "Tamil Brahmin households place exceptional weight on samskaras — the 16 lifecycle ceremonies from namakarana to antyeshti are still observed with full shastra. Our Chennai onboarding emphasises priests who can perform these accurately, with proper Vedic chanting and the regional specifics (whether Vadama, Brihatcharanam, Ashtasahasram or Iyengar Vadakalai/Thenkalai).",
    keyFestivals: ["Pongal", "Tamil New Year", "Vinayaka Chaturthi", "Krishna Jayanti", "Navaratri / Golu", "Karthigai Deepam", "Vaikunta Ekadashi", "Aadi Perukku"],
    trustBadges: [
      { label: "Launching by", value: "Q3 2026" },
      { label: "Online puja today", value: "Available" },
      { label: "Lineages onboarding", value: "Iyer, Iyengar, Madhva" },
      { label: "Languages", value: "Tamil, Sanskrit, English" },
    ],
    faqs: [
      { q: "Will I get a samaveda vs yajurveda pandit per our family's tradition?", a: "Yes — the priest's veda-shakha will be displayed on the profile so you can match your family's parampara accurately. This matters especially for samskara-related rituals like upanayana." },
      { q: "Can I book a Brahma-Yajna or daily nitya karma pandit?", a: "At launch, yes — both occasional samskaras and daily/weekly nitya pujas can be booked, including pandits who'll perform routine Sandhyavandanam guidance for grihasthas." },
      ...COMMON_FAQS,
    ],
    crossPromo: CROSS_PROMO_BASE,
    keywordsBlurb: "Pandit Chennai, Iyer pandit booking Chennai, Iyengar priest Chennai, Ayushya homam, Sashtiabdapurthi pandit, Tamil Brahmin pandit, gruhapravesha Chennai",
  },
  // -----------------------------------------------------------------
  // KOLKATA — coming soon
  // -----------------------------------------------------------------
  {
    slug: "kolkata",
    name: "Kolkata",
    apiCity: "Kolkata",
    state: "West Bengal",
    live: false,
    metaTitle: "Book a Bengali Pandit in Kolkata — Durga, Saraswati, Lakshmi Puja | Vedic Tatva",
    metaDescription: "Verified Bengali pandits coming soon to Kolkata — Durga Puja, Saraswati Puja, Lakshmi Puja, Annaprashan, Bivah and Shradh. Pandits trained in Smarta and Tantric traditions. Online puja available today.",
    h1: "Bengali Pandits in Kolkata",
    intro:
      "Kolkata's pandit roster is built around Bengal's distinct Smarta and Tantric traditions — priests fluent in Sanskrit, Bengali and Hindi who can perform Durga Puja with full chandi-path, Saraswati Puja with anjali, and the lifecycle samskaras Bengali families hold dear.",
    popularPujas: [
      { name: "Durga Puja Anjali / Bodhon", description: "Full sashthi-to-dashami priest engagement with chandi-path, sandhi puja and visarjan." },
      { name: "Saraswati Puja", description: "Vasant Panchami pujan especially observed in Bengali households for school-going children." },
      { name: "Lakshmi Puja", description: "Kojagari Lakshmi puja on Sharad Pournima — distinctive to Bengal." },
      { name: "Annaprashan", description: "First-rice ceremony for infants between 6-9 months with priest-led mantra." },
      { name: "Bivah (Wedding)", description: "Full Bengali Vedic wedding with sampradan, saptapadi, sindur-daan and bashar-ghar." },
      { name: "Shradh / Tarpan", description: "Pitru-paksha and annual shradh with proper Bengali Smarta procedure." },
    ],
    regionalCustoms:
      "Bengali Hindu practice has a strong Tantric overlay — Durga is approached as Shakti, Kali worship is mainstream rather than esoteric, and shradh ceremonies follow Smarta-Tantric blending unique to Bengal. Priests in our Kolkata onboarding are vetted for both classical Vedic procedure and the distinctive Bengali liturgical style.",
    keyFestivals: ["Durga Puja", "Kali Puja", "Lakshmi Puja", "Saraswati Puja", "Jagaddhatri Puja", "Poila Boishakh", "Janmashtami", "Bipattarini Vrata"],
    trustBadges: [
      { label: "Launching by", value: "Q3 2026" },
      { label: "Online puja today", value: "Available" },
      { label: "Bengali pandits onboarding", value: "30+" },
      { label: "Languages", value: "Bengali, Sanskrit, Hindi" },
    ],
    faqs: [
      { q: "Can I book a pandit for the full Durga Puja sashthi-to-dashami?", a: "Yes — at launch you'll be able to book a single pandit (or pandit + dhakis) for the entire five-day procedure, including chandi-path, sandhi puja and bisarjan. We're prioritising this for the first cohort." },
      { q: "Do you offer pandits for community / barir pujo vs sarbojanin?", a: "Both. Filter by ceremony type — barir pujo (home/family) and sarbojanin (community) have different scale needs and our pandits are tagged accordingly." },
      ...COMMON_FAQS,
    ],
    crossPromo: CROSS_PROMO_BASE,
    keywordsBlurb: "Bengali pandit Kolkata, Durga puja pandit booking, Saraswati puja Kolkata, Annaprashan pandit, Bengali wedding priest, Lakshmi puja Kolkata, Shradh pandit Bengal",
  },
  // -----------------------------------------------------------------
  // GUWAHATI — coming soon
  // -----------------------------------------------------------------
  {
    slug: "guwahati",
    name: "Guwahati",
    apiCity: "Guwahati",
    state: "Assam",
    live: false,
    metaTitle: "Book a Pandit in Guwahati — Assamese & Bengali Priests for Vedic Puja | Vedic Tatva",
    metaDescription: "Vedic pandits coming soon to Guwahati — Assamese, Bengali and Vaishnav Sattriya priests for Bihu pujan, Durga Puja, Lakshmi Puja, Griha Pravesh, Vivaha. Online puja available today.",
    h1: "Vedic Pandits in Guwahati",
    intro:
      "Assam's pandit network — from classical Vedic Brahmin priests to Vaishnav Sattriya tradition guides — is being built for Guwahati. Whether your family observes Ek-saran Naam-dharma or classical Smarta procedure, you'll find a priest who matches.",
    popularPujas: [
      { name: "Bihu Pujan", description: "Bohag, Magh and Kati Bihu rituals — agricultural and household observances unique to Assam." },
      { name: "Durga Puja", description: "Full anjali and sandhi puja, observed in Bengali and Assamese homes alike." },
      { name: "Lakshmi Puja", description: "Kati-month Lakshmi pujan for prosperity and harvest blessings." },
      { name: "Naam-prasanga", description: "Vaishnav Sattriya devotional service led by a satradhikar — distinctive Assam tradition." },
      { name: "Griha Pravesh", description: "House-warming pujan with Vastu shanti, suited to both Assamese and migrant North Indian families." },
      { name: "Vivaha", description: "Vedic wedding tailored to Assamese Brahmin or Bengali samaj customs." },
    ],
    regionalCustoms:
      "Assam's spiritual landscape is shaped by Sankardev's Ek-saran Naam-dharma and the Sattra tradition — distinct from classical Smarta Brahmanism. Many households also observe Kamakhya-temple aligned Tantric customs. We're onboarding both classical Vedic pandits and Sattriya-trained guides so families can choose the lineage they follow.",
    keyFestivals: ["Bohag Bihu", "Kati Bihu", "Magh Bihu", "Durga Puja", "Lakshmi Puja", "Manasha Puja", "Janmashtami", "Diwali"],
    trustBadges: [
      { label: "Launching by", value: "Q4 2026" },
      { label: "Online puja today", value: "Available" },
      { label: "Pandits onboarding", value: "20+" },
      { label: "Traditions", value: "Smarta + Vaishnav Sattriya" },
    ],
    faqs: [
      { q: "Can I get a Sattriya tradition guide for naam-prasanga?", a: "Yes — we're explicitly onboarding both classical Vedic pandits and Sattriya-tradition guides so families following Sankardev's Ek-saran Naam-dharma get the right kind of officiant." },
      { q: "Will pandits travel from Guwahati to upper Assam towns?", a: "At launch we'll cover Guwahati, North Guwahati, Tezpur and Nagaon. Outstation visits to other parts of Assam will be possible with conveyance added at booking." },
      ...COMMON_FAQS,
    ],
    crossPromo: CROSS_PROMO_BASE,
    keywordsBlurb: "Pandit Guwahati, Assamese pandit booking, Bihu pujan, Sattriya guide, Durga puja Guwahati, online puja Assam, Vedic priest Tezpur",
  },
  // -----------------------------------------------------------------
  // LUCKNOW — coming soon
  // -----------------------------------------------------------------
  {
    slug: "lucknow",
    name: "Lucknow",
    apiCity: "Lucknow",
    state: "Uttar Pradesh",
    live: false,
    metaTitle: "Book a Pandit in Lucknow — UP & Awadhi Tradition Vedic Priests | Vedic Tatva",
    metaDescription: "Verified pandits coming soon to Lucknow — Smarta and Vaishnav priests for Satyanarayan Katha, Griha Pravesh, Ramcharitmanas Path, Vivaha, Mundan and Shradh in the Awadhi tradition. Online puja today, in-home soon.",
    h1: "Vedic Pandits in Lucknow",
    intro:
      "Lucknow's pandit network draws on UP's deep Smarta lineage and the strong Vaishnav devotional tradition centred on Ayodhya and Mathura. Priests fluent in Hindi, Awadhi, Sanskrit and Urdu — at home in both traditional Brahmin households and the city's pluralistic Awadhi tehzeeb.",
    popularPujas: [
      { name: "Satyanarayan Katha", description: "The most-booked monthly Vishnu puja across UP households, performed on full-moon days." },
      { name: "Ramcharitmanas Path", description: "9-day or 24-hour Akhand Ramayan recitation — staple of Awadhi Vaishnav tradition." },
      { name: "Griha Pravesh", description: "House-warming with Vastu shanti and Hanuman pujan, typical of UP Smarta procedure." },
      { name: "Vivaha", description: "Full UP-style Vedic wedding with bhaat, haldi, baraat-swagat, kanyadaan and saptapadi." },
      { name: "Mundan / Namkaran", description: "Performed at home or at a temple per the family's kuldevi or kuldev tradition." },
      { name: "Shradh / Pitru Tarpan", description: "Pitru-paksha annual shradh with full UP-Smarta procedure." },
    ],
    regionalCustoms:
      "Lucknow is the cultural heart of Awadh — where Vedic ritualism coexists with the literary-devotional Ramcharitmanas tradition popularised by Tulsidas. Most Hindu households here observe Vaishnav-Smarta hybrid customs with strong Hanuman bhakti, weekly Sundar Kand path, and vrata observances tied to specific lunar days.",
    keyFestivals: ["Ram Navami", "Janmashtami", "Diwali / Lakshmi Pujan", "Holi", "Karva Chauth", "Hartalika Teej", "Chhath Puja", "Govardhan Puja"],
    trustBadges: [
      { label: "Launching by", value: "Q4 2026" },
      { label: "Online puja today", value: "Available" },
      { label: "Pandits onboarding", value: "25+" },
      { label: "Languages", value: "Hindi, Awadhi, Sanskrit" },
    ],
    faqs: [
      { q: "Can I book a pandit for an Akhand Ramayan path?", a: "Yes — at launch, 24-hour Akhand Ramayan and 9-day Manas-path bookings will be available with multiple reciter options for shifts." },
      { q: "Do you cover Kanpur, Varanasi and Allahabad too?", a: "Lucknow is our first UP launch. Once stable we'll expand to Kanpur, Prayagraj (Allahabad) and Varanasi — likely within 6 weeks of Lucknow going live." },
      ...COMMON_FAQS,
    ],
    crossPromo: CROSS_PROMO_BASE,
    keywordsBlurb: "Pandit Lucknow, UP pandit booking, Awadhi tradition pandit, Ramcharitmanas path, Satyanarayan katha Lucknow, Vedic priest Lucknow, online puja UP",
  },
];

export const PANDIT_CITIES_BY_SLUG: Record<string, PanditCityConfig> = Object.fromEntries(
  PANDIT_CITIES.map((c) => [c.slug, c]),
);

// Deity → curated puja kit. Complements festival-kits.ts (which is keyed by
// festival). This is keyed by deity so a user can build a daily-puja kit
// for "Lakshmi" or "Ganesha" without thinking about which festival is on.
//
// productSlugs reference real SKUs in the catalog; missing slugs are
// silently dropped at render time, so this map is always safe to extend.
// mantraId is optional — when present, the kit page deep-links to /japa
// with that mantra pre-loaded for the practitioner.

export type DeityKit = {
  id: string;
  name: string;
  nameHi: string;
  tagline: string;
  taglineHi: string;
  blurb: string;
  blurbHi: string;
  palette: { from: string; via: string; to: string; accent: string };
  productSlugs: string[];
  mantraId?: string;          // matches MANTRA_LIBRARY ids in client/src/data/mantra-library.ts
  services: { label: string; href: string; description: string }[];
};

// Hex palettes intentionally muted — they tint the hero gradient without
// fighting the maroon/gold brand. Each accent is the deity-of-day saffron
// or gold so the call-to-action button feels warm, not artificial.
export const DEITY_KITS: Record<string, DeityKit> = {
  lakshmi: {
    id: "lakshmi",
    name: "Lakshmi",
    nameHi: "लक्ष्मी",
    tagline: "Goddess of abundance & harmony",
    taglineHi: "धन-धान्य एवं सौभाग्य की देवी",
    blurb: "Welcome Maa Lakshmi into the home with diyas, kalash and the akhand jot — chant Om Shrim Mahalakshmi every Friday for grace.",
    blurbHi: "घर में माँ लक्ष्मी का स्वागत करें — दीप, कलश एवं अखंड ज्योति। प्रत्येक शुक्रवार ॐ श्रीं महालक्ष्म्यै नमः का जाप कृपा हेतु।",
    palette: { from: "#5e1d2c", via: "#a8497a", to: "#f3c97b", accent: "#FFD56B" },
    productSlugs: [
      "vedic-tatva-laxmi-deepak-brass-diya-collection",
      "vedic-tatva-akhand-jot-brass-diya-glass-cover",
      "vedic-tatva-decorative-brass-diyas-collection",
      "vedic-tatva-panchgavya-cow-ghee-diya-battis-150",
    ],
    mantraId: "om-shrim-mahalakshmi",
    services: [
      { label: "Book a Lakshmi Puja Pandit", href: "/pandits", description: "Verified pandit for Friday Lakshmi pujan at home." },
      { label: "Online Lakshmi Puja", href: "/online-puja-booking", description: "Sankalp puja livestreamed from a sacred temple." },
    ],
  },
  ganesha: {
    id: "ganesha",
    name: "Ganesha",
    nameHi: "गणेश",
    tagline: "Remover of obstacles · Lord of beginnings",
    taglineHi: "विघ्नहर्ता · प्रारंभ के स्वामी",
    blurb: "Begin every puja with Ganpati — install the murti, light the akhand jot, and chant Om Gam Ganapataye Namaha for clarity.",
    blurbHi: "प्रत्येक पूजा का शुभारंभ गणपति से करें — मूर्ति स्थापना, अखंड ज्योति एवं ॐ गं गणपतये नमः जाप।",
    palette: { from: "#5e2a1d", via: "#c8693f", to: "#f3c97b", accent: "#FFB870" },
    productSlugs: [
      "vedic-tatva-akhand-jot-brass-diya-glass-cover",
      "vedic-tatva-panchgavya-cow-ghee-diya-battis-150",
      "vedic-tatva-hawan-samagri-32-herb-vedic-mix",
    ],
    mantraId: "om-gam-ganapataye",
    services: [
      { label: "Book a Ganpati Sthapana Pandit", href: "/pandits", description: "Pranapratishtha and daily aarti at your home." },
      { label: "Online Ganesh Puja", href: "/online-puja-booking", description: "Sankalp puja from Siddhivinayak with prasad delivered." },
    ],
  },
  shiva: {
    id: "shiva",
    name: "Shiva",
    nameHi: "शिव",
    tagline: "The auspicious · Mahadev",
    taglineHi: "महादेव · कल्याणकारी",
    blurb: "Offer bilva, light the ghee diya, complete rudrabhishek every Monday — chant Om Namah Shivaya 108 times.",
    blurbHi: "बेलपत्र अर्पित करें, घी का दीप जलाएँ, प्रत्येक सोमवार रुद्राभिषेक करें — ॐ नमः शिवाय का 108 बार जाप।",
    palette: { from: "#1d2a3e", via: "#4a6378", to: "#bcd0e1", accent: "#A8C8E8" },
    productSlugs: [
      "vedic-tatva-brass-trishul-shiva-trident",
      "vedic-tatva-panchgavya-cow-ghee-diya-battis-150",
      "vedic-tatva-akhand-jot-brass-diya-glass-cover",
      "vedic-tatva-hawan-samagri-32-herb-vedic-mix",
    ],
    mantraId: "om-namah-shivaya",
    services: [
      { label: "Book a Rudrabhishek Pandit", href: "/pandits", description: "Full Rudri paath at your home on Monday." },
      { label: "Online Mahamrityunjaya Jaap", href: "/online-puja-booking", description: "1.25 lakh jaap performed for your sankalp." },
    ],
  },
  hanuman: {
    id: "hanuman",
    name: "Hanuman",
    nameHi: "हनुमान",
    tagline: "Bajrang Bali · Protector & devoted bhakta",
    taglineHi: "बजरंग बली · रक्षक एवं परम भक्त",
    blurb: "Tuesday & Saturday are Hanuman Ji's days — light the diya, recite Sundarkand, chant the Hanuman mantra for courage.",
    blurbHi: "मंगलवार एवं शनिवार बजरंग बली के दिन — दीप जलाएँ, सुंदरकांड पाठ करें, साहस हेतु हनुमान मंत्र का जाप।",
    palette: { from: "#5e1d1d", via: "#c4441f", to: "#f3a26b", accent: "#FF9933" },
    productSlugs: [
      "vedic-tatva-akhand-jot-brass-diya-glass-cover",
      "vedic-tatva-panchgavya-cow-ghee-diya-battis-150",
    ],
    mantraId: "hanuman-mantra",
    services: [
      { label: "Book a Sundarkand Pandit", href: "/pandits", description: "Sundarkand or 108-times Hanuman Chalisa paath at home." },
    ],
  },
  vishnu: {
    id: "vishnu",
    name: "Vishnu",
    nameHi: "विष्णु",
    tagline: "Preserver · Narayana",
    taglineHi: "नारायण · पालनहार",
    blurb: "Thursday is Vishnu's day — chant Om Namo Narayanaya, offer tulsi, and light the akhand jot for grace and dharma.",
    blurbHi: "गुरुवार विष्णु जी का दिन — ॐ नमो नारायणाय का जाप करें, तुलसी अर्पित करें, अखंड ज्योति जलाएँ।",
    palette: { from: "#1d3e5e", via: "#4a78b8", to: "#bcd5f3", accent: "#7BB7E8" },
    productSlugs: [
      "vedic-tatva-akhand-jot-brass-diya-glass-cover",
      "vedic-tatva-panchgavya-cow-ghee-diya-battis-150",
      "vedic-tatva-hawan-samagri-32-herb-vedic-mix",
    ],
    mantraId: "om-namo-narayanaya",
    services: [
      { label: "Book a Satyanarayan Katha Pandit", href: "/pandits", description: "Full Satyanarayan vrat katha at your home." },
    ],
  },
  krishna: {
    id: "krishna",
    name: "Krishna",
    nameHi: "कृष्ण",
    tagline: "Yogeshwara · Murari · Govinda",
    taglineHi: "योगेश्वर · मुरारी · गोविन्द",
    blurb: "Welcome Kanha — bathe Laddu Gopal in panchamrit, offer makhan-mishri, sing the Hare Krishna mahamantra.",
    blurbHi: "कान्हा का स्वागत करें — लड्डू गोपाल का पंचामृत स्नान, माखन-मिश्री अर्पण, हरे कृष्ण महामंत्र कीर्तन।",
    palette: { from: "#1d3e2e", via: "#3f8e6a", to: "#f3c97b", accent: "#A8E0B8" },
    productSlugs: [
      "vedic-tatva-panchgavya-cow-ghee-diya-battis-150",
      "vedic-tatva-akhand-jot-brass-diya-glass-cover",
      "vedic-tatva-hawan-samagri-32-herb-vedic-mix",
    ],
    mantraId: "hare-krishna",
    services: [
      { label: "Book a Krishna Janmashtami Pandit", href: "/pandits", description: "Midnight abhishek of Laddu Gopal at your home." },
      { label: "Online Krishna Puja", href: "/online-puja-booking", description: "Live darshan from Vrindavan & Mathura." },
    ],
  },
  durga: {
    id: "durga",
    name: "Durga",
    nameHi: "दुर्गा",
    tagline: "Maa · Shakti · Slayer of demons",
    taglineHi: "माँ · शक्ति · असुर-संहारिणी",
    blurb: "Invoke Devi during Navratri or any Tuesday — kalash, akhand jot, daily havan, recite Durga Saptashati.",
    blurbHi: "नवरात्रि अथवा किसी भी मंगलवार देवी का आह्वान करें — कलश, अखंड ज्योति, प्रतिदिन हवन, दुर्गा सप्तशती पाठ।",
    palette: { from: "#5e1d3e", via: "#c4448e", to: "#f3a26b", accent: "#FF6B9D" },
    productSlugs: [
      "vedic-tatva-akhand-jot-brass-diya-glass-cover",
      "vedic-tatva-aluminum-havan-kund-stepped-pyramid",
      "vedic-tatva-hawan-samagri-32-herb-vedic-mix",
      "vedic-tatva-mango-wood-samidha-havan-sticks",
    ],
    mantraId: "om-dum-durgayai",
    services: [
      { label: "Book a Durga Saptashati Pandit", href: "/pandits", description: "Recitation of all 13 chapters across nine nights." },
      { label: "Online Devi Puja", href: "/online-puja-booking", description: "Daily aarti livestreamed from Vaishno Devi & Kamakhya." },
    ],
  },
  surya: {
    id: "surya",
    name: "Surya",
    nameHi: "सूर्य",
    tagline: "Sun · Source of vitality & clarity",
    taglineHi: "सूर्य · ऊर्जा एवं स्पष्टता के स्रोत",
    blurb: "Rise before dawn, offer arghya to Surya Dev, chant Om Suryaya Namah every Sunday for vitality and leadership.",
    blurbHi: "ब्रह्म मुहूर्त में उठें, सूर्य देव को अर्घ्य अर्पित करें, प्रत्येक रविवार ॐ सूर्याय नमः का जाप।",
    palette: { from: "#5e3e1d", via: "#e8a23f", to: "#f3e07b", accent: "#FFD93D" },
    productSlugs: [
      "vedic-tatva-panchgavya-cow-ghee-diya-battis-150",
      "vedic-tatva-akhand-jot-brass-diya-glass-cover",
    ],
    mantraId: "om-suryaya-namah",
    services: [
      { label: "Book a Surya Pujan Pandit", href: "/pandits", description: "Sandhya vandan and arghya pujan at sunrise." },
    ],
  },
};

export const DEITY_KIT_LIST = Object.values(DEITY_KITS);

export function getDeityKit(id: string): DeityKit | null {
  return DEITY_KITS[id] ?? null;
}

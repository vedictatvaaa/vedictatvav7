// Festival → curated kit + suggested services. Maps to existing product slugs in
// the catalog (see server/seed*.ts). Slugs that do not match a real product are
// silently skipped at render time, so this map is always safe to extend.

export type FestivalKit = {
  id: string;
  blurb: string;
  blurbHi: string;
  productSlugs: string[];
  services: { label: string; href: string; description: string }[];
};

export const FESTIVAL_KITS: Record<string, FestivalKit> = {
  diwali: {
    id: "diwali",
    blurb:
      "Welcome Maa Lakshmi home with a complete Diwali puja kit — diyas, hawan samagri, ghee batti and a brass kalash to anchor the muhurat.",
    blurbHi:
      "माँ लक्ष्मी का स्वागत करें सम्पूर्ण दीपावली पूजा किट के साथ — दीप, हवन सामग्री, घी की बत्ती एवं मुहूर्त हेतु पीतल कलश।",
    productSlugs: [
      "vedic-tatva-laxmi-deepak-brass-diya-collection",
      "vedic-tatva-akhand-jot-brass-diya-glass-cover",
      "vedic-tatva-decorative-brass-diyas-collection",
      "vedic-tatva-panchgavya-cow-ghee-diya-battis-150",
      "vedic-tatva-hawan-samagri-32-herb-vedic-mix",
    ],
    services: [
      { label: "Book a Pandit for Lakshmi Puja", href: "/pandits", description: "Verified Karmkandi pandit at your doorstep on Diwali night." },
      { label: "Diwali Muhurat", href: "/muhurat-finder", description: "Choose the most auspicious time for Lakshmi pujan." },
      { label: "Online Lakshmi Puja", href: "/online-puja-booking", description: "Sankalp puja livestreamed from a sacred temple." },
    ],
  },
  navratri: {
    id: "navratri",
    blurb:
      "Nine nights of Devi — set up your kalash, light the akhand jot, and offer havan to Maa Durga every evening.",
    blurbHi:
      "देवी की नौ रातें — कलश स्थापना करें, अखंड ज्योति जलाएँ एवं प्रतिदिन माँ दुर्गा को हवन अर्पित करें।",
    productSlugs: [
      "vedic-tatva-akhand-jot-brass-diya-glass-cover",
      "vedic-tatva-aluminum-havan-kund-stepped-pyramid",
      "vedic-tatva-havan-samagri-32-herb-vedic-mix",
      "vedic-tatva-mango-wood-samidha-havan-sticks",
      "vedic-tatva-havan-chammach-brass-sruva",
    ],
    services: [
      { label: "Book a Durga Saptashati Pandit", href: "/pandits", description: "Recitation of all 13 chapters across nine nights." },
      { label: "Navratri Online Puja", href: "/online-puja-booking", description: "Daily aarti livestreamed from Vaishno Devi & Kamakhya." },
    ],
  },
  "ganesh-chaturthi": {
    id: "ganesh-chaturthi",
    blurb:
      "Ganpati Bappa Morya — install your idol, complete pranapratishtha, and offer modaks for ten days of bliss.",
    blurbHi:
      "गणपति बप्पा मोरया — मूर्ति स्थापना करें, प्राणप्रतिष्ठा सम्पन्न कराएँ एवं दस दिन मोदक अर्पण कर आनंद पाएँ।",
    productSlugs: [
      "vedic-tatva-akhand-jot-brass-diya-glass-cover",
      "vedic-tatva-hawan-samagri-32-herb-vedic-mix",
      "vedic-tatva-panchgavya-cow-ghee-diya-battis-150",
    ],
    services: [
      { label: "Book Ganpati Sthapana Pandit", href: "/pandits", description: "Pranapratishtha and daily aarti for the full 10 days." },
      { label: "Online Ganesh Puja", href: "/online-puja-booking", description: "Sankalp puja from Siddhivinayak with prasad delivered." },
    ],
  },
  janmashtami: {
    id: "janmashtami",
    blurb:
      "Welcome Kanha at midnight — abhishek of Laddu Gopal, panchamrit, makhan-mishri, and a divine jhoola.",
    blurbHi:
      "मध्यरात्रि कान्हा का स्वागत करें — लड्डू गोपाल का अभिषेक, पंचामृत, माखन-मिश्री एवं दिव्य झूला।",
    productSlugs: [
      "vedic-tatva-panchgavya-cow-ghee-diya-battis-150",
      "vedic-tatva-akhand-jot-brass-diya-glass-cover",
      "vedic-tatva-hawan-samagri-32-herb-vedic-mix",
    ],
    services: [
      { label: "Book a Janmashtami Pandit", href: "/pandits", description: "Midnight abhishek of Laddu Gopal at your home." },
      { label: "Online Krishna Puja", href: "/online-puja-booking", description: "Live darshan from Vrindavan & Mathura." },
    ],
  },
  mahashivratri: {
    id: "mahashivratri",
    blurb:
      "The night of Shiva — rudrabhishek, bilva patra, ghee diya and four prahar of jagrata.",
    blurbHi:
      "शिव की रात्रि — रुद्राभिषेक, बेलपत्र, घी का दीप एवं चार प्रहर का जागरण।",
    productSlugs: [
      "vedic-tatva-brass-trishul-shiva-trident",
      "vedic-tatva-panchgavya-cow-ghee-diya-battis-150",
      "vedic-tatva-akhand-jot-brass-diya-glass-cover",
      "vedic-tatva-havan-samagri-32-herb-vedic-mix",
    ],
    services: [
      { label: "Book a Rudrabhishek Pandit", href: "/pandits", description: "Full Rudri paath through all four prahar of the night." },
      { label: "Online Mahamrityunjaya Jaap", href: "/online-puja-booking", description: "1.25 lakh jaap performed for your sankalp." },
    ],
  },
  holi: {
    id: "holi",
    blurb:
      "Holika Dahan & Rangwali Holi — havan kund, samagri, and bright diyas to invite Spring.",
    blurbHi:
      "होलिका दहन एवं रंगवाली होली — हवन कुंड, सामग्री एवं वसंत के स्वागत हेतु प्रकाशमय दीप।",
    productSlugs: [
      "vedic-tatva-aluminum-havan-kund-stepped-pyramid",
      "vedic-tatva-havan-samagri-32-herb-vedic-mix",
      "vedic-tatva-mango-wood-samidha-havan-sticks",
    ],
    services: [
      { label: "Book a Holika Dahan Pandit", href: "/pandits", description: "Complete sankalp & ahuti during the muhurat." },
    ],
  },
  "karva-chauth": {
    id: "karva-chauth",
    blurb:
      "Sargi to moonrise — diya, kalash, sieve and a sacred sankalp for the wedded vow.",
    blurbHi:
      "सरगी से चंद्रोदय तक — दीप, कलश, छलनी एवं सुहाग व्रत हेतु पावन संकल्प।",
    productSlugs: [
      "vedic-tatva-akhand-jot-brass-diya-glass-cover",
      "vedic-tatva-laxmi-deepak-brass-diya-collection",
    ],
    services: [
      { label: "Karva Chauth Muhurat", href: "/muhurat-finder", description: "Find moonrise time and chandra darshan window for your city." },
    ],
  },
  "raksha-bandhan": {
    id: "raksha-bandhan",
    blurb:
      "Tie the sacred thread — light the diya, offer aarti and bless the bond.",
    blurbHi:
      "पावन सूत्र बाँधें — दीप जलाएँ, आरती अर्पित करें एवं स्नेह बंधन को आशीर्वाद दें।",
    productSlugs: [
      "vedic-tatva-akhand-jot-brass-diya-glass-cover",
      "vedic-tatva-laxmi-deepak-brass-diya-collection",
    ],
    services: [],
  },
  "ram-navami": {
    id: "ram-navami",
    blurb:
      "Birth of Maryada Purushottam — Sundarkand paath, Ramayan recitation, akhand jot.",
    blurbHi:
      "मर्यादा पुरुषोत्तम का जन्म — सुंदरकांड पाठ, रामायण का वाचन एवं अखंड ज्योति।",
    productSlugs: [
      "vedic-tatva-akhand-jot-brass-diya-glass-cover",
      "vedic-tatva-hawan-samagri-32-herb-vedic-mix",
    ],
    services: [
      { label: "Book a Ramayan Path Pandit", href: "/pandits", description: "Akhand Ramayan or Sundarkand at your home." },
    ],
  },
  "hanuman-jayanti": {
    id: "hanuman-jayanti",
    blurb:
      "Bajrang Bali ki Jai — Hanuman Chalisa paath, sindoor chola, akhand jot.",
    blurbHi:
      "बजरंग बली की जय — हनुमान चालीसा पाठ, सिंदूरी चोला एवं अखंड ज्योति।",
    productSlugs: [
      "vedic-tatva-akhand-jot-brass-diya-glass-cover",
      "vedic-tatva-brass-trishul-shiva-trident",
    ],
    services: [
      { label: "Book a Sundarkand Pandit", href: "/pandits", description: "108-times Hanuman Chalisa paath performed at your home." },
    ],
  },
  "vasant-panchami": {
    id: "vasant-panchami",
    blurb: "Saraswati pujan — wisdom, music, and the colour of mustard blooms.",
    blurbHi: "सरस्वती पूजन — ज्ञान, संगीत एवं सरसों के पीले रंग की छटा।",
    productSlugs: [
      "vedic-tatva-akhand-jot-brass-diya-glass-cover",
      "vedic-tatva-hawan-samagri-32-herb-vedic-mix",
    ],
    services: [
      { label: "Book a Saraswati Pujan Pandit", href: "/pandits", description: "Vidya-arambh sanskar for children also available." },
    ],
  },
  "akshaya-tritiya": {
    id: "akshaya-tritiya",
    blurb:
      "The day of imperishable beginnings — Lakshmi-Kuber pujan, ghee diya, sacred kalash.",
    blurbHi:
      "अक्षय आरंभ का दिन — लक्ष्मी-कुबेर पूजन, घी का दीप एवं पावन कलश।",
    productSlugs: [
      "vedic-tatva-laxmi-deepak-brass-diya-collection",
      "vedic-tatva-panchgavya-cow-ghee-diya-battis-150",
      "vedic-tatva-akhand-jot-brass-diya-glass-cover",
    ],
    services: [
      { label: "Book a Lakshmi-Kuber Pandit", href: "/pandits", description: "Auspicious pujan during the unending muhurat." },
      { label: "Akshaya Tritiya Muhurat", href: "/muhurat-finder", description: "Pick the precise window for new beginnings." },
    ],
  },
  chhath: {
    id: "chhath",
    blurb: "Arghya to Surya Dev at dawn and dusk — soop, daura, and the sacred ghat.",
    blurbHi: "प्रभात एवं संध्या में सूर्य देव को अर्घ्य — सूप, दउरा एवं पावन घाट।",
    productSlugs: [
      "vedic-tatva-panchgavya-cow-ghee-diya-battis-150",
      "vedic-tatva-akhand-jot-brass-diya-glass-cover",
    ],
    services: [],
  },
};

export function getFestivalKit(id: string): FestivalKit | null {
  return FESTIVAL_KITS[id] ?? null;
}

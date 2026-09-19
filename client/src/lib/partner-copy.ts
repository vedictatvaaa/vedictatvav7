import type { Language } from "@/lib/i18n";

type PartnerCopy = {
  eyebrow: string;
  heading: string;
  intro: string;
  back: string;
  backAria: string;
  providers: {
    pandit: {
      status: string;
      title: string;
      description: string;
      benefits: string[];
      cta: string;
      iconLabel: string;
    };
    astrologer: {
      status: string;
      title: string;
      description: string;
      benefits: string[];
      cta: string;
      iconLabel: string;
    };
  };
  benefitsHeading: string;
  benefitsIntro: string;
  benefits: Array<{
    title: string;
    descriptor: string;
    description: string;
    badge: string;
    iconLabel: string;
  }>;
  opportunityHeading: string;
  opportunityIntro: string;
  opportunities: Array<{
    title: string;
    gaugeLabel: string;
    descriptor: string;
    description: string;
    iconLabel: string;
  }>;
  stats: Array<{ value: string; label: string }>;
  closing: string;
  footer: {
    privacy: string;
    terms: string;
    help: string;
  };
  statusActiveAria: string;
  statusUnavailableAria: string;
  gaugeAria: (title: string, descriptor: string) => string;
};

const englishCopy: PartnerCopy = {
  eyebrow: "PARTNER WITH A HIGHER PURPOSE",
  heading: "How would you like to join Vedic Tatva?",
  intro: "Build your presence, offer your services and be part of a growing spiritual ecosystem.",
  back: "Back",
  backAria: "Go back",
  providers: {
    pandit: {
      status: "ACTIVE",
      title: "Pandit",
      description: "Offer puja, ritual and spiritual services to devotees.",
      benefits: [
        "Be discovered by devotees across India",
        "Manage your services and bookings",
        "Grow with Vedic Tatva",
      ],
      cta: "Continue as Pandit",
      iconLabel: "Puja diya",
    },
    astrologer: {
      status: "Currently Unavailable",
      title: "Astrologer",
      description: "Offer astrology consultations and guidance to devotees.",
      benefits: [
        "Create your professional profile",
        "Connect with devotees seeking guidance",
        "Use AI based planetary tools",
      ],
      cta: "Currently unavailable",
      iconLabel: "Planetary zodiac",
    },
  },
  benefitsHeading: "Partner Benefits",
  benefitsIntro: "Complete support to help you serve and grow.",
  benefits: [
    {
      title: "Free Lifetime Membership",
      descriptor: "Join Vedic Tatva for life.",
      description: "No lifetime membership fee.",
      badge: "FREE • LIFETIME",
      iconLabel: "People",
    },
    {
      title: "Free Lifetime Website",
      descriptor: "Build your digital presence.",
      description: "Get a professional Vedic Tatva website.",
      badge: "FREE • LIFETIME",
      iconLabel: "Laptop",
    },
    {
      title: "Premium AI Planetary Tools",
      descriptor: "Smarter tools for your services.",
      description: "Free access to AI based planetary tools for Puja & Astrology.",
      badge: "AI TOOLS",
      iconLabel: "Planetary intelligence",
    },
    {
      title: "Access to Vedic Tatva Product Catalog",
      descriptor: "Access our product catalogue.",
      description: "Resell Vedic Tatva products or earn through eligible commission-based sales.",
      badge: "CATALOG ACCESS",
      iconLabel: "Product package",
    },
  ],
  opportunityHeading: "What can you build with Vedic Tatva?",
  opportunityIntro: "Real opportunities. A bigger reach. A stronger presence.",
  opportunities: [
    {
      title: "DEVOTEE REACH",
      gaugeLabel: "Pan-India discovery",
      descriptor: "Pan-India discovery",
      description: "Be discovered by devotees searching for Pandits.",
      iconLabel: "People and location",
    },
    {
      title: "SERVICE DISCOVERY",
      gaugeLabel: "100+ Puja & ritual types",
      descriptor: "100+ Puja & ritual types",
      description: "Offer services from the Vedic Tatva catalogue.",
      iconLabel: "Puja and ritual",
    },
    {
      title: "DIGITAL PRESENCE",
      gaugeLabel: "Your professional profile",
      descriptor: "Your professional profile",
      description: "Showcase your services, experience, location & photos.",
      iconLabel: "Profile and laptop",
    },
    {
      title: "BOOKING OPPORTUNITY",
      gaugeLabel: "Connect with devotees",
      descriptor: "Connect with devotees",
      description: "Be part of Vedic Tatva’s discovery and online booking journey.",
      iconLabel: "Calendar",
    },
  ],
  stats: [
    { value: "500+", label: "Pandits" },
    { value: "10K+", label: "Families" },
    { value: "100+", label: "Puja Types" },
    { value: "Pan-India", label: "Presence" },
  ],
  closing: "Your profile. Your services. Your digital presence — on Vedic Tatva.",
  footer: {
    privacy: "Privacy",
    terms: "Terms",
    help: "Help",
  },
  statusActiveAria: "Pandit provider is active",
  statusUnavailableAria: "Astrologer provider is currently unavailable",
  gaugeAria: (title, descriptor) => `${title}: capability indicator for ${descriptor}`,
};

const hindiCopy: PartnerCopy = {
  eyebrow: "एक उच्च उद्देश्य के साथ साझेदारी करें",
  heading: "आप Vedic Tatva से कैसे जुड़ना चाहेंगे?",
  intro: "अपनी पहचान बनाएं, अपनी सेवाएं दें और बढ़ते आध्यात्मिक समुदाय का हिस्सा बनें।",
  back: "वापस",
  backAria: "पिछले पृष्ठ पर जाएं",
  providers: {
    pandit: {
      status: "सक्रिय",
      title: "पंडित",
      description: "भक्तों को पूजा, अनुष्ठान और आध्यात्मिक सेवाएं दें।",
      benefits: [
        "पूरे भारत के भक्तों तक पहुंचें",
        "अपनी सेवाओं और बुकिंग का प्रबंधन करें",
        "Vedic Tatva के साथ आगे बढ़ें",
      ],
      cta: "पंडित के रूप में जारी रखें",
      iconLabel: "पूजा दीपक",
    },
    astrologer: {
      status: "फिलहाल उपलब्ध नहीं",
      title: "ज्योतिषी",
      description: "भक्तों को ज्योतिष परामर्श और मार्गदर्शन दें।",
      benefits: [
        "अपनी पेशेवर प्रोफ़ाइल बनाएं",
        "मार्गदर्शन चाहने वाले भक्तों से जुड़ें",
        "एआई आधारित ग्रह उपकरणों का उपयोग करें",
      ],
      cta: "फिलहाल उपलब्ध नहीं",
      iconLabel: "ग्रह और राशि",
    },
  },
  benefitsHeading: "साझेदारी के लाभ",
  benefitsIntro: "सेवा और विकास में आपकी पूरी सहायता।",
  benefits: [
    {
      title: "निःशुल्क आजीवन सदस्यता",
      descriptor: "जीवन भर Vedic Tatva से जुड़ें।",
      description: "आजीवन सदस्यता शुल्क नहीं।",
      badge: "निःशुल्क • आजीवन",
      iconLabel: "लोग",
    },
    {
      title: "निःशुल्क आजीवन वेबसाइट",
      descriptor: "अपनी डिजिटल पहचान बनाएं।",
      description: "Vedic Tatva की पेशेवर वेबसाइट पाएं।",
      badge: "निःशुल्क • आजीवन",
      iconLabel: "लैपटॉप",
    },
    {
      title: "प्रीमियम एआई ग्रह उपकरण",
      descriptor: "अपनी सेवाओं के लिए बेहतर उपकरण।",
      description: "पूजा और ज्योतिष के लिए एआई आधारित ग्रह उपकरणों का निःशुल्क उपयोग।",
      badge: "एआई उपकरण",
      iconLabel: "ग्रह बुद्धिमत्ता",
    },
    {
      title: "Vedic Tatva उत्पाद कैटलॉग तक पहुंच",
      descriptor: "हमारे उत्पाद कैटलॉग तक पहुंचें।",
      description: "Vedic Tatva उत्पादों को दोबारा बेचें या योग्य कमीशन-आधारित बिक्री से कमाएं।",
      badge: "कैटलॉग एक्सेस",
      iconLabel: "उत्पाद पैकेज",
    },
  ],
  opportunityHeading: "Vedic Tatva के साथ आप क्या बना सकते हैं?",
  opportunityIntro: "वास्तविक अवसर। अधिक पहुंच। मजबूत पहचान।",
  opportunities: [
    {
      title: "भक्तों तक पहुंच",
      gaugeLabel: "पूरे भारत में खोज",
      descriptor: "पूरे भारत में खोज",
      description: "पंडित खोजने वाले भक्तों तक पहुंचें।",
      iconLabel: "लोग और स्थान",
    },
    {
      title: "सेवा खोज",
      gaugeLabel: "100+ पूजा और अनुष्ठान प्रकार",
      descriptor: "100+ पूजा और अनुष्ठान प्रकार",
      description: "Vedic Tatva कैटलॉग की सेवाएं प्रदान करें।",
      iconLabel: "पूजा और अनुष्ठान",
    },
    {
      title: "डिजिटल पहचान",
      gaugeLabel: "आपकी पेशेवर प्रोफ़ाइल",
      descriptor: "आपकी पेशेवर प्रोफ़ाइल",
      description: "अपनी सेवाओं, अनुभव, स्थान और तस्वीरों को दिखाएं।",
      iconLabel: "प्रोफ़ाइल और लैपटॉप",
    },
    {
      title: "बुकिंग अवसर",
      gaugeLabel: "भक्तों से जुड़ें",
      descriptor: "भक्तों से जुड़ें",
      description: "Vedic Tatva की खोज और ऑनलाइन बुकिंग यात्रा का हिस्सा बनें।",
      iconLabel: "कैलेंडर",
    },
  ],
  stats: [
    { value: "500+", label: "पंडित" },
    { value: "10K+", label: "परिवार" },
    { value: "100+", label: "पूजा प्रकार" },
    { value: "पूरे भारत", label: "उपस्थिति" },
  ],
  closing: "आपकी प्रोफ़ाइल। आपकी सेवाएं। Vedic Tatva पर आपकी डिजिटल पहचान।",
  footer: {
    privacy: "गोपनीयता",
    terms: "नियम",
    help: "सहायता",
  },
  statusActiveAria: "पंडित प्रदाता सक्रिय है",
  statusUnavailableAria: "ज्योतिषी प्रदाता फिलहाल उपलब्ध नहीं है",
  gaugeAria: (title, descriptor) => `${title}: ${descriptor} के लिए क्षमता संकेतक`,
};

export function getPartnerCopy(language: Language): PartnerCopy {
  return language === "hi" ? hindiCopy : englishCopy;
}
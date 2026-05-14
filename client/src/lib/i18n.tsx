import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export type Language = "en" | "hi" | "sa" | "ta" | "te" | "bn" | "mr" | "gu";

export const languages: { code: Language; label: string; nativeLabel: string; flag: string }[] = [
  { code: "en", label: "English", nativeLabel: "English", flag: "🇬🇧" },
  { code: "hi", label: "Hindi", nativeLabel: "हिन्दी", flag: "🇮🇳" },
  { code: "sa", label: "Sanskrit", nativeLabel: "संस्कृतम्", flag: "🕉️" },
  { code: "ta", label: "Tamil", nativeLabel: "தமிழ்", flag: "🇮🇳" },
  { code: "te", label: "Telugu", nativeLabel: "తెలుగు", flag: "🇮🇳" },
  { code: "bn", label: "Bengali", nativeLabel: "বাংলা", flag: "🇮🇳" },
  { code: "mr", label: "Marathi", nativeLabel: "मराठी", flag: "🇮🇳" },
  { code: "gu", label: "Gujarati", nativeLabel: "ગુજરાતી", flag: "🇮🇳" },
];

type TranslationKeys = {
  nav: {
    shop: string;
    bookPandit: string;
    bookPuja: string;
    astrology: string;
    zodiac: string;
    panchang: string;
    membership: string;
    myProfile: string;
    mySpiritualJourney: string;
    orderHistory: string;
    wishlist: string;
    subscriptions: string;
    returns: string;
    adminDashboard: string;
    login: string;
    register: string;
    logout: string;
    account: string;
    searchPlaceholder: string;
  };
  hero: {
    tagline: string;
    title1: string;
    title2: string;
    title2Highlight: string;
    subtitle: string;
    shopNow: string;
    bookPandit: string;
    rating: string;
    happyFamilies: string;
    verifiedPandits: string;
  };
  services: {
    sectionTag: string;
    heading: string;
    subheading: string;
    pujaEssentials: string;
    bookPandit: string;
    pujaServices: string;
    astrology: string;
    zodiacRashifal: string;
    aiKundli: string;
    panchang: string;
    virtualPuja: string;
    babyNames: string;
    palmReading: string;
    vastuCompass: string;
    kathas: string;
    donations: string;
    myJourney: string;
    muhuratFinder: string;
    matrimony: string;
    compare: string;
    neevBasics: string;
    templeTourism: string;
    scriptureSearch: string;
    routePlanner: string;
  };
  products: {
    sectionTag: string;
    heading: string;
    subheading: string;
    addToCart: string;
    viewAll: string;
    outOfStock: string;
    off: string;
  };
  footer: {
    tagline: string;
    services: string;
    company: string;
    policies: string;
    shopEssentials: string;
    findPandit: string;
    bookPuja: string;
    astrology: string;
    donations: string;
    panchangCalendar: string;
    spiritualDashboard: string;
    virtualPuja: string;
    compareProducts: string;
    sacredKathas: string;
    muhuratFinder: string;
    matrimony: string;
    vastuCompass: string;
    aboutUs: string;
    contact: string;
    careers: string;
    becomePandit: string;
    becomeAstrologer: string;
    termsConditions: string;
    privacyPolicy: string;
    refundPolicy: string;
    shippingPolicy: string;
    copyright: string;
    madeWith: string;
  };
  newsletter: {
    eyebrow: string;
    description: string;
    placeholder: string;
    subscribe: string;
    success: string;
    error: string;
    invalidEmail: string;
  };
  common: {
    comingSoon: string;
    viewAll: string;
    learnMore: string;
    loading: string;
    new: string;
    trending: string;
    bought: string;
  };
  neevModal: {
    heading: string;
    subtitle: string;
    tagline: string;
    innerwears: string;
    innerwearsDesc: string;
    kurtaSets: string;
    kurtaSetsDesc: string;
    dhotiCollection: string;
    dhotiDesc: string;
    whyTitle: string;
    doubleCombedCotton: string;
    noSynthetic: string;
    skinFriendly: string;
    madeInIndia: string;
    premiumStitching: string;
    traditionalDesigns: string;
    launchingSoon: string;
    followUs: string;
  };
};

const translations: Record<Language, TranslationKeys> = {
  en: {
    nav: {
      shop: "Shop",
      bookPandit: "Book Pandit",
      bookPuja: "Book Puja",
      astrology: "Astrology",
      zodiac: "Zodiac",
      panchang: "Panchang",
      membership: "Membership",
      myProfile: "My Profile",
      mySpiritualJourney: "My Spiritual Journey",
      orderHistory: "Order History",
      wishlist: "Wishlist",
      subscriptions: "Subscriptions",
      returns: "Returns",
      adminDashboard: "Admin Dashboard",
      login: "Login",
      register: "Register",
      logout: "Logout",
      account: "Account",
      searchPlaceholder: "Search products, services, pandits...",
    },
    hero: {
      tagline: "Vedic Tatva",
      title1: "Where Spirituality",
      title2: "Meets",
      title2Highlight: "Technology",
      subtitle: "Shop sacred essentials. Book verified pandits. Experience authentic rituals — all in one place.",
      shopNow: "Shop Now",
      bookPandit: "Book Pandit",
      rating: "4.9/5",
      happyFamilies: "10,000+ Happy Families",
      verifiedPandits: "500+ Verified Pandits",
    },
    services: {
      sectionTag: "Our Services",
      heading: "Book Pandits, Puja Services & More",
      subheading: "Explore our complete range of spiritual services — from verified pandit booking and puja rituals to AI-powered astrology and sacred donations.",
      pujaEssentials: "Puja Essentials",
      bookPandit: "Book Pandit",
      pujaServices: "Puja Services",
      astrology: "Astrology",
      zodiacRashifal: "Zodiac & Rashifal",
      aiKundli: "AI Kundli",
      panchang: "Panchang",
      virtualPuja: "Virtual Puja",
      babyNames: "Baby Names",
      palmReading: "Palm Reading",
      vastuCompass: "Vastu Compass",
      kathas: "Kathas",
      donations: "Donations",
      myJourney: "My Journey",
      muhuratFinder: "Muhurat Finder",
      matrimony: "Matrimony",
      compare: "Compare",
      neevBasics: "Neev Basics",
      templeTourism: "Temple Tourism", scriptureSearch: "Scripture Search", routePlanner: "Route Planner",
    },
    products: {
      sectionTag: "Handpicked for You",
      heading: "Sacred Essentials Crafted with Purity",
      subheading: "Best-selling spiritual products trusted by thousands of devotees across India",
      addToCart: "Add to Cart",
      viewAll: "View All Products",
      outOfStock: "Out of Stock",
      off: "OFF",
    },
    footer: {
      tagline: "Heritage of Nature Wellness & Purity",
      services: "Services",
      company: "Company",
      policies: "Policies",
      shopEssentials: "Shop Essentials",
      findPandit: "Find a Pandit",
      bookPuja: "Book a Puja",
      astrology: "Astrology",
      donations: "Donations",
      panchangCalendar: "Panchang Calendar",
      spiritualDashboard: "Spiritual Dashboard",
      virtualPuja: "Virtual Puja",
      compareProducts: "Compare Products",
      sacredKathas: "Sacred Kathas",
      muhuratFinder: "Muhurat Finder",
      matrimony: "Matrimony",
      vastuCompass: "Vastu Compass",
      aboutUs: "About Us",
      contact: "Contact",
      careers: "Careers",
      becomePandit: "Become a Pandit",
      becomeAstrologer: "Become an Astrologer",
      termsConditions: "Terms & Conditions",
      privacyPolicy: "Privacy Policy",
      refundPolicy: "Refund Policy",
      shippingPolicy: "Shipping Policy",
      copyright: "Vedic Tatva. All rights reserved.",
      madeWith: "Made with devotion in India",
    },
    newsletter: {
      eyebrow: "Stay connected",
      description: "Send festival & panchang alerts to my inbox.",
      placeholder: "your@email.com",
      subscribe: "Subscribe",
      success: "Subscribed! Check your inbox soon.",
      error: "Something went wrong. Please try again.",
      invalidEmail: "Please enter a valid email address.",
    },
    common: {
      comingSoon: "Coming Soon",
      viewAll: "View All",
      learnMore: "Learn More",
      loading: "Loading...",
      new: "New",
      trending: "Trending",
      bought: "bought",
    },
    neevModal: {
      heading: "Coming Soon",
      subtitle: "Premium Traditional Wear Collection",
      tagline: "100% Double-Combed Cotton. Unadulterated. Premium Quality. Rooted in Indian Heritage.",
      innerwears: "Premium Innerwears",
      innerwearsDesc: "100% combed cotton, breathable & skin-friendly",
      kurtaSets: "Kurta & Kurti Sets",
      kurtaSetsDesc: "Handcrafted traditional wear for men & women",
      dhotiCollection: "Dhoti Collection",
      dhotiDesc: "Pure cotton dhoti in traditional & modern styles",
      whyTitle: "Why Neev Basics?",
      doubleCombedCotton: "100% Double-Combed Cotton",
      noSynthetic: "No Synthetic Blends",
      skinFriendly: "Skin-Friendly Dyes",
      madeInIndia: "Made in India",
      premiumStitching: "Premium Stitching",
      traditionalDesigns: "Traditional Designs",
      launchingSoon: "Launching Soon — Stay Tuned!",
      followUs: "Follow us for exclusive launch offers & early access",
    },
  },
  hi: {
    nav: {
      shop: "दुकान",
      bookPandit: "पंडित बुक करें",
      bookPuja: "पूजा बुक करें",
      astrology: "ज्योतिष",
      zodiac: "राशिफल",
      panchang: "पंचांग",
      membership: "सदस्यता",
      myProfile: "मेरी प्रोफ़ाइल",
      mySpiritualJourney: "मेरी आध्यात्मिक यात्रा",
      orderHistory: "ऑर्डर इतिहास",
      wishlist: "इच्छा सूची",
      subscriptions: "सदस्यताएं",
      returns: "वापसी",
      adminDashboard: "व्यवस्थापक डैशबोर्ड",
      login: "लॉगिन",
      register: "पंजीकरण",
      logout: "लॉगआउट",
      account: "खाता",
      searchPlaceholder: "उत्पाद, सेवाएं, पंडित खोजें...",
    },
    hero: {
      tagline: "वेदिक तत्त्व",
      title1: "जहां अध्यात्म",
      title2: "मिलती है",
      title2Highlight: "प्रौद्योगिकी से",
      subtitle: "पवित्र सामग्री खरीदें। सत्यापित पंडितों को बुक करें। प्रामाणिक अनुष्ठानों का अनुभव करें — सब एक ही जगह।",
      shopNow: "अभी खरीदें",
      bookPandit: "पंडित बुक करें",
      rating: "4.9/5",
      happyFamilies: "10,000+ खुशहाल परिवार",
      verifiedPandits: "500+ सत्यापित पंडित",
    },
    services: {
      sectionTag: "हमारी सेवाएं",
      heading: "पंडित बुक करें, पूजा सेवाएं और अधिक",
      subheading: "सत्यापित पंडित बुकिंग और पूजा अनुष्ठानों से लेकर AI-संचालित ज्योतिष और पवित्र दान तक — हमारी संपूर्ण आध्यात्मिक सेवाओं का अन्वेषण करें।",
      pujaEssentials: "पूजा सामग्री",
      bookPandit: "पंडित बुक करें",
      pujaServices: "पूजा सेवाएं",
      astrology: "ज्योतिष",
      zodiacRashifal: "राशिफल",
      aiKundli: "AI कुंडली",
      panchang: "पंचांग",
      virtualPuja: "वर्चुअल पूजा",
      babyNames: "शिशु नाम",
      palmReading: "हस्तरेखा",
      vastuCompass: "वास्तु कम्पास",
      kathas: "कथाएं",
      donations: "दान",
      myJourney: "मेरी यात्रा",
      muhuratFinder: "मुहूर्त खोजें",
      matrimony: "विवाह",
      compare: "तुलना",
      neevBasics: "नींव बेसिक्स",
      templeTourism: "मंदिर पर्यटन", scriptureSearch: "शास्त्र खोज", routePlanner: "मार्ग योजक",
    },
    products: {
      sectionTag: "आपके लिए चुने गए",
      heading: "शुद्धता से निर्मित पवित्र सामग्री",
      subheading: "भारत भर के हजारों भक्तों द्वारा विश्वसनीय सर्वश्रेष्ठ आध्यात्मिक उत्पाद",
      addToCart: "कार्ट में डालें",
      viewAll: "सभी उत्पाद देखें",
      outOfStock: "स्टॉक में नहीं",
      off: "छूट",
    },
    footer: {
      tagline: "Heritage of Nature Wellness & Purity",
      services: "सेवाएं",
      company: "कंपनी",
      policies: "नीतियां",
      shopEssentials: "पूजा सामग्री",
      findPandit: "पंडित खोजें",
      bookPuja: "पूजा बुक करें",
      astrology: "ज्योतिष",
      donations: "दान",
      panchangCalendar: "पंचांग कैलेंडर",
      spiritualDashboard: "आध्यात्मिक डैशबोर्ड",
      virtualPuja: "वर्चुअल पूजा",
      compareProducts: "उत्पाद तुलना",
      sacredKathas: "पवित्र कथाएं",
      muhuratFinder: "मुहूर्त खोजें",
      matrimony: "विवाह",
      vastuCompass: "वास्तु कम्पास",
      aboutUs: "हमारे बारे में",
      contact: "संपर्क",
      careers: "करियर",
      becomePandit: "पंडित बनें",
      becomeAstrologer: "ज्योतिषी बनें",
      termsConditions: "नियम एवं शर्तें",
      privacyPolicy: "गोपनीयता नीति",
      refundPolicy: "धनवापसी नीति",
      shippingPolicy: "शिपिंग नीति",
      copyright: "वेदिक तत्त्व। सर्वाधिकार सुरक्षित।",
      madeWith: "भारत में श्रद्धा से निर्मित",
    },
    newsletter: {
      eyebrow: "जुड़े रहें",
      description: "त्योहार और पंचांग अलर्ट मेरे इनबॉक्स में भेजें।",
      placeholder: "your@email.com",
      subscribe: "सब्सक्राइब",
      success: "सब्सक्राइब हो गया! जल्द ही अपना इनबॉक्स देखें।",
      error: "कुछ गड़बड़ हो गई। कृपया पुनः प्रयास करें।",
      invalidEmail: "कृपया एक वैध ईमेल पता दर्ज करें।",
    },
    common: {
      comingSoon: "जल्द आ रहा है",
      viewAll: "सभी देखें",
      learnMore: "और जानें",
      loading: "लोड हो रहा है...",
      new: "नया",
      trending: "ट्रेंडिंग",
      bought: "ने खरीदा",
    },
    neevModal: {
      heading: "जल्द आ रहा है",
      subtitle: "प्रीमियम पारंपरिक वस्त्र संग्रह",
      tagline: "100% डबल-कॉम्ब्ड कॉटन। शुद्ध। प्रीमियम गुणवत्ता। भारतीय विरासत में निहित।",
      innerwears: "प्रीमियम अंडरवियर",
      innerwearsDesc: "100% कॉम्ब्ड कॉटन, सांस लेने योग्य और त्वचा-अनुकूल",
      kurtaSets: "कुर्ता और कुर्ती सेट",
      kurtaSetsDesc: "पुरुषों और महिलाओं के लिए हस्तनिर्मित पारंपरिक वस्त्र",
      dhotiCollection: "धोती संग्रह",
      dhotiDesc: "पारंपरिक और आधुनिक शैली में शुद्ध सूती धोती",
      whyTitle: "नींव बेसिक्स क्यों?",
      doubleCombedCotton: "100% डबल-कॉम्ब्ड कॉटन",
      noSynthetic: "कोई सिंथेटिक मिश्रण नहीं",
      skinFriendly: "त्वचा-अनुकूल रंग",
      madeInIndia: "भारत में निर्मित",
      premiumStitching: "प्रीमियम सिलाई",
      traditionalDesigns: "पारंपरिक डिज़ाइन",
      launchingSoon: "जल्द लॉन्च हो रहा है — बने रहें!",
      followUs: "विशेष लॉन्च ऑफर और शुरुआती एक्सेस के लिए फॉलो करें",
    },
  },
  sa: {
    nav: {
      shop: "आपणम्",
      bookPandit: "पण्डितं नियोजयतु",
      bookPuja: "पूजां नियोजयतु",
      astrology: "ज्योतिषम्",
      zodiac: "राशिफलम्",
      panchang: "पञ्चाङ्गम्",
      membership: "सदस्यता",
      myProfile: "मम परिचयः",
      mySpiritualJourney: "मम आध्यात्मिकयात्रा",
      orderHistory: "आदेशवृत्तान्तः",
      wishlist: "इच्छासूची",
      subscriptions: "सदस्यताः",
      returns: "प्रत्यावर्तनम्",
      adminDashboard: "प्रशासकपटलम्",
      login: "प्रवेशः",
      register: "पञ्जीकरणम्",
      logout: "निर्गमः",
      account: "लेखा",
      searchPlaceholder: "उत्पादानि, सेवाः, पण्डिताः अन्विषयतु...",
    },
    hero: {
      tagline: "वेदिकतत्त्वम्",
      title1: "यत्र आध्यात्मिकता",
      title2: "मिलति",
      title2Highlight: "प्रौद्योगिक्या",
      subtitle: "पवित्रसामग्रीं क्रीणातु। प्रमाणितपण्डितान् नियोजयतु। प्रामाणिकानुष्ठानानि अनुभवतु — सर्वम् एकस्मिन् स्थाने।",
      shopNow: "अधुना क्रीणातु",
      bookPandit: "पण्डितं नियोजयतु",
      rating: "4.9/5",
      happyFamilies: "10,000+ सुखिनः परिवाराः",
      verifiedPandits: "500+ प्रमाणिताः पण्डिताः",
    },
    services: {
      sectionTag: "अस्माकं सेवाः",
      heading: "पण्डितान् नियोजयतु, पूजासेवाः च अधिकम्",
      subheading: "प्रमाणितपण्डितनियोजनात् पूजाविधिभ्यः AI-सञ्चालितज्योतिषपर्यन्तम् — अस्माकं सम्पूर्णसेवानाम् अन्वेषणं कुरुत।",
      pujaEssentials: "पूजासामग्री",
      bookPandit: "पण्डितनियोजनम्",
      pujaServices: "पूजासेवाः",
      astrology: "ज्योतिषम्",
      zodiacRashifal: "राशिफलम्",
      aiKundli: "AI कुण्डली",
      panchang: "पञ्चाङ्गम्",
      virtualPuja: "आभासिपूजा",
      babyNames: "शिशुनामानि",
      palmReading: "हस्तरेखा",
      vastuCompass: "वास्तुदिक्सूचकम्",
      kathas: "कथाः",
      donations: "दानम्",
      myJourney: "मम यात्रा",
      muhuratFinder: "मुहूर्तान्वेषणम्",
      matrimony: "विवाहः",
      compare: "तुलना",
      neevBasics: "नींव बेसिक्स",
      templeTourism: "मन्दिर पर्यटनम्", scriptureSearch: "शास्त्र अन्वेषणम्", routePlanner: "मार्ग नियोजकम्",
    },
    products: {
      sectionTag: "भवदर्थं चयनितम्",
      heading: "शुद्धतया निर्मिता पवित्रसामग्री",
      subheading: "भारतवर्षे सहस्रशः भक्तैः विश्वसिताः श्रेष्ठाः आध्यात्मिकोत्पादाः",
      addToCart: "कार्टे योजयतु",
      viewAll: "सर्वे उत्पादाः पश्यतु",
      outOfStock: "अनुपलब्धम्",
      off: "छूट",
    },
    footer: {
      tagline: "Heritage of Nature Wellness & Purity",
      services: "सेवाः",
      company: "संस्था",
      policies: "नीतयः",
      shopEssentials: "पूजासामग्री",
      findPandit: "पण्डितम् अन्विषयतु",
      bookPuja: "पूजां नियोजयतु",
      astrology: "ज्योतिषम्",
      donations: "दानम्",
      panchangCalendar: "पञ्चाङ्गदर्शिका",
      spiritualDashboard: "आध्यात्मिकपटलम्",
      virtualPuja: "आभासिपूजा",
      compareProducts: "उत्पादतुलना",
      sacredKathas: "पवित्रकथाः",
      muhuratFinder: "मुहूर्तान्वेषणम्",
      matrimony: "विवाहः",
      vastuCompass: "वास्तुदिक्सूचकम्",
      aboutUs: "अस्माकं विषये",
      contact: "सम्पर्कः",
      careers: "वृत्तयः",
      becomePandit: "पण्डितः भवतु",
      becomeAstrologer: "ज्योतिषी भवतु",
      termsConditions: "नियमाः शर्ताश्च",
      privacyPolicy: "गोपनीयतानीतिः",
      refundPolicy: "धनप्रत्यावर्तननीतिः",
      shippingPolicy: "प्रेषणनीतिः",
      copyright: "वेदिकतत्त्वम्। सर्वाधिकाराः सुरक्षिताः।",
      madeWith: "भारते श्रद्धया निर्मितम्",
    },
    newsletter: {
      eyebrow: "सम्बद्धाः तिष्ठन्तु",
      description: "उत्सवपञ्चाङ्गसूचनाः मम सन्देशपेटिकायां प्रेषयन्तु।",
      placeholder: "your@email.com",
      subscribe: "सदस्यता",
      success: "सदस्यता प्राप्ता! शीघ्रं स्वसन्देशपेटिकां पश्यतु।",
      error: "किमपि दोषः अभवत्। पुनः प्रयतताम्।",
      invalidEmail: "कृपया वैधं विद्युत्पत्रसङ्केतं ददातु।",
    },
    common: {
      comingSoon: "शीघ्रम् आगच्छति",
      viewAll: "सर्वं पश्यतु",
      learnMore: "अधिकं जानातु",
      loading: "आवर्तते...",
      new: "नवीनम्",
      trending: "प्रवृत्तिः",
      bought: "क्रीतम्",
    },
    neevModal: {
      heading: "शीघ्रम् आगच्छति",
      subtitle: "प्रीमियम पारम्परिकवस्त्रसंग्रहः",
      tagline: "100% द्विकॉम्ब्ड कार्पासम्। शुद्धम्। प्रीमियम गुणवत्ता। भारतीयविरासे निहितम्।",
      innerwears: "प्रीमियम अन्तर्वस्त्राणि",
      innerwearsDesc: "100% कॉम्ब्ड कार्पासम्, श्वसनीयं त्वचानुकूलम् च",
      kurtaSets: "कुर्ता-कुर्ती समुच्चयाः",
      kurtaSetsDesc: "नरनारीभ्यां हस्तनिर्मितं पारम्परिकवस्त्रम्",
      dhotiCollection: "धोतीसंग्रहः",
      dhotiDesc: "पारम्परिक-आधुनिकशैल्यां शुद्धकार्पासधोती",
      whyTitle: "नींव बेसिक्स किमर्थम्?",
      doubleCombedCotton: "100% द्विकॉम्ब्ड कार्पासम्",
      noSynthetic: "कृत्रिममिश्रणं नास्ति",
      skinFriendly: "त्वचानुकूलरङ्गाः",
      madeInIndia: "भारते निर्मितम्",
      premiumStitching: "प्रीमियम सीवनम्",
      traditionalDesigns: "पारम्परिकप्रतिरूपाणि",
      launchingSoon: "शीघ्रं प्रारम्भः — प्रतीक्षां कुरुत!",
      followUs: "विशेषप्रारम्भप्रस्तावानां प्रारम्भिकप्राप्तेः च कृते अनुसरतु",
    },
  },
  ta: {
    nav: {
      shop: "கடை",
      bookPandit: "பண்டிட் பதிவு",
      bookPuja: "பூஜை பதிவு",
      astrology: "ஜோதிடம்",
      zodiac: "ராசிபலன்",
      panchang: "பஞ்சாங்கம்",
      membership: "உறுப்பினர்",
      myProfile: "என் சுயவிவரம்",
      mySpiritualJourney: "என் ஆன்மீக பயணம்",
      orderHistory: "ஆர்டர் வரலாறு",
      wishlist: "விருப்ப பட்டியல்",
      subscriptions: "சந்தாக்கள்",
      returns: "திரும்பல்",
      adminDashboard: "நிர்வாக டாஷ்போர்ட்",
      login: "உள்நுழைவு",
      register: "பதிவு",
      logout: "வெளியேறு",
      account: "கணக்கு",
      searchPlaceholder: "பொருட்கள், சேவைகள், பண்டிட் தேடுங்கள்...",
    },
    hero: {
      tagline: "வேதிக் தத்வா",
      title1: "ஆன்மீகம்",
      title2: "சந்திக்கும்",
      title2Highlight: "தொழில்நுட்பம்",
      subtitle: "புனித பொருட்களை வாங்குங்கள். சரிபார்க்கப்பட்ட பண்டிட்களை முன்பதிவு செய்யுங்கள். நம்பகமான சடங்குகளை அனுபவியுங்கள்.",
      shopNow: "இப்போது வாங்கு",
      bookPandit: "பண்டிட் பதிவு",
      rating: "4.9/5",
      happyFamilies: "10,000+ மகிழ்ச்சியான குடும்பங்கள்",
      verifiedPandits: "500+ சரிபார்க்கப்பட்ட பண்டிட்கள்",
    },
    services: {
      sectionTag: "எங்கள் சேவைகள்",
      heading: "பண்டிட் பதிவு, பூஜை சேவைகள் மற்றும் மேலும்",
      subheading: "சரிபார்க்கப்பட்ட பண்டிட் பதிவு முதல் AI ஜோதிடம் வரை — எங்கள் முழு ஆன்மீக சேவைகளை ஆராயுங்கள்.",
      pujaEssentials: "பூஜை பொருட்கள்",
      bookPandit: "பண்டிட் பதிவு",
      pujaServices: "பூஜை சேவைகள்",
      astrology: "ஜோதிடம்",
      zodiacRashifal: "ராசிபலன்",
      aiKundli: "AI ஜாதகம்",
      panchang: "பஞ்சாங்கம்",
      virtualPuja: "மெய்நிகர் பூஜை",
      babyNames: "குழந்தை பெயர்கள்",
      palmReading: "கைரேகை",
      vastuCompass: "வாஸ்து திசைகாட்டி",
      kathas: "கதைகள்",
      donations: "நன்கொடை",
      myJourney: "என் பயணம்",
      muhuratFinder: "முகூர்த்தம்",
      matrimony: "திருமணம்",
      compare: "ஒப்பிடு",
      neevBasics: "நீவ் பேசிக்ஸ்",
      templeTourism: "கோயில் சுற்றுலா", scriptureSearch: "வேதநூல் தேடல்", routePlanner: "வழித்திட்டம்",
    },
    products: {
      sectionTag: "உங்களுக்காக தேர்ந்தெடுக்கப்பட்டவை",
      heading: "தூய்மையுடன் வடிவமைக்கப்பட்ட புனித பொருட்கள்",
      subheading: "இந்தியா முழுவதும் ஆயிரக்கணக்கான பக்தர்களால் நம்பகமான சிறந்த ஆன்மீக பொருட்கள்",
      addToCart: "கூடையில் சேர்",
      viewAll: "அனைத்தையும் காண்",
      outOfStock: "கையிருப்பில் இல்லை",
      off: "தள்ளுபடி",
    },
    footer: {
      tagline: "ஆன்மீகம் தொழில்நுட்பத்தை சந்திக்கும் இடம். பிரீமியம் ஆன்மீக சேவைகள், சரிபார்க்கப்பட்ட பண்டிட்கள், நம்பகமான பூஜை பொருட்கள்.",
      services: "சேவைகள்",
      company: "நிறுவனம்",
      policies: "கொள்கைகள்",
      shopEssentials: "பூஜை பொருட்கள்",
      findPandit: "பண்டிட் கண்டுபிடி",
      bookPuja: "பூஜை பதிவு",
      astrology: "ஜோதிடம்",
      donations: "நன்கொடை",
      panchangCalendar: "பஞ்சாங்க நாட்காட்டி",
      spiritualDashboard: "ஆன்மீக டாஷ்போர்ட்",
      virtualPuja: "மெய்நிகர் பூஜை",
      compareProducts: "பொருட்கள் ஒப்பிடு",
      sacredKathas: "புனித கதைகள்",
      muhuratFinder: "முகூர்த்தம்",
      matrimony: "திருமணம்",
      vastuCompass: "வாஸ்து திசைகாட்டி",
      aboutUs: "எங்களை பற்றி",
      contact: "தொடர்பு",
      careers: "வேலைவாய்ப்புகள்",
      becomePandit: "பண்டிட் ஆகுங்கள்",
      becomeAstrologer: "ஜோதிடர் ஆகுங்கள்",
      termsConditions: "விதிமுறைகள்",
      privacyPolicy: "தனியுரிமை கொள்கை",
      refundPolicy: "பணத்திரும்ப கொள்கை",
      shippingPolicy: "அனுப்புதல் கொள்கை",
      copyright: "வேதிக் தத்வா. அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை.",
      madeWith: "இந்தியாவில் பக்தியுடன் உருவாக்கப்பட்டது",
    },
    newsletter: {
      eyebrow: "தொடர்பில் இருங்கள்",
      description: "திருவிழா & பஞ்சாங்க அறிவிப்புகளை எனது இன்பாக்ஸுக்கு அனுப்புங்கள்.",
      placeholder: "your@email.com",
      subscribe: "சந்தா",
      success: "சந்தா சேர்ந்தது! விரைவில் உங்கள் இன்பாக்ஸை சரிபார்க்கவும்.",
      error: "ஏதோ தவறு நடந்தது. மீண்டும் முயற்சிக்கவும்.",
      invalidEmail: "சரியான மின்னஞ்சல் முகவரியை உள்ளிடவும்.",
    },
    common: {
      comingSoon: "விரைவில் வருகிறது",
      viewAll: "அனைத்தையும் காண்",
      learnMore: "மேலும் அறிய",
      loading: "ஏற்றுகிறது...",
      new: "புதியது",
      trending: "டிரெண்டிங்",
      bought: "வாங்கினர்",
    },
    neevModal: {
      heading: "விரைவில் வருகிறது",
      subtitle: "பிரீமியம் பாரம்பரிய ஆடை தொகுப்பு",
      tagline: "100% இரட்டை-சீப்பு பருத்தி. கலப்பற்றது. பிரீமியம் தரம். இந்திய பாரம்பரியத்தில் வேரூன்றியது.",
      innerwears: "பிரீமியம் உள்ளாடைகள்",
      innerwearsDesc: "100% சீப்பு பருத்தி, சுவாசிக்கும் & சருமத்திற்கு ஏற்றது",
      kurtaSets: "குர்தா & குர்தி செட்கள்",
      kurtaSetsDesc: "ஆண்கள் & பெண்களுக்கு கைவினை பாரம்பரிய ஆடைகள்",
      dhotiCollection: "வேட்டி தொகுப்பு",
      dhotiDesc: "பாரம்பரிய & நவீன பாணியில் தூய பருத்தி வேட்டி",
      whyTitle: "நீவ் பேசிக்ஸ் ஏன்?",
      doubleCombedCotton: "100% இரட்டை-சீப்பு பருத்தி",
      noSynthetic: "செயற்கை கலப்பு இல்லை",
      skinFriendly: "சருமத்திற்கு ஏற்ற சாயங்கள்",
      madeInIndia: "இந்தியாவில் தயாரிக்கப்பட்டது",
      premiumStitching: "பிரீமியம் தையல்",
      traditionalDesigns: "பாரம்பரிய வடிவமைப்புகள்",
      launchingSoon: "விரைவில் வெளியீடு — காத்திருங்கள்!",
      followUs: "பிரத்யேக வெளியீட்டு சலுகைகள் & முன்கூட்டிய அணுகலுக்கு பின்தொடருங்கள்",
    },
  },
  te: {
    nav: { shop: "షాప్", bookPandit: "పండిట్ బుక్", bookPuja: "పూజ బుక్", astrology: "జ్యోతిషం", zodiac: "రాశిఫలం", panchang: "పంచాంగం", membership: "సభ్యత్వం", myProfile: "నా ప్రొఫైల్", mySpiritualJourney: "నా ఆధ్యాత్మిక ప్రయాణం", orderHistory: "ఆర్డర్ చరిత్ర", wishlist: "విష్‌లిస్ట్", subscriptions: "సబ్‌స్క్రిప్షన్లు", returns: "రిటర్న్స్", adminDashboard: "అడ్మిన్ డాష్‌బోర్డ్", login: "లాగిన్", register: "నమోదు", logout: "లాగ్‌అవుట్", account: "ఖాతా", searchPlaceholder: "ఉత్పత్తులు, సేవలు, పండిట్‌లు వెతకండి..." },
    hero: { tagline: "వేదిక్ తత్వా", title1: "ఆధ్యాత్మికత", title2: "కలిసే చోట", title2Highlight: "సాంకేతికత", subtitle: "పవిత్ర సామగ్రిని కొనుగోలు చేయండి. ధృవీకరించిన పండిట్‌లను బుక్ చేయండి. ప్రామాణిక పూజలను అనుభవించండి.", shopNow: "ఇప్పుడు కొనుగోలు చేయండి", bookPandit: "పండిట్ బుక్ చేయండి", rating: "4.9/5", happyFamilies: "10,000+ సంతోష కుటుంబాలు", verifiedPandits: "500+ ధృవీకరించిన పండిట్‌లు" },
    services: { sectionTag: "మా సేవలు", heading: "పండిట్ బుక్ చేయండి, పూజ సేవలు & మరిన్ని", subheading: "ధృవీకరించిన పండిట్ బుకింగ్ నుండి AI జ్యోతిషం వరకు — మా పూర్తి ఆధ్యాత్మిక సేవలను అన్వేషించండి.", pujaEssentials: "పూజా సామగ్రి", bookPandit: "పండిట్ బుక్", pujaServices: "పూజ సేవలు", astrology: "జ్యోతిషం", zodiacRashifal: "రాశిఫలం", aiKundli: "AI కుండలి", panchang: "పంచాంగం", virtualPuja: "వర్చువల్ పూజ", babyNames: "శిశు నామాలు", palmReading: "హస్తరేఖ", vastuCompass: "వాస్తు కంపాస్", kathas: "కథలు", donations: "విరాళాలు", myJourney: "నా ప్రయాణం", muhuratFinder: "ముహూర్తం", matrimony: "వివాహం", compare: "పోల్చండి", neevBasics: "నీవ్ బేసిక్స్", templeTourism: "దేవాలయ పర్యాటకం", scriptureSearch: "గ్రంథ శోధన", routePlanner: "మార్గ ప్రణాళిక" },
    products: { sectionTag: "మీ కోసం ఎంపిక", heading: "స్వచ్ఛతతో రూపొందించిన పవిత్ర సామగ్రి", subheading: "భారతదేశం అంతటా వేలాది భక్తులచే విశ్వసించబడిన ఉత్తమ ఆధ్యాత్మిక ఉత్పత్తులు", addToCart: "కార్ట్‌కు జోడించు", viewAll: "అన్ని ఉత్పత్తులు చూడండి", outOfStock: "స్టాక్‌లో లేదు", off: "తగ్గింపు" },
    footer: { tagline: "ఆధ్యాత్మికత సాంకేతికతను కలిసే చోట. ప్రీమియం ఆధ్యాత్మిక సేవలు, ధృవీకరించిన పండిట్‌లు, ప్రామాణిక పూజా సామగ్రి.", services: "సేవలు", company: "సంస్థ", policies: "విధానాలు", shopEssentials: "పూజా సామగ్రి", findPandit: "పండిట్ కనుగొనండి", bookPuja: "పూజ బుక్", astrology: "జ్యోతిషం", donations: "విరాళాలు", panchangCalendar: "పంచాంగ క్యాలెండర్", spiritualDashboard: "ఆధ్యాత్మిక డాష్‌బోర్డ్", virtualPuja: "వర్చువల్ పూజ", compareProducts: "ఉత్పత్తులు పోల్చండి", sacredKathas: "పవిత్ర కథలు", muhuratFinder: "ముహూర్తం", matrimony: "వివాహం", vastuCompass: "వాస్తు కంపాస్", aboutUs: "మా గురించి", contact: "సంప్రదించండి", careers: "కెరీర్లు", becomePandit: "పండిట్ అవ్వండి", becomeAstrologer: "జ్యోతిషి అవ్వండి", termsConditions: "నిబంధనలు", privacyPolicy: "గోప్యతా విధానం", refundPolicy: "రిఫండ్ విధానం", shippingPolicy: "షిప్పింగ్ విధానం", copyright: "వేదిక్ తత్వా. అన్ని హక్కులు రిజర్వ్ చేయబడ్డాయి.", madeWith: "భారతదేశంలో భక్తితో తయారు చేయబడింది" },
    newsletter: { eyebrow: "కనెక్ట్‌గా ఉండండి", description: "పండుగ & పంచాంగ హెచ్చరికలను నా ఇన్‌బాక్స్‌కు పంపండి.", placeholder: "your@email.com", subscribe: "సబ్‌స్క్రైబ్", success: "సబ్‌స్క్రైబ్ అయింది! త్వరలో మీ ఇన్‌బాక్స్‌ను తనిఖీ చేయండి.", error: "ఏదో తప్పు జరిగింది. దయచేసి మళ్లీ ప్రయత్నించండి.", invalidEmail: "దయచేసి చెల్లుబాటు అయ్యే ఇమెయిల్ చిరునామాను నమోదు చేయండి." },
    common: { comingSoon: "త్వరలో రాబోతుంది", viewAll: "అన్నీ చూడండి", learnMore: "మరింత తెలుసుకోండి", loading: "లోడ్ అవుతోంది...", new: "కొత్త", trending: "ట్రెండింగ్", bought: "కొన్నారు" },
    neevModal: { heading: "త్వరలో రాబోతుంది", subtitle: "ప్రీమియం సంప్రదాయ దుస్తుల సేకరణ", tagline: "100% డబుల్-కోంబ్డ్ కాటన్. కలప్పడం లేదు. ప్రీమియం నాణ్యత. భారతీయ వారసత్వంలో పాతుకుపోయింది.", innerwears: "ప్రీమియం అండర్‌వేర్", innerwearsDesc: "100% కోంబ్డ్ కాటన్, శ్వాసించగల & చర్మానికి అనుకూలమైన", kurtaSets: "కుర్తా & కుర్తీ సెట్లు", kurtaSetsDesc: "పురుషులు & మహిళలకు చేతితో తయారు చేసిన సంప్రదాయ దుస్తులు", dhotiCollection: "ధోతీ సేకరణ", dhotiDesc: "సంప్రదాయ & ఆధునిక శైలిలో స్వచ్ఛమైన కాటన్ ధోతీ", whyTitle: "నీవ్ బేసిక్స్ ఎందుకు?", doubleCombedCotton: "100% డబుల్-కోంబ్డ్ కాటన్", noSynthetic: "సింథటిక్ మిశ్రమాలు లేవు", skinFriendly: "చర్మానికి అనుకూల రంగులు", madeInIndia: "భారతదేశంలో తయారైంది", premiumStitching: "ప్రీమియం కుట్టు", traditionalDesigns: "సంప్రదాయ డిజైన్లు", launchingSoon: "త్వరలో లాంచ్ — చూస్తుండండి!", followUs: "ప్రత్యేక లాంచ్ ఆఫర్లు & ముందస్తు యాక్సెస్ కోసం ఫాలో చేయండి" },
  },
  bn: {
    nav: { shop: "দোকান", bookPandit: "পণ্ডিত বুক করুন", bookPuja: "পূজা বুক করুন", astrology: "জ্যোতিষ", zodiac: "রাশিফল", panchang: "পঞ্চাঙ্গ", membership: "সদস্যতা", myProfile: "আমার প্রোফাইল", mySpiritualJourney: "আমার আধ্যাত্মিক যাত্রা", orderHistory: "অর্ডার ইতিহাস", wishlist: "ইচ্ছা তালিকা", subscriptions: "সাবস্ক্রিপশন", returns: "রিটার্ন", adminDashboard: "অ্যাডমিন ড্যাশবোর্ড", login: "লগইন", register: "নিবন্ধন", logout: "লগআউট", account: "অ্যাকাউন্ট", searchPlaceholder: "পণ্য, সেবা, পণ্ডিত খুঁজুন..." },
    hero: { tagline: "বেদিক তত্ত্ব", title1: "যেখানে আধ্যাত্মিকতা", title2: "মিলিত হয়", title2Highlight: "প্রযুক্তির সাথে", subtitle: "পবিত্র সামগ্রী কিনুন। যাচাইকৃত পণ্ডিত বুক করুন। খাঁটি অনুষ্ঠান অনুভব করুন — সব এক জায়গায়।", shopNow: "এখনই কিনুন", bookPandit: "পণ্ডিত বুক করুন", rating: "4.9/5", happyFamilies: "10,000+ সুখী পরিবার", verifiedPandits: "500+ যাচাইকৃত পণ্ডিত" },
    services: { sectionTag: "আমাদের সেবা", heading: "পণ্ডিত বুক করুন, পূজা সেবা ও আরও", subheading: "যাচাইকৃত পণ্ডিত বুকিং থেকে AI জ্যোতিষ পর্যন্ত — আমাদের সম্পূর্ণ আধ্যাত্মিক সেবা অন্বেষণ করুন।", pujaEssentials: "পূজার সামগ্রী", bookPandit: "পণ্ডিত বুক", pujaServices: "পূজা সেবা", astrology: "জ্যোতিষ", zodiacRashifal: "রাশিফল", aiKundli: "AI কুণ্ডলী", panchang: "পঞ্চাঙ্গ", virtualPuja: "ভার্চুয়াল পূজা", babyNames: "শিশুর নাম", palmReading: "হস্তরেখা", vastuCompass: "বাস্তু কম্পাস", kathas: "কথা", donations: "দান", myJourney: "আমার যাত্রা", muhuratFinder: "মুহূর্ত", matrimony: "বিবাহ", compare: "তুলনা", neevBasics: "নীভ বেসিকস", templeTourism: "মন্দির পর্যটন", scriptureSearch: "শাস্ত্র অনুসন্ধান", routePlanner: "পথ পরিকল্পনা" },
    products: { sectionTag: "আপনার জন্য বাছাই", heading: "বিশুদ্ধতায় তৈরি পবিত্র সামগ্রী", subheading: "ভারতজুড়ে হাজার হাজার ভক্তদের বিশ্বাসযোগ্য সেরা আধ্যাত্মিক পণ্য", addToCart: "কার্টে যোগ করুন", viewAll: "সব পণ্য দেখুন", outOfStock: "স্টকে নেই", off: "ছাড়" },
    footer: { tagline: "যেখানে আধ্যাত্মিকতা প্রযুক্তির সাথে মিলিত হয়। প্রিমিয়াম আধ্যাত্মিক সেবা, যাচাইকৃত পণ্ডিত, খাঁটি পূজা সামগ্রী।", services: "সেবা", company: "কোম্পানি", policies: "নীতিমালা", shopEssentials: "পূজার সামগ্রী", findPandit: "পণ্ডিত খুঁজুন", bookPuja: "পূজা বুক", astrology: "জ্যোতিষ", donations: "দান", panchangCalendar: "পঞ্চাঙ্গ ক্যালেন্ডার", spiritualDashboard: "আধ্যাত্মিক ড্যাশবোর্ড", virtualPuja: "ভার্চুয়াল পূজা", compareProducts: "পণ্য তুলনা", sacredKathas: "পবিত্র কথা", muhuratFinder: "মুহূর্ত", matrimony: "বিবাহ", vastuCompass: "বাস্তু কম্পাস", aboutUs: "আমাদের সম্পর্কে", contact: "যোগাযোগ", careers: "ক্যারিয়ার", becomePandit: "পণ্ডিত হন", becomeAstrologer: "জ্যোতিষী হন", termsConditions: "শর্তাবলী", privacyPolicy: "গোপনীয়তা নীতি", refundPolicy: "ফেরত নীতি", shippingPolicy: "শিপিং নীতি", copyright: "বেদিক তত্ত্ব। সর্বস্বত্ব সংরক্ষিত।", madeWith: "ভারতে ভক্তির সাথে তৈরি" },
    newsletter: { eyebrow: "যুক্ত থাকুন", description: "উৎসব ও পঞ্চাঙ্গ সতর্কতা আমার ইনবক্সে পাঠান।", placeholder: "your@email.com", subscribe: "সাবস্ক্রাইব", success: "সাবস্ক্রাইব হয়েছে! শীঘ্রই আপনার ইনবক্স দেখুন।", error: "কিছু ভুল হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।", invalidEmail: "অনুগ্রহ করে একটি বৈধ ইমেল ঠিকানা লিখুন।" },
    common: { comingSoon: "শীঘ্রই আসছে", viewAll: "সব দেখুন", learnMore: "আরও জানুন", loading: "লোড হচ্ছে...", new: "নতুন", trending: "ট্রেন্ডিং", bought: "কিনেছেন" },
    neevModal: { heading: "শীঘ্রই আসছে", subtitle: "প্রিমিয়াম ঐতিহ্যবাহী পোশাক সংগ্রহ", tagline: "100% ডাবল-কম্বড কটন। খাঁটি। প্রিমিয়াম মান। ভারতীয় ঐতিহ্যে প্রোথিত।", innerwears: "প্রিমিয়াম অন্তর্বাস", innerwearsDesc: "100% কম্বড কটন, শ্বাসযোগ্য ও ত্বক-বান্ধব", kurtaSets: "কুর্তা ও কুর্তি সেট", kurtaSetsDesc: "পুরুষ ও মহিলাদের জন্য হস্তশিল্প ঐতিহ্যবাহী পোশাক", dhotiCollection: "ধুতি সংগ্রহ", dhotiDesc: "ঐতিহ্যবাহী ও আধুনিক শৈলীতে বিশুদ্ধ সুতি ধুতি", whyTitle: "নীভ বেসিকস কেন?", doubleCombedCotton: "100% ডাবল-কম্বড কটন", noSynthetic: "কৃত্রিম মিশ্রণ নেই", skinFriendly: "ত্বক-বান্ধব রং", madeInIndia: "ভারতে তৈরি", premiumStitching: "প্রিমিয়াম সেলাই", traditionalDesigns: "ঐতিহ্যবাহী নকশা", launchingSoon: "শীঘ্রই লঞ্চ — অপেক্ষায় থাকুন!", followUs: "বিশেষ লঞ্চ অফার ও আর্লি এক্সেসের জন্য ফলো করুন" },
  },
  mr: {
    nav: { shop: "दुकान", bookPandit: "पंडित बुक करा", bookPuja: "पूजा बुक करा", astrology: "ज्योतिष", zodiac: "राशिभविष्य", panchang: "पंचांग", membership: "सदस्यत्व", myProfile: "माझे प्रोफाइल", mySpiritualJourney: "माझा आध्यात्मिक प्रवास", orderHistory: "ऑर्डर इतिहास", wishlist: "इच्छा यादी", subscriptions: "सदस्यता", returns: "परतावा", adminDashboard: "व्यवस्थापक डॅशबोर्ड", login: "लॉगिन", register: "नोंदणी", logout: "लॉगआउट", account: "खाते", searchPlaceholder: "उत्पादने, सेवा, पंडित शोधा..." },
    hero: { tagline: "वैदिक तत्त्व", title1: "जिथे अध्यात्म", title2: "भेटते", title2Highlight: "तंत्रज्ञानाला", subtitle: "पवित्र सामग्री खरेदी करा. सत्यापित पंडित बुक करा. अस्सल पूजा अनुभवा — सर्व एकाच ठिकाणी.", shopNow: "आता खरेदी करा", bookPandit: "पंडित बुक करा", rating: "4.9/5", happyFamilies: "10,000+ आनंदी कुटुंबे", verifiedPandits: "500+ सत्यापित पंडित" },
    services: { sectionTag: "आमच्या सेवा", heading: "पंडित बुक करा, पूजा सेवा आणि बरेच काही", subheading: "सत्यापित पंडित बुकिंग ते AI ज्योतिष — आमच्या संपूर्ण आध्यात्मिक सेवांचा शोध घ्या.", pujaEssentials: "पूजा सामग्री", bookPandit: "पंडित बुक", pujaServices: "पूजा सेवा", astrology: "ज्योतिष", zodiacRashifal: "राशिभविष्य", aiKundli: "AI कुंडली", panchang: "पंचांग", virtualPuja: "व्हर्च्युअल पूजा", babyNames: "बाळाचे नाव", palmReading: "हस्तरेखा", vastuCompass: "वास्तू कंपास", kathas: "कथा", donations: "दान", myJourney: "माझा प्रवास", muhuratFinder: "मुहूर्त", matrimony: "विवाह", compare: "तुलना", neevBasics: "नीव बेसिक्स", templeTourism: "मंदिर पर्यटन", scriptureSearch: "शास्त्र शोध", routePlanner: "मार्ग नियोजक" },
    products: { sectionTag: "तुमच्यासाठी निवडलेले", heading: "शुद्धतेने बनवलेली पवित्र सामग्री", subheading: "भारतभर हजारो भक्तांनी विश्वास ठेवलेली सर्वोत्तम आध्यात्मिक उत्पादने", addToCart: "कार्टमध्ये जोडा", viewAll: "सर्व उत्पादने पहा", outOfStock: "स्टॉकमध्ये नाही", off: "सूट" },
    footer: { tagline: "जिथे अध्यात्म तंत्रज्ञानाला भेटते. प्रीमियम आध्यात्मिक सेवा, सत्यापित पंडित, अस्सल पूजा सामग्री.", services: "सेवा", company: "कंपनी", policies: "धोरणे", shopEssentials: "पूजा सामग्री", findPandit: "पंडित शोधा", bookPuja: "पूजा बुक", astrology: "ज्योतिष", donations: "दान", panchangCalendar: "पंचांग दिनदर्शिका", spiritualDashboard: "आध्यात्मिक डॅशबोर्ड", virtualPuja: "व्हर्च्युअल पूजा", compareProducts: "उत्पादन तुलना", sacredKathas: "पवित्र कथा", muhuratFinder: "मुहूर्त", matrimony: "विवाह", vastuCompass: "वास्तू कंपास", aboutUs: "आमच्याबद्दल", contact: "संपर्क", careers: "करिअर", becomePandit: "पंडित व्हा", becomeAstrologer: "ज्योतिषी व्हा", termsConditions: "अटी व शर्ती", privacyPolicy: "गोपनीयता धोरण", refundPolicy: "परतावा धोरण", shippingPolicy: "शिपिंग धोरण", copyright: "वैदिक तत्त्व. सर्व हक्क राखीव.", madeWith: "भारतात भक्तीने बनवले" },
    newsletter: { eyebrow: "जोडलेले रहा", description: "सण आणि पंचांग सूचना माझ्या इनबॉक्समध्ये पाठवा.", placeholder: "your@email.com", subscribe: "सबस्क्राइब", success: "सबस्क्राइब झाले! लवकरच तुमचा इनबॉक्स तपासा.", error: "काहीतरी चूक झाली. कृपया पुन्हा प्रयत्न करा.", invalidEmail: "कृपया वैध ईमेल पत्ता प्रविष्ट करा." },
    common: { comingSoon: "लवकरच येत आहे", viewAll: "सर्व पहा", learnMore: "अधिक जाणा", loading: "लोड होत आहे...", new: "नवीन", trending: "ट्रेंडिंग", bought: "विकत घेतले" },
    neevModal: { heading: "लवकरच येत आहे", subtitle: "प्रीमियम पारंपारिक वस्त्र संग्रह", tagline: "100% डबल-कॉम्ब्ड कॉटन. शुद्ध. प्रीमियम गुणवत्ता. भारतीय वारसात रुजलेले.", innerwears: "प्रीमियम अंडरवेअर", innerwearsDesc: "100% कॉम्ब्ड कॉटन, श्वसनीय व त्वचेला अनुकूल", kurtaSets: "कुर्ता व कुर्ती सेट", kurtaSetsDesc: "पुरुष व महिलांसाठी हस्तनिर्मित पारंपारिक वस्त्रे", dhotiCollection: "धोतर संग्रह", dhotiDesc: "पारंपारिक व आधुनिक शैलीतील शुद्ध सुती धोतर", whyTitle: "नीव बेसिक्स का?", doubleCombedCotton: "100% डबल-कॉम्ब्ड कॉटन", noSynthetic: "कृत्रिम मिश्रण नाही", skinFriendly: "त्वचेला अनुकूल रंग", madeInIndia: "भारतात बनवले", premiumStitching: "प्रीमियम शिवणकाम", traditionalDesigns: "पारंपारिक डिझाइन", launchingSoon: "लवकरच लॉन्च — वाट पहा!", followUs: "विशेष लॉन्च ऑफर व अर्ली ऍक्सेससाठी फॉलो करा" },
  },
  gu: {
    nav: { shop: "દુકાન", bookPandit: "પંડિત બુક કરો", bookPuja: "પૂજા બુક કરો", astrology: "જ્યોતિષ", zodiac: "રાશિફળ", panchang: "પંચાંગ", membership: "સભ્યપદ", myProfile: "મારી પ્રોફાઇલ", mySpiritualJourney: "મારી આધ્યાત્મિક યાત્રા", orderHistory: "ઓર્ડર ઇતિહાસ", wishlist: "ઇચ્છા સૂચિ", subscriptions: "સબ્સ્ક્રિપ્શન", returns: "રિટર્ન", adminDashboard: "એડમિન ડેશબોર્ડ", login: "લોગિન", register: "નોંધણી", logout: "લોગઆઉટ", account: "ખાતું", searchPlaceholder: "ઉત્પાદનો, સેવાઓ, પંડિત શોધો..." },
    hero: { tagline: "વૈદિક તત્ત્વ", title1: "જ્યાં આધ્યાત્મિકતા", title2: "મળે છે", title2Highlight: "ટેક્નોલોજીને", subtitle: "પવિત્ર સામગ્રી ખરીદો. ચકાસાયેલા પંડિતો બુક કરો. અસલ પૂજા અનુભવો — બધું એક જ જગ્યાએ.", shopNow: "હમણાં ખરીદો", bookPandit: "પંડિત બુક કરો", rating: "4.9/5", happyFamilies: "10,000+ ખુશ પરિવારો", verifiedPandits: "500+ ચકાસાયેલા પંડિતો" },
    services: { sectionTag: "અમારી સેવાઓ", heading: "પંડિત બુક કરો, પૂજા સેવાઓ અને વધુ", subheading: "ચકાસાયેલા પંડિત બુકિંગથી AI જ્યોતિષ સુધી — અમારી સંપૂર્ણ આધ્યાત્મિક સેવાઓ શોધો.", pujaEssentials: "પૂજા સામગ્રી", bookPandit: "પંડિત બુક", pujaServices: "પૂજા સેવાઓ", astrology: "જ્યોતિષ", zodiacRashifal: "રાશિફળ", aiKundli: "AI કુંડળી", panchang: "પંચાંગ", virtualPuja: "વર્ચ્યુઅલ પૂજા", babyNames: "બાળકના નામ", palmReading: "હસ્તરેખા", vastuCompass: "વાસ્તુ કંપાસ", kathas: "કથાઓ", donations: "દાન", myJourney: "મારી યાત્રા", muhuratFinder: "મુહૂર્ત", matrimony: "લગ્ન", compare: "સરખામણી", neevBasics: "નીવ બેસિક્સ", templeTourism: "મંદિર પ્રવાસન", scriptureSearch: "શાસ્ત્ર શોધ", routePlanner: "માર્ગ આયોજક" },
    products: { sectionTag: "તમારા માટે પસંદ", heading: "શુદ્ધતાથી બનાવેલ પવિત્ર સામગ્રી", subheading: "ભારતભરના હજારો ભક્તો દ્વારા વિશ્વસનીય શ્રેષ્ઠ આધ્યાત્મિક ઉત્પાદનો", addToCart: "કાર્ટમાં ઉમેરો", viewAll: "બધા ઉત્પાદનો જુઓ", outOfStock: "સ્ટોકમાં નથી", off: "છૂટ" },
    footer: { tagline: "જ્યાં આધ્યાત્મિકતા ટેક્નોલોજીને મળે છે. પ્રીમિયમ આધ્યાત્મિક સેવાઓ, ચકાસાયેલા પંડિતો, અસલ પૂજા સામગ્રી.", services: "સેવાઓ", company: "કંપની", policies: "નીતિઓ", shopEssentials: "પૂજા સામગ્રી", findPandit: "પંડિત શોધો", bookPuja: "પૂજા બુક", astrology: "જ્યોતિષ", donations: "દાન", panchangCalendar: "પંચાંગ કેલેન્ડર", spiritualDashboard: "આધ્યાત્મિક ડેશબોર્ડ", virtualPuja: "વર્ચ્યુઅલ પૂજા", compareProducts: "ઉત્પાદન સરખામણી", sacredKathas: "પવિત્ર કથાઓ", muhuratFinder: "મુહૂર્ત", matrimony: "લગ્ન", vastuCompass: "વાસ્તુ કંપાસ", aboutUs: "અમારા વિશે", contact: "સંપર્ક", careers: "કારકિર્દી", becomePandit: "પંડિત બનો", becomeAstrologer: "જ્યોતિષી બનો", termsConditions: "નિયમો અને શરતો", privacyPolicy: "ગોપનીયતા નીતિ", refundPolicy: "રિફંડ નીતિ", shippingPolicy: "શિપિંગ નીતિ", copyright: "વૈદિક તત્ત્વ. સર્વ હક્કો અનામત.", madeWith: "ભારતમાં ભક્તિથી બનાવ્યું" },
    newsletter: { eyebrow: "જોડાયેલા રહો", description: "તહેવાર અને પંચાંગ ચેતવણીઓ મારા ઇનબોક્સમાં મોકલો.", placeholder: "your@email.com", subscribe: "સબ્સ્ક્રાઇબ", success: "સબ્સ્ક્રાઇબ થયું! ટૂંક સમયમાં તમારું ઇનબોક્સ તપાસો.", error: "કંઈક ખોટું થયું. કૃપા કરીને ફરી પ્રયાસ કરો.", invalidEmail: "કૃપા કરીને માન્ય ઇમેઇલ સરનામું દાખલ કરો." },
    common: { comingSoon: "ટૂંક સમયમાં આવી રહ્યું છે", viewAll: "બધું જુઓ", learnMore: "વધુ જાણો", loading: "લોડ થઈ રહ્યું છે...", new: "નવું", trending: "ટ્રેન્ડિંગ", bought: "ખરીદ્યું" },
    neevModal: { heading: "ટૂંક સમયમાં આવી રહ્યું છે", subtitle: "પ્રીમિયમ પરંપરાગત વસ્ત્ર સંગ્રહ", tagline: "100% ડબલ-કોમ્બ્ડ કોટન. શુદ્ધ. પ્રીમિયમ ગુણવત્તા. ભારતીય વારસામાં મૂળ.", innerwears: "પ્રીમિયમ અન્ડરવેર", innerwearsDesc: "100% કોમ્બ્ડ કોટન, શ્વાસ લેવા યોગ્ય અને ત્વચા-મૈત્રીપૂર્ણ", kurtaSets: "કુર્તા અને કુર્તી સેટ", kurtaSetsDesc: "પુરુષો અને મહિલાઓ માટે હસ્તકલા પરંપરાગત વસ્ત્રો", dhotiCollection: "ધોતી સંગ્રહ", dhotiDesc: "પરંપરાગત અને આધુનિક શૈલીમાં શુદ્ધ સુતરાઉ ધોતી", whyTitle: "નીવ બેસિક્સ શા માટે?", doubleCombedCotton: "100% ડબલ-કોમ્બ્ડ કોટન", noSynthetic: "કૃત્રિમ મિશ્રણ નહીં", skinFriendly: "ત્વચા-મૈત્રીપૂર્ણ રંગો", madeInIndia: "ભારતમાં બનેલું", premiumStitching: "પ્રીમિયમ સિલાઈ", traditionalDesigns: "પરંપરાગત ડિઝાઇન", launchingSoon: "ટૂંક સમયમાં લોન્ચ — રાહ જુઓ!", followUs: "વિશેષ લોન્ચ ઓફર અને વહેલી ઍક્સેસ માટે ફોલો કરો" },
  },
};

type I18nContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: TranslationKeys;
};

const I18nContext = createContext<I18nContextType>({
  language: "en",
  setLanguage: () => {},
  t: translations.en,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem("vedic_tatva_language");
    return (saved as Language) || "en";
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("vedic_tatva_language", lang);
    document.documentElement.lang = lang;
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, []);

  return (
    <I18nContext.Provider value={{ language, setLanguage, t: translations[language] }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}

// ---- Hindi copy helpers for puja-city / festival landing pages ----
//
// These functions return ready-to-render strings. They are intentionally kept
// separate from the main `translations` dictionary because the long-form copy
// only needs Hindi + English right now (other locales fall back to English).

type CityCopyInput = {
  cityName: string;
  cityNameHi: string;
  state: string;
  stateHi: string;
  panditCount: number;
  landmark: string;
  landmarkHi: string;
  blurb: string;
  blurbHi: string;
};

type PujaCopyInput = {
  name: string;
  nameHi: string;
  intent: string;
  intentHi: string;
  duration: string;
  durationHi: string;
  bestTime: string;
  bestTimeHi: string;
};

export function getPujaCityCopy(
  language: Language,
  puja: PujaCopyInput,
  city: CityCopyInput,
  price: string,
  langNames: string,
) {
  const isHi = language === "hi";
  const cityName = isHi ? city.cityNameHi : city.cityName;
  const pujaName = isHi ? puja.nameHi : puja.name;
  const stateName = isHi ? city.stateHi : city.state;
  const intent = isHi ? puja.intentHi : puja.intent;
  const blurb = isHi ? city.blurbHi : city.blurb;
  const duration = isHi ? puja.durationHi : puja.duration;
  const bestTime = isHi ? puja.bestTimeHi : puja.bestTime;
  const landmark = isHi ? city.landmarkHi : city.landmark;

  if (isHi) {
    return {
      breadcrumbHome: "मुख्य",
      breadcrumbPuja: "पूजा",
      cityName,
      pujaName,
      stateName,
      servingLabel: `${cityName}, ${stateName} में सेवारत`,
      tirthLabel: "तीर्थ स्थल",
      h1: `${cityName} में ${pujaName}`,
      heroIntro: `${intent}। ${blurb} संकेतक मूल्य `,
      heroPrice: price,
      heroIntroAfter: " से, सम्पूर्ण समावेशी।",
      factDuration: "अवधि",
      factBestTime: "शुभ समय",
      factLanguages: "भाषाएँ",
      factVerified: "सत्यापित पंडित",
      factVerifiedValue: `${city.cityNameHi} में ${city.panditCount}+`,
      duration,
      bestTime,
      langNames,
      bookCta: `${cityName} में ${pujaName} बुक करें`,
      talkAcharya: "आचार्य से बात करें",
      quickAnswerHeading: "संक्षिप्त उत्तर",
      quickAnswer: `वेदिक तत्त्व पर ${cityName} में ${pujaName} ${price} से सम्पूर्ण समावेशी मूल्य पर उपलब्ध है। यह अनुष्ठान लगभग ${duration} का होता है और ${bestTime} पर सबसे शुभ माना जाता है। वेदिक तत्त्व ${landmark} के निकट सत्यापित पंडित बुक करता है, सम्पूर्ण पूजा सामग्री प्रदान करता है तथा उसी दिन HD रिकॉर्डिंग साझा करता है।`,
      whatYouReceiveHeading: `${cityName} में आपको क्या प्राप्त होगा`,
      whyHeading: `${cityName} में वेदिक तत्त्व से ${pujaName} क्यों बुक करें`,
      whyLocalTitle: "स्थानीय सत्यापित पंडित",
      whyLocalBody: `${cityName} में ${city.panditCount}+ पंडित संस्कृत प्रवीणता, परंपरा एवं 5+ वर्षों के अनुभव के लिए सत्यापित हैं।`,
      whySamagriTitle: "इसी शहर की सामग्री",
      whySamagriBody: `सम्पूर्ण पूजा सामग्री किट ${cityName} में ही तैयार की जाती है और पंडित जी के साथ पहुँचती है — आपको कुछ भी जुटाने की आवश्यकता नहीं।`,
      whyPricingTitle: `${cityName} हेतु पारदर्शी मूल्य`,
      whyPricingBody: `${price} का सम्पूर्ण समावेशी संकेतक मूल्य मुहूर्त से पूर्व लिखित रूप में पुष्ट किया जाता है। ${cityName} ट्रैफिक अथवा सप्ताहांत बुकिंग पर कोई छिपा शुल्क नहीं।`,
      faqsHeading: `${cityName} में ${pujaName} — सामान्य प्रश्न`,
      faqs: [
        {
          q: `${cityName} में ${pujaName} का मूल्य कितना है?`,
          a: `वेदिक तत्त्व ${cityName} में ${price} से सम्पूर्ण समावेशी शुल्क लेता है — पंडित दक्षिणा, सम्पूर्ण सामग्री, शहर सीमा के भीतर परिवहन एवं HD रिकॉर्डिंग सम्मिलित। मूल्य ${cityName} में पंडित उपलब्धता एवं यात्रा परंपरा के अनुरूप होता है; अंतिम मुहूर्त-दिवस मूल्य बुकिंग से पूर्व लिखित रूप में साझा किया जाता है।`,
        },
        {
          q: `क्या पूजा के समय पंडित जी हिंदी अथवा स्थानीय भाषा बोलेंगे?`,
          a: `मंत्रोच्चार शास्त्र के अनुसार संस्कृत में होता है। ${cityName} में नियुक्त पंडित जी संकल्प, विधि एवं प्रसाद की प्रक्रिया ${langNames} में समझाएँगे — कृपया बुकिंग करते समय अपनी पसंदीदा भाषा अवश्य बताएँ।`,
        },
        {
          q: `${cityName} में पंडित जी मुझ तक कितनी जल्दी पहुँच सकते हैं?`,
          a: `${cityName} में वेदिक तत्त्व नेटवर्क के ${city.panditCount}+ सत्यापित पंडित हैं। 48 घंटे की पूर्व सूचना पर हम मुहूर्त-अनुरूप समय पुष्ट कर देते हैं; ट्रैफिक एवं क्षेत्र के अनुसार अतिरिक्त दक्षिणा पर उसी दिन की पूजा भी संभव है।`,
        },
        {
          q: `यदि परिवार ${cityName} में है और मैं विदेश में हूँ, तो क्या ${pujaName} ऑनलाइन हो सकती है?`,
          a: `हाँ — हम ${cityName} में अथवा निकटवर्ती मंदिर / पंडित जी के पूजा कक्ष से HD वीडियो कॉल द्वारा सम्पूर्ण ${pujaName} सम्पन्न करते हैं। संकल्प आपके नाम एवं गोत्र से लिया जाता है; प्रसाद ${cityName} (अथवा विश्व में किसी भी पते) पर 3 कार्य दिवसों के भीतर भेजा जाता है।`,
        },
        {
          q: `${pujaName} बुक करने का सबसे उपयुक्त समय कौन सा है?`,
          a: `${bestTime}। हमारा मुहूर्त डेस्क आपकी कुंडली एवं ${cityName} के सूर्योदय / सूर्यास्त के अनुसार निकटतम शुभ तिथि की अनुशंसा करेगा।`,
        },
      ],
      otherCitiesHeading: `अन्य शहरों में ${pujaName}`,
      otherCityChip: (otherCity: string) => `${otherCity} में ${pujaName}`,
      otherPujasHeading: `${cityName} में वेदिक तत्त्व द्वारा प्रदान अन्य पूजाएँ`,
      otherPujaCardTitle: (otherPuja: string) => `${cityName} में ${otherPuja}`,
      fromPrice: (p: string) => `${p} से`,
      metaTitle: `${pujaName} ${cityName} में — घर पर पंडित, मूल्य ${price} | वेदिक तत्त्व`,
      metaDescription: `${cityName} (${stateName}) में सत्यापित पंडित द्वारा ${pujaName} घर पर बुक करें। ${intent}। अवधि ${duration}। सामग्री, दक्षिणा एवं रिकॉर्डिंग सहित ${price} से। ${city.panditCount}+ स्थानीय पंडित उपलब्ध।`,
    };
  }

  return {
    breadcrumbHome: "Home",
    breadcrumbPuja: "Puja",
    cityName,
    pujaName,
    stateName,
    servingLabel: `Serving ${cityName}, ${stateName}`,
    tirthLabel: "Tirth Sthal",
    h1: `${pujaName} in ${cityName}`,
    heroIntro: `${intent}. ${blurb} Indicative cost from `,
    heroPrice: price,
    heroIntroAfter: " all-inclusive.",
    factDuration: "Duration",
    factBestTime: "Best time",
    factLanguages: "Languages",
    factVerified: "Verified pandits",
    factVerifiedValue: `${city.panditCount}+ in ${cityName}`,
    duration,
    bestTime,
    langNames,
    bookCta: `Book ${pujaName} in ${cityName}`,
    talkAcharya: "Talk to an Acharya",
    quickAnswerHeading: "Quick answer",
    quickAnswer: `${pujaName} in ${cityName} costs from ${price} all-inclusive at Vedic Tatva. The ritual lasts about ${duration} and is best performed on ${bestTime}. Vedic Tatva books a verified pandit near ${landmark}, supplies the full samagri, and shares the HD recording the same day.`,
    whatYouReceiveHeading: `What you receive in ${cityName}`,
    whyHeading: `Why book ${pujaName} with Vedic Tatva in ${cityName}`,
    whyLocalTitle: "Local verified pandits",
    whyLocalBody: `${city.panditCount}+ pandits across ${cityName} are verified for Sanskrit fluency, lineage and 5+ years of officiating experience.`,
    whySamagriTitle: "Same-city samagri",
    whySamagriBody: `Full samagri kit sourced and assembled within ${cityName}, delivered with the pandit — nothing for you to arrange.`,
    whyPricingTitle: `Transparent ${cityName} pricing`,
    whyPricingBody: `Indicative all-inclusive price of ${price} confirmed in writing before muhurat. No hidden surcharge for ${cityName} traffic or weekend bookings.`,
    faqsHeading: `${pujaName} in ${cityName} — FAQs`,
    faqs: [
      {
        q: `What is the cost of ${pujaName} in ${cityName}?`,
        a: `Vedic Tatva charges from ${price} all-inclusive in ${cityName} — pandit dakshina, complete samagri, transport within city limits and HD recording. Pricing accounts for ${cityName} pandit availability and travel norms; final muhurat-day price is shared in writing before booking.`,
      },
      {
        q: `Will the pandit speak Hindi or the local language during the puja?`,
        a: `Mantras are recited in Sanskrit as per shastra. The pandit allotted in ${cityName} will explain sankalp, vidhi and prasad steps in ${langNames} — please mention your preferred language while booking.`,
      },
      {
        q: `How quickly can a pandit reach me in ${cityName}?`,
        a: `${cityName} has ${city.panditCount}+ verified pandits on the Vedic Tatva network. With 48 hours' notice we confirm a muhurat-aligned slot; same-day pujas are possible at extra dakshina depending on traffic and area.`,
      },
      {
        q: `Can ${pujaName} be done online if my family is in ${cityName} but I am abroad?`,
        a: `Yes — we conduct the full ${pujaName} via HD video call from a temple or pandit's puja room in or near ${cityName}. Sankalp is taken in your name and gotra; prasad is dispatched to ${cityName} (or any address worldwide) within 3 working days.`,
      },
      {
        q: `What is the best time to book ${pujaName}?`,
        a: `${bestTime}. Our muhurat desk will recommend the closest auspicious date based on your kundli and ${cityName} sunrise / sunset timings.`,
      },
    ],
    otherCitiesHeading: `${pujaName} in other cities`,
    otherCityChip: (otherCity: string) => `${pujaName} in ${otherCity}`,
    otherPujasHeading: `Other pujas Vedic Tatva offers in ${cityName}`,
    otherPujaCardTitle: (otherPuja: string) => `${otherPuja} in ${cityName}`,
    fromPrice: (p: string) => `From ${p}`,
    metaTitle: `${pujaName} in ${cityName} — Pandit at Home, Cost ${price} | Vedic Tatva`,
    metaDescription: `Book ${pujaName} (${puja.nameHi}) at home in ${cityName} (${stateName}) with a verified Vedic pandit. ${intent}. Duration ${duration}. Indicative cost from ${price} including samagri, dakshina and recording.`,
  };
}

export function getFestivalCopy(
  language: Language,
  festivalName: string,
  festivalNameHi: string,
) {
  const isHi = language === "hi";
  if (isHi) {
    return {
      backHome: "मुख्य पृष्ठ पर वापस",
      startsIn: `${festivalNameHi} आरम्भ होगा`,
      addFullKit: "पूरा किट जोड़ें",
      bookPandit: "पंडित बुक करें",
      curatedKitHeading: `विशेष ${festivalNameHi} किट`,
      curatedKitSubheading: "विशेष रूप से चयनित आवश्यक सामग्री। एक-एक वस्तु अलग-अलग खरीदने का झंझट नहीं।",
      itemsCount: (n: number, total: string) => `${n} वस्तुएँ · ${total}`,
      kitEmpty: `हम ${festivalNameHi} किट तैयार कर रहे हैं। तब तक, हमारी दुकान देखें।`,
      shopNow: "अभी खरीदें",
      servicesHeading: `${festivalNameHi} सेवाएँ`,
      continue: "आगे बढ़ें",
      otherFestivals: "अन्य त्योहार",
      notFoundTitle: "त्योहार नहीं मिला",
      notFoundBrowse: "सभी आगामी त्योहार देखें।",
      itemsAddedToast: (n: number) => `${n} वस्तुएँ कार्ट में जोड़ी गईं`,
      itemsAddedDesc: `${festivalNameHi} किट चेकआउट के लिए तैयार है।`,
      metaTitle: (year: number) => `${festivalNameHi} ${year} — तिथि, पूजा विधि एवं त्योहार किट | वेदिक तत्त्व`,
      metaDescription: (blurb: string) => `${festivalNameHi} (${festivalName}) — ${blurb} वेदिक तत्त्व से सम्पूर्ण पूजा किट, मंत्र एवं अनुष्ठान।`,
      displayName: festivalNameHi,
      displayNameSecondary: festivalName,
    };
  }
  return {
    backHome: "Back to home",
    startsIn: `${festivalName} starts in`,
    addFullKit: "Add full kit",
    bookPandit: "Book a Pandit",
    curatedKitHeading: `Curated ${festivalName} kit`,
    curatedKitSubheading: "Hand-picked essentials. Skip the hassle of shopping each item one by one.",
    itemsCount: (n: number, total: string) => `${n} items · ${total}`,
    kitEmpty: `We're putting together the ${festivalName} kit. Meanwhile, browse our shop.`,
    shopNow: "Shop now",
    servicesHeading: `${festivalName} services`,
    continue: "Continue",
    otherFestivals: "Other festivals",
    notFoundTitle: "Festival not found",
    notFoundBrowse: "Browse all upcoming festivals.",
    itemsAddedToast: (n: number) => `${n} items added to cart`,
    itemsAddedDesc: `${festivalName} kit ready for checkout.`,
    metaTitle: (year: number) => `${festivalName} ${year} — Date, Puja Vidhi & Festival Kit | Vedic Tatva`,
    metaDescription: (blurb: string) => `${festivalName} (${festivalNameHi}) — ${blurb} Complete puja kit, mantras, and rituals from Vedic Tatva.`,
    displayName: festivalName,
    displayNameSecondary: festivalNameHi,
  };
}


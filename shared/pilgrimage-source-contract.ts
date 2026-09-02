/**
 * Phase 2 source inventory. This module deliberately contains only serializable
 * source identity and compatibility data, so migration and server contract code
 * never need to import a React page or Lucide icons.
 *
 * The full editorial bodies remain owned by their existing UI modules until the
 * canonical persistence migration replaces those consumers in a later phase.
 */
export const TIRTH_GUIDE_SOURCE_ROWS = [
  ["char-dham-yatra", "Chota Char Dham Yatra"], ["kedarnath-yatra", "Kedarnath Dham Yatra"],
  ["badrinath-yatra", "Badrinath Dham Yatra"], ["kashi-vishwanath-yatra", "Kashi Vishwanath Yatra (Varanasi)"],
  ["ayodhya-ram-mandir-yatra", "Ayodhya Ram Mandir Yatra"], ["mathura-vrindavan-yatra", "Mathura-Vrindavan Yatra (Braj Bhoomi)"],
  ["vaishno-devi-yatra", "Mata Vaishno Devi Yatra"], ["amarnath-yatra", "Shri Amarnath Yatra"],
  ["tirupati-balaji-yatra", "Tirupati Balaji Yatra (Tirumala)"], ["jagannath-puri-yatra", "Jagannath Puri Yatra"],
  ["dwarka-yatra", "Dwarka Yatra (Char Dham West)"], ["rameshwaram-yatra", "Rameshwaram Yatra (Char Dham South)"],
  ["kamakhya-shaktipeeth-yatra", "Maa Kamakhya Shaktipeeth Yatra"], ["somnath-jyotirlinga-yatra", "Somnath Jyotirlinga Yatra"],
  ["mahakaleshwar-ujjain-yatra", "Mahakaleshwar Ujjain Yatra"], ["shirdi-sai-baba-yatra", "Shirdi Sai Baba Yatra"],
  ["haridwar-rishikesh-yatra", "Haridwar-Rishikesh Yatra"], ["kailash-mansarovar-yatra", "Kailash Mansarovar Yatra"],
] as const satisfies readonly (readonly [sourceKey: string, displayName: string])[];

export const TEMPLE_TOURISM_SOURCE_ROWS = [
  ["somnath", "Somnath"], ["mallikarjuna", "Mallikarjuna"], ["mahakaleshwar", "Mahakaleshwar"],
  ["omkareshwar", "Omkareshwar"], ["kedarnath", "Kedarnath"], ["bhimashankar", "Bhimashankar"],
  ["kashivishwanath", "Kashi Vishwanath"], ["trimbakeshwar", "Trimbakeshwar"], ["vaidyanath", "Baidyanath (Vaidyanath)"],
  ["nageshwar", "Nageshwar"], ["rameshwaram", "Rameshwaram"], ["grishneshwar", "Grishneshwar"],
  ["vaishno", "Vaishno Devi"], ["kamakhya", "Kamakhya Temple"], ["kalighat", "Kalighat Kali Temple"],
  ["vindhyavasini", "Vindhyavasini Devi"], ["ambaji", "Ambaji Temple"], ["badrinath", "Badrinath"],
  ["gangotri", "Gangotri"], ["yamunotri", "Yamunotri"], ["gangaRiver", "River Ganga"],
  ["yamunaRiver", "River Yamuna"], ["narmadaRiver", "River Narmada"], ["godavariRiver", "River Godavari"],
  ["kaveriRiver", "River Kaveri"], ["ayodhya", "Ayodhya — Birthplace of Lord Ram"],
  ["mathuraVrindavan", "Mathura-Vrindavan — Birthplace of Lord Krishna"], ["haridwar", "Haridwar — Gateway to Gods"],
  ["dwarka", "Dwarka — Lord Krishna's Kingdom"], ["kawadYatra", "Kawad Yatra"], ["amarnathYatra", "Amarnath Yatra"],
  ["narmadaParikrama", "Narmada Parikrama"], ["mansarovar", "Kailash Mansarovar Yatra"],
  ["tirupati", "Tirupati Balaji"], ["jagannath", "Jagannath Puri"], ["meenakshi", "Meenakshi Amman Temple"],
  ["goldenTemple", "Golden Temple (Harmandir Sahib)"], ["shirdi", "Shirdi Sai Baba Temple"],
  ["konark", "Konark Sun Temple"], ["sabarimala", "Sabarimala"], ["hemkundSahib", "Hemkund Sahib Trek"],
  ["govardhanParikrama", "Govardhan Parikrama"],
] as const satisfies readonly (readonly [sourceKey: string, displayName: string])[];

/** Immutable seeded tour slugs; these are YATRA product keys, never Tirth keys. */
export const YATRA_TOUR_SOURCE_KEYS = [
  "delhi-char-dham-yatra", "delhi-rishikesh-yatra", "delhi-haridwar-yatra",
  "delhi-badrinath-yatra", "delhi-gangotri-yatra", "delhi-yamunotri-yatra",
  "delhi-kashi-vishwanath-yatra", "delhi-kamakhya-darshan-yatra",
] as const;

export const PILGRIMAGE_SOURCE_ROUTE_PARITY = {
  tirthGuide: { index: "/tirth-yatra", detail: "/tirth-yatra/:slug", headingTestId: "text-page-title" },
  templeTourism: { index: "/temple-tourism", headingTestId: "text-page-title" },
  yatraTours: {
    list: "/api/yatra/tours",
    detail: "/api/yatra/tours/:slug",
    inquiry: "/api/yatra/inquire",
    listFields: ["id", "slug", "name", "route", "departureCity", "durationDays", "durationNights", "priceInr"],
    inquiryFields: ["tourId", "tourSlug", "name", "phone", "email", "city", "travelers", "preferredMonth", "message"],
  },
} as const;

export const YATRA_PERSISTENCE_CONTRACT = {
  tourTable: "tirth_yatra_tours",
  inquiryTable: "tirth_yatra_inquiries",
  tourStableKey: "slug",
  inquiryCompatibilityFields: ["tourId", "tourSlug", "name", "phone", "email", "city", "travelers", "preferredMonth", "message"],
} as const;

export const PILGRIMAGE_SOURCE_PUBLIC_FIELDS = {
  tirthGuide: ["slug", "name", "region", "state", "deity", "category", "description", "coordinates", "seo"],
  templeTourism: ["id", "name", "nameHindi", "location", "state", "description", "deity", "category", "lat", "lng"],
} as const;
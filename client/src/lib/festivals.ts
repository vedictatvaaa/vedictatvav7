export type FestivalTheme = {
  id: string;
  name: string;
  nameHi: string;
  tagline: string;
  taglineHi: string;
  date: string;
  mdRange: [string, string];
  palette: {
    from: string;
    via: string;
    to: string;
    accent: string;
    accentSoft: string;
    ink: string;
  };
  motif: "diya" | "peacock" | "lotus" | "modak" | "rakhi" | "trishul" | "color" | "swastik" | "leaf" | "kalash" | "om";
};

export const FESTIVALS: FestivalTheme[] = [
  {
    id: "akshaya-tritiya",
    name: "Akshaya Tritiya",
    nameHi: "अक्षय तृतीया",
    tagline: "Day of eternal prosperity — gold, gifting, sacred beginnings.",
    taglineHi: "अक्षय समृद्धि का दिन — स्वर्ण, दान एवं शुभ आरंभ।",
    date: "Apr 20, 2026",
    mdRange: ["04-16", "04-20"],
    palette: { from: "#7A5B12", via: "#B8860B", to: "#D4AF37", accent: "#FFD86B", accentSoft: "#FFF1B8", ink: "#FFF8DC" },
    motif: "kalash",
  },
  {
    id: "ganga-dussehra",
    name: "Ganga Dussehra",
    nameHi: "गंगा दशहरा",
    tagline: "Descent of Ma Ganga — purifying waters, sacred ablution.",
    taglineHi: "माँ गंगा का अवतरण — पवित्र जल, पावन स्नान।",
    date: "May 26, 2026",
    mdRange: ["05-20", "05-30"],
    palette: { from: "#0D5C7A", via: "#1E88B5", to: "#5BC0DE", accent: "#A7E1F4", accentSoft: "#D7F1FA", ink: "#EAF7FB" },
    motif: "lotus",
  },
  {
    id: "rath-yatra",
    name: "Jagannath Rath Yatra",
    nameHi: "रथ यात्रा",
    tagline: "Jagannath, Balabhadra & Subhadra ride through Puri.",
    taglineHi: "जगन्नाथ, बलभद्र एवं सुभद्रा की पुरी में रथ यात्रा।",
    date: "Jun 27, 2026",
    mdRange: ["06-22", "07-02"],
    palette: { from: "#5C1010", via: "#8B1A1A", to: "#C0392B", accent: "#F4C430", accentSoft: "#FFE9A8", ink: "#FFF4D6" },
    motif: "trishul",
  },
  {
    id: "guru-purnima",
    name: "Guru Purnima",
    nameHi: "गुरु पूर्णिमा",
    tagline: "Honour the guru — light of inner wisdom.",
    taglineHi: "गुरु की वंदना — अंतर ज्ञान का प्रकाश।",
    date: "Jul 10, 2026",
    mdRange: ["07-05", "07-13"],
    palette: { from: "#2A1A4A", via: "#5C3A8A", to: "#8E6BC2", accent: "#F4C430", accentSoft: "#FFE7A8", ink: "#FFF6D6" },
    motif: "om",
  },
  {
    id: "raksha-bandhan",
    name: "Raksha Bandhan",
    nameHi: "रक्षा बंधन",
    tagline: "Sacred thread of love between siblings.",
    taglineHi: "भाई-बहन के स्नेह का पावन सूत्र।",
    date: "Aug 28, 2026",
    mdRange: ["08-22", "08-31"],
    palette: { from: "#7A1D3A", via: "#C0397A", to: "#F088B5", accent: "#FFD86B", accentSoft: "#FFEFC2", ink: "#FFF6E0" },
    motif: "rakhi",
  },
  {
    id: "janmashtami",
    name: "Krishna Janmashtami",
    nameHi: "कृष्ण जन्माष्टमी",
    tagline: "Midnight birth of Sri Krishna — flute, peacock, makhan.",
    taglineHi: "श्रीकृष्ण का मध्यरात्रि अवतरण — बंसी, मोरपंख, माखन।",
    date: "Sep 4, 2026",
    mdRange: ["08-30", "09-08"],
    palette: { from: "#0B1B3A", via: "#1F3A78", to: "#3D7BC4", accent: "#F4C430", accentSoft: "#FFE7A8", ink: "#FFF6D6" },
    motif: "peacock",
  },
  {
    id: "ganesh-chaturthi",
    name: "Ganesh Chaturthi",
    nameHi: "गणेश चतुर्थी",
    tagline: "Ganpati Bappa — remover of obstacles arrives home.",
    taglineHi: "गणपति बप्पा — विघ्नहर्ता का घर पधारना।",
    date: "Sep 14, 2026",
    mdRange: ["09-10", "09-24"],
    palette: { from: "#6B0F1A", via: "#A8201A", to: "#E8743C", accent: "#FFD86B", accentSoft: "#FFEFC2", ink: "#FFF6E0" },
    motif: "modak",
  },
  {
    id: "navratri",
    name: "Sharad Navratri",
    nameHi: "शारद नवरात्रि",
    tagline: "Nine nights of Devi — dance, fast, devotion.",
    taglineHi: "देवी की नौ रातें — गरबा, उपवास, भक्ति।",
    date: "Sep 22 – Oct 1, 2026",
    mdRange: ["09-25", "10-04"],
    palette: { from: "#7A0E2E", via: "#C81E5A", to: "#F0457E", accent: "#FFD86B", accentSoft: "#FFEFC2", ink: "#FFF6E0" },
    motif: "trishul",
  },
  {
    id: "dussehra",
    name: "Vijaya Dashami",
    nameHi: "विजयादशमी",
    tagline: "Victory of dharma — Ravana effigies burn at sunset.",
    taglineHi: "धर्म की विजय — सूर्यास्त पर रावण-दहन।",
    date: "Oct 2, 2026",
    mdRange: ["10-05", "10-08"],
    palette: { from: "#5C1010", via: "#A8201A", to: "#E8743C", accent: "#FFD86B", accentSoft: "#FFEFC2", ink: "#FFF6E0" },
    motif: "trishul",
  },
  {
    id: "karva-chauth",
    name: "Karva Chauth",
    nameHi: "करवा चौथ",
    tagline: "Moonrise vow — devotion of the wedded.",
    taglineHi: "चंद्रोदय का व्रत — सुहागिनों की भक्ति।",
    date: "Oct 9, 2026",
    mdRange: ["10-15", "10-19"],
    palette: { from: "#5B1640", via: "#9B2D6B", to: "#D85FA0", accent: "#FFD86B", accentSoft: "#FFEFC2", ink: "#FFF6E0" },
    motif: "lotus",
  },
  {
    id: "diwali",
    name: "Diwali",
    nameHi: "दीपावली",
    tagline: "Festival of lights — Lakshmi, lamps, laddoos, joy.",
    taglineHi: "दीपों का पर्व — लक्ष्मी, दीप, लड्डू, उल्लास।",
    date: "Nov 8, 2026",
    mdRange: ["10-25", "11-12"],
    palette: { from: "#3A0F0F", via: "#7A1D1D", to: "#C0392B", accent: "#F4C430", accentSoft: "#FFD86B", ink: "#FFF6D6" },
    motif: "diya",
  },
  {
    id: "chhath",
    name: "Chhath Puja",
    nameHi: "छठ पूजा",
    tagline: "Offering arghya to Surya Dev at the river ghats.",
    taglineHi: "घाटों पर सूर्य देव को अर्घ्य अर्पण।",
    date: "Nov 14 – 17, 2026",
    mdRange: ["11-13", "11-18"],
    palette: { from: "#7A2A0E", via: "#C8551E", to: "#F0884E", accent: "#FFD86B", accentSoft: "#FFEFC2", ink: "#FFF6E0" },
    motif: "kalash",
  },
  {
    id: "tulsi-vivah",
    name: "Tulsi Vivah",
    nameHi: "तुलसी विवाह",
    tagline: "Sacred marriage of Tulsi & Shaligram.",
    taglineHi: "तुलसी एवं शालिग्राम का पावन विवाह।",
    date: "Nov 23, 2026",
    mdRange: ["11-20", "11-25"],
    palette: { from: "#0E5234", via: "#1B7A4F", to: "#4FAE7A", accent: "#FFD86B", accentSoft: "#FFEFC2", ink: "#FFF6E0" },
    motif: "leaf",
  },
  {
    id: "geeta-jayanti",
    name: "Gita Jayanti",
    nameHi: "गीता जयंती",
    tagline: "Birthday of the Bhagavad Gita.",
    taglineHi: "श्रीमद्भगवद्गीता का अवतरण दिवस।",
    date: "Dec 1, 2026",
    mdRange: ["11-28", "12-04"],
    palette: { from: "#0B1B3A", via: "#1F3A78", to: "#3D7BC4", accent: "#F4C430", accentSoft: "#FFE7A8", ink: "#FFF6D6" },
    motif: "om",
  },
  {
    id: "makar-sankranti",
    name: "Makar Sankranti",
    nameHi: "मकर संक्रांति",
    tagline: "Sun enters Capricorn — kites, til-gud, harvest joy.",
    taglineHi: "सूर्य का मकर प्रवेश — पतंग, तिल-गुड़, फसल उत्सव।",
    date: "Jan 14, 2026",
    mdRange: ["01-10", "01-16"],
    palette: { from: "#5C2E0E", via: "#A8551E", to: "#F0A04E", accent: "#FFD86B", accentSoft: "#FFEFC2", ink: "#FFF6E0" },
    motif: "swastik",
  },
  {
    id: "vasant-panchami",
    name: "Vasant Panchami",
    nameHi: "वसंत पंचमी",
    tagline: "Saraswati Puja — wisdom blooms in yellow.",
    taglineHi: "सरस्वती पूजन — पीले रंग में ज्ञान का प्रस्फुटन।",
    date: "Jan 23, 2026",
    mdRange: ["01-20", "01-26"],
    palette: { from: "#7A6510", via: "#C8AB1E", to: "#F4D03F", accent: "#FFF1B8", accentSoft: "#FFFADB", ink: "#5C3A0E" },
    motif: "lotus",
  },
  {
    id: "mahashivratri",
    name: "Mahashivratri",
    nameHi: "महाशिवरात्रि",
    tagline: "The great night of Lord Shiva.",
    taglineHi: "भगवान शिव की महान रात्रि।",
    date: "Feb 15, 2026",
    mdRange: ["02-10", "02-18"],
    palette: { from: "#0E1F2E", via: "#1B3A52", to: "#3F6A8A", accent: "#F4C430", accentSoft: "#FFE7A8", ink: "#FFF6D6" },
    motif: "trishul",
  },
  {
    id: "holi",
    name: "Holi",
    nameHi: "होली",
    tagline: "Festival of colours — burst into spring.",
    taglineHi: "रंगों का पर्व — वसंत का उल्लास।",
    date: "Mar 4, 2026",
    mdRange: ["03-01", "03-08"],
    palette: { from: "#7A1D5A", via: "#C8397A", to: "#F088B5", accent: "#F4D03F", accentSoft: "#A7E1F4", ink: "#FFF6E0" },
    motif: "color",
  },
  {
    id: "ram-navami",
    name: "Ram Navami",
    nameHi: "राम नवमी",
    tagline: "Birth of Maryada Purushottam Sri Ram.",
    taglineHi: "मर्यादा पुरुषोत्तम श्रीराम का जन्म।",
    date: "Apr 5, 2026",
    mdRange: ["04-01", "04-09"],
    palette: { from: "#7A1D1D", via: "#C0392B", to: "#F0884E", accent: "#FFD86B", accentSoft: "#FFEFC2", ink: "#FFF6E0" },
    motif: "om",
  },
  {
    id: "hanuman-jayanti",
    name: "Hanuman Jayanti",
    nameHi: "हनुमान जयंती",
    tagline: "Bajrang Bali — strength, bhakti, courage.",
    taglineHi: "बजरंग बली — बल, भक्ति, साहस।",
    date: "Apr 21, 2026",
    mdRange: ["04-15", "04-24"],
    palette: { from: "#7A2A0E", via: "#C8551E", to: "#F0884E", accent: "#FFD86B", accentSoft: "#FFEFC2", ink: "#FFF6E0" },
    motif: "trishul",
  },
];

const DEFAULT_THEME: FestivalTheme = {
  id: "everyday",
  name: "Sanatan Dharma",
  nameHi: "सनातन धर्म",
  tagline: "Daily devotion — every dawn is sacred.",
  taglineHi: "नित्य भक्ति — हर प्रभात पावन है।",
  date: "",
  mdRange: ["01-01", "12-31"],
  palette: { from: "#3A1018", via: "#6D2B35", to: "#8B3A47", accent: "#D4AF37", accentSoft: "#F0D080", ink: "#FFF6D6" },
  motif: "om",
};

function mdKey(d: Date) {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${m}-${day}`;
}

export function getActiveFestival(now: Date = new Date()): FestivalTheme {
  const today = mdKey(now);
  const inRange = FESTIVALS.find((f) => {
    const [start, end] = f.mdRange;
    if (start <= end) return today >= start && today <= end;
    return today >= start || today <= end;
  });
  return inRange ?? DEFAULT_THEME;
}

export function getDefaultTheme(): FestivalTheme {
  return DEFAULT_THEME;
}

// Parse a festival's primary start date into a real Date in the given year.
// Uses the first md in mdRange so the date is deterministic year-over-year.
export function getFestivalStartDate(f: FestivalTheme, year: number): Date {
  const [mm, dd] = f.mdRange[0].split("-").map(Number);
  // Anchor at 06:00 local so countdown lands on the morning of the festival.
  return new Date(year, (mm || 1) - 1, dd || 1, 6, 0, 0, 0);
}

// The next upcoming festival relative to `now`, or the currently active one.
export function getNextFestival(now: Date = new Date()): { festival: FestivalTheme; startsAt: Date } {
  const active = getActiveFestival(now);
  if (active.id !== "everyday") {
    return { festival: active, startsAt: getFestivalStartDate(active, now.getFullYear()) };
  }
  const year = now.getFullYear();
  const upcoming = FESTIVALS
    .map((f) => {
      let d = getFestivalStartDate(f, year);
      if (d.getTime() < now.getTime()) d = getFestivalStartDate(f, year + 1);
      return { festival: f, startsAt: d };
    })
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
  return upcoming[0] ?? { festival: DEFAULT_THEME, startsAt: new Date(now.getTime() + 86400000) };
}

export function getFestivalById(id: string): FestivalTheme | null {
  return FESTIVALS.find((f) => f.id === id) ?? null;
}

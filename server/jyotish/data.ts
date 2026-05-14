// Vedic astrology reference data.
// Source: Brihat Parashara Hora Shastra, standard Drik Panchang conventions, Lahiri ayanamsa.

export const SIGNS_EN = [
  "Aries","Taurus","Gemini","Cancer","Leo","Virgo",
  "Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces",
] as const;

export const SIGNS_HI = [
  "मेष","वृषभ","मिथुन","कर्क","सिंह","कन्या",
  "तुला","वृश्चिक","धनु","मकर","कुम्भ","मीन",
] as const;

export const SIGN_LORDS = [
  "Mars","Venus","Mercury","Moon","Sun","Mercury",
  "Venus","Mars","Jupiter","Saturn","Saturn","Jupiter",
] as const;

export const SIGN_ELEMENTS = [
  "Fire","Earth","Air","Water","Fire","Earth",
  "Air","Water","Fire","Earth","Air","Water",
] as const;

export const SIGN_QUALITY = [
  "Movable","Fixed","Dual","Movable","Fixed","Dual",
  "Movable","Fixed","Dual","Movable","Fixed","Dual",
] as const;

export interface NakshatraInfo {
  name: string;
  nameHi: string;
  lord: string;
  deity: string;
  symbol: string;
  syllables: [string, string, string, string];
  guna: "Sattva" | "Rajas" | "Tamas";
  gana: "Deva" | "Manushya" | "Rakshasa";
}

export const NAKSHATRAS: NakshatraInfo[] = [
  { name:"Ashwini",          nameHi:"अश्विनी",        lord:"Ketu",    deity:"Ashwini Kumaras", symbol:"Horse's head",       syllables:["Chu","Che","Cho","La"],   guna:"Sattva", gana:"Deva" },
  { name:"Bharani",          nameHi:"भरणी",            lord:"Venus",   deity:"Yama",            symbol:"Yoni",                syllables:["Li","Lu","Le","Lo"],      guna:"Rajas",  gana:"Manushya" },
  { name:"Krittika",         nameHi:"कृत्तिका",       lord:"Sun",     deity:"Agni",            symbol:"Razor / Flame",       syllables:["A","I","U","E"],          guna:"Rajas",  gana:"Rakshasa" },
  { name:"Rohini",           nameHi:"रोहिणी",          lord:"Moon",    deity:"Brahma",          symbol:"Cart / Chariot",      syllables:["O","Va","Vi","Vu"],       guna:"Rajas",  gana:"Manushya" },
  { name:"Mrigashira",       nameHi:"मृगशिरा",        lord:"Mars",    deity:"Soma",            symbol:"Deer's head",         syllables:["Ve","Vo","Ka","Ki"],      guna:"Tamas",  gana:"Deva" },
  { name:"Ardra",            nameHi:"आर्द्रा",         lord:"Rahu",    deity:"Rudra",           symbol:"Teardrop",            syllables:["Ku","Gha","Nga","Chha"],  guna:"Tamas",  gana:"Manushya" },
  { name:"Punarvasu",        nameHi:"पुनर्वसु",        lord:"Jupiter", deity:"Aditi",           symbol:"Quiver of arrows",    syllables:["Ke","Ko","Ha","Hi"],      guna:"Sattva", gana:"Deva" },
  { name:"Pushya",           nameHi:"पुष्य",           lord:"Saturn",  deity:"Brihaspati",      symbol:"Cow's udder",         syllables:["Hu","He","Ho","Da"],      guna:"Sattva", gana:"Deva" },
  { name:"Ashlesha",         nameHi:"आश्लेषा",        lord:"Mercury", deity:"Nagas",           symbol:"Coiled serpent",      syllables:["Di","Du","De","Do"],      guna:"Sattva", gana:"Rakshasa" },
  { name:"Magha",            nameHi:"मघा",             lord:"Ketu",    deity:"Pitris",          symbol:"Royal throne",        syllables:["Ma","Mi","Mu","Me"],      guna:"Tamas",  gana:"Rakshasa" },
  { name:"Purva Phalguni",   nameHi:"पूर्वा फाल्गुनी", lord:"Venus",   deity:"Bhaga",           symbol:"Hammock",             syllables:["Mo","Ta","Ti","Tu"],      guna:"Rajas",  gana:"Manushya" },
  { name:"Uttara Phalguni",  nameHi:"उत्तरा फाल्गुनी", lord:"Sun",     deity:"Aryaman",         symbol:"Bed",                 syllables:["Te","To","Pa","Pi"],      guna:"Rajas",  gana:"Manushya" },
  { name:"Hasta",            nameHi:"हस्त",            lord:"Moon",    deity:"Savitar",         symbol:"Open hand",           syllables:["Pu","Sha","Na","Tha"],    guna:"Rajas",  gana:"Deva" },
  { name:"Chitra",           nameHi:"चित्रा",          lord:"Mars",    deity:"Vishvakarma",     symbol:"Bright pearl",        syllables:["Pe","Po","Ra","Ri"],      guna:"Tamas",  gana:"Rakshasa" },
  { name:"Swati",            nameHi:"स्वाति",          lord:"Rahu",    deity:"Vayu",            symbol:"Sapphire / Coral",    syllables:["Ru","Re","Ro","Ta"],      guna:"Tamas",  gana:"Deva" },
  { name:"Vishakha",         nameHi:"विशाखा",         lord:"Jupiter", deity:"Indra-Agni",      symbol:"Triumphal arch",      syllables:["Ti","Tu","Te","To"],      guna:"Sattva", gana:"Rakshasa" },
  { name:"Anuradha",         nameHi:"अनुराधा",         lord:"Saturn",  deity:"Mitra",           symbol:"Lotus",               syllables:["Na","Ni","Nu","Ne"],      guna:"Sattva", gana:"Deva" },
  { name:"Jyeshtha",         nameHi:"ज्येष्ठा",        lord:"Mercury", deity:"Indra",           symbol:"Earring / Umbrella",  syllables:["No","Ya","Yi","Yu"],      guna:"Sattva", gana:"Rakshasa" },
  { name:"Mula",             nameHi:"मूल",             lord:"Ketu",    deity:"Nirriti",         symbol:"Bunch of roots",      syllables:["Ye","Yo","Bha","Bhi"],    guna:"Tamas",  gana:"Rakshasa" },
  { name:"Purva Ashadha",    nameHi:"पूर्वाषाढ़ा",     lord:"Venus",   deity:"Apah",            symbol:"Elephant tusk",       syllables:["Bhu","Dha","Pha","Dha"],  guna:"Rajas",  gana:"Manushya" },
  { name:"Uttara Ashadha",   nameHi:"उत्तराषाढ़ा",    lord:"Sun",     deity:"Vishvedevas",     symbol:"Elephant tusk",       syllables:["Bhe","Bho","Ja","Ji"],    guna:"Rajas",  gana:"Manushya" },
  { name:"Shravana",         nameHi:"श्रवण",           lord:"Moon",    deity:"Vishnu",          symbol:"Three footprints",    syllables:["Khi","Khu","Khe","Kho"],  guna:"Rajas",  gana:"Deva" },
  { name:"Dhanishta",        nameHi:"धनिष्ठा",         lord:"Mars",    deity:"Eight Vasus",     symbol:"Drum / Flute",        syllables:["Ga","Gi","Gu","Ge"],      guna:"Tamas",  gana:"Rakshasa" },
  { name:"Shatabhisha",      nameHi:"शतभिषा",          lord:"Rahu",    deity:"Varuna",          symbol:"Empty circle",        syllables:["Go","Sa","Si","Su"],      guna:"Tamas",  gana:"Rakshasa" },
  { name:"Purva Bhadrapada", nameHi:"पूर्व भाद्रपद",   lord:"Jupiter", deity:"Aja Ekapada",     symbol:"Two-faced man",       syllables:["Se","So","Da","Di"],      guna:"Sattva", gana:"Manushya" },
  { name:"Uttara Bhadrapada",nameHi:"उत्तर भाद्रपद",   lord:"Saturn",  deity:"Ahir Budhnya",    symbol:"Twin / Serpent",      syllables:["Du","Tha","Jha","Tra"],   guna:"Sattva", gana:"Manushya" },
  { name:"Revati",           nameHi:"रेवती",           lord:"Mercury", deity:"Pushan",          symbol:"Fish",                syllables:["De","Do","Cha","Chi"],    guna:"Sattva", gana:"Deva" },
];

// 30 tithis: indices 0-14 = Shukla 1-15 (Pratipada -> Purnima),
// indices 15-29 = Krishna 1-15 (Pratipada -> Amavasya).
export const TITHI_NAMES = [
  "Shukla Pratipada","Shukla Dwitiya","Shukla Tritiya","Shukla Chaturthi","Shukla Panchami",
  "Shukla Shashthi","Shukla Saptami","Shukla Ashtami","Shukla Navami","Shukla Dashami",
  "Shukla Ekadashi","Shukla Dwadashi","Shukla Trayodashi","Shukla Chaturdashi","Purnima",
  "Krishna Pratipada","Krishna Dwitiya","Krishna Tritiya","Krishna Chaturthi","Krishna Panchami",
  "Krishna Shashthi","Krishna Saptami","Krishna Ashtami","Krishna Navami","Krishna Dashami",
  "Krishna Ekadashi","Krishna Dwadashi","Krishna Trayodashi","Krishna Chaturdashi","Amavasya",
] as const;

export const TITHI_NAMES_HI = [
  "शुक्ल प्रतिपदा","शुक्ल द्वितीया","शुक्ल तृतीया","शुक्ल चतुर्थी","शुक्ल पञ्चमी",
  "शुक्ल षष्ठी","शुक्ल सप्तमी","शुक्ल अष्टमी","शुक्ल नवमी","शुक्ल दशमी",
  "शुक्ल एकादशी","शुक्ल द्वादशी","शुक्ल त्रयोदशी","शुक्ल चतुर्दशी","पूर्णिमा",
  "कृष्ण प्रतिपदा","कृष्ण द्वितीया","कृष्ण तृतीया","कृष्ण चतुर्थी","कृष्ण पञ्चमी",
  "कृष्ण षष्ठी","कृष्ण सप्तमी","कृष्ण अष्टमी","कृष्ण नवमी","कृष्ण दशमी",
  "कृष्ण एकादशी","कृष्ण द्वादशी","कृष्ण त्रयोदशी","कृष्ण चतुर्दशी","अमावस्या",
] as const;

export const YOGAS = [
  "Vishkumbha","Preeti","Ayushman","Saubhagya","Shobhana","Atiganda","Sukarma","Dhriti",
  "Shoola","Ganda","Vriddhi","Dhruva","Vyaghata","Harshana","Vajra","Siddhi","Vyatipata",
  "Variyana","Parigha","Shiva","Siddha","Sadhya","Shubha","Shukla","Brahma","Indra","Vaidhriti",
] as const;

export const YOGAS_HI = [
  "विष्कुम्भ","प्रीति","आयुष्मान","सौभाग्य","शोभन","अतिगण्ड","सुकर्मा","धृति",
  "शूल","गण्ड","वृद्धि","ध्रुव","व्याघात","हर्षण","वज्र","सिद्धि","व्यतीपात",
  "वरीयान","परिघ","शिव","सिद्ध","साध्य","शुभ","शुक्ल","ब्रह्म","ऐन्द्र","वैधृति",
] as const;

// 11 karanas: 7 movable (chara) + 4 fixed (sthira).
// Sequence over a lunar month: 56 karanas total (60 half-tithis but first/last 4 are fixed).
// Index in a tithi: karana = first half (index 0 of 60) ... last half (index 59).
export const KARANA_NAMES = [
  "Bava","Balava","Kaulava","Taitila","Garaja","Vanija","Vishti",
  "Shakuni","Chatushpada","Naga","Kimstughna",
] as const;

export const KARANA_NAMES_HI = [
  "बव","बालव","कौलव","तैतिल","गर","वणिज","विष्टि",
  "शकुनि","चतुष्पाद","नाग","किंस्तुघ्न",
] as const;

// Vimshottari dasha sequence (lord, years). Total = 120 years.
export const VIMSHOTTARI = [
  { lord:"Ketu",    years:7 },
  { lord:"Venus",   years:20 },
  { lord:"Sun",     years:6 },
  { lord:"Moon",    years:10 },
  { lord:"Mars",    years:7 },
  { lord:"Rahu",    years:18 },
  { lord:"Jupiter", years:16 },
  { lord:"Saturn",  years:19 },
  { lord:"Mercury", years:17 },
] as const;

// For each nakshatra (0-26), the Vimshottari dasha lord of that nakshatra.
// Pattern: Ketu, Venus, Sun, Moon, Mars, Rahu, Jupiter, Saturn, Mercury — repeats every 9 nakshatras.
export const NAKSHATRA_DASHA_LORDS = NAKSHATRAS.map((_, i) => VIMSHOTTARI[i % 9].lord);

export const PLANET_NAMES_HI: Record<string, string> = {
  Sun:"सूर्य", Moon:"चन्द्र", Mars:"मंगल", Mercury:"बुध",
  Jupiter:"गुरु", Venus:"शुक्र", Saturn:"शनि", Rahu:"राहु", Ketu:"केतु",
};

export const PLANET_DEITY_HI: Record<string, string> = {
  Sun:"भगवान सूर्यनारायण", Moon:"माँ चन्द्र देव", Mars:"भगवान हनुमान",
  Mercury:"भगवान विष्णु", Jupiter:"देवगुरु बृहस्पति", Venus:"माँ लक्ष्मी",
  Saturn:"भगवान शनि", Rahu:"माँ दुर्गा", Ketu:"भगवान गणेश",
};

// Exaltation/debilitation/own/mooltrikona signs per planet. (sign is 0-indexed 0=Aries .. 11=Pisces)
export const PLANET_DIGNITY: Record<string, {
  exaltSign: number; exaltDeg: number;
  debilSign: number; debilDeg: number;
  ownSigns: number[];
  mooltrikonaSign?: number; mooltrikonaRange?: [number, number];
}> = {
  Sun:     { exaltSign:0,  exaltDeg:10, debilSign:6,  debilDeg:10, ownSigns:[4],     mooltrikonaSign:4,  mooltrikonaRange:[0,20] },
  Moon:    { exaltSign:1,  exaltDeg:3,  debilSign:7,  debilDeg:3,  ownSigns:[3],     mooltrikonaSign:1,  mooltrikonaRange:[3,30] },
  Mars:    { exaltSign:9,  exaltDeg:28, debilSign:3,  debilDeg:28, ownSigns:[0,7],   mooltrikonaSign:0,  mooltrikonaRange:[0,12] },
  Mercury: { exaltSign:5,  exaltDeg:15, debilSign:11, debilDeg:15, ownSigns:[2,5],   mooltrikonaSign:5,  mooltrikonaRange:[15,20] },
  Jupiter: { exaltSign:3,  exaltDeg:5,  debilSign:9,  debilDeg:5,  ownSigns:[8,11],  mooltrikonaSign:8,  mooltrikonaRange:[0,10] },
  Venus:   { exaltSign:11, exaltDeg:27, debilSign:5,  debilDeg:27, ownSigns:[1,6],   mooltrikonaSign:6,  mooltrikonaRange:[0,15] },
  Saturn:  { exaltSign:6,  exaltDeg:20, debilSign:0,  debilDeg:20, ownSigns:[9,10],  mooltrikonaSign:10, mooltrikonaRange:[0,20] },
  Rahu:    { exaltSign:1,  exaltDeg:15, debilSign:7,  debilDeg:15, ownSigns:[],      },
  Ketu:    { exaltSign:7,  exaltDeg:15, debilSign:1,  debilDeg:15, ownSigns:[],      },
};

export const HINDU_MONTHS = [
  "Chaitra","Vaishakha","Jyeshtha","Ashadha","Shravana","Bhadrapada",
  "Ashwin","Kartika","Margashirsha","Pausha","Magha","Phalguna",
] as const;

export const HINDU_MONTHS_HI = [
  "चैत्र","वैशाख","ज्येष्ठ","आषाढ़","श्रावण","भाद्रपद",
  "आश्विन","कार्तिक","मार्गशीर्ष","पौष","माघ","फाल्गुन",
] as const;

// Lunar month lookup by Sun's sidereal sign at the start of the lunar month (amanta scheme).
// Sun in Mesha (Aries=0) when month begins -> Vaishakha; Vrishabha -> Jyeshtha; etc.
export const LUNAR_MONTH_FROM_SUN_SIGN = [
  "Vaishakha","Jyeshtha","Ashadha","Shravana","Bhadrapada","Ashwin",
  "Kartika","Margashirsha","Pausha","Magha","Phalguna","Chaitra",
] as const;

export const LUNAR_MONTH_FROM_SUN_SIGN_HI = [
  "वैशाख","ज्येष्ठ","आषाढ़","श्रावण","भाद्रपद","आश्विन",
  "कार्तिक","मार्गशीर्ष","पौष","माघ","फाल्गुन","चैत्र",
] as const;

export const WEEKDAYS_EN = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
export const WEEKDAYS_HI = ["रविवार","सोमवार","मंगलवार","बुधवार","गुरुवार","शुक्रवार","शनिवार"];
export const WEEKDAY_LORDS = ["Sun","Moon","Mars","Mercury","Jupiter","Venus","Saturn"];

// Day length is divided into 8 equal parts after sunrise. These tables give the
// segment number (1-8) where Rahu Kaal / Yamaganda / Gulika fall, indexed by weekday.
//                            Sun Mon Tue Wed Thu Fri Sat
export const RAHU_KAAL_SEGMENT  = [8, 2,  7,  5,  6,  4,  3];
export const YAMAGANDA_SEGMENT  = [5, 4,  3,  2,  1,  7,  6];
export const GULIKA_SEGMENT     = [7, 6,  5,  4,  3,  2,  1];

// Manglik check: Mars in houses 1, 4, 7, 8, 12 from Lagna or Moon.
export const MANGLIK_HOUSES = new Set([1, 4, 7, 8, 12]);

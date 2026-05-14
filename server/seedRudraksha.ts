import { db } from "./db";
import { products } from "@shared/schema";
import { eq, ilike } from "drizzle-orm";

type RudrakshaItem = {
  mukhi: string;
  imageSlug: string;
  name: string;
  shortName: string;
  price: number;
  stock: number;
  badge?: string;
  deity: string;
  planet: string;
  bijaMantra: string;
  origin: string;
  size: string;
  certification: string;
  benefits: string[];
  whoShouldWear: string[];
  spiritualSignificance: string;
  shortDescription: string;
};

const ITEMS: RudrakshaItem[] = [
  {
    mukhi: "1 Mukhi",
    imageSlug: "1-mukhi",
    name: "Vedic Tatva 1 Mukhi Rudraksha (Kaju Dana / Indonesian) - Lord Shiva Blessings | Lab Certified Original",
    shortName: "1 Mukhi Rudraksha",
    price: 2499,
    stock: 25,
    badge: "Rare",
    deity: "Lord Shiva (Brahma Swarupa)",
    planet: "Sun (Surya)",
    bijaMantra: "Om Hreem Namah",
    origin: "Indonesia (Java) - Cashew shape",
    size: "10–14 mm",
    certification: "Lab Certified Original",
    benefits: [
      "Awakens Sahasrara (Crown) Chakra and brings deep meditative focus",
      "Pierces ego, dissolves karmic blocks and heightens spiritual awareness",
      "Brings name, fame, leadership qualities and decision-making clarity",
      "Strengthens Sun's positive influence — improves confidence and vitality",
      "Considered the rarest and most powerful Rudraksha for moksha sadhana",
    ],
    whoShouldWear: [
      "Spiritual seekers, meditators and yogis aiming for higher consciousness",
      "Leaders, CEOs, founders and decision-makers",
      "People with weak Sun (Surya) in their birth chart",
      "Those facing recurring obstacles or feeling spiritually stuck",
    ],
    spiritualSignificance:
      "The 1 Mukhi (Ek Mukhi) is the rarest and most sacred Rudraksha — a direct manifestation of Lord Shiva himself. Wearing it is said to grant the merit of all pilgrimages and is the supreme bead for those walking the path of self-realisation.",
    shortDescription:
      "Genuine 1 Mukhi (Ek Mukhi) Rudraksha — extremely rare cashew-shaped (Kaju Dana) bead from Indonesia, ruled by Lord Shiva and Sun. Awakens the crown chakra, brings clarity, leadership and moksha.",
  },
  {
    mukhi: "2 Mukhi",
    imageSlug: "2-mukhi",
    name: "Vedic Tatva 2 Mukhi Rudraksha - Ardhanarishwar Blessings | Original Nepal Bead | Lab Certified",
    shortName: "2 Mukhi Rudraksha",
    price: 899,
    stock: 60,
    deity: "Ardhanarishwar (Shiva-Shakti)",
    planet: "Moon (Chandra)",
    bijaMantra: "Om Namah",
    origin: "Nepal",
    size: "20–26 mm",
    certification: "Lab Certified Original",
    benefits: [
      "Strengthens love, harmony and unity in relationships and marriage",
      "Pacifies the Moon — calms anxiety, mood swings and emotional turbulence",
      "Excellent for couples wanting children or peaceful family life",
      "Improves communication, empathy and emotional intelligence",
      "Removes Pitra Dosh and brings ancestral blessings",
    ],
    whoShouldWear: [
      "Married couples and those looking for harmony in relationships",
      "Anyone with weak Moon, anxiety or sleep disturbances",
      "People struggling with loneliness or low self-worth",
      "Those wanting a Guru-disciple bond strengthened",
    ],
    spiritualSignificance:
      "The 2 Mukhi Rudraksha represents Ardhanarishwar — the union of Shiva and Shakti. It harmonises male and female energies in the wearer and is the foremost bead for love, marriage and family unity.",
    shortDescription:
      "Original 2 Mukhi Rudraksha from Nepal — symbol of Ardhanarishwar (Shiva-Shakti). Brings unity in relationships, calms the mind, balances emotions, and pacifies Moon-related doshas.",
  },
  {
    mukhi: "3 Mukhi",
    imageSlug: "3-mukhi",
    name: "Vedic Tatva 3 Mukhi Rudraksha - Agni Dev Blessings | Original Nepal Bead | Lab Certified",
    shortName: "3 Mukhi Rudraksha",
    price: 599,
    stock: 80,
    deity: "Agni Dev (Fire God)",
    planet: "Mars (Mangal)",
    bijaMantra: "Om Kleem Namah",
    origin: "Nepal",
    size: "20–26 mm",
    certification: "Lab Certified Original",
    benefits: [
      "Burns past karma, guilt, regrets and negative samskaras",
      "Strengthens Mars — boosts courage, confidence and self-worth",
      "Helps overcome inferiority complex and fear of failure",
      "Improves digestion, liver function and metabolism",
      "Excellent for those recovering from chronic illness or trauma",
    ],
    whoShouldWear: [
      "People with weak Mars or Mangal Dosh",
      "Those suffering from low self-confidence or past guilt",
      "Anyone facing repeated failures or stagnation",
      "Patients recovering from prolonged illness",
    ],
    spiritualSignificance:
      "Ruled by Agni Dev, the 3 Mukhi Rudraksha purifies the wearer like sacred fire. It burns away the karmic residue of past lives and ignites the Manipura (Solar Plexus) chakra of will-power.",
    shortDescription:
      "Authentic 3 Mukhi Rudraksha from Nepal blessed by Agni Dev. Burns past karma, strengthens Mars, removes guilt and boosts self-confidence.",
  },
  {
    mukhi: "4 Mukhi",
    imageSlug: "4-mukhi",
    name: "Vedic Tatva 4 Mukhi Rudraksha - Lord Brahma Blessings | Original Nepal Bead | Lab Certified",
    shortName: "4 Mukhi Rudraksha",
    price: 449,
    stock: 90,
    deity: "Lord Brahma (Creator)",
    planet: "Mercury (Budh)",
    bijaMantra: "Om Hreem Namah",
    origin: "Nepal",
    size: "20–26 mm",
    certification: "Lab Certified Original",
    benefits: [
      "Sharpens intellect, memory, learning and analytical thinking",
      "Excellent for students, researchers, writers, teachers and orators",
      "Improves communication skills and public speaking",
      "Strengthens Mercury — beneficial for business and trade",
      "Cures speech disorders, stammering and brain-related issues",
    ],
    whoShouldWear: [
      "Students preparing for competitive exams",
      "Teachers, lecturers, writers, journalists and content creators",
      "Businesspeople and traders",
      "Anyone with weak Mercury (Budh) in their kundli",
    ],
    spiritualSignificance:
      "Ruled by Lord Brahma — the cosmic creator — the 4 Mukhi Rudraksha activates Vishuddhi and Ajna chakras. It is the bead of knowledge, creativity and intellectual brilliance.",
    shortDescription:
      "Genuine 4 Mukhi Rudraksha from Nepal — blessed by Lord Brahma. The supreme bead for students, scholars and seekers of knowledge. Strengthens Mercury and improves intellect.",
  },
  {
    mukhi: "5 Mukhi",
    imageSlug: "5-mukhi",
    name: "Vedic Tatva 5 Mukhi Rudraksha - Lord Kalagni Rudra Blessings | Original Nepal Bead | Lab Certified",
    shortName: "5 Mukhi Rudraksha",
    price: 199,
    stock: 200,
    badge: "Best Seller",
    deity: "Lord Kalagni Rudra (Form of Shiva)",
    planet: "Jupiter (Guru)",
    bijaMantra: "Om Hreem Namah",
    origin: "Nepal",
    size: "20–28 mm",
    certification: "Lab Certified Original",
    benefits: [
      "Most universally suitable Rudraksha — wearable by anyone of any age",
      "Calms the mind, reduces stress, anxiety, BP and lifestyle disorders",
      "Strengthens Jupiter — brings wisdom, wealth and good fortune",
      "Foundation bead of all Rudraksha malas (108+1 beads)",
      "Excellent for meditation, daily japa and spiritual sadhana",
    ],
    whoShouldWear: [
      "Anyone — children, adults, seniors — no astrological restriction",
      "People with high stress, BP, insomnia or anxiety",
      "Spiritual sadhakas for daily mantra japa",
      "Those wanting overall good health and prosperity",
    ],
    spiritualSignificance:
      "The 5 Mukhi Rudraksha is the most sacred and accessible bead — representing the five forms of Lord Shiva (Panchanan). It is the foundation of every traditional Rudraksha mala and the universal protector.",
    shortDescription:
      "Original Nepali 5 Mukhi Rudraksha blessed by Kalagni Rudra and ruled by Jupiter. Universal bead — calms the mind, reduces stress, and is ideal for daily japa and meditation.",
  },
  {
    mukhi: "6 Mukhi",
    imageSlug: "6-mukhi",
    name: "Vedic Tatva 6 Mukhi Rudraksha - Lord Kartikeya & Maa Lakshmi Blessings | Original Nepal Bead",
    shortName: "6 Mukhi Rudraksha",
    price: 549,
    stock: 70,
    deity: "Lord Kartikeya & Maa Lakshmi",
    planet: "Venus (Shukra)",
    bijaMantra: "Om Hreem Hum Namah",
    origin: "Nepal",
    size: "20–26 mm",
    certification: "Lab Certified Original",
    benefits: [
      "Strengthens Venus — brings love, beauty, charm and material comforts",
      "Improves marital harmony and removes marriage delays",
      "Excellent for artists, designers, performers and creative professionals",
      "Cures reproductive system issues and hormonal imbalances",
      "Brings wealth, luxury and refined taste into life",
    ],
    whoShouldWear: [
      "Unmarried people facing marriage delays",
      "Couples wanting to revive love and intimacy",
      "Artists, fashion designers, models, actors",
      "Anyone with weak Venus or Shukra Dosh",
    ],
    spiritualSignificance:
      "The 6 Mukhi Rudraksha is blessed by Lord Kartikeya (younger son of Shiva) and Maa Lakshmi. It governs the Swadhisthana (Sacral) chakra and rules over love, sensuality, beauty and prosperity.",
    shortDescription:
      "Authentic 6 Mukhi Rudraksha from Nepal — blessed by Lord Kartikeya. Strengthens Venus, attracts love and luxury, ideal for artists and those seeking marital harmony.",
  },
  {
    mukhi: "7 Mukhi",
    imageSlug: "7-mukhi",
    name: "Vedic Tatva 7 Mukhi Rudraksha - Maa Mahalakshmi Blessings | Original Nepal Bead | Lab Certified",
    shortName: "7 Mukhi Rudraksha",
    price: 749,
    stock: 60,
    deity: "Maa Mahalakshmi (Goddess of Wealth)",
    planet: "Saturn (Shani)",
    bijaMantra: "Om Hum Namah",
    origin: "Nepal",
    size: "20–26 mm",
    certification: "Lab Certified Original",
    benefits: [
      "Attracts wealth, prosperity and business success",
      "Pacifies Saturn — removes Sade Sati and Dhaiya doshas",
      "Brings stability in career, job and finances",
      "Cures bone, joint and chronic ailments related to Saturn",
      "Helps overcome long-standing financial losses or debts",
    ],
    whoShouldWear: [
      "Anyone going through Sade Sati or Shani Dhaiya",
      "Businesspeople struggling with losses",
      "Job seekers and people aiming for promotions",
      "Those with weak or malefic Saturn",
    ],
    spiritualSignificance:
      "The 7 Mukhi Rudraksha is the abode of Maa Mahalakshmi — Goddess of Wealth. It pacifies the harshest planet Saturn and brings unbroken flow of prosperity, good fortune and stability.",
    shortDescription:
      "Original 7 Mukhi Rudraksha from Nepal — blessed by Maa Mahalakshmi. The most powerful bead for wealth, business success, and pacifying Sade Sati / Shani Dosh.",
  },
  {
    mukhi: "8 Mukhi",
    imageSlug: "8-mukhi",
    name: "Vedic Tatva 8 Mukhi Rudraksha - Lord Ganesha Blessings | Original Nepal Bead | Lab Certified",
    shortName: "8 Mukhi Rudraksha",
    price: 999,
    stock: 50,
    deity: "Lord Ganesha (Vighnaharta)",
    planet: "Rahu (Northern Node)",
    bijaMantra: "Om Hum Namah",
    origin: "Nepal",
    size: "20–26 mm",
    certification: "Lab Certified Original",
    benefits: [
      "Removes obstacles (Vighna) from every aspect of life",
      "Pacifies Rahu — removes confusion, illusion and fear",
      "Best worn before starting a new venture or major life change",
      "Improves writing, communication and intellectual sharpness",
      "Protects from accidents, theft, hidden enemies and black magic",
    ],
    whoShouldWear: [
      "Entrepreneurs starting a new business",
      "People with strong Rahu mahadasha or antardasha",
      "Anyone facing repeated obstacles, delays or sudden problems",
      "Travellers and frequent flyers",
    ],
    spiritualSignificance:
      "The 8 Mukhi Rudraksha is the abode of Lord Ganesha — the remover of obstacles. It pacifies Rahu and is worn at the beginning of any new endeavour for guaranteed success.",
    shortDescription:
      "Genuine 8 Mukhi Rudraksha from Nepal — blessed by Lord Ganesha (Vighnaharta). Removes obstacles, pacifies Rahu, and ensures success in new ventures.",
  },
  {
    mukhi: "9 Mukhi",
    imageSlug: "9-mukhi",
    name: "Vedic Tatva 9 Mukhi Rudraksha - Maa Durga Blessings | Original Nepal Bead | Lab Certified",
    shortName: "9 Mukhi Rudraksha",
    price: 1299,
    stock: 40,
    deity: "Maa Durga (Nava Shakti)",
    planet: "Ketu (Southern Node)",
    bijaMantra: "Om Hreem Hum Namah",
    origin: "Nepal",
    size: "20–26 mm",
    certification: "Lab Certified Original",
    benefits: [
      "Invokes the nine forms of Maa Durga (Navadurga) for total protection",
      "Pacifies Ketu — removes mysterious illnesses and karmic blocks",
      "Bestows fearlessness, courage and inner strength (Shakti)",
      "Cures skin diseases, chronic ailments and unexplained pains",
      "Excellent for spiritual seekers walking the tantric or Shakta path",
    ],
    whoShouldWear: [
      "Women — gives protection of all 9 forms of Devi",
      "Anyone with strong Ketu mahadasha or Ketu dosh",
      "Those suffering from chronic skin or nervous system issues",
      "Tantric practitioners and Shakti upasakas",
    ],
    spiritualSignificance:
      "The 9 Mukhi Rudraksha embodies Maa Durga's nine forms (Shailputri to Siddhidatri). It is the bead of Shakti — granting fearlessness, energy and protection from all types of negativity.",
    shortDescription:
      "Authentic 9 Mukhi Rudraksha from Nepal — blessed by all nine forms of Maa Durga. Pacifies Ketu, grants fearlessness, and protects from negative energies.",
  },
  {
    mukhi: "10 Mukhi",
    imageSlug: "10-mukhi",
    name: "Vedic Tatva 10 Mukhi Rudraksha - Lord Vishnu Blessings | Powerful Protection | Original Nepal",
    shortName: "10 Mukhi Rudraksha",
    price: 1599,
    stock: 35,
    deity: "Lord Vishnu (Dasavatara)",
    planet: "Pacifies all 9 planets",
    bijaMantra: "Om Hreem Namah",
    origin: "Nepal",
    size: "22–28 mm",
    certification: "Lab Certified Original",
    benefits: [
      "Powerful shield against black magic, evil eye and negative energy",
      "Pacifies effects of all nine planets (Navagraha)",
      "Resolves court cases, legal disputes and prolonged conflicts",
      "Removes Vastu Dosh and negative vibrations from home",
      "Brings deep mental peace and protects from psychic attacks",
    ],
    whoShouldWear: [
      "Anyone fearing black magic, evil eye or psychic attack",
      "People involved in long legal disputes or court cases",
      "Those with multiple planetary doshas in kundli",
      "Anyone wanting an all-purpose protective shield",
    ],
    spiritualSignificance:
      "The 10 Mukhi Rudraksha embodies the ten avatars (Dasavatara) of Lord Vishnu. It is a complete protective armour that shields the wearer from every form of negative energy.",
    shortDescription:
      "Original 10 Mukhi Rudraksha from Nepal — blessed by Lord Vishnu's ten avatars. Powerful protection from black magic, evil eye, and resolves legal disputes.",
  },
  {
    mukhi: "11 Mukhi",
    imageSlug: "11-mukhi",
    name: "Vedic Tatva 11 Mukhi Rudraksha - Lord Hanuman Blessings | Original Nepal Bead | Lab Certified",
    shortName: "11 Mukhi Rudraksha",
    price: 2199,
    stock: 30,
    badge: "Premium",
    deity: "Lord Hanuman (11 Rudras)",
    planet: "Mars + Mercury",
    bijaMantra: "Om Hreem Hum Namah",
    origin: "Nepal",
    size: "22–28 mm",
    certification: "Lab Certified Original",
    benefits: [
      "Bestows the strength, courage and devotion of Lord Hanuman",
      "Sharpens intellect along with grants of physical stamina",
      "Excellent for sportspersons, athletes and fitness enthusiasts",
      "Develops fearlessness and spiritual willpower (tapas)",
      "Helps in success of bold ventures and difficult missions",
    ],
    whoShouldWear: [
      "Sportspersons, athletes, gym-goers and fitness enthusiasts",
      "Devotees of Lord Hanuman and Lord Rama",
      "People needing both physical and mental strength",
      "Those undertaking difficult missions or social work",
    ],
    spiritualSignificance:
      "The 11 Mukhi Rudraksha represents the 11 forms of Rudra (Ekadasha Rudra), with Lord Hanuman as the ruling deity. It grants supreme strength of body, mind and spirit.",
    shortDescription:
      "Genuine 11 Mukhi Rudraksha from Nepal — blessed by Lord Hanuman and 11 Rudras. Grants courage, physical strength, intellect and unwavering devotion.",
  },
  {
    mukhi: "12 Mukhi",
    imageSlug: "12-mukhi",
    name: "Vedic Tatva 12 Mukhi Rudraksha - Lord Surya Blessings | Original Nepal Bead | Lab Certified",
    shortName: "12 Mukhi Rudraksha",
    price: 3499,
    stock: 25,
    badge: "Premium",
    deity: "Lord Surya (Sun God)",
    planet: "Sun (Surya)",
    bijaMantra: "Om Krom Sroum Roum Namah",
    origin: "Nepal",
    size: "22–28 mm",
    certification: "Lab Certified Original",
    benefits: [
      "Bestows leadership qualities, charisma and authority of Surya Dev",
      "Improves vitality, immunity, eye-sight and bone strength",
      "Brings name, fame and government recognition",
      "Excellent for politicians, bureaucrats, doctors and administrators",
      "Removes fear, depression and restores radiant confidence",
    ],
    whoShouldWear: [
      "Politicians, government officers, IAS/IPS aspirants",
      "Doctors, administrators and authority figures",
      "People with weak Sun in kundli or low immunity",
      "Anyone seeking name, fame and influence",
    ],
    spiritualSignificance:
      "The 12 Mukhi Rudraksha represents the 12 forms of Lord Surya (Dwadasha Aditya). It bestows the radiance, brilliance and authority of the Sun himself.",
    shortDescription:
      "Authentic 12 Mukhi Rudraksha from Nepal — blessed by Lord Surya. Bestows leadership, authority, fame and the radiant power of the Sun.",
  },
  {
    mukhi: "13 Mukhi",
    imageSlug: "13-mukhi",
    name: "Vedic Tatva 13 Mukhi Rudraksha - Lord Indra Blessings | Wish-Fulfilling Bead | Original Nepal",
    shortName: "13 Mukhi Rudraksha",
    price: 5999,
    stock: 18,
    badge: "Rare",
    deity: "Lord Indra & Lord Kamadeva",
    planet: "Venus (Shukra)",
    bijaMantra: "Om Hreem Namah",
    origin: "Nepal",
    size: "22–28 mm",
    certification: "Lab Certified Original",
    benefits: [
      "Considered a wish-fulfilling (Kamya) bead — fulfils material desires",
      "Bestows attraction, charisma and persuasive power (vashikaran shakti)",
      "Excellent for people in sales, marketing, media and politics",
      "Brings royal luxuries, comforts and worldly enjoyments",
      "Strengthens Venus — improves love life and beauty",
    ],
    whoShouldWear: [
      "People in sales, marketing, public relations and politics",
      "Those seeking attraction, charm and influence",
      "Anyone wanting fulfilment of legitimate material desires",
      "Devotees of Indra and Kamadeva",
    ],
    spiritualSignificance:
      "The 13 Mukhi Rudraksha is blessed by Lord Indra (King of Devas) and Lord Kamadeva. It is the supreme wish-fulfilling Rudraksha, granting both spiritual elevation and material prosperity.",
    shortDescription:
      "Original 13 Mukhi Rudraksha from Nepal — blessed by Indra and Kamadeva. Wish-fulfilling bead that grants attraction, charisma and material prosperity.",
  },
  {
    mukhi: "14 Mukhi",
    imageSlug: "14-mukhi",
    name: "Vedic Tatva 14 Mukhi Rudraksha - Dev Mani | Lord Hanuman Blessings | Original Nepal | Rare",
    shortName: "14 Mukhi Rudraksha (Dev Mani)",
    price: 9999,
    stock: 12,
    badge: "Rare",
    deity: "Lord Hanuman (Devmani)",
    planet: "Saturn (Shani)",
    bijaMantra: "Om Namah",
    origin: "Nepal",
    size: "24–30 mm",
    certification: "Lab Certified Original",
    benefits: [
      "Awakens the third eye (Ajna chakra) — develops intuition and foresight",
      "Pacifies even the most malefic Saturn",
      "Considered the 'Dev Mani' — heavenly jewel — by ancient sages",
      "Helps in decision-making, sixth sense and prediction abilities",
      "Protects from accidents and gives victory in difficult situations",
    ],
    whoShouldWear: [
      "Astrologers, healers, intuitives and spiritual practitioners",
      "People in decision-making roles (judges, executives, leaders)",
      "Anyone with severe Saturn affliction or Sade Sati",
      "Sadhakas walking the path of higher consciousness",
    ],
    spiritualSignificance:
      "The 14 Mukhi Rudraksha is the rarest after the 1 Mukhi — known as the 'Dev Mani' (jewel of the gods). It directly emerged from the eyes of Lord Shiva and awakens the divine inner eye.",
    shortDescription:
      "Rare 14 Mukhi Rudraksha (Dev Mani) from Nepal — blessed by Lord Hanuman and Shiva. Awakens the third eye, pacifies Saturn and develops intuition.",
  },
  {
    mukhi: "Gauri Shankar",
    imageSlug: "gauri-shankar",
    name: "Vedic Tatva Gauri Shankar Rudraksha - Naturally Joined Twin Bead | Shiva-Parvati | Nepal Original",
    shortName: "Gauri Shankar Rudraksha",
    price: 3299,
    stock: 25,
    badge: "Rare",
    deity: "Shiva-Parvati (Gauri-Shankar)",
    planet: "Moon + Jupiter",
    bijaMantra: "Om Gauri Shankaraya Namah",
    origin: "Nepal",
    size: "30–38 mm (joined)",
    certification: "Lab Certified Naturally Joined",
    benefits: [
      "Naturally joined twin bead — symbol of perfect union of Shiva-Parvati",
      "Most powerful Rudraksha for love, marriage and family harmony",
      "Resolves marital discord, infidelity and misunderstandings",
      "Helps childless couples conceive — blessing of Maa Parvati",
      "Brings deep peace, balance and unconditional love into the home",
    ],
    whoShouldWear: [
      "Married couples seeking harmony and unbroken love",
      "Couples trying to conceive or facing marital issues",
      "Those wanting a soul-mate or life partner",
      "Anyone wishing to invoke the blessings of Shiva-Parvati",
    ],
    spiritualSignificance:
      "Gauri Shankar Rudraksha is two Rudraksha beads naturally joined together — an extremely rare and auspicious manifestation of Lord Shiva and Maa Parvati eternally united.",
    shortDescription:
      "Authentic naturally joined Gauri Shankar Rudraksha from Nepal — sacred symbol of Shiva-Parvati's eternal union. Most powerful for marital harmony, love and family bliss.",
  },
  {
    mukhi: "Ganesh",
    imageSlug: "ganesh",
    name: "Vedic Tatva Ganesh Rudraksha - Trunk-Faced Bead | Lord Ganesha Blessings | Nepal Original",
    shortName: "Ganesh Rudraksha",
    price: 1799,
    stock: 30,
    deity: "Lord Ganesha (Vighnaharta)",
    planet: "Ketu / Mercury",
    bijaMantra: "Om Gam Ganapataye Namah",
    origin: "Nepal",
    size: "22–28 mm",
    certification: "Lab Certified Original",
    benefits: [
      "Removes obstacles (Vighna) before they appear",
      "Brings success and auspicious beginnings to every endeavour",
      "Sharpens intellect, memory and analytical thinking",
      "Excellent for students and professionals at decision points",
      "Combines blessings of Lord Ganesha with the sacred Rudraksha shakti",
    ],
    whoShouldWear: [
      "Anyone starting a new business, job, education or relationship",
      "Devotees of Lord Ganesha",
      "Students taking competitive exams",
      "Professionals facing repeated obstacles",
    ],
    spiritualSignificance:
      "Ganesh Rudraksha has a natural protrusion resembling Lord Ganesha's trunk. It carries the dual blessings of Lord Shiva (Rudraksha) and Lord Ganesha (Vighnaharta).",
    shortDescription:
      "Original Ganesh Rudraksha from Nepal — features a natural elephant-trunk-like protrusion. Blessed by Lord Ganesha to remove obstacles and ensure success in every venture.",
  },
];

const BRAND = {
  maroon: "#6D2B35",
  maroonDark: "#4a1a22",
  gold: "#D4AF37",
  cream: "#FAFAF7",
  darkText: "#3a2a1a",
  mutedText: "#5a4a3a",
};

function buildAplusHtml(item: RudrakshaItem): string {
  const benefitsHtml = item.benefits
    .map(
      (b, i) =>
        `<div style="display:flex;align-items:flex-start;gap:14px;padding:14px;background:${BRAND.cream};border:1px solid ${BRAND.gold}33;border-radius:8px;">
          <div style="flex-shrink:0;width:36px;height:36px;border-radius:50%;background:${BRAND.gold};color:${BRAND.maroonDark};display:flex;align-items:center;justify-content:center;font-family:Georgia,serif;font-weight:bold;font-size:16px;">${i + 1}</div>
          <div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.55;color:${BRAND.darkText};">${b}</div>
        </div>`
    )
    .join("");

  const whoHtml = item.whoShouldWear
    .map(
      (w) =>
        `<li style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:${BRAND.darkText};margin-bottom:8px;padding-left:8px;">${w}</li>`
    )
    .join("");

  const specs: Array<[string, string]> = [
    ["Mukhi (Faces)", item.mukhi],
    ["Ruling Deity", item.deity],
    ["Ruling Planet", item.planet],
    ["Beej Mantra", item.bijaMantra],
    ["Origin", item.origin],
    ["Bead Size", item.size],
    ["Certification", item.certification],
    ["Material", "100% Original Rudraksha (Elaeocarpus Ganitrus)"],
    ["Energization", "Energised with Rudraksha Mantra by Vedic priests"],
    ["Stringing", "Premium red thread (free) | Silver/Gold cap (optional)"],
  ];
  const specsHtml = specs
    .map(
      ([k, v], i) => `
        <tr style="background:${i % 2 === 0 ? BRAND.cream : "#fff"};">
          <td style="padding:12px 16px;font-family:Georgia,serif;font-weight:bold;color:${BRAND.maroon};border-bottom:1px solid ${BRAND.gold}22;width:38%;font-size:14px;">${k}</td>
          <td style="padding:12px 16px;font-family:Arial,sans-serif;color:${BRAND.darkText};border-bottom:1px solid ${BRAND.gold}22;font-size:14px;">${v}</td>
        </tr>`
    )
    .join("");

  return `
<div style="max-width:980px;margin:0 auto;background:#fff;font-family:Arial,sans-serif;color:${BRAND.darkText};">

  <div style="background:linear-gradient(135deg,${BRAND.maroon} 0%,${BRAND.maroonDark} 100%);padding:48px 24px;text-align:center;border-radius:12px 12px 0 0;">
    <div style="display:inline-block;padding:6px 18px;border:1px solid ${BRAND.gold};border-radius:999px;color:${BRAND.gold};font-family:Arial,sans-serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;margin-bottom:18px;">Lab Certified · Energised · Original</div>
    <h1 style="font-family:Georgia,serif;color:#fff;font-size:34px;margin:0 0 12px;line-height:1.25;font-weight:normal;">${item.shortName}</h1>
    <div style="width:80px;height:2px;background:${BRAND.gold};margin:14px auto;"></div>
    <p style="color:#f3e9d2;font-family:Georgia,serif;font-style:italic;font-size:16px;max-width:680px;margin:0 auto;line-height:1.6;">${item.spiritualSignificance}</p>
  </div>

  <div style="padding:36px 24px;background:#fff;">
    <h2 style="font-family:Georgia,serif;color:${BRAND.maroon};font-size:24px;text-align:center;margin:0 0 28px;font-weight:normal;">Spiritual Benefits</h2>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:14px;">${benefitsHtml}</div>
  </div>

  <div style="padding:36px 24px;background:${BRAND.cream};">
    <h2 style="font-family:Georgia,serif;color:${BRAND.maroon};font-size:24px;text-align:center;margin:0 0 24px;font-weight:normal;">Who Should Wear This Rudraksha?</h2>
    <div style="max-width:780px;margin:0 auto;background:#fff;border-left:4px solid ${BRAND.gold};border-radius:0 8px 8px 0;padding:24px 28px;">
      <ul style="margin:0;padding-left:20px;">${whoHtml}</ul>
    </div>
  </div>

  <div style="padding:36px 24px;background:#fff;">
    <h2 style="font-family:Georgia,serif;color:${BRAND.maroon};font-size:24px;text-align:center;margin:0 0 24px;font-weight:normal;">Vedic Significance &amp; Mantra</h2>
    <div style="max-width:780px;margin:0 auto;display:grid;grid-template-columns:1fr 1.4fr;gap:28px;align-items:center;">
      <div style="background:linear-gradient(180deg,${BRAND.maroon},${BRAND.maroonDark});color:#fff;padding:32px 20px;text-align:center;border-radius:8px;">
        <div style="font-family:Georgia,serif;font-size:11px;letter-spacing:2px;color:${BRAND.gold};margin-bottom:10px;">BEEJ MANTRA</div>
        <div style="font-family:Georgia,serif;font-style:italic;font-size:22px;line-height:1.5;color:#fff;">${item.bijaMantra}</div>
        <div style="margin-top:18px;font-size:11px;color:#f3e9d2;">Chant 108 times daily</div>
      </div>
      <div>
        <p style="font-family:Arial,sans-serif;font-size:14px;line-height:1.7;color:${BRAND.mutedText};margin:0 0 12px;">According to ancient Vedic scriptures (Shiva Purana, Padma Purana and Rudraksha Jabala Upanishad), the ${item.shortName} is one of the most sacred beads on earth. Worn properly with the prescribed mantra, it transforms the wearer's energy field within 21 days of regular use.</p>
        <p style="font-family:Arial,sans-serif;font-size:14px;line-height:1.7;color:${BRAND.mutedText};margin:0;">Ruled by <b style="color:${BRAND.maroon};">${item.deity}</b> and the planet <b style="color:${BRAND.maroon};">${item.planet}</b>, this Rudraksha is best worn on a Monday morning after a proper energisation puja with Panchamrit.</p>
      </div>
    </div>
  </div>

  <div style="padding:36px 24px;background:${BRAND.cream};">
    <h2 style="font-family:Georgia,serif;color:${BRAND.maroon};font-size:24px;text-align:center;margin:0 0 24px;font-weight:normal;">Product Specifications</h2>
    <table style="max-width:780px;margin:0 auto;border-collapse:collapse;width:100%;border:1px solid ${BRAND.gold}33;border-radius:8px;overflow:hidden;">
      ${specsHtml}
    </table>
  </div>

  <div style="padding:36px 24px;background:#fff;">
    <h2 style="font-family:Georgia,serif;color:${BRAND.maroon};font-size:24px;text-align:center;margin:0 0 24px;font-weight:normal;">How to Wear &amp; Energise</h2>
    <div style="max-width:780px;margin:0 auto;background:${BRAND.cream};border-left:4px solid ${BRAND.gold};padding:24px 28px;border-radius:0 8px 8px 0;">
      ${["Take a bath early morning on Monday and sit facing east in a clean place.",
         "Place the Rudraksha on a copper plate. Offer Panchamrit (milk, curd, ghee, honey, sugar).",
         "Sprinkle Ganga jal and chant the beej mantra <b>" + item.bijaMantra + "</b> 108 times.",
         "String it in red thread, silver chain or gold and wear around the neck or wrist.",
         "Avoid wearing while sleeping with partner, in toilet or during shraddha. Re-energise every 6 months."]
        .map((step, i) => `<div style="display:flex;align-items:flex-start;gap:14px;margin-bottom:14px;">
          <div style="flex-shrink:0;width:28px;height:28px;border-radius:50%;background:${BRAND.gold};color:${BRAND.maroonDark};display:flex;align-items:center;justify-content:center;font-family:Georgia,serif;font-weight:bold;font-size:13px;">${i + 1}</div>
          <div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.65;color:${BRAND.darkText};padding-top:3px;">${step}</div>
        </div>`).join("")}
    </div>
  </div>

  <div style="padding:36px 24px;background:linear-gradient(135deg,${BRAND.maroon} 0%,${BRAND.maroonDark} 100%);border-radius:0 0 12px 12px;">
    <h2 style="font-family:Georgia,serif;color:#fff;font-size:22px;text-align:center;margin:0 0 28px;font-weight:normal;">Why Choose Vedic Tatva</h2>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:18px;max-width:880px;margin:0 auto;">
      ${[
        ["100% Authentic", "Every Rudraksha is sourced directly from Nepal/Indonesia and lab-verified."],
        ["Energised & Blessed", "Each bead is energised by Vedic priests with proper mantras and Panchamrit."],
        ["Free Replacement", "If your bead does not feel right within 7 days, we replace it free."],
      ]
        .map(
          ([h, d]) =>
            `<div style="background:rgba(255,255,255,0.06);border-top:2px solid ${BRAND.gold};padding:20px 18px;border-radius:6px;text-align:center;">
              <h3 style="font-family:Georgia,serif;color:${BRAND.gold};font-size:16px;margin:0 0 10px;">${h}</h3>
              <p style="font-family:Arial,sans-serif;font-size:13px;color:#f3e9d2;line-height:1.55;margin:0;">${d}</p>
            </div>`
        )
        .join("")}
    </div>
  </div>

</div>`.trim();
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function seedRudrakshaProducts() {
  // Idempotent check — only seed if no rudraksha products exist
  const existing = await db
    .select()
    .from(products)
    .where(eq(products.category, "Rudraksha"));

  if (existing.length >= ITEMS.length) {
    return;
  }

  // If some exist but not all, skip — don't duplicate
  if (existing.length > 0) {
    console.log(`Rudraksha: ${existing.length} products already exist. Skipping seed.`);
    return;
  }

  console.log(`Seeding ${ITEMS.length} Rudraksha products...`);

  const rows = ITEMS.map((item) => {
    const slug = `${slugify(item.shortName)}-original-nepal`;
    const richDescription = buildAplusHtml(item);

    const description =
      `<p><b>${item.shortName}</b> — ${item.shortDescription}</p>` +
      `<p><b>Ruling Deity:</b> ${item.deity} &nbsp; | &nbsp; <b>Ruling Planet:</b> ${item.planet} &nbsp; | &nbsp; <b>Beej Mantra:</b> <i>${item.bijaMantra}</i></p>` +
      `<p>${item.spiritualSignificance}</p>`;

    return {
      name: item.name,
      description,
      price: item.price,
      stock: item.stock,
      category: "Rudraksha",
      image: `/attached_assets/rudraksha/${item.imageSlug}.png`,
      images: [`/attached_assets/rudraksha/${item.imageSlug}.png`],
      badge: item.badge ?? "New",
      salesCount: 0,
      highlights: item.benefits.slice(0, 5),
      features: [
        `Mukhi: ${item.mukhi}`,
        `Deity: ${item.deity}`,
        `Planet: ${item.planet}`,
        `Mantra: ${item.bijaMantra}`,
        `Origin: ${item.origin}`,
        `Size: ${item.size}`,
        `Certification: ${item.certification}`,
      ],
      richDescription,
      aplusEnabled: true,
      slug,
      gstPercent: 18,
      hsnCode: "71171910",
      productType: "product",
    };
  });

  await db.insert(products).values(rows);
  console.log(`Rudraksha: seeded ${rows.length} products successfully.`);
}

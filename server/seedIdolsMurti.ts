import { db } from "./db";
import { products } from "@shared/schema";
import { eq, sql } from "drizzle-orm";

const IDOL_IMAGE = "/attached_assets/category_cards/idols.png";
const IDOL_IMG_DIR = "/attached_assets/generated_images/idols";
function imgFor(key: string) {
  return `${IDOL_IMG_DIR}/${key}.png`;
}

type Deity = {
  key: string;
  name: string;
  shortName: string;
  blurb: string;
  benefits: string[];
  placement: string;
  bijMantra: string;
};

const DEITIES: Deity[] = [
  {
    key: "ganesh",
    name: "Ganesh (Ganpati)",
    shortName: "Ganesh Ji",
    blurb:
      "Lord Ganesha — the remover of obstacles and patron of new beginnings — invoked first in every Hindu puja, business launch, griha pravesh and auspicious occasion.",
    benefits: [
      "Removes obstacles from work, study and relationships",
      "Brings buddhi (wisdom), siddhi (success) and riddhi (prosperity)",
      "Auspicious for griha pravesh, vahan puja and business openings",
    ],
    placement: "Place facing the entrance or at the centre of your home mandir.",
    bijMantra: "Om Gan Ganapataye Namaha",
  },
  {
    key: "lakshmi",
    name: "Lakshmi (Mahalakshmi)",
    shortName: "Lakshmi Mata",
    blurb:
      "Goddess Mahalakshmi — bestower of dhan (wealth), dhanya (food), saubhagya (good fortune) and grace. Worshipped daily and especially on Friday, Diwali and Akshaya Tritiya.",
    benefits: [
      "Invites prosperity, abundance and financial stability",
      "Removes daridrata (poverty) and brings saubhagya",
      "Essential for Diwali, Vaibhav Lakshmi vrat and Friday puja",
    ],
    placement: "Place in the north-east corner of the home, beside Ganesha.",
    bijMantra: "Om Shreem Mahalakshmiyei Namaha",
  },
  {
    key: "saraswati",
    name: "Saraswati (Maa Sharada)",
    shortName: "Saraswati Mata",
    blurb:
      "Goddess Saraswati — devi of vidya (knowledge), kala (arts), sangeet (music) and vaani (speech). Worshipped on Vasant Panchami and by students, artists and scholars.",
    benefits: [
      "Sharpens memory, focus and academic performance",
      "Blessings for music, dance, writing and the arts",
      "Ideal gift for students preparing for exams",
    ],
    placement: "Place in the study room or pooja altar facing east.",
    bijMantra: "Om Aim Saraswatyai Namaha",
  },
  {
    key: "durga",
    name: "Durga (Maa Durga)",
    shortName: "Durga Mata",
    blurb:
      "Maa Durga — the divine mother who slays evil and protects her devotees. Central deity of Navratri and Durga Puja, riding the lion with weapons of all the gods in her ten hands.",
    benefits: [
      "Powerful protection from negativity and enemies",
      "Strength, courage and victory in difficult situations",
      "Essential murti for Navratri and Sharad Navratri puja",
    ],
    placement: "Place facing east or north in your home mandir.",
    bijMantra: "Om Aim Hreem Kleem Chamundayai Vichche",
  },
  {
    key: "krishna",
    name: "Bal Krishna (Laddu Gopal)",
    shortName: "Bal Krishna",
    blurb:
      "Bal Krishna — the most beloved childhood form of Lord Krishna, also worshipped as Laddu Gopal. Cared for daily with shringar, bhog and sleep rituals across Hindu homes.",
    benefits: [
      "Brings joy, love, family harmony and santaan-prapti",
      "Auspicious for Janmashtami, Govardhan Puja and daily seva",
      "Pairs beautifully with Vastra (Poshak) for shringar",
    ],
    placement: "Place on a wooden chowki in the home mandir for daily seva.",
    bijMantra: "Om Kleem Krishnaya Namaha",
  },
  {
    key: "radha-krishna",
    name: "Radha Krishna (Yugal Sarkar)",
    shortName: "Radha Krishna",
    blurb:
      "Radha-Krishna joint murti — the eternal symbol of pure, divine love (prem). Together they represent the soul (Radha) and the supreme (Krishna) united in bhakti.",
    benefits: [
      "Brings love, harmony and devotion in marital life",
      "Strengthens relationships and emotional bonding",
      "Auspicious gift for newly-weds and anniversaries",
    ],
    placement: "Place in the bedroom or home mandir facing east.",
    bijMantra: "Om Hreem Shreem Radha Krishnaya Namaha",
  },
  {
    key: "shiva",
    name: "Shiva (Mahadev / Shankar)",
    shortName: "Shiv Ji",
    blurb:
      "Lord Shiva — Mahadev, the Auspicious One, the destroyer of ego and granter of moksha. Depicted in dhyan mudra with trident, damaru, snake and crescent moon.",
    benefits: [
      "Inner peace, fearlessness and spiritual awakening",
      "Removes negativity, fear and karmic burdens",
      "Essential for Mondays, Mahashivratri and Sawan puja",
    ],
    placement: "Place facing north or north-east in the mandir.",
    bijMantra: "Om Namah Shivaya",
  },
  {
    key: "hanuman",
    name: "Hanuman (Bajrangbali)",
    shortName: "Hanuman Ji",
    blurb:
      "Lord Hanuman — Bajrangbali, the embodiment of bhakti, strength, courage and selfless service. Worshipped on Tuesdays and Saturdays for protection and victory.",
    benefits: [
      "Powerful shield against negative energies and shani dosha",
      "Strength, stamina, courage and confidence",
      "Auspicious on Tuesdays, Saturdays and Hanuman Jayanti",
    ],
    placement: "Place facing north or north-east, ideally near the entrance.",
    bijMantra: "Om Hum Hanumate Namaha",
  },
  {
    key: "ram",
    name: "Lord Ram (Maryada Purushottam)",
    shortName: "Ram Ji",
    blurb:
      "Lord Ram — Maryada Purushottam, the seventh avatar of Vishnu, the embodiment of dharma, truth and ideal kingship as immortalised in the Ramayana.",
    benefits: [
      "Cultivates dharma, integrity and moral strength",
      "Brings peace, righteousness and family harmony",
      "Auspicious for Ram Navami and daily Ramcharitmanas paath",
    ],
    placement: "Place in the mandir facing east or north.",
    bijMantra: "Om Ramaya Namaha",
  },
  {
    key: "vishnu",
    name: "Vishnu (Lakshmi Narayan)",
    shortName: "Vishnu Bhagwan",
    blurb:
      "Lord Vishnu — the preserver of the universe, depicted with shankha, chakra, gada and padma in his four hands, reclining on Sheshnag with Lakshmi at his feet.",
    benefits: [
      "Protection, preservation and continuity of family",
      "Wealth, well-being and dharmic prosperity",
      "Essential for Ekadashi, Vaikuntha Chaturdashi and Satyanarayan katha",
    ],
    placement: "Place in the mandir facing east.",
    bijMantra: "Om Namo Bhagavate Vasudevaya",
  },
  {
    key: "kuber",
    name: "Kuber (Lord of Wealth)",
    shortName: "Kuber Ji",
    blurb:
      "Lord Kuber — the cosmic treasurer and king of yakshas, guardian of the north direction. Worshipped alongside Lakshmi for sustained wealth and financial growth.",
    benefits: [
      "Attracts new income sources and locked wealth",
      "Powerful for Diwali, Dhanteras and Kuber yantra puja",
      "Ideal in cash boxes, lockers and business desks",
    ],
    placement: "Place in the north direction of the home or office.",
    bijMantra: "Om Yakshaya Kuberaya Vaishravanaya Dhana Dhanyadi Padayeh",
  },
  {
    key: "surya",
    name: "Surya Bhagwan (Sun God)",
    shortName: "Surya Dev",
    blurb:
      "Surya Dev — the visible god, source of all life, light and energy. Depicted on a chariot drawn by seven horses. Worshipped at sunrise with Surya Arghya and Gayatri Mantra.",
    benefits: [
      "Boosts vitality, immunity and ojas (life energy)",
      "Strengthens Surya in horoscope; helps career & father karak",
      "Essential for Chhath, Ratha Saptami and Sunday puja",
    ],
    placement: "Place facing east; ideal near a window receiving sunrise.",
    bijMantra: "Om Hraam Hreem Hraum Sah Suryaya Namaha",
  },
  {
    key: "kartikeya",
    name: "Kartikeya (Murugan / Skanda)",
    shortName: "Kartikeya",
    blurb:
      "Lord Kartikeya — son of Shiva and Parvati, commander of the divine army, holder of the vel (divine spear). Worshipped as Murugan in the south and Skanda across India.",
    benefits: [
      "Victory over enemies and obstacles",
      "Courage, leadership and military / sports success",
      "Essential for Skanda Sashti and Tamil families",
    ],
    placement: "Place facing east or south in the mandir.",
    bijMantra: "Om Saravanabhavaya Namaha",
  },
  {
    key: "parvati",
    name: "Parvati (Gauri Mata)",
    shortName: "Parvati Mata",
    blurb:
      "Maa Parvati — the divine consort of Shiva, also worshipped as Gauri, Uma and Adishakti. The ideal of devoted wifehood, motherhood and shakti.",
    benefits: [
      "Marital harmony, ideal life partner (mangalya)",
      "Strength, fertility and family well-being",
      "Essential for Hartalika Teej, Gangaur and Sawan puja",
    ],
    placement: "Place beside Shiva in the home mandir.",
    bijMantra: "Om Hreem Parvatyai Namaha",
  },
  {
    key: "kali",
    name: "Maa Kali (Mahakali)",
    shortName: "Kali Mata",
    blurb:
      "Maa Kali — the fierce form of Adishakti who destroys ego, ignorance and evil. Worshipped intensely in Bengal, Assam and by sadhakas for moksha and protection.",
    benefits: [
      "Annihilates negativity, black magic and inner demons",
      "Powerful protection during difficult life phases",
      "Essential for Kali Puja, Diwali night and tantric sadhana",
    ],
    placement: "Place in a separate niche or south-facing mandir.",
    bijMantra: "Om Kreem Kalikayai Namaha",
  },
  {
    key: "annapurna",
    name: "Maa Annapurna",
    shortName: "Annapurna Devi",
    blurb:
      "Maa Annapurna — the goddess of nourishment and food, a form of Parvati who feeds the entire universe. Worshipped especially in Kashi (Varanasi) and in every Indian kitchen.",
    benefits: [
      "Ensures the home never lacks food (anna) or grain",
      "Auspicious for newly-built kitchens & Akshaya Tritiya",
      "Brings poshan (nourishment) and family well-being",
    ],
    placement: "Place in the kitchen or dining area facing east.",
    bijMantra: "Om Hreem Shreem Annapurnayai Namaha",
  },
  {
    key: "tirupati-balaji",
    name: "Tirupati Balaji (Venkateshwara)",
    shortName: "Balaji",
    blurb:
      "Lord Venkateshwara — the most worshipped form of Vishnu at Tirumala, granter of wishes and remover of debts (rin mochan). The richest deity in the world, worshipped by millions daily.",
    benefits: [
      "Removes loans, debts and financial burdens",
      "Fulfils sankalpa (deep wishes) and vows",
      "Auspicious for Vaikunta Ekadashi and Saturday darshan",
    ],
    placement: "Place facing east in the home mandir.",
    bijMantra: "Om Namo Venkatesaya",
  },
  {
    key: "sai-baba",
    name: "Shirdi Sai Baba",
    shortName: "Sai Baba",
    blurb:
      "Shirdi Sai Baba — the beloved 19th-century saint of Shirdi who taught 'Sabka Maalik Ek'. Worshipped across India for unconditional love, protection and miraculous grace.",
    benefits: [
      "Brings shanti (peace) and faith (shraddha & saburi)",
      "Auspicious for Thursday puja and Sai vrat",
      "Loved as a daily companion in family mandirs",
    ],
    placement: "Place in the mandir at eye level facing east or north.",
    bijMantra: "Om Sai Ram",
  },
  {
    key: "nandi",
    name: "Nandi (Shiva's Bull)",
    shortName: "Nandi",
    blurb:
      "Nandi — the divine bull and eternal vahana of Lord Shiva, guardian of every Shiva temple. Whispering a wish into Nandi's ear is said to carry it directly to Mahadev.",
    benefits: [
      "Strengthens Shiva worship and Sawan rituals",
      "Symbol of dharma, strength and unwavering devotion",
      "Auspicious paired with a Shiv Linga or Shiva idol",
    ],
    placement: "Place facing the Shiva idol or Shivling.",
    bijMantra: "Om Nandikeshwaraya Namaha",
  },
  {
    key: "garuda",
    name: "Garuda (Vishnu's Vahana)",
    shortName: "Garuda",
    blurb:
      "Garuda — the mighty eagle-king and eternal vahana of Lord Vishnu. Worshipped for protection from sarpa dosha (snake-related afflictions), poisons and enemies.",
    benefits: [
      "Powerful protection from sarpa dosha and rahu effects",
      "Removes fear, enemies and toxic influences",
      "Essential beside Vishnu and Venkateshwara murtis",
    ],
    placement: "Place in front of or beside Vishnu in the mandir.",
    bijMantra: "Om Garudaya Namaha",
  },
  {
    key: "dattatreya",
    name: "Bhagwan Dattatreya",
    shortName: "Datta Guru",
    blurb:
      "Bhagwan Dattatreya — the unified form of Brahma, Vishnu and Mahesh. The Adi Guru of all yogis and sadhakas, worshipped especially in Maharashtra and Karnataka.",
    benefits: [
      "Spiritual guidance, guru kripa and inner awakening",
      "Removes severe karmic obstacles",
      "Essential for Datta Jayanti and Thursday puja",
    ],
    placement: "Place in the mandir or sadhana room facing east.",
    bijMantra: "Om Drim Datta Treyaya Namaha",
  },
];

type SetItem = {
  key: string;
  name: string;
  shortName: string;
  blurb: string;
  benefits: string[];
  placement: string;
  brassPrice: number;
  brassMrp: number;
  silverPrice: number;
  silverMrp: number;
  clayPrice: number;
  clayMrp: number;
};

const SETS: SetItem[] = [
  {
    key: "shiv-mahaparivar-set",
    name: "Shiv Mahaparivar Set (Shiva, Parvati, Ganesh, Kartikeya, Nandi)",
    shortName: "Shiv Mahaparivar",
    blurb:
      "The complete divine family of Lord Shiva — Mahadev with Maa Parvati, Lord Ganesh, Lord Kartikeya and Nandi together as one auspicious set. The ultimate symbol of Hindu family unity, dharma and shakti.",
    benefits: [
      "Brings peace, harmony and unity to the entire family",
      "Auspicious for Mahashivratri, Sawan and Shravan Somvar",
      "Powerful presence in any home or temple mandir",
      "Ideal for griha pravesh and family puja",
    ],
    placement: "Place at the centre of the home mandir facing east or north.",
    brassPrice: 2499,
    brassMrp: 3999,
    silverPrice: 8999,
    silverMrp: 12999,
    clayPrice: 699,
    clayMrp: 1099,
  },
  {
    key: "laxmi-ganesh-set",
    name: "Laxmi Ganesh Set (Mahalakshmi & Ganpati Together)",
    shortName: "Laxmi Ganesh",
    blurb:
      "The classic Laxmi-Ganesh joint set worshipped on Diwali night for wealth (Lakshmi) and the wisdom to grow it (Ganesh). The most auspicious idol pair to keep in any home, shop or office.",
    benefits: [
      "Combined blessings of dhan (wealth) and buddhi (wisdom)",
      "The mandatory murti pair for Diwali Lakshmi Puja",
      "Auspicious in shops, offices and lockers",
      "Symbol of complete prosperity & success",
    ],
    placement: "Place in the north-east of the home, shop or office.",
    brassPrice: 1299,
    brassMrp: 1999,
    silverPrice: 4499,
    silverMrp: 6499,
    clayPrice: 399,
    clayMrp: 699,
  },
];

const BRASS_PRICE = 699;
const BRASS_MRP = 999;
const SILVER_PRICE = 2499;
const SILVER_MRP = 3499;
const CLAY_PRICE = 199;
const CLAY_MRP = 349;

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function buildRichDescription(opts: {
  name: string;
  blurb: string;
  benefits: string[];
  placement: string;
  bijMantra?: string;
  size: string;
  isSet?: boolean;
  brassPrice: number;
  silverPrice: number;
  clayPrice: number;
}) {
  const { name, blurb, benefits, placement, bijMantra, size, isSet, brassPrice, silverPrice, clayPrice } = opts;

  return [
    `<h3>${name}</h3>`,
    `<p>${blurb}</p>`,
    `<h4>Choose your material</h4>`,
    `<ul>`,
    `<li><b>Pure Brass</b> — ₹${brassPrice.toLocaleString()} · classic antique-gold finish, develops a beautiful patina over time</li>`,
    `<li><b>92.5 Hallmarked Silver</b> — ₹${silverPrice.toLocaleString()} · mirror-polished, finest finish, best for daily abhishek & gifting</li>`,
    `<li><b>Pure Clay (Mitti)</b> — ₹${clayPrice.toLocaleString()} · eco-friendly handcrafted terracotta, ideal for festival puja & visarjan</li>`,
    `</ul>`,
    `<h4>Why devotees love this murti</h4>`,
    `<ul>`,
    ...benefits.map((b) => `<li>${b}</li>`),
    `</ul>`,
    `<h4>Craftsmanship</h4>`,
    `<p>Hand-finished by skilled Indian artisans following traditional shilpa-shastra proportions. Each murti is individually inspected for clarity of features, smooth finish and balanced posture before dispatch.</p>`,
    `<h4>Specifications</h4>`,
    `<ul>`,
    `<li>Approximate height: ${size}</li>`,
    `<li>Materials available: Brass · Silver (92.5 hallmark) · Pure clay (mitti)</li>`,
    `<li>Suitable for: Home mandir, office, gifting, vahan puja${isSet ? ", griha pravesh" : ""}</li>`,
    `<li>Brand: Vedic Tatva</li>`,
    `</ul>`,
    `<h4>Where to place</h4>`,
    `<p>${placement}</p>`,
    bijMantra
      ? `<h4>Beej Mantra</h4><p><b>${bijMantra}</b> — chant 11, 21 or 108 times daily before the murti for best results.</p>`
      : "",
    `<h4>Care instructions</h4>`,
    `<ul>`,
    `<li><b>Brass:</b> Wipe with a dry cotton cloth after puja. Restore shine with lemon-and-tamarind paste.</li>`,
    `<li><b>Silver:</b> Use a soft silver-cleaning cloth. Avoid harsh chemicals; periodically polish with mild silver polish.</li>`,
    `<li><b>Clay:</b> Wipe gently with a dry cloth. Keep away from water for long-term display murtis.</li>`,
    `</ul>`,
    `<h4>Vedic Tatva promise</h4>`,
    `<ul>`,
    `<li>Energised murti — every idol is offered to a pandit before dispatch</li>`,
    `<li>Safe & secure packaging — free replacement on transit damage</li>`,
    `<li>Pan-India shipping with tracking</li>`,
    `<li>Easy returns within 7 days for unused, sealed items</li>`,
    `</ul>`,
  ].filter(Boolean).join("\n");
}

async function upsert(values: any) {
  const existing = await db
    .select()
    .from(products)
    .where(eq(products.slug, values.slug))
    .limit(1);
  if (existing.length > 0) {
    await db.update(products).set(values).where(eq(products.slug, values.slug));
    return "updated";
  }
  await db.insert(products).values(values);
  return "inserted";
}

export async function seedIdolsMurti() {
  // Clean up old separate Brass-/Silver-Idol products from previous runs
  await db.execute(sql`DELETE FROM products WHERE category IN ('Brass Idols', 'Silver Idols')`);

  let inserted = 0;
  let updated = 0;

  for (const d of DEITIES) {
    const name = `${d.name} Idol - 1.5 Inch (Brass · Silver · Pure Clay)`;
    const slug = slugify(`${d.key}-idol-1-5-inch`);
    const variations = [
      { label: "Pure Brass", price: BRASS_PRICE },
      { label: "92.5 Silver (Hallmarked)", price: SILVER_PRICE },
      { label: "Pure Clay (Mitti)", price: CLAY_PRICE },
    ];
    const rich = buildRichDescription({
      name,
      blurb: d.blurb,
      benefits: d.benefits,
      placement: d.placement,
      bijMantra: d.bijMantra,
      size: "1.5 inch",
      brassPrice: BRASS_PRICE,
      silverPrice: SILVER_PRICE,
      clayPrice: CLAY_PRICE,
    });
    const r = await upsert({
      name,
      description: `${d.shortName} 1.5 inch handcrafted idol available in three materials — pure brass, 92.5 hallmarked silver and pure clay (mitti). ${d.blurb}`,
      price: CLAY_PRICE,
      mrp: BRASS_MRP,
      stock: 60,
      category: "Idols",
      image: imgFor(d.key),
      images: [imgFor(d.key)],
      imageAlts: [`${d.shortName} 1.5 inch idol — brass, silver and clay options`],
      highlights: [
        "Three materials: Brass · Silver · Pure clay",
        "1.5 inch — perfect for home mandir, car & gifting",
        "Hand-finished by skilled Indian artisans",
        "Energised before dispatch",
        ...d.benefits.slice(0, 2),
      ],
      features: [
        "Materials: Brass · 92.5 Silver · Pure clay (mitti)",
        "Height: 1.5 inch",
        "Brand: Vedic Tatva",
      ],
      richDescription: rich,
      aplusEnabled: true,
      slug,
      brand: "Vedic Tatva",
      gstPercent: 12,
      hsnCode: "8306",
      productType: "product",
      badge: "A+",
      variations: JSON.stringify(variations),
    });
    if (r === "inserted") inserted++; else updated++;
  }

  for (const s of SETS) {
    const name = `${s.name} - Brass · Silver · Pure Clay Options`;
    const slug = slugify(s.key);
    const variations = [
      { label: "Pure Brass", price: s.brassPrice },
      { label: "92.5 Silver (Hallmarked)", price: s.silverPrice },
      { label: "Pure Clay (Mitti)", price: s.clayPrice },
    ];
    const rich = buildRichDescription({
      name,
      blurb: s.blurb,
      benefits: s.benefits,
      placement: s.placement,
      size: "1.5 - 3 inch (set)",
      isSet: true,
      brassPrice: s.brassPrice,
      silverPrice: s.silverPrice,
      clayPrice: s.clayPrice,
    });
    const r = await upsert({
      name,
      description: `${s.shortName} complete idol set available in three materials — pure brass, 92.5 hallmarked silver and pure clay (mitti). ${s.blurb}`,
      price: s.clayPrice,
      mrp: s.brassMrp,
      stock: 40,
      category: "Idols",
      image: imgFor(s.key),
      images: [imgFor(s.key)],
      imageAlts: [`${s.shortName} idol set — brass, silver and clay options`],
      highlights: [
        "Complete idol set — Brass · Silver · Pure clay",
        "Hand-finished by skilled Indian artisans",
        "Energised before dispatch",
        ...s.benefits.slice(0, 2),
      ],
      features: [
        "Materials: Brass · 92.5 Silver · Pure clay (mitti)",
        "Set sizes: 1.5 to 3 inch",
        "Brand: Vedic Tatva",
      ],
      richDescription: rich,
      aplusEnabled: true,
      slug,
      brand: "Vedic Tatva",
      gstPercent: 12,
      hsnCode: "8306",
      productType: "product",
      badge: "Set · A+",
      variations: JSON.stringify(variations),
    });
    if (r === "inserted") inserted++; else updated++;
  }

  console.log(
    `Idols seed: ${inserted} inserted, ${updated} updated. Total deities: ${DEITIES.length}, sets: ${SETS.length}.`
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seedIdolsMurti()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

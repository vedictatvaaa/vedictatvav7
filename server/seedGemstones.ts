import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { db } from "./db";
import { products } from "@shared/schema";
import { eq } from "drizzle-orm";

type Gemstone = {
  slug: string;
  name: string;
  stone: string;
  planet: string;
  color: string;
  accent: string;
  price: number;
  substitutes?: string;
};

// A practical loose-stone catalogue: the first nine are the traditional
// Navagraha stones; the remainder are commonly considered alternatives or
// related Vedic stones. Descriptions intentionally do not make suitability,
// treatment, provenance, health, or outcome claims.
const ITEMS: Gemstone[] = [
  { slug: "vedic-tatva-ruby-loose-gemstone", name: "Vedic Tatva Ruby Loose Gemstone", stone: "Ruby", planet: "Sun (Surya)", color: "#9d263b", accent: "#f2b6bd", price: 2200, substitutes: "Red Spinel and Red Garnet are often considered for a traditional consultation." },
  { slug: "vedic-tatva-pearl-loose-gemstone", name: "Vedic Tatva Pearl Loose Gemstone", stone: "Pearl", planet: "Moon (Chandra)", color: "#e8e1d1", accent: "#fff9ea", price: 950, substitutes: "Moonstone is a commonly discussed alternative." },
  { slug: "vedic-tatva-red-coral-loose-gemstone", name: "Vedic Tatva Red Coral Loose Gemstone", stone: "Red Coral", planet: "Mars (Mangal)", color: "#c64a3c", accent: "#ffd0b9", price: 1200, substitutes: "Carnelian is often discussed as a practical alternative." },
  { slug: "vedic-tatva-emerald-loose-gemstone", name: "Vedic Tatva Emerald Loose Gemstone", stone: "Emerald", planet: "Mercury (Budha)", color: "#24765c", accent: "#b6ead5", price: 2500, substitutes: "Green Onyx and Peridot are commonly considered alternatives." },
  { slug: "vedic-tatva-yellow-sapphire-loose-gemstone", name: "Vedic Tatva Yellow Sapphire Loose Gemstone", stone: "Yellow Sapphire", planet: "Jupiter (Guru)", color: "#bd8519", accent: "#ffe5a1", price: 2400, substitutes: "Citrine and Yellow Topaz are often considered alternatives." },
  { slug: "vedic-tatva-diamond-loose-gemstone", name: "Vedic Tatva Diamond Loose Gemstone", stone: "Diamond", planet: "Venus (Shukra)", color: "#a8c8d3", accent: "#f4fdff", price: 3200, substitutes: "White Sapphire and White Zircon are commonly discussed alternatives." },
  { slug: "vedic-tatva-blue-sapphire-loose-gemstone", name: "Vedic Tatva Blue Sapphire Loose Gemstone", stone: "Blue Sapphire", planet: "Saturn (Shani)", color: "#234b97", accent: "#bad6ff", price: 2600, substitutes: "Iolite and Amethyst are often considered alternatives." },
  { slug: "vedic-tatva-hessonite-loose-gemstone", name: "Vedic Tatva Hessonite Loose Gemstone", stone: "Hessonite", planet: "Rahu", color: "#a75720", accent: "#ffc283", price: 1400, substitutes: "Cinnamon Stone is a trade name sometimes used for hessonite." },
  { slug: "vedic-tatva-cats-eye-loose-gemstone", name: "Vedic Tatva Cat's Eye Loose Gemstone", stone: "Cat's Eye", planet: "Ketu", color: "#84954e", accent: "#edf7b1", price: 1500, substitutes: "Chrysoberyl varieties are traditionally discussed with an advisor." },
  { slug: "vedic-tatva-red-garnet-loose-gemstone", name: "Vedic Tatva Red Garnet Loose Gemstone", stone: "Red Garnet", planet: "Sun (Surya)", color: "#762035", accent: "#ef9cac", price: 700 },
  { slug: "vedic-tatva-red-spinel-loose-gemstone", name: "Vedic Tatva Red Spinel Loose Gemstone", stone: "Red Spinel", planet: "Sun (Surya)", color: "#a32238", accent: "#ffbdc7", price: 1100 },
  { slug: "vedic-tatva-moonstone-loose-gemstone", name: "Vedic Tatva Moonstone Loose Gemstone", stone: "Moonstone", planet: "Moon (Chandra)", color: "#8ba3b7", accent: "#e5f3ff", price: 750 },
  { slug: "vedic-tatva-carnelian-loose-gemstone", name: "Vedic Tatva Carnelian Loose Gemstone", stone: "Carnelian", planet: "Mars (Mangal)", color: "#b84628", accent: "#ffc09b", price: 650 },
  { slug: "vedic-tatva-green-onyx-loose-gemstone", name: "Vedic Tatva Green Onyx Loose Gemstone", stone: "Green Onyx", planet: "Mercury (Budha)", color: "#277358", accent: "#b4e5cb", price: 650 },
  { slug: "vedic-tatva-peridot-loose-gemstone", name: "Vedic Tatva Peridot Loose Gemstone", stone: "Peridot", planet: "Mercury (Budha)", color: "#769e35", accent: "#e1f5a8", price: 900 },
  { slug: "vedic-tatva-citrine-loose-gemstone", name: "Vedic Tatva Citrine Loose Gemstone", stone: "Citrine", planet: "Jupiter (Guru)", color: "#c68c1c", accent: "#ffe69b", price: 700 },
  { slug: "vedic-tatva-yellow-topaz-loose-gemstone", name: "Vedic Tatva Yellow Topaz Loose Gemstone", stone: "Yellow Topaz", planet: "Jupiter (Guru)", color: "#c99030", accent: "#fff0ae", price: 1050 },
  { slug: "vedic-tatva-white-sapphire-loose-gemstone", name: "Vedic Tatva White Sapphire Loose Gemstone", stone: "White Sapphire", planet: "Venus (Shukra)", color: "#b4c8cf", accent: "#ffffff", price: 1800 },
  { slug: "vedic-tatva-white-zircon-loose-gemstone", name: "Vedic Tatva White Zircon Loose Gemstone", stone: "White Zircon", planet: "Venus (Shukra)", color: "#a7b9d2", accent: "#f9fcff", price: 850 },
  { slug: "vedic-tatva-opal-loose-gemstone", name: "Vedic Tatva Opal Loose Gemstone", stone: "Opal", planet: "Venus (Shukra)", color: "#5f9d9a", accent: "#d5fff2", price: 1300 },
  { slug: "vedic-tatva-iolite-loose-gemstone", name: "Vedic Tatva Iolite Loose Gemstone", stone: "Iolite", planet: "Saturn (Shani)", color: "#4f569e", accent: "#cfd2ff", price: 800 },
  { slug: "vedic-tatva-amethyst-loose-gemstone", name: "Vedic Tatva Amethyst Loose Gemstone", stone: "Amethyst", planet: "Saturn (Shani)", color: "#65428e", accent: "#e4caff", price: 750 },
  { slug: "vedic-tatva-lapis-lazuli-loose-gemstone", name: "Vedic Tatva Lapis Lazuli Loose Gemstone", stone: "Lapis Lazuli", planet: "Saturn (Shani)", color: "#24478b", accent: "#d0ddff", price: 700 },
  { slug: "vedic-tatva-gomed-loose-gemstone", name: "Vedic Tatva Gomed Loose Gemstone", stone: "Gomed", planet: "Rahu", color: "#9d4d20", accent: "#ffd39b", price: 950 },
  { slug: "vedic-tatva-smoky-quartz-loose-gemstone", name: "Vedic Tatva Smoky Quartz Loose Gemstone", stone: "Smoky Quartz", planet: "Rahu", color: "#745344", accent: "#ead0bc", price: 600 },
  { slug: "vedic-tatva-lehsunia-loose-gemstone", name: "Vedic Tatva Lehsunia Loose Gemstone", stone: "Lehsunia", planet: "Ketu", color: "#74864c", accent: "#f0ffc4", price: 950 },
  { slug: "vedic-tatva-tiger-eye-loose-gemstone", name: "Vedic Tatva Tiger Eye Loose Gemstone", stone: "Tiger Eye", planet: "Ketu", color: "#93651d", accent: "#ffe29d", price: 600 },
  { slug: "vedic-tatva-aquamarine-loose-gemstone", name: "Vedic Tatva Aquamarine Loose Gemstone", stone: "Aquamarine", planet: "Mercury (Budha)", color: "#4d9ca2", accent: "#c9ffff", price: 950 },
  { slug: "vedic-tatva-tourmaline-loose-gemstone", name: "Vedic Tatva Tourmaline Loose Gemstone", stone: "Tourmaline", planet: "Mercury (Budha)", color: "#27725e", accent: "#b6f0d2", price: 850 },
  { slug: "vedic-tatva-sunstone-loose-gemstone", name: "Vedic Tatva Sunstone Loose Gemstone", stone: "Sunstone", planet: "Sun (Surya)", color: "#bd582f", accent: "#ffd4a7", price: 700 },
];

const titles = ["Representative loose-stone presentation", "Gem detail illustration", "Loose-stone scale illustration", "Planet and rashi reference", "Care and purchase guidance"];
const svg = (item: Gemstone, kind: number) => {
  const label = titles[kind];
  const motif = kind === 3 ? "✦" : kind === 4 ? "◇" : "●";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900" role="img" aria-label="${item.stone} ${label}"><defs><radialGradient id="g" cx="35%" cy="25%"><stop stop-color="${item.accent}"/><stop offset="1" stop-color="${item.color}"/></radialGradient></defs><rect width="1200" height="900" fill="#fbf7ee"/><rect x="42" y="42" width="1116" height="816" rx="28" fill="${item.color}" opacity=".11"/><text x="600" y="145" text-anchor="middle" font-family="Georgia,serif" font-size="30" fill="#6d2b35">VEDIC TATVA · GEMSTONE GUIDE</text><text x="600" y="200" text-anchor="middle" font-family="Arial,sans-serif" font-size="19" fill="#5a4a3a">${label.toUpperCase()}</text><circle cx="${kind === 1 ? 600 : 510}" cy="${kind === 2 ? 410 : 440}" r="${kind === 0 ? 205 : 165}" fill="url(#g)" stroke="#d4af37" stroke-width="12"/><text x="600" y="490" text-anchor="middle" font-family="Georgia,serif" font-size="${kind === 3 ? 210 : 130}" fill="#fff" opacity=".82">${motif}</text><text x="600" y="700" text-anchor="middle" font-family="Georgia,serif" font-size="48" fill="#3a2a1a">${item.stone}</text><text x="600" y="748" text-anchor="middle" font-family="Arial,sans-serif" font-size="24" fill="#5a4a3a">Traditional association: ${item.planet}</text><text x="600" y="805" text-anchor="middle" font-family="Arial,sans-serif" font-size="18" fill="#6d2b35">Representative illustration · loose stone supplied by selected variation</text></svg>`;
};

async function ensureVisuals(item: Gemstone) {
  const dir = path.join(process.cwd(), "attached_assets", "generated_images", "gemstones");
  await mkdir(dir, { recursive: true });
  await Promise.all(titles.map((_, index) => writeFile(path.join(dir, `${item.slug}-${index + 1}.svg`), svg(item, index), "utf8")));
  return titles.map((_, index) => `/attached_assets/generated_images/gemstones/${item.slug}-${index + 1}.svg`);
}

function buildRichDescription(item: Gemstone, image: string) {
  const related = item.substitutes ? `<p><b>Related traditional reference:</b> ${item.substitutes}</p>` : "";
  return `<section style="max-width:960px;margin:auto;font-family:Arial,sans-serif;color:#3a2a1a"><div style="padding:28px;background:#fbf7ee;border:1px solid #d4af37;border-radius:12px"><p style="letter-spacing:2px;color:#6d2b35">VEDIC TATVA · LOOSE GEMSTONE</p><h2>${item.stone}: a representative loose-stone selection</h2><p>This catalogue listing presents a loose ${item.stone} in selectable carat-weight ranges. The image is an original representative illustration, not a photograph or promise of the exact stone supplied.</p><img src="${image}" alt="Representative ${item.stone} loose-stone illustration" style="width:100%;border-radius:8px"/><h3>Traditional reference</h3><p>In Vedic astrology, ${item.stone} is traditionally associated with ${item.planet}. These associations are matters of traditional belief, not a guarantee of personal, financial, medical, or astrological results. Consider qualified, independent guidance before choosing a gemstone for a specific horoscope.</p>${related}<h3>Choosing and care</h3><p>Select a carat range for your preferred loose-stone size. Visual characteristics naturally vary. Store separately in a soft pouch, avoid impacts and household chemicals, and clean gently with a soft dry cloth. No certificate, certificate number, origin, treatment status, or exact dispatched stone is represented by this listing.</p></div></section>`;
}

export async function seedGemstoneProducts() {
  console.log("Seeding representative gemstone catalogue (upsert by slug)...");
  let inserted = 0;
  let updated = 0;
  for (const item of ITEMS) {
    const images = await ensureVisuals(item);
    const faqs = [
      { question: `What does this ${item.stone} listing include?`, answer: `It is a loose ${item.stone} listing with a selectable carat-weight range. Images are representative illustrations and the exact stone can vary visually.` },
      { question: "Is a certificate or exact origin included?", answer: "No certificate, certificate number, exact origin, treatment status, or exact dispatched stone is claimed or included by this catalogue listing." },
      { question: "What is the astrological association?", answer: `${item.stone} is traditionally associated with ${item.planet} in Vedic astrology. This is a traditional belief and does not guarantee any result; seek independent guidance for personal decisions.` },
      { question: "How should a loose gemstone be cared for?", answer: "Keep it in a soft pouch, avoid impact and household chemicals, and wipe gently with a soft dry cloth." },
    ];
    const row = {
      name: item.name,
      description: `<p><b>${item.stone} loose gemstone.</b> Choose a carat-weight variation. Representative illustration only; it does not depict the exact stone supplied.</p><p>Traditionally associated with ${item.planet} in Vedic belief. No medical, financial, or astrological outcome is promised.</p>`,
      price: item.price,
      mrp: null,
      stock: 0,
      category: "Gemstones",
      image: images[0],
      images,
      imageAlts: titles.map((title) => `${item.stone} ${title.toLowerCase()} — representative visual`),
      badge: "Representative Visual",
      salesCount: 0,
      highlights: ["Loose gemstone with carat-weight options", "Original representative visual, not exact-SKU photography", `Traditional Vedic association: ${item.planet}`, "No promised astrological, medical, or financial result"],
      features: ["Product form: Loose stone", "Carat weight: Select a variation", "Stock status: Currently unavailable", "Images: Representative branded illustrations", "Care: Soft pouch; avoid impact and chemicals"],
      richDescription: buildRichDescription(item, images[3]),
      aplusImages: images.slice(1),
      aplusEnabled: true,
      slug: item.slug,
      variations: JSON.stringify([{ label: "3–4 carat", price: item.price }, { label: "5–6 carat", price: item.price + 450 }, { label: "7–8 carat", price: item.price + 900 }]),
      gstPercent: 3,
      productType: "product",
      seoFocusKeyword: `${item.stone} loose gemstone`,
      seoFaq: faqs,
    };
    const existing = await db.select({ id: products.id }).from(products).where(eq(products.slug, item.slug)).limit(1);
    if (existing.length) {
      await db.update(products).set(row).where(eq(products.id, existing[0].id));
      updated++;
    } else {
      await db.insert(products).values(row);
      inserted++;
    }
  }
  console.log(`Gemstones: ${inserted} inserted, ${updated} updated (total ${ITEMS.length}).`);
}
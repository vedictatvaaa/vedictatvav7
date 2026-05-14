import { db } from "./db";
import { products } from "@shared/schema";
import { eq } from "drizzle-orm";

const PLACEHOLDER_IMAGE = "/attached_assets/category_cards/puja_samagri.png";

type Item = {
  name: string;
  description: string;
  price: number;
  mrp?: number;
  stock?: number;
  highlights: string[];
  variations?: { label: string; price: number }[];
  units?: string;
};

const items: Item[] = [
  {
    name: "Janeu (Sacred Yajnopavit Thread) - Pure Cotton",
    description: "Hand-spun pure cotton Janeu (Yajnopavit) sacred thread used in daily sandhya, upanayana sanskar and traditional puja rituals. Made by skilled artisans following Vedic specifications.",
    price: 49,
    mrp: 79,
    units: "Single thread",
    highlights: ["Pure handspun cotton", "Vedic specifications", "Suitable for daily wear", "Used in upanayana sanskar"],
  },
  {
    name: "Mouli / Kalava - Sacred Red Puja Thread",
    description: "Authentic Mouli (Kalava) red and yellow sacred thread tied on the wrist during puja, havan and auspicious occasions. Symbol of protection and divine blessings.",
    price: 25,
    mrp: 49,
    units: "1 roll",
    highlights: ["Traditional red & yellow thread", "Used in all Hindu pujas", "Symbol of protection", "Long-lasting cotton"],
  },
  {
    name: "Gangajal - Holy Water from River Ganga",
    description: "Pure Gangajal collected from the sacred River Ganga at Haridwar. Sealed in a tamper-proof bottle. Essential for puja, abhishekam, last rites and purifying rituals.",
    price: 99,
    mrp: 149,
    units: "200 ml",
    highlights: ["Authentic Haridwar Gangajal", "Tamper-proof seal", "For puja & abhishekam", "Spiritually purifying"],
    variations: [
      { label: "200 ml", price: 99 },
      { label: "500 ml", price: 199 },
      { label: "1 Litre", price: 349 },
    ],
  },
  {
    name: "Laddu Gopal Vastra (Poshak) - Multi-colour Variation",
    description: "Beautifully stitched silk Vastra (Poshak) for Laddu Gopal / Bal Gopal idol. Available in vibrant Krishna-themed colours. Perfect for daily shringar and festive occasions like Janmashtami.",
    price: 149,
    mrp: 249,
    units: "Single Poshak set",
    highlights: ["Soft silk fabric", "Hand-stitched detailing", "Multi-colour variations", "Ideal for daily shringar"],
    variations: [
      { label: "Yellow (Peela)", price: 149 },
      { label: "Red (Lal)", price: 149 },
      { label: "Pink (Gulabi)", price: 149 },
      { label: "Blue (Neela)", price: 149 },
      { label: "Green (Hara)", price: 149 },
      { label: "Orange (Kesariya)", price: 149 },
    ],
  },
  {
    name: "Chowki Cloth - Puja Altar Cover",
    description: "Premium cotton-silk Chowki cloth for covering wooden puja chowki / altar. Auspicious red and yellow tones with golden zari border. Adds elegance to your puja setup.",
    price: 199,
    mrp: 299,
    units: "1 piece",
    highlights: ["Cotton-silk blend", "Golden zari border", "Fits standard chowki", "Easy to wash"],
    variations: [
      { label: "Red", price: 199 },
      { label: "Yellow", price: 199 },
      { label: "Maroon", price: 199 },
    ],
  },
  {
    name: "Terracotta Diya - Pack of 100",
    description: "Eco-friendly handcrafted terracotta (mitti) diyas. Pack of 100, perfect for Diwali, Karthik Maas, Karva Chauth and large puja gatherings. Made by traditional Indian artisans.",
    price: 299,
    mrp: 499,
    units: "Pack of 100",
    highlights: ["Pack of 100 diyas", "Handcrafted terracotta", "Eco-friendly & biodegradable", "Perfect for Diwali"],
  },
  {
    name: "Peela Vastra - Yellow Puja Cloth",
    description: "Pure cotton Peela Vastra (yellow puja cloth) used to cover the deity, drape during puja, or offer to Bhagwan Vishnu, Brihaspati and other devtas. Auspicious for Thursdays and yellow-themed pujas.",
    price: 79,
    mrp: 129,
    units: "1 piece (approx 1 meter)",
    highlights: ["100% pure cotton", "Auspicious yellow colour", "For Vishnu & Brihaspati puja", "Soft & breathable"],
  },
  {
    name: "Long Cotton Batti - Puja Diya Wicks",
    description: "Long pure cotton wicks (batti) for ghee or oil diyas. Hand-rolled for smokeless, long-lasting flame. Essential for Akhand Jyot, daily diya and Lakshmi puja.",
    price: 59,
    mrp: 99,
    units: "Pack of 100",
    highlights: ["Pure cotton, hand-rolled", "Long-burning, smokeless", "For ghee & oil diyas", "Pack of 100 wicks"],
  },
  {
    name: "Short Batti - Cotton Wicks for Diya",
    description: "Short cotton wicks (chhoti batti) for puja diyas. Ideal for small ghee diyas used in daily puja and during festivals.",
    price: 39,
    mrp: 69,
    units: "Pack of 200",
    highlights: ["Pack of 200 wicks", "Pure cotton", "For small puja diyas", "Even & clean burn"],
  },
  {
    name: "Kesar Chandan Tilak - Saffron Sandalwood Paste",
    description: "Traditional Kesar (saffron) Chandan tilak paste made with pure sandalwood and authentic kesar. Used for tilak during puja, abhishekam and on deities. Cooling and divinely fragrant.",
    price: 149,
    mrp: 249,
    units: "25 g",
    highlights: ["Pure sandalwood + saffron", "Cooling & fragrant", "For deity tilak", "Long-lasting"],
  },
  {
    name: "White Chandan Tilak - Pure Sandalwood Paste",
    description: "Pure white Chandan tilak paste prepared from genuine Mysore sandalwood. Used for daily puja tilak, deity decoration and on the forehead during meditation.",
    price: 129,
    mrp: 199,
    units: "25 g",
    highlights: ["Genuine Mysore sandalwood", "Smooth tilak application", "Cooling fragrance", "For daily puja"],
  },
  {
    name: "Chandan Powder - Pure Sandalwood Powder",
    description: "100% pure sandalwood (chandan) powder for making tilak paste, havan and abhishekam. Prepared from finely ground Mysore sandalwood with no fillers or chemicals.",
    price: 199,
    mrp: 299,
    units: "50 g",
    highlights: ["100% pure sandalwood", "No fillers or chemicals", "For tilak & havan", "Authentic fragrance"],
    variations: [
      { label: "50 g", price: 199 },
      { label: "100 g", price: 369 },
      { label: "250 g", price: 849 },
    ],
  },
  {
    name: "Pooja Chowki Small - Wooden Altar Stand",
    description: "Small wooden puja chowki (altar stand) for placing deities, Laddu Gopal or photos. Hand-finished with a smooth polish. Perfect for home mandir and travel puja kit.",
    price: 349,
    mrp: 549,
    units: "1 piece",
    highlights: ["Solid wood construction", "Hand-finished polish", "Compact size for home mandir", "Sturdy & durable"],
  },
  {
    name: "Gomti Chakra - Pack of 13 Pieces",
    description: "Authentic Gomti Chakra stones from the sacred River Gomti. Pack of 13 pieces, used in Lakshmi puja, vastu remedies, yantra activation and prosperity rituals.",
    price: 149,
    mrp: 249,
    units: "Pack of 13",
    highlights: ["Pack of 13 chakras", "From sacred River Gomti", "For Lakshmi puja & vastu", "Symbol of prosperity"],
  },
  {
    name: "Beetal (Betel) Nuts for Puja - Pack of 12",
    description: "Whole supari (betel nuts) used in puja, kalash sthapana, ganesh puja and Lakshmi puja. Pack of 12 hand-selected, auspicious betel nuts.",
    price: 70,
    mrp: 99,
    units: "Pack of 12",
    highlights: ["Pack of 12 supari", "Hand-selected, auspicious", "For kalash sthapana", "Used in all major pujas"],
  },
  {
    name: "Cotton Phool Batti - Flower-shaped Diya Wicks",
    description: "Decorative flower-shaped (phool) cotton batti / wicks for puja diyas. Burn longer than ordinary wicks and add a beautiful aesthetic to your puja thali.",
    price: 79,
    mrp: 129,
    units: "Pack of 50",
    highlights: ["Pack of 50 phool battis", "Flower-shaped design", "Long-burning cotton", "Beautiful for puja thali"],
  },
];

async function seed() {
  let added = 0;
  let skipped = 0;
  for (const it of items) {
    const slug = it.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const existing = await db.select().from(products).where(eq(products.slug, slug)).limit(1);
    if (existing.length > 0) {
      skipped++;
      console.log(`[skip] already exists: ${it.name}`);
      continue;
    }
    await db.insert(products).values({
      name: it.name,
      description: it.description,
      price: it.price,
      mrp: it.mrp ?? null,
      stock: it.stock ?? 50,
      category: "Puja Samagri",
      image: PLACEHOLDER_IMAGE,
      images: [PLACEHOLDER_IMAGE],
      highlights: it.highlights,
      features: it.units ? [`Units: ${it.units}`, "Category: Puja Samagri", "Brand: Vedic Tatva"] : ["Category: Puja Samagri", "Brand: Vedic Tatva"],
      richDescription: it.description,
      aplusEnabled: false,
      slug,
      brand: "Vedic Tatva",
      gstPercent: 18,
      productType: "product",
      variations: it.variations ? JSON.stringify(it.variations) : null,
    } as any);
    added++;
    console.log(`[add]  ${it.name}`);
  }
  console.log(`\nDone. Added: ${added}, Skipped (already existed): ${skipped}`);
}

seed().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});

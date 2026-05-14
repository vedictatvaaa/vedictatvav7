import { db } from "./db";
import { products } from "@shared/schema";
import { eq } from "drizzle-orm";

const IMG = "/attached_assets/havan_samagri";

const HOW_TO_USE = `
  <div style="background:#FBF7EE;border:1px solid #D4AF37;border-radius:8px;padding:20px;">
    <h3 style="margin:0 0 12px 0;font-family:Georgia,serif;color:#6D2B35;font-size:18px;">How to Perform Havan — Quick Guide</h3>
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;">
      <div style="background:#fff;border:1px solid #e8dcc1;border-radius:6px;padding:12px;">
        <div style="font-weight:700;color:#6D2B35;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">1 · Place</div>
        <div style="font-size:12.5px;color:#3a2a20;line-height:1.5;">Set the Havan Kund on a clean surface or sand bed in the north-east corner of the room.</div>
      </div>
      <div style="background:#fff;border:1px solid #e8dcc1;border-radius:6px;padding:12px;">
        <div style="font-weight:700;color:#6D2B35;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">2 · Arrange</div>
        <div style="font-size:12.5px;color:#3a2a20;line-height:1.5;">Stack mango wood samidha sticks in a small pyramid inside the kund.</div>
      </div>
      <div style="background:#fff;border:1px solid #e8dcc1;border-radius:6px;padding:12px;">
        <div style="font-weight:700;color:#6D2B35;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">3 · Ignite</div>
        <div style="font-size:12.5px;color:#3a2a20;line-height:1.5;">Place a small piece of camphor at the base and light it to start the sacred fire.</div>
      </div>
      <div style="background:#fff;border:1px solid #e8dcc1;border-radius:6px;padding:12px;">
        <div style="font-weight:700;color:#6D2B35;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">4 · Offer</div>
        <div style="font-size:12.5px;color:#3a2a20;line-height:1.5;">Offer Havan Samagri and ghee with the chammach while chanting your mantras.</div>
      </div>
      <div style="background:#fff;border:1px solid #e8dcc1;border-radius:6px;padding:12px;">
        <div style="font-weight:700;color:#6D2B35;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">5 · Conclude</div>
        <div style="font-size:12.5px;color:#3a2a20;line-height:1.5;">End with Purnahuti — a final full offering with "Swaha" — and circumambulate the kund.</div>
      </div>
      <div style="background:#fff;border:1px solid #e8dcc1;border-radius:6px;padding:12px;">
        <div style="font-weight:700;color:#6D2B35;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Tip</div>
        <div style="font-size:12.5px;color:#3a2a20;line-height:1.5;">Always perform Havan in a well-ventilated area. Keep water and a small towel nearby.</div>
      </div>
    </div>
  </div>`;

function aplus(opts: { title: string; tagline: string; bullets: string[]; specs: { k: string; v: string }[]; accent?: string; }): string {
  const accent = opts.accent || "#6D2B35";
  const bulletsHtml = opts.bullets.map(b => `<li style="margin-bottom:6px;">${b}</li>`).join("");
  const specsHtml = opts.specs.map(s => `
    <div style="background:#FBF7EE;border:1px solid #e8dcc1;border-radius:6px;padding:12px;">
      <div style="font-size:11px;color:#6D2B35;text-transform:uppercase;letter-spacing:1px;font-weight:700;">${s.k}</div>
      <div style="font-size:13.5px;color:#3a2a20;margin-top:3px;">${s.v}</div>
    </div>`).join("");

  return `
  <div style="max-width:980px;margin:0 auto;background:#fff;font-family:Arial,sans-serif;color:#3a2a20;">
    <div style="background:linear-gradient(135deg,${accent} 0%,#4a1a22 100%);padding:44px 24px;text-align:center;border-radius:12px 12px 0 0;">
      <div style="display:inline-block;padding:6px 18px;border:1px solid #D4AF37;border-radius:999px;color:#D4AF37;font-size:11px;letter-spacing:3px;text-transform:uppercase;">Sacred Havan Essentials</div>
      <h1 style="margin:18px 0 8px 0;font-family:Georgia,serif;color:#fff;font-size:28px;line-height:1.25;">${opts.title}</h1>
      <p style="margin:0;color:#FBF7EE;font-size:14px;letter-spacing:1px;">${opts.tagline}</p>
    </div>

    <div style="padding:28px 24px 8px 24px;">
      <h2 style="font-family:Georgia,serif;color:#6D2B35;font-size:22px;margin:0 0 12px 0;">Why this is special</h2>
      <ul style="margin:0;padding-left:18px;color:#3a2a20;font-size:14px;line-height:1.7;">${bulletsHtml}</ul>
    </div>

    <div style="padding:24px;">
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;">${specsHtml}</div>
    </div>

    <div style="padding:0 24px 32px 24px;">${HOW_TO_USE}</div>
  </div>`;
}

type Item = {
  slug: string;
  name: string;
  shortDesc: string;
  price: number;
  mrp: number;
  highlights: string[];
  features: string[];
  variations?: { label: string; price: number }[];
  badge: string;
  rich: string;
  brand?: string;
  hsn: string;
  gst: number;
  images: string[];
  imageAlts: string[];
};

const ITEMS: Item[] = [
  {
    slug: "vedic-tatva-copper-hawan-kund-stepped-pyramid",
    name: "Vedic Tatva Copper Hawan Kund — Stepped Pyramid Design (Pure Copper)",
    shortDesc: "Pure copper Hawan Kund hand-crafted in the traditional stepped pyramid (vedi) design — ideal for daily havan, yagna and Vedic fire rituals at home or temple.",
    price: 1499,
    mrp: 2499,
    highlights: [
      "100% pure copper — sacred metal recommended in Vedic tradition",
      "Classic square stepped pyramid (vedi) design",
      "Hand-hammered finish with natural antimicrobial property",
      "Strong, heat-resistant base — safe for direct fire use",
      "Suitable for home pooja, havan, yagna and temple rituals",
    ],
    features: [
      "Material: Pure Copper",
      "Design: Stepped square pyramid (vedi)",
      "Sizes: 6, 8, 10, 12 inch",
      "Finish: Hand-hammered, polished exterior",
      "Care: Wipe with lemon & salt to retain shine",
    ],
    variations: [
      { label: "6 inch",  price: 1499 },
      { label: "8 inch",  price: 2299 },
      { label: "10 inch", price: 3299 },
      { label: "12 inch", price: 4499 },
    ],
    badge: "Pure Copper",
    hsn: "7418",
    gst: 12,
    rich: aplus({
      title: "Pure Copper Hawan Kund",
      tagline: "Hand-crafted · Stepped pyramid · Sacred ritual ready",
      bullets: [
        "<b>Pure copper construction</b> — the sacred metal of Vedic rituals.",
        "<b>Stepped pyramid (vedi)</b> design as per shastra — focuses fire energy upward.",
        "<b>Hand-hammered exterior</b> for grip and an authentic artisan look.",
        "<b>Heat-resistant thick base</b> — safe for direct samidha fire.",
        "<b>Durable and easy to clean</b> — develops a beautiful patina over time.",
      ],
      specs: [
        { k: "Material", v: "Pure Copper" },
        { k: "Design", v: "Stepped Square Pyramid" },
        { k: "Available Sizes", v: "6 / 8 / 10 / 12 inch" },
        { k: "Best For", v: "Daily Havan, Yagna, Pujas" },
      ],
    }),
    images: [`${IMG}/copper_kund_front.png`, `${IMG}/copper_kund_angle.png`, `${IMG}/copper_kund_detail.png`],
    imageAlts: [
      "Pure Copper Hawan Kund - Front view, stepped pyramid design",
      "Pure Copper Hawan Kund - Angled view with mango wood samidha inside",
      "Pure Copper Hawan Kund - Close-up of hand-hammered copper texture",
    ],
  },
  {
    slug: "vedic-tatva-aluminum-havan-kund-stepped-pyramid",
    name: "Vedic Tatva Aluminum Havan Kund — Stepped Pyramid Design (Lightweight)",
    shortDesc: "Lightweight aluminum Havan Kund in the traditional stepped pyramid design — affordable, durable and travel-friendly for everyday havan and group pujas.",
    price: 599,
    mrp: 999,
    highlights: [
      "Food-grade aluminum — strong, lightweight and rust-free",
      "Classic square stepped pyramid (vedi) shape",
      "Heat-resistant — safe for direct samidha fire",
      "Easy to lift, clean and store — ideal for community pujas",
      "Affordable choice for daily home havan",
    ],
    features: [
      "Material: Food-grade Aluminum",
      "Design: Stepped square pyramid (vedi)",
      "Sizes: 6, 8, 10, 12 inch",
      "Finish: Brushed matte aluminum",
      "Care: Wipe clean after each use",
    ],
    variations: [
      { label: "6 inch",  price: 599  },
      { label: "8 inch",  price: 899  },
      { label: "10 inch", price: 1299 },
      { label: "12 inch", price: 1799 },
    ],
    badge: "Lightweight",
    hsn: "7615",
    gst: 12,
    rich: aplus({
      title: "Aluminum Havan Kund",
      tagline: "Lightweight · Durable · Travel-friendly",
      bullets: [
        "<b>Food-grade aluminum</b> — strong yet light, easy to handle.",
        "<b>Traditional stepped pyramid</b> shape as prescribed for havan.",
        "<b>Rust-resistant</b> — perfect for humid climates and outdoor pujas.",
        "<b>Heat-tolerant base</b> — safe for direct samidha fire.",
        "<b>Easy to clean and store</b> — ideal for travel and community havans.",
      ],
      specs: [
        { k: "Material", v: "Food-grade Aluminum" },
        { k: "Design", v: "Stepped Square Pyramid" },
        { k: "Available Sizes", v: "6 / 8 / 10 / 12 inch" },
        { k: "Best For", v: "Daily Havan, Travel, Group Pujas" },
      ],
    }),
    images: [`${IMG}/aluminum_kund_front.png`, `${IMG}/aluminum_kund_angle.png`, `${IMG}/aluminum_kund_detail.png`],
    imageAlts: [
      "Aluminum Havan Kund - Front view, stepped pyramid design",
      "Aluminum Havan Kund - Angled view with samidha inside",
      "Aluminum Havan Kund - Close-up of brushed aluminum finish",
    ],
  },
  {
    slug: "vedic-tatva-havan-chammach-brass-sruva",
    name: "Vedic Tatva Havan Chammach (Sruva) — Brass Ladle with Wooden Handle",
    shortDesc: "Traditional brass Havan Chammach (sruva) with a smooth wooden handle — used to offer ghee and havan samagri into the sacred fire during yajna.",
    price: 349,
    mrp: 599,
    highlights: [
      "Authentic sruva design — long handle for safe offering",
      "Pure brass bowl — sacred metal, durable and polished",
      "Smooth wooden grip — heat-insulating and comfortable",
      "Just the right bowl size for ghee and samagri offerings",
      "Ideal for daily havan, yagna and Vedic fire rituals",
    ],
    features: [
      "Material: Brass bowl + Wooden handle",
      "Length: Approx. 12 inch",
      "Bowl Size: Approx. 1.5 inch diameter",
      "Use: Offering ghee & samagri into havan kund",
      "Care: Wipe clean after each use",
    ],
    badge: "Brass + Wood",
    hsn: "7418",
    gst: 12,
    rich: aplus({
      title: "Havan Chammach (Sruva)",
      tagline: "Brass · Wooden grip · Yagna essential",
      bullets: [
        "<b>Pure brass bowl</b> — the sacred metal traditionally used for fire offerings.",
        "<b>Long wooden handle</b> — keeps your hand safely away from the flame.",
        "<b>Polished finish</b> — easy to clean, develops a warm golden patina.",
        "<b>Right-sized bowl</b> — holds the perfect spoonful of ghee or samagri.",
        "<b>Daily-use durable</b> — built to last through years of pujas.",
      ],
      specs: [
        { k: "Material", v: "Brass + Wood" },
        { k: "Length", v: "Approx. 12 inch" },
        { k: "Bowl Diameter", v: "Approx. 1.5 inch" },
        { k: "Best For", v: "Havan, Yagna, Daily Aahuti" },
      ],
    }),
    images: [`${IMG}/chammach_front.png`, `${IMG}/chammach_angle.png`, `${IMG}/chammach_detail.png`],
    imageAlts: [
      "Brass Havan Chammach Sruva - Front view of ladle",
      "Brass Havan Chammach Sruva - Angled view beside ghee bowl",
      "Brass Havan Chammach Sruva - Close-up of brass bowl and wood handle",
    ],
  },
  {
    slug: "vedic-tatva-mango-wood-samidha-havan-sticks",
    name: "Vedic Tatva Mango Wood Samidha — Pure Mango Wood Havan Sticks",
    shortDesc: "Authentic dried mango wood (aam ki lakdi) samidha sticks — the most auspicious wood for Vedic havan and yajna. Long-burning, fragrant and ritual-ready.",
    price: 249,
    mrp: 399,
    highlights: [
      "100% pure dried mango wood — most auspicious in Vedic tradition",
      "Naturally fragrant — releases pure, sattvic smoke when burnt",
      "Sun-dried for low moisture — easy to ignite, long burning",
      "Cut to ritual size (approx. 6 inch) for any size of kund",
      "Tied in a neat bundle — ready for puja, havan, yajna",
    ],
    features: [
      "Material: 100% Pure Mango Wood (Aam ki Lakdi)",
      "Length: Approx. 6 inch each",
      "Quantities: 500 g, 1 kg, 2 kg",
      "Drying: Sun-dried, low moisture",
      "Use: Samidha for Havan, Yagna, Hawan Kund",
    ],
    variations: [
      { label: "500 g", price: 249 },
      { label: "1 kg",  price: 449 },
      { label: "2 kg",  price: 799 },
    ],
    badge: "Pure Mango Wood",
    hsn: "4407",
    gst: 5,
    rich: aplus({
      title: "Mango Wood Samidha",
      tagline: "100% pure aam ki lakdi · Sun-dried · Sattvic smoke",
      bullets: [
        "<b>Most auspicious havan wood</b> as per Vedic shastra — releases pure sattvic energy.",
        "<b>Sun-dried for low moisture</b> — ignites quickly, burns long and steady.",
        "<b>Naturally fragrant</b> — fills your space with a clean sacred aroma.",
        "<b>Pre-cut to ritual size</b> — fits 6/8/10/12 inch hawan kunds perfectly.",
        "<b>Hand-bundled</b> — neatly tied with natural twine, ready for use.",
      ],
      specs: [
        { k: "Wood", v: "Pure Mango (Aam)" },
        { k: "Stick Length", v: "Approx. 6 inch" },
        { k: "Available Packs", v: "500 g / 1 kg / 2 kg" },
        { k: "Best For", v: "Havan, Yagna, Daily Aarti" },
      ],
      accent: "#8b5a2b",
    }),
    images: [`${IMG}/mango_wood_front.png`, `${IMG}/mango_wood_stack.png`, `${IMG}/mango_wood_detail.png`],
    imageAlts: [
      "Mango Wood Samidha - Front view, neat bundle tied with jute",
      "Mango Wood Samidha - Top-down arrangement on marble",
      "Mango Wood Samidha - Macro close-up of wood grain",
    ],
  },
  {
    slug: "vedic-tatva-havan-samagri-32-herb-vedic-mix",
    name: "Vedic Tatva Havan Samagri — 32-Herb Authentic Vedic Mix",
    shortDesc: "Authentic 32-herb Havan Samagri — a sattvic blend of sandalwood, herbs, dried flowers, jaggery, ghee-soaked roots and aromatic resins prepared as per Vedic shastra.",
    price: 299,
    mrp: 499,
    highlights: [
      "Authentic 32-herb Vedic blend prepared as per shastra",
      "Includes sandalwood, guggul, camphor, dried tulsi, rose, marigold & more",
      "Sourced from trusted Indian organic farms — no fillers, no chemicals",
      "Releases pure sattvic, purifying smoke during havan",
      "Ideal for daily havan, Navagraha pujas, Lakshmi & Ganesh yajna",
    ],
    features: [
      "Composition: 32 sacred herbs, woods, flowers & resins",
      "Key Ingredients: Sandalwood, guggul, camphor, tulsi, rose, marigold, jaggery, ghee-soaked roots",
      "Quantities: 250 g, 500 g, 1 kg",
      "Storage: Cool dry place, away from sunlight",
      "Use: Offer with chammach into havan kund while chanting mantras",
    ],
    variations: [
      { label: "250 g", price: 299 },
      { label: "500 g", price: 549 },
      { label: "1 kg",  price: 999 },
    ],
    badge: "32-Herb Vedic Mix",
    hsn: "1404",
    gst: 5,
    rich: aplus({
      title: "Havan Samagri — 32-Herb Vedic Mix",
      tagline: "Sandalwood · Herbs · Flowers · Resins · Sattvic",
      bullets: [
        "<b>Authentic 32-herb blend</b> as prescribed in classical Vedic texts.",
        "<b>Premium sandalwood</b> base for a divine, lasting fragrance.",
        "<b>Dried flowers & herbs</b> — tulsi, rose, marigold, guggul and more.",
        "<b>No fillers, no synthetics</b> — pure sattvic offering for the agni.",
        "<b>Sealed for freshness</b> — packed in food-grade pouches.",
      ],
      specs: [
        { k: "Composition", v: "32 herbs, woods, flowers, resins" },
        { k: "Available Packs", v: "250 g / 500 g / 1 kg" },
        { k: "Storage", v: "Cool, dry place" },
        { k: "Best For", v: "Havan, Yagna, Navagraha Puja" },
      ],
      accent: "#8b3a1f",
    }),
    images: [`${IMG}/samagri_front.png`, `${IMG}/samagri_bowl.png`, `${IMG}/samagri_detail.png`],
    imageAlts: [
      "Havan Samagri - Copper bowl filled with 32-herb mix",
      "Havan Samagri - Top-down flat lay of all ingredients",
      "Havan Samagri - Close-up macro of herbs and petals",
    ],
  },
];

export async function seedHavanSamagriProducts() {
  const existing = await db.select().from(products);
  const bySlug = new Map(existing.filter(p => p.slug).map(p => [p.slug as string, p]));

  let inserted = 0;
  let updated = 0;

  for (const item of ITEMS) {
    const description =
      `<p><b>${item.name}</b> — ${item.shortDesc}</p>` +
      `<ul>${item.highlights.map(h => `<li>${h}</li>`).join("")}</ul>`;

    const row = {
      name: item.name,
      description,
      price: item.price,
      mrp: item.mrp,
      stock: 80,
      category: "Havan Samagri",
      image: item.images[0],
      images: item.images,
      imageAlts: item.imageAlts,
      badge: item.badge,
      salesCount: 0,
      highlights: item.highlights,
      features: item.features,
      richDescription: item.rich,
      aplusEnabled: true,
      slug: item.slug,
      gstPercent: item.gst,
      hsnCode: item.hsn,
      brand: item.brand || "Vedic Tatva",
      productType: "product" as const,
      variations: item.variations ? JSON.stringify(item.variations) : null,
    };

    const existingRow = bySlug.get(item.slug);
    if (existingRow) {
      await db
        .update(products)
        .set({
          name: row.name,
          description: row.description,
          price: row.price,
          mrp: row.mrp,
          highlights: row.highlights,
          features: row.features,
          richDescription: row.richDescription,
          aplusEnabled: true,
          badge: row.badge,
          variations: row.variations,
          gstPercent: row.gstPercent,
          hsnCode: row.hsnCode,
          brand: row.brand,
          image: row.image,
          images: row.images,
          imageAlts: row.imageAlts,
          category: row.category,
        })
        .where(eq(products.id, existingRow.id));
      updated++;
    } else {
      await db.insert(products).values(row);
      inserted++;
    }
  }

  console.log(`Havan Samagri seed: inserted ${inserted}, updated ${updated} (total ${ITEMS.length}).`);
}

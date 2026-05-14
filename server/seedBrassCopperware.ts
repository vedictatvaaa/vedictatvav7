import { db } from "./db";
import { products } from "@shared/schema";
import { eq } from "drizzle-orm";

const IMG = "/attached_assets/brass_copperware";

const CARE_GUIDE = `
  <div style="background:#FBF7EE;border:1px solid #D4AF37;border-radius:8px;padding:20px;">
    <h3 style="margin:0 0 12px 0;font-family:Georgia,serif;color:#6D2B35;font-size:18px;">Care &amp; Cleaning — Keep Your Brass &amp; Copperware Shining</h3>
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;">
      <div style="background:#fff;border:1px solid #e8dcc1;border-radius:6px;padding:12px;">
        <div style="font-weight:700;color:#6D2B35;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">1 · Daily Wipe</div>
        <div style="font-size:12.5px;color:#3a2a20;line-height:1.5;">Wipe with a soft dry cotton cloth after every use to prevent water spots.</div>
      </div>
      <div style="background:#fff;border:1px solid #e8dcc1;border-radius:6px;padding:12px;">
        <div style="font-weight:700;color:#6D2B35;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">2 · Deep Clean</div>
        <div style="font-size:12.5px;color:#3a2a20;line-height:1.5;">Rub gently with a paste of lemon juice + salt, then rinse and dry — restores natural shine.</div>
      </div>
      <div style="background:#fff;border:1px solid #e8dcc1;border-radius:6px;padding:12px;">
        <div style="font-weight:700;color:#6D2B35;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">3 · Tamarind Polish</div>
        <div style="font-size:12.5px;color:#3a2a20;line-height:1.5;">For deeper tarnish, soak briefly in tamarind water — the traditional Indian way.</div>
      </div>
      <div style="background:#fff;border:1px solid #e8dcc1;border-radius:6px;padding:12px;">
        <div style="font-weight:700;color:#6D2B35;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">4 · Avoid</div>
        <div style="font-size:12.5px;color:#3a2a20;line-height:1.5;">No harsh detergents, no steel scrubbers, no dishwasher — these damage the polish and finish.</div>
      </div>
      <div style="background:#fff;border:1px solid #e8dcc1;border-radius:6px;padding:12px;">
        <div style="font-weight:700;color:#6D2B35;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">5 · Store Dry</div>
        <div style="font-size:12.5px;color:#3a2a20;line-height:1.5;">Always store completely dry. Wrap with a soft cloth if storing for long periods.</div>
      </div>
      <div style="background:#fff;border:1px solid #e8dcc1;border-radius:6px;padding:12px;">
        <div style="font-weight:700;color:#6D2B35;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Tip</div>
        <div style="font-size:12.5px;color:#3a2a20;line-height:1.5;">A natural patina is normal and considered auspicious — it does not affect the metal&apos;s purity.</div>
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
      <div style="display:inline-block;padding:6px 18px;border:1px solid #D4AF37;border-radius:999px;color:#D4AF37;font-size:11px;letter-spacing:3px;text-transform:uppercase;">Premium Brass &amp; Copperware</div>
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

    <div style="padding:0 24px 32px 24px;">${CARE_GUIDE}</div>
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

// Brass HSN: 7418 (kitchen/household), 7419 (other articles). GST 12% for brass/copper. Wood handles 5%. Bronze 12%.
const ITEMS: Item[] = [
  // 1. Pooja Hand Bell — Ghanti sizes 1-9 + Fancy + Round + Meenakari
  {
    slug: "vedic-tatva-brass-pooja-ghanti-hand-bell",
    name: "Vedic Tatva Brass Pooja Ghanti — Traditional Hand Bell with Om Handle",
    shortDesc: "Pure brass Hindu pooja hand bell (ghanti) with sacred Om symbol on the handle. Available in sizes 1 to 9, plus fancy round and meenakari finish — produces the auspicious sound that wards off negative energy.",
    price: 149,
    mrp: 299,
    highlights: [
      "Pure brass — produces the clear, resonant sound prescribed in shastra",
      "Om symbol on top handle for daily worship",
      "Available in sizes 1 to 9 — choose by sound depth",
      "Fancy round, meenakari (lacquer enamel) and matt-polish finishes also available",
      "Single box packed — gift-ready",
    ],
    features: [
      "Material: Pure Brass",
      "Sizes: 1, 2, 3, 4, 5, 6, 7, 8, 9 (small to large)",
      "Variants: Plain, Fancy Round, Meenakari (lacquer coat), Golden polish, Matt polish",
      "Use: Daily aarti, pooja, temple worship",
      "Care: Wipe dry; polish with lemon &amp; salt",
    ],
    variations: [
      { label: "Size 1 — Mini",     price: 149 },
      { label: "Size 2",            price: 179 },
      { label: "Size 3",            price: 219 },
      { label: "Size 4",            price: 269 },
      { label: "Size 5 — Standard", price: 329 },
      { label: "Size 6",            price: 399 },
      { label: "Size 7",            price: 479 },
      { label: "Size 8",            price: 579 },
      { label: "Size 9 — Large",    price: 699 },
      { label: "Fancy Round",       price: 349 },
      { label: "Meenakari Lacquer", price: 449 },
    ],
    badge: "Pure Brass",
    hsn: "7418",
    gst: 12,
    rich: aplus({
      title: "Brass Pooja Ghanti — Hand Bell",
      tagline: "Pure brass · Om handle · Sacred resonance",
      bullets: [
        "<b>Pure brass</b> hand bell with the rich, deep tone prescribed in Vedic tradition.",
        "<b>Om symbol</b> embossed on the handle for daily worship.",
        "<b>9 graduated sizes</b> — pick a small bell for personal aarti or a large one for the home temple.",
        "<b>Fancy &amp; meenakari variants</b> with intricate lacquer coat for festive use.",
        "<b>Hand-tuned</b> for a clear, lasting resonance that purifies the space.",
      ],
      specs: [
        { k: "Material", v: "Pure Brass" },
        { k: "Sizes", v: "1 / 2 / 3 / 4 / 5 / 6 / 7 / 8 / 9" },
        { k: "Finishes", v: "Golden Polish · Matt · Meenakari" },
        { k: "Best For", v: "Daily Aarti, Pooja, Mandir" },
      ],
    }),
    images: [`${IMG}/pooja_ghanti-1.jpg`, `${IMG}/pooja_ghanti-2.jpg`, `${IMG}/pooja_ghanti-3.jpg`, `${IMG}/pooja_ghanti-4.jpg`],
    imageAlts: [
      "Brass Pooja Ghanti - Hand bell with Om symbol on handle",
    ],
  },

  // 2. Mandir Ghanta — temple bell + color/meenakari + ghadiyal
  {
    slug: "vedic-tatva-mandir-ghanta-temple-bell",
    name: "Vedic Tatva Mandir Ghanta — Large Hanging Brass Temple Bell (500 g – 21 kg)",
    shortDesc: "Heavy-cast pure brass Mandir Ghanta — the large hanging temple bell that announces aarti and welcomes the divine. Available from 500 g for home mandir up to 21 kg for temples, plus meenakari color finish and matching Ghadiyal.",
    price: 999,
    mrp: 1799,
    highlights: [
      "Heavy-cast pure brass — deep, lasting temple sound",
      "Available from 500 g (home mandir) up to 21 kg (community temple)",
      "Includes mounting chain &amp; clapper",
      "Color Meenakari version available — vibrant lacquer finish",
      "Matching Ghadiyal (gong) also available — ring at start of aarti",
    ],
    features: [
      "Material: Heavy-cast pure brass",
      "Weights: 500 g, 1 kg, 2 kg, 3 kg, 5 kg, 10 kg, 15 kg, 21 kg",
      "Variants: Plain golden, Color Meenakari, Ghadiyal (gong)",
      "Includes: Brass chain + clapper",
      "Use: Home mandir, community temple, aarti announcement",
    ],
    variations: [
      { label: "500 g — Home Mandir", price: 999 },
      { label: "1 kg",                price: 1599 },
      { label: "2 kg",                price: 2799 },
      { label: "3 kg",                price: 3999 },
      { label: "5 kg",                price: 6499 },
      { label: "10 kg",               price: 12499 },
      { label: "15 kg",               price: 17999 },
      { label: "21 kg — Temple",      price: 24999 },
      { label: "Meenakari Color 1 kg", price: 2299 },
      { label: "Ghadiyal (Gong) 1 kg", price: 1899 },
    ],
    badge: "Heavy Cast",
    hsn: "7418",
    gst: 12,
    rich: aplus({
      title: "Mandir Ghanta — Hanging Temple Bell",
      tagline: "Heavy brass · Deep resonance · Temple grade",
      bullets: [
        "<b>Heavy-cast pure brass</b> — produces the deep, rolling temple sound.",
        "<b>Hangs from a brass chain</b> — ready to install in your mandir doorway.",
        "<b>Wide weight range</b> — from compact 500 g for home to 21 kg for temples.",
        "<b>Meenakari color</b> variant available for festive interiors.",
        "<b>Includes clapper</b> — pre-tuned for the perfect resonant strike.",
      ],
      specs: [
        { k: "Material", v: "Heavy-cast Pure Brass" },
        { k: "Weight Range", v: "500 g – 21 kg" },
        { k: "Variants", v: "Plain · Meenakari · Ghadiyal" },
        { k: "Best For", v: "Home Mandir, Temple, Aarti" },
      ],
    }),
    images: [`${IMG}/mandir_ghanta-1.jpg`],
    imageAlts: [
      "Mandir Ghanta - Large hanging brass temple bell with chain",
    ],
  },

  // 3. Zinc decorative bells
  {
    slug: "vedic-tatva-zinc-decorative-bell-collection",
    name: "Vedic Tatva Zinc Decorative Bell — Morpankh, Garud, Gold-Silver &amp; Copper Finish",
    shortDesc: "Beautifully crafted decorative zinc bells in 4 traditional designs — Morpankh (peacock feather), Garud (eagle), Gold-Silver duo finish and Copper finish. Lightweight, ornate and perfect as decorative pooja or door-hang bells.",
    price: 449,
    mrp: 799,
    highlights: [
      "4 ornate designs — Morpankh, Garud, Gold-Silver, Copper finish",
      "Premium zinc alloy — detailed castings with rich character",
      "Lightweight yet bright sound — ideal as door, mandir or balcony bell",
      "Decorative finishes that complement brass pooja items",
      "Single box packed — gift-ready",
    ],
    features: [
      "Material: Zinc alloy with decorative finish",
      "Designs: Morpankh (peacock), Garud (eagle), Gold-Silver, Copper Finish",
      "Mount: Chain or hook (included)",
      "Use: Decorative mandir bell, door bell, balcony hang",
      "Care: Wipe with soft dry cloth",
    ],
    variations: [
      { label: "Zinc Morpankh Bell",        price: 449 },
      { label: "Zinc Garud Bell",           price: 499 },
      { label: "Zinc Ghanti — Gold-Silver", price: 549 },
      { label: "Zinc Ghanti — Copper Finish", price: 599 },
    ],
    badge: "Decorative",
    hsn: "8306",
    gst: 12,
    rich: aplus({
      title: "Zinc Decorative Bells",
      tagline: "Morpankh · Garud · Gold-Silver · Copper finish",
      bullets: [
        "<b>4 ornate designs</b> — pick the one that matches your mandir aesthetic.",
        "<b>Premium zinc alloy castings</b> — fine detail in every feather and motif.",
        "<b>Bright resonant sound</b> — pleasant for door and mandir use.",
        "<b>Decorative finishes</b> that pair beautifully with brass pooja items.",
        "<b>Lightweight</b> — easy to hang anywhere.",
      ],
      specs: [
        { k: "Material", v: "Zinc Alloy" },
        { k: "Designs", v: "Morpankh · Garud · Gold-Silver · Copper" },
        { k: "Mount", v: "Chain or hook included" },
        { k: "Best For", v: "Mandir, Door, Decor" },
      ],
    }),
    images: [`${IMG}/zinc_bell-1.jpg`, `${IMG}/zinc_bell-2.jpg`, `${IMG}/zinc_bell-3.jpg`, `${IMG}/zinc_bell-4.jpg`],
    imageAlts: [
      "Zinc Decorative Bell - Morpankh peacock feather design with copper-silver finish",
    ],
  },

  // 4. Akhand Jot — Durga Akhand + plain Akhand Jot + Kaanch Jot 8/10/12
  {
    slug: "vedic-tatva-akhand-jot-brass-diya-glass-cover",
    name: "Vedic Tatva Akhand Jot — Brass Eternal Flame Lamp with Glass Cover",
    shortDesc: "Traditional brass Akhand Jot — the eternal flame lamp lit during Navratri, Durga Puja and continuous worship. Glass cover protects the flame; available in plain, Durga and Kaanch Jot 8&quot;/10&quot;/12&quot; sizes.",
    price: 599,
    mrp: 999,
    highlights: [
      "Pure brass base with clear glass cover — flame stays lit for hours",
      "Plain, Durga Akhand and Kaanch Jot variants available",
      "Sizes 8&quot;, 10&quot;, 12&quot; for home or community puja",
      "Wide oil reservoir — burns continuously through Navratri",
      "Glass also available separately as replacement",
    ],
    features: [
      "Material: Brass + clear borosilicate glass",
      "Sizes: 8 inch, 10 inch, 12 inch",
      "Variants: Akhand Jot (plain), Durga Akhand Diya, Kaanch Jot",
      "Use: Navratri, Durga Puja, continuous akhand worship",
      "Care: Wash glass with mild soap; polish brass with lemon",
    ],
    variations: [
      { label: "Akhand Jot — 8 inch",        price: 599 },
      { label: "Akhand Jot — 10 inch",       price: 799 },
      { label: "Akhand Jot — 12 inch",       price: 1099 },
      { label: "Durga Akhand Diya — 10 inch", price: 999 },
      { label: "Kaanch Jot — 8 inch",        price: 549 },
      { label: "Kaanch Jot — 10 inch",       price: 749 },
      { label: "Kaanch Jot — 12 inch",       price: 999 },
    ],
    badge: "Eternal Flame",
    hsn: "7418",
    gst: 12,
    rich: aplus({
      title: "Akhand Jot — Eternal Brass Lamp",
      tagline: "Brass + glass · Continuous flame · Navratri ready",
      bullets: [
        "<b>Wide oil reservoir</b> burns through the night — perfect for Navratri akhand jyot.",
        "<b>Glass cover</b> shields the flame from drafts; visible 360°.",
        "<b>Pure brass base</b> with sturdy stand and engraved detail.",
        "<b>Multiple sizes</b> — 8&quot; for personal mandir, 12&quot; for living room shrine.",
        "<b>Durga &amp; Kaanch variants</b> for traditional Bengali and Northern styles.",
      ],
      specs: [
        { k: "Material", v: "Brass + Glass" },
        { k: "Sizes", v: "8 / 10 / 12 inch" },
        { k: "Variants", v: "Plain · Durga · Kaanch" },
        { k: "Best For", v: "Navratri, Durga Puja" },
      ],
    }),
    images: [`${IMG}/akhand_jot-1.jpg`, `${IMG}/akhand_jot-2.jpg`, `${IMG}/akhand_jot-3.jpg`, `${IMG}/akhand_jot-4.jpg`, `${IMG}/akhand_jot-5.jpg`, `${IMG}/akhand_jot-6.jpg`],
    imageAlts: [
      "Akhand Jot - Tall brass eternal flame lamp with clear glass cover",
    ],
  },

  // 5. Screw Jot Diya
  {
    slug: "vedic-tatva-screw-jot-brass-diya-collection",
    name: "Vedic Tatva Screw Jot Brass Diya — Normal, Heavy, Meena &amp; Om Designs",
    shortDesc: "Brass Screw Jot oil lamp with screw-top cap to refill oil mess-free. Available in 4 designs — Normal, Heavy, Meenakari and engraved Om — for daily aarti and akhand jyot.",
    price: 349,
    mrp: 599,
    highlights: [
      "Screw-top cap — refill oil cleanly without spillage",
      "Four designs: Normal, Heavy, Meenakari, Om engraving",
      "Pure brass — develops a beautiful golden patina",
      "Tall flame — visible across the room",
      "Compact size — fits any home mandir",
    ],
    features: [
      "Material: Pure Brass",
      "Variants: Screw Jot Normal, Heavy, Meena (Meenakari), Om",
      "Cap: Screw-top — refill mess-free",
      "Use: Daily aarti, mandir, akhand jyot",
      "Care: Polish with lemon &amp; salt",
    ],
    variations: [
      { label: "Screw Jot — Normal", price: 349 },
      { label: "Screw Jot — Heavy",  price: 549 },
      { label: "Screw Jot — Meena",  price: 649 },
      { label: "Screw Jot — Om",     price: 449 },
    ],
    badge: "Mess-Free Refill",
    hsn: "7418",
    gst: 12,
    rich: aplus({
      title: "Screw Jot Brass Diya",
      tagline: "Screw-top · Refill clean · 4 designs",
      bullets: [
        "<b>Patented screw cap</b> — refill ghee or oil without spillage.",
        "<b>Heavy variant</b> — extra-thick brass for serious daily worship.",
        "<b>Meenakari variant</b> — vibrant lacquer enamel for festive use.",
        "<b>Om engraved variant</b> — sacred symbol on the cap.",
        "<b>Tall, steady flame</b> — perfect for daily aarti.",
      ],
      specs: [
        { k: "Material", v: "Pure Brass" },
        { k: "Variants", v: "Normal · Heavy · Meena · Om" },
        { k: "Cap", v: "Screw-top refill" },
        { k: "Best For", v: "Daily Aarti, Akhand Jyot" },
      ],
    }),
    images: [`${IMG}/screw_jot-1.jpg`, `${IMG}/screw_jot-2.jpg`, `${IMG}/screw_jot-3.jpg`, `${IMG}/screw_jot-4.jpg`],
    imageAlts: [
      "Screw Jot Brass Diya - With Om engraved screw-top cap",
    ],
  },

  // 6. Standing Diya / Welcome Deep / Mor Deep / Piller Jot
  {
    slug: "vedic-tatva-standing-diya-welcome-deep-mor-pankh",
    name: "Vedic Tatva Standing Diya / Welcome Deep — Brass Floor Lamp with Peacock Top (10&quot;–60&quot;)",
    shortDesc: "Tall brass standing pooja lamp / welcome deep with peacock crown — the traditional floor diya placed at temple entrances and home mandirs. Available from compact 10&quot; to majestic 60&quot;, plus matching Piller Jot variants.",
    price: 1499,
    mrp: 2499,
    highlights: [
      "Tall floor-standing brass diya — temple-style welcome lamp",
      "Peacock (mor) crown on top — auspicious traditional design",
      "Sizes from 10&quot; (table) to 60&quot; (entrance)",
      "Sturdy bell-shaped weighted base — won&apos;t tip over",
      "Piller Jot variants in 4 sizes also available",
    ],
    features: [
      "Material: Pure Brass",
      "Sizes: 10, 12, 18, 24, 30, 36, 48, 60 inch",
      "Variants: Mor Deep, Welcome Deep, Standing Jot, Piller Jot (sizes 1-4)",
      "Base: Heavy bell-shaped, polished",
      "Use: Mandir entrance, doorway welcome, hall lamp",
    ],
    variations: [
      { label: "Standing Jot — 12 inch",  price: 1499 },
      { label: "Standing Jot — 18 inch",  price: 2299 },
      { label: "Standing Jot — 24 inch",  price: 3499 },
      { label: "Standing Jot — 30 inch",  price: 4999 },
      { label: "Standing Jot — 36 inch",  price: 6999 },
      { label: "Standing Jot — 48 inch",  price: 9999 },
      { label: "Mor Deep / Welcome Deep — 10 inch", price: 1299 },
      { label: "Welcome Deep — 24 inch",  price: 4499 },
      { label: "Welcome Deep — 36 inch",  price: 7499 },
      { label: "Welcome Deep — 60 inch",  price: 14999 },
      { label: "Piller Jot — Size 1 (sm)", price: 1799 },
      { label: "Piller Jot — Size 2",     price: 2499 },
      { label: "Piller Jot — Size 3",     price: 3299 },
      { label: "Piller Jot — Size 4 (lg)", price: 4499 },
    ],
    badge: "Temple Style",
    hsn: "7418",
    gst: 12,
    rich: aplus({
      title: "Standing Diya / Welcome Deep",
      tagline: "Tall brass · Mor crown · Mandir entrance",
      bullets: [
        "<b>Tall floor-standing</b> brass diya — the iconic temple welcome lamp.",
        "<b>Peacock (mor) crown</b> on top — invokes Lord Subramanya/Krishna&apos;s auspicious mount.",
        "<b>Wide size range</b> — 10&quot; for table-top up to 60&quot; for grand mandir entrances.",
        "<b>Heavy weighted base</b> — sturdy and tip-resistant.",
        "<b>Piller Jot variants</b> — sleek pillar-style lamps in 4 graduated sizes.",
      ],
      specs: [
        { k: "Material", v: "Pure Brass" },
        { k: "Heights", v: "10 / 12 / 18 / 24 / 30 / 36 / 48 / 60 inch" },
        { k: "Crown", v: "Peacock (Mor)" },
        { k: "Best For", v: "Mandir Entrance, Doorway, Hall" },
      ],
    }),
    images: [`${IMG}/standing_diya-1.jpg`, `${IMG}/standing_diya-2.jpg`, `${IMG}/standing_diya-3.jpg`],
    imageAlts: [
      "Standing Diya - Tall brass welcome lamp with peacock crown",
    ],
  },

  // 7. Decorative diyas
  {
    slug: "vedic-tatva-decorative-brass-diyas-collection",
    name: "Vedic Tatva Decorative Brass Diyas — Paro, Kamal, Cup, Om Goblet, Pital Jaali &amp; Arpan",
    shortDesc: "Curated set of small ornate brass pooja diyas — Paro Meenakari, Kamal Deepak (lotus), Cup Deep, Om Goblet, Pital Jaali (jali pattern), and Arpan Diya. Each design carries its own spiritual symbolism.",
    price: 249,
    mrp: 499,
    highlights: [
      "6 traditional decorative diya designs in one collection",
      "Lotus (Kamal), Om Goblet, Cup, Jaali pattern &amp; more",
      "Paro Meenakari with vibrant enamel finish",
      "Arpan Diya for naivedya offerings",
      "Mix &amp; match — buy individual or as a set",
    ],
    features: [
      "Material: Pure Brass (Meenakari variants have lacquer enamel)",
      "Designs: Paro Meenakari, Kamal Deepak (size 1, 2), Cup Deep, Om Goblet, Pital Jaali, Akhand Jot, Arpan Diya",
      "Use: Festive aarti, Diwali, daily mandir decor",
      "Care: Wipe dry; do not soak meenakari pieces",
    ],
    variations: [
      { label: "Paro Meenakari Diya",   price: 349 },
      { label: "Kamal Deepak — Size 1", price: 249 },
      { label: "Kamal Deepak — Size 2", price: 349 },
      { label: "Cup Deep",              price: 199 },
      { label: "Om Goblet Diya",        price: 299 },
      { label: "Pital Jaali Diya",      price: 449 },
      { label: "Arpan Diya",            price: 279 },
    ],
    badge: "Designer Collection",
    hsn: "7418",
    gst: 12,
    rich: aplus({
      title: "Decorative Brass Diyas",
      tagline: "Lotus · Om · Jaali · Meenakari · Arpan",
      bullets: [
        "<b>Kamal Deepak (Lotus)</b> — symbol of purity, blooms even in muddy waters.",
        "<b>Om Goblet</b> — sacred Om engraved on a tall goblet stem.",
        "<b>Pital Jaali</b> — intricate jaali (lattice) pattern casts beautiful flame shadows.",
        "<b>Paro Meenakari</b> — vibrant enamel work in traditional reds, greens and blues.",
        "<b>Arpan Diya</b> — designed for naivedya, the ritual food offering.",
      ],
      specs: [
        { k: "Material", v: "Pure Brass + Meenakari" },
        { k: "Designs", v: "Kamal · Cup · Om Goblet · Jaali · Arpan · Paro" },
        { k: "Use", v: "Festive Aarti, Diwali, Daily Mandir" },
        { k: "Best For", v: "Decor, Gifting, Daily Pooja" },
      ],
    }),
    images: [`${IMG}/decorative_diyas-1.jpg`, `${IMG}/decorative_diyas-2.jpg`, `${IMG}/decorative_diyas-3.jpg`, `${IMG}/decorative_diyas-4.jpg`, `${IMG}/decorative_diyas-5.jpg`, `${IMG}/decorative_diyas-6.jpg`, `${IMG}/decorative_diyas-7.jpg`],
    imageAlts: [
      "Decorative Brass Diyas - Lotus, Om Goblet, Cup and Meenakari designs in a row",
    ],
  },

  // 8. Laxmi Deepak family
  {
    slug: "vedic-tatva-laxmi-deepak-brass-diya-collection",
    name: "Vedic Tatva Laxmi Deepak — 5-Step Brass Diya with Goddess Laxmi Embossed",
    shortDesc: "Traditional Laxmi Deepak — the stepped brass diya with Goddess Laxmi embossed on the back panel, lit on Diwali, Lakshmi Puja and Margashirsha Thursday. Available in 5-Step, Plain, Bhari (heavy), Lakdi (wood) Handle and Meenakari Handle versions.",
    price: 449,
    mrp: 799,
    highlights: [
      "Goddess Laxmi figure embossed on back panel",
      "Stepped (5-step) design — invokes Sri Yantra geometry",
      "5 variants: 5-Step, Plain, Bhari (heavy), Wood Handle, Meenakari Handle",
      "Pure brass — durable, polished golden finish",
      "Especially auspicious on Diwali, Lakshmi Puja, Thursday",
    ],
    features: [
      "Material: Pure Brass (handle variants have wood / meenakari)",
      "Variants: 5-Step Deepak, Laxmi Deepak (plain), Laxmi Deepak Bhari (heavy), Laxmideep Lakdi Handle, Handle Diya Meenakari",
      "Symbolism: Goddess Laxmi embossed back panel",
      "Use: Diwali, Lakshmi Puja, Thursday worship",
      "Care: Polish with lemon &amp; salt",
    ],
    variations: [
      { label: "5-Step Deepak",              price: 449 },
      { label: "Laxmi Deepak — Standard",    price: 549 },
      { label: "Laxmi Deepak Bhari (heavy)", price: 849 },
      { label: "Laxmi Deepak — Wood Handle", price: 699 },
      { label: "Handle Diya — Meenakari",    price: 899 },
    ],
    badge: "Diwali Special",
    hsn: "7418",
    gst: 12,
    rich: aplus({
      title: "Laxmi Deepak Family",
      tagline: "Goddess Laxmi embossed · 5-step · Diwali",
      bullets: [
        "<b>Goddess Laxmi figure</b> embossed on the back — invokes prosperity.",
        "<b>5-step design</b> mirrors the Sri Yantra geometry.",
        "<b>Bhari (heavy) variant</b> — extra-thick brass for serious worship.",
        "<b>Wood handle &amp; meenakari handle</b> — comfortable to carry during aarti.",
        "<b>Diwali essential</b> — especially auspicious on Lakshmi Puja and Thursdays.",
      ],
      specs: [
        { k: "Material", v: "Brass · Wood · Meenakari" },
        { k: "Variants", v: "5-Step · Standard · Bhari · Wood · Meena" },
        { k: "Symbolism", v: "Sri Yantra + Goddess Laxmi" },
        { k: "Best For", v: "Diwali, Lakshmi Puja, Thursday" },
      ],
    }),
    images: [`${IMG}/laxmi_deepak-1.jpg`, `${IMG}/laxmi_deepak-2.jpg`, `${IMG}/laxmi_deepak-3.jpg`],
    imageAlts: [
      "Laxmi Deepak - 5-Step brass diya with Goddess Laxmi embossed back panel",
    ],
  },

  // 9. Kuber Deepak set
  {
    slug: "vedic-tatva-kuber-deepak-set-kachua-fancy",
    name: "Vedic Tatva Kuber Deepak Set — Kachua, Plain &amp; Fancy Brass Diyas",
    shortDesc: "Kuber Deepak set dedicated to Lord Kuber, the deity of wealth. Three designs — Kachua (tortoise-shaped), Plain Kuber Dia and Fancy Kuber — believed to attract financial prosperity when lit on Dhanteras, Diwali and Friday.",
    price: 549,
    mrp: 999,
    highlights: [
      "Dedicated to Lord Kuber — deity of wealth and prosperity",
      "Three designs: Kachua (tortoise), Plain Kuber, Fancy Kuber",
      "Polished pure brass with embossed Kuber motif",
      "Especially auspicious on Dhanteras &amp; Diwali",
      "Compact size — fits perfectly in cash boxes &amp; lockers",
    ],
    features: [
      "Material: Pure Brass",
      "Variants: Kuber Kachua (tortoise), Kuber Dia (plain), Kuber Fancy",
      "Symbolism: Lord Kuber + Vastu tortoise",
      "Use: Dhanteras, Diwali, Friday wealth puja",
      "Care: Wipe dry; polish with lemon",
    ],
    variations: [
      { label: "Kuber Kachua (Tortoise)", price: 549 },
      { label: "Kuber Dia (Plain)",       price: 449 },
      { label: "Kuber Fancy",             price: 699 },
    ],
    badge: "Wealth Magnet",
    hsn: "7418",
    gst: 12,
    rich: aplus({
      title: "Kuber Deepak Set",
      tagline: "Lord Kuber · Wealth · Dhanteras",
      bullets: [
        "<b>Dedicated to Lord Kuber</b> — the Vedic deity of wealth and treasure.",
        "<b>Kachua (tortoise) design</b> combines Kuber with Vastu auspicious tortoise.",
        "<b>Compact size</b> — keep one in your cash box, locker or business desk.",
        "<b>Diwali &amp; Dhanteras essential</b> — light it for Lakshmi-Kuber wealth puja.",
        "<b>Pure brass</b> with embossed Kuber motif and polished golden finish.",
      ],
      specs: [
        { k: "Material", v: "Pure Brass" },
        { k: "Variants", v: "Kachua · Plain · Fancy" },
        { k: "Deity", v: "Lord Kuber" },
        { k: "Best For", v: "Dhanteras, Diwali, Friday Puja" },
      ],
    }),
    images: [`${IMG}/kuber_set-1.jpg`, `${IMG}/kuber_set-2.jpg`, `${IMG}/kuber_set-3.jpg`],
    imageAlts: [
      "Kuber Deepak Set - Brass tortoise and fancy lamp with Lord Kuber motif",
    ],
  },

  // 10. Brass Vastu Tortoise + Brass Parat
  {
    slug: "vedic-tatva-brass-vastu-tortoise-parat-set",
    name: "Vedic Tatva Brass Vastu Tortoise &amp; Brass Parat — Auspicious Vastu Set",
    shortDesc: "Solid brass Vastu Tortoise (Kachua) — the powerful Vastu symbol of patience, longevity and steady prosperity — paired with a polished brass Parat (puja tray) for offerings.",
    price: 599,
    mrp: 999,
    highlights: [
      "Solid brass Kachua — popular Vastu / Feng Shui symbol",
      "Brass Parat (large puja tray) for naivedya &amp; aarti offerings",
      "Place Tortoise facing North or East for prosperity",
      "Polished golden finish — ages beautifully",
      "Sold separately or as a complete Vastu set",
    ],
    features: [
      "Material: Solid Brass",
      "Brass Tortoise sizes: Small, Medium, Large",
      "Brass Parat sizes: 8&quot;, 10&quot;, 12&quot;, 14&quot;",
      "Use: Vastu, daily puja, naivedya offering",
      "Care: Wipe dry; polish occasionally",
    ],
    variations: [
      { label: "Brass Tortoise — Small",  price: 599 },
      { label: "Brass Tortoise — Medium", price: 899 },
      { label: "Brass Tortoise — Large",  price: 1399 },
      { label: "Brass Parat — 8 inch",    price: 799 },
      { label: "Brass Parat — 10 inch",   price: 1099 },
      { label: "Brass Parat — 12 inch",   price: 1499 },
      { label: "Brass Parat — 14 inch",   price: 1999 },
    ],
    badge: "Vastu Auspicious",
    hsn: "7418",
    gst: 12,
    rich: aplus({
      title: "Brass Tortoise + Parat",
      tagline: "Vastu Kachua · Pooja tray · Auspicious",
      bullets: [
        "<b>Brass Vastu Tortoise</b> — symbol of patience, longevity and slow steady wealth.",
        "<b>Place facing North or East</b> for the strongest Vastu effect.",
        "<b>Polished brass Parat</b> — wide tray for aarti, naivedya and abhishek offerings.",
        "<b>Solid heavy brass</b> — premium feel that lasts generations.",
        "<b>Auspicious gifting</b> — popular for housewarming, weddings, business openings.",
      ],
      specs: [
        { k: "Material", v: "Solid Brass" },
        { k: "Tortoise Sizes", v: "Small / Medium / Large" },
        { k: "Parat Sizes", v: "8 / 10 / 12 / 14 inch" },
        { k: "Best For", v: "Vastu, Pooja, Gifting" },
      ],
    }),
    images: [`${IMG}/brass_tortoise-1.jpg`, `${IMG}/brass_tortoise-2.jpg`],
    imageAlts: [
      "Brass Vastu Tortoise - Solid brass kachua on round plate",
    ],
  },

  // 11. Copper bottle 1L
  {
    slug: "vedic-tatva-copper-water-bottle-1-litre-ayurvedic",
    name: "Vedic Tatva Pure Copper Water Bottle (1000 ml) — Ayurvedic Hammered Finish",
    shortDesc: "100% pure copper water bottle, 1 litre, hammered finish — store water overnight as per Ayurveda for natural health benefits. Leak-proof screw cap, food-grade, BPA-free.",
    price: 599,
    mrp: 1199,
    highlights: [
      "100% pure copper — Ayurvedic Tamra Jal benefits",
      "1000 ml capacity — full daily intake",
      "Hammered finish — premium artisan look",
      "Leak-proof screw cap with silicone seal",
      "BPA-free, food-grade, joint-less seamless construction",
    ],
    features: [
      "Material: 100% Pure Copper",
      "Capacity: 1000 ml",
      "Finish: Hammered exterior, smooth interior",
      "Cap: Leak-proof screw type",
      "Care: Hand-wash with lemon &amp; salt; do not microwave",
    ],
    badge: "Ayurvedic",
    hsn: "7418",
    gst: 12,
    rich: aplus({
      title: "Pure Copper Water Bottle",
      tagline: "1 litre · Hammered · Ayurvedic Tamra Jal",
      bullets: [
        "<b>100% pure copper</b> — store water 6-8 hours for traditional Tamra Jal benefits.",
        "<b>1 litre capacity</b> — covers daily Ayurvedic recommended intake.",
        "<b>Hammered exterior</b> — beautiful artisan finish that hides minor marks.",
        "<b>Leak-proof screw cap</b> with silicone seal — carry safely in any bag.",
        "<b>Food-grade, BPA-free</b> — pure copper without lacquer interior.",
      ],
      specs: [
        { k: "Material", v: "100% Pure Copper" },
        { k: "Capacity", v: "1000 ml" },
        { k: "Finish", v: "Hammered" },
        { k: "Best For", v: "Daily Drinking, Office, Travel" },
      ],
    }),
    images: [`${IMG}/copper_bottle-1.jpg`],
    imageAlts: [
      "Copper Water Bottle - 1L hammered pure copper with screw cap",
    ],
  },

  // 12. Lota collection
  {
    slug: "vedic-tatva-brass-copper-lota-collection-kalash",
    name: "Vedic Tatva Brass &amp; Copper Lota Collection — Matki, Embose, Diamond, Kalash, Everest, Paragi &amp; Steel",
    shortDesc: "Complete pooja lota collection — the small ritual water vessel used for abhishek, snan and ritual sankalp. 7 designs in brass, copper and steel, multiple sizes — covers every household need.",
    price: 199,
    mrp: 449,
    highlights: [
      "7 traditional lota designs — Matki, Embose, Diamond, Kalash, Everest, Paragi, Steel",
      "Brass, copper and steel options",
      "Lota Everest available in sizes 2 to 9",
      "Paragi Lota in sizes 00 to 4 (mini ritual)",
      "Steel Lota sizes 8, 9, 10 for daily use",
    ],
    features: [
      "Materials: Brass, Copper, Stainless Steel",
      "Variants: Matki Lota, Embose Lota, Diamond Lota, Brass Kalash, Lota Everest (sz 2-9), Steel Lota (8/9/10), Paragi Lota (sz 00-4)",
      "Use: Abhishek, snan, sankalp, daily pooja jal",
      "Care: Polish brass/copper with lemon; steel dishwasher safe",
    ],
    variations: [
      { label: "Matki Lota — Brass",        price: 299 },
      { label: "Embose Lota — Brass",       price: 349 },
      { label: "Diamond Lota — Brass",      price: 399 },
      { label: "Brass Kalash — Standard",   price: 449 },
      { label: "Lota Everest — Size 2",     price: 199 },
      { label: "Lota Everest — Size 4",     price: 279 },
      { label: "Lota Everest — Size 6",     price: 399 },
      { label: "Lota Everest — Size 9",     price: 599 },
      { label: "Steel Lota — Size 8",       price: 149 },
      { label: "Steel Lota — Size 9",       price: 179 },
      { label: "Steel Lota — Size 10",      price: 219 },
      { label: "Paragi Lota — Size 00",     price: 99 },
      { label: "Paragi Lota — Size 2",      price: 159 },
      { label: "Paragi Lota — Size 4",      price: 229 },
    ],
    badge: "7 Designs",
    hsn: "7418",
    gst: 12,
    rich: aplus({
      title: "Brass &amp; Copper Lota Collection",
      tagline: "7 designs · Brass · Copper · Steel",
      bullets: [
        "<b>Matki Lota</b> — round pot-shape, traditional and graceful.",
        "<b>Embose &amp; Diamond Lota</b> — decorative embossed surfaces for festive use.",
        "<b>Brass Kalash</b> — wide-mouth ritual vessel for abhishek and sankalp.",
        "<b>Lota Everest</b> in 8 graduated sizes (2-9) — pick by household size.",
        "<b>Steel &amp; Paragi options</b> — affordable, easy-care alternatives for daily use.",
      ],
      specs: [
        { k: "Materials", v: "Brass · Copper · Steel" },
        { k: "Designs", v: "Matki · Embose · Diamond · Kalash · Everest · Paragi · Steel" },
        { k: "Sizes", v: "00 – 10 (depending on variant)" },
        { k: "Best For", v: "Abhishek, Snan, Sankalp, Daily Pooja" },
      ],
    }),
    images: [`${IMG}/lota_collection-1.jpg`, `${IMG}/lota_collection-2.jpg`, `${IMG}/lota_collection-3.jpg`, `${IMG}/lota_collection-4.jpg`, `${IMG}/lota_collection-5.jpg`, `${IMG}/lota_collection-6.jpg`, `${IMG}/lota_collection-7.jpg`, `${IMG}/lota_collection-8.jpg`, `${IMG}/lota_collection-9.jpg`, `${IMG}/lota_collection-10.jpg`],
    imageAlts: [
      "Brass Copper Lota Collection - Matki, Embose, Diamond and Kalash designs",
    ],
  },

  // 13. Panchpatra & Aachmani Set
  {
    slug: "vedic-tatva-panchpatra-aachmani-set-brass-copper",
    name: "Vedic Tatva Panchpatra &amp; Aachmani Set — Brass &amp; Copper Ritual Sip Vessel with Spoon",
    shortDesc: "Complete Panchpatra (small ritual water vessel) and Aachmani (sip spoon) set used for daily achaman purification ritual. Available in brass, copper, plain Kordaar, Ring &amp; Gilassi designs, with matching Aachmani in 3 styles.",
    price: 349,
    mrp: 649,
    highlights: [
      "Panchpatra + Aachmani — the essential ritual sip set",
      "5 panchpatra designs: Kordaar, Ring, Gilassi, Brass, Copper",
      "3 aachmani designs: Designer, Normal, Copper",
      "Used for daily achaman, sankalp and shuddhi purification",
      "Sold individually or as combo set",
    ],
    features: [
      "Material: Pure Brass &amp; Pure Copper",
      "Panchpatra variants: Kordaar, Ring, Gilassi, Copper Panchpatra, Pital Panchpatra",
      "Aachmani variants: Designer, Normal, Copper",
      "Use: Daily achaman, sankalp, sandhya vandan, shuddhi",
      "Care: Polish with lemon; do not soak overnight",
    ],
    variations: [
      { label: "Panchpatra Kordaar — Brass", price: 349 },
      { label: "Panchpatra Ring — Brass",    price: 379 },
      { label: "Panchpatra Gilassi — Brass", price: 399 },
      { label: "Panchpatra — Copper",        price: 449 },
      { label: "Panchpatra — Pital Heavy",   price: 549 },
      { label: "Aachmani Designer",          price: 199 },
      { label: "Aachmani Normal",            price: 149 },
      { label: "Aachmani Copper",            price: 229 },
      { label: "Combo: Panchpatra + Aachmani (Brass)", price: 499 },
    ],
    badge: "Ritual Set",
    hsn: "7418",
    gst: 12,
    rich: aplus({
      title: "Panchpatra &amp; Aachmani Set",
      tagline: "Brass &amp; copper · Achaman ritual",
      bullets: [
        "<b>Panchpatra</b> holds the sacred sip water for achaman purification.",
        "<b>Aachmani spoon</b> — designed to deliver three precise sips as per shastra.",
        "<b>5 panchpatra designs</b> — Kordaar (handled), Ring, Gilassi, plain brass, copper.",
        "<b>3 aachmani designs</b> — Designer, Normal and Copper.",
        "<b>Daily ritual essential</b> — used in sandhya vandan, sankalp and shuddhi.",
      ],
      specs: [
        { k: "Material", v: "Brass &amp; Copper" },
        { k: "Panchpatra", v: "Kordaar · Ring · Gilassi · Brass · Copper" },
        { k: "Aachmani", v: "Designer · Normal · Copper" },
        { k: "Best For", v: "Achaman, Sandhya Vandan, Sankalp" },
      ],
    }),
    images: [`${IMG}/panchpatra_set-1.jpg`, `${IMG}/panchpatra_set-2.jpg`, `${IMG}/panchpatra_set-3.jpg`, `${IMG}/panchpatra_set-4.jpg`, `${IMG}/panchpatra_set-5.jpg`, `${IMG}/panchpatra_set-6.jpg`],
    imageAlts: [
      "Panchpatra Aachmani Set - Brass ritual sip vessel with matching spoon",
    ],
  },

  // 14. Brass Pooja Thali (multi-size + variants)
  {
    slug: "vedic-tatva-brass-pooja-thali-collection",
    name: "Vedic Tatva Brass Pooja Thali Collection — Pital, Tamba, Meena, Kalash, Daana, Mor, Apple, Tasta &amp; Etching (2&quot;–13&quot;)",
    shortDesc: "Complete pooja thali collection — the engraved brass plate used to arrange aarti items. Sizes from 2&quot; mini to 13&quot; family-size, in plain brass (pital), copper (tamba), meenakari, etching and decorative variants.",
    price: 299,
    mrp: 599,
    highlights: [
      "Sizes from 2&quot; mini to 13&quot; family-size",
      "10 design variants — Pital, Tamba, Daana, Meena, Kalash, Mor, Apple, Tasta, Etching, Kansa",
      "Engraved peacock &amp; floral border patterns",
      "Pure brass / copper / meenakari / kansa (bronze) options",
      "Single &amp; double mor (peacock) plate variants available",
    ],
    features: [
      "Materials: Brass (Pital), Copper (Tamba), Meenakari, Kansa (Bronze)",
      "Sizes: 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 13 inch",
      "Variants: Pital Plate, Tamba Plate, Daana Plate, Meena Plate, Kalash Plate, Double Mor Plate, Apple Thali (12&quot;/13&quot;), Tasta/Khadi Plate, Mor Plate Meenakari, Etching Plate (4-12&quot;), Kansa Thali",
      "Use: Aarti arrangement, naivedya, festive pooja",
      "Care: Hand-wash; polish brass with lemon",
    ],
    variations: [
      { label: "Pital Plate — 2 inch (Mini)",  price: 99  },
      { label: "Pital Plate — 4 inch",         price: 179 },
      { label: "Pital Plate — 6 inch",         price: 299 },
      { label: "Pital Plate — 8 inch",         price: 449 },
      { label: "Pital Plate — 10 inch",        price: 649 },
      { label: "Tamba (Copper) Plate — 6 inch", price: 379 },
      { label: "Tamba Plate — 10 inch",        price: 799 },
      { label: "Daana Plate (Pital)",          price: 549 },
      { label: "Daana Plate (Tamba)",          price: 649 },
      { label: "Meena Plate",                  price: 499 },
      { label: "Kalash Plate",                 price: 599 },
      { label: "Double Mor Plate",             price: 799 },
      { label: "Apple Thali — 12 inch",        price: 899 },
      { label: "Apple Thali — 13 inch",        price: 999 },
      { label: "Tasta / Khadi Plate",          price: 449 },
      { label: "Mor Plate (Meenakari)",        price: 749 },
      { label: "Etching Plate — 4 inch",       price: 249 },
      { label: "Etching Plate — 8 inch",       price: 549 },
      { label: "Etching Plate — 12 inch",      price: 999 },
      { label: "Kansa Thali (Bronze)",         price: 1299 },
    ],
    badge: "10 Variants",
    hsn: "7418",
    gst: 12,
    rich: aplus({
      title: "Brass Pooja Thali Collection",
      tagline: "10 variants · 2&quot;–13&quot; · Pital · Tamba · Meena · Kansa",
      bullets: [
        "<b>Plain Pital plate</b> in 9 graduated sizes from 2&quot; mini to 10&quot; aarti.",
        "<b>Tamba (copper) plates</b> for those who prefer the warm reddish hue.",
        "<b>Meenakari plates</b> with vibrant lacquer enamel for festive use.",
        "<b>Apple Thali</b> — wide flat 12&quot;/13&quot; design popular in temples.",
        "<b>Etching plates</b> in 4-12&quot; with intricate hand-etched border designs.",
        "<b>Kansa thali</b> — classic bronze, also serves as healthy eating plate.",
      ],
      specs: [
        { k: "Materials", v: "Brass · Copper · Meena · Kansa" },
        { k: "Sizes", v: "2 / 4 / 6 / 8 / 10 / 12 / 13 inch" },
        { k: "Variants", v: "10 designs" },
        { k: "Best For", v: "Aarti, Naivedya, Family Bhog" },
      ],
    }),
    images: [`${IMG}/brass_thali-1.jpg`, `${IMG}/brass_thali-2.jpg`, `${IMG}/brass_thali-3.jpg`, `${IMG}/brass_thali-4.jpg`, `${IMG}/brass_thali-5.jpg`, `${IMG}/brass_thali-6.jpg`, `${IMG}/brass_thali-7.jpg`, `${IMG}/brass_thali-8.jpg`, `${IMG}/brass_thali-9.jpg`],
    imageAlts: [
      "Brass Pooja Thali - Engraved round plate with peacock floral border",
    ],
  },

  // 15. Kanha Bhog Set
  {
    slug: "vedic-tatva-kanha-bhog-set-brass-krishna-offering",
    name: "Vedic Tatva Kanha Bhog Set — Brass Krishna Offering Set with Thali, Katoris &amp; Spoon",
    shortDesc: "Traditional Kanha (Lord Krishna) bhog set — small brass thali with multiple matching katori bowls and a tiny ladle, designed to offer makhan-mishri, fruits and naivedya to Bal Gopal. Multiple variants available — plain brass and meena.",
    price: 799,
    mrp: 1499,
    highlights: [
      "Complete bhog set for daily Krishna naivedya",
      "Includes thali + 4-6 matching katoris + spoon",
      "Multiple style variants — plain brass &amp; meenakari",
      "Compact size — perfect for home mandir Bal Gopal",
      "Pure brass — develops a beautiful golden patina",
    ],
    features: [
      "Material: Pure Brass",
      "Set includes: 1 thali + multiple small katoris + 1 small spoon",
      "Variants: Kanha Bhog Set Plain (4 size variants), Meena Bhog Set",
      "Use: Daily makhan-mishri offering, naivedya, fruit bhog",
      "Care: Hand-wash; polish with lemon &amp; salt",
    ],
    variations: [
      { label: "Kanha Bhog Set — Small (4 katori)",  price: 799 },
      { label: "Kanha Bhog Set — Medium (5 katori)", price: 1099 },
      { label: "Kanha Bhog Set — Large (6 katori)",  price: 1499 },
      { label: "Kanha Bhog Set — Premium Heavy",     price: 1999 },
      { label: "Meena Bhog Set",                     price: 1799 },
    ],
    badge: "Krishna Bhog",
    hsn: "7418",
    gst: 12,
    rich: aplus({
      title: "Kanha Bhog Set",
      tagline: "Brass thali · Katoris · Spoon · Krishna naivedya",
      bullets: [
        "<b>Complete bhog set</b> — thali + multiple matching katoris + spoon.",
        "<b>Designed for Bal Gopal</b> — compact, child-deity scale.",
        "<b>4 size options</b> — small (4 katori) to premium heavy (6+ katori).",
        "<b>Meenakari version</b> — vibrant enamel for festive occasions.",
        "<b>Daily makhan-mishri ready</b> — the simplest sweet offering for Krishna.",
      ],
      specs: [
        { k: "Material", v: "Pure Brass / Meena" },
        { k: "Includes", v: "Thali + Katoris + Spoon" },
        { k: "Sizes", v: "Small / Medium / Large / Premium" },
        { k: "Best For", v: "Krishna Naivedya, Bal Gopal" },
      ],
    }),
    images: [`${IMG}/kanha_bhog_set-1.jpg`, `${IMG}/kanha_bhog_set-2.jpg`, `${IMG}/kanha_bhog_set-3.jpg`, `${IMG}/kanha_bhog_set-4.jpg`, `${IMG}/kanha_bhog_set-5.jpg`, `${IMG}/kanha_bhog_set-6.jpg`],
    imageAlts: [
      "Kanha Bhog Set - Brass thali with small katoris and ladle for Krishna offering",
    ],
  },

  // 16. Aarti / Dhoopia / Lobandan
  {
    slug: "vedic-tatva-panch-aarti-dhoopia-lobandan-set",
    name: "Vedic Tatva Panch Aarti, Dhoopia &amp; Lobandan Set — Complete Brass Aarti Collection",
    shortDesc: "Complete brass aarti collection — Panch Aarti (5-wick), Mor Pancharti (peacock 7-wick), Dhoopia (incense burner) in 3 styles, and Lobandan (loban burner) with handle. Everything you need for traditional temple-style aarti.",
    price: 549,
    mrp: 999,
    highlights: [
      "Complete aarti collection — 8 distinct items",
      "Panch Aarti (5-wick) &amp; Mor Pancharti (7-wick peacock)",
      "Dhoopia in Round, Salai &amp; Metal styles",
      "Lobandan with handle &amp; without — for loban incense",
      "Pure brass with polished or oxidized finish",
    ],
    features: [
      "Material: Pure Brass + Wood handle (where applicable)",
      "Variants: Panch Aarti (5-wick), Mor Pancharti (peacock 7-wick), Round Dhoopia, Salai Dhoopia, Metal Dhoopia, Lobandan Handle, Lobandan (no handle), Mor Panch Arti",
      "Use: Daily aarti, dhoop &amp; loban incense rituals",
      "Care: Polish with lemon &amp; salt; clean wax after use",
    ],
    variations: [
      { label: "Panch Aarti (5-wick)",        price: 549 },
      { label: "Mor Pancharti (Peacock 7-wick)", price: 799 },
      { label: "Mor Panch Arti — Heavy",      price: 1099 },
      { label: "Round Dhoopia",               price: 449 },
      { label: "Salai Dhoopia",               price: 379 },
      { label: "Metal Dhoopia",               price: 329 },
      { label: "Lobandan with Handle",        price: 499 },
      { label: "Lobandan (no handle)",        price: 399 },
    ],
    badge: "8-in-1 Set",
    hsn: "7418",
    gst: 12,
    rich: aplus({
      title: "Panch Aarti, Dhoopia &amp; Lobandan",
      tagline: "Complete aarti collection · Brass · Temple style",
      bullets: [
        "<b>Panch Aarti</b> — the classic 5-wick aarti, one wick per element (earth, water, fire, air, ether).",
        "<b>Mor Pancharti</b> — peacock-tail design with 7 wicks for grand temple-style aarti.",
        "<b>Round / Salai / Metal Dhoopia</b> — choose the incense burner that fits your space.",
        "<b>Lobandan</b> with or without handle — for traditional loban &amp; sambrani burning.",
        "<b>Pure brass</b> — heat-tolerant, develops a beautiful patina.",
      ],
      specs: [
        { k: "Material", v: "Pure Brass + Wood" },
        { k: "Aarti", v: "Panch (5-wick) · Mor (7-wick)" },
        { k: "Dhoopia", v: "Round · Salai · Metal" },
        { k: "Best For", v: "Daily Aarti, Loban, Dhoop" },
      ],
    }),
    images: [`${IMG}/aarti_dhoopia-1.jpg`, `${IMG}/aarti_dhoopia-2.jpg`, `${IMG}/aarti_dhoopia-3.jpg`, `${IMG}/aarti_dhoopia-4.jpg`, `${IMG}/aarti_dhoopia-5.jpg`, `${IMG}/aarti_dhoopia-6.jpg`, `${IMG}/aarti_dhoopia-7.jpg`, `${IMG}/aarti_dhoopia-8.jpg`, `${IMG}/aarti_dhoopia-9.jpg`],
    imageAlts: [
      "Panch Aarti and Lobandan - Brass 5-wick aarti with peacock motif and loban burner",
    ],
  },

  // 17. Agarbatti & Agardan stand
  {
    slug: "vedic-tatva-agarbatti-stand-agardan-collection",
    name: "Vedic Tatva Agarbatti Stand &amp; Agardan Collection — Meena, Pasa Dice, Dhoop &amp; Loban Cup Stand",
    shortDesc: "Complete incense accessory set — Meenakari Agardan (incense holder), Pasa (dice-shaped) Agardan, Agarbatti stick stand, Dhoop stand and Steel Loban cup stand. Catches ash and holds incense safely.",
    price: 299,
    mrp: 549,
    highlights: [
      "5 essential incense accessories in one collection",
      "Meenakari Agardan with vibrant peacock motif",
      "Pasa (dice-shape) Agardan — modern compact design",
      "Stainless Steel Loban Cup Stand for cup-style incense",
      "Catches falling ash — keeps mandir clean",
    ],
    features: [
      "Materials: Brass, Meenakari, Stainless Steel",
      "Variants: Meena Agardan, Pasa Agardan (Dice), Agarbatti Stand, Dhoop Stand, Loban Cup Stand (Steel)",
      "Use: Hold lit agarbatti, dhoop &amp; loban cups",
      "Care: Wipe daily; clean ash with soft brush",
    ],
    variations: [
      { label: "Meena Agardan (Meenakari)", price: 449 },
      { label: "Pasa Agardan (Dice-shape)", price: 379 },
      { label: "Agarbatti Stand (Brass)",   price: 299 },
      { label: "Dhoop Stand (Brass)",       price: 329 },
      { label: "Loban Cup Stand (Steel)",   price: 199 },
    ],
    badge: "5-in-1 Set",
    hsn: "7418",
    gst: 12,
    rich: aplus({
      title: "Agarbatti &amp; Agardan Collection",
      tagline: "Meena · Dice · Brass · Steel · Ash-catching",
      bullets: [
        "<b>Meena Agardan</b> — vibrant meenakari enamel with peacock motif.",
        "<b>Pasa (dice) Agardan</b> — compact modern design that won&apos;t tip.",
        "<b>Brass Agarbatti Stand</b> — holds multiple sticks during long pujas.",
        "<b>Brass Dhoop Stand</b> — designed for thicker dhoop sticks.",
        "<b>Steel Loban Cup Stand</b> — perfect for cup-style sambrani &amp; loban.",
      ],
      specs: [
        { k: "Materials", v: "Brass · Meena · Steel" },
        { k: "Variants", v: "5 designs" },
        { k: "Use", v: "Agarbatti, Dhoop, Loban" },
        { k: "Best For", v: "Daily Mandir, Festive Pooja" },
      ],
    }),
    images: [`${IMG}/agarbatti_stand-1.jpg`, `${IMG}/agarbatti_stand-2.jpg`, `${IMG}/agarbatti_stand-3.jpg`, `${IMG}/agarbatti_stand-4.jpg`, `${IMG}/agarbatti_stand-5.jpg`],
    imageAlts: [
      "Agarbatti Stand and Meena Agardan - Brass incense holder with peacock motif",
    ],
  },

  // 18. Kansa Katori Set
  {
    slug: "vedic-tatva-kansa-katori-bronze-bowl-set",
    name: "Vedic Tatva Kansa Katori Set — Pure Bronze Bowls (5 Designs)",
    shortDesc: "Set of traditional Kansa (bronze) katori bowls — used since Ayurvedic times for healthy eating and pooja naivedya. 5 designs: Kangoora, Kansa-Pital, Pure Kansa, Gol (round) and Pendi (footed).",
    price: 449,
    mrp: 799,
    highlights: [
      "Pure Kansa bronze — Ayurvedic approved for healthy eating",
      "5 traditional designs — Kangoora, Kansa-Pital, Kansa, Gol, Pendi",
      "Smooth interior, polished golden bronze finish",
      "Use for naivedya, dahi, ghee, mishri offerings",
      "Develops natural antimicrobial patina",
    ],
    features: [
      "Material: Pure Kansa (bell metal bronze)",
      "Variants: Katori Kangoora, Kansa Katori (Pital alloy), Kansa Katori (Pure), Katori Gol (Round), Katori Pendi (Footed)",
      "Use: Naivedya, dahi, ghee, mishri, daily eating",
      "Care: Hand-wash with mild soap; do not use steel scrubber",
    ],
    variations: [
      { label: "Katori Kangoora — Pair", price: 449 },
      { label: "Kansa Katori (Pital) — Pair", price: 549 },
      { label: "Kansa Katori (Pure) — Pair",  price: 749 },
      { label: "Katori Gol (Round) — Pair",   price: 399 },
      { label: "Katori Pendi (Footed) — Pair", price: 499 },
      { label: "Mixed Set of 5 Katoris",      price: 1799 },
    ],
    badge: "Pure Bronze",
    hsn: "7419",
    gst: 12,
    rich: aplus({
      title: "Kansa Katori — Bronze Bowl Set",
      tagline: "Ayurvedic · Pure bronze · 5 designs",
      bullets: [
        "<b>Pure Kansa bronze</b> — recommended in Ayurveda for daily eating.",
        "<b>5 traditional designs</b> — pick by use: pooja naivedya or daily dining.",
        "<b>Kangoora design</b> — ridged border, classic temple style.",
        "<b>Pendi (footed)</b> design sits stable on uneven surfaces.",
        "<b>Antimicrobial</b> — natural patina from food contact is healthful and traditional.",
      ],
      specs: [
        { k: "Material", v: "Pure Kansa (Bronze)" },
        { k: "Designs", v: "Kangoora · Kansa-Pital · Kansa · Gol · Pendi" },
        { k: "Use", v: "Naivedya, Dahi, Mishri, Daily Dining" },
        { k: "Best For", v: "Pooja, Healthy Ayurvedic Eating" },
      ],
    }),
    images: [`${IMG}/kansa_katori-1.jpg`, `${IMG}/kansa_katori-2.jpg`, `${IMG}/kansa_katori-3.jpg`, `${IMG}/kansa_katori-4.jpg`, `${IMG}/kansa_katori-5.jpg`, `${IMG}/kansa_katori-6.jpg`, `${IMG}/kansa_katori-7.jpg`],
    imageAlts: [
      "Kansa Katori Set - Bronze bowls in graduated sizes with golden warm finish",
    ],
  },

  // 19. Brass Hawan Chammach
  {
    slug: "vedic-tatva-brass-hawan-chammach-15-18-inch",
    name: "Vedic Tatva Brass Hawan Chammach — Long-Handle Sruva (15&quot; / 18&quot;)",
    shortDesc: "Long brass Hawan Chammach (sruva) with smooth wooden handle — used to offer ghee and havan samagri into the sacred fire. Available in two lengths: 15&quot; for home havan, 18&quot; for community yagna.",
    price: 449,
    mrp: 799,
    highlights: [
      "Long handle keeps your hand safely away from flames",
      "Smooth wooden grip — heat-insulating &amp; comfortable",
      "Polished brass bowl — precise ghee &amp; samagri quantity",
      "Two lengths: 15&quot; (home), 18&quot; (community yagna)",
      "Pairs perfectly with our Copper Hawan Kund",
    ],
    features: [
      "Material: Brass bowl + Wooden handle",
      "Lengths: 15 inch, 18 inch",
      "Bowl Diameter: ~1.5 inch",
      "Use: Offering ghee &amp; samagri into havan kund",
      "Care: Wipe clean after each use; polish brass with lemon",
    ],
    variations: [
      { label: "15 inch — Home Havan",      price: 449 },
      { label: "18 inch — Community Yagna", price: 599 },
    ],
    badge: "Long Handle",
    hsn: "7418",
    gst: 12,
    rich: aplus({
      title: "Brass Hawan Chammach (Sruva)",
      tagline: "Long handle · Wooden grip · Yagna essential",
      bullets: [
        "<b>Pure brass bowl</b> — sacred metal traditionally used for fire offerings.",
        "<b>Smooth wooden handle</b> — keeps your hand cool and safe.",
        "<b>Two lengths</b> — 15&quot; for home havan, 18&quot; for community yagna.",
        "<b>Right-sized bowl</b> — holds the perfect spoonful of ghee or samagri.",
        "<b>Pairs perfectly</b> with our Copper Hawan Kund &amp; Mango Wood Samidha.",
      ],
      specs: [
        { k: "Material", v: "Brass + Wood" },
        { k: "Lengths", v: "15 / 18 inch" },
        { k: "Bowl", v: "~1.5 inch diameter" },
        { k: "Best For", v: "Havan, Yagna, Daily Aahuti" },
      ],
    }),
    images: [`${IMG}/hawan_chammach-1.jpg`],
    imageAlts: [
      "Brass Hawan Chammach Sruva - Long handle ladle with wooden grip",
    ],
  },

  // 20. Brass Trishul
  {
    slug: "vedic-tatva-brass-trishul-shiva-trident",
    name: "Vedic Tatva Brass Trishul — Lord Shiva Trident (4&quot; – 15&quot;)",
    shortDesc: "Solid brass Trishul — the iconic three-pronged trident of Lord Shiva, symbol of creation, preservation and destruction. Available in 6 sizes from 4&quot; (home altar) to 15&quot; (mandir centerpiece), with ornate handle and damru detail.",
    price: 349,
    mrp: 699,
    highlights: [
      "Solid brass — heavy, polished, temple-grade",
      "6 sizes — 4&quot;, 6&quot;, 8&quot;, 10&quot;, 12&quot;, 15&quot;",
      "Ornate handle with damru detail",
      "Symbol of Lord Shiva — for Mahashivratri, Monday puja",
      "Stands upright or wall-mountable",
    ],
    features: [
      "Material: Solid Pure Brass",
      "Sizes: 4, 6, 8, 10, 12, 15 inch",
      "Detail: Ornate handle with damru engraving",
      "Use: Shiva worship, Mahashivratri, daily Monday puja",
      "Care: Polish with lemon &amp; salt",
    ],
    variations: [
      { label: "4 inch — Home Altar",     price: 349 },
      { label: "6 inch — Personal",       price: 499 },
      { label: "8 inch — Standard",       price: 749 },
      { label: "10 inch — Large",         price: 1099 },
      { label: "12 inch — Mandir",        price: 1599 },
      { label: "15 inch — Centerpiece",   price: 2299 },
    ],
    badge: "Lord Shiva",
    hsn: "7418",
    gst: 12,
    rich: aplus({
      title: "Brass Trishul — Shiva Trident",
      tagline: "Solid brass · Damru handle · 6 sizes",
      bullets: [
        "<b>Iconic three prongs</b> represent creation, preservation and destruction.",
        "<b>Solid brass</b> — heavy, temple-grade, develops a beautiful patina.",
        "<b>6 graduated sizes</b> — from 4&quot; for home altar to 15&quot; mandir centerpiece.",
        "<b>Ornate handle</b> with engraved damru (Shiva&apos;s drum) detail.",
        "<b>Mahashivratri essential</b> — auspicious for Shiva worship and Monday puja.",
      ],
      specs: [
        { k: "Material", v: "Solid Pure Brass" },
        { k: "Sizes", v: "4 / 6 / 8 / 10 / 12 / 15 inch" },
        { k: "Detail", v: "Damru engraved handle" },
        { k: "Best For", v: "Mahashivratri, Monday Puja, Shiva Mandir" },
      ],
    }),
    images: [`${IMG}/brass_trishul-1.jpg`],
    imageAlts: [
      "Brass Trishul - Lord Shiva trident with three prongs and damru handle",
    ],
  },

  // 21. Shivling, Jalheri & Shankh Stand
  {
    slug: "vedic-tatva-shivling-jalheri-shankh-stand-set",
    name: "Vedic Tatva Shivling, Jalheri &amp; Shankh Stand — Complete Brass Shiva Worship Set",
    shortDesc: "Complete brass set for Lord Shiva worship — Shivling on a Jalheri (water-flow base for abhishek), with matching Shankh Stand to display the sacred conch. Polished pure brass, mandir-ready.",
    price: 1299,
    mrp: 2299,
    highlights: [
      "Complete Shiva worship set — Shivling + Jalheri + Shankh Stand",
      "Jalheri spout drains abhishek water cleanly",
      "Shankh Stand — matching conch display",
      "Polished pure brass — develops a beautiful golden patina",
      "Sold individually or as complete set",
    ],
    features: [
      "Material: Pure Brass",
      "Components: Shivling, Jalheri (drain base), Shankh Stand",
      "Sizes: Small, Medium, Large",
      "Use: Daily abhishek, Mahashivratri, Monday puja",
      "Care: Polish with lemon &amp; salt; rinse jalheri after abhishek",
    ],
    variations: [
      { label: "Shivling Only — Small",   price: 599 },
      { label: "Shivling Only — Medium",  price: 899 },
      { label: "Jalheri Only",            price: 549 },
      { label: "Shankh Stand Only",       price: 449 },
      { label: "Complete Set — Small",    price: 1299 },
      { label: "Complete Set — Medium",   price: 1799 },
      { label: "Complete Set — Large",    price: 2499 },
    ],
    badge: "Shiva Worship",
    hsn: "7418",
    gst: 12,
    rich: aplus({
      title: "Shivling, Jalheri &amp; Shankh Stand",
      tagline: "Brass · Abhishek-ready · Complete Shiva set",
      bullets: [
        "<b>Brass Shivling</b> — pure brass, polished, mandir-ready.",
        "<b>Jalheri base</b> — collects and drains abhishek water cleanly.",
        "<b>Shankh Stand</b> — keeps your sacred conch upright and accessible.",
        "<b>3 sizes</b> — pick by mandir scale.",
        "<b>Daily abhishek</b> with milk, water and bel patra — easy cleanup.",
      ],
      specs: [
        { k: "Material", v: "Pure Brass" },
        { k: "Components", v: "Shivling + Jalheri + Shankh Stand" },
        { k: "Sizes", v: "Small / Medium / Large" },
        { k: "Best For", v: "Mahashivratri, Daily Abhishek" },
      ],
    }),
    images: [`${IMG}/shivling_jalheri-1.jpg`, `${IMG}/shivling_jalheri-2.jpg`, `${IMG}/shivling_jalheri-3.jpg`, `${IMG}/shivling_jalheri-4.jpg`],
    imageAlts: [
      "Shivling Jalheri Shankh Stand - Brass Shiva worship set with conch display",
    ],
  },

  // 22. Pooja Storage Boxes & Bhagone
  {
    slug: "vedic-tatva-pooja-storage-roli-mandir-bhagone-set",
    name: "Vedic Tatva Pooja Storage Set — Roli-Chawal Box, Mandir Box, Pital Bhagone &amp; Brass Pan",
    shortDesc: "Complete pooja storage set — Designer Roli-Chawal box for kumkum &amp; akshat, small Mandir Box for daily essentials, 5-piece Pital Bhagone canister set, ornate Brass Pan, plus Tipai (3-leg stand), Loti, Box Dibbi and Chokda. Keep your pooja items organized.",
    price: 699,
    mrp: 1299,
    highlights: [
      "Complete pooja organization set — 8 essential items",
      "5-piece Pital Bhagone canister set with lids",
      "Designer Roli-Chawal Box with compartments",
      "Brass Pan, Tipai, Loti, Box Dibbi, Chokda included",
      "Pure brass — gift-ready, sturdy &amp; long-lasting",
    ],
    features: [
      "Material: Pure Brass",
      "Includes: Roli-Chawal Designer Box, Mandir Box, Pital Bhagone (5 pc set), Brass Pan, Tipai, Loti, Box Dibbi, Chokda",
      "Use: Storage of kumkum, akshat, dhoop, agarbatti, ghee, samagri",
      "Care: Wipe dry; polish with lemon",
    ],
    variations: [
      { label: "Roli-Chawal Designer Box", price: 449 },
      { label: "Mandir Box (Small)",       price: 349 },
      { label: "Pital Bhagone — 5 Pc Set", price: 1299 },
      { label: "Brass Pan",                price: 549 },
      { label: "Tipai (3-leg stand)",      price: 399 },
      { label: "Loti (Small Vessel)",      price: 249 },
      { label: "Box Dibbi (Small)",        price: 199 },
      { label: "Chokda",                   price: 299 },
      { label: "Complete Set — All 8",     price: 3499 },
    ],
    badge: "Pooja Storage",
    hsn: "7418",
    gst: 12,
    rich: aplus({
      title: "Pooja Storage Set",
      tagline: "Roli box · Bhagone · Pan · Mandir box · Tipai",
      bullets: [
        "<b>Roli-Chawal Designer Box</b> with compartments for kumkum, haldi, akshat.",
        "<b>5-piece Pital Bhagone</b> canister set — store dhoop, agarbatti, dry samagri.",
        "<b>Brass Pan</b> — for paan / supari offerings.",
        "<b>Tipai (3-leg stand)</b> — elevate your idol or kalash.",
        "<b>Mandir Box, Loti, Box Dibbi, Chokda</b> — every pooja accessory in one set.",
      ],
      specs: [
        { k: "Material", v: "Pure Brass" },
        { k: "Includes", v: "8 storage items" },
        { k: "Use", v: "Pooja items, dry samagri, akshat, kumkum" },
        { k: "Best For", v: "Mandir Organization, Gifting" },
      ],
    }),
    images: [`${IMG}/pooja_storage-1.jpg`, `${IMG}/pooja_storage-2.jpg`, `${IMG}/pooja_storage-3.jpg`, `${IMG}/pooja_storage-4.jpg`, `${IMG}/pooja_storage-5.jpg`, `${IMG}/pooja_storage-6.jpg`],
    imageAlts: [
      "Pooja Storage Set - Brass Roli box, mandir box and bhagone canisters",
    ],
  },

  // 23. Brass Decor — Gada, Chapa, Tamba Naag, Gulabpash, Spoons
  {
    slug: "vedic-tatva-brass-decor-gada-chapa-naag-gulabpash",
    name: "Vedic Tatva Brass Decor Set — Hanuman Gada, Pital Chapa, Tamba Naag, GulabPash &amp; Pooja Spoons",
    shortDesc: "Set of essential brass decor &amp; ritual items — Hanuman Gada (mace) for Hanuman worship, Pital Chapa stamp for tilak, Tamba (copper) Naag serpent for Naag Panchami, GulabPash itrdani for rose-water sprinkling, plus tiny Spoons for Pan Masala / Supari / Coffee.",
    price: 449,
    mrp: 899,
    highlights: [
      "Hanuman Gada (mace) — symbol of strength &amp; devotion",
      "Pital Chapa — engraved tilak stamp for forehead marking",
      "Tamba (copper) Naag — for Naag Panchami &amp; serpent worship",
      "GulabPash / Itrdani — sprinkles rose-water during festivities",
      "Tiny Spoons for Pan Masala, Supari, Coffee — gift-ready",
    ],
    features: [
      "Materials: Pure Brass &amp; Pure Copper",
      "Includes: Metal Gada (Hanuman mace), Pital Chapa (tilak stamp), Tamba Naag (copper serpent), GulabPash / Itrdani, Pan Masala spoon, Supari spoon, Coffee spoon",
      "Use: Hanuman puja, Naag Panchami, festive sprinkling, daily decor",
      "Care: Wipe dry; polish with lemon",
    ],
    variations: [
      { label: "Metal Gada (Hanuman)",       price: 449 },
      { label: "Pital Chapa (Tilak Stamp)",  price: 299 },
      { label: "Tamba Naag (Copper Serpent)", price: 399 },
      { label: "GulabPash / Itrdani",        price: 549 },
      { label: "Pan Masala Spoon",           price: 99 },
      { label: "Supari Spoon",               price: 99 },
      { label: "Coffee Spoon",               price: 119 },
      { label: "Full Decor Set — All 7",     price: 1799 },
    ],
    badge: "Decor + Ritual",
    hsn: "7418",
    gst: 12,
    rich: aplus({
      title: "Brass Decor &amp; Ritual Set",
      tagline: "Gada · Chapa · Naag · GulabPash · Spoons",
      bullets: [
        "<b>Hanuman Gada</b> — symbolic mace, perfect for Hanuman Chalisa puja.",
        "<b>Pital Chapa</b> — engraved tilak stamp gives a clean, perfect mark every time.",
        "<b>Tamba Naag</b> — pure copper serpent for Naag Panchami worship.",
        "<b>GulabPash / Itrdani</b> — sprinkle rose-water during weddings &amp; festive aarti.",
        "<b>Tiny matching spoons</b> — for paan masala, supari, coffee — also great hostess gifts.",
      ],
      specs: [
        { k: "Materials", v: "Brass &amp; Copper" },
        { k: "Items", v: "7 distinct pieces" },
        { k: "Use", v: "Puja, decor, festive, hospitality" },
        { k: "Best For", v: "Hanuman Puja, Naag Panchami, Wedding, Decor" },
      ],
    }),
    images: [`${IMG}/brass_decor-1.jpg`, `${IMG}/brass_decor-2.jpg`, `${IMG}/brass_decor-3.jpg`, `${IMG}/brass_decor-4.jpg`, `${IMG}/brass_decor-5.jpg`],
    imageAlts: [
      "Brass Decor Set - Hanuman Gada, Tilak Chapa, Copper Naag and Gulabpash sprinkler",
    ],
  },
];

export async function seedBrassCopperwareProducts() {
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
      category: "Brass & Copperware",
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

  console.log(`Brass & Copperware seed: inserted ${inserted}, updated ${updated} (total ${ITEMS.length}).`);
}

import { db } from "./db";
import { products } from "@shared/schema";
import { eq } from "drizzle-orm";

type SizeRow = { size: string; chest: string; length: string; shoulder: string; sleeve: string };

const KURTA_SIZE_CHART: SizeRow[] = [
  { size: "M",   chest: '40"', length: '40"', shoulder: '17.5"', sleeve: '23"' },
  { size: "L",   chest: '42"', length: '41"', shoulder: '18"',   sleeve: '23.5"' },
  { size: "XL",  chest: '44"', length: '42"', shoulder: '18.5"', sleeve: '24"' },
  { size: "XXL", chest: '46"', length: '43"', shoulder: '19"',   sleeve: '24.5"' },
];

const VEST_SIZE_CHART = [
  { size: "S",  chest: "32–34\"", length: "26\"" },
  { size: "M",  chest: "36–38\"", length: "27\"" },
  { size: "L",  chest: "40–42\"", length: "28\"" },
  { size: "XL", chest: "44–46\"", length: "29\"" },
];

function sizeChartTable(rows: SizeRow[]): string {
  const cells = rows.map(r => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #e8dcc1;font-weight:700;color:#6D2B35;">${r.size}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e8dcc1;">${r.chest}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e8dcc1;">${r.length}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e8dcc1;">${r.shoulder}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e8dcc1;">${r.sleeve}</td>
    </tr>`).join("");
  return `
    <table style="width:100%;border-collapse:collapse;background:#fff;font-size:13px;color:#3a2a20;border:1px solid #e8dcc1;border-radius:8px;overflow:hidden;">
      <thead>
        <tr style="background:#FBF7EE;">
          <th style="padding:10px 12px;text-align:left;color:#6D2B35;font-weight:700;letter-spacing:1px;font-size:11px;text-transform:uppercase;">Size</th>
          <th style="padding:10px 12px;text-align:left;color:#6D2B35;font-weight:700;letter-spacing:1px;font-size:11px;text-transform:uppercase;">Chest</th>
          <th style="padding:10px 12px;text-align:left;color:#6D2B35;font-weight:700;letter-spacing:1px;font-size:11px;text-transform:uppercase;">Length</th>
          <th style="padding:10px 12px;text-align:left;color:#6D2B35;font-weight:700;letter-spacing:1px;font-size:11px;text-transform:uppercase;">Shoulder</th>
          <th style="padding:10px 12px;text-align:left;color:#6D2B35;font-weight:700;letter-spacing:1px;font-size:11px;text-transform:uppercase;">Sleeve</th>
        </tr>
      </thead>
      <tbody>${cells}</tbody>
    </table>`;
}

function vestChartTable(rows: { size: string; chest: string; length: string }[]): string {
  const cells = rows.map(r => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #e8dcc1;font-weight:700;color:#6D2B35;">${r.size}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e8dcc1;">${r.chest}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e8dcc1;">${r.length}</td>
    </tr>`).join("");
  return `
    <table style="width:100%;border-collapse:collapse;background:#fff;font-size:13px;color:#3a2a20;border:1px solid #e8dcc1;border-radius:8px;overflow:hidden;">
      <thead>
        <tr style="background:#FBF7EE;">
          <th style="padding:10px 12px;text-align:left;color:#6D2B35;font-weight:700;letter-spacing:1px;font-size:11px;text-transform:uppercase;">Size</th>
          <th style="padding:10px 12px;text-align:left;color:#6D2B35;font-weight:700;letter-spacing:1px;font-size:11px;text-transform:uppercase;">Chest (to fit)</th>
          <th style="padding:10px 12px;text-align:left;color:#6D2B35;font-weight:700;letter-spacing:1px;font-size:11px;text-transform:uppercase;">Length</th>
        </tr>
      </thead>
      <tbody>${cells}</tbody>
    </table>`;
}

const HOW_TO_MEASURE = `
  <div style="background:#FBF7EE;border:1px solid #D4AF37;border-radius:8px;padding:20px;">
    <h3 style="margin:0 0 12px 0;font-family:Georgia,serif;color:#6D2B35;font-size:18px;">How to Measure — Generic Guide</h3>
    <p style="margin:0 0 14px 0;font-size:13px;color:#3a2a20;line-height:1.55;">Use a soft measuring tape held snug but not tight. Always measure over a thin shirt for accuracy.</p>
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;">
      <div style="background:#fff;border:1px solid #e8dcc1;border-radius:6px;padding:12px;">
        <div style="font-weight:700;color:#6D2B35;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">1 · Chest</div>
        <div style="font-size:12.5px;color:#3a2a20;line-height:1.5;">Wrap around the fullest part of the chest, under the arms.</div>
      </div>
      <div style="background:#fff;border:1px solid #e8dcc1;border-radius:6px;padding:12px;">
        <div style="font-weight:700;color:#6D2B35;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">2 · Waist</div>
        <div style="font-size:12.5px;color:#3a2a20;line-height:1.5;">Measure around the natural waistline (above the navel).</div>
      </div>
      <div style="background:#fff;border:1px solid #e8dcc1;border-radius:6px;padding:12px;">
        <div style="font-weight:700;color:#6D2B35;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">3 · Shoulder</div>
        <div style="font-size:12.5px;color:#3a2a20;line-height:1.5;">From the tip of one shoulder to the tip of the other across the back.</div>
      </div>
      <div style="background:#fff;border:1px solid #e8dcc1;border-radius:6px;padding:12px;">
        <div style="font-weight:700;color:#6D2B35;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">4 · Sleeve</div>
        <div style="font-size:12.5px;color:#3a2a20;line-height:1.5;">From the shoulder seam down to where you want the sleeve to end.</div>
      </div>
      <div style="background:#fff;border:1px solid #e8dcc1;border-radius:6px;padding:12px;">
        <div style="font-weight:700;color:#6D2B35;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">5 · Length</div>
        <div style="font-size:12.5px;color:#3a2a20;line-height:1.5;">From the highest point of the shoulder straight down to the desired hem.</div>
      </div>
      <div style="background:#fff;border:1px solid #e8dcc1;border-radius:6px;padding:12px;">
        <div style="font-weight:700;color:#6D2B35;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Tip</div>
        <div style="font-size:12.5px;color:#3a2a20;line-height:1.5;">If you are between two sizes, choose the larger size for a relaxed fit.</div>
      </div>
    </div>
  </div>`;

function aplusKurta(opts: { title: string; colorWord: string; accent: string; }): string {
  return `
  <div style="max-width:980px;margin:0 auto;background:#fff;font-family:Arial,sans-serif;color:#3a2a20;">
    <div style="background:linear-gradient(135deg,#6D2B35 0%,#4a1a22 100%);padding:48px 24px;text-align:center;border-radius:12px 12px 0 0;">
      <div style="display:inline-block;padding:6px 18px;border:1px solid #D4AF37;border-radius:999px;color:#D4AF37;font-size:11px;letter-spacing:3px;text-transform:uppercase;">100% Super Combed Cotton</div>
      <h1 style="margin:18px 0 8px 0;font-family:Georgia,serif;color:#fff;font-size:30px;line-height:1.25;">${opts.title}</h1>
      <p style="margin:0;color:#FBF7EE;font-size:14px;letter-spacing:1px;">Pure ${opts.colorWord} · Soft · Breathable · Reverence-ready</p>
    </div>

    <div style="padding:28px 24px 8px 24px;">
      <h2 style="font-family:Georgia,serif;color:#6D2B35;font-size:22px;margin:0 0 12px 0;">Why devotees prefer this set</h2>
      <ul style="margin:0;padding-left:18px;color:#3a2a20;font-size:14px;line-height:1.7;">
        <li><b>100% super combed cotton</b> — long-staple yarn for a softer, smoother, lint-free finish.</li>
        <li><b>Pure ${opts.colorWord} colour</b> — non-fading, dyed with skin-safe colours, ideal for puja & temple visits.</li>
        <li><b>Breathable weave</b> — keeps you cool through long aartis, havans and yagnas.</li>
        <li><b>Generous fit</b> — comfortable cut for sitting in sukhasan / vajrasana on the puja mat.</li>
        <li><b>Pre-washed</b> — minimal shrinkage; ready to wear out of the pack.</li>
      </ul>
    </div>

    <div style="padding:24px;">
      <div style="background:${opts.accent};border-radius:10px;padding:24px;text-align:center;">
        <h2 style="font-family:Georgia,serif;color:#fff;font-size:22px;margin:0 0 6px 0;">Kurta Size Chart</h2>
        <p style="margin:0 0 16px 0;color:#FBF7EE;font-size:12.5px;">All measurements are in inches. Please measure a well-fitting kurta laid flat.</p>
        ${sizeChartTable(KURTA_SIZE_CHART)}
        <p style="margin:14px 0 0 0;color:#FBF7EE;font-size:11.5px;letter-spacing:1px;">Dhoti is one-size, 4.5 metres of unstitched pure cotton.</p>
      </div>
    </div>

    <div style="padding:0 24px 24px 24px;">${HOW_TO_MEASURE}</div>

    <div style="padding:0 24px 32px 24px;">
      <div style="border-top:1px solid #e8dcc1;padding-top:18px;">
        <h2 style="font-family:Georgia,serif;color:#6D2B35;font-size:20px;margin:0 0 10px 0;">Care</h2>
        <p style="margin:0;font-size:13px;color:#3a2a20;line-height:1.6;">Gentle hand wash in cold water with mild detergent. Do not bleach. Dry in shade. Iron on medium heat. Wash separately for the first two washes.</p>
      </div>
    </div>
  </div>`;
}

function aplusGamcha(opts: { title: string; tradition: string; pattern: string; weight: string; size: string; }): string {
  return `
  <div style="max-width:980px;margin:0 auto;background:#fff;font-family:Arial,sans-serif;color:#3a2a20;">
    <div style="background:linear-gradient(135deg,#6D2B35 0%,#4a1a22 100%);padding:44px 24px;text-align:center;border-radius:12px 12px 0 0;">
      <div style="display:inline-block;padding:6px 18px;border:1px solid #D4AF37;border-radius:999px;color:#D4AF37;font-size:11px;letter-spacing:3px;text-transform:uppercase;">${opts.tradition}</div>
      <h1 style="margin:18px 0 8px 0;font-family:Georgia,serif;color:#fff;font-size:28px;line-height:1.25;">${opts.title}</h1>
      <p style="margin:0;color:#FBF7EE;font-size:14px;letter-spacing:1px;">Pure cotton · Hand-loomed feel · Quick-dry</p>
    </div>

    <div style="padding:28px 24px;">
      <h2 style="font-family:Georgia,serif;color:#6D2B35;font-size:22px;margin:0 0 12px 0;">Tradition you can drape</h2>
      <p style="margin:0 0 14px 0;font-size:14px;color:#3a2a20;line-height:1.7;">A staple of Indian households — used as a towel, angavastram, shoulder cloth, head wrap, asana cover and a mark of respect during puja and temple visits.</p>
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;">
        <div style="background:#FBF7EE;border:1px solid #e8dcc1;border-radius:6px;padding:12px;">
          <div style="font-size:11px;color:#6D2B35;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Pattern</div>
          <div style="font-size:13.5px;color:#3a2a20;margin-top:3px;">${opts.pattern}</div>
        </div>
        <div style="background:#FBF7EE;border:1px solid #e8dcc1;border-radius:6px;padding:12px;">
          <div style="font-size:11px;color:#6D2B35;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Material</div>
          <div style="font-size:13.5px;color:#3a2a20;margin-top:3px;">100% pure cotton</div>
        </div>
        <div style="background:#FBF7EE;border:1px solid #e8dcc1;border-radius:6px;padding:12px;">
          <div style="font-size:11px;color:#6D2B35;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Weight</div>
          <div style="font-size:13.5px;color:#3a2a20;margin-top:3px;">${opts.weight}</div>
        </div>
        <div style="background:#FBF7EE;border:1px solid #e8dcc1;border-radius:6px;padding:12px;">
          <div style="font-size:11px;color:#6D2B35;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Size</div>
          <div style="font-size:13.5px;color:#3a2a20;margin-top:3px;">${opts.size}</div>
        </div>
      </div>
    </div>

    <div style="padding:0 24px 32px 24px;">${HOW_TO_MEASURE}</div>
  </div>`;
}

function aplusVest(): string {
  return `
  <div style="max-width:980px;margin:0 auto;background:#fff;font-family:Arial,sans-serif;color:#3a2a20;">
    <div style="background:linear-gradient(135deg,#6D2B35 0%,#4a1a22 100%);padding:44px 24px;text-align:center;border-radius:12px 12px 0 0;">
      <div style="display:inline-block;padding:6px 18px;border:1px solid #D4AF37;border-radius:999px;color:#D4AF37;font-size:11px;letter-spacing:3px;text-transform:uppercase;">Neev · Super Combed Cotton</div>
      <h1 style="margin:18px 0 8px 0;font-family:Georgia,serif;color:#fff;font-size:28px;line-height:1.25;">Neev Super Combed Cotton Vest (Banyan)</h1>
      <p style="margin:0;color:#FBF7EE;font-size:14px;letter-spacing:1px;">Soft · Breathable · Long-lasting · For daily and ritual wear</p>
    </div>

    <div style="padding:28px 24px 8px 24px;">
      <h2 style="font-family:Georgia,serif;color:#6D2B35;font-size:22px;margin:0 0 12px 0;">Why Neev banyans</h2>
      <ul style="margin:0;padding-left:18px;color:#3a2a20;font-size:14px;line-height:1.7;">
        <li><b>Super combed cotton</b> — finer, stronger and softer than regular cotton.</li>
        <li><b>Skin-friendly</b> — no itchiness, ideal for sensitive skin and long puja wear.</li>
        <li><b>Reinforced shoulders & neckline</b> — keeps shape after repeated washes.</li>
        <li><b>Sweat-absorbent weave</b> — comfortable in summer and through long havans.</li>
        <li><b>Pure white</b> — auspicious and pairs perfectly with dhoti, kurta or pyjama.</li>
      </ul>
    </div>

    <div style="padding:24px;">
      <div style="background:#6D2B35;border-radius:10px;padding:24px;text-align:center;">
        <h2 style="font-family:Georgia,serif;color:#fff;font-size:22px;margin:0 0 6px 0;">Vest Size Chart</h2>
        <p style="margin:0 0 16px 0;color:#FBF7EE;font-size:12.5px;">All measurements in inches. Choose by chest size.</p>
        ${vestChartTable(VEST_SIZE_CHART)}
      </div>
    </div>

    <div style="padding:0 24px 32px 24px;">${HOW_TO_MEASURE}</div>
  </div>`;
}

const IMG_BASE = "/attached_assets/dhoti_kurta";

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
  images: string[];
  imageAlts: string[];
};

const ITEMS: Item[] = [
  {
    slug: "vedic-tatva-white-cotton-dhoti-kurta-set-100-super-combed",
    name: "Vedic Tatva White Cotton Dhoti Kurta Set — 100% Super Combed Cotton",
    shortDesc: "Pure white super combed cotton dhoti kurta set — soft, breathable and reverence-ready for puja, havan and temple visits.",
    price: 1499,
    mrp: 2199,
    highlights: [
      "100% super combed cotton — softer, smoother, lint-free",
      "Pure non-fading white — ideal for puja, havan and temple",
      "Breathable weave — comfortable through long aartis",
      "Pre-washed for minimal shrinkage",
      "Generous traditional fit for sitting in sukhasan",
    ],
    features: [
      "Material: 100% Super Combed Cotton",
      "Set Includes: 1 Kurta + 1 Unstitched Dhoti (4.5 m)",
      "Colour: Pure White",
      "Sizes: M, L, XL, XXL",
      "Care: Gentle hand wash in cold water",
    ],
    variations: [
      { label: "M",   price: 1499 },
      { label: "L",   price: 1499 },
      { label: "XL",  price: 1499 },
      { label: "XXL", price: 1499 },
    ],
    badge: "Pure Cotton",
    rich: aplusKurta({ title: "Vedic Tatva White Cotton Dhoti Kurta Set", colorWord: "white", accent: "#6D2B35" }),
    images: [
      `${IMG_BASE}/white_set_front.png`,
      `${IMG_BASE}/white_set_angle.png`,
      `${IMG_BASE}/white_set_detail.png`,
    ],
    imageAlts: [
      "White Cotton Dhoti Kurta Set - Front view, kurta and folded dhoti",
      "White Cotton Dhoti Kurta Set - Three-quarter angle view on hanger",
      "White Cotton Dhoti Kurta Set - Close-up fabric and button detail",
    ],
  },
  {
    slug: "vedic-tatva-saffron-cotton-dhoti-kurta-set-100-super-combed",
    name: "Vedic Tatva Saffron Cotton Dhoti Kurta Set — 100% Super Combed Cotton",
    shortDesc: "Sacred saffron super combed cotton dhoti kurta set — the colour of vairagya and devotion. Soft, pure, and pooja-ready.",
    price: 1499,
    mrp: 2199,
    highlights: [
      "100% super combed cotton — softer & finer than regular cotton",
      "Vibrant saffron (bhagwa) — colour of devotion and vairagya",
      "Skin-safe AZO-free dye — non-bleeding, non-fading",
      "Breathable, pre-washed and ritual-ready",
      "Generous traditional fit for asana sitting",
    ],
    features: [
      "Material: 100% Super Combed Cotton",
      "Set Includes: 1 Kurta + 1 Unstitched Dhoti (4.5 m)",
      "Colour: Saffron (Bhagwa)",
      "Sizes: M, L, XL, XXL",
      "Care: Hand wash separately in cold water",
    ],
    variations: [
      { label: "M",   price: 1499 },
      { label: "L",   price: 1499 },
      { label: "XL",  price: 1499 },
      { label: "XXL", price: 1499 },
    ],
    badge: "Pure Cotton",
    rich: aplusKurta({ title: "Vedic Tatva Saffron Cotton Dhoti Kurta Set", colorWord: "saffron", accent: "#C8651B" }),
    images: [
      `${IMG_BASE}/saffron_set_front.png`,
      `${IMG_BASE}/saffron_set_angle.png`,
      `${IMG_BASE}/saffron_set_detail.png`,
    ],
    imageAlts: [
      "Saffron Cotton Dhoti Kurta Set - Front view, kurta and folded dhoti",
      "Saffron Cotton Dhoti Kurta Set - Three-quarter angle view on hanger",
      "Saffron Cotton Dhoti Kurta Set - Close-up fabric and button detail",
    ],
  },
  {
    slug: "vedic-tatva-assamese-gamusa-pure-cotton",
    name: "Vedic Tatva Assamese Gamusa — Pure Cotton, Traditional White with Red Border",
    shortDesc: "Authentic Assamese gamusa — a sacred symbol of Assam, hand-loomed pure cotton with the iconic red phulam border. Perfect for puja, gifting and angavastram.",
    price: 399,
    mrp: 599,
    highlights: [
      "Authentic Assamese gamusa — symbol of Assam's culture and respect",
      "100% pure cotton — soft, absorbent, breathable",
      "Iconic white body with traditional red phulam border",
      "Multi-use: angavastram, towel, asana, gifting, Bihu offering",
      "Hand-loomed feel · Quick-dry",
    ],
    features: [
      "Material: 100% Pure Cotton",
      "Pattern: White body with red phulam (floral) border",
      "Weight: 180–200 gsm",
      "Size: Approx. 36 × 90 cm",
      "Origin: Inspired by Assam handloom tradition",
      "Care: Machine wash gentle, dry in shade",
    ],
    badge: "Handloom Tradition",
    rich: aplusGamcha({
      title: "Assamese Gamusa — White with Red Phulam Border",
      tradition: "Assam Handloom Tradition",
      pattern: "White body, red phulam (floral) border",
      weight: "180–200 gsm",
      size: "Approx. 36 × 90 cm",
    }),
    images: [
      `${IMG_BASE}/gamusa_front.png`,
      `${IMG_BASE}/gamusa_stack.png`,
      `${IMG_BASE}/gamusa_detail.png`,
    ],
    imageAlts: [
      "Assamese Gamusa - Front view, draped showing red phulam border",
      "Assamese Gamusa - Stack of folded gamusas",
      "Assamese Gamusa - Close-up of red phulam floral border weave",
    ],
  },
  {
    slug: "vedic-tatva-bengali-gamcha-pure-cotton-check",
    name: "Vedic Tatva Bengali Gamcha — Pure Cotton, Traditional Red & White Check",
    shortDesc: "Classic Bengali gamcha in the iconic red-and-white check — pure cotton, lightweight, fast-drying. The everyday angavastram of Bengal.",
    price: 299,
    mrp: 499,
    highlights: [
      "Iconic Bengali red & white check — instantly recognisable",
      "100% pure cotton — soft, breathable and absorbent",
      "Lightweight & quick-dry — ideal for daily snan and travel",
      "Multi-use: towel, angavastram, asana cover, dhoop ki potli",
      "Authentic handloom-style weave",
    ],
    features: [
      "Material: 100% Pure Cotton",
      "Pattern: Red & white check (handloom-style)",
      "Weight: 150–180 gsm",
      "Size: Approx. 35 × 80 cm",
      "Origin: Inspired by Bengal handloom tradition",
      "Care: Machine wash gentle, tumble dry low",
    ],
    badge: "Handloom Tradition",
    rich: aplusGamcha({
      title: "Bengali Gamcha — Red & White Check",
      tradition: "Bengal Handloom Tradition",
      pattern: "Red & white check (handloom-style)",
      weight: "150–180 gsm",
      size: "Approx. 35 × 80 cm",
    }),
    images: [
      `${IMG_BASE}/gamcha_front.png`,
      `${IMG_BASE}/gamcha_stack.png`,
      `${IMG_BASE}/gamcha_detail.png`,
    ],
    imageAlts: [
      "Bengali Gamcha - Front view, draped showing red & white check",
      "Bengali Gamcha - Stack of folded gamchas",
      "Bengali Gamcha - Close-up of red & white check weave",
    ],
  },
  {
    slug: "neev-super-combed-cotton-vest-banyan",
    name: "Neev Super Combed Cotton Vest (Banyan) — Pure White, S / M / L / XL",
    shortDesc: "Neev super combed cotton banyan vest — soft, breathable, sweat-absorbent. The trusted base layer for daily wear and puja.",
    price: 399,
    mrp: 599,
    highlights: [
      "Super combed cotton — finer, stronger, softer than regular cotton",
      "Pure auspicious white — pairs with every dhoti, kurta or pyjama",
      "Skin-friendly — no itch, no rash, ideal for long puja wear",
      "Reinforced shoulders & neckline — holds shape wash after wash",
      "Sweat-absorbent weave — keeps you cool in summer and havans",
    ],
    features: [
      "Brand: Neev",
      "Material: 100% Super Combed Cotton",
      "Style: Sleeveless Banyan Vest",
      "Colour: Pure White",
      "Sizes: S, M, L, XL",
      "Care: Machine wash cold, do not bleach",
    ],
    variations: [
      { label: "S",  price: 399 },
      { label: "M",  price: 399 },
      { label: "L",  price: 399 },
      { label: "XL", price: 399 },
    ],
    badge: "Trusted Brand",
    brand: "Neev",
    rich: aplusVest(),
    images: [
      `${IMG_BASE}/vest_front.png`,
      `${IMG_BASE}/vest_stack.png`,
      `${IMG_BASE}/vest_detail.png`,
    ],
    imageAlts: [
      "Neev Super Combed Cotton Vest - Front view, pure white banyan",
      "Neev Super Combed Cotton Vest - Stack of folded vests",
      "Neev Super Combed Cotton Vest - Close-up of neckline and ribbed weave",
    ],
  },
];

export async function seedDhotiKurtaProducts() {
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
      stock: 60,
      category: "Dhoti & Kurta",
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
      gstPercent: 5,
      hsnCode: "6203",
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
        })
        .where(eq(products.id, existingRow.id));
      updated++;
    } else {
      await db.insert(products).values(row);
      inserted++;
    }
  }

  console.log(`Dhoti & Kurta seed: inserted ${inserted}, updated ${updated} (total ${ITEMS.length}).`);
}

import { db } from "./db";
import { products } from "@shared/schema";
import { eq } from "drizzle-orm";

const map: Record<string, string> = {
  "janeu-sacred-yajnopavit-thread-pure-cotton": "/attached_assets/stock_images/janeu-sacred-yajnopavit-thread-pure-cotton.jpg",
  "mouli-kalava-sacred-red-puja-thread": "/attached_assets/stock_images/mouli-kalava-sacred-red-puja-thread.jpg",
  "gangajal-holy-water-from-river-ganga": "/attached_assets/stock_images/gangajal-holy-water-from-river-ganga.jpg",
  "laddu-gopal-vastra-poshak-multi-colour-variation": "/attached_assets/stock_images/laddu-gopal-vastra-poshak-multi-colour-variation.jpg",
  "chowki-cloth-puja-altar-cover": "/attached_assets/stock_images/chowki-cloth-puja-altar-cover.jpg",
  "terracotta-diya-pack-of-100": "/attached_assets/stock_images/terracotta-diya-pack-of-100.jpg",
  "peela-vastra-yellow-puja-cloth": "/attached_assets/stock_images/peela-vastra-yellow-puja-cloth.jpg",
  "long-cotton-batti-puja-diya-wicks": "/attached_assets/stock_images/long-cotton-batti-puja-diya-wicks.jpg",
  "short-batti-cotton-wicks-for-diya": "/attached_assets/stock_images/short-batti-cotton-wicks-for-diya.jpg",
  "kesar-chandan-tilak-saffron-sandalwood-paste": "/attached_assets/stock_images/kesar-chandan-tilak-saffron-sandalwood-paste.jpg",
  "white-chandan-tilak-pure-sandalwood-paste": "/attached_assets/stock_images/white-chandan-tilak-pure-sandalwood-paste.jpg",
  "chandan-powder-pure-sandalwood-powder": "/attached_assets/stock_images/chandan-powder-pure-sandalwood-powder.jpg",
  "pooja-chowki-small-wooden-altar-stand": "/attached_assets/stock_images/pooja-chowki-small-wooden-altar-stand.jpg",
  "gomti-chakra-pack-of-13-pieces": "/attached_assets/stock_images/gomti-chakra-pack-of-13-pieces.jpg",
  "beetal-betel-nuts-for-puja-pack-of-12": "/attached_assets/stock_images/beetal-betel-nuts-for-puja-pack-of-12.jpg",
  "cotton-phool-batti-flower-shaped-diya-wicks": "/attached_assets/stock_images/cotton-phool-batti-flower-shaped-diya-wicks.jpg",
};

async function run() {
  let updated = 0;
  for (const [slug, image] of Object.entries(map)) {
    await db.update(products).set({ image, images: [image] }).where(eq(products.slug, slug));
    console.log(`[update] ${slug} -> ${image}`);
    updated++;
  }
  console.log(`\nDone. Updated ${updated} products with real stock photos.`);
  console.log(`(You can still replace any of these from the admin panel anytime.)`);
}

run().then(() => process.exit(0)).catch((err) => { console.error(err); process.exit(1); });

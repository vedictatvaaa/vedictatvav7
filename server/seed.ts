import { db } from "./db";
import { eq, notLike } from "drizzle-orm";
import { products, pandits, socialProofSettings, boostEvents, productReviews, donations, seoPages, users } from "@shared/schema";

export async function seedDatabase() {
  const existingAdmin = await db.select().from(users).where(eq(users.role, "admin")).limit(1);
  if (existingAdmin.length === 0) {
    console.log("Seeding admin user...");
    await db.insert(users).values({
      name: "Admin",
      email: "admin@vedictatva.com",
      password: "VedicAdmin@2024",
      role: "admin",
    });
  }

  const existingSeoPages = await db.select().from(seoPages);
  if (existingSeoPages.length === 0) {
    console.log("Seeding SEO pages...");
    await seedSeoPages();
  }
  await ensurePindDaanSeoPages();

  // Idempotent Q&A seeder — adds 15 evergreen entries (skips on slug conflict).
  try {
    const { seedQaQuestions } = await import("./seedQa");
    await seedQaQuestions();
  } catch (e: any) {
    console.warn("[seed] seedQaQuestions failed:", e?.message || "unknown");
  }

  // Idempotent demo pandit seeder — keeps the public demo credentials working.
  try {
    const { seedDemoPandit } = await import("./seedDemoPandit");
    await seedDemoPandit();
  } catch (e: any) {
    console.warn("[seed] seedDemoPandit failed:", e?.message || "unknown");
  }

  const existingDonations = await db.select().from(donations);
  if (existingDonations.length === 0) {
    console.log("Seeding donations...");
    await seedDonations();
  }

  const existingProducts = await db.select().from(products);
  const oldProducts = existingProducts.filter(p => !p.name.startsWith("Vedic Tatva"));
  if (oldProducts.length > 0) {
    console.log(`Cleaning up ${oldProducts.length} old non-Vedic-Tatva products...`);
    for (const p of oldProducts) {
      await db.delete(productReviews).where(eq(productReviews.productId, p.id));
      await db.delete(boostEvents).where(eq(boostEvents.productId, p.id));
      await db.delete(products).where(eq(products.id, p.id));
    }
  }

  const vedicProducts = existingProducts.filter(p => p.name.startsWith("Vedic Tatva"));
  if (vedicProducts.length > 0) {
    // Vedic products already seeded — still run idempotent rudraksha seed
    try {
      const { seedRudrakshaProducts } = await import("./seedRudraksha");
      await seedRudrakshaProducts();
    } catch (e) {
      console.error("Rudraksha seed error:", e);
    }
    try {
      const { seedPujaAplusProducts } = await import("./seedPujaAplus");
      await seedPujaAplusProducts();
    } catch (e) {
      console.error("Puja A+ seed error:", e);
    }
    try {
      const { seedMalaProducts } = await import("./seedMalas");
      await seedMalaProducts();
    } catch (e) {
      console.error("Mala seed error:", e);
    }
    try {
      const { seedDhotiKurtaProducts } = await import("./seedDhotiKurta");
      await seedDhotiKurtaProducts();
    } catch (e) {
      console.error("Dhoti & Kurta seed error:", e);
    }
    try {
      const { seedHavanSamagriProducts } = await import("./seedHavanSamagri");
      await seedHavanSamagriProducts();
    } catch (e) {
      console.error("Havan Samagri seed error:", e);
    }
    try {
      const { seedBrassCopperwareProducts } = await import("./seedBrassCopperware");
      await seedBrassCopperwareProducts();
    } catch (e) {
      console.error("Brass & Copperware seed error:", e);
    }
    try {
      const { seedIdolsMurti } = await import("./seedIdolsMurti");
      await seedIdolsMurti();
    } catch (e) {
      console.error("Idols & Murti seed error:", e);
    }
    try {
      const { seedPanditProfiles } = await import("./seedPandits");
      await seedPanditProfiles();
    } catch (e) {
      console.error("Pandit seed error:", e);
    }
    return;
  }

  console.log("Seeding Vedic Tatva products...");

  await db.insert(products).values([
    {"name":"Vedic Tatva Hawan Samagri","description":"<b>Vedic Tatva Hawan Samagri</b> is a premium quality hawan samagri packed in a convenient 1 kg quantity. This sacred blend is meticulously crafted from a combination of dried herbs, roots, seeds, aromatic wood shavings, and natural resins. <br><br> Ideal for performing hawan (fire rituals), this samagri includes potent ingredients such as loban, guggul, javitri, nagkesar, kapoor, chandan, and jatamansi. Each of these ingredients is known for its purifying properties and contributes to creating a spiritually uplifting atmosphere during your rituals.<br><br> Made with 100% natural, chemical-free components, Vedic Tatva Hawan Samagri is perfect for daily usage, festivals, and special occasions. Embrace the power of ancient Vedic traditions and enhance your spiritual practices with this exceptional hawan samagri.<br><br> Experience the divine aroma and benefits it brings to your puja, ensuring a sacred space filled with positivity and peace.","price":199,"stock":100,"category":"Puja Samagri","image":"/attached_assets/product_images/product_78_img1.png","images":["/attached_assets/product_images/product_78_img1.png","/attached_assets/product_images/product_78_img2.png","/attached_assets/product_images/product_78_img3.png","/attached_assets/product_images/product_78_img4.png"],"badge":"New","salesCount":0,"highlights":["PREMIUM QUALITY: Crafted from a sacred blend of herbs and natural resins.","100% NATURAL: Free from chemicals and artificial additives.","MULTI-PURPOSE: Suitable for daily hawan, festivals, and special occasions.","SPIRITUAL SIGNIFICANCE: Enhances positive energy and creates a serene atmosphere.","EASY TO USE: Convenient 1 kg pack for hassle-free rituals."],"features":["Weight: 1kg","Ingredients: Loban, guggul, javitri, nagkesar, kapoor, chandan, jatamansi, and more.","Type: Puja Essentials","Packaging: Ethically sourced and eco-friendly.","Usage: For hawan rituals, daily prayers, and special celebrations."],"richDescription":"<b>Vedic Tatva Hawan Samagri</b> is a premium quality hawan samagri packed in a convenient 1 kg quantity. This sacred blend is meticulously crafted from a combination of dried herbs, roots, seeds, aromatic wood shavings, and natural resins. <br><br> Ideal for performing hawan (fire rituals), this samagri includes potent ingredients such as loban, guggul, javitri, nagkesar, kapoor, chandan, and jatamansi. Each of these ingredients is known for its purifying properties and contributes to creating a spiritually uplifting atmosphere during your rituals.<br><br> Made with 100% natural, chemical-free components, Vedic Tatva Hawan Samagri is perfect for daily usage, festivals, and special occasions. Embrace the power of ancient Vedic traditions and enhance your spiritual practices with this exceptional hawan samagri.<br><br> Experience the divine aroma and benefits it brings to your puja, ensuring a sacred space filled with positivity and peace.","aplusEnabled":true,"variations":"[{\"label\":\"1 Kg\",\"price\":199},{\"label\":\"5 Kg\",\"price\":899}]","slug":"vedic-tatva-hawan-samagri-1-kg"},
    {"name":"Vedic Tatva Shuddh Ghee Jyoti - Pure Cow Ghee Wicks (150 Wicks)","description":"<b>Experience the divine illumination of your puja rituals with Vedic Tatva Shuddh Ghee Jyoti,</b> crafted with pure cow ghee and blended with sacred ingredients to elevate your spiritual practice. Each wick is designed to enhance the sanctity of your worship through its pure and smokeless flame, providing a clear connection to the divine energies. <br><br> <b>This exceptional product contains 150 meticulously prepared wicks</b> that are paraffin wax-free and made with a harmonious mix of gond (edible gum), tulsi powder, camphor, and gaumutra ark. These ingredients have been revered in Ayurveda for their spiritual and health benefits, ensuring that your puja is not just a ritual but a holistic experience. <br><br> Utilizing Vedic Tatva Shuddh Ghee Jyoti wicks for daily diya lighting is a step towards creating a serene and spiritually charged environment in your home. <br><ul><li><b>SMOKELESS FLAME:</b> Enjoy the purity of a clean burn that avoids unwanted smoke.</li><li><b>LONGER BURN TIME:</b> Made to last, ensuring your worship lasts as long as it needs to.</li><li><b>BRIGHT LIGHT:</b> The luminosity of the flame symbolizes prosperity and peace in your abode.</li></ul> <b>Indulge in authentic spiritual practices and enrich your soul with Vedic Tatva Shuddh Ghee Jyoti.</b>","price":299,"stock":100,"category":"Puja Samagri","image":"/attached_assets/product_images/product_67_img1.png","images":["/attached_assets/product_images/product_67_img1.png","/attached_assets/product_images/product_67_img2.png","/attached_assets/product_images/product_67_img3.png","/attached_assets/product_images/product_67_img4.png"],"badge":"New","salesCount":0,"highlights":["PREMIUM QUALITY: Handmade with the finest natural ingredients for optimal purity.","AUTHENTIC INGREDIENTS: Blended with sacred elements such as gond, tulsi powder, and camphor.","ENVIRONMENT-FRIENDLY: No synthetic additives or paraffin wax, completely natural.","VERSATILE USAGE: Perfect for daily puja rituals, festivals, and special occasions.","LONG-LASTING: Each wick burns longer than conventional wicks for uninterrupted worship.","SMOKELESS BURN: Ensures a clear and holy atmosphere during your rituals."],"features":["[object Object]","[object Object]","[object Object]","[object Object]","[object Object]","[object Object]"],"richDescription":"<b>Experience the divine illumination of your puja rituals with Vedic Tatva Shuddh Ghee Jyoti,</b> crafted with pure cow ghee and blended with sacred ingredients to elevate your spiritual practice. Each wick is designed to enhance the sanctity of your worship through its pure and smokeless flame, providing a clear connection to the divine energies. <br><br> <b>This exceptional product contains 150 meticulously prepared wicks</b> that are paraffin wax-free and made with a harmonious mix of gond (edible gum), tulsi powder, camphor, and gaumutra ark. These ingredients have been revered in Ayurveda for their spiritual and health benefits, ensuring that your puja is not just a ritual but a holistic experience. <br><br> Utilizing Vedic Tatva Shuddh Ghee Jyoti wicks for daily diya lighting is a step towards creating a serene and spiritually charged environment in your home. <br><ul><li><b>SMOKELESS FLAME:</b> Enjoy the purity of a clean burn that avoids unwanted smoke.</li><li><b>LONGER BURN TIME:</b> Made to last, ensuring your worship lasts as long as it needs to.</li><li><b>BRIGHT LIGHT:</b> The luminosity of the flame symbolizes prosperity and peace in your abode.</li></ul> <b>Indulge in authentic spiritual practices and enrich your soul with Vedic Tatva Shuddh Ghee Jyoti.</b>","aplusEnabled":true,"slug":"vedic-tatva-shuddh-ghee-jyoti-pure-cow-ghee-wicks-150-wicks"},
    {"name":"Vedic Tatva Panchgavya Dhoop Cones","description":"<b>Experience the Divine Aroma of Vedic Tatva Panchgavya Dhoop Cones!</b><br><br>Immerse yourself in a spiritual ambiance with our handcrafted <b>Panchgavya Dhoop Cones</b>. Made from a sacred blend of <i>desi cow dung</i>, <i>panchgavya</i>, and <i>herbal resins</i>, these dhoop cones are designed to elevate your meditation, puja, or daily rituals. By burning these cones, you invite a calming presence that fosters peace and spirituality in your environment.<br><br>Our dhoop cones, measuring a perfect <b>1.5 inches</b>, are infused with <i>chandan powder</i>, <i>sambrani</i>, and a unique assortment of <i>hawan herbs</i>. This exquisite blend not only purifies the air but also enhances your spiritual practice. Each cone is handcrafted with care, ensuring that you receive the <b>best quality</b> that Vedic Tatva is renowned for.<br><br>Our Panchgavya Dhoop Cones are entirely <b>chemical-free</b>, made from natural and organic ingredients that promote well-being. They are perfect for use in homes, temples, or during personal spiritual practices. Light these cones during meditation or yoga sessions to create a fragrant environment that encourages tranquility and harmony.<br><br><b>Benefits of Using Panchgavya Dhoop Cones:</b><ul><li>Purifies the atmosphere and dispels negative energy.</li><li>Enhances focus and promotes a meditative state.</li><li>Supports traditional Vedic practices.</li><li>Natural fragrance that soothes the mind and body.</li><li>Promotes an eco-friendly lifestyle.</li></ul>","price":249,"stock":100,"category":"Puja Samagri","image":"/attached_assets/product_images/product_68_img1.png","images":["/attached_assets/product_images/product_68_img1.png","/attached_assets/product_images/product_68_img2.png","/attached_assets/product_images/product_68_img3.png","/attached_assets/product_images/product_68_img4.png"],"badge":"New","salesCount":0,"highlights":["PREMIUM QUALITY: Handcrafted with care to ensure the finest aroma.","AUTHENTIC INGREDIENTS: Made from a sacred blend of desi cow dung and panchgavya.","100% CHEMICAL FREE: Natural, organic, and eco-friendly formulation.","ELEVATE SPIRITUAL PRACTICES: Ideal for puja, meditation, and yoga.","LONG-LASTING: Each cone burns evenly, releasing a soothing fragrance for multiple hours."],"features":["Material: Natural Sambrani Resin and Herbal Blends","Weight: 250g","Quantity: 200 Cones","Cone Size: 1.5 Inches","Fragrance: Traditional Vedic Aroma","Usage: Ideal for Meditation, Pooja, and Yoga"],"richDescription":"<b>Experience the Divine Aroma of Vedic Tatva Panchgavya Dhoop Cones!</b><br><br>Immerse yourself in a spiritual ambiance with our handcrafted <b>Panchgavya Dhoop Cones</b>. Made from a sacred blend of <i>desi cow dung</i>, <i>panchgavya</i>, and <i>herbal resins</i>, these dhoop cones are designed to elevate your meditation, puja, or daily rituals. By burning these cones, you invite a calming presence that fosters peace and spirituality in your environment.<br><br>Our dhoop cones, measuring a perfect <b>1.5 inches</b>, are infused with <i>chandan powder</i>, <i>sambrani</i>, and a unique assortment of <i>hawan herbs</i>. This exquisite blend not only purifies the air but also enhances your spiritual practice. Each cone is handcrafted with care, ensuring that you receive the <b>best quality</b> that Vedic Tatva is renowned for.<br><br>Our Panchgavya Dhoop Cones are entirely <b>chemical-free</b>, made from natural and organic ingredients that promote well-being. They are perfect for use in homes, temples, or during personal spiritual practices. Light these cones during meditation or yoga sessions to create a fragrant environment that encourages tranquility and harmony.<br><br><b>Benefits of Using Panchgavya Dhoop Cones:</b><ul><li>Purifies the atmosphere and dispels negative energy.</li><li>Enhances focus and promotes a meditative state.</li><li>Supports traditional Vedic practices.</li><li>Natural fragrance that soothes the mind and body.</li><li>Promotes an eco-friendly lifestyle.</li></ul>","aplusEnabled":true,"variations":"[{\"label\":\"1.5 Inch - 200 Cones\",\"price\":249},{\"label\":\"2 Inch - 120 Cones\",\"price\":249}]","slug":"vedic-tatva-panchgavya-dhoop-cones"},
    {"name":"Vedic Tatva Divya Bhimseni Kapoor Camphor - 400g","description":"<b>Experience Sacred Purity with Vedic Tatva Divya Bhimseni Kapoor</b><br>Embark on a spiritual journey with our premium <b>Divya Bhimseni Kapoor</b> (Camphor), meticulously sourced and crafted for your sacred rituals. This 400-gram pack of pure Bhimseni Kapoor is renowned for its strong natural fragrance and impeccable quality, making it an essential component for <i>aarti</i>, <i>hawan</i>, and <i>puja</i> rituals. The delightful aroma elevates your spiritual practices, creating an atmosphere of divine presence and serenity.<br><br><b>Spiritual Significance:</b> In the rich traditions of Indian spirituality, Bhimseni Kapoor is considered a powerful substance that purifies the atmosphere and enhances meditation. It is believed to ward off negative energies while inviting positivity and blessings into your space. Using it during puja ceremonies not only uplifts the soul but also aligns your energies with a higher frequency, fostering an environment of tranquility.<br><br><b>Usage and Benefits:</b> Our camphor burns completely, leaving no residue, allowing you to focus solely on your spiritual practices without disruption. Whether you use it for <ul><li><i>Aarti</i> to honor deities</li><li><i>Hawan</i> for sacred offerings</li><li>Air purification to cleanse your surroundings</li></ul> the benefits are manifold. The fragrance calms the mind, aids in deepening meditation, and enhances the overall ambiance of your sacred space, making it perfect for daily rituals or special occasions.<br><br>Indulge in the whispers of divine grace with Vedic Tatva's Divya Bhimseni Kapoor and let the essence of spirituality flow through every corner of your life.","price":499,"stock":100,"category":"Puja Samagri","image":"/attached_assets/product_images/product_70_img1.png","images":["/attached_assets/product_images/product_70_img1.png","/attached_assets/product_images/product_70_img2.png","/attached_assets/product_images/product_70_img3.png","/attached_assets/product_images/product_70_img4.png"],"badge":"New","salesCount":0,"highlights":["PREMIUM QUALITY: 100% Pure Bhimseni Kapoor for authentic spiritual experiences.","AUTHENTIC INGREDIENTS: Sourced directly from nature, ensuring the highest standards of purity.","SIGNIFICANT SPIRITUAL BENEFITS: Enhances meditation, wards off negativity, and purifies the surroundings.","RESIDUE-FREE BURNING: Enjoy a clean and beautiful burn without leftover residue.","VERSATILE USAGE: Ideal for <i>aarti</i>, <i>hawan</i>, <i>puja</i>, and air purification.","GENEROUS PACK SIZE: 400g pack offers long-lasting supply for regular use."],"features":["[object Object]","[object Object]","[object Object]","[object Object]","[object Object]","[object Object]","[object Object]","[object Object]"],"richDescription":"<b>Experience Sacred Purity with Vedic Tatva Divya Bhimseni Kapoor</b><br>Embark on a spiritual journey with our premium <b>Divya Bhimseni Kapoor</b> (Camphor), meticulously sourced and crafted for your sacred rituals. This 400-gram pack of pure Bhimseni Kapoor is renowned for its strong natural fragrance and impeccable quality, making it an essential component for <i>aarti</i>, <i>hawan</i>, and <i>puja</i> rituals. The delightful aroma elevates your spiritual practices, creating an atmosphere of divine presence and serenity.<br><br><b>Spiritual Significance:</b> In the rich traditions of Indian spirituality, Bhimseni Kapoor is considered a powerful substance that purifies the atmosphere and enhances meditation. It is believed to ward off negative energies while inviting positivity and blessings into your space. Using it during puja ceremonies not only uplifts the soul but also aligns your energies with a higher frequency, fostering an environment of tranquility.<br><br><b>Usage and Benefits:</b> Our camphor burns completely, leaving no residue, allowing you to focus solely on your spiritual practices without disruption. Whether you use it for <ul><li><i>Aarti</i> to honor deities</li><li><i>Hawan</i> for sacred offerings</li><li>Air purification to cleanse your surroundings</li></ul> the benefits are manifold. The fragrance calms the mind, aids in deepening meditation, and enhances the overall ambiance of your sacred space, making it perfect for daily rituals or special occasions.<br><br>Indulge in the whispers of divine grace with Vedic Tatva's Divya Bhimseni Kapoor and let the essence of spirituality flow through every corner of your life.","aplusEnabled":true,"slug":"vedic-tatva-divya-bhimseni-kapoor-400g"},
    {"name":"Vedic Tatva Divya Sambrani Dhoop Cups","description":"<b>Immerse Yourself in Sacred Aromas</b><br>Vedic Tatva Divya Sambrani Dhoop Cups are meticulously crafted to elevate your spiritual experiences. Each cup is infused with the rich essence of natural <i>sambrani</i> resin, known for its purifying properties and ability to create a divine atmosphere during daily <i>puja</i> or meditation. The enchanting aroma wafts through your space, allowing you to connect with the divine and find peace in every breath you take.<br><br><b>Spiritual Significance of Sambrani</b><br>In many spiritual traditions, <i>sambrani</i> acts as a bridge to the divine, removing negative energies and inviting the blessings of the gods. Lighting these dhoop cups during your <i>puja</i> rituals not only enhances your spiritual practice but also promotes tranquility and harmony in your surroundings.<br><br><b>Easy to Use, Made for Daily Rituals</b><br>Our Divya Sambrani Dhoop Cups come in a convenient pack of 24, ideal for everyday rituals, temple use, and festive occasions. The cups are designed for hassle-free lighting, allowing you to focus on your <i>sadhana</i> without distractions. Whether you are initiating your day with morning prayers or seeking solace during meditation, our dhoop cups provide a long-lasting fragrance that lingers in your space, enhancing your spiritual journey.","price":199,"stock":100,"category":"Puja Samagri","image":"/attached_assets/product_images/product_65_img1.png","images":["/attached_assets/product_images/product_65_img1.png","/attached_assets/product_images/product_65_img2.png","/attached_assets/product_images/product_65_img3.png","/attached_assets/product_images/product_65_img4.png"],"badge":"New","salesCount":0,"highlights":["PREMIUM QUALITY: Crafted from the finest natural sambrani resin for superior fragrance.","AUTHENTIC INGREDIENTS: Each cup is made with pure, natural components for a genuine experience.","EASY TO USE: Simple and convenient design ensures effortless lighting and usage.","LONG-LASTING FRAGRANCE: Enjoy the soothing aroma that lasts for hours, enriching your environment.","VERSATILE USAGE: Perfect for daily puja, meditation, and festive celebrations."],"features":["Material: Natural Sambrani Resin","Weight: 250g","Quantity: 24 cups","Fragrance Type: Calming and Purifying","Burn Time: Approximately 30 minutes per cup","Packaging: Eco-friendly and convenient","Usage: Ideal for home puja, meditation, and spiritual gatherings"],"richDescription":"<b>Immerse Yourself in Sacred Aromas</b><br>Vedic Tatva Divya Sambrani Dhoop Cups are meticulously crafted to elevate your spiritual experiences. Each cup is infused with the rich essence of natural <i>sambrani</i> resin, known for its purifying properties and ability to create a divine atmosphere during daily <i>puja</i> or meditation. The enchanting aroma wafts through your space, allowing you to connect with the divine and find peace in every breath you take.<br><br><b>Spiritual Significance of Sambrani</b><br>In many spiritual traditions, <i>sambrani</i> acts as a bridge to the divine, removing negative energies and inviting the blessings of the gods. Lighting these dhoop cups during your <i>puja</i> rituals not only enhances your spiritual practice but also promotes tranquility and harmony in your surroundings.<br><br><b>Easy to Use, Made for Daily Rituals</b><br>Our Divya Sambrani Dhoop Cups come in a convenient pack of 24, ideal for everyday rituals, temple use, and festive occasions. The cups are designed for hassle-free lighting, allowing you to focus on your <i>sadhana</i> without distractions. Whether you are initiating your day with morning prayers or seeking solace during meditation, our dhoop cups provide a long-lasting fragrance that lingers in your space, enhancing your spiritual journey.","aplusEnabled":true,"variations":"[{\"label\":\"Pack of 24\",\"price\":199},{\"label\":\"Pack of 65\",\"price\":299}]","slug":"vedic-tatva-divya-sambrani-dhoop-cups-pack-of-24"},
    {"name":"Vedic Tatva Havan Wood - Sun Dried Mango Wood","description":"<b>Vedic Tatva Havan Wood - Sun Dried Mango Wood</b> is a premium choice for your spiritual practices. This pack of 50 sticks, made from <b>naturally dried mango wood</b>, is ideal for <b>performing hawan</b> and <b>agnihotra</b>. The mango wood carries a significant <b>spiritual essence</b> in Vedic traditions, making it a sacred choice for enhancing your rituals.<br><br>Each stick is <b>sun-dried</b> to maintain its natural properties and ensure a <b>clean burning experience</b>. When ignited, these sticks produce <b>aromatic smoke</b>, creating a serene ambiance that promotes <b>spiritual well-being</b>. Enjoy the ease of lighting and the long-lasting quality of our mango wood sticks, which are perfect for any puja setting.<br><br>This product is <b>chemical-free</b> and made from <b>sustainably sourced wood</b>, ensuring that your spiritual practice aligns with eco-friendly values. Elevate your puja experience with Vedic Tatva Havan Wood, as it embodies purity and tradition.<br><br>Order the <b>Vedic Tatva Havan Wood</b> pack of 50 today for an authentic and enriching spiritual journey!<br>","price":249,"stock":100,"category":"Puja Samagri","image":"/attached_assets/product_images/product_80_img1.png","images":["/attached_assets/product_images/product_80_img1.png","/attached_assets/product_images/product_80_img2.png","/attached_assets/product_images/product_80_img3.png","/attached_assets/product_images/product_80_img4.png"],"badge":"New","salesCount":0,"highlights":["PREMIUM QUALITY: Made from naturally sun-dried mango wood.","CLEAN BURNING: Produces minimal ash and aromatic smoke.","EASY TO LIGHT: Convenient for all your hawan and agnihotra needs.","SACRED WOOD: Considered holy in Vedic traditions.","CHEMICAL FREE: No harmful substances added, safe for rituals.","SUSTAINABLY SOURCED: Eco-friendly production practices."],"features":["Weight: 500g","Dimensions: 10 cm x 10 cm x 4 cm","Pack Size: 50 sticks","Material: Mango Wood","Drying Method: Sun-dried","Usage: For Hawan and Agnihotra rituals"],"richDescription":"<b>Vedic Tatva Havan Wood - Sun Dried Mango Wood</b> is a premium choice for your spiritual practices. This pack of 50 sticks, made from <b>naturally dried mango wood</b>, is ideal for <b>performing hawan</b> and <b>agnihotra</b>. The mango wood carries a significant <b>spiritual essence</b> in Vedic traditions, making it a sacred choice for enhancing your rituals.<br><br>Each stick is <b>sun-dried</b> to maintain its natural properties and ensure a <b>clean burning experience</b>. When ignited, these sticks produce <b>aromatic smoke</b>, creating a serene ambiance that promotes <b>spiritual well-being</b>. Enjoy the ease of lighting and the long-lasting quality of our mango wood sticks, which are perfect for any puja setting.<br><br>This product is <b>chemical-free</b> and made from <b>sustainably sourced wood</b>, ensuring that your spiritual practice aligns with eco-friendly values. Elevate your puja experience with Vedic Tatva Havan Wood, as it embodies purity and tradition.<br><br>Order the <b>Vedic Tatva Havan Wood</b> pack of 50 today for an authentic and enriching spiritual journey!<br>","aplusEnabled":true,"variations":"[{\"label\":\"Pack of 50\",\"price\":249},{\"label\":\"Pack of 100\",\"price\":499}]","slug":"vedic-tatva-havan-wood-sun-dried-mango-wood-pack-of-50"},
    {"name":"Vedic Tatva Panchtatwa Assorted Dhoop Cones - 1.5 Inch (200 Cones)","description":"<b>Experience the Essence of the Panch Tatva</b><br>Immerse yourself in the divine aromas of the Vedic Tatva Panchtatwa Assorted Dhoop Cones. Each of the 200 carefully crafted cones, measuring 1.5 inches in size, embodies the essential elements of nature, representing the core beliefs of Vedic philosophy. The five fragrances included are: <ul><li><b>Indian Rose (Prithvi):</b> Grounding and nurturing, this fragrance brings the essence of Earth to your space.</li><li><b>Jasmine (Jal):</b> A soothing scent that symbolizes water, invoking tranquility and emotional well-being.</li><li><b>Nagchampa (Agni):</b> The vibrant essence of fire, igniting passion and energy in your surroundings.</li><li><b>Chandan/Sandalwood (Vayu):</b> Embracing the wisdom of air, this calming fragrance purifies the environment.</li><li><b>Kapoor/Camphor (Akash):</b> Uplifting and cleansing like space, this aroma enhances spiritual connections.</li></ul><br>Crafted from 100% natural ingredients, our dhoop cones offer an authentic experience, free from harmful chemicals. Each cone releases a gentle, fragrant smoke that enhances the atmosphere, making it perfect for meditation, yoga, or daily rituals.<br><b>Transform Your Space with Spiritual Benefits</b><br>Light our dhoop cones to create a serene space that promotes peace, positivity, and meditation. The unique blend of fragrances aids in stress relief, enhances focus, and invites divine energies into your home. Whether it's for personal use, rituals, or gifting on auspicious occasions, Vedic Tatva Panchtatwa Assorted Dhoop Cones are your perfect companion on the spiritual journey.","price":349,"stock":100,"category":"Puja Samagri","image":"/attached_assets/product_images/product_71_img1.png","images":["/attached_assets/product_images/product_71_img1.png","/attached_assets/product_images/product_71_img2.png","/attached_assets/product_images/product_71_img3.png","/attached_assets/product_images/product_71_img4.png"],"badge":"New","salesCount":0,"highlights":["PREMIUM QUALITY: Crafted with care to provide an authentic aromatic experience.","AUTHENTIC INGREDIENTS: Made with 100% natural components, free from harmful additives.","SPIRITUAL SIGNIFICANCE: Represents the five elements for a balanced and harmonious environment.","VERSATILE USAGE: Ideal for meditation, rituals, or enhancing daily life.","GENEROUS QUANTITY: 200 cones offer lasting enjoyment and spiritual enrichment."],"features":["Material: 100% Natural Ingredients","Fragrance: Assorted (Indian Rose, Jasmine, Nagchampa, Chandan, Kapoor)","Cone Size: 1.5 Inches","Quantity: 200 Cones","Usage: Meditation, Rituals, Daily Environment Cleansing","Pack Dimensions: 10 x 8 x 5 cm"],"richDescription":"<b>Experience the Essence of the Panch Tatva</b><br>Immerse yourself in the divine aromas of the Vedic Tatva Panchtatwa Assorted Dhoop Cones. Each of the 200 carefully crafted cones, measuring 1.5 inches in size, embodies the essential elements of nature, representing the core beliefs of Vedic philosophy. The five fragrances included are: <ul><li><b>Indian Rose (Prithvi):</b> Grounding and nurturing, this fragrance brings the essence of Earth to your space.</li><li><b>Jasmine (Jal):</b> A soothing scent that symbolizes water, invoking tranquility and emotional well-being.</li><li><b>Nagchampa (Agni):</b> The vibrant essence of fire, igniting passion and energy in your surroundings.</li><li><b>Chandan/Sandalwood (Vayu):</b> Embracing the wisdom of air, this calming fragrance purifies the environment.</li><li><b>Kapoor/Camphor (Akash):</b> Uplifting and cleansing like space, this aroma enhances spiritual connections.</li></ul><br>Crafted from 100% natural ingredients, our dhoop cones offer an authentic experience, free from harmful chemicals. Each cone releases a gentle, fragrant smoke that enhances the atmosphere, making it perfect for meditation, yoga, or daily rituals.<br><b>Transform Your Space with Spiritual Benefits</b><br>Light our dhoop cones to create a serene space that promotes peace, positivity, and meditation. The unique blend of fragrances aids in stress relief, enhances focus, and invites divine energies into your home. Whether it's for personal use, rituals, or gifting on auspicious occasions, Vedic Tatva Panchtatwa Assorted Dhoop Cones are your perfect companion on the spiritual journey.","aplusEnabled":true,"slug":"vedic-tatva-panchtatwa-assorted-dhoop-cones"},
    {"name":"Vedic Tatva Bambooless Dhoop Sticks 8 Inch - 60 Pieces","description":"<b>Awaken Your Spiritual Senses with Vedic Tatva Bambooless Dhoop Sticks - Krishna Musk</b><br><br>Immerse yourself in the divine fragrance of our <b>Krishna Musk Dhoop Sticks</b>, inspired by the eternal essence of Lord Krishna, the embodiment of love and protection. Each stick is crafted to provide you with a mystical aroma that elevates your spirits and transforms your surroundings into a sacred space. The enchanting musk, reminiscent of divine presence, invites you to embark on a spiritual journey every time you light it.<br><br>Our <b>Bambooless Dhoop Sticks</b> are designed with purity in mind. Made from 100% natural ingredients, these sticks do not contain charcoal or harmful additives. Instead, they release a calming and serene fragrance, allowing you to meditate, pray, or simply relax in an environment that promotes tranquility and devotion. Light them during your Puja rituals, yoga practice, or whenever you seek peace in your life.<br><br>Not only do these dhoop sticks purify your air, but they also hold a deeper spiritual significance. In Vedic traditions, burning dhoop is considered an offering to the divine, symbolizing the removal of negativity and the invitation of positive energies into your space. Embrace this ancient practice with Vedic Tatva's premium quality sticks, and feel the divine connection strengthen.<br><br><b>Benefits:</b><br><ul><li>Creates a sacred atmosphere</li><li>Enhances meditation and prayer sessions</li><li>Natural ingredients support eco-friendliness</li><li>Soothes the mind and promotes relaxation</li></ul>","price":299,"stock":100,"category":"Puja Samagri","image":"/attached_assets/product_images/product_77_img1.png","images":["/attached_assets/product_images/product_77_img1.png","/attached_assets/product_images/product_77_img2.png","/attached_assets/product_images/product_77_img3.png","/attached_assets/product_images/product_77_img4.png"],"badge":"New","salesCount":0,"highlights":["PREMIUM QUALITY: Crafted from 100% natural ingredients for a pure experience.","AUTHENTIC KRISHNA MUSK FRAGRANCE: Inspired by the divine essence of Lord Krishna.","CHARCOAL FREE: Enjoy clean burning without harmful additives or pollutants.","SPIRITUAL SIGNIFICANCE: Elevates your meditation and prayer rituals.","LONG-LASTING: Each stick burns evenly, providing hours of enchanting aroma.","ECO-FRIENDLY: Bambooless design supports sustainable spiritual practices."],"features":["[object Object]","[object Object]","[object Object]","[object Object]","[object Object]","[object Object]"],"richDescription":"<b>Awaken Your Spiritual Senses with Vedic Tatva Bambooless Dhoop Sticks - Krishna Musk</b><br><br>Immerse yourself in the divine fragrance of our <b>Krishna Musk Dhoop Sticks</b>, inspired by the eternal essence of Lord Krishna, the embodiment of love and protection. Each stick is crafted to provide you with a mystical aroma that elevates your spirits and transforms your surroundings into a sacred space. The enchanting musk, reminiscent of divine presence, invites you to embark on a spiritual journey every time you light it.<br><br>Our <b>Bambooless Dhoop Sticks</b> are designed with purity in mind. Made from 100% natural ingredients, these sticks do not contain charcoal or harmful additives. Instead, they release a calming and serene fragrance, allowing you to meditate, pray, or simply relax in an environment that promotes tranquility and devotion. Light them during your Puja rituals, yoga practice, or whenever you seek peace in your life.<br><br>Not only do these dhoop sticks purify your air, but they also hold a deeper spiritual significance. In Vedic traditions, burning dhoop is considered an offering to the divine, symbolizing the removal of negativity and the invitation of positive energies into your space. Embrace this ancient practice with Vedic Tatva's premium quality sticks, and feel the divine connection strengthen.<br><br><b>Benefits:</b><br><ul><li>Creates a sacred atmosphere</li><li>Enhances meditation and prayer sessions</li><li>Natural ingredients support eco-friendliness</li><li>Soothes the mind and promotes relaxation</li></ul>","aplusEnabled":true,"variations":"[{\"label\":\"Krishna Musk\",\"price\":299},{\"label\":\"Kailash Musk\",\"price\":299},{\"label\":\"Mahalaxmi Musk\",\"price\":299},{\"label\":\"Mahaveer Musk\",\"price\":299}]","slug":"vedic-tatva-bambooless-dhoop-sticks-krishna-musk"},
    {"name":"Vedic Tatva Handcrafted 10 Inch Bamboo Incense Sticks Assorted","description":"<b>Introducing the Vedic Tatva Handcrafted 10 Inch Bamboo Incense Sticks Assorted</b>. Crafted with love and spiritual intent, these incense sticks embody the essence of the Panch Tatva (Five Elements) - <i>Aakash</i> (Ether), <i>Vayu</i> (Air), <i>Agni</i> (Fire), <i>Jal</i> (Water), and <i>Pritvi</i> (Earth). Each pack contains 450 sticks, elegantly hand-rolled to perfection, ensuring that each fragrance not only elevates your surroundings but also enhances your spiritual experience.<br><br>Our assortment features the ethereal scents of <b>Rose</b>, <b>Jasmine</b>, <b>Nagchampa</b>, <b>Sandalwood</b>, and <b>Oud</b>. These non-toxic, charcoal-free incense sticks are crafted from natural ingredients and essential oils, making them perfect for daily rituals, meditation, or creating a peaceful ambiance in your sacred space.<br><br>Use these divine fragrances to promote tranquility, enhance focus during meditation, and cleanse the space of negative energies. The aromatic profile is designed to uplift your spirit, purify the environment, and connect you with the deeper realms of consciousness. Indulge in the transformative power of these incense sticks and allow their enchanting aromas to transport you to a world of serenity and bliss.<br><br><ul><li><b>USAGE:</b> Light a stick and let the fragrance fill your space.</li><li><b>BENEFITS:</b> Promotes relaxation, enhances meditation, and uplifts mood.</li></ul>","price":349,"stock":100,"category":"Puja Samagri","image":"/attached_assets/product_images/product_72_img1.png","images":["/attached_assets/product_images/product_72_img1.png","/attached_assets/product_images/product_72_img2.png","/attached_assets/product_images/product_72_img3.png","/attached_assets/product_images/product_72_img4.png"],"badge":"New","salesCount":0,"highlights":["PREMIUM QUALITY: Handcrafted with utmost care for a superior experience.","AUTHENTIC INGREDIENTS: Made with 100% natural materials and essential oils.","CHARCOAL FREE: Clean-burning incense sticks for a pure aromatic experience.","SPIRITUAL SIGNIFICANCE: Represents the Five Elements for holistic well-being.","LARGE QUANTITY: 450 sticks ensure long-lasting enjoyment.","VARIETY OF FRAGRANCES: Provides a selection of scents to elevate any environment."],"features":["Material: 100% Natural Bamboo","Fragrance Variants: Rose, Jasmine, Nagchampa, Sandalwood, Oud","Length: 10 Inches","Stick Count: 450 Sticks","Charcoal Content: 0%","Handcrafted: Yes","Burn Time: Approximately 30-40 minutes per stick","Packaging: Eco-friendly recyclable materials"],"richDescription":"<b>Introducing the Vedic Tatva Handcrafted 10 Inch Bamboo Incense Sticks Assorted</b>. Crafted with love and spiritual intent, these incense sticks embody the essence of the Panch Tatva (Five Elements) - <i>Aakash</i> (Ether), <i>Vayu</i> (Air), <i>Agni</i> (Fire), <i>Jal</i> (Water), and <i>Pritvi</i> (Earth). Each pack contains 450 sticks, elegantly hand-rolled to perfection, ensuring that each fragrance not only elevates your surroundings but also enhances your spiritual experience.<br><br>Our assortment features the ethereal scents of <b>Rose</b>, <b>Jasmine</b>, <b>Nagchampa</b>, <b>Sandalwood</b>, and <b>Oud</b>. These non-toxic, charcoal-free incense sticks are crafted from natural ingredients and essential oils, making them perfect for daily rituals, meditation, or creating a peaceful ambiance in your sacred space.<br><br>Use these divine fragrances to promote tranquility, enhance focus during meditation, and cleanse the space of negative energies. The aromatic profile is designed to uplift your spirit, purify the environment, and connect you with the deeper realms of consciousness. Indulge in the transformative power of these incense sticks and allow their enchanting aromas to transport you to a world of serenity and bliss.<br><br><ul><li><b>USAGE:</b> Light a stick and let the fragrance fill your space.</li><li><b>BENEFITS:</b> Promotes relaxation, enhances meditation, and uplifts mood.</li></ul>","aplusEnabled":true,"variations":"[{\"label\":\"450 Sticks\",\"price\":349},{\"label\":\"900 Sticks\",\"price\":699}]","slug":"vedic-tatva-handcrafted-10-inch-bamboo-incense-sticks-assorted"},
    {"name":"Vedic Tatva Terracotta Diya","description":"<b>Illuminate your spiritual journey with the Vedic Tatva Terracotta Diya set.</b><br><br>Each pack contains <b>50 handcrafted diyas</b>, meticulously made from a unique blend of terracotta clay and cow dung (gobar). These eco-friendly and biodegradable diyas are perfect for daily puja rituals, festive celebrations such as Diwali and Navratri, and any sacred occasion. Embrace tradition and sustainability during your worship.<br><br>Our diyas not only provide a warm glow but also resonate with spiritual significance. The cow dung blend adds <b>purifying properties</b>, making each diya a unique embodiment of artisan craftsmanship. Light these during your prayers, and invite positivity and harmony into your space.<br><br>Experience the essence of Indian heritage with our traditional handmade diyas. <ul><li>Pack of 50 unique and artisan-crafted diyas</li><li>Made from eco-friendly terracotta and cow dung</li><li>Biodegradable and sacred, ideal for puja</li><li>Perfect for Diwali, Navratri, and all festivals</li><li>Each diya is unique with heralded craftsmanship</li><li>Spiritually significant with purifying properties</li></ul>","price":149,"stock":100,"category":"Puja Samagri","image":"/attached_assets/product_images/product_82_img1.png","images":["/attached_assets/product_images/product_82_img1.png","/attached_assets/product_images/product_82_img2.png","/attached_assets/product_images/product_82_img3.png","/attached_assets/product_images/product_82_img4.png"],"badge":"New","salesCount":0,"highlights":["PACK OF 50: Perfect for festive occasions and daily puja.","HANDCRAFTED: Each diya is unique, showcasing fine artistry.","ECO-FRIENDLY: Made from terracotta and cow dung, safe for the environment.","PURIFYING PROPERTIES: The cow dung blend adds sacred significance.","TRADITIONAL: Ideal for Diwali, Navratri, and all spiritual ceremonies."],"features":["Weight: 1kg","Material: Terracotta and Cow Dung Blend","Number of Diyas: 50","Dimensions: 3 inches in diameter (approx.)","Color: Natural terracotta","Biodegradable: Yes","Handmade: Yes","Suitable for: Indoor and outdoor use"],"richDescription":"<b>Illuminate your spiritual journey with the Vedic Tatva Terracotta Diya set.</b><br><br>Each pack contains <b>50 handcrafted diyas</b>, meticulously made from a unique blend of terracotta clay and cow dung (gobar). These eco-friendly and biodegradable diyas are perfect for daily puja rituals, festive celebrations such as Diwali and Navratri, and any sacred occasion. Embrace tradition and sustainability during your worship.<br><br>Our diyas not only provide a warm glow but also resonate with spiritual significance. The cow dung blend adds <b>purifying properties</b>, making each diya a unique embodiment of artisan craftsmanship. Light these during your prayers, and invite positivity and harmony into your space.<br><br>Experience the essence of Indian heritage with our traditional handmade diyas. <ul><li>Pack of 50 unique and artisan-crafted diyas</li><li>Made from eco-friendly terracotta and cow dung</li><li>Biodegradable and sacred, ideal for puja</li><li>Perfect for Diwali, Navratri, and all festivals</li><li>Each diya is unique with heralded craftsmanship</li><li>Spiritually significant with purifying properties</li></ul>","aplusEnabled":true,"variations":"[{\"label\":\"50 Pieces\",\"price\":149},{\"label\":\"100 Pieces\",\"price\":299}]","slug":"vedic-tatva-terracotta-diya-50-pieces"}
  ]);

  // Pandit profiles are seeded idempotently via seedPanditProfiles() below.

  await db.insert(socialProofSettings).values({
    realRatio: 60,
    boostRatio: 40,
    viewMin: 12,
    viewMax: 45,
    salesBoostPercent: 15,
    urgencyEnabled: true,
    enabled: true,
  });

  console.log("Database seeded successfully!");

  // Seed Rudraksha catalog (idempotent — safe to call on every start)
  try {
    const { seedRudrakshaProducts } = await import("./seedRudraksha");
    await seedRudrakshaProducts();
  } catch (e) {
    console.error("Rudraksha seed error:", e);
  }

  // Seed Mala (Wearables) catalog from Tejvij & Sons (idempotent by slug)
  try {
    const { seedMalaProducts } = await import("./seedMalas");
    await seedMalaProducts();
  } catch (e) {
    console.error("Mala seed error:", e);
  }

  // Seed Dhoti & Kurta catalogue (idempotent by slug)
  try {
    const { seedDhotiKurtaProducts } = await import("./seedDhotiKurta");
    await seedDhotiKurtaProducts();
  } catch (e) {
    console.error("Dhoti & Kurta seed error:", e);
  }

  // Seed Havan Samagri catalogue (idempotent by slug)
  try {
    const { seedHavanSamagriProducts } = await import("./seedHavanSamagri");
    await seedHavanSamagriProducts();
  } catch (e) {
    console.error("Havan Samagri seed error:", e);
  }

  // Seed Brass & Copperware catalogue (idempotent by slug)
  try {
    const { seedBrassCopperwareProducts } = await import("./seedBrassCopperware");
    await seedBrassCopperwareProducts();
  } catch (e) {
    console.error("Brass & Copperware seed error:", e);
  }

  // Seed Idols & Murti catalogue (Brass · Silver · Clay variants, AI deity images)
  try {
    const { seedIdolsMurti } = await import("./seedIdolsMurti");
    await seedIdolsMurti();
  } catch (e) {
    console.error("Idols & Murti seed error:", e);
  }

  // Seed pandit profiles using the 8 portrait images in attached_assets/pandits/
  try {
    const { seedPanditProfiles } = await import("./seedPandits");
    await seedPanditProfiles();
  } catch (e) {
    console.error("Pandit seed error:", e);
  }
}

async function seedDonations() {
  await db.insert(donations).values([
    {
      name: "Gau Daan",
      nameHindi: "गौ दान",
      description: "Donate for the care and protection of holy cows. Gau Seva is considered one of the most sacred acts in Hindu dharma.",
      longDescription: "Gau Daan (cow donation) is one of the highest forms of charity in Sanatan Dharma. The cow is revered as Kamadhenu, the divine wish-fulfilling cow. Your donation supports feeding, shelter, medical care, and protection of indigenous Indian cow breeds at certified Gaushalas across India.",
      image: "/src/assets/images/puja_1.jpg",
      category: "Animal Welfare",
      suggestedAmounts: ["501", "1100", "2100", "5100", "11000", "21000"],
      minAmount: 101,
      active: true,
      benefitsText: "Gau Daan removes sins of seven lifetimes. It brings prosperity, health, and spiritual merit to the donor and their family.",
      sortOrder: 1,
    },
    {
      name: "Anna Daan",
      nameHindi: "अन्न दान",
      description: "Feed the hungry and earn the highest punya. Anna Daan is considered the greatest of all donations.",
      longDescription: "Anna Daan (food donation) is regarded as Maha Daan - the greatest charity. The Vedas state 'Annam Brahma' - food is God itself. Your donation provides nutritious meals to the underprivileged, temple devotees, sadhus, and those in need.",
      image: "/src/assets/images/puja_2.jpg",
      category: "Food & Nutrition",
      suggestedAmounts: ["251", "501", "1100", "2100", "5100", "11000"],
      minAmount: 101,
      active: true,
      benefitsText: "The Mahabharata says feeding one hungry person is equivalent to performing a thousand yagyas. Anna Daan nourishes both body and soul.",
      sortOrder: 2,
    },
    {
      name: "Vastra Daan",
      nameHindi: "वस्त्र दान",
      description: "Donate clothes to the needy. Vastra Daan brings warmth and dignity to those less fortunate.",
      longDescription: "Vastra Daan (cloth donation) is a sacred act of providing clothing to those in need. In Hindu tradition, offering clothes is considered highly meritorious, especially during festivals, eclipses, and sacred occasions.",
      image: "/src/assets/images/puja_3.jpg",
      category: "Social Welfare",
      suggestedAmounts: ["501", "1100", "2100", "5100"],
      minAmount: 251,
      active: true,
      benefitsText: "Vastra Daan brings beauty, respect, and good fortune. It protects the donor from poverty in future lives.",
      sortOrder: 3,
    },
    {
      name: "Vidya Daan",
      nameHindi: "विद्या दान",
      description: "Support education for underprivileged children. Knowledge is the greatest gift one can give.",
      longDescription: "Vidya Daan (education donation) is the gift of knowledge - considered imperishable and the most valuable of all donations. Your contribution supports education for underprivileged children, Vedic pathshala students, and Sanskrit scholars.",
      image: "/src/assets/images/puja_1.jpg",
      category: "Education",
      suggestedAmounts: ["1100", "2100", "5100", "11000", "21000"],
      minAmount: 501,
      active: true,
      benefitsText: "Vidya Daan bestows infinite merit. It illuminates lives and continues to give returns through generations.",
      sortOrder: 4,
    },
    {
      name: "Aushadhi Daan",
      nameHindi: "औषधि दान",
      description: "Provide medical aid and medicines to those who cannot afford treatment.",
      longDescription: "Aushadhi Daan (medicine donation) supports healthcare access for the underprivileged. In Dharmic tradition, healing the sick is one of the noblest services.",
      image: "/src/assets/images/puja_2.jpg",
      category: "Healthcare",
      suggestedAmounts: ["501", "1100", "2100", "5100", "11000"],
      minAmount: 251,
      active: true,
      benefitsText: "Aushadhi Daan grants good health and longevity. It is said to cure ailments of the donor in this life and future lives.",
      sortOrder: 5,
    },
    {
      name: "Bhoomi Daan",
      nameHindi: "भूमि दान",
      description: "Contribute to temple construction, ashram development, and sacred land preservation.",
      longDescription: "Bhoomi Daan (land/construction donation) supports the building and maintenance of temples, ashrams, dharamshalas, and sacred spaces.",
      image: "/src/assets/images/puja_3.jpg",
      category: "Temple & Infrastructure",
      suggestedAmounts: ["2100", "5100", "11000", "21000", "51000"],
      minAmount: 1100,
      active: true,
      benefitsText: "Bhoomi Daan creates eternal merit. Building a temple or sacred space brings blessings for generations of the donor's family.",
      sortOrder: 6,
    },
    {
      name: "Daan for Teerth Yatra",
      nameHindi: "तीर्थ यात्रा दान",
      description: "Help elderly and poor devotees undertake sacred pilgrimages to holy places.",
      longDescription: "Teerth Yatra Daan supports pilgrimage trips for elderly, disabled, and economically weaker devotees to sacred places like Char Dham, Varanasi, Puri, Rameswaram, and other teerth sthan.",
      image: "/src/assets/images/puja_1.jpg",
      category: "Pilgrimage",
      suggestedAmounts: ["1100", "2100", "5100", "11000", "21000"],
      minAmount: 501,
      active: true,
      benefitsText: "Supporting Teerth Yatra for others grants the same merit as performing the pilgrimage yourself. It is a deeply compassionate act.",
      sortOrder: 7,
    },
    {
      name: "Deepak Daan",
      nameHindi: "दीपक दान",
      description: "Light diyas and lamps at temples. Dispel darkness and ignorance through the gift of light.",
      longDescription: "Deepak Daan (lamp donation) is the sacred act of lighting lamps at temples and holy places. In Vedic tradition, light represents knowledge, consciousness, and the divine.",
      image: "/src/assets/images/puja_2.jpg",
      category: "Temple Seva",
      suggestedAmounts: ["101", "251", "501", "1100", "2100"],
      minAmount: 101,
      active: true,
      benefitsText: "Deepak Daan removes darkness from one's life. It brings clarity of mind, spiritual illumination, and divine grace.",
      sortOrder: 8,
    },
  ]);
}

async function seedSeoPages() {
  await db.insert(seoPages).values([
    {
      pagePath: "/",
      metaTitle: "Vedic Tatva - Premium Spiritual Products & Puja Services | Shop Online",
      metaDescription: "Shop authentic spiritual products, book verified pandits for puja ceremonies, get AI-powered astrology services. Free Kundli, baby names & palm reading. India's trusted vedic platform.",
      metaKeywords: "spiritual products, puja items, rudraksha, vedic astrology, pandit booking, online puja, kundli, baby names, palm reading, spiritual store india",
      canonicalUrl: "https://vedictatva.com/",
      ogTitle: "Vedic Tatva - Your Spiritual Journey Starts Here",
      ogDescription: "Premium spiritual products, verified pandit services, and AI-powered astrology. Shop authentic puja items online.",
      ogType: "website",
      robotsIndex: true,
      robotsFollow: true,
      priority: 1.0,
      changeFreq: "daily",
      schemaMarkup: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "Vedic Tatva",
        "url": "https://vedictatva.com",
        "description": "Premium spiritual ecommerce and services platform",
        "potentialAction": { "@type": "SearchAction", "target": "https://vedictatva.com/shop?q={search_term_string}", "query-input": "required name=search_term_string" }
      }),
      isActive: true,
    },
    {
      pagePath: "/shop",
      metaTitle: "Shop Spiritual Products Online - Rudraksha, Puja Items, Gemstones | Vedic Tatva",
      metaDescription: "Browse our curated collection of authentic spiritual products. Rudraksha malas, puja thalis, incense, gemstones, idols & more. Free shipping on orders above ₹999.",
      metaKeywords: "buy spiritual products online, rudraksha online, puja items, gemstones, incense sticks, brass idols, prayer beads, spiritual shop india",
      canonicalUrl: "https://vedictatva.com/shop",
      ogTitle: "Shop Spiritual Products - Vedic Tatva",
      ogDescription: "Authentic spiritual products with free shipping. Rudraksha, gemstones, puja items & more.",
      robotsIndex: true,
      robotsFollow: true,
      priority: 0.9,
      changeFreq: "daily",
      isActive: true,
    },
    {
      pagePath: "/pandits",
      metaTitle: "Book Verified Pandits for Puja Ceremonies - All Cities | Vedic Tatva",
      metaDescription: "Find and book verified, experienced pandits for all types of puja ceremonies across India. Satyanarayan Puja, Griha Pravesh, Wedding ceremonies & more.",
      metaKeywords: "book pandit online, pandit for puja, verified pandits, puja booking, griha pravesh pandit, satyanarayan puja, wedding pandit, pandit near me",
      canonicalUrl: "https://vedictatva.com/pandits",
      ogTitle: "Book Verified Pandits - Vedic Tatva",
      ogDescription: "Experienced, verified pandits for all ceremonies. Book online with confidence.",
      robotsIndex: true,
      robotsFollow: true,
      priority: 0.8,
      changeFreq: "weekly",
      isActive: true,
    },
    {
      pagePath: "/astrology",
      metaTitle: "Vedic Astrology Services - AI Kundli, Palm Reading, Baby Names | Vedic Tatva",
      metaDescription: "Get free AI-powered Vedic astrology services. Generate your Kundli, discover nakshatra-based baby names, and get palm reading analysis. Consult expert astrologers online.",
      metaKeywords: "vedic astrology, free kundli, online kundli, baby names by nakshatra, palm reading, astrology consultation, horoscope, birth chart",
      canonicalUrl: "https://vedictatva.com/astrology",
      ogTitle: "Free AI Vedic Astrology Services - Vedic Tatva",
      ogDescription: "Free Kundli generation, baby name suggestions, and AI palm reading. Plus expert astrologer consultations.",
      robotsIndex: true,
      robotsFollow: true,
      priority: 0.8,
      changeFreq: "weekly",
      isActive: true,
    },
    {
      pagePath: "/online-puja-booking",
      metaTitle: "Book Puja Ceremonies Online - Satyanarayan, Griha Pravesh & More | Vedic Tatva",
      metaDescription: "Schedule sacred puja ceremonies with verified pandits. Satyanarayan Puja, Griha Pravesh, Navagraha Shanti, Rudrabhishek & more. Online booking with transparent pricing.",
      metaKeywords: "book puja online, satyanarayan puja, griha pravesh, navagraha shanti, rudrabhishek, online puja booking, puja ceremony",
      canonicalUrl: "https://vedictatva.com/puja",
      robotsIndex: true,
      robotsFollow: true,
      priority: 0.8,
      changeFreq: "weekly",
      isActive: true,
    },
    {
      pagePath: "/kathas",
      metaTitle: "Sacred Divine Stories (Kathas) - Hindu Mythology | Vedic Tatva",
      metaDescription: "Read and listen to sacred divine stories from Hindu mythology. Stories of Ganesha, Shiva, Vishnu, Hanuman, Krishna, Durga, Rama & Lakshmi with audio narration.",
      metaKeywords: "divine stories, hindu kathas, mythology stories, ganesha stories, shiva stories, krishna leela, hanuman chalisa, sacred stories hindi",
      canonicalUrl: "https://vedictatva.com/kathas",
      robotsIndex: true,
      robotsFollow: true,
      priority: 0.7,
      changeFreq: "weekly",
      isActive: true,
    },
    {
      pagePath: "/donations",
      metaTitle: "Sacred Donations - Gau Daan, Anna Daan & More | Vedic Tatva",
      metaDescription: "Make sacred donations online. Gau Daan, Anna Daan, Vastra Daan, Vidya Daan & more. Every donation comes with divine blessings and transparent tracking.",
      metaKeywords: "sacred donations, gau daan, anna daan, vastra daan, hindu donations online, temple donations, charity india",
      canonicalUrl: "https://vedictatva.com/donations",
      robotsIndex: true,
      robotsFollow: true,
      priority: 0.7,
      changeFreq: "weekly",
      isActive: true,
    },
    {
      pagePath: "/cart",
      metaTitle: "Shopping Cart | Vedic Tatva",
      metaDescription: "Review your spiritual products cart. Secure checkout with Razorpay payment.",
      robotsIndex: false,
      robotsFollow: true,
      priority: 0.1,
      changeFreq: "never",
      isActive: true,
    },
    {
      pagePath: "/checkout",
      metaTitle: "Checkout | Vedic Tatva",
      metaDescription: "Complete your purchase securely with Razorpay payment gateway.",
      robotsIndex: false,
      robotsFollow: false,
      priority: 0.1,
      changeFreq: "never",
      isActive: true,
    },
    {
      pagePath: "/admin",
      metaTitle: "Admin Dashboard | Vedic Tatva",
      metaDescription: "Admin dashboard for managing Vedic Tatva platform.",
      robotsIndex: false,
      robotsFollow: false,
      priority: 0.0,
      changeFreq: "never",
      isActive: true,
    },
  ]);
}

async function ensurePindDaanSeoPages() {
  const baseUrl = "https://vedictatva.com";

  const faqSchema = (faqs: Array<{ q: string; a: string }>) =>
    JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqs.map((f) => ({
        "@type": "Question",
        "name": f.q,
        "acceptedAnswer": { "@type": "Answer", "text": f.a },
      })),
    });

  const breadcrumbSchema = (items: Array<{ name: string; path: string }>) =>
    JSON.stringify({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": items.map((it, idx) => ({
        "@type": "ListItem",
        "position": idx + 1,
        "name": it.name,
        "item": baseUrl + it.path,
      })),
    });

  const combineSchemas = (...schemas: string[]) =>
    JSON.stringify(schemas.map((s) => JSON.parse(s)));

  const entries: Array<{
    pagePath: string;
    metaTitle: string;
    metaDescription: string;
    metaKeywords: string;
    h1Override: string;
    breadcrumbLabel: string;
    schemaMarkup: string;
  }> = [
    {
      pagePath: "/pind-daan",
      metaTitle: "Pind Daan, Tarpan & Shradh Online — Kashi, Gaya, Haridwar | Vedic Tatva",
      metaDescription:
        "Book authentic Pind Daan, Tarpan and Shradh online at Kashi, Gaya, Haridwar — performed by verified Tirth Purohits with live video Sankalp, photo proof and prasad couriered worldwide.",
      metaKeywords:
        "pind daan online, tarpan, shradh, pitru paksha, gaya pind daan, kashi pind daan, haridwar narayani shila, pitru dosh nivaran, ancestor puja, vedic ritual",
      h1Override: "Pind Daan, Tarpan & Shradh — Online Bookings at Sacred Tirthas",
      breadcrumbLabel: "Pind Daan",
      schemaMarkup: combineSchemas(
        faqSchema([
          { q: "Is remote Pind Daan accepted by shastra?", a: "Yes — pratinidhi (representative) shradh is well established in dharma shastra. The Sankalp is taken in your name and gotra and the merit accrues fully to you and your ancestors." },
          { q: "Which tirth should I choose?", a: "Gaya for once-in-a-lifetime liberation, Kashi for moksha-aligned shradh, Haridwar specifically for Pitru Dosh nivaran. Annual remote service can rotate across these tirthas." },
          { q: "When is the best time to book?", a: "Pitru Paksha (16-day window in Bhadrapada-Ashwin) is most powerful, but Amavasya, the death tithi, or any Krishna Paksha day are all auspicious." },
          { q: "Do you ship prasad outside India?", a: "Yes — we courier Ganga jal and prasad to 60+ countries via India Post International or DHL. Typical delivery 7–14 days; customs cleared." },
        ]),
        breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Pind Daan", path: "/pind-daan" },
        ]),
      ),
    },
    {
      pagePath: "/pind-daan/kashi",
      metaTitle: "Pind Daan in Kashi (Varanasi) — Manikarnika & Pishachmochan | Vedic Tatva",
      metaDescription:
        "Authentic Pind Daan in Kashi at Manikarnika Ghat and Pishachmochan Kund Tripindi Shradh — performed by Kashi Tirth Purohits with live video Sankalp, photo proof and Ganga jal prasad.",
      metaKeywords:
        "pind daan kashi, varanasi pind daan, manikarnika ghat shradh, pishachmochan tripindi shradh, kashi tarpan, online pind daan kashi, kashi tirth purohit",
      h1Override: "Pind Daan in Kashi (Varanasi) — Liberation at the City of Lord Shiva",
      breadcrumbLabel: "Kashi",
      schemaMarkup: combineSchemas(
        faqSchema([
          { q: "Why is Kashi considered the most sacred place for Pind Daan?", a: "Kashi is the only city believed to grant moksha by mere death within its limits. Pind Daan here is said to free ancestors from rebirth and grant them sadgati, as prescribed in the Garuda Purana." },
          { q: "Can it be done without me being physically present?", a: "Yes — pratinidhi shradh is well established. Our Tirth Purohit takes the Sankalp in your name and gotra over a brief video call, then performs the ritual on your behalf." },
          { q: "What is the difference between Manikarnika and Pishachmochan?", a: "Manikarnika Ghat is for general Pind Daan and Tarpan. Pishachmochan Kund is specifically for Tripindi Shradh — meant for ancestors believed to be wandering in lower yonis due to incomplete rites or unnatural death." },
          { q: "What proof do I receive?", a: "A signed Sankalp Patra, photographs of each stage of the ritual, a 2–3 minute video, and Ganga jal plus prasad couriered to your address." },
        ]),
        breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Pind Daan", path: "/pind-daan" },
          { name: "Kashi", path: "/pind-daan/kashi" },
        ]),
      ),
    },
    {
      pagePath: "/pind-daan/gaya",
      metaTitle: "Pind Daan in Gaya — Vishnupad, Phalgu & Akshayavat | Vedic Tatva",
      metaDescription:
        "Pind Daan in Gaya at Vishnupad Mandir, Phalgu River and Akshayavat by traditional Gayawal Tirth Purohits. 1-day or 3-day shastric vidhi with live Sankalp, photo proof and prasad.",
      metaKeywords:
        "pind daan gaya, gaya shradh, vishnupad mandir pind daan, akshayavat sankalp, phalgu river tarpan, gayawal pandit, online gaya shradh, pitru paksha gaya",
      h1Override: "Pind Daan in Gaya — The Final Liberation of Ancestors",
      breadcrumbLabel: "Gaya",
      schemaMarkup: combineSchemas(
        faqSchema([
          { q: "Why does the Garuda Purana give Gaya the highest place for Pind Daan?", a: "Lord Vishnu himself granted Gaya the boon that any Pind Daan performed here would liberate ancestors permanently. The Garuda Purana, Vayu Purana and Mahabharata describe Gaya Shradh as akshay (imperishable)." },
          { q: "Is Gaya Shradh a one-time ritual?", a: "Yes — traditionally performed once in a lifetime by a son or descendant. After completion, the obligation of repeated annual shradh is considered fulfilled, though many families still observe annual Tarpan." },
          { q: "Why offerings work at Phalgu despite it being dry?", a: "Lord Rama is said to have cursed Phalgu to flow underground. The current still flows beneath the sand and pinda placed on the dry bed is carried to the ancestors by this hidden Antar-vahini Phalgu." },
          { q: "Can Gaya Shradh be done remotely?", a: "Yes — the shastras allow a Pratinidhi Karta to perform the karya on your behalf after Sankalp is taken in your name and gotra. We host the Sankalp via video call from anywhere in the world." },
        ]),
        breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Pind Daan", path: "/pind-daan" },
          { name: "Gaya", path: "/pind-daan/gaya" },
        ]),
      ),
    },
    {
      pagePath: "/pind-daan/haridwar",
      metaTitle: "Pind Daan & Narayani Shila Puja in Haridwar — Pitru Dosh Nivaran | Vedic Tatva",
      metaDescription:
        "Pind Daan and Narayani Shila Pitru Dosh Nivaran puja in Haridwar at Har Ki Pauri — performed by registered Tirth Purohits with same-day Sankalp, photo proof and Ganga jal prasad.",
      metaKeywords:
        "pind daan haridwar, narayani shila puja, pitru dosh nivaran, har ki pauri tarpan, kankhal shradh, haridwar tirth purohit, online haridwar shradh",
      h1Override: "Pind Daan in Haridwar — Where Mother Ganga Carries Your Offering",
      breadcrumbLabel: "Haridwar",
      schemaMarkup: combineSchemas(
        faqSchema([
          { q: "What is Pitru Dosh and how does Narayani Shila puja help?", a: "Pitru Dosh in a kundli indicates ancestors are not at peace — symptoms include obstacles in marriage, childbirth or career. The Narayani Shila puja in Haridwar is the principal shastric remedy because the shila is non-different from the body of Lord Vishnu." },
          { q: "Why is Har Ki Pauri so important for Tarpan?", a: "Har Ki Pauri houses Brahmakund, where a drop of Amrit fell during the churning of the ocean. Tarpan offered into this stream is believed to reach the ancestors instantly through Mother Ganga." },
          { q: "Do I need to come to Haridwar in person?", a: "No — Haridwar shradh can be performed by the Tirth Purohit as your pratinidhi after a Sankalp video call, with full proof of completion sent to your address." },
          { q: "When should Haridwar Pind Daan be performed?", a: "Pitru Paksha is most auspicious. Other recommended days include Amavasya, the death anniversary, Somvati Amavasya, Mauni Amavasya and Kumbh / Ardh Kumbh periods." },
        ]),
        breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Pind Daan", path: "/pind-daan" },
          { name: "Haridwar", path: "/pind-daan/haridwar" },
        ]),
      ),
    },
    {
      pagePath: "/pind-daan/why-important",
      metaTitle: "Why Pind Daan Is Important in Sanatan Dharma — Pitru Rina Explained | Vedic Tatva",
      metaDescription:
        "Why Pind Daan, Tarpan and Shradh are essential in Sanatan Dharma — Pitru Rina, Garuda Purana wisdom, removal of Pitru Dosh, and the spiritual mechanics of ancestor offerings.",
      metaKeywords:
        "why pind daan, importance of shradh, pitru rina, pitru dosh, garuda purana shradh, ancestor worship hinduism, pitru paksha significance, pinda offering meaning",
      h1Override: "Why Pind Daan Is the Highest Form of Devotion to Our Ancestors",
      breadcrumbLabel: "Why It's Important",
      schemaMarkup: combineSchemas(
        faqSchema([
          { q: "What exactly happens spiritually during Pind Daan?", a: "The cooked rice-based pinda is energised by Sanskrit mantras and offered to the subtle body of the ancestor. The Garuda Purana describes how this nourishes the departed in the intermediate state and helps them progress towards higher lokas." },
          { q: "Is Pind Daan only for the dead — does it benefit the living?", a: "Both. Ancestors receive sadgati and peace; descendants receive blessings, removal of Pitru Dosh, removal of obstacles in marriage and progeny, and overall family well-being." },
          { q: "Who can perform Pind Daan — only sons?", a: "Traditionally the eldest son, but daughters, grandsons, brothers, nephews or even a designated representative may do it. Mother Sita herself performed Pind Daan for King Dasharatha at Gaya." },
          { q: "Why is Pitru Paksha specifically the time for shradh?", a: "Pitru Paksha is the 16-day Krishna Paksha of Bhadrapada–Ashwin when the Sun enters Kanya rashi. Shastras say the gateway to pitru-loka opens during this period, multiplying the effect of any shradh performed." },
        ]),
        breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Pind Daan", path: "/pind-daan" },
          { name: "Why It's Important", path: "/pind-daan/why-important" },
        ]),
      ),
    },
    {
      pagePath: "/pind-daan/sites-in-india",
      metaTitle: "Sacred Pind Daan Sites in India — Gaya, Kashi, Haridwar & More | Vedic Tatva",
      metaDescription:
        "Most sacred Pind Daan sites in India — Gaya, Kashi, Haridwar, Trimbakeshwar, Rameshwaram, Badrinath Brahma Kapal. Each tirtha's significance and best use case for ancestor rites.",
      metaKeywords:
        "pind daan sites india, pitru tirth india, gaya kashi haridwar, trimbakeshwar narayan nagbali, rameshwaram tarpan, brahma kapal badrinath, sacred shradh sites",
      h1Override: "The Most Sacred Pind Daan and Tarpan Sites of India",
      breadcrumbLabel: "Sacred Sites",
      schemaMarkup: combineSchemas(
        faqSchema([
          { q: "Which Pind Daan site is the most powerful?", a: "Gaya holds the highest position — Pind Daan there is considered akshay (imperishable) and traditionally fulfils the obligation permanently. Kashi follows for moksha-related shradh, and Haridwar specifically for Pitru Dosh nivaran." },
          { q: "Can I perform Pind Daan at multiple tirthas?", a: "Yes — many devout families do. A one-time Gaya Shradh combined with annual Tarpan at Haridwar or the local river is a beautiful tradition. Each tirtha adds its own blessing." },
          { q: "What is special about Trimbakeshwar?", a: "Trimbakeshwar is one of the twelve Jyotirlingas and the source of the Godavari. It is uniquely prescribed for Narayan Nagbali (3-day vidhi for unnatural deaths) and Kalsarp Dosh nivaran in addition to standard Pind Daan." },
          { q: "Is Brahma Kapal in Badrinath equal to Gaya Shradh?", a: "Yes — Skanda Purana mentions that Brahma Kapal is one of the few sites where Pind Daan carries fruit equal to Gaya. The high-altitude location and proximity of Lord Badri Vishal lend it exceptional power." },
        ]),
        breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Pind Daan", path: "/pind-daan" },
          { name: "Sacred Sites", path: "/pind-daan/sites-in-india" },
        ]),
      ),
    },
    {
      pagePath: "/pind-daan/yearly-remote",
      metaTitle: "Yearly Remote Tarpan & Pind Daan on Death Anniversary — NRI Service | Vedic Tatva",
      metaDescription:
        "Annual remote Tarpan and Pind Daan service on the death tithi at Kashi, Gaya or Haridwar — for NRIs and devotees abroad. Live video Sankalp, photo proof, prasad couriered worldwide.",
      metaKeywords:
        "yearly tarpan online, remote pind daan, nri shradh service, death anniversary shradh, annual pitru seva, online tarpan subscription, video sankalp",
      h1Override: "Yearly Remote Tarpan & Pind Daan — Never Miss Your Ancestor's Shradh",
      breadcrumbLabel: "Yearly Remote",
      schemaMarkup: combineSchemas(
        faqSchema([
          { q: "Is remote yearly shradh shastrically valid?", a: "Yes — the concept of pratinidhi karta is well established in dharma shastra. The Sankalp is taken in your name and gotra, you participate via video, and the merit accrues fully to you and your ancestors." },
          { q: "Which tithi is used for the annual shradh?", a: "The traditional rule is the same Krishna Paksha tithi as the day of death, regardless of the English calendar date. We calculate this each year using authentic panchang." },
          { q: "Can I add multiple ancestors?", a: "Yes — many families enrol both parents, grandparents and other elders. Each gets their own shradh on their own tithi, or several can be combined on Pitru Paksha Amavasya as Sarva Pitru Shradh." },
          { q: "Does prasad reach abroad?", a: "Yes — we courier Ganga jal and prasad to 60+ countries via India Post International or DHL. Customs cleared; arrival typically 7–14 days." },
        ]),
        breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Pind Daan", path: "/pind-daan" },
          { name: "Yearly Remote", path: "/pind-daan/yearly-remote" },
        ]),
      ),
    },
  ];

  for (const e of entries) {
    await db.insert(seoPages).values({
      pagePath: e.pagePath,
      metaTitle: e.metaTitle,
      metaDescription: e.metaDescription,
      metaKeywords: e.metaKeywords,
      canonicalUrl: `https://vedictatva.com${e.pagePath}`,
      ogTitle: e.metaTitle,
      ogDescription: e.metaDescription,
      ogType: "article",
      twitterTitle: e.metaTitle,
      twitterDescription: e.metaDescription,
      robotsIndex: true,
      robotsFollow: true,
      priority: e.pagePath === "/pind-daan" ? 0.9 : 0.8,
      changeFreq: "monthly",
      schemaMarkup: e.schemaMarkup,
      h1Override: e.h1Override,
      breadcrumbLabel: e.breadcrumbLabel,
      isActive: true,
    }).onConflictDoUpdate({
      target: seoPages.pagePath,
      set: {
        metaTitle: e.metaTitle,
        metaDescription: e.metaDescription,
        metaKeywords: e.metaKeywords,
        canonicalUrl: `https://vedictatva.com${e.pagePath}`,
        ogTitle: e.metaTitle,
        ogDescription: e.metaDescription,
        ogType: "article",
        twitterTitle: e.metaTitle,
        twitterDescription: e.metaDescription,
        schemaMarkup: e.schemaMarkup,
        h1Override: e.h1Override,
        breadcrumbLabel: e.breadcrumbLabel,
        updatedAt: new Date(),
      },
    });
  }
  console.log(`Ensured ${entries.length} Pind Daan SEO pages.`);
}

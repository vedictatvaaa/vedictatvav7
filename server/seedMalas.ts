import { db } from "./db";
import { products } from "@shared/schema";
import { eq, sql } from "drizzle-orm";

type MalaItem = {
  id: number;
  name: string;
  shortName: string;
  material: string;
  beadCount: string;
  beadSize: string;
  origin: string;
  deity: string;
  planet: string;
  mantra: string;
  rulingChakra: string;
  significance: string;
  shortDescription: string;
  benefits: string[];
  whoShouldUse: string[];
  imageKey: string;
};

const IMG = (itemId: number) => `/attached_assets/mala_catalogue/sku-${itemId}.jpg`;

const ITEMS: MalaItem[] = [
  // ── Indonesian Rudraksha Malas (1-13) ──
  { id: 1, name: "Vedic Tatva 2 Mukhi Indonesian Rudraksha Mala (108+1 Beads) — Lab Certified Original", shortName: "2 Mukhi Indonesian Rudraksha Mala", material: "Indonesian Rudraksha (2 Mukhi)", beadCount: "108 + 1 Guru bead", beadSize: "6–7 mm", origin: "Java, Indonesia", deity: "Ardhanarishwar (Shiva-Shakti)", planet: "Moon (Chandra)", mantra: "Om Namah", rulingChakra: "Sahasrara & Anahata", significance: "Worn in mala form, the 2 Mukhi Indonesian Rudraksha brings unity in relationships, harmony of male-female energies and balances the lunar mind during long japa sessions.",
    shortDescription: "Mala of small lab-certified 2 Mukhi Indonesian (Java) Rudraksha — ideal for couples, family unity and Chandra dosha shanti.",
    benefits: ["Balances male-female energies and harmonises relationships", "Strengthens the Moon and calms an overactive mind during japa", "Ideal for family unity, parenting and marital bliss", "Supports daily 108-mantra meditation with cooling vibrations", "Worn by sadhaks on the Shiva-Shakti path"],
    whoShouldUse: ["Couples seeking marital harmony", "People with weak/afflicted Moon in horoscope", "Anyone doing daily Shiva or Devi japa", "Those struggling with anxiety, mood swings or insomnia"], imageKey: "indonesian_rudraksha" },
  { id: 2, name: "Vedic Tatva 3 Mukhi Indonesian Rudraksha Mala (108+1 Beads) — Lab Certified Original", shortName: "3 Mukhi Indonesian Rudraksha Mala", material: "Indonesian Rudraksha (3 Mukhi)", beadCount: "108 + 1 Guru bead", beadSize: "6–7 mm", origin: "Java, Indonesia", deity: "Agni Dev (God of Fire)", planet: "Mars (Mangal)", mantra: "Om Kleem Namah", rulingChakra: "Manipura (Solar Plexus)", significance: "A mala of 3 Mukhi Indonesian Rudraksha is like wearing 108 tiny sacred fires — it burns away past karmas, accumulated guilt and ignites willpower.",
    shortDescription: "108-bead 3 Mukhi Indonesian Rudraksha mala — purifies past karma, strengthens Mars and boosts confidence during japa.",
    benefits: ["Burns past karmas and removes guilt with each bead chanted", "Strengthens Mars, courage and willpower", "Improves blood circulation and metabolism", "Pacifies Mangal dosha and Pitra dosha", "Fuels self-confidence in entrepreneurs and athletes"],
    whoShouldUse: ["Anyone with weak or afflicted Mars", "People with low self-confidence", "Sportspersons, soldiers, entrepreneurs", "Sadhaks doing Hanuman or Mangal japa"], imageKey: "indonesian_rudraksha" },
  { id: 3, name: "Vedic Tatva 4 Mukhi Indonesian Rudraksha Mala (108+1 Beads) — Lab Certified Original", shortName: "4 Mukhi Indonesian Rudraksha Mala", material: "Indonesian Rudraksha (4 Mukhi)", beadCount: "108 + 1 Guru bead", beadSize: "6–7 mm", origin: "Java, Indonesia", deity: "Lord Brahma", planet: "Mercury (Budha)", mantra: "Om Hreem Namah", rulingChakra: "Vishuddhi & Ajna", significance: "Mala of 4 Mukhi Rudraksha awakens Vishuddhi and Ajna chakras across all 108 beads — the ultimate japa aid for students, scholars and creative thinkers.",
    shortDescription: "108-bead 4 Mukhi Indonesian Rudraksha mala — boosts intellect, memory, speech and creativity, blessed by Lord Brahma.",
    benefits: ["Sharpens memory, focus and intellect with daily japa", "Improves speech, communication and creative expression", "Strengthens Mercury (Budha) in horoscope", "Calms restless thoughts during meditation", "Ideal for students, writers and teachers"],
    whoShouldUse: ["Students preparing for competitive exams", "Writers, journalists, public speakers", "People with weak Mercury", "Anyone seeking improved memory and focus"], imageKey: "indonesian_rudraksha" },
  { id: 4, name: "Vedic Tatva 5 Mukhi Indonesian Rudraksha Mala 6mm (108+1 Beads) — Lab Certified Original", shortName: "5 Mukhi Indonesian Rudraksha Mala 6mm", material: "Indonesian Rudraksha (5 Mukhi)", beadCount: "108 + 1 Guru bead", beadSize: "6 mm", origin: "Java, Indonesia", deity: "Kalagni Rudra (Lord Shiva)", planet: "Jupiter (Guru)", mantra: "Om Hreem Namah", rulingChakra: "Vishuddhi", significance: "The classical 6 mm 5 Mukhi mala — universally suitable, considered the daily japa mala of every Shiva sadhak. Worn for stress relief, blood pressure and spiritual elevation.",
    shortDescription: "Universal 108-bead 5 Mukhi Indonesian Rudraksha mala in 6 mm — ideal for daily meditation, stress relief and BP control.",
    benefits: ["Most universally suitable Rudraksha mala — wearable by anyone", "Reduces stress, anxiety and blood pressure", "Strengthens Jupiter — wisdom and prosperity", "Foundation of every traditional japa mala", "Cooling effect on the body and mind"],
    whoShouldUse: ["Everyone — no astrological restrictions", "People with high BP, hypertension, stress", "Daily meditators and Shiva devotees", "Beginners starting their japa practice"], imageKey: "indonesian_rudraksha" },
  { id: 5, name: "Vedic Tatva 5 Mukhi Indonesian Rudraksha Mala 8mm (108+1 Beads) — Lab Certified Original", shortName: "5 Mukhi Indonesian Rudraksha Mala 8mm", material: "Indonesian Rudraksha (5 Mukhi)", beadCount: "108 + 1 Guru bead", beadSize: "8 mm", origin: "Java, Indonesia", deity: "Kalagni Rudra (Lord Shiva)", planet: "Jupiter (Guru)", mantra: "Om Hreem Namah", rulingChakra: "Vishuddhi", significance: "8 mm 5 Mukhi mala — slightly larger beads ideal for finger-counting japa and prominent enough to wear daily as a kanthi.",
    shortDescription: "Daily-wear 108-bead 5 Mukhi Indonesian Rudraksha mala in 8 mm — perfect grip for finger japa and visible kanthi style.",
    benefits: ["Easier grip for finger-counted japa", "Universal benefits — calms mind, lowers BP", "Strengthens Jupiter — luck and learning", "Visible as a daily kanthi mala", "Naturally cooling on the chest"],
    whoShouldUse: ["Sadhaks who do long mantra rounds", "Daily meditators wanting visible kanthi", "Anyone with high stress or anxiety"], imageKey: "indonesian_rudraksha" },
  { id: 6, name: "Vedic Tatva 5 Mukhi Indonesian Rudraksha Mala 10mm (108+1 Beads) — Lab Certified Original", shortName: "5 Mukhi Indonesian Rudraksha Mala 10mm", material: "Indonesian Rudraksha (5 Mukhi)", beadCount: "108 + 1 Guru bead", beadSize: "10 mm", origin: "Java, Indonesia", deity: "Kalagni Rudra (Lord Shiva)", planet: "Jupiter (Guru)", mantra: "Om Hreem Namah", rulingChakra: "Vishuddhi", significance: "Premium 10 mm 5 Mukhi mala — bold visible beads for kanthi-style devotional wear, prized by senior sadhus.",
    shortDescription: "Premium bold 10 mm 5 Mukhi Indonesian Rudraksha mala — visible kanthi for serious sadhaks and Shiva bhaktas.",
    benefits: ["Bold visible beads — strong devotional presence", "Universal benefits of 5 Mukhi", "Best for slow, deep japa rounds", "Improves cardiac and BP health", "Strengthens Guru graha"],
    whoShouldUse: ["Sadhus, monks, lifelong devotees", "Anyone wanting a visible Shiva kanthi", "Daily Mahamrityunjaya jaapi"], imageKey: "indonesian_rudraksha" },
  { id: 7, name: "Vedic Tatva 5 Mukhi Indonesian Black Rudraksha Mala 6mm (108+1 Beads) — Lab Certified", shortName: "5 Mukhi Black Rudraksha Mala 6mm", material: "Indonesian Black Rudraksha (5 Mukhi)", beadCount: "108 + 1 Guru bead", beadSize: "6 mm", origin: "Java, Indonesia", deity: "Bhairav (Form of Shiva)", planet: "Saturn (Shani) & Jupiter", mantra: "Om Hreem Namah", rulingChakra: "Vishuddhi & Mooladhara", significance: "Rare naturally-black Rudraksha mala — combines the universal benefit of 5 Mukhi with the protective Shani-energy of black colour. Worn for tantric protection and Bhairav sadhana.",
    shortDescription: "Rare 6 mm Black 5 Mukhi Indonesian Rudraksha mala — protective Shani vibrations and universal Shiva blessings.",
    benefits: ["Naturally black — protects from negative energies and evil eye", "Combines 5 Mukhi calming with Shani-tone protection", "Ideal for Bhairav, Shani and Kaal Sarp shanti japa", "Grounds the wearer and strengthens root chakra", "Rare collector's mala"],
    whoShouldUse: ["People affected by negative energy or buri nazar", "Shani sadhe-sati / dhaiyya jatkas", "Tantric and Bhairav sadhaks"], imageKey: "black_rudraksha" },
  { id: 8, name: "Vedic Tatva 5 Mukhi Indonesian Black Rudraksha Mala 8mm (108+1 Beads) — Lab Certified", shortName: "5 Mukhi Black Rudraksha Mala 8mm", material: "Indonesian Black Rudraksha (5 Mukhi)", beadCount: "108 + 1 Guru bead", beadSize: "8 mm", origin: "Java, Indonesia", deity: "Bhairav (Form of Shiva)", planet: "Saturn (Shani) & Jupiter", mantra: "Om Hreem Namah", rulingChakra: "Vishuddhi & Mooladhara", significance: "8 mm Black Rudraksha mala — bold dark beads for serious tantric, Shani and Bhairav sadhana. A protective shield around the neck.",
    shortDescription: "Bold 8 mm 5 Mukhi Black Rudraksha mala from Indonesia — protective shield, ideal for Shani & Bhairav japa.",
    benefits: ["Stronger visible protection of black Rudraksha", "Pacifies Shani sadhe-sati and ari graha", "Removes negative spirits and evil eye", "Universal calming effect of 5 Mukhi", "Powerful for Bhairav sadhana"],
    whoShouldUse: ["Sadhe-sati / Shani dhaiyya jatkas", "Tantric sadhaks", "Anyone needing protective kanthi"], imageKey: "black_rudraksha" },
  { id: 9, name: "Vedic Tatva 6 Mukhi Indonesian Rudraksha Mala (108+1 Beads) — Lab Certified Original", shortName: "6 Mukhi Indonesian Rudraksha Mala", material: "Indonesian Rudraksha (6 Mukhi)", beadCount: "108 + 1 Guru bead", beadSize: "6–7 mm", origin: "Java, Indonesia", deity: "Lord Kartikeya & Maa Lakshmi", planet: "Venus (Shukra)", mantra: "Om Hreem Hum Namah", rulingChakra: "Swadhisthana", significance: "Mala of 6 Mukhi Indonesian Rudraksha — 108 beads of Venus energy. Attracts love, beauty, sensuality, marital bliss and material luxury.",
    shortDescription: "108-bead 6 Mukhi Indonesian Rudraksha mala — Venus energy for love, marriage, prosperity and artistic charm.",
    benefits: ["Strengthens Venus — love, beauty, luxury", "Attracts marital bliss and harmony", "Boosts artistic and creative expression", "Improves reproductive and hormonal health", "Pacifies Shukra dosha"],
    whoShouldUse: ["People seeking marriage / good spouse", "Artists, designers, performers", "Couples seeking deeper bonding", "Those with weak Venus"], imageKey: "indonesian_rudraksha" },
  { id: 10, name: "Vedic Tatva 7 Mukhi Indonesian Rudraksha Mala (108+1 Beads) — Lab Certified Original", shortName: "7 Mukhi Indonesian Rudraksha Mala", material: "Indonesian Rudraksha (7 Mukhi)", beadCount: "108 + 1 Guru bead", beadSize: "6–7 mm", origin: "Java, Indonesia", deity: "Maa Mahalakshmi", planet: "Saturn (Shani)", mantra: "Om Hum Namah", rulingChakra: "Anahata", significance: "Mala of 7 Mukhi Rudraksha — sacred to Maa Lakshmi, brings flow of wealth, financial stability and pacifies Shani during long japa rounds.",
    shortDescription: "108-bead 7 Mukhi Indonesian Rudraksha mala — Maa Lakshmi blessings for wealth, abundance and Shani peace.",
    benefits: ["Attracts continuous flow of money", "Pacifies Shani sadhe-sati and dhaiyya", "Removes financial blocks and debts", "Strengthens decision-making for business", "Brings stability in career"],
    whoShouldUse: ["Businesspersons and traders", "People in heavy debts", "Shani sadhe-sati jatkas", "Anyone seeking Lakshmi blessings"], imageKey: "indonesian_rudraksha" },
  { id: 11, name: "Vedic Tatva 8 Mukhi Indonesian Rudraksha Mala (108+1 Beads) — Lab Certified Original", shortName: "8 Mukhi Indonesian Rudraksha Mala", material: "Indonesian Rudraksha (8 Mukhi)", beadCount: "108 + 1 Guru bead", beadSize: "6–7 mm", origin: "Java, Indonesia", deity: "Lord Ganesha", planet: "Rahu", mantra: "Om Hum Namah", rulingChakra: "Mooladhara", significance: "Mala of 8 Mukhi Rudraksha — blessed by Lord Ganesha, removes obstacles before they appear and pacifies Rahu mahadasha.",
    shortDescription: "108-bead 8 Mukhi Indonesian Rudraksha mala — Lord Ganesha blessings, removes obstacles, pacifies Rahu.",
    benefits: ["Removes obstacles in business and life", "Pacifies Rahu and reduces confusion", "Brings success in new ventures", "Improves decision-making and intuition", "Protects from sudden setbacks"],
    whoShouldUse: ["Entrepreneurs starting new ventures", "People in Rahu mahadasha", "Anyone facing repeated obstacles", "Students before exams"], imageKey: "indonesian_rudraksha" },
  { id: 12, name: "Vedic Tatva 9 Mukhi Indonesian Rudraksha Mala (108+1 Beads) — Lab Certified Original", shortName: "9 Mukhi Indonesian Rudraksha Mala", material: "Indonesian Rudraksha (9 Mukhi)", beadCount: "108 + 1 Guru bead", beadSize: "6–7 mm", origin: "Java, Indonesia", deity: "Maa Durga", planet: "Ketu", mantra: "Om Hreem Hum Namah", rulingChakra: "Manipura", significance: "Mala of 9 Mukhi Rudraksha — embodies the nine forms of Maa Durga. Each bead is a Navadurga shrine; pacifies Ketu and grants spiritual fearlessness.",
    shortDescription: "108-bead 9 Mukhi Indonesian Rudraksha mala — Maa Durga shakti, fearlessness and Ketu shanti.",
    benefits: ["Invokes Navadurga shakti and removes fear", "Pacifies Ketu mahadasha", "Increases courage and willpower", "Protects from accidents and illness", "Ideal for Devi sadhaks"],
    whoShouldUse: ["Devi worshippers and Navratri sadhaks", "People in Ketu mahadasha", "Those struggling with fear or phobias"], imageKey: "indonesian_rudraksha" },
  { id: 13, name: "Vedic Tatva 10 Mukhi Indonesian Rudraksha Mala (108+1 Beads) — Lab Certified Original", shortName: "10 Mukhi Indonesian Rudraksha Mala", material: "Indonesian Rudraksha (10 Mukhi)", beadCount: "108 + 1 Guru bead", beadSize: "6–7 mm", origin: "Java, Indonesia", deity: "Lord Vishnu", planet: "Pacifies all 9 planets", mantra: "Om Hreem Namah", rulingChakra: "Anahata", significance: "Mala of 10 Mukhi Rudraksha — the divine shield. Pacifies all 9 grahas, neutralises black magic, evil eye and Vastu doshas.",
    shortDescription: "108-bead 10 Mukhi Indonesian Rudraksha mala — Vishnu shield against black magic, evil eye and graha doshas.",
    benefits: ["Neutralises all 9 planetary doshas", "Strong shield against black magic and tantra", "Removes Vastu dosha when worn at home", "Brings emotional stability", "Ideal for sensitive and intuitive people"],
    whoShouldUse: ["Anyone facing black magic / evil eye", "People with multiple graha doshas", "Sensitive souls and intuitives"], imageKey: "indonesian_rudraksha" },

  // ── Nepali Rudraksha Malas (14-15) ──
  { id: 14, name: "Vedic Tatva 5 Mukhi Nepali Rudraksha Mala 54 Beads — Lab Certified Original", shortName: "5 Mukhi Nepali 54 Beads Mala", material: "Nepali Rudraksha (5 Mukhi)", beadCount: "54 + 1 Guru bead (half mala)", beadSize: "10–12 mm", origin: "Bhadrapur, Nepal", deity: "Kalagni Rudra (Lord Shiva)", planet: "Jupiter (Guru)", mantra: "Om Hreem Namah", rulingChakra: "Vishuddhi", significance: "54-bead half mala of premium large Nepali 5 Mukhi Rudraksha — perfect short rosary for two-round japa, often worn as a kanthi.",
    shortDescription: "Premium Nepali 5 Mukhi Rudraksha half-mala (54 beads) — large beads, ideal for compact two-round japa.",
    benefits: ["Premium large Nepali Rudraksha beads", "Two rounds = 108 mantras (full japa)", "Perfect kanthi length", "Universal calming benefits of 5 Mukhi", "Strengthens Jupiter"],
    whoShouldUse: ["Sadhaks who do two-round japa", "Anyone wanting bold visible kanthi", "Daily meditators"], imageKey: "nepali_rudraksha" },
  { id: 15, name: "Vedic Tatva 5 Mukhi Nepali Rudraksha Mala 108 Beads — Lab Certified Original", shortName: "5 Mukhi Nepali 108 Beads Mala", material: "Nepali Rudraksha (5 Mukhi)", beadCount: "108 + 1 Guru bead", beadSize: "10–12 mm", origin: "Bhadrapur, Nepal", deity: "Kalagni Rudra (Lord Shiva)", planet: "Jupiter (Guru)", mantra: "Om Hreem Namah", rulingChakra: "Vishuddhi", significance: "Full 108-bead mala of premium-grade large Nepali 5 Mukhi Rudraksha — the gold-standard Shiva mala used by sadhus and senior pujaris.",
    shortDescription: "Full 108-bead Nepali 5 Mukhi Rudraksha mala — premium large beads, traditional Shiva sadhana mala.",
    benefits: ["Premium large Nepali beads — strongest 5 Mukhi vibrations", "Traditional Shiva sadhana mala", "Calms BP, anxiety and stress", "Strengthens Guru graha", "Ideal for Mahamrityunjaya japa"],
    whoShouldUse: ["Serious Shiva sadhaks", "Senior pujaris and sadhus", "Daily Mahamrityunjaya jaapis"], imageKey: "nepali_rudraksha" },

  // ── Kamal Gatti (16) ──
  { id: 16, name: "Vedic Tatva Kamal Gatti Mala 108 Beads — Sacred Lotus Seed Mala for Lakshmi Sadhana", shortName: "Kamal Gatti Mala 108 Beads", material: "Kamal Gatti (Lotus Seed)", beadCount: "108 + 1 Guru bead", beadSize: "8–10 mm", origin: "India", deity: "Maa Lakshmi", planet: "Venus & Moon", mantra: "Om Shreem Mahalakshmiyei Namah", rulingChakra: "Anahata", significance: "Kamal Gatti is the sacred seed of the lotus — Maa Lakshmi's own flower. A mala of 108 lotus seeds is the most powerful japa mala for Shree Sukta and Lakshmi sadhana.",
    shortDescription: "108-bead Kamal Gatti (lotus seed) mala — the sacred mala of Maa Lakshmi, ideal for Shree Sukta and wealth sadhana.",
    benefits: ["The most sacred mala for Lakshmi sadhana", "Multiplies wealth, prosperity and abundance", "Removes financial blockages", "Used in Shree Sukta and Kanakdhara japa", "Cooling and calming during long japa"],
    whoShouldUse: ["Lakshmi devotees and businesspersons", "Anyone doing Shree Sukta japa", "People struggling with money flow", "Diwali and Friday sadhaks"], imageKey: "kadamba" },

  // ── Karungali (17-24) ──
  { id: 17, name: "Vedic Tatva Karungali Mala with German Silver Caps 6mm — Sacred Ebony Wood Mala", shortName: "Karungali Mala German Silver 6mm", material: "Karungali (Ebony Wood) with German Silver", beadCount: "108 + 1 Guru bead", beadSize: "6 mm", origin: "Tamil Nadu, India", deity: "Lord Shani & Lord Bhairav", planet: "Saturn (Shani)", mantra: "Om Sham Shanaishcharaya Namah", rulingChakra: "Mooladhara", significance: "Karungali (ebony) is South India's sacred Shani wood. Strung with German silver caps for grounding magnetism, this 6 mm mala is the classic Tamil japa mala for Shani peace and protection.",
    shortDescription: "108-bead Karungali (ebony) mala in 6 mm with German silver caps — sacred Shani wood for protection and grounding.",
    benefits: ["Pacifies Shani sadhe-sati and dhaiyya", "Powerful protection from negative energy and evil eye", "Grounds the wearer and reduces anxiety", "German silver enhances energy circulation", "Sacred mala of South Indian Shani temples"],
    whoShouldUse: ["Anyone in Shani sadhe-sati or dhaiyya", "People affected by negative energy / black magic", "Shani Bhairav and Hanuman sadhaks", "Anxiety, fear or phobia sufferers"], imageKey: "karungali_silver" },
  { id: 18, name: "Vedic Tatva Karungali Mala with German Silver Caps 8mm — Sacred Ebony Wood Mala", shortName: "Karungali Mala German Silver 8mm", material: "Karungali (Ebony Wood) with German Silver", beadCount: "108 + 1 Guru bead", beadSize: "8 mm", origin: "Tamil Nadu, India", deity: "Lord Shani & Lord Bhairav", planet: "Saturn (Shani)", mantra: "Om Sham Shanaishcharaya Namah", rulingChakra: "Mooladhara", significance: "Bold 8 mm Karungali mala with German silver caps — premium grade ebony beads for visible protective kanthi.",
    shortDescription: "Bold 108-bead 8 mm Karungali mala with German silver caps — strong Shani protection for daily wear.",
    benefits: ["Premium 8 mm bold visible beads", "Strong Shani protection", "Grounds emotional turbulence", "German silver caps enhance vibration", "Lifelong heirloom mala"],
    whoShouldUse: ["Sadhe-sati / Shani dhaiyya jatkas", "Daily Shani Bhairav sadhaks", "Those wanting bold protective kanthi"], imageKey: "karungali_silver" },
  { id: 19, name: "Vedic Tatva Karungali Mala A-Quality 108 Beads — Authentic Ebony Wood Japa Mala", shortName: "Karungali Mala A-Quality", material: "Karungali (Ebony Wood) A-Grade", beadCount: "108 + 1 Guru bead", beadSize: "6–8 mm", origin: "Tamil Nadu, India", deity: "Lord Shani & Lord Bhairav", planet: "Saturn (Shani)", mantra: "Om Sham Shanaishcharaya Namah", rulingChakra: "Mooladhara", significance: "Authentic A-quality Karungali wood mala — sacred ebony beads for daily Shani japa, balanced affordability and quality.",
    shortDescription: "Authentic A-grade 108-bead Karungali ebony wood mala — daily japa mala for Shani devotees.",
    benefits: ["Pure A-grade ebony wood", "Strong Shani protection", "Removes negativity and evil eye", "Grounding effect for anxious minds", "Balanced quality for daily wear"],
    whoShouldUse: ["Daily Shani japa sadhaks", "Anyone wanting authentic affordable Karungali", "Sadhe-sati jatkas"], imageKey: "karungali" },
  { id: 20, name: "Vedic Tatva Karungali Mala AAA-Quality 4mm — Premium Ebony Wood Japa Mala", shortName: "Karungali Mala AAA 4mm", material: "Karungali (Ebony Wood) AAA-Grade", beadCount: "108 + 1 Guru bead", beadSize: "4 mm", origin: "Tamil Nadu, India", deity: "Lord Shani & Lord Bhairav", planet: "Saturn (Shani)", mantra: "Om Sham Shanaishcharaya Namah", rulingChakra: "Mooladhara", significance: "Premium AAA-grade 4 mm Karungali mala — finest hand-picked tiny ebony beads, prized by serious sadhaks for fine-grain japa.",
    shortDescription: "Premium AAA-quality 4 mm Karungali mala — finest tiny ebony beads for precise japa and discreet kanthi.",
    benefits: ["Finest AAA-grade hand-picked ebony", "Tiny 4 mm beads for discreet wear", "Maximum Shani protection per bead", "Smooth feel for finger japa", "Premium heirloom quality"],
    whoShouldUse: ["Serious daily Shani sadhaks", "Those wanting subtle yet sacred kanthi", "Connoisseurs of premium Karungali"], imageKey: "karungali" },
  { id: 21, name: "Vedic Tatva Karungali Mala AAA-Quality 6mm — Premium Ebony Wood Japa Mala", shortName: "Karungali Mala AAA 6mm", material: "Karungali (Ebony Wood) AAA-Grade", beadCount: "108 + 1 Guru bead", beadSize: "6 mm", origin: "Tamil Nadu, India", deity: "Lord Shani & Lord Bhairav", planet: "Saturn (Shani)", mantra: "Om Sham Shanaishcharaya Namah", rulingChakra: "Mooladhara", significance: "Premium AAA-grade 6 mm Karungali mala — the ideal balance of size and finesse for daily Shani sadhana.",
    shortDescription: "Premium AAA-quality 6 mm Karungali ebony mala — the most popular size for daily Shani japa and protection.",
    benefits: ["Finest AAA-grade ebony", "Ideal size for daily wear", "Maximum Shani protection", "Smooth bead surface for japa", "Premium heirloom quality"],
    whoShouldUse: ["Daily Shani sadhaks", "Sadhe-sati / dhaiyya jatkas", "Anyone wanting authentic Tamil Karungali"], imageKey: "karungali" },
  { id: 22, name: "Vedic Tatva Karungali Mala AAA-Quality 8mm — Premium Ebony Wood Japa Mala", shortName: "Karungali Mala AAA 8mm", material: "Karungali (Ebony Wood) AAA-Grade", beadCount: "108 + 1 Guru bead", beadSize: "8 mm", origin: "Tamil Nadu, India", deity: "Lord Shani & Lord Bhairav", planet: "Saturn (Shani)", mantra: "Om Sham Shanaishcharaya Namah", rulingChakra: "Mooladhara", significance: "Bold 8 mm AAA-grade Karungali mala — premium ebony beads with stronger visible presence for protective kanthi.",
    shortDescription: "Bold premium 8 mm AAA Karungali mala — visible ebony kanthi for serious Shani devotees.",
    benefits: ["Premium AAA ebony, bold 8 mm beads", "Visible protective kanthi", "Strong grounding effect", "Maximum Shani vibrations", "Lifetime heirloom"],
    whoShouldUse: ["Senior Shani sadhaks", "Bhairav and Hanuman bhaktas", "Those wanting bold protective kanthi"], imageKey: "karungali" },
  { id: 23, name: "Vedic Tatva Karungali Mala AAA-Quality 10mm — Premium Ebony Wood Japa Mala", shortName: "Karungali Mala AAA 10mm", material: "Karungali (Ebony Wood) AAA-Grade", beadCount: "108 + 1 Guru bead", beadSize: "10 mm", origin: "Tamil Nadu, India", deity: "Lord Shani & Lord Bhairav", planet: "Saturn (Shani)", mantra: "Om Sham Shanaishcharaya Namah", rulingChakra: "Mooladhara", significance: "Maximum-size 10 mm AAA Karungali mala — collector-grade ebony, bold dramatic kanthi for advanced sadhaks.",
    shortDescription: "Collector-grade 10 mm AAA Karungali mala — boldest authentic ebony kanthi for advanced sadhaks.",
    benefits: ["Largest 10 mm premium ebony beads", "Most dramatic visible kanthi", "Maximum Shani shielding", "Connoisseur-grade craftsmanship", "Lifetime heirloom mala"],
    whoShouldUse: ["Advanced Shani Bhairav sadhaks", "Connoisseurs of authentic Karungali", "Those wanting commanding kanthi"], imageKey: "karungali" },
  { id: 24, name: "Vedic Tatva Karungali Mala Copy 108 Beads — Affordable Daily Wear Black Wood Mala", shortName: "Karungali Mala Copy", material: "Karungali Look-Alike Wood (Treated)", beadCount: "108 + 1 Guru bead", beadSize: "6–8 mm", origin: "India", deity: "Lord Shani & Lord Bhairav", planet: "Saturn (Shani)", mantra: "Om Sham Shanaishcharaya Namah", rulingChakra: "Mooladhara", significance: "Affordable Karungali-style mala using treated black wood — visually identical, ideal for casual daily wear without risking the expensive AAA mala.",
    shortDescription: "Affordable Karungali look-alike 108-bead black wood mala — daily-wear alternative without losing the look.",
    benefits: ["Identical look to authentic Karungali", "Affordable for daily casual wear", "Save your premium AAA mala for sadhana", "Travel-friendly replacement", "Same protective styling"],
    whoShouldUse: ["Daily casual wearers", "Travellers and gym-goers", "Anyone wanting the look at lower cost"], imageKey: "karungali" },

  // ── Navratna Malas (25-28) ──
  { id: 25, name: "Vedic Tatva Navratna Mala 4–6mm — Nine Sacred Gemstones for Graha Shanti", shortName: "Navratna Mala 4/6mm", material: "Nine Sacred Gemstones (Navaratna)", beadCount: "108 + 1 Guru bead", beadSize: "4–6 mm", origin: "India", deity: "Navagraha (Nine Planets)", planet: "All 9 Planets", mantra: "Om Navagraha Devebhyo Namah", rulingChakra: "All 7 Chakras", significance: "The Navratna mala carries the energy of all nine sacred gemstones — Ruby, Pearl, Coral, Emerald, Yellow Sapphire, Diamond, Blue Sapphire, Hessonite and Cat's Eye — pacifying every planetary dosha at once.",
    shortDescription: "108-bead Navratna mala in 4–6 mm with all nine sacred gems — pacifies the entire Navagraha at once.",
    benefits: ["Pacifies all 9 planetary doshas simultaneously", "Balances every chakra in one mala", "Auspicious for any horoscope — no negative effects", "Used in Navagraha shanti puja", "Perfect family heirloom mala"],
    whoShouldUse: ["Anyone with multiple graha doshas", "People facing repeated planetary transits", "Devotees of Surya / Navagraha", "Those who don't know their exact planetary issues"], imageKey: "navratna" },
  { id: 26, name: "Vedic Tatva Navratna Mala 5–7mm — Nine Sacred Gemstones for Graha Shanti", shortName: "Navratna Mala 5/7mm", material: "Nine Sacred Gemstones (Navaratna)", beadCount: "108 + 1 Guru bead", beadSize: "5–7 mm", origin: "India", deity: "Navagraha (Nine Planets)", planet: "All 9 Planets", mantra: "Om Navagraha Devebhyo Namah", rulingChakra: "All 7 Chakras", significance: "Mid-size 5–7 mm Navratna mala — most popular size, balanced visibility and comfort, full nine-planet pacification.",
    shortDescription: "Most popular 5–7 mm Navratna mala — balanced size, full Navagraha shanti, daily kanthi wear.",
    benefits: ["All 9 graha doshas pacified", "Mid-size for daily wear", "Activates all 7 chakras", "Family heirloom quality", "Suits every horoscope"],
    whoShouldUse: ["Anyone seeking complete graha shanti", "Daily wearers wanting balanced size", "Family pujari recommending universal mala"], imageKey: "navratna" },
  { id: 27, name: "Vedic Tatva Navratna Mala 7–9mm — Nine Sacred Gemstones for Graha Shanti", shortName: "Navratna Mala 7/9mm", material: "Nine Sacred Gemstones (Navaratna)", beadCount: "108 + 1 Guru bead", beadSize: "7–9 mm", origin: "India", deity: "Navagraha (Nine Planets)", planet: "All 9 Planets", mantra: "Om Navagraha Devebhyo Namah", rulingChakra: "All 7 Chakras", significance: "Bold 7–9 mm Navratna mala — visible large gem beads, strong visible Navagraha presence as a kanthi.",
    shortDescription: "Bold 7–9 mm Navratna mala — visible nine-gem kanthi for strong Navagraha presence.",
    benefits: ["Larger visible gem beads", "Strong Navagraha vibrations", "Activates all chakras boldly", "Ideal as gifting heirloom", "Family pujari grade"],
    whoShouldUse: ["Those wanting bold visible Navratna", "Heirloom gifting", "Senior devotees of Surya / Navagraha"], imageKey: "navratna" },
  { id: 28, name: "Vedic Tatva Navratna Mala 7–10mm — Premium Nine Sacred Gemstones Mala", shortName: "Navratna Mala 7/10mm", material: "Nine Sacred Gemstones (Navaratna)", beadCount: "108 + 1 Guru bead", beadSize: "7–10 mm", origin: "India", deity: "Navagraha (Nine Planets)", planet: "All 9 Planets", mantra: "Om Navagraha Devebhyo Namah", rulingChakra: "All 7 Chakras", significance: "Premium 7–10 mm graded Navratna mala — largest gem beads with classic graded sizing, the ultimate Navagraha kanthi.",
    shortDescription: "Premium graded 7–10 mm Navratna mala — largest nine-gem beads, the ultimate Navagraha kanthi.",
    benefits: ["Largest premium gem beads", "Maximum Navagraha presence", "Graded for visual elegance", "Lifetime heirloom", "Pacifies every graha dosha"],
    whoShouldUse: ["Connoisseurs of Navratna", "Senior devotees", "Heirloom-grade gifting"], imageKey: "navratna" },

  // ── Australian Sandalwood (29-31) ──
  { id: 29, name: "Vedic Tatva Australian Sandalwood Mala 6mm 108 Beads — Pure Chandan Japa Mala", shortName: "Australian Sandalwood Mala 6mm", material: "Australian Sandalwood (Santalum Spicatum)", beadCount: "108 + 1 Guru bead", beadSize: "6 mm", origin: "Western Australia", deity: "Lord Vishnu & Maa Saraswati", planet: "Mercury & Moon", mantra: "Om Namo Narayanaya", rulingChakra: "Sahasrara", significance: "Pure Australian sandalwood is renowned worldwide for its sweet, long-lasting, cooling fragrance. A 108-bead mala is the classic Vishnu japa mala used by Vaishnavas for Vishnu Sahasranama.",
    shortDescription: "108-bead pure Australian sandalwood mala in 6 mm — sweetly fragrant cooling Vishnu japa mala.",
    benefits: ["Pure aromatic Australian chandan", "Cooling effect on body and mind", "Ideal for Vishnu Sahasranama japa", "Calms anger and over-thinking", "Improves meditative concentration"],
    whoShouldUse: ["Vishnu / Krishna devotees", "Daily meditators", "Anger-prone individuals", "Saraswati sadhaks (students)"], imageKey: "australian_sandalwood" },
  { id: 30, name: "Vedic Tatva Australian Sandalwood Mala 8mm 108 Beads — Pure Chandan Japa Mala", shortName: "Australian Sandalwood Mala 8mm", material: "Australian Sandalwood (Santalum Spicatum)", beadCount: "108 + 1 Guru bead", beadSize: "8 mm", origin: "Western Australia", deity: "Lord Vishnu & Maa Saraswati", planet: "Mercury & Moon", mantra: "Om Namo Narayanaya", rulingChakra: "Sahasrara", significance: "8 mm Australian sandalwood mala — bolder beads for finger-counted japa, ideal as daily kanthi.",
    shortDescription: "Bold 8 mm Australian sandalwood mala — long-lasting fragrance, ideal kanthi-size for daily wear.",
    benefits: ["Pure Australian chandan, 8 mm bold size", "Long-lasting cooling fragrance", "Easy finger japa grip", "Calms anger and stress", "Vishnu sadhana mala"],
    whoShouldUse: ["Daily Vishnu / Krishna devotees", "Sadhaks doing long japa rounds", "Anyone seeking chandan kanthi"], imageKey: "australian_sandalwood" },
  { id: 31, name: "Vedic Tatva Australian Sandalwood Mala 10mm 108 Beads — Pure Chandan Japa Mala", shortName: "Australian Sandalwood Mala 10mm", material: "Australian Sandalwood (Santalum Spicatum)", beadCount: "108 + 1 Guru bead", beadSize: "10 mm", origin: "Western Australia", deity: "Lord Vishnu & Maa Saraswati", planet: "Mercury & Moon", mantra: "Om Namo Narayanaya", rulingChakra: "Sahasrara", significance: "Premium 10 mm Australian sandalwood mala — boldest chandan kanthi with maximum aromatic presence.",
    shortDescription: "Premium 10 mm Australian sandalwood mala — bold chandan kanthi with maximum cooling fragrance.",
    benefits: ["Largest 10 mm Australian chandan beads", "Maximum cooling fragrance", "Bold visible Vaishnava kanthi", "Long-lasting heirloom", "Ideal for slow deep japa"],
    whoShouldUse: ["Senior Vaishnavas", "Sadhus and pujaris", "Heirloom gifting"], imageKey: "australian_sandalwood" },

  // ── Gujrat Sandalwood (32) ──
  { id: 32, name: "Vedic Tatva Gujarat Sandalwood Mala 108 Beads — Authentic Indian White Chandan", shortName: "Gujarat Sandalwood Mala", material: "Gujarat Sandalwood (Indian White)", beadCount: "108 + 1 Guru bead", beadSize: "6–8 mm", origin: "Gujarat, India", deity: "Lord Vishnu & Maa Lakshmi", planet: "Mercury", mantra: "Om Namo Narayanaya", rulingChakra: "Sahasrara", significance: "Authentic Gujarat-grown white sandalwood mala — light, mildly fragrant, cooling and traditionally used in Krishna and Vishnu sadhana across western India.",
    shortDescription: "108-bead authentic Gujarat sandalwood mala — mild aromatic Indian white chandan, traditional Krishna japa mala.",
    benefits: ["Authentic Indian-grown chandan", "Cooling and calming effect", "Traditional western-India Krishna mala", "Mild lasting fragrance", "Strengthens Mercury (Budha)"],
    whoShouldUse: ["Krishna / Vishnu devotees", "Anyone preferring Indian-origin chandan", "Daily japa practitioners"], imageKey: "australian_sandalwood" },

  // ── Mysore Sandalwood (33-34) ──
  { id: 33, name: "Vedic Tatva Mysore Sandalwood Mala 6mm 108 Beads — Premium Aromatic Chandan", shortName: "Mysore Sandalwood Mala 6mm", material: "Mysore Sandalwood (Santalum Album)", beadCount: "108 + 1 Guru bead", beadSize: "6 mm", origin: "Karnataka (Mysore region)", deity: "Lord Vishnu, Lord Shiva, Maa Lakshmi", planet: "Mercury & Venus", mantra: "Om Namo Narayanaya", rulingChakra: "Sahasrara", significance: "Mysore chandan is the king of sandalwoods — its rich, sweet, long-lasting fragrance is used in temples worldwide. A 108-bead Mysore mala is treasured as a lifetime sadhana companion.",
    shortDescription: "Premium 6 mm Mysore sandalwood mala — the king of chandan, lifetime sadhana mala with royal aroma.",
    benefits: ["The most aromatic chandan in the world", "Royal lifetime fragrance — only deepens with age", "Ideal for Vishnu, Shiva and Lakshmi sadhana", "Cools the body and calms the mind", "Premium heirloom-grade mala"],
    whoShouldUse: ["Serious sadhaks of any tradition", "Connoisseurs of fine chandan", "Heirloom gifting"], imageKey: "mysore_sandalwood" },
  { id: 34, name: "Vedic Tatva Mysore Sandalwood Mala 8mm 108 Beads — Premium Aromatic Chandan", shortName: "Mysore Sandalwood Mala 8mm", material: "Mysore Sandalwood (Santalum Album)", beadCount: "108 + 1 Guru bead", beadSize: "8 mm", origin: "Karnataka (Mysore region)", deity: "Lord Vishnu, Lord Shiva, Maa Lakshmi", planet: "Mercury & Venus", mantra: "Om Namo Narayanaya", rulingChakra: "Sahasrara", significance: "Bold 8 mm Mysore sandalwood mala — the gold standard chandan kanthi, growing more fragrant with every year of wear.",
    shortDescription: "Bold premium 8 mm Mysore sandalwood mala — gold-standard chandan kanthi, lifetime royal aroma.",
    benefits: ["Bold visible Mysore chandan beads", "World's finest sandalwood fragrance", "Lifetime aromatic kanthi", "Cools and calms the system", "Lifelong heirloom mala"],
    whoShouldUse: ["Serious devotees and pujaris", "Connoisseurs of premium chandan", "Heirloom gifting on milestones"], imageKey: "mysore_sandalwood" },

  // ── Red Sandalwood (35-38) ──
  { id: 35, name: "Vedic Tatva Red Sandalwood Mala 4mm 108 Beads — Sacred Lal Chandan Japa Mala", shortName: "Red Sandalwood Mala 4mm", material: "Red Sandalwood (Pterocarpus Santalinus)", beadCount: "108 + 1 Guru bead", beadSize: "4 mm", origin: "Andhra Pradesh, India", deity: "Maa Lakshmi & Lord Ganesha", planet: "Sun (Surya) & Mars", mantra: "Om Shreem Mahalakshmiyei Namah", rulingChakra: "Mooladhara & Anahata", significance: "Lal Chandan (Red Sandalwood) is the sacred wood of Maa Lakshmi. A fine 4 mm mala is used in Sundarkand, Lakshmi sadhana and to ward off evil eye.",
    shortDescription: "Fine 4 mm Red Sandalwood (Lal Chandan) mala — sacred Lakshmi mala for prosperity and evil-eye protection.",
    benefits: ["Sacred Lakshmi prosperity mala", "Wards off evil eye and negativity", "Strengthens Sun and self-confidence", "Used in Sundarkand and Hanuman sadhana", "Fine 4 mm beads for discreet wear"],
    whoShouldUse: ["Lakshmi devotees and businesspersons", "Anyone facing evil eye / nazar", "Daily Hanuman sadhaks", "Those wanting subtle kanthi"], imageKey: "red_sandalwood" },
  { id: 36, name: "Vedic Tatva Red Sandalwood Mala 6mm 108 Beads — Sacred Lal Chandan Japa Mala", shortName: "Red Sandalwood Mala 6mm", material: "Red Sandalwood (Pterocarpus Santalinus)", beadCount: "108 + 1 Guru bead", beadSize: "6 mm", origin: "Andhra Pradesh, India", deity: "Maa Lakshmi & Lord Ganesha", planet: "Sun (Surya) & Mars", mantra: "Om Shreem Mahalakshmiyei Namah", rulingChakra: "Mooladhara & Anahata", significance: "Classic 6 mm Red Sandalwood mala — the most popular Lal Chandan size, ideal balance for daily Lakshmi and Ganesha japa.",
    shortDescription: "Classic 6 mm Lal Chandan (Red Sandalwood) mala — most popular size for daily Lakshmi and Ganesha japa.",
    benefits: ["Sacred Lakshmi-Ganesha mala", "Strengthens self-confidence and willpower", "Wards off evil eye", "Most popular daily-wear size", "Boosts Sun in horoscope"],
    whoShouldUse: ["Lakshmi-Ganesha bhaktas", "Daily japa sadhaks", "Sundarkand and Hanuman jaapis"], imageKey: "red_sandalwood" },
  { id: 37, name: "Vedic Tatva Red Sandalwood Mala 8mm 108 Beads — Premium Lal Chandan Japa Mala", shortName: "Red Sandalwood Mala 8mm", material: "Red Sandalwood (Pterocarpus Santalinus)", beadCount: "108 + 1 Guru bead", beadSize: "8 mm", origin: "Andhra Pradesh, India", deity: "Maa Lakshmi & Lord Ganesha", planet: "Sun (Surya) & Mars", mantra: "Om Shreem Mahalakshmiyei Namah", rulingChakra: "Mooladhara & Anahata", significance: "Bold 8 mm Lal Chandan mala — premium Red Sandalwood with strong visible presence and rich crimson colour.",
    shortDescription: "Bold 8 mm Lal Chandan mala — premium Red Sandalwood with rich crimson colour for daily kanthi.",
    benefits: ["Premium 8 mm bold Lal Chandan beads", "Strong visible Lakshmi kanthi", "Wards off evil eye and negativity", "Strengthens Sun and Mars", "Ideal for prosperity sadhana"],
    whoShouldUse: ["Senior devotees of Lakshmi", "Daily prosperity sadhaks", "Anyone wanting bold red kanthi"], imageKey: "red_sandalwood" },
  { id: 38, name: "Vedic Tatva Red Sandalwood Mala 10mm 108 Beads — Premium Lal Chandan Japa Mala", shortName: "Red Sandalwood Mala 10mm", material: "Red Sandalwood (Pterocarpus Santalinus)", beadCount: "108 + 1 Guru bead", beadSize: "10 mm", origin: "Andhra Pradesh, India", deity: "Maa Lakshmi & Lord Ganesha", planet: "Sun (Surya) & Mars", mantra: "Om Shreem Mahalakshmiyei Namah", rulingChakra: "Mooladhara & Anahata", significance: "Maximum 10 mm Lal Chandan mala — boldest visible Red Sandalwood kanthi, heirloom-grade for senior sadhaks.",
    shortDescription: "Heirloom-grade 10 mm Lal Chandan mala — boldest authentic Red Sandalwood kanthi.",
    benefits: ["Largest 10 mm Lal Chandan beads", "Most dramatic Lakshmi kanthi", "Heirloom heirloom quality", "Powerful evil-eye protection", "Slow-japa friendly grip"],
    whoShouldUse: ["Senior sadhaks and pujaris", "Heirloom gifting", "Lakshmi devotees seeking bold kanthi"], imageKey: "red_sandalwood" },

  // ── Rosewood (39-40) ──
  { id: 39, name: "Vedic Tatva Rosewood Mala 8mm 108 Beads — Sacred Sheesham Wood Japa Mala", shortName: "Rosewood Mala 8mm", material: "Rosewood (Sheesham)", beadCount: "108 + 1 Guru bead", beadSize: "8 mm", origin: "India", deity: "Lord Hanuman & Lord Shiva", planet: "Mars", mantra: "Om Namah Shivaya", rulingChakra: "Mooladhara", significance: "Rosewood (sheesham) is sacred to Hanuman ji and Shiva. Its rich brown colour and grounding aroma make this 108-bead mala ideal for Hanuman sadhana.",
    shortDescription: "108-bead 8 mm Rosewood (Sheesham) mala — grounding Hanuman japa mala with rich woody aroma.",
    benefits: ["Sacred Hanuman sadhana wood", "Strong grounding effect", "Strengthens Mars and courage", "Pacifies anger when worn", "Aromatic and warming"],
    whoShouldUse: ["Hanuman devotees and Sundarkand jaapis", "People with weak Mars", "Daily meditators"], imageKey: "rosewood" },
  { id: 40, name: "Vedic Tatva Rosewood Mala 10mm 108 Beads — Sacred Sheesham Wood Japa Mala", shortName: "Rosewood Mala 10mm", material: "Rosewood (Sheesham)", beadCount: "108 + 1 Guru bead", beadSize: "10 mm", origin: "India", deity: "Lord Hanuman & Lord Shiva", planet: "Mars", mantra: "Om Namah Shivaya", rulingChakra: "Mooladhara", significance: "Bold 10 mm Rosewood mala — premium Sheesham beads, ideal for senior Hanuman sadhaks who want a bold devotional kanthi.",
    shortDescription: "Bold 10 mm Rosewood mala — premium Sheesham beads for senior Hanuman sadhaks.",
    benefits: ["Premium 10 mm Sheesham beads", "Bold visible Hanuman kanthi", "Maximum grounding effect", "Strengthens courage and willpower", "Lifetime heirloom"],
    whoShouldUse: ["Senior Hanuman devotees", "Sundarkand jaapis", "Daily Mars-strengthening sadhaks"], imageKey: "rosewood" },

  // ── Sphatik Plain (41-44) ──
  { id: 41, name: "Vedic Tatva Sphatik Plain Mala 4mm 108 Beads — Pure Crystal Quartz Japa Mala", shortName: "Sphatik Plain Mala 4mm", material: "Sphatik (Clear Quartz Crystal)", beadCount: "108 + 1 Guru bead", beadSize: "4 mm", origin: "India / Himalayas", deity: "Maa Saraswati & Lord Shiva", planet: "Venus (Shukra)", mantra: "Om Shreem Sarasvatyei Namah", rulingChakra: "Sahasrara", significance: "Sphatik (clear quartz) is the cooling crystal of Saraswati. Fine 4 mm beads create a discreet daily mala that calms the mind and enhances clarity.",
    shortDescription: "Fine 4 mm Sphatik (clear quartz) mala — cooling Saraswati mala for clarity and calm meditation.",
    benefits: ["Cooling effect on mind and body", "Enhances mental clarity and focus", "Strengthens Venus (Shukra)", "Ideal for Saraswati sadhana and study", "Discreet 4 mm beads for daily wear"],
    whoShouldUse: ["Students and scholars", "People with high stress / hot tempers", "Saraswati and Shiva sadhaks", "Those preferring subtle kanthi"], imageKey: "sphatik_plain" },
  { id: 42, name: "Vedic Tatva Sphatik Plain Mala 6mm 108 Beads — Pure Crystal Quartz Japa Mala", shortName: "Sphatik Plain Mala 6mm", material: "Sphatik (Clear Quartz Crystal)", beadCount: "108 + 1 Guru bead", beadSize: "6 mm", origin: "India / Himalayas", deity: "Maa Saraswati & Lord Shiva", planet: "Venus (Shukra)", mantra: "Om Shreem Sarasvatyei Namah", rulingChakra: "Sahasrara", significance: "Classic 6 mm Sphatik mala — ideal balanced size for daily japa, cooling and clarity-bringing.",
    shortDescription: "Classic 6 mm Sphatik mala — most popular size for daily Saraswati japa and cooling meditation.",
    benefits: ["Cools the mind and body", "Most popular daily-wear size", "Improves focus and clarity", "Strengthens Venus", "Ideal for daily Gayatri / Saraswati japa"],
    whoShouldUse: ["Daily japa sadhaks", "Students and intellectuals", "Hot-tempered individuals"], imageKey: "sphatik_plain" },
  { id: 43, name: "Vedic Tatva Sphatik Plain Mala 8mm 108 Beads — Premium Crystal Quartz Japa Mala", shortName: "Sphatik Plain Mala 8mm", material: "Sphatik (Clear Quartz Crystal)", beadCount: "108 + 1 Guru bead", beadSize: "8 mm", origin: "India / Himalayas", deity: "Maa Saraswati & Lord Shiva", planet: "Venus (Shukra)", mantra: "Om Shreem Sarasvatyei Namah", rulingChakra: "Sahasrara", significance: "Bold 8 mm Sphatik mala — visible crystal kanthi for Saraswati and Shiva sadhaks who want a sparkling presence.",
    shortDescription: "Bold 8 mm Sphatik mala — sparkling visible crystal kanthi for serious Saraswati sadhaks.",
    benefits: ["Bold sparkling crystal kanthi", "Cools and clarifies the mind", "Strengthens Venus", "Ideal for Saraswati sadhana", "Healing crystal vibrations"],
    whoShouldUse: ["Senior Saraswati / Shiva devotees", "Crystal healers and yoga teachers", "Anyone wanting visible crystal kanthi"], imageKey: "sphatik_plain" },
  { id: 44, name: "Vedic Tatva Sphatik Plain Mala 10mm 108 Beads — Premium Crystal Quartz Japa Mala", shortName: "Sphatik Plain Mala 10mm", material: "Sphatik (Clear Quartz Crystal)", beadCount: "108 + 1 Guru bead", beadSize: "10 mm", origin: "India / Himalayas", deity: "Maa Saraswati & Lord Shiva", planet: "Venus (Shukra)", mantra: "Om Shreem Sarasvatyei Namah", rulingChakra: "Sahasrara", significance: "Premium 10 mm Sphatik mala — boldest crystal kanthi, heirloom-grade quartz for advanced sadhaks.",
    shortDescription: "Premium 10 mm Sphatik mala — boldest authentic crystal kanthi for advanced sadhaks.",
    benefits: ["Largest 10 mm crystal beads", "Most dramatic crystal presence", "Maximum cooling and clarity", "Healing-grade clear quartz", "Lifetime heirloom mala"],
    whoShouldUse: ["Advanced sadhaks and yoga teachers", "Crystal healers", "Heirloom gifting"], imageKey: "sphatik_plain" },

  // ── Sphatik Diamond Cut (45-49) ──
  { id: 45, name: "Vedic Tatva Sphatik Diamond Cut Mala 4mm 108 Beads — Faceted Crystal Quartz Mala", shortName: "Sphatik Diamond Cut Mala 4mm", material: "Sphatik (Diamond-Cut Clear Quartz)", beadCount: "108 + 1 Guru bead", beadSize: "4 mm", origin: "India / Himalayas", deity: "Maa Saraswati & Lord Shiva", planet: "Venus (Shukra)", mantra: "Om Shreem Sarasvatyei Namah", rulingChakra: "Sahasrara", significance: "Diamond-cut Sphatik beads are hand-faceted to refract light from every angle — visually stunning and energetically multiplying the cooling Venus vibrations.",
    shortDescription: "Hand-faceted 4 mm diamond-cut Sphatik mala — sparkling cooling Saraswati mala with multiplied Venus energy.",
    benefits: ["Hand-faceted sparkling crystal beads", "Multiplies Venus and cooling vibrations", "Stunning sparkling visual appearance", "Discreet 4 mm size", "Ideal for Saraswati / Shiva sadhana"],
    whoShouldUse: ["Saraswati / Shiva sadhaks", "Crystal healers and yoga teachers", "Those wanting sparkling discreet mala"], imageKey: "sphatik_diamond" },
  { id: 46, name: "Vedic Tatva Sphatik Diamond Cut Mala 6mm 108 Beads — Faceted Crystal Quartz Mala", shortName: "Sphatik Diamond Cut Mala 6mm", material: "Sphatik (Diamond-Cut Clear Quartz)", beadCount: "108 + 1 Guru bead", beadSize: "6 mm", origin: "India / Himalayas", deity: "Maa Saraswati & Lord Shiva", planet: "Venus (Shukra)", mantra: "Om Shreem Sarasvatyei Namah", rulingChakra: "Sahasrara", significance: "Most popular 6 mm diamond-cut Sphatik mala — sparkling beads with classic daily-wear sizing.",
    shortDescription: "Most popular 6 mm diamond-cut Sphatik mala — sparkling Saraswati kanthi for daily wear.",
    benefits: ["Hand-faceted sparkling beads", "Most popular daily-wear size", "Multiplies cooling crystal energy", "Stunning visible kanthi", "Strengthens Venus"],
    whoShouldUse: ["Daily Saraswati sadhaks", "Crystal jewelry lovers", "Students and intellectuals"], imageKey: "sphatik_diamond" },
  { id: 47, name: "Vedic Tatva Sphatik Diamond Cut Mala 7mm 108 Beads — Faceted Crystal Quartz Mala", shortName: "Sphatik Diamond Cut Mala 7mm", material: "Sphatik (Diamond-Cut Clear Quartz)", beadCount: "108 + 1 Guru bead", beadSize: "7 mm", origin: "India / Himalayas", deity: "Maa Saraswati & Lord Shiva", planet: "Venus (Shukra)", mantra: "Om Shreem Sarasvatyei Namah", rulingChakra: "Sahasrara", significance: "7 mm diamond-cut Sphatik mala — slightly larger sparkling beads for visible crystal presence.",
    shortDescription: "Sparkling 7 mm diamond-cut Sphatik mala — visible crystal kanthi with multiplied Venus energy.",
    benefits: ["Bigger sparkling 7 mm beads", "Visible crystal kanthi", "Multiplies cooling crystal energy", "Stunning visual appearance", "Strengthens Venus"],
    whoShouldUse: ["Senior Saraswati sadhaks", "Crystal healers", "Bold visible kanthi seekers"], imageKey: "sphatik_diamond" },
  { id: 48, name: "Vedic Tatva Sphatik Diamond Cut Mala 8mm 108 Beads — Premium Faceted Crystal Mala", shortName: "Sphatik Diamond Cut Mala 8mm", material: "Sphatik (Diamond-Cut Clear Quartz)", beadCount: "108 + 1 Guru bead", beadSize: "8 mm", origin: "India / Himalayas", deity: "Maa Saraswati & Lord Shiva", planet: "Venus (Shukra)", mantra: "Om Shreem Sarasvatyei Namah", rulingChakra: "Sahasrara", significance: "Premium 8 mm diamond-cut Sphatik mala — bold sparkling crystal kanthi, gold-standard faceted quartz.",
    shortDescription: "Premium 8 mm diamond-cut Sphatik mala — bold sparkling crystal kanthi, gold-standard faceted quartz.",
    benefits: ["Bold premium 8 mm faceted beads", "Maximum sparkle effect", "Multiplies cooling Venus energy", "Visible crystal kanthi", "Heirloom-grade craftsmanship"],
    whoShouldUse: ["Senior crystal devotees", "Yoga teachers / healers", "Heirloom gifting"], imageKey: "sphatik_diamond" },
  { id: 49, name: "Vedic Tatva Sphatik Diamond Cut Mala 10mm 108 Beads — Premium Faceted Crystal Mala", shortName: "Sphatik Diamond Cut Mala 10mm", material: "Sphatik (Diamond-Cut Clear Quartz)", beadCount: "108 + 1 Guru bead", beadSize: "10 mm", origin: "India / Himalayas", deity: "Maa Saraswati & Lord Shiva", planet: "Venus (Shukra)", mantra: "Om Shreem Sarasvatyei Namah", rulingChakra: "Sahasrara", significance: "Maximum 10 mm diamond-cut Sphatik mala — heirloom-grade boldest faceted quartz mala.",
    shortDescription: "Heirloom 10 mm diamond-cut Sphatik mala — boldest sparkling crystal kanthi for advanced sadhaks.",
    benefits: ["Largest 10 mm faceted crystal beads", "Most dramatic sparkle", "Maximum cooling Venus energy", "Heirloom heirloom-grade", "Lifetime sadhana mala"],
    whoShouldUse: ["Advanced sadhaks and pujaris", "Crystal healers / yoga teachers", "Heirloom gifting"], imageKey: "sphatik_diamond" },

  // ── Sphatik Synthetic (50) ──
  { id: 50, name: "Vedic Tatva Sphatik Synthetic Mala 108 Beads — Affordable Crystal-Look Japa Mala", shortName: "Sphatik Synthetic Mala", material: "Synthetic Crystal (Sphatik look-alike)", beadCount: "108 + 1 Guru bead", beadSize: "6–8 mm", origin: "India", deity: "Maa Saraswati & Lord Shiva", planet: "Venus (Shukra)", mantra: "Om Shreem Sarasvatyei Namah", rulingChakra: "Sahasrara", significance: "Affordable synthetic Sphatik mala — visually identical to natural quartz, ideal for casual daily wear or for keeping the precious AAA mala safe at home.",
    shortDescription: "Affordable synthetic Sphatik mala — visually identical crystal-look, daily-wear alternative to natural quartz.",
    benefits: ["Identical look to natural Sphatik", "Affordable for daily casual wear", "Save your premium mala for sadhana", "Travel-friendly replacement", "Same Saraswati styling"],
    whoShouldUse: ["Daily casual wearers", "Travellers and gym-goers", "Anyone wanting the look at lower cost"], imageKey: "sphatik_plain" },

  // ── Haldi (51) ──
  { id: 51, name: "Vedic Tatva Haldi (Turmeric) Mala 108 Beads — Sacred Bagalamukhi & Brihaspati Mala", shortName: "Haldi (Turmeric) Mala", material: "Pure Haldi (Turmeric Root)", beadCount: "108 + 1 Guru bead", beadSize: "6–8 mm", origin: "India", deity: "Maa Bagalamukhi & Brihaspati", planet: "Jupiter (Guru)", mantra: "Om Brim Brihaspatyei Namah", rulingChakra: "Manipura", significance: "Haldi mala carved from sacred turmeric root is the prescribed mala for Bagalamukhi sadhana, Brihaspati shanti and yellow-coloured Devi mantras. Bright yellow embodies Jupiter's wisdom and protection.",
    shortDescription: "108-bead pure Haldi (turmeric) mala — sacred for Bagalamukhi sadhana, Brihaspati shanti and Devi mantras.",
    benefits: ["The prescribed mala for Bagalamukhi sadhana", "Strengthens Jupiter (Brihaspati)", "Powerful protection against enemies", "Used in Pitambari Devi mantras", "Brings wisdom, success and respect"],
    whoShouldUse: ["Bagalamukhi sadhaks", "People with weak / debilitated Jupiter", "Those facing legal cases or court matters", "Devi worshippers (especially yellow Devi)"], imageKey: "haldi" },

  // ── Vaijyanti (52) ──
  { id: 52, name: "Vedic Tatva Vaijyanti Mala 108 Beads — Sacred Krishna Mala from Holy Vaijyanti Seeds", shortName: "Vaijyanti Mala", material: "Vaijyanti Seeds (sacred to Krishna)", beadCount: "108 + 1 Guru bead", beadSize: "6–8 mm", origin: "India", deity: "Lord Krishna", planet: "Mercury", mantra: "Om Namo Bhagavate Vasudevaya", rulingChakra: "Anahata", significance: "Vaijyanti is the sacred garland that Lord Krishna himself wears — its seeds are the most beloved mala material for Krishna bhaktas across India.",
    shortDescription: "108-bead authentic Vaijyanti mala — the sacred mala worn by Lord Krishna himself, ideal for Krishna japa.",
    benefits: ["Krishna's own beloved sacred mala", "Most powerful for Krishna bhakti japa", "Brings divine love and devotion", "Pacifies emotional wounds", "Promotes Krishna consciousness"],
    whoShouldUse: ["Krishna devotees and ISKCON sadhaks", "Daily Hare Krishna jaapis", "Those seeking divine love"], imageKey: "vaijyanti" },

  // ── Kadamba (53) ──
  { id: 53, name: "Vedic Tatva Kadamba Mala 108 Beads — Sacred Kadamba Wood Mala for Krishna Bhakti", shortName: "Kadamba Mala", material: "Kadamba Wood (Krishna's Tree)", beadCount: "108 + 1 Guru bead", beadSize: "6–8 mm", origin: "India", deity: "Lord Krishna", planet: "Venus & Mercury", mantra: "Om Namo Bhagavate Vasudevaya", rulingChakra: "Anahata", significance: "The Kadamba tree is Lord Krishna's beloved — He played His flute beneath it in Vrindavan. A 108-bead Kadamba mala carries the lila of Krishna in every bead.",
    shortDescription: "108-bead sacred Kadamba wood mala — beloved tree of Lord Krishna, ideal for Vrindavan-style bhakti japa.",
    benefits: ["Carries Vrindavan Krishna lila energy", "Awakens divine love (prema bhakti)", "Mild aromatic Kadamba wood", "Ideal for Krishna mantras", "Connects to Vrindavan vibrations"],
    whoShouldUse: ["Krishna bhaktas and ISKCON sadhaks", "Vrindavan pilgrims", "Anyone seeking prema bhakti"], imageKey: "kadamba" },

  // ── Tulsi Malas (54-68) ──
  { id: 54, name: "Vedic Tatva Tulsi Mala Single Round 108 Beads — Pure Holy Basil Wood Krishna Mala", shortName: "Tulsi Mala Single Round", material: "Pure Tulsi Wood (Holy Basil)", beadCount: "108 + 1 Guru bead", beadSize: "5–6 mm", origin: "Vrindavan / India", deity: "Lord Vishnu & Lord Krishna", planet: "Sun & Mercury", mantra: "Hare Krishna Hare Krishna Krishna Krishna Hare Hare", rulingChakra: "Anahata", significance: "The Tulsi mala is the most sacred mala in Vaishnavism. A single-round 108-bead Tulsi mala worn around the neck identifies a true Vaishnava and protects from Yamaraj at the time of death.",
    shortDescription: "Authentic 108-bead pure Tulsi wood mala (single round) — the classic Vaishnava kanthi for Krishna bhakti.",
    benefits: ["The most sacred Vaishnava mala", "Identifies the wearer as a Vishnu/Krishna devotee", "Protects from Yamaraj at the time of death", "Ideal for Hare Krishna mahamantra japa", "Cooling and aromatic on the body"],
    whoShouldUse: ["All Vaishnavas and Krishna devotees", "ISKCON / Gaudiya sadhaks", "Daily Hare Krishna jaapis", "Anyone seeking Vishnu's protection"], imageKey: "tulsi_round" },
  { id: 55, name: "Vedic Tatva Tulsi Mala Double Round 108 Beads — Pure Holy Basil Wood Krishna Mala", shortName: "Tulsi Mala Double Round", material: "Pure Tulsi Wood (Holy Basil)", beadCount: "108 + 1 Guru bead (double strand)", beadSize: "5–6 mm", origin: "Vrindavan / India", deity: "Lord Vishnu & Lord Krishna", planet: "Sun & Mercury", mantra: "Hare Krishna Hare Krishna Krishna Krishna Hare Hare", rulingChakra: "Anahata", significance: "Double-round Tulsi kanthi — two strands of pure tulsi worn together as a fuller Vaishnava neck-piece, traditional in Vrindavan.",
    shortDescription: "Pure Tulsi wood double-round kanthi mala — fuller Vrindavan-style Vaishnava neck-piece.",
    benefits: ["Fuller two-strand Tulsi kanthi", "Traditional Vrindavan style", "Stronger Krishna vibrations", "Ideal for Hare Krishna jaapis", "Cooling and aromatic"],
    whoShouldUse: ["Senior ISKCON / Gaudiya devotees", "Vrindavan pilgrims", "Daily mahamantra jaapis"], imageKey: "tulsi_round" },
  { id: 56, name: "Vedic Tatva Tulsi Mala Triple Round 108 Beads — Pure Holy Basil Wood Krishna Mala", shortName: "Tulsi Mala Triple Round", material: "Pure Tulsi Wood (Holy Basil)", beadCount: "108 + 1 Guru bead (triple strand)", beadSize: "5–6 mm", origin: "Vrindavan / India", deity: "Lord Vishnu & Lord Krishna", planet: "Sun & Mercury", mantra: "Hare Krishna Hare Krishna Krishna Krishna Hare Hare", rulingChakra: "Anahata", significance: "Triple-round Tulsi kanthi — three strands of pure tulsi worn together as a magnificent fuller Vaishnava neck-piece, prized by senior Vrindavan sadhus.",
    shortDescription: "Pure Tulsi wood triple-round kanthi mala — magnificent three-strand Vrindavan-style Vaishnava neck-piece.",
    benefits: ["Fullest three-strand Tulsi kanthi", "Worn by senior Vrindavan sadhus", "Maximum Tulsi vibrations", "Profound Krishna devotion symbol", "Cooling and aromatic"],
    whoShouldUse: ["Senior Vaishnava sadhus and pujaris", "Lifelong ISKCON devotees", "Vrindavan vasis"], imageKey: "tulsi_round" },
  { id: 57, name: "Vedic Tatva Tulsi Mala Triple Layer Braided 8.5 inches — Pure Tulsi Wood Kanthi", shortName: "Tulsi Triple Layer Braided 8.5\"", material: "Pure Tulsi Wood (Holy Basil)", beadCount: "Multi-strand braided kanthi", beadSize: "3–4 mm tiny beads", origin: "Vrindavan / India", deity: "Lord Vishnu & Lord Krishna", planet: "Sun & Mercury", mantra: "Hare Krishna Hare Krishna Krishna Krishna Hare Hare", rulingChakra: "Anahata", significance: "Hand-braided triple-layer Tulsi kanthi at 8.5 inches — the artisan-woven neck-mala of Vrindavan vasis, snug to the throat to mark a true Vaishnava.",
    shortDescription: "Hand-braided 8.5\" triple-layer Tulsi kanthi mala — artisan Vrindavan-style snug Vaishnava neck-mala.",
    benefits: ["Hand-braided artisan craftsmanship", "Snug Vrindavan-style fit", "Identifies a true Vaishnava", "Made from pure Tulsi wood", "Lightweight comfortable kanthi"],
    whoShouldUse: ["ISKCON / Gaudiya Vaishnavas", "Vrindavan pilgrims", "Anyone wanting authentic Vrindavan kanthi"], imageKey: "tulsi_braided" },
  { id: 58, name: "Vedic Tatva Tulsi Radha Krishna Mala 9 inches — Pure Tulsi Wood Vaishnava Kanthi", shortName: "Tulsi Radha Krishna Mala 9\"", material: "Pure Tulsi Wood (Holy Basil)", beadCount: "Multi-strand braided kanthi", beadSize: "3–4 mm tiny beads", origin: "Vrindavan / India", deity: "Sri Sri Radha Krishna", planet: "Sun & Mercury", mantra: "Radhe Radhe", rulingChakra: "Anahata", significance: "9-inch Radha-Krishna Tulsi kanthi — the romantic-divine length worn by Radha-Krishna bhaktas of the Vrindavan sampradaya, soaked in Yugala (couple) bhakti.",
    shortDescription: "9-inch Tulsi Radha-Krishna kanthi mala — romantic-divine Vrindavan kanthi for Yugala bhaktas.",
    benefits: ["Special Radha-Krishna Yugala kanthi", "Vrindavan-style 9-inch length", "Pure Tulsi wood beads", "Brings divine love (madhurya bhakti)", "Lightweight daily-wear kanthi"],
    whoShouldUse: ["Radha-Krishna devotees", "Gaudiya Vaishnavas", "Vrindavan vasis and pilgrims"], imageKey: "tulsi_braided" },
  { id: 59, name: "Vedic Tatva Tulsi Chawpatey Mala 108 Beads — Sacred Flat Tulsi Beads Kanthi", shortName: "Tulsi Chawpatey Mala", material: "Pure Tulsi Wood (Chawpatey/Cylindrical)", beadCount: "108 + 1 Guru bead", beadSize: "Cylindrical chawpatey style", origin: "Vrindavan / India", deity: "Lord Vishnu & Lord Krishna", planet: "Sun & Mercury", mantra: "Hare Krishna Hare Krishna Krishna Krishna Hare Hare", rulingChakra: "Anahata", significance: "Chawpatey-cut Tulsi mala uses traditional cylindrical-flat tulsi beads — the classic shape worn by Vaishnava sadhus across Vrindavan and Mathura for centuries.",
    shortDescription: "Traditional 108-bead Tulsi Chawpatey mala — classic cylindrical-flat tulsi beads worn by Vrindavan sadhus.",
    benefits: ["Traditional chawpatey cylindrical bead shape", "Worn by Vrindavan / Mathura sadhus", "Pure Tulsi wood", "Ideal for Hare Krishna japa", "Distinctive sadhu-style kanthi"],
    whoShouldUse: ["Senior Vaishnava sadhus", "ISKCON / Gaudiya devotees", "Daily Krishna jaapis"], imageKey: "tulsi_chawpatey" },
  { id: 60, name: "Vedic Tatva Tulsi Chawpatey Red Mala 108 Beads — Sacred Red-Tinted Tulsi Kanthi", shortName: "Tulsi Chawpatey Mala Red", material: "Pure Tulsi Wood (Red-Tinted Chawpatey)", beadCount: "108 + 1 Guru bead", beadSize: "Cylindrical chawpatey style", origin: "Vrindavan / India", deity: "Sri Sri Radha Krishna", planet: "Sun & Mercury", mantra: "Radhe Radhe", rulingChakra: "Anahata", significance: "Naturally red-tinted Chawpatey Tulsi mala — the rarer variant prized for Radha bhakti, the red shade representing Radha Rani's love.",
    shortDescription: "Rare red-tinted 108-bead Tulsi Chawpatey mala — special Radha-bhakti kanthi from Vrindavan.",
    benefits: ["Rare red-tinted variant", "Special Radha-bhakti symbolism", "Traditional chawpatey shape", "Pure Tulsi wood", "Distinctive devotional kanthi"],
    whoShouldUse: ["Radha devotees", "Gaudiya Vaishnava sadhaks", "Vrindavan vasis"], imageKey: "tulsi_chawpatey_red" },
  { id: 61, name: "Vedic Tatva Tulsi Cut Mala 15 inches — Long Pure Tulsi Wood Kanthi Mala", shortName: "Tulsi Cut Mala 15\"", material: "Pure Tulsi Wood (Cut Beads)", beadCount: "Long 15-inch kanthi", beadSize: "Thin elongated cut", origin: "Vrindavan / India", deity: "Lord Vishnu & Lord Krishna", planet: "Sun & Mercury", mantra: "Hare Krishna Hare Krishna Krishna Krishna Hare Hare", rulingChakra: "Anahata", significance: "Long 15-inch Tulsi cut mala — elongated thin cut tulsi beads worn over the chest as a longer Vaishnava kanthi, traditional among Bhaktivedanta lineage devotees.",
    shortDescription: "Long 15-inch Tulsi cut-bead kanthi mala — elongated chest-length Vaishnava neck-mala from Vrindavan.",
    benefits: ["Long 15-inch chest length", "Elongated thin Tulsi cut beads", "Traditional Vaishnava kanthi", "Pure Tulsi wood", "Identifies a Vaishnava devotee"],
    whoShouldUse: ["Vaishnava devotees and Krishna bhaktas", "ISKCON / Bhaktivedanta lineage", "Daily mahamantra jaapis"], imageKey: "tulsi_cut" },
  { id: 62, name: "Vedic Tatva Tulsi Radhe Patta Mala 9 inches — Pure Tulsi Patta Vaishnava Kanthi", shortName: "Tulsi Radhe Patta Mala 9\"", material: "Pure Tulsi Patta (flat strip beads)", beadCount: "9-inch braided kanthi", beadSize: "Flat patta style", origin: "Vrindavan / India", deity: "Sri Sri Radha Krishna", planet: "Sun & Mercury", mantra: "Radhe Radhe", rulingChakra: "Anahata", significance: "9-inch Radhe Patta Tulsi mala — flat tulsi-patta style beads woven into a snug Radha-bhakti kanthi, a Vrindavan artisan special.",
    shortDescription: "Hand-braided 9-inch Tulsi Radhe Patta kanthi mala — flat patta-style Radha bhakti kanthi from Vrindavan.",
    benefits: ["Flat patta-style Tulsi beads", "Hand-braided Vrindavan craft", "Special Radha bhakti kanthi", "Pure Tulsi wood", "Snug 9-inch length"],
    whoShouldUse: ["Radha-Krishna devotees", "Gaudiya Vaishnavas", "Vrindavan vasis and pilgrims"], imageKey: "tulsi_braided" },
  { id: 63, name: "Vedic Tatva Tulsi Jap Mala A-Quality 108 Beads — Pure Holy Basil Japa Mala", shortName: "Tulsi Jap Mala A-Quality", material: "Pure Tulsi Wood (Holy Basil)", beadCount: "108 + 1 Guru bead", beadSize: "5–6 mm", origin: "Vrindavan / India", deity: "Lord Vishnu & Lord Krishna", planet: "Sun & Mercury", mantra: "Hare Krishna Hare Krishna Krishna Krishna Hare Hare", rulingChakra: "Anahata", significance: "Authentic A-quality Tulsi japa mala — the daily mahamantra mala of millions of Vaishnavas worldwide, classic 108-bead format.",
    shortDescription: "Authentic A-quality 108-bead Tulsi japa mala — classic mahamantra mala of Vaishnavas worldwide.",
    benefits: ["Authentic pure Tulsi wood", "Classic 108-bead japa format", "Affordable daily japa mala", "Used in mahamantra japa", "Traditional Vrindavan craft"],
    whoShouldUse: ["All Vaishnavas and Krishna bhaktas", "Daily mahamantra jaapis", "Beginning Krishna sadhaks"], imageKey: "tulsi_round" },
  { id: 64, name: "Vedic Tatva Tulsi Jap Mala AA-Quality 108 Beads — Premium Holy Basil Japa Mala", shortName: "Tulsi Jap Mala AA-Quality", material: "Pure Tulsi Wood (Holy Basil)", beadCount: "108 + 1 Guru bead", beadSize: "5–6 mm", origin: "Vrindavan / India", deity: "Lord Vishnu & Lord Krishna", planet: "Sun & Mercury", mantra: "Hare Krishna Hare Krishna Krishna Krishna Hare Hare", rulingChakra: "Anahata", significance: "Premium AA-quality Tulsi japa mala — hand-picked uniformly sized tulsi beads with smoother polish for refined daily japa.",
    shortDescription: "Premium AA-quality 108-bead Tulsi japa mala — hand-picked uniform beads with smooth polish.",
    benefits: ["Hand-picked uniform Tulsi beads", "Smoother polish for finger japa", "Premium daily-japa mala", "Pure Tulsi wood", "Lifetime sadhana companion"],
    whoShouldUse: ["Serious Vaishnava sadhaks", "Daily mahamantra jaapis", "ISKCON initiated devotees"], imageKey: "tulsi_round" },
  { id: 65, name: "Vedic Tatva Tulsi Jap Mala AAA-Quality 108 Beads — Heirloom Holy Basil Japa Mala", shortName: "Tulsi Jap Mala AAA-Quality", material: "Pure Tulsi Wood (Holy Basil)", beadCount: "108 + 1 Guru bead", beadSize: "6–7 mm", origin: "Vrindavan / India", deity: "Lord Vishnu & Lord Krishna", planet: "Sun & Mercury", mantra: "Hare Krishna Hare Krishna Krishna Krishna Hare Hare", rulingChakra: "Anahata", significance: "AAA-grade premium Tulsi japa mala — finest hand-selected larger tulsi beads with mirror polish, the heirloom japa mala.",
    shortDescription: "Heirloom AAA-quality 108-bead Tulsi japa mala — finest hand-selected larger beads with mirror polish.",
    benefits: ["Finest AAA-grade Tulsi beads", "Larger 6–7 mm size for grip", "Mirror polish for smooth japa", "Heirloom-grade craftsmanship", "Lifetime sadhana mala"],
    whoShouldUse: ["Senior Vaishnava sadhaks and gurus", "Lifetime heirloom gifting", "ISKCON sannyasis and brahmacharis"], imageKey: "tulsi_round" },
  { id: 66, name: "Vedic Tatva Tulsi Bageshwar Dham Mala 108 Beads — Sacred Bageshwar Dhaam Tulsi Mala", shortName: "Tulsi Bageshwar Dham Mala", material: "Pure Tulsi Wood (Holy Basil)", beadCount: "108 + 1 Guru bead", beadSize: "5–6 mm", origin: "Bageshwar Dham, India", deity: "Lord Hanuman & Lord Krishna", planet: "Mars & Sun", mantra: "Om Hanumate Namah", rulingChakra: "Anahata", significance: "Inspired by the sacred Bageshwar Dham of Bageshwar Sarkar, this Tulsi mala is favoured by Hanuman and Krishna devotees who follow Bageshwar Dham parampara.",
    shortDescription: "108-bead Tulsi Bageshwar Dham mala — sacred Tulsi mala in the Bageshwar Sarkar tradition for Hanuman & Krishna bhakti.",
    benefits: ["Inspired by Bageshwar Dham parampara", "Pure Tulsi wood beads", "Combines Hanuman & Krishna bhakti", "Daily japa and kanthi wear", "Brings courage and devotion"],
    whoShouldUse: ["Bageshwar Dham followers", "Hanuman and Krishna bhaktas", "Daily Sundarkand / Mahamantra jaapis"], imageKey: "tulsi_round" },
  { id: 67, name: "Vedic Tatva Tulsi Round 108 Beads Mala 6mm — Premium Round Holy Basil Japa Mala", shortName: "Tulsi Round 108 Beads Mala 6mm", material: "Pure Tulsi Wood (Holy Basil)", beadCount: "108 + 1 Guru bead", beadSize: "6 mm", origin: "Vrindavan / India", deity: "Lord Vishnu & Lord Krishna", planet: "Sun & Mercury", mantra: "Hare Krishna Hare Krishna Krishna Krishna Hare Hare", rulingChakra: "Anahata", significance: "Perfect round 6 mm Tulsi mala — uniform spherical hand-turned tulsi beads for an elegant daily japa mala.",
    shortDescription: "Perfect round 6 mm Tulsi mala — uniform spherical hand-turned beads for elegant daily Krishna japa.",
    benefits: ["Perfectly round hand-turned beads", "Premium 6 mm size", "Elegant uniform appearance", "Pure Tulsi wood", "Smooth feel for finger japa"],
    whoShouldUse: ["Vaishnava devotees and Krishna bhaktas", "Daily mahamantra jaapis", "Anyone wanting elegant round Tulsi"], imageKey: "tulsi_round" },
  { id: 68, name: "Vedic Tatva Tulsi Round 108 Beads Mala 8mm — Bold Round Holy Basil Japa Mala", shortName: "Tulsi Round 108 Beads Mala 8mm", material: "Pure Tulsi Wood (Holy Basil)", beadCount: "108 + 1 Guru bead", beadSize: "8 mm", origin: "Vrindavan / India", deity: "Lord Vishnu & Lord Krishna", planet: "Sun & Mercury", mantra: "Hare Krishna Hare Krishna Krishna Krishna Hare Hare", rulingChakra: "Anahata", significance: "Bold 8 mm round Tulsi mala — visible larger Tulsi beads for a presence-filled Vaishnava kanthi.",
    shortDescription: "Bold 8 mm round Tulsi mala — visible Tulsi kanthi for senior Vaishnavas and bold devotional presence.",
    benefits: ["Bold visible 8 mm Tulsi beads", "Strong Vaishnava kanthi presence", "Pure Tulsi wood", "Comfortable finger japa grip", "Premium daily-wear mala"],
    whoShouldUse: ["Senior Vaishnavas and ISKCON devotees", "Daily mahamantra jaapis", "Anyone wanting bold Tulsi kanthi"], imageKey: "tulsi_round" },
];

const BRAND = {
  maroon: "#6D2B35",
  maroonDark: "#4A1A23",
  gold: "#D4AF37",
  cream: "#FBF7EE",
  darkText: "#2A1F1A",
  mutedText: "#6B5D54",
};

function buildAplusHtml(item: MalaItem): string {
  const benefitsHtml = item.benefits
    .map(
      (b, i) =>
        `<div style="display:flex;align-items:flex-start;gap:14px;padding:14px;background:${BRAND.cream};border:1px solid ${BRAND.gold}33;border-radius:8px;">
          <div style="flex-shrink:0;width:36px;height:36px;border-radius:50%;background:${BRAND.gold};color:${BRAND.maroonDark};display:flex;align-items:center;justify-content:center;font-family:Georgia,serif;font-weight:bold;font-size:16px;">${i + 1}</div>
          <div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.55;color:${BRAND.darkText};">${b}</div>
        </div>`
    )
    .join("");

  const whoHtml = item.whoShouldUse
    .map(
      (w) =>
        `<li style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:${BRAND.darkText};margin-bottom:8px;padding-left:8px;">${w}</li>`
    )
    .join("");

  const specs: Array<[string, string]> = [
    ["Material", item.material],
    ["Bead Count", item.beadCount],
    ["Bead Size", item.beadSize],
    ["Origin", item.origin],
    ["Ruling Deity", item.deity],
    ["Ruling Planet", item.planet],
    ["Beej / Japa Mantra", item.mantra],
    ["Ruling Chakra", item.rulingChakra],
    ["Certification", "Lab-Tested · Authenticity Certified"],
    ["Energization", "Energised by Vedic priests with proper mantras"],
    ["Stringing", "Premium thread (free) | Silver/Gold cap (optional)"],
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
    <div style="display:inline-block;padding:6px 18px;border:1px solid ${BRAND.gold};border-radius:999px;color:${BRAND.gold};font-family:Arial,sans-serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;margin-bottom:18px;">Certified Authentic · Energised · 108 Beads</div>
    <h1 style="font-family:Georgia,serif;color:#fff;font-size:34px;margin:0 0 12px;line-height:1.25;font-weight:normal;">${item.shortName}</h1>
    <div style="width:80px;height:2px;background:${BRAND.gold};margin:14px auto;"></div>
    <p style="color:#f3e9d2;font-family:Georgia,serif;font-style:italic;font-size:16px;max-width:680px;margin:0 auto;line-height:1.6;">${item.significance}</p>
  </div>

  <div style="padding:36px 24px;background:#fff;">
    <h2 style="font-family:Georgia,serif;color:${BRAND.maroon};font-size:24px;text-align:center;margin:0 0 28px;font-weight:normal;">Spiritual Benefits</h2>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:14px;">${benefitsHtml}</div>
  </div>

  <div style="padding:36px 24px;background:${BRAND.cream};">
    <h2 style="font-family:Georgia,serif;color:${BRAND.maroon};font-size:24px;text-align:center;margin:0 0 24px;font-weight:normal;">Who Should Use This Mala?</h2>
    <div style="max-width:780px;margin:0 auto;background:#fff;border-left:4px solid ${BRAND.gold};border-radius:0 8px 8px 0;padding:24px 28px;">
      <ul style="margin:0;padding-left:20px;">${whoHtml}</ul>
    </div>
  </div>

  <div style="padding:36px 24px;background:#fff;">
    <h2 style="font-family:Georgia,serif;color:${BRAND.maroon};font-size:24px;text-align:center;margin:0 0 24px;font-weight:normal;">Vedic Significance &amp; Mantra</h2>
    <div style="max-width:780px;margin:0 auto;display:grid;grid-template-columns:1fr 1.4fr;gap:28px;align-items:center;">
      <div style="background:linear-gradient(180deg,${BRAND.maroon},${BRAND.maroonDark});color:#fff;padding:32px 20px;text-align:center;border-radius:8px;">
        <div style="font-family:Georgia,serif;font-size:11px;letter-spacing:2px;color:${BRAND.gold};margin-bottom:10px;">JAPA MANTRA</div>
        <div style="font-family:Georgia,serif;font-style:italic;font-size:18px;line-height:1.5;color:#fff;">${item.mantra}</div>
        <div style="margin-top:18px;font-size:11px;color:#f3e9d2;">Chant 108 times daily on this mala</div>
      </div>
      <div>
        <p style="font-family:Arial,sans-serif;font-size:14px;line-height:1.7;color:${BRAND.mutedText};margin:0 0 12px;">According to Vedic tradition, a mala of <b>108 beads</b> represents the 108 Upanishads, the 108 names of the Divine, and the 108 sacred energies of the cosmos. Each round of japa on this mala creates a complete spiritual cycle.</p>
        <p style="font-family:Arial,sans-serif;font-size:14px;line-height:1.7;color:${BRAND.mutedText};margin:0;">This mala is sacred to <b style="color:${BRAND.maroon};">${item.deity}</b> and aligned with the planet <b style="color:${BRAND.maroon};">${item.planet}</b>. It is energised by Vedic priests before despatch and may be re-energised at home with Panchamrit on Mondays or full-moon nights.</p>
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
    <h2 style="font-family:Georgia,serif;color:${BRAND.maroon};font-size:24px;text-align:center;margin:0 0 24px;font-weight:normal;">How to Use &amp; Care for Your Mala</h2>
    <div style="max-width:780px;margin:0 auto;background:${BRAND.cream};border-left:4px solid ${BRAND.gold};padding:24px 28px;border-radius:0 8px 8px 0;">
      ${["Take a bath early in the morning and sit facing east in a clean place.",
         "Hold the mala in your right hand, draped over the middle finger. Use your thumb to push each bead forward.",
         "Begin from the bead next to the Guru bead. Chant <b>" + item.mantra + "</b> on each bead.",
         "Never cross over the Guru bead — turn the mala around and continue in the reverse direction.",
         "Avoid wearing while sleeping with partner, in the toilet, or during shraddha. Re-energise every 6 months."]
        .map((step, i) => `<div style="display:flex;align-items:flex-start;gap:14px;margin-bottom:14px;">
          <div style="flex-shrink:0;width:28px;height:28px;border-radius:50%;background:${BRAND.gold};color:${BRAND.maroonDark};display:flex;align-items:center;justify-content:center;font-family:Georgia,serif;font-weight:bold;font-size:13px;">${i + 1}</div>
          <div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.65;color:${BRAND.darkText};padding-top:3px;">${step}</div>
        </div>`).join("")}
    </div>
  </div>

  <div style="padding:36px 24px;background:linear-gradient(135deg,${BRAND.maroon} 0%,${BRAND.maroonDark} 100%);border-radius:0 0 12px 12px;">
    <h2 style="font-family:Georgia,serif;color:#fff;font-size:22px;text-align:center;margin:0 0 28px;font-weight:normal;">Why Choose Vedic Tatva Malas</h2>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:18px;max-width:880px;margin:0 auto;">
      ${[
        ["Certified Authentic", "Every mala is sourced from trusted partners (Tejvij &amp; Sons) and lab-verified for material authenticity."],
        ["Energised &amp; Blessed", "Each mala is energised by Vedic priests with proper mantras before despatch."],
        ["Free Replacement", "If your mala does not feel right within 7 days, we replace it free."],
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

export async function seedMalaProducts() {
  // Idempotency by slug only — Wearables may contain unrelated SKUs.
  const existing = await db.select().from(products);
  const existingBySlug = new Map(
    existing.filter((p) => p.slug).map((p) => [p.slug as string, p]),
  );

  const insertRows: any[] = [];
  let updatedImages = 0;

  for (const item of ITEMS) {
    const slug = `${slugify(item.shortName)}-tejvij-and-sons`;
    const img = IMG(item.id);

    const richDescription = buildAplusHtml(item);
    const description =
      `<p><b>${item.shortName}</b> — ${item.shortDescription}</p>` +
      `<p><b>Material:</b> ${item.material} &nbsp; | &nbsp; <b>Bead Count:</b> ${item.beadCount} &nbsp; | &nbsp; <b>Origin:</b> ${item.origin}</p>` +
      `<p><b>Deity:</b> ${item.deity} &nbsp; | &nbsp; <b>Planet:</b> ${item.planet} &nbsp; | &nbsp; <b>Mantra:</b> <i>${item.mantra}</i></p>` +
      `<p>${item.significance}</p>`;

    const existingRow = existingBySlug.get(slug);
    if (existingRow) {
      // Backfill catalogue image if it differs from current.
      if (existingRow.image !== img) {
        await db
          .update(products)
          .set({
            image: img,
            images: [img],
            imageAlts: [`${item.shortName} - Authentic 108 bead mala by Tejvij & Sons (Vedic Tatva)`],
          })
          .where(eq(products.id, existingRow.id));
        updatedImages++;
      }
      continue;
    }

    insertRows.push({
      name: item.name,
      description,
      price: 1999,
      mrp: 2999,
      stock: 50,
      category: "Wearables",
      image: img,
      images: [img],
      imageAlts: [`${item.shortName} - Authentic 108 bead mala by Tejvij & Sons (Vedic Tatva)`],
      badge: "Certified Authentic",
      salesCount: 0,
      highlights: item.benefits.slice(0, 5),
      features: [
        `Material: ${item.material}`,
        `Bead Count: ${item.beadCount}`,
        `Bead Size: ${item.beadSize}`,
        `Origin: ${item.origin}`,
        `Ruling Deity: ${item.deity}`,
        `Ruling Planet: ${item.planet}`,
        `Mantra: ${item.mantra}`,
        `Certification: Lab-Tested · Authenticity Certified`,
      ],
      richDescription,
      aplusEnabled: true,
      slug,
      gstPercent: 3,
      hsnCode: "7117",
      brand: "Vedic Tatva",
      productType: "product" as const,
    });
  }

  if (insertRows.length > 0) {
    console.log(`Seeding ${insertRows.length}/${ITEMS.length} Mala (Wearables) products from Tejvij & Sons catalogue...`);
    await db.insert(products).values(insertRows);
  }
  if (updatedImages > 0) {
    console.log(`Mala seed: refreshed catalogue images for ${updatedImages} existing mala SKUs.`);
  }
  if (insertRows.length === 0 && updatedImages === 0) {
    console.log(`Mala seed: all ${ITEMS.length} mala SKUs already present and up-to-date.`);
  } else {
    console.log(`Mala seed complete. Inserted: ${insertRows.length}, image-refreshed: ${updatedImages}.`);
  }
}

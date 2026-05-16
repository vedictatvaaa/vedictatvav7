import { db } from "./db";
import { pujaTypes, qaQuestions, qaAnswers } from "@shared/schema";
import { eq, sql } from "drizzle-orm";

// ============================================================
// Puja Library — 12 flagship pujas with rich content
// ============================================================
interface PujaSeed {
  slug: string;
  name: string;
  deity: string;
  category: string;
  shortDescription: string;
  whyPerformed: string;
  storyMyth: string;
  howCelebrated: string;
  ethics: string;
  benefits: string;
  durationMinutes: number;
  estimatedCost: string;
  difficulty: string;
  requirements: Array<{ item: string; qty: string; note?: string }>;
  faq: Array<{ q: string; a: string }>;
  muhuratRules: any[];
  metaTitle: string;
  metaDescription: string;
  bookingShopUrl?: string;
  bookingShopLabel?: string;
}

const PUJA_SEEDS: PujaSeed[] = [
  {
    slug: "satyanarayan-puja",
    name: "Satyanarayan Puja",
    deity: "Lord Vishnu (Satyanarayan form)",
    category: "deity",
    shortDescription: "A Vishnu puja performed for fulfilment of vows, prosperity, and family well-being. One of the most popular household pujas in India.",
    whyPerformed: "<p>Satyanarayan Puja is performed to invoke Lord Vishnu in his Satyanarayan form — the embodiment of truth. Devotees undertake this puja to seek blessings for prosperity, marital harmony, recovery from illness, success in new ventures, or as a thanksgiving for a wish fulfilled.</p><p>It is one of the rare pujas that does not require a fire ritual (havan) and can be performed at home with simple arrangements, making it accessible to families of every background.</p>",
    storyMyth: "<p>The puja's significance is narrated in five chapters of the <em>Skanda Purana</em>. The first chapter describes Sage Narada questioning Lord Vishnu about how mortals can find relief from suffering, to which Vishnu reveals the Satyanarayan vrat. Subsequent chapters narrate stories of a poor brahmin, a woodcutter, a merchant named Sadhu Vaishya, and king Tungadhwaja — all of whom received divine grace by performing the vrat with sincerity, and faced misfortune when they neglected it.</p>",
    howCelebrated: "<p>The puja is typically performed on a full moon (Purnima), Ekadashi, or any auspicious occasion. Steps:</p><ol><li><strong>Sankalpa:</strong> The host (yajaman) takes a vow stating intent.</li><li><strong>Ganesh Puja:</strong> Lord Ganesha is invoked first to remove obstacles.</li><li><strong>Kalash Sthapana:</strong> A copper pot with water, mango leaves and a coconut is established.</li><li><strong>Navagraha worship:</strong> The nine planetary deities are honoured.</li><li><strong>Satyanarayan invocation:</strong> Lord Vishnu is invoked with shodashopachara (16 offerings).</li><li><strong>Katha:</strong> The five chapters of the Satyanarayan story are recited.</li><li><strong>Aarti & prasad:</strong> Banana, panchamrit, and sapatha (a sweet of wheat flour, sugar, ghee and banana) are offered and distributed.</li></ol>",
    ethics: "<p><strong>Do:</strong> Bathe and wear clean clothes; complete the puja before partaking in prasad; share prasad with at least five people; observe a vrat (fast) until the katha concludes.</p><p><strong>Don't:</strong> Skip the katha — it is the heart of the puja; argue or speak harshly during the puja; consume tamasic food (onion, garlic, meat, alcohol) on the day; perform the puja during impurity periods (mourning, menstruation).</p>",
    benefits: "Bestows prosperity, removes obstacles in business, strengthens marital bonds, and is widely observed as a thanksgiving when a sincere wish is granted.",
    durationMinutes: 90,
    estimatedCost: "₹2,500 – ₹5,500 (with pandit)",
    difficulty: "moderate",
    requirements: [
      { item: "Roli, akshat, sandalwood paste", qty: "small bowl each" },
      { item: "Banana leaves, banana stems", qty: "4 leaves, 1 stem", note: "for the chowki canopy" },
      { item: "Tulsi leaves", qty: "11 fresh leaves" },
      { item: "Panchamrit (milk, curd, ghee, honey, sugar)", qty: "1 small cup mix" },
      { item: "Sapatha ingredients (wheat flour, sugar, ghee, banana)", qty: "as per family size" },
      { item: "Camphor, incense, ghee diya", qty: "1 each" },
      { item: "Yellow flowers, marigold mala", qty: "1 mala + petals" },
    ],
    faq: [
      { q: "Can Satyanarayan Puja be done without a pandit?", a: "Yes. Many families recite the katha themselves. However a trained pandit ensures the mantras and procedure are correct, especially for first-time hosts." },
      { q: "Is fasting mandatory?", a: "A nirjala fast is not required — most devotees observe a partial fast (one meal of fruit/milk) until the katha is complete." },
      { q: "Which day is best?", a: "Purnima (full moon) is most popular. Ekadashi, Sankashti, and the start of any new venture are also auspicious." },
      { q: "Can it be done in the evening?", a: "Yes — sandhya (evening) is in fact the traditional time for Satyanarayan Puja." },
    ],
    muhuratRules: [
      { type: "purnima", label: "Satyanarayan Purnima", limit: 12 },
      { type: "ekadashi", label: "Ekadashi vrat", limit: 8 },
    ],
    metaTitle: "Satyanarayan Puja — Vidhi, Story, Muhurat 2026 | Vedic Tatva",
    metaDescription: "Complete Satyanarayan Puja vidhi at home, full katha summary, samagri checklist and 2026 auspicious dates. Book a verified pandit on Vedic Tatva.",
    bookingShopUrl: "/online-puja-booking",
    bookingShopLabel: "Book a Pandit for Satyanarayan Puja",
  },
  {
    slug: "rudrabhishek-puja",
    name: "Rudrabhishek Puja",
    deity: "Lord Shiva (Rudra)",
    category: "deity",
    shortDescription: "An anointment puja of Lord Shiva using sacred substances, recited with the powerful Rudri Path. Considered one of the highest forms of Shiva worship.",
    whyPerformed: "<p>Rudrabhishek is performed to please Lord Shiva, who as Rudra is the dispeller of suffering. Devotees undertake it for relief from grave illness, removal of doshas (especially Kaal Sarp and Pitra dosh), spiritual progress, peace of mind, and for the well-being of departed ancestors.</p>",
    storyMyth: "<p>The Rudram chant — drawn from the Yajurveda — is among the most ancient hymns in Sanatana tradition, dating back over three thousand years. The legend of Markandeya, the boy-sage saved from death by his Rudrabhishek devotion, is the most famous story associated with this puja.</p>",
    howCelebrated: "<p>The Shiva lingam is installed and bathed with eleven sacred substances — water, milk, curd, ghee, honey, sugarcane juice, sesame oil, gangajal, panchamrit, coconut water, and finally pure water again — while the Rudri Path (Sri Rudram from the Yajurveda) is chanted by trained pandits. Bel patra, white flowers, and chandan are offered. A maha aarti and shanti path conclude the puja.</p>",
    ethics: "<p><strong>Do:</strong> Maintain silence during the Rudri Path; use only odd numbers of bel patras; chant 'Om Namah Shivaya' continuously.</p><p><strong>Don't:</strong> Offer turmeric, ketaki flowers, or coconut water alone (without other substances) on a Shiva lingam; use plastic vessels for abhishek; allow shoes near the puja area.</p>",
    benefits: "Removes doshas, calms a troubled mind, supports recovery from chronic illness, strengthens spiritual sadhana, and is especially powerful on Shivratri and Mondays.",
    durationMinutes: 120,
    estimatedCost: "₹3,500 – ₹11,000",
    difficulty: "elaborate",
    requirements: [
      { item: "Shiva lingam (parad / black stone)", qty: "1" },
      { item: "Bel patra (3-leaf)", qty: "108 leaves" },
      { item: "Gangajal", qty: "500 ml" },
      { item: "Raw cow milk", qty: "1 litre" },
      { item: "White flowers, dhatura", qty: "1 mala + 5 dhatura" },
      { item: "Bhasma (sacred ash)", qty: "small box" },
      { item: "Rudraksha mala", qty: "1" },
    ],
    faq: [
      { q: "Can a layperson perform Rudrabhishek?", a: "The abhishek itself can be done at home, but the Rudri Path requires trained pandits — incorrect pronunciation defeats the purpose." },
      { q: "When is the best time?", a: "Mondays, Pradosh tithi, Maha Shivratri, and Shravan month are most powerful." },
      { q: "How many pandits are needed?", a: "A solo pandit is acceptable; for ati-rudra (11 cycles) eleven pandits chant in parallel." },
      { q: "Is Rudrabhishek a yagya?", a: "It is a non-fire ritual. A separate Maharudra Yajna combines abhishek with a fire ritual." },
    ],
    muhuratRules: [
      { type: "weekday", weekday: 1, label: "Monday (Shiva day)", limit: 12 },
      { type: "pradosh", label: "Pradosh Vrat", limit: 12 },
      { type: "festival", festival: "maha-shivratri", label: "Maha Shivratri" },
    ],
    metaTitle: "Rudrabhishek Puja — Benefits, Vidhi, Muhurat 2026 | Vedic Tatva",
    metaDescription: "Why Rudrabhishek puja removes doshas, full vidhi, samagri list and 2026 auspicious dates including Mondays and Pradosh Vrat. Book a verified pandit.",
    bookingShopUrl: "/online-puja-booking",
    bookingShopLabel: "Book Rudrabhishek Pandit",
  },
  {
    slug: "ganesh-puja",
    name: "Ganesh Puja",
    deity: "Lord Ganesha",
    category: "deity",
    shortDescription: "Worship of the elephant-headed remover of obstacles, performed at the start of every new venture, daily prayers, and during Ganesh Chaturthi.",
    whyPerformed: "<p>Ganesh Puja is performed to invoke Lord Ganesha, the Vighnaharta — remover of obstacles. Hindus worship Ganesha at the start of any new venture: a business, a wedding, a journey, or even before any other deity in any other puja. Daily Ganesh worship at home is believed to bring intelligence, prosperity, and harmony.</p>",
    storyMyth: "<p>According to the Shiva Purana, Goddess Parvati created Ganesha from sandalwood paste to guard her chamber. A misunderstanding led Lord Shiva to behead the boy, but on realising his mistake replaced the head with that of an elephant, granting him divine status and the boon that he would always be worshipped first among all deities.</p>",
    howCelebrated: "<p>For Ganesh Chaturthi, a clay murti is installed for 1.5, 3, 5, 7, or 11 days. Daily aarti, modak offering, and recitation of the Ganesh Atharvashirsha or Sankata Nashana Stotra are performed. The puja concludes with visarjan (immersion). For everyday worship, a brief lighting of a diya, offering of durva grass, and chanting of 'Om Gan Ganapataye Namah' suffices.</p>",
    ethics: "<p><strong>Do:</strong> Offer durva grass (21 blades); use eco-friendly clay murtis; recite 'Om Gan Ganapataye Namah' 108 times.</p><p><strong>Don't:</strong> Offer tulsi to Ganesha (forbidden in tradition); use plaster of paris murtis (environmentally harmful); break the murti before visarjan.</p>",
    benefits: "Removes obstacles in new ventures, sharpens intellect (especially for students), brings prosperity and family harmony.",
    durationMinutes: 60,
    estimatedCost: "₹1,500 – ₹5,500",
    difficulty: "simple",
    requirements: [
      { item: "Clay Ganesh murti", qty: "1" },
      { item: "Durva grass", qty: "21 blades", note: "essential for Ganesha" },
      { item: "Modak (steamed or fried)", qty: "21" },
      { item: "Red flowers (jaba)", qty: "1 mala" },
      { item: "Kumkum, sandalwood paste", qty: "small bowl" },
      { item: "Camphor, ghee diya", qty: "1 each" },
    ],
    faq: [
      { q: "Why is tulsi not offered to Ganesha?", a: "Ancient texts narrate a curse exchange between Tulsi and Ganesha, which is why the leaf is excluded from his worship even though it is sacred elsewhere." },
      { q: "How long should the murti stay home?", a: "1.5, 3, 5, 7, or 11 days — never even numbers, never beyond Anant Chaturdashi." },
      { q: "Can the visarjan be done at home?", a: "Yes — a clean bucket of water with eco-clay murti is ideal and avoids polluting natural water bodies." },
      { q: "What is the daily Ganesh mantra?", a: "'Om Gan Ganapataye Namah' is the simplest and most popular daily chant." },
    ],
    muhuratRules: [
      { type: "festival", festival: "ganesh-chaturthi", label: "Ganesh Chaturthi" },
      { type: "weekday", weekday: 2, label: "Tuesday (Ganesha day)", limit: 8 },
    ],
    metaTitle: "Ganesh Puja — Vidhi, Mantras, Chaturthi Muhurat 2026",
    metaDescription: "Step-by-step Ganesh puja for home, the right way to do visarjan, samagri checklist and Ganesh Chaturthi muhurat for 2026.",
    bookingShopUrl: "/spiritual-essentials",
    bookingShopLabel: "Shop Ganesh Puja Samagri",
  },
  {
    slug: "lakshmi-puja",
    name: "Lakshmi Puja",
    deity: "Goddess Lakshmi",
    category: "deity",
    shortDescription: "Worship of the goddess of wealth, prosperity and abundance, performed on Diwali, Fridays, Akshaya Tritiya, and Sharad Purnima.",
    whyPerformed: "<p>Lakshmi Puja is performed to invite material prosperity, financial stability, and inner contentment. The puja is most famous on Diwali night, when the goddess is believed to visit clean, well-lit homes.</p>",
    storyMyth: "<p>The Bhagavata Purana narrates how Goddess Lakshmi emerged from the cosmic ocean during the Samudra Manthan, and chose Lord Vishnu as her consort. She is depicted with four hands representing dharma, artha, kama and moksha — the four goals of human life.</p>",
    howCelebrated: "<p>The home is thoroughly cleaned and decorated with rangoli and diyas. A chowki is set with murtis of Lakshmi, Ganesha, and Saraswati. Kuber (god of wealth) is also invoked. The puja includes installation, abhishek with panchamrit, offering of lotus flowers, kheer and dry fruits, and recitation of the Sri Sukta or Lakshmi Ashtottara. The ledger of business accounts is also worshipped (Chopda Pujan).</p>",
    ethics: "<p><strong>Do:</strong> Clean every corner of the home; light diyas through the night; offer lotus, white flowers, kheer.</p><p><strong>Don't:</strong> Quarrel; play loud aggressive music; serve onion or garlic prasad; gamble on Diwali night (a popular myth misinterprets Lakshmi-Krida).</p>",
    benefits: "Attracts wealth, removes financial obstacles, blesses business and household with abundance.",
    durationMinutes: 75,
    estimatedCost: "₹2,000 – ₹7,500",
    difficulty: "moderate",
    requirements: [
      { item: "Lakshmi-Ganesha murti or photo", qty: "1 set" },
      { item: "Lotus flowers", qty: "5 fresh or dried" },
      { item: "Kheer (rice + milk + sugar)", qty: "small bowl" },
      { item: "Silver / brass diya, ghee", qty: "5 diyas" },
      { item: "Cowrie shells, kamalgatta mala", qty: "as available" },
      { item: "Sri Yantra", qty: "1 (optional but recommended)" },
    ],
    faq: [
      { q: "Why is Diwali the best night?", a: "Diwali Amavasya marks Lakshmi's annual visit to earth. Clean, illuminated homes are believed to invite her to stay." },
      { q: "Can Lakshmi Puja be done daily?", a: "Yes — Friday is her weekday, and a brief diya + Sri Sukta recitation is a popular daily practice." },
      { q: "What is Sri Yantra?", a: "A sacred geometric diagram representing the goddess's form; it is energised through this puja and kept on the altar." },
      { q: "Should the puja face a particular direction?", a: "The yajaman should face east or north; the murti faces the yajaman." },
    ],
    muhuratRules: [
      { type: "festival", festival: "diwali", label: "Diwali Lakshmi Puja" },
      { type: "festival", festival: "dhanteras", label: "Dhanteras" },
      { type: "festival", festival: "akshaya-tritiya", label: "Akshaya Tritiya" },
      { type: "weekday", weekday: 5, label: "Friday (Lakshmi day)", limit: 12 },
    ],
    metaTitle: "Lakshmi Puja — Diwali Vidhi, Muhurat 2026 | Vedic Tatva",
    metaDescription: "Complete Lakshmi Puja vidhi for Diwali at home, samagri checklist, muhurat timings and 2026 auspicious dates including Dhanteras and Fridays.",
    bookingShopUrl: "/online-puja-booking",
    bookingShopLabel: "Book Lakshmi Puja Pandit",
  },
  {
    slug: "navagraha-shanti-puja",
    name: "Navagraha Shanti Puja",
    deity: "Nine planetary deities",
    category: "remedial",
    shortDescription: "Pacification of the nine planets to neutralise malefic transits and doshas in a janma kundli. Performed by anyone facing planetary affliction.",
    whyPerformed: "<p>When a janma kundli (birth chart) shows a malefic period of Sade Sati, Mahadasha, retrograde transits, or specific doshas (Mangal, Shani, Kaal Sarp, Pitra), Navagraha Shanti Puja is the classical remedy. It seeks to balance the energies of all nine planets so they bestow their benefic effects.</p>",
    storyMyth: "<p>The nine grahas — Surya, Chandra, Mangal, Budha, Guru, Shukra, Shani, Rahu, and Ketu — are described in the Brihat Parashara Hora Shastra as living beings who govern karma. Honouring them is believed to soften the karmic outcomes prescribed by their transit.</p>",
    howCelebrated: "<p>A nine-square mandala is drawn with rice flour. Each square holds a metal plate or yantra of the corresponding graha — gold for Surya, silver for Chandra, copper for Mangal, brass for Budha, etc. Mantras specific to each graha are chanted in their prescribed count (Surya 7000, Chandra 11000, etc), often spread across multiple sittings. A havan with specific samidha (wood) for each graha concludes the puja.</p>",
    ethics: "<p><strong>Do:</strong> Have an updated kundli analysed before deciding which graha is afflicted; donate items associated with the afflicted planet (white sweets for Chandra, sesame and oil for Shani).</p><p><strong>Don't:</strong> Skip the kundli analysis — random Navagraha rituals do not target the actual issue; rely on puja alone without lifestyle correction.</p>",
    benefits: "Neutralises malefic planetary transits, brings stability to career and relationships, supports the gemstone-and-mantra remedies prescribed in Vedic astrology.",
    durationMinutes: 180,
    estimatedCost: "₹5,500 – ₹21,000",
    difficulty: "elaborate",
    requirements: [
      { item: "Updated janma kundli analysis", qty: "1", note: "essential before deciding scope" },
      { item: "Nine grain (navadhanya) packet", qty: "1 set" },
      { item: "Nine metal yantras", qty: "1 set" },
      { item: "Havan kund, samidha (mango wood)", qty: "1 + bundle" },
      { item: "Coloured cloth squares (9 colours)", qty: "1 set" },
      { item: "Sesame seeds, black urad dal", qty: "for Shani worship" },
    ],
    faq: [
      { q: "Is full Navagraha needed for one bad planet?", a: "Often only the specific graha (e.g. Shani Shanti for Sade Sati) is targeted — but a full Navagraha is more thorough." },
      { q: "How long does one sitting take?", a: "Anywhere from 3 hours (basic) to two full days (elaborate, with all mantra counts completed)." },
      { q: "Are donations part of the puja?", a: "Yes — donating items related to the afflicted planet on the puja day strengthens the result." },
      { q: "Will it cancel my karma?", a: "Vedic tradition holds that planets indicate karma — puja softens the experience and gives strength to navigate it, rather than erasing the karma itself." },
    ],
    muhuratRules: [
      { type: "weekday", weekday: 6, label: "Saturday (Shani day)", limit: 12 },
      { type: "weekday", weekday: 4, label: "Thursday (Guru day)", limit: 8 },
      { type: "festival", festival: "makar-sankranti", label: "Makar Sankranti" },
    ],
    metaTitle: "Navagraha Shanti Puja — Planetary Remedies, Muhurat 2026",
    metaDescription: "Targeted Navagraha Shanti Puja for kundli doshas including Sade Sati, Mangal Dosh, Kaal Sarp Dosh. Vidhi, mantras, donations and 2026 muhurat.",
    bookingShopUrl: "/online-puja-booking",
    bookingShopLabel: "Book Navagraha Pandit",
  },
  {
    slug: "griha-pravesh-puja",
    name: "Griha Pravesh Puja",
    deity: "Vastu Purusha + Ganesha",
    category: "occasion",
    shortDescription: "House-warming puja to consecrate a new home, removing vastu doshas and inviting positive energies before the family moves in.",
    whyPerformed: "<p>Griha Pravesh is performed before the family begins residing in a newly constructed, purchased, or substantially renovated home. The puja honours Vastu Purusha (the cosmic figure that resides in every plot of land), removes any negative residue, and invites Ganesha, Lakshmi, and the family deities to bless the dwelling.</p>",
    storyMyth: "<p>The Matsya Purana describes how Lord Brahma created Vastu Purusha — a being who lay across the earth disturbing the cosmic order. The devas pinned him face-down with various deities residing on each part of his body. The Griha Pravesh ritual acknowledges Vastu Purusha and the resident deities of each direction.</p>",
    howCelebrated: "<p>A muhurat is selected based on the family's nakshatra. On the chosen day, the family enters the home for the first time with the right foot, carrying a kalash of water topped with a coconut. Ganesh and Navagraha pujas are performed, followed by Vastu Shanti — invocation of the 81 vastu padas. A small havan with ghee is offered. Milk is boiled until it overflows in the new kitchen — a symbol of abundance.</p>",
    ethics: "<p><strong>Do:</strong> Choose a Shukla Paksha (waxing moon) day; enter with the right foot first; cook a sweet dish on the same day.</p><p><strong>Don't:</strong> Move in during Chaturmas (4 monsoon months) without consulting a pandit; enter on a Saturday, Tuesday, or Amavasya; bring old broken items into the new home.</p>",
    benefits: "Removes vastu doshas, invites positive energies, sets a stable spiritual tone for the family, supports prosperity and harmony in the new home.",
    durationMinutes: 150,
    estimatedCost: "₹4,500 – ₹15,500",
    difficulty: "moderate",
    requirements: [
      { item: "Coconut + brass / copper kalash", qty: "1" },
      { item: "Mango leaves", qty: "9-11 fresh leaves" },
      { item: "Navadhanya packet", qty: "1 set" },
      { item: "Cow dung cake (for havan)", qty: "5 pieces" },
      { item: "Whole turmeric, betel nuts", qty: "small bag each" },
      { item: "New cookware for first cooking", qty: "as required" },
    ],
    faq: [
      { q: "Is Griha Pravesh different for rented homes?", a: "Yes — a brief Vastu Shanti or symbolic puja is sufficient, since the home is not owned by the family." },
      { q: "Can it be done if the home is not fully ready?", a: "Tradition prefers a fully usable home — at least one kitchen, one bedroom, one bathroom — before performing the puja." },
      { q: "Which months should be avoided?", a: "Pausha (Dec-Jan), Chaitra (March-April), and Bhadrapada (Aug-Sep) are traditionally avoided for moving in." },
      { q: "Should we bring fire from the old home?", a: "Bringing the holy fire from the old kitchen or a temple is a beautiful tradition, symbolising continuity of the family deity's presence." },
    ],
    muhuratRules: [
      { type: "festival", festival: "akshaya-tritiya", label: "Akshaya Tritiya (most auspicious for new beginnings)" },
      { type: "festival", festival: "vasant-panchami", label: "Vasant Panchami" },
      { type: "weekday", weekday: 4, label: "Thursday (Guru day)", limit: 12 },
    ],
    metaTitle: "Griha Pravesh Puja — Vidhi, Best Muhurat 2026 | Vedic Tatva",
    metaDescription: "Step-by-step Griha Pravesh vidhi, best muhurat dates for 2026, samagri checklist, and the must-avoid days. Book a verified pandit.",
    bookingShopUrl: "/online-puja-booking",
    bookingShopLabel: "Book Griha Pravesh Pandit",
  },
  {
    slug: "kaal-sarp-dosh-puja",
    name: "Kaal Sarp Dosh Puja",
    deity: "Rahu, Ketu, Naga deities",
    category: "remedial",
    shortDescription: "A specialised Naga Puja to neutralise Kaal Sarp Dosh — when all seven planets are positioned between Rahu and Ketu in the natal chart.",
    whyPerformed: "<p>Kaal Sarp Dosh occurs when all seven planets in a janma kundli are hemmed between Rahu and Ketu, traditionally believed to cause obstacles in career, marriage, and overall life progress. This puja propitiates the Naga deities (serpent gods) and the chhaya grahas Rahu-Ketu, weakening the dosha's grip.</p>",
    storyMyth: "<p>The puranic story of Samudra Manthan describes how the asura Svarbhanu was cut into Rahu (head) and Ketu (tail) by Lord Vishnu's Mohini avatar — making them the karmic shadow planets. Naga deities like Vasuki, Takshak, and Karkotak are also invoked as they share Rahu-Ketu's serpentine symbolism.</p>",
    howCelebrated: "<p>The puja is preferably performed at Trimbakeshwar (Nashik), Kalahasti (Andhra), or Ujjain — but can also be done at home with a qualified pandit. It involves Naga Bali, abhishek of a silver-snake yantra, recitation of Rahu-Ketu mantras (each 18,000 times), and offering of milk, eggs, and white flowers to a clay snake idol that is later immersed.</p>",
    ethics: "<p><strong>Do:</strong> Verify the dosha through proper kundli analysis; perform on Naga Panchami, Pancham tithi, or Saturday; donate to snake conservation charities.</p><p><strong>Don't:</strong> Self-diagnose Kaal Sarp Dosh from internet checkers — many predictions are incorrect; harm any snake before or after the puja.</p>",
    benefits: "Loosens the dosha's effect, supports career and marriage stability, brings peace from recurring obstacles, removes fear of snakes.",
    durationMinutes: 240,
    estimatedCost: "₹7,500 – ₹25,000",
    difficulty: "elaborate",
    requirements: [
      { item: "Silver snake yantra", qty: "1" },
      { item: "Cow milk, water for abhishek", qty: "1L each" },
      { item: "White flowers, lotus", qty: "1 mala + petals" },
      { item: "Clay snake idols (Rahu + Ketu)", qty: "1 set" },
      { item: "Sandalwood, white sesame", qty: "small quantities" },
      { item: "Donation items (silver, blanket)", qty: "as per capacity" },
    ],
    faq: [
      { q: "Is Trimbakeshwar mandatory?", a: "Highly recommended — it is the traditional kshetra for this puja — but an authorised pandit can perform it elsewhere." },
      { q: "How many times must this puja be done?", a: "Once is generally sufficient, but in severe cases pandits may recommend repeating it every three years." },
      { q: "Will my marriage problems be cured?", a: "The puja supports — not guarantees — improvement; it works alongside genuine effort and counselling." },
      { q: "Can pregnant women attend?", a: "Yes, but should sit at a distance and avoid the havan smoke." },
    ],
    muhuratRules: [
      { type: "weekday", weekday: 6, label: "Saturday (Rahu-Ketu day)", limit: 12 },
      { type: "festival", festival: "maha-shivratri", label: "Maha Shivratri" },
    ],
    metaTitle: "Kaal Sarp Dosh Puja — Trimbakeshwar Vidhi, Muhurat 2026",
    metaDescription: "Authentic Kaal Sarp Dosh Puja vidhi, what the dosh actually means, and 2026 muhurat dates. Verify your kundli before booking.",
    bookingShopUrl: "/online-puja-booking",
    bookingShopLabel: "Book Kaal Sarp Pandit",
  },
  {
    slug: "navratri-puja",
    name: "Navratri Puja",
    deity: "Goddess Durga (nine forms)",
    category: "occasion",
    shortDescription: "Nine-night worship of Goddess Durga's nine forms — Shailaputri to Siddhidatri — observed twice yearly during Chaitra and Sharad Navratri.",
    whyPerformed: "<p>Navratri honours Goddess Durga's victory over the buffalo demon Mahishasura — symbolising the triumph of dharma over adharma. Devotees fast, chant the Durga Saptashati, and worship a different form of the goddess each night to seek strength, protection, and spiritual transformation.</p>",
    storyMyth: "<p>The Devi Mahatmyam (a portion of the Markandeya Purana) narrates the goddess's three great victories — over Madhu-Kaitabha, Mahishasura, and Shumbha-Nishumbha. The nine nights celebrate these stages of cosmic triumph, with the tenth day (Dussehra) marking the final victory.</p>",
    howCelebrated: "<p>A clean corner of the home is set up with a Durga murti and a kalash with sown barley seeds (jvara). Daily rituals include morning aarti, recitation of the Durga Saptashati's 13 chapters (full or selective), offering of red flowers and sweets, and a partial fast (one meal of phalahar). Kanya Pujan on Ashtami or Navami honours nine pre-pubescent girls as forms of the goddess. Visarjan happens on Vijayadashami.</p>",
    ethics: "<p><strong>Do:</strong> Wear the colour of each day if observing the tradition; offer red hibiscus, kumkum; recite at least the Argala and Kilaka stotras daily.</p><p><strong>Don't:</strong> Cut hair or nails during the nine days; consume onion, garlic, meat, or alcohol; quarrel within the family.</p>",
    benefits: "Builds inner strength, dispels fear, brings clarity for new beginnings (Chaitra Navratri marks the Hindu new year), and is especially powerful for women's empowerment and spiritual practice.",
    durationMinutes: 60,
    estimatedCost: "₹1,500 – ₹4,500 per day",
    difficulty: "moderate",
    requirements: [
      { item: "Durga murti / photo", qty: "1" },
      { item: "Kalash with barley seeds", qty: "1" },
      { item: "Red flowers (hibiscus / rose)", qty: "fresh daily" },
      { item: "Akhand jyoti (continuous diya)", qty: "1 with ghee for 9 days" },
      { item: "Durga Saptashati book", qty: "1" },
      { item: "Kanya pujan supplies (puris, halwa, gifts)", qty: "for 9 girls + 1 boy" },
    ],
    faq: [
      { q: "Can men do Kanya Pujan?", a: "Yes — Kanya Pujan is a family ritual; the host family invites the kanyas with respect, regardless of gender." },
      { q: "Which Navratri is more powerful?", a: "Both Chaitra (spring) and Sharad (autumn) are equally significant; Sharad is more widely observed in households." },
      { q: "Is full nine-day fast required?", a: "No — devotees may observe a partial fast, only on the first and last day, or just on Ashtami-Navami." },
      { q: "Why must the akhand jyoti not extinguish?", a: "It symbolises the unbroken consciousness of the goddess and the family's continuous devotion." },
    ],
    muhuratRules: [
      { type: "festival", festival: "navratri-start", label: "Navratri Ghatasthapana" },
      { type: "festival", festival: "dussehra", label: "Vijayadashami" },
    ],
    metaTitle: "Navratri Puja — Vidhi, Mantras, Dates 2026 | Vedic Tatva",
    metaDescription: "Complete Navratri puja vidhi at home, daily mantras for the nine forms of Durga, kanya pujan guide and Sharad Navratri dates 2026.",
    bookingShopUrl: "/online-puja-booking",
    bookingShopLabel: "Book Navratri Pandit",
  },
  {
    slug: "hanuman-puja",
    name: "Hanuman Puja",
    deity: "Lord Hanuman",
    category: "deity",
    shortDescription: "Worship of Lord Hanuman, the eternal bhakta of Sri Rama, performed for courage, protection from negative forces, and removal of Mangal dosha.",
    whyPerformed: "<p>Hanuman Puja is performed to invoke courage, mental strength, and protection from negativity. Hanuman is also the principal remedial deity for Mangal Dosh (Mars affliction in the kundli) and Saturn-related troubles. Tuesday and Saturday are his days.</p>",
    storyMyth: "<p>The Ramayana describes Hanuman as the son of the wind god Vayu and Anjana. As Sri Rama's most devoted bhakta, he became the bridge between divine and mortal — and the only deity in tradition who is said to remain physically present on earth (chiranjivi) to this day.</p>",
    howCelebrated: "<p>A Hanuman murti or image is bathed and adorned with red flowers, vermillion (sindoor), and a tulsi mala. Recitation of the Hanuman Chalisa (one or 11 times), Sundara Kanda, or the Bajrang Baan follows. Boondi laddoo, gud-chana, and fresh red flowers are offered. Lighting a chameli oil diya is especially traditional.</p>",
    ethics: "<p><strong>Do:</strong> Apply sindoor mixed with chameli oil to the murti; recite Chalisa with bhava; donate red cloth on Tuesdays.</p><p><strong>Don't:</strong> Approach Hanuman after consuming non-vegetarian food or alcohol; quarrel after the puja; perform shringar puja for women devotees on the murti's body (offer at the feet instead).</p>",
    benefits: "Bestows courage, removes fear and depression, neutralises Mangal Dosh, weakens Shani's malefic influence, supports recovery from health crises.",
    durationMinutes: 45,
    estimatedCost: "₹1,000 – ₹3,500",
    difficulty: "simple",
    requirements: [
      { item: "Hanuman murti / photo", qty: "1" },
      { item: "Sindoor + chameli (jasmine) oil", qty: "small bowl mix" },
      { item: "Red flowers, tulsi mala", qty: "1 mala each" },
      { item: "Boondi laddoo, gud-chana", qty: "as offering" },
      { item: "Chameli oil diya", qty: "1" },
      { item: "Hanuman Chalisa book", qty: "1" },
    ],
    faq: [
      { q: "Why sindoor mixed with chameli oil?", a: "A puranic episode describes Hanuman applying sindoor over his entire body when he learned that Sita applied a tilak for Rama's longevity. Chameli oil is his beloved medium." },
      { q: "Can Hanuman Chalisa be recited daily?", a: "Yes — daily recitation is one of the most popular spiritual practices in modern Hindu households." },
      { q: "Is Hanuman puja allowed for women?", a: "Absolutely. Women devotees may offer everything — only physical anointing of the murti's body is traditionally avoided; offering at the feet is the norm." },
      { q: "Which day is Hanuman Jayanti?", a: "Chaitra Purnima (Mar-Apr) marks his birth — see our muhurat dates below." },
    ],
    muhuratRules: [
      { type: "weekday", weekday: 2, label: "Tuesday (Hanuman day)", limit: 12 },
      { type: "weekday", weekday: 6, label: "Saturday", limit: 12 },
      { type: "festival", festival: "hanuman-jayanti", label: "Hanuman Jayanti" },
    ],
    metaTitle: "Hanuman Puja — Chalisa, Vidhi, Mangal Dosh Remedy",
    metaDescription: "Hanuman puja vidhi at home, when to recite Hanuman Chalisa, samagri checklist and 2026 muhurat including Hanuman Jayanti and Tuesdays.",
    bookingShopUrl: "/spiritual-essentials",
    bookingShopLabel: "Shop Hanuman Puja Items",
  },
  {
    slug: "saraswati-puja",
    name: "Saraswati Puja",
    deity: "Goddess Saraswati",
    category: "deity",
    shortDescription: "Worship of the goddess of knowledge, music, and arts — performed on Vasant Panchami and during student examinations.",
    whyPerformed: "<p>Saraswati is the goddess of vidya — knowledge, learning, music, and the arts. Students worship her before exams; musicians, writers, and artists invoke her at the start of any creative work. Vasant Panchami (the fifth day of Shukla Paksha in Magha) is her primary festival.</p>",
    storyMyth: "<p>The Saraswati Stotra describes the goddess as the consort of Brahma — the cosmic creator — and the source of language itself. The river Saraswati, mentioned in the Rig Veda as the holiest of waters, was named after her.</p>",
    howCelebrated: "<p>A white-clad Saraswati murti is installed on a yellow cloth (yellow is her colour). Books, instruments, and pens are placed at her feet to be blessed. Yellow flowers, white sandalwood paste, kheer, and pure white sweets are offered. Children's first writing (akshara abhyasa) is often performed on this day. The Saraswati Vandana mantra is chanted.</p>",
    ethics: "<p><strong>Do:</strong> Wear yellow or white; place all study materials at the goddess's feet; refrain from studying after sunset on the puja day (rest the mind).</p><p><strong>Don't:</strong> Touch books with feet on this day; consume tamasic food; tear or discard old textbooks before the puja.</p>",
    benefits: "Sharpens intellect, supports academic success, blesses creative work, removes obstacles in learning a new skill or language.",
    durationMinutes: 45,
    estimatedCost: "₹1,000 – ₹3,500",
    difficulty: "simple",
    requirements: [
      { item: "Saraswati murti / photo", qty: "1" },
      { item: "Yellow cloth, yellow flowers", qty: "1 piece + 1 mala" },
      { item: "White sandalwood paste", qty: "small bowl" },
      { item: "Books, pens to be blessed", qty: "as available" },
      { item: "Kheer / white sweets (peda)", qty: "as offering" },
      { item: "Veena or musical instrument (symbolic)", qty: "1 if available" },
    ],
    faq: [
      { q: "What is akshara abhyasa?", a: "The traditional first writing for a child, traced through rice or sandalwood paste, on Vasant Panchami." },
      { q: "Can the puja be done daily?", a: "Yes — a brief light + Saraswati Vandana before any study session is a beautiful daily practice." },
      { q: "Why yellow?", a: "Yellow symbolises mustard fields in bloom and the dawn of spring (Vasant) — the season of fresh learning." },
      { q: "Is it only for students?", a: "No — it is for anyone whose work involves the mind: writers, musicians, teachers, lawyers, designers, programmers." },
    ],
    muhuratRules: [
      { type: "festival", festival: "vasant-panchami", label: "Vasant Panchami" },
      { type: "weekday", weekday: 4, label: "Thursday (Guru day)", limit: 8 },
    ],
    metaTitle: "Saraswati Puja — Vasant Panchami Vidhi, Muhurat 2026",
    metaDescription: "Complete Saraswati puja vidhi for Vasant Panchami at home, akshara abhyasa for kids, samagri checklist and 2026 muhurat dates.",
    bookingShopUrl: "/spiritual-essentials",
    bookingShopLabel: "Shop Saraswati Puja Items",
  },
  {
    slug: "pitra-paksha-shradh",
    name: "Pitra Paksha Shradh",
    deity: "Departed ancestors (pitru)",
    category: "occasion",
    shortDescription: "Annual 16-day ritual to honour departed ancestors, performed during the dark fortnight of Bhadrapada-Ashwin (mid-September to mid-October).",
    whyPerformed: "<p>Hindu tradition holds that during Pitra Paksha, the souls of departed ancestors descend to earth and accept offerings (tarpan, pind daan) from their descendants. Performing shradh during these 16 days liberates the ancestors from any lingering attachments and brings peace to the family.</p>",
    storyMyth: "<p>The Mahabharata narrates how Karna, after death, refused to eat heavenly food because he had never offered any to his ancestors during life. Yamaraja granted him 16 days to return to earth and perform shradh — establishing the tradition of Pitra Paksha.</p>",
    howCelebrated: "<p>The eldest male of the family (or any descendant in the absence of one) performs shradh on the tithi of the ancestor's death (or on Sarva Pitru Amavasya for all ancestors). It includes tarpan (water + sesame seed offering), pind daan (rice ball offering), feeding brahmins, cows, crows, and dogs (the panchabali), and feeding poor or chosen guests.</p>",
    ethics: "<p><strong>Do:</strong> Wear white or unstitched cloth; cook satvik food without onion-garlic; offer to crows first (believed to be the ancestor's messenger).</p><p><strong>Don't:</strong> Begin new ventures, weddings, or celebrations during these 16 days; cut hair or buy new clothes; consume meat or alcohol.</p>",
    benefits: "Liberates ancestors from karmic ties, brings family peace, removes Pitra Dosh (ancestor affliction in the kundli), restores prosperity blocked by ancestral debts.",
    durationMinutes: 90,
    estimatedCost: "₹2,500 – ₹11,000",
    difficulty: "moderate",
    requirements: [
      { item: "Black sesame seeds, kush grass", qty: "small quantities" },
      { item: "Cooked rice, urad dal balls (pinda)", qty: "as per ancestors honoured" },
      { item: "Banana leaves for serving", qty: "5+ leaves" },
      { item: "White cloth (unstitched dhoti)", qty: "1 for yajaman" },
      { item: "Cow ghee, honey, water", qty: "for tarpan" },
      { item: "Brahmin bhojan supplies", qty: "for at least 5 brahmins" },
    ],
    faq: [
      { q: "Which day for which ancestor?", a: "Shradh is performed on the lunar tithi of the ancestor's death (e.g. ashtami for someone who passed on ashtami)." },
      { q: "What is Sarva Pitru Amavasya?", a: "The Amavasya at the end of Pitra Paksha — the universal day for all forgotten or untraceable ancestors." },
      { q: "Why crows first?", a: "Crows are considered messengers of Yamaraja — feeding them is symbolically feeding the pitrus directly." },
      { q: "Can women perform shradh?", a: "Traditionally a male descendant performs it, but in the absence of one a daughter, daughter-in-law, or wife may perform it — modern dharmashastra interpreters increasingly support this." },
    ],
    muhuratRules: [],
    metaTitle: "Pitra Paksha Shradh — Vidhi, 2026 Tithi Calendar | Vedic Tatva",
    metaDescription: "Complete Pitra Paksha vidhi, daily tithi for shradh in 2026, panchabali offering guide, what to do and avoid during these 16 sacred days.",
    bookingShopUrl: "/pind-daan-gaya",
    bookingShopLabel: "Book Pind Daan in Gaya / Kashi",
  },
  {
    slug: "maha-mrityunjaya-jaap",
    name: "Maha Mrityunjaya Jaap",
    deity: "Lord Shiva (Mrityunjaya form)",
    category: "remedial",
    shortDescription: "Powerful chanting of the Maha Mrityunjaya mantra — 1.25 lakh repetitions — for healing serious illness, longevity, and protection from untimely death.",
    whyPerformed: "<p>The Maha Mrityunjaya mantra (Tryambakam Yajamahe...) is regarded as the most powerful Vedic mantra for healing, longevity, and overcoming the fear of death. It is performed for a family member battling chronic or serious illness, recovering from accidents, or to support someone in old age.</p>",
    storyMyth: "<p>The mantra was first revealed by Sage Markandeya, who was destined to die at sixteen. By chanting it with absolute devotion, he was saved from Yamaraja and granted the boon of eternal youth (chiranjivi). The mantra appears in the Rig Veda's seventh mandala and the Yajurveda.</p>",
    howCelebrated: "<p>The mantra is recited 1.25 lakh (125,000) times by trained pandits — usually 11 pandits across 3-5 days. A Shiva lingam is established with abhishek using sacred substances, bel patra, white flowers, and sandalwood. The patient (or yajaman on their behalf) sits facing east during a portion of the jaap. The puja concludes with a havan offering ghee, sesame, and herbs.</p>",
    ethics: "<p><strong>Do:</strong> Choose pandits trained in correct Vedic pronunciation; have the patient (if possible) wear white; observe a partial fast on the puja day.</p><p><strong>Don't:</strong> Mispronounce the mantra (counterproductive); break the mantra count midway; consume tamasic food during the jaap.</p>",
    benefits: "Supports recovery from serious illness, removes fear of death, strengthens the patient's prana, blesses the household with longevity.",
    durationMinutes: 360,
    estimatedCost: "₹15,000 – ₹51,000",
    difficulty: "elaborate",
    requirements: [
      { item: "Shiva lingam", qty: "1" },
      { item: "Bel patra", qty: "108 fresh leaves daily" },
      { item: "Gangajal, raw milk", qty: "1L each" },
      { item: "White flowers, sandalwood paste", qty: "fresh daily" },
      { item: "Havan kund + samidha", qty: "1 + bundle" },
      { item: "Black sesame, ghee", qty: "small bowls" },
    ],
    faq: [
      { q: "Can I chant Maha Mrityunjaya at home?", a: "Yes — daily 11 or 108 recitations are highly auspicious. The 1.25 lakh count requires trained pandits." },
      { q: "Will it cure a terminal illness?", a: "The puja supports the patient's energy and the family's strength; it is best understood as a complement to — not replacement for — medical treatment." },
      { q: "What is the right time of day?", a: "Brahma muhurat (4-6 AM) is most powerful, followed by Pradosh kaal at sunset." },
      { q: "Can I do it for someone else?", a: "Yes — the puja is most often performed by family members on behalf of a patient who cannot perform it themselves." },
    ],
    muhuratRules: [
      { type: "weekday", weekday: 1, label: "Monday (Shiva day)", limit: 12 },
      { type: "festival", festival: "maha-shivratri", label: "Maha Shivratri" },
      { type: "pradosh", label: "Pradosh Vrat", limit: 8 },
    ],
    metaTitle: "Maha Mrityunjaya Jaap — Healing Puja, Vidhi, Muhurat 2026",
    metaDescription: "Sacred Maha Mrityunjaya Jaap for healing, the mantra and its meaning, full vidhi with 1.25 lakh count, and 2026 muhurat dates.",
    bookingShopUrl: "/online-puja-booking",
    bookingShopLabel: "Book Maha Mrityunjaya Jaap Pandit",
  },
];

export async function seedPujaLibrary(): Promise<{ inserted: number; skipped: number }> {
  let inserted = 0;
  let skipped = 0;
  for (const seed of PUJA_SEEDS) {
    const existing = await db.select({ id: pujaTypes.id }).from(pujaTypes).where(eq(pujaTypes.slug, seed.slug));
    if (existing.length) {
      skipped += 1;
      continue;
    }
    await db.insert(pujaTypes).values({
      slug: seed.slug,
      name: seed.name,
      deity: seed.deity,
      category: seed.category,
      shortDescription: seed.shortDescription,
      whyPerformed: seed.whyPerformed,
      storyMyth: seed.storyMyth,
      howCelebrated: seed.howCelebrated,
      ethics: seed.ethics,
      benefits: seed.benefits,
      durationMinutes: seed.durationMinutes,
      estimatedCost: seed.estimatedCost,
      difficulty: seed.difficulty,
      requirements: seed.requirements as any,
      faq: seed.faq as any,
      muhuratRules: seed.muhuratRules as any,
      metaTitle: seed.metaTitle,
      metaDescription: seed.metaDescription,
      bookingShopUrl: seed.bookingShopUrl,
      bookingShopLabel: seed.bookingShopLabel,
      isPublished: true,
      displayOrder: 0,
    });
    inserted += 1;
  }
  if (inserted) console.log(`[seed:puja] inserted ${inserted}, skipped ${skipped}`);
  return { inserted, skipped };
}

// ============================================================
// Q&A Seed — 100+ entries across major puja & dharma topics
// ============================================================
interface QaSeed {
  slug: string;
  title: string;
  body?: string;
  category: string;
  tags?: string[];
  pujaSlug?: string;
  answer: string;
  isFeatured?: boolean;
}

const QA_SEEDS: QaSeed[] = [
  // ===== Daily Puja Practice =====
  { slug: "best-time-for-morning-puja", title: "What is the best time for morning puja at home?", category: "rituals", tags: ["morning", "daily-puja"], answer: "The most auspicious window is Brahma Muhurat — roughly 90 to 60 minutes before sunrise (4:00–5:30 AM in most Indian cities). The mind is freshest and the atmosphere is satvik. If that is not feasible, the period between sunrise and 8:00 AM is the next best window.", isFeatured: true },
  { slug: "should-i-bathe-before-puja", title: "Is bathing before puja absolutely necessary?", category: "rituals", answer: "Tradition strongly recommends a fresh bath before puja as it shifts the body and mind into a satvik state. If you are unwell or in a situation where a full bath is impossible, washing your hands, feet, and face with clean water and changing into clean clothes is an acceptable substitute." },
  { slug: "can-women-do-puja-during-periods", title: "Can women perform puja during their menstrual cycle?", category: "rituals", answer: "Traditional households restrict full puja participation during menstruation, but modern dharmashastra interpreters note that the goddess herself is honoured during her cycle (e.g. at Kamakhya). Mental japa, reading scripture, and silent prayer are universally accepted; physical handling of murtis is the only typical restriction." },
  { slug: "which-direction-to-face-during-puja", title: "Which direction should I face during puja?", category: "rituals", answer: "East is the most auspicious direction for daily puja (sunrise = new energy). North is the direction of wealth and is preferred for Lakshmi puja. The murti faces the yajaman, so place your altar accordingly. Avoid facing south (associated with ancestors and Yama)." },
  { slug: "how-many-diyas-to-light", title: "How many diyas should I light during puja?", category: "rituals", answer: "A single ghee diya is sufficient for daily worship. For festivals: 5 diyas symbolise the panchabhuta (5 elements), 11 represent Rudra, 21 are auspicious for Lakshmi, and 108 are reserved for major occasions. Always use ghee for the main diya — oil diyas are secondary." },
  { slug: "can-i-light-incense-at-night", title: "Is it okay to light incense or do puja at night?", category: "rituals", answer: "Yes — Sandhya (sunset) puja is in fact one of the three traditional puja times (sunrise, noon, sunset). Avoid heavy puja after 9 PM as it disturbs household sleep cycles, but a brief evening aarti and incense are encouraged." },
  { slug: "what-is-shodashopachara", title: "What does shodashopachara puja mean?", category: "rituals", answer: "Shodashopachara is the formal 16-step worship: avahanam (invocation), asana (seat), padyam (water for feet), arghyam (water for hands), achamana (sip), snana (bath), vastra (cloth), yajnopavita (sacred thread), gandha (sandalwood), pushpa (flower), dhupa (incense), deepa (lamp), naivedya (food), tambula (betel), pradakshina (circumambulation), and namaskara (prostration)." },
  { slug: "do-i-need-a-pandit-for-home-puja", title: "Do I need a pandit for everyday puja at home?", category: "rituals", answer: "No. Daily home puja is a personal act of devotion — light a diya, offer flowers, recite a mantra, take prasad. A pandit is needed for shastrokta vidhi pujas (Satyanarayan, Rudrabhishek, Griha Pravesh) where Vedic mantras and procedures must be followed precisely." },

  // ===== Mantras =====
  { slug: "how-many-times-chant-mantra", title: "How many times should I chant a mantra during japa?", category: "rituals", answer: "108 is the traditional count, completed using a 108-bead mala. For specific siddhi: 1,008 (purascharana), 10,008, or 1.25 lakh (sava lakh) for major mantras. Daily practice is best — 1 round of 108 every morning is more powerful than 1,008 once a year." },
  { slug: "wrong-mantra-pronunciation", title: "Will my mantra not work if pronunciation is wrong?", category: "rituals", answer: "Vedic tradition emphasises correct pronunciation, but bhakti (devotion) is also said to override technical errors. Listen to a trained reciter (audio or pandit), chant slowly with attention, and your pronunciation will refine over weeks. The intent matters as much as the syllables." },
  { slug: "can-i-chant-mantras-mentally", title: "Can I chant mantras mentally without speaking aloud?", category: "rituals", answer: "Yes — manasik japa (mental chanting) is considered the highest form. Vachika (loud) japa is for beginners, upamshu (whisper) for intermediate, and manasik for advanced practitioners. Mental japa can be done anywhere — while commuting, walking, even at work." },
  { slug: "best-mantra-for-beginners", title: "Which mantra should a complete beginner start with?", category: "rituals", answer: "The Gayatri Mantra is the universal Vedic mantra suitable for all (after upanayana for traditionalists, but widely accepted today). 'Om Namah Shivaya' for Shiva devotees, 'Om Namo Narayanaya' for Vishnu devotees, and 'Om Gan Ganapataye Namah' for Ganesha devotees are excellent starters." },

  // ===== Fasting & Vrat =====
  { slug: "rules-of-ekadashi-vrat", title: "What are the rules of Ekadashi vrat?", category: "festivals", tags: ["ekadashi", "fasting"], answer: "Avoid all grains and pulses (most importantly rice) on Ekadashi day from sunrise to next-day sunrise. Permitted: fruits, milk, water, and select sattvik foods like sabudana, sweet potato, kuttu (buckwheat), and singhada (water chestnut) flour. Break the fast at the Dwadashi paran muhurat. The vrat is dedicated to Lord Vishnu." },
  { slug: "can-i-drink-water-during-vrat", title: "Can I drink water during a Hindu vrat?", category: "festivals", answer: "Most vrats permit water freely (sajal vrat). Nirjala (waterless) vrats are reserved for specific occasions — Nirjala Ekadashi, Karwa Chauth (some traditions), and certain advanced sadhakas. For daily vrats, water and milk are essential to maintain health." },
  { slug: "karwa-chauth-rules", title: "What are the rules of Karwa Chauth vrat?", category: "festivals", tags: ["karwa-chauth"], answer: "Married women observe a nirjala fast from sunrise until moonrise — no food or water. Sargi (a pre-dawn meal from the mother-in-law) sustains the day. The vrat ends after sighting the moon through a sieve and offering arghya. The karwa (clay pot) and a Karwa Mata picture are central. Recently widowed women do not observe it for the first year." },
  { slug: "navratri-fasting-rules", title: "What can I eat during Navratri fasting?", category: "festivals", tags: ["navratri"], answer: "Permitted: kuttu (buckwheat), singhada (water chestnut) flour, sabudana, sama rice (barnyard millet), potatoes, sweet potatoes, milk, curd, paneer, fruits, dry fruits, sendha namak (rock salt). Avoid: regular grains (wheat, rice), pulses, onion, garlic, regular salt, and all non-veg." },
  { slug: "monday-vrat-benefits", title: "What are the benefits of observing Monday vrat?", category: "rituals", answer: "Monday is dedicated to Lord Shiva. The vrat is observed for 16 consecutive Mondays (Solah Somvar) for marital bliss, child-bearing, recovery from illness, and Shiva's grace. Eat once a day, white food only (kheer, fruits, milk), and visit a Shiva temple if possible." },
  { slug: "tuesday-vrat-mangal", title: "Why is Tuesday vrat done for Mangal Dosha?", category: "festivals", answer: "Tuesday is ruled by Mars (Mangal). Observing Tuesday vrat with Hanuman Chalisa recitation, red flower offering, and gud-chana prasad is the classical remedy for Mangal Dosh in the kundli, anger issues, and conflicts in marriage." },

  // ===== Festivals & Tithis =====
  { slug: "what-is-tithi", title: "What is a tithi and why is it important?", category: "general", tags: ["panchang"], answer: "Tithi is one of the five elements of the Hindu panchang. There are 30 tithis in a lunar month (15 in Shukla Paksha + 15 in Krishna Paksha), each lasting roughly 19-26 hours. Tithis determine festival dates, vrat days, and muhurats — Hindu life is organised by lunar tithi rather than the Gregorian calendar." },
  { slug: "diwali-without-onion-garlic", title: "Should we cook without onion-garlic on Diwali?", category: "festivals", answer: "Yes, traditionally. The puja day demands satvik food — onion and garlic are tamasic and dull the mind. The next day (Govardhan / Annakut) sees more variety, but the Diwali Lakshmi Puja day itself is best kept satvik — kheer, halwa, puri, paneer dishes are ideal." },
  { slug: "why-no-puja-during-rahu-kaal", title: "Why should puja be avoided during Rahu Kaal?", category: "general", answer: "Rahu Kaal is the 90-minute daily window ruled by Rahu (the shadow planet) — its energy is considered scattered and inauspicious. New ventures, marriages, and major puja arambh (start) are avoided. Daily puja and ongoing recitation can continue. Rahu Kaal timing varies by day (e.g. 7:30-9:00 AM Mondays in most cities)." },
  { slug: "why-no-shradh-on-purnima", title: "Why is shradh not done on Purnima?", category: "festivals", answer: "Purnima (full moon) is associated with deity worship and joyous occasions, not pitru karma. Shradh follows the lunar tithi of the ancestor's death, and Purnima-tithi shradh is performed only during Pitra Paksha for ancestors who passed on a Purnima." },
  { slug: "amavasya-meaning", title: "What is the spiritual significance of Amavasya?", category: "general", answer: "Amavasya (new moon) is when the moon is invisible — symbolising introspection, ancestor worship, and tantric sadhana. Lakshmi Puja on Diwali Amavasya, Mauni Amavasya (silence), and Kartik Amavasya are major observances. Daily Amavasya is a good day for pitru tarpan and donations." },
  { slug: "shiva-on-monday", title: "Why is Monday associated with Lord Shiva?", category: "general", answer: "The moon (Chandra) is Monday's ruling planet. As Shiva wears the crescent moon (Chandrashekhar) on his head, the moon's day became Shiva's day. Devotees fast, visit Shiva temples, perform abhishek, and chant 'Om Namah Shivaya' especially on Mondays." },
  { slug: "lakshmi-on-friday", title: "Why is Friday Lakshmi's day?", category: "general", answer: "Friday is ruled by Shukra (Venus) — the planet of wealth, beauty, and prosperity. As Lakshmi embodies these qualities, Friday became her day. Devotees perform Sri Sukta recitation, offer kheer and white flowers, and many businesses pray for prosperity on Fridays." },
  { slug: "what-is-pradosh", title: "What is Pradosh Vrat?", category: "festivals", answer: "Pradosh is the 13th tithi (Trayodashi) of every lunar fortnight. Pradosh kaal is the 90 minutes around sunset — Shiva's most beloved time. Devotees fast on Pradosh days, perform Shiva abhishek at sunset, and recite Shiva Tandava. Saturday Pradosh (Shani Pradosh) is especially powerful." },

  // ===== Astrology & Doshas =====
  { slug: "what-is-mangal-dosh", title: "What is Mangal Dosh and is it really a problem?", category: "astrology", tags: ["dosh"], answer: "Mangal Dosh occurs when Mars is positioned in the 1st, 4th, 7th, 8th, or 12th house of the natal chart. It is traditionally said to delay marriage or create conflict. However, modern Vedic astrologers note that many cancellations exist (Mars in own sign, age 28+, partner with same dosh) — verify with a competent astrologer rather than panic." },
  { slug: "what-is-kaal-sarp-dosh", title: "What is Kaal Sarp Dosh?", category: "astrology", tags: ["dosh"], pujaSlug: "kaal-sarp-dosh-puja", answer: "Kaal Sarp Dosh occurs when all seven planets are positioned between Rahu and Ketu in the natal chart. It is associated with delays in career and marriage, frequent obstacles, and sudden setbacks. The classical remedy is the Kaal Sarp Shanti Puja at Trimbakeshwar (Nashik) or Kalahasti." },
  { slug: "what-is-pitra-dosh", title: "What is Pitra Dosh and how do I know I have it?", category: "astrology", tags: ["dosh"], pujaSlug: "pitra-paksha-shradh", answer: "Pitra Dosh appears when the Sun, Rahu, or Ketu afflict the 9th house in the natal chart, indicating unfulfilled karma towards ancestors. Symptoms: family discord, recurring health issues, financial blocks despite hard work. Remedy: Pitra Paksha shradh in Gaya, Kashi, or Haridwar; daily tarpan; feeding the underprivileged." },
  { slug: "what-is-sade-sati", title: "What is Saturn's Sade Sati?", category: "astrology", answer: "Sade Sati is the seven-and-a-half-year period when Saturn (Shani) transits the 12th, 1st, and 2nd houses from your moon sign. It tests one's character through challenges in relationships, career, and finance. Remedies: Hanuman Chalisa daily, Shani temple visits on Saturdays, donating sesame oil and black urad dal." },
  { slug: "best-day-for-rahu-shanti", title: "Which day is best for Rahu remedies?", category: "astrology", answer: "Saturday is the best day for Rahu (and Shani) remedies. Wear blue or black, donate items associated with Rahu (urad dal, mustard oil, black blanket), recite the Rahu beej mantra ('Om Bhraam Bhreem Bhraum Sah Rahave Namah') 18 times, and visit a temple of Bhairava or Hanuman." },

  // ===== Don'ts in Puja =====
  { slug: "why-not-tulsi-on-ganesh", title: "Why is tulsi never offered to Lord Ganesha?", category: "rituals", pujaSlug: "ganesh-puja", answer: "A puranic story narrates that Tulsi (in human form) once approached Lord Ganesha for marriage. He politely declined as he was a brahmachari. Offended, both exchanged minor curses — Tulsi was destined to marry Lord Vishnu (Tulsi Vivah), and Ganesha would never accept tulsi leaves. The tradition is honoured to this day." },
  { slug: "why-not-ketaki-on-shiva", title: "Why is the ketaki flower forbidden on Shiva?", category: "rituals", pujaSlug: "rudrabhishek-puja", answer: "When Brahma and Vishnu argued over supremacy, a Shiva-lingam of fire appeared. Both went to find its ends. Brahma falsely claimed he had reached the top, with the ketaki flower as a witness. Shiva discovered the lie and cursed both: Brahma to never receive worship, and the ketaki flower to never be offered to him." },
  { slug: "can-i-give-flowers-to-deity-after-smelling", title: "Can I offer flowers I have smelled?", category: "rituals", answer: "No. Flowers offered to deities should be untouched by smell, taste, or wear. The fragrance is considered an offering meant for the deity first. Pluck flowers gently in the morning and place directly in the puja basket without sniffing." },
  { slug: "broken-murti-disposal", title: "What should I do with a broken or chipped murti?", category: "rituals", answer: "A broken murti should not be worshipped — its energy is considered disturbed. Place it in flowing water (river, sea) with respect, or at the base of a peepal tree, or hand it to a temple for proper visarjan. Replace with a new murti only after the formal pran-pratishtha." },
  { slug: "where-to-keep-puja-room", title: "What is the ideal location for a home temple?", category: "rituals", answer: "Vastu places the puja room in the north-east (ishan kona) of the home, with the deity facing west or east (worshippers face north or east). Avoid bedrooms, bathrooms, under stairs, and below beams. The room should be clean, well-lit, and slightly elevated from the floor." },
  { slug: "old-photos-of-gods", title: "What should I do with old or torn pictures of deities?", category: "rituals", answer: "Old or torn photos should be wrapped in clean white cloth and immersed in flowing water, or burned in a controlled puja fire. Never throw them in the trash. Modern alternative: hand them over at temple visarjan kunds during festivals." },
  { slug: "leather-in-puja-room", title: "Can I wear leather items in the puja room?", category: "rituals", answer: "Leather items (belts, wallets, shoes) are considered impure for the puja space as they come from animals. Remove them before entering the puja room. Modern leather alternatives (rexine, fabric) are acceptable." },
  { slug: "menstruation-puja-temple", title: "Should women avoid temples during periods?", category: "rituals", answer: "This is a cultural debate. Traditional rules restricted entry; modern temples increasingly welcome all women. Spiritually, the cycle is a natural rhythm, not impurity. Listen to your own comfort and your family's tradition. Mental prayer and silent worship are universally permitted." },

  // ===== Marriage & Family =====
  { slug: "kundli-matching-importance", title: "How important is kundli matching for marriage?", category: "astrology", answer: "Traditional matchmaking checks 36 gunas (8 categories: varna, vashya, tara, yoni, graha-maitri, gana, bhakoot, nadi). 18+ is considered acceptable, 24+ excellent. However, modern astrologers stress that kundli matching is one factor — character, family compatibility, and personal compatibility matter equally. Severe doshas (Mangal, Nadi) deserve serious attention; minor mismatches are workable." },
  { slug: "wedding-muhurat-process", title: "How is a wedding muhurat selected?", category: "astrology", answer: "A pandit considers both partners' kundlis, the lagan (rising sign), avoids inauspicious months (Pausha, Chaitra, Shravan), Adhik Maas (intercalary lunar month), and identifies a date during Devshayani-Devuthani window when Vishnu is awake (mid-July to mid-November is sleeping period for Vishnu). Specific subh muhurats within the day (like brahma muhurat, abhijit muhurat) are then identified." },
  { slug: "sutak-after-death", title: "What is the sutak period after a death in family?", category: "general", answer: "Sutak (impurity period) traditionally lasts 13 days for immediate family. During this time, no puja, festival, or auspicious activity is performed. The 13th day shradh (terhvi) marks the end. The first year post-death, the family also avoids weddings, griha pravesh, and other celebrations." },
  { slug: "why-mundan-is-done", title: "What is the significance of mundan ceremony?", category: "general", answer: "Mundan is the first head-shaving samskara, performed between ages 1-3. It removes the hair carried from past life karmas and welcomes fresh energy. Done at major temples (Tirupati, Vaishno Devi, Haridwar) or at home. The hair is offered to a flowing river or buried at a sacred spot." },
  { slug: "annaprashan-meaning", title: "What is Annaprashan (first solid food) ceremony?", category: "general", answer: "Annaprashan is the rice-feeding ceremony for a baby, performed at 6-8 months. The maternal uncle traditionally feeds the first morsel of kheer or sweet rice. Symbolically welcomes the baby into the family of solid eaters. Auspicious tithis: Akshaya Tritiya, Vasant Panchami, Janmashtami, and the baby's birth nakshatra." },

  // ===== Death & Ancestor Rituals =====
  { slug: "what-happens-after-death-hindu", title: "What does Hindu tradition say happens after death?", category: "general", answer: "The atma leaves the body (called pran tyag) and journeys for 10-13 days through Yamaloka. The 13-day shradh helps the soul transition. Based on accumulated karma, the soul takes rebirth (punar janma) — better life for good karma, lower for bad. Liberation (moksha) ends this cycle entirely." },
  { slug: "asthi-visarjan", title: "What is asthi visarjan and where is it done?", category: "general", answer: "After cremation, the bone fragments (asthi) are collected and immersed in a sacred river — most commonly the Ganga at Haridwar, Varanasi, or Prayagraj. Tradition holds that the soul finds peace when its physical remnants merge with sacred water. Pind Daan at Gaya is recommended for liberation of the soul (moksha)." },
  { slug: "pind-daan-purpose", title: "What is the purpose of Pind Daan?", category: "general", pujaSlug: "pitra-paksha-shradh", answer: "Pind Daan is the offering of rice balls (pinda) symbolising sustenance for the departed soul. It is most powerful at Gaya (where Lord Vishnu placed his foot — Vishnupada), Varanasi, and Haridwar. Performed once during Pitra Paksha or anytime by descendants seeking ancestor moksha." },
  { slug: "tarpan-meaning", title: "What is tarpan and how often should it be done?", category: "rituals", answer: "Tarpan is the offering of water mixed with sesame seeds and kush grass to ancestors. Done daily by devout brahmins; once a month on Amavasya by householders; with full elaboration during Pitra Paksha. Three generations of paternal and maternal ancestors are typically honoured." },

  // ===== Spiritual Lifestyle =====
  { slug: "rudraksha-which-mukhi", title: "Which mukhi rudraksha is right for me?", category: "general", answer: "5-mukhi (Panchmukhi) is the safest universal rudraksha — wearable by anyone. Specific mukhis target specific needs: 1-mukhi for spiritual seekers, 3-mukhi for confidence, 7-mukhi for wealth (Lakshmi), 11-mukhi for Hanuman bhakti, 14-mukhi for higher consciousness. Consult a knowledgeable jeweller or astrologer; avoid buying the rare ones from random sellers (often fake)." },
  { slug: "tulsi-care-significance", title: "How should I care for the tulsi plant at home?", category: "general", answer: "Place tulsi in the north-east, water in the morning (never on Sundays or Ekadashi), light a diya near it at sunset, never pluck leaves after sunset or on Sundays/Ekadashi. The plant is considered the goddess Vrinda — Vishnu's consort. A healthy tulsi at home is said to ward off negative energies and disease." },
  { slug: "panchamrit-recipe", title: "How is panchamrit prepared?", category: "rituals", answer: "Mix in equal parts (about 1 tablespoon each per family member): cow milk, plain yogurt, ghee, honey, and sugar. Some traditions add tulsi leaves and a pinch of cardamom. The five ingredients symbolise the panchabhuta and the qualities of the divine. Offer to the deity, then distribute as prasad." },
  { slug: "vastu-tips-pooja-room", title: "What are essential vastu tips for the home temple?", category: "general", answer: "Locate in the north-east; murti faces east or west; never below stairs, in bedrooms, or above bathrooms; raise the altar slightly off the ground; keep the room clean and clutter-free; avoid placing ancestor photos with deities; never keep broken or chipped murtis; light a diya at least once daily." },
  { slug: "japa-mala-rules", title: "What are the rules for using a japa mala?", category: "rituals", answer: "Use the right hand (left is for impurity); avoid the index finger (rahu); count with thumb against middle and ring fingers; never cross the meru (head bead) — turn the mala instead; keep the mala in a clean cloth pouch; do not touch the floor with it; avoid handing your mala to others — it is energised by your sadhana." },
  { slug: "panchang-elements", title: "What are the five elements of the Hindu panchang?", category: "general", answer: "Tithi (lunar day), Vara (weekday), Nakshatra (lunar mansion), Yoga (planetary alignment), Karana (half-tithi). Together they determine every muhurat. Each panchang is calculated for a specific city — the same date can have slightly different timings in Delhi vs Chennai." },
  { slug: "what-is-aarti-significance", title: "What is the significance of aarti at the end of puja?", category: "rituals", answer: "Aarti waves a lit camphor or ghee diya in clockwise circles before the deity, symbolising the offering of light (knowledge) to dispel inner darkness. The five upacharas (water, flower, incense, light, food) culminate in aarti. The collected light is then offered to devotees who pass their hands over the flame and touch their eyes — receiving the deity's grace." },
  { slug: "why-conch-blown-during-puja", title: "Why is the conch (shankh) blown during puja?", category: "rituals", answer: "The shankh's resonant Om-like sound is believed to purify the atmosphere, ward off negative energies, and announce the deity's presence. Blowing it before puja prepares the space; blowing at aarti completes the energetic cycle. The Vishnu shankh (right-turning) is most auspicious." },
  { slug: "achaman-meaning", title: "What is achaman in Hindu rituals?", category: "rituals", answer: "Achaman is the act of sipping a small spoonful of water three times before any puja, symbolising internal purification. Each sip is offered to a different deity (Keshava, Narayana, Madhava). It marks the formal start of the ritual and shifts the doer into a sankalp-ready state." },
  { slug: "what-is-aachara", title: "What is sadachar in dharmic life?", category: "general", answer: "Sadachar means right conduct — daily disciplines that purify body and mind: bathing before puja, satvik food, truthfulness, ahimsa, regular sandhya, charity, and respect for elders. The Mahabharata states 'Acharah paramo dharmah' — conduct is the highest dharma." },

  // ===== Specific Puja Questions =====
  { slug: "satyanarayan-on-which-day", title: "Which day is best for Satyanarayan Puja?", category: "puja", pujaSlug: "satyanarayan-puja", answer: "Purnima (full moon) is the most auspicious. Ekadashi, Sankashti Chaturthi, and any day marking a wish fulfilled are also popular. Avoid Krishna Paksha Chaturdashi and Amavasya. Evening (sandhya) is the traditional time of day." },
  { slug: "rudrabhishek-substances-order", title: "In what order should the 11 substances be poured during Rudrabhishek?", category: "puja", pujaSlug: "rudrabhishek-puja", answer: "Standard order: 1) Pure water, 2) Cow milk, 3) Curd, 4) Ghee, 5) Honey, 6) Sugar / sugarcane juice, 7) Coconut water, 8) Sesame oil, 9) Panchamrit, 10) Gangajal, 11) Pure water again. Each is poured slowly while chanting the Rudri Path. The lingam is wiped clean between substances." },
  { slug: "ganesh-visarjan-when", title: "When should I do Ganesh visarjan after Chaturthi?", category: "puja", pujaSlug: "ganesh-puja", answer: "1.5, 3, 5, 7, or 11 days — never even numbers, never beyond Anant Chaturdashi (the 10th day after Chaturthi). Visarjan can be done at home in a clean bucket of water (eco-clay murtis), or at a designated city visarjan ghat." },
  { slug: "lakshmi-puja-without-ganesh", title: "Can Lakshmi Puja be done without Ganesh?", category: "puja", pujaSlug: "lakshmi-puja", answer: "No — every puja begins with Ganesh worship. Place Ganesh on the right side of Lakshmi (yajaman's left). Many households also include Saraswati on Lakshmi's left, and Kuber for wealth. The order: invoke Ganesh → kalash → Navagraha → Lakshmi → Kuber → Saraswati → aarti." },
  { slug: "navratri-color-of-day", title: "What is the colour for each day of Navratri?", category: "puja", pujaSlug: "navratri-puja", answer: "Day 1 grey, Day 2 orange, Day 3 white, Day 4 red, Day 5 royal blue, Day 6 yellow, Day 7 green, Day 8 peacock green, Day 9 purple. (Order rotates each year — refer to a current panchang.) Wearing the day's colour is a popular cultural tradition; spiritually, the goddess accepts all sincere devotion regardless of colour." },
  { slug: "navagraha-which-planet-first", title: "Which planet is worshipped first in Navagraha Puja?", category: "puja", pujaSlug: "navagraha-shanti-puja", answer: "Surya (Sun) is always invoked first as the chief of the navagrahas. The order: Surya → Chandra → Mangal → Budha → Guru → Shukra → Shani → Rahu → Ketu. Each is offered its specific colour, grain, and metal yantra." },
  { slug: "pitra-paksha-which-tithi", title: "Which day during Pitra Paksha should I do shradh?", category: "puja", pujaSlug: "pitra-paksha-shradh", answer: "Perform on the lunar tithi of the ancestor's death — e.g. Ashtami if they passed on Ashtami. If exact tithi is unknown, perform on Sarva Pitru Amavasya (the last day). For unmarried ancestors: Panchami. For accident victims: Chaturdashi. Different family members can perform different ancestors' shradh on respective tithis." },
  { slug: "griha-pravesh-time", title: "What time of day is best for Griha Pravesh?", category: "puja", pujaSlug: "griha-pravesh-puja", answer: "Brahma muhurat (4-6 AM) and abhijit muhurat (around noon) are most auspicious. The first entry must be during the muhurat — even if subsequent puja takes longer. Avoid evening or night entry. Cooking the first meal happens during the puja itself." },
  { slug: "saraswati-puja-when", title: "When is Saraswati Puja celebrated?", category: "puja", pujaSlug: "saraswati-puja", answer: "Vasant Panchami — the fifth tithi of Shukla Paksha in Magha month (late January or February). It marks the arrival of spring and is the principal day for Saraswati worship. Many schools and music academies host major celebrations on this day." },
  { slug: "hanuman-chalisa-how-many-times", title: "How many times should Hanuman Chalisa be recited?", category: "puja", pujaSlug: "hanuman-puja", answer: "Daily: 1 or 11 times. For specific resolution: 21 days × 11 times = 231 recitations. For severe doshas: 100 times in one day on a Tuesday or Saturday at a Hanuman temple. The number matters less than the bhava (emotion) and consistency." },
  { slug: "maha-mrityunjaya-count", title: "Why is Maha Mrityunjaya recited 1.25 lakh times?", category: "puja", pujaSlug: "maha-mrityunjaya-jaap", answer: "1.25 lakh (sava lakh = 125,000) is the purascharana — the number required for the mantra to fully 'awaken' (siddhi). Tradition holds that this count creates a protective shield around the patient. Performed across 3-9 days by 11+ trained pandits, with daily abhishek and havan." },
  { slug: "kaal-sarp-trimbakeshwar", title: "Is Kaal Sarp Puja only valid at Trimbakeshwar?", category: "puja", pujaSlug: "kaal-sarp-dosh-puja", answer: "Trimbakeshwar (Nashik) is the most authentic kshetra — the puja is performed by specially licensed pandits there. Kalahasti (Andhra Pradesh) and Ujjain are also sanctioned locations. A puja at home with a qualified Trimbakeshwar-trained pandit is acceptable, but not as powerful as the kshetra itself." },

  // ===== Practical / Logistical =====
  { slug: "how-much-pandit-cost", title: "How much does it cost to book a pandit?", category: "general", answer: "Costs vary widely by puja, location, and pandit experience. Approximate ranges: Satyanarayan Puja ₹2,500–5,500; Rudrabhishek ₹3,500–11,000; Griha Pravesh ₹4,500–15,500; Navagraha Shanti ₹5,500–21,000; Maha Mrityunjaya Jaap (1.25 lakh) ₹15,000–51,000. Vedic Tatva pandits are pre-vetted with transparent pricing." },
  { slug: "samagri-from-where", title: "Where can I source authentic puja samagri?", category: "general", answer: "Vedic Tatva curates authentic puja samagri from trusted sources, with kits assembled by practising pandits. Local pansari shops, dharma items stores near major temples (Banaras, Mathura, Ayodhya), and online sources verified for authenticity are alternatives. Avoid roadside synthetic-camphor or low-grade dhoop." },
  { slug: "puja-kit-vs-individual", title: "Should I buy a puja kit or individual items?", category: "general", answer: "For occasional pujas: a curated puja kit ensures nothing is missed and saves time. For daily worship: individual items (good ghee, fresh flowers, quality incense) work out cheaper and let you customise. Vedic Tatva offers both options." },
  { slug: "pandit-online-vs-offline", title: "Is an online (video) puja by a pandit valid?", category: "general", answer: "Video pujas are valid for sankalp, mantra recitation, and katha — the pandit's energy and proper procedure transmit. However, abhishek, havan, and physical kalash sthapana require an in-person pandit. For brief pujas, online is convenient; for major ceremonies (Griha Pravesh, marriage), book a pandit in person." },
  { slug: "prasad-distribution-rules", title: "How should prasad be distributed?", category: "rituals", answer: "Distribute to all puja participants first, then family members, then guests, and finally outsiders. Bhojan prasad to brahmins, cows, dogs, crows (panchabali) is meritorious. Never throw leftover prasad in the trash — bury it under a tree, put it in flowing water, or feed to animals. The yajaman should receive prasad last." },
  { slug: "what-to-do-with-flowers-after", title: "What should I do with flowers after the puja?", category: "rituals", answer: "Wilted flowers should be removed daily — never left to dry on the murti. Place them in flowing water, or under a peepal/banyan tree, or in a clean compost spot. Never throw in the trash — they are nirmalya (sanctified) once offered." },
  { slug: "how-long-keep-puja-water", title: "How long can puja water (kalash water) be kept?", category: "rituals", answer: "After the puja, the kalash water becomes tirth (sanctified water). Sprinkle it around the home, on family members, on plants, and store the rest in a clean bottle for daily use as achaman or for sprinkling. It is potable for 1-3 days; longer than that, return to flowing water." },
  { slug: "puja-during-pregnancy", title: "Can I do full puja during pregnancy?", category: "rituals", answer: "Yes — pregnancy is considered an auspicious time for spiritual practice. Recite the Garbh Sanskar mantras, listen to Vishnu Sahasranama and Lalita Sahasranama, perform brief daily pujas. Avoid heavy fasting, prolonged havan smoke, and physically demanding pujas after the second trimester. Pumsavana and Simantonnayana samskaras are specifically performed during pregnancy." },

  // ===== General Dharma =====
  { slug: "what-is-sankalpa", title: "What is sankalpa and why is it important?", category: "general", answer: "Sankalpa is the formal vow taken at the start of any puja — declaring your name, gotra, location, the date by panchang, the deity, and the purpose of the puja. It anchors the karma to the doer. Without sankalpa, the puja is considered incomplete. The pandit recites the sankalpa with the yajaman holding water in their right hand, which is then poured over a betel leaf." },
  { slug: "what-is-prasad", title: "What is prasad and why must we accept it?", category: "general", answer: "Prasad means 'divine grace' — food or items offered to a deity that have absorbed the divine energy. Accepting it (with the right hand, after washing) brings the deity's blessing into one's body. Refusing prasad is considered an act of disrespect; it should be at least touched to the forehead even if not eaten in full." },
  { slug: "why-no-shoes-in-temple", title: "Why are shoes not allowed in the temple?", category: "general", answer: "Shoes carry the impurity of street dirt and are made of leather (animal product). Temples are deity dwellings — the floor is treated as sacred ground. Removing footwear is also a sign of humility before the deity. Many temples provide a designated shoe stand outside." },
  { slug: "circumambulation-direction", title: "Why do we walk clockwise around the deity?", category: "general", answer: "Pradakshina (clockwise circumambulation) keeps the deity to your right — the auspicious direction in Vedic tradition. It mirrors the cosmic motion (the sun, planets all move clockwise from a top-down perspective). Counter-clockwise is reserved for funerary rites. Standard counts: 1 for Surya, 2 for Lakshmi, 3 for Ganesha, 4 for Vishnu, 7 for Shiva." },
  { slug: "why-bow-touching-feet", title: "Why do we touch feet of elders and deities?", category: "general", answer: "Touching feet is the ultimate humility gesture — placing one's head (the highest point) at another's feet (the lowest). It is also said to receive blessings (energetic transfer) from the elder's accumulated punya. The deity's feet are touched as the receiving point of devotion." },
  { slug: "what-is-mahaprasad", title: "What is mahaprasad?", category: "general", answer: "Mahaprasad is the consecrated food specifically from major temples (e.g. Jagannath Puri, Tirupati). Tradition holds that mahaprasad should never be refused, can be eaten across caste/status barriers, and that even leftovers (uchchhishta) are sacred. Distinct from regular prasad in its scale and ritual handling." },
  { slug: "what-is-yagya", title: "What is the difference between puja, havan, and yagya?", category: "general", answer: "Puja is general worship with offerings to a deity. Havan is the act of offering ghee and herbs into a sacred fire (Agni). Yagya is a larger Vedic ceremony built around havan, with specific intent (Putrakameshti for child, Ashwamedha for empire). Every yagya includes havan; not every puja is a yagya." },
  { slug: "best-temples-india-pilgrimage", title: "Which temples should every Hindu visit at least once?", category: "general", answer: "The Char Dham (Badrinath, Dwarka, Puri, Rameshwaram), the Dvadasha Jyotirlingas (12 Shiva shrines), the 51 Shakti Peeths (Goddess shrines), and the Sapta Puri (7 holy cities: Ayodhya, Mathura, Haridwar, Kashi, Kanchi, Ujjain, Dwarka). Each represents a different aspect of dharma and a different blessing." },
  { slug: "what-is-darshan", title: "What does darshan mean in temple visits?", category: "general", answer: "Darshan literally means 'sacred sight' — receiving the deity's gaze and offering one's own. It is the central act of temple visit, considered more important than any donation or elaborate ritual. Darshan transfers the deity's grace (anugraha) directly to the devotee. A few moments of focused darshan is more meaningful than rushed transactional puja." },
  { slug: "donation-rules-puja", title: "How much should I donate to a pandit or temple?", category: "general", answer: "Dakshina (offering to pandit) is by tradition voluntary, with no fixed amount. As a guideline: 10-25% of puja cost as dakshina. For temples, donate as per capacity and intent — even 1 rupee given with bhava is sacred. Anonymous donation (gupt daan) is considered the highest form. Avoid bargaining over puja costs." },
];

export async function seedCommunityQa(): Promise<{ inserted: number; skipped: number }> {
  let inserted = 0;
  let skipped = 0;
  for (const seed of QA_SEEDS) {
    const existing = await db.select({ id: qaQuestions.id }).from(qaQuestions).where(eq(qaQuestions.slug, seed.slug));
    if (existing.length) {
      skipped += 1;
      continue;
    }
    const [q] = await db.insert(qaQuestions).values({
      slug: seed.slug,
      title: seed.title,
      body: seed.body || null,
      category: seed.category,
      tags: seed.tags || [],
      pujaSlug: seed.pujaSlug || null,
      authorName: "Vedic Tatva Editorial",
      status: "approved",
      isFeatured: !!seed.isFeatured,
      metaTitle: `${seed.title} — Vedic Tatva Q&A`,
      metaDescription: seed.answer.slice(0, 160),
    }).returning();
    if (q) {
      await db.insert(qaAnswers).values({
        questionId: q.id,
        body: seed.answer,
        authorName: "Vedic Tatva Editorial",
        authorRole: "admin",
        isAccepted: true,
        status: "approved",
      });
      inserted += 1;
    }
  }
  if (inserted) console.log(`[seed:qa] inserted ${inserted} questions+answers, skipped ${skipped}`);
  return { inserted, skipped };
}

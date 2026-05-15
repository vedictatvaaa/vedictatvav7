import { db } from "./db";
import { qaQuestions, qaAnswers } from "@shared/schema";
import { eq, sql } from "drizzle-orm";

interface QaSeed {
  slug: string;
  title: string;
  body?: string;
  category: "puja" | "rituals" | "astrology" | "festivals" | "general";
  tags?: string[];
  answer: string;
  isFeatured?: boolean;
}

const QA_SEED: QaSeed[] = [
  {
    slug: "what-direction-should-home-temple-face",
    title: "Which direction should the home temple face?",
    body: "We are setting up a small mandir in our flat and want to know the most auspicious direction.",
    category: "puja",
    tags: ["vastu", "mandir", "home temple"],
    isFeatured: true,
    answer:
      "The ideal direction for a home temple is the north-east (Ishan kona) of the house. While performing puja, the worshipper should face east or north — east invites the energy of the rising sun and is associated with growth, while north is linked with prosperity and learning. Avoid placing the mandir in the bedroom, under a staircase, or directly facing a bathroom. The deities themselves should not face directly south, and the mandir should ideally be against a solid wall (not floating). If a separate room is not possible, a clean elevated wooden shelf in the kitchen or living room works, kept above waist height and free of shoes, footwear or feet pointing toward it.",
  },
  {
    slug: "can-women-perform-puja-during-menstruation",
    title: "Can women perform puja during menstruation?",
    body: "There seems to be conflicting opinions across families.",
    category: "rituals",
    tags: ["women", "menstruation", "puja"],
    answer:
      "Tradition varies by region and family lineage. Most orthodox households ask women to step away from the mandir for the first three to four days of menstruation, treating it as a period of bodily rest rather than impurity — the deeper intent of the rule, as explained by many acharyas, is to give the body recuperation, not to imply spiritual inferiority. Mental worship (manasic puja), silent japa, listening to bhajans and reading scripture are all considered fully permissible at any time. Many modern Vedic teachers — including women acharyas — encourage women to follow what feels right for them while respecting elders' wishes at home, and to resume regular puja after a head bath on day four or five.",
  },
  {
    slug: "what-is-the-meaning-of-om",
    title: "What does the syllable Om actually mean?",
    category: "general",
    tags: ["om", "mantra", "meaning"],
    isFeatured: true,
    answer:
      "Om (also written as Aum) is considered the primordial sound — pranava — from which all creation arises. The three sounds A-U-M are said to represent creation (Brahma), preservation (Vishnu) and dissolution (Shiva), as well as the waking, dream and deep-sleep states of consciousness. The silence that follows the chant represents Turiya, the fourth and absolute state. Almost every mantra in the Vedic tradition opens with Om because it is believed to attune the speaker's mind and breath to the universal vibration before the specific prayer is offered. Even brief chanting (5-10 minutes daily) is said to settle the nervous system and improve focus.",
  },
  {
    slug: "how-many-times-should-i-chant-hanuman-chalisa",
    title: "How many times should I chant the Hanuman Chalisa daily?",
    category: "puja",
    tags: ["hanuman", "chalisa", "japa"],
    answer:
      "There is no fixed mandatory count. Most devotees recite the Hanuman Chalisa once or twice daily, ideally in the morning after a bath, and again on Tuesday and Saturday evenings — the days associated with Hanuman ji. For specific intentions (overcoming fear, removing obstacles, Shani-related concerns), some choose to recite it 7, 11, 21 or 108 times across a 40-day anushthan. The key is consistency rather than count: a relaxed, attentive single recitation is more beneficial than a hurried multiple. Sit facing east or north, light a diya and offer water or a flower if possible.",
  },
  {
    slug: "what-is-difference-between-puja-and-yagna",
    title: "What is the difference between puja and yagna?",
    category: "rituals",
    tags: ["puja", "yagna", "havan"],
    answer:
      "Puja is the personal or family-scale ritual of inviting, honouring and offering to a deity through flowers, water, lamp, incense and food (the panchopachara or shodashopachara). Yagna (also yajna or havan) involves making offerings into a consecrated fire while reciting Vedic mantras — the fire (Agni) carries the offerings to the devatas. A puja can be done daily at home in a few minutes; a yagna typically requires a properly built kund, samidha (sacred wood), ghee, samagri and at least one trained pandit. Both can be combined — many sankalpa-based rituals begin with puja and culminate in a small havan.",
  },
  {
    slug: "should-i-fast-on-ekadashi-as-a-beginner",
    title: "Should I fast on Ekadashi as a beginner?",
    category: "festivals",
    tags: ["ekadashi", "fasting", "vrat"],
    answer:
      "Ekadashi (the 11th lunar day in each fortnight) is one of the most widely observed vrats in the Vaishnava tradition. As a beginner, start with a phalahar fast — avoid grains, beans and lentils, and consume fruits, milk, nuts, sabudana, sendha namak, water and vegetables like potato or pumpkin. Strict fasters take only water (nirjala) but this should not be attempted without prior practice and good health. Break the fast the next morning after sunrise (Parana time) with a small meal. Pregnant women, children, the elderly and anyone on medication should consult their doctor and may observe a partial fast or simply do extra puja and chanting that day.",
  },
  {
    slug: "what-flowers-should-not-be-offered-to-shiva",
    title: "Which flowers should not be offered to Lord Shiva?",
    category: "puja",
    tags: ["shiva", "flowers", "offerings"],
    answer:
      "By tradition, ketaki (kewra), champa and red flowers like kanher are avoided in Shiva puja — the Shiv Purana recounts the story of ketaki being cursed for false witness during the Brahma–Vishnu dispute. Bilvapatra (bel leaves) are the most beloved offering, ideally with three intact lobes, no holes and the smooth side facing the lingam. Dhatura, aak (madar), white flowers, blue lotus and sacred ash (vibhuti) are also dear to Shiva. Avoid offering tulsi to Shiva (it is reserved for Vishnu) and avoid haldi-kumkum on the lingam itself; sandalwood paste and white flowers are preferred.",
  },
  {
    slug: "is-it-necessary-to-have-a-pandit-for-grih-pravesh",
    title: "Is a pandit necessary for griha pravesh?",
    category: "rituals",
    tags: ["griha pravesh", "pandit", "new home"],
    answer:
      "Griha pravesh involves Vastu Shanti, navagraha shanti and a small havan, which require correct Sanskrit pronunciation, sankalpa and procedural sequence — so a trained pandit is strongly recommended. A self-performed simple version is acceptable when no pandit is available: clean the home, place a pot (kalash) of water with mango leaves and a coconut at the entrance, light a diya, recite a Ganesh mantra and the Vastu Purush prayer, sprinkle gangajal in every room, and cook the first meal (usually kheer or sweet rice) on the new stove. For a permanent move, the muhurat matters — favoured months are Magh, Phalgun, Vaishakh and Jyeshtha; avoid the inauspicious months of Paush, Bhadrapada and Ashadh.",
  },
  {
    slug: "what-is-rahu-kaal-and-should-i-avoid-work-then",
    title: "What is Rahu Kaal and should I avoid all work during it?",
    category: "astrology",
    tags: ["rahu kaal", "muhurat", "panchang"],
    answer:
      "Rahu Kaal is a 90-minute window each day considered inauspicious for starting new ventures — signing contracts, beginning a journey, opening a business, conducting a marriage muhurat, or starting a new shubh karya. The window shifts daily by weekday: Monday 7:30–9:00, Tuesday 15:00–16:30, Wednesday 12:00–13:30, Thursday 13:30–15:00, Friday 10:30–12:00, Saturday 9:00–10:30, Sunday 16:30–18:00 (these are typical for sunrise around 6:00 — they shift with actual sunrise/sunset). Routine work, ongoing tasks, daily puja, eating and sleeping are all completely fine during Rahu Kaal. The restriction applies specifically to inaugurating new things.",
  },
  {
    slug: "what-is-the-significance-of-tilak",
    title: "What is the significance of applying a tilak on the forehead?",
    category: "rituals",
    tags: ["tilak", "forehead", "ajna chakra"],
    answer:
      "The tilak is applied at the spot of the ajna chakra — the third-eye energy centre between the eyebrows. Symbolically it represents inner vision, focus and the awakening of consciousness. Practically, the gentle pressure on the spot is believed to soothe the nervous system. Different sects use different tilaks: Vaishnavas wear the U-shaped urdhva pundra in white clay or sandalwood, often with a red line; Shaivites wear three horizontal lines of vibhuti (sacred ash); Shaktas often apply red kumkum. A tilak is generally applied after the morning bath, after puja, before leaving home for any auspicious occasion, and as part of welcoming guests.",
  },
  {
    slug: "can-non-hindus-perform-vedic-puja",
    title: "Can non-Hindus perform Vedic pujas at home or temples?",
    category: "general",
    tags: ["non-hindu", "puja", "inclusion"],
    answer:
      "Yes, in the vast majority of cases. Vedic philosophy emphasises bhakti (devotion) and shraddha (sincerity) over birth identity — anyone with respect for the tradition can chant mantras, perform a home puja, attend an aarti, take prasad and visit most temples. A few specific shrines (notably Jagannath Puri and the inner sanctum of Padmanabhaswamy in Trivandrum) restrict entry to those of declared Hindu faith for historical reasons. Major temples like Tirupati, Vaishno Devi, Somnath, Meenakshi and the Char Dhams welcome visitors of all faiths. Pandits regularly officiate weddings, griha pravesh and naming ceremonies for inter-faith couples and families.",
  },
  {
    slug: "what-is-the-correct-way-to-light-a-diya",
    title: "What is the correct way to light a diya during puja?",
    category: "puja",
    tags: ["diya", "deepak", "aarti"],
    answer:
      "Use pure cow ghee for the main puja diya — sesame (til) oil is the standard alternative on Saturdays and during Shani-related rituals. Use cotton wicks: a single straight wick for daily worship, a vartika (longer twisted wick) for elaborate pujas, and an akhand jyoti (continuous-burning lamp) only when you can responsibly maintain it day and night. The diya should be placed to the right of the deity from the worshipper's view, slightly elevated, and lit before the incense. Always light the diya with a separate match or another lit lamp — never directly from the gas stove. Let the flame rise upward; a downward or side-tilted flame is considered inauspicious.",
  },
  {
    slug: "why-do-we-circumambulate-clockwise",
    title: "Why is parikrama always done clockwise?",
    category: "rituals",
    tags: ["parikrama", "pradakshina", "tradition"],
    answer:
      "Pradakshina (clockwise circumambulation) keeps the deity to one's right — in Vedic tradition the right side is auspicious and represents reverence and respect. Astronomically the practice mirrors the apparent motion of the sun across the sky in the northern hemisphere, aligning the worshipper with the cosmic flow. The standard counts vary by deity: Ganesha — 1, Surya — 7, Hanuman — 3, Vishnu — 4, Shiva — half (you stop and return at the gomukhi water channel of the lingam, never crossing it), Devi — 1. Walk slowly, hands folded, mind gently focused on the deity's name or mantra.",
  },
  {
    slug: "what-foods-are-considered-sattvic",
    title: "What foods are considered sattvic and why does it matter?",
    category: "general",
    tags: ["sattvic", "diet", "ahimsa"],
    answer:
      "Sattvic foods are those that promote clarity, calmness and mental balance — fresh fruits, raw and lightly cooked vegetables (avoiding onion and garlic in strict practice), whole grains, milk, ghee, paneer, soaked nuts and seeds, lentils (in moderation), honey, jaggery, and herbal teas. They are freshly prepared, eaten in moderation, and ideally consumed within three to four hours of cooking. Tamasic foods (stale, leftover, deep-fried, alcohol, meat) and excessively rajasic foods (overly spicy, salty, stimulating) are reduced or avoided during sadhana, vrats and the days surrounding important pujas. The goal is not rigid restriction but a clean body and a settled mind for spiritual practice.",
  },
  {
    slug: "do-i-need-a-mala-for-japa",
    title: "Do I need a japa mala to chant a mantra, and which one is best?",
    category: "puja",
    tags: ["mala", "japa", "rudraksha", "tulsi"],
    answer:
      "A mala is helpful but not mandatory — japa can be counted on the fingers (using the segments of the right hand, never the index finger which is reserved for pointing). When using a mala, the standard count is 108 beads plus one Meru (summit) bead. Choose by tradition: tulsi mala for Vishnu, Krishna and Rama mantras; rudraksha (especially 5-mukhi) for Shiva, Hanuman and general mantras; sphatik (clear quartz) for Devi and Lakshmi mantras; sandalwood for peace and Saraswati. Hold the mala in the right hand, draped over the middle finger, and turn each bead with the thumb. Do not cross the Meru — when you reach it, reverse direction.",
  },
];

export async function seedQaQuestions(): Promise<{ inserted: number; backfilledAnswers: number; skipped: number }> {
  let inserted = 0;
  let backfilledAnswers = 0;
  let skipped = 0;
  for (const q of QA_SEED) {
    try {
      // Step 1: insert the question (idempotent on slug).
      const insertResult = await db
        .insert(qaQuestions)
        .values({
          slug: q.slug,
          title: q.title,
          body: q.body || null,
          category: q.category,
          tags: q.tags || [],
          authorName: "Vedic Tatva Editorial",
          status: "approved",
          isFeatured: q.isFeatured || false,
          metaTitle: `${q.title} · Vedic Tatva`,
          metaDescription: q.answer.slice(0, 158),
        })
        .onConflictDoNothing({ target: qaQuestions.slug })
        .returning({ id: qaQuestions.id });

      let questionId: number;
      let isNew = false;
      if (insertResult.length > 0) {
        questionId = insertResult[0].id;
        isNew = true;
      } else {
        // Question already existed — fetch its id for answer backfill.
        const existing = await db
          .select({ id: qaQuestions.id })
          .from(qaQuestions)
          .where(eq(qaQuestions.slug, q.slug))
          .limit(1);
        if (existing.length === 0) {
          skipped += 1;
          continue;
        }
        questionId = existing[0].id;
      }

      // Step 2: ensure an approved answer exists (backfill if a prior partial run left it orphaned).
      const existingAnswer = await db
        .select({ id: qaAnswers.id })
        .from(qaAnswers)
        .where(eq(qaAnswers.questionId, questionId))
        .limit(1);

      if (existingAnswer.length === 0) {
        await db.insert(qaAnswers).values({
          questionId,
          body: q.answer,
          authorName: "Vedic Tatva Editorial",
          authorRole: "expert",
          status: "approved",
        });
        if (isNew) inserted += 1;
        else backfilledAnswers += 1;
      } else if (isNew) {
        inserted += 1;
      } else {
        skipped += 1;
      }
    } catch (e: any) {
      // Best-effort — don't break boot if a single row fails.
      console.warn(`[seedQa] skip ${q.slug}: ${e?.message || "unknown"}`);
      skipped += 1;
    }
  }

  // Also normalise overall count using a safety SELECT for visibility.
  try {
    const [{ count }] = await db.execute<{ count: string }>(
      sql`SELECT COUNT(*)::text AS count FROM qa_questions`,
    ).then((r: any) => r.rows ?? r);
    console.log(`[seedQa] +${inserted} new, ${backfilledAnswers} answers backfilled, ${skipped} skipped, total now ${count}`);
  } catch {
    console.log(`[seedQa] +${inserted} new, ${backfilledAnswers} answers backfilled, ${skipped} skipped`);
  }
  return { inserted, backfilledAnswers, skipped };
}

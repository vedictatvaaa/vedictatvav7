/** Pure content and helpers for the guided Japa journey. */

export type JapaGuidanceState =
  | "idle"
  | "warmup_intro"
  | "exercise_intro"
  | "exercise_active"
  | "mantra_benefit_intro"
  | "chanting_ready"
  | "chanting_active"
  | "chanting_complete_narration"
  | "achievement_share";

export type AchievementSnapshot = {
  mantra: string;
  target: number;
  malas: number;
  streak: number;
  todayCount: number;
  lifetimeCount: number;
  devoteeName?: string;
};

export const NEUTRAL_MANTRA_BENEFIT =
  "इस मंत्र का एकाग्र भाव से जप मन को स्थिर करने, भक्ति जगाने और सजग ध्यान में सहायक हो सकता है।";

const MANTRA_BENEFITS: Record<string, string> = {
  "om-namah-shivaya": "ॐ नमः शिवाय का जप भीतर की शांति, आत्मचिंतन और शिव-भाव में एकाग्रता को सहारा दे सकता है।",
  "hare-krishna": "हरे कृष्ण महामंत्र का जप प्रेम, भक्ति और हृदय की प्रसन्न सजगता को पोषित कर सकता है।",
  gayatri: "गायत्री मंत्र का जप प्रकाशमय चिंतन, विवेक और ज्ञान के प्रति समर्पण को सहारा दे सकता है।",
  mahamrityunjaya: "महामृत्युंजय मंत्र का जप धैर्य, श्रद्धा और जीवन के प्रति शांत सजगता को सहारा दे सकता है।",
  "om-gam-ganapataye": "ॐ गं गणपतये नमः का जप शुभ आरंभ, धैर्य और केंद्रित संकल्प की भावना को सहारा दे सकता है।",
  "om-namo-narayanaya": "ॐ नमो नारायणाय का जप समर्पण, करुणा और भीतर के आश्रय की भावना को सहारा दे सकता है।",
  "om-namo-bhagavate": "ॐ नमो भगवते वासुदेवाय का जप भक्ति, विनम्रता और व्यापक चेतना की ओर ध्यान मोड़ सकता है।",
  "radhe-radhe": "राधे राधे का जप प्रेम, कोमलता और हृदय की भक्तिमय उपस्थिति को सहारा दे सकता है।",
  "durga-mantra": "दुर्गा मंत्र का जप साहस, श्रद्धा और भीतर की स्थिर शक्ति का स्मरण करा सकता है।",
  "saraswati-mantra": "सरस्वती मंत्र का जप सीखने, स्पष्ट वाणी और रचनात्मक एकाग्रता की भावना को सहारा दे सकता है।",
  "mahalaxmi-mantra": "महालक्ष्मी मंत्र का जप कृतज्ञता, संतुलन और जीवन की समृद्धि को सजगता से देखने में सहायक हो सकता है।",
  "hanuman-mantra": "हनुमान मंत्र का जप साहस, सेवा और अडिग भक्ति का स्मरण करा सकता है।",
};

export function mantraBenefit(mantraId: string | undefined, mantraLabel: string): string {
  return MANTRA_BENEFITS[mantraId || ""] ||
    `${mantraLabel} का एकाग्र भाव से जप मन को स्थिर करने, भक्ति जगाने और सजग ध्यान में सहायक हो सकता है।`;
}

export const CURATED_DAILY_THOUGHTS = [
  "आज श्रद्धा के साथ उठाया गया छोटा कदम भी मन में प्रकाश जगाता है।",
  "शांत श्वास और प्रेमपूर्ण स्मरण से आज का दिन मंगलमय बने।",
  "अपने कर्म में सजगता और हृदय में करुणा रखें; यही साधना है।",
  "आज भीतर की स्थिरता को अपने शब्दों और कर्मों में सहज रूप से प्रवाहित होने दें।",
  "कृतज्ञ मन साधारण क्षणों में भी शांति का अनुभव करता है।",
];

/** Returns an India-calendar-day stable fallback without relying on local timezone. */
export function istDateKey(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(date);
}

export function curatedDailyThought(date = new Date()): string {
  const key = istDateKey(date).replace(/-/g, "");
  const index = Number(key) % CURATED_DAILY_THOUGHTS.length;
  return CURATED_DAILY_THOUGHTS[index];
}

export function buildAchievementSnapshot(input: AchievementSnapshot): AchievementSnapshot {
  return Object.freeze({ ...input });
}

export function buildAchievementShareMessage(snapshot: AchievementSnapshot, url?: string): string {
  const link = url || (typeof window !== "undefined"
    ? `${window.location.origin}/digital-japa-counter`
    : "/digital-japa-counter");
  return `I completed my Japa on the Vedic Tatva Digital Japa Counter.\n\nI completed ${snapshot.target} repetitions of ${snapshot.mantra} (${snapshot.malas} mala${snapshot.malas === 1 ? "" : "s"}). My streak is ${snapshot.streak} day${snapshot.streak === 1 ? "" : "s"}.\n\nJoin the practice: ${link}`;
}
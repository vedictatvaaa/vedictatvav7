// =====================================================================
// Slug helpers + supplementary meta for the per-(city, puja) landing
// pages at /pandits/:citySlug/:pujaSlug.
//
// We don't store slugs on each popularPuja entry — instead we derive
// them on the fly from the display name. Centralised here so the
// page and the sitemap stay in sync.
// =====================================================================

export function slugifyPujaName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\//g, " ")          // "Vivah / Wedding" → "vivah wedding"
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export type PujaExtras = {
  duration: string;        // typical length
  audience: string;        // who books this most
  samagriKit: boolean;     // can we deliver a kit?
  whenIdeal: string;       // muhurat / tithi guidance
};

// Keyed loosely by canonical slug-prefix. Lookup is a "starts-with" so
// "satyanarayan-katha" and "satyanarayan-puja" both hit the same row.
const PUJA_EXTRAS: Array<{ matches: RegExp; extras: PujaExtras }> = [
  { matches: /satyanarayan/, extras: { duration: "2-3 hours", audience: "All Hindu households, especially observed on Pournami (full moon)", samagriKit: true, whenIdeal: "Full-moon evenings (Pournami) — most auspicious. Any Thursday works too." } },
  { matches: /griha-pravesh|gruhapravesha/, extras: { duration: "3-4 hours", audience: "New home buyers, especially apartments / new builds", samagriKit: true, whenIdeal: "Akshaya Tritiya, Pushya Nakshatra, or a Vastu-suitable muhurat picked by your pandit" } },
  { matches: /vivah|wedding|kalyana|bivah/, extras: { duration: "4-8 hours (full ceremony)", audience: "Bride and groom families", samagriKit: true, whenIdeal: "Per matched kundli muhurat — generally Nov-Feb and Apr-Jun seasons" } },
  { matches: /mundan|namkaran|annaprashan/, extras: { duration: "1-2 hours", audience: "Parents of infants and toddlers", samagriKit: true, whenIdeal: "Per child's birth-nakshatra; usually within first year (namkaran on day 11) and 1-3 years (mundan)" } },
  { matches: /rudrabhishek|abhishek/, extras: { duration: "2-3 hours", audience: "Shiva devotees, especially on Mondays", samagriKit: true, whenIdeal: "Any Monday, Pradosh, Shivaratri, or during Shravan month" } },
  { matches: /mata-ki-chowki|jagran|chowki/, extras: { duration: "3-4 hours (chowki) or full night (jagran)", audience: "Devi worshippers, popular in Punjabi households", samagriKit: true, whenIdeal: "Navratri nights, Fridays, or family vrata-completion occasions" } },
  { matches: /ganesh|ganpati|vinayaka/, extras: { duration: "1.5-2 hours daily during the festival", audience: "Maharashtrian and many other communities", samagriKit: true, whenIdeal: "Ganesh Chaturthi (10-day festival in Bhadrapada)" } },
  { matches: /durga|chandi/, extras: { duration: "Multi-day (sashthi to dashami)", audience: "Bengali and pan-Indian Shakti worshippers", samagriKit: true, whenIdeal: "Sharad Navratri — sashthi to vijayadashami" } },
  { matches: /lakshmi|kojagari|varalakshmi/, extras: { duration: "2-3 hours", audience: "Business families and households", samagriKit: true, whenIdeal: "Diwali night, Sharad Pournima, or Shravan Fridays" } },
  { matches: /saraswati/, extras: { duration: "1.5-2 hours", audience: "Students, artists, families with school-going children", samagriKit: true, whenIdeal: "Vasant Panchami (most auspicious) or Navratri" } },
  { matches: /navagraha|graha-shanti|shanti/, extras: { duration: "2-3 hours", audience: "Anyone with dosha indications in their kundli", samagriKit: true, whenIdeal: "Sundays or after kundli analysis by an astrologer" } },
  { matches: /ayushya|long-life|sashtiabdapurthi|bhimaratha/, extras: { duration: "3-5 hours", audience: "Birthday celebrants (especially 60th/70th milestones)", samagriKit: true, whenIdeal: "On birthday tithi as per janma-nakshatra" } },
  { matches: /vastu/, extras: { duration: "2-3 hours", audience: "New home / office owners", samagriKit: true, whenIdeal: "Before moving in, ideally a Pushya Nakshatra muhurat" } },
  { matches: /ramcharitmanas|akhand|path|naam-prasanga/, extras: { duration: "9 days (navah) or 24h (akhand)", audience: "Vaishnav families, especially in UP/Awadh", samagriKit: false, whenIdeal: "Ram Navami, Hanuman Jayanti, or any family-vrata occasion" } },
  { matches: /shradh|tarpan|pitru/, extras: { duration: "2-4 hours", audience: "Families observing ancestor rites", samagriKit: true, whenIdeal: "Pitru Paksha (15 days), annual death tithi, or amavasya" } },
  { matches: /bihu/, extras: { duration: "1-2 hours", audience: "Assamese households", samagriKit: false, whenIdeal: "Bohag (April), Kati (October), Magh (January) Bihu" } },
  { matches: /gauri|gauri-ganpati/, extras: { duration: "3 days", audience: "Maharashtrian households", samagriKit: true, whenIdeal: "Jyeshtha Gauri days during Ganesh Chaturthi (Bhadrapada)" } },
  { matches: /sri-sukta|sri-suktam|sukta/, extras: { duration: "2-3 hours", audience: "Business launches, Akshaya Tritiya observers", samagriKit: true, whenIdeal: "Akshaya Tritiya, Diwali, or any Lakshmi-themed occasion" } },
];

const DEFAULT_EXTRAS: PujaExtras = {
  duration: "2-3 hours",
  audience: "Hindu households observing the ceremony per family tradition",
  samagriKit: true,
  whenIdeal: "Per your family pandit's suggested muhurat or kundli-based timing",
};

export function getPujaExtras(slug: string): PujaExtras {
  for (const e of PUJA_EXTRAS) {
    if (e.matches.test(slug)) return e.extras;
  }
  return DEFAULT_EXTRAS;
}

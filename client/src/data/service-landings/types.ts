import type { LucideIcon } from "lucide-react";

export type ServiceVertical =
  | "rudraksha"
  | "gemstones"
  | "puja"
  | "astrology"
  | "pind-daan";

export type ServiceFAQ = { q: string; a: string };
export type ServiceMantra = { sanskrit: string; meaning: string };
export type ServiceBenefit = { icon: LucideIcon; title: string; body: string };
export type ServiceInclusion = string;
export type ServiceSection = { heading: string; body: string };

/** Optional Hindi translation overlay. Any field omitted falls back to the base (English) entry. */
export interface ServiceLandingHi {
  name?: string;
  eyebrow?: string;
  metaTitle?: string;
  metaDescription?: string;
  heroSubtitle?: string;
  quickAnswer?: string;
  sections?: ServiceSection[];
  /** Hindi versions of benefit title/body (icon stays the same — paired by index with the base array). */
  benefits?: { title: string; body: string }[];
  whoShouldDoThis?: string[];
  inclusions?: ServiceInclusion[];
  /** Sanskrit text usually stays; only the meaning needs translation. Paired by index. */
  mantras?: { sanskrit?: string; meaning: string }[];
  faqs?: ServiceFAQ[];
  primaryCta?: { label: string; href?: string };
  secondaryCta?: { label: string; href?: string };
}

export interface ServiceLandingEntry {
  slug: string;
  vertical: ServiceVertical;
  // Display
  name: string;
  nameHi?: string;
  eyebrow: string;
  // SEO
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  // Hero / answer
  heroSubtitle: string;
  /** 40–60 word factual answer Google AI Overviews can lift verbatim. */
  quickAnswer: string;
  // Editorial
  sections?: ServiceSection[];
  benefits?: ServiceBenefit[];
  whoShouldDoThis?: string[];
  inclusions?: ServiceInclusion[];
  mantras?: ServiceMantra[];
  faqs?: ServiceFAQ[];
  // Commerce
  priceFrom?: number;
  duration?: string;
  // Linking
  relatedSlugs?: string[];
  /** Override default CTA: { label, href }. Defaults to vertical-specific. */
  primaryCta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  /** Schema.org type emitted as primary entity. */
  schemaType?: "Service" | "Product";
  /** Hero / OG image */
  heroImage?: string;
  /** Mark stub entries authored at minimal depth so we can render gracefully. */
  isStub?: boolean;
  /** Hindi translation overlay used when active language === "hi". */
  hi?: ServiceLandingHi;
}

export const VERTICAL_LABELS_HI: Record<ServiceVertical, string> = {
  rudraksha: "रुद्राक्ष",
  gemstones: "रत्न",
  puja: "पूजा",
  astrology: "ज्योतिष",
  "pind-daan": "पिंड दान",
};

export const VERTICAL_LABELS: Record<ServiceVertical, string> = {
  rudraksha: "Rudraksha",
  gemstones: "Gemstones",
  puja: "Puja",
  astrology: "Astrology",
  "pind-daan": "Pind Daan",
};

export const VERTICAL_BASE_PATHS: Record<ServiceVertical, string> = {
  rudraksha: "/puja-samagri-online/rudraksha",
  gemstones: "/puja-samagri-online/gemstones",
  puja: "/online-puja-booking",
  astrology: "/astrology/services",
  "pind-daan": "/pind-daan-booking/services",
};

export function entryPath(entry: { vertical: ServiceVertical; slug: string }) {
  return `${VERTICAL_BASE_PATHS[entry.vertical]}/${entry.slug}`;
}

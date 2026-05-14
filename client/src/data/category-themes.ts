// Per-category visual identity + AI advisor config for Puja Essentials pages.
// Each /shop/<slug> category page reads from here to render a themed hero,
// motif backdrop, and an AI advisor feature unique to that category.
// Mobile-first by default — palettes are tested for both light/dark surfaces.

import type { LucideIcon } from "lucide-react";
import { Gem, Flame, Star, Sparkles, HandMetal, Shirt, Award, Diamond } from "lucide-react";

export type CategoryTheme = {
  slug: string;
  label: string;            // user-facing label
  tagline: string;          // 1-line elevator
  icon: LucideIcon;
  motifEmoji: string;       // displayed as decorative bg motif
  palette: {
    bgFrom: string;         // hero gradient start
    bgVia: string;          // hero gradient mid
    bgTo: string;           // hero gradient end
    accent: string;         // CTA + highlight color
    accentInk: string;      // ink ON accent
    chip: string;           // pill bg
  };
  advisor: {
    enabled: boolean;
    title: string;          // "Find your perfect Rudraksha"
    subtitle: string;       // helper line under title
    cta: string;            // button label e.g. "Recommend my mukhi"
    fields: AdvisorField[]; // form fields shown to user
    promptHint: string;     // server uses this to compose system prompt
  };
};

export type AdvisorField =
  | { kind: "text"; key: string; label: string; placeholder: string; required?: boolean }
  | { kind: "select"; key: string; label: string; options: string[]; required?: boolean }
  | { kind: "date"; key: string; label: string; required?: boolean };

export const CATEGORY_THEMES: Record<string, CategoryTheme> = {
  rudraksha: {
    slug: "rudraksha",
    label: "Rudraksha",
    tagline: "Sacred Nepal & Indonesian beads · 1 to 21 mukhi · X-ray verified",
    icon: Gem,
    motifEmoji: "ॐ",
    palette: {
      bgFrom: "#3D1F0E", bgVia: "#5C3320", bgTo: "#8C5A3C",
      accent: "#E8B96A", accentInk: "#3D1F0E", chip: "rgba(232,185,106,0.18)",
    },
    advisor: {
      enabled: true,
      title: "Find Your Perfect Rudraksha",
      subtitle: "Tell us your rashi and intention — our AI matches the right mukhi for you.",
      cta: "Recommend My Mukhi",
      fields: [
        { kind: "select", key: "rashi", label: "Your Rashi", required: true,
          options: ["Mesh (Aries)", "Vrishabh (Taurus)", "Mithun (Gemini)", "Kark (Cancer)", "Simha (Leo)", "Kanya (Virgo)", "Tula (Libra)", "Vrischik (Scorpio)", "Dhanu (Sagittarius)", "Makar (Capricorn)", "Kumbh (Aquarius)", "Meen (Pisces)", "Don't know"] },
        { kind: "select", key: "intention", label: "Primary Intention", required: true,
          options: ["Spiritual Protection", "Wealth & Prosperity", "Health & Healing", "Courage & Confidence", "Peace of Mind", "Marriage Harmony", "Career Success", "General Well-being"] },
      ],
      promptHint: "Recommend the most suitable Rudraksha mukhi (1-21) for the user based on their rashi and intention. Cite shastra (Shiva Purana, Padma Purana) where relevant. Include: recommended mukhi, deity, beej mantra, day to start wearing, and one care tip. 4-6 sentences, warm tone.",
    },
  },

  "puja-samagri": {
    slug: "puja-samagri",
    label: "Puja Samagri",
    tagline: "Roli, kumkum, gangajal & complete daily worship kits",
    icon: HandMetal,
    motifEmoji: "🕉️",
    palette: {
      bgFrom: "#5C1A1F", bgVia: "#8C2A30", bgTo: "#C28E5A",
      accent: "#F5D27E", accentInk: "#5C1A1F", chip: "rgba(245,210,126,0.18)",
    },
    advisor: {
      enabled: true,
      title: "Build My Puja Kit",
      subtitle: "Tell us the deity and occasion — we'll auto-bundle the exact samagri you need.",
      cta: "Generate My Kit List",
      fields: [
        { kind: "select", key: "deity", label: "Deity", required: true,
          options: ["Ganesha", "Lakshmi", "Vishnu", "Shiva", "Durga", "Saraswati", "Hanuman", "Krishna", "Ram", "Surya", "Navagraha", "Custom"] },
        { kind: "select", key: "occasion", label: "Occasion", required: true,
          options: ["Daily puja", "Griha Pravesh", "Satyanarayan Katha", "Diwali / Lakshmi Puja", "Ganesh Chaturthi", "Navratri", "Birthday / Sankalp", "Wedding", "Anniversary", "Other"] },
        { kind: "text", key: "notes", label: "Anything specific? (optional)", placeholder: "e.g. apartment puja, vegetarian only, no flowers" },
      ],
      promptHint: "Generate a complete puja samagri checklist for the deity + occasion. Group items as: dry essentials, wet/fresh items, fruits & naivedya, accessories, optional. Mention shastra-correct quantities. End with a 1-line vidhi sequence summary. 8-15 line bullet list.",
    },
  },

  idols: {
    slug: "idols",
    label: "Idols",
    tagline: "Brass, Panchaloha & marble murtis · Shilpa-shastra correct",
    icon: Star,
    motifEmoji: "🛕",
    palette: {
      bgFrom: "#3A2A0A", bgVia: "#7C5A1A", bgTo: "#E8C97A",
      accent: "#F5DD8A", accentInk: "#3A2A0A", chip: "rgba(245,221,138,0.18)",
    },
    advisor: {
      enabled: true,
      title: "Which Deity For Your Goal?",
      subtitle: "Tell us your intention — we'll suggest the right deity, material and size for your shrine.",
      cta: "Suggest My Murti",
      fields: [
        { kind: "select", key: "goal", label: "Your Goal", required: true,
          options: ["Remove obstacles", "Wealth & prosperity", "Knowledge & studies", "Health & longevity", "Marriage", "Children & family", "Career success", "Spiritual progress", "Protection from negativity"] },
        { kind: "select", key: "space", label: "Where will it sit?", required: true,
          options: ["Home shrine (small)", "Home shrine (medium)", "Home shrine (large)", "Office desk", "Living room", "Outdoor / garden"] },
        { kind: "select", key: "budget", label: "Budget", required: false,
          options: ["Under ₹2,000", "₹2,000-₹5,000", "₹5,000-₹15,000", "₹15,000+"] },
      ],
      promptHint: "Recommend the right deity + material (brass / panchaloha / marble / clay) + size for the user's goal and space. Cite shilpa-shastra references where relevant. Mention if pranapratishtha is recommended. 4-6 sentences.",
    },
  },

  "havan-samagri": {
    slug: "havan-samagri",
    label: "Havan Samagri",
    tagline: "Pure 32-herb yajna ingredients · A2 cow ghee · Samidha wood",
    icon: Flame,
    motifEmoji: "🔥",
    palette: {
      bgFrom: "#3D0E0A", bgVia: "#7A1F14", bgTo: "#B86F4A",
      accent: "#F2B85A", accentInk: "#3D0E0A", chip: "rgba(242,184,90,0.18)",
    },
    advisor: {
      enabled: true,
      title: "Plan My Havan",
      subtitle: "Tell us the yajna type and household size — we'll list samagri quantities and steps.",
      cta: "Get My Havan Plan",
      fields: [
        { kind: "select", key: "yajna", label: "Yajna Type", required: true,
          options: ["Ganpati Havan", "Rudra Yagna", "Navagraha Shanti", "Maha Mrityunjaya Havan", "Sudarshana Yagna", "Lakshmi Yagna", "Griha Shanti", "Vastu Shanti", "Custom"] },
        { kind: "select", key: "household", label: "Household Size", required: true,
          options: ["1-2 people", "3-5 people", "6-10 people", "Large gathering (10+)"] },
      ],
      promptHint: "List samagri quantities for the yajna and household size. Include: 32-herb mix, A2 ghee, samidha wood (specify type), grains, pre-puja prep, fire-lighting steps, sukta to chant, purnahuti instructions, and ash disposal. 10-14 line plan.",
    },
  },

  "brass-copperware": {
    slug: "brass-copperware",
    label: "Brass & Copperware",
    tagline: "Diyas, bells, lotas, kalash & thalis · Solid metal craftsmanship",
    icon: Sparkles,
    motifEmoji: "🪔",
    palette: {
      bgFrom: "#3A1D08", bgVia: "#7A4214", bgTo: "#D4A256",
      accent: "#F5C97A", accentInk: "#3A1D08", chip: "rgba(245,201,122,0.18)",
    },
    advisor: {
      enabled: true,
      title: "Build My Puja Thali",
      subtitle: "Tell us your puja style — we'll suggest the right brass & copper vessel set.",
      cta: "Suggest My Set",
      fields: [
        { kind: "select", key: "use", label: "Primary Use", required: true,
          options: ["Daily aarti", "Festival puja", "Abhishek / bath rituals", "Yajna / havan", "Naivedya offering", "Complete shrine setup"] },
        { kind: "select", key: "metal", label: "Metal Preference", required: false,
          options: ["Brass (most affordable)", "Copper (purest)", "Mixed (recommended)", "No preference"] },
      ],
      promptHint: "Suggest the right brass/copper vessel set (diya, panchapatra, achamani, kalash, ghanti, thali, lota) for the user's puja style. Mention metal-care tips and shastric reasoning. 4-6 sentences.",
    },
  },

  wearables: {
    slug: "wearables",
    label: "Wearables",
    tagline: "108-bead japa malas · Energised yantra lockets · Healing bracelets",
    icon: Award,
    motifEmoji: "📿",
    palette: {
      bgFrom: "#1F2E1A", bgVia: "#3F5C2D", bgTo: "#5C7548",
      accent: "#C9D88A", accentInk: "#1F2E1A", chip: "rgba(201,216,138,0.18)",
    },
    advisor: {
      enabled: true,
      title: "Match My Mantra to a Mala",
      subtitle: "Tell us your sadhana — we'll suggest the right mala material, beads and stringing.",
      cta: "Suggest My Mala",
      fields: [
        { kind: "select", key: "tradition", label: "Tradition", required: true,
          options: ["Vaishnava (Vishnu, Krishna, Ram)", "Shaiva (Shiva, Mahamrityunjaya)", "Shakta (Devi, Durga, Kali)", "Smarta / general", "Buddhist", "No specific tradition"] },
        { kind: "text", key: "mantra", label: "Mantra you chant (optional)", placeholder: "e.g. Om Namah Shivaya, Hare Krishna Mahamantra" },
        { kind: "select", key: "goal", label: "Sadhana Goal", required: true,
          options: ["Mental peace", "Devotion", "Healing", "Protection", "Concentration", "Wealth", "Love & relationships"] },
      ],
      promptHint: "Recommend mala material (Rudraksha / Tulsi / Sphatik / Sandalwood / Coral / Lotus seed) and bead count, based on tradition + mantra + goal. Mention how to wear, when to begin, and a quick care tip. 4-6 sentences.",
    },
  },

  "dhoti-kurta": {
    slug: "dhoti-kurta",
    label: "Dhoti & Kurta",
    tagline: "Pure cotton & silk puja wear · Traditional & contemporary cuts",
    icon: Shirt,
    motifEmoji: "🪡",
    palette: {
      bgFrom: "#3A0E14", bgVia: "#7A1F2A", bgTo: "#D4A8A0",
      accent: "#F5D0C8", accentInk: "#3A0E14", chip: "rgba(245,208,200,0.18)",
    },
    advisor: {
      enabled: true,
      title: "Find My Perfect Fit",
      subtitle: "Share your measurements & occasion — we'll suggest the right size, fabric and style.",
      cta: "Recommend My Set",
      fields: [
        { kind: "select", key: "occasion", label: "Occasion", required: true,
          options: ["Daily home puja", "Temple visits", "Wedding / family ceremony", "Pandit / priest service", "Festival (Diwali, Janmashtami)", "Yoga / meditation"] },
        { kind: "text", key: "height", label: "Height (cm)", placeholder: "e.g. 172", required: true },
        { kind: "text", key: "chest", label: "Chest (inches)", placeholder: "e.g. 40", required: true },
      ],
      promptHint: "Suggest the right dhoti+kurta size (S/M/L/XL/XXL), fabric (cotton/silk/linen), color and traditional cut for the occasion. Include length recommendation for the dhoti. 4-6 sentences.",
    },
  },

  gemstones: {
    slug: "gemstones",
    label: "Gemstones",
    tagline: "Lab-certified Navaratna · Astrological birthstones · Jyotish ratna",
    icon: Diamond,
    motifEmoji: "💎",
    palette: {
      bgFrom: "#0E1A3D", bgVia: "#1A2B5C", bgTo: "#4A7BA6",
      accent: "#7AB8E8", accentInk: "#0E1A3D", chip: "rgba(122,184,232,0.18)",
    },
    advisor: {
      enabled: true,
      title: "Which Gemstone Suits My Kundli?",
      subtitle: "Share your DOB & rashi — we'll match the right jyotish ratna to your chart.",
      cta: "Recommend My Gemstone",
      fields: [
        { kind: "date", key: "dob", label: "Date of Birth", required: true },
        { kind: "select", key: "rashi", label: "Rashi (if known)", required: false,
          options: ["Mesh (Aries)", "Vrishabh (Taurus)", "Mithun (Gemini)", "Kark (Cancer)", "Simha (Leo)", "Kanya (Virgo)", "Tula (Libra)", "Vrischik (Scorpio)", "Dhanu (Sagittarius)", "Makar (Capricorn)", "Kumbh (Aquarius)", "Meen (Pisces)", "Don't know"] },
        { kind: "select", key: "concern", label: "Primary Concern", required: true,
          options: ["Career stagnation", "Relationship issues", "Financial blocks", "Health concerns", "Legal / Saturn issues", "General prosperity", "Spiritual growth"] },
      ],
      promptHint: "Recommend the most suitable astrological gemstone based on DOB + rashi + concern. Include: stone name (Sanskrit + English), planet, finger, metal for setting, day to wear, and a strong caveat that the user should consult a jyotishi before wearing Neelam, Pukhraj or Gomed. 5-7 sentences.",
    },
  },
};

export function getCategoryTheme(slug?: string | null): CategoryTheme | null {
  if (!slug) return null;
  return CATEGORY_THEMES[slug] || null;
}

export const ORDERED_THEME_SLUGS = [
  "rudraksha",
  "puja-samagri",
  "idols",
  "havan-samagri",
  "brass-copperware",
  "wearables",
  "dhoti-kurta",
  "gemstones",
] as const;

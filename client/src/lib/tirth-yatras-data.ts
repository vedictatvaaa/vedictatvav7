import type { LucideIcon } from "lucide-react";
import {
  Mountain, Flame, Droplets, Sun, Crown, Shield, Heart, Star,
  Sparkles, MapPin, Compass, BookOpen, Waves, Wind, Snowflake,
  Sunrise, Calendar, Users,
} from "lucide-react";
import { TIRTH_YATRAS_SERIALIZABLE, type SerializableTirthYatra } from "@shared/tirth-yatras-data";

export type YatraTemple = { name: string; nameHi?: string; about: string };
export type YatraDay = { day: string; title: string; body: string };
export type YatraFaq = { q: string; a: string };
export type YatraBenefit = { icon: LucideIcon; title: string; body: string };
export type YatraTrustBadge = { value: string; label: string };
export type TirthYatra = Omit<SerializableTirthYatra, "iconKey" | "benefits"> & {
  icon: LucideIcon; benefits: YatraBenefit[];
};

const iconByKey: Record<string, LucideIcon> = {
  Mountain, Flame, Droplets, Sun, Crown, Shield, Heart, Star, Sparkles, MapPin,
  Compass, BookOpen, Waves, Wind, Snowflake, Sunrise, Calendar, Users,
};

function clientIcon(iconKey: string): LucideIcon {
  const icon = iconByKey[iconKey];
  if (!icon) throw new Error(`Unknown Tirth UI icon: ${iconKey}`);
  return icon;
}

export const TIRTH_YATRAS: TirthYatra[] = TIRTH_YATRAS_SERIALIZABLE.map(({ iconKey, benefits, ...yatra }) => ({
  ...yatra,
  icon: clientIcon(iconKey),
  benefits: benefits.map(({ iconKey: benefitIconKey, ...benefit }) => ({ ...benefit, icon: clientIcon(benefitIconKey) })),
}));

export const TIRTH_YATRAS_BY_SLUG: Record<string, TirthYatra> = TIRTH_YATRAS.reduce(
  (acc, y) => ({ ...acc, [y.slug]: y }),
  {} as Record<string, TirthYatra>
);

export const TIRTH_YATRA_CATEGORIES = [
  { id: "all", label: "All Yatras", icon: Compass },
  { id: "char-dham", label: "Char Dham", icon: Mountain },
  { id: "jyotirlinga", label: "Jyotirlingas", icon: Flame },
  { id: "shakti-peeth", label: "Shakti Peeths", icon: Sparkles },
  { id: "vaishnav", label: "Vaishnav Dhams", icon: Crown },
  { id: "shaiva", label: "Shaiva Tirthas", icon: Flame },
  { id: "shakti", label: "Shakti Tirthas", icon: Sparkles },
  { id: "ram", label: "Ram Tirthas", icon: Sun },
  { id: "krishna", label: "Krishna Tirthas", icon: Star },
  { id: "snan", label: "Snan Tirthas", icon: Droplets },
  { id: "himalayan", label: "Himalayan", icon: Mountain },
  { id: "south", label: "South India", icon: Waves },
  { id: "other", label: "Saint & Bhakti", icon: Heart },
] as const;

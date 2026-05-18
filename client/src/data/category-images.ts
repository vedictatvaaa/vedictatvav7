// Single source of truth for the per-category hero image (used on /puja-samagri-online's
// "Shop by Category" grid AND /spiritual-essentials hub tiles).
import rudrakshaImg from "@assets/generated_images/cat-rudraksha.png";
import pujaSamagriImg from "@assets/generated_images/cat-puja-samagri.png";
import idolsImg from "@assets/generated_images/cat-idols.png";
import havanImg from "@assets/generated_images/cat-havan-samagri.png";
import brassImg from "@assets/generated_images/cat-brass-copperware.png";
import wearablesImg from "@assets/generated_images/cat-wearables.png";
import dhotiImg from "@assets/generated_images/cat-dhoti-kurta.png";
import gemstonesImg from "@assets/generated_images/cat-gemstones.png";

export const CATEGORY_IMAGE: Record<string, string> = {
  "rudraksha": rudrakshaImg,
  "puja-samagri": pujaSamagriImg,
  "idols": idolsImg,
  "havan-samagri": havanImg,
  "brass-copperware": brassImg,
  "wearables": wearablesImg,
  "dhoti-kurta": dhotiImg,
  "gemstones": gemstonesImg,
};

export function getCategoryImage(slug: string | null | undefined): string | undefined {
  if (!slug) return undefined;
  return CATEGORY_IMAGE[slug];
}

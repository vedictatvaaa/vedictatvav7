import {
  TEMPLE_TOURISM_SOURCE_ROWS,
  TIRTH_GUIDE_SOURCE_ROWS,
} from "@shared/pilgrimage-source-contract";
export {
  TEMPLE_TOURISM_CLASSIFICATION_MANIFEST,
  type TempleTourismClassification,
} from "@shared/destination-classification-manifest";
import { TEMPLE_TOURISM_CLASSIFICATION_MANIFEST } from "@shared/destination-classification-manifest";

/** Only a reviewed, singular destination mapping is represented. */
export const YATRA_TO_TIRTH_MAPPING_MANIFEST = [
  { yatraSourceKey: "delhi-haridwar-yatra", tirthSourceKey: "haridwar" },
] as const;

export const DESTINATION_SOURCE_COUNTS = {
  tirthGuides: TIRTH_GUIDE_SOURCE_ROWS.length,
  templeTourism: TEMPLE_TOURISM_SOURCE_ROWS.length,
  temple: 26,
  tirth: 10,
  legacyOnly: 6,
} as const;

export const LEGACY_ONLY_TEMPLE_TOURISM_SOURCE_KEYS = [
  "kawadYatra", "amarnathYatra", "narmadaParikrama", "goldenTemple", "hemkundSahib", "govardhanParikrama",
] as const;
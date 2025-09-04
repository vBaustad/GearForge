// src/components/crests/crests.ts
import { CREST_TIERS, type Crest } from "../../types/crests";

export const CREST_ORDER = CREST_TIERS;      // UI uses the canonical order
export type CrestTier = Crest;

export const CREST_ICONS: Record<Crest, string> = {
  Gilded:    "/images/crests/gilded.jpg",
  Runed:     "/images/crests/runed.jpg",
  Carved:    "/images/crests/carved.jpg",
  Weathered: "/images/crests/weathered.jpg",
};

// UI labels live with UI, not in /types
export const CREST_LABEL_SHORT: Record<Crest, string> = {
  Weathered: "Weathered",
  Carved:    "Carved",
  Runed:     "Runed",
  Gilded:    "Gilded",
};

export const CREST_LABEL_LONG: Record<Crest, string> = {
  Weathered: "Weathered Ethereal Crest",
  Carved:    "Carved Ethereal Crest",
  Runed:     "Runed Ethereal Crest",
  Gilded:    "Gilded Ethereal Crest",
};

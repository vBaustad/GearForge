export type Crest = "Weathered" | "Carved" | "Runed" | "Gilded";

export const CREST_ORDER: Crest[] = ["Gilded", "Runed", "Carved", "Weathered"];

export const CURRENCY_TO_CREST: Record<number, Crest> = {
  3290: "Gilded",
  3288: "Runed",
  3286: "Carved",
  3284: "Weathered",
};

export const CREST_LABEL_SHORT: Record<Crest, string> = {
  Weathered: "Weathered",
  Carved: "Carved",
  Runed: "Runed",
  Gilded: "Gilded",
};

export const CREST_LABEL_LONG: Record<Crest, string> = {
  Weathered: "Weathered Ethereal Crest",
  Carved: "Carved Ethereal Crest",
  Runed: "Runed Ethereal Crest",
  Gilded: "Gilded Ethereal Crest",
};

export const CREST_ICON_SRC: Record<Crest, string> = {
  Weathered: "/images/crests/weathered.jpg",
  Carved: "/images/crests/carved.jpg",
  Runed: "/images/crests/runed.jpg",
  Gilded: "/images/crests/gilded.jpg",
};

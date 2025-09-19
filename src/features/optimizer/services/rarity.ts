// src/features/optimizer/services/rarity.ts
export type DisplayRarity =
  | "poor" | "common" | "uncommon" | "rare" | "epic"
  | "legendary" | "artifact" | "heirloom" | "prismatic";

const MAP_QUALITY_ID_TO_RARITY: Record<number, DisplayRarity> = {
  0: "poor",
  1: "common",
  2: "uncommon",
  3: "rare",
  4: "epic",
  5: "legendary",
  6: "artifact",
  7: "heirloom",
  8: "prismatic",
};

export function rarityFromQualityId(id: number | undefined | null): DisplayRarity | undefined {
  if (id == null) return undefined;
  return MAP_QUALITY_ID_TO_RARITY[id];
}

export function rarityFromClassList(el: Element | null): DisplayRarity | undefined {
  if (!el) return undefined;
  // Wowhead adds q0..q8 to the anchor (e.g., "q4" => epic)
  // Find first class matching q\d
  for (const cls of el.classList) {
    const m = /^q([0-8])$/.exec(cls);
    if (m) return rarityFromQualityId(Number(m[1]));
  }
  return undefined;
}

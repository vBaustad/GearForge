// src/features/optimizer/services/slotMap.ts
import type { SlotKey, SlotIndex, SlotWatermark } from "../types/simc";

/** UI display labels */
export const SLOT_DISPLAY: Record<SlotKey, string> = {
  head: "Head",
  neck: "Neck",
  shoulder: "Shoulder",
  back: "Back",
  chest: "Chest",
  wrist: "Wrist",
  hands: "Hands",
  waist: "Waist",
  legs: "Legs",
  feet: "Feet",
  finger1: "Ring 1",
  finger2: "Ring 2",
  trinket1: "Trinket 1",
  trinket2: "Trinket 2",
  main_hand: "Main Hand",
  off_hand: "Off Hand",
};

const ALL_SLOTS = new Set<SlotKey>(Object.keys(SLOT_DISPLAY) as SlotKey[]);

/** normalize raw SimC slot to a SlotKey (or null if not one we place) */
export function normalizeSlot(raw: string): SlotKey | null {
  const s = raw.toLowerCase() as SlotKey;
  return ALL_SLOTS.has(s) ? s : null;
}

/** Human-readable for 1-based indices (useful for debugging/menus) */
export const SLOT_INDEX_MAP: Record<SlotIndex, string> = {
  1: "Head",
  2: "Neck",
  3: "Shoulder",
  4: "Shirt",
  5: "Chest",
  6: "Belt",
  7: "Legs",
  8: "Feet",
  9: "Wrist",
  10: "Gloves",
  11: "Finger 1",
  12: "Finger 2",
  13: "Trinket 1",
  14: "Trinket 2",
  15: "Back",
  16: "Main Hand",
  17: "Off Hand",
};

/**
 * Primary mapping: 1-based slot index → your SlotKey.
 * (Skip indices we don’t support like 4/Shirt.)
 */
export const SLOT_INDEX_TO_KEY: Partial<Record<SlotIndex, SlotKey>> = {
  1: "head",
  2: "neck",
  3: "shoulder",
  5: "chest",
  6: "waist",
  7: "legs",
  8: "feet",
  9: "wrist",
  10: "hands",
  11: "finger1",
  12: "finger2",
  13: "trinket1",
  14: "trinket2",
  15: "back",
  16: "main_hand",
  17: "off_hand",
};

/** Reverse mapping: your SlotKey → 1-based index */
export const KEY_TO_SLOT_INDEX: Record<SlotKey, SlotIndex> = Object.entries(
  SLOT_INDEX_TO_KEY
).reduce((acc, [idxStr, key]) => {
  if (key) acc[key] = Number(idxStr) as SlotIndex;
  return acc;
}, {} as Record<SlotKey, SlotIndex>);

/**
 * SimC (0-based) → Your (1-based) indices.
 * 16 (ranged/relic) intentionally dropped.
 */
export const SIMC_TO_USER_SLOT: Partial<Record<number, SlotIndex>> = {
  0: 1,
  1: 2,
  2: 3,
  3: 15,
  4: 5,
  5: 9,
  6: 10,
  7: 6,
  8: 7,
  9: 8,
  10: 11,
  11: 12,
  12: 13,
  13: 14,
  14: 16,
  15: 17,
  // 16 -> (none)
};

/** Convert a SimC 0-based slot number to your SlotKey (or null). */
export function simcSlotToKey(simcIndex0: number): SlotKey | null {
  const idx = SIMC_TO_USER_SLOT[simcIndex0];
  if (!idx) return null;
  const key = SLOT_INDEX_TO_KEY[idx];
  return key ?? null;
}

/**
 * Fold parsed watermarks (1-based SlotIndex) into a mapping the planner can use:
 *   { head: 704, main_hand: 710, ... }
 * Uses the *current* watermark as the free-upgrade ilvl threshold.
 */
export function watermarksToFreeIlvlBySlot(
  wms: SlotWatermark[]
): Partial<Record<SlotKey, number>> {
  const out: Partial<Record<SlotKey, number>> = {};
  for (const wm of wms) {
    const key = SLOT_INDEX_TO_KEY[wm.slot];
    if (!key) continue;
    // If you prefer max over current, swap to `wm.max`
    out[key] = wm.current;
  }
  return out;
}

import { tracks } from "../proxy/registry";
import type { ParsedItem, ItemState, TrackKey } from "../types/simc";
import { normalizeSlot } from "./slotMap";
import { findUpgradeByBonusIds, toTrackKey } from "../../../data/upgradeIndex"

/** Find the track that contains this ilvl (exact match preferred). */
export function inferTrackFromIlvl(ilvl: number): TrackKey | null {
  let candidate: TrackKey | null = null;
  for (const key of Object.keys(tracks) as TrackKey[]) {
    const t = tracks[key];
    const values = Object.values(t.ilvlByRank);
    const min = Math.min(...values);
    const max = Math.max(...values);
    if (ilvl >= min && ilvl <= max) {
      if (values.includes(ilvl)) return key; // exact match
      candidate = candidate ?? key;
    }
  }
  return candidate;
}

/** Get the closest rank at or below ilvl for a given track. */
export function inferRankFromIlvl(ilvl: number, trackKey: TrackKey): number {
  const t = tracks[trackKey];
  let bestRank = 1;
  for (const [rankStr, lvl] of Object.entries(t.ilvlByRank)) {
    const r = Number(rankStr);
    if (ilvl >= lvl && r > bestRank) bestRank = r;
  }
  return bestRank;
}

/** Convert a parsed SimC line to our internal ItemState (or null if unknown). */
export function toItemState(parsed: ParsedItem): ItemState | null {
  const slot = normalizeSlot(parsed.slot);
  if (!slot) return null;

  const bonusIds = parsed.bonusIds ?? [];
  const hit = findUpgradeByBonusIds(bonusIds);

  if (hit) {
    const trackKey = toTrackKey(hit.group);
    if (trackKey) {
      // Normal, supported groups (Veteran/Champion/Hero/Myth etc.)
      return {
        slot,
        track: trackKey,
        rank: hit.level,
        name: parsed.name,
        ilvl: parsed.ilvl,
        id: parsed.id,
        crafted: parsed.crafted,
      };
    }
    // Explorer/Adventurer (if you don't model them), fall back to ilvl below.
  }

  // Fallback when no bonus-id match or unsupported group: infer from ilvl
  if (typeof parsed.ilvl === "number") {
    const tk = inferTrackFromIlvl(parsed.ilvl);
    if (tk) {
      const rk = inferRankFromIlvl(parsed.ilvl, tk);
      return {
        slot,
        track: tk,
        rank: rk,
        name: parsed.name,
        ilvl: parsed.ilvl,
        id: parsed.id,
        crafted: parsed.crafted,
      };
    }
  }

  return null; // couldn't infer
}

// Temporary aliases if you want to keep old names compiling for now:
export const inferTrackFromIlvl_old = inferTrackFromIlvl;
export const inferRankFromIlvl_old = inferRankFromIlvl;
export const toItemState_old = toItemState;

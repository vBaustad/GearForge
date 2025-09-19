// src/data/upgradeIndex.ts
// Season-aware upgrade decoder (replaces the old hardcoded map).
// Reads from the *active* season configuration. No `any` used.

import type { TrackKey } from "../features/optimizer/types/simc";
import { season } from "../config/seasons/currentSeason";

/* ---------- Types ---------- */

type SeasonBonus = {
  group: number;    // Wowhead upgrade group (e.g., 513..518)
  level: number;    // rank (1..max)
  max: number;      // max ranks for that track
  name: TrackKey;   // track key
  fullName: string; // e.g., "Veteran 4/8"
};
type SeasonBonusIndex = Record<number, SeasonBonus>;

type SeasonLike = {
  id: string;
  bonusUpgradeIndex: SeasonBonusIndex;
  groupToTrack?: Readonly<Record<number, TrackKey | undefined>>;
};

const activeSeason: SeasonLike = season as unknown as SeasonLike;

export type BonusHit = SeasonBonus & { id: number };

/* ---------- Helpers ---------- */

/** Prefer group→track provided by the active season; fallback to defaults. */
const defaultGroupToTrack: Readonly<Record<number, TrackKey | undefined>> = {
  513: "Explorer",
  514: "Adventurer",
  515: "Veteran",
  516: "Champion",
  517: "Hero",
  518: "Myth",
};

const groupToTrackMap: Readonly<Record<number, TrackKey | undefined>> =
  activeSeason.groupToTrack ?? defaultGroupToTrack;

/** Convert a group number to your TrackKey (or null if unknown). */
export function toTrackKey(group: number): TrackKey | null {
  return groupToTrackMap[group] ?? null;
}

/** Return the first matching upgrade-bonus from the *current season*. */
export function findUpgradeByBonusIds(
  bonusIds: number[] | null | undefined
): BonusHit | null {
  if (!bonusIds?.length) return null;
  const idx = activeSeason.bonusUpgradeIndex;
  for (const id of bonusIds) {
    const hit = idx[id];
    if (hit) return { ...hit, id };
  }
  return null;
}

/** Convenience: decode (track, rank) from bonusIds, else null. */
export function decodeTrackRankFromBonusIds(
  bonusIds: number[] | null | undefined
): { track: TrackKey; rank: number; max: number; bonusId: number } | null {
  const hit = findUpgradeByBonusIds(bonusIds);
  return hit ? { track: hit.name, rank: hit.level, max: hit.max, bonusId: hit.id } : null;
}

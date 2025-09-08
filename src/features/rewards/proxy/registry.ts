// src/features/rewards/proxy/registry.ts
import { season } from "../../../config/seasons/currentSeason";
import type { TrackKey } from "../../optimizer/types/simc";

export const rewardsSeasonName = season.name ?? season.id;
export const rewardsRowsRaw    = season.rewards.rows;
export const rewardsSpotlight  = season.rewards.spotlightLevels;

// track+rank → ilvl (authoritative from the season’s tracks)
export function resolveIlvl(track: TrackKey, rank: number): number {
  const table = season.tracks[track]?.ilvlByRank as Record<number, number> | undefined;
  if (!table) throw new Error(`Missing ilvlByRank for track ${track}`);
  const v = table[rank];
  if (!v) throw new Error(`Missing ilvl for ${track} rank ${rank}`);
  return v;
}

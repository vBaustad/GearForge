import { season } from "../../../config/seasons/currentSeason";
import type { TrackKey } from "../../optimizer/types/simc";
import type { MPlusRewardRow } from "../../../types/season";

// Safe helper: prefer name if present, else id (no `any`)
type SeasonIdOnly = { id: string };
type MaybeNamed = { name?: string };
function seasonDisplayName(s: SeasonIdOnly & MaybeNamed) {
  return s.name ?? s.id;
}

export const rewardsSeasonName = seasonDisplayName(season);
export const rewardsSpotlight = season.rewards.spotlightLevels;

// raw rows: { level, end:{track,rank}, vault:{track,rank} }
export const rewardsRowsRaw: MPlusRewardRow[] = season.rewards.rows;

/** Resolve a track+rank → ilvl using current season tracks */
export function resolveIlvl(track: TrackKey, rank: number): number {
  const t = season.tracks[track];
  if (!t?.ilvlByRank) throw new Error(`Missing ilvlByRank for track ${track}`);
  const ilvl = (t.ilvlByRank as Record<number, number>)[rank];
  if (!ilvl) throw new Error(`Missing ilvl for ${track} rank ${rank}`);
  return ilvl;
}

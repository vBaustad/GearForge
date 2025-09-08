import type { MPlusRewardRow, SeasonConfig } from "../../../types/season";
import type { TrackKey } from "../../../features/optimizer/types/simc";

/** Ensure each row's track/rank exists and maps to an ilvl. */
export function validateRewardsRows(
  rows: MPlusRewardRow[],
  tracks: Record<TrackKey, { maxRank: number; ilvlByRank: Record<number, number> }>
) {
  for (const row of rows) {
    ([
      ["end", row.end],
      ["vault", row.vault],
    ] as const).forEach(([label, { track, rank }]) => {
      const t = tracks[track];
      if (!t) throw new Error(`Rewards: unknown track "${track}" at +${row.level} (${label})`);
      if (rank < 1 || rank > t.maxRank) {
        throw new Error(`Rewards: rank out of bounds ${track} ${rank}/${t.maxRank} at +${row.level} (${label})`);
      }
      const ilvl = t.ilvlByRank[rank];
      if (!ilvl) throw new Error(`Rewards: missing ilvl for ${track} ${rank} at +${row.level} (${label})`);
    });
  }
}

/** Optional: whole-season validator hook */
export function validateSeasonConfig(season: SeasonConfig) {
  // Add any cross-field checks you want later.
}

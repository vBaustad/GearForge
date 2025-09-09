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

export function validateSeasonConfig(season: SeasonConfig): void {
  const { rewards, tracks } = season;

  // Must have at least one reward row
  if (!rewards?.rows?.length) {
    throw new Error("Season rewards: no rows defined.");
  }

  // Spotlight levels should exist in rows (warn, don’t fail)
  const levels = new Set(rewards.rows.map(r => r.level));
  for (const lvl of rewards.spotlightLevels ?? []) {
    if (!levels.has(lvl)) {
      console.warn(`Season rewards: spotlight level +${lvl} has no corresponding row.`);
    }
  }

  // Each row’s track/rank must be valid for both end and vault
  for (const row of rewards.rows) {
    (["end", "vault"] as const).forEach(kind => {
      const pair = row[kind];
      const t = tracks[pair.track];
      if (!t) {
        throw new Error(
          `Season rewards: unknown track "${pair.track}" at +${row.level} (${kind}).`
        );
      }
      if (pair.rank < 1 || pair.rank > t.maxRank) {
        throw new Error(
          `Season rewards: ${pair.track} rank ${pair.rank} out of bounds 1..${t.maxRank} at +${row.level} (${kind}).`
        );
      }
    });
  }
}

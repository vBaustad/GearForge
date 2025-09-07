// src/config/seasons/the_war_within/season_3/season.ts
import type { SeasonConfig, MPlusRewardRow } from "../../../../types/season";
import type { Track, TrackKey } from "../../../../features/optimizer/types/simc";
import { trackTemplates } from "../../../../data/trackDefinitions";
import { bonusUpgradeIndex } from "../../../../data/upgradeIndex";
import { ilvlByRank_tww_s3 } from "./ilvlByRank";
import { seasonMeta } from "./season.meta";

// --- tracks build (unchanged) ---
const tracks = Object.fromEntries(
  (Object.keys(trackTemplates) as TrackKey[]).map((key) => {
    const base = trackTemplates[key] as Omit<Track, "ilvlByRank">;
    const ilvlByRank = ilvlByRank_tww_s3[key];
    if (!ilvlByRank) throw new Error(`Missing ilvl for track: ${key}`);

    const expected = base.maxRank;
    const actual = Object.keys(ilvlByRank).length;
    if (actual !== expected) {
      throw new Error(`ilvl length mismatch for ${key}. Expected ${expected}, got ${actual}`);
    }
    const track: Track = { ...base, ilvlByRank };
    return [key, track];
  })
) as Record<TrackKey, Track>;

// ---------- Rewards (M+): decode ilvl -> {track, rank} ----------
type Pair = { track: keyof typeof ilvlByRank_tww_s3; rank: number };

// Prefer lower tracks first when ilvl overlaps (e.g., 684 = Veteran 6 and Champion 2)
const TRACK_ORDER: Array<keyof typeof ilvlByRank_tww_s3> = [
  "Explorer",
  "Adventurer",
  "Veteran",
  "Champion",
  "Hero",
  "Myth",
];

function findTrackRank(ilvl: number): Pair {
  for (const track of TRACK_ORDER) {
    const table = ilvlByRank_tww_s3[track] as Record<number, number>;
    for (const [rankStr, val] of Object.entries(table)) {
      if (val === ilvl) return { track, rank: Number(rankStr) };
    }
  }
  throw new Error(`No track/rank found for ilvl ${ilvl}`);
}

/**
 * Source rows (your provided numbers).
 * NOTE: Only +2 .. +12 included here. Append +13..+20 when ready.
 * `note` keeps the crest info exactly as you wrote it.
 */
const source = [
  // level, endIlvl, vaultIlvl, note
  { level:  2, end: 684, vault: 694, note: "10 Runed"  },
  { level:  3, end: 684, vault: 694, note: "12 Runed"  },
  { level:  4, end: 688, vault: 697, note: "14 Runed"  },
  { level:  5, end: 691, vault: 697, note: "16 Runed"  },
  { level:  6, end: 694, vault: 701, note: "18 Runed"  },
  { level:  7, end: 694, vault: 704, note: "10 Gilded" },
  { level:  8, end: 697, vault: 704, note: "12 Gilded" },
  { level:  9, end: 697, vault: 704, note: "14 Gilded" },
  { level: 10, end: 701, vault: 707, note: "16 Gilded" },
  { level: 11, end: 701, vault: 707, note: "18 Gilded" },
  { level: 12, end: 701, vault: 707, note: "20 Gilded" },
] as const;

// Build RAW rows (track+rank) as required by SeasonConfig.rewards.rows
const rewardsRows: MPlusRewardRow[] = source
  .slice()
  .sort((a, b) => a.level - b.level)
  .map((r) => ({
    level: r.level,
    end:   findTrackRank(r.end),
    vault: findTrackRank(r.vault),
    note:  r.note,
  }));

export const season: SeasonConfig = {
  ...seasonMeta,
  tracks,
  bonusUpgradeIndex,
  rewards: {
    spotlightLevels: [2, 6, 7, 10, 12],
    rows: rewardsRows,
  },
};

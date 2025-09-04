// src/config/seasons/the_war_within/season_3/season.ts

import type { SeasonConfig } from "../../../../types/season";
import type { Track, TrackKey } from "../../../../features/optimizer/types/simc";
// UPDATED paths (adjust to your final layout):
import { trackTemplates } from "../../../../data/trackDefinitions";  // ← moved
import { bonusUpgradeIndex } from "../../../../data/upgradeIndex";
import { ilvlByRank_tww_s3 } from "./ilvlByRank";
import { meta_tww_s3 } from "./season.meta";

const tracks = Object.fromEntries(
  (Object.keys(trackTemplates) as TrackKey[]).map((key) => {
    // make the template obviously Track minus ilvlByRank
    const base = trackTemplates[key] as Omit<Track, "ilvlByRank">;

    const ilvlByRank = ilvlByRank_tww_s3[key];
    if (!ilvlByRank) throw new Error(`Missing ilvl for track: ${key}`);

    // Validate length vs maxRank
    const expected = base.maxRank;
    const actual = Object.keys(ilvlByRank).length;
    if (actual !== expected) {
      throw new Error(`ilvl length mismatch for ${key}. Expected ${expected}, got ${actual}`);
    }

    const track: Track = { ...base, ilvlByRank };
    return [key, track];
  })
) as Record<TrackKey, Track>;

export const season: SeasonConfig = {
  ...meta_tww_s3,
  tracks,
  bonusUpgradeIndex,
};

import type { SeasonConfig } from "../../../types/season";
import type { Track, TrackKey } from "../../../types/simc";
import { trackTemplates } from "../../../data/trackDefinitions";
import { bonusUpgradeIndex } from "../../../data/upgradeIndex";
import { ilvlByRank_tww_s3 } from "./ilvlByRank";
import { meta_tww_s3 } from "./season.meta";

const tracks = Object.fromEntries(
  (Object.keys(trackTemplates) as TrackKey[]).map((key) => {
    const template = trackTemplates[key];
    const ilvlByRank = ilvlByRank_tww_s3[key];
    if (!ilvlByRank) throw new Error(`Missing ilvl for track: ${key}`);

    // Validate length vs maxRank
    const expected = template.maxRank;
    const actual = Object.keys(ilvlByRank).length;
    if (actual !== expected) {
      throw new Error(`ilvl length mismatch for ${key}. Expected ${expected}, got ${actual}`);
    }

    const track: Track = { ...template, ilvlByRank };
    return [key, track];
  })
) as Record<TrackKey, Track>;

export const season: SeasonConfig = {
  ...meta_tww_s3,
  tracks,
  bonusUpgradeIndex,
};

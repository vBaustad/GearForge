// src/config/seasons/the_war_within/season_3/raid.data.ts
import type { Crest } from "../../../../types/crests";
import type { TrackKey } from "../../../../features/optimizer/types/simc";

export type RaidDifficulty = "LFR" | "Normal" | "Heroic" | "Mythic";
type TR = { track: TrackKey; rank: number };

export type RaidDropsExplicit = Record<
  RaidDifficulty,
  {
    groups: { "1-3": TR; "4-6": TR; "7-8": TR };
    veryRare: TR;
    crest: Crest;
  }
>;

// Explicit (no ilvl inference)
export const raidDrops_s3: RaidDropsExplicit = {
  LFR: {
    groups:   { "1-3": { track: "Veteran",  rank: 2 }, "4-6": { track: "Veteran",  rank: 3 }, "7-8": { track: "Veteran",  rank: 4 } },
    veryRare: { track: "Veteran",  rank: 8 }, // 691
    crest: "Weathered",
  },
  Normal: {
    groups:   { "1-3": { track: "Champion", rank: 2 }, "4-6": { track: "Champion", rank: 3 }, "7-8": { track: "Champion", rank: 4 } },
    veryRare: { track: "Champion", rank: 8 }, // 704
    crest: "Carved",
  },
  Heroic: {
    groups:   { "1-3": { track: "Hero",     rank: 2 }, "4-6": { track: "Hero",     rank: 3 }, "7-8": { track: "Hero",     rank: 4 } },
    veryRare: { track: "Hero",     rank: 6 }, // 710
    crest: "Runed",
  },
  Mythic: {
    groups:   { "1-3": { track: "Myth",     rank: 2 }, "4-6": { track: "Myth",     rank: 3 }, "7-8": { track: "Myth",     rank: 4 } },
    veryRare: { track: "Myth",     rank: 6 }, // 723
    crest: "Gilded",
  },
};

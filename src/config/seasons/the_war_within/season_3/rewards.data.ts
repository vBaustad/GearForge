import type { Crest } from "../../../../types/crests";
import type { RewardTuple } from "../../utils/rewardsTuples";

/** Spotlight cards for the UI */
export const spotlightLevels_s3 = [2, 6, 7, 10, 12] as const;

/** Raw rewards as tuples: [level, [endTrack, endRank], [vaultTrack, vaultRank], note?] */
export const rewardTuples_s3: RewardTuple[] = [
  [ 2, ["Champion", 6], ["Hero", 1], "10 Runed" ],
  [ 3, ["Champion", 6], ["Hero", 1], "12 Runed" ],
  [ 4, ["Champion", 7], ["Hero", 2], "14 Runed" ],
  [ 5, ["Champion", 8], ["Hero", 2], "16 Runed" ],
  [ 6, ["Hero",     1], ["Hero", 3], "18 Runed" ],
  [ 7, ["Hero",     1], ["Hero", 4], "10 Gilded"],
  [ 8, ["Hero",     2], ["Hero", 4], "12 Gilded"],
  [ 9, ["Hero",     2], ["Hero", 4], "14 Gilded"],
  [10, ["Hero",     3], ["Hero", 5], "16 Gilded"],
  [11, ["Hero",     3], ["Hero", 5], "18 Gilded"],
  [12, ["Hero",     3], ["Hero", 5], "20 Gilded"],
  // TODO: +13..+20
];

/** Crest per key (used for top-right pill) */
export const crestByLevel_s3: Partial<Record<number, Crest>> = {
  2: "Runed", 3: "Runed", 4: "Runed", 5: "Runed", 6: "Runed",
  7: "Gilded", 8: "Gilded", 9: "Gilded", 10: "Gilded", 11: "Gilded", 12: "Gilded",
  // 13–20: "Gilded" (when added)
};

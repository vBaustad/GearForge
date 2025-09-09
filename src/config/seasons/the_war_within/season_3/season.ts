// src/config/seasons/the_war_within/season_3/season.ts
import { composeSeason } from "../../utils/composeSeason";
import { trackTemplates } from "../../../../data/trackDefinitions";
import { bonusUpgradeIndex } from "../../../../data/upgradeIndex";

import { ilvlByRank_tww_s3 as ilvlByRank } from "./ilvlByRank";
import { seasonMeta as meta } from "./season.meta";
import {
  rewardTuples_s3 as rewardTuples,
  crestByLevel_s3 as crestByLevel,
  spotlightLevels_s3 as spotlightLevels,
} from "./rewards.data";

export const season = composeSeason({
  meta,
  ilvlByRank,
  rewardTuples,
  crestByLevel,
  spotlightLevels,
  trackTemplates,
  bonusUpgradeIndex,
});

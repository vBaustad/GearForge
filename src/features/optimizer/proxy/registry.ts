// src/features/optimizer/proxy/registry.ts
import { season } from "../config/seasons/currentSeason"
export { season };
export const tracks = season.tracks;

export {
  bonusUpgradeIndex,
  findUpgradeByBonusIds,
  toTrackKey,
} from "../data/upgradeIndex";
export { trackTemplates } from "../data/trackDefinitions";

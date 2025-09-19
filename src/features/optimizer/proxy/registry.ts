// src/features/optimizer/proxy/registry.ts
import { season } from "../../../config/seasons/currentSeason"; // app-level season

export const tracks = season.tracks;

// expose the *data map* from the active season (OK: no cycles)
export const bonusUpgradeIndex = season.bonusUpgradeIndex;

// expose the helpers from the season-aware wrapper
export {
  findUpgradeByBonusIds,
  toTrackKey,
} from "../../../data/upgradeIndex";

export { trackTemplates } from "../../../data/trackDefinitions";

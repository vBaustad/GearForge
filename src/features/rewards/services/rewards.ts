import type { RewardsViewData } from "../types/rewards";
import { rewardsRowsRaw, rewardsSpotlight, rewardsSeasonName, resolveIlvl } from "../proxy/registry";

function tierForLevel(level: number): "low" | "mid" | "high" | "cap" {
  if (level >= 20) return "cap";
  if (level >= 10) return "high";
  if (level >= 6) return "mid";
  return "low";
}

export const rewardsData: RewardsViewData = {
  seasonName: rewardsSeasonName,
  spotlightLevels: rewardsSpotlight,
  rows: rewardsRowsRaw
    .slice()
    .sort((a, b) => a.level - b.level)
    .map(r => ({
      level: r.level,
      endOfDungeonIlvl: resolveIlvl(r.end.track, r.end.rank),
      vaultIlvl:        resolveIlvl(r.vault.track, r.vault.rank),
      tier: tierForLevel(r.level),
      note: r.note,
    })),
};

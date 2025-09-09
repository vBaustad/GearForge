// src/features/rewards/services/rewards.ts
import type { RewardsViewData } from "../types/rewards";
import { rewardsRowsRaw, rewardsSpotlight, rewardsSeasonName, resolveIlvl } from "../proxy/registry";
import { season } from "../../../config/seasons/currentSeason";
import type { Crest } from "../../../types/crests";
import { CREST_ICONS } from "../../../components/crests/crests";

function tierForLevel(level: number): "low" | "mid" | "high" | "cap" {
  if (level >= 20) return "cap";
  if (level >= 10) return "high";
  if (level >= 6)  return "mid";
  return "low";
}

function crestForLevel(level: number): Crest | undefined {
  return season.rewards.crestByLevel?.[level];
}

export const rewardsData: RewardsViewData = {
  seasonName: rewardsSeasonName,
  spotlightLevels: rewardsSpotlight,
  rows: rewardsRowsRaw
    .slice()
    .sort((a, b) => a.level - b.level)
    .map((r) => {
      const endTrack   = r.end.track;
      const endRank    = r.end.rank;
      const endMax     = season.tracks[endTrack]?.maxRank;

      const vaultTrack = r.vault.track;
      const vaultRank  = r.vault.rank;
      const vaultMax   = season.tracks[vaultTrack]?.maxRank;

      const crestTier  = crestForLevel(r.level);
      const crestIcon  = crestTier ? CREST_ICONS[crestTier] : undefined;

      return {
        level: r.level,
        endOfDungeonIlvl: resolveIlvl(endTrack, endRank),
        vaultIlvl:        resolveIlvl(vaultTrack, vaultRank),

        endTrack,  endRank,  endMax,
        vaultTrack, vaultRank, vaultMax,

        crest: crestTier ? { tier: crestTier, icon: crestIcon } : undefined,
        tier: tierForLevel(r.level),
        note: r.note,
      };
    }),
};

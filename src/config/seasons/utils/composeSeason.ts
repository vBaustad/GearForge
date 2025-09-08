import type { SeasonConfig } from "../../../types/season";
import type { Track, TrackKey } from "../../../features/optimizer/types/simc";
import { buildTracks } from "./buildTracks";
import { tuplesToRows, type RewardTuple } from "./rewardsTuples";
import { validateRewardsRows } from "./validate";

type ComposeArgs = {
  meta: Pick<
    SeasonConfig,
    | "id" | "name" | "defaultDropCeilingIlvl"
    | "currencies"
    | "crestWeeklyIncrement"
    | "crestCapStartDateISO"
    | "noCrestUpgradeItemIds"
    | "progression"
  >;
  ilvlByRank: Record<TrackKey, Record<number, number>>;
  rewardTuples: RewardTuple[];
  crestByLevel?: SeasonConfig["rewards"]["crestByLevel"];
  spotlightLevels: ReadonlyArray<number>;
  trackTemplates: Record<TrackKey, Omit<Track, "ilvlByRank">>;
  bonusUpgradeIndex: SeasonConfig["bonusUpgradeIndex"];
};

export function composeSeason(args: ComposeArgs): SeasonConfig {
  const tracks = buildTracks(args.trackTemplates, args.ilvlByRank);
  const rows   = tuplesToRows(args.rewardTuples);

  if (import.meta.env?.MODE !== "production") {
    validateRewardsRows(rows, tracks as Record<TrackKey, Track>);
  }

  return {
    ...args.meta,
    tracks,
    bonusUpgradeIndex: args.bonusUpgradeIndex,
    rewards: {
      spotlightLevels: [...args.spotlightLevels],
      rows,
      crestByLevel: args.crestByLevel,
    },
  };
}
// src/features/optimizer/types/season.ts
import type { Crest, Track, TrackKey } from "./simc";
import type { UpgradeIndex } from "./upgrades";

/** Everything you change next season lives in the season config. */
export interface SeasonConfig {
  id: string;
  defaultDropCeilingIlvl: number;

  currencies: {
    weathered: number;
    carved: number;
    runed: number;
    gilded: number;
    flightstones?: number;
  };

  crestWeeklyIncrement: Record<Crest, number>;
  crestCapStartDateISO: Record<Crest, string>;

  tracks: Record<TrackKey, Track>;
  noCrestUpgradeItemIds: number[];

  /** Wowhead bonus→track/rank index for this season/system. */
  bonusUpgradeIndex: UpgradeIndex;
}

// src/types/season.ts
import type { Crest } from "./crests";
import type { Track, TrackKey } from "../features/optimizer/types/simc"
import type { UpgradeIndex } from "../features/optimizer/types/upgrades";

// NEW: season-scoped progression rules
export interface SeasonProgression {
  sparks: {
    startISO: string;        // UTC ISO
    ratePerWeek?: number;    // default 0.5
    cap?: number;            // optional
  };
  catalyst: {
    startISO: string;        // UTC ISO
    cadenceWeeks?: number;   // default 2 (every other week)
    cap?: number;            // optional
  };
}

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

  // NEW: add this
  progression: SeasonProgression;

  tracks: Record<TrackKey, Track>;
  noCrestUpgradeItemIds: number[];
  bonusUpgradeIndex: UpgradeIndex;
}

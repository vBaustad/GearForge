// src/types/season.ts
import type { Crest } from "./crests";
import type { Track, TrackKey } from "../features/optimizer/types/simc";
import type { UpgradeIndex } from "../features/optimizer/types/upgrades";

// --- NEW: Rewards types ---
export interface MPlusPair {
  track: TrackKey;  // e.g., "Adventurer"
  rank: number;     // 1..maxRank of that track
}

export interface MPlusRewardRow {
  level: number;          // Keystone level (2..20)
  end: MPlusPair;         // End-of-dungeon reward (track+rank)
  vault: MPlusPair;       // Great Vault reward (track+rank)
  note?: string;
}

export interface SeasonRewards {
  /**
   * Raw mapping per M+ level. UI can show track/rank directly,
   * or resolve to ilvl using the season’s ilvlByRank tables.
   */
  rows: MPlusRewardRow[];
  /**
   * Keystone levels to spotlight as “BAM” cards.
   * e.g. [2, 5, 10, 15, 20]
   */
  spotlightLevels: number[];
}

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
  progression: SeasonProgression;

  tracks: Record<TrackKey, Track>;
  noCrestUpgradeItemIds: number[];
  bonusUpgradeIndex: UpgradeIndex;

  // --- NEW: rewards block (season-driven) ---
  rewards: SeasonRewards;
}

// src/types/season.ts
import type { Crest } from "./crests";
import type { Track, TrackKey } from "../features/optimizer/types/simc";
import type { UpgradeIndex } from "../features/optimizer/types/upgrades";

// --- Rewards types ---
export interface MPlusPair {
  track: TrackKey;   // e.g., "Adventurer" | "Veteran" | "Champion" | "Hero" | "Myth" | "Explorer"
  rank: number;      // 1..maxRank of that track
}

export interface MPlusRewardRow {
  level: number;     // Keystone level (2..20)
  end: MPlusPair;    // End-of-dungeon reward (track+rank) — explicit, not inferred
  vault: MPlusPair;  // Great Vault reward (track+rank) — explicit, not inferred
  note?: string;     // e.g., "10 Runed", "12 Gilded"
}

/** Optional block for non-keystone base dungeons shown in the UI header */
export interface BaseDungeonRow {
  kind: "Heroic" | "Mythic0";
  end: MPlusPair;
  vault: MPlusPair;
  note?: string;     // e.g., "Weathered", "15 Carved"
}

export interface SeasonRewards {
  /**
   * Raw mapping per M+ key level. UI resolves ilvl via season.tracks[*].ilvlByRank,
   * but *labels* (track/rank) are authoritative here to avoid overlap ambiguity.
   */
  rows: MPlusRewardRow[];

  /** Keystone levels to spotlight as “BAM” cards (e.g. [2, 6, 7, 10, 12]). */
  spotlightLevels: number[];

  /** Season-defined crest tier by keystone level (UI shouldn’t guess rules). */
  crestByLevel?: Partial<Record<number, Crest>>;

  /** Optional base-dungeon rows (Heroic & Mythic0) above the key table. */
  baseDungeons?: BaseDungeonRow[];
}

// --- season-scoped progression rules ---
export interface SeasonProgression {
  sparks: {
    startISO: string;       // UTC ISO
    ratePerWeek?: number;   // default 0.5
    cap?: number;           // optional
  };
  catalyst: {
    startISO: string;       // UTC ISO
    cadenceWeeks?: number;  // default 2 (every other week)
    cap?: number;           // optional
  };
}

export interface SeasonConfig {
  id: string;
  /** Optional human-readable season name (lets us avoid casting hacks). */
  name?: string;

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

  // --- rewards (season-driven) ---
  rewards: SeasonRewards;
}

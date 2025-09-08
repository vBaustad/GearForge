// src/features/rewards/types/rewards.ts
import type { Crest } from "../../../types/crests";
import type { TrackKey } from "../../optimizer/types/simc";

export interface RewardRowUI {
  level: number;
  endOfDungeonIlvl: number;
  vaultIlvl: number;

  // Track/rank (typed to canonical TrackKey)
  endTrack: TrackKey;
  endRank: number;
  endMax: number;

  vaultTrack: TrackKey;
  vaultRank: number;
  vaultMax: number;

  // Crest info (season-driven)
  // id = currency id from season.currencies (optional but handy for tooltips/links)
  // icon = resolved URL from your crest icon helper (optional)
  crest?: { tier: Crest; id?: number; icon?: string; label?: string };

  // UI tier buckets for styling
  tier?: "low" | "mid" | "high" | "cap";

  // Freeform helper text like "10 Runed", "16 Gilded"
  note?: string;
}

export interface RewardsViewData {
  seasonName: string;
  spotlightLevels: number[];
  rows: RewardRowUI[];
}

export interface RewardRowUI {
  level: number;
  endOfDungeonIlvl: number;
  vaultIlvl: number;
  tier?: "low" | "mid" | "high" | "cap";
  note?: string;
}

export interface RewardsViewData {
  seasonName: string;
  spotlightLevels: number[];
  rows: RewardRowUI[];
}

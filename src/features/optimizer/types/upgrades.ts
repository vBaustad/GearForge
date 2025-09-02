export type BonusUpgrade = {
  group: number;
  level: number;
  max: number;
  name: string;
  fullName: string;
};

export type UpgradeIndex = Record<number, BonusUpgrade>;

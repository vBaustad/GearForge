// src/features/optimizer/types/simc.ts

/** Crest tiers used for upgrades */
export type Crest = "Weathered" | "Carved" | "Runed" | "Gilded";

/** Upgrade track families (see tracks.ts) */
export type TrackKey = "Explorer" | "Adventurer" | "Veteran" | "Champion" | "Hero" | "Myth";

export type CurrencyId = number;
export type ItemId = number;
export type AchievementId = number;

export type SlotIndex = 1|2|3|4|5|6|7|8|9|10|11|12|13|14|15|16|17;

export type SlotWatermark = { slot: SlotIndex; current: number; max: number };

export type CatalystCurrency = { currencyId: CurrencyId; quantity: number };
export type UpgradeWalletEntry =
  | { kind: "currency"; currencyId: CurrencyId; quantity: number }
  | { kind: "item"; itemId: ItemId; quantity: number };

export interface CharacterUpgradeContext {
  catalyst: CatalystCurrency[];
  wallet: UpgradeWalletEntry[];
  watermarks: SlotWatermark[];
  achievements: AchievementId[];
}

export type CostVector = {
  currencies?: { currencyId: CurrencyId; amount: number }[];
  items?: { itemId: ItemId; amount: number }[];
  caps?: Record<string, number>;
};

/** One upgrade step (rank n → n+1) */
export interface TrackStep {
  from: number;        // rank n
  to: number;          // rank n+1
  crest: Crest;        // which crest this step costs
  cost: number;        // cost in crests (Season 3 = 15)
}

/** Track definition for a family (e.g., Champion 1–8) */
export interface Track {
  key: TrackKey;
  maxRank: number;
  /** 1-indexed rank → ilvl mapping */
  ilvlByRank: Record<number, number>;
  /** Should have length (maxRank - 1) */
  steps: TrackStep[];
}

/** Slots we care about */
export type SlotKey =
  | "head" | "neck" | "shoulder" | "back" | "chest" 
  | "wrist" | "hands" | "waist" | "legs" | "feet" | "finger1" | "finger2"
  | "trinket1" | "trinket2" | "main_hand" | "off_hand";

/** One line parsed from a SimC string (equipped item) */
export interface ParsedItem {
  slot: string;
  id: number;
  name?: string;
  ilvl?: number;
  enchantId?: number;
  gemIds?: number[];
  bonusIds?: number[];
  raw?: string;
  crafted?: boolean;
}

export interface ItemState {
  slot: SlotKey;
  track: TrackKey;
  rank: number;
  name?: string;
  ilvl?: number;
  id?: number;
  crafted?: boolean;
}


/** Player constraints for planning */
export interface PlayerContext {
  /** The highest ilvl you can reasonably LOOT (content ceiling). */
  dropCeilingIlvl: number;
  /** If true, ignore the ceiling and push to max. */
  ignoreCeiling?: boolean;
}

/** Single rank→rank+1 step in a plan */
export interface StepPlan {
  from: number;
  to: number;
  crest: Crest;
  cost: number;      // always 15 (S3)
  newIlvl: number;   // ilvl at 'to'
}

/** Plan result for one item */
export interface ItemPlan {
  slot: SlotKey;
  fromRank: number;
  toRank: number;
  fromIlvl: number;
  toIlvl: number;
  steps: StepPlan[];
  crestTotals: Partial<Record<Crest, number>>;
  note?: string;
}

/** Aggregate result across items */
export interface PlanAllResult {
  plans: ItemPlan[];
  totals: Partial<Record<Crest, number>>;
}

/** Encoded payload in URL hash */
export interface SimcPayload {
  simc: string;
  ceilingIlvl?: number;     // content ceiling
  ignoreCeiling?: boolean;  // ignore ceiling and push to max
}

export type ProfessionRank = { name: string; value: number };

export type CharacterMeta = {
  name: string | null;
  className: string | null;         // e.g., "druid"
  spec: string | null;              // e.g., "balance"
  level: number | null;
  race: string | null;              // e.g., "night_elf"
  region: string | null;            // e.g., "eu"
  server: string | null;            // e.g., "stormscale"
  role: string | null;              // e.g., "spell"
  professions: ProfessionRank[];    // parsed from alchemy=100/jewelcrafting=100
  talentsString: string | null;     // current active talents line
  savedLoadouts: Array<{ name: string; talents: string }>;

  // Optional niceties for UI/linking
  headerLineSpec: string | null;    // parsed from first header line if present ("Balance")
  headerLineTimestamp: string | null; // e.g., "2025-08-31 14:43"
  headerLineRegionRealm: string | null; // e.g., "EU/Stormscale"

  // Convenience
  armoryUrl?: string;
};
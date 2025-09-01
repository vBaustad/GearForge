// src/features/optimizer/config/season.ts
import type { Crest, Track, TrackKey } from "../types/simc";

/** Everything you change next season lives here. */
export interface SeasonConfig {
  id: string;
  defaultDropCeilingIlvl: number;

  /** Currency IDs from SimC upgrade_currencies line. */
  currencies: {
    weathered: number; // e.g. 3284
    carved: number;    // 3286
    runed: number;     // 3288
    gilded: number;    // 3290
    flightstones?: number; // 3008 (optional; we ignore for planner)
  };

  /** Crest weekly cap math. */
  crestWeeklyIncrement: Record<Crest, number>;
  crestCapStartDateISO: Record<Crest, string>;

  /** Rank→ilvl, and step cost (15 each) per track. */
  tracks: Record<TrackKey, Track>;

  /** Items that don’t use the standard crest upgrade track. */
  noCrestUpgradeItemIds: number[];

  /** Wowhead bonus→track/rank index for this season. */
  bonusUpgradeIndex: Record<number, {
    group: number;
    level: number;
    max: number;
    name: string;
    fullName: string;
  }>;
}

export const season: SeasonConfig = {
  id: "tww-s3",
  defaultDropCeilingIlvl: 701, // natural Hero r3 drop

  currencies: {
    weathered: 3284,
    carved:    3286,
    runed:     3288,
    gilded:    3290,
    flightstones: 3008,
  },

  crestWeeklyIncrement: {
    Weathered: 90, Carved: 90, Runed: 90, Gilded: 90,
  },

  // Set to your real regional open dates if you want precise week math
  crestCapStartDateISO: {
    Weathered: "2025-08-06",
    Carved:    "2025-08-06",
    Runed:     "2025-08-13",
    Gilded:    "2025-08-13",
  },

  tracks: {
    Explorer: {
    key: "Explorer",
    maxRank: 8,
    // Adventurer is +13 over Explorer; this set is 13 below Adventurer.
    ilvlByRank: {
      1: 642, 2: 645, 3: 649, 4: 652, 5: 655, 6: 658, 7: 662, 8: 665,
    },
    // Flightstones-only: mark crest steps with cost 0 so they don't appear in totals.
    steps: [
      { from: 1, to: 2, crest: "Weathered", cost: 0 },
      { from: 2, to: 3, crest: "Weathered", cost: 0 },
      { from: 3, to: 4, crest: "Weathered", cost: 0 },
      { from: 4, to: 5, crest: "Weathered", cost: 0 },
      { from: 5, to: 6, crest: "Weathered", cost: 0 },
      { from: 6, to: 7, crest: "Weathered", cost: 0 },
      { from: 7, to: 8, crest: "Weathered", cost: 0 },
    ],
  },
  Adventurer: {
    key: "Adventurer",
    maxRank: 8,
    // Veteran is +13 over Adventurer. Pattern matches the +3/+4 cadence.
    ilvlByRank: {
      1: 655, 2: 658, 3: 662, 4: 665, 5: 668, 6: 671, 7: 675, 8: 678,
    },
    steps: [
      // 1–4 are flightstones-only
      { from: 1, to: 2, crest: "Weathered", cost: 0 },
      { from: 2, to: 3, crest: "Weathered", cost: 0 },
      { from: 3, to: 4, crest: "Weathered", cost: 0 },
      // 4→5 and above cost Weathered
      { from: 4, to: 5, crest: "Weathered", cost: 15 },
      { from: 5, to: 6, crest: "Weathered", cost: 15 },
      { from: 6, to: 7, crest: "Weathered", cost: 15 },
      { from: 7, to: 8, crest: "Weathered", cost: 15 },
    ],
  },
    Veteran: {
      key: "Veteran",
      maxRank: 8,
      ilvlByRank: { 1:668, 2:671, 3:675, 4:678, 5:681, 6:684, 7:688, 8:691 },
      steps: [
        { from:1, to:2, crest:"Weathered", cost:15 },
        { from:2, to:3, crest:"Weathered", cost:15 },
        { from:3, to:4, crest:"Weathered", cost:15 },
        { from:4, to:5, crest:"Carved",    cost:15 },
        { from:5, to:6, crest:"Carved",    cost:15 },
        { from:6, to:7, crest:"Carved",    cost:15 },
        { from:7, to:8, crest:"Carved",    cost:15 },
      ],
    },
    Champion: {
      key: "Champion",
      maxRank: 8,
      ilvlByRank: { 1:681, 2:684, 3:688, 4:691, 5:694, 6:697, 7:701, 8:704 },
      steps: [
        { from:1, to:2, crest:"Carved", cost:15 },
        { from:2, to:3, crest:"Carved", cost:15 },
        { from:3, to:4, crest:"Carved", cost:15 },
        { from:4, to:5, crest:"Runed",  cost:15 },
        { from:5, to:6, crest:"Runed",  cost:15 },
        { from:6, to:7, crest:"Runed",  cost:15 },
        { from:7, to:8, crest:"Runed",  cost:15 },
      ],
    },
    Hero: {
      key: "Hero",
      maxRank: 6,
      ilvlByRank: { 1:694, 2:697, 3:701, 4:704, 5:707, 6:710 },
      steps: [
        { from:1, to:2, crest:"Runed",  cost:15 },
        { from:2, to:3, crest:"Runed",  cost:15 },
        { from:3, to:4, crest:"Runed",  cost:15 },
        { from:4, to:5, crest:"Gilded", cost:15 },
        { from:5, to:6, crest:"Gilded", cost:15 },
      ],
    },
    Myth: {
      key: "Myth",
      maxRank: 6,
      ilvlByRank: { 1:707, 2:710, 3:714, 4:717, 5:720, 6:723 },
      steps: [
        { from:1, to:2, crest:"Gilded", cost:15 },
        { from:2, to:3, crest:"Gilded", cost:15 },
        { from:3, to:4, crest:"Gilded", cost:15 },
        { from:4, to:5, crest:"Gilded", cost:15 },
        { from:5, to:6, crest:"Gilded", cost:15 },
      ],
    },
  },

  noCrestUpgradeItemIds: [
    235499, // Reshii Wraps (season cloak)
    245964, // Durable Information Securing Container (old-season belt)
  ],

  // Bonus → track/rank (your curated map moved here)
  bonusUpgradeIndex: {
    // Explorer 513 1–8
    12265:{group:513,level:1,max:8,name:"Explorer",fullName:"Explorer 1/8"},
    12266:{group:513,level:2,max:8,name:"Explorer",fullName:"Explorer 2/8"},
    12267:{group:513,level:3,max:8,name:"Explorer",fullName:"Explorer 3/8"},
    12268:{group:513,level:4,max:8,name:"Explorer",fullName:"Explorer 4/8"},
    12269:{group:513,level:5,max:8,name:"Explorer",fullName:"Explorer 5/8"},
    12270:{group:513,level:6,max:8,name:"Explorer",fullName:"Explorer 6/8"},
    12271:{group:513,level:7,max:8,name:"Explorer",fullName:"Explorer 7/8"},
    12272:{group:513,level:8,max:8,name:"Explorer",fullName:"Explorer 8/8"},
    // Adventurer 514 1–8
    12274:{group:514,level:1,max:8,name:"Adventurer",fullName:"Adventurer 1/8"},
    12275:{group:514,level:2,max:8,name:"Adventurer",fullName:"Adventurer 2/8"},
    12276:{group:514,level:3,max:8,name:"Adventurer",fullName:"Adventurer 3/8"},
    12277:{group:514,level:4,max:8,name:"Adventurer",fullName:"Adventurer 4/8"},
    12278:{group:514,level:5,max:8,name:"Adventurer",fullName:"Adventurer 5/8"},
    12279:{group:514,level:6,max:8,name:"Adventurer",fullName:"Adventurer 6/8"},
    12280:{group:514,level:7,max:8,name:"Adventurer",fullName:"Adventurer 7/8"},
    12281:{group:514,level:8,max:8,name:"Adventurer",fullName:"Adventurer 8/8"},
    // Veteran 515 1–8
    12282:{group:515,level:1,max:8,name:"Veteran",fullName:"Veteran 1/8"},
    12283:{group:515,level:2,max:8,name:"Veteran",fullName:"Veteran 2/8"},
    12284:{group:515,level:3,max:8,name:"Veteran",fullName:"Veteran 3/8"},
    12285:{group:515,level:4,max:8,name:"Veteran",fullName:"Veteran 4/8"},
    12286:{group:515,level:5,max:8,name:"Veteran",fullName:"Veteran 5/8"},
    12287:{group:515,level:6,max:8,name:"Veteran",fullName:"Veteran 6/8"},
    12288:{group:515,level:7,max:8,name:"Veteran",fullName:"Veteran 7/8"},
    12289:{group:515,level:8,max:8,name:"Veteran",fullName:"Veteran 8/8"},
    // Champion 516 1–8
    12290:{group:516,level:1,max:8,name:"Champion",fullName:"Champion 1/8"},
    12291:{group:516,level:2,max:8,name:"Champion",fullName:"Champion 2/8"},
    12292:{group:516,level:3,max:8,name:"Champion",fullName:"Champion 3/8"},
    12293:{group:516,level:4,max:8,name:"Champion",fullName:"Champion 4/8"},
    12294:{group:516,level:5,max:8,name:"Champion",fullName:"Champion 5/8"},
    12295:{group:516,level:6,max:8,name:"Champion",fullName:"Champion 6/8"},
    12296:{group:516,level:7,max:8,name:"Champion",fullName:"Champion 7/8"},
    12297:{group:516,level:8,max:8,name:"Champion",fullName:"Champion 8/8"},
    // Hero 517 1–6
    12350:{group:517,level:1,max:6,name:"Hero",fullName:"Hero 1/6"},
    12351:{group:517,level:2,max:6,name:"Hero",fullName:"Hero 2/6"},
    12352:{group:517,level:3,max:6,name:"Hero",fullName:"Hero 3/6"},
    12353:{group:517,level:4,max:6,name:"Hero",fullName:"Hero 4/6"},
    12354:{group:517,level:5,max:6,name:"Hero",fullName:"Hero 5/6"},
    12355:{group:517,level:6,max:6,name:"Hero",fullName:"Hero 6/6"},
    // Myth 518 1–6
    12356:{group:518,level:1,max:6,name:"Myth",fullName:"Myth 1/6"},
    12357:{group:518,level:2,max:6,name:"Myth",fullName:"Myth 2/6"},
    12358:{group:518,level:3,max:6,name:"Myth",fullName:"Myth 3/6"},
    12359:{group:518,level:4,max:6,name:"Myth",fullName:"Myth 4/6"},
    12360:{group:518,level:5,max:6,name:"Myth",fullName:"Myth 5/6"},
    12361:{group:518,level:6,max:6,name:"Myth",fullName:"Myth 6/6"},
  },
};

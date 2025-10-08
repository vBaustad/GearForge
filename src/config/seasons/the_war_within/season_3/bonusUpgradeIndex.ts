import type { TrackKey } from "../../../../features/optimizer/types/simc";

/** A single upgrade-bonus entry for this season. */
export type BonusUpgrade = {
  group: number;   // Wowhead "upgrade group" (e.g., 513..518)
  level: number;   // rank number within the track (1..max)
  max: number;     // max ranks for that track
  name: TrackKey;  // "Explorer" | "Adventurer" | "Veteran" | "Champion" | "Hero" | "Myth"
  fullName: string;
};

//UPDATE FOR TURBO BOOST

/** Season-local map: bonusId -> upgrade metadata. */
export type SeasonBonusIndex = Record<number, BonusUpgrade>;

/** Season 3: Wowhead upgrade-bonus → (track, rank, etc.) */
// export const bonusUpgradeIndex: SeasonBonusIndex = {
//   // Explorer (group 513) 1–8
//   12265:{group:513,level:1,max:8,name:"Explorer",fullName:"Explorer 1/8"},
//   12266:{group:513,level:2,max:8,name:"Explorer",fullName:"Explorer 2/8"},
//   12267:{group:513,level:3,max:8,name:"Explorer",fullName:"Explorer 3/8"},
//   12268:{group:513,level:4,max:8,name:"Explorer",fullName:"Explorer 4/8"},
//   12269:{group:513,level:5,max:8,name:"Explorer",fullName:"Explorer 5/8"},
//   12270:{group:513,level:6,max:8,name:"Explorer",fullName:"Explorer 6/8"},
//   12271:{group:513,level:7,max:8,name:"Explorer",fullName:"Explorer 7/8"},
//   12272:{group:513,level:8,max:8,name:"Explorer",fullName:"Explorer 8/8"},

//   // Adventurer (group 514) 1–8
//   12274:{group:514,level:1,max:8,name:"Adventurer",fullName:"Adventurer 1/8"},
//   12275:{group:514,level:2,max:8,name:"Adventurer",fullName:"Adventurer 2/8"},
//   12276:{group:514,level:3,max:8,name:"Adventurer",fullName:"Adventurer 3/8"},
//   12277:{group:514,level:4,max:8,name:"Adventurer",fullName:"Adventurer 4/8"},
//   12278:{group:514,level:5,max:8,name:"Adventurer",fullName:"Adventurer 5/8"},
//   12279:{group:514,level:6,max:8,name:"Adventurer",fullName:"Adventurer 6/8"},
//   12280:{group:514,level:7,max:8,name:"Adventurer",fullName:"Adventurer 7/8"},
//   12281:{group:514,level:8,max:8,name:"Adventurer",fullName:"Adventurer 8/8"},

//   // Veteran (group 515) 1–8
//   12282:{group:515,level:1,max:8,name:"Veteran",fullName:"Veteran 1/8"},
//   12283:{group:515,level:2,max:8,name:"Veteran",fullName:"Veteran 2/8"},
//   12284:{group:515,level:3,max:8,name:"Veteran",fullName:"Veteran 3/8"},
//   12285:{group:515,level:4,max:8,name:"Veteran",fullName:"Veteran 4/8"},
//   12286:{group:515,level:5,max:8,name:"Veteran",fullName:"Veteran 5/8"},
//   12287:{group:515,level:6,max:8,name:"Veteran",fullName:"Veteran 6/8"},
//   12288:{group:515,level:7,max:8,name:"Veteran",fullName:"Veteran 7/8"},
//   12289:{group:515,level:8,max:8,name:"Veteran",fullName:"Veteran 8/8"},

//   // Champion (group 516) 1–8
//   12290:{group:516,level:1,max:8,name:"Champion",fullName:"Champion 1/8"},
//   12291:{group:516,level:2,max:8,name:"Champion",fullName:"Champion 2/8"},
//   12292:{group:516,level:3,max:8,name:"Champion",fullName:"Champion 3/8"},
//   12293:{group:516,level:4,max:8,name:"Champion",fullName:"Champion 4/8"},
//   12294:{group:516,level:5,max:8,name:"Champion",fullName:"Champion 5/8"},
//   12295:{group:516,level:6,max:8,name:"Champion",fullName:"Champion 6/8"},
//   12296:{group:516,level:7,max:8,name:"Champion",fullName:"Champion 7/8"},
//   12297:{group:516,level:8,max:8,name:"Champion",fullName:"Champion 8/8"},

//   // Hero (group 517) 1–6
//   12350:{group:517,level:1,max:6,name:"Hero",fullName:"Hero 1/6"},
//   12351:{group:517,level:2,max:6,name:"Hero",fullName:"Hero 2/6"},
//   12352:{group:517,level:3,max:6,name:"Hero",fullName:"Hero 3/6"},
//   12353:{group:517,level:4,max:6,name:"Hero",fullName:"Hero 4/6"},
//   12354:{group:517,level:5,max:6,name:"Hero",fullName:"Hero 5/6"},
//   12355:{group:517,level:6,max:6,name:"Hero",fullName:"Hero 6/6"},

//   // Myth (group 518) 1–6
//   12356:{group:518,level:1,max:6,name:"Myth",fullName:"Myth 1/6"},
//   12357:{group:518,level:2,max:6,name:"Myth",fullName:"Myth 2/6"},
//   12358:{group:518,level:3,max:6,name:"Myth",fullName:"Myth 3/6"},
//   12359:{group:518,level:4,max:6,name:"Myth",fullName:"Myth 4/6"},
//   12360:{group:518,level:5,max:6,name:"Myth",fullName:"Myth 5/6"},
//   12361:{group:518,level:6,max:6,name:"Myth",fullName:"Myth 6/6"},
// } as const;

export const bonusUpgradeIndex: SeasonBonusIndex = {
  // Explorer (group 513) 1–8
  12265:{group:513,level:1,max:8,name:"Explorer",fullName:"Explorer 1/8"},
  12266:{group:513,level:2,max:8,name:"Explorer",fullName:"Explorer 2/8"},
  12267:{group:513,level:3,max:8,name:"Explorer",fullName:"Explorer 3/8"},
  12268:{group:513,level:4,max:8,name:"Explorer",fullName:"Explorer 4/8"},
  12269:{group:513,level:5,max:8,name:"Explorer",fullName:"Explorer 5/8"},
  12270:{group:513,level:6,max:8,name:"Explorer",fullName:"Explorer 6/8"},
  12271:{group:513,level:7,max:8,name:"Explorer",fullName:"Explorer 7/8"},
  12272:{group:513,level:8,max:8,name:"Explorer",fullName:"Explorer 8/8"},

  // Adventurer (group 514) 1–8
  12274:{group:514,level:1,max:8,name:"Adventurer",fullName:"Adventurer 1/8"},
  12275:{group:514,level:2,max:8,name:"Adventurer",fullName:"Adventurer 2/8"},
  12276:{group:514,level:3,max:8,name:"Adventurer",fullName:"Adventurer 3/8"},
  12277:{group:514,level:4,max:8,name:"Adventurer",fullName:"Adventurer 4/8"},
  12278:{group:514,level:5,max:8,name:"Adventurer",fullName:"Adventurer 5/8"},
  12279:{group:514,level:6,max:8,name:"Adventurer",fullName:"Adventurer 6/8"},
  12280:{group:514,level:7,max:8,name:"Adventurer",fullName:"Adventurer 7/8"},
  12281:{group:514,level:8,max:8,name:"Adventurer",fullName:"Adventurer 8/8"},

  // Veteran (group 515) 1–8
  12282:{group:515,level:1,max:8,name:"Veteran",fullName:"Veteran 1/8"},
  12283:{group:515,level:2,max:8,name:"Veteran",fullName:"Veteran 2/8"},
  12284:{group:515,level:3,max:8,name:"Veteran",fullName:"Veteran 3/8"},
  12285:{group:515,level:4,max:8,name:"Veteran",fullName:"Veteran 4/8"},
  12286:{group:515,level:5,max:8,name:"Veteran",fullName:"Veteran 5/8"},
  12287:{group:515,level:6,max:8,name:"Veteran",fullName:"Veteran 6/8"},
  12288:{group:515,level:7,max:8,name:"Veteran",fullName:"Veteran 7/8"},
  12289:{group:515,level:8,max:8,name:"Veteran",fullName:"Veteran 8/8"},

  // Champion (group 516) 1–8
  12290:{group:516,level:1,max:8,name:"Champion",fullName:"Champion 1/8"},
  12291:{group:516,level:2,max:8,name:"Champion",fullName:"Champion 2/8"},
  12292:{group:516,level:3,max:8,name:"Champion",fullName:"Champion 3/8"},
  12293:{group:516,level:4,max:8,name:"Champion",fullName:"Champion 4/8"},
  12294:{group:516,level:5,max:8,name:"Champion",fullName:"Champion 5/8"},
  12295:{group:516,level:6,max:8,name:"Champion",fullName:"Champion 6/8"},
  12296:{group:516,level:7,max:8,name:"Champion",fullName:"Champion 7/8"},
  12297:{group:516,level:8,max:8,name:"Champion",fullName:"Champion 8/8"},

  // Hero (group 517) 1–6
  12350:{group:517,level:1,max:8,name:"Hero",fullName:"Hero 1/8"},
  12351:{group:517,level:2,max:8,name:"Hero",fullName:"Hero 2/8"},
  12352:{group:517,level:3,max:8,name:"Hero",fullName:"Hero 3/8"},
  12353:{group:517,level:4,max:8,name:"Hero",fullName:"Hero 4/8"},
  12354:{group:517,level:5,max:8,name:"Hero",fullName:"Hero 5/8"},
  12355:{group:517,level:6,max:8,name:"Hero",fullName:"Hero 6/8"},
  13443:{group:517,level:7,max:8,name:"Hero",fullName:"Hero 7/8"},
  13444:{group:517,level:8,max:8,name:"Hero",fullName:"Hero 8/8"},

  // Myth (group 518) 1–6
  12356:{group:518,level:1,max:8,name:"Myth",fullName:"Myth 1/8"},
  12357:{group:518,level:2,max:8,name:"Myth",fullName:"Myth 2/8"},
  12358:{group:518,level:3,max:8,name:"Myth",fullName:"Myth 3/8"},
  12359:{group:518,level:4,max:8,name:"Myth",fullName:"Myth 4/8"},
  12360:{group:518,level:5,max:8,name:"Myth",fullName:"Myth 5/8"},
  12361:{group:518,level:6,max:8,name:"Myth",fullName:"Myth 6/8"},
  13445:{group:518,level:7,max:8,name:"Myth",fullName:"Myth 7/8"},
  13446:{group:518,level:8,max:8,name:"Myth",fullName:"Myth 8/8"},
} as const;

/** Optional: convenience alias map (group → TrackKey) */
export const groupToTrack: Readonly<Record<number, TrackKey | undefined>> = {
  513:"Explorer",
  514:"Adventurer",
  515:"Veteran",
  516:"Champion",
  517:"Hero",
  518:"Myth",
} as const;

// src/features/optimizer/data/UpgradeIndex.ts
import type { TrackKey } from "../types/simc";
import { tracks } from "../services/tracks";

/** Minimal metadata for each upgrade bonus id. */
export type BonusUpgrade = {
  group: 513 | 514 | 515 | 516 | 517 | 518; // Explorer..Myth
  level: number;                             // 1..8 (or 1..6)
  max: number;                               // 8 or 6
  name: "Explorer" | "Adventurer" | "Veteran" | "Champion" | "Hero" | "Myth";
  fullName: string;                          // e.g. "Hero 4/6"
};

/** Map bonus id -> metadata (S1). */
export const BONUS_UPGRADE_INDEX: Record<number, BonusUpgrade> = {
  // Explorer (513, 1–8)
  12265:{group:513,level:1,max:8,name:"Explorer",fullName:"Explorer 1/8"},
  12266:{group:513,level:2,max:8,name:"Explorer",fullName:"Explorer 2/8"},
  12267:{group:513,level:3,max:8,name:"Explorer",fullName:"Explorer 3/8"},
  12268:{group:513,level:4,max:8,name:"Explorer",fullName:"Explorer 4/8"},
  12269:{group:513,level:5,max:8,name:"Explorer",fullName:"Explorer 5/8"},
  12270:{group:513,level:6,max:8,name:"Explorer",fullName:"Explorer 6/8"},
  12271:{group:513,level:7,max:8,name:"Explorer",fullName:"Explorer 7/8"},
  12272:{group:513,level:8,max:8,name:"Explorer",fullName:"Explorer 8/8"},

  // Adventurer (514, 1–8)
  12274:{group:514,level:1,max:8,name:"Adventurer",fullName:"Adventurer 1/8"},
  12275:{group:514,level:2,max:8,name:"Adventurer",fullName:"Adventurer 2/8"},
  12276:{group:514,level:3,max:8,name:"Adventurer",fullName:"Adventurer 3/8"},
  12277:{group:514,level:4,max:8,name:"Adventurer",fullName:"Adventurer 4/8"},
  12278:{group:514,level:5,max:8,name:"Adventurer",fullName:"Adventurer 5/8"},
  12279:{group:514,level:6,max:8,name:"Adventurer",fullName:"Adventurer 6/8"},
  12280:{group:514,level:7,max:8,name:"Adventurer",fullName:"Adventurer 7/8"},
  12281:{group:514,level:8,max:8,name:"Adventurer",fullName:"Adventurer 8/8"},

  // Veteran (515, 1–8)
  12282:{group:515,level:1,max:8,name:"Veteran",fullName:"Veteran 1/8"},
  12283:{group:515,level:2,max:8,name:"Veteran",fullName:"Veteran 2/8"},
  12284:{group:515,level:3,max:8,name:"Veteran",fullName:"Veteran 3/8"},
  12285:{group:515,level:4,max:8,name:"Veteran",fullName:"Veteran 4/8"},
  12286:{group:515,level:5,max:8,name:"Veteran",fullName:"Veteran 5/8"},
  12287:{group:515,level:6,max:8,name:"Veteran",fullName:"Veteran 6/8"},
  12288:{group:515,level:7,max:8,name:"Veteran",fullName:"Veteran 7/8"},
  12289:{group:515,level:8,max:8,name:"Veteran",fullName:"Veteran 8/8"},

  // Champion (516, 1–8)
  12290:{group:516,level:1,max:8,name:"Champion",fullName:"Champion 1/8"},
  12291:{group:516,level:2,max:8,name:"Champion",fullName:"Champion 2/8"},
  12292:{group:516,level:3,max:8,name:"Champion",fullName:"Champion 3/8"},
  12293:{group:516,level:4,max:8,name:"Champion",fullName:"Champion 4/8"},
  12294:{group:516,level:5,max:8,name:"Champion",fullName:"Champion 5/8"},
  12295:{group:516,level:6,max:8,name:"Champion",fullName:"Champion 6/8"},
  12296:{group:516,level:7,max:8,name:"Champion",fullName:"Champion 7/8"},
  12297:{group:516,level:8,max:8,name:"Champion",fullName:"Champion 8/8"},

  // Hero (517, 1–6)
  12350:{group:517,level:1,max:6,name:"Hero",fullName:"Hero 1/6"},
  12351:{group:517,level:2,max:6,name:"Hero",fullName:"Hero 2/6"},
  12352:{group:517,level:3,max:6,name:"Hero",fullName:"Hero 3/6"},
  12353:{group:517,level:4,max:6,name:"Hero",fullName:"Hero 4/6"},
  12354:{group:517,level:5,max:6,name:"Hero",fullName:"Hero 5/6"},
  12355:{group:517,level:6,max:6,name:"Hero",fullName:"Hero 6/6"},

  // Myth (518, 1–6)
  12356:{group:518,level:1,max:6,name:"Myth",fullName:"Myth 1/6"},
  12357:{group:518,level:2,max:6,name:"Myth",fullName:"Myth 2/6"},
  12358:{group:518,level:3,max:6,name:"Myth",fullName:"Myth 3/6"},
  12359:{group:518,level:4,max:6,name:"Myth",fullName:"Myth 4/6"},
  12360:{group:518,level:5,max:6,name:"Myth",fullName:"Myth 5/6"},
  12361:{group:518,level:6,max:6,name:"Myth",fullName:"Myth 6/6"},
};

export function toTrackKey(group: BonusUpgrade["group"]): TrackKey {
  switch (group) {
    case 518: return "Myth";
    case 517: return "Hero";
    case 516: return "Champion";
    case 515: return "Veteran";
    case 514: return "Adventurer";
    case 513: return "Explorer";
  }
}

/** Best match among bonus ids. Prefers the one whose expected ilvl equals the item ilvl. */
export function findUpgradeByBonusIds(
  bonusIds: number[] = [],
  itemIlvl?: number
): (BonusUpgrade & { track: TrackKey }) | null {
  const hits: Array<BonusUpgrade & { track: TrackKey; diff: number }> = [];

  for (const id of bonusIds) {
    const meta = BONUS_UPGRADE_INDEX[id];
    if (!meta) continue;
    const track = toTrackKey(meta.group);
    const rankIlvl = tracks[track]?.ilvlByRank[meta.level];
    const diff = typeof itemIlvl === "number" && rankIlvl ? Math.abs(rankIlvl - itemIlvl) : 9999;
    hits.push({ ...meta, track, diff });
  }

  if (!hits.length) return null;

  // 1) exact ilvl match wins
  hits.sort((a, b) => a.diff - b.diff || b.group - a.group || b.level - a.level);
  const best = hits[0];
  return { ...best, track: best.track };
}

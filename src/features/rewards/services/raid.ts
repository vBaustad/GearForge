// src/features/rewards/services/raid.ts
import type { Crest } from "../../../types/crests";
import { CREST_ICONS } from "../../../components/crests/crests";
import { season } from "../../../config/seasons/currentSeason";
import { raidDrops_s3, type RaidDifficulty } from "../../../config/seasons/the_war_within/season_3/raid.data";

export interface RaidSegment {
  label: string;        // "Bosses 1–3", "4–6", "7–8", "Very Rare"
  ilvl: number;
  rankLabel: string;    // "Hero 3/6"
}
export interface RaidCardView {
  difficulty: RaidDifficulty;
  crest: { tier: Crest; icon: string };
  segments: RaidSegment[];
}
export interface RaidViewData { cards: RaidCardView[]; }

function ilvlOf(track: keyof typeof season.tracks, rank: number): number {
  const t = season.tracks[track];
  return (t.ilvlByRank as Record<number, number>)[rank];
}
function labelOf(track: keyof typeof season.tracks, rank: number): string {
  const t = season.tracks[track];
  return `${track} ${rank}/${t.maxRank}`;
}

export function getRaidViewData(): RaidViewData {
  const build = (diff: RaidDifficulty): RaidCardView => {
    const d = raidDrops_s3[diff];
    const segs: Array<[string, { track: keyof typeof season.tracks; rank: number }]> = [
      ["Bosses 1–3", d.groups["1-3"]],
      ["Bosses 4–6", d.groups["4-6"]],
      ["Bosses 7–8", d.groups["7-8"]],
      ["Very Rare Items",  d.veryRare],
    ];

    return {
      difficulty: diff,
      crest: { tier: d.crest, icon: CREST_ICONS[d.crest] },
      segments: segs.map(([label, tr]) => ({
        label,
        ilvl: ilvlOf(tr.track, tr.rank),
        rankLabel: labelOf(tr.track, tr.rank),
      })),
    };
  };

  return { cards: (["LFR", "Normal", "Heroic", "Mythic"] as RaidDifficulty[]).map(build) };
}

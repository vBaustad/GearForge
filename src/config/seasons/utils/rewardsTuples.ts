import type { TrackKey } from "../../../features/optimizer/types/simc";
import type { MPlusRewardRow } from "../../../types/season";

export type RewardTuple =
  [level: number, end: [TrackKey, number], vault: [TrackKey, number], note?: string];

export function tuplesToRows(tuples: RewardTuple[]): MPlusRewardRow[] {
  return tuples.map(([level, end, vault, note]) => ({
    level,
    end:   { track: end[0],   rank: end[1] },
    vault: { track: vault[0], rank: vault[1] },
    note,
  }));
}

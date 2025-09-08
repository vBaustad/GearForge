import type { SeasonConfig } from "../../../types/season";
import type { TrackKey } from "../../../features/optimizer/types/simc";

export type TrackRank = { track: TrackKey; rank: number; max: number };

// Preferred tie-break order when multiple tracks share the same ilvl
const ORDER: TrackKey[] = ["Explorer", "Adventurer", "Veteran", "Champion", "Hero", "Myth"];

// Per-season memoization
const CACHE = new WeakMap<SeasonConfig, Map<number, TrackRank[]>>();

export function buildIlvlIndex(season: SeasonConfig): Map<number, TrackRank[]> {
  let idx = CACHE.get(season);
  if (idx) return idx;

  idx = new Map<number, TrackRank[]>();

  for (const track of ORDER) {
    const t = season.tracks[track];
    if (!t?.ilvlByRank) continue;

    const max = t.maxRank;
    for (const [rankStr, ilvl] of Object.entries(t.ilvlByRank as Record<number, number>)) {
      const rank = Number(rankStr);
      const list = idx.get(ilvl) ?? [];
      list.push({ track, rank, max });
      idx.set(ilvl, list);
    }
  }

  // Stable, deterministic tie-break
  for (const list of idx.values()) {
    list.sort((a, b) => ORDER.indexOf(a.track) - ORDER.indexOf(b.track));
  }

  CACHE.set(season, idx);
  return idx;
}

/** ilvl → one {track,rank,max}. Prefer lower track when overlaps (e.g. 694 → Champion 5 over Hero 1). */
export function ilvlToTrackRank(
  season: SeasonConfig,
  ilvl: number,
  prefer: "lowest" | "highest" = "lowest"
): TrackRank | undefined {
  const arr = buildIlvlIndex(season).get(ilvl);
  if (!arr?.length) return undefined;
  return prefer === "highest" ? arr[arr.length - 1] : arr[0];
}

/** "Hero 3/6" formatting helper. */
export function formatTrackRank(tr?: TrackRank): string | undefined {
  if (!tr) return;
  return `${tr.track} ${tr.rank}/${tr.max}`;
}

/** Invalidate the cached index for a season (if you hot-reload season data). */
export function invalidateIlvlIndex(season: SeasonConfig): void {
  CACHE.delete(season);
}

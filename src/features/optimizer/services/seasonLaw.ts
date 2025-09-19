import { season } from "../../../config/seasons/currentSeason";

type AnySeason = {
  id: string;
  tracks:
    | Record<string, { ilvlByRank: Record<number, number> }>
    | Array<{ key?: string; name?: string; ilvlByRank: Record<number, number> }>;
};

function listTracks(s: AnySeason) {
  const t = s.tracks as AnySeason["tracks"];
  return Array.isArray(t)
    ? t.map(x => ({ key: (x.key ?? x.name ?? "unknown").toString(), table: x.ilvlByRank ?? {} }))
    : Object.entries(t as Record<string, { ilvlByRank: Record<number, number> }>)
        .map(([key, val]) => ({ key, table: val?.ilvlByRank ?? {} }));
}

type Hit = { track: string; rank: number };

let memoSeasonId: string | null = null;
let memoByIlvl: Map<number, Hit[]> = new Map();

function ensureIndex(s: AnySeason = season as unknown as AnySeason) {
  if (memoSeasonId === s.id && memoByIlvl.size) return;
  memoSeasonId = s.id;
  memoByIlvl = new Map();
  for (const { key: track, table } of listTracks(s)) {
    for (const [rankStr, ilvl] of Object.entries(table)) {
      const rank = Number(rankStr);
      if (!Number.isFinite(rank) || !Number.isFinite(ilvl)) continue;
      const arr = memoByIlvl.get(ilvl) ?? [];
      arr.push({ track, rank });
      memoByIlvl.set(ilvl, arr);
    }
  }
}

/** Strict: require exact (track, rank, ilvl) in current season. */
export function isExactCurrentSeasonTriple(
  track: string | undefined,
  ilvl: number | undefined,
  rank: number | undefined,
  s: AnySeason = season as unknown as AnySeason
): boolean {
  if (!track || !ilvl || rank == null) return false; // fail-closed on missing
  ensureIndex(s);
  const hits = memoByIlvl.get(ilvl) ?? [];
  return hits.some(h => h.track === track && h.rank === rank);
}

/** Diagnostics: all current-season hits for (ilvl, rank) regardless of track. */
export function hitsForIlvlRank(
  ilvl?: number,
  rank?: number,
  s: AnySeason = season as unknown as AnySeason
): Hit[] {
  if (!ilvl || rank == null) return [];
  ensureIndex(s);
  return (memoByIlvl.get(ilvl) ?? []).filter(h => h.rank === rank);
}

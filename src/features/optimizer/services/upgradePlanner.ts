// src/features/optimizer/services/upgradePlanner.ts
import { tracks } from "../proxy/registry";
import type { ParsedItem, ItemState, TrackKey, SlotKey } from "../types/simc";
import { normalizeSlot } from "./slotMap";

/** Convert a parsed SimC line to our internal ItemState.
 *  Rules:
 *   - MUST have a current-season upgrade-bonus in bonusIds; otherwise return null (legacy/ambiguous).
 *   - Uses (track, rank) from the bonus hit.
 *   - Optionally verify (track, rank, ilvl) via `strictTriple`.
 */
export function toItemState(p: ParsedItem): ItemState {
  const slot = normalizeSlot(p.slot)!; // assume valid equipped slots
  return {
    slot: slot as SlotKey,
    track: (p.track ?? "Hero") as TrackKey, // placeholder; planner overrides via bonus hit
    rank: p.rank ?? 1,
    name: p.name,
    ilvl: p.ilvl,
    id: p.id,
    crafted: p.crafted,
    bonusIds: p.bonusIds,
  };
}

/* ---------- (Deprecated) helpers retained for compatibility ---------- */
/** Find the track that contains this ilvl (exact match preferred). */
export function inferTrackFromIlvl(ilvl: number): TrackKey | null {
  let candidate: TrackKey | null = null;
  for (const key of Object.keys(tracks) as TrackKey[]) {
    const t = tracks[key];
    const values = Object.values(t.ilvlByRank);
    const min = Math.min(...values);
    const max = Math.max(...values);
    if (ilvl >= min && ilvl <= max) {
      if (values.includes(ilvl)) return key; // exact match
      candidate = candidate ?? key;
    }
  }
  return candidate;
}

/** Get the closest rank at or below ilvl for a given track. */
export function inferRankFromIlvl(ilvl: number, trackKey: TrackKey): number {
  const t = tracks[trackKey];
  let bestRank = 1;
  for (const [rankStr, lvl] of Object.entries(t.ilvlByRank)) {
    const r = Number(rankStr);
    if (ilvl >= lvl && r > bestRank) bestRank = r;
  }
  return bestRank;
}

// Temporary aliases if you want to keep old names compiling for now:
export const inferTrackFromIlvl_old = inferTrackFromIlvl;
export const inferRankFromIlvl_old = inferRankFromIlvl;
export const toItemState_old = toItemState;

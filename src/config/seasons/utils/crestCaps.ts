import type { Crest } from "../../../types/crests";
import { CREST_TIERS } from "../../../types/crests"; // high → low: Gilded, Runed, Carved, Weathered
import type { SeasonConfig } from "../../../types/season";

const MSW = 7 * 24 * 60 * 60 * 1000;

/** Inclusive weeks open, computed in UTC so DST/local-time doesn’t skew counts. */
function weeksOpenUTC(startISO: string, now = new Date()): number {
  const start = new Date(startISO);
  if (Number.isNaN(start.getTime())) return 0;

  const t0 = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());
  const t1 = Date.UTC(now.getUTCFullYear(),   now.getUTCMonth(),   now.getUTCDate());

  if (t1 < t0) return 0;
  return Math.floor((t1 - t0) / MSW) + 1; // inclusive
}

export interface CrestCap {
  tier: Crest;
  weeklyIncrement: number;
  currentCap: number;
  weeksOpen: number;
}

/** Array form (ordered high → low, per CREST_TIERS). */
export function getCrestCapsForSeason(season: SeasonConfig, now = new Date()): CrestCap[] {
  return CREST_TIERS.map((tier) => {
    const weeklyIncrement = season.crestWeeklyIncrement[tier];
    if (weeklyIncrement == null) {
      throw new Error(`Missing crestWeeklyIncrement for ${tier}`);
    }
    const weeks = weeksOpenUTC(season.crestCapStartDateISO[tier], now);
    return {
      tier,
      weeklyIncrement,
      currentCap: weeks * weeklyIncrement,
      weeksOpen: weeks,
    };
  });
}

/** Map form for quick lookup by tier. */
export function getCrestCapsMap(season: SeasonConfig, now = new Date()): Record<Crest, CrestCap> {
  return Object.fromEntries(
    getCrestCapsForSeason(season, now).map((row) => [row.tier, row])
  ) as Record<Crest, CrestCap>;
}

/** Convenience: single tier. */
export function crestCapForTier(season: SeasonConfig, tier: Crest, now = new Date()): CrestCap {
  const weeklyIncrement = season.crestWeeklyIncrement[tier];
  if (weeklyIncrement == null) {
    throw new Error(`Missing crestWeeklyIncrement for ${tier}`);
  }
  const weeks = weeksOpenUTC(season.crestCapStartDateISO[tier], now);
  return {
    tier,
    weeklyIncrement,
    currentCap: weeks * weeklyIncrement,
    weeksOpen: weeks,
  };
}

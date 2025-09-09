import type { SeasonConfig } from "../../../types/season";

const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

/** Full weeks completed since start (UTC, exclusive of the start week). */
function weeksSinceUTC(startISO: string, now = new Date()): number {
  const start = new Date(startISO);
  if (Number.isNaN(start.getTime())) return 0;

  // Normalize both to UTC midnight to avoid DST/locale issues
  const t0 = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());
  const t1 = Date.UTC(now.getUTCFullYear(),   now.getUTCMonth(),   now.getUTCDate());

  if (t1 <= t0) return 0;
  return Math.floor((t1 - t0) / MS_PER_WEEK);
}

/**
 * Sparks: accrues at `ratePerWeek` (default 0.5) from the start date.
 * Returns a decimal total (e.g., 2.5). UI can format to one decimal if desired.
 */
export function computeSparks(season: SeasonConfig, now = new Date()) {
  const { startISO, ratePerWeek = 0.5, cap } = season.progression.sparks;
  const weeks = weeksSinceUTC(startISO, now);
  let total = weeks * ratePerWeek;
  if (cap != null) total = Math.min(total, cap);
  return { weeks, total };
}

/**
 * Catalyst: +1 every `cadenceWeeks` (default 2) from the start date.
 * Returns whole charges and how many weeks until the next charge (0 = this week).
 */
export function computeCatalyst(season: SeasonConfig, now = new Date()) {
  const { startISO, cadenceWeeks = 2, cap } = season.progression.catalyst;
  const weeks = weeksSinceUTC(startISO, now);

  const earned = Math.floor(weeks / cadenceWeeks);
  const total  = cap != null ? Math.min(earned, cap) : earned;

  // 0 when you're on an unlock week; otherwise time until next threshold
  const rem = weeks % cadenceWeeks;
  const weeksUntilNext = rem === 0 ? 0 : (cadenceWeeks - rem);

  return { weeks, total, weeksUntilNext };
}

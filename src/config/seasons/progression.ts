import type { SeasonConfig } from "../../types/season";

const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

function weeksSince(startISO: string, now = new Date()): number {
  const start = new Date(startISO);
  if (isNaN(start.getTime()) || now < start) return 0;
  // full weeks completed since the start date
  return Math.floor((now.getTime() - start.getTime()) / MS_PER_WEEK);
}

/**
 * Sparks: accrues at `ratePerWeek` (default 0.5) from the season-configured start date.
 * Returns a decimal (e.g., 2.5). Apply .toFixed(1) in the UI if you want one decimal.
 */
export function computeSparks(season: SeasonConfig, now = new Date()) {
  const { startISO, ratePerWeek = 0.5, cap } = season.progression.sparks;
  const w = weeksSince(startISO, now);
  let total = w * ratePerWeek;         // 1 week -> 0.5, 2 weeks -> 1.0, etc.
  if (cap != null) total = Math.min(total, cap);
  return { total };
}

/**
 * Catalyst: +1 every `cadenceWeeks` (default 2) from the configured start date.
 * Returns whole charges and how many weeks until the next charge (0 = this week).
 */
export function computeCatalyst(season: SeasonConfig, now = new Date()) {
  const { startISO, cadenceWeeks = 2, cap } = season.progression.catalyst;
  const w = weeksSince(startISO, now); // full weeks completed
  let total = Math.floor(w / cadenceWeeks);
  if (cap != null) total = Math.min(total, cap);

  const nextAt = (total + 1) * cadenceWeeks;   // next threshold in weeks since start
  const weeksUntilNext = Math.max(0, nextAt - w);

  return { total, weeksUntilNext };
}

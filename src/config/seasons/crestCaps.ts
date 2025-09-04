// src/config/seasons/crestCaps.ts
import type { Crest } from "../../types/crests";
import type { SeasonConfig } from "../../types/season";

const MSW = 7 * 24 * 60 * 60 * 1000;

function weeksOpen(startISO: string, now = new Date()) {
  const start = new Date(startISO);
  if (isNaN(start.getTime()) || now < start) return 0;
  return Math.floor((now.getTime() - start.getTime()) / MSW) + 1; // inclusive
}

export interface CrestCap {
  tier: Crest;
  weeklyIncrement: number;
  currentCap: number;
  weeksOpen: number;
}

export function getCrestCapsForSeason(season: SeasonConfig, now = new Date()): CrestCap[] {
  const TIERS: Crest[] = ["Gilded", "Runed", "Carved", "Weathered"];
  return TIERS.map((tier) => {
    const inc = season.crestWeeklyIncrement[tier];
    const w   = weeksOpen(season.crestCapStartDateISO[tier], now);
    return { tier, weeklyIncrement: inc, currentCap: inc * w, weeksOpen: w };
  });
}

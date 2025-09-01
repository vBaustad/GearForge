// src/features/optimizer/services/crests.ts

import type { Crest, SlotIndex, SlotWatermark, UpgradeWalletEntry } from "../types/simc";

/* ──────────────────────────────────────────────────────────────
   1) Weekly caps (UI info bar)
   - Keep these dates/increments season-accurate
────────────────────────────────────────────────────────────── */

export interface CrestRule {
  tier: Crest;            // "Weathered" | "Carved" | "Runed" | "Gilded"
  weeklyIncrement: number;
  startDateISO: string;   // YYYY-MM-DD (local season launch per tier)
}

// Season 3/4 example dates you had; adjust if needed.
const defaultRules: CrestRule[] = [
  { tier: "Gilded",    weeklyIncrement: 90, startDateISO: "2025-08-13" },
  { tier: "Runed",     weeklyIncrement: 90, startDateISO: "2025-08-13" },
  { tier: "Carved",    weeklyIncrement: 90, startDateISO: "2025-08-06" },
  { tier: "Weathered", weeklyIncrement: 90, startDateISO: "2025-08-06" },
];

function weeksSinceStart(startISO: string, now = new Date()): number {
  const start = new Date(`${startISO}T00:00:00`);
  const ms = now.getTime() - start.getTime();
  if (ms < 0) return 0;
  // +1 so the first week counts as week 1
  return Math.floor(ms / (7 * 24 * 60 * 60 * 1000)) + 1;
}

export interface CrestCapResult {
  tier: Crest;
  currentCap: number;
  weeklyIncrement: number;
  weeksOpen: number;
  startDateISO: string;
}

export function getCrestCaps(
  rules: CrestRule[] = defaultRules,
  now = new Date()
): CrestCapResult[] {
  return rules.map((r) => {
    const weeks = weeksSinceStart(r.startDateISO, now);
    return {
      tier: r.tier,
      weeksOpen: weeks,
      weeklyIncrement: r.weeklyIncrement,
      currentCap: weeks * r.weeklyIncrement,
      startDateISO: r.startDateISO,
    };
  });
}

/* ──────────────────────────────────────────────────────────────
   2) Currency IDs + wallet helpers
   - Lets us show "You have X crests" and do affordability checks
────────────────────────────────────────────────────────────── */

export const CREST_CURRENCY_IDS: Readonly<Record<Crest, number>> = {
  Weathered: 3286,
  Carved:    3288,
  Runed:     3290,
  Gilded:    3284,
};

export function summarizeCrestWallet(
  wallet: UpgradeWalletEntry[]
): Partial<Record<Crest, number>> {
  const out: Partial<Record<Crest, number>> = {};
  for (const entry of wallet) {
    if (entry.kind !== "currency") continue;
    const crest = (Object.keys(CREST_CURRENCY_IDS) as Crest[])
      .find(t => CREST_CURRENCY_IDS[t] === entry.currencyId);
    if (crest) out[crest] = (out[crest] ?? 0) + entry.quantity;
  }
  return out;
}

/* ──────────────────────────────────────────────────────────────
   3) Low-level “free up to watermark” cost math
   - Planner can use per-step track data; this is a generic fallback
   - NOTE: You said valorstones are farmable; this only counts crest cost
────────────────────────────────────────────────────────────── */

export type CrestStep = {
  fromIlvl: number;
  toIlvl: number;
  stepSize: number;       // ilvls per upgrade “rank step”
  crestsPerStep: number;  // usually 15 this season
};

/**
 * Free crest ceiling for a slot.
 * We use the CURRENT watermark (not max).
 * Steps whose resulting ilvl <= this watermark cost 0 crests.
 */
export function crestFreeCeiling(
  watermarks: SlotWatermark[],
  slot: SlotIndex
): number | undefined {
  const w = watermarks.find((x) => x.slot === slot);
  return w?.current; // <-- important: CURRENT, not Math.max(current, max)
}

/**
 * Compute crest cost between startIlvl and targetIlvl, given:
 * - per-slot watermark (free up to current)
 * - a schedule describing step bands (ilvl ranges, step size, crests per step)
 *
 * If your planner already enumerates exact track steps (preferred),
 * you may not need this; keep it as a generic calculator.
 */
export function computeCrestsForUpgrade(params: {
  slot: SlotIndex;
  startIlvl: number;
  targetIlvl: number;
  watermarks: SlotWatermark[];
  schedule: CrestStep[];
}): number {
  const { slot, startIlvl, targetIlvl, watermarks, schedule } = params;
  if (targetIlvl <= startIlvl) return 0;

  const freeAt = crestFreeCeiling(watermarks, slot);
  // Everything up to and including freeAt is free.
  // Only bill steps that land ABOVE freeAt.
  const billFrom = Math.max(startIlvl, freeAt ?? -Infinity);
  if (targetIlvl <= billFrom) return 0;

  let crests = 0;
  for (const s of schedule) {
    // Intersect the schedule band with the billable window (billFrom -> targetIlvl)
    const lo = Math.max(s.fromIlvl, billFrom);
    const hi = Math.min(s.toIlvl, targetIlvl);
    if (hi <= lo) continue;

    // Count how many rank-steps occur in (lo, hi]; we ceil to ensure we cover partial spans.
    const span = hi - lo;
    const steps = Math.ceil(span / s.stepSize);
    if (steps > 0) crests += steps * s.crestsPerStep;
  }
  return crests;
}

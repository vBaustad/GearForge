import type { Crest, SlotIndex, SlotWatermark, UpgradeWalletEntry } from "../types/simc";
import type { SeasonConfig } from "../../../types/season";
import { season } from "../../../config/seasons/currentSeason";

/** Only the required crest currency keys (flightstones is optional and excluded). */
// no runtime const needed
type CrestCurrencyKey = "weathered" | "carved" | "runed" | "gilded";

// keep the map, with strong typing
const CrestKeyMap = {
  Weathered: "weathered",
  Carved:    "carved",
  Runed:     "runed",
  Gilded:    "gilded",
} as const satisfies Record<Crest, CrestCurrencyKey>;

export function crestCurrencyId(tier: Crest, s: SeasonConfig = season): number {
  const key = CrestKeyMap[tier]; // key: CrestCurrencyKey
  return s.currencies[key];      // -> number
}

export function summarizeCrestWallet(wallet: UpgradeWalletEntry[], s: SeasonConfig = season) {
  const out: Partial<Record<Crest, number>> = {};
  for (const entry of wallet) {
    if (entry.kind !== "currency") continue;
    for (const crest of Object.keys(CrestKeyMap) as Crest[]) {
      const key = CrestKeyMap[crest];
      if (s.currencies[key] === entry.currencyId) {
        out[crest] = (out[crest] ?? 0) + entry.quantity;
      }
    }
  }
  return out;
}

/* ── cost helpers unchanged ── */
export type CrestStep = {
  fromIlvl: number;
  toIlvl: number;
  stepSize: number;
  crestsPerStep: number;
};

export function crestFreeCeiling(watermarks: SlotWatermark[], slot: SlotIndex): number | undefined {
  const w = watermarks.find((x) => x.slot === slot);
  return w?.current;
}

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
  const billFrom = Math.max(startIlvl, freeAt ?? -Infinity);
  if (targetIlvl <= billFrom) return 0;

  let crests = 0;
  for (const s of schedule) {
    const lo = Math.max(s.fromIlvl, billFrom);
    const hi = Math.min(s.toIlvl, targetIlvl);
    if (hi <= lo) continue;

    const span = hi - lo;
    const steps = Math.ceil(span / s.stepSize);
    if (steps > 0) crests += steps * s.crestsPerStep;
  }
  return crests;
}

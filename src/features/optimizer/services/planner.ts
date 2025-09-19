// src/features/optimizer/services/planner.ts

import { tracks } from "../proxy/registry"; // import track definitions for upgrade logic
import { season } from "../../../config/seasons/currentSeason"; // import current season configuration for limits
import { watermarksToFreeIlvlBySlot } from "./slotMap"; // import slot helper to map watermarks to slot keys
import { crestDiscountsFromAchievements } from "./achievementDiscounts"; // import helper for crest discount lookup
import { findUpgradeByBonusIds } from "../../../data/upgradeIndex"; // season-scoped bonusId matcher

import type {
  TrackKey,
  Crest,
  ItemState,
  PlayerContext,
  StepPlan,
  ItemPlan,
  PlanAllResult,
  SlotKey,
  SlotWatermark,
  AchievementId,
  TrackStep,
} from "../types/simc";

const NO_CREST_UPGRADE_ITEM_IDS = new Set(season.noCrestUpgradeItemIds ?? []);

/* ------------------------- helpers ------------------------- */

/** Build a quick lookup: fromRank -> step */
function buildStepByFrom(steps: TrackStep[]): Map<number, TrackStep> {
  const m = new Map<number, TrackStep>();
  for (const s of steps) m.set(s.from, s);
  return m;
}

/** Walk forward from `start` while crest matches `crest`, return last `to` encountered. */
function endOfCrestStreak(stepsByFrom: Map<number, TrackStep>, start: number, crest: Crest): number {
  let cur = start;
  while (true) {
    const s = stepsByFrom.get(cur);
    if (!s || s.crest !== crest) break;
    cur = s.to;
  }
  return cur;
}

/** Find the highest rank whose item level is at or below the supplied threshold. */
function highestRankAtOrBelowIlvl(track: TrackKey, threshold: number): number {
  const table = tracks[track].ilvlByRank;
  let best = 1;
  for (const [rStr, ilvl] of Object.entries(table)) {
    if (ilvl <= threshold) best = Math.max(best, Number(rStr));
  }
  return best;
}

function hasNextStepAtRank(steps: TrackStep[], rank: number): boolean {
  return steps.some(s => s.from === rank);
}

/** Produce a blocked/legacy plan (no steps). */
function makeBlockedPlan(item: ItemState, reason: string): ItemPlan {
  // Use the item's declared track if possible, else default to Hero (arbitrary) for ilvl lookup safety
  const declaredTrack: TrackKey = item.track ?? "Hero";
  const t = tracks[declaredTrack];
  const from = Math.min(Math.max(1, item.rank), t.maxRank);
  const ilvl = t.ilvlByRank[from];

  return {
    slot: item.slot,
    fromRank: from,
    toRank: from,
    fromIlvl: ilvl,
    toIlvl: ilvl,
    steps: [],
    crestTotals: {},
    note: reason,
  };
}

/**
 * Determine target rank using your rules:
 * - If watermark exists → target=watermark rank (free baseline).
 * - Inspect the crest needed for the NEXT step after baseline:
 *   • Weathered → push to end of Weathered streak.
 *   • Carved   → push to end of Carved streak.
 *   • Runed    → if ilvl(baseline)==701 → push one step to 704; else stop.
 *   • Gilded   → Myth track → max; else stop.
 * - No watermark behaves the same with baseline=current rank.
 */
function chooseTargetRank(
  item: ItemState,
  _dropCeilingIlvl: number,
  opts: { watermarkIlvl?: number } = {}
): number {
  const t = tracks[item.track];
  const from = Math.min(Math.max(1, item.rank), t.maxRank);

  // Blocked entirely
  if (item.crafted || (item.id && NO_CREST_UPGRADE_ITEM_IDS.has(item.id))) {
    return from;
  }

  // Watermark baseline
  const watermarkRank =
    typeof opts.watermarkIlvl === "number" && Number.isFinite(opts.watermarkIlvl)
      ? highestRankAtOrBelowIlvl(item.track, opts.watermarkIlvl)
      : undefined;

  const baseline = Math.max(from, watermarkRank ?? from);
  let target = baseline;

  // Myth rule: always to max
  if (item.track === "Myth") {
    return t.maxRank;
  }

  // If already at max, done
  const stepsByFrom = buildStepByFrom(t.steps);
  const next = stepsByFrom.get(target);
  if (!next) return target;

  switch (next.crest) {
    case "Weathered": {
      target = endOfCrestStreak(stepsByFrom, target, "Weathered");
      break;
    }
    case "Carved": {
      target = endOfCrestStreak(stepsByFrom, target, "Carved");
      break;
    }
    case "Runed": {
      const ilvlAtBaseline = t.ilvlByRank[baseline];
      if (ilvlAtBaseline === 701) {
        const s = stepsByFrom.get(target);
        if (s && s.crest === "Runed") target = Math.min(s.to, t.maxRank);
      }
      break;
    }
    case "Gilded": {
      // Non-Myth should not spend Gilded → stay at baseline
      break;
    }
  }

  return Math.min(target, t.maxRank);
}

/* ------------------------- planner ------------------------- */

/**
 * Construct a detailed crest upgrade plan for a single item.
 *
 * Order of checks:
 *  1) Crafted?                  → block with crafted note.
 *  2) Explicit no-crest list?   → block with season note.
 *  3) No current-season bonus?  → block as legacy.
 *  4) Otherwise: plan normally using decoded (track, rank).
 */
export function planItemUpgrade(
  item: ItemState,
  ctx: PlayerContext & {
    surplusRuned?: number;
    watermarkIlvlBySlot?: Partial<Record<SlotKey, number>>;
    crestDiscounts?: Partial<Record<Crest, number>>;
  }
): ItemPlan {
  // 1) Crafted items never use crest upgrades
  if (item.crafted) {
    return makeBlockedPlan(item, "Crafted item — upgrades use crafting systems, not crests.");
  }

  // 2) Explicitly disabled by season rules
  if (item.id != null && NO_CREST_UPGRADE_ITEM_IDS.has(item.id)) {
    return makeBlockedPlan(item, "This item is not crest-upgradable this season.");
  }

  // 3) Require a season bonus-id hit; otherwise legacy/ambiguous.
  const bonusHit = findUpgradeByBonusIds(item.bonusIds ?? null);
  if (!bonusHit) {
    return makeBlockedPlan(item, "Legacy — no current-season upgrade bonus in bonus_ids.");
  }

  // Use decoded (track, rank) from bonus-hit for all logic
  const itemEff: ItemState = {
    ...item,
    track: bonusHit.name as TrackKey,
    rank: bonusHit.level,
  };

  const t = tracks[itemEff.track];
  const from = Math.min(Math.max(1, itemEff.rank), t.maxRank);
  const dropCeilingIlvl = ctx.dropCeilingIlvl ?? season.defaultDropCeilingIlvl;
  const watermarkIlvlRaw = ctx.watermarkIlvlBySlot?.[itemEff.slot];

  // BLOCKING RULES (contextual)
  const nextStepExists = hasNextStepAtRank(t.steps, from);
  const isBlocked = !nextStepExists; // crafted/no-crest already returned above

  // Watermark → rank (only applies to non-blocked items)
  const watermarkRank =
    !isBlocked &&
    typeof watermarkIlvlRaw === "number" &&
    Number.isFinite(watermarkIlvlRaw)
      ? highestRankAtOrBelowIlvl(itemEff.track, watermarkIlvlRaw)
      : undefined;

  const baseline = Math.max(from, watermarkRank ?? from);

  // Proposed target using effective track/rank
  let target = chooseTargetRank(itemEff, dropCeilingIlvl, { watermarkIlvl: watermarkIlvlRaw });

  // Enforce baseline; never lift blocked via watermark
  if (isBlocked) {
    target = from;
  } else if (target < baseline) {
    target = baseline;
  }

  // Build steps (watermark only zeroes cost if not blocked)
  const steps: StepPlan[] = [];
  const crestTotals: Partial<Record<Crest, number>> = {};

  for (const step of t.steps) {
    if (step.from < from || step.to > target) continue;

    const newIlvl = t.ilvlByRank[step.to];
    const isFreeViaWatermark = !isBlocked && watermarkRank != null && step.to <= watermarkRank;

    const baseCost = step.cost;
    const discount = !isFreeViaWatermark
      ? Math.min(baseCost, ctx.crestDiscounts?.[step.crest] ?? 0)
      : 0;

    const effectiveCost = isFreeViaWatermark ? 0 : Math.max(0, baseCost - discount);

    steps.push({ ...step, cost: effectiveCost, newIlvl });

    if (effectiveCost > 0) {
      crestTotals[step.crest] = (crestTotals[step.crest] ?? 0) + effectiveCost;
    }
  }

  const fromIlvl = t.ilvlByRank[from];
  const toIlvl = t.ilvlByRank[target];

  // NOTES (ordered by specificity)
  let note: string | undefined;
  // crafted / no-crest handled earlier
  if (!nextStepExists) {
    note = from >= t.maxRank
      ? "Already at the maximum rank for this track."
      : "Legacy item — no crest upgrade path available from its current rank.";
  } else if (itemEff.track === "Hero") {
    const ilvlNow = itemEff.ilvl ?? fromIlvl;
    const runedStepCost = t.steps.find((s) => s.crest === "Runed")?.cost ?? 15;
    if (baseline === from && target === baseline && ilvlNow < dropCeilingIlvl) {
      note =
        (ctx.surplusRuned ?? 0) >= runedStepCost
          ? `Below ${dropCeilingIlvl} — wait for drops; you do have surplus Runed if you want to push early.`
          : `Below ${dropCeilingIlvl} — let drops catch this up before spending Runed.`;
    } else if (target === from) {
      note = "Already beyond the efficient Runed breakpoint — save Gilded for Myth upgrades.";
    }
  } else if (itemEff.track === "Champion" && target === from) {
    note = "Champion past the cheap breakpoint spends Runed — save those for better slots.";
  }

  if (!note && target === from) {
    note = `Upgrading wouldn't push you above your drop ceiling (${dropCeilingIlvl}).`;
  }

  return {
    slot: itemEff.slot,
    fromRank: from,
    toRank: target,
    fromIlvl,
    toIlvl,
    steps,
    crestTotals,
    note,
  };
}


/**
 * Generate upgrade plans for all items and aggregate crest totals.
 */
export function planAll(
  items: ItemState[],
  ctx: PlayerContext & {
    crestStock?: Partial<Record<Crest, number>>;
    watermarks?: SlotWatermark[];
    achievements?: AchievementId[];
  }
): PlanAllResult {
  const dropCeilingIlvl = ctx.dropCeilingIlvl ?? season.defaultDropCeilingIlvl;
  const heroTrack = tracks.Hero;
  const watermarkIlvlBySlot = ctx.watermarks ? watermarksToFreeIlvlBySlot(ctx.watermarks) : {};
  const crestDiscounts = crestDiscountsFromAchievements(ctx.achievements);

  // Count Hero items at ceiling using *effective* (track, rank) and skipping legacy items
  let heroAtCeiling = 0;
  for (const it of items) {
    // Skip crafted and explicit no-crest here; they don't consume Runed
    if (it.crafted) continue;
    if (it.id != null && NO_CREST_UPGRADE_ITEM_IDS.has(it.id)) continue;

    const hit = findUpgradeByBonusIds(it.bonusIds ?? null);
    if (!hit) continue; // legacy — skip
    if (hit.name !== "Hero") continue;

    const t = tracks.Hero;
    const from = Math.min(Math.max(1, hit.level), t.maxRank);
    const heroCeilingRank = highestRankAtOrBelowIlvl("Hero", dropCeilingIlvl);
    if (from === heroCeilingRank) heroAtCeiling++;
  }

  const runedStepCostFromCeiling =
    heroTrack.steps.find((s) => s.crest === "Runed" && s.from === highestRankAtOrBelowIlvl("Hero", dropCeilingIlvl))?.cost
    ?? heroTrack.steps.find((s) => s.crest === "Runed")?.cost
    ?? 15;

  const baselineRuned = heroAtCeiling * runedStepCostFromCeiling;
  const availableRuned = ctx.crestStock?.Runed ?? 0;
  const surplusRuned = Math.max(0, availableRuned - baselineRuned);

  const plans = items.map((it) =>
    planItemUpgrade(it, { ...ctx, surplusRuned, watermarkIlvlBySlot, crestDiscounts })
  );

  const totals: Partial<Record<Crest, number>> = {};
  for (const p of plans) {
    for (const [crest, cost] of Object.entries(p.crestTotals)) {
      const value = cost ?? 0;
      if (!value) continue;
      totals[crest as Crest] = (totals[crest as Crest] ?? 0) + value;
    }
  }

  return { plans, totals };
}

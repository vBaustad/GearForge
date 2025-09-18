import { tracks } from "../proxy/registry"; // import track definitions for upgrade logic
import { season } from "../../../config/seasons/currentSeason"; // import current season configuration for limits
import { watermarksToFreeIlvlBySlot } from "./slotMap"; // import slot helper to map watermarks to slot keys
import { crestDiscountsFromAchievements } from "./achievementDiscounts"; // import helper for crest discount lookup
import type { // import type-only symbols used by the planner
  TrackKey, // track identifier type
  Crest, // crest tier identifier type
  ItemState, // shape describing an item's current state
  PlayerContext, // shape describing player-specific inputs
  StepPlan, // shape describing a single upgrade step
  ItemPlan, // shape describing the plan for one item
  PlanAllResult, // shape describing the combined plan output
  SlotKey, // slot identifier type used for watermark lookup
  SlotWatermark, // watermark payload for each slot
  AchievementId, // achievement identifier type for discounts
  TrackStep,
} from "../types/simc"; // location of shared optimizer types

const NO_CREST_UPGRADE_ITEM_IDS = new Set(season.noCrestUpgradeItemIds ?? []); // set of item ids that cannot be crest upgraded

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
  _dropCeilingIlvl: number, // not used by these rules now; kept for signature compatibility
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
      // Push through all contiguous Weathered steps
      target = endOfCrestStreak(stepsByFrom, target, "Weathered");
      break;
    }
    case "Carved": {
      // Push through all contiguous Carved steps
      target = endOfCrestStreak(stepsByFrom, target, "Carved");
      break;
    }
    case "Runed": {
      // Only if we are exactly at the 701 breakpoint → allow one step to 704
      const ilvlAtBaseline = t.ilvlByRank[baseline];
      if (ilvlAtBaseline === 701) {
        const s = stepsByFrom.get(target);
        if (s && s.crest === "Runed") target = Math.min(s.to, t.maxRank);
      }
      // else: stay at baseline
      break;
    }
    case "Gilded": {
      // Non-Myth should not spend Gilded → stay at baseline
      // (Myth handled above)
      break;
    }
  }

  return Math.min(target, t.maxRank);
}

/* ------------------------- planner ------------------------- */

/**
 * Construct a detailed crest upgrade plan for a single item.
 */
export function planItemUpgrade(
  item: ItemState,
  ctx: PlayerContext & {
    surplusRuned?: number;
    watermarkIlvlBySlot?: Partial<Record<SlotKey, number>>;
    crestDiscounts?: Partial<Record<Crest, number>>;
  }
): ItemPlan {
  const t = tracks[item.track];
  const from = Math.min(Math.max(1, item.rank), t.maxRank);
  const dropCeilingIlvl = ctx.dropCeilingIlvl ?? season.defaultDropCeilingIlvl;
  const watermarkIlvlRaw = ctx.watermarkIlvlBySlot?.[item.slot];

  // BLOCKING RULES
  const inNoCrestList = (item.id != null && NO_CREST_UPGRADE_ITEM_IDS.has(item.id));
  const nextStepExists = hasNextStepAtRank(t.steps, from); // legacy / maxed items won't have this
  // Anything not actually crest-upgradeable from the current rank is "blocked" for our purposes
  const isBlocked = inNoCrestList || item.crafted || !nextStepExists;

  // Watermark → rank (only applies to non-blocked items)
  const watermarkRank =
    !isBlocked &&
    typeof watermarkIlvlRaw === "number" &&
    Number.isFinite(watermarkIlvlRaw)
      ? highestRankAtOrBelowIlvl(item.track, watermarkIlvlRaw)
      : undefined;

  const baseline = Math.max(from, watermarkRank ?? from);

  // Proposed target
  let target = chooseTargetRank(item, dropCeilingIlvl, { watermarkIlvl: watermarkIlvlRaw });

  // Never lift blocked items via watermark; otherwise, enforce baseline
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
  if (inNoCrestList) {
    // e.g., belts flagged by season rules
    note = "This item is not crest-upgradable this season.";
  } else if (item.crafted) {
    note = "Crafted item — upgrades use crafting systems, not crests.";
  } else if (!nextStepExists) {
    // Legacy or already max
    note = from >= t.maxRank
      ? "Already at the maximum rank for this track."
      : "Legacy item — no crest upgrade path available from its current rank.";
  } else if (item.track === "Hero") {
    const ilvlNow = item.ilvl ?? fromIlvl;
    const runedStepCost = t.steps.find((s) => s.crest === "Runed")?.cost ?? 15;
    if (baseline === from && target === baseline && ilvlNow < dropCeilingIlvl) {
      note =
        (ctx.surplusRuned ?? 0) >= runedStepCost
          ? `Below ${dropCeilingIlvl} — wait for drops; you do have surplus Runed if you want to push early.`
          : `Below ${dropCeilingIlvl} — let drops catch this up before spending Runed.`;
    } else if (target === from) {
      note = "Already beyond the efficient Runed breakpoint — save Gilded for Myth upgrades.";
    }
  } else if (item.track === "Champion" && target === from) {
    note = "Champion past the cheap breakpoint spends Runed — save those for better slots.";
  }

  if (!note && target === from) {
    note = `Upgrading wouldn't push you above your drop ceiling (${dropCeilingIlvl}).`;
  }

  return {
    slot: item.slot,
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
export function planAll( // export bulk planner
  items: ItemState[], // full list of items to evaluate
  ctx: PlayerContext & { // optional planning context
    crestStock?: Partial<Record<Crest, number>>; // optional crest inventory context
    watermarks?: SlotWatermark[]; // optional slot watermarks
    achievements?: AchievementId[]; // optional achievements for crest discounts
  }
): PlanAllResult { // return aggregated result
  const dropCeilingIlvl = ctx.dropCeilingIlvl ?? season.defaultDropCeilingIlvl; // resolve drop ceiling constraint
  const heroCeilingRank = highestRankAtOrBelowIlvl("Hero", dropCeilingIlvl); // derive hero rank matching ceiling
  const heroTrack = tracks.Hero; // cache hero track info
  const watermarkIlvlBySlot = ctx.watermarks ? watermarksToFreeIlvlBySlot(ctx.watermarks) : {}; // map watermarks to slot keys
  const crestDiscounts = crestDiscountsFromAchievements(ctx.achievements); // derive crest discounts from achievements

  let heroAtCeiling = 0; // count hero items at the ceiling rank
  for (const it of items) { // scan each item
    if (it.track !== "Hero") continue; // skip non-hero entries
    const t = tracks[it.track]; // fetch track for hero item
    const from = Math.min(Math.max(1, it.rank), t.maxRank); // clamp hero rank within track
    if (from === heroCeilingRank) heroAtCeiling++; // increment when hero item sits at ceiling
  }

  const runedStepCostFromCeiling = // derive cost of first Runed bump past ceiling
    heroTrack.steps // inspect hero steps
      .find((s) => s.crest === "Runed" && s.from === heroCeilingRank)?.cost // prefer step starting at ceiling rank
    ?? heroTrack.steps.find((s) => s.crest === "Runed")?.cost // otherwise use any Runed step cost
    ?? 15; // fallback to default cost

  const baselineRuned = heroAtCeiling * runedStepCostFromCeiling; // estimate Runed needed to push all ceiling items
  const availableRuned = ctx.crestStock?.Runed ?? 0; // check current Runed inventory
  const surplusRuned = Math.max(0, availableRuned - baselineRuned); // compute surplus Runed beyond baseline

  const plans = items.map((it) => // build per-item plans with surplus and discounts
    planItemUpgrade(it, { ...ctx, surplusRuned, watermarkIlvlBySlot, crestDiscounts }) // include derived helpers
  );
  const totals: Partial<Record<Crest, number>> = {}; // prepare crest total aggregator

  for (const p of plans) { // accumulate costs across item plans
    for (const [crest, cost] of Object.entries(p.crestTotals)) { // iterate crest totals per item
      const value = cost ?? 0; // normalise possibly undefined costs
      if (!value) continue; // skip zero values
      totals[crest as Crest] = (totals[crest as Crest] ?? 0) + value; // add crest cost to aggregate
    }
  }

  return { plans, totals }; // expose plan list and crest totals
}

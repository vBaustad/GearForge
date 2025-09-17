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
} from "../types/simc"; // location of shared optimizer types

const NO_CREST_UPGRADE_ITEM_IDS = new Set(season.noCrestUpgradeItemIds ?? []); // set of item ids that cannot be crest upgraded

/**
 * Return the highest track rank reachable using only the provided crest types.
 */
function highestRankUsingCrests(track: TrackKey, allowed: Crest[]): number { // get max rank accessible with allowed crests
  const t = tracks[track]; // retrieve track definition by key
  let max = 1; // start with minimum rank
  for (const step of t.steps) { // iterate through each upgrade step
    if (allowed.includes(step.crest) && step.to > max) max = step.to; // update max when a valid crest step goes higher
  }
  return max; // return the highest reachable rank
}

/**
 * Find the highest rank whose item level is at or below the supplied threshold.
 */
function highestRankAtOrBelowIlvl(track: TrackKey, threshold: number): number { // compute best rank not exceeding threshold ilvl
  const table = tracks[track].ilvlByRank; // access rank to ilvl lookup
  let best = 1; // initialize with minimum rank
  for (const [rStr, ilvl] of Object.entries(table)) { // walk rank entries
    if (ilvl <= threshold) best = Math.max(best, Number(rStr)); // update best when ilvl stays under threshold
  }
  return best; // return the highest qualifying rank
}

/**
 * Determine the season-informed target rank for the given item and drop ceiling.
 */
function chooseTargetRank(
  item: ItemState, // item to evaluate
  dropCeilingIlvl: number, // drop ceiling in item level
  opts: { watermarkIlvl?: number } = {} // optional per-slot watermark context
): number { // decide desired target rank for an item
  const t = tracks[item.track]; // grab track metadata for item
  const from = Math.min(Math.max(1, item.rank), t.maxRank); // clamp starting rank into valid range

  if (item.crafted || (item.id && NO_CREST_UPGRADE_ITEM_IDS.has(item.id))) { // skip upgrading when crafted or blocked
    return from; // stay at current rank
  }

  let target = from; // initialize target to the current rank

  if (typeof opts.watermarkIlvl === "number" && Number.isFinite(opts.watermarkIlvl)) { // when a watermark is known
    const watermarkRank = highestRankAtOrBelowIlvl(item.track, opts.watermarkIlvl); // convert watermark ilvl to rank
    target = Math.max(target, watermarkRank); // respect the watermark rank
  }

  if (item.track === "Myth") { // myth track always aims for max rank
    return t.maxRank; // use track max
  }

  if (item.track === "Hero") { // evaluate hero-specific logic
    const ilvlNow = item.ilvl ?? t.ilvlByRank[from]; // derive current item level
    const watermarkIlvl = opts.watermarkIlvl; // pull slot watermark ilvl
    const hasWatermark = typeof watermarkIlvl === "number" && Number.isFinite(watermarkIlvl); // guard finite watermark
    const watermarkBeatsCeiling = hasWatermark && watermarkIlvl >= dropCeilingIlvl; // check if watermark meets drop ceiling
    if (ilvlNow < dropCeilingIlvl && !watermarkBeatsCeiling) { // stay put when below ceiling and no watermark safety net
      return target; // keep current target
    }
    const runedCap = highestRankUsingCrests("Hero", ["Runed"]); // compute highest hero rank using only Runed crests
    if (target < runedCap) target = runedCap; // push to the final Runed step when under it
    return Math.min(target, t.maxRank); // never exceed track maximum
  }

  if (item.track === "Champion") { // handle champion track separately
    const carvedCap = highestRankUsingCrests("Champion", ["Weathered", "Carved"]); // compute cap achievable with cheaper crests
    if (target < carvedCap) target = carvedCap; // push to the carved ceiling when below it
    return Math.min(target, t.maxRank); // ensure bounds respected
  }

  if (item.track === "Veteran" || item.track === "Adventurer" || item.track === "Explorer") { // treat other sub-max tracks similarly
    target = t.maxRank; // set target to track maximum
    return target; // return maximized target
  }

  return target; // default to computed target
}

/**
 * Construct a detailed crest upgrade plan for a single item.
 */
export function planItemUpgrade( // expose function building per-item plan
  item: ItemState, // item to plan upgrades for
  ctx: PlayerContext & { // planning context with optional extras
    surplusRuned?: number; // surplus Runed crest allocation
    watermarkIlvlBySlot?: Partial<Record<SlotKey, number>>; // per-slot watermark lookup
    crestDiscounts?: Partial<Record<Crest, number>>; // crest discount per tier
  }
): ItemPlan { // return an item plan
  const t = tracks[item.track]; // fetch item track definition
  const from = Math.min(Math.max(1, item.rank), t.maxRank); // clamp starting rank into track bounds
  const dropCeilingIlvl = ctx.dropCeilingIlvl ?? season.defaultDropCeilingIlvl; // resolve active drop ceiling
  const watermarkIlvl = ctx.watermarkIlvlBySlot?.[item.slot]; // lookup per-slot watermark ilvl
  let target = chooseTargetRank(item, dropCeilingIlvl, { watermarkIlvl }); // select target rank using helper

  if (!ctx.ignoreCeiling && target > from) { // enforce drop ceiling unless told otherwise
    const toIlvl = t.ilvlByRank[target]; // item level at target rank
    const onlyCheap = t.steps // evaluate whether upgrade path only uses cheap crests
      .filter((s) => s.from >= from && s.to <= target) // keep steps within planned range
      .every((s) => s.crest === "Weathered" || s.crest === "Carved"); // confirm each step uses cheap crests

    if (!onlyCheap && toIlvl <= dropCeilingIlvl) { // avoid overspending when ceiling already satisfied
      target = from; // retract to current rank
    }
  }

  const steps: StepPlan[] = []; // initialize upgrade step list
  const crestTotals: Partial<Record<Crest, number>> = {}; // initialize crest cost accumulator
  const watermarkRank = typeof watermarkIlvl === "number" && Number.isFinite(watermarkIlvl) // derive watermark rank
    ? highestRankAtOrBelowIlvl(item.track, watermarkIlvl) // convert ilvl to rank
    : undefined; // handle missing watermark

  for (const step of t.steps) { // iterate through track steps
    if (step.from < from || step.to > target) continue; // skip steps outside desired range
    const newIlvl = t.ilvlByRank[step.to]; // determine ilvl after applying step
    const isFreeViaWatermark = watermarkRank != null && step.to <= watermarkRank; // free if watermark already covers it
    const baseCost = step.cost; // base crest cost from track definition
    const discount = !isFreeViaWatermark // only apply discounts when paying
      ? Math.min(baseCost, ctx.crestDiscounts?.[step.crest] ?? 0) // cap discount to base cost
      : 0; // skip discount when step is free
    const effectiveCost = isFreeViaWatermark // compute post-watermark, post-discount cost
      ? 0 // free when watermark covers the step
      : Math.max(0, baseCost - discount); // ensure non-negative after discount
    steps.push({ ...step, cost: effectiveCost, newIlvl }); // append step including resulting ilvl and effective cost
    if (effectiveCost > 0) { // only accumulate positive costs
      crestTotals[step.crest] = (crestTotals[step.crest] ?? 0) + effectiveCost; // accumulate crest cost per tier
    }
  }

  const fromIlvl = t.ilvlByRank[from]; // record starting item level
  const toIlvl = t.ilvlByRank[target]; // record ending item level

  let note: string | undefined; // optional note explaining recommendation

  if (item.crafted || (item.id && NO_CREST_UPGRADE_ITEM_IDS.has(item.id))) { // annotate crafted or excluded items
    note = "Crafted/season item - no crest upgrades."; // explain upgrade restriction
  } else if (item.track === "Hero") { // provide hero-specific notes
    const ilvlNow = item.ilvl ?? fromIlvl; // determine current ilvl for messaging
    const runedStepCost = t.steps.find((s) => s.crest === "Runed")?.cost ?? 15; // approximate Runed upgrade cost

    if (ilvlNow < dropCeilingIlvl) { // advise when below drop ceiling
      if ((ctx.surplusRuned ?? 0) >= runedStepCost) { // check if surplus Runed exists
        note = `Below ${dropCeilingIlvl} - wait for drops, but you do have surplus Runed if you want to push early.`; // suggest patience with optional spend
      } else { // fallback when no surplus-runed
        note = `Below ${dropCeilingIlvl} - let natural drops catch this up before spending Runed.`; // advise waiting for drops
      }
    } else if (target === from) { // handle case where hero target stays same
      note = "Already beyond the efficient Runed breakpoint - save Gilded for Myth upgrades."; // suggest saving high crests
    }
  } else if (item.track === "Champion" && target === from) { // note champion items with no upgrade
    note = "Champion past the cheap breakpoint spends Runed - save those for better slots."; // advise preserving Runed crests
  }

  if (target === from && !note) { // add generic note when no upgrade recommended
    note = `Upgrading wouldn't push you above your drop ceiling (${dropCeilingIlvl}).`; // explain why upgrade skipped
  }

  return { // return the assembled plan
    slot: item.slot, // report item slot
    fromRank: from, // include starting rank
    toRank: target, // include target rank
    fromIlvl, // include starting ilvl
    toIlvl, // include ending ilvl
    steps, // include detailed steps
    crestTotals, // include crest totals
    note, // include advisory note if present
  }; // end of plan object
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

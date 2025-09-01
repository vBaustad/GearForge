import { tracks } from "./tracks";
import type {
  TrackKey,
  Crest,
  ItemState,
  PlayerContext,
  StepPlan,
  ItemPlan,
  PlanAllResult,
} from "../types/simc";

/** Items that do NOT use crest upgrades (season cloak etc.). */
const NO_CREST_UPGRADE_ITEM_IDS = new Set<number>([
  235499, // Reshii Wraps (season cloak; its own path)
  245964, // Durable Information Securing Container (old belt)
  // add more here as we discover them
]);

/** Find the highest rank that uses only the given crest types. */
function highestRankUsingCrests(track: TrackKey, allowed: Crest[]): number {
  const t = tracks[track];
  let max = 1;
  for (const step of t.steps) {
    if (allowed.includes(step.crest) && step.to > max) max = step.to;
  }
  return max;
}

/** Exact rank whose ilvl equals target, or -1 if none. */
function rankForIlvl(track: TrackKey, targetIlvl: number): number {
  const table = tracks[track].ilvlByRank;
  for (const [rStr, ilvl] of Object.entries(table)) {
    if (ilvl === targetIlvl) return Number(rStr);
  }
  return -1;
}

/** Compute the recommended target rank based on the flowchart-style policy. */
function chooseTargetRank(item: ItemState): number {
  const t = tracks[item.track];
  const from = Math.min(Math.max(1, item.rank), t.maxRank);

  // 1) Never upgrade crafted or flagged special items
  if (item.crafted || (item.id && NO_CREST_UPGRADE_ITEM_IDS.has(item.id))) {
    return from;
  }

  // 2) Policy per track
  if (item.track === "Myth") {
    // Spend Gilded to max on Myth items.
    return t.maxRank;
  }

  if (item.track === "Hero") {
    // Natural drop ceiling for Hero drops is 701 (rank 3).
    // Only recommend Runed for 701 -> 704 (rank 4).
    const ilvl = item.ilvl ?? 0;
    if (ilvl < 701) return from; // wait for natural drops
    if (ilvl < 704) {
      const r704 = rankForIlvl("Hero", 704);
      return r704 > 0 ? Math.max(from, r704) : from;
    }
    // 704+ would cost Gilded on Hero; skip (save Gilded for Myth).
    return from;
  }

  if (item.track === "Champion") {
    // Use Weathered/Carved only (up to 694/r4). Do not spend Runed on Champion.
    const carvedCap = highestRankUsingCrests("Champion", ["Weathered", "Carved"]);
    return Math.max(from, carvedCap);
  }

  if (item.track === "Veteran") {
    // Weathered/Carved only -> safe to take to max (691/r8).
    return t.maxRank;
  }

  // Fallback (shouldn't happen).
  return from;
}

/** Compute steps from current -> target and total the crests. */
export function planItemUpgrade(
  item: ItemState,
  ctx: PlayerContext & { surplusRuned?: number } // optional hint input
): ItemPlan {
  const t = tracks[item.track];
  const from = Math.min(Math.max(1, item.rank), t.maxRank);

  // Decide target per policy.
  let target = chooseTargetRank(item);

  // Enforce "don’t finish ≤ ceiling" unless the whole path is Weathered/Carved-only.
  if (!ctx.ignoreCeiling && target > from) {
    const toIlvl = t.ilvlByRank[target];
    const onlyCheap = t.steps
      .filter((s) => s.from >= from && s.to <= target)
      .every((s) => s.crest === "Weathered" || s.crest === "Carved");

    if (!onlyCheap && toIlvl <= ctx.dropCeilingIlvl) {
      target = from; // not worth spending to end at/below ceiling
    }
  }

  const steps: StepPlan[] = [];
  const crestTotals: Partial<Record<Crest, number>> = {};

  for (const step of t.steps) {
    if (step.from < from || step.to > target) continue;
    const newIlvl = t.ilvlByRank[step.to];
    steps.push({ ...step, newIlvl });
    crestTotals[step.crest] = (crestTotals[step.crest] ?? 0) + step.cost;
  }

  const fromIlvl = t.ilvlByRank[from];
  const toIlvl = t.ilvlByRank[target];

  // ---------------- Notes / rationale ----------------
  let note: string | undefined;

  if (item.crafted || (item.id && NO_CREST_UPGRADE_ITEM_IDS.has(item.id))) {
    note = "Crafted/season item — no crest upgrades.";
  } else if (item.track === "Hero") {
    const ilvl = item.ilvl ?? 0;
    if (ilvl < 701) {
      // If caller passed a surplus hint, surface it.
      if ((ctx.surplusRuned ?? 0) >= 15) {
        note = "Below 701 — recommended to wait, but you have surplus Runed this week; you could spend 15 Runed now if desired.";
      } else {
        note = "Below 701 — save Runed; let natural drops carry this to 701 first.";
      }
    } else if (ilvl >= 704) {
      note = "Already 704+ on Hero — save Gilded for Myth items.";
    }
  } else if (item.track === "Champion" && target === from) {
    note = "Champion uses Runed past 694 — save Runed for better slots.";
  }

  if (target === from && !note) {
    note = `Upgrading wouldn't push you above your drop ceiling (${ctx.dropCeilingIlvl}).`;
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

/** Plan across multiple items and aggregate crest totals. */
export function planAll(
  items: ItemState[],
  ctx: PlayerContext & { crestStock?: Partial<Record<Crest, number>> } // optional crest stock
): PlanAllResult {
  // Compute a "baseline" Runed need: 15 × (# of Hero items at 701 (r3) we will push to 704).
  // This lets us tell users with surplus Runed that they *could* push sub-701 items early.
  let heroR3Count = 0;
  for (const it of items) {
    if (it.track !== "Hero") continue;
    const t = tracks[it.track];
    const from = Math.min(Math.max(1, it.rank), t.maxRank);
    if (from === rankForIlvl("Hero", 701)) heroR3Count++;
  }
  const baselineRuned = heroR3Count * 15;
  const availableRuned = ctx.crestStock?.Runed ?? 0;
  const surplusRuned = Math.max(0, availableRuned - baselineRuned);

  const plans = items.map((it) => planItemUpgrade(it, { ...ctx, surplusRuned }));
  const totals: Partial<Record<Crest, number>> = {};
  for (const p of plans) {
    for (const [crest, cost] of Object.entries(p.crestTotals)) {
      totals[crest as Crest] = (totals[crest as Crest] ?? 0) + (cost ?? 0);
    }
  }
  return { plans, totals };
}

// src/features/optimizer/components/NarrativePlan.tsx
import styles from "./components.module.css";
import type { ItemPlan, Crest } from "../types/simc";
import { SLOT_DISPLAY } from "../services/slotMap";

/* ──────────────────────────────────────────────────────────────
   Helpers
────────────────────────────────────────────────────────────── */

function slotPriority(slot: string) {
  if (slot === "main_hand" || slot === "off_hand") return 100;
  if (slot.startsWith("trinket")) return 90;
  if (slot.startsWith("finger")) return 80;
  return 50;
}

const CREST_TIER_RANK: Record<Crest, number> = {
  Weathered: 1,
  Carved: 2,
  Runed: 3,
  Gilded: 4,
};

type Annotated = ItemPlan & {
  delta: number;
  crestSum: number;
  efficiency: number; // ilvl per crest
  crossesCeiling: boolean;
  tiersUsed: Crest[];
  highestTier: number;
  highestCrest?: Crest;
  tags: string[]; // visual badges
};

function annotate(p: ItemPlan, ceilingIlvl: number): Annotated {
  const delta = p.toIlvl - p.fromIlvl;
  const crestSum = Object.values(p.crestTotals).reduce((a, b) => a + (b ?? 0), 0);
  const efficiency = crestSum > 0 ? delta / crestSum : Number.POSITIVE_INFINITY;
  const crossesCeiling = p.fromIlvl <= ceilingIlvl && p.toIlvl > ceilingIlvl;

  const tiersUsed = (Object.entries(p.crestTotals) as [Crest, number][])
    .filter(([, n]) => (n ?? 0) > 0)
    .map(([c]) => c);

  const highestTier = tiersUsed.reduce(
    (m, c) => Math.max(m, CREST_TIER_RANK[c]),
    0
  );
  const highestCrest =
    tiersUsed.length > 0
      ? tiersUsed.reduce((best, c) =>
          CREST_TIER_RANK[c] > CREST_TIER_RANK[best] ? c : best
        )
      : undefined;

  return {
    ...p,
    delta,
    crestSum,
    efficiency,
    crossesCeiling,
    tiersUsed,
    highestTier,
    highestCrest,
    tags: [], // filled later
  };
}

function reasonText(a: Annotated, isBestEff: boolean, isMaxDelta: boolean, ceilingIlvl: number) {
  if (a.crossesCeiling) {
    return `crosses your natural drop ceiling (${ceilingIlvl})`;
  }
  if (isBestEff && isFinite(a.efficiency)) {
    return "best ilvl-per-crest value";
  }
  if (isMaxDelta) {
    return "largest single-slot gain";
  }
  if (a.crestSum === 0) {
    return "no crests required (flightstones only)";
  }
  if (a.tiersUsed.length === 1) {
    const c = a.tiersUsed[0];
    if (c === "Weathered") return "uses only low-tier crests";
    if (c === "Carved") return "uses only mid-tier crests";
    return `uses ${c} crests efficiently`;
  }
  if (a.highestCrest) {
    return `uses ${a.highestCrest} crests for a strong push`;
  }
  return "solid upgrade for the cost";
}

function approxEqual(a: number, b: number, eps = 1e-9) {
  return Math.abs(a - b) <= eps;
}

/* Crest totals across all items for the summary bar */
function aggregateCrests(plans: ItemPlan[]): Partial<Record<Crest, number>> {
  const out: Partial<Record<Crest, number>> = {};
  for (const p of plans) {
    for (const [k, v] of Object.entries(p.crestTotals) as [Crest, number][]) {
      if (!v) continue;
      out[k] = (out[k] ?? 0) + v;
    }
  }
  return out;
}

/* Small crest pill group for a single row (rightmost column) */
function CrestPills({ plan }: { plan: ItemPlan }) {
  const entries = Object.entries(plan.crestTotals).filter(([, n]) => (n ?? 0) > 0) as [Crest, number][];
  if (entries.length === 0) {
    return <span className={styles.badge}>Flightstones only</span>;
  }
  return (
    <div className={styles.crestTotalsRow}>
      {entries.map(([tier, n]) => (
        <span key={tier} className={styles.crestPill} title={`${n} ${tier}`}>
          <span className={styles.crestPillTier}>{tier}</span>
          <span className={styles.crestPillValue}>{n}</span>
        </span>
      ))}
    </div>
  );
}

/* Summary crest totals row (top of card) */
function CrestTotalsSummary({ totals }: { totals: Partial<Record<Crest, number>> }) {
  const entries = (Object.entries(totals) as [Crest, number][])
    .filter(([, n]) => (n ?? 0) > 0);

  if (entries.length === 0) return null;

  const sum = entries.reduce((s, [, n]) => s + n, 0);

  return (
    <div className={styles.crestBar} aria-label="Total crest costs">
      <span className={styles.crestTotalPill} title={`${sum} total crests`}>
        <span className={styles.crestTotalLabel}>Total crests</span>
        <span className={styles.crestTotalValue}>{sum}</span>
      </span>
      {entries.map(([tier, n]) => (
        <span key={tier} className={styles.crestPill} title={`${n} ${tier}`}>
          <span className={styles.crestPillTier}>{tier}</span>
          <span className={styles.crestPillValue}>{n}</span>
        </span>
      ))}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   Component
────────────────────────────────────────────────────────────── */

export function NarrativePlan({
  plans,
  ceilingIlvl,
}: {
  plans: ItemPlan[];
  ceilingIlvl: number;
}) {
  const actionable = plans.filter((p) => p.steps.length > 0);
  if (actionable.length === 0) {
    return (
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>Upgrade plan</h3>
        <p className={styles.helperText}>
          No crest-efficient upgrades right now given your content ceiling ({ceilingIlvl}).
        </p>
      </div>
    );
  }

  // Annotate and compute globals
  const annotated = actionable.map((p) => annotate(p, ceilingIlvl));
  const maxDelta = Math.max(...annotated.map((a) => a.delta));
  const finiteEff = annotated.filter((a) => isFinite(a.efficiency));
  const maxEff = finiteEff.length ? Math.max(...finiteEff.map((a) => a.efficiency)) : 0;

  // Tag reasons for badges
  for (const a of annotated) {
    if (a.crossesCeiling) a.tags.push("Ceiling breaker");
    if (isFinite(a.efficiency) && approxEqual(a.efficiency, maxEff)) a.tags.push("Best value");
    if (a.delta === maxDelta) a.tags.push("Biggest gain");
    if (a.crestSum === 0) a.tags.push("No crests");
  }

  // Sort: delta → slot priority → highest crest tier (your original intent)
  const sorted = [...annotated].sort((a, b) => {
    if (b.delta !== a.delta) return b.delta - a.delta;
    const sa = slotPriority(a.slot);
    const sb = slotPriority(b.slot);
    if (sb !== sa) return sb - sa;
    return b.highestTier - a.highestTier;
  });

  // Totals summary
  const crestTotals = aggregateCrests(sorted);

  return (
    <div className={styles.card}>
      <h3 className={styles.cardTitle}>Upgrade plan</h3>

      {/* Top summary: total crests by tier */}
      <CrestTotalsSummary totals={crestTotals} />

      {/* Nice, compact recommendation rows */}
      <ol className={styles.recList} aria-label="Prioritized upgrade steps">
        {sorted.map((p) => {
          const slotName = SLOT_DISPLAY[p.slot as keyof typeof SLOT_DISPLAY];
          const reason = reasonText(
            p,
            isFinite(p.efficiency) && approxEqual(p.efficiency, maxEff),
            p.delta === maxDelta,
            ceilingIlvl
          );

          return (
            <li key={p.slot} className={styles.recRow}>
              {/* Col 1: slot */}
              <div className={styles.slot}>{slotName}</div>

              {/* Col 2: main text */}
              <div>
                <div className={styles.itemName}>
                  Upgrade to <strong>ilvl {p.toIlvl}</strong>{" "}
                  <span className={styles.meta}>(r{p.fromRank}→{p.toRank})</span>
                </div>
                <div className={styles.meta}>
                  {p.tags.map((t) => (
                    <span key={t} className={styles.badge}>{t}</span>
                  ))}{" "}
                  <span>Reason: {reason}.</span>
                </div>
              </div>

              {/* Col 3: delta badge */}
              <div>
                <span className={styles.badge}>+{p.delta} ilvl</span>
              </div>

              {/* Col 4: crest pills */}
              <CrestPills plan={p} />
            </li>
          );
        })}
      </ol>
    </div>
  );
}

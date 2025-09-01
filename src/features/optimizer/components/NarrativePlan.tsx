// src/features/optimizer/components/NarrativePlan.tsx
import styles from "./components.module.css";
import type { ItemPlan, Crest } from "../types/simc";
import { SLOT_DISPLAY } from "../services/slotMap";

function crestStr(p: ItemPlan) {
  return Object.entries(p.crestTotals)
    .filter(([, v]) => (v ?? 0) > 0)
    .map(([k, v]) => `${v} ${k}`)
    .join(", ");
}

function slotPriority(slot: string) {
  if (slot === "main_hand" || slot === "off_hand") return 100;
  if (slot.startsWith("trinket")) return 90;
  if (slot.startsWith("finger")) return 80;
  return 50;
}

// explicit rank map with full type safety
const CREST_TIER_RANK: Record<Crest, number> = {
  Weathered: 1,
  Carved: 2,
  Runed: 3,
  Gilded: 4,
};

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

  // sort by ilvl delta, then slot priority, then highest crest tier
  const sorted = [...actionable].sort((a, b) => {
    const da = a.toIlvl - a.fromIlvl;
    const db = b.toIlvl - b.fromIlvl;
    if (db !== da) return db - da;

    const sa = slotPriority(a.slot);
    const sb = slotPriority(b.slot);
    if (sb !== sa) return sb - sa;

    const ah = Math.max(
      0,
      ...Object.keys(a.crestTotals).map(
        (k) => CREST_TIER_RANK[k as Crest] ?? 0
      )
    );
    const bh = Math.max(
      0,
      ...Object.keys(b.crestTotals).map(
        (k) => CREST_TIER_RANK[k as Crest] ?? 0
      )
    );
    return bh - ah;
  });

  return (
    <div className={styles.card}>
      <h3 className={styles.cardTitle}>Upgrade plan</h3>
      <ol className={styles.steps}>
        {sorted.map((p) => (
          <li key={p.slot}>
            <strong>
              {SLOT_DISPLAY[p.slot as keyof typeof SLOT_DISPLAY]}
            </strong>
            : upgrade {p.fromIlvl} → {p.toIlvl} (rank {p.fromRank}→
            {p.toRank}). Spend {crestStr(p)}.{" "}
            <span className={styles.helperText}>
              Reason: pushes this slot above your current drop ceiling (
              {ceilingIlvl}).
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

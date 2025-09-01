// PlansSummary.tsx
import styles from "./components.module.css";
import type { Crest } from "../types/simc";

export function PlansSummary({ totals }: {
  totals: Partial<Record<Crest, number>>;
}) {
  return (
    <div className={styles.card}>
      <h3 className={styles.cardTitle}>Crests to spend</h3>
      <div className={styles.crestTotalsRow}>
        {(["Weathered","Carved","Runed","Gilded"] as Crest[]).map(c => (
          <span key={c} className={styles.crestTotalPill}>
            <strong className={styles.crestTotalLabel}>{c}</strong>
            <span className={styles.crestTotalValue}>{totals[c] ?? 0}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

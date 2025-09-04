import styles from "./crests.module.css";
import { CrestIcon } from "./CrestIcon";
import type { Crest } from "../../types/crests";
import { CREST_ORDER, CREST_LABEL_LONG, CREST_LABEL_SHORT } from "./crests";

type Props = {
  counts: Partial<Record<Crest, number>>;
  showZero?: boolean;
  size?: number;
  order?: ReadonlyArray<Crest>;
};

export function CrestWallet({
  counts,
  showZero = false,
  size = 16,
  order = CREST_ORDER,          // readonly is fine now
}: Props) {
  const items = order
    .map((tier) => ({ tier, count: counts[tier] ?? 0 }))
    .filter((x) => showZero || x.count > 0);

  if (!items.length) return null;

  return (
    <div role="list" aria-label="Crest wallet" className={styles.row}>
      {items.map(({ tier, count }) => (
        <span
          key={tier}
          role="listitem"
          className={styles.pill}
          title={`${CREST_LABEL_LONG[tier]}: ${count}`}
        >
          <CrestIcon tier={tier} size={size} />
          <strong className={styles.count}>{count}</strong>
          <span className={styles.label}>{CREST_LABEL_SHORT[tier]}</span>
        </span>
      ))}
    </div>
  );
}

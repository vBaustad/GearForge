import styles from "../optimizer.module.css";
import { type ParsedItem } from "../types/simc";
function prettySlot(slot: string) {
  if (slot.startsWith("trinket")) return slot.replace("trinket", "Trinket ");
  if (slot.startsWith("finger")) return slot.replace("finger", "Ring ");
  if (slot.includes("_")) return slot.split("_").map(s => s[0].toUpperCase()+s.slice(1)).join(" ");
  return slot[0].toUpperCase() + slot.slice(1);
}

interface Props {
  items: ParsedItem[];
}

export function ResultsTable({ items }: Props) {
  return (
    <div className={styles.card}>
      <h3 className={styles.cardTitle}>All items</h3>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Slot</th>
              <th>Name</th>
              <th>iLvl</th>
              <th>Item ID</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={`${it.slot}-${it.id}`}>
                <td>{prettySlot(it.slot)}</td>
                <td>{it.name ?? "—"}</td>
                <td>{it.ilvl ?? "—"}</td>
                <td>{it.id}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

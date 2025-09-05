import { PROGRESSION_ICONS } from "./progession"
import c from "../components.module.css";

export function ProgressionStats({
  catalyst,
  weeksUntilNext,
  sparks,
  week,
}: {
  catalyst: number;
  weeksUntilNext: number;
  sparks: number;
  week: number;
}) {
  return (
    <div className={c.rightGroup}>
      <span className={c.infobarStat}>
        <img className={c.statIcon} src={PROGRESSION_ICONS.catalyst} width={14} height={14}
             loading="lazy" decoding="async" alt="" aria-hidden="true" />
        <strong>Catalyst:</strong> {catalyst}{" "}
        <em>
          ({weeksUntilNext === 0
            ? "next this week"
            : `next in ${weeksUntilNext} week${weeksUntilNext > 1 ? "s" : ""}`})
        </em>
      </span>

      <span className={c.infobarDivider} aria-hidden="true">•</span>

      <span className={c.infobarStat}>
        <img className={c.statIcon} src={PROGRESSION_ICONS.spark} width={14} height={14}
             loading="lazy" decoding="async" alt="" aria-hidden="true" />
        <strong>Sparks:</strong> {sparks.toFixed(1)}
      </span>

      <span className={c.infobarDivider} aria-hidden="true">•</span>

      <span className={c.infobarNote} aria-label={`Season week ${week}`}>
        Week {week}
      </span>
    </div>
  );
}

import { useMemo } from "react";
import { getCrestCaps } from "../features/optimizer/services/crests";
import c from "./components.module.css";

const ORDER = ["Gilded", "Runed", "Carved", "Weathered"] as const;
type Tier = (typeof ORDER)[number];

export function InfoBar({ sticky = false }: { sticky?: boolean }) {
  const caps = useMemo(() => getCrestCaps(), []);
  if (!caps.length) return null;

  const byTier = Object.fromEntries(
    caps.map((cap) => [cap.tier as Tier, cap] as const)
  ) as Record<Tier, (typeof caps)[number]>;

  const week = Math.max(...caps.map((c) => c.weeksOpen ?? 0));

  return (
    <div
      className={`${c.infobarRoot} ${sticky ? c.infobarSticky : ""}`}
      role="region"
      aria-label="Crest caps"
    >
      <div className={c.infobarInner}>
        <span className={c.infobarLabel}>Crest Caps</span>

        <div className={c.infobarSegments} role="list">
          {ORDER.map((tier) => {
            const cap = byTier[tier];
            return (
              <span
                key={tier}
                className={c.infobarSegment}
                role="listitem"
                title={`${tier} cap: ${cap.currentCap} (week +${cap.weeklyIncrement})`}
                aria-label={`${tier} cap ${cap.currentCap}, weekly +${cap.weeklyIncrement}`}
              >
                <span className={c.infobarSwatch} data-tier={tier} aria-hidden />
                <span className={c.infobarTier}>{tier}</span>
                <span className={c.infobarSep}>:</span>
                <span className={c.infobarValue}>{cap.currentCap}</span>
              </span>
            );
          })}
        </div>

        <div className={c.infobarSpacer} />
        <span className={c.infobarNote}>Week {week}</span>
      </div>
    </div>
  );
}

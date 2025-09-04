// src/components/InfoBar.tsx
import { useMemo } from "react";
import { getCrestCaps } from "../features/optimizer/services/crests";
import c from "./components.module.css";

const ORDER = ["Gilded", "Runed", "Carved", "Weathered"] as const;
type Tier = (typeof ORDER)[number];

const ICON_SRC: Record<Tier, string> = {
  Gilded:    "/images/crests/gilded.jpg",
  Runed:     "/images/crests/runed.jpg",
  Carved:    "/images/crests/carved.jpg",
  Weathered: "/images/crests/weathered.jpg",
};

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

        {/* Icon pills */}
        <div className={c.crestRow} role="list">
          {ORDER.map((tier) => {
            const cap = byTier[tier];
            if (!cap) return null;
            return (
              <span
                key={tier}
                className={c.crestPill}
                data-tier={tier}                         // <-- add this
                role="listitem"
                title={`${tier} cap: ${cap.currentCap} (weekly +${cap.weeklyIncrement})`}
                aria-label={`${tier} cap ${cap.currentCap}, weekly +${cap.weeklyIncrement}`}
              >
                <img
                  className={c.crestImg}
                  src={ICON_SRC[tier]}
                  width={16}
                  height={16}
                  loading="lazy"
                  decoding="async"
                  alt={`${tier} crest`}
                />
                <strong className={c.crestCount}>{cap.currentCap}</strong>
                <span className={c.crestLabel}>{tier}</span>
              </span>
            );
          })}
        </div>

        <div className={c.infobarSpacer} />
        <span className={c.infobarNote} aria-label={`Season week ${week}`}>
          Week {week}
        </span>
      </div>
    </div>
  );
}

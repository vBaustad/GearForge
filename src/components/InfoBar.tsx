// src/components/InfoBar.tsx
import { useMemo } from "react";
import { CREST_ORDER, CREST_ICONS, type CrestTier } from "./crests/crests";
import { season } from "../config/seasons/currentSeason";
import { getCrestCapsForSeason } from "../config/seasons/crestCaps";
import { computeCatalyst, computeSparks } from "../config/seasons/progression";
import c from "./components.module.css";

export function InfoBar({ sticky = false }: { sticky?: boolean }) {
  // Crest caps from season config
  const caps = useMemo(() => getCrestCapsForSeason(season), []);
  if (!caps.length) return null;

  const byTier = Object.fromEntries(
    caps.map((cap) => [cap.tier as CrestTier, cap] as const)
  ) as Record<CrestTier, (typeof caps)[number]>;

  const week = Math.max(...caps.map((c) => c.weeksOpen ?? 0));

  // Season progression
  const { total: sparks } = computeSparks(season);
  const { total: catalyst, weeksUntilNext } = computeCatalyst(season);

  return (
    <div
      className={`${c.infobarRoot} ${sticky ? c.infobarSticky : ""}`}
      role="region"
      aria-label="Crest caps and seasonal resources"
    >
      <div className={c.infobarInner}>
        {/* LEFT */}
        <div className={c.leftGroup}>
          <span className={c.infobarLabel}>Crest Caps</span>
          <div className={c.crestRow} role="list">
            {CREST_ORDER.map((tier) => {
              const cap = byTier[tier];
              if (!cap) return null;
              return (
                <span
                  key={tier}
                  className={c.crestPill}
                  data-tier={tier}
                  role="listitem"
                  title={`${tier} cap: ${cap.currentCap} (weekly +${cap.weeklyIncrement})`}
                  aria-label={`${tier} cap ${cap.currentCap}, weekly +${cap.weeklyIncrement}`}
                >
                  <img
                    className={c.crestImg}
                    src={CREST_ICONS[tier]}
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
        </div>

        {/* RIGHT */}
        <div className={c.rightGroup}>
          <span className={c.infobarStat}>
            <strong>Catalyst:</strong> {catalyst}{" "}
            <em>
              ({weeksUntilNext === 0
                ? "next this week"
                : `next in ${weeksUntilNext} week${weeksUntilNext > 1 ? "s" : ""}`})
            </em>
          </span>
          <span className={c.infobarDivider} aria-hidden="true">•</span>
          <span className={c.infobarStat}>
            <strong>Sparks:</strong> {sparks.toFixed(1)}
          </span>
          <span className={c.infobarDivider} aria-hidden="true">•</span>
          <span className={c.infobarNote} aria-label={`Season week ${week}`}>
            Week {week}
          </span>
        </div>
      </div>
    </div>
  );
}

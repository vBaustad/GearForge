// src/components/InfoBar.tsx
import { useMemo } from "react";
import { CREST_ORDER, CREST_ICONS, type CrestTier } from "./crests/crests";
import { season } from "../config/seasons/currentSeason";
import { getCrestCapsForSeason } from "../config/seasons/utils/crestCaps";
import { computeCatalyst, computeSparks } from "../config/seasons//utils/progression";
import { PROGRESSION_ICONS } from "./progression/progession"
import c from "./components.module.css";

function isHalf(n: number) {
  // robust .5 check (avoids float jitter)
  return Math.abs(n * 2 - Math.round(n * 2)) < 1e-9 && (Math.round(n * 2) % 2 === 1);
}
function formatSparks(n: number) {
  return isHalf(n) ? n.toFixed(1) : Math.floor(n).toString();
}

  /** Parse "s3" / "season-3" / "season_3" / trailing "-3" from an id like "tww-s3". */
  function getSeasonNumberFromId(id: string): number | undefined {
    const m =
      id.match(/(?:^|[-_])s(?:eason)?[-_]?(\d+)\b/i) || // tww-s3, tww-season-3, season_3
      id.match(/-(\d+)$/);                               // fallback: trailing "-3"
    return m ? Number(m[1]) : undefined;
  }

  export function InfoBar({ sticky = false }: { sticky?: boolean }) {
    // Crest caps from season config
    const caps = useMemo(() => getCrestCapsForSeason(season), []);
    if (!caps.length) return null;

    const byTier = Object.fromEntries(
      caps.map((cap) => [cap.tier as CrestTier, cap] as const)
    ) as Record<CrestTier, (typeof caps)[number]>;

    const week = Math.max(...caps.map((c) => c.weeksOpen ?? 0));

    // Season progression
    const { total: sparksTotal } = computeSparks(season);
    const { total: catalystTotal, weeksUntilNext } = computeCatalyst(season);

    // Season number (derived from id)
    const seasonNumber = getSeasonNumberFromId(season.id);

  const catalystTooltip =
    weeksUntilNext === 0
      ? "Catalyst: next available this reset."
      : `Catalyst: next in ${weeksUntilNext} week${weeksUntilNext > 1 ? "s" : ""}.`;

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

        {/* RIGHT — reuse pill styling for consistency */}
        <div className={c.rightGroup}>
          {/* Catalyst pill */}
          <span
            className={c.crestPill}
            role="listitem"
            title={catalystTooltip}
            aria-label={`Catalyst ${catalystTotal}. ${catalystTooltip}`}
          >
            <img
              className={c.crestImg}
              src={PROGRESSION_ICONS.catalyst}
              width={16}
              height={16}
              loading="lazy"
              decoding="async"
              alt="Catalyst"
            />
            <strong className={c.crestCount}>{catalystTotal}</strong>
            <span className={c.crestLabel}>Catalyst</span>
          </span>

          {/* Sparks pill */}
          <span
            className={c.crestPill}
            role="listitem"
            title="Sparks (you can craft/upgrade at 1.0)."
            aria-label={`Sparks ${formatSparks(sparksTotal)}`}
          >
            <img
              className={c.crestImg}
              src={PROGRESSION_ICONS.spark}
              width={16}
              height={16}
              loading="lazy"
              decoding="async"
              alt="Sparks"
            />
            <strong className={c.crestCount}>{formatSparks(sparksTotal)}</strong>
            <span className={c.crestLabel}>Sparks</span>
          </span>

          {/* Week pill (no icon to keep it subtle) */}
          <span
            className={c.crestPill}
            role="listitem"
            title={`Season ${seasonNumber} - week ${week}`}
            aria-label={`Season ${seasonNumber} - week ${week}`}
          >
            <span className={c.crestLabel}>Week</span>
            <strong className={c.crestCount}>{week}</strong>            
          </span>
        </div>
      </div>
    </div>
  );
}

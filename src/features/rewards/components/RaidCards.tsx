import { getRaidViewData } from "../services/raid";
import c from "./components.module.css";

export function RaidCards() {
  const { cards } = getRaidViewData();
  if (!cards?.length) return null;

  return (
    <div
      className={c.cardGrid4}
      role="list"
      aria-label="Raid difficulties and their loot item levels"
    >
      {cards.map((card) => {
        const titleId = `raid-${String(card.difficulty).toLowerCase()}`;

        return (
          <article
            key={card.difficulty}
            role="listitem"
            aria-labelledby={titleId}
            className={`${c.cardPanel} ${c.raidCard}`}
          >
            <div className={c.cardHeadRow}>
              <div>
                <div className={c.kicker}>Raid</div>
                <h3 id={titleId} className={c.cardTitle}>
                  {card.difficulty}
                </h3>
              </div>

              {/* Crest pill (decorative icon; text announces the tier) */}
              <span
                className={c.crestPill}
                title={`${card.crest.tier} crests drop here`}
                aria-label={`${card.crest.tier} crests`}
              >
                <img
                  src={card.crest.icon}
                  alt=""
                  aria-hidden="true"
                  width={20}
                  height={20}
                  loading="lazy"
                  decoding="async"
                  className={c.crestImgSm}
                />
                <span className={c.crestPillText}>{card.crest.tier}</span>
              </span>
            </div>

            <div className={c.segmentList}>
              {card.segments.map((s) => (
                <div
                  key={s.label}
                  className={c.segment}
                  aria-label={`${s.label}: item level ${s.ilvl}${s.rankLabel ? `, ${s.rankLabel}` : ""}`}
                >
                  <div className={c.segmentTopRow}>
                    <span className={c.segmentLabel}>{s.label}</span>
                    <span className={`${c.ilvl} ${c.tabular}`}>{s.ilvl}</span>
                  </div>
                  {s.rankLabel && (
                    <div className={c.rankSmallGold}>{s.rankLabel}</div>
                  )}
                </div>
              ))}
            </div>
          </article>
        );
      })}
    </div>
  );
}

// src/features/rewards/components/RaidCards.tsx
import { getRaidViewData } from "../services/raid";

const RANK_COLOR = "text-amber-300"; // brand gold

export function RaidCards() {
  const { cards } = getRaidViewData();

  if (!cards?.length) return null;

  return (
    <div
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3"
      role="list"
      aria-label="Raid difficulties and their loot item levels"
    >
      {cards.map((c) => {
        const titleId = `raid-${String(c.difficulty).toLowerCase()}`;

        return (
          <article
            key={c.difficulty}
            role="listitem"
            aria-labelledby={titleId}
            className="rounded-2xl border border-gray-800 bg-black/60 p-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm uppercase tracking-wide text-gray-400">Raid</div>
                <h3 id={titleId} className="text-xl font-semibold text-white">
                  {c.difficulty}
                </h3>
              </div>

              {/* Crest pill (decorative icon; text announces the tier) */}
              <span
                className="inline-flex items-center gap-1.5 rounded-md border border-gray-700 bg-black/40 px-2.5 py-1 text-xs text-gray-100 shadow-sm"
                title={`${c.crest.tier} crests drop here`}
                aria-label={`${c.crest.tier} crests`}
              >
                <img
                  src={c.crest.icon}
                  alt=""
                  aria-hidden="true"
                  width={20}
                  height={20}
                  loading="lazy"
                  decoding="async"
                  className="h-5 w-5"
                />
                <span className="leading-none">{c.crest.tier}</span>
              </span>
            </div>

            <div className="mt-4 space-y-2">
              {c.segments.map((s) => (
                <div
                  key={s.label}
                  className="rounded-lg bg-black/30 px-3 py-2 border border-gray-800"
                  aria-label={`${s.label}: item level ${s.ilvl}${s.rankLabel ? `, ${s.rankLabel}` : ""}`}
                >
                  <div className="flex items-baseline justify-between">
                    <span className="text-gray-300">{s.label}</span>
                    <span className="text-white font-medium tabular-nums">{s.ilvl}</span>
                  </div>

                  {s.rankLabel && (
                    <div className={`text-xs ${RANK_COLOR} mt-0.5`}>{s.rankLabel}</div>
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

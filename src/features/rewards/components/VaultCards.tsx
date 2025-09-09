// src/features/rewards/components/VaultCards.tsx
import { useMemo } from "react";
import type { RewardsViewData, RewardRowUI } from "../types/rewards";
import { CREST_ICONS } from "../../../components/crests/crests";
import type { Crest } from "../../../types/crests";
import c from "./components.module.css";

function parseCrestNote(note?: string): { count: number; tier: Crest } | null {
  if (!note) return null;
  const m = note.match(/^\s*(\d+)\s+([a-z]+)\s*$/i);
  if (!m) return null;
  const count = Number(m[1]);
  const t = m[2].toLowerCase();
  const tier =
    t === "gilded" ? "Gilded" :
    t === "runed"  ? "Runed"  :
    t === "carved" ? "Carved" :
    t === "weathered" ? "Weathered" : null;
  return tier ? { count, tier } : null;
}

// Only show `/max` when we have both
function fmtTrackRank(track?: string, rank?: number, max?: number) {
  if (!track) return null;
  if (typeof rank === "number" && typeof max === "number") return `${track} ${rank}/${max}`;
  if (typeof rank === "number") return `${track} ${rank}`;
  return track;
}

export function VaultCards({ data }: { data: RewardsViewData }) {
  const spotlight: RewardRowUI[] = useMemo(() => {
    const byLevel = new Map<number, RewardRowUI>(data.rows.map(r => [r.level, r]));
    return data.spotlightLevels
      .map(lvl => byLevel.get(lvl))
      .filter((r): r is RewardRowUI => !!r);
  }, [data.rows, data.spotlightLevels]);

  if (!spotlight.length) return null;

  return (
    <div className={c.cardGrid5} role="list" aria-label="Keystone breakpoint cards">
      {spotlight.map((row) => {
        const parsed = parseCrestNote(row.note);
        const crestTier = row.crest?.tier ?? parsed?.tier;
        const crestCount = parsed?.count;

        return (
          <article key={row.level} role="listitem" className={c.cardPanel}>
            <div className={c.cardHeadRow}>
              <div>
                <div className={c.kicker}>Keystone</div>
                <h3 className={c.cardTitle}>+{row.level}</h3>
              </div>

              {/* TOP-RIGHT crest: pill with number, else icon-only */}
              {crestTier && (
                typeof crestCount === "number" ? (
                  <span
                    className={c.crestPill}
                    aria-label={`${crestCount} ${crestTier}`}
                    title={`${crestCount} ${crestTier}`}
                  >
                    <img
                      src={CREST_ICONS[crestTier]}
                      alt=""
                      aria-hidden="true"
                      width={20}
                      height={20}
                      loading="lazy"
                      decoding="async"
                      className={c.crestImgSm}
                    />
                    <strong className={`${c.crestPillText} ${c.tabular}`}>{crestCount}</strong>
                  </span>
                ) : (
                  <span
                    className={c.crestPill}
                    aria-label={`${crestTier} crest`}
                    title={`${crestTier} crest`}
                  >
                    <img
                      src={CREST_ICONS[crestTier]}
                      alt=""
                      aria-hidden="true"
                      width={20}
                      height={20}
                      loading="lazy"
                      decoding="async"
                      className={c.crestImgSm}
                    />
                  </span>
                )
              )}
            </div>

            <div className={c.cardBody}>
              <div className={c.kvBlock}>
                <div className={c.kvRow}>
                  <span className={c.kvLabel}>Dungeon Drop</span>
                  <span className={`${c.kvValue} ${c.tabular}`}>{row.endOfDungeonIlvl}</span>
                </div>
                <div className={c.rankSmallGold}>
                  {fmtTrackRank(row.endTrack, row.endRank, row.endMax)}
                </div>
              </div>

              <div className={c.kvBlock}>
                <div className={c.kvRow}>
                  <span className={c.kvLabel}>Great Vault</span>
                  <span className={`${c.kvValue} ${c.tabular}`}>{row.vaultIlvl}</span>
                </div>
                <div className={c.rankSmallGold}>
                  {fmtTrackRank(row.vaultTrack, row.vaultRank, row.vaultMax)}
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

import { useMemo } from "react";
import type { RewardsViewData, RewardRowUI } from "../types/rewards";
import { CREST_ICONS } from "../../../components/crests/crests";
import type { Crest } from "../../../types/crests";

const RANK_COLOR = "text-amber-300";

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
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {spotlight.map((row) => {
        const parsed = parseCrestNote(row.note);
        const crestTier = row.crest?.tier ?? parsed?.tier;
        const crestCount = parsed?.count;

        return (
          <div
            key={row.level}
            className="rounded-2xl border border-gray-800 bg-black/60 p-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm uppercase tracking-wide text-gray-400">Keystone</div>
                <div className="text-3xl font-semibold text-white">+{row.level}</div>
              </div>

              {/* TOP-RIGHT crest: pill with number, else icon-only in an accessible chip */}
              {crestTier && (
                typeof crestCount === "number" ? (
                  <span
                    className="inline-flex items-center gap-1.5 rounded-md border border-gray-700 bg-black/40 px-2.5 py-1 text-xs text-gray-100 shadow-sm"
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
                      className="h-5 w-5"
                    />
                    <strong className="leading-none tabular-nums">{crestCount}</strong>
                  </span>
                ) : (
                  <span
                    className="inline-flex items-center rounded-md border border-gray-700 bg-black/40 px-2.5 py-1 shadow-sm"
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
                      className="h-5 w-5"
                    />
                  </span>
                )
              )}
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <div className="flex items-baseline justify-between">
                  <span className="text-gray-400">End of Dungeon</span>
                  <span className="text-xl font-semibold text-white tabular-nums">
                    {row.endOfDungeonIlvl}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  <span className={`${RANK_COLOR} font-medium`}>
                    {fmtTrackRank(row.endTrack, row.endRank, row.endMax)}
                  </span>
                </div>
              </div>

              <div>
                <div className="flex items-baseline justify-between">
                  <span className="text-gray-400">Great Vault</span>
                  <span className="text-xl font-semibold text-white tabular-nums">
                    {row.vaultIlvl}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  <span className={`${RANK_COLOR} font-medium`}>
                    {fmtTrackRank(row.vaultTrack, row.vaultRank, row.vaultMax)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// src/features/rewards/components/DungeonLootTable.tsx
import type { RewardsViewData } from "../types/rewards";
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

function fmtTrackRank(track?: string, rank?: number, max?: number) {
  if (!track) return null;
  if (typeof rank === "number" && typeof max === "number") return `${track} ${rank}/${max}`;
  if (typeof rank === "number") return `${track} ${rank}`;
  return track;
}

export function DungeonLootTable({
  data,
  embedded = false,
}: {
  data: RewardsViewData;
  embedded?: boolean;
}) {
  if (!data.rows.length) return null;

  const frame = embedded
    ? "overflow-x-auto bg-black/60" // flush with collapsible header
    : "overflow-x-auto border border-gray-800";

  return (
    <div className={frame}>
      <table className="w-full text-sm border-collapse" aria-describedby="mplus-crest-help">
        <caption className="sr-only">
          Mythic+ keystone rewards for {data.seasonName}. Columns show keystone level,
          end-of-dungeon item level, Great Vault item level, and crest rewards.
        </caption>
        <thead className="bg-black/60 sticky top-0 z-10">
          <tr className="text-left">
            <th scope="col" className="px-4 py-3 text-gray-300 font-semibold">Keystone</th>
            <th scope="col" className="px-4 py-3 text-gray-300 font-semibold">End of Dungeon</th>
            <th scope="col" className="px-4 py-3 text-gray-300 font-semibold">Great Vault</th>
            <th scope="col" className="px-4 py-3 text-gray-300 font-semibold">Crests</th>
          </tr>
        </thead>
        <tbody>
          {data.rows.map((r, i) => {
            const parsed = parseCrestNote(r.note);
            const crestTier = r.crest?.tier ?? parsed?.tier;
            const crestIcon = crestTier ? CREST_ICONS[crestTier] : undefined;
            const crestCount = parsed?.count;

            return (
              <tr
                key={r.level}
                className={`${i % 2 === 0 ? "bg-black/40" : "bg-black/20"} hover:bg-black/30 transition-colors`}
              >
                <td className="px-4 py-3 text-white font-medium whitespace-nowrap">+{r.level}</td>

                <td className="px-4 py-3">
                  <div className="text-white text-base leading-tight tabular-nums">{r.endOfDungeonIlvl}</div>
                  <div className={`text-xs ${RANK_COLOR} leading-tight`}>
                    {fmtTrackRank(r.endTrack, r.endRank, r.endMax)}
                  </div>
                </td>

                <td className="px-4 py-3">
                  <div className="text-white text-base leading-tight tabular-nums">{r.vaultIlvl}</div>
                  <div className={`text-xs ${RANK_COLOR} leading-tight`}>
                    {fmtTrackRank(r.vaultTrack, r.vaultRank, r.vaultMax)}
                  </div>
                </td>

                <td className="px-4 py-3">
                  {crestTier && crestIcon ? (
                    <span
                      className="inline-flex items-center gap-1.5 rounded-md border border-gray-700 bg-black/40 px-2.5 py-1 text-xs text-gray-100 shadow-sm"
                      aria-label={
                        typeof crestCount === "number" ? `${crestCount} ${crestTier}` : `${crestTier}`
                      }
                      title={
                        typeof crestCount === "number" ? `${crestCount} ${crestTier}` : `${crestTier}`
                      }
                    >
                      <img src={crestIcon} alt="" width={16} height={16} className="h-4 w-4" />
                      {typeof crestCount === "number" && (
                        <strong className="leading-none tabular-nums">{crestCount}</strong>
                      )}
                    </span>
                  ) : (
                    <span className="text-gray-500">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p id="mplus-crest-help" className="sr-only">
        The “Crests” column shows a crest icon and the number of crests awarded.
      </p>
    </div>
  );
}

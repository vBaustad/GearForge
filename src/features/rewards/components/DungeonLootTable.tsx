// src/features/rewards/components/DungeonLootTable.tsx
import type { RewardsViewData } from "../types/rewards";
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

function fmtTrackRank(track?: string, rank?: number, max?: number) {
  if (!track) return "";
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

  return (
    <div className={embedded ? "" : c.tableFrame}>
      <table className={c.table} aria-describedby="mplus-crest-help">
        <caption className={c.srOnly}>
          Mythic+ keystone rewards for {data.seasonName}. Columns show keystone level,
          end-of-dungeon item level, Great Vault item level, and crest rewards.
        </caption>

        <thead className={c.tableHead}>
          <tr>
            <th scope="col" className={c.th}>Keystone</th>
            <th scope="col" className={c.th}>End of Dungeon</th>
            <th scope="col" className={c.th}>Great Vault</th>
            <th scope="col" className={c.th}>Crests</th>
          </tr>
        </thead>

        <tbody>
          {data.rows.map((r, i) => {
            const parsed = parseCrestNote(r.note);
            const crestTier = r.crest?.tier ?? parsed?.tier;
            const crestIcon = crestTier ? CREST_ICONS[crestTier] : undefined;
            const crestCount = parsed?.count;

            return (
              <tr key={r.level} className={i % 2 === 0 ? c.row : c.rowAlt}>
                <td className={c.cell}>+{r.level}</td>

                <td className={c.cell}>
                  <div className={`${c.tabular}`}>{r.endOfDungeonIlvl}</div>
                  <div className={c.rankSmallGold}>
                    {fmtTrackRank(r.endTrack, r.endRank, r.endMax)}
                  </div>
                </td>

                <td className={c.cell}>
                  <div className={`${c.tabular}`}>{r.vaultIlvl}</div>
                  <div className={c.rankSmallGold}>
                    {fmtTrackRank(r.vaultTrack, r.vaultRank, r.vaultMax)}
                  </div>
                </td>

                <td className={c.cell}>
                  {crestTier && crestIcon ? (
                    <span
                      className={c.crestChip}
                      aria-label={
                        typeof crestCount === "number" ? `${crestCount} ${crestTier}` : `${crestTier}`
                      }
                      title={
                        typeof crestCount === "number" ? `${crestCount} ${crestTier}` : `${crestTier}`
                      }
                    >
                      <img
                        src={crestIcon}
                        alt=""
                        width={16}
                        height={16}
                        className={c.crestImgSm}
                        loading="lazy"
                        decoding="async"
                      />
                      {typeof crestCount === "number" && (
                        <strong className={c.tabular}>{crestCount}</strong>
                      )}
                    </span>
                  ) : (
                    <span className={c.cellDim}>—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <p id="mplus-crest-help" className={c.srOnly}>
        The “Crests” column shows a crest icon and the number of crests awarded.
      </p>
    </div>
  );
}

import type { RewardsViewData } from "../types/rewards";

export function DungeonLootTable({ data }: { data: RewardsViewData }) {
  if (!data.rows.length) return null;

  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-800">
      <table className="w-full text-sm">
        <thead className="bg-black/60">
          <tr className="text-left">
            <th className="px-4 py-3 text-gray-300">Keystone</th>
            <th className="px-4 py-3 text-gray-300">End of Dungeon</th>
            <th className="px-4 py-3 text-gray-300">Great Vault</th>
            <th className="px-4 py-3 text-gray-300">Crests</th>
          </tr>
        </thead>
        <tbody>
          {data.rows.map((r, i) => (
            <tr
              key={r.level}
              className={i % 2 === 0 ? "bg-black/40" : "bg-black/20"}
            >
              <td className="px-4 py-2 text-white font-medium">+{r.level}</td>
              <td className="px-4 py-2 text-white">{r.endOfDungeonIlvl}</td>
              <td className="px-4 py-2 text-white">{r.vaultIlvl}</td>
              <td className="px-4 py-2 text-gray-400">{r.note ?? ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

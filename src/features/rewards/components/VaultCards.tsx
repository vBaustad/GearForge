import { useMemo } from "react";
import type { RewardsViewData, RewardRowUI } from "../types/rewards";

export function VaultCards({ data }: { data: RewardsViewData }) {
  const spotlight: RewardRowUI[] = useMemo(() => {
    const byLevel = new Map<number, RewardRowUI>(data.rows.map(r => [r.level, r]));
    return data.spotlightLevels
      .map((lvl) => byLevel.get(lvl))
      .filter((r): r is RewardRowUI => !!r);
  }, [data.rows, data.spotlightLevels]);

  if (!spotlight.length) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {spotlight.map((row) => (
        <div
          key={row.level}
          className="rounded-2xl border border-gray-800 bg-black/60 p-4"
        >
          <div className="text-sm uppercase tracking-wide text-gray-400">
            Keystone
          </div>
          <div className="text-3xl font-semibold text-white">+{row.level}</div>

          <div className="mt-4 space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-gray-400">End of Dungeon</span>
              <span className="text-xl font-semibold text-white">
                {row.endOfDungeonIlvl}
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-gray-400">Great Vault</span>
              <span className="text-xl font-semibold text-white">
                {row.vaultIlvl}
              </span>
            </div>
          </div>

          {row.tier && (
            <div className="mt-3 text-xs text-gray-500">
              {row.tier === "cap"
                ? "Weekly cap breakpoint"
                : row.tier === "high"
                ? "High reward tier"
                : row.tier === "mid"
                ? "Mid tier"
                : "Entry tier"}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

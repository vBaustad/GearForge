import { useRewardsData } from "../hooks/useRewardsData";
import { VaultCards } from "../components/VaultCards";
import { DungeonLootTable } from "../components/DungeonLootTable";
import { RaidCards } from "../components/RaidCards";
import { CollapsibleSection } from "../components/CollapsibleSection";
import { usePageMeta } from "../../../app/seo/usePageMeta";
import { Link } from "react-router-dom";

export function RewardsPage() {
  const data = useRewardsData();

  usePageMeta({
    title: "Mythic+, Raid & Great Vault Rewards",
    description:
      "Instant lookup of end-of-dungeon, raid boss groups, and Great Vault item levels.",
    image: "/images/og/gearforge-wide-dark.png",
    ogType: "website",
    canonical: "/rewards",
  });

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 space-y-8">
      {/* Header row: title on left, Home button on right */}
      <header className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Rewards: Mythic+, Raid, Vault
          </h1>
          <p className="text-gray-400">
            {data.seasonName} — End-of-dungeon, raid wings, and Great Vault item levels at a glance.
          </p>
        </div>

        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-md border border-gray-800 bg-black/60 px-3 py-1.5 text-sm text-gray-100 hover:bg-black/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/40"
          aria-label="Go to home"
        >
          <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
            <path fill="currentColor" d="M12.5 4 6 10l6.5 6 1.5-1.5L9 10l5-4.5z" />
          </svg>
          Home
        </Link>
      </header>

      {/* Breakpoints */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">Breakpoints</h2>
        <VaultCards data={data} />
      </section>

      {/* Full table (collapsed by default, flush under header) */}
      <CollapsibleSection
        id="mplus-table"
        title="Full Mythic+ Table"
        subtitle={`Keystone rewards for ${data.seasonName}`}
        defaultOpen={false}
      >
        <DungeonLootTable data={data} embedded />
      </CollapsibleSection>

      {/* Raid cards */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">Raid Drops</h2>
        <RaidCards />
      </section>
    </main>
  );
}

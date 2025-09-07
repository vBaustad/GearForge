import { useRewardsData } from "../hooks/useRewardsData";
import { VaultCards } from "../components/VaultCards";
import { DungeonLootTable } from "../components/DungeonLootTable";
// If you have your SEO hook:
import { usePageMeta } from "../../../app/seo/usePageMeta" // adjust if needed

export function RewardsPage() {
  const data = useRewardsData();

    usePageMeta({
    title: "Mythic+ & Great Vault Rewards",
    description: "Instant lookup of end-of-dungeon and Great Vault item levels by keystone level.",
    image: "/images/og/gearforge-wide-dark.png",
    ogType: "website",
    siteName: "GearForge",
    locale: "en_US", // or "nb_NO"
    twitterSite: "@yourhandle",
    twitterCreator: "@yourhandle",
    // canonical: "/rewards", // optional; defaults to full current URL
    });

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold text-white">
          Mythic+ & Great Vault Rewards
        </h1>
        <p className="text-gray-400">
          {data.seasonName}. Click in → instantly see the ilvl you get.
        </p>
      </header>

      {/* BAM: spotlight cards */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">Breakpoints</h2>
        <VaultCards data={data} />
      </section>

      {/* Full table */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">Full Table</h2>
        <DungeonLootTable data={data} />
      </section>
    </main>
  );
}

// src/features/rewards/pages/RewardsPage.tsx
import { Link } from "react-router-dom";
import page from "../../../styles/page.module.css";
import rp from "./rewardsPage.module.css";

import { useRewardsData } from "../hooks/useRewardsData";
import { VaultCards } from "../components/VaultCards";
import { DungeonLootTable } from "../components/DungeonLootTable";
import { RaidCards } from "../components/RaidCards";
import { CollapsibleSection } from "../components/CollapsibleSection";
import { usePageMeta } from "../../../app/seo/usePageMeta";


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
    <main className={`${page.wrap} ${page.wrapWide}`}>
      <section aria-label="Rewards" className={rp.board}>
        <div className={rp.introRow}>
          <div className={rp.introCopy}>
            <h1 className={rp.introTitle}>Rewards: Mythic+, Raid, Vault</h1>
            <p className={rp.introSubtitle}>
              {data.seasonName} — End-of-dungeon, raid wings, and Great Vault item levels at a glance.
            </p>
          </div>

          <Link to="/" className={`${page.homeBtn} ${rp.introHome}`} aria-label="Go to home">
            <svg viewBox="0 0 20 20" className={page.homeIcon} aria-hidden="true">
              <path fill="currentColor" d="M12.5 4 6 10l6.5 6 1.5-1.5L9 10l5-4.5z" />
            </svg>
            Home
          </Link>
        </div>

        <div className={rp.boardBody}>
          {/* Vault / Breakpoints */}
          <div className={rp.section}>
            <VaultCards data={data} />
          </div>

          {/* Full Mythic+ table (collapsible) */}
          <div className={rp.section}>
            <CollapsibleSection
              id="mplus-table"
              title="Full Mythic+ Table"
              subtitle={`Keystone rewards for ${data.seasonName}`}
              defaultOpen={false}
            >
              <DungeonLootTable data={data} embedded />
            </CollapsibleSection>
          </div>

          {/* Raid drops */}
          <div className={rp.section}>
            <RaidCards />
          </div>
        </div>
      </section>
    </main>
  );
}

export default RewardsPage;

// src/features/rewards/pages/RewardsPage.tsx
import { useRewardsData } from "../hooks/useRewardsData";
import { VaultCards } from "../components/VaultCards";
import { DungeonLootTable } from "../components/DungeonLootTable";
import { RaidCards } from "../components/RaidCards";
import { CollapsibleSection } from "../components/CollapsibleSection";
import { usePageMeta } from "../../../app/seo/usePageMeta";
import { Link } from "react-router-dom";
import page from "../../../styles/page.module.css";
import rp from "./rewardsPage.module.css";
import { GoogleAd } from "../../../components/ads/GoogleAd";
import { AD_SLOTS } from "../../../config/ads";

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
      {/* Header row: title on left, Home button on right */}
      <header className={`${page.headerRow} ${rp.headerDecor}`}>
        <div>
          <h1 className={page.title}>Rewards: Mythic+, Raid, Vault</h1>
          <p className={page.subtitle}>
            {data.seasonName} — End-of-dungeon, raid wings, and Great Vault item levels at a glance.
          </p>
        </div>

        <Link to="/" className={page.homeBtn} aria-label="Go to home">
          <svg viewBox="0 0 20 20" className={page.homeIcon} aria-hidden="true">
            <path fill="currentColor" d="M12.5 4 6 10l6.5 6 1.5-1.5L9 10l5-4.5z" />
          </svg>
          Home
        </Link>
      </header>

      {/* Breakpoints */}
      <section className={page.results} aria-labelledby="rewards-breakpoints">
        <div className={`featureCard ${rp.featureCardDecor}`} style={{ padding: 12 }}>
          <VaultCards data={data} />
        </div>
      </section>

      <div style={{ margin: "24px auto", width: "100%", maxWidth: 760 }}>
        <GoogleAd
          slot={AD_SLOTS.rewardsTop}
          style={{ minHeight: 120 }}
          placeholderLabel="Rewards top"
        />
      </div>

      {/* Full table (collapsed by default) */}
      <div className={page.results}>
        <div className={`featureCard ${rp.featureCardDecor}`} style={{ padding: 12 }}>
          <CollapsibleSection
            id="mplus-table"
            title="Full Mythic+ Table"
            subtitle={`Keystone rewards for ${data.seasonName}`}
            defaultOpen={false}
          >
            <DungeonLootTable data={data} embedded />
          </CollapsibleSection>
        </div>
      </div>

      {/* Raid cards */}
      <section className={page.results} aria-labelledby="rewards-raid-drops">
        <div className={`featureCard ${rp.featureCardDecor}`} style={{ padding: 12 }}>
          <RaidCards />
        </div>
      </section>

      <div style={{ margin: "24px auto", width: "100%", maxWidth: 760 }}>
        <GoogleAd
          slot={AD_SLOTS.rewardsMid}
          style={{ minHeight: 120 }}
          placeholderLabel="Rewards raid"
        />
      </div>
    </main>
  );
}

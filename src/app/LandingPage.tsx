import page from "../styles/page.module.css";
import { usePageMeta } from "../app/seo/usePageMeta";
import { Link } from "react-router-dom";

export function LandingPage() {
  usePageMeta({
    title: "Upgrade Planner",
    description: "Plan your WoW upgrades from a SimC export. See crest/FS costs and the fastest, most crest-efficient path to higher item level.",
    canonical: "/", // landing page canonical
    image: "/og/optimizer.png",
    ogType: "website",
  });

  return (
    <main id="main" className={`${page.wrap} ${page.wrapWide}`}>
      {/* Hero */}
      <header className={page.header}>
        <h1 className={page.title}>Make better gear choices, faster</h1>
        <p className={page.subtitle}>
          Drop in your SimC export. GearForge breaks down upgrades and crest costs,
          then orders the steps to reach higher item level faster with fewer crests.
        </p>
      </header>

      {/* Feature cards (2 per row) */}
      <section aria-label="Tools">
        <div className={page.featureGrid2}>
          {/* Active: Optimizer */}
          <Link to="/optimizer" className={`${page.navCard} ${page.navCardActive}`}>
            <div className={page.featureHead}>
              <span className={page.iconDot} aria-hidden />
              <h3 className={page.navTitle}>Optimizer</h3>
            </div>
            <p className={page.navText}>
              Paste SimC → get slot-by-slot upgrades suggestions for an optimized path to higher ilvl.
            </p>
            <span className={page.navCta}>Open →</span>
          </Link>

          {/* Link: Rewards */}
          <Link to="/rewards" className={page.navCard} aria-label="Dungeon, Raid & Vault ilvls — view tables">
            <div className={page.featureHead}>
              <span className={page.iconDot} aria-hidden />
              <h3 className={page.navTitle}>Dungeon, Raid &amp; Vault item levels</h3>
            </div>
            <p className={page.navText}>Quick tables for Mythic+, Raid and Great Vault reward item levels.</p>
            <span className={page.navCta}>View tables →</span>
          </Link>

          {/* Link: Guides */}
          <Link to="/guides" className={page.navCard} aria-label="Browse guides">
            <div className={page.featureHead}>
              <span className={page.iconDot} aria-hidden />
              <h3 className={page.navTitle}>Guides</h3>
            </div>
            <p className={page.navText}>Handy WoW guides, tips, and macros to make your play smoother.</p>
            <span className={page.navCta}>Browse →</span>
          </Link>

          {/* Under construction: Changelog */}
          <div className={`${page.navCard} ${page.navCardDisabled}`} aria-disabled="true" title="Under construction">
            <div className={page.featureHead}>
              <span className={page.iconDot} aria-hidden />
              <h3 className={page.navTitle}>
                Changelog <span className={page.ucBadge}>Under construction</span>
              </h3>
            </div>
            <p className={page.navText}>What’s new in GearForge—fixes, tweaks, and data updates.</p>
            <span className={page.navCta}>See updates →</span>
          </div>
        </div>
      </section>
    </main>
  );
}

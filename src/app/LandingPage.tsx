import page from "../styles/page.module.css";
import { usePageMeta } from "../app/seo/usePageMeta";
import { Link } from "react-router-dom";

export function LandingPage() {
  usePageMeta({
    title: "Upgrade Planner",
    description: "Plan your WoW upgrades from a SimC export. See crest/FS costs and free watermarks.",
    canonical: "/optimizer",
    image: "/og/optimizer.png",
    ogType: "website",
  });

  return (
    <main className={`${page.wrap} ${page.wrapWide}`}>
      {/* Hero */}
      <header className={page.header}>
        <h1 className={page.title}>Make better gear choices, faster</h1>
        <p className={page.subtitle}>
          Drop in your SimC export. GearForge breaks down upgrades, crest costs,
          and free bumps from watermarks—so you spend less time second-guessing.
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
              Paste SimC → get slot-by-slot upgrades with crest math and watermarks.
            </p>
            <span className={page.navCta}>Open →</span>
          </Link>

          {/* Under construction: Drops */}
          <div className={`${page.navCard} ${page.navCardDisabled}`} aria-disabled="true" title="Under construction">
            <div className={page.featureHead}>
              <span className={page.iconDot} aria-hidden />
              <h3 className={page.navTitle}>
                Dungeon & Vault ilvls <span className={page.ucBadge}>Under construction</span>
              </h3>
            </div>
            <p className={page.navText}>Quick tables for Vault and Keystone drop item levels.</p>
            <span className={page.navCta}>View tables</span>
          </div>

          {/* Under construction: Guides */}
          <div className={`${page.navCard} ${page.navCardDisabled}`} aria-disabled="true" title="Under construction">
            <div className={page.featureHead}>
              <span className={page.iconDot} aria-hidden />
              <h3 className={page.navTitle}>
                Guides <span className={page.ucBadge}>Under construction</span>
              </h3>
            </div>
            <p className={page.navText}>Short notes on crests & upgrade paths.</p>
            <span className={page.navCta}>Browse</span>
          </div>

          {/* Under construction: Changelog */}
          <div className={`${page.navCard} ${page.navCardDisabled}`} aria-disabled="true" title="Under construction">
            <div className={page.featureHead}>
              <span className={page.iconDot} aria-hidden />
              <h3 className={page.navTitle}>
                Changelog <span className={page.ucBadge}>Under construction</span>
              </h3>
            </div>
            <p className={page.navText}>What’s new in GearForge—fixes, tweaks, and data updates.</p>
            <span className={page.navCta}>See updates</span>
          </div>
        </div>
      </section>
    </main>
  );
}

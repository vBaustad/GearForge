import page from "../styles/page.module.css";
import lp from "./landingPage.module.css";
import { usePageMeta } from "../app/seo/usePageMeta";
import { Link } from "react-router-dom";
import { GoogleAd } from "../components/ads/GoogleAd";
import { AD_SLOTS } from "../config/ads";

export function LandingPage() {
  usePageMeta({
    title: "Upgrade Planner",
    description:
      "Plan your WoW upgrades from a SimC export. See crest/FS costs and the fastest, most crest-efficient path to higher item level.",
    canonical: "/", // landing page canonical
    image: "/og/optimizer.png",
    ogType: "website",
  });

  return (
    <main id="main" className={`${page.wrap} ${page.wrapWide}`}>
      {/* One continuous panel (intro merged in) */}
      <section aria-label="Tools" className={lp.board}>
        {/* Intro row */}
        <div className={lp.introRow}>
          <div className={lp.introCopy}>
            <h1 className={lp.introTitle}>Make better gear choices, faster</h1>
            <p className={lp.introSubtitle}>
              Drop in your SimC export. GearForge breaks down upgrades and crest costs, then orders the steps
              to reach higher item level faster with fewer crests.
            </p>
          </div>
        </div>

        {/* Body sections */}
        <div className={lp.boardBody}>
          {/* Feature cards (2 per row) */}
          <div className={lp.section}>
            <div className={page.featureGrid2}>
              {/* Optimizer */}
              <Link to="/optimizer" className={`${page.navCard} ${page.navCardActive} ${lp.navCardDecor}`}>
                <div className={page.featureHead}>
                  <span className={page.iconDot} aria-hidden />
                  <h3 className={page.navTitle}>Optimizer</h3>
                </div>
                <p className={page.navText}>
                  Paste SimC and get slot-by-slot upgrade suggestions for a faster path to higher ilvl.
                </p>
                <span className={page.navCta}>Open &rarr;</span>
              </Link>

              {/* Rewards */}
              <Link
                to="/rewards"
                className={`${page.navCard} ${lp.navCardDecor}`}
                aria-label="Dungeon, Raid & Vault ilvls - view tables"
              >
                <div className={page.featureHead}>
                  <span className={page.iconDot} aria-hidden />
                  <h3 className={page.navTitle}>Dungeon, Raid &amp; Vault item levels</h3>
                </div>
                <p className={page.navText}>Quick tables for Mythic+, Raid and Great Vault reward item levels.</p>
                <span className={page.navCta}>View tables &rarr;</span>
              </Link>

              {/* Guides */}
              <Link to="/guides" className={`${page.navCard} ${lp.navCardDecor}`} aria-label="Browse guides">
                <div className={page.featureHead}>
                  <span className={page.iconDot} aria-hidden />
                  <h3 className={page.navTitle}>Guides</h3>
                </div>
                <p className={page.navText}>Handy WoW guides, tips, and macros to make your play smoother.</p>
                <span className={page.navCta}>Browse &rarr;</span>
              </Link>

              {/* Changelog */}
              <Link to="/changelog" className={`${page.navCard} ${lp.navCardDecor}`} aria-label="Changelog">
                <div className={page.featureHead}>
                  <span className={page.iconDot} aria-hidden />
                  <h3 className={page.navTitle}>Changelog</h3>
                </div>
                <p className={page.navText}>What's new in GearForge - fixes, tweaks, and data updates.</p>
                <span className={page.navCta}>See updates &rarr;</span>
              </Link>
            </div>
          </div>

          {/* Ad row inside the board */}
          <div className={lp.sectionAd}>
            <div className={lp.adFrame}>
              <GoogleAd slot={AD_SLOTS.landingGrid} style={{ minHeight: 120 }} placeholderLabel="Landing grid" />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

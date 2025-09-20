// src/features/guides/pages/ClassSpecGuidesPage.tsx
import page from "../../../styles/page.module.css";
import { Link, useParams } from "react-router-dom";
import { SPECS, iconForSpec } from "../data/specs";
import { getGuideLinks } from "../data/guideLinks";
import { GuideLinkCard } from "../components/GuideLinkCard";
import comp from "../components/components.module.css";
import cs from "./classSpec.module.css";

export default function ClassSpecGuidesPage() {
  const params = useParams<{ class: string; spec: string }>();
  const clazz = params.class!;
  const spec = params.spec!;

  // Assume these always exist
  const specEntry = SPECS.find((s) => s.classSlug === clazz && s.specSlug === spec)!;
  const links = getGuideLinks(specEntry.classSlug, specEntry.specSlug);

  return (
    <main className={`${page.wrap} ${page.wrapWide}`}>
      <section aria-label="Class/Spec Guides" className={cs.board}>
        {/* Intro (merged into board) */}
        <div className={cs.introRow}>
          <div className={cs.introCopy}>
            <div className={cs.titleRow}>
              <img
                src={iconForSpec(specEntry.classSlug, specEntry.specSlug)}
                alt=""
                width={36}
                height={36}
                className={cs.specBadge}
              />
              <h1 className={cs.introTitle}>
                {specEntry.className} – {specEntry.specName}
              </h1>
            </div>
            <p className={cs.introSubtitle}>Curated links and notes for {specEntry.specName}.</p>
          </div>

          <Link to="/guides" className={`${page.homeBtn} ${cs.introHome}`} aria-label="Back to guides">
            <svg viewBox="0 0 20 20" className={page.homeIcon} aria-hidden="true">
              <path fill="currentColor" d="M12.5 4 6 10l6.5 6 1.5-1.5L9 10l5-4.5z" />
            </svg>
            Guides
          </Link>
        </div>

        {/* Body */}
        <div className={cs.boardBody}>
          {/* External guide sites */}
          <div className={cs.section}>
            <div className={cs.innerCard}>
              <div className={`navText ${cs.headLabel}`}>Top Community Guides</div>
              <div className={comp.cardsGrid}>
                {links.map((gl) => (
                  <GuideLinkCard key={`${gl.site}-${gl.url}`} link={gl} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

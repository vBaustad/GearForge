import page from "../../../styles/page.module.css";
import { Link, useParams } from "react-router-dom";
import { SPECS, iconForSpec } from "../data/specs";
import { GuideGrid } from "../components/GuideGrid";
import { getGuideLinks } from "../data/guideLinks";
import { GuideLinkCard } from "../components/GuideLinkCard";
import comp from "../components/components.module.css";
import cs from "./classSpec.module.css";

export default function ClassSpecGuidesPage() {
  const params = useParams<{ class: string; spec: string }>();
  const clazz = params.class;
  const spec = params.spec;
  const specEntry = SPECS.find(s => s.classSlug === clazz && s.specSlug === spec) || null;

  return (
    <main className={`${page.wrap} ${page.wrapWide}`}>
      <header className={`${page.headerRow} ${cs.headerDecor}`}>
        <div>
          {specEntry ? (
            <div className={cs.titleRow}>
              <img
                src={iconForSpec(specEntry.classSlug, specEntry.specSlug)}
                alt=""
                width={36}
                height={36}
                className={cs.specBadge}
              />
              <h1 className={page.title}>
                {specEntry.className} - {specEntry.specName}
              </h1>
            </div>
          ) : (
            <h1 className={page.title}>Guides</h1>
          )}
          <p className={page.subtitle}>
            {specEntry ? `Curated links and notes for ${specEntry.specName}.` : `Spec not found.`}
          </p>
        </div>
        <Link to="/guides" className={page.homeBtn} aria-label="Back to guides">
          <svg viewBox="0 0 20 20" className={page.homeIcon} aria-hidden="true">
            <path fill="currentColor" d="M12.5 4 6 10l6.5 6 1.5-1.5L9 10l5-4.5z" />
          </svg>
          Guides
        </Link>
      </header>

      {specEntry ? (
        <section className={page.results}>
          {/* External guide sites */}
          <div className={`featureCard ${cs.featureCardDecor}`} style={{ padding: 12, marginBottom: 12 }}>
            <div className={`navText ${cs.headLabel}`}>Top Community Guides</div>
            <div className={comp.cardsGrid}>
              {getGuideLinks(specEntry.classSlug, specEntry.specSlug).map((gl) => (
                <GuideLinkCard key={`${gl.site}-${gl.url}`} link={gl} />
              ))}
            </div>
          </div>
          <GuideGrid classSlug={specEntry.classSlug} specSlug={specEntry.specSlug} showEmptyMessage />
        </section>
      ) : (
        <section className={page.featuresGridSingle}>
          <article className="featureCard">
            <p className="navText">We couldn't find that spec. Go back and pick another.</p>
          </article>
        </section>
      )}
    </main>
  );
}

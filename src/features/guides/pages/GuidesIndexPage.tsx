import page from "../../../styles/page.module.css";
import { Link } from "react-router-dom";
import { GuideGrid } from "../components/GuideGrid";
import { useEffect, useState } from "react";
import { SpecIconRow } from "../components/SpecIconRow";
import { ClassIconRow } from "../components/ClassIconRow";
import s from "../components/components.module.css";
import gi from "./guidesIndex.module.css";

export default function GuidesIndexPage() {
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  // Keep the last selected class while the section animates closed to avoid flash-of-all-specs
  const [visibleClass, setVisibleClass] = useState<string | null>(null);
  useEffect(() => {
    if (selectedClass) setVisibleClass(selectedClass);
  }, [selectedClass]);
  return (
    <main className={`${page.wrap} ${page.wrapWide}`}>
      <header className={`${page.headerRow} ${gi.headerDecor}`}>
        <div>
          <h1 className={page.title}>Guides</h1>
          <p className={page.subtitle}>
            Small but useful WoW tips, QoL tricks, and time-saving scripts — plus quick links to trusted class guides on Wowhead, Icy Veins, and more.
          </p>
        </div>
        <Link to="/" className={page.homeBtn} aria-label="Go to home">
          <svg viewBox="0 0 20 20" className={page.homeIcon} aria-hidden="true">
            <path fill="currentColor" d="M12.5 4 6 10l6.5 6 1.5-1.5L9 10l5-4.5z" />
          </svg>
          Home
        </Link>
      </header>

      <section className={page.results}>
        <div className={`featureCard ${gi.featureCardDecor}`}>
          <div className={`navText ${gi.leadLabel}`}>Select your Class</div>
          <ClassIconRow selected={selectedClass} onSelect={setSelectedClass} />
          <div className={[s.specSection, selectedClass ? s.specSectionShow : ""].join(" ")} aria-hidden={!selectedClass}>
            {/* <div className={s.specHeader}>Select your Specialization</div> */}
            <div className={s.specPanel}>
              <SpecIconRow classFilter={visibleClass} />
            </div>
          </div>
        </div>
        <div className={`featureCard ${gi.featureCardDecor}`} style={{ padding: 12, marginTop: 12 }}>
          <GuideGrid />
        </div>
      </section>
    </main>
  );
}

// src/features/guides/pages/GuidesIndexPage.tsx
import page from "../../../styles/page.module.css";
import { Link } from "react-router-dom";
import { GuideGrid } from "../components/GuideGrid";
import { useEffect, useState } from "react";
import { SpecIconRow } from "../components/SpecIconRow";
import { ClassIconRow } from "../components/ClassIconRow";
import s from "../components/components.module.css";
import gi from "./guidesIndex.module.css";
import { usePageMeta } from "../../../app/seo/usePageMeta";

export default function GuidesIndexPage() {
  usePageMeta({
    title: "Guides",
    description:
      "Small but useful WoW tips, QoL tricks, and time-saving scripts — plus quick links to trusted class guides.",
    canonical: "/guides",
    image: "/og/guides.png",
    ogType: "website",
  });


  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [visibleClass, setVisibleClass] = useState<string | null>(null);
  useEffect(() => {
    if (selectedClass) setVisibleClass(selectedClass);
  }, [selectedClass]);

  return (
    <main className={`${page.wrap} ${page.wrapWide}`}>
      <section aria-label="Guides" className={gi.board}>
        <div className={gi.introRow}>
          <div className={gi.introCopy}>
            <h1 className={gi.introTitle}>Guides</h1>
            <p className={gi.introSubtitle}>
              Small but useful WoW tips, QoL tricks, and time-saving scripts — plus quick links to trusted
              class guides on Wowhead, Icy Veins, and more.
            </p>
          </div>
          <Link to="/" className={`${page.homeBtn} ${gi.introHome}`} aria-label="Go to home">
            <svg viewBox="0 0 20 20" className={page.homeIcon} aria-hidden="true">
              <path fill="currentColor" d="M12.5 4 6 10l6.5 6 1.5-1.5L9 10l5-4.5z" />
            </svg>
            Home
          </Link>
        </div>

        <div className={gi.boardBody}>
          {/* Selector card */}
          <div className={gi.section}>
            <div className={gi.innerCard}>
              <div className={`navText ${gi.leadLabel}`}>Select your Class</div>
              <ClassIconRow selected={selectedClass} onSelect={setSelectedClass} />
              <div
                className={[s.specSection, selectedClass ? s.specSectionShow : ""].join(" ")}
                aria-hidden={!selectedClass}
              >
                <div className={s.specPanel}>
                  <SpecIconRow classFilter={visibleClass} />
                </div>
              </div>
            </div>
          </div>

          {/* Guides grid card */}
          <div className={gi.section}>
            <div className={gi.innerCard}>
              <GuideGrid />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

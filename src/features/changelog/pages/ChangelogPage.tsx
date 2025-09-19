import { Link, useLocation } from "react-router-dom";
import { usePageMeta } from "../../../app/seo/usePageMeta";
import page from "../../../styles/page.module.css";
import style from "./changelog.module.css";
import { ChangelogPost } from "../components/ChangelogPost";
import { useEffect, useMemo } from "react";
import { POSTS } from "../data/posts";

export function ChangelogPage() {
  usePageMeta({
    title: "Changelog",
    description: "What's new in GearForge - fixes, tweaks, and data updates.",
    canonical: "/changelog",
    image: "/og/changelog.png",
    ogType: "website",
  });

  const { hash } = useLocation();
  useEffect(() => {
    if (!hash) return;
    const el = document.querySelector(hash);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [hash]);

  const posts = useMemo(() => [...POSTS].sort((a, b) => b.date.localeCompare(a.date)), []);

  return (
    <main id="main" className={`${page.wrap} ${page.wrapWide}`}>
      <section aria-label="Changelog" className={style.board}>
        {/* merged header + board */}
        <div className={style.introRow}>
          <div className={style.introCopy}>
            <h1 className={style.introTitle}>Changelog</h1>
            <p className={style.introSubtitle}>
              Bite-sized updates as we ship fixes, tweaks, and data refreshes.
            </p>
          </div>

          <Link to="/" className={`${page.homeBtn} ${style.introHome}`} aria-label="Go to home">
            <svg viewBox="0 0 20 20" className={page.homeIcon} aria-hidden="true">
              <path fill="currentColor" d="M12.5 4 6 10l6.5 6 1.5-1.5L9 10l5-4.5z" />
            </svg>
            Home
          </Link>
        </div>

        <div className={style.boardBody}>
          {posts.map((p) => (
            <ChangelogPost key={p.id} post={p} />
          ))}
        </div>
      </section>
    </main>
  );
}

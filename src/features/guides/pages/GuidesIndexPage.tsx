import page from "../../../styles/page.module.css";
import { Link } from "react-router-dom";
import { GuideGrid } from "../components/GuideGrid";

export default function GuidesIndexPage() {
  return (
    <main className={`${page.wrap} ${page.wrapWide}`}>
      <header className={page.headerRow}>
        <div>
          <h1 className={page.title}>Guides</h1>
          <p className={page.subtitle}>Short tips, snippets, quests, and deep dives.</p>
        </div>
        <Link to="/" className={page.homeBtn} aria-label="Go to home">
          <svg viewBox="0 0 20 20" className={page.homeIcon} aria-hidden="true">
            <path fill="currentColor" d="M12.5 4 6 10l6.5 6 1.5-1.5L9 10l5-4.5z" />
          </svg>
          Home
        </Link>
      </header>

      <section className={page.results}>
        <GuideGrid />
      </section>
    </main>
  );
}

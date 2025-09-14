import page from "../../../styles/page.module.css"
import { GuideGrid } from "../components/GuideGrid";

export default function GuidesPage() {
  return (
    <main className={`${page.wrap} ${page.wrapWide}`}>
      <header className={page.header}>
        <h1 className={page.title}>Guides</h1>
        <p className={page.subtitle}>Short tips, snippets, quests, and deep dives.</p>
      </header>

      <section className={page.results}>
        <GuideGrid />
      </section>
    </main>
  );
}
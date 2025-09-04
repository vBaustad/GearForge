// src/pages/LandingPage.tsx
import page from "../styles/page.module.css";
import c from "../components/components.module.css";
import { usePageMeta } from "../app/seo/usePageMeta";
import { useNavigate } from "react-router-dom";

export function LandingPage() {
  usePageMeta({
    title: "GearForge — Smarter WoW gear decisions",
    description:
      "Paste your SimC and get clear, prioritized upgrade plans with crest costs, caps, and drop ceilings.",
    ogTitle: "GearForge",
    ogDescription: "Forge the perfect setup.",
    ogImage: "/images/og/gearforge-wide-dark.png",
    canonical: typeof window !== "undefined" ? window.location.href : "https://gearforge.app",
  });

  const navigate = useNavigate();

  return (
    <main className={page.wrap} style={{ maxWidth: 1120 }}>
      {/* Hero */}
      <section style={{ textAlign: "center", padding: "32px 0 24px" }}>
        <h1 className={page.title} style={{ fontSize: "clamp(32px,5vw,48px)" }}>
          Make better gear choices, faster
        </h1>
        <p className={page.subtitle} style={{ maxWidth: 720, margin: "8px auto 0" }}>
          Drop in your SimC export. GearForge breaks down upgrades, crest costs,
          and free bumps from watermarks—so you spend less time second-guessing.
        </p>

        <div style={{ marginTop: 20, display: "flex", gap: 12, justifyContent: "center" }}>
          <button className={c.mobileBtn} onClick={() => navigate("/optimizer")}
            style={{ padding: "10px 16px", borderRadius: 10, background: "#f6b300", color: "#111", fontWeight: 700 }}>
            Open Optimizer →
          </button>
          {/* Optional demo link */}
          {/* <button className={c.mobileBtn} onClick={() => navigate("/optimizer/view#d=...")}>See Example</button> */}
        </div>
      </section>

      {/* Value props */}
      <section className={page.featuresGridSingle} style={{ marginTop: 24 }}>
        <article className={page.featureCard}>
          <h3 className={page.cardTitle}>Clear recommendations</h3>
          <p className={page.cardSub}>Slot-by-slot suggestions with reasons and crest math.</p>
        </article>
        <article className={page.featureCard}>
          <h3 className={page.cardTitle}>Crest awareness</h3>
          <p className={page.cardSub}>Shows caps, wallet, and free upgrades from watermarks.</p>
        </article>
        <article className={page.featureCard}>
          <h3 className={page.cardTitle}>Shareable results</h3>
          <p className={page.cardSub}>Copy a link; your teammate sees the same plan.</p>
        </article>
      </section>

      {/* How it works */}
      <section style={{ marginTop: 28 }}>
        <h2 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 800 }}>How it works</h2>
        <ol style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7, opacity: 0.9 }}>
          <li>Export from the SimulationCraft addon.</li>
          <li>Paste into GearForge and hit Analyze.</li>
          <li>Review upgrades, crest costs, and free bumps.</li>
        </ol>
      </section>

      {/* FAQ (reuse footer FAQ style if you like) */}
      <section style={{ marginTop: 32 }}>
        <h2 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 800 }}>FAQ</h2>
        <div className={c.faqList}>
          <details className={c.faqItem}>
            <summary className={c.faqSummary}>
              Does GearForge need my Blizzard login?
              <svg className={c.faqChevron} viewBox="0 0 24 24"><path fill="currentColor" d="M7 10l5 5 5-5"/></svg>
            </summary>
            <div className={c.faqBody}>No. You paste your SimC export—nothing else required.</div>
          </details>
          <details className={c.faqItem}>
            <summary className={c.faqSummary}>
              Are crest caps up to date?
              <svg className={c.faqChevron} viewBox="0 0 24 24"><path fill="currentColor" d="M7 10l5 5 5-5"/></svg>
            </summary>
            <div className={c.faqBody}>Yes. We track current weekly caps and watermarks.</div>
          </details>
        </div>
      </section>

      {/* CTA repeat */}
      <section style={{ textAlign: "center", margin: "32px 0 8px" }}>
        <button className={c.mobileBtn} onClick={() => navigate("/optimizer")}
          style={{ padding: "12px 18px", borderRadius: 10, background: "#f6b300", color: "#111", fontWeight: 800 }}>
          Start Optimizing →
        </button>
      </section>
    </main>
  );
}

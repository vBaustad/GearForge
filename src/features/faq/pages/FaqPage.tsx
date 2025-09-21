// src/features/faq/pages/FaqPage.tsx
import { Link } from "react-router-dom";
import page from "../../../styles/page.module.css";
import cs from "./faq.module.css";
import { usePageMeta } from "../../../app/seo/usePageMeta";

const faqs = [
  { q: "What is GearForge?", a: "A WoW gearing assistant for upgrades, crest/FS costs, and seasonal tracking." },
  { q: "Do I need to log in?", a: "No—paste your SimC export and analyze locally in your browser." },
  { q: "Is my data stored?", a: "No. Parsing and calculations run client-side. We don’t save your SimC text or results." },
  { q: "Which seasons are supported?", a: "The current season is fully supported. Older seasons are treated as legacy and filtered from suggestions." },
  { q: "How do crest discounts work?", a: "We detect relevant achievements and automatically apply valid -5 crest discounts to the plan where applicable." },
  { q: "What are watermarks/free upgrades?", a: "If you’ve previously looted a higher ilvl in a slot, we treat upgrades up to that ilvl as free and plan from there." },
  { q: "Do crafted items show upgrade paths?", a: "Crafted gear won’t use crests for upgrades. We mark those as crafted/no-crest and focus crest planning on eligible items." },
  { q: "Why don’t I see recommendations for some items?", a: "Items from past seasons or excluded sources are filtered to keep plans relevant to the current season." },
  { q: "Where do I get the SimC export?", a: "Use the SimulationCraft addon or Raidbots to copy your character’s SimC string and paste it into the Optimizer." },
  { q: "Does GearForge change my character?", a: "No. It’s read-only guidance. You decide what to upgrade or craft in-game." },
  { q: "Mobile support?", a: "Yes—works on mobile, but desktop gives more comfortable reading space for plans and tables." },
  { q: "Why do some costs differ from in-game?", a: "Weekly resets, hotfixes, or edge cases can shift costs. We’ll track changes in the Changelog and update quickly." },
  { q: "How do I report a bug or wrong suggestion?", a: "Open an issue on GitHub or ping me via the contact link. Include your SimC (trim sensitive bits) and a short repro." },
  { q: "Can I request features?", a: "Absolutely. Send requests—common asks get prioritized. Check the Changelog for what’s shipped." },
  { q: "Is it free?", a: "Yes. If it helps you, consider sharing the site or leaving feedback to improve it." },
  { q: "Who made GearForge?", a: "An independent developer and WoW player (hi!). This is a community tool; not affiliated with Blizzard." },
  { q: "Legal/affiliation note", a: "All game content and trademarks are property of their respective owners. GearForge is an unofficial fan project." },
];


export default function FaqPage() {
  usePageMeta({
    title: "FAQ",
    description: "Frequently asked questions about GearForge.",
    canonical: "/faq",
    noindex: true,
  });

  return (
    <main className={`${page.wrap} ${page.wrapWide}`}>
      <section aria-label="Frequently Asked Questions" className={cs.board}>
        {/* Header row */}
        <div className={cs.introRow}>
          <div className={cs.introCopy}>
            <h1 className={cs.introTitle}>FAQ</h1>
            <p className={cs.introSubtitle}>
              Quick answers to common questions about how GearForge works.
            </p>
          </div>

          <Link to="/" className={`${page.homeBtn} ${cs.introHome}`} aria-label="Back to home">
            <svg viewBox="0 0 20 20" className={page.homeIcon} aria-hidden="true">
              <path fill="currentColor" d="M12.5 4 6 10l6.5 6 1.5-1.5L9 10l5-4.5z" />
            </svg>
            Home
          </Link>
        </div>

        {/* Content */}
        <div className={cs.boardBody}>
          <div className={cs.section}>
            <div className={cs.innerCard}>
              <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                {faqs.map((f, i) => {
                  const id = `faq-${i}`;
                  return (
                    <li key={id} style={{ borderTop: i ? "1px solid #2a2c31" : "none", padding: i ? "12px 0 0" : 0 }}>
                      <details>
                        <summary
                          style={{
                            cursor: "pointer",
                            fontWeight: 700,
                            color: "var(--ink)",
                            lineHeight: 1.35,
                            marginBottom: 6,
                          }}
                          aria-controls={`${id}-panel`}
                          aria-expanded={undefined}
                        >
                          {f.q}
                        </summary>
                        <div id={`${id}-panel`} style={{ color: "var(--ink-dim)" }}>
                          {f.a}
                        </div>
                      </details>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          {/* Optional ad spacer row (kept for parity; your RootLayout will hide ads on /faq anyway) */}
          {/* <div className={cs.sectionAd}><div className={cs.adFrame}></div></div> */}
        </div>
      </section>
    </main>
  );
}

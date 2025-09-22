import { useEffect, useState } from "react";
import page from "../../../styles/page.module.css";
import op from "./optimizerPage.module.css";
import { usePageMeta } from "../../../app/seo/usePageMeta";
import { useNavigate, Link } from "react-router-dom";
import { encodeToUrlHash } from "../services/urlCodec";
import { GoogleAd } from "../../../components/ads/GoogleAd";
import { AD_SLOTS } from "../../../config/ads";

export function OptimizerPage() {
  usePageMeta({
    title: "Upgrade Planner",
    description:
      "Plan your WoW upgrades from a SimC export. See crest costs and the fastest, most crest-efficient path to higher item level.",
    canonical: "/optimizer",
    image: "/og/optimizer.png",
    ogType: "website",
  });

  const [rawInput, setRawInput] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  async function handleAnalyze(e: React.FormEvent) {
    e.preventDefault();
    setIsParsing(true);
    setError(null);
    try {
      const simc = rawInput.trim();
      if (!simc) throw new Error("Paste your SimC first.");
      const fragment = encodeToUrlHash({ simc });
      navigate(`/optimizer/view${fragment}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not parse input.");
    } finally {
      setIsParsing(false);
    }
  }

  useEffect(() => {
    (document.getElementById("optimizer-input") as HTMLTextAreaElement | null)?.focus();
  }, []);

  return (
    <main id="main" className={`${page.wrap} ${page.wrapWide}`}>
      <section aria-label="Upgrade Planner" className={op.board}>
        <div className={op.introRow}>
          <div className={op.introCopy}>
            <h1 className={op.introTitle}>Optimize your gear in seconds</h1>
            <p className={op.introSubtitle}>
              Paste your SimC (or export) and get clear, prioritized upgrade recommendations.
            </p>
          </div>

          <Link to="/" className={`${page.homeBtn} ${op.introHome}`} aria-label="Go to home">
            <svg viewBox="0 0 20 20" className={page.homeIcon} aria-hidden="true">
              <path fill="currentColor" d="M12.5 4 6 10l6.5 6 1.5-1.5L9 10l5-4.5z" />
            </svg>
            Home
          </Link>
        </div>

        <div className={op.boardBody}>
          {/* Form section inside an inner card */}
          <div className={op.section}>
            <div className={op.innerCard}>
              <div className={page.cardHeader}>
                <div className={page.iconDot} aria-hidden />
                <h3 className={page.cardTitle}>Optimizer</h3>
                <p className={page.cardSub}>Find the best upgrades for your character</p>
              </div>

              <form onSubmit={handleAnalyze} className={page.inputForm} aria-label="Optimization form">
                <label htmlFor="optimizer-input" className={page.label}>
                  Paste your SimC / export string
                </label>
                <textarea
                  id="optimizer-input"
                  className={page.textarea}
                  placeholder="Paste here…"
                  value={rawInput}
                  onChange={(e) => setRawInput(e.target.value)}
                  rows={8}
                  spellCheck={false}
                />
                <div className={page.formRow}>
                  <button className={page.primaryBtn} disabled={isParsing}>
                    {isParsing ? "Analyzing…" : "Analyze"}
                  </button>
                  <button
                    type="button"
                    className={page.ghostBtn}
                    onClick={() => { setRawInput(""); setError(null); }}
                  >
                    Clear
                  </button>
                </div>
                {error && <p className={page.error}>{error}</p>}
              </form>
            </div>
          </div>

          {/* Ad section inside panel */}
          {/* <div className={op.sectionAd}>
            <div className={op.adFrame}>
              <GoogleAd
                slot={AD_SLOTS.optimizerForm}
                style={{ minHeight: 250 }}
                placeholderLabel="Optimizer form"
              />
            </div>
          </div> */}
        </div>
      </section>
    </main>
  );
}
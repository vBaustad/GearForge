import { useEffect, useState } from "react";
import page from "../../../styles/page.module.css";
import { usePageMeta } from "../../../app/seo/usePageMeta";
import { useNavigate } from "react-router-dom";
import { encodeToUrlHash } from "../services/urlCodec";

export function OptimizerPage() {
  usePageMeta({
    title: "GearForge — Optimize Your Gear",
    description: "Paste your SimC (or export) to analyze upgrades, compare slots, and get fast, clear recommendations.",
    ogTitle: "GearForge",
    ogDescription: "Forge the perfect setup.",
    ogImage: "/images/og/gearforge-wide-dark.png",
    canonical: typeof window !== "undefined" ? window.location.href : "https://gearforge.app",
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

      // ✅ encodeToUrlHash already returns "#d=..."
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
    <main className={page.wrap}>
      <header className={page.header}>
        <h1 className={page.title}>Optimize your gear in seconds</h1>
        <p className={page.subtitle}>
          Paste your SimC (or export) and get clear, prioritized upgrade recommendations.
        </p>
      </header>

      <section className={page.featuresGridSingle}>
        <article className={page.featureCard}>
          <div className={page.cardHeader}>
            <div className={page.iconDot} aria-hidden />
            <h3 className={page.cardTitle}>OPTIMIZER</h3>
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
                onClick={() => {
                  setRawInput("");
                  setError(null);
                }}
              >
                Clear
              </button>
            </div>
            {error && <p className={page.error}>{error}</p>}
          </form>
        </article>
      </section>
    </main>
  );
}

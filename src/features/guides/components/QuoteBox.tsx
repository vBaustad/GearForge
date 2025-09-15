import { useEffect, useState } from "react";
import page from "../../../styles/page.module.css";

export function QuoteBox({
  source = "blizzard",
  originalUrl,
  html,
  text,
}: {
  source?: "blizzard" | "user" | "other";
  originalUrl?: string;
  html?: string;
  text?: string;
}) {
  const [open, setOpen] = useState(true);
  const [remoteHtml, setRemoteHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!html && !text && originalUrl) {
      setLoading(true);
      fetch(`/api/forum/extract?url=${encodeURIComponent(originalUrl)}`)
        .then(r => r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))
        .then((d: { title?: string; author?: string; createdAt?: string; html?: string }) => setRemoteHtml(d && d.html ? d.html : null))
        .catch(() => setRemoteHtml(null))
        .finally(() => setLoading(false));
    }
  }, [originalUrl, html, text]);

  return (
    <div className={`${page.quoteBox} ${source ? page[`quote_${source}` as const] : ""}`}>
      <div className={page.quoteHead}>
        <div className={page.quoteLeft}>
          {source === "blizzard" ? (
            <div className={page.quoteBrandRow} aria-hidden>
              <img src="/images/logos/world-of-warcraft-logo.png" alt="World of Warcraft" className={page.quoteBrandIcon} />
              <img src="/images/logos/blizzard-entertainment-logo.png" alt="Blizzard Entertainment" className={page.quoteBrandLogo} />
            </div>
          ) : null}
        </div>
        <div className={page.quoteActions}>
          {originalUrl ? (
            <a href={originalUrl} target="_blank" rel="noreferrer" className={page.quoteLink}>View Original</a>
          ) : null}
          <button type="button" aria-label="Toggle quote visibility" className={page.quoteToggle} onClick={() => setOpen(v => !v)}>
            {open ? "Hide" : "Show"}
          </button>
        </div>
      </div>
      {open ? (
        <div className={page.quoteBody}>
          {loading ? (
            <div className="navText">Loading…</div>
          ) : html ? (
            <div dangerouslySetInnerHTML={{ __html: html }} />
          ) : remoteHtml ? (
            <div dangerouslySetInnerHTML={{ __html: remoteHtml }} />
          ) : text ? (
            text.split(/\n\n+/).map((para, i) => (
              <p key={i} className="navText" style={{ margin: i === 0 ? 0 : 8 }}>{para}</p>
            ))
          ) : null}
        </div>
      ) : null}
    </div>
  );
}




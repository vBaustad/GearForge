import type { PropsWithChildren } from "react";
import { Link } from "react-router-dom";
import page from "../../../styles/page.module.css";
import cs from "./legal.module.css";
import { usePageMeta } from "../../../app/seo/usePageMeta";

type SimpleDocProps = PropsWithChildren<{
  title: string;
  description: string;
  canonical: string;
  noindex?: boolean;
  subtitle?: string;
}>;

export function SimpleDocPage({
  title,
  description,
  canonical,
  noindex = true,
  subtitle,
  children,
}: SimpleDocProps) {
  usePageMeta({ title, description, canonical, noindex });

  return (
    <main className={`${page.wrap} ${page.wrapWide}`}>
      <section aria-label={title} className={cs.board}>
        {/* Header row */}
        <div className={cs.introRow}>
          <div className={cs.introCopy}>
            <h1 className={cs.introTitle}>{title}</h1>
            <p className={cs.introSubtitle}>
              {subtitle ?? description}
            </p>
          </div>

          <Link to="/" className={`${page.homeBtn} ${cs.introHome}`} aria-label="Back to home">
            <svg viewBox="0 0 20 20" className={page.homeIcon} aria-hidden="true">
              <path fill="currentColor" d="M12.5 4 6 10l6.5 6 1.5-1.5L9 10l5-4.5z" />
            </svg>
            Home
          </Link>
        </div>

        {/* Body */}
        <div className={cs.boardBody}>
          <div className={cs.section}>
            <div className={`${cs.innerCard} ${cs.prose}`}>
              {children}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

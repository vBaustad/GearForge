import { useId, useState } from "react";
import c from "./components.module.css";

export function CollapsibleSection({
  title,
  subtitle,
  defaultOpen = false,
  children,
  id,
}: {
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  id?: string;
}) {
  const autoId = useId();
  const headingId = id ?? `collapsible-${autoId}`;
  const panelId = `${headingId}-panel`;
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section aria-labelledby={headingId} className={c.sectionPanel}>
      <button
        type="button"
        className={c.sectionHeaderBtn}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(v => !v)}
      >
        <div className={c.sectionTitleWrap}>
          <h2 id={headingId} className={c.sectionTitle}>{title}</h2>
          {subtitle && <p className={c.sectionSubtitle}>{subtitle}</p>}
        </div>

        <span className={c.sectionToggle}>
          {open ? "Collapse" : "Expand"}
          <svg viewBox="0 0 20 20" className={c.caret} aria-hidden="true">
            <path fill="currentColor" d="M10 12.5 3.5 6h13L10 12.5z" />
          </svg>
        </span>
      </button>

      <div id={panelId} hidden={!open} role="region" aria-labelledby={headingId} className={c.sectionBody}>
        {children}
      </div>
    </section>
  );
}

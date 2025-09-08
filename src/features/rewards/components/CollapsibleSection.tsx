// src/components/CollapsibleSection.tsx
import { useId, useState } from "react";

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
    <section aria-labelledby={headingId} className="rounded-2xl border border-gray-800 overflow-hidden">
      {/* Entire header is clickable */}
      <button
        type="button"
        className="w-full flex items-center justify-between bg-black/60 px-4 py-3 text-left hover:bg-black/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/40"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(v => !v)}
      >
        <div className="min-w-0">
          <h2 id={headingId} className="text-lg font-semibold text-white truncate">{title}</h2>
          {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
        </div>

        <span className="inline-flex items-center gap-2 rounded-md border border-gray-700 bg-black/40 px-3 py-1.5 text-xs text-gray-100">
          {open ? "Collapse" : "Expand"}
          <svg viewBox="0 0 20 20" className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}>
            <path fill="currentColor" d="M10 12.5 3.5 6h13L10 12.5z" />
          </svg>
        </span>
      </button>

      <div id={panelId} hidden={!open} role="region" aria-labelledby={headingId}>
        {children}
      </div>
    </section>
  );
}

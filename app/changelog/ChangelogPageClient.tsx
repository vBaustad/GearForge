"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Sparkles, Zap, Bug, Megaphone } from "lucide-react";

const TYPE_CONFIG = {
  feature: { icon: Sparkles, color: "#22c55e", label: "New Feature" },
  improvement: { icon: Zap, color: "#60a5fa", label: "Improvement" },
  fix: { icon: Bug, color: "#f59e0b", label: "Bug Fix" },
  announcement: { icon: Megaphone, color: "#a855f7", label: "Announcement" },
};

export function ChangelogPageClient() {
  const groupedEntries = useQuery(api.changelog.listGroupedByVersion);

  return (
    <div className="container page-section">
      <Breadcrumbs items={[{ label: "Changelog" }]} />

      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <h1 style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", marginBottom: "0.5rem" }}>
          Changelog
        </h1>
        <p className="text-secondary" style={{ marginBottom: "var(--space-2xl)" }}>
          Stay up to date with the latest GearForge updates and improvements.
        </p>

        {!groupedEntries ? (
          <div style={{ minHeight: "300px" }} />
        ) : groupedEntries.length === 0 ? (
          <div className="card" style={{ padding: "var(--space-xl)", textAlign: "center" }}>
            <p className="text-muted">No changelog entries yet.</p>
          </div>
        ) : (
          <div className="changelog-list">
            {groupedEntries.map((group) => (
              <div key={group.version} className="changelog-version">
                <div className="version-header">
                  <span className="version-badge">v{group.version}</span>
                  <span className="version-date">
                    {new Date(group.publishedAt).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>

                <div className="version-entries">
                  {group.entries.map((entry) => {
                    const config = TYPE_CONFIG[entry.type as keyof typeof TYPE_CONFIG];
                    const Icon = config.icon;
                    return (
                      <div key={entry._id} className="changelog-entry">
                        <div className="entry-type" style={{ color: config.color }}>
                          <Icon size={16} />
                          <span>{config.label}</span>
                        </div>
                        <h3 className="entry-title">{entry.title}</h3>
                        <div
                          className="entry-content"
                          dangerouslySetInnerHTML={{ __html: formatMarkdown(entry.content) }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .changelog-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-2xl);
        }

        .changelog-version {
          position: relative;
          padding-left: var(--space-xl);
          border-left: 2px solid var(--border);
        }

        .version-header {
          display: flex;
          align-items: center;
          gap: var(--space-md);
          margin-bottom: var(--space-lg);
          position: relative;
        }

        .version-header::before {
          content: "";
          position: absolute;
          left: calc(var(--space-xl) * -1 - 6px);
          width: 12px;
          height: 12px;
          background: var(--accent);
          border-radius: 50%;
          border: 2px solid var(--bg-deep);
        }

        .version-badge {
          font-family: var(--font-mono, monospace);
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--accent);
        }

        .version-date {
          font-size: 0.875rem;
          color: var(--text-muted);
        }

        .version-entries {
          display: flex;
          flex-direction: column;
          gap: var(--space-lg);
        }

        .changelog-entry {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: var(--space-lg);
        }

        .entry-type {
          display: inline-flex;
          align-items: center;
          gap: var(--space-xs);
          font-size: 0.75rem;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: var(--space-sm);
        }

        .entry-title {
          font-size: 1rem;
          font-weight: 600;
          margin: 0 0 var(--space-sm);
        }

        .entry-content {
          font-size: 0.875rem;
          color: var(--text-secondary);
          line-height: 1.6;
        }

        .entry-content :global(p) {
          margin: 0 0 var(--space-sm);
        }

        .entry-content :global(ul) {
          margin: 0;
          padding-left: var(--space-lg);
        }

        .entry-content :global(li) {
          margin-bottom: var(--space-xs);
        }

        .entry-content :global(code) {
          background: var(--bg-deep);
          padding: 2px 6px;
          border-radius: var(--radius-sm);
          font-size: 0.8125rem;
        }
      `}</style>
    </div>
  );
}

// Simple markdown formatter
function formatMarkdown(content: string): string {
  return content
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/`(.*?)`/g, "<code>$1</code>")
    .replace(/^- (.*)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>\n?)+/g, "<ul>$&</ul>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/^(.+)$/gm, (match) => {
      if (match.startsWith("<")) return match;
      return `<p>${match}</p>`;
    });
}

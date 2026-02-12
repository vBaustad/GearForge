"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import Link from "next/link";
import { GitFork } from "lucide-react";

interface RemixesSectionProps {
  creationId: Id<"creations">;
  remixCount: number;
}

export function RemixesSection({ creationId, remixCount }: RemixesSectionProps) {
  const remixes = useQuery(api.creations.getRemixes, { creationId, limit: 6 });

  if (remixCount === 0 || !remixes || remixes.length === 0) {
    return null;
  }

  return (
    <section className="remixes-section">
      <h3 className="remixes-header">
        <GitFork size={18} />
        <span>Remixes</span>
        <span className="remixes-count">{remixCount}</span>
      </h3>

      <div className="remixes-grid">
        {remixes.map((remix) => (
          <Link
            key={remix._id}
            href={`/design/${remix._id}`}
            className="remix-card"
          >
            <div className="remix-thumbnail">
              {remix.thumbnailUrl ? (
                <img src={remix.thumbnailUrl} alt={remix.title} />
              ) : (
                <div className="remix-placeholder">GF</div>
              )}
            </div>
            <div className="remix-info">
              <span className="remix-title">{remix.title}</span>
              <span className="remix-creator">
                by {remix.creatorName.split("#")[0]}
              </span>
            </div>
          </Link>
        ))}
      </div>

      <style jsx>{`
        .remixes-section {
          margin-top: var(--space-xl);
          padding-top: var(--space-xl);
          border-top: 1px solid var(--border);
        }

        .remixes-header {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          font-size: 1rem;
          font-weight: 600;
          margin-bottom: var(--space-lg);
        }

        .remixes-count {
          font-size: 0.75rem;
          font-weight: 500;
          background: var(--surface-elevated);
          padding: 2px 8px;
          border-radius: 999px;
          color: var(--text-muted);
        }

        .remixes-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: var(--space-md);
        }

        .remix-card {
          display: flex;
          flex-direction: column;
          text-decoration: none;
          color: inherit;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          overflow: hidden;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }

        .remix-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .remix-thumbnail {
          aspect-ratio: 4 / 3;
          background: var(--bg-deep);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .remix-thumbnail img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .remix-placeholder {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text-muted);
          opacity: 0.3;
        }

        .remix-info {
          padding: var(--space-sm);
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .remix-title {
          font-weight: 600;
          font-size: 0.875rem;
          color: var(--text-primary);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .remix-creator {
          font-size: 0.75rem;
          color: var(--text-muted);
        }
      `}</style>
    </section>
  );
}

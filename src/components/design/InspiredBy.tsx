"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";

interface InspiredByProps {
  original: {
    _id: string;
    title: string;
    creatorName: string;
    creatorId: string;
    thumbnailUrl: string | null;
  };
}

export function InspiredBy({ original }: InspiredByProps) {
  return (
    <div className="inspired-by-section">
      <div className="inspired-by-header">
        <Sparkles size={16} />
        <span>Inspired by</span>
      </div>
      <Link href={`/design/${original._id}`} className="inspired-by-card">
        <div className="inspired-by-thumbnail">
          {original.thumbnailUrl ? (
            <img src={original.thumbnailUrl} alt={original.title} />
          ) : (
            <div className="inspired-by-placeholder">GF</div>
          )}
        </div>
        <div className="inspired-by-info">
          <span className="inspired-by-title">{original.title}</span>
          <span className="inspired-by-creator">
            by {original.creatorName.split("#")[0]}
          </span>
        </div>
      </Link>

      <style jsx>{`
        .inspired-by-section {
          margin-bottom: var(--space-lg);
          padding: var(--space-md);
          background: rgba(212, 145, 92, 0.08);
          border: 1px solid rgba(212, 145, 92, 0.2);
          border-radius: var(--radius-md);
        }

        .inspired-by-header {
          display: flex;
          align-items: center;
          gap: var(--space-xs);
          font-size: 0.8125rem;
          color: var(--accent);
          margin-bottom: var(--space-sm);
          font-weight: 500;
        }

        .inspired-by-card {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          text-decoration: none;
          color: inherit;
          padding: var(--space-sm);
          margin: calc(var(--space-sm) * -1);
          margin-top: 0;
          border-radius: var(--radius);
          transition: background 0.15s ease;
        }

        .inspired-by-card:hover {
          background: rgba(212, 145, 92, 0.1);
        }

        .inspired-by-thumbnail {
          width: 48px;
          height: 48px;
          border-radius: var(--radius-sm);
          overflow: hidden;
          flex-shrink: 0;
          background: var(--bg-deep);
        }

        .inspired-by-thumbnail img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .inspired-by-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--text-muted);
        }

        .inspired-by-info {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .inspired-by-title {
          font-weight: 600;
          font-size: 0.875rem;
          color: var(--text-primary);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .inspired-by-creator {
          font-size: 0.75rem;
          color: var(--text-muted);
        }
      `}</style>
    </div>
  );
}

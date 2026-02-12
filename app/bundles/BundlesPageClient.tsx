"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import Link from "next/link";
import { Layers, Eye, Heart, Filter } from "lucide-react";
import { Breadcrumbs } from "@/components/Breadcrumbs";

const CATEGORIES = [
  { value: "", label: "All Categories" },
  { value: "bedroom", label: "Bedroom" },
  { value: "living_room", label: "Living Room" },
  { value: "kitchen", label: "Kitchen" },
  { value: "garden", label: "Garden" },
  { value: "tavern", label: "Tavern" },
  { value: "throne_room", label: "Throne Room" },
  { value: "workshop", label: "Workshop" },
  { value: "library", label: "Library" },
  { value: "exterior", label: "Exterior" },
  { value: "other", label: "Other" },
] as const;

type CategoryFilter = (typeof CATEGORIES)[number]["value"];

export function BundlesPageClient() {
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("");

  const bundles = useQuery(api.roomBundles.list, {
    category: categoryFilter || undefined,
    limit: 30,
  } as any);

  return (
    <div className="container page-section">
      <Breadcrumbs items={[{ label: "Room Bundles" }]} />

      <div className="page-header">
        <div>
          <h1 style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", marginBottom: "0.5rem" }}>
            Room Bundles
          </h1>
          <p className="text-secondary">
            Complete room designs with multiple coordinated pieces
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="filter-group">
          <Filter size={16} />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as CategoryFilter)}
            className="filter-select"
          >
            {CATEGORIES.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Bundles Grid */}
      {!bundles ? (
        <div style={{ minHeight: "300px" }} />
      ) : bundles.length === 0 ? (
        <div className="card" style={{ padding: "var(--space-2xl)", textAlign: "center" }}>
          <Layers size={48} style={{ color: "var(--text-muted)", marginBottom: "var(--space-md)" }} />
          <h3 style={{ marginBottom: "var(--space-sm)" }}>No Room Bundles Yet</h3>
          <p className="text-muted">
            {categoryFilter
              ? "No bundles found in this category. Try another filter."
              : "Be the first to create a room bundle!"}
          </p>
        </div>
      ) : (
        <div className="bundles-grid">
          {bundles.map((bundle: any) => (
            <Link
              key={bundle._id}
              href={`/bundles/${bundle._id}`}
              className="bundle-card"
            >
              {/* Cover Image */}
              <div className="bundle-cover">
                {bundle.coverUrl ? (
                  <img src={bundle.coverUrl} alt={bundle.title} />
                ) : (
                  <div className="cover-placeholder">
                    <Layers size={32} />
                  </div>
                )}
                <div className="bundle-badge">
                  {bundle.designCount} designs
                </div>
              </div>

              {/* Info */}
              <div className="bundle-info">
                <div className="bundle-category">
                  {CATEGORIES.find((c) => c.value === bundle.category)?.label ?? bundle.category}
                </div>
                <h3 className="bundle-title">{bundle.title}</h3>
                <p className="bundle-creator">by {bundle.creatorName}</p>

                <div className="bundle-stats">
                  <span>
                    <Eye size={14} />
                    {bundle.viewCount}
                  </span>
                  <span>
                    <Heart size={14} />
                    {bundle.likeCount}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <style jsx>{`
        .page-header {
          margin-bottom: var(--space-xl);
        }

        .filters-bar {
          display: flex;
          gap: var(--space-md);
          margin-bottom: var(--space-xl);
          flex-wrap: wrap;
        }

        .filter-group {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          color: var(--text-muted);
        }

        .filter-select {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: var(--space-sm) var(--space-md);
          color: var(--text-primary);
          font-size: 0.875rem;
        }

        .bundles-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: var(--space-lg);
        }

        .bundle-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          overflow: hidden;
          text-decoration: none;
          color: inherit;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }

        .bundle-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .bundle-cover {
          position: relative;
          aspect-ratio: 16 / 9;
          background: var(--bg-deep);
          overflow: hidden;
        }

        .bundle-cover img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .cover-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
        }

        .bundle-badge {
          position: absolute;
          bottom: var(--space-sm);
          right: var(--space-sm);
          background: rgba(0, 0, 0, 0.75);
          color: white;
          padding: 4px 10px;
          border-radius: var(--radius);
          font-size: 0.75rem;
          font-weight: 500;
        }

        .bundle-info {
          padding: var(--space-lg);
        }

        .bundle-category {
          font-size: 0.6875rem;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--accent);
          margin-bottom: var(--space-xs);
        }

        .bundle-title {
          margin: 0 0 var(--space-xs);
          font-size: 1.125rem;
          font-weight: 600;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .bundle-creator {
          font-size: 0.8125rem;
          color: var(--text-muted);
          margin: 0 0 var(--space-md);
        }

        .bundle-stats {
          display: flex;
          gap: var(--space-md);
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .bundle-stats span {
          display: flex;
          align-items: center;
          gap: 4px;
        }
      `}</style>
    </div>
  );
}

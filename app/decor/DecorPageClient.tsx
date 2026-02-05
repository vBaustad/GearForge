"use client";

import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Search, Package, ExternalLink, Grid, List } from "lucide-react";

// Declare Wowhead tooltip refresh function (loaded from external script)
declare global {
  interface Window {
    $WowheadPower?: {
      refreshLinks: () => void;
    };
  }
}

// Friendly labels for common Blizzard categories
const CATEGORY_LABELS: Record<string, string> = {
  "Furniture": "Furniture",
  "Lighting": "Lights & Lamps",
  "Outdoor": "Outdoor",
  "Wall Decor": "Wall Decor",
  "Floor Decor": "Floor Decor",
  "Table Decor": "Table Decor",
  "Plants": "Plants & Nature",
  "Storage": "Storage",
  "Beds": "Beds & Bedding",
  "Seating": "Seating",
  "Tables": "Tables",
  "Rugs": "Rugs & Carpets",
  "Curtains": "Curtains & Drapes",
  "Cooking": "Kitchen & Cooking",
  "Books": "Books & Scrolls",
  "Profession": "Profession Items",
  "Trophy": "Trophies & Mounts",
  "Seasonal": "Seasonal",
};

type ViewMode = "grid" | "compact";

export function DecorPageClient() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [limit, setLimit] = useState(48);

  const decorItems = useQuery(api.gameData.getDecorItems, {
    search: search || undefined,
    category,
    limit: 1000, // Fetch all for client-side sorting
  });

  const categories = useQuery(api.gameData.getDecorCategories);
  const cacheStats = useQuery(api.gameData.getCacheStats);

  const isLoading = decorItems === undefined;

  // Sort items alphabetically by name
  const sortedItems = decorItems
    ? [...decorItems]
        .sort((a, b) => a.name.localeCompare(b.name))
        .slice(0, limit)
    : [];

  // Reset limit when filters change
  useEffect(() => {
    setLimit(48);
  }, [search, category]);

  // Refresh Wowhead tooltips when items change
  useEffect(() => {
    if (sortedItems && sortedItems.length > 0) {
      const timer = setTimeout(() => {
        window.$WowheadPower?.refreshLinks();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [sortedItems]);

  // Get friendly label for category
  const getCategoryLabel = (cat: string | undefined | null): string => {
    if (!cat) return "Uncategorized";
    return CATEGORY_LABELS[cat] || cat;
  };

  return (
    <div className="container page-section">
      {/* Header */}
      <div className="section-header">
        <div>
          <h1 className="section-title">
            <Package size={24} />
            Housing Items
          </h1>
          <p className="text-secondary" style={{ marginTop: "var(--space-sm)" }}>
            Browse all available decor items for WoW housing
          </p>
        </div>
        {cacheStats && cacheStats.decorCount > 0 && (
          <span className="badge">{cacheStats.decorCount} items</span>
        )}
      </div>

      {/* Filters */}
      <div className="decor-filters" style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-md)", alignItems: "center" }}>
        <div className="search-input-wrapper" style={{ flex: "1 1 250px" }}>
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="input"
            placeholder="Search items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: "flex", gap: "var(--space-xs)" }}>
          <button
            className={`btn ${viewMode === "grid" ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setViewMode("grid")}
            style={{ padding: "var(--space-sm)" }}
            title="Grid view"
          >
            <Grid size={18} />
          </button>
          <button
            className={`btn ${viewMode === "compact" ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setViewMode("compact")}
            style={{ padding: "var(--space-sm)" }}
            title="Compact view"
          >
            <List size={18} />
          </button>
        </div>
      </div>

      {/* Category Pills (quick filters) */}
      {categories && categories.length > 0 ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-xs)", marginBottom: "var(--space-lg)", marginTop: "var(--space-md)" }}>
          <button
            className={`badge ${!category ? "badge-primary" : "badge-outline"}`}
            onClick={() => setCategory(undefined)}
            style={{ cursor: "pointer" }}
          >
            All
          </button>
          {categories.slice(0, 12).map((cat) => (
            <button
              key={cat}
              className={`badge ${category === cat ? "badge-primary" : "badge-outline"}`}
              onClick={() => setCategory(category === cat ? undefined : cat)}
              style={{ cursor: "pointer" }}
            >
              {getCategoryLabel(cat)}
            </button>
          ))}
          {categories.length > 12 && (
            <span className="badge badge-outline" style={{ opacity: 0.6 }}>
              +{categories.length - 12} more in dropdown
            </span>
          )}
        </div>
      ) : (
        <p className="text-muted" style={{ marginTop: "var(--space-md)", marginBottom: "var(--space-lg)", fontSize: "0.875rem" }}>
          Category filters will appear after game data is synced via the Admin panel.
        </p>
      )}

      {/* Results */}
      {isLoading ? (
        <div className={viewMode === "grid" ? "decor-grid" : "decor-list"}>
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="decor-card skeleton" />
          ))}
        </div>
      ) : sortedItems && sortedItems.length > 0 ? (
        <>
          <p className="text-muted" style={{ marginBottom: "var(--space-lg)" }}>
            Showing {sortedItems.length} items
            {decorItems && decorItems.length > sortedItems.length && (
              <> of {decorItems.length}</>
            )}
            {category && <> in <strong>{getCategoryLabel(category)}</strong></>}
          </p>
          <div className={viewMode === "grid" ? "decor-grid" : "decor-list"}>
            {sortedItems.map((item) => (
              <DecorCard key={item._id} item={item} viewMode={viewMode} />
            ))}
          </div>
          {decorItems && sortedItems.length < decorItems.length && (
            <div style={{ textAlign: "center", marginTop: "var(--space-xl)" }}>
              <button
                className="btn btn-secondary"
                onClick={() => setLimit((prev) => prev + 48)}
              >
                Load More ({decorItems.length - sortedItems.length} remaining)
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="empty-state">
          <Package size={48} />
          <h3>No items found</h3>
          <p className="text-muted">
            {cacheStats && cacheStats.decorCount === 0
              ? "The database is empty. An admin needs to sync game data from Blizzard."
              : "Try adjusting your search or filters."}
          </p>
        </div>
      )}
    </div>
  );
}

interface DecorItem {
  _id: string;
  blizzardId: number;
  name: string;
  description?: string;
  iconUrl?: string;
  wowItemId?: number;
  category?: string;
  source?: string;
  sourceDetails?: string;
}

function DecorCard({ item, viewMode = "grid" }: { item: DecorItem; viewMode?: ViewMode }) {
  const wowheadUrl = item.wowItemId
    ? `https://www.wowhead.com/item=${item.wowItemId}`
    : null;

  const categoryLabel = item.category ? (CATEGORY_LABELS[item.category] || item.category) : undefined;

  if (viewMode === "compact") {
    const content = (
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)", padding: "var(--space-sm)" }}>
        <div style={{ width: 36, height: 36, flexShrink: 0 }}>
          {item.iconUrl ? (
            <img src={item.iconUrl} alt={item.name} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          ) : (
            <Package size={24} />
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {item.name}
          </div>
          {categoryLabel && (
            <span className="text-muted" style={{ fontSize: "0.75rem" }}>{categoryLabel}</span>
          )}
        </div>
        {wowheadUrl && (
          <ExternalLink size={14} className="text-muted" style={{ flexShrink: 0 }} />
        )}
      </div>
    );

    if (wowheadUrl) {
      return (
        <a
          href={wowheadUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="decor-card-compact"
          data-wowhead={`item=${item.wowItemId}`}
          style={{ display: "block", textDecoration: "none" }}
        >
          {content}
        </a>
      );
    }

    return <div className="decor-card-compact">{content}</div>;
  }

  // Grid view (default)
  const content = (
    <>
      <div className="decor-card-image">
        {item.iconUrl ? (
          <img src={item.iconUrl} alt={item.name} loading="lazy" />
        ) : (
          <Package size={48} />
        )}
      </div>
      <div className="decor-card-info">
        <h3 className="decor-card-title">{item.name}</h3>
        {categoryLabel && (
          <span className="badge badge-small">{categoryLabel}</span>
        )}
      </div>
    </>
  );

  if (wowheadUrl) {
    return (
      <a
        href={wowheadUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="decor-card-vertical decor-card-link"
        data-wowhead={`item=${item.wowItemId}`}
      >
        {content}
        <span className="decor-card-wowhead">
          <ExternalLink size={12} />
          Wowhead
        </span>
      </a>
    );
  }

  return <div className="decor-card-vertical">{content}</div>;
}

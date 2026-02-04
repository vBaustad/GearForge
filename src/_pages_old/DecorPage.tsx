import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Search, Package, Filter, ChevronDown, ExternalLink } from "lucide-react";
import { SEO } from "@/components/SEO";

// Declare Wowhead tooltip refresh function (loaded from external script)
declare global {
  interface Window {
    $WowheadPower?: {
      refreshLinks: () => void;
    };
  }
}

export function DecorPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | undefined>(undefined);

  const [limit, setLimit] = useState(48); // Start with 48 items

  const decorItems = useQuery(api.gameData.getDecorItems, {
    search: search || undefined,
    category,
    limit,
  });

  const categories = useQuery(api.gameData.getDecorCategories);
  const cacheStats = useQuery(api.gameData.getCacheStats);

  const isLoading = decorItems === undefined;

  // Reset limit when filters change
  useEffect(() => {
    setLimit(48);
  }, [search, category]);

  // Refresh Wowhead tooltips when items change
  useEffect(() => {
    if (decorItems && decorItems.length > 0) {
      // Small delay to ensure DOM is updated
      const timer = setTimeout(() => {
        window.$WowheadPower?.refreshLinks();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [decorItems]);

  return (
    <>
      <SEO
        title="WoW Housing Items Database - All Decor, Furniture & Fixtures for Midnight"
        description="Complete database of World of Warcraft housing items for Midnight and TWW. Browse 2000+ decor items, furniture, and fixtures. Find where to farm housing items with Wowhead links."
        url="/decor"
        keywords="WoW housing items, WoW decor database, WoW furniture list, WoW Midnight decorations, housing item farming, WoW fixtures, blood elf decor, night elf decor, WoW decor farming, TWW housing items, WoW tables chairs beds, WoW lighting, housing decorations source, where to get WoW decor, farmable housing items, WoW housing catalog"
      />
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
      <div className="decor-filters">
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="input"
            placeholder="Search items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {categories && categories.length > 0 && (
          <div className="filter-select-wrapper">
            <Filter size={18} className="filter-icon" />
            <select
              className="input"
              value={category || ""}
              onChange={(e) => setCategory(e.target.value || undefined)}
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <ChevronDown size={16} className="select-chevron" />
          </div>
        )}
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="decor-grid">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="decor-card skeleton" />
          ))}
        </div>
      ) : decorItems && decorItems.length > 0 ? (
        <>
          <p className="text-muted" style={{ marginBottom: "var(--space-lg)" }}>
            Showing {decorItems.length} items
            {cacheStats && cacheStats.decorCount > decorItems.length && (
              <> of {cacheStats.decorCount}</>
            )}
          </p>
          <div className="decor-grid">
            {decorItems.map((item) => (
              <DecorCard key={item._id} item={item} />
            ))}
          </div>
          {cacheStats && decorItems.length < cacheStats.decorCount && (
            <div style={{ textAlign: "center", marginTop: "var(--space-xl)" }}>
              <button
                className="btn btn-secondary"
                onClick={() => setLimit((prev) => prev + 48)}
              >
                Load More
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
    </>
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

function DecorCard({ item }: { item: DecorItem }) {
  const wowheadUrl = item.wowItemId
    ? `https://www.wowhead.com/item=${item.wowItemId}`
    : null;

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
        {item.category && (
          <span className="badge badge-small">{item.category}</span>
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

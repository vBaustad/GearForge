"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Search, Home, Loader, Users } from "lucide-react";
import { DesignCard } from "@/components/DesignCard";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CATEGORIES, CATEGORY_LABELS, type Category, type CreationWithCreator } from "@/types/creation";
import { useAuth } from "@/lib/auth";
import { trackSearch, trackCategoryFilter } from "@/lib/analytics";

type SortOption = "newest" | "popular";
type FeedType = "all" | "following";
const PAGE_SIZE = 20;

export function BrowsePageClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isAuthenticated, sessionToken } = useAuth();

  const initialCategory = searchParams?.get("category") as Category | null;
  const initialSort = (searchParams?.get("sort") as SortOption) || "newest";
  const initialQuery = searchParams?.get("q") || "";
  const initialFeed = (searchParams?.get("feed") as FeedType) || "all";

  const [feedType, setFeedType] = useState<FeedType>(initialFeed);
  const [category, setCategory] = useState<Category | "all">(
    initialCategory || "all"
  );
  const [sortBy, setSortBy] = useState<SortOption>(initialSort);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [debouncedSearch, setDebouncedSearch] = useState(initialQuery);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [allItems, setAllItems] = useState<CreationWithCreator[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset pagination when filters change
  useEffect(() => {
    setCursor(undefined);
    setAllItems([]);
  }, [category, sortBy, debouncedSearch, feedType]);

  // Build query args for regular feed
  const queryArgs = useMemo(() => {
    const args: {
      category?: Category;
      sortBy: SortOption;
      limit: number;
      cursor?: string;
      searchQuery?: string;
    } = {
      sortBy,
      limit: PAGE_SIZE,
      cursor,
    };
    if (category !== "all") {
      args.category = category;
    }
    if (debouncedSearch.trim()) {
      args.searchQuery = debouncedSearch.trim();
    }
    return args;
  }, [category, sortBy, cursor, debouncedSearch]);

  // Query for regular feed
  const regularResult = useQuery(
    api.creations.listPaginated,
    feedType === "all" ? queryArgs : "skip"
  );

  // Query for following feed
  const followingResult = useQuery(
    api.creations.listFollowingFeed,
    feedType === "following" && sessionToken
      ? { sessionToken, cursor, limit: PAGE_SIZE }
      : "skip"
  );

  // Use appropriate result based on feed type
  const result = feedType === "following" ? followingResult : regularResult;

  // Append new items when result changes
  useEffect(() => {
    if (result?.items) {
      if (cursor) {
        // Appending
        setAllItems((prev) => {
          const existingIds = new Set(prev.map((item) => item._id));
          const newItems = result.items.filter((item) => !existingIds.has(item._id));
          return [...prev, ...newItems];
        });
      } else {
        // Fresh load
        setAllItems(result.items);
      }
      setIsLoadingMore(false);
    }
  }, [result, cursor]);

  const loadMore = useCallback(() => {
    if (result?.nextCursor && !isLoadingMore) {
      setIsLoadingMore(true);
      setCursor(result.nextCursor);
    }
  }, [result?.nextCursor, isLoadingMore]);

  // Infinite scroll observer
  useEffect(() => {
    if (!result?.hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    const sentinel = document.getElementById("load-more-sentinel");
    if (sentinel) observer.observe(sentinel);

    return () => observer.disconnect();
  }, [loadMore, result?.hasMore]);

  // Track search analytics when results are available
  useEffect(() => {
    if (debouncedSearch.trim() && result?.items !== undefined && !cursor) {
      // Only track on fresh searches (not pagination)
      trackSearch(debouncedSearch.trim(), allItems.length);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, result?.items]);

  // Update URL params when filters change
  const handleFeedChange = (newFeed: FeedType) => {
    setFeedType(newFeed);
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    if (newFeed === "all") {
      params.delete("feed");
    } else {
      params.set("feed", newFeed);
    }
    router.push(`/browse?${params.toString()}`);
  };

  const handleCategoryChange = (newCategory: Category | "all") => {
    setCategory(newCategory);
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    if (newCategory === "all") {
      params.delete("category");
    } else {
      params.set("category", newCategory);
      trackCategoryFilter(newCategory);
    }
    router.push(`/browse?${params.toString()}`);
  };

  const handleSortChange = (newSort: SortOption) => {
    setSortBy(newSort);
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.set("sort", newSort);
    router.push(`/browse?${params.toString()}`);
  };

  // Category label for display
  const categoryLabel = category !== "all" ? CATEGORY_LABELS[category] : null;

  // Build breadcrumb items based on current filters
  const breadcrumbItems = categoryLabel
    ? [
        { label: "Browse", href: "/browse" },
        { label: categoryLabel },
      ]
    : [{ label: "Browse" }];

  return (
    <div className="container page-section">
      {/* Breadcrumbs for SEO */}
      <Breadcrumbs items={breadcrumbItems} />

      {/* Page Header */}
      <div style={{ marginBottom: 'var(--space-xl)' }}>
        <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', marginBottom: '0.5rem' }}>
          {categoryLabel ? `${categoryLabel} Designs` : "Browse Designs"}
        </h1>
        <p className="text-secondary">
          {categoryLabel
            ? `Discover ${categoryLabel.toLowerCase()} housing creations from the community`
            : "Discover housing creations from the community"}
        </p>
      </div>

      {/* Feed Tabs (when logged in) */}
      {isAuthenticated && (
        <div
          style={{
            display: "flex",
            gap: "var(--space-xs)",
            marginBottom: "var(--space-lg)",
            borderBottom: "1px solid var(--border)",
            paddingBottom: "var(--space-sm)",
          }}
        >
          <button
            onClick={() => handleFeedChange("all")}
            className={`btn ${feedType === "all" ? "btn-primary" : "btn-ghost"}`}
            style={{ borderRadius: "var(--radius-sm)" }}
          >
            All Designs
          </button>
          <button
            onClick={() => handleFeedChange("following")}
            className={`btn ${feedType === "following" ? "btn-primary" : "btn-ghost"}`}
            style={{
              borderRadius: "var(--radius-sm)",
              display: "flex",
              alignItems: "center",
              gap: "var(--space-xs)",
            }}
          >
            <Users size={16} />
            Following
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="browse-filters">
        {/* Search (only for "all" feed) */}
        {feedType === "all" && (
          <div className="browse-search">
            <Search size={18} className="browse-search-icon" />
            <input
              type="text"
              placeholder="Search designs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input"
            />
          </div>
        )}

        {/* Category filter (only for "all" feed) */}
        {feedType === "all" && (
          <select
            value={category}
            onChange={(e) => handleCategoryChange(e.target.value as Category | "all")}
            className="input"
            style={{ width: 'auto', minWidth: '140px' }}
          >
            <option value="all">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {CATEGORY_LABELS[cat]}
              </option>
            ))}
          </select>
        )}

        {/* Sort filter (only for "all" feed) */}
        {feedType === "all" && (
          <select
            value={sortBy}
            onChange={(e) => handleSortChange(e.target.value as SortOption)}
            className="input"
            style={{ width: 'auto', minWidth: '120px' }}
          >
            <option value="newest">Newest</option>
            <option value="popular">Popular</option>
          </select>
        )}
      </div>

      {/* Results count */}
      {result && allItems.length > 0 && (
        <p className="browse-results">
          {allItems.length}{result.hasMore ? "+" : ""} design{allItems.length !== 1 ? "s" : ""} found
          {categoryLabel && ` in ${categoryLabel}`}
        </p>
      )}

      {/* Gallery Grid */}
      {result === undefined ? (
        <div style={{ minHeight: '50vh' }} />
      ) : allItems.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-state-icon">
            {feedType === "following" ? <Users size={32} /> : <Home size={32} />}
          </div>
          <h3 style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>
            {feedType === "following" ? "No designs from followed creators" : "No designs found"}
          </h3>
          <p className="text-secondary">
            {feedType === "following"
              ? "Follow some creators to see their designs here"
              : searchQuery
                ? "Try a different search term"
                : "No designs in this category yet"}
          </p>
        </div>
      ) : (
        <>
          <div className="gallery-grid">
            {allItems.map((creation) => (
              <DesignCard key={creation._id} creation={creation} />
            ))}
          </div>

          {/* Load more sentinel / button */}
          {result.hasMore && (
            <div
              id="load-more-sentinel"
              style={{
                display: 'flex',
                justifyContent: 'center',
                padding: 'var(--space-xl)',
              }}
            >
              {isLoadingMore ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                  <Loader size={18} className="animate-spin" />
                  Loading more...
                </div>
              ) : (
                <button onClick={loadMore} className="btn btn-secondary">
                  Load More
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

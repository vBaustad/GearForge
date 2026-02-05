"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { ArrowRight, Trophy, TrendingUp, Sparkles, Heart, Eye, Upload, Compass, User, Star } from "lucide-react";
import { DesignCard } from "@/components/DesignCard";
import { CATEGORY_LABELS, type Category } from "@/types/creation";
import type { Id } from "../convex/_generated/dataModel";

interface FeaturedCreator {
  _id: Id<"users">;
  battleTag: string;
  avatarUrl: string | undefined;
  bio: string | undefined;
  totalLikes: number;
  totalViews: number;
  designCount: number;
}

export function LandingPageClient() {
  // Featured design (top performing this week)
  const featured = useQuery(api.creations.getFeatured);

  // Trending designs (time-decayed popularity)
  const trendingDesigns = useQuery(api.creations.getTrending, {
    limit: 8,
    timeWindowDays: 7,
  });

  // Latest designs
  const latestDesigns = useQuery(api.creations.list, {
    sortBy: "newest",
    limit: 12,
  });

  // Platform stats
  const stats = useQuery(api.creations.getStats);

  // Featured creators
  const featuredCreators = useQuery(api.users.getFeaturedCreators, { limit: 6 });

  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "k";
    }
    return num.toString();
  };

  // Only show content when loaded - no skeletons to prevent flash
  const isLoading = featured === undefined || trendingDesigns === undefined || latestDesigns === undefined;

  // Show empty container during loading to prevent flash
  if (isLoading) {
    return <div className="landing" style={{ minHeight: '80vh' }} />;
  }

  // Check if we have any content at all
  const hasContent = latestDesigns.length > 0;

  // If no content, show a welcoming hero instead of empty grids
  if (!hasContent) {
    return (
      <div className="landing">
        <WelcomeHero />
      </div>
    );
  }

  return (
    <div className="landing">
      {/* Hero: Info/Stats on left, Top Design on right */}
      <section className="hero-section">
        <div className="container">
          <div className="hero-grid">
            {/* Left side: Info & Stats */}
            <div className="hero-info">
              <h1 className="hero-title font-display">
                Discover & Share<br />Housing Designs
              </h1>
              <p className="hero-subtitle">
                Browse community creations, get inspired, and share your own WoW housing designs.
              </p>

              {stats && stats.designCount > 0 && (
                <div className="hero-stats">
                  <div className="hero-stat">
                    <span className="hero-stat-value">{formatNumber(stats.designCount)}</span>
                    <span className="hero-stat-label">designs</span>
                  </div>
                  <div className="hero-stat">
                    <span className="hero-stat-value">{formatNumber(stats.creatorCount)}</span>
                    <span className="hero-stat-label">creators</span>
                  </div>
                  <div className="hero-stat">
                    <span className="hero-stat-value">{formatNumber(stats.importCount)}</span>
                    <span className="hero-stat-label">views</span>
                  </div>
                </div>
              )}

              <div className="hero-actions">
                <Link href="/browse" className="btn btn-primary">
                  <Compass size={18} />
                  Browse All
                </Link>
                <Link href="/upload" className="btn btn-secondary">
                  <Upload size={18} />
                  Upload
                </Link>
              </div>
            </div>

            {/* Right side: Featured Design */}
            {featured && (
              <div className="hero-featured">
                <div className="hero-featured-label">
                  <Trophy size={16} />
                  Top This Week
                </div>
                <Link href={`/design/${featured._id}`} className="hero-featured-card">
                  <div className="hero-featured-image">
                    {featured.thumbnailUrl ? (
                      <img src={featured.thumbnailUrl} alt={featured.title} />
                    ) : (
                      <div className="hero-featured-placeholder">
                        <img src="/gearforge_logo_new.png" alt="" className="placeholder-logo" />
                      </div>
                    )}
                  </div>
                  <div className="hero-featured-overlay">
                    <span className="badge">{CATEGORY_LABELS[featured.category as Category]}</span>
                    <h3 className="hero-featured-title">{featured.title}</h3>
                    <p className="hero-featured-creator">by {featured.creatorName}</p>
                    <div className="hero-featured-stats">
                      <span><Heart size={14} /> {formatNumber(featured.likeCount)}</span>
                      <span><Eye size={14} /> {formatNumber(featured.viewCount)}</span>
                    </div>
                  </div>
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Trending Section - only show if we have trending content */}
      {trendingDesigns.length > 0 && (
        <section className="discovery-section">
          <div className="container">
            <div className="section-header">
              <h2 className="section-title">
                <TrendingUp size={22} className="section-icon" />
                Trending
              </h2>
              <Link href="/browse?sort=popular" className="section-link">
                See All
                <ArrowRight size={16} />
              </Link>
            </div>

            <div className="masonry-grid">
              {trendingDesigns.map((creation) => (
                <DesignCard
                  key={creation._id}
                  creation={creation}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Creators Section */}
      {featuredCreators && featuredCreators.length > 0 && (
        <section className="discovery-section">
          <div className="container">
            <div className="section-header">
              <h2 className="section-title">
                <Star size={22} className="section-icon" />
                Featured Creators
              </h2>
            </div>

            <div className="creators-grid">
              {featuredCreators.filter((c): c is FeaturedCreator => c !== null).map((creator) => (
                <Link
                  key={creator._id}
                  href={`/user/${creator._id}`}
                  className="creator-card"
                >
                  <div className="creator-card-avatar">
                    {creator.avatarUrl ? (
                      <img src={creator.avatarUrl} alt={creator.battleTag} />
                    ) : (
                      <User size={24} />
                    )}
                  </div>
                  <div className="creator-card-info">
                    <span className="creator-card-name">
                      {creator.battleTag.split("#")[0]}
                    </span>
                    <div className="creator-card-stats">
                      <span>{creator.designCount} design{creator.designCount !== 1 ? "s" : ""}</span>
                      <span><Heart size={12} /> {creator.totalLikes}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Latest Section */}
      <section className="discovery-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">
              <Sparkles size={22} className="section-icon" />
              Latest
            </h2>
            <Link href="/browse?sort=newest" className="section-link">
              See All
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="masonry-grid">
            {latestDesigns.map((creation) => (
              <DesignCard key={creation._id} creation={creation} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

// Welcome hero shown when there's no content yet
function WelcomeHero() {
  return (
    <section className="welcome-hero">
      <div className="container">
        <div className="welcome-content">
          <div className="welcome-badge">
            <Sparkles size={14} />
            Early Access
          </div>
          <div className="welcome-logo">
            <img src="/gearforge_logo_new.png" alt="" />
          </div>
          <h1 className="welcome-title font-display">
            We&apos;re Building This For You
          </h1>
          <p className="welcome-subtitle">
            A place to share and discover WoW housing designs.
            Be one of the first to upload your creations and help shape our community.
          </p>
          <div className="welcome-actions">
            <Link href="/upload" className="btn btn-primary btn-lg">
              <Upload size={20} />
              Upload Your Design
            </Link>
            <Link href="/help" className="btn btn-secondary btn-lg">
              <Compass size={20} />
              How It Works
            </Link>
          </div>
        </div>

        {/* Feature cards */}
        <div className="welcome-features">
          <div className="welcome-feature">
            <div className="welcome-feature-icon">
              <Upload size={24} />
            </div>
            <h3>Share Your Builds</h3>
            <p>Export from the game and upload with screenshots</p>
          </div>
          <div className="welcome-feature">
            <div className="welcome-feature-icon">
              <Heart size={24} />
            </div>
            <h3>Get Discovered</h3>
            <p>Link your Twitch or YouTube and grow your audience</p>
          </div>
          <div className="welcome-feature">
            <div className="welcome-feature-icon">
              <Sparkles size={24} />
            </div>
            <h3>One-Click Import</h3>
            <p>Copy strings and use them directly in WoW</p>
          </div>
        </div>

        {/* Personal note */}
        <div className="welcome-note">
          <p>
            With design sharing coming to WoW housing, we&apos;re building a place for the community to discover and share creativity.
            This is just the beginning — we&apos;d love your feedback as we build this together.
          </p>
        </div>
      </div>
    </section>
  );
}

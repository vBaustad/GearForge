"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { User, Heart, Eye, Calendar, Layout, UserPlus, UserCheck, Users } from "lucide-react";
import { DesignCard } from "@/components/DesignCard";
import { TipLinks } from "@/components/TipLinks";
import { BadgeGrid } from "@/components/badges/BadgeGrid";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { useAuth } from "@/lib/auth";
import Script from "next/script";

interface UserPageClientProps {
  id: string;
}

export function UserPageClient({ id }: UserPageClientProps) {
  const [isFollowing, setIsFollowing] = useState(false);
  const { user, isAuthenticated, sessionToken } = useAuth();

  // Validate ID before making queries - must be a valid Convex ID format
  const isValidId = id && id !== "undefined" && id !== "null" && id.length > 0;

  const userProfile = useQuery(
    api.users.getById,
    isValidId ? { id: id as Id<"users"> } : "skip"
  );
  const designs = useQuery(
    api.creations.getByCreator,
    isValidId ? { creatorId: id as Id<"users"> } : "skip"
  );
  const socialConnections = useQuery(
    api.socialConnections.getByUser,
    isValidId ? { userId: id as Id<"users"> } : "skip"
  );
  const followStats = useQuery(
    api.follows.getStats,
    isValidId ? { userId: id as Id<"users"> } : "skip"
  );
  const isFollowingUser = useQuery(
    api.follows.isFollowing,
    isValidId && user ? { followerId: user.id, followingId: id as Id<"users"> } : "skip"
  );
  const toggleFollow = useMutation(api.follows.toggle);

  // Invalid ID - show not found
  if (!isValidId) {
    return (
      <div className="container page-section">
        <div className="placeholder-page">
          <h2 className="font-display" style={{ marginBottom: "var(--space-md)" }}>
            User Not Found
          </h2>
          <p className="text-secondary" style={{ marginBottom: "var(--space-xl)" }}>
            This user profile doesn&apos;t exist.
          </p>
          <Link href="/" className="btn btn-primary">
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  if (userProfile === undefined || designs === undefined) {
    return (
      <div className="container page-section">
        <div style={{ minHeight: "50vh" }} />
      </div>
    );
  }

  if (userProfile === null) {
    return (
      <div className="container page-section">
        <div className="placeholder-page">
          <h2 className="font-display" style={{ marginBottom: "var(--space-md)" }}>
            User Not Found
          </h2>
          <p className="text-secondary" style={{ marginBottom: "var(--space-xl)" }}>
            This user profile doesn&apos;t exist.
          </p>
          <Link href="/" className="btn btn-primary">
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  const totalLikes = designs.reduce((sum, d) => sum + (d.likeCount || 0), 0);
  const totalViews = designs.reduce((sum, d) => sum + (d.viewCount || 0), 0);
  const memberSince = new Date(userProfile.createdAt).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  // Check if viewing own profile
  const isOwnProfile = user?.id === id;

  const handleToggleFollow = async () => {
    if (!sessionToken || isFollowing) return;
    setIsFollowing(true);
    try {
      await toggleFollow({
        sessionToken,
        followingId: id as Id<"users">,
      });
    } catch (err) {
      console.error("Failed to toggle follow:", err);
    } finally {
      setIsFollowing(false);
    }
  };

  const platformConfig: Record<string, { color: string; bgColor: string; icon: React.ReactNode }> = {
    twitch: {
      color: "#9146FF",
      bgColor: "rgba(145, 70, 255, 0.15)",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/>
        </svg>
      ),
    },
    youtube: {
      color: "#FF0000",
      bgColor: "rgba(255, 0, 0, 0.15)",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
      ),
    },
    kick: {
      color: "#53FC18",
      bgColor: "rgba(83, 252, 24, 0.15)",
      icon: (
        <svg width="16" height="16" viewBox="0 0 512 512" fill="currentColor">
          <path d="M37 .036h164.448v113.621h54.71v-56.82h54.731V.036h164.448v170.777h-54.73v56.82h-54.711v56.8h54.71v56.82h54.73V512.03H310.89v-56.82h-54.73v-56.8h-54.711v113.62H37V.036z"/>
        </svg>
      ),
    },
  };

  // JSON-LD Person schema for SEO
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: userProfile.battleTag.split("#")[0],
    url: `https://gearforge.io/user/${id}`,
    image: userProfile.avatarUrl || undefined,
    description: userProfile.bio || `WoW housing creator with ${designs?.length || 0} designs`,
    sameAs: socialConnections
      ?.map((c: { channelUrl: string }) => c.channelUrl)
      .filter(Boolean) || [],
    interactionStatistic: [
      {
        "@type": "InteractionCounter",
        interactionType: "https://schema.org/FollowAction",
        userInteractionCount: followStats?.followers || 0,
      },
    ],
  };

  return (
    <>
      <Script
        id="user-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="container page-section">
      {/* Breadcrumbs for SEO */}
      <Breadcrumbs
        items={[
          { label: "Creators", href: "/browse" },
          { label: userProfile.battleTag.split("#")[0] },
        ]}
      />

      {/* Profile Hero Section */}
      <div
        className="card"
        style={{
          padding: "var(--space-2xl)",
          marginBottom: "var(--space-2xl)",
          background: "linear-gradient(135deg, var(--bg-surface) 0%, var(--bg-elevated) 100%)",
          border: "1px solid var(--border)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative background element */}
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: "300px",
            height: "300px",
            background: "radial-gradient(circle, var(--accent-glow) 0%, transparent 70%)",
            opacity: 0.5,
            pointerEvents: "none",
          }}
        />

        <div style={{ position: "relative", zIndex: 1 }}>
          {/* Top row: Avatar + Info */}
          <div style={{ display: "flex", gap: "var(--space-xl)", alignItems: "flex-start", flexWrap: "wrap" }}>
            {/* Avatar */}
            <div
              style={{
                width: 120,
                height: 120,
                borderRadius: "var(--radius-lg)",
                background: "var(--bg-deep)",
                border: "3px solid var(--accent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                flexShrink: 0,
              }}
            >
              {userProfile.avatarUrl ? (
                <img
                  src={userProfile.avatarUrl}
                  alt={userProfile.battleTag}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <User size={48} style={{ color: "var(--text-muted)" }} />
              )}
            </div>

            {/* User Info */}
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-md)", marginBottom: "var(--space-xs)", flexWrap: "wrap" }}>
                <h1
                  className="font-display"
                  style={{
                    fontSize: "2rem",
                    color: "var(--text-primary)",
                    margin: 0,
                  }}
                >
                  {userProfile.battleTag.split("#")[0]}
                </h1>

                {/* Follow Button */}
                {!isOwnProfile && isAuthenticated && (
                  <button
                    onClick={handleToggleFollow}
                    disabled={isFollowing}
                    className={`btn ${isFollowingUser ? "btn-secondary" : "btn-primary"}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "var(--space-xs)",
                      padding: "8px 16px",
                      fontSize: "0.875rem",
                    }}
                  >
                    {isFollowingUser ? (
                      <>
                        <UserCheck size={16} />
                        Following
                      </>
                    ) : (
                      <>
                        <UserPlus size={16} />
                        Follow
                      </>
                    )}
                  </button>
                )}
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-md)",
                  flexWrap: "wrap",
                  marginBottom: "var(--space-md)",
                }}
              >
                <span
                  className="text-secondary"
                  style={{ display: "flex", alignItems: "center", gap: "var(--space-xs)", fontSize: "0.875rem" }}
                >
                  <Calendar size={14} />
                  Member since {memberSince}
                </span>
                {followStats && (
                  <>
                    <span
                      className="text-secondary"
                      style={{ display: "flex", alignItems: "center", gap: "var(--space-xs)", fontSize: "0.875rem" }}
                    >
                      <Users size={14} />
                      <strong style={{ color: "var(--text-primary)" }}>{followStats.followers}</strong> followers
                    </span>
                    <span
                      className="text-secondary"
                      style={{ fontSize: "0.875rem" }}
                    >
                      <strong style={{ color: "var(--text-primary)" }}>{followStats.following}</strong> following
                    </span>
                  </>
                )}
              </div>

              {/* Bio */}
              {userProfile.bio && (
                <p
                  className="text-secondary"
                  style={{
                    maxWidth: 600,
                    lineHeight: 1.6,
                    marginBottom: "var(--space-lg)",
                  }}
                >
                  {userProfile.bio}
                </p>
              )}

              {/* Verified Social Links */}
              {socialConnections && socialConnections.length > 0 && (
                <div style={{ display: "flex", gap: "var(--space-sm)", flexWrap: "wrap" }}>
                  {socialConnections.map((conn) => {
                    const config = platformConfig[conn.platform];
                    if (!config) return null;

                    return (
                      <a
                        key={conn.platform}
                        href={conn.channelUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "8px",
                          padding: "8px 14px",
                          background: config.color,
                          borderRadius: "var(--radius-sm)",
                          color: "#fff",
                          fontSize: "0.875rem",
                          fontWeight: 500,
                          textDecoration: "none",
                          transition: "all 0.15s ease",
                        }}
                      >
                        {config.icon}
                        <span>{conn.platformUsername}</span>
                      </a>
                    );
                  })}
                </div>
              )}

              {/* Tip Links */}
              <TipLinks tipLinks={userProfile.tipLinks} />

              {/* Badges */}
              <ErrorBoundary
                compact
                title="Unable to load badges"
                description="Something went wrong while loading badges."
              >
                <BadgeGrid userId={id as Id<"users">} />
              </ErrorBoundary>
            </div>
          </div>

          {/* Stats Row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "var(--space-md)",
              marginTop: "var(--space-xl)",
              paddingTop: "var(--space-xl)",
              borderTop: "1px solid var(--border)",
              maxWidth: 500,
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: "1.75rem",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  fontFamily: "var(--font-display)",
                }}
              >
                {designs.length}
              </div>
              <div
                className="text-muted"
                style={{ fontSize: "0.875rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}
              >
                <Layout size={14} />
                Designs
              </div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: "1.75rem",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  fontFamily: "var(--font-display)",
                }}
              >
                {totalLikes.toLocaleString()}
              </div>
              <div
                className="text-muted"
                style={{ fontSize: "0.875rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}
              >
                <Heart size={14} />
                Likes
              </div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: "1.75rem",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  fontFamily: "var(--font-display)",
                }}
              >
                {totalViews.toLocaleString()}
              </div>
              <div
                className="text-muted"
                style={{ fontSize: "0.875rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}
              >
                <Eye size={14} />
                Views
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Designs Section */}
      <div>
        <h2
          style={{
            marginBottom: "var(--space-lg)",
            display: "flex",
            alignItems: "center",
            gap: "var(--space-sm)",
          }}
        >
          <Layout size={20} />
          Designs
          <span className="text-muted" style={{ fontWeight: 400, fontSize: "1rem" }}>
            ({designs.length})
          </span>
        </h2>
        {designs.length > 0 ? (
          <div className="gallery-grid">
            {designs.map((design) => (
              <DesignCard
                key={design._id}
                id={design._id}
                title={design.title}
                thumbnailUrl={design.thumbnailUrl}
                category={design.category}
                creatorName={userProfile.battleTag.split("#")[0]}
                likeCount={design.likeCount}
                viewCount={design.viewCount}
              />
            ))}
          </div>
        ) : (
          <div
            className="card"
            style={{
              padding: "var(--space-2xl)",
              textAlign: "center",
            }}
          >
            <Layout size={48} style={{ color: "var(--text-muted)", marginBottom: "var(--space-md)" }} />
            <p className="text-muted">This user hasn&apos;t uploaded any designs yet.</p>
          </div>
        )}
      </div>
    </div>
    </>
  );
}

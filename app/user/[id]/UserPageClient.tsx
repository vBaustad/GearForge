"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { User, Heart, Eye, ExternalLink, CheckCircle, Calendar, Layout } from "lucide-react";
import { DesignCard } from "@/components/DesignCard";

interface UserPageClientProps {
  id: string;
}

export function UserPageClient({ id }: UserPageClientProps) {
  const userProfile = useQuery(api.users.getById, { id: id as Id<"users"> });
  const designs = useQuery(api.creations.getByCreator, { creatorId: id as Id<"users"> });
  const socialConnections = useQuery(api.socialConnections.getByUser, { userId: id as Id<"users"> });

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
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M1.393 2.095v19.81h5.737V10.15l3.058 3.706 3.868-4.66v12.709h5.736V8.95l3.815 4.614V2.095h-5.736l-3.869 4.66-3.057-3.707v8.66l-3.815-4.613v14.81H1.393V2.095z"/>
        </svg>
      ),
    },
  };

  return (
    <div className="container page-section">
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
              <h1
                className="font-display"
                style={{
                  fontSize: "2rem",
                  marginBottom: "var(--space-xs)",
                  color: "var(--text-primary)",
                }}
              >
                {userProfile.battleTag.split("#")[0]}
              </h1>

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
                          gap: "6px",
                          padding: "6px 12px",
                          background: config.bgColor,
                          border: `1px solid ${config.color}30`,
                          borderRadius: "var(--radius-sm)",
                          color: config.color,
                          fontSize: "0.875rem",
                          fontWeight: 500,
                          transition: "all 0.15s ease",
                        }}
                      >
                        <CheckCircle size={14} style={{ color: "#22c55e" }} />
                        {config.icon}
                        <span>{conn.platformUsername}</span>
                        <ExternalLink size={12} style={{ opacity: 0.7 }} />
                      </a>
                    );
                  })}
                </div>
              )}
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
  );
}

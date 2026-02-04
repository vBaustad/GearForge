"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { User, Heart, Eye, ExternalLink } from "lucide-react";
import { DesignCard } from "@/components/DesignCard";

interface UserPageClientProps {
  id: string;
}

export function UserPageClient({ id }: UserPageClientProps) {
  const userProfile = useQuery(api.users.getById, { id: id as Id<"users"> });
  const designs = useQuery(api.creations.getByCreator, { creatorId: id as Id<"users"> });

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

  return (
    <div className="container page-section">
      {/* Profile Header */}
      <div className="user-profile-header">
        <div className="user-profile-avatar">
          {userProfile.avatarUrl ? (
            <img src={userProfile.avatarUrl} alt={userProfile.battleTag} />
          ) : (
            <User size={48} />
          )}
        </div>
        <div className="user-profile-info">
          <h1 className="user-profile-name font-display">
            {userProfile.battleTag.split("#")[0]}
          </h1>
          <div className="user-profile-stats">
            <span>{designs.length} design{designs.length !== 1 ? "s" : ""}</span>
            <span><Heart size={14} /> {totalLikes}</span>
            <span><Eye size={14} /> {totalViews}</span>
          </div>

          {/* Bio */}
          {userProfile.bio && (
            <p className="text-secondary" style={{ marginTop: "var(--space-md)", maxWidth: 600 }}>
              {userProfile.bio}
            </p>
          )}

          {/* Social Links */}
          {(userProfile.twitchUrl || userProfile.youtubeUrl) && (
            <div style={{ display: "flex", gap: "var(--space-sm)", marginTop: "var(--space-md)" }}>
              {userProfile.twitchUrl && (
                <a
                  href={userProfile.twitchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary"
                  style={{ display: "flex", alignItems: "center", gap: "var(--space-xs)" }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/>
                  </svg>
                  Twitch
                  <ExternalLink size={14} />
                </a>
              )}
              {userProfile.youtubeUrl && (
                <a
                  href={userProfile.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary"
                  style={{ display: "flex", alignItems: "center", gap: "var(--space-xs)" }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                  YouTube
                  <ExternalLink size={14} />
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Designs Grid */}
      <div style={{ marginTop: "var(--space-2xl)" }}>
        <h2 style={{ marginBottom: "var(--space-lg)" }}>Designs</h2>
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
          <div className="empty-state">
            <p className="text-muted">This user hasn&apos;t uploaded any designs yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

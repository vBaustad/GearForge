"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { User, ExternalLink, Award, UserPlus, UserCheck, Users } from "lucide-react";
import type { Id } from "../../../convex/_generated/dataModel";
import { useAuth } from "@/lib/auth";

interface CreatorCardProps {
  creatorId: Id<"users">;
  creatorName: string;
  creatorAvatarUrl?: string;
  // These could be fetched separately or passed in
  creatorDesignCount?: number;
  creatorFollowerCount?: number;
  creatorBadgeCount?: number;
}

export function CreatorCard({
  creatorId,
  creatorName,
  creatorAvatarUrl,
  creatorDesignCount,
  creatorBadgeCount,
}: CreatorCardProps) {
  const [isToggling, setIsToggling] = useState(false);
  const { user, isAuthenticated, sessionToken } = useAuth();
  const displayName = creatorName.split("#")[0];

  // Check if viewing own profile
  const isOwnProfile = user?.id === creatorId;

  // Get follow status and follower count
  const isFollowingUser = useQuery(
    api.follows.isFollowing,
    user && !isOwnProfile ? { followerId: user.id, followingId: creatorId } : "skip"
  );
  const followerCount = useQuery(api.follows.getFollowerCount, { userId: creatorId });
  const toggleFollow = useMutation(api.follows.toggle);

  const handleToggleFollow = async () => {
    if (!sessionToken || isToggling) return;
    setIsToggling(true);
    try {
      await toggleFollow({
        sessionToken,
        followingId: creatorId,
      });
    } catch (err) {
      console.error("Failed to toggle follow:", err);
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <div
      className="card"
      style={{
        padding: "var(--space-lg)",
        marginTop: "var(--space-lg)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-md)" }}>
        {/* Avatar */}
        <Link
          href={`/user/${creatorId}`}
          style={{
            width: 56,
            height: 56,
            borderRadius: "var(--radius-md)",
            background: "var(--bg-elevated)",
            border: "2px solid var(--accent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          {creatorAvatarUrl ? (
            <img
              src={creatorAvatarUrl}
              alt={displayName}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <User size={24} style={{ color: "var(--text-muted)" }} />
          )}
        </Link>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <Link
            href={`/user/${creatorId}`}
            style={{
              color: "var(--text-primary)",
              textDecoration: "none",
              fontWeight: 600,
              fontSize: "1.125rem",
              display: "flex",
              alignItems: "center",
              gap: "var(--space-xs)",
            }}
          >
            {displayName}
            {creatorBadgeCount && creatorBadgeCount > 0 && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 2,
                  color: "var(--accent)",
                  fontSize: "0.875rem",
                }}
              >
                <Award size={14} />
                {creatorBadgeCount}
              </span>
            )}
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-md)", flexWrap: "wrap" }}>
            {creatorDesignCount !== undefined && (
              <span className="text-muted" style={{ fontSize: "0.875rem" }}>
                {creatorDesignCount} design{creatorDesignCount !== 1 ? "s" : ""}
              </span>
            )}
            {followerCount !== undefined && (
              <span className="text-muted" style={{ fontSize: "0.875rem", display: "flex", alignItems: "center", gap: 4 }}>
                <Users size={12} />
                {followerCount} follower{followerCount !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>

        {/* Follow Button (for non-own profiles) */}
        {!isOwnProfile && isAuthenticated && (
          <button
            onClick={handleToggleFollow}
            disabled={isToggling}
            className={`btn ${isFollowingUser ? "btn-secondary" : "btn-primary"}`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--space-xs)",
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

        {/* View Profile */}
        <Link
          href={`/user/${creatorId}`}
          className="btn btn-ghost"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-xs)",
          }}
        >
          View Profile
          <ExternalLink size={14} />
        </Link>
      </div>
    </div>
  );
}

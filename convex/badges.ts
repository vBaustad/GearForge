import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { logAuditEvent } from "./auditLog";
import { createNotification } from "./notifications";

// Badge type definition
export type BadgeType =
  | "first_design"
  | "prolific_creator"
  | "popular_creator"
  | "viral_design"
  | "community_pillar"
  | "helpful_commenter"
  | "early_adopter"
  | "featured_design";

// Badge definitions with metadata
export const BADGE_DEFINITIONS: Record<
  BadgeType,
  {
    name: string;
    description: string;
    icon: string;
    color: string;
    requirement?: string;
  }
> = {
  first_design: {
    name: "First Creation",
    description: "Created your first design",
    icon: "sparkles",
    color: "#f59e0b",
    requirement: "Create 1 design",
  },
  prolific_creator: {
    name: "Prolific Creator",
    description: "Created 10 designs",
    icon: "palette",
    color: "#8b5cf6",
    requirement: "Create 10 designs",
  },
  popular_creator: {
    name: "Popular Creator",
    description: "Received 100 total likes",
    icon: "heart",
    color: "#ef4444",
    requirement: "Get 100 likes on your designs",
  },
  viral_design: {
    name: "Viral Design",
    description: "Had a design with 50+ likes",
    icon: "trending-up",
    color: "#22c55e",
    requirement: "Get 50 likes on a single design",
  },
  community_pillar: {
    name: "Community Pillar",
    description: "Gained 50+ followers",
    icon: "users",
    color: "#3b82f6",
    requirement: "Get 50 followers",
  },
  helpful_commenter: {
    name: "Helpful Commenter",
    description: "Posted 50+ comments",
    icon: "message-square",
    color: "#06b6d4",
    requirement: "Post 50 comments",
  },
  early_adopter: {
    name: "Early Adopter",
    description: "Joined during the early days",
    icon: "rocket",
    color: "#ec4899",
  },
  featured_design: {
    name: "Featured",
    description: "Had a design featured by the team",
    icon: "star",
    color: "#eab308",
  },
};

// ===== INTERNAL HELPERS =====

/**
 * Check if user already has a badge
 */
async function hasBadge(
  ctx: MutationCtx,
  userId: Id<"users">,
  badgeType: BadgeType
): Promise<boolean> {
  const existing = await ctx.db
    .query("userBadges")
    .withIndex("by_user_badge", (q) =>
      q.eq("userId", userId).eq("badgeType", badgeType)
    )
    .first();

  return existing !== null;
}

/**
 * Award a badge to a user
 */
export async function awardBadge(
  ctx: MutationCtx,
  userId: Id<"users">,
  badgeType: BadgeType,
  relatedCreationId?: Id<"creations">
): Promise<Id<"userBadges"> | null> {
  // Check if already has badge
  if (await hasBadge(ctx, userId, badgeType)) {
    return null;
  }

  const user = await ctx.db.get(userId);
  if (!user) return null;

  // Award the badge
  const badgeId = await ctx.db.insert("userBadges", {
    userId,
    badgeType,
    awardedAt: Date.now(),
    relatedCreationId,
  });

  // Update user's badge count
  await ctx.db.patch(userId, {
    badgeCount: (user.badgeCount ?? 0) + 1,
  });

  // Notify user
  await createNotification(ctx, {
    recipientId: userId,
    type: "badge_earned",
    badgeType,
    creationId: relatedCreationId,
  });

  // Log badge award
  await logAuditEvent(ctx, {
    actorIdentifier: "system",
    action: "badge.awarded",
    targetType: "badge",
    targetId: badgeId,
    targetIdentifier: badgeType,
    details: JSON.stringify({ userId, badgeType, relatedCreationId }),
    severity: "info",
  });

  return badgeId;
}

/**
 * Check and potentially award creation-related badges
 */
export async function checkCreationBadges(
  ctx: MutationCtx,
  userId: Id<"users">
): Promise<void> {
  // Count user's published designs
  const designs = await ctx.db
    .query("creations")
    .withIndex("by_creator", (q) => q.eq("creatorId", userId))
    .filter((q) => q.eq(q.field("status"), "published"))
    .collect();

  const designCount = designs.length;

  // First Design badge
  if (designCount >= 1) {
    await awardBadge(ctx, userId, "first_design");
  }

  // Prolific Creator badge (10 designs)
  if (designCount >= 10) {
    await awardBadge(ctx, userId, "prolific_creator");
  }
}

/**
 * Check and potentially award like-related badges
 */
export async function checkLikeBadges(
  ctx: MutationCtx,
  creatorId: Id<"users">,
  creationId: Id<"creations">
): Promise<void> {
  // Get all creator's designs
  const designs = await ctx.db
    .query("creations")
    .withIndex("by_creator", (q) => q.eq("creatorId", creatorId))
    .filter((q) => q.eq(q.field("status"), "published"))
    .collect();

  // Calculate total likes
  const totalLikes = designs.reduce((sum, d) => sum + d.likeCount, 0);

  // Popular Creator badge (100 total likes)
  if (totalLikes >= 100) {
    await awardBadge(ctx, creatorId, "popular_creator");
  }

  // Check if any single design has 50+ likes (Viral Design)
  const creation = await ctx.db.get(creationId);
  if (creation && creation.likeCount >= 50) {
    await awardBadge(ctx, creatorId, "viral_design", creationId);
  }
}

/**
 * Check and potentially award follower-related badges
 */
export async function checkFollowerBadges(
  ctx: MutationCtx,
  userId: Id<"users">
): Promise<void> {
  // Count followers
  const followers = await ctx.db
    .query("follows")
    .withIndex("by_following", (q) => q.eq("followingId", userId))
    .collect();

  // Community Pillar badge (50 followers)
  if (followers.length >= 50) {
    await awardBadge(ctx, userId, "community_pillar");
  }
}

/**
 * Check and potentially award comment-related badges
 */
export async function checkCommentBadges(
  ctx: MutationCtx,
  userId: Id<"users">
): Promise<void> {
  // Count user's visible comments
  const comments = await ctx.db
    .query("comments")
    .withIndex("by_author", (q) => q.eq("authorId", userId))
    .filter((q) => q.eq(q.field("status"), "visible"))
    .collect();

  // Helpful Commenter badge (50 comments)
  if (comments.length >= 50) {
    await awardBadge(ctx, userId, "helpful_commenter");
  }
}

// ===== QUERIES =====

// Get badges for a user
export const getByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const badges = await ctx.db
      .query("userBadges")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Enrich with badge definitions
    return badges.map((badge) => ({
      ...badge,
      definition: BADGE_DEFINITIONS[badge.badgeType as BadgeType],
    }));
  },
});

// Get all badge definitions (for display)
export const getDefinitions = query({
  args: {},
  handler: async () => {
    return BADGE_DEFINITIONS;
  },
});

// ===== MUTATIONS =====

// Award a badge manually (admin only)
export const awardManually = mutation({
  args: {
    sessionToken: v.string(),
    userId: v.id("users"),
    badgeType: v.union(
      v.literal("early_adopter"),
      v.literal("featured_design")
    ),
    relatedCreationId: v.optional(v.id("creations")),
  },
  handler: async (ctx, args) => {
    // Verify admin session
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.sessionToken))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      throw new Error("Unauthorized");
    }

    const admin = await ctx.db.get(session.userId);
    if (!admin || admin.role !== "admin") {
      throw new Error("Forbidden: Admin access required");
    }

    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser) {
      throw new Error("User not found");
    }

    // Award the badge
    const badgeId = await awardBadge(
      ctx,
      args.userId,
      args.badgeType,
      args.relatedCreationId
    );

    if (!badgeId) {
      throw new Error("User already has this badge");
    }

    // Log manual award
    await logAuditEvent(ctx, {
      actorId: admin._id,
      actorRole: admin.role,
      actorIdentifier: admin.battleTag,
      action: "badge.manual_award",
      targetType: "badge",
      targetId: badgeId,
      targetIdentifier: args.badgeType,
      details: JSON.stringify({
        recipientId: args.userId,
        recipientTag: targetUser.battleTag,
      }),
      severity: "info",
    });

    return badgeId;
  },
});

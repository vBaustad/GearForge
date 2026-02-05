import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

// Get user by Battlenet ID
export const getByBattlenetId = query({
  args: { battlenetId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_battlenet_id", (q) => q.eq("battlenetId", args.battlenetId))
      .first();

    return user;
  },
});

// Get user by internal ID
export const getById = query({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Create or update user (upsert)
export const upsert = mutation({
  args: {
    battlenetId: v.string(),
    battleTag: v.string(),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check if user exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_battlenet_id", (q) => q.eq("battlenetId", args.battlenetId))
      .first();

    if (existingUser) {
      // Update existing user
      await ctx.db.patch(existingUser._id, {
        battleTag: args.battleTag,
        avatarUrl: args.avatarUrl,
        lastLoginAt: now,
      });
      return existingUser._id;
    } else {
      // Create new user
      const userId = await ctx.db.insert("users", {
        battlenetId: args.battlenetId,
        battleTag: args.battleTag,
        avatarUrl: args.avatarUrl,
        createdAt: now,
        lastLoginAt: now,
        role: "user",
        banned: false,
      });
      return userId;
    }
  },
});

// Get user profile with stats
export const getProfile = query({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.id);

    if (!user) {
      return null;
    }

    // Count user's creations
    const creations = await ctx.db
      .query("creations")
      .withIndex("by_creator", (q) => q.eq("creatorId", args.id))
      .filter((q) => q.eq(q.field("status"), "published"))
      .collect();

    const creationCount = creations.length;

    // Sum up all likes received
    const totalLikes = creations.reduce((sum, c) => sum + c.likeCount, 0);

    return {
      ...user,
      creationCount,
      totalLikes,
    };
  },
});

// Check if user is banned
export const isBanned = query({
  args: { battlenetId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_battlenet_id", (q) => q.eq("battlenetId", args.battlenetId))
      .first();

    return user?.banned ?? false;
  },
});

// Get detailed creator statistics
export const getCreatorStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Get all published creations
    const creations = await ctx.db
      .query("creations")
      .withIndex("by_creator", (q) => q.eq("creatorId", args.userId))
      .filter((q) => q.eq(q.field("status"), "published"))
      .collect();

    if (creations.length === 0) {
      return {
        totalDesigns: 0,
        totalLikes: 0,
        totalViews: 0,
        avgLikesPerDesign: 0,
        avgViewsPerDesign: 0,
        mostPopularDesign: null,
        categoryBreakdown: [],
      };
    }

    // Calculate totals
    const totalLikes = creations.reduce((sum, c) => sum + c.likeCount, 0);
    const totalViews = creations.reduce((sum, c) => sum + c.viewCount, 0);

    // Find most popular design
    const sortedByLikes = [...creations].sort((a, b) => b.likeCount - a.likeCount);
    const mostPopular = sortedByLikes[0];

    let mostPopularThumbnail = null;
    if (mostPopular.thumbnailId) {
      mostPopularThumbnail = await ctx.storage.getUrl(mostPopular.thumbnailId);
    } else if (mostPopular.imageIds.length > 0) {
      mostPopularThumbnail = await ctx.storage.getUrl(mostPopular.imageIds[0]);
    }

    // Category breakdown
    const categoryCount: Record<string, number> = {};
    for (const creation of creations) {
      categoryCount[creation.category] = (categoryCount[creation.category] || 0) + 1;
    }

    const categoryBreakdown = Object.entries(categoryCount)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);

    return {
      totalDesigns: creations.length,
      totalLikes,
      totalViews,
      avgLikesPerDesign: Math.round((totalLikes / creations.length) * 10) / 10,
      avgViewsPerDesign: Math.round((totalViews / creations.length) * 10) / 10,
      mostPopularDesign: {
        _id: mostPopular._id,
        title: mostPopular.title,
        likeCount: mostPopular.likeCount,
        viewCount: mostPopular.viewCount,
        thumbnailUrl: mostPopularThumbnail,
      },
      categoryBreakdown,
    };
  },
});

// Get featured/top creators
export const getFeaturedCreators = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 6;

    // Get all published creations
    const creations = await ctx.db
      .query("creations")
      .filter((q) => q.eq(q.field("status"), "published"))
      .collect();

    // Group by creator and calculate stats
    const creatorStats: Record<string, { totalLikes: number; totalViews: number; designCount: number }> = {};

    for (const creation of creations) {
      const creatorId = creation.creatorId;
      if (!creatorStats[creatorId]) {
        creatorStats[creatorId] = { totalLikes: 0, totalViews: 0, designCount: 0 };
      }
      creatorStats[creatorId].totalLikes += creation.likeCount;
      creatorStats[creatorId].totalViews += creation.viewCount;
      creatorStats[creatorId].designCount += 1;
    }

    // Score creators by engagement (likes * 2 + views / 10 + designCount * 5)
    const scoredCreators = Object.entries(creatorStats)
      .filter(([_, stats]) => stats.designCount >= 1) // Must have at least 1 design
      .map(([creatorId, stats]) => ({
        creatorId,
        score: stats.totalLikes * 2 + stats.totalViews / 10 + stats.designCount * 5,
        ...stats,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    // Get user details
    const featuredCreators = await Promise.all(
      scoredCreators.map(async ({ creatorId, totalLikes, totalViews, designCount }) => {
        const user = await ctx.db.get(creatorId as Id<"users">);
        if (!user) return null;

        return {
          _id: user._id,
          battleTag: user.battleTag,
          avatarUrl: user.avatarUrl,
          bio: user.bio,
          totalLikes,
          totalViews,
          designCount,
        };
      })
    );

    return featuredCreators.filter(Boolean);
  },
});

// Get user metadata for SEO (SSR metadata generation)
export const getMetadata = query({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.id);

    if (!user) {
      return null;
    }

    // Count user's published creations
    const creations = await ctx.db
      .query("creations")
      .withIndex("by_creator", (q) => q.eq("creatorId", args.id))
      .filter((q) => q.eq(q.field("status"), "published"))
      .collect();

    const designCount = creations.length;
    const totalLikes = creations.reduce((sum, c) => sum + c.likeCount, 0);

    return {
      battleTag: user.battleTag,
      displayName: user.battleTag.split("#")[0],
      avatarUrl: user.avatarUrl || null,
      bio: user.bio || null,
      designCount,
      totalLikes,
    };
  },
});

// Update user profile (social links, bio) - requires authenticated session
export const updateProfile = mutation({
  args: {
    sessionToken: v.string(),
    twitchUrl: v.optional(v.string()),
    youtubeUrl: v.optional(v.string()),
    bio: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { sessionToken, ...updates } = args;

    // Verify session and get current user
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", sessionToken))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      throw new Error("Unauthorized: Please log in to update your profile");
    }

    const user = await ctx.db.get(session.userId);
    if (!user || user.banned) {
      throw new Error("Unauthorized: User not found or banned");
    }

    // Clean up URLs - ensure they're valid or set to undefined
    const cleanedUpdates: {
      twitchUrl?: string;
      youtubeUrl?: string;
      bio?: string;
    } = {};

    if (updates.twitchUrl !== undefined) {
      const url = updates.twitchUrl.trim();
      if (url === "") {
        cleanedUpdates.twitchUrl = undefined;
      } else if (url.includes("twitch.tv") || url.startsWith("https://")) {
        cleanedUpdates.twitchUrl = url;
      } else {
        // Assume it's just a username
        cleanedUpdates.twitchUrl = `https://twitch.tv/${url}`;
      }
    }

    if (updates.youtubeUrl !== undefined) {
      const url = updates.youtubeUrl.trim();
      if (url === "") {
        cleanedUpdates.youtubeUrl = undefined;
      } else if (url.includes("youtube.com") || url.includes("youtu.be") || url.startsWith("https://")) {
        cleanedUpdates.youtubeUrl = url;
      } else {
        // Assume it's a channel handle
        cleanedUpdates.youtubeUrl = `https://youtube.com/@${url}`;
      }
    }

    if (updates.bio !== undefined) {
      cleanedUpdates.bio = updates.bio.trim().slice(0, 500) || undefined;
    }

    await ctx.db.patch(user._id, cleanedUpdates);
    return true;
  },
});

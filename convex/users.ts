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

// Delete user account and all associated data
export const deleteAccount = mutation({
  args: {
    sessionToken: v.string(),
    confirmBattleTag: v.string(), // Must match to confirm deletion
  },
  handler: async (ctx, args) => {
    // Verify session
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.sessionToken))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      throw new Error("Unauthorized: Please log in to delete your account");
    }

    const user = await ctx.db.get(session.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Confirm battle tag matches
    if (user.battleTag !== args.confirmBattleTag) {
      throw new Error("Battle.net tag does not match. Please enter your exact Battle.net tag to confirm deletion.");
    }

    const userId = user._id;

    // Delete all user's creations and their images
    const creations = await ctx.db
      .query("creations")
      .withIndex("by_creator", (q) => q.eq("creatorId", userId))
      .collect();

    for (const creation of creations) {
      // Delete images from storage
      for (const imageId of creation.imageIds) {
        await ctx.storage.delete(imageId);
      }
      if (creation.thumbnailId) {
        await ctx.storage.delete(creation.thumbnailId);
      }
      // Delete associated likes
      const likes = await ctx.db
        .query("likes")
        .withIndex("by_creation", (q) => q.eq("creationId", creation._id))
        .collect();
      for (const like of likes) {
        await ctx.db.delete(like._id);
      }
      // Delete associated saves
      const saves = await ctx.db
        .query("saves")
        .withIndex("by_creation", (q) => q.eq("creationId", creation._id))
        .collect();
      for (const save of saves) {
        await ctx.db.delete(save._id);
      }
      // Delete the creation
      await ctx.db.delete(creation._id);
    }

    // Delete user's likes on other creations
    const userLikes = await ctx.db
      .query("likes")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    for (const like of userLikes) {
      await ctx.db.delete(like._id);
    }

    // Delete user's saves
    const userSaves = await ctx.db
      .query("saves")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    for (const save of userSaves) {
      await ctx.db.delete(save._id);
    }

    // Delete user's follows (both following and followers)
    const following = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", userId))
      .collect();
    for (const follow of following) {
      await ctx.db.delete(follow._id);
    }
    const followers = await ctx.db
      .query("follows")
      .withIndex("by_following", (q) => q.eq("followingId", userId))
      .collect();
    for (const follow of followers) {
      await ctx.db.delete(follow._id);
    }

    // Delete user's collections and collection items
    const collections = await ctx.db
      .query("collections")
      .withIndex("by_owner", (q) => q.eq("ownerId", userId))
      .collect();
    for (const collection of collections) {
      const items = await ctx.db
        .query("collectionItems")
        .withIndex("by_collection", (q) => q.eq("collectionId", collection._id))
        .collect();
      for (const item of items) {
        await ctx.db.delete(item._id);
      }
      await ctx.db.delete(collection._id);
    }

    // Delete social connections
    const socialConnections = await ctx.db
      .query("socialConnections")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    for (const conn of socialConnections) {
      await ctx.db.delete(conn._id);
    }

    // Delete all sessions
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    for (const sess of sessions) {
      await ctx.db.delete(sess._id);
    }

    // Finally, delete the user
    await ctx.db.delete(userId);

    return { success: true };
  },
});

// Export user data
export const exportData = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    // Verify session
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.sessionToken))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      throw new Error("Unauthorized");
    }

    const user = await ctx.db.get(session.userId);
    if (!user) {
      throw new Error("User not found");
    }

    const userId = user._id;

    // Get all user's creations
    const creations = await ctx.db
      .query("creations")
      .withIndex("by_creator", (q) => q.eq("creatorId", userId))
      .collect();

    // Get social connections
    const socialConnections = await ctx.db
      .query("socialConnections")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Get collections
    const collections = await ctx.db
      .query("collections")
      .withIndex("by_owner", (q) => q.eq("ownerId", userId))
      .collect();

    return {
      user: {
        battleTag: user.battleTag,
        bio: user.bio,
        createdAt: new Date(user.createdAt).toISOString(),
        lastLoginAt: new Date(user.lastLoginAt).toISOString(),
      },
      creations: creations.map((c) => ({
        title: c.title,
        description: c.description,
        importString: c.importString,
        category: c.category,
        tags: c.tags,
        createdAt: new Date(c.createdAt).toISOString(),
        likeCount: c.likeCount,
        viewCount: c.viewCount,
      })),
      socialConnections: socialConnections.map((c) => ({
        platform: c.platform,
        platformUsername: c.platformUsername,
        channelUrl: c.channelUrl,
        connectedAt: new Date(c.connectedAt).toISOString(),
      })),
      collections: collections.map((c) => ({
        name: c.name,
        description: c.description,
        isPublic: c.isPublic,
        createdAt: new Date(c.createdAt).toISOString(),
      })),
      exportedAt: new Date().toISOString(),
    };
  },
});

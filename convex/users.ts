import { query, mutation, action, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { logAuditEvent } from "./auditLog";
import { internal } from "./_generated/api";

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

// Get featured/top creators (reads from cache for stable cache hits)
export const getFeaturedCreators = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 6;

    // Read from cached table - this only invalidates when we explicitly refresh
    const cached = await ctx.db
      .query("cachedFeaturedCreators")
      .withIndex("by_key", (q) => q.eq("key", "featured"))
      .first();

    if (cached && cached.creators.length > 0) {
      return cached.creators.slice(0, limit);
    }

    // Fallback: compute directly if cache is empty (first run)
    return await computeFeaturedCreators(ctx, limit);
  },
});

// Internal helper to compute featured creators
async function computeFeaturedCreators(ctx: any, limit: number) {
  const candidateLimit = Math.max(limit * 3, 20);

  const users = await ctx.db
    .query("users")
    .withIndex("by_total_likes")
    .order("desc")
    .take(candidateLimit);

  const scoredCreators = users
    .filter((user: any) => (user.designCount ?? 0) >= 1)
    .map((user: any) => {
      const totalLikes = user.totalLikesReceived ?? 0;
      const totalViews = user.totalViewsReceived ?? 0;
      const designCount = user.designCount ?? 0;
      const score = totalLikes * 2 + totalViews / 10 + designCount * 5;
      return { user, score, totalLikes, totalViews, designCount };
    })
    .sort((a: any, b: any) => b.score - a.score)
    .slice(0, limit);

  return scoredCreators.map(({ user, totalLikes, totalViews, designCount }: any) => ({
    _id: user._id,
    battleTag: user.battleTag,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    totalLikes,
    totalViews,
    designCount,
  }));
}

// Refresh the featured creators cache (call periodically or on-demand)
export const refreshFeaturedCreatorsCache = mutation({
  args: {},
  handler: async (ctx) => {
    const creators = await computeFeaturedCreators(ctx, 10); // Cache top 10

    const existing = await ctx.db
      .query("cachedFeaturedCreators")
      .withIndex("by_key", (q) => q.eq("key", "featured"))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        creators,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("cachedFeaturedCreators", {
        key: "featured",
        creators,
        updatedAt: Date.now(),
      });
    }

    return { updated: true, creatorCount: creators.length };
  },
});

// List users for sitemap (creators with published designs)
export const listForSitemap = query({
  args: {},
  handler: async (ctx) => {
    // Get all users who have at least one published design
    const users = await ctx.db.query("users").collect();

    const creatorsWithDesigns = [];

    for (const user of users) {
      const hasDesigns = await ctx.db
        .query("creations")
        .withIndex("by_creator", (q) => q.eq("creatorId", user._id))
        .filter((q) => q.eq(q.field("status"), "published"))
        .first();

      if (hasDesigns) {
        creatorsWithDesigns.push({
          _id: user._id,
          _creationTime: user._creationTime,
        });
      }
    }

    return creatorsWithDesigns;
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

// Tip link URL patterns for validation
const tipLinkPatterns = {
  buymeacoffee: /^(https?:\/\/)?(www\.)?buymeacoffee\.com\/[a-zA-Z0-9_.-]+\/?$/,
  kofi: /^(https?:\/\/)?(www\.)?ko-fi\.com\/[a-zA-Z0-9_]+\/?$/,
  paypal: /^(https?:\/\/)?(www\.)?paypal\.me\/[a-zA-Z0-9_.-]+\/?$/,
  patreon: /^(https?:\/\/)?(www\.)?patreon\.com\/[a-zA-Z0-9_]+\/?$/,
};

// Update user profile (social links, bio, tip links) - requires authenticated session
export const updateProfile = mutation({
  args: {
    sessionToken: v.string(),
    twitchUrl: v.optional(v.string()),
    youtubeUrl: v.optional(v.string()),
    bio: v.optional(v.string()),
    tipLinks: v.optional(v.object({
      buymeacoffee: v.optional(v.string()),
      kofi: v.optional(v.string()),
      paypal: v.optional(v.string()),
      patreon: v.optional(v.string()),
    })),
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
      tipLinks?: {
        buymeacoffee?: string;
        kofi?: string;
        paypal?: string;
        patreon?: string;
      };
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

    // Handle tip links
    if (updates.tipLinks !== undefined) {
      const tipLinks: typeof cleanedUpdates.tipLinks = {};
      let hasAnyLink = false;

      for (const [platform, url] of Object.entries(updates.tipLinks)) {
        const key = platform as keyof typeof tipLinkPatterns;
        if (url === undefined || url === null) continue;

        const trimmedUrl = url.trim();
        if (trimmedUrl === "") {
          tipLinks[key] = undefined;
        } else {
          // Validate the URL pattern
          if (!tipLinkPatterns[key]?.test(trimmedUrl)) {
            throw new Error(`Invalid ${platform} URL format`);
          }
          // Ensure URL starts with https://
          tipLinks[key] = trimmedUrl.startsWith("http") ? trimmedUrl : `https://${trimmedUrl}`;
          hasAnyLink = true;
        }
      }

      // Only set tipLinks if there's at least one valid link, otherwise set to undefined
      cleanedUpdates.tipLinks = hasAnyLink ? tipLinks : undefined;
    }

    await ctx.db.patch(user._id, cleanedUpdates);

    // Log profile update
    await logAuditEvent(ctx, {
      actorId: user._id,
      actorRole: user.role,
      actorIdentifier: user.battleTag,
      action: "user.profile_updated",
      targetType: "user",
      targetId: user._id,
      targetIdentifier: user.battleTag,
      details: JSON.stringify({
        updatedFields: Object.keys(cleanedUpdates),
      }),
      severity: "info",
    });

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

    // Log account deletion before deleting the user
    // Note: We use battleTag as identifier since user will be deleted
    await logAuditEvent(ctx, {
      actorId: user._id,
      actorRole: user.role,
      actorIdentifier: user.battleTag,
      action: "user.account_deleted",
      targetType: "user",
      targetId: user._id,
      targetIdentifier: user.battleTag,
      details: JSON.stringify({
        deletedCreationsCount: creations.length,
        deletedLikesCount: userLikes.length,
        deletedSavesCount: userSaves.length,
        deletedFollowingCount: following.length,
        deletedFollowersCount: followers.length,
        deletedCollectionsCount: collections.length,
        deletedSocialConnectionsCount: socialConnections.length,
      }),
      severity: "warning",
    });

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

// ===== CHARACTER LINKING =====

// Get user's linked character info
export const getLinkedCharacter = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.sessionToken))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      return null;
    }

    const user = await ctx.db.get(session.userId);
    if (!user) return null;

    return {
      linkedCharacter: user.linkedCharacter || null,
      completedAchievements: user.completedAchievements || [],
      completedQuests: user.completedQuests || [],
    };
  },
});

// Internal mutation to update character data
export const updateLinkedCharacterInternal = internalMutation({
  args: {
    userId: v.id("users"),
    linkedCharacter: v.object({
      region: v.union(v.literal("us"), v.literal("eu"), v.literal("kr"), v.literal("tw")),
      realmSlug: v.string(),
      realmName: v.string(),
      characterName: v.string(),
      characterLevel: v.optional(v.number()),
      lastSyncedAt: v.number(),
    }),
    completedAchievements: v.array(v.number()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      linkedCharacter: args.linkedCharacter,
      completedAchievements: args.completedAchievements,
    });
  },
});

// Internal mutation to unlink character
export const unlinkCharacterInternal = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      linkedCharacter: undefined,
      completedAchievements: undefined,
      completedQuests: undefined,
    });
  },
});

// Link a character and sync achievements
export const linkCharacter = action({
  args: {
    sessionToken: v.string(),
    region: v.union(v.literal("us"), v.literal("eu"), v.literal("kr"), v.literal("tw")),
    realmSlug: v.string(),
    characterName: v.string(),
  },
  handler: async (ctx, args): Promise<{
    success: boolean;
    character?: { name: string; realm: string; level?: number };
    achievementCount?: number;
    error?: string;
  }> => {
    // Verify session
    const session = await ctx.runQuery(internal.auth.getSessionByToken, {
      token: args.sessionToken,
    });

    if (!session || session.expiresAt < Date.now()) {
      return { success: false, error: "Unauthorized" };
    }

    // Get Blizzard credentials
    const clientId = process.env.BLIZZARD_CLIENT_ID;
    const clientSecret = process.env.BLIZZARD_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return { success: false, error: "Blizzard API not configured" };
    }

    const region = args.region;
    const namespace = `profile-${region}`;
    const locale = "en_US";

    // Get access token
    const tokenUrl = "https://oauth.battle.net/token";

    const tokenResponse = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      },
      body: "grant_type=client_credentials",
    });

    if (!tokenResponse.ok) {
      return { success: false, error: "Failed to authenticate with Blizzard" };
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // API base URL
    const apiUrl = `https://${region}.api.blizzard.com`;

    // Normalize inputs
    const realmSlug = args.realmSlug.toLowerCase().replace(/\s+/g, "-");
    const characterName = args.characterName.toLowerCase();

    // Fetch character profile to verify it exists
    const profileUrl = `${apiUrl}/profile/wow/character/${realmSlug}/${characterName}?namespace=${namespace}&locale=${locale}`;
    const profileResponse = await fetch(profileUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!profileResponse.ok) {
      if (profileResponse.status === 404) {
        return { success: false, error: "Character not found. Check realm and character name." };
      }
      return { success: false, error: `API error: ${profileResponse.status}` };
    }

    const profileData = await profileResponse.json();

    // Fetch achievements
    const achievementsUrl = `${apiUrl}/profile/wow/character/${realmSlug}/${characterName}/achievements?namespace=${namespace}&locale=${locale}`;
    const achievementsResponse = await fetch(achievementsUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    let completedAchievements: number[] = [];

    if (achievementsResponse.ok) {
      const achievementsData = await achievementsResponse.json();
      if (achievementsData.achievements) {
        completedAchievements = achievementsData.achievements
          .filter((a: any) => a.completed_timestamp)
          .map((a: any) => a.id);
      }
    }

    // Save to database
    await ctx.runMutation(internal.users.updateLinkedCharacterInternal, {
      userId: session.userId,
      linkedCharacter: {
        region: args.region,
        realmSlug,
        realmName: profileData.realm?.name || args.realmSlug,
        characterName: profileData.name || args.characterName,
        characterLevel: profileData.level,
        lastSyncedAt: Date.now(),
      },
      completedAchievements,
    });

    return {
      success: true,
      character: {
        name: profileData.name || args.characterName,
        realm: profileData.realm?.name || args.realmSlug,
        level: profileData.level,
      },
      achievementCount: completedAchievements.length,
    };
  },
});

// Refresh achievements for linked character
export const refreshCharacterAchievements = action({
  args: { sessionToken: v.string() },
  handler: async (ctx, args): Promise<{
    success: boolean;
    achievementCount?: number;
    error?: string;
  }> => {
    // Get current user and linked character
    const characterData = await ctx.runQuery(internal.users.getLinkedCharacterInternal, {
      sessionToken: args.sessionToken,
    });

    if (!characterData || !characterData.linkedCharacter) {
      return { success: false, error: "No character linked" };
    }

    const { linkedCharacter, userId } = characterData;

    // Get Blizzard credentials
    const clientId = process.env.BLIZZARD_CLIENT_ID;
    const clientSecret = process.env.BLIZZARD_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return { success: false, error: "Blizzard API not configured" };
    }

    const region = linkedCharacter.region;
    const namespace = `profile-${region}`;
    const locale = "en_US";

    // Get access token
    const tokenUrl = "https://oauth.battle.net/token";

    const tokenResponse = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      },
      body: "grant_type=client_credentials",
    });

    if (!tokenResponse.ok) {
      return { success: false, error: "Failed to authenticate with Blizzard" };
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    const apiUrl = `https://${region}.api.blizzard.com`;

    // Fetch achievements
    const achievementsUrl = `${apiUrl}/profile/wow/character/${linkedCharacter.realmSlug}/${linkedCharacter.characterName.toLowerCase()}/achievements?namespace=${namespace}&locale=${locale}`;
    const achievementsResponse = await fetch(achievementsUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!achievementsResponse.ok) {
      return { success: false, error: `API error: ${achievementsResponse.status}` };
    }

    const achievementsData = await achievementsResponse.json();
    const completedAchievements: number[] = achievementsData.achievements
      ?.filter((a: any) => a.completed_timestamp)
      .map((a: any) => a.id) || [];

    // Update database
    await ctx.runMutation(internal.users.updateLinkedCharacterInternal, {
      userId,
      linkedCharacter: {
        ...linkedCharacter,
        lastSyncedAt: Date.now(),
      },
      completedAchievements,
    });

    return {
      success: true,
      achievementCount: completedAchievements.length,
    };
  },
});

// Unlink character
export const unlinkCharacter = action({
  args: { sessionToken: v.string() },
  handler: async (ctx, args): Promise<{ success: boolean; error?: string }> => {
    const session = await ctx.runQuery(internal.auth.getSessionByToken, {
      token: args.sessionToken,
    });

    if (!session || session.expiresAt < Date.now()) {
      return { success: false, error: "Unauthorized" };
    }

    await ctx.runMutation(internal.users.unlinkCharacterInternal, {
      userId: session.userId,
    });

    return { success: true };
  },
});

// Internal query to get linked character with userId
import { internalQuery } from "./_generated/server";

export const getLinkedCharacterInternal = internalQuery({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.sessionToken))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      return null;
    }

    const user = await ctx.db.get(session.userId);
    if (!user) return null;

    return {
      userId: user._id,
      linkedCharacter: user.linkedCharacter || null,
      completedAchievements: user.completedAchievements || [],
    };
  },
});

// ===== ADMIN UTILITIES =====

// Backfill denormalized user stats (run once after migration)
export const backfillUserStats = mutation({
  args: { batchSize: v.optional(v.number()) },
  handler: async (ctx) => {
    const batchSize = 50;

    // Get users that need updating (missing any of the stats fields)
    const users = await ctx.db
      .query("users")
      .take(batchSize);

    let updated = 0;

    for (const user of users) {
      // Calculate follower count
      const followers = await ctx.db
        .query("follows")
        .withIndex("by_following", (q) => q.eq("followingId", user._id))
        .collect();

      // Calculate following count
      const following = await ctx.db
        .query("follows")
        .withIndex("by_follower", (q) => q.eq("followerId", user._id))
        .collect();

      // Calculate design count and aggregate likes/views
      const creations = await ctx.db
        .query("creations")
        .withIndex("by_creator", (q) => q.eq("creatorId", user._id))
        .filter((q) => q.eq(q.field("status"), "published"))
        .collect();

      const totalLikesReceived = creations.reduce((sum, c) => sum + c.likeCount, 0);
      const totalViewsReceived = creations.reduce((sum, c) => sum + c.viewCount, 0);
      const designCount = creations.length;

      // Only update if values are different
      const needsUpdate =
        user.followerCount !== followers.length ||
        user.followingCount !== following.length ||
        user.totalLikesReceived !== totalLikesReceived ||
        user.totalViewsReceived !== totalViewsReceived ||
        user.designCount !== designCount;

      if (needsUpdate) {
        await ctx.db.patch(user._id, {
          followerCount: followers.length,
          followingCount: following.length,
          totalLikesReceived,
          totalViewsReceived,
          designCount,
        });
        updated++;
      }
    }

    return {
      processed: users.length,
      updated,
      hasMore: users.length === batchSize,
    };
  },
});

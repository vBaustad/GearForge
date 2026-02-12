import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { enforceRateLimit } from "./rateLimit";
import { logAuditEvent } from "./auditLog";
import { createNotification } from "./notifications";
import { checkCreationBadges } from "./badges";

// Generate a hash for import string duplicate detection
// Uses first 64 chars + length to create a reasonably unique key
function generateImportHash(importString: string): string {
  const trimmed = importString.trim();
  const prefix = trimmed.slice(0, 64);
  return `${prefix}:${trimmed.length}`;
}

// List published creations with pagination
export const list = query({
  args: {
    category: v.optional(
      v.union(
        v.literal("bedroom"),
        v.literal("living_room"),
        v.literal("kitchen"),
        v.literal("garden"),
        v.literal("tavern"),
        v.literal("throne_room"),
        v.literal("workshop"),
        v.literal("library"),
        v.literal("exterior"),
        v.literal("other")
      )
    ),
    sortBy: v.optional(v.union(v.literal("newest"), v.literal("popular"))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    const sortBy = args.sortBy ?? "newest";

    let creationsQuery;

    if (args.category) {
      creationsQuery = ctx.db
        .query("creations")
        .withIndex("by_category", (q) =>
          q.eq("category", args.category!)
        );
    } else if (sortBy === "popular") {
      creationsQuery = ctx.db
        .query("creations")
        .withIndex("by_status_likes");
    } else {
      creationsQuery = ctx.db
        .query("creations")
        .withIndex("by_status_created");
    }

    const creations = await creationsQuery
      .filter((q) => q.eq(q.field("status"), "published"))
      .order("desc")
      .take(limit);

    // Fetch creator info for each creation
    const creationsWithCreators = await Promise.all(
      creations.map(async (creation) => {
        const creator = await ctx.db.get(creation.creatorId);

        // Get thumbnail URL if exists
        let thumbnailUrl = null;
        if (creation.thumbnailId) {
          thumbnailUrl = await ctx.storage.getUrl(creation.thumbnailId);
        } else if (creation.imageIds.length > 0) {
          thumbnailUrl = await ctx.storage.getUrl(creation.imageIds[0]);
        }

        return {
          ...creation,
          creatorName: creator?.battleTag ?? "Unknown",
          thumbnailUrl,
        };
      })
    );

    return creationsWithCreators;
  },
});

// List with pagination (cursor-based) - optimized version
export const listPaginated = query({
  args: {
    category: v.optional(
      v.union(
        v.literal("bedroom"),
        v.literal("living_room"),
        v.literal("kitchen"),
        v.literal("garden"),
        v.literal("tavern"),
        v.literal("throne_room"),
        v.literal("workshop"),
        v.literal("library"),
        v.literal("exterior"),
        v.literal("other")
      )
    ),
    sortBy: v.optional(v.union(v.literal("newest"), v.literal("popular"))),
    cursor: v.optional(v.string()),
    limit: v.optional(v.number()),
    searchQuery: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    const sortBy = args.sortBy ?? "newest";

    // If there's a search query, use the dedicated search endpoint
    // Search requires full-text capabilities which Convex doesn't have natively,
    // so we limit search to a reasonable subset
    if (args.searchQuery && args.searchQuery.trim()) {
      return await searchCreations(ctx, {
        query: args.searchQuery,
        category: args.category,
        limit,
        cursor: args.cursor,
      });
    }

    // Build query based on category and sort
    let creationsQuery;
    if (args.category) {
      creationsQuery = ctx.db
        .query("creations")
        .withIndex("by_category", (q) => q.eq("category", args.category!));
    } else if (sortBy === "popular") {
      creationsQuery = ctx.db
        .query("creations")
        .withIndex("by_status_likes");
    } else {
      creationsQuery = ctx.db
        .query("creations")
        .withIndex("by_status_created");
    }

    // Apply filter and get one extra to check if there are more
    let creations = await creationsQuery
      .filter((q) => q.eq(q.field("status"), "published"))
      .order("desc")
      .take(limit + 1);

    // Handle cursor-based pagination by skipping until we find the cursor
    if (args.cursor) {
      // Find the cursor creation to get its sort field value
      const cursorCreation = creations.find((c) => c._id === args.cursor);
      if (cursorCreation) {
        // Re-query starting after the cursor
        if (args.category) {
          creations = await ctx.db
            .query("creations")
            .withIndex("by_category", (q) => q.eq("category", args.category!))
            .filter((q) =>
              q.and(
                q.eq(q.field("status"), "published"),
                q.lt(q.field("createdAt"), cursorCreation.createdAt)
              )
            )
            .order("desc")
            .take(limit + 1);
        } else if (sortBy === "popular") {
          creations = await ctx.db
            .query("creations")
            .withIndex("by_status_likes")
            .filter((q) =>
              q.and(
                q.eq(q.field("status"), "published"),
                q.lte(q.field("likeCount"), cursorCreation.likeCount)
              )
            )
            .order("desc")
            .take(limit + 1);
          // Filter out the cursor item and items with same likeCount but higher/same _id
          creations = creations.filter(
            (c) =>
              c.likeCount < cursorCreation.likeCount ||
              (c.likeCount === cursorCreation.likeCount && c._id < args.cursor!)
          );
        } else {
          creations = await ctx.db
            .query("creations")
            .withIndex("by_status_created")
            .filter((q) =>
              q.and(
                q.eq(q.field("status"), "published"),
                q.lt(q.field("createdAt"), cursorCreation.createdAt)
              )
            )
            .order("desc")
            .take(limit + 1);
        }
      }
    }

    const hasMore = creations.length > limit;
    const paginatedCreations = creations.slice(0, limit);
    const nextCursor = hasMore
      ? paginatedCreations[paginatedCreations.length - 1]?._id
      : null;

    // Fetch creator info for each creation
    const creationsWithCreators = await Promise.all(
      paginatedCreations.map(async (creation) => {
        const creator = await ctx.db.get(creation.creatorId);
        let thumbnailUrl = null;
        if (creation.thumbnailId) {
          thumbnailUrl = await ctx.storage.getUrl(creation.thumbnailId);
        } else if (creation.imageIds.length > 0) {
          thumbnailUrl = await ctx.storage.getUrl(creation.imageIds[0]);
        }

        return {
          ...creation,
          creatorName: creator?.battleTag ?? "Unknown",
          thumbnailUrl,
        };
      })
    );

    return {
      items: creationsWithCreators,
      nextCursor,
      hasMore,
      totalCount: null, // No longer returning total count to avoid full scan
    };
  },
});

// Internal search helper - limited to recent creations for performance
const MAX_SEARCH_LENGTH = 100; // Prevent ReDoS attacks

async function searchCreations(
  ctx: any,
  args: {
    query: string;
    category?: string;
    limit: number;
    cursor?: string;
  }
) {
  // Sanitize and limit search input length
  const searchQuery = args.query.slice(0, MAX_SEARCH_LENGTH).toLowerCase().trim();
  const searchLimit = 200; // Limit search to recent 200 creations

  // Get recent creations to search through
  let creationsQuery = ctx.db
    .query("creations")
    .withIndex("by_status_created");

  if (args.category) {
    creationsQuery = ctx.db
      .query("creations")
      .withIndex("by_category", (q: any) => q.eq("category", args.category));
  }

  const recentCreations = await creationsQuery
    .filter((q: any) => q.eq(q.field("status"), "published"))
    .order("desc")
    .take(searchLimit);

  // Get creator names for the creations
  const creatorIds = [...new Set(recentCreations.map((c: any) => c.creatorId))];
  const creators = await Promise.all(
    creatorIds.map((id: any) => ctx.db.get(id))
  );
  const creatorMap = new Map(
    creators.filter(Boolean).map((c: any) => [c._id, c.battleTag.toLowerCase()])
  );

  // Filter by search query
  const matchedCreations = recentCreations.filter((c: any) => {
    const creatorName = creatorMap.get(c.creatorId) || "";
    return (
      c.title.toLowerCase().includes(searchQuery) ||
      c.tags.some((tag: string) => tag.toLowerCase().includes(searchQuery)) ||
      creatorName.includes(searchQuery)
    );
  });

  // Handle cursor
  let startIndex = 0;
  if (args.cursor) {
    const cursorIndex = matchedCreations.findIndex((c: any) => c._id === args.cursor);
    if (cursorIndex !== -1) {
      startIndex = cursorIndex + 1;
    }
  }

  const paginatedCreations = matchedCreations.slice(startIndex, startIndex + args.limit);
  const hasMore = startIndex + args.limit < matchedCreations.length;
  const nextCursor = hasMore
    ? paginatedCreations[paginatedCreations.length - 1]?._id
    : null;

  // Fetch thumbnails
  const creationsWithCreators = await Promise.all(
    paginatedCreations.map(async (creation: any) => {
      const creator = await ctx.db.get(creation.creatorId);
      let thumbnailUrl = null;
      if (creation.thumbnailId) {
        thumbnailUrl = await ctx.storage.getUrl(creation.thumbnailId);
      } else if (creation.imageIds.length > 0) {
        thumbnailUrl = await ctx.storage.getUrl(creation.imageIds[0]);
      }

      return {
        ...creation,
        creatorName: creator?.battleTag ?? "Unknown",
        thumbnailUrl,
      };
    })
  );

  return {
    items: creationsWithCreators,
    nextCursor,
    hasMore,
    totalCount: null,
  };
}

// List creations from creators the user follows - optimized version
export const listFollowingFeed = query({
  args: {
    sessionToken: v.string(),
    cursor: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    // Verify session and get current user
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.sessionToken))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      return { items: [], nextCursor: null, hasMore: false };
    }

    // Get all users this person follows
    const follows = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", session.userId))
      .collect();

    if (follows.length === 0) {
      return { items: [], nextCursor: null, hasMore: false };
    }

    const followingIds = follows.map((f) => f.followingId);

    // Get cursor creation for pagination
    let cursorCreatedAt = Number.MAX_SAFE_INTEGER;
    if (args.cursor) {
      const cursorCreation = await ctx.db.get(args.cursor as Id<"creations">);
      if (cursorCreation) {
        cursorCreatedAt = cursorCreation.createdAt;
      }
    }

    // Query each followed creator's recent creations and merge
    // This is more efficient than loading all creations when following < 100 users
    const creationsByCreator = await Promise.all(
      followingIds.slice(0, 50).map(async (creatorId) => {
        return ctx.db
          .query("creations")
          .withIndex("by_creator", (q) => q.eq("creatorId", creatorId))
          .filter((q) =>
            q.and(
              q.eq(q.field("status"), "published"),
              q.lt(q.field("createdAt"), cursorCreatedAt)
            )
          )
          .order("desc")
          .take(limit); // Get limit per creator, then merge
      })
    );

    // Flatten, sort by createdAt, and take limit + 1
    const allCreations = creationsByCreator
      .flat()
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit + 1);

    const hasMore = allCreations.length > limit;
    const paginatedCreations = allCreations.slice(0, limit);
    const nextCursor = hasMore
      ? paginatedCreations[paginatedCreations.length - 1]?._id
      : null;

    // Fetch creator info for each creation
    const creationsWithCreators = await Promise.all(
      paginatedCreations.map(async (creation) => {
        const creator = await ctx.db.get(creation.creatorId);
        let thumbnailUrl = null;
        if (creation.thumbnailId) {
          thumbnailUrl = await ctx.storage.getUrl(creation.thumbnailId);
        } else if (creation.imageIds.length > 0) {
          thumbnailUrl = await ctx.storage.getUrl(creation.imageIds[0]);
        }

        return {
          ...creation,
          creatorName: creator?.battleTag ?? "Unknown",
          thumbnailUrl,
        };
      })
    );

    return {
      items: creationsWithCreators,
      nextCursor,
      hasMore,
    };
  },
});

// Get a single creation by ID
export const getById = query({
  args: { id: v.id("creations") },
  handler: async (ctx, args) => {
    const creation = await ctx.db.get(args.id);

    if (!creation || creation.status === "deleted") {
      return null;
    }

    const creator = await ctx.db.get(creation.creatorId);

    // Get all image URLs
    const imageUrls = await Promise.all(
      creation.imageIds.map((id) => ctx.storage.getUrl(id))
    );

    // Enrich items with decor data
    const enrichedItems = await Promise.all(
      (creation.items || []).map(async (item) => {
        const decorItem = await ctx.db
          .query("decorItems")
          .withIndex("by_blizzard_id", (q) => q.eq("blizzardId", item.decorId))
          .first();

        return {
          decorId: item.decorId,
          quantity: item.quantity,
          name: decorItem?.name ?? `Item #${item.decorId}`,
          iconUrl: decorItem?.iconUrl,
          category: decorItem?.category,
          subcategory: decorItem?.subcategory,
          wowItemId: decorItem?.wowItemId,
          source: decorItem?.source,
          sourceDetails: decorItem?.sourceDetails,
          // Vendor info
          vendorName: decorItem?.vendorName,
          vendorLocation: decorItem?.vendorLocation,
          // Cost info
          goldCost: decorItem?.goldCost,
          currencyType: decorItem?.currencyType,
          currencyCost: decorItem?.currencyCost,
          // Achievement requirement
          achievementId: decorItem?.achievementId,
          achievementName: decorItem?.achievementName,
          // Profession crafting
          professionName: decorItem?.professionName,
          professionSkillRequired: decorItem?.professionSkillRequired,
          // Quest info
          questId: decorItem?.questId,
          questName: decorItem?.questName,
          // Reputation requirement
          reputationFaction: decorItem?.reputationFaction,
          reputationStanding: decorItem?.reputationStanding,
          // Placement
          interiorOnly: decorItem?.interiorOnly,
          budgetCost: decorItem?.budgetCost,
        };
      })
    );

    // Calculate item statistics
    const totalItems = enrichedItems.reduce((sum, item) => sum + item.quantity, 0);
    const uniqueItems = enrichedItems.length;

    // Group items by category for display
    const itemsByCategory: Record<string, typeof enrichedItems> = {};
    for (const item of enrichedItems) {
      const cat = item.category || "Uncategorized";
      if (!itemsByCategory[cat]) {
        itemsByCategory[cat] = [];
      }
      itemsByCategory[cat].push(item);
    }

    // Aggregate build costs
    let totalGoldCost = 0;
    let totalBudgetCost = 0;
    const currencyCosts: Record<string, number> = {};
    const requiredAchievements: Array<{ id?: number; name: string }> = [];
    const requiredQuests: Array<{ id?: number; name: string }> = [];
    const requiredProfessions: Array<{ name: string; skill?: number }> = [];
    const requiredReputations: Array<{ faction: string; standing: string }> = [];
    const achievementsSeen = new Set<string>();
    const questsSeen = new Set<string>();
    const professionsSeen = new Set<string>();
    const reputationsSeen = new Set<string>();

    for (const item of enrichedItems) {
      // Sum gold costs (multiply by quantity)
      if (item.goldCost) {
        totalGoldCost += item.goldCost * item.quantity;
      }
      // Sum budget costs
      if (item.budgetCost) {
        totalBudgetCost += item.budgetCost * item.quantity;
      }
      // Sum currency costs
      if (item.currencyType && item.currencyCost) {
        currencyCosts[item.currencyType] = (currencyCosts[item.currencyType] || 0) + (item.currencyCost * item.quantity);
      }
      // Collect unique achievements
      if (item.achievementName && !achievementsSeen.has(item.achievementName)) {
        achievementsSeen.add(item.achievementName);
        requiredAchievements.push({ id: item.achievementId, name: item.achievementName });
      }
      // Collect unique quests
      if (item.questName && !questsSeen.has(item.questName)) {
        questsSeen.add(item.questName);
        requiredQuests.push({ id: item.questId, name: item.questName });
      }
      // Collect unique professions
      if (item.professionName && !professionsSeen.has(item.professionName)) {
        professionsSeen.add(item.professionName);
        requiredProfessions.push({ name: item.professionName, skill: item.professionSkillRequired });
      }
      // Collect unique reputation requirements
      if (item.reputationFaction && !reputationsSeen.has(item.reputationFaction)) {
        reputationsSeen.add(item.reputationFaction);
        requiredReputations.push({ faction: item.reputationFaction, standing: item.reputationStanding || "Friendly" });
      }
    }

    const buildCosts = {
      totalGoldCost,
      totalBudgetCost,
      currencyCosts,
      requiredAchievements,
      requiredQuests,
      requiredProfessions,
      requiredReputations,
    };

    // Get inspired-by (original) design info if this is a remix
    let inspiredByInfo = null;
    if (creation.inspiredById) {
      const originalDesign = await ctx.db.get(creation.inspiredById);
      if (originalDesign && originalDesign.status === "published") {
        const originalCreator = await ctx.db.get(originalDesign.creatorId);
        let originalThumbnail = null;
        if (originalDesign.thumbnailId) {
          originalThumbnail = await ctx.storage.getUrl(originalDesign.thumbnailId);
        } else if (originalDesign.imageIds.length > 0) {
          originalThumbnail = await ctx.storage.getUrl(originalDesign.imageIds[0]);
        }
        inspiredByInfo = {
          _id: originalDesign._id,
          title: originalDesign.title,
          creatorName: originalCreator?.battleTag ?? "Unknown",
          creatorId: originalDesign.creatorId,
          thumbnailUrl: originalThumbnail,
        };
      }
    }

    return {
      ...creation,
      creatorName: creator?.battleTag ?? "Unknown",
      creatorAvatarUrl: creator?.avatarUrl,
      creatorIsVerified: creator?.isVerified ?? false,
      creatorId: creator?._id,
      imageUrls: imageUrls.filter(Boolean) as string[],
      // Enhanced item data
      enrichedItems,
      itemsByCategory,
      totalItems,
      uniqueItems,
      buildCosts,
      // Remix info
      inspiredByInfo,
      remixCount: creation.remixCount ?? 0,
    };
  },
});

// Get creations by a specific user
export const getByCreator = query({
  args: { creatorId: v.id("users") },
  handler: async (ctx, args) => {
    const creations = await ctx.db
      .query("creations")
      .withIndex("by_creator", (q) => q.eq("creatorId", args.creatorId))
      .filter((q) => q.neq(q.field("status"), "deleted"))
      .order("desc")
      .collect();

    const creationsWithThumbnails = await Promise.all(
      creations.map(async (creation) => {
        let thumbnailUrl = null;
        if (creation.thumbnailId) {
          thumbnailUrl = await ctx.storage.getUrl(creation.thumbnailId);
        } else if (creation.imageIds.length > 0) {
          thumbnailUrl = await ctx.storage.getUrl(creation.imageIds[0]);
        }
        return { ...creation, thumbnailUrl };
      })
    );

    return creationsWithThumbnails;
  },
});

// Get remixes/designs inspired by a specific design
export const getRemixes = query({
  args: {
    creationId: v.id("creations"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;

    const remixes = await ctx.db
      .query("creations")
      .withIndex("by_inspired_by", (q) => q.eq("inspiredById", args.creationId))
      .filter((q) => q.eq(q.field("status"), "published"))
      .order("desc")
      .take(limit);

    const remixesWithCreators = await Promise.all(
      remixes.map(async (remix) => {
        const creator = await ctx.db.get(remix.creatorId);
        let thumbnailUrl = null;
        if (remix.thumbnailId) {
          thumbnailUrl = await ctx.storage.getUrl(remix.thumbnailId);
        } else if (remix.imageIds.length > 0) {
          thumbnailUrl = await ctx.storage.getUrl(remix.imageIds[0]);
        }
        return {
          ...remix,
          creatorName: creator?.battleTag ?? "Unknown",
          thumbnailUrl,
        };
      })
    );

    return remixesWithCreators;
  },
});

// Create a new creation (requires authenticated session)
export const create = mutation({
  args: {
    sessionToken: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    importString: v.string(),
    imageIds: v.array(v.id("_storage")),
    category: v.union(
      v.literal("bedroom"),
      v.literal("living_room"),
      v.literal("kitchen"),
      v.literal("garden"),
      v.literal("tavern"),
      v.literal("throne_room"),
      v.literal("workshop"),
      v.literal("library"),
      v.literal("exterior"),
      v.literal("other")
    ),
    tags: v.array(v.string()),
    items: v.array(
      v.object({
        decorId: v.number(),
        quantity: v.number(),
      })
    ),
    youtubeVideoId: v.optional(v.string()),
    inspiredById: v.optional(v.id("creations")),
  },
  handler: async (ctx, args) => {
    // Verify session and get current user
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.sessionToken))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      throw new Error("Unauthorized: Please log in to upload designs");
    }

    const user = await ctx.db.get(session.userId);
    if (!user || user.banned) {
      throw new Error("Unauthorized: User not found or banned");
    }

    // Rate limit: 10 uploads per hour
    await enforceRateLimit(ctx, user._id, "create_design");

    // Validate uploaded images
    if (args.imageIds.length === 0) {
      throw new Error("At least one image is required");
    }
    if (args.imageIds.length > 10) {
      throw new Error("Maximum 10 images allowed");
    }

    // Verify all image IDs are valid storage references and check file sizes
    const maxFileSizeBytes = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];

    for (const imageId of args.imageIds) {
      const metadata = await ctx.storage.getMetadata(imageId);
      if (!metadata) {
        throw new Error("Invalid image reference - file not found");
      }

      // Check file size
      if (metadata.size > maxFileSizeBytes) {
        throw new Error(
          `Image exceeds maximum size of 10MB (${(metadata.size / 1024 / 1024).toFixed(1)}MB)`
        );
      }

      // Check content type
      if (!metadata.contentType || !allowedTypes.includes(metadata.contentType)) {
        throw new Error(
          `Invalid image type: ${metadata.contentType || "unknown"}. Only JPG, PNG, GIF, and WebP are allowed.`
        );
      }
    }

    const now = Date.now();

    // If this is inspired by another design, validate it exists
    if (args.inspiredById) {
      const originalDesign = await ctx.db.get(args.inspiredById);
      if (!originalDesign || originalDesign.status !== "published") {
        throw new Error("Original design not found");
      }
    }

    const creationId = await ctx.db.insert("creations", {
      title: args.title,
      description: args.description,
      importString: args.importString,
      importStringHash: generateImportHash(args.importString),
      imageIds: args.imageIds,
      thumbnailId: args.imageIds[0] ?? undefined,
      category: args.category,
      tags: args.tags,
      items: args.items,
      youtubeVideoId: args.youtubeVideoId,
      inspiredById: args.inspiredById,
      creatorId: user._id, // Derived from session, not client input
      createdAt: now,
      updatedAt: now,
      likeCount: 0,
      viewCount: 0,
      status: "published",
    });

    // Update remix count on original design
    if (args.inspiredById) {
      const originalDesign = await ctx.db.get(args.inspiredById);
      if (originalDesign) {
        await ctx.db.patch(args.inspiredById, {
          remixCount: (originalDesign.remixCount ?? 0) + 1,
        });
      }
    }

    // Log creation
    await logAuditEvent(ctx, {
      actorId: user._id,
      actorRole: user.role,
      actorIdentifier: user.battleTag,
      action: "content.created",
      targetType: "creation",
      targetId: creationId,
      targetIdentifier: args.title,
      severity: "info",
    });

    // Notify followers about the new design
    const followers = await ctx.db
      .query("follows")
      .withIndex("by_following", (q) => q.eq("followingId", user._id))
      .collect();

    // Limit to first 100 followers to avoid timeouts
    for (const follow of followers.slice(0, 100)) {
      await createNotification(ctx, {
        recipientId: follow.followerId,
        type: "new_design",
        actorId: user._id,
        creationId: creationId,
      });
    }

    // Check for creation-related badges
    await checkCreationBadges(ctx, user._id);

    // Update user's design count
    await ctx.db.patch(user._id, {
      designCount: (user.designCount ?? 0) + 1,
    });

    // Update platform stats
    const existingStats = await ctx.db
      .query("platformStats")
      .withIndex("by_key", (q) => q.eq("key", "global"))
      .first();

    // Check if this is a new creator (first design)
    const isNewCreator = (user.designCount ?? 0) === 0;

    if (existingStats) {
      await ctx.db.patch(existingStats._id, {
        designCount: existingStats.designCount + 1,
        creatorCount: existingStats.creatorCount + (isNewCreator ? 1 : 0),
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("platformStats", {
        key: "global",
        designCount: 1,
        creatorCount: 1,
        totalViews: 0,
        updatedAt: Date.now(),
      });
    }

    return creationId;
  },
});

// Update a creation (by owner or admin/moderator only)
export const update = mutation({
  args: {
    id: v.id("creations"),
    sessionToken: v.string(),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    importString: v.optional(v.string()),
    imageIds: v.optional(v.array(v.id("_storage"))),
    category: v.optional(
      v.union(
        v.literal("bedroom"),
        v.literal("living_room"),
        v.literal("kitchen"),
        v.literal("garden"),
        v.literal("tavern"),
        v.literal("throne_room"),
        v.literal("workshop"),
        v.literal("library"),
        v.literal("exterior"),
        v.literal("other")
      )
    ),
    tags: v.optional(v.array(v.string())),
    items: v.optional(
      v.array(
        v.object({
          decorId: v.number(),
          quantity: v.number(),
        })
      )
    ),
    youtubeVideoId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, sessionToken, ...updates } = args;

    // Verify session and get current user
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", sessionToken))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      throw new Error("Unauthorized: Invalid or expired session");
    }

    const user = await ctx.db.get(session.userId);
    if (!user || user.banned) {
      throw new Error("Unauthorized: User not found or banned");
    }

    const creation = await ctx.db.get(id);
    if (!creation) {
      throw new Error("Creation not found");
    }

    // Check ownership or admin/moderator role
    const isOwner = creation.creatorId === user._id;
    const isPrivileged = user.role === "admin" || user.role === "moderator";

    if (!isOwner && !isPrivileged) {
      throw new Error("Forbidden: You can only edit your own designs");
    }

    // Rate limit: 30 updates per hour
    await enforceRateLimit(ctx, user._id, "update_design");

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {
      updatedAt: Date.now(),
    };

    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.importString !== undefined) updateData.importString = updates.importString;
    if (updates.imageIds !== undefined) {
      // Validate new images
      if (updates.imageIds.length === 0) {
        throw new Error("At least one image is required");
      }
      if (updates.imageIds.length > 10) {
        throw new Error("Maximum 10 images allowed");
      }

      const maxFileSizeBytes = 10 * 1024 * 1024; // 10MB
      const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];

      for (const imageId of updates.imageIds) {
        const metadata = await ctx.storage.getMetadata(imageId);
        if (!metadata) {
          throw new Error("Invalid image reference - file not found");
        }
        if (metadata.size > maxFileSizeBytes) {
          throw new Error(
            `Image exceeds maximum size of 10MB (${(metadata.size / 1024 / 1024).toFixed(1)}MB)`
          );
        }
        if (!metadata.contentType || !allowedTypes.includes(metadata.contentType)) {
          throw new Error(
            `Invalid image type: ${metadata.contentType || "unknown"}. Only JPG, PNG, GIF, and WebP are allowed.`
          );
        }
      }

      updateData.imageIds = updates.imageIds;
      updateData.thumbnailId = updates.imageIds[0] ?? undefined;
    }
    if (updates.category !== undefined) updateData.category = updates.category;
    if (updates.tags !== undefined) updateData.tags = updates.tags;
    if (updates.items !== undefined) updateData.items = updates.items;
    if (updates.youtubeVideoId !== undefined) updateData.youtubeVideoId = updates.youtubeVideoId;

    await ctx.db.patch(id, updateData);

    // Log update
    await logAuditEvent(ctx, {
      actorId: user._id,
      actorRole: user.role,
      actorIdentifier: user.battleTag,
      action: "content.updated",
      targetType: "creation",
      targetId: id,
      targetIdentifier: creation.title,
      details: JSON.stringify({ updatedFields: Object.keys(updates).filter(k => updates[k as keyof typeof updates] !== undefined) }),
      severity: "info",
    });

    return id;
  },
});

// Delete a creation (soft delete, by owner or admin/moderator only)
export const remove = mutation({
  args: {
    id: v.id("creations"),
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify session and get current user
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.sessionToken))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      throw new Error("Unauthorized: Invalid or expired session");
    }

    const user = await ctx.db.get(session.userId);
    if (!user || user.banned) {
      throw new Error("Unauthorized: User not found or banned");
    }

    const creation = await ctx.db.get(args.id);
    if (!creation) {
      throw new Error("Creation not found");
    }

    // Check ownership or admin/moderator role
    const isOwner = creation.creatorId === user._id;
    const isPrivileged = user.role === "admin" || user.role === "moderator";

    if (!isOwner && !isPrivileged) {
      throw new Error("Forbidden: You can only delete your own designs");
    }

    await ctx.db.patch(args.id, { status: "deleted" });

    // Log deletion
    await logAuditEvent(ctx, {
      actorId: user._id,
      actorRole: user.role,
      actorIdentifier: user.battleTag,
      action: "content.deleted",
      targetType: "creation",
      targetId: args.id,
      targetIdentifier: creation.title,
      severity: isOwner ? "info" : "warning",
    });
  },
});

// Get trending designs (time-decayed popularity algorithm)
export const getTrending = query({
  args: {
    limit: v.optional(v.number()),
    timeWindowDays: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;
    const timeWindowDays = args.timeWindowDays ?? 7; // Default to last 7 days
    const now = Date.now();
    const timeWindowMs = timeWindowDays * 24 * 60 * 60 * 1000;

    // Get all published creations from the time window
    const creations = await ctx.db
      .query("creations")
      .withIndex("by_status_created")
      .filter((q) =>
        q.and(
          q.eq(q.field("status"), "published"),
          q.gte(q.field("createdAt"), now - timeWindowMs)
        )
      )
      .order("desc")
      .collect();

    // Calculate trending score: likes * 3 + views, with time decay
    const scoredCreations = creations.map((creation) => {
      const ageHours = (now - creation.createdAt) / (1000 * 60 * 60);
      const decayFactor = Math.pow(0.95, ageHours / 24); // Decay by ~5% per day
      const engagementScore = creation.likeCount * 3 + creation.viewCount;
      const trendingScore = engagementScore * decayFactor;

      return { creation, trendingScore };
    });

    // Sort by trending score and take top N
    scoredCreations.sort((a, b) => b.trendingScore - a.trendingScore);
    const topCreations = scoredCreations.slice(0, limit);

    // Fetch creator info and thumbnails
    const creationsWithDetails = await Promise.all(
      topCreations.map(async ({ creation }) => {
        const creator = await ctx.db.get(creation.creatorId);
        let thumbnailUrl = null;
        if (creation.thumbnailId) {
          thumbnailUrl = await ctx.storage.getUrl(creation.thumbnailId);
        } else if (creation.imageIds.length > 0) {
          thumbnailUrl = await ctx.storage.getUrl(creation.imageIds[0]);
        }

        return {
          ...creation,
          creatorName: creator?.battleTag ?? "Unknown",
          thumbnailUrl,
        };
      })
    );

    return creationsWithDetails;
  },
});

// Get featured design (top performing design this week)
export const getFeatured = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;

    // Get creations from the past week
    const recentCreations = await ctx.db
      .query("creations")
      .withIndex("by_status_created")
      .filter((q) =>
        q.and(
          q.eq(q.field("status"), "published"),
          q.gte(q.field("createdAt"), weekAgo)
        )
      )
      .collect();

    if (recentCreations.length === 0) {
      // Fall back to all-time best if no recent creations
      const allCreations = await ctx.db
        .query("creations")
        .withIndex("by_status_likes")
        .filter((q) => q.eq(q.field("status"), "published"))
        .order("desc")
        .take(1);

      if (allCreations.length === 0) return null;

      const creation = allCreations[0];
      const creator = await ctx.db.get(creation.creatorId);
      let thumbnailUrl = null;
      if (creation.thumbnailId) {
        thumbnailUrl = await ctx.storage.getUrl(creation.thumbnailId);
      } else if (creation.imageIds.length > 0) {
        thumbnailUrl = await ctx.storage.getUrl(creation.imageIds[0]);
      }

      return {
        ...creation,
        creatorName: creator?.battleTag ?? "Unknown",
        thumbnailUrl,
      };
    }

    // Find the best performing one (weighted score)
    let best = recentCreations[0];
    let bestScore = best.likeCount * 3 + best.viewCount;

    for (const creation of recentCreations) {
      const score = creation.likeCount * 3 + creation.viewCount;
      if (score > bestScore) {
        best = creation;
        bestScore = score;
      }
    }

    const creator = await ctx.db.get(best.creatorId);
    let thumbnailUrl = null;
    if (best.thumbnailId) {
      thumbnailUrl = await ctx.storage.getUrl(best.thumbnailId);
    } else if (best.imageIds.length > 0) {
      thumbnailUrl = await ctx.storage.getUrl(best.imageIds[0]);
    }

    return {
      ...best,
      creatorName: creator?.battleTag ?? "Unknown",
      thumbnailUrl,
    };
  },
});

// Increment view count
export const incrementViews = mutation({
  args: { id: v.id("creations") },
  handler: async (ctx, args) => {
    const creation = await ctx.db.get(args.id);
    if (creation) {
      await ctx.db.patch(args.id, { viewCount: creation.viewCount + 1 });

      // Update creator's total views
      const creator = await ctx.db.get(creation.creatorId);
      if (creator) {
        await ctx.db.patch(creation.creatorId, {
          totalViewsReceived: (creator.totalViewsReceived ?? 0) + 1,
        });
      }

      // Update platform stats (batch this in production for high-traffic)
      const stats = await ctx.db
        .query("platformStats")
        .withIndex("by_key", (q) => q.eq("key", "global"))
        .first();
      if (stats) {
        await ctx.db.patch(stats._id, {
          totalViews: stats.totalViews + 1,
          updatedAt: Date.now(),
        });
      }
    }
  },
});

// Generate upload URL for images (requires authenticated session)
export const generateUploadUrl = mutation({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    // Require valid session to prevent unauthenticated abuse
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.sessionToken))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      throw new Error("Authentication required to upload images");
    }

    const user = await ctx.db.get(session.userId);
    if (!user) {
      throw new Error("User not found");
    }
    if (user.banned) {
      throw new Error("Your account has been suspended");
    }

    // Rate limit: 20 image uploads per hour
    await enforceRateLimit(ctx, user._id, "upload_image");

    return await ctx.storage.generateUploadUrl();
  },
});

// Get public URLs for storage IDs (for moderation)
export const getStorageUrls = query({
  args: {
    storageIds: v.array(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const urls: (string | null)[] = [];
    for (const id of args.storageIds) {
      const url = await ctx.storage.getUrl(id);
      urls.push(url);
    }
    return urls;
  },
});

// Check if an import string already exists (duplicate detection)
// Check if an import string already exists (uses indexed hash lookup)
export const checkDuplicate = query({
  args: { importString: v.string() },
  handler: async (ctx, args) => {
    const trimmed = args.importString.trim();
    if (!trimmed) return null;

    const hash = generateImportHash(trimmed);

    // Use index lookup instead of full table scan
    const candidates = await ctx.db
      .query("creations")
      .withIndex("by_import_hash", (q) => q.eq("importStringHash", hash))
      .filter((q) => q.eq(q.field("status"), "published"))
      .take(10); // Hash collisions are rare, take a few to verify

    // Verify exact match (in case of hash collision)
    const match = candidates.find((c) => c.importString.trim() === trimmed);

    if (!match) return null;

    // Get creator info and thumbnail
    const creator = await ctx.db.get(match.creatorId);
    let thumbnailUrl = null;
    if (match.thumbnailId) {
      thumbnailUrl = await ctx.storage.getUrl(match.thumbnailId);
    } else if (match.imageIds.length > 0) {
      thumbnailUrl = await ctx.storage.getUrl(match.imageIds[0]);
    }

    return {
      _id: match._id,
      title: match.title,
      category: match.category,
      creatorName: creator?.battleTag.split("#")[0] ?? "Unknown",
      thumbnailUrl,
      createdAt: match.createdAt,
    };
  },
});

// Get platform stats for display (uses cached aggregation)
export const getStats = query({
  args: {},
  handler: async (ctx) => {
    // Try to get cached stats first
    const cachedStats = await ctx.db
      .query("platformStats")
      .withIndex("by_key", (q) => q.eq("key", "global"))
      .first();

    if (cachedStats) {
      return {
        designCount: cachedStats.designCount,
        creatorCount: cachedStats.creatorCount,
        importCount: cachedStats.totalViews,
      };
    }

    // Fallback: return zeros (stats will be populated by scheduled job or mutation)
    return {
      designCount: 0,
      creatorCount: 0,
      importCount: 0,
    };
  },
});

// Update platform stats (call this when designs are created/deleted or views increment)
export const updatePlatformStats = mutation({
  args: {
    designCountDelta: v.optional(v.number()),
    creatorCountDelta: v.optional(v.number()),
    viewsDelta: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("platformStats")
      .withIndex("by_key", (q) => q.eq("key", "global"))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        designCount: existing.designCount + (args.designCountDelta ?? 0),
        creatorCount: existing.creatorCount + (args.creatorCountDelta ?? 0),
        totalViews: existing.totalViews + (args.viewsDelta ?? 0),
        updatedAt: Date.now(),
      });
    } else {
      // Initialize stats - this should only happen once
      await ctx.db.insert("platformStats", {
        key: "global",
        designCount: args.designCountDelta ?? 0,
        creatorCount: args.creatorCountDelta ?? 0,
        totalViews: args.viewsDelta ?? 0,
        updatedAt: Date.now(),
      });
    }
  },
});

// Recalculate platform stats from scratch (admin utility)
export const recalculatePlatformStats = mutation({
  args: {},
  handler: async (ctx) => {
    // Get all published creations
    const creations = await ctx.db
      .query("creations")
      .filter((q) => q.eq(q.field("status"), "published"))
      .collect();

    const uniqueCreators = new Set(creations.map((c) => c.creatorId));
    const totalViews = creations.reduce((sum, c) => sum + c.viewCount, 0);

    const existing = await ctx.db
      .query("platformStats")
      .withIndex("by_key", (q) => q.eq("key", "global"))
      .first();

    const stats = {
      key: "global" as const,
      designCount: creations.length,
      creatorCount: uniqueCreators.size,
      totalViews,
      updatedAt: Date.now(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, stats);
    } else {
      await ctx.db.insert("platformStats", stats);
    }

    return stats;
  },
});

// Backfill import string hashes for existing creations (admin utility)
export const backfillImportHashes = mutation({
  args: { batchSize: v.optional(v.number()) },
  handler: async (ctx) => {
    const batchSize = 100;

    // Get creations without import hash
    const creations = await ctx.db
      .query("creations")
      .filter((q) => q.eq(q.field("importStringHash"), undefined))
      .take(batchSize);

    let updated = 0;
    for (const creation of creations) {
      await ctx.db.patch(creation._id, {
        importStringHash: generateImportHash(creation.importString),
      });
      updated++;
    }

    return {
      updated,
      hasMore: creations.length === batchSize,
    };
  },
});

// Get related designs (same category or same creator)
export const getRelated = query({
  args: {
    creationId: v.id("creations"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 4;
    const creation = await ctx.db.get(args.creationId);

    if (!creation) return [];

    // Get designs from same category
    const sameCategory = await ctx.db
      .query("creations")
      .withIndex("by_category", (q) => q.eq("category", creation.category))
      .filter((q) =>
        q.and(
          q.eq(q.field("status"), "published"),
          q.neq(q.field("_id"), args.creationId)
        )
      )
      .order("desc")
      .take(limit * 2);

    // Get designs from same creator
    const sameCreator = await ctx.db
      .query("creations")
      .withIndex("by_creator", (q) => q.eq("creatorId", creation.creatorId))
      .filter((q) =>
        q.and(
          q.eq(q.field("status"), "published"),
          q.neq(q.field("_id"), args.creationId)
        )
      )
      .order("desc")
      .take(limit);

    // Merge and dedupe, prioritizing creator's other work
    const seen = new Set<string>();
    const related = [...sameCreator, ...sameCategory].filter((c) => {
      if (seen.has(c._id)) return false;
      seen.add(c._id);
      return true;
    }).slice(0, limit);

    // Get details
    return Promise.all(
      related.map(async (c) => {
        const creator = await ctx.db.get(c.creatorId);
        let thumbnailUrl = null;
        if (c.thumbnailId) {
          thumbnailUrl = await ctx.storage.getUrl(c.thumbnailId);
        } else if (c.imageIds.length > 0) {
          thumbnailUrl = await ctx.storage.getUrl(c.imageIds[0]);
        }

        return {
          _id: c._id,
          title: c.title,
          category: c.category,
          thumbnailUrl,
          creatorName: creator?.battleTag.split("#")[0] ?? "Unknown",
          likeCount: c.likeCount,
        };
      })
    );
  },
});

// Get all design IDs for sitemap generation
export const listForSitemap = query({
  args: {},
  handler: async (ctx) => {
    const creations = await ctx.db
      .query("creations")
      .filter((q) => q.eq(q.field("status"), "published"))
      .order("desc")
      .take(1000); // Limit to 1000 most recent for sitemap

    return creations.map((c) => ({
      _id: c._id,
      _creationTime: c._creationTime,
    }));
  },
});

// Get basic metadata for a design (for SSR metadata generation)
export const getMetadata = query({
  args: { id: v.id("creations") },
  handler: async (ctx, args) => {
    const creation = await ctx.db.get(args.id);

    if (!creation || creation.status === "deleted") {
      return null;
    }

    const creator = await ctx.db.get(creation.creatorId);

    // Get thumbnail URL
    let thumbnailUrl = null;
    if (creation.thumbnailId) {
      thumbnailUrl = await ctx.storage.getUrl(creation.thumbnailId);
    } else if (creation.imageIds.length > 0) {
      thumbnailUrl = await ctx.storage.getUrl(creation.imageIds[0]);
    }

    return {
      title: creation.title,
      description: creation.description || null,
      category: creation.category,
      tags: creation.tags,
      creatorName: creator?.battleTag.split("#")[0] ?? "Unknown",
      thumbnailUrl,
      likeCount: creation.likeCount,
      viewCount: creation.viewCount,
    };
  },
});

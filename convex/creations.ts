import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { enforceRateLimit } from "./rateLimit";

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

// List with pagination (cursor-based)
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

    // Get all matching creations first
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

    let allCreations = await creationsQuery
      .filter((q) => q.eq(q.field("status"), "published"))
      .order("desc")
      .collect();

    // Apply text search filter if provided (search title, tags, and creator name)
    if (args.searchQuery && args.searchQuery.trim()) {
      const query = args.searchQuery.toLowerCase().trim();

      // Get all unique creator IDs
      const creatorIds = [...new Set(allCreations.map((c) => c.creatorId))];
      const creators = await Promise.all(
        creatorIds.map((id) => ctx.db.get(id))
      );
      const creatorMap = new Map(
        creators.filter(Boolean).map((c) => [c!._id, c!.battleTag.toLowerCase()])
      );

      allCreations = allCreations.filter((c) => {
        const creatorName = creatorMap.get(c.creatorId) || "";
        return (
          c.title.toLowerCase().includes(query) ||
          c.tags.some((tag) => tag.toLowerCase().includes(query)) ||
          creatorName.includes(query)
        );
      });
    }

    // Find cursor position and slice
    let startIndex = 0;
    if (args.cursor) {
      const cursorIndex = allCreations.findIndex((c) => c._id === args.cursor);
      if (cursorIndex !== -1) {
        startIndex = cursorIndex + 1;
      }
    }

    const paginatedCreations = allCreations.slice(startIndex, startIndex + limit);
    const hasMore = startIndex + limit < allCreations.length;
    const nextCursor = hasMore ? paginatedCreations[paginatedCreations.length - 1]?._id : null;

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
      totalCount: allCreations.length,
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

    return {
      ...creation,
      creatorName: creator?.battleTag ?? "Unknown",
      creatorId: creator?._id,
      imageUrls: imageUrls.filter(Boolean) as string[],
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

    const now = Date.now();

    const creationId = await ctx.db.insert("creations", {
      title: args.title,
      description: args.description,
      importString: args.importString,
      imageIds: args.imageIds,
      thumbnailId: args.imageIds[0] ?? undefined,
      category: args.category,
      tags: args.tags,
      items: args.items,
      creatorId: user._id, // Derived from session, not client input
      createdAt: now,
      updatedAt: now,
      likeCount: 0,
      viewCount: 0,
      status: "published",
    });

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
      updateData.imageIds = updates.imageIds;
      updateData.thumbnailId = updates.imageIds[0] ?? undefined;
    }
    if (updates.category !== undefined) updateData.category = updates.category;
    if (updates.tags !== undefined) updateData.tags = updates.tags;
    if (updates.items !== undefined) updateData.items = updates.items;

    await ctx.db.patch(id, updateData);
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
    }
  },
});

// Generate upload URL for images (requires authenticated session)
export const generateUploadUrl = mutation({
  args: {
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // If session token provided, verify and rate limit
    if (args.sessionToken) {
      const session = await ctx.db
        .query("sessions")
        .withIndex("by_token", (q) => q.eq("token", args.sessionToken!))
        .first();

      if (session && session.expiresAt >= Date.now()) {
        const user = await ctx.db.get(session.userId);
        if (user && !user.banned) {
          // Rate limit: 20 image uploads per hour
          await enforceRateLimit(ctx, user._id, "upload_image");
        }
      }
    }

    return await ctx.storage.generateUploadUrl();
  },
});

// Check if an import string already exists (duplicate detection)
export const checkDuplicate = query({
  args: { importString: v.string() },
  handler: async (ctx, args) => {
    const trimmed = args.importString.trim();
    if (!trimmed) return null;

    // Search all published creations for matching import string
    const creations = await ctx.db
      .query("creations")
      .filter((q) => q.eq(q.field("status"), "published"))
      .collect();

    // Find exact match
    const match = creations.find((c) => c.importString.trim() === trimmed);

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

// Get platform stats for display
export const getStats = query({
  args: {},
  handler: async (ctx) => {
    // Get all published creations
    const creations = await ctx.db
      .query("creations")
      .filter((q) => q.eq(q.field("status"), "published"))
      .collect();

    // Get unique creator IDs
    const uniqueCreators = new Set(creations.map((c) => c.creatorId));

    // Sum up total views (as proxy for "imports")
    const totalViews = creations.reduce((sum, c) => sum + c.viewCount, 0);

    return {
      designCount: creations.length,
      creatorCount: uniqueCreators.size,
      importCount: totalViews, // Using views as proxy for imports
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

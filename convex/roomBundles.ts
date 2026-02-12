import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { enforceRateLimit } from "./rateLimit";

// Helper to verify session and get user
async function verifySession(ctx: any, sessionToken: string) {
  const session = await ctx.db
    .query("sessions")
    .withIndex("by_token", (q: any) => q.eq("token", sessionToken))
    .first();

  if (!session || session.expiresAt < Date.now()) {
    throw new Error("Unauthorized: Invalid or expired session");
  }

  const user = await ctx.db.get(session.userId);
  if (!user || user.banned) {
    throw new Error("Unauthorized: User not found or banned");
  }

  return user;
}

// List room bundles with pagination
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
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    let bundlesQuery;
    if (args.category) {
      bundlesQuery = ctx.db
        .query("roomBundles")
        .withIndex("by_category", (q) => q.eq("category", args.category!));
    } else {
      bundlesQuery = ctx.db
        .query("roomBundles")
        .withIndex("by_status_created", (q) => q.eq("status", "published"));
    }

    const bundles = await bundlesQuery
      .filter((q) => q.eq(q.field("status"), "published"))
      .order("desc")
      .take(limit);

    const bundlesWithDetails = await Promise.all(
      bundles.map(async (bundle) => {
        const creator = await ctx.db.get(bundle.creatorId);

        // Get cover image
        let coverUrl = null;
        if (bundle.coverImageId) {
          coverUrl = await ctx.storage.getUrl(bundle.coverImageId);
        } else if (bundle.designIds.length > 0) {
          // Use first design's thumbnail
          const firstDesign = await ctx.db.get(bundle.designIds[0]);
          if (firstDesign?.thumbnailId) {
            coverUrl = await ctx.storage.getUrl(firstDesign.thumbnailId);
          }
        }

        return {
          ...bundle,
          creatorName: creator?.battleTag ?? "Unknown",
          creatorAvatarUrl: creator?.avatarUrl,
          coverUrl,
          designCount: bundle.designIds.length,
        };
      })
    );

    return bundlesWithDetails;
  },
});

// Get a single room bundle with full details
export const getById = query({
  args: { id: v.id("roomBundles") },
  handler: async (ctx, args) => {
    const bundle = await ctx.db.get(args.id);
    if (!bundle || bundle.status === "deleted") return null;

    const creator = await ctx.db.get(bundle.creatorId);

    // Get all designs in the bundle
    const designs = await Promise.all(
      bundle.designIds.map(async (designId) => {
        const design = await ctx.db.get(designId);
        if (!design || design.status !== "published") return null;

        const designCreator = await ctx.db.get(design.creatorId);
        let thumbnailUrl = null;
        if (design.thumbnailId) {
          thumbnailUrl = await ctx.storage.getUrl(design.thumbnailId);
        } else if (design.imageIds.length > 0) {
          thumbnailUrl = await ctx.storage.getUrl(design.imageIds[0]);
        }

        return {
          _id: design._id,
          title: design.title,
          category: design.category,
          likeCount: design.likeCount,
          viewCount: design.viewCount,
          thumbnailUrl,
          creatorName: designCreator?.battleTag ?? "Unknown",
          creatorId: design.creatorId,
        };
      })
    );

    // Get cover image
    let coverUrl = null;
    if (bundle.coverImageId) {
      coverUrl = await ctx.storage.getUrl(bundle.coverImageId);
    }

    // Get all images from included designs for gallery
    const allImages: string[] = [];
    for (const designId of bundle.designIds) {
      const design = await ctx.db.get(designId);
      if (design && design.status === "published") {
        for (const imageId of design.imageIds) {
          const url = await ctx.storage.getUrl(imageId);
          if (url) allImages.push(url);
        }
      }
    }

    return {
      ...bundle,
      creatorName: creator?.battleTag ?? "Unknown",
      creatorAvatarUrl: creator?.avatarUrl,
      creatorIsVerified: creator?.isVerified ?? false,
      coverUrl,
      designs: designs.filter(Boolean),
      allImages,
    };
  },
});

// Get bundles by creator
export const getByCreator = query({
  args: { creatorId: v.id("users") },
  handler: async (ctx, args) => {
    const bundles = await ctx.db
      .query("roomBundles")
      .withIndex("by_creator", (q) => q.eq("creatorId", args.creatorId))
      .filter((q) => q.neq(q.field("status"), "deleted"))
      .order("desc")
      .collect();

    return Promise.all(
      bundles.map(async (bundle) => {
        let coverUrl = null;
        if (bundle.coverImageId) {
          coverUrl = await ctx.storage.getUrl(bundle.coverImageId);
        } else if (bundle.designIds.length > 0) {
          const firstDesign = await ctx.db.get(bundle.designIds[0]);
          if (firstDesign?.thumbnailId) {
            coverUrl = await ctx.storage.getUrl(firstDesign.thumbnailId);
          }
        }
        return {
          ...bundle,
          coverUrl,
          designCount: bundle.designIds.length,
        };
      })
    );
  },
});

// Create a new room bundle
export const create = mutation({
  args: {
    sessionToken: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    designIds: v.array(v.id("creations")),
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
    coverImageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const user = await verifySession(ctx, args.sessionToken);

    // Rate limit: 10 bundles per hour
    await enforceRateLimit(ctx, user._id, "create_bundle");

    // Validate design IDs (must exist and be published)
    if (args.designIds.length < 2) {
      throw new Error("A room bundle must contain at least 2 designs");
    }
    if (args.designIds.length > 10) {
      throw new Error("A room bundle can contain at most 10 designs");
    }

    for (const designId of args.designIds) {
      const design = await ctx.db.get(designId);
      if (!design || design.status !== "published") {
        throw new Error("One or more designs not found or not published");
      }
    }

    const now = Date.now();
    const bundleId = await ctx.db.insert("roomBundles", {
      title: args.title.trim(),
      description: args.description?.trim(),
      creatorId: user._id,
      designIds: args.designIds,
      coverImageId: args.coverImageId,
      category: args.category,
      tags: args.tags.slice(0, 10),
      likeCount: 0,
      viewCount: 0,
      status: "published",
      createdAt: now,
      updatedAt: now,
    });

    return bundleId;
  },
});

// Update a room bundle
export const update = mutation({
  args: {
    sessionToken: v.string(),
    id: v.id("roomBundles"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    designIds: v.optional(v.array(v.id("creations"))),
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
    coverImageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const user = await verifySession(ctx, args.sessionToken);

    const bundle = await ctx.db.get(args.id);
    if (!bundle) {
      throw new Error("Room bundle not found");
    }
    if (bundle.creatorId !== user._id) {
      throw new Error("You can only edit your own room bundles");
    }

    const updates: Record<string, unknown> = { updatedAt: Date.now() };

    if (args.title !== undefined) updates.title = args.title.trim();
    if (args.description !== undefined) updates.description = args.description?.trim();
    if (args.category !== undefined) updates.category = args.category;
    if (args.tags !== undefined) updates.tags = args.tags.slice(0, 10);
    if (args.coverImageId !== undefined) updates.coverImageId = args.coverImageId;

    if (args.designIds !== undefined) {
      if (args.designIds.length < 2) {
        throw new Error("A room bundle must contain at least 2 designs");
      }
      if (args.designIds.length > 10) {
        throw new Error("A room bundle can contain at most 10 designs");
      }
      for (const designId of args.designIds) {
        const design = await ctx.db.get(designId);
        if (!design || design.status !== "published") {
          throw new Error("One or more designs not found or not published");
        }
      }
      updates.designIds = args.designIds;
    }

    await ctx.db.patch(args.id, updates);
    return { success: true };
  },
});

// Delete a room bundle
export const remove = mutation({
  args: {
    sessionToken: v.string(),
    id: v.id("roomBundles"),
  },
  handler: async (ctx, args) => {
    const user = await verifySession(ctx, args.sessionToken);

    const bundle = await ctx.db.get(args.id);
    if (!bundle) {
      throw new Error("Room bundle not found");
    }
    if (bundle.creatorId !== user._id) {
      throw new Error("You can only delete your own room bundles");
    }

    await ctx.db.patch(args.id, { status: "deleted", updatedAt: Date.now() });
    return { success: true };
  },
});

// Increment view count
export const incrementViews = mutation({
  args: { id: v.id("roomBundles") },
  handler: async (ctx, args) => {
    const bundle = await ctx.db.get(args.id);
    if (bundle && bundle.status === "published") {
      await ctx.db.patch(args.id, { viewCount: bundle.viewCount + 1 });
    }
  },
});

// Toggle like on a room bundle
export const toggleLike = mutation({
  args: {
    sessionToken: v.string(),
    bundleId: v.id("roomBundles"),
  },
  handler: async (ctx, args) => {
    const user = await verifySession(ctx, args.sessionToken);

    const bundle = await ctx.db.get(args.bundleId);
    if (!bundle || bundle.status !== "published") {
      throw new Error("Room bundle not found");
    }

    const existing = await ctx.db
      .query("roomBundleLikes")
      .withIndex("by_user_bundle", (q) =>
        q.eq("userId", user._id).eq("bundleId", args.bundleId)
      )
      .first();

    if (existing) {
      // Unlike
      await ctx.db.delete(existing._id);
      await ctx.db.patch(args.bundleId, { likeCount: Math.max(0, bundle.likeCount - 1) });
      return { liked: false };
    } else {
      // Like
      await ctx.db.insert("roomBundleLikes", {
        userId: user._id,
        bundleId: args.bundleId,
        createdAt: Date.now(),
      });
      await ctx.db.patch(args.bundleId, { likeCount: bundle.likeCount + 1 });
      return { liked: true };
    }
  },
});

// Check if user has liked a bundle
export const hasLiked = query({
  args: {
    userId: v.id("users"),
    bundleId: v.id("roomBundles"),
  },
  handler: async (ctx, args) => {
    const like = await ctx.db
      .query("roomBundleLikes")
      .withIndex("by_user_bundle", (q) =>
        q.eq("userId", args.userId).eq("bundleId", args.bundleId)
      )
      .first();
    return !!like;
  },
});

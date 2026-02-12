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

// Get all collections for a user
export const getByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const collections = await ctx.db
      .query("collections")
      .withIndex("by_owner", (q) => q.eq("ownerId", args.userId))
      .order("desc")
      .collect();

    // Get item count for each collection
    return Promise.all(
      collections.map(async (collection) => {
        const items = await ctx.db
          .query("collectionItems")
          .withIndex("by_collection", (q) => q.eq("collectionId", collection._id))
          .collect();

        // Get first 4 thumbnails for preview
        const previewItems = items.slice(0, 4);
        const thumbnails = await Promise.all(
          previewItems.map(async (item) => {
            const creation = await ctx.db.get(item.creationId);
            if (!creation) return null;
            if (creation.thumbnailId) {
              return ctx.storage.getUrl(creation.thumbnailId);
            }
            if (creation.imageIds.length > 0) {
              return ctx.storage.getUrl(creation.imageIds[0]);
            }
            return null;
          })
        );

        return {
          ...collection,
          itemCount: items.length,
          thumbnails: thumbnails.filter(Boolean) as string[],
        };
      })
    );
  },
});

// Get a single collection with its items
export const getById = query({
  args: { id: v.id("collections") },
  handler: async (ctx, args) => {
    const collection = await ctx.db.get(args.id);
    if (!collection) return null;

    const owner = await ctx.db.get(collection.ownerId);

    // Get all items in the collection
    const items = await ctx.db
      .query("collectionItems")
      .withIndex("by_collection", (q) => q.eq("collectionId", args.id))
      .order("desc")
      .collect();

    // Get creation details for each item
    const creationsWithDetails = await Promise.all(
      items.map(async (item) => {
        const creation = await ctx.db.get(item.creationId);
        if (!creation || creation.status !== "published") return null;

        const creator = await ctx.db.get(creation.creatorId);
        let thumbnailUrl = null;
        if (creation.thumbnailId) {
          thumbnailUrl = await ctx.storage.getUrl(creation.thumbnailId);
        } else if (creation.imageIds.length > 0) {
          thumbnailUrl = await ctx.storage.getUrl(creation.imageIds[0]);
        }

        return {
          ...creation,
          creatorName: creator?.battleTag.split("#")[0] ?? "Unknown",
          thumbnailUrl,
          addedAt: item.addedAt,
        };
      })
    );

    return {
      ...collection,
      ownerName: owner?.battleTag.split("#")[0] ?? "Unknown",
      items: creationsWithDetails.filter(Boolean),
    };
  },
});

// Create a new collection (requires authenticated session)
export const create = mutation({
  args: {
    sessionToken: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    isPublic: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await verifySession(ctx, args.sessionToken);

    // Rate limit: 20 collections per hour
    await enforceRateLimit(ctx, user._id, "create_collection");

    const now = Date.now();
    return ctx.db.insert("collections", {
      name: args.name,
      description: args.description,
      ownerId: user._id, // Derived from session
      isPublic: args.isPublic,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Update a collection (owner only)
export const update = mutation({
  args: {
    sessionToken: v.string(),
    id: v.id("collections"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await verifySession(ctx, args.sessionToken);

    const collection = await ctx.db.get(args.id);
    if (!collection) {
      throw new Error("Collection not found");
    }

    // Verify ownership
    if (collection.ownerId !== user._id) {
      throw new Error("Forbidden: You can only edit your own collections");
    }

    const { id, sessionToken, ...updates } = args;
    const updateData: Record<string, unknown> = { updatedAt: Date.now() };

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.isPublic !== undefined) updateData.isPublic = updates.isPublic;

    await ctx.db.patch(id, updateData);
    return id;
  },
});

// Delete a collection (owner only)
export const remove = mutation({
  args: {
    sessionToken: v.string(),
    id: v.id("collections"),
  },
  handler: async (ctx, args) => {
    const user = await verifySession(ctx, args.sessionToken);

    const collection = await ctx.db.get(args.id);
    if (!collection) {
      throw new Error("Collection not found");
    }

    // Verify ownership
    if (collection.ownerId !== user._id) {
      throw new Error("Forbidden: You can only delete your own collections");
    }

    // Delete all items in the collection first
    const items = await ctx.db
      .query("collectionItems")
      .withIndex("by_collection", (q) => q.eq("collectionId", args.id))
      .collect();

    for (const item of items) {
      await ctx.db.delete(item._id);
    }

    // Delete the collection
    await ctx.db.delete(args.id);
  },
});

// Add a design to a collection (owner only)
export const addItem = mutation({
  args: {
    sessionToken: v.string(),
    collectionId: v.id("collections"),
    creationId: v.id("creations"),
  },
  handler: async (ctx, args) => {
    const user = await verifySession(ctx, args.sessionToken);

    const collection = await ctx.db.get(args.collectionId);
    if (!collection) {
      throw new Error("Collection not found");
    }

    // Verify ownership
    if (collection.ownerId !== user._id) {
      throw new Error("Forbidden: You can only add items to your own collections");
    }

    // Check if already in collection
    const existing = await ctx.db
      .query("collectionItems")
      .withIndex("by_collection_creation", (q) =>
        q.eq("collectionId", args.collectionId).eq("creationId", args.creationId)
      )
      .first();

    if (existing) return existing._id;

    // Rate limit: 100 collection item additions per minute
    await enforceRateLimit(ctx, user._id, "collection_item");

    // Add to collection
    const id = await ctx.db.insert("collectionItems", {
      collectionId: args.collectionId,
      creationId: args.creationId,
      addedAt: Date.now(),
    });

    // Update collection's updatedAt
    await ctx.db.patch(args.collectionId, { updatedAt: Date.now() });

    return id;
  },
});

// Remove a design from a collection (owner only)
export const removeItem = mutation({
  args: {
    sessionToken: v.string(),
    collectionId: v.id("collections"),
    creationId: v.id("creations"),
  },
  handler: async (ctx, args) => {
    const user = await verifySession(ctx, args.sessionToken);

    const collection = await ctx.db.get(args.collectionId);
    if (!collection) {
      throw new Error("Collection not found");
    }

    // Verify ownership
    if (collection.ownerId !== user._id) {
      throw new Error("Forbidden: You can only remove items from your own collections");
    }

    const item = await ctx.db
      .query("collectionItems")
      .withIndex("by_collection_creation", (q) =>
        q.eq("collectionId", args.collectionId).eq("creationId", args.creationId)
      )
      .first();

    if (item) {
      await ctx.db.delete(item._id);
      await ctx.db.patch(args.collectionId, { updatedAt: Date.now() });
    }
  },
});

// List public collections for discovery
export const listPublic = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    const collections = await ctx.db
      .query("collections")
      .filter((q) => q.eq(q.field("isPublic"), true))
      .order("desc")
      .take(limit);

    return Promise.all(
      collections.map(async (collection) => {
        const owner = await ctx.db.get(collection.ownerId);
        const items = await ctx.db
          .query("collectionItems")
          .withIndex("by_collection", (q) => q.eq("collectionId", collection._id))
          .collect();

        // Get first thumbnail
        let coverUrl = null;
        if (items.length > 0) {
          const firstCreation = await ctx.db.get(items[0].creationId);
          if (firstCreation?.thumbnailId) {
            coverUrl = await ctx.storage.getUrl(firstCreation.thumbnailId);
          } else if (firstCreation?.imageIds.length) {
            coverUrl = await ctx.storage.getUrl(firstCreation.imageIds[0]);
          }
        }

        return {
          ...collection,
          ownerName: owner?.battleTag.split("#")[0] ?? "Unknown",
          ownerAvatarUrl: owner?.avatarUrl,
          itemCount: items.length,
          coverUrl,
        };
      })
    );
  },
});

// Check which collections contain a creation (for logged in user)
export const getContainingCollections = query({
  args: {
    userId: v.id("users"),
    creationId: v.id("creations"),
  },
  handler: async (ctx, args) => {
    // Get all user's collections
    const collections = await ctx.db
      .query("collections")
      .withIndex("by_owner", (q) => q.eq("ownerId", args.userId))
      .collect();

    // Check which ones contain this creation
    const containingIds = new Set<string>();
    for (const collection of collections) {
      const item = await ctx.db
        .query("collectionItems")
        .withIndex("by_collection_creation", (q) =>
          q.eq("collectionId", collection._id).eq("creationId", args.creationId)
        )
        .first();

      if (item) {
        containingIds.add(collection._id);
      }
    }

    return collections.map((c) => ({
      _id: c._id,
      name: c.name,
      contains: containingIds.has(c._id),
    }));
  },
});

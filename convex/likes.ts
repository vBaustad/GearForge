import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { enforceRateLimit } from "./rateLimit";

// Check if user has liked a creation
export const hasLiked = query({
  args: {
    userId: v.id("users"),
    creationId: v.id("creations"),
  },
  handler: async (ctx, args) => {
    const like = await ctx.db
      .query("likes")
      .withIndex("by_user_creation", (q) =>
        q.eq("userId", args.userId).eq("creationId", args.creationId)
      )
      .first();

    return like !== null;
  },
});

// Toggle like on a creation (requires authenticated session)
export const toggle = mutation({
  args: {
    sessionToken: v.string(),
    creationId: v.id("creations"),
  },
  handler: async (ctx, args) => {
    // Verify session and get current user
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.sessionToken))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      throw new Error("Unauthorized: Please log in to like designs");
    }

    const user = await ctx.db.get(session.userId);
    if (!user || user.banned) {
      throw new Error("Unauthorized: User not found or banned");
    }

    // Rate limit: 100 likes per minute
    await enforceRateLimit(ctx, user._id, "toggle_like");

    const existingLike = await ctx.db
      .query("likes")
      .withIndex("by_user_creation", (q) =>
        q.eq("userId", user._id).eq("creationId", args.creationId)
      )
      .first();

    const creation = await ctx.db.get(args.creationId);
    if (!creation) {
      throw new Error("Creation not found");
    }

    if (existingLike) {
      // Unlike: remove the like and decrement count
      await ctx.db.delete(existingLike._id);
      await ctx.db.patch(args.creationId, {
        likeCount: Math.max(0, creation.likeCount - 1),
      });
      return { liked: false, likeCount: Math.max(0, creation.likeCount - 1) };
    } else {
      // Like: add the like and increment count
      await ctx.db.insert("likes", {
        userId: user._id, // Derived from session
        creationId: args.creationId,
        createdAt: Date.now(),
      });
      await ctx.db.patch(args.creationId, {
        likeCount: creation.likeCount + 1,
      });
      return { liked: true, likeCount: creation.likeCount + 1 };
    }
  },
});

// Get all likes by a user
export const getByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const likes = await ctx.db
      .query("likes")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    return likes;
  },
});

// Get like count for a creation
export const getCount = query({
  args: { creationId: v.id("creations") },
  handler: async (ctx, args) => {
    const creation = await ctx.db.get(args.creationId);
    return creation?.likeCount ?? 0;
  },
});

// Get liked creations by a user (with full creation details)
export const getLikedCreations = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const likes = await ctx.db
      .query("likes")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();

    // Fetch full creation details for each like
    const creationsWithDetails = await Promise.all(
      likes.map(async (like) => {
        const creation = await ctx.db.get(like.creationId);
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
          creatorName: creator?.battleTag ?? "Unknown",
          thumbnailUrl,
          likedAt: like.createdAt,
        };
      })
    );

    return creationsWithDetails.filter(Boolean);
  },
});

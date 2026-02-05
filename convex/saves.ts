import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { enforceRateLimit } from "./rateLimit";

// Check if user has saved a creation
export const hasSaved = query({
  args: {
    userId: v.id("users"),
    creationId: v.id("creations"),
  },
  handler: async (ctx, args) => {
    const save = await ctx.db
      .query("saves")
      .withIndex("by_user_creation", (q) =>
        q.eq("userId", args.userId).eq("creationId", args.creationId)
      )
      .first();

    return save !== null;
  },
});

// Toggle save (bookmark) on a creation (requires authenticated session)
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
      throw new Error("Unauthorized: Please log in to save designs");
    }

    const user = await ctx.db.get(session.userId);
    if (!user || user.banned) {
      throw new Error("Unauthorized: User not found or banned");
    }

    // Rate limit: 100 saves per minute
    await enforceRateLimit(ctx, user._id, "toggle_save");

    // Check if already saved
    const existingSave = await ctx.db
      .query("saves")
      .withIndex("by_user_creation", (q) =>
        q.eq("userId", user._id).eq("creationId", args.creationId)
      )
      .first();

    if (existingSave) {
      // Unsave
      await ctx.db.delete(existingSave._id);
      return { saved: false };
    } else {
      // Save
      await ctx.db.insert("saves", {
        userId: user._id, // Derived from session
        creationId: args.creationId,
        createdAt: Date.now(),
      });
      return { saved: true };
    }
  },
});

// Get all saved creations for a user
export const getSavedCreations = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const saves = await ctx.db
      .query("saves")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();

    // Fetch the creation details
    const creations = await Promise.all(
      saves.map(async (save) => {
        const creation = await ctx.db.get(save.creationId);
        if (!creation || creation.status !== "published") return null;

        // Get creator name
        const creator = await ctx.db.get(creation.creatorId);

        // Get thumbnail URL
        let thumbnailUrl = null;
        if (creation.imageIds.length > 0) {
          thumbnailUrl = await ctx.storage.getUrl(creation.imageIds[0]);
        }

        return {
          _id: creation._id,
          title: creation.title,
          category: creation.category,
          thumbnailUrl,
          creatorName: creator?.battleTag.split("#")[0] || "Unknown",
          likeCount: creation.likeCount,
          savedAt: save.createdAt,
        };
      })
    );

    return creations.filter((c): c is NonNullable<typeof c> => c !== null);
  },
});

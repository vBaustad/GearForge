import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { enforceRateLimit } from "./rateLimit";

// Check if user is following another user
export const isFollowing = query({
  args: {
    followerId: v.id("users"),
    followingId: v.id("users"),
  },
  handler: async (ctx, args) => {
    if (args.followerId === args.followingId) return false;

    const follow = await ctx.db
      .query("follows")
      .withIndex("by_follower_following", (q) =>
        q.eq("followerId", args.followerId).eq("followingId", args.followingId)
      )
      .first();

    return !!follow;
  },
});

// Toggle follow status (requires authenticated session)
export const toggle = mutation({
  args: {
    sessionToken: v.string(),
    followingId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Verify session and get current user
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.sessionToken))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      throw new Error("Unauthorized: Please log in to follow creators");
    }

    const user = await ctx.db.get(session.userId);
    if (!user || user.banned) {
      throw new Error("Unauthorized: User not found or banned");
    }

    // Can't follow yourself
    if (user._id === args.followingId) {
      throw new Error("Cannot follow yourself");
    }

    // Rate limit: 50 follows per minute
    await enforceRateLimit(ctx, user._id, "toggle_follow");

    const existing = await ctx.db
      .query("follows")
      .withIndex("by_follower_following", (q) =>
        q.eq("followerId", user._id).eq("followingId", args.followingId)
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
      return { action: "unfollowed" };
    } else {
      await ctx.db.insert("follows", {
        followerId: user._id, // Derived from session
        followingId: args.followingId,
        createdAt: Date.now(),
      });
      return { action: "followed" };
    }
  },
});

// Get follower count for a user
export const getFollowerCount = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const followers = await ctx.db
      .query("follows")
      .withIndex("by_following", (q) => q.eq("followingId", args.userId))
      .collect();

    return followers.length;
  },
});

// Get following count for a user
export const getFollowingCount = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const following = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", args.userId))
      .collect();

    return following.length;
  },
});

// Get followers list
export const getFollowers = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const follows = await ctx.db
      .query("follows")
      .withIndex("by_following", (q) => q.eq("followingId", args.userId))
      .order("desc")
      .collect();

    // Get user details for each follower
    const followers = await Promise.all(
      follows.map(async (follow) => {
        const user = await ctx.db.get(follow.followerId);
        if (!user) return null;

        return {
          _id: user._id,
          battleTag: user.battleTag,
          avatarUrl: user.avatarUrl,
          followedAt: follow.createdAt,
        };
      })
    );

    return followers.filter(Boolean);
  },
});

// Get following list
export const getFollowing = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const follows = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", args.userId))
      .order("desc")
      .collect();

    // Get user details for each following
    const following = await Promise.all(
      follows.map(async (follow) => {
        const user = await ctx.db.get(follow.followingId);
        if (!user) return null;

        return {
          _id: user._id,
          battleTag: user.battleTag,
          avatarUrl: user.avatarUrl,
          followedAt: follow.createdAt,
        };
      })
    );

    return following.filter(Boolean);
  },
});

// Get combined stats for a user (followers and following counts)
export const getStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const [followers, following] = await Promise.all([
      ctx.db
        .query("follows")
        .withIndex("by_following", (q) => q.eq("followingId", args.userId))
        .collect(),
      ctx.db
        .query("follows")
        .withIndex("by_follower", (q) => q.eq("followerId", args.userId))
        .collect(),
    ]);

    return {
      followers: followers.length,
      following: following.length,
    };
  },
});

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { enforceRateLimit } from "./rateLimit";

// Generate a random session token
function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}

// Get current user from session token
export const getCurrentUser = query({
  args: { sessionToken: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (!args.sessionToken) return null;

    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.sessionToken!))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      return null;
    }

    const user = await ctx.db.get(session.userId);
    if (!user || user.banned) {
      return null;
    }

    return {
      id: user._id,
      battleTag: user.battleTag,
      avatarUrl: user.avatarUrl,
      role: user.role,
    };
  },
});

// Create or update user after Blizzard OAuth, return session token
export const loginWithBlizzard = mutation({
  args: {
    battlenetId: v.string(),
    battleTag: v.string(),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Rate limit: 10 login attempts per 15 minutes per battlenet ID
    await enforceRateLimit(ctx, args.battlenetId, "login");

    const now = Date.now();

    // Find existing user
    let user = await ctx.db
      .query("users")
      .withIndex("by_battlenet_id", (q) => q.eq("battlenetId", args.battlenetId))
      .first();

    if (user) {
      // Update existing user
      await ctx.db.patch(user._id, {
        battleTag: args.battleTag,
        avatarUrl: args.avatarUrl,
        lastLoginAt: now,
      });
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
      user = await ctx.db.get(userId);
    }

    if (!user) {
      throw new Error("Failed to create user");
    }

    // Create session
    const token = generateToken();
    const expiresAt = now + 30 * 24 * 60 * 60 * 1000; // 30 days

    await ctx.db.insert("sessions", {
      userId: user._id,
      token,
      expiresAt,
    });

    return {
      token,
      user: {
        id: user._id,
        battleTag: user.battleTag,
        avatarUrl: user.avatarUrl,
        role: user.role,
      },
    };
  },
});

// Logout - delete session
export const logout = mutation({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.sessionToken))
      .first();

    if (session) {
      await ctx.db.delete(session._id);
    }

    return { success: true };
  },
});

// Clean up expired sessions (can be called periodically)
export const cleanupExpiredSessions = mutation({
  handler: async (ctx) => {
    const now = Date.now();
    const expiredSessions = await ctx.db
      .query("sessions")
      .filter((q) => q.lt(q.field("expiresAt"), now))
      .collect();

    for (const session of expiredSessions) {
      await ctx.db.delete(session._id);
    }

    return { deleted: expiredSessions.length };
  },
});

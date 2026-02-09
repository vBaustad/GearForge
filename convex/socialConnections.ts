import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const platformValidator = v.union(
  v.literal("twitch"),
  v.literal("youtube"),
  v.literal("kick")
);

// Get all social connections for a user
export const getByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const connections = await ctx.db
      .query("socialConnections")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Return without exposing tokens
    return connections.map((conn) => ({
      _id: conn._id,
      platform: conn.platform,
      platformId: conn.platformId,
      platformUsername: conn.platformUsername,
      platformAvatarUrl: conn.platformAvatarUrl,
      channelUrl: conn.channelUrl,
      connectedAt: conn.connectedAt,
      lastValidatedAt: conn.lastValidatedAt,
    }));
  },
});

// Get connection for a specific platform
export const getByUserPlatform = query({
  args: {
    userId: v.id("users"),
    platform: platformValidator,
  },
  handler: async (ctx, args) => {
    const connection = await ctx.db
      .query("socialConnections")
      .withIndex("by_user_platform", (q) =>
        q.eq("userId", args.userId).eq("platform", args.platform)
      )
      .first();

    if (!connection) return null;

    // Return without exposing tokens
    return {
      _id: connection._id,
      platform: connection.platform,
      platformId: connection.platformId,
      platformUsername: connection.platformUsername,
      platformAvatarUrl: connection.platformAvatarUrl,
      channelUrl: connection.channelUrl,
      connectedAt: connection.connectedAt,
      lastValidatedAt: connection.lastValidatedAt,
    };
  },
});

// Store a new social connection (called after OAuth callback)
export const connect = mutation({
  args: {
    sessionToken: v.string(),
    platform: platformValidator,
    platformId: v.string(),
    platformUsername: v.string(),
    platformAvatarUrl: v.optional(v.string()),
    channelUrl: v.string(),
    accessToken: v.string(),
    refreshToken: v.optional(v.string()),
    tokenExpiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Verify session
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.sessionToken))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      throw new Error("Unauthorized: Please log in to connect accounts");
    }

    const user = await ctx.db.get(session.userId);
    if (!user || user.banned) {
      throw new Error("Unauthorized: User not found or banned");
    }

    const now = Date.now();

    // Check if this platform account is already connected to another user
    const existingConnection = await ctx.db
      .query("socialConnections")
      .withIndex("by_platform_id", (q) =>
        q.eq("platform", args.platform).eq("platformId", args.platformId)
      )
      .first();

    if (existingConnection && existingConnection.userId !== session.userId) {
      throw new Error(
        `This ${args.platform} account is already connected to another user`
      );
    }

    // Check if user already has a connection for this platform
    const userExisting = await ctx.db
      .query("socialConnections")
      .withIndex("by_user_platform", (q) =>
        q.eq("userId", session.userId).eq("platform", args.platform)
      )
      .first();

    if (userExisting) {
      // Update existing connection
      await ctx.db.patch(userExisting._id, {
        platformId: args.platformId,
        platformUsername: args.platformUsername,
        platformAvatarUrl: args.platformAvatarUrl,
        channelUrl: args.channelUrl,
        accessToken: args.accessToken,
        refreshToken: args.refreshToken,
        tokenExpiresAt: args.tokenExpiresAt,
        lastValidatedAt: now,
      });
      return { success: true, updated: true };
    }

    // Create new connection
    await ctx.db.insert("socialConnections", {
      userId: session.userId,
      platform: args.platform,
      platformId: args.platformId,
      platformUsername: args.platformUsername,
      platformAvatarUrl: args.platformAvatarUrl,
      channelUrl: args.channelUrl,
      accessToken: args.accessToken,
      refreshToken: args.refreshToken,
      tokenExpiresAt: args.tokenExpiresAt,
      connectedAt: now,
      lastValidatedAt: now,
    });

    return { success: true, updated: false };
  },
});

// Disconnect a social account
export const disconnect = mutation({
  args: {
    sessionToken: v.string(),
    platform: platformValidator,
  },
  handler: async (ctx, args) => {
    // Verify session
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.sessionToken))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      throw new Error("Unauthorized: Please log in to disconnect accounts");
    }

    const user = await ctx.db.get(session.userId);
    if (!user || user.banned) {
      throw new Error("Unauthorized: User not found or banned");
    }

    // Find and delete the connection
    const connection = await ctx.db
      .query("socialConnections")
      .withIndex("by_user_platform", (q) =>
        q.eq("userId", session.userId).eq("platform", args.platform)
      )
      .first();

    if (!connection) {
      throw new Error(`No ${args.platform} connection found`);
    }

    await ctx.db.delete(connection._id);

    return { success: true };
  },
});

// Update token validation timestamp (called when tokens are refreshed)
export const updateValidation = mutation({
  args: {
    connectionId: v.id("socialConnections"),
    accessToken: v.optional(v.string()),
    refreshToken: v.optional(v.string()),
    tokenExpiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const connection = await ctx.db.get(args.connectionId);
    if (!connection) {
      throw new Error("Connection not found");
    }

    const updates: {
      lastValidatedAt: number;
      accessToken?: string;
      refreshToken?: string;
      tokenExpiresAt?: number;
    } = {
      lastValidatedAt: Date.now(),
    };

    if (args.accessToken) updates.accessToken = args.accessToken;
    if (args.refreshToken) updates.refreshToken = args.refreshToken;
    if (args.tokenExpiresAt) updates.tokenExpiresAt = args.tokenExpiresAt;

    await ctx.db.patch(args.connectionId, updates);

    return { success: true };
  },
});

// Get connection with tokens (internal use only, for token refresh)
export const getConnectionWithTokens = query({
  args: {
    sessionToken: v.string(),
    platform: platformValidator,
  },
  handler: async (ctx, args) => {
    // Verify session
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.sessionToken))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      return null;
    }

    const connection = await ctx.db
      .query("socialConnections")
      .withIndex("by_user_platform", (q) =>
        q.eq("userId", session.userId).eq("platform", args.platform)
      )
      .first();

    return connection;
  },
});

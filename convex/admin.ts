import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { logAuditEvent } from "./auditLog";

// ===== HELPER: Verify Admin Session =====

async function verifyAdminSession(ctx: any, sessionToken: string) {
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

  if (user.role !== "admin") {
    throw new Error("Forbidden: Admin access required");
  }

  return user;
}

async function verifyModeratorSession(ctx: any, sessionToken: string) {
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

  if (user.role !== "admin" && user.role !== "moderator") {
    throw new Error("Forbidden: Admin or moderator access required");
  }

  return user;
}

// ===== USER MANAGEMENT =====

// Max search string length to prevent ReDoS
const MAX_SEARCH_LENGTH = 100;

/**
 * Get all users with pagination and filters
 */
export const getUsers = query({
  args: {
    sessionToken: v.string(),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
    filter: v.optional(v.union(
      v.literal("all"),
      v.literal("banned"),
      v.literal("admins"),
      v.literal("moderators")
    )),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await verifyAdminSession(ctx, args.sessionToken);

    const limit = Math.min(args.limit || 50, 100);
    const offset = args.offset || 0;

    // Sanitize search input (prevent ReDoS, limit length)
    const search = args.search?.slice(0, MAX_SEARCH_LENGTH);

    let allUsers = await ctx.db.query("users").collect();

    // Apply filters
    if (args.filter === "banned") {
      allUsers = allUsers.filter((u) => u.banned);
    } else if (args.filter === "admins") {
      allUsers = allUsers.filter((u) => u.role === "admin");
    } else if (args.filter === "moderators") {
      allUsers = allUsers.filter((u) => u.role === "moderator");
    }

    // Apply search
    if (search) {
      const searchLower = search.toLowerCase();
      allUsers = allUsers.filter((u) =>
        u.battleTag.toLowerCase().includes(searchLower)
      );
    }

    // Sort by creation date (newest first)
    allUsers.sort((a, b) => b.createdAt - a.createdAt);

    // Paginate
    const paginatedUsers = allUsers.slice(offset, offset + limit);

    // Get additional stats for each user
    const usersWithStats = await Promise.all(
      paginatedUsers.map(async (user) => {
        const creations = await ctx.db
          .query("creations")
          .withIndex("by_creator", (q) => q.eq("creatorId", user._id))
          .collect();

        const reports = await ctx.db
          .query("reports")
          .withIndex("by_reporter", (q) => q.eq("reporterId", user._id))
          .collect();

        return {
          _id: user._id,
          battleTag: user.battleTag,
          avatarUrl: user.avatarUrl,
          role: user.role,
          banned: user.banned,
          createdAt: user.createdAt,
          lastLoginAt: user.lastLoginAt,
          stats: {
            creationsCount: creations.length,
            reportsSubmitted: reports.length,
            totalLikes: creations.reduce((sum, c) => sum + c.likeCount, 0),
            totalViews: creations.reduce((sum, c) => sum + c.viewCount, 0),
          },
        };
      })
    );

    return {
      users: usersWithStats,
      total: allUsers.length,
      hasMore: offset + limit < allUsers.length,
    };
  },
});

/**
 * Get detailed user info for admin view
 */
export const getUserDetails = query({
  args: {
    sessionToken: v.string(),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    await verifyModeratorSession(ctx, args.sessionToken);

    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Get user's creations
    const creations = await ctx.db
      .query("creations")
      .withIndex("by_creator", (q) => q.eq("creatorId", user._id))
      .collect();

    // Get reports about this user's content
    const reportedCreationIds = creations.map((c) => c._id);
    const reportsAgainst = await ctx.db
      .query("reports")
      .collect();
    const reportsAgainstUser = reportsAgainst.filter((r) =>
      reportedCreationIds.includes(r.creationId)
    );

    // Get reports submitted by this user
    const reportsSubmitted = await ctx.db
      .query("reports")
      .withIndex("by_reporter", (q) => q.eq("reporterId", user._id))
      .collect();

    // Get social connections
    const socialConnections = await ctx.db
      .query("socialConnections")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Get recent sessions
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Get recent audit logs
    const auditLogs = await ctx.db
      .query("auditLogs")
      .withIndex("by_actor", (q) => q.eq("actorId", user._id))
      .order("desc")
      .take(20);

    return {
      user: {
        _id: user._id,
        battlenetId: user.battlenetId,
        battleTag: user.battleTag,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        role: user.role,
        banned: user.banned,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
        twitchUrl: user.twitchUrl,
        youtubeUrl: user.youtubeUrl,
      },
      stats: {
        creationsCount: creations.length,
        publishedCount: creations.filter((c) => c.status === "published").length,
        hiddenCount: creations.filter((c) => c.status === "hidden").length,
        deletedCount: creations.filter((c) => c.status === "deleted").length,
        totalLikes: creations.reduce((sum, c) => sum + c.likeCount, 0),
        totalViews: creations.reduce((sum, c) => sum + c.viewCount, 0),
        reportsAgainst: reportsAgainstUser.length,
        reportsSubmitted: reportsSubmitted.length,
        activeSessions: sessions.filter((s) => s.expiresAt > Date.now()).length,
      },
      socialConnections: socialConnections.map((c) => ({
        platform: c.platform,
        platformUsername: c.platformUsername,
        channelUrl: c.channelUrl,
        connectedAt: c.connectedAt,
      })),
      recentActivity: auditLogs,
      recentCreations: creations
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 5)
        .map((c) => ({
          _id: c._id,
          title: c.title,
          status: c.status,
          createdAt: c.createdAt,
          likeCount: c.likeCount,
        })),
    };
  },
});

/**
 * Ban a user
 */
export const banUser = mutation({
  args: {
    sessionToken: v.string(),
    userId: v.id("users"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const admin = await verifyAdminSession(ctx, args.sessionToken);

    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser) {
      throw new Error("User not found");
    }

    if (targetUser.role === "admin") {
      throw new Error("Cannot ban an admin user");
    }

    if (targetUser.banned) {
      throw new Error("User is already banned");
    }

    // Ban the user
    await ctx.db.patch(args.userId, { banned: true });

    // Invalidate all sessions
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    for (const session of sessions) {
      await ctx.db.delete(session._id);
    }

    // Log the action
    await logAuditEvent(ctx, {
      actorId: admin._id,
      actorRole: admin.role,
      actorIdentifier: admin.battleTag,
      action: "admin.user_banned",
      targetType: "user",
      targetId: args.userId,
      targetIdentifier: targetUser.battleTag,
      details: JSON.stringify({ reason: args.reason }),
      metadata: { reason: args.reason },
      severity: "warning",
    });

    return { success: true };
  },
});

/**
 * Unban a user
 */
export const unbanUser = mutation({
  args: {
    sessionToken: v.string(),
    userId: v.id("users"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await verifyAdminSession(ctx, args.sessionToken);

    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser) {
      throw new Error("User not found");
    }

    if (!targetUser.banned) {
      throw new Error("User is not banned");
    }

    // Unban the user
    await ctx.db.patch(args.userId, { banned: false });

    // Log the action
    await logAuditEvent(ctx, {
      actorId: admin._id,
      actorRole: admin.role,
      actorIdentifier: admin.battleTag,
      action: "admin.user_unbanned",
      targetType: "user",
      targetId: args.userId,
      targetIdentifier: targetUser.battleTag,
      details: args.reason ? JSON.stringify({ reason: args.reason }) : undefined,
      metadata: args.reason ? { reason: args.reason } : undefined,
      severity: "info",
    });

    return { success: true };
  },
});

/**
 * Change user role
 */
export const changeUserRole = mutation({
  args: {
    sessionToken: v.string(),
    userId: v.id("users"),
    newRole: v.union(v.literal("user"), v.literal("moderator"), v.literal("admin")),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await verifyAdminSession(ctx, args.sessionToken);

    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser) {
      throw new Error("User not found");
    }

    if (targetUser._id === admin._id) {
      throw new Error("Cannot change your own role");
    }

    const previousRole = targetUser.role;

    if (previousRole === args.newRole) {
      throw new Error(`User already has role: ${args.newRole}`);
    }

    // Update role
    await ctx.db.patch(args.userId, { role: args.newRole });

    // Log the action
    await logAuditEvent(ctx, {
      actorId: admin._id,
      actorRole: admin.role,
      actorIdentifier: admin.battleTag,
      action: "admin.user_role_changed",
      targetType: "user",
      targetId: args.userId,
      targetIdentifier: targetUser.battleTag,
      details: JSON.stringify({
        previousRole,
        newRole: args.newRole,
        reason: args.reason,
      }),
      metadata: {
        previousValue: previousRole,
        newValue: args.newRole,
        reason: args.reason,
      },
      severity: "warning",
    });

    return { success: true, previousRole, newRole: args.newRole };
  },
});

// ===== CONTENT MANAGEMENT =====

/**
 * Get all creations with filters for admin
 */
export const getCreations = query({
  args: {
    sessionToken: v.string(),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
    status: v.optional(v.union(
      v.literal("all"),
      v.literal("published"),
      v.literal("hidden"),
      v.literal("deleted")
    )),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await verifyModeratorSession(ctx, args.sessionToken);

    const limit = Math.min(args.limit || 50, 100);
    const offset = args.offset || 0;

    // Sanitize search input
    const search = args.search?.slice(0, MAX_SEARCH_LENGTH);

    let allCreations = await ctx.db.query("creations").collect();

    // Apply status filter
    if (args.status && args.status !== "all") {
      allCreations = allCreations.filter((c) => c.status === args.status);
    }

    // Apply search
    if (search) {
      const searchLower = search.toLowerCase();
      allCreations = allCreations.filter((c) =>
        c.title.toLowerCase().includes(searchLower)
      );
    }

    // Sort by creation date (newest first)
    allCreations.sort((a, b) => b.createdAt - a.createdAt);

    // Paginate
    const paginatedCreations = allCreations.slice(offset, offset + limit);

    // Get creator info
    const creationsWithCreator = await Promise.all(
      paginatedCreations.map(async (creation) => {
        const creator = await ctx.db.get(creation.creatorId);
        const reports = await ctx.db
          .query("reports")
          .withIndex("by_creation", (q) => q.eq("creationId", creation._id))
          .collect();

        let thumbnailUrl = null;
        if (creation.thumbnailId) {
          thumbnailUrl = await ctx.storage.getUrl(creation.thumbnailId);
        }

        return {
          _id: creation._id,
          title: creation.title,
          category: creation.category,
          status: creation.status,
          createdAt: creation.createdAt,
          likeCount: creation.likeCount,
          viewCount: creation.viewCount,
          thumbnailUrl,
          creator: creator
            ? {
                _id: creator._id,
                battleTag: creator.battleTag,
                banned: creator.banned,
              }
            : null,
          reportCount: reports.length,
          pendingReports: reports.filter((r) => r.status === "pending").length,
        };
      })
    );

    return {
      creations: creationsWithCreator,
      total: allCreations.length,
      hasMore: offset + limit < allCreations.length,
    };
  },
});

/**
 * Hide a creation (soft moderation)
 */
export const hideCreation = mutation({
  args: {
    sessionToken: v.string(),
    creationId: v.id("creations"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const moderator = await verifyModeratorSession(ctx, args.sessionToken);

    const creation = await ctx.db.get(args.creationId);
    if (!creation) {
      throw new Error("Creation not found");
    }

    if (creation.status === "hidden") {
      throw new Error("Creation is already hidden");
    }

    const previousStatus = creation.status;

    // Hide the creation
    await ctx.db.patch(args.creationId, { status: "hidden" });

    // Log the action
    await logAuditEvent(ctx, {
      actorId: moderator._id,
      actorRole: moderator.role,
      actorIdentifier: moderator.battleTag,
      action: "content.hidden",
      targetType: "creation",
      targetId: args.creationId,
      targetIdentifier: creation.title,
      details: JSON.stringify({ reason: args.reason, previousStatus }),
      metadata: {
        previousValue: previousStatus,
        newValue: "hidden",
        reason: args.reason,
      },
      severity: "warning",
    });

    return { success: true };
  },
});

/**
 * Restore a hidden creation
 */
export const restoreCreation = mutation({
  args: {
    sessionToken: v.string(),
    creationId: v.id("creations"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const moderator = await verifyModeratorSession(ctx, args.sessionToken);

    const creation = await ctx.db.get(args.creationId);
    if (!creation) {
      throw new Error("Creation not found");
    }

    if (creation.status === "published") {
      throw new Error("Creation is already published");
    }

    const previousStatus = creation.status;

    // Restore the creation
    await ctx.db.patch(args.creationId, { status: "published" });

    // Log the action
    await logAuditEvent(ctx, {
      actorId: moderator._id,
      actorRole: moderator.role,
      actorIdentifier: moderator.battleTag,
      action: "content.restored",
      targetType: "creation",
      targetId: args.creationId,
      targetIdentifier: creation.title,
      details: args.reason ? JSON.stringify({ reason: args.reason, previousStatus }) : undefined,
      metadata: {
        previousValue: previousStatus,
        newValue: "published",
        reason: args.reason,
      },
      severity: "info",
    });

    return { success: true };
  },
});

// ===== DASHBOARD STATS =====

/**
 * Get admin dashboard statistics
 */
export const getDashboardStats = query({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    await verifyAdminSession(ctx, args.sessionToken);

    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;

    // User stats
    const allUsers = await ctx.db.query("users").collect();
    const newUsersToday = allUsers.filter((u) => u.createdAt > oneDayAgo).length;
    const newUsersThisWeek = allUsers.filter((u) => u.createdAt > oneWeekAgo).length;
    const bannedUsers = allUsers.filter((u) => u.banned).length;
    const activeUsersToday = allUsers.filter((u) => u.lastLoginAt > oneDayAgo).length;

    // Creation stats
    const allCreations = await ctx.db.query("creations").collect();
    const newCreationsToday = allCreations.filter((c) => c.createdAt > oneDayAgo).length;
    const newCreationsThisWeek = allCreations.filter((c) => c.createdAt > oneWeekAgo).length;
    const publishedCreations = allCreations.filter((c) => c.status === "published").length;
    const hiddenCreations = allCreations.filter((c) => c.status === "hidden").length;

    // Report stats
    const allReports = await ctx.db.query("reports").collect();
    const pendingReports = allReports.filter((r) => r.status === "pending").length;
    const reportsToday = allReports.filter((r) => r.createdAt > oneDayAgo).length;

    // Engagement stats
    const totalLikes = allCreations.reduce((sum, c) => sum + c.likeCount, 0);
    const totalViews = allCreations.reduce((sum, c) => sum + c.viewCount, 0);

    // Recent critical events
    const criticalLogs = await ctx.db
      .query("auditLogs")
      .withIndex("by_severity", (q) => q.eq("severity", "critical"))
      .order("desc")
      .take(5);

    return {
      users: {
        total: allUsers.length,
        newToday: newUsersToday,
        newThisWeek: newUsersThisWeek,
        banned: bannedUsers,
        activeToday: activeUsersToday,
        admins: allUsers.filter((u) => u.role === "admin").length,
        moderators: allUsers.filter((u) => u.role === "moderator").length,
      },
      creations: {
        total: allCreations.length,
        newToday: newCreationsToday,
        newThisWeek: newCreationsThisWeek,
        published: publishedCreations,
        hidden: hiddenCreations,
        deleted: allCreations.filter((c) => c.status === "deleted").length,
      },
      reports: {
        total: allReports.length,
        pending: pendingReports,
        today: reportsToday,
      },
      engagement: {
        totalLikes,
        totalViews,
      },
      recentCriticalEvents: criticalLogs,
    };
  },
});

// ===== VERIFICATION BADGES =====

/**
 * Toggle verified status for a user (admin only)
 */
export const toggleVerification = mutation({
  args: {
    sessionToken: v.string(),
    userId: v.id("users"),
    verified: v.boolean(),
  },
  handler: async (ctx, args) => {
    const admin = await verifyAdminSession(ctx, args.sessionToken);

    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser) {
      throw new Error("User not found");
    }

    const now = Date.now();

    await ctx.db.patch(args.userId, {
      isVerified: args.verified,
      verifiedAt: args.verified ? now : undefined,
      verifiedBy: args.verified ? admin._id : undefined,
    });

    // Log the action
    await logAuditEvent(ctx, {
      actorId: admin._id,
      actorRole: admin.role,
      actorIdentifier: admin.battleTag,
      action: args.verified ? "admin.user_role_changed" : "admin.user_role_changed",
      targetType: "user",
      targetId: args.userId,
      targetIdentifier: targetUser.battleTag,
      details: JSON.stringify({
        action: args.verified ? "verified" : "unverified",
      }),
      severity: "info",
    });

    return { success: true, verified: args.verified };
  },
});

/**
 * Get list of verified users
 */
export const getVerifiedUsers = query({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    await verifyModeratorSession(ctx, args.sessionToken);

    const allUsers = await ctx.db.query("users").collect();
    const verifiedUsers = allUsers.filter((u) => u.isVerified === true);

    return verifiedUsers.map((u) => ({
      _id: u._id,
      battleTag: u.battleTag,
      avatarUrl: u.avatarUrl,
      verifiedAt: u.verifiedAt,
    }));
  },
});

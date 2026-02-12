import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";

// ===== TYPES =====

export type AuditAction =
  | "auth.login"
  | "auth.logout"
  | "auth.session_rotated"
  | "auth.login_failed"
  | "user.profile_updated"
  | "user.account_deleted"
  | "user.social_connected"
  | "user.social_disconnected"
  | "admin.user_banned"
  | "admin.user_unbanned"
  | "admin.user_role_changed"
  | "admin.user_warned"
  | "admin.strike_issued"
  | "admin.strike_appealed"
  | "admin.strike_overturned"
  | "admin.strike_expired"
  | "admin.user_reviewed"
  | "content.created"
  | "content.updated"
  | "content.deleted"
  | "content.hidden"
  | "content.restored"
  | "comment.created"
  | "comment.edited"
  | "comment.deleted"
  | "comment.hidden"
  | "badge.awarded"
  | "badge.manual_award"
  | "moderation.report_submitted"
  | "moderation.report_reviewed"
  | "moderation.report_dismissed"
  | "moderation.report_actioned"
  | "moderation.image_rejected"
  | "security.rate_limited"
  | "security.suspicious_activity"
  | "system.game_data_synced"
  | "system.sessions_cleaned"
  | "system.error";

export type AuditSeverity = "info" | "warning" | "error" | "critical";
export type AuditTargetType = "user" | "creation" | "comment" | "badge" | "report" | "session" | "system";

interface AuditLogParams {
  actorId?: Id<"users">;
  actorRole?: string;
  actorIdentifier: string;
  action: AuditAction;
  targetType?: AuditTargetType;
  targetId?: string;
  targetIdentifier?: string;
  details?: string;
  metadata?: {
    ip?: string;
    userAgent?: string;
    previousValue?: string;
    newValue?: string;
    reason?: string;
  };
  severity: AuditSeverity;
}

// ===== INTERNAL HELPER =====

/**
 * Log an audit event (internal helper - use from other mutations)
 */
export async function logAuditEvent(
  ctx: MutationCtx,
  params: AuditLogParams
): Promise<Id<"auditLogs">> {
  return await ctx.db.insert("auditLogs", {
    actorId: params.actorId,
    actorRole: params.actorRole,
    actorIdentifier: params.actorIdentifier,
    action: params.action,
    targetType: params.targetType,
    targetId: params.targetId,
    targetIdentifier: params.targetIdentifier,
    details: params.details,
    metadata: params.metadata,
    severity: params.severity,
    createdAt: Date.now(),
  });
}

// ===== INTERNAL MUTATION (for use from other Convex functions) =====

export const log = internalMutation({
  args: {
    actorId: v.optional(v.id("users")),
    actorRole: v.optional(v.string()),
    actorIdentifier: v.string(),
    action: v.union(
      v.literal("auth.login"),
      v.literal("auth.logout"),
      v.literal("auth.session_rotated"),
      v.literal("auth.login_failed"),
      v.literal("user.profile_updated"),
      v.literal("user.account_deleted"),
      v.literal("user.social_connected"),
      v.literal("user.social_disconnected"),
      v.literal("admin.user_banned"),
      v.literal("admin.user_unbanned"),
      v.literal("admin.user_role_changed"),
      v.literal("admin.user_warned"),
      v.literal("content.created"),
      v.literal("content.updated"),
      v.literal("content.deleted"),
      v.literal("content.hidden"),
      v.literal("content.restored"),
      v.literal("moderation.report_submitted"),
      v.literal("moderation.report_reviewed"),
      v.literal("moderation.report_dismissed"),
      v.literal("moderation.report_actioned"),
      v.literal("moderation.image_rejected"),
      v.literal("security.rate_limited"),
      v.literal("security.suspicious_activity"),
      v.literal("system.game_data_synced"),
      v.literal("system.sessions_cleaned"),
      v.literal("system.error")
    ),
    targetType: v.optional(v.union(
      v.literal("user"),
      v.literal("creation"),
      v.literal("report"),
      v.literal("session"),
      v.literal("system")
    )),
    targetId: v.optional(v.string()),
    targetIdentifier: v.optional(v.string()),
    details: v.optional(v.string()),
    metadata: v.optional(v.object({
      ip: v.optional(v.string()),
      userAgent: v.optional(v.string()),
      previousValue: v.optional(v.string()),
      newValue: v.optional(v.string()),
      reason: v.optional(v.string()),
    })),
    severity: v.union(
      v.literal("info"),
      v.literal("warning"),
      v.literal("error"),
      v.literal("critical")
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("auditLogs", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

// ===== QUERIES =====

/**
 * Get recent audit logs (admin only)
 */
export const getRecent = query({
  args: {
    sessionToken: v.string(),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
    filters: v.optional(v.object({
      action: v.optional(v.string()),
      actorId: v.optional(v.id("users")),
      targetType: v.optional(v.string()),
      severity: v.optional(v.string()),
      startDate: v.optional(v.number()),
      endDate: v.optional(v.number()),
    })),
  },
  handler: async (ctx, args) => {
    // Verify admin session
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.sessionToken))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      throw new Error("Unauthorized");
    }

    const user = await ctx.db.get(session.userId);
    if (!user || user.role !== "admin") {
      throw new Error("Forbidden: Admin access required");
    }

    const limit = Math.min(args.limit || 50, 100);
    const offset = args.offset || 0;

    // Get logs with optional filters
    let logsQuery = ctx.db
      .query("auditLogs")
      .withIndex("by_created")
      .order("desc");

    const allLogs = await logsQuery.collect();

    // Apply filters
    let filteredLogs = allLogs;

    if (args.filters) {
      const { action, actorId, targetType, severity, startDate, endDate } = args.filters;

      filteredLogs = allLogs.filter((log) => {
        if (action && log.action !== action) return false;
        if (actorId && log.actorId !== actorId) return false;
        if (targetType && log.targetType !== targetType) return false;
        if (severity && log.severity !== severity) return false;
        if (startDate && log.createdAt < startDate) return false;
        if (endDate && log.createdAt > endDate) return false;
        return true;
      });
    }

    // Paginate
    const paginatedLogs = filteredLogs.slice(offset, offset + limit);

    // Enrich with actor details
    const enrichedLogs = await Promise.all(
      paginatedLogs.map(async (log) => {
        let actorDetails = null;
        if (log.actorId) {
          const actor = await ctx.db.get(log.actorId);
          if (actor) {
            actorDetails = {
              battleTag: actor.battleTag,
              role: actor.role,
            };
          }
        }

        return {
          ...log,
          actorDetails,
        };
      })
    );

    return {
      logs: enrichedLogs,
      total: filteredLogs.length,
      hasMore: offset + limit < filteredLogs.length,
    };
  },
});

/**
 * Get audit logs for a specific user
 */
export const getByUser = query({
  args: {
    sessionToken: v.string(),
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Verify admin/moderator session
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.sessionToken))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      throw new Error("Unauthorized");
    }

    const user = await ctx.db.get(session.userId);
    if (!user || (user.role !== "admin" && user.role !== "moderator")) {
      throw new Error("Forbidden: Admin or moderator access required");
    }

    const limit = Math.min(args.limit || 50, 100);

    // Get logs where user is actor OR target
    const actorLogs = await ctx.db
      .query("auditLogs")
      .withIndex("by_actor", (q) => q.eq("actorId", args.userId))
      .order("desc")
      .take(limit);

    const targetLogs = await ctx.db
      .query("auditLogs")
      .withIndex("by_target", (q) =>
        q.eq("targetType", "user").eq("targetId", args.userId)
      )
      .order("desc")
      .take(limit);

    // Merge and sort
    const allLogs = [...actorLogs, ...targetLogs]
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);

    // Deduplicate by ID
    const seen = new Set<string>();
    const uniqueLogs = allLogs.filter((log) => {
      if (seen.has(log._id)) return false;
      seen.add(log._id);
      return true;
    });

    return uniqueLogs;
  },
});

/**
 * Get audit stats for dashboard
 */
export const getStats = query({
  args: {
    sessionToken: v.string(),
    timeRange: v.optional(v.union(
      v.literal("24h"),
      v.literal("7d"),
      v.literal("30d")
    )),
  },
  handler: async (ctx, args) => {
    // Verify admin session
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.sessionToken))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      throw new Error("Unauthorized");
    }

    const user = await ctx.db.get(session.userId);
    if (!user || user.role !== "admin") {
      throw new Error("Forbidden: Admin access required");
    }

    const now = Date.now();
    const timeRange = args.timeRange || "24h";
    const cutoff = now - (
      timeRange === "24h" ? 24 * 60 * 60 * 1000 :
      timeRange === "7d" ? 7 * 24 * 60 * 60 * 1000 :
      30 * 24 * 60 * 60 * 1000
    );

    const allLogs = await ctx.db
      .query("auditLogs")
      .withIndex("by_created")
      .filter((q) => q.gte(q.field("createdAt"), cutoff))
      .collect();

    // Count by action type
    const actionCounts: Record<string, number> = {};
    const severityCounts: Record<string, number> = { info: 0, warning: 0, error: 0, critical: 0 };

    for (const log of allLogs) {
      actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
      severityCounts[log.severity] = (severityCounts[log.severity] || 0) + 1;
    }

    // Get unique actors
    const uniqueActors = new Set(allLogs.map((l) => l.actorId).filter(Boolean));

    return {
      total: allLogs.length,
      timeRange,
      byAction: actionCounts,
      bySeverity: severityCounts,
      uniqueActors: uniqueActors.size,
      recentCritical: allLogs
        .filter((l) => l.severity === "critical")
        .slice(0, 5),
    };
  },
});

/**
 * Search audit logs
 */
export const search = query({
  args: {
    sessionToken: v.string(),
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Verify admin session
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.sessionToken))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      throw new Error("Unauthorized");
    }

    const user = await ctx.db.get(session.userId);
    if (!user || user.role !== "admin") {
      throw new Error("Forbidden: Admin access required");
    }

    const searchQuery = args.query.toLowerCase();
    const limit = Math.min(args.limit || 50, 100);

    // Search in recent logs
    const allLogs = await ctx.db
      .query("auditLogs")
      .withIndex("by_created")
      .order("desc")
      .take(1000); // Search in last 1000 logs

    const matchingLogs = allLogs.filter((log) => {
      return (
        log.actorIdentifier.toLowerCase().includes(searchQuery) ||
        log.action.toLowerCase().includes(searchQuery) ||
        (log.targetIdentifier?.toLowerCase().includes(searchQuery)) ||
        (log.details?.toLowerCase().includes(searchQuery))
      );
    }).slice(0, limit);

    return matchingLogs;
  },
});

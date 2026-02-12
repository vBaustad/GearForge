import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { logAuditEvent } from "./auditLog";

/**
 * Security monitoring thresholds and patterns.
 * Detects suspicious activity and triggers alerts.
 */

// Thresholds for detecting suspicious patterns
const SECURITY_THRESHOLDS = {
  // Multiple failed logins from same IP
  failedLogins: { count: 5, windowMs: 15 * 60 * 1000 }, // 5 failures in 15 min

  // Rate limit hits from same identifier
  rateLimitHits: { count: 10, windowMs: 5 * 60 * 1000 }, // 10 hits in 5 min

  // Multiple accounts from same IP (potential sock puppets)
  accountsPerIp: { count: 3, windowMs: 24 * 60 * 60 * 1000 }, // 3 accounts in 24h

  // Rapid social connections (potential account hijacking attempt)
  socialConnects: { count: 5, windowMs: 60 * 60 * 1000 }, // 5 connects in 1h

  // Critical events threshold
  criticalEvents: { count: 3, windowMs: 60 * 60 * 1000 }, // 3 critical events in 1h
} as const;

/**
 * Record a security event for monitoring.
 * This is called from various parts of the application.
 */
export const recordSecurityEvent = mutation({
  args: {
    eventType: v.union(
      v.literal("failed_login"),
      v.literal("rate_limit_hit"),
      v.literal("account_created"),
      v.literal("social_connect"),
      v.literal("suspicious_request"),
      v.literal("invalid_session"),
      v.literal("csrf_failure")
    ),
    identifier: v.string(), // IP address or user ID
    metadata: v.optional(
      v.object({
        ip: v.optional(v.string()),
        userAgent: v.optional(v.string()),
        action: v.optional(v.string()),
        details: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Store the security event
    await ctx.db.insert("securityEvents", {
      eventType: args.eventType,
      identifier: args.identifier,
      metadata: args.metadata,
      createdAt: now,
    });

    // Check for suspicious patterns
    const alerts: string[] = [];

    // Check failed logins
    if (args.eventType === "failed_login") {
      const recentFailures = await ctx.db
        .query("securityEvents")
        .withIndex("by_identifier_type", (q) =>
          q.eq("identifier", args.identifier).eq("eventType", "failed_login")
        )
        .filter((q) =>
          q.gte(q.field("createdAt"), now - SECURITY_THRESHOLDS.failedLogins.windowMs)
        )
        .collect();

      if (recentFailures.length >= SECURITY_THRESHOLDS.failedLogins.count) {
        alerts.push(
          `Brute force attempt detected: ${recentFailures.length} failed logins from ${args.identifier}`
        );
      }
    }

    // Check rate limit abuse
    if (args.eventType === "rate_limit_hit") {
      const recentHits = await ctx.db
        .query("securityEvents")
        .withIndex("by_identifier_type", (q) =>
          q.eq("identifier", args.identifier).eq("eventType", "rate_limit_hit")
        )
        .filter((q) =>
          q.gte(q.field("createdAt"), now - SECURITY_THRESHOLDS.rateLimitHits.windowMs)
        )
        .collect();

      if (recentHits.length >= SECURITY_THRESHOLDS.rateLimitHits.count) {
        alerts.push(
          `Rate limit abuse detected: ${recentHits.length} hits from ${args.identifier}`
        );
      }
    }

    // Check CSRF failures (always suspicious)
    if (args.eventType === "csrf_failure") {
      alerts.push(
        `CSRF attack attempt from ${args.identifier}: ${args.metadata?.details || "No details"}`
      );
    }

    // Log alerts to audit log
    for (const alert of alerts) {
      await logAuditEvent(ctx, {
        actorIdentifier: args.identifier,
        action: "security.suspicious_activity",
        details: alert,
        metadata: args.metadata,
        severity: "critical",
      });

      // Store alert for dashboard
      await ctx.db.insert("securityAlerts", {
        alertType: args.eventType,
        identifier: args.identifier,
        message: alert,
        metadata: args.metadata,
        acknowledged: false,
        createdAt: now,
      });
    }

    return { alertsTriggered: alerts.length };
  },
});

/**
 * Get recent security alerts (admin only).
 */
export const getAlerts = query({
  args: {
    sessionToken: v.string(),
    includeAcknowledged: v.optional(v.boolean()),
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

    const limit = Math.min(args.limit || 50, 100);

    let alertsQuery = ctx.db
      .query("securityAlerts")
      .withIndex("by_created")
      .order("desc");

    const alerts = await alertsQuery.take(limit * 2); // Get extra to filter

    const filtered = args.includeAcknowledged
      ? alerts
      : alerts.filter((a) => !a.acknowledged);

    return filtered.slice(0, limit);
  },
});

/**
 * Acknowledge a security alert (admin only).
 */
export const acknowledgeAlert = mutation({
  args: {
    sessionToken: v.string(),
    alertId: v.id("securityAlerts"),
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

    await ctx.db.patch(args.alertId, {
      acknowledged: true,
      acknowledgedBy: user._id,
      acknowledgedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Get security dashboard stats (admin only).
 */
export const getDashboardStats = query({
  args: {
    sessionToken: v.string(),
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
    const last24h = now - 24 * 60 * 60 * 1000;
    const last7d = now - 7 * 24 * 60 * 60 * 1000;

    // Get recent security events
    const recentEvents = await ctx.db
      .query("securityEvents")
      .withIndex("by_created")
      .filter((q) => q.gte(q.field("createdAt"), last24h))
      .collect();

    // Count by type
    const eventsByType: Record<string, number> = {};
    for (const event of recentEvents) {
      eventsByType[event.eventType] = (eventsByType[event.eventType] || 0) + 1;
    }

    // Get unacknowledged alerts
    const unacknowledgedAlerts = await ctx.db
      .query("securityAlerts")
      .withIndex("by_created")
      .filter((q) => q.eq(q.field("acknowledged"), false))
      .collect();

    // Get unique suspicious IPs (last 7 days)
    const suspiciousEvents = await ctx.db
      .query("securityEvents")
      .withIndex("by_created")
      .filter((q) => q.gte(q.field("createdAt"), last7d))
      .collect();

    const suspiciousIps = new Set<string>();
    for (const event of suspiciousEvents) {
      if (
        event.eventType === "failed_login" ||
        event.eventType === "rate_limit_hit" ||
        event.eventType === "csrf_failure"
      ) {
        suspiciousIps.add(event.identifier);
      }
    }

    return {
      last24h: {
        totalEvents: recentEvents.length,
        byType: eventsByType,
      },
      unacknowledgedAlerts: unacknowledgedAlerts.length,
      criticalAlerts: unacknowledgedAlerts.filter(
        (a) => a.alertType === "csrf_failure" || a.alertType === "failed_login"
      ).length,
      suspiciousIpsLast7d: suspiciousIps.size,
      topSuspiciousIps: Array.from(suspiciousIps).slice(0, 10),
    };
  },
});

/**
 * Cleanup old security events (cron job).
 * Keeps events for 30 days.
 * This is a public mutation called by cron jobs.
 */
export const cleanupOldEvents = mutation({
  args: {},
  handler: async (ctx) => {
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

    // Delete old security events
    const oldEvents = await ctx.db
      .query("securityEvents")
      .withIndex("by_created")
      .filter((q) => q.lt(q.field("createdAt"), thirtyDaysAgo))
      .take(500);

    for (const event of oldEvents) {
      await ctx.db.delete(event._id);
    }

    // Delete old acknowledged alerts (keep for 7 days after acknowledgment)
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const oldAlerts = await ctx.db
      .query("securityAlerts")
      .filter((q) =>
        q.and(
          q.eq(q.field("acknowledged"), true),
          q.lt(q.field("acknowledgedAt"), sevenDaysAgo)
        )
      )
      .take(100);

    for (const alert of oldAlerts) {
      await ctx.db.delete(alert._id);
    }

    return {
      deletedEvents: oldEvents.length,
      deletedAlerts: oldAlerts.length,
    };
  },
});

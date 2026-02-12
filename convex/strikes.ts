import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { logAuditEvent } from "./auditLog";

// Strike thresholds
const STRIKE_THRESHOLDS = {
  REVIEW_FLAG: 3,      // Flag for mod review at 3 points
  WARNING: 5,          // System warning at 5 points
  TEMP_RESTRICTION: 7, // Temporary posting restriction at 7 points
  BAN_REVIEW: 10,      // Auto-flag for ban review at 10 points
};

// Strike expiry in days (strikes decay over time for good behavior)
const STRIKE_EXPIRY_DAYS = 90;

// Severity to points mapping
const SEVERITY_POINTS: Record<string, number> = {
  minor: 1,
  moderate: 2,
  severe: 3,
};

// Issue a strike to a user
export const issueStrike = mutation({
  args: {
    sessionToken: v.string(),
    userId: v.id("users"),
    reason: v.union(
      v.literal("report_actioned"),
      v.literal("content_violation"),
      v.literal("spam"),
      v.literal("harassment"),
      v.literal("manipulation"),
      v.literal("other")
    ),
    severity: v.union(
      v.literal("minor"),
      v.literal("moderate"),
      v.literal("severe")
    ),
    relatedReportId: v.optional(v.id("reports")),
    relatedCreationId: v.optional(v.id("creations")),
    notes: v.optional(v.string()),
    userMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Verify session is mod/admin
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.sessionToken))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      throw new Error("Unauthorized: Invalid or expired session");
    }

    const issuer = await ctx.db.get(session.userId);
    if (!issuer || issuer.banned) {
      throw new Error("Unauthorized: User not found or banned");
    }

    if (issuer.role !== "moderator" && issuer.role !== "admin") {
      throw new Error("Forbidden: Only moderators can issue strikes");
    }

    // Get target user
    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser) {
      throw new Error("User not found");
    }

    // Can't strike mods/admins unless you're admin
    if ((targetUser.role === "moderator" || targetUser.role === "admin") && issuer.role !== "admin") {
      throw new Error("Forbidden: Cannot issue strikes to moderators");
    }

    const now = Date.now();
    const points = SEVERITY_POINTS[args.severity];
    const expiresAt = now + STRIKE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

    // Create the strike record
    const strikeId = await ctx.db.insert("userStrikes", {
      userId: args.userId,
      reason: args.reason,
      severity: args.severity,
      points,
      relatedReportId: args.relatedReportId,
      relatedCreationId: args.relatedCreationId,
      issuedBy: issuer._id,
      issuedByRole: issuer.role,
      notes: args.notes,
      userMessage: args.userMessage,
      status: "active",
      createdAt: now,
      expiresAt,
    });

    // Update user's strike count
    const currentStrikes = targetUser.strikeCount ?? 0;
    const totalStrikes = targetUser.totalStrikes ?? 0;
    const newStrikeCount = currentStrikes + points;

    // Determine if user should be flagged for review
    const shouldFlag = newStrikeCount >= STRIKE_THRESHOLDS.REVIEW_FLAG;

    await ctx.db.patch(args.userId, {
      strikeCount: newStrikeCount,
      totalStrikes: totalStrikes + points,
      lastStrikeAt: now,
      flaggedForReview: shouldFlag || targetUser.flaggedForReview,
    });

    // Log the strike
    await logAuditEvent(ctx, {
      actorId: issuer._id,
      actorRole: issuer.role,
      actorIdentifier: issuer.battleTag,
      action: "admin.strike_issued",
      targetType: "user",
      targetId: args.userId,
      targetIdentifier: targetUser.battleTag,
      details: JSON.stringify({
        strikeId,
        reason: args.reason,
        severity: args.severity,
        points,
        newTotalStrikes: newStrikeCount,
        threshold: newStrikeCount >= STRIKE_THRESHOLDS.BAN_REVIEW ? "ban_review" :
                   newStrikeCount >= STRIKE_THRESHOLDS.TEMP_RESTRICTION ? "temp_restriction" :
                   newStrikeCount >= STRIKE_THRESHOLDS.WARNING ? "warning" :
                   newStrikeCount >= STRIKE_THRESHOLDS.REVIEW_FLAG ? "review_flag" : null,
      }),
      severity: args.severity === "severe" ? "warning" : "info",
    });

    return {
      strikeId,
      newStrikeCount,
      flaggedForReview: shouldFlag,
      thresholdReached: newStrikeCount >= STRIKE_THRESHOLDS.BAN_REVIEW ? "ban_review" :
                        newStrikeCount >= STRIKE_THRESHOLDS.TEMP_RESTRICTION ? "temp_restriction" :
                        newStrikeCount >= STRIKE_THRESHOLDS.WARNING ? "warning" :
                        newStrikeCount >= STRIKE_THRESHOLDS.REVIEW_FLAG ? "review_flag" : null,
    };
  },
});

// Get strikes for a user
export const getByUser = query({
  args: {
    userId: v.id("users"),
    includeExpired: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let strikes;

    if (args.includeExpired) {
      strikes = await ctx.db
        .query("userStrikes")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .order("desc")
        .collect();
    } else {
      strikes = await ctx.db
        .query("userStrikes")
        .withIndex("by_user_status", (q) =>
          q.eq("userId", args.userId).eq("status", "active")
        )
        .order("desc")
        .collect();
    }

    // Enrich with issuer info
    const enrichedStrikes = await Promise.all(
      strikes.map(async (strike) => {
        const issuer = await ctx.db.get(strike.issuedBy);
        let relatedCreation = null;
        if (strike.relatedCreationId) {
          relatedCreation = await ctx.db.get(strike.relatedCreationId);
        }
        return {
          ...strike,
          issuerName: issuer?.battleTag ?? "Unknown",
          relatedCreationTitle: relatedCreation?.title,
        };
      })
    );

    return enrichedStrikes;
  },
});

// Get users flagged for review
export const getFlaggedUsers = query({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify session is mod/admin
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.sessionToken))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      return [];
    }

    const user = await ctx.db.get(session.userId);
    if (!user || user.banned || (user.role !== "moderator" && user.role !== "admin")) {
      return [];
    }

    // Get flagged users
    const flaggedUsers = await ctx.db
      .query("users")
      .withIndex("by_flagged", (q) => q.eq("flaggedForReview", true))
      .collect();

    // Sort by strike count descending
    flaggedUsers.sort((a, b) => (b.strikeCount ?? 0) - (a.strikeCount ?? 0));

    return flaggedUsers.map((u) => ({
      _id: u._id,
      battleTag: u.battleTag,
      avatarUrl: u.avatarUrl,
      strikeCount: u.strikeCount ?? 0,
      totalStrikes: u.totalStrikes ?? 0,
      lastStrikeAt: u.lastStrikeAt,
      createdAt: u.createdAt,
      role: u.role,
    }));
  },
});

// Appeal a strike (user action)
export const appealStrike = mutation({
  args: {
    sessionToken: v.string(),
    strikeId: v.id("userStrikes"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify session
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.sessionToken))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      throw new Error("Unauthorized: Please log in");
    }

    const user = await ctx.db.get(session.userId);
    if (!user || user.banned) {
      throw new Error("Unauthorized: User not found or banned");
    }

    // Get the strike
    const strike = await ctx.db.get(args.strikeId);
    if (!strike) {
      throw new Error("Strike not found");
    }

    // Verify ownership
    if (strike.userId !== user._id) {
      throw new Error("Forbidden: This strike does not belong to you");
    }

    // Can only appeal active strikes
    if (strike.status !== "active") {
      throw new Error("This strike cannot be appealed");
    }

    const now = Date.now();

    await ctx.db.patch(args.strikeId, {
      status: "appealed",
      appealedAt: now,
      appealReason: args.reason.trim().slice(0, 1000),
    });

    // Log the appeal
    await logAuditEvent(ctx, {
      actorId: user._id,
      actorRole: user.role,
      actorIdentifier: user.battleTag,
      action: "admin.strike_appealed",
      targetType: "user",
      targetId: user._id,
      targetIdentifier: user.battleTag,
      details: JSON.stringify({
        strikeId: args.strikeId,
        reason: strike.reason,
      }),
      severity: "info",
    });

    return { success: true };
  },
});

// Review an appealed strike (mod action)
export const reviewAppeal = mutation({
  args: {
    sessionToken: v.string(),
    strikeId: v.id("userStrikes"),
    decision: v.union(v.literal("uphold"), v.literal("overturn")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Verify session is mod/admin
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.sessionToken))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      throw new Error("Unauthorized: Invalid or expired session");
    }

    const reviewer = await ctx.db.get(session.userId);
    if (!reviewer || reviewer.banned) {
      throw new Error("Unauthorized: User not found or banned");
    }

    if (reviewer.role !== "moderator" && reviewer.role !== "admin") {
      throw new Error("Forbidden: Only moderators can review appeals");
    }

    // Get the strike
    const strike = await ctx.db.get(args.strikeId);
    if (!strike) {
      throw new Error("Strike not found");
    }

    if (strike.status !== "appealed") {
      throw new Error("This strike is not under appeal");
    }

    const now = Date.now();
    const targetUser = await ctx.db.get(strike.userId);

    if (args.decision === "overturn") {
      // Overturn: remove strike points from user
      await ctx.db.patch(args.strikeId, {
        status: "overturned",
        reviewedAt: now,
        reviewedBy: reviewer._id,
        notes: args.notes,
      });

      if (targetUser) {
        const newStrikeCount = Math.max(0, (targetUser.strikeCount ?? 0) - strike.points);
        await ctx.db.patch(strike.userId, {
          strikeCount: newStrikeCount,
          flaggedForReview: newStrikeCount >= STRIKE_THRESHOLDS.REVIEW_FLAG,
        });
      }

      await logAuditEvent(ctx, {
        actorId: reviewer._id,
        actorRole: reviewer.role,
        actorIdentifier: reviewer.battleTag,
        action: "admin.strike_overturned",
        targetType: "user",
        targetId: strike.userId,
        targetIdentifier: targetUser?.battleTag ?? "Unknown",
        details: JSON.stringify({
          strikeId: args.strikeId,
          reason: strike.reason,
          pointsRemoved: strike.points,
        }),
        severity: "info",
      });
    } else {
      // Uphold: keep the strike, just mark as reviewed
      await ctx.db.patch(args.strikeId, {
        status: "active",
        reviewedAt: now,
        reviewedBy: reviewer._id,
        notes: args.notes,
        appealedAt: undefined,
        appealReason: undefined,
      });

      await logAuditEvent(ctx, {
        actorId: reviewer._id,
        actorRole: reviewer.role,
        actorIdentifier: reviewer.battleTag,
        action: "admin.strike_issued", // Reusing, as appeal was denied
        targetType: "user",
        targetId: strike.userId,
        targetIdentifier: targetUser?.battleTag ?? "Unknown",
        details: JSON.stringify({
          strikeId: args.strikeId,
          action: "appeal_denied",
        }),
        severity: "info",
      });
    }

    return { success: true, decision: args.decision };
  },
});

// Clear review flag after admin reviews user
export const clearReviewFlag = mutation({
  args: {
    sessionToken: v.string(),
    userId: v.id("users"),
    action: v.union(
      v.literal("cleared"),       // No action needed
      v.literal("warned"),        // Sent warning
      v.literal("banned")         // Banned user
    ),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Verify session is mod/admin
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.sessionToken))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      throw new Error("Unauthorized");
    }

    const reviewer = await ctx.db.get(session.userId);
    if (!reviewer || reviewer.banned) {
      throw new Error("Unauthorized");
    }

    if (reviewer.role !== "moderator" && reviewer.role !== "admin") {
      throw new Error("Forbidden");
    }

    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser) {
      throw new Error("User not found");
    }

    await ctx.db.patch(args.userId, {
      flaggedForReview: false,
    });

    await logAuditEvent(ctx, {
      actorId: reviewer._id,
      actorRole: reviewer.role,
      actorIdentifier: reviewer.battleTag,
      action: "admin.user_reviewed",
      targetType: "user",
      targetId: args.userId,
      targetIdentifier: targetUser.battleTag,
      details: JSON.stringify({
        action: args.action,
        strikeCount: targetUser.strikeCount,
        notes: args.notes,
      }),
      severity: args.action === "banned" ? "warning" : "info",
    });

    return { success: true };
  },
});

// Get pending appeals
export const getPendingAppeals = query({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify session is mod/admin
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.sessionToken))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      return [];
    }

    const user = await ctx.db.get(session.userId);
    if (!user || user.banned || (user.role !== "moderator" && user.role !== "admin")) {
      return [];
    }

    const appeals = await ctx.db
      .query("userStrikes")
      .withIndex("by_status", (q) => q.eq("status", "appealed"))
      .order("asc")
      .collect();

    // Enrich with user info
    const enrichedAppeals = await Promise.all(
      appeals.map(async (appeal) => {
        const targetUser = await ctx.db.get(appeal.userId);
        const issuer = await ctx.db.get(appeal.issuedBy);
        return {
          ...appeal,
          userName: targetUser?.battleTag ?? "Unknown",
          userAvatarUrl: targetUser?.avatarUrl,
          issuerName: issuer?.battleTag ?? "Unknown",
        };
      })
    );

    return enrichedAppeals;
  },
});

// Get strike statistics
export const getStats = query({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify session is mod/admin
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.sessionToken))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      return null;
    }

    const user = await ctx.db.get(session.userId);
    if (!user || user.banned || (user.role !== "moderator" && user.role !== "admin")) {
      return null;
    }

    // Get all strikes in last 30 days
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

    const recentStrikes = await ctx.db
      .query("userStrikes")
      .filter((q) => q.gte(q.field("createdAt"), thirtyDaysAgo))
      .collect();

    const activeStrikes = recentStrikes.filter((s) => s.status === "active").length;
    const appealedStrikes = recentStrikes.filter((s) => s.status === "appealed").length;
    const overturnedStrikes = recentStrikes.filter((s) => s.status === "overturned").length;

    // Get flagged users count
    const flaggedUsers = await ctx.db
      .query("users")
      .withIndex("by_flagged", (q) => q.eq("flaggedForReview", true))
      .collect();

    return {
      last30Days: {
        total: recentStrikes.length,
        active: activeStrikes,
        appealed: appealedStrikes,
        overturned: overturnedStrikes,
      },
      flaggedUsersCount: flaggedUsers.length,
      appealRate: recentStrikes.length > 0
        ? Math.round((appealedStrikes + overturnedStrikes) / recentStrikes.length * 100)
        : 0,
      overturnRate: (appealedStrikes + overturnedStrikes) > 0
        ? Math.round(overturnedStrikes / (appealedStrikes + overturnedStrikes) * 100)
        : 0,
    };
  },
});

// Auto-expire old strikes (cron job)
export const expireOldStrikes = mutation({
  handler: async (ctx) => {
    const now = Date.now();

    // Find active strikes that have passed their expiration date
    const expiredStrikes = await ctx.db
      .query("userStrikes")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .filter((q) =>
        q.and(
          q.neq(q.field("expiresAt"), undefined),
          q.lt(q.field("expiresAt"), now)
        )
      )
      .take(100); // Process in batches

    let expired = 0;
    for (const strike of expiredStrikes) {
      await ctx.db.patch(strike._id, { status: "expired" });

      // Update user's strike count
      const user = await ctx.db.get(strike.userId);
      if (user && (user.strikeCount ?? 0) > 0) {
        await ctx.db.patch(strike.userId, {
          strikeCount: Math.max(0, (user.strikeCount ?? 0) - strike.points),
        });
      }

      // Log the expiration
      await logAuditEvent(ctx, {
        actorId: undefined,
        actorRole: undefined,
        actorIdentifier: "system",
        action: "admin.strike_expired",
        targetType: "user",
        targetId: strike.userId,
        details: JSON.stringify({ strikeId: strike._id, points: strike.points }),
        severity: "info",
      });

      expired++;
    }

    return { expired, hasMore: expiredStrikes.length === 100 };
  },
});

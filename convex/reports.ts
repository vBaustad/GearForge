import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { enforceRateLimit } from "./rateLimit";
import { logAuditEvent } from "./auditLog";

// Submit a report (requires authenticated session)
export const submit = mutation({
  args: {
    creationId: v.id("creations"),
    sessionToken: v.string(),
    reason: v.union(
      v.literal("inappropriate"),
      v.literal("spam"),
      v.literal("stolen"),
      v.literal("broken"),
      v.literal("other")
    ),
    details: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Verify session and get current user
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.sessionToken))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      throw new Error("Unauthorized: Please log in to report designs");
    }

    const user = await ctx.db.get(session.userId);
    if (!user || user.banned) {
      throw new Error("Unauthorized: User not found or banned");
    }

    // Check if user already reported this creation
    const existingReport = await ctx.db
      .query("reports")
      .withIndex("by_creation", (q) => q.eq("creationId", args.creationId))
      .filter((q) => q.eq(q.field("reporterId"), user._id))
      .first();

    if (existingReport) {
      throw new Error("You have already reported this design");
    }

    // Rate limit: 5 reports per hour
    await enforceRateLimit(ctx, user._id, "create_report");

    // Get creation info for logging
    const creation = await ctx.db.get(args.creationId);

    // Create the report
    const reportId = await ctx.db.insert("reports", {
      creationId: args.creationId,
      reporterId: user._id, // Derived from session
      reason: args.reason,
      details: args.details,
      status: "pending",
      createdAt: Date.now(),
    });

    // Log report submission
    await logAuditEvent(ctx, {
      actorId: user._id,
      actorRole: user.role,
      actorIdentifier: user.battleTag,
      action: "moderation.report_submitted",
      targetType: "report",
      targetId: reportId,
      targetIdentifier: creation?.title ?? "Unknown",
      details: JSON.stringify({ reason: args.reason }),
      severity: "info",
    });

    return reportId;
  },
});

// Check if user has already reported a creation
export const hasReported = query({
  args: {
    creationId: v.id("creations"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const report = await ctx.db
      .query("reports")
      .withIndex("by_creation", (q) => q.eq("creationId", args.creationId))
      .filter((q) => q.eq(q.field("reporterId"), args.userId))
      .first();

    return report !== null;
  },
});

// Get pending reports (for moderators)
export const getPending = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;

    const reports = await ctx.db
      .query("reports")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .order("asc")
      .take(limit);

    // Enrich with creation and reporter info
    const enrichedReports = await Promise.all(
      reports.map(async (report) => {
        const creation = await ctx.db.get(report.creationId);
        const reporter = await ctx.db.get(report.reporterId);

        return {
          ...report,
          creationTitle: creation?.title ?? "Deleted",
          reporterName: reporter?.battleTag ?? "Unknown",
        };
      })
    );

    return enrichedReports;
  },
});

// Update report status (moderators and admins only)
export const updateStatus = mutation({
  args: {
    reportId: v.id("reports"),
    status: v.union(
      v.literal("reviewed"),
      v.literal("dismissed"),
      v.literal("actioned")
    ),
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify session and get current user
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.sessionToken))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      throw new Error("Unauthorized: Invalid or expired session");
    }

    const user = await ctx.db.get(session.userId);
    if (!user || user.banned) {
      throw new Error("Unauthorized: User not found or banned");
    }

    // Check for moderator or admin role
    if (user.role !== "moderator" && user.role !== "admin") {
      throw new Error("Forbidden: Only moderators can review reports");
    }

    // Get report for logging
    const report = await ctx.db.get(args.reportId);
    const creation = report ? await ctx.db.get(report.creationId) : null;

    await ctx.db.patch(args.reportId, {
      status: args.status,
      reviewedAt: Date.now(),
      reviewedBy: user._id,
    });

    // Log report review
    const actionMap: Record<string, "moderation.report_reviewed" | "moderation.report_dismissed" | "moderation.report_actioned"> = {
      reviewed: "moderation.report_reviewed",
      dismissed: "moderation.report_dismissed",
      actioned: "moderation.report_actioned",
    };

    await logAuditEvent(ctx, {
      actorId: user._id,
      actorRole: user.role,
      actorIdentifier: user.battleTag,
      action: actionMap[args.status],
      targetType: "report",
      targetId: args.reportId,
      targetIdentifier: creation?.title ?? "Unknown",
      details: JSON.stringify({ newStatus: args.status }),
      severity: args.status === "actioned" ? "warning" : "info",
    });
  },
});

// Strike thresholds (duplicated from strikes.ts for reference)
const STRIKE_THRESHOLDS = {
  REVIEW_FLAG: 3,
  BAN_REVIEW: 10,
};

const SEVERITY_POINTS: Record<string, number> = {
  minor: 1,
  moderate: 2,
  severe: 3,
};

const STRIKE_EXPIRY_DAYS = 90;

// Action a report with strike (combines report action + strike issuance)
export const actionWithStrike = mutation({
  args: {
    reportId: v.id("reports"),
    sessionToken: v.string(),
    // Strike options
    strikeSeverity: v.union(
      v.literal("minor"),
      v.literal("moderate"),
      v.literal("severe")
    ),
    strikeNotes: v.optional(v.string()),
    userMessage: v.optional(v.string()),
    // Content action
    hideContent: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Verify session and get current user
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.sessionToken))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      throw new Error("Unauthorized: Invalid or expired session");
    }

    const moderator = await ctx.db.get(session.userId);
    if (!moderator || moderator.banned) {
      throw new Error("Unauthorized: User not found or banned");
    }

    if (moderator.role !== "moderator" && moderator.role !== "admin") {
      throw new Error("Forbidden: Only moderators can action reports");
    }

    // Get the report
    const report = await ctx.db.get(args.reportId);
    if (!report) {
      throw new Error("Report not found");
    }

    if (report.status !== "pending") {
      throw new Error("Report has already been reviewed");
    }

    // Get the creation and its owner
    const creation = await ctx.db.get(report.creationId);
    if (!creation) {
      throw new Error("Creation not found");
    }

    const contentOwner = await ctx.db.get(creation.creatorId);
    if (!contentOwner) {
      throw new Error("Content owner not found");
    }

    const now = Date.now();
    const points = SEVERITY_POINTS[args.strikeSeverity];
    const expiresAt = now + STRIKE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

    // 1. Mark report as actioned
    await ctx.db.patch(args.reportId, {
      status: "actioned",
      reviewedAt: now,
      reviewedBy: moderator._id,
    });

    // 2. Create strike for content owner
    const strikeId = await ctx.db.insert("userStrikes", {
      userId: creation.creatorId,
      reason: "report_actioned",
      severity: args.strikeSeverity,
      points,
      relatedReportId: args.reportId,
      relatedCreationId: report.creationId,
      issuedBy: moderator._id,
      issuedByRole: moderator.role,
      notes: args.strikeNotes,
      userMessage: args.userMessage ?? `Your design "${creation.title}" was reported and action was taken.`,
      status: "active",
      createdAt: now,
      expiresAt,
    });

    // 3. Update user's strike count
    const currentStrikes = contentOwner.strikeCount ?? 0;
    const totalStrikes = contentOwner.totalStrikes ?? 0;
    const newStrikeCount = currentStrikes + points;
    const shouldFlag = newStrikeCount >= STRIKE_THRESHOLDS.REVIEW_FLAG;

    await ctx.db.patch(creation.creatorId, {
      strikeCount: newStrikeCount,
      totalStrikes: totalStrikes + points,
      lastStrikeAt: now,
      flaggedForReview: shouldFlag || contentOwner.flaggedForReview,
    });

    // 4. Optionally hide the content
    if (args.hideContent) {
      await ctx.db.patch(report.creationId, {
        status: "hidden",
      });
    }

    // 5. Log the action
    await logAuditEvent(ctx, {
      actorId: moderator._id,
      actorRole: moderator.role,
      actorIdentifier: moderator.battleTag,
      action: "moderation.report_actioned",
      targetType: "report",
      targetId: args.reportId,
      targetIdentifier: creation.title,
      details: JSON.stringify({
        strikeId,
        strikeSeverity: args.strikeSeverity,
        strikePoints: points,
        contentHidden: args.hideContent ?? false,
        contentOwnerId: creation.creatorId,
        contentOwnerStrikes: newStrikeCount,
        flaggedForReview: shouldFlag,
      }),
      severity: "warning",
    });

    await logAuditEvent(ctx, {
      actorId: moderator._id,
      actorRole: moderator.role,
      actorIdentifier: moderator.battleTag,
      action: "admin.strike_issued",
      targetType: "user",
      targetId: creation.creatorId,
      targetIdentifier: contentOwner.battleTag,
      details: JSON.stringify({
        strikeId,
        reason: "report_actioned",
        severity: args.strikeSeverity,
        points,
        reportId: args.reportId,
        creationTitle: creation.title,
        newTotalStrikes: newStrikeCount,
      }),
      severity: args.strikeSeverity === "severe" ? "warning" : "info",
    });

    return {
      strikeId,
      newStrikeCount,
      flaggedForReview: shouldFlag,
      needsBanReview: newStrikeCount >= STRIKE_THRESHOLDS.BAN_REVIEW,
    };
  },
});

// Get reports grouped by content owner (to identify patterns)
export const getByContentOwner = query({
  args: {
    sessionToken: v.string(),
    userId: v.id("users"),
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

    // Get all creations by this user
    const creations = await ctx.db
      .query("creations")
      .withIndex("by_creator", (q) => q.eq("creatorId", args.userId))
      .collect();

    // Get reports for each creation
    const allReports = [];
    for (const creation of creations) {
      const reports = await ctx.db
        .query("reports")
        .withIndex("by_creation", (q) => q.eq("creationId", creation._id))
        .collect();

      for (const report of reports) {
        const reporter = await ctx.db.get(report.reporterId);
        allReports.push({
          ...report,
          creationTitle: creation.title,
          reporterName: reporter?.battleTag ?? "Unknown",
        });
      }
    }

    // Sort by date descending
    allReports.sort((a, b) => b.createdAt - a.createdAt);

    return allReports;
  },
});

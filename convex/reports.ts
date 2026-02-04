import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { enforceRateLimit } from "./rateLimit";

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

    // Create the report
    const reportId = await ctx.db.insert("reports", {
      creationId: args.creationId,
      reporterId: user._id, // Derived from session
      reason: args.reason,
      details: args.details,
      status: "pending",
      createdAt: Date.now(),
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

    await ctx.db.patch(args.reportId, {
      status: args.status,
      reviewedAt: Date.now(),
      reviewedBy: user._id,
    });
  },
});

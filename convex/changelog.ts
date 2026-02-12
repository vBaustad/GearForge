import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Helper to verify admin session
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

// List all changelog entries (public)
export const list = query({
  args: {
    limit: v.optional(v.number()),
    type: v.optional(
      v.union(
        v.literal("feature"),
        v.literal("improvement"),
        v.literal("fix"),
        v.literal("announcement")
      )
    ),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;

    let entries = await ctx.db
      .query("changelogEntries")
      .withIndex("by_published")
      .order("desc")
      .take(limit);

    if (args.type) {
      entries = entries.filter((entry) => entry.type === args.type);
    }

    return Promise.all(
      entries.map(async (entry) => {
        const author = await ctx.db.get(entry.authorId);
        return {
          ...entry,
          authorName: author?.battleTag ?? "GearForge Team",
        };
      })
    );
  },
});

// Get a single changelog entry
export const getById = query({
  args: { id: v.id("changelogEntries") },
  handler: async (ctx, args) => {
    const entry = await ctx.db.get(args.id);
    if (!entry) return null;

    const author = await ctx.db.get(entry.authorId);
    return {
      ...entry,
      authorName: author?.battleTag ?? "GearForge Team",
    };
  },
});

// Get latest changelog entry (for notification badge)
export const getLatest = query({
  handler: async (ctx) => {
    const entry = await ctx.db
      .query("changelogEntries")
      .withIndex("by_published")
      .order("desc")
      .first();

    return entry
      ? {
          _id: entry._id,
          version: entry.version,
          title: entry.title,
          type: entry.type,
          publishedAt: entry.publishedAt,
        }
      : null;
  },
});

// Create a new changelog entry (admin only)
export const create = mutation({
  args: {
    sessionToken: v.string(),
    version: v.string(),
    title: v.string(),
    content: v.string(),
    type: v.union(
      v.literal("feature"),
      v.literal("improvement"),
      v.literal("fix"),
      v.literal("announcement")
    ),
  },
  handler: async (ctx, args) => {
    const admin = await verifyAdminSession(ctx, args.sessionToken);

    const now = Date.now();
    const entryId = await ctx.db.insert("changelogEntries", {
      version: args.version.trim(),
      title: args.title.trim(),
      content: args.content,
      type: args.type,
      authorId: admin._id,
      publishedAt: now,
      createdAt: now,
    });

    return entryId;
  },
});

// Update a changelog entry (admin only)
export const update = mutation({
  args: {
    sessionToken: v.string(),
    id: v.id("changelogEntries"),
    version: v.optional(v.string()),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    type: v.optional(
      v.union(
        v.literal("feature"),
        v.literal("improvement"),
        v.literal("fix"),
        v.literal("announcement")
      )
    ),
  },
  handler: async (ctx, args) => {
    await verifyAdminSession(ctx, args.sessionToken);

    const entry = await ctx.db.get(args.id);
    if (!entry) {
      throw new Error("Changelog entry not found");
    }

    const updates: Record<string, unknown> = {};

    if (args.version !== undefined) updates.version = args.version.trim();
    if (args.title !== undefined) updates.title = args.title.trim();
    if (args.content !== undefined) updates.content = args.content;
    if (args.type !== undefined) updates.type = args.type;

    await ctx.db.patch(args.id, updates);
    return { success: true };
  },
});

// Delete a changelog entry (admin only)
export const remove = mutation({
  args: {
    sessionToken: v.string(),
    id: v.id("changelogEntries"),
  },
  handler: async (ctx, args) => {
    await verifyAdminSession(ctx, args.sessionToken);

    const entry = await ctx.db.get(args.id);
    if (!entry) {
      throw new Error("Changelog entry not found");
    }

    await ctx.db.delete(args.id);
    return { success: true };
  },
});

// Group entries by version for display
export const listGroupedByVersion = query({
  handler: async (ctx) => {
    const entries = await ctx.db
      .query("changelogEntries")
      .withIndex("by_published")
      .order("desc")
      .collect();

    // Group by version
    const grouped: Record<
      string,
      {
        version: string;
        publishedAt: number;
        entries: Array<{
          _id: string;
          title: string;
          content: string;
          type: string;
        }>;
      }
    > = {};

    for (const entry of entries) {
      if (!grouped[entry.version]) {
        grouped[entry.version] = {
          version: entry.version,
          publishedAt: entry.publishedAt,
          entries: [],
        };
      }
      grouped[entry.version].entries.push({
        _id: entry._id,
        title: entry.title,
        content: entry.content,
        type: entry.type,
      });
    }

    return Object.values(grouped).sort((a, b) => b.publishedAt - a.publishedAt);
  },
});

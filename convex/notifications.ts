import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";

// Notification grouping window (1 hour)
const GROUP_WINDOW_MS = 60 * 60 * 1000;

// ===== INTERNAL HELPER =====

/**
 * Create a notification with optional grouping
 * Groups similar notifications (e.g., multiple likes on same design)
 */
export async function createNotification(
  ctx: MutationCtx,
  params: {
    recipientId: Id<"users">;
    type: "like" | "comment" | "reply" | "follow" | "new_design" | "comment_like" | "badge_earned";
    actorId?: Id<"users">;
    creationId?: Id<"creations">;
    commentId?: Id<"comments">;
    badgeType?: string;
  }
) {
  const { recipientId, type, actorId, creationId, commentId, badgeType } = params;

  // Don't notify yourself
  if (actorId && actorId === recipientId) {
    return null;
  }

  // Generate group key for aggregatable notifications
  let groupKey: string | undefined;
  if (type === "like" && creationId) {
    groupKey = `like:${creationId}`;
  } else if (type === "follow" && actorId) {
    groupKey = `follow:${recipientId}`;
  } else if (type === "comment_like" && commentId) {
    groupKey = `comment_like:${commentId}`;
  }

  // Check for existing grouped notification within the window
  if (groupKey) {
    const existing = await ctx.db
      .query("notifications")
      .withIndex("by_group_key", (q) => q.eq("groupKey", groupKey))
      .first();

    if (existing && Date.now() - existing.createdAt < GROUP_WINDOW_MS) {
      // Update existing notification
      await ctx.db.patch(existing._id, {
        actorId, // Update to most recent actor
        groupCount: (existing.groupCount || 1) + 1,
        read: false, // Mark as unread again
        createdAt: Date.now(), // Bump to top
      });
      return existing._id;
    }
  }

  // Create new notification
  const notificationId = await ctx.db.insert("notifications", {
    recipientId,
    type,
    actorId,
    creationId,
    commentId,
    badgeType,
    groupKey,
    groupCount: 1,
    read: false,
    createdAt: Date.now(),
  });

  return notificationId;
}

// Internal mutation for use from other Convex functions
export const create = internalMutation({
  args: {
    recipientId: v.id("users"),
    type: v.union(
      v.literal("like"),
      v.literal("comment"),
      v.literal("reply"),
      v.literal("follow"),
      v.literal("new_design"),
      v.literal("comment_like"),
      v.literal("badge_earned")
    ),
    actorId: v.optional(v.id("users")),
    creationId: v.optional(v.id("creations")),
    commentId: v.optional(v.id("comments")),
    badgeType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await createNotification(ctx, args);
  },
});

// ===== QUERIES =====

// Get notifications for a user (paginated)
export const getForUser = query({
  args: {
    sessionToken: v.string(),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.sessionToken))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      throw new Error("Unauthorized");
    }

    const limit = args.limit ?? 20;

    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_recipient", (q) => q.eq("recipientId", session.userId))
      .order("desc")
      .take(limit);

    // Enrich with actor and target details
    const enriched = await Promise.all(
      notifications.map(async (notification) => {
        let actor = null;
        let creation = null;
        let comment = null;

        if (notification.actorId) {
          const actorData = await ctx.db.get(notification.actorId);
          if (actorData) {
            actor = {
              _id: actorData._id,
              battleTag: actorData.battleTag,
              avatarUrl: actorData.avatarUrl,
            };
          }
        }

        if (notification.creationId) {
          const creationData = await ctx.db.get(notification.creationId);
          if (creationData) {
            let thumbnailUrl = null;
            if (creationData.thumbnailId) {
              thumbnailUrl = await ctx.storage.getUrl(creationData.thumbnailId);
            } else if (creationData.imageIds.length > 0) {
              thumbnailUrl = await ctx.storage.getUrl(creationData.imageIds[0]);
            }
            creation = {
              _id: creationData._id,
              title: creationData.title,
              thumbnailUrl,
            };
          }
        }

        if (notification.commentId) {
          const commentData = await ctx.db.get(notification.commentId);
          if (commentData) {
            comment = {
              _id: commentData._id,
              content: commentData.content.slice(0, 50),
            };
          }
        }

        return {
          ...notification,
          actor,
          creation,
          comment,
        };
      })
    );

    return enriched;
  },
});

// Get unread notification count
export const getUnreadCount = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.sessionToken))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      return 0;
    }

    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_recipient_unread", (q) =>
        q.eq("recipientId", session.userId).eq("read", false)
      )
      .collect();

    return unreadNotifications.length;
  },
});

// ===== MUTATIONS =====

// Mark a single notification as read
export const markRead = mutation({
  args: {
    sessionToken: v.string(),
    notificationId: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.sessionToken))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      throw new Error("Unauthorized");
    }

    const notification = await ctx.db.get(args.notificationId);
    if (!notification || notification.recipientId !== session.userId) {
      throw new Error("Notification not found");
    }

    await ctx.db.patch(args.notificationId, { read: true });
    return true;
  },
});

// Mark all notifications as read
export const markAllRead = mutation({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.sessionToken))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      throw new Error("Unauthorized");
    }

    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_recipient_unread", (q) =>
        q.eq("recipientId", session.userId).eq("read", false)
      )
      .collect();

    for (const notification of unreadNotifications) {
      await ctx.db.patch(notification._id, { read: true });
    }

    return { count: unreadNotifications.length };
  },
});

// Clean up old read notifications (cron job)
// Keeps unread notifications but removes read ones older than 30 days
export const cleanupOldNotifications = mutation({
  handler: async (ctx) => {
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

    // Get old read notifications
    const oldNotifications = await ctx.db
      .query("notifications")
      .filter((q) =>
        q.and(
          q.eq(q.field("read"), true),
          q.lt(q.field("createdAt"), thirtyDaysAgo)
        )
      )
      .take(500); // Process in batches

    for (const notification of oldNotifications) {
      await ctx.db.delete(notification._id);
    }

    return { deleted: oldNotifications.length, hasMore: oldNotifications.length === 500 };
  },
});

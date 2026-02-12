import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { enforceRateLimit } from "./rateLimit";
import { logAuditEvent } from "./auditLog";
import { createNotification } from "./notifications";
import { checkCommentBadges } from "./badges";

// Maximum comment depth (2 levels: top-level + replies)
const MAX_COMMENT_DEPTH = 2;
// Edit window in milliseconds (15 minutes)
const EDIT_WINDOW_MS = 15 * 60 * 1000;
// Max comment length
const MAX_COMMENT_LENGTH = 1000;

// ===== QUERIES =====

// Get comments for a creation (threaded)
export const getByCreation = query({
  args: {
    creationId: v.id("creations"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;

    // Get top-level comments
    const topLevelComments = await ctx.db
      .query("comments")
      .withIndex("by_creation", (q) =>
        q.eq("creationId", args.creationId).eq("status", "visible")
      )
      .order("desc")
      .take(limit);

    // Filter to only top-level (no parent) and enrich with author + replies
    const enrichedComments = await Promise.all(
      topLevelComments
        .filter((c) => !c.parentId)
        .map(async (comment) => {
          const author = await ctx.db.get(comment.authorId);

          // Get replies for this comment
          const replies = await ctx.db
            .query("comments")
            .withIndex("by_parent", (q) => q.eq("parentId", comment._id))
            .filter((q) => q.eq(q.field("status"), "visible"))
            .order("asc")
            .take(20);

          const enrichedReplies = await Promise.all(
            replies.map(async (reply) => {
              const replyAuthor = await ctx.db.get(reply.authorId);
              return {
                ...reply,
                author: replyAuthor
                  ? {
                      _id: replyAuthor._id,
                      battleTag: replyAuthor.battleTag,
                      avatarUrl: replyAuthor.avatarUrl,
                    }
                  : null,
              };
            })
          );

          return {
            ...comment,
            author: author
              ? {
                  _id: author._id,
                  battleTag: author.battleTag,
                  avatarUrl: author.avatarUrl,
                }
              : null,
            replies: enrichedReplies,
          };
        })
    );

    return enrichedComments;
  },
});

// Get comment count for a creation
export const getCount = query({
  args: { creationId: v.id("creations") },
  handler: async (ctx, args) => {
    const creation = await ctx.db.get(args.creationId);
    return creation?.commentCount ?? 0;
  },
});

// Get a user's comment history
export const getByUser = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    const comments = await ctx.db
      .query("comments")
      .withIndex("by_author", (q) => q.eq("authorId", args.userId))
      .order("desc")
      .take(limit);

    // Filter visible comments and enrich with creation info
    const enrichedComments = await Promise.all(
      comments
        .filter((c) => c.status === "visible")
        .map(async (comment) => {
          const creation = await ctx.db.get(comment.creationId);
          return {
            ...comment,
            creation: creation
              ? {
                  _id: creation._id,
                  title: creation.title,
                }
              : null,
          };
        })
    );

    return enrichedComments;
  },
});

// Check if user has liked a comment
export const hasLiked = query({
  args: {
    userId: v.id("users"),
    commentId: v.id("comments"),
  },
  handler: async (ctx, args) => {
    const like = await ctx.db
      .query("commentLikes")
      .withIndex("by_user_comment", (q) =>
        q.eq("userId", args.userId).eq("commentId", args.commentId)
      )
      .first();

    return like !== null;
  },
});

// ===== MUTATIONS =====

// Create a new comment or reply
export const create = mutation({
  args: {
    sessionToken: v.string(),
    creationId: v.id("creations"),
    content: v.string(),
    parentId: v.optional(v.id("comments")),
  },
  handler: async (ctx, args) => {
    // Verify session
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.sessionToken))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      throw new Error("Unauthorized: Please log in to comment");
    }

    const user = await ctx.db.get(session.userId);
    if (!user || user.banned) {
      throw new Error("Unauthorized: User not found or banned");
    }

    // Rate limit: 20 comments per hour
    await enforceRateLimit(ctx, user._id, "create_comment");

    // Validate content
    const content = args.content.trim();
    if (!content) {
      throw new Error("Comment cannot be empty");
    }
    if (content.length > MAX_COMMENT_LENGTH) {
      throw new Error(`Comment must be ${MAX_COMMENT_LENGTH} characters or less`);
    }

    // Check if creation exists
    const creation = await ctx.db.get(args.creationId);
    if (!creation || creation.status !== "published") {
      throw new Error("Design not found");
    }

    // If replying, check parent exists and depth
    let parentComment = null;
    if (args.parentId) {
      parentComment = await ctx.db.get(args.parentId);
      if (!parentComment || parentComment.status !== "visible") {
        throw new Error("Parent comment not found");
      }

      // Check depth - if parent already has a parent, we're at max depth
      if (parentComment.parentId) {
        throw new Error("Maximum reply depth reached");
      }
    }

    const now = Date.now();

    // Create the comment
    const commentId = await ctx.db.insert("comments", {
      creationId: args.creationId,
      authorId: user._id,
      parentId: args.parentId,
      content,
      likeCount: 0,
      replyCount: 0,
      status: "visible",
      createdAt: now,
    });

    // Update parent's reply count if this is a reply
    if (parentComment) {
      await ctx.db.patch(args.parentId!, {
        replyCount: (parentComment.replyCount || 0) + 1,
      });
    }

    // Update creation's comment count
    await ctx.db.patch(args.creationId, {
      commentCount: (creation.commentCount ?? 0) + 1,
    });

    // Log comment creation
    await logAuditEvent(ctx, {
      actorId: user._id,
      actorRole: user.role,
      actorIdentifier: user.battleTag,
      action: "comment.created",
      targetType: "comment",
      targetId: commentId,
      targetIdentifier: content.slice(0, 50),
      details: JSON.stringify({
        creationId: args.creationId,
        parentId: args.parentId,
      }),
      severity: "info",
    });

    // Send notifications
    if (parentComment) {
      // Notify the parent comment author about the reply
      await createNotification(ctx, {
        recipientId: parentComment.authorId,
        type: "reply",
        actorId: user._id,
        creationId: args.creationId,
        commentId: commentId,
      });
    } else {
      // Notify the creation owner about the comment
      await createNotification(ctx, {
        recipientId: creation.creatorId,
        type: "comment",
        actorId: user._id,
        creationId: args.creationId,
        commentId: commentId,
      });
    }

    // Check for comment-related badges
    await checkCommentBadges(ctx, user._id);

    return commentId;
  },
});

// Edit a comment (within 15 minute window, owner only)
export const edit = mutation({
  args: {
    sessionToken: v.string(),
    commentId: v.id("comments"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify session
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.sessionToken))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      throw new Error("Unauthorized: Please log in to edit comments");
    }

    const user = await ctx.db.get(session.userId);
    if (!user || user.banned) {
      throw new Error("Unauthorized: User not found or banned");
    }

    // Get the comment
    const comment = await ctx.db.get(args.commentId);
    if (!comment || comment.status !== "visible") {
      throw new Error("Comment not found");
    }

    // Check ownership
    if (comment.authorId !== user._id) {
      throw new Error("You can only edit your own comments");
    }

    // Check edit window
    const timeSinceCreation = Date.now() - comment.createdAt;
    if (timeSinceCreation > EDIT_WINDOW_MS) {
      throw new Error("Comments can only be edited within 15 minutes of posting");
    }

    // Validate content
    const content = args.content.trim();
    if (!content) {
      throw new Error("Comment cannot be empty");
    }
    if (content.length > MAX_COMMENT_LENGTH) {
      throw new Error(`Comment must be ${MAX_COMMENT_LENGTH} characters or less`);
    }

    // Update the comment
    await ctx.db.patch(args.commentId, {
      content,
      editedAt: Date.now(),
    });

    // Log edit
    await logAuditEvent(ctx, {
      actorId: user._id,
      actorRole: user.role,
      actorIdentifier: user.battleTag,
      action: "comment.edited",
      targetType: "comment",
      targetId: args.commentId,
      severity: "info",
    });

    return true;
  },
});

// Remove a comment (soft delete for owner, hide for mods)
export const remove = mutation({
  args: {
    sessionToken: v.string(),
    commentId: v.id("comments"),
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

    // Get the comment
    const comment = await ctx.db.get(args.commentId);
    if (!comment) {
      throw new Error("Comment not found");
    }

    const isOwner = comment.authorId === user._id;
    const isMod = user.role === "admin" || user.role === "moderator";

    if (!isOwner && !isMod) {
      throw new Error("You can only delete your own comments");
    }

    // Determine status: "deleted" for owner, "hidden" for mod action
    const newStatus = isOwner ? "deleted" : "hidden";

    await ctx.db.patch(args.commentId, {
      status: newStatus,
    });

    // Update creation's comment count
    const creation = await ctx.db.get(comment.creationId);
    if (creation) {
      await ctx.db.patch(comment.creationId, {
        commentCount: Math.max(0, (creation.commentCount ?? 1) - 1),
      });
    }

    // Update parent's reply count if this is a reply
    if (comment.parentId) {
      const parent = await ctx.db.get(comment.parentId);
      if (parent) {
        await ctx.db.patch(comment.parentId, {
          replyCount: Math.max(0, (parent.replyCount || 1) - 1),
        });
      }
    }

    // Log deletion
    await logAuditEvent(ctx, {
      actorId: user._id,
      actorRole: user.role,
      actorIdentifier: user.battleTag,
      action: isOwner ? "comment.deleted" : "comment.hidden",
      targetType: "comment",
      targetId: args.commentId,
      severity: isOwner ? "info" : "warning",
    });

    return true;
  },
});

// Toggle like on a comment
export const toggleLike = mutation({
  args: {
    sessionToken: v.string(),
    commentId: v.id("comments"),
  },
  handler: async (ctx, args) => {
    // Verify session
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.sessionToken))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      throw new Error("Unauthorized: Please log in to like comments");
    }

    const user = await ctx.db.get(session.userId);
    if (!user || user.banned) {
      throw new Error("Unauthorized: User not found or banned");
    }

    // Rate limit
    await enforceRateLimit(ctx, user._id, "toggle_comment_like");

    // Get the comment
    const comment = await ctx.db.get(args.commentId);
    if (!comment || comment.status !== "visible") {
      throw new Error("Comment not found");
    }

    // Check for existing like
    const existingLike = await ctx.db
      .query("commentLikes")
      .withIndex("by_user_comment", (q) =>
        q.eq("userId", user._id).eq("commentId", args.commentId)
      )
      .first();

    if (existingLike) {
      // Unlike
      await ctx.db.delete(existingLike._id);
      await ctx.db.patch(args.commentId, {
        likeCount: Math.max(0, comment.likeCount - 1),
      });
      return { liked: false, likeCount: Math.max(0, comment.likeCount - 1) };
    } else {
      // Like
      await ctx.db.insert("commentLikes", {
        userId: user._id,
        commentId: args.commentId,
        createdAt: Date.now(),
      });
      await ctx.db.patch(args.commentId, {
        likeCount: comment.likeCount + 1,
      });

      // Notify the comment author
      await createNotification(ctx, {
        recipientId: comment.authorId,
        type: "comment_like",
        actorId: user._id,
        commentId: args.commentId,
      });

      return { liked: true, likeCount: comment.likeCount + 1 };
    }
  },
});

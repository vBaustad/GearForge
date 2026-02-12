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

// List published blog posts
export const listPublished = query({
  args: {
    limit: v.optional(v.number()),
    tag: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    let posts = await ctx.db
      .query("blogPosts")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .order("desc")
      .take(limit);

    // Filter by tag if specified
    if (args.tag) {
      posts = posts.filter((post) => post.tags.includes(args.tag!));
    }

    const postsWithDetails = await Promise.all(
      posts.map(async (post) => {
        const author = await ctx.db.get(post.authorId);
        let coverUrl = null;
        if (post.coverImageId) {
          coverUrl = await ctx.storage.getUrl(post.coverImageId);
        }
        return {
          _id: post._id,
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          tags: post.tags,
          coverUrl,
          authorName: author?.battleTag ?? "GearForge",
          publishedAt: post.publishedAt,
          viewCount: post.viewCount,
        };
      })
    );

    return postsWithDetails;
  },
});

// Get a single blog post by slug
export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const post = await ctx.db
      .query("blogPosts")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (!post || post.status !== "published") return null;

    const author = await ctx.db.get(post.authorId);
    let coverUrl = null;
    if (post.coverImageId) {
      coverUrl = await ctx.storage.getUrl(post.coverImageId);
    }

    return {
      ...post,
      coverUrl,
      authorName: author?.battleTag ?? "GearForge",
      authorAvatarUrl: author?.avatarUrl,
    };
  },
});

// List all posts (admin only - includes drafts)
export const listAll = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    // Verify admin (we'll just check session exists for query)
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.sessionToken))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      return [];
    }

    const user = await ctx.db.get(session.userId);
    if (!user || user.role !== "admin") {
      return [];
    }

    const posts = await ctx.db
      .query("blogPosts")
      .order("desc")
      .collect();

    return Promise.all(
      posts.map(async (post) => {
        const author = await ctx.db.get(post.authorId);
        let coverUrl = null;
        if (post.coverImageId) {
          coverUrl = await ctx.storage.getUrl(post.coverImageId);
        }
        return {
          ...post,
          coverUrl,
          authorName: author?.battleTag ?? "GearForge",
        };
      })
    );
  },
});

// Create a new blog post (admin only)
export const create = mutation({
  args: {
    sessionToken: v.string(),
    title: v.string(),
    slug: v.string(),
    excerpt: v.string(),
    content: v.string(),
    tags: v.array(v.string()),
    coverImageId: v.optional(v.id("_storage")),
    status: v.union(v.literal("draft"), v.literal("published")),
  },
  handler: async (ctx, args) => {
    const admin = await verifyAdminSession(ctx, args.sessionToken);

    // Check slug uniqueness
    const existing = await ctx.db
      .query("blogPosts")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (existing) {
      throw new Error("A post with this slug already exists");
    }

    const now = Date.now();
    const postId = await ctx.db.insert("blogPosts", {
      title: args.title.trim(),
      slug: args.slug.toLowerCase().trim(),
      excerpt: args.excerpt.trim(),
      content: args.content,
      authorId: admin._id,
      coverImageId: args.coverImageId,
      tags: args.tags.slice(0, 10),
      status: args.status,
      publishedAt: args.status === "published" ? now : undefined,
      createdAt: now,
      updatedAt: now,
      viewCount: 0,
    });

    return postId;
  },
});

// Update a blog post (admin only)
export const update = mutation({
  args: {
    sessionToken: v.string(),
    id: v.id("blogPosts"),
    title: v.optional(v.string()),
    slug: v.optional(v.string()),
    excerpt: v.optional(v.string()),
    content: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    coverImageId: v.optional(v.id("_storage")),
    status: v.optional(v.union(v.literal("draft"), v.literal("published"))),
  },
  handler: async (ctx, args) => {
    await verifyAdminSession(ctx, args.sessionToken);

    const post = await ctx.db.get(args.id);
    if (!post) {
      throw new Error("Post not found");
    }

    const updates: Record<string, unknown> = { updatedAt: Date.now() };

    if (args.title !== undefined) updates.title = args.title.trim();
    if (args.excerpt !== undefined) updates.excerpt = args.excerpt.trim();
    if (args.content !== undefined) updates.content = args.content;
    if (args.tags !== undefined) updates.tags = args.tags.slice(0, 10);
    if (args.coverImageId !== undefined) updates.coverImageId = args.coverImageId;

    if (args.slug !== undefined && args.slug !== post.slug) {
      const newSlug = args.slug.toLowerCase().trim();
      // Check slug uniqueness
      const existing = await ctx.db
        .query("blogPosts")
        .withIndex("by_slug", (q) => q.eq("slug", newSlug))
        .first();
      if (existing) {
        throw new Error("A post with this slug already exists");
      }
      updates.slug = newSlug;
    }

    if (args.status !== undefined) {
      updates.status = args.status;
      if (args.status === "published" && !post.publishedAt) {
        updates.publishedAt = Date.now();
      }
    }

    await ctx.db.patch(args.id, updates);
    return { success: true };
  },
});

// Delete a blog post (admin only)
export const remove = mutation({
  args: {
    sessionToken: v.string(),
    id: v.id("blogPosts"),
  },
  handler: async (ctx, args) => {
    await verifyAdminSession(ctx, args.sessionToken);

    const post = await ctx.db.get(args.id);
    if (!post) {
      throw new Error("Post not found");
    }

    await ctx.db.delete(args.id);
    return { success: true };
  },
});

// Increment view count
export const incrementViews = mutation({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const post = await ctx.db
      .query("blogPosts")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (post && post.status === "published") {
      await ctx.db.patch(post._id, { viewCount: post.viewCount + 1 });
    }
  },
});

// Get unique tags from all published posts
export const getTags = query({
  handler: async (ctx) => {
    const posts = await ctx.db
      .query("blogPosts")
      .filter((q) => q.eq(q.field("status"), "published"))
      .collect();

    const tagCounts: Record<string, number> = {};
    for (const post of posts) {
      for (const tag of post.tags) {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      }
    }

    return Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);
  },
});

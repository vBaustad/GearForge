import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ===== USERS =====
  users: defineTable({
    battlenetId: v.string(),
    battleTag: v.string(),
    avatarUrl: v.optional(v.string()),
    createdAt: v.number(),
    lastLoginAt: v.number(),
    role: v.union(v.literal("user"), v.literal("moderator"), v.literal("admin")),
    banned: v.boolean(),
    // Social links
    twitchUrl: v.optional(v.string()),
    youtubeUrl: v.optional(v.string()),
    bio: v.optional(v.string()),
  })
    .index("by_battlenet_id", ["battlenetId"]),

  // ===== CREATIONS =====
  creations: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    importString: v.string(),

    // Images stored in Convex file storage
    imageIds: v.array(v.id("_storage")),
    thumbnailId: v.optional(v.id("_storage")),

    // Optional YouTube video showcase
    youtubeVideoId: v.optional(v.string()),

    // Categorization
    category: v.union(
      v.literal("bedroom"),
      v.literal("living_room"),
      v.literal("kitchen"),
      v.literal("garden"),
      v.literal("tavern"),
      v.literal("throne_room"),
      v.literal("workshop"),
      v.literal("library"),
      v.literal("exterior"),
      v.literal("other")
    ),
    tags: v.array(v.string()),

    // Items used in this creation
    items: v.array(
      v.object({
        decorId: v.number(),
        quantity: v.number(),
      })
    ),

    // Metadata
    creatorId: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),

    // Engagement (denormalized for performance)
    likeCount: v.number(),
    viewCount: v.number(),

    // Moderation
    status: v.union(
      v.literal("published"),
      v.literal("hidden"),
      v.literal("deleted")
    ),
  })
    .index("by_creator", ["creatorId"])
    .index("by_category", ["category", "createdAt"])
    .index("by_status_created", ["status", "createdAt"])
    .index("by_status_likes", ["status", "likeCount"]),

  // ===== LIKES =====
  likes: defineTable({
    userId: v.id("users"),
    creationId: v.id("creations"),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_creation", ["creationId"])
    .index("by_user_creation", ["userId", "creationId"]),

  // ===== SAVES (bookmarks) =====
  saves: defineTable({
    userId: v.id("users"),
    creationId: v.id("creations"),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_creation", ["creationId"])
    .index("by_user_creation", ["userId", "creationId"]),

  // ===== GAME DATA CACHE =====
  // Cache Blizzard decor items
  decorItems: defineTable({
    blizzardId: v.number(),
    name: v.string(),
    description: v.optional(v.string()),
    iconUrl: v.optional(v.string()),
    wowItemId: v.optional(v.number()), // WoW item ID for Wowhead linking
    category: v.optional(v.string()),
    source: v.optional(v.string()), // How to obtain (vendor, achievement, etc.)
    sourceDetails: v.optional(v.string()), // Additional source info
    cachedAt: v.number(),
  })
    .index("by_blizzard_id", ["blizzardId"])
    .index("by_category", ["category"]),

  // Cache Blizzard fixture items
  fixtureItems: defineTable({
    blizzardId: v.number(),
    name: v.string(),
    description: v.optional(v.string()),
    iconUrl: v.optional(v.string()),
    category: v.optional(v.string()),
    cachedAt: v.number(),
  })
    .index("by_blizzard_id", ["blizzardId"])
    .index("by_category", ["category"]),

  // Cache room types
  rooms: defineTable({
    blizzardId: v.number(),
    name: v.string(),
    description: v.optional(v.string()),
    cachedAt: v.number(),
  })
    .index("by_blizzard_id", ["blizzardId"]),

  // ===== SESSIONS (for auth) =====
  sessions: defineTable({
    userId: v.id("users"),
    token: v.string(),
    expiresAt: v.number(),
  })
    .index("by_token", ["token"])
    .index("by_user", ["userId"]),

  // ===== COLLECTIONS =====
  collections: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    ownerId: v.id("users"),
    isPublic: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_owner", ["ownerId"]),

  // ===== FOLLOWS =====
  follows: defineTable({
    followerId: v.id("users"),   // Who is following
    followingId: v.id("users"),  // Who is being followed
    createdAt: v.number(),
  })
    .index("by_follower", ["followerId"])
    .index("by_following", ["followingId"])
    .index("by_follower_following", ["followerId", "followingId"]),

  // ===== COLLECTION ITEMS =====
  collectionItems: defineTable({
    collectionId: v.id("collections"),
    creationId: v.id("creations"),
    addedAt: v.number(),
  })
    .index("by_collection", ["collectionId"])
    .index("by_creation", ["creationId"])
    .index("by_collection_creation", ["collectionId", "creationId"]),

  // ===== REPORTS (content moderation) =====
  reports: defineTable({
    creationId: v.id("creations"),
    reporterId: v.id("users"),
    reason: v.union(
      v.literal("inappropriate"),
      v.literal("spam"),
      v.literal("stolen"),
      v.literal("broken"),
      v.literal("other")
    ),
    details: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("reviewed"),
      v.literal("dismissed"),
      v.literal("actioned")
    ),
    createdAt: v.number(),
    reviewedAt: v.optional(v.number()),
    reviewedBy: v.optional(v.id("users")),
  })
    .index("by_creation", ["creationId"])
    .index("by_reporter", ["reporterId"])
    .index("by_status", ["status", "createdAt"]),

  // ===== RATE LIMITS =====
  rateLimits: defineTable({
    // Identifier: either a user ID or IP address for unauthenticated requests
    identifier: v.string(),
    // Action being rate limited (e.g., "create_design", "login", "report")
    action: v.string(),
    // Number of requests in the current window
    count: v.number(),
    // Window start time
    windowStart: v.number(),
  })
    .index("by_identifier_action", ["identifier", "action"]),

  // ===== SOCIAL CONNECTIONS (OAuth-verified streaming platforms) =====
  socialConnections: defineTable({
    userId: v.id("users"),
    platform: v.union(v.literal("twitch"), v.literal("youtube"), v.literal("kick")),
    platformId: v.string(),          // Unique ID from platform
    platformUsername: v.string(),    // Display username
    platformAvatarUrl: v.optional(v.string()),
    channelUrl: v.string(),          // Direct link to channel
    accessToken: v.string(),         // OAuth token (for validation)
    refreshToken: v.optional(v.string()),
    tokenExpiresAt: v.optional(v.number()),
    connectedAt: v.number(),
    lastValidatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_platform", ["userId", "platform"])
    .index("by_platform_id", ["platform", "platformId"]),
});

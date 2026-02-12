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
    bannedAt: v.optional(v.number()),
    bannedBy: v.optional(v.id("users")),
    banReason: v.optional(v.string()),
    // Strike system
    strikeCount: v.optional(v.number()),        // Current active strikes (decay over time or reset on appeal)
    totalStrikes: v.optional(v.number()),       // Lifetime strikes received
    flaggedForReview: v.optional(v.boolean()),  // Auto-flagged at strike thresholds
    lastStrikeAt: v.optional(v.number()),
    // Social links
    twitchUrl: v.optional(v.string()),
    youtubeUrl: v.optional(v.string()),
    bio: v.optional(v.string()),
    // Tip links for external payment platforms
    tipLinks: v.optional(v.object({
      buymeacoffee: v.optional(v.string()),
      kofi: v.optional(v.string()),
      paypal: v.optional(v.string()),
      patreon: v.optional(v.string()),
    })),
    // Badge count (denormalized for performance)
    badgeCount: v.optional(v.number()),
    // Verification badge (manually awarded by admins)
    isVerified: v.optional(v.boolean()),
    verifiedAt: v.optional(v.number()),
    verifiedBy: v.optional(v.id("users")),
    // Social counts (denormalized for performance)
    followerCount: v.optional(v.number()),
    followingCount: v.optional(v.number()),
    // Creator stats (denormalized for performance)
    totalLikesReceived: v.optional(v.number()),
    totalViewsReceived: v.optional(v.number()),
    designCount: v.optional(v.number()),
    // Linked WoW character for achievement tracking
    linkedCharacter: v.optional(v.object({
      region: v.union(v.literal("us"), v.literal("eu"), v.literal("kr"), v.literal("tw")),
      realmSlug: v.string(),
      realmName: v.string(),        // Display name (e.g., "Area 52")
      characterName: v.string(),
      characterLevel: v.optional(v.number()),
      lastSyncedAt: v.number(),
    })),
    // Cached completed achievement IDs (synced from Blizzard)
    completedAchievements: v.optional(v.array(v.number())),
    // Cached completed quest IDs (if available)
    completedQuests: v.optional(v.array(v.number())),
  })
    .index("by_battlenet_id", ["battlenetId"])
    .index("by_flagged", ["flaggedForReview", "strikeCount"])
    .index("by_total_likes", ["totalLikesReceived"]),

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
    commentCount: v.optional(v.number()),

    // Moderation
    status: v.union(
      v.literal("published"),
      v.literal("hidden"),
      v.literal("deleted")
    ),

    // Import string hash for duplicate detection (first 64 chars + length)
    importStringHash: v.optional(v.string()),

    // Remix/Inspired by feature - link to original design
    inspiredById: v.optional(v.id("creations")),
    remixCount: v.optional(v.number()), // Denormalized count of remixes
  })
    .index("by_creator", ["creatorId"])
    .index("by_category", ["category", "createdAt"])
    .index("by_status_created", ["status", "createdAt"])
    .index("by_status_likes", ["status", "likeCount"])
    .index("by_import_hash", ["importStringHash"])
    .index("by_inspired_by", ["inspiredById"]),

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
    subcategory: v.optional(v.string()), // e.g., "Ornamental" under "Accents"

    // Acquisition info
    source: v.optional(v.string()), // Primary source type: vendor, quest, achievement, profession, drop
    sourceDetails: v.optional(v.string()), // Additional source info

    // Vendor info
    vendorName: v.optional(v.string()),
    vendorLocation: v.optional(v.string()),

    // Cost info
    goldCost: v.optional(v.number()), // Cost in copper (divide by 10000 for gold)
    currencyType: v.optional(v.string()), // e.g., "Artisan's Acuity", "Resonance Crystals"
    currencyCost: v.optional(v.number()),

    // Achievement requirement
    achievementId: v.optional(v.number()),
    achievementName: v.optional(v.string()),

    // Profession crafting
    professionName: v.optional(v.string()),
    professionSkillRequired: v.optional(v.number()),

    // Quest info
    questId: v.optional(v.number()),
    questName: v.optional(v.string()),

    // Reputation requirement
    reputationFaction: v.optional(v.string()),
    reputationStanding: v.optional(v.string()), // Friendly, Honored, Revered, Exalted, etc.

    // Placement restrictions
    interiorOnly: v.optional(v.boolean()),
    budgetCost: v.optional(v.number()), // Decor budget cost

    cachedAt: v.number(),
    tooltipEnrichedAt: v.optional(v.number()), // When tooltip data was last fetched from Wowhead
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

  // Cache quest data (for linking quest names to IDs)
  quests: defineTable({
    questId: v.number(),
    name: v.string(),
    nameLower: v.string(), // Lowercase for case-insensitive lookup
    cachedAt: v.number(),
  })
    .index("by_quest_id", ["questId"])
    .index("by_name_lower", ["nameLower"]),

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
    // Denormalized counts
    itemCount: v.optional(v.number()),
    // Cover image (first item's thumbnail or custom)
    coverImageId: v.optional(v.id("_storage")),
  })
    .index("by_owner", ["ownerId"])
    .index("by_public", ["isPublic", "updatedAt"]),

  // ===== ROOM BUNDLES =====
  // Group multiple designs into a single "room" post
  roomBundles: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    creatorId: v.id("users"),
    // Designs included in this bundle
    designIds: v.array(v.id("creations")),
    // Cover image
    coverImageId: v.optional(v.id("_storage")),
    // Category for the overall room
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
    // Engagement
    likeCount: v.number(),
    viewCount: v.number(),
    // Status
    status: v.union(v.literal("published"), v.literal("hidden"), v.literal("deleted")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_creator", ["creatorId"])
    .index("by_status_created", ["status", "createdAt"])
    .index("by_category", ["category", "createdAt"]),

  // ===== ROOM BUNDLE LIKES =====
  roomBundleLikes: defineTable({
    userId: v.id("users"),
    bundleId: v.id("roomBundles"),
    createdAt: v.number(),
  })
    .index("by_user_bundle", ["userId", "bundleId"])
    .index("by_bundle", ["bundleId"]),

  // ===== BLOG POSTS =====
  blogPosts: defineTable({
    title: v.string(),
    slug: v.string(),
    excerpt: v.string(),
    content: v.string(), // Markdown content
    authorId: v.id("users"),
    coverImageId: v.optional(v.id("_storage")),
    tags: v.array(v.string()),
    status: v.union(v.literal("draft"), v.literal("published")),
    publishedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
    viewCount: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_status", ["status", "publishedAt"])
    .index("by_author", ["authorId"]),

  // ===== CHANGELOG ENTRIES =====
  changelogEntries: defineTable({
    version: v.string(), // e.g., "1.2.0"
    title: v.string(),
    content: v.string(), // Markdown content
    type: v.union(
      v.literal("feature"),
      v.literal("improvement"),
      v.literal("fix"),
      v.literal("announcement")
    ),
    authorId: v.id("users"),
    publishedAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_published", ["publishedAt"]),

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

  // ===== USER STRIKES =====
  userStrikes: defineTable({
    userId: v.id("users"),
    // What triggered the strike
    reason: v.union(
      v.literal("report_actioned"),         // Content was reported and action taken
      v.literal("content_violation"),       // Direct content policy violation
      v.literal("spam"),                    // Spam behavior
      v.literal("harassment"),              // Harassment of other users
      v.literal("manipulation"),            // Vote/report manipulation
      v.literal("other")                    // Other reasons
    ),
    // Severity affects strike weight
    severity: v.union(
      v.literal("minor"),    // 1 point - first offense, minor issue
      v.literal("moderate"), // 2 points - repeated or more serious
      v.literal("severe")    // 3 points - serious violation
    ),
    points: v.number(),                     // Strike points (1-3 based on severity)
    // Related entities
    relatedReportId: v.optional(v.id("reports")),
    relatedCreationId: v.optional(v.id("creations")),
    // Who issued it
    issuedBy: v.id("users"),
    issuedByRole: v.string(),
    // Notes
    notes: v.optional(v.string()),          // Mod notes (not shown to user)
    userMessage: v.optional(v.string()),    // Message shown to user
    // Status
    status: v.union(
      v.literal("active"),
      v.literal("appealed"),                // User appealed
      v.literal("overturned"),              // Appeal successful, strike removed
      v.literal("expired")                  // Strike expired after time period
    ),
    appealedAt: v.optional(v.number()),
    appealReason: v.optional(v.string()),
    reviewedAt: v.optional(v.number()),
    reviewedBy: v.optional(v.id("users")),
    // Timestamps
    createdAt: v.number(),
    expiresAt: v.optional(v.number()),      // When strike auto-expires (e.g., 90 days)
  })
    .index("by_user", ["userId", "createdAt"])
    .index("by_user_status", ["userId", "status"])
    .index("by_status", ["status", "createdAt"])
    .index("by_report", ["relatedReportId"]),

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

  // ===== COMMENTS =====
  comments: defineTable({
    creationId: v.id("creations"),
    authorId: v.id("users"),
    parentId: v.optional(v.id("comments")),  // null = top-level, set = reply (max 2 levels)
    content: v.string(),                      // Max 1000 chars
    editedAt: v.optional(v.number()),
    likeCount: v.number(),
    replyCount: v.number(),
    status: v.union(v.literal("visible"), v.literal("hidden"), v.literal("deleted")),
    createdAt: v.number(),
  })
    .index("by_creation", ["creationId", "status", "createdAt"])
    .index("by_parent", ["parentId"])
    .index("by_author", ["authorId"]),

  // ===== COMMENT LIKES =====
  commentLikes: defineTable({
    userId: v.id("users"),
    commentId: v.id("comments"),
    createdAt: v.number(),
  })
    .index("by_user_comment", ["userId", "commentId"])
    .index("by_comment", ["commentId"]),

  // ===== NOTIFICATIONS =====
  notifications: defineTable({
    recipientId: v.id("users"),
    type: v.union(
      v.literal("like"),           // Someone liked your design
      v.literal("comment"),        // Comment on your design
      v.literal("reply"),          // Reply to your comment
      v.literal("follow"),         // New follower
      v.literal("new_design"),     // Followed creator posted
      v.literal("comment_like"),   // Someone liked your comment
      v.literal("badge_earned")    // Earned a badge
    ),
    actorId: v.optional(v.id("users")),
    creationId: v.optional(v.id("creations")),
    commentId: v.optional(v.id("comments")),
    badgeType: v.optional(v.string()),
    groupKey: v.optional(v.string()),   // For aggregation: "like:creation123"
    groupCount: v.optional(v.number()), // "5 people liked..."
    read: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_recipient", ["recipientId", "createdAt"])
    .index("by_recipient_unread", ["recipientId", "read"])
    .index("by_group_key", ["groupKey"]),

  // ===== USER BADGES =====
  userBadges: defineTable({
    userId: v.id("users"),
    badgeType: v.union(
      v.literal("first_design"),       // Created first design
      v.literal("prolific_creator"),   // 10 designs
      v.literal("popular_creator"),    // 100 total likes received
      v.literal("viral_design"),       // Single design with 50+ likes
      v.literal("community_pillar"),   // 50+ followers
      v.literal("helpful_commenter"),  // 50+ comments
      v.literal("early_adopter"),      // Manual award for early users
      v.literal("featured_design")     // Design was featured (admin award)
    ),
    awardedAt: v.number(),
    relatedCreationId: v.optional(v.id("creations")),
  })
    .index("by_user", ["userId"])
    .index("by_user_badge", ["userId", "badgeType"]),

  // ===== AUDIT LOGS =====
  auditLogs: defineTable({
    // Who performed the action
    actorId: v.optional(v.id("users")),     // User who did it (null for system actions)
    actorRole: v.optional(v.string()),       // Role at time of action
    actorIdentifier: v.string(),             // BattleTag or "system" or IP

    // What action was performed
    action: v.union(
      // Auth events
      v.literal("auth.login"),
      v.literal("auth.logout"),
      v.literal("auth.session_rotated"),
      v.literal("auth.login_failed"),
      // User events
      v.literal("user.profile_updated"),
      v.literal("user.account_deleted"),
      v.literal("user.social_connected"),
      v.literal("user.social_disconnected"),
      // Admin actions on users
      v.literal("admin.user_banned"),
      v.literal("admin.user_unbanned"),
      v.literal("admin.user_role_changed"),
      v.literal("admin.user_warned"),
      v.literal("admin.strike_issued"),
      v.literal("admin.strike_appealed"),
      v.literal("admin.strike_overturned"),
      v.literal("admin.strike_expired"),
      v.literal("admin.user_reviewed"),
      // Content events
      v.literal("content.created"),
      v.literal("content.updated"),
      v.literal("content.deleted"),
      v.literal("content.hidden"),
      v.literal("content.restored"),
      // Comment events
      v.literal("comment.created"),
      v.literal("comment.edited"),
      v.literal("comment.deleted"),
      v.literal("comment.hidden"),
      // Badge events
      v.literal("badge.awarded"),
      v.literal("badge.manual_award"),
      // Moderation events
      v.literal("moderation.report_submitted"),
      v.literal("moderation.report_reviewed"),
      v.literal("moderation.report_dismissed"),
      v.literal("moderation.report_actioned"),
      v.literal("moderation.image_rejected"),
      // Security events
      v.literal("security.rate_limited"),
      v.literal("security.suspicious_activity"),
      // System events
      v.literal("system.game_data_synced"),
      v.literal("system.sessions_cleaned"),
      v.literal("system.error")
    ),

    // What was affected
    targetType: v.optional(v.union(
      v.literal("user"),
      v.literal("creation"),
      v.literal("comment"),
      v.literal("badge"),
      v.literal("report"),
      v.literal("session"),
      v.literal("system")
    )),
    targetId: v.optional(v.string()),        // ID of affected entity
    targetIdentifier: v.optional(v.string()), // Human-readable identifier (e.g., username, design title)

    // Details
    details: v.optional(v.string()),         // JSON string with additional context
    metadata: v.optional(v.object({
      ip: v.optional(v.string()),
      userAgent: v.optional(v.string()),
      previousValue: v.optional(v.string()),
      newValue: v.optional(v.string()),
      reason: v.optional(v.string()),
    })),

    // Severity level
    severity: v.union(
      v.literal("info"),
      v.literal("warning"),
      v.literal("error"),
      v.literal("critical")
    ),

    // Timestamp
    createdAt: v.number(),
  })
    .index("by_actor", ["actorId", "createdAt"])
    .index("by_action", ["action", "createdAt"])
    .index("by_target", ["targetType", "targetId", "createdAt"])
    .index("by_severity", ["severity", "createdAt"])
    .index("by_created", ["createdAt"]),

  // ===== SHOPPING LIST =====
  // Aggregated item checklist across multiple designs
  shoppingListItems: defineTable({
    userId: v.id("users"),
    decorId: v.number(),                    // Blizzard decor item ID
    // Quantity tracking
    quantityNeeded: v.number(),             // Total needed across all designs
    quantityAcquired: v.number(),           // How many the user has checked off
    // Track which designs this item comes from
    sourceDesigns: v.array(
      v.object({
        creationId: v.id("creations"),
        quantity: v.number(),               // Quantity from this specific design
        addedAt: v.number(),
      })
    ),
    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_decor", ["userId", "decorId"]),

  // ===== PLATFORM STATS (cached aggregations) =====
  platformStats: defineTable({
    key: v.literal("global"), // Single row for global stats
    designCount: v.number(),
    creatorCount: v.number(),
    totalViews: v.number(),
    updatedAt: v.number(),
  })
    .index("by_key", ["key"]),

  // ===== CACHED FEATURED CREATORS =====
  // Updated periodically to avoid constant cache invalidation
  cachedFeaturedCreators: defineTable({
    key: v.literal("featured"), // Single row
    creators: v.array(v.object({
      _id: v.id("users"),
      battleTag: v.string(),
      avatarUrl: v.optional(v.string()),
      bio: v.optional(v.string()),
      totalLikes: v.number(),
      totalViews: v.number(),
      designCount: v.number(),
    })),
    updatedAt: v.number(),
  })
    .index("by_key", ["key"]),

  // ===== SECURITY EVENTS =====
  // Track security-relevant events for monitoring
  securityEvents: defineTable({
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
    createdAt: v.number(),
  })
    .index("by_identifier_type", ["identifier", "eventType"])
    .index("by_created", ["createdAt"]),

  // ===== SECURITY ALERTS =====
  // Alerts triggered by suspicious patterns
  securityAlerts: defineTable({
    alertType: v.string(),
    identifier: v.string(),
    message: v.string(),
    metadata: v.optional(
      v.object({
        ip: v.optional(v.string()),
        userAgent: v.optional(v.string()),
        action: v.optional(v.string()),
        details: v.optional(v.string()),
      })
    ),
    acknowledged: v.boolean(),
    acknowledgedBy: v.optional(v.id("users")),
    acknowledgedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_created", ["createdAt"])
    .index("by_acknowledged", ["acknowledged", "createdAt"]),
});

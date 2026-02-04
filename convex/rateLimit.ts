import type { MutationCtx } from "./_generated/server";

/**
 * Rate limiting configuration for different actions.
 * Each action has a limit and window (in milliseconds).
 */
export const RATE_LIMITS = {
  // Design uploads: 10 per hour
  create_design: { limit: 10, windowMs: 60 * 60 * 1000 },

  // Design updates: 30 per hour
  update_design: { limit: 30, windowMs: 60 * 60 * 1000 },

  // Reports: 5 per hour (prevent report spam)
  create_report: { limit: 5, windowMs: 60 * 60 * 1000 },

  // Likes: 100 per minute (allow rapid liking but prevent automation)
  toggle_like: { limit: 100, windowMs: 60 * 1000 },

  // Saves: 100 per minute
  toggle_save: { limit: 100, windowMs: 60 * 1000 },

  // Follows: 50 per minute
  toggle_follow: { limit: 50, windowMs: 60 * 1000 },

  // Collections: 20 per hour
  create_collection: { limit: 20, windowMs: 60 * 60 * 1000 },

  // Collection items: 100 per minute
  collection_item: { limit: 100, windowMs: 60 * 1000 },

  // Login attempts: 10 per 15 minutes (prevent brute force)
  login: { limit: 10, windowMs: 15 * 60 * 1000 },

  // Image uploads: 20 per hour
  upload_image: { limit: 20, windowMs: 60 * 60 * 1000 },
} as const;

export type RateLimitAction = keyof typeof RATE_LIMITS;

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Check and update rate limit for a given identifier and action.
 * Returns whether the request is allowed and how many requests remain.
 *
 * @param ctx - Convex mutation context
 * @param identifier - User ID or IP address
 * @param action - The action being rate limited
 * @returns Whether the request is allowed
 */
export async function checkRateLimit(
  ctx: MutationCtx,
  identifier: string,
  action: RateLimitAction
): Promise<RateLimitResult> {
  const config = RATE_LIMITS[action];
  const now = Date.now();

  // Find existing rate limit record
  const existing = await ctx.db
    .query("rateLimits")
    .withIndex("by_identifier_action", (q) =>
      q.eq("identifier", identifier).eq("action", action)
    )
    .first();

  // Check if we're in a new window
  if (!existing || now - existing.windowStart >= config.windowMs) {
    // New window - create or reset the record
    if (existing) {
      await ctx.db.patch(existing._id, {
        count: 1,
        windowStart: now,
      });
    } else {
      await ctx.db.insert("rateLimits", {
        identifier,
        action,
        count: 1,
        windowStart: now,
      });
    }

    return {
      allowed: true,
      remaining: config.limit - 1,
      resetAt: now + config.windowMs,
    };
  }

  // Same window - check if limit exceeded
  if (existing.count >= config.limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: existing.windowStart + config.windowMs,
    };
  }

  // Increment count
  await ctx.db.patch(existing._id, {
    count: existing.count + 1,
  });

  return {
    allowed: true,
    remaining: config.limit - existing.count - 1,
    resetAt: existing.windowStart + config.windowMs,
  };
}

/**
 * Enforce rate limit - throws an error if limit exceeded.
 *
 * @param ctx - Convex mutation context
 * @param identifier - User ID or IP address
 * @param action - The action being rate limited
 * @throws Error if rate limit exceeded
 */
export async function enforceRateLimit(
  ctx: MutationCtx,
  identifier: string,
  action: RateLimitAction
): Promise<void> {
  const result = await checkRateLimit(ctx, identifier, action);

  if (!result.allowed) {
    const resetIn = Math.ceil((result.resetAt - Date.now()) / 1000);
    const minutes = Math.ceil(resetIn / 60);

    throw new Error(
      `Rate limit exceeded for ${action.replace("_", " ")}. ` +
        `Please try again in ${minutes > 1 ? `${minutes} minutes` : `${resetIn} seconds`}.`
    );
  }
}

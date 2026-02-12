/**
 * IP-based rate limiting for Next.js API routes.
 * Uses in-memory storage with automatic cleanup.
 * For production at scale, consider using Redis.
 */

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

interface RateLimitConfig {
  limit: number;
  windowMs: number;
}

// In-memory store for rate limits
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
let lastCleanup = Date.now();
const CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes

function cleanup(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;

  lastCleanup = now;
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now - entry.windowStart > windowMs * 2) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Rate limit configurations for different endpoints
 */
export const RATE_LIMIT_CONFIGS = {
  // Auth endpoints - stricter limits
  auth: { limit: 10, windowMs: 15 * 60 * 1000 }, // 10 per 15 minutes

  // OAuth callback - very strict (should only be called once per auth flow)
  oauthCallback: { limit: 5, windowMs: 60 * 1000 }, // 5 per minute

  // Session operations
  session: { limit: 30, windowMs: 60 * 1000 }, // 30 per minute

  // General API calls
  api: { limit: 100, windowMs: 60 * 1000 }, // 100 per minute

  // Upload/mutation heavy endpoints
  upload: { limit: 20, windowMs: 60 * 60 * 1000 }, // 20 per hour

  // Cron endpoints (should be called by Vercel only)
  cron: { limit: 10, windowMs: 60 * 1000 }, // 10 per minute
} as const;

export type RateLimitType = keyof typeof RATE_LIMIT_CONFIGS;

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
}

/**
 * Check rate limit for an IP address.
 *
 * @param ip - The IP address to check
 * @param type - The type of rate limit to apply
 * @returns Whether the request is allowed and rate limit info
 */
export function checkIpRateLimit(
  ip: string,
  type: RateLimitType
): RateLimitResult {
  const config = RATE_LIMIT_CONFIGS[type];
  const key = `${type}:${ip}`;
  const now = Date.now();

  // Cleanup old entries periodically
  cleanup(config.windowMs);

  const existing = rateLimitStore.get(key);

  // New window or entry doesn't exist
  if (!existing || now - existing.windowStart >= config.windowMs) {
    rateLimitStore.set(key, { count: 1, windowStart: now });
    return {
      allowed: true,
      remaining: config.limit - 1,
      resetAt: now + config.windowMs,
    };
  }

  // Check if limit exceeded
  if (existing.count >= config.limit) {
    const resetAt = existing.windowStart + config.windowMs;
    return {
      allowed: false,
      remaining: 0,
      resetAt,
      retryAfter: Math.ceil((resetAt - now) / 1000),
    };
  }

  // Increment count
  existing.count++;
  rateLimitStore.set(key, existing);

  return {
    allowed: true,
    remaining: config.limit - existing.count,
    resetAt: existing.windowStart + config.windowMs,
  };
}

/**
 * Get the client IP from a request.
 * Handles various proxy headers used by Vercel, Cloudflare, etc.
 */
export function getClientIp(request: Request): string {
  // Check headers in order of preference
  const headers = [
    "x-real-ip",
    "x-forwarded-for",
    "cf-connecting-ip", // Cloudflare
    "x-vercel-forwarded-for", // Vercel
  ];

  for (const header of headers) {
    const value = request.headers.get(header);
    if (value) {
      // x-forwarded-for can contain multiple IPs, get the first one
      const ip = value.split(",")[0]?.trim();
      if (ip) return ip;
    }
  }

  // Fallback - this shouldn't happen in production
  return "unknown";
}

/**
 * Create rate limit headers for the response.
 */
export function createRateLimitHeaders(result: RateLimitResult): HeadersInit {
  const headers: HeadersInit = {
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": result.resetAt.toString(),
  };

  if (!result.allowed && result.retryAfter) {
    headers["Retry-After"] = result.retryAfter.toString();
  }

  return headers;
}

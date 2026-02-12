import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";
import { checkIpRateLimit, getClientIp } from "@/lib/rateLimit";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET(request: NextRequest) {
  // Apply IP-based rate limiting
  const clientIp = getClientIp(request);
  const rateLimitResult = checkIpRateLimit(clientIp, "cron");

  if (!rateLimitResult.allowed) {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }

  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get("Authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: Record<string, unknown> = {};

  try {
    // === CLEANUP TASKS (runs daily) ===

    // Clean up expired sessions
    const sessionsResult = await convex.mutation(
      api.auth.cleanupExpiredSessions,
      {}
    );
    results.sessions = sessionsResult;

    // Expire old strikes
    const strikesResult = await convex.mutation(
      api.strikes.expireOldStrikes,
      {}
    );
    results.strikes = strikesResult;

    // Clean up old rate limits
    const rateLimitsResult = await convex.mutation(
      api.rateLimit.cleanupRateLimits,
      {}
    );
    results.rateLimits = rateLimitsResult;

    // Clean up old read notifications
    const notificationsResult = await convex.mutation(
      api.notifications.cleanupOldNotifications,
      {}
    );
    results.notifications = notificationsResult;

    // Clean up old security events and alerts
    try {
      const securityResult = await convex.mutation(
        api.securityMonitor.cleanupOldEvents,
        {}
      );
      results.security = securityResult;
    } catch {
      // Security monitor might not be deployed yet
      results.security = { skipped: true };
    }

    return NextResponse.json({
      ok: true,
      timestamp: new Date().toISOString(),
      job: "cleanup",
      results,
    });
  } catch (error) {
    console.error("Cleanup cron job failed:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
export const maxDuration = 60;

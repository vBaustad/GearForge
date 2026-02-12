import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../convex/_generated/api";
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
    // === CACHE REFRESH (runs every 10 min) ===

    // Refresh featured creators cache
    const featuredResult = await convex.mutation(
      api.users.refreshFeaturedCreatorsCache,
      {}
    );
    results.featuredCreators = featuredResult;

    // Refresh platform stats
    const statsResult = await convex.mutation(
      api.creations.recalculatePlatformStats,
      {}
    );
    results.platformStats = statsResult;

    return NextResponse.json({
      ok: true,
      timestamp: new Date().toISOString(),
      results,
    });
  } catch (error) {
    console.error("Cron job failed:", error);
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

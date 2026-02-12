import { action } from "./_generated/server";
import { v } from "convex/values";

// Moderation thresholds (0-1 scale, higher = more likely inappropriate)
const MODERATION_THRESHOLDS = {
  adult: 0.7,
  violence: 0.8,
  gore: 0.7,
};

interface ModerationResult {
  safe: boolean;
  flags: string[];
  scores: Record<string, number>;
}

/**
 * Moderate images using Sightengine API
 * This action runs on the server and has access to environment variables
 */
export const moderateImages = action({
  args: {
    imageUrls: v.array(v.string()),
  },
  handler: async (ctx, args): Promise<{ safe: boolean; flags: string[]; results: ModerationResult[] }> => {
    const apiUser = process.env.SIGHTENGINE_API_USER;
    const apiSecret = process.env.SIGHTENGINE_API_SECRET;

    // If moderation not configured, allow all images
    if (!apiUser || !apiSecret) {
      console.log("Content moderation not configured - skipping checks");
      return {
        safe: true,
        flags: [],
        results: args.imageUrls.map(() => ({ safe: true, flags: [], scores: {} })),
      };
    }

    const results: ModerationResult[] = [];
    let allSafe = true;
    const allFlags: string[] = [];

    for (const imageUrl of args.imageUrls) {
      try {
        const params = new URLSearchParams({
          url: imageUrl,
          models: "nudity-2.1,gore-2.0",
          api_user: apiUser,
          api_secret: apiSecret,
        });

        // Add timeout to prevent hanging requests
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        const response = await fetch(`https://api.sightengine.com/1.0/check.json?${params}`, {
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (!response.ok) {
          console.error("Sightengine API error:", response.status);
          // Fail open on API errors
          results.push({ safe: true, flags: [], scores: {} });
          continue;
        }

        const data = await response.json();
        const flags: string[] = [];
        const scores: Record<string, number> = {};

        // Check nudity/adult content
        if (data.nudity) {
          const nudityScore = Math.max(
            data.nudity.sexual_activity || 0,
            data.nudity.sexual_display || 0,
            data.nudity.erotica || 0,
            data.nudity.very_suggestive || 0
          );
          scores.adult = nudityScore;
          if (nudityScore > MODERATION_THRESHOLDS.adult) {
            flags.push("adult_content");
          }
        }

        // Check gore
        if (data.gore) {
          const goreScore = data.gore.prob || 0;
          scores.gore = goreScore;
          if (goreScore > MODERATION_THRESHOLDS.gore) {
            flags.push("graphic_violence");
          }
        }

        const result: ModerationResult = {
          safe: flags.length === 0,
          flags,
          scores,
        };

        results.push(result);

        if (!result.safe) {
          allSafe = false;
          allFlags.push(...flags);
        }
      } catch (error) {
        console.error("Moderation error for image:", error);
        // Fail open on errors
        results.push({ safe: true, flags: [], scores: {} });
      }
    }

    return {
      safe: allSafe,
      flags: [...new Set(allFlags)],
      results,
    };
  },
});

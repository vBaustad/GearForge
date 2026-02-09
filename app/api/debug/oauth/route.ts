import { NextResponse } from "next/server";

// Temporary debug endpoint - DELETE AFTER DEBUGGING
export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "NOT_SET";

  return NextResponse.json({
    siteUrl: {
      raw: siteUrl,
      length: siteUrl.length,
      trimmed: siteUrl.trim(),
      trimmedLength: siteUrl.trim().length,
      charCodes: siteUrl.split("").map((c) => c.charCodeAt(0)),
    },
    redirectUris: {
      twitch: `${siteUrl.trim()}/api/auth/connect/twitch/callback`,
      youtube: `${siteUrl.trim()}/api/auth/connect/youtube/callback`,
    },
    hasTrailingWhitespace: siteUrl !== siteUrl.trim(),
  });
}

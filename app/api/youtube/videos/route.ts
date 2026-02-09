import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

const YOUTUBE_SEARCH_URL = "https://www.googleapis.com/youtube/v3/search";

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.headers.get("authorization")?.replace("Bearer ", "");

    if (!sessionToken) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get YouTube connection with access token from Convex
    const connection = await convex.query(api.socialConnections.getConnectionWithTokens, {
      sessionToken,
      platform: "youtube",
    });

    if (!connection) {
      return NextResponse.json(
        { message: "YouTube not connected" },
        { status: 404 }
      );
    }

    // Fetch user's recent videos from YouTube
    const searchUrl = new URL(YOUTUBE_SEARCH_URL);
    searchUrl.searchParams.set("part", "snippet");
    searchUrl.searchParams.set("forMine", "true");
    searchUrl.searchParams.set("type", "video");
    searchUrl.searchParams.set("maxResults", "20");
    searchUrl.searchParams.set("order", "date");

    const response = await fetch(searchUrl.toString(), {
      headers: {
        Authorization: `Bearer ${connection.accessToken}`,
      },
    });

    if (!response.ok) {
      // Token might be expired
      if (response.status === 401) {
        return NextResponse.json(
          { message: "YouTube token expired. Please reconnect your account." },
          { status: 401 }
        );
      }
      const error = await response.text();
      console.error("YouTube API error:", error);
      return NextResponse.json(
        { message: "Failed to fetch videos" },
        { status: 500 }
      );
    }

    const data = await response.json();

    // Transform to simpler format
    const videos = data.items?.map((item: {
      id: { videoId: string };
      snippet: {
        title: string;
        description: string;
        thumbnails: {
          medium?: { url: string };
          default?: { url: string };
        };
        publishedAt: string;
      };
    }) => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
      publishedAt: item.snippet.publishedAt,
    })) || [];

    return NextResponse.json({ videos });
  } catch (error) {
    console.error("YouTube videos fetch error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

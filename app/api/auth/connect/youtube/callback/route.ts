import { NextRequest, NextResponse } from "next/server";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const YOUTUBE_CHANNELS_URL = "https://www.googleapis.com/youtube/v3/channels";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    if (error) {
      console.error("YouTube OAuth error:", error);
      return NextResponse.redirect(
        `${baseUrl}/settings?error=youtube_auth_denied`
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${baseUrl}/settings?error=youtube_missing_params`
      );
    }

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = `${baseUrl}/api/auth/connect/youtube/callback`;

    if (!clientId || !clientSecret) {
      console.error("Missing Google/YouTube OAuth credentials");
      return NextResponse.redirect(
        `${baseUrl}/settings?error=youtube_not_configured`
      );
    }

    // Exchange code for access token
    const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error("YouTube token exchange failed:", error);
      return NextResponse.redirect(
        `${baseUrl}/settings?error=youtube_token_failed`
      );
    }

    const tokenData = await tokenResponse.json();

    // Fetch channel info from YouTube
    const channelUrl = new URL(YOUTUBE_CHANNELS_URL);
    channelUrl.searchParams.set("part", "snippet");
    channelUrl.searchParams.set("mine", "true");

    const channelResponse = await fetch(channelUrl.toString(), {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    if (!channelResponse.ok) {
      console.error("Failed to fetch YouTube channel info");
      return NextResponse.redirect(
        `${baseUrl}/settings?error=youtube_channel_failed`
      );
    }

    const channelData = await channelResponse.json();
    const channel = channelData.items?.[0];

    if (!channel) {
      return NextResponse.redirect(
        `${baseUrl}/settings?error=youtube_no_channel`
      );
    }

    // Calculate token expiration
    const tokenExpiresAt = tokenData.expires_in
      ? Date.now() + tokenData.expires_in * 1000
      : undefined;

    // Build channel URL - prefer custom URL if available
    const customUrl = channel.snippet.customUrl;
    const channelId = channel.id;
    const youtubeChannelUrl = customUrl
      ? `https://youtube.com/${customUrl}`
      : `https://youtube.com/channel/${channelId}`;

    // Encode connection data in URL params for client-side Convex mutation
    const connectionData = {
      platform: "youtube",
      platformId: channelId,
      platformUsername: channel.snippet.title,
      platformAvatarUrl: channel.snippet.thumbnails?.default?.url,
      channelUrl: youtubeChannelUrl,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      tokenExpiresAt,
      state,
    };

    // Redirect to callback page with encoded data
    const callbackUrl = new URL(`${baseUrl}/auth/connect/callback`);
    callbackUrl.searchParams.set("data", Buffer.from(JSON.stringify(connectionData)).toString("base64"));

    return NextResponse.redirect(callbackUrl.toString());
  } catch (error) {
    console.error("YouTube OAuth callback error:", error);
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    return NextResponse.redirect(`${baseUrl}/settings?error=youtube_error`);
  }
}

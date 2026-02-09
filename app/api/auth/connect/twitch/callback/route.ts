import { NextRequest, NextResponse } from "next/server";

const TWITCH_TOKEN_URL = "https://id.twitch.tv/oauth2/token";
const TWITCH_USER_URL = "https://api.twitch.tv/helix/users";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    if (error) {
      console.error("Twitch OAuth error:", error);
      return NextResponse.redirect(
        `${baseUrl}/settings?error=twitch_auth_denied`
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${baseUrl}/settings?error=twitch_missing_params`
      );
    }

    const clientId = process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID;
    const clientSecret = process.env.TWITCH_CLIENT_SECRET;
    const redirectUri = `${baseUrl}/api/auth/connect/twitch/callback`;

    if (!clientId || !clientSecret) {
      console.error("Missing Twitch OAuth credentials");
      return NextResponse.redirect(
        `${baseUrl}/settings?error=twitch_not_configured`
      );
    }

    // Exchange code for access token
    const tokenResponse = await fetch(TWITCH_TOKEN_URL, {
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
      console.error("Twitch token exchange failed:", error);
      return NextResponse.redirect(
        `${baseUrl}/settings?error=twitch_token_failed`
      );
    }

    const tokenData = await tokenResponse.json();

    // Fetch user info from Twitch
    const userResponse = await fetch(TWITCH_USER_URL, {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        "Client-Id": clientId,
      },
    });

    if (!userResponse.ok) {
      console.error("Failed to fetch Twitch user info");
      return NextResponse.redirect(
        `${baseUrl}/settings?error=twitch_user_failed`
      );
    }

    const userData = await userResponse.json();
    const twitchUser = userData.data[0];

    if (!twitchUser) {
      return NextResponse.redirect(
        `${baseUrl}/settings?error=twitch_no_user`
      );
    }

    // Calculate token expiration
    const tokenExpiresAt = tokenData.expires_in
      ? Date.now() + tokenData.expires_in * 1000
      : undefined;

    // Encode connection data in URL params for client-side Convex mutation
    const connectionData = {
      platform: "twitch",
      platformId: twitchUser.id,
      platformUsername: twitchUser.display_name || twitchUser.login,
      platformAvatarUrl: twitchUser.profile_image_url,
      channelUrl: `https://twitch.tv/${twitchUser.login}`,
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
    console.error("Twitch OAuth callback error:", error);
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    return NextResponse.redirect(`${baseUrl}/settings?error=twitch_error`);
  }
}

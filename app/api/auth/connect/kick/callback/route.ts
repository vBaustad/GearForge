import { NextRequest, NextResponse } from "next/server";

const KICK_TOKEN_URL = "https://id.kick.com/oauth/token";
const KICK_USER_URL = "https://api.kick.com/public/v1/users/me";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").trim();

    if (error) {
      console.error("Kick OAuth error:", error);
      return NextResponse.redirect(
        `${baseUrl}/settings?error=kick_auth_denied`
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${baseUrl}/settings?error=kick_missing_params`
      );
    }

    const clientId = process.env.NEXT_PUBLIC_KICK_CLIENT_ID;
    const clientSecret = process.env.KICK_CLIENT_SECRET;
    const redirectUri = `${baseUrl}/api/auth/connect/kick/callback`;

    if (!clientId || !clientSecret) {
      console.error("Missing Kick OAuth credentials");
      return NextResponse.redirect(
        `${baseUrl}/settings?error=kick_not_configured`
      );
    }

    // Get PKCE code verifier from cookie
    const codeVerifier = request.cookies.get("kick_code_verifier")?.value;
    if (!codeVerifier) {
      console.error("Missing PKCE code verifier");
      return NextResponse.redirect(
        `${baseUrl}/settings?error=kick_missing_verifier`
      );
    }

    // Exchange code for access token (with PKCE)
    const tokenResponse = await fetch(KICK_TOKEN_URL, {
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
        code_verifier: codeVerifier,
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error("Kick token exchange failed:", error);
      return NextResponse.redirect(
        `${baseUrl}/settings?error=kick_token_failed`
      );
    }

    const tokenData = await tokenResponse.json();

    // Fetch user info from Kick
    const userResponse = await fetch(KICK_USER_URL, {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    if (!userResponse.ok) {
      console.error("Failed to fetch Kick user info");
      return NextResponse.redirect(
        `${baseUrl}/settings?error=kick_user_failed`
      );
    }

    const userData = await userResponse.json();
    const kickUser = userData.data || userData;

    if (!kickUser || !kickUser.username) {
      return NextResponse.redirect(
        `${baseUrl}/settings?error=kick_no_user`
      );
    }

    // Calculate token expiration
    const tokenExpiresAt = tokenData.expires_in
      ? Date.now() + tokenData.expires_in * 1000
      : undefined;

    // Encode connection data in URL params for client-side Convex mutation
    const connectionData = {
      platform: "kick",
      platformId: String(kickUser.id || kickUser.user_id),
      platformUsername: kickUser.username,
      platformAvatarUrl: kickUser.profile_pic || kickUser.avatar,
      channelUrl: `https://kick.com/${kickUser.username}`,
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
    console.error("Kick OAuth callback error:", error);
    const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").trim();
    return NextResponse.redirect(`${baseUrl}/settings?error=kick_error`);
  }
}

import { NextRequest, NextResponse } from "next/server";
import {
  checkIpRateLimit,
  getClientIp,
  createRateLimitHeaders,
} from "@/lib/rateLimit";

const KICK_TOKEN_URL = "https://id.kick.com/oauth/token";
const KICK_USER_URL = "https://api.kick.com/public/v1/users";

export async function GET(request: NextRequest) {
  // Apply IP-based rate limiting
  const clientIp = getClientIp(request);
  const rateLimitResult = checkIpRateLimit(clientIp, "oauthCallback");

  if (!rateLimitResult.allowed) {
    const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").trim();
    return NextResponse.redirect(`${baseUrl}/settings?error=rate_limited`);
  }

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
      // Log full error server-side only, don't expose to client
      const errorText = await userResponse.text();
      console.error("Failed to fetch Kick user info:", userResponse.status, errorText);
      return NextResponse.redirect(
        `${baseUrl}/settings?error=kick_user_failed`
      );
    }

    const userData = await userResponse.json();
    console.log("Kick user data:", JSON.stringify(userData, null, 2));

    // Try different response structures
    const kickUser = userData.data?.[0] || userData.data || userData;
    const username = kickUser?.username || kickUser?.name || kickUser?.slug || kickUser?.user?.username;
    const userId = kickUser?.id || kickUser?.user_id || kickUser?.user?.id;

    console.log("Parsed - username:", username, "userId:", userId);

    if (!username) {
      // Log raw data server-side for debugging, don't expose to client
      console.error("Kick user data missing username:", JSON.stringify(userData));
      return NextResponse.redirect(
        `${baseUrl}/settings?error=kick_no_user`
      );
    }

    // Calculate token expiration
    const tokenExpiresAt = tokenData.expires_in
      ? Date.now() + tokenData.expires_in * 1000
      : undefined;

    // Get avatar from various possible fields
    const avatarUrl = kickUser?.profile_pic || kickUser?.profile_picture || kickUser?.avatar || kickUser?.user?.profile_pic;

    // Store connection data in httpOnly cookie (more secure than URL params)
    const connectionData = {
      platform: "kick",
      platformId: String(userId),
      platformUsername: username,
      platformAvatarUrl: avatarUrl,
      channelUrl: `https://kick.com/${username}`,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      tokenExpiresAt,
      state,
    };

    // Redirect to callback page - data passed via secure cookie
    const callbackUrl = new URL(`${baseUrl}/auth/connect/callback`);
    const response = NextResponse.redirect(callbackUrl.toString());

    // Set connection data in httpOnly cookie (5 min expiry for security)
    response.cookies.set("oauth_connect_data", Buffer.from(JSON.stringify(connectionData)).toString("base64"), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 300, // 5 minutes
      path: "/",
    });

    // Clear PKCE verifier cookie
    response.cookies.delete("kick_code_verifier");

    return response;
  } catch (error) {
    console.error("Kick OAuth callback error:", error);
    const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").trim();
    return NextResponse.redirect(`${baseUrl}/settings?error=kick_error`);
  }
}

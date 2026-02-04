import { NextRequest, NextResponse } from "next/server";

const BLIZZARD_TOKEN_URL = "https://oauth.battle.net/token";
const BLIZZARD_USERINFO_URL = "https://oauth.battle.net/userinfo";

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json({ message: "Missing authorization code" }, { status: 400 });
    }

    const clientId = process.env.BLIZZARD_CLIENT_ID;
    const clientSecret = process.env.BLIZZARD_CLIENT_SECRET;
    const redirectUri =
      process.env.NEXT_PUBLIC_BLIZZARD_REDIRECT_URI ||
      `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback`;

    if (!clientId || !clientSecret) {
      console.error("Missing Blizzard OAuth credentials");
      return NextResponse.json(
        { message: "OAuth not configured" },
        { status: 500 }
      );
    }

    // Exchange code for access token (server-side - secrets are safe here)
    const tokenResponse = await fetch(BLIZZARD_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error("Token exchange failed:", error);
      return NextResponse.json(
        { message: "Failed to exchange code for token" },
        { status: 401 }
      );
    }

    const tokenData = await tokenResponse.json();

    // Fetch user info from Blizzard
    const userInfoResponse = await fetch(BLIZZARD_USERINFO_URL, {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    if (!userInfoResponse.ok) {
      console.error("Failed to fetch user info");
      return NextResponse.json(
        { message: "Failed to fetch user info" },
        { status: 401 }
      );
    }

    const userInfo = await userInfoResponse.json();

    // Return the user info (no secrets exposed to client)
    return NextResponse.json({
      battlenetId: userInfo.sub,
      battleTag: userInfo.battletag,
    });
  } catch (error) {
    console.error("OAuth callback error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

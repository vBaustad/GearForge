import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const clientId = process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/auth/connect/twitch/callback`;

  if (!clientId) {
    return NextResponse.json(
      { message: "Twitch OAuth not configured" },
      { status: 500 }
    );
  }

  // Get state from query params (passed from client)
  const state = request.nextUrl.searchParams.get("state");
  if (!state) {
    return NextResponse.json(
      { message: "Missing state parameter" },
      { status: 400 }
    );
  }

  const authUrl = new URL("https://id.twitch.tv/oauth2/authorize");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "user:read:email");
  authUrl.searchParams.set("state", state);

  return NextResponse.redirect(authUrl.toString());
}

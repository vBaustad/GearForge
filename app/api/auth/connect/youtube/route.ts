import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim();
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").trim();
  const redirectUri = `${siteUrl}/api/auth/connect/youtube/callback`;

  // Debug logging
  console.log("=== YouTube OAuth Init ===");
  console.log("Site URL:", JSON.stringify(siteUrl));
  console.log("Redirect URI:", JSON.stringify(redirectUri));
  console.log("==========================");

  if (!clientId) {
    return NextResponse.json(
      { message: "YouTube/Google OAuth not configured" },
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

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "https://www.googleapis.com/auth/youtube.readonly");
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("access_type", "offline");
  authUrl.searchParams.set("prompt", "consent");

  return NextResponse.redirect(authUrl.toString());
}

import { NextRequest, NextResponse } from "next/server";
import { randomBytes, createHash } from "crypto";

// Generate PKCE code verifier and challenge
function generatePKCE() {
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  return { verifier, challenge };
}

export async function GET(request: NextRequest) {
  const clientId = process.env.NEXT_PUBLIC_KICK_CLIENT_ID?.trim();
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").trim();
  const redirectUri = `${siteUrl}/api/auth/connect/kick/callback`;

  if (!clientId) {
    return NextResponse.json(
      { message: "Kick OAuth not configured" },
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

  // Generate PKCE
  const { verifier, challenge } = generatePKCE();

  // Store verifier in a cookie for the callback to use
  const response = NextResponse.redirect(buildAuthUrl());
  response.cookies.set("kick_code_verifier", verifier, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 600, // 10 minutes
    path: "/",
  });

  function buildAuthUrl() {
    const authUrl = new URL("https://id.kick.com/oauth/authorize");
    authUrl.searchParams.set("client_id", clientId!);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", "user:read");
    authUrl.searchParams.set("state", state!);
    authUrl.searchParams.set("code_challenge", challenge);
    authUrl.searchParams.set("code_challenge_method", "S256");
    return authUrl.toString();
  }

  return response;
}

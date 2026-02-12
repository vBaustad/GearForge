import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";
import {
  checkIpRateLimit,
  getClientIp,
  createRateLimitHeaders,
} from "@/lib/rateLimit";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

const SESSION_COOKIE_NAME = "gearforge_session";
const SESSION_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds

// Get current session
export async function GET(request: NextRequest) {
  // Apply IP-based rate limiting
  const clientIp = getClientIp(request);
  const rateLimitResult = checkIpRateLimit(clientIp, "session");

  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: createRateLimitHeaders(rateLimitResult),
      }
    );
  }

  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) {
    return NextResponse.json({ user: null, token: null });
  }

  try {
    const user = await convex.query(api.auth.getCurrentUser, { sessionToken });
    // Return both user and token so client can use token for mutations
    return NextResponse.json({ user, token: sessionToken });
  } catch {
    // Invalid session - clear cookie
    const response = NextResponse.json({ user: null, token: null });
    response.cookies.delete(SESSION_COOKIE_NAME);
    return response;
  }
}

// Set session cookie (called after login)
export async function POST(request: NextRequest) {
  // Apply IP-based rate limiting
  const clientIp = getClientIp(request);
  const rateLimitResult = checkIpRateLimit(clientIp, "auth");

  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: createRateLimitHeaders(rateLimitResult),
      }
    );
  }

  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    // Verify the token is valid
    const user = await convex.query(api.auth.getCurrentUser, { sessionToken: token });

    if (!user) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const response = NextResponse.json({ success: true, user });

    // Set httpOnly cookie
    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Session set error:", error);
    return NextResponse.json({ error: "Failed to set session" }, { status: 500 });
  }
}

// Clear session cookie (logout)
export async function DELETE(request: NextRequest) {
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  // Invalidate session in database if exists
  if (sessionToken) {
    try {
      await convex.mutation(api.auth.logout, { sessionToken });
    } catch {
      // Ignore errors - session might already be invalid
    }
  }

  const response = NextResponse.json({ success: true });
  response.cookies.delete(SESSION_COOKIE_NAME);
  return response;
}

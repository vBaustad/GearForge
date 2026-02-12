import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "oauth_connect_data";

// GET: Retrieve connection data from httpOnly cookie
export async function GET(request: NextRequest) {
  const encodedData = request.cookies.get(COOKIE_NAME)?.value;

  if (!encodedData) {
    return NextResponse.json({ error: "No connection data" }, { status: 400 });
  }

  try {
    const connectionData = JSON.parse(Buffer.from(encodedData, "base64").toString());

    // Return the data (client will use it to complete the connection)
    const response = NextResponse.json({ data: connectionData });

    // Clear the cookie after retrieval (one-time use)
    response.cookies.delete(COOKIE_NAME);

    return response;
  } catch {
    return NextResponse.json({ error: "Invalid connection data" }, { status: 400 });
  }
}

// DELETE: Clear connection data cookie (for cleanup)
export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete(COOKIE_NAME);
  return response;
}

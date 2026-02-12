import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

export const runtime = "edge";

const CATEGORY_LABELS: Record<string, string> = {
  bedroom: "Bedroom",
  living_room: "Living Room",
  kitchen: "Kitchen",
  garden: "Garden",
  tavern: "Tavern",
  throne_room: "Throne Room",
  workshop: "Workshop",
  library: "Library",
  exterior: "Exterior",
  other: "Other",
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = request.nextUrl;
  const theme = searchParams.get("theme") || "dark";

  // Validate ID
  if (!id || id === "undefined" || id === "null") {
    return new Response("Design not found", { status: 404 });
  }

  try {
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
      throw new Error("Convex URL not configured");
    }

    const client = new ConvexHttpClient(convexUrl);
    const design = await client.query(api.creations.getMetadata, {
      id: id as Id<"creations">,
    });

    if (!design) {
      return new Response("Design not found", { status: 404 });
    }

    const categoryLabel = CATEGORY_LABELS[design.category] || design.category;
    const isDark = theme === "dark";

    // Colors based on theme
    const bgColor = isDark ? "#141210" : "#f5f0e6";
    const cardBg = isDark ? "#1c1915" : "#ffffff";
    const textPrimary = isDark ? "#f5f0e6" : "#141210";
    const textSecondary = isDark ? "#b8a890" : "#786a58";
    const accent = "#d4915c";
    const border = isDark ? "#2a2520" : "#e5ddd0";

    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            backgroundColor: bgColor,
            padding: 16,
            fontFamily: "system-ui, sans-serif",
          }}
        >
          {/* Card */}
          <div
            style={{
              display: "flex",
              flex: 1,
              backgroundColor: cardBg,
              borderRadius: 12,
              border: `1px solid ${border}`,
              overflow: "hidden",
            }}
          >
            {/* Image */}
            <div
              style={{
                width: 200,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: isDark ? "#12100e" : "#f0ebe0",
              }}
            >
              {design.thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={design.thumbnailUrl}
                  alt=""
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <div
                  style={{
                    color: textSecondary,
                    fontSize: 32,
                    fontWeight: 700,
                  }}
                >
                  GF
                </div>
              )}
            </div>

            {/* Content */}
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                padding: "16px 20px",
              }}
            >
              {/* Category badge */}
              <span
                style={{
                  display: "inline-flex",
                  alignSelf: "flex-start",
                  backgroundColor: `${accent}20`,
                  color: accent,
                  padding: "4px 10px",
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 500,
                  marginBottom: 8,
                }}
              >
                {categoryLabel}
              </span>

              {/* Title */}
              <h2
                style={{
                  color: textPrimary,
                  fontSize: 18,
                  fontWeight: 600,
                  margin: 0,
                  marginBottom: 4,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                }}
              >
                {design.title}
              </h2>

              {/* Creator */}
              <p
                style={{
                  color: textSecondary,
                  fontSize: 13,
                  margin: 0,
                  marginBottom: 12,
                }}
              >
                by {design.creatorName}
              </p>

              {/* Stats */}
              <div
                style={{
                  display: "flex",
                  gap: 16,
                  fontSize: 12,
                  color: textSecondary,
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                  {design.likeCount}
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  {design.viewCount}
                </span>
              </div>
            </div>

            {/* GearForge branding */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0 16px",
                borderLeft: `1px solid ${border}`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    backgroundColor: accent,
                    borderRadius: 6,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 16,
                    fontWeight: 700,
                    color: "#141210",
                  }}
                >
                  G
                </div>
                <span style={{ fontSize: 10, color: textSecondary }}>
                  gearforge.io
                </span>
              </div>
            </div>
          </div>
        </div>
      ),
      {
        width: 480,
        height: 160,
      }
    );
  } catch (error) {
    console.error("Embed generation failed:", error);
    return new Response("Failed to generate embed", { status: 500 });
  }
}

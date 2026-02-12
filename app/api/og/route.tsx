import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  // Get parameters
  const title = searchParams.get("title") || "WoW Housing Design";
  const creator = searchParams.get("creator") || "Anonymous";
  const category = searchParams.get("category") || "Other";
  const likes = searchParams.get("likes") || "0";
  const views = searchParams.get("views") || "0";
  const image = searchParams.get("image");

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#141210",
          padding: 48,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 32,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                backgroundColor: "#d4915c",
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 24,
                fontWeight: 700,
                color: "#141210",
              }}
            >
              G
            </div>
            <span style={{ color: "#f5f0e6", fontSize: 28, fontWeight: 600 }}>
              GearForge
            </span>
          </div>
          <span
            style={{
              backgroundColor: "rgba(212, 145, 92, 0.2)",
              color: "#d4915c",
              padding: "8px 16px",
              borderRadius: 8,
              fontSize: 20,
              fontWeight: 500,
            }}
          >
            {category}
          </span>
        </div>

        {/* Main content */}
        <div
          style={{
            display: "flex",
            flex: 1,
            gap: 40,
          }}
        >
          {/* Image placeholder or actual image */}
          <div
            style={{
              width: 500,
              height: 375,
              backgroundColor: "#1c1915",
              borderRadius: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              border: "2px solid #2a2520",
            }}
          >
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={image}
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
                  color: "#786a58",
                  fontSize: 48,
                  fontWeight: 700,
                }}
              >
                GF
              </div>
            )}
          </div>

          {/* Info */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              flex: 1,
            }}
          >
            <h1
              style={{
                color: "#f5f0e6",
                fontSize: 48,
                fontWeight: 700,
                margin: 0,
                marginBottom: 16,
                lineHeight: 1.2,
                // Truncate long titles
                overflow: "hidden",
                textOverflow: "ellipsis",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
              }}
            >
              {title}
            </h1>

            <p
              style={{
                color: "#b8a890",
                fontSize: 24,
                margin: 0,
                marginBottom: 32,
              }}
            >
              by {creator}
            </p>

            {/* Stats */}
            <div
              style={{
                display: "flex",
                gap: 32,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  color: "#b8a890",
                  fontSize: 22,
                }}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
                {likes}
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  color: "#b8a890",
                  fontSize: 22,
                }}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                {views}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            marginTop: 32,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ color: "#786a58", fontSize: 18 }}>
            gearforge.io
          </span>
          <span style={{ color: "#786a58", fontSize: 18 }}>
            WoW Housing Designs
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}

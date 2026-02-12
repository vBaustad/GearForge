import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="container page-section">
      <div
        style={{
          minHeight: "50vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "var(--space-lg)",
        }}
      >
        {/* Spinner */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Loader2
            size={40}
            className="animate-spin"
            style={{ color: "var(--accent)" }}
          />
        </div>

        {/* Loading text */}
        <p
          className="text-muted"
          style={{
            fontSize: "0.875rem",
            textAlign: "center",
          }}
        >
          Loading...
        </p>

        {/* Optional: Skeleton preview for content */}
        <div
          style={{
            width: "100%",
            maxWidth: "800px",
            marginTop: "var(--space-xl)",
          }}
        >
          {/* Header skeleton */}
          <div
            className="skeleton"
            style={{
              height: "32px",
              width: "200px",
              marginBottom: "var(--space-lg)",
            }}
          />

          {/* Content skeleton grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
              gap: "var(--space-lg)",
            }}
          >
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                style={{
                  background: "var(--bg-surface)",
                  borderRadius: "var(--radius-md)",
                  overflow: "hidden",
                  border: "1px solid var(--border)",
                }}
              >
                {/* Image skeleton */}
                <div
                  className="skeleton"
                  style={{
                    height: "180px",
                    borderRadius: 0,
                  }}
                />
                {/* Content skeleton */}
                <div style={{ padding: "var(--space-md)" }}>
                  <div
                    className="skeleton"
                    style={{
                      height: "20px",
                      width: "80%",
                      marginBottom: "var(--space-sm)",
                    }}
                  />
                  <div
                    className="skeleton"
                    style={{
                      height: "16px",
                      width: "60%",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

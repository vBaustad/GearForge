"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to console (can be extended to error reporting service)
    console.error("Global error:", error);
  }, [error]);

  const handleGoHome = () => {
    window.location.href = "/";
  };

  return (
    <html lang="en">
      <body>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
            fontFamily: "system-ui, -apple-system, sans-serif",
            background: "#0d0b09",
            color: "#f5f0e6",
          }}
        >
          {/* Error icon */}
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              background: "rgba(239, 68, 68, 0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "1.5rem",
            }}
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#ef4444"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <path d="M12 9v4" />
              <path d="M12 17h.01" />
            </svg>
          </div>

          {/* Error code */}
          <h1
            style={{
              fontSize: "3rem",
              margin: 0,
              opacity: 0.3,
              fontWeight: 700,
              fontFamily: "Georgia, serif",
              color: "#d4915c",
            }}
          >
            500
          </h1>

          {/* Error title */}
          <h2
            style={{
              fontSize: "1.5rem",
              marginTop: "0.5rem",
              marginBottom: "1rem",
              fontFamily: "Georgia, serif",
            }}
          >
            Something went wrong
          </h2>

          {/* Error description */}
          <p
            style={{
              opacity: 0.7,
              marginBottom: "2rem",
              textAlign: "center",
              maxWidth: "400px",
              lineHeight: 1.6,
            }}
          >
            A critical error occurred while loading the application.
            This has been logged and we&apos;re working to fix it.
          </p>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center" }}>
            <button
              onClick={reset}
              style={{
                padding: "0.75rem 1.5rem",
                background: "#d4915c",
                color: "#0d0b09",
                border: "none",
                borderRadius: "0.5rem",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "0.9375rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                transition: "background 0.15s ease",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = "#e5a06a";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = "#d4915c";
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                <path d="M21 3v5h-5" />
              </svg>
              Try Again
            </button>

            <button
              onClick={handleGoHome}
              style={{
                padding: "0.75rem 1.5rem",
                background: "transparent",
                color: "#f5f0e6",
                border: "1px solid #2a2520",
                borderRadius: "0.5rem",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "0.9375rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                transition: "all 0.15s ease",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = "#1c1915";
                e.currentTarget.style.borderColor = "#3a3428";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.borderColor = "#2a2520";
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              Go Home
            </button>
          </div>

          {/* Error digest for debugging */}
          {error.digest && (
            <p
              style={{
                marginTop: "2rem",
                fontSize: "0.75rem",
                opacity: 0.4,
              }}
            >
              Error ID: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}

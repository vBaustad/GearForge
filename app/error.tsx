"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to console (could send to error tracking service)
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="container page-section">
      <div className="placeholder-page">
        <div
          className="empty-state-icon"
          style={{ background: "rgba(239, 68, 68, 0.15)" }}
        >
          <AlertTriangle size={48} style={{ color: "#ef4444" }} />
        </div>
        <h2
          className="font-display"
          style={{ fontSize: "1.5rem", marginBottom: "var(--space-md)" }}
        >
          Something went wrong
        </h2>
        <p
          className="text-secondary"
          style={{ marginBottom: "var(--space-xl)", maxWidth: "400px" }}
        >
          An unexpected error occurred. Please try again or return to the home page.
        </p>
        <div style={{ display: "flex", gap: "var(--space-sm)" }}>
          <button onClick={reset} className="btn btn-primary">
            <RefreshCw size={18} />
            Try Again
          </button>
          <Link href="/" className="btn btn-secondary">
            <Home size={18} />
            Go Home
          </Link>
        </div>
        {process.env.NODE_ENV === "development" && error.message && (
          <pre
            style={{
              marginTop: "var(--space-xl)",
              padding: "var(--space-md)",
              background: "var(--surface)",
              borderRadius: "var(--radius)",
              fontSize: "0.75rem",
              maxWidth: "100%",
              overflow: "auto",
              textAlign: "left",
            }}
          >
            {error.message}
          </pre>
        )}
      </div>
    </div>
  );
}

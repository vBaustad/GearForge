import Link from "next/link";
import { Home, Search, Layout } from "lucide-react";

export default function NotFound() {
  return (
    <div className="container page-section">
      <div className="placeholder-page">
        <div className="not-found-code font-display">404</div>
        <h2
          className="font-display"
          style={{ fontSize: "1.5rem", marginBottom: "var(--space-md)" }}
        >
          Page Not Found
        </h2>
        <p
          className="text-secondary"
          style={{ marginBottom: "var(--space-xl)", maxWidth: "400px" }}
        >
          The page you&apos;re looking for doesn&apos;t exist or may have been moved.
          Let&apos;s get you back on track.
        </p>
        <div style={{ display: "flex", gap: "var(--space-sm)", flexWrap: "wrap", justifyContent: "center" }}>
          <Link href="/browse" className="btn btn-primary">
            <Layout size={18} />
            Browse Designs
          </Link>
          <Link href="/" className="btn btn-secondary">
            <Home size={18} />
            Go Home
          </Link>
        </div>

        {/* Helpful suggestions */}
        <div
          style={{
            marginTop: "var(--space-2xl)",
            padding: "var(--space-lg)",
            background: "var(--bg-surface)",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border)",
            textAlign: "left",
            maxWidth: "400px",
            margin: "var(--space-2xl) auto 0",
          }}
        >
          <h3
            style={{
              fontSize: "0.875rem",
              fontWeight: 600,
              marginBottom: "var(--space-md)",
              display: "flex",
              alignItems: "center",
              gap: "var(--space-sm)",
            }}
          >
            <Search size={16} />
            Looking for something?
          </h3>
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              fontSize: "0.875rem",
            }}
          >
            <li style={{ marginBottom: "var(--space-sm)" }}>
              <Link
                href="/browse"
                className="text-accent"
                style={{ textDecoration: "underline" }}
              >
                Browse all designs
              </Link>
              {" - "}
              <span className="text-muted">Explore community creations</span>
            </li>
            <li style={{ marginBottom: "var(--space-sm)" }}>
              <Link
                href="/upload"
                className="text-accent"
                style={{ textDecoration: "underline" }}
              >
                Upload a design
              </Link>
              {" - "}
              <span className="text-muted">Share your own creation</span>
            </li>
            <li>
              <Link
                href="/help"
                className="text-accent"
                style={{ textDecoration: "underline" }}
              >
                Help center
              </Link>
              {" - "}
              <span className="text-muted">Get answers to questions</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

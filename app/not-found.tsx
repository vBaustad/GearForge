import Link from "next/link";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="container page-section">
      <div className="placeholder-page">
        <div className="not-found-code font-display">404</div>
        <h2 className="font-display" style={{ fontSize: '1.5rem', marginBottom: 'var(--space-md)' }}>
          Page Not Found
        </h2>
        <p className="text-secondary" style={{ marginBottom: 'var(--space-xl)' }}>
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link href="/" className="btn btn-primary">
          <Home size={18} />
          Go Home
        </Link>
      </div>
    </div>
  );
}

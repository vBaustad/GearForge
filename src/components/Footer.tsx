import Link from "next/link";
import { Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="footer" role="contentinfo">
      <div className="container">
        <div className="footer-content">
          <nav className="footer-links" aria-label="Footer navigation">
            <Link href="/browse" className="footer-link">Browse</Link>
            <Link href="/upload" className="footer-link">Upload</Link>
            <Link href="/help" className="footer-link">Help</Link>
            <Link href="/faq" className="footer-link">FAQ</Link>
            <Link href="/about" className="footer-link">About</Link>
            <Link href="/privacy" className="footer-link">Privacy</Link>
            <Link href="/terms" className="footer-link">Terms</Link>
          </nav>

          <a
            href="https://buymeacoffee.com/vbaustad"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-support"
          >
            <Heart size={14} />
            Support GearForge
          </a>

          <p className="footer-copy">
            GearForge is not affiliated with Blizzard Entertainment.
            World of Warcraft is a trademark of Blizzard Entertainment, Inc.
          </p>
        </div>
      </div>
    </footer>
  );
}

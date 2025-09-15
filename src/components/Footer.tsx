import { Link } from "react-router-dom";
import { Github, Linkedin, Mail, Coffee } from "lucide-react";
import c from "./components.module.css";

// --- Customize here ---
const EMAIL = ""; // e.g. "hello@gearforge.dev" (leave empty to hide)
const LINKS = {
  githubRepo: "https://github.com/vBaustad/GearForge",
  githubIssues: "https://github.com/vBaustad/GearForge/issues",
  linkedin: "https://www.linkedin.com/in/vBaustad/",
  coffee: "https://buymeacoffee.com/vbaustad",
  faq: "/faq",
  terms: "/terms",
  privacy: "/privacy",
};

// Build info (injected by Vite define; with safe fallbacks)
const appVersion =
  typeof __APP_VERSION__ !== "undefined" && __APP_VERSION__ ? __APP_VERSION__ : "0.0.0";
const gitSha =
  typeof __GIT_SHA__ !== "undefined" && __GIT_SHA__ ? __GIT_SHA__.slice(0, 7) : "local";

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <details className={c.faqItem}>
      <summary className={c.faqSummary}>
        <span>{q}</span>
        <svg className={c.faqChevron} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
          <path d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 011.08 1.04l-4.25 4.25a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z" />
        </svg>
      </summary>
      <div className={c.faqBody}>{a}</div>
    </details>
  );
}

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className={c.footerRoot} role="contentinfo">
      <div className={c.footerInner}>
        <div className={c.footerGrid}>
          {/* About */}
          <section>
            <h3 className={c.footerH}>About</h3>
            <p className={c.footerText}>
              <span className={c.footerBrand}>GearForge</span> is a World of Warcraft gearing
              assistant. Paste your SimC export to see upgrade recommendations.
            </p>
            <ul className={c.footerList}>
              <li className={c.footerListItem}>
                <span className={c.footerBullet} aria-hidden="true">•</span>
                <span>Upgrade planner: track &amp; rank, crest/FS cost, optimized path</span>
              </li>
              <li className={c.footerListItem}>
                <span className={c.footerBullet} aria-hidden="true">•</span>
                <span>Free to use while in active development</span>
              </li>
            </ul>
          </section>

          {/* Quick Links */}
          <section>
            <h3 className={c.footerH}>Quick Links</h3>
            <ul className={c.footerLinks}>
              <li><Link to={LINKS.faq} className={c.footerLink}>FAQ</Link></li>
              <li><Link to={LINKS.terms} className={c.footerLink}>Terms of Service</Link></li>
              <li><Link to={LINKS.privacy} className={c.footerLink}>Privacy Policy</Link></li>
            </ul>
          </section>

          {/* FAQ */}
          <section>
            <h3 className={c.footerH}>FAQ</h3>
            <div className={c.faqList}>
              <FaqItem q="What is GearForge?" a="A growing set of optimizers and analyzers to help you min-max smarter." />
              <FaqItem q="Is GearForge free?" a="Yes, during active development. Some advanced features may become premium later." />
              <FaqItem q="How do I report an issue?" a="Open an issue on the GitHub repo or send us an email." />
            </div>
          </section>
        </div>

        {/* Divider */}
        <div className={c.footerDivider} />

        {/* Bottom bar */}
        <div className={c.footerBottom}>
          <div className={c.footerLegal}>
            © {year} GearForge
            <span className={c.dot}>·</span> v{appVersion}
            <span className={c.dot}>·</span> {gitSha}
            <span className={c.dot}>·</span>
            <Link to={LINKS.terms} className={c.footerLink}>Terms</Link>
            <span className={c.dot}>·</span>
            <Link to={LINKS.privacy} className={c.footerLink}>Privacy</Link>
          </div>

          <div className={c.footerSocials} aria-label="Social links">
            {EMAIL && (
              <a href={`mailto:${EMAIL}`} className={c.footerLinkIcon}>
                <Mail className={c.icon} /> Email
              </a>
            )}
            <a href={LINKS.githubRepo} target="_blank" rel="noreferrer" className={c.footerLinkIcon}>
              <Github className={c.icon} /> GitHub Repo
            </a>
            <a href={LINKS.githubRepo} target="_blank" rel="noreferrer" className={c.footerLinkIcon}>
              <Github className={c.icon} /> Report Issue
            </a>
            <a href={LINKS.linkedin} target="_blank" rel="noreferrer" className={c.footerLinkIcon}>
              <Linkedin className={c.icon} /> LinkedIn
            </a>
            <a href={LINKS.coffee} target="_blank" rel="noreferrer" className={c.footerLinkIcon}>
              <Coffee className={c.icon} /> Buy Me a Coffee
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
